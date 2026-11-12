/* 吹奏語法回饋（純函式，不影響「全對」判定、不存檔）
   目前只做：長音穩定度（音量與音高起伏）。門檻為暫定值，☐ 待真陶笛＋手機實測調整。
   frames：[{t 秒, m 浮點 MIDI, v 該畫格 RMS}]；notes：[{midi,beat,dur}]（dur 單位＝拍） */
(function(){
'use strict';
var MIN_FRAMES=8;
function mean(a){return a.reduce(function(x,y){return x+y;},0)/a.length;}
function median(a){var t=a.slice().sort(function(x,y){return x-y;});return t[Math.floor(t.length/2)];}
function std(a){var m=mean(a);return Math.sqrt(mean(a.map(function(x){return (x-m)*(x-m);})));}

/* 分析單一長音；回傳 {kind,text} 或 null（資料不足，不給回饋） */
function analyzeLong(frames,note,S,beat,outLat){
  var s=S+note.beat*beat+outLat,end=s+note.dur*beat;
  var sel=frames.filter(function(f){return f.t>=s+0.2*beat&&f.t<=end-0.1*beat&&Math.abs((f.m-note.midi)*100)<=70&&typeof f.v==='number';});
  if(sel.length<MIN_FRAMES)return null;
  var n=sel.length,k=Math.max(3,Math.floor(n/3));
  var head=sel.slice(0,k),tail=sel.slice(n-k);
  var vh=mean(head.map(function(f){return f.v;})),vt=mean(tail.map(function(f){return f.v;}));
  var ratio=vh>0?vt/vh:1;
  var drift=(median(tail.map(function(f){return f.m;}))-median(head.map(function(f){return f.m;})))*100;
  var wob=std(sel.map(function(f){return f.m*100;}));
  if(ratio<0.6)return {kind:'weak',text:'長音後面氣變弱了，從頭到尾用一樣的氣吹'};
  if(drift<-20)return {kind:'sag',text:'長音越吹越低，氣要撐住'};
  if(drift>20)return {kind:'rise',text:'長音越吹越高，後面氣不要吹太用力'};
  if(ratio>1.6)return {kind:'push',text:'長音後面越吹越用力，試著平穩一點'};
  if(wob>25)return {kind:'wobble',text:'長音的音有點抖，放鬆一點再吹一次'};
  return {kind:'steady',text:'長音很穩，氣很平均！'};
}

/* 對所有長音（dur≥2）給一句白話回饋；沒有可分析的長音回傳 '' */
function longNoteFeedback(frames,notes,S,beat,outLat){
  var out=[];
  notes.forEach(function(n){if(n.dur>=2){var r=analyzeLong(frames,n,S,beat,outLat);if(r)out.push(r);}});
  if(!out.length)return '';
  var bad=out.filter(function(r){return r.kind!=='steady';});
  return (bad.length?bad[0]:out[0]).text;
}

window.OLM_FB={analyzeLong:analyzeLong,longNoteFeedback:longNoteFeedback};
})();
