/* 陶笛失落地圖｜後台資料層（admin-data.js）
   兩種模式，API 完全相同（全部回傳 Promise），admin.html 不必分辨：
   · local（預設，網址加 ?local=1 也是）：資料存在這台瀏覽器 localStorage（鍵 olm_admin_v1），不需登入，用來看畫面、產生模擬資料。
   · cloud：資料存在 Firebase Firestore（集合 students／tasks／logs），需用管理者帳號登入；安全規則見 firestore.rules。
   雲端模式的做法：登入後把三個集合一次讀進記憶體（all／refresh），驗證與計算都在記憶體做，
   每次修改只寫有變的文件（批次，每批 ≤400 筆）。想看到學生端新寫入的紀錄，按「重新整理」。

   資料格式
   students: [{id, name, school1, note, start, ack, created}]    → Firestore：students/{id}（文件內容不含 id）
     name   真實姓名；school1 校名縮寫 2～4 字（只有同名且後來加入者才需要）；start 該生開始日 YYYY-MM-DD（週界起算，與 wk-core.js 同規則）
     ack    註冊時「家長知悉」已勾選；created 建立時間
     uid    （雲端）學生登入帳號的 uid；null＝還沒註冊（或剛重設），學生用同樣名字註冊會認領。學生自己註冊的 id ＝ 名字的鑰匙，見 student-auth.js
   tasks: { 學生id: {tasks:[{id,type,name,song,from,to,T,speed}], updated} }   → Firestore：tasks/{學生id}
     type 'drill'（教材，weekly-practice.html）或 'song'（歌曲＋小節範圍，song-practice.html）；欄位同 wk-core.js 的 TASKS
     speed 為選填（BPM），遊戲端尚未讀取
   logs: [{id, sid, ts, task, perfect, errs:[{bar, k, c}]}]       → Firestore：logs/{id}（文件內容不含 id）
     一次練習一筆彙總；errs 只記錯的音：bar＝歌曲為小節號、教材為第幾個音；k＝high|low|wrong|miss|early|late；c＝音分（選填）
   mock: true 代表目前資料含模擬資料（只有 local 模式有；可一鍵清除） */
