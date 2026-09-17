const stage = document.getElementById("device-stage");
const replay = document.getElementById("replay");
const autoToggle = document.getElementById("auto-toggle");
const toggle = autoToggle.querySelector(".toggle");
const slider = document.getElementById("fold-slider");
const status = document.getElementById("status");
const caption = document.getElementById("caption");
const angleReadout = document.getElementById("angle-readout");
const progressBar = document.getElementById("progress-bar");
const rangeThumb = document.getElementById("range-thumb");
const progressLabel = document.getElementById("progress-label");
const detents = [...document.querySelectorAll("[data-detent]")];
const prefersReducedMotion = matchMedia("(prefers-reduced-motion: reduce)");

let value = 0.67;
let target = value;
let velocity = 0;
let frame = 0;
let lastTime = performance.now();
let dragging = false;
let dragStartX = 0;
let dragStartValue = value;
let autoPlay = !prefersReducedMotion.matches;
let tourTimer = 0;
let tourIndex = 0;

const clamp = (number, min = 0, max = 1) => Math.min(max, Math.max(min, number));

function stateFor(open) {
  if (open < 0.16) return { label: "合拢", caption: "CLOSED", status: "CLOSED", aria: "合拢" };
  if (open < 0.86) return { label: "悬停", caption: "FLEX MODE", status: "FLEX", aria: `展开 ${Math.round(open * 100)}%` };
  return { label: "展开", caption: "DUO DISPLAY", status: "OPEN", aria: "完全展开" };
}

function render() {
  const percent = value * 100;
  const closed = 1 - value;
  const glass = Math.sin(Math.PI * value);
  const state = stateFor(value);
  stage.style.setProperty("--open", value.toFixed(4));
  stage.style.setProperty("--closed", closed.toFixed(4));
  stage.style.setProperty("--glow-alpha", (0.08 + value * 0.18).toFixed(3));
  stage.style.setProperty("--shadow-width", `${35 + value * 39}%`);
  stage.style.setProperty("--shadow-alpha", (0.48 + value * 0.24).toFixed(3));
  stage.style.setProperty("--shadow-x", `${closed * 16}%`);
  stage.style.setProperty("--tilt-x", `${6 + value * 3}deg`);
  stage.style.setProperty("--tilt-z", `${-1 - value * 2}deg`);
  stage.style.setProperty("--lift", `${closed * 8}px`);
  stage.style.setProperty("--fold-angle", `${closed * 178}deg`);
  stage.style.setProperty("--reflection-alpha", (0.04 + closed * 0.22).toFixed(3));
  stage.style.setProperty("--sheen-x", `${-95 + value * 150}%`);
  stage.style.setProperty("--orb-scale", (0.82 + value * 0.18).toFixed(3));
  stage.style.setProperty("--content-opacity", (0.35 + value * 0.65).toFixed(3));
  stage.style.setProperty("--hinge-width", `${7 + closed * 6}px`);
  stage.style.setProperty("--hinge-shadow", `${8 + closed * 12}px`);
  stage.style.setProperty("--crease-opacity", (0.08 + closed * 0.8).toFixed(3));
  stage.style.setProperty("--crease-shadow", `${4 + closed * 13}px`);
  stage.style.setProperty("--echo-one-opacity", (glass * 0.34).toFixed(3));
  stage.style.setProperty("--echo-two-opacity", (glass * 0.18).toFixed(3));
  stage.style.setProperty("--echo-one-angle", `${closed * 150}deg`);
  stage.style.setProperty("--echo-two-angle", `${closed * 122}deg`);
  stage.style.setProperty("--glass-alpha", (glass * 0.5).toFixed(3));
  stage.style.setProperty("--glass-blur", `${2 + glass * 11}px`);
  stage.style.setProperty("--caustic-blur", `${1 + glass * 6}px`);
  stage.style.setProperty("--caustic-angle", `${closed * 136}deg`);
  stage.style.setProperty("--caustic-shift", `${-75 + value * 145}%`);
  slider.value = value.toFixed(4);
  slider.setAttribute("aria-valuetext", state.aria);
  progressBar.style.width = `${percent}%`;
  rangeThumb.style.left = `${percent}%`;
  progressLabel.textContent = `${Math.round(percent)}%`;
  angleReadout.textContent = `${Math.round(2 + value * 178)}°`;
  caption.textContent = state.caption;
  status.textContent = state.status;
  detents.forEach((button) => button.classList.toggle("active", button.textContent === state.label));
}

