/**
 * Near-Space Watchdog - Phase 1, 2 & 3
 * NASA EPIC Earth Imagery, NeoWs Telemetry & HTML5 Canvas Visualization
 */

const CONFIG = {
  API_KEY: 'JTcRqzTmj7whDtWFwTNMNmTGtkRmzrBHPFjmGkmw',
  EPIC_META_URL: 'https://api.nasa.gov/EPIC/api/natural',
  EPIC_ARCHIVE_BASE: 'https://epic.gsfc.nasa.gov/archive/natural'
};

const state = {
  onlyHazardous: false,
  epicData: null,
  asteroids: [] 
};

const elements = {
  earthWrapper: document.querySelector('.earth-wrapper'),
  earthImage: document.getElementById('earth-image'),
  earthLoader: document.getElementById('earth-loader'),
  epicTimestamp: document.getElementById('epic-timestamp'),
  neoTimestamp: document.getElementById('neo-timestamp'),
  neoCount: document.getElementById('neo-count'),
  hazardToggle: document.getElementById('hazard-toggle'),
  statusMessage: document.getElementById('status-message'),
  hudPanel: document.getElementById('hud-panel'),
  canvas: document.getElementById('asteroid-canvas'),
  scanBtn: document.getElementById('scan-btn')
};

const ctx = elements.canvas.getContext('2d');

/**
 * Hakee tuoreimman DSCOVR EPIC -kuvan.
 */
async function fetchLatestEarthImage() {
  try {
    updateStatus('Requesting latest telemetry from NASA EPIC...');
    const response = await fetch(`${CONFIG.EPIC_META_URL}?api_key=${CONFIG.API_KEY}`);
    if (!response.ok) throw new Error(`EPIC API responded with status ${response.status}`);

    const data = await response.json();
    if (!Array.isArray(data) || data.length === 0) throw new Error('No imagery data returned.');

    const latestEntry = data[data.length - 1];
    state.epicData = latestEntry;

    const [datePart] = latestEntry.date.split(' ');
    const [year, month, day] = datePart.split('-');
    const imageUrl = `${CONFIG.EPIC_ARCHIVE_BASE}/${year}/${month}/${day}/png/${latestEntry.image}.png`;

    elements.earthImage.onload = () => {
      elements.earthLoader.style.display = 'none';
      elements.earthImage.classList.remove('hidden');
      elements.earthWrapper.classList.add('loaded');
      elements.epicTimestamp.textContent = `${latestEntry.date} UTC`;
      updateStatus(`EPIC feed nominal.`);
    };
    elements.earthImage.src = imageUrl;
  } catch (error) {
    console.error('NASA EPIC Error:', error);
    useFallbackEarthImage();
  }
}

function useFallbackEarthImage() {
  const fallbackUrl = 'https://epic.gsfc.nasa.gov/archive/natural/2023/10/14/png/epic_1b_20231014155333.png';
  elements.earthImage.onload = () => {
    elements.earthLoader.style.display = 'none';
    elements.earthImage.classList.remove('hidden');
    elements.earthWrapper.classList.add('loaded');
    elements.epicTimestamp.textContent = '2023-10-14 15:53:33 UTC (CACHED)';
    updateStatus('Notice: Using cached EPIC image.');
  };
  elements.earthImage.src = fallbackUrl;
}

/**
 * Hakee kuluvan päivän asteroidiohitukset NASA NeoWs -rajapinnasta.
 */
