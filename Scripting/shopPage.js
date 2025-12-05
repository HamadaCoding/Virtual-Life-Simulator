// shopPage.js - Shop page functionality

const shopPage = {
    init() {
        // Check if user is logged in
        const currentUser = localStorage.getItem('currentUser');
        if (!currentUser) {
            window.location.href = '../index.html';
            return;
        }

        this.updatePoints();
        this.renderShopItems();
        this.updateActiveItems();
        this.startTimer();
        
        // Listen for updates
        window.addEventListener('playerDataUpdated', () => {
            this.updatePoints();
            this.updateActiveItems();
        });
    },

    updatePoints() {
        if (!window.pointsSystem) return;
        
        const pointsData = window.pointsSystem.calculateTotalPoints();
        const pointsDisplay = document.getElementById('pointsDisplay');
        const totalPoints = document.getElementById('totalPoints');
        
        if (pointsDisplay) {
            pointsDisplay.textContent = `${pointsData.total} Points`;
        }
        if (totalPoints) {
            totalPoints.textContent = pointsData.total;
        }
    },

    renderShopItems() {
        if (!window.shop) return;
        
        const grid = document.getElementById('shopItemsGrid');
        if (!grid) return;
        
        grid.innerHTML = '';
        
        // Separate items by category
        const items = window.shop.SHOP_ITEMS.filter(item => item.category === 'items');
        const decorations = window.shop.SHOP_ITEMS.filter(item => item.category === 'decoration');
        
        // Render Items section
        if (items.length > 0) {
            const itemsTitle = document.createElement('h2');
            itemsTitle.className = 'shop-section-title';
            itemsTitle.textContent = 'Items';
            grid.appendChild(itemsTitle);
            
            items.forEach(item => {
                grid.appendChild(this.createItemCard(item));
            });
        }
        
        // Render Decoration section
        if (decorations.length > 0) {
            const decorationTitle = document.createElement('h2');
            decorationTitle.className = 'shop-section-title';
            decorationTitle.textContent = 'Decoration';
            decorationTitle.style.marginTop = '40px';
            grid.appendChild(decorationTitle);
            
            decorations.forEach(item => {
                grid.appendChild(this.createItemCard(item));
            });
        }
    },
    
    createItemCard(item) {
        const card = document.createElement('div');
        card.className = 'shop-item-card';
        
        const pointsData = window.pointsSystem.calculateTotalPoints();
        const canAfford = pointsData.total >= item.cost;
        
        // Build duration text - show "Instant" for instant items, "Permanent" for decorations
        let durationText = '';
        if (item.duration === 0) {
            if (item.effect === 'instant_health' || item.effect === 'instant_motivation') {
                durationText = '<div class="item-duration"><span>⚡</span><span>Instant</span></div>';
            } else {
                durationText = '<div class="item-duration"><span>♾️</span><span>Permanent</span></div>';
            }
        } else {
            durationText = `<div class="item-duration"><span>⏱️</span><span>Duration: ${item.duration} day${item.duration !== 1 ? 's' : ''}</span></div>`;
        }
        
        card.innerHTML = `
            <div class="item-header">
                <span class="item-icon">${item.icon}</span>
                <span class="item-name">${item.name}</span>
            </div>
            <div class="item-description">${item.description}</div>
            <div class="item-details">
                ${durationText}
                <div class="item-cost">💰 ${item.cost} Points</div>
            </div>
            <button class="buy-button" data-item-id="${item.id}" ${!canAfford ? 'disabled' : ''}>
                ${canAfford ? 'Buy Now' : 'Not Enough Points'}
            </button>
        `;
        
        // Add click event listener
        const buyButton = card.querySelector('.buy-button');
        if (buyButton) {
            buyButton.addEventListener('click', () => {
                this.purchaseItem(item.id);
            });
        }
        
        return card;
    },

    purchaseItem(itemId) {
        if (!window.shop) return;
        
        const result = window.shop.purchaseItem(itemId);
        
        if (result.success) {
            this.showPopup(result.message, false);
            this.updatePoints();
            this.renderShopItems();
            this.updateActiveItems();
        } else {
            this.showPopup(result.message, true);
        }
    },

    showPopup(message, isError = false) {
        const popup = document.getElementById('popup');
        const popupMessage = document.getElementById('popupMessage');
        
        if (!popup || !popupMessage) return;
        
        popupMessage.textContent = message;
        popup.classList.remove('hidden');
        if (isError) {
            popup.classList.add('error');
        } else {
            popup.classList.remove('error');
        }
    },

    updateActiveItems() {
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

    startTimer() {
        // Update active items timer every second
        setInterval(() => {
            this.updateActiveItems();
        }, 1000);
    }
};

// Global function for popup close
function closePopup() {
    const popup = document.getElementById('popup');
    if (popup) {
        popup.classList.add('hidden');
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => shopPage.init());
