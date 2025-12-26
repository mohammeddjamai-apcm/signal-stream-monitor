// Debug Logging
const debug = {
    enabled: true,
    log(msg, data) {
        if (!this.enabled) return;
        console.log(`[${new Date().toLocaleTimeString()}] ${msg}`, data || '');
    },
    error(msg, err) {
        console.error(`[ERROR] ${msg}`, err || '');
    }
};

// State
let state = {
    isDark: true,
    isCollapsed: false,
    samplingRate: 1000,
    acquisitionMode: 'idle', // 'idle', 'osc', 'fft'
    connectionStatus: 'disconnected', // 'disconnected', 'connecting', 'connected'
    animationId: null,
    frameId: null,
    phase: 0,
    ws: null,
    wsReconnectAttempts: 0,
    wsReconnectMaxAttempts: 5,
    wsReconnectDelay: 2000,
    frameCount: 0,
    lastFrameTime: 0
};

// Fake Data Generator
const dataGen = {
    oscPhase: 0,
    fftPhase: 0,
    ledStates: ['disconnected', 'connecting', 'connected'],
    ledIndex: 0,
    sliderValue: 50,

    generateOscData(points) {
        const data = [];
        const samplingRate = 15000; // 15 kHz
        const duration = points / samplingRate;
        const frequency1 = 500; // 500 Hz signal
        const frequency2 = 2000; // 2 kHz signal (harmonics)
        const noise = 0.1;

        for (let i = 0; i < points; i++) {
            const t = i / samplingRate;
            const signal = Math.sin(2 * Math.PI * frequency1 * t) +
                          0.5 * Math.sin(2 * Math.PI * frequency2 * t);
            const value = signal + (Math.random() - 0.5) * noise;
            data.push(value);
        }
        this.oscPhase = (this.oscPhase + points / samplingRate * 0.5) % (2 * Math.PI);
        return data;
    },

    generateFFTData(bins) {
        const data = new Array(bins).fill(0);
        const maxFreq = 1500;
        const binWidth = maxFreq / bins;

        // Fundamental and harmonics
        const peaks = [
            { freq: 500, magnitude: 1.0 },    // 500 Hz
            { freq: 1000, magnitude: 0.6 },   // 1 kHz
            { freq: 1500, magnitude: 0.3 }    // 1.5 kHz
        ];

        peaks.forEach(peak => {
            const binIndex = Math.floor(peak.freq / binWidth);
            const spread = 3;
            for (let i = -spread; i <= spread; i++) {
                const idx = binIndex + i;
                if (idx >= 0 && idx < bins) {
                    const factor = 1 - Math.abs(i) / (spread + 1);
                    data[idx] = Math.max(data[idx], peak.magnitude * factor);
                }
            }
        });

        // Add some noise variation
        data.forEach((val, i) => {
            data[i] = val * (0.8 + Math.random() * 0.4) + Math.sin(this.fftPhase + i * 0.1) * 0.15;
        });

        this.fftPhase = (this.fftPhase + 0.1) % (2 * Math.PI);
        return data;
    },

    getRandomLEDState() {
        this.ledIndex = (this.ledIndex + 1) % this.ledStates.length;
        return this.ledStates[this.ledIndex];
    },

    getSliderValue() {
        this.sliderValue = (this.sliderValue + Math.sin(this.oscPhase) * 5 + (Math.random() - 0.5) * 3) % 100;
        return Math.max(0, Math.min(100, this.sliderValue));
    }
};

