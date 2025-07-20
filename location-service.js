// Location Service for RobinsonLimitMP
class LocationService {
    constructor() {
        this.airportsData = null;
        this.userLocation = null;
        this.nearbyAirfield = null;
        this.locationPermission = this.getStoredPermission();
        this.isInitialized = false;
        this.onPermissionGranted = null; // Callback for when permission is granted
    }

    // Permission management
    getStoredPermission() {
        return localStorage.getItem('robinson_limit_mp_location_permission') || 'not-asked';
    }

    setStoredPermission(permission) {
        localStorage.setItem('robinson_limit_mp_location_permission', permission);
        this.locationPermission = permission;
    }

    async requestLocationPermission() {
        if (this.locationPermission === 'granted') {
            return true;
        }

        if (this.locationPermission === 'denied') {
            return false;
        }

        // Show permission dialog
        const granted = await this.showPermissionDialog();
        if (granted) {
            this.setStoredPermission('granted');
            // Notify callback if permission was granted
            if (this.onPermissionGranted) {
                this.onPermissionGranted();
            }
            return true;
        } else {
            this.setStoredPermission('denied');
            return false;
        }
    }

    async showPermissionDialog() {
        return new Promise((resolve) => {
            const dialog = document.createElement('div');
            dialog.className = 'location-permission-dialog';
            dialog.innerHTML = `
                <div class="permission-content">
                    <h3>Location Access</h3>
                    <p>This app can automatically detect your altitude by finding nearby airfields or using GPS.</p>
                    <p>Your location data is used only to find airfield elevations and is not stored or shared.</p>
                    <div class="permission-buttons">
                        <button class="permission-grant">Allow Location Access</button>
                        <button class="permission-deny">Not Now</button>
                    </div>
                </div>
            `;

            document.body.appendChild(dialog);

            dialog.querySelector('.permission-grant').addEventListener('click', () => {
                document.body.removeChild(dialog);
                resolve(true);
            });

            dialog.querySelector('.permission-deny').addEventListener('click', () => {
                document.body.removeChild(dialog);
                resolve(false);
            });
        });
    }

    // Initialization
    async initialize() {
        if (this.isInitialized) return;

        try {
            // Load airports data first
            await this.loadAirportsData();
            
            // Check location permission
            const hasPermission = await this.requestLocationPermission();
            if (hasPermission) {
                await this.getUserLocation();
                if (this.userLocation) {
                    this.nearbyAirfield = this.findNearbyAirfield();
                }
            }
            
            this.isInitialized = true;
        } catch (error) {
            // Location service initialization failed
            this.isInitialized = true; // Mark as initialized to prevent retries
        }
    }

    // Airports data loading from local file
    async loadAirportsData() {
        try {
            // Load from local JSON file
            this.airportsData = await this.loadFromLocalFile();
        } catch (error) {
            // Fallback to minimal static data
            this.airportsData = await this.loadFallbackData();
        }
    }

    async loadFromLocalFile() {
        try {
            const response = await fetch('./airports-data.json');
            if (!response.ok) {
                throw new Error(`Local file request failed: ${response.status}`);
            }
            
            const data = await response.json();
            return data.airports || [];
        } catch (error) {
            throw new Error(`Failed to load local airports data: ${error.message}`);
        }
    }

    async loadFallbackData() {
        // Minimal fallback dataset for when local file fails
        return [
            // Oregon Class C Airports (essential)
            { name: "Portland International Airport", icao: "KPDX", latitude: 45.5887, longitude: -122.5975, elevation_ft: 30 },
            { name: "Eugene Airport", icao: "KEUG", latitude: 44.1246, longitude: -123.2120, elevation_ft: 374 },
            { name: "Rogue Valley International Airport", icao: "KMFR", latitude: 42.3742, longitude: -122.8735, elevation_ft: 1335 },
            { name: "Roberts Field Airport", icao: "KRDM", latitude: 44.2541, longitude: -121.1500, elevation_ft: 3080 },
            { name: "Crater Lake-Klamath Regional Airport", icao: "KLMT", latitude: 42.1561, longitude: -121.7332, elevation_ft: 4095 },
            
            // Major US airports (essential)
            { name: "Los Angeles International Airport", icao: "KLAX", latitude: 33.9416, longitude: -118.4085, elevation_ft: 125 },
            { name: "O'Hare International Airport", icao: "KORD", latitude: 41.9786, longitude: -87.9048, elevation_ft: 672 },
            { name: "Denver International Airport", icao: "KDEN", latitude: 39.8561, longitude: -104.6737, elevation_ft: 5431 },
            { name: "Seattle-Tacoma International Airport", icao: "KSEA", latitude: 47.4502, longitude: -122.3088, elevation_ft: 433 },
            { name: "San Francisco International Airport", icao: "KSFO", latitude: 37.6189, longitude: -122.3750, elevation_ft: 13 },
        ];
    }



