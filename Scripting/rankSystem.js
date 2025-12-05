// rankSystem.js - Ranking and Class System

/**
 * Rank progression system with classes based on user type
 */

// Rank tiers: E → D → C → B → A → S
const RANK_TIERS = ['E', 'D', 'C', 'B', 'A', 'S'];

// Class types based on user profile
const CLASS_TYPES = {
    STUDENT: {
        name: 'Student',
        ranks: ['Beginner', 'Learner', 'Scholar', 'Expert', 'Master', 'Legend'],
        icon: '📚',
        color: '#4A90E2',
        statBonus: { focus: 0.1, learning: 0.15 }
    },
    ATHLETE: {
        name: 'Athlete',
        ranks: ['Novice', 'Warrior', 'Champion', 'Elite', 'Hero', 'Legend'],
        icon: '💪',
        color: '#E94B3C',
        statBonus: { stamina: 0.15, strength: 0.1 }
    },
    PROGRAMMER: {
        name: 'Programmer',
        ranks: ['Coder', 'Developer', 'Engineer', 'Architect', 'Guru', 'Legend'],
        icon: '💻',
        color: '#00D9FF',
        statBonus: { logic: 0.15, efficiency: 0.1 }
    },
    LANGUAGE_LEARNER: {
        name: 'Language Learner',
        ranks: ['Beginner', 'Intermediate', 'Advanced', 'Fluent', 'Native', 'Legend'],
        icon: '🌍',
        color: '#9B59B6',
        statBonus: { memory: 0.15, communication: 0.1 }
    },
    GENERAL: {
        name: 'Adventurer',
        ranks: ['Novice', 'Explorer', 'Achiever', 'Veteran', 'Elite', 'Legend'],
        icon: '⭐',
        color: '#F39C12',
        statBonus: { balance: 0.1, versatility: 0.1 }
    }
};

/**
 * Calculate rank from total XP or level
 */
function calculateRank(totalXp) {
    // Rank thresholds based on XP
    const thresholds = [
        0,      // E: 0-999
        1000,   // D: 1000-4999
        5000,   // C: 5000-14999
        15000,  // B: 15000-49999
        50000,  // A: 50000-149999
        150000  // S: 150000+
    ];
    
    for (let i = thresholds.length - 1; i >= 0; i--) {
        if (totalXp >= thresholds[i]) {
            return {
                tier: RANK_TIERS[i],
                tierIndex: i,
                nextThreshold: i < thresholds.length - 1 ? thresholds[i + 1] : null,
                progress: i < thresholds.length - 1 
                    ? ((totalXp - thresholds[i]) / (thresholds[i + 1] - thresholds[i])) * 100
                    : 100
            };
        }
    }
    
    return {
        tier: RANK_TIERS[0],
        tierIndex: 0,
        nextThreshold: thresholds[1],
        progress: (totalXp / thresholds[1]) * 100
    };
}

/**
 * Get class rank name based on tier index and class type
 */
function getClassRankName(tierIndex, classType) {
    const classInfo = CLASS_TYPES[classType] || CLASS_TYPES.GENERAL;
    return classInfo.ranks[Math.min(tierIndex, classInfo.ranks.length - 1)] || classInfo.ranks[0];
}

/**
 * Get player's class type (defaults to GENERAL if not set)
 */
function getPlayerClass() {
    if (!window.playerAPI) return CLASS_TYPES.GENERAL;
    
    const data = window.playerAPI.getPlayerData();
    const playerClass = data.player_class || 'GENERAL';
    return CLASS_TYPES[playerClass] || CLASS_TYPES.GENERAL;
}

/**
 * Set player's class type
 */
function setPlayerClass(classType) {
    if (!window.playerAPI) return false;
    
    if (!CLASS_TYPES[classType]) {
        console.error(`Invalid class type: ${classType}`);
        return false;
    }
    
    window.playerAPI.updatePlayerData({
        player_class: classType
    });
    
    return true;
}

/**
 * Get player's current rank info
 */
function getPlayerRank() {
    if (!window.playerAPI) return null;
    
    const data = window.playerAPI.getPlayerData();
    const totalXp = parseInt(data.total_xp) || 0;
    const rankInfo = calculateRank(totalXp);
    const classInfo = getPlayerClass();
    
    return {
        tier: rankInfo.tier,
        tierIndex: rankInfo.tierIndex,
        className: classInfo.name,
        rankName: getClassRankName(rankInfo.tierIndex, data.player_class || 'GENERAL'),
        icon: classInfo.icon,
        color: classInfo.color,
        nextThreshold: rankInfo.nextThreshold,
        progress: rankInfo.progress,
        totalXp: totalXp,
        statBonuses: classInfo.statBonus
    };
}

/**
 * Get rank title display (e.g., "C - Scholar")
 */
function getRankTitle() {
    const rank = getPlayerRank();
    if (!rank) return 'E - Beginner';
    return `${rank.tier} - ${rank.rankName}`;
}

/**
 * Check if player can level up rank
 */
function canLevelUpRank(currentTotalXp, newTotalXp) {
    const currentRank = calculateRank(currentTotalXp);
    const newRank = calculateRank(newTotalXp);
    return newRank.tierIndex > currentRank.tierIndex;
}

/**
 * Generate rank-specific custom tasks with increasing difficulty
 */
