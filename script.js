document.addEventListener('DOMContentLoaded', function() {
    // Variables del juego
    let totalGold = 0;
    let perTap = 1;
    let level = 1;
    let totalTaps = 0;
    
    // Costos y niveles de mejoras
    const upgrades = {
        poder: { 
            name: "Poder Dorado", 
            cost: 10, 
            level: 0, 
            effect: 1,
            description: "Aumenta el oro por tap"
        },
        eficiencia: { 
            name: "Eficiencia", 
            cost: 25, 
            level: 0, 
            effect: 2,
            description: "Duplica tu eficiencia"
        },
        suerte: { 
            name: "Suerte", 
            cost: 50, 
            level: 0, 
            effect: 3,
            description: "Encuentra más oro"
        },
        minero: { 
            name: "Minero Automático", 
            cost: 100, 
            level: 0, 
            effect: 5,
            description: "Minero que trabaja para ti"
        }
    };
    
    // Elementos del DOM
    const scoreElement = document.getElementById('score');
    const tapValueElement = document.getElementById('tapValue');
    const levelElement = document.getElementById('level');
    const totalTapsElement = document.getElementById('totalTaps');
    const tapButton = document.getElementById('tapButton');
    const upgradesGrid = document.getElementById('upgradesGrid');
    const bgParticles = document.getElementById('bgParticles');
    
    // Crear partículas de fondo
    function createParticles() {
        const particleCount = 30;
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.classList.add('particle');
            
            // Tamaño aleatorio
            const size = Math.random() * 10 + 5;
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            
            // Posición aleatoria
            particle.style.left = `${Math.random() * 100}%`;
            particle.style.top = `${Math.random() * 100}%`;
            
            // Animación
            const duration = Math.random() * 20 + 10;
            particle.style.animation = `float ${duration}s infinite ease-in-out`;
            particle.style.animationDelay = `${Math.random() * 5}s`;
            
            bgParticles.appendChild(particle);
        }
    }
    
    // Generar mejoras dinámicamente
    function generateUpgrades() {
        upgradesGrid.innerHTML = '';
        
        for (const id in upgrades) {
            const upgrade = upgrades[id];
            
            const upgradeItem = document.createElement('div');
            upgradeItem.classList.add('upgrade-item');
            upgradeItem.setAttribute('data-id', id);
            
            upgradeItem.innerHTML = `
                <div class="upgrade-name">${upgrade.name}</div>
                <div class="upgrade-cost">Costo: <span class="cost">${upgrade.cost}</span> oro</div>
                <div class="upgrade-level">Nivel <span class="level">${upgrade.level}</span></div>
            `;
            
            upgradeItem.addEventListener('click', function() {
                buyUpgrade(id);
            });
            
            upgradesGrid.appendChild(upgradeItem);
        }
        
        updateUpgrades();
    }
    
    // Inicializar el juego
    function initGame() {
        updateDisplay();
        generateUpgrades();
        createParticles();
        
        // Intentar obtener datos de Telegram
        if (window.Telegram && window.Telegram.WebApp) {
            const tg = window.Telegram.WebApp;
            tg.expand();
            tg.enableClosingConfirmation();
            
            // Obtener información del usuario de Telegram
            if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
                const user = tg.initDataUnsafe.user;
                console.log(`Usuario: ${user.first_name}`);
            }
        }
        
        // Cargar datos guardados si existen
        loadGameData();
        
        // Iniciar minero automático si está disponible
        startAutoMiner();
    }
    
    // Actualizar la visualización del juego
    function updateDisplay() {
        scoreElement.textContent = totalGold;
        tapValueElement.textContent = perTap;
        levelElement.textContent = level;
        totalTapsElement.textContent = totalTaps;
    }
    
    // Actualizar estado de las mejoras
    function updateUpgrades() {
        const upgradeItems = document.querySelectorAll('.upgrade-item');
        
        upgradeItems.forEach(item => {
            const id = item.getAttribute('data-id');
            const costElement = item.querySelector('.cost');
            const levelElement = item.querySelector('.level');
            
            costElement.textContent = upgrades[id].cost;
            levelElement.textContent = upgrades[id].level;
            
            // Resaltar mejoras asequibles
            if (totalGold >= upgrades[id].cost) {
                item.classList.add('affordable');
            } else {
                item.classList.remove('affordable');
            }
        });
    }
    
    // Manejar clic en el botón de tap
    tapButton.addEventListener('click', function(e) {
        totalGold += perTap;
        totalTaps++;
        
        // Actualizar nivel cada 10 taps
        if (totalTaps % 10 === 0) {
            level++;
            showNotification(`¡Has alcanzado el nivel ${level}!`);
        }
        
        // Mostrar indicador de tap
        showTapIndicator(e, perTap);
        
        // Añadir animación de pulso
        tapButton.classList.add('pulse');
        setTimeout(() => {
            tapButton.classList.remove('pulse');
        }, 300);
        
        updateDisplay();
        updateUpgrades();
        saveGameData();
    });
    
    // Mostrar indicador de tap
    function showTapIndicator(e, amount) {
        const indicator = document.createElement('div');
        indicator.classList.add('tap-indicator');
        indicator.textContent = `+${amount}`;
        
        // Posicionar el indicador donde se hizo clic
        const rect = tapButton.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        indicator.style.left = `${x}px`;
        indicator.style.top = `${y}px`;
        
        tapButton.appendChild(indicator);
        
        // Mostrar y luego eliminar
        setTimeout(() => {
            indicator.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            indicator.remove();
        }, 1000);
    }
    
    // Comprar mejora
    function buyUpgrade(id) {
        const upgrade = upgrades[id];
        
        if (totalGold >= upgrade.cost) {
            totalGold -= upgrade.cost;
            upgrade.level++;
            upgrade.cost = Math.floor(upgrade.cost * 1.5); // Incrementar costo
            
            // Aplicar efecto de mejora
            if (id === 'poder') {
                perTap += upgrade.effect;
            } else if (id === 'eficiencia') {
                perTap = Math.floor(perTap * 1.5);
            } else if (id === 'suerte') {
                // La suerte se aplica en el siguiente tap
                perTap += upgrade.effect;
            }
            
            showNotification(`¡Has mejorado ${upgrade.name}!`);
            updateDisplay();
            updateUpgrades();
            saveGameData();
        } else {
            showNotification("No tienes suficiente oro");
        }
    }
    
    // Minero automático
    function startAutoMiner() {
        setInterval(() => {
            if (upgrades.minero.level > 0) {
                const autoGold = upgrades.minero.level * upgrades.minero.effect;
                totalGold += autoGold;
                updateDisplay();
                saveGameData();
            }
        }, 5000); // Cada 5 segundos
    }
    
    // Mostrar notificación
    function showNotification(message) {
        if (window.Telegram && window.Telegram.WebApp) {
            window.Telegram.WebApp.showAlert(message);
        } else {
            const notification = document.createElement('div');
            notification.className = 'notification';
            notification.textContent = message;
            notification.style.position = 'fixed';
            notification.style.bottom = '20px';
            notification.style.left = '50%';
            notification.style.transform = 'translateX(-50%)';
            notification.style.background = 'rgba(0, 0, 0, 0.7)';
            notification.style.color = 'white';
            notification.style.padding = '10px 20px';
            notification.style.borderRadius = '5px';
            notification.style.zIndex = '1000';
            
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.style.opacity = '0';
                notification.style.transition = 'opacity 0.5s';
                setTimeout(() => notification.remove(), 500);
            }, 2000);
        }
    }
    
    // Guardar datos del juego
    function saveGameData() {
        const gameData = {
            totalGold,
            perTap,
            level,
            totalTaps,
            upgrades
        };
        
        localStorage.setItem('goldTapGameData', JSON.stringify(gameData));
    }
    
    // Cargar datos del juego
    function loadGameData() {
        const savedData = localStorage.getItem('goldTapGameData');
        
        if (savedData) {
            const gameData = JSON.parse(savedData);
            
            totalGold = gameData.totalGold || totalGold;
            perTap = gameData.perTap || perTap;
            level = gameData.level || level;
            totalTaps = gameData.totalTaps || totalTaps;
            
            if (gameData.upgrades) {
                for (const id in gameData.upgrades) {
                    if (upgrades[id]) {
                        upgrades[id].level = gameData.upgrades[id].level || 0;
                        upgrades[id].cost = gameData.upgrades[id].cost || upgrades[id].cost;
                    }
                }
            }
            
            updateDisplay();
            updateUpgrades();
        }
    }
    
    // Añadir animación flotante a las partículas
    const style = document.createElement('style');
    style.textContent = `
        @keyframes float {
            0% { transform: translateY(0) translateX(0); opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { transform: translateY(-100vh) translateX(20px); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
    
    // Inicializar el juego
    initGame();
});
