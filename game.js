/**
 * Retro Cyber Avoid - game.js (V2 Monetization & Upgrades Update)
 * 8-bit Synth Audio, Parallax Starfield, Upgradable Stats, Ship Hangar Shop, Coin Magnet, Mock Rewarded Ads, Revive Loop
 */

// ----------------------------------------------------
// 1. SOUND SYNTHESIZER (Web Audio API with integrated BGM Loop)
// ----------------------------------------------------
class SoundEngine {
    constructor() {
        this.ctx = null;
        this.isMuted = false;
        
        // BGM variables
        this.bgmPlaying = false;
        this.bgmInterval = null;
        this.bgmVolumeNode = null;
        this.currentBeat = 0;
        this.nextNoteTime = 0;
    }

    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.bgmVolumeNode) {
            this.bgmVolumeNode.gain.setValueAtTime(this.isMuted ? 0 : 0.15, this.ctx.currentTime);
        }
        return this.isMuted;
    }

    // A. 8-bit BGM Synthesizer (Atmospheric cybernetic bassline loop)
    startBGM() {
        this.init();
        if (this.bgmPlaying) return;
        this.bgmPlaying = true;
        
        // Ensure context is running inside user gesture
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
        
        // Core BGM output gain node
        this.bgmVolumeNode = this.ctx.createGain();
        this.bgmVolumeNode.gain.setValueAtTime(this.isMuted ? 0 : 0.15, this.ctx.currentTime);
        this.bgmVolumeNode.connect(this.ctx.destination);
        
        this.currentBeat = 0;
        this.nextNoteTime = this.ctx.currentTime;
        
        // Note Scheduling Loop: runs every 25ms to schedule notes 100ms in advance
        this.bgmInterval = setInterval(() => {
            if (this.isMuted) {
                this.bgmVolumeNode.gain.value = 0;
            } else {
                this.bgmVolumeNode.gain.value = 0.15;
            }
            
            while (this.nextNoteTime < this.ctx.currentTime + 0.1) {
                this.scheduleNextNote(this.currentBeat, this.nextNoteTime);
                
                const secondsPerBeat = 60.0 / 120.0;
                this.nextNoteTime += 0.25 * secondsPerBeat; // 125ms
                this.currentBeat = (this.currentBeat + 1) % 32; // 32 beats loop
            }
        }, 25);
    }
    
    scheduleNextNote(beat, time) {
        // Space-synth bassline chord progression: Am (0-7), F (8-15), C (16-23), G (24-31)
        const chordIndex = Math.floor(beat / 8);
        const roots = [57, 53, 60, 55]; // MIDI roots: A2 (110Hz), F2 (87Hz), C3 (130Hz), G2 (98Hz)
        const root = roots[chordIndex];
        
        // 8-step bass arpeggiation patterns
        const step = beat % 8;
        let midiNote = root;
        
        if (step === 0) midiNote = root;             // Root
        else if (step === 1) midiNote = root + 12;    // Octave
        else if (step === 2) midiNote = root + 7;     // Fifth
        else if (step === 3) midiNote = root + 12;    // Octave
        else if (step === 4) midiNote = root + (chordIndex === 0 ? 3 : 4); // Minor/Major third
        else if (step === 5) midiNote = root + 12;    // Octave
        else if (step === 6) midiNote = root + 7;     // Fifth
        else if (step === 7) midiNote = root + 12;    // Octave
        
        const freq = Math.pow(2, (midiNote - 69) / 12) * 440;
        
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'triangle'; // Warm, comfortable 8-bit bass sound
        osc.frequency.setValueAtTime(freq, time);
        
        gain.gain.setValueAtTime(0.4, time);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.15); // sharp decay for bouncy staccato
        
        osc.connect(gain);
        gain.connect(this.bgmVolumeNode);
        
        osc.start(time);
        osc.stop(time + 0.15);
    }
    
    stopBGM() {
        if (this.bgmInterval) {
            clearInterval(this.bgmInterval);
            this.bgmInterval = null;
        }
        if (this.bgmVolumeNode) {
            try {
                this.bgmVolumeNode.disconnect();
            } catch(e) {}
            this.bgmVolumeNode = null;
        }
        this.bgmPlaying = false;
    }
    
    pauseBGM() {
        if (this.bgmVolumeNode) {
            this.bgmVolumeNode.gain.setValueAtTime(0, this.ctx.currentTime);
        }
    }
    
    resumeBGM() {
        if (this.bgmVolumeNode && !this.isMuted) {
            this.bgmVolumeNode.gain.setValueAtTime(0.15, this.ctx.currentTime);
        }
    }

    // B. Sound Effects
    playBeep() {
        if (this.isMuted) return;
        this.init();
        
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.1);
        
        gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.0001, this.ctx.currentTime + 0.1);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.start();
        osc.stop(this.ctx.currentTime + 0.1);
    }

    playExplosion() {
        if (this.isMuted) return;
        this.init();
        
        const duration = 1.2;
        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noiseNode = this.ctx.createBufferSource();
        noiseNode.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(400, this.ctx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(10, this.ctx.currentTime + duration);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.35, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

        noiseNode.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        const subOsc = this.ctx.createOscillator();
        const subGain = this.ctx.createGain();
        subOsc.type = 'sawtooth';
        subOsc.frequency.setValueAtTime(150, this.ctx.currentTime);
        subOsc.frequency.linearRampToValueAtTime(10, this.ctx.currentTime + 0.6);
        subGain.gain.setValueAtTime(0.25, this.ctx.currentTime);
        subGain.gain.linearRampToValueAtTime(0.0001, this.ctx.currentTime + 0.6);
        
        subOsc.connect(subGain);
        subGain.connect(this.ctx.destination);

        noiseNode.start();
        subOsc.start();
        noiseNode.stop(this.ctx.currentTime + duration);
        subOsc.stop(this.ctx.currentTime + 0.6);
    }

    playLevelWarp() {
        if (this.isMuted) return;
        this.init();

        const now = this.ctx.currentTime;
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(100, now);
        osc1.frequency.exponentialRampToValueAtTime(800, now + 1.2);

        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(200, now);
        osc2.frequency.exponentialRampToValueAtTime(1600, now + 1.2);

        const mod = this.ctx.createOscillator();
        const modGain = this.ctx.createGain();
        mod.frequency.value = 30;
        modGain.gain.value = 50;

        mod.connect(modGain);
        modGain.connect(osc1.frequency);
        modGain.connect(osc2.frequency);

        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.5);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.ctx.destination);

        mod.start();
        osc1.start();
        osc2.start();
        
        mod.stop(now + 1.5);
        osc1.stop(now + 1.5);
        osc2.stop(now + 1.5);
    }

    playShieldPickup() {
        if (this.isMuted) return;
        this.init();

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(1800, now + 0.4);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.exponentialRampToValueAtTime(0.12, now + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(now + 0.45);
    }

    playShieldAbsorb() {
        if (this.isMuted) return;
        this.init();

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.linearRampToValueAtTime(600, now + 0.08);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 2500;

        gain.gain.setValueAtTime(0.08, now);
        gain.gain.linearRampToValueAtTime(0.0001, now + 0.08);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(now + 0.08);
    }

    playGraze() {
        if (this.isMuted) return;
        this.init();

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1800, this.ctx.currentTime);
        osc.frequency.setValueAtTime(2400, this.ctx.currentTime + 0.02);
        
        gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.0001, this.ctx.currentTime + 0.05);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.start();
        osc.stop(this.ctx.currentTime + 0.05);
    }

    // High pitched retro chord arpeggio for collecting coins
    playCoinCollect() {
        if (this.isMuted) return;
        this.init();

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(950, now);
        osc.frequency.setValueAtTime(1350, now + 0.06);
        osc.frequency.setValueAtTime(1850, now + 0.12);

        gain.gain.setValueAtTime(0.08, now);
        gain.gain.linearRampToValueAtTime(0.0001, now + 0.18);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(now + 0.18);
    }
}

const SFX = new SoundEngine();

// ----------------------------------------------------
// 2. CONFIGURATION & STATE VARIABLES
// ----------------------------------------------------
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const CANVAS_WIDTH = 450;
const CANVAS_HEIGHT = 750;

// Game states
const STATE_START = 'START';
const STATE_PLAYING = 'PLAYING';
const STATE_LEVEL_UP = 'LEVEL_UP';
const STATE_GAMEOVER = 'GAMEOVER';
const STATE_PAUSED = 'PAUSED';
const STATE_REVIVE_PROMPT = 'REVIVE_PROMPT';
const STATE_AD_PLAYING = 'AD_PLAYING';

let gameState = STATE_START;

// Gameplay Variables
let level = 1;
let score = 0;
let highScore = parseInt(localStorage.getItem('cyber_avoid_highscore')) || 0;
let shield = 100;
let survivalTime = 0.0;
const LEVEL_DURATION = 30.0;

// 모바일 디바이스 감지 함수 (UserAgent 및 터치 지원 여부 체크)
function isMobileDevice() {
    return (
        /Mobi|Android|iPhone|iPad|iPod|Windows Phone/i.test(navigator.userAgent) ||
        (navigator.maxTouchPoints && navigator.maxTouchPoints > 0)
    );
}

let controlMode = isMobileDevice() ? 'tilt' : 'keyboard';
let keys = {};
let mousePos = { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT * 0.75 };
let tiltX = 0; // -1 to 1
let tiltY = 0; // -1 to 1

// Economy & Database V2
let totalCoins = parseInt(localStorage.getItem('cyber_avoid_coins')) || 0;
let sessionCoins = 0; // Coins collected in the current run
let unlockedShips = JSON.parse(localStorage.getItem('cyber_avoid_unlocked_ships')) || ['default'];
let activeShip = localStorage.getItem('cyber_avoid_active_ship') || 'default';
let upgrades = JSON.parse(localStorage.getItem('cyber_avoid_upgrades')) || { shieldCap: 0, magnetRange: 0, shieldDuration: 0 };

// DEVELOPER BONUS: Give 15,000 credits on first load ever to allow immediate shop testing!
if (localStorage.getItem('cyber_avoid_v2_initialized') !== 'true') {
    totalCoins = 15000;
    localStorage.setItem('cyber_avoid_coins', '15000');
    localStorage.setItem('cyber_avoid_v2_initialized', 'true');
}

// Revive System variables
let reviveUsed = false; // Player can only revive once per game run
let reviveTimer = 0; // Countdown frame timer (6 seconds = 360 ticks)
let adProgress = 0; // 0 to 1 for ad play simulation

// Entities
let player;
let bullets = [];
let particles = [];
let stars = [];
let warningLines = [];
let items = []; // Holds Shield and Coin drops
let floatingTexts = []; // Holds floating score/coin popups

// Timers / Spawners
let bulletSpawnTimer = 0;
let missileSpawnTimer = 0;
let specialSpawnTimer = 0;
let itemSpawnTimer = 0; // Spawns shield powerups
let coinSpawnTimer = 0; // Spawns gold coins

// Slow-motion transition coefficient
let timeScale = 1.0;