// WebSocket Handler
const wsHandler = {
    url: 'ws://localhost:8080',
    messageHandlers: {},

    init() {
        this.connect();
        debug.log('WebSocket init', `Target: ${this.url}`);
    },

    connect() {
        if (state.ws && (state.ws.readyState === WebSocket.OPEN || state.ws.readyState === WebSocket.CONNECTING)) {
            return;
        }

        try {
            state.ws = new WebSocket(this.url);
            state.connectionStatus = 'connecting';
            updateConnectionStatus('connecting');
            debug.log('WebSocket: attempting connection', this.url);

            state.ws.onopen = () => {
                debug.log('WebSocket: connected');
                state.wsReconnectAttempts = 0;
                updateConnectionStatus('connected');
            };

            state.ws.onmessage = (e) => {
                try {
                    const msg = JSON.parse(e.data);
                    debug.log('WebSocket rx', msg.type);
                    this.handleMessage(msg);
                } catch (err) {
                    debug.error('Failed to parse message', err);
                }
            };

            state.ws.onerror = (err) => {
                debug.error('WebSocket error', err);
            };

            state.ws.onclose = () => {
                debug.log('WebSocket: disconnected');
                updateConnectionStatus('disconnected');
                this.reconnect();
            };
        } catch (err) {
            debug.error('WebSocket connection failed', err);
            this.reconnect();
        }
    },

    reconnect() {
        if (state.wsReconnectAttempts >= state.wsReconnectMaxAttempts) {
            debug.error('Max reconnection attempts reached', state.wsReconnectAttempts);
            return;
        }

        state.wsReconnectAttempts++;
        const delay = state.wsReconnectDelay * state.wsReconnectAttempts;
        debug.log(`Reconnecting in ${delay}ms (attempt ${state.wsReconnectAttempts}/${state.wsReconnectMaxAttempts})`);

        setTimeout(() => this.connect(), delay);
    },

    handleMessage(msg) {
        if (msg.type === 'osc_data') {
            if (state.acquisitionMode === 'osc' && msg.data) {
                state.oscData = msg.data;
            }
        } else if (msg.type === 'fft_data') {
            if (state.acquisitionMode === 'fft' && msg.data) {
                state.fftData = msg.data;
            }
        } else if (msg.type === 'led') {
            updateConnectionStatus(msg.status || 'connected');
        } else if (msg.type === 'slider') {
            elements.samplingRate.value = msg.value || 1000;
            handleSamplingRateChange({ target: elements.samplingRate });
        }
    },

    send(type, data) {
        if (state.ws && state.ws.readyState === WebSocket.OPEN) {
            try {
                state.ws.send(JSON.stringify({ type, data, timestamp: Date.now() }));
                debug.log('WebSocket tx', type);
            } catch (err) {
                debug.error('Failed to send message', err);
            }
        }
    }
};

// DOM Elements
const elements = {
    body: document.body,
    themeToggle: document.getElementById('themeToggle'),
    collapseToggle: document.getElementById('collapseToggle'),
    controlPanel: document.getElementById('controlPanel'),
    samplingRate: document.getElementById('samplingRate'),
    rateValue: document.getElementById('rateValue'),
    oscBtn: document.getElementById('oscBtn'),
    fftBtn: document.getElementById('fftBtn'),
    stopBtn: document.getElementById('stopBtn'),
    modeStatus: document.getElementById('modeStatus'),
    stateStatus: document.getElementById('stateStatus'),
    plotRate: document.getElementById('plotRate'),
    plotMode: document.getElementById('plotMode'),
    canvas: document.getElementById('plotCanvas'),
    idleOverlay: document.getElementById('idleOverlay'),
    axisStart: document.getElementById('axisStart'),
    axisLabel: document.getElementById('axisLabel'),
    axisEnd: document.getElementById('axisEnd'),
    statusLed: document.getElementById('statusLed'),
    statusText: document.getElementById('statusText'),
    dateDisplay: document.getElementById('dateDisplay'),
    timeDisplay: document.getElementById('timeDisplay')
};

// Frame Loop (20-30 FPS)
function frameLoop() {
    const now = performance.now();
    const deltaTime = now - state.lastFrameTime;
    state.lastFrameTime = now;

    if (state.acquisitionMode !== 'idle') {
        // Update fake data from generator
        if (state.acquisitionMode === 'osc') {
            const decimatedPoints = 768; // 500-1000 points
            state.oscData = dataGen.generateOscData(decimatedPoints);
            wsHandler.send('osc_request', { points: decimatedPoints });
        } else if (state.acquisitionMode === 'fft') {
            const fftBins = 384; // 256-512 bins
            state.fftData = dataGen.generateFFTData(fftBins);
            wsHandler.send('fft_request', { bins: fftBins });
        }

        // Update LED state periodically
        if (state.frameCount % 30 === 0) {
            const ledState = dataGen.getRandomLEDState();
            updateConnectionStatus(ledState);
        }

        // Update slider value
        const newSliderValue = dataGen.getSliderValue();
        if (Math.abs(newSliderValue - parseInt(elements.samplingRate.value)) > 1) {
            elements.samplingRate.value = Math.round(newSliderValue);
            handleSamplingRateChange({ target: elements.samplingRate });
        }

        renderFrame();
    }

    state.frameCount++;
    state.frameId = setTimeout(frameLoop, 33); // ~30 FPS
}

