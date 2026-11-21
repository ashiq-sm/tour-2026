<script>
  import { onMount } from 'svelte';
  import tourData from './data/tourData.json';
  import DuaCarousel from './components/DuaCarousel.svelte';
  import SpotCard from './components/SpotCard.svelte';
  import Checklist from './components/Checklist.svelte';
  import ContactsGrid from './components/ContactsGrid.svelte';
  import AuthorPortal from './components/AuthorPortal.svelte';

  let activeSpotId = $state('sylhet');
  let toastVisible = $state(false);

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
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute('data-spot');
            if (id) activeSpotId = id;
          }
        }
      },
      { threshold: 0.3 }
    );

    document.querySelectorAll('.spot-section').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  });
</script>

<!-- Dynamic Transparent Scenic Backgrounds on Scroll -->
{#each tourData.spots as spot (spot.id)}
  <div
    class="bg-scene {activeSpotId === spot.id ? 'bg-active' : ''}"
    style="background-image: url('{spot.sceneImg}');"
  ></div>
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
