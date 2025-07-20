// Configuration file for API keys and settings
const config = {
    // OpenWeatherMap API Key - load from environment variable or use fallback
    openWeatherMapApiKey: (() => {
        // Try to get from window.config (development server)
        if (typeof window !== 'undefined' && window.config && window.config.openWeatherMapApiKey) {
            return window.config.openWeatherMapApiKey;
        }
        
        // Try to get from environment variable (Node.js)
        if (typeof process !== 'undefined' && process.env.OPENWEATHER_API_KEY) {
            return process.env.OPENWEATHER_API_KEY;
        }
        
        // Fallback to a placeholder or null
        return 'your_openweathermap_api_key_here';
    })(),
    
    // WeatherAPI.com API Key - load from environment variable or use fallback
    weatherApiKey: (() => {
        // Try to get from window.config (development server)
        if (typeof window !== 'undefined' && window.config && window.config.weatherApiKey) {
            return window.config.weatherApiKey;
        }
        
        // Try to get from environment variable (Node.js)
        if (typeof process !== 'undefined' && process.env.WEATHERAPI_KEY) {
            return process.env.WEATHERAPI_KEY;
        }
        
        // Fallback to a placeholder or null
        return 'your_weatherapi_key_here';
    })(),
    
    // Weather API settings
    weatherSettings: {
        primaryApi: 'openweathermap', // 'openweathermap', 'wttr', 'weatherapi'
        fallbackApis: ['wttr', 'weatherapi'],
        timeout: 10000,
        retryAttempts: 2
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = config;
} 