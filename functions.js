async function loadLotName(lotId) {
            if (lotId === 0) return 'Unknown'; // Return 'Unknown' for lot ID 0
            const lotData = await fetch('https://api.xenoso.space/userapi/city/1/city.json');
            return lotData ? lotData.name : 'N/A'; // Return the lot name if valid
        }

        async function loadActiveLots() {
    try {
        const response = await fetch('https://api.xenoso.space/userapi/city/1/city.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const activeLotsData = await response.json();

        // Create a mapping of lot IDs to lot names
        const lotMapping = {};
        const names = activeLotsData.names;
        const reservedLots = activeLotsData.reservedLots;

        reservedLots.forEach((id, index) => {
            lotMapping[id] = names[index]; // Map each ID to its corresponding name
        });

        return lotMapping; // Return the mapping
    } catch (error) {
        console.error('Failed to load active lots:', error);
        return {}; // Return an empty object on error
    }
}

async function loadOnlinePlayers() {
    try {

        // Set the Sims Online title to "Loading..." while data is being fetched
        const playersTitle = document.getElementById('players-title');
        if (playersTitle) {
            playersTitle.innerHTML = `<span class="sims-online-icon"></span> Sims Online: Loading... <span class="sims-online-icon"></span>`;
        }
        
        const response = await fetch('https://api.xenoso.space/userapi/avatars/online');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const onlineData = await response.json();
        const playersContainer = document.getElementById('players');
        playersContainer.innerHTML = ''; // Clear previous content

        // Fetch active lots data and create a mapping
        const lotMapping = await loadActiveLots();
		
		// Get favorites from localStorage
        const favorites = JSON.parse(localStorage.getItem('favorites')) || {};
        const favoriteSims = favorites.sims || {};

        // Sort Sims: Favorites first, then alphabetically
        const sortedAvatars = onlineData.avatars.sort((a, b) => {
            const isAFavorite = favoriteSims[a.avatar_id] ? 1 : 0;
            const isBFavorite = favoriteSims[b.avatar_id] ? 1 : 0;
            if (isBFavorite !== isAFavorite) {
                return isBFavorite - isAFavorite; // Favorites come first
            }
            return a.name.localeCompare(b.name); // Then sort alphabetically
        });

        // Prepare fetch requests for all avatars in parallel
        const fetchPlayerDetailsPromises = sortedAvatars.map(avatar =>
            fetch(`https://api.xenoso.space/userapi/avatars/${avatar.avatar_id}`).then(response => response.json())
        );

        // Wait for all player detail requests to complete
        const playerDetailsArray = await Promise.all(fetchPlayerDetailsPromises);

        let tableHtml = `
            <table>
                <thead>
    <tr>
	<th>
    	Sim
    	<i class="fa-solid fa-arrow-up-arrow-down" style="cursor: pointer;" onclick="sortTable(0, 'text')"></i>
    	<i class="fa-solid fa-star" style="cursor: pointer;" onclick="sortByFavorites()"></i>
	</th>
        <th class="hidden">ID</th>
        <th>
            Age 
            <i class="fa-solid fa-arrow-up-arrow-down" 
               style="cursor: pointer;" 
               onclick="sortTable(2, 'number')"></i>
        </th>
        <th class="hidden">Location ID</th>
        <th>
            Location 
            <i class="fa-solid fa-arrow-up-arrow-down" 
               style="cursor: pointer;" 
               onclick="sortTable(4, 'text')"></i>
        </th>
    </tr>
</thead>
                <tbody>`;

        // Process sorted online players
        sortedAvatars.forEach((avatar, index) => {
            const lotName = lotMapping[avatar.location] || 'Unknown'; // Get lot name
            const playerDetails = playerDetailsArray[index]; // Get the corresponding player details
            
            // Calculate player age from Unix timestamp (avatar.date)
            const creationDate = new Date(playerDetails.date * 1000); // Convert to milliseconds
            const currentDate = new Date();
            const ageInDays = Math.floor((currentDate - creationDate) / (1000 * 60 * 60 * 24)); // Age in days

// Check if this Sim is a favorite
const isFavorite = favoriteSims[avatar.avatar_id];
			
// Define emoji rules
const adminNames = ["Sorta", "Savaki", "Daat", "Xeno", "Eric"];
const emojiMap = {
    "Mr Teddy": "🐻"
};

// Display name
let displayName = avatar.name;

if (emojiMap[avatar.name]) {
    displayName += ` ${emojiMap[avatar.name]}`;
}

// Add shield for admins

if (adminNames.includes(avatar.name)) {
    displayName += ` <span title="Admin">🛡️</span>`;
}


            tableHtml += `
            <tr data-avatar-id="${avatar.avatar_id}">
        <td>
            <i class="${isFavorite ? 'fa-solid fa-star' : 'fa-regular fa-star'}" 
               title="Click to toggle favorite" 
               data-favorite-id="${avatar.avatar_id}" 
               onclick="toggleFavorite('sims', '${avatar.avatar_id}', '${avatar.name}', event)"></i>
            ${displayName}
        </td>
        <td class="hidden">${avatar.avatar_id}</td>
        <td>${ageInDays} days</td>
        <td class="hidden">${avatar.location}</td> <!-- This should be the Location ID (hidden) -->
        <td>${lotName}</td> <!-- This should be the visible Location name -->
    </tr>`;
        });

        tableHtml += `
                </tbody>
            </table>`;

        playersContainer.innerHTML = tableHtml; // Update the container with the table

        // Add event listeners to each row in Sims Online table
        const playerRows = playersContainer.querySelectorAll('tr[data-avatar-id]');
        playerRows.forEach(row => {
            row.addEventListener('click', () => {
                const avatarId = row.dataset.avatarId; // Get the avatar ID
                displayPlayerInfo(avatarId); // Fetch and display player info
            });
        });

        // Update the title with the online player count
        if (playersTitle) {
            playersTitle.innerHTML = `<span class="sims-online-icon"></span> Sims Online: ${onlineData.avatars_online_count} <span class="sims-online-icon"></span>`;
        }

} catch (error) {
        console.error('Failed to load online players:', error);
        document.getElementById('players').innerHTML = 'Error loading online players.';
        // If there is an error, reset the title to show 0
        if (playersTitle) {
            playersTitle.innerHTML = `<span class="sims-online-icon"></span> Sims Online: 0 <span class="sims-online-icon"></span>`;
        }
    }
}
       // Mapping for lot categories
        const categoryMapping = {
            1: 'Money',
            2: 'Money',
            3: 'Romance',
            4: 'Service',
            5: 'Store',
            6: 'Skills',
            7: 'Welcome',
            8: 'Games',
            9: 'Entertainment',
            10: 'Residential',
            11: 'Community'
        };

let currentFilter = ''; // Track the current filter

function filterLots(type) {
    // Check if the clicked filter is already active to toggle
    if (currentFilter === type) {
        type = ''; // Clear filter if clicked again
        currentFilter = ''; // Reset the current filter
    } else {
        currentFilter = type; // Set new filter as active
    }

    const rows = document.querySelectorAll('#lots tbody tr');
    rows.forEach(row => {
        const lotTypeCell = row.querySelector('td:nth-child(3)');
        if (!type || (lotTypeCell && lotTypeCell.textContent.trim() === type)) {
            row.style.display = ''; // Show matching type or all if no type
        } else {
            row.style.display = 'none'; // Hide non-matching types
        }
    });
}
        
        async function loadLots() {
    try {
        const response = await fetch('https://api.xenoso.space/userapi/city/1/city.json');
        const jsonData = await response.json();

        const activeLots = jsonData.activeLots;
        const onlineCounts = jsonData.onlineCount;
        const lotMapping = {};
        for (let i = 0; i < jsonData.reservedLots.length; i++) {
            lotMapping[jsonData.reservedLots[i]] = jsonData.names[i];
        }

        const lotsContainer = document.getElementById('lots');
        lotsContainer.innerHTML = ''; // Clear previous content
		
		// Retrieve favorites from localStorage
        const favorites = JSON.parse(localStorage.getItem('favorites')) || {};
        const favoriteLots = favorites.lots || {};

        let lotsData = activeLots.map((lotID, index) => {
            return {
                name: lotMapping[lotID] || lotID,
                count: onlineCounts[index],
                id: lotID,
				isFavorite: !!favoriteLots[lotID] // Mark if the lot is a favorite
            };
        });

        // Sort Lots: Favorites first, then by Sims Inside (descending)
        lotsData.sort((a, b) => {
            if (b.isFavorite !== a.isFavorite) {
                return b.isFavorite - a.isFavorite; // Favorites come first
            }
            return b.count - a.count; // Then sort by Sims Inside
        });

        const fetchLotDetailsPromises = lotsData.map(lot =>
            fetch(`https://api.xenoso.space/userapi/city/1/i${lot.id}.json`).then(response => response.json())
        );

        const lotDetailsArray = await Promise.all(fetchLotDetailsPromises);

        let tableHtml = `
            <table>
                <thead>
                    <tr>
                        <th>Location</th>
                        <th>Sims Inside</th>
                        <th>Lot Type</th>
                    </tr>
                </thead>
                <tbody>`;

        lotsData.forEach((lot, index) => {
            if (lot.count > 0) {
                const lotDetails = lotDetailsArray[index];
                const lotType = categoryMapping[lotDetails.category] || 'Unknown';

                tableHtml += `
                    <tr data-lot-id="${lot.id}">
                        <td>
            <i class="${lot.isFavorite ? 'fa-solid fa-star' : 'fa-regular fa-star'}" 
               title="Click to toggle favorite" 
               data-favorite-id="${lot.id}" 
               onclick="toggleFavorite('lots', '${lot.id}', '${lot.name}', event)"></i>
            ${lot.name}
        </td>
                        <td>${lot.count}</td>
                        <td>${lotType}</td>
                    </tr>`;
            }
        });

        tableHtml += `
                </tbody>
            </table>`;

        lotsContainer.innerHTML = tableHtml;

        const rows = lotsContainer.querySelectorAll('tr[data-lot-id]');
        rows.forEach(row => {
            row.addEventListener('click', () => {
                const lotId = row.dataset.lotId;
                displayLotInfo(lotId);
            });
        });

    } catch (error) {
        console.error('Error loading lots:', error);
        document.getElementById('lots').innerHTML = 'Error loading lots.';
    }
}

async function displayLotInfo(lotId) {
    const consoleContent = document.getElementById('console-content');
    consoleContent.dataset.id = lotId; // Set the current Lot ID
    consoleContent.dataset.type = 'lots'; // Set the type to Lots

    const url = `https://api.xenoso.space/userapi/city/1/i${lotId}.json`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const lotData = await response.json();

        // Mapping for admit modes
        const admitModeMapping = {
            0: 'Admit All',
            1: 'Admit List',
            2: 'Ban List',
            3: 'Ban All',
            4: 'Admit All'
        };

        // Fetch owner's name using owner_id
        const ownerNameUrl = `https://api.xenoso.space/userapi/avatars/${lotData.owner_id}`;
        const ownerResponse = await fetch(ownerNameUrl);
        const ownerData = ownerResponse.ok ? await ownerResponse.json() : { name: 'Unknown' };
        const ownerName = ownerData.name || 'Unknown';

        // Filter out the owner from the roommates list
        const roommatesWithoutOwner = lotData.roommates.filter(id => id !== lotData.owner_id);

        // Fetch roommates' names (excluding the owner)
        const roommateNames = await Promise.all(
            roommatesWithoutOwner.map(async (roommateId) => {
                const roommateUrl = `https://api.xenoso.space/userapi/avatars/${roommateId}`;
                const roommateResponse = await fetch(roommateUrl);
                if (!roommateResponse.ok) {
                    console.error(`Failed to fetch roommate with id ${roommateId}`);
                    return 'Unknown';
                }
                const roommateData = await roommateResponse.json();
                return roommateData.name || 'Unknown';
            })
        );

        // Replace \r\n with <br> in description
        const formattedDescription = (lotData.description || 'No description available.').replace(/(\r\n|\n|\r)/g, '<br>');

        // Find known Sims inside the lot (from the Sims Online table)
        const playersContainer = document.getElementById('players');
        const playersRows = Array.from(playersContainer.querySelectorAll('tr'));
        const knownSims = playersRows
            .filter(row => {
                const locationCell = row.querySelector('.hidden:nth-child(4)');
                return locationCell && locationCell.textContent === lotId.toString();
            })
            .map(row => row.querySelector('td').textContent.trim()); // Trim each Sim's name

	// Get total Sims inside from Active Lots table
        let totalSimsInside = 0;
        const lotsContainer = document.getElementById('lots');
        const lotRow = Array.from(lotsContainer.querySelectorAll('tr')).find(row =>
            row.dataset.lotId === lotId.toString()
        );
        if (lotRow) {
            const simsInsideCell = lotRow.querySelector('td:nth-child(2)');
            totalSimsInside = parseInt(simsInsideCell?.textContent.trim() || '0', 10);
        }

        const showHiddenNote = totalSimsInside > knownSims.length;

        // Check for favorites in localStorage
        const favorites = JSON.parse(localStorage.getItem('favorites')) || {};
        const isFavorite = favorites.lots && favorites.lots[lotId];

        // Display lot information in Console
        consoleContent.innerHTML = `
            <div class="console-title">
                ${lotData.name}
                <i class="${isFavorite ? 'fa-solid fa-star' : 'fa-regular fa-star'}" 
                   title="Click to toggle favorite" 
                   onclick="toggleFavorite('lots', '${lotId}', '${lotData.name}', event)"></i>
            </div>
            <img src="https://api.xenoso.space/userapi/city/1/${lotId}.png" 
                 alt="${lotData.name}" 
                 class="console-img">
            <p><strong>Description:</strong></p>
            <div class="description-container">${formattedDescription}</div>
            <p><strong>Lot Type:</strong> ${categoryMapping[lotData.category] || 'Unknown'}</p>
            <p><strong>Admit Mode:</strong> ${admitModeMapping[lotData.admit_mode] || 'Unknown'}</p>
            <p><strong>Owner:</strong> ${ownerName}</p>
            <p><strong>Roommates:</strong> ${roommateNames.length > 0 ? roommateNames.join(', ') : 'None'}</p>
            <p><strong>Known Sims Inside:</strong> ${knownSims.length > 0 ? knownSims.join(', ') : 'None'}</p>
            ${showHiddenNote ? `<p><em>There are sims inside with their location hidden.</em></p>` : ''}
        `;
    } catch (error) {
        console.error('Failed to fetch lot details:', error);
        consoleContent.innerHTML = 'Error loading lot details.';
    }
}

