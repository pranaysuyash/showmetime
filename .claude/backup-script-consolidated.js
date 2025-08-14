/* TimeLab — Interactive Analog Clock (Consolidated & Fixed Version) */
(() => {
  'use strict';

  const state = {
    mode: "normal", // "normal" | "interactive" | "learn" | "quiz" | "games"
    showDigital: true,
    showSeconds: true,
    hourCycle: 24, // 12 | 24
    theme: "blue",
    timeZone: "auto",

    // Interactive mode state
    interactive: {
      showHour: true,
      showMinute: true,
      showSecond: false,
      showNumbers: true,
      allowDrag: true,
      dragMode: "free", // "free" | "snap"
      showIndicators: true,
      time: { h: 10, m: 10, s: 0 }
    },

    // Learning progress
    learning: {
      currentLesson: null,
      currentStep: 0,
      progress: {},
      achievements: []
    },

    // Quiz state
    quiz: {
      score: 0,
      streak: 0,
      bestScore: 0,
      difficulty: "easy",
      type: "read",
      currentQuestion: null,
      isActive: false
    },

    // Games state
    games: {
      raceTime: null,
      detectiveScore: 0,
      memoryScore: 0,
      currentGame: null
    }
  };

  const svgNS = "http://www.w3.org/2000/svg";
  let clockSvg = null;
  let components = null;
  let dragState = null;
  let animationFrame = null;

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init() {
    clockSvg = document.getElementById("clockSvg");
    if (!clockSvg) {
      console.error("Clock SVG element not found");
      return;
    }

    loadProgress();
    buildClock();
    wireUI();
    startAnimation();
  }

  function buildClock() {
    clockSvg.innerHTML = "";
    
    // Create definitions for gradients and filters
    const defs = createSVGElement("defs");
    
    // Clock face gradient
    const faceGradient = createGradient("clockFaceGradient", [
      { offset: "0%", color: "rgba(79, 127