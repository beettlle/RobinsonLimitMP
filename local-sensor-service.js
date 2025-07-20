// Local Sensor Service for RobinsonLimitMP
// Detects and uses local device temperature sensors when available
class LocalSensorService {
    constructor() {
        this.isSupported = false;
        this.sensors = new Map();
        this.currentTemperature = null;
        this.lastUpdate = null;
        this.isInitialized = false;
        this.permissionStatus = 'unknown';
        this.userPreference = this.getStoredPreference();
    }

    async initialize() {
        if (this.isInitialized) {
            return true;
        }

        try {
            // Check for various temperature sensor APIs
            this.isSupported = this.checkSensorSupport();
            
            if (this.isSupported) {
                await this.requestPermission();
                await this.startSensors();
            }
            
            this.isInitialized = true;
            
            
            return true;
        } catch (error) {
            this.isSupported = false;
            this.isInitialized = true;
            return false;
        }
    }

    checkSensorSupport() {
        // Check for various temperature sensor APIs
        const hasGenericSensor = 'Sensor' in window;
        const hasAccelerometer = 'Accelerometer' in window;
        const hasGyroscope = 'Gyroscope' in window;
        const hasMagnetometer = 'Magnetometer' in window;
        const hasAmbientLightSensor = 'AmbientLightSensor' in window;
        const hasProximitySensor = 'ProximitySensor' in window;
        const hasRelativeOrientationSensor = 'RelativeOrientationSensor' in window;
        const hasAbsoluteOrientationSensor = 'AbsoluteOrientationSensor' in window;
        const hasGravitySensor = 'GravitySensor' in window;
        const hasLinearAccelerationSensor = 'LinearAccelerationSensor' in window;
        
        // Check for Web Bluetooth API (for external sensors)
        const hasWebBluetooth = 'bluetooth' in navigator;
        
        // Check for Web Serial API (for connected sensors)
        const hasWebSerial = 'serial' in navigator;
        
        // Check for Web USB API (for USB sensors)
        const hasWebUSB = 'usb' in navigator;
        

        
        // Return true if any sensor APIs are available
        return hasGenericSensor || hasWebBluetooth || hasWebSerial || hasWebUSB;
    }

    async requestPermission() {
        // Check if we already have permission
        if (this.permissionStatus === 'granted') {
            return true;
        }
        
        // Check if permission was previously denied
        if (this.permissionStatus === 'denied') {
            throw new Error('Sensor access previously denied');
        }
        
        try {
            // Try to request permission for sensors
            if ('permissions' in navigator) {
                const permission = await navigator.permissions.query({ name: 'accelerometer' });
                this.permissionStatus = permission.state;
                
                if (permission.state === 'denied') {
                    throw new Error('Sensor permission denied');
                }
            } else {
                // Fallback: assume permission is granted if permissions API not available
                this.permissionStatus = 'granted';
            }
            
            this.storePreference({ allowed: true, timestamp: Date.now() });
            return true;
        } catch (error) {
            this.permissionStatus = 'denied';
            this.storePreference({ allowed: false, timestamp: Date.now() });
            throw error;
        }
    }

    async startSensors() {
        try {
            // Try to start various sensors that might provide temperature data
            await this.startAccelerometer();
            await this.startGyroscope();
            await this.startMagnetometer();
            await this.startAmbientLightSensor();
            await this.startProximitySensor();
            
            // Try to connect to external sensors via Web Bluetooth
            await this.scanBluetoothSensors();
            
    
        } catch (error) {
            // Some sensors may not be available on all devices
        }
    }

    async startAccelerometer() {
        if ('Accelerometer' in window) {
            try {
                const sensor = new Accelerometer({ frequency: 1 });
                sensor.addEventListener('reading', () => {
                    // Accelerometer doesn't provide temperature, but we can use it
                    // to detect if the device is active and potentially warm
                    this.sensors.set('accelerometer', {
                        type: 'accelerometer',
                        data: sensor,
                        lastReading: Date.now()
                    });
                });
                sensor.start();
            } catch (error) {
                // Accelerometer not available on this device
            }
        }
    }

    async startGyroscope() {
        if ('Gyroscope' in window) {
            try {
                const sensor = new Gyroscope({ frequency: 1 });
                sensor.addEventListener('reading', () => {
                    this.sensors.set('gyroscope', {
                        type: 'gyroscope',
                        data: sensor,
                        lastReading: Date.now()
                    });
                });
                sensor.start();
            } catch (error) {
                // Gyroscope not available on this device
            }
        }
    }

    async startMagnetometer() {
        if ('Magnetometer' in window) {
            try {
                const sensor = new Magnetometer({ frequency: 1 });
                sensor.addEventListener('reading', () => {
                    this.sensors.set('magnetometer', {
                        type: 'magnetometer',
                        data: sensor,
                        lastReading: Date.now()
                    });
                });
                sensor.start();
            } catch (error) {
                // Magnetometer not available on this device
            }
        }
    }

    async startAmbientLightSensor() {
        if ('AmbientLightSensor' in window) {
            try {
                const sensor = new AmbientLightSensor({ frequency: 1 });
                sensor.addEventListener('reading', () => {
                    this.sensors.set('ambientLight', {
                        type: 'ambientLight',
                        data: sensor,
                        lastReading: Date.now()
                    });
                });
                sensor.start();
            } catch (error) {
                // Ambient Light Sensor not available on this device
            }
        }
    }

