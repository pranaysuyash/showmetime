/* TimeLab Games Module - Extracted for performance */
(() => {
  "use strict";

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
        gameArea.innerHTML = `
          <h4>Race the Clock</h4>
          <p>Set the clock as fast as you can!</p>
          <button onclick="alert('Game coming soon!')">Start Race</button>
        `;
        break;
      case 'detective':
        gameArea.innerHTML = `
          <h4>Time Detective</h4>
          <p>Solve time mysteries!</p>
          <button onclick="alert('Game coming soon!')">Start Detective</button>
        `;
        break;
      case 'memory':
        gameArea.innerHTML = `
          <h4>Clock Memory</h4>
          <p>Remember the times!</p>
          <button onclick="alert('Game coming soon!')">Start Memory</button>
        `;
        break;
    }
  }

  // Expose to global scope
  window.TimeLabGames = {
    startGame
  };

})();