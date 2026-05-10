/* ============================================
   Train Recorder — Shared Interactions
   ============================================ */

document.addEventListener("DOMContentLoaded", () => {
  initTabs();
  initSegmented();
  initSliders();
  initTimer();
  initModals();
  initAccordion();
  highlightActiveTab();
});

// Tab Bar — highlight active page
function highlightActiveTab() {
  const page = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".tab-item").forEach((t) => {
    const href = t.getAttribute("href");
    if (href && page.includes(href.replace(".html", ""))) {
      t.classList.add("active");
    }
  });
}

// Segmented Control
function initSegmented() {
  document.querySelectorAll(".segmented").forEach((seg) => {
    const options = seg.querySelectorAll(".seg-option");
    options.forEach((opt) => {
      opt.addEventListener("click", () => {
        options.forEach((o) => o.classList.remove("active"));
        opt.classList.add("active");
        // Toggle corresponding panels
        const target = opt.dataset.target;
        if (target) {
          const parent = seg.parentElement;
          parent
            .querySelectorAll(".tab-panel")
            .forEach((p) => p.classList.add("hidden"));
          const panel = parent.querySelector("#" + target);
          if (panel) panel.classList.remove("hidden");
        }
      });
    });
  });
}

// Tabs (alternative to segmented)
function initTabs() {
  document.querySelectorAll("[data-tab]").forEach((trigger) => {
    trigger.addEventListener("click", () => {
      const group = trigger.closest(".tab-group");
      if (!group) return;
      group
        .querySelectorAll("[data-tab]")
        .forEach((t) => t.classList.remove("active"));
      trigger.classList.add("active");
      group
        .querySelectorAll(".tab-panel")
        .forEach((p) => p.classList.add("hidden"));
      const target = group.querySelector("#" + trigger.dataset.tab);
      if (target) target.classList.remove("hidden");
    });
  });
}

// Sliders — show value
function initSliders() {
  document.querySelectorAll('input[type="range"]').forEach((slider) => {
    const display = document.getElementById(slider.dataset.display);
    if (display) display.textContent = slider.value;
    slider.addEventListener("input", () => {
      if (display) display.textContent = slider.value;
    });
  });
}

// Timer
let timerInterval = null;
let timerSeconds = 180;

function initTimer() {
  const timerArea = document.querySelector(".timer-area");
  if (!timerArea) return;

  const countdown = timerArea.querySelector(".timer-countdown");
  const startBtn = timerArea.querySelector('[data-action="start"]');
  const skipBtn = timerArea.querySelector('[data-action="skip"]');
  const adjustBtns = timerArea.querySelectorAll('[data-action="adjust"]');

  if (startBtn) {
    startBtn.addEventListener("click", () => {
      if (timerInterval) return;
      timerArea.classList.add("visible");
      startCountdown(countdown);
    });
  }

  if (skipBtn) {
    skipBtn.addEventListener("click", () => {
      clearInterval(timerInterval);
      timerInterval = null;
      timerArea.classList.remove("visible");
      showCompleteSet();
    });
  }

  adjustBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const delta = parseInt(btn.dataset.delta);
      timerSeconds = Math.max(30, Math.min(600, timerSeconds + delta));
      updateTimerDisplay(countdown);
    });
  });
}

function startCountdown(el) {
  updateTimerDisplay(el);
  timerInterval = setInterval(() => {
    timerSeconds--;
    if (timerSeconds <= 0) {
      clearInterval(timerInterval);
      timerInterval = null;
      if (el) el.classList.add("urgent");
      if (navigator.vibrate) navigator.vibrate(200);
    }
    updateTimerDisplay(el);
  }, 1000);
}

function updateTimerDisplay(el) {
  if (!el) return;
  const min = Math.floor(timerSeconds / 60);
  const sec = timerSeconds % 60;
  el.textContent = `${min}:${sec.toString().padStart(2, "0")}`;
}

function showCompleteSet() {
  const toast = document.querySelector(".toast");
  if (toast) {
    toast.textContent = "组已完成";
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 2000);
  }
}

// Modal / Action Sheet
function initModals() {
  document.querySelectorAll("[data-modal]").forEach((trigger) => {
    trigger.addEventListener("click", () => {
      const id = trigger.dataset.modal;
      const modal = document.getElementById(id);
      if (modal) modal.classList.add("show");
    });
  });
  document.querySelectorAll(".modal-overlay").forEach((overlay) => {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) overlay.classList.remove("show");
    });
  });
}

// Accordion (exercise cards)
function initAccordion() {
  document.querySelectorAll("[data-toggle]").forEach((trigger) => {
    trigger.addEventListener("click", () => {
      const target = document.getElementById(trigger.dataset.toggle);
      if (target) target.classList.toggle("hidden");
    });
  });
}

// Toast
function showToast(message, duration = 3000) {
  let toast = document.querySelector(".toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast";
    document.querySelector(".app-container").appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), duration);
}

// Navigation helper
function navigateTo(page) {
  location.href = page;
}

// Exercise card interactions
function completeSet(exerciseId) {
  const card = document.getElementById(exerciseId);
  if (!card) return;

  // Show timer
  const timerArea = document.querySelector(".timer-area");
  if (timerArea) {
    timerSeconds = 180;
    timerArea.classList.add("visible");
    const countdown = timerArea.querySelector(".timer-countdown");
    if (countdown) countdown.classList.remove("urgent");
    startCountdown(countdown);
  }
}

function completeExercise(exerciseId) {
  const card = document.getElementById(exerciseId);
  if (card) {
    card.classList.remove("active");
    card.classList.add("completed");
    const checkMark = card.querySelector(".check-icon");
    if (checkMark) checkMark.classList.remove("hidden");
  }
}