// Render Frame
function renderFrame() {
    const canvas = elements.canvas;
    const rect = canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    drawGrid();

    if (state.acquisitionMode === 'osc' && state.oscData) {
        drawOscFromData(width, height, state.oscData);
    } else if (state.acquisitionMode === 'fft' && state.fftData) {
        drawFFTFromData(width, height, state.fftData);
    }
}

// Initialize
function init() {
    debug.log('Initializing SignalMonitor');
    setupCanvas();
    setupEventListeners();
    updateDateTime();
    setInterval(updateDateTime, 1000);
    wsHandler.init();
    drawGrid();
    debug.log('SignalMonitor ready');
}

// Setup Canvas
function setupCanvas() {
    const canvas = elements.canvas;
    const container = canvas.parentElement;

    function resize() {
        const rect = container.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);

        if (state.acquisitionMode === 'idle') {
            drawGrid();
        }
    }

    resize();
    window.addEventListener('resize', resize);
}

// Event Listeners
function setupEventListeners() {
    elements.themeToggle.addEventListener('click', toggleTheme);
    elements.collapseToggle.addEventListener('click', toggleCollapse);
    elements.samplingRate.addEventListener('input', handleSamplingRateChange);
    elements.oscBtn.addEventListener('click', () => startAcquisition('osc'));
    elements.fftBtn.addEventListener('click', () => startAcquisition('fft'));
    elements.stopBtn.addEventListener('click', stopAcquisition);
}

// Theme Toggle
function toggleTheme() {
    state.isDark = !state.isDark;
    elements.body.classList.toggle('dark');
}

// Collapse Toggle
function toggleCollapse() {
    state.isCollapsed = !state.isCollapsed;
    elements.controlPanel.classList.toggle('collapsed');
}

// Sampling Rate Change
function handleSamplingRateChange(e) {
    state.samplingRate = parseInt(e.target.value);
    updateRateDisplay();
}

function updateRateDisplay() {
    const rate = state.samplingRate;
    const formatted = rate >= 1000 ? `${(rate / 1000).toFixed(1)} kHz` : `${rate} Hz`;
    elements.rateValue.textContent = formatted;
    elements.plotRate.textContent = `${rate} Hz`;
    updateAxisLabels();
}

// Update Axis Labels
function updateAxisLabels() {
    if (state.acquisitionMode === 'fft') {
        elements.axisStart.textContent = '0 Hz';
        elements.axisLabel.textContent = 'Frequency →';
        elements.axisEnd.textContent = `${state.samplingRate / 2} Hz`;
    } else {
        elements.axisStart.textContent = '0 ms';
        elements.axisLabel.textContent = 'Time →';
        elements.axisEnd.textContent = `${(1000 / state.samplingRate * 100).toFixed(0)} ms`;
    }
}

// Start Acquisition
function startAcquisition(mode) {
    state.acquisitionMode = mode;

    // Update buttons
    elements.oscBtn.disabled = true;
    elements.fftBtn.disabled = true;
    elements.stopBtn.disabled = false;

    if (mode === 'osc') {
        elements.oscBtn.classList.add('active');
        elements.fftBtn.classList.remove('active');
    } else {
        elements.fftBtn.classList.add('active');
        elements.oscBtn.classList.remove('active');
    }

    // Update status
    elements.modeStatus.textContent = mode.toUpperCase();
    elements.plotMode.textContent = mode.toUpperCase();
    elements.stateStatus.textContent = 'Running';
    elements.stateStatus.classList.add('running');

    // Hide idle overlay
    elements.idleOverlay.classList.add('hidden');

    // Update plot modes
    updatePlotModes();

    // Update axis labels
    updateAxisLabels();

    // Reset counters
    state.frameCount = 0;
    state.lastFrameTime = performance.now();

    // Start frame loop
    debug.log(`Acquisition started: ${mode.toUpperCase()}`);
    frameLoop();
}

