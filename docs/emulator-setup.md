# Emulator & Device Setup Guide

## Overview

This guide explains how to connect your mobile app (running on emulator or physical device) to the backend API.

## Server Configuration

The backend server is configured to listen on `0.0.0.0` (all network interfaces), making it accessible from:
- Android Emulators
- iOS Simulators  
- Physical devices on the same network

## Base URLs for Different Platforms

### Android Emulator

**Base URL:** `http://10.0.2.2:3000`

The Android emulator uses `10.0.2.2` as a special alias that maps to `localhost` (127.0.0.1) on your host machine.

```javascript
// Example API configuration for Android
const API_BASE_URL = 'http://10.0.2.2:3000/api/v1';

// Example: Request OTP
fetch('http://10.0.2.2:3000/api/v1/user/request-otp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ phone: '+1234567890' })
});
```

### iOS Simulator (macOS)

**Base URL:** `http://localhost:3000`

The iOS simulator on macOS can directly access `localhost` on your host machine.

```javascript
// Example API configuration for iOS
const API_BASE_URL = 'http://localhost:3000/api/v1';
```

### Physical Device (Android/iOS)

**Base URL:** `http://<YOUR_LOCAL_IP>:3000`

You need to use your computer's local IP address. Find it using:

**macOS/Linux:**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
# or
ipconfig getifaddr en0
```

**Windows:**
```bash
ipconfig
# Look for IPv4 Address under your active network adapter
```

Example:
```javascript
// Example API configuration for physical device
const API_BASE_URL = 'http://192.168.1.100:3000/api/v1';
```

## Network Requirements

### For Emulators
✅ **No firewall changes needed** - Emulators use special networking

### For Physical Devices
⚠️ **Firewall Configuration Required:**

1. **macOS Firewall:**
   - System Preferences → Security & Privacy → Firewall
   - Click "Firewall Options"
   - Ensure Node.js/your terminal has incoming connections allowed

2. **Windows Firewall:**
   - Allow Node.js through Windows Firewall
   - Or temporarily disable firewall for testing

3. **Same Network:**
   - Your computer and physical device must be on the same Wi-Fi network
   - Mobile data won't work - use Wi-Fi only

## Testing Connection

### Quick Test from Emulator/Device

1. **Check if server is running:**
   ```bash
   curl http://localhost:3000/api-docs
   ```

2. **Test from Android Emulator (via ADB):**
   ```bash
   adb shell
   curl http://10.0.2.2:3000/api-docs
   ```

3. **Test from Browser (on device):**
   - Open browser on emulator/device
   - Navigate to: `http://10.0.2.2:3000/api-docs` (Android) or `http://localhost:3000/api-docs` (iOS)
   - You should see Swagger UI

### Common Issues

#### Issue: "Connection refused" or "Network error"

**Solution:**
1. Ensure server is running (`npm run dev`)
2. Check server logs for errors
3. Verify you're using the correct base URL for your platform
4. For physical devices: Check firewall settings and same network

#### Issue: "Unable to connect" on physical device

**Solution:**
1. Find your computer's IP address (see above)
2. Use `http://<IP>:3000` instead of `localhost`
3. Ensure device and computer are on same Wi-Fi
4. Temporarily disable firewall for testing

#### Issue: CORS errors

**Solution:**
The backend may need CORS middleware. See `CORS Setup` section below.

## CORS Setup (If Needed)

If you encounter CORS errors, add CORS middleware to `index.js`:

```javascript
import cors from 'cors';

// Allow all origins (for development only)
app.use(cors({
  origin: '*',
  credentials: true
}));
```

For production, specify allowed origins:

```javascript
app.use(cors({
  origin: ['http://localhost:3000', 'https://yourdomain.com'],
  credentials: true
}));
```

Don't forget to install:
```bash
npm install cors
```

## Example API Client Configuration

### React Native Example

```javascript
// config/api.js
const getBaseURL = () => {
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3000/api/v1';
  } else if (__DEV__) {
    // iOS Simulator
    return 'http://localhost:3000/api/v1';
  } else {
    // Production or physical device
    return 'http://192.168.1.100:3000/api/v1'; // Replace with your IP
  }
};

export const API_BASE_URL = getBaseURL();

// Usage
fetch(`${API_BASE_URL}/user/request-otp`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ phone: '+1234567890' })
});
```

### Flutter Example

```dart
// config/api_config.dart
class ApiConfig {
  static String get baseUrl {
    if (Platform.isAndroid) {
      return 'http://10.0.2.2:3000/api/v1';
    } else {
      // iOS or physical device
      return 'http://localhost:3000/api/v1'; // or use your IP
    }
  }
}

// Usage
final response = await http.post(
  Uri.parse('${ApiConfig.baseUrl}/user/request-otp'),
  headers: {'Content-Type': 'application/json'},
  body: jsonEncode({'phone': '+1234567890'}),
);
```

## Environment Variables

You can also configure the base URL via environment variable:

```bash
# .env
API_BASE_URL=http://10.0.2.2:3000/api/v1  # Android
# API_BASE_URL=http://localhost:3000/api/v1  # iOS
# API_BASE_URL=http://192.168.1.100:3000/api/v1  # Physical device
```

## Summary

| Platform | Base URL | Notes |
|----------|----------|-------|
| Android Emulator | `http://10.0.2.2:3000` | Use `10.0.2.2` instead of `localhost` |
| iOS Simulator | `http://localhost:3000` | Works directly on macOS |
| Physical Device | `http://<YOUR_IP>:3000` | Same Wi-Fi required |

Always use the base URL with `/api/v1` prefix for API endpoints:
- `http://10.0.2.2:3000/api/v1/user/request-otp`
- `http://10.0.2.2:3000/api/v1/user/issues`
- etc.

