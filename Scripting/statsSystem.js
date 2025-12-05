// statsSystem.js - Stats Growth and Skill Tree System

/**
 * Player stats that grow with activities
 */
const STAT_TYPES = {
    FOCUS: 'focus',
    STAMINA: 'stamina',
    LEARNING: 'learning',
    STRENGTH: 'strength',
    LOGIC: 'logic',
    EFFICIENCY: 'efficiency',
    MEMORY: 'memory',
    COMMUNICATION: 'communication',
    BALANCE: 'balance',
    VERSATILITY: 'versatility',
    HEALTH: 'health',
    MOTIVATION: 'motivation'
};

/**
 * Skill tree structure
 */
const SKILL_TREE = {
    focus: {
        name: 'Focus',
        icon: '🎯',
        description: 'Improve your ability to concentrate',
        maxLevel: 10,
        bonuses: [
            { level: 1, bonus: { xpMultiplier: 0.05 } },
            { level: 3, bonus: { xpMultiplier: 0.10 } },
            { level: 5, bonus: { xpMultiplier: 0.15, focusBonus: 5 } },
            { level: 7, bonus: { xpMultiplier: 0.20, focusBonus: 10 } },
            { level: 10, bonus: { xpMultiplier: 0.30, focusBonus: 15 } }
        ]
    },
    productivity: {
        name: 'Productivity',
        icon: '⚡',
        description: 'Complete tasks faster and more efficiently',
        maxLevel: 10,
        bonuses: [
            { level: 1, bonus: { taskBonus: 0.05 } },
            { level: 3, bonus: { taskBonus: 0.10 } },
            { level: 5, bonus: { taskBonus: 0.15, efficiencyBonus: 5 } },
            { level: 7, bonus: { taskBonus: 0.20, efficiencyBonus: 10 } },
            { level: 10, bonus: { taskBonus: 0.30, efficiencyBonus: 15 } }
        ]
    },
    endurance: {
        name: 'Endurance',
        icon: '💪',
        description: 'Increase your stamina for longer sessions',
        maxLevel: 10,
        bonuses: [
            { level: 1, bonus: { staminaBonus: 5 } },
            { level: 3, bonus: { staminaBonus: 10 } },
            { level: 5, bonus: { staminaBonus: 15, healthBonus: 5 } },
            { level: 7, bonus: { staminaBonus: 20, healthBonus: 10 } },
            { level: 10, bonus: { staminaBonus: 30, healthBonus: 15 } }
        ]
    },
    wisdom: {
        name: 'Wisdom',
        icon: '📚',
        description: 'Learn faster and retain more knowledge',
        maxLevel: 10,
        bonuses: [
            { level: 1, bonus: { learningBonus: 5 } },
            { level: 3, bonus: { learningBonus: 10 } },
            { level: 5, bonus: { learningBonus: 15, memoryBonus: 5 } },
            { level: 7, bonus: { learningBonus: 20, memoryBonus: 10 } },
            { level: 10, bonus: { learningBonus: 30, memoryBonus: 15 } }
        ]
    }
};

/**
 * Get player stats
 */
function getPlayerStats() {
    if (!window.playerAPI) return {};
    
    const data = window.playerAPI.getPlayerData();
    return data.stats || {};
}

/**
 * Update a stat
 */
function updateStat(statType, amount) {
    if (!window.playerAPI) return false;
    
    const data = window.playerAPI.getPlayerData();
    const stats = data.stats || {};
    
    if (!stats[statType]) {
        stats[statType] = 0;
    }
    
    stats[statType] = Math.max(0, Math.min(100, stats[statType] + amount));
    
    window.playerAPI.updatePlayerData({ stats: stats });
    
    return stats[statType];
}

/**
 * Get player's skill tree progress
 */
function getSkillTree() {
    if (!window.playerAPI) return {};
    
    const data = window.playerAPI.getPlayerData();
    return data.skillTree || {};
}

