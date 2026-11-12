/* 圖鑑「互動觀察」(C)：從 A 圖鑑書頁的植物卡進入。
   第 9 島「音符花」（點一下發亮的花，依序彈出一小段旋律；不需麥克風）。
   第 5 島「螢光蕨」（對著新芽吹陶笛，綠光隨節奏跳動，吹滿螢火蟲飛出；沒麥克風→按住畫面代替）。
   第 2 島「月光睡蓮」（吹任何音、音高穩住就慢慢開花，吹滿月亮魚躍出；不指定音；沒麥克風→按住畫面代替）。
   規則（使用者 11/11 19:40）：吹滿／彈完只有動畫，沒有任何獎勵數字；不記錄完成、不新增存檔。
   用法：DexObserve.has(n) / open(n,{note,onOpen,onClose}) / close() / isOpen() */
(function(){
'use strict';
var $=function(s,r){return (r||document).querySelector(s);};

/* ---------- 音效：Web Audio 合成，像小鐘琴 ---------- */
var ctx=null,master=null;
var played=[];                       /* 測試用：記錄實際發出的頻率 */
function audio(){
  if(!ctx){
    var AC=window.AudioContext||window.webkitAudioContext;if(!AC)return null;
    ctx=new AC();
    var comp=ctx.createDynamicsCompressor();master=ctx.createGain();master.gain.value=.55;
    master.connect(comp);comp.connect(ctx.destination);
  }
  if(ctx.state==='suspended'){try{ctx.resume();}catch(e){}}
  return ctx;
}
function tone(f,delay,dur,vol){
  played.push(Math.round(f*100)/100);
  var c=audio();if(!c)return;
  var t0=c.currentTime+(delay||0),d=dur||1.3,v=vol==null?.5:vol;
  var g=c.createGain();g.gain.setValueAtTime(0.0001,t0);
  g.gain.linearRampToValueAtTime(v,t0+.008);
  g.gain.exponentialRampToValueAtTime(0.0001,t0+d);
  g.connect(master);
  [[1,'sine',1],[2,'triangle',.22],[3,'sine',.07]].forEach(function(p){
    var o=c.createOscillator(),og=c.createGain();
    o.type=p[1];o.frequency.value=f*p[0];og.gain.value=p[2];
    o.connect(og);og.connect(g);o.start(t0);o.stop(t0+d+.05);
  });
}

/* ---------- 音符花：do do sol sol la la sol（小星星前半句） ---------- */
var NOTE={C5:523.25,E5:659.25,G5:783.99,A5:880,C6:1046.5};
var MELODY=[['C5','do',0],['C5','do',0],['G5','sol',1],['G5','sol',1],['A5','la',2],['A5','la',2],['G5','sol',1]];
var LV=[0,44,72];                    /* 音越高，花越高（像音符站在五線譜上） */

function flowerSVG(){
  return '<svg viewBox="0 0 64 84" aria-hidden="true">'
   +'<ellipse cx="32" cy="79" rx="15" ry="3" fill="#000" opacity=".25"/>'
   +'<path d="M29 79C29 64 33 50 38 33" fill="none" stroke="#5aa86a" stroke-width="3.4" stroke-linecap="round"/>'
   +'<path d="M30 70C21 70 17 65 16 61C25 61 29 64 30 70Z" fill="#8ed17a" stroke="#4a2f1a" stroke-width="2" stroke-linejoin="round"/>'
   +'<g class="ob-bud"><path class="ob-fl" d="M42.5 28V9" fill="none" stroke="#4a2f1a" stroke-width="2.6" stroke-linecap="round"/>'
   +'<path class="ob-flag" d="M42.5 9C49 10 52 15 51 21C48 16 46 15 42.5 14Z" stroke="#4a2f1a" stroke-width="2" stroke-linejoin="round"/>'
   +'<ellipse class="ob-head" cx="36" cy="30" rx="9.5" ry="7" transform="rotate(-24 36 30)" stroke="#4a2f1a" stroke-width="2.2"/></g>'
   +'<path class="ob-spk" d="M20 22q0-4 4-4q-4 0-4-4q0 4-4 4q4 0 4 4Z" fill="#fff3a8"/>'
   +'</svg>';
}

var CSS=''
+'#ob{position:fixed;inset:0;z-index:60;display:flex;flex-direction:column;background:var(--vellum-2,#F9F0D6);color:var(--ink,#3A2A1A);overscroll-behavior:contain}'
+'#ob[hidden]{display:none}'
+'.ob-top{flex:none;display:flex;align-items:center;gap:10px;padding:calc(8px + env(safe-area-inset-top,0px)) 14px 8px;max-width:520px;width:100%;margin:0 auto;box-sizing:border-box}'
+'.ob-back{flex:none;width:44px;height:44px;border:2.5px solid var(--ink,#3A2A1A);border-radius:50%;background:var(--vellum,#EFE1BF);color:var(--ink,#3A2A1A);font-size:30px;line-height:1;padding:0 0 4px;cursor:pointer;box-shadow:0 3px 0 var(--shadow,#BFA470),inset 0 0 0 2px var(--gold,#C8963A)}'
+'.ob-ttl{flex:1;min-width:0;display:flex;flex-direction:column;line-height:1.25}.ob-ttl b{font-family:var(--font-head,inherit);font-size:20px}.ob-ttl small{font-size:12.5px;color:var(--ink-2,#6E5337)}'
+'.ob-body{flex:1;min-height:0;overflow-y:auto;padding:4px 14px 14px;display:flex;flex-direction:column;gap:12px;max-width:520px;width:100%;margin:0 auto;box-sizing:border-box}'
+'.ob-stage{position:relative;flex:none;height:clamp(264px,38vh,340px);border:2.5px solid var(--ink,#3A2A1A);border-radius:14px;overflow:hidden;background:linear-gradient(#0e1634 0%,#2a2058 55%,#4a2f6e 100%);box-shadow:inset 0 0 0 3px #1b1440,inset 0 0 0 4.5px var(--gold,#C8963A);user-select:none;-webkit-user-select:none;touch-action:manipulation}'
+'.ob-sky{position:absolute;inset:0;pointer-events:none;background-image:radial-gradient(1.6px 1.6px at 12% 18%,#fff 98%,transparent),radial-gradient(1.2px 1.2px at 27% 42%,#ffe9a8 98%,transparent),radial-gradient(2px 2px at 41% 12%,#fff 98%,transparent),radial-gradient(1.2px 1.2px at 56% 33%,#ffe9a8 98%,transparent),radial-gradient(1.6px 1.6px at 68% 15%,#fff 98%,transparent),radial-gradient(1.2px 1.2px at 80% 48%,#fff 98%,transparent),radial-gradient(1.6px 1.6px at 90% 30%,#ffe9a8 98%,transparent),radial-gradient(1.2px 1.2px at 7% 52%,#ffe9a8 98%,transparent),radial-gradient(1.6px 1.6px at 34% 62%,#fff 98%,transparent),radial-gradient(1.2px 1.2px at 74% 66%,#ffe9a8 98%,transparent);animation:obtw 3.2s ease-in-out infinite}'
+'.ob-moon{position:absolute;right:22px;top:20px;width:34px;height:34px;border-radius:50%;background:#fff6c9;box-shadow:0 0 22px 6px rgba(255,240,170,.45);pointer-events:none}'
+'.ob-moon:after{content:"";position:absolute;left:9px;top:-3px;width:30px;height:30px;border-radius:50%;background:#1a1646}'
+'.ob-grass{position:absolute;left:0;right:0;bottom:0;height:38px;background:linear-gradient(#2c4a3a,#18301f);border-top:2px solid #5aa86a;pointer-events:none}'
+'.ob-row{position:absolute;left:10px;right:10px;bottom:26px;display:flex;align-items:flex-end;gap:2px}'
+'.ob-f{position:relative;flex:1 1 0;min-width:0;max-width:66px;padding:0;border:0;background:none;cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation}'
+'.ob-f svg{display:block;width:100%;height:auto;overflow:visible;transition:filter .25s}'
+'.ob-head{fill:#5f6f98;transition:fill .25s}.ob-flag{fill:#7d8bb0;transition:fill .25s}.ob-spk{opacity:0}'
+'.ob-f.on .ob-head{fill:#c77dff}.ob-f.on .ob-flag{fill:#e1b3ff}'
+'.ob-f.on svg{filter:drop-shadow(0 0 7px rgba(214,150,255,.95))}'
+'.ob-f.on .ob-spk{opacity:1;animation:obtw 1.6s ease-in-out infinite}'
+'.ob-f.next:before{content:"";position:absolute;left:50%;top:18%;width:78%;aspect-ratio:1;border-radius:50%;transform:translate(-50%,0);border:2.5px solid #ffe38a;box-shadow:0 0 12px 2px rgba(255,227,138,.7);animation:obpulse 1.2s ease-out infinite;pointer-events:none}'
+'.ob-f.next .ob-head{fill:#8f7fd0}'
+'.ob-f.pop svg{animation:obpop .42s ease-out}'
+'.ob-f.wig svg{animation:obwig .35s ease-in-out}'
+'.ob-stage.done .ob-f svg{animation:obwave 1.1s ease-in-out infinite;animation-delay:calc(var(--i)*.09s)}'
+'.ob-pt{position:absolute;pointer-events:none;font-size:22px;line-height:1;color:#ffe9a8;text-shadow:0 0 8px rgba(255,220,120,.9);animation:obrise 1.3s ease-out forwards}'
+'.ob-stat{display:flex;align-items:center;gap:10px;font-size:14px;color:var(--ink-2,#6E5337)}'
+'.ob-seg{flex:1;display:flex;gap:4px}.ob-seg i{flex:1;height:10px;border:2px solid var(--ink,#3A2A1A);border-radius:99px;background:var(--vellum,#EFE1BF);transition:background .25s}.ob-seg i.on{background:#9b5fd6}'
+'.ob-hint{margin:0;text-align:center;font-family:var(--font-head,inherit);font-size:20px;line-height:1.4;min-height:1.4em}'
+'.ob-card{background:var(--vellum,#EFE1BF);border:2px solid var(--ink,#3A2A1A);border-radius:12px;padding:12px 14px;box-shadow:inset 0 0 0 3px var(--vellum-2,#F9F0D6),inset 0 0 0 4.5px rgba(217,178,91,.7)}'
+'.ob-card small{display:block;font-size:12.5px;font-weight:700;color:var(--ink-2,#6E5337);margin-bottom:2px}.ob-card p{margin:0;font-size:16.5px;line-height:1.6}'
+'.ob-btns{display:flex;gap:10px}.ob-btns button{flex:1;min-height:48px;border:2.5px solid var(--ink,#3A2A1A);border-radius:12px;font:inherit;font-size:16px;font-weight:700;cursor:pointer;box-shadow:0 3px 0 var(--shadow,#BFA470)}'
+'.ob-btns .a{background:var(--green,#2E5B46);color:var(--green-fg,#F6E7B4)}.ob-btns .b{background:var(--vellum,#EFE1BF);color:var(--ink,#3A2A1A)}'
+'@keyframes obpulse{0%{transform:translate(-50%,0) scale(.8);opacity:1}100%{transform:translate(-50%,0) scale(1.25);opacity:0}}'
+'@keyframes obpop{0%{transform:scale(1)}35%{transform:scale(1.28) translateY(-6px)}100%{transform:scale(1)}}'
+'@keyframes obwig{0%,100%{transform:rotate(0)}25%{transform:rotate(-7deg)}75%{transform:rotate(7deg)}}'
+'@keyframes obwave{0%,100%{transform:translateY(0)}50%{transform:translateY(-9px)}}'
+'@keyframes obrise{0%{transform:translateY(0) scale(.6);opacity:0}15%{opacity:1}100%{transform:translateY(-110px) scale(1.15);opacity:0}}'
+'@keyframes obtw{0%,100%{transform:scale(.8);opacity:.5}50%{transform:scale(1.2);opacity:1}}'
+'@media (prefers-reduced-motion:reduce){.ob-f.next:before,.ob-f.on .ob-spk,.ob-stage.done .ob-f svg{animation:none}}';

/* ---------- 畫面 ---------- */
var el=null,S=null,opts=null,openFlag=false;

function build(){
  if(el)return;
  var st=document.createElement('style');st.textContent=CSS+FCSS+LCSS;document.head.appendChild(st);
  el=document.createElement('div');el.id='ob';el.hidden=true;
  el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');el.setAttribute('aria-labelledby','ob-title');
  el.innerHTML=
   '<header class="ob-top"><button class="ob-back" id="ob-close" aria-label="返回">‹</button>'
  +'<div class="ob-ttl"><b id="ob-title">互動觀察</b><small id="ob-sub"></small></div></header>'
  +'<div class="ob-body" id="ob-body"></div>';
  document.body.appendChild(el);
  $('#ob-close',el).addEventListener('click',close);
  document.addEventListener('keydown',function(e){if(openFlag&&e.key==='Escape'){e.stopPropagation();close();}},true);
}

function newState(){return {step:0,done:false};}

function renderPlant(){
  var h='';
  MELODY.forEach(function(m,i){
    h+='<button class="ob-f" data-k="'+i+'" style="margin-bottom:'+LV[m[2]]+'px;--i:'+i+'" aria-label="第 '+(i+1)+' 朵音符花，唱「'+m[1]+'」">'+flowerSVG()+'</button>';
  });
  var seg='';for(var i=0;i<MELODY.length;i++)seg+='<i></i>';
  $('#ob-body',el).innerHTML=
   '<div class="ob-stage" id="ob-stage"><div class="ob-sky"></div><div class="ob-moon"></div><div class="ob-grass"></div>'
  +'<div class="ob-row" id="ob-row">'+h+'</div></div>'
  +'<p class="ob-hint" id="ob-hint"></p>'
  +'<div class="ob-stat"><span id="ob-cnt"></span><div class="ob-seg" id="ob-seg">'+seg+'</div></div>'
  +'<div class="ob-card"><small>觀察筆記</small><p>'+((opts&&opts.note)||'')+'</p></div>'
  +'<div class="ob-btns"><button class="b" id="ob-again">再彈一次</button><button class="a" id="ob-intro">看介紹</button></div>';
  $('#ob-row',el).addEventListener('click',onTap);
  $('#ob-again',el).addEventListener('click',reset);
  $('#ob-intro',el).addEventListener('click',close);
  sync();
}

function flowers(){return el.querySelectorAll('.ob-f');}

function sync(msg){
  var n=MELODY.length;
  Array.prototype.forEach.call(flowers(),function(f,i){
    f.classList.toggle('on',i<S.step);
    f.classList.toggle('next',!S.done&&i===S.step);
  });
  Array.prototype.forEach.call(el.querySelectorAll('#ob-seg i'),function(b,i){b.classList.toggle('on',i<S.step);});
  $('#ob-cnt',el).textContent='已彈 '+S.step+'／'+n;
  $('#ob-stage',el).classList.toggle('done',S.done);
  $('#ob-hint',el).textContent=msg||(S.done?'花園的歌，彈完了！':S.step===0?'點一下發亮的那朵花。':'很好，再點下一朵。');
}

function particle(f,txt){
  var st=$('#ob-stage',el),r=f.getBoundingClientRect(),sr=st.getBoundingClientRect();
  var p=document.createElement('span');p.className='ob-pt';p.textContent=txt||(Math.random()<.5?'♪':'♫');
  p.style.left=(r.left-sr.left+r.width*(.35+Math.random()*.3))+'px';
  p.style.top=(r.top-sr.top+r.height*.2)+'px';
  st.appendChild(p);setTimeout(function(){p.remove();},1400);
}
function anim(f,cls){f.classList.remove(cls);void f.offsetWidth;f.classList.add(cls);setTimeout(function(){f.classList.remove(cls);},500);}

function onTap(e){
  var f=e.target.closest('.ob-f');if(!f)return;
  var k=+f.dataset.k,m=MELODY[k],fr=NOTE[m[0]];
  if(S.done||k<S.step){tone(fr,0,1.1,.4);anim(f,'pop');particle(f);return;}   /* 彈完或已亮的花：自由彈，不影響進度 */
  if(k!==S.step){tone(fr,0,.7,.14);anim(f,'wig');sync('點發亮的那一朵。');return;}   /* 還沒輪到：輕輕響一下、搖一搖 */
  tone(fr,0,1.3,.5);anim(f,'pop');particle(f);
  S.step++;
  if(S.step>=MELODY.length){S.done=true;sync();finale();}else sync();
}

function finale(){
  /* 琴音彈完：短短一串琶音＋整排花一起發亮飄音符（只有動畫，沒有獎勵） */
  ['C5','E5','G5','C6'].forEach(function(n,i){tone(NOTE[n],.28+i*.11,1.8,.34);});
  var fs=flowers();
  Array.prototype.forEach.call(fs,function(f,i){setTimeout(function(){if(openFlag){particle(f,i%2?'♫':'♪');if(i%3===0)particle(f,'✦');}},300+i*90);});
}

function reset(){S=newState();sync();}

/* ================= 螢光蕨（第 5 島）=================
   吹陶笛（麥克風音量）→ 綠光亮起、隨起音（節奏）跳動；累計吹約 6 秒＝100%，螢火蟲飛出。
   只有動畫：不給任何獎勵、不記錄完成、不新增存檔。
   沒麥克風／不允許 → 按住畫面代替（按住時綠光自己有節奏地跳）。 */
var BLOW_SEC=6;                      /* 累計吹奏秒數（暫定，實測後調）*/
var FCSS=''
+'.fr-stage{background:linear-gradient(#07122a 0%,#0f2a3a 55%,#16382f 100%);touch-action:none;-webkit-touch-callout:none;cursor:pointer;--g:0}'
+'.fr-svg{position:absolute;left:50%;top:0;height:100%;width:auto;max-width:100%;transform:translateX(-50%);overflow:visible;pointer-events:none}'
+'.fr-ring{fill:none;stroke:rgba(190,255,170,.16);stroke-width:5}.fr-prog{fill:none;stroke:#b9ff7a;stroke-width:5;stroke-linecap:round;filter:drop-shadow(0 0 4px rgba(185,255,122,.8));transition:stroke-dashoffset .12s linear}'
+'.fr-ferns{transform-origin:150px 250px;filter:brightness(calc(.75 + var(--g)*.9)) drop-shadow(0 0 calc(2px + var(--g)*13px) rgba(150,255,140,calc(.15 + var(--g)*.85)))}'
+'.fr-grow{transform-origin:0 0;transform:scale(calc(.22 + .78*min(1,max(0,var(--p,0)*1.3 - var(--o,0)))));transition:transform .18s linear}'
+'.fr-glow{fill:url(#frg);opacity:calc(.12 + var(--g)*.88);transform-box:fill-box;transform-origin:center;transform:scale(calc(.8 + var(--g)*.7))}'
+'.fr-stage.beat .fr-glow{animation:frbeat .3s ease-out}'
+'.fr-stage.beat .fr-ferns{animation:frsway .3s ease-out}'
+'.fr-pct{position:absolute;left:14px;top:10px;color:#d9ffb8;font-weight:700;font-size:15px;text-shadow:0 0 8px rgba(160,255,140,.8);pointer-events:none}'
+'.fr-fly{position:absolute;left:50%;top:62%;width:0;height:0;pointer-events:none;animation:frout 1.5s cubic-bezier(.15,.7,.3,1) both}'
+'.fr-fly i{position:absolute;left:-5px;top:-5px;width:11px;height:11px;border-radius:50%;background:#f8ffb0;box-shadow:0 0 12px 5px rgba(235,255,120,.9);animation:frflick 1.1s ease-in-out infinite,frdrift 3.6s ease-in-out infinite alternate;animation-delay:var(--d,0s)}'
+'.fr-wave{display:flex;align-items:flex-end;justify-content:center;gap:5px;height:34px}.fr-wave i{display:block;width:8px;height:6px;border-radius:4px;background:#5fb86f;transition:height .08s}'
+'.fr-sub{margin:-6px 0 0;text-align:center;font-size:13.5px;color:var(--ink-2,#6E5337);min-height:1.3em}'
+'@keyframes frbeat{0%{transform:scale(calc(.8 + var(--g)*.7))}35%{transform:scale(calc(1.15 + var(--g)*.7))}100%{transform:scale(calc(.8 + var(--g)*.7))}}'
+'@keyframes frsway{0%,100%{transform:rotate(0)}30%{transform:rotate(-1.6deg) scale(1.02)}70%{transform:rotate(1.2deg)}}'
+'@keyframes frout{0%{transform:translate(0,0) scale(.3);opacity:0}15%{opacity:1}100%{transform:translate(var(--dx),var(--dy)) scale(1);opacity:1}}'
+'@keyframes frflick{0%,100%{opacity:.35}50%{opacity:1}}'
+'@keyframes frdrift{0%{transform:translate(0,0)}100%{transform:translate(var(--wx),var(--wy))}}'
+'@media (prefers-reduced-motion:reduce){.fr-grow{transition:none}.fr-stage.beat .fr-glow,.fr-stage.beat .fr-ferns,.fr-fly i{animation:none}}';

/* 蕨：5 根新芽（尖端捲成小圈），小葉成對排在莖兩側 */
function frondSVG(a,len,i){
  var h=len,lf='';
  for(var y=22;y<h-12;y+=15){
    var w=Math.max(5,13-(y/h)*8);
    lf+='<ellipse cx="'+(-w-2)+'" cy="'+(-y)+'" rx="'+w+'" ry="3.4" transform="rotate(-28 '+(-w-2)+' '+(-y)+')"/>'
       +'<ellipse cx="'+(w+2)+'" cy="'+(-y)+'" rx="'+w+'" ry="3.4" transform="rotate(28 '+(w+2)+' '+(-y)+')"/>';
  }
  return '<g transform="translate(150 250) rotate('+a+')"><g class="fr-grow" style="--o:'+(i*.07).toFixed(2)+'">'
   +'<circle class="fr-glow" style="--i:'+i+';animation-delay:'+(i*.04)+'s" cx="9" cy="'+(-h-4)+'" r="27"/>'
   +'<path d="M0 0C-3 '+(-h*.4)+' 2 '+(-h*.75)+' 0 '+(-h)+'" fill="none" stroke="#3d9a5e" stroke-width="4" stroke-linecap="round"/>'
   +'<g fill="#58c47a" stroke="#1f5a3a" stroke-width="1.2">'+lf+'</g>'
   +'<path d="M0 '+(-h)+'c0-12 14-16 19-6c4 9-5 16-12 12c-6-3-4-11 2-10" fill="none" stroke="#b9ff7a" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>'
   +'</g></g>';
}
function fernSVG(){
  var C=2*Math.PI*122;
  var fr=[[-46,92],[-23,122],[0,138],[23,116],[46,88]].map(function(f,i){return frondSVG(f[0],f[1],i);}).join('');
  return '<svg class="fr-svg" viewBox="0 0 300 280" aria-hidden="true"><defs><radialGradient id="frg"><stop offset="0" stop-color="#eaffb0" stop-opacity=".95"/><stop offset=".45" stop-color="#9dff8a" stop-opacity=".45"/><stop offset="1" stop-color="#9dff8a" stop-opacity="0"/></radialGradient></defs>'
   +'<circle class="fr-ring" cx="150" cy="140" r="122"/>'
   +'<circle class="fr-prog" id="fr-prog" cx="150" cy="140" r="122" transform="rotate(-90 150 140)" stroke-dasharray="'+C.toFixed(1)+'" stroke-dashoffset="'+C.toFixed(1)+'"/>'
   +'<ellipse cx="150" cy="252" rx="62" ry="7" fill="#000" opacity=".3"/>'
   +'<g class="fr-ferns">'+fr+'</g></svg>';
}

var F=null,raf=0;                     /* 螢光蕨狀態 */
var TEST={rms:null,f:null};                  /* 測試用：給值就當麥克風音量 */
function fernNew(kind){return {kind:kind||'fern',ref:0,seg:0,gap:0,hist:[],msg:'',isFern:true,prog:0,done:false,g:0,pulse:0,hold:false,holdT:0,holdOn:0,mic:null,micErr:'',calib:0,floor:0,floorN:0,thr:.02,avg:0,lastOn:-1,t:0,beats:0,last:0,blowT:0};}

function renderFern(){
  var bars='';for(var i=0;i<9;i++)bars+='<i></i>';
  $('#ob-body',el).innerHTML=
   '<div class="ob-stage fr-stage" id="ob-stage">'+'<div class="ob-sky"></div><div class="ob-moon"></div><div class="ob-grass"></div>'+fernSVG()
  +'<div class="fr-pct" id="fr-pct">0%</div></div>'
  +'<p class="ob-hint" id="ob-hint"></p>'
  +'<div class="fr-wave" id="fr-wave" aria-hidden="true">'+bars+'</div>'
  +'<p class="fr-sub" id="fr-sub"></p>'
  +'<div class="ob-card"><small>觀察筆記</small><p>'+((opts&&opts.note)||'')+'</p></div>'
  +'<div class="ob-btns"><button class="b" id="ob-intro">看介紹</button><button class="a" id="fr-start">開始吹奏</button></div>';
  var st=$('#ob-stage',el);
  st.addEventListener('pointerdown',function(e){if(F.done)return;F.hold=true;F.holdT=0;F.holdOn=0;try{st.setPointerCapture(e.pointerId);}catch(x){}audio();});
  ['pointerup','pointercancel','lostpointercapture'].forEach(function(t){st.addEventListener(t,function(){F.hold=false;});});
  st.addEventListener('contextmenu',function(e){e.preventDefault();});
  $('#ob-intro',el).addEventListener('click',close);
  $('#fr-start',el).addEventListener('click',onFernBtn);
  fernHint();
}
function fernHint(msg){
  var h=$('#ob-hint',el),sub=$('#fr-sub',el),b=$('#fr-start',el);if(!h)return;
  var lily=F.kind==='lily';
  if(F.done){h.textContent=lily?'睡蓮開了，月亮魚跳出來！':'河邊的燈火，亮起來了！';sub.textContent='';b.textContent='再吹一次';return;}
  b.textContent=F.mic?'再吹一次':'開始吹奏';
  if(msg){h.textContent=msg;}
  else if(F.calib>0)h.textContent='先安靜一下…';
  else if(lily)h.textContent=F.mic?'吹一個音，穩穩地吹。花苞會慢慢打開。':'按「開始吹奏」，吹一個音，穩穩地吹。';
  else h.textContent=F.mic?'對著新芽，吹一段陶笛。吹越久，長越大。':'按「開始吹奏」，對著新芽吹陶笛。';
  sub.textContent=F.mic?'':(F.micErr||'沒有麥克風？也可以按住畫面代替。');
}
function onFernBtn(){
  if(F.done){fernReset();return;}
  if(F.mic){fernReset();return;}
  startMic();
}
function startMic(){
  var nav=navigator.mediaDevices;
  if(!nav||!nav.getUserMedia){F.micErr='這個瀏覽器不能收音，請按住畫面代替（建議改用 Safari／Chrome）。';fernHint();return;}
  var c=audio();
  nav.getUserMedia({audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false}}).then(function(stream){
    if(!openFlag||!F){stream.getTracks().forEach(function(t){t.stop();});return;}
    var an=c.createAnalyser();an.fftSize=2048;
    var src=c.createMediaStreamSource(stream);src.connect(an);   /* 不接到喇叭 */
    F.mic={stream:stream,an:an,src:src,buf:new Float32Array(an.fftSize)};
    F.calib=.5;F.floor=0;F.floorN=0;F.micErr='';fernHint();
  }).catch(function(){F.micErr='麥克風沒有開啟，請按住畫面代替（或在 Safari／Chrome 允許麥克風）。';fernHint();});
}
function stopMic(){
  if(F&&F.mic){try{F.mic.src.disconnect();}catch(e){}try{F.mic.stream.getTracks().forEach(function(t){t.stop();});}catch(e){}F.mic=null;}
}
function readRms(){
  if(TEST.rms!=null)return TEST.rms;
  if(!F.mic)return null;
  var b=F.mic.buf;F.mic.an.getFloatTimeDomainData(b);
  var s=0;for(var i=0;i<b.length;i++)s+=b[i]*b[i];
  return Math.sqrt(s/b.length);
}
function fernClear(){var st=$('#ob-stage',el);if(!st)return;Array.prototype.forEach.call(st.querySelectorAll('.fr-fly,.lt-fish'),function(n){n.remove();});}
function fernReset(){fernClear();var o=F,r=fernNew(o.kind);r.mic=o.mic;r.thr=o.thr;r.avg=o.avg;F=r;var st=$('#ob-stage',el);if(st)st.classList.remove('beat');fernHint();}

function fernTick(ts){
  if(!openFlag||!F||F.kind!=='fern'){raf=0;return;}
  raf=requestAnimationFrame(fernTick);
  var dt=F.last?Math.min(.1,(ts-F.last)/1000):.016;F.last=ts;F.t+=dt;
  var st=$('#ob-stage',el);if(!st)return;
  var rms=readRms(),blow=false,lv=0,onset=false;
  if(rms!=null&&!F.done){
    if(F.calib>0){
      F.calib-=dt;F.floor+=rms;F.floorN++;
      if(F.calib<=0){var fl=F.floor/Math.max(1,F.floorN);F.thr=Math.max(.012,Math.min(.03,fl*2.5+.004));F.avg=fl;fernHint();}
    }else{
      blow=rms>F.thr;lv=Math.max(0,Math.min(1,(rms-F.thr)/.12));
      if(blow&&rms>F.avg*1.5+.004&&F.t-F.lastOn>.16){onset=true;F.lastOn=F.t;}
      F.avg=F.avg*.92+rms*.08;
    }
  }
  if(F.hold&&!F.done){                 /* 按住：綠光自己有節奏地跳 */
    blow=true;lv=Math.max(lv,.6+.3*Math.sin(F.holdT*9));F.holdT+=dt;
    if(F.holdOn<=0){onset=true;F.holdOn=.5;}else F.holdOn-=dt;
  }
  if(F.done){blow=false;}
  if(onset){F.pulse=1;F.beats++;st.classList.remove('beat');void st.offsetWidth;st.classList.add('beat');}
  F.pulse=Math.max(0,F.pulse-dt*4);
  var target=blow?.35+.65*lv:0;
  F.g+=(target-F.g)*Math.min(1,dt*(target>F.g?14:3.5));
  var g=F.done?1:Math.min(1,F.g+F.pulse*.3);
  st.style.setProperty('--g',g.toFixed(3));
  st.style.setProperty('--p',F.prog.toFixed(3));
  if(blow){F.blowT+=dt;F.prog=Math.min(1,F.prog+dt/BLOW_SEC);}
  var C=2*Math.PI*122,pr=$('#fr-prog',el);
  if(pr)pr.setAttribute('stroke-dashoffset',(C*(1-F.prog)).toFixed(1));
  $('#fr-pct',el).textContent=Math.round(F.prog*100)+'%';
  var bs=el.querySelectorAll('#fr-wave i');
  Array.prototype.forEach.call(bs,function(b,i){
    var k=blow?(.25+.75*lv)*(.55+.45*Math.sin(F.t*11+i*1.7)):0;
    b.style.height=(6+k*28).toFixed(0)+'px';
  });
  if(F.prog>=1&&!F.done){F.done=true;fernFinale();fernHint();}
}
function fernFinale(){
  var st=$('#ob-stage',el),n=18;
  for(var i=0;i<n;i++){
    var a=Math.random()*Math.PI*2,r=60+Math.random()*95;
    var f=document.createElement('span');f.className='fr-fly';
    f.style.cssText='--dx:'+(Math.cos(a)*r*1.15).toFixed(0)+'px;--dy:'+(-Math.abs(Math.sin(a))*r*1.05-18).toFixed(0)+'px;animation-delay:'+(i*.07).toFixed(2)+'s';
    f.innerHTML='<i style="--d:'+(Math.random()*1.2).toFixed(2)+'s;--wx:'+((Math.random()-.5)*34).toFixed(0)+'px;--wy:'+((Math.random()-.5)*28).toFixed(0)+'px"></i>';
    st.appendChild(f);
  }
}


/* ================= 月光睡蓮（第 2 島）=================
   吹任何音（不指定音）：音高穩住（±25 音分內、持續 0.4 秒後開始算）→ 花苞慢慢綻開；累計 6 秒盛開，月亮魚躍出。
   音飄了或停下來就暫停（不倒退）。只有動畫：不給獎勵、不記錄、不新增存檔。沒麥克風→按住畫面代替。 */
var LCSS=''
+'.lt-stage{background:linear-gradient(#090e2c 0%,#1a2a5c 48%,#143a56 100%)}'
+'.lt-water{position:absolute;left:0;right:0;bottom:0;height:34%;background:linear-gradient(#1a4a6a,#0c2a40);border-top:2px solid rgba(190,225,255,.5);pointer-events:none}'
+'.lt-flower{filter:brightness(calc(.82 + var(--g)*.45)) drop-shadow(0 0 calc(2px + var(--g)*14px) rgba(200,215,255,calc(.15 + var(--g)*.85)))}'
+'.lt-pet{--b:min(1,max(0,var(--p,0)*1.15 - var(--o,0)));transform-origin:0 0;transform:rotate(calc(var(--a)*(.14 + .86*var(--b)))) scale(calc(.62 + .38*var(--b)));transition:transform .2s linear;fill:url(#ltg);stroke:#7b6aa8;stroke-width:1.6;stroke-linejoin:round}'
+'.lt-core{fill:#ffe9a8;opacity:calc(.25 + var(--g)*.75)}'
+'.lt-rip{fill:none;stroke:rgba(210,235,255,.55);stroke-width:1.6;opacity:0;transform-box:fill-box;transform-origin:center}'
+'.lt-stage.calm .lt-rip{animation:ltrip 2.2s ease-out infinite;animation-delay:var(--d,0s)}'
+'.lt-fish{position:absolute;left:14%;top:64%;width:34px;height:22px;pointer-events:none;animation:ltjump 3.4s ease-in-out infinite both}'
+'.lt-sp i{background:#e8f4ff;box-shadow:0 0 12px 5px rgba(170,210,255,.9)}'
+'@keyframes ltrip{0%{transform:scale(.4);opacity:.9}100%{transform:scale(1.5);opacity:0}}'
+'@keyframes ltjump{0%{transform:translate(0,0) rotate(-50deg) scale(.6);opacity:0}6%{opacity:1}32%{transform:translate(52px,-96px) rotate(-6deg) scale(1)}52%{transform:translate(104px,2px) rotate(58deg) scale(.7);opacity:1}58%,100%{transform:translate(108px,8px) rotate(70deg) scale(.5);opacity:0}}'
+'@media (prefers-reduced-motion:reduce){.lt-pet{transition:none}.lt-stage.calm .lt-rip,.lt-fish{animation:none}}';

function petal(a,o,len){
  var l=len;
  return '<path class="lt-pet" style="--a:'+a+'deg;--o:'+o+'" d="M0 0C'+(-l*.24)+' '+(-l*.28)+' '+(-l*.22)+' '+(-l*.8)+' 0 '+(-l)+'C'+(l*.22)+' '+(-l*.8)+' '+(l*.24)+' '+(-l*.28)+' 0 0Z"/>';
}
function lilySVG(){
  var C=2*Math.PI*122,pet='';
  [-78,-52,-26,0,26,52,78].forEach(function(a,i){pet+=petal(a,(Math.abs(a)/78*.08).toFixed(2),66);});
  [-52,-26,0,26,52].forEach(function(a,i){pet+=petal(a,(.1+Math.abs(a)/52*.08).toFixed(2),52);});
  return '<svg class="fr-svg" viewBox="0 0 300 280" aria-hidden="true"><defs>'
   +'<linearGradient id="ltg" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#e6d3ff"/><stop offset="1" stop-color="#ffffff"/></linearGradient></defs>'
   +'<circle class="fr-ring" cx="150" cy="140" r="122"/>'
   +'<circle class="fr-prog" id="fr-prog" cx="150" cy="140" r="122" transform="rotate(-90 150 140)" stroke-dasharray="'+C.toFixed(1)+'" stroke-dashoffset="'+C.toFixed(1)+'"/>'
   +'<ellipse class="lt-rip" style="--d:0s" cx="150" cy="204" rx="70" ry="9"/><ellipse class="lt-rip" style="--d:.7s" cx="150" cy="204" rx="70" ry="9"/><ellipse class="lt-rip" style="--d:1.4s" cx="150" cy="204" rx="70" ry="9"/>'
   +'<ellipse cx="86" cy="214" rx="38" ry="8.5" fill="#2f7a54" stroke="#1d4d36" stroke-width="1.6"/><ellipse cx="216" cy="216" rx="34" ry="8" fill="#2f7a54" stroke="#1d4d36" stroke-width="1.6"/>'
   +'<ellipse cx="150" cy="206" rx="62" ry="10" fill="#2f7a54" stroke="#1d4d36" stroke-width="1.6"/>'
   +'<g class="lt-flower" transform="translate(150 200)">'+pet+'<circle class="lt-core" cx="0" cy="-8" r="9"/></g></svg>';
}
function fishHTML(){
  return '<svg viewBox="0 0 34 22" width="34" height="22" aria-hidden="true"><path d="M3 11C8 2 20 2 26 9L33 3V19L26 13C20 20 8 20 3 11Z" fill="#dfeaf5" stroke="#4a6a8a" stroke-width="1.4" stroke-linejoin="round"/><path d="M8 7.5q-2.5 3.5 0 7" fill="none" stroke="#ffe38a" stroke-width="1.8" stroke-linecap="round"/><circle cx="9.5" cy="9.5" r="1.1" fill="#2a3a5a"/></svg>';
}

/* 音高偵測：正規化自相關（同音準測試頁的做法）；回傳 {f,c} 或 null */
function detectPitch(x,sr){
  var n=x.length,minLag=Math.max(2,Math.floor(sr/3500)),maxLag=Math.min(Math.floor(sr/180),(n>>1)-1),m=n-maxLag,i,lag;
  var e0=0;for(i=0;i<m;i++)e0+=x[i]*x[i];
  if(e0<1e-9)return null;
  var e1=0;for(i=0;i<m;i++)e1+=x[i+minLag]*x[i+minLag];
  var c=new Float32Array(maxLag+2),mx=-1;
  for(lag=minLag;lag<=maxLag;lag++){
    var r=0;for(i=0;i<m;i++)r+=x[i]*x[i+lag];
    c[lag]=r/Math.sqrt(e0*e1+1e-12);if(c[lag]>mx)mx=c[lag];
    e1+=x[lag+m]*x[lag+m]-x[lag]*x[lag];
  }
  var pick=-1;
  for(lag=minLag+1;lag<maxLag;lag++){if(c[lag]>=.9*mx&&c[lag]>=c[lag-1]&&c[lag]>=c[lag+1]){pick=lag;break;}}
  if(pick<0)return null;
  var a=c[pick-1],b=c[pick],d=c[pick+1],den=a-2*b+d,sh=den?.5*(a-d)/den:0;
  return {f:sr/(pick+sh),c:b};
}
function median(a){var b=a.slice().sort(function(p,q){return p-q;});return b[b.length>>1];}

function renderLily(){
  var bars='';for(var i=0;i<9;i++)bars+='<i></i>';
  $('#ob-body',el).innerHTML=
   '<div class="ob-stage fr-stage lt-stage" id="ob-stage"><div class="ob-sky"></div><div class="ob-moon"></div><div class="lt-water"></div>'+lilySVG()
  +'<div class="fr-pct" id="fr-pct">0%</div></div>'
  +'<p class="ob-hint" id="ob-hint"></p>'
  +'<div class="fr-wave" id="fr-wave" aria-hidden="true">'+bars+'</div>'
  +'<p class="fr-sub" id="fr-sub"></p>'
  +'<div class="ob-card"><small>觀察筆記</small><p>'+((opts&&opts.note)||'')+'</p></div>'
  +'<div class="ob-btns"><button class="b" id="ob-intro">看介紹</button><button class="a" id="fr-start">開始吹奏</button></div>';
  var st=$('#ob-stage',el);
  st.addEventListener('pointerdown',function(e){if(F.done)return;F.hold=true;F.holdT=0;try{st.setPointerCapture(e.pointerId);}catch(x){}audio();});
  ['pointerup','pointercancel','lostpointercapture'].forEach(function(t){st.addEventListener(t,function(){F.hold=false;});});
  st.addEventListener('contextmenu',function(e){e.preventDefault();});
  $('#ob-intro',el).addEventListener('click',close);
  $('#fr-start',el).addEventListener('click',onFernBtn);
  fernHint();
}

function lilyTick(ts){
  if(!openFlag||!F||F.kind!=='lily'){raf=0;return;}
  raf=requestAnimationFrame(lilyTick);
  var dt=F.last?Math.min(.1,(ts-F.last)/1000):.016;F.last=ts;F.t+=dt;
  var st=$('#ob-stage',el);if(!st)return;
  var rms=readRms(),voiced=false,stable=false,lv=0,m='';
  if(!F.done){
    if(rms!=null){
      if(F.calib>0){
        F.calib-=dt;F.floor+=rms;F.floorN++;
        if(F.calib<=0){var fl=F.floor/Math.max(1,F.floorN);F.thr=Math.max(.012,Math.min(.03,fl*2.5+.004));fernHint();}
      }else{
        lv=Math.max(0,Math.min(1,(rms-F.thr)/.12));
        var pit=null;
        if(rms>F.thr){
          if(TEST.f!=null)pit={f:TEST.f,c:1};
          else if(F.mic)pit=detectPitch(F.mic.buf,F.mic.an.context.sampleRate);
        }
        if(pit&&pit.c>=.85&&pit.f>=180&&pit.f<=3500){
          F.gap=0;F.hist.push(pit.f);if(F.hist.length>5)F.hist.shift();
          var fm=median(F.hist);
          if(!F.ref||Math.abs(1200*Math.log(fm/F.ref)/Math.LN2)>25){F.ref=fm;F.seg=0;}else F.seg+=dt;
          voiced=true;stable=F.seg>=.4;
        }else{F.gap+=dt;if(F.gap>.25){F.ref=0;F.seg=0;F.hist=[];}}
      }
    }
    if(F.hold){voiced=true;stable=true;lv=Math.max(lv,.7);F.holdT+=dt;}
    if(F.calib<=0){m=stable?'很穩！繼續。':voiced?'穩住這個音…':'';}
    if(m!==F.msg){F.msg=m;fernHint(m||undefined);}
  }
  var target=stable?.55+.45*lv:voiced?.25:0;
  F.g+=(target-F.g)*Math.min(1,dt*6);
  if(stable)F.prog=Math.min(1,F.prog+dt/BLOW_SEC);
  var g=F.done?1:F.g;
  st.style.setProperty('--g',g.toFixed(3));st.style.setProperty('--p',F.prog.toFixed(3));
  st.classList.toggle('calm',stable||F.done);
  var C=2*Math.PI*122,pr=$('#fr-prog',el);
  if(pr)pr.setAttribute('stroke-dashoffset',(C*(1-F.prog)).toFixed(1));
  $('#fr-pct',el).textContent=Math.round(F.prog*100)+'%';
  Array.prototype.forEach.call(el.querySelectorAll('#fr-wave i'),function(b,i){
    var k=voiced?(.25+.75*lv)*(.6+.4*Math.sin(F.t*7+i*1.3)):0;b.style.height=(6+k*28).toFixed(0)+'px';
  });
  if(F.prog>=1&&!F.done){F.done=true;lilyFinale();fernHint();}
}
function lilyFinale(){
  var st=$('#ob-stage',el),f=document.createElement('span');
  f.className='lt-fish';f.innerHTML=fishHTML();st.appendChild(f);
  for(var i=0;i<12;i++){
    var a=Math.random()*Math.PI*2,r=55+Math.random()*90,s=document.createElement('span');s.className='fr-fly lt-sp';
    s.style.cssText='--dx:'+(Math.cos(a)*r*1.15).toFixed(0)+'px;--dy:'+(-Math.abs(Math.sin(a))*r*1.0-14).toFixed(0)+'px;animation-delay:'+(i*.08).toFixed(2)+'s';
    s.innerHTML='<i style="--d:'+(Math.random()*1.2).toFixed(2)+'s;--wx:'+((Math.random()-.5)*30).toFixed(0)+'px;--wy:'+((Math.random()-.5)*26).toFixed(0)+'px"></i>';
    st.appendChild(s);
  }
}

/* ---------- 進出 ---------- */
var GAMES={
  2:{title:function(A){return '對著'+(A?A.plant:'月光睡蓮');},render:function(){F=fernNew('lily');renderLily();raf=requestAnimationFrame(lilyTick);}},
  9:{title:function(A){return '點點'+(A?A.plant:'音符花');},render:renderPlant},
  5:{title:function(A){return '對著'+(A?A.plant:'螢光蕨');},render:function(){F=fernNew();renderFern();raf=requestAnimationFrame(fernTick);}}
};
function has(n){return !!GAMES[n];}
function open(n,o){
  if(!has(n))return;
  build();opts=o||{};S=newState();
  var A=window.ISLE_ART&&ISLE_ART.data[n-1];
  $('#ob-title',el).textContent=GAMES[n].title(A);
  $('#ob-sub',el).textContent='互動觀察'+(A?'・第 '+n+' 島 '+A.isle:'');
  openFlag=true;
  GAMES[n].render();
  el.hidden=false;
  try{opts.onOpen&&opts.onOpen();}catch(e){}
}
function close(){
  if(!openFlag)return;
  el.hidden=true;openFlag=false;
  if(raf){cancelAnimationFrame(raf);raf=0;}
  if(F){stopMic();F=null;}
  try{opts&&opts.onClose&&opts.onClose();}catch(e){}
}

window.DexObserve={has:has,open:open,close:close,isOpen:function(){return openFlag;},_played:played,_state:function(){return S;},_fern:function(){return F;},_test:TEST,_detect:detectPitch};
})();
