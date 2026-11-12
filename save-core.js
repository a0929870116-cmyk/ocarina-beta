/* save-core.js：全站唯一碰 localStorage 的存檔模組（v0.19）
   規則：
   1. 各頁一律用 OLMSave.patch(鍵, 函式或物件) 寫入：每次都「讀最新 → 修改 → 寫回」，不會蓋掉別頁寫的欄位。
   2. 讀到壞資料（不是物件、JSON 壞掉）一律當成空物件，不拋錯。
   3. 第一次載入時自動搬移舊存檔（v0.18 → v0.19）：先備份到 olm_backup_v018，每一步獨立 try，全部成功才蓋版本章。
   4. 上雲（Firebase）之後只需改這個檔的 raw 讀寫。 */
(function(g){
  if(g.OLMSave)return;
  var VER=19, VERKEY='olm_save_ver', BACKUP='olm_backup_v018';
  var K={TEST:'olm_test_v1',SHIP:'olm_ship_v1',WK:'olm_wk_v2',ARC:'olm_arcade_v1',
         SFX:'olm_sfx_off',SONG:'olm_song_proto_v1',PG:'ocarina_playground_v1',OLDWK:'olm_weekly_v1'};

  function rawGet(k){try{return localStorage.getItem(k);}catch(e){return null;}}
  function rawSet(k,v){try{localStorage.setItem(k,v);return true;}catch(e){return false;}}
  function rawDel(k){try{localStorage.removeItem(k);return true;}catch(e){return false;}}

  /* 讀物件：壞掉或不是物件 → {} */
  function read(k){
    var s=rawGet(k);if(!s)return {};
    try{var o=JSON.parse(s);return(o&&typeof o==='object'&&!Array.isArray(o))?o:{};}catch(e){return {};}
  }
  function write(k,o){return rawSet(k,JSON.stringify(o));}
  /* patch：fn(o) 可直接改 o（不必 return），也可 return 新物件；傳物件則淺合併 */
  function patch(k,fn){
    var o=read(k);
    if(typeof fn==='function'){var r=fn(o);if(r&&typeof r==='object')o=r;}
    else if(fn&&typeof fn==='object'){for(var p in fn)o[p]=fn[p];}
    write(k,o);return o;
  }
  /* 簡單開關（音效）：'1'／'0' */
  function flag(k){return rawGet(k)==='1';}
  function setFlag(k,b){return rawSet(k,b?'1':'0');}

  /* ===== 舊存檔搬移 ===== */
  function migrate(){
    if((parseInt(rawGet(VERKEY),10)||0)>=VER)return;
    var ok=true;
    function step(fn){try{fn();}catch(e){ok=false;}}
    /* 0) 備份：只備份一次，保留所有舊鍵原始字串，萬一出問題可手動還原 */
    step(function(){
      if(rawGet(BACKUP)!==null)return;
      var b={t:Date.now()};
      [K.TEST,K.SHIP,K.WK,K.ARC,K.SFX,K.SONG,K.PG,K.OLDWK].forEach(function(k){var v=rawGet(k);if(v!==null)b[k]=v;});
      if(!rawSet(BACKUP,JSON.stringify(b)))throw new Error('backup');
    });
    if(!ok)return;   /* 備份失敗就整個不搬（例如儲存空間滿了），下次再試 */
    /* 1) 飛船：移除已取消的 claimed、fake */
    step(function(){if(rawGet(K.SHIP)===null)return;patch(K.SHIP,function(o){delete o.claimed;delete o.fake;});});
    /* 2) 每週：移除 elem、bag（每週練習已不掉水晶碎片） */
    step(function(){if(rawGet(K.WK)===null)return;patch(K.WK,function(o){delete o.elem;delete o.bag;});});
    /* 3) 試煉每日紀錄：coinSum 已取代（金幣直接進錢包） */
    step(function(){if(rawGet(K.ARC)===null)return;patch(K.ARC,function(o){delete o.coinSum;});});
    /* 4) 舊分段練習原型次數：清除（不計星星糖） */
    step(function(){rawDel(K.SONG);});
    /* 5) 遊樂場：只清舊樣板星數／連續天數，保留 fing、name、profiles（老師後台）與 rec */
    step(function(){if(rawGet(K.PG)===null)return;patch(K.PG,function(o){delete o.stars;delete o.total;delete o.streak;delete o.last;});});
    /* 6) 舊版每週練習鍵：新鍵已存在才清 */
    step(function(){var w=read(K.WK);if(w.v===2)rawDel(K.OLDWK);});
    if(ok)rawSet(VERKEY,String(VER));
  }
  try{migrate();}catch(e){}

  g.OLMSave={K:K,VER:VER,read:read,write:write,patch:patch,flag:flag,setFlag:setFlag,raw:{get:rawGet,set:rawSet,del:rawDel},migrate:migrate};
})(window);
