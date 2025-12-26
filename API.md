# WebSocket API Reference

Message protocol for ESP32-S3 dashboard integration.

## Connection

**URL:** `ws://localhost:8080` (configurable in script.js line 104)

**Auto-Reconnect:** Yes (exponential backoff, max 5 attempts)

**Message Format:** JSON with timestamp

## Message Structure

```javascript
{
  type: "message_type",     // string: message category
  data: {},                 // object: message-specific data
  timestamp: 1234567890     // number: client-side unix ms (optional)
}
```

## Client → Server Messages

### Start Oscilloscope Acquisition

```javascript
{
  type: "osc_request",
  data: {
    points: 768              // 500-1000 points per frame
  },
  timestamp: Date.now()
}
```

**When:** Every frame during OSC mode (~30 FPS)

**Response Expected:** `osc_data` message with array of samples

---

### Start FFT Acquisition

```javascript
{
  type: "fft_request",
  data: {
    bins: 384                // 256-512 bins per frame
  },
  timestamp: Date.now()
}
```

**When:** Every frame during FFT mode (~30 FPS)

**Response Expected:** `fft_data` message with magnitude values

---

### Stop Acquisition

```javascript
{
  type: "stop_acq",
  data: {},
  timestamp: Date.now()
}
```

**When:** User clicks STOP button

---

## Server → Client Messages

### Oscilloscope Data

```javascript
{
  type: "osc_data",
  data: [
    0.123,    // sample 1 (normalized -1.0 to 1.0)
    -0.456,   // sample 2
    0.789,    // sample 3
    ...       // up to 768 samples
  ],
  timestamp: Date.now()
}
```

**Requirements:**
- Array of samples, normalized to -1.0 to 1.0
- Must have exactly `points` elements (as requested)
- Sent ~30 times per second

**Example (Arduino):**
```cpp
DynamicJsonDocument doc(3000);
JsonArray data = doc.createNestedArray("data");

for (int i = 0; i < 768; i++) {
    float normalized = (analogRead(A0) - 2048.0) / 2048.0;  // 12-bit ADC
    data.add(normalized);
}

doc["type"] = "osc_data";
doc["timestamp"] = millis();

String json;
serializeJson(doc, json);
webSocket.sendTXT(clientNum, json);
```

---

### FFT Data (Frequency Magnitude)

```javascript
{
  type: "fft_data",
  data: [
    0.95,     // bin 0 magnitude (0.0 - 1.0)
    0.82,     // bin 1
    0.65,     // bin 2
    ...       // up to 384 bins
  ],
  timestamp: Date.now()
}
```

**Requirements:**
- Array of magnitude values, normalized 0.0 to 1.0
- Must have exactly `bins` elements (as requested)
- Bins represent: 0 Hz to `samplingRate/2` Hz
- Sent ~30 times per second

**Frequency Resolution:**
```
freqPerBin = (samplingRate / 2) / binCount
binFreq = binIndex * freqPerBin
```

**Example (Arduino with FFT library):**
```cpp
#include "FFT.h"

float fftData[384];
analyzeFFT(inputSamples, 768, fftData, 384);

// Normalize to 0-1
float maxVal = findMax(fftData, 384);
for (int i = 0; i < 384; i++) {
    fftData[i] /= maxVal;
}

// Send
DynamicJsonDocument doc(2000);
JsonArray data = doc.createNestedArray("data");
for (int i = 0; i < 384; i++) {
    data.add(fftData[i]);
}

doc["type"] = "fft_data";
serializeJson(doc, json);
webSocket.sendTXT(clientNum, json);
```

---

### Status Update (LED)

```javascript
{
  type: "led",
  status: "connected",  // "disconnected" | "connecting" | "connected"
  timestamp: Date.now()
}
```

**When:** Connection state changes

**Display:**
- `disconnected` → Red LED
- `connecting` → Orange/yellow blinking LED
- `connected` → Green pulsing LED

---

### Control Update (Slider)

```javascript
{
  type: "slider",
  value: 2500,          // 100-10000 (Hz)
  timestamp: Date.now()
}
```

**When:** Server wants to update client slider

**Effect:** Updates dashboard sampling rate slider + UI

---

## Data Specifications

### Oscilloscope (15 kHz Sampling)

| Parameter | Value |
|-----------|-------|
| Hardware Sample Rate | 15,000 Hz |
| Samples per Frame | 768 (default) |
| Normalization | -1.0 to +1.0 |
| Frame Rate | ~30 FPS |
| Time Window | 51.2 ms |
| Time Resolution | 6.67 µs/sample |

**Timing:**
```
frame_period = 33 ms (30 FPS)
sample_period = 1,000,000 / 15,000 = 66.7 µs
total_time = 768 * 66.7 µs ≈ 51 ms
```

