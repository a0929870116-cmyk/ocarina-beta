/* 陶笛失落地圖｜學生登入（student-auth.js，全域 OLMStudent）
   學生用「名字＋自設密碼」登入，不收 email。做法：
   · 名字（去空白、全形轉半形、小寫）做 SHA-256，取前 24 碼 ＝ 學生的「鑰匙」key（也是 Firestore students 文件 id）。
   · Firebase Auth 要 email，所以用 <key>[-世代]@olm-students.example.com 當帳號（example.com 是保留網域，不會寄信）。
   · Firebase 密碼至少 6 字，但專案規格是 4 字，所以實際送出的是「密碼＋固定尾巴」（PAD）。
   · 老師重設密碼＝後台把 gens/<key>.g 加 1、students/<key>.uid 清空；學生用「同樣的名字」重新建立帳號（世代 +1 的新 email），認領原本的文件，進度保留。
   · 同名同姓：後註冊的人在名字後面加校名縮寫 2～4 字（例：王小明復興），鑰匙就不同；先註冊的人不動。
   文件格式、規則見 firestore.rules。
   錯誤一律丟 Error，e.code 是：badname、weak、noack、dup、wrong、many、net、config、denied、nodoc、other。 */
(function(g){
'use strict';
var DOMAIN='olm-students.example.com',PAD='#olm26',KEY_LEN=24;

function E(code,msg,orig){var e=new Error(msg||code);e.code=code;e.orig=orig;return e;}
function noop(){}
function todayKey(){return new Date(Date.now()+8*3600e3).toISOString().slice(0,10);}

/* 名字整理：全形轉半形、去掉所有空白 */
function cleanName(s){
  s=String(s==null?'':s);
  try{s=s.normalize('NFKC');}catch(e){}
  return s.replace(/\s+/g,'');
}
function keyOf(name){
  var s=cleanName(name).toLowerCase();
  if(!g.crypto||!g.crypto.subtle)return Promise.reject(E('config','這個瀏覽器不支援加密功能（請用 https 網址）'));
  return g.crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)).then(function(buf){
    var a=new Uint8Array(buf),h='';
    for(var i=0;i<a.length;i++)h+=('0'+a[i].toString(16)).slice(-2);
    return h.slice(0,KEY_LEN);
  });
}
function emailOf(key,gen){return key+(gen>0?'-'+gen:'')+'@'+DOMAIN;}
function keyFromEmail(email){return String(email||'').split('@')[0].split('-')[0];}
function isStudentEmail(email){return String(email||'').slice(-DOMAIN.length-1)==='@'+DOMAIN;}

function mapAuthErr(e){
  var c=(e&&e.code)||'';
  if(c==='auth/email-already-in-use')return E('dup');
  if(c==='auth/invalid-credential'||c==='auth/user-not-found'||c==='auth/wrong-password'||c==='auth/invalid-login-credentials')return E('wrong');
  if(c==='auth/too-many-requests')return E('many');
  if(c==='auth/network-request-failed')return E('net');
  if(c==='auth/operation-not-allowed'||c==='auth/configuration-not-found'||c==='auth/invalid-email'||c==='auth/invalid-api-key')return E('config',c);
  if(c==='auth/weak-password')return E('weak');
  return E('other',c||String(e&&e.message||e),e);
}
function isDenied(e){return !!e&&(e.code==='permission-denied'||e.code==='firestore/permission-denied');}

