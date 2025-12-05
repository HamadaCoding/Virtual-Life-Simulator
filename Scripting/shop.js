// shop.js - Shop functionality and item management

// Shop items configuration
const SHOP_ITEMS = [
    // ===== ITEMS SECTION =====
    {
        id: 'double_xp_potion',
        name: 'Double XP Potion',
        description: 'A potion that doubles your earned XP',
        duration: 1, // days
        cost: 500,
        icon: '⚗️',
        effect: 'double_xp',
        multiplier: 2,
        category: 'items'
    },
    {
        id: 'triple_xp_potion',
        name: 'Triple XP Potion',
        description: 'A potion that triples your earned XP',
        duration: 1, // days
        cost: 1000,
        icon: '🧪',
        effect: 'triple_xp',
        multiplier: 3,
        category: 'items'
    },
    {
        id: 'quadruple_xp_potion',
        name: 'Quadruple XP Potion',
        description: 'A potion that quadruples your earned XP',
        duration: 1, // days
        cost: 2000,
        icon: '🔬',
        effect: 'quadruple_xp',
        multiplier: 4,
        category: 'items'
    },
    // Health Potions - Instant, no duration
    {
        id: 'small_health_potion',
        name: 'Small Health Potion',
        description: 'Instantly refills 15% of your health bar',
        duration: 0, // instant, no duration
        cost: 250,
        icon: '🩸',
        effect: 'instant_health',
        amount: 15,
        category: 'items'
    },
    {
        id: 'medium_health_potion',
        name: 'Medium Health Potion',
        description: 'Instantly refills 40% of your health bar',
        duration: 0,
        cost: 500,
        icon: '💉',
        effect: 'instant_health',
        amount: 40,
        category: 'items'
    },
    {
        id: 'big_health_potion',
        name: 'Big Health Potion',
        description: 'Instantly refills 70% of your health bar',
        duration: 0,
        cost: 1000,
        icon: '🩹',
        effect: 'instant_health',
        amount: 70,
        category: 'items'
    },
    {
        id: 'huge_health_potion',
        name: 'Huge Health Potion',
        description: 'Instantly refills 90% of your health bar',
        duration: 0,
        cost: 1500,
        icon: '💊',
        effect: 'instant_health',
        amount: 90,
        category: 'items'
    },
    // Motivation Potions - Instant, no duration
    {
        id: 'small_motivation_potion',
        name: 'Small Motivation Potion',
        description: 'Instantly refills 15% of your motivation bar',
        duration: 0,
        cost: 250,
        icon: '✨',
        effect: 'instant_motivation',
        amount: 15,
        category: 'items'
    },
    {
        id: 'medium_motivation_potion',
        name: 'Medium Motivation Potion',
        description: 'Instantly refills 40% of your motivation bar',
        duration: 0,
        cost: 500,
        icon: '🌟',
        effect: 'instant_motivation',
        amount: 40,
        category: 'items'
    },
    {
        id: 'big_motivation_potion',
        name: 'Big Motivation Potion',
        description: 'Instantly refills 70% of your motivation bar',
        duration: 0,
        cost: 1000,
        icon: '⭐',
        effect: 'instant_motivation',
        amount: 70,
        category: 'items'
    },
    {
        id: 'huge_motivation_potion',
        name: 'Huge Motivation Potion',
        description: 'Instantly refills 90% of your motivation bar',
        duration: 0,
        cost: 1500,
        icon: '💫',
        effect: 'instant_motivation',
        amount: 90,
        category: 'items'
    },
    // ===== DECORATION SECTION =====
    // Avatar Border Animations
    {
        id: 'avatar_border_fire',
        name: 'Fire Border Animation',
        description: 'Orange flames animation around your avatar',
        duration: 0, // permanent decoration
        cost: 500,
        icon: '🔥',
        effect: 'decoration',
        decorationType: 'avatar_border_animation',
        value: 'fire',
        category: 'decoration'
    },
    {
        id: 'avatar_border_ice',
        name: 'Ice Border Animation',
        description: 'Frosty ice animation around your avatar',
        duration: 0,
        cost: 500,
        icon: '❄️',
        effect: 'decoration',
        decorationType: 'avatar_border_animation',
        value: 'ice',
        category: 'decoration'
    },
    {
        id: 'avatar_border_lightning',
        name: 'Lightning Border Animation',
        description: 'Electric lightning animation around your avatar',
        duration: 0,
        cost: 500,
        icon: '⚡',
        effect: 'decoration',
        decorationType: 'avatar_border_animation',
        value: 'lightning',
        category: 'decoration'
    },
    {
        id: 'avatar_border_rainbow',
        name: 'Rainbow Border Animation',
        description: 'Colorful rainbow animation around your avatar',
        duration: 0,
        cost: 500,
        icon: '🌈',
        effect: 'decoration',
        decorationType: 'avatar_border_animation',
        value: 'rainbow',
        category: 'decoration'
    },
    // Avatar Border Decorations (Static)
    {
        id: 'avatar_border_gold',
        name: 'Gold Border',
        description: 'Elegant gold border around your avatar',
        duration: 0,
        cost: 300,
        icon: '🟨',
        effect: 'decoration',
        decorationType: 'avatar_border_static',
        value: 'gold',
        category: 'decoration'
    },
    {
        id: 'avatar_border_silver',
        name: 'Silver Border',
        description: 'Shiny silver border around your avatar',
        duration: 0,
        cost: 300,
        icon: '⬜',
        effect: 'decoration',
        decorationType: 'avatar_border_static',
        value: 'silver',
        category: 'decoration'
    },
    {
        id: 'avatar_border_neon',
        name: 'Neon Border',
        description: 'Vibrant neon color border around your avatar',
        duration: 0,
        cost: 300,
        icon: '💜',
        effect: 'decoration',
        decorationType: 'avatar_border_static',
        value: 'neon',
        category: 'decoration'
    },
    {
        id: 'avatar_border_royal',
        name: 'Royal Border',
        description: 'Regal purple and gold border around your avatar',
        duration: 0,
        cost: 300,
        icon: '👑',
        effect: 'decoration',
        decorationType: 'avatar_border_static',
        value: 'royal',
        category: 'decoration'
    },
    // Username Animations
    {
        id: 'username_fire_ice',
        name: 'Fire & Ice Username',
        description: 'Fire and ice effect on your username (like Shoto)',
        duration: 0,
        cost: 600,
        icon: '🔥❄️',
        effect: 'decoration',
        decorationType: 'username_animation',
        value: 'fire_ice',
        category: 'decoration'
    },
    {
        id: 'username_glow',
        name: 'Glowing Username',
        description: 'Glowing effect on your username',
        duration: 0,
        cost: 600,
        icon: '✨',
        effect: 'decoration',
        decorationType: 'username_animation',
        value: 'glow',
        category: 'decoration'
    },
    {
        id: 'username_shadow',
        name: 'Shadow Username',
        description: 'Mysterious shadow effect on your username',
        duration: 0,
        cost: 600,
        icon: '🌑',
        effect: 'decoration',
        decorationType: 'username_animation',
        value: 'shadow',
        category: 'decoration'
    },
    {
        id: 'username_sparkle',
        name: 'Sparkle Username',
        description: 'Sparkling stars effect on your username',
        duration: 0,
        cost: 600,
        icon: '⭐',
        effect: 'decoration',
        decorationType: 'username_animation',
        value: 'sparkle',
        category: 'decoration'
    },
    // Username Decorations (Static)
    {
        id: 'username_bold',
        name: 'Bold Username',
        description: 'Bold styling for your username',
        duration: 0,
        cost: 200,
        icon: '💪',
        effect: 'decoration',
        decorationType: 'username_static',
        value: 'bold',
        category: 'decoration'
    },
    {
        id: 'username_italic',
        name: 'Italic Username',
        description: 'Italic styling for your username',
        duration: 0,
        cost: 200,
        icon: '📝',
        effect: 'decoration',
        decorationType: 'username_static',
        value: 'italic',
        category: 'decoration'
    },
    {
        id: 'username_underline',
        name: 'Underlined Username',
        description: 'Underlined styling for your username',
        duration: 0,
        cost: 200,
        icon: '📋',
        effect: 'decoration',
        decorationType: 'username_static',
        value: 'underline',
        category: 'decoration'
    },
    {
        id: 'username_gradient',
        name: 'Gradient Username',
        description: 'Beautiful gradient colors for your username',
        duration: 0,
        cost: 200,
        icon: '🎨',
        effect: 'decoration',
        decorationType: 'username_static',
        value: 'gradient',
        category: 'decoration'
    },
    // Titles
    {
        id: 'title_warrior',
        name: 'Warrior Title',
        description: 'Display "Warrior" title below your name',
        duration: 0,
        cost: 400,
        icon: '⚔️',
        effect: 'decoration',
        decorationType: 'title',
        value: 'Warrior',
        category: 'decoration'
    },
    {
        id: 'title_legend',
        name: 'Legend Title',
        description: 'Display "Legend" title below your name',
        duration: 0,
        cost: 400,
        icon: '🏆',
        effect: 'decoration',
        decorationType: 'title',
        value: 'Legend',
        category: 'decoration'
    },
    {
        id: 'title_master',
        name: 'Master Title',
        description: 'Display "Master" title below your name',
        duration: 0,
        cost: 400,
        icon: '🎓',
        effect: 'decoration',
        decorationType: 'title',
        value: 'Master',
        category: 'decoration'
    },
    {
        id: 'title_champion',
        name: 'Champion Title',
        description: 'Display "Champion" title below your name',
        duration: 0,
        cost: 400,
        icon: '🥇',
        effect: 'decoration',
        decorationType: 'title',
        value: 'Champion',
        category: 'decoration'
    }
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
    
    // Handle instant potions (health and motivation) - apply immediately, no duration
    if (item.effect === 'instant_health' || item.effect === 'instant_motivation') {
        if (!window.playerAPI) {
            return { success: false, message: 'Player API not available' };
        }
        
        const playerData = window.playerAPI.getPlayerData();
        let currentValue = item.effect === 'instant_health' 
            ? parseInt(playerData.health) || 100 
            : parseInt(playerData.motivation) || 100;
        
        // Add the percentage amount (cap at 100)
        const newValue = Math.min(100, currentValue + item.amount);
        
        const updateData = {};
        if (item.effect === 'instant_health') {
            updateData.health = newValue;
        } else {
            updateData.motivation = newValue;
        }
        
        window.playerAPI.updatePlayerData(updateData);
        
        // Trigger UI update event
        window.dispatchEvent(new CustomEvent('playerDataUpdated'));
        
        return { 
            success: true, 
            message: `${item.name} used! ${item.effect === 'instant_health' ? 'Health' : 'Motivation'} restored by ${item.amount}%`,
            item: item
        };
    }
    
    // Handle decorations - save to player data
    if (item.effect === 'decoration') {
        if (!window.playerAPI) {
            return { success: false, message: 'Player API not available' };
        }
        
        const playerData = window.playerAPI.getPlayerData();
        const decorations = playerData.decorations || {};
        
        // Store decoration based on type
        if (item.decorationType === 'title') {
            decorations.title = item.value;
        } else {
            decorations[item.decorationType] = item.value;
        }
        
        window.playerAPI.updatePlayerData({
            decorations: decorations
        });
        
        // Trigger UI update event
        window.dispatchEvent(new CustomEvent('playerDataUpdated'));
        
        return { 
            success: true, 
            message: `${item.name} equipped!`,
            item: item
        };
    }
    
    // Handle duration-based items (XP potions)
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

