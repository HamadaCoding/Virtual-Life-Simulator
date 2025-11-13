// Storage helper - fallback to localStorage if window.storage is not available
const StorageHelper = {
    async set(key, value) {
        try {
            if (window.storage && window.storage.set) {
                await window.storage.set(key, value);
            } else {
                // Fallback to localStorage
                localStorage.setItem(key, value);
            }
            return true;
        } catch (error) {
            // If window.storage fails, try localStorage
            try {
                localStorage.setItem(key, value);
                return true;
            } catch (e) {
                console.error('Storage error:', e);
                return false;
            }
        }
    },
    
    async get(key) {
        try {
            if (window.storage && window.storage.get) {
                const result = await window.storage.get(key);
                if (result && result.value) {
                    return { value: result.value };
                }
            }
            // Fallback to localStorage
            const value = localStorage.getItem(key);
            return value ? { value: value } : null;
        } catch (error) {
            // Fallback to localStorage
            try {
                const value = localStorage.getItem(key);
                return value ? { value: value } : null;
            } catch (e) {
                console.error('Storage get error:', e);
                return null;
            }
        }
    },
    
    async list(prefix) {
        try {
            if (window.storage && window.storage.list) {
                return await window.storage.list(prefix);
            } else {
                // Fallback: get all localStorage keys with prefix
                const keys = [];
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && key.startsWith(prefix)) {
                        keys.push(key);
                    }
                }
                return { keys: keys };
            }
        } catch (error) {
            // Fallback: get all localStorage keys with prefix
            try {
                const keys = [];
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && key.startsWith(prefix)) {
                        keys.push(key);
                    }
                }
                return { keys: keys };
            } catch (e) {
                console.error('Storage list error:', e);
                return { keys: [] };
            }
        }
    }
};

// Theme Management
function toggleTheme() {
    document.body.classList.toggle('light-theme');
    const theme = document.body.classList.contains('light-theme') ? 'light' : 'dark';
    try {
        StorageHelper.set('theme', theme);
    } catch (error) {
        console.log('Could not save theme preference');
    }
}

// Load saved theme
async function loadTheme() {
    try {
        const result = await StorageHelper.get('theme');
        if (result && result.value === 'light') {
            document.body.classList.add('light-theme');
        }
    } catch (error) {
        console.log('No saved theme found');
    }
}

// Initialize theme on load
loadTheme();

// Default game data for new users
const defaultGameData = {
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
    last_activity_date: null
};

