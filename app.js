// RobinsonLimitMP

// Single source of truth for helicopter data
// 'null' in mpLimitsData indicates "Full Throttle" (FT)
// Note: STANDARD, HP_ALPHA, and BETA models now use mathematical equations
const HELICOPTER_DATA = {
    "BETA_II": {
        pressureAltitudesFeet: [0, 2000, 4000, 6000, 8000],
        oatCelsius: [-20, -10, 0, 10, 20, 30, 40],
        // Extracted from POH R22 Beta II table (O-360-J2A Engine)
        mpLimitsData: [
            [21.5, 21.8, 22.1, 22.3, 22.6, 22.9, 23.2], // SL (0)
            [21.1, 21.4, 21.6, 21.9, 22.2, 22.5, 22.8], // 2000
            [20.7, 21.0, 21.2, 21.5, 21.8, 22.0, 22.3], // 4000
            [20.3, 20.6, 20.8, 21.1, 21.3, 21.6, 21.9], // 6000
            [19.9, 20.2, 20.4, 20.7, 20.9, null, null]  // 8000 (FT at 30C, 40C)
        ]
    },
    "R44": { // Robinson R44 Limit Manifold Pressure - MAXIMUM CONTINUOUS POWER
        // For MAX TAKEOFF POWER (5 MIN), ADD 1.6 IN.
        pressureAltitudesFeet: [0, 2000, 4000, 6000],
        oatCelsius: [-30, -20, -10, 0, 10, 20, 30, 40],
        mpLimitsData: [
            [22.6, 22.9, 23.2, 23.5, 23.8, 24.1, 24.4, 24.7], // SL (0 ft)
            [22.2, 22.5, 22.8, 23.1, 23.4, 23.7, 24.0, 24.2], // 2000 ft
            [21.8, 22.2, 22.5, 22.8, 23.1, 23.4, 23.7, 23.9], // 4000 ft
            [21.4, 21.8, 22.1, null, null, null, null, null]  // 6000 ft (FT from 0C onwards)
        ]
    },
    "R44_II": { // Robinson R44 II Limit Manifold Pressure - MAXIMUM CONTINUOUS POWER
        // For MAX TAKEOFF POWER (5 MIN), ADD 2.8 IN.
        pressureAltitudesFeet: [0, 2000, 4000, 6000, 8000, 10000, 12000],
        oatCelsius: [-30, -20, -10, 0, 10, 20, 30, 40],
        mpLimitsData: [
            [21.5, 21.8, 22.1, 22.4, 22.6, 22.9, 23.1, 23.3], // SL (0 ft)
            [20.9, 21.2, 21.5, 21.8, 22.1, 22.3, 22.5, 22.8], // 2000 ft
            [20.4, 20.7, 21.0, 21.3, 21.5, 21.8, 22.0, 22.2], // 4000 ft
            [19.9, 20.2, 20.5, 20.8, 21.0, 21.3, 21.5, 21.7], // 6000 ft
            [19.5, 19.8, 20.1, 20.3, 20.6, 20.8, 21.0, 21.3], // 8000 ft
            [19.1, 19.4, 19.6, 19.9, null, null, null, null], // 10000 ft (FT from 10C onwards)
            [null, null, null, null, null, null, null, null]  // 12000 ft (All FT)
        ]
    },
    "R44_CADET": { // Robinson R44 Cadet Limit Manifold Pressure - MAXIMUM CONTINUOUS POWER
        // For MAX TAKEOFF POWER (5 MIN), ADD 2.8 IN. (Same as R44 II, verify from POH)
        pressureAltitudesFeet: [0, 2000, 4000, 6000, 8000, 10000, 12000],
        oatCelsius: [-30, -20, -10, 0, 10, 20, 30, 40],
        mpLimitsData: [
            [21.5, 21.8, 22.1, 22.4, 22.6, 22.9, 23.1, 23.3], // SL (0 ft)
            [20.9, 21.2, 21.5, 21.8, 22.1, 22.3, 22.5, 22.8], // 2000 ft
            [20.4, 20.7, 21.0, 21.3, 21.5, 21.8, 22.0, 22.2], // 4000 ft
            [19.9, 20.2, 20.5, 20.8, 21.0, 21.3, 21.5, 21.7], // 6000 ft
            [19.5, 19.8, 20.1, 20.3, 20.6, 20.8, 21.0, 21.3], // 8000 ft
            [19.1, 19.4, 19.6, 19.9, null, null, null, null], // 10000 ft (FT from 10C onwards)
            [null, null, null, null, null, null, null, null]  // 12000 ft (All FT)
        ]
    }
};

/**
 * Calculates the R22 HP/Alpha Limit Manifold Pressure using mathematical equations.
 *
 * @param {number} pressureAltitudeFeet - The pressure altitude in feet.
 * @param {number} temperatureCelsius - The outside air temperature in degrees Celsius.
 * @returns {number|string} The limit manifold pressure, or "FT" for Full Throttle.
 */
function calculateR22HpAlphaManifoldPressure(pressureAltitudeFeet, temperatureCelsius) {
    const altKft = pressureAltitudeFeet / 1000;

    // Equation for the scheduled limit pressure
    const scheduledLimit = -0.275 * altKft + 0.0295 * temperatureCelsius + 23.08;

    // Equation for the full throttle limit based on user's visual inspection
    const fullThrottleLimit = -0.875 * altKft + 26.4;

    // The actual limit is the lesser of the two values
    const finalMAP = Math.min(scheduledLimit, fullThrottleLimit);

    // If the calculated value is nonsensical or too low, it implies Full Throttle.
    if (finalMAP <= 0 || finalMAP > 30) { 
        return "FT";
    }

    return parseFloat(finalMAP.toFixed(2));
}

