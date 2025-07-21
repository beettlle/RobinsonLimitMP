// Weather Service for RobinsonLimitMP
class WeatherService {
    constructor() {
        this.weatherApiKey = window.config?.weatherApiKey || null;
        this.permissionStatus = 'unknown';
        this.userPreference = this.getStoredPreference();
        this.isInitialized = false;
        this.localSensorService = null;
    }

    // Initialize the weather service
    async initialize() {
        if (this.isInitialized) return true;
        
        // Initialize local sensor service
        try {
            this.localSensorService = new LocalSensorService();
            await this.localSensorService.initialize();
    
        } catch (error) {

        }
        
        // Check if geolocation is supported
        if (!navigator.geolocation) {
    
            this.isInitialized = true;
            return false;
        }

        // Check current permission status
        this.permissionStatus = await this.checkPermissionStatus();

        
        this.isInitialized = true;
        return true;
    }

    // Check current geolocation permission status
    async checkPermissionStatus() {
        if (!navigator.permissions) {
    
            return 'prompt';
        }

        try {
            const permission = await navigator.permissions.query({ name: 'geolocation' });
    
            return permission.state;
        } catch (error) {
    
            return 'prompt';
        }
    }

    // Get stored user preference for weather access
    getStoredPreference() {
        try {
            const stored = localStorage.getItem('r22_weather_preference');
            return stored ? JSON.parse(stored) : null;
        } catch (error) {
            return null;
        }
    }

    // Store user preference for weather access
    storePreference(preference) {
        try {
            localStorage.setItem('r22_weather_preference', JSON.stringify(preference));
            this.userPreference = preference;
        } catch (error) {
            // Failed to store preference
        }
    }

    // Request location permission and get current weather
    async requestWeatherAccess() {
        if (!this.isInitialized) {
            await this.initialize();
        }

        // If user has already denied permission, don't ask again
        if (this.permissionStatus === 'denied') {
            throw new Error('Location access denied. Please enable location access in your browser settings.');
        }

        // If user has already granted permission, get weather directly
        if (this.permissionStatus === 'granted') {
            return await this.getCurrentWeather();
        }

        // Request permission (this will trigger the browser's permission prompt)
        try {
            const position = await this.getCurrentPosition();
            this.permissionStatus = 'granted';
            this.storePreference({ allowed: true, timestamp: Date.now() });
            return await this.getWeatherFromPosition(position);
        } catch (error) {
            // Check if it's a permission error
            if (error.code === 1) { // PERMISSION_DENIED
                this.permissionStatus = 'denied';
                this.storePreference({ allowed: false, timestamp: Date.now() });
                throw new Error('Location access denied. Please enable location access in your browser settings.');
            } else if (error.code === 2) { // POSITION_UNAVAILABLE
                throw new Error('Location information is unavailable. Please check your device settings.');
            } else if (error.code === 3) { // TIMEOUT
                throw new Error('Location request timed out. Please try again.');
            } else {
                throw new Error('Unable to get location. Please try again.');
            }
        }
    }

    // Get current position with timeout
    getCurrentPosition() {
        return new Promise((resolve, reject) => {
            const options = {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 300000 // 5 minutes
            };

            navigator.geolocation.getCurrentPosition(resolve, reject, options);
        });
    }

    // Get weather from position coordinates
    async getWeatherFromPosition(position) {
        const { latitude, longitude } = position.coords;
        
        // Try multiple weather APIs in order of preference
        const apis = [
            () => this.getWeatherFromOpenWeatherMap(latitude, longitude),
            () => this.getWeatherFromWeatherAPI(latitude, longitude),
            () => this.getWeatherFromWttrIn(latitude, longitude)
        ];

        for (const api of apis) {
            try {
                const weather = await api();
                if (weather && weather.temperature !== null) {
                    return weather;
                }
            } catch (error) {
    
                continue;
            }
        }

        // Try local sensors as final fallback
        try {
            if (this.localSensorService && this.localSensorService.isLocalTemperatureAvailable()) {
                const localWeather = await this.localSensorService.getLocalTemperature();
        
                return localWeather;
            }
        } catch (error) {
    
        }

        throw new Error('Unable to fetch weather data from available services');
    }

