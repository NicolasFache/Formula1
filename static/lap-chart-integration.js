// lap-chart-integration.js - Integrates with app.js

document.addEventListener('DOMContentLoaded', function() {
    console.log('Lap chart integration script loaded');
    
    // Ensure the wrapper is visible
    const wrapper = document.getElementById('lapChartWrapper');
    if (wrapper) {
        wrapper.style.display = 'block';
        console.log('Set wrapper to display:block from integration script');
    }
    
    // Force initialize with test data as a fallback
    forceInitializeWithTestData();
    
    // Listen for tab changes to load lap data when appropriate
    setupTabListeners();
});

function forceInitializeWithTestData() {
    console.log('Force initializing with test data');
    
    // Create test data if it doesn't exist
    if (typeof testLapData === 'undefined') {
        console.log('Creating test data');
        window.testLapData = {
            'VER': [
                { lap: 1, time: '1:33.245', compound: 'Soft', tireAge: 1 },
                { lap: 2, time: '1:31.235', compound: 'Soft', tireAge: 2 },
                { lap: 3, time: '1:30.987', compound: 'Soft', tireAge: 3 },
                { lap: 4, time: '1:30.765', compound: 'Soft', tireAge: 4 },
                { lap: 5, time: '1:30.654', compound: 'Soft', tireAge: 5 }
            ],
            'HAM': [
                { lap: 1, time: '1:33.512', compound: 'Medium', tireAge: 1 },
                { lap: 2, time: '1:31.789', compound: 'Medium', tireAge: 2 },
                { lap: 3, time: '1:31.124', compound: 'Medium', tireAge: 3 },
                { lap: 4, time: '1:30.987', compound: 'Medium', tireAge: 4 },
                { lap: 5, time: '1:30.876', compound: 'Medium', tireAge: 5 }
            ],
            'LEC': [
                { lap: 1, time: '1:33.412', compound: 'Hard', tireAge: 1 },
                { lap: 2, time: '1:31.689', compound: 'Hard', tireAge: 2 },
                { lap: 3, time: '1:31.024', compound: 'Hard', tireAge: 3 },
                { lap: 4, time: '1:30.887', compound: 'Hard', tireAge: 4 },
                { lap: 5, time: '1:30.776', compound: 'Hard', tireAge: 5 }
            ]
        };
    }
    
    // Ensure the chart is created
    setTimeout(() => {
        if (typeof LapChart === 'undefined') {
            console.error('LapChart class not found!');
            return;
        }
        
        if (!window.lapChart) {
            console.log('Creating lap chart instance');
            try {
                window.lapChart = new LapChart('lap-chart-container');
            } catch (e) {
                console.error('Error creating lap chart:', e);
                return;
            }
        }
        
        // Set test data
        window.lapChart.setLapsData(window.testLapData);
        console.log('Test data loaded into chart');
    }, 500);
}

function setupTabListeners() {
    // IMPORTANT: This is a direct event listener on the document to catch all tab clicks
    // even those created dynamically after page load
    document.addEventListener('click', function(e) {
        const tabButton = e.target.closest('.tab-btn');
        if (tabButton) {
            const sessionType = tabButton.getAttribute('data-tab');
            console.log('Tab clicked:', sessionType);
            
            // Get current season and race from the UI
            const seasonText = document.querySelector('#seasonSelector .selector-text').textContent;
            const raceText = document.querySelector('#raceSelector .selector-text').textContent;
            
            // Only proceed if we have valid selections
            if (seasonText && raceText !== 'Select Race') {
                const season = seasonText.trim();
                const race = convertRaceNameToId(raceText.trim());
                
                console.log('Loading lap data for', season, race, sessionType);
                loadLapData(season, race, sessionType);
            } else {
                console.log('No race selected, not loading lap data');
                // If no race selected, still ensure test data is shown
                if (window.lapChart) {
                    window.lapChart.setLapsData(window.testLapData || {});
                }
            }
        }
    });
    
    // Also listen for race selection changes
    document.addEventListener('click', function(e) {
        if (e.target.closest('#raceDropdown .dropdown-item')) {
            setTimeout(() => {
                const activeTab = document.querySelector('.tab-btn.active');
                if (activeTab) {
                    const sessionType = activeTab.getAttribute('data-tab');
                    const seasonText = document.querySelector('#seasonSelector .selector-text').textContent;
                    const raceText = document.querySelector('#raceSelector .selector-text').textContent;
                    
                    if (seasonText && raceText !== 'Select Race') {
                        const season = seasonText.trim();
                        const race = convertRaceNameToId(raceText.trim());
                        
                        console.log('Race changed, loading lap data for', season, race, sessionType);
                        loadLapData(season, race, sessionType);
                    }
                }
            }, 300);
        }
    });

    // Also listen for season selection changes
    document.addEventListener('click', function(e) {
        if (e.target.closest('#seasonDropdown .dropdown-item')) {
            setTimeout(() => {
                const activeTab = document.querySelector('.tab-btn.active');
                if (activeTab) {
                    const sessionType = activeTab.getAttribute('data-tab');
                    const seasonText = document.querySelector('#seasonSelector .selector-text').textContent;
                    const raceText = document.querySelector('#raceSelector .selector-text').textContent;
                    
                    if (seasonText && raceText !== 'Select Race') {
                        const season = seasonText.trim();
                        const race = convertRaceNameToId(raceText.trim());
                        
                        console.log('Season changed, loading lap data for', season, race, sessionType);
                        loadLapData(season, race, sessionType);
                    }
                }
            }, 300);
        }
    });
    
    // Check if data is already loaded when content becomes visible
    // This uses a MutationObserver to detect when the race content is shown
    const raceContent = document.getElementById('raceContent');
    if (raceContent) {
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'attributes' && 
                    mutation.attributeName === 'style' && 
                    raceContent.style.display !== 'none') {
                    
                    console.log('Race content became visible');
                    
                    const activeTab = document.querySelector('.tab-btn.active');
                    const seasonText = document.querySelector('#seasonSelector .selector-text').textContent;
                    const raceText = document.querySelector('#raceSelector .selector-text').textContent;
                    
                    if (activeTab && seasonText && raceText !== 'Select Race') {
                        const sessionType = activeTab.getAttribute('data-tab');
                        const season = seasonText.trim();
                        const race = convertRaceNameToId(raceText.trim());
                        
                        console.log('Loading lap data after content became visible', season, race, sessionType);
                        loadLapData(season, race, sessionType);
                    }
                }
            });
        });
        
        observer.observe(raceContent, { attributes: true });
    }
}

