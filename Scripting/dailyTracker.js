// dailyTracker.js - Daily tracking system that resets at local 12 PM

/**
 * Get the current day key (resets at 12 PM local time)
 * Returns a string like "2024-01-15" based on local 12 PM reset
 */
function getCurrentDayKey() {
    const now = new Date();
    const localHour = now.getHours();
    
    // If it's before 12 PM, use yesterday's date
    // If it's 12 PM or after, use today's date
    const dayKey = new Date(now);
    if (localHour < 12) {
        dayKey.setDate(dayKey.getDate() - 1);
    }
    
    return dayKey.toISOString().split('T')[0]; // Returns YYYY-MM-DD
}

/**
 * Check if we need to reset daily data (new day since last reset)
 */
function shouldResetDailyData(lastResetDate) {
    if (!lastResetDate) return true;
    
    const currentDayKey = getCurrentDayKey();
    return lastResetDate !== currentDayKey;
}

/**
 * Get daily tracking data for current user
 */
function getDailyTrackingData() {
    const username = localStorage.getItem('currentUser');
    if (!username) return null;
    
    const storageKey = `daily_tracking_${username}`;
    const stored = localStorage.getItem(storageKey);
    
    if (stored) {
        try {
            return JSON.parse(stored);
        } catch (error) {
            console.error('Error parsing daily tracking data:', error);
        }
    }
    
    return null;
}

/**
 * Save daily tracking data for current user
 */
function saveDailyTrackingData(data) {
    const username = localStorage.getItem('currentUser');
    if (!username) return false;
    
    const storageKey = `daily_tracking_${username}`;
    const currentDayKey = getCurrentDayKey();
    
    // Merge with existing data
    const existing = getDailyTrackingData() || {};
    const updated = {
        ...existing,
        ...data,
        lastResetDate: currentDayKey,
        dayKey: currentDayKey
    };
    
    try {
        localStorage.setItem(storageKey, JSON.stringify(updated));
        return true;
    } catch (error) {
        console.error('Error saving daily tracking data:', error);
        return false;
    }
}

/**
 * Reset daily data if needed (new day)
 */
function resetDailyDataIfNeeded() {
    const username = localStorage.getItem('currentUser');
    if (!username) return;
    
    const storageKey = `daily_tracking_${username}`;
    const stored = localStorage.getItem(storageKey);
    const currentDayKey = getCurrentDayKey();
    
    if (stored) {
        try {
            const data = JSON.parse(stored);
            if (data.lastResetDate !== currentDayKey) {
                // New day - reset daily counters
                const resetData = {
                    dayKey: currentDayKey,
                    lastResetDate: currentDayKey,
                    dailyTasksCompleted: 0,
                    dailyXpEarned: 0,
                    streakUpdated: false // Track if streak was updated today
                };
                localStorage.setItem(storageKey, JSON.stringify(resetData));
                console.log('Daily data reset for new day:', currentDayKey);
            }
        } catch (error) {
            console.error('Error resetting daily data:', error);
        }
    } else {
        // First time - initialize
        const initData = {
            dayKey: currentDayKey,
            lastResetDate: currentDayKey,
            dailyTasksCompleted: 0,
            dailyXpEarned: 0,
            streakUpdated: false
        };
        localStorage.setItem(storageKey, JSON.stringify(initData));
    }
}

/**
 * Increment daily tasks completed
 */
function incrementDailyTasks() {
    resetDailyDataIfNeeded();
    const data = getDailyTrackingData() || {};
    const oldCount = data.dailyTasksCompleted || 0;
    const newCount = oldCount + 1;
    saveDailyTrackingData({ dailyTasksCompleted: newCount });
    
    // Add points to lifetime total (20 points per task)
    if (window.pointsSystem && newCount > oldCount) {
        window.pointsSystem.addPoints(20);
    }
    
    return newCount;
}

/**
 * Add to daily XP earned
 */
function addDailyXp(amount) {
    resetDailyDataIfNeeded();
    const data = getDailyTrackingData() || {};
    const oldXp = data.dailyXpEarned || 0;
    const newXp = oldXp + amount;
    saveDailyTrackingData({ dailyXpEarned: newXp });
    
    // Add points to lifetime total (10 points per 100 XP)
    if (window.pointsSystem && newXp > oldXp) {
        const xpGained = newXp - oldXp;
        const pointsToAdd = Math.floor(xpGained / 100) * 10;
        if (pointsToAdd > 0) {
            window.pointsSystem.addPoints(pointsToAdd);
        }
    }
    
    return newXp;
}

/**
 * Update streak (can only be done once per day)
 */
function updateStreak() {
    resetDailyDataIfNeeded();
    const data = getDailyTrackingData() || {};
    
    // Only update streak once per day
    if (data.streakUpdated) {
        return data.streak || 0;
    }
    
    // Get current streak from player data
    if (window.playerAPI) {
        const playerData = window.playerAPI.getPlayerData();
        let currentStreak = parseInt(playerData.streak) || 0;
        
        // Check if last activity was yesterday (maintain streak) or earlier (reset)
        const lastActivityDate = playerData.last_activity_date;
        const currentDayKey = getCurrentDayKey();
        
        if (lastActivityDate) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            if (yesterday.getHours() < 12) {
                yesterday.setDate(yesterday.getDate() - 1);
            }
            const yesterdayKey = yesterday.toISOString().split('T')[0];
            
            if (lastActivityDate === yesterdayKey) {
                // Maintained streak - increment
                currentStreak += 1;
            } else if (lastActivityDate !== currentDayKey) {
                // Streak broken - reset to 1
                currentStreak = 1;
            }
        } else {
            // First time - start at 1
            currentStreak = 1;
        }
        
        // Update player data
        window.playerAPI.updatePlayerData({
            streak: currentStreak,
            last_activity_date: currentDayKey
        });
        
        // Mark streak as updated for today
        saveDailyTrackingData({ streakUpdated: true });
        
        return currentStreak;
    }
    
    return 0;
}

/**
 * Get current streak
 */
function getCurrentStreak() {
    if (window.playerAPI) {
        const playerData = window.playerAPI.getPlayerData();
        return parseInt(playerData.streak) || 0;
    }
    return 0;
}

/**
 * Get daily tasks completed count
 */
function getDailyTasksCompleted() {
    resetDailyDataIfNeeded();
    const data = getDailyTrackingData() || {};
    return data.dailyTasksCompleted || 0;
}

/**
 * Get daily XP earned
 */
function getDailyXpEarned() {
    resetDailyDataIfNeeded();
    const data = getDailyTrackingData() || {};
    return data.dailyXpEarned || 0;
}

/**
 * Calculate points from tasks (20 points per task)
 */
function calculateTaskPoints(tasksCompleted) {
    return tasksCompleted * 20;
}

/**
 * Calculate points from XP (10 points per 100 XP)
 */
function calculateXpPoints(xpEarned) {
    return Math.floor(xpEarned / 100) * 10;
}

// Expose functions globally
window.dailyTracker = {
    getCurrentDayKey,
    resetDailyDataIfNeeded,
    incrementDailyTasks,
    addDailyXp,
    updateStreak,
    getCurrentStreak,
    getDailyTasksCompleted,
    getDailyXpEarned,
    calculateTaskPoints,
    calculateXpPoints,
    getDailyTrackingData,
    saveDailyTrackingData
};

// Initialize daily tracking on load
if (localStorage.getItem('currentUser')) {
    resetDailyDataIfNeeded();
}
