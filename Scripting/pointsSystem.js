// pointsSystem.js - Points calculation and management

/**
 * Calculate total points from all sources
 * Points accumulate: lifetime points are saved, today's points are added on top
 */
function calculateTotalPoints() {
    if (!window.dailyTracker) {
        // Fallback if dailyTracker not available
        if (window.playerAPI) {
            const playerData = window.playerAPI.getPlayerData();
            const lifetimePoints = parseInt(playerData.total_points) || 0;
            return {
                total: lifetimePoints,
                lifetime: lifetimePoints,
                today: 0,
                breakdown: { tasks: 0, xp: 0, streak: 0 }
            };
        }
        return { total: 0, lifetime: 0, today: 0, breakdown: { tasks: 0, xp: 0, streak: 0 } };
    }
    
    // Get daily stats
    const dailyTasks = window.dailyTracker.getDailyTasksCompleted();
    const dailyXp = window.dailyTracker.getDailyXpEarned();
    const streak = window.dailyTracker.getCurrentStreak();
    
    // Calculate points from each source (today only)
    const taskPoints = window.dailyTracker.calculateTaskPoints(dailyTasks);
    const xpPoints = window.dailyTracker.calculateXpPoints(dailyXp);
    const streakPoints = streak * 6; // 6 points per day of streak
    
    // Get lifetime points from player data (accumulated over time)
    let lifetimePoints = 0;
    if (window.playerAPI) {
        const playerData = window.playerAPI.getPlayerData();
        lifetimePoints = parseInt(playerData.total_points) || 0;
    }
    
    // Total = lifetime points (already includes past days) + today's points
    const todayPoints = taskPoints + xpPoints + streakPoints;
    const total = lifetimePoints + todayPoints;
    
    return {
        total: total,
        lifetime: lifetimePoints,
        today: todayPoints,
        breakdown: {
            tasks: taskPoints,
            xp: xpPoints,
            streak: streakPoints
        }
    };
}

/**
 * Add points to lifetime total
 */
function addPoints(amount) {
    if (!window.playerAPI) return false;
    
    const playerData = window.playerAPI.getPlayerData();
    const currentPoints = parseInt(playerData.total_points) || 0;
    const newTotal = currentPoints + amount;
    
    window.playerAPI.updatePlayerData({
        total_points: newTotal
    });
    
    return newTotal;
}

/**
 * Deduct points (for purchases)
 */
function deductPoints(amount) {
    if (!window.playerAPI) return false;
    
    const pointsData = calculateTotalPoints();
    if (pointsData.total < amount) {
        return false; // Not enough points
    }
    
    const playerData = window.playerAPI.getPlayerData();
    const currentPoints = parseInt(playerData.total_points) || 0;
    const newTotal = Math.max(0, currentPoints - amount);
    
    window.playerAPI.updatePlayerData({
        total_points: newTotal
    });
    
    return true;
}

/**
 * Get current available points
 */
function getAvailablePoints() {
    const pointsData = calculateTotalPoints();
    return pointsData.total;
}

// Expose globally
window.pointsSystem = {
    calculateTotalPoints,
    addPoints,
    deductPoints,
    getAvailablePoints
};

