/*
 * 互動層：分頁切換、頁首壓縮、區塊漸入。
 *
 * 狀態只有兩個，都放在 Alpine 的 x-data 裡：
 *   page  目前分頁的 id
 *   cond  頁首是否壓縮
 * 畫面怎麼跟著變，寫在 index.html 的屬性上；這裡只負責改狀態。
 *
 * 動畫全部交給 CSS。手機左右滑切頁用 scroll-snap，交給瀏覽器。
 * 內容渲染仍在 assets/render.js，這個檔案不碰內容。
 *
 * 深淺色是第三個狀態 theme（auto / light / dark），記在 localStorage。
 * 它在 Alpine 起來之前就先套到 <html>，不然選了深色的人每次開頁都會先閃一下淺色。
 */
var THEME_KEY = "nagoya2027.theme";
function readTheme() {
  try { var t = localStorage.getItem(THEME_KEY); return t === "light" || t === "dark" ? t : "auto"; } catch (e) { return "auto"; }
}
function applyTheme(t) {
  var root = document.documentElement;
  if (t === "auto") root.removeAttribute("data-theme"); else root.setAttribute("data-theme", t);
  var dark = t === "dark" || (t === "auto" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  var meta = document.getElementById("theme-color");
  if (meta) meta.setAttribute("content", dark ? "#1a1d1b" : "#1d2e28");
}
applyTheme(readTheme());

document.addEventListener("alpine:init", function () {
  var PAGES = ["overview", "people", "timeline", "journey", "stay", "itinerary", "food", "prep", "coupon", "emergency"];
  var NAMES = { overview: "總覽", people: "旅伴", timeline: "時間軸", journey: "交通", stay: "住宿資訊", itinerary: "行程", food: "美食", prep: "行前", coupon: "優惠券", emergency: "緊急" };
  var ALIAS = { route: "journey" };            /* v2.31 動線併進交通，舊書籤的 #route 轉過去 */
  var COND_ON = 120, COND_OFF = 96;           /* 壓縮門檻，兩段避免臨界點抖動 */
  var PHONE = "(max-width:700px)";

  function fromHash() {
    var id = (location.hash || "#overview").slice(1);
    id = ALIAS[id] || id;
    return PAGES.indexOf(id) >= 0 ? id : "overview";
  }

  Alpine.data("app", function () {
    return {
      page: fromHash(),
      cond: false,
      theme: readTheme(),
      pages: PAGES,

      /* 自動 → 淺色 → 深色 → 自動 */
      cycleTheme: function () {
        var order = ["auto", "light", "dark"];
        this.theme = order[(order.indexOf(this.theme) + 1) % order.length];
        applyTheme(this.theme);
        try { if (this.theme === "auto") localStorage.removeItem(THEME_KEY); else localStorage.setItem(THEME_KEY, this.theme); } catch (e) {}
      },
      themeLabel: function () { return { auto: "深淺色：跟系統", light: "深淺色：淺色", dark: "深淺色：深色" }[this.theme]; },

      no: function (id) { var i = PAGES.indexOf(id); return i > 0 ? (i < 10 ? "0" + i : "" + i) : "—"; },
      name: function (id) { return NAMES[id] || id; },

      init: function () {
        var self = this;
        var track = this.$refs.pages;
        var phone = window.matchMedia(PHONE);

        /* 頁首壓縮：只看 window 的縱向捲動 */
        window.addEventListener("scroll", function () {
          var y = window.scrollY || 0;
          if (!self.cond && y > COND_ON) self.cond = true;
          else if (self.cond && y < COND_OFF) { self.cond = false; if (self._dirty) self.$nextTick(function () { self.measure(); }); }
        }, { passive: true });

        /* 佔位高度：字型載入完、視窗改變都要重量；壓縮中量不到完整高度，先記著等展開再量 */
        this.measure();
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { self.measure(); });

        /* 手機：軌道一滑過某頁的中線就立刻換狀態，分頁列與網址不落後；
           漸入等捲停再跑（scrollend 有就用，沒有就等 80ms 沒動）。 */
        var settle = null;
        function nearest() {
          var w = track.clientWidth || 1;
          var i = Math.round(track.scrollLeft / w);
          return PAGES[Math.max(0, Math.min(PAGES.length - 1, i))];
        }
        track.addEventListener("scroll", function () {
          if (!phone.matches) return;
          /* 程式自己在把軌道捲到目標頁時，中途經過的頁不算使用者滑到 */
          if (!self._aligning) {
            var id = nearest();
            if (id !== self.page) self.land(id);
          }
          clearTimeout(settle);
          settle = setTimeout(function () { self._aligning = false; self.reveal(); self.fit(); }, 80);
        }, { passive: true });
        if ("onscrollend" in window) {
          track.addEventListener("scrollend", function () { clearTimeout(settle); self._aligning = false; self.reveal(); }, { passive: true });
        }

        /* 瀏覽器上一頁／下一頁 */
        window.addEventListener("popstate", function () { self.show(fromHash(), true); });
        window.addEventListener("hashchange", function () { self.show(fromHash(), true); });

        /* 跨分頁跳到某個區塊，以及行程總表點日期展開 */
        document.addEventListener("click", function (e) {
          var j = e.target.closest("[data-jump]");
          if (j) {
            e.preventDefault();
            self.go(j.getAttribute("href").slice(1));
            /* 等 Alpine 把目標分頁顯示出來再捲，否則目標還在 display:none 裡 */
            self.$nextTick(function () {
              var t = document.getElementById(j.getAttribute("data-jump"));
              if (t) t.scrollIntoView();
            });
            return;
          }
          var d = e.target.closest("[data-day]");
          if (d) {
            e.preventDefault();
            var el = document.getElementById("v2-day-" + d.getAttribute("data-day").replace("/", "-"));
            if (el) el.scrollIntoView();
          }
        });

        /* 手機：手指按在會橫向捲的內容（時間軸表格）上時，看表格捲到哪。
           還沒到邊：鎖住分頁軌道，這一下只能捲表格，不會中途誤切頁。
           已在最左或最右：不鎖，再往外滑一次就切頁，看完表格自然接到隔壁頁。 */
        var HSCROLL = ".tl-scroll";
        var unlockTimer = null;
        function lockTrack(on) {
          document.body.classList.toggle("track-lock", on);
          clearTimeout(unlockTimer);
          if (on) unlockTimer = setTimeout(function () { lockTrack(false); }, 2000);  /* 沒收到 touchend 的保險 */
        }
        track.addEventListener("touchstart", function (e) {
          self.fit();   /* 手指一碰就重量目前那頁，隔壁頁的限高在露出來之前一定是對的 */
          var box = e.target.closest ? e.target.closest(HSCROLL) : null;
          if (!box || box.scrollWidth <= box.clientWidth + 2) { lockTrack(false); return; }
          var atStart = box.scrollLeft <= 2;
          var atEnd = box.scrollLeft >= box.scrollWidth - box.clientWidth - 2;
          lockTrack(!(atStart || atEnd));
        }, { passive: true });
        document.addEventListener("touchend", function () { lockTrack(false); }, { passive: true });
        document.addEventListener("touchcancel", function () { lockTrack(false); }, { passive: true });

        /* 自動模式下系統換了深淺色，狀態列顏色也跟著換 */
        var mq = window.matchMedia("(prefers-color-scheme: dark)");
        var onScheme = function () { applyTheme(self.theme); };
        if (mq.addEventListener) mq.addEventListener("change", onScheme); else if (mq.addListener) mq.addListener(onScheme);

        /* 手機轉直橫或桌機縮放時，把軌道對回目前那頁，並重量頁首佔位 */
        window.addEventListener("resize", function () { self.align(false); self.measure(); self.fit(); });

        /* 目前那頁的高度寫進 --page-h，隔壁頁的限高跟著它。內容高度會變（圖片載入、打包清單展開），用 ResizeObserver 盯著 */
        if ("ResizeObserver" in window) {
          this._ro = new ResizeObserver(function () { self.fit(); });
        }
        this.$watch("page", function () { self.$nextTick(function () { self.fit(); }); });
        /* x-init 跑的時候 :class 還沒套上，section 量到 0；等 Alpine 套完、字型與圖片載好再量 */
        this.$nextTick(function () { self.fit(); });
        window.addEventListener("load", function () { self.fit(); });
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { self.fit(); });

        this.reveal();
        this.align(false);
        this.syncTabs();
      },

      /* 量完整形態的頁首高度，寫進 --head-h 當版面佔位。壓縮中量不到，標記等展開再量。 */
      measure: function () {
        var bar = document.querySelector(".head-bar");
        if (!bar) return;
        if (this.cond) { this._dirty = true; return; }
        this._dirty = false;
        document.documentElement.style.setProperty("--head-h", bar.offsetHeight + "px");
      },

      /* 量目前那頁的高度，寫進 --page-h；換頁時改盯新的那頁 */
      fit: function () {
        var sec = document.getElementById(this.page);
        if (!sec) return;
        if (this._ro && this._fitted !== sec) {
          if (this._fitted) this._ro.unobserve(this._fitted);
          this._ro.observe(sec);
          this._fitted = sec;
        }
        document.documentElement.style.setProperty("--page-h", sec.offsetHeight + "px");
      },

      /* 點分頁列、目次、連結：換網址、換頁、回到頂端 */
      go: function (id) {
        if (PAGES.indexOf(id) < 0) return;
        if (("#" + id) !== location.hash) {
          try { history.pushState(null, "", "#" + id); } catch (e) { location.hash = "#" + id; }
        }
        this.show(id, false);
      },

      /* 手機滑到隔壁頁：只換網址與狀態，不再捲動軌道 */
      land: function (id) {
        this.page = id;
        try { history.replaceState(null, "", "#" + id); } catch (e) {}
        this.syncTabs();
      },

      show: function (id, keep) {
        var changed = id !== this.page;
        this.page = id;
        if (!keep) window.scrollTo({ top: 0, left: 0, behavior: "instant" });
        this.align(changed);
        this.syncTabs();
        this.reveal();
      },

      /* 分頁列會橫向捲，目前那頁要看得見。看得見就不動；
         超出右邊就讓它靠右，超出左邊就讓它靠左，捲最少的量。
         不用 scrollIntoView，它可能順手把整個視窗也捲動。 */
      syncTabs: function () {
        var self = this;
        this.$nextTick(function () {
          var tabs = document.getElementById("tabs");
          var a = tabs && tabs.querySelector('a[href="#' + self.page + '"]');
          if (!a || tabs.scrollWidth <= tabs.clientWidth + 2) return;
          var pad = 12;
          var left = a.offsetLeft, right = left + a.offsetWidth;
          var vis0 = tabs.scrollLeft, vis1 = vis0 + tabs.clientWidth;
          var x;
          if (right + pad > vis1) x = right + pad - tabs.clientWidth;
          else if (left - pad < vis0) x = left - pad;
          else return;
          x = Math.max(0, Math.min(tabs.scrollWidth - tabs.clientWidth, x));
          try { tabs.scrollTo({ left: x, behavior: "smooth" }); } catch (e) { tabs.scrollLeft = x; }
        });
      },

      /* 手機把軌道捲到目前這頁；桌機軌道不捲，什麼都不做。
         只有隔壁頁才平滑，跨多頁直接跳：平滑捲動被打斷會停在中途，而且滑過八頁也太久。 */
      align: function (animate) {
        var track = this.$refs.pages;
        if (!track || !window.matchMedia(PHONE).matches) return;
        var w = track.clientWidth || 1;
        var x = PAGES.indexOf(this.page) * w;
        var dist = Math.abs(track.scrollLeft - x);
        if (dist < 2) return;
        var smooth = animate && dist <= w * 1.5;
        var self = this;
        this._aligning = true;
        clearTimeout(this._alignGuard);
        /* 沒有 scroll 事件（已在原位、或瀏覽器不發）也要解除，最多等 600ms */
        this._alignGuard = setTimeout(function () { self._aligning = false; }, 600);
        try { track.scrollTo({ left: x, behavior: smooth ? "smooth" : "instant" }); }
        catch (e) { track.scrollLeft = x; }
      },

      /* 區塊漸入。原則：任何時候都不先把畫面裡的東西藏起來。
         觀察器第一次回報時，在畫面裡的直接標 .in；只有在畫面外的才加 .reveal 先藏，
         等它進來再加 .in 播漸入；整個捲出畫面就拿掉 .in、重新藏起，回來重播。
         觀察器沒觸發、瀏覽器不支援、使用者關動態：內容都照常顯示。 */
      reveal: function () {
        var sec = document.getElementById(this.page);
        if (!sec || !("IntersectionObserver" in window)) return;
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        if (!this._io) {
          this._io = new IntersectionObserver(function (entries) {
            entries.forEach(function (en) {
              var el = en.target, r = en.boundingClientRect;
              if (en.isIntersecting) { el.classList.add("in"); return; }
              if (r.bottom < -80 || r.top > window.innerHeight + 80) { el.classList.remove("in"); el.classList.add("reveal"); }
            });
          }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
        }
        var io = this._io;
        var pick = ".stats .stat,.groups .group,.ledger .row,.prose .blk,.note,.flight,.ground,.hub,.day,.wx-c,.pack,.map-fig,.toc a,.route,.hero-image,.route-image";
        Array.prototype.forEach.call(sec.querySelectorAll(pick), function (el, i) {
          if (el.dataset.reveal) return;
          el.dataset.reveal = "1";
          el.style.transitionDelay = Math.min(i, 8) * 45 + "ms";
          io.observe(el);
        });
      }
    };
  });
});
