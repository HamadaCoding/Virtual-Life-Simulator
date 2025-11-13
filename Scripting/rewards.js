// rewards.js
const app = {
    data: {
        level: 1,
        xp: 0,
        maxXp: 500,
    },

    elements: {
        xpFill: document.querySelector(".xp-progress"),
        xpLevel: document.querySelector(".xp-level"),
        xpValue: document.querySelector(".xp-value"),
        rewards: document.querySelectorAll(".reward-card"),
    },

    init() {
        this.loadDataFromBackend();
        this.loadRewardsStatus();
        this.updateUI();
        this.updateActiveItemsHeader();
        this.startActiveItemsTimer();
    },

    loadDataFromBackend() {
        if (window.playerAPI && window.playerAPI.loadPlayerData) {
            const data = window.playerAPI.loadPlayerData();
            this.data.level = parseInt(data.level) || 1;
            this.data.xp = parseInt(data.xp) || 0;
            this.data.maxXp = parseInt(data.max_xp) || 500;
        } else if (window.playerAPI && window.playerAPI.getPlayerData) {
            const data = window.playerAPI.getPlayerData();
            this.data.level = parseInt(data.level) || 1;
            this.data.xp = parseInt(data.xp) || 0;
            this.data.maxXp = parseInt(data.max_xp) || 500;
        } else {
            window.addEventListener('playerDataLoaded', (event) => {
                const data = event.detail;
                this.data.level = parseInt(data.level) || 1;
                this.data.xp = parseInt(data.xp) || 0;
                this.data.maxXp = parseInt(data.max_xp) || 500;
                this.updateUI();
            }, { once: true });
        }
    },

    loadRewardsStatus() {
        if (window.playerAPI) {
            const data = window.playerAPI.getPlayerData();
            const rewardsUnlocked = data.rewards_unlocked || [];
            
            // Restore unlocked rewards
            this.elements.rewards.forEach((card, index) => {
                if (rewardsUnlocked.includes(index)) {
                    card.classList.remove("locked");
                    card.classList.add("unlocked");
                }
            });
        }
    },

    updateUI() {
        const { level, xp, maxXp } = this.data;
        const xpPercent = (xp / maxXp) * 100;

        // Update XP bar and texts
        this.elements.xpFill.style.width = `${xpPercent}%`;
        this.elements.xpLevel.textContent = `Level ${level}`;
        this.elements.xpValue.textContent = `${xp} / ${maxXp} XP`;

        // Check for unlocked rewards
        this.unlockRewards();
    },

        gainXp(amount) {
        // safety: ensure numeric positive value
        amount = Number(amount) || 0;
        if (amount <= 0) {
            this.showPopup("No XP gained.");
            return;
        }

        // Check for XP multiplier effect
        let xpMultiplier = 1;
        if (window.shop && window.shop.getXPMultiplier) {
            xpMultiplier = window.shop.getXPMultiplier();
        }
        
        const adjustedAmount = amount * xpMultiplier;

        // add xp (with multiplier if active)
        this.data.xp += adjustedAmount;

        // count how many levels we will gain in this operation
        let levelsGained = 0;

        // loop while current xp reaches or exceeds the maxXp for current level
        while (this.data.xp >= this.data.maxXp) {
            levelsGained++;
            // remove the xp needed for current level
            this.data.xp -= this.data.maxXp;

            // increment level
            this.data.level++;

            // scale next level's maxXp (adjust factor if you want different difficulty)
            this.data.maxXp = Math.round(this.data.maxXp * 1.3);

            // optionally, you can call unlockRewards here inside the loop if rewards depend on intermediate levels
            // this.unlockRewards();
        }

        // Save to localStorage
        if (window.playerAPI) {
            window.playerAPI.updatePlayerData({
                level: this.data.level,
                xp: this.data.xp,
                max_xp: this.data.maxXp
            });
        }

        // UI update + animations
        this.updateUI();

        // animate and show a combined popup if one or more levels gained
        if (levelsGained > 0) {
            // small animation for each level (optional): call animateLevelUp multiple times or once
            this.animateLevelUp();

            // show a friendly popup with details
            const plural = levelsGained > 1 ? "levels" : "level";
            this.showPopup(`🎉 Level up! +${levelsGained} ${plural} — now Level ${this.data.level}`);
        } else {
            // normal xp gain popup (optional)
            this.showPopup(`+${amount} XP`);
        }

        // finally, ensure rewards unlocked for the final level
        this.unlockRewards();
    },


    unlockRewards() {
        const rewardsUnlocked = [];
        
        this.elements.rewards.forEach((card, index) => {
            const text = card.querySelector("h3").textContent.toLowerCase();

            // Unlock conditions
            if (text.includes("elite") && this.data.level >= 15) {
                card.classList.remove("locked");
                card.classList.add("unlocked");
                if (!rewardsUnlocked.includes(index)) {
                    rewardsUnlocked.push(index);
                }
            }
            if (text.includes("booster") && this.data.level >= 20) {
                card.classList.remove("locked");
                card.classList.add("unlocked");
                if (!rewardsUnlocked.includes(index)) {
                    rewardsUnlocked.push(index);
                }
            }
        });

        // Save unlocked rewards to localStorage
        if (window.playerAPI && rewardsUnlocked.length > 0) {
            const data = window.playerAPI.getPlayerData();
            const existingRewards = data.rewards_unlocked || [];
            const newRewards = [...new Set([...existingRewards, ...rewardsUnlocked])];
            window.playerAPI.updatePlayerData({
                rewards_unlocked: newRewards
            });
        }
    },

    animateLevelUp() {
        const bar = this.elements.xpFill;
        bar.style.transition = "all 0.5s ease";
        bar.style.boxShadow = "0 0 15px rgba(255, 216, 79, 0.8)";
        setTimeout(() => (bar.style.boxShadow = ""), 1000);
    },

    showPopup(message) {
        let popup = document.querySelector(".popup");
        if (!popup) {
            popup = document.createElement("div");
            popup.className = "popup";
            document.body.appendChild(popup);
        }

        popup.textContent = message;
        popup.classList.add("show");

        setTimeout(() => {
            popup.classList.remove("show");
        }, 3000);
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

// Initialize
document.addEventListener("DOMContentLoaded", () => app.init());
