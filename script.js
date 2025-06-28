const timer = {
    work: 25,
    shortBreak: 5,
    longBreak: 15,
    longBreakInterval: 4,
    sessions: 0,
};

let interval;
let isPaused = true;
let isBreak = false;
let remainingTime = {
    minutes: timer.work,
    seconds: 0,
};

// Statistics
let stats = {
    completedSessions: 0,
    totalMinutes: 0,
    todaysSessions: 0,
};

// Settings
let settings = {
    soundEnabled: true,
    workTime: 25,
    shortBreak: 5,
    longBreak: 15,
};

const minutesSpan = document.getElementById('minutes');
const secondsSpan = document.getElementById('seconds');
const startButton = document.getElementById('start');
const pauseButton = document.getElementById('pause');
const resetButton = document.getElementById('reset');
const cycleCountSpan = document.getElementById('cycle-count');
const currentModeSpan = document.getElementById('current-mode');
const completedSessionsSpan = document.getElementById('completed-sessions');
const totalTimeSpan = document.getElementById('total-time');
const progressRing = document.querySelector('.progress-ring');
const progressCircle = document.querySelector('.progress-ring-circle');
const settingsBtn = document.getElementById('settings-btn');
const settingsModal = document.getElementById('settings-modal');
const closeModal = document.querySelector('.close');
const saveSettingsBtn = document.getElementById('save-settings');
const taskInput = document.getElementById('task-input');
const addTaskBtn = document.getElementById('add-task');
const taskList = document.getElementById('task-list');

// Progress ring setup
const radius = 140;
const circumference = 2 * Math.PI * radius;
progressCircle.style.strokeDasharray = `${circumference} ${circumference}`;
progressCircle.style.strokeDashoffset = circumference;

// Audio for notifications
let notificationSound;

document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    loadStats();
    loadTasks();
    updateDisplay();
    updateStats();
    initializeAudio();
    updateProgressRing();
});

startButton.addEventListener('click', () => {
    if (isPaused) {
        isPaused = false;
        interval = setInterval(updateTimer, 1000);
        startButton.innerHTML = '<i class="fas fa-play"></i> 実行中...';
        startButton.disabled = true;
    }
});

pauseButton.addEventListener('click', () => {
    isPaused = true;
    clearInterval(interval);
    startButton.innerHTML = '<i class="fas fa-play"></i> スタート';
    startButton.disabled = false;
});

resetButton.addEventListener('click', () => {
    isPaused = true;
    clearInterval(interval);
    timer.sessions = 0;
    isBreak = false;
    switchMode('work');
    startButton.innerHTML = '<i class="fas fa-play"></i> スタート';
    startButton.disabled = false;
});

function updateTimer() {
    if (isPaused) return;

    if (remainingTime.seconds > 0) {
        remainingTime.seconds--;
    } else if (remainingTime.minutes > 0) {
        remainingTime.minutes--;
        remainingTime.seconds = 59;
    } else {
        completeSession();
    }

    updateDisplay();
    updateProgressRing();
}

function updateDisplay() {
    minutesSpan.textContent = String(remainingTime.minutes).padStart(2, '0');
    secondsSpan.textContent = String(remainingTime.seconds).padStart(2, '0');
    cycleCountSpan.textContent = `${Math.floor(timer.sessions / 2) + 1}/4`;
}

function updateProgressRing() {
    const totalTime = isBreak ? 
        (timer.sessions % timer.longBreakInterval === 0 ? settings.longBreak : settings.shortBreak) : 
        settings.workTime;
    
    const currentTime = remainingTime.minutes + (remainingTime.seconds / 60);
    const progress = (totalTime - currentTime) / totalTime;
    const offset = circumference - (progress * circumference);
    
    progressCircle.style.strokeDashoffset = offset;
    
    // Update colors based on mode
    if (isBreak) {
        progressRing.className = 'progress-ring break';
    } else {
        progressRing.className = 'progress-ring work';
    }
}

function completeSession() {
    timer.sessions++;
    
    if (!isBreak) {
        stats.completedSessions++;
        stats.totalMinutes += settings.workTime;
        stats.todaysSessions++;
    }
    
    // Play notification sound
    if (settings.soundEnabled) {
        playNotificationSound();
    }
    
    // Show browser notification
    showNotification();
    
    // Add pulse animation
    document.querySelector('.timer-display').classList.add('pulse-animation');
    setTimeout(() => {
        document.querySelector('.timer-display').classList.remove('pulse-animation');
    }, 2000);
    
    switchTimerMode();
    updateStats();
    saveStats();
}

function switchTimerMode() {
    if (timer.sessions % timer.longBreakInterval === 0) {
        switchMode('longBreak');
    } else if (timer.sessions % 2 === 0) {
        switchMode('work');
    } else {
        switchMode('shortBreak');
    }
}

function switchMode(mode) {
    isBreak = mode !== 'work';
    
    if (mode === 'work') {
        remainingTime.minutes = settings.workTime;
        currentModeSpan.textContent = '作業時間';
    } else if (mode === 'shortBreak') {
        remainingTime.minutes = settings.shortBreak;
        currentModeSpan.textContent = '短い休憩';
    } else if (mode === 'longBreak') {
        remainingTime.minutes = settings.longBreak;
        currentModeSpan.textContent = '長い休憩';
        timer.sessions = 0; // Reset sessions after a long break
    }
    
    remainingTime.seconds = 0;
    updateDisplay();
    updateProgressRing();
}