/**
 * Calculates the R22 Beta Limit Manifold Pressure using mathematical equations.
 * This is for the 5-Minute Takeoff Rating. For MCP, subtract 1 inch.
 *
 * @param {number} pressureAltitudeFeet - The pressure altitude in feet.
 * @param {number} temperatureCelsius - The outside air temperature in degrees Celsius.
 * @returns {number|string} The limit manifold pressure, or "FT" for Full Throttle.
 */
function calculateR22BetaManifoldPressure(pressureAltitudeFeet, temperatureCelsius) {
    const altKft = pressureAltitudeFeet / 1000;

    // Linear regression on y-intercepts: b = 0.0325 * T + 24.0
    const scheduledLimit = -0.25 * altKft + (0.0325 * temperatureCelsius + 24.0);

    // Full throttle line equation
    const fullThrottleLimit = -0.65 * altKft + 26.0;

    // The actual limit is the lesser of the two values
    const finalMAP = Math.min(scheduledLimit, fullThrottleLimit);

    if (finalMAP <= 0 || finalMAP > 30) {
        return "FT";
    }

    return parseFloat(finalMAP.toFixed(2));
}

class RobinsonLimitMP {
    constructor() {
        this.currentChart = null;
        this.weatherService = new WeatherService();
        this.locationService = new LocationService();
        
        // Set up callback for when location permission is granted
        this.locationService.onPermissionGranted = () => {
            this.autoFetchWeather();
        };
        
        this.initializeElements();
        this.setupEventListeners();
        this.initializeVersion();
        this.loadSavedHelicopter();
        this.initializeWeather();
        this.initializeLocation();
        this.checkForUpdates();
        this.calculateHp();
        this.togglePerformanceInputs();
    }

    initializeElements() {
        this.elements = {
            helicopterSelect: document.getElementById('helicopter-type'),
            temperatureInput: document.getElementById('temperature'),
            altitudeInput: document.getElementById('altitude'),
            calculatedPressure: document.getElementById('calculated-pressure'),
            chartContainer: document.getElementById('pressure-chart'),
            chartPlaceholder: document.getElementById('chart-placeholder'),
            errorMessage: document.getElementById('error-message'),
            weatherBtn: document.getElementById('get-weather-btn'),
            localTempBtn: document.getElementById('get-local-temp-btn'),
            weatherStatus: document.getElementById('weather-status'),
            weightInput: document.getElementById('weight'),
            oatInput: document.getElementById('oat'),
            hpResult: document.getElementById('hp-result')
        };
    }

    setupEventListeners() {
        // Real-time calculation on input changes
        this.elements.helicopterSelect.addEventListener('change', () => {
            this.saveHelicopterSelection();
            this.initializeChart();
            this.calculate();
            this.togglePerformanceInputs();
        });
        this.elements.temperatureInput.addEventListener('input', () => this.calculate());
        this.elements.altitudeInput.addEventListener('input', () => {
            // Clear location-based altitude when user manually enters altitude
            if (this.elements.altitudeInput.value) {
                this.locationService.setManualAltitude(parseFloat(this.elements.altitudeInput.value));
                this.hideLocationInfo();
            }
            this.calculate();
        });

        this.elements.weightInput.addEventListener('input', () => this.calculateHp());
        this.elements.oatInput.addEventListener('input', () => this.calculateHp());

        // Weather button event listener
        this.elements.weatherBtn.addEventListener('click', () => this.handleWeatherRequest());

        // Local temperature button event listener
        this.elements.localTempBtn.addEventListener('click', () => this.handleLocalTemperatureRequest());

        // Debounce for better performance
        this.debounceCalculate = this.debounce(() => this.calculate(), 300);
    }

    togglePerformanceInputs() {
        const selectedHelicopter = this.elements.helicopterSelect.value;
        const performanceInputs = [
            this.elements.weightInput.parentElement,
            this.elements.oatInput.parentElement,
            this.elements.hpResult
        ];
        const manifoldPressureInputs = [
            this.elements.temperatureInput.parentElement.parentElement,
            this.elements.altitudeInput.parentElement,
            this.elements.calculatedPressure
        ];

        if (selectedHelicopter === 'as350') {
            performanceInputs.forEach(el => el.style.display = 'block');
            manifoldPressureInputs.forEach(el => el.style.display = 'none');
        } else {
            performanceInputs.forEach(el => el.style.display = 'none');
            manifoldPressureInputs.forEach(el => el.style.display = 'block');
        }
    }

    calculate() {
        const helicopter = this.elements.helicopterSelect.value;
        const temperature = parseFloat(this.elements.temperatureInput.value);
        const altitude = parseFloat(this.elements.altitudeInput.value);

        // Validate inputs
        if (!this.validateInputs(helicopter, temperature, altitude)) {
            return;
        }

        try {
            // Convert helicopter type to the format expected by getLimitManifoldPressure
            const modelType = this.convertHelicopterType(helicopter);
            const pressure = getLimitManifoldPressure(modelType, altitude, temperature);

            this.displayResult(pressure);
            this.updateChartPoint(altitude, temperature, pressure);
        } catch (error) {
    
            this.showError(error.message || 'Error calculating manifold pressure. Please check your inputs.');
        }
    }