async function fetchPlayerImages() {
    const playerImagesUrl = 'https://makinmagic.github.io/XenoSO/profile-pictures.json';
    try {
        const response = await fetch(playerImagesUrl);
        if (!response.ok) throw new Error('Failed to fetch player images.');
        return await response.json();
    } catch (error) {
        console.error(error);
        return {}; // Return an empty object on error
    }
}
	    
async function displayPlayerInfo(avatarId) {
    // Remove placeholder text
    const consoleContent = document.getElementById('console-content');
    consoleContent.innerHTML = ''; // Clear existing content
    consoleContent.dataset.id = avatarId; // Set the current Sim ID
    consoleContent.dataset.type = 'sims'; // Set the type to Sims

    const playerImages = await fetchPlayerImages();
    const url = `https://api.xenoso.space/userapi/avatars/${avatarId}`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch player details.');
        const playerData = await response.json();

        // Match the Sim name to the JSON file
        const simName = playerData.name; // Sim name from API
        const playerImage = playerImages[simName] || 'https://makinmagic.github.io/XenoSO/images/pfp-placeholder.png';

        // Debug
        if (!playerImages[simName]) {
            console.warn(`Image not found for Sim: ${simName}. Using placeholder.`);
        } else {
            console.log(`Image found for Sim: ${simName}: ${playerImage}`);
        }

        // Calculate player age from Unix timestamp
        const creationDate = new Date(playerData.date * 1000); // Convert to milliseconds
        const currentDate = new Date();
        const ageInDays = Math.floor((currentDate - creationDate) / (1000 * 60 * 60 * 24)); // Calculate age in days

        // Get the player's location from the Sims Online table
        const playersContainer = document.getElementById('players');
        const locationRow = Array.from(playersContainer.querySelectorAll('tr'))
            .find(row => row.querySelector('.hidden:nth-child(2)').textContent === avatarId.toString()); // Match avatar ID
        const playerLocation = locationRow ? locationRow.querySelector('td:nth-child(5)').textContent : 'Unknown'; // Get location name

        // Replace \r\n with <br> in description
        const formattedDescription = (playerData.description || 'No description available.').replace(/(\r\n|\n|\r)/g, '<br>');

        // Check for favorites in localStorage
        const favorites = JSON.parse(localStorage.getItem('favorites')) || {};
        const isFavorite = favorites.sims && favorites.sims[avatarId];

        // Display all information in the Console
        consoleContent.innerHTML = `
            <div class="console-title">
                ${playerData.name}
                <i class="${isFavorite ? 'fa-solid fa-star' : 'fa-regular fa-star'}" 
                   title="Click to toggle favorite" 
                   onclick="toggleFavorite('sims', '${avatarId}', '${playerData.name}', event)"></i>
            </div>
            <img src="${playerImage}" 
                 alt="Profile Picture" 
                 class="console-img">
            <p style="text-align: center; margin-top: -9px;">
                <a href="https://forms.gle/p7DTPGDpiztywdsM9" target="_blank" style="text-decoration: underline;">Submit/Change Profile Picture</a>
            </p>
            <p><strong>Description:</strong></p>
            <div class="description-container">${formattedDescription}</div>
            <p><strong>Age:</strong> ${ageInDays} days old</p>
            <p><strong>Location:</strong> ${playerLocation}</p>
        `;
    } catch (error) {
        console.error('Failed to fetch player details:', error);
        document.getElementById('console-content').innerHTML = 'Error loading player details.';
    }
}
        
        function tempoSim() {
            var currenttime = new Date();
            var hours = currenttime.getUTCHours();
            var minutes = currenttime.getUTCMinutes();
            var seconds = currenttime.getUTCSeconds();
            var timesuffix = "AM";
            var cycle = 0;
            if (hours % 2 == 1) {
                cycle = 3600;
                timesuffix = "PM";
            }
            cycle = cycle + minutes * 60 + seconds;
            var tsohours = Math.floor(cycle / 300);
            if (tsohours > 12) {
                tsohours = tsohours - 12;
            }
            if (tsohours == 0) {
                tsohours = 12;
            }
            var tsomins = Math.floor((cycle % 300) / 5);
            if (tsomins < 10) {
                tsomins = "0" + tsomins;
            }

            document.getElementById('tempoSim').innerHTML = "Time in Xenovia: " + tsohours + ":" + tsomins + " " + timesuffix;

            setTimeout(tempoSim, 1000);
        }

