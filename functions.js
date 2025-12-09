async function loadLotName(lotId) {
            if (lotId === 0) return 'Unknown';
            const lotData = await fetch('https://api.xenoso.space/userapi/city/1/city.json');
            return lotData ? lotData.name : 'N/A';
        }

        async function loadActiveLots() {
    try {
        const response = await fetch('https://api.xenoso.space/userapi/city/1/city.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const activeLotsData = await response.json();

        const lotMapping = {};
        const names = activeLotsData.names;
        const reservedLots = activeLotsData.reservedLots;

        reservedLots.forEach((id, index) => {
            lotMapping[id] = names[index];
        });

        return lotMapping;
    } catch (error) {
        console.error('Failed to load active lots:', error);
        return {};
    }
}

// Twemoji
document.addEventListener('DOMContentLoaded', () => {
    const observer = new MutationObserver(() => {
        twemoji.parse(document.body, { folder: 'svg', ext: '.svg' });
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true
    });

    twemoji.parse(document.body, { folder: 'svg', ext: '.svg' });
});

// Define emoji rules
function formatDisplayName(name) {
  const adminNames = ["Sorta", "Savaki", "Daat", "Xeno", "Eric", "Sneaky", "Nyx", "Bruglar", "Breaker", "Magic Genie", "PETA", "Holly Claus", "Santa", "Headless Horseman"];
  const mentorNames = ["Mentor Teddy", "Mr Teddy", "Jack Lumberjack", "Beary Cold"];

  let display = name;

  if (adminNames.includes(name)) {
    display += ` <span title="Admin">🛡️</span>`;
  } else if (mentorNames.includes(name)) {
    display += ` <span title="Mentor">🎓</span>`;
  }

  return display;
}

let jobFilterEnabled = false;

function toggleJobFilter() {
    jobFilterEnabled = !jobFilterEnabled;
    loadOnlinePlayers();
}

// Sims Online table

const nhoodMap = {
    1: "The Weirding Triangle",
    2: "Nebula Heights",
    3: "Solaris Slopes",
    4: "Stardust Valley",
    5: "Great Orion Wall",
    6: "Stellar Springs",
    7: "Apollo Acres"
};

async function loadOnlinePlayers() {
    try {

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
        playersContainer.innerHTML = '';

        const lotMapping = await loadActiveLots();
		
        const favorites = JSON.parse(localStorage.getItem('favorites')) || {};
        const favoriteSims = favorites.sims || {};

        const sortedAvatars = onlineData.avatars.sort((a, b) => {
            const isAFavorite = favoriteSims[a.avatar_id] ? 1 : 0;
            const isBFavorite = favoriteSims[b.avatar_id] ? 1 : 0;
            if (isBFavorite !== isAFavorite) {
                return isBFavorite - isAFavorite;
            }
            return a.name.localeCompare(b.name);
        });

        const fetchPlayerDetailsPromises = sortedAvatars.map(avatar =>
            fetch(`https://api.xenoso.space/userapi/avatars/${avatar.avatar_id}`).then(response => response.json())
        );

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
    <i class="fa-solid fa-briefcase" 
       style="cursor: pointer; margin-left: 6px;" 
       title="Show sims at work"
       onclick="toggleJobFilter()"></i>
</th>
    </tr>
</thead>
                <tbody>`;

        sortedAvatars.forEach((avatar, index) => {
    const playerDetails = playerDetailsArray[index];

    const isJobLot = avatar.location.toString().length === 10;

    if (jobFilterEnabled && !isJobLot) return;

const jobMap = {
    1: "Factory",
    2: "Diner",
    4: "Club Job",
    5: "Club Job"
};

let lotName;

if (isJobLot && playerDetails.current_job) {
    const jobName = jobMap[playerDetails.current_job] || "Job";

    let jobLevel = null;
    if (typeof playerDetails.description === 'string') {
        const levelMatch = playerDetails.description.match(/\b(?:level|lvl)\s*(\b(?:[0-9]|10))\b/i);
        if (levelMatch) {
            jobLevel = parseInt(levelMatch[1]);
        }
    }

    lotName = `At ${jobName} 💼`;
if (jobLevel !== null && !isNaN(jobLevel)) {
    lotName += ` (Lv. ${jobLevel})`;
}

} else {
    lotName = lotMapping[avatar.location] || 'Unknown';
}
		
const creationDate = new Date(playerDetails.date * 1000);
const currentDate = new Date();
const ageInDays = Math.floor((currentDate - creationDate) / (1000 * 60 * 60 * 24));

const isFavorite = favoriteSims[avatar.avatar_id];
					
            tableHtml += `
            <tr data-avatar-id="${avatar.avatar_id}">
        <td data-simname="${avatar.name}">
            <i class="${isFavorite ? 'fa-solid fa-star' : 'fa-regular fa-star'}" 
               title="Click to toggle favorite" 
               data-favorite-id="${avatar.avatar_id}" 
               onclick="toggleFavorite('sims', '${avatar.avatar_id}', '${avatar.name}', event)"></i>
            ${formatDisplayName(avatar.name)}
			${playerDetails.mayor_nhood !== null 
			    ? `<span class="mayor-icon" title="Mayor of ${nhoodMap[playerDetails.mayor_nhood]}">🎩</span>` 
			    : ''
			}${(isJobLot && /join me at/i.test(playerDetails.description || '')) 
  ? ' <span class="join-label" title="This sim is looking for others to join them at work!">Join me at work!</span>' 
  : ''}
        </td>
        <td class="hidden">${avatar.avatar_id}</td>
        <td>${ageInDays} days</td>
        <td class="hidden">${avatar.location}</td>
        <td>${lotName}</td>
    </tr>`;
        });

        tableHtml += `
                </tbody>
            </table>`;

        playersContainer.innerHTML = tableHtml;

        const playerRows = playersContainer.querySelectorAll('tr[data-avatar-id]');
        playerRows.forEach(row => {
            row.addEventListener('click', () => {
                const avatarId = row.dataset.avatarId;
                displayPlayerInfo(avatarId);
            });
        });


        if (playersTitle) {
            playersTitle.innerHTML = `<span class="sims-online-icon"></span> Sims Online: ${onlineData.avatars_online_count} <span class="sims-online-icon"></span>`;
        }

} catch (error) {
        console.error('Failed to load online players:', error);
        document.getElementById('players').innerHTML = `
			  <div class="console-message">
			    ⚠️ Error loading data. Please check again soon.
			  </div>
			`;

        if (playersTitle) {
            playersTitle.innerHTML = `<span class="sims-online-icon"></span> Sims Online: 0 <span class="sims-online-icon"></span>`;
        }
    }
}

        const categoryMapping = {
                1: 'Money',
                2: 'Offbeat',
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

let currentFilter = '';

function filterLots(type) {

    if (currentFilter === type) {
        type = '';
        currentFilter = '';
    } else {
        currentFilter = type;
    }

    const rows = document.querySelectorAll('#lots tbody tr');
    rows.forEach(row => {
        const lotTypeCell = row.querySelector('td:nth-child(3)');
        if (!type || (lotTypeCell && lotTypeCell.textContent.trim() === type)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
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
        lotsContainer.innerHTML = '';

        const favorites = JSON.parse(localStorage.getItem('favorites')) || {};
        const favoriteLots = favorites.lots || {};

        let lotsData = activeLots.map((lotID, index) => {
            return {
                name: lotMapping[lotID] || lotID,
                count: onlineCounts[index],
                id: lotID,
                isFavorite: !!favoriteLots[lotID]
            };
        });

        lotsData.sort((a, b) => {
            if (b.isFavorite !== a.isFavorite) {
                return b.isFavorite - a.isFavorite;
            }
            if (b.count !== a.count) {
                return b.count - a.count;
            }
            return a.name.localeCompare(b.name);
        });

        const fetchLotDetailsPromises = lotsData.map(lot =>
            fetch(`https://api.xenoso.space/userapi/city/1/i${lot.id}.json`).then(r => r.json())
        );
        const lotDetailsArray = await Promise.all(fetchLotDetailsPromises);

        const admitIcons = {
            0: "🟢", // Admit All
            1: "🟡", // Admit List
            2: "🟢", // Ban List
            3: "🔴", // Ban All
            4: "🟢"  // Admit All
        };

		const admitModeMapping = {
		    0: "Admit All",
		    1: "Admit List",
		    2: "Ban List",
		    3: "Ban All",
		    4: "Admit All"
		};

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

                const admitEmoji = admitIcons[lotDetails.admit_mode] || "⚪";

                tableHtml += `
                    <tr data-lot-id="${lot.id}">
                        <td>
                            <i class="${lot.isFavorite ? 'fa-solid fa-star' : 'fa-regular fa-star'}"
                               title="Click to toggle favorite" 
                               data-favorite-id="${lot.id}" 
                               onclick="toggleFavorite('lots', '${lot.id}', '${lot.name}', event)"></i>

                            <span class="lot-admit-icon" title="${admitModeMapping[lotDetails.admit_mode]}">${admitEmoji}</span>
                            <span class="lot-name">${lot.name}</span>
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
    consoleContent.dataset.id = lotId;
    consoleContent.dataset.type = 'lots';

	setMemorialMode(false, document.getElementById('console-container'), consoleContent);

    const url = `https://api.xenoso.space/userapi/city/1/i${lotId}.json`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const lotData = await response.json();

        const admitModeMapping = {
            0: '🟢 Admit All',
            1: '🟡 Admit List',
            2: '🟢 Ban List',
            3: '🔴 Ban All',
            4: '🟢 Admit All'
        };

        const ownerNameUrl = `https://api.xenoso.space/userapi/avatars/${lotData.owner_id}`;
        const ownerResponse = await fetch(ownerNameUrl);
        const ownerData = ownerResponse.ok ? await ownerResponse.json() : { name: 'Unknown' };
        const ownerName = ownerData.name || 'Unknown';

        const roommatesWithoutOwner = lotData.roommates.filter(id => id !== lotData.owner_id);

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

        const formattedDescription = ((lotData.description || 'No description available.')
  .split(/\r?\n/)
  .map(line => {
    if (/^-{5,}$/.test(line.trim())) {
      return `<span style="font-family: monospace;">${line}</span>`;
    }
    return line;
  }).join('<br>')
);

	const creationDate = new Date(lotData.created_date * 1000).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
});

        const playersContainer = document.getElementById('players');
        const playersRows = Array.from(playersContainer.querySelectorAll('tr'));
        const knownSims = playersRows
            .filter(row => {
                const locationCell = row.querySelector('.hidden:nth-child(4)');
                return locationCell && locationCell.textContent === lotId.toString();
            })
            .map(row => row.querySelector('td')?.dataset.simname?.trim() || '');

