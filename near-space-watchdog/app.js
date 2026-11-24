/**
 * Near-Space Watchdog - Phase 1, 2, 3, 3.1 & 4: V6 Error Handling
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
  earthErrorIcon: document.getElementById('earth-error-icon'),
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
 * Muodostaa selkeän englanninkielisen virheilmoituksen virheen syyn perusteella (Vaatimus V6).
 */
function formatApiError(error, serviceName) {
  if (!navigator.onLine) {
    return 'Network error: No internet connection detected.';
  }
  if (error.status === 429) {
    return `${serviceName} error: API rate limit exceeded (429). Try again later or use a personal API key.`;
  }
  if (error.status === 403 || error.status === 401) {
    return `${serviceName} error: Invalid or unauthorized API key (${error.status}).`;
  }
  if (error.status >= 500) {
    return `${serviceName} error: NASA server unavailable (${error.status}).`;
  }
  if (error instanceof TypeError) {
    return `Network error: Unable to reach NASA ${serviceName} API (offline or connection blocked).`;
  }
  return `${serviceName} error: ${error.message || 'Unknown telemetry failure.'}`;
}

/**
 * Pysäyttää latausanimaation ja näyttää lasimaisen estomerkin sekä ERROR-tekstin.
 */
function showEarthErrorState() {
  elements.earthSpinner.classList.add('hidden');
  if (!elements.earthWrapper.classList.contains('loaded')) {
    elements.earthLoader.style.display = 'flex';
    elements.earthLoader.classList.add('is-error');
    elements.earthErrorIcon.classList.remove('hidden');
    elements.loaderText.textContent = 'ERROR';
  }
}

/**
 * Hakee tuoreimman DSCOVR EPIC -kuvan.
 */
async function fetchLatestEarthImage() {
  try {
    const response = await fetch(`${CONFIG.EPIC_META_URL}?api_key=${CONFIG.API_KEY}`);
    if (!response.ok) {
      const err = new Error(`HTTP ${response.status}`);
      err.status = response.status;
      throw err;
    }

    const data = await response.json();
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('No imagery data returned from EPIC API.');
    }

    const latestEntry = data[data.length - 1];
    state.epicData = latestEntry;

    const [datePart] = latestEntry.date.split(' ');
    const [year, month, day] = datePart.split('-');
    const imageUrl = `${CONFIG.EPIC_ARCHIVE_BASE}/${year}/${month}/${day}/png/${latestEntry.image}.png`;

    await new Promise((resolve, reject) => {
      elements.earthImage.onload = () => {
        elements.earthLoader.style.display = 'none';
        elements.earthSpinner.classList.add('hidden');
        elements.earthErrorIcon.classList.add('hidden');
        elements.earthLoader.classList.remove('is-error');
        elements.earthImage.classList.remove('hidden');
        elements.earthWrapper.classList.add('loaded');
        elements.epicTimestamp.textContent = `${latestEntry.date} UTC`;
        resolve();
      };

      elements.earthImage.onerror = () => {
        reject(new Error('Failed to load Earth image from NASA EPIC archive.'));
      };

      elements.earthImage.src = imageUrl;
    });

    return { ok: true };
  } catch (error) {
    console.error('NASA EPIC Error:', error);
    showEarthErrorState();
    elements.epicTimestamp.textContent = 'SIGNAL LOST';
    return { ok: false, message: formatApiError(error, 'EPIC') };
  }
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
    const url = `https://api.nasa.gov/neo/rest/v1/feed?start_date=${today}&end_date=${today}&api_key=${CONFIG.API_KEY}`;
    const response = await fetch(url);
    if (!response.ok) {
      const err = new Error(`HTTP ${response.status}`);
      err.status = response.status;
      throw err;
    }

    const data = await response.json();
    const todaysAsteroids = data.near_earth_objects[today] || [];

    elements.neoTimestamp.textContent = today;
    elements.neoCount.textContent = `${todaysAsteroids.length}`;

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

    drawAsteroids(state.asteroids);
    return { ok: true };

  } catch (error) {
    console.error('NASA NeoWs Error:', error);
    elements.neoTimestamp.textContent = 'SCAN FAILED';
    elements.neoCount.textContent = '--';
    return { ok: false, message: formatApiError(error, 'NeoWs') };
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

  const earthRect = elements.earthWrapper.getBoundingClientRect();
  const earthRadius = earthRect.width / 2;
  const hudRect = elements.hudPanel.getBoundingClientRect();

  // Turvasäde: 45px maapallon reunasta
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

function hideTooltip() {
  elements.canvas.style.cursor = 'default';
  if (elements.tooltip) {
    elements.tooltip.classList.add('hidden');
  }
}

/**
 * Päivittää tilaviestin. Virhetilassa teksti muuttuu punaiseksi.
 */
function updateStatus(message, isError = false) {
  elements.statusMessage.textContent = message;
  elements.statusMessage.classList.toggle('status-error', isError);
}

function initInteractions() {
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

    // Nollataan mahdollinen aiempi virhetila ja käynnistetään latausanimaatio
    if (!elements.earthWrapper.classList.contains('loaded')) {
      elements.earthLoader.style.display = 'flex';
      elements.earthLoader.classList.remove('is-error');
      elements.earthErrorIcon.classList.add('hidden');
      elements.earthSpinner.classList.remove('hidden');
      elements.loaderText.textContent = 'ACQUIRING DSCOVR EPIC SIGNAL...';
    }

    updateStatus('Initiating orbital scan...', false);

    try {
      const [epicResult, neoResult] = await Promise.all([
        fetchLatestEarthImage(),
        fetchNeoData()
      ]);

      if (!epicResult.ok || !neoResult.ok) {
        showEarthErrorState();
        const errorMsg = !epicResult.ok ? epicResult.message : neoResult.message;
        updateStatus(errorMsg, true);
      } else {
        updateStatus('Telemetry nominal. Hover over any object for details.', false);
      }
    } finally {
      elements.scanBtn.disabled = false;
      elements.scanBtn.classList.remove('scanning');
    }
  });

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