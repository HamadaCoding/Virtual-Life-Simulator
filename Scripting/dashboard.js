// dashboard.js - Dashboard functionality

const dashboard = {
    init() {
        // Check if user is logged in
        const currentUser = localStorage.getItem('currentUser');
        if (!currentUser) {
            window.location.href = '../index.html';
            return;
        }

        this.loadDashboardData();
        this.updateStats();
        this.updateRankDisplay();
        this.updateActivity();
        this.startUpdateTimer();
    },

    loadDashboardData() {
        if (!window.playerAPI) return;
        
        const data = window.playerAPI.getPlayerData();
        this.data = {
            level: parseInt(data.level) || 1,
            xp: parseInt(data.xp) || 0,
            maxXp: parseInt(data.max_xp) || 500,
            totalXp: parseInt(data.total_xp) || 0,
            totalTasksCompleted: parseInt(data.total_tasks_completed) || 0,
            points: window.pointsSystem ? window.pointsSystem.calculateTotalPoints().total : 0
        };
    },

    updateStats() {
        // Update XP display
        const xpLevel = document.getElementById('xp-level');
        const xpProgress = document.getElementById('xp-progress');
        const xpValue = document.getElementById('xp-value');
        
        if (xpLevel) xpLevel.textContent = `Level ${this.data.level}`;
        if (xpProgress) {
            const xpPercent = Math.min((this.data.xp / this.data.maxXp) * 100, 100);
            xpProgress.style.width = `${xpPercent}%`;
        }
        if (xpValue) xpValue.textContent = `${this.data.xp} / ${this.data.maxXp}`;

        // Update stats
        const totalXpStat = document.getElementById('totalXpStat');
        const tasksCompletedStat = document.getElementById('tasksCompletedStat');
        const pointsStat = document.getElementById('pointsStat');
        
        if (totalXpStat) totalXpStat.textContent = this.data.totalXp.toLocaleString();
        if (tasksCompletedStat) tasksCompletedStat.textContent = this.data.totalTasksCompleted;
        if (pointsStat) pointsStat.textContent = this.data.points.toLocaleString();

        // Update streak
        const streakStat = document.getElementById('streakStat');
        if (streakStat && window.dailyTracker) {
            const streak = window.dailyTracker.getCurrentStreak();
            streakStat.textContent = `${streak} day${streak !== 1 ? 's' : ''}`;
        }
    },

    updateRankDisplay() {
        if (!window.rankSystem) return;

        const rankInfo = window.rankSystem.getPlayerRank();
        if (!rankInfo) return;

        const rankTier = document.getElementById('rankTier');
        const rankName = document.getElementById('rankName');
        const rankClass = document.getElementById('rankClass');
        const rankProgressFill = document.getElementById('rankProgressFill');
        const rankProgressText = document.getElementById('rankProgressText');

        if (rankTier) {
            rankTier.textContent = rankInfo.tier;
            rankTier.style.color = rankInfo.color;
        }
        if (rankName) {
            rankName.textContent = rankInfo.rankName;
            rankName.style.color = rankInfo.color;
        }
        if (rankClass) {
            rankClass.textContent = `${rankInfo.icon} ${rankInfo.className}`;
            rankClass.style.color = rankInfo.color;
        }
        if (rankProgressFill && rankProgressText) {
            const progress = Math.min(rankInfo.progress || 0, 100);
            rankProgressFill.style.width = `${progress}%`;
            rankProgressFill.style.background = rankInfo.color;
            rankProgressText.textContent = `${progress.toFixed(1)}%`;
        }
    },

    updateActivity() {
        const activityList = document.getElementById('activityList');
        if (!activityList || !window.playerAPI) return;

        const data = window.playerAPI.getPlayerData();
        const activities = [];

        // Add recent task completions
        const recentTasks = data.recent_activities || [];
        recentTasks.slice(-5).forEach(activity => {
            activities.push({
                icon: '✅',
                text: activity.message || 'Completed a task',
                time: this.formatTime(activity.timestamp)
            });
        });

        // Add level up if recent
        if (data.last_level_up) {
            const levelUpTime = new Date(data.last_level_up);
            const hoursAgo = (Date.now() - levelUpTime.getTime()) / (1000 * 60 * 60);
            if (hoursAgo < 24) {
                activities.push({
                    icon: '🎉',
                    text: `Reached Level ${data.level || 1}`,
                    time: this.formatTime(data.last_level_up)
                });
            }
        }

        // Default message if no activities
        if (activities.length === 0) {
            activities.push({
                icon: '✨',
                text: 'Welcome to Virtual Life!',
                time: 'Just now'
            });
        }

        activityList.innerHTML = activities.map(activity => `
            <div class="activity-item">
                <span class="activity-icon">${activity.icon}</span>
                <span class="activity-text">${activity.text}</span>
                <span class="activity-time">${activity.time}</span>
            </div>
        `).join('');
    },

    formatTime(timestamp) {
        if (!timestamp) return 'Just now';
        
        const time = new Date(timestamp);
        const now = new Date();
        const diffMs = now - time;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return time.toLocaleDateString();
    },

    startUpdateTimer() {
        // Update every 30 seconds
        setInterval(() => {
            this.loadDashboardData();
            this.updateStats();
            this.updateRankDisplay();
        }, 30000);
    }
};

// Initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => dashboard.init());
} else {
    dashboard.init();
}

// Listen for data updates
window.addEventListener('playerDataUpdated', () => {
    dashboard.loadDashboardData();
    dashboard.updateStats();
    dashboard.updateRankDisplay();
    dashboard.updateActivity();
});