let appendedHiddenHost = null;

const adminNamesLower = [
  "sorta","savaki","daat","xeno","eric","sneaky",
  "nyx","bruglar","breaker","magic genie","peta","holly claus","santa", "headless horseman" 
];

const allHosts = [ownerName, ...roommateNames]
  .filter(Boolean)
  .filter(n => !adminNamesLower.includes(n.trim().toLowerCase()));

const normalizedHosts = allHosts.map(n => n.trim().toLowerCase());
const normalizedKnown = knownSims
  .filter(n => n.trim() !== "")
  .map(n => n.trim().toLowerCase());

const anyHostAlreadyListed = normalizedHosts.some(n => normalizedKnown.includes(n));

if (!anyHostAlreadyListed && normalizedHosts.length > 0) {
  const candidateHosts = playersRows
    .map(row => {
      const nameCell = row.querySelector('td');
      const locationCell = row.querySelector('.hidden:nth-child(4)');
      const name = nameCell?.dataset.simname?.trim() || nameCell?.textContent.trim();
      if (!name) return null;

      const lowerName = name.toLowerCase();

      if (adminNamesLower.includes(lowerName)) return null;

      const location = (locationCell?.textContent || "").trim().toLowerCase();

      const isHost = normalizedHosts.includes(lowerName);
      const isUnknown = location === '0' || /unknown|^\s*$|^[-–]$/.test(location);
      const alreadyListed = normalizedKnown.includes(lowerName);

      return isHost && isUnknown && !alreadyListed ? name : null;
    })
    .filter(Boolean);

  if (candidateHosts.length === 1) {
    appendedHiddenHost = candidateHosts[0];
  }
}

	const fullKnownSimsList = [...knownSims];
if (appendedHiddenHost) {
  fullKnownSimsList.push(`${appendedHiddenHost} (hidden)`);
}

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

        const favorites = JSON.parse(localStorage.getItem('favorites')) || {};
        const isFavorite = favorites.lots && favorites.lots[lotId];

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
    <div class="description-container">${formattedDescription}</div>
    <p><strong>Lot Type:</strong> ${categoryMapping[lotData.category] || 'Unknown'}</p>
    <p><strong>Admit Mode:</strong> ${admitModeMapping[lotData.admit_mode] || 'Unknown'}</p>
    <p><strong>Established on:</strong> ${creationDate}</p>
    <p><strong>Owner:</strong> <span class="sim-name" data-simname="${ownerName}" onclick="openSimModal(event)" style="color: #FFA502;">${ownerName}</span></p>
    <p><strong>Roommates:</strong> ${
        roommateNames.length > 0
        ? roommateNames.map(name =>
            `<span class="sim-name" data-simname="${name}" onclick="openSimModal(event)" style="color: #DDA0DD;">${name}</span>`
      ).join(', ')
    : 'None'
}</p>
    <p><strong>Known Sims Inside:</strong> ${
        fullKnownSimsList.length > 0
        ? fullKnownSimsList.map(name => {
            const trimmed = name.trim().replace(' (hidden)', '');
            const isHidden = name.includes('(hidden)');
            const isOwner = trimmed === ownerName;
            const isRoommate = roommateNames.includes(trimmed);
            const color = isOwner ? '#FFA502' : isRoommate ? '#DDA0DD' : '#FFF';
            return `<span class="sim-name" data-simname="${trimmed}" onclick="openSimModal(event)" style="color: ${color};">${formatDisplayName(trimmed)}${isHidden ? ' (hidden)' : ''}</span>`;
      }).join(', ')
    : 'None'
}</p>
    ${showHiddenNote ? `<p><em>There are sims inside with their location hidden.</em></p>` : ''}
