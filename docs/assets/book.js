/* The algorithm book: turns the list of spreads into a book whose pages turn.
   Used by the All Methods page and by the landing page. No dependency, no request. */
(function () {
  "use strict";
  var book = document.querySelector("[data-book]");
  if (!book) { return; }

  var spreads = Array.prototype.slice.call(book.querySelectorAll(".rl-spread"));
  var tabs = Array.prototype.slice.call(book.querySelectorAll(".rl-tab"));
  var stage = book.querySelector(".rl-book-stage");
  var status = book.querySelector(".rl-book-status");
  var prevButton = book.querySelector(".rl-book-controls .rl-prev");
  var nextButton = book.querySelector(".rl-book-controls .rl-next");
  var WIDE = 760;        // the book lies open when the column is at least this wide
  // With data-open-on-view the book lies closed, its cover up, until it scrolls into view.
  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var opened = !book.hasAttribute("data-open-on-view") || reduced;
  var last = spreads.length - 1;
  var current = 0;
  var shelf = null;      // the element that holds the leaves, in wide mode
  var leaves = [];       // leaves[i] carries the right page of spread i-1... see build()
  var settle = null;
  var refit = null;
  var watcher = window.ResizeObserver ? new window.ResizeObserver(function () {
    window.clearTimeout(refit);
    refit = window.setTimeout(fit, 60);
  }) : null;

  function indexOfId(id) {
    for (var i = 0; i < spreads.length; i++) { if (spreads[i].id === id) { return i; } }
    return -1;
  }

  /* Leaf k (k = 0 .. last + 1) shows, on its front, the right page of spread k - 1 and,
     on its back, the left page of spread k. Leaf 0 has no front: it is the inside of the
     cover and is always turned. At spread c, the leaves 0 .. c are turned. */
  function build() {
    shelf = document.createElement("div");
    shelf.className = "rl-leaves";
    for (var k = 0; k <= last + 1; k++) {
      var leaf = document.createElement("div");
      leaf.className = "rl-leaf";
      var front = document.createElement("div");
      front.className = "rl-face rl-front";
      var back = document.createElement("div");
      back.className = "rl-face rl-back";
      if (k >= 1) { front.appendChild(copy(spreads[k - 1], ".rl-right")); }
      else { front.classList.add("rl-cover"); front.appendChild(cover()); }
      if (k <= last) { back.appendChild(copy(spreads[k], ".rl-left")); }
      leaf.appendChild(front);
      leaf.appendChild(back);
      shelf.appendChild(leaf);
      leaves.push({ leaf: leaf, front: front, back: back });
    }
    ["rl-prev", "rl-next"].forEach(function (name) {
      var edge = document.createElement("button");
      edge.type = "button";
      edge.className = "rl-book-edge " + name;
      edge.setAttribute("aria-label", name === "rl-prev" ? "Previous page" : "Next page");
      edge.textContent = name === "rl-prev" ? "‹" : "›";
      edge.addEventListener("click", function () { go(current + (name === "rl-prev" ? -1 : 1)); });
      shelf.appendChild(edge);
    });
    stage.insertBefore(shelf, stage.firstChild);
  }

  /* The front cover, shown while the book lies closed. */
  function cover() {
    var art = document.createElement("div");
    art.className = "rl-cover-front";
    var groups = {};
    spreads.forEach(function (s) { if (s.getAttribute("data-group") !== "contents") { groups[s.getAttribute("data-group")] = true; } });
    var kicker = document.createElement("p"); kicker.className = "rl-cover-kicker"; kicker.textContent = "RobustRLlib";
    var title = document.createElement("p"); title.className = "rl-cover-title"; title.textContent = "Algorithms";
    var sub = document.createElement("p"); sub.className = "rl-cover-sub";
    var line = spreads[0].querySelector(".rl-book-title");   // "22 algorithms in four groups"
    sub.textContent = line ? line.textContent : (spreads.length - 1) + " methods  \u00b7  " + Object.keys(groups).length + " groups";
    var blocks = document.createElement("div"); blocks.className = "rl-cover-blocks";
    Object.keys(groups).forEach(function (g) { var b = document.createElement("i"); b.style.background = "var(--rl-g-" + g + ")"; blocks.appendChild(b); });
    art.appendChild(kicker); art.appendChild(title); art.appendChild(sub); art.appendChild(blocks);
    return art;
  }

  function copy(spread, selector) {
    var page = spread.querySelector(selector).cloneNode(true);
    page.setAttribute("data-group", spread.getAttribute("data-group"));
    // The content sits in a wrapper of its own, whose height is the height the page
    // needs. It is watched, because fonts and the theme's script change it late.
    var inner = document.createElement("div");
    inner.className = "rl-page-inner";
    while (page.firstChild) { inner.appendChild(page.firstChild); }
    page.appendChild(inner);
    if (watcher) { watcher.observe(inner); }
    // the group colour of a page follows the spread it was copied from
    var holder = document.createElement("div");
    holder.className = "rl-spread-copy";
    holder.style.height = "100%";
    holder.appendChild(page);
    var group = page.querySelector(".rl-book-group");
    if (group) { group.style.color = "var(--rl-g-" + spread.getAttribute("data-group") + ")"; }
    return holder;
  }

  function rest() {
    leaves.forEach(function (item, k) {
      var turned = k <= current && (k > 0 || opened);
      item.leaf.style.transitionDelay = "0ms";
      item.leaf.style.zIndex = String(turned ? k + 1 : leaves.length - k);
      setHidden(item.front, !(k === current + 1 || (k === 0 && !opened)));
      setHidden(item.back, !(k === current));
    });
  }

  function setHidden(face, hidden) {
    if (hidden) { face.setAttribute("aria-hidden", "true"); face.setAttribute("inert", ""); }
    else { face.removeAttribute("aria-hidden"); face.removeAttribute("inert"); }
  }

  function turn(from, to) {
    var forward = to > from;
    var moving = [];
    for (var k = 0; k < leaves.length; k++) {
      var shouldBeTurned = k <= to && (k > 0 || opened);
      var isTurned = leaves[k].leaf.classList.contains("is-flipped");
      if (shouldBeTurned !== isTurned) { moving.push(k); }
    }
    if (!forward) { moving.reverse(); }
    var step = moving.length > 1 ? Math.min(45, 420 / moving.length) : 0;
    moving.forEach(function (k, order) {
      var leaf = leaves[k].leaf;
      leaf.style.zIndex = String(1000 + (forward ? order : moving.length - order));
      leaf.style.transitionDelay = Math.round(order * step) + "ms";
      leaf.classList.toggle("is-flipped", k <= to);
      setHidden(leaves[k].front, false);
      setHidden(leaves[k].back, false);
    });
    window.clearTimeout(settle);
    settle = window.setTimeout(rest, 800 + moving.length * step);
  }

  function describe() {
    var spread = spreads[current];
    var name = spread.getAttribute("data-name");
    var label = spread.getAttribute("data-label");
    status.textContent = "";
    var strong = document.createElement("strong");
    strong.textContent = name;
    status.appendChild(strong);
    if (label) { status.appendChild(document.createTextNode("  ·  " + label)); }
    status.appendChild(document.createTextNode("  ·  " + (current + 1) + " / " + spreads.length));

    var group = spread.getAttribute("data-group");
    tabs.forEach(function (tab) {
      var active = tab.getAttribute("data-group") === group;
      tab.classList.toggle("is-active", active);
      if (active) { tab.setAttribute("aria-current", "true"); } else { tab.removeAttribute("aria-current"); }
    });
    [prevButton, book.querySelector(".rl-book-edge.rl-prev")].forEach(function (b) { if (b) { b.disabled = current === 0; } });
    [nextButton, book.querySelector(".rl-book-edge.rl-next")].forEach(function (b) { if (b) { b.disabled = current === last; } });
    spreads.forEach(function (s, i) { s.classList.toggle("is-current", i === current); });
  }

  function go(target, silent) {
    target = Math.max(0, Math.min(last, target));
    if (target === current) { return; }
    var from = current;
    current = target;
    opened = true;     // a page turn opens a closed book on the way
    if (shelf) { turn(from, target); }
    describe();
    if (!silent && window.history && window.history.replaceState) {
      window.history.replaceState(null, "", "#" + spreads[current].id);
    }
  }

  /* The book is as tall as its fullest page, so that no page has to scroll, and never
     flatter than an open book, whose spread is about 1.6 times as wide as it is tall. */
  function fit() {
    if (!shelf || shelf.style.display === "none") { return; }
    var need = 0;
    Array.prototype.forEach.call(shelf.querySelectorAll(".rl-page"), function (page) {
      var style = window.getComputedStyle(page);
      var inner = page.querySelector(".rl-page-inner");
      need = Math.max(need, inner.offsetHeight + parseFloat(style.paddingTop) + parseFloat(style.paddingBottom));
    });
    // the theme sizes boxes by their border, so the cover counts towards the height
    var cover = window.getComputedStyle(shelf);
    var frame = cover.boxSizing === "border-box"
      ? parseFloat(cover.borderTopWidth) + parseFloat(cover.borderBottomWidth) : 0;
    var floor = Math.round(shelf.getBoundingClientRect().width / 1.6);
    shelf.style.height = Math.max(floor, Math.ceil(need + frame) + 2) + "px";
    // the labels on the edge shrink until they fit the height of the book
    var tabs = book.querySelector(".rl-book-tabs");
    if (tabs) {
      var size = 13.5;
      tabs.style.setProperty("--rl-tab-size", size + "px");
      while (tabs.scrollHeight > shelf.offsetHeight - 20 && size > 9.5) {
        size -= 0.5;
        tabs.style.setProperty("--rl-tab-size", size + "px");
      }
    }
  }

  var laidOutAt = -1;
  function layout() {
    var width = book.parentElement.clientWidth;
    if (width === laidOutAt) { return; }
    laidOutAt = width;
    var wide = width >= WIDE;
    book.classList.toggle("is-wide", wide);
    book.classList.toggle("is-narrow", !wide);
    if (wide && !shelf) { build(); }
    if (shelf) {
      shelf.style.display = wide ? "" : "none";
      leaves.forEach(function (item, k) {
        item.leaf.style.transition = "none";
        item.leaf.classList.toggle("is-flipped", k <= current && (k > 0 || opened));
      });
      rest();
      fit();
      window.requestAnimationFrame(function () {
        leaves.forEach(function (item) { item.leaf.style.transition = ""; });
      });
    }
  }

  // ---- wiring
  book.classList.add("is-live");
  book.addEventListener("click", function (event) {
    var link = event.target.closest ? event.target.closest('a[href^="#book-"]') : null;
    if (!link || !book.contains(link)) { return; }
    var index = indexOfId(link.getAttribute("href").slice(1));
    if (index >= 0) { event.preventDefault(); go(index); }
  });
  prevButton.addEventListener("click", function () { go(current - 1); });
  nextButton.addEventListener("click", function () { go(current + 1); });
  stage.setAttribute("tabindex", "0");
  stage.addEventListener("keydown", function (event) {
    var key = event.key;
    if (key === "ArrowRight" || key === "PageDown") { go(current + 1); }
    else if (key === "ArrowLeft" || key === "PageUp") { go(current - 1); }
    else if (key === "Home") { go(0); }
    else if (key === "End") { go(last); }
    else { return; }
    event.preventDefault();
  });
  var touchX = null;
  stage.addEventListener("touchstart", function (event) { touchX = event.changedTouches[0].clientX; }, { passive: true });
  stage.addEventListener("touchend", function (event) {
    if (touchX === null) { return; }
    var dx = event.changedTouches[0].clientX - touchX;
    touchX = null;
    if (Math.abs(dx) > 50) { go(current + (dx < 0 ? 1 : -1)); }
  }, { passive: true });
  window.addEventListener("hashchange", function () {
    var index = indexOfId(window.location.hash.slice(1));
    if (index >= 0) { go(index, true); reveal(); }
  });
  var pending = null;
  window.addEventListener("resize", function () {
    window.clearTimeout(pending);
    pending = window.setTimeout(layout, 120);
  });
  // the pages are measured again once images and fonts are in: both change their height
  function again() { laidOutAt = -1; layout(); }
  window.addEventListener("load", again);
  if (document.fonts && document.fonts.ready) { document.fonts.ready.then(again); }

  var start = indexOfId(window.location.hash.slice(1));
  if (start > 0) { current = start; }
  if (start >= 0) { opened = true; }   // a deep link lands on an open book
  layout();
  describe();

  /* The closed book opens once about half of it is in view. */
  function open() {
    if (opened) { return; }
    opened = true;
    if (!shelf || shelf.style.display === "none") { return; }
    var first = leaves[0];
    first.leaf.style.transitionDelay = "0ms";
    first.leaf.style.zIndex = "1000";
    setHidden(first.front, false);
    setHidden(first.back, false);
    first.leaf.classList.add("is-flipped");
    window.clearTimeout(settle);
    settle = window.setTimeout(rest, 800);
  }
  if (!opened) {
    if (window.IntersectionObserver) {
      var io = new window.IntersectionObserver(function (entries) {
        if (entries.some(function (e) { return e.isIntersecting; })) { io.disconnect(); window.setTimeout(open, 300); }
      }, { threshold: 0.45 });
      io.observe(stage);
    } else { open(); }
  }
  // A spread that is not showing cannot be scrolled to, so the book is: now, and once
  // more when the images above it have loaded and moved it down the page.
  function reveal() { if (book.scrollIntoView) { book.scrollIntoView(); } }
  if (start >= 0) { reveal(); window.addEventListener("load", reveal); }
}());
