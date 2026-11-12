/* firebase-config.js：Firebase 專案設定（測試站 ocarina-beta）
   apiKey 本來就會出現在網頁裡，不是機密；真正的保護靠 Firestore 安全規則（見 firestore.rules）。
   ⚠️ 換成正式專案時，只改這個檔。 */
window.OLM_FIREBASE={
  config:{
    apiKey:"AIzaSyAzuu9O5xwfuxznxnE3OJ7H6NOnTk0OK2g",
    authDomain:"ocarina-beta.firebaseapp.com",
    projectId:"ocarina-beta",
    storageBucket:"ocarina-beta.firebasestorage.app",
    messagingSenderId:"72655792720",
    appId:"1:72655792720:web:49c73214599954180dbf55"
  },
  sdkVersion:"13.3.0",
  adminEmail:"a0929870116@gmail.com"   /* 後台只有這個帳號能進；真正的限制在 firestore.rules */
};