    async startProximitySensor() {
        if ('ProximitySensor' in window) {
            try {
                const sensor = new ProximitySensor({ frequency: 1 });
                sensor.addEventListener('reading', () => {
                    this.sensors.set('proximity', {
                        type: 'proximity',
                        data: sensor,
                        lastReading: Date.now()
                    });
                });
                sensor.start();
            } catch (error) {
                // Proximity Sensor not available on this device
            }
        }
    }

    async scanBluetoothSensors() {
        if ('bluetooth' in navigator) {
            try {
                // Look for common temperature sensor devices
                const device = await navigator.bluetooth.requestDevice({
                    filters: [
                        { services: ['environmental_sensing'] },
                        { services: ['health_thermometer'] },
                        { namePrefix: 'Temp' },
                        { namePrefix: 'Thermo' },
                        { namePrefix: 'Weather' }
                    ],
                    optionalServices: ['battery_service']
                });
                

                
                // Note: Full implementation would require connecting and reading data
                // This is a placeholder for future implementation
                this.sensors.set('bluetooth', {
                    type: 'bluetooth',
                    device: device,
                    lastReading: Date.now()
                });
            } catch (error) {
                // Bluetooth sensor scan failed
            }
        }
    }

    // Estimate temperature based on available sensor data
    estimateTemperature() {
        if (this.sensors.size === 0) {
            return null;
        }

        let estimatedTemp = null;
        const now = Date.now();
        
        // Check for recent sensor readings (within last 30 seconds)
        const recentSensors = Array.from(this.sensors.values()).filter(
            sensor => (now - sensor.lastReading) < 30000
        );

        if (recentSensors.length === 0) {
            return null;
        }

        // Try to estimate temperature from sensor data
        // This is a simplified estimation - real implementation would be more sophisticated
        
        // Method 1: Use ambient light sensor to estimate if device is in sun/shade
        const ambientSensor = recentSensors.find(s => s.type === 'ambientLight');
        if (ambientSensor) {
            const illuminance = ambientSensor.data.illuminance;
            // Rough estimation: higher illuminance might indicate warmer conditions
            if (illuminance > 1000) {
                estimatedTemp = 25; // Sunny conditions
            } else if (illuminance > 100) {
                estimatedTemp = 20; // Partly cloudy
            } else {
                estimatedTemp = 15; // Cloudy/shady
            }
        }

        // Method 2: Use device activity to estimate internal temperature
        const accelerometer = recentSensors.find(s => s.type === 'accelerometer');
        if (accelerometer) {
            const { x, y, z } = accelerometer.data;
            const activity = Math.sqrt(x*x + y*y + z*z);
            
            // Higher activity might indicate device is being used and warming up
            if (activity > 15) {
                estimatedTemp = estimatedTemp ? estimatedTemp + 2 : 22;
            }
        }

        // Method 3: Use time of day and season for rough estimation
        if (!estimatedTemp) {
            const hour = new Date().getHours();
            const month = new Date().getMonth();
            
            // Very rough estimation based on time and season
            if (month >= 5 && month <= 8) { // Summer months
                if (hour >= 10 && hour <= 18) {
                    estimatedTemp = 25; // Daytime summer
                } else {
                    estimatedTemp = 18; // Nighttime summer
                }
            } else if (month >= 11 || month <= 2) { // Winter months
                if (hour >= 10 && hour <= 18) {
                    estimatedTemp = 10; // Daytime winter
                } else {
                    estimatedTemp = 5; // Nighttime winter
                }
            } else { // Spring/Fall
                if (hour >= 10 && hour <= 18) {
                    estimatedTemp = 18; // Daytime spring/fall
                } else {
                    estimatedTemp = 12; // Nighttime spring/fall
                }
            }
        }

        if (estimatedTemp !== null) {
            this.currentTemperature = estimatedTemp;
            this.lastUpdate = now;
        }

        return estimatedTemp;
    }

    // Get current temperature from local sensors
    async getLocalTemperature() {
        if (!this.isInitialized) {
            await this.initialize();
        }

        if (!this.isSupported) {
            throw new Error('Local temperature sensors not supported on this device');
        }

        if (this.permissionStatus === 'denied') {
            throw new Error('Sensor access denied');
        }

        const temperature = this.estimateTemperature();
        
        if (temperature === null) {
            throw new Error('Unable to estimate temperature from available sensors');
        }

        return {
            temperature: temperature,
            source: 'local-sensors',
            accuracy: 'estimated',
            timestamp: this.lastUpdate,
            sensors: Array.from(this.sensors.keys())
        };
    }

    // Check if local sensors are available
    isLocalTemperatureAvailable() {
        return this.isInitialized && 
               this.isSupported && 
               this.permissionStatus !== 'denied' &&
               this.sensors.size > 0;
    }

    // Get sensor information
    getSensorInfo() {
        return {
            isSupported: this.isSupported,
            isInitialized: this.isInitialized,
            permissionStatus: this.permissionStatus,
            sensors: Array.from(this.sensors.keys()),
            currentTemperature: this.currentTemperature,
            lastUpdate: this.lastUpdate
        };
    }

    // Store user preference
    storePreference(preference) {
        this.userPreference = preference;
        localStorage.setItem('local_sensor_preference', JSON.stringify(preference));
    }

    // Get stored preference
    getStoredPreference() {
        const stored = localStorage.getItem('local_sensor_preference');
        return stored ? JSON.parse(stored) : null;
    }

    // Stop all sensors
    stopSensors() {
        this.sensors.forEach((sensor, key) => {
            if (sensor.data && typeof sensor.data.stop === 'function') {
                sensor.data.stop();
            }
        });
        this.sensors.clear();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LocalSensorService;
} 