// Toggle search input visibility
function toggleSearch(type) {
    const simSearchInput = document.getElementById(`${type}-search`);
    if (simSearchInput.style.display === 'none') {
        simSearchInput.style.display = 'inline-block';
        simSearchInput.focus();
    } else {
        simSearchInput.style.display = 'none';
        simSearchInput.value = '';
        document.getElementById('console-content').innerHTML = '<p style="text-align: center; color: black;">Select a Sim or a Lot to see more information.</p>';
    }
}

async function searchSim(event) {
    if (event.key === 'Enter' || event.keyCode === 13) {
        const simName = event.target.value.trim();
        if (!simName) return;

        const url = `https://api.xenoso.space/userapi/city/1/avatars/name/${simName}`;
        const consoleContent = document.getElementById('console-content');
        consoleContent.innerHTML = ''; // Clear existing content
        consoleContent.dataset.id = simName; // Set the current Sim ID (by name)
        consoleContent.dataset.type = 'sims'; // Set the type to Sims

        try {
            const playerImages = await fetchPlayerImages();
            const response = await fetch(url);
            if (!response.ok) throw new Error('Sim not found');

            const playerData = await response.json();

            // Match the Sim name to the JSON file
            const playerImage = playerImages[playerData.name] || 'https://makinmagic.github.io/XenoSO/images/pfp-placeholder.png';

            // Debugging logs
            console.log(`Image for ${playerData.name}: ${playerImage}`);

            // Calculate player age from Unix timestamp
            const creationDate = new Date(playerData.date * 1000);
            const currentDate = new Date();
            const ageInDays = Math.floor((currentDate - creationDate) / (1000 * 60 * 60 * 24));

            // Check if the player is online
            const playersContainer = document.getElementById('players');
            const onlineRow = Array.from(playersContainer.querySelectorAll('tr')).find(row => {
                const firstCell = row.querySelector('td');
                return firstCell && firstCell.textContent.trim().toLowerCase() === playerData.name.trim().toLowerCase();
            });

            const isOnline = Boolean(onlineRow);
            const playerLocation = isOnline
                ? onlineRow.querySelector('td:nth-child(5)')?.textContent.trim() || 'Unknown'
                : 'Offline';

            console.log(`Player ${playerData.name} is ${isOnline ? 'online' : 'offline'}`);

            // Check for favorites using name-to-ID mapping
            const nameToIdMap = JSON.parse(localStorage.getItem('nameToIdMap')) || {};
            const idFromName = nameToIdMap[simName] || playerData.avatar_id;
            nameToIdMap[simName] = idFromName; // Update map if missing
            localStorage.setItem('nameToIdMap', JSON.stringify(nameToIdMap));

            const favorites = JSON.parse(localStorage.getItem('favorites')) || {};
            const isFavorite = favorites.sims && favorites.sims[idFromName];

            // Display all information in the Console
            consoleContent.innerHTML = `
                <div class="console-title">
                    ${playerData.name}
                    <i class="${isFavorite ? 'fa-solid fa-star' : 'fa-regular fa-star'}" 
                       title="Click to toggle favorite" 
                       onclick="toggleFavorite('sims', '${playerData.avatar_id}', '${playerData.name}', event)"></i>
                </div>
                <img src="${playerImage}" 
                   alt="Profile Picture" 
                   class="console-img">
                <p style="text-align: center; margin-top: -9px;">
                    <a href="https://forms.gle/p7DTPGDpiztywdsM9" target="_blank" style="text-decoration: underline;">Submit/Change Profile Picture</a>
                </p>
                <p><strong>Description:</strong></p>
                <div class="description-container">${(playerData.description || 'No description available.').replace(/(\r\n|\n|\r)/g, '<br>')}</div>
                <p><strong>Age:</strong> ${ageInDays} days old</p>
                ${isOnline ? `<p><strong>Location:</strong> ${playerLocation}</p>` : ''}
                <p><strong>Currently Online:</strong> ${isOnline ? 'Yes' : 'No'}</p>
            `;
        } catch (error) {
            console.error('Failed to fetch sim details:', error);
            consoleContent.innerHTML = 'Sim not found.';
        }
    }
}