`;

        const memorialList = await fetchMemorialList();
        const isMemorializedLot = memorialList.some(entry =>
            entry.name.toLowerCase() === ownerName.toLowerCase()
        );

        setMemorialMode(isMemorializedLot, document.getElementById('console-container'), consoleContent);

        if (isMemorializedLot) {
            const tribute = document.createElement('div');
            tribute.innerHTML = `
                <p style="text-align:center; color:#FFD700; font-style:italic; margin-top:15px; margin-bottom:15px;">
                    🕯️ In Loving Memory of ${ownerName}, whose legacy lives on through this lot. 🕯️
                </p>
            `;
            const img = consoleContent.querySelector('.console-img');
            if (img) img.insertAdjacentElement('afterend', tribute);
        }

	    document.getElementById('console-container')?.scrollIntoView({
    	behavior: 'smooth',
   	block: 'start'
	});
	    
    } catch (error) {
        console.error('Failed to fetch lot details:', error);
        consoleContent.innerHTML = 'Error loading lot details.';
    }
}

// Memorial List
async function fetchMemorialList() {
  try {
    const response = await fetch('https://makinmagic.github.io/XenoSO/data/memorial.json');
    if (!response.ok) throw new Error('Failed to fetch memorial list.');
    return await response.json();
  } catch (error) {
    console.error('Error fetching memorial list:', error);
    return [];
  }
}

async function fetchPlayerImages() {
    const playerImagesUrl = 'https://opensheet.vercel.app/1CJQX1Y5zwayEqCpu3T2DljNkHBOCSNPTbH0YEhnpkqA/PFP';

    try {
        const response = await fetch(playerImagesUrl);
        if (!response.ok) throw new Error('Failed to fetch player images.');

        const rawData = await response.json();
        const result = {};

        rawData.forEach(entry => {
            const name = entry["Sim Name"]?.trim();
            const url = entry["PFP URL"]?.trim();

            if (name && url) {
                result[name] = url;
            }
        });

        return result;
    } catch (error) {
        console.error(error);
        return {};
    }
}

function setMemorialMode(isActive, container, content) {
  const isModal = container.id === 'sim-modal-content' || container.closest('#sim-modal');

  if (isActive) {
    if (isModal) {
      const modalContent = document.querySelector('#sim-modal .modal-content');
      if (modalContent) modalContent.style.backgroundColor = '#000';
    } else {
      container.style.background = '#000';
      content.style.background = '#000';
    }
    container.dataset.memorial = 'true';
  } else if (container.dataset.memorial === 'true') {
    delete container.dataset.memorial;
    content.removeAttribute('style');
    container.removeAttribute('style');

    if (isModal) {
      const modalContent = document.querySelector('#sim-modal .modal-content');
      if (modalContent) modalContent.removeAttribute('style');
    }
  }
}

function getNextSkillLock(creationDate) {
    const creationMs = creationDate.getTime();
    const nowMs = Date.now();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;

    const cycles = Math.floor((nowMs - creationMs) / sevenDays) + 1;
    const nextLockMs = creationMs + cycles * sevenDays;
    const nextLockDate = new Date(nextLockMs);

    const lockWeekday = nextLockDate.toLocaleDateString(undefined, { weekday: 'long' });
    const lockTime = nextLockDate.toLocaleTimeString(undefined, { hour: 'numeric', minute: 'numeric', hour12: true });
    const userTZ = Intl.DateTimeFormat().resolvedOptions().timeZone;

    return {
        date: nextLockDate,
        weekday: lockWeekday,
        time: lockTime,
        timezone: userTZ,
        formatted: `${lockWeekday} at ${lockTime} (${userTZ})`
    };
}
	    
async function displayPlayerInfo(avatarId) {
    const consoleContent = document.getElementById('console-content');
    consoleContent.innerHTML = '';
	setMemorialMode(false, document.getElementById('console-container'), consoleContent);
    consoleContent.dataset.id = avatarId;
    consoleContent.dataset.type = 'sims';

    const playerImages = await fetchPlayerImages();
    const url = `https://api.xenoso.space/userapi/avatars/${avatarId}`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch player details.');
        const playerData = await response.json();

        const simName = playerData.name;
        const playerImage = playerImages[simName] || 'https://makinmagic.github.io/XenoSO/images/pfp-placeholder.png';

        // Debug
        if (!playerImages[simName]) {
            console.warn(`Image not found for Sim: ${simName}. Using placeholder.`);
        } else {
            console.log(`Image found for Sim: ${simName}: ${playerImage}`);
        }

        const creationDate = new Date(playerData.date * 1000);
        const currentDate = new Date();
        const ageInDays = Math.floor((currentDate - creationDate) / (1000 * 60 * 60 * 24));
		const nextLock = getNextSkillLock(creationDate);

        const playersContainer = document.getElementById('players');
        const locationRow = Array.from(playersContainer.querySelectorAll('tr'))
            .find(row => row.querySelector('.hidden:nth-child(2)').textContent === avatarId.toString());
        const playerLocation = locationRow ? locationRow.querySelector('td:nth-child(5)').textContent : 'Unknown';

	const formattedDescription = (playerData.description || 'No description available.').replace(/(\r\n|\n|\r)/g, '<br>');

        const favorites = JSON.parse(localStorage.getItem('favorites')) || {};
        const isFavorite = favorites.sims && favorites.sims[avatarId];

	const jobMap = {
   	 1: 'Factory 🏭',
 	 2: 'Diner 🍽️',
	 4: 'Club 🪩',
	 5: 'Club 🪩'
	};
	const jobName = jobMap[playerData.current_job];

	// Memorial check
