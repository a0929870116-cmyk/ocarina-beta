# ocarina-beta（陶笛失落地圖 測試站）

正式站：https://a0929870116-cmyk.github.io/ocarina-test/
測試站：https://a0929870116-cmyk.github.io/ocarina-beta/

流程：新功能先推這個測試站 → 手機實測 → 確認後再推正式站。
目前內容＝正式站 commit 9a1b307。

## 學生登入（11/12 新增，只在測試站）
- `student-auth.js`：學生用「名字＋自設密碼」登入／建立帳號（名字雜湊成鑰匙，合成 email 登入 Firebase；密碼補長度）。
- `index.html` 登入頁已改成真登入（建立帳號含家長告知＋勾選；已登入顯示「繼續冒險」）。訪客模式照舊。
- `admin.html`：名單多「帳號」欄與「重設密碼」鈕（重設＝世代 +1＋清 uid，學生用同名字重新建立帳號，進度保留）。
- `firestore.rules`：第二版（管理者＋學生端）。**要貼到 Firebase 控制台 → Firestore → 規則 → 發佈。**
- `tools/rules-check.html`：建兩位測試學生互試讀寫，檢查規則有沒有擋住。做完到後台刪除那兩位。
