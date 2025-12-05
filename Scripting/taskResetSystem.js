// taskResetSystem.js - Task reset system that resets at 12 AM (midnight)

/**
 * Get the current day key (resets at 12 AM local time)
 * Returns a string like "2024-01-15" based on local midnight reset
 */
function getCurrentDayKeyMidnight() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Check if we need to reset tasks (new day since last reset)
 */
function shouldResetTasks(lastResetDate) {
    if (!lastResetDate) return true;
    const currentDayKey = getCurrentDayKeyMidnight();
    return lastResetDate !== currentDayKey;
}

/**
 * Reset all tasks at midnight
 */
function resetAllTasks() {
    if (!window.playerAPI) return;
    
    const data = window.playerAPI.getPlayerData();
    const currentDayKey = getCurrentDayKeyMidnight();
    const lastTaskReset = data.last_task_reset || null;
    
    // Check if we need to reset
    if (!shouldResetTasks(lastTaskReset)) {
        return false;
    }
    
    // Reset all task completion data
    const resetData = {
        tasks_completed: [],
        custom_tasks_completed: [],
        rank_tasks_completed: [],
        last_task_reset: currentDayKey
    };
    
    // Reset rank tasks (will be regenerated when page loads)
    resetData.rank_tasks = [];
    resetData.last_rank_task_generation = currentDayKey;
    
    window.playerAPI.updatePlayerData(resetData);
    
    // Trigger UI update
    window.dispatchEvent(new CustomEvent('tasksReset'));
    
    return true;
}

/**
 * Initialize task reset system
 * Checks every minute if we've crossed midnight
 */
function initTaskResetSystem() {
    // Check immediately
    resetAllTasks();
    
    // Check every minute
    setInterval(() => {
        resetAllTasks();
    }, 60 * 1000); // Check every minute
    
    // Also check when page becomes visible (user returns to tab)
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            resetAllTasks();
        }
    });
}

// Auto-initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTaskResetSystem);
} else {
    initTaskResetSystem();
}

// Expose globally
window.taskResetSystem = {
    getCurrentDayKeyMidnight,
    shouldResetTasks,
    resetAllTasks,
    initTaskResetSystem
};