/**
 * Upgrade a skill
 */
function upgradeSkill(skillId, xpCost) {
    if (!window.playerAPI) return { success: false, message: 'Player API not available' };
    
    const skill = SKILL_TREE[skillId];
    if (!skill) {
        return { success: false, message: 'Invalid skill' };
    }
    
    const data = window.playerAPI.getPlayerData();
    const skillTree = data.skillTree || {};
    const currentLevel = skillTree[skillId] || 0;
    
    if (currentLevel >= skill.maxLevel) {
        return { success: false, message: 'Skill already at max level' };
    }
    
    // Check XP cost (increases with level)
    const requiredXp = xpCost || (currentLevel + 1) * 500;
    const currentXp = parseInt(data.total_xp) || 0;
    
    if (currentXp < requiredXp) {
        return { success: false, message: `Not enough XP. Need ${requiredXp}, have ${currentXp}` };
    }
    
    // Deduct XP and upgrade skill
    const newLevel = currentLevel + 1;
    skillTree[skillId] = newLevel;
    
    // Apply skill bonus
    const bonusEntry = skill.bonuses.find(b => b.level === newLevel);
    if (bonusEntry) {
        // Store active bonuses in player data
        const activeBonuses = data.activeBonuses || {};
        activeBonuses[skillId] = bonusEntry.bonus;
        window.playerAPI.updatePlayerData({
            skillTree: skillTree,
            activeBonuses: activeBonuses,
            total_xp: currentXp - requiredXp
        });
    } else {
        window.playerAPI.updatePlayerData({
            skillTree: skillTree,
            total_xp: currentXp - requiredXp
        });
    }
    
    return { 
        success: true, 
        message: `${skill.name} upgraded to level ${newLevel}!`,
        level: newLevel,
        bonus: bonusEntry ? bonusEntry.bonus : null
    };
}

/**
 * Get active skill bonuses
 */
function getActiveBonuses() {
    if (!window.playerAPI) return {};
    
    const data = window.playerAPI.getPlayerData();
    return data.activeBonuses || {};
}

/**
 * Calculate XP multiplier from skills
 */
function getXpMultiplier() {
    const bonuses = getActiveBonuses();
    let multiplier = 1.0;
    
    Object.values(bonuses).forEach(bonus => {
        if (bonus.xpMultiplier) {
            multiplier += bonus.xpMultiplier;
        }
    });
    
    return multiplier;
}

/**
 * Calculate task bonus from skills
 */
function getTaskBonus() {
    const bonuses = getActiveBonuses();
    let bonus = 0;
    
    Object.values(bonuses).forEach(b => {
        if (b.taskBonus) {
            bonus += b.taskBonus;
        }
    });
    
    return bonus;
}

/**
 * Auto-update stats based on activities
 */
function updateStatsFromActivity(activityType, amount = 1) {
    switch (activityType) {
        case 'task_completed':
            updateStat(STAT_TYPES.FOCUS, 1);
            updateStat(STAT_TYPES.MOTIVATION, 2);
            break;
        case 'study_session':
            updateStat(STAT_TYPES.LEARNING, 2);
            updateStat(STAT_TYPES.FOCUS, 1);
            break;
        case 'workout':
            updateStat(STAT_TYPES.STRENGTH, 2);
            updateStat(STAT_TYPES.STAMINA, 2);
            updateStat(STAT_TYPES.HEALTH, 1);
            break;
        case 'xp_earned':
            // Stats grow naturally with XP
            updateStat(STAT_TYPES.VERSATILITY, 0.5);
            break;
    }
}

// Expose globally
window.statsSystem = {
    STAT_TYPES,
    SKILL_TREE,
    getPlayerStats,
    updateStat,
    getSkillTree,
    upgradeSkill,
    getActiveBonuses,
    getXpMultiplier,
    getTaskBonus,
    updateStatsFromActivity
};