    calculateHp() {
      const weight = parseInt(this.elements.weightInput.value, 10);
      const oat = parseInt(this.elements.oatInput.value, 10);
  
      if (isNaN(weight) || isNaN(oat)) {
        this.elements.hpResult.textContent = '';
        return;
      }
  
      const hp = getHp(weight, oat);
      
      if (hp === -1) {
        this.elements.hpResult.textContent = 'Invalid input - Check weight (1200-2250kg) and temperature (-40 to 40°C)';
        this.elements.hpResult.style.color = '#ff3b30';
      } else if (hp === -2) {
        this.elements.hpResult.textContent = 'Cannot hover - Weight/temperature combination outside flight envelope';
        this.elements.hpResult.style.color = '#ff9500';
      } else if (hp === 0) {
        this.elements.hpResult.textContent = 'No data available for this combination';
        this.elements.hpResult.style.color = '#ff3b30';
      } else {
        this.elements.hpResult.textContent = `IGE Hover Ceiling: ${hp.toFixed(1)} ft`;
        this.elements.hpResult.style.color = '#34c759';
        
        // Update chart point for AS350
        if (this.elements.helicopterSelect.value === 'as350' && this.currentChart) {
          this.updateChartPoint(0, 0, 0); // Dummy values, actual values are handled in updateChartPoint
        }
      }
    }

    convertHelicopterType(helicopterType) {
        const typeMap = {
            'r22_standard': 'STANDARD',
            'r22_hp_alpha': 'HP_ALPHA',
            'r22_beta': 'BETA',
            'r22_beta_ii': 'BETA_II',
            'r44': 'R44',
            'r44_ii': 'R44_II',
            'r44_cadet': 'R44_CADET',
            'as350': 'AS350-B3'
        };
        return typeMap[helicopterType] || helicopterType;
    }

    validateInputs(helicopter, temperature, altitude) {
        if (!helicopter) {
            this.displayResult('Select helicopter type');
            return false;
        }

        if (isNaN(temperature) || temperature < -50 || temperature > 50) {
            this.displayResult('Enter valid temperature (-50°C to 50°C)');
            return false;
        }

        // Check altitude limits based on helicopter type
        const maxAltitudes = {
            'r22_standard': 6000,
            'r22_hp_alpha': 8000,
            'r22_beta': 8000,
            'r22_beta_ii': 8000,
            'r44': 6000,
            'r44_ii': 12000,
            'r44_cadet': 12000
        };
        
        const maxAltitude = maxAltitudes[helicopter] || 8000;
        if (isNaN(altitude) || altitude < 0 || altitude > maxAltitude) {
            this.displayResult(`Enter valid altitude (0-${maxAltitude} feet)`);
            return false;
        }

        return true;
    }

    displayResult(pressure) {
        const element = this.elements.calculatedPressure;
        const helicopter = this.elements.helicopterSelect.value;
        
        if (typeof pressure === 'number') {
            if (helicopter === 'r22_beta') {
                // For R22 Beta, show both chart value and MCP value
                const mcpValue = pressure - 1;
                element.textContent = `${pressure.toFixed(1)} IN. HG (Max Cont Press: ${mcpValue.toFixed(1)} IN. HG)`;
            } else if (helicopter === 'r44') {
                // For R44, show both chart value and Max Takeoff Power value
                const maxTakeoffValue = pressure + 1.6;
                element.textContent = `${pressure.toFixed(1)} IN. HG (Max Takeoff: ${maxTakeoffValue.toFixed(1)} IN. HG)`;
            } else if (helicopter === 'r44_ii' || helicopter === 'r44_cadet') {
                // For R44 II and R44 Cadet, show both chart value and Max Takeoff Power value
                const maxTakeoffValue = pressure + 2.8;
                element.textContent = `${pressure.toFixed(1)} IN. HG (Max Takeoff: ${maxTakeoffValue.toFixed(1)} IN. HG)`;
            } else {
                element.textContent = `${pressure.toFixed(1)} IN. HG`;
            }
            element.classList.add('has-value');
        } else if (pressure === 'FT') {
            if (helicopter === 'r22_beta') {
                element.textContent = 'FT (Full Throttle) - Max Cont Press: FT';
            } else if (helicopter === 'r44') {
                element.textContent = 'FT (Full Throttle) - Max Takeoff: FT';
            } else if (helicopter === 'r44_ii' || helicopter === 'r44_cadet') {
                element.textContent = 'FT (Full Throttle) - Max Takeoff: FT';
            } else {
                element.textContent = 'FT (Full Throttle)';
            }
            element.classList.add('has-value');
        } else {
            element.textContent = pressure || 'Calculated manifold pressure';
            element.classList.remove('has-value');
        }
    }

    initializeChart() {
        const helicopter = this.elements.helicopterSelect.value;
        if (!helicopter) {
            this.showPlaceholder();
            return;
        }

        const modelType = this.convertHelicopterType(helicopter);
        const chartData = this.generateChartData(modelType);
        
        if (this.currentChart) {
            this.currentChart.destroy();
        }

        this.createChart(chartData, modelType);
    }

    generateChartData(modelType) {
        // Special handling for AS350-B3 using performance data
        if (modelType === "AS350-B3") {
            return this.generateAS350ChartData();
        }
        
        // Special handling for R22 Standard using mathematical equations
        if (modelType === "STANDARD") {
            return this.generateR22StandardChartData();
        }
        
        // Special handling for R22 HP/Alpha using mathematical equations
        if (modelType === "HP_ALPHA") {
            return this.generateR22HpAlphaChartData();
        }

        // Special handling for R22 Beta using mathematical equations
        if (modelType === "BETA") {
            return this.generateR22BetaChartData();
        }
        
        // Use the global helicopter data for other models
        const data = HELICOPTER_DATA[modelType];
        if (!data) return null;

        // Generate datasets for each temperature line
        const datasets = [];
        const colors = ['#007AFF', '#34C759', '#FF9500', '#FF3B30', '#AF52DE', '#5856D6', '#FF2D92'];

        data.oatCelsius.forEach((temp, tempIndex) => {
            const points = [];
            data.pressureAltitudesFeet.forEach((alt, altIndex) => {
                const mpValue = data.mpLimitsData[altIndex][tempIndex];
                if (mpValue !== null) {
                    points.push({
                        x: alt,
                        y: mpValue
                    });
                }
            });

            if (points.length > 0) {
                datasets.push({
                    label: `${temp}°C`,
                    data: points,
                    borderColor: colors[tempIndex % colors.length],
                    backgroundColor: colors[tempIndex % colors.length],
                    borderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    fill: false,
                    tension: 0.1
                });
            }
        });

        return {
            datasets: datasets,
            altitudes: data.pressureAltitudesFeet,
            temperatures: data.oatCelsius
        };
    }

