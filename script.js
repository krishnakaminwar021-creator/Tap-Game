// ==================== Game State ====================
const GameState = {
    IDLE: 'idle',
    PLAYING: 'playing',
    PAUSED: 'paused',
    ENDED: 'ended'
};

// ==================== Game Configuration ====================
const CONFIG = {
    GAME_DURATION: 10,
    BASE_POINTS: 10,
    COMBO_TIMEOUT: 800,
    TARGET_MOVE_RANGE: 60,
    TIMER_UPDATE_INTERVAL: 50
};

// ==================== Settings ====================
let settings = {
    soundEnabled: true,
    visualEffects: true,
    gameDuration: 10,
    difficulty: 'normal',
    anonymousMode: false
};

// ==================== Game Variables ====================
let gameState = GameState.IDLE;
let score = 0;
let combo = 1;
let maxCombo = 1;
let totalTaps = 0;
let timeRemaining = CONFIG.GAME_DURATION;
let timerInterval = null;
let comboTimeout = null;

// ==================== High Scores ====================
let highScores = [];
const MAX_HIGH_SCORES = 10;

// ==================== DOM Elements ====================
const elements = {
    score: document.getElementById('score'),
    timer: document.getElementById('timer'),
    tapTarget: document.getElementById('tapTarget'),
    targetContainer: document.getElementById('targetContainer'),
    comboDisplay: document.getElementById('comboDisplay'),
    comboValue: document.getElementById('comboValue'),
    pointsPopup: document.getElementById('pointsPopup'),
    rippleContainer: document.getElementById('rippleContainer'),
    
    // Control buttons
    menuBtn: document.getElementById('menuBtn'),
    restartBtn: document.getElementById('restartBtn'),
    playPauseBtn: document.getElementById('playPauseBtn'),
    soundBtn: document.getElementById('soundBtn'),
    
    // Overlays and modals
    gameOverModal: document.getElementById('gameOverModal'),
    finalScore: document.getElementById('finalScore'),
    maxComboDisplay: document.getElementById('maxCombo'),
    totalTapsDisplay: document.getElementById('totalTaps'),
    playAgainBtn: document.getElementById('playAgainBtn'),
    menuReturnBtn: document.getElementById('menuReturnBtn'),
    
    // Menu
    menuOverlay: document.getElementById('menuOverlay'),
    playNowBtn: document.getElementById('playNowBtn'),
    highScoreBtn: document.getElementById('highScoreBtn'),
    settingsBtn: document.getElementById('settingsBtn'),
    
    // High Scores
    highscoreOverlay: document.getElementById('highscoreOverlay'),
    highscoreBackBtn: document.getElementById('highscoreBackBtn'),
    scoresList: document.getElementById('scoresList'),
    clearScoresBtn: document.getElementById('clearScoresBtn'),
    
    // Settings
    settingsOverlay: document.getElementById('settingsOverlay'),
    settingsBackBtn: document.getElementById('settingsBackBtn'),
    soundToggle: document.getElementById('soundToggle'),
    visualToggle: document.getElementById('visualToggle'),
    durationSelect: document.getElementById('durationSelect'),
    difficultySelect: document.getElementById('difficultySelect'),
    anonymousToggle: document.getElementById('anonymousToggle'),
    anonymousIndicator: document.getElementById('anonymousIndicator'),
    resetSettingsBtn: document.getElementById('resetSettingsBtn'),
    gameContainer: document.querySelector('.game-container'),
    
    // Pause
    pauseOverlay: document.getElementById('pauseOverlay'),
    pauseMenuBtn: document.getElementById('pauseMenuBtn'),
    
    // Timer display container
    timerDisplay: document.querySelector('.timer-display'),
    
    // Background effects
    bgEffects: document.querySelector('.bg-effects')
};

// ==================== Audio Context ====================
let audioContext = null;

function initAudio() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
}

