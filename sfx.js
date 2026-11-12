/* 陶笛失落地圖｜共用音效（程式合成，不用音檔）
   用法：<script src="sfx.js"></script> 之後
     Sfx.auto('選擇器', 'tap'|'nav')  按到符合的按鈕時出聲（導覽與主要按鈕）
     Sfx.ok() / Sfx.bad()            答對、答錯（結算時呼叫）
     Sfx.mic(true/false)             麥克風收音中＝靜音（按鈕音、答對答錯都不出聲）
     Sfx.probe = () => 布林          額外判斷「別處的麥克風是否開著」（例如內嵌的遊樂場）
   原則：一律輕柔短促；收音中絕不出聲；任何錯誤都不影響頁面。 */
(function(){
  if(window.Sfx)return;
  var ctx=null,master=null,micOn=false,last=0,sel=[];
  var off=false;try{off=window.OLMSave?OLMSave.flag('olm_sfx_off'):localStorage.getItem('olm_sfx_off')==='1';}catch(e){}

  function get(){
    if(ctx)return ctx;
    try{
      var AC=window.AudioContext||window.webkitAudioContext;
      ctx=new AC();
      master=ctx.createGain();master.gain.value=.55;
      var comp=ctx.createDynamicsCompressor();master.connect(comp);comp.connect(ctx.destination);
    }catch(e){ctx=null;}
    return ctx;
  }
  /* iPhone 要在點擊／觸碰當下建立與喚醒 AudioContext */
  function prime(){var c=get();if(c&&c.state==='suspended'){try{c.resume();}catch(e){}}}
  ['pointerup','touchend','click','keydown'].forEach(function(t){document.addEventListener(t,prime,true);});

  function blocked(){
    if(off||micOn||document.hidden)return true;
    try{if(S.probe&&S.probe())return true;}catch(e){}
    return false;
  }
  function blip(c,t,f0,f1,len,vol,type){
    var o=c.createOscillator(),g=c.createGain();
    o.type=type||'sine';o.frequency.setValueAtTime(f0,t);
    if(f1)o.frequency.exponentialRampToValueAtTime(f1,t+len);
    g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+.008);
    g.gain.exponentialRampToValueAtTime(.0001,t+len);
    o.connect(g);g.connect(master);o.start(t);o.stop(t+len+.03);
  }
  function play(kind){
    if(blocked())return;
    var c=get();if(!c)return;
    if(c.state==='suspended'){try{c.resume();}catch(e){}}
    var t=c.currentTime+.005;
    try{
      if(kind==='tap'){blip(c,t,880,1175,.07,.10,'sine');}
      else if(kind==='nav'){blip(c,t,660,880,.08,.10,'sine');blip(c,t+.045,990,0,.07,.05,'sine');}
      else if(kind==='ok'){[1047,1319,1568].forEach(function(f,k){blip(c,t+k*.09,f,0,.22,.13,'sine');blip(c,t+k*.09,f*2,0,.14,.03,'sine');});}
      else if(kind==='snap'){blip(c,t,1319,1760,.09,.09,'sine');blip(c,t,2637,0,.06,.025,'sine');}
      else if(kind==='bad'){blip(c,t,330,262,.16,.12,'triangle');blip(c,t+.15,262,208,.24,.12,'triangle');}
    }catch(e){}
  }

  var S={
    tap:function(){play('tap');},
    nav:function(){play('nav');},
    ok:function(){play('ok');},
    bad:function(){play('bad');},
    snap:function(){play('snap');},
    mic:function(b){micOn=!!b;},
    probe:null,
    setOn:function(b){off=!b;try{if(window.OLMSave)OLMSave.setFlag('olm_sfx_off',!b);else localStorage.setItem('olm_sfx_off',b?'0':'1');}catch(e){}},
    isOn:function(){return !off;},
    auto:function(selector,kind){sel.push([selector,kind||'tap']);}
  };
  /* 全域監聽：先比對 auto 登記的選擇器（nav／tap），沒符合的「任何可按的東西」也出 tap（按鈕、連結、摘要、role=button、[data-act]、[data-go]、.tap）。
     不想出聲的元素加 data-nosfx（例如麥克風開始／停止鈕）。 */
  var PRESS='button,[role="button"],a[href],summary,[data-act],[data-go],.tap,.cell,select';
  document.addEventListener('click',function(e){
    var tg=e.target;if(!tg||!tg.closest)return;
    var kind=null,i,el;
    for(i=0;i<sel.length;i++){
      el=tg.closest(sel[i][0]);
      if(!el)continue;
      if(el.disabled||el.getAttribute('aria-disabled')==='true'||el.hasAttribute('data-nosfx'))return;
      kind=sel[i][1];break;
    }
    if(!kind){
      el=tg.closest(PRESS);
      if(!el||el.disabled||el.getAttribute('aria-disabled')==='true'||el.closest('[data-nosfx]'))return;
      kind='tap';
    }
    var n=Date.now();if(n-last<60)return;last=n;
    play(kind);
  },true);
  window.Sfx=S;
})();
