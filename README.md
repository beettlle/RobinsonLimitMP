# RobinsonLimitMP

A Progressive Web App (PWA) for calculating manifold pressure settings for R22 helicopter variants and hover performance for AS350-B3 helicopter based on altitude, temperature, and weight. This critical aviation safety tool provides real-time calculations and POH-accurate chart visualization.

## 🚁 Features

- **Real-time Calculation**: Instant manifold pressure calculation with interpolation
- **POH-Accurate Charts**: Visual representation matching Pilot Operating Handbook charts
- **Multiple Models**: Support for 8 helicopter variants:
  - R22 Standard / R22 (0-6000ft, 4 temp lines)
  - R22 HP / R22 Alpha (0-8000ft, 4 temp lines)
  - R22 Beta (0-8000ft, 4 temp lines) - 5-minute takeoff rating
  - R22 Beta II (0-8000ft, 7 temp lines) - MCP settings
  - R44 (0-6000ft, 8 temp lines) - Maximum Continuous Power (Max Takeoff: +1.6 IN.)
  - R44 II (0-12000ft, 8 temp lines) - Maximum Continuous Power (Max Takeoff: +2.8 IN.)
  - R44 Cadet (0-12000ft, 8 temp lines) - Maximum Continuous Power (Max Takeoff: +2.8 IN.)
  - **AS350-B3** (1200-2250kg, -40 to +40°C) - IGE Hover Ceiling Performance
- **Weather Integration**: Automatic temperature retrieval when location permission is granted
- **Automatic Altitude Detection**: 
  - **Priority 1**: Finds nearby airfields using location services (most accurate)
  - **Priority 2**: Falls back to GPS altitude if no airfield nearby
  - **Priority 3**: Manual override always available
  - Includes Oregon Class C airports and major US airports
  - GPS altitude accuracy indicators (high/medium/low)
- **Privacy-First**: User permission required, location data not stored
- **Offline Functionality**: Works without internet connection
- **Automatic Update Checking**: Detects and notifies users of new versions
- **iOS PWA Support**: Installable on iOS Safari home screen
- **Mobile-Responsive**: Optimized for mobile devices and touch interaction

## 📱 PWA Features

- **Installable**: Add to home screen on iOS and Android
- **Offline Support**: Service worker caches all resources
- **Fast Loading**: Optimized for < 3 second load times
- **Full Screen**: Standalone mode without browser UI
- **Touch Optimized**: Designed for mobile touch interaction

## 🛠️ Technical Details

### Data Structure
The app uses a hybrid approach for manifold pressure calculations:

**AS350-B3 IGE Hover Performance Model**:
- **Performance Type**: In-Ground Effect (IGE) Hover Ceiling calculation
- **Input Parameters**: Weight (kg) and Outside Air Temperature (°C)
- **Output**: Maximum hover ceiling in feet
- **Data Source**: Performance chart with known data points and bilinear interpolation
- **Flight Envelope**: Temperature-dependent weight limits (e.g., 20°C starts at 1650kg, 30°C starts at 1800kg)
- **Chart Visualization**: Weight vs. Hover Ceiling with temperature lines
- **Validation**: Returns error codes for invalid inputs or envelope violations

**Mathematical Equation Models**: The following models use mathematical equations instead of table interpolation for precise calculations:

**R22 Standard Model**:
- **General Equation**: MAP = m(T) × PA + c(T)
- **Temperature-Dependent Slope m(T)**:
  - T ≥ 20°C: m(T) = -0.20
  - 0°C ≤ T < 20°C: m(T) = -0.0025 × T - 0.15
  - T < 0°C: m(T) = -0.15
- **Temperature-Dependent Y-Intercept c(T)**:
  - T ≥ 20°C: c(T) = 0.015 × T + 25.1
  - T < 20°C: c(T) = 0.0275 × T + 24.55
- **Full Throttle Limit**: MAP_throttle = -0.75 × PA + 27.25
- **Final Result**: min(MAP_temp, MAP_throttle)

**R22 HP/Alpha Model**:
- **Scheduled Limit**: MAP = -0.275 × PA + 0.0295 × T + 23.08
- **Full Throttle Limit**: MAP_throttle = -0.875 × PA + 26.4
- **Final Result**: min(MAP_scheduled, MAP_throttle)

**R22 Beta Model** (5-Minute Takeoff Rating):
- **Scheduled Limit**: MAP = -0.25 × PA + (0.0325 × T + 24.0)
- **Full Throttle Limit**: MAP_throttle = -0.65 × PA + 26.0
- **Final Result**: min(MAP_scheduled, MAP_throttle)
- **Note**: For Maximum Continuous Power (MCP), subtract 1 inch from the calculated value

**Table-Based Models**: The following models use embedded static tables for interpolation:

```javascript
const helicopterData = {
    "BETA_II": {
        pressureAltitudesFeet: [0, 2000, 4000, 6000, 8000],
        oatCelsius: [-20, -10, 0, 10, 20, 30, 40],
        mpLimitsData: [/* POH-accurate data */]
    },
    "R44": {
        pressureAltitudesFeet: [0, 2000, 4000, 6000],
        oatCelsius: [-30, -20, -10, 0, 10, 20, 30, 40],
        mpLimitsData: [/* POH-accurate data */]
    },
    // ... other models
};
```

### Airports Data Processing
The app includes a comprehensive airports database processed from OurAirports data:

```javascript
// Processing pipeline:
// 1. Download airports.csv from OurAirports
// 2. Filter for US airports with valid coordinates and elevation
// 3. Include all Oregon airports + major US airports
// 4. Generate optimized JSON for web use
// 5. Cache locally for offline functionality
```

### Location Services
The app includes intelligent altitude detection:

```javascript
// Local airports database with 7,000+ US airports
const airports = [
    { name: "Portland International Airport", icao: "KPDX", elevation_ft: 30 },
    { name: "Eugene Airport", icao: "KEUG", elevation_ft: 374 },
    // ... 7,000+ more airports
];
```

- **Local Data**: Uses downloaded OurAirports data (7,000+ US airports)
- **Comprehensive Coverage**: All Oregon airports (500+) plus major US airports
- **Regional Filtering**: Optimizes search by filtering airports by region
- **Privacy Respectful**: Requires explicit user permission
- **Offline Ready**: All data cached locally for offline use

### Calculation Engine
- **AS350-B3**: IGE hover ceiling calculation using lookup table with bilinear interpolation and flight envelope validation
- **R22 Standard, HP/Alpha, and Beta**: Mathematical equation-based calculations for precise results
- **R22 Beta II, R44, R44 II, and R44 Cadet**: Real-time bilinear interpolation between data points
- Full throttle line handling with temperature-dependent limits
- Error validation and boundary checking
- Support for all temperature ranges (-20°C to +40°C for R22/R44, -40°C to +40°C for AS350-B3)
- Automatic fallback to "FT" (Full Throttle) when limits are exceeded
- Special handling for R22 Beta MCP calculations (chart value - 1 inch)
- Flight envelope validation for AS350-B3 with temperature-dependent weight limits

### Chart Visualization
- Chart.js integration for POH-accurate charts
- **AS350-B3**: Weight vs. Hover Ceiling chart with temperature lines (-40°C to +40°C), flight envelope boundaries, and real-time point plotting
- **R22 Standard, HP/Alpha, and Beta**: Smooth mathematical curves (100ft resolution)
- **R22 Beta II, R44, R44 II, and R44 Cadet**: Discrete data point interpolation
- Real-time point plotting with calculated values
- Temperature line visualization
- Full throttle line representation
- Special point display for R22 Beta MCP values
- Flight envelope visualization for AS350-B3 showing temperature-dependent weight limits

### Update Checking System
- Automatic version comparison on app startup
- Network-first strategy for version.js file
- User-friendly update notifications
- One-click update with cache clearing
- Graceful fallback for offline scenarios

## 🔐 Security & API Keys

### API Key Management
The app uses multiple weather APIs for reliable temperature data. To keep your API keys secure:

1. **Never commit API keys to version control**
2. **Use environment variables** for production deployments
3. **See setup guide**: `setup-api-keys.html` for detailed instructions

