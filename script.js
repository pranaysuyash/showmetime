/* TimeLab — Interactive Analog Clock (Fixed & Consolidated Version) */
(() => {
  "use strict";

  // State management
  const state = {
    mode: "normal",
    showDigital: true,
    showSeconds: true, 
    hourCycle: 24,
    theme: "blue",
    timeZone: "auto",

    interactive: {
      showHour: true,
      showMinute: true,
      showSecond: false,
      showNumbers: true,
      allowDrag: true,
      dragMode: "independent",
      spotlight: true,
      time: { h: 10, m: 0, s: 0 }
    },

    learning: {
      currentLesson: null,
      currentStep: 0,
      progress: {},
      achievements: []
    },

    quiz: {
      score: 0,
      streak: 0,
      bestScore: 0,
      difficulty: "easy",
      type: "read",
      currentQuestion: null,
      isActive: false
    },

    games: {
      raceTime: null,
      detectiveScore: 0,
      memoryScore: 0,
      currentGame: null
    }
  };

  // SVG namespace and animation variables
  const svgNS = "http://www.w3.org/2000/svg";
  let lastTickTs = null;
  
  // DOM elements
  let clockSvg = null;
  let digitalEl = null;
  let timezoneEl = null;
  let components = {};
  let spot = {};
  let learningSystem = null;

  // Drag state
  const dragState = {
    isDragging: false,
    element: null,
    type: null
  };


  // Initialize
  function init() {
    // Get DOM elements
    clockSvg = document.getElementById("clockSvg");
    digitalEl = document.getElementById("digital");
    timezoneEl = document.getElementById("timezoneLabel");

    if (!clockSvg) {
      console.error("Clock SVG element not found");
      return;
    }

    // Initialize learning system
    if (window.TimeLearningSystem) {
      learningSystem = new window.TimeLearningSystem();
      console.log('TimeLab learning system initialized');
    } else {
      console.warn('TimeLearningSystem not found - learning features disabled');
    }

    // Load saved state
    loadState();
    
    // Build clock
    buildClock();
    
    // Wire up UI
    wireUI();
    
    // Start animation
    startAnimation();
    
    // Update UI
    updatePanelsForMode();
    updateTimezoneLabel();

    // Apply saved state to UI controls and initial visibility
    applyStateToUI();
    renderThemeSwatches();
    applyTheme(state.theme);
    updateLearningProgress();
    updateQuizStats();

    // Set initial data-mode attribute for CSS selectors
    document.body.setAttribute('data-mode', state.mode);

    // Ensure digital display visibility matches state
    if (digitalEl) {
      digitalEl.style.display = state.showDigital ? 'block' : 'none';
    }
  }

  // Build clock SVG
  function buildClock() {
    clockSvg.innerHTML = "";

    // Create defs for gradients and filters
    const defs = createSVGElement("defs");
    
    // Clock face gradient
    const faceGradient = createGradient("clockFaceGradient", [
      { offset: "0%", color: "rgba(79, 127, 255, 0.1)" },
      { offset: "50%", color: "rgba(20, 24, 41, 0.8)" },
      { offset: "100%", color: "rgba(10, 14, 39, 0.95)" }
    ]);
    defs.appendChild(faceGradient);
    
    // Glow filter
    const glowFilter = createFilter("glow");
    defs.appendChild(glowFilter);
    
    clockSvg.appendChild(defs);

    // Clock face
    const face = createSVGElement("circle", {
      cx: 200, cy: 200, r: 188,
      fill: "url(#clockFaceGradient)",
      stroke: "#4f7fff",
      "stroke-width": 2,
      class: "clock-face"
    });
    clockSvg.appendChild(face);
    
    // Decorative rings
    const outerRing = createSVGElement("circle", {
      cx: 200, cy: 200, r: 194,
      fill: "none",
      stroke: "#00d4ff",
      "stroke-width": 1,
      opacity: 0.3,
      "stroke-dasharray": "2 4"
    });
    clockSvg.appendChild(outerRing);

    // Hour and minute markers - ALL positions including behind numbers
    const ticks = createSVGElement("g", { id: "ticks" });
    for (let i = 0; i < 60; i++) {
      const angle = (i / 60) * 2 * Math.PI;
      const isHour = i % 5 === 0; // Every 5 minutes (including hour positions)
      const rOuter = 180;
      const rInner = isHour ? 162 : 172;
      
      const x1 = 200 + rInner * Math.sin(angle);
      const y1 = 200 - rInner * Math.cos(angle);
      const x2 = 200 + rOuter * Math.sin(angle);
      const y2 = 200 - rOuter * Math.cos(angle);
      
      const tick = createSVGElement("line", {
        x1, y1, x2, y2,
        stroke: isHour ? "#ffffff" : "rgba(255,255,255,0.3)",
        "stroke-width": isHour ? 3 : 1,
        "stroke-linecap": "round",
        opacity: isHour ? 1 : 0.5
      });
      ticks.appendChild(tick);
    }
    clockSvg.appendChild(ticks);

    // Add specific tick marks at NUMBER positions (12, 1, 2, 3, etc.)
    const numberTicks = createSVGElement("g", { id: "number-ticks" });
    for (let hour = 1; hour <= 12; hour++) {
      const angle = (hour / 12) * 2 * Math.PI;
      const rOuter = 185;
      const rInner = 160;
      
      const x1 = 200 + rInner * Math.sin(angle);
      const y1 = 200 - rInner * Math.cos(angle);
      const x2 = 200 + rOuter * Math.sin(angle);
      const y2 = 200 - rOuter * Math.cos(angle);
      
      const tick = createSVGElement("line", {
        x1, y1, x2, y2,
        stroke: "#ffffff",
        "stroke-width": 4,
        "stroke-linecap": "round",
        class: "number-tick"
      });
      numberTicks.appendChild(tick);
    }
    clockSvg.appendChild(numberTicks);


    // Numbers
    const numbers = createSVGElement("g", { id: "numbers" });
    for (let i = 1; i <= 12; i++) {
      const angle = (i / 12) * 2 * Math.PI;
      const r = 140; // slightly larger radius for better symmetry
      const x = 200 + r * Math.sin(angle);
      const y = 200 - r * Math.cos(angle) + 4; // subtle vertical optical correction
      
      const text = createSVGElement("text", {
        x, y,
        "text-anchor": "middle",
        "dominant-baseline": "middle",
        "font-size": 26,
        "font-weight": 700,
        fill: "#ffffff",
        class: "clock-number",
        "data-number": i
      });
      text.textContent = String(i);
      numbers.appendChild(text);
      
      // Static position indicators removed - using dynamic indicators only
    }
    clockSvg.appendChild(numbers);

    // Clock hands group
    const hands = createSVGElement("g", { id: "hands" });
    
    // Hour hand
    const hourHand = createSVGElement("line", {
      x1: 200, y1: 200, x2: 200, y2: 120,
      stroke: "white",
      "stroke-width": 8,
      "stroke-linecap": "round",
      class: "clock-hand hour-hand"
    });
    hands.appendChild(hourHand);
    
    // Hour hand touch target (invisible but larger area for touch)
    const hourHandTouch = createSVGElement("line", {
      x1: 200, y1: 200, x2: 200, y2: 120,
      stroke: "transparent",
      "stroke-width": 35,
      "stroke-linecap": "round",
      class: "clock-hand-touch hour-hand-touch",
      style: "pointer-events: stroke; cursor: grab;"
    });
    hands.appendChild(hourHandTouch);
    
    // Minute hand
    const minuteHand = createSVGElement("line", {
      x1: 200, y1: 200, x2: 200, y2: 90,
      stroke: "#4f7fff",
      "stroke-width": 6,
      "stroke-linecap": "round",
      class: "clock-hand minute-hand"
    });
    hands.appendChild(minuteHand);
    
    // Minute hand touch target (invisible but larger area for touch)
    const minuteHandTouch = createSVGElement("line", {
      x1: 200, y1: 200, x2: 200, y2: 90,
      stroke: "transparent",
      "stroke-width": 25,
      "stroke-linecap": "round",
      class: "clock-hand-touch minute-hand-touch",
      style: "pointer-events: stroke; cursor: grab;"
    });
    hands.appendChild(minuteHandTouch);
    
    // Second hand
    const secondHand = createSVGElement("line", {
      x1: 200, y1: 200, x2: 200, y2: 70,
      stroke: "#ff5c7c",
      "stroke-width": 2,
      "stroke-linecap": "round",
      opacity: 0.9,
      class: "clock-hand second-hand"
    });
    hands.appendChild(secondHand);
    
    // Second hand touch target (invisible but larger area for touch)
    const secondHandTouch = createSVGElement("line", {
      x1: 200, y1: 200, x2: 200, y2: 70,
      stroke: "transparent",
      "stroke-width": 15,
      "stroke-linecap": "round",
      class: "clock-hand-touch second-hand-touch",
      style: "pointer-events: stroke; cursor: grab;"
    });
    hands.appendChild(secondHandTouch);
    
    // Center cap
    const cap = createSVGElement("circle", {
      cx: 200, cy: 200, r: 10,
      fill: "#4f7fff",
      stroke: "white",
      "stroke-width": 2
    });
    hands.appendChild(cap);
    
    clockSvg.appendChild(hands);

    // Spotlight group (for interactive mode)
    const spotGroup = createSVGElement("g", {
      id: "spotlight",
      opacity: 0
    });
    
    const spotCircle = createSVGElement("circle", {
      cx: 200, cy: 200, r: 12,
      fill: "none",
      stroke: "#00d4ff",
      "stroke-width": 3,
      "stroke-dasharray": "4 4",
      class: "spotlight-circle"
    });
    spotGroup.appendChild(spotCircle);
    
    clockSvg.appendChild(spotGroup);

    // Interactive indicator
    const interactiveIndicator = createSVGElement("circle", {
      cx: 200, cy: 200, r: 210,
      fill: "none",
      stroke: "#00d4ff",
      "stroke-width": 2,
      "stroke-dasharray": "8 12",
      opacity: 0,
      id: "interactive-indicator"
    });
    clockSvg.appendChild(interactiveIndicator);

    // Store component references
    components = {
      numbers,
      hourHand,
      minuteHand,
      secondHand,
      interactiveIndicator,
      positionIndicators: numbers.querySelectorAll('.position-indicator'),
      hourHandTouch,
      minuteHandTouch,
      secondHandTouch
    };

    spot = {
      group: spotGroup,
      circle: spotCircle
    };

    // Enable dragging for interactive mode
    enableHandDragging(hourHand, "h");
    enableHandDragging(minuteHand, "m");
    enableHandDragging(secondHand, "s");
  }

  // Create SVG element helper
  function createSVGElement(tag, attrs = {}) {
    const element = document.createElementNS(svgNS, tag);
    for (const [key, value] of Object.entries(attrs)) {
      element.setAttribute(key, String(value));
    }
    return element;
  }

  // Create gradient helper
  function createGradient(id, stops) {
    const gradient = createSVGElement("radialGradient", {
      id,
      cx: "50%",
      cy: "50%",
      r: "85%"
    });
    
    stops.forEach(stop => {
      const stopEl = createSVGElement("stop", {
        offset: stop.offset,
        "stop-color": stop.color
      });
      gradient.appendChild(stopEl);
    });
    
    return gradient;
  }

  // Create filter helper
  function createFilter(id) {
    const filter = createSVGElement("filter", { id });
    const blur = createSVGElement("feGaussianBlur", {
      stdDeviation: "4",
      result: "coloredBlur"
    });
    const merge = createSVGElement("feMerge");
    const mergeNode1 = createSVGElement("feMergeNode", { in: "coloredBlur" });
    const mergeNode2 = createSVGElement("feMergeNode", { in: "SourceGraphic" });
    
    merge.appendChild(mergeNode1);
    merge.appendChild(mergeNode2);
    filter.appendChild(blur);
    filter.appendChild(merge);
    
    return filter;
  }

  // Enable hand dragging
  function enableHandDragging(element, type) {
    element.addEventListener("mousedown", startDrag);
    element.addEventListener("touchstart", startDrag, { passive: false });
    
    // Also enable dragging on the touch target elements
    const touchTarget = element.nextElementSibling;
    if (touchTarget && touchTarget.classList.contains('clock-hand-touch')) {
      touchTarget.addEventListener("mousedown", startDrag);
      touchTarget.addEventListener("touchstart", startDrag, { passive: false });
    }
    
    function startDrag(e) {
      if (state.mode !== "interactive" || !state.interactive.allowDrag) return;
      
      // Prevent dragging hidden hands
      if (element.style.visibility === 'hidden') return;
      
      // Check specific hand visibility settings
      if (type === 'hour' && !state.interactive.showHour) return;
      if (type === 'minute' && !state.interactive.showMinute) return;
      if (type === 'second' && !state.interactive.showSecond) return;
      
      // Prevent other hands from being dragged when hands overlap
      if (dragState.isDragging) return;
      
      e.preventDefault();
      dragState.isDragging = true;
      dragState.element = element;
      dragState.type = type;
      
      element.setAttribute("data-dragging", "true");
      // Also mark touch target as dragging if it exists
      if (touchTarget) {
        touchTarget.setAttribute("data-dragging", "true");
      }
      clockSvg.style.cursor = "grabbing";
    }
  }

  // Handle drag move
  function handleDragMove(e) {
    if (!dragState.isDragging) return;
    
    // Prevent default only if we're actually dragging to avoid scroll interference
    if (e.cancelable) e.preventDefault();
    
    // Use requestAnimationFrame for smoother dragging
    requestAnimationFrame(() => {
      const point = getPointFromEvent(e);
      const angle = getAngleFromPoint(point);
      
      if (dragState.type === "h") {
        updateHourFromAngle(angle);
      } else if (dragState.type === "m") {
        updateMinuteFromAngle(angle);
      } else if (dragState.type === "s") {
        updateSecondFromAngle(angle);
      }
      
      // In snapped mode, redraw all hands to maintain proper relationships
      // In independent mode, only update the dragged hand
      if (state.interactive.dragMode === "snapped") {
        drawInteractiveTime();
      } else {
        // Independent mode - only update the specific hand being dragged, no linkage
        if (dragState.type === "h") {
          const hourAngle = angle; // Use raw angle, not calculated from time
          setRotation(components.hourHand, hourAngle);
        } else if (dragState.type === "m") {
          const minuteAngle = angle; // Use raw angle, not calculated from time
          setRotation(components.minuteHand, minuteAngle);
        } else if (dragState.type === "s") {
          const secondAngle = angle; // Use raw angle, not calculated from time
          setRotation(components.secondHand, secondAngle);
        }
      }
      
      if (state.interactive.spotlight) {
        updateSpotlight(angle);
      }
    });
  }

  // Handle drag end
  function handleDragEnd() {
    if (!dragState.isDragging) return;
    
    // Add snap feedback in snapped mode
    if (state.interactive.dragMode === "snapped" && dragState.element) {
      // Add a subtle animation to indicate snapping
      dragState.element.classList.add('snap-pulse');
      setTimeout(() => {
        dragState.element.classList.remove('snap-pulse');
      }, 300);
    }
    
    if (dragState.element) {
      dragState.element.removeAttribute("data-dragging");
      // Also remove from touch target if it exists
      const touchTarget = dragState.element.nextElementSibling;
      if (touchTarget && touchTarget.classList.contains('clock-hand-touch')) {
        touchTarget.removeAttribute("data-dragging");
      }
    }
    
    dragState.isDragging = false;
    dragState.element = null;
    dragState.type = null;
    
    clockSvg.style.cursor = "";
    hideSpotlight();
  }

  // Get point from event
  function getPointFromEvent(e) {
    const rect = clockSvg.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    const x = ((clientX - rect.left) / rect.width) * 400;
    const y = ((clientY - rect.top) / rect.height) * 400;
    
    return { x, y };
  }

  // Get angle from point
  function getAngleFromPoint(point) {
    const dx = point.x - 200;
    const dy = point.y - 200;
    const angle = Math.atan2(dx, -dy) * (180 / Math.PI);
    return (angle + 360) % 360;
  }

  // Update hour from angle
  function updateHourFromAngle(angle) {
    const isPM = state.interactive.time.h >= 12;
    
    if (state.interactive.dragMode === "snapped") {
      let hour = Math.round(angle / 30) % 12;
      if (hour === 0) hour = 12; // Handle 12 o'clock position
      state.interactive.time.h = hour + (isPM && hour !== 12 ? 12 : 0);
      if (state.interactive.time.h === 24) state.interactive.time.h = 12;
    } else {
      // In independent mode, calculate continuous hour position
      let hour = (angle / 30) % 12;
      if (hour < 0.1 && angle > 350) hour = 12; // Smooth 12 o'clock handling
      state.interactive.time.h = hour + (isPM && hour < 12 ? 12 : 0);
    }
  }

  // Update minute from angle  
  function updateMinuteFromAngle(angle) {
    const oldMinute = state.interactive.time.m;
    
    if (state.interactive.dragMode === "snapped") {
      let minute = Math.round(angle / 6) % 60;
      if (minute < 0) minute += 60; // Handle negative wrap
      
      // Check for hour boundary crossing in snapped mode
      if (oldMinute > 45 && minute < 15) {
        // Crossed from 59 to 0 (forward) - advance hour
        state.interactive.time.h = (state.interactive.time.h + 1) % 24;
      } else if (oldMinute < 15 && minute > 45) {
        // Crossed from 0 to 59 (backward) - go back hour
        state.interactive.time.h = (state.interactive.time.h - 1 + 24) % 24;
      }
      
      state.interactive.time.m = minute;
    } else {
      let minute = (angle / 6) % 60;
      if (minute < 0) minute += 60; // Handle negative wrap
      state.interactive.time.m = minute;
    }
  }

  // Update second from angle
  function updateSecondFromAngle(angle) {
    let second = Math.round(angle / 6) % 60;
    if (second < 0) second += 60; // Handle negative wrap
    state.interactive.time.s = second;
  }

  // Update spotlight
  function updateSpotlight(angle) {
    const radius = 130;
    const rad = (angle * Math.PI) / 180;
    const x = 200 + radius * Math.sin(rad);
    const y = 200 - radius * Math.cos(rad);
    
    spot.circle.setAttribute("cx", String(x));
    spot.circle.setAttribute("cy", String(y));
    spot.group.setAttribute("opacity", "0.8");
  }

  // Hide spotlight
  function hideSpotlight() {
    spot.group.setAttribute("opacity", "0");
  }

  // Wire up UI
  function wireUI() {
    // Mode buttons
    const modeBtns = document.querySelectorAll('[data-mode]');
    modeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        state.mode = btn.dataset.mode;
        modeBtns.forEach(b => b.classList.toggle('segmented--active', b === btn));
        
        // Set data-mode attribute for CSS selectors
        document.body.setAttribute('data-mode', state.mode);
        
        updatePanelsForMode();
        
        // Show/hide keyboard help for interactive mode
        const keyboardHelp = document.getElementById('keyboardHelp');
        if (keyboardHelp) {
          if (state.mode === 'interactive') {
            keyboardHelp.classList.add('show');
            setTimeout(() => keyboardHelp.classList.remove('show'), 5000);
          } else {
            keyboardHelp.classList.remove('show');
          }
        }
      });
    });

    // Controls toggle
    const toggleControls = document.getElementById('toggleControls');
    const controlsPanel = document.getElementById('controlsPanel');
    const closeControls = document.getElementById('closeControls');
    
    toggleControls?.addEventListener('click', () => {
      controlsPanel?.classList.toggle('open');
    });
    
    closeControls?.addEventListener('click', () => {
      controlsPanel?.classList.remove('open');
    });

    // Settings
    const toggleDigital = document.getElementById('toggleDigital');
    const toggleSeconds = document.getElementById('toggleSeconds');
    const hourCycleBtns = document.querySelectorAll('[data-hour-cycle]');
    const timezoneSelect = document.getElementById('timezoneSelect');
    // theme swatches rendered separately
    
    toggleDigital?.addEventListener('change', () => {
      state.showDigital = toggleDigital.checked;
      if (digitalEl) digitalEl.style.display = state.showDigital ? 'block' : 'none';
      saveState();
    });
    
    toggleSeconds?.addEventListener('change', () => {
      state.showSeconds = toggleSeconds.checked;
      updateHandVisibility();
      saveState();
    });
    
    hourCycleBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        state.hourCycle = Number(btn.dataset.hourCycle);
        hourCycleBtns.forEach(b => b.classList.toggle('segmented--active', b === btn));
        saveState();
      });
    });
    
    timezoneSelect?.addEventListener('change', () => {
      state.timeZone = timezoneSelect.value;
      updateTimezoneLabel();
      saveState();
    });
    
    // Theme swatches
    renderThemeSwatches();

    // Keyboard accessibility for interactive mode
    document.addEventListener('keydown', (e) => {
      if (state.mode !== 'interactive') return;
      
      const step = e.shiftKey ? 1 : 5; // Fine control with Shift
      let changed = false;
      
      switch(e.key) {
        case 'ArrowUp':
        case 'ArrowRight':
          if (e.ctrlKey || e.metaKey) {
            // Hour hand control
            state.interactive.time.h = (state.interactive.time.h + step/5) % 12;
            changed = true;
          } else {
            // Minute hand control  
            state.interactive.time.m = (state.interactive.time.m + step) % 60;
            changed = true;
          }
          break;
        case 'ArrowDown':
        case 'ArrowLeft':
          if (e.ctrlKey || e.metaKey) {
            // Hour hand control
            state.interactive.time.h = (state.interactive.time.h - step/5 + 12) % 12;
            changed = true;
          } else {
            // Minute hand control
            state.interactive.time.m = (state.interactive.time.m - step + 60) % 60;
            changed = true;
          }
          break;
        case 'h':
        case 'H':
          // Quick hour adjustment
          if (!e.ctrlKey && !e.metaKey) {
            state.interactive.time.h = (state.interactive.time.h + 1) % 12;
            changed = true;
          }
          break;
        case 'm':
        case 'M':
          // Quick minute adjustment
          if (!e.ctrlKey && !e.metaKey) {
            state.interactive.time.m = (state.interactive.time.m + 15) % 60;
            changed = true;
          }
          break;
      }
      
      if (changed) {
        e.preventDefault();
        renderInteractiveTime();
        showFeedback('⌨️', `Time: ${Math.floor(state.interactive.time.h)}:${String(Math.floor(state.interactive.time.m)).padStart(2, '0')}`);
      }
    });

    // Interactive controls
    const iShowHour = document.getElementById('iShowHour');
    const iShowMinute = document.getElementById('iShowMinute');
    const iShowSecond = document.getElementById('iShowSecond');
    const iShowNumbers = document.getElementById('iShowNumbers');
    const iAllowDrag = document.getElementById('iAllowDrag');
    const iSpotlight = document.getElementById('iSpotlight');
    const dragModeBtns = document.querySelectorAll('[data-drag-mode]');
    const btnSetNow = document.getElementById('btnSetNow');
    const btnRandomTime = document.getElementById('btnRandomTime');
    const btnReadTime = document.getElementById('btnReadTime');
    const btnReadTimeFloating = document.getElementById('btnReadTimeFloating');
    
    iShowHour?.addEventListener('change', () => {
      state.interactive.showHour = iShowHour.checked;
      updateHandVisibility();
      saveState();
    });
    
    iShowMinute?.addEventListener('change', () => {
      state.interactive.showMinute = iShowMinute.checked;
      updateHandVisibility();
      saveState();
    });
    
    iShowSecond?.addEventListener('change', () => {
      state.interactive.showSecond = iShowSecond.checked;
      updateHandVisibility();
      saveState();
    });
    
    iShowNumbers?.addEventListener('change', () => {
      state.interactive.showNumbers = iShowNumbers.checked;
      if (components.numbers) {
        components.numbers.style.display = state.interactive.showNumbers ? 'block' : 'none';
      }
      saveState();
    });
    
    iAllowDrag?.addEventListener('change', () => {
      state.interactive.allowDrag = iAllowDrag.checked;
      saveState();
    });
    
    iSpotlight?.addEventListener('change', () => {
      state.interactive.spotlight = iSpotlight.checked;
      if (!state.interactive.spotlight) hideSpotlight();
      saveState();
    });
    
    dragModeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        state.interactive.dragMode = btn.dataset.dragMode;
        dragModeBtns.forEach(b => b.classList.toggle('segmented--active', b === btn));
        saveState();
      });
    });
    
    btnSetNow?.addEventListener('click', setInteractiveToNow);
    btnRandomTime?.addEventListener('click', setInteractiveToRandom);
    btnReadTime?.addEventListener('click', speakInteractiveTime);
    btnReadTimeFloating?.addEventListener('click', speakCurrentTime);

    // Learning controls
    const lessonBtns = document.querySelectorAll('.lesson-btn');
    const btnStartLesson = document.getElementById('btnStartLesson');
    const btnNextStep = document.getElementById('btnNextStep');
    
    lessonBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        selectLesson(btn.dataset.lesson);
      });
    });
    
    btnStartLesson?.addEventListener('click', startLesson);
    btnNextStep?.addEventListener('click', nextLessonStep);

    // Quiz controls
    const difficultyBtns = document.querySelectorAll('[data-difficulty]');
    const quizTypeBtns = document.querySelectorAll('[data-quiz-type]');
    const btnStartQuiz = document.getElementById('btnStartQuiz');
    const btnNextQuiz = document.getElementById('btnNextQuiz');
    
    difficultyBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        state.quiz.difficulty = btn.dataset.difficulty;
        difficultyBtns.forEach(b => b.classList.toggle('segmented--active', b === btn));
      });
    });
    
    quizTypeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        state.quiz.type = btn.dataset.quizType;
        quizTypeBtns.forEach(b => b.classList.toggle('segmented--active', b === btn));
      });
    });
    
    btnStartQuiz?.addEventListener('click', startQuiz);
    btnNextQuiz?.addEventListener('click', nextQuizQuestion);

    // Game controls
    const gameBtns = document.querySelectorAll('.game-btn');
    gameBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        startGame(btn.dataset.game);
      });
    });

    // Global mouse/touch events for dragging
    window.addEventListener('mousemove', handleDragMove);
    window.addEventListener('mouseup', handleDragEnd);
    window.addEventListener('touchmove', handleDragMove, { passive: false });
    window.addEventListener('touchend', handleDragEnd);

    // Escape key to close controls
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        controlsPanel?.classList.remove('open');
      }
    });

    // Restart animation when tab becomes visible
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        lastTickTs = null;
        startAnimation();
      }
    });
  }

  // Sync saved state to UI controls and segmented buttons
  function applyStateToUI() {
    // Mode segmented
    const modeBtns = document.querySelectorAll('[data-mode]');
    modeBtns.forEach(b => b.classList.toggle('segmented--active', b.dataset.mode === state.mode));

    // Normal mode settings
    const toggleDigital = document.getElementById('toggleDigital');
    const toggleSeconds = document.getElementById('toggleSeconds');
    const hourCycleBtns = document.querySelectorAll('[data-hour-cycle]');
    const timezoneSelect = document.getElementById('timezoneSelect');

    if (toggleDigital) toggleDigital.checked = !!state.showDigital;
    if (toggleSeconds) toggleSeconds.checked = !!state.showSeconds;
    hourCycleBtns.forEach(b => b.classList.toggle('segmented--active', Number(b.dataset.hourCycle) === Number(state.hourCycle)));
    if (timezoneSelect) timezoneSelect.value = state.timeZone || 'auto';

    // Interactive mode settings
    const iShowHour = document.getElementById('iShowHour');
    const iShowMinute = document.getElementById('iShowMinute');
    const iShowSecond = document.getElementById('iShowSecond');
    const iShowNumbers = document.getElementById('iShowNumbers');
    const iAllowDrag = document.getElementById('iAllowDrag');
    const iSpotlight = document.getElementById('iSpotlight');
    const dragModeBtns = document.querySelectorAll('[data-drag-mode]');

    if (iShowHour) iShowHour.checked = !!state.interactive.showHour;
    if (iShowMinute) iShowMinute.checked = !!state.interactive.showMinute;
    if (iShowSecond) iShowSecond.checked = !!state.interactive.showSecond;
    if (iShowNumbers) iShowNumbers.checked = !!state.interactive.showNumbers;
    if (iAllowDrag) iAllowDrag.checked = !!state.interactive.allowDrag;
    if (iSpotlight) iSpotlight.checked = !!state.interactive.spotlight;
    dragModeBtns.forEach(b => b.classList.toggle('segmented--active', b.dataset.dragMode === state.interactive.dragMode));

    // Theme
    document.body.className = `theme-${state.theme}`;

    // Apply visibility for hands based on mode
    updatePanelsForMode();
    updateHandVisibility();
    updatePositionIndicators();
  }

  // Bind theme swatches events
  function renderThemeSwatches() {
    const themeSelector = document.getElementById('themeSelector');
    if (!themeSelector) return;
    
    // Bind click events to existing swatch buttons
    const swatches = themeSelector.querySelectorAll('.swatch');
    swatches.forEach(swatch => {
      const theme = swatch.dataset.theme;
      
      swatch.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        console.log('Theme clicked:', theme); // Debug log
        state.theme = theme;
        document.body.className = `theme-${theme}`;
        applyTheme(theme); // Apply theme to clock colors
        
        // Update swatch selection
        swatches.forEach(s => {
          s.setAttribute('aria-selected', s === swatch ? 'true' : 'false');
        });
        
        saveState();
      });
    });
    
    // Set initial selection
    const currentSwatch = themeSelector.querySelector(`[data-theme="${state.theme}"]`);
    if (currentSwatch) {
      currentSwatch.setAttribute('aria-selected', 'true');
    }
  }

  // Get theme gradient
  function getThemeGradient(theme) {
    const gradients = {
      blue: 'linear-gradient(90deg, #4f7fff, #00d4ff)',
      mint: 'linear-gradient(90deg, #67e8c9, #00d4ff)',
      purple: 'linear-gradient(90deg, #c084fc, #ff00ff)',
      sunset: 'linear-gradient(90deg, #f59e0b, #ff6b6b)',
      slate: 'linear-gradient(90deg, #7dd3fc, #94a3b8)',
      contrast: 'linear-gradient(90deg, #00e5ff, #ffffff)'
    };
    return gradients[theme] || gradients.blue;
  }

  // Apply theme to clock and background
  function applyTheme(theme) {
    const themeColors = {
      blue: {
        primary: '#4f7fff',
        secondary: '#00d4ff',
        accent: '#1e40af'
      },
      mint: {
        primary: '#10b981',
        secondary: '#34d399',
        accent: '#047857'
      },
      purple: {
        primary: '#8b5cf6',
        secondary: '#a78bfa',
        accent: '#7c3aed'
      },
      sunset: {
        primary: '#f59e0b',
        secondary: '#f97316',
        accent: '#d97706'
      },
      slate: {
        primary: '#64748b',
        secondary: '#94a3b8',
        accent: '#475569'
      },
      contrast: {
        primary: '#000000',
        secondary: '#374151',
        accent: '#1f2937'
      }
    };

    const colors = themeColors[theme] || themeColors.blue;
    
    // Update CSS custom properties
    const root = document.documentElement;
    root.style.setProperty('--accent', colors.primary);
    root.style.setProperty('--accent-2', colors.secondary);
    root.style.setProperty('--accent-light', colors.secondary);
    root.style.setProperty('--accent-dark', colors.accent);
    
    // Keep ALL hands white for maximum visibility - never change hand colors with themes
    if (components.hourHand) {
      components.hourHand.setAttribute('stroke', 'white');
      components.hourHand.setAttribute('stroke-width', '8');
    }
    if (components.minuteHand) {
      components.minuteHand.setAttribute('stroke', 'white');
      components.minuteHand.setAttribute('stroke-width', '6');
    }
    if (components.secondHand) {
      components.secondHand.setAttribute('stroke', '#ff5c7c'); // Keep second hand pink for distinction
      components.secondHand.setAttribute('stroke-width', '2');
    }
    
    // Update center cap
    const cap = clockSvg.querySelector('circle[cx="200"][cy="200"]');
    if (cap) {
      cap.setAttribute('fill', colors.primary);
    }
    
    // Update clock face border
    const face = clockSvg.querySelector('.clock-face');
    if (face) {
      face.setAttribute('stroke', colors.primary);
    }
    
    // Update outer ring
    const outerRing = clockSvg.querySelector('circle[stroke-dasharray]');
    if (outerRing) {
      outerRing.setAttribute('stroke', colors.secondary);
    }
    
    // Update hour markers  
    const hourTicks = clockSvg.querySelectorAll('#ticks line[stroke-width="3"]');
    hourTicks.forEach(tick => {
      tick.setAttribute('stroke', colors.primary);
    });
    
    // Update number position ticks - keep them white for visibility like the hands
    const numberTicks = clockSvg.querySelectorAll('.number-tick');
    numberTicks.forEach(tick => {
      tick.setAttribute('stroke', 'white');
    });
    
    // Update interactive indicator
    if (components.interactiveIndicator) {
      components.interactiveIndicator.setAttribute('stroke', colors.secondary);
    }
  }

  // Update panels for mode
  function updatePanelsForMode() {
    const panels = document.querySelectorAll('.panel');
    panels.forEach(panel => {
      const forMode = panel.getAttribute('data-for-mode');
      panel.style.display = forMode === state.mode ? 'block' : 'none';
    });
    
    // Update interactive indicator - show for interactive and learn modes
    if (components.interactiveIndicator) {
      const showIndicator = state.mode === 'interactive' || state.mode === 'learn';
      components.interactiveIndicator.setAttribute('opacity', showIndicator ? '0.3' : '0');
    }
    
    // Enable dragging in both interactive and learn modes
    if (components.hourHand && components.minuteHand && components.secondHand) {
      const enableDragging = state.mode === 'interactive' || state.mode === 'learn';
      [components.hourHand, components.minuteHand, components.secondHand].forEach(hand => {
        hand.style.pointerEvents = enableDragging ? 'stroke' : 'none';
      });
    }
    
    // Update hand visibility
    updateHandVisibility();
    
    // Update position indicators
    updatePositionIndicators();
  }

  // Update hand visibility
  function updateHandVisibility() {
    if (!components.hourHand || !components.minuteHand || !components.secondHand) return;
    
    if (state.mode === 'interactive') {
      components.hourHand.style.visibility = state.interactive.showHour ? 'visible' : 'hidden';
      components.minuteHand.style.visibility = state.interactive.showMinute ? 'visible' : 'hidden';
      components.secondHand.style.visibility = state.interactive.showSecond ? 'visible' : 'hidden';
    } else {
      components.hourHand.style.visibility = 'visible';
      components.minuteHand.style.visibility = 'visible';
      components.secondHand.style.visibility = state.showSeconds ? 'visible' : 'hidden';
    }
  }

  // Update position indicators to show where hands are pointing
  function updatePositionIndicators() {
    if (state.mode !== 'interactive') {
      // Hide all existing dynamic indicators in non-interactive modes
      const existingIndicators = clockSvg.querySelectorAll('.dynamic-indicator');
      existingIndicators.forEach(indicator => indicator.remove());
      return;
    }

    // Remove existing dynamic indicators
    const existingIndicators = clockSvg.querySelectorAll('.dynamic-indicator');
    existingIndicators.forEach(indicator => indicator.remove());

    const time = state.interactive.time;
    
    // Calculate exact hand angles
    // In independent mode, hour hand should be exactly on hour markers
    let hourAngle;
    if (state.interactive.dragMode === "independent") {
      hourAngle = (time.h % 12) * 30; // Exactly on hour markers
    } else {
      hourAngle = ((time.h % 12) + time.m / 60 + time.s / 3600) * 30; // Continuous movement
    }
    const minuteAngle = (time.m + time.s / 60) * 6;
    const secondAngle = time.s * 6;
    
    // Clock center and radius for positioning indicators on the rim
    const centerX = 200;
    const centerY = 200;
    const radius = 180; // Distance from center to where indicators appear
    
    // Create dynamic indicators at exact hand positions
    if (state.interactive.showHour) {
      const hourX = centerX + radius * Math.sin((hourAngle) * Math.PI / 180);
      const hourY = centerY - radius * Math.cos((hourAngle) * Math.PI / 180);
      
      const hourIndicator = createSVGElement("circle", {
        cx: hourX,
        cy: hourY,
        r: 10,
        fill: "none",
        stroke: "white",
        "stroke-width": 3,
        "stroke-dasharray": "4 4",
        opacity: 0.9,
        class: "dynamic-indicator hour-indicator"
      });
      clockSvg.appendChild(hourIndicator);
    }
    
    if (state.interactive.showMinute) {
      const minuteX = centerX + radius * Math.sin((minuteAngle) * Math.PI / 180);
      const minuteY = centerY - radius * Math.cos((minuteAngle) * Math.PI / 180);
      
      const minuteIndicator = createSVGElement("circle", {
        cx: minuteX,
        cy: minuteY,
        r: 10,
        fill: "none",
        stroke: "#00d4ff",
        "stroke-width": 3,
        "stroke-dasharray": "4 4",
        opacity: 0.95,
        class: "dynamic-indicator minute-indicator"
      });
      clockSvg.appendChild(minuteIndicator);
    }
    
    if (state.interactive.showSecond) {
      const secondX = centerX + radius * Math.sin((secondAngle) * Math.PI / 180);
      const secondY = centerY - radius * Math.cos((secondAngle) * Math.PI / 180);
      
      const secondIndicator = createSVGElement("circle", {
        cx: secondX,
        cy: secondY,
        r: 8,
        fill: "none",
        stroke: "#ff5c7c",
        "stroke-width": 3,
        "stroke-dasharray": "3 3",
        opacity: 0.85,
        class: "dynamic-indicator second-indicator"
      });
      clockSvg.appendChild(secondIndicator);
    }
  }

  // Update timezone label
  function updateTimezoneLabel() {
    if (!timezoneEl) return;
    
    try {
      const tz = state.timeZone === 'auto' 
        ? Intl.DateTimeFormat().resolvedOptions().timeZone 
        : state.timeZone;
      timezoneEl.textContent = `Timezone: ${tz}`;
    } catch {
      timezoneEl.textContent = 'Timezone: System';
    }
  }

  // Animation loop with proper frame limiting
  function tick(ts) {
    requestAnimationFrame(tick);
    if (!lastTickTs) lastTickTs = ts;
    const elapsed = ts - lastTickTs;
    if (elapsed < 16) return; // ~60fps
    lastTickTs = ts;

    if (state.mode === 'normal') {
      drawCurrentTime();
    } else if (state.mode === 'interactive' || state.mode === 'learn' || state.mode === 'quiz') {
      drawInteractiveTime();
    }
  }

  // Draw current time
  function drawCurrentTime() {
    const now = getCurrentTime();
    
    const hourAngle = ((now.h % 12) + now.m / 60 + now.s / 3600) * 30;
    const minuteAngle = (now.m + now.s / 60) * 6;
    const secondAngle = now.s * 6;
    
    setRotation(components.hourHand, hourAngle);
    setRotation(components.minuteHand, minuteAngle);
    setRotation(components.secondHand, secondAngle);
    
    if (state.showDigital && digitalEl) {
      digitalEl.textContent = formatTime(now, state.hourCycle, state.showSeconds);
    }
  }

  // Draw interactive time
  function drawInteractiveTime() {
    const time = state.interactive.time;
    
    // In snapped mode, make hour hand move gradually as minutes change
    let hourAngle;
    if (state.interactive.dragMode === "snapped") {
      // Calculate hour hand position with minute influence for realistic movement
      // When minute is exactly at 0 and second at 0, hour hand should be exactly on the hour
      if (Math.abs(time.m - Math.round(time.m)) < 0.1 && time.s === 0) {
        // If minute is close to a whole number and seconds is 0, position exactly
        const wholeMinute = Math.round(time.m);
        if (wholeMinute === 0) {
          hourAngle = (time.h % 12) * 30; // Exactly on the hour
        } else {
          const exactHour = time.h % 12 + wholeMinute / 60;
          hourAngle = exactHour * 30;
        }
      } else {
        // Continuous movement for smooth dragging
        const exactHour = time.h % 12 + time.m / 60 + time.s / 3600;
        hourAngle = exactHour * 30; // 30 degrees per hour
      }
    } else {
      // In independent mode, use only the hour hand's independent position
      hourAngle = (time.h % 12) * 30;
    }
    
    const minuteAngle = (time.m + time.s / 60) * 6;
    const secondAngle = time.s * 6;
    
    setRotation(components.hourHand, hourAngle);
    setRotation(components.minuteHand, minuteAngle);
    setRotation(components.secondHand, secondAngle);
    
    // Update position indicators to show where hands are pointing
    updatePositionIndicators();
    
    // Show interactive time in digital display
    if (state.showDigital && digitalEl) {
      digitalEl.textContent = formatTime({
        h: Math.floor(time.h),
        m: Math.floor(time.m),
        s: Math.floor(time.s)
      }, state.hourCycle, state.showSeconds);
    }
  }

  // Set hand rotation
  function setRotation(element, angle) {
    if (!element) return;
    
    // Normalize angle to 0-360 range
    angle = ((angle % 360) + 360) % 360;
    
    // Get current rotation to check for jumps
    const currentTransform = element.getAttribute('transform') || 'rotate(0 200 200)';
    const currentAngleMatch = currentTransform.match(/rotate\(([^)]+) 200 200\)/);
    
    if (currentAngleMatch) {
      const currentAngle = parseFloat(currentAngleMatch[1]);
      const angleDiff = Math.abs(angle - currentAngle);
      
      // If the angle difference is large (>180°), we might be crossing 12 o'clock
      // Choose the shorter rotation path
      if (angleDiff > 180) {
        if (angle > currentAngle) {
          angle -= 360;
        } else {
          angle += 360;
        }
      }
    }
    
    element.setAttribute('transform', `rotate(${angle} 200 200)`);
  }

  // Get current time
  function getCurrentTime() {
    const date = new Date();
    
    if (state.timeZone === 'auto') {
      return {
        h: date.getHours(),
        m: date.getMinutes(),
        s: date.getSeconds()
      };
    }
    
    try {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: state.timeZone,
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: false
      });
      
      const parts = formatter.formatToParts(date);
      const getPart = (type) => Number(parts.find(p => p.type === type)?.value || 0);
      
      return {
        h: getPart('hour'),
        m: getPart('minute'),
        s: getPart('second')
      };
    } catch {
      return {
        h: date.getHours(),
        m: date.getMinutes(),
        s: date.getSeconds()
      };
    }
  }

  // Format time
  function formatTime(time, hourCycle, includeSeconds) {
    const h = time.h;
    const m = time.m;
    const s = time.s;
    
    const pad = (n) => String(Math.floor(n)).padStart(2, '0');
    
    if (hourCycle === 12) {
      const period = h >= 12 ? 'PM' : 'AM';
      const h12 = h % 12 || 12;
      const timeStr = `${pad(h12)}:${pad(m)}`;
      return includeSeconds ? `${timeStr}:${pad(s)} ${period}` : `${timeStr} ${period}`;
    } else {
      const timeStr = `${pad(h)}:${pad(m)}`;
      return includeSeconds ? `${timeStr}:${pad(s)}` : timeStr;
    }
  }

  // Interactive mode functions
  function setInteractiveToNow() {
    const now = getCurrentTime();
    state.interactive.time = { ...now };
    updatePositionIndicators();
    saveState();
  }

  function setInteractiveToRandom() {
    state.interactive.time = {
      h: Math.floor(Math.random() * 24),
      m: Math.floor(Math.random() * 60),
      s: Math.floor(Math.random() * 60)
    };
    updatePositionIndicators();
    saveState();
  }

  function speakInteractiveTime() {
    const time = state.interactive.time;
    const h = Math.floor(time.h);
    const m = Math.floor(time.m);
    
    const h12 = h % 12 || 12;
    const period = h >= 12 ? 'PM' : 'AM';
    const timeStr = `${h12}:${String(m).padStart(2, '0')} ${period}`;
    const text = `The time is ${timeStr}`;
    
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    }
  }

  function speakCurrentTime() {
    // Get current time based on mode
    let time;
    if (state.mode === 'interactive' || state.mode === 'learn' || state.mode === 'quiz') {
      time = state.interactive.time;
    } else {
      time = getCurrentTime();
    }
    
    const h = Math.floor(time.h);
    const m = Math.floor(time.m);
    
    const h12 = h % 12 || 12;
    const period = h >= 12 ? 'PM' : 'AM';
    const timeStr = `${h12}:${String(m).padStart(2, '0')} ${period}`;
    const text = `The time is ${timeStr}`;
    
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    }
  }

  // Learning functions
  function selectLesson(lessonId) {
    state.learning.currentLesson = lessonId;
    state.learning.currentStep = 0;
    
    // Update UI
    const lessonBtns = document.querySelectorAll('.lesson-btn');
    lessonBtns.forEach(btn => {
      btn.classList.toggle('selected', btn.dataset.lesson === lessonId);
    });
    
    // Show lesson preview
    const tutorialContent = document.getElementById('tutorialContent');
    if (tutorialContent && LESSONS[lessonId]) {
      const lesson = LESSONS[lessonId];
      tutorialContent.innerHTML = `
        <h4>${lesson.title}</h4>
        <p>Ready to learn about ${lesson.title.toLowerCase()}?</p>
      `;
      tutorialContent.classList.add('active');
    }
  }

  function startLesson() {
    if (!state.learning.currentLesson) return;
    displayLessonStep();
    
    // Update buttons
    const btnStartLesson = document.getElementById('btnStartLesson');
    const btnNextStep = document.getElementById('btnNextStep');
    if (btnStartLesson) btnStartLesson.style.display = 'none';
    if (btnNextStep) btnNextStep.style.display = 'inline-block';
  }

  function displayLessonStep() {
    const lesson = LESSONS[state.learning.currentLesson];
    if (!lesson) return;
    
    const step = state.learning.currentStep;
    const tutorialContent = document.getElementById('tutorialContent');
    
    if (tutorialContent && step < lesson.steps.length) {
      tutorialContent.innerHTML = `
        <p><strong>Step ${step + 1}:</strong> ${lesson.steps[step]}</p>
      `;
      
      // Set example time if on practice step
      if (step === lesson.steps.length - 1 && lesson.practice[0]) {
        const practice = lesson.practice[0];
        state.interactive.time = { h: practice.h, m: practice.m, s: 0 };
      }
    }
  }

  function nextLessonStep() {
    const lesson = LESSONS[state.learning.currentLesson];
    if (!lesson) return;
    
    state.learning.currentStep++;
    
    if (state.learning.currentStep < lesson.steps.length) {
      displayLessonStep();
    } else {
      completeLesson();
    }
  }

  function completeLesson() {
    const lessonId = state.learning.currentLesson;
    
    // Update progress
    if (!state.learning.progress[lessonId]) {
      state.learning.progress[lessonId] = 0;
    }
    state.learning.progress[lessonId] = Math.min(state.learning.progress[lessonId] + 1, 3);
    
    // Update learning system with enhanced tracking
    if (learningSystem) {
      const sessionTime = 5000; // Default session time
      learningSystem.recordPracticeSession(lessonId, true, sessionTime);
      
      // Check for achievements
      const newAchievements = learningSystem.checkAchievements();
      if (newAchievements && newAchievements.length > 0) {
        newAchievements.forEach(achievement => {
          showFeedback('🏆', `Achievement Unlocked: ${achievement.name}`);
        });
      }
    }
    
    // Update UI
    updateLearningProgress();
    
    // Show feedback
    showFeedback('🎉', 'Lesson Complete!');
    
    // Reset buttons
    const btnStartLesson = document.getElementById('btnStartLesson');
    const btnNextStep = document.getElementById('btnNextStep');
    if (btnStartLesson) btnStartLesson.style.display = 'inline-block';
    if (btnNextStep) btnNextStep.style.display = 'none';
    
    saveState();
  }

  function updateLearningProgress() {
    const totalLessons = Object.keys(LESSONS).length;
    const completedLessons = Object.values(state.learning.progress).filter(p => p >= 3).length;
    const progress = Math.round((completedLessons / totalLessons) * 100);
    
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    
    if (progressFill) progressFill.style.width = progress + '%';
    if (progressText) progressText.textContent = `${progress}%`;
    
    // Update lesson stars
    const lessonBtns = document.querySelectorAll('.lesson-btn');
    lessonBtns.forEach(btn => {
      const lessonId = btn.dataset.lesson;
      const stars = state.learning.progress[lessonId] || 0;
      const starsEl = btn.querySelector('.lesson-stars');
      if (starsEl) {
        starsEl.textContent = '★'.repeat(stars) + '☆'.repeat(3 - stars);
      }
    });
  }

  // Quiz functions
  function startQuiz() {
    state.quiz.isActive = true;
    state.quiz.score = 0;
    state.quiz.streak = 0;
    generateQuizQuestion();
    
    // Update buttons
    const btnStartQuiz = document.getElementById('btnStartQuiz');
    const btnNextQuiz = document.getElementById('btnNextQuiz');
    if (btnStartQuiz) btnStartQuiz.style.display = 'none';
    if (btnNextQuiz) btnNextQuiz.style.display = 'inline-block';
  }

  function generateQuizQuestion() {
    const questions = QUIZ_QUESTIONS[state.quiz.difficulty];
    const question = questions[Math.floor(Math.random() * questions.length)];
    
    // Add concept mapping for learning system
    const conceptMap = {
      'easy': 'oclock',
      'medium': 'halfPast', 
      'hard': 'anyTime'
    };
    question.concept = conceptMap[state.quiz.difficulty];
    
    state.quiz.currentQuestion = question;
    state.quiz.questionStartTime = Date.now();
    
    // Set clock time
    state.interactive.time = { h: question.h, m: question.m, s: 0 };
    
    // Display question
    const quizQuestion = document.getElementById('quizQuestion');
    const quizOptions = document.getElementById('quizOptions');
    
    if (quizQuestion) quizQuestion.textContent = 'What time is shown?';
    
    if (quizOptions) {
      quizOptions.innerHTML = '';
      question.options.forEach((option, index) => {
        const btn = document.createElement('button');
        btn.className = 'quiz-option';
        btn.textContent = option;
        btn.addEventListener('click', () => selectQuizAnswer(index));
        quizOptions.appendChild(btn);
      });
    }
  }

  function selectQuizAnswer(index) {
    const question = state.quiz.currentQuestion;
    const correct = index === question.correct;
    const responseTime = Date.now() - (state.quiz.questionStartTime || Date.now());
    
    // Update score
    if (correct) {
      state.quiz.score++;
      state.quiz.streak++;
    } else {
      state.quiz.streak = 0;
    }
    
    // Update learning system with quiz data
    if (learningSystem && question.concept) {
      learningSystem.recordPracticeSession(question.concept, correct, responseTime);
    }
    
    // Update best score
    if (state.quiz.score > state.quiz.bestScore) {
      state.quiz.bestScore = state.quiz.score;
      saveState();
    }
    
    // Update UI
    updateQuizStats();
    
    // Show feedback
    const quizFeedback = document.getElementById('quizFeedback');
    if (quizFeedback) {
      quizFeedback.textContent = correct ? 'Correct! Well done!' : `Incorrect. The answer is ${question.options[question.correct]}`;
      quizFeedback.className = `quiz-feedback ${correct ? 'correct' : 'incorrect'}`;
    }
    
    // Disable options
    const options = document.querySelectorAll('.quiz-option');
    options.forEach((opt, i) => {
      opt.disabled = true;
      if (i === question.correct) opt.classList.add('correct');
      else if (i === index) opt.classList.add('incorrect');
    });
  }

  function nextQuizQuestion() {
    generateQuizQuestion();
    
    // Clear feedback
    const quizFeedback = document.getElementById('quizFeedback');
    if (quizFeedback) {
      quizFeedback.textContent = '';
      quizFeedback.className = 'quiz-feedback';
    }
  }

  function updateQuizStats() {
    const quizScore = document.getElementById('quizScore');
    const quizStreak = document.getElementById('quizStreak');
    const quizBest = document.getElementById('quizBest');
    
    if (quizScore) quizScore.textContent = state.quiz.score;
    if (quizStreak) quizStreak.textContent = state.quiz.streak;
    if (quizBest) quizBest.textContent = state.quiz.bestScore;
  }

  // Game functions
  function startGame(gameType) {
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

  // Feedback functions
  function showFeedback(icon, text) {
    const feedbackOverlay = document.getElementById('feedbackOverlay');
    const feedbackIcon = document.getElementById('feedbackIcon');
    const feedbackText = document.getElementById('feedbackText');
    
    if (feedbackIcon) feedbackIcon.textContent = icon;
    if (feedbackText) feedbackText.textContent = text;
    if (feedbackOverlay) {
      feedbackOverlay.classList.add('show');
      
      setTimeout(() => {
        feedbackOverlay.classList.remove('show');
      }, 2000);
    }
  }

  // State persistence
  function saveState() {
    try {
      localStorage.setItem('timelab-state', JSON.stringify(state));
    } catch (e) {
      console.error('Failed to save state:', e);
    }
  }

  function loadState() {
    try {
      const saved = localStorage.getItem('timelab-state');
      if (saved) {
        const loaded = JSON.parse(saved);
        // Deep merge with current shape to avoid missing nested keys
        Object.assign(state, loaded);
        if (loaded.interactive) {
          state.interactive = { ...state.interactive, ...loaded.interactive };
        }
        if (loaded.learning) {
          state.learning = { ...state.learning, ...loaded.learning };
        }
        if (loaded.quiz) {
          state.quiz = { ...state.quiz, ...loaded.quiz };
        }
        if (loaded.games) {
          state.games = { ...state.games, ...loaded.games };
        }
        
        // Apply theme
        document.body.className = `theme-${state.theme}`;
      }
    } catch (e) {
      console.error('Failed to load state:', e);
    }
  }

  // Start animation
  function startAnimation() {
    requestAnimationFrame(tick);
  }

  // Expose core functions globally for modules
  window.TimeLab = {
    state,
    showFeedback,
    updateLearningProgress: () => {
      if (window.TimeLabLearning) {
        window.TimeLabLearning.updateLearningProgress();
      }
    },
    updateQuizStats
  };

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();