(function(g){
'use strict';
var KEY='olm_admin_v1';
var DEMO_PREFIX='demo-';
var mode='local',cloud=null,cache=null,authApi=null;

function fix(o){
  if(!Array.isArray(o.students))o.students=[];
  if(!o.tasks||typeof o.tasks!=='object'||Array.isArray(o.tasks))o.tasks={};
  if(!Array.isArray(o.logs))o.logs=[];
  o.mock=!!o.mock;
  return o;
}
/* load／save：local 讀寫 localStorage；cloud 只動記憶體（真正寫雲端靠 commit） */
function load(){
  if(mode==='cloud'){if(!cache)cache=fix({});return cache;}
  try{var s=localStorage.getItem(KEY);if(s){var o=JSON.parse(s);if(o&&typeof o==='object')return fix(o);}}catch(e){}
  return fix({});
}
function save(o){
  if(mode==='cloud'){cache=o;return true;}
  try{localStorage.setItem(KEY,JSON.stringify(o));return true;}catch(e){return false;}
}
/* commit：把這次修改的文件寫到雲端。ops＝[{t:'set',c,id,d}|{t:'del',c,id}|{t:'delLogsOf',sid}|{t:'wipe'}]
   失敗時重新讀回雲端資料（讓畫面和雲端一致），再把錯誤丟出去 */
function commit(ops){
  if(mode!=='cloud'||!ops.length)return ok(true);
  return cloud.commit(ops).then(function(){return true;},function(e){
    return cloud.load().then(function(o){cache=fix(o);throw e;},function(){throw e;});
  });
}
function strip(x){var y=JSON.parse(JSON.stringify(x));delete y.id;return y;}   /* 去掉 id、undefined（Firestore 不收 undefined） */
function uid(p){return p+Date.now().toString(36)+Math.random().toString(36).slice(2,6);}
function ok(v){return Promise.resolve(v);}
function fail(m){return Promise.reject(new Error(m));}
function todayKey(){return new Date(Date.now()+8*3600e3).toISOString().slice(0,10);}
function dayKeyOf(ts){return new Date(Date.parse(ts)+8*3600e3).toISOString().slice(0,10);}

/* 顯示名稱：同名時，姓名後面加校名縮寫（例：王小明復興） */
function displayNames(students){
  var cnt={};students.forEach(function(s){cnt[s.name]=(cnt[s.name]||0)+1;});
  var m={};students.forEach(function(s){m[s.id]=cnt[s.name]>1&&s.school1?s.name+s.school1:s.name;});
  return m;
}

/* ===== 雲端後端（Firestore）。sdk 由外面傳入，方便測試時換成假的 ===== */
function makeCloud(sdk,db){
  var COLS=['students','tasks','logs'];
  function loadCol(c){return sdk.getDocs(sdk.collection(db,c));}
  return {
    /* 密碼重設世代（gens/<key>.g）；沒有就是 0 */
    getGen:function(key){
      return sdk.getDoc(sdk.doc(db,'gens',key)).then(function(s){var d=s.exists()?s.data():null;return d&&d.g>0?(d.g|0):0;});
    },
    load:function(){
      return Promise.all(COLS.map(loadCol)).then(function(r){
        var o={students:[],tasks:{},logs:[],mock:false};
        r[0].forEach(function(d){var x=d.data();x.id=d.id;o.students.push(x);});
        r[1].forEach(function(d){o.tasks[d.id]=d.data();});
        r[2].forEach(function(d){var x=d.data();x.id=d.id;o.logs.push(x);});
        o.students.sort(function(a,b){return String(a.created||'').localeCompare(String(b.created||''));});
        o.logs.sort(function(a,b){return String(a.ts||'').localeCompare(String(b.ts||''));});
        return o;
      });
    },
    commit:function(ops){
      /* 先把 wipe、delLogsOf 展開成逐筆刪除 */
      var jobs=ops.map(function(op){
        if(op.t==='wipe'){
          return Promise.all(COLS.map(function(c){
            return loadCol(c).then(function(s){var a=[];s.forEach(function(d){a.push({t:'del',c:c,id:d.id});});return a;});
          })).then(function(r){return [].concat.apply([],r);});
        }
        if(op.t==='delLogsOf'){
          return sdk.getDocs(sdk.query(sdk.collection(db,'logs'),sdk.where('sid','==',op.sid))).then(function(s){
            var a=[];s.forEach(function(d){a.push({t:'del',c:'logs',id:d.id});});return a;
          });
        }
        return [op];
      });
      return Promise.all(jobs).then(function(r){
        var flat=[].concat.apply([],r),p=Promise.resolve();
        for(var i=0;i<flat.length;i+=400){(function(chunk){
          p=p.then(function(){
            var b=sdk.writeBatch(db);
            chunk.forEach(function(op){
              var ref=sdk.doc(db,op.c,op.id);
              if(op.t==='set')b.set(ref,op.d);else b.delete(ref);
            });
            return b.commit();
          });
        })(flat.slice(i,i+400));}
        return p;
      });
    }
  };
}

var Store={
  get mode(){return mode;},
  todayKey:todayKey,dayKeyOf:dayKeyOf,displayNames:displayNames,

  /* ---- 雲端連線 ---- */
  /* 載入 Firebase SDK（CDN）並接上 Auth＋Firestore；之後 Store.mode 變成 'cloud'。需先載入 firebase-config.js */
  connectCloud:function(){
    var F=g.OLM_FIREBASE;
    if(!F||!F.config)return fail('找不到 firebase-config.js');
    var base='https://www.gstatic.com/firebasejs/'+(F.sdkVersion||'13.3.0')+'/';
    return Promise.all([import(base+'firebase-app.js'),import(base+'firebase-auth.js'),import(base+'firebase-firestore.js')]).then(function(m){
      var app=m[0].initializeApp(F.config),au=m[1].getAuth(app),db=m[2].getFirestore(app);
      return Store._useCloud(m[2],db,{
        signIn:function(email,pw){return m[1].signInWithEmailAndPassword(au,email,pw).then(function(r){return r.user;});},
        signOut:function(){return m[1].signOut(au);},
        onChange:function(cb){return m[1].onAuthStateChanged(au,cb);}
      });
    });
  },
  /* 內部：接上指定的 SDK 函式與驗證物件（測試時傳假的） */
  _useCloud:function(sdk,db,auth){
    cloud=makeCloud(sdk,db);authApi=auth;mode='cloud';cache=null;return ok(true);
  },
  auth:{
    signIn:function(e,p){return authApi?authApi.signIn(e,p):fail('尚未連線');},
    signOut:function(){cache=null;return authApi?authApi.signOut():ok(true);},
    onChange:function(cb){return authApi?authApi.onChange(cb):function(){};}
  },
  /* 重新從雲端讀取（local 模式只是重讀 localStorage） */
  refresh:function(){
    if(mode!=='cloud')return ok(load());
    return cloud.load().then(function(o){cache=fix(o);return cache;});
  },

  all:function(){
    if(mode==='cloud'&&!cache)return Store.refresh();
    return ok(load());
  },
  /* ---- 學生 ---- */
  addStudent:function(d){
    var o=load(),name=(d.name||'').trim(),sc=(d.school1||'').trim().slice(0,4);
    if(!name)return fail('請輸入姓名');
    var same=o.students.filter(function(s){return s.name===name;});
    if(same.length){
      if(!sc)return fail('名稱已有人使用，請加上校名縮寫（2～4 字）');
      if(same.some(function(s){return s.school1===sc;}))return fail('「'+name+sc+'」已存在');
    }
    /* 雲端模式：學生 id ＝ 名字（含學校字）的鑰匙，學生之後用同樣名字註冊就會認領這一筆；本機模式用隨機 id */
    var S=g.OLMStudent,idP;
    if(mode==='cloud'){
      if(!S)return fail('缺少 student-auth.js');
      var full=S.cleanName(name+sc);
      if(full.length>16)return fail('名字加校名最多 16 個字');
      idP=S.keyOf(full);
    }else idP=ok(uid('s-'));
    return idP.then(function(id){
      if(o.students.some(function(x){return x.id===id;}))throw new Error('「'+name+sc+'」這個登入名字已經有人了（可能學生已自己註冊）');
      var s={id:id,name:name,school1:sc,note:(d.note||'').trim(),start:d.start||todayKey(),ack:!!d.ack,created:new Date().toISOString()};
      if(mode==='cloud')s.uid=null;   /* uid 空 ＝ 等學生用這個名字註冊來認領 */
      o.students.push(s);save(o);
      return commit([{t:'set',c:'students',id:s.id,d:strip(s)}]).then(function(){return s;});
    });
  },
  updateStudent:function(id,d){
    var o=load(),s=o.students.filter(function(x){return x.id===id;})[0];
    if(!s)return fail('找不到學生');
    var name=d.name!=null?String(d.name).trim():s.name,sc=d.school1!=null?String(d.school1).trim().slice(0,4):s.school1;
    if(!name)return fail('姓名不能空白');
    var same=o.students.filter(function(x){return x.id!==id&&x.name===name;});
    if(same.some(function(x){return x.school1===sc;}))return fail('「'+name+sc+'」已存在');
    s.name=name;s.school1=sc;
    if(d.note!=null)s.note=String(d.note).trim();
    if(d.start)s.start=d.start;
    save(o);
    return commit([{t:'set',c:'students',id:s.id,d:strip(s)}]).then(function(){return s;});
  },
  /* 刪除學生：連同任務與練習紀錄一併刪（家長要求刪除資料時用） */
  removeStudent:function(id){
    var o=load(),st=o.students.filter(function(s){return s.id===id;})[0];
    o.students=o.students.filter(function(s){return s.id!==id;});
    delete o.tasks[id];
    o.logs=o.logs.filter(function(l){return l.sid!==id;});
    save(o);
    var ops=[{t:'del',c:'students',id:id},{t:'del',c:'tasks',id:id},{t:'delLogsOf',sid:id}];
    /* 已註冊的學生：順便把世代 +1。雲端的登入帳號刪不掉（只能在 Firebase 控制台刪），世代 +1 之後同名的人才能重新註冊 */
    if(mode==='cloud'&&st&&st.uid){
      return cloud.getGen(id).then(function(gn){ops.push({t:'set',c:'gens',id:id,d:{g:gn+1}});return commit(ops);}).then(function(){return true;});
    }
    return commit(ops).then(function(){return true;});
  },
  /* 重設密碼：世代 +1、清掉 uid。學生用「同樣的名字」重新按「建立帳號」設新密碼，進度與任務都保留 */
  resetPassword:function(id){
    if(mode!=='cloud')return fail('本機模式沒有學生帳號，不需要重設');
    var o=load(),s=o.students.filter(function(x){return x.id===id;})[0];
    if(!s)return fail('找不到學生');
    if(!s.uid)return fail('這位學生還沒有註冊帳號，不需要重設');
    return cloud.getGen(id).then(function(gn){
      s.uid=null;save(o);
      return commit([{t:'set',c:'gens',id:id,d:{g:gn+1}},{t:'set',c:'students',id:id,d:strip(s)}]);
    }).then(function(){return true;});
  },
  /* ---- 每週任務 ---- */
  setTasks:function(ids,tasks){
    if(!Array.isArray(tasks)||tasks.length<1||tasks.length>5)return fail('每週任務要 1～5 個');
    var o=load(),t=new Date().toISOString(),ops=[];
    ids.forEach(function(id){
      if(!o.students.some(function(s){return s.id===id;}))return;
      o.tasks[id]={tasks:JSON.parse(JSON.stringify(tasks)),updated:t};
      ops.push({t:'set',c:'tasks',id:id,d:strip(o.tasks[id])});
    });
    save(o);return commit(ops).then(function(){return ids.length;});
  },
  clearTasks:function(ids){
    var o=load(),ops=[];
    ids.forEach(function(id){delete o.tasks[id];ops.push({t:'del',c:'tasks',id:id});});
    save(o);return commit(ops).then(function(){return true;});
  },
  /* ---- 練習紀錄（遊戲端接 Firebase 後寫入；骨架版只有模擬資料） ---- */
  addLog:function(l){
    var o=load();l.id=l.id||uid('l-');o.logs.push(l);save(o);
    return commit([{t:'set',c:'logs',id:l.id,d:strip(l)}]).then(function(){return l;});
  },
  /* ---- 備份／模擬資料 ---- */
  exportJSON:function(){return ok(JSON.stringify(load(),null,1));},
  importJSON:function(txt){
    var o;try{o=JSON.parse(txt);}catch(e){return fail('不是有效的 JSON');}
    if(!o||typeof o!=='object'||!Array.isArray(o.students))return fail('格式不對：缺少 students');
    o=fix(o);
    var ops=[{t:'wipe'}];
    o.students.forEach(function(s){ops.push({t:'set',c:'students',id:s.id,d:strip(s)});});
    Object.keys(o.tasks).forEach(function(k){ops.push({t:'set',c:'tasks',id:k,d:strip(o.tasks[k])});});
    o.logs.forEach(function(l){ops.push({t:'set',c:'logs',id:l.id||(l.id=uid('l-')),d:strip(l)});});
    save(o);return commit(ops).then(function(){return true;});
  },
  clearAll:function(){save(fix({}));return commit([{t:'wipe'}]).then(function(){return true;});},
  /* 雲端測試學生：建 5 位（含同名案例）、不寫練習紀錄（省額度）。備註固定「測試帳號」，可一鍵刪除。
     學生 id ＝名字鑰匙，所以你用手機以同樣名字註冊，就會認領這些名單（可快速測任務與登入） */
  seedTestCloud:function(){
    if(mode!=='cloud')return fail('只有雲端模式使用；本機模式請用「產生模擬學生」');
    var S=g.OLMStudent;if(!S)return fail('缺少 student-auth.js');
    var o=load(),names=[['測試小明',''],['測試小明','復興'],['測試小華',''],['測試小美',''],['測試小強','']];
    var tasks=[{id:'basic-1-1',type:'drill',name:'基本指法 1-1',T:5},{id:'song-pig',type:'song',name:'豬之歌',song:'pig',from:1,to:4,T:5}];
    var now=new Date().toISOString(),ops=[],added=0;
    return Promise.all(names.map(function(p){return S.keyOf(S.cleanName(p[0]+p[1]));})).then(function(ids){
      names.forEach(function(p,i){
        var id=ids[i];
        if(o.students.some(function(x){return x.id===id;}))return;
        var st={id:id,name:p[0],school1:p[1],note:'測試帳號',start:todayKey(),ack:true,created:now,uid:null};
        o.students.push(st);o.tasks[id]={tasks:JSON.parse(JSON.stringify(tasks)),updated:now};
        ops.push({t:'set',c:'students',id:id,d:strip(st)},{t:'set',c:'tasks',id:id,d:strip(o.tasks[id])});added++;
      });
      save(o);return ops.length?commit(ops):0;
    }).then(function(){return added;});
  },
  clearTestCloud:function(){
    var o=load(),ids=o.students.filter(function(s){return s.note==='測試帳號';}).map(function(s){return s.id;});
    if(!ids.length)return ok(0);
    var ops=[];
    o.students=o.students.filter(function(s){return ids.indexOf(s.id)<0;});
    ids.forEach(function(id){delete o.tasks[id];ops.push({t:'del',c:'students',id:id},{t:'del',c:'tasks',id:id},{t:'delLogsOf',sid:id});});
    o.logs=o.logs.filter(function(l){return ids.indexOf(l.sid)<0;});
    save(o);return commit(ops).then(function(){return ids.length;});
  },
  clearDemo:function(){
    var o=load(),ops=[];
    o.students.forEach(function(s){if(s.id.indexOf(DEMO_PREFIX)===0)ops.push({t:'del',c:'students',id:s.id});});
    Object.keys(o.tasks).forEach(function(k){if(k.indexOf(DEMO_PREFIX)===0){ops.push({t:'del',c:'tasks',id:k});}});
    o.logs.forEach(function(l){if(l.sid.indexOf(DEMO_PREFIX)===0)ops.push({t:'del',c:'logs',id:l.id});});
    o.students=o.students.filter(function(s){return s.id.indexOf(DEMO_PREFIX)!==0;});
    Object.keys(o.tasks).forEach(function(k){if(k.indexOf(DEMO_PREFIX)===0)delete o.tasks[k];});
    o.logs=o.logs.filter(function(l){return l.sid.indexOf(DEMO_PREFIX)!==0;});
    o.mock=false;save(o);return commit(ops).then(function(){return true;});
  },
  /* 產生模擬資料：n 位學生、近 4 週的練習紀錄（含一組同名同姓）。錯誤集中在幾個「熱點」小節，方便看熱點功能。
     只在 local 模式提供（雲端會寫上千筆文件、佔用免費額度） */
  seedDemo:function(n){
    if(mode==='cloud')return fail('雲端模式不產生模擬資料（請加網址 ?local=1 在本機模式看模擬資料）');
    n=Math.max(1,Math.min(n||20,40));
    var o=load();
    var names=['王小明','林美玲','陳大文','張語彤','李承恩','黃詩涵','吳宥辰','劉芷瑜','蔡宗翰','楊雅婷','許家豪','鄭婉如','謝柏翰','洪佩珊','邱冠宇','曾怡君','廖偉倫','賴思妤','徐子軒','王小明','簡于晴','周品妍','葉泰安','江家瑜','蘇哲豪','潘羽彤','何俊賢','古心怡','施冠廷','方筱涵'];
    var schools=['復興','中山'];
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
