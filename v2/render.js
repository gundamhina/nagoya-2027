/*
 * v2 旅帖版的樣板：讀 ../assets/trip-data.js 產生各分頁內容。
 * 這裡只管排版；內容請改 assets/trip-data.js。
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
      return '<div class="group"><span class="kanji">' + g.tag + '</span><div class="body"><span class="nm">' + g.name +
        '</span><span class="ct">' + g.count + '</span><span class="rg">' + g.range + "</span></div></div>";
    }) + "</div>";
  }
  /* 每天細項的小標題與清單，在 v2 版面改成段落內換行 */
  function flatten(html) {
    return html.replace(/<h3>(.*?)<\/h3><ul>(.*?)<\/ul>/g, function (m, h, ul) {
      return "<p>" + h + "<br>" + ul.replace(/<li>(.*?)<\/li>/g, "$1<br>").replace(/<br>$/, "") + "</p>";
    });
  }

  var views = {
    "overview-lead": function () { return T.overview.lead; },
    "people-lead": function () { return T.people.lead; },
    "journey-lead": function () { return T.transport.lead; },
    "stay-lead": function () { return T.stay.lead; },
    "itinerary-lead": function () { return T.itinerary.lead + T.itinerary.legend; },
    "prep-lead": function () { return T.prep.lead; },
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
      return groupsHtml("margin-top:0") + sec("旅伴名單") + '<div class="ledger">' + each(p.families, function (f, i) {
        return '<div class="row row-people"><span class="no-m">' + (i + 1) + '</span><span class="cell">' + f.adults + '</span><span class="cell-s">' +
          (f.kids || "—") + '</span><span class="num">' + f.n + '</span><span class="cell-s g-col">' + group(f.group).label + "</span></div>";
      }) + '</div><div class="prose plain" style="margin-top:clamp(28px,3.4vw,40px)"><div class="blk"><h3>在哪裡一起旅行？</h3><p>' + p.together + "</p></div></div>" +
        sec(p.carsTitle, p.carsCount) +
        '<div class="groups" style="margin-top:clamp(20px,2.4vw,28px);grid-template-columns:repeat(auto-fit,minmax(250px,1fr))">' + each(p.cars, function (c) {
          return '<div class="group"><div class="body"><span class="k lab">' + c.title + '</span><span class="nm" style="font-size:19px;line-height:1.8">' + c.lines.join("<br>") + "</span></div></div>";
        }) + '</div><p class="note">' + p.carsNote + "</p>";
    },

    journey: function () {
      var t = T.transport;
      function end(a, right) {
        return '<span class="c' + (right ? " r" : "") + '"><span class="tm">' + a[2] + '</span><span class="ap">' + a[1] + " " + a[0] + "</span></span>";
      }
      function tlFlight(f) {
        return '<div class="tl-flight"><span class="k">' + f.date + " · " + f.label + '</span><span class="rt">' + f.from[0] + " " + f.from[1] + " → " + f.to[0] + " " + f.to[1] +
          '</span><span class="tm">' + f.from[2] + " → " + f.to[2] + "</span>" + (f.note ? '<span class="nt">' + f.note + "</span>" : "") + "</div>";
      }
      var rows = each(T.groups, function (g) {
        return '<tr><th scope="row"><span class="kanji">' + g.tag + '</span><span class="nm">' + g.name + '</span><span class="rg">' + g.period + "<br>" + g.count + "</span></th>" +
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
      var timeline = sec("日期時間軸", "", "margin-top:0") + '<p class="fine tl-intro">' + t.timelineIntro + "</p>" +
        '<div class="tl-legend">' + each(T.groups, function (g) { return '<span><i class="tl-' + g.id + '"></i>' + g.label + "</span>"; }) +
        '<span><i class="tl-pending"></i>' + t.pendingLegend + "</span></div>" +
        '<div class="tl-scroll" tabindex="0" role="region" aria-label="三組旅伴的日期、交通與旅行地點"><table class="tl"><caption>' + t.timelineCaption +
        '</caption><thead><tr><th scope="col">旅伴</th>' + each(t.timelineDates, function (d) { return '<th scope="col">' + d + "</th>"; }) +
        "</tr></thead><tbody>" + rows + '</tbody></table></div><p class="fine">' + t.airportNote + "</p>";
      return timeline + sec("航班") + '<div class="ledger">' + each(T.groups, function (g) {
        return '<div class="flight"><div class="flight-h"><span class="kanji">' + g.tag + '</span><span class="nm">' + g.name + '</span><span class="ct">' + g.people + '</span></div><div class="legs">' +
          each(t.flights[g.id], function (f) {
            return '<div class="leg"><span class="k">' + f.dir + " · " + f.date + '</span><div class="leg-t">' + end(f.from) + '<span class="dash"></span>' + end(f.to, true) +
              '</div><span class="mt">' + (f.v2label || f.label) + (f.note ? " · " + f.note : "") + "</span></div>";
          }) + "</div></div>";
      }) + '</div><p class="fine">' + t.flightTimeNote + "</p>" +
        sec("地面交通") + '<div class="ledger">' + each(t.ground, function (x) {
          return '<div class="ground"><div class="side"><span class="no">' + x.kind + '</span><span class="wh">' + x.when + '</span></div><div class="body"><span class="ti">' +
            x.title + "</span><p>" + x.text + '</p><span class="todo">待確認 · ' + x.todo + "</span></div></div>";
        }) + "</div>";
    },

    stay: function () {
      var s = T.stay, k = s.kanazawa, n = s.nagoya, v = s.vjw;
      var ext = ' target="_blank" rel="noopener noreferrer"';
      return '<div class="hub"><div class="l"><span class="t">' + s.notion.title + '</span><span class="n">' + s.notion.text + '</span></div><a class="cta" href="' +
        attr(s.notion.href) + '"' + ext + ">" + s.notion.cta + "</a></div>" +
        sec(k.place, dash(k.period)) + '<div class="prose">' + each(k.blocks, function (b) { return '<div class="blk"><h3>' + b.title + "</h3>" + b.html + "</div>"; }) + "</div>" +
        '<div class="ledger thin" style="margin-top:clamp(28px,3.4vw,40px)">' + each(T.people.families, function (f) {
          return '<div class="row row-stay"><span class="cell">' + f.adults + (f.kids ? "、" + f.kids : "") + '</span><span class="num">' + f.n + '</span><span class="cell-s' +
            (f.pending ? " warnc" : "") + '">' + f.kanazawa + "</span></div>";
        }) + "</div>" +
        sec(n.place, dash(n.period)) + '<div class="prose"><a class="linkline" href="' + attr(n.house.href) + '"' + ext + ">" + n.house.text + '</a><div class="blk">' +
        each(n.paragraphs, function (x) { return "<p>" + x + "</p>"; }) + "</div></div>" +
        '<div class="ledger thin" style="margin-top:clamp(28px,3.4vw,40px)">' + each(n.rooms, function (r, i) {
          return '<div class="row row-room"><span class="no-m">' + (i + 1) + '</span><span class="cell">' + r[0] + '</span><span class="cell-s">' + r[1] + "</span></div>";
        }) + "</div>" +
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
          each(d.crew, function (c) { return "<span>" + group(c).tag + "</span>"; }) + "</span></div>" + flatten(d.detail) +
          '<div class="day-f"><span>當晚 · ' + d.night + "</span>" + each(chips, function (c) { return '<span class="warnc">' + c + "</span>"; }) + "</div></div></div>";
      });
      function crew(ids) { return '<span class="crew">' + each(ids, function (c) { return "<span>" + group(c).tag + "</span>"; }) + "</span>"; }
      var periods = '<div class="groups" style="margin-top:0">' + each(T.groups, function (g) {
        return '<div class="group"><span class="kanji">' + g.tag + '</span><div class="body"><span class="nm">' + g.name + '</span><span class="ct">' + g.period +
          '</span><span class="rg">' + g.brief + "</span></div></div>";
      }) + "</div>";
      var summary = sec("行程總表") + '<p class="fine tl-intro">' + it.tableHint + "</p>" +
        '<div class="ledger">' + each(it.days, function (d) {
          return '<div class="row row-sum"><a class="sum-d" href="#itinerary" data-day="' + d.date + '"><span class="d">' + d.date + '</span><span class="w">' + d.wd + " ↓</span></a>" +
            '<div class="sum-p"><div class="day-h"><span class="t">' + d.title + (d.choice ? " " + d.choice : "") + "</span>" + crew(d.crew) + "</div>" +
            (d.note ? '<span class="cell-s warnc">' + d.note + "</span>" : "") + "</div>" +
            '<div class="sum-s">' + (d.stay ? '<span class="cell">' + d.stay + "</span>" + crew(d.crew) +
              (d.pending ? '<span class="cell-s warnc">' + group(d.pending).tag + " 住宿未定</span>" : "") : '<span class="cell-s">—</span>') + "</div></div>";
        }) + "</div>";
      return periods + summary + sec("每天細項") + '<div class="ledger">' + days + "</div>" +
        '<div class="prose plain" style="margin-top:clamp(30px,3.6vw,44px);gap:12px"><p style="margin:0;font-size:13px;line-height:2.05;color:var(--body)">' + T.people.carsSummary +
        '</p><a href="#people" style="font-size:12.5px;letter-spacing:.1em;color:var(--mark);border-bottom:1px solid var(--mark);padding-bottom:2px;width:max-content">查看車輛分組 →</a></div>' +
        sec(it.remindersTitle) + '<div class="ledger">' + each(it.reminders, function (r, i) {
          return '<div class="row row-rem"><span class="no-m" style="font-size:14px">0' + (i + 1) + '</span><span class="cell-t">' + r + "</span></div>";
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

  /* ---------- 分頁切換 ---------- */
  var PAGES = ["overview", "people", "journey", "route", "stay", "itinerary", "prep"];
  var routeMap = null;
  var tabs = document.querySelectorAll("#tabs a");
  function route() {
    var id = (location.hash || "#overview").slice(1);
    if (PAGES.indexOf(id) < 0) id = "overview";
    PAGES.forEach(function (p) { document.getElementById(p).hidden = p !== id; });
    tabs.forEach(function (a) {
      if (a.getAttribute("href") === "#" + id) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
    window.scrollTo(0, 0);
    /* 地圖在分頁顯示後才畫，避免隱藏時量不到尺寸 */
    if (id === "route") {
      if (!routeMap && window.drawRouteMap) routeMap = window.drawRouteMap(document.getElementById("map"), T, { air: "#9c3b26", ground: "#1d2e28", pin: "pin" });
      else if (routeMap) routeMap.invalidateSize();
    }
  }
  window.addEventListener("hashchange", route);
  document.addEventListener("click", function (e) {
    var a = e.target.closest("[data-day]");
    if (!a) return;
    e.preventDefault();
    var el = document.getElementById("v2-day-" + a.getAttribute("data-day").replace("/", "-"));
    if (el) el.scrollIntoView();
  });

  /* ---------- 倒數 ---------- */
  var s = T.start.split("-");
  var diff = Math.floor((new Date(+s[0], s[1] - 1, +s[2]) - new Date()) / 864e5);
  var n = document.getElementById("cd-n"), u = document.getElementById("cd-u");
  if (diff > 0) { n.textContent = String(diff); u.textContent = "天後出發"; }
  else if (diff > -11) { n.textContent = String(1 - diff); u.textContent = "旅程第幾天"; }
  else { n.textContent = "—"; u.textContent = "旅程已結束"; }

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
  route();
})(window.TRIP);
