# 協作規範

這個 repo 是一份給 15 位旅伴看的靜態行程頁，多人與多個 AI 工具會同時改動。動手前先讀完這份。

## 一、每次改版必做五件事

1. **先拉最新版**　`git pull --rebase`。這個 repo 有多方同時推送，直接推很容易撞號或被拒。
2. **更新版本號**　以下必須一致：舊版八頁頁首的 `ver-badge`、頁尾的 `travel-footer .ver`、`assets/style.css?vX.Y`、`assets/trip-data.js?vX.Y`、`assets/render-v1.js?vX.Y`、`assets/route-map.js?vX.Y` 的快取參數，以及 `v2/index.html` 的版號、`v2/style.css?vX.Y`、`v2/render.js?vX.Y`。漏掉快取參數，團員的瀏覽器會繼續用舊內容或舊樣式。
3. **更新 CHANGELOG.md**　最上方新增 `## vX.Y — YYYY-MM-DD`，條列這次改了什麼。
4. **更新 README.md**　開頭那行「目前版本」同步。
5. **打上 git tag**　`git tag -a vX.Y -m "簡述"`，推送時加 `--follow-tags`。

版號規則：內容或數字修正進位次版號，版面或架構重整才進位主版號。
次版號超過 9 就接著往下數（v1.9 → v1.10 → v1.11），**不要因此跳主版號**。
「行程內容整個重排」仍屬內容修正，不是大改版。
**發版前先確認 `git tag` 清單和遠端 CHANGELOG，該版號有沒有被別人用掉。**

## 二、內容原則

- 航班、票價、人數、分攤金額都是真實資料，**不要臆測或自行補值**。數字不確定就標「待確認」，不要填推估值而不註明。
- **內容只有一份：`assets/trip-data.js`。** 行程、人數、航班、住宿、提醒、氣溫、打包清單都在這裡，舊版（v1）與新版（v2）都讀它。改內容只改這個檔案，**不要把文字直接寫進 HTML 或樣板**。
- 新舊版只有排版不同：舊版樣板是 `assets/render-v1.js`＋`assets/style.css`，新版樣板是 `v2/render.js`＋`v2/style.css`。改排版改各自的樣板與 CSS，不要在 HTML 內嵌 `<style>`。
- 新增功能或區塊時，兩版都要做出對應畫面，功能保持一致。
- 改完內容後，舊版與新版都要打開檢查一次。
- 新版例外使用 Google Fonts，動線地圖（舊版 `route.html`、新版動線分頁）例外使用 Leaflet（unpkg）與 OpenStreetMap 圖磚；其他地方不引入外部服務。
- 純靜態，不引入 npm、建置工具或外部圖片服務。
- 繁體中文，金額以新台幣為單位並加千分位。
- 分組名稱固定為【春】悠旅、【鄉】小聚、【祈】相逢。改名改 `assets/trip-data.js` 的 `groups`，不使用舊名稱與內部代號。

## 三、頁面結構

| 檔案 | 內容 |
| --- | --- |
| `index.html` | 總覽 |
| `journey.html` | 舊航班網址相容：轉至 people.html#travel-timeline |
| `itinerary.html` | 行程：總表、每天細項、提醒 |
| `people.html` | 旅伴與交通：名單、航班與地點時間軸、租車分組 |
| `stay.html` | 住宿資訊 |
| `prep.html` | 行前：三月氣溫、穿衣建議、打包清單 |
| `reminders.html` | 舊網址相容：轉至 itinerary.html#reminders |
| `assets/trip-data.js` | **全站唯一內容來源**，新舊版共用 |
| `assets/render-v1.js` | 舊版樣板：依 HTML 裡的 `data-trip` 佔位產生內容 |
| `assets/style.css` | 舊版共用樣式 |
| `v2/index.html`、`v2/render.js`、`v2/style.css` | 新版外框、樣板與樣式 |
| `route.html` | 動線地圖（舊版） |
| `assets/route-map.js` | 動線地圖畫圖程式，新舊版共用 |
| `v2/map.html` | 舊網址相容：轉至 v2/index.html#route |

部署：GitHub Pages 由 `main` 分支根目錄自動重建，推送後約一分鐘生效。

## 現行頁面與人數

舊版主導覽固定：總覽｜旅伴與交通｜動線｜住宿資訊｜行程｜行前；新版分頁：總覽｜旅伴｜交通｜動線｜住宿資訊｜行程｜行前。網站不顯示費用與分攤資訊。金澤 3/14、3/15 為 14 人（9 大 5 小），3/16 先以 14 人（9 大 5 小）安排，相逢是否同住未定；名古屋 3/17 悠旅 11 人，相逢是否加入未定，3/18 起原安排為 12 人（8 大 4 小）。【鄉】小聚 3/13 另外住宿，3/17 回台；【祈】相逢 3/16、3/17 行程與住宿未定，僅班機時間確定，不預設金澤同住或 3/17 一起包車。待確認事項不可自行補成已確認。