async function fetchNeoData() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const today = `${year}-${month}-${day}`;

  try {
    updateStatus('Requesting asteroid telemetry from NASA NeoWs...');

    const url = `https://api.nasa.gov/neo/rest/v1/feed?start_date=${today}&end_date=${today}&api_key=${CONFIG.API_KEY}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`NeoWs API responded with status ${response.status}`);

    const data = await response.json();
    const todaysAsteroids = data.near_earth_objects[today] || [];

    elements.neoTimestamp.textContent = today;
    elements.neoCount.textContent = `${todaysAsteroids.length} kpl`;

    // LASKETAAN SIJAINNIT VAIN KERRAN HAUN YHTEYDESSÄ
    state.asteroids = todaysAsteroids.map(asteroid => ({
      name: asteroid.name,
      sizeMaxMeters: Math.round(asteroid.estimated_diameter.meters.estimated_diameter_max),
      missDistanceKm: Math.round(asteroid.close_approach_data[0].miss_distance.kilometers),
      isHazardous: asteroid.is_potentially_hazardous_asteroid,
      // Kulma (0 - 360 astetta)
      angle: Math.random() * Math.PI * 2,
      // Suhteellinen etäisyys (0.0 - 1.0) maapallon ja ruudun reunan välillä
      distRatio: Math.random()
    }));

    updateStatus('NeoWs telemetry nominal. Drawing orbital visualization...');
    drawAsteroids(state.asteroids);

  } catch (error) {
    console.error('NASA NeoWs Error:', error);
    updateStatus('Error fetching asteroid data. See console for details.');
  }
}

/**
 * Asettaa Canvaksen koon vastaamaan ikkunaa.
 */
function resizeCanvas() {
  elements.canvas.width = window.innerWidth;
  elements.canvas.height = window.innerHeight;
  if (state.asteroids.length > 0) {
    drawAsteroids(state.asteroids);
  }
}

/**
 * Piirtää asteroidit satunnaisesti maapallon ympärille valopisteinä ja -janoina.
 */
function drawAsteroids(asteroids) {
  ctx.clearRect(0, 0, elements.canvas.width, elements.canvas.height);

  const cx = elements.canvas.width / 2;
  const cy = elements.canvas.height / 2;

  // LASKETAAN MAAPALLON TODELLINEN KOKO DOM-ELEMENTISTÄ (Dynaaminen skaalautuvuus)
  const earthRect = elements.earthWrapper.getBoundingClientRect();
  const earthRadius = earthRect.width / 2;

  // LASKETAAN PANEELIEN VIEMÄ TILA TURVA-ALUEELLE
  const hudRect = elements.hudPanel.getBoundingClientRect();
  
  // Turvasäde: Asteroidit alkavat heti maapallon pinnan / hohdon ulkopuolelta
  const minRadius = earthRadius + 20;
  
  // Maksimisäde: Varmistetaan, ettei yksikään asteroidi osu HUD-paneelin alle
  // Lasketaan etäisyys keskipisteestä HUD-paneelin vasempaan yläkulmaan
  const distToHud = Math.hypot(hudRect.left - cx, hudRect.top - cy);
  // Maksimisäde on joko paneelin reuna (miinus turvaväli 20px) tai ruudun reuna
  const maxRadius = Math.min(
    distToHud - 20, 
    Math.min(cx, cy) * 0.90
  );

  asteroids.forEach(ast => {
    if (state.onlyHazardous && !ast.isHazardous) return;

    // Sijainti lasketaan tallennetun suhdeluvun ja uuden, rajatun ruudun koon perusteella
    const radius = minRadius + ast.distRatio * (maxRadius - minRadius);
    const x = cx + Math.cos(ast.angle) * radius;
    const y = cy + Math.sin(ast.angle) * radius;

    const coreColor = ast.isHazardous ? '#ff2a5f' : '#00f0ff';
    const glowColor = ast.isHazardous ? 'rgba(255, 42, 95, 0.4)' : 'rgba(0, 240, 255, 0.4)';
    const fadeColor = 'rgba(0, 0, 0, 0)';

    const trailLength = 0.25;
    const startAngle = ast.angle - trailLength;
    
    const tailX = cx + Math.cos(startAngle) * radius;
    const tailY = cy + Math.sin(startAngle) * radius;

    const gradient = ctx.createLinearGradient(tailX, tailY, x, y);
    gradient.addColorStop(0, fadeColor);
    gradient.addColorStop(1, glowColor);

    ctx.save();
    
    // Valojana
    ctx.beginPath();
    ctx.arc(cx, cy, radius, startAngle, ast.angle);
    ctx.strokeStyle = gradient;
    ctx.lineWidth = ast.isHazardous ? 2.5 : 1.5;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Valopiste
    ctx.beginPath();
    ctx.arc(x, y, ast.isHazardous ? 4 : 2.5, 0, Math.PI * 2);
    ctx.fillStyle = coreColor;
    ctx.shadowColor = coreColor;
    ctx.shadowBlur = ast.isHazardous ? 15 : 8;
    ctx.fill();

    ctx.restore();
  });
}

function updateStatus(message) {
  elements.statusMessage.textContent = message;
}

function initInteractions() {
  // Suodatuskytkin kutsuu uudelleenpiirtoa, muttei arvo sijainteja uusiksi
  elements.hazardToggle.addEventListener('change', (e) => {
    state.onlyHazardous = e.target.checked;
    drawAsteroids(state.asteroids);
    if (state.onlyHazardous) {
      updateStatus('Filter active: Displaying ONLY Potentially Hazardous Asteroids.');
    } else {
      updateStatus('Filter inactive: Displaying all tracked near-Earth objects.');
    }
  });

  // Scan-painikkeen kuuntelija
  elements.scanBtn.addEventListener('click', async () => {
    elements.scanBtn.disabled = true;
    elements.scanBtn.classList.add('scanning');
    updateStatus('Initiating orbital scan...');
    
    // Suoritetaan molemmat haut yhtä aikaa
    await Promise.all([fetchLatestEarthImage(), fetchNeoData()]);
    
    elements.scanBtn.disabled = false;
    elements.scanBtn.classList.remove('scanning');
  });

  elements.hudPanel.addEventListener('mousemove', (e) => {
    const rect = elements.hudPanel.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    elements.hudPanel.style.setProperty('--mouse-x', `${x}px`);
    elements.hudPanel.style.setProperty('--mouse-y', `${y}px`);
  });

  window.addEventListener('resize', resizeCanvas);
}

// Käynnistys: Vain käyttöliittymä, tiedot haetaan nyt napilla
document.addEventListener('DOMContentLoaded', () => {
  initInteractions();
  resizeCanvas(); 
  updateStatus('System online. Press SCAN to acquire telemetry.');
});