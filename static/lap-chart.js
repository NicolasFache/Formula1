// LapChart class for visualizing lap times

let chartInstance = null; // Global reference to chart instance

class LapChart {
    constructor(containerId) {
        // Store global reference
        chartInstance = this;
        
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error(`Container with id "${containerId}" not found!`);
            return;
        }
        
        this.lapsData = {};
        this.selectedDrivers = new Set();
        this.chartWidth = 0;
        this.chartHeight = 0;
        this.margin = { top: 30, right: 30, bottom: 80, left: 60 };
        this.hoverLap = null;
        this.colors = {
            'VER': '#0600EF', // Red Bull
            'PER': '#0600EF', // Red Bull
            'LEC': '#DC0000', // Ferrari
            'SAI': '#DC0000', // Ferrari
            'HAM': '#00D2BE', // Mercedes
            'RUS': '#00D2BE', // Mercedes
            'NOR': '#FF8700', // McLaren
            'PIA': '#FF8700', // McLaren
            'ALO': '#006F62', // Aston Martin
            'STR': '#006F62', // Aston Martin
            'OCO': '#0090FF', // Alpine
            'GAS': '#0090FF', // Alpine
            'ALB': '#005AFF', // Williams
            'SAR': '#005AFF', // Williams
            'TSU': '#4E7C9B', // AlphaTauri/RB
            'RIC': '#4E7C9B', // AlphaTauri/RB
            'HUL': '#FFFFFF', // Haas
            'MAG': '#FFFFFF', // Haas
            'BOT': '#900000', // Alfa Romeo
            'ZHO': '#900000',  // Alfa Romeo
            'BEA': '#FF0000',  // Additional drivers
            'ZHO': '#00FF00'
        };
        
        // Tire compound icons (using HTML entities for simplicity)
        this.tireIcons = {
            'Soft': '<img src="/images/tires/soft-tire.png" class="tire-icon" alt="Soft" />',
            'Medium': '<img src="/images/tires/med-tire.png" class="tire-icon" alt="Medium" />',
            'Hard': '<img src="/images/tires/hard-tire.png" class="tire-icon" alt="Hard" />',
            'Intermediate': '<img src="/images/tires/inter-tire.png" class="tire-icon" alt="Intermediate" />',
            'Wet': '<img src="/images/tires/wet-tire.png" class="tire-icon" alt="Wet" />',
            'Unknown': '<img src="/images/tires/soft-tire.png" class="tire-icon" alt="Unknown" />'
        };
        
        console.log('LapChart constructor called for container:', containerId);
        
        // Initialize the chart
        this.initChart();
        