    generateAS350ChartData() {
        // Generate chart data for AS350 using performance data
        const temperatures = [-40, -30, -20, -10, 0, 10, 20, 30, 40];
        const weights = [];
        
        // Generate weight points from 1200 to 2250 kg in 50-kg increments
        for (let weight = 1200; weight <= 2250; weight += 50) {
            weights.push(weight);
        }
        
        const datasets = [];
        const colors = ['#007AFF', '#34C759', '#FF9500', '#FF3B30', '#AF52DE', '#5856D6', '#FF2D92', '#FF6B35', '#4ECDC4'];

        temperatures.forEach((temp, tempIndex) => {
            const points = [];
            
            weights.forEach(weight => {
                const hp = getHp(weight, temp);
                if (hp > 0) { // Only include valid hover ceiling values
                    points.push({
                        x: weight,
                        y: hp
                    });
                }
            });

            if (points.length > 0) {
                datasets.push({
                    label: `${temp}°C`,
                    data: points,
                    borderColor: colors[tempIndex % colors.length],
                    backgroundColor: colors[tempIndex % colors.length],
                    borderWidth: 2,
                    pointRadius: 0, // No points for smooth lines
                    pointHoverRadius: 6,
                    fill: false,
                    tension: 0.1
                });
            }
        });

        return {
            datasets: datasets,
            weights: weights,
            temperatures: temperatures
        };
    }

    generateR22StandardChartData() {
        // Generate chart data for R22 Standard using mathematical equations
        const temperatures = [-20, 0, 20, 40];
        const altitudes = [];
        
        // Generate altitude points from 0 to 6000 feet in 100-foot increments
        for (let alt = 0; alt <= 6000; alt += 100) {
            altitudes.push(alt);
        }
        
        const datasets = [];
        const colors = ['#007AFF', '#34C759', '#FF9500', '#FF3B30'];

        temperatures.forEach((temp, tempIndex) => {
            const points = [];
            
            altitudes.forEach(alt => {
                const mpValue = calculateR22StandardManifoldPressure(alt, temp);
                if (typeof mpValue === 'number') {
                    points.push({
                        x: alt,
                        y: mpValue
                    });
                }
            });

            if (points.length > 0) {
                datasets.push({
                    label: `${temp}°C`,
                    data: points,
                    borderColor: colors[tempIndex % colors.length],
                    backgroundColor: colors[tempIndex % colors.length],
                    borderWidth: 2,
                    pointRadius: 0, // No points for smooth lines
                    pointHoverRadius: 6,
                    fill: false,
                    tension: 0.1
                });
            }
        });

        return {
            datasets: datasets,
            altitudes: altitudes,
            temperatures: temperatures
        };
    }

    generateR22HpAlphaChartData() {
        // Generate chart data for R22 HP/Alpha using mathematical equations
        const temperatures = [-20, 0, 20, 40];
        const altitudes = [];
        
        // Generate altitude points from 0 to 8000 feet in 100-foot increments
        for (let alt = 0; alt <= 8000; alt += 100) {
            altitudes.push(alt);
        }
        
        const datasets = [];
        const colors = ['#007AFF', '#34C759', '#FF9500', '#FF3B30'];

        temperatures.forEach((temp, tempIndex) => {
            const points = [];
            
            altitudes.forEach(alt => {
                const mpValue = calculateR22HpAlphaManifoldPressure(alt, temp);
                if (typeof mpValue === 'number') {
                    points.push({
                        x: alt,
                        y: mpValue
                    });
                }
            });

            if (points.length > 0) {
                datasets.push({
                    label: `${temp}°C`,
                    data: points,
                    borderColor: colors[tempIndex % colors.length],
                    backgroundColor: colors[tempIndex % colors.length],
                    borderWidth: 2,
                    pointRadius: 0, // No points for smooth lines
                    pointHoverRadius: 6,
                    fill: false,
                    tension: 0.1
                });
            }
        });

        return {
            datasets: datasets,
            altitudes: altitudes,
            temperatures: temperatures
        };
    }

    generateR22BetaChartData() {
        // Generate chart data for R22 Beta using mathematical equations
        const temperatures = [-20, 0, 20, 40];
        const altitudes = [];
        
        // Generate altitude points from 0 to 8000 feet in 100-foot increments
        for (let alt = 0; alt <= 8000; alt += 100) {
            altitudes.push(alt);
        }
        
        const datasets = [];
        const colors = ['#007AFF', '#34C759', '#FF9500', '#FF3B30'];

        temperatures.forEach((temp, tempIndex) => {
            const points = [];
            
            altitudes.forEach(alt => {
                const mpValue = calculateR22BetaManifoldPressure(alt, temp);
                if (typeof mpValue === 'number') {
                    points.push({
                        x: alt,
                        y: mpValue
                    });
                }
            });

            if (points.length > 0) {
                datasets.push({
                    label: `${temp}°C`,
                    data: points,
                    borderColor: colors[tempIndex % colors.length],
                    backgroundColor: colors[tempIndex % colors.length],
                    borderWidth: 2,
                    pointRadius: 0, // No points for smooth lines
                    pointHoverRadius: 6,
                    fill: false,
                    tension: 0.1
                });
            }
        });

        return {
            datasets: datasets,
            altitudes: altitudes,
            temperatures: temperatures
        };
    }