const memorialList = await fetchMemorialList();
const memorialEntry = memorialList.find(entry => 
  entry.name.toLowerCase() === playerData.name.toLowerCase()
);

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
                <a href="https://docs.google.com/forms/d/e/1FAIpQLSd-aCzrhLeTmjeVUwR-1aekq5o7v0OhGpKQP-c5gUGULeHbQw/viewform?usp=pp_url&entry.1723241866=${encodeURIComponent(playerData.name)}" target="_blank" style="text-decoration: underline;">Submit/Change Profile Picture</a>
            </p>
            <div class="description-container">${formattedDescription}</div>
            <p><strong>Age:</strong> ${ageInDays} days old</p>
            <p><strong>Location:</strong> ${playerLocation}</p>
	    ${jobName ? `<p><strong>Job:</strong> ${jobName}</p>` : ''}
		    <p><strong>Next Skill Lock:</strong> ${nextLock.formatted}</p>
				${playerData.mayor_nhood !== null 
		    ? `<p><span style="filter: brightness(1) drop-shadow(0 0 2px #fff);">🎩</span> Mayor of ${nhoodMap[playerData.mayor_nhood]}</p>`
		    : ''
		}
        `;
		showSimNoteInline(avatarId);

const consoleContainer = document.getElementById('console-container');
setMemorialMode(!!memorialEntry, consoleContainer, consoleContent);

if (memorialEntry) {
  const tribute = document.createElement('div');
  tribute.innerHTML = `
    <p style="text-align:center; color:#FFD700; font-style:italic; margin-top:0px; margin-bottom:15px;">
      ${memorialEntry.message}
    </p>
  `;

  const descriptionContainer = consoleContent.querySelector('.description-container');
  if (descriptionContainer) {
    descriptionContainer.parentNode.insertBefore(tribute, descriptionContainer);
  }

  const title = consoleContent.querySelector('.console-title');
  if (title && !title.textContent.includes(memorialEntry.symbol)) {
    title.innerHTML = `${memorialEntry.symbol} ${title.innerHTML} ${memorialEntry.symbol}`;
  }

  const onlineParagraph = Array.from(consoleContent.querySelectorAll('p')).find(p =>
    p.textContent.toLowerCase().includes('currently online')
  );
  if (onlineParagraph) {
    onlineParagraph.style.opacity = '0.3';
  }
}
	
	document.getElementById('console-container')?.scrollIntoView({
    	behavior: 'smooth',
   	block: 'start'
	});
	    
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
        document.getElementById('console-content').innerHTML = '<p style="text-align: center; color: #F0F0F0;">Select or search for a Sim or Lot to see more information, or click on an Event to view details.</p>';
    }
}

// Autocomplete setup for Sim search
async function loadSimNames() {
  try {
    const res = await fetch("https://makinmagic.github.io/XenoSO/data/simnames.json");
    const names = await res.json();

    const datalist = document.getElementById("simnames");
    datalist.innerHTML = names.map(name => `<option value="${name}">`).join("");
  } catch (err) {
    console.error("Failed to load simnames.json:", err);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadSimNames();

  const simSearch = document.getElementById("sim-search");
  if (simSearch) {
    simSearch.addEventListener("change", (event) => {
      searchSim({ key: "Enter", target: event.target });
    });
  }
});

async function searchSim(event) {
    if (event.key === 'Enter' || event.keyCode === 13) {
        const simName = event.target.value.trim();
        if (!simName) return;

        const url = `https://api.xenoso.space/userapi/city/1/avatars/name/${simName}`;
        const consoleContent = document.getElementById('console-content');
        consoleContent.innerHTML = '';
        consoleContent.dataset.id = simName;
        consoleContent.dataset.type = 'sims';

        try {
            const playerImages = await fetchPlayerImages();
            const response = await fetch(url);
            if (!response.ok) throw new Error('Sim not found');

            const playerData = await response.json();

            const playerImage = playerImages[playerData.name] || 'https://makinmagic.github.io/XenoSO/images/pfp-placeholder.png';

            // Debugging logs
            console.log(`Image for ${playerData.name}: ${playerImage}`);

            const creationDate = new Date(playerData.date * 1000);
            const currentDate = new Date();
            const ageInDays = Math.floor((currentDate - creationDate) / (1000 * 60 * 60 * 24));
			const nextLock = getNextSkillLock(creationDate);

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

            const nameToIdMap = JSON.parse(localStorage.getItem('nameToIdMap')) || {};
            const idFromName = nameToIdMap[simName] || playerData.avatar_id;
            nameToIdMap[simName] = idFromName;
            localStorage.setItem('nameToIdMap', JSON.stringify(nameToIdMap));

            const favorites = JSON.parse(localStorage.getItem('favorites')) || {};
            const isFavorite = favorites.sims && favorites.sims[idFromName];

	   const jobMap = {
 	   1: 'Factory 🏭',
    	   2: 'Diner 🍽️',
	   4: 'Club 🪩',
    	   5: 'Club 🪩'
	    };
	   const jobName = jobMap[playerData.current_job];

		const memorialList = await fetchMemorialList();
		const memorialEntry = memorialList.find(entry => 
		  entry.name.toLowerCase() === playerData.name.toLowerCase()
		);

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
                <div class="description-container">${(playerData.description || 'No description available.').replace(/(\r\n|\n|\r)/g, '<br>')}</div>
                <p><strong>Age:</strong> ${ageInDays} days old</p>
                ${isOnline ? `<p><strong>Location:</strong> ${playerLocation}</p>` : ''}
		${jobName ? `<p><strong>Job:</strong> ${jobName}</p>` : ''}
		        <p><strong>Next Skill Lock:</strong> ${nextLock.formatted}</p>
		${playerData.mayor_nhood !== null 
		    ? `<p><span style="filter: brightness(1) drop-shadow(0 0 2px #fff);">🎩</span> Mayor of ${nhoodMap[playerData.mayor_nhood]}</p>`
		    : ''
		}
                <p><strong>Currently Online:</strong> ${isOnline ? 'Yes 🟢' : 'No 🔴'}</p>
            `;
		showSimNoteInline(idFromName);

const consoleContainer = document.getElementById('console-container');
setMemorialMode(!!memorialEntry, consoleContainer, consoleContent);

if (memorialEntry) {
  const tribute = document.createElement('div');
  tribute.innerHTML = `
    <p style="text-align:center; color:#FFD700; font-style:italic; margin-top:0px; margin-bottom:15px;">
      ${memorialEntry.message}
    </p>
  `;

  const descriptionContainer = consoleContent.querySelector('.description-container');
  if (descriptionContainer) {
    descriptionContainer.parentNode.insertBefore(tribute, descriptionContainer);
  }

  const title = consoleContent.querySelector('.console-title');
  if (title && !title.textContent.includes(memorialEntry.symbol)) {
    title.innerHTML = `${memorialEntry.symbol} ${title.innerHTML} ${memorialEntry.symbol}`;
  }

  const onlineParagraph = Array.from(consoleContent.querySelectorAll('p')).find(p =>
    p.textContent.toLowerCase().includes('currently online')
  );
  if (onlineParagraph) {
    onlineParagraph.style.opacity = '0.3';
  }
}
			
	document.getElementById('console-container')?.scrollIntoView({
    	behavior: 'smooth',
   	block: 'start'
	});
		
        } catch (error) {
            console.error('Failed to fetch sim details:', error);
            consoleContent.innerHTML = `
			  <div class="console-message">
			    🤔 Sim not found. Please check the spelling or try another name.
			  </div>
			`;
        }
    }
}

// Autocomplete setup for Lot search
async function loadLotNames() {
  try {
    const res = await fetch("https://makinmagic.github.io/XenoSO/data/lotnames.json");
    const names = await res.json();

    const datalist = document.getElementById("lotnames");
    datalist.innerHTML = names.map(name => `<option value="${name}">`).join("");
  } catch (err) {
    console.error("Failed to load lotnames.json:", err);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadLotNames();

  const lotSearch = document.getElementById("lot-search");
  if (lotSearch) {
    lotSearch.addEventListener("change", (event) => {
      searchLot({ key: "Enter", target: event.target });
    });
  }
});

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
                1: '💲 Money',
                2: '🦆 Offbeat',
                3: '❤️ Romance',
                4: '🍵 Service',
                5: '🎁 Store',
                6: '🔨 Skills',
                7: '🤝 Welcome',
                8: '🎲 Games',
                9: '🎭 Entertainment',
                10: '🏠 Residential',
                11: '🏨 Community'
            };

            // Format description and creation date
            const formattedDescription = ((lotData.description || 'No description available.')
  .split(/\r?\n/)
  .map(line => {
    if (/^-{5,}$/.test(line.trim())) {
      return `<span style="font-family: monospace;">${line}</span>`;
    }
    return line;
  }).join('<br>')
);
            const creationDate = new Date(lotData.created_date * 1000).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
});
			
            const favorites = JSON.parse(localStorage.getItem('favorites')) || {};
            const isFavorite = favorites.lots && favorites.lots[lotData.location];

            const lotsContainer = document.getElementById('lots');
            const isActive = Array.from(lotsContainer.querySelectorAll('tr')).some(row => {
    const firstCell = row.querySelector('td');
    return firstCell && firstCell.textContent.trim().toLowerCase() === lotData.name.trim().toLowerCase();
});

            const activeStatus = isActive ? 'Yes 🟢' : 'No 🔴';
            
            const lotRow = Array.from(lotsContainer.querySelectorAll('tr')).find(row =>
    row.querySelector('td')?.textContent.trim().toLowerCase() === lotData.name.trim().toLowerCase()
);

            let totalSimsInside = 0;
            if (lotRow) {
                const simsInsideCell = lotRow.querySelector('td:nth-child(2)');
                totalSimsInside = parseInt(simsInsideCell?.textContent.trim() || '0', 10);
            }

            const ownerResponse = await fetch(`https://api.xenoso.space/userapi/avatars/${lotData.owner_id}`);
            const ownerData = ownerResponse.ok ? await ownerResponse.json() : { name: 'Unknown' };
            const ownerName = ownerData.name;

            const roommateNames = await Promise.all(
                lotData.roommates
                    .filter(id => id !== lotData.owner_id)
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

const playersContainer = document.getElementById('players');
const knownSims = Array.from(playersContainer.querySelectorAll('tr'))
  .filter(row => {
    const locationCell = row.querySelector('.hidden:nth-child(4)');
    return locationCell && locationCell.textContent == lotData.location;
  })
  .map(row => row.querySelector('td')?.dataset.simname?.trim() || '');

const adminNamesLower = [
  "sorta","savaki","daat","xeno","eric","sneaky",
  "nyx","bruglar","breaker","magic genie","peta","holly claus","santa", "headless horseman"
];

let appendedHiddenHost = null;

const allHosts = [ownerName, ...roommateNames]
  .filter(Boolean)
  .filter(n => !adminNamesLower.includes(n.trim().toLowerCase()));

const normalizedHosts = new Set(allHosts.map(n => n.trim().toLowerCase()));
const normalizedKnown = new Set(
  knownSims.filter(n => n.trim() !== "").map(n => n.trim().toLowerCase())
);

const anyHostAlreadyListed = Array.from(normalizedHosts).some(name =>
  normalizedKnown.has(name)
);

if (!anyHostAlreadyListed && normalizedHosts.size > 0) {
  const candidateHosts = Array.from(playersContainer.querySelectorAll('tr'))
    .map(row => {
      const nameCell = row.querySelector('td');
      const locationCell = row.querySelector('.hidden:nth-child(4)');

      const name =
        nameCell?.dataset.simname?.trim() || nameCell?.textContent.trim();
      if (!name) return null;

      const lowerName = name.toLowerCase();

      if (adminNamesLower.includes(lowerName)) return null;

      const location = (locationCell?.textContent || "")
        .trim()
        .toLowerCase();

      const isHost = normalizedHosts.has(lowerName);
      const isUnknown =
        location === "0" || /unknown|^\s*$|^[-–]$/.test(location);
      const alreadyListed = normalizedKnown.has(lowerName);

      return isHost && isUnknown && !alreadyListed ? name : null;
    })
    .filter(Boolean);

  if (candidateHosts.length === 1) {
    appendedHiddenHost = candidateHosts[0];
  }
}

const fullKnownSimsList = [...knownSims];
if (appendedHiddenHost) {
  fullKnownSimsList.push(`${appendedHiddenHost} (hidden)`);
}
                
            const showHiddenNote = totalSimsInside > knownSims.length;

		const consoleContainer = document.getElementById('console-container');
const consoleContent = document.getElementById('console-content');
setMemorialMode(false, consoleContainer, consoleContent);
					
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
                <div class="description-container">${formattedDescription}</div>
                <p><strong>Lot Type:</strong> ${categoryMapping[lotData.category] || 'Unknown'}</p>
		<p><strong>Established on:</strong> ${creationDate}</p>
                <p><strong>Admit Mode:</strong> ${admitModeMapping[lotData.admit_mode] || 'Unknown'}</p>
                <p><strong>Owner:</strong> 
  <span class="sim-name" data-simname="${ownerName}" onclick="openSimModal(event)" style="color: #FFA502;">
    ${ownerName}
  </span>
</p>

<p><strong>Roommates:</strong> ${
  roommateNames.length > 0
    ? roommateNames.map(name =>
        `<span class="sim-name" data-simname="${name}" onclick="openSimModal(event)" style="color: #DDA0DD;">${name}</span>`
      ).join(', ')
    : 'None'
}</p>

<p><strong>Currently Active:</strong> ${activeStatus}</p>

${isActive ? `
  <p><strong>Known Sims Inside:</strong> ${
    fullKnownSimsList.length > 0
      ? fullKnownSimsList.map(name => {
          const trimmed = name.trim().replace(' (hidden)', '');
          const isHidden = name.includes('(hidden)');
          const isOwner = trimmed === ownerName;
          const isRoommate = roommateNames.includes(trimmed);
          const color = isOwner ? '#FFA502' : isRoommate ? '#DDA0DD' : '#FFF';
          return `<span class="sim-name" data-simname="${trimmed}" onclick="openSimModal(event)" style="color: ${color};">${formatDisplayName(trimmed)}${isHidden ? ' (hidden)' : ''}</span>`;
      }).join(', ')
    : 'None'
}</p>
  ${showHiddenNote ? `<p><em>There are sims inside with their location hidden.</em></p>` : ''}
` : ''}
`;

	// Memorial check
const memorialList = await fetchMemorialList();
const isMemorializedLot = memorialList.some(entry =>
  entry.name.toLowerCase() === ownerName.toLowerCase()
);

setMemorialMode(isMemorializedLot, consoleContainer, consoleContent);

if (isMemorializedLot) {
  const tribute = document.createElement('div');
  tribute.innerHTML = `
    <p style="text-align:center; color:#FFD700; font-style:italic; margin-top:10px; margin-bottom:15px;">
      🕯️ In Loving Memory of ${ownerName}, whose legacy lives on through this lot. 🕯️
    </p>
  `;

  const img = consoleContent.querySelector('.console-img');
  if (img) img.insertAdjacentElement('afterend', tribute);
}

	document.getElementById('console-container')?.scrollIntoView({
    	behavior: 'smooth',
   	block: 'start'
	});
		
        } catch (error) {
            console.error('Failed to fetch lot details:', error);
            document.getElementById('console-content').innerHTML = `
			  <div class="console-message">
			    🤔 Lot not found. Please check the spelling or try a different name.
			  </div>
			`;
        }
    }
}

async function openSimModal(event) {
  const simName = event.target.dataset.simname;
  const modal = document.getElementById('sim-modal');
  const content = document.getElementById('sim-modal-content');
  content.innerHTML = 'Loading...';
  modal.style.display = 'block';

  try {
    const url = `https://api.xenoso.space/userapi/city/1/avatars/name/${simName}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Sim not found');
    const playerData = await response.json();

    const playerImages = await fetchPlayerImages();
    const playerImage = playerImages[playerData.name] || 'https://makinmagic.github.io/XenoSO/images/pfp-placeholder.png';

    const creationDate = new Date(playerData.date * 1000);
    const currentDate = new Date();
    const ageInDays = Math.floor((currentDate - creationDate) / (1000 * 60 * 60 * 24));
	const nextLock = getNextSkillLock(creationDate);

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

    const nameToIdMap = JSON.parse(localStorage.getItem('nameToIdMap')) || {};
    const idFromName = nameToIdMap[simName] || playerData.avatar_id;
    nameToIdMap[simName] = idFromName;
    localStorage.setItem('nameToIdMap', JSON.stringify(nameToIdMap));

    const favorites = JSON.parse(localStorage.getItem('favorites')) || {};
    const isFavorite = favorites.sims && favorites.sims[idFromName];

    const jobMap = {
      1: 'Factory 🏭',
      2: 'Diner 🍽️',
      4: 'Club 🪩',
      5: 'Club 🪩'
    };
    const jobName = jobMap[playerData.current_job];

    content.innerHTML = `
      <div class="console-title">
        ${playerData.name}
        <i class="${isFavorite ? 'fa-solid fa-star' : 'fa-regular fa-star'}" 
           title="Click to toggle favorite" 
           onclick="toggleFavorite('sims', '${playerData.avatar_id}', '${playerData.name}', event)"></i>
      </div>
      <img src="${playerImage}" alt="Profile Picture" class="console-img">
      <p style="text-align: center; margin-top: -9px;">
        <a href="https://forms.gle/p7DTPGDpiztywdsM9" target="_blank" style="text-decoration: underline;">Submit/Change Profile Picture</a>
      </p>
      <div class="description-container">${(playerData.description || 'No description available.').replace(/(\r\n|\n|\r)/g, '<br>')}</div>
      <div style="text-align: left; margin-top: 10px;">
  	<p><strong>Age:</strong> ${ageInDays} days old</p>
  	${isOnline ? `<p><strong>Location:</strong> ${playerLocation}</p>` : ''}
  	${jobName ? `<p><strong>Job:</strong> ${jobName}</p>` : ''}
	<p><strong>Next Skill Lock:</strong> ${nextLock.formatted}</p>
	${playerData.mayor_nhood !== null 
		    ? `<p><span style="filter: brightness(1) drop-shadow(0 0 2px #fff);">🎩</span> Mayor of ${nhoodMap[playerData.mayor_nhood]}</p>`
		    : ''
		}
  	<p><strong>Currently Online:</strong> ${isOnline ? 'Yes 🟢' : 'No 🔴'}</p>
	</div>
    `;
	  showSimNoteInline(idFromName, true);

// Memorial check
const memorialList = await fetchMemorialList();
const memorialEntry = memorialList.find(entry =>
  entry.name.toLowerCase() === playerData.name.toLowerCase()
);

setMemorialMode(!!memorialEntry, content, content);

if (memorialEntry) {
  const tribute = document.createElement('div');
  tribute.innerHTML = `
    <p style="text-align:center; color:#FFD700; font-style:italic; margin-top:-5px; margin-bottom:10px;">
      ${memorialEntry.message}
    </p>
  `;

  const descriptionContainer = content.querySelector('.description-container');
  if (descriptionContainer) {
    descriptionContainer.parentNode.insertBefore(tribute, descriptionContainer);
  }

  const title = content.querySelector('.console-title');
  if (title && !title.textContent.includes(memorialEntry.symbol)) {
    title.innerHTML = `${memorialEntry.symbol} ${title.innerHTML} ${memorialEntry.symbol}`;
  }

  const onlineParagraph = Array.from(content.querySelectorAll('p')).find(p =>
    p.textContent.toLowerCase().includes('currently online')
  );
  if (onlineParagraph) {
    onlineParagraph.style.opacity = '0.3';
  }
}

  } catch (error) {
    console.error('Failed to fetch sim details:', error);
    content.innerHTML = '<p>Failed to load Sim info.</p>';
  }
}

