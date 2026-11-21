<script>
  import { tick } from 'svelte';

  let { spot, isLast = false } = $props();

  let mapMode = $state('gmap'); // 'gmap' | 'osm'
  let osmEl = $state(null);
  let osmInstance = null;

  async function setMode(mode) {
    mapMode = mode;
    if (mode === 'osm') {
      await tick();
      if (!osmInstance && osmEl) {
        if (!window.L) {
          await loadLeaflet();
        }
        if (window.L) {
          osmInstance = window.L.map(osmEl, {
            center: [spot.lat, spot.lon],
            zoom: spot.zoom || 14,
            zoomControl: false,
            attributionControl: false
          });
          window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18 }).addTo(osmInstance);
          window.L.marker([spot.lat, spot.lon]).addTo(osmInstance).bindPopup(`<b>${spot.mapLabel}</b>`).openPopup();
        }
      }
      if (osmInstance) {
        setTimeout(() => osmInstance.invalidateSize(), 100);
      }
    }
  }

  function loadLeaflet() {
    return new Promise((resolve) => {
      if (window.L) return resolve();
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
      const s = document.createElement('script');
      s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      s.onload = resolve;
      s.onerror = resolve;
      document.head.appendChild(s);
    });
  }
</script>

<div id="section-{spot.id}" class="timeline-item spot-section {isLast ? 'timeline-last' : ''}" data-spot={spot.id}>
  <span class="day-badge">{spot.badge}</span>
  <p class="spot-schedule">{@html spot.schedule}</p>

  <div class="spot-box">
    <div class="tags-row">
      <a href={spot.weatherUrl} target="_blank" rel="noopener noreferrer" class="tag tag-weather" title="Check Live Bangladesh Weather">
        🌤️ {spot.weather} ↗
      </a>
      {#if spot.prep}
        <span class="tag tag-prep">{spot.prep}</span>
      {/if}
      {#if spot.opp}
        <span class="tag tag-opp">{spot.opp}</span>
      {/if}
    </div>

    <div class="map-toolbar">
      <div class="map-toggle-group">
        <button
          class="map-toggle-btn {mapMode === 'gmap' ? 'active' : ''}"
          onclick={() => setMode('gmap')}
        >
          Google Map
        </button>
        <button
          class="map-toggle-btn {mapMode === 'osm' ? 'active' : ''}"
          onclick={() => setMode('osm')}
        >
          OSM (Offline)
        </button>
      </div>
      <a
        href="https://maps.google.com/?q={spot.mapQuery}"
        target="_blank"
        rel="noopener noreferrer"
        class="gmaps-open-btn"
      >
        📍 Open Maps
      </a>
    </div>

    <div class="spot-map-wrapper">
      {#if mapMode === 'gmap'}
        <iframe
          class="gmap-frame"
          title={spot.mapLabel}
          loading="lazy"
          src="https://maps.google.com/maps?q={spot.mapQuery}&t=&z={spot.zoom || 14}&ie=UTF8&iwloc=&output=embed"
        ></iframe>
      {:else}
        <div bind:this={osmEl} class="osm-container"></div>
      {/if}
    </div>

    <div class="spot-box-title">{spot.notesTitle}</div>
    <ul class="spot-notes-list">
      {#each spot.notes as note}
        <li>{@html note}</li>
      {/each}
    </ul>
  </div>
</div>
