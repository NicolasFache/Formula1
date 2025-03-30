class TireStrategy {
    constructor(containerId) {
        console.log('TireStrategy constructor called for:', containerId);
        
        // Container and data initialization code
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error(`Container with id "${containerId}" not found!`);
            
            // Try to create container as fallback
            const mainContent = document.querySelector('.main-content');
            if (mainContent) {
                this.container = document.createElement('div');
                this.container.id = containerId;
                this.container.className = 'tire-strategy-container';
                mainContent.appendChild(this.container);
                console.log('Created missing tire strategy container');
            } else {
                return;
            }
        }
        
        this.data = null;
        this.tireColors = {
            'Soft': '#E10600',
            'Medium': '#FFF200',
            'Hard': '#FFFFFF',
            'Intermediate': '#43B02A',
            'Wet': '#0067AD',
            'Unknown': '#666666'
        };
        
        // Initialize container
        this.initContainer();

        // Force visibility
        this.container.style.display = 'block';
        this.container.style.visibility = 'visible';
    }
    
    // Initialize container with HTML structure
    initContainer() {
        console.log('Initializing container...');
        this.container.innerHTML = `
            <div class="tire-strategy-header">
                <div class="ts-title">
                    <i class="fas fa-chart-bar"></i> TIRE STRATEGY
                </div>
                <div class="ts-legend">
                    <span class="ts-legend-item"><span class="ts-color-soft"></span> Soft</span>
                    <span class="ts-legend-item"><span class="ts-color-medium"></span> Medium</span>
                    <span class="ts-legend-item"><span class="ts-color-hard"></span> Hard</span>
                    <span class="ts-legend-item"><span class="ts-color-inter"></span> Intermediate</span>
                    <span class="ts-legend-item"><span class="ts-color-wet"></span> Wet</span>
                </div>
            </div>
            <div id="ts-chart-container"></div>
        `;
        
        // Add styles
        this.addStyles();
        
        // Get chart container
        this.chartElement = document.getElementById('ts-chart-container');
        if (!this.chartElement) {
            console.error('Chart container element not found!');
        }
    }
    
    // Add styles to document
    addStyles() {
        if (document.getElementById('ts-styles')) {
            console.log('Styles already exist, skipping...');
            return;
        }
        
        console.log('Adding tire strategy styles...');
        const style = document.createElement('style');
        style.id = 'ts-styles';
        style.textContent = `
            /* Tire Strategy Styles */
            .tire-strategy-container {
                background-color: #111217;
                padding: 20px;
                color: white;
                font-family: 'Roboto', sans-serif;
                border-radius: 12px;
                margin-bottom: 30px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
            }
            .tire-strategy-header {
                display: flex;
                justify-content: space-between;
                margin-bottom: 20px;
                flex-wrap: wrap;
            }
            .ts-title {
                font-size: 1.2rem;
                font-weight: bold;
                display: flex;
                align-items: center;
                gap: 10px;
            }
            .ts-legend {
                display: flex;
                gap: 15px;
                flex-wrap: wrap;
            }
            .ts-legend-item {
                display: flex;
                align-items: center;
                gap: 5px;
            }
            .ts-legend-item span:first-child {
                display: inline-block;
                width: 15px;
                height: 15px;
            }
            .ts-color-soft { background-color: #E10600; }
            .ts-color-medium { background-color: #FFF200; }
            .ts-color-hard { background-color: #FFFFFF; }
            .ts-color-inter { background-color: #43B02A; }
            .ts-color-wet { background-color: #0067AD; }
            
            /* Chart grid */
            .ts-grid {
                display: grid;
                grid-template-columns: 60px 1fr;
                min-height: 400px;
                margin-bottom: 10px;
            }
            .ts-drivers {
                display: flex;
                flex-direction: column;
                gap: 3px;
            }
            .ts-driver {
                height: 22px;
                display: flex;
                align-items: center;
                justify-content: flex-end;
                padding-right: 10px;
                font-weight: bold;
                color: #999;
            }
            .ts-data {
                display: flex;
                flex-direction: column;
                gap: 3px;
            }
            .ts-row {
                height: 22px;
                display: flex;
                align-items: center;
            }
            .ts-stint {
                height: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                font-size: 0.85rem;
                border-radius: 8px; /* Add rounded corners */
                margin: 0 1px; /* Add small margin between stints */
            }
            .ts-stint-Soft { background-color: #E10600; color: white; }
            .ts-stint-Medium { background-color: #FFF200; color: black; }
            .ts-stint-Hard { background-color: #FFFFFF; color: black; }
            .ts-stint-Intermediate { background-color: #43B02A; color: white; }
            .ts-stint-Wet { background-color: #0067AD; color: white; }
            .ts-stint-Unknown { background-color: #666666; color: white; }
            
            .ts-xaxis {
                display: flex;
                justify-content: space-between;
                padding-left: 60px;
                color: #999;
            }
            
            /* Tooltip */
            .ts-tooltip {
                position: fixed;
                display: none;
                background-color: rgba(0, 0, 0, 0.9);
                color: white;
                padding: 15px;
                border-radius: 8px;
                font-size: 0.9rem;
                z-index: 1000;
                min-width: 200px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.5);
            }
            .tire-tooltip-icon {
                width: 20px;
                height: 20px;
                object-fit: contain;
                vertical-align: middle;
                margin-right: 6px;
            }
            .tooltip-title {
                font-weight: bold;
                margin-bottom: 15px;
                text-align: center;
                border-bottom: 1px solid rgba(255,255,255,0.2);
                padding-bottom: 5px;
            }

            .tooltip-stint {
                margin-bottom: 8px;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            /* Loading and error messages */
            .tire-strategy-container .loading,
            .tire-strategy-container .error {
                padding: 20px;
                text-align: center;
            }
            
            .tire-strategy-container .error {
                color: #E10600;
            }
        `;
        
        document.head.appendChild(style);
        console.log('Tire strategy styles added');
    }
    
    // Set data and render chart
    setData(data) {
        console.log('Setting tire strategy data:', data);
        this.data = data;
        this.renderChart();
        return this;
    }
    
    // Render the chart
    renderChart() {
        console.log('Rendering tire strategy chart...', this.data);
        
        if (!this.chartElement) {
            console.error('Chart container element not found for rendering!');
            return;
        }
        
        // Make sure we have valid data
        if (!this.data || !this.data.results || !this.data.strategies) {
            console.error('Invalid data for rendering chart:', this.data);
            this.chartElement.innerHTML = '<div class="error">No strategy data available</div>';
            return;
        }
        
        // Get drivers in finishing position order
        const drivers = this.data.results.sort((a, b) => a.position - b.position);
        console.log(`Found ${drivers.length} drivers for chart`);
        
        // Find total laps from strategies
        let totalLaps = 0;
        for (const driverCode in this.data.strategies) {
            const stints = this.data.strategies[driverCode];
            for (const stint of stints) {
                const stintEnd = stint.startLap + stint.laps - 1;
                totalLaps = Math.max(totalLaps, stintEnd);
            }
        }
        
        // Round up to nearest 5
        totalLaps = Math.ceil(totalLaps / 5) * 5;
        if (totalLaps < 50) totalLaps = 57; // Default for races with incomplete data
        console.log('Total race laps:', totalLaps);
        
        // Create chart HTML
        let html = '<div class="ts-grid">';
        
        // Driver labels
        html += '<div class="ts-drivers">';
        for (const driver of drivers) {
            html += `<div class="ts-driver">${driver.code}</div>`;
        }
        html += '</div>';
        
        // Stint data
        html += '<div class="ts-data">';
        for (const driver of drivers) {
            html += '<div class="ts-row">';
            
            // Get stints for this driver
            const stints = this.data.strategies[driver.code] || [];
            
            // If no stints, show empty row
            if (stints.length === 0) {
                html += `<div class="ts-stint" style="width: 100%; background-color: #333; color: #999;">No data</div>`;
            } else {
                // Add each stint
                for (const stint of stints) {
                    const width = (stint.laps / totalLaps * 100).toFixed(2);
                    const compound = stint.compound;
                    const bgColor = this.tireColors[compound] || this.tireColors['Unknown'];
                    const textColor = (compound === 'Medium' || compound === 'Hard') ? 'black' : 'white';
                    
                    // For the tooltip information
                    const dataAttrs = `
                        data-driver="${driver.code}"
                        data-compound="${compound}"
                        data-start="${stint.startLap}"
                        data-laps="${stint.laps}"
                    `;
                    
                    html += `<div class="ts-stint ts-stint-${compound}" 
                            style="width: ${width}%; background-color: ${bgColor}; color: ${textColor}; border-radius: 8px; margin: 0 1px;" 
                            ${dataAttrs}>
                            ${stint.laps}
                        </div>`;
                }
            }
            
            html += '</div>';
        }
        html += '</div>';
        html += '</div>';
        
        // X-axis labels
        html += '<div class="ts-xaxis">';
        html += '<div>0</div><div>15</div><div>30</div>';
        if (totalLaps > 40) {
            html += `<div>${totalLaps}</div>`;
        }
        html += '</div>';
        
        // Add tooltip div
        html += '<div class="ts-tooltip" id="ts-tooltip"></div>';
        
        // Set HTML
        this.chartElement.innerHTML = html;
        console.log('Chart HTML rendered');
        
        // Add event listeners for tooltips
        const stints = this.chartElement.querySelectorAll('.ts-stint');
        stints.forEach(stint => {
            if (stint.dataset.driver) {
                stint.addEventListener('mouseover', (e) => this.showTooltip(e, stint));
                stint.addEventListener('mousemove', (e) => this.moveTooltip(e));
                stint.addEventListener('mouseout', () => this.hideTooltip());
            }
        });
        console.log('Added tooltip event listeners');
    }
    
    // Show tooltip
    showTooltip(event, stintElement) {
        const tooltip = document.getElementById('ts-tooltip');
        if (!tooltip) return;
        
        const driverCode = stintElement.dataset.driver;
        
        // Get driver data
        const driver = this.data.results.find(d => d.code === driverCode);
        const driverName = driver ? driver.name : driverCode;
        
        // Get ALL stints for this driver, not just the hovered one
        const allDriverStints = this.data.strategies[driverCode] || [];
        
        // Build tooltip title with driver info
        let tooltipContent = `<div class="tooltip-title">${driverCode} - ${driverName}</div>`;
        
        // Add each stint to the tooltip
        allDriverStints.forEach(stint => {
            const compound = stint.compound || 'Unknown';
            const laps = stint.laps;
            
            // Get the tire image path based on compound
            let tireImagePath = '';
            switch(compound.toLowerCase()) {
                case 'soft':
                    tireImagePath = '/images/tires/soft-tire.png';
                    break;
                case 'medium':
                    tireImagePath = '/images/tires/med-tire.png';
                    break;
                case 'hard':
                    tireImagePath = '/images/tires/hard-tire.png';
                    break;
                case 'intermediate':
                    tireImagePath = '/images/tires/inter-tire.png';
                    break;
                case 'wet':
                    tireImagePath = '/images/tires/wet-tire.png';
                    break;
                default:
                    tireImagePath = '/images/tires/soft-tire.png'; // Default fallback
            }
            
            // Add stint info to tooltip with tire image
            tooltipContent += `
                <div class="tooltip-stint">
                    <img src="${tireImagePath}" class="tire-tooltip-icon" alt="${compound}" />
                    <span style="font-weight:bold;">${compound.toUpperCase()}</span>: ${laps} Laps
                </div>
            `;
        });
        
        // Set tooltip content
        tooltip.innerHTML = tooltipContent;
        
        // Position the tooltip - ensure it stays within window boundaries
        const tooltipWidth = 220; // Slightly wider to accommodate images
        const tooltipHeight = 60 + (allDriverStints.length * 30); // Approximate height based on number of stints
        
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
        tooltip.style.left = `${x}px`;
        tooltip.style.top = `${y}px`;
        tooltip.style.display = 'block';
    }
    
    // Move tooltip with cursor
    moveTooltip(event) {
        const tooltip = document.getElementById('ts-tooltip');
        if (!tooltip) return;
        
        const tooltipWidth = tooltip.offsetWidth;
        const tooltipHeight = tooltip.offsetHeight;
        
        // Get window dimensions
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        
        // Base positioning
        let left = event.clientX + 15;
        let top = event.clientY - 15;
        
        // Adjust if would go off-screen
        if (left + tooltipWidth > windowWidth) {
            left = windowWidth - tooltipWidth - 10;
        }
        
        if (top + tooltipHeight > windowHeight) {
            top = windowHeight - tooltipHeight - 10;
        }
        
        // Apply position
        tooltip.style.left = left + 'px';
        tooltip.style.top = top + 'px';
    }
    
    // Hide tooltip
    hideTooltip() {
        const tooltip = document.getElementById('ts-tooltip');
        if (tooltip) tooltip.style.display = 'none';
    }
}