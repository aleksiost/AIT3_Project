/**
 * Near-Space Watchdog - Phase 1, 2, 3 & 3.1
 * NASA EPIC Earth Imagery, NeoWs Telemetry, Distance-Scaled Canvas Visualization & Tooltip
 */

const CONFIG = {
  API_KEY: 'DEMO_KEY',
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
  earthSpinner: document.getElementById('earth-spinner'),
  loaderText: document.getElementById('loader-text'),
  epicTimestamp: document.getElementById('epic-timestamp'),
  neoTimestamp: document.getElementById('neo-timestamp'),
  neoCount: document.getElementById('neo-count'),
  hazardToggle: document.getElementById('hazard-toggle'),
  statusMessage: document.getElementById('status-message'),
  hudPanel: document.getElementById('hud-panel'),
  canvas: document.getElementById('asteroid-canvas'),
  scanBtn: document.getElementById('scan-btn'),
  // Tooltip-elementit
  tooltip: document.getElementById('asteroid-tooltip'),
  ttName: document.getElementById('tt-name'),
  ttBadge: document.getElementById('tt-badge'),
  ttSize: document.getElementById('tt-size'),
  ttDistance: document.getElementById('tt-distance'),
  ttSpeed: document.getElementById('tt-speed'),
  ttPha: document.getElementById('tt-pha')
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
      updateStatus('EPIC feed nominal.');
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
 * Laskee asteroidien suhteellisen etäisyyden (distRatio) todellisen ohitusetäisyyden perusteella.
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

    // Kerätään todelliset ohitusetäisyydet suhteellista skaalausta varten
    const distances = todaysAsteroids.map(a =>
      parseFloat(a.close_approach_data[0].miss_distance.kilometers)
    );
    const minDist = Math.min(...distances);
    const maxDist = Math.max(...distances);

    // Lasketaan sijainnit vain kerran haun yhteydessä
    state.asteroids = todaysAsteroids.map(asteroid => {
      const missDistanceKm = Math.round(
        parseFloat(asteroid.close_approach_data[0].miss_distance.kilometers)
      );

      // Normalisoidaan etäisyys välille 0.0 (lähin) – 1.0 (kauin)
      const distRatio = maxDist > minDist
        ? (missDistanceKm - minDist) / (maxDist - minDist)
        : 0.5;

      return {
        name: asteroid.name.replace(/[()]/g, '').trim(),
        sizeMaxMeters: Math.round(asteroid.estimated_diameter.meters.estimated_diameter_max),
        missDistanceKm,
        velocityKmh: Math.round(parseFloat(asteroid.close_approach_data[0].relative_velocity.kilometers_per_hour)),
        isHazardous: asteroid.is_potentially_hazardous_asteroid,
        angle: Math.random() * Math.PI * 2,
        distRatio,
        x: null,
        y: null
      };
    });

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
  hideTooltip();
  if (state.asteroids.length > 0) {
    drawAsteroids(state.asteroids);
  }
}

/**
 * Piirtää asteroidit maapallon ympärille valopisteinä ja -janoina.
 */
