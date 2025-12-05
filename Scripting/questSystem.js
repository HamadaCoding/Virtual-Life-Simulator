// questSystem.js - Quest System with Multiple Types

/**
 * Quest types:
 * - MAIN: Long-term goals aligned with user objectives
 * - SIDE: Small flexible tasks
 * - DAILY: Daily recurring quests
 * - WEEKLY: Weekly recurring quests
 * - RANDOM/DUNGEON: Surprise challenges with timers and bigger rewards
 */

const QUEST_TYPES = {
    MAIN: 'main',
    SIDE: 'side',
    DAILY: 'daily',
    WEEKLY: 'weekly',
    DUNGEON: 'dungeon'
};

const QUEST_STATUS = {
    AVAILABLE: 'available',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    EXPIRED: 'expired',
    FAILED: 'failed'
};

/**
 * Generate a random dungeon quest
 */
function generateDungeonQuest() {
    const dungeonTypes = [
        {
            name: 'Speed Challenge',
            description: 'Complete 3 tasks within 2 hours!',
            objective: { type: 'tasks', count: 3 },
            timeLimit: 2 * 60 * 60 * 1000, // 2 hours in milliseconds
            reward: { xp: 500, points: 100 },
            penalty: { xp: -50, health: -5 }
        },
        {
            name: 'Focus Dungeon',
            description: 'Complete 5 tasks without breaks!',
            objective: { type: 'tasks', count: 5 },
            timeLimit: 4 * 60 * 60 * 1000, // 4 hours
            reward: { xp: 800, points: 150 },
            penalty: { xp: -100, health: -10 }
        },
        {
            name: 'XP Rush',
            description: 'Earn 1000 XP in one session!',
            objective: { type: 'xp', count: 1000 },
            timeLimit: 6 * 60 * 60 * 1000, // 6 hours
            reward: { xp: 1000, points: 200 },
            penalty: { xp: -150, motivation: -10 }
        },
        {
            name: 'Perfect Day',
            description: 'Complete all daily tasks!',
            objective: { type: 'all_daily', count: 1 },
            timeLimit: 12 * 60 * 60 * 1000, // 12 hours (until reset)
            reward: { xp: 600, points: 120, item: 'boost_focus' },
            penalty: { xp: -80, health: -8 }
        }
    ];
    
    const randomType = dungeonTypes[Math.floor(Math.random() * dungeonTypes.length)];
    const quest = {
        id: 'dungeon_' + Date.now(),
        type: QUEST_TYPES.DUNGEON,
        name: randomType.name,
        description: randomType.description,
        status: QUEST_STATUS.IN_PROGRESS,
        objective: randomType.objective,
        progress: { current: 0, target: randomType.objective.count },
        timeLimit: randomType.timeLimit,
        createdAt: Date.now(),
        expiresAt: Date.now() + randomType.timeLimit,
        reward: randomType.reward,
        penalty: randomType.penalty
    };
    
    return quest;
}

/**
 * Load player's quests
 */
function loadPlayerQuests() {
    if (!window.playerAPI) return [];
    
    const data = window.playerAPI.getPlayerData();
    let quests = data.quests || [];
    
    // Filter out expired quests and move them to failed
    const now = Date.now();
    quests = quests.map(quest => {
        if (quest.status === QUEST_STATUS.IN_PROGRESS && quest.expiresAt && now > quest.expiresAt) {
            // Apply penalty for expired quest
            applyQuestPenalty(quest);
            return { ...quest, status: QUEST_STATUS.FAILED };
        }
        return quest;
    });
    
    // Save updated quests
    if (quests.some(q => q.status === QUEST_STATUS.FAILED)) {
        window.playerAPI.updatePlayerData({ quests: quests });
    }
    
    return quests;
}

/**
 * Add a new quest
 */
function addQuest(quest) {
    if (!window.playerAPI) return false;
    
    const data = window.playerAPI.getPlayerData();
    const quests = data.quests || [];
    
    // Check if quest already exists
    if (quests.some(q => q.id === quest.id)) {
        console.warn('Quest already exists:', quest.id);
        return false;
    }
    
    quests.push(quest);
    window.playerAPI.updatePlayerData({ quests: quests });
    
    return true;
}

/**
 * Update quest progress
 */
function updateQuestProgress(questId, progressUpdate) {
    if (!window.playerAPI) return false;
    
    const data = window.playerAPI.getPlayerData();
    const quests = data.quests || [];
    
    const questIndex = quests.findIndex(q => q.id === questId);
    if (questIndex === -1) return false;
    
    const quest = quests[questIndex];
    
    // Update progress
    if (progressUpdate) {
        quest.progress = {
            ...quest.progress,
            ...progressUpdate
        };
    }
    
    // Check if quest is completed
    if (quest.progress.current >= quest.progress.target) {
        completeQuest(questId);
        return true;
    }
    
    quests[questIndex] = quest;
    window.playerAPI.updatePlayerData({ quests: quests });
    
    return true;
}

/**
 * Complete a quest and give rewards
 */
