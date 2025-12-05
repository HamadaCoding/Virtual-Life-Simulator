// inventorySystem.js - Inventory and Items System

/**
 * Item types and definitions
 */
const ITEM_TYPES = {
    BOOST_FOCUS: {
        id: 'boost_focus',
        name: 'Focus Boost',
        description: '+50% XP for 1 hour',
        icon: '🎯',
        type: 'boost',
        duration: 60 * 60 * 1000, // 1 hour
        effect: { xpMultiplier: 0.5 }
    },
    BOOST_PRODUCTIVITY: {
        id: 'boost_productivity',
        name: 'Productivity Boost',
        description: '+30% task completion bonus for 2 hours',
        icon: '⚡',
        type: 'boost',
        duration: 2 * 60 * 60 * 1000, // 2 hours
        effect: { taskBonus: 0.3 }
    },
    HEALTH_POTION: {
        id: 'health_potion',
        name: 'Health Potion',
        description: 'Restore 20 HP',
        icon: '❤️',
        type: 'consumable',
        effect: { health: 20 }
    },
    MOTIVATION_BOOST: {
        id: 'motivation_boost',
        name: 'Motivation Boost',
        description: 'Restore 30 Motivation',
        icon: '✨',
        type: 'consumable',
        effect: { motivation: 30 }
    },
    DAILY_BONUS_SCROLL: {
        id: 'daily_bonus_scroll',
        name: 'Daily Bonus Scroll',
        description: 'Unlock a special daily quest',
        icon: '📜',
        type: 'quest_item',
        effect: { unlocksQuest: true }
    },
    XP_CRYSTAL: {
        id: 'xp_crystal',
        name: 'XP Crystal',
        description: 'Instant +500 XP',
        icon: '💎',
        type: 'consumable',
        effect: { xp: 500 }
    }
};

/**
 * Get player inventory
 */
function getInventory() {
    if (!window.playerAPI) return {};
    
    const data = window.playerAPI.getPlayerData();
    return data.inventory || {};
}

/**
 * Add item to inventory
 */
function addItem(itemId, quantity = 1) {
    if (!window.playerAPI) return false;
    
    if (!ITEM_TYPES[itemId] && !Object.values(ITEM_TYPES).find(item => item.id === itemId)) {
        console.error(`Unknown item: ${itemId}`);
        return false;
    }
    
    const data = window.playerAPI.getPlayerData();
    const inventory = data.inventory || {};
    
    const currentQuantity = inventory[itemId] || 0;
    inventory[itemId] = currentQuantity + quantity;
    
    window.playerAPI.updatePlayerData({ inventory: inventory });
    
    return true;
}

/**
 * Remove item from inventory
 */
function removeItem(itemId, quantity = 1) {
    if (!window.playerAPI) return false;
    
    const data = window.playerAPI.getPlayerData();
    const inventory = data.inventory || {};
    
    const currentQuantity = inventory[itemId] || 0;
    if (currentQuantity < quantity) {
        return false; // Not enough items
    }
    
    inventory[itemId] = currentQuantity - quantity;
    if (inventory[itemId] <= 0) {
        delete inventory[itemId];
    }
    
    window.playerAPI.updatePlayerData({ inventory: inventory });
    
    return true;
}

/**
 * Use an item
 */
function useItem(itemId) {
    if (!window.playerAPI) return { success: false, message: 'Player API not available' };
    
    const itemDef = Object.values(ITEM_TYPES).find(item => item.id === itemId) || ITEM_TYPES[itemId];
    if (!itemDef) {
        return { success: false, message: 'Item not found' };
    }
    
    // Check if player has the item
    const inventory = getInventory();
    if (!inventory[itemId] || inventory[itemId] <= 0) {
        return { success: false, message: 'Item not in inventory' };
    }
    
    // Apply item effect based on type
    if (itemDef.type === 'boost') {
        // Activate boost (store in active items)
        const data = window.playerAPI.getPlayerData();
        const activeItems = data.active_items || [];
        
        const boostItem = {
            id: itemId,
            name: itemDef.name,
            icon: itemDef.icon,
            effect: itemDef.effect,
            expiresAt: Date.now() + itemDef.duration,
            createdAt: Date.now()
        };
        
        activeItems.push(boostItem);
        window.playerAPI.updatePlayerData({ active_items: activeItems });
        
        // Remove item from inventory
        removeItem(itemId, 1);
        
        return { 
            success: true, 
            message: `${itemDef.name} activated!`,
            item: boostItem
        };
    } else if (itemDef.type === 'consumable') {
        // Apply immediate effect
        const effect = itemDef.effect;
        const data = window.playerAPI.getPlayerData();
        
        if (effect.health) {
            const currentHealth = parseInt(data.health) || 100;
            const newHealth = Math.min(100, currentHealth + effect.health);
            window.playerAPI.updatePlayerData({ health: newHealth });
        }
        
        if (effect.motivation) {
            const currentMotivation = parseInt(data.motivation) || 100;
            const newMotivation = Math.min(100, currentMotivation + effect.motivation);
            window.playerAPI.updatePlayerData({ motivation: newMotivation });
        }
        
        if (effect.xp) {
            // Add XP using the same system as tasks
            if (window.tasks && window.tasks.app) {
                window.tasks.app.gainXp(effect.xp);
            } else if (window.app && window.app.gainXp) {
                window.app.gainXp(effect.xp);
            }
        }
        
        // Remove item from inventory
        removeItem(itemId, 1);
        
        return { 
            success: true, 
            message: `${itemDef.name} used!`,
            effect: effect
        };
    } else if (itemDef.type === 'quest_item') {
        // Handle quest item (e.g., unlock a quest)
        const effect = itemDef.effect;
        if (effect && effect.unlocksQuest && window.questSystem) {
            const dailyQuest = window.questSystem.generateDailyQuests()[0];
            window.questSystem.addQuest(dailyQuest);
        }
        
        removeItem(itemId, 1);
        
        return { 
            success: true, 
            message: `${itemDef.name} used! Special quest unlocked!`
        };
    }
    
    return { success: false, message: 'Unknown item type' };
}

/**
 * Get active items (boosts)
 */
function getActiveItems() {
    if (!window.playerAPI) return [];
    
    const data = window.playerAPI.getPlayerData();
    const activeItems = data.active_items || [];
    const now = Date.now();
    
    // Filter out expired items
    const validItems = activeItems.filter(item => item.expiresAt > now);
    
    // Update if some items expired
    if (validItems.length !== activeItems.length) {
        window.playerAPI.updatePlayerData({ active_items: validItems });
    }
    
    return validItems;
}

/**
 * Get active boost multipliers
 */
function getActiveBoostMultipliers() {
    const activeItems = getActiveItems();
    const multipliers = {
        xpMultiplier: 0,
        taskBonus: 0
    };
    
    activeItems.forEach(item => {
        if (item.effect) {
            if (item.effect.xpMultiplier) {
                multipliers.xpMultiplier += item.effect.xpMultiplier;
            }
            if (item.effect.taskBonus) {
                multipliers.taskBonus += item.effect.taskBonus;
            }
        }
    });
    
    return multipliers;
}

/**
 * Check item quantity
 */
function getItemQuantity(itemId) {
    const inventory = getInventory();
    return inventory[itemId] || 0;
}

// Expose globally
window.inventorySystem = {
    ITEM_TYPES,
    getInventory,
    addItem,
    removeItem,
    useItem,
    getActiveItems,
    getActiveBoostMultipliers,
    getItemQuantity
};