// UI DOM elements
const domLevel = document.getElementById('stat-level');
const domShieldBar = document.getElementById('stat-shield-bar');
const domTimeProgress = document.getElementById('stat-time-progress');
const domTime = document.getElementById('stat-time');
const domScore = document.getElementById('stat-score');
const domHighScore = document.getElementById('stat-highscore');
const domCoins = document.getElementById('stat-coins');
const domHighscoreBanners = document.querySelectorAll('.new-record');

const overlayStart = document.getElementById('overlay-start');
const overlayLevelup = document.getElementById('overlay-levelup');
const overlayGameover = document.getElementById('overlay-gameover');
const overlayPaused = document.getElementById('overlay-paused');
const overlayHangar = document.getElementById('overlay-hangar');
const overlayRevive = document.getElementById('overlay-revive');
const overlayAdPlayer = document.getElementById('overlay-ad-player');

const summaryLevel = document.getElementById('summary-level');
const summaryScore = document.getElementById('summary-score');

// 모바일 인게임 HUD 요소
const mobileGameHud = document.getElementById('mobile-game-hud');
const hudLevelVal  = document.getElementById('hud-level-val');
const hudShieldVal = document.getElementById('hud-shield-val');
const hudShieldFill = document.getElementById('hud-shield-fill'); // 🛡 실드 바 그래프
const hudTimeVal   = document.getElementById('hud-time-val');

// 모바일 HUD 표시/숨김 함수
function showMobileHud(visible) {
    if (!mobileGameHud) return;
    mobileGameHud.style.display = visible ? 'flex' : 'none';
}

// Rankings Database (LocalStorage Top 10)
let rankings = [];

function loadRankings() {
    const stored = localStorage.getItem('cyber_avoid_rankings');
    if (stored) {
        rankings = JSON.parse(stored);
    } else {
        // AI dummy data for starting pilot targets
        rankings = [
            { name: 'PILOT_01', score: 25000, level: 5 },
            { name: 'NEO_VOID', score: 18000, level: 4 },
            { name: 'GLIDE', score: 12000, level: 3 },
            { name: 'ARCADE', score: 7500, level: 2 },
            { name: 'ROOKIE', score: 3000, level: 1 }
        ];
        localStorage.setItem('cyber_avoid_rankings', JSON.stringify(rankings));
    }
    updateLeaderboardUI();
}

function updateLeaderboardUI() {
    const hudBody = document.getElementById('hud-leaderboard-body');
    if (!hudBody) return;
    hudBody.innerHTML = '';
    
    // Slice Top 5 for HUD display
    const topFive = rankings.slice(0, 5);
    topFive.forEach((r, idx) => {
        const tr = document.createElement('tr');
        tr.className = `rank-row-${idx + 1}`;
        tr.innerHTML = `
            <td style="width: 15%">${idx + 1}</td>
            <td style="width: 50%">${r.name}</td>
            <td style="width: 35%; text-align: right;">${String(r.score).padStart(6, '0')}</td>
        `;
        hudBody.appendChild(tr);
    });
}

// ----------------------------------------------------
// 3. CORE PLAYER SHIP CLASS
// ----------------------------------------------------
class Player {
    constructor() {
        // Dynamic ship stats based on selection and permanent upgrades
        const selectedShip = localStorage.getItem('cyber_avoid_active_ship') || 'default';
        const activeUpgrades = JSON.parse(localStorage.getItem('cyber_avoid_upgrades')) || { shieldCap: 0, magnetRange: 0, shieldDuration: 0 };
        
        let baseSpeed = 0.85;
        let baseMaxSpeed = 6.8;
        let baseShield = 100;
        let baseHitbox = 4.5;
        let shipScale = 1.0;
        let baseMagnet = 40;
        
        if (selectedShip === 'magnet') {
            baseSpeed = 0.8;
            baseMaxSpeed = 6.4;
            baseShield = 90;
            baseMagnet = 130; // Massive magnet vortex
        } else if (selectedShip === 'aegis') {
            baseSpeed = 0.72;
            baseMaxSpeed = 5.8;
            baseShield = 140; // Deflector shielding
            baseMagnet = 30;
            shipScale = 1.1;
            baseHitbox = 5.0;
        } else if (selectedShip === 'swift') {
            baseSpeed = 0.98;
            baseMaxSpeed = 7.8;
            baseShield = 85;
            baseMagnet = 40;
            shipScale = 0.85; // 15% smaller!
            baseHitbox = 3.8; // Smaller hitbox core
        } else if (selectedShip === 'goldie') {
            // 🐕 골디 보이저 스킨 속성 (빠른 기동성 + 초강력 코인 끌어당김 자석)
            baseSpeed = 0.88;
            baseMaxSpeed = 7.0;
            baseShield = 100;
            baseMagnet = 155; 
            shipScale = 0.92; 
            baseHitbox = 4.0;
        } else if (selectedShip === 'buddy') {
            // 🐕 사이버 버디 스킨 속성 (높은 실드 맷집 + 밸런스형 자석)
            baseSpeed = 0.82;
            baseMaxSpeed = 6.6;
            baseShield = 110;
            baseMagnet = 55;
            shipScale = 0.92;
            baseHitbox = 4.3;
        }
        
        // Permanent upgrades application
        this.maxShield = baseShield * (1 + activeUpgrades.shieldCap * 0.06);
        this.magnetRange = baseMagnet + activeUpgrades.magnetRange * 20;
        this.shieldBaseDurationTicks = 300 + activeUpgrades.shieldDuration * 30; // 5s base, +0.5s per level

        this.width = 34 * shipScale;
        this.height = 38 * shipScale;
        this.x = CANVAS_WIDTH / 2;
        this.y = CANVAS_HEIGHT * 0.75;
        this.vx = 0;
        this.vy = 0;
        this.speed = baseSpeed;
        this.friction = 0.85;
        this.maxSpeed = baseMaxSpeed;
        
        // Collision hitboxes
        this.hitboxRadius = baseHitbox;
        this.grazeRadius = 24.0 * shipScale;
        
        // Active barrier shield
        this.isShielded = false;
        this.shieldTimer = 0;
        this.shieldRadius = 32.0 * shipScale;
        
        this.color = 'rgb(0, 243, 255)';
        if (selectedShip === 'magnet') this.color = 'rgb(57, 255, 20)';
        else if (selectedShip === 'aegis') this.color = 'rgb(157, 0, 255)';
        else if (selectedShip === 'swift') this.color = 'rgb(255, 0, 127)';
        else if (selectedShip === 'goldie') this.color = 'rgb(255, 179, 0)';  // 골드빛
        else if (selectedShip === 'buddy') this.color = 'rgb(57, 255, 20)';   // 네온 그린빛

        this.damageFlash = 0;
    }

    update() {
        if (this.damageFlash > 0) this.damageFlash--;

        // Barrier shield tick
        if (this.isShielded) {
            this.shieldTimer--;
            if (this.shieldTimer <= 0) {
                this.isShielded = false;
                this.shieldTimer = 0;
            }
        }

        if (controlMode === 'keyboard') {
            let ax = 0;
            let ay = 0;
            if (keys['ArrowLeft'] || keys['KeyA']) ax = -this.speed;
            if (keys['ArrowRight'] || keys['KeyD']) ax = this.speed;
            if (keys['ArrowUp'] || keys['KeyW']) ay = -this.speed;
            if (keys['ArrowDown'] || keys['KeyS']) ay = this.speed;

            if (ax !== 0 && ay !== 0) {
                ax *= 0.7071;
                ay *= 0.7071;
            }

            this.vx += ax;
            this.vy += ay;
            
            this.vx *= this.friction;
            this.vy *= this.friction;

            this.vx = Math.min(Math.max(this.vx, -this.maxSpeed), this.maxSpeed);
            this.vy = Math.min(Math.max(this.vy, -this.maxSpeed), this.maxSpeed);

            this.x += this.vx;
            this.y += this.vy;
        } else if (controlMode === 'tilt') {
            // TILT CONTROL: 스마트폰 센서값 기반 무빙 (감도 보정 1.6배)
            let ax = tiltX * this.speed * 1.6;
            let ay = tiltY * this.speed * 1.6;
            
            this.vx += ax;
            this.vy += ay;
            
            this.vx *= this.friction;
            this.vy *= this.friction;

            this.vx = Math.min(Math.max(this.vx, -this.maxSpeed), this.maxSpeed);
            this.vy = Math.min(Math.max(this.vy, -this.maxSpeed), this.maxSpeed);

            this.x += this.vx;
            this.y += this.vy;
        } else {
            const dx = mousePos.x - this.x;
            const dy = mousePos.y - this.y;
            this.vx = dx * 0.15;
            this.vy = dy * 0.15;
            this.x += this.vx;
            this.y += this.vy;
        }

        const halfW = this.width / 2;
        const halfH = this.height / 2;
        this.x = Math.max(halfW, Math.min(this.x, CANVAS_WIDTH - halfW));
        this.y = Math.max(halfH, Math.min(this.y, CANVAS_HEIGHT - halfH));

        // 🐕 버디 전용 능력: 15초(900프레임)마다 실드 10 자동 재생
        const activeShipModel = localStorage.getItem('cyber_avoid_active_ship') || 'default';
        if (activeShipModel === 'buddy' && (gameState === STATE_PLAYING)) {
            if (!this.buddyRegenTimer) this.buddyRegenTimer = 0;
            this.buddyRegenTimer++;
            if (this.buddyRegenTimer >= 900) {
                this.buddyRegenTimer = 0;
                if (shield < this.maxShield) {
                    shield = Math.min(this.maxShield, shield + 10);
                    SFX.playShieldPickup();
                    spawnFloatingText(this.x, this.y - 15, '+10 SHIELD', '#39ff14');
                }
            }
        }

        // Exhaust particle trails
        if (Math.random() < 0.45 && (gameState === STATE_PLAYING || gameState === STATE_REVIVE_PROMPT)) {
            const exhaustColor = this.isShielded ? '#00f3ff' : this.color;
            
            // 버디 기체일 경우 양쪽 제트팩에서 파티클이 나가도록 처리
            if (activeShipModel === 'buddy') {
                spawnParticle(this.x - 14, this.y + 12, Math.random() * 1 - 0.5, 2 + Math.random() * 2, '#39ff14', 16);
                spawnParticle(this.x + 14, this.y + 12, Math.random() * 1 - 0.5, 2 + Math.random() * 2, '#39ff14', 16);
            } else {
                spawnParticle(
                    this.x - 1 + (Math.random() * 3 - 1.5), 
                    this.y + this.height / 2, 
                    Math.random() * 2 - 1, 
                    2 + Math.random() * 3, 
                    exhaustColor, 
                    22
                );
            }
            
            spawnParticle(
                this.x - 1 + (Math.random() * 3 - 1.5), 
                this.y + this.height / 2, 
                Math.random() * 1 - 0.5, 
                1 + Math.random() * 2, 
                '#fffb00', 
                14
            );
        }
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);

        const tilt = this.vx * 0.04;
        ctx.rotate(tilt);