function completeQuest(questId) {
    if (!window.playerAPI) return false;
    
    const data = window.playerAPI.getPlayerData();
    const quests = data.quests || [];
    
    const questIndex = quests.findIndex(q => q.id === questId);
    if (questIndex === -1) return false;
    
    const quest = quests[questIndex];
    
    // Mark as completed
    quest.status = QUEST_STATUS.COMPLETED;
    quest.completedAt = Date.now();
    
    // Apply rewards
    applyQuestReward(quest);
    
    quests[questIndex] = quest;
    window.playerAPI.updatePlayerData({ quests: quests });
    
    return true;
}

/**
 * Apply quest reward
 */
function applyQuestReward(quest) {
    if (!quest.reward) return;
    
    const reward = quest.reward;
    
    // Give XP
    if (reward.xp && window.app && window.app.gainXp) {
        window.app.gainXp(reward.xp);
    } else if (reward.xp && window.tasks && window.tasks.app) {
        window.tasks.app.gainXp(reward.xp);
    }
    
    // Give points
    if (reward.points && window.pointsSystem) {
        window.pointsSystem.addPoints(reward.points);
    }
    
    // Give item
    if (reward.item && window.inventorySystem) {
        window.inventorySystem.addItem(reward.item, 1);
    }
    
    // Show notification
    if (window.showPopup) {
        showPopup(`Quest Completed! +${reward.xp || 0} XP, +${reward.points || 0} Points`);
    }
}

/**
 * Apply quest penalty
 */
function applyQuestPenalty(quest) {
    if (!quest.penalty) return;
    
    const penalty = quest.penalty;
    
    // Reduce XP
    if (penalty.xp && window.playerAPI) {
        const data = window.playerAPI.getPlayerData();
        const currentXp = parseInt(data.xp) || 0;
        const newXp = Math.max(0, currentXp + penalty.xp); // penalty.xp is negative
        window.playerAPI.updatePlayerData({ xp: newXp });
    }
    
    // Reduce health
    if (penalty.health && window.playerAPI) {
        const data = window.playerAPI.getPlayerData();
        const currentHealth = parseInt(data.health) || 100;
        const newHealth = Math.max(0, Math.min(100, currentHealth + penalty.health));
        window.playerAPI.updatePlayerData({ health: newHealth });
    }
    
    // Reduce motivation
    if (penalty.motivation && window.playerAPI) {
        const data = window.playerAPI.getPlayerData();
        const currentMotivation = parseInt(data.motivation) || 100;
        const newMotivation = Math.max(0, Math.min(100, currentMotivation + penalty.motivation));
        window.playerAPI.updatePlayerData({ motivation: newMotivation });
    }
}

/**
 * Generate daily quests (called at reset)
 */
function generateDailyQuests() {
    const dailyQuests = [
        {
            id: 'daily_' + Date.now() + '_1',
            type: QUEST_TYPES.DAILY,
            name: 'Daily Focus',
            description: 'Complete at least 3 tasks today',
            status: QUEST_STATUS.AVAILABLE,
            objective: { type: 'tasks', count: 3 },
            progress: { current: 0, target: 3 },
            reward: { xp: 200, points: 50 },
            createdAt: Date.now()
        },
        {
            id: 'daily_' + Date.now() + '_2',
            type: QUEST_TYPES.DAILY,
            name: 'Consistency',
            description: 'Complete all regular daily tasks',
            status: QUEST_STATUS.AVAILABLE,
            objective: { type: 'all_daily', count: 1 },
            progress: { current: 0, target: 1 },
            reward: { xp: 300, points: 75 },
            createdAt: Date.now()
        }
    ];
    
    return dailyQuests;
}

/**
 * Auto-update quest progress when tasks are completed
 */
function onTaskCompleted() {
    const quests = loadPlayerQuests();
    const activeQuests = quests.filter(q => 
        q.status === QUEST_STATUS.IN_PROGRESS || q.status === QUEST_STATUS.AVAILABLE
    );
    
    activeQuests.forEach(quest => {
        if (quest.objective.type === 'tasks') {
            const newProgress = (quest.progress.current || 0) + 1;
            updateQuestProgress(quest.id, { current: newProgress });
        }
    });
}

/**
 * Auto-update quest progress when XP is earned
 */
function onXpEarned(amount) {
    const quests = loadPlayerQuests();
    const activeQuests = quests.filter(q => 
        q.status === QUEST_STATUS.IN_PROGRESS || q.status === QUEST_STATUS.AVAILABLE
    );
    
    activeQuests.forEach(quest => {
        if (quest.objective.type === 'xp') {
            const newProgress = Math.min(
                (quest.progress.current || 0) + amount,
                quest.progress.target
            );
            updateQuestProgress(quest.id, { current: newProgress });
        }
    });
}

// Expose globally
window.questSystem = {
    QUEST_TYPES,
    QUEST_STATUS,
    generateDungeonQuest,
    loadPlayerQuests,
    addQuest,
    updateQuestProgress,
    completeQuest,
    generateDailyQuests,
    onTaskCompleted,
    onXpEarned
};

