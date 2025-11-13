// tasks.js

let completeBtns = [];
let completedCountEl = null;
let progressFill = null;

let completedCount = 0;
// Dynamically count task cards from HTML
let totalTasks = 0;
let MAX_TASKS_PER_DAY = 0; // Will be set dynamically based on task cards found

const app = {
    data: {
        level: 1,
        xp: 0,
        maxXp: 500,
    },

    elements: {
        xpFill: null,
        xpValue: null,
        xpLevel: null,
    },

    init() {
        // Initialize all elements
        completeBtns = document.querySelectorAll(".complete-btn");
        completedCountEl = document.querySelector(".completed-count");
        progressFill = document.querySelector(".task-progress-fill");
        
        // Dynamically count task cards from HTML
        const taskCards = document.querySelectorAll(".task-card");
        totalTasks = taskCards.length;
        MAX_TASKS_PER_DAY = totalTasks; // Set max tasks to match the number of task cards
        
        // Update total count display if it exists
        const totalCountEl = document.querySelector(".total-count");
        if (totalCountEl) {
            totalCountEl.textContent = totalTasks;
        }
        
        this.elements.xpFill = document.querySelector(".xp-progress");
        
        // Initialize active items header
        this.updateActiveItemsHeader();
        this.startActiveItemsTimer();
        this.elements.xpValue = document.querySelector(".xp-value");
        this.elements.xpLevel = document.querySelector(".xp-level") || document.querySelector(".level.xp-level");
        
        console.log("Tasks page initialized. Elements found:", {
            xpFill: !!this.elements.xpFill,
            xpValue: !!this.elements.xpValue,
            xpLevel: !!this.elements.xpLevel,
            completeBtns: completeBtns.length,
            taskCards: totalTasks,
            maxTasksPerDay: MAX_TASKS_PER_DAY
        });
        
        this.loadDataFromBackend();
        this.loadTasksStatus();
        this.updateUI();
        
        // Set up event listeners for complete buttons
        this.setupCompleteButtons();
        
        // Start reset timer for testing (resets tasks every 20 seconds)
        this.startResetTimer();
    },
    
    setupCompleteButtons() {
        completeBtns.forEach((btn, index) => {
            // Remove any existing listeners by cloning the button
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            
            newBtn.addEventListener("click", async () => {
                if (newBtn.classList.contains("done")) return;

                // ENFORCE TASK LIMIT - NEVER EXCEED MAX_TASKS_PER_DAY
                if (window.playerAPI) {
                    const data = window.playerAPI.getPlayerData();
                    const tasksCompleted = data.tasks_completed || [];
                    
                    // Check if we've already reached the daily limit
                    if (tasksCompleted.length >= MAX_TASKS_PER_DAY) {
                        showPopup(`Daily limit reached! You can complete ${MAX_TASKS_PER_DAY} tasks per day.`);
                        return;
                    }
                    
                    // Check if this specific task is already completed
                    if (tasksCompleted.includes(index)) {
                        return;
                    }
                }

                newBtn.classList.add("done");
                newBtn.innerText = "Completed ✅";
                newBtn.disabled = true;
                // Remove inline styles to use CSS variables
                newBtn.style.background = "";
                newBtn.style.color = "";

                completedCount++;
                
                // ENFORCE LIMIT - ensure completedCount never exceeds MAX_TASKS_PER_DAY
                if (completedCount > MAX_TASKS_PER_DAY) {
                    completedCount = MAX_TASKS_PER_DAY;
                }
                
                if (progressFill) {
                    const progressPercent = Math.min((completedCount / totalTasks) * 100, 100);
                    progressFill.style.width = `${progressPercent}%`;
                }

                // Update counter to show current session tasks (not total)
                if (completedCountEl) {
                    completedCountEl.textContent = completedCount;
                }

                // Save completed task to localStorage
                if (window.playerAPI) {
                    const data = window.playerAPI.getPlayerData();
                    const tasksCompleted = data.tasks_completed || [];
                    
                    // ENFORCE LIMIT - never allow more than MAX_TASKS_PER_DAY
                    if (tasksCompleted.length >= MAX_TASKS_PER_DAY) {
                        showPopup(`Daily limit reached! Maximum ${MAX_TASKS_PER_DAY} tasks per day.`);
                        return;
                    }
                    
                    if (!tasksCompleted.includes(index)) {
                        tasksCompleted.push(index);
                        
                        // ENFORCE LIMIT - ensure array never exceeds MAX_TASKS_PER_DAY
                        if (tasksCompleted.length > MAX_TASKS_PER_DAY) {
                            tasksCompleted.splice(MAX_TASKS_PER_DAY);
                        }
                        
                        // Increment total_tasks_completed (NEVER RESET THIS - ONLY INCREMENT)
                        const currentTotal = parseInt(data.total_tasks_completed) || 0;
                        const newTotal = currentTotal + 1;
                        
                        window.playerAPI.updatePlayerData({
                            tasks_completed: tasksCompleted,
                            total_tasks_completed: newTotal // Only increment, never reset
                        });
                    }
                }

                // Track daily task completion
                if (window.dailyTracker) {
                    window.dailyTracker.incrementDailyTasks();
                    window.dailyTracker.updateStreak(); // Update streak when completing task
                }
                
                showPopup("Great job! +100 XP earned");
                console.log("Gaining XP... Current XP before:", this.data.xp);
                app.gainXp(100);
                console.log("XP after gain:", this.data.xp);
                
                // Track daily XP earned
                if (window.dailyTracker) {
                    window.dailyTracker.addDailyXp(100);
                }
                app.animateLevelUp();
                
                // Force UI update after a short delay to ensure save is complete
                setTimeout(() => {
                    app.updateUI();
                    console.log("UI updated. Current XP:", this.data.xp, "Level:", this.data.level);
                }, 100);
            });
        });
    },

    loadDataFromBackend() {
        // Load from localStorage via playerAPI
        if (window.playerAPI && window.playerAPI.loadPlayerData) {
            const data = window.playerAPI.loadPlayerData();
            this.data.level = parseInt(data.level) || 1;
            this.data.xp = parseInt(data.xp) || 0;
            this.data.maxXp = parseInt(data.max_xp) || 500;
        } else {
            // Wait for playerDataLoaded event
            const data = window.playerAPI ? window.playerAPI.getPlayerData() : null;
            if (data) {
                this.data.level = parseInt(data.level) || 1;
                this.data.xp = parseInt(data.xp) || 0;
                this.data.maxXp = parseInt(data.max_xp) || 500;
            } else {
                window.addEventListener('playerDataLoaded', (event) => {
                    const data = event.detail;
                    this.data.level = parseInt(data.level) || 1;
                    this.data.xp = parseInt(data.xp) || 0;
                    this.data.maxXp = parseInt(data.max_xp) || 500;
                }, { once: true });
            }
        }
    },

    loadTasksStatus() {
        if (window.playerAPI) {
            const data = window.playerAPI.getPlayerData();
            let tasksCompleted = data.tasks_completed || [];
            
            // ENFORCE LIMIT - ensure tasks_completed never exceeds MAX_TASKS_PER_DAY
            if (tasksCompleted.length > MAX_TASKS_PER_DAY) {
                console.warn(`Tasks completed (${tasksCompleted.length}) exceeds limit (${MAX_TASKS_PER_DAY}). Truncating...`);
                tasksCompleted = tasksCompleted.slice(0, MAX_TASKS_PER_DAY);
                // Save corrected data back
                window.playerAPI.updatePlayerData({
                    tasks_completed: tasksCompleted
                });
            }
            
            completedCount = tasksCompleted.length;
            
            // ENFORCE LIMIT - ensure completedCount never exceeds MAX_TASKS_PER_DAY
            if (completedCount > MAX_TASKS_PER_DAY) {
                completedCount = MAX_TASKS_PER_DAY;
            }
            
            // Restore completed task buttons
            completeBtns.forEach((btn, index) => {
                if (tasksCompleted.includes(index)) {
                    btn.classList.add("done");
                    btn.innerText = "Completed ✅";
                    btn.disabled = true;
                    // Remove inline styles to use CSS variables
                    btn.style.background = "";
                    btn.style.color = "";
                }
            });
            
            // Show current session tasks completed (not total)
            if (completedCountEl) {
                completedCountEl.textContent = completedCount;
            }
            const progressPercent = Math.min((completedCount / totalTasks) * 100, 100);
            if (progressFill) {
                progressFill.style.width = `${progressPercent}%`;
            }
        }
    },

    updateUI() {
        // Sync with global playerData to ensure we show the latest values
        if (window.playerAPI) {
            const globalData = window.playerAPI.getPlayerData();
            this.data.level = parseInt(globalData.level) || this.data.level;
            this.data.xp = parseInt(globalData.xp) || this.data.xp;
            this.data.maxXp = parseInt(globalData.max_xp) || this.data.maxXp;
        }

        const { level, xp, maxXp } = this.data;
        const xpPercent = Math.min((xp / maxXp) * 100, 100);
        
        console.log("Updating UI:", { level, xp, maxXp, xpPercent });

        if (this.elements.xpFill) {
            this.elements.xpFill.style.width = `${xpPercent}%`;
            console.log("XP fill updated to:", `${xpPercent}%`);
        } else {
            console.warn("XP fill element not found!");
        }
        
        if (this.elements.xpLevel) {
            // Check if it's the tasks page format (Lvl) or other pages (Level)
            const currentText = this.elements.xpLevel.textContent || "";
            if (currentText.includes("Lvl") || currentText.toLowerCase().includes("lvl")) {
                this.elements.xpLevel.textContent = `Level ${level}`;
            } else {
                this.elements.xpLevel.textContent = `Level ${level}`;
            }
            console.log("XP level updated to:", this.elements.xpLevel.textContent);
        } else {
            console.warn("XP level element not found!");
        }
        
        if (this.elements.xpValue) {
            this.elements.xpValue.textContent = `${xp} / ${maxXp} XP`;
            console.log("XP value updated to:", this.elements.xpValue.textContent);
        } else {
            console.warn("XP value element not found!");
        }
    },

    gainXp(amount) {
        console.log("gainXp called with amount:", amount);
        
        // Get current data from global state to ensure we're working with latest values
        const currentData = window.playerAPI ? window.playerAPI.getPlayerData() : this.data;
        let currentXp = parseInt(currentData.xp) || 0;
        let currentLevel = parseInt(currentData.level) || 1;
        let currentMaxXp = parseInt(currentData.max_xp) || 500;
        let currentTotalXp = parseInt(currentData.total_xp) || 0;

        console.log("Before XP gain:", { currentXp, currentLevel, currentMaxXp, currentTotalXp });

        // Check for XP multiplier effect
        let xpMultiplier = 1;
        if (window.shop && window.shop.getXPMultiplier) {
            xpMultiplier = window.shop.getXPMultiplier();
        }
        
        const adjustedAmount = amount * xpMultiplier;
        
        // Add XP (with multiplier if active)
        currentXp += adjustedAmount;
        currentTotalXp += adjustedAmount;

        // Handle level ups
        while (currentXp >= currentMaxXp) {
            currentXp -= currentMaxXp;
            currentLevel++;
            currentMaxXp = Math.round(currentMaxXp * 1.25);
            console.log("Level up! New level:", currentLevel, "New max XP:", currentMaxXp);
        }

        console.log("After XP gain:", { currentXp, currentLevel, currentMaxXp, currentTotalXp });

        // Update local data first
        this.data.xp = currentXp;
        this.data.level = currentLevel;
        this.data.maxXp = currentMaxXp;

        // Save to localStorage and update global state
        if (window.playerAPI) {
            console.log("Saving to localStorage...");
            const saveResult = window.playerAPI.updatePlayerData({
                level: currentLevel,
                xp: currentXp,
                max_xp: currentMaxXp,
                total_xp: currentTotalXp
            });
            console.log("Save result:", saveResult);
            
            // Reload from global state to ensure sync
            const updatedData = window.playerAPI.getPlayerData();
            this.data.level = parseInt(updatedData.level) || currentLevel;
            this.data.xp = parseInt(updatedData.xp) || currentXp;
            this.data.maxXp = parseInt(updatedData.max_xp) || currentMaxXp;
            console.log("Synced data:", this.data);
        } else {
            console.error("window.playerAPI not available!");
        }

        // Update UI with latest data
        this.updateUI();
    },
    
    animateLevelUp() {
        const bar = this.elements.xpFill;
        bar.style.transition = "all 0.5s ease";
        bar.style.boxShadow = "0 0 15px rgba(255, 216, 79, 0.8)";
        setTimeout(() => (bar.style.boxShadow = ""), 1000);
    },

    // Reset daily tasks at 12 PM (noon) local time
    resetDailyTasks() {
        if (!window.playerAPI) return;
        
        const now = new Date();
        const localTimeString = now.toLocaleString();
        console.log(`[RESET] Resetting daily tasks at 12 PM local time (${localTimeString})...`);
        
        // Clear completed tasks but KEEP total_tasks_completed (NEVER RESET IT)
        window.playerAPI.updatePlayerData({
            tasks_completed: [],
            last_reset_time: now.toISOString()
        });
        
        completedCount = 0;
        
        // Reset all buttons to original yellow "Complete" state
        // Need to re-query buttons in case DOM changed
        completeBtns = document.querySelectorAll(".complete-btn");
        
        completeBtns.forEach((btn) => {
            // Remove done class
            btn.classList.remove("done");
            
            // Restore original text
            btn.innerText = "Complete";
            
            // Remove all inline styles to restore CSS styling (yellow button)
            btn.style.background = "";
            btn.style.backgroundColor = "";
            btn.style.color = "";
            btn.style.cursor = "";
            btn.disabled = false;
            
            // Ensure button is clickable again
            btn.removeAttribute("disabled");
        });
        
        // Update progress UI
        if (progressFill) {
            progressFill.style.width = "0%";
        }
        if (completedCountEl) {
            completedCountEl.textContent = completedCount;
        }
        
        showPopup("Daily tasks reset! You can complete them again.");
        console.log(`[RESET] Tasks reset at: ${localTimeString}`);
    },

    // Start reset timer - resets at 12 PM (noon) local time
    startResetTimer() {
        console.log("[RESET] Starting reset timer - tasks will reset at 12 PM (noon) local time");
        
        // Check if we need to reset immediately (if it's past 12 PM today)
        this.checkAndResetIfNeeded();
        
        // Calculate time until next 12 PM reset
        const timeUntilNextReset = this.getTimeUntilNextReset();
        const hoursUntilReset = (timeUntilNextReset / (1000 * 60 * 60)).toFixed(2);
        const minutesUntilReset = (timeUntilNextReset / (1000 * 60)).toFixed(0);
        
        console.log(`[RESET] Next reset in ${hoursUntilReset} hours (${minutesUntilReset} minutes)`);
        console.log(`[RESET] Next reset at: ${this.getNextResetTimeString()}`);
        
        // Set timeout for next reset at 12 PM
        setTimeout(() => {
            this.resetDailyTasks();
            // After reset, schedule next 12 PM reset
            this.scheduleNextReset();
        }, timeUntilNextReset);
    },

    // Schedule the next reset at 12 PM
    scheduleNextReset() {
        const timeUntilNextReset = this.getTimeUntilNextReset();
        
        this.resetInterval = setTimeout(() => {
            this.resetDailyTasks();
            // Schedule the next one
            this.scheduleNextReset();
        }, timeUntilNextReset);
    },

    // Get the next 12 PM (noon) in local timezone
    getNextResetTime() {
        const now = new Date();
        const nextReset = new Date();
        
        // Set to 12 PM (noon) today
        nextReset.setHours(12, 0, 0, 0);
        
        // If it's already past 12 PM today, set for 12 PM tomorrow
        if (now >= nextReset) {
            nextReset.setDate(nextReset.getDate() + 1);
        }
        
        return nextReset;
    },

    // Get next reset time as readable string
    getNextResetTimeString() {
        const nextReset = this.getNextResetTime();
        return nextReset.toLocaleString();
    },

    // Check if reset is needed based on last reset time
    checkAndResetIfNeeded() {
        if (!window.playerAPI) return;
        
        const data = window.playerAPI.getPlayerData();
        const lastResetTime = data.last_reset_time;
        
        if (lastResetTime) {
            const now = new Date();
            const lastReset = new Date(lastResetTime);
            
            // Check if we've passed 12 PM today and haven't reset yet today
            const today12PM = new Date();
            today12PM.setHours(12, 0, 0, 0);
            
            // If it's past 12 PM today and last reset was before today's 12 PM, reset now
            if (now >= today12PM && lastReset < today12PM) {
                console.log(`[RESET] It's past 12 PM and tasks haven't been reset today. Resetting now...`);
                this.resetDailyTasks();
            }
        } else {
            // No previous reset, check if it's past 12 PM today
            const now = new Date();
            const today12PM = new Date();
            today12PM.setHours(12, 0, 0, 0);
            
            // If it's past 12 PM and no reset has happened, reset now
            if (now >= today12PM) {
                console.log(`[RESET] No previous reset found and it's past 12 PM. Resetting now...`);
                this.resetDailyTasks();
            }
        }
    },

    // Get time remaining until next 12 PM reset
    getTimeUntilNextReset() {
        const nextReset = this.getNextResetTime();
        const now = new Date();
        const timeUntilReset = nextReset.getTime() - now.getTime();
        
        // Ensure we return at least 0 (don't return negative)
        return Math.max(0, timeUntilReset);
    },

    // Stop reset timer
    stopResetTimer() {
        if (this.resetInterval) {
            clearInterval(this.resetInterval);
            this.resetInterval = null;
            console.log("[TEST] Reset timer stopped");
        }
    },
    
    // Update active items header
    updateActiveItemsHeader() {
        if (!window.shop) return;
        
        const header = document.getElementById('activeItemsHeader');
        if (!header) return;
        
        const activeItems = window.shop.getActiveItems();
        
        if (activeItems.length === 0) {
            header.innerHTML = '';
            return;
        }
        
        header.innerHTML = activeItems.map(item => {
            const timeRemaining = window.shop.formatTimeRemaining(item);
            return `
                <div class="active-item-badge" title="${item.name}">
                    <div class="active-item-name-small">${item.name}</div>
                    <div class="active-item-timer">
                        <span>${item.icon}</span>
                        <span>${timeRemaining}</span>
                    </div>
                </div>
            `;
        }).join('');
    },
    
    // Start active items timer
    startActiveItemsTimer() {
        // Update active items timer every second
        setInterval(() => {
            this.updateActiveItemsHeader();
        }, 1000);
    },
};



// Event listeners are now set up in setupCompleteButtons() method

// Simple popup animation
function showPopup(message) {
    const popup = document.createElement("div");
    popup.className = "popup-message";
    popup.textContent = message;
    document.body.appendChild(popup);

    setTimeout(() => {
        popup.classList.add("show");
    }, 50);

    setTimeout(() => {
        popup.classList.remove("show");
        setTimeout(() => popup.remove(), 300);
    }, 2000);
}

// Initialize
document.addEventListener("DOMContentLoaded", () => app.init());