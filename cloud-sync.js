/* 陶笛失落地圖｜存檔上雲（cloud-sync.js，全域 OLMSync）
   只由 index.html 載入（遊戲各頁在它的 iframe 裡，共用同一個 localStorage）。
   做法：localStorage 仍是遊戲平常讀寫的地方；登入後這裡負責
     ① attach：決定用雲端還是這支手機的存檔（誰比較新、這支手機屬於誰），必要時把雲端存檔拉進 localStorage
     ② 之後每隔幾秒檢查 save-core.js 記的 olm_sync_ts（最後修改時間），有改就整包推到 Firestore saves/<key>
     ③ detach：換人登入前先推完，成功才清掉這支手機上的存檔（避免兄弟姊妹共用手機看到彼此的進度）
   雲端文件：saves/{key} = { data:{ 存檔鍵: 原始字串 }, ts: 最後修改毫秒 }（規則見 firestore.rules）。
   手機上的記號：olm_owner（這份存檔屬於哪位學生 key）、olm_sync_ts、olm_backup_sync（被換掉的舊存檔備份，只留一份）。
   訪客模式不呼叫 attach，只存手機。
   錯誤：attach 只有「這支手機屬於別人、又連不上雲端」時才丟 Error（code:'net'）；其他情況盡量用手機上的存檔繼續玩，背景重試。 */
(function(g){
'use strict';
/* 要上雲的鍵。新增存檔鍵時要記得加在這裡。
   不上雲：olm_save_ver／olm_backup*／olm_sync*／olm_owner（內部記號）、olm_admin_v1（後台）、ocarina_pin／ocarina_mic_off（這支手機的設定） */
var KEYS=['olm_test_v1','olm_ship_v1','olm_wk_v2','olm_arcade_v1','olm_sfx_off','olm_elf_v1','ocarina_playground_v1','olm_class_v1'];
var TS='olm_sync_ts',OWNER='olm_owner',BACKUP='olm_backup_sync';
var MAX=900000;          /* Firestore 單一文件上限約 1MB，超過就不上傳 */
var TICK=6000;           /* 每 6 秒檢查一次有沒有要上傳 */

var ctx=null,timer=null,lastPushed=0,busy=null,state='idle';

function ls(){return g.localStorage;}
function get(k){try{return ls().getItem(k);}catch(e){return null;}}
function set(k,v){try{ls().setItem(k,v);return true;}catch(e){return false;}}
function del(k){try{ls().removeItem(k);}catch(e){}}
function E(code,msg){var e=new Error(msg||code);e.code=code;return e;}
function isDenied(e){return !!e&&(e.code==='permission-denied'||e.code==='firestore/permission-denied');}
function localTs(){return parseInt(get(TS),10)||0;}
function hasLocal(){return KEYS.some(function(k){return get(k)!==null;});}

function snapshot(){var d={};KEYS.forEach(function(k){var v=get(k);if(v!==null)d[k]=v;});return d;}
function wipe(){KEYS.forEach(del);}
function apply(data,ts){
  wipe();
  KEYS.forEach(function(k){if(data&&typeof data[k]==='string')set(k,data[k]);});
  set(TS,String(ts||0));
}
function backupLocal(){
  if(!hasLocal())return;
  set(BACKUP,JSON.stringify({t:Date.now(),owner:get(OWNER)||'',ts:localTs(),data:snapshot()}));   /* 只留最近一份 */
}

function ref(){return ctx.sdk.doc(ctx.db,'saves',ctx.sid);}

/* 把目前手機上的存檔整包推上去 */
function push(){
  if(!ctx)return Promise.resolve(false);
  if(busy)return busy;
  var ts=localTs();
  if(ts&&ts===lastPushed)return Promise.resolve(true);
  var data=snapshot(),size=JSON.stringify(data).length;
  if(size>MAX){state='toobig';return Promise.resolve(false);}
  var c=ctx;
  busy=c.sdk.setDoc(ref(),{data:data,ts:ts||Date.now()}).then(function(){
    if(ctx===c){lastPushed=ts;state='ok';}return true;
  },function(e){
    state=isDenied(e)?'denied':'offline';return false;
  }).then(function(r){busy=null;return r;});
  return busy;
}
function tick(){
  if(!ctx)return;
  var ts=localTs();
  if(ts&&ts!==lastPushed)push();
}
function onHide(){if(ctx&&localTs()!==lastPushed)push();}

function start(){
  stop();
  timer=setInterval(tick,TICK);
  g.addEventListener('pagehide',onHide);
  g.addEventListener('storage',tick);
  g.document.addEventListener('visibilitychange',function(){if(g.document.visibilityState==='hidden')onHide();});
}
function stop(){
  if(timer){clearInterval(timer);timer=null;}
  g.removeEventListener('pagehide',onHide);
  g.removeEventListener('storage',tick);
}

var api={
  KEYS:KEYS,
  state:function(){return state;},
  /* svc：OLMStudent.service() 的結果；me：{sid,name}。回傳 {mode}：pulled／pushed／kept／fresh／offline */
  attach:function(svc,me){
    ctx={sdk:svc.sdk,db:svc.db,sid:me.sid};lastPushed=0;busy=null;
    var sid=me.sid,owner=get(OWNER),mine=(owner===sid);
    return ctx.sdk.getDoc(ref()).then(function(snap){
      var cloud=snap.exists()?snap.data():null;
      var mode;
      if(cloud&&cloud.data){
        if(mine&&localTs()>(cloud.ts||0)){mode='pushed';}                  /* 這支手機上的比較新（離線時玩的） */
        else{if(!mine)backupLocal();apply(cloud.data,cloud.ts);mode='pulled';}
      }else{
        if(mine||(!owner&&hasLocal())){mode='pushed';}                       /* 雲端還沒有：第一次登入，沿用這支手機上的訪客／舊進度 */
        else{backupLocal();wipe();set(TS,'0');mode='fresh';}               /* 這支手機屬於別人：從頭開始 */
      }
      set(OWNER,sid);
      if(mode==='pulled')lastPushed=localTs();
      state='ok';start();
      if(mode==='pushed')return push().then(function(){return {mode:mode};});
      return {mode:mode};
    },function(e){
      if(mine){state='offline';start();return {mode:'offline'};}            /* 連不上雲端，但這份本來就是他的：先玩，背景再試 */
      ctx=null;throw E(isDenied(e)?'denied':'net');
    });
  },
  /* 換人登入前：推完才清掉這支手機上的存檔。回傳 true＝已清；false＝沒推成（沒清，也不該換人） */
  detach:function(clearLocal){
    if(!ctx){stop();return Promise.resolve(true);}
    var done=function(ok){
      if(!ok)return false;
      stop();ctx=null;
      if(clearLocal){wipe();del(OWNER);del(TS);}
      state='idle';return true;
    };
    if(localTs()===lastPushed||!hasLocal())return Promise.resolve(done(true));
    return push().then(done);
  },
  /* 手動立刻推一次（測試用） */
  flush:function(){return push();}
};
g.OLMSync=api;
})(window);