### Quick Setup
1. Get your API keys from [OpenWeatherMap](https://openweathermap.org/api) and/or [WeatherAPI.com](https://www.weatherapi.com/)
2. Set them as environment variables: 
   ```bash
   OPENWEATHER_API_KEY=your_key_here
   WEATHERAPI_KEY=your_key_here
   ```
3. Or use the setup page: `http://localhost:8000/setup-api-keys.html`

## 🚀 Installation & Usage

### Web App
1. Visit the live site: [https://username.github.io/RobinsonLimitMP](https://username.github.io/RobinsonLimitMP)
2. Select helicopter type
3. **For R22/R44 helicopters**:
   - Enter outside air temperature (°C) or use the weather button
   - Enter altitude (feet)
   - View calculated manifold pressure and chart
4. **For AS350-B3 helicopter**:
   - Enter weight (kg) between 1200-2250
   - Enter outside air temperature (°C) between -40 to +40
   - View calculated IGE hover ceiling and performance chart
5. View calculated results and interactive charts

### iOS Home Screen Installation
1. Open Safari on iOS device
2. Navigate to the app URL
3. Tap the Share button
4. Select "Add to Home Screen"
5. The app will appear as a native app icon

### Weather Integration
- One-time location permission request
- **Automatic weather fetching**: Temperature is automatically retrieved when location permission is granted
- Manual weather button available for refresh or when permission is denied
- Automatic temperature retrieval from multiple weather APIs
- Fallback support for offline usage
- User preference storage for permission choices

### Offline Usage
- The app works completely offline after first load
- All data is embedded in the application
- No internet connection required for calculations
- Weather feature gracefully degrades when offline

## 🏗️ Development

### Prerequisites
- Modern web browser
- Python 3 (for development server)
- Node.js (optional, for alternative development tools)

### Local Development

#### Option 1: Use the Development Server (Recommended)
1. Clone the repository:
   ```bash
   git clone https://github.com/username/RobinsonLimitMP.git
   cd RobinsonLimitMP
   ```

2. Start the development server:
   ```bash
   ./start-dev.sh
   ```
   
   This will:
   - Create a `.env` file from `.env.example` if it doesn't exist
   - Load environment variables from `.env`
   - Start a Python server with environment variable support
   - Serve the app at `http://localhost:8000`

3. Set up your API keys:
   ```bash
   # Edit the .env file with your API keys
   nano .env
   ```

#### Option 2: Manual Setup
1. Clone the repository and navigate to the directory
2. Set environment variables manually:
   ```bash
   export OPENWEATHER_API_KEY=your_openweathermap_api_key_here
   export WEATHERAPI_KEY=your_weatherapi_key_here
   ```
3. Serve the files using a local web server:
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js
   npx serve .
   ```
4. Open `http://localhost:8000` in your browser

### PWA Testing
- Use Chrome DevTools > Application tab to test service worker
- Use Lighthouse to audit PWA features
- Test offline functionality by disabling network
- Test iOS installation on Safari

### Location Service Testing
- Test permission flow and altitude detection in the main app
- Verify Oregon Class C airports are detected correctly
- Test fallback to GPS altitude when no airfield nearby
- Check GPS altitude capability and accuracy on your device

### Updating Airports Data
To update the airports database with the latest data from OurAirports, you can:
1. Download the latest airports.csv from https://davidmegginson.github.io/ourairports-data/airports.csv
2. Process it using a CSV parser to extract US airports with valid coordinates and elevation
3. Generate a new airports-data.json file with the same structure as the current one

## 📊 PWA Audit Results

The app is designed to achieve:
- **Lighthouse PWA Score**: 90+
- **Performance Score**: 90+
- **Accessibility Score**: 90+
- **Best Practices Score**: 90+
- **SEO Score**: 90+

## 🔧 Configuration

### Service Worker
- Caches static assets for offline use
- Implements cache-first strategy for app files
- Network-first strategy for external resources
- Automatic cache cleanup on updates

### Manifest Configuration
- Standalone display mode
- Portrait orientation
- Aviation-themed icons
- Proper app metadata

### iOS Optimization
- Apple-specific meta tags
- Touch icon configuration
- Status bar styling
- Full-screen capability

## 🚨 Safety Notice

This application is designed as a reference tool for Robinson helicopter pilots. Always:
- Verify calculations against your aircraft's POH
- Use current weather conditions
- Follow proper preflight procedures
- Consult with qualified instructors for training

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 🔄 Version Management

### Automated Version Bumping
The project uses automated version management through GitHub Actions:

- **Auto Version Bump**: Automatically increments patch version on every push to main
- **Version Consistency**: Ensures `version.js` and `service-worker.js` stay in sync
- **Update Detection**: Clients automatically detect and prompt for updates
- **Cache Management**: Service worker cache names include version numbers

### Manual Version Management
For manual version control, use the provided script:

```bash
# Bump patch version (default)
./scripts/bump-version.sh

# Bump minor version
./scripts/bump-version.sh minor

# Bump major version
./scripts/bump-version.sh major
```

### Version Files
- `version.js`: Contains the current app version
- `service-worker.js`: Cache names include version numbers
- `manifest.json`: PWA manifest (version independent)

### Skip Version Bump
To skip automatic version bumping, include `[skip version]` in your commit message:

```bash
git commit -m "Your commit message [skip version]"
```

## 🔄 Version History

- **v1.5.0**: AS350-B3 Helicopter Support
  - Added AS350-B3 IGE Hover Ceiling performance calculations
  - Implemented weight vs. hover ceiling chart visualization
  - Added flight envelope validation with temperature-dependent weight limits
  - Enhanced UI to support both manifold pressure and hover performance calculations
  - Added real-time point plotting for AS350-B3 performance chart
  - Updated documentation and technical specifications

- **v1.4.1**: Automated version management system
  - Added GitHub Actions workflow for automatic version bumping
  - Implemented version consistency validation in deployment
  - Created manual version management script (`scripts/bump-version.sh`)
  - Enhanced documentation for version management processes
  - Ensures clients automatically detect and prompt for updates

- **v1.4.0**: Enhanced development workflow
  - Added development server with environment variable support
  - Improved API key management
  - Added multiple weather API support
  - Enhanced error handling and fallback mechanisms

- **v1.1.0**: Weather integration update
  - Added automatic temperature retrieval
  - Location permission handling
  - Multiple weather API support
  - User preference storage
  - Graceful offline degradation

- **v1.0.0**: Initial release with PWA functionality
  - Complete calculation engine
  - POH-accurate charts
  - Offline support
  - iOS PWA installation
  - GitHub Pages deployment

---

**Disclaimer**: This tool is for educational and reference purposes. Always consult your aircraft's POH and follow proper aviation procedures. 