async function searchLot(event) {
    if (event.key === 'Enter' || event.keyCode === 13) {
        const lotName = event.target.value.trim();
        if (!lotName) return;

        const url = `https://api.xenoso.space/userapi/city/1/lots/name/${lotName}`;

        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('Lot not found');

            const lotData = await response.json();

            // Mapping for admit modes
            const admitModeMapping = {
                0: 'Admit All',
                1: 'Admit List',
                2: 'Ban List',
                3: 'Ban All',
                4: 'Admit All'
            };

            // Mapping for lot categories
            const categoryMapping = {
                1: 'Money',
                2: 'Money',
                3: 'Romance',
                4: 'Service',
                5: 'Store',
                6: 'Skills',
                7: 'Welcome',
                8: 'Games',
                9: 'Entertainment',
                10: 'Residential',
                11: 'Community'
            };

            // Format description and creation date
            const formattedDescription = (lotData.description || 'No description available.').replace(/(\r\n|\n|\r)/g, '<br>');
            const creationDate = new Date(lotData.created_date * 1000).toLocaleDateString();
			
			// Check for favorites in localStorage
            const favorites = JSON.parse(localStorage.getItem('favorites')) || {};
            const isFavorite = favorites.lots && favorites.lots[lotData.location];

            // Check if the lot is currently active by searching in the Active Lots table
            const lotsContainer = document.getElementById('lots');
            const isActive = Array.from(lotsContainer.querySelectorAll('tr')).some(row => {
    const firstCell = row.querySelector('td');
    return firstCell && firstCell.textContent.trim().toLowerCase() === lotData.name.trim().toLowerCase();
});

            const activeStatus = isActive ? 'Yes' : 'No';
            
            const lotRow = Array.from(lotsContainer.querySelectorAll('tr')).find(row =>
    row.querySelector('td')?.textContent.trim().toLowerCase() === lotData.name.trim().toLowerCase()
);

            let totalSimsInside = 0;
            if (lotRow) {
                const simsInsideCell = lotRow.querySelector('td:nth-child(2)');
                totalSimsInside = parseInt(simsInsideCell?.textContent.trim() || '0', 10);
            }

            // Fetch owner's name using owner_id
            const ownerResponse = await fetch(`https://api.xenoso.space/userapi/avatars/${lotData.owner_id}`);
            const ownerData = ownerResponse.ok ? await ownerResponse.json() : { name: 'Unknown' };
            const ownerName = ownerData.name;

            // Fetch roommate names
            const roommateNames = await Promise.all(
                lotData.roommates
                    .filter(id => id !== lotData.owner_id) // Exclude owner from roommates
                    .map(async (roommateId) => {
                        const roommateUrl = `https://api.xenoso.space/userapi/avatars/${roommateId}`;
                        const roommateResponse = await fetch(roommateUrl);
                        if (!roommateResponse.ok) {
                            console.error(`Failed to fetch roommate with id ${roommateId}`);
                            return 'Unknown';
                        }
                        const roommateData = await roommateResponse.json();
                        return roommateData.name || 'Unknown';
                    })
            );

            // Known Sims inside the lot from Sims Online table
            const playersContainer = document.getElementById('players');
            const knownSims = Array.from(playersContainer.querySelectorAll('tr'))
                .filter(row => {
                    const locationCell = row.querySelector('.hidden:nth-child(4)');
                    return locationCell && locationCell.textContent == lotData.location;
                })
                .map(row => row.querySelector('td').textContent);
                
            const showHiddenNote = totalSimsInside > knownSims.length;

                        // Display lot information in Console
            const consoleContent = document.getElementById('console-content');
            consoleContent.innerHTML = `
                <div class="console-title">
                    ${lotData.name}
					<i class="${isFavorite ? 'fa-solid fa-star' : 'fa-regular fa-star'}" 
                       title="Click to toggle favorite" 
                       onclick="toggleFavorite('lots', '${lotData.location}', '${lotData.name}', event)"></i>
                </div>
                <img src="https://api.xenoso.space/userapi/city/1/${lotData.location}.png" 
                   alt="${lotData.name}" 
                   class="console-img">
                <p><strong>Description:</strong></p>
                <div class="description-container">${formattedDescription}</div>
                <p><strong>Lot Type:</strong> ${categoryMapping[lotData.category] || 'Unknown'}</p>
                <p><strong>Admit Mode:</strong> ${admitModeMapping[lotData.admit_mode] || 'Unknown'}</p>
                <p><strong>Owner:</strong> ${ownerName || 'Unknown'}</p>
                <p><strong>Roommates:</strong> ${roommateNames.length > 0 ? roommateNames.join(', ') : 'None'}</p>
                <p><strong>Currently Active:</strong> ${activeStatus}</p>
                ${activeStatus === 'Yes' ? `
    <p><strong>Known Sims Inside:</strong> ${knownSims.length > 0 ? knownSims.map(name => name.trim()).join(', ') : 'None'}</p>
    ${showHiddenNote ? `<p><em>There are sims inside with their location hidden.</em></p>` : ''}
` : ''}
`;
        } catch (error) {
            console.error('Failed to fetch lot details:', error);
            document.getElementById('console-content').innerHTML = 'Lot not found.';
        }
    }
}
const eventsUrl = 'https://makinmagic.github.io/XenoSO/events.json';

