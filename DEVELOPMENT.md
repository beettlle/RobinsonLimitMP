# Development Setup Guide

This guide explains how to set up the RobinsonLimitMP for local development with environment variables.

## 🚀 Quick Start

### Option 1: Use the Development Server (Recommended)

1. **Start the development server:**
   ```bash
   ./start-dev.sh
   ```
   
   This will:
   - Create a `.env` file from `.env.example` if it doesn't exist
   - Load environment variables from `.env`
   - Start a Python server with environment variable support
   - Serve the app at `http://localhost:8000`

2. **Set up your API keys:**
   ```bash
   # Edit the .env file with your API keys
   nano .env
   ```
   
   Add your API keys:
   ```env
   OPENWEATHER_API_KEY=your_openweathermap_api_key_here
   WEATHERAPI_KEY=your_weatherapi_key_here
   ```

### Option 2: Manual Environment Variable Setup

If you prefer to use a different server or set environment variables manually:

1. **Set environment variables:**
   ```bash
   export OPENWEATHER_API_KEY=your_openweathermap_api_key_here
   export WEATHERAPI_KEY=your_weatherapi_key_here
   ```

2. **Start a simple server:**
   ```bash
   python3 -m http.server 8000
   ```

3. **Open in browser:**
   ```
   http://localhost:8000
   ```

## 🔧 Environment Variables

The app uses these environment variables:

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENWEATHER_API_KEY` | OpenWeatherMap API key | No (fallback available) |
| `WEATHERAPI_KEY` | WeatherAPI.com API key | No (fallback available) |

## 📁 File Structure

```
RobinsonLimitMP/
├── .env                    # Environment variables (create from .env.example)
├── .env.example           # Example environment variables
├── dev-server.py          # Development server with env support
├── start-dev.sh           # Quick start script
├── config.js              # Configuration loader
└── ...                    # Other app files
```

## 🌐 API Key Setup

### OpenWeatherMap API Key
1. Visit [OpenWeatherMap](https://openweathermap.org/api)
2. Sign up for a free account
3. Get your API key from the dashboard
4. Add it to your `.env` file

### WeatherAPI.com API Key
1. Visit [WeatherAPI.com](https://www.weatherapi.com/)
2. Sign up for a free account
3. Get your API key from the dashboard
4. Add it to your `.env` file

## 🔍 Troubleshooting

### "No .env file found"
- The development server will create one from `.env.example`
- Edit the `.env` file with your actual API keys

### "API key not configured"
- Check that your `.env` file exists and has the correct variable names
- Verify the API keys are valid and not expired
- The app will work without API keys (uses fallback services)

### "Python not found"
- Install Python 3: `brew install python3` (macOS) or `sudo apt install python3` (Ubuntu)
- Or use the manual environment variable method above

### Weather features not working
- Check browser console for errors
- Verify API keys are correct
- Check that location permissions are granted
- The app has fallback options for offline use

## 🧪 Testing

### Test Weather Integration
1. Click the weather button (sun icon)
2. Grant location permission when prompted
3. Verify temperature is populated automatically

### Test Local Sensors
1. Click the local temperature button (thermometer icon)
2. Grant sensor permissions if prompted
3. Verify local temperature is estimated

### Test Altitude Detection
1. The app should automatically detect nearby airports
2. Or use GPS altitude if no airports nearby
3. Manual altitude entry always works

## 📱 PWA Testing

The development server supports PWA features:
- Service worker registration
- Offline functionality
- Install prompts
- Full-screen mode

Test PWA features in Chrome DevTools > Application tab. 