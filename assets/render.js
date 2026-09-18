/*
 * 旅帖樣板：讀 assets/trip-data.js 產生各分頁內容。
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
    "hero-line": function () { return T.overview.heroLine; },
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
        return '<div class="flight"><div class="flight-h"><span class="kanji">' + g.tag + '</span><span class="nm">' + g.name + '</span><span class="ct">' + g.people + '</span></div><div class="legs">' +
          each(t.flights[g.id], function (f) {
            return '<div class="leg"><span class="k">' + f.dir + " · " + f.date + '</span><div class="leg-t">' + end(f.from) + '<span class="dash"></span>' + end(f.to, true) +
              '</div><span class="mt">' + (f.v2label || f.label) + (f.note ? " · " + f.note : "") + "</span></div>";
          }) + "</div></div>";
      }) + '</div><p class="fine">' + t.flightTimeNote + "</p>" +
        sec("地面交通") + '<div class="ledger">' + each(t.ground, function (x) {
          return '<div class="ground"><div class="side"><span class="no">' + x.kind + '</span><span class="wh">' + x.when + '</span></div><div class="body"><span class="ti">' +
            x.title + "</span><p>" + x.text + '</p><span class="todo">待確認 · ' + x.todo + "</span></div></div>";
        }) + "</div>" +
        sec(t.mapsTitle) + '<div class="maps">' + each(t.maps, function (m) {
          return '<figure class="map-fig"><a href="' + attr(m.src) + '" target="_blank" rel="noopener noreferrer">' +
            '<img src="' + attr(m.src) + '" alt="' + attr(m.file) + '路線圖" loading="lazy" decoding="async"></a>' +
            '<figcaption><span class="mf-t">' + m.file + '</span><span class="mf-n">' + m.note + "</span></figcaption></figure>";
        }) + '</div><p class="fine">' + t.mapsNote + "</p>";
    },

    stay: function () {
      var s = T.stay, k = s.kanazawa, n = s.nagoya, v = s.vjw;
      var ext = ' target="_blank" rel="noopener noreferrer"';
      return '<div class="hub"><div class="l"><span class="t">' + s.notion.title + '</span><span class="n">' + s.notion.text + '</span></div><a class="cta" href="' +
        attr(s.notion.href) + '"' + ext + ">" + s.notion.cta + "</a></div>" +
        sec(k.place, dash(k.period)) + '<div class="prose">' + each(k.blocks, function (b) { return '<div class="blk"><h3>' + b.title + "</h3>" + b.html + "</div>"; }) + "</div>" +
        '<div class="ledger thin" style="margin-top:clamp(28px,3.4vw,40px)">' +
        '<div class="row row-stay row-head"><span class="cell-w">家庭／旅伴</span><span class="cell-w">人數</span><span class="cell-w">入住日期</span></div>' +
        each(T.people.families, function (f) {
          return '<div class="row row-stay"><span class="cell">' + f.adults + (f.kids ? "、" + f.kids : "") + '</span><span class="num">' + f.n + '</span><span class="cell-s' +
            (f.pending ? " warnc" : "") + '">' + f.kanazawa + "</span></div>";
        }) + "</div>" +
        sec(n.place, dash(n.period)) + '<div class="prose"><a class="linkline" href="' + attr(n.house.href) + '"' + ext + ">" + n.house.text + '</a><div class="blk">' +
        each(n.paragraphs, function (x) { return "<p>" + x + "</p>"; }) + "</div></div>" +
        '<div class="ledger thin" style="margin-top:clamp(28px,3.4vw,40px)">' +
        '<div class="row row-room row-head"><span class="cell-w">臥室</span><span class="cell-w">床位</span><span class="cell-w">入住分配</span></div>' +
        each(n.rooms, function (r, i) {
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
        '</p><a href="#people" data-jump="v2-cars" style="font-size:12.5px;letter-spacing:.1em;color:var(--mark);border-bottom:1px solid var(--mark);padding-bottom:2px;width:max-content">查看車輛分組 →</a></div>' +
        sec(it.remindersTitle) + '<div class="ledger">' + each(it.reminders, function (r, i) {
          return '<div class="row row-rem"><span class="no-m" style="font-size:14px">0' + (i + 1) + '</span><span class="cell-t">' + r + "</span></div>";
        }) + "</div>";
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

  /* ---------- 分頁切換 ---------- */
  var PAGES = ["overview", "people", "timeline", "journey", "route", "stay", "itinerary", "prep", "coupon"];
  var routeMap = null;
  var tabs = document.querySelectorAll("#tabs a");
  /* 切頁一律瞬間回到頂端：用平滑捲動的話，中途會經過頁首壓縮的門檻，
     頁首就會在完整與壓縮兩種形態之間來回切。順便蓋掉瀏覽器對 hash 的定位捲動。 */
  function toTop() {
    var jump = function () {
      try { window.scrollTo({ top: 0, left: 0, behavior: "instant" }); }
      catch (e) {
        var root = document.documentElement;
        var prev = root.style.scrollBehavior;
        root.style.scrollBehavior = "auto";
        void root.offsetHeight;
        window.scrollTo(0, 0);
        root.style.scrollBehavior = prev;
      }
    };
    jump();
    requestAnimationFrame(jump);
  }

  /* 用 hash 換頁時，瀏覽器會自己捲到同名的區塊，而且吃 scroll-behavior:smooth，
     一路捲過頁首壓縮的門檻，頁首就會來回切形態。改成自己換網址再重畫。 */
  function go(id, keepScroll) {
    if (("#" + id) !== location.hash) {
      try { history.pushState(null, "", "#" + id); } catch (e) { location.hash = "#" + id; }
    }
    route(keepScroll);
  }

  var flowTop = 0;   /* 捲到頂端時，分頁區塊在畫面上的位置（頁首完整形態的高度） */

  function route(keepScroll) {
    var id = (location.hash || "#overview").slice(1);
    if (PAGES.indexOf(id) < 0) id = "overview";
    PAGES.forEach(function (p) { document.getElementById(p).hidden = p !== id; });
    tabs.forEach(function (a) {
      if (a.getAttribute("href") === "#" + id) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
    if (!keepScroll) toTop();
    if (!keepScroll) {
      requestAnimationFrame(function () {
        var s = document.querySelector("section[id]:not([hidden])");
        if (s && !document.documentElement.dataset.swipe && (window.scrollY || 0) === 0) {
          flowTop = Math.round(s.getBoundingClientRect().top);
        }
      });
    }
    /* 地圖在分頁顯示後才畫，避免隱藏時量不到尺寸 */
    if (id === "route") {
      if (!routeMap && window.drawRouteMap) routeMap = window.drawRouteMap(document.getElementById("map"), T, { air: "#9c3b26", ground: "#1d2e28", pin: "pin" });
      else if (routeMap) routeMap.invalidateSize();
    }
  }
  /* ---------- 手機左右滑切換分頁 ---------- */
  (function () {
    if (!("ontouchstart" in window)) return;

    var hint = document.createElement("div");
    hint.className = "swipe-hint";
    document.body.appendChild(hint);
    var hintTimer = null;
    function showHint(text) {
      hint.textContent = text;
      hint.classList.add("on");
      clearTimeout(hintTimer);
      hintTimer = setTimeout(function () { hint.classList.remove("on"); }, 900);
    }

    function nameOf(id) {
      var a = document.querySelector('#tabs a[href="#' + id + '"]');
      return a ? a.textContent.replace(/^[—\d]+/, "").trim() : id;
    }

    /* 起點若在可橫向捲動的容器內，且該方向還捲得動，就讓容器自己處理 */
    function inScroller(node, dx) {
      for (var el = node; el && el !== document.body; el = el.parentElement) {
        if (!el.scrollWidth || el.scrollWidth <= el.clientWidth + 2) continue;
        var s = getComputedStyle(el).overflowX;
        if (s !== "auto" && s !== "scroll") continue;
        if (dx < 0 && el.scrollLeft < el.scrollWidth - el.clientWidth - 2) return true;
        if (dx > 0 && el.scrollLeft > 2) return true;
      }
      return false;
    }

    var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var ROOT = document.documentElement;
    var W = function () { return window.innerWidth || 375; };

    var x0 = 0, y0 = 0, t0 = 0, tracking = false, axis = null, busy = false;
    var cur = null, peek = null, peekId = "", dirSign = 0, dx = 0, prevY = 0;

    function current() { return document.querySelector("section[id]:not([hidden])"); }
    function neighbour(sign) {
      var i = PAGES.indexOf((location.hash || "#overview").slice(1));
      if (i < 0) i = 0;
      var n = i + sign;
      return n >= 0 && n < PAGES.length ? PAGES[n] : "";
    }
    /*
     * 頁首縮起來之後再左右滑，捲軸歸零會讓它展開，等於每滑一次就變一次形態。
     * 滑動期間鎖住形態，之後等使用者自己捲動才解鎖。
     */
    function holdHeader() {
      var st = document.querySelector(".stick");
      if (st && st.classList.contains("is-cond")) ROOT.dataset.headHold = "1";
    }
    /* 只有使用者自己捲動才解鎖；切頁時我們自己捲的不算 */
    window.addEventListener("scroll", function () {
      if (!ROOT.dataset.headHold) return;
      if (Date.now() - lastSelfScroll < 400) return;
      delete ROOT.dataset.headHold;
    }, { passive: true });

    /* 隔壁頁要停在「切過去之後該在的位置」，也就是捲到頂端時區塊的位置 */
    function landing() {
      if (flowTop) return flowTop;
      var st = document.querySelector(".stick");
      return st ? Math.max(0, Math.round(st.getBoundingClientRect().bottom)) : 0;
    }

    /* 站台設了 scroll-behavior:smooth，一般的 scrollTo 不會立刻生效，
       量位置會量到舊的；這裡明確要求立即捲動。 */
    var lastSelfScroll = 0;

    function scrollNow(y) {
      lastSelfScroll = Date.now();
      try { window.scrollTo({ top: y, left: 0, behavior: "instant" }); }
      catch (e) {
        var root = document.documentElement;
        var prev = root.style.scrollBehavior;
        root.style.scrollBehavior = "auto";
        void root.offsetHeight;
        window.scrollTo(0, y);
        root.style.scrollBehavior = prev;
      }
      /* 頁首靠捲動事件切換形態，這裡同步觸發，之後量到的位置才是最終的 */
      try { window.dispatchEvent(new Event("scroll")); } catch (e2) {}
    }

    /*
     * 拖曳一開始就把目前這頁釘在它現在的視覺位置，然後把捲軸拉回頂端。
     * 畫面上什麼都沒動，但切頁完成時頁面已經在頂端，不會再跳一下。
     * 隔壁那頁釘在「切過去之後該在的位置」，落點與拖曳中完全一致。
     */
    function beginDrag(sign) {
      peekId = neighbour(sign);
      peek = peekId ? document.getElementById(peekId) : null;
      if (peek === cur) peek = null;
      dirSign = sign;
      prevY = window.scrollY || 0;

      ROOT.dataset.swipe = "peek";           /* 讓動效層知道這是預覽，不要跑入場動畫 */
      ROOT.classList.add("swipe-freeze");    /* 頁首形態直接切換，不跑轉場 */
      holdHeader();                          /* 頁首已經縮起來的話，滑動時維持壓縮 */

      /* 先記下現在看到的位置，捲回頂端後量出落點，再把目前這頁釘回原本的視覺位置 */
      var seenTop = cur ? Math.round(cur.getBoundingClientRect().top) : 0;
      scrollNow(0);
      var land = cur ? Math.round(cur.getBoundingClientRect().top) : landing();
      if (cur) {
        cur.classList.add("swipe-pane");
        cur.style.top = seenTop + "px";
      }

      if (!peek) return false;
      peek.classList.add("swipe-pane");
      peek.style.top = land + "px";
      peek.hidden = false;
      peek.style.transform = "translateX(" + (sign > 0 ? W() : -W()) + "px)";
      return true;
    }

    function move(px) {
      dx = px;
      if (cur) cur.style.transform = px ? "translateX(" + px + "px)" : "";
      if (peek) peek.style.transform = "translateX(" + ((dirSign > 0 ? W() : -W()) + px) + "px)";
    }

    function closePeek(keepShown) {
      if (!peek) return;
      peek.classList.remove("swipe-pane");
      peek.style.transform = "";
      peek.style.top = "";
      peek.style.transition = "";
      if (!keepShown) peek.hidden = true;
      peek = null; peekId = ""; dirSign = 0;
    }
    function clearCur() {
      if (!cur) return;
      cur.classList.remove("swipe-pane");
      cur.style.transform = "";
      cur.style.transition = "";
      cur.style.top = "";
      cur = null;
    }
    function reset(restoreScroll) {
      delete ROOT.dataset.swipe;
      document.body.classList.remove("swipe-live");
      closePeek(false); clearCur();
      if (restoreScroll) {
        /* 沒切成就回到原本看的位置；頁首形態變回來會改變版面高度，再校正一次 */
        scrollNow(prevY);
        scrollNow(prevY);
      }
      ROOT.classList.remove("swipe-freeze");
      dx = 0; axis = null; busy = false;
    }

    /* 收尾：滑回原位，或滑到底後換頁 */
    function settle(commit) {
      var ms = reduced ? 0 : 230;
      var curEnd = commit ? (dirSign > 0 ? -W() : W()) : 0;
      var peekEnd = commit ? 0 : (dirSign > 0 ? W() : -W());
      busy = true;

      if (ms && cur) { cur.style.transition = "transform " + ms + "ms cubic-bezier(.2,.7,.25,1)"; }
      if (ms && peek) { peek.style.transition = "transform " + ms + "ms cubic-bezier(.2,.7,.25,1)"; }
      if (cur) cur.style.transform = curEnd ? "translateX(" + curEnd + "px)" : "";
      if (peek) peek.style.transform = peekEnd ? "translateX(" + peekEnd + "px)" : "translateX(0px)";

      var target = peekId;
      setTimeout(function () {
        if (commit && target) {
          /* 先收回 hidden，再換頁：route() 重新顯示，導覽列底線才會跟著跑 */
          closePeek(false);
          clearCur();
          ROOT.dataset.swipe = "none";       /* 已經滑進來了，動效層不用再播入場 */
          go(target);
          showHint((dirSign > 0 ? "→ " : "← ") + nameOf(target));
        }
        reset(!commit);
      }, ms + 20);
    }

    document.addEventListener("touchstart", function (e) {
      if (busy || e.touches.length !== 1 || window.innerWidth > 700) { tracking = false; return; }
      x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; t0 = Date.now();
      tracking = true; axis = null; dx = 0;
    }, { passive: true });

    document.addEventListener("touchmove", function (e) {
      if (!tracking || busy || e.touches.length !== 1) return;
      var mx = e.touches[0].clientX - x0, my = e.touches[0].clientY - y0;

      if (axis === null) {
        if (Math.abs(mx) < 10 && Math.abs(my) < 10) return;
        if (Math.abs(mx) <= Math.abs(my) * 1.4 || inScroller(e.target, mx)) { axis = "y"; return; }
        axis = "x";
        cur = current();
        document.body.classList.add("swipe-live");
        beginDrag(mx < 0 ? 1 : -1);
      }
      if (axis !== "x") return;

      e.preventDefault();                    /* 橫向拖曳期間不要同時上下捲 */
      if (peek) move(mx);
      else move(mx < 0 ? -Math.min(-mx * 0.35, 84) : Math.min(mx * 0.35, 84));  /* 到頭到尾的阻尼 */
    }, { passive: false });

    document.addEventListener("touchend", function (e) {
      if (!tracking) return;
      tracking = false;
      if (axis !== "x") { reset(true); return; }

      var t = e.changedTouches[0];
      var mx = t.clientX - x0, dt = Date.now() - t0;
      var fast = dt < 300 && Math.abs(mx) > 70;   /* 快速輕滑 */
      var far = Math.abs(mx) > W() * 0.28;

      if (!peek) {
        showHint(mx < 0 ? "已是最後一頁" : "已是第一頁");
        dirSign = mx < 0 ? 1 : -1;
        settle(false);
        return;
      }
      settle(fast || far);
    }, { passive: true });

    document.addEventListener("touchcancel", function () {
      tracking = false;
      if (axis === "x" && peek) settle(false); else reset(true);
    }, { passive: true });
  })();

  window.addEventListener("hashchange", route);
  window.addEventListener("popstate", route);
  document.addEventListener("click", function (e) {
    /* 跨分頁跳到某個區塊：先切分頁，再捲到該區塊 */
    var j = e.target.closest("[data-jump]");
    if (j) {
      e.preventDefault();
      go(j.getAttribute("href").slice(1), true);
      var target = document.getElementById(j.getAttribute("data-jump"));
      if (target) target.scrollIntoView();
      return;
    }
    /* 導覽列與目次：同樣自己換頁，不要讓瀏覽器捲 */
    var nav = e.target.closest('a[href^="#"]');
    if (nav && !nav.hasAttribute("data-day")) {
      var id = nav.getAttribute("href").slice(1);
      if (PAGES.indexOf(id) >= 0) {
        e.preventDefault();
        go(id);
        return;
      }
    }
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
