/**
 * Near-Space Watchdog - Phase 1 & 2
 * Core UI, NASA EPIC Earth Imagery & NASA NeoWs Asteroid Telemetry
 */

const CONFIG = {
  API_KEY: 'DEMO_KEY', // Voit vaihtaa tähän oman api.nasa.gov -avaimen
  EPIC_META_URL: 'https://api.nasa.gov/EPIC/api/natural',
  EPIC_ARCHIVE_BASE: 'https://epic.gsfc.nasa.gov/archive/natural'
};

// Sovelluksen tila
const state = {
  onlyHazardous: false,
  epicData: null
};

// DOM-viittaukset
const elements = {
  earthWrapper: document.querySelector('.earth-wrapper'),
  earthImage: document.getElementById('earth-image'),
  earthLoader: document.getElementById('earth-loader'),
  epicTimestamp: document.getElementById('epic-timestamp'),
  neoTimestamp: document.getElementById('neo-timestamp'), // Lisätty Vaihe 2 varten
  neoCount: document.getElementById('neo-count'),         // Lisätty Vaihe 2 varten
  hazardToggle: document.getElementById('hazard-toggle'),
  statusMessage: document.getElementById('status-message'),
  hudPanel: document.getElementById('hud-panel')
};

/**
 * Hakee tuoreimman DSCOVR EPIC -kuvan metatiedot ja asettaa kuvan keskelle ruutua.
 */
async function fetchLatestEarthImage() {
  try {
    updateStatus('Requesting latest telemetry from NASA EPIC...');
    
    const response = await fetch(`${CONFIG.EPIC_META_URL}?api_key=${CONFIG.API_KEY}`);
    if (!response.ok) {
      throw new Error(`EPIC API responded with status ${response.status}`);
    }

    const data = await response.json();
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('No imagery data returned from EPIC API.');
    }

    // Otetaan listan viimeisin (tuorein) kuva
    const latestEntry = data[data.length - 1];
    state.epicData = latestEntry;

    // Parsitaan päivämäärä muotoon YYYY/MM/DD arkisto-osoitetta varten
    const [datePart] = latestEntry.date.split(' ');
    const [year, month, day] = datePart.split('-');

    // Rakennetaan suora kuva-URL NASA:n EPIC-arkistoon
    const imageUrl = `${CONFIG.EPIC_ARCHIVE_BASE}/${year}/${month}/${day}/png/${latestEntry.image}.png`;

    // Kun kuva on latautunut selaimeen, piilotetaan latauskuvake ja aktivoidaan maapallo + hohto
    elements.earthImage.onload = () => {
      elements.earthLoader.style.display = 'none';
      elements.earthImage.classList.remove('hidden');
      elements.earthWrapper.classList.add('loaded');
      elements.epicTimestamp.textContent = `${latestEntry.date} UTC`;
      updateStatus(`EPIC feed nominal. Coordinates: LAT ${latestEntry.centroid_coordinates.lat.toFixed(2)}, LON ${latestEntry.centroid_coordinates.lon.toFixed(2)}`);
    };

    elements.earthImage.onerror = () => {
      throw new Error('Failed to load image file from EPIC archive.');
    };

    elements.earthImage.src = imageUrl;

  } catch (error) {
    console.error('NASA EPIC Error:', error);
    useFallbackEarthImage();
  }
}

/**
 * Varakuva NASA:n EPIC-arkistosta, jos DEMO_KEY-avain palauttaa 429 (Too Many Requests).
 */
function useFallbackEarthImage() {
  const fallbackUrl = 'https://epic.gsfc.nasa.gov/archive/natural/2023/10/14/png/epic_1b_20231014155333.png';
  elements.earthImage.onload = () => {
    elements.earthLoader.style.display = 'none';
    elements.earthImage.classList.remove('hidden');
    elements.earthWrapper.classList.add('loaded');
    elements.epicTimestamp.textContent = '2023-10-14 15:53:33 UTC (CACHED)';
    updateStatus('Notice: Using cached EPIC image (API limit or network issue).');
  };
  elements.earthImage.src = fallbackUrl;
}

/**
 * VAIHE 2: Hakee kuluvan päivän asteroidiohitukset NASA NeoWs -rajapinnasta.
 */
async function fetchNeoData() {
  // 1. Luodaan kuluvan päivän päivämäärä muodossa YYYY-MM-DD
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const today = `${year}-${month}-${day}`;

  try {
    updateStatus('Requesting asteroid telemetry from NASA NeoWs...');

    // 2. Tehdään API-pyyntö kuluvan päivän datalle
    const url = `https://api.nasa.gov/neo/rest/v1/feed?start_date=${today}&end_date=${today}&api_key=${CONFIG.API_KEY}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`NeoWs API responded with status ${response.status}`);
    }

    const data = await response.json();

    // 3. Poimitaan tämän päivän asteroidit JSON-rakenteesta
    const todaysAsteroids = data.near_earth_objects[today] || [];

    // 4. Päivitetään olemassa oleva HTML-infopaneeli
    elements.neoTimestamp.textContent = today;
    elements.neoCount.textContent = `${todaysAsteroids.length} kpl`;

    // 5. Rakennetaan konsoliin tulostettava selkeä taulukko
    const asteroidTable = todaysAsteroids.map(asteroid => {
      return {
        Nimi: asteroid.name,
        'Koko (max metriä)': Math.round(asteroid.estimated_diameter.meters.estimated_diameter_max),
        'Ohitusetäisyys (km)': Math.round(asteroid.close_approach_data[0].miss_distance.kilometers),
        'Vaarallinen (PHA)': asteroid.is_potentially_hazardous_asteroid
      };
    });

    // Tulostetaan data selaimen konsoliin kehitystä varten
    console.log(`Asteroidit (${today}): ${todaysAsteroids.length} kpl`);
    console.table(asteroidTable);
    
    updateStatus('NeoWs telemetry nominal. Ready for Phase 3 visualization.');

  } catch (error) {
    console.error('NASA NeoWs Error:', error);
    updateStatus('Error fetching asteroid data. See console for details.');
  }
}

/**
 * Päivittää ohjauspaneelin alareunan tilaviestin.
 */
function updateStatus(message) {
  elements.statusMessage.textContent = message;
}

/**
 * Alustaa käyttöliittymän tapahtumankuuntelijat ja ReactBits-henkisen Spotlight-efektin.
 */
function initInteractions() {
  // Suodatuskytkimen kuuntelija
  elements.hazardToggle.addEventListener('change', (e) => {
    state.onlyHazardous = e.target.checked;
    if (state.onlyHazardous) {
      updateStatus('Filter active: Displaying ONLY Potentially Hazardous Asteroids.');
    } else {
      updateStatus('Filter inactive: Displaying all tracked near-Earth objects.');
    }
  });

  // Hiiren liikkeeseen reagoiva Spotlight-efekti HUD-paneelissa
  elements.hudPanel.addEventListener('mousemove', (e) => {
    const rect = elements.hudPanel.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    elements.hudPanel.style.setProperty('--mouse-x', `${x}px`);
    elements.hudPanel.style.setProperty('--mouse-y', `${y}px`);
  });
}

// Käynnistetään Vaihe 1 ja Vaihe 2
document.addEventListener('DOMContentLoaded', () => {
  initInteractions();
  fetchLatestEarthImage();
  fetchNeoData();
});