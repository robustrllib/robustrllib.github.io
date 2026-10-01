/* The behaviour of the documentation pages: the two side columns on narrow windows,
   the sections of the page that follow the reader, the search, the copy buttons.
   No dependency. */
(function () {
  "use strict";
  var body = document.body;
  var sidebar = document.querySelector(".bk-sidebar");
  var toc = document.getElementById("bk-toc");
  var backdrop = document.getElementById("bk-backdrop");

  // ---- the two side columns, where they lie behind a button
  function closeDrawers() {
    body.classList.remove("bk-nav-open", "bk-toc-open");
    backdrop.hidden = true;
  }
  function toggleDrawer(name) {
    var open = body.classList.contains(name);
    closeDrawers();
    if (!open) {
      body.classList.add(name);
      backdrop.hidden = false;
    }
  }
  document.getElementById("bk-toggle-nav").addEventListener("click", function () { toggleDrawer("bk-nav-open"); });
  var tocButton = document.getElementById("bk-toggle-toc");
  if (!toc.querySelector("a")) { tocButton.hidden = true; }
  tocButton.addEventListener("click", function () { toggleDrawer("bk-toc-open"); });
  backdrop.addEventListener("click", closeDrawers);
  toc.addEventListener("click", function (event) {
    if (event.target.closest && event.target.closest("a")) { closeDrawers(); }
  });
  window.addEventListener("resize", closeDrawers);
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") { closeDrawers(); }
  });

  // the page that is open is in view in the list of pages
  var here = sidebar.querySelector(".bk-nav-link.is-active");
  if (here) {
    var top = here.getBoundingClientRect().top - sidebar.getBoundingClientRect().top;
    if (top > sidebar.clientHeight * 0.7) { sidebar.scrollTop = top - sidebar.clientHeight / 2; }
  }

  // ---- the sections of the page follow the reader
  var scroller = toc.querySelector(".bk-toc");
  var links = Array.prototype.slice.call(toc.querySelectorAll(".bk-toc-link"));
  var marks = links.map(function (link) {
    var id = decodeURIComponent((link.getAttribute("href") || "").slice(1));
    return { link: link, target: id ? document.getElementById(id) : null };
  }).filter(function (mark) { return mark.target; });
  var waiting = false;
  function follow() {
    waiting = false;
    if (!marks.length) { return; }
    // where a section lands when its link is followed, and a little air
    var land = parseFloat(window.getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
    var line = land + 24;
    var current = marks[0];
    for (var i = 0; i < marks.length; i++) {
      if (marks[i].target.getBoundingClientRect().top <= line) { current = marks[i]; } else { break; }
    }
    // at the end of the page the last section counts, however short it is
    if (window.innerHeight + window.pageYOffset >= document.documentElement.scrollHeight - 2) {
      current = marks[marks.length - 1];
    }
    marks.forEach(function (mark) {
      var active = mark === current;
      if (mark.link.classList.contains("is-active") !== active) {
        mark.link.classList.toggle("is-active", active);
        if (active) { mark.link.setAttribute("aria-current", "true"); } else { mark.link.removeAttribute("aria-current"); }
      }
    });
    var box = current.link.getBoundingClientRect();
    var frame = scroller.getBoundingClientRect();
    if (box.top < frame.top + 48 || box.bottom > frame.bottom - 16) {
      scroller.scrollTop += box.top - frame.top - frame.height / 2;
    }
  }
  function schedule() {
    if (!waiting) { waiting = true; window.requestAnimationFrame(follow); }
  }
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule);
  window.addEventListener("load", schedule);
  follow();

  // ---- search
  var search = document.getElementById("bk-search");
  if (search) {
    var field = document.getElementById("mkdocs-search-query");
    var results = document.getElementById("mkdocs-search-results");
    var before = null;
    var openSearch = function () {
      closeDrawers();
      before = document.activeElement;
      search.hidden = false;
      field.focus();
      field.select();
    };
    var closeSearch = function () {
      search.hidden = true;
      if (before && before.focus) { before.focus(); }
    };
    // the text of a page carries the mark of the link beside each heading; not in a summary
    if (window.MutationObserver) {
      new window.MutationObserver(function () {
        Array.prototype.forEach.call(results.querySelectorAll("article p"), function (p) {
          var text = p.textContent;
          var clean = text.replace(/\s*¶\s*/g, " ");
          if (clean !== text) { p.textContent = clean; }
        });
      }).observe(results, { childList: true });
    }
    document.getElementById("bk-search-open").addEventListener("click", openSearch);
    document.getElementById("bk-search-close").addEventListener("click", closeSearch);
    search.addEventListener("mousedown", function (event) { if (event.target === search) { closeSearch(); } });
    document.addEventListener("keydown", function (event) {
      var key = event.key;
      if ((event.ctrlKey || event.metaKey) && (key === "k" || key === "K")) {
        event.preventDefault();
        if (search.hidden) { openSearch(); } else { closeSearch(); }
      } else if (key === "Escape" && !search.hidden) {
        closeSearch();
      } else if (!search.hidden && (key === "ArrowDown" || key === "ArrowUp")) {
        var items = Array.prototype.slice.call(results.querySelectorAll("a"));
        if (!items.length) { return; }
        var at = items.indexOf(document.activeElement);
        var next = key === "ArrowDown" ? at + 1 : at - 1;
        event.preventDefault();
        if (next < 0) { field.focus(); } else { items[Math.min(next, items.length - 1)].focus(); }
      } else if (!search.hidden && key === "Enter" && document.activeElement === field) {
        var first = results.querySelector("a");
        if (first) { window.location.href = first.href; }
      }
    });
  }

  // ---- copy buttons on the code blocks; the algorithm book has narrow pages and none
  function copyText(text, done) {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(done, function () { fallback(text, done); });
    } else {
      fallback(text, done);
    }
  }
  function fallback(text, done) {
    var area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    try { if (document.execCommand("copy")) { done(); } } catch (e) { /* nothing to do */ }
    document.body.removeChild(area);
  }
  Array.prototype.forEach.call(document.querySelectorAll(".bk-article div.highlight"), function (block) {
    if (block.closest(".rl-book")) { return; }
    var pre = block.querySelector("pre");
    if (!pre) { return; }
    var button = document.createElement("button");
    button.type = "button";
    button.className = "bk-copy";
    button.setAttribute("aria-label", "Copy the code");
    button.title = "Copy";
    button.innerHTML = '<span class="fa fa-files-o" aria-hidden="true"></span>';
    button.addEventListener("click", function () {
      copyText(pre.textContent.replace(/\n$/, ""), function () {
        var icon = button.querySelector(".fa");
        button.classList.add("is-done");
        icon.className = "fa fa-check";
        window.setTimeout(function () {
          button.classList.remove("is-done");
          icon.className = "fa fa-files-o";
        }, 1600);
      });
    });
    block.appendChild(button);
  });
}());
