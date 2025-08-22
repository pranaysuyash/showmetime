/* TimeLab Games Module - Educational Clock Games */
(() => {
  "use strict";

  let currentGameState = null;

  // Game functions
  function startGame(gameType) {
    if (!window.TimeLab) return;
    const { state } = window.TimeLab;
    
    state.games.currentGame = gameType;
    
    const gameArea = document.getElementById('gameArea');
    if (!gameArea) return;
    
    gameArea.classList.add('active');
    
    switch (gameType) {
      case 'race':
        startRaceGame(gameArea);
        break;
      case 'detective':
        startDetectiveGame(gameArea);
        break;
      case 'memory':
        startMemoryGame(gameArea);
        break;
    }
  }

  // Race the Clock Game - Set hands to match target time quickly
  function startRaceGame(gameArea) {
    const targetTime = generateRandomTime();
    let startTime = Date.now();
    let gameCompleted = false;
    
    gameArea.innerHTML = `
      <div class="race-game">
        <h4>Race the Clock</h4>
        <div class="game-instructions">
          <p>Set the clock to show: <strong>${formatTime(targetTime)}</strong></p>
          <p class="timer">Time: <span id="raceTimer">0.0s</span></p>
        </div>
        <div class="game-controls">
          <button id="checkRaceAnswer" class="game-btn">Check Answer</button>
          <button onclick="TimeLabGames.endGame()" class="game-btn secondary">End Game</button>
        </div>
        <div id="raceResult" class="game-result"></div>
      </div>
    `;
    
    // Start timer
    const timerInterval = setInterval(() => {
      if (!gameCompleted) {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        const timerEl = document.getElementById('raceTimer');
        if (timerEl) timerEl.textContent = elapsed + 's';
      } else {
        clearInterval(timerInterval);
      }
    }, 100);
    
    // Check answer button
    document.getElementById('checkRaceAnswer').onclick = () => {
      if (gameCompleted) return;
      
      const currentTime = getCurrentClockTime();
      const isCorrect = timesMatch(currentTime, targetTime);
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      
      gameCompleted = true;
      clearInterval(timerInterval);
      
      const resultEl = document.getElementById('raceResult');
      if (isCorrect) {
        resultEl.innerHTML = `
          <div class="success">
            <h5>🎉 Correct!</h5>
            <p>You set the clock in ${elapsed} seconds!</p>
            <button onclick="TimeLabGames.startGame('race')" class="game-btn">Play Again</button>
          </div>
        `;
      } else {
        resultEl.innerHTML = `
          <div class="error">
            <h5>Not quite right!</h5>
            <p>Target: ${formatTime(targetTime)}</p>
            <p>Your time: ${formatTime(currentTime)}</p>
            <button onclick="TimeLabGames.startGame('race')" class="game-btn">Try Again</button>
          </div>
        `;
      }
    };
    
    currentGameState = { type: 'race', targetTime, timerInterval };
  }

  // Time Detective Game - Identify what time it is from visual clues
  function startDetectiveGame(gameArea) {
    const mysteryTime = generateRandomTime();
    const clues = generateTimeClues(mysteryTime);
    
    gameArea.innerHTML = `
      <div class="detective-game">
        <h4>Time Detective</h4>
        <div class="game-instructions">
          <p>Study these clues and figure out what time it is!</p>
        </div>
        <div class="clues-container">
          ${clues.map(clue => `<div class="clue">${clue}</div>`).join('')}
        </div>
        <div class="detective-answer">
          <label>What time is it?</label>
          <select id="detectiveHour">
            ${Array.from({length: 12}, (_, i) => `<option value="${i + 1}">${i + 1}</option>`).join('')}
          </select>
          <span>:</span>
          <select id="detectiveMinute">
            ${['00', '15', '30', '45'].map(m => `<option value="${m}">${m}</option>`).join('')}
          </select>
        </div>
        <div class="game-controls">
          <button id="checkDetectiveAnswer" class="game-btn">Submit Answer</button>
          <button onclick="TimeLabGames.endGame()" class="game-btn secondary">End Game</button>
        </div>
        <div id="detectiveResult" class="game-result"></div>
      </div>
    `;
    
    document.getElementById('checkDetectiveAnswer').onclick = () => {
      const hour = parseInt(document.getElementById('detectiveHour').value);
      const minute = parseInt(document.getElementById('detectiveMinute').value);
      const guess = { hour, minute };
      
      const isCorrect = timesMatch(guess, mysteryTime);
      const resultEl = document.getElementById('detectiveResult');
      
      if (isCorrect) {
        resultEl.innerHTML = `
          <div class="success">
            <h5>🕵️ Case Solved!</h5>
            <p>You correctly identified ${formatTime(mysteryTime)}!</p>
            <button onclick="TimeLabGames.startGame('detective')" class="game-btn">New Mystery</button>
          </div>
        `;
      } else {
        resultEl.innerHTML = `
          <div class="error">
            <h5>Not quite right!</h5>
            <p>The correct time was ${formatTime(mysteryTime)}</p>
            <p>Your guess: ${formatTime(guess)}</p>
            <button onclick="TimeLabGames.startGame('detective')" class="game-btn">Try Another</button>
          </div>
        `;
      }
    };
    
    currentGameState = { type: 'detective', mysteryTime };
  }

  // Clock Memory Game - Remember and recreate shown times
  function startMemoryGame(gameArea) {
    const sequence = generateTimeSequence(3);
    let currentStep = 0;
    let showingSequence = true;
    
    gameArea.innerHTML = `
      <div class="memory-game">
        <h4>Clock Memory</h4>
        <div class="game-instructions">
          <p id="memoryInstructions">Watch carefully! Memorize this sequence of times...</p>
        </div>
        <div id="memoryDisplay" class="memory-display">
          <div class="memory-time">${formatTime(sequence[0])}</div>
        </div>
        <div id="memoryControls" class="game-controls" style="display: none;">
          <p>Now set the clock to show the times in order:</p>
          <p>Time <span id="memoryStep">1</span> of ${sequence.length}</p>
          <button id="checkMemoryAnswer" class="game-btn">Check This Time</button>
          <button onclick="TimeLabGames.endGame()" class="game-btn secondary">End Game</button>
        </div>
        <div id="memoryResult" class="game-result"></div>
      </div>
    `;
    
    // Show sequence
    let sequenceIndex = 0;
    const showNext = () => {
      if (sequenceIndex < sequence.length) {
        document.getElementById('memoryDisplay').innerHTML = 
          `<div class="memory-time">${formatTime(sequence[sequenceIndex])}</div>`;
        sequenceIndex++;
        setTimeout(showNext, 2000);
      } else {
        // Start the recall phase
        document.getElementById('memoryInstructions').textContent = 
          'Now set the clock to show each time in order:';
        document.getElementById('memoryDisplay').style.display = 'none';
        document.getElementById('memoryControls').style.display = 'block';
        showingSequence = false;
        currentStep = 0;
      }
    };
    
    setTimeout(showNext, 1000);
    
    // Check memory answer
    setTimeout(() => {
      const checkBtn = document.getElementById('checkMemoryAnswer');
      if (checkBtn) {
        checkBtn.onclick = () => {
          if (showingSequence) return;
          
          const currentTime = getCurrentClockTime();
          const targetTime = sequence[currentStep];
          const isCorrect = timesMatch(currentTime, targetTime);
          
          const resultEl = document.getElementById('memoryResult');
          
          if (isCorrect) {
            currentStep++;
            if (currentStep >= sequence.length) {
              resultEl.innerHTML = `
                <div class="success">
                  <h5>🧠 Perfect Memory!</h5>
                  <p>You remembered all ${sequence.length} times correctly!</p>
                  <button onclick="TimeLabGames.startGame('memory')" class="game-btn">Play Again</button>
                </div>
              `;
              document.getElementById('memoryControls').style.display = 'none';
            } else {
              document.getElementById('memoryStep').textContent = currentStep + 1;
              resultEl.innerHTML = `<div class="success">Correct! Next time...</div>`;
              setTimeout(() => resultEl.innerHTML = '', 1500);
            }
          } else {
            resultEl.innerHTML = `
              <div class="error">
                <h5>Not quite right!</h5>
                <p>Time ${currentStep + 1} should be: ${formatTime(targetTime)}</p>
                <p>You set: ${formatTime(currentTime)}</p>
                <button onclick="TimeLabGames.startGame('memory')" class="game-btn">Try Again</button>
              </div>
            `;
            document.getElementById('memoryControls').style.display = 'none';
          }
        };
      }
    }, 100);
    
    currentGameState = { type: 'memory', sequence };
  }

  // Helper functions
  function generateRandomTime() {
    return {
      hour: Math.floor(Math.random() * 12) + 1,
      minute: [0, 15, 30, 45][Math.floor(Math.random() * 4)]
    };
  }
  
  function generateTimeSequence(length) {
    return Array.from({ length }, () => generateRandomTime());
  }
  
  function generateTimeClues(time) {
    const clues = [];
    
    // Hour clues
    if (time.hour <= 6) {
      clues.push("🌅 It's morning time - before noon");
    } else {
      clues.push("🌞 It's later in the day - afternoon");
    }
    
    // Minute clues
    if (time.minute === 0) {
      clues.push("⏰ The minute hand points straight up");
    } else if (time.minute === 15) {
      clues.push("⏰ The minute hand points to the right");
    } else if (time.minute === 30) {
      clues.push("⏰ The minute hand points straight down");
    } else if (time.minute === 45) {
      clues.push("⏰ The minute hand points to the left");
    }
    
    // Additional contextual clues
    const activities = {
      1: "🍳 Breakfast time",
      7: "📚 School starts",
      12: "🍽️ Lunch time",
      3: "🍪 Snack time",
      6: "🍝 Dinner time",
      8: "📖 Bedtime story"
    };
    
    if (activities[time.hour]) {
      clues.push(activities[time.hour]);
    }
    
    return clues;
  }
  
  function getCurrentClockTime() {
    // Get current clock state from TimeLab
    if (!window.TimeLab?.state) return { hour: 12, minute: 0 };
    
    const { hourAngle, minuteAngle } = window.TimeLab.state;
    
    // Convert angles to time
    const hour = Math.round((hourAngle % 360) / 30) || 12;
    const minute = Math.round((minuteAngle % 360) / 6) * 5;
    
    return { hour, minute: minute === 60 ? 0 : minute };
  }
  
  function timesMatch(time1, time2) {
    return time1.hour === time2.hour && time1.minute === time2.minute;
  }
  
  function formatTime(time) {
    const hour = time.hour;
    const minute = time.minute.toString().padStart(2, '0');
    return `${hour}:${minute}`;
  }
  
  function endGame() {
    if (currentGameState?.timerInterval) {
      clearInterval(currentGameState.timerInterval);
    }
    currentGameState = null;
    
    const gameArea = document.getElementById('gameArea');
    if (gameArea) {
      gameArea.classList.remove('active');
      gameArea.innerHTML = '';
    }
    
    if (window.TimeLab?.state) {
      window.TimeLab.state.games.currentGame = null;
    }
  }

  // Expose to global scope
  window.TimeLabGames = {
    startGame,
    endGame
  };

})();