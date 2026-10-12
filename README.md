# 🎨 MLH Bob Ross Art Gallery — Mini Event Showcase

Galería y Museo Virtual interactivo creado para el mini-evento de pintura digital de **Major League Hacking (MLH)**, inspirado en el episodio tutorial:
> 🎬 **[Bob Ross — Campfire (Temporada 3, Episodio 10)](https://www.youtube.com/watch?v=L5bXkI0-pEg)**

---

## 🚀 Despliegue en Vercel (1 Clic)

El proyecto está 100% preparado y optimizado para **Vercel** (incluye `vercel.json` y `package.json`).

### Opción 1: Con Git Kraken / GitHub y Vercel (Recomendado)
1. Haz commit de todos los cambios en **Git Kraken**.
2. Sube el repositorio a tu cuenta de **GitHub**.
3. Ve a [vercel.com](https://vercel.com) y haz clic en **"Add New..."** > **"Project"**.
4. Selecciona tu repositorio `MiniEventoShowcase`.
5. Deja la configuración por defecto y pulsa **"Deploy"**.
6. ¡Listo! Vercel te dará una URL pública gratuita (ej: `https://mini-evento-showcase.vercel.app`).

### Opción 2: Con Vercel CLI desde la terminal
```bash
npx vercel
```

---

## 🏛️ Características de la Web

- 🥇 **Salón de Honor (Top 3):** Podio automático con medallas de Oro, Plata y Bronce para las obras con más votos/reacciones.
- 🖼️ **Marcos de Museo Clásicos/Modernos:** Cada entrega muestra el avatar del participante, nombre de usuario de Discord, hora, comentario y captura de la obra.
- 💬 **Reacciones auténticas de Discord:** Contadores en tiempo real con los emojis originales del servidor (`♥️`, `❤️`, `🔥`, `👍`, `🗿`, etc.) y efecto interactivo de clic.
- 🎬 **Tutorial Original Integrado:** Reproductor para ver el tutorial de Bob Ross (*Campfire S03E10*) directamente en la galería.
- 🔍 **Buscador & Filtros:** Busca participantes y filtra por obras más populares o con descripción.
- 🔎 **Lightbox Fullscreen:** Vista ampliada de cada pintura en alta calidad.
- 📂 **Botón Importar JSON:** Para actualizar la exposición con nuevos datos en cualquier momento.

---

## 📜 Cómo actualizar o escanear más obras desde Discord

El scraper para la consola de Discord está en `discord_scraper.js`:

1. Abre **Discord Web** en tu navegador y ve al canal del evento.
2. Haz scroll para cargar los mensajes que quieras recopilar.
3. Presiona **F12** y ve a la pestaña **Console**.
4. Pega el código de `discord_scraper.js` y pulsa **Enter**.
5. Descargará automáticamente el archivo `artworks.json` deduplicado y listo.
