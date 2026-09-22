# 協作規範

這個 repo 是一份給 15 位旅伴看的靜態行程頁，多人與多個 AI 工具會同時改動。動手前先讀完這份。

## 零、先在本地跑，沒說發不要推

任何改動先在本地做完、開起來看過，再回報。**沒有拿到明確的「發」「上版」「push」，不 commit、不 tag、不 push。**「本地測完就發」這種預告不算授權，要等到那一句真的出現。

本地伺服器在 repo 根目錄開：

```
python -m http.server 8777
```

開 `http://localhost:8777/index.html`。伺服器用 `python tools/serve.py`（同 `http.server`，多送 `Cache-Control: no-store`），改檔案後重整就是新的。用 `python -m http.server` 也行，但手機瀏覽器會把 `assets/` 下同一個 `?vX.Y` 的檔案快取起來，改了 app.js、style.css 重整仍是舊的，看起來像沒修好；網址加 `?r=1` 只繞過 index.html，繞不過 assets。

手機連不到 localhost。需要手機實測的改動，先講清楚這個限制，問維護者要不要先發一版上去測，等他答應再推。不要替他決定。

改版時建議附上檢查結果：主控台有沒有錯誤、桌機與手機各切幾頁、頁首壓縮與展開、時間軸表格能不能自己捲。

## 一、每次改版必做五件事

1. **先拉最新版**　`git pull --rebase`。這個 repo 有多方同時推送，直接推很容易撞號或被拒。
2. **更新版本號**　以下必須一致：`index.html` 頁首的 `.ver`、頁尾的 `.foot .v`，以及 `assets/style.css?vX.Y`、`assets/trip-data.js?vX.Y`、`assets/render.js?vX.Y`、`assets/app.js?vX.Y`、`assets/alpine.min.js?vX.Y` 的快取參數，共七處。漏掉快取參數，團員的瀏覽器會繼續用舊內容或舊樣式。
3. **更新 CHANGELOG.md**　最上方新增 `## vX.Y — YYYY-MM-DD`，條列這次改了什麼。
4. **更新 README.md**　開頭那行「目前版本」同步。
5. **打上 git tag**　`git tag -a vX.Y -m "簡述"`，推送時加 `--follow-tags`。

版號規則：一律只進位次版號。
次版號超過 9 就接著往下數（v2.9 → v2.10 → v2.11），**不要因此跳主版號**。
「行程內容整個重排」仍屬內容修正，不是大改版。
**發版前先確認 `git tag` 清單和遠端 CHANGELOG，該版號有沒有被別人用掉。**

**主版號只有人能決定。** 沒有拿到明確認可，不管改動多大都留在同一個主版號。版面重排、頁面拆併、檔案搬家、架構重整，全部算次版號。覺得這次夠格升主版號就先問，不要自己升。

## 二、內容原則

- 航班、票價、人數、分攤金額都是真實資料，**不要臆測或自行補值**。數字不確定就標「待確認」，不要填推估值而不註明。
- **內容只有一份：`assets/trip-data.js`。** 行程、人數、航班、住宿、提醒、氣溫、打包清單都在這裡。改內容只改這個檔案，**不要把文字直接寫進 HTML 或樣板**。
- 排版分兩層：`assets/render.js` 產生各分頁內容，`assets/style.css` 管樣式。不要在 HTML 內嵌 `<style>`。
- 互動用 Alpine.js（`assets/alpine.min.js`，內嵌在 repo，不走 CDN）。狀態只有兩個，都在 `body` 的 `x-data="app"`：`page` 目前分頁、`cond` 頁首是否壓縮。改狀態只透過 `assets/app.js` 的 `go()` 與捲動監聽；畫面怎麼跟著變寫在 `index.html` 的 `:class`、`x-text`、`@click` 屬性上。
- 動態一律用 CSS：class 切換配 transition 或 keyframes。不要用 Web Animations API，不要用 setInterval 輪詢，不要在 JS 裡直接寫 style。手機左右滑切頁靠 `scroll-snap`，交給瀏覽器。
- 全站是單頁：`index.html` 一個外框，九個 `<section>` 排在 `.pages` 軌道裡，用網址片段切換。新增分頁要同時加 `<section>`、導覽列項目、總覽目次，以及 `assets/app.js` 的 `PAGES` 與 `NAMES`。
- 外部服務只有 Google Fonts 提供字型；其他地方不引入外部服務。
- 純靜態，不引入 npm、建置工具或外部圖片服務。
- 繁體中文，金額以新台幣為單位並加千分位。
- 分組名稱固定為【春】悠旅、【鄉】小聚、【祈】相逢。改名改 `assets/trip-data.js` 的 `groups`，不使用舊名稱與內部代號。

## 三、檔案結構

| 檔案 | 內容 |
| --- | --- |
| `index.html` | 單頁外框：八個分頁的 `<section>` 與導覽 |
| `assets/trip-data.js` | **全站唯一內容來源** |
| `assets/render.js` | 樣板：依 `data-v2` 佔位產生內容，加上倒數與打包清單 |
| `assets/app.js` | 互動層：分頁切換、頁首壓縮、區塊漸入（Alpine 元件） |
| `assets/alpine.min.js` | Alpine.js 3，內嵌 |
| `assets/style.css` | 全站樣式 |
| `assets/cover-2027.png` | 首頁封面 |
| `assets/route-2027.png` | 動線頁路線圖 |
| `assets/favicon.svg` | 瀏覽器分頁圖示 |

分頁片段：`#overview` 總覽、`#people` 旅伴、`#timeline` 時間軸、`#journey` 交通、`#route` 動線、`#stay` 住宿資訊、`#itinerary` 行程、`#prep` 行前、`#coupon` 優惠券。

## 四、舊網址轉址

v2.5 之前是多頁版與 `v2/` 單頁版並行。現在只維護單頁版，舊網址全部保留成轉址頁，指向對應的分頁片段。

| 舊網址 | 轉到 |
| --- | --- |
| `people.html` | `index.html#people` |
| `timeline.html` | `index.html#timeline` |
| `journey.html` | `index.html#journey` |
| `route.html` | `index.html#route` |
| `stay.html` | `index.html#stay` |
| `itinerary.html` | `index.html#itinerary` |
| `prep.html` | `index.html#prep` |
| `reminders.html` | `index.html#itinerary` |
| `v2/index.html` | `index.html#overview` |
| `v2/map.html` | `index.html#route` |

這些檔案只有 meta refresh、JS 轉址與一行備援連結，不放內容也不需要樣式。旅伴的書籤和舊訊息裡的連結都還會通，不要刪。

部署：GitHub Pages 由 `main` 分支根目錄自動重建，推送後約一分鐘生效。

## 現行人數

網站不顯示費用與分攤資訊。金澤 3/14、3/15 為 14 人（9 大 5 小），3/16 先以 14 人（9 大 5 小）安排，相逢是否同住未定；名古屋 3/17 悠旅 11 人，相逢是否加入未定，3/18 起原安排為 12 人（8 大 4 小）。【鄉】小聚 3/13 另外住宿，3/17 回台；【祈】相逢 3/16、3/17 行程與住宿未定，僅班機時間確定，不預設金澤同住或 3/17 一起包車。待確認事項不可自行補成已確認。
