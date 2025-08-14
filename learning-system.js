// ===================================
// TIMELAB LOCALSTORAGE MANAGER
// ===================================

class TimeLearningSystem {
  constructor() {
    this.storageKey = 'timelab_data';
    this.data = this.loadData();
    this.initializeDefaults();
  }

  // ===================================
  // CORE DATA MANAGEMENT
  // ===================================
  
  loadData() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : {};
    } catch (e) {
      console.error('Failed to load data:', e);
      return {};
    }
  }

  saveData() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.data));
      return true;
    } catch (e) {
      console.error('Failed to save data:', e);
      return false;
    }
  }

  initializeDefaults() {
    const defaults = {
      // User Profile
      profile: {
        name: '',
        avatar: 'default',
        age: null,
        grade: null,
        createdAt: this.data.profile?.createdAt || Date.now(),
        lastActive: Date.now()
      },

      // Learning Progress
      learning: {
        currentLevel: this.data.learning?.currentLevel || 1,
        totalPoints: this.data.learning?.totalPoints || 0,
        lessonsCompleted: this.data.learning?.lessonsCompleted || [],
        currentStreak: this.data.learning?.currentStreak || 0,
        longestStreak: this.data.learning?.longestStreak || 0,
        lastPracticeDate: this.data.learning?.lastPracticeDate || null,
        
        // Detailed progress for each concept
        concepts: {
          oclock: { mastery: 0, attempts: 0, correctAnswers: 0, averageTime: 0 },
          halfPast: { mastery: 0, attempts: 0, correctAnswers: 0, averageTime: 0 },
          quarterPast: { mastery: 0, attempts: 0, correctAnswers: 0, averageTime: 0 },
          quarterTo: { mastery: 0, attempts: 0, correctAnswers: 0, averageTime: 0 },
          fiveMinutes: { mastery: 0, attempts: 0, correctAnswers: 0, averageTime: 0 },
          anyTime: { mastery: 0, attempts: 0, correctAnswers: 0, averageTime: 0 },
          ...this.data.learning?.concepts
        }
      },

      // Practice History
      practiceHistory: this.data.practiceHistory || [],

      // Achievements
      achievements: {
        unlocked: this.data.achievements?.unlocked || [],
        progress: this.data.achievements?.progress || {},
        recentUnlocks: this.data.achievements?.recentUnlocks || []
      },

      // Game Records
      games: {
        raceTheClock: {
          bestTime: this.data.games?.raceTheClock?.bestTime || null,
          totalPlays: this.data.games?.raceTheClock?.totalPlays || 0,
          perfectGames: this.data.games?.raceTheClock?.perfectGames || 0,
          history: this.data.games?.raceTheClock?.history || []
        },
        timeDetective: {
          highScore: this.data.games?.timeDetective?.highScore || 0,
          totalPlays: this.data.games?.timeDetective?.totalPlays || 0,
          perfectScores: this.data.games?.timeDetective?.perfectScores || 0,
          history: this.data.games?.timeDetective?.history || []
        },
        memoryMatch: {
          bestTime: this.data.games?.memoryMatch?.bestTime || null,
          bestMoves: this.data.games?.memoryMatch?.bestMoves || null,
          totalPlays: this.data.games?.memoryMatch?.totalPlays || 0,
          history: this.data.games?.memoryMatch?.history || []
        }
      },

      // Custom Challenges
      customChallenges: this.data.customChallenges || [],

      // Study Schedule
      studySchedule: {
        enabled: this.data.studySchedule?.enabled || false,
        dailyGoal: this.data.studySchedule?.dailyGoal || 15, // minutes
        reminderTime: this.data.studySchedule?.reminderTime || '16:00',
        preferredDays: this.data.studySchedule?.preferredDays || [1,2,3,4,5], // weekdays
        completedToday: this.data.studySchedule?.completedToday || false
      },

      // Preferences
      preferences: {
        theme: this.data.preferences?.theme || 'blue',
        soundEnabled: this.data.preferences?.soundEnabled !== false,
        animationsEnabled: this.data.preferences?.animationsEnabled !== false,
        difficulty: this.data.preferences?.difficulty || 'medium',
        language: this.data.preferences?.language || 'en',
        hourFormat: this.data.preferences?.hourFormat || 24,
        showSeconds: this.data.preferences?.showSeconds !== false,
        autoAdvance: this.data.preferences?.autoAdvance || false
      },

      // Offline Worksheets
      worksheets: {
        generated: this.data.worksheets?.generated || [],
        completed: this.data.worksheets?.completed || [],
        templates: this.data.worksheets?.templates || []
      },

      // Time Zones Collection
      timeZones: {
        favorites: this.data.timeZones?.favorites || [],
        recentlyViewed: this.data.timeZones?.recentlyViewed || [],
        customLocations: this.data.timeZones?.customLocations || []
      },

      // Analytics
      analytics: {
        totalPracticeTime: this.data.analytics?.totalPracticeTime || 0,
        sessionsCount: this.data.analytics?.sessionsCount || 0,
        averageSessionLength: this.data.analytics?.averageSessionLength || 0,
        mostPracticedConcept: this.data.analytics?.mostPracticedConcept || null,
        weakestConcept: this.data.analytics?.weakestConcept || null,
        dailyStats: this.data.analytics?.dailyStats || {},
        weeklyProgress: this.data.analytics?.weeklyProgress || []
      }
    };

    // Merge with existing data
    this.data = { ...defaults, ...this.data };
  }

  // ===================================
  // LEARNING METHODS
  // ===================================

  recordPracticeSession(concept, correct, timeSpent) {
    const session = {
      concept,
      correct,
      timeSpent,
      timestamp: Date.now(),
      date: new Date().toISOString().split('T')[0]
    };

    // Update concept stats
    if (this.data.learning.concepts[concept]) {
      const conceptData = this.data.learning.concepts[concept];
      conceptData.attempts++;
      if (correct) conceptData.correctAnswers++;
      
      // Update average time
      const totalTime = conceptData.averageTime * (conceptData.attempts - 1) + timeSpent;
      conceptData.averageTime = totalTime / conceptData.attempts;
      
      // Calculate mastery (weighted formula)
      const accuracy = conceptData.correctAnswers / conceptData.attempts;
      const speed = Math.max(0, 1 - (conceptData.averageTime / 30000)); // 30 seconds baseline
      conceptData.mastery = Math.round((accuracy * 0.7 + speed * 0.3) * 100);
    }

    // Add to practice history
    this.data.practiceHistory.push(session);
    
    // Keep only last 1000 sessions
    if (this.data.practiceHistory.length > 1000) {
      this.data.practiceHistory = this.data.practiceHistory.slice(-1000);
    }

    // Update streak
    this.updateStreak();

    // Award points
    if (correct) {
      const points = this.calculatePoints(concept, timeSpent);
      this.data.learning.totalPoints += points;
    }

    // Check for achievements
    this.checkAchievements();

    // Update analytics
    this.updateAnalytics(session);

    this.saveData();
    return session;
  }

  updateStreak() {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    if (this.data.learning.lastPracticeDate === today) {
      // Already practiced today
      return;
    } else if (this.data.learning.lastPracticeDate === yesterday) {
      // Continuing streak
      this.data.learning.currentStreak++;
    } else {
      // Streak broken
      this.data.learning.currentStreak = 1;
    }

    this.data.learning.lastPracticeDate = today;
    this.data.learning.longestStreak = Math.max(
      this.data.learning.longestStreak,
      this.data.learning.currentStreak
    );
  }

  calculatePoints(concept, timeSpent) {
    const basePoints = 10;
    const difficultyMultiplier = {
      'oclock': 1,
      'halfPast': 1.2,
      'quarterPast': 1.5,
      'quarterTo': 1.5,
      'fiveMinutes': 2,
      'anyTime': 2.5
    };

    const speedBonus = timeSpent < 5000 ? 5 : timeSpent < 10000 ? 3 : 0;
    const streakBonus = Math.min(this.data.learning.currentStreak, 10);

    return Math.round(
      basePoints * (difficultyMultiplier[concept] || 1) + speedBonus + streakBonus
    );
  }

  // ===================================
  // ACHIEVEMENT SYSTEM
  // ===================================

  checkAchievements() {
    const achievements = [
      {
        id: 'first_timer',
        name: 'First Timer',
        description: 'Complete your first practice session',
        condition: () => this.data.practiceHistory.length >= 1
      },
      {
        id: 'oclock_master',
        name: "O'Clock Master",
        description: "Master o'clock times (90% mastery)",
        condition: () => this.data.learning.concepts.oclock.mastery >= 90
      },
      {
        id: 'week_warrior',
        name: 'Week Warrior',
        description: 'Practice 7 days in a row',
        condition: () => this.data.learning.currentStreak >= 7
      },
      {
        id: 'century_club',
        name: 'Century Club',
        description: 'Score 100 points',
        condition: () => this.data.learning.totalPoints >= 100
      },
      {
        id: 'speed_demon',
        name: 'Speed Demon',
        description: 'Complete 10 problems in under 5 seconds each',
        condition: () => {
          const recentFast = this.data.practiceHistory
            .slice(-10)
            .filter(s => s.correct && s.timeSpent < 5000);
          return recentFast.length >= 10;
        }
      },
      {
        id: 'perfect_score',
        name: 'Perfect Score',
        description: 'Get 20 correct answers in a row',
        condition: () => {
          const recent = this.data.practiceHistory.slice(-20);
          return recent.length >= 20 && recent.every(s => s.correct);
        }
      },
      {
        id: 'time_traveler',
        name: 'Time Traveler',
        description: 'Practice with 5 different time zones',
        condition: () => this.data.timeZones.favorites.length >= 5
      },
      {
        id: 'dedicated_learner',
        name: 'Dedicated Learner',
        description: 'Practice for 30 days total',
        condition: () => {
          const uniqueDays = new Set(
            this.data.practiceHistory.map(s => s.date)
          );
          return uniqueDays.size >= 30;
        }
      }
    ];

    achievements.forEach(achievement => {
      if (!this.data.achievements.unlocked.includes(achievement.id)) {
        if (achievement.condition()) {
          this.unlockAchievement(achievement);
        }
      }
    });
  }

  unlockAchievement(achievement) {
    this.data.achievements.unlocked.push(achievement.id);
    this.data.achievements.recentUnlocks.push({
      ...achievement,
      unlockedAt: Date.now()
    });

    // Keep only last 5 recent unlocks
    if (this.data.achievements.recentUnlocks.length > 5) {
      this.data.achievements.recentUnlocks.shift();
    }

    // Award bonus points
    this.data.learning.totalPoints += 50;

    this.saveData();
    return achievement;
  }

  // ===================================
  // ANALYTICS & REPORTS
  // ===================================

  updateAnalytics(session) {
    const date = session.date;
    
    // Daily stats
    if (!this.data.analytics.dailyStats[date]) {
      this.data.analytics.dailyStats[date] = {
        sessions: 0,
        correct: 0,
        incorrect: 0,
        totalTime: 0,
        concepts: {}
      };
    }

    const daily = this.data.analytics.dailyStats[date];
    daily.sessions++;
    daily.totalTime += session.timeSpent;
    if (session.correct) daily.correct++;
    else daily.incorrect++;

    if (!daily.concepts[session.concept]) {
      daily.concepts[session.concept] = { attempts: 0, correct: 0 };
    }
    daily.concepts[session.concept].attempts++;
    if (session.correct) daily.concepts[session.concept].correct++;

    // Overall analytics
    this.data.analytics.totalPracticeTime += session.timeSpent;
    this.data.analytics.sessionsCount++;
    this.data.analytics.averageSessionLength = 
      this.data.analytics.totalPracticeTime / this.data.analytics.sessionsCount;

    // Find weakest concept
    let weakest = null;
    let lowestMastery = 100;
    
    Object.entries(this.data.learning.concepts).forEach(([concept, data]) => {
      if (data.attempts > 0 && data.mastery < lowestMastery) {
        lowestMastery = data.mastery;
        weakest = concept;
      }
    });
    
    this.data.analytics.weakestConcept = weakest;

    // Find most practiced
    let mostPracticed = null;
    let maxAttempts = 0;
    
    Object.entries(this.data.learning.concepts).forEach(([concept, data]) => {
      if (data.attempts > maxAttempts) {
        maxAttempts = data.attempts;
        mostPracticed = concept;
      }
    });
    
    this.data.analytics.mostPracticedConcept = mostPracticed;
  }

  // ===================================
  // REPORT GENERATION
  // ===================================

  generateProgressReport() {
    const report = {
      summary: {
        name: this.data.profile.name || 'Student',
        level: this.data.learning.currentLevel,
        totalPoints: this.data.learning.totalPoints,
        currentStreak: this.data.learning.currentStreak,
        totalSessions: this.data.analytics.sessionsCount,
        totalPracticeTime: this.formatTime(this.data.analytics.totalPracticeTime),
        achievementsUnlocked: this.data.achievements.unlocked.length
      },
      
      conceptMastery: Object.entries(this.data.learning.concepts).map(([concept, data]) => ({
        concept,
        mastery: data.mastery,
        attempts: data.attempts,
        accuracy: data.attempts > 0 ? Math.round((data.correctAnswers / data.attempts) * 100) : 0,
        averageTime: this.formatTime(data.averageTime)
      })),

      recentActivity: this.getRecentActivity(),
      
      recommendations: this.getRecommendations(),
      
      achievements: this.data.achievements.unlocked,
      
      gameStats: {
        raceTheClock: this.data.games.raceTheClock,
        timeDetective: this.data.games.timeDetective,
        memoryMatch: this.data.games.memoryMatch
      }
    };

    return report;
  }

  getRecentActivity(days = 7) {
    const cutoff = Date.now() - (days * 86400000);
    return this.data.practiceHistory
      .filter(s => s.timestamp > cutoff)
      .map(s => ({
        ...s,
        date: new Date(s.timestamp).toLocaleDateString(),
        time: new Date(s.timestamp).toLocaleTimeString()
      }));
  }

  getRecommendations() {
    const recommendations = [];
    
    // Check for weak areas
    if (this.data.analytics.weakestConcept) {
      recommendations.push({
        type: 'practice',
        priority: 'high',
        message: `Focus on practicing ${this.data.analytics.weakestConcept} to improve mastery`,
        concept: this.data.analytics.weakestConcept
      });
    }

    // Check for streak
    if (this.data.learning.currentStreak === 0) {
      recommendations.push({
        type: 'motivation',
        priority: 'medium',
        message: 'Start a new practice streak today!'
      });
    } else if (this.data.learning.currentStreak > 0 && this.data.learning.currentStreak < 7) {
      recommendations.push({
        type: 'motivation',
        priority: 'medium',
        message: `Keep going! ${7 - this.data.learning.currentStreak} more days to unlock Week Warrior achievement`
      });
    }

    // Check for unmastered concepts
    Object.entries(this.data.learning.concepts).forEach(([concept, data]) => {
      if (data.attempts > 10 && data.mastery < 70) {
        recommendations.push({
          type: 'review',
          priority: 'high',
          message: `Review the lesson for ${concept}`,
          concept
        });
      }
    });

    return recommendations;
  }

  // ===================================
  // WORKSHEET GENERATION
  // ===================================

  generateWorksheet(options = {}) {
    const {
      concepts = ['oclock', 'halfPast'],
      difficulty = 'medium',
      questionCount = 10,
      includeAnswers = true
    } = options;

    const worksheet = {
      id: Date.now().toString(),
      createdAt: Date.now(),
      title: `Time Practice Worksheet - ${new Date().toLocaleDateString()}`,
      difficulty,
      questions: [],
      answers: includeAnswers ? [] : null
    };

    for (let i = 0; i < questionCount; i++) {
      const concept = concepts[Math.floor(Math.random() * concepts.length)];
      const question = this.generateQuestion(concept, difficulty);
      worksheet.questions.push(question);
      if (includeAnswers) {
        worksheet.answers.push(question.answer);
      }
    }

    // Save to worksheets
    this.data.worksheets.generated.push({
      id: worksheet.id,
      createdAt: worksheet.createdAt,
      title: worksheet.title,
      questionCount,
      concepts,
      difficulty
    });

    this.saveData();
    return worksheet;
  }

  generateQuestion(concept, difficulty) {
    const hour = Math.floor(Math.random() * 12) + 1;
    let minute = 0;
    let question = {};

    switch (concept) {
      case 'oclock':
        minute = 0;
        question = {
          type: 'oclock',
          hour,
          minute,
          display: `${hour}:00`,
          answer: `${hour} o'clock`,
          instruction: 'What time is shown?'
        };
        break;

      case 'halfPast':
        minute = 30;
        question = {
          type: 'halfPast',
          hour,
          minute,
          display: `${hour}:30`,
          answer: `Half past ${hour}`,
          instruction: 'What time is shown?'
        };
        break;

      case 'quarterPast':
        minute = 15;
        question = {
          type: 'quarterPast',
          hour,
          minute,
          display: `${hour}:15`,
          answer: `Quarter past ${hour}`,
          instruction: 'What time is shown?'
        };
        break;

      case 'quarterTo': {
        minute = 45;
        const nextHour = hour === 12 ? 1 : hour + 1;
        question = {
          type: 'quarterTo',
          hour,
          minute,
          display: `${hour}:45`,
          answer: `Quarter to ${nextHour}`,
          instruction: 'What time is shown?'
        };
        break;
      }

      case 'fiveMinutes':
        minute = (Math.floor(Math.random() * 12) + 1) * 5;
        question = {
          type: 'fiveMinutes',
          hour,
          minute,
          display: `${hour}:${minute.toString().padStart(2, '0')}`,
          answer: `${hour}:${minute.toString().padStart(2, '0')}`,
          instruction: 'What time is shown?'
        };
        break;

      case 'anyTime':
        minute = Math.floor(Math.random() * 60);
        question = {
          type: 'anyTime',
          hour,
          minute,
          display: `${hour}:${minute.toString().padStart(2, '0')}`,
          answer: `${hour}:${minute.toString().padStart(2, '0')}`,
          instruction: 'What time is shown?'
        };
        break;
    }

    // Add difficulty variations
    if (difficulty === 'hard') {
      // Could add word problems or time calculations
      question.instruction = Math.random() > 0.5 
        ? 'Draw the hands on a clock to show this time'
        : 'What time will it be in 30 minutes?';
    }

    return question;
  }

  // ===================================
  // UTILITY METHODS
  // ===================================

  formatTime(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  exportData() {
    const dataStr = JSON.stringify(this.data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `timelab-data-${Date.now()}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
  }

  importData(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const imported = JSON.parse(e.target.result);
          this.data = { ...this.data, ...imported };
          this.saveData();
          resolve(true);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  resetProgress(keepProfile = true) {
    const profile = keepProfile ? this.data.profile : undefined;
    const preferences = this.data.preferences;
    
    this.data = {};
    this.initializeDefaults();
    
    if (keepProfile) {
      this.data.profile = profile;
    }
    this.data.preferences = preferences;
    
    this.saveData();
  }
}

// Export for use in main script
window.TimeLearningSystem = TimeLearningSystem;