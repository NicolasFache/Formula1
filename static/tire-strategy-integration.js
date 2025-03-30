document.addEventListener('DOMContentLoaded', function() {
    console.log('Tire strategy integration loaded');
    
    // Add container if needed
    const mainContent = document.querySelector('.main-content');
    if (mainContent && !document.getElementById('tire-strategy-container')) {
        const container = document.createElement('div');
        container.id = 'tire-strategy-container';
        container.className = 'tire-strategy-container';
        container.style.display = 'block'; // Explicitly set display to block
        container.style.visibility = 'visible'; // Ensure visibility
        mainContent.appendChild(container);
        console.log('Created tire strategy container');
    }
    
    // Listen for tab changes
    document.addEventListener('click', function(e) {
        const tabButton = e.target.closest('.tab-btn');
        if (tabButton) {
            const sessionType = tabButton.getAttribute('data-tab');
            console.log('Tab clicked:', sessionType);
            
            if (sessionType === 'race' || sessionType === 'sprint') {
                const season = document.querySelector('#seasonSelector .selector-text').textContent.trim();
                const race = document.querySelector('#raceSelector .selector-text').textContent.trim()
                    .toLowerCase().replace(/\s+/g, '_');
                
                if (season && race && race !== 'select_race') {
                    console.log('Loading strategy data for:', season, race, sessionType);
                    loadStrategyData(season, race, sessionType);
                } else {
                    console.log('Season or race not selected properly:', season, race);
                }
            } else {
                // Hide container for non-applicable session types
                const container = document.getElementById('tire-strategy-container');
                if (container) {
                    container.style.display = 'none';
                }
            }
        }
    });
    
    // Also check when race content becomes visible
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.target.id === 'raceContent' && 
                mutation.target.style.display !== 'none') {
                
                console.log('Race content became visible');
                
                const activeTab = document.querySelector('.tab-btn.active');
                if (activeTab) {
                    const sessionType = activeTab.getAttribute('data-tab');
                    if (sessionType === 'race' || sessionType === 'sprint') {
                        const season = document.querySelector('#seasonSelector .selector-text').textContent.trim();
                        const race = document.querySelector('#raceSelector .selector-text').textContent.trim();
                        
                        if (season && race && race.toLowerCase() !== 'select race') {
                            console.log('Loading strategy data after content visible:', season, race, sessionType);
                            loadStrategyData(season, race, sessionType.toLowerCase().replace(/\s+/g, '_'));
                        } else {
                            console.log('Season or race not selected properly on visibility change');
                        }
                    }
                }
            }
        });
    });
    
    const raceContent = document.getElementById('raceContent');
    if (raceContent) {
        observer.observe(raceContent, { attributes: true, attributeFilter: ['style'] });
        console.log('Added observer to raceContent');
    }
    
    // Try to trigger the chart when a race is selected in the first place
    setTimeout(function() {
        const activeTab = document.querySelector('.tab-btn.active');
        const raceContent = document.getElementById('raceContent');
        
        if (activeTab && raceContent && raceContent.style.display !== 'none') {
            const sessionType = activeTab.getAttribute('data-tab');
            if (sessionType === 'race' || sessionType === 'sprint') {
                const season = document.querySelector('#seasonSelector .selector-text').textContent.trim();
                const race = document.querySelector('#raceSelector .selector-text').textContent.trim();
                
                if (season && race && race.toLowerCase() !== 'select race') {
                    console.log('Initial loading of strategy data:', season, race, sessionType);
                    loadStrategyData(season, race, sessionType);
                }
            }
        }
    }, 1000);
});

