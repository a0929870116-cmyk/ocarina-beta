/* 陶笛失落地圖｜後台資料層（admin-data.js）
   目前是「不連線骨架」：資料存在這台瀏覽器的 localStorage（鍵 olm_admin_v1），只有後台頁會碰這個鍵。
   所有函式一律回傳 Promise，之後接 Firebase（Firestore）時只換掉這個檔，admin.html 不用改。

   資料格式
   students: [{id, name, school1, note, start, ack, created}]
     name   真實姓名；school1 學校第一個字（只有同名時才需要）；start 該生開始日 YYYY-MM-DD（週界起算，與 wk-core.js 同規則）
     ack    註冊時「家長知悉」已勾選；created 建立時間
   tasks: { 學生id: {tasks:[{id,type,name,song,from,to,T,speed}], updated} }
     type 'drill'（教材，weekly-practice.html）或 'song'（歌曲＋小節範圍，song-practice.html）；欄位同 wk-core.js 的 TASKS
     speed 為選填（BPM），遊戲端尚未讀取
   logs: [{id, sid, ts, task, perfect, errs:[{bar, k, c}]}]
     一次練習一筆彙總；errs 只記錯的音：bar＝歌曲為小節號、教材為第幾個音；k＝high|low|wrong|miss|early|late；c＝音分（選填）
   mock: true 代表目前資料含模擬資料（可一鍵清除） */
