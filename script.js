// State
let state = {
    isDark: true,
    isCollapsed: false,
    samplingRate: 1000,
    acquisitionMode: 'idle', // 'idle', 'osc', 'fft'
    connectionStatus: 'disconnected', // 'disconnected', 'connecting', 'connected'
    animationId: null,
    phase: 0
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

// Initialize
function init() {
    setupCanvas();
    setupEventListeners();
    updateDateTime();
    setInterval(updateDateTime, 1000);
    simulateConnection();
    drawGrid();
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

    // Start animation
    state.phase = 0;
    animate();
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

    // Stop animation
    if (state.animationId) {
        cancelAnimationFrame(state.animationId);
        state.animationId = null;
    }

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

function drawOSC(width, height, phase) {
    const canvas = elements.canvas;
    const ctx = canvas.getContext('2d');

    const primaryColor = getComputedStyle(document.documentElement)
        .getPropertyValue('--primary').trim();

    ctx.strokeStyle = `hsl(${primaryColor})`;
    ctx.lineWidth = 2;
    ctx.shadowColor = `hsla(${primaryColor} / 0.5)`;
    ctx.shadowBlur = 8;

    ctx.beginPath();
    const amplitude = height * 0.35;
    const centerY = height / 2;
    const frequency = 2 + (state.samplingRate / 5000);

    for (let x = 0; x < width; x++) {
        const y = centerY + amplitude * Math.sin((x / width) * Math.PI * 2 * frequency + phase);
        if (x === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
    ctx.stroke();
    ctx.shadowBlur = 0;
}

function drawFFT(width, height, phase) {
    const canvas = elements.canvas;
    const ctx = canvas.getContext('2d');

    const primaryColor = getComputedStyle(document.documentElement)
        .getPropertyValue('--primary').trim();
    const accentColor = getComputedStyle(document.documentElement)
        .getPropertyValue('--accent').trim();

    const barCount = 64;
    const barWidth = (width / barCount) * 0.7;
    const gap = (width / barCount) * 0.3;

    for (let i = 0; i < barCount; i++) {
        const x = i * (barWidth + gap) + gap / 2;

        const baseHeight = Math.sin(i * 0.3 + phase) * 0.5 + 0.5;
        const variation = Math.sin(i * 0.7 + phase * 2) * 0.3;
        const barHeight = (baseHeight + variation) * height * 0.7;

        const gradient = ctx.createLinearGradient(x, height, x, height - barHeight);
        gradient.addColorStop(0, `hsl(${primaryColor})`);
        gradient.addColorStop(1, `hsl(${accentColor})`);

        ctx.fillStyle = gradient;
        ctx.shadowColor = `hsla(${primaryColor} / 0.4)`;
        ctx.shadowBlur = 6;

        ctx.fillRect(x, height - barHeight, barWidth, barHeight);
    }
    ctx.shadowBlur = 0;
}

function animate() {
    const canvas = elements.canvas;
    const rect = canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const ctx = canvas.getContext('2d');

    // Clear canvas
    const bgColor = getComputedStyle(document.documentElement)
        .getPropertyValue('--card').trim();
    ctx.fillStyle = `hsl(${bgColor})`;
    ctx.fillRect(0, 0, width, height);

    // Draw grid
    drawGrid();

    // Draw waveform
    if (state.acquisitionMode === 'osc') {
        drawOSC(width, height, state.phase);
        state.phase += 0.05;
    } else if (state.acquisitionMode === 'fft') {
        drawFFT(width, height, state.phase);
        state.phase += 0.03;
    }

    if (state.acquisitionMode !== 'idle') {
        state.animationId = requestAnimationFrame(animate);
    }
}

// Connection Status
function simulateConnection() {
    updateConnectionStatus('connecting');

    setTimeout(() => {
        updateConnectionStatus('connected');
    }, 2000);
}

function updateConnectionStatus(status) {
    state.connectionStatus = status;
    elements.statusLed.className = `led ${status}`;

    const statusText = {
        disconnected: 'Disconnected',
        connecting: 'Connecting...',
        connected: 'Connected'
    };

    elements.statusText.textContent = statusText[status];
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

// Initialize on load
document.addEventListener('DOMContentLoaded', init);