        // Load test data immediately if available
        if (typeof testLapData !== 'undefined') {
            console.log('Test data found, loading sample data');
            setTimeout(() => {
                this.setLapsData(testLapData);
            }, 500);
        }
    }
    
    initChart() {
        console.log('Initializing lap chart...');
        
        // Ensure the wrapper is visible
        const wrapper = document.getElementById('lapChartWrapper');
        if (wrapper) {
            wrapper.style.display = 'block';
            console.log('Set wrapper to display:block');
        }
        
        // Create the chart container
        this.container.innerHTML = `
            <div class="lap-chart-container">
                <div class="lap-chart-header">
                    <div class="lap-chart-title">
                        <i class="fas fa-clock"></i> LAPS CHART
                    </div>
                    <div class="lap-chart-controls">
                        <button class="lap-chart-button" id="zoom-out-btn">Zoom Out</button>
                        <button class="lap-chart-button" id="reset-btn">Reset</button>
                    </div>
                </div>
                <div class="lap-chart-content">
                    <div id="lap-chart-tooltip" class="lap-chart-tooltip"></div>
                    <svg id="lap-chart-svg"></svg>
                </div>
                <div class="lap-chart-drivers" id="lap-chart-drivers">
                    <!-- Driver buttons will be added here -->
                </div>
            </div>
        `;
        
        // Add styles
        this.addStyles();
        
        // Get elements
        this.svg = document.getElementById('lap-chart-svg');
        this.tooltip = document.getElementById('lap-chart-tooltip');
        this.driversContainer = document.getElementById('lap-chart-drivers');
        this.zoomOutBtn = document.getElementById('zoom-out-btn');
        this.resetBtn = document.getElementById('reset-btn');
        
        if (!this.svg || !this.tooltip || !this.driversContainer) {
            console.error('Failed to get all required chart elements!');
            console.log('SVG:', this.svg);
            console.log('Tooltip:', this.tooltip);
            console.log('Drivers container:', this.driversContainer);
            return;
        }
        
        // Add event listeners
        this.zoomOutBtn.addEventListener('click', () => this.zoomOut());
        this.resetBtn.addEventListener('click', () => this.resetChart());
        
        // Initialize with empty chart
        this.drawChart();
        
        console.log('Lap chart initialized successfully');
    }
    
    addStyles() {
        // Check if styles already exist
        if (document.getElementById('lap-chart-styles')) {
            console.log('Lap chart styles already exist, skipping...');
            return;
        }
        
        // Create styles
        const styleEl = document.createElement('style');
        styleEl.id = 'lap-chart-styles';
        styleEl.textContent = `
            .lap-chart-container {
                background-color: #1c1e24;
                border-radius: 12px;
                padding: 20px;
                margin-bottom: 30px;
                color: white;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
                display: block !important;
            }
            
            .lap-chart-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
            }
            
            .lap-chart-title {
                font-size: 1.2rem;
                font-weight: bold;
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .lap-chart-controls {
                display: flex;
                gap: 10px;
            }
            
            .lap-chart-button {
                background-color: #292c36;
                border: none;
                color: white;
                padding: 5px 15px;
                border-radius: 4px;
                cursor: pointer;
                transition: background-color 0.2s;
            }
            
            .lap-chart-button:hover {
                background-color: #3a3d47;
            }
            
            .lap-chart-content {
                position: relative;
                width: 100%;
                height: 350px;
                margin-bottom: 20px;
                overflow: hidden;
                display: block !important;
            }
            
            #lap-chart-svg {
                width: 100%;
                height: 100%;
                background-color: #1c1e24;
                display: block !important;
            }
            
            .lap-chart-tooltip {
                position: fixed; /* Changed from absolute to fixed for better positioning */
                display: none;
                background-color: rgba(0, 0, 0, 0.85);
                color: white;
                padding: 15px;
                border-radius: 4px;
                pointer-events: none;
                z-index: 1000; /* Increased z-index */
                min-width: 180px;
                max-width: 250px;
                font-size: 0.9rem;
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
            }
            
            .tooltip-title {
                font-weight: bold;
                margin-bottom: 10px;
                text-align: center;
            }
            
            .tooltip-driver {
                display: flex;
                align-items: center;
                margin-bottom: 8px;
            }
            
            .tooltip-driver-color {
                width: 12px;
                height: 12px;
                border-radius: 50%;
                display: inline-block;
                margin-right: 8px;
            }
            
            .tooltip-driver-code {
                font-weight: bold;
                margin-right: 8px;
            }
            
            .tooltip-driver-time {
                margin-left: auto;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            /* Tire icons */
            .tire-icon {
                font-size: 14px;
                line-height: 1;
                display: inline-block;
                margin-left: 8px;
            }
            
            .tire-soft { color: #FF0000; }
            .tire-medium { color: #FFFF00; }
            .tire-hard { color: #FFFFFF; }
            .tire-intermediate { color: #4CAF50; }
            .tire-wet { color: #2196F3; }
            .tire-unknown { color: #888888; }
            
            .lap-chart-drivers {
                display: flex;
                flex-wrap: wrap;
                gap: 10px;
                padding-top: 10px;
                border-top: 1px solid #292c36;
            }
            
            .driver-button {
                background-color: #292c36;
                border: 2px solid;
                border-radius: 20px;
                padding: 5px 12px;
                cursor: pointer;
                color: white;
                transition: all 0.2s;
                opacity: 0.6;
                font-weight: bold;
                min-width: 50px;
                text-align: center;
            }
            
            .driver-button.active {
                opacity: 1;
                background-color: #3a3d47;
                box-shadow: 0 0 8px rgba(255, 255, 255, 0.3);
            }
            
            .lap-axis line, .lap-axis path {
                stroke: #444;
            }
            
            .lap-axis text {
                fill: #aaa;
                font-size: 12px;
            }
            
            .lap-grid line {
                stroke: #292c36;
                stroke-dasharray: 2,2;
            }
            
            .lap-line {
                fill: none;
                stroke-width: 2;
            }
            
            .lap-point {
                r: 4;
                stroke-width: 2;
                stroke: #1c1e24;
                cursor: pointer;
                transition: r 0.2s;
            }
            
            .lap-point:hover {
                r: 6;
            }
            
            .lap-point.hover-highlight {
                r: 6;
                stroke-width: 3;
                stroke: white;
            }
            
            .lap-time-label {
                fill: #aaa;
                font-size: 12px;
                text-anchor: middle;
            }
        `;
        
        document.head.appendChild(styleEl);
        console.log('Lap chart styles added to document');
    }
    
    setLapsData(data) {
        console.log('Setting lap data:', Object.keys(data));
        this.lapsData = data;
        this.drawDriverButtons();
        
        // Always find and select the top 3 fastest drivers
        try {
            const fastestDrivers = this.findTopFastestDrivers(3);
            console.log('Top 3 fastest drivers:', fastestDrivers);
            
            // Clear any previous selections
            this.selectedDrivers.clear();
            
            // Get all driver buttons
            const buttons = this.driversContainer.querySelectorAll('.driver-button');
            
            // Deactivate all buttons first
            buttons.forEach(button => {
                button.classList.remove('active');
            });
            
            // Select top 3 drivers (or as many as we can find) and activate buttons
            fastestDrivers.forEach(driver => {
                this.selectedDrivers.add(driver);
                
                // Find and activate the corresponding button
                buttons.forEach(button => {
                    if (button.dataset.driver === driver) {
                        button.classList.add('active');
                    }
                });
            });
            
            // If we couldn't find any fastest drivers, select the first 3 drivers (if available)
            if (this.selectedDrivers.size === 0 && Object.keys(this.lapsData).length > 0) {
                console.log('No fastest drivers found, selecting first available drivers');
                const allDrivers = Object.keys(this.lapsData).slice(0, 3);
                
                allDrivers.forEach(driver => {
                    this.selectedDrivers.add(driver);
                    
                    // Find and activate the corresponding button
                    buttons.forEach(button => {
                        if (button.dataset.driver === driver) {
                            button.classList.add('active');
                        }
                    });
                });
            }
        } catch (error) {
            console.error('Error selecting fastest drivers:', error);
            // Fallback: select first 3 drivers if there's an error
            const firstDrivers = Object.keys(this.lapsData).slice(0, 3);
            firstDrivers.forEach(driver => this.selectedDrivers.add(driver));
        }
        
        // Draw the chart with the selected drivers
        this.drawChart();
    }
    
    findTopFastestDrivers(count) {
        // Create an array to hold driver best lap times
        const driverBestLaps = [];
        
        // Find the best lap time for each driver
        Object.entries(this.lapsData).forEach(([driver, laps]) => {
            let bestLapTime = Infinity;
            
            // Find the best (lowest) lap time for this driver
            laps.forEach(lap => {
                const time = this.parseTime(lap.time);
                if (!isNaN(time) && time > 0 && time < bestLapTime) {
                    bestLapTime = time;
                }
            });
            
            // Only add if we found a valid lap time
            if (bestLapTime < Infinity) {
                driverBestLaps.push({ driver, bestLapTime });
            }
        });
        
        // Sort by best lap time (fastest first)
        driverBestLaps.sort((a, b) => a.bestLapTime - b.bestLapTime);
        
        // Return just the driver codes of the top N
        return driverBestLaps.slice(0, count).map(d => d.driver);
    }
    
    drawDriverButtons() {
        console.log('Drawing driver buttons');
        this.driversContainer.innerHTML = '';
        
        // Get all drivers
        const drivers = Object.keys(this.lapsData);
        
        // Sort alphabetically
        drivers.sort();
        
        // Create a button for each driver
        drivers.forEach(driver => {
            const button = document.createElement('button');
            button.className = 'driver-button';
            button.dataset.driver = driver;
            button.textContent = driver;
            button.style.color = this.colors[driver] || 'white';
            button.style.borderColor = this.colors[driver] || 'white';
            
            // Add event listener
            button.addEventListener('click', () => {
                this.toggleDriver(driver);
                button.classList.toggle('active');
            });
            
            this.driversContainer.appendChild(button);
        });
    }
    
    toggleDriver(driver) {
        console.log('Toggling driver:', driver);
        if (this.selectedDrivers.has(driver)) {
            this.selectedDrivers.delete(driver);
        } else {
            this.selectedDrivers.add(driver);
        }
        
        this.drawChart();
    }
    
    drawChart() {
        // Clear the SVG
        if (!this.svg) {
            console.error('SVG element not found!');
            return;
        }
        
        this.svg.innerHTML = '';
        
        // FAILSAFE: If no drivers are selected, try to select top 3
        if (this.selectedDrivers.size === 0 && Object.keys(this.lapsData).length > 0) {
            try {
                const fastestDrivers = this.findTopFastestDrivers(3);
                fastestDrivers.forEach(driver => this.selectedDrivers.add(driver));
                
                // If still empty, just select the first 3 drivers
                if (this.selectedDrivers.size === 0) {
                    const firstDrivers = Object.keys(this.lapsData).slice(0, 3);
                    firstDrivers.forEach(driver => this.selectedDrivers.add(driver));
                }
                
                // Update driver buttons
                const buttons = this.driversContainer.querySelectorAll('.driver-button');
                buttons.forEach(button => {
                    if (this.selectedDrivers.has(button.dataset.driver)) {
                        button.classList.add('active');
                    }
                });
            } catch (e) {
                console.error('Error in failsafe driver selection:', e);
            }
        }
        
        // Get SVG dimensions from its computed size (important for responsive display)
        const svgRect = this.svg.getBoundingClientRect();
        this.chartWidth = svgRect.width - this.margin.left - this.margin.right;
        this.chartHeight = svgRect.height - this.margin.top - this.margin.bottom;
        
        console.log('SVG dimensions:', svgRect.width, 'x', svgRect.height);
        console.log('Chart dimensions:', this.chartWidth, 'x', this.chartHeight);
        
        // If no drivers selected or no data, show message
        if (this.selectedDrivers.size === 0 || Object.keys(this.lapsData).length === 0) {
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', svgRect.width / 2);
            text.setAttribute('y', svgRect.height / 2);
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('fill', '#aaa');
            text.textContent = this.selectedDrivers.size === 0 ? 
                'Select drivers to display lap times' : 
                'No lap data available';
            this.svg.appendChild(text);
            return;
        }
        
        // Create the main group for the chart
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.setAttribute('transform', `translate(${this.margin.left},${this.margin.top})`);
        this.svg.appendChild(g);
        
        // Get data for selected drivers
        const selectedData = {};
        this.selectedDrivers.forEach(driver => {
            if (this.lapsData[driver]) {
                selectedData[driver] = this.lapsData[driver];
            }
        });
        
        // Find min and max lap numbers
        let minLap = Infinity;
        let maxLap = -Infinity;
        Object.values(selectedData).forEach(laps => {
            laps.forEach(lap => {
                minLap = Math.min(minLap, lap.lap);
                maxLap = Math.max(maxLap, lap.lap);
            });
        });
        
        // If no valid laps found, show message
        if (minLap === Infinity || maxLap === -Infinity) {
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', svgRect.width / 2);
            text.setAttribute('y', svgRect.height / 2);
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('fill', '#aaa');
            text.textContent = 'No valid lap data available';
            this.svg.appendChild(text);
            return;
        }
        
        // Find min and max lap times
        let minTime = Infinity;
        let maxTime = -Infinity;
        Object.values(selectedData).forEach(laps => {
            laps.forEach(lap => {
                const time = this.parseTime(lap.time);
                if (!isNaN(time) && time > 0) {
                    minTime = Math.min(minTime, time);
                    maxTime = Math.max(maxTime, time);
                }
            });
        });
        
        // If no valid lap times found, show message
        if (minTime === Infinity || maxTime === -Infinity) {
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', svgRect.width / 2);
            text.setAttribute('y', svgRect.height / 2);
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('fill', '#aaa');
            text.textContent = 'No valid lap time data';
            this.svg.appendChild(text);
            return;
        }
        
        // Add padding to the time scale for better visualization
        minTime -= 0.5;
        maxTime += 0.5;
        
        // Create scale functions
        const xScale = (x) => {
            return this.chartWidth * (x - minLap) / (maxLap - minLap);
        };
        
        const yScale = (y) => {
            return this.chartHeight * (1 - (y - minTime) / (maxTime - minTime));
        };
        
        console.log('Drawing chart with lap range:', minLap, 'to', maxLap);
        console.log('Time range:', this.formatTime(minTime), 'to', this.formatTime(maxTime));
        
        // Store chart data in object for tooltip lookups
        this.chartData = {
            minLap, maxLap, minTime, maxTime,
            xScale, yScale, selectedData
        };
        
        // Draw grid
        this.drawGrid(g, minLap, maxLap, minTime, maxTime, xScale, yScale);
        
        // Create invisible overlay areas for each lap to trigger tooltips
        this.createLapOverlays(g, minLap, maxLap, minTime, maxTime, xScale, yScale);
        
        // Draw lines and points for each driver
        Object.entries(selectedData).forEach(([driver, laps]) => {
            this.drawDriverLaps(g, driver, laps, xScale, yScale);
        });
    }
    
    createLapOverlays(g, minLap, maxLap, minTime, maxTime, xScale, yScale) {
        const overlayWidth = this.chartWidth / (maxLap - minLap + 1);
        
        for (let lap = Math.floor(minLap); lap <= Math.ceil(maxLap); lap++) {
            const x = xScale(lap);
            
            // Create an invisible rectangle for each lap
            const overlay = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            overlay.setAttribute('x', x - overlayWidth/2);
            overlay.setAttribute('y', 0);
            overlay.setAttribute('width', overlayWidth);
            overlay.setAttribute('height', this.chartHeight);
            overlay.setAttribute('fill', 'transparent');
            overlay.setAttribute('data-lap', lap);
            
            // Add hover events
            overlay.addEventListener('mouseover', (e) => {
                this.showLapTooltip(e, lap);
            });
            
            overlay.addEventListener('mouseout', () => {
                this.hideTooltip();
                this.unhighlightLapPoints();
            });
            
            g.appendChild(overlay);
        }
    }

    formatAxisTime(seconds) {
        if (isNaN(seconds) || seconds <= 0) {
            return '00:00';
        }
        
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        
        // Format without milliseconds, just MM:SS
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    
    drawGrid(g, minLap, maxLap, minTime, maxTime, xScale, yScale) {
        // X-axis (laps)
        const xAxis = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        xAxis.setAttribute('class', 'lap-axis');
        xAxis.setAttribute('transform', `translate(0,${this.chartHeight})`);
        
        // X-axis line
        const xAxisLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        xAxisLine.setAttribute('x1', 0);
        xAxisLine.setAttribute('y1', 0);
        xAxisLine.setAttribute('x2', this.chartWidth);
        xAxisLine.setAttribute('y2', 0);
        xAxisLine.setAttribute('stroke', '#444');
        xAxis.appendChild(xAxisLine);
        
        // X-axis labels (lap numbers)
        const lapRange = maxLap - minLap;
        const lapStep = lapRange > 20 ? Math.ceil(lapRange / 10) : 5;
        
        for (let lap = Math.ceil(minLap); lap <= Math.floor(maxLap); lap += lapStep) {
            const x = xScale(lap);
            
            // Grid line
            const gridLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            gridLine.setAttribute('class', 'lap-grid');
            gridLine.setAttribute('x1', x);
            gridLine.setAttribute('y1', 0);
            gridLine.setAttribute('x2', x);
            gridLine.setAttribute('y2', this.chartHeight);
            g.appendChild(gridLine);
            
            // Label
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', x);
            text.setAttribute('y', 20);
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('fill', '#aaa');
            text.textContent = lap;
            xAxis.appendChild(text);
        }
        
        g.appendChild(xAxis);
        
        // Y-axis (time)
        const yAxis = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        yAxis.setAttribute('class', 'lap-axis');
        
        // Y-axis line
        const yAxisLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        yAxisLine.setAttribute('x1', 0);
        yAxisLine.setAttribute('y1', 0);
        yAxisLine.setAttribute('x2', 0);
        yAxisLine.setAttribute('y2', this.chartHeight);
        yAxisLine.setAttribute('stroke', '#444');
        yAxis.appendChild(yAxisLine);
        
        // Y-axis labels (lap times)
        const timeRange = maxTime - minTime;
        const timeInterval = timeRange <= 10 ? 2 : Math.ceil(timeRange / 6);

        for (let time = Math.ceil(minTime); time <= Math.floor(maxTime); time += timeInterval) {
            const y = yScale(time);
            
            // Grid line
            const gridLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            gridLine.setAttribute('class', 'lap-grid');
            gridLine.setAttribute('x1', 0);
            gridLine.setAttribute('y1', y);
            gridLine.setAttribute('x2', this.chartWidth);
            gridLine.setAttribute('y2', y);
            g.appendChild(gridLine);
            
            // Format time for axis label - minutes and seconds only
            const formattedTime = this.formatAxisTime(time);
            
            // Label
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', -8);
            text.setAttribute('y', y + 5);
            text.setAttribute('text-anchor', 'end');
            text.setAttribute('fill', '#aaa');
            text.textContent = formattedTime;
            yAxis.appendChild(text);
        }
        
        g.appendChild(yAxis);
    }
    
    drawDriverLaps(g, driver, laps, xScale, yScale) {
        const driverColor = this.colors[driver] || '#ffffff';
        
        // Filter out any invalid laps (bad times, etc.)
        const validLaps = laps.filter(lap => {
            const time = this.parseTime(lap.time);
            return !isNaN(time) && time > 0;
        });
        
        if (validLaps.length === 0) {
            console.warn(`No valid laps for driver ${driver}`);
            return;
        }
        
        // Create a path for the lap times
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('class', 'lap-line');
        path.setAttribute('stroke', driverColor);
        
        // Generate the path data
        let pathData = '';
        validLaps.forEach((lap, i) => {
            const x = xScale(lap.lap);
            const y = yScale(this.parseTime(lap.time));
            
            if (i === 0) {
                pathData += `M ${x} ${y}`;
            } else {
                pathData += ` L ${x} ${y}`;
            }
        });
        
        path.setAttribute('d', pathData);
        g.appendChild(path);
        
        // Add points for each lap
        validLaps.forEach(lap => {
            const x = xScale(lap.lap);
            const y = yScale(this.parseTime(lap.time));
            
            const point = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            point.setAttribute('class', 'lap-point');
            point.setAttribute('cx', x);
            point.setAttribute('cy', y);
            point.setAttribute('fill', driverColor);
            point.setAttribute('data-driver', driver);
            point.setAttribute('data-lap', lap.lap);
            
            // Add hover event
            point.addEventListener('mouseover', (e) => {
                this.showLapTooltip(e, lap.lap);
            });
            
            point.addEventListener('mouseout', () => {
                this.hideTooltip();
                this.unhighlightLapPoints();
            });
            
            g.appendChild(point);
        });
    }
    
    showLapTooltip(event, lapNumber) {
        // Clear any previous highlight
        this.unhighlightLapPoints();
        
        // Set current hover lap
        this.hoverLap = lapNumber;
        
        // Highlight all points for this lap
        this.highlightLapPoints(lapNumber);
        
        // Get data for all selected drivers at this lap
        const lapData = [];
        
        this.selectedDrivers.forEach(driver => {
            if (this.lapsData[driver]) {
                const driverLaps = this.lapsData[driver];
                const lapInfo = driverLaps.find(lap => lap.lap === lapNumber);
                
                if (lapInfo) {
                    lapData.push({
                        driver,
                        color: this.colors[driver] || '#ffffff',
                        time: lapInfo.time,
                        compound: lapInfo.compound || 'Unknown',
                        tireAge: lapInfo.tireAge || 0
                    });
                }
            }
        });
        
        // If no data found, don't show tooltip
        if (lapData.length === 0) {
            this.hideTooltip();
            return;
        }
        
        // Sort drivers by lap time (fastest first)
        lapData.sort((a, b) => {
            const timeA = this.parseTime(a.time);
            const timeB = this.parseTime(b.time);
            return timeA - timeB;
        });
        
        // Build tooltip content
        let tooltipContent = `<div class="tooltip-title">Lap: ${lapNumber}</div>`;
        
        lapData.forEach((data, index) => {
            // Get the tire icon based on compound
            const tireIcon = this.tireIcons[data.compound] || this.tireIcons['Unknown'];
            
            tooltipContent += `
                <div class="tooltip-driver">
                    <div class="tooltip-driver-color" style="background-color: ${data.color};"></div>
                    <div class="tooltip-driver-code">${data.driver}</div>
                    <div class="tooltip-driver-time">${data.time} ${tireIcon}</div>
                </div>
            `;
        });
        
        // Set tooltip content
        this.tooltip.innerHTML = tooltipContent;
        
        // Position the tooltip - ensure it stays within window boundaries
        const tooltipWidth = 200; // Approximate width
        const tooltipHeight = 100 + (lapData.length * 30); // Approximate height based on number of drivers
        
        // Get window dimensions
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        
        // Get initial position
        let x = event.clientX + 10;
        let y = event.clientY + 10;
        
        // Check right boundary
        if (x + tooltipWidth > windowWidth) {
            x = windowWidth - tooltipWidth - 20;
        }
        
        // Check bottom boundary
        if (y + tooltipHeight > windowHeight) {
            y = windowHeight - tooltipHeight - 20;
        }
        
        // Make sure tooltip is not positioned outside the window
        x = Math.max(10, Math.min(windowWidth - tooltipWidth - 10, x));
        y = Math.max(10, Math.min(windowHeight - tooltipHeight - 10, y));
        
        // Apply final position
        this.tooltip.style.left = `${x}px`;
        this.tooltip.style.top = `${y}px`;
        this.tooltip.style.display = 'block';
    }
    
    highlightLapPoints(lapNumber) {
        // Get all points for this lap
        const points = this.svg.querySelectorAll(`.lap-point[data-lap="${lapNumber}"]`);
        
        // Highlight them
        points.forEach(point => {
            point.classList.add('hover-highlight');
        });
    }
    
    unhighlightLapPoints() {
        if (this.hoverLap !== null) {
            // Get all highlighted points
            const points = this.svg.querySelectorAll(`.lap-point.hover-highlight`);
            
            // Remove highlight
            points.forEach(point => {
                point.classList.remove('hover-highlight');
            });
            
            this.hoverLap = null;
        }
    }
    
    hideTooltip() {
        if (this.tooltip) {
            this.tooltip.style.display = 'none';
        }
    }
    
    zoomOut() {
        alert('Zoom Out functionality is not yet implemented');
    }
    
    resetChart() {
        // Clear selected drivers
        this.selectedDrivers.clear();
        
        // Reset buttons
        const buttons = this.driversContainer.querySelectorAll('.driver-button');
        buttons.forEach(button => {
            button.classList.remove('active');
        });
        
        // Redraw chart
        this.drawChart();
    }
    
    // Helper methods
    parseTime(timeString) {
        // Expected format: MM:SS.sss
        if (!timeString) return 0;
        
        // Handle special cases
        if (typeof timeString !== 'string') {
            console.warn('Invalid time format:', timeString);
            return 0;
        }
        
        try {
            const parts = timeString.split(':');
            if (parts.length === 1) {
                // Just seconds
                return parseFloat(parts[0]);
            }
            
            const minutes = parseInt(parts[0], 10);
            const seconds = parseFloat(parts[1]);
            
            if (isNaN(minutes) || isNaN(seconds)) {
                console.warn('Invalid time components:', minutes, seconds);
                return 0;
            }
            
            return minutes * 60 + seconds;
        } catch (e) {
            console.error('Error parsing time:', e);
            return 0;
        }
    }
    
    formatTime(seconds) {
        if (isNaN(seconds) || seconds <= 0) {
            return '00:00.000';
        }
        
        const minutes = Math.floor(seconds / 60);
        // Fix: Ensure seconds has leading zeros and proper decimal places
        const remainingSeconds = (seconds % 60).toFixed(3);
        
        // Ensure proper leading zeros for seconds
        let formattedSeconds;
        if (remainingSeconds < 10) {
            formattedSeconds = '0' + remainingSeconds;
        } else {
            formattedSeconds = remainingSeconds;
        }
        
        return `${minutes.toString().padStart(2, '0')}:${formattedSeconds}`;
    }
}

