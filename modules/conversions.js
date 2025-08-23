/* TimeLab Conversion Tools Module */
(() => {
  "use strict";

  // Time conversion utilities
  const TimeConverters = {
    // Convert 12-hour to 24-hour format
    to24Hour(hour, minute, period) {
      let h24 = parseInt(hour);
      const m = parseInt(minute);
      
      if (period === 'AM') {
        if (h24 === 12) h24 = 0;
      } else if (period === 'PM') {
        if (h24 !== 12) h24 += 12;
      }
      
      return {
        hour: h24,
        minute: m,
        formatted: `${h24.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
      };
    },

    // Convert 24-hour to 12-hour format
    to12Hour(hour24, minute) {
      const h = parseInt(hour24);
      const m = parseInt(minute);
      
      let hour12 = h;
      let period = 'AM';
      
      if (h === 0) {
        hour12 = 12;
      } else if (h === 12) {
        period = 'PM';
      } else if (h > 12) {
        hour12 = h - 12;
        period = 'PM';
      }
      
      return {
        hour: hour12,
        minute: m,
        period: period,
        formatted: `${hour12}:${m.toString().padStart(2, '0')} ${period}`
      };
    },

    // Convert timezone
    convertTimezone(hour, minute, fromTZ, toTZ) {
      const timezones = {
        'UTC': 0, 'GMT': 0,
        'EST': -5, 'CST': -6, 'MST': -7, 'PST': -8,
        'EDT': -4, 'CDT': -5, 'MDT': -6, 'PDT': -7,
        'CET': 1, 'EET': 2, 'JST': 9, 'AEST': 10,
        'IST': 5.5, 'CST_China': 8, 'KST': 9
      };
      
      const fromOffset = timezones[fromTZ] || 0;
      const toOffset = timezones[toTZ] || 0;
      const diffHours = toOffset - fromOffset;
      
      let newHour = hour + Math.floor(diffHours);
      let newMinute = minute + (diffHours % 1) * 60;
      
      // Handle minute overflow
      if (newMinute >= 60) {
        newHour += 1;
        newMinute -= 60;
      } else if (newMinute < 0) {
        newHour -= 1;
        newMinute += 60;
      }
      
      // Handle hour overflow/underflow
      if (newHour >= 24) {
        newHour -= 24;
      } else if (newHour < 0) {
        newHour += 24;
      }
      
      return {
        hour: newHour,
        minute: newMinute,
        formatted: `${newHour.toString().padStart(2, '0')}:${newMinute.toString().padStart(2, '0')}`
      };
    }
  };

  // Main conversion interface
  function startConversions() {
    const gameArea = document.getElementById('gameArea');
    if (!gameArea) return;
    
    gameArea.classList.add('active');
    gameArea.innerHTML = `
      <div class="conversions-tool">
        <h4>🔄 Time Converter</h4>
        <div class="converter-tabs">
          <button class="tab-btn active" data-tab="format">12/24 Hour</button>
          <button class="tab-btn" data-tab="timezone">Timezone</button>
          <button class="tab-btn" data-tab="calculator">Time Calculator</button>
        </div>

        <!-- Format Converter -->
        <div id="formatTab" class="converter-tab active">
          <div class="converter-section">
            <h5>12-Hour to 24-Hour</h5>
            <div class="time-input-group">
              <input type="number" id="hour12" min="1" max="12" value="3" placeholder="Hour">
              <span>:</span>
              <input type="number" id="minute12" min="0" max="59" value="30" placeholder="Min">
              <select id="period12">
                <option value="AM">AM</option>
                <option value="PM" selected>PM</option>
              </select>
              <button onclick="TimeConverters.convertFormat()" class="convert-btn">→</button>
              <div id="result24" class="result">15:30</div>
            </div>
          </div>
          
          <div class="converter-section">
            <h5>24-Hour to 12-Hour</h5>
            <div class="time-input-group">
              <input type="number" id="hour24" min="0" max="23" value="15" placeholder="Hour">
              <span>:</span>
              <input type="number" id="minute24" min="0" max="59" value="30" placeholder="Min">
              <button onclick="TimeConverters.convertFormat()" class="convert-btn">→</button>
              <div id="result12" class="result">3:30 PM</div>
            </div>
          </div>
        </div>

        <!-- Timezone Converter -->
        <div id="timezoneTab" class="converter-tab">
          <div class="converter-section">
            <h5>Convert Between Timezones</h5>
            <div class="timezone-input-group">
              <div class="tz-input">
                <label>From:</label>
                <input type="number" id="tzHour" min="0" max="23" value="12" placeholder="Hour">
                <span>:</span>
                <input type="number" id="tzMinute" min="0" max="59" value="0" placeholder="Min">
                <select id="fromTZ">
                  <option value="EST">EST (Eastern)</option>
                  <option value="CST">CST (Central)</option>
                  <option value="MST">MST (Mountain)</option>
                  <option value="PST">PST (Pacific)</option>
                  <option value="UTC">UTC</option>
                  <option value="GMT">GMT</option>
                  <option value="CET">CET (Central Europe)</option>
                  <option value="JST">JST (Japan)</option>
                  <option value="AEST">AEST (Australia)</option>
                  <option value="IST">IST (India)</option>
                </select>
              </div>
              
              <button onclick="TimeConverters.convertTZ()" class="convert-btn">→</button>
              
              <div class="tz-input">
                <label>To:</label>
                <select id="toTZ">
                  <option value="EST">EST (Eastern)</option>
                  <option value="CST">CST (Central)</option>
                  <option value="MST">MST (Mountain)</option>
                  <option value="PST" selected>PST (Pacific)</option>
                  <option value="UTC">UTC</option>
                  <option value="GMT">GMT</option>
                  <option value="CET">CET (Central Europe)</option>
                  <option value="JST">JST (Japan)</option>
                  <option value="AEST">AEST (Australia)</option>
                  <option value="IST">IST (India)</option>
                </select>
                <div id="tzResult" class="result">09:00</div>
              </div>
            </div>
          </div>

          <div class="world-clocks">
            <h5>World Clocks</h5>
            <div class="world-clock-grid" id="worldClocks">
              <!-- Populated by JavaScript -->
            </div>
          </div>
        </div>

        <!-- Time Calculator -->
        <div id="calculatorTab" class="converter-tab">
          <div class="converter-section">
            <h5>Add/Subtract Time</h5>
            <div class="calc-input-group">
              <div class="time-calc-row">
                <label>Start Time:</label>
                <input type="number" id="calcStartHour" min="0" max="23" value="9" placeholder="Hour">
                <span>:</span>
                <input type="number" id="calcStartMin" min="0" max="59" value="15" placeholder="Min">
              </div>
              
              <div class="time-calc-row">
                <select id="calcOperation">
                  <option value="add">Add</option>
                  <option value="subtract">Subtract</option>
                </select>
                <input type="number" id="calcHours" min="0" max="23" value="2" placeholder="Hours">
                <span>hours</span>
                <input type="number" id="calcMinutes" min="0" max="59" value="30" placeholder="Minutes">
                <span>minutes</span>
              </div>
              
              <button onclick="TimeConverters.calculateTime()" class="convert-btn">Calculate</button>
              <div id="calcResult" class="result">11:45</div>
            </div>
          </div>

          <div class="converter-section">
            <h5>Time Duration</h5>
            <div class="duration-input-group">
              <div class="time-calc-row">
                <label>Start:</label>
                <input type="number" id="durStartHour" min="0" max="23" value="9" placeholder="Hour">
                <span>:</span>
                <input type="number" id="durStartMin" min="0" max="59" value="0" placeholder="Min">
              </div>
              
              <div class="time-calc-row">
                <label>End:</label>
                <input type="number" id="durEndHour" min="0" max="23" value="17" placeholder="Hour">
                <span>:</span>
                <input type="number" id="durEndMin" min="0" max="59" value="30" placeholder="Min">
              </div>
              
              <button onclick="TimeConverters.calculateDuration()" class="convert-btn">Calculate</button>
              <div id="durResult" class="result">8 hours 30 minutes</div>
            </div>
          </div>
        </div>

        <div class="converter-controls">
          <button onclick="TimeLabGames.endGame()" class="game-btn secondary">Close</button>
        </div>
      </div>
    `;

    // Initialize tabs
    initializeTabs();
    updateWorldClocks();
    
    // Set up auto-conversion
    setupAutoConversion();
  }

  function initializeTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.converter-tab');
    
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        // Remove active class from all tabs
        tabBtns.forEach(b => b.classList.remove('active'));
        tabContents.forEach(t => t.classList.remove('active'));
        
        // Add active class to clicked tab
        btn.classList.add('active');
        const tabId = btn.dataset.tab + 'Tab';
        document.getElementById(tabId)?.classList.add('active');
      });
    });
  }

  function setupAutoConversion() {
    // Auto-convert as user types
    const inputs = document.querySelectorAll('input[type="number"], select');
    inputs.forEach(input => {
      input.addEventListener('input', () => {
        setTimeout(() => {
          if (input.closest('#formatTab')) {
            TimeConverters.convertFormat();
          } else if (input.closest('#timezoneTab')) {
            TimeConverters.convertTZ();
          }
        }, 300);
      });
    });
  }

  function updateWorldClocks() {
    const worldClocksContainer = document.getElementById('worldClocks');
    if (!worldClocksContainer) return;
    
    const cities = [
      { name: 'New York', tz: 'EST', flag: '🇺🇸' },
      { name: 'Los Angeles', tz: 'PST', flag: '🇺🇸' },
      { name: 'London', tz: 'GMT', flag: '🇬🇧' },
      { name: 'Paris', tz: 'CET', flag: '🇫🇷' },
      { name: 'Tokyo', tz: 'JST', flag: '🇯🇵' },
      { name: 'Sydney', tz: 'AEST', flag: '🇦🇺' },
      { name: 'Mumbai', tz: 'IST', flag: '🇮🇳' },
      { name: 'Beijing', tz: 'CST_China', flag: '🇨🇳' },
      { name: 'Dubai', tz: 'UTC', flag: '🇦🇪' },
      { name: 'São Paulo', tz: 'UTC', flag: '🇧🇷' }
    ];
    
    const now = new Date();
    
    worldClocksContainer.innerHTML = cities.map(city => {
      const cityTime = new Date();
      // Simple timezone offset calculation for demo
      const offsets = {
        'EST': -5, 'PST': -8, 'GMT': 0, 'CET': 1, 'JST': 9, 
        'AEST': 10, 'IST': 5.5, 'CST_China': 8, 'UTC': 4
      };
      
      const offset = offsets[city.tz] || 0;
      cityTime.setHours(cityTime.getUTCHours() + offset);
      
      const timeStr = cityTime.toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      
      const isDayTime = cityTime.getHours() >= 6 && cityTime.getHours() < 20;
      
      return `
        <div class="world-clock-item ${isDayTime ? 'day' : 'night'}">
          <div class="city-header">
            <span class="city-flag">${city.flag}</span>
            <span class="city-name">${city.name}</span>
          </div>
          <div class="city-time">${timeStr}</div>
          <div class="city-period">${isDayTime ? '☀️ Day' : '🌙 Night'}</div>
        </div>
      `;
    }).join('');
    
    // Update every minute
    setTimeout(updateWorldClocks, 60000);
  }

  // Extend TimeConverters with UI functions
  TimeConverters.convertFormat = function() {
    // 12 to 24 hour
    const hour12 = document.getElementById('hour12')?.value || 3;
    const minute12 = document.getElementById('minute12')?.value || 30;
    const period12 = document.getElementById('period12')?.value || 'PM';
    const result24 = this.to24Hour(hour12, minute12, period12);
    const result24El = document.getElementById('result24');
    if (result24El) result24El.textContent = result24.formatted;
    
    // 24 to 12 hour
    const hour24 = document.getElementById('hour24')?.value || 15;
    const minute24 = document.getElementById('minute24')?.value || 30;
    const result12 = this.to12Hour(hour24, minute24);
    const result12El = document.getElementById('result12');
    if (result12El) result12El.textContent = result12.formatted;
  };

  TimeConverters.convertTZ = function() {
    const hour = parseInt(document.getElementById('tzHour')?.value || 12);
    const minute = parseInt(document.getElementById('tzMinute')?.value || 0);
    const fromTZ = document.getElementById('fromTZ')?.value || 'EST';
    const toTZ = document.getElementById('toTZ')?.value || 'PST';
    
    const result = this.convertTimezone(hour, minute, fromTZ, toTZ);
    const resultEl = document.getElementById('tzResult');
    if (resultEl) resultEl.textContent = result.formatted;
  };

  TimeConverters.calculateTime = function() {
    const startHour = parseInt(document.getElementById('calcStartHour')?.value || 9);
    const startMin = parseInt(document.getElementById('calcStartMin')?.value || 15);
    const operation = document.getElementById('calcOperation')?.value || 'add';
    const hours = parseInt(document.getElementById('calcHours')?.value || 2);
    const minutes = parseInt(document.getElementById('calcMinutes')?.value || 30);
    
    let resultHour = startHour;
    let resultMin = startMin;
    
    if (operation === 'add') {
      resultMin += minutes;
      resultHour += hours + Math.floor(resultMin / 60);
      resultMin %= 60;
    } else {
      resultMin -= minutes;
      resultHour -= hours;
      if (resultMin < 0) {
        resultMin += 60;
        resultHour -= 1;
      }
    }
    
    // Handle day overflow
    if (resultHour >= 24) resultHour %= 24;
    if (resultHour < 0) resultHour += 24;
    
    const resultEl = document.getElementById('calcResult');
    if (resultEl) {
      resultEl.textContent = `${resultHour.toString().padStart(2, '0')}:${resultMin.toString().padStart(2, '0')}`;
    }
  };

  TimeConverters.calculateDuration = function() {
    const startHour = parseInt(document.getElementById('durStartHour')?.value || 9);
    const startMin = parseInt(document.getElementById('durStartMin')?.value || 0);
    const endHour = parseInt(document.getElementById('durEndHour')?.value || 17);
    const endMin = parseInt(document.getElementById('durEndMin')?.value || 30);
    
    let totalMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);
    if (totalMinutes < 0) totalMinutes += 24 * 60; // Handle next day
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    const resultEl = document.getElementById('durResult');
    if (resultEl) {
      resultEl.textContent = `${hours} hours ${minutes} minutes`;
    }
  };

  // Unix timestamp converter interface
  function startTimestamp() {
    const gameArea = document.getElementById('gameArea');
    if (!gameArea) return;
    
    gameArea.classList.add('active');
    gameArea.innerHTML = `
      <div class="timestamp-tool">
        <h4>⏱️ Unix Timestamp Converter</h4>
        
        <div class="converter-section">
          <h5>Current Timestamp</h5>
          <div class="current-timestamp">
            <div class="timestamp-display">
              <span id="currentTimestamp">${Math.floor(Date.now() / 1000)}</span>
              <button onclick="copyToClipboard('currentTimestamp')" class="copy-btn" title="Copy to clipboard">📋</button>
            </div>
            <div class="timestamp-human">${new Date().toLocaleString()}</div>
          </div>
        </div>

        <div class="converter-section">
          <h5>Unix to Human Readable</h5>
          <div class="timestamp-converter">
            <input type="number" id="unixInput" placeholder="1693430400" value="${Math.floor(Date.now() / 1000)}">
            <button onclick="convertFromUnix()" class="convert-btn">Convert</button>
          </div>
          <div id="unixResult" class="timestamp-results">
            <div class="result-item">
              <label>Local Time:</label>
              <span id="localTime">${new Date().toLocaleString()}</span>
              <button onclick="copyToClipboard('localTime')" class="copy-btn">📋</button>
            </div>
            <div class="result-item">
              <label>UTC:</label>
              <span id="utcTime">${new Date().toISOString()}</span>
              <button onclick="copyToClipboard('utcTime')" class="copy-btn">📋</button>
            </div>
            <div class="result-item">
              <label>ISO 8601:</label>
              <span id="isoTime">${new Date().toISOString()}</span>
              <button onclick="copyToClipboard('isoTime')" class="copy-btn">📋</button>
            </div>
          </div>
        </div>

        <div class="converter-section">
          <h5>Human Readable to Unix</h5>
          <div class="date-converter">
            <input type="datetime-local" id="dateInput" value="${new Date().toISOString().slice(0, 16)}">
            <button onclick="convertToUnix()" class="convert-btn">Convert</button>
          </div>
          <div id="dateResult" class="timestamp-results">
            <div class="result-item">
              <label>Unix Timestamp:</label>
              <span id="resultTimestamp">${Math.floor(Date.now() / 1000)}</span>
              <button onclick="copyToClipboard('resultTimestamp')" class="copy-btn">📋</button>
            </div>
          </div>
        </div>

        <div class="converter-section">
          <h5>Quick Presets</h5>
          <div class="preset-buttons">
            <button onclick="setPreset('now')" class="preset-btn">Now</button>
            <button onclick="setPreset('hour')" class="preset-btn">1 Hour Ago</button>
            <button onclick="setPreset('day')" class="preset-btn">1 Day Ago</button>
            <button onclick="setPreset('week')" class="preset-btn">1 Week Ago</button>
            <button onclick="setPreset('month')" class="preset-btn">1 Month Ago</button>
            <button onclick="setPreset('year')" class="preset-btn">1 Year Ago</button>
          </div>
        </div>

        <div class="converter-controls">
          <button onclick="TimeLabGames.endGame()" class="game-btn secondary">Close</button>
        </div>
      </div>
    `;

    // Start live timestamp update
    updateCurrentTimestamp();
    setInterval(updateCurrentTimestamp, 1000);
  }

  function updateCurrentTimestamp() {
    const el = document.getElementById('currentTimestamp');
    if (el) {
      el.textContent = Math.floor(Date.now() / 1000);
    }
  }

  function convertFromUnix() {
    const timestamp = document.getElementById('unixInput').value;
    if (!timestamp) return;

    const date = new Date(parseInt(timestamp) * 1000);
    
    document.getElementById('localTime').textContent = date.toLocaleString();
    document.getElementById('utcTime').textContent = date.toUTCString();
    document.getElementById('isoTime').textContent = date.toISOString();
  }

  function convertToUnix() {
    const dateStr = document.getElementById('dateInput').value;
    if (!dateStr) return;

    const timestamp = Math.floor(new Date(dateStr).getTime() / 1000);
    document.getElementById('resultTimestamp').textContent = timestamp;
  }

  function setPreset(type) {
    const now = new Date();
    let targetDate;

    switch (type) {
      case 'now':
        targetDate = now;
        break;
      case 'hour':
        targetDate = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case 'day':
        targetDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        targetDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        targetDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        break;
      case 'year':
        targetDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        break;
      default:
        targetDate = now;
    }

    const timestamp = Math.floor(targetDate.getTime() / 1000);
    document.getElementById('unixInput').value = timestamp;
    convertFromUnix();
  }

  function copyToClipboard(elementId) {
    const element = document.getElementById(elementId);
    if (!element) return;

    navigator.clipboard.writeText(element.textContent).then(() => {
      // Show brief success feedback
      const originalText = element.textContent;
      element.textContent = 'Copied!';
      element.style.color = '#00d68f';
      setTimeout(() => {
        element.textContent = originalText;
        element.style.color = '';
      }, 1500);
    }).catch(() => {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = element.textContent;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    });
  }

  // Expose functions globally
  window.convertFromUnix = convertFromUnix;
  window.convertToUnix = convertToUnix;
  window.setPreset = setPreset;
  window.copyToClipboard = copyToClipboard;

  // Expose to global scope
  window.TimeConverters = TimeConverters;
  window.TimeLabConversions = {
    startConversions,
    startTimestamp
  };

})();