// Stop Acquisition
function stopAcquisition() {
    state.acquisitionMode = 'idle';

    // Update buttons
    elements.oscBtn.disabled = false;
    elements.fftBtn.disabled = false;
    elements.stopBtn.disabled = true;
    elements.oscBtn.classList.remove('active');
    elements.fftBtn.classList.remove('active');

    // Update status
    elements.modeStatus.textContent = '---';
    elements.plotMode.textContent = '---';
    elements.stateStatus.textContent = 'Stopped';
    elements.stateStatus.classList.remove('running');

    // Show idle overlay
    elements.idleOverlay.classList.remove('hidden');

    // Update plot modes
    updatePlotModes();

    // Stop frame loop
    if (state.frameId) {
        clearTimeout(state.frameId);
        state.frameId = null;
    }

    debug.log('Acquisition stopped');

    // Redraw grid
    drawGrid();
}

// Update Plot Modes
function updatePlotModes() {
    const plotModes = document.querySelectorAll('.plot-mode');
    plotModes.forEach((mode, index) => {
        if (index === 0 && state.acquisitionMode === 'osc') {
            mode.classList.add('active');
        } else if (index === 1 && state.acquisitionMode === 'fft') {
            mode.classList.add('active');
        } else {
            mode.classList.remove('active');
        }
    });
}

// Drawing Functions
function drawGrid() {
    const canvas = elements.canvas;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    // Get grid color from CSS
    const gridColor = getComputedStyle(document.documentElement)
        .getPropertyValue('--chart-grid').trim();

    // Clear canvas
    const bgColor = getComputedStyle(document.documentElement)
        .getPropertyValue('--card').trim();
    ctx.fillStyle = `hsl(${bgColor})`;
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = `hsl(${gridColor})`;
    ctx.lineWidth = 0.5;

    // Vertical lines
    const vSpacing = 50;
    for (let x = 0; x <= width; x += vSpacing) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
    }

    // Horizontal lines
    const hSpacing = 50;
    for (let y = 0; y <= height; y += hSpacing) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
    }

    // Center lines (brighter)
    const parts = gridColor.split(' ');
    ctx.strokeStyle = `hsl(${parts[0]} ${parts[1]} 35%)`;
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(width / 2, 0);
    ctx.lineTo(width / 2, height);
    ctx.stroke();
}

// Draw Oscilloscope from data array
function drawOscFromData(width, height, data) {
    const canvas = elements.canvas;
    const ctx = canvas.getContext('2d');

    const primaryColor = getComputedStyle(document.documentElement)
        .getPropertyValue('--primary').trim();

    ctx.strokeStyle = `hsl(${primaryColor})`;
    ctx.lineWidth = 2;
    ctx.shadowColor = `hsla(${primaryColor} / 0.5)`;
    ctx.shadowBlur = 8;

    const centerY = height / 2;
    const amplitude = height * 0.35;
    const xStep = width / data.length;

    ctx.beginPath();
    for (let i = 0; i < data.length; i++) {
        const x = i * xStep;
        const y = centerY + data[i] * amplitude;

        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    debug.log('OSC frame rendered', `${data.length} points`);
}

// Draw FFT from magnitude data array
function drawFFTFromData(width, height, data) {
    const canvas = elements.canvas;
    const ctx = canvas.getContext('2d');

    const primaryColor = getComputedStyle(document.documentElement)
        .getPropertyValue('--primary').trim();
    const accentColor = getComputedStyle(document.documentElement)
        .getPropertyValue('--accent').trim();

    const barCount = Math.min(data.length, Math.floor(width / 4));
    const barWidth = (width / barCount) * 0.8;
    const gap = width / barCount - barWidth;

    for (let i = 0; i < barCount; i++) {
        const x = i * (barWidth + gap);
        const magnitude = Math.max(0, Math.min(1, data[i] || 0));
        const barHeight = magnitude * height * 0.85;

        const gradient = ctx.createLinearGradient(x, height, x, height - barHeight);
        gradient.addColorStop(0, `hsl(${primaryColor})`);
        gradient.addColorStop(1, `hsl(${accentColor})`);

        ctx.fillStyle = gradient;
        ctx.shadowColor = `hsla(${primaryColor} / 0.4)`;
        ctx.shadowBlur = 6;

        ctx.fillRect(x, height - barHeight, barWidth, barHeight);
    }
    ctx.shadowBlur = 0;

    debug.log('FFT frame rendered', `${barCount} bars`);
}

// Connection Status
function updateConnectionStatus(status) {
    state.connectionStatus = status;
    elements.statusLed.className = `led ${status}`;

    const statusText = {
        disconnected: 'Disconnected',
        connecting: 'Connecting...',
        connected: 'Connected'
    };

    elements.statusText.textContent = statusText[status];
    debug.log('Connection status', status);
}

// Date Time
function updateDateTime() {
    const now = new Date();

    const dateOptions = {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    };
    const dateStr = now.toLocaleDateString('en-US', dateOptions);

    const timeStr = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });

    elements.dateDisplay.textContent = dateStr;
    elements.timeDisplay.textContent = timeStr;
}