function closeSimModal() {
  document.getElementById('sim-modal').style.display = 'none';
}

const eventsUrl = 'https://opensheet.elk.sh/1m3_-Vj_cOlASYfhfQarUyECk0LyZF5GYj_mZoHHQ0ho/Events';
const flagFormBaseUrl = 'https://docs.google.com/forms/d/e/1FAIpQLSfop2YQVz2xpxrOASE0BeyD7VN2m2e1JerLrOla5ZviCSYucg/viewform?usp=pp_url&entry.1329864422=';

function isEventFlagged(event) {
    const flaggedRaw = (event.Flagged || event.flagged || '').toString().trim().toLowerCase();
    return flaggedRaw === 'true' || flaggedRaw === 'yes' || flaggedRaw === '1';
}

async function fetchEvents() {
    try {
        const response = await fetch(eventsUrl);
        if (!response.ok) {
            throw new Error('Failed to load events.json');
        }
        const events = await response.json();

        const eventsContainer = document.getElementById('events-table').getElementsByTagName('tbody')[0];
        eventsContainer.innerHTML = '';

        const now = new Date();

	const upcomingEvents = events
    .filter(event => !isEventFlagged(event) && new Date(event.startTime) > now)
    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

        if (upcomingEvents.length === 0) {

            const row = eventsContainer.insertRow();
            const cell = row.insertCell();
            cell.colSpan = 3;
            cell.style.textAlign = 'center';
            cell.textContent = "No upcoming events.";
            cell.style.fontStyle = "italic";
        } else {

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
                    displayEventInfo(event);
			document.getElementById('console-container')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });
                });
            });
        }
    } catch (error) {
        console.error('Failed to fetch events:', error);
    }
}

