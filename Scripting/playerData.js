// playerData.js - LocalStorage Integration
const STORAGE_KEY_PREFIX = "virtual_life_player_data_";

// Default player data structure
const defaultPlayerData = {
    username: "",
    level: 1,
    xp: 0,
    max_xp: 500,
    total_xp: 0,
    tasks_done: 0,
    health: 100,
    motivation: 100,
    day_started: false,
    last_start_date: null,
    tasks_completed: [],
    total_tasks_completed: 0,
    last_reset_time: null,
    rewards_unlocked: [],
    streak: 0,
    last_activity_date: null,
    total_points: 0,
    active_items: []
};

// Global player data state
let playerData = { ...defaultPlayerData };

// Get current logged-in username
function getCurrentUsername() {
    const username = localStorage.getItem('currentUser');
    if (!username) {
        // If no user is logged in, redirect to login page (index.html)
        if (!window.location.pathname.includes('index.html') && !window.location.pathname.endsWith('/')) {
            const isInStructure = window.location.pathname.includes('Structure');
            const loginPath = isInStructure ? '../index.html' : 'index.html';
            window.location.href = loginPath;
        }
        return null;
    }
    return username;
}

// Load player data from localStorage for the current user
function loadPlayerData(username = null) {
    // Get current username if not provided
    if (!username) {
        username = getCurrentUsername();
        if (!username) {
            console.warn("No user logged in, cannot load player data");
            return null;
        }
    }
    
    try {
        const storageKey = `${STORAGE_KEY_PREFIX}${username}`;
        const stored = localStorage.getItem(storageKey);
        if (stored) {
            const parsed = JSON.parse(stored);
            // Merge with defaults to ensure all fields exist
            playerData = {
                ...defaultPlayerData,
                ...parsed,
                username: username,
                level: parseInt(parsed.level) || 1,
                xp: parseInt(parsed.xp) || 0,
                max_xp: parseInt(parsed.max_xp) || 500,
                total_xp: parseInt(parsed.total_xp) || 0,
                tasks_done: parseInt(parsed.tasks_done) || 0,
                health: parseInt(parsed.health) || 100,
                motivation: parseInt(parsed.motivation) || 100,
                day_started: parsed.day_started || false,
                last_start_date: parsed.last_start_date || null,
                tasks_completed: Array.isArray(parsed.tasks_completed) ? parsed.tasks_completed : [],
                total_tasks_completed: parseInt(parsed.total_tasks_completed) || 0,
                last_reset_time: parsed.last_reset_time || null,
                rewards_unlocked: Array.isArray(parsed.rewards_unlocked) ? parsed.rewards_unlocked : []
            };
            console.log("Player data loaded from localStorage:", playerData);
            return playerData;
        }
    } catch (error) {
        console.error("Error loading player data from localStorage:", error);
    }
    
    // Return default data if nothing stored or error occurred
    playerData = { ...defaultPlayerData, username: username };
    return playerData;
}

// Save player data to localStorage for the current user
function savePlayerData(data = null) {
    const dataToSave = data || playerData;
    const username = dataToSave.username || getCurrentUsername();
    
    if (!username) {
        console.error("Cannot save player data: No user logged in");
        return false;
    }
    
    try {
        const storageKey = `${STORAGE_KEY_PREFIX}${username}`;
        localStorage.setItem(storageKey, JSON.stringify(dataToSave));
        console.log("Player data saved to localStorage:", dataToSave);
        return true;
    } catch (error) {
        console.error("Error saving player data to localStorage:", error);
        return false;
    }
}

// Update player data and save to localStorage
function updatePlayerData(updates) {
    // SAFEGUARD: Ensure total_tasks_completed NEVER decreases - only increments
    if (updates.hasOwnProperty('total_tasks_completed')) {
        const currentTotal = parseInt(playerData.total_tasks_completed) || 0;
        const newTotal = parseInt(updates.total_tasks_completed) || 0;
        // Only allow increment, never decrease
        if (newTotal < currentTotal) {
            console.warn(`Attempted to decrease total_tasks_completed from ${currentTotal} to ${newTotal}. Blocked!`);
            updates.total_tasks_completed = currentTotal; // Keep current value
        }
    }
    
    Object.assign(playerData, updates);
    const saved = savePlayerData();
    
    // Sync to backend storage if UserDatabase is available
    if (saved && window.UserDatabase && playerData.username) {
        // Sync game data to backend storage
        if (typeof window.UserDatabase.syncGameDataToBackend === 'function') {
            window.UserDatabase.syncGameDataToBackend(playerData.username, playerData);
        }
    }
    
    // Dispatch event to notify other components of data change
    if (saved) {
        window.dispatchEvent(new CustomEvent('playerDataUpdated', { detail: { ...playerData } }));
    }
    
    return saved;
}

// Get current player data
function getPlayerData() {
    return { ...playerData };
}

// Expose utilities globally
window.playerAPI = {
    loadPlayerData,
    savePlayerData,
    updatePlayerData,
    getPlayerData,
    playerData: new Proxy(playerData, {
        set(target, prop, value) {
            target[prop] = value;
            // Auto-save when data changes (debounced)
            clearTimeout(window._saveTimeout);
            window._saveTimeout = setTimeout(() => {
                savePlayerData();
            }, 500);
            return true;
        }
    })
};

// Auto-load data when script loads (only if user is logged in)
const currentUser = getCurrentUsername();
if (currentUser) {
    loadPlayerData(currentUser);
    console.log("Player data initialized from localStorage:", playerData);
    // Dispatch custom event to notify other scripts
    window.dispatchEvent(new CustomEvent('playerDataLoaded', { detail: playerData }));
} else {
    console.log("No user logged in, player data not loaded");
}
