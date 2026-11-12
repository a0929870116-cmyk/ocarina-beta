/* 陶笛失落地圖｜曲譜資料（整首存，任務只指定小節範圍）
   格式（沿用《簡譜文字格式》）：每小節一個字串，音符以空格分開
     音符：[#|b]度數[' 高八度 | , 低八度]:時值（拍數，♩=1）　例 6:0.5　1':1　b7:0.75　#4:0.5
     休止：0:時值　　延音線：音符後加 ~（接下一個同音，合併成一個長音判分）
   音高：1=C，不標點的 1＝C5（陶笛實際音高；譜面低一個八度，與基本指法 1-1 相同）。
   小節編號 = 陣列索引+1，與原譜印出的小節號一致。 */
(function(g){
'use strict';
const PCS=[0,2,4,5,7,9,11];
function parseTok(s){
  let tie=false;if(s.endsWith('~')){tie=true;s=s.slice(0,-1);}
  const k=s.indexOf(':'),p=s.slice(0,k),dur=parseFloat(s.slice(k+1));
  if(!(dur>0))throw new Error('時值錯誤：'+s);
  if(p==='0')return {rest:true,dur};
  let i=0,acc=0;
  if(p[i]==='#'){acc=1;i++;}else if(p[i]==='b'){acc=-1;i++;}
  const deg=+p[i++];if(!(deg>=1&&deg<=7))throw new Error('度數錯誤：'+s);
  let oct=0;for(;i<p.length;i++){if(p[i]==="'")oct++;else if(p[i]===',')oct--;else throw new Error('符號錯誤：'+s);}
  return {rest:false,deg,acc,oct,midi:72+12*oct+PCS[deg-1]+acc,dur,tie};
}
function rep(s,n){return Array(n).fill(s);}

/* ---- 數星星（2/4；原譜 F 轉 G：前段 B 為 ♭7、後段 7 為本位、m52 的 4 升 F♯） ---- */
const S_A='6:0.5 1\':0.5 1\':0.5 4:0.5', S_B='5:0.5 1\':0.5 1\':1', S_C='4:0.5 3:0.5 4:0.5 2\':0.5', S_D='1\':2',
      S_E='b7:0.75 6:0.25 b7:0.5 2\':0.5';
const S_F='1:0.5 6:0.5 6:0.5 1:0.5', S_G='1:0.5 5:0.5 5:1', S_H='4:0.5 2\':0.5 2\':0.5 4:0.5', S_I='4:0.5 1\':0.5 1\':1';
const S_J='5:0.5 3\':0.5 3\':0.5 5:0.5', S_K='5:0.5 2\':0.5 2\':1';
const S_L='3\':0.5 3\':0.5 2\':0.5 2\':0.5', S_M='2\':0.5 7:0.25 6:0.25 5:1', S_N='2:0.5 7:0.5 7:0.25 1\':0.75', S_O='6:1 5:0.5 #4:0.5';
const starCoda=[S_L,S_M,S_N,S_O,'5:2~','5:2'];
const star=[
  S_A,S_B,S_C,S_D, S_E,'1\':0.5 6:0.5 4:1','b7:0.5 6:0.5 b7:0.5 1\':0.5','5:2',            // 1–8
  S_A,S_B,S_C,S_D, S_E,                                                                      // 9–13
  '1\':0.5 5:0.25 6:0.25 4:0.5 5:0.25 6:0.25','b7:0.5 6:0.5 5:0.5 3:0.5','4:2','0:2','0:2',   // 14–18
  S_F,S_G,S_H,S_I,'4:0.5 2\':0.5 2\':0.75 4:0.25',S_I,                                      // 19–24
  'b7:0.5 6:0.5 4:0.5 5:0.25 6:0.25','5:2',S_F,S_G,S_H,S_I,                                  // 25–30
  '2\':0.5 2\':0.5 1\':0.5 1\':0.5','1\':0.5 6:0.25 5:0.25 4:1','1:0.5 6:0.5 6:0.25 b7:0.75','5:1 4:0.5 3:0.5','4:2~','4:2', // 31–36
  '2:0.5 7:0.5 7:0.5 2:0.5','2:0.5 6:0.5 6:1',S_J,S_K,'5:0.5 3\':0.5 3\':0.75 5:0.25',S_K,    // 37–42
  '1\':0.5 7:0.5 5:0.5 6:0.25 7:0.25','6:2',                                                // 43–44
  '2:0.5 7:0.5 7:0.5 2:0.5','2:0.5 6:0.5 6:1',S_J,S_K,                                      // 45–48
  ...starCoda,...starCoda                                                                    // 49–54、55–60
];

/* ---- 豬之歌（4/4，1=C；m29–38、m59–74 為整小節休止） ---- */
const P_I='5:2 0:0.5 5:0.5 1\':0.5 7:0.5', P_A='6:0.5 6:0.5 6:0.5 5:0.5 6:2', P_B='1\':0.5 6:0.5 1\':0.5 6:0.5 1\':1 6:0.5 5:0.5',
      P_D='6:0.5 5:0.5 5:0.5 3:0.5 2:2', P_E='6:0.5 6:0.5 6:0.5 5:0.5 6:1 5:0.5 6:0.5';
const P_16='1\':1.5 6:0.5 1\':0.5 6:0.5 1\':0.5 5\':0.5~', P_17='5\':3 3\':0.5 2\':0.5~', P_18='2\':1 1\':0.5 2\':0.5~ 2\':2';
const P_19='3\':0.5 2\':0.5 3\':0.5 2\':0.5 3\':1 2\':0.5 1\':0.5', P_20='2\':1 1\':1 3\':1 5:0.5 3\':0.5', P_21='3\':1 2\':1 2\':1 1\':1',
      P_22='1\':1 6:1 2\':2', P_24='2\':1 1\':1 3\':1 5:0.5 6:0.5';
const P_25='3\':0.5 2\':0.5~ 2\':3~', P_26='2\':3 5:0.5 6:0.5', P_27='2\':1.5 1\':0.5~ 1\':2~', P_28='1\':4';
const P_51='3\':0.5 2\':0.5 2\':0.5 2\':0.5 2\':1 1\':1', P_54='2\':0.5 1\':0.5 5\':0.5 3\':0.5~ 3\':1 5:0.5 6:0.5';
const P_91='3\':0.5 2\':0.5~ 2\':2 5:0.5 6:0.5';
const pig=[
  P_I,P_A,P_B,'6:0.5 5:0.5 3:0.5 6:0.5 5:2',P_I,P_A,P_B,'6:0.5 5:0.5 6:0.5 3\':0.5 2\':2',P_I,P_A,   // 1–10
  '1\':0.5 6:0.5 1\':0.5 6:0.5 1\':0.5 1\':0.5 6:0.5 5:0.5',P_D,P_I,P_E,                          // 11–14
  '1\':0.5 6:0.5 6:0.5 1\':0.5~ 1\':2~',P_16,P_17,P_18,                                          // 15–18
  P_19,P_20,P_21,P_22,P_19,P_24,P_25,P_26,P_27,P_28,                                             // 19–28
  ...rep('0:4',10),                                                                              // 29–38
  P_I,P_A,P_B,P_D,P_I,P_E,                                                                       // 39–44
  '1\':0.5 6:0.5 1\':0.5 6:0.5~ 6:0.5 1\':0.5~ 1\':1~',P_16,P_17,P_18,                           // 45–48
  P_19,P_24,P_51,P_22,P_19,P_54,P_25,P_26,P_27,P_28,                                             // 49–58
  ...rep('0:4',16),                                                                              // 59–74
  P_19,P_20,P_21,P_22,P_19,P_24,P_25,P_26,                                                       // 75–82
  '6\':1.5 5\':0.5~ 5\':1 3\':0.5 2\':0.5~',P_18,                                                // 83–84
  P_19,P_20,P_51,P_22,P_19,P_54,P_91,P_91,P_27,P_28                                              // 85–94
];

const SONGS={
  star:{id:'star',title:'數星星',ts:[2,4],bars:star,
    presets:[['m1–8（前半段）',1,8],['m9–16（後半段）',9,16],['m1–16（到 To Coda）',1,16],['m19–26',19,26],['m19–36',19,36],['m37–48（尾奏前段）',37,48],['m49–54',49,54]]},
  pig:{id:'pig',title:'豬之歌',ts:[4,4],bars:pig,
    presets:[['m1–4（第一句）',1,4],['m1–10',1,10],['m11–18（有延音線）',11,18],['m19–28（副歌）',19,28],['m39–44',39,44],['m45–58',45,58]]}
};

/* 取小節範圍 → {bars:[{no,beats,notes:[…]}], notes（顯示用）, events（判分用，延音線合併）, totalBeats} */
function build(songId,from,to){
  const sg=SONGS[songId];const beatsPerBar=sg.ts[0];
  from=Math.max(1,Math.min(from|0,sg.bars.length));to=Math.max(from,Math.min(to|0,sg.bars.length));
  const bars=[],notes=[];let beat=0;
  for(let b=from;b<=to;b++){
    const toks=sg.bars[b-1].split(/\s+/).filter(Boolean).map(parseTok);
    const sum=toks.reduce((a,t)=>a+t.dur,0);
    if(Math.abs(sum-beatsPerBar)>1e-9)throw new Error(sg.title+' 第 '+b+' 小節拍數 '+sum+'，應為 '+beatsPerBar);
    const bar={no:b,beats:beatsPerBar,notes:[]};let inBar=0;
    toks.forEach(t=>{const n=Object.assign({i:notes.length,bar:b,barIdx:bars.length,beat,beatInBar:inBar},t);
      notes.push(n);bar.notes.push(n);beat+=t.dur;inBar+=t.dur;});
    bars.push(bar);
  }
  const events=[];
  for(let k=0;k<notes.length;k++){
    const n=notes[k];if(n.rest)continue;
    const ev={i:events.length,midi:n.midi,beat:n.beat,dur:n.dur,notes:[n],bar:n.bar,beatInBar:n.beatInBar,prevSame:false};
    let cur=n;
    while(cur.tie&&k+1<notes.length&&!notes[k+1].rest&&notes[k+1].midi===n.midi){k++;cur=notes[k];ev.notes.push(cur);ev.dur+=cur.dur;}
    const prev=events[events.length-1];
    if(prev&&Math.abs(prev.beat+prev.dur-ev.beat)<1e-9&&prev.midi===ev.midi)ev.prevSame=true;
    events.push(ev);
  }
  notes.forEach(n=>{if(!n.rest&&n.tie){const nx=notes[n.i+1];n.tieNext=!!(nx&&!nx.rest&&nx.midi===n.midi);}});
  return {song:sg,from,to,bars,notes,events,totalBeats:beat};
}
g.OLM_SONGS={SONGS,build,parseTok};
if(typeof module!=='undefined')module.exports=g.OLM_SONGS;
})(typeof window!=='undefined'?window:globalThis);