// Debug Panel
const debugPanel = {
    maxEntries: 100,
    entries: [],
    logsEnabled: true,

    addEntry(msg, type = 'log') {
        if (!this.logsEnabled) return;

        const time = new Date().toLocaleTimeString();
        this.entries.push({ time, msg, type });

        if (this.entries.length > this.maxEntries) {
            this.entries.shift();
        }

        this.render();
    },

    render() {
        const logEl = document.getElementById('debugLog');
        if (!logEl) return;

        logEl.innerHTML = this.entries.map(e => `
            <div class="debug-log-entry ${e.type === 'error' ? 'debug-log-error' : ''}">
                <span class="debug-log-time">${e.time}</span>
                <span class="debug-log-msg">${e.msg}</span>
            </div>
        `).join('');

        logEl.scrollTop = logEl.scrollHeight;
    },

    updateStats() {
        const fps = Math.round(1000 / Math.max(1, performance.now() - state.lastFrameTime));
        const fpsEl = document.getElementById('debugFps');
        const modeEl = document.getElementById('debugMode');
        const wsEl = document.getElementById('debugWs');

        if (fpsEl) fpsEl.textContent = fps;
        if (modeEl) modeEl.textContent = state.acquisitionMode;
        if (wsEl) wsEl.textContent = state.connectionStatus;
    }
};

// Enhanced debug with panel integration
const originalDebugLog = debug.log.bind(debug);
const originalDebugError = debug.error.bind(debug);

debug.log = function(msg, data) {
    originalDebugLog(msg, data);
    debugPanel.addEntry(`${msg} ${data ? JSON.stringify(data) : ''}`, 'log');
};

debug.error = function(msg, err) {
    originalDebugError(msg, err);
    debugPanel.addEntry(`${msg} ${err ? err.message || JSON.stringify(err) : ''}`, 'error');
};

// Debug Panel Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    const debugToggle = document.getElementById('debugToggle');
    const debugClear = document.getElementById('debugClear');
    const debugToggleLogs = document.getElementById('debugToggleLogs');
    const debugPanel_ = document.getElementById('debugPanel');

    if (debugToggle) {
        debugToggle.addEventListener('click', () => {
            debugPanel_.classList.toggle('collapsed');
            debugToggle.textContent = debugPanel_.classList.contains('collapsed') ? '⊞' : '−';
        });
    }

    if (debugClear) {
        debugClear.addEventListener('click', () => {
            debugPanel.entries = [];
            debugPanel.render();
        });
    }

    if (debugToggleLogs) {
        debugToggleLogs.addEventListener('click', () => {
            debugPanel.logsEnabled = !debugPanel.logsEnabled;
            debugToggleLogs.textContent = debugPanel.logsEnabled ? 'Toggle Logs' : 'Logs Off';
        });
    }

    // Update stats every frame
    setInterval(() => debugPanel.updateStats(), 100);
});

// Initialize on load
document.addEventListener('DOMContentLoaded', init);
