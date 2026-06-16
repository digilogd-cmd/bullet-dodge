/**
 * Retro Cyber Avoid - game.js
 * 8-bit Synthesizer Audio, Parallax Starfield, Smooth Canvas Physics, Bullet Patterns, Particle Engines, BGM, Shield Items
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
                
                // Sixteen note beat spacing (120 BPM -> 1 beat = 500ms, 16th note = 125ms)
                const secondsPerBeat = 60.0 / 120.0;
                this.nextNoteTime += 0.25 * secondsPerBeat; // 125ms
                this.currentBeat = (this.currentBeat + 1) % 32; // 32 beats loop (2 bars)
            }
        }, 25);
    }
    
    scheduleNextNote(beat, time) {
        // Space-synth bassline chord progression: Am (0-7), F (8-15), C (16-23), G (24-31)
        // roots MIDI numbers shifted one octave higher [57, 53, 60, 55] for clear speaker reproduction
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
        
        // Convert MIDI number to Frequency
        const freq = Math.pow(2, (midiNote - 69) / 12) * 440;
        
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'triangle'; // Warm, comfortable 8-bit bass sound
        osc.frequency.setValueAtTime(freq, time);
        
        gain.gain.setValueAtTime(0.4, time); // highly clear note gain
        gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.15); // sharp decay for bouncy staccato feel
        
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

    // Energizing sound sweep when picking up the shield power-up item
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

    // Energy sizzle when absorbing a bullet inside the shield bubbles
    playShieldAbsorb() {
        if (this.isMuted) return;
        this.init();

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.linearRampToValueAtTime(600, now + 0.08);

        // Bandpass filter to make it metallic and crackly
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

let gameState = STATE_START;

// Gameplay Variables
let level = 1;
let score = 0;
let highScore = parseInt(localStorage.getItem('cyber_avoid_highscore')) || 0;
let shield = 100;
let survivalTime = 0.0;
const LEVEL_DURATION = 30.0;

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

let controlMode = 'keyboard';
let keys = {};
let mousePos = { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT * 0.75 };

// Entities
let player;
let bullets = [];
let particles = [];
let stars = [];
let warningLines = [];
let items = []; // For holding Shield powerups

// Timers / Spawners
let bulletSpawnTimer = 0;
let missileSpawnTimer = 0;
let specialSpawnTimer = 0;
let itemSpawnTimer = 0; // Spawns shields

// Slow-motion transition coefficient
let timeScale = 1.0;

// UI DOM elements
const domLevel = document.getElementById('stat-level');
const domShieldBar = document.getElementById('stat-shield-bar');
const domTimeProgress = document.getElementById('stat-time-progress');
const domTime = document.getElementById('stat-time');
const domScore = document.getElementById('stat-score');
const domHighScore = document.getElementById('stat-highscore');
const domHighscoreBanners = document.querySelectorAll('.new-record');

const overlayStart = document.getElementById('overlay-start');
const overlayLevelup = document.getElementById('overlay-levelup');
const overlayGameover = document.getElementById('overlay-gameover');
const overlayPaused = document.getElementById('overlay-paused');

const summaryLevel = document.getElementById('summary-level');
const summaryScore = document.getElementById('summary-score');

// ----------------------------------------------------
// 3. CORE PLAYER SHIP CLASS
// ----------------------------------------------------
class Player {
    constructor() {
        this.width = 34;
        this.height = 38;
        this.x = CANVAS_WIDTH / 2;
        this.y = CANVAS_HEIGHT * 0.75;
        this.vx = 0;
        this.vy = 0;
        this.speed = 0.85;
        this.friction = 0.85;
        this.maxSpeed = 6.8;
        
        // Hitbox sizes
        this.hitboxRadius = 4.5;
        this.grazeRadius = 24.0;
        
        // Invulnerability Shield properties
        this.isShielded = false;
        this.shieldTimer = 0; // Shield countdown frames
        this.shieldRadius = 32.0; // Invincibility shield radius
        
        this.color = 'rgb(0, 243, 255)';
        this.damageFlash = 0;
    }

    update() {
        if (this.damageFlash > 0) this.damageFlash--;

        // Shield countdown timer
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

        // Generate engine exhaust particles
        if (Math.random() < 0.45 && gameState === STATE_PLAYING) {
            // Colors vary depending on shield status
            const exhaustColor = this.isShielded ? '#00f3ff' : '#ff007f';
            spawnParticle(
                this.x - 1 + (Math.random() * 3 - 1.5), 
                this.y + this.height / 2, 
                Math.random() * 2 - 1, 
                2 + Math.random() * 3, 
                exhaustColor, 
                22
            );
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

        // A. Draw Invulnerability Neon Shield Sphere
        if (this.isShielded) {
            ctx.save();
            ctx.shadowBlur = 15 + Math.sin(Date.now() * 0.015) * 5;
            ctx.shadowColor = '#00f3ff';
            
            // Pulsing translucent shield field bubble
            ctx.strokeStyle = 'rgba(0, 243, 255, 0.8)';
            ctx.lineWidth = 3.0;
            ctx.fillStyle = 'rgba(0, 243, 255, 0.12)';
            
            ctx.beginPath();
            ctx.arc(0, 0, this.shieldRadius + Math.sin(Date.now() * 0.015) * 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.restore();
        }

        // B. Ship Body
        ctx.shadowBlur = 12;
        ctx.shadowColor = this.damageFlash > 0 ? '#ff007f' : (this.isShielded ? '#00f3ff' : this.color);

        ctx.beginPath();
        ctx.moveTo(0, -this.height / 2);
        ctx.lineTo(this.width / 2, this.height * 0.2);
        ctx.lineTo(this.width * 0.2, this.height * 0.35);
        ctx.lineTo(0, this.height * 0.5);
        ctx.lineTo(-this.width * 0.2, this.height * 0.35);
        ctx.lineTo(-this.width / 2, this.height * 0.2);
        ctx.closePath();

        ctx.strokeStyle = this.damageFlash > 0 ? '#ff0055' : (this.isShielded ? '#00f3ff' : this.color);
        ctx.lineWidth = 2.5;
        ctx.stroke();

        ctx.fillStyle = this.damageFlash > 0 ? 'rgba(255, 0, 85, 0.2)' : 'rgba(0, 243, 255, 0.15)';
        ctx.fill();

        // Cockpit canopy
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

        // Hitbox central indicator
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
// 4. POWERUP SHIELD ITEM CLASS
// ----------------------------------------------------
class ShieldItem {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vy = 1.6; // drifts slowly down
        this.radius = 13.0;
        this.pulse = 0;
        this.color = '#00f3ff';
    }

    update() {
        this.y += this.vy * timeScale;
        this.pulse += 0.18;
        // Keep alive inside viewport
        return this.y < CANVAS_HEIGHT + 30;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.shadowBlur = 12 + Math.sin(this.pulse) * 4;
        ctx.shadowColor = this.color;

        // Draw elegant glowing hexagon shield pod
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

        // Draw visual emblem of "S" (Shield) inside hexagon
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

// ----------------------------------------------------
// 5. WEAPONRY & BULLET PATTERNS
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
// 6. MISSILE INCOMING WARNING SYSTEM
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
// 7. MULTI-LAYER STARFIELD (PARALLAX)
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
    const speedMultiplier = (gameState === STATE_LEVEL_UP) ? 9.5 : 1.0;
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

// ----------------------------------------------------
// 8. PARTICLE SYSTEM
// ----------------------------------------------------
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

function triggerShipExplosion() {
    for (let i = 0; i < 55; i++) {
        const angle = Math.random() * Math.PI * 2;
        const velocity = 2.0 + Math.random() * 8.5;
        const vx = Math.cos(angle) * velocity;
        const vy = Math.sin(angle) * velocity;
        const color = (i % 3 === 0) ? '#ff007f' : (i % 3 === 1 ? '#00f3ff' : '#9d00ff');
        spawnParticle(player.x, player.y, vx, vy, color, 65 + Math.floor(Math.random() * 30));
    }
}

// ----------------------------------------------------
// 9. COLLISION DETECTION & DYNAMIC GAME LOOPS
// ----------------------------------------------------
function checkCollisions() {
    if (gameState !== STATE_PLAYING) return;

    // A. Player vs Shield Items Collision
    for (let i = items.length - 1; i >= 0; i--) {
        const item = items[i];
        const dx = item.x - player.x;
        const dy = item.y - player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < (player.width / 2) + item.radius) {
            // Shield Pickup Activated!
            player.isShielded = true;
            player.shieldTimer = 300; // 5 seconds at 60 FPS
            
            // Spark splash
            for (let s = 0; s < 18; s++) {
                const sa = Math.random() * Math.PI * 2;
                const spd = 2 + Math.random() * 5;
                spawnParticle(item.x, item.y, Math.cos(sa) * spd, Math.sin(sa) * spd, '#00f3ff', 30);
            }
            
            items.splice(i, 1);
            SFX.playShieldPickup();
            score += 500; // bonus points
        }
    }

    // B. Player / Shield Barrier vs Enemy Bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        const dx = b.x - player.x;
        const dy = b.y - player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // CASE 1: Shield is ACTIVE (Destroys bullet/missile at shield boundary radius)
        if (player.isShielded) {
            if (distance < player.shieldRadius + b.radius) {
                let absorbScore = 50;
                let sparkColor = '#00f3ff';
                let sparkCount = 6;
                
                // 미사일 흡수 시 특수 보너스 (+500점) 및 연출 강화
                if (b.type === 'missile') {
                    absorbScore = 500;
                    sparkColor = '#fffb00'; // 황금빛 스파크
                    sparkCount = 16;       // 화려한 파편 폭발
                    SFX.playExplosion();   // 웅장한 폭발음
                } else {
                    SFX.playShieldAbsorb(); // 일반 흡수음
                }

                // 스파크 파티클 소환
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

        // CASE 2: Shield is NOT active (Normal damage detection)
        if (distance < player.hitboxRadius + b.radius) {
            // Hurt
            shield -= 18;
            player.damageFlash = 8;
            
            for (let s = 0; s < 12; s++) {
                const sa = Math.random() * Math.PI * 2;
                const spd = 2 + Math.random() * 4;
                spawnParticle(b.x, b.y, Math.cos(sa) * spd, Math.sin(sa) * spd, '#ff0055', 25);
            }
            
            bullets.splice(i, 1);
            SFX.playExplosion();
            
            if (shield <= 0) {
                shield = 0;
                triggerGameOver();
            }
            continue;
        }

        // Grazing adrenaline bonus score check
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

    // 3. Guided Missile Spawner (Warning Lines)
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

    // 5. Shield Item Spawner (Every 13-16 seconds)
    const itemIntervalTicks = 850; // ~14 seconds at 60 FPS
    if (itemSpawnTimer >= itemIntervalTicks) {
        itemSpawnTimer = 0;
        const spawnX = 30 + Math.random() * (CANVAS_WIDTH - 60);
        items.push(new ShieldItem(spawnX, -20));
    }
}

// ----------------------------------------------------
// 10. LEVEL CLEARED & STATE TRANSITIONS
// ----------------------------------------------------
function triggerLevelClear() {
    gameState = STATE_LEVEL_UP;
    bullets = [];
    warningLines = [];
    items = []; // Clear shield drops as well
    
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
    
    shield = Math.min(100, shield + 35);
    score += level * 1000;
    
    overlayLevelup.classList.remove('active');
    gameState = STATE_PLAYING;
}

// ----------------------------------------------------
// 11. GAMEOVER
// ----------------------------------------------------
function triggerGameOver() {
    gameState = STATE_GAMEOVER;
    
    triggerShipExplosion();
    SFX.playExplosion();
    SFX.stopBGM(); // Stop background music immediately on game over

    ctx.fillStyle = 'rgba(255, 0, 127, 0.4)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Hide Retry button until name is submitted
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
// 12. MAIN ANIMATION FRAME (60 FPS CORE LOOP)
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

        // Update active Warning Lines
        for (let i = warningLines.length - 1; i >= 0; i--) {
            if (!warningLines[i].update()) {
                warningLines.splice(i, 1);
            }
        }

        // Update drifting items (Shield Pods)
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

        // DRAW everything
        warningLines.forEach(wl => wl.draw());
        items.forEach(itm => itm.draw());
        player.draw();
        bullets.forEach(b => b.draw());
        drawParticles();

    } else if (gameState === STATE_GAMEOVER) {
        updateParticles();
        drawParticles();
        player.x = -999; // hide player
    }

    updateHUD();

    requestAnimationFrame(gameLoop);
}

// Sync HUD DOM objects
function updateHUD() {
    domLevel.innerText = String(level).padStart(2, '0');
    
    // A. Dynamic Shield HP bar visual update
    if (player && player.isShielded) {
        // Glowing cyan invulnerability progress
        const shieldSecs = (player.shieldTimer / 60).toFixed(1);
        domShieldBar.style.width = '100%';
        domShieldBar.style.background = 'linear-gradient(90deg, #00f3ff, #9d00ff)';
        domShieldBar.style.boxShadow = '0 0 12px #00f3ff';
        domShieldBar.style.animation = 'blink 0.25s infinite alternate';
    } else {
        domShieldBar.style.width = `${shield}%`;
        domShieldBar.style.background = 'linear-gradient(90deg, var(--neon-cyan), var(--neon-purple))';
        domShieldBar.style.boxShadow = '0 0 8px var(--neon-cyan)';
        
        if (shield <= 30) {
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
}

// ----------------------------------------------------
// 13. INITIALIZATION & RESTART CONTROLLER
// ----------------------------------------------------
function initGame() {
    level = 1;
    score = 0;
    shield = 100;
    survivalTime = 0.0;
    timeScale = 1.0;
    
    bullets = [];
    particles = [];
    warningLines = [];
    items = [];
    
    bulletSpawnTimer = 0;
    missileSpawnTimer = 0;
    specialSpawnTimer = 0;
    itemSpawnTimer = 300; // spawn shield item quickly in the first 10 seconds for user fun
    
    player = new Player();
    
    highScore = parseInt(localStorage.getItem('cyber_avoid_highscore')) || 0;

    overlayStart.classList.remove('active');
    overlayLevelup.classList.remove('active');
    overlayGameover.classList.remove('active');
    overlayPaused.classList.remove('active');

    gameState = STATE_PLAYING;
    
    // Web Audio Synthesized BGM Loop trigger!
    SFX.stopBGM();
    SFX.startBGM();
}

// ----------------------------------------------------
// 14. DOM EVENTS & MOUSE/KEYBOARD LISTENERS
// ----------------------------------------------------
const btnCtrlKeyboard = document.getElementById('btn-ctrl-keyboard');
const btnCtrlMouse = document.getElementById('btn-ctrl-mouse');
const helpKeyboard = document.getElementById('help-keyboard');
const helpMouse = document.getElementById('help-mouse');

btnCtrlKeyboard.addEventListener('click', () => {
    SFX.playBeep();
    controlMode = 'keyboard';
    btnCtrlKeyboard.classList.add('active');
    btnCtrlMouse.classList.remove('active');
    helpKeyboard.classList.remove('hidden');
    helpMouse.classList.add('hidden');
});

btnCtrlMouse.addEventListener('click', () => {
    SFX.playBeep();
    controlMode = 'mouse';
    btnCtrlMouse.classList.add('active');
    btnCtrlKeyboard.classList.remove('active');
    helpMouse.classList.remove('hidden');
    helpKeyboard.classList.add('hidden');
});

// Sound toggling (Effects & BGM volume control node link)
const btnMute = document.getElementById('btn-mute');
btnMute.addEventListener('click', () => {
    const isMuted = SFX.toggleMute();
    btnMute.innerText = isMuted ? 'SOUND: OFF' : 'SOUND: ON';
    if (!isMuted) {
        SFX.playBeep();
    }
});

// Action overlays buttons
document.getElementById('btn-start').addEventListener('click', () => {
    SFX.playLevelWarp();
    initGame();
});

document.getElementById('btn-restart').addEventListener('click', () => {
    SFX.playLevelWarp();
    initGame();
});

// 파일럿 점수 등록 처리
const btnSubmitScore = document.getElementById('btn-submit-score');
const nameInput = document.getElementById('player-name-input');

function submitScore() {
    let pilotName = nameInput.value.trim().toUpperCase();
    if (!pilotName) pilotName = 'PILOT';
    
    // 특수문자 제거 및 영문대문자/숫자만 포함
    pilotName = pilotName.replace(/[^A-Z0-9_-]/g, '');
    if (pilotName.length === 0) pilotName = 'PILOT';
    
    // 랭킹 리스트 등록
    rankings.push({
        name: pilotName,
        score: score,
        level: level
    });
    
    // 내림차순 정렬 및 상위 10개 보유
    rankings.sort((a, b) => b.score - a.score);
    rankings = rankings.slice(0, 10);
    
    // 로컬 스토리지 보존
    localStorage.setItem('cyber_avoid_rankings', JSON.stringify(rankings));
    
    // UI 업데이트
    updateLeaderboardUI();
    
    // 최고 점수 갱신 연동
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('cyber_avoid_highscore', highScore);
        domHighScore.innerText = String(highScore).padStart(6, '0');
    }
    
    // 등록 축하 오디오 피드백
    SFX.playLevelWarp();
    
    // UI 전환
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

document.getElementById('btn-resume').addEventListener('click', () => {
    SFX.playBeep();
    gameState = STATE_PLAYING;
    overlayPaused.classList.remove('active');
    SFX.resumeBGM(); // Resume melody sequencer audio node gain volume
});

// Key bindings
window.addEventListener('keydown', (e) => {
    keys[e.code] = true;

    if (e.code === 'Escape' || e.code === 'KeyP') {
        if (gameState === STATE_PLAYING) {
            gameState = STATE_PAUSED;
            overlayPaused.classList.add('active');
            SFX.playBeep();
            SFX.pauseBGM(); // Pause background melody volume Node instantly
        } else if (gameState === STATE_PAUSED) {
            gameState = STATE_PLAYING;
            overlayPaused.classList.remove('active');
            SFX.playBeep();
            SFX.resumeBGM();
        }
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

// Init backgrounds & load pilot high score rankings
loadRankings();
initStars();
requestAnimationFrame(gameLoop);
