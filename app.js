// ==========================================================================
//  MUSEO DE ARTE MLH - LÓGICA DE APLICACIÓN
// ==========================================================================

let artworksData = [];
let currentFilter = 'all';
let searchQuery = '';

// Elementos del DOM
const galleryGrid = document.getElementById('gallery-grid');
const podiumGrid = document.getElementById('podium-grid');
const emptyState = document.getElementById('empty-state');
const searchInput = document.getElementById('search-input');
const filterButtons = document.querySelectorAll('.filter-btn');
const jsonFileInput = document.getElementById('json-file-input');

// Estadísticas
const statArtworks = document.getElementById('stat-artworks');
const statReactions = document.getElementById('stat-reactions');
const statTopArtist = document.getElementById('stat-top-artist');

// Modal Lightbox
const modalOverlay = document.getElementById('artwork-modal');
const modalClose = document.getElementById('modal-close');
const modalImage = document.getElementById('modal-image');
const modalAvatar = document.getElementById('modal-avatar');
const modalUsername = document.getElementById('modal-username');
const modalTimestamp = document.getElementById('modal-timestamp');
const modalText = document.getElementById('modal-text');
const modalReactions = document.getElementById('modal-reactions');
const modalDiscordLink = document.getElementById('modal-discord-link');

// Iniciar aplicación
document.addEventListener('DOMContentLoaded', async () => {
  await loadArtworks();
  setupEventListeners();
});

// Cargar datos (intenta fetch y tiene fallback seguro si se abre como archivo local file://)
async function loadArtworks() {
  try {
    const res = await fetch('artworks.json');
    if (!res.ok) throw new Error('Error al cargar artworks.json');
    const data = await res.json();
    artworksData = sanitizeArtworks(data);
  } catch (err) {
    console.warn('Fetch directo falló (posible protocolo file://), intentando respaldo:', err);
    // Intentar buscar datos embebidos si existen
    if (window.EMBEDDED_ARTWORKS) {
      artworksData = sanitizeArtworks(window.EMBEDDED_ARTWORKS);
    }
  }

  updateStats();
  renderPodium();
  renderGallery();
}

// Sanitizar y limpiar datos
function sanitizeArtworks(items) {
  const seenUrls = new Set();
  const cleanList = [];

  items.forEach((item, index) => {
    const url = item.artwork_url || '';
    // Ignorar urls vacías o iconos 16px/20px/role-icons
    if (!url || url.includes('size=16') || url.includes('size=20') || url.includes('role-icons')) {
      return;
    }
    if (seenUrls.has(url)) return;
    seenUrls.add(url);

    // Limpiar nombre de usuario
    let rawUser = (item.username || 'Artista Anónimo').split('\n')[0].trim();
    let cleanUser = rawUser.split('[')[0].trim() || rawUser;

    cleanList.push({
      id: item.id || `art-${index}`,
      username: cleanUser,
      avatar: item.avatar || 'https://cdn.discordapp.com/embed/avatars/0.png',
      timestamp: (item.timestamp || '').replace(/^—\s*/, '').trim(),
      text: (item.text || '').split('\n')[0].trim(),
      artwork_url: url,
      reactions: item.reactions || [],
      total_reactions: item.total_reactions || (item.reactions ? item.reactions.reduce((a, b) => a + b.count, 0) : 0)
    });
  });

  return cleanList;
}

// Actualizar estadísticas superiores
function updateStats() {
  statArtworks.innerText = artworksData.length;

  const totalReactions = artworksData.reduce((acc, cur) => acc + cur.total_reactions, 0);
  statReactions.innerText = totalReactions;

  if (artworksData.length > 0) {
    const sorted = [...artworksData].sort((a, b) => b.total_reactions - a.total_reactions);
    statTopArtist.innerText = `${sorted[0].username} (${sorted[0].total_reactions} ❤️)`;
  } else {
    statTopArtist.innerText = '-';
  }
}

