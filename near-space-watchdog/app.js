/**
 * Near-Space Watchdog - Phase 1 (Updated)
 * Core UI & NASA EPIC Earth Imagery Integration
 */

const CONFIG = {
  API_KEY: 'DEMO_KEY', // Voit vaihtaa tähän oman api.nasa.gov -avaimen
  EPIC_META_URL: 'https://api.nasa.gov/EPIC/api/natural',
  EPIC_ARCHIVE_BASE: 'https://epic.gsfc.nasa.gov/archive/natural'
};

// Sovelluksen tila (laajennetaan Vaiheessa 2 ja 3)
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

// Käynnistetään Vaihe 1
document.addEventListener('DOMContentLoaded', () => {
  initInteractions();
  fetchLatestEarthImage();
});