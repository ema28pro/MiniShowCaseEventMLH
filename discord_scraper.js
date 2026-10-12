/**
 * =====================================================================
 *  MINI EVENT ART MUSEUM - DISCORD CONSOLE SCRAPER (V2 MEJORADO)
 * =====================================================================
 *  - Deduplica automáticamente mensajes y screenshots
 *  - Limpia nombres de usuario (quita etiquetas de servidor y saltos de línea)
 *  - Descarga 'artworks.json' limpio y listo para el Museo de Arte
 * =====================================================================
 */

(() => {
  const messageElements = document.querySelectorAll(
    '[data-list-item-id^="chat-messages-"], li[id^="chat-messages-"], div[id^="chat-messages-"], [role="article"]'
  );

  console.log(`%c[🎨 Scraper] Analizando ${messageElements.length} elementos en el chat...`, "color: #5865F2; font-weight: bold; font-size: 14px;");

  const results = [];
  const seenArtworks = new Set();
  const seenIds = new Set();

  messageElements.forEach((msg) => {
    // 1. Evitar mensajes duplicados por ID
    const rawId = msg.getAttribute("data-list-item-id") || msg.id || "";
    const cleanId = rawId.replace(/^chat-messages___/, "").replace(/^chat-messages-/, "");
    if (cleanId && seenIds.has(cleanId)) return;
    if (cleanId) seenIds.add(cleanId);

    // 2. Extraer y limpiar Usuario
    const userEl = 
      msg.querySelector('span[id^="message-username-"]') ||
      msg.querySelector('[class*="username_"]') ||
      msg.querySelector('[data-text]');
    let rawUsername = userEl ? (userEl.getAttribute("data-text") || userEl.innerText.trim()) : "Anónimo";
    // Tomar solo el nombre principal sin roles ni saltos de línea
    const username = rawUsername.split("\n")[0].split("[")[0].trim() || rawUsername;

    // 3. Avatar de perfil
    const avatarEl = msg.querySelector('img[class*="avatar_"]');
    const avatar = avatarEl ? avatarEl.src : "https://cdn.discordapp.com/embed/avatars/0.png";

    // 4. Timestamp / Hora
    const timeEl = msg.querySelector('time');
    let timestamp = timeEl ? (timeEl.innerText.trim() || timeEl.getAttribute('datetime')) : "";
    timestamp = timestamp.replace(/^—\s*/, "").split("\n")[0].trim();

    // 5. Texto del mensaje
    const contentEl = 
      msg.querySelector('div[id^="message-content-"]') ||
      msg.querySelector('[class*="messageContent_"]') ||
      msg.querySelector('[class*="markup_"]');
    const text = contentEl ? contentEl.innerText.trim() : "";

    // 6. Screenshot / Obra de arte (descartar avatars 16px/20px, badges o svgs de sistema)
    let artworkUrl = null;
    const originalLink = msg.querySelector('a[class*="originalLink_"]');
    if (originalLink && originalLink.href) {
      artworkUrl = originalLink.href;
    } else {
      const imgElements = Array.from(msg.querySelectorAll('img')).filter(img => {
        const src = img.src || "";
        const isAvatar = (img.className || "").includes("avatar") || src.includes("/avatars/") && src.includes("size=");
        const isEmoji = (img.className || "").includes("emoji");
        const isBadge = (img.className || "").includes("badge") || src.includes("clan-badges") || src.includes("role-icons");
        const isBase64 = src.startsWith("data:");
        const isSvg = src.endsWith(".svg") || src.includes(".svg?");
        return !isAvatar && !isEmoji && !isBadge && !isBase64 && !isSvg && src.length > 0;
      });
      if (imgElements.length > 0) {
        artworkUrl = imgElements[0].src;
      }
    }

    // Filtrar si no hay imagen o si es un icono diminuto
    if (!artworkUrl) return;
    if (artworkUrl.includes("size=16") || artworkUrl.includes("size=20") || artworkUrl.includes("role-icons")) return;

    // Evitar obras duplicadas
    if (seenArtworks.has(artworkUrl)) return;
    seenArtworks.add(artworkUrl);

    // 7. Reacciones con contadores
    const reactions = [];
    const reactionElements = msg.querySelectorAll('[class*="reaction_"]');

    reactionElements.forEach(r => {
      if ((r.className || "").includes("reactionBtn")) return;

      const emojiImg = r.querySelector('img[class*="emoji"]');
      let emoji = "";
      if (emojiImg) {
        emoji = emojiImg.getAttribute("alt") || emojiImg.getAttribute("data-name") || "❤️";
      } else {
        const emojiSpan = r.querySelector('[class*="emoji"]');
        emoji = emojiSpan ? emojiSpan.innerText.trim() : "❤️";
      }

      const countEl = r.querySelector('[class*="reactionCount_"]');
      const count = countEl ? (parseInt(countEl.innerText.trim(), 10) || 1) : 1;

      if (emoji) {
        reactions.push({ emoji, count });
      }
    });

    const totalReactions = reactions.reduce((sum, item) => sum + item.count, 0);

    results.push({
      id: cleanId,
      username,
      avatar,
      timestamp,
      text,
      artwork_url: artworkUrl,
      reactions,
      total_reactions: totalReactions
    });
  });

  console.log(`%c✓ ¡Éxito! Se recolectaron ${results.length} obras de arte únicas.`, "color: #57F287; font-weight: bold; font-size: 14px;");
  
  if (results.length > 0) {
    console.table(results.map(r => ({
      Artista: r.username,
      Reacciones: r.total_reactions,
      Comentario: (r.text || "(sin texto)").slice(0, 30),
      URL: r.artwork_url.slice(0, 50) + "..."
    })));

    if (typeof copy === "function") {
      copy(JSON.stringify(results, null, 2));
      console.log("%c✓ JSON copiado al portapapeles.", "color: #FEE75C; font-weight: bold;");
    }

    const blob = new Blob([JSON.stringify(results, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "artworks.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    console.log("%c✓ Archivo 'artworks.json' descargado con éxito.", "color: #57F287; font-weight: bold;");
  }

  return results;
})();
