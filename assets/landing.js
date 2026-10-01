/* The project page: the sections that come in as they scroll into view, the counted
   numbers, the loop of the six sources, the shift toolbox, and the buttons that lead
   nowhere yet. */
(function () {
  "use strict";
  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var observe = window.IntersectionObserver && !reduced;
  document.documentElement.classList.add("has-js");

  // ---- compact number cards grow downwards as their tags appear, ending at one height
  (function () {
    var cards = Array.prototype.slice.call(document.querySelectorAll(".hero-metric"));
    var stage = document.querySelector(".hero-stage");
    if (!cards.length || !stage) { return; }
    function level() {
      stage.style.marginBottom = "";
      var tags = cards.map(function (card) { return card.querySelector(".hero-tags"); });
      // Measure the natural wrapped content even while the tag area is collapsed.
      tags.forEach(function (tag) { tag.style.height = "auto"; });
      var tallest = Math.max.apply(null, tags.map(function (tag) { return tag.offsetHeight; }));
      var fullHeights = cards.map(function (card, index) {
        var tag = tags[index];
        return card.offsetHeight - tag.offsetHeight
          - parseFloat(window.getComputedStyle(tag).marginTop) + tallest + 8;
      });
      stage.style.setProperty("--hero-tags-height", tallest + "px");
      tags.forEach(function (tag) { tag.style.height = ""; });
      // Reserve the final footprint so unfolding the cards does not push the next section.
      var below = Math.max.apply(null, cards.map(function (card, index) {
        return card.offsetTop + fullHeights[index];
      })) - stage.clientHeight;
      var margin = parseFloat(window.getComputedStyle(stage).marginBottom) || 0;
      if (below + 14 > margin) { stage.style.marginBottom = (below + 14) + "px"; }
    }
    level();
    window.addEventListener("resize", level, { passive: true });
    if (document.fonts && document.fonts.ready) { document.fonts.ready.then(level); }
  }());

  // ---- the hero floats briefly, then settles into illustrations / book / numbers
  (function () {
    var scene = document.querySelector(".hero-collage");
    if (scene && (reduced || typeof scene.animate !== "function")) { scene.classList.add("is-settled"); }
    if (!scene || reduced || typeof scene.animate !== "function") { return; }
    var motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    var width = scene.clientWidth, height = scene.clientHeight;
    var animations = [], observer = null, started = false, done = false;
    var visible = !window.IntersectionObserver, ready = false;

    function settle() {
      if (done) { return; }
      done = true;
      scene.classList.add("is-settled");   // the tags of the numbers come in now
      if (observer) { observer.disconnect(); }
      animations.forEach(function (animation) { animation.cancel(); });
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", visibility);
      if (motion.removeEventListener) { motion.removeEventListener("change", preference); }
    }
    function play() {
      if (done || started || !ready || !visible || document.hidden) { return; }
      started = true;
      animations.forEach(function (animation) { animation.play(); });
      Promise.all(animations.map(function (animation) { return animation.finished; })).then(settle, settle);
    }
    function resize() {
      // A changed viewport should land cleanly in its new responsive layout.
      if (scene.clientWidth !== width) { settle(); }
    }
    function preference(event) { if (event.matches) { settle(); } }
    function visibility() {
      if (done) { return; }
      if (!started) { play(); return; }
      animations.forEach(function (animation) {
        if (document.hidden) { animation.pause(); } else { animation.play(); }
      });
    }
    function transform(x, y, angle) {
      return "translate(" + x + "px, " + y + "px) rotate(" + angle + "deg)";
    }

    Array.prototype.forEach.call(scene.children, function (item) {
      var style = window.getComputedStyle(item);
      var x = width * parseFloat(style.getPropertyValue("--from-x")) / 100 - item.offsetLeft;
      var y = height * parseFloat(style.getPropertyValue("--from-y")) / 100 - item.offsetTop;
      var angle = parseFloat(style.getPropertyValue("--tilt")) || 0;
      var order = parseFloat(style.getPropertyValue("--order")) || 0;
      var drift = item.classList.contains("scene-book") ? 0 : (item.classList.contains("hero-metric") ? 7 : 3);
      var animation = item.animate([
        { transform: transform(x, y, angle), offset: 0, easing: "ease-in-out" },
        { transform: transform(x, y - drift, angle - (drift ? 1 : 0)), offset: .18, easing: "ease-in-out" },
        { transform: transform(x, y + drift * .4, angle), offset: .36, easing: "cubic-bezier(.22, 1, .36, 1)" },
        { transform: "translate(0px, 0px) rotate(0deg)", offset: 1 }
      ], { duration: 3000, delay: order * 80, fill: "both" });
      animation.pause();
      animation.currentTime = 0;
      // Resizing before first visibility can cancel a still-paused animation.
      animation.finished.catch(function () {});
      animations.push(animation);
    });

    window.addEventListener("resize", resize, { passive: true });
    document.addEventListener("visibilitychange", visibility);
    if (motion.addEventListener) { motion.addEventListener("change", preference); }
    if (window.IntersectionObserver) {
      observer = new window.IntersectionObserver(function (entries) {
        visible = entries.some(function (entry) { return entry.isIntersecting; });
        if (visible) { observer.disconnect(); play(); }
      }, { threshold: .15 });
      observer.observe(scene);
    }
    Promise.all(Array.prototype.map.call(scene.querySelectorAll("img"), function (img) {
      return img.decode ? img.decode().catch(function () {}) : Promise.resolve();
    })).then(function () { ready = true; play(); });
  }());

  // ---- every block of a section comes in when it scrolls into view, one after another
  (function () {
    var wraps = document.querySelectorAll("section > .wrap, .hero");
    var items = [];
    Array.prototype.forEach.call(wraps, function (wrap) {
      var i = 0;
      Array.prototype.forEach.call(wrap.children, function (child) {
        if (child.matches("script, style, .rl-book, [data-no-reveal]")) { return; }
        child.classList.add("reveal");
        child.style.setProperty("--d", String(Math.min(i, 6)));
        items.push(child);
        i += 1;
      });
    });
    if (!observe) { items.forEach(function (el) { el.classList.add("is-visible"); }); return; }
    var io = new window.IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add("is-visible"); io.unobserve(entry.target); }
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -36px 0px" });
    items.forEach(function (el) { io.observe(el); });
  }());

  // ---- the five numbers count up once
  (function () {
    var nums = document.querySelectorAll("[data-count]");
    if (!nums.length) { return; }
    function run(el) {
      var target = parseInt(el.getAttribute("data-count"), 10), t0 = null, dur = 1100;
      function step(ts) {
        if (t0 === null) { t0 = ts; }
        var p = Math.min((ts - t0) / dur, 1), eased = 1 - Math.pow(1 - p, 3);
        el.textContent = String(Math.round(eased * target));
        if (p < 1) { window.requestAnimationFrame(step); } else { el.textContent = String(target); }
      }
      window.requestAnimationFrame(step);
    }
    if (!observe) { return; }
    var io = new window.IntersectionObserver(function (entries) {
      entries.forEach(function (entry) { if (entry.isIntersecting) { run(entry.target); io.unobserve(entry.target); } });
    }, { threshold: 0.5 });
    Array.prototype.forEach.call(nums, function (n) { io.observe(n); });
  }());

  // ---- the loop of the six sources: the chain appears from the agent on, then flows
  (function () {
    var scene = document.getElementById("shift-loop-scene");
    if (!scene) { return; }
    var steps = parseInt(scene.getAttribute("data-steps") || "12", 10);
    function flow() { scene.classList.add("flow"); }
    function play() {
      scene.classList.add("play");
      window.setTimeout(flow, steps * 150 + 500);
    }
    if (!observe) { scene.classList.add("play", "still"); return; }
    var io = new window.IntersectionObserver(function (entries) {
      if (entries.some(function (e) { return e.isIntersecting; })) { io.disconnect(); play(); }
    }, { threshold: 0.25 });
    io.observe(scene);
  }());

  // ---- links that are not live yet shake instead of leaving the page
  document.querySelectorAll("[data-blocked]").forEach(function (el) {
    el.addEventListener("click", function (event) {
      event.preventDefault();
      el.animate(
        [{ transform: "translateX(0)" }, { transform: "translateX(-3px)" },
         { transform: "translateX(3px)" }, { transform: "translateX(0)" }],
        { duration: 220 }
      );
    });
  });

  // ---- the shift toolbox: a source, a mode, and what the toolbox offers for the two
  var box = document.getElementById("shift-toolbox");
  var dataNode = document.getElementById("shift-data");
  if (!box || !dataNode) { return; }
  var data;
  try { data = JSON.parse(dataNode.textContent); } catch (e) { return; }
  var sources = data.sources, modes = data.modes;
  var panel = document.getElementById("tb-panel");
  var sourceButtons = Array.prototype.slice.call(box.querySelectorAll(".tb-source"));
  var modeButtons = Array.prototype.slice.call(box.querySelectorAll(".tb-mode"));
  var state = { source: sources[0].key, mode: null };

  function bySource(key) { return sources.filter(function (s) { return s.key === key; })[0]; }
  function byMode(key) { return modes.filter(function (m) { return m.key === key; })[0]; }

  function element(tag, className, text) {
    var node = document.createElement(tag);
    if (className) { node.className = className; }
    if (text !== undefined) { node.textContent = text; }
    return node;
  }

  function render() {
    var source = bySource(state.source);
    if (!source.modes[state.mode]) {
      state.mode = modes.filter(function (m) { return source.modes[m.key]; })[0].key;
    }
    var mode = byMode(state.mode);
    var entry = source.modes[state.mode];

    sourceButtons.forEach(function (b) {
      var on = b.getAttribute("data-source") === state.source;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-selected", on ? "true" : "false");
    });
    modeButtons.forEach(function (b) {
      var key = b.getAttribute("data-mode");
      var offered = !!source.modes[key];
      var on = key === state.mode;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-selected", on ? "true" : "false");
      if (offered) { b.removeAttribute("aria-disabled"); b.removeAttribute("title"); }
      else { b.setAttribute("aria-disabled", "true"); b.title = "Not offered for this source"; }
    });

    // the panel is built from text, never from markup
    var figure = element("figure", "tb-figure");
    var comparison = source.example.videos;
    panel.classList.toggle("is-comparison", !!comparison);
    if (comparison) {
      var pair = element("div", "tb-comparison" + (source.key === "latency" ? " tb-comparison-tall" : ""));
      [["nominal", "Nominal"], ["shifted", "Shifted"]].forEach(function (item) {
        var clip = element("div", "tb-clip");
        clip.appendChild(element("span", "", item[1]));
        var video = element("video");
        video.src = comparison[item[0]];
        video.poster = source.example.posters[item[0]];
        video.autoplay = true;
        video.muted = true;
        video.loop = true;
        video.playsInline = true;
        video.controls = true;
        video.preload = "metadata";
        video.setAttribute("aria-label", item[1] + ": " + source.example.caption);
        clip.appendChild(video);
        pair.appendChild(clip);
      });
      figure.appendChild(pair);
    } else {
      var img = element("img");
      img.src = source.example.image;
      img.alt = source.example.caption;
      figure.appendChild(img);
    }
    figure.appendChild(element("figcaption", "", source.example.caption));

    var detail = element("div", "tb-detail");
    var title = element("p", "tb-title");
    title.appendChild(element("b", "", source.name));
    title.appendChild(document.createTextNode(" · " + mode.name));
    detail.appendChild(title);
    detail.appendChild(element("p", "tb-blurb", entry.note || ""));
    if (entry.names && entry.names.length) {
      var names = element("p", "tb-names");
      entry.names.forEach(function (n) { names.appendChild(element("code", "", n)); });
      detail.appendChild(names);
    }
    detail.appendChild(element("pre", "code tb-code", entry.code));
    var links = element("p", "tb-links");
    var a = element("a", "", source.name + " in the tutorial"); a.href = source.page;
    var b = element("a", "", mode.name + " mode"); b.href = mode.page;
    links.appendChild(a); links.appendChild(document.createTextNode(" · ")); links.appendChild(b);
    detail.appendChild(links);

    panel.classList.add("is-changing");
    panel.replaceChildren(detail, figure);   // the mode's explanation and code above the demo
    window.requestAnimationFrame(function () { panel.classList.remove("is-changing"); });
  }

  // ---- task support: filters, and the selected source dims the tasks that do not carry it
  var taskState = { family: "all", regime: "all" };
  //      (the block sits below the loop of the six sources, outside the toolbox card)
  var tasksBox = document.getElementById("tb-tasks") || box;
  var taskCards = Array.prototype.slice.call(tasksBox.querySelectorAll(".tb-task"));
  var familyButtons = Array.prototype.slice.call(tasksBox.querySelectorAll(".tb-family"));
  var regimeButtons = Array.prototype.slice.call(tasksBox.querySelectorAll(".tb-regime"));
  var emptyNote = tasksBox.querySelector(".tb-tasks-empty");
  function renderTasks() {
    var shown = 0;
    taskCards.forEach(function (card) {
      var okFamily = taskState.family === "all" || card.getAttribute("data-family") === taskState.family;
      var okRegime = taskState.regime === "all" || card.getAttribute("data-regime").split(" ").indexOf(taskState.regime) >= 0;
      var on = okFamily && okRegime;
      card.hidden = !on;
      if (on) { shown += 1; }
      card.classList.toggle("is-dim", card.getAttribute("data-shifts").split(" ").indexOf(state.source) < 0);
    });
    familyButtons.forEach(function (b) { b.classList.toggle("is-active", b.getAttribute("data-family") === taskState.family); });
    regimeButtons.forEach(function (b) { b.classList.toggle("is-active", b.getAttribute("data-regime") === taskState.regime); });
    if (emptyNote) { emptyNote.hidden = shown > 0; }
  }
  familyButtons.forEach(function (b) { b.addEventListener("click", function () { taskState.family = b.getAttribute("data-family"); renderTasks(); }); });
  regimeButtons.forEach(function (b) { b.addEventListener("click", function () { taskState.regime = b.getAttribute("data-regime"); renderTasks(); }); });

  sourceButtons.forEach(function (b) {
    b.addEventListener("click", function () { state.source = b.getAttribute("data-source"); render(); renderTasks(); });
  });
  modeButtons.forEach(function (b) {
    b.addEventListener("click", function () {
      var key = b.getAttribute("data-mode");
      if (bySource(state.source).modes[key]) { state.mode = key; render(); }
    });
  });
  box.classList.add("is-live");
  render();
  renderTasks();
}());