    // Get current weather (uses stored preference)
    async getCurrentWeather() {
        if (!this.userPreference || !this.userPreference.allowed) {
            throw new Error('Weather access not permitted');
        }

        const position = await this.getCurrentPosition();
        return await this.getWeatherFromPosition(position);
    }

    // Get local temperature from device sensors (no location required)
    async getLocalTemperature() {
        if (!this.isInitialized) {
            await this.initialize();
        }

        if (!this.localSensorService) {
            throw new Error('Local sensor service not available');
        }

        if (!this.localSensorService.isLocalTemperatureAvailable()) {
            throw new Error('Local temperature sensors not available on this device');
        }

        return await this.localSensorService.getLocalTemperature();
    }

    // Check if local temperature is available
    isLocalTemperatureAvailable() {
        return this.localSensorService && this.localSensorService.isLocalTemperatureAvailable();
    }

    // OpenWeatherMap API (free tier)
    async getWeatherFromOpenWeatherMap(latitude, longitude) {
        // Get API key from config or use fallback
        const apiKey = window.config?.openWeatherMapApiKey;
        
        if (!apiKey || apiKey === 'your_openweathermap_api_key_here') {
            throw new Error('OpenWeatherMap API key not configured');
        }
        
        // Use corsproxy.io to bypass CORS
        const url = `https://corsproxy.io/?https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${apiKey}`;
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`OpenWeatherMap API error: ${response.status}`);
        }

        const data = await response.json();
        
        return {
            temperature: data.main.temp,
            description: data.weather[0].description,
            humidity: data.main.humidity,
            pressure: data.main.pressure,
            source: 'OpenWeatherMap'
        };
    }

    // WeatherAPI.com (free tier)
    async getWeatherFromWeatherAPI(latitude, longitude) {
        if (!this.weatherApiKey || this.weatherApiKey === 'your_weatherapi_key_here') {
            throw new Error('WeatherAPI.com API key not configured');
        }
        // Use corsproxy.io to bypass CORS
        const url = `https://corsproxy.io/?https://api.weatherapi.com/v1/current.json?key=${this.weatherApiKey}&q=${latitude},${longitude}&aqi=no`;
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`WeatherAPI error: ${response.status}`);
        }

        const data = await response.json();
        return {
            temperature: data.current.temp_c,
            description: data.current.condition.text,
            humidity: data.current.humidity,
            pressure: data.current.pressure_mb,
            source: 'WeatherAPI'
        };
    }

    // wttr.in (no API key required, but less reliable)
    async getWeatherFromWttrIn(latitude, longitude) {
        const url = `https://wttr.in/?format=j1&lat=${latitude}&lon=${longitude}`;
        

        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`wttr.in API error: ${response.status}`);
        }

        const data = await response.json();

        
        const current = data.current_condition[0];
        
        return {
            temperature: parseFloat(current.temp_C),
            description: current.weatherDesc[0].value,
            humidity: parseInt(current.humidity),
            pressure: parseInt(current.pressure),
            source: 'wttr.in'
        };
    }

    // Check if weather access is available
    isWeatherAvailable() {
        // Check each condition explicitly
        const isInitialized = this.isInitialized;
        const hasGeolocation = !!navigator.geolocation;
        const permissionGranted = this.permissionStatus === 'granted';
        const permissionPrompt = this.permissionStatus === 'prompt';
        const userAllowed = this.userPreference && this.userPreference.allowed;
        
        const result = isInitialized && 
                      hasGeolocation && 
                      (permissionGranted || permissionPrompt || userAllowed);
        
        return result;
    }

    // Reset user preference (for testing or user choice changes)
    resetPreference() {
        this.storePreference(null);
        this.permissionStatus = 'unknown';
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WeatherService;
} 