async function fetchEvents() {
    try {
        const response = await fetch(eventsUrl);
        if (!response.ok) {
            throw new Error('Failed to load events.json');
        }
        const events = await response.json();

        const eventsContainer = document.getElementById('events-table').getElementsByTagName('tbody')[0];
        eventsContainer.innerHTML = ''; // Clear any existing events

        const now = new Date();

        // Filter upcoming events
        const upcomingEvents = events.filter(event => new Date(event.startTime) > now);

        if (upcomingEvents.length === 0) {
            // Add a single row if there are no upcoming events
            const row = eventsContainer.insertRow();
            const cell = row.insertCell();
            cell.colSpan = 3;
            cell.style.textAlign = 'center';
            cell.textContent = "No upcoming events.";
            cell.style.fontStyle = "italic"; // Optional styling
        } else {
            // Populate the table with upcoming events
            upcomingEvents.forEach(event => {
                const row = eventsContainer.insertRow();
                const eventDate = new Date(event.startTime);
                const formattedDate = eventDate.toLocaleDateString(undefined, {
                    weekday: 'long', month: 'long', day: 'numeric'
                });
                const formattedTime = `${eventDate.toLocaleTimeString(undefined, { hour: 'numeric', minute: 'numeric', hour12: true })}`;

                row.innerHTML = `
                    <td>${formattedDate}</td>
                    <td>${event.name}</td>
                    <td>${event.location}</td>
                `;
                row.addEventListener('click', () => {
                    displayEventInfo(event); // Show details in the Console when clicked
                });
            });
        }
    } catch (error) {
        console.error('Failed to fetch events:', error);
    }
}

