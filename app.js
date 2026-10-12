// ==========================================================================
//  MLH ART MUSEUM - APPLICATION LOGIC
// ==========================================================================

let artworksData = [];
let currentFilter = 'all';
let searchQuery = '';

// DOM elements
const galleryGrid = document.getElementById('gallery-grid');
const emptyState = document.getElementById('empty-state');
const searchInput = document.getElementById('search-input');
const filterButtons = document.querySelectorAll('.filter-btn');
const jsonFileInput = document.getElementById('json-file-input');

// Statistics
const statArtworks = document.getElementById('stat-artworks');

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

// Start the application
document.addEventListener('DOMContentLoaded', async () => {
  await loadArtworks();
  setupEventListeners();
});

// Load data (tries fetch, falls back safely when opened as a local file://)
async function loadArtworks() {
  try {
    const res = await fetch('artworks.json');
    if (!res.ok) throw new Error('Failed to load artworks.json');
    const data = await res.json();
    artworksData = sanitizeArtworks(data);
  } catch (err) {
    console.warn('Direct fetch failed (possibly file:// protocol), trying fallback:', err);
    // Try to use embedded data if available
    if (window.EMBEDDED_ARTWORKS) {
      artworksData = sanitizeArtworks(window.EMBEDDED_ARTWORKS);
    }
  }

  updateStats();
  renderGallery();
}

// Sanitize and clean data
function sanitizeArtworks(items) {
  const seenUrls = new Set();
  const cleanList = [];

  items.forEach((item, index) => {
    const url = item.artwork_url || '';
    // Ignore empty urls or 16px/20px/role-icons images
    if (!url || url.includes('size=16') || url.includes('size=20') || url.includes('role-icons')) {
      return;
    }
    if (seenUrls.has(url)) return;
    seenUrls.add(url);

    // Clean the username
    let rawUser = (item.username || 'Anonymous Artist').split('\n')[0].trim();
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

// Update the top statistics
function updateStats() {
  statArtworks.innerText = artworksData.length;
}

// Render main gallery
function renderGallery() {
  let filtered = [...artworksData];

  // Text search filter
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(art => 
      art.username.toLowerCase().includes(q) || 
      art.text.toLowerCase().includes(q)
    );
  }

  // Category filters
  if (currentFilter === 'popular') {
    filtered.sort((a, b) => b.total_reactions - a.total_reactions);
  } else if (currentFilter === 'captioned') {
    filtered = filtered.filter(art => art.text && art.text.length > 0);
  } else if (currentFilter === 'recent') {
    // reverse of the original order
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
        <img src="${art.artwork_url}" alt="Artwork by ${art.username}" class="artwork-img" loading="lazy">
        <div class="frame-overlay">
          <span class="zoom-badge">🔍 Inspect</span>
        </div>
      </div>
      <div class="museum-plaque">
        <div class="artist-bar">
          <img src="${art.avatar}" alt="${art.username}" class="artist-avatar" onerror="this.src='https://cdn.discordapp.com/embed/avatars/0.png'">
          <div class="artist-details">
            <h4 class="artist-name">${escapeHTML(art.username)}</h4>
            <span class="artist-time">${art.timestamp || 'Posted on Discord'}</span>
          </div>
        </div>

        ${art.text ? `<p class="artwork-caption">"${escapeHTML(art.text)}"</p>` : ''}

        <div class="reactions-bar">
          ${renderReactions(art)}
        </div>
      </div>
    </div>
  `).join('');
}

// Render reaction pills
function renderReactions(art) {
  if (!art.reactions || art.reactions.length === 0) {
    return `<span class="reaction-pill" onclick="addReaction('${art.id}', '❤️')"><span class="reaction-emoji">❤️</span> <span class="reaction-count">0</span></span>`;
  }

  return art.reactions.map(r => `
    <span class="reaction-pill" onclick="addReaction('${art.id}', '${r.emoji}')" title="Click to react with ${r.emoji}">
      <span class="reaction-emoji">${r.emoji}</span>
      <span class="reaction-count">${r.count}</span>
    </span>
  `).join('');
}

// Interactive effect when a reaction is clicked
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
  renderGallery();
};

// Open the high-resolution detail modal
window.openArtworkModal = function(artworkId) {
  const art = artworksData.find(a => a.id === artworkId);
  if (!art) return;

  modalImage.src = art.artwork_url;
  modalAvatar.src = art.avatar;
  modalUsername.innerText = art.username;
  modalTimestamp.innerText = art.timestamp ? `Posted at ${art.timestamp}` : 'Discord capture';
  
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
  // Search
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value.trim();
    renderGallery();
  });

  // Filters
  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      filterButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      renderGallery();
    });
  });

  // Import external JSON
  jsonFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target.result);
        artworksData = sanitizeArtworks(imported);
        updateStats();
        renderGallery();
        alert(`Successfully imported ${artworksData.length} artworks!`);
      } catch (err) {
        alert('The selected file is not valid JSON.');
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