function generateRankTasks() {
    if (!window.playerAPI) return [];
    
    const rankInfo = getPlayerRank();
    if (!rankInfo) return [];
    
    const tierIndex = rankInfo.tierIndex;
    const tasks = [];
    
    // Task templates based on rank tier
    // Difficulty increases with rank: E (easy) -> S (very hard)
    const taskTemplates = {
        // E Rank (Beginner) - Easy tasks
        0: [
            { name: 'Complete 1 Daily Task', description: 'Finish any one task from your daily list', xp: 150, difficulty: 'easy' },
            { name: 'Read for 10 Minutes', description: 'Spend 10 minutes reading or learning something new', xp: 200, difficulty: 'easy' },
            { name: 'Take a 5 Minute Walk', description: 'Go for a short walk to refresh your mind', xp: 100, difficulty: 'easy' },
            { name: 'Drink 2 Glasses of Water', description: 'Stay hydrated by drinking water', xp: 80, difficulty: 'easy' },
            { name: 'Write 3 Things You\'re Grateful For', description: 'Practice gratitude by writing down positive things', xp: 120, difficulty: 'easy' }
        ],
        // D Rank (Learner) - Moderate tasks
        1: [
            { name: 'Complete 3 Daily Tasks', description: 'Finish three tasks from your daily list', xp: 300, difficulty: 'moderate' },
            { name: 'Read for 20 Minutes', description: 'Spend 20 minutes reading or studying', xp: 350, difficulty: 'moderate' },
            { name: 'Exercise for 15 Minutes', description: 'Do any form of exercise for 15 minutes', xp: 250, difficulty: 'moderate' },
            { name: 'Learn a New Skill for 30 Minutes', description: 'Dedicate 30 minutes to learning something new', xp: 400, difficulty: 'moderate' },
            { name: 'Complete a Project Milestone', description: 'Finish a significant part of a project you\'re working on', xp: 500, difficulty: 'moderate' }
        ],
        // C Rank (Scholar) - Challenging tasks
        2: [
            { name: 'Complete 5 Daily Tasks', description: 'Finish five tasks from your daily list', xp: 600, difficulty: 'challenging' },
            { name: 'Read for 45 Minutes', description: 'Spend 45 minutes reading or studying', xp: 550, difficulty: 'challenging' },
            { name: 'Exercise for 30 Minutes', description: 'Do a full 30-minute workout session', xp: 450, difficulty: 'challenging' },
            { name: 'Complete a Full Chapter or Module', description: 'Finish an entire chapter or learning module', xp: 700, difficulty: 'challenging' },
            { name: 'Work on a Project for 2 Hours', description: 'Dedicate 2 hours to a meaningful project', xp: 800, difficulty: 'challenging' }
        ],
        // B Rank (Expert) - Hard tasks
        3: [
            { name: 'Complete All Daily Tasks', description: 'Finish every task from your daily list', xp: 1000, difficulty: 'hard' },
            { name: 'Read for 1 Hour', description: 'Spend a full hour reading or studying', xp: 900, difficulty: 'hard' },
            { name: 'Complete an Intensive Workout', description: 'Do a challenging 45-minute workout', xp: 750, difficulty: 'hard' },
            { name: 'Master a Complex Topic', description: 'Deep dive and understand a complex subject', xp: 1200, difficulty: 'hard' },
            { name: 'Complete a Major Project Phase', description: 'Finish a significant phase of a large project', xp: 1500, difficulty: 'hard' }
        ],
        // A Rank (Master) - Very hard tasks
        4: [
            { name: 'Complete All Tasks + 2 Extra', description: 'Finish all daily tasks and complete 2 additional challenges', xp: 2000, difficulty: 'very_hard' },
            { name: 'Study for 2 Hours', description: 'Dedicate 2 full hours to focused study', xp: 1800, difficulty: 'very_hard' },
            { name: 'Complete an Advanced Challenge', description: 'Tackle a difficult challenge in your field', xp: 2200, difficulty: 'very_hard' },
            { name: 'Teach or Mentor Someone', description: 'Share your knowledge by teaching or mentoring', xp: 2500, difficulty: 'very_hard' },
            { name: 'Complete a Major Project', description: 'Finish a significant project from start to finish', xp: 3000, difficulty: 'very_hard' }
        ],
        // S Rank (Legend) - Extreme tasks
        5: [
            { name: 'Complete All Tasks + 5 Extra', description: 'Finish all daily tasks and complete 5 additional challenges', xp: 4000, difficulty: 'extreme' },
            { name: 'Study for 4 Hours', description: 'Dedicate 4 full hours to intensive study', xp: 3500, difficulty: 'extreme' },
            { name: 'Complete an Expert-Level Challenge', description: 'Tackle an expert-level challenge in your field', xp: 4500, difficulty: 'extreme' },
            { name: 'Create Something Significant', description: 'Build or create something meaningful and substantial', xp: 5000, difficulty: 'extreme' },
            { name: 'Achieve a Major Milestone', description: 'Reach a significant milestone in your journey', xp: 6000, difficulty: 'extreme' }
        ]
    };
    
    // Get tasks for current rank tier
    const availableTasks = taskTemplates[tierIndex] || taskTemplates[0];
    
    // Select 2-3 random tasks based on rank (higher ranks get more tasks)
    const numTasks = Math.min(2 + tierIndex, 5);
    const selectedTasks = [];
    const shuffled = [...availableTasks].sort(() => Math.random() - 0.5);
    
    for (let i = 0; i < Math.min(numTasks, shuffled.length); i++) {
        const task = shuffled[i];
        selectedTasks.push({
            name: task.name,
            description: task.description,
            xp: task.xp,
            difficulty: task.difficulty,
            isRankTask: true,
            rankTier: rankInfo.tier,
            id: `rank_task_${tierIndex}_${Date.now()}_${i}`
        });
    }
    
    return selectedTasks;
}

// Expose globally
window.rankSystem = {
    RANK_TIERS,
    CLASS_TYPES,
    calculateRank,
    getClassRankName,
    getPlayerClass,
    setPlayerClass,
    getPlayerRank,
    getRankTitle,
    canLevelUpRank,
    generateRankTasks
};

