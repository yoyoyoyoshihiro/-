const timer = {
    work: 25,
    shortBreak: 5,
    longBreak: 15,
    longBreakInterval: 4,
    sessions: 0,
};

let interval;
let isPaused = true;
let remainingTime = {
    minutes: timer.work,
    seconds: 0,
};

const minutesSpan = document.getElementById('minutes');
const secondsSpan = document.getElementById('seconds');
const startButton = document.getElementById('start');
const pauseButton = document.getElementById('pause');
const resetButton = document.getElementById('reset');
const cycleCountSpan = document.getElementById('cycle-count');
const currentModeSpan = document.getElementById('current-mode');

document.addEventListener('DOMContentLoaded', () => {
    updateDisplay();
});

startButton.addEventListener('click', () => {
    if (isPaused) {
        isPaused = false;
        interval = setInterval(updateTimer, 1000);
    }
});

pauseButton.addEventListener('click', () => {
    isPaused = true;
    clearInterval(interval);
});

resetButton.addEventListener('click', () => {
    isPaused = true;
    clearInterval(interval);
    timer.sessions = 0;
    switchMode('work');
});


function updateTimer() {
    if (isPaused) return;

    if (remainingTime.seconds > 0) {
        remainingTime.seconds--;
    } else if (remainingTime.minutes > 0) {
        remainingTime.minutes--;
        remainingTime.seconds = 59;
    } else {
        switchTimerMode();
    }

    updateDisplay();
}

function updateDisplay() {
    minutesSpan.textContent = String(remainingTime.minutes).padStart(2, '0');
    secondsSpan.textContent = String(remainingTime.seconds).padStart(2, '0');
    cycleCountSpan.textContent = `${timer.sessions % timer.longBreakInterval}/4`;
}

function switchTimerMode() {
    timer.sessions++;

    if (timer.sessions % timer.longBreakInterval === 0) {
        switchMode('longBreak');
    } else if (timer.sessions % 2 === 0) {
        switchMode('work');
    } else {
        switchMode('shortBreak');
    }
}

function switchMode(mode) {
     if (mode === 'work') {
        remainingTime.minutes = timer.work;
        currentModeSpan.textContent = '作業';
    } else if (mode === 'shortBreak') {
        remainingTime.minutes = timer.shortBreak;
        currentModeSpan.textContent = '短い休憩';
    } else if (mode === 'longBreak') {
        remainingTime.minutes = timer.longBreak;
        currentModeSpan.textContent = '長い休憩';
        timer.sessions = 0; // Reset sessions after a long break
    }
    remainingTime.seconds = 0;
    updateDisplay();
} 