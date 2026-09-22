# 封面重製規格（v2.28 預備）

目的：把封面從「有字的海報」改成「沒有字的圖版」。標題、日期由 HTML 疊上去（沿用 v2.20 的 hero 排版，Shippori Mincho），圖只負責景。

## 要產兩張

| 用途 | 比例 | 建議尺寸 | 檔名 |
|---|---|---|---|
| 桌機（>700px） | 16:9 | 2400 × 1350 | `assets/cover-2027-wide.webp`（已產，v2.28 採用） |
| 手機（≤700px） | 4:5 | 1200 × 1500 | `assets/cover-2027-tall.webp`（待產） |

網頁用 `<picture>` 依寬度切換。網頁會把兩張圖都降飽和一點、疊一層紙色，所以圖本身可以比最終看到的稍微鮮一點，但不要鮮到現在這張的程度。

## 標題安全區（這塊要「空」）

HTML 標題會壓在這裡，圖在這個範圍只放霧、天空、遠山，不要放建築或櫻花。

- 桌機：畫面左側 8% 到 46% 寬、上下 20% 到 80% 高。四個地標往右半邊和下緣排。
- 手機：畫面上方 12% 到 48% 高。地標全部在下半部。

## 四個元素與位置

| 元素 | 桌機位置 | 手機位置 | 備註 |
|---|---|---|---|
| 金澤町家（茶屋街木格子、燈籠） | 右上或左下緣一小段 | 左下 | 不要佔滿整個左側 |
| 白川鄉合掌村 | 中下 | 中下 | 三到五棟，帶一點殘雪 |
| 名古屋城 | 右中 | 右下 | 金鯱可以，但不要發光 |
| 樂高樂園 | 右下，小 | 右下角，小 | 用彩色積木城堡／入口造型表現，**不要出現可讀的 LEGO 或 LEGOLAND 字樣** |

高樓可以有，但退到遠景、霧裡；櫻花最多一枝，從畫面角落伸進來。飛驒牛不用。

## 色調與質感

- 主調：和紙 `#efece3`、墨綠 `#1d2e28`、灰金 `#b8a882`，點一點朱 `#9c3b26`。
- 低飽和、單一暖光（清晨側光），大量霧氣，中間調的天空（不要純白、不要藍天）。
- 質感：膠彩／木版畫／平塗，紙紋可見。
- 不要：3D 渲染、發光、金屬漸層、鏡面反射、任何文字、任何 logo、青海波等裝飾紋樣框。

## 給產圖工具的 prompt

桌機：

```
Editorial travel illustration, wide 16:9, muted Japanese gouache / woodblock-print texture on washi paper. Spring morning in Hokuriku and Nagoya: misty layered mountains and soft sky occupying the LEFT HALF as calm negative space; on the right and lower part, a small cluster of gassho-zukuri thatched farmhouses with traces of snow (center-bottom), Nagoya Castle mid-right, a tiny colorful brick-built theme-park castle in the lower-right corner, a short row of Kanazawa wooden teahouse facades with paper lanterns along the lower-left edge, distant skyscrapers faded into mist. One cherry blossom branch entering from a corner. Palette: warm paper beige, deep pine green, dusty gold, a single accent of vermilion. Single soft warm side light, low saturation, matte, visible paper grain. No text, no letters, no logos, no signs, no borders, no decorative pattern frames, no lens glow, no 3D render look.
```

手機：

```
Editorial travel illustration, vertical 4:5, muted Japanese gouache / woodblock-print texture on washi paper. UPPER HALF is calm negative space: misty layered mountains and a soft mid-tone sky. LOWER HALF holds the scene: gassho-zukuri thatched farmhouses with traces of snow at center-bottom, Nagoya Castle at the lower right, a tiny colorful brick-built theme-park castle tucked in the lower-right corner, Kanazawa wooden teahouse facades with paper lanterns at the lower left, distant skyscrapers faded into mist behind. One cherry blossom branch entering from the top-left corner. Palette: warm paper beige, deep pine green, dusty gold, a single accent of vermilion. Single soft warm side light, low saturation, matte, visible paper grain. No text, no letters, no logos, no signs, no borders, no decorative pattern frames, no lens glow, no 3D render look.
```

負面提示（工具有欄位就填）：

```
text, letters, typography, logo, signage, watermark, 3D render, glossy, bevel, metallic gradient, lens flare, glow, neon, saturated blue sky, pure white sky, decorative border, seigaiha pattern frame, photo-realistic
```

## 驗收

1. 標題安全區裡沒有建築、沒有櫻花，把「北陸・名古屋」四個字疊上去不會壓到東西。
2. 圖裡沒有任何可讀文字。
3. 四個地標都認得出來，樂高看得出是積木樂園但沒有字。
4. 縮到 335px 寬（手機直圖）時合掌村和名古屋城還分得出來。
5. 放到深色底上不刺眼（天空不是白的）。

圖交回來後的網頁工作：`<picture>` 雙圖、疊回 v2.20 的 hero 標題排版、拿掉現在的裁切規則。
