// shop.js - Shop functionality and item management

// Shop items configuration
const SHOP_ITEMS = [
    {
        id: 'double_xp_potion',
        name: 'Double XP Potion',
        description: 'A potion that doubles your earned XP',
        duration: 1, // days
        cost: 500,
        icon: '⚗️',
        effect: 'double_xp',
        multiplier: 2
    },
    {
        id: 'triple_xp_potion',
        name: 'Triple XP Potion',
        description: 'A potion that triples your earned XP',
        duration: 1, // days
        cost: 1000,
        icon: '🧪',
        effect: 'triple_xp',
        multiplier: 3
    },
    {
        id: 'quadruple_xp_potion',
        name: '4X XP Potion',
        description: 'A potion that quadruples your earned XP',
        duration: 1, // days
        cost: 2000,
        icon: '🔬',
        effect: 'quadruple_xp',
        multiplier: 4
    },
];

/**
 * Get active items for the user
 */
function getActiveItems() {
    if (!window.playerAPI) return [];
    
    const playerData = window.playerAPI.getPlayerData();
    const activeItems = playerData.active_items || [];
    const now = new Date().getTime();
    
    // Filter out expired items
    const validItems = activeItems.filter(item => {
        const expiresAt = parseInt(item.expires_at) || 0;
        return expiresAt > now;
    });
    
    // Update if items were removed
    if (validItems.length !== activeItems.length) {
        window.playerAPI.updatePlayerData({
            active_items: validItems
        });
    }
    
    return validItems;
}

/**
 * Purchase an item
 */
function purchaseItem(itemId) {
    const item = SHOP_ITEMS.find(i => i.id === itemId);
    if (!item) {
        return { success: false, message: 'Item not found' };
    }
    
    // Check if user has enough points
    const availablePoints = window.pointsSystem.getAvailablePoints();
    if (availablePoints < item.cost) {
        return { 
            success: false, 
            message: 'Error purchasing the item, come back when you have enough points' 
        };
    }
    
    // Deduct points
    const deducted = window.pointsSystem.deductPoints(item.cost);
    if (!deducted) {
        return { 
            success: false, 
            message: 'Error purchasing the item, come back when you have enough points' 
        };
    }
    
    // Add item to active items
    const now = new Date().getTime();
    const durationMs = item.duration * 24 * 60 * 60 * 1000; // Convert days to milliseconds
    const expiresAt = now + durationMs;
    
    const activeItems = getActiveItems();
    const newItem = {
        id: item.id,
        name: item.name,
        icon: item.icon,
        effect: item.effect,
        multiplier: item.multiplier || 1,
        purchased_at: now,
        expires_at: expiresAt,
        duration: item.duration
    };
    
    activeItems.push(newItem);
    
    // Save to player data
    window.playerAPI.updatePlayerData({
        active_items: activeItems
    });
    
    return { 
        success: true, 
        message: `Successfully purchased ${item.name}!`,
        item: newItem
    };
}

/**
 * Get the highest XP multiplier from active items
 */
function getXPMultiplier() {
    const activeItems = getActiveItems();
    let maxMultiplier = 1;
    
    activeItems.forEach(item => {
        if (item.effect === 'double_xp' || item.effect === 'triple_xp' || item.effect === 'quadruple_xp') {
            const multiplier = item.multiplier || 
                (item.effect === 'double_xp' ? 2 : 
                 item.effect === 'triple_xp' ? 3 : 
                 item.effect === 'quadruple_xp' ? 4 : 1);
            maxMultiplier = Math.max(maxMultiplier, multiplier);
        }
    });
    
    return maxMultiplier;
}

/**
 * Check if user has active Double XP effect (for backwards compatibility)
 */
function hasDoubleXP() {
    return getXPMultiplier() >= 2;
}

/**
 * Get time remaining for an item
 */
function getTimeRemaining(item) {
    const now = new Date().getTime();
    const expiresAt = parseInt(item.expires_at) || 0;
    const remaining = expiresAt - now;
    
    if (remaining <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    }
    
    const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
    const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
    
    return { days, hours, minutes, seconds };
}

/**
 * Format time remaining as string
 */
function formatTimeRemaining(item) {
    const time = getTimeRemaining(item);
    const parts = [];
    
    if (time.days > 0) parts.push(`${time.days}d`);
    if (time.hours > 0) parts.push(`${time.hours}h`);
    if (time.minutes > 0) parts.push(`${time.minutes}m`);
    if (time.seconds > 0 || parts.length === 0) parts.push(`${time.seconds}s`);
    
    return parts.join(' ');
}

// Expose globally
window.shop = {
    SHOP_ITEMS,
    getActiveItems,
    purchaseItem,
    hasDoubleXP,
    getXPMultiplier,
    getTimeRemaining,
    formatTimeRemaining
};