function stopTour() {
  clearTimeout(tourTimer);
}

function settle(next, immediate = false) {
  target = clamp(next);
  if (immediate || prefersReducedMotion.matches) {
    value = target;
    velocity = 0;
    render();
    return;
  }
  if (!frame) {
    lastTime = performance.now();
    frame = requestAnimationFrame(tick);
  }
}

function tick(now) {
  const dt = Math.min((now - lastTime) / 1000, 0.032);
  lastTime = now;
  const stiffness = 170;
  const damping = 23;
  const acceleration = (target - value) * stiffness - velocity * damping;
  velocity += acceleration * dt;
  value = clamp(value + velocity * dt);
  render();

  if (Math.abs(target - value) < 0.0005 && Math.abs(velocity) < 0.004) {
    value = target;
    velocity = 0;
    frame = 0;
    render();
    return;
  }
  frame = requestAnimationFrame(tick);
}

function scheduleTour(delay = 1100) {
  stopTour();
  if (!autoPlay || dragging || document.hidden) return;
  const sequence = [0, 0.58, 1, 0.58];
  tourTimer = window.setTimeout(() => {
    tourIndex = (tourIndex + 1) % sequence.length;
    settle(sequence[tourIndex]);
    scheduleTour(tourIndex === 2 ? 2400 : 1550);
  }, delay);
}

function pauseForInteraction() {
  stopTour();
  if (autoPlay) scheduleTour(4200);
}

function snapToNearestDetent() {
  const points = [0, 0.58, 1];
  const nearest = points.reduce((best, point) => Math.abs(point - value) < Math.abs(best - value) ? point : best);
  settle(nearest);
}

slider.addEventListener("input", () => {
  stopTour();
  value = Number(slider.value);
  target = value;
  velocity = 0;
  render();
});
slider.addEventListener("change", () => {
  snapToNearestDetent();
  pauseForInteraction();
});

stage.addEventListener("pointerdown", (event) => {
  if (event.button !== 0) return;
  dragging = true;
  stopTour();
  dragStartX = event.clientX;
  dragStartValue = value;
  velocity = 0;
  target = value;
  stage.classList.add("is-dragging");
  stage.setPointerCapture(event.pointerId);
});
stage.addEventListener("pointermove", (event) => {
  if (!dragging) return;
  const travel = Math.max(stage.clientWidth * 0.62, 240);
  value = clamp(dragStartValue - (event.clientX - dragStartX) / travel);
  target = value;
  render();
});
function endDrag(event) {
  if (!dragging) return;
  dragging = false;
  stage.classList.remove("is-dragging");
  if (stage.hasPointerCapture(event.pointerId)) stage.releasePointerCapture(event.pointerId);
  snapToNearestDetent();
  pauseForInteraction();
}
stage.addEventListener("pointerup", endDrag);
stage.addEventListener("pointercancel", endDrag);

detents.forEach((button) => button.addEventListener("click", () => {
  settle(Number(button.dataset.detent));
  pauseForInteraction();
}));

replay.addEventListener("click", () => {
  stopTour();
  settle(0, true);
  window.setTimeout(() => settle(1), prefersReducedMotion.matches ? 0 : 180);
  if (autoPlay) scheduleTour(3300);
});

autoToggle.addEventListener("click", () => {
  autoPlay = !autoPlay;
  autoToggle.setAttribute("aria-pressed", String(autoPlay));
  toggle.classList.toggle("on", autoPlay);
  if (autoPlay) scheduleTour(400);
  else stopTour();
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden) stopTour();
  else scheduleTour(900);
});

render();
scheduleTour();