// Create test function
function testLapChart() {
    console.log('Running lap chart test function');
    
    // Make sure wrapper is visible
    const wrapper = document.getElementById('lapChartWrapper');
    if (wrapper) {
        wrapper.style.display = 'block';
        wrapper.style.visibility = 'visible';
        wrapper.style.opacity = '1';
    }
    
    // Check if chart instance exists
    if (chartInstance) {
        console.log('Using existing chart instance');
        
        // Load test data if available
        if (typeof testLapData !== 'undefined') {
            chartInstance.setLapsData(testLapData);
        }
        
        return chartInstance;
    }
    
    // If no instance exists, create a new one
    console.log('Creating new chart instance');
    const container = document.getElementById('lap-chart-container');
    if (!container) {
        console.error('Lap chart container not found!');
        return null;
    }
    
    // Create the chart
    const testChart = new LapChart('lap-chart-container');
    
    // Load test data if available
    if (typeof testLapData !== 'undefined') {
        testChart.setLapsData(testLapData);
    }
    
    console.log('Lap chart test initialized');
    return testChart;
}

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, auto-initializing lap chart');
    
    // Ensure the wrapper is visible
    const wrapper = document.getElementById('lapChartWrapper');
    if (wrapper) {
        wrapper.style.display = 'block';
        wrapper.style.visibility = 'visible';
        console.log('Set wrapper to visible');
    }
    
    // Initialize chart
    setTimeout(() => {
        try {
            const chart = new LapChart('lap-chart-container');
            window.lapChart = chart; // Global reference
            
            // Load test data if available
            if (typeof testLapData !== 'undefined') {
                console.log('Loading test data');
                chart.setLapsData(testLapData);
            }
        } catch (e) {
            console.error('Error initializing lap chart:', e);
        }
    }, 500);
});