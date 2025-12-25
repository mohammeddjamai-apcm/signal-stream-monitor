# SignalMonitor - HTML/CSS/JavaScript Version

A pure HTML/CSS/JavaScript implementation of the SignalMonitor application for signal acquisition and visualization.

## Features

- **Oscilloscope (OSC) Mode**: Real-time waveform visualization
- **FFT Mode**: Frequency spectrum analysis with animated bars
- **Adjustable Sampling Rate**: 100 Hz to 10 kHz
- **Dark/Light Theme**: Toggle between themes
- **Collapsible Control Panel**: Maximize plotting area
- **Real-time Clock**: Display current date and time
- **Connection Status**: Visual LED indicator

## Files

- `index-vanilla.html` - Main HTML file
- `styles.css` - All styling and theme variables
- `script.js` - JavaScript functionality

## Usage

### Option 1: Direct File Access

Simply open `index-vanilla.html` in your web browser.

### Option 2: Local Server

For better performance and to avoid CORS issues:

```bash
# Using Python 3
python -m http.server 8000

# Using Node.js (if http-server is installed)
npx http-server

# Using PHP
php -S localhost:8000
```

Then navigate to `http://localhost:8000/index-vanilla.html`

## How to Use

1. **Start Acquisition**:
   - Click "OSC" button for oscilloscope mode
   - Click "FFT" button for frequency spectrum mode

2. **Adjust Sampling Rate**:
   - Use the slider in the control panel
   - Range: 100 Hz to 10 kHz

3. **Stop Acquisition**:
   - Click the "STOP" button

4. **Toggle Theme**:
   - Click the sun/moon icon in the top-right corner

5. **Collapse/Expand Panel**:
   - Click the chevron button on the control panel edge

## Customization

### Colors

Edit CSS variables in `styles.css`:

```css
:root {
    --primary: 187 80% 42%;      /* Main accent color */
    --success: 142 72% 42%;      /* Success/connected color */
    --warning: 38 92% 50%;       /* Warning/connecting color */
    --destructive: 0 72% 51%;    /* Error/destructive color */
}
```

### Sampling Rate Range

Modify the slider in `index-vanilla.html`:

```html
<input type="range" id="samplingRate" min="100" max="10000" step="100" value="1000">
```

### Animation Speed

Adjust phase increment in `script.js`:

```javascript
// In animate() function
state.phase += 0.05;  // OSC speed
state.phase += 0.03;  // FFT speed
```

## Browser Compatibility

- Chrome/Edge: ✓
- Firefox: ✓
- Safari: ✓
- Opera: ✓

Requires:
- HTML5 Canvas support
- CSS Custom Properties (CSS Variables)
- ES6 JavaScript features

## Performance Notes

- Canvas rendering is optimized with `requestAnimationFrame`
- Device pixel ratio is automatically detected for HiDPI displays
- Grid is redrawn only when necessary

## No Dependencies

This version uses:
- **Zero** JavaScript frameworks
- **Zero** CSS frameworks
- **Zero** build tools
- **Zero** npm packages

Just pure HTML, CSS, and JavaScript!

## License

This is a demonstration project. Feel free to use and modify as needed.