// Backend simulation using persistent storage
const UserDatabase = {
    users: {},
    
    // Expose syncGameDataToBackend globally for playerData.js
    syncGameDataToBackend: null, // Will be set below

    // Initialize with stored data from storage (loads all users from backend)
    async init() {
        try {
            // Load from backend storage (permanent storage)
            const keys = await StorageHelper.list('user:');
            if (keys && keys.keys && keys.keys.length > 0) {
                console.log(`Loading ${keys.keys.length} user(s) from backend storage...`);
                for (const key of keys.keys) {
                    const result = await StorageHelper.get(key);
                    if (result && result.value) {
                        try {
                            const username = key.replace('user:', '');
                            this.users[username] = JSON.parse(result.value);
                            console.log(`✓ Loaded user from backend: ${username}`);
                        } catch (parseError) {
                            console.error('Error parsing user data:', parseError);
                        }
                    }
                }
                console.log(`✓ Database initialized with ${Object.keys(this.users).length} user(s)`);
            } else {
                console.log('No users found in backend storage, starting fresh database');
            }
        } catch (error) {
            console.error('Error initializing user database:', error);
        }
    },

    // Save user to storage in a clean, readable object format
    async saveUser(username, password) {
        // Create user object with all account data in a structured format
        const userObject = { 
            username: username,
            password: password, 
            createdAt: new Date().toISOString(),
            gameData: { 
                ...defaultGameData,
                username: username // Ensure username is in gameData too
            }
        };
        
        // Store in memory cache
        this.users[username] = userObject;
        
        try {
            // Save to backend storage using StorageHelper (permanent storage)
            const userJson = JSON.stringify(userObject, null, 2);
            const saved = await StorageHelper.set(`user:${username}`, userJson);
            
            if (!saved) {
                console.error('Failed to save user to backend storage');
                // Try localStorage as fallback
                try {
                    localStorage.setItem(`user:${username}`, userJson);
                    this.saveUserGameData(username, userObject.gameData);
                    console.log(`User saved to localStorage as fallback: ${username}`);
                    return true;
                } catch (fallbackError) {
                    console.error('Fallback save also failed:', fallbackError);
                    return false;
                }
            }
            
            // Also save game data to localStorage for the playerData.js system (for local caching)
            this.saveUserGameData(username, userObject.gameData);
            
            // Verify the account was saved by reading it back
            const verifyResult = await StorageHelper.get(`user:${username}`);
            if (verifyResult && verifyResult.value) {
                console.log(`✓ User account created and saved permanently: ${username}`);
                console.log(`✓ Account verified in backend storage`);
            } else {
                console.warn(`⚠ Account saved but verification failed for: ${username}`);
            }
            return true;
        } catch (error) {
            console.error('Error saving user:', error);
            // Try to save to localStorage as last resort
            try {
                localStorage.setItem(`user:${username}`, JSON.stringify(userObject, null, 2));
                this.saveUserGameData(username, userObject.gameData);
                console.log(`User saved to localStorage as fallback: ${username}`);
                return true;
            } catch (fallbackError) {
                console.error('Fallback save also failed:', fallbackError);
                return false;
            }
        }
    },

    // Save user game data to localStorage
    saveUserGameData(username, gameData) {
        try {
            const storageKey = `virtual_life_player_data_${username}`;
            localStorage.setItem(storageKey, JSON.stringify({
                username: username,
                ...gameData
            }));
        } catch (error) {
            console.error('Error saving user game data:', error);
        }
    },

    // Load user game data from localStorage and sync with backend storage
    async loadUserGameData(username) {
        let gameData = null;
        let localStorageData = null;
        let backendData = null;
        
        // First, try to load from localStorage (this has the most recent progress)
        try {
            const storageKey = `virtual_life_player_data_${username}`;
            const stored = localStorage.getItem(storageKey);
            if (stored) {
                const parsed = JSON.parse(stored);
                localStorageData = parsed;
            }
        } catch (error) {
            console.error('Error loading user game data from localStorage:', error);
        }
        
        // Also try to load from backend storage
        try {
            const backendKey = `user:${username}`;
            const backendResult = await StorageHelper.get(backendKey);
            if (backendResult && backendResult.value) {
                const backendUser = JSON.parse(backendResult.value);
                if (backendUser && backendUser.gameData) {
                    backendData = backendUser.gameData;
                }
            }
        } catch (error) {
            console.log('Backend storage not available or user not found in backend:', error);
        }
        
        // Prioritize localStorage data (most recent progress), but merge with backend if needed
        if (localStorageData) {
            gameData = localStorageData;
            // If localStorage has newer data, sync it back to backend
            if (backendData) {
                // Compare timestamps or levels to determine which is newer
                const localLevel = parseInt(localStorageData.level) || 0;
                const localXp = parseInt(localStorageData.xp) || 0;
                const backendLevel = parseInt(backendData.level) || 0;
                const backendXp = parseInt(backendData.xp) || 0;
                
                // If localStorage has more progress, sync to backend
                if (localLevel > backendLevel || (localLevel === backendLevel && localXp > backendXp)) {
                    console.log('LocalStorage has newer data, syncing to backend...');
                    await this.syncGameDataToBackend(username, gameData);
                }
            } else {
                // No backend data, sync localStorage to backend
                await this.syncGameDataToBackend(username, gameData);
            }
        } else if (backendData) {
            // Only backend data exists, use it and sync to localStorage
            gameData = backendData;
            this.saveUserGameData(username, gameData);
        }
        
        // Merge with defaults to ensure all fields exist
        if (gameData) {
            return {
                ...defaultGameData,
                ...gameData,
                username: username,
                level: parseInt(gameData.level) || 1,
                xp: parseInt(gameData.xp) || 0,
                max_xp: parseInt(gameData.max_xp) || 500,
                total_xp: parseInt(gameData.total_xp) || 0,
                tasks_done: parseInt(gameData.tasks_done) || 0,
                health: parseInt(gameData.health) || 100,
                motivation: parseInt(gameData.motivation) || 100,
                total_tasks_completed: parseInt(gameData.total_tasks_completed) || 0
            };
        }
        
        // Return default data if nothing found
        return { ...defaultGameData, username: username };
    },
    
    // Sync game data to backend storage
    async syncGameDataToBackend(username, gameData) {
        try {
            const backendKey = `user:${username}`;
            const backendResult = await StorageHelper.get(backendKey);
            
            if (backendResult && backendResult.value) {
                const backendUser = JSON.parse(backendResult.value);
                backendUser.gameData = gameData;
                await StorageHelper.set(backendKey, JSON.stringify(backendUser, null, 2));
                // Also update memory cache
                this.users[username] = backendUser;
                console.log(`Synced game data to backend for user: ${username}`);
            } else {
                // User object doesn't exist in backend, try to get password from memory
                let password = '';
                if (this.users[username] && this.users[username].password) {
                    password = this.users[username].password;
                }
                
                const userObject = {
                    username: username,
                    password: password,
                    createdAt: new Date().toISOString(),
                    gameData: gameData
                };
                await StorageHelper.set(backendKey, JSON.stringify(userObject, null, 2));
                this.users[username] = userObject;
                console.log(`Created backend user object and synced game data for: ${username}`);
            }
        } catch (error) {
            console.error('Error syncing game data to backend:', error);
        }
    },

    // Check if user exists (ALWAYS check backend storage first for cross-device support)
    async userExists(username) {
        // ALWAYS check backend storage first (for cross-device support)
        try {
            const backendKey = `user:${username}`;
            const result = await StorageHelper.get(backendKey);
            if (result && result.value) {
                try {
                    // Load into memory cache
                    const userData = JSON.parse(result.value);
                    this.users[username] = userData;
                    console.log(`User found in backend storage: ${username}`);
                    return true;
                } catch (parseError) {
                    console.error('Error parsing user data:', parseError);
                }
            }
        } catch (error) {
            console.log('Error checking backend storage:', error);
        }
        
        // Also check in-memory cache (for faster access on same device)
        if (username in this.users) {
            console.log(`User found in memory cache: ${username}`);
            return true;
        }
        
        console.log(`User not found: ${username}`);
        return false;
    },

    // Verify password (check both memory and backend storage)
    async verifyPassword(username, password) {
        // First check in-memory cache
        if (this.users[username] && this.users[username].password === password) {
            return true;
        }
        
        // Also check backend storage
        try {
            const backendKey = `user:${username}`;
            const result = await StorageHelper.get(backendKey);
            if (result && result.value) {
                try {
                    const userData = JSON.parse(result.value);
                    if (userData.password === password) {
                        // Load into memory cache for faster future access
                        this.users[username] = userData;
                        return true;
                    }
                } catch (parseError) {
                    console.error('Error parsing user data:', parseError);
                }
            }
        } catch (error) {
            console.log('Error checking backend storage for password:', error);
        }
        
        return false;
    }
};

