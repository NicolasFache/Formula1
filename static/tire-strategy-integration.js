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
    const container = document.getElementById('tire-strategy-container');
    if (!container) {
        console.error('Tire strategy container not found!');
        return;
    }
    
    // Show container
    container.style.display = 'block';
    
    // Show loading state
    container.innerHTML = '<div class="loading"><div class="spinner"></div><p>Loading strategy data...</p></div>';
    
    // Format the race_id properly for the API call
    const raceId = typeof race === 'string' ? 
        race.toLowerCase().replace(/\s+/g, '_') : race;
    
    // First, get the race data
    fetch(`/api/season/${season}/race/${raceId}/${sessionType}`)
        .then(response => {
            if (!response.ok) throw new Error(`Failed to load race data (${response.status})`);
            return response.json();
        })
        .then(raceData => {
            console.log('Race data received for strategy:', raceData);
            
            // Then get the lap data
            return fetch(`/api/season/${season}/race/${raceId}/${sessionType}/laps`)
                .then(response => {
                    if (!response.ok) throw new Error(`Failed to load laps data (${response.status})`);
                    return response.json();
                })
                .then(lapsData => {
                    console.log('Laps data received for strategy:', lapsData);
                    
                    // Build a proper strategy data object from race and laps data
                    const strategies = extractStrategyFromLaps(lapsData.lapsData);
                    
                    // Combine race data with strategies
                    const strategyData = {
                        ...raceData,
                        strategies: strategies
                    };
                    
                    console.log('Combined strategy data:', strategyData);
                    
                    // Render the strategy chart
                    try {
                        const chart = new TireStrategy('tire-strategy-container');
                        chart.setData(strategyData);
                        console.log('Strategy chart rendered successfully');
                    } catch (e) {
                        console.error('Error rendering strategy chart:', e);
                        container.innerHTML = `<div class="error">Error rendering chart: ${e.message}</div>`;
                    }
                });
        })
        .catch(error => {
            console.error('Error loading strategy data:', error);
            container.innerHTML = `<div class="error">Error loading strategy data: ${error.message}</div>`;
        });
}

function extractStrategyFromLaps(lapsData) {
    const strategies = {};
    
    // For each driver
    Object.entries(lapsData).forEach(([driverCode, laps]) => {
        strategies[driverCode] = [];
        
        // Skip if no laps
        if (!laps || laps.length === 0) return;
        
        // Sort laps by lap number
        const sortedLaps = [...laps].sort((a, b) => a.lap - b.lap);
        
        let currentStint = null;
        let previousLapNumber = 0;
        
        // Process each lap to identify stints
        sortedLaps.forEach((lap, index) => {
            const compound = lap.compound || 'Unknown';
            const lapNum = lap.lap;
            
            // Check for pit stops (gap in lap numbers larger than 1)
            const hasPitStop = index > 0 && lapNum > previousLapNumber + 1;
            
            // Start a new stint if:
            // 1. This is the first lap
            // 2. The compound has changed
            // 3. There's a gap in lap numbers (pit stop)
            const isNewStint = !currentStint || 
                               currentStint.compound !== compound ||
                               hasPitStop;
            
            if (isNewStint) {
                // Add the previous stint if it exists
                if (currentStint) {
                    strategies[driverCode].push(currentStint);
                }
                
                // Start a new stint
                currentStint = {
                    compound: compound,
                    laps: 1,
                    startLap: lapNum
                };
            } else {
                // Continue current stint
                currentStint.laps++;
            }
            
            // Remember this lap number for the next iteration
            previousLapNumber = lapNum;
        });
        
        // Add the final stint
        if (currentStint) {
            strategies[driverCode].push(currentStint);
        }
    });
    
    return strategies;
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