function convertRaceNameToId(raceName) {
    return raceName.toLowerCase().replace(/\s+/g, '_');
}

function loadLapData(season, race, sessionType) {
    // Skip if sessionType is not a valid session for lap data
    if (!sessionType || typeof sessionType !== 'string') {
        console.warn('Invalid session type for lap data:', sessionType);
        return;
    }
    
    // Ensure the wrapper is visible
    const wrapper = document.getElementById('lapChartWrapper');
    if (wrapper) {
        wrapper.style.display = 'block';
    }
    
    // Show loading message
    const container = document.getElementById('lap-chart-container');
    if (container && window.lapChart && window.lapChart.container) {
        container.innerHTML = '<div class="loading" style="display:flex;justify-content:center;align-items:center;height:100%;"><div class="spinner"></div><p>Loading lap data...</p></div>';
    }
    
    // Recreate the chart instance to avoid issues
    setTimeout(() => {
        try {
            if (typeof LapChart !== 'undefined') {
                window.lapChart = new LapChart('lap-chart-container');
            }
        } catch (e) {
            console.error('Error recreating lap chart:', e);
        }
        
        console.log(`Fetching lap data for ${season} ${race} ${sessionType}`);
        
        // Fetch lap data from API with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
        
        fetch(`/api/season/${season}/race/${race}/${sessionType}/laps`, {
            signal: controller.signal
        })
            .then(response => {
                clearTimeout(timeoutId);
                
                if (!response.ok) {
                    if (response.status === 404) {
                        throw new Error('No lap data available for this session');
                    }
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (data && data.lapsData && Object.keys(data.lapsData).length > 0) {
                    console.log('Lap data received:', Object.keys(data.lapsData).length, 'drivers');
                    
                    // Load the data into the chart
                    if (window.lapChart && typeof window.lapChart.setLapsData === 'function') {
                        window.lapChart.setLapsData(data.lapsData);
                    } else if (typeof LapChart !== 'undefined') {
                        // If chart instance doesn't exist, create one
                        console.log('Creating new chart instance');
                        window.lapChart = new LapChart('lap-chart-container');
                        window.lapChart.setLapsData(data.lapsData);
                    } else {
                        console.error('LapChart class or instance not found!');
                        useTestDataFallback(container);
                    }
                } else {
                    throw new Error('No lap data available or empty response');
                }
            })
            .catch(error => {
                console.error('Error fetching lap data:', error);
                useTestDataFallback(container);
            });
    }, 100);
}

function useTestDataFallback(container) {
    // Show error message if container exists
    if (container) {
        container.innerHTML = '<div style="color:#ff9900;text-align:center;padding:20px;">Failed to load lap data. Using sample data instead.</div>';
    }
    
    // Use test data as fallback
    setTimeout(() => {
        try {
            // Recreate chart if needed
            if (!window.lapChart && typeof LapChart !== 'undefined') {
                window.lapChart = new LapChart('lap-chart-container');
            }
            
            // Set test data
            if (window.lapChart && typeof window.lapChart.setLapsData === 'function') {
                window.lapChart.setLapsData(window.testLapData || {});
                console.log('Test data loaded into chart');
            }
        } catch (e) {
            console.error('Error loading test data:', e);
        }
    }, 500);
}

// Add debug information to window
window.lapChartDebug = {
    forceTestData: function() {
        forceInitializeWithTestData();
        return "Test data forced";
    },
    getLapChartStatus: function() {
        return {
            wrapper: document.getElementById('lapChartWrapper'),
            container: document.getElementById('lap-chart-container'),
            lapChartExists: typeof LapChart !== 'undefined',
            chartInstanceExists: !!window.lapChart,
            testDataExists: typeof testLapData !== 'undefined',
            activeTab: document.querySelector('.tab-btn.active')?.getAttribute('data-tab')
        };
    },
    reloadCurrentData: function() {
        const activeTab = document.querySelector('.tab-btn.active');
        if (activeTab) {
            const sessionType = activeTab.getAttribute('data-tab');
            const seasonText = document.querySelector('#seasonSelector .selector-text').textContent;
            const raceText = document.querySelector('#raceSelector .selector-text').textContent;
            
            if (seasonText && raceText !== 'Select Race') {
                const season = seasonText.trim();
                const race = convertRaceNameToId(raceText.trim());
                loadLapData(season, race, sessionType);
                return `Reloading data for ${season} ${race} ${sessionType}`;
            }
        }
        return "No active tab or race found";
    }
};