// Renderizar Podio de Honor (Top 3)
function renderPodium() {
  const sorted = [...artworksData].sort((a, b) => b.total_reactions - a.total_reactions);
  const top3 = sorted.slice(0, 3);

  if (top3.length === 0) {
    document.getElementById('podium-container').style.display = 'none';
    return;
  }

  const medals = [
    { place: 'first-place', icon: '🥇', label: '1er Lugar' },
    { place: 'second-place', icon: '🥈', label: '2do Lugar' },
    { place: 'third-place', icon: '🥉', label: '3er Lugar' }
  ];

  podiumGrid.innerHTML = top3.map((art, idx) => {
    const medal = medals[idx] || medals[2];
    return `
      <div class="podium-card ${medal.place}">
        <div class="podium-medal" title="${medal.label}">${medal.icon}</div>
        <div class="artwork-frame" onclick="openArtworkModal('${art.id}')">
          <img src="${art.artwork_url}" alt="Obra de ${art.username}" class="artwork-img" loading="lazy">
          <div class="frame-overlay">
            <span class="zoom-badge">🔍 Ver Obra</span>
          </div>
        </div>
        <div class="museum-plaque">
          <div class="artist-bar">
            <img src="${art.avatar}" alt="${art.username}" class="artist-avatar" onerror="this.src='https://cdn.discordapp.com/embed/avatars/0.png'">
            <div class="artist-details">
              <h3 class="artist-name">${escapeHTML(art.username)}</h3>
              <span class="artist-time">${medal.label} • ${art.timestamp || 'Evento'}</span>
            </div>
          </div>
          ${art.text ? `<p class="artwork-caption">"${escapeHTML(art.text)}"</p>` : ''}
          <div class="reactions-bar">
            ${renderReactions(art)}
            <span class="total-pill">${art.total_reactions} Reacciones</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Renderizar Galería Principal
function renderGallery() {
  let filtered = [...artworksData];

  // Filtro de texto / búsqueda
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(art => 
      art.username.toLowerCase().includes(q) || 
      art.text.toLowerCase().includes(q)
    );
  }

  // Filtros de categoría
  if (currentFilter === 'popular') {
    filtered.sort((a, b) => b.total_reactions - a.total_reactions);
  } else if (currentFilter === 'captioned') {
    filtered = filtered.filter(art => art.text && art.text.length > 0);
  } else if (currentFilter === 'recent') {
    // orden original o inverso
    filtered.reverse();
  }

  if (filtered.length === 0) {
    galleryGrid.innerHTML = '';
    emptyState.style.display = 'block';
    return;
  }

  emptyState.style.display = 'none';

  galleryGrid.innerHTML = filtered.map(art => `
    <div class="museum-card" id="card-${art.id}">
      <div class="artwork-frame" onclick="openArtworkModal('${art.id}')">
        <img src="${art.artwork_url}" alt="Obra de ${art.username}" class="artwork-img" loading="lazy">
        <div class="frame-overlay">
          <span class="zoom-badge">🔍 Inspeccionar</span>
        </div>
      </div>
      <div class="museum-plaque">
        <div class="artist-bar">
          <img src="${art.avatar}" alt="${art.username}" class="artist-avatar" onerror="this.src='https://cdn.discordapp.com/embed/avatars/0.png'">
          <div class="artist-details">
            <h4 class="artist-name">${escapeHTML(art.username)}</h4>
            <span class="artist-time">${art.timestamp || 'Publicado en Discord'}</span>
          </div>
        </div>

        ${art.text ? `<p class="artwork-caption">"${escapeHTML(art.text)}"</p>` : ''}

        <div class="reactions-bar">
          ${renderReactions(art)}
          <span class="total-pill">${art.total_reactions} Total</span>
        </div>
      </div>
    </div>
  `).join('');
}

// Renderizar pastillas de reacciones
function renderReactions(art) {
  if (!art.reactions || art.reactions.length === 0) {
    return `<span class="reaction-pill" onclick="addReaction('${art.id}', '❤️')"><span class="reaction-emoji">❤️</span> <span class="reaction-count">0</span></span>`;
  }

  return art.reactions.map(r => `
    <span class="reaction-pill" onclick="addReaction('${art.id}', '${r.emoji}')" title="Haz clic para reaccionar con ${r.emoji}">
      <span class="reaction-emoji">${r.emoji}</span>
      <span class="reaction-count">${r.count}</span>
    </span>
  `).join('');
}

// Efecto interactivo al hacer click en una reacción
window.addReaction = function(artworkId, emoji) {
  const art = artworksData.find(a => a.id === artworkId);
  if (!art) return;

  const r = art.reactions.find(item => item.emoji === emoji);
  if (r) {
    r.count += 1;
  } else {
    art.reactions.push({ emoji, count: 1 });
  }
  art.total_reactions += 1;

  updateStats();
  renderPodium();
  renderGallery();
};

// Abrir modal de detalle en alta resolución
window.openArtworkModal = function(artworkId) {
  const art = artworksData.find(a => a.id === artworkId);
  if (!art) return;

  modalImage.src = art.artwork_url;
  modalAvatar.src = art.avatar;
  modalUsername.innerText = art.username;
  modalTimestamp.innerText = art.timestamp ? `Publicado a las ${art.timestamp}` : 'Captura de Discord';
  
  if (art.text) {
    modalText.style.display = 'block';
    modalText.innerText = `"${art.text}"`;
  } else {
    modalText.style.display = 'none';
  }

  modalReactions.innerHTML = renderReactions(art);
  modalDiscordLink.href = art.artwork_url;

  modalOverlay.classList.add('active');
  document.body.style.overflow = 'hidden';
};

function closeModal() {
  modalOverlay.classList.remove('active');
  document.body.style.overflow = '';
}

// Event Listeners
function setupEventListeners() {
  // Tutorial Video Toggle
  const btnToggleVideo = document.getElementById('btn-toggle-video');
  const tutorialEmbedWrapper = document.getElementById('tutorial-embed-wrapper');
  const tutorialIframe = document.getElementById('tutorial-iframe');

  if (btnToggleVideo && tutorialEmbedWrapper && tutorialIframe) {
    btnToggleVideo.addEventListener('click', () => {
      const isVisible = tutorialEmbedWrapper.style.display !== 'none';
      if (isVisible) {
        tutorialEmbedWrapper.style.display = 'none';
        tutorialIframe.src = '';
        btnToggleVideo.innerHTML = '<span class="play-icon">▶</span> Reproducir Tutorial Aquí';
      } else {
        tutorialEmbedWrapper.style.display = 'block';
        if (!tutorialIframe.src) {
          tutorialIframe.src = tutorialIframe.dataset.src;
        }
        btnToggleVideo.innerHTML = '<span>⏸</span> Ocultar Video Tutorial';
      }
    });
  }

  // Búsqueda
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value.trim();
    renderGallery();
  });

  // Filtros
  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      filterButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      renderGallery();
    });
  });

  // Importar JSON externo
  jsonFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target.result);
        artworksData = sanitizeArtworks(imported);
        updateStats();
        renderPodium();
        renderGallery();
        alert(`¡Se importaron ${artworksData.length} obras correctamente!`);
      } catch (err) {
        alert('El archivo seleccionado no es un JSON válido.');
      }
    };
    reader.readAsText(file);
  });

  // Modal close
  modalClose.addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalOverlay.classList.contains('active')) {
      closeModal();
    }
  });
}

function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}
