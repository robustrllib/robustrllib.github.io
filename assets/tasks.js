/* The task cards: one tab per task family; the first is shown when the page opens. */
(function () {
  "use strict";
  var root = document.getElementById("tasks");
  if (!root) { return; }
  var cards = Array.prototype.slice.call(root.querySelectorAll(".task"));
  var tabs = Array.prototype.slice.call(root.querySelectorAll(".fbtn"));
  function show(family) {
    cards.forEach(function (c) { c.hidden = c.getAttribute("data-family") !== family; });
    tabs.forEach(function (b) {
      var on = b.getAttribute("data-family") === family;
      b.classList.toggle("is-active", on); b.setAttribute("aria-selected", on ? "true" : "false");
    });
  }
  tabs.forEach(function (b) { b.addEventListener("click", function () { show(b.getAttribute("data-family")); }); });
  if (tabs.length) { show(tabs[0].getAttribute("data-family")); }
}());
