/* 陶笛失落地圖｜鑰匙碎片拼圖畫面（原創凱爾特金鑰匙，9 片對應 9 座島）
   用法：KeyPuzzle.open({open:已開島數, isles:[{n,name}], journalMax:能翻日記的最大島號, onJournal:n=>{}})
   規則：第 N 片＝第 N 島；已開的島亮起（金色），未開的島只有暗色輪廓；開啟時已拾獲的碎片依序飛來拼上。
   只有畫面，不新增存檔、不給獎勵。不照畫任何既有作品（千年積木等）；鑰匙造型為原創。 */
(function(){
  if(window.KeyPuzzle)return;
  var VB='0 0 300 520', NS='http://www.w3.org/2000/svg';

  /* ---------- 鑰匙造型（可換色盤）：三葉結環頭、編繩柄、階梯齒 ---------- */
  function keyArt(c){
    var S='stroke="'+c.stroke+'" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"';
    var dots='';
    for(var i=0;i<8;i++){var a=i*Math.PI/4+Math.PI/8;dots+='<circle cx="'+(150+72*Math.cos(a)).toFixed(1)+'" cy="'+(100+72*Math.sin(a)).toFixed(1)+'" r="4.2" fill="'+c.stroke+'" opacity=".85"/>';}
    var petals='';
    [0,120,240].forEach(function(r){
      petals+='<ellipse cx="150" cy="76" rx="17" ry="30" transform="rotate('+r+' 150 100)" fill="none" stroke="'+c.petalOut+'" stroke-width="10"/>';
    });
    [0,120,240].forEach(function(r){
      petals+='<ellipse cx="150" cy="76" rx="17" ry="30" transform="rotate('+r+' 150 100)" fill="none" stroke="'+c.petalIn+'" stroke-width="5"/>';
    });
    var rope='';
    for(var y=214;y<=470;y+=32){
      rope+='<path d="M135 '+y+' C150 '+(y+9)+' 150 '+(y+21)+' 165 '+(y+32)+' M165 '+y+' C150 '+(y+9)+' 150 '+(y+21)+' 135 '+(y+32)+'" fill="none" stroke="'+c.line+'" stroke-width="2.4" stroke-linecap="round"/>';
    }
    return ''
      +'<path fill-rule="evenodd" fill="'+c.fill+'" '+S+' d="M58 100a92 92 0 1 0 184 0a92 92 0 1 0 -184 0ZM100 100a50 50 0 1 1 100 0a50 50 0 1 1 -100 0Z"/>'
      +'<circle cx="150" cy="100" r="72" fill="none" stroke="'+c.line+'" stroke-width="2"/>'+dots+petals
      +'<rect x="118" y="186" width="64" height="24" rx="9" fill="'+c.fill+'" '+S+'/>'
      +'<rect x="135" y="205" width="30" height="295" rx="10" fill="'+c.fill+'" '+S+'/>'+rope
      +'<rect x="121" y="246" width="58" height="15" rx="7" fill="'+c.fill+'" '+S+'/>'
      +'<rect x="121" y="370" width="58" height="15" rx="7" fill="'+c.fill+'" '+S+'/>'
      +'<path d="M165 408h72v20h-26v14h26v20h-34v16h34v20h-72z" fill="'+c.fill+'" '+S+'/>'
      +'<circle cx="150" cy="486" r="5" fill="'+c.stroke+'" opacity=".8"/>';
  }
  var GOLD={fill:'url(#kpg)',stroke:'#4b2f0e',line:'#7a5218',petalOut:'#4b2f0e',petalIn:'url(#kpg)'};
  var DARK={fill:'rgba(255,255,255,.05)',stroke:'rgba(242,207,122,.42)',line:'rgba(242,207,122,.25)',petalOut:'rgba(242,207,122,.35)',petalIn:'rgba(255,255,255,.05)'};
  var MASK={fill:'#fff',stroke:'#fff',line:'#fff',petalOut:'#fff',petalIn:'#fff'};

  /* ---------- 9 片拼圖的切法（含小凸榫，讓它看起來像拼圖） ---------- */
  var N={A:[0,0],B:[150,0],C:[300,0],D:[0,100],E:[150,100],F:[300,100],G:[0,198],H:[150,198],I:[300,198],
         J:[0,300],K:[300,300],L:[0,400],M:[150,400],N:[300,400],O:[0,520],P:[150,520],Q:[300,520],R:[150,460],S:[300,460]};
  var EDGES={BE:0,DE:1,EF:0,EH:1,GH:0,HI:1,JK:0,LM:1,MN:0,MR:1,RP:0,RS:1};   /* 值＝凸榫朝向 */
  var PIECES=[['A','B','E','D'],['B','C','F','E'],['D','E','H','G'],['E','F','I','H'],['G','H','I','K','J'],
              ['J','K','N','M','L'],['L','M','R','P','O'],['M','N','S','R'],['R','S','Q','P']];
  function seg(u,v){
    var key=u+v,rev=false,sw;
    if(EDGES[key]!==undefined){sw=EDGES[key];}
    else if(EDGES[v+u]!==undefined){sw=1-EDGES[v+u];rev=true;}
    else return 'L'+N[v][0]+' '+N[v][1];
    var p=N[u],q=N[v],dx=q[0]-p[0],dy=q[1]-p[1],L=Math.hypot(dx,dy),ux=dx/L,uy=dy/L;
    var chord=Math.min(L*.24,34),r=chord*.62,m=L/2;
    var a=[p[0]+ux*(m-chord/2),p[1]+uy*(m-chord/2)],b=[p[0]+ux*(m+chord/2),p[1]+uy*(m+chord/2)];
    return 'L'+a[0].toFixed(1)+' '+a[1].toFixed(1)+'A'+r.toFixed(1)+' '+r.toFixed(1)+' 0 1 '+sw+' '+b[0].toFixed(1)+' '+b[1].toFixed(1)+'L'+q[0]+' '+q[1];
  }
  function piecePath(k){
    var v=PIECES[k],d='M'+N[v[0]][0]+' '+N[v[0]][1];
    for(var i=0;i<v.length;i++)d+=seg(v[i],v[(i+1)%v.length]);
    return d+'Z';
  }

  var css=''
  +'#kp{position:fixed;inset:0;z-index:70;display:flex;flex-direction:column;align-items:center;color:#FFF3CF;font-family:var(--font-head,serif);'
  +'background:radial-gradient(120% 80% at 50% 28%,#262e63 0,#0d1030 78%);overflow:hidden}'
  +'#kp[hidden]{display:none}'
  +'#kp .kp-close{position:absolute;left:max(12px,env(safe-area-inset-left,0px));top:calc(env(safe-area-inset-top,0px) + 10px);width:44px;height:44px;border-radius:50%;border:1.5px solid rgba(242,207,122,.85);background:rgba(10,12,34,.55);color:#F2CF7A;font-size:26px;line-height:1;cursor:pointer}'
  +'#kp .kp-top{margin-top:calc(env(safe-area-inset-top,0px) + 14px);text-align:center;padding:0 64px}'
  +'#kp .kp-title{font-size:26px;letter-spacing:.3em;padding-left:.3em;color:#F2CF7A;text-shadow:0 2px 8px rgba(0,0,0,.8)}'
  +'#kp .kp-count{margin-top:4px;font-size:17px;letter-spacing:.12em;min-height:1.7em;color:#FFF3CF;text-shadow:0 1px 6px rgba(0,0,0,.9)}'
  +'#kp .kp-stage{flex:1;min-height:0;width:100%;display:grid;place-items:center;padding:6px 12px}'
  +'#kp svg{height:100%;max-height:520px;width:auto;max-width:100%;overflow:visible;filter:drop-shadow(0 6px 14px rgba(0,0,0,.55))}'
  +'#kp .pc{transform-box:fill-box;transform-origin:center;transition:transform .7s cubic-bezier(.2,1.25,.4,1),opacity .35s}'
  +'#kp .pc.fly{opacity:0}'
  +'#kp .hit{fill:transparent;pointer-events:all;cursor:pointer;stroke:none}'
  +'#kp .hit:focus-visible{outline:none;stroke:#F2CF7A;stroke-width:3}'
  +'#kp .sel{fill:rgba(255,243,196,.28);stroke:#fff3c4;stroke-width:4;pointer-events:none;opacity:0}'
  +'#kp .sel.on{opacity:1}'
  +'#kp .seam{fill:none;stroke:rgba(75,47,14,.55);stroke-width:1.6}'
  +'#kp.full svg{animation:kpglow 2.4s ease-in-out infinite}'
  +'@keyframes kpglow{50%{filter:drop-shadow(0 0 18px rgba(255,214,107,.85))}}'
  +'#kp .kp-cap{width:min(92vw,440px);margin:0 0 calc(env(safe-area-inset-bottom,0px) + 16px);padding:12px 16px;text-align:center;font-size:16px;line-height:1.7;'
  +'border-radius:10px;background:rgba(255,255,255,.08);box-shadow:inset 0 0 0 2px rgba(242,207,122,.75);-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px)}'
  +'#kp .kp-cap b{color:#F2CF7A;font-weight:400}'
  +'#kp .kp-cap button{margin-top:8px;min-height:44px;padding:0 22px;border-radius:8px;border:0;background:rgba(242,207,122,.18);color:#FFF3CF;font:inherit;box-shadow:inset 0 0 0 2px rgba(242,207,122,.9);cursor:pointer}'
  +'@media (prefers-reduced-motion:reduce){#kp .pc{transition:none}#kp.full svg{animation:none}}';

  var root=null,timers=[],cfg=null,sel=0;
  function T(f,ms){var id=setTimeout(f,ms);timers.push(id);return id;}
  function clearT(){timers.forEach(clearTimeout);timers=[];}
  function el(){
    if(root)return root;
    var st=document.createElement('style');st.textContent=css;document.head.appendChild(st);
    root=document.createElement('div');root.id='kp';root.hidden=true;root.setAttribute('role','dialog');root.setAttribute('aria-label','鑰匙碎片');
    root.innerHTML='<button type="button" class="kp-close" aria-label="返回">‹</button>'
      +'<div class="kp-top"><div class="kp-title">鑰匙碎片</div><div class="kp-count" id="kp-count"></div></div>'
      +'<div class="kp-stage" id="kp-stage"></div><div class="kp-cap" id="kp-cap"></div>';
    document.body.appendChild(root);
    root.querySelector('.kp-close').addEventListener('click',close);
    document.addEventListener('keydown',function(e){if(e.key==='Escape'&&root&&!root.hidden)close();});
    return root;
  }
  function nameOf(n){var I=(cfg.isles||[]).filter(function(x){return x.n===n;})[0];return I?I.name:'第 '+n+' 島';}
  function caption(k){
    var n=k+1,lit=n<=cfg.open,cap=document.getElementById('kp-cap');
    var h='<b>第 '+n+' 島・'+nameOf(n)+'</b><br>'+(lit?'這一片已經拾獲了。':'還沒拾獲。開啟這座島，就會得到這一片。');
    if(lit&&n<=(cfg.journalMax||0))h+='<br><button type="button" id="kp-j">翻閱日記</button>';
    cap.innerHTML=h;
    var b=document.getElementById('kp-j');if(b)b.onclick=function(){close();cfg.onJournal&&cfg.onJournal(n);};
    document.querySelectorAll('#kp .sel').forEach(function(s,i){s.classList.toggle('on',i===k);});
  }
  function build(){
    var open=Math.max(0,Math.min(9,cfg.open|0)),reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion:reduce)').matches;
    var defs='<defs><linearGradient id="kpg" gradientUnits="userSpaceOnUse" x1="40" y1="0" x2="260" y2="520">'
      +'<stop offset="0" stop-color="#fff3c4"/><stop offset=".35" stop-color="#e8bc58"/><stop offset=".7" stop-color="#c8963a"/><stop offset="1" stop-color="#8a5f22"/></linearGradient>'
      +'<mask id="kpm" maskUnits="userSpaceOnUse" x="-20" y="-20" width="340" height="560"><g>'+keyArt(MASK)+'</g></mask>';
    for(var k=0;k<9;k++)defs+='<clipPath id="kpc'+k+'"><path d="'+piecePath(k)+'"/></clipPath>';
    defs+='</defs>';
    var s='<svg viewBox="'+VB+'" role="group" aria-label="鑰匙碎片拼圖" xmlns="'+NS+'">'+defs+'<g>'+keyArt(DARK)+'</g>';
    for(k=0;k<9;k++){
      if(k<open)s+='<g class="pc'+(reduce?'':' fly')+'" data-k="'+k+'"><g clip-path="url(#kpc'+k+')">'+keyArt(GOLD)+'</g><g mask="url(#kpm)"><path class="seam" d="'+piecePath(k)+'"/></g></g>';
    }
    s+='<g mask="url(#kpm)">';for(k=0;k<9;k++)s+='<path class="sel" d="'+piecePath(k)+'"/>';s+='</g>';
    for(k=0;k<9;k++)s+='<path class="hit" tabindex="0" role="button" aria-label="第 '+(k+1)+' 島的鑰匙碎片" data-k="'+k+'" d="'+piecePath(k)+'"/>';
    s+='</svg>';
    var stage=document.getElementById('kp-stage');stage.innerHTML=s;
    stage.querySelectorAll('.hit').forEach(function(h){
      var go=function(){sel=+h.getAttribute('data-k');caption(sel);};
      h.addEventListener('click',go);h.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();go();}});
    });
    return {open:open,reduce:reduce};
  }
  function open(c){
    cfg=c||{};el();clearT();sel=0;
    var b=build(),count=document.getElementById('kp-count');
    root.classList.remove('full');root.hidden=false;
    caption(Math.max(0,Math.min(8,b.open-1)));sel=Math.max(0,Math.min(8,b.open-1));
    var done=function(){
      count.textContent='已拼好 '+b.open+' ／ 9 片';
      if(b.open>=9){root.classList.add('full');window.Sfx&&Sfx.ok&&Sfx.ok();}
    };
    if(b.open===0){count.textContent='還沒有碎片。開啟第 1 島就會得到第一片。';return;}
    if(b.reduce){done();return;}
    count.textContent='正在拼湊鑰匙…';
    var pcs=Array.prototype.slice.call(root.querySelectorAll('.pc'));
    pcs.forEach(function(p,i){
      var ang=(i*67%360)*Math.PI/180,dist=150+(i%3)*40;
      p.style.transition='none';
      p.style.transform='translate('+(Math.cos(ang)*dist).toFixed(0)+'px,'+(Math.sin(ang)*dist-60).toFixed(0)+'px) rotate('+((i%2?1:-1)*(18+i*5))+'deg)';
    });
    void root.offsetWidth;
    pcs.forEach(function(p,i){
      T(function(){p.style.transition='';p.classList.remove('fly');p.style.transform='none';},300+i*340);
      T(function(){window.Sfx&&Sfx.snap&&Sfx.snap();},300+i*340+520);
    });
    T(done,300+pcs.length*340+700);
  }
  function close(){clearT();if(root)root.hidden=true;}
  window.KeyPuzzle={open:open,close:close,isOpen:function(){return !!root&&!root.hidden;},_piecePath:piecePath};
})();
