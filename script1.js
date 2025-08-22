// Estado del juego
let gameState = {
    score: 0,
    level: 1,
    tapValue: 1,
    totalTaps: 0,
    playerName: '',
    upgrades: [
        {
            id: 'power',
            name: 'Poder Dorado',
            icon: '⚡',
            baseCost: 10,
            level: 0,
            multiplier: 2,
            effect: 'Aumenta el valor del tap'
        },
        {
            id: 'efficiency',
            name: 'Eficiencia',
            icon: '🔧',
            baseCost: 25,
            level: 0,
            multiplier: 1.5,
            effect: 'Reduce costos de mejoras'
        },
        {
            id: 'luck',
            name: 'Suerte',
            icon: '🍀',
            baseCost: 50,
            level: 0,
            multiplier: 1.3,
            effect: 'Chance de oro extra'
        },
        {
            id: 'auto',
            name: 'Minero',
            icon: '⛏️',
            baseCost: 100,
            level: 0,
            multiplier: 5,
            effect: 'Oro pasivo por segundo'
        }
    ]
};

// Elementos del DOM
const scoreElement = document.getElementById('score');
const tapValueElement = document.getElementById('tapValue');
const levelElement = document.getElementById('level');
const totalTapsElement = document.getElementById('totalTaps');
const tapButton = document.getElementById('tapButton');
const upgradesGrid = document.getElementById('upgradesGrid');
const bgParticles = document.getElementById('bgParticles');
const rankingList = document.getElementById('rankingList');
const refreshRankingBtn = document.getElementById('refreshRankingBtn');

// Sistema de ranking
const RANKING_KEY = 'goldTapRanking';
const MAX_RANKING_ENTRIES = 10;

// Inicializar partículas de fondo
function createBackgroundParticles() {
    for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 10 + 's';
        particle.style.animationDuration = (10 + Math.random() * 10) + 's';
        bgParticles.appendChild(particle);
    }
}

// Formatear número con separadores
function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

// Actualizar UI
function updateUI() {
    scoreElement.textContent = formatNumber(gameState.score);
    tapValueElement.textContent = formatNumber(gameState.tapValue);
    levelElement.textContent = gameState.level;
    totalTapsElement.textContent = formatNumber(gameState.totalTaps);
}

// Crear efecto de clic
function createClickEffect(x, y, value) {
    const effect = document.createElement('div');
    effect.className = 'click-effect';
    effect.textContent = `+${formatNumber(value)}`;
    effect.style.left = x + 'px';
    effect.style.top = y + 'px';
    document.body.appendChild(effect);

    setTimeout(() => effect.remove(), 1000);
}

// Crear partículas de oro
function createGoldParticles(x, y) {
    for (let i = 0; i < 8; i++) {
        const particle = document.createElement('div');
        particle.className = 'gold-particle';
        particle.style.left = x + 'px';
        particle.style.top = y + 'px';
        
        const angle = (Math.PI * 2 * i) / 8;
        const distance = 50 + Math.random() * 50;
        particle.style.setProperty('--x', Math.cos(angle) * distance + 'px');
        particle.style.setProperty('--y', Math.sin(angle) * distance + 'px');
        
        document.body.appendChild(particle);
        setTimeout(() => particle.remove(), 800);
    }
}

// Manejar tap
tapButton.addEventListener('click', (e) => {
    const rect = tapButton.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    // Calcular valor del tap
    let tapValue = gameState.tapValue;
    
    // Aplicar suerte
    if (gameState.upgrades.find(u => u.id === 'luck').level > 0) {
        const luckChance = 0.1 * gameState.upgrades.find(u => u.id === 'luck').level;
        if (Math.random() < luckChance) {
            tapValue *= 2;
            showNotification('¡Suerte! ¡Doble oro!');
        }
    }

    // Actualizar estado
    gameState.score += tapValue;
    gameState.totalTaps++;

    // Crear efectos visuales
    createClickEffect(x, y - 50, tapValue);
    createGoldParticles(x, y);

    // Verificar nivel
    checkLevelUp();

    // Actualizar UI
    updateUI();
    updateUpgrades();
    
    // Guardar progreso
    saveGameProgress();
});

