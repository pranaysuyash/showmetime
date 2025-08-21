/* TimeLab Quiz Module - Extracted for performance */
(() => {
  "use strict";

  // Quiz questions data
  const QUIZ_QUESTIONS = {
    easy: [
      { h: 3, m: 0, options: ["3:00", "4:00", "2:00", "12:00"], correct: 0 },
      { h: 6, m: 0, options: ["5:00", "6:00", "7:00", "12:00"], correct: 1 },
      { h: 9, m: 0, options: ["8:00", "10:00", "9:00", "3:00"], correct: 2 },
      { h: 12, m: 0, options: ["12:00", "1:00", "11:00", "6:00"], correct: 0 }
    ],
    medium: [
      { h: 2, m: 30, options: ["2:30", "2:15", "3:00", "2:45"], correct: 0 },
      { h: 7, m: 15, options: ["7:30", "7:15", "7:45", "8:15"], correct: 1 },
      { h: 4, m: 45, options: ["4:15", "5:15", "4:45", "4:30"], correct: 2 },
      { h: 10, m: 30, options: ["10:15", "11:00", "10:45", "10:30"], correct: 3 }
    ],
    hard: [
      { h: 1, m: 25, options: ["1:25", "1:20", "1:30", "1:35"], correct: 0 },
      { h: 5, m: 40, options: ["5:35", "5:40", "5:45", "6:40"], correct: 1 },
      { h: 8, m: 55, options: ["8:50", "9:55", "8:55", "8:45"], correct: 2 },
      { h: 11, m: 10, options: ["11:05", "11:15", "12:10", "11:10"], correct: 3 }
    ]
  };

  // Quiz functions
  function startQuiz() {
    if (!window.TimeLab) return;
    const { state, showFeedback, updateQuizStats } = window.TimeLab;
    
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
    if (!window.TimeLab) return;
    const { state } = window.TimeLab;
    
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
    if (!window.TimeLab) return;
    const { state, showFeedback, updateQuizStats } = window.TimeLab;
    
    const question = state.quiz.currentQuestion;
    const isCorrect = index === question.correct;
    const responseTime = Date.now() - state.quiz.questionStartTime;
    
    // Update statistics
    state.quiz.totalQuestions++;
    if (isCorrect) {
      state.quiz.correctAnswers++;
      state.quiz.score += 10;
      state.quiz.streak++;
      state.quiz.bestStreak = Math.max(state.quiz.bestStreak, state.quiz.streak);
      showFeedback('✓', 'Correct!');
    } else {
      state.quiz.streak = 0;
      showFeedback('✗', `Incorrect. The answer was ${question.options[question.correct]}`);
    }
    
    // Record with learning system
    if (window.learningSystem && question.concept) {
      window.learningSystem.recordQuizAttempt(question.concept, isCorrect, responseTime);
    }
    
    // Visual feedback
    const options = document.querySelectorAll('.quiz-option');
    options.forEach((option, i) => {
      if (i === index) {
        option.classList.add(isCorrect ? 'correct' : 'incorrect');
      } else if (i === question.correct) {
        option.classList.add('correct');
      }
      option.disabled = true;
    });
    
    updateQuizStats();
  }

  function nextQuizQuestion() {
    if (!window.TimeLab) return;
    
    generateQuizQuestion();
  }

  // Expose to global scope
  window.TimeLabQuiz = {
    startQuiz,
    generateQuizQuestion,
    selectQuizAnswer,
    nextQuizQuestion,
    QUIZ_QUESTIONS
  };

})();