function displayEventInfo(event) {
    const consoleContent = document.getElementById('console-content');
    setMemorialMode(false, document.getElementById('console-container'), consoleContent);

    const eventStartDate = new Date(event.startTime);
    const eventEndDate = new Date(event.endTime);

    const formattedDate = eventStartDate.toLocaleDateString(undefined, {
        weekday: 'long', month: 'long', day: 'numeric'
    });

    const formattedTime = `${eventStartDate.toLocaleTimeString(undefined, { 
        hour: 'numeric', minute: 'numeric', hour12: true 
    })} to ${eventEndDate.toLocaleTimeString(undefined, { 
        hour: 'numeric', minute: 'numeric', hour12: true 
    })} (${Intl.DateTimeFormat().resolvedOptions().timeZone})`;

    const eventId = event['Event ID'] || '';

    const flagLinkHtml = eventId
        ? `
        <p style="margin-top: 8px; text-align: center;">
            <a href="${flagFormBaseUrl}${encodeURIComponent(eventId)}" 
               target="_blank" 
               rel="noopener noreferrer"
               class="event-flag-link">
               🚩 Report/flag this event
            </a>
        </p>`
        : '';

    consoleContent.innerHTML = `
        <div class="console-title">
            ${event.name}
        </div>
        <p><strong>ℹ️ Description:</strong></p>
        <div class="event-card">
            ${event.description.replace(/(\r\n|\n|\r)/g, "<br>")}
        </div>
        ${flagLinkHtml}
        <p><strong>📅 Date:</strong> ${formattedDate}</p>
        <p><strong>🕐 Time:</strong> ${formattedTime}</p>
        <p><strong>📍 Location:</strong> ${event.location}</p>
        <p style="margin-top: 10px; text-align: underline;">
            <a href="#" id="addToCalendarLink" style="text-decoration: underline; font: inherit;">
                ⏰ Add to Calendar
            </a>
        </p>
    `;

    const addLink = document.getElementById('addToCalendarLink');
    if (addLink) {
        addLink.addEventListener('click', (e) => {
            e.preventDefault();
            addToCalendar(event);
        });
    }
}

