/* 精靈穿戴道具（向量圖）：畫在精靈 200×300 的座標上，來源＝設計畫布「陶笛精靈 18 件穿戴道具（向量圖）」。
   PropArt.svg[id] ＝ 該道具的 SVG 片段；PropArt.back[id]＝true 表示畫在精靈後面（披風、背景）。
   需要頁面先放好 <filter id="wob">；彩虹披風用 <linearGradient id="rbg">（見 game-test.html 的隱藏 defs）。 */
(function(){
const K='stroke="#4a2c1a" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"';
const T='stroke="#4a2c1a" stroke-width="2" stroke-linejoin="round"';
const P=(pts,f)=>'<polygon points="'+pts+'" fill="'+f+'" '+T+'/>';
const W=(tf,inner)=>'<g transform="'+tf+'"><g filter="url(#wob)">'+inner+'</g></g>';
const svg={},back={};

svg.hat_star=W('translate(125 52) scale(1.3) translate(-125 -46)',
 '<path d="M84,47 C96,22 110,-2 142,-26 C136,-2 152,24 169,45 Z" fill="#6f55b0" '+K+'/>'+
 '<ellipse cx="127" cy="47" rx="65" ry="12" transform="rotate(7 127 47)" fill="#5a418f" '+K+'/>'+
 '<path d="M92,36 Q128,50 165,36 L167,45 Q128,60 90,46Z" fill="#d9a441" '+K+'/>'+
 P('120.0,10.5 121.7,14.6 126.2,15.0 122.8,17.9 123.8,22.3 120.0,19.9 116.2,22.3 117.2,17.9 113.8,15.0 118.3,14.6','#f6c744')+
 P('146.0,-4.0 147.3,-0.8 150.8,-0.5 148.1,1.7 148.9,5.0 146.0,3.2 143.1,5.0 143.9,1.7 141.2,-0.5 144.7,-0.8','#f6c744')+
 P('106.0,28.5 107.2,31.4 110.3,31.6 107.9,33.6 108.6,36.6 106.0,35.0 103.4,36.6 104.1,33.6 101.7,31.6 104.8,31.4','#f6c744')+
 P('150.0,24.5 151.2,27.4 154.3,27.6 151.9,29.6 152.6,32.6 150.0,31.0 147.4,32.6 148.1,29.6 145.7,27.6 148.8,27.4','#fff2c0'));

(function(){
 const c=(x,y,r)=>'<circle cx="'+x+'" cy="'+y+'" r="'+r+'" fill="#fffdf5" '+K+'/>';
 const f=(x,y,r)=>'<circle cx="'+x+'" cy="'+y+'" r="'+r+'" fill="#fffdf5"/>';
 svg.hat_cloud=W('translate(118 46) scale(1.25) translate(-118 -40)',
  c(96,32,18)+c(120,12,24)+c(146,18,22)+c(160,36,15)+c(110,40,16)+c(136,38,18)+
  f(96,32,16.5)+f(120,12,22.5)+f(146,18,20.5)+f(160,36,13.5)+f(110,40,14.5)+f(136,38,16.5)+
  '<path d="M80,52 Q124,68 172,50 L170,40 Q124,56 82,42Z" fill="#8fb8e8" '+K+'/>'+
  P('126.0,44.5 127.7,48.6 132.2,49.0 128.8,51.9 129.8,56.3 126.0,53.9 122.2,56.3 123.2,51.9 119.8,49.0 124.3,48.6','#f6c744')+
  c(120,-14,5));
})();

svg.hat_straw=W('translate(124 52) scale(1.1) translate(-124 -48)',
 '<ellipse cx="124" cy="48" rx="78" ry="15" transform="rotate(6 124 48)" fill="#f2d27c" '+K+'/>'+
 '<path d="M84,46 C84,4 124,-12 152,4 C170,14 170,36 170,46 Z" fill="#f7e19a" '+K+'/>'+
 '<path d="M84,44 Q126,58 168,42 L168,33 Q126,48 84,35Z" fill="#8a5a3a" '+K+'/>'+
 '<path d="M96,16 q14,-8 30,-8 M102,28 q22,-8 42,-4" fill="none" stroke="#d8b25a" stroke-width="2"/>'+
 '<path d="M160,42 q12,-14 22,-6 q-4,12 -22,6" fill="#7fb46a" '+K+'/>'+
 '<circle cx="154" cy="42" r="7" fill="#f08aa0" '+K+'/>'+
 '<circle cx="154" cy="42" r="2.5" fill="#f6c744" stroke="#4a2c1a" stroke-width="1.5"/>');

svg.head_band=W('translate(103 72) scale(1.0) translate(-100 -60)',
 '<path d="M40,76 C66,40 106,20 140,22 C166,26 180,50 186,84" fill="none" stroke="#4a2c1a" stroke-width="13" stroke-linecap="round"/>'+
 '<path d="M40,76 C66,40 106,20 140,22 C166,26 180,50 186,84" fill="none" stroke="#3a4a86" stroke-width="7" stroke-linecap="round"/>'+
 P('112.0,11.0 114.4,16.7 120.6,17.2 115.9,21.3 117.3,27.3 112.0,24.1 106.7,27.3 108.1,21.3 103.4,17.2 109.6,16.7','#f6c744')+
 P('76.0,42.0 77.3,45.2 80.8,45.5 78.1,47.7 78.9,51.0 76.0,49.2 73.1,51.0 73.9,47.7 71.2,45.5 74.7,45.2','#f6c744')+
 P('152.0,16.0 153.3,19.2 156.8,19.5 154.1,21.7 154.9,25.0 152.0,23.2 149.1,25.0 149.9,21.7 147.2,19.5 150.7,19.2','#fff2c0')+
 '<path d="M166,26 a13,13 0 1 0 12,24 a10,10 0 1 1 -12,-24Z" fill="#f6c744" '+K+'/>');

svg.goggles=W('translate(112 86) scale(1.2) translate(-112 -86)',
 '<path d="M60,88 Q104,70 168,86" fill="none" stroke="#4a2c1a" stroke-width="9" stroke-linecap="round"/>'+
 '<path d="M60,88 Q104,70 168,86" fill="none" stroke="#8a5a3a" stroke-width="5" stroke-linecap="round"/>'+
 '<rect x="104" y="80" width="16" height="9" rx="3" fill="#c9902f" '+K+'/>'+
 '<circle cx="90" cy="86" r="17" fill="#bfe3f5" stroke="#4a2c1a" stroke-width="5"/>'+
 '<circle cx="134" cy="86" r="17" fill="#bfe3f5" stroke="#4a2c1a" stroke-width="5"/>'+
 '<circle cx="90" cy="86" r="17" fill="none" stroke="#d9a441" stroke-width="2"/>'+
 '<circle cx="134" cy="86" r="17" fill="none" stroke="#d9a441" stroke-width="2"/>'+
 '<path d="M80,80 q4,-6 12,-6 M124,80 q4,-6 12,-6" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>');

const FIST='<ellipse cx="{x}" cy="{y}" rx="9" ry="8.5" fill="#fb9469" '+K+'/>';
const fist=(x,y)=>FIST.replace('{x}',x).replace('{y}',y);

svg.sword=W('translate(52 250) scale(1.4) translate(-52 -250)',
 '<path d="M52,168 L45,232 L59,232Z" fill="#e3ebf3" '+K+'/>'+
 '<path d="M52,176 L52,230" stroke="#9db4c8" stroke-width="2"/>'+
 '<rect x="37" y="231" width="30" height="9" rx="4" fill="#e0a63a" '+K+'/>'+
 '<circle cx="52" cy="235.5" r="3" fill="#4aa7ea" stroke="#4a2c1a" stroke-width="1.5"/>'+
 '<rect x="49" y="240" width="6" height="22" rx="2" fill="#8a5a3a" '+K+'/>'+
 '<circle cx="52" cy="266" r="5.5" fill="#e0a63a" stroke="#4a2c1a" stroke-width="2.5"/>'+
 fist(52,250));

svg.staff=W('translate(52 246) scale(1.05) translate(-52 -246)',
 '<path d="M44,282 L61,178" stroke="#4a2c1a" stroke-width="8" stroke-linecap="round"/>'+
 '<path d="M44,282 L61,178" stroke="#b98240" stroke-width="4" stroke-linecap="round"/>'+
 '<path d="M46,270 q10,-6 2,-14 q-10,-6 0,-16 q10,-6 3,-16 q-6,-8 4,-16 q8,-6 3,-14" fill="none" stroke="#5f9c50" stroke-width="4" stroke-linecap="round"/>'+
 '<path d="M62,182 q-12,-4 -14,-14 q10,0 14,14Z M62,182 q12,-4 16,-12 q-10,-2 -16,12Z" fill="#7fb46a" '+K+'/>'+
 '<circle cx="63" cy="164" r="14" fill="#4aa7ea" '+K+'/>'+
 '<circle cx="58" cy="159" r="4" fill="#d7efff"/>'+
 fist(51,246));

svg.bow=W('translate(50 244) scale(1.2) translate(-50 -244)',
 '<path d="M68,190 Q30,244 68,298" fill="none" stroke="#4a2c1a" stroke-width="8" stroke-linecap="round"/>'+
 '<path d="M68,190 Q30,244 68,298" fill="none" stroke="#b97a3a" stroke-width="4" stroke-linecap="round"/>'+
 '<path d="M68,190 L68,298" stroke="#7a5a3a" stroke-width="2"/>'+
 '<path d="M52,250 L112,200" stroke="#4a2c1a" stroke-width="3" stroke-linecap="round"/>'+
 '<path d="M112,200 l-12,2 l8,10Z" fill="#c9d3dc" '+K+'/>'+
 '<path d="M52,250 l-8,-2 M54,254 l-8,-2" stroke="#e86a6a" stroke-width="3" stroke-linecap="round"/>'+
 fist(50,244));

svg.book=W('translate(48 250) scale(1.35) translate(-48 -250)',
 '<rect x="46" y="222" width="46" height="40" rx="4" fill="#fff3d6" '+K+'/>'+
 '<rect x="42" y="216" width="46" height="40" rx="4" fill="#35406e" '+K+'/>'+
 '<rect x="47" y="221" width="36" height="30" rx="2" fill="none" stroke="#d9a441" stroke-width="2"/>'+
 '<rect x="42" y="216" width="6" height="40" fill="#2a3358" '+K+'/>'+
 P('66.0,227.0 68.4,232.7 74.6,233.2 69.9,237.3 71.3,243.3 66.0,240.1 60.7,243.3 62.1,237.3 57.4,233.2 63.6,232.7','#f6c744')+
 fist(48,250));

svg.compass=W('translate(52 252) scale(1.4) translate(-52 -252)',
 '<path d="M52,212 L52,204" stroke="#4a2c1a" stroke-width="3"/>'+
 '<rect x="47" y="200" width="10" height="6" rx="2" fill="#d9a441" '+K+'/>'+
 '<circle cx="52" cy="232" r="18" fill="#d9a441" stroke="#4a2c1a" stroke-width="3.5"/>'+
 '<circle cx="52" cy="232" r="13" fill="#fff3d6" stroke="#4a2c1a" stroke-width="2"/>'+
 '<polygon points="52,220 57,232 52,244 47,232" fill="#e8e0d0" stroke="#4a2c1a" stroke-width="1.5" transform="rotate(35 52 232)"/>'+
 '<polygon points="52,220 57,232 47,232" fill="#e5594f" transform="rotate(35 52 232)"/>'+
 fist(52,252));

svg.potion=W('translate(52 256) scale(1.4) translate(-52 -256)',
 '<rect x="46" y="212" width="12" height="8" rx="2" fill="#8a5a3a" '+K+'/>'+
 '<rect x="47" y="219" width="10" height="12" fill="#e6f3f7" '+K+'/>'+
 '<circle cx="52" cy="242" r="16" fill="#b57ae0" '+K+'/>'+
 '<path d="M40,246 q12,-8 24,0" fill="none" stroke="#e9d3ff" stroke-width="3" stroke-linecap="round"/>'+
 P('72.0,222.0 73.3,225.2 76.8,225.5 74.1,227.7 74.9,231.0 72.0,229.2 69.1,231.0 69.9,227.7 67.2,225.5 70.7,225.2','#f6c744')+
 P('34.0,221.5 35.2,224.4 38.3,224.6 35.9,226.6 36.6,229.6 34.0,228.0 31.4,229.6 32.1,226.6 29.7,224.6 32.8,224.4','#fff2c0')+
 fist(52,258));

const PTF='translate(176 292) scale(1.3) translate(-180 -292)';
svg.pet_rabbit=W(PTF,
 '<ellipse cx="164" cy="232" rx="5.5" ry="15" transform="rotate(-10 164 232)" fill="#3d3545" stroke="#1e1822" stroke-width="3"/>'+
 '<ellipse cx="182" cy="232" rx="5.5" ry="15" transform="rotate(10 182 232)" fill="#3d3545" stroke="#1e1822" stroke-width="3"/>'+
 '<ellipse cx="164" cy="233" rx="2.5" ry="10" transform="rotate(-10 164 233)" fill="#f2a0b0"/>'+
 '<ellipse cx="182" cy="233" rx="2.5" ry="10" transform="rotate(10 182 233)" fill="#f2a0b0"/>'+
 '<circle cx="193" cy="280" r="6" fill="#f4eee6" stroke="#1e1822" stroke-width="3"/>'+
 '<ellipse cx="173" cy="276" rx="21" ry="18" fill="#3d3545" stroke="#1e1822" stroke-width="3"/>'+
 '<circle cx="173" cy="254" r="16" fill="#3d3545" stroke="#1e1822" stroke-width="3"/>'+
 '<circle cx="167" cy="254" r="2.6" fill="#fff"/><circle cx="179" cy="254" r="2.6" fill="#fff"/>'+
 '<circle cx="167.5" cy="254.3" r="1.2" fill="#000"/><circle cx="179.5" cy="254.3" r="1.2" fill="#000"/>'+
 '<path d="M171,259 l4,0 l-2,3Z" fill="#f2a0b0"/>'+
 '<circle cx="163" cy="260" r="3" fill="#f08aa0" opacity=".7"/><circle cx="183" cy="260" r="3" fill="#f08aa0" opacity=".7"/>'+
 '<ellipse cx="164" cy="292" rx="7" ry="4" fill="#2d2636" stroke="#1e1822" stroke-width="2.5"/>'+
 '<ellipse cx="182" cy="292" rx="7" ry="4" fill="#2d2636" stroke="#1e1822" stroke-width="2.5"/>');

svg.pet_fox=W(PTF,
 '<path d="M186,286 C210,284 214,258 200,252 C204,268 194,274 184,272Z" fill="#fff6e6" '+K+'/>'+
 '<path d="M200,252 C206,258 206,266 203,272 C200,266 198,258 200,252Z" fill="#f4a357"/>'+
 '<ellipse cx="172" cy="276" rx="19" ry="16" fill="#fff6e6" '+K+'/>'+
 '<path d="M156,252 L158,232 L170,244Z M188,252 L186,232 L174,244Z" fill="#f4a357" '+K+'/>'+
 '<ellipse cx="172" cy="255" rx="18" ry="14" fill="#fff6e6" '+K+'/>'+
 '<circle cx="165" cy="254" r="2.4" fill="#3a2418"/><circle cx="179" cy="254" r="2.4" fill="#3a2418"/>'+
 '<path d="M170,259 l4,0 l-2,3Z" fill="#3a2418"/>'+
 '<circle cx="161" cy="260" r="3" fill="#f6a8a8" opacity=".8"/><circle cx="183" cy="260" r="3" fill="#f6a8a8" opacity=".8"/>'+
 '<ellipse cx="164" cy="291" rx="7" ry="4" fill="#fff6e6" '+K+'/>'+
 '<ellipse cx="180" cy="291" rx="7" ry="4" fill="#fff6e6" '+K+'/>');

svg.pet_owl=W(PTF,
 '<ellipse cx="172" cy="270" rx="19" ry="24" fill="#c88b4a" '+K+'/>'+
 '<ellipse cx="172" cy="276" rx="11" ry="16" fill="#f2d9a0" stroke="#4a2c1a" stroke-width="2"/>'+
 '<path d="M166,272 q3,3 6,0 M172,272 q3,3 6,0 M166,280 q3,3 6,0 M172,280 q3,3 6,0" fill="none" stroke="#c88b4a" stroke-width="2"/>'+
 '<path d="M155,252 L157,236 L168,246Z M189,252 L187,236 L176,246Z" fill="#a8703a" '+K+'/>'+
 '<ellipse cx="158" cy="272" rx="6" ry="14" transform="rotate(8 158 272)" fill="#a8703a" '+K+'/>'+
 '<ellipse cx="186" cy="272" rx="6" ry="14" transform="rotate(-8 186 272)" fill="#a8703a" '+K+'/>'+
 '<circle cx="164" cy="255" r="8" fill="#fff8e8" stroke="#4a2c1a" stroke-width="2.5"/>'+
 '<circle cx="180" cy="255" r="8" fill="#fff8e8" stroke="#4a2c1a" stroke-width="2.5"/>'+
 '<circle cx="164" cy="256" r="4" fill="#3a2418"/><circle cx="180" cy="256" r="4" fill="#3a2418"/>'+
 '<circle cx="165.5" cy="254.5" r="1.3" fill="#fff"/><circle cx="181.5" cy="254.5" r="1.3" fill="#fff"/>'+
 '<path d="M169,262 l6,0 l-3,6Z" fill="#f09a3a" '+K+'/>'+
 '<path d="M164,294 l0,-4 M168,294 l0,-4 M176,294 l0,-4 M180,294 l0,-4" stroke="#f09a3a" stroke-width="3" stroke-linecap="round"/>');

const CAPE='M84,166 C56,196 18,246 4,286 q12.1,14 24.2,0 q12.1,14 24.2,0 q12.1,14 24.2,0 q12.1,14 24.2,0 q12.1,14 24.2,0 q12.1,14 24.2,0 q12.1,14 24.2,0 q12.1,14 24.2,0 C190,246 152,196 120,166 Z';
const NECK='<path d="M84,166 Q102,176 120,166" fill="none" stroke="#e0a63a" stroke-width="5" stroke-linecap="round"/>';
svg.cape_star='<g filter="url(#wob)"><path d="'+CAPE+'" fill="#34408a" '+K+'/>'+
 P('40.0,254.5 41.5,258.0 45.2,258.3 42.4,260.8 43.2,264.4 40.0,262.5 36.8,264.4 37.6,260.8 34.8,258.3 38.5,258.0','#f6c744')+
 P('70.0,238.5 71.2,241.4 74.3,241.6 71.9,243.6 72.6,246.6 70.0,245.0 67.4,246.6 68.1,243.6 65.7,241.6 68.8,241.4','#f6c744')+
 P('150.0,244.5 151.5,248.0 155.2,248.3 152.4,250.8 153.2,254.4 150.0,252.5 146.8,254.4 147.6,250.8 144.8,248.3 148.5,248.0','#f6c744')+
 P('172.0,264.5 173.2,267.4 176.3,267.6 173.9,269.6 174.6,272.6 172.0,271.0 169.4,272.6 170.1,269.6 167.7,267.6 170.8,267.4','#f6c744')+
 P('112.0,270.5 113.2,273.4 116.3,273.6 113.9,275.6 114.6,278.6 112.0,277.0 109.4,278.6 110.1,275.6 107.7,273.6 110.8,273.4','#f6c744')+
 P('56.0,206.0 57.1,208.5 59.8,208.8 57.7,210.6 58.4,213.2 56.0,211.8 53.6,213.2 54.3,210.6 52.2,208.8 54.9,208.5','#f6c744')+
 P('134.0,210.0 135.1,212.5 137.8,212.8 135.7,214.6 136.4,217.2 134.0,215.8 131.6,217.2 132.3,214.6 130.2,212.8 132.9,212.5','#f6c744')+
 NECK+'</g>';
svg.cape_rainbow='<g filter="url(#wob)"><path d="'+CAPE+'" fill="url(#rbg)" '+K+'/>'+
 P('48.0,257.0 49.3,260.2 52.8,260.5 50.1,262.7 50.9,266.0 48.0,264.2 45.1,266.0 45.9,262.7 43.2,260.5 46.7,260.2','#fff')+
 P('150.0,253.0 151.3,256.2 154.8,256.5 152.1,258.7 152.9,262.0 150.0,260.2 147.1,262.0 147.9,258.7 145.2,256.5 148.7,256.2','#fff')+
 P('112.0,273.0 113.1,275.5 115.8,275.8 113.7,277.6 114.4,280.2 112.0,278.8 109.6,280.2 110.3,277.6 108.2,275.8 110.9,275.5','#fff')+
 '<path d="M84,166 Q102,176 120,166" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"/></g>';

svg.bg_island='<g filter="url(#wob)">'+
 '<path d="M-4,290 Q20,326 60,334 Q104,356 142,332 Q186,322 204,290 Z" fill="#9a7a5a" '+K+'/>'+
 '<path d="M30,306 q8,6 14,0 M90,322 q8,6 14,0 M130,310 q8,6 14,0" fill="none" stroke="#7a5a3a" stroke-width="2.5" stroke-linecap="round"/>'+
 '<path d="M168,296 L176,296 L178,346 L166,346Z" fill="#8fd0f5" stroke="#3a86c8" stroke-width="2"/>'+
 '<ellipse cx="100" cy="288" rx="104" ry="20" fill="#8cc46a" '+K+'/>'+
 '<rect x="14" y="260" width="6" height="22" fill="#8a5a3a" '+K+'/>'+
 '<circle cx="17" cy="254" r="14" fill="#5fa855" '+K+'/>'+
 '<rect x="184" y="262" width="5" height="20" fill="#8a5a3a" '+K+'/>'+
 '<circle cx="186" cy="256" r="12" fill="#5fa855" '+K+'/>'+
 '<circle cx="48" cy="292" r="4" fill="#f08aa0" stroke="#4a2c1a" stroke-width="2"/>'+
 '<circle cx="152" cy="294" r="4" fill="#f6c744" stroke="#4a2c1a" stroke-width="2"/>'+
 '<circle cx="120" cy="296" r="3.5" fill="#fff" stroke="#4a2c1a" stroke-width="2"/></g>';

(function(){
 const arc=(r,col)=>'<path d="M'+(100-r)+',115 A'+r+','+r+' 0 0 1 '+(100+r)+',115" fill="none" stroke="'+col+'" stroke-width="10"/>';
 const cl=(x,y,r)=>'<circle cx="'+x+'" cy="'+y+'" r="'+r+'" fill="#fffdf5" '+K+'/>';
 const cf=(x,y,r)=>'<circle cx="'+x+'" cy="'+y+'" r="'+r+'" fill="#fffdf5"/>';
 svg.bg_rcloud='<g filter="url(#wob)">'+
  arc(150,'#f08a8a')+arc(140,'#f7b27a')+arc(130,'#f7e07a')+arc(120,'#9ed88a')+arc(110,'#8ec5ee')+arc(100,'#b79ae6')+
  cl(-62,128,14)+cl(-48,120,18)+cl(-33,128,14)+cf(-62,128,12.5)+cf(-48,120,16.5)+cf(-33,128,12.5)+
  cl(234,128,14)+cl(248,120,18)+cl(263,128,14)+cf(234,128,12.5)+cf(248,120,16.5)+cf(263,128,12.5)+
  P('-10.0,33.5 -8.3,37.6 -3.8,38.0 -7.2,40.9 -6.2,45.3 -10.0,42.9 -13.8,45.3 -12.8,40.9 -16.2,38.0 -11.7,37.6','#f6c744')+
  P('212.0,21.5 213.2,24.4 216.3,24.6 213.9,26.6 214.6,29.6 212.0,28.0 209.4,29.6 210.1,26.6 207.7,24.6 210.8,24.4','#fff2c0')+
  P('230.0,63.5 231.5,67.0 235.2,67.3 232.4,69.8 233.2,73.4 230.0,71.5 226.8,73.4 227.6,69.8 224.8,67.3 228.5,67.0','#f6c744')+
  '</g>';
})();

back.cape_star=back.cape_rainbow=back.bg_island=back.bg_rcloud=true;
/* 披風要蓋在背景之上、精靈之下：order 越小越後面 */
const order={bg_island:1,bg_rcloud:1,cape_star:2,cape_rainbow:2};
window.PropArt={svg:svg,back:back,order:order};
})();
