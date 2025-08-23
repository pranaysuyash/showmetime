/* TimeLab Pomodoro Timer Module */
(() => {
  "use strict";

  let pomodoroState = {
    isRunning: false,
    isPaused: false,
    currentPhase: 'work', // 'work', 'shortBreak', 'longBreak'
    timeLeft: 25 * 60, // 25 minutes in seconds
    completedPomodoros: 0,
    timerId: null,
    settings: {
      workDuration: 25,
      shortBreakDuration: 5,
      longBreakDuration: 15,
      pomodorosUntilLongBreak: 4,
      autoStart: false,
      soundEnabled: true
    }
  };

  function startPomodoro() {
    const gameArea = document.getElementById('gameArea');
    if (!gameArea) return;
    
    gameArea.classList.add('active');
    gameArea.innerHTML = `
      <div class="pomodoro-timer">
        <h4>🍅 Pomodoro Timer</h4>
        
        <div class="pomodoro-main">
          <div class="timer-display">
            <div class="phase-indicator">
              <span id="currentPhase">Work Time</span>
              <div id="pomodoroCounter">Pomodoro #1</div>
            </div>
            
            <div class="time-circle">
              <svg class="progress-ring" width="200" height="200">
                <circle class="progress-ring-background" cx="100" cy="100" r="90"></circle>
                <circle class="progress-ring-progress" cx="100" cy="100" r="90" id="progressCircle"></circle>
              </svg>
              <div class="time-text" id="timeDisplay">25:00</div>
            </div>
            
            <div class="timer-controls">
              <button id="startPauseBtn" class="timer-btn primary">Start</button>
              <button id="resetBtn" class="timer-btn secondary">Reset</button>
              <button id="skipBtn" class="timer-btn secondary">Skip</button>
            </div>
          </div>
          
          <div class="pomodoro-stats">
            <div class="stat-item">
              <div class="stat-value" id="completedCount">0</div>
              <div class="stat-label">Completed</div>
            </div>
            <div class="stat-item">
              <div class="stat-value" id="totalTime">0h</div>
              <div class="stat-label">Focus Time</div>
            </div>
            <div class="stat-item">
              <div class="stat-value" id="currentStreak">0</div>
              <div class="stat-label">Streak</div>
            </div>
          </div>
        </div>

        <div class="pomodoro-tabs">
          <button class="tab-btn active" data-tab="timer">Timer</button>
          <button class="tab-btn" data-tab="settings">Settings</button>
          <button class="tab-btn" data-tab="tasks">Tasks</button>
        </div>

        <div id="timerTab" class="pomodoro-tab active">
          <div class="phase-progress">
            <div class="progress-step" data-phase="work">
              <div class="step-circle">1</div>
              <div class="step-label">Work</div>
            </div>
            <div class="progress-step" data-phase="break">
              <div class="step-circle">2</div>
              <div class="step-label">Break</div>
            </div>
            <div class="progress-step" data-phase="work">
              <div class="step-circle">3</div>
              <div class="step-label">Work</div>
            </div>
            <div class="progress-step" data-phase="break">
              <div class="step-circle">4</div>
              <div class="step-label">Break</div>
            </div>
            <div class="progress-step" data-phase="longBreak">
              <div class="step-circle">🏆</div>
              <div class="step-label">Long Break</div>
            </div>
          </div>
        </div>

        <div id="settingsTab" class="pomodoro-tab">
          <div class="settings-section">
            <h5>Timer Duration</h5>
            <div class="setting-item">
              <label>Work Duration (minutes):</label>
              <input type="number" id="workDuration" min="1" max="60" value="25">
            </div>
            <div class="setting-item">
              <label>Short Break (minutes):</label>
              <input type="number" id="shortBreakDuration" min="1" max="30" value="5">
            </div>
            <div class="setting-item">
              <label>Long Break (minutes):</label>
              <input type="number" id="longBreakDuration" min="1" max="60" value="15">
            </div>
            <div class="setting-item">
              <label>Pomodoros until Long Break:</label>
              <input type="number" id="pomodorosUntilLongBreak" min="2" max="8" value="4">
            </div>
          </div>
          
          <div class="settings-section">
            <h5>Preferences</h5>
            <div class="setting-item">
              <label>
                <input type="checkbox" id="autoStart" checked>
                Auto-start next session
              </label>
            </div>
            <div class="setting-item">
              <label>
                <input type="checkbox" id="soundEnabled" checked>
                Sound notifications
              </label>
            </div>
          </div>
          
          <button onclick="PomodoroTimer.saveSettings()" class="timer-btn primary">Save Settings</button>
        </div>

        <div id="tasksTab" class="pomodoro-tab">
          <div class="task-input">
            <input type="text" id="newTask" placeholder="What are you working on?" maxlength="100">
            <button onclick="PomodoroTimer.addTask()" class="timer-btn primary">Add</button>
          </div>
          
          <div class="task-list" id="taskList">
            <div class="task-item example">
              <span class="task-text">Study for math exam</span>
              <div class="task-pomodoros">
                <span class="completed-pomodoros">2</span> / 4
              </div>
              <button class="task-remove" onclick="PomodoroTimer.removeTask(0)">×</button>
            </div>
          </div>
        </div>

        <div class="pomodoro-controls">
          <button onclick="TimeLabGames.endGame()" class="timer-btn secondary">Close</button>
        </div>
      </div>
    `;

    initializePomodoroTimer();
  }

  function initializePomodoroTimer() {
    setupEventListeners();
    updateDisplay();
    initializeTabs();
    loadTasks();
    updateStats();
  }

  function setupEventListeners() {
    const startPauseBtn = document.getElementById('startPauseBtn');
    const resetBtn = document.getElementById('resetBtn');
    const skipBtn = document.getElementById('skipBtn');
    
    if (startPauseBtn) {
      startPauseBtn.addEventListener('click', toggleTimer);
    }
    if (resetBtn) {
      resetBtn.addEventListener('click', resetTimer);
    }
    if (skipBtn) {
      skipBtn.addEventListener('click', skipPhase);
    }

    // Settings inputs
    ['workDuration', 'shortBreakDuration', 'longBreakDuration', 'pomodorosUntilLongBreak'].forEach(id => {
      const input = document.getElementById(id);
      if (input) {
        input.value = pomodoroState.settings[id];
        input.addEventListener('change', () => {
          pomodoroState.settings[id] = parseInt(input.value);
        });
      }
    });

    ['autoStart', 'soundEnabled'].forEach(id => {
      const input = document.getElementById(id);
      if (input) {
        input.checked = pomodoroState.settings[id];
        input.addEventListener('change', () => {
          pomodoroState.settings[id] = input.checked;
        });
      }
    });

    // Task input enter key
    const newTaskInput = document.getElementById('newTask');
    if (newTaskInput) {
      newTaskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          PomodoroTimer.addTask();
        }
      });
    }
  }

  function initializeTabs() {
    const tabBtns = document.querySelectorAll('.pomodoro-timer .tab-btn');
    const tabContents = document.querySelectorAll('.pomodoro-tab');
    
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        tabContents.forEach(t => t.classList.remove('active'));
        
        btn.classList.add('active');
        const tabId = btn.dataset.tab + 'Tab';
        document.getElementById(tabId)?.classList.add('active');
      });
    });
  }

  function toggleTimer() {
    const btn = document.getElementById('startPauseBtn');
    if (!btn) return;

    if (!pomodoroState.isRunning) {
      startTimer();
      btn.textContent = 'Pause';
      btn.classList.add('pause');
    } else {
      pauseTimer();
      btn.textContent = pomodoroState.isPaused ? 'Resume' : 'Pause';
      btn.classList.toggle('pause');
    }
  }

  function startTimer() {
    pomodoroState.isRunning = true;
    pomodoroState.isPaused = false;
    
    pomodoroState.timerId = setInterval(() => {
      pomodoroState.timeLeft--;
      updateDisplay();
      
      if (pomodoroState.timeLeft <= 0) {
        completePhase();
      }
    }, 1000);
  }

  function pauseTimer() {
    if (pomodoroState.timerId) {
      clearInterval(pomodoroState.timerId);
      pomodoroState.timerId = null;
    }
    pomodoroState.isPaused = !pomodoroState.isPaused;
    pomodoroState.isRunning = pomodoroState.isPaused;
  }

  function resetTimer() {
    if (pomodoroState.timerId) {
      clearInterval(pomodoroState.timerId);
      pomodoroState.timerId = null;
    }
    
    pomodoroState.isRunning = false;
    pomodoroState.isPaused = false;
    pomodoroState.timeLeft = getPhasesDuration() * 60;
    
    const btn = document.getElementById('startPauseBtn');
    if (btn) {
      btn.textContent = 'Start';
      btn.classList.remove('pause');
    }
    
    updateDisplay();
  }

  function skipPhase() {
    if (pomodoroState.timerId) {
      clearInterval(pomodoroState.timerId);
      pomodoroState.timerId = null;
    }
    
    completePhase();
  }

  function completePhase() {
    // Play sound if enabled
    if (pomodoroState.settings.soundEnabled) {
      playNotificationSound();
    }
    
    // Update completed count
    if (pomodoroState.currentPhase === 'work') {
      pomodoroState.completedPomodoros++;
    }
    
    // Move to next phase
    moveToNextPhase();
    
    // Auto-start if enabled
    if (pomodoroState.settings.autoStart) {
      setTimeout(() => startTimer(), 1000);
    } else {
      pomodoroState.isRunning = false;
      const btn = document.getElementById('startPauseBtn');
      if (btn) {
        btn.textContent = 'Start';
        btn.classList.remove('pause');
      }
    }
    
    updateStats();
  }

  function moveToNextPhase() {
    const completedInCycle = pomodoroState.completedPomodoros % pomodoroState.settings.pomodorosUntilLongBreak;
    
    if (pomodoroState.currentPhase === 'work') {
      if (completedInCycle === 0) {
        pomodoroState.currentPhase = 'longBreak';
      } else {
        pomodoroState.currentPhase = 'shortBreak';
      }
    } else {
      pomodoroState.currentPhase = 'work';
    }
    
    pomodoroState.timeLeft = getPhasesDuration() * 60;
    updateDisplay();
  }

  function getPhasesDuration() {
    switch (pomodoroState.currentPhase) {
      case 'work': return pomodoroState.settings.workDuration;
      case 'shortBreak': return pomodoroState.settings.shortBreakDuration;
      case 'longBreak': return pomodoroState.settings.longBreakDuration;
      default: return 25;
    }
  }

  function updateDisplay() {
    const minutes = Math.floor(pomodoroState.timeLeft / 60);
    const seconds = pomodoroState.timeLeft % 60;
    const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    const timeDisplay = document.getElementById('timeDisplay');
    if (timeDisplay) {
      timeDisplay.textContent = timeString;
    }
    
    // Update phase indicator
    const phaseEl = document.getElementById('currentPhase');
    if (phaseEl) {
      const phaseNames = {
        'work': 'Work Time',
        'shortBreak': 'Short Break',
        'longBreak': 'Long Break'
      };
      phaseEl.textContent = phaseNames[pomodoroState.currentPhase];
    }
    
    // Update pomodoro counter
    const counterEl = document.getElementById('pomodoroCounter');
    if (counterEl) {
      counterEl.textContent = `Pomodoro #${pomodoroState.completedPomodoros + 1}`;
    }
    
    // Update progress ring
    updateProgressRing();
    
    // Update document title
    document.title = `${timeString} - ${pomodoroState.currentPhase === 'work' ? '🍅' : '☕'} TimeLab`;
  }

  function updateProgressRing() {
    const circle = document.getElementById('progressCircle');
    if (!circle) return;
    
    const totalDuration = getPhasesDuration() * 60;
    const progress = ((totalDuration - pomodoroState.timeLeft) / totalDuration) * 100;
    
    const circumference = 2 * Math.PI * 90;
    const strokeDashoffset = circumference - (progress / 100) * circumference;
    
    circle.style.strokeDasharray = circumference;
    circle.style.strokeDashoffset = strokeDashoffset;
  }

  function updateStats() {
    const completedEl = document.getElementById('completedCount');
    if (completedEl) {
      completedEl.textContent = pomodoroState.completedPomodoros;
    }
    
    const totalTimeEl = document.getElementById('totalTime');
    if (totalTimeEl) {
      const totalMinutes = pomodoroState.completedPomodoros * pomodoroState.settings.workDuration;
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      totalTimeEl.textContent = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
    }
    
    const streakEl = document.getElementById('currentStreak');
    if (streakEl) {
      streakEl.textContent = pomodoroState.completedPomodoros % pomodoroState.settings.pomodorosUntilLongBreak;
    }
  }

  function playNotificationSound() {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (e) {
      console.log('Audio not supported');
    }
  }

  function loadTasks() {
    try {
      const savedTasks = localStorage.getItem('pomodoroTasks');
      if (savedTasks) {
        const tasks = JSON.parse(savedTasks);
        renderTasks(tasks);
      }
    } catch (e) {
      console.log('Could not load tasks');
    }
  }

  function saveTasks(tasks) {
    try {
      localStorage.setItem('pomodoroTasks', JSON.stringify(tasks));
    } catch (e) {
      console.log('Could not save tasks');
    }
  }

  function renderTasks(tasks) {
    const taskList = document.getElementById('taskList');
    if (!taskList) return;
    
    taskList.innerHTML = tasks.map((task, index) => `
      <div class="task-item">
        <span class="task-text">${task.text}</span>
        <div class="task-pomodoros">
          <span class="completed-pomodoros">${task.completed}</span> / ${task.estimated}
        </div>
        <button class="task-remove" onclick="PomodoroTimer.removeTask(${index})">×</button>
      </div>
    `).join('');
  }

  // Public API
  const PomodoroTimer = {
    addTask() {
      const input = document.getElementById('newTask');
      if (!input || !input.value.trim()) return;
      
      const tasks = JSON.parse(localStorage.getItem('pomodoroTasks') || '[]');
      tasks.push({
        text: input.value.trim(),
        estimated: 1,
        completed: 0
      });
      
      saveTasks(tasks);
      renderTasks(tasks);
      input.value = '';
    },

    removeTask(index) {
      const tasks = JSON.parse(localStorage.getItem('pomodoroTasks') || '[]');
      tasks.splice(index, 1);
      saveTasks(tasks);
      renderTasks(tasks);
    },

    saveSettings() {
      // Settings are already saved in real-time
      alert('Settings saved!');
    }
  };

  // Expose to global scope
  window.PomodoroTimer = PomodoroTimer;
  window.TimeLabPomodoro = {
    startPomodoro
  };

})();