/* 以指定的 SDK 函式組、Auth、Firestore 組出服務（測試時可傳假的） */
function make(sdk,auth,db){
  function stuRef(key){return sdk.doc(db,'students',key);}
  function getGen(key){
    return sdk.getDoc(sdk.doc(db,'gens',key)).then(function(s){
      var d=s.exists()?s.data():null;return d&&d.g>0?(d.g|0):0;
    },function(e){
      if(isDenied(e))return 0;   /* 規則還沒更新：先當世代 0，後面的步驟會給出明確錯誤 */
      throw E('net',null,e);
    });
  }
  function readMine(key,uid){
    return sdk.getDoc(stuRef(key)).then(function(s){
      if(!s.exists())return null;
      var d=s.data();if(d.uid!==uid)return null;
      return {sid:key,name:String(d.name||'')+String(d.school1||''),note:String(d.note||'')};
    },function(e){if(isDenied(e))return null;throw E('net',null,e);});
  }

  var svc={
    sdk:sdk,auth:auth,db:db,

    /* 建立帳號（或老師重設後重新設定密碼：同樣的名字） */
    register:function(rawName,pw,ack,note){
      var name=cleanName(rawName);
      if(!name||name.length>16||/[<>&"'\/\\]/.test(name))return Promise.reject(E('badname'));
      if(String(pw||'').length<4)return Promise.reject(E('weak'));
      if(!ack)return Promise.reject(E('noack'));
      var key,user=null;
      return keyOf(name).then(function(k){key=k;return getGen(key);}).then(function(gen){
        return sdk.createUserWithEmailAndPassword(auth,emailOf(key,gen),pw+PAD).catch(function(e){throw mapAuthErr(e);});
      }).then(function(cred){
        user=cred.user;
        var d={name:name,school1:'',note:String(note||'').slice(0,40),start:todayKey(),ack:true,created:new Date().toISOString(),uid:user.uid};
        return sdk.setDoc(stuRef(key),d).catch(function(){
          /* 名單上已有這位（老師先建的，或老師剛重設）→ 認領 */
          return sdk.updateDoc(stuRef(key),{uid:user.uid,ack:true});
        }).catch(function(e){throw isDenied(e)?E('denied',null,e):E('other',null,e);});
      }).then(function(){return readMine(key,user.uid);}).then(function(me){
        if(!me)throw E('denied');
        return me;
      }).catch(function(e){
        if(user){try{sdk.deleteUser(user).catch(noop);}catch(x){}}   /* 沒建完就把剛建的帳號收掉，免得下次卡在「名字已有人用」 */
        throw e&&e.code?e:E('other',null,e);
      });
    },

    login:function(rawName,pw){
      var name=cleanName(rawName);
      if(!name||!pw)return Promise.reject(E('wrong'));
      var key;
      return keyOf(name).then(function(k){key=k;return getGen(key);}).then(function(gen){
        return sdk.signInWithEmailAndPassword(auth,emailOf(key,gen),pw+PAD).catch(function(e){throw mapAuthErr(e);});
      }).then(function(cred){
        return readMine(key,cred.user.uid).then(function(me){
          if(!me){sdk.signOut(auth).catch(noop);throw E('nodoc');}
          return me;
        });
      });
    },

    /* 目前已登入的學生（網頁重新開啟後仍在）；沒有就回 null */
    current:function(){
      return new Promise(function(res){
        var done=false,off=null;
        function finish(v){if(done)return;done=true;try{off&&off();}catch(e){}res(v);}
        off=sdk.onAuthStateChanged(auth,function(u){
          if(done)return;
          if(!u||!isStudentEmail(u.email)){finish(null);return;}
          readMine(keyFromEmail(u.email),u.uid).then(finish,function(){finish(null);});
        });
        if(done){try{off&&off();}catch(e){}}
      });
    },

    logout:function(){return sdk.signOut(auth);}
  };
  return svc;
}

/* 載入 Firebase SDK（CDN）並接上；appName 給測試頁開第二、第三個獨立連線用 */
function connect(appName){
  var F=g.OLM_FIREBASE;
  if(!F||!F.config)return Promise.reject(E('config','找不到 firebase-config.js'));
  var base='https://www.gstatic.com/firebasejs/'+(F.sdkVersion||'13.3.0')+'/';
  return Promise.all([import(base+'firebase-app.js'),import(base+'firebase-auth.js'),import(base+'firebase-firestore.js')]).then(function(m){
    var app=appName?m[0].initializeApp(F.config,appName):m[0].initializeApp(F.config);
    var sdk={};
    [m[1],m[2]].forEach(function(mod){Object.keys(mod).forEach(function(k){sdk[k]=mod[k];});});
    return make(sdk,m[1].getAuth(app),m[2].getFirestore(app));
  },function(e){throw E('net',null,e);});
}

var _svc=null;
g.OLMStudent={
  DOMAIN:DOMAIN,PAD:PAD,
  cleanName:cleanName,keyOf:keyOf,emailOf:emailOf,make:make,connect:connect,
  /* 共用連線（index.html 用）。用獨立的 app 名稱「student」，這樣同一個瀏覽器裡後台（管理者）和學生的登入互不影響；失敗會重試 */
  service:function(){
    if(!_svc)_svc=connect('student').catch(function(e){_svc=null;throw e;});
    return _svc;
  }
};
})(window);
