/* 名古屋・北陸 2027 — 動效層 v2.7
 *
 * 完全獨立：不改 render.js 與 trip-data.js，只在它們渲染完之後掛上。
 * 一、主標逐字浮現、日文行字距收攏（等字型載入才跑，減少跳動）
 * 二、倒數天數從 0 跑到定值
 * 三、分頁切換：裁切上推＋散景收斂；往回切時反向
 * 四、導覽列滑動底線＋上緣金色捲動進度線
 * 五、區塊捲進畫面才漸次浮現；深綠動線區塊由左往右揭開
 * 六、時間軸表格色塊由左端延展畫出；右緣漸層＋首次輕推提示可橫捲
 * 七、目次點擊時那一列先亮起再切分頁
 * 八、打包清單完成進度條
 *
 * 原則：動效只是裝飾。任何元素都不預先隱藏；動畫播不動或使用者開啟
 * 「減少動態效果」時，頁面與沒有這個檔案時完全相同。
 */
(function () {
  "use strict";

  var EASE = "cubic-bezier(.2,.7,.25,1)";
  var SOFT = "cubic-bezier(.16,1,.3,1)";
  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var can = !reduced && typeof Element.prototype.animate === "function";

  var PAGES = ["overview", "people", "timeline", "journey", "route", "stay", "itinerary", "prep", "coupon"];

  /* 會漸入的區塊 */
  var REVEAL = [
    ".hero > *", ".route", ".stats .stat", ".toc a",
    ".groups .group", ".ledger .row", ".prose .blk", ".note",
    ".flight", ".ground", ".hub", ".linkline",
    ".day", ".row-sum", ".wx-c", ".pack", ".legend div",
    ".tl-scroll", "#map"
  ].join(",");

  /* 動畫播完就收尾，播不動就取消，絕不把內容留在隱形狀態 */
  /* keep：照樣強制結束動畫，但不要把停在透明的元素補回不透明。
     淡出用的動畫本來就該停在透明，補回去會讓新舊兩層疊著看。 */
  function settle(anim, el, after, keep) {
    setTimeout(function () {
      try { if (anim.playState !== "finished") anim.finish(); } catch (e) { try { anim.cancel(); } catch (e2) {} }
      if (keep) return;
      if (el && getComputedStyle(el).opacity === "0") { try { anim.cancel(); } catch (e) {} el.style.opacity = "1"; }
    }, after);
  }

  function run(el, frames, opts, keep) {
    if (!can) return null;
    try {
      var a = el.animate(frames, opts);
      settle(a, el, (opts.delay || 0) + opts.duration + 400, keep);
      return a;
    } catch (e) { return null; }
  }

  /* ── 漸入 ───────────────────────────────────────── */
  var pending = [];
  var tick = 0;

  function rescue() {
    if (++tick % 4) return;
    document.querySelectorAll("[data-seen]").forEach(function (n) {
      if (getComputedStyle(n).opacity !== "0") return;
      if (pending.indexOf(n) !== -1) return;
      n.getAnimations().forEach(function (a) { if (a.playState !== "finished") { try { a.cancel(); } catch (e) {} } });
      n.style.opacity = "1";
    });
  }

  function play(el, delay) {
    var lane = el.classList.contains("tl-lane");
    var dark = el.classList.contains("route");
    var frames = lane
      ? [{ opacity: .25, transform: "scaleX(0)", transformOrigin: "left center" },
         { opacity: 1, transform: "scaleX(1)", transformOrigin: "left center" }]
      : dark
        ? [{ clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0 0 0)" }]
        : [{ opacity: 0, transform: "translateY(34px)" }, { opacity: 1, transform: "none" }];
    run(el, frames, {
      duration: lane ? 900 : dark ? 1000 : 760,
      delay: delay || 0,
      easing: lane ? SOFT : SOFT
    });
  }

  /* 所有會漸入的元素，離開畫面後可以重來一次 */
  var watched = [];

  function live(el) {
    var s = el.closest ? el.closest("section") : null;
    return el.isConnected && (!s || !s.hidden);
  }

  /* 整個捲出視窗外（上下各多留 80px）才算離開 */
  function gone(el, h) {
    var r = el.getBoundingClientRect();
    return r.bottom < -80 || r.top > h + 80;
  }

  function recycle(h) {
    watched.forEach(function (el) {
      if (!el.dataset.seen || !live(el)) return;
      if (pending.indexOf(el) !== -1) return;
      if (!gone(el, h)) return;
      var busy = el.getAnimations().some(function (a) { return a.playState === "running"; });
      if (busy) return;
      delete el.dataset.seen;
      el.style.opacity = "";
      el.style.transform = "";
      el.style.clipPath = "";
      pending.push(el);
    });
  }

  function sweep() {
    rescue();
    var h = window.innerHeight || 800;
    recycle(h);
    if (!pending.length) return;
    var i = 0;
    pending = pending.filter(function (el) {
      if (!live(el)) return el.isConnected;
      var r = el.getBoundingClientRect();
      if (r.top > h - 40 || r.bottom < 0) return true;
      el.dataset.seen = "1";
      play(el, i++ * 70);
      return false;
    });
  }

  function collect(scope) {
    if (!can) return;
    var h = window.innerHeight || 800;
    var i = 0;
    Array.prototype.forEach.call(scope.querySelectorAll(REVEAL), function (el) {
      if (watched.indexOf(el) === -1) watched.push(el);
      if (el.dataset.seen) return;
      if (el.getBoundingClientRect().top < h - 40) { el.dataset.seen = "1"; play(el, i++ * 70); }
      else if (pending.indexOf(el) === -1) pending.push(el);
    });
    sweep();
  }

  window.addEventListener("scroll", sweep, { passive: true });
  window.addEventListener("resize", sweep);
  setInterval(sweep, 150);

  /* ── 分頁轉場 ───────────────────────────────────── */
  var dir = 1;

  function enter(section) {
    collect(section);
    if (section.id === "timeline") { markLanes(); setTimeout(hintScroll, 500); }
    if (!can) return;
    var back = dir === -1;
    run(section, [
      { opacity: 0, clipPath: back ? "inset(0 0 26px 0)" : "inset(26px 0 0 0)",
        transform: "translateY(" + (back ? -28 : 28) + "px)", filter: "blur(6px)" },
      { opacity: 1, clipPath: "inset(0 0 0 0)", transform: "none", filter: "blur(0px)" }
    ], { duration: 640, easing: SOFT });
  }

  /* ── 導覽列底線 ─────────────────────────────────── */
  var bar, barPump;

  function makeBar() {
    var tabs = document.getElementById("tabs");
    if (!tabs || bar) return;
    bar = document.createElement("span");
    bar.className = "tab-bar";
    bar.setAttribute("aria-hidden", "true");
    tabs.appendChild(bar);
  }

  function moveBar(animate) {
    if (!bar) return;
    var tabs = bar.parentElement;
    var link = tabs.querySelector('a[aria-current="page"]');
    if (!link) return;
    var nav = tabs.getBoundingClientRect();
    var r = link.getBoundingClientRect();
    if (!r.width) return;
    var fromW = parseFloat(bar.style.width) || 0;
    var fromX = parseFloat((bar.style.transform.match(/-?[\d.]+/) || [0])[0]) || 0;
    var toW = r.width;
    var toX = r.left - nav.left + tabs.scrollLeft;
    bar.style.width = toW + "px";
    bar.style.transform = "translateX(" + toX + "px)";
    if (!animate || !can || !fromW) return;
    run(bar, [
      { width: fromW + "px", transform: "translateX(" + fromX + "px)" },
      { width: toW + "px", transform: "translateX(" + toX + "px)" }
    ], { duration: 420, easing: EASE });
  }

  /* ── 捲動進度線 ─────────────────────────────────── */
  function makeProgress() {
    var tabs = document.getElementById("tabs");
    if (!tabs || reduced) return;
    var p = document.createElement("span");
    p.className = "scroll-prog";
    p.setAttribute("aria-hidden", "true");
    tabs.appendChild(p);
    var upd = function () {
      var max = document.body.scrollHeight - window.innerHeight;
      p.style.width = (max > 0 ? Math.min(100, (window.scrollY / max) * 100) : 0) + "%";
    };
    window.addEventListener("scroll", upd, { passive: true });
    window.addEventListener("resize", upd);
    upd();
  }

  /* ── 主標逐字浮現 ───────────────────────────────── */
  function heroIn() {
    if (!can) return;
    var jp = document.querySelector(".hero .jp");
    if (jp) run(jp, [{ opacity: 0, letterSpacing: "1.1em" }, { opacity: 1, letterSpacing: ".42em" }],
      { duration: 1200, easing: SOFT });

    var h1 = document.querySelector(".hero h1");
    if (!h1 || h1.dataset.split) return;
    h1.dataset.split = "1";
    var frag = document.createDocumentFragment();
    Array.prototype.slice.call(h1.childNodes).forEach(function (node) {
      if (node.nodeName === "BR") { frag.appendChild(node.cloneNode()); return; }
      (node.textContent || "").split("").forEach(function (ch) {
        var s = document.createElement("span");
        s.textContent = ch;
        s.style.display = "inline-block";
        frag.appendChild(s);
      });
    });
    h1.textContent = "";
    h1.appendChild(frag);
    Array.prototype.forEach.call(h1.querySelectorAll("span"), function (s, i) {
      run(s, [{ opacity: 0, transform: "translateY(34px)" }, { opacity: 1, transform: "none" }],
        { duration: 780, delay: 120 + i * 70, easing: SOFT });
    });
  }

  /* ── 倒數跑動 ───────────────────────────────────── */
  function countUp() {
    var n = document.getElementById("cd-n");
    if (!n || !can) return;
    var v = parseInt((n.textContent || "").replace(/\D/g, ""), 10);
    if (!v || n.dataset.counted) return;
    n.dataset.counted = "1";
    var t0 = Date.now();
    (function step() {
      var p = Math.min(1, (Date.now() - t0) / 1100);
      n.textContent = Math.round(v * (1 - Math.pow(1 - p, 3)));
      if (p < 1) setTimeout(step, 32); else n.textContent = v;
    })();
  }

  /* ── 時間軸 ─────────────────────────────────────── */
  function markLanes() {
    Array.prototype.forEach.call(
      document.querySelectorAll(".tl tbody td:not(.tl-empty)"),
      function (td) { td.classList.add("tl-lane"); if (!td.dataset.seen) { td.dataset.seen = "1"; pending.push(td); } }
    );
    sweep();
  }

  function hintScroll() {
    var box = document.querySelector(".tl-scroll");
    if (!box || box.dataset.hinted) return;
    if (box.scrollWidth <= box.clientWidth + 8) return;
    box.dataset.hinted = "1";
    box.parentElement.classList.add("tl-hinted");
    if (reduced) return;
    var t = 0;
    var nudge = setInterval(function () {
      t += 1;
      box.scrollLeft = t <= 8 ? t * 5 : Math.max(0, (16 - t) * 5);
      if (t >= 16) { clearInterval(nudge); box.scrollLeft = 0; }
    }, 28);
  }

  /* ── 目次點擊高亮 ───────────────────────────────── */
  function wireToc() {
    document.addEventListener("click", function (e) {
      var a = e.target.closest(".toc a");
      if (!a || reduced) return;
      e.preventDefault();
      var href = a.getAttribute("href");
      run(a, [{ background: "#e4e0d2" }, { background: "rgba(0,0,0,0)" }], { duration: 320, easing: EASE });
      setTimeout(function () { location.hash = href; }, 220);
    });
  }

  /* ── 打包清單進度條 ─────────────────────────────── */
  function wirePacking() {
    var count = document.getElementById("pk-count");
    var sec = count && count.closest ? count.closest(".sec") : null;
    var track = sec && sec.querySelector(".bar");
    if (!track) return;
    track.classList.add("pk-track");
    var fill = document.createElement("span");
    fill.className = "pk-fill";
    track.appendChild(fill);

    var upd = function () {
      var all = document.querySelectorAll("#packs .item");
      var on = document.querySelectorAll('#packs .item[aria-pressed="true"]');
      var from = parseFloat(fill.style.width) || 0;
      var to = all.length ? (on.length / all.length) * 100 : 0;
      fill.style.width = to + "%";
      if (!can || from === to) return;
      run(fill, [{ width: from + "%" }, { width: to + "%" }], { duration: 520, easing: EASE });
    };
    /* render.js 會在點擊後重畫 #packs，冒泡階段時 e.target 已被換掉，
       所以改在捕獲階段判斷，再排到重畫之後更新。 */
    document.addEventListener("click", function (e) {
      if (e.target.closest("#packs .item") || e.target.closest("#pk-reset")) setTimeout(upd, 0);
    }, true);
    upd();
  }

  /* ── 啟動 ───────────────────────────────────────── */
  function stickyHead() {
    var mast = document.querySelector(".mast");
    var tabs = document.getElementById("tabs");
    if (!mast || !tabs) return;

    var stick = document.createElement("div");
    stick.className = "stick";
    mast.parentNode.insertBefore(stick, mast);
    stick.appendChild(mast);
    stick.appendChild(tabs);

    /* 收摺後的左側：目前分頁編號＋名稱 */
    var brand = mast.querySelector(".brand");
    var labFull = brand && brand.querySelector(".lab");
    var labMini = document.createElement("span");
    labMini.className = "lab-mini";
    labMini.innerHTML = '<span class="no">—</span><span class="ti">總覽</span>';
    if (labFull) {
      var stack = document.createElement("span");
      stack.className = "lab-stack";
      labFull.parentNode.insertBefore(stack, labFull);
      stack.appendChild(labFull);
      stack.appendChild(labMini);
    }

    /* 收摺後的右側：倒數＋回頂端 */
    var metaFull = mast.querySelector(".mast-meta");
    var metaMini = document.createElement("div");
    metaMini.className = "meta-mini";
    metaMini.innerHTML = '<span class="cd"><span class="k">倒數</span><span class="n">—</span><span class="u">天</span></span>' +
      '<button type="button" class="to-top">↑ 頂端</button>';
    if (metaFull) {
      var mstack = document.createElement("div");
      mstack.className = "meta-stack";
      metaFull.parentNode.insertBefore(mstack, metaFull);
      mstack.appendChild(metaFull);
      mstack.appendChild(metaMini);
    }
    metaMini.querySelector(".to-top").addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
    });

    function syncMini() {
      var link = tabs.querySelector('a[aria-current="page"]');
      if (!link) return;
      var n = link.querySelector(".n");
      var no = n ? n.textContent : "—";
      var ti = link.textContent.replace(no, "").trim();
      var tiEl = labMini.querySelector(".ti");
      var cd = document.getElementById("cd-n");
      if (cd) metaMini.querySelector(".n").textContent = cd.textContent;
      if (tiEl.textContent === ti) return;
      labMini.querySelector(".no").textContent = no;
      tiEl.textContent = ti;
      run(tiEl, [{ opacity: 0, transform: "translateY(6px)" }, { opacity: 1, transform: "none" }],
        { duration: 300, easing: SOFT });
    }

    function crossfade(out, into) {
      if (!out || !into) return;
      /* 兩邊最終的顯示與否交給 CSS（.on 與 .is-cond）決定，
         清掉可能被 settle 寫進來的 inline opacity，否則兩層會疊著看。 */
      out.style.opacity = "";
      into.style.opacity = "";
      out.classList.remove("on");
      into.classList.add("on");
      run(out, [{ opacity: 1, transform: "none" }, { opacity: 0, transform: "translateY(-8px)" }], { duration: 240, easing: EASE }, true);
      run(into, [{ opacity: 0, transform: "translateY(8px)" }, { opacity: 1, transform: "none" }], { duration: 320, delay: 90, easing: SOFT }, true);
    }

    var cond = false;

    /* 頁首一律固定在上方，只在完整與壓縮兩種形態之間切換。
       120 與 96 之間留一段緩衝，避免在臨界點來回抖動。 */
    function apply(next) {
      if (next === cond) return;
      cond = next;
      stick.classList.toggle("is-cond", next);
      syncMini();
      crossfade(next ? labFull : labMini, next ? labMini : labFull);
      crossfade(next ? metaFull : metaMini, next ? metaMini : metaFull);
      setTimeout(function () { moveBar(true); }, 300);
    }

    function onScroll() {
      var y = window.scrollY;
      if (!cond && y > 120) apply(true);
      else if (cond && y < 96) apply(false);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("click", function (e) { if (e.target.closest(".tabs a")) setTimeout(syncMini, 60); });
    window.addEventListener("hashchange", function () { setTimeout(syncMini, 60); });
    onScroll();
    syncMini();
  }

  /* ── 啟動 ───────────────────────────────────────── */
  function start() {
    stickyHead();
    makeBar();
    makeProgress();
    wireToc();
    wirePacking();

    barPump = setInterval(function () {
      moveBar(true);
      if (bar && parseFloat(bar.style.width) > 0) { clearInterval(barPump); barPump = null; }
    }, 150);

    var runHero = false;
    var hero = function () {
      if (runHero) return;
      runHero = true;
      heroIn();
      countUp();
      moveBar(false);
    };
    if (document.fonts && document.fonts.ready) { document.fonts.ready.then(hero); setTimeout(hero, 900); }
    else hero();

    window.addEventListener("resize", function () { moveBar(false); });

    var current = document.querySelector("section:not([hidden])");
    if (current) { collect(current); if (current.id === "timeline") { markLanes(); setTimeout(hintScroll, 500); } }

    var mo = new MutationObserver(function (records) {
      var shown = null;
      records.forEach(function (rec) {
        if (rec.attributeName === "hidden" && !rec.target.hidden) shown = rec.target;
      });
      if (!shown) return;
      var from = PAGES.indexOf((current && current.id) || "overview");
      var to = PAGES.indexOf(shown.id);
      dir = to < from ? -1 : 1;
      current = shown;
      moveBar(true);
      enter(shown);
    });
    Array.prototype.forEach.call(document.querySelectorAll("section[id]"), function (s) {
      mo.observe(s, { attributes: true, attributeFilter: ["hidden"] });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { setTimeout(start, 0); });
  } else {
    setTimeout(start, 0);
  }
})();