function drawAsteroids(asteroids) {
  ctx.clearRect(0, 0, elements.canvas.width, elements.canvas.height);

  const cx = elements.canvas.width / 2;
  const cy = elements.canvas.height / 2;

  // Maapallon todellinen koko DOM-elementistä (Dynaaminen skaalautuvuus)
  const earthRect = elements.earthWrapper.getBoundingClientRect();
  const earthRadius = earthRect.width / 2;

  // HUD-paneelin viemä tila turva-alueelle
  const hudRect = elements.hudPanel.getBoundingClientRect();

  // Turvasäde: Nostettu hieman suuremmaksi (45px maapallon reunasta)
  const minRadius = earthRadius + 45;

  // Maksimisäde: Varmistetaan, ettei yksikään asteroidi osu HUD-paneelin alle tai ruudun ulkopuolelle
  const distToHud = Math.hypot(hudRect.left - cx, hudRect.top - cy);
  const maxRadius = Math.max(
    minRadius + 20,
    Math.min(distToHud - 20, Math.min(cx, cy) * 0.90)
  );

  asteroids.forEach(ast => {
    if (state.onlyHazardous && !ast.isHazardous) {
      ast.x = null;
      ast.y = null;
      return;
    }

    const radius = minRadius + ast.distRatio * (maxRadius - minRadius);
    const x = cx + Math.cos(ast.angle) * radius;
    const y = cy + Math.sin(ast.angle) * radius;

    // Tallennetaan lukittu ruutusijainti osumantarkistusta varten
    ast.x = x;
    ast.y = y;

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

/**
 * Osumantarkistus (Hit detection) Canvaksen hiiren liikkeelle.
 * Reagoi vain näkyvissä oleviin asteroideihin eikä laske sijainteja uudelleen.
 */
function handleCanvasMouseMove(e) {
  if (state.asteroids.length === 0) return;

  const rect = elements.canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  const hitRadius = 18;
  let hitAsteroid = null;
  let closestDist = hitRadius;

  for (const ast of state.asteroids) {
    if (state.onlyHazardous && !ast.isHazardous) continue;
    if (ast.x === null || ast.y === null) continue;

    const dist = Math.hypot(mouseX - ast.x, mouseY - ast.y);
    if (dist <= closestDist) {
      closestDist = dist;
      hitAsteroid = ast;
    }
  }

  if (hitAsteroid) {
    elements.canvas.style.cursor = 'pointer';
    showTooltip(hitAsteroid, e.clientX, e.clientY);
  } else {
    hideTooltip();
  }
}

/**
 * Näyttää ja asemoi infolaatikon kursorin viereen pysyen ikkunan rajojen sisällä.
 */
function showTooltip(ast, clientX, clientY) {
  elements.ttName.textContent = ast.name;
  elements.ttSize.textContent = `${ast.sizeMaxMeters.toLocaleString('en-US')} m`;
  elements.ttDistance.textContent = `${ast.missDistanceKm.toLocaleString('en-US')} km`;
  elements.ttSpeed.textContent = `${ast.velocityKmh.toLocaleString('en-US')} km/h`;

  if (ast.isHazardous) {
    elements.tooltip.classList.add('hazardous');
    elements.ttBadge.textContent = 'PHA WARNING';
    elements.ttPha.textContent = 'POTENTIALLY HAZARDOUS';
    elements.ttPha.classList.add('danger-text');
  } else {
    elements.tooltip.classList.remove('hazardous');
    elements.ttBadge.textContent = 'NOMINAL';
    elements.ttPha.textContent = 'SAFE';
    elements.ttPha.classList.remove('danger-text');
  }

  elements.tooltip.classList.remove('hidden');

  const offset = 16;
  const margin = 12;
  const boxWidth = elements.tooltip.offsetWidth;
  const boxHeight = elements.tooltip.offsetHeight;

  let left = clientX + offset;
  let top = clientY + offset;

  if (left + boxWidth > window.innerWidth - margin) {
    left = clientX - boxWidth - offset;
  }
  if (top + boxHeight > window.innerHeight - margin) {
    top = clientY - boxHeight - offset;
  }

  elements.tooltip.style.transform = `translate(${Math.max(margin, left)}px, ${Math.max(margin, top)}px)`;
}

/**
 * Piilottaa infolaatikon ja palauttaa oletuskursorin.
 */
function hideTooltip() {
  elements.canvas.style.cursor = 'default';
  if (elements.tooltip) {
    elements.tooltip.classList.add('hidden');
  }
}

function updateStatus(message) {
  elements.statusMessage.textContent = message;
}

function initInteractions() {
  // Suodatuskytkin kutsuu uudelleenpiirtoa, muttei arvo sijainteja uusiksi
  elements.hazardToggle.addEventListener('change', (e) => {
    state.onlyHazardous = e.target.checked;
    hideTooltip();
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
    hideTooltip();

    // Näytetään latauskuvake ja teksti vain, jos maapallokuvaa ei ole vielä ladattu
    if (!elements.earthWrapper.classList.contains('loaded')) {
      elements.earthSpinner.classList.remove('hidden');
      elements.loaderText.textContent = 'ACQUIRING DSCOVR EPIC SIGNAL...';
    }

    updateStatus('Initiating orbital scan...');

    await Promise.all([fetchLatestEarthImage(), fetchNeoData()]);

    elements.scanBtn.disabled = false;
    elements.scanBtn.classList.remove('scanning');
  });

  // Canvaksen hover-kuuntelijat
  elements.canvas.addEventListener('mousemove', handleCanvasMouseMove);
  elements.canvas.addEventListener('mouseleave', hideTooltip);

  elements.hudPanel.addEventListener('mousemove', (e) => {
    const rect = elements.hudPanel.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    elements.hudPanel.style.setProperty('--mouse-x', `${x}px`);
    elements.hudPanel.style.setProperty('--mouse-y', `${y}px`);
  });

  window.addEventListener('resize', resizeCanvas);
}

// Käynnistys: Vain käyttöliittymä, tiedot haetaan napilla
document.addEventListener('DOMContentLoaded', () => {
  initInteractions();
  resizeCanvas();
  updateStatus('System online. Press SCAN to acquire telemetry.');
});