function addToCalendar(event) {
    const icsContent = `
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//XenoSO Dashboard//EN
BEGIN:VEVENT
SUMMARY:${sanitize(event.name)}
DESCRIPTION:${sanitize(event.description)}
LOCATION:${sanitize(event.location)}
DTSTART:${formatICSDate(event.startTime)}
DTEND:${formatICSDate(event.endTime)}
END:VEVENT
END:VCALENDAR
    `.trim();

    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${event.name.replace(/\s+/g, '_')}.ics`;
    link.click();
}

function formatICSDate(date) {
    return new Date(date).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

function sanitize(text) {
    return (text || '').replace(/(\r\n|\n|\r)/g, ' ').replace(/,/g, '\\,');
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
        let currentEvents = [];

        events.forEach(event => {
            if (isEventFlagged(event)) return;

            const startTime = new Date(event.startTime);
            const endTime = new Date(event.endTime);

            if (now >= startTime && now <= endTime) {
                currentEvents.push(event);
            }
        });

        if (currentEvents.length > 0) {
            currentEventContainer.innerHTML = currentEvents
                .map(event => `🔥 Current Event: ${event.name} at ${event.location}!`)
                .join('<br>');

            currentEvents.forEach(event => addEventIconToLocation(event.location));
        } else {
            currentEventContainer.innerHTML = "";
        }
    } catch (error) {
        console.error('Failed to fetch current events:', error);
    }
}

// Function to add the fire icon to the active event's location in the Active Lots
function addEventIconToLocation(locationName) {
    const lotsTable = document.getElementById("lots");
    const rows = lotsTable.querySelectorAll("tbody tr");

    rows.forEach(row => {
        const locationCell = row.querySelector("td:first-child");
        if (locationCell && locationCell.textContent.trim().toLowerCase() === locationName.trim().toLowerCase()) {
            // Check if the fire icon is already present to avoid duplicates
if (!locationCell.querySelector('.event-icon')) {
    locationCell.insertAdjacentHTML(
        'beforeend',
        ' <span class="event-icon" title="Event is ongoing!">🔥</span>'
    );
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

//Top-paying MOs

const moPayoutAt150 = {
  Writers: 529,
  Boards: 381,
  Pinatas: 529,
  Phones: 529,
  Easels: 529,
  Gnomes: 529,
  Jams: 546,
  Potions: 596
};

let percentChart = null;

async function loadTopPayingMOs() {
  const url = 'https://opensheet.elk.sh/1DJHQ0f5X9NUuAouEf5osJgLV2r2nuzsGLIyjLkm-0NM/MOs';

  try {
    const response = await fetch(url);
    const data = await response.json();
    if (!data.length) return;

    const latest = data[data.length - 1];
    const local = new Date(latest.Timestamp);
    const formTimestamp = new Date(Date.UTC(
      local.getFullYear(),
      local.getMonth(),
      local.getDate(),
      local.getHours(),
      local.getMinutes(),
      local.getSeconds()
    ));
    const utcNow = new Date();

    const startTime = new Date(Date.UTC(
      formTimestamp.getUTCFullYear(),
      formTimestamp.getUTCMonth(),
      formTimestamp.getUTCDate(),
      4, 0, 0
    ));
    const endTime = new Date(startTime);
    endTime.setUTCDate(startTime.getUTCDate() + 1);

    const container = document.getElementById("money-object");
    const viewAllLink = document.getElementById("viewAllLink");
    const modal = document.getElementById("moModal");
    const guideLink = document.getElementById("guideLink");

    if (utcNow < startTime || utcNow >= endTime) {
      container.style.display = "none";
      const tempoSim = document.getElementById("tempoSim");
      if (guideLink && tempoSim) {
        tempoSim.parentNode.insertBefore(guideLink, tempoSim);
      }
      return;
    }

    const entries = Object.entries(latest).filter(([key]) => key !== "Timestamp");

    const topMOs = entries
      .filter(([, val]) => parseInt(val) > 139)
      .sort((a, b) => parseInt(b[1]) - parseInt(a[1]))
      .map(([key, val]) => `${key} (${parseInt(val)}%)`);

    container.firstChild.textContent = `Today's top MOs: ${topMOs.join(', ')}`;
    viewAllLink.style.display = "inline";

    const sorted = entries.sort((a, b) => parseInt(b[1]) - parseInt(a[1]));

    viewAllLink.onclick = (e) => {
      e.preventDefault();
      modal.style.display = "block";
    };

	// Percentages
	const percentContainer = document.getElementById("percentBars");
	percentContainer.innerHTML = "";
	
	const maxPct = 150;
	
	sorted.forEach(([key, val]) => {
	  const pct = parseInt(val);
	  const color =
	    pct === 150 ? '#f39c12' :
	    pct >= 140 ? '#27ae60' :
	    pct >= 100 ? '#8e44ad' :
	                 '#c0392b';
	
	  const clamped = Math.min(pct, maxPct);
	  const relWidth = (clamped / maxPct) * 100;
	
	  const row = document.createElement("div");
	  row.className = "mo-row";
	  row.innerHTML = `
	    <div class="mo-label">${key}</div>
	    <div class="mo-bar" style="background:${color}; width:${relWidth}%;">
	      <span>${pct}%</span>
	    </div>
	  `;
	  percentContainer.appendChild(row);
	});

	  // Payouts
	const payoutContainer = document.getElementById("payoutBars");
	payoutContainer.innerHTML = "";

	const entriesWithPayout = entries.map(([key, val]) => {
	  const pct = parseInt(val);
	  const payout150 = moPayoutAt150[key];
	
	  if (!payout150) return { key, pct, actual: 0 };
	
	  const base = payout150 / 1.5;
	  const actual = Math.round(base * (pct / 100));
	
	  return { key, pct, actual };
	}).sort((a, b) => b.actual - a.actual);
	
	entriesWithPayout.forEach(entry => {
	  const { key, actual } = entry;
	
	  const color =
	    actual >= 500 ? '#f39c12' :
	    actual >= 300 ? '#27ae60' :
	                    '#c0392b';
	
	  const maxPayout = entriesWithPayout[0].actual;
	  const width = Math.round((actual / maxPayout) * 100);
	
	  const row = document.createElement("div");
	  row.className = "mo-row";
	  row.innerHTML = `
	  <div class="mo-label">${key}</div>
	  <div class="mo-bar" style="background:${color}; width:${width}%">
	    <span>$${actual}</span>
	  </div>
	`;
	  payoutContainer.appendChild(row);
	});

    document.querySelectorAll(".tab-btn").forEach((btn) => {
	  btn.addEventListener("click", () => {
	    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
	    btn.classList.add("active");
	
	    document.querySelectorAll("#moModal .tab-content").forEach(tab => {
	      tab.style.display = "none";
	    });
	
	    const id = btn.dataset.tab;
	    document.getElementById(id).style.display = "block";
	  });
	});

    document.querySelectorAll(".modal .close").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const modal = e.target.closest(".modal");
        if (modal) modal.style.display = "none";
      });
    });

    window.addEventListener("click", (e) => {
      const modals = document.querySelectorAll(".modal");
      modals.forEach((modal) => {
        if (e.target === modal) modal.style.display = "none";
      });
    });

    container.style.display = "block";

    const bottomContainer = document.getElementById("bottom-container");
    const footerNote = document.getElementById("footer-note");
    if (bottomContainer && footerNote && guideLink) {
      bottomContainer.parentNode.insertBefore(guideLink, footerNote);
    }

  } catch (error) {
    console.error("Error fetching top-paying MOs:", error);
  }
}

// Top-paying MOs (Piggy version)

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

//One-off events

document.addEventListener("DOMContentLoaded", function () {
  const now = new Date();

  const start = new Date(Date.UTC(2025, 10, 8, 5, 0, 0)); // Nov 8 midnight EST
  const expiry = new Date(Date.UTC(2025, 10, 10, 5, 0, 0)); // Nov 10 midnight EST

  const msg = document.getElementById('event-message');
  if (!msg) return;

  if (now >= start && now < expiry) {
	  
    msg.style.display = '';
    setTimeout(() => msg.style.display = 'none', expiry - now);
  } else if (now < start) {

    setTimeout(() => {
      msg.style.display = '';
      setTimeout(() => msg.style.display = 'none', expiry - start);
    }, start - now);
  }
});

//Countdown
async function loadCountdown() {
  try {
    const response = await fetch('https://opensheet.vercel.app/1eTaXmyKRXZmWCvX5ZnSbjaWlT8X_KDWvN2PwBrlwEmc/Countdown');
    const data = await response.json();

    const countdownData = data[0];
    const endTime = new Date(countdownData.endTime).getTime();
    const message = countdownData.message;

    const countdownEl = document.getElementById("countdown");
    countdownEl.innerHTML = `${message} <span id="time"></span>`;
    const timeEl = document.getElementById("time");

    function updateCountdown() {
      const now = new Date().getTime();
      const timeRemaining = endTime - now;

      if (timeRemaining > 0) {
        const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);

        let display = '';
	if (days > 0) display += `${days}d `;
	display += `${hours}h ${minutes}m ${seconds}s`;
	timeEl.innerHTML = display;

      } else {
        countdownEl.style.display = "none";
        clearInterval(interval);
      }
    }

    const interval = setInterval(updateCountdown, 1000);
    updateCountdown();

  } catch (error) {
    console.error("Failed to load countdown data:", error);
  }
}