// Expose UserDatabase globally and set up sync function
window.UserDatabase = UserDatabase;
UserDatabase.syncGameDataToBackend = UserDatabase.syncGameDataToBackend.bind(UserDatabase);

// Initialize database when page loads
UserDatabase.init();

// Current logged-in user
let currentUser = null;

function showMessage(message, isError = false) {
    const msgElement = document.getElementById('message');
    msgElement.textContent = message;
    msgElement.className = 'message ' + (isError ? 'error' : 'success');
    msgElement.style.display = 'block';
    
    setTimeout(() => {
        msgElement.style.display = 'none';
    }, 3000);
}

function showSignup() {
    document.getElementById('login-form').classList.add('hidden');
    document.getElementById('signup-form').classList.remove('hidden');
    document.getElementById('message').style.display = 'none';
}

function showLogin() {
    document.getElementById('signup-form').classList.add('hidden');
    document.getElementById('login-form').classList.remove('hidden');
    document.getElementById('message').style.display = 'none';
}

async function signup() {
    const username = document.getElementById('signup-username').value.trim();
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('signup-password-confirm').value;

    // Validation
    if (!username || !password || !confirmPassword) {
        showMessage('⚠️ Please fill in all fields', true);
        return;
    }

    if (username.length < 3) {
        showMessage('⚠️ Username must be at least 3 characters', true);
        return;
    }

    if (password.length < 6) {
        showMessage('⚠️ Password must be at least 6 characters', true);
        return;
    }

    if (password !== confirmPassword) {
        showMessage('⚠️ Passwords do not match', true);
        return;
    }

    // Ensure database is initialized
    await UserDatabase.init();

    // Check if user already exists (async check)
    const exists = await UserDatabase.userExists(username);
    if (exists) {
        showMessage('⚠️ Username already taken. Choose another.', true);
        return;
    }

    // Save new user to backend storage
    const saved = await UserDatabase.saveUser(username, password);
    if (saved) {
        showMessage('✓ Character created! Please login.', false);
        
        // Clear form and switch to login
        document.getElementById('signup-username').value = '';
        document.getElementById('signup-password').value = '';
        document.getElementById('signup-password-confirm').value = '';
        
        setTimeout(() => {
            showLogin();
        }, 1500);
    } else {
        showMessage('⚠️ Error creating account. Try again.', true);
    }
}

