let timerInterval;
let remainingSeconds = 0;
let isWork = true;
let currentCycle = 0;
let totalCycles = 0;
let workMinutes = 25;
let breakMinutes = 5;
let longBreakMinutes = 15;

const startBtn = document.getElementById("startPomodoro");
const pauseBtn = document.getElementById("pausePomodoro");
const resetBtn = document.getElementById("resetPomodoro");

const form = document.getElementById("pomodoroForm");
const display = document.getElementById("timerDisplay");
const currentPhase = document.getElementById("currentPhase");
const currentCycleDisplay = document.getElementById("currentCycle");
const totalCyclesDisplay = document.getElementById("totalCycles");

function formatTime(seconds) {
  const mins = String(Math.floor(seconds / 60)).padStart(2, "0");
  const secs = String(seconds % 60).padStart(2, "0");
  return `${mins}:${secs}`;
}

function updateDisplay() {
  display.textContent = formatTime(remainingSeconds);
  currentPhase.textContent = isWork
    ? "Work"
    : currentCycle % totalCycles === 0
      ? "Long Break"
      : "Break";
  currentCycleDisplay.textContent = currentCycle;
  totalCyclesDisplay.textContent = totalCycles;
}

function saveSession() {
  fetch("/pomodoro/update", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      cycles: totalCycles,
      pomodoro_length: workMinutes,
      break_time: breakMinutes,
      long_break: longBreakMinutes,
      timer_state: timerInterval ? "running" : "paused",
      remaining_seconds: remainingSeconds,
    }),
  });
}

function startTimer() {
  if (!timerInterval) {
    timerInterval = setInterval(() => {
      updateDisplay();
      if (remainingSeconds <= 0) {
        if (isWork) {
          currentCycle++;
          remainingSeconds =
            (currentCycle % totalCycles === 0
              ? longBreakMinutes
              : breakMinutes) * 60;
        } else {
          remainingSeconds = workMinutes * 60;
        }
        isWork = !isWork;
      } else {
        remainingSeconds--;
      }
      saveSession();
    }, 1000);
  }
}

function pauseTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
  saveSession();
}

function resetTimer() {
  pauseTimer();
  currentCycle = 0;
  isWork = true;
  remainingSeconds = workMinutes * 60;
  updateDisplay();
  form.style.display = "block";
  saveSession();
}

function setPhase(phase) {
  const display = document.getElementById("timerDisplay");

  // reset to base
  display.className =
    "text-4xl font-extrabold transition-all duration-200 text-gray-900 dark:text-gray-100";

  if (phase === "work") {
    display.classList.add("text-blue-500");
  } else if (phase === "break") {
    display.classList.add("text-yellow-400");
  } else if (phase === "long-break") {
    display.classList.add("text-green-400");
  }
}

window.addEventListener("load", () => {
  fetch("/pomodoro/")
    .then((res) => res.json())
    .then((data) => {
      totalCycles = data.cycles || 4;
      workMinutes = data.pomodoro_length || 25;
      breakMinutes = data.break_time || 5;
      longBreakMinutes = data.long_break || 15;
      remainingSeconds = data.remaining_seconds || workMinutes * 60;
      currentCycle = data.current_cycle || 0;
      isWork = data.timer_state === "running";
      updateDisplay();
    })
    .catch((err) => console.log("Failed to load session", err));
});

startBtn.addEventListener("click", (e) => {
  e.preventDefault();
  totalCycles = parseInt(document.getElementById("cycles").value) || 4;
  workMinutes =
    parseInt(document.getElementById("pomodoro_length").value) || 25;
  breakMinutes = parseInt(document.getElementById("break_time").value) || 5;
  longBreakMinutes =
    parseInt(document.getElementById("long_break").value) || 15;

  remainingSeconds = workMinutes * 60;
  currentCycle = 0;
  isWork = true;

  form.style.display = "none";
  updateDisplay();
  startTimer();
});

pauseBtn.addEventListener("click", pauseTimer);
resetBtn.addEventListener("click", resetTimer);
