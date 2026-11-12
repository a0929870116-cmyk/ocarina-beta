/* 陶笛失落地圖｜後台任務與練習紀錄（cloud-tasks.js，全域 OLMTasks）
   只由 index.html 載入（遊戲各頁在它的 iframe 裡，共用同一個 localStorage／sessionStorage），遊戲各頁不必自己連 Firebase。
   ① attach：登入後讀 tasks/<key>（老師在後台指派的每週任務），整理後存進手機 olm_tasks_v1 = {sid, tasks:[…], updated, fetched}；
      wk-core.js 讀這份快取當任務清單（沒有快取或沒指派 → 用 wk-core 內建的預設任務）。
      同時在 sessionStorage 記 olm_live_sid（目前登入的學生 key）：只有「已登入」的分頁才會記練習紀錄，訪客不記。
   ② 練習紀錄：遊戲頁（wk-core.js 的 recordLog）把每次練習彙總排進手機佇列 olm_logq_v1，這裡每 10 秒、離開頁面時、
      換人登入前，把屬於目前學生的紀錄寫到 logs/<隨機 id>。寫入成功就從佇列移除；連不上就留著下次再試；
      被規則拒絕（denied）的視為永遠寫不進去，直接丟掉（也涵蓋「上次其實寫成功、只是回應沒收到」）。
   ③ detach：換人登入前先送完紀錄，再清掉任務快取與登入記號。
   紀錄格式與規則見 firestore.rules、admin-data.js：{sid, ts(ISO), task, perfect, errs:[{bar,k,c}]}（寫進雲端的文件不含佇列用的 id）。
   所有函式都不會讓登入流程失敗：attach／detach 一律 resolve。 */