    // Location detection
    async getUserLocation() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation not supported'));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    this.userLocation = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        altitude: position.coords.altitude, // GPS altitude if available
                        accuracy: position.coords.accuracy,
                        altitudeAccuracy: position.coords.altitudeAccuracy // New: altitude accuracy
                    };
                    

                    
                    resolve(this.userLocation);
                },
                (error) => {
                    reject(error);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 300000 // 5 minutes
                }
            );
        });
    }

    // Airfield finding with regional filtering
    findNearbyAirfield(maxDistanceMiles = 10) {
        if (!this.userLocation || !this.airportsData) return null;

        // Filter airports by rough regional bounds first (performance optimization)
        const regionalAirports = this.filterByRegion(this.airportsData, this.userLocation);
        
        let closestAirfield = null;
        let closestDistance = maxDistanceMiles;

        for (const airport of regionalAirports) {
            const distance = this.calculateDistance(
                this.userLocation.latitude,
                this.userLocation.longitude,
                airport.latitude,
                airport.longitude
            );

            if (distance < closestDistance) {
                closestDistance = distance;
                closestAirfield = {
                    ...airport,
                    distance: distance
                };
            }
        }

        return closestAirfield;
    }

    filterByRegion(airports, userLocation) {
        // Rough regional filtering to reduce search space
        const latRange = 2; // ~120 miles latitude
        const lonRange = 2; // ~120 miles longitude (varies by latitude)
        
        return airports.filter(airport => {
            const latDiff = Math.abs(airport.latitude - userLocation.latitude);
            const lonDiff = Math.abs(airport.longitude - userLocation.longitude);
            
            return latDiff <= latRange && lonDiff <= lonRange;
        });
    }

    // Altitude recommendation
    getRecommendedAltitude() {
        if (this.nearbyAirfield) {
            return {
                altitude: this.nearbyAirfield.elevation_ft,
                source: 'airfield',
                airfieldName: this.nearbyAirfield.name,
                distance: this.nearbyAirfield.distance,
                icao: this.nearbyAirfield.icao,
                accuracy: 'high' // Airfield elevation is very accurate
            };
        } else if (this.userLocation?.altitude) {
            const gpsAltitudeFt = Math.round(this.userLocation.altitude * 3.28084);
            const altitudeAccuracyFt = this.userLocation.altitudeAccuracy ? 
                Math.round(this.userLocation.altitudeAccuracy * 3.28084) : null;
            
            return {
                altitude: gpsAltitudeFt,
                source: 'gps',
                airfieldName: null,
                distance: null,
                icao: null,
                accuracy: altitudeAccuracyFt ? 
                    (altitudeAccuracyFt < 50 ? 'high' : altitudeAccuracyFt < 200 ? 'medium' : 'low') : 'unknown',
                altitudeAccuracy: altitudeAccuracyFt
            };
        }
        return null;
    }

    // Utility functions
    calculateDistance(lat1, lon1, lat2, lon2) {
        // Haversine formula for distance calculation
        const R = 3959; // Earth's radius in miles
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    // Manual override handling
    setManualAltitude(altitude) {
        // Clear any auto-detected altitude when user manually enters one
        this.nearbyAirfield = null;
        this.userLocation = null;
    }

    // Status checking
    getStatus() {
        return {
            isInitialized: this.isInitialized,
            hasPermission: this.locationPermission === 'granted',
            hasLocation: !!this.userLocation,
            hasNearbyAirfield: !!this.nearbyAirfield,
            airportsDataLoaded: !!this.airportsData
        };
    }
} 