// Verificar subida de nivel
function checkLevelUp() {
    const newLevel = Math.floor(gameState.totalTaps / 50) + 1;
    if (newLevel > gameState.level) {
        gameState.level = newLevel;
        gameState.tapValue = Math.floor(gameState.tapValue * 1.2);
        showNotification(`¡Nivel ${gameState.level} alcanzado!`);
    }
}

// Mostrar notificación
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'notification-slide 0.5s ease-out reverse';
        setTimeout(() => notification.remove(), 500);
    }, 2000);
}

// Calcular costo de mejora
function getUpgradeCost(upgrade) {
    let cost = upgrade.baseCost * Math.pow(upgrade.multiplier, upgrade.level);
    
    // Aplicar eficiencia
    const efficiencyLevel = gameState.upgrades.find(u => u.id === 'efficiency').level;
    if (efficiencyLevel > 0) {
        cost *= Math.pow(0.9, efficiencyLevel);
    }
    
    return Math.floor(cost);
}

// Comprar mejora
function buyUpgrade(upgradeId) {
    const upgrade = gameState.upgrades.find(u => u.id === upgradeId);
    const cost = getUpgradeCost(upgrade);

    if (gameState.score >= cost) {
        gameState.score -= cost;
        upgrade.level++;

        // Aplicar efectos
        if (upgradeId === 'power') {
            gameState.tapValue += upgrade.level;
        }

        showNotification(`${upgrade.name} mejorada!`);
        updateUI();
        updateUpgrades();
        saveGameProgress();
    } else {
        showNotification('Oro insuficiente');
    }
}

// Renderizar mejoras
function updateUpgrades() {
    upgradesGrid.innerHTML = '';
    
    gameState.upgrades.forEach(upgrade => {
        const cost = getUpgradeCost(upgrade);
        const canAfford = gameState.score >= cost;
        
        const upgradeElement = document.createElement('div');
        upgradeElement.className = 'upgrade-item';
        upgradeElement.style.opacity = canAfford ? '1' : '0.6';
        upgradeElement.innerHTML = `
            <div class="upgrade-icon">${upgrade.icon}</div>
            <div class="upgrade-name">${upgrade.name}</div>
            <div class="upgrade-cost">💰 ${formatNumber(cost)}</div>
            <div class="upgrade-level">Nivel ${upgrade.level}</div>
        `;
        
        upgradeElement.addEventListener('click', () => buyUpgrade(upgrade.id));
        upgradesGrid.appendChild(upgradeElement);
    });
}

// Generar oro pasivo
function generatePassiveIncome() {
    const autoLevel = gameState.upgrades.find(u => u.id === 'auto').level;
    if (autoLevel > 0) {
        const income = autoLevel * 1;
        gameState.score += income;
        updateUI();
        saveGameProgress();
    }
}

// Guardar progreso del juego
function saveGameProgress() {
    // Guardar estado del juego
    localStorage.setItem('goldTapGameState', JSON.stringify(gameState));
    
    // Actualizar ranking
    updateRanking();
}

// Cargar progreso del juego
function loadGameProgress() {
    const savedState = localStorage.getItem('goldTapGameState');
    if (savedState) {
        const parsedState = JSON.parse(savedState);
        gameState = { ...gameState, ...parsedState };
    }
}

// Actualizar ranking
function updateRanking() {
    if (!gameState.playerName) return;
    
    // Obtener ranking actual
    let ranking = JSON.parse(localStorage.getItem(RANKING_KEY) || '[]');
    
    // Buscar si el jugador ya está en el ranking
    const existingPlayerIndex = ranking.findIndex(p => p.name === gameState.playerName);
    
    if (existingPlayerIndex !== -1) {
        // Actualizar puntuación del jugador existente
        ranking[existingPlayerIndex].taps = gameState.totalTaps;
    } else {
        // Agregar nuevo jugador
        ranking.push({
            name: gameState.playerName,
            taps: gameState.totalTaps
        });
    }
    
    // Ordenar por taps (descendente)
    ranking.sort((a, b) => b.taps - a.taps);
    
    // Limitar a MAX_RANKING_ENTRIES
    ranking = ranking.slice(0, MAX_RANKING_ENTRIES);
    
    // Guardar ranking
    localStorage.setItem(RANKING_KEY, JSON.stringify(ranking));
    
    // Actualizar UI del ranking
    displayRanking();
}