function displayEventInfo(event) {
    const consoleContent = document.getElementById('console-content');
    const eventStartDate = new Date(event.startTime);
    const eventEndDate = new Date(event.endTime);
    const formattedDate = eventStartDate.toLocaleDateString(undefined, {
        weekday: 'long', month: 'long', day: 'numeric'
    });
    const formattedTime = `${eventStartDate.toLocaleTimeString(undefined, { hour: 'numeric', minute: 'numeric', hour12: true })} to ${eventEndDate.toLocaleTimeString(undefined, { hour: 'numeric', minute: 'numeric', hour12: true })} (${Intl.DateTimeFormat().resolvedOptions().timeZone})`;

    consoleContent.innerHTML = `
        <div class="console-title">
            ${event.name}
        </div>
        <p><strong>Description:</strong> ${event.description}</p>
        <p><strong>Date:</strong> ${formattedDate}</p>
        <p><strong>Time:</strong> ${formattedTime}</p>
        <p><strong>Location:</strong> ${event.location}</p>
    `;
}

async function displayCurrentEvent() {
    try {
        const response = await fetch(eventsUrl);
        if (!response.ok) {
            throw new Error('Failed to load events.json');
        }
        const events = await response.json();

        const now = new Date();
        const currentEventContainer = document.getElementById("currentEvent");
        let currentEvents = []; // Array to store all currently ongoing events

        // Check if any events are currently ongoing
        events.forEach(event => {
            const startTime = new Date(event.startTime);
            const endTime = new Date(event.endTime);

            if (now >= startTime && now <= endTime) {
                currentEvents.push(event); // Add ongoing event to the list
            }
        });

        // Display all overlapping events
        if (currentEvents.length > 0) {
            currentEventContainer.innerHTML = currentEvents
                .map(event => `<i class="fa-solid fa-balloons"></i> Current Event: ${event.name} at ${event.location}!`)
                .join('<br>'); // Join with line breaks for multiple events

            currentEvents.forEach(event => addEventIconToLocation(event.location)); // Add balloon icon for each location
        } else {
            currentEventContainer.innerHTML = ""; // Clear if no event is ongoing
        }
    } catch (error) {
        console.error('Failed to fetch current events:', error);
    }
}

