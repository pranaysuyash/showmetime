/* TimeLab Learning Module - Extracted for performance */
(() => {
  "use strict";

  // Lesson content
  const LESSONS = {
    "oclock": {
      title: "O'Clock Times",
      icon: "🕐",
      steps: [
        "When the minute hand points to 12, we say 'o'clock'",
        "The hour hand points to the number for that hour",
        "Try setting the clock to 3 o'clock!"
      ],
      practice: [
        { h: 3, m: 0 },
        { h: 7, m: 0 },
        { h: 12, m: 0 }
      ]
    },
    "half-past": {
      title: "Half Past",
      icon: "🕕",
      steps: [
        "Half past means 30 minutes after the hour",
        "The minute hand points to 6",
        "Try setting the clock to half past 2!"
      ],
      practice: [
        { h: 2, m: 30 },
        { h: 5, m: 30 },
        { h: 9, m: 30 }
      ]
    },
    "quarter": {
      title: "Quarter Past/To",
      icon: "🕒",
      steps: [
        "Quarter past means 15 minutes after",
        "Quarter to means 15 minutes before",
        "Try both quarter past and quarter to!"
      ],
      practice: [
        { h: 3, m: 15 },
        { h: 6, m: 45 },
        { h: 10, m: 15 }
      ]
    },
    "five-minute": {
      title: "5-Minute Times",
      icon: "🕓",
      steps: [
        "Each number represents 5 minutes",
        "Count by 5s around the clock",
        "Practice different 5-minute times!"
      ],
      practice: [
        { h: 4, m: 20 },
        { h: 8, m: 35 },
        { h: 11, m: 50 }
      ]
    }
  };

  // Learning functions
  function selectLesson(lessonId) {
    if (!window.TimeLab) return;
    const { state } = window.TimeLab;
    
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
    if (!window.TimeLab) return;
    const { state } = window.TimeLab;
    
    if (!state.learning.currentLesson) return;
    displayLessonStep();
    
    // Update buttons
    const btnStartLesson = document.getElementById('btnStartLesson');
    const btnNextStep = document.getElementById('btnNextStep');
    if (btnStartLesson) btnStartLesson.style.display = 'none';
    if (btnNextStep) btnNextStep.style.display = 'inline-block';
  }

  function displayLessonStep() {
    if (!window.TimeLab) return;
    const { state } = window.TimeLab;
    
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
    if (!window.TimeLab) return;
    const { state } = window.TimeLab;
    
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
    if (!window.TimeLab) return;
    const { state, showFeedback, updateLearningProgress } = window.TimeLab;
    
    const lessonId = state.learning.currentLesson;
    
    // Update progress
    if (!state.learning.progress[lessonId]) {
      state.learning.progress[lessonId] = 0;
    }
    state.learning.progress[lessonId] = Math.min(state.learning.progress[lessonId] + 1, 3);
    
    // Update learning system with enhanced tracking
    if (window.learningSystem) {
      const sessionTime = 5000; // Default session time
      window.learningSystem.recordPracticeSession(lessonId, true, sessionTime);
      
      // Check for achievements
      const newAchievements = window.learningSystem.checkAchievements();
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
  }

  function updateLearningProgress() {
    if (!window.TimeLab) return;
    const { state } = window.TimeLab;
    
    const lessonBtns = document.querySelectorAll('.lesson-btn');
    lessonBtns.forEach(btn => {
      const lessonId = btn.dataset.lesson;
      const progress = state.learning.progress[lessonId] || 0;
      const starsEl = btn.querySelector('.lesson-stars');
      
      if (starsEl) {
        starsEl.innerHTML = '★'.repeat(progress) + '☆'.repeat(3 - progress);
      }
    });
  }

  // Expose to global scope
  window.TimeLabLearning = {
    selectLesson,
    startLesson,
    displayLessonStep,
    nextLessonStep,
    completeLesson,
    updateLearningProgress,
    LESSONS
  };

})();