function playTapSound() {
    if (!settings.soundEnabled || !audioContext) return;
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(800 + (combo * 50), audioContext.currentTime);
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
}

function playComboSound() {
    if (!settings.soundEnabled || !audioContext) return;
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(1200, audioContext.currentTime);
    oscillator.type = 'triangle';
    
    gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.15);
}

function playGameOverSound() {
    if (!settings.soundEnabled || !audioContext) return;
    
    const notes = [523, 392, 330, 262];
    notes.forEach((freq, i) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(freq, audioContext.currentTime + i * 0.15);
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime + i * 0.15);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + i * 0.15 + 0.2);
        
        oscillator.start(audioContext.currentTime + i * 0.15);
        oscillator.stop(audioContext.currentTime + i * 0.15 + 0.2);
    });
}

function playButtonSound() {
    if (!settings.soundEnabled || !audioContext) return;
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.08);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.08);
}

// ==================== Local Storage ====================
function loadHighScores() {
    const saved = localStorage.getItem('neonTapHighScores');
    if (saved) {
        highScores = JSON.parse(saved);
    }
}

function saveHighScores() {
    localStorage.setItem('neonTapHighScores', JSON.stringify(highScores));
}

function addHighScore(score) {
    const entry = {
        score: score,
        date: new Date().toLocaleDateString(),
        combo: maxCombo,
        taps: totalTaps
    };
    
    highScores.push(entry);
    highScores.sort((a, b) => b.score - a.score);
    highScores = highScores.slice(0, MAX_HIGH_SCORES);
    saveHighScores();
}

function clearHighScores() {
    highScores = [];
    saveHighScores();
    renderHighScores();
}

function loadSettings() {
    const saved = localStorage.getItem('neonTapSettings');
    if (saved) {
        settings = { ...settings, ...JSON.parse(saved) };
    }
    applySettings();
}

function saveSettings() {
    localStorage.setItem('neonTapSettings', JSON.stringify(settings));
}

function applySettings() {
    // Apply sound setting
    elements.soundToggle.checked = settings.soundEnabled;
    updateSoundButtonUI();
    
    // Apply visual effects
    elements.visualToggle.checked = settings.visualEffects;
    if (settings.visualEffects) {
        elements.bgEffects.style.display = 'block';
    } else {
        elements.bgEffects.style.display = 'none';
    }
    
    // Apply duration
    elements.durationSelect.value = settings.gameDuration;
    CONFIG.GAME_DURATION = settings.gameDuration;
    
    // Apply difficulty
    elements.difficultySelect.value = settings.difficulty;
    switch (settings.difficulty) {
        case 'easy':
            CONFIG.TARGET_MOVE_RANGE = 40;
            CONFIG.COMBO_TIMEOUT = 1000;
            break;
        case 'normal':
            CONFIG.TARGET_MOVE_RANGE = 70;
            CONFIG.COMBO_TIMEOUT = 800;
            break;
        case 'hard':
            CONFIG.TARGET_MOVE_RANGE = 100;
            CONFIG.COMBO_TIMEOUT = 500;
            break;
    }
    
    // Apply anonymous mode
    elements.anonymousToggle.checked = settings.anonymousMode;
    if (settings.anonymousMode) {
        elements.gameContainer.classList.add('anonymous-mode');
    } else {
        elements.gameContainer.classList.remove('anonymous-mode');
    }
}

function resetSettings() {
    settings = {
        soundEnabled: true,
        visualEffects: true,
        gameDuration: 10,
        difficulty: 'normal',
        anonymousMode: false
    };
    saveSettings();
    applySettings();
}

