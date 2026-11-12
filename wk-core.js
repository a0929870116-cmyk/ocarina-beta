/* 陶笛失落地圖｜每週任務共用核心（wk-core.js）
   任務清單、權重、星星糖分配、元素（水晶碎片）掉落、週界與存檔 olm_wk_v2。
   給：weekly-practice.html（基本指法）、song-practice.html（歌曲任務）、game-test.html（任務清單畫面）共用，
   避免三份各寫一套規則。規則來源：《每週練習_最新版》＋《分段練習併入每週任務_決議》。 */
(function(g){
'use strict';
/* 任務清單（測試版寫死；歌名、小節範圍、T 之後由老師／Firebase 後台指定）。
   type：'drill'＝教材（weekly-practice.html）；'song'＝歌曲＋小節範圍（song-practice.html?task=）
   順序＝優先順序（任務一最優先）；mock:true＝內容是模擬假資料，畫面會標示。 */
const DEFAULT_TASKS=[
  {id:'basic-1-1',type:'drill',name:'基本指法 1-1',T:20},
  {id:'song-pig',type:'song',name:'豬之歌',song:'pig',from:1,to:4,T:20,mock:true}
];
/* 後台任務（11/12）：已登入且老師有指派時，改用 cloud-tasks.js 存在手機的 olm_tasks_v1（任務內的 song／from／to／speed 決定內容，不從 id 推）；
   沒登入（訪客）→ 用上面的預設任務；已登入但老師還沒指派（或讀不到、快取不是自己的）→ 空清單，畫面顯示「待老師指派任務」（11/12 使用者決定）。TASKS 是同一個陣列物件，原地換內容（各頁手上的參照不會失效）。 */
const TASKS=[];
function cloudTasks(){
  try{
    const sid=sessionStorage.getItem('olm_live_sid');if(!sid)return null;   /* 訪客：用預設任務 */
    const c=OLMSave.read('olm_tasks_v1');
    if(c.sid!==sid||!Array.isArray(c.tasks))return [];   /* 已登入但沒有自己的快取：待老師指派 */
    return c.tasks;
  }catch(e){return null;}
}
function applyTasks(){
  const src=cloudTasks()||DEFAULT_TASKS;   /* 陣列（可為空）＝已登入；null＝訪客 */
  TASKS.length=0;src.forEach(t=>TASKS.push(Object.assign({},t)));
}
applyTasks();
const BUDGET=20,NEED_STAR=40,WK='olm_wk_v2';
const ELEM_ON=true;   /* 11/12 20:5x 使用者決定：每週任務恢復掉水晶碎片（先前 11/12 早上曾停用，關掉改 false） */
const ELEM_EVERY=2,ELEM_CAP=10;   /* 超過目標的全對，每 ELEM_EVERY 次掉 1 個，每週所有任務合計上限 ELEM_CAP */

/* 權重：三個任務以內一律相同；超過三個時任務一最高、依序遞減 1、0.8、0.6、0.4、0.2（使用者 11/11 定案） */
function weightOf(i,n){return n>3?Math.max(0.2,1-0.2*i):1;}
function weights(){const n=TASKS.length;return TASKS.map((t,i)=>weightOf(i,n)*(t.weight||1));}
function qList(){const w=weights(),s=w.reduce((a,b)=>a+b,0);return w.map(x=>BUDGET*x/s);}   /* 各任務的星星糖份額 Q */
function qOf(t){return qList()[TASKS.indexOf(t)];}
function waiting(){return TASKS.length===0;}   /* 已登入但老師還沒指派任務 */
function taskById(id){return TASKS.find(t=>t.id===id)||null;}
function taskUrl(t){return t.type==='song'?'song-practice.html?task='+encodeURIComponent(t.id):'weekly-practice.html?task='+encodeURIComponent(t.id);}
function taskLabel(t){return t.type==='song'?t.name+'（第 '+t.from+'–'+t.to+' 小節）':t.name;}

/* 週界：從這位學生開始的那天起算，每 7 天一週（台北時間 UTC+8），兩週一座島 */
function todayKey(){return new Date(Date.now()+8*3600e3).toISOString().slice(0,10);}
function weekIdx(start){return Math.max(0,Math.floor((Date.parse(todayKey()+'T00:00:00Z')-Date.parse(start+'T00:00:00Z'))/864e5/7));}
function earned(o){const q=qList();let x=0;TASKS.forEach((t,i)=>{x+=Math.min((o.tasks[t.id]||0)/t.T,1)*q[i];});return Math.floor(x+1e-9);}
function overflow(o){let x=0;TASKS.forEach(t=>{x+=Math.max(0,(o.tasks[t.id]||0)-t.T);});return x;}
function elemEarned(o){if(!ELEM_ON)return 0;return Math.min(ELEM_CAP,Math.floor(overflow(o)/ELEM_EVERY));}
function load(){
  let o=OLMSave.read(WK);if(!Object.keys(o).length)o=null;
  let prev=0;
  if(!o||o.v!==2){
    let old=OLMSave.read(OLMSave.K.OLDWK);if(!Object.keys(old).length)old=null;
    o={v:2,start:todayKey(),week:0,played:(old&&old.done|0)||0,total:(old&&old.perfect|0)||0,tasks:{},given:0};
    TASKS.forEach(t=>{o.tasks[t.id]=0;});
    if(old&&old.perfect&&TASKS[0])o.tasks[TASKS[0].id]=old.perfect|0;
    o.given=earned(o);o.elem=elemEarned(o);o.bag=0;
  }else{
    if(typeof o.week==='string'){o.start=o.week;o.week=0;}
    if(!o.start)o.start=todayKey();
    prev=o.week|0;
  }
  const idx=weekIdx(o.start);
  if(prev!==idx){o.tasks={};o.given=0;o.elem=0;}
  o.week=idx;
  if(!o.tasks||typeof o.tasks!=='object')o.tasks={};
  TASKS.forEach(t=>{if(typeof o.tasks[t.id]!=='number')o.tasks[t.id]=0;});
  if(typeof o.given!=='number')o.given=0;
  if(typeof o.bag!=='number')o.bag=0;
  if(typeof o.elem!=='number')o.elem=elemEarned(o);
  OLMSave.patch(WK,function(d){Object.assign(d,o);});
  return o;
}
let P=load();
function save(){OLMSave.patch(WK,function(d){Object.assign(d,P);});}
function reload(){applyTasks();P=load();return P;}

/* 元素種類：每島一種，依「目前練習的島」掉落（要和 ship-workshop.html 的元素順序一致） */
const ISLE_ELEM=[['stardust','星塵'],['moonwater','月光水'],['rainbow','彩虹絲'],['cloud','雲絮'],['glowdew','螢光露'],['lantern','燈籠火'],['core','星核砂'],['seaglass','海玻璃'],['note','音符晶'],['aurora','極光冰'],['peak','星峰石'],['ruby','城堡紅玉']];
function addTypedElem(n){
  let name='';
  OLMSave.patch(OLMSave.K.SHIP,function(o){
    const isle=(o.isle>=1&&o.isle<=12)?o.isle:4,e=ISLE_ELEM[isle-1];
    o.el=o.el||{};o.el[e[0]]=(o.el[e[0]]|0)+n;o.isle=isle;name=e[1];
  });
  return name;
}
/* 「有效吹奏」一次（有吹完、不論全對與否）：計入總共吹了幾次 */
function recordPlayed(){P.played=(P.played|0)+1;save();}
/* 全對一次：記該任務次數、算本週該拿幾顆、把新增的加進遊戲頁存檔（olm_test_v1 的 jar，上限 NEED_STAR）。回傳畫面提示 */
function recordPerfect(taskId){try{
  const TASK=taskById(taskId);if(!TASK)return '';
  P.tasks[taskId]=(P.tasks[taskId]|0)+1;P.total=(P.total|0)+1;
  const delta=earned(P)-P.given;
  const o=OLMSave.read(OLMSave.K.TEST);if(o.succ==null)o.succ=12;if(o.jar==null)o.jar=9;
  o.succ=(o.succ|0)+1;
  if(delta>0){P.given+=delta;o.jar=Math.min(NEED_STAR*2-1,(o.jar|0)+delta);   /* 上限放到 79：罐滿後多的星星糖留著，回遊戲頁開島時結算 */}
  const ed=elemEarned(P)-P.elem;
  let ename='';
  if(ed>0){P.elem+=ed;P.bag=(P.bag|0)+ed;ename=addTypedElem(ed);}
  OLMSave.patch(OLMSave.K.TEST,function(d){d.succ=o.succ;d.jar=o.jar;});
  save();
  const full=(o.jar|0)>=NEED_STAR;
  const em=ELEM_ON?' 本週水晶碎片 '+P.elem+'／'+ELEM_CAP:'';
  if(ed>0)return '（獲得「'+ename+'」×'+ed+'！'+em+(delta>0?'，另 +'+delta+' 星星糖':'')+'）';
  if(delta>0)return '（+'+delta+' 星星糖，本週已拿 '+P.given+'／'+BUDGET+(full?'，星星罐滿了':'')+'）';
  if(overflow(P)>0){
    if(!ELEM_ON)return '（星星糖本週拿滿了，次數照算）';
    if(P.elem>=ELEM_CAP)return '（本週水晶碎片拿滿了（'+ELEM_CAP+' 個），次數照算）';
    return '（星星糖本週拿滿了；再 '+(ELEM_EVERY-overflow(P)%ELEM_EVERY)+' 次全對掉 1 顆水晶碎片，'+em.trim()+'）';
  }
  if(P.tasks[taskId]>=TASK.T)return '（這個任務的星星糖本週拿滿了，次數照算）';
  return '（本週星星糖 '+P.given+'／'+BUDGET+'）';
}catch(e){return '';}}

/* 練習紀錄（給後台「練習進度與錯誤熱點」）：每次有效吹奏（有吹完）一筆彙總，排進手機佇列 olm_logq_v1，由首頁的 cloud-tasks.js 送上雲端。
   只有「已登入」的分頁（sessionStorage 有 olm_live_sid）才記，訪客不記；失敗不影響遊玩。格式同 admin-data.js：{sid,ts,task,perfect,errs:[{bar,k,c}]} */
function errsFrom(res,barOf){
  const out=[];
  try{(res||[]).forEach((r,i)=>{
    const bar=barOf(r,i)|0;
    if(r.miss){out.push({bar,k:'miss'});return;}
    if(r.pitch==='high'||r.pitch==='low')out.push({bar,k:r.pitch,c:Math.round(r.cents)});
    else if(r.pitch==='wrong')out.push({bar,k:'wrong'});
    if(r.timing==='early'||r.timing==='late')out.push({bar,k:r.timing});
  });}catch(e){}
  return out.slice(0,100);
}
function recordLog(taskId,perfect,errs){
  try{
    const sid=sessionStorage.getItem('olm_live_sid');if(!sid)return false;
    let q=[];try{q=JSON.parse(OLMSave.raw.get('olm_logq_v1')||'[]');if(!Array.isArray(q))q=[];}catch(e){q=[];}
    q.push({id:'l'+Date.now().toString(36)+Math.random().toString(36).slice(2,8),sid,ts:new Date().toISOString(),task:String(taskId),perfect:!!perfect,errs:Array.isArray(errs)?errs.slice(0,100):[]});
    if(q.length>200)q=q.slice(q.length-200);
    return OLMSave.raw.set('olm_logq_v1',JSON.stringify(q));
  }catch(e){return false;}
}

g.OLM_WK={TASKS,BUDGET,NEED_STAR,WK,ELEM_EVERY,ELEM_CAP,weightOf,weights,qList,qOf,taskById,taskUrl,taskLabel,
  todayKey,weekIdx,earned,overflow,elemEarned,load,save,reload,recordPlayed,recordPerfect,addTypedElem,recordLog,errsFrom,applyTasks,waiting,
  get P(){return P;}};
})(window);