(function(g){
'use strict';
var KEY='olm_admin_v1';
var DEMO_PREFIX='demo-';

function load(){
  try{var s=localStorage.getItem(KEY);if(s){var o=JSON.parse(s);if(o&&typeof o==='object')return fix(o);}}catch(e){}
  return fix({});
}
function fix(o){
  if(!Array.isArray(o.students))o.students=[];
  if(!o.tasks||typeof o.tasks!=='object'||Array.isArray(o.tasks))o.tasks={};
  if(!Array.isArray(o.logs))o.logs=[];
  o.mock=!!o.mock;
  return o;
}
function save(o){try{localStorage.setItem(KEY,JSON.stringify(o));return true;}catch(e){return false;}}
function uid(p){return p+Date.now().toString(36)+Math.random().toString(36).slice(2,6);}
function ok(v){return Promise.resolve(v);}
function fail(m){return Promise.reject(new Error(m));}
function todayKey(){return new Date(Date.now()+8*3600e3).toISOString().slice(0,10);}
function dayKeyOf(ts){return new Date(Date.parse(ts)+8*3600e3).toISOString().slice(0,10);}

/* 顯示名稱：同名時，姓名後面加學校第一個字（例：王小明北） */
function displayNames(students){
  var cnt={};students.forEach(function(s){cnt[s.name]=(cnt[s.name]||0)+1;});
  var m={};students.forEach(function(s){m[s.id]=cnt[s.name]>1&&s.school1?s.name+s.school1:s.name;});
  return m;
}

var Store={
  mode:'local',
  todayKey:todayKey,dayKeyOf:dayKeyOf,displayNames:displayNames,

  all:function(){return ok(load());},
  /* ---- 學生 ---- */
  addStudent:function(d){
    var o=load(),name=(d.name||'').trim(),sc=(d.school1||'').trim().slice(0,1);
    if(!name)return fail('請輸入姓名');
    var same=o.students.filter(function(s){return s.name===name;});
    if(same.length){
      if(!sc)return fail('已有同名學生「'+name+'」，請填學校第一個字');
      var noSc=same.filter(function(s){return !s.school1;});
      if(noSc.length)return fail('已有同名學生「'+name+'」但沒填學校第一個字，請先到名單補上，再新增這位');
      if(same.some(function(s){return s.school1===sc;}))return fail('「'+name+sc+'」已存在');
    }
    var s={id:uid('s-'),name:name,school1:sc,note:(d.note||'').trim(),start:d.start||todayKey(),ack:!!d.ack,created:new Date().toISOString()};
    o.students.push(s);save(o);return ok(s);
  },
  updateStudent:function(id,d){
    var o=load(),s=o.students.filter(function(x){return x.id===id;})[0];
    if(!s)return fail('找不到學生');
    var name=d.name!=null?String(d.name).trim():s.name,sc=d.school1!=null?String(d.school1).trim().slice(0,1):s.school1;
    if(!name)return fail('姓名不能空白');
    var same=o.students.filter(function(x){return x.id!==id&&x.name===name;});
    if(same.length&&!sc)return fail('同名學生需要學校第一個字');
    if(same.some(function(x){return x.school1===sc;}))return fail('「'+name+sc+'」已存在');
    s.name=name;s.school1=sc;
    if(d.note!=null)s.note=String(d.note).trim();
    if(d.start)s.start=d.start;
    save(o);return ok(s);
  },
  /* 刪除學生：連同任務與練習紀錄一併刪（家長要求刪除資料時用） */
  removeStudent:function(id){
    var o=load();
    o.students=o.students.filter(function(s){return s.id!==id;});
    delete o.tasks[id];
    o.logs=o.logs.filter(function(l){return l.sid!==id;});
    save(o);return ok(true);
  },
  /* ---- 每週任務 ---- */
  setTasks:function(ids,tasks){
    if(!Array.isArray(tasks)||tasks.length<1||tasks.length>5)return fail('每週任務要 1～5 個');
    var o=load(),t=new Date().toISOString();
    ids.forEach(function(id){
      if(!o.students.some(function(s){return s.id===id;}))return;
      o.tasks[id]={tasks:JSON.parse(JSON.stringify(tasks)),updated:t};
    });
    save(o);return ok(ids.length);
  },
  clearTasks:function(ids){var o=load();ids.forEach(function(id){delete o.tasks[id];});save(o);return ok(true);},
  /* ---- 練習紀錄（遊戲端接 Firebase 後寫入；骨架版只有模擬資料） ---- */
  addLog:function(l){var o=load();l.id=l.id||uid('l-');o.logs.push(l);save(o);return ok(l);},
  /* ---- 備份／模擬資料 ---- */
  exportJSON:function(){return ok(JSON.stringify(load(),null,1));},
  importJSON:function(txt){
    var o;try{o=JSON.parse(txt);}catch(e){return fail('不是有效的 JSON');}
    if(!o||typeof o!=='object'||!Array.isArray(o.students))return fail('格式不對：缺少 students');
    save(fix(o));return ok(true);
  },
  clearAll:function(){save(fix({}));return ok(true);},
  clearDemo:function(){
    var o=load();
    o.students=o.students.filter(function(s){return s.id.indexOf(DEMO_PREFIX)!==0;});
    Object.keys(o.tasks).forEach(function(k){if(k.indexOf(DEMO_PREFIX)===0)delete o.tasks[k];});
    o.logs=o.logs.filter(function(l){return l.sid.indexOf(DEMO_PREFIX)!==0;});
    o.mock=false;save(o);return ok(true);
  },
  /* 產生模擬資料：n 位學生、近 4 週的練習紀錄（含一組同名同姓）。錯誤集中在幾個「熱點」小節，方便看熱點功能 */
  seedDemo:function(n){
    n=Math.max(1,Math.min(n||20,40));
    var o=load();
    var names=['王小明','林美玲','陳大文','張語彤','李承恩','黃詩涵','吳宥辰','劉芷瑜','蔡宗翰','楊雅婷','許家豪','鄭婉如','謝柏翰','洪佩珊','邱冠宇','曾怡君','廖偉倫','賴思妤','徐子軒','王小明','簡于晴','周品妍','葉泰安','江家瑜','蘇哲豪','潘羽彤','何俊賢','古心怡','施冠廷','方筱涵'];
    var schools=['北','南'];
    var rnd=(function(seed){return function(){seed=(seed*16807)%2147483647;return (seed-1)/2147483646;};})(20261112);
    var today=Date.parse(todayKey()+'T00:00:00Z');
    var songHot=[3,4,9,10,15,16];
    for(var i=0;i<n;i++){
      var nm=names[i%names.length],sid=DEMO_PREFIX+(i+1);
      var dup=nm==='王小明';
      var start=new Date(today-(14+Math.floor(rnd()*14))*864e5).toISOString().slice(0,10);
      o.students.push({id:sid,name:nm,school1:dup?schools[i%2]:'',note:i%7===0?'模擬資料：會一起練習的組員':'模擬資料',start:start,ack:true,created:new Date().toISOString()});
      var tasks=[{id:'basic-1-1',type:'drill',name:'基本指法 1-1',T:20},{id:'song-pig',type:'song',name:'豬之歌',song:'pig',from:1,to:4,T:20}];
      if(i%5===0)tasks[1]={id:'song-star',type:'song',name:'數星星',song:'star',from:1,to:8,T:15};
      o.tasks[sid]={tasks:tasks,updated:new Date().toISOString()};
      var diligence=0.15+rnd()*0.85;   /* 0.15～1：越高練越勤 */
      for(var d=27;d>=0;d--){
        if(rnd()>diligence*0.8)continue;
        var tries=1+Math.floor(rnd()*4*diligence+1);
        for(var k=0;k<tries;k++){
          var tk=tasks[rnd()<0.5?0:1];
          var perfect=rnd()<0.25+diligence*0.45-d*0.004;
          var errs=[];
          if(!perfect){
            var ne=1+Math.floor(rnd()*3);
            for(var e=0;e<ne;e++){
              var bar=tk.type==='song'?(rnd()<0.6?songHot[Math.floor(rnd()*songHot.length)]%(tk.to)+1:1+Math.floor(rnd()*tk.to)):(rnd()<0.6?[5,6,12,13][Math.floor(rnd()*4)]:1+Math.floor(rnd()*16));
              var kinds=['high','low','wrong','miss','early','late'];
              var kd=kinds[Math.floor(rnd()*kinds.length)];
              errs.push({bar:bar,k:kd,c:(kd==='high'||kd==='low')?Math.round(20+rnd()*45)*(kd==='low'?-1:1):undefined});
            }
          }
          var ts=new Date(today-d*864e5+(10+Math.floor(rnd()*11))*3600e3-8*3600e3+k*60e3).toISOString();
          o.logs.push({id:uid('l-'),sid:sid,ts:ts,task:tk.id,perfect:perfect,errs:errs});
        }
      }
    }
    o.mock=true;save(o);return ok(n);
  }
};
g.OLMAdmin=Store;
})(window);