// ==================== UI Rendering ====================
function renderHighScores() {
    if (highScores.length === 0) {
        elements.scoresList.innerHTML = `
            <div class="no-scores">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M8 15h8M9 9h.01M15 9h.01"/>
                </svg>
                <p>No high scores yet!</p>
                <p>Play a game to set your first record.</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    highScores.forEach((entry, index) => {
        let rankClass = '';
        if (index === 0) rankClass = 'gold';
        else if (index === 1) rankClass = 'silver';
        else if (index === 2) rankClass = 'bronze';
        
        html += `
            <div class="score-item ${rankClass}">
                <div class="score-rank">${index + 1}</div>
                <div class="score-details">
                    <div class="score-value">${formatScore(entry.score)}</div>
                    <div class="score-date">${entry.date} • x${entry.combo} combo • ${entry.taps} taps</div>
                </div>
            </div>
        `;
    });
    
    elements.scoresList.innerHTML = html;
}

// ==================== Game Functions ====================
function formatScore(num) {
    return String(num).padStart(5, '0');
}

function formatTime(time) {
    return time.toFixed(1);
}

function updateDisplay() {
    elements.score.textContent = formatScore(score);
    elements.timer.textContent = formatTime(timeRemaining);
    elements.comboValue.textContent = `x${combo}`;
    
    // Update P2 display if in 2-player mode
    if (settings.twoPlayerMode) {
        updateDisplayP2();
    }
    
    // Warning state for timer
    if (timeRemaining <= 3 && timeRemaining > 0) {
        elements.timerDisplay.classList.add('warning');
    } else {
        elements.timerDisplay.classList.remove('warning');
    }
}

function moveTarget() {
    if (settings.anonymousMode) {
        // Anonymous mode: move target anywhere on the gameplay area
        const gameplayArea = document.querySelector('.gameplay-area');
        const containerRect = gameplayArea.getBoundingClientRect();
        const targetSize = 170; // Size of target in anonymous mode
        
        // Calculate safe bounds (keeping target fully visible)
        const padding = 20;
        const maxX = containerRect.width - targetSize - padding;
        const maxY = containerRect.height - targetSize - padding;
        
        const randomX = padding + Math.random() * maxX;
        const randomY = padding + Math.random() * maxY;
        
        elements.targetContainer.style.left = `${randomX}px`;
        elements.targetContainer.style.top = `${randomY}px`;
        elements.targetContainer.style.transform = 'none';
    } else {
        // Normal mode: slight movement around center
        const x = (Math.random() - 0.5) * CONFIG.TARGET_MOVE_RANGE * 2;
        const y = (Math.random() - 0.5) * CONFIG.TARGET_MOVE_RANGE * 2;
        elements.targetContainer.style.transform = `translate(${x}px, ${y}px)`;
    }
}

function createRipple(e) {
    if (!settings.visualEffects) return;
    
    const ripple = document.createElement('div');
    ripple.classList.add('ripple');
    
    const rect = elements.tapTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - 150;
    const y = e.clientY - rect.top - 150;
    
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    
    elements.rippleContainer.appendChild(ripple);
    
    setTimeout(() => {
        ripple.remove();
    }, 600);
}

function showPointsPopup(points) {
    if (!settings.visualEffects) return;
    
    const popup = document.createElement('div');
    popup.classList.add('point-float');
    popup.textContent = `+${points}`;
    
    const x = Math.random() * 60 - 30;
    popup.style.left = `calc(50% + ${x}px)`;
    popup.style.top = '40%';
    
    elements.pointsPopup.appendChild(popup);
    
    setTimeout(() => {
        popup.remove();
    }, 800);
}

function handleTap(e) {
    if (gameState !== GameState.PLAYING) return;
    
    // Initialize audio on first tap
    initAudio();
    
    // Create ripple effect
    createRipple(e);
    
    // Play tap sound
    playTapSound();
    
    // Clear existing combo timeout
    if (comboTimeout) {
        clearTimeout(comboTimeout);
    }
    
    // Calculate points
    const points = CONFIG.BASE_POINTS * combo;
    score += points;
    totalTaps++;
    
    // Show points popup
    showPointsPopup(points);
    
    // Increase combo
    combo++;
    if (combo > maxCombo) {
        maxCombo = combo;
    }
    
    // Combo animation
    elements.comboDisplay.classList.add('active');
    setTimeout(() => {
        elements.comboDisplay.classList.remove('active');
    }, 300);
    
    // Play combo sound for milestones
    if (combo % 5 === 0) {
        playComboSound();
    }
    
    // Move target slightly
    moveTarget();
    
    // Update display
    updateDisplay();
    
    // Set combo timeout - reset combo if no tap within timeout period
    comboTimeout = setTimeout(() => {
        if (gameState === GameState.PLAYING) {
            combo = 1;
            updateDisplay();
        }
    }, CONFIG.COMBO_TIMEOUT);
}

function startTimer() {
    timerInterval = setInterval(() => {
        if (gameState === GameState.PLAYING) {
            timeRemaining -= CONFIG.TIMER_UPDATE_INTERVAL / 1000;
            
            if (timeRemaining <= 0) {
                timeRemaining = 0;
                endGame();
            }
            
            updateDisplay();
        }
    }, CONFIG.TIMER_UPDATE_INTERVAL);
}

function startGame() {
    gameState = GameState.PLAYING;
    score = 0;
    combo = 1;
    maxCombo = 1;
    totalTaps = 0;
    timeRemaining = CONFIG.GAME_DURATION;
    
    // Apply anonymous mode class
    if (settings.anonymousMode) {
        elements.gameContainer.classList.add('anonymous-mode');
    } else {
        elements.gameContainer.classList.remove('anonymous-mode');
    }
    
    // Reset target position
    if (settings.anonymousMode) {
        // Set initial random position for anonymous mode
        setTimeout(() => {
            moveTarget();
        }, 50);
    } else {
        elements.targetContainer.style.transform = 'translate(0, 0)';
        elements.targetContainer.style.left = '';
        elements.targetContainer.style.top = '';
    }
    
    // Enable tap target
    elements.tapTarget.disabled = false;
    
    // Hide menu overlay
    elements.menuOverlay.classList.add('hidden');
    
    // Hide pause overlay
    elements.pauseOverlay.classList.add('hidden');
    
    // Hide game over modal
    elements.gameOverModal.classList.remove('active');
    
    // Update play/pause button
    updatePlayPauseButton();
    
    // Update display
    updateDisplay();
    
    // Start timer
    startTimer();
}

function pauseGame() {
    if (gameState !== GameState.PLAYING) return;
    
    gameState = GameState.PAUSED;
    
    // Show pause overlay
    elements.pauseOverlay.classList.remove('hidden');
    
    // Update button
    updatePlayPauseButton();
}

function resumeGame() {
    if (gameState !== GameState.PAUSED) return;
    
    gameState = GameState.PLAYING;
    
    // Hide pause overlay
    elements.pauseOverlay.classList.add('hidden');
    
    // Update button
    updatePlayPauseButton();
}

function endGame() {
    gameState = GameState.ENDED;
    
    // Clear intervals and timeouts
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    if (comboTimeout) {
        clearTimeout(comboTimeout);
        comboTimeout = null;
    }
    
    // Disable tap target
    elements.tapTarget.disabled = true;
    
    // Update button
    updatePlayPauseButton();
    
    // Play game over sound
    playGameOverSound();
    
    // Add high score
    addHighScore(score);
    
    // Show game over modal
    setTimeout(() => {
        elements.finalScore.textContent = formatScore(score);
        elements.maxComboDisplay.textContent = `x${maxCombo}`;
        elements.totalTapsDisplay.textContent = totalTaps;
        elements.gameOverModal.classList.add('active');
    }, 300);
}

function restartGame() {
    // Clear existing intervals
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    if (comboTimeout) {
        clearTimeout(comboTimeout);
        comboTimeout = null;
    }
    
    // Hide modals
    elements.gameOverModal.classList.remove('active');
    elements.pauseOverlay.classList.add('hidden');
    
    // Start fresh game
    startGame();
}

function goToMenu() {
    // Clear existing intervals
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    if (comboTimeout) {
        clearTimeout(comboTimeout);
        comboTimeout = null;
    }
    
    gameState = GameState.IDLE;
    
    // Reset display
    score = 0;
    combo = 1;
    timeRemaining = CONFIG.GAME_DURATION;
    updateDisplay();
    
    // Disable tap target
    elements.tapTarget.disabled = true;
    
    // Reset target position and remove anonymous mode class
    elements.targetContainer.style.transform = 'translate(0, 0)';
    elements.targetContainer.style.left = '';
    elements.targetContainer.style.top = '';
    elements.gameContainer.classList.remove('anonymous-mode');
    
    // Hide all overlays/modals
    elements.gameOverModal.classList.remove('active');
    elements.pauseOverlay.classList.add('hidden');
    elements.highscoreOverlay.classList.add('hidden');
    elements.settingsOverlay.classList.add('hidden');
    
    // Show menu
    elements.menuOverlay.classList.remove('hidden');
    
    // Update button
    updatePlayPauseButton();
}

function togglePlayPause() {
    initAudio();
    playButtonSound();
    
    if (gameState === GameState.IDLE) {
        startGame();
    } else if (gameState === GameState.PLAYING) {
        pauseGame();
    } else if (gameState === GameState.PAUSED) {
        resumeGame();
    } else if (gameState === GameState.ENDED) {
        restartGame();
    }
}

function updatePlayPauseButton() {
    const playIcon = elements.playPauseBtn.querySelector('.play-icon');
    const pauseIcon = elements.playPauseBtn.querySelector('.pause-icon');
    
    if (gameState === GameState.PLAYING) {
        playIcon.classList.add('hidden');
        pauseIcon.classList.remove('hidden');
    } else {
        playIcon.classList.remove('hidden');
        pauseIcon.classList.add('hidden');
    }
}

function updateSoundButtonUI() {
    const soundOn = elements.soundBtn.querySelector('.sound-on');
    const soundOff = elements.soundBtn.querySelector('.sound-off');
    
    if (settings.soundEnabled) {
        soundOn.classList.remove('hidden');
        soundOff.classList.add('hidden');
    } else {
        soundOn.classList.add('hidden');
        soundOff.classList.remove('hidden');
    }
}

function toggleSound() {
    settings.soundEnabled = !settings.soundEnabled;
    elements.soundToggle.checked = settings.soundEnabled;
    saveSettings();
    updateSoundButtonUI();
    
    initAudio();
    playButtonSound();
}

// ==================== Menu Navigation ====================
function showHighScores() {
    initAudio();
    playButtonSound();
    renderHighScores();
    elements.menuOverlay.classList.add('hidden');
    elements.highscoreOverlay.classList.remove('hidden');
}

function showSettings() {
    initAudio();
    playButtonSound();
    elements.menuOverlay.classList.add('hidden');
    elements.settingsOverlay.classList.remove('hidden');
}

function hideHighScores() {
    initAudio();
    playButtonSound();
    elements.highscoreOverlay.classList.add('hidden');
    elements.menuOverlay.classList.remove('hidden');
}

function hideSettings() {
    initAudio();
    playButtonSound();
    elements.settingsOverlay.classList.add('hidden');
    elements.menuOverlay.classList.remove('hidden');
}

// ==================== Event Listeners ====================
// Tap target
elements.tapTarget.addEventListener('click', handleTap);
elements.tapTarget.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const syntheticEvent = {
        clientX: touch.clientX,
        clientY: touch.clientY
    };
    handleTap(syntheticEvent);
}, { passive: false });

// Menu buttons
elements.playNowBtn.addEventListener('click', () => {
    initAudio();
    playButtonSound();
    startGame();
});

elements.highScoreBtn.addEventListener('click', showHighScores);
elements.settingsBtn.addEventListener('click', showSettings);

// Back buttons
elements.highscoreBackBtn.addEventListener('click', hideHighScores);
elements.settingsBackBtn.addEventListener('click', hideSettings);

// Clear scores
elements.clearScoresBtn.addEventListener('click', () => {
    initAudio();
    playButtonSound();
    if (confirm('Are you sure you want to clear all high scores?')) {
        clearHighScores();
    }
});

// Settings controls
elements.soundToggle.addEventListener('change', () => {
    settings.soundEnabled = elements.soundToggle.checked;
    saveSettings();
    updateSoundButtonUI();
    initAudio();
    playButtonSound();
});

elements.visualToggle.addEventListener('change', () => {
    settings.visualEffects = elements.visualToggle.checked;
    saveSettings();
    applySettings();
    initAudio();
    playButtonSound();
});

elements.durationSelect.addEventListener('change', () => {
    settings.gameDuration = parseInt(elements.durationSelect.value);
    CONFIG.GAME_DURATION = settings.gameDuration;
    timeRemaining = CONFIG.GAME_DURATION;
    updateDisplay();
    saveSettings();
    initAudio();
    playButtonSound();
});

elements.difficultySelect.addEventListener('change', () => {
    settings.difficulty = elements.difficultySelect.value;
    saveSettings();
    applySettings();
    initAudio();
    playButtonSound();
});

elements.anonymousToggle.addEventListener('change', () => {
    settings.anonymousMode = elements.anonymousToggle.checked;
    saveSettings();
    applySettings();
    initAudio();
    playButtonSound();
});

elements.resetSettingsBtn.addEventListener('click', () => {
    initAudio();
    playButtonSound();
    resetSettings();
});

// Control panel buttons
elements.menuBtn.addEventListener('click', () => {
    initAudio();
    playButtonSound();
    if (gameState === GameState.PLAYING) {
        pauseGame();
    }
    goToMenu();
});

elements.restartBtn.addEventListener('click', () => {
    initAudio();
    playButtonSound();
    restartGame();
});

elements.playPauseBtn.addEventListener('click', togglePlayPause);
elements.soundBtn.addEventListener('click', toggleSound);

// Game over modal buttons
elements.playAgainBtn.addEventListener('click', () => {
    initAudio();
    playButtonSound();
    restartGame();
});

elements.menuReturnBtn.addEventListener('click', () => {
    initAudio();
    playButtonSound();
    goToMenu();
});

// Pause menu button
elements.pauseMenuBtn.addEventListener('click', () => {
    initAudio();
    playButtonSound();
    goToMenu();
});

// Keyboard controls
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        if (gameState === GameState.PLAYING) {
            const rect = elements.tapTarget.getBoundingClientRect();
            const syntheticEvent = {
                clientX: rect.left + rect.width / 2,
                clientY: rect.top + rect.height / 2
            };
            handleTap(syntheticEvent);
        } else if (gameState === GameState.IDLE && elements.menuOverlay.classList.contains('hidden')) {
            initAudio();
            startGame();
        }
    } else if (e.code === 'Escape') {
        if (gameState === GameState.PLAYING) {
            pauseGame();
        } else if (gameState === GameState.PAUSED) {
            resumeGame();
        } else if (!elements.highscoreOverlay.classList.contains('hidden')) {
            hideHighScores();
        } else if (!elements.settingsOverlay.classList.contains('hidden')) {
            hideSettings();
        }
    } else if (e.code === 'KeyR') {
        if (gameState !== GameState.IDLE) {
            restartGame();
        }
    } else if (e.code === 'KeyM') {
        goToMenu();
    }
});

// Prevent context menu on long press (mobile)
document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
});

// ==================== Initialize ====================
function init() {
    loadHighScores();
    loadSettings();
    updateDisplay();
    elements.tapTarget.disabled = true;
    updatePlayPauseButton();
}

init();
