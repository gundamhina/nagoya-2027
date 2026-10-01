/*
 * 旅帖樣板：讀 assets/trip-data.js 產生各分頁內容，加上倒數與打包清單。
 * 這裡只管排版；內容請改 assets/trip-data.js。分頁切換與頁首在 assets/app.js。
 */
(function (T) {
  function attr(s) { return String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;"); }
  function each(list, fn) { return list.map(fn).join(""); }
  function group(id) { return T.groups.filter(function (g) { return g.id === id; })[0]; }
  function dash(s) { return s.replace("–", " — "); }
  function sec(t, n, style) {
    return '<div class="sec"' + (style ? ' style="' + style + '"' : "") + '><span class="sec-t">' + t + "</span>" +
      (n ? '<span class="sec-n">' + n + "</span>" : "") + '<span class="bar"></span></div>';
  }
  function groupsHtml(style) {
    return '<div class="groups"' + (style ? ' style="' + style + '"' : "") + ">" + each(T.groups, function (g) {
      return '<div class="group"><span class="kanji g-' + g.id + '">' + g.tag + '</span><div class="body"><span class="nm">' + g.name +
        '</span><span class="ct">' + g.count + '</span><span class="rg">' + g.range + "</span></div></div>";
    }) + "</div>";
  }
  /* 地面交通、門票、美食、緊急電話共用：左欄類別與日期，右欄標題、說明與待確認事項（沒有就不顯示） */
  function todoRow(x) {
    return '<div class="ground"><div class="side"><span class="no">' + x.kind + '</span><span class="wh">' + x.when + '</span></div><div class="body"><span class="ti">' +
      x.title + "</span>" + (x.text ? "<p>" + x.text + "</p>" : "") + (x.todo ? '<span class="todo">待確認 · ' + x.todo + "</span>" : "") + "</div></div>";
  }
  /* 城市地圖：用經緯度算位置畫成 SVG，再做成手繪樣子。
   * 線條：每條線描兩次，每次在路徑上加一點隨機偏移，像鉛筆來回描。亂數有固定種子，每次打開長得一樣。
   * 水：底下一條寬的淡藍水彩帶，上面兩條細線。地點：水彩圓斑＋小插圖＋手寫字（Klee One）。 */
  function cityMap(m) {
    var s = m.bbox[0], w = m.bbox[1], n = m.bbox[2], e = m.bbox[3];
    var cos = Math.cos((s + n) / 2 * Math.PI / 180), W = m.w || 600, IS = m.icon || 1.25, Q = IS / 1.25, K = W / ((e - w) * cos), H = Math.round((n - s) * K);
    var seed = m.id.length * 9301 + 49297;
    function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
    function xy(ll) { return [(ll[1] - w) * cos * K, (n - ll[0]) * K]; }
    function f(v) { return v.toFixed(1); }
    /* Catmull-Rom 轉成三次貝茲，讓折線變成手畫的弧線 */
    function curve(p) {
      var d = "M" + f(p[0][0]) + " " + f(p[0][1]);
      for (var i = 0; i < p.length - 1; i++) {
        var a = p[i - 1] || p[i], b = p[i], c = p[i + 1], q = p[i + 2] || c;
        d += "C" + f(b[0] + (c[0] - a[0]) / 6) + " " + f(b[1] + (c[1] - a[1]) / 6) + " " + f(c[0] - (q[0] - b[0]) / 6) + " " + f(c[1] - (q[1] - b[1]) / 6) + " " + f(c[0]) + " " + f(c[1]);
      }
      return d;
    }
    /* 把折線每 16px 切一點，每點偏移 ±amp */
    function wobble(p, amp) {
      var out = [];
      for (var i = 0; i < p.length - 1; i++) {
        var a = p[i], b = p[i + 1], len = Math.hypot(b[0] - a[0], b[1] - a[1]), k = Math.max(1, Math.round(len / 16));
        for (var j = 0; j < k; j++) {
          var t = j / k;
          out.push([a[0] + (b[0] - a[0]) * t + (rnd() - 0.5) * amp, a[1] + (b[1] - a[1]) * t + (rnd() - 0.5) * amp]);
        }
      }
      out.push([p[p.length - 1][0] + (rnd() - 0.5) * amp, p[p.length - 1][1] + (rnd() - 0.5) * amp]);
      return out;
    }
    function sketch(p, cls, amp) { return '<path class="' + cls + '" d="' + curve(wobble(p, amp)) + '"/><path class="' + cls + ' cm-2" d="' + curve(wobble(p, amp)) + '"/>'; }
    function blob(x, y, r, cls) {
      var p = [], a0 = rnd() * 6.28, k = 12;
      for (var i = 0; i <= k; i++) { var a = a0 + i / k * 6.28, rr = r * (0.82 + rnd() * 0.3); p.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]); }
      return '<path class="' + cls + '" d="' + curve(p) + 'Z"/>';
    }
    function byName(nm) { return m.points.filter(function (p) { return p.n === nm; })[0]; }

    /* 邊框：四條邊各自描兩次，角落故意多畫出去一點 */
    var o = 10, frame = [[[o - 6, o], [W - o + 5, o]], [[W - o, o - 5], [W - o, H - o + 6]], [[W - o + 6, H - o], [o - 5, H - o]], [[o, H - o + 5], [o, o - 6]]]
      .map(function (l) { return sketch(l, "cm-frame", 3); }).join("");
    /* 色塊：公園綠、山丘綠加小山、海藍，都是水彩暈開的形狀；公園和山丘上撒小樹 */
    var areas = "", trees = "", alabels = "";
    function tree(x, y, big) {
      var r = big ? 7 : 5;
      return '<path class="ic cm-f-tree" d="M' + f(x) + " " + f(y - r * 2.2) + "c" + r + " 0 " + r * 1.3 + " " + r * 1.6 + " " + r * 0.2 + " " + r * 2 + "c-" + r * 1.6 + " 0.4 -" + r * 1.8 + " -" + r * 1.6 + " -" + r * 0.2 + " -" + r * 2 + 'Z"/><path class="ic" d="M' + f(x) + " " + f(y - r * 0.2) + "v" + r + '"/>';
    }
    (m.areas || []).filter(function (a) { return a.k !== "band"; }).forEach(function (a) {
      var c = xy(a.ll), r = a.r * K / 111320;
      areas += blob(c[0], c[1], r, "cm-area-" + a.k) + blob(c[0] + r * 0.12, c[1] - r * 0.1, r * 0.75, "cm-area-" + a.k);
      if (a.k === "village") for (var v = 0; v < 9; v++) {
        var va = rnd() * 6.28, vd = Math.sqrt(rnd()) * r * 0.75, vx = c[0] + Math.cos(va) * vd, vy = c[1] + Math.sin(va) * vd;
        trees += '<path class="ic cm-f-thatch" d="M' + f(vx) + " " + f(vy - 11) + "l7 13h-14z" + '"/>';
      }
      /* 小公園（半徑 60 m 以下）只畫色塊不撒樹，免得蓋到旁邊的地點 */
      if (a.k === "park" && a.r > 60) for (var i = 0; i < 7; i++) { var ang = rnd() * 6.28, d = rnd() * r * 0.7; trees += tree(c[0] + Math.cos(ang) * d, c[1] + Math.sin(ang) * d, rnd() > 0.5); }
      if (a.k === "hill") {
        for (var j = 0; j < 3; j++) {
          var hx = c[0] - r * 0.5 + j * r * 0.45, hy = c[1] + (j % 2 ? -r * 0.15 : r * 0.1), hw = r * 0.42;
          trees += '<path class="ic cm-f-hill" d="M' + f(hx - hw) + " " + f(hy) + "Q" + f(hx) + " " + f(hy - hw * 1.3) + " " + f(hx + hw) + " " + f(hy) + '"/>';
        }
        for (var k2 = 0; k2 < 4; k2++) trees += tree(c[0] - r * 0.6 + rnd() * r * 1.2, c[1] + r * 0.2 + rnd() * r * 0.3, false);
      }
      if (a.t) alabels += '<text class="cm-at" x="' + f(c[0]) + '" y="' + f(c[1] + r * 0.55 + 18) + '" text-anchor="middle">' + a.t + "</text>";
    });
    (m.areas || []).filter(function (a) { return a.k === "band"; }).forEach(function (a) {
      var p1 = xy(a.a), p2 = xy(a.b), bw = a.w * K / 111320;
      areas += '<path class="cm-band" stroke-width="' + f(bw) + '" d="' + curve(wobble([p1, p2], 4)) + '"/>';
      for (var i = 0; i < 9; i++) { var t = 0.06 + i * 0.11; trees += tree(p1[0] + (p2[0] - p1[0]) * t + (rnd() - 0.5) * bw * 0.5, p1[1] + (p2[1] - p1[1]) * t, rnd() > 0.5); }
      if (a.t) alabels += '<text class="cm-at" transform="rotate(90 ' + f(p1[0] + bw * 0.9) + " " + f((p1[1] + p2[1]) / 2) + ')" x="' + f(p1[0] + bw * 0.9) + '" y="' + f((p1[1] + p2[1]) / 2) + '" text-anchor="middle">' + a.t + "</text>";
    });
    /* 鐵路：一條線加枕木短橫；大路：淡色雙線 */
    var roads = "", rails = "";
    (m.lines || []).forEach(function (l) {
      var p = l.p.map(xy);
      if (l.k === "road") { roads += sketch(p, "cm-road", 1.6); return; }
      if (l.k === "street") { roads += '<path class="cm-street" d="' + curve(wobble(p, 1.2)) + '"/>'; return; }
      if (l.k === "path") { roads += '<path class="cm-path" d="' + curve(wobble(p, 1)) + '"/>'; return; }
      rails += sketch(p, "cm-rail", 1.2);
      for (var i = 0; i < p.length - 1; i++) {
        var a = p[i], b = p[i + 1], len = Math.hypot(b[0] - a[0], b[1] - a[1]), ux = (b[0] - a[0]) / len, uy = (b[1] - a[1]) / len;
        for (var t = 6; t < len; t += 11) {
          var x = a[0] + ux * t, y = a[1] + uy * t;
          rails += '<path class="cm-tie" d="M' + f(x - uy * 4) + " " + f(y + ux * 4) + "L" + f(x + uy * 4) + " " + f(y - ux * 4) + '"/>';
        }
      }
    });
    /* 左上角手寫標題、兩個角落貼紙膠帶 */
    var head = m.heading ? '<g transform="rotate(-2 40 58)"><text class="cm-h" x="40" y="62">' + m.heading + '</text><text class="cm-hd" x="42" y="88">' + (m.dates || "") + "</text>" +
      sketch([[38, 70], [40 + m.heading.length * 30, 67]], "cm-hu", 2) + "</g>" : "";
    var tape = '<rect class="cm-tape" x="-18" y="-9" width="64" height="20" transform="translate(18 14) rotate(-32)"/>' +
      '<rect class="cm-tape cm-tape-2" x="-46" y="-9" width="64" height="20" transform="translate(' + (W - 18) + ' 14) rotate(30)"/>';
    var wash = "", lines = "";
    m.water.forEach(function (l) {
      var p = l.p.map(xy);
      if (l.k === "river") wash += '<path class="cm-wash" d="' + curve(p) + '"' + (l.w ? ' style="stroke-width:' + l.w + 'px"' : "") + "/>";
      lines += sketch(p, l.k === "river" ? "cm-river" : "cm-coast", 2.2);
    });
    var waves = each((m.sea && m.sea.waves) || [], function (ll) {
      var c = xy(ll), x = c[0], y = c[1];
      return '<path class="cm-wave" d="M' + f(x - 16) + " " + f(y) + "q8 -7 16 0t16 0" + '"/>';
    });
    var seen = {}, rivers = "";
    m.water.slice().sort(function (a, b) { return b.p.length - a.p.length; }).forEach(function (l) {
      if (!l.n || seen[l.n] || l.k !== "river") return;
      seen[l.n] = 1;
      var c = xy(l.p[Math.floor((l.p.length - 1) * (l.at || 0.5))]);
      /* 寬的河（有給 w）字放在河的左側，不要蓋進聚落 */
      rivers += l.w ? '<text class="cm-rv" x="' + f(c[0] - l.w / 2 - 6) + '" y="' + f(c[1]) + '" text-anchor="end">' + l.n + "</text>"
        : '<text class="cm-rv" x="' + f(c[0] + 10) + '" y="' + f(c[1] - 8) + '">' + l.n + "</text>";
    });
    var links = each(m.links || [], function (k) {
      var a = xy(byName(k.a).ll), b = xy(byName(k.b).ll), mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
      var dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1, bend = 18;
      var cx = mx - dy / len * bend, cy = my + dx / len * bend;
      return '<path class="cm-link" d="M' + f(a[0]) + " " + f(a[1]) + "Q" + f(cx) + " " + f(cy) + " " + f(b[0]) + " " + f(b[1]) + '"/>' +
        (k.lab === "mid" ? '<text class="cm-lt" x="' + f(mx - 14) + '" y="' + f(my + 6) + '" text-anchor="end">' + k.t + "</text>"
          : '<text class="cm-lt" x="' + f(b[0]) + '" y="' + f(b[1] + 46) + '" text-anchor="middle">' + k.t + "</text>");
    });
    /* 距離圈：以住處為圓心的虛線圓，圓頂標距離 */
    var rings = "", home = m.points.filter(function (p) { return p.kind === "stay"; })[0];
    if (m.rings && home) {
      var hc = xy(home.ll);
      m.rings.forEach(function (g) {
        var rr = g.r * K / 111320, pts = [];
        for (var i = 0; i <= 28; i++) { var a = i / 28 * 6.283; pts.push([hc[0] + Math.cos(a) * rr, hc[1] + Math.sin(a) * rr]); }
        rings += '<path class="cm-ring" d="' + curve(wobble(pts, 2)) + '"/><text class="cm-ring-t" x="' + f(hc[0] + rr * 0.77 + 6) + '" y="' + f(hc[1] + rr * 0.64 + 4) + '">' + g.t + "</text>";
      });
    }
    /* 路線：依 route 順序把地點連成紅色虛線；steps 有對到地點的，在地點左上角標號碼 */
    var route = "", badges = {};
    if (m.route && m.route.length > 1) route = '<path class="cm-route" d="' + curve(wobble(m.route.map(function (nm) { return xy(byName(nm).ll); }), 3)) + '"/>';
    var no = 0;
    (m.steps || []).forEach(function (st) { no++; if (st.n) badges[st.n] = (badges[st.n] ? badges[st.n] + "・" : "") + no; });
    var marks = each(m.points, function (p) {
      var c = xy(p.ll), x = c[0], y = c[1];
      /* 框外的地點：在邊框內側畫一個指向它的箭頭，旁邊寫名稱 */
      var mg = 26;
      if (x < mg || x > W - mg || y < mg || y > H - mg) {
        var ex = Math.max(mg, Math.min(W - mg, x)), ey = Math.max(mg, Math.min(H - mg, y));
        var ang = Math.atan2(y - ey || 0.001, x - ex || 0.001) * 180 / Math.PI;
        var right = ex > W / 2, lx = ex + (right ? -18 : 18), anchor = right ? "end" : "start";
        var href0 = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(p.q || p.n);
        return '<a' + (p.cat ? ' class="cm-c-' + p.cat + '"' : "") + ' href="' + attr(href0) + '" target="_blank" rel="noopener noreferrer"><title>' + p.n + "：開 Google 地圖</title>" +
          '<path class="cm-edge" transform="translate(' + f(ex) + " " + f(ey) + ") rotate(" + f(ang) + ')" d="M10 0 L-6 -7 L-3 0 L-6 7 Z"/>' +
          '<text class="cm-n cm-n-edge" x="' + f(lx) + '" y="' + f(ey + 2) + '" text-anchor="' + anchor + '">' + p.n + "</text>" +
          (p.sub ? '<text class="cm-s" x="' + f(lx) + '" y="' + f(ey + 19) + '" text-anchor="' + anchor + '">' + p.sub + "</text>" : "") + "</a>";
      }
      var tone = p.kind === "stay" ? "cm-blob-stay" : p.icon === "garden" || p.icon === "castle" ? "cm-blob-green" : "cm-blob";
      /* 標籤放上方時，名稱再往上推一行，小註寫在名稱和圖示之間，才不會壓到圖示 */
      var pos = { r: [30 * Q, 8, "start"], l: [-30 * Q, 8, "end"], t: [0, (p.sub ? -52 : -32) * Q, "middle"], b: [0, 44 * Q, "middle"] }[p.pos || "r"];
      var rot = f((rnd() - 0.5) * 5);
      var tx = x + pos[0], ty = y + pos[1];
      var label = '<g transform="rotate(' + rot + " " + f(tx) + " " + f(ty) + ')"><text class="cm-n' + (p.kind === "stay" ? " cm-n-stay" : "") + '" x="' + f(tx) + '" y="' + f(ty) + '" text-anchor="' + pos[2] + '">' + p.n + "</text>" +
        (p.sub ? '<text class="cm-s" x="' + f(tx) + '" y="' + f(ty + 20 * Q) + '" text-anchor="' + pos[2] + '">' + p.sub + "</text>" : "") + "</g>";
      var href = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(p.q || p.n);
      return '<a' + (p.cat ? ' class="cm-c-' + p.cat + '"' : "") + ' href="' + attr(href) + '" target="_blank" rel="noopener noreferrer"><title>' + p.n + "：開 Google 地圖</title>" +
        blob(x, y, 28 * Q, tone) + '<g class="cm-ic" transform="translate(' + f(x) + " " + f(y) + ') scale(' + IS + ')">' + (ICON[p.icon] || ICON.dot) + "</g>" + label +
        (badges[p.n] ? '<circle class="cm-no" cx="' + f(x - 22) + '" cy="' + f(y - 22) + '" r="12"/><text class="cm-no-t" x="' + f(x - 22) + '" y="' + f(y - 17) + '" text-anchor="middle">' + badges[p.n] + "</text>" : "") + "</a>";
    });
    var bar = m.scale * K / 111320, bx = 30, by = H - 34;
    var scale = sketch([[bx, by], [bx + bar, by]], "cm-bar", 1.5) + '<path class="cm-bar" d="M' + bx + " " + (by - 7) + "v7M" + f(bx + bar) + " " + (by - 7) + 'v7"/>' +
      '<text class="cm-s" x="' + bx + '" y="' + (by - 12) + '">' + (m.scale >= 1000 ? m.scale / 1000 + " km" : m.scale + " m") + "</text>";
    var north = '<g class="cm-north" transform="translate(' + (W - 44) + "," + (H - 60) + ')"><path class="cm-ink" d="M0 -20 L6 4 L0 0 L-6 4 Z"/><path class="ic" d="M0 0 L6 4 L0 22 L-6 4"/><text y="-26" text-anchor="middle">N</text></g>';
    var sea = m.sea ? (function (c) { return '<text class="cm-sea" x="' + f(c[0]) + '" y="' + f(c[1]) + '" text-anchor="middle">' + m.sea.t + "</text>"; })(xy(m.sea.ll)) : "";
    var fid = "cm-wob-" + m.id;
    var steps = m.steps ? (m.steps.length ? '<ol class="cm-steps">' + each(m.steps, function (st) {
      return "<li>" + (st.t ? '<span class="tm">' + st.t + "</span>" : "") + "<span>" + st.text + "</span></li>";
    }) + "</ol>" : "") + (m.stepsNote ? '<p class="fine" style="margin:6px 0 0">' + m.stepsNote + "</p>" : "") : "";
    /* 分類按鈕：一組 radio，選到哪一類就只顯示那一類的地點（CSS :has 判斷，不用 JS） */
    var filters = m.filters ? '<div class="cm-filter" role="radiogroup" aria-label="篩選地點">' + each(m.filters, function (fl, i) {
      return '<label><input type="radio" name="cmf-' + m.id + '" value="' + fl.v + '"' + (i ? "" : " checked") + ">" + fl.t + "</label>";
    }) + "</div>" : "";
    return '<figure class="citymap' + (m.kind ? " cm-" + m.kind : "") + (m.dense ? " cm-dense" : "") + '">' + filters + '<svg viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="' + attr(m.title + "手繪示意地圖") + '">' +
      '<defs><filter id="' + fid + '"><feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" seed="3"/><feDisplacementMap in="SourceGraphic" scale="3"/></filter>' +
      '<filter id="' + fid + '-g"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" seed="5" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 0.35 0 0 0 0 0.3 0 0 0 0 0.2 0 0 0 0.09 0"/></filter></defs>' +
      '<rect width="' + W + '" height="' + H + '" filter="url(#' + fid + '-g)"/>' +
      '<clipPath id="' + fid + '-c"><rect x="' + o + '" y="' + o + '" width="' + (W - o * 2) + '" height="' + (H - o * 2) + '"/></clipPath>' +
      '<g clip-path="url(#' + fid + '-c)"><g filter="url(#' + fid + ')">' + areas + wash + "</g>" + roads + lines + waves + rails + trees + "</g>" +
      frame + tape + head + alabels + rings + route + links + rivers + sea + scale + north +
      '<g class="cm-marks">' + marks + "</g></svg>" +
      '<figcaption><span class="mf-t">' + m.title + "</span>" + steps + "</figcaption></figure>";
  }
  /* 地點小插圖：以 (0,0) 為中心、約 32px 大。ic＝墨線，其餘 class 是填色 */
  var ICON = {
    dot: '<circle class="cm-ink" r="5"/>',
    stay: '<path class="ic cm-f-mark" d="M-15 -1 L0 -15 L15 -1 Z"/><path class="ic cm-f-paper" d="M-11 -1 V13 H11 V-1"/><path class="ic" d="M-3 13 V5 H3 V13"/>',
    station: '<rect class="ic cm-f-paper" x="-11" y="-14" width="22" height="23" rx="6"/><rect class="ic" x="-7" y="-10" width="14" height="7" rx="2"/><circle class="cm-ink" cx="-5.5" cy="3" r="1.8"/><circle class="cm-ink" cx="5.5" cy="3" r="1.8"/><path class="ic" d="M-7 9 L-11 15 M7 9 L11 15"/>',
    market: '<path class="ic cm-f-mark" d="M-14 -9 H14 L12 -3 H-12 Z"/><path class="ic" d="M-7 -9 L-6 -3 M0 -9 V-3 M7 -9 L6 -3"/><path class="ic cm-f-paper" d="M-11 -3 V12 H11 V-3"/><path class="ic cm-f-water" d="M-7 5 Q-1 0 5 5 Q-1 10 -7 5 Z M5 5 L9 2 V8 Z"/>',
    lantern: '<path class="ic" d="M0 -18 V-13"/><path class="ic" d="M-4 -13 H4 M-4 13 H4"/><ellipse class="ic cm-f-lan" rx="8" ry="11"/><path class="ic" d="M-8 -3 H8 M-7 4 H7"/>',
    garden: '<path class="ic cm-f-green" d="M-14 -6 Q0 -13 14 -6 L11 -4 H-11 Z"/><path class="ic cm-f-paper" d="M-5 -4 V2 H5 V-4"/><path class="ic" d="M-3 2 L-9 14 M3 2 L5 14"/><path class="ic cm-w" d="M-15 15 Q-5 12 15 15"/>',
    shop: '<path class="ic cm-f-gold" d="M-10 -5 H10 L12 13 H-12 Z"/><path class="ic" d="M-5 -5 Q-5 -13 0 -13 Q5 -13 5 -5"/>',
    castle: '<path class="ic cm-f-green" d="M-8 -12 Q0 -18 8 -12 L6 -10 H-6 Z"/><path class="ic cm-f-paper" d="M-5 -10 V-5 H5 V-10"/><path class="ic cm-f-green" d="M-12 -5 Q0 -11 12 -5 L10 -3 H-10 Z"/><path class="ic cm-f-paper" d="M-8 -3 V3 H8 V-3"/><path class="ic cm-f-green" d="M-15 3 Q0 -2 15 3 L13 5 H-13 Z"/><path class="ic cm-f-stone" d="M-12 5 L-15 15 H15 L12 5 Z"/><circle class="cm-f-gold" cx="-7" cy="-13" r="1.8"/><circle class="cm-f-gold" cx="7" cy="-13" r="1.8"/>',
    fish: '<path class="ic cm-f-water" d="M-13 0 Q-3 -10 8 0 Q-3 10 -13 0 Z M8 0 L15 -6 V6 Z"/><circle class="cm-ink" cx="-7" cy="-1.5" r="1.4"/><circle class="ic" cx="10" cy="-12" r="2"/><circle class="ic" cx="4" cy="-16" r="1.4"/>',
    lego: '<rect class="ic cm-f-mark" x="-13" y="-1" width="26" height="12" rx="1.5"/><rect class="ic cm-f-mark" x="-9" y="-4" width="5" height="3"/><rect class="ic cm-f-mark" x="4" y="-4" width="5" height="3"/><rect class="ic cm-f-gold" x="-9" y="-13" width="15" height="9" rx="1.5"/><rect class="ic cm-f-gold" x="-6" y="-16" width="4" height="3"/><rect class="ic cm-f-gold" x="1" y="-16" width="4" height="3"/>',
    bath: '<path class="ic cm-f-water" d="M-13 3 Q0 15 13 3 Z"/><path class="ic" d="M-6 0 q-3 -4 0 -8 t0 -8 M0 0 q-3 -4 0 -8 t0 -8 M6 0 q-3 -4 0 -8 t0 -8"/>',
    conbini: '<rect class="ic cm-f-paper" x="-12" y="-5" width="24" height="17"/><path class="ic cm-f-mark" d="M-13 -5 H13 L11 -11 H-11 Z"/><path class="ic" d="M-4 12 V4 H4 V12"/>',
    cart: '<path class="ic" d="M-15 -10 H-10 L-6 6 H10 L13 -5 H-8"/><path class="ic cm-f-gold" d="M-7 -3 H11 L9 3 H-5 Z"/><circle class="cm-ink" cx="-3" cy="11" r="2"/><circle class="cm-ink" cx="8" cy="11" r="2"/>',
    pharmacy: '<rect class="ic cm-f-paper" x="-11" y="-11" width="22" height="22" rx="4"/><path class="ic cm-f-mark" d="M-3 -7 H3 V-3 H7 V3 H3 V7 H-3 V3 H-7 V-3 H-3 Z"/>',
    laundry: '<rect class="ic cm-f-paper" x="-11" y="-13" width="22" height="26" rx="3"/><circle class="ic cm-f-water" cy="2" r="7"/><path class="ic" d="M-7 -9 H-2"/>',
    fuel: '<rect class="ic cm-f-mark" x="-10" y="-13" width="14" height="26" rx="2"/><rect class="ic cm-f-paper" x="-7" y="-9" width="8" height="6"/><path class="ic" d="M4 -6 L9 -2 V8 Q9 11 6 11"/>',
    clinic: '<circle class="ic cm-f-paper" r="12"/><path class="ic cm-f-green" d="M-3 -8 H3 V-3 H8 V3 H3 V8 H-3 V3 H-8 V-3 H-3 Z"/>',
    parking: '<rect class="ic cm-f-water" x="-11" y="-12" width="22" height="22" rx="4"/><path class="ic" d="M-4 6 V-6 H1.5 Q6 -6 6 -1.5 Q6 3 1.5 3 H-4"/>',
    temple: '<path class="ic cm-f-stone" d="M-15 -2 Q0 -14 15 -2 L12 0 H-12 Z"/><path class="ic cm-f-paper" d="M-9 0 V12 H9 V0"/><path class="ic" d="M-3 12 V5 H3 V12"/>',
    gassho: '<path class="ic cm-f-thatch" d="M0 -17 L13 8 H-13 Z"/><path class="ic cm-f-snow" d="M0 -17 L5 -7.5 H-5 Z"/><path class="ic cm-f-paper" d="M-10 8 V13 H10 V8"/><path class="ic" d="M-4 -2 H4 M-7 3 H7"/>',
    view: '<rect class="ic cm-f-paper" x="-12" y="-7" width="24" height="16" rx="3"/><circle class="ic cm-f-water" cy="1" r="5"/><path class="ic" d="M-5 -7 L-3 -11 H3 L5 -7"/>',
    street: '<path class="ic cm-f-paper" d="M-14 12 V-2 L-7 -8 L0 -2 L7 -8 L14 -2 V12 Z"/><path class="ic" d="M-10 12 V4 H-4 V12 M3 2 H10 V7 H3 Z"/><path class="ic cm-f-lan" d="M-1 -1 h3 v5 h-3 Z"/>',
    bridge: '<path class="ic cm-f-mark" d="M-15 3 Q0 -11 15 3 L15 7 Q0 -6 -15 7 Z"/><path class="ic" d="M-11 1 V-4 M11 1 V-4 M-11 -4 Q0 -14 11 -4"/><path class="ic cm-w" d="M-16 13 Q-6 9 4 13 T16 13"/>',
    tower: '<path class="ic" d="M-6 15 L-2 -12 H2 L6 15 M-4.6 5 H4.6 M-3.4 -3 H3.4 M-5.5 11 L3 5 M5.5 11 L-3 5"/><path class="ic cm-f-mark" d="M-3 -12 L0 -18 L3 -12 Z"/>',
    oasis: '<ellipse class="ic cm-f-water" cy="-5" rx="14" ry="4.5"/><path class="ic" d="M-7 -1 L-9 13 M7 -1 L9 13 M-12 13 H12"/>',
    train: '<path class="ic cm-f-paper" d="M-16 7 H9 Q18 7 17 1 Q13 -7 -16 -7 Z"/><path class="ic" d="M-12 -3 H8"/><path class="ic cm-f-water" d="M9 -5 Q14 -3 15 0 H9 Z"/><path class="ic" d="M-18 12 H18"/><circle class="cm-ink" cx="-10" cy="9" r="1.8"/><circle class="cm-ink" cx="4" cy="9" r="1.8"/>'
  };
  /* 每天細項的小標題與清單，在 v2 版面改成段落內換行 */
  function flatten(html) {
    return html.replace(/<h3>(.*?)<\/h3><ul>(.*?)<\/ul>/g, function (m, h, ul) {
      return "<p>" + h + "<br>" + ul.replace(/<li>(.*?)<\/li>/g, "$1<br>").replace(/<br>$/, "") + "</p>";
    });
  }

  var views = {
    "overview-lead": function () { return T.overview.lead; },
    "hero-line": function () { return T.overview.heroLine; },
    "hero-jp": function () { return T.overview.hero.jp; },
    "hero-title": function () { return T.overview.hero.title; },
    "hero-dates": function () { return T.overview.hero.dates; },
    "hero-tagline": function () { return T.overview.hero.line; },
    "people-lead": function () { return T.people.lead; },
    "journey-lead": function () { return T.transport.lead; },
    "timeline-lead": function () { return T.transport.timelineCaption; },
    "stay-lead": function () { return T.stay.lead; },
    "itinerary-lead": function () { return T.itinerary.lead + T.itinerary.legend; },
    "prep-lead": function () { return T.prep.lead; },
    "coupon-lead": function () { return T.coupons.lead; },
    "packing-note": function () { return T.prep.packingNote; },
    "map-lead": function () { return T.overview.mapLead; },
    "map-note": function () { return T.overview.mapNote; },
    legend: function () {
      return '<div class="legend">' + each(T.overview.route, function (r, i) {
        return '<div><span class="k">0' + (i + 1) + " " + r.place + '</span><span class="v">' + r.when + '</span><span class="n">' + r.mapNote + "</span></div>";
      }) + "</div>";
    },

    route: function () {
      return each(T.overview.route, function (r, i) {
        return '<div class="route-row"><span class="no">0' + (i + 1) + '</span><span class="pl">' + r.place + '</span><span class="wh">' + r.when + "</span></div>";
      });
    },

    overview: function () {
      return '<div class="stats">' + each(T.overview.stats, function (s) {
        return '<div class="stat"><span class="k">' + s.k + '</span><span class="v">' + s.v + '</span><span class="n">' + s.n + "</span></div>";
      }) + '</div><div class="sec"><span class="sec-n">三組旅伴</span><span class="bar"></span></div>' + groupsHtml();
    },

    people: function () {
      var p = T.people;
      return groupsHtml("margin-top:0") + sec("旅伴名單") + '<div class="ledger" id="v2-people-list">' +
        '<div class="row row-people row-head"><span class="cell-w">家庭</span><span class="cell-w">大人</span><span class="cell-w">小孩</span><span class="cell-w">人數</span><span class="cell-w g-col">同行組別</span></div>' +
        each(p.families, function (f, i) {
        return '<div class="row row-people"><span class="no-m">' + (i + 1) + '</span><span class="cell">' + f.adults + '</span><span class="cell-s">' +
          (f.kids || "—") + '</span><span class="num">' + f.n + '</span><span class="cell-s g-col">' + group(f.group).label + "</span></div>";
      }) + '</div><div class="prose plain" style="margin-top:clamp(28px,3.4vw,40px)"><div class="blk"><h3>在哪裡一起旅行？</h3><p>' + p.together + "</p></div></div>" +
        sec(p.carsTitle, p.carsCount).replace('<div class="sec"', '<div class="sec" id="v2-cars"') +
        '<div class="groups" style="margin-top:clamp(20px,2.4vw,28px);grid-template-columns:repeat(auto-fit,minmax(250px,1fr))">' + each(p.cars, function (c) {
          return '<div class="group"><div class="body"><span class="k lab">' + c.title + '</span><span class="nm" style="font-size:19px;line-height:1.8">' + c.lines.join("<br>") + "</span></div></div>";
        }) + '</div><p class="note">' + p.carsNote + "</p>";
    },

    timeline: function () {
      var t = T.transport;
      function tlFlight(f) {
        return '<div class="tl-flight"><span class="k">' + f.date + " · " + f.label + '</span><span class="rt">' + f.from[0] + " " + f.from[1] + " → " + f.to[0] + " " + f.to[1] +
          '</span><span class="tm"><span>' + f.from[2] + '</span><span>→ ' + f.to[2] + "</span></span>" + (f.note ? '<span class="nt">' + f.note + "</span>" : "") + "</div>";
      }
      var rows = each(T.groups, function (g) {
        return '<tr><th scope="row"><span class="kanji g-' + g.id + '">' + g.tag + '</span><span class="nm">' + g.name + '</span><span class="rg">' + g.period + "<br>" + g.count + "</span></th>" +
          each(t.timeline[g.id], function (c) {
            var span = c.span > 1 ? ' colspan="' + c.span + '"' : "";
            if (c.kind === "empty") return "<td" + span + ' class="tl-empty" aria-label="非旅行區間"></td>';
            return "<td" + span + ' class="' + (c.kind === "pending" ? "tl-pending" : "tl-" + g.id) + '">' + each(c.blocks, function (b) {
              if (b.flight !== undefined) return tlFlight(t.flights[g.id][b.flight]);
              if (b.unknown) return '<div class="tl-unknown"><b>' + b.unknown + "</b><small>" + b.small + "</small></div>";
              return (b.strong ? "<b>" + b.strong + "</b>" : "") + (b.small ? "<small>" + b.small + "</small>" : "");
            }) + "</td>";
          }) + "</tr>";
      });
      return sec(t.timelineTitle, "", "margin-top:0") + '<p class="fine tl-intro">' + t.timelineIntro + "</p>" +
        '<div class="tl-legend">' + each(T.groups, function (g) { return '<span><i class="tl-' + g.id + '"></i>' + g.label + "</span>"; }) +
        '<span><i class="tl-pending"></i>' + t.pendingLegend + "</span></div>" +
        '<div class="tl-scroll" tabindex="0" role="region" aria-label="三組旅伴的日期、交通與旅行地點"><table class="tl"><caption>' + t.timelineCaption +
        '</caption><thead><tr><th scope="col">旅伴</th>' + each(t.timelineDates, function (d) { return '<th scope="col">' + d + "</th>"; }) +
        "</tr></thead><tbody>" + rows + '</tbody></table></div><p class="fine">' + t.airportNote + ' <a class="inline-link" href="#people" data-jump="v2-cars">查看租車分組 →</a></p>';
    },

    journey: function () {
      var t = T.transport;
      function end(a, right) {
        return '<span class="c' + (right ? " r" : "") + '"><span class="tm">' + a[2] + '</span><span class="ap">' + a[1] + " " + a[0] + "</span></span>";
      }
      return sec("航班", "", "margin-top:0") + '<div class="ledger">' + each(T.groups, function (g) {
        return '<div class="flight"><div class="flight-h"><span class="kanji g-' + g.id + '">' + g.tag + '</span><span class="nm">' + g.name + '</span><span class="ct">' + g.people + '</span></div><div class="legs">' +
          each(t.flights[g.id], function (f) {
            return '<div class="leg"><span class="k">' + f.dir + " · " + f.date + '</span><div class="leg-t">' + end(f.from) + '<span class="dash"></span>' + end(f.to, true) +
              '</div><span class="mt">' + (f.v2label || f.label) + (f.note ? " · " + f.note : "") + "</span></div>";
          }) + "</div></div>";
      }) + '</div><p class="fine">' + t.flightTimeNote + "</p>" +
        sec("地面交通") + '<div class="ledger">' + each(t.ground, todoRow) + "</div>" +
        sec(t.mapsTitle) + '<div class="maps">' + each(t.maps, function (m) {
          return '<figure class="map-fig"><a href="' + attr(m.src) + '" target="_blank" rel="noopener noreferrer">' +
            '<img src="' + attr(m.src) + '" alt="' + attr(m.file) + '路線圖" loading="lazy" decoding="async"></a>' +
            '<figcaption><span class="mf-t">' + m.file + '</span><span class="mf-n">' + m.note + "</span></figcaption></figure>";
        }) + '</div><p class="fine">' + t.mapsNote + "</p>";
    },

    stay: function () {
      var s = T.stay, k = s.kanazawa, n = s.nagoya, v = s.vjw;
      var ext = ' target="_blank" rel="noopener noreferrer"';
      /* 住處附近：手繪地圖＋清單（超市、錢湯、公園等），標題連到 Google 地圖 */
      function nearby(o) {
        if (!o.nearby) return "";
        return sec(o.nearbyTitle) + (o.map ? '<div class="stay-map">' + cityMap(o.map) + "</div>" : "") + '<div class="ledger">' + each(o.nearby, function (c) {
          return todoRow({ kind: c.kind, when: c.when, text: c.text, title: '<a href="' + attr(c.href) + '"' + ext + ">" + c.title + " ↗</a>" });
        }) + '</div><p class="fine">' + (o.nearbyNote || "") + "</p>";
      }
      return '<div class="hub"><div class="l"><span class="t">' + s.notion.title + '</span><span class="n">' + s.notion.text + '</span></div><a class="cta" href="' +
        attr(s.notion.href) + '"' + ext + ">" + s.notion.cta + "</a></div>" +
        sec(k.place, dash(k.period)) + '<div class="prose">' +
        (k.house ? '<a class="linkline" href="' + attr(k.house.href) + '"' + ext + ">" + k.house.text + "</a>" : "") + each(k.blocks, function (b) { return '<div class="blk"><h3>' + b.title + "</h3>" + b.html + "</div>"; }) + "</div>" +
        nearby(k) +
        '<div class="ledger thin" style="margin-top:clamp(28px,3.4vw,40px)">' +
        '<div class="row row-stay row-head"><span class="cell-w">家庭／旅伴</span><span class="cell-w">人數</span><span class="cell-w">入住日期</span></div>' +
        each(T.people.families, function (f) {
          return '<div class="row row-stay"><span class="cell">' + f.adults + (f.kids ? "、" + f.kids : "") + '</span><span class="num">' + f.n + '</span><span class="cell-s' +
            (f.pending ? " warnc" : "") + '">' + f.kanazawa + "</span></div>";
        }) + "</div>" +
        sec(n.place, dash(n.period)) + '<div class="prose">' + (n.house ? '<a class="linkline" href="' + attr(n.house.href) + '"' + ext + ">" + n.house.text + "</a>" : "") + '<div class="blk">' +
        each(n.paragraphs, function (x) { return "<p>" + x + "</p>"; }) + "</div></div>" +
        nearby(n) +
        /* 備案住宿，標題連到房源頁 */
        (n.candidates ? sec(n.candidatesTitle || "備案") + '<div class="ledger">' + each(n.candidates, function (c) {
          return todoRow({ kind: c.kind, when: c.when, text: c.text, todo: c.todo,
            title: '<a href="' + attr(c.href) + '"' + ext + ">" + c.title + " ↗</a>" });
        }) + "</div>" : "") +
        (n.rooms ? '<div class="ledger thin" style="margin-top:clamp(28px,3.4vw,40px)">' +
        '<div class="row row-room row-head"><span class="cell-w">臥室</span><span class="cell-w">床位</span><span class="cell-w">入住分配</span></div>' +
        each(n.rooms, function (r, i) {
          return '<div class="row row-room"><span class="no-m">' + (i + 1) + '</span><span class="cell">' + r[0] + '</span><span class="cell-s">' + r[1] + "</span></div>";
        }) + "</div>" : "") +
        '<div class="prose plain" style="margin-top:clamp(40px,5vw,64px)"><div class="blk"><h3>' + v.title + "</h3><p>" + v.ja + "<br>" + v.en + "</p></div>" +
        '<div class="ledger thin" style="margin-top:0">' + each(v.fields, function (f) {
          return '<div class="row row-vjw"><span class="cell-w">' + f[0] + '</span><span class="cell-b">' + f[1] + "</span></div>";
        }) + '</div><p class="fine" style="margin-top:0">' + v.note + '</p><div class="links">' +
        each(v.links, function (l) { return '<a href="' + attr(l.href) + '"' + ext + ">" + l.text + "</a>"; }) + "</div></div>" +
        '<div class="note" style="margin-top:clamp(36px,4.6vw,58px)"><h3>' + s.checklist.title + "</h3>" + s.checklist.text + "</div>";
    },

    itinerary: function () {
      var it = T.itinerary;
      var days = each(it.days, function (d, i) {
        var chips = [];
        if (d.choice) chips.push("二擇一");
        if (d.extra) chips.push(d.extra);
        if (d.pending) chips.push(group(d.pending).tag + " 住宿未定");
        return '<div class="day" id="v2-day-' + d.date.replace("/", "-") + '"><div class="side"><span class="d">' + d.date + '</span><span class="w">' + d.wd + '</span><span class="dn">DAY ' + (i + 1) + "</span></div>" +
          '<div class="body"><div class="day-h"><span class="t">' + d.title + (d.choice ? " " + d.choice : "") + '</span><span class="crew">' +
          each(d.crew, function (c) { return '<span class="g-' + c + '">' + group(c).tag + "</span>"; }) + "</span></div>" + flatten(d.detail) +
          '<div class="day-f"><span>當晚 · ' + d.night + "</span>" + each(chips, function (c) { return '<span class="warnc">' + c + "</span>"; }) + "</div></div>" +
          (d.map ? '<div class="day-map" id="v2-map-' + d.map + '">' + cityMap(it.walkMaps.filter(function (w) { return w.id === d.map; })[0]) + "</div>" : "") + "</div>";
      });
      function crew(ids) { return '<span class="crew">' + each(ids, function (c) { return '<span class="g-' + c + '">' + group(c).tag + "</span>"; }) + "</span>"; }
      var periods = '<div class="groups" style="margin-top:0">' + each(T.groups, function (g) {
        return '<div class="group"><span class="kanji g-' + g.id + '">' + g.tag + '</span><div class="body"><span class="nm">' + g.name + '</span><span class="ct">' + g.period +
          '</span><span class="rg">' + g.brief + "</span></div></div>";
      }) + "</div>";
      var summary = sec("行程總表") + '<p class="fine tl-intro">' + it.tableHint + "</p>" +
        '<div class="ledger">' + each(it.days, function (d) {
          return '<div class="row row-sum"><a class="sum-d" href="#itinerary" data-day="' + d.date + '"><span class="d">' + d.date + '</span><span class="w">' + d.wd + " ↓</span></a>" +
            '<div class="sum-p"><div class="day-h"><span class="t">' + d.title + (d.choice ? " " + d.choice : "") + "</span>" + crew(d.crew) +
            (d.map ? '<a class="mapchip" href="#itinerary" data-jump="v2-map-' + d.map + '">地圖 ↓</a>' : "") + "</div>" +
            (d.note ? '<span class="cell-s warnc">' + d.note + "</span>" : "") + "</div>" +
            '<div class="sum-s">' + (d.stay ? '<span class="cell">' + d.stay + "</span>" + crew(d.crew) +
              (d.pending ? '<span class="cell-s warnc">' + group(d.pending).tag + " 住宿未定</span>" : "") : '<span class="cell-s">—</span>') + "</div></div>";
        }) + "</div>";
      return periods + summary + sec("每天細項") + '<div class="ledger">' + days + "</div>" +
        '<div class="prose plain" style="margin-top:clamp(30px,3.6vw,44px);gap:12px"><p style="margin:0;font-size:13px;line-height:2.05;color:var(--body)">' + T.people.carsSummary +
        '</p><a href="#people" data-jump="v2-cars" style="font-size:12.5px;letter-spacing:.1em;color:var(--mark);border-bottom:1px solid var(--mark);padding-bottom:2px;width:max-content">查看車輛分組 →</a></div>' +
        sec(it.ticketsTitle) + '<div class="ledger">' + each(it.tickets, todoRow) + "</div>" +
        sec(it.remindersTitle) + '<div class="ledger">' + each(it.reminders, function (r, i) {
          return '<div class="row row-rem"><span class="no-m" style="font-size:14px">0' + (i + 1) + '</span><span class="cell-t">' + r + "</span></div>";
        }) + "</div>";
    },

    citymaps: function () {
      var t = T.transport;
      /* 走路逛街的街道地圖放在行程頁當天，這裡列入口 */
      var walks = each(T.itinerary.walkMaps, function (w) {
        var day = T.itinerary.days.filter(function (d) { return d.map === w.id; })[0];
        return '<a class="linkline" href="#itinerary" data-jump="v2-map-' + w.id + '">' + (day ? day.date + " " : "") + w.heading + " →</a>";
      });
      return sec(t.cityMapsTitle, "", "margin-top:clamp(30px,4vw,48px)") + '<div class="citymaps">' + each(t.cityMaps, cityMap) + '</div><p class="fine">' + t.cityMapsNote + "</p>" +
        (walks ? '<div class="walklinks"><span class="k">走路逛街的街道地圖在行程頁當天</span>' + walks + "</div>" : "");
    },
    "food-lead": function () { return T.food.lead; },
    food: function () {
      var f = T.food;
      return sec(f.dishesTitle, "", "margin-top:0") + '<div class="ledger">' + each(f.dishes, todoRow) + "</div>" +
        sec(f.bookingsTitle) + '<div class="ledger">' + each(f.bookings, todoRow) + '</div><p class="fine">' + f.bookingsNote + "</p>" +
        sec(f.comboTitle) + '<p class="lead">' + f.comboLead + '</p>' +
        '<div class="maps combo-wrap"><figure class="map-fig"><a href="' + attr(f.comboImg) + '" target="_blank" rel="noopener noreferrer">' +
        '<img src="' + attr(f.comboImg) + '" alt="LAWSON 超商組合 TOP20" loading="lazy" decoding="async"></a>' +
        '<figcaption><span class="mf-t">LAWSON 超商神級組合 TOP20</span><ul class="combo-list">' +
        each(f.comboPicks, function (p) { return "<li>" + p + "</li>"; }) +
        "</ul></figcaption></figure></div>" +
        '<p class="fine">' + f.comboNote + "</p>";
    },

    "emergency-lead": function () { return T.emergency.lead; },
    emergency: function () {
      var e = T.emergency;
      /* 電話的標題做成 tel: 連結，手機點一下就撥 */
      var calls = each(e.calls, function (c) {
        return todoRow({ kind: c.kind, when: c.when, text: c.text,
          title: '<a href="tel:' + attr(c.tel.replace(/[^0-9+#]/g, "").replace("#", "%23")) + '">' + c.title + "</a>" });
      });
      return sec(e.callsTitle, "", "margin-top:0") + '<div class="ledger">' + calls + "</div>" +
        sec(e.addressTitle) + '<div class="ledger">' + each(e.addresses, function (a) {
          var p = a.place.split(" · ");
          return todoRow({ kind: p[0], when: p[1] || "", title: a.ja, text: "" });
        }) + "</div>" +
        (e.clinics ? sec(e.clinicsTitle) + '<div class="ledger">' + each(e.clinics, function (c) {
          return todoRow({ kind: c.kind, when: c.when, text: c.text, title: '<a href="' + attr(c.href) + '" target="_blank" rel="noopener noreferrer">' + c.title + " ↗</a>" });
        }) + '</div><p class="fine">' + (e.clinicsNote || "") + "</p>" : "") +
        sec(e.passportTitle) + '<div class="ledger">' + each(e.passport, function (x, i) {
          return '<div class="row row-rem"><span class="no-m" style="font-size:14px">0' + (i + 1) + '</span><span class="cell-t">' + x + "</span></div>";
        }) + "</div>" +
        sec(e.phrasesTitle, e.phrasesNote) + '<div class="ledger">' + each(e.phrases, function (p, i) {
          return '<div class="row row-rem"><span class="no-m" style="font-size:14px">0' + (i + 1) + '</span><span class="cell-t"><b style="font-size:17px;font-weight:500">' + p[0] + '</b><br><span style="color:var(--muted)">' + p[1] + "</span></span></div>";
        }) + '</div><p class="fine">' + each(e.links, function (l) {
          return '<a href="' + attr(l.href) + '" target="_blank" rel="noopener noreferrer" style="margin-right:18px;border-bottom:1px solid var(--rule)">' + l.text + "</a>";
        }) + "</p>";
    },

    coupon: function () {
      var c = T.coupons;
      return sec(c.howTitle, "", "margin-top:0") + '<div class="ledger">' + each(c.how, function (x, i) {
          return '<div class="row row-rem"><span class="no-m" style="font-size:14px">0' + (i + 1) + '</span><span class="cell-t">' + x + "</span></div>";
        }) + "</div>" +
        sec(c.listTitle) +
        '<div class="ledger"><div class="row row-coupon row-head"><span class="cell-w">店家</span><span class="cell-w">折扣</span><span class="cell-w">名古屋在哪</span><span class="cell-w">券</span></div>' +
        each(c.list, function (x) {
          var links = "";
          if (x.url) links += '<a class="cpn" href="' + attr(x.url) + '" target="_blank" rel="noopener noreferrer">官方券頁 →</a>';
          else links += '<span class="muted-x">官方券頁失效</span>';
          if (x.img) links += '<a class="cpn cpn-img" href="' + attr(x.img) + '" target="_blank" rel="noopener noreferrer">' + (x.imgLabel || "券圖") + " →</a>";
          return '<div class="row row-coupon"><span class="cell">' + x.shop + '</span><span class="cell-t">' + x.off +
            (x.note ? '<span class="cpn-note">' + x.note + "</span>" : "") +
            '</span><span class="cell-s">' + x.where + '</span><span class="cell-s">' + links + "</span></div>";
        }) + "</div>" +
        '<p class="fine">' + c.listNote + "</p>" +
        sec(c.whenTitle) + '<div class="ledger">' + each(c.when, function (x, i) {
          return '<div class="row row-rem"><span class="no-m" style="font-size:14px">0' + (i + 1) + '</span><span class="cell-t">' + x + "</span></div>";
        }) + "</div>";
    },

    weather: function () {
      var p = T.prep;
      return '<div class="sec" style="margin-top:0"><span class="sec-t">三月氣溫</span><span class="sec-s">' + p.source + '</span><span class="bar"></span></div><div class="wx">' +
        each(p.weather, function (w) {
          return '<div class="wx-c"><div class="wx-h"><span class="pl">' + w.place + '</span><span class="tg">' + w.tag + '</span></div><div class="wx-t"><span class="c"><span class="hi">' +
            w.hi + '</span><span class="k">日最高</span></span><span class="c"><span class="lo">' + w.lo + '</span><span class="k">日最低</span></span></div><span class="n">' + w.note + "</span></div>";
        }) + '</div><div class="note" style="margin-top:clamp(28px,3.4vw,42px)"><h3>' + p.clothingTitle + "</h3>" + p.clothing + "</div>";
    }
  };

  Array.prototype.forEach.call(document.querySelectorAll("[data-v2]"), function (el) {
    var html = views[el.getAttribute("data-v2")]();
    if (el.tagName === "DIV") el.outerHTML = html; else { el.innerHTML = html; el.removeAttribute("data-v2"); }
  });

  /* ---------- 倒數 ---------- */
  var s = T.start.split("-");
  var diff = Math.floor((new Date(+s[0], s[1] - 1, +s[2]) - new Date()) / 864e5);
  var n = document.getElementById("cd-n"), u = document.getElementById("cd-u");
  var days = diff > 0 ? diff : diff > -11 ? 1 - diff : 0;
  u.textContent = diff > 0 ? "天後出發" : diff > -11 ? "旅程第幾天" : "旅程已結束";
  /* 最終值另外記在 data-final：頁首壓縮列的倒數在 Alpine 初始化時讀一次，不能讀到跑動中的數字 */
  n.dataset.final = days ? String(days) : "—";
  /* 數字從 0 跑到目標，1.6 秒、五次方 ease-out：前半秒衝到 150 以上，後面一秒慢慢一格一格停在目標，
     像里程表落定。這是唯一一個用 JS 跑的動態：改的是文字內容，CSS 動不了。
     使用者關掉動態、或是數字是「—」，直接顯示。 */
  var still = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!days || still || document.hidden || !window.requestAnimationFrame) { n.textContent = n.dataset.final; }
  else {
    var t0 = null, done = false;
    requestAnimationFrame(function step(t) {
      if (done) return;
      if (t0 === null) t0 = t;
      var p = Math.min(1, (t - t0) / 1600);
      n.textContent = String(Math.round(days * (1 - Math.pow(1 - p, 5))));
      if (p < 1) requestAnimationFrame(step); else done = true;
    });
    /* 分頁在背景時 requestAnimationFrame 不會跑，時間到直接落到最終值 */
    setTimeout(function () { done = true; n.textContent = n.dataset.final; }, 2200);
  }

  /* ---------- 打包清單（與舊版共用同一個瀏覽器儲存鍵） ---------- */
  var PK = "nagoya2027.packing";
  var packed = {};
  try { packed = JSON.parse(localStorage.getItem(PK)) || {}; } catch (e) { packed = {}; }
  function save() { try { localStorage.setItem(PK, JSON.stringify(packed)); } catch (e) {} }
  function paint() {
    var total = 0, done = 0;
    document.getElementById("packs").innerHTML = each(T.prep.packing, function (g) {
      return '<div class="pack"><div class="pack-h"><span class="no">' + g[0] + '</span><span class="t">' + g[1] + "</span></div>" +
        each(g[2], function (t) {
          var key = g[0] + "-" + t, on = !!packed[key];
          total += 1; if (on) done += 1;
          return '<button class="item" type="button" aria-pressed="' + on + '" data-k="' + attr(key) + '"><span class="box" aria-hidden="true">' +
            (on ? "✓" : "") + '</span><span class="tx">' + t + "</span></button>";
        }) + "</div>";
    });
    document.getElementById("pk-count").textContent = "已完成 " + done + " / " + total;
  }
  document.getElementById("packs").addEventListener("click", function (e) {
    var b = e.target.closest(".item");
    if (!b) return;
    var k = b.getAttribute("data-k");
    if (packed[k]) delete packed[k]; else packed[k] = 1;
    save(); paint();
  });
  document.getElementById("pk-reset").addEventListener("click", function () { packed = {}; save(); paint(); });

  paint();
})(window.TRIP);