function updateStats() {
    completedSessionsSpan.textContent = stats.completedSessions;
    
    const hours = Math.floor(stats.totalMinutes / 60);
    const minutes = stats.totalMinutes % 60;
    totalTimeSpan.textContent = `${hours}h ${minutes}m`;
}

settingsBtn.addEventListener('click', () => {
    settingsModal.style.display = 'block';
    loadSettingsToModal();
});

closeModal.addEventListener('click', () => {
    settingsModal.style.display = 'none';
});

window.addEventListener('click', (event) => {
    if (event.target === settingsModal) {
        settingsModal.style.display = 'none';
    }
});

saveSettingsBtn.addEventListener('click', () => {
    saveSettingsFromModal();
    settingsModal.style.display = 'none';
});

function loadSettingsToModal() {
    document.getElementById('work-time').value = settings.workTime;
    document.getElementById('short-break').value = settings.shortBreak;
    document.getElementById('long-break').value = settings.longBreak;
    document.getElementById('sound-enabled').checked = settings.soundEnabled;
}

function saveSettingsFromModal() {
    settings.workTime = parseInt(document.getElementById('work-time').value);
    settings.shortBreak = parseInt(document.getElementById('short-break').value);
    settings.longBreak = parseInt(document.getElementById('long-break').value);
    settings.soundEnabled = document.getElementById('sound-enabled').checked;
    
    // Update timer object
    timer.work = settings.workTime;
    timer.shortBreak = settings.shortBreak;
    timer.longBreak = settings.longBreak;
    
    // Reset current session if it's a work session
    if (!isBreak) {
        remainingTime.minutes = settings.workTime;
        remainingTime.seconds = 0;
        updateDisplay();
        updateProgressRing();
    }
    
    saveSettings();
}

addTaskBtn.addEventListener('click', addTask);
taskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addTask();
    }
});

function addTask() {
    const taskText = taskInput.value.trim();
    if (taskText === '') return;
    
    const task = {
        id: Date.now(),
        text: taskText,
        completed: false,
        createdAt: new Date().toISOString(),
    };
    
    const tasks = getTasks();
    tasks.push(task);
    saveTasks(tasks);
    
    taskInput.value = '';
    renderTasks();
}

function renderTasks() {
    const tasks = getTasks();
    taskList.innerHTML = '';
    
    tasks.forEach(task => {
        const li = document.createElement('li');
        li.className = `task-item ${task.completed ? 'completed' : ''}`;
        li.innerHTML = `
            <span class="task-text">${task.text}</span>
            <div class="task-actions">
                <button class="task-btn complete" onclick="toggleTask(${task.id})">
                    <i class="fas fa-check"></i>
                </button>
                <button class="task-btn delete" onclick="deleteTask(${task.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        taskList.appendChild(li);
    });
}

function toggleTask(id) {
    const tasks = getTasks();
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        saveTasks(tasks);
        renderTasks();
    }
}

function deleteTask(id) {
    const tasks = getTasks();
    const filteredTasks = tasks.filter(t => t.id !== id);
    saveTasks(filteredTasks);
    renderTasks();
}

function saveSettings() {
    localStorage.setItem('pomodoroSettings', JSON.stringify(settings));
}

function loadSettings() {
    const saved = localStorage.getItem('pomodoroSettings');
    if (saved) {
        settings = { ...settings, ...JSON.parse(saved) };
        timer.work = settings.workTime;
        timer.shortBreak = settings.shortBreak;
        timer.longBreak = settings.longBreak;
    }
}

function saveStats() {
    localStorage.setItem('pomodoroStats', JSON.stringify(stats));
}

function loadStats() {
    const saved = localStorage.getItem('pomodoroStats');
    if (saved) {
        stats = { ...stats, ...JSON.parse(saved) };
    }
}

function saveTasks(tasks) {
    localStorage.setItem('pomodoroTasks', JSON.stringify(tasks));
}

function getTasks() {
    const saved = localStorage.getItem('pomodoroTasks');
    return saved ? JSON.parse(saved) : [];
}

function loadTasks() {
    renderTasks();
}

function initializeAudio() {
    // Create audio context for notification sound
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        notificationSound = createNotificationSound(audioContext);
    } catch (e) {
        console.log('Audio not supported');
    }
}

function createNotificationSound(audioContext) {
    return () => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    };
}

function playNotificationSound() {
    if (notificationSound && settings.soundEnabled) {
        try {
            notificationSound();
        } catch (e) {
            console.log('Could not play notification sound');
        }
    }
}

function showNotification() {
    if ('Notification' in window) {
        if (Notification.permission === 'granted') {
            const mode = isBreak ? '休憩時間' : '作業時間';
            new Notification('ポモドーロタイマー', {
                body: `${mode}が完了しました！`,
                icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🍅</text></svg>'
            });
        } else if (Notification.permission !== 'denied') {
            Notification.requestPermission();
        }
    }
}

if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
}

document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT') return;
    
    switch (e.key) {
        case ' ':
            e.preventDefault();
            if (isPaused) {
                startButton.click();
            } else {
                pauseButton.click();
            }
            break;
        case 'r':
            e.preventDefault();
            resetButton.click();
            break;
        case 's':
            e.preventDefault();
            settingsBtn.click();
            break;
    }
});

window.toggleTask = toggleTask;
window.deleteTask = deleteTask; 