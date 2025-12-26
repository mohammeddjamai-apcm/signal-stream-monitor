# Quick Verification Guide

Test the dashboard in 5 minutes without any hardware.

## Step 1: Open Dashboard

```bash
# Open directly in browser
open index-vanilla.html

# OR use local server (recommended)
python -m http.server 8000
# Visit: http://localhost:8000/index-vanilla.html
```

Expected: Clean dashboard loads, LED is red (disconnected), debug console visible at bottom.

## Step 2: Verify Fake Data (OSC Mode)

1. Click **OSC** button
2. Watch: Smooth waveform appears on canvas
3. Check:
   - Waveform oscillates smoothly
   - No flickering
   - Grid visible behind waveform
   - "OSC" label highlighted
   - Status shows "Running"
   - STOP button enabled (red)

Debug console should show:
```
[HH:MM:SS] Acquisition started: OSC
[HH:MM:SS] OSC frame rendered 768 points
[HH:MM:SS] OSC frame rendered 768 points
```

## Step 3: Verify Fake Data (FFT Mode)

1. Click **STOP** button
2. Click **FFT** button
3. Watch: Animated frequency bars appear
4. Check:
   - 3 prominent bars (500 Hz, 1 kHz, 1.5 kHz peaks)
   - Bars animate smoothly
   - Heights vary (not static)
   - "FFT" label highlighted

Debug console shows:
```
[HH:MM:SS] Acquisition stopped
[HH:MM:SS] Acquisition started: FFT
[HH:MM:SS] FFT frame rendered 96 bars
```

## Step 4: Test Controls

### Sampling Rate Slider

1. Drag slider left/right
2. Check:
   - Rate value updates (e.g., "1.5 kHz")
   - Axis labels change
   - UI responds smoothly

### Theme Toggle

1. Click sun/moon icon (top-right)
2. Check:
   - Background/colors invert
   - Text still readable
   - Canvas updates theme

### Panel Collapse

1. Click chevron button (right edge of control panel)
2. Check:
   - Panel collapses to icons only
   - Plot area expands
   - Click again to expand

## Step 5: Debug Console

### Stats Panel

Top of console shows:
- **FPS:** Should be 25-30 during acquisition
- **Mode:** Shows "osc" or "fft" during acquisition
- **WS:** Shows "disconnected" (expected for local test)

### Log View

Shows timestamped messages:
- Frame renders
- Mode changes
- Status updates
- WebSocket attempts (shown as errors, OK for local test)

### Controls

**Clear Log:** Clears all messages

**Toggle Logs:** Disables new log entries (useful for performance testing)

**Collapse Button (−/⊞):** Hides/shows log content

## Step 6: LED Status Animation

During acquisition (OSC or FFT):

1. Watch LED circle (top-left, next to logo)
2. LED should **cycle through colors:**
   - Red (disconnected)
   - Orange/yellow (connecting, blinking)
   - Green (connected, pulsing)
3. Cycles approximately every 1-2 seconds

## Performance Check

### Frame Rate

1. Start OSC or FFT
2. Watch debug console FPS counter
3. Should show 25-30 FPS consistently
4. Should not exceed 35 FPS

### Responsiveness

1. While running, click buttons
2. Mode changes should happen instantly
3. STOP should stop immediately
4. No lag or delay

### Memory

Open browser DevTools (F12):

1. Click Memory tab
2. Take snapshot
3. Acquire data for 30 seconds
4. Take another snapshot
5. Memory increase should be <5 MB
6. No continuous growth = good

## WebSocket Behavior (Expected Failures)

### First Launch

Debug console will show:
```
[HH:MM:SS] WebSocket init Target: ws://localhost:8080
[HH:MM:SS] WebSocket: attempting connection ws://localhost:8080
[ERROR] WebSocket connection failed
[HH:MM:SS] Reconnecting in 2000ms (attempt 1/5)
[HH:MM:SS] Reconnecting in 4000ms (attempt 2/5)
```

This is **expected** - no WebSocket server is running locally.

### LED Still Works

Even with WebSocket failing:
- LED still animates (from fake data)
- Oscilloscope/FFT still works
- Slider still updates
- Dashboard is fully functional with fake data

## Success Criteria

All items should work:

- [x] Dashboard loads without errors
- [x] OSC mode shows smooth waveform
- [x] FFT mode shows frequency bars
- [x] Sampling rate slider updates
- [x] Theme toggle works
- [x] Panel collapse/expand works
- [x] STOP button stops acquisition
- [x] LED cycles through states
- [x] Debug console logs messages
- [x] FPS shows 25-30
- [x] No crashes or console errors
- [x] Smooth 60 FPS rendering

## Troubleshooting

### Waveform doesn't appear

1. Did you click OSC button?
2. Check debug console for "Acquisition started"
3. Open browser console (F12) for JS errors
4. Try refreshing page

### FFT bars all same height

1. Wait a few frames (FFT animates)
2. Bars should have 3 distinct heights
3. Check debug console for "FFT frame rendered"

### High CPU usage

1. Click "Toggle Logs" to disable logging
2. Close other browser tabs
3. Check that FPS is 25-30, not 60+
4. Try different browser

### WebSocket errors are fine

Local testing doesn't need WebSocket server. Errors are expected.

## Next: ESP32 Integration

Once verified, you can:

1. Create WebSocket server on ESP32
2. Change URL in `script.js` line 104
3. Real data from sensors instead of fake data
4. Same UI/visualization pipeline

## Files

- **index-vanilla.html** - Main page (no React)
- **styles.css** - All styling (25 KB)
- **script.js** - All logic (18 KB)
- **SETUP.md** - Full documentation
- **VERIFY.md** - This file

Total: ~49 KB of pure vanilla code. Perfect for ESP32.
