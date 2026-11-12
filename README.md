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

## 後台任務與練習紀錄（11/12 新增，只在測試站）
- `cloud-tasks.js`（`OLMTasks`，只由 `index.html` 載入）：登入後讀 `tasks/<key>`（後台指派的每週任務）存成手機快取 `olm_tasks_v1`；遊戲頁排進手機佇列 `olm_logq_v1` 的練習紀錄，由它每 10 秒／離開頁面時寫到 `logs/<id>`。
- `wk-core.js`：已登入（`sessionStorage.olm_live_sid`）且有指派 → 用後台任務（曲子／小節範圍／速度看任務內欄位，不從 id 推）；訪客、沒指派、讀不到 → 預設任務。新增 `recordLog`、`errsFrom`。
- `song-practice.html`、`weekly-practice.html`：每次有效吹奏記一筆彙總（sid、ts、task、perfect、errs）；後台指定速度 BPM 時預設選該速度（仍可自己改）。
- `save-core.js`：`olm_tasks*`、`olm_logq*` 視為內部鍵（不動 `olm_sync_ts`、不上雲）。
- 規則不用改（第三版已有 `tasks` 讀、`logs` 建立）。
