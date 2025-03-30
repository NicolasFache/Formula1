document.addEventListener('DOMContentLoaded', function() {
    // API Base URL - change this to match your backend server address
    const API_BASE_URL = 'http://localhost:5000/api';
    
    // DOM elements
    const seasonSelector = document.getElementById('seasonSelector');
    const seasonDropdown = document.getElementById('seasonDropdown');
    const seasonText = seasonSelector.querySelector('.selector-text');
    
    const raceSelector = document.getElementById('raceSelector');
    const raceDropdown = document.getElementById('raceDropdown');
    const raceText = raceSelector.querySelector('.selector-text');
    
    const tabButtons = document.querySelectorAll('.tab-btn');
    
    const loadingIndicator = document.getElementById('loadingIndicator');
    const noDataMessage = document.getElementById('noDataMessage');
    const raceContent = document.getElementById('raceContent');
    
    const topDrivers = document.getElementById('topDrivers');
    const fastestLap = document.getElementById('fastestLap');
    const raceTitle = document.getElementById('raceTitle');
    const trackSection = document.getElementById('trackSection');
    const resultsTable = document.getElementById('resultsTable');
    
    // State variables
    let currentSeason = 2024; // Start with 2024 which should have good data coverage
    let currentRace = null;
    let currentSession = 'race';
    let availableSeasons = [];
    let availableRaces = [];
    let isSprintWeekend = false;
    let hasSprintQualifying = false;
    
    // Initialize the UI
    initializeUI();
    
    // Test API connection first
    testAPIConnection();
    
    // Setup event listeners
    setupEventListeners();
    
    // Functions
    function initializeUI() {
        // Hide race content initially
        raceContent.style.display = 'none';
        loadingIndicator.classList.add('active');
        
        // Remove existing tab buttons (they'll be added dynamically)
        document.querySelector('.tab-nav').innerHTML = '';
        
        // Add version info to page
        const footerDiv = document.createElement('div');
        footerDiv.style.textAlign = 'center';
        footerDiv.style.marginTop = '30px';
        footerDiv.style.marginBottom = '20px';
        footerDiv.style.color = '#666';
        footerDiv.style.fontSize = '0.8rem';
        footerDiv.textContent = 'F1 Dashboard v1.1';
        document.querySelector('.container').appendChild(footerDiv);
    }
    
    // Test API connection
    async function testAPIConnection() {
        try {
            console.log("Testing API connection...");
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
            
            const response = await fetch(`${API_BASE_URL}/test`, {
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`API test failed with status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log("API connection successful:", data);
            
            // Now that we know the API is working, fetch seasons
            fetchSeasons();
            
        } catch (error) {
            console.error("API connection test failed:", error);
            let errorMessage = "Failed to connect to the API server.";
            
            if (error.name === 'AbortError') {
                errorMessage = "Connection to API server timed out. Please check if the server is running.";
            }
            
            showError(errorMessage);
            loadingIndicator.classList.remove('active');
        }
    }

    document.addEventListener('click', function(e) {
        const tabButton = e.target.closest('.tab-btn');
        if (tabButton) {
            // Update active tab
            document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
            tabButton.classList.add('active');
            
            // Update current session
            currentSession = tabButton.dataset.tab;
            
            // Load race data if a race is selected
            if (currentRace) {
                // Show loading indicator
                loadingIndicator.classList.add('active');
                raceContent.style.display = 'none';
                
                // Load the data for the new tab
                loadRaceData(currentSeason, currentRace, currentSession);
            }
        }
    });
    
    function setupEventListeners() {
        // Season selector dropdown toggle
        seasonSelector.addEventListener('click', function(e) {
            if (e.target.closest('.dropdown-item')) return;
            this.classList.toggle('active');
            
            // Close other dropdowns
            if (this.classList.contains('active')) {
                raceSelector.classList.remove('active');
            }
        });
        
        // Race selector dropdown toggle
        raceSelector.addEventListener('click', function(e) {
            if (e.target.closest('.dropdown-item')) return;
            this.classList.toggle('active');
            
            // Close other dropdowns
            if (this.classList.contains('active')) {
                seasonSelector.classList.remove('active');
            }
        });
        
        // Note: Tab button event handlers are now using event delegation at the document level
        
        // Close dropdowns when clicking outside
        document.addEventListener('click', function(e) {
            if (!e.target.closest('.selector')) {
                document.querySelectorAll('.selector').forEach(selector => {
                    selector.classList.remove('active');
                });
            }
        });
    }
    
    async function fetchSeasons() {
        try {
            loadingIndicator.classList.add('active');
            console.log("Fetching seasons...");
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            
            const response = await fetch(`${API_BASE_URL}/seasons`, {
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`Failed to fetch seasons: ${response.status} ${response.statusText}`);
            }
            
            availableSeasons = await response.json();
            console.log("Fetched seasons:", availableSeasons);
            
            // Sort seasons in descending order (newest first)
            availableSeasons.sort((a, b) => b - a);
            
            // Populate the dropdown
            populateSeasonDropdown(availableSeasons);
            
            // Load races for the current season
            fetchRaces(currentSeason);
            
        } catch (error) {
            console.error('Error fetching seasons:', error);
            showError('Failed to load seasons. Please check the server logs.');
            loadingIndicator.classList.remove('active');
            
            // Use hardcoded seasons as fallback
            const fallbackSeasons = [2023, 2022, 2021, 2020, 2019, 2018];
            populateSeasonDropdown(fallbackSeasons);
            fetchRaces(currentSeason);
        }
    }
    
    function populateSeasonDropdown(seasons) {
        seasonDropdown.innerHTML = '';
        
        seasons.forEach(season => {
            const item = document.createElement('div');
            item.className = 'dropdown-item';
            if (season === currentSeason) {
                item.classList.add('selected');
            }
            item.textContent = season;
            item.dataset.value = season;
            
            item.addEventListener('click', () => {
                currentSeason = parseInt(item.dataset.value);
                seasonText.textContent = currentSeason;
                seasonSelector.classList.remove('active');
                
                // Update UI
                document.querySelectorAll('#seasonDropdown .dropdown-item').forEach(el => {
                    el.classList.remove('selected');
                });
                item.classList.add('selected');
                
                // Reset race selection
                currentRace = null;
                raceText.textContent = 'Select Race';
                
                // Hide race content
                raceContent.style.display = 'none';
                
                // Load races for the selected season
                fetchRaces(currentSeason);
            });
            
            seasonDropdown.appendChild(item);
        });
    }
    
    async function fetchRaces(season) {
        try {
            loadingIndicator.classList.add('active');
            console.log(`Fetching races for season ${season}...`);
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
            
            const response = await fetch(`${API_BASE_URL}/season/${season}/races`, {
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`Failed to fetch races for season ${season}: ${response.status} ${response.statusText}`);
            }
            
            const responseText = await response.text();
            
            try {
                // Try to parse the response as JSON
                availableRaces = JSON.parse(responseText);
            } catch (parseError) {
                console.error('Error parsing races JSON:', parseError);
                console.log('Raw response:', responseText);
                throw new Error('Invalid JSON response received for races');
            }
            
            console.log(`Fetched ${availableRaces.length} races for season ${season}:`, availableRaces);
            
            // Sort races by round number if available
            if (availableRaces.length > 0 && 'round' in availableRaces[0]) {
                availableRaces.sort((a, b) => a.round - b.round);
            }
            
            // Populate race dropdown
            populateRaceDropdown(availableRaces);
            
            loadingIndicator.classList.remove('active');
            
        } catch (error) {
            console.error('Error fetching races:', error);
            showError(`Failed to load races for season ${season}. Please check the server logs.`);
            
            // Use fallback races data
            const fallbackRaces = [
                { id: "bahrain", name: "Bahrain Grand Prix", round: 1 },
                { id: "saudi_arabia", name: "Saudi Arabian Grand Prix", round: 2 },
                { id: "australia", name: "Australian Grand Prix", round: 3 },
                { id: "china", name: "Chinese Grand Prix", round: 4 },
                { id: "miami", name: "Miami Grand Prix", round: 5 },
                { id: "monaco", name: "Monaco Grand Prix", round: 7 }
            ];
            
            populateRaceDropdown(fallbackRaces);
            loadingIndicator.classList.remove('active');
        }
    }
    
    function populateRaceDropdown(races) {
        raceDropdown.innerHTML = '';
        
        races.forEach(race => {
            const item = document.createElement('div');
            item.className = 'dropdown-item';
            item.textContent = race.name;
            item.dataset.value = race.id;
            
            item.addEventListener('click', () => {
                // Use the new selectRace function instead of inline code
                selectRace(race.id, race.name);
            });
            
            raceDropdown.appendChild(item);
        });
    }
    
    async function loadRaceData(season, race, session) {
        // Show loading indicator
        loadingIndicator.classList.add('active');
        raceContent.style.display = 'none';
        noDataMessage.classList.remove('active');
        
        console.log(`Loading ${session} data for ${season} ${race}...`);
        
        try {
            // Set a timeout for the fetch operation
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
            
            const response = await fetch(
                `${API_BASE_URL}/season/${season}/race/${race}/${session}`,
                { signal: controller.signal }
            );
            
            // Clear the timeout
            clearTimeout(timeoutId);
            
            if (response.status === 404) {
                // No data available for this session
                console.log(`No data available for ${season} ${race} ${session}`);
                loadingIndicator.classList.remove('active');
                noDataMessage.classList.add('active');
                
                // Also notify the lap chart to use test data
                if (window.lapChartDebug && typeof window.lapChartDebug.forceTestData === 'function') {
                    window.lapChartDebug.forceTestData();
                }
                
                return;
            }
            
            if (!response.ok) {
                throw new Error(`Failed to fetch ${session} data: ${response.status} ${response.statusText}`);
            }
            
            // Read the response as text first
            const responseText = await response.text();
            
            // Try to parse as JSON
            let raceData;
            try {
                raceData = JSON.parse(responseText);
            } catch (parseError) {
                console.error('Error parsing race data JSON:', parseError);
                console.log('Raw response:', responseText);
                throw new Error('Invalid JSON response received for race data');
            }
            
            console.log(`Loaded ${session} data for ${season} ${race}:`, raceData);
            
            // Check if we have valid data
            if (!raceData || !raceData.results || raceData.results.length === 0) {
                console.log(`Invalid or empty data received for ${season} ${race} ${session}`);
                loadingIndicator.classList.remove('active');
                noDataMessage.classList.add('active');
                return;
            }
            
            // Populate UI with race data
            populateRaceUI(raceData);

            if (session === 'race' || session === 'sprint') {
                console.log('Attempting to load tire strategy data...');
                if (typeof loadStrategyData === 'function') {
                    loadStrategyData(season, race, session);
                }
            }
            
            // Hide loading indicator and show race content
            loadingIndicator.classList.remove('active');
            raceContent.style.display = 'flex'; // Changed from 'block' to 'flex' to maintain layout
            
            // Also ensure lap chart data is loaded
            setTimeout(() => {
                if (window.lapChartDebug && typeof window.lapChartDebug.reloadCurrentData === 'function') {
                    window.lapChartDebug.reloadCurrentData();
                }
            }, 500);
            
        } catch (error) {
            console.error('Error loading race data:', error);
            
            // Check if this was a timeout
            if (error.name === 'AbortError') {
                showError('Request timed out. The server might still be loading data from FastF1.');
            } else {
                showError(`Failed to load ${session} data: ${error.message}`);
            }
            
            loadingIndicator.classList.remove('active');
            noDataMessage.classList.add('active');
        }

        if ((session === 'race' || session === 'sprint') && typeof loadStrategyData === 'function') {
            console.log('Triggering tire strategy data load for', season, race, session);
            // Small delay to ensure race content is fully visible first
            setTimeout(() => {
                loadStrategyData(season, race, session);
            }, 1000);
        }
    }
    
    function populateRaceUI(raceData) {
        // Make sure we have results
        if (!raceData.results || raceData.results.length === 0) {
            showError("No results available for this session");
            noDataMessage.classList.add('active');
            return;
        }
        
        try {
            // Populate top 3 drivers
            populateTopDrivers(raceData.results.slice(0, 3));
            
            // Populate fastest lap
            populateFastestLap(raceData.fastestLap);
            
            // Populate race title
            populateRaceTitle(raceData);
            
            // Populate track info
            populateTrackInfo(raceData.trackInfo);
            
            // Populate results table
            populateResultsTable(raceData.results);
        } catch (error) {
            console.error('Error populating UI with race data:', error);
            showError(`Error displaying race data: ${error.message}`);
        }

        // Trigger tire strategy loading for race sessions
        if (currentSession === 'race' || currentSession === 'sprint') {
            console.log('Triggering tire strategy load for', currentSeason, currentRace, currentSession);
            if (typeof loadStrategyData === 'function') {
                setTimeout(() => {
                    loadStrategyData(currentSeason, currentRace, currentSession);
                }, 1000); // Small delay to ensure race data is fully loaded
            }
        }
    }
    
    function populateTopDrivers(top3) {
        topDrivers.innerHTML = '';
        
        top3.forEach((driver, index) => {
            const position = index + 1;
            
            const driverCard = document.createElement('div');
            driverCard.className = 'driver-card';
            
            // Define the background class based on team
            const teamBgClass = getTeamBackgroundClass(driver.team);
            
            // Construct image path for driver
            const driverCode = driver.code.toLowerCase();
            
            driverCard.innerHTML = `
                <div class="driver-bg ${teamBgClass}">
                    <img src="images/drivers/${driverCode}.png" alt="${driver.name}" class="driver-image" onerror="this.src='images/drivers/default.png'">
                    <img src="images/teams/${getTeamCode(driver.team)}.png" alt="${driver.team} Logo" class="team-logo" onerror="this.src='images/teams/default.png'">
                    <div class="driver-info">
                        <div class="driver-code">${driver.code}</div>
                        <div class="driver-position">P${position}</div>
                        ${position === 1 
                            ? '<div class="driver-status">Leader</div>' 
                            : `<div class="time-gap">${driver.gap}</div>`}
                    </div>
                </div>
            `;
            
            topDrivers.appendChild(driverCard);
        });
    }
    
    // Updated populateFastestLap function to keep exactly 3 decimal places
    function populateFastestLap(fastestLapData) {
        if (!fastestLapData) {
            fastestLap.style.display = 'none';
            return;
        }
        
        fastestLap.style.display = 'flex';
        
        // Format lap time to remove 0days and 00: prefix, but keep exactly 3 decimal places
        let formattedTime = fastestLapData.time;
        
        // Remove "0 days " if present
        formattedTime = formattedTime.replace(/^0 days /, '');
        
        // Remove leading "00:" if present
        formattedTime = formattedTime.replace(/^00:/, '');
        
        // Ensure exactly 3 decimal places
        if (formattedTime.includes('.')) {
            // Extract the parts before and after the decimal point
            const parts = formattedTime.split('.');
            const wholePart = parts[0];
            let decimalPart = parts[1] || '';
            
            // Ensure exactly 3 digits for decimal part
            if (decimalPart.length > 3) {
                // Truncate to 3 decimal places
                decimalPart = decimalPart.substring(0, 3);
            } else while (decimalPart.length < 3) {
                // Pad with zeros if needed
                decimalPart += '0';
            }
            
            formattedTime = `${wholePart}.${decimalPart}`;
        } else {
            // If no decimal point, add .000
            formattedTime += '.000';
        }
        
        // Create the new fastest lap layout that matches the example
        fastestLap.innerHTML = `
            <div class="lap-title">
                <i class="fas fa-stopwatch"></i> FASTEST LAP
            </div>
            
            <div class="lap-time">
                <i class="fas fa-circle" style="color: #ff3a3a;"></i>
                ${formattedTime} <span class="lap-time-driver">· ${fastestLapData.driver}</span>
            </div>
            
            <div class="lap-info">
                <div class="lap-detail">
                    <i class="fas fa-flag-checkered"></i> Lap ${fastestLapData.lap}
                </div>
                
                <div class="lap-detail">
                    <i class="fas fa-circle"></i> Used Tires
                </div>
                
                <div class="lap-detail">
                    <i class="fas fa-heart"></i> Tire Age: ${fastestLapData.tireAge} laps
                </div>
            </div>
        `;
    }
    
    function populateRaceTitle(raceData) {
        // Get flag image or use placeholder
        const countryCode = getCountryCode(raceData.country);
        const flagSrc = `images/flags/${countryCode}.png`;
        
        raceTitle.innerHTML = `
            <img src="${flagSrc}" alt="${raceData.country} Flag" class="country-flag" onerror="this.src='images/flags/default.png'">
            <div class="race-name">FORMULA 1 ${raceData.sponsor} ${raceData.name} ${raceData.year}</div>
        `;
    }
    
    function populateTrackInfo(trackInfo) {
        if (!trackInfo) {
            trackSection.style.display = 'none';
            return;
        }
        
        // Get circuit layout image or use placeholder
        const trackName = trackInfo.name.toLowerCase().replace(/\s+/g, '_');
        const trackSrc = `images/tracks/${trackName}.png`;
        
        trackSection.style.display = 'flex';
        trackSection.innerHTML = `
            <div class="track-map">
                <img src="${trackSrc}" alt="${trackInfo.name} Circuit Map" class="track-image" onerror="this.src='images/tracks/default.png'">
            </div>
            
            <div class="track-info">
                <div>
                    <div class="track-location">${trackInfo.location}</div>
                    <div class="track-date">${trackInfo.date}</div>
                </div>
                
                <div class="track-stats">
                    <div class="stat-item">
                        <div class="throttle-gauge">
                            <svg viewBox="0 0 100 100">
                                <path d="M 50,50 m 0,-45 a 45,45 0 1 1 0,90 a 45,45 0 1 1 0,-90" stroke="#333" stroke-width="10" fill="none" />
                                <path d="M 50,50 m 0,-45 a 45,45 0 0 1 0,90 a 45,45 0 0 1 0,-90" stroke="#4CAF50" stroke-width="10" fill="none" 
                                    stroke-dasharray="141.37" stroke-dashoffset="${(1 - trackInfo.fullThrottle / 100) * 141.37}" />
                                <text x="50" y="55" text-anchor="middle" fill="white" font-size="20">${trackInfo.fullThrottle}%</text>
                            </svg>
                        </div>
                        <div class="gauge-label">Full Throttle</div>
                    </div>
                    
                    <div class="speed-trap">
                        <div class="speed-label">Speed Trap</div>
                        <div class="speed-value">${trackInfo.speedTrap} km/h</div>
                    </div>
                </div>
            </div>
        `;
    }
    
    function populateResultsTable(results) {
        // Create table header
        let tableHTML = `
            <div class="table-header">
                <div>Position</div>
                <div>Driver</div>
                <div>Time</div>
            </div>
        `;
        
        // Add rows for each driver
        results.forEach(driver => {
            const teamColorClass = getTeamColorClass(driver.team);
            
            const isDNF = driver.status === 'DNF' || 
                         driver.status === 'DNS' || 
                         driver.status === 'DSQ' || 
                         driver.status === 'Retired' ||
                         driver.status === 'Accident';
            
            const cellClass = isDNF ? 'dnf' : 'gap-time';
            const timeDisplay = driver.position === 1 ? '-' : driver.gap;
            
            tableHTML += `
                <div class="table-row">
                    <div class="position">${driver.position}</div>
                    <div class="driver-cell">
                        <div class="team-color ${teamColorClass}"></div>
                        <div class="driver-name">${driver.code}</div>
                    </div>
                    <div class="time-cell ${cellClass}">
                        ${timeDisplay}
                    </div>
                </div>
            `;
        });
        
        resultsTable.innerHTML = tableHTML;
    }
    
    function getTeamColorClass(team) {
        if (!team) return '';
        
        const teamLower = team.toLowerCase();
        
        if (teamLower.includes('red bull')) return 'red-bull';
        if (teamLower.includes('mclaren')) return 'mclaren';
        if (teamLower.includes('ferrari')) return 'ferrari';
        if (teamLower.includes('mercedes')) return 'mercedes';
        if (teamLower.includes('aston')) return 'aston';
        if (teamLower.includes('alpine')) return 'alpine';
        if (teamLower.includes('williams')) return 'williams';
        if (teamLower.includes('haas')) return 'haas';
        if (teamLower.includes('alphatauri') || teamLower.includes('alpha tauri') || teamLower.includes('rb')) return 'alpha-tauri';
        if (teamLower.includes('alfa') || teamLower.includes('sauber')) return 'alfa-romeo';
        
        return '';
    }
    
    function getTeamBackgroundClass(team) {
        if (!team) return 'rb-bg';
        
        const teamLower = team.toLowerCase();
        
        if (teamLower.includes('red bull')) return 'rb-bg';
        if (teamLower.includes('mclaren')) return 'mc-bg';
        if (teamLower.includes('ferrari')) return 'fr-bg';
        if (teamLower.includes('mercedes')) return 'me-bg';
        if (teamLower.includes('aston')) return 'as-bg';
        if (teamLower.includes('alpine')) return 'al-bg';
        
        return 'rb-bg'; // Default background
    }
    
    function getTeamCode(team) {
        if (!team) return 'default';
        
        const teamLower = team.toLowerCase();
        
        if (teamLower.includes('red bull')) return 'redbull';
        if (teamLower.includes('mclaren')) return 'mclaren';
        if (teamLower.includes('ferrari')) return 'ferrari';
        if (teamLower.includes('mercedes')) return 'mercedes';
        if (teamLower.includes('aston')) return 'aston';
        if (teamLower.includes('alpine')) return 'alpine';
        if (teamLower.includes('williams')) return 'williams';
        if (teamLower.includes('haas')) return 'haas';
        if (teamLower.includes('alphatauri') || teamLower.includes('alpha tauri')) return 'alphatauri';
        if (teamLower.includes('rb')) return 'rb';
        if (teamLower.includes('alfa') || teamLower.includes('sauber')) return 'alfa';
        
        return 'default';
    }
    
    function getCountryCode(country) {
        if (!country) return 'default';
        
        const countryMap = {
            'Australia': 'au',
            'Austria': 'at',
            'Azerbaijan': 'az',
            'Bahrain': 'bh',
            'Belgium': 'be',
            'Brazil': 'br',
            'Canada': 'ca',
            'China': 'cn',
            'France': 'fr',
            'Germany': 'de',
            'Hungary': 'hu',
            'Italy': 'it',
            'Japan': 'jp',
            'Mexico': 'mx',
            'Monaco': 'mc',
            'Netherlands': 'nl',
            'Portugal': 'pt',
            'Qatar': 'qa',
            'Russia': 'ru',
            'Saudi Arabia': 'sa',
            'Singapore': 'sg',
            'Spain': 'es',
            'United Arab Emirates': 'ae',
            'United Kingdom': 'gb',
            'USA': 'us',
            'United States': 'us'
        };
        
        return countryMap[country] || 'default';
    }
    
    function showError(message) {
        console.error(message);
        
        // Create error message element if it doesn't exist
        let errorElement = document.querySelector('.error-message');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'error-message';
            
            // Find where to insert it (after tabs, before loading indicator)
            const tabNav = document.querySelector('.tab-nav');
            if (tabNav && tabNav.nextSibling) {
                tabNav.parentNode.insertBefore(errorElement, tabNav.nextSibling);
            } else {
                document.querySelector('.container').appendChild(errorElement);
            }
        }
        
        errorElement.textContent = message;
        errorElement.classList.add('active');
        
        // Hide after 8 seconds
        setTimeout(() => {
            errorElement.classList.remove('active');
        }, 8000);
    }


    // Function to update the session tabs based on the event type
    function updateSessionTabs(eventType) {
        const tabNav = document.querySelector('.tab-nav');
        if (!tabNav) return;
        
        // Clear existing tabs
        tabNav.innerHTML = '';
        
        let sessionTabs;
        let isSprintWeekend = false;
        
        if (eventType && eventType.is_sprint_weekend) {
            isSprintWeekend = true;
            
            // Sprint weekend tabs
            sessionTabs = [
                { id: 'race', name: 'Race' },
                { id: 'qualifying', name: 'Qualifying' },
                { id: 'sprint', name: 'Sprint' }
            ];
            
            // Add Sprint Qualifying/Shootout tab if available
            if (eventType.has_sprint_qualifying) {
                // Find the correct sprint qualifying format name
                const sprintQualFormat = eventType.sessions.find(
                    s => s.name === 'Sprint Qualifying' || s.name === 'Sprint Shootout'
                );
                
                const tabName = sprintQualFormat ? sprintQualFormat.name : 'Sprint Qualifying';
                const tabId = sprintQualFormat ? sprintQualFormat.api_name : 'sprint_qualifying';
                
                sessionTabs.push({ id: tabId, name: tabName });
            }
            
            // Add Practice sessions that exist
            if (eventType.sessions.some(s => s.name === 'Practice 1')) {
                sessionTabs.push({ id: 'practice1', name: 'Practice 1' });
            }
            
            if (eventType.sessions.some(s => s.name === 'Practice 2')) {
                sessionTabs.push({ id: 'practice2', name: 'Practice 2' });
            }
        } else {
            // Regular weekend tabs - default setup
            sessionTabs = [
                { id: 'race', name: 'Race' },
                { id: 'qualifying', name: 'Qualifying' },
                { id: 'practice3', name: 'Practice 3' },
                { id: 'practice2', name: 'Practice 2' },
                { id: 'practice1', name: 'Practice 1' }
            ];
        }
        
        // Create tabs based on available sessions
        sessionTabs.forEach((tab, index) => {
            const button = document.createElement('button');
            button.className = 'tab-btn' + (index === 0 ? ' active' : '');
            button.setAttribute('data-tab', tab.id);
            button.textContent = tab.name;
            
            tabNav.appendChild(button);
        });
        
        // After creating buttons, set the current session to the first tab
        currentSession = sessionTabs[0].id;
        
        // Make sure we load the data for the current session
        if (currentRace) {
            loadRaceData(currentSeason, currentRace, currentSession);
        }
        
        return isSprintWeekend;
    }

    function selectRace(raceId, raceName) {
        currentRace = raceId;
        raceText.textContent = raceName;
        raceSelector.classList.remove('active');
        
        // Update UI
        document.querySelectorAll('#raceDropdown .dropdown-item').forEach(el => {
            el.classList.remove('selected');
        });
        
        // Find and select the clicked item
        const clickedItem = Array.from(document.querySelectorAll('#raceDropdown .dropdown-item'))
            .find(item => item.dataset.value === raceId);
        
        if (clickedItem) {
            clickedItem.classList.add('selected');
        }
        
        // Show loading indicator
        loadingIndicator.classList.add('active');
        raceContent.style.display = 'none';
        noDataMessage.classList.remove('active');
        
        // Reset any existing error messages
        const errorElem = document.querySelector('.error-message');
        if (errorElem) {
            errorElem.classList.remove('active');
        }
        
        // Fetch event type to determine if this is a sprint weekend
        fetchEventType(currentSeason, currentRace)
            .then(() => {
                // After tabs are updated by fetchEventType, load data for the active tab
                const activeTab = document.querySelector('.tab-btn.active');
                if (activeTab) {
                    currentSession = activeTab.getAttribute('data-tab');
                    loadRaceData(currentSeason, currentRace, currentSession);
                }
            })
            .catch(error => {
                console.error('Error fetching event type:', error);
                
                // Fallback to regular weekend tabs
                updateSessionTabs({ is_sprint_weekend: false, has_sprint_qualifying: false, sessions: [] });
                
                // Try to load race data anyway
                const activeTab = document.querySelector('.tab-btn.active');
                if (activeTab) {
                    currentSession = activeTab.getAttribute('data-tab');
                    loadRaceData(currentSeason, currentRace, currentSession);
                }
            });
    }


    async function fetchEventType(season, race) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
            
            const response = await fetch(`${API_BASE_URL}/season/${season}/race/${race}/event_type`, {
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`Failed to fetch event type: ${response.status} ${response.statusText}`);
            }
            
            const eventType = await response.json();
            console.log(`Event type for ${season} ${race}:`, eventType);
            
            // Update the session tabs based on event type
            updateSessionTabs(eventType);
            
            return eventType;
        } catch (error) {
            console.error('Error fetching event type:', error);
            
            // Fallback to regular weekend tabs
            updateSessionTabs({ is_sprint_weekend: false, has_sprint_qualifying: false });
            
            throw error;
        }
    }
    
    // Debug logging to help troubleshoot issues
    console.log("API Base URL:", API_BASE_URL);
});