        // A. Draw Invincibility Shield bubble
        if (this.isShielded) {
            ctx.save();
            ctx.shadowBlur = 15 + Math.sin(Date.now() * 0.015) * 5;
            ctx.shadowColor = '#00f3ff';
            ctx.strokeStyle = 'rgba(0, 243, 255, 0.8)';
            ctx.lineWidth = 3.0;
            ctx.fillStyle = 'rgba(0, 243, 255, 0.12)';
            
            ctx.beginPath();
            ctx.arc(0, 0, this.shieldRadius + Math.sin(Date.now() * 0.015) * 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.restore();
        }

        // B. Ship Body - Distinct paths based on equipped skin/model
        ctx.shadowBlur = 12;
        ctx.shadowColor = this.damageFlash > 0 ? '#ff007f' : (this.isShielded ? '#00f3ff' : this.color);

        ctx.strokeStyle = this.damageFlash > 0 ? '#ff0055' : (this.isShielded ? '#00f3ff' : this.color);
        ctx.lineWidth = 2.5;
        ctx.fillStyle = this.damageFlash > 0 ? 'rgba(255, 0, 85, 0.2)' : 'rgba(255, 255, 255, 0.08)';

        ctx.beginPath();
        const activeShipModel = localStorage.getItem('cyber_avoid_active_ship') || 'default';
        
        if (activeShipModel === 'magnet') {
            // MAGNET VORTEX: Double pronged collector nose
            ctx.moveTo(-this.width * 0.2, -this.height * 0.5);
            ctx.lineTo(-this.width * 0.15, -this.height * 0.2);
            ctx.lineTo(this.width * 0.15, -this.height * 0.2);
            ctx.lineTo(this.width * 0.2, -this.height * 0.5);
            ctx.lineTo(this.width * 0.5, this.height * 0.25);
            ctx.lineTo(this.width * 0.2, this.height * 0.45);
            ctx.lineTo(-this.width * 0.2, this.height * 0.45);
            ctx.lineTo(-this.width * 0.5, this.height * 0.25);
        } else if (activeShipModel === 'aegis') {
            // AEGIS COMMANDER: Wide curved deflector armor wings
            ctx.moveTo(0, -this.height * 0.5);
            ctx.quadraticCurveTo(this.width * 0.5, -this.height * 0.1, this.width * 0.5, this.height * 0.3);
            ctx.lineTo(this.width * 0.18, this.height * 0.38);
            ctx.lineTo(0, this.height * 0.48);
            ctx.lineTo(-this.width * 0.18, this.height * 0.38);
            ctx.lineTo(-this.width * 0.5, this.height * 0.3);
            ctx.quadraticCurveTo(-this.width * 0.5, -this.height * 0.1, 0, -this.height * 0.5);
        } else if (activeShipModel === 'swift') {
            // SWIFT RAVEN: Ultra sharp arrows, narrow evasive fins
            ctx.moveTo(0, -this.height * 0.5);
            ctx.lineTo(this.width * 0.32, this.height * 0.2);
            ctx.lineTo(this.width * 0.12, this.height * 0.1);
            ctx.lineTo(0, this.height * 0.4);
            ctx.lineTo(-this.width * 0.12, this.height * 0.1);
            ctx.lineTo(-this.width * 0.32, this.height * 0.2);
        } else if (activeShipModel === 'goldie') {
            // 🐕 GOLDIE VOYAGER: 주황색 우주복을 입은 귀여운 골든 리트리버
            // 1. 우주복 바디
            ctx.fillStyle = '#ff6b00'; // 주황색 우주복
            ctx.beginPath();
            ctx.ellipse(0, 8, this.width * 0.4, this.height * 0.4, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // 2. 우주선 부스터 노즐 (우주복 하단)
            ctx.fillStyle = '#555';
            ctx.fillRect(-this.width * 0.15, this.height * 0.45, this.width * 0.3, 6);
            
            // 3. 리트리버 얼굴
            ctx.fillStyle = '#ffb300'; // 골든 리트리버 털색
            ctx.beginPath();
            ctx.arc(0, -6, 12, 0, Math.PI * 2);
            ctx.fill();
            
            // 4. 귀 (처진 귀 모양)
            ctx.beginPath();
            ctx.ellipse(-10, -6, 4, 8, Math.PI / 8, 0, Math.PI * 2);
            ctx.ellipse(10, -6, 4, 8, -Math.PI / 8, 0, Math.PI * 2);
            ctx.fill();
            
            // 5. 눈과 코 (검은 도트)
            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.arc(-4, -6, 1.5, 0, Math.PI * 2); // 왼눈
            ctx.arc(4, -6, 1.5, 0, Math.PI * 2);  // 오른눈
            ctx.fill();
            // 코
            ctx.beginPath();
            ctx.moveTo(-2, -2);
            ctx.lineTo(2, -2);
            ctx.lineTo(0, 0);
            ctx.closePath();
            ctx.fill();

            // 6. 볼 터치 (귀여운 분홍색 볼)
            ctx.fillStyle = 'rgba(255, 100, 150, 0.6)';
            ctx.beginPath();
            ctx.arc(-7, -2, 2.5, 0, Math.PI * 2);
            ctx.arc(7, -2, 2.5, 0, Math.PI * 2);
            ctx.fill();

            // 7. 투명 우주 헬멧
            ctx.strokeStyle = 'rgba(0, 243, 255, 0.7)';
            ctx.lineWidth = 2.0;
            ctx.fillStyle = 'rgba(0, 243, 255, 0.08)';
            ctx.beginPath();
            ctx.arc(0, -5, 17, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // 8. 꼬리 프로펠러 비행 효과 (헬리콥터처럼 돌아가는 꼬리)
            ctx.save();
            ctx.translate(0, this.height * 0.45);
            const propellerAngle = (Date.now() * 0.04) % (Math.PI * 2);
            ctx.rotate(propellerAngle);
            ctx.strokeStyle = '#ffb300';
            ctx.lineWidth = 3.5;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(0, 12);
            ctx.stroke();
            
            // 프로펠러 날개 효과
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(-10, 12);
            ctx.lineTo(10, 12);
            ctx.stroke();
            ctx.restore();
        } else if (activeShipModel === 'buddy') {
            // 🐕 CYBER BUDDY: 제트팩을 장착하고 한쪽 눈에 사이버 고글을 쓴 크림 리트리버
            // 1. 제트팩 부스터 (좌우 날개 영역)
            ctx.fillStyle = '#444';
            ctx.fillRect(-this.width * 0.55, -2, 6, 20); // 왼쪽 제트팩
            ctx.fillRect(this.width * 0.45, -2, 6, 20);  // 오른쪽 제트팩
            
            // 2. 바디 (크림 리트리버 몸)
            ctx.fillStyle = '#ffe082'; // 연한 크림색 리트리버 털색
            ctx.beginPath();
            ctx.ellipse(0, 8, this.width * 0.38, this.height * 0.38, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // 3. 얼굴
            ctx.beginPath();
            ctx.arc(0, -6, 12, 0, Math.PI * 2);
            ctx.fill();
            
            // 4. 귀
            ctx.beginPath();
            ctx.ellipse(-10, -6, 4, 8, Math.PI / 10, 0, Math.PI * 2);
            ctx.ellipse(10, -6, 4, 8, -Math.PI / 10, 0, Math.PI * 2);
            ctx.fill();
            
            // 5. 일반 눈(오른쪽)과 사이버 고글(왼쪽)
            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.arc(4, -6, 1.5, 0, Math.PI * 2); // 오른눈
            ctx.fill();
            
            // 사이버 그린 고글 (왼쪽 눈 위치)
            ctx.fillStyle = 'rgba(57, 255, 20, 0.85)';
            ctx.shadowColor = '#39ff14';
            ctx.shadowBlur = 4;
            ctx.fillRect(-7, -9, 6, 6); // 네온 그린 렌즈
            ctx.strokeStyle = '#39ff14';
            ctx.lineWidth = 1.0;
            ctx.strokeRect(-7, -9, 6, 6);
            
            // 고글 안경다리
            ctx.strokeStyle = '#444';
            ctx.beginPath();
            ctx.moveTo(-7, -6);
            ctx.lineTo(-12, -6);
            ctx.stroke();
            ctx.shadowBlur = 0; // 그림자 초기화

            // 코
            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.moveTo(-2, -2);
            ctx.lineTo(2, -2);
            ctx.lineTo(0, 0);
            ctx.closePath();
            ctx.fill();

            // 6. 볼터치 (귀여움 보강)
            ctx.fillStyle = 'rgba(255, 100, 150, 0.5)';
            ctx.beginPath();
            ctx.arc(6, -2, 2.0, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // DEFAULT NEO PILOT: Interceptor spaceship
            ctx.moveTo(0, -this.height / 2);
            ctx.lineTo(this.width / 2, this.height * 0.2);
            ctx.lineTo(this.width * 0.2, this.height * 0.35);
            ctx.lineTo(0, this.height * 0.5);
            ctx.lineTo(-this.width * 0.2, this.height * 0.35);
            ctx.lineTo(-this.width / 2, this.height * 0.2);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.fill();

        // Glowing canopy
        ctx.beginPath();
        ctx.moveTo(0, -this.height * 0.25);
        ctx.lineTo(this.width * 0.12, 0);
        ctx.lineTo(0, this.height * 0.15);
        ctx.lineTo(-this.width * 0.12, 0);
        ctx.closePath();
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 6;
        ctx.fill();

        // Hitbox center indicator
        ctx.beginPath();
        ctx.arc(0, 0, this.hitboxRadius, 0, Math.PI * 2);
        ctx.fillStyle = '#fffb00';
        ctx.shadowColor = '#fffb00';
        ctx.shadowBlur = 8;
        ctx.fill();

        ctx.restore();
    }
}

// ----------------------------------------------------
// 4. POWERUPS & REWARDS ENTITY CLASSES
// ----------------------------------------------------

// A. 무적 방패 아이템
class ShieldItem {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vy = 1.6;
        this.radius = 13.0;
        this.pulse = 0;
        this.color = '#00f3ff';
    }

    update() {
        this.y += this.vy * timeScale;
        this.pulse += 0.18;
        return this.y < CANVAS_HEIGHT + 30;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.shadowBlur = 12 + Math.sin(this.pulse) * 4;
        ctx.shadowColor = this.color;

        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2.8;
        ctx.fillStyle = 'rgba(0, 243, 255, 0.2)';

        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI) / 3;
            const rx = Math.cos(angle) * this.radius;
            const ry = Math.sin(angle) * this.radius;
            if (i === 0) ctx.moveTo(rx, ry);
            else ctx.lineTo(rx, ry);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

// B. 황금 코인 아이템 (자석 흡입 메커니즘 탑재)
class CoinItem {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vy = 1.8;
        this.radius = 9.5;
        this.pulse = Math.random() * 10;
        this.color = '#fffb00';
        this.collected = false;
    }

    update() {
        this.pulse += 0.18;
        
        // Magnet attraction vector calculation
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < player.magnetRange) {
            // Pull dynamically toward player, faster when closer
            const strength = (player.magnetRange - dist) / player.magnetRange;
            const speed = 8.5 * strength + 1.5;
            this.x += (dx / dist) * speed * timeScale;
            this.y += (dy / dist) * speed * timeScale;
        } else {
            // Standard drift
            this.y += this.vy * timeScale;
        }

        // Collection detection
        if (dist < (player.width / 2) + this.radius) {
            this.collected = true;
            sessionCoins++;
            score += 100;
            SFX.playCoinCollect();

            spawnFloatingText(this.x, this.y, '+1 ₵');

            // Sparkles on collection
            for (let s = 0; s < 8; s++) {
                const sa = Math.random() * Math.PI * 2;
                const spd = 1.5 + Math.random() * 2.5;
                spawnParticle(this.x, this.y, Math.cos(sa) * spd, Math.sin(sa) * spd, '#fffb00', 16);
            }
            return false;
        }

        return this.y < CANVAS_HEIGHT + 30;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.shadowBlur = 12 + Math.sin(this.pulse) * 4;
        ctx.shadowColor = this.color;

        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2.2;
        ctx.fillStyle = 'rgba(255, 251, 0, 0.2)';

        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Coin inner symbol
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 10px Orbitron';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('₵', 0, 0.5);

        ctx.restore();
    }
}

// ----------------------------------------------------
// 5. BULLETS & PROJECTILES
// ----------------------------------------------------
class Bullet {
    constructor(x, y, vx, vy, type = 'standard') {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.type = type;
        this.radius = 6;
        this.color = '#ff0055';
        this.shadowColor = '#ff0055';
        this.angle = 0;
        
        if (this.type === 'standard') {
            this.radius = 6.5;
            this.color = 'rgb(255, 0, 127)';
            this.shadowColor = 'rgba(255, 0, 127, 0.8)';
        } else if (this.type === 'sine') {
            this.radius = 7.5;
            this.color = 'rgb(57, 255, 20)';
            this.shadowColor = 'rgba(57, 255, 20, 0.8)';
            this.amplitude = 4.2;
            this.frequency = 0.08;
            this.baseX = x;
        } else if (this.type === 'missile') {
            this.radius = 9.0;
            this.color = 'rgb(255, 251, 0)';
            this.shadowColor = 'rgba(255, 251, 0, 0.8)';
            this.trailTimer = 0;
        } else if (this.type === 'frag') {
            this.radius = 10.0;
            this.color = 'rgb(157, 0, 255)';
            this.shadowColor = 'rgba(157, 0, 255, 0.8)';
            this.splitY = 250 + Math.random() * 200;
        } else if (this.type === 'mini') {
            this.radius = 3.5;
            this.color = 'rgb(0, 243, 255)';
            this.shadowColor = 'rgba(0, 243, 255, 0.8)';
        }
    }

    update() {
        if (this.type === 'sine') {
            this.y += this.vy * timeScale;
            this.angle += this.frequency * timeScale;
            this.x = this.baseX + Math.sin(this.angle) * this.amplitude * 12;
        } else if (this.type === 'missile') {
            this.vy += 0.28 * timeScale;
            this.y += this.vy * timeScale;
            
            this.trailTimer++;
            if (this.trailTimer % 2 === 0) {
                spawnParticle(
                    this.x, 
                    this.y - 12, 
                    (Math.random() * 2 - 1) * 0.5, 
                    -this.vy * 0.3, 
                    '#fffb00', 
                    12
                );
            }
        } else if (this.type === 'frag') {
            this.y += this.vy * timeScale;
            this.x += this.vx * timeScale;
            
            if (this.y >= this.splitY) {
                for (let a = 0; a < Math.PI * 2; a += (Math.PI * 2) / 6) {
                    const svx = Math.cos(a) * 3.5;
                    const svy = Math.sin(a) * 3.5 + 2;
                    bullets.push(new Bullet(this.x, this.y, svx, svy, 'mini'));
                }
                
                SFX.playGraze();
                
                for (let p = 0; p < 12; p++) {
                    const pa = Math.random() * Math.PI * 2;
                    const pSpd = 1.5 + Math.random() * 3;
                    spawnParticle(
                        this.x, this.y, 
                        Math.cos(pa) * pSpd, Math.sin(pa) * pSpd, 
                        '#9d00ff', 
                        18
                    );
                }
                return false;
            }
        } else {
            this.x += this.vx * timeScale;
            this.y += this.vy * timeScale;
        }

        return this.y < CANVAS_HEIGHT + 20 && this.y > -20 && this.x > -20 && this.x < CANVAS_WIDTH + 20;
    }

    draw() {
        ctx.save();
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.shadowColor;
        ctx.fillStyle = this.color;
        
        if (this.type === 'missile') {
            ctx.translate(this.x, this.y);
            ctx.beginPath();
            ctx.moveTo(0, this.radius);
            ctx.lineTo(this.radius * 0.6, -this.radius);
            ctx.lineTo(-this.radius * 0.6, -this.radius);
            ctx.closePath();
            ctx.fill();
            
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(0, -2, this.radius * 0.3, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(this.x - this.radius * 0.2, this.y - this.radius * 0.2, this.radius * 0.35, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }
}

// ----------------------------------------------------
// 6. MISSILE WARNING SYSTEM
// ----------------------------------------------------
class WarningLine {
    constructor(x) {
        this.x = x;
        this.opacity = 0;
        this.timer = 0;
        this.duration = 60;
    }

    update() {
        this.timer++;
        this.opacity = Math.abs(Math.sin(this.timer * 0.25)) * 0.7 + 0.15;
        return this.timer < this.duration;
    }

    draw() {
        ctx.save();
        ctx.strokeStyle = `rgba(255, 0, 127, ${this.opacity})`;
        ctx.lineWidth = 2.5;
        ctx.setLineDash([8, 8]);
        ctx.shadowColor = 'rgb(255, 0, 127)';
        ctx.shadowBlur = 6;
        
        ctx.beginPath();
        ctx.moveTo(this.x, 0);
        ctx.lineTo(this.x, CANVAS_HEIGHT);
        ctx.stroke();
        
        if (this.timer % 15 < 8) {
            ctx.fillStyle = '#ff007f';
            ctx.font = '700 10px Orbitron';
            ctx.textAlign = 'center';
            ctx.fillText('⚠️ MISSILE LOCK', this.x, 25);
        }
        ctx.restore();
    }
}

// ----------------------------------------------------
// 7. BACKGROUND & PARTICLE MANAGEMENT
// ----------------------------------------------------
function initStars() {
    stars = [];
    const layers = [
        { count: 40, sizeRange: [0.6, 1.2], speedRange: [0.4, 0.8], alpha: 0.35 },
        { count: 30, sizeRange: [1.2, 1.8], speedRange: [1.0, 1.6], alpha: 0.65 },
        { count: 12, sizeRange: [2.0, 2.8], speedRange: [2.0, 3.5], alpha: 0.9 }
    ];

    layers.forEach(layer => {
        for (let i = 0; i < layer.count; i++) {
            stars.push({
                x: Math.random() * CANVAS_WIDTH,
                y: Math.random() * CANVAS_HEIGHT,
                size: layer.sizeRange[0] + Math.random() * (layer.sizeRange[1] - layer.sizeRange[0]),
                speed: layer.speedRange[0] + Math.random() * (layer.speedRange[1] - layer.speedRange[0]),
                alpha: layer.alpha
            });
        }
    });
}

function updateStars() {
    const speedMultiplier = (gameState === STATE_LEVEL_UP || gameState === STATE_AD_PLAYING) ? 9.5 : 1.0;
    stars.forEach(star => {
        star.y += star.speed * speedMultiplier * timeScale;
        if (star.y > CANVAS_HEIGHT) {
            star.y = 0;
            star.x = Math.random() * CANVAS_WIDTH;
        }
    });
}

function drawStars() {
    ctx.save();
    stars.forEach(star => {
        ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`;
        ctx.shadowBlur = star.size > 2.0 ? 5 : 0;
        ctx.shadowColor = '#ffffff';
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.restore();
}

function spawnParticle(x, y, vx, vy, color, maxLife) {
    particles.push({
        x: x,
        y: y,
        vx: vx,
        vy: vy,
        color: color,
        life: maxLife,
        maxLife: maxLife
    });
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx * timeScale;
        p.y += p.vy * timeScale;
        p.life--;
        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }
}

function drawParticles() {
    ctx.save();
    particles.forEach(p => {
        const alpha = p.life / p.maxLife;
        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha;
        
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2 + (1.5 * alpha), 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.restore();
}

function spawnFloatingText(x, y, text) {
    floatingTexts.push({
        x: x,
        y: y,
        text: text,
        vy: -0.85,
        opacity: 1.0,
        life: 50,
        maxLife: 50
    });
}

function updateAndDrawFloatingTexts() {
    ctx.save();
    ctx.font = '900 10px Orbitron';
    ctx.textAlign = 'center';
    ctx.shadowBlur = 5;
    ctx.shadowColor = '#fffb00';
    
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        const ft = floatingTexts[i];
        ft.y += ft.vy * timeScale;
        ft.life--;
        ft.opacity = ft.life / ft.maxLife;
        
        ctx.fillStyle = `rgba(255, 251, 0, ${ft.opacity})`;
        ctx.fillText(ft.text, ft.x, ft.y);
        
        if (ft.life <= 0) {
            floatingTexts.splice(i, 1);
        }
    }
    ctx.restore();
}

function triggerShipExplosion() {
    for (let i = 0; i < 55; i++) {
        const angle = Math.random() * Math.PI * 2;
        const velocity = 2.0 + Math.random() * 8.5;
        const vx = Math.cos(angle) * velocity;
        const vy = Math.sin(angle) * velocity;
        const color = (i % 3 === 0) ? player.color : (i % 3 === 1 ? '#00f3ff' : '#fffb00');
        spawnParticle(player.x, player.y, vx, vy, color, 65 + Math.floor(Math.random() * 30));
    }
}

// ----------------------------------------------------
// 8. COLLISION DETECTION & SPAWNERS
// ----------------------------------------------------
function checkCollisions() {
    if (gameState !== STATE_PLAYING) return;

    // A. Player vs items (Shield and Coins)
    for (let i = items.length - 1; i >= 0; i--) {
        const itm = items[i];
        if (itm instanceof ShieldItem) {
            const dx = itm.x - player.x;
            const dy = itm.y - player.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < (player.width / 2) + itm.radius) {
                // Collect shield item
                player.isShielded = true;
                player.shieldTimer = player.shieldBaseDurationTicks; // applied upgrade time
                
                for (let s = 0; s < 18; s++) {
                    const sa = Math.random() * Math.PI * 2;
                    const spd = 2 + Math.random() * 5;
                    spawnParticle(itm.x, itm.y, Math.cos(sa) * spd, Math.sin(sa) * spd, '#00f3ff', 30);
                }
                
                items.splice(i, 1);
                SFX.playShieldPickup();
                score += 500;
            }
        }
    }

    // B. Player / Shield vs Bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        const dx = b.x - player.x;
        const dy = b.y - player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Active Shield Absorption
        if (player.isShielded) {
            if (distance < player.shieldRadius + b.radius) {
                let absorbScore = 50;
                let sparkColor = '#00f3ff';
                let sparkCount = 6;
                
                if (b.type === 'missile') {
                    absorbScore = 500;
                    sparkColor = '#fffb00'; // Golden explosion sparks
                    sparkCount = 16;
                    SFX.playExplosion();
                    
                    // Spawn floating text bonus
                    spawnFloatingText(b.x, b.y - 10, '+500 PTS');
                } else {
                    SFX.playShieldAbsorb();
                }

                for (let s = 0; s < sparkCount; s++) {
                    const sa = Math.random() * Math.PI * 2;
                    const spd = 1.8 + Math.random() * 4.0;
                    spawnParticle(b.x, b.y, Math.cos(sa) * spd, Math.sin(sa) * spd, sparkColor, 20);
                }
                
                bullets.splice(i, 1);
                score += absorbScore;
                continue;
            }
        }

        // Damage Collision
        if (distance < player.hitboxRadius + b.radius) {
            shield -= 18;
            player.damageFlash = 8;
            
            // 모바일 햅틱 진동 피드백 (짧게 두 번 징-징!)
            if (navigator.vibrate) {
                navigator.vibrate([80, 50, 80]);
            }
            
            for (let s = 0; s < 12; s++) {
                const sa = Math.random() * Math.PI * 2;
                const spd = 2 + Math.random() * 4;
                spawnParticle(b.x, b.y, Math.cos(sa) * spd, Math.sin(sa) * spd, '#ff0055', 25);
            }
            
            bullets.splice(i, 1);
            SFX.playExplosion();
            
            if (shield <= 0) {
                shield = 0;
                handlePlayerDeath(); // Triggers V2 Revive Prompt or GameOver
            }
            continue;
        }

        // Grazing check
        if (!player.isShielded && distance < player.grazeRadius + b.radius) {
            score += 1;
            if (Math.random() < 0.25) {
                SFX.playGraze();
                spawnParticle(player.x + dx * 0.5, player.y + dy * 0.5, dx * 0.1, dy * 0.1, '#fffb00', 10);
            }
        }
    }
}

function spawnBulletsLogic() {
    bulletSpawnTimer += timeScale;
    missileSpawnTimer += timeScale;
    specialSpawnTimer += timeScale;
    itemSpawnTimer += timeScale;
    coinSpawnTimer += timeScale;

    const rateScale = Math.max(0.35, 1 - (level - 1) * 0.08);
    const baseSpeed = 2.4 + (level - 1) * 0.5;

    // 1. Standard Red Bullets
    if (bulletSpawnTimer >= 18 * rateScale) {
        bulletSpawnTimer = 0;
        const x = 20 + Math.random() * (CANVAS_WIDTH - 40);
        const vy = baseSpeed + Math.random() * 1.5;
        bullets.push(new Bullet(x, -10, 0, vy, 'standard'));
    }

    // 2. Sine Wave Green Bullets
    if (level >= 2 && specialSpawnTimer >= 45 * rateScale) {
        specialSpawnTimer = 0;
        const x = 60 + Math.random() * (CANVAS_WIDTH - 120);
        const vy = (baseSpeed * 0.75) + Math.random() * 1.0;
        bullets.push(new Bullet(x, -10, 0, vy, 'sine'));
    }

    // 3. Guided Missiles (Warning indications)
    if (level >= 3 && missileSpawnTimer >= 85 * rateScale) {
        missileSpawnTimer = 0;
        const targetX = 30 + Math.random() * (CANVAS_WIDTH - 60);
        warningLines.push(new WarningLine(targetX));
        
        setTimeout(() => {
            if (gameState === STATE_PLAYING) {
                bullets.push(new Bullet(targetX, -25, 0, 1.8, 'missile'));
                SFX.playLevelWarp();
            }
        }, 1000);
    }

    // 4. Frag Split Purple Orbs
    if (level >= 4 && Math.random() < 0.007 * level) {
        const x = 30 + Math.random() * (CANVAS_WIDTH - 60);
        const angle = (240 + Math.random() * 60) * Math.PI / 180;
        const vx = Math.cos(angle) * 1.0;
        const vy = baseSpeed * 0.65;
        bullets.push(new Bullet(x, -10, vx, vy, 'frag'));
    }

    // 5. Shield Items Spawner (~14 seconds)
    const itemIntervalTicks = 850;
    if (itemSpawnTimer >= itemIntervalTicks) {
        itemSpawnTimer = 0;
        const spawnX = 30 + Math.random() * (CANVAS_WIDTH - 60);
        items.push(new ShieldItem(spawnX, -20));
    }

    // 6. Gold Coins Spawner (주기를 1.8초로 단축하여 파밍 재미 극대화)
    const coinIntervalTicks = 110;
    if (coinSpawnTimer >= coinIntervalTicks) {
        coinSpawnTimer = 0;
        const spawnX = 25 + Math.random() * (CANVAS_WIDTH - 50);
        items.push(new CoinItem(spawnX, -20));
        
        // 20% 확률로 옆에 보너스 코인 한 개 더 등장 (더블 코인 쾌감!)
        if (Math.random() < 0.20) {
            const offset = (Math.random() < 0.5) ? -35 : 35;
            const bonusX = Math.max(25, Math.min(spawnX + offset, CANVAS_WIDTH - 25));
            items.push(new CoinItem(bonusX, -40)); // 시간 차를 두고 살짝 위에서 생성
        }
    }
}

// ----------------------------------------------------
// 9. V2 REVIVE / ADVERTISING CONTROLLER
// ----------------------------------------------------
function handlePlayerDeath() {
    // 모바일 햅틱 진동 피드백 (함선 격침 폭발: 크고 묵직하게 징~~~)
    if (navigator.vibrate) {
        navigator.vibrate([200, 100, 400]);
    }

    if (reviveUsed) {
        // Already revived once, proceed to gameover directly
        triggerGameOver();
    } else {
        // Open revive gate
        gameState = STATE_REVIVE_PROMPT;
        SFX.stopBGM();
        SFX.playBeep();
        
        reviveTimer = 360; // 6 seconds countdown
        
        // Setup coin button status
        const btnCoin = document.getElementById('btn-revive-coin');
        if (totalCoins >= 200) {
            btnCoin.disabled = false;
            btnCoin.innerText = 'USE 200 COINS';
            btnCoin.style.opacity = '1';
        } else {
            btnCoin.disabled = true;
            btnCoin.innerText = 'NEED 200 COINS';
            btnCoin.style.opacity = '0.4';
        }

        overlayRevive.classList.add('active');
    }
}

function startAdPlayer() {
    overlayRevive.classList.remove('active');
    gameState = STATE_AD_PLAYING;
    adProgress = 0;
    overlayAdPlayer.classList.add('active');
}

function completeRevive() {
    overlayRevive.classList.remove('active');
    overlayAdPlayer.classList.remove('active');
    
    // 광고 스킵 버튼 초기화(숨김)
    const btnAdSkip = document.getElementById('btn-ad-skip');
    if (btnAdSkip) {
        btnAdSkip.classList.add('hidden');
    }
    
    // Restore player state
    shield = player.maxShield;
    bullets = [];
    warningLines = [];
    items = [];
    
    // Give temporary 2 seconds invincibility barrier
    player.isShielded = true;
    player.shieldTimer = 120; 
    
    reviveUsed = true;
    gameState = STATE_PLAYING;
    
    SFX.playLevelWarp();
    SFX.startBGM();
}

function skipRevive() {
    overlayRevive.classList.remove('active');
    triggerGameOver();
}

// ----------------------------------------------------
// 10. LEVEL CLEARED & GAME OVER
// ----------------------------------------------------
function triggerLevelClear() {
    gameState = STATE_LEVEL_UP;
    bullets = [];
    warningLines = [];
    items = [];
    
    overlayLevelup.classList.add('active');
    SFX.playLevelWarp();
    
    let counter = 0;
    const interval = setInterval(() => {
        timeScale = 0.15;
        counter++;
        if (counter >= 12) {
            clearInterval(interval);
            advanceLevel();
        }
    }, 150);
}

function advanceLevel() {
    level++;
    survivalTime = 0;
    timeScale = 1.0;
    
    shield = player.maxShield; // Repair shield fully on warp clear
    score += level * 1000;
    
    overlayLevelup.classList.remove('active');
    gameState = STATE_PLAYING;
}

function triggerGameOver() {
    gameState = STATE_GAMEOVER;
    showMobileHud(false); // 📱 게임오버 시 HUD 숨김
    
    triggerShipExplosion();
    SFX.playExplosion();
    SFX.stopBGM();

    ctx.fillStyle = 'rgba(255, 0, 127, 0.4)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Save earned session coins
    totalCoins += sessionCoins;
    localStorage.setItem('cyber_avoid_coins', totalCoins);
    if (typeof syncGameDataToCloud === 'function') {
        syncGameDataToCloud();
    }

    const btnRestart = document.getElementById('btn-restart');
    btnRestart.classList.add('hidden');

    const rankingInputBox = document.getElementById('ranking-input-box');
    rankingInputBox.style.display = 'flex';
    
    const nameInput = document.getElementById('player-name-input');
    nameInput.value = '';
    nameInput.disabled = false;

    let newRecord = score > highScore;

    setTimeout(() => {
        summaryLevel.innerText = level;
        summaryScore.innerText = String(score).padStart(6, '0');
        
        if (newRecord) {
            domHighscoreBanners.forEach(b => b.classList.remove('hidden'));
        } else {
            domHighscoreBanners.forEach(b => b.classList.add('hidden'));
        }

        overlayGameover.classList.add('active');
        nameInput.focus();
    }, 1200);
}

// ----------------------------------------------------
// 11. MAIN CORE ANIMATION FRAME LOOP (60 FPS)
// ----------------------------------------------------
function gameLoop() {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    updateStars();
    drawStars();

    if (gameState === STATE_PLAYING || gameState === STATE_LEVEL_UP) {
        if (gameState === STATE_PLAYING) {
            survivalTime += 1 / 60;
            score += Math.floor(level * 0.45 + 1);

            if (survivalTime >= LEVEL_DURATION) {
                survivalTime = LEVEL_DURATION;
                triggerLevelClear();
            }

            spawnBulletsLogic();
        }

        player.update();
        checkCollisions();

        // Update Warnings
        for (let i = warningLines.length - 1; i >= 0; i--) {
            if (!warningLines[i].update()) {
                warningLines.splice(i, 1);
            }
        }

        // Update items (Shield & Coins)
        for (let i = items.length - 1; i >= 0; i--) {
            if (!items[i].update()) {
                items.splice(i, 1);
            }
        }

        // Update Projectiles
        for (let i = bullets.length - 1; i >= 0; i--) {
            if (!bullets[i].update()) {
                bullets.splice(i, 1);
            }
        }

        updateParticles();

        // DRAW
        warningLines.forEach(wl => wl.draw());
        items.forEach(itm => itm.draw());
        player.draw();
        bullets.forEach(b => b.draw());
        drawParticles();
        
        // Floating texts (+1₵ popup effect)
        updateAndDrawFloatingTexts();
        
        // 캔버스 HUD 직접 그리기 (모바일 해상도 왜곡 대응 및 오버레이 가려짐 문제 영구 해결)
        drawInGameCanvasHUD();

    } else if (gameState === STATE_GAMEOVER) {
        updateParticles();
        drawParticles();
        player.x = -999; // Hide player
    } else if (gameState === STATE_REVIVE_PROMPT) {
        // Freeze bullets and stars but keep ship drifting exhaust active
        player.update();
        player.draw();
        bullets.forEach(b => b.draw());
        items.forEach(itm => itm.draw());
        updateParticles();
        drawParticles();

        reviveTimer--;
        const secondsRemaining = Math.max(0, Math.ceil(reviveTimer / 60));
        document.getElementById('revive-countdown').innerText = secondsRemaining;

        if (reviveTimer <= 0) {
            skipRevive();
        }
    } else if (gameState === STATE_AD_PLAYING) {
        // Animate ad simulator filling bar
        adProgress += 1 / 300; // 5 seconds duration
        if (adProgress > 1.0) adProgress = 1.0;

        document.getElementById('ad-progress-fill').style.width = `${adProgress * 100}%`;
        if (adProgress < 1.0) {
            const timeRemainingSecs = Math.max(0, Math.ceil(5 - adProgress * 5));
            document.getElementById('ad-timer-text').innerText = `ADVERTISEMENT ENDS IN ${timeRemainingSecs}s`;
        } else {
            document.getElementById('ad-timer-text').innerText = `ADVERTISEMENT ENDED`;
            
            // 5초 광고 시청 완료 시 수동 부활 스킵 버튼 노출
            const btnAdSkip = document.getElementById('btn-ad-skip');
            if (btnAdSkip) {
                btnAdSkip.classList.remove('hidden');
            }
        }
    }

    updateHUD();

    requestAnimationFrame(gameLoop);
}

function updateHUD() {
    domLevel.innerText = String(level).padStart(2, '0');
    
    // Dynamic Shield HP
    if (player && player.isShielded) {
        domShieldBar.style.width = '100%';
        domShieldBar.style.background = 'linear-gradient(90deg, #00f3ff, #9d00ff)';
        domShieldBar.style.boxShadow = '0 0 12px #00f3ff';
        domShieldBar.style.animation = 'blink 0.25s infinite alternate';
    } else {
        const percent = player ? (shield / player.maxShield) * 100 : 100;
        domShieldBar.style.width = `${percent}%`;
        domShieldBar.style.background = 'linear-gradient(90deg, var(--neon-cyan), var(--neon-purple))';
        domShieldBar.style.boxShadow = '0 0 8px var(--neon-cyan)';
        
        if (percent <= 30) {
            domShieldBar.style.animation = 'blink 0.5s infinite alternate';
        } else {
            domShieldBar.style.animation = 'none';
        }
    }

    const progressPercent = (survivalTime / LEVEL_DURATION) * 100;
    domTimeProgress.style.width = `${progressPercent}%`;
    domTime.innerText = `${survivalTime.toFixed(1)}s / ${LEVEL_DURATION.toFixed(1)}s`;
    
    domScore.innerText = String(score).padStart(6, '0');
    domHighScore.innerText = String(highScore).padStart(6, '0');
    domCoins.innerText = String(totalCoins + sessionCoins).padStart(6, '0');

    // 📱 모바일 HUD 실시간 업데이트
    if (hudLevelVal) hudLevelVal.innerText = level;

    // 🛡 실드 바 그래프 업데이트
    if (hudShieldVal || hudShieldFill) {
        const shieldPct = player ? Math.max(0, Math.min(100, (shield / player.maxShield) * 100)) : 100;
        if (hudShieldVal) hudShieldVal.innerText = Math.ceil(shieldPct) + '%';
        if (hudShieldFill) {
            hudShieldFill.style.width = shieldPct + '%';
            if (player && player.isShielded) {
                // 무적 실드 활성화: 시안+퍼플 강렬한 발광
                hudShieldFill.style.background = 'linear-gradient(90deg, #00f3ff, #9d00ff)';
                hudShieldFill.style.boxShadow  = '0 0 14px #00f3ff, 0 0 6px #9d00ff';
                hudShieldFill.style.animation  = 'blink 0.2s infinite alternate';
            } else if (shieldPct <= 30) {
                // 위험 구간: 빨간 경고 바 + 깜빡임
                hudShieldFill.style.background = 'linear-gradient(90deg, #ff003c, #ff6a00)';
                hudShieldFill.style.boxShadow  = '0 0 10px #ff003c';
                hudShieldFill.style.animation  = 'blink 0.45s infinite alternate';
            } else {
                // 정상: 시안→퍼플 그라데이션
                hudShieldFill.style.background = 'linear-gradient(90deg, var(--neon-cyan), var(--neon-purple))';
                hudShieldFill.style.boxShadow  = '0 0 8px var(--neon-cyan)';
                hudShieldFill.style.animation  = 'none';
            }
        }
    }

    if (hudTimeVal) hudTimeVal.innerText = survivalTime.toFixed(1) + 's';

}

// 🐕 2D Canvas 위에 직접 모바일 최적화 HUD(레벨/실드/시간)를 그리는 함수
function drawInGameCanvasHUD() {
    ctx.save();
    
    // 1. HUD 뒷배경 캡슐 바 (은은한 블랙 투명 캡슐)
    const hudW = 400;
    const hudH = 26;
    const hudX = (CANVAS_WIDTH - hudW) / 2;
    const hudY = 15;
    
    ctx.fillStyle = 'rgba(8, 9, 15, 0.75)';
    ctx.strokeStyle = 'rgba(0, 243, 255, 0.25)';
    ctx.lineWidth = 1.5;
    
    ctx.beginPath();
    if (ctx.roundRect) {
        ctx.roundRect(hudX, hudY, hudW, hudH, 13);
    } else {
        ctx.rect(hudX, hudY, hudW, hudH);
    }
    ctx.fill();
    ctx.stroke();
    
    // 2. 폰트 및 공통 그림자 설정
    ctx.font = '700 12px Orbitron, Noto Sans KR, sans-serif';
    ctx.textBaseline = 'middle';
    
    // [좌측] 레벨 표시
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#00f3ff';
    ctx.fillStyle = '#00f3ff';
    ctx.textAlign = 'left';
    ctx.fillText('LV ' + String(level).padStart(2, '0'), hudX + 15, hudY + hudH / 2);
    
    // [우측] 생존 시간 표시
    ctx.shadowColor = '#39ff14';
    ctx.fillStyle = '#39ff14';
    ctx.textAlign = 'right';
    ctx.fillText(survivalTime.toFixed(1) + 's', hudX + hudW - 15, hudY + hudH / 2);
    
    // [중앙] 실드 게이지 바
    const barW = 160;
    const barH = 6;
    const barX = hudX + (hudW - barW) / 2;
    const barY = hudY + (hudH - barH) / 2;
    
    // 실드 배경
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.fillRect(barX, barY, barW, barH);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.strokeRect(barX, barY, barW, barH);
    
    // 실드 채우기 비율
    const percent = player ? Math.max(0, Math.min(100, (shield / player.maxShield) * 100)) : 100;
    const fillW = (percent / 100) * barW;
    
    if (fillW > 0) {
        // 실드 그라데이션
        const grad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
        grad.addColorStop(0, '#00f3ff');
        grad.addColorStop(1, '#9d00ff');
        ctx.fillStyle = grad;
        
        // 위급(30% 이하)하거나 무적실드 충전 시 깜빡임(Blink) 피드백
        let blink = false;
        if (percent <= 30 && Math.floor(Date.now() / 250) % 2 === 0) {
            blink = true;
        }
        if (player && player.isShielded && Math.floor(Date.now() / 150) % 2 === 0) {
            blink = true;
        }
        
        if (!blink) {
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#00f3ff';
            ctx.fillRect(barX, barY, fillW, barH);
        }
    }
    
    ctx.restore();
}

// ----------------------------------------------------
// 12. HANGAR / SHOP DYNAMIC RENDER & CONTROLLERS
// ----------------------------------------------------
// 로비 화면 하단의 애드센스 영역에 장착 스킨에 따라 골디/버디 배너 이미지를 띄워주는 함수
function updateLobbySkinBanner() {
    const adBox = document.getElementById('lobby-ad-box');
    const bannerDefault = document.getElementById('lobby-skin-banner-default');
    const bannerGoldie = document.getElementById('lobby-skin-banner-goldie');
    const bannerBuddy = document.getElementById('lobby-skin-banner-buddy');
    if (!bannerGoldie || !bannerBuddy || !adBox) return;

    const activeShip = localStorage.getItem('cyber_avoid_active_ship') || 'default';
    
    // 초기화
    if (bannerDefault) bannerDefault.style.display = 'none';
    bannerGoldie.style.display = 'none';
    bannerBuddy.style.display = 'none';
    
    adBox.classList.remove('skin-frame-goldie', 'skin-frame-buddy');
    
    if (activeShip === 'goldie') {
        adBox.classList.add('skin-frame-goldie');
        bannerGoldie.style.display = 'block';
    } else if (activeShip === 'buddy') {
        adBox.classList.add('skin-frame-buddy');
        bannerBuddy.style.display = 'block';
    } else {
        if (bannerDefault) bannerDefault.style.display = 'block';
    }
}

function updateHangarUI() {
    // 1. Credits display
    document.getElementById('shop-coins').innerText = String(totalCoins).padStart(6, '0');
    
    // 2. Ships list cards
    const shipCards = document.querySelectorAll('.ship-card');
    shipCards.forEach(card => {
        const shipId = card.getAttribute('data-ship-id');
        const actionBtn = card.querySelector('.btn-ship-action');
        
        // Remove active class
        card.classList.remove('active');
        
        if (shipId === activeShip) {
            card.classList.add('active');
            actionBtn.innerText = 'EQUIPPED';
            actionBtn.disabled = true;
            actionBtn.className = 'btn-ship-action neon-btn-small active';
        } else if (unlockedShips.includes(shipId)) {
            actionBtn.innerText = 'EQUIP';
            actionBtn.disabled = false;
            actionBtn.className = 'btn-ship-action neon-btn-small btn-cyan';
        } else {
            // Locked: show purchase cost
            let cost = 3000;
            if (shipId === 'aegis') cost = 5000;
            if (shipId === 'swift') cost = 8000;
            if (shipId === 'goldie') cost = 10000;
            if (shipId === 'buddy') cost = 12000;
            
            actionBtn.innerText = `BUY: ${cost}₵`;
            actionBtn.disabled = false;
            actionBtn.className = 'btn-ship-action neon-btn-small';
        }
    });

    // 3. Upgrade rows statuses
    const upgradeTypes = ['shieldCap', 'magnetRange', 'shieldDuration'];
    upgradeTypes.forEach(type => {
        const lvl = upgrades[type];
        
        // draw grid blocks: e.g. 🟩🟩⬜⬜⬜
        let grid = '';
        for (let i = 1; i <= 5; i++) {
            grid += (i <= lvl) ? '🟩' : '⬜';
        }
        document.getElementById(`lvl-${type}`).innerText = grid;

        const btn = document.getElementById(`btn-up-${type}`);
        if (lvl >= 5) {
            btn.innerText = 'MAX';
            btn.disabled = true;
            btn.style.opacity = '0.5';
        } else {
            // Upgrade cost: Level 0 -> 1 costs e.g. 500, Level 1 -> 2 costs 1000, etc.
            let baseCost = 500;
            if (type === 'magnetRange') baseCost = 400;
            if (type === 'shieldDuration') baseCost = 600;
            
            const cost = baseCost * (lvl + 1);
            btn.innerText = `UP: ${cost}₵`;
            btn.disabled = false;
            btn.style.opacity = '1';
        }
    });
    
    // 장착 스킨에 따라 로비 배너 이미지 노출/숨김 업데이트
    updateLobbySkinBanner();

    // Firebase 클라우드 백업 동기화
    if (typeof syncGameDataToCloud === 'function') {
        syncGameDataToCloud();
    }
}

function handleShipAction(shipId) {
    if (activeShip === shipId) return;

    if (unlockedShips.includes(shipId)) {
        // Equip
        activeShip = shipId;
        localStorage.setItem('cyber_avoid_active_ship', activeShip);
        SFX.playBeep();
    } else {
        // Purchase
        let cost = 3000;
        if (shipId === 'aegis') cost = 5000;
        if (shipId === 'swift') cost = 8000;
        if (shipId === 'goldie') cost = 10000;
        if (shipId === 'buddy') cost = 12000;

        if (totalCoins >= cost) {
            totalCoins -= cost;
            localStorage.setItem('cyber_avoid_coins', totalCoins);
            
            unlockedShips.push(shipId);
            localStorage.setItem('cyber_avoid_unlocked_ships', JSON.stringify(unlockedShips));
            
            activeShip = shipId;
            localStorage.setItem('cyber_avoid_active_ship', activeShip);
            
            SFX.playLevelWarp(); // success sound
        } else {
            // Fail beep
            SFX.playGraze();
        }
    }
    updateHangarUI();
}

function handleUpgradeAction(type) {
    const currentLvl = upgrades[type];
    if (currentLvl >= 5) return;

    let baseCost = 500;
    if (type === 'magnetRange') baseCost = 400;
    if (type === 'shieldDuration') baseCost = 600;
    
    const cost = baseCost * (currentLvl + 1);

    if (totalCoins >= cost) {
        totalCoins -= cost;
        localStorage.setItem('cyber_avoid_coins', totalCoins);

        upgrades[type]++;
        localStorage.setItem('cyber_avoid_upgrades', JSON.stringify(upgrades));

        SFX.playLevelWarp(); // Success chime
    } else {
        SFX.playGraze(); // Deny buzzer
    }
    updateHangarUI();
}

// ----------------------------------------------------
// 13. INITIALIZATION & RESTART CONTROLLER
// ----------------------------------------------------
function initGame() {
    // Reload player specifications dynamically from hangar values
    player = new Player();
    
    level = 1;
    score = 0;
    shield = player.maxShield; // Set initial health to max shield capacity
    survivalTime = 0.0;
    timeScale = 1.0;
    
    bullets = [];
    particles = [];
    warningLines = [];
    items = [];
    floatingTexts = [];
    
    bulletSpawnTimer = 0;
    missileSpawnTimer = 0;
    specialSpawnTimer = 0;
    itemSpawnTimer = 300; 
    coinSpawnTimer = 100; // spawn first coin early
    
    sessionCoins = 0;
    reviveUsed = false;
    
    highScore = parseInt(localStorage.getItem('cyber_avoid_highscore')) || 0;
    totalCoins = parseInt(localStorage.getItem('cyber_avoid_coins')) || 0;

    overlayStart.classList.remove('active');
    overlayLevelup.classList.remove('active');
    overlayGameover.classList.remove('active');
    overlayPaused.classList.remove('active');
    overlayHangar.classList.remove('active');
    overlayRevive.classList.remove('active');
    overlayAdPlayer.classList.remove('active');

    showMobileHud(true); // 📱 모바일 HUD 표시

    gameState = STATE_PLAYING;
    
    SFX.stopBGM();
    SFX.startBGM();
}

// ----------------------------------------------------
// 14. DOM EVENTS & MOUSE/KEYBOARD LISTENERS
// ----------------------------------------------------

// Lobby Navigation Hangar Shop bindings
const btnOpenHangar = document.getElementById('btn-open-hangar');
const btnCloseHangar = document.getElementById('btn-close-hangar');

btnOpenHangar.addEventListener('click', () => {
    SFX.playBeep();
    overlayStart.classList.remove('active');
    overlayHangar.classList.add('active');
    updateHangarUI();
});

btnCloseHangar.addEventListener('click', () => {
    SFX.playBeep();
    overlayHangar.classList.remove('active');
    overlayStart.classList.add('active');
});

// Ship Cards click handlers
document.querySelectorAll('.ship-card').forEach(card => {
    card.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-ship-action')) return;
        const shipId = card.getAttribute('data-ship-id');
        handleShipAction(shipId);
    });
});

document.querySelectorAll('.btn-ship-action').forEach(btn => {
    btn.addEventListener('click', () => {
        const shipId = btn.getAttribute('data-ship-id');
        handleShipAction(shipId);
    });
});

// Upgrade Buttons click handlers
document.getElementById('btn-up-shieldCap').addEventListener('click', () => handleUpgradeAction('shieldCap'));
document.getElementById('btn-up-magnetRange').addEventListener('click', () => handleUpgradeAction('magnetRange'));
document.getElementById('btn-up-shieldDuration').addEventListener('click', () => handleUpgradeAction('shieldDuration'));

// PayPal 코인 충전 패키지 선택 처리
let selectedPackagePrice = '1.99';
let selectedPackageCredits = 12000;

const packageCards = document.querySelectorAll('.package-card');
packageCards.forEach(card => {
    card.addEventListener('click', () => {
        packageCards.forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        
        selectedPackagePrice = card.getAttribute('data-amount');
        selectedPackageCredits = parseInt(card.getAttribute('data-credits'));
        SFX.playBeep();
    });
});

// Portone 국내 간편 결제 요청 처리 (비동기)
async function requestPortonePayment(targetChannelKey, targetPayMethod = "EASY_PAY") {
    if (typeof PortOne === 'undefined') {
        console.error("PortOne SDK를 로드할 수 없습니다.");
        alert("국내 결제 모듈 로드 실패. 새로고침 후 다시 시도해 주세요.");
        return;
    }
    
    const addedCredits = selectedPackageCredits;
    const amountKRW = Math.round(parseFloat(selectedPackagePrice) * 1300); // 0.99달러 -> 약 1300원 환산
    
    try {
        const paymentId = `payment-${Date.now()}`;
        
        // 포트원 V2 결제창 호출
        const response = await PortOne.requestPayment({
            storeId: "store-8e0da90f-9f03-42e5-bf5f-d57cdf90425a", // 대표님의 가맹점 식별코드
            paymentId: paymentId,
            orderName: `Cyber Avoid Credits - ${selectedPackagePrice === '0.99' ? 'STARTER' : 'BOOSTER'}`,
            totalAmount: amountKRW,
            currency: "CURRENCY_KRW",
            channelKey: targetChannelKey,
            payMethod: targetPayMethod
        });
        
        // 결제 실패 처리
        if (response.code !== undefined) {
            console.error("포트원 결제 실패:", response.message);
            SFX.playGraze();
            alert(`결제 실패: ${response.message}`);
            return;
        }
        
        // 결제 성공 시 재화 지급 및 동기화
        totalCoins += addedCredits;
        localStorage.setItem('cyber_avoid_coins', totalCoins);
        
        // UI 및 HUD 즉시 동기화
        updateHangarUI();
        domCoins.innerText = String(totalCoins + sessionCoins).padStart(6, '0');
        
        // 사운드 및 플로팅 이펙트
        SFX.playLevelWarp();
        spawnFloatingText(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, `+${addedCredits}₵ PURCHASED!`);
        
        alert(`결제가 완료되었습니다! ${addedCredits.toLocaleString()}₵ 코인이 정상 지급되었습니다.`);
        
    } catch (err) {
        console.error("포트원 결제 중 오류 발생:", err);
        SFX.playGraze();
        alert("결제 처리 중 예상치 못한 에러가 발생했습니다.");
    }
}

// PayPal Smart Buttons SDK 초기화 및 예외 강화 버전
function initPayPal() {
    const container = document.getElementById('paypal-button-container');
    if (!container) return;

    // 예외 처리 1: 광고 차단 프로그램 등으로 PayPal SDK가 누락된 경우 대처
    if (typeof paypal === 'undefined') {
        console.error("PayPal SDK를 로드할 수 없습니다. 광고 차단 프로그램(AdBlock)이 활성화되어 있는지 확인해 주세요.");
        container.innerHTML = `
            <div style="color: var(--neon-pink); font-size: 0.55rem; text-align: center; padding: 10px; border: 1.5px solid var(--neon-pink); border-radius: 6px; background: rgba(255,0,127,0.08); text-shadow: 0 0 3px var(--neon-pink); line-height: 1.4;">
                ⚠️ 결제 모듈 로드 실패<br>광고 차단기를 해제하고 새로고침해 주세요.
            </div>
        `;
        return;
    }
    
    // 개발용 Sandbox 키 감지 및 알림 (Live 실서버 적용 시 검증용)
    const scripts = document.getElementsByTagName('script');
    let isSandbox = true;
    for (let i = 0; i < scripts.length; i++) {
        if (scripts[i].src && scripts[i].src.includes('paypal.com/sdk/js')) {
            if (!scripts[i].src.includes('client-id=sb')) {
                isSandbox = false;
            }
            break;
        }
    }
    if (isSandbox) {
        console.warn("⚠️ PayPal Sandbox 모드로 작동 중입니다. 실서버 배포 시에는 index.html의 client-id=sb를 Live 키로 변경해야 합니다.");
    }
    
    // 컨테이너 초기화 후 렌더링
    container.innerHTML = '';
    
    paypal.Buttons({
        style: {
            layout: 'horizontal',
            color: 'gold',
            shape: 'rect',
            label: 'paypal',
            tagline: false,
            height: 38
        },
        createOrder: function(data, actions) {
            return actions.order.create({
                purchase_units: [{
                    description: `Cyber Avoid Credit Refill Pack - ${selectedPackagePrice === '0.99' ? 'STARTER' : 'BOOSTER'}`,
                    amount: {
                        currency_code: 'USD',
                        value: selectedPackagePrice // 패키지 선택에 따라 동적으로 반영
                    }
                }]
            });
        },
        onApprove: function(data, actions) {
            return actions.order.capture().then(function(details) {
                // 예외 처리 2: 결제 완료 상태(COMPLETED) 안전 검증
                if (details.status === 'COMPLETED') {
                    const addedCredits = selectedPackageCredits;
                    totalCoins += addedCredits;
                    localStorage.setItem('cyber_avoid_coins', totalCoins);
                    
                    // UI 즉시 동기화
                    updateHangarUI();
                    domCoins.innerText = String(totalCoins + sessionCoins).padStart(6, '0');
                    
                    // 오디오 chimes 및 알림 이펙트
                    SFX.playLevelWarp();
                    spawnFloatingText(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, `+${addedCredits}₵ PURCHASED!`);
                    
                    alert(`결제가 완료되었습니다! ${addedCredits.toLocaleString()}₵ 코인이 정상 지급되었습니다.`);
                } else {
                    console.error('결제 승인 완료 실패. 상태값:', details.status);
                    SFX.playGraze();
                    alert('결제 승인 상태가 불안정합니다. 관리자에게 문의해 주세요.');
                }
            }).catch(function(err) {
                console.error('결제 캡처 처리 실패:', err);
                SFX.playGraze();
                alert('결제 승인 처리 중 에러가 발생했습니다.');
            });
        },
        // 예외 처리 3: 사용자가 결제 도중 결제창을 닫거나 취소한 경우
        onCancel: function(data) {
            console.log('사용자가 PayPal 결제를 취소함.');
            SFX.playGraze(); // 경고음
            spawnFloatingText(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 'PAYMENT CANCELLED');
        },
        // 예외 처리 4: 네트워크 연결 단절, API 인증 만료 등의 에러 발생 시
        onError: function(err) {
            console.error('PayPal 결제 심각한 에러 발생:', err);
            SFX.playGraze();
            alert('결제 진행 중 통신 에러가 발생했습니다. 잠시 후 다시 시도해 주세요.');
        }
    }).render('#paypal-button-container');
}

// Revive System Button bindings
document.getElementById('btn-revive-ad').addEventListener('click', () => {
    SFX.playBeep();
    startAdPlayer();
});

document.getElementById('btn-revive-coin').addEventListener('click', () => {
    if (totalCoins >= 200) {
        totalCoins -= 200;
        localStorage.setItem('cyber_avoid_coins', totalCoins);
        SFX.playBeep();
        completeRevive();
    } else {
        SFX.playGraze();
    }
});

document.getElementById('btn-revive-skip').addEventListener('click', () => {
    SFX.playBeep();
    skipRevive();
});

// Control System Toggles (Keyboard vs Mouse vs Tilt)
const btnCtrlKeyboard = document.getElementById('btn-ctrl-keyboard');
const btnCtrlMouse = document.getElementById('btn-ctrl-mouse');
const btnCtrlTilt = document.getElementById('btn-ctrl-tilt');
const helpKeyboard = document.getElementById('help-keyboard');
const helpMouse = document.getElementById('help-mouse');
const helpTilt = document.getElementById('help-tilt');

function updateControlModeUI() {
    if (btnCtrlKeyboard) btnCtrlKeyboard.classList.remove('active');
    if (btnCtrlMouse) btnCtrlMouse.classList.remove('active');
    if (btnCtrlTilt) btnCtrlTilt.classList.remove('active');
    
    if (helpKeyboard) helpKeyboard.classList.add('hidden');
    if (helpMouse) helpMouse.classList.add('hidden');
    if (helpTilt) helpTilt.classList.add('hidden');
    
    if (controlMode === 'keyboard') {
        if (btnCtrlKeyboard) btnCtrlKeyboard.classList.add('active');
        if (helpKeyboard) helpKeyboard.classList.remove('hidden');
    } else if (controlMode === 'mouse') {
        if (btnCtrlMouse) btnCtrlMouse.classList.add('active');
        if (helpMouse) helpMouse.classList.remove('hidden');
    } else if (controlMode === 'tilt') {
        if (btnCtrlTilt) btnCtrlTilt.classList.add('active');
        if (helpTilt) helpTilt.classList.remove('hidden');
    }
}

if (btnCtrlKeyboard) {
    btnCtrlKeyboard.addEventListener('click', () => {
        SFX.playBeep();
        controlMode = 'keyboard';
        updateControlModeUI();
    });
}

if (btnCtrlMouse) {
    btnCtrlMouse.addEventListener('click', () => {
        SFX.playBeep();
        controlMode = 'mouse';
        updateControlModeUI();
    });
}

if (btnCtrlTilt) {
    btnCtrlTilt.addEventListener('click', () => {
        SFX.playBeep();
        controlMode = 'tilt';
        updateControlModeUI();
        enableTiltControl();
    });
}

function enableTiltControl() {
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        DeviceOrientationEvent.requestPermission()
            .then(permissionState => {
                if (permissionState === 'granted') {
                    console.log('DeviceOrientation permission granted.');
                } else {
                    alert('자이로 센서 권한이 거부되었습니다. 원활한 플레이를 위해 센서 권한을 허용해주세요.');
                    controlMode = 'keyboard';
                    updateControlModeUI();
                }
            })
            .catch(err => {
                console.error('DeviceOrientation permission request error:', err);
            });
    }
}

// 카카오페이 결제 버튼 클릭 리스너 연결
document.getElementById('btn-kakaopay')?.addEventListener('click', () => {
    SFX.playBeep();
    requestPortonePayment("channel-key-eabcf03a-193b-4af1-888e-c3be6852716d"); // 카카오페이 채널 키
});

// 토스페이먼츠 결제 버튼 클릭 리스너 연결
document.getElementById('btn-tosspay')?.addEventListener('click', () => {
    SFX.playBeep();
    requestPortonePayment("channel-key-8c83efa9-2297-407f-9f09-576ca66e0639", "CARD"); // 토스페이먼츠 채널 키
});

// Sound toggling
const btnMute = document.getElementById('btn-mute');
btnMute.addEventListener('click', () => {
    const isMuted = SFX.toggleMute();
    btnMute.innerText = isMuted ? 'SOUND: OFF' : 'SOUND: ON';
    if (!isMuted) {
        SFX.playBeep();
    }
});

// Action buttons
document.getElementById('btn-start').addEventListener('click', () => {
    SFX.playLevelWarp();
    initGame();
});

document.getElementById('btn-restart').addEventListener('click', () => {
    SFX.playLevelWarp();
    initGame();
});

const btnResume = document.getElementById('btn-resume');
if (btnResume) {
    btnResume.addEventListener('click', () => {
        SFX.playBeep();
        gameState = STATE_PLAYING;
        overlayPaused.classList.remove('active');
        SFX.resumeBGM();
    });
}

// ESC / PAUSE 화면에서 게임을 완전히 종료하고 메인 화면으로 돌아가는 버튼
const btnQuit = document.getElementById('btn-quit');
if (btnQuit) {
    btnQuit.addEventListener('click', () => {
        SFX.playBeep();
        gameState = STATE_START;
        overlayPaused.classList.remove('active');
        overlayStart.classList.add('active');
        
        // 게임 진행 정보 및 BGM 정지
        SFX.stopBGM();
        
        // 엔티티 및 리소스 클리어
        bullets = [];
        particles = [];
        items = [];
        warningLines = [];
        floatingTexts = [];
        
        // Hangar UI 및 코인 데이터 동기화
        updateHangarUI();
    });
}

// 애드센스 광고 시청 완료 후 부활 완료 처리하는 리스너
const btnAdSkip = document.getElementById('btn-ad-skip');
if (btnAdSkip) {
    btnAdSkip.addEventListener('click', () => {
        SFX.playBeep();
        completeRevive();
    });
}

// 파일럿 점수 등록 처리
const btnSubmitScore = document.getElementById('btn-submit-score');
const nameInput = document.getElementById('player-name-input');

function submitScore() {
    let pilotName = nameInput.value.trim().toUpperCase();
    if (!pilotName) pilotName = 'PILOT';
    
    pilotName = pilotName.replace(/[^A-Z0-9_-]/g, '');
    if (pilotName.length === 0) pilotName = 'PILOT';
    
    // Add to rankings
    rankings.push({
        name: pilotName,
        score: score,
        level: level
    });
    
    rankings.sort((a, b) => b.score - a.score);
    rankings = rankings.slice(0, 10);
    
    localStorage.setItem('cyber_avoid_rankings', JSON.stringify(rankings));
    
    updateLeaderboardUI();
    
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('cyber_avoid_highscore', highScore);
        domHighScore.innerText = String(highScore).padStart(6, '0');
    }
    if (typeof syncGameDataToCloud === 'function') {
        syncGameDataToCloud();
    }
    
    SFX.playLevelWarp();
    
    // UI transition
    nameInput.disabled = true;
    document.getElementById('ranking-input-box').style.display = 'none';
    document.getElementById('btn-restart').classList.remove('hidden');
}

btnSubmitScore.addEventListener('click', () => {
    submitScore();
});

nameInput.addEventListener('keydown', (e) => {
    if (e.code === 'Enter') {
        submitScore();
    }
});

// 일시정지 토글 공통 제어 함수 (모바일 터치 및 ESC 동시 대응)
function togglePauseGame() {
    if (gameState === STATE_PLAYING) {
        gameState = STATE_PAUSED;
        overlayPaused.classList.add('active');
        SFX.playBeep();
        SFX.pauseBGM();
    } else if (gameState === STATE_PAUSED) {
        gameState = STATE_PLAYING;
        overlayPaused.classList.remove('active');
        SFX.playBeep();
        SFX.resumeBGM();
    }
}

// Key bindings
window.addEventListener('keydown', (e) => {
    keys[e.code] = true;

    if (e.code === 'Escape' || e.code === 'KeyP') {
        togglePauseGame();
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.code] = false;
});

// Interactive canvas mouse mappings
canvas.addEventListener('mousemove', (e) => {
    if (controlMode !== 'mouse') return;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    
    mousePos.x = (e.clientX - rect.left) * scaleX;
    mousePos.y = (e.clientY - rect.top) * scaleY;
});

// Absolute touch drags for responsiveness
canvas.addEventListener('touchmove', (e) => {
    if (controlMode !== 'mouse' || e.touches.length === 0) return;
    e.preventDefault();
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    
    mousePos.x = (e.touches[0].clientX - rect.left) * scaleX;
    mousePos.y = (e.touches[0].clientY - rect.top) * scaleY;
}, { passive: false });

// 스마트폰 기울기 센서 이벤트 리스너 (TILT CONTROL)
window.addEventListener('deviceorientation', (e) => {
    if (controlMode !== 'tilt') return;
    
    // e.gamma: 좌우 기울기 (-90 ~ 90). 스마트폰을 오른편으로 기울이면 +, 왼편은 -
    // e.beta: 앞뒤 기울기 (-180 ~ 180). 스마트폰을 세울수록 +, 눕힐수록 -
    // 스마트폰을 들고 바라보는 기본 각도 20도를 중립(neutral)으로 함. (대표님 요청)
    const targetBeta = 20;
    const diffBeta = e.beta - targetBeta;
    
    // 감도 임계값 보정 (-15도 ~ 15도 범위를 -1 ~ 1로 정규화)
    tiltX = Math.min(Math.max(e.gamma / 15, -1), 1);
    tiltY = Math.min(Math.max(diffBeta / 15, -1), 1);
});

// Init backgrounds & load pilot rankings & PayPal
loadRankings();
initStars();
initPayPal();
updateLobbySkinBanner(); // 초기 실행 시 장착 스킨 배너 반영

// 모바일 터치 일시정지 버튼 이벤트 바인딩
const btnPauseTrigger = document.getElementById('btn-pause-trigger');
if (btnPauseTrigger) {
    btnPauseTrigger.addEventListener('click', (e) => {
        e.stopPropagation(); // 캔버스 터치 전파 방지
        togglePauseGame();
    });
}

requestAnimationFrame(gameLoop);


// 모바일 뒤로가기 버튼 실수 방지 로직 (popstate 인터셉트)
history.pushState(null, null, location.href);
window.addEventListener('popstate', function (event) {
    if (confirm("정말 종료하시겠습니까?\n진행 중인 게임 데이터가 저장되지 않을 수 있습니다.")) {
        // 확인 시, 실제로 페이지를 벗어나도록 다시 뒤로가기
        history.go(-1);
    } else {
        // 취소 시, 현재 페이지 상태 유지 (다시 상태 푸시)
        history.pushState(null, null, location.href);
    }
});
