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
        // If section spans across targetY, distance is 0
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
  <DuaCarousel duas={tourData.duas} />

  <RemindersCard reminders={tourData.reminders} />

  <!-- Critical Alerts Card -->
  <div class="card alert-card">
    <div class="card-title alert-title">⚠️ নোটিশ বোর্ডের জরুরি কড়া নির্দেশনা</div>
    <ul class="bullet-list">
      {#each tourData.notices as notice}
        <li>{@html notice}</li>
      {/each}
    </ul>
  </div>

  <!-- Do's and Don'ts Card -->
  <div class="card rules-card">
    <div class="card-title">📋 ট্যুর কোড অব কন্ডাক্ট (অর্ঘ-এর নির্দেশনা)</div>
    <div class="rules-text">
      <p><b>✅ করণীয় (Do's):</b> {tourData.rules.dos}</p>
      <p class="donts-text"><b>❌ বর্জনীয় (Don'ts):</b> {tourData.rules.donts}</p>
    </div>
  </div>

  <!-- Interactive Spot Schedule & Cropped Google/OSM Maps -->
  <div class="card">
    <div class="card-title">🗺️ স্পট শিডিউল, ক্রপড Google Map ও গাইড</div>
    {#each tourData.spots as spot, i (spot.id)}
      <SpotCard {spot} isLast={i === tourData.spots.length - 1} />
    {/each}
  </div>

  <TipsCard tips={tourData.tips} />

  <Checklist items={tourData.checklist} />

  <ContactsGrid coordinators={tourData.coordinators} emergency={tourData.emergency} />

  <AuthorPortal author={tourData.author} />

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