    createChart(chartData, modelType) {
        if (!chartData) {
            this.showPlaceholder();
            return;
        }

        this.elements.chartPlaceholder.classList.add('hidden');
        this.elements.chartContainer.classList.remove('hidden');

        const ctx = this.elements.chartContainer.getContext('2d');
        
        // Calculate dynamic Y-axis range based on actual data
        let minY = Infinity;
        let maxY = -Infinity;
        
        // Find min and max Y values from all datasets
        chartData.datasets.forEach(dataset => {
            dataset.data.forEach(point => {
                if (point.y < minY) minY = point.y;
                if (point.y > maxY) maxY = point.y;
            });
        });
        
        // Calculate Y-axis range with appropriate padding
        const yRange = maxY - minY;
        const padding = Math.max(yRange * 0.1, 0.5); // 10% of range or minimum 0.5
        const yMin = Math.floor((minY - padding) * 10) / 10; // Round down to nearest 0.1
        const yMax = Math.ceil((maxY + padding) * 10) / 10; // Round up to nearest 0.1
        
        // Set X-axis range based on model type
        let xMax, xAxisTitle, yAxisTitle, chartTitle, yMinFixed, yMaxFixed;
        
        if (modelType === "AS350-B3") {
            // AS350 uses weight on X-axis
            xMax = 2250; // Set exact maximum
            xAxisTitle = 'Weight (kg)';
            yAxisTitle = 'IGE Hover Ceiling (ft)';
            chartTitle = 'AS350-B3 - IGE Hovering Flight Performance';
            yMinFixed = 0; // Set exact minimum
            yMaxFixed = 23; // Set exact maximum
        } else {
            // Other helicopters use altitude on X-axis
            xMax = Math.max(...chartData.altitudes) + 200;
            xAxisTitle = 'Pressure Altitude (feet)';
            yAxisTitle = 'Manifold Pressure (in. Hg)';
            chartTitle = `R22 ${modelType} - Limit Manifold Pressure Chart`;
            yMinFixed = yMin;
            yMaxFixed = yMax;
        }
        
        this.currentChart = new Chart(ctx, {
            type: 'line',
            data: {
                datasets: chartData.datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: chartTitle,
                        font: {
                            size: 16,
                            weight: 'bold'
                        }
                    },
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        enabled: false
                    }
                },
                scales: {
                    x: {
                        type: 'linear',
                        position: 'bottom',
                        title: {
                            display: true,
                            text: xAxisTitle
                        },
                        min: modelType === "AS350-B3" ? 1200 : 0,
                        max: xMax
                    },
                    y: {
                        title: {
                            display: true,
                            text: yAxisTitle
                        },
                        min: yMinFixed,
                        max: yMaxFixed
                    }
                },
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                }
            }
        });
    }

    updateChartPoint(altitude, temperature, pressure) {
        if (!this.currentChart || typeof pressure !== 'number') {
            return;
        }

        const helicopter = this.elements.helicopterSelect.value;

        // Remove existing calculated points if they exist
        this.currentChart.data.datasets = this.currentChart.data.datasets.filter(ds => 
            ds.label !== 'Calculated Point' && ds.label !== 'Max Cont Press Point'
        );

        // Add calculated point
        this.currentChart.data.datasets.push({
            label: 'Calculated Point',
            data: [{
                x: helicopter === 'as350' ? this.elements.weightInput.value : altitude,
                y: helicopter === 'as350' ? getHp(parseInt(this.elements.weightInput.value), parseInt(this.elements.oatInput.value)) : pressure
            }],
            borderColor: '#FF0000',
            backgroundColor: '#FF0000',
            borderWidth: 3,
            pointRadius: 8,
            pointHoverRadius: 10,
            fill: false,
            showLine: false,
            pointStyle: 'circle'
        });

        // For R22 Beta, also add MCP point
        if (helicopter === 'r22_beta') {
            const mcpValue = pressure - 1;
            this.currentChart.data.datasets.push({
                label: 'Max Cont Press Point',
                data: [{
                    x: altitude,
                    y: mcpValue
                }],
                borderColor: '#FF6600',
                backgroundColor: '#FF6600',
                borderWidth: 3,
                pointRadius: 6,
                pointHoverRadius: 8,
                fill: false,
                showLine: false,
                pointStyle: 'circle'
            });
        }

        this.currentChart.update();
    }

    showPlaceholder() {
        this.elements.chartPlaceholder.classList.remove('hidden');
        this.elements.chartContainer.classList.add('hidden');
        if (this.currentChart) {
            this.currentChart.destroy();
            this.currentChart = null;
        }
    }

    showError(message) {
        this.elements.errorMessage.textContent = message;
        this.elements.errorMessage.classList.remove('hidden');
        
        setTimeout(() => {
            this.elements.errorMessage.classList.add('hidden');
        }, 5000);
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Helicopter persistence methods
    saveHelicopterSelection() {
        const selectedHelicopter = this.elements.helicopterSelect.value;
        if (selectedHelicopter) {
            localStorage.setItem('robinson_limit_mp_helicopter', selectedHelicopter);
        }
    }

    loadSavedHelicopter() {
        const savedHelicopter = localStorage.getItem('robinson_limit_mp_helicopter');
        if (savedHelicopter) {
            this.elements.helicopterSelect.value = savedHelicopter;
            // Initialize chart and calculate if we have a saved helicopter
            this.initializeChart();
            this.calculate();
        }
    }

    initializeVersion() {
        // Store the current version in localStorage
        if (typeof APP_VERSION !== 'undefined') {
            localStorage.setItem('robinson_limit_mp_version', APP_VERSION);
        }
    }

    // Version checking methods
    async checkForUpdates() {
        try {
            const currentVersion = this.getCurrentVersion();
            const serverVersion = await this.getServerVersion();
            
            if (serverVersion && serverVersion !== currentVersion) {
                this.showUpdateNotification(serverVersion);
            }
        } catch (error) {
            // Version check failed silently
        }
    }

    getCurrentVersion() {
        // Get version from localStorage or use a default
        return localStorage.getItem('robinson_limit_mp_version') || '1.0.0';
    }

    async getServerVersion() {
        try {
            // Fetch the version.js file to get the latest version
            const response = await fetch('./version.js?t=' + Date.now(), {
                cache: 'no-cache'
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch version');
            }
            
            const text = await response.text();
            
            // Extract version from the file content
            const versionMatch = text.match(/APP_VERSION\s*=\s*['"`]([^'"`]+)['"`]/);
            if (versionMatch) {
                return versionMatch[1];
            }
            
            return null;
        } catch (error) {
            // Could not fetch server version
            return null;
        }
    }

    showUpdateNotification(newVersion) {
        // Check if we've already shown the notification for this version
        const lastNotifiedVersion = localStorage.getItem('robinson_limit_mp_last_notified_version');
        if (lastNotifiedVersion === newVersion) {
            return;
        }

        // Create update notification element
        const notification = document.createElement('div');
        notification.className = 'update-notification';
        notification.innerHTML = `
            <div class="update-content">
                <div class="update-icon">🔄</div>
                <div class="update-text">
                    <strong>Update Available</strong><br>
                    A new version (${newVersion}) is available
                </div>
                <div class="update-actions">
                    <button class="update-btn update-now">Update Now</button>
                    <button class="update-btn update-later">Later</button>
                </div>
            </div>
        `;

        // Add event listeners
        notification.querySelector('.update-now').addEventListener('click', () => {
            this.performUpdate();
        });

        notification.querySelector('.update-later').addEventListener('click', () => {
            this.dismissUpdateNotification(notification, newVersion);
        });

        // Add to page
        document.body.appendChild(notification);

        // Auto-hide after 10 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                this.dismissUpdateNotification(notification, newVersion);
            }
        }, 10000);
    }

    dismissUpdateNotification(notification, version) {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
        // Remember that we've shown this version notification
        localStorage.setItem('robinson_limit_mp_last_notified_version', version);
    }

    async performUpdate() {
        try {
            // Clear all caches to force fresh content
            if ('caches' in window) {
                const cacheNames = await caches.keys();
                await Promise.all(
                    cacheNames.map(cacheName => caches.delete(cacheName))
                );
            }

            // Update the stored version
            const serverVersion = await this.getServerVersion();
            if (serverVersion) {
                localStorage.setItem('robinson_limit_mp_version', serverVersion);
            }

            // Reload the page to get the new version
            window.location.reload();
        } catch (error) {
            // Update failed, fallback: just reload the page
            window.location.reload();
        }
    }

    // Weather-related methods
    async initializeWeather() {
        try {
            await this.weatherService.initialize();
            this.updateWeatherButtonState();
        } catch (error) {
            this.updateWeatherButtonState();
        }
    }

    updateWeatherButtonState() {
        const weatherBtn = this.elements.weatherBtn;
        const localTempBtn = this.elements.localTempBtn;
        
        // Update weather button
        const isWeatherAvailable = this.weatherService.isWeatherAvailable();
        if (!isWeatherAvailable) {
            weatherBtn.classList.add('disabled');
            weatherBtn.title = 'Weather access not available';
        } else {
            weatherBtn.classList.remove('disabled');
            weatherBtn.title = 'Get current weather';
        }
        
        // Update local temperature button
        const isLocalTempAvailable = this.weatherService.isLocalTemperatureAvailable();
        if (isLocalTempAvailable) {
            localTempBtn.style.display = 'inline-block';
            localTempBtn.classList.remove('disabled');
            localTempBtn.title = 'Get local device temperature';
        } else {
            localTempBtn.style.display = 'none';
            localTempBtn.classList.add('disabled');
            localTempBtn.title = 'Local temperature sensors not available';
        }
    }

    async handleWeatherRequest() {
        const btn = this.elements.weatherBtn;
        const status = this.elements.weatherStatus;
        
        // Don't proceed if weather is not available
        if (!this.weatherService.isWeatherAvailable()) {
            this.showWeatherStatus('Weather access not available', 'error');
            return;
        }

        // Show loading state
        btn.classList.add('loading');
        this.showWeatherStatus('Getting weather data...', 'info');

        try {
            const weather = await this.weatherService.requestWeatherAccess();
            
            // Update temperature input
            this.elements.temperatureInput.value = weather.temperature.toFixed(1);
            
            // Show success status
            const statusText = `${weather.temperature.toFixed(1)}°C - ${weather.description} (${weather.source})`;
            this.showWeatherStatus(statusText, 'success');
            
            // Trigger calculation with new temperature
            this.calculate();
            
        } catch (error) {
            this.showWeatherStatus(error.message, 'error');
            
            // Update button state after error
            this.updateWeatherButtonState();
        } finally {
            btn.classList.remove('loading');
        }
    }

    async handleLocalTemperatureRequest() {
        const btn = this.elements.localTempBtn;
        const status = this.elements.weatherStatus;
        
        // Don't proceed if local temperature is not available
        if (!this.weatherService.isLocalTemperatureAvailable()) {
            this.showWeatherStatus('Local temperature sensors not available', 'error');
            return;
        }

        // Show loading state
        btn.classList.add('loading');
        this.showWeatherStatus('Getting local temperature...', 'info');

        try {
            const localWeather = await this.weatherService.getLocalTemperature();
            
            // Update temperature input
            this.elements.temperatureInput.value = localWeather.temperature.toFixed(1);
            
            // Show success status
            const statusText = `${localWeather.temperature.toFixed(1)}°C - Local sensors (${localWeather.accuracy})`;
            this.showWeatherStatus(statusText, 'success');
            
            // Trigger calculation with new temperature
            this.calculate();
            
        } catch (error) {
            this.showWeatherStatus(error.message, 'error');
        } finally {
            btn.classList.remove('loading');
        }
    }

    async autoFetchWeather() {
        // Only auto-fetch if weather is available and temperature field is empty
        if (!this.weatherService.isWeatherAvailable() || this.elements.temperatureInput.value) {
            return;
        }

        try {
            // Show a brief status message
            this.showWeatherStatus('Getting weather data...', 'info');
            
            const weather = await this.weatherService.requestWeatherAccess();
            
            // Update temperature input
            this.elements.temperatureInput.value = weather.temperature.toFixed(1);
            
            // Show success status briefly, then clear
            const statusText = `${weather.temperature.toFixed(1)}°C - ${weather.description} (${weather.source})`;
            this.showWeatherStatus(statusText, 'success');
            
            // Clear the status after 3 seconds
            setTimeout(() => {
                this.showWeatherStatus('', 'info');
            }, 3000);
            
            // Trigger calculation with new temperature
            this.calculate();
            
        } catch (error) {
            // Auto weather fetch failed silently
            this.showWeatherStatus('', 'info');
        }
    }

    showWeatherStatus(message, type = 'info') {
        const status = this.elements.weatherStatus;
        status.textContent = message;
        status.className = `weather-status ${type}`;
        
        // Clear status after 5 seconds for success/info messages
        if (type !== 'error') {
            setTimeout(() => {
                if (status.textContent === message) {
                    status.textContent = '';
                    status.className = 'weather-status';
                }
            }, 5000);
        }
    }

    // Location-related methods
    async initializeLocation() {
        try {
            await this.locationService.initialize();
            this.updateAltitudeFromLocation();
            
            // If location permission was granted, automatically fetch weather
            if (this.locationService.locationPermission === 'granted') {
                await this.autoFetchWeather();
            }
        } catch (error) {
            // Location services not available - app continues to work normally
        }
    }

    updateAltitudeFromLocation() {
        const locationData = this.locationService.getRecommendedAltitude();
        if (locationData && !this.elements.altitudeInput.value) {
            // Only auto-fill if user hasn't manually entered an altitude
            this.elements.altitudeInput.value = locationData.altitude;
            this.showLocationInfo(locationData);
            this.calculate(); // Trigger calculation with new altitude
        }
    }

    showLocationInfo(locationData) {
        // Remove any existing location info
        this.hideLocationInfo();

        const locationInfo = document.createElement('div');
        locationInfo.className = `location-info ${locationData.source}`;
        
        let icon, text;
        if (locationData.source === 'airfield') {
            icon = '✈️';
            text = `Using ${locationData.airfieldName} (${locationData.icao}) elevation: ${locationData.altitude} ft (${locationData.distance.toFixed(1)} miles away)`;
        } else {
            icon = '📍';
            let accuracyText = '';
            if (locationData.accuracy === 'high') {
                accuracyText = ' (High accuracy)';
            } else if (locationData.accuracy === 'medium') {
                accuracyText = ` (Medium accuracy ±${locationData.altitudeAccuracy} ft)`;
            } else if (locationData.accuracy === 'low') {
                accuracyText = ` (Low accuracy ±${locationData.altitudeAccuracy} ft)`;
            } else {
                accuracyText = ' (Accuracy unknown)';
            }
            text = `Using GPS altitude: ${locationData.altitude} ft${accuracyText}`;
        }

        locationInfo.innerHTML = `
            <span class="location-icon">${icon}</span>
            <span class="location-text">${text}</span>
            <button class="location-close" onclick="this.parentElement.remove()">×</button>
        `;

        // Insert after the input section
        const inputSection = document.querySelector('.input-section');
        inputSection.parentNode.insertBefore(locationInfo, inputSection.nextSibling);
    }

    hideLocationInfo() {
        const existingInfo = document.querySelector('.location-info');
        if (existingInfo) {
            existingInfo.remove();
        }
    }
}

/**
 * Calculates the R22 Standard Limit Manifold Pressure using mathematical equations
 * instead of table interpolation.
 * 
 * The calculation uses the general equation: MAP = m(T) × PA + c(T)
 * Where PA is pressure altitude in thousands of feet, and m(T) and c(T) are
 * temperature-dependent slope and y-intercept functions.
 * 
 * @param {number} pressureAltitudeFeet - The pressure altitude in feet
 * @param {number} temperatureCelsius - The outside air temperature in degrees Celsius
 * @returns {number|string} The limit manifold pressure in inches of Hg (rounded to 2 decimal places),
 * or "FT" if full throttle is the limiting factor
 */
function calculateR22StandardManifoldPressure(pressureAltitudeFeet, temperatureCelsius) {
    // Convert pressure altitude to thousands of feet for the equations
    const PA = pressureAltitudeFeet / 1000;
    
    // Calculate the slope m(T) based on temperature
    let m;
    if (temperatureCelsius >= 20) {
        m = -0.20;
    } else if (temperatureCelsius >= 0) {
        m = -0.0025 * temperatureCelsius - 0.15;
    } else {
        m = -0.15;
    }
    
    // Calculate the y-intercept c(T) based on temperature
    let c;
    if (temperatureCelsius >= 20) {
        c = 0.015 * temperatureCelsius + 25.1;
    } else {
        c = 0.0275 * temperatureCelsius + 24.55;
    }
    
    // Calculate the temperature-dependent limit
    const MAP_temp = m * PA + c;
    
    // Calculate the full throttle limit
    const MAP_throttle = -0.75 * PA + 27.25;
    
    // The actual limit is the lesser of the two values
    const finalMAP = Math.min(MAP_temp, MAP_throttle);
    
    // Check if the result is valid (positive and reasonable)
    if (finalMAP <= 0 || finalMAP > 30) {
        return "FT";
    }
    
    return parseFloat(finalMAP.toFixed(2));
}

/**
 * Calculates the Limit Manifold Pressure (MAP) for various Robinson R22 helicopter models
 * based on pressure altitude and outside air temperature (OAT).
 *
 * This function uses bilinear interpolation from predefined charts for each model.
 * "FT" (Full Throttle) indicates that the engine will reach full throttle before
 * reaching a specific manifold pressure limit.
 *
 * @param {string} model - The helicopter model ("STANDARD", "HP_ALPHA", "BETA", "BETA_II").
 * Note: "BETA" uses the same data as "HP_ALPHA".
 * @param {number} currentPaFeet - The current pressure altitude in feet.
 * @param {number} currentOatC - The current outside air temperature in degrees Celsius.
 * @returns {number|string|null} The limit manifold pressure in inches of Hg (rounded to 2 decimal places),
 * "FT" if full throttle is the limiting factor, or null if inputs are out of bounds or model is invalid.
 */
function getLimitManifoldPressure(model, currentPaFeet, currentOatC) {
    // Special handling for R22 Standard using mathematical equations
    if (model.toUpperCase() === "STANDARD") {
        return calculateR22StandardManifoldPressure(currentPaFeet, currentOatC);
    }
    
    // Use mathematical equations for R22 HP/Alpha
    if (model.toUpperCase() === "HP_ALPHA") {
        return calculateR22HpAlphaManifoldPressure(currentPaFeet, currentOatC);
    }

    // Use mathematical equations for R22 Beta
    if (model.toUpperCase() === "BETA") {
        return calculateR22BetaManifoldPressure(currentPaFeet, currentOatC);
    }
    
    // --- Select Data for the Specified Model ---
    const selectedModelData = HELICOPTER_DATA[model.toUpperCase()];

    if (!selectedModelData) {
        return null;
    }

    const pressureAltitudesFeet = selectedModelData.pressureAltitudesFeet;
    const oatCelsius = selectedModelData.oatCelsius;
    const mpLimitsData = selectedModelData.mpLimitsData;

    // --- Input Validation and Boundary Checks ---
    const minPa = pressureAltitudesFeet[0];
    const maxPa = pressureAltitudesFeet[pressureAltitudesFeet.length - 1];
    const minOat = oatCelsius[0];
    const maxOat = oatCelsius[oatCelsius.length - 1];

    // If inputs are exactly at the max boundary, adjust slightly to ensure they fall within the last segment
    if (currentPaFeet === maxPa) currentPaFeet -= 0.001;
    if (currentOatC === maxOat) currentOatC -= 0.001;

    // Check if inputs are strictly within the chart's numerical range
    if (currentPaFeet < minPa || currentPaFeet >= maxPa ||
        currentOatC < minOat || currentOatC >= maxOat) {
        // For values outside the chart's precise interpolation range,
        // especially at higher altitudes/temperatures, the limit is often "FT".
        // This is a simplified handling; a more robust system might extrapolate
        // or provide more specific out-of-bounds messages.
        if (currentPaFeet >= maxPa || currentOatC >= maxOat) {
            return "FT"; // Beyond chart limits often implies FT
        }
        return null; // Values outside the interpolation range
    }

    // --- Find Bounding Grid Points ---

    // Find the lower bounding pressure altitude index
    let paLowerIdx = 0;
    while (paLowerIdx < pressureAltitudesFeet.length - 1 && pressureAltitudesFeet[paLowerIdx + 1] <= currentPaFeet) {
        paLowerIdx++;
    }

    // Find the lower bounding OAT index
    let oatLowerIdx = 0;
    while (oatLowerIdx < oatCelsius.length - 1 && oatCelsius[oatLowerIdx + 1] <= currentOatC) {
        oatLowerIdx++;
    }

    const pa1 = pressureAltitudesFeet[paLowerIdx];
    const pa2 = pressureAltitudesFeet[paLowerIdx + 1];
    const oat1 = oatCelsius[oatLowerIdx];
    const oat2 = oatCelsius[oatLowerIdx + 1];

    // Get the four corner values
    const q11 = mpLimitsData[paLowerIdx][oatLowerIdx];
    const q12 = mpLimitsData[paLowerIdx][oatLowerIdx + 1];
    const q21 = mpLimitsData[paLowerIdx + 1][oatLowerIdx];
    const q22 = mpLimitsData[paLowerIdx + 1][oatLowerIdx + 1];

    // --- Handle "Full Throttle" (FT) Conditions ---
    // If any of the four corner values are null (representing FT),
    // we conservatively assume the limit is "FT" for this region.
    if (q11 === null || q12 === null || q21 === null || q22 === null) {
        return "FT";
    }

    // --- Perform Bilinear Interpolation ---

    // Linear interpolation along the OAT axis for pa1
    let R1;
    if (oat2 === oat1) { // Should not happen with this data, but good practice
        R1 = q11;
    } else {
        R1 = q11 + (q12 - q11) * (currentOatC - oat1) / (oat2 - oat1);
    }

    // Linear interpolation along the OAT axis for pa2
    let R2;
    if (oat2 === oat1) { // Should not happen with this data, but good practice
        R2 = q21;
    } else {
        R2 = q21 + (q22 - q21) * (currentOatC - oat1) / (oat2 - oat1);
    }

    // Linear interpolation along the Pressure Altitude axis
    let interpolatedMp;
    if (pa2 === pa1) { // Should not happen with this data, but good practice
        interpolatedMp = R1;
    } else {
        interpolatedMp = R1 + (R2 - R1) * (currentPaFeet - pa1) / (pa2 - pa1);
    }

    return parseFloat(interpolatedMp.toFixed(2)); // Round to 2 decimal places
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new RobinsonLimitMP();
}); 