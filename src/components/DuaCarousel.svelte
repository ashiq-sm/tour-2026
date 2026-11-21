<script>
  import { onMount, onDestroy } from 'svelte';

  let { duas = [] } = $props();

  let current = $state(0);
  let showInfo = $state(false);
  let timer = null;
  let touchStartX = 0;

  function go(idx) {
    if (!duas.length) return;
    current = (idx + duas.length) % duas.length;
  }

  function next() { go(current + 1); resetAuto(); }
  function prev() { go(current - 1); resetAuto(); }

  function startAuto() {
    stopAuto();
    timer = setInterval(() => go(current + 1), 6500);
  }
  function stopAuto() {
    if (timer) { clearInterval(timer); timer = null; }
  }
  function resetAuto() { startAuto(); }

  function openInfo() {
    stopAuto();
    showInfo = true;
  }
  function closeInfo() {
    showInfo = false;
    startAuto();
  }

  function onTouchStart(e) {
    touchStartX = e.changedTouches[0].screenX;
    stopAuto();
  }
  function onTouchEnd(e) {
    const diff = e.changedTouches[0].screenX - touchStartX;
    if (Math.abs(diff) > 40) {
      diff < 0 ? next() : prev();
    } else {
      startAuto();
    }
  }

  onMount(() => { startAuto(); });
  onDestroy(() => { stopAuto(); });
</script>

<div
  class="card dua-card"
  onmouseenter={stopAuto}
  onmouseleave={() => { if (!showInfo) startAuto(); }}
  role="region"
  aria-label="Travel Duas and Hadith"
>
  <div class="dua-carousel-header">
    <div class="dua-badge-title">
      <span>{duas[current]?.title}</span>
    </div>
    <button
      class="dua-info-btn"
      onclick={openInfo}
      title="হাদিস ও বিস্তারিত দেখুন"
      aria-label="হাদিস ও বিস্তারিত দেখুন"
    >
      i
    </button>
  </div>

  <div
    class="dua-slides-viewport"
    role="group"
    aria-roledescription="carousel"
    ontouchstart={onTouchStart}
    ontouchend={onTouchEnd}
  >
    <div
      class="dua-slides-track"
      style="transform: translateX(-{current * 100}%);"
    >
      {#each duas as d (d.id)}
        <div class="dua-slide">
          <div class="dua-arabic-large">{d.arabic}</div>
          <div class="dua-trans">"{d.trans}"</div>
          <div class="dua-meaning">{d.meaning}</div>
          <a href={d.link} target="_blank" rel="noopener noreferrer" class="dua-source-link">
            🔗 {d.linkLabel} ➔
          </a>
        </div>
      {/each}
    </div>
  </div>

  <div class="dua-controls">
    <button class="dua-nav-btn" onclick={prev} aria-label="Previous">&#8249;</button>
    <div class="dua-dots">
      {#each duas as _, i}
        <button
          class="dua-dot {i === current ? 'active' : ''}"
          onclick={() => { go(i); resetAuto(); }}
          aria-label="Slide {i + 1}"
        ></button>
      {/each}
    </div>
    <button class="dua-nav-btn" onclick={next} aria-label="Next">&#8250;</button>
  </div>
</div>

{#if showInfo && duas[current]}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="info-modal-backdrop" onclick={(e) => { if (e.target === e.currentTarget) closeInfo(); }}>
    <div class="info-modal-box">
      <div class="info-modal-header">
        <strong>{duas[current].infoTitle}</strong>
        <button class="info-modal-close" onclick={closeInfo} aria-label="Close">✕</button>
      </div>
      <div class="info-modal-body">{@html duas[current].infoBody}</div>
      <div class="info-modal-footer">
        <a href={duas[current].link} target="_blank" rel="noopener noreferrer">
          মূল উৎস (GTAF) দেখুন ➔
        </a>
      </div>
    </div>
  </div>
{/if}