// Mostrar ranking en la UI
function displayRanking() {
    const ranking = JSON.parse(localStorage.getItem(RANKING_KEY) || '[]');
    
    rankingList.innerHTML = '';
    
    if (ranking.length === 0) {
        rankingList.innerHTML = '<div class="ranking-item"><div class="ranking-name">No hay jugadores en el ranking aún</div></div>';
        return;
    }
    
    ranking.forEach((player, index) => {
        const isCurrentPlayer = player.name === gameState.playerName;
        
        const rankingItem = document.createElement('div');
        rankingItem.className = `ranking-item ${isCurrentPlayer ? 'current-player' : ''}`;
        
        // Determinar medalla para los primeros 3 lugares
        let medal = '';
        if (index === 0) medal = '🥇';
        else if (index === 1) medal = '🥈';
        else if (index === 2) medal = '🥉';
        else medal = `${index + 1}.`;
        
        rankingItem.innerHTML = `
            <div class="ranking-position">${medal}</div>
            <div class="ranking-name">${player.name}</div>
            <div class="ranking-taps">${formatNumber(player.taps)} taps</div>
        `;
        
        rankingList.appendChild(rankingItem);
    });
}

// Pedir nombre del jugador
function askPlayerName() {
    // Si ya tenemos nombre, no pedir
    if (gameState.playerName) return;
    
    // Si estamos en Telegram, intentar obtener el nombre
    if (window.Telegram && window.Telegram.WebApp) {
        const tg = window.Telegram.WebApp;
        if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
            const user = tg.initDataUnsafe.user;
            gameState.playerName = user.first_name + (user.last_name ? ' ' + user.last_name : '');
            saveGameProgress();
            return;
        }
    }
    
    // Crear modal para pedir nombre
    const modal = document.createElement('div');
    modal.className = 'name-modal';
    modal.innerHTML = `
        <div class="name-modal-content">
            <h3>🏆 Bienvenido a Gold Tap</h3>
            <p style="color: #aaa; margin-bottom: 20px;">Ingresa tu nombre para aparecer en el ranking</p>
            <input type="text" class="name-input" id="nameInput" placeholder="Tu nombre" maxlength="20">
            <button class="submit-name-btn" id="submitNameBtn">Jugar</button>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    const nameInput = document.getElementById('nameInput');
    const submitBtn = document.getElementById('submitNameBtn');
    
    // Enfocar input automáticamente
    nameInput.focus();
    
    // Manejar envío
    const submitName = () => {
        const name = nameInput.value.trim();
        if (name) {
            gameState.playerName = name;
            modal.remove();
            saveGameProgress();
            showNotification(`¡Bienvenido, ${name}!`);
        } else {
            nameInput.style.borderColor = '#ff4444';
            setTimeout(() => {
                nameInput.style.borderColor = 'rgba(255, 215, 0, 0.3)';
            }, 1000);
        }
    };
    
    submitBtn.addEventListener('click', submitName);
    nameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            submitName();
        }
    });
}

// Evento para actualizar ranking
refreshRankingBtn.addEventListener('click', () => {
    updateRanking();
    showNotification('Ranking actualizado');
});

// Inicializar juego
function initGame() {
    createBackgroundParticles();
    loadGameProgress();
    updateUI();
    updateUpgrades();
    displayRanking();
    
    // Pedir nombre si no existe
    if (!gameState.playerName) {
        setTimeout(() => askPlayerName(), 500);
    }
    
    // Generar oro pasivo cada segundo
    setInterval(generatePassiveIncome, 1000);
    
    // Guardar progreso periódicamente
    setInterval(saveGameProgress, 5000);
}

// Iniciar el juego
initGame();

// Integración con Telegram Web App (opcional)
if (window.Telegram && window.Telegram.WebApp) {
    const tg = window.Telegram.WebApp;
    tg.expand();
    
    // Enviar datos cuando el juego se cierre
    tg.onEvent('mainButtonClicked', () => {
        tg.sendData(JSON.stringify({
            score: gameState.score,
            level: gameState.level,
            totalTaps: gameState.totalTaps,
            playerName: gameState.playerName
        }));
    });
}
