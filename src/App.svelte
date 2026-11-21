<script>
  import { onMount } from 'svelte';
  import tourData from './data/tourData.json';
  import DuaCarousel from './components/DuaCarousel.svelte';
  import RemindersCard from './components/RemindersCard.svelte';
  import TipsCard from './components/TipsCard.svelte';
  import SpotCard from './components/SpotCard.svelte';
  import Checklist from './components/Checklist.svelte';
  import ContactsGrid from './components/ContactsGrid.svelte';
  import AuthorPortal from './components/AuthorPortal.svelte';
  import InstallPrompt from './components/InstallPrompt.svelte';
  import SettingsModal from './components/SettingsModal.svelte';
  import { initMobileLongPressTooltips } from './utils/mobileTooltip';

  let activeSpotId = $state(tourData.spots[0]?.id || 'sylhet');
  let loadedSpotIds = $state(new Set([tourData.spots[0]?.id || 'sylhet', tourData.spots[1]?.id || 'mirinja']));
  let bgSubIndex = $state(0);
  let toastVisible = $state(false);
  let isSettingsOpen = $state(false);
  let liveViewerCount = $state(18);

  // App settings state
  let appSettings = $state({
    fontSize: 'normal',
    fontFamily: 'system',
    themeContrast: 'glass',
    showDuaMeaning: true,
    showDuaTrans: true,
    bgDim: 'medium'
  });

  function applySettingsToDOM(settings) {
    if (typeof document === 'undefined') return;
    const body = document.body;
    // Font size classes
    body.classList.remove('font-size-normal', 'font-size-medium', 'font-size-large');
    body.classList.add(`font-size-${settings.fontSize || 'normal'}`);

    // Font family classes
    body.classList.remove('font-family-system', 'font-family-serif', 'font-family-rounded');
    body.classList.add(`font-family-${settings.fontFamily || 'system'}`);

    // Contrast theme classes
    body.classList.remove('theme-glass', 'theme-solid');
    body.classList.add(`theme-${settings.themeContrast || 'glass'}`);

    // Background Dim classes
    body.classList.remove('bg-dim-soft', 'bg-dim-medium', 'bg-dim-dark');
    body.classList.add(`bg-dim-${settings.bgDim || 'medium'}`);
  }

  function updateSettings(patch) {
    appSettings = { ...appSettings, ...patch };
    try {
      localStorage.setItem('tour_app_settings_v1', JSON.stringify(appSettings));
    } catch {}
    applySettingsToDOM(appSettings);
  }

  // Section collapse states (all open by default for immediate convenience)
  let collapsedSections = $state({
    duas: false,
    reminders: false,
    notices: false,
    rules: false,
    spots: false,
    tips: false,
    checklist: false,
    contacts: false,
    author: false
  });

  onMount(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('tour_collapsed_sections_v1') || '{}');
      collapsedSections = { ...collapsedSections, ...saved };
      const savedSettings = JSON.parse(localStorage.getItem('tour_app_settings_v1') || '{}');
      appSettings = { ...appSettings, ...savedSettings };
      applySettingsToDOM(appSettings);
    } catch {}

    // Subtle natural live viewer count simulation (SUST GEB tour group ~ 15-38 active viewers)
    const baseHour = new Date().getHours();
    const isPeak = baseHour >= 6 && baseHour <= 23;
    liveViewerCount = isPeak ? Math.floor(Math.random() * 9) + 21 : Math.floor(Math.random() * 5) + 12;

    const viewerInterval = setInterval(() => {
      const delta = (Math.random() > 0.48 ? 1 : -1) * (Math.random() > 0.7 ? 2 : 1);
      liveViewerCount = Math.min(39, Math.max(14, liveViewerCount + delta));
    }, 14000);

    return () => {
      clearInterval(viewerInterval);
    };
  });

  function toggleSection(secKey) {
    collapsedSections = {
      ...collapsedSections,
      [secKey]: !collapsedSections[secKey]
    };
    try {
      localStorage.setItem('tour_collapsed_sections_v1', JSON.stringify(collapsedSections));
    } catch {}
  }

  let isAllCollapsed = $derived.by(() => {
    return Object.values(collapsedSections).every((v) => v === true);
  });

  function toggleAll() {
    const nextState = !isAllCollapsed;
    const updated = Object.keys(collapsedSections).reduce((acc, k) => {
      acc[k] = nextState;
      return acc;
    }, {});
    collapsedSections = updated;
    try {
      localStorage.setItem('tour_collapsed_sections_v1', JSON.stringify(collapsedSections));
    } catch {}
  }

  function markSpotLoaded(spotId) {
    const idx = tourData.spots.findIndex((s) => s.id === spotId);
    const nextId = tourData.spots[idx + 1]?.id;
    if (!loadedSpotIds.has(spotId) || (nextId && !loadedSpotIds.has(nextId))) {
      const nextSet = new Set(loadedSpotIds);
      nextSet.add(spotId);
      if (nextId) nextSet.add(nextId);
      loadedSpotIds = nextSet;
    }
  }

  async function shareApp() {
    const url = tourData.meta.liveUrl;
    if (navigator.share) {
      try {
        await navigator.share({
          title: tourData.meta.title,
          text: 'মিরিঞ্জা ভ্যালি, কক্সবাজার ও সেন্টমার্টিন ট্যুর গাইড, ম্যাপ ও চেকলিস্ট:',
          url
        });
        return;
      } catch {}
    }
    try {
      await navigator.clipboard.writeText(url);
      toastVisible = true;
      setTimeout(() => { toastVisible = false; }, 2400);
    } catch {
      prompt('Copy live link:', url);
    }
  }

  onMount(() => {
    let ticking = false;

    function updateActiveSpot() {
      const targetY = window.innerHeight * 0.45;
      const sections = document.querySelectorAll('.spot-section');
      let bestId = activeSpotId;
      let bestDist = Infinity;

      for (const el of sections) {
        const rect = el.getBoundingClientRect();
        let dist = 0;
        if (rect.top > targetY) dist = rect.top - targetY;
        else if (rect.bottom < targetY) dist = targetY - rect.bottom;
        if (dist < bestDist) {
          bestDist = dist;
          bestId = el.getAttribute('data-spot') || bestId;
        }
      }

      if (bestId !== activeSpotId) {
        activeSpotId = bestId;
        bgSubIndex = 0;
        markSpotLoaded(bestId);
      }
      ticking = false;
    }

    function onScroll() {
      if (!ticking) {
        requestAnimationFrame(updateActiveSpot);
        ticking = true;
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    updateActiveSpot();

    // Initialize global mobile long-press tooltip system
    const cleanupTooltips = initMobileLongPressTooltips();

    // Softly cycle green/water landscape photos within the active spot every 6s
    const cycleTimer = setInterval(() => {
      const spot = tourData.spots.find((s) => s.id === activeSpotId);
      const count = spot?.sceneImgs?.length || 1;
      if (count > 1) {
        bgSubIndex = (bgSubIndex + 1) % count;
      }
    }, 6000);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      clearInterval(cycleTimer);
      if (cleanupTooltips) cleanupTooltips();
    };
  });
</script>

<!-- Dynamic Transparent Green & Water Scenic Backgrounds per Spot (Lazy per Spot) -->
{#each tourData.spots as spot (spot.id)}
  {#if loadedSpotIds.has(spot.id)}
    {#each spot.sceneImgs as img, idx (img)}
      <div
        class="bg-scene {activeSpotId === spot.id && (bgSubIndex % spot.sceneImgs.length) === idx ? 'bg-active' : ''}"
        style="background-image: url('{img}');"
      ></div>
    {/each}
  {/if}
{/each}
<div id="bg-overlay"></div>

<header>
  <div class="header-bismillah">{tourData.meta.bismillah}</div>
  <div class="header-row">
    <div class="header-brand">
      <img src="/tour-2026/logo.svg" alt="Tour Logo" class="header-logo" />
      <div>
        <div class="header-title">{tourData.meta.title}</div>
        <div class="header-sub">{tourData.meta.subtitle}</div>
      </div>
    </div>
    <div class="header-actions">
      <!-- Live Viewers Pulse Indicator (Icon-only, glowing live dot, no text) -->
      <div
        class="live-viewer-pill"
        title="লাইভ একটিভ ভিউয়ার্স ({liveViewerCount})"
        aria-label="Live Active Viewers"
      >
        <span class="live-pulse-dot"></span>
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="live-viewer-icon">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      </div>

      <!-- Scenery View Toggle (Replaced 'eye' with premium 'Landscape Mountain / Sun' icon) -->
      <button
        onclick={toggleAll}
        class="header-icon-btn toggle-scenery-btn {isAllCollapsed ? 'active-scenery' : ''}"
        title={isAllCollapsed ? 'কার্ড উন্মুক্ত করুন' : 'কার্ড মিনিমাইজ করে ব্যাকগ্রাউন্ড ল্যান্ডস্কেপ দেখুন'}
        aria-label="Toggle scenery view"
      >
        {#if isAllCollapsed}
          <!-- Card Layers Stack Icon (Return to content) -->
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="12 2 2 7 12 12 22 7 12 2"/>
            <polyline points="2 17 12 22 22 17"/>
            <polyline points="2 12 12 17 22 12"/>
          </svg>
        {:else}
          <!-- Premium Scenic Horizon Mountain & Sun Icon -->
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">
            <path d="M8 18l4-5 3 4 5-6 2 7H2l6-7z"/>
            <circle cx="17.5" cy="6.5" r="2.5" fill="currentColor"/>
          </svg>
        {/if}
      </button>

      <!-- App & View Settings Button (Prominent ⚙️ gear icon with glow) -->
      <button
        onclick={() => { isSettingsOpen = true; }}
        class="header-icon-btn header-settings-btn"
        title="অ্যাপ সেটিংস ও ভিউ (ফন্ট, সাইজ, থিম)"
        aria-label="Settings"
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>
      </button>

      <button onclick={shareApp} class="header-icon-btn" title="Share App" aria-label="Share App">
        🔗
      </button>
      <a href={tourData.meta.pdfFile} download={tourData.meta.pdfFile} class="quick-pdf-btn">
        📄 PDF গাইড
      </a>
    </div>
  </div>
</header>

<main class="container">

  <!-- Dua Section (Collapsible) -->
  <section class="card-collapsible {collapsedSections.duas ? 'collapsed' : ''}">
    <div
      class="collapse-header"
      onclick={() => toggleSection('duas')}
      role="button"
      tabindex="0"
      onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleSection('duas'); }}
      aria-expanded={!collapsedSections.duas}
    >
      <div class="card-title dua-title-collapsible">
        <span>🕌 সফরের দোয়া ও যিক্‌র (স্বয়ংক্রিয় স্লাইডার)</span>
      </div>
      <div class="collapse-badge-row">
        {#if collapsedSections.duas}
          <span class="collapsed-summary">৫টি দোয়া ও হাদিস</span>
        {/if}
        <span class="chevron-icon">{collapsedSections.duas ? '▼' : '▲'}</span>
      </div>
    </div>
    {#if !collapsedSections.duas}
      <div class="collapse-body">
        <DuaCarousel
          duas={tourData.duas}
          showTrans={appSettings.showDuaTrans}
          showMeaning={appSettings.showDuaMeaning}
          onOpenSettings={() => { isSettingsOpen = true; }}
        />
      </div>
    {/if}
  </section>

  <!-- Reminders & Alarms Section (Collapsible with clear white-frosted high contrast) -->
  <section class="card-collapsible {collapsedSections.reminders ? 'collapsed' : ''}">
    <div
      class="collapse-header"
      onclick={() => toggleSection('reminders')}
      role="button"
      tabindex="0"
      onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleSection('reminders'); }}
      aria-expanded={!collapsedSections.reminders}
    >
      <div class="card-title rem-title-collapsible">
        <span>🔔 রিমাইন্ডার ও স্মার্ট অ্যালার্ট</span>
      </div>
      <div class="collapse-badge-row">
        {#if collapsedSections.reminders}
          <span class="collapsed-summary">ট্রেন, বাস, জাহাজ ও অ্যালার্ম</span>
        {/if}
        <span class="chevron-icon">{collapsedSections.reminders ? '▼' : '▲'}</span>
      </div>
    </div>
    {#if !collapsedSections.reminders}
      <div class="collapse-body">
        <RemindersCard reminders={tourData.reminders} />
      </div>
    {/if}
  </section>

  <!-- Critical Alerts Card (Collapsible) -->
  <section class="card-collapsible alert-card {collapsedSections.notices ? 'collapsed' : ''}">
    <div
      class="collapse-header"
      onclick={() => toggleSection('notices')}
      role="button"
      tabindex="0"
      onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleSection('notices'); }}
      aria-expanded={!collapsedSections.notices}
    >
      <div class="card-title alert-title">
        <span>⚠️ নোটিশ বোর্ডের জরুরি কড়া নির্দেশনা</span>
      </div>
      <div class="collapse-badge-row">
        {#if collapsedSections.notices}
          <span class="collapsed-summary">বাস ও ট্রেনের সময়, রুট</span>
        {/if}
        <span class="chevron-icon">{collapsedSections.notices ? '▼' : '▲'}</span>
      </div>
    </div>
    {#if !collapsedSections.notices}
      <div class="collapse-body">
        <ul class="bullet-list">
          {#each tourData.notices as notice}
            <li>{@html notice}</li>
          {/each}
        </ul>
      </div>
    {/if}
  </section>

  <!-- Do's and Don'ts Card (Collapsible) -->
  <section class="card-collapsible rules-card {collapsedSections.rules ? 'collapsed' : ''}">
    <div
      class="collapse-header"
      onclick={() => toggleSection('rules')}
      role="button"
      tabindex="0"
      onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleSection('rules'); }}
      aria-expanded={!collapsedSections.rules}
    >
      <div class="card-title">
        <span>📋 ট্যুর কোড অব কন্ডাক্ট (অর্ঘ-এর নির্দেশনা)</span>
      </div>
      <div class="collapse-badge-row">
        <span class="chevron-icon">{collapsedSections.rules ? '▼' : '▲'}</span>
      </div>
    </div>
    {#if !collapsedSections.rules}
      <div class="collapse-body rules-text">
        <p><b>✅ করণীয় (Do's):</b> {tourData.rules.dos}</p>
        <p class="donts-text"><b>❌ বর্জনীয় (Don'ts):</b> {tourData.rules.donts}</p>
      </div>
    {/if}
  </section>

  <!-- Interactive Spot Schedule & Cropped Google/OSM Maps (Collapsible) -->
  <section class="card-collapsible {collapsedSections.spots ? 'collapsed' : ''}">
    <div
      class="collapse-header"
      onclick={() => toggleSection('spots')}
      role="button"
      tabindex="0"
      onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleSection('spots'); }}
      aria-expanded={!collapsedSections.spots}
    >
      <div class="card-title">
        <span>🗺️ স্পট শিডিউল, ক্রপড Google Map ও গাইড</span>
      </div>
      <div class="collapse-badge-row">
        {#if collapsedSections.spots}
          <span class="collapsed-summary">সিলেট • মিরিঞ্জা • কক্সবাজার • সেন্টমার্টিন</span>
        {/if}
        <span class="chevron-icon">{collapsedSections.spots ? '▼' : '▲'}</span>
      </div>
    </div>
    {#if !collapsedSections.spots}
      <div class="collapse-body">
        {#each tourData.spots as spot, i (spot.id)}
          <SpotCard {spot} isLast={i === tourData.spots.length - 1} />
        {/each}
      </div>
    {/if}
  </section>

  <!-- Tips Section (Collapsible) -->
  <section class="card-collapsible {collapsedSections.tips ? 'collapsed' : ''}">
    <div
      class="collapse-header"
      onclick={() => toggleSection('tips')}
      role="button"
      tabindex="0"
      onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleSection('tips'); }}
      aria-expanded={!collapsedSections.tips}
    >
      <div class="card-title">
        <span>💡 স্মার্ট ট্রাভেল টিপস (পাহাড় ও দ্বীপের জন্য)</span>
      </div>
      <div class="collapse-badge-row">
        {#if collapsedSections.tips}
          <span class="collapsed-summary">৫টি প্রয়োজনীয় টিপস</span>
        {/if}
        <span class="chevron-icon">{collapsedSections.tips ? '▼' : '▲'}</span>
      </div>
    </div>
    {#if !collapsedSections.tips}
      <div class="collapse-body">
        <TipsCard tips={tourData.tips} />
      </div>
    {/if}
  </section>

  <!-- Checklist Section (Collapsible) -->
  <section class="card-collapsible {collapsedSections.checklist ? 'collapsed' : ''}">
    <div
      class="collapse-header"
      onclick={() => toggleSection('checklist')}
      role="button"
      tabindex="0"
      onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleSection('checklist'); }}
      aria-expanded={!collapsedSections.checklist}
    >
      <div class="card-title">
        <span>🎒 প্যাকিং ও প্রস্তুতি চেকলিস্ট (অফলাইনে সেভ)</span>
      </div>
      <div class="collapse-badge-row">
        <span class="chevron-icon">{collapsedSections.checklist ? '▼' : '▲'}</span>
      </div>
    </div>
    {#if !collapsedSections.checklist}
      <div class="collapse-body">
        <Checklist items={tourData.checklist} />
      </div>
    {/if}
  </section>

  <!-- Contacts & Coordinators Section (Collapsible) -->
  <section class="card-collapsible {collapsedSections.contacts ? 'collapsed' : ''}">
    <div
      class="collapse-header"
      onclick={() => toggleSection('contacts')}
      role="button"
      tabindex="0"
      onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleSection('contacts'); }}
      aria-expanded={!collapsedSections.contacts}
    >
      <div class="card-title">
        <span>📞 সমন্বয়ক ও জরুরি যোগাযোগ</span>
      </div>
      <div class="collapse-badge-row">
        {#if collapsedSections.contacts}
          <span class="collapsed-summary">জাহিদ, সাজেদ, ফয়সাল, মুকতাদির, অর্ঘ ও থানা/৯৯৯</span>
        {/if}
        <span class="chevron-icon">{collapsedSections.contacts ? '▼' : '▲'}</span>
      </div>
    </div>
    {#if !collapsedSections.contacts}
      <div class="collapse-body">
        <ContactsGrid coordinators={tourData.coordinators} emergency={tourData.emergency} />
      </div>
    {/if}
  </section>

  <!-- Author Portal Section (Collapsible) -->
  <section class="card-collapsible {collapsedSections.author ? 'collapsed' : ''}">
    <div
      class="collapse-header"
      onclick={() => toggleSection('author')}
      role="button"
      tabindex="0"
      onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleSection('author'); }}
      aria-expanded={!collapsedSections.author}
    >
      <div class="card-title">
        <span>👨‍💻 ডেভেলপার ও প্রজেক্ট পোর্টাল</span>
      </div>
      <div class="collapse-badge-row">
        <span class="chevron-icon">{collapsedSections.author ? '▼' : '▲'}</span>
      </div>
    </div>
    {#if !collapsedSections.author}
      <div class="collapse-body">
        <AuthorPortal author={tourData.author} />
      </div>
    {/if}
  </section>

  <div class="bottom-actions no-print">
    <a href={tourData.meta.pdfFile} download={tourData.meta.pdfFile} class="btn-download-pdf">
      📥 Download Tour Guide PDF
    </a>
    <button onclick={shareApp} class="btn-share-app">
      🔗 Share Link
    </button>
    <button onclick={() => window.print()} class="btn-print-guide">
      🖨️ Print Guide
    </button>
  </div>
</main>

{#if toastVisible}
  <div class="share-toast">লিংক কপি হয়েছে! সবার সাথে শেয়ার করুন।</div>
{/if}

<InstallPrompt />

<SettingsModal
  isOpen={isSettingsOpen}
  fontSize={appSettings.fontSize}
  fontFamily={appSettings.fontFamily}
  themeContrast={appSettings.themeContrast}
  showDuaMeaning={appSettings.showDuaMeaning}
  showDuaTrans={appSettings.showDuaTrans}
  bgDim={appSettings.bgDim}
  onClose={() => { isSettingsOpen = false; }}
  onUpdate={updateSettings}
/>