// Job Scheduler Modal

const jobs = {
  factory: {
    name: 'Robot Factory',
    time: '9:00 AM',
    startMinutes: 9 * 60
  },
  restaurant: {
    name: 'Diner',
    time: '11:00 AM',
    startMinutes: 11 * 60
  },
  nightclub: {
    name: 'Club',
    time: '8:00 PM',
    startMinutes: 20 * 60
  }
};

let currentJob = 'factory';

function switchJob(jobKey) {
  currentJob = jobKey;

  // Deactivate all buttons
  document.querySelectorAll('.job-btn').forEach(btn => btn.classList.remove('active'));

  // Activate selected button
  const selectedButton = document.getElementById(`job-${jobKey}`);
  if (selectedButton) selectedButton.classList.add('active');

  // Update display
  const job = jobs[jobKey];
  document.getElementById('current-job-name').textContent = job.name;
  document.getElementById('current-job-time').textContent = job.time;

  updateJobCountdown();
}

function updateJobCountdown() {
  const job = jobs[currentJob];
  const currentTime = new Date();
  let hours = currentTime.getUTCHours();
  let minutes = currentTime.getUTCMinutes();
  let seconds = currentTime.getUTCSeconds();
  let cycle = (hours % 2 === 1) ? 3600 : 0;
  cycle += minutes * 60 + seconds;

  const currentMinutes = cycle / 5; // fractional minutes

  let minutesUntilJob;
  if (currentMinutes < job.startMinutes) {
    minutesUntilJob = job.startMinutes - currentMinutes;
  } else {
    minutesUntilJob = (24 * 60) - currentMinutes + job.startMinutes;
  }

  const realSeconds = Math.round(minutesUntilJob * 5); // round to avoid weird decimals

  const hrs = Math.floor(realSeconds / 3600);
  const mins = Math.floor((realSeconds % 3600) / 60);
  const secs = realSeconds % 60;

  const display =
    hrs > 0
      ? `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
      : `${mins}:${secs.toString().padStart(2, '0')}`;

  document.getElementById('job-countdown').textContent = display;
}

function getXenoviaMinutes() {
  const currentTime = new Date();
  let hours = currentTime.getUTCHours();
  let minutes = currentTime.getUTCMinutes();
  let seconds = currentTime.getUTCSeconds();
  let cycle = (hours % 2 === 1) ? 3600 : 0;
  cycle += minutes * 60 + seconds;

  let tsoHours = Math.floor(cycle / 300);
  if (tsoHours > 12) tsoHours -= 12;
  if (tsoHours === 0) tsoHours = 12;

  let tsoMinutes = Math.floor((cycle % 300) / 5);

  let suffix = (hours % 2 === 1) ? "PM" : "AM";

  const totalMinutes = (suffix === "PM" ? 12 * 60 : 0) + (tsoHours === 12 ? 0 : tsoHours * 60) + tsoMinutes;
  return totalMinutes;
}

function updateCurrentJobLabel() {
  const currentMinutes = getXenoviaMinutes();
  const activeJobs = [];

  // Factory: 9:00 AM (540) to 5:00 PM (1020)
  if (currentMinutes >= 540 && currentMinutes < 1020) {
    activeJobs.push("Factory");
  }

  // Diner: 11:00 AM (660) to 7:00 PM (1140)
  if (currentMinutes >= 660 && currentMinutes < 1140) {
    activeJobs.push("Diner");
  }

  // Club: 8:00 PM (1200) to 4:00 AM (240 or next day)
  if (currentMinutes >= 1200 || currentMinutes < 240) {
    activeJobs.push("Club");
  }

  const label = activeJobs.length ? activeJobs.join(" + ") : "None";
  document.getElementById("current-job-label").textContent = label;
}

setInterval(() => {
  tempoSim();
  updateCurrentJobLabel();
  updateJobCountdown();
}, 1000);

// ---- SIM NOTES ----
document.addEventListener('DOMContentLoaded', () => {

  window.openNotesModal = function(simId, simName) {
    const modal = document.getElementById('notes-modal');
    const textarea = document.getElementById('notes-textarea');
    const title = document.getElementById('notes-modal-title');

    const notesData = JSON.parse(localStorage.getItem('simNotes')) || {};
    textarea.value = notesData[simId] || '';

    title.textContent = `Notes for ${simName}`;
    modal.dataset.simId = simId;
    modal.style.display = 'block';
  };

const saveBtn = document.getElementById('save-note-btn');
if (saveBtn) {
  saveBtn.addEventListener('click', () => {
    const modal = document.getElementById('notes-modal');
    const textarea = document.getElementById('notes-textarea');
    const simId = modal.dataset.simId;
    const noteText = textarea.value.trim();

    const notesData = JSON.parse(localStorage.getItem('simNotes')) || {};

    if (noteText) {
      notesData[simId] = noteText;
    } else {
      delete notesData[simId];
    }

    localStorage.setItem('simNotes', JSON.stringify(notesData));
    modal.style.display = 'none';

    showSimNoteInline(simId);
    const simModal = document.getElementById('sim-modal');
    if (simModal && simModal.style.display === 'block') {
      showSimNoteInline(simId, true);
    }
  });
}

  const notesClose = document.querySelector('#notes-modal .close');
  if (notesClose) {
    notesClose.addEventListener('click', () => {
      document.getElementById('notes-modal').style.display = 'none';
    });
  }

  window.showSimNoteInline = function(simId, isModal = false) {
  const notesData = JSON.parse(localStorage.getItem('simNotes')) || {};
  const note = notesData[simId];
  const target = isModal
    ? document.getElementById('sim-modal-content')
    : document.getElementById('console-content');

  if (!target) return;

  const existingNoteDiv = target.querySelector('.sim-note');
  if (existingNoteDiv) existingNoteDiv.remove();

  const noteDiv = document.createElement('div');
  noteDiv.className = 'sim-note';
  noteDiv.style.marginTop = '4px';

  if (note) {
    noteDiv.innerHTML = `
      <p><strong>Your Note:</strong> ${note.replace(/\n/g, '<br>')}</p>
      <p style="margin: 0;">
        <a href="#" class="sim-note-link" onclick="openNotesModal('${simId}', '${target.querySelector('.console-title')?.textContent.trim() || 'Sim'}'); return false;">
          ✏️ Edit Note
        </a>
      </p>
    `;
  } else {
    noteDiv.innerHTML = `
      <p style="margin: 0;">
        <a href="#" class="sim-note-link" onclick="openNotesModal('${simId}', '${target.querySelector('.console-title')?.textContent.trim() || 'Sim'}'); return false;">
          📝 Add Note
        </a>
      </p>
    `;
  }

  target.appendChild(noteDiv);
};

});

// Modal close behaviour
document.addEventListener('click', (e) => {
  const isModalContent = e.target.closest('.modal-content');
  const isModal = e.target.closest('.modal');
  const isOpenTrigger = e.target.closest('[onclick*="open"]');
  const isViewAll = e.target.id === 'viewAllLink' || e.target.closest('#viewAllLink');

  if (e.target.matches('.modal .close')) {
    e.target.closest('.modal').style.display = 'none';
    return;
  }

  if (isModalContent || isOpenTrigger || isViewAll) return;

  document.querySelectorAll('.modal').forEach(modal => {
    if (modal.style.display === 'block' && !modal.querySelector('.modal-content').contains(e.target)) {
      modal.style.display = 'none';
    }
  });
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
  }
});
        
/* document.addEventListener('DOMContentLoaded', () => {
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
}); */