(function(g){
'use strict';
var CACHE='olm_tasks_v1',QUEUE='olm_logq_v1',LIVE='olm_live_sid';
var TICK=10000,REFRESH=60000,WAIT=4000,MAXQ=200;
var ctx=null,timer=null,flushing=null,lastFetch=0;

function ls(){return g.localStorage;}
function get(k){try{return ls().getItem(k);}catch(e){return null;}}
function set(k,v){try{ls().setItem(k,v);return true;}catch(e){return false;}}
function del(k){try{ls().removeItem(k);}catch(e){}}
function isDenied(e){return !!e&&(e.code==='permission-denied'||e.code==='firestore/permission-denied');}
function readQ(){try{var a=JSON.parse(get(QUEUE)||'[]');return Array.isArray(a)?a:[];}catch(e){return [];}}
function writeQ(a){if(a.length>MAXQ)a=a.slice(a.length-MAXQ);if(a.length)set(QUEUE,JSON.stringify(a));else del(QUEUE);}

/* 老師指派的任務 → 遊戲用的任務（欄位同 wk-core.js 的 TASKS；不合格的丟掉，最多 5 個） */
function int(v,lo,hi){v=Math.floor(Number(v));return (v>=lo&&v<=hi)?v:null;}
function cleanTasks(arr){
  var out=[],seen={};
  (Array.isArray(arr)?arr:[]).forEach(function(t){
    if(!t||out.length>=5)return;
    var id=String(t.id==null?'':t.id).slice(0,40),type=t.type,T=int(t.T,1,99);
    if(!id||seen[id]||(type!=='drill'&&type!=='song')||T===null)return;
    var o={id:id,type:type,name:String(t.name||id).slice(0,40),T:T};
    if(type==='song'){
      var f=int(t.from,1,99),e=int(t.to,1,99),sg=String(t.song||'').slice(0,20);
      if(!sg||f===null||e===null||e<f)return;
      o.song=sg;o.from=f;o.to=e;
    }
    var sp=int(t.speed,30,200);if(sp!==null)o.speed=sp;
    seen[id]=1;out.push(o);
  });
  return out;
}

function fetchTasks(force){
  if(!ctx)return Promise.resolve(false);
  var now=Date.now();
  if(!force&&now-lastFetch<REFRESH)return Promise.resolve(false);
  lastFetch=now;
  var c=ctx;
  return c.sdk.getDoc(c.sdk.doc(c.db,'tasks',c.sid)).then(function(snap){
    if(ctx!==c)return false;
    var d=snap.exists()?snap.data():null;
    set(CACHE,JSON.stringify({sid:c.sid,tasks:cleanTasks(d&&d.tasks),updated:(d&&d.updated)||'',fetched:Date.now()}));
    return true;
  },function(){lastFetch=0;return false;});   /* 連不上：保留舊快取，下次再試 */
}

/* 把屬於目前學生的紀錄寫上去 */
function flush(){
  if(!ctx)return Promise.resolve(0);
  if(flushing)return flushing;
  var c=ctx,q=readQ(),mine=q.filter(function(x){return x&&x.sid===c.sid&&x.id;});
  if(!mine.length)return Promise.resolve(0);
  var sent=0;
  function removeId(id){writeQ(readQ().filter(function(x){return !x||x.id!==id;}));}
  function step(i){
    if(i>=mine.length||ctx!==c)return Promise.resolve();
    var x=mine[i],doc={sid:x.sid,ts:String(x.ts||''),task:String(x.task||''),perfect:!!x.perfect,errs:Array.isArray(x.errs)?x.errs.slice(0,100):[]};
    return c.sdk.setDoc(c.sdk.doc(c.db,'logs',x.id),doc).then(function(){sent++;removeId(x.id);return step(i+1);},function(e){
      if(isDenied(e)){removeId(x.id);return step(i+1);}   /* 永遠寫不進去（或其實已寫入）：丟掉，繼續下一筆 */
      /* 連不上：停下來，剩下的留著 */
    });
  }
  flushing=step(0).then(function(){flushing=null;return sent;},function(){flushing=null;return sent;});
  return flushing;
}

function tick(){
  if(!ctx)return;
  flush();
  if(g.document&&g.document.visibilityState==='visible')fetchTasks(false);
}
function onHide(){if(ctx)flush();}
function onVis(){if(!g.document)return;if(g.document.visibilityState==='hidden')onHide();else tick();}
function start(){
  stop();
  timer=setInterval(tick,TICK);
  g.addEventListener('pagehide',onHide);
  if(g.document)g.document.addEventListener('visibilitychange',onVis);
}
function stop(){
  if(timer){clearInterval(timer);timer=null;}
  g.removeEventListener('pagehide',onHide);
  if(g.document)g.document.removeEventListener('visibilitychange',onVis);
}
function timeout(ms){return new Promise(function(res){setTimeout(res,ms);});}

g.OLMTasks={
  KEYS:{CACHE:CACHE,QUEUE:QUEUE,LIVE:LIVE},
  cleanTasks:cleanTasks,
  /* svc：OLMStudent.service() 的結果；me：{sid,name}。最多等 4 秒讀任務（讀不到就用舊快取或預設，背景繼續更新）。永遠 resolve */
  attach:function(svc,me){
    try{
      ctx={sdk:svc.sdk,db:svc.db,sid:me.sid};lastFetch=0;
      try{g.sessionStorage.setItem(LIVE,me.sid);}catch(e){}
      start();
      return Promise.race([fetchTasks(true),timeout(WAIT)]).then(function(){flush();return true;},function(){return false;});
    }catch(e){return Promise.resolve(false);}
  },
  /* 換人登入前：把紀錄送完（送不完也不擋），清任務快取與登入記號 */
  detach:function(){
    var c=ctx;
    return (c?Promise.race([flush(),timeout(WAIT)]):Promise.resolve()).catch(function(){}).then(function(){
      stop();ctx=null;
      del(CACHE);
      try{g.sessionStorage.removeItem(LIVE);}catch(e){}
      return true;
    });
  },
  flush:flush,
  refresh:function(){return fetchTasks(true);}
};
})(window);
