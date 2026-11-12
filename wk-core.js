/* 陶笛失落地圖｜每週任務共用核心（wk-core.js）
   任務清單、權重、星星糖分配、元素（水晶碎片）掉落、週界與存檔 olm_wk_v2。
   給：weekly-practice.html（基本指法）、song-practice.html（歌曲任務）、game-test.html（任務清單畫面）共用，
   避免三份各寫一套規則。規則來源：《每週練習_最新版》＋《分段練習併入每週任務_決議》。 */
(function(g){
'use strict';
/* 任務清單（測試版寫死；歌名、小節範圍、T 之後由老師／Firebase 後台指定）。
   type：'drill'＝教材（weekly-practice.html）；'song'＝歌曲＋小節範圍（song-practice.html?task=）
   順序＝優先順序（任務一最優先）；mock:true＝內容是模擬假資料，畫面會標示。 */
const TASKS=[
  {id:'basic-1-1',type:'drill',name:'基本指法 1-1',T:20},
  {id:'song-pig',type:'song',name:'豬之歌',song:'pig',from:1,to:4,T:20,mock:true}
];
const BUDGET=20,NEED_STAR=40,WK='olm_wk_v2';
const ELEM_ON=false;   /* 11/12 使用者決定：每週練習先停止掉水晶碎片（碎片只從星空試煉掉）；要恢復改成 true */
const ELEM_EVERY=2,ELEM_CAP=10;   /* 超過目標的全對，每 ELEM_EVERY 次掉 1 個，每週所有任務合計上限 ELEM_CAP */

/* 權重：三個任務以內一律相同；超過三個時任務一最高、依序遞減 1、0.8、0.6、0.4、0.2（使用者 11/11 定案） */
function weightOf(i,n){return n>3?Math.max(0.2,1-0.2*i):1;}
function weights(){const n=TASKS.length;return TASKS.map((t,i)=>weightOf(i,n)*(t.weight||1));}
function qList(){const w=weights(),s=w.reduce((a,b)=>a+b,0);return w.map(x=>BUDGET*x/s);}   /* 各任務的星星糖份額 Q */
function qOf(t){return qList()[TASKS.indexOf(t)];}
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
    if(old&&old.perfect)o.tasks[TASKS[0].id]=old.perfect|0;
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
function reload(){P=load();return P;}

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
  const em=ELEM_ON?' 本週元素 '+P.elem+'／'+ELEM_CAP:'';
  if(ed>0)return '（獲得「'+ename+'」×'+ed+'！'+em+(delta>0?'，另 +'+delta+' 星星糖':'')+'）';
  if(delta>0)return '（+'+delta+' 星星糖，本週已拿 '+P.given+'／'+BUDGET+(full?'，星星罐滿了':'')+'）';
  if(overflow(P)>0){
    if(!ELEM_ON)return '（星星糖本週拿滿了，次數照算）';
    if(P.elem>=ELEM_CAP)return '（本週元素拿滿了（'+ELEM_CAP+' 個），次數照算）';
    return '（星星糖本週拿滿了；再 '+(ELEM_EVERY-overflow(P)%ELEM_EVERY)+' 次全對掉 1 個元素，'+em.trim()+'）';
  }
  if(P.tasks[taskId]>=TASK.T)return '（這個任務的星星糖本週拿滿了，次數照算）';
  return '（本週星星糖 '+P.given+'／'+BUDGET+'）';
}catch(e){return '';}}

g.OLM_WK={TASKS,BUDGET,NEED_STAR,WK,ELEM_EVERY,ELEM_CAP,weightOf,weights,qList,qOf,taskById,taskUrl,taskLabel,
  todayKey,weekIdx,earned,overflow,elemEarned,load,save,reload,recordPlayed,recordPerfect,addTypedElem,
  get P(){return P;}};
})(window);