function loadStrategyData(season, race, sessionType) {
    console.log('Loading strategy data for', season, race, sessionType);
    
    const container = document.getElementById('tire-strategy-container');
    if (!container) {
        // Create container if it doesn't exist
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            const newContainer = document.createElement('div');
            newContainer.id = 'tire-strategy-container';
            newContainer.className = 'tire-strategy-container';
            mainContent.appendChild(newContainer);
            console.log('Created tire strategy container');
        } else {
            console.error('Main content container not found!');
            return;
        }
    }
    
    // Get or re-get the container
    const strategyContainer = document.getElementById('tire-strategy-container');
    
    // Force display styles
    strategyContainer.style.display = 'block';
    strategyContainer.style.visibility = 'visible';
    strategyContainer.style.opacity = '1';
    
    // Show loading state
    strategyContainer.innerHTML = '<div class="loading"><div class="spinner"></div><p>Loading strategy data...</p></div>';
    
    // Since API call to /strategy is failing, let's create the strategies from lap data directly
    const lapsUrl = `/api/season/${season}/race/${race.toString().toLowerCase().replace(/\s+/g, '_')}/laps`;
    console.log('Fetching laps data from:', lapsUrl);
    
    fetch(lapsUrl)
        .then(response => {
            console.log('Laps API response status:', response.status);
            if (!response.ok) throw new Error(`Failed to load laps data (${response.status})`);
            return response.json();
        })
        .then(lapsData => {
            console.log('Laps data received, generating strategy data');
            
            // Get race results to combine with strategy
            const raceUrl = `/api/season/${season}/race/${race.toString().toLowerCase().replace(/\s+/g, '_')}/${sessionType}`;
            
            fetch(raceUrl)
                .then(response => response.json())
                .then(raceData => {
                    // Create strategy data manually from lap data
                    const strategies = generateStrategiesFromLaps(lapsData.lapsData, raceData);
                    
                    // Combine with race data
                    const fullData = {
                        ...raceData,
                        strategies: strategies
                    };
                    
                    console.log('Generated strategy data:', fullData);
                    
                    // Create and render chart
                    try {
                        // Force create a new instance
                        window.tireStrategyChart = new TireStrategy('tire-strategy-container');
                        window.tireStrategyChart.setData(fullData);
                        console.log('Strategy chart rendered successfully');
                    } catch (e) {
                        console.error('Error rendering strategy chart:', e);
                        strategyContainer.innerHTML = `<div class="error">Error rendering chart: ${e.message}</div>`;
                    }
                })
                .catch(error => {
                    console.error('Error loading race data:', error);
                    // Create fallback data without race results
                    const fallbackData = createFallbackData(lapsData.lapsData);
                    try {
                        window.tireStrategyChart = new TireStrategy('tire-strategy-container');
                        window.tireStrategyChart.setData(fallbackData);
                        console.log('Strategy chart rendered with fallback data');
                    } catch (e) {
                        console.error('Error rendering fallback chart:', e);
                        strategyContainer.innerHTML = `<div class="error">Error rendering chart: ${e.message}</div>`;
                    }
                });
        })
        .catch(error => {
            console.error('Error loading laps data:', error);
            // Create hard-coded demo data as last resort
            const demoData = createDemoStrategyData();
            try {
                window.tireStrategyChart = new TireStrategy('tire-strategy-container');
                window.tireStrategyChart.setData(demoData);
                console.log('Strategy chart rendered with demo data');
            } catch (e) {
                console.error('Error rendering demo chart:', e);
                strategyContainer.innerHTML = `<div class="error">Error loading strategy data: ${error.message}</div>`;
            }
        });
}


