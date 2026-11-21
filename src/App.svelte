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

  let activeSpotId = $state(tourData.spots[0]?.id || 'sylhet');
  let loadedSpotIds = $state(new Set([tourData.spots[0]?.id || 'sylhet', tourData.spots[1]?.id || 'mirinja']));
  let bgSubIndex = $state(0);
  let toastVisible = $state(false);

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
    } catch {}
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

  function collapseAll() {
    const allCollapsed = Object.keys(collapsedSections).reduce((acc, k) => {
      acc[k] = true;
      return acc;
    }, {});
    collapsedSections = allCollapsed;
    try {
      localStorage.setItem('tour_collapsed_sections_v1', JSON.stringify(collapsedSections));
    } catch {}
  }

  function expandAll() {
    const allExpanded = Object.keys(collapsedSections).reduce((acc, k) => {
      acc[k] = false;
      return acc;
    }, {});
    collapsedSections = allExpanded;
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
    <div>
      <div class="header-title">🎓 {tourData.meta.title}</div>
      <div class="header-sub">{tourData.meta.subtitle}</div>
    </div>
    <div class="header-actions">
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
  <!-- View mode toolbar: allows collapsing sections to enjoy background landscapes -->
  <div class="view-controls-bar">
    <div class="view-hint">
      🌄 ব্যাকগ্রাউন্ড দেখতে সেকশন বন্ধ (Collapse) করুন:
    </div>
    <div class="view-btns">
      <button class="view-toggle-btn" onclick={collapseAll} title="সব সেকশন বন্ধ করুন">
        🙈 সব বন্ধ (See View)
      </button>
      <button class="view-toggle-btn" onclick={expandAll} title="সব সেকশন খুলুন">
        📖 সব উন্মুক্ত
      </button>
    </div>
  </div>

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
        <span class="chevron-icon">{collapsedSections.duas ? '▼ খুলুন' : '▲ বন্ধ'}</span>
      </div>
    </div>
    {#if !collapsedSections.duas}
      <div class="collapse-body">
        <DuaCarousel duas={tourData.duas} />
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
        <span class="chevron-icon">{collapsedSections.reminders ? '▼ খুলুন' : '▲ বন্ধ'}</span>
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
        <span class="chevron-icon">{collapsedSections.notices ? '▼ খুলুন' : '▲ বন্ধ'}</span>
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
        <span class="chevron-icon">{collapsedSections.rules ? '▼ খুলুন' : '▲ বন্ধ'}</span>
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
        <span class="chevron-icon">{collapsedSections.spots ? '▼ খুলুন' : '▲ বন্ধ'}</span>
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
        <span class="chevron-icon">{collapsedSections.tips ? '▼ খুলুন' : '▲ বন্ধ'}</span>
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
        <span class="chevron-icon">{collapsedSections.checklist ? '▼ খুলুন' : '▲ বন্ধ'}</span>
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
        <span class="chevron-icon">{collapsedSections.contacts ? '▼ খুলুন' : '▲ বন্ধ'}</span>
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
        <span class="chevron-icon">{collapsedSections.author ? '▼ খুলুন' : '▲ বন্ধ'}</span>
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