async function login() {
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;

    // Validation
    if (!username || !password) {
        showMessage('⚠️ Please enter username and password', true);
        return;
    }

    // Ensure database is initialized (reload from backend to get latest accounts)
    await UserDatabase.init();
    
    console.log(`Checking if user exists: ${username}`);
    console.log(`Current users in memory:`, Object.keys(UserDatabase.users));

    // Check if user exists (async check - ALWAYS checks backend storage)
    const exists = await UserDatabase.userExists(username);
    console.log(`User exists check result for ${username}:`, exists);
    
    if (!exists) {
        // Double-check by trying to load directly from storage
        try {
            const directCheck = await StorageHelper.get(`user:${username}`);
            if (directCheck && directCheck.value) {
                console.log(`User found via direct storage check, loading into cache...`);
                UserDatabase.users[username] = JSON.parse(directCheck.value);
                // Retry login
                const retryExists = await UserDatabase.userExists(username);
                if (retryExists) {
                    console.log(`User found on retry, proceeding with login...`);
                } else {
                    showMessage('⚠️ Account not found. Create one first!', true);
                    setTimeout(() => {
                        showSignup();
                    }, 2000);
                    return;
                }
            } else {
                showMessage('⚠️ Account not found. Create one first!', true);
                setTimeout(() => {
                    showSignup();
                }, 2000);
                return;
            }
        } catch (error) {
            console.error('Error in direct storage check:', error);
            showMessage('⚠️ Account not found. Create one first!', true);
            setTimeout(() => {
                showSignup();
            }, 2000);
            return;
        }
    }

    // Verify password (async check)
    const passwordValid = await UserDatabase.verifyPassword(username, password);
    if (!passwordValid) {
        showMessage('⚠️ Incorrect password. Try again.', true);
        return;
    }

    // Login successful
    currentUser = username;
    
    // Load user game data from backend (async)
    const userGameData = await UserDatabase.loadUserGameData(username);
    
    // If user doesn't have game data initialized, create it
    if (!userGameData || userGameData.level === undefined) {
        const newGameData = { ...defaultGameData, username: username };
        UserDatabase.saveUserGameData(username, newGameData);
        // Also save to backend storage
        if (UserDatabase.users[username]) {
            UserDatabase.users[username].gameData = newGameData;
            try {
                await StorageHelper.set(`user:${username}`, JSON.stringify(UserDatabase.users[username], null, 2));
            } catch (error) {
                console.error('Error saving to backend storage:', error);
            }
        }
    } else {
        // Ensure username is set in game data
        userGameData.username = username;
        
        // Sync to localStorage in the format expected by playerData.js
        // This ensures the main page can load the correct user-specific data
        UserDatabase.saveUserGameData(username, userGameData);
    }
    
    // Store current user in localStorage for session management
    localStorage.setItem('currentUser', username);
    
    showMessage('✓ Login successful! Loading your data...', false);
    
        // Small delay to ensure data is saved, then redirect
        setTimeout(() => {
            // Redirect to main game page (Structure/home.html) with user data loaded
            window.location.href = 'Structure/home.html';
        }, 1000);
}

function enterApp() {
    document.getElementById('auth-container').style.display = 'none';
    document.getElementById('app').style.display = 'block';
    document.getElementById('username-display').textContent = currentUser;
}

// Make logout function globally accessible
function logout() {
    console.log('Logout function called');
    
    // Clear current user
    currentUser = null;
    localStorage.removeItem('currentUser');
    
    // Check if we're on login page or another page
    const authContainer = document.getElementById('auth-container');
    if (authContainer) {
        // We're on login page
        const appElement = document.getElementById('app');
        if (appElement) {
            appElement.style.display = 'none';
        }
        authContainer.style.display = 'block';
        const loginUsername = document.getElementById('login-username');
        const loginPassword = document.getElementById('login-password');
        if (loginUsername) loginUsername.value = '';
        if (loginPassword) loginPassword.value = '';
        if (typeof showLogin === 'function') {
            showLogin();
        }
        if (typeof showMessage === 'function') {
            showMessage('✓ Logged out successfully', false);
        }
    } else {
        // We're on another page (like profile.html), redirect to login
        // Determine correct path based on current location
        const currentPath = window.location.pathname;
        const currentHref = window.location.href;
        let loginPath;
        
        // Check if we're in Structure folder
        if (currentPath.includes('Structure/') || currentPath.includes('Structure\\') || 
            currentHref.includes('Structure/') || currentHref.includes('Structure\\')) {
            // We're in Structure folder, index.html is in root
            loginPath = '../index.html';
        } else {
            // We're in root, index.html is in same folder
            loginPath = 'index.html';
        }
        
        console.log('Redirecting to:', loginPath);
        
        // Redirect to login page (index.html) immediately
        window.location.href = loginPath;
    }
}

// Make logout accessible globally (multiple ways to ensure it works)
window.logout = logout;

// Also expose it as a global function declaration
if (typeof window.logout === 'undefined') {
    window.logout = logout;
}

// Handle Enter key press
document.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        if (!document.getElementById('login-form').classList.contains('hidden')) {
            login();
        } else if (!document.getElementById('signup-form').classList.contains('hidden')) {
            signup();
        }
    }
});