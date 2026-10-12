// ==========================================================================
//  MLH ART MUSEUM - APPLICATION LOGIC
// ==========================================================================

let artworksData = [];

// DOM elements
const galleryGrid = document.getElementById('gallery-grid');
const emptyState = document.getElementById('empty-state');

// Statistics
const statArtworks = document.getElementById('stat-artworks');

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

// Render main gallery (in order of appearance)
function renderGallery() {
  if (artworksData.length === 0) {
    galleryGrid.innerHTML = '';
    emptyState.style.display = 'block';
    return;
  }

  emptyState.style.display = 'none';

  galleryGrid.innerHTML = artworksData.map(art => `
    <div class="museum-card" id="card-${art.id}">
      <div class="artwork-frame">
        <img src="${art.artwork_url}" alt="Artwork by ${escapeHTML(art.username)}" class="artwork-img" loading="lazy">
      </div>
      <div class="museum-plaque">
        ${art.text ? `<p class="artwork-caption">"${escapeHTML(art.text)}"</p>` : ''}

        <div class="plaque-bottom-row">
          <div class="artist-bar">
            <img src="${art.avatar}" alt="${escapeHTML(art.username)}" class="artist-avatar" onerror="this.src='https://cdn.discordapp.com/embed/avatars/0.png'">
            <div class="artist-details">
              <h4 class="artist-name">${escapeHTML(art.username)}</h4>
              <span class="artist-time">${art.timestamp || 'Discord'}</span>
            </div>
          </div>

          <div class="reactions-bar">
            ${renderReactions(art)}
          </div>
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

function setupEventListeners() {
  // Application level event listeners if needed
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
