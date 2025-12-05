// decorationUtils.js - Global decoration application utility

/**
 * Apply all decorations to the current page
 */
function applyDecorations() {
    if (!window.playerAPI) return;
    
    const playerData = window.playerAPI.getPlayerData();
    const decorations = playerData.decorations || {};
    
    // Apply avatar border decorations
    applyAvatarBorderDecoration(decorations);
    
    // Apply username decorations
    applyUsernameDecoration(decorations);
    
    // Apply title decoration
    applyTitleDecoration(decorations);
}

/**
 * Check if current theme is light
 */
function isLightTheme() {
    return document.body.classList.contains('light-theme') || 
           localStorage.getItem('theme') === 'light';
}

/**
 * Apply avatar border decorations
 */
function applyAvatarBorderDecoration(decorations) {
    const avatarImg = document.querySelector('.avatar-img');
    const avatarWrap = document.querySelector('.avatar-wrap') || document.querySelector('.avatar-section');
    if (!avatarImg && !avatarWrap) return;
    
    const target = avatarImg || avatarWrap;
    const isLight = isLightTheme();
    
    // Remove existing border classes
    target.classList.remove(
        'avatar-border-fire', 'avatar-border-ice', 'avatar-border-lightning', 'avatar-border-rainbow',
        'avatar-border-gold', 'avatar-border-silver', 'avatar-border-neon', 'avatar-border-royal',
        'theme-light', 'theme-dark'
    );
    
    // Add theme class for styling
    target.classList.add(isLight ? 'theme-light' : 'theme-dark');
    
    // Apply animation border
    if (decorations.avatar_border_animation) {
        const animClass = `avatar-border-${decorations.avatar_border_animation}`;
        target.classList.add(animClass);
    }
    
    // Apply static border
    if (decorations.avatar_border_static) {
        const staticClass = `avatar-border-${decorations.avatar_border_static}`;
        target.classList.add(staticClass);
    }
}

/**
 * Apply username decorations
 */
function applyUsernameDecoration(decorations) {
    const userNameElements = [
        document.querySelector('.user-name'),
        document.querySelector('#userName'),
        document.querySelector('.player-name'),
        document.querySelector('.username')
    ].filter(el => el !== null);
    
    if (userNameElements.length === 0) return;
    
    const isLight = isLightTheme();
    
    userNameElements.forEach(el => {
        // Remove existing username decoration classes
        el.classList.remove(
            'username-fire-ice', 'username-glow', 'username-shadow', 'username-sparkle',
            'username-bold', 'username-italic', 'username-underline', 'username-gradient',
            'theme-light', 'theme-dark'
        );
        
        // Add theme class for styling
        el.classList.add(isLight ? 'theme-light' : 'theme-dark');
        
        // Apply animation
        if (decorations.username_animation) {
            const animClass = `username-${decorations.username_animation}`;
            el.classList.add(animClass);
        }
        
        // Apply static decoration
        if (decorations.username_static) {
            const staticClass = `username-${decorations.username_static}`;
            el.classList.add(staticClass);
        }
    });
}

/**
 * Apply title decoration
 */
function applyTitleDecoration(decorations) {
    const rankTitleEl = document.getElementById('rank-title');
    if (!rankTitleEl || !decorations.title) return;
    
    // Store original rank title if not already stored
    if (!rankTitleEl.dataset.originalTitle) {
        rankTitleEl.dataset.originalTitle = rankTitleEl.textContent;
    }
    
    // Apply custom title (only if decoration title exists)
    if (decorations.title) {
        rankTitleEl.textContent = decorations.title;
    }
}

// Auto-apply decorations on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(applyDecorations, 100); // Small delay to ensure other scripts have loaded
    });
} else {
    setTimeout(applyDecorations, 100);
}

// Re-apply decorations when player data is updated
window.addEventListener('playerDataUpdated', () => {
    setTimeout(applyDecorations, 100);
});

// Expose globally
window.decorationUtils = {
    applyDecorations,
    applyAvatarBorderDecoration,
    applyUsernameDecoration,
    applyTitleDecoration
};

