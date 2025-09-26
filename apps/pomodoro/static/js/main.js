let timerInterval = null;
let remainingSeconds = 0;
let isWork = true;
let currentCycle = 0;
let totalCycles = 4;
let workMinutes = 25;
let breakMinutes = 5;
let longBreakMinutes = 15;
let isSoundEnabled = true;

// DOM Elements
const startBtn = document.getElementById("startPomodoro");
const pauseBtn = document.getElementById("pausePomodoro");
const resetBtn = document.getElementById("resetPomodoro");
const soundToggle = document.getElementById("soundToggle");
const form = document.getElementById("pomodoroForm");
const display = document.getElementById("timerDisplay");
const currentPhase = document.getElementById("currentPhase");
const currentCycleDisplay = document.getElementById("currentCycle");
const totalCyclesDisplay = document.getElementById("totalCycles");

// Load settings from localStorage
function loadSettings() {
  const saved = localStorage.getItem("pomodoroSettings");
  if (saved) {
    const s = JSON.parse(saved);
    totalCycles = s.cycles || 4;
    workMinutes = s.pomodoro_length || 25;
    breakMinutes = s.break_time || 5;
    longBreakMinutes = s.long_break || 15;
  }
  document.getElementById("cycles").value = totalCycles;
  document.getElementById("pomodoro_length").value = workMinutes;
  document.getElementById("break_time").value = breakMinutes;
  document.getElementById("long_break").value = longBreakMinutes;
}

// Save settings to localStorage
function saveSettings() {
  const settings = {
    cycles: parseInt(document.getElementById("cycles").value) || 4,
    pomodoro_length:
      parseInt(document.getElementById("pomodoro_length").value) || 25,
    break_time: parseInt(document.getElementById("break_time").value) || 5,
    long_break: parseInt(document.getElementById("long_break").value) || 15,
  };
  localStorage.setItem("pomodoroSettings", JSON.stringify(settings));
}

// Format time as MM:SS
function formatTime(seconds) {
  const mins = String(Math.floor(seconds / 60)).padStart(2, "0");
  const secs = String(seconds % 60).padStart(2, "0");
  return `${mins}:${secs}`;
}

// Update phase display with color
function updatePhaseDisplay() {
  let phaseText = "Ready";
  let phaseType = "ready";

  if (timerInterval) {
    if (isWork) {
      phaseText = "Work";
      phaseType = "work";
    } else {
      phaseText = currentCycle % totalCycles === 0 ? "Long Break" : "Break";
      phaseType = currentCycle % totalCycles === 0 ? "long-break" : "break";
    }
  }

  currentPhase.textContent = phaseText;
  currentPhase.className =
    "font-medium " +
    (phaseType === "work"
      ? "text-red-500"
      : phaseType === "break"
        ? "text-green-500"
        : phaseType === "long-break"
          ? "text-blue-500"
          : "text-gray-500");

  // Update timer color
  display.className =
    "text-4xl font-extrabold transition-all duration-300 " +
    (phaseType === "work"
      ? "text-red-500"
      : phaseType === "break"
        ? "text-green-500"
        : phaseType === "long-break"
          ? "text-blue-500"
          : "text-gray-900 dark:text-gray-100");
}

// Update all displays
function updateDisplay() {
  display.textContent = formatTime(remainingSeconds);
  currentCycleDisplay.textContent = currentCycle;
  totalCyclesDisplay.textContent = totalCycles;
  updatePhaseDisplay();
}

// Play notification sound
function playSound() {
  if (!isSoundEnabled) return;
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  oscillator.frequency.value = 600;
  oscillator.type = "sine";
  gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(
    0.01,
    audioContext.currentTime + 0.5,
  );
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.5);
}

// Start timer
function startTimer() {
  if (timerInterval) return;
  timerInterval = setInterval(() => {
    if (remainingSeconds <= 0) {
      playSound();
      if (isWork) {
        currentCycle++;
        if (currentCycle > totalCycles) {
          // All cycles done!
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
          });
          resetTimer();
          return;
        }
        remainingSeconds =
          (currentCycle % totalCycles === 0 ? longBreakMinutes : breakMinutes) *
          60;
      } else {
        remainingSeconds = workMinutes * 60;
      }
      isWork = !isWork;
    } else {
      remainingSeconds--;
    }
    updateDisplay();
  }, 1000);
}

// Pause timer
function pauseTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

// Reset timer
function resetTimer() {
  pauseTimer();
  currentCycle = 0;
  isWork = true;
  remainingSeconds = workMinutes * 60;
  updateDisplay();
  form.style.display = "block";
}

// Toggle sound
function toggleSound() {
  isSoundEnabled = !isSoundEnabled;
  const icon = soundToggle.querySelector("i");
  if (isSoundEnabled) {
    icon.className = "fa-solid fa-volume-high";
    soundToggle.innerHTML = '<i class="fa-solid fa-volume-high"></i> Sound On';
  } else {
    icon.className = "fa-solid fa-volume-xmark";
    soundToggle.innerHTML =
      '<i class="fa-solid fa-volume-xmark"></i> Sound Off';
  }
}

// Initialize
loadSettings();
remainingSeconds = workMinutes * 60;
updateDisplay();

// Event Listeners
startBtn.addEventListener("click", (e) => {
  e.preventDefault();
  saveSettings();
  totalCycles = parseInt(document.getElementById("cycles").value) || 4;
  workMinutes =
    parseInt(document.getElementById("pomodoro_length").value) || 25;
  breakMinutes = parseInt(document.getElementById("break_time").value) || 5;
  longBreakMinutes =
    parseInt(document.getElementById("long_break").value) || 15;
  currentCycle = 0;
  isWork = true;
  remainingSeconds = workMinutes * 60;
  form.style.display = "none";
  updateDisplay();
  startTimer();
});

pauseBtn.addEventListener("click", pauseTimer);
resetBtn.addEventListener("click", resetTimer);
soundToggle.addEventListener("click", toggleSound);

// Keyboard shortcuts
document.addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    e.preventDefault();
    if (timerInterval) {
      pauseTimer();
    } else {
      if (form.style.display === "none") {
        startTimer();
      } else {
        startBtn.click();
      }
    }
  }
});
