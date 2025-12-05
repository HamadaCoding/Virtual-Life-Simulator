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
        // Check and reset tasks if needed before loading (midnight reset)
        if (window.taskResetSystem) {
            window.taskResetSystem.resetAllTasks();
        }
        this.loadCustomTasks(); // Load custom tasks first
        this.loadRankTasks(); // Load rank-specific tasks
        // Check and reset tasks if needed before loading status (legacy support)
        this.checkAndResetIfNeeded();
        // Initialize daily quests if needed
        this.initializeDailyQuests();
        this.loadTasksStatus(); // Then load status (which needs custom tasks to be loaded)
        this.updateUI();
        this.checkEmptyTasks(); // Check if tasks list is empty and show instructions
        this.setupGoalTaskGenerator(); // Setup goal-based task generator
        
        // Listen for task reset events
        window.addEventListener('tasksReset', () => {
            // Reload page to show fresh tasks
            location.reload();
        });
        
        // Set up event listeners for complete buttons
        this.setupCompleteButtons();
        
        // Set up custom task input
        this.setupCustomTaskInput();
        
        // Start reset timer for testing (resets tasks every 20 seconds)
        this.startResetTimer();
    },
    
    setupCustomTaskInput() {
        const addTaskBtn = document.getElementById('addTaskBtn');
        const taskNameInput = document.getElementById('taskNameInput');
        const taskDescriptionInput = document.getElementById('taskDescriptionInput');
        
        if (!addTaskBtn || !taskNameInput) return;
        
        addTaskBtn.addEventListener('click', () => {
            this.addCustomTask();
        });
        
        // Allow Enter key to add task
        taskNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addCustomTask();
            }
        });
        
        taskDescriptionInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addCustomTask();
            }
        });
    },
    
    addCustomTask() {
        const taskNameInput = document.getElementById('taskNameInput');
        const taskDescriptionInput = document.getElementById('taskDescriptionInput');
        
        if (!taskNameInput) return;
        
        const taskName = taskNameInput.value.trim();
        
        // Validate task name
        if (!taskName) {
            showPopup('Error: Task name cannot be empty!');
            return;
        }
        
        // Get description or generate one
        let taskDescription = taskDescriptionInput.value.trim();
        if (!taskDescription) {
            taskDescription = this.generateDescriptionFromName(taskName);
        }
        
        // Capitalize task name (all words)
        const capitalizedName = this.capitalizeWords(taskName);
        
        // Capitalize first letter of description only
        const capitalizedDescription = taskDescription.charAt(0).toUpperCase() + taskDescription.slice(1).toLowerCase();
        
        // Create task object
        const customTask = {
            name: capitalizedName,
            description: capitalizedDescription,
            xp: 100,
            isCustom: true,
            id: Date.now() // Use timestamp as unique ID
        };
        
        // Save to player data
        if (window.playerAPI) {
            const data = window.playerAPI.getPlayerData();
            const customTasks = data.custom_tasks || [];
            customTasks.push(customTask);
            
            window.playerAPI.updatePlayerData({
                custom_tasks: customTasks
            });
        }
        
        // Render the new task
        this.renderCustomTask(customTask);
        
        // Clear inputs
        taskNameInput.value = '';
        taskDescriptionInput.value = '';
        
        // Update total tasks count
        totalTasks++;
        const totalCountEl = document.querySelector(".total-count");
        if (totalCountEl) {
            totalCountEl.textContent = totalTasks;
        }
        
        // Re-setup complete buttons to include the new one
        this.setupCompleteButtons();
        
        // Hide empty message if shown
        this.checkEmptyTasks();
        
        showPopup('Custom task added successfully!');
    },
    
    generateDescriptionFromName(taskName) {
        // Generate a simple description based on task name
        const lowerName = taskName.toLowerCase();
        
        // Common patterns
        if (lowerName.includes('read') || lowerName.includes('book')) {
            return 'Improve your knowledge and focus for the day.';
        } else if (lowerName.includes('workout') || lowerName.includes('exercise') || lowerName.includes('gym')) {
            return 'Boost your energy and maintain your health.';
        } else if (lowerName.includes('learn') || lowerName.includes('study')) {
            return 'Expand your knowledge and skills.';
        } else if (lowerName.includes('meditate') || lowerName.includes('meditation')) {
            return 'Relax and refresh your mind.';
        } else if (lowerName.includes('plan') || lowerName.includes('goal')) {
            return 'Organize your goals and priorities.';
        } else if (lowerName.includes('code') || lowerName.includes('program')) {
            return 'Practice and improve your programming skills.';
        } else if (lowerName.includes('write') || lowerName.includes('journal')) {
            return 'Express your thoughts and ideas.';
        } else if (lowerName.includes('walk') || lowerName.includes('run')) {
            return 'Stay active and healthy.';
        } else {
            return 'Complete this task to progress in your journey.';
        }
    },
    
    capitalizeWords(str) {
        return str.split(' ').map(word => {
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        }).join(' ');
    },
    
    renderCustomTask(task) {
        const tasksList = document.getElementById('tasksList');
        if (!tasksList) return;
        
        const taskCard = document.createElement('div');
        taskCard.className = 'task-card';
        taskCard.setAttribute('data-task-id', task.id);
        
        // Check if it's a rank task
        const isRankTask = task.isRankTask || false;
        const difficulty = task.difficulty || '';
        const rankTier = task.rankTier || '';
        const xpReward = task.xp || 100;
        
        // Create difficulty badge if it's a rank task
        let difficultyBadge = '';
        if (isRankTask) {
            const difficultyColors = {
                'easy': '#4CAF50',
                'moderate': '#FF9800',
                'challenging': '#FF5722',
                'hard': '#E91E63',
                'very_hard': '#9C27B0',
                'extreme': '#F44336'
            };
            const difficultyLabels = {
                'easy': 'Easy',
                'moderate': 'Moderate',
                'challenging': 'Challenging',
                'hard': 'Hard',
                'very_hard': 'Very Hard',
                'extreme': 'Extreme'
            };
            const color = difficultyColors[difficulty] || '#666';
            const label = difficultyLabels[difficulty] || difficulty;
            
            difficultyBadge = `<span class="rank-task-badge" style="background: ${color}; color: white; padding: 4px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; margin-left: 8px;">${rankTier} - ${label}</span>`;
        }
        
        taskCard.innerHTML = `
            <div class="task-info">
                <h2>${task.name}${difficultyBadge}</h2>
                <p>${task.description}</p>
                ${isRankTask ? `<p style="color: #ffd84f; font-size: 12px; margin-top: 4px;">Reward: ${xpReward} XP</p>` : ''}
            </div>
            <button class="complete-btn">Complete</button>
        `;
        
        // Add rank task styling
        if (isRankTask) {
            taskCard.classList.add('rank-task-card');
        }
        
        tasksList.appendChild(taskCard);
    },
    
    loadCustomTasks() {
        if (!window.playerAPI) return;
        
        const data = window.playerAPI.getPlayerData();
        const customTasks = data.custom_tasks || [];
        
        customTasks.forEach(task => {
            this.renderCustomTask(task);
            totalTasks++;
        });
        
        // Update total count display
        const totalCountEl = document.querySelector(".total-count");
        if (totalCountEl) {
            totalCountEl.textContent = totalTasks;
        }
    },
    
    loadRankTasks() {
        if (!window.rankSystem || !window.playerAPI) return;
        
        const data = window.playerAPI.getPlayerData();
        const rankTasksCompleted = data.rank_tasks_completed || [];
        const lastRankTaskGeneration = data.last_rank_task_generation || 0;
        const currentDay = new Date().toDateString();
        
        // Check if we need to generate new rank tasks (once per day)
        if (lastRankTaskGeneration !== currentDay) {
            // Generate new rank tasks
            const rankTasks = window.rankSystem.generateRankTasks();
            
            // Save the generated tasks
            window.playerAPI.updatePlayerData({
                rank_tasks: rankTasks,
                last_rank_task_generation: currentDay,
                rank_tasks_completed: [] // Reset completed tasks for new day
            });
            
            // Render the new tasks
            rankTasks.forEach(task => {
                this.renderCustomTask(task);
                totalTasks++;
            });
        } else {
            // Load existing rank tasks
            const rankTasks = data.rank_tasks || [];
            rankTasks.forEach(task => {
                // Only render if not completed
                if (!rankTasksCompleted.includes(task.id)) {
                    this.renderCustomTask(task);
                    totalTasks++;
                }
            });
        }
        
        // Update total count display
        const totalCountEl = document.querySelector(".total-count");
        if (totalCountEl) {
            totalCountEl.textContent = totalTasks;
        }
    },
    
    setupCompleteButtons() {
        // Re-query all complete buttons to include newly added custom tasks
        completeBtns = document.querySelectorAll(".complete-btn");
        
        completeBtns.forEach((btn, index) => {
            // Skip if button already has listener (check by data attribute)
            if (btn.hasAttribute('data-listener-attached')) return;
            btn.setAttribute('data-listener-attached', 'true');
            
            btn.addEventListener("click", async () => {
                if (btn.classList.contains("done")) return;

                // Check if this is a custom task, rank task, or regular task
                const taskCard = btn.closest('.task-card');
                const isCustomTask = taskCard && taskCard.hasAttribute('data-task-id');
                const taskId = isCustomTask ? taskCard.getAttribute('data-task-id') : index;

                if (window.playerAPI) {
                    const data = window.playerAPI.getPlayerData();
                    
                    if (isCustomTask) {
                        // Check if it's a rank task
                        const rankTasks = data.rank_tasks || [];
                        const isRankTask = rankTasks.some(rt => rt.id === taskId);
                        
                        if (isRankTask) {
                            // Rank tasks: track by ID, reset daily
                            const rankTasksCompleted = data.rank_tasks_completed || [];
                            
                            // Check if this rank task is already completed
                            if (rankTasksCompleted.includes(taskId)) {
                                return;
                            }
                            
                            // Mark as completed
                            rankTasksCompleted.push(taskId);
                            
                            // Find the task to get XP
                            const rankTask = rankTasks.find(rt => rt.id === taskId);
                            const xpReward = rankTask ? rankTask.xp : 100;
                            
                            window.playerAPI.updatePlayerData({
                                rank_tasks_completed: rankTasksCompleted
                            });
                            
                            // Award XP
                            if (window.tasks && window.tasks.app) {
                                window.tasks.app.gainXp(xpReward);
                            } else if (window.app && window.app.gainXp) {
                                window.app.gainXp(xpReward);
                            }
                            
                            // Mark task card as done
                            btn.classList.add("done");
                            btn.textContent = "Done";
                            btn.disabled = true;
                            
                            // Remove task from display
                            const taskCard = btn.closest('.task-card');
                            if (taskCard) {
                                taskCard.style.opacity = '0.5';
                                taskCard.style.pointerEvents = 'none';
                            }
                            
                            showPopup(`Rank task completed! +${xpReward} XP`);
                        } else {
                            // Custom tasks: unlimited, track by ID
                            const customTasksCompleted = data.custom_tasks_completed || [];
                            
                            // Check if this custom task is already completed
                            if (customTasksCompleted.includes(parseInt(taskId))) {
                                return;
                            }
                            
                            // Mark as completed
                            customTasksCompleted.push(parseInt(taskId));
                            
                            window.playerAPI.updatePlayerData({
                                custom_tasks_completed: customTasksCompleted
                            });
                        }
                    } else {
                        // Regular tasks: enforce daily limit
                        const tasksCompleted = data.tasks_completed || [];
                        
                        // Check if we've already reached the daily limit for regular tasks
                        if (tasksCompleted.length >= MAX_TASKS_PER_DAY) {
                            showPopup(`Daily limit reached! You can complete ${MAX_TASKS_PER_DAY} regular tasks per day.`);
                            return;
                        }
                        
                        // Check if this specific task is already completed
                        if (tasksCompleted.includes(index)) {
                            return;
                        }
                        
                        tasksCompleted.push(index);
                        
                        // ENFORCE LIMIT - ensure array never exceeds MAX_TASKS_PER_DAY
                        if (tasksCompleted.length > MAX_TASKS_PER_DAY) {
                            tasksCompleted.splice(MAX_TASKS_PER_DAY);
                        }
                        
                        window.playerAPI.updatePlayerData({
                            tasks_completed: tasksCompleted
                        });
                    }
                    
                    // Increment total_tasks_completed (NEVER RESET THIS - ONLY INCREMENT)
                    const currentTotal = parseInt(data.total_tasks_completed) || 0;
                    const newTotal = currentTotal + 1;
                    
                    window.playerAPI.updatePlayerData({
                        total_tasks_completed: newTotal
                    });
                }

                btn.classList.add("done");
                btn.innerText = "Completed ✅";
                btn.disabled = true;
                // Remove inline styles to use CSS variables
                btn.style.background = "";
                btn.style.color = "";

                // Update completed count (count both regular and custom tasks)
                completedCount++;
                
                // For display purposes, we show all completed tasks
                // Regular tasks are limited to MAX_TASKS_PER_DAY, but custom tasks are unlimited
                
                if (progressFill) {
                    const progressPercent = Math.min((completedCount / totalTasks) * 100, 100);
                    progressFill.style.width = `${progressPercent}%`;
                }

                // Update counter
                if (completedCountEl) {
                    completedCountEl.textContent = completedCount;
                }

                // Track daily task completion
                if (window.dailyTracker) {
                    window.dailyTracker.incrementDailyTasks();
                    window.dailyTracker.updateStreak(); // Update streak when completing task
                }
                
                // Calculate XP with multipliers (from skills, boosts, etc.)
                let baseXp = 100;
                let xpMultiplier = 1.0;
                
                // Get XP multiplier from skills
                if (window.statsSystem) {
                    xpMultiplier += window.statsSystem.getXpMultiplier();
                }
                
                // Get XP multiplier from active boosts
                if (window.inventorySystem) {
                    const boosts = window.inventorySystem.getActiveBoostMultipliers();
                    xpMultiplier += boosts.xpMultiplier;
                }
                
                const finalXp = Math.floor(baseXp * xpMultiplier);
                
                // Update quest progress
                if (window.questSystem) {
                    window.questSystem.onTaskCompleted();
                }
                
                // Update stats
                if (window.statsSystem) {
                    window.statsSystem.updateStatsFromActivity('task_completed', 1);
                }
                
                showPopup(`Great job! +${finalXp} XP earned`);
                console.log("Gaining XP... Current XP before:", this.data.xp);
                app.gainXp(finalXp);
                console.log("XP after gain:", this.data.xp);
                
                // Track daily XP earned
                if (window.dailyTracker) {
                    window.dailyTracker.addDailyXp(finalXp);
                }
                
                // Notify quest system of XP earned
                if (window.questSystem) {
                    window.questSystem.onXpEarned(finalXp);
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
            // Ensure daily reset is checked before loading status
            this.checkAndResetIfNeeded();
            
            const data = window.playerAPI.getPlayerData();
            let tasksCompleted = data.tasks_completed || [];
            const customTasksCompleted = data.custom_tasks_completed || [];
            
            // ENFORCE LIMIT - ensure tasks_completed never exceeds MAX_TASKS_PER_DAY
            if (tasksCompleted.length > MAX_TASKS_PER_DAY) {
                console.warn(`Tasks completed (${tasksCompleted.length}) exceeds limit (${MAX_TASKS_PER_DAY}). Truncating...`);
                tasksCompleted = tasksCompleted.slice(0, MAX_TASKS_PER_DAY);
                // Save corrected data back
                window.playerAPI.updatePlayerData({
                    tasks_completed: tasksCompleted
                });
            }
            
            // Count both regular and custom completed tasks
            completedCount = tasksCompleted.length + customTasksCompleted.length;
            
            // ENFORCE LIMIT - ensure regular tasks completedCount never exceeds MAX_TASKS_PER_DAY
            // (custom tasks are unlimited, so we only limit the display for regular tasks)
            const regularTasksCompleted = tasksCompleted.length;
            if (regularTasksCompleted > MAX_TASKS_PER_DAY) {
                completedCount = MAX_TASKS_PER_DAY + customTasksCompleted.length;
            }
            
            // Re-query buttons after custom tasks are loaded
            completeBtns = document.querySelectorAll(".complete-btn");
            
            // Restore completed task buttons (both regular and custom)
            completeBtns.forEach((btn, index) => {
                const taskCard = btn.closest('.task-card');
                const isCustomTask = taskCard && taskCard.hasAttribute('data-task-id');
                
                if (isCustomTask) {
                    // Handle custom task
                    const taskId = parseInt(taskCard.getAttribute('data-task-id'));
                    if (customTasksCompleted.includes(taskId)) {
                        btn.classList.add("done");
                        btn.innerText = "Completed ✅";
                        btn.disabled = true;
                        btn.style.background = "";
                        btn.style.color = "";
                        // Remove listener attribute so it can be re-attached if needed
                        btn.removeAttribute('data-listener-attached');
                    }
                } else {
                    // Handle regular task
                    if (tasksCompleted.includes(index)) {
                        btn.classList.add("done");
                        btn.innerText = "Completed ✅";
                        btn.disabled = true;
                        btn.style.background = "";
                        btn.style.color = "";
                        // Remove listener attribute so it can be re-attached if needed
                        btn.removeAttribute('data-listener-attached');
                    }
                }
            });
            
            // Show current session tasks completed (regular + custom)
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
        
        // Use midnight reset system
        const currentDayKey = window.taskResetSystem ? 
            window.taskResetSystem.getCurrentDayKeyMidnight() : 
            new Date().toISOString().split('T')[0];
        const now = new Date();
        const localTimeString = now.toLocaleString();
        console.log(`[RESET] Resetting daily tasks for day ${currentDayKey} (${localTimeString})...`);
        
        // Get current data to preserve custom tasks
        const data = window.playerAPI.getPlayerData();
        const customTasksCompleted = data.custom_tasks_completed || [];
        
        // Clear completed regular tasks but KEEP custom tasks and their completions
        // Also KEEP total_tasks_completed (NEVER RESET IT)
        // Reset spent_today_points for new day
        window.playerAPI.updatePlayerData({
            tasks_completed: [],
            last_reset_date: currentDayKey, // Use day key format for consistency
            last_reset_time: now.toISOString(), // Keep for backward compatibility
            spent_today_points: 0
            // Note: custom_tasks and custom_tasks_completed are NOT reset
        });
        
        // Reset completed count (only count custom tasks completed today)
        completedCount = customTasksCompleted.length;
        
        // Reset ALL task buttons including static HTML tasks
        completeBtns = document.querySelectorAll(".complete-btn");
        
        // Reset static HTML task cards (remove done class and restore button)
        const allTaskCards = document.querySelectorAll(".task-card");
        allTaskCards.forEach(card => {
            const btn = card.querySelector(".complete-btn");
            if (btn) {
                btn.classList.remove("done");
                btn.disabled = false;
                btn.textContent = "Complete";
                card.style.opacity = "1";
                card.style.pointerEvents = "auto";
            }
        });
        
        completeBtns.forEach((btn) => {
            const taskCard = btn.closest('.task-card');
            const isCustomTask = taskCard && taskCard.hasAttribute('data-task-id');
            
            // Only reset regular tasks, preserve custom task states
            if (!isCustomTask) {
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
            }
        });
        
        // Update progress UI (only show custom tasks completed since regular tasks are reset)
        const totalTasksCount = totalTasks;
        const progressPercent = totalTasksCount > 0 ? Math.min((completedCount / totalTasksCount) * 100, 100) : 0;
        
        if (progressFill) {
            progressFill.style.width = `${progressPercent}%`;
        }
        if (completedCountEl) {
            completedCountEl.textContent = completedCount;
        }
        
        // Generate new daily quests
        if (window.questSystem) {
            const dailyQuests = window.questSystem.generateDailyQuests();
            const data = window.playerAPI.getPlayerData();
            const existingQuests = data.quests || [];
            
            // Remove old daily quests and add new ones
            const filteredQuests = existingQuests.filter(q => q.type !== window.questSystem.QUEST_TYPES.DAILY);
            dailyQuests.forEach(quest => {
                filteredQuests.push(quest);
            });
            
            window.playerAPI.updatePlayerData({ quests: filteredQuests });
            console.log(`[RESET] Generated ${dailyQuests.length} new daily quests`);
        }
        
        showPopup("Daily tasks reset! You can complete them again.");
        console.log(`[RESET] Tasks reset for day: ${currentDayKey}`);
    },

    // Start reset timer - resets at 12 AM (midnight) local time
    startResetTimer() {
        console.log("[RESET] Starting reset timer - tasks will reset at 12 AM (midnight) local time");
        
        // Check if we need to reset immediately (if it's past 12 PM today)
        this.checkAndResetIfNeeded();
        
        // Calculate time until next 12 PM reset
        const timeUntilNextReset = this.getTimeUntilNextReset();
        const hoursUntilReset = (timeUntilNextReset / (1000 * 60 * 60)).toFixed(2);
        const minutesUntilReset = (timeUntilNextReset / (1000 * 60)).toFixed(0);
        
        console.log(`[RESET] Next reset in ${hoursUntilReset} hours (${minutesUntilReset} minutes)`);
        console.log(`[RESET] Next reset at: ${this.getNextResetTimeString()}`);
        
        // Set timeout for next reset at 12 AM (midnight)
        setTimeout(() => {
            this.resetDailyTasks();
            // After reset, schedule next 12 AM reset
            this.scheduleNextReset();
        }, timeUntilNextReset);
    },

    // Schedule the next reset at 12 AM (midnight)
    scheduleNextReset() {
        const timeUntilNextReset = this.getTimeUntilNextReset();
        
        this.resetInterval = setTimeout(() => {
            this.resetDailyTasks();
            // Schedule the next one
            this.scheduleNextReset();
        }, timeUntilNextReset);
    },

    // Get the next 12 AM (midnight) in local timezone
    getNextResetTime() {
        const now = new Date();
        const nextReset = new Date();
        
        // Set to 12 AM (midnight) today
        nextReset.setHours(0, 0, 0, 0);
        
        // If it's already past midnight today, set for midnight tomorrow
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

    // Initialize daily quests if needed
    initializeDailyQuests() {
        if (!window.playerAPI || !window.questSystem) return;
        
        const data = window.playerAPI.getPlayerData();
        const quests = data.quests || [];
        const currentDayKey = window.dailyTracker ? window.dailyTracker.getCurrentDayKey() : null;
        
        // Check if we have daily quests for today
        const hasDailyQuestsToday = quests.some(q => 
            q.type === window.questSystem.QUEST_TYPES.DAILY && 
            q.createdAt && 
            new Date(q.createdAt).toISOString().split('T')[0] === currentDayKey
        );
        
        // If no daily quests for today, generate them
        if (!hasDailyQuestsToday && currentDayKey) {
            const dailyQuests = window.questSystem.generateDailyQuests();
            const existingQuests = quests.filter(q => q.type !== window.questSystem.QUEST_TYPES.DAILY);
            
            dailyQuests.forEach(quest => {
                existingQuests.push(quest);
            });
            
            window.playerAPI.updatePlayerData({ quests: existingQuests });
            console.log('Initialized daily quests for', currentDayKey);
        }
    },

    // Check if reset is needed based on day key (uses same system as dailyTracker)
    checkAndResetIfNeeded() {
        if (!window.playerAPI || !window.dailyTracker) return;
        
        const data = window.playerAPI.getPlayerData();
        const lastResetDate = data.last_reset_date || data.last_reset_time; // Support both formats
        const currentDayKey = window.dailyTracker.getCurrentDayKey();
        
        // Check if we need to reset based on day key (same system as dailyTracker)
        let needsReset = false;
        
        if (!lastResetDate) {
            // No previous reset date - check if we should reset
            needsReset = true;
        } else {
            // Check if last reset was on a different day
            let lastResetDayKey;
            if (typeof lastResetDate === 'string' && lastResetDate.includes('T')) {
                // ISO date format - extract date part
                lastResetDayKey = lastResetDate.split('T')[0];
            } else if (typeof lastResetDate === 'string' && lastResetDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
                // Already in YYYY-MM-DD format
                lastResetDayKey = lastResetDate;
            } else {
                // Try to parse as date
                try {
                    const date = new Date(lastResetDate);
                    const localHour = date.getHours();
                    const dayKey = new Date(date);
                    if (localHour < 12) {
                        dayKey.setDate(dayKey.getDate() - 1);
                    }
                    lastResetDayKey = dayKey.toISOString().split('T')[0];
                } catch (e) {
                    console.error('Error parsing last reset date:', e);
                    needsReset = true;
                }
            }
            
            if (lastResetDayKey && lastResetDayKey !== currentDayKey) {
                needsReset = true;
            }
        }
        
        if (needsReset) {
            console.log(`[RESET] New day detected (${currentDayKey}). Resetting daily tasks...`);
            this.resetDailyTasks();
        }
    },

    // Get time remaining until next 12 AM (midnight) reset
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
    
    checkEmptyTasks() {
        const tasksList = document.getElementById('tasksList');
        const emptyMessage = document.getElementById('emptyTasksMessage');
        
        if (!tasksList || !emptyMessage) return;
        
        // Count visible task cards (not completed/hidden)
        const visibleTasks = tasksList.querySelectorAll('.task-card:not([style*="display: none"])');
        const hasTasks = visibleTasks.length > 0;
        
        // Show/hide empty message
        emptyMessage.style.display = hasTasks ? 'none' : 'block';
    },
    
    setupGoalTaskGenerator() {
        const generateBtn = document.getElementById('generateTasksBtn');
        const goalCategory = document.getElementById('goalCategory');
        const goalDescription = document.getElementById('goalDescription');
        
        if (!generateBtn) return;
        
        generateBtn.addEventListener('click', () => {
            const category = goalCategory.value;
            const description = goalDescription.value.trim();
            
            if (!category) {
                showPopup('Please select a goal category first!');
                return;
            }
            
            // Generate tasks based on goal
            const generatedTasks = this.generateTasksFromGoal(category, description);
            
            if (generatedTasks.length === 0) {
                showPopup('Could not generate tasks. Please try again or add tasks manually.');
                return;
            }
            
            // Add generated tasks
            generatedTasks.forEach(task => {
                // Save to player data
                if (window.playerAPI) {
                    const data = window.playerAPI.getPlayerData();
                    const customTasks = data.custom_tasks || [];
                    customTasks.push(task);
                    
                    window.playerAPI.updatePlayerData({
                        custom_tasks: customTasks
                    });
                }
                
                // Render the task
                this.renderCustomTask(task);
                totalTasks++;
            });
            
            // Clear form
            goalCategory.value = '';
            goalDescription.value = '';
            
            // Update total count
            const totalCountEl = document.querySelector(".total-count");
            if (totalCountEl) {
                totalCountEl.textContent = totalTasks;
            }
            
            // Re-setup complete buttons
            this.setupCompleteButtons();
            
            // Hide empty message
            this.checkEmptyTasks();
            
            showPopup(`Generated ${generatedTasks.length} task(s) based on your goal!`);
        });
    },
    
    generateTasksFromGoal(category, description) {
        const tasks = [];
        const baseTasks = {
            fitness: [
                { name: '30 Minute Workout', description: 'Complete a 30-minute exercise session', xp: 200 },
                { name: 'Drink 8 Glasses of Water', description: 'Stay hydrated throughout the day', xp: 100 },
                { name: '10,000 Steps', description: 'Walk at least 10,000 steps today', xp: 250 },
                { name: 'Stretch for 15 Minutes', description: 'Do stretching exercises to improve flexibility', xp: 150 }
            ],
            learning: [
                { name: 'Read for 30 Minutes', description: 'Read a book or article for 30 minutes', xp: 200 },
                { name: 'Learn a New Skill', description: 'Spend time learning something new', xp: 300 },
                { name: 'Complete a Course Module', description: 'Finish a module in an online course', xp: 400 },
                { name: 'Take Notes', description: 'Write notes on what you learned today', xp: 150 }
            ],
            career: [
                { name: 'Work on Professional Project', description: 'Dedicate time to a work project', xp: 300 },
                { name: 'Network with Colleagues', description: 'Connect with people in your field', xp: 200 },
                { name: 'Update Resume/Portfolio', description: 'Keep your professional materials current', xp: 250 },
                { name: 'Learn Industry News', description: 'Stay updated with industry developments', xp: 150 }
            ],
            creativity: [
                { name: 'Create Something New', description: 'Work on a creative project', xp: 300 },
                { name: 'Practice Your Craft', description: 'Spend time practicing your creative skill', xp: 250 },
                { name: 'Share Your Work', description: 'Share your creative work with others', xp: 200 },
                { name: 'Explore New Ideas', description: 'Research and explore new creative concepts', xp: 200 }
            ],
            social: [
                { name: 'Connect with Friends', description: 'Reach out to friends or family', xp: 150 },
                { name: 'Help Someone', description: 'Offer help or support to someone', xp: 200 },
                { name: 'Join a Community Event', description: 'Participate in a social activity', xp: 250 },
                { name: 'Have a Meaningful Conversation', description: 'Engage in a deep conversation', xp: 180 }
            ],
            mindfulness: [
                { name: 'Meditate for 10 Minutes', description: 'Practice meditation or mindfulness', xp: 200 },
                { name: 'Practice Gratitude', description: 'Write down things you are grateful for', xp: 150 },
                { name: 'Take a Nature Walk', description: 'Spend time in nature to relax', xp: 180 },
                { name: 'Journal Your Thoughts', description: 'Write in a journal to reflect', xp: 150 }
            ],
            finance: [
                { name: 'Review Your Budget', description: 'Check and update your budget', xp: 200 },
                { name: 'Save Money Today', description: 'Put aside some money for savings', xp: 250 },
                { name: 'Learn About Investing', description: 'Educate yourself about financial planning', xp: 200 },
                { name: 'Track Your Expenses', description: 'Record your spending for the day', xp: 150 }
            ],
            custom: [
                { name: 'Work on Your Goal', description: description || 'Make progress on your custom goal', xp: 200 },
                { name: 'Take Action Step', description: 'Complete an action step toward your goal', xp: 250 },
                { name: 'Review Progress', description: 'Assess your progress on your goal', xp: 150 }
            ]
        };
        
        // Get tasks for selected category
        const categoryTasks = baseTasks[category] || baseTasks.custom;
        
        // If description provided, customize tasks
        if (description && category !== 'custom') {
            // Modify task descriptions to be more specific
            categoryTasks.forEach(task => {
                task.description = `${task.description} related to: ${description}`;
            });
        }
        
        // Select 2-3 random tasks
        const shuffled = [...categoryTasks].sort(() => Math.random() - 0.5);
        const selectedTasks = shuffled.slice(0, Math.min(3, shuffled.length));
        
        // Add IDs and mark as goal-generated
        return selectedTasks.map((task, index) => ({
            ...task,
            id: `goal_task_${Date.now()}_${index}`,
            isCustom: true,
            isGoalGenerated: true,
            goalCategory: category
        }));
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