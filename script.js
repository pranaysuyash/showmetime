/* TimeLab — Interactive Analog Clock (Vanilla JS) */
(() => {

  const state = {
    mode: "normal", // "normal" | "interactive" | "learn" | "quiz" | "games"
    showDigital: true,
    showSeconds: true,
    hourCycle: 24, // 12 | 24
    theme: "blue",
    timeZone: "auto", // "auto" or IANA tz string

    // interactive
    interactive: {
      showHour: true,
      showMinute: true,
      showSecond: false,
      showNumbers: true,
      allowDrag: true,
      dragMode: "independent", // "independent" | "snapped"
      spotlight: true,
      time: { h: 10, m: 10, s: 0 },
    },

    // learning
    learning: {
      currentLesson: null,
      currentStep: 0,
      progress: {},
      achievements: [],
    },

    // quiz
    quiz: {
      score: 0,
      streak: 0,
      bestScore: 0,
      difficulty: "easy", // "easy" | "medium" | "hard"
      type: "read", // "read" | "set"
      currentQuestion: null,
      isActive: false,
    },

    // games
    games: {
      raceTime: null,
      detectiveScore: 0,
      memoryScore: 0,
      currentGame: null,
    },
  };

  const svgNS = "http://www.w3.org/2000/svg";
  const clockSvg = document.getElementById("clockSvg");
  const digitalEl = document.getElementById("digital");
  const timezoneEl = document.getElementById("timezoneLabel");

  const toggleControlsBtn = document.getElementById("toggleControls");
  const controlsPanel = document.getElementById("controlsPanel");
  const closeControlsBtn = document.getElementById("closeControls");

  const modeBtns = Array.from(document.querySelectorAll('.toolbar [data-mode]'));

  const btnHourCycle = Array.from(document.querySelectorAll('[data-hour-cycle]'));
  const toggleDigital = document.getElementById("toggleDigital");
  const toggleSeconds = document.getElementById("toggleSeconds");
  const themeSwatches = document.getElementById("themeSwatches");
  const timezoneSelect = document.getElementById("timezoneSelect");
  const adBanner = document.getElementById("adBanner");

  const iShowHour = document.getElementById("iShowHour");
  const iShowMinute = document.getElementById("iShowMinute");
  const iShowSecond = document.getElementById("iShowSecond");
  const iShowNumbers = document.getElementById("iShowNumbers");
  const iAllowDrag = document.getElementById("iAllowDrag");
  const iSpotlight = document.getElementById("iSpotlight");
  const dragModeBtns = Array.from(document.querySelectorAll('[data-drag-mode]'));
  const btnReadTime = document.getElementById("btnReadTime");
  const btnSetNow = document.getElementById("btnSetNow");
  const btnRandomTime = document.getElementById("btnRandomTime");

  // Learning elements
  const progressFill = document.getElementById("progressFill");
  const progressText = document.getElementById("progressText");
  const lessonBtns = Array.from(document.querySelectorAll('.lesson-btn'));
  const tutorialContent = document.getElementById("tutorialContent");
  const btnStartLesson = document.getElementById("btnStartLesson");
  const btnNextStep = document.getElementById("btnNextStep");
  const btnRepeat = document.getElementById("btnRepeat");

  // Quiz elements
  const quizScore = document.getElementById("quizScore");
  const quizStreak = document.getElementById("quizStreak");
  const quizBest = document.getElementById("quizBest");
  const difficultyBtns = Array.from(document.querySelectorAll('[data-difficulty]'));
  const quizTypeBtns = Array.from(document.querySelectorAll('[data-quiz-type]'));
  const quizQuestion = document.getElementById("quizQuestion");
  const quizOptions = document.getElementById("quizOptions");
  const quizFeedback = document.getElementById("quizFeedback");
  const btnStartQuiz = document.getElementById("btnStartQuiz");
  const btnNextQuiz = document.getElementById("btnNextQuiz");

  // Game elements
  const gamesBtns = Array.from(document.querySelectorAll('.game-btn'));
  const gameArea = document.getElementById("gameArea");
  const raceBest = document.getElementById("raceBest");
  const detectiveBest = document.getElementById("detectiveBest");
  const memoryBest = document.getElementById("memoryBest");

  // Feedback elements
  const achievementToast = document.getElementById("achievementToast");
  const feedbackOverlay = document.getElementById("feedbackOverlay");
  const feedbackIcon = document.getElementById("feedbackIcon");
  const feedbackText = document.getElementById("feedbackText");
  const feedbackStars = document.getElementById("feedbackStars");

  const THEMES = ["blue", "mint", "purple", "sunset", "slate", "contrast"];

  // Learning content
  const LESSONS = {
    "oclock": {
      title: "O'Clock Times",
      icon: "🕐",
      steps: [
        "When the minute hand points to 12, we say 'o'clock'",
        "The hour hand points to the number for that hour",
        "1 o'clock means the time is exactly 1:00",
        "Try to find 3 o'clock on the clock!"
      ],
      practice: [
        { h: 3, m: 0, question: "What time is this?" },
        { h: 7, m: 0, question: "What time is this?" },
        { h: 12, m: 0, question: "What time is this?" },
      ]
    },
    "half-past": {
      title: "Half Past",
      icon: "🕕",
      steps: [
        "Half past means 30 minutes after the hour",
        "The minute hand points to 6 (halfway around)",
        "The hour hand is halfway between two numbers",
        "Half past 2 means 2:30"
      ],
      practice: [
        { h: 2, m: 30, question: "What time is this?" },
        { h: 5, m: 30, question: "What time is this?" },
        { h: 9, m: 30, question: "What time is this?" },
      ]
    },
    "quarter": {
      title: "Quarter Past/To",
      icon: "🕒", 
      steps: [
        "Quarter past means 15 minutes after the hour",
        "Quarter to means 15 minutes before the next hour",
        "Quarter past: minute hand points to 3",
        "Quarter to: minute hand points to 9"
      ],
      practice: [
        { h: 3, m: 15, question: "What time is this?" },
        { h: 6, m: 45, question: "What time is this?" },
        { h: 10, m: 15, question: "What time is this?" },
      ]
    },
    "five-minute": {
      title: "5-Minute Times",
      icon: "🕓",
      steps: [
        "Each number on the clock represents 5 minutes",
        "Count by 5s: 5, 10, 15, 20, 25, 30...",
        "The minute hand points to the number of 5-minute groups",
        "Practice reading different 5-minute times"
      ],
      practice: [
        { h: 4, m: 20, question: "What time is this?" },
        { h: 8, m: 35, question: "What time is this?" },
        { h: 11, m: 50, question: "What time is this?" },
      ]
    }
  };

  // Quiz questions
  const QUIZ_QUESTIONS = {
    easy: [
      { h: 3, m: 0, options: ["3:00", "4:00", "2:00", "12:00"], correct: 0 },
      { h: 6, m: 0, options: ["5:00", "6:00", "7:00", "12:00"], correct: 1 },
      { h: 9, m: 0, options: ["8:00", "10:00", "9:00", "3:00"], correct: 2 },
      { h: 12, m: 0, options: ["12:00", "1:00", "11:00", "6:00"], correct: 0 },
    ],
    medium: [
      { h: 2, m: 30, options: ["2:30", "2:15", "3:00", "2:45"], correct: 0 },
      { h: 7, m: 15, options: ["7:30", "7:15", "7:45", "8:15"], correct: 1 },
      { h: 4, m: 45, options: ["4:15", "5:15", "4:45", "4:30"], correct: 2 },
      { h: 10, m: 30, options: ["10:15", "11:00", "10:45", "10:30"], correct: 3 },
    ],
    hard: [
      { h: 1, m: 25, options: ["1:25", "1:20", "1:30", "1:35"], correct: 0 },
      { h: 5, m: 40, options: ["5:35", "5:40", "5:45", "6:40"], correct: 1 },
      { h: 8, m: 55, options: ["8:50", "9:55", "8:55", "8:45"], correct: 2 },
      { h: 11, m: 10, options: ["11:05", "11:15", "12:10", "11:10"], correct: 3 },
    ]
  };

  // Achievements
  const ACHIEVEMENTS = [
    { id: "first_lesson", title: "First Steps", desc: "Complete your first lesson", icon: "👶" },
    { id: "oclock_master", title: "O'Clock Master", desc: "Master all o'clock times", icon: "🕐" },
    { id: "half_past_hero", title: "Half Past Hero", desc: "Master half past times", icon: "🕕" },
    { id: "quarter_champion", title: "Quarter Champion", desc: "Master quarter times", icon: "🕒" },
    { id: "time_wizard", title: "Time Wizard", desc: "Master 5-minute intervals", icon: "🧙‍♂️" },
    { id: "quiz_starter", title: "Quiz Starter", desc: "Take your first quiz", icon: "❓" },
    { id: "perfect_score", title: "Perfect Score", desc: "Get 10 quiz questions right in a row", icon: "⭐" },
    { id: "speed_demon", title: "Speed Demon", desc: "Complete Race the Clock in under 30 seconds", icon: "⚡" },
    { id: "detective", title: "Time Detective", desc: "Score 80% or higher in Time Detective", icon: "🕵️" },
  ];

  let lastTickTs = 0;
  let components = null; // references to SVG parts
  let spot = null; // spotlight elements
  let interactiveDigitalTimer = null;

  function init() {
    loadProgress();
    renderThemeSwatches();
    buildClock();
    wireUI();
    updateTimezoneLabel();
    updateLearningProgress();
    updateQuizStats();
    updateGameStats();
    requestAnimationFrame(tick);
  }

  // Load progress from localStorage
  function loadProgress() {
    try {
      const saved = localStorage.getItem('timelab-progress');
      if (saved) {
        const progress = JSON.parse(saved);
        state.learning.progress = progress.learning || {};
        state.learning.achievements = progress.achievements || [];
        state.quiz.bestScore = progress.quizBest || 0;
        state.games.raceTime = progress.raceTime || null;
        state.games.detectiveScore = progress.detectiveScore || 0;
        state.games.memoryScore = progress.memoryScore || 0;
      }
    } catch (e) {
      // Ignore localStorage errors
    }
  }

  // Save progress to localStorage
  function saveProgress() {
    try {
      const progress = {
        learning: state.learning.progress,
        achievements: state.learning.achievements,
        quizBest: state.quiz.bestScore,
        raceTime: state.games.raceTime,
        detectiveScore: state.games.detectiveScore,
        memoryScore: state.games.memoryScore,
      };
      localStorage.setItem('timelab-progress', JSON.stringify(progress));
    } catch (e) {
      // Ignore localStorage errors
    }
  }

  function renderThemeSwatches() {
    themeSwatches.innerHTML = "";
    THEMES.forEach((t, idx) => {
      const btn = document.createElement("button");
      btn.className = "swatch";
      btn.setAttribute("role", "option");
      btn.setAttribute("aria-label", `${t} theme`);
      btn.style.background = themePreviewColor(t);
      btn.dataset.theme = t;
      if (t === state.theme) btn.setAttribute("aria-selected", "true");
      btn.addEventListener("click", () => {
        state.theme = t;
        document.body.className = `theme-${t}`;
        Array.from(themeSwatches.children).forEach((el) => el.setAttribute("aria-selected", String(el === btn)));
      });
      themeSwatches.appendChild(btn);
      if (idx === 0) document.body.className = `theme-${t}`; // default
    });
  }

  function themePreviewColor(theme) {
    switch (theme) {
      case "mint": return "linear-gradient(90deg, #67e8c9, #0c1b16)";
      case "purple": return "linear-gradient(90deg, #c084fc, #160d1d)";
      case "sunset": return "linear-gradient(90deg, #f59e0b, #1b0d0b)";
      case "slate": return "linear-gradient(90deg, #7dd3fc, #0b0f14)";
      case "contrast": return "linear-gradient(90deg, #00e5ff, #000)";
      case "blue":
      default:
        return "linear-gradient(90deg, #5eb0ef, #0b1020)";
    }
  }

  function wireUI() {
    toggleControlsBtn.addEventListener("click", () => toggleControls(true));
    closeControlsBtn.addEventListener("click", () => toggleControls(false));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") toggleControls(false);
    });
    
    // Handle window resize for desktop/mobile layout changes
    window.addEventListener("resize", () => {
      if (window.innerWidth >= 980) {
        controlsPanel.classList.add("open");
        toggleControlsBtn.setAttribute("aria-expanded", "true");
      }
    });

    modeBtns.forEach((b) => {
      b.addEventListener("click", () => {
        state.mode = b.dataset.mode;
        modeBtns.forEach((x) => x.classList.toggle("segmented--active", x === b));
        updatePanelsForMode();
        
        // Ensure controls panel is open on mobile for learning modes
        if (window.innerWidth <= 768 && ['learn', 'quiz', 'games'].includes(state.mode)) {
          toggleControls(true);
        }
      });
    });

    // Learning mode event listeners
    lessonBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const lesson = btn.dataset.lesson;
        selectLesson(lesson);
      });
    });

    btnStartLesson.addEventListener("click", startCurrentLesson);
    btnNextStep.addEventListener("click", nextLessonStep);
    btnRepeat.addEventListener("click", repeatLesson);

    // Quiz mode event listeners
    difficultyBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        state.quiz.difficulty = btn.dataset.difficulty;
        difficultyBtns.forEach((x) => x.classList.toggle("segmented--active", x === btn));
      });
    });

    quizTypeBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        state.quiz.type = btn.dataset.quizType;
        quizTypeBtns.forEach((x) => x.classList.toggle("segmented--active", x === btn));
      });
    });

    btnStartQuiz.addEventListener("click", startQuiz);
    btnNextQuiz.addEventListener("click", nextQuizQuestion);

    // Game mode event listeners
    gamesBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const game = btn.dataset.game;
        startGame(game);
      });
    });

    // Feedback overlay click to close
    feedbackOverlay.addEventListener("click", hideFeedback);

    toggleDigital.addEventListener("change", () => {
      state.showDigital = toggleDigital.checked;
      digitalEl.style.display = state.showDigital ? "block" : "none";
    });

    toggleSeconds.addEventListener("change", () => {
      state.showSeconds = toggleSeconds.checked;
      updateVisibility();
    });

    timezoneSelect.addEventListener("change", () => {
      state.timeZone = timezoneSelect.value;
      updateTimezoneLabel();
    });

    // Ads: always on if AdSense is present. If you need a privacy toggle, wire it here.

    btnHourCycle.forEach((btn) => {
      btn.addEventListener("click", () => {
        state.hourCycle = Number(btn.dataset.hour_cycle || btn.dataset.hourCycle);
        btnHourCycle.forEach((x) => x.classList.toggle("segmented--active", x === btn));
      });
    });

    // interactive controls
    iShowHour.addEventListener("change", () => { state.interactive.showHour = iShowHour.checked; updateVisibility(); });
    iShowMinute.addEventListener("change", () => { state.interactive.showMinute = iShowMinute.checked; updateVisibility(); });
    iShowSecond.addEventListener("change", () => { state.interactive.showSecond = iShowSecond.checked; updateVisibility(); });
    iShowNumbers.addEventListener("change", () => { state.interactive.showNumbers = iShowNumbers.checked; updateVisibility(); });
    iAllowDrag.addEventListener("change", () => { state.interactive.allowDrag = iAllowDrag.checked; });
    iSpotlight.addEventListener("change", () => { state.interactive.spotlight = iSpotlight.checked; if (!state.interactive.spotlight) hideSpotlight(); });

    dragModeBtns.forEach((b) => {
      b.addEventListener("click", () => {
        state.interactive.dragMode = b.dataset.dragMode;
        dragModeBtns.forEach((x) => x.classList.toggle("segmented--active", x === b));
      });
    });

    btnReadTime.addEventListener("click", speakCurrentInteractiveTime);
    btnSetNow.addEventListener("click", () => setInteractiveToNow());
    btnRandomTime.addEventListener("click", () => setInteractiveToRandom());

    updatePanelsForMode();
    
    // Ensure controls are visible on desktop from start
    if (window.innerWidth >= 980) {
      controlsPanel.classList.add("open");
      toggleControlsBtn.setAttribute("aria-expanded", "true");
    }
  }

  function toggleControls(open) {
    // On desktop (>=980px), controls are always visible
    if (window.innerWidth >= 980) {
      controlsPanel.classList.add("open");
      toggleControlsBtn.setAttribute("aria-expanded", "true");
      return;
    }
    
    const next = open != null ? open : !controlsPanel.classList.contains("open");
    controlsPanel.classList.toggle("open", next);
    toggleControlsBtn.setAttribute("aria-expanded", String(next));
  }

  function updatePanelsForMode() {
    const sections = Array.from(controlsPanel.querySelectorAll('.panel'));
    sections.forEach((s) => {
      const m = s.getAttribute("data-for-mode");
      const isActive = m === state.mode;
      s.style.display = isActive ? "grid" : "none";
      
      // Add smooth transition for panel switching
      if (isActive) {
        s.style.opacity = "0";
        s.style.transform = "translateY(10px)";
        setTimeout(() => {
          s.style.opacity = "1";
          s.style.transform = "translateY(0)";
          s.style.transition = "all 0.3s ease";
        }, 50);
      }
    });
    
    // Handle digital display based on mode
    if (state.mode === "interactive") {
      digitalEl.style.display = state.showDigital ? "block" : "none";
      timezoneEl.style.display = "none";
      setSpotlightIdleStyle();
    } else if (state.mode === "learn" || state.mode === "quiz" || state.mode === "games") {
      digitalEl.style.display = "none";
      timezoneEl.style.display = "none";
      setSpotlightIdleStyle();
    } else {
      digitalEl.style.display = state.showDigital ? "block" : "none";
      timezoneEl.style.display = "block";
      hideSpotlight();
    }
    
    // Update timezone label for normal mode
    if (state.mode === "normal") {
      updateTimezoneLabel();
    }
    
    // Auto-close controls on mobile when switching modes
    if (window.innerWidth <= 560) {
      setTimeout(() => toggleControls(false), 1000);
    }
  }

  function updateTimezoneLabel() {
    try {
      const tz = state.timeZone === "auto" ? Intl.DateTimeFormat().resolvedOptions().timeZone : state.timeZone;
      timezoneEl.textContent = tz ? `Timezone: ${tz}` : "";
    } catch {
      timezoneEl.textContent = "";
    }
  }

  function buildClock() {
    clockSvg.innerHTML = "";

    const defs = el("defs");
    const grad = el("radialGradient", { id: "faceGrad", cx: "50%", cy: "50%", r: "70%" });
    grad.appendChild(el("stop", { offset: "0%", stopColor: "rgba(255,255,255,0.05)" }));
    grad.appendChild(el("stop", { offset: "100%", stopColor: "rgba(0,0,0,0.35)" }));
    defs.appendChild(grad);
    clockSvg.appendChild(defs);

    const face = el("circle", { cx: 200, cy: 200, r: 188, fill: "url(#faceGrad)", stroke: "rgba(255,255,255,0.15)", strokeWidth: 2 });
    const faceRing = el("circle", { cx: 200, cy: 200, r: 194, fill: "none", stroke: "var(--accent)", strokeWidth: 2, opacity: 0.45 });
    clockSvg.append(face, faceRing);

    // minute ticks
    const ticks = el("g", { id: "ticks" });
    for (let i = 0; i < 60; i++) {
      const angle = (i / 60) * 2 * Math.PI;
      const isHour = i % 5 === 0;
      const rOuter = 180;
      const rInner = isHour ? 164 : 172;
      const x1 = 200 + rInner * Math.sin(angle);
      const y1 = 200 - rInner * Math.cos(angle);
      const x2 = 200 + rOuter * Math.sin(angle);
      const y2 = 200 - rOuter * Math.cos(angle);
      const line = el("line", {
        x1, y1, x2, y2,
        stroke: isHour ? "var(--text)" : "rgba(255,255,255,0.4)",
        strokeWidth: isHour ? 2.5 : 1,
        strokeLinecap: "round",
        opacity: isHour ? 0.9 : 0.6,
      });
      ticks.appendChild(line);
    }
    clockSvg.appendChild(ticks);

    // numbers
    const numbers = el("g", { id: "numbers" });
    for (let i = 1; i <= 12; i++) {
      const angle = (i / 12) * 2 * Math.PI;
      const r = 138;
      const x = 200 + r * Math.sin(angle);
      const y = 206 - r * Math.cos(angle); // optically centering
      const text = el("text", { x, y, textAnchor: "middle", fontSize: 24, fontWeight: 700, fill: "var(--text)" });
      text.textContent = String(i);
      numbers.appendChild(text);
    }
    clockSvg.appendChild(numbers);

    // hands containers
    const hands = el("g", { id: "hands" });
    const hourHand = el("line", { x1: 200, y1: 220, x2: 200, y2: 120, stroke: "var(--text)", strokeWidth: 6, strokeLinecap: "round" });
    const minuteHand = el("line", { x1: 200, y1: 235, x2: 200, y2: 90, stroke: "var(--accent)", strokeWidth: 4, strokeLinecap: "round" });
    const secondHand = el("line", { x1: 200, y1: 240, x2: 200, y2: 70, stroke: "var(--danger)", strokeWidth: 2, strokeLinecap: "round", opacity: 0.85 });
    const cap = el("circle", { cx: 200, cy: 200, r: 6, fill: "var(--text)", stroke: "var(--accent)", strokeWidth: 2 });
    hands.append(hourHand, minuteHand, secondHand, cap);
    clockSvg.appendChild(hands);

    // spotlight elements
    const spotGroup = el("g", { id: "spotlight", opacity: 0.4 });
    const spotCircle = el("circle", { cx: 200, cy: 200, r: 16, fill: "none", stroke: "var(--accent-2)", strokeWidth: 3, strokeDasharray: "4 6" });
    spotGroup.appendChild(spotCircle);
    clockSvg.appendChild(spotGroup);

    // Interactive mode indicator circle - always visible when interactive
    const interactiveIndicator = el("circle", { 
      cx: 200, cy: 200, r: 210, 
      fill: "none", 
      stroke: "var(--accent-2)", 
      strokeWidth: 2, 
      strokeDasharray: "8 12", 
      opacity: 0.3,
      id: "interactive-indicator"
    });
    clockSvg.appendChild(interactiveIndicator);

    components = { numbers, hourHand, minuteHand, secondHand, interactiveIndicator };
    spot = { group: spotGroup, circle: spotCircle };

    // drag interactions for interactive mode
    enableDrag(components.hourHand, "h");
    enableDrag(components.minuteHand, "m");
    enableDrag(components.secondHand, "s");

    updateVisibility();
  }

  function el(tag, attrs) {
    const n = document.createElementNS(svgNS, tag);
    if (attrs) for (const k of Object.keys(attrs)) {
      const v = attrs[k];
      if (v == null) continue;
      if (k === "textContent") n.textContent = v;
      else n.setAttribute(k.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`), String(v));
    }
    return n;
  }

  function updateVisibility() {
    const inter = state.interactive;
    components.hourHand.style.display = state.mode === "interactive" && !inter.showHour ? "none" : "";
    components.minuteHand.style.display = state.mode === "interactive" && !inter.showMinute ? "none" : "";
    components.secondHand.style.display = (state.mode === "interactive" && !inter.showSecond) ? "none" : (state.mode === "normal" && !state.showSeconds ? "none" : "");
    components.numbers.style.display = state.mode === "interactive" && !inter.showNumbers ? "none" : "";
    
    // Show/hide interactive indicator and add class
    if (components.interactiveIndicator) {
      components.interactiveIndicator.style.display = state.mode === "interactive" ? "block" : "none";
    }
    
    // Add interactive class to SVG for styling
    if (state.mode === "interactive") {
      clockSvg.classList.add("interactive-mode");
    } else {
      clockSvg.classList.remove("interactive-mode");
    }
  }

  function tick(ts) {
    requestAnimationFrame(tick);
    if (!lastTickTs) lastTickTs = ts;
    const elapsed = ts - lastTickTs;
    if (elapsed < 16) return; // ~60fps
    lastTickTs = ts;

    if (state.mode === "normal") {
      drawNow();
    } else {
      drawInteractive();
    }
  }

  function drawNow() {
    const parts = getNowInTimeZone(state.timeZone);
    const h = parts.h;
    const m = parts.m;
    const s = parts.s; // integer seconds for stability

    const hourAngle = ((h % 12) + m / 60 + s / 3600) * 30; // 360/12
    const minuteAngle = (m + s / 60) * 6; // 360/60
    const secondAngle = s * 6;

    setRotation(components.hourHand, hourAngle);
    setRotation(components.minuteHand, minuteAngle);
    setRotation(components.secondHand, secondAngle);

    if (state.showDigital) {
      digitalEl.textContent = formatDigitalTZ(parts.date, state.hourCycle, state.showSeconds, state.timeZone);
    }
  }

  function drawInteractive() {
    const t = state.interactive.time;
    const s = t.s;
    const hourAngle = ((t.h % 12) + t.m / 60 + s / 3600) * 30;
    const minuteAngle = (t.m + s / 60) * 6;
    const secondAngle = s * 6;

    setRotation(components.hourHand, hourAngle);
    setRotation(components.minuteHand, minuteAngle);
    setRotation(components.secondHand, secondAngle);
    
    // Update digital display with interactive time
    if (state.showDigital) {
      const date = new Date();
      date.setHours(Math.floor(t.h), Math.floor(t.m), Math.floor(t.s));
      digitalEl.textContent = formatDigital(date, state.hourCycle, state.showSeconds);
    }
    
    // Show dotted circles at hand positions
    updateHandPositionIndicators();
  }
  
  function updateHandPositionIndicators() {
    if (state.mode !== "interactive") return;
    
    const t = state.interactive.time;
    const inter = state.interactive;
    
    // Show indicators for visible hands
    if (inter.showHour) updateHandIndicator("hour", ((t.h % 12) + t.m / 60) * 30, 80);
    if (inter.showMinute) updateHandIndicator("minute", t.m * 6, 110);
    if (inter.showSecond) updateHandIndicator("second", t.s * 6, 130);
  }
  
  function updateHandIndicator(type, deg, length) {
    const rad = (deg * Math.PI) / 180;
    const x = 200 + length * Math.sin(rad);
    const y = 200 - length * Math.cos(rad);
    
    let indicator = document.getElementById(`${type}-indicator`);
    if (!indicator) {
      indicator = el("circle", {
        id: `${type}-indicator`,
        r: 6,
        fill: "none",
        stroke: "var(--accent-2)",
        strokeWidth: 2,
        strokeDasharray: "3 3",
        opacity: 0.6
      });
      clockSvg.appendChild(indicator);
    }
    
    indicator.setAttribute("cx", String(x));
    indicator.setAttribute("cy", String(y));
  }

  function setRotation(lineEl, deg) {
    lineEl.setAttribute("transform", `rotate(${deg} 200 200)`);
  }

  function formatDigital(date, hourCycle, includeSeconds) {
    const opts = { hour: "2-digit", minute: "2-digit", second: includeSeconds ? "2-digit" : undefined, hour12: hourCycle === 12 };
    try {
      return new Intl.DateTimeFormat(undefined, opts).format(date);
    } catch {
      const h = date.getHours();
      const to2 = (n) => String(n).padStart(2, "0");
      if (hourCycle === 12) {
        const period = h >= 12 ? "PM" : "AM";
        const hr = h % 12 === 0 ? 12 : h % 12;
        return `${to2(hr)}:${to2(date.getMinutes())}${includeSeconds ? ":" + to2(date.getSeconds()) : ""} ${period}`;
      }
      return `${to2(h)}:${to2(date.getMinutes())}${includeSeconds ? ":" + to2(date.getSeconds()) : ""}`;
    }
  }

  function formatDigitalTZ(date, hourCycle, includeSeconds, tz) {
    const timeZone = tz === "auto" ? undefined : tz;
    const opts = { hour: "2-digit", minute: "2-digit", second: includeSeconds ? "2-digit" : undefined, hour12: hourCycle === 12, timeZone };
    try {
      return new Intl.DateTimeFormat(undefined, opts).format(date);
    } catch {
      return formatDigital(date, hourCycle, includeSeconds);
    }
  }

  function getNowInTimeZone(tz) {
    const date = new Date();
    if (tz === "auto") return { h: date.getHours(), m: date.getMinutes(), s: date.getSeconds(), date };
    try {
      const fmt = new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "numeric", minute: "numeric", second: "numeric", hour12: false });
      const parts = fmt.formatToParts(date);
      const get = (t) => Number(parts.find((p) => p.type === t)?.value || "0");
      return { h: get("hour"), m: get("minute"), s: get("second"), date };
    } catch {
      return { h: date.getHours(), m: date.getMinutes(), s: date.getSeconds(), date };
    }
  }

  // Interactive helpers
  function setInteractiveToNow() {
    const d = new Date();
    state.interactive.time = { h: d.getHours(), m: d.getMinutes(), s: d.getSeconds() };
  }

  function setInteractiveToRandom() {
    state.interactive.time = { h: Math.floor(Math.random() * 24), m: Math.floor(Math.random() * 60), s: 0 };
    if (!state.interactive.showSecond) state.interactive.time.s = 0;
    if (!state.interactive.showMinute) state.interactive.time.m = 0;
  }

  function speakCurrentInteractiveTime() {
    const { h, m } = state.interactive.time;
    const sentence = `The time is ${formatDigital(new Date(2000,0,1,h,m,0), 12, false)}.`;
    try {
      const u = new SpeechSynthesisUtterance(sentence);
      u.rate = 0.95;
      u.pitch = 1.0;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    } catch {}
  }

  function angleFromPointer(evt) {
    const pt = getLocalPoint(evt);
    const dx = pt.x - 200;
    const dy = pt.y - 200;
    const angle = Math.atan2(dx, -dy) * (180 / Math.PI); // 0 at 12 o'clock
    return (angle + 360) % 360;
  }

  function getLocalPoint(evt) {
    const rect = clockSvg.getBoundingClientRect();
    const x = evt.touches ? evt.touches[0].clientX : evt.clientX;
    const y = evt.touches ? evt.touches[0].clientY : evt.clientY;
    return { x: ((x - rect.left) / rect.width) * 400, y: ((y - rect.top) / rect.height) * 400 };
  }

  function enableDrag(handEl, type) {
    let dragging = false;

    const start = (e) => {
      if (state.mode !== "interactive" || !state.interactive.allowDrag) return;
      dragging = true;
      handEl.setAttribute("data-dragging", "true");
      e.preventDefault();
    };
    const move = (e) => {
      if (!dragging) return;
      const deg = angleFromPointer(e);
      const inter = state.interactive;
      if (type === "h") {
        const isPM = inter.time.h >= 12;
        if (inter.dragMode === "snapped") {
          // snap to nearest hour marker
          const hour = Math.round(deg / 30) % 12;
          inter.time.h = hour + (isPM ? 12 : 0);
        } else {
          // independent: continuous hour based on angle
          const hour = (deg / 30) % 12;
          inter.time.h = hour + (isPM ? 12 : 0);
        }
      } else if (type === "m") {
        const minute = Math.round(deg / 6) % 60;
        inter.time.m = minute;
        if (inter.dragMode === "snapped") {
          // move hour proportionally with minutes
          const currentHour = Math.floor(inter.time.h) % 12;
          const hourProgress = minute / 60;
          inter.time.h = currentHour + hourProgress;
        }
      } else if (type === "s") {
        const sec = Math.round(deg / 6) % 60;
        inter.time.s = sec;
      }

      if (inter.spotlight) updateSpotlight(type, deg);
    };
    const end = () => { 
      dragging = false; 
      handEl.removeAttribute("data-dragging");
      hideSpotlight(); 
    };

    handEl.addEventListener("mousedown", start);
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", end);
    handEl.addEventListener("touchstart", start, { passive: false });
    window.addEventListener("touchmove", move, { passive: false });
    window.addEventListener("touchend", end);
  }

  function updateSpotlight(type, deg) {
    // hand tip position along its line length
    const len = type === "h" ? 80 : type === "m" ? 110 : 130;
    const rad = (deg * Math.PI) / 180;
    const x = 200 + len * Math.sin(rad);
    const y = 200 - len * Math.cos(rad);
    spot.circle.setAttribute("cx", String(x));
    spot.circle.setAttribute("cy", String(y));
    spot.group.setAttribute("opacity", "1");

    // highlight closest number at multiples of 30deg
    const nearest = Math.round(((deg % 360) + 360) % 360 / 30) || 12;
    Array.from(components.numbers.children).forEach((n) => n.setAttribute("fill", "var(--text)"));
    const idx = nearest - 1;
    const targetText = components.numbers.children[idx];
    if (targetText) targetText.setAttribute("fill", "var(--accent-2)");
  }

  function hideSpotlight() {
    if (!spot) return;
    spot.group.setAttribute("opacity", "0");
    if (components?.numbers) Array.from(components.numbers.children).forEach((n) => n.setAttribute("fill", "var(--text)"));
  }

  // Learning Mode Functions
  function updateLearningProgress() {
    const totalLessons = Object.keys(LESSONS).length;
    const completedLessons = Object.keys(state.learning.progress).filter(lesson => 
      state.learning.progress[lesson] >= 3
    ).length;
    const progress = Math.round((completedLessons / totalLessons) * 100);
    
    progressFill.style.width = progress + '%';
    progressText.textContent = `Progress: ${progress}%`;

    // Update lesson buttons with stars
    lessonBtns.forEach(btn => {
      const lesson = btn.dataset.lesson;
      const stars = state.learning.progress[lesson] || 0;
      const starEl = btn.querySelector('.lesson-stars');
      starEl.textContent = '★'.repeat(stars) + '☆'.repeat(3 - stars);
      starEl.dataset.stars = stars;
      
      if (stars >= 3) {
        btn.classList.add('completed');
      }
    });
  }

  function selectLesson(lessonId) {
    state.learning.currentLesson = lessonId;
    state.learning.currentStep = 0;
    
    lessonBtns.forEach(btn => {
      btn.classList.toggle('selected', btn.dataset.lesson === lessonId);
    });
    
    // Show lesson preview
    const lesson = LESSONS[lessonId];
    if (lesson) {
      tutorialContent.innerHTML = `
        <div class="lesson-preview">
          <h4>${lesson.title}</h4>
          <p>This lesson will teach you about ${lesson.title.toLowerCase()}. Click "Start Lesson" to begin!</p>
          <div class="lesson-stats">
            <span class="stat-item">📚 ${lesson.steps.length} steps</span>
            <span class="stat-item">⭐ ${state.learning.progress[lessonId] || 0}/3 stars</span>
          </div>
        </div>
      `;
      tutorialContent.classList.add('active');
    }
    
    btnStartLesson.style.display = 'inline-block';
    btnNextStep.style.display = 'none';
    btnRepeat.style.display = 'none';
  }

  function startCurrentLesson() {
    if (!state.learning.currentLesson) return;
    
    const lesson = LESSONS[state.learning.currentLesson];
    if (!lesson) return;
    
    tutorialContent.classList.add('active');
    displayLessonStep();
    btnStartLesson.style.display = 'none';
    btnNextStep.style.display = 'inline-block';
    
    // Check for first lesson achievement
    checkAchievement('first_lesson');
  }

  function displayLessonStep() {
    const lesson = LESSONS[state.learning.currentLesson];
    const step = state.learning.currentStep;
    
    if (step < lesson.steps.length) {
      tutorialContent.innerHTML = `
        <div class="tutorial-step">
          <p><strong>Step ${step + 1}:</strong> ${lesson.steps[step]}</p>
        </div>
      `;
      
      // Show example time for certain steps
      if (step === lesson.steps.length - 1 && lesson.practice[0]) {
        const practice = lesson.practice[0];
        setClockTime(practice.h, practice.m, 0);
      }
    }
  }

  function nextLessonStep() {
    const lesson = LESSONS[state.learning.currentLesson];
    state.learning.currentStep++;
    
    if (state.learning.currentStep < lesson.steps.length) {
      displayLessonStep();
    } else {
      completeLesson();
    }
  }

  function completeLesson() {
    const lessonId = state.learning.currentLesson;
    const currentStars = state.learning.progress[lessonId] || 0;
    const newStars = Math.min(currentStars + 1, 3);
    
    state.learning.progress[lessonId] = newStars;
    saveProgress();
    updateLearningProgress();
    
    showFeedback(
      '🎉',
      'Lesson Complete!',
      '★'.repeat(newStars) + '☆'.repeat(3 - newStars)
    );
    
    // Check for lesson-specific achievements
    if (newStars >= 3) {
      checkAchievement(lessonId + '_master');
    }
    
    btnNextStep.style.display = 'none';
    btnStartLesson.style.display = 'inline-block';
    tutorialContent.classList.remove('active');
  }

  function repeatLesson() {
    if (!state.learning.currentLesson) return;
    state.learning.currentStep = 0;
    startCurrentLesson();
  }

  // Quiz Mode Functions
  function updateQuizStats() {
    quizScore.textContent = state.quiz.score;
    quizStreak.textContent = state.quiz.streak;
    quizBest.textContent = state.quiz.bestScore;
  }

  function startQuiz() {
    state.quiz.isActive = true;
    state.quiz.score = 0;
    state.quiz.streak = 0;
    generateQuizQuestion();
    btnStartQuiz.style.display = 'none';
    btnNextQuiz.style.display = 'inline-block';
    
    checkAchievement('quiz_starter');
  }

  function generateQuizQuestion() {
    const questions = QUIZ_QUESTIONS[state.quiz.difficulty];
    const question = questions[Math.floor(Math.random() * questions.length)];
    
    state.quiz.currentQuestion = question;
    
    if (state.quiz.type === 'read') {
      setClockTime(question.h, question.m, 0);
      quizQuestion.textContent = "What time does the clock show?";
      
      quizOptions.innerHTML = '';
      question.options.forEach((option, index) => {
        const btn = document.createElement('button');
        btn.className = 'quiz-option';
        btn.textContent = option;
        btn.addEventListener('click', () => selectQuizAnswer(index));
        quizOptions.appendChild(btn);
      });
    } else {
      // Set time type quiz
      const timeStr = formatTime12Hour(question.h, question.m);
      quizQuestion.textContent = `Set the clock to ${timeStr}`;
      quizOptions.innerHTML = '<p>Drag the clock hands to set the time, then click Next.</p>';
      
      // Switch to interactive mode for setting
      state.interactive.time = { h: 6, m: 0, s: 0 };
    }
    
    quizFeedback.innerHTML = '';
    quizFeedback.className = 'quiz-feedback';
  }

  function selectQuizAnswer(selectedIndex) {
    const question = state.quiz.currentQuestion;
    const correct = selectedIndex === question.correct;
    
    // Update options display
    Array.from(quizOptions.children).forEach((option, index) => {
      option.classList.remove('correct', 'incorrect');
      if (index === question.correct) {
        option.classList.add('correct');
      } else if (index === selectedIndex) {
        option.classList.add('incorrect');
      }
      option.disabled = true;
    });
    
    // Update feedback
    if (correct) {
      state.quiz.score++;
      state.quiz.streak++;
      quizFeedback.textContent = 'Correct! Well done!';
      quizFeedback.className = 'quiz-feedback correct';
      playSound('success');
    } else {
      state.quiz.streak = 0;
      quizFeedback.textContent = `Incorrect. The answer is ${question.options[question.correct]}.`;
      quizFeedback.className = 'quiz-feedback incorrect';
      playSound('error');
    }
    
    updateQuizStats();
    
    // Check for achievements
    if (state.quiz.streak >= 10) {
      checkAchievement('perfect_score');
    }
    
    if (state.quiz.score > state.quiz.bestScore) {
      state.quiz.bestScore = state.quiz.score;
      saveProgress();
    }
  }

  function nextQuizQuestion() {
    generateQuizQuestion();
  }

  // Game Mode Functions
  function updateGameStats() {
    raceBest.textContent = state.games.raceTime ? state.games.raceTime + 's' : '--';
    detectiveBest.textContent = state.games.detectiveScore + '%';
    memoryBest.textContent = state.games.memoryScore + '';
  }

  function startGame(gameType) {
    state.games.currentGame = gameType;
    gameArea.classList.add('active');
    
    switch (gameType) {
      case 'race':
        startRaceGame();
        break;
      case 'detective':
        startDetectiveGame();
        break;
      case 'memory':
        startMemoryGame();
        break;
    }
  }

  function startRaceGame() {
    const startTime = Date.now();
    let completedTimes = 0;
    const targetTimes = [
      { h: 3, m: 0 }, { h: 6, m: 30 }, { h: 9, m: 15 }, { h: 12, m: 45 }, { h: 2, m: 20 }
    ];
    
    function nextTarget() {
      if (completedTimes >= targetTimes.length) {
        const totalTime = Math.round((Date.now() - startTime) / 1000);
        if (!state.games.raceTime || totalTime < state.games.raceTime) {
          state.games.raceTime = totalTime;
          saveProgress();
          updateGameStats();
          
          if (totalTime <= 30) {
            checkAchievement('speed_demon');
          }
        }
        
        showFeedback('🏁', `Race Complete!`, `Time: ${totalTime}s`);
        gameArea.classList.remove('active');
        return;
      }
      
      const target = targetTimes[completedTimes];
      gameArea.innerHTML = `
        <h4>Race the Clock</h4>
        <p>Set the clock to: <strong>${formatTime12Hour(target.h, target.m)}</strong></p>
        <p>Completed: ${completedTimes}/${targetTimes.length}</p>
        <button onclick="checkRaceTime(${target.h}, ${target.m})">Check Time</button>
      `;
    }
    
    window.checkRaceTime = (targetH, targetM) => {
      const current = state.interactive.time;
      if (current.h === targetH && current.m === targetM) {
        completedTimes++;
        playSound('success');
        nextTarget();
      } else {
        playSound('error');
        gameArea.innerHTML += '<p style="color: var(--danger)">Try again!</p>';
      }
    };
    
    nextTarget();
  }

  function startDetectiveGame() {
    const activities = [
      { time: '7:00 AM', activity: 'Wake up', options: ['Wake up', 'Lunch time', 'Bedtime', 'Dinner time'] },
      { time: '12:00 PM', activity: 'Lunch time', options: ['Breakfast', 'Lunch time', 'Snack time', 'Midnight'] },
      { time: '3:00 PM', activity: 'Snack time', options: ['Breakfast', 'Dinner', 'Snack time', 'Sleep'] },
      { time: '8:00 PM', activity: 'Bedtime', options: ['Wake up', 'Lunch', 'School time', 'Bedtime'] },
    ];
    
    let currentQ = 0;
    let correct = 0;
    
    function nextQuestion() {
      if (currentQ >= activities.length) {
        const score = Math.round((correct / activities.length) * 100);
        if (score > state.games.detectiveScore) {
          state.games.detectiveScore = score;
          saveProgress();
          updateGameStats();
          
          if (score >= 80) {
            checkAchievement('detective');
          }
        }
        
        showFeedback('🕵️', 'Detective Work Complete!', `Score: ${score}%`);
        gameArea.classList.remove('active');
        return;
      }
      
      const q = activities[currentQ];
      gameArea.innerHTML = `
        <h4>Time Detective</h4>
        <p>What activity usually happens at <strong>${q.time}</strong>?</p>
        <div class="quiz-options">
          ${q.options.map((option, i) => 
            `<button class="quiz-option" onclick="answerDetective(${i})">${option}</button>`
          ).join('')}
        </div>
        <p>Question ${currentQ + 1} of ${activities.length}</p>
      `;
    }
    
    window.answerDetective = (selected) => {
      const q = activities[currentQ];
      if (q.options[selected] === q.activity) {
        correct++;
        playSound('success');
      } else {
        playSound('error');
      }
      currentQ++;
      setTimeout(nextQuestion, 1000);
    };
    
    nextQuestion();
  }

  function startMemoryGame() {
    // Simple memory game with time patterns
    gameArea.innerHTML = `
      <h4>Time Memory</h4>
      <p>Memory game coming soon! 🧠</p>
      <button onclick="gameArea.classList.remove('active')">Close</button>
    `;
  }

  // Helper Functions
  function setClockTime(h, m, s) {
    if (state.mode === 'interactive' || state.mode === 'learn' || state.mode === 'quiz') {
      state.interactive.time = { h, m, s };
    }
  }

  function formatTime12Hour(h, m) {
    const period = h >= 12 ? 'PM' : 'AM';
    const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
  }

  function showFeedback(icon, text, stars) {
    feedbackIcon.textContent = icon;
    feedbackText.textContent = text;
    feedbackStars.textContent = stars;
    feedbackOverlay.classList.add('show');
    
    setTimeout(() => {
      hideFeedback();
    }, 3000);
  }

  function hideFeedback() {
    feedbackOverlay.classList.remove('show');
  }

  function checkAchievement(achievementId) {
    if (state.learning.achievements.includes(achievementId)) return;
    
    const achievement = ACHIEVEMENTS.find(a => a.id === achievementId);
    if (!achievement) return;
    
    state.learning.achievements.push(achievementId);
    saveProgress();
    showAchievement(achievement);
  }

  function showAchievement(achievement) {
    const desc = achievementToast.querySelector('.achievement-desc');
    desc.textContent = achievement.desc;
    
    const icon = achievementToast.querySelector('.achievement-icon');
    icon.textContent = achievement.icon;
    
    achievementToast.classList.add('show');
    playSound('achievement');
    
    setTimeout(() => {
      achievementToast.classList.remove('show');
    }, 4000);
  }

  function playSound(type) {
    // Simple audio feedback using Web Audio API
    try {
      if (!window.AudioContext && !window.webkitAudioContext) return;
      
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Handle suspended audio context (Chrome requires user interaction)
      if (audioContext.state === 'suspended') {
        audioContext.resume().catch(() => {
          // Silently fail if audio can't be resumed
        });
      }
      
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      switch (type) {
        case 'success':
          oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
          oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1); // E5
          break;
        case 'error':
          oscillator.frequency.setValueAtTime(220, audioContext.currentTime); // A3
          oscillator.frequency.setValueAtTime(196, audioContext.currentTime + 0.1); // G3
          break;
        case 'achievement':
          oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // A4
          oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime + 0.1); // C5
          oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.2); // E5
          break;
        default:
          return; // Unknown type, exit early
      }
      
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.3);
      
      // Clean up after sound completes
      setTimeout(() => {
        try {
          audioContext.close();
        } catch (e) {
          // Ignore cleanup errors
        }
      }, 500);
      
    } catch (error) {
      // Silently fail for audio issues
      console.debug('Audio playback failed:', error);
    }
  }

  // Add error boundaries for critical functions
  function safeExecute(fn, fallback = () => {}) {
    try {
      return fn();
    } catch (error) {
      console.error('Function execution failed:', error);
      return fallback();
    }
  }

  // Add global error handler for unhandled errors
  window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    // Show user-friendly message for critical errors
    if (event.error && event.error.message.includes('localStorage')) {
      showFeedback('⚠️', 'Storage Error', 'Your progress may not be saved');
    }
  });

  // Handle AdSense loading
  function initAds() {
    // Check if ads are loaded and showing
    setTimeout(() => {
      const adBanner = document.getElementById('adBanner');
      const adContent = adBanner?.querySelector('ins');
      
      if (adContent && adContent.innerHTML && adContent.innerHTML.trim() !== '') {
        // Ads are loaded, show banner and adjust layout
        adBanner.classList.add('has-ads');
        document.body.classList.add('ads-on');
      } else {
        // No ads, keep banner hidden and show footer
        adBanner.classList.remove('has-ads');
        document.body.classList.remove('ads-on');
      }
    }, 2000); // Check after 2 seconds
  }

  // Initialize ads check
  if (window.adsbygoogle) {
    initAds();
  } else {
    // Wait for AdSense to load
    window.addEventListener('load', initAds);
  }

  // Init
  init();
})();