---

### FFT (1500 Hz Maximum Frequency)

| Parameter | Value |
|-----------|-------|
| Max Frequency | 1500 Hz |
| Bins per Frame | 384 (default) |
| Frequency Resolution | 3.9 Hz/bin |
| Bins Count | 256-512 recommended |

**Frequency Mapping:**
```
binIndex = 0
freq = 0 Hz

binIndex = 100
freq = 100 * (1500 / 384) ≈ 391 Hz

binIndex = 384
freq = 1500 Hz
```

---

## Connection Lifecycle

### Startup

```
1. Client connects to ws://localhost:8080
2. Server receives onConnect event
3. Send LED status: "connected"
4. Wait for osc_request or fft_request
```

### During OSC Mode

```
1. Client sends osc_request with 768 points
2. Server acquires 768 samples at 15 kHz (51 ms)
3. Server normalizes to -1.0...1.0
4. Server sends osc_data
5. Client renders waveform
6. Repeat ~30 times per second
```

### During FFT Mode

```
1. Client sends fft_request with 384 bins
2. Server runs FFT on buffered samples
3. Server extracts magnitudes [0...1]
4. Server sends fft_data
5. Client renders frequency bars
6. Repeat ~30 times per second
```

### Disconnect

```
1. Connection drops or closes
2. Client auto-reconnects (exponential backoff)
3. Server can broadcast updated LED status
4. Dashboard continues with fake data during disconnect
```

---

## Error Handling

### Server-Side (Arduino)

```cpp
void handleWebsocket(uint8_t num, WStype_t type, uint8_t *payload, size_t len) {
    if (type == WStype_TEXT) {
        // Validate JSON
        DynamicJsonDocument doc(1024);
        DeserializationError error = deserializeJson(doc, payload);

        if (error) {
            Serial.print("JSON parse error: ");
            Serial.println(error.c_str());
            return;
        }

        String msgType = doc["type"];

        if (msgType == "osc_request") {
            // Acquire OSC data
            sendOscData(doc["data"]["points"]);
        } else if (msgType == "fft_request") {
            // Compute FFT
            sendFFTData(doc["data"]["bins"]);
        }
    }
}
```

### Client-Side (Already Implemented)

- ✅ Auto-reconnect on disconnect
- ✅ Error logging to console and debug panel
- ✅ JSON parse error handling
- ✅ Graceful degradation (fake data during disconnect)
- ✅ Message validation

---

## Testing

### Fake Server (Python)

```python
import asyncio
import websockets
import json
import random

async def echo(websocket, path):
    async for message in websocket:
        msg = json.loads(message)

        if msg['type'] == 'osc_request':
            data = [random.uniform(-1, 1) for _ in range(msg['data']['points'])]
            response = {
                'type': 'osc_data',
                'data': data,
                'timestamp': int(time.time() * 1000)
            }
        elif msg['type'] == 'fft_request':
            data = [random.uniform(0, 1) for _ in range(msg['data']['bins'])]
            response = {
                'type': 'fft_data',
                'data': data,
                'timestamp': int(time.time() * 1000)
            }

        await websocket.send(json.dumps(response))

asyncio.get_event_loop().run_until_complete(websockets.serve(echo, 'localhost', 8080))
asyncio.get_event_loop().run_forever()
```

Run: `python test_server.py`

Then open dashboard and connect to real WebSocket!

---

## Performance Targets

| Metric | Target | Notes |
|--------|--------|-------|
| Frame Rate | 25-30 FPS | Smooth visuals |
| Latency | <100 ms | User feels responsive |
| CPU | <10% | ESP32 can do other tasks |
| Memory | <1 MB | Buffer data efficiently |
| Message Size | <5 KB | Fast transmission |

### Bandwidth Estimate

```
OSC:  768 samples * 4 bytes = 3.072 KB per message
FFT:  384 bins * 4 bytes = 1.536 KB per message
Rate: 30 messages/sec = 90 KB/sec max

Over WiFi @ 11 Mbps ≈ 0.08% of bandwidth
```

---

## Migration Checklist

Before flashing real ESP32:

- [ ] Test with Python fake server (above)
- [ ] Verify JSON serialization works
- [ ] Check data normalization (-1...1 for OSC, 0...1 for FFT)
- [ ] Measure sample timing (should match 15 kHz)
- [ ] Verify frame rate (30 FPS)
- [ ] Test auto-reconnection
- [ ] Monitor heap usage (no leaks)
- [ ] Test with multiple clients

---

## Reference Implementation

See `SETUP.md` for full Arduino example with:
- WiFi access point
- WebSocket server
- ADC sampling at 15 kHz
- FFT computation
- JSON serialization

All code ready to flash to ESP32-S3!