// Function to add the balloon icon to the active event's location in the Active Lots
function addEventIconToLocation(locationName) {
    const lotsTable = document.getElementById("lots");
    const rows = lotsTable.querySelectorAll("tbody tr");

    rows.forEach(row => {
        const locationCell = row.querySelector("td:first-child");
        if (locationCell && locationCell.textContent.trim().toLowerCase() === locationName.trim().toLowerCase()) {
            // Check if the balloon icon is already present to avoid duplicates
            if (!locationCell.querySelector(".fa-balloons")) {
                locationCell.innerHTML += ' <i class="fa-solid fa-balloons" title="Event is ongoing!"></i>';
            }
        }
    });
}

function toggleFavorite(type, id, name, event) {
    if (event) event.stopPropagation(); // Prevent parent events from triggering

    console.log(`toggleFavorite called for type: ${type}, id: ${id}, name: ${name}`);

    // Retrieve current favorites and name-to-ID mapping from localStorage
    const favorites = JSON.parse(localStorage.getItem('favorites')) || {};
    const nameToIdMap = JSON.parse(localStorage.getItem('nameToIdMap')) || {};

    // Ensure the type exists in the favorites object
    if (!favorites[type]) favorites[type] = {};

    // Add name-to-ID mapping if it doesn't already exist
    if (!nameToIdMap[name]) {
        nameToIdMap[name] = id;
        localStorage.setItem('nameToIdMap', JSON.stringify(nameToIdMap));
        console.log(`Added name-to-ID mapping: ${name} -> ${id}`);
    }

    // Add or remove the favorite
    if (favorites[type][id]) {
        console.log(`Removing favorite: ${id}`);
        delete favorites[type][id]; // Remove from favorites
    } else {
        console.log(`Adding favorite: ${id}`);
        favorites[type][id] = name; // Add to favorites
    }

    // Save updated favorites to localStorage
    localStorage.setItem('favorites', JSON.stringify(favorites));
    console.log('Updated favorites:', favorites);

    // Update the specific star that was clicked
    const clickedStar = event.target;
    if (favorites[type][id]) {
        clickedStar.className = 'fa-solid fa-star'; // Mark as favorited
    } else {
        clickedStar.className = 'fa-regular fa-star'; // Mark as unfavorited
    }

    // Isolate updates to the Console star
    const consoleContent = document.getElementById('console-content');
    if (consoleContent.dataset.id === id && consoleContent.dataset.type === type) {
        const consoleStar = consoleContent.querySelector('.fa-star');
        if (consoleStar) {
            consoleStar.className = favorites[type][id]
                ? 'fa-solid fa-star'
                : 'fa-regular fa-star';
        }
    } else {
        console.log(`Console star not affected because it does not match the clicked item (type: ${type}, id: ${id})`);
    }
}

// Function to add a favorite star
function addFavoriteStar(type, id, name) {
    // Check favorites from localStorage
    const favorites = JSON.parse(localStorage.getItem('favorites')) || {};
    const isFavorite = favorites[type] && favorites[type][id];

    // Create the star icon element
    const starIcon = document.createElement('i');
    starIcon.className = isFavorite ? 'fa-solid fa-star' : 'fa-regular fa-star';
    starIcon.style.cursor = 'pointer';
    starIcon.style.marginLeft = '10px';
    starIcon.title = 'Click to toggle favorite';

    // Toggle favorite status on click
    starIcon.addEventListener('click', () => {
        if (!favorites[type]) favorites[type] = {};
        if (favorites[type][id]) {
            delete favorites[type][id]; // Remove from favorites
            starIcon.className = 'fa-regular fa-star';
        } else {
            favorites[type][id] = name; // Add to favorites
            starIcon.className = 'fa-solid fa-star';
        }
        localStorage.setItem('favorites', JSON.stringify(favorites));
    });

    return starIcon;
}

