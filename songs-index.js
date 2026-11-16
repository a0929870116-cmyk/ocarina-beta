/* 陶笛失落地圖｜任務曲目索引（後台指派選曲用）
   - 一首歌一筆：id、冊別 book、冊內編號 no、歌名 title、備註 note、Drive 檔案 ID drive。
   - 「是否已建檔」不在這裡寫死：後台以 OLM_SONGS.SONGS[id] 是否存在判斷（有 ＝ 已建檔，可指派；沒有 ＝ 未建檔，下拉灰掉）。
   - 按需建檔：要指派的歌才把 PDF 簡譜轉成資料並加進 songs.js（id 與這裡一致）。
   - id 規則：小寫英數，例 s3u01 ＝ S3 上冊 01 首（u＝上、d＝下）；任務編號為 song-<id>，id 不可含「-」。
   - 同曲在不同冊各登記一筆、不去重（段落截取可能不同）。
   來源：專案文件《曲目索引_合併版_1114》。 */
(function(g){
'use strict';
const BOOKS=[
  {id:'s3u',name:'S3 上'},
  {id:'f',name:'F 冊（新曲）'}
];
const SONGS=[
  /* S3 上（資料夾 11xfZlpOW9FIt7WOfJXX78FxToh-BkSsk） */
  {id:'s3u01',book:'s3u',no:'01',title:'歡樂頌',drive:'1h2ar8nqY5AlbFsoZspkOV3D2gIpuO8jl'},
  {id:'s3u02',book:'s3u',no:'02',title:'土耳其進行曲',drive:'1alg2q_RqPURtkHy3aMtq3Hu6PJc-yotV'},
  {id:'s3u03',book:'s3u',no:'03',title:'快樂的鐵匠',drive:'1MhIVra8YydW7Potk55eP-6hwJeXoqEZh'},
  {id:'s3u04',book:'s3u',no:'04',title:'歌聲滿行囊',note:'檔名「-15」',drive:'1mbgimBU5qt8y6ugLHcbwcEATEoISrSJv'},
  {id:'s3u05',book:'s3u',no:'05',title:'問候歌',drive:'1b3btZXCf0wWr2yHXmeSh4hclpwLHmObo'},
  {id:'s3u06',book:'s3u',no:'06',title:'麵包超人',drive:'1MwjCGljdfTKkqj9I4OOBE09GXeVylRrv'},
  {id:'s3u07',book:'s3u',no:'07',title:'散步（龍貓）',drive:'1Wlzd42eKwzS1QVqWPbIbWMvyPWyhlWXL'},
  {id:'s3u08',book:'s3u',no:'08',title:'晚安喵',drive:'1RjW81gBOwcq7Jqh3dzE4nAyDG0A9Uxq8'},
  {id:'s3u09',book:'s3u',no:'09',title:'聖誕老人進城來',note:'檔名缺字，歌名待確認',drive:'1z8CLymO6MclAZOBomo_4NhbzI6_DzPLK'},
  {id:'s3u10',book:'s3u',no:'10',title:'天賜歡樂',drive:'1c-tx34qKQlQDEcLFPQbaV1poEeo4-Fsz'},
  {id:'s3u11',book:'s3u',no:'11',title:'拜年',drive:'1_HtwxmigMZn1lQB-5W4XqAXF5TlVjDZn'},
  /* F 冊：已建檔的兩首原型（資料在 songs.js） */
  {id:'star',book:'f',no:'0710',title:'數星星',note:'F轉G',drive:'11OCqC6FrR_ku8OavBjHFHzoEsNY42f9w'},
  {id:'pig',book:'f',no:'0715',title:'豬之歌',note:'8.1',drive:'1oLmFmvaQ3UW_u46NMdgP2aTHhUQzsvw7'}
];
g.OLM_SONG_INDEX={BOOKS,SONGS};
if(typeof module!=='undefined')module.exports=g.OLM_SONG_INDEX;
})(typeof window!=='undefined'?window:globalThis);
