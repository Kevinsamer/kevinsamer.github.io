const device = document.getElementById("device");
const replay = document.getElementById("replay");
const autoToggle = document.getElementById("auto-toggle");
const toggle = autoToggle.querySelector(".toggle");
const status = document.getElementById("status");
const caption = document.getElementById("caption");
const progressBar = document.getElementById("progress-bar");
const progressLabel = document.getElementById("progress-label");
const steps = [...document.querySelectorAll(".timeline-steps span")];
const duration = 1900;
let autoPlay = true;
let timer;
let startedAt = 0;

function setStep(progress) {
  const index = progress < 0.36 ? 0 : progress < 0.72 ? 1 : 2;
  steps.forEach((step, stepIndex) => step.classList.toggle("active", stepIndex === index));
  const labels = ["FOLDING DEVICE", "HINGE ALIGNMENT", "DUO DISPLAY"];
  caption.textContent = labels[index];
  status.textContent = index === 2 ? "READY" : "OPENING";
  progressLabel.textContent = `${String(index).padStart(2, "0")} / 03`;
}

function animateProgress(now) {
  const progress = Math.min((now - startedAt) / duration, 1);
  progressBar.style.width = `${progress * 100}%`;
  setStep(progress);
  if (progress < 1) {
    timer = requestAnimationFrame(animateProgress);
  } else if (autoPlay) {
    window.setTimeout(play, 2600);
  }
}

function play() {
  cancelAnimationFrame(timer);
  device.classList.remove("is-opening");
  void device.offsetWidth;
  device.classList.add("is-opening");
  startedAt = performance.now();
  progressBar.style.width = "0%";
  setStep(0);
  timer = requestAnimationFrame(animateProgress);
}

replay.addEventListener("click", play);
autoToggle.addEventListener("click", () => {
  autoPlay = !autoPlay;
  autoToggle.setAttribute("aria-pressed", String(autoPlay));
  toggle.classList.toggle("on", autoPlay);
  if (autoPlay && !device.classList.contains("is-opening")) play();
});

play();