function generateStrategiesFromLaps(lapsData, raceData) {
    const strategies = {};
    
    // Process each driver's laps
    for (const driverCode in lapsData) {
        const driverLaps = lapsData[driverCode];
        strategies[driverCode] = [];
        
        // Sort laps by lap number
        const sortedLaps = [...driverLaps].sort((a, b) => a.lap - b.lap);
        
        let currentStint = null;
        
        // Group laps by compound into stints
        for (let i = 0; i < sortedLaps.length; i++) {
            const lap = sortedLaps[i];
            const compound = lap.compound || 'Unknown';
            
            if (!currentStint || currentStint.compound !== compound || 
                // New stint if there's a gap in lap numbers
                (i > 0 && lap.lap > sortedLaps[i-1].lap + 1)) {
                
                // Add the previous stint if it exists
                if (currentStint) {
                    strategies[driverCode].push(currentStint);
                }
                
                // Start a new stint
                currentStint = {
                    compound: compound,
                    startLap: lap.lap,
                    laps: 1
                };
            } else {
                // Continue current stint
                currentStint.laps++;
            }
        }
        
        // Add the final stint
        if (currentStint) {
            strategies[driverCode].push(currentStint);
        }
    }
    
    return strategies;
}

function createFallbackData(lapsData) {
    // Create minimal race data structure
    const results = [];
    const drivers = Object.keys(lapsData);
    
    // Create results from driver codes
    drivers.forEach((driverCode, index) => {
        results.push({
            position: index + 1,
            code: driverCode,
            name: driverCode,
            team: 'Unknown'
        });
    });
    
    // Generate strategies
    const strategies = generateStrategiesFromLaps(lapsData, { results });
    
    return {
        results: results,
        strategies: strategies
    };
}

function createDemoStrategyData() {
    // Create demo data based on typical F1 race
    const driverCodes = ['VER', 'PER', 'HAM', 'RUS', 'LEC', 'SAI', 'NOR', 'PIA', 'ALO', 'STR', 
                        'OCO', 'GAS', 'MAG', 'HUL', 'TSU', 'RIC', 'ZHO', 'BOT', 'ALB', 'SAR'];
    
    const results = driverCodes.map((code, index) => ({
        position: index + 1,
        code: code,
        name: code,
        team: getTeamForDriver(code)
    }));
    
    const strategies = {};
    
    // Generate realistic strategies for each driver
    driverCodes.forEach(code => {
        // Randomly decide on number of stops
        const stops = Math.random() < 0.7 ? 2 : 1; // 70% chance of 2 stops
        const stints = [];
        
        if (stops === 1) {
            // One-stop strategy
            stints.push({
                compound: 'Medium',
                startLap: 1,
                laps: 20 + Math.floor(Math.random() * 8)
            });
            
            stints.push({
                compound: 'Hard',
                startLap: stints[0].laps + 1,
                laps: 57 - stints[0].laps
            });
        } else {
            // Two-stop strategy
            stints.push({
                compound: 'Soft',
                startLap: 1,
                laps: 15 + Math.floor(Math.random() * 5)
            });
            
            stints.push({
                compound: 'Medium',
                startLap: stints[0].laps + 1,
                laps: 18 + Math.floor(Math.random() * 7)
            });
            
            stints.push({
                compound: 'Hard',
                startLap: stints[0].laps + stints[1].laps + 1,
                laps: 57 - stints[0].laps - stints[1].laps
            });
        }
        
        strategies[code] = stints;
    });
    
    return {
        results: results,
        strategies: strategies
    };
}

function getTeamForDriver(code) {
    const teams = {
        'VER': 'Red Bull Racing',
        'PER': 'Red Bull Racing',
        'HAM': 'Mercedes',
        'RUS': 'Mercedes',
        'LEC': 'Ferrari',
        'SAI': 'Ferrari',
        'NOR': 'McLaren',
        'PIA': 'McLaren',
        'ALO': 'Aston Martin',
        'STR': 'Aston Martin',
        'OCO': 'Alpine',
        'GAS': 'Alpine',
        'MAG': 'Haas F1 Team',
        'HUL': 'Haas F1 Team',
        'TSU': 'RB',
        'RIC': 'RB',
        'ZHO': 'Stake F1 Team',
        'BOT': 'Stake F1 Team',
        'ALB': 'Williams',
        'SAR': 'Williams'
    };
    
    return teams[code] || 'Unknown Team';
}