async function fetchMoneyObject() {
    const cacheBuster = `?t=${new Date().getTime()}`;
    const response = await fetch(`https://makinmagic.github.io/XenoSO/data/highest_paying_object.json${cacheBuster}`);
    const data = await response.json();

    const moneyObjectContainer = document.getElementById("money-object");
    const now = new Date(); // Current system time
    const utcNow = new Date(now.toISOString()); // Current time in UTC

    // Parse the updated_at timestamp from the JSON
    const updatedAt = new Date(data.updated_at);

    // Define 3 AM UTC for the day of the updated_at timestamp
    const startTime = new Date(Date.UTC(updatedAt.getUTCFullYear(), updatedAt.getUTCMonth(), updatedAt.getUTCDate(), 3, 0, 0));

    // Define 3 AM UTC for the following day
    const endTime = new Date(startTime);
    endTime.setUTCDate(startTime.getUTCDate() + 1);

    // Logic to determine if the current time falls in the valid period
    if (utcNow >= startTime && utcNow < endTime) {
        let content;

        if (data.image_url) {
            content = `Today's money object is: <strong>${data.highest_paying_object.trim()}</strong>! See all objects <a href="${data.image_url}" target="_blank">here</a>. (Brought to you by The Piggy Bank)`;
        } else {
            content = `Today's money object is: <strong>${data.highest_paying_object.trim()}</strong>! (Brought to you by The Piggy Bank)`;
        }

        moneyObjectContainer.innerHTML = content;
        moneyObjectContainer.style.display = "block";
    } else {
        moneyObjectContainer.innerHTML = "Today's money object is being updated. Please check in-game for now!";
        moneyObjectContainer.style.display = "block";
    }
}

function sortTable(columnIndex, type) {
  const table = document.querySelector('#players table');
  const rows = Array.from(table.tBodies[0].rows);

  const header = table.tHead.rows[0].cells[columnIndex];
  const isAscending = header.dataset.sortOrder !== 'asc';
  header.dataset.sortOrder = isAscending ? 'asc' : 'desc';

  rows.sort((rowA, rowB) => {
    let cellA = rowA.cells[columnIndex].textContent.trim();
    let cellB = rowB.cells[columnIndex].textContent.trim();

    if (type === 'number') {
      cellA = parseInt(cellA.replace(/[^0-9]/g, ''), 10); // Extract the number
      cellB = parseInt(cellB.replace(/[^0-9]/g, ''), 10); // Extract the number
    }

    if (type === 'number') {
      return isAscending ? cellA - cellB : cellB - cellA;
    } else {
      return isAscending ? cellA.localeCompare(cellB) : cellB.localeCompare(cellA);
    }
  });

  const tbody = table.tBodies[0];
  rows.forEach(row => tbody.appendChild(row));
}

function sortByFavorites() {
  const table = document.querySelector('#players table');
  const rows = Array.from(table.tBodies[0].rows);

  // Sort by favorite status
  rows.sort((rowA, rowB) => {
    const isAFavorite = rowA.querySelector('.fa-solid.fa-star') ? 1 : 0;
    const isBFavorite = rowB.querySelector('.fa-solid.fa-star') ? 1 : 0;

    return isBFavorite - isAFavorite; // Favorites first
  });

  // Re-append rows in sorted order
  const tbody = table.tBodies[0];
  rows.forEach(row => tbody.appendChild(row));
}

// Generate stars - used with permission from Sorta
    function generateStars() {
      const stars = document.getElementById('stars');
      const starCount = 150;
      
      for (let i = 0; i < starCount; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        
        // Random position
        star.style.left = `${Math.random() * 100}%`;
        star.style.top = `${Math.random() * 100}%`;
        
        // Random size
        const size = Math.random() * 2 + 1;
        star.style.width = `${size}px`;
        star.style.height = `${size}px`;
        
        // Add twinkling effect to some stars
        if (Math.random() > 0.7) {
          star.style.animation = `twinkle ${Math.random() * 3 + 2}s infinite ease-in-out`;
        }
        
        stars.appendChild(star);
      }
    }

// One-off announcements
document.addEventListener("DOMContentLoaded", function () {
  const now = new Date();

  const expiry = new Date(Date.UTC(2025, 6, 4, 22, 45, 0));

  const timeUntilExpire = expiry - now;

  if (timeUntilExpire > 0) {
    setTimeout(() => {
      const msg = document.getElementById('event-message');
      if (msg) msg.style.display = 'none';
    }, timeUntilExpire);
  } else {
    
    const msg = document.getElementById('event-message');
    if (msg) msg.style.display = 'none';
  }
});

//Countdown

function updateCountdown() {
    const endTime = new Date("July 14, 2025 03:00:00 UTC").getTime(); //To be changed as needed
    const now = new Date().getTime();
    const timeRemaining = endTime - now;

    if (timeRemaining > 0) {
      const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
      const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);

      document.getElementById("time").innerHTML = `${days}d ${hours}h ${minutes}m ${seconds}s`;
    } else {
      document.getElementById("countdown").style.display = "none";
      clearInterval(countdownInterval);
    }
  }

const countdownInterval = setInterval(updateCountdown, 1000);
        
document.addEventListener('DOMContentLoaded', () => {
    // Check if dark mode was previously enabled
    if (localStorage.getItem('darkMode') === 'enabled') {
        document.body.classList.add('dark-mode');
        document.getElementById('darkModeIcon').classList.replace('fa-moon', 'fa-sun');
    }

    document.getElementById('dark-mode-toggle').addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');

        // Toggle icon between moon and sun
        const icon = document.getElementById('darkModeIcon');
        if (document.body.classList.contains('dark-mode')) {
            icon.classList.replace('fa-moon', 'fa-sun');
            localStorage.setItem('darkMode', 'enabled'); // Save preference
        } else {
            icon.classList.replace('fa-sun', 'fa-moon');
            localStorage.setItem('darkMode', 'disabled'); // Save preference
        }
    });
});
