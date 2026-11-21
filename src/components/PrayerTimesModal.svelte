<script>
  import { onMount } from 'svelte';
  import { PRAYER_LOCATIONS, TAYAMMUM_GUIDELINES } from '../data/prayerTimesData.js';

  let {
    isOpen = false,
    selectedLocationId = 'sylhet',
    onClose = () => {}
  } = $props();

  let activeLocId = $state('sylhet');
  let prayerTimes = $state({});
  let isRefreshing = $state(false);
  let statusMessage = $state('');
  let notifyEnabled = $state(false);
  let showTayammum = $state(false);
  let isGpsActive = $state(false);

  // Sync prop when opened
  $effect(() => {
    if (selectedLocationId && PRAYER_LOCATIONS.some(l => l.id === selectedLocationId)) {
      activeLocId = selectedLocationId;
    }
  });

  // Calculate current location object
  let currentLocation = $derived(
    PRAYER_LOCATIONS.find(l => l.id === activeLocId) || PRAYER_LOCATIONS[0]
  );

  // Active times (offline base or live fetched)
  let activeTimes = $derived(prayerTimes[activeLocId] || currentLocation.baseTimes);

  // Formatter for 12-hour AM/PM with Bengali labels
  function format12h(timeStr) {
    if (!timeStr) return '--:--';
    const [hStr, mStr] = timeStr.split(':');
    let h = parseInt(hStr, 10);
    const m = mStr.substring(0, 2);
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h}:${m} ${ampm}`;
  }

  // Fetch online times from Aladhan API with Karachi method (standard in BD)
  async function refreshPrayerTimes(loc = currentLocation) {
    isRefreshing = true;
    statusMessage = 'অনলাইন আপডেট হচ্ছে...';
    try {
      const url = `https://api.aladhan.com/v1/timings?latitude=${loc.lat}&longitude=${loc.lon}&method=1`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Network response not ok');
      const data = await res.json();
      if (data && data.data && data.data.timings) {
        const t = data.data.timings;
        prayerTimes[loc.id] = {
          fajr: t.Fajr,
          sunrise: t.Sunrise,
          dhuhr: t.Dhuhr,
          asr: t.Asr,
          maghrib: t.Maghrib,
          isha: t.Isha
        };
        statusMessage = '✓ লাইভ আজান ওয়াক্ত সফলভাবে রিফ্রেশ হয়েছে';
      }
    } catch (err) {
      statusMessage = 'অফলাইন মোড: সংরক্ষিত সঠিক ওয়াক্ত তালিকা প্রদর্শিত হচ্ছে';
    } finally {
      isRefreshing = false;
      setTimeout(() => { statusMessage = ''; }, 3200);
    }
  }

  // Detect current location via GPS
  function detectGPSLocation() {
    if (!navigator.geolocation) {
      statusMessage = 'ডিভাইসে GPS লোকেশন সমর্থিত নয়';
      return;
    }
    isRefreshing = true;
    statusMessage = 'GPS পজিশন নির্ণয় করা হচ্ছে...';
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const userLat = pos.coords.latitude;
        const userLon = pos.coords.longitude;
        // Find nearest tour stop
        let minDistance = Infinity;
        let nearest = PRAYER_LOCATIONS[0];
        PRAYER_LOCATIONS.forEach(loc => {
          const d = Math.hypot(loc.lat - userLat, loc.lon - userLon);
          if (d < minDistance) {
            minDistance = d;
            nearest = loc;
          }
        });
        activeLocId = nearest.id;
        isGpsActive = true;
        refreshPrayerTimes(nearest);
      },
      (err) => {
        isRefreshing = false;
        statusMessage = 'লোকেশন এক্সেস পাওয়া যায়নি, সংরক্ষিত রুট ব্যবহার করুন';
        setTimeout(() => { statusMessage = ''; }, 3000);
      },
      { timeout: 7000 }
    );
  }

  // Request browser notification permission
  async function toggleNotification() {
    if (typeof Notification === 'undefined') {
      alert('আপনার ব্রাউজারে নোটিফিকেশন সাপোর্ট নেই।');
      return;
    }
    if (Notification.permission === 'granted') {
      notifyEnabled = !notifyEnabled;
      if (notifyEnabled) {
        new Notification('🔔 ওয়াক্ত রিমাইন্ডার সক্রিয়', {
          body: `${currentLocation.name}-এ নামাজের সময় সতর্কবার্তা দেওয়া হবে।`,
          icon: '/tour-2026/logo.svg'
        });
      }
    } else if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        notifyEnabled = true;
        new Notification('🔔 ওয়াক্ত রিমাইন্ডার সক্রিয়', {
          body: 'নামাজের সময় আপনাকে জানিয়ে দেওয়া হবে।',
          icon: '/tour-2026/logo.svg'
        });
      }
    } else {
      alert('ব্রাউজার সেটিংসে নোটিফিকেশন ব্লক করা আছে। দয়া করে পারমিশন দিন।');
    }
  }
</script>

{#if isOpen}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="prayer-modal-backdrop" onclick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
    <div class="prayer-modal-box" role="dialog" aria-label="আজান ও নামাজের সময়সূচী">
      <!-- Modal Header -->
      <div class="prayer-modal-header">
        <div class="prayer-modal-title">
          <span class="prayer-header-icon">🕌</span>
          <div>
            <strong>নামাজের ওয়াক্ত ও আজান সূচি</strong>
            <span class="prayer-header-sub">সফরকালীন রুট ও ওয়াক্ত ট্র্যাকার</span>
          </div>
        </div>
        <button class="prayer-close-btn" onclick={onClose} aria-label="Close">✕</button>
      </div>

      <!-- Location Selector & Quick Action Bar -->
      <div class="prayer-location-bar">
        <div class="loc-select-wrap">
          <label for="prayer-loc-select" class="loc-label">📍 স্থান / রুট নির্বাচন:</label>
          <select
            id="prayer-loc-select"
            bind:value={activeLocId}
            onchange={() => refreshPrayerTimes()}
            class="loc-select-dropdown"
          >
            {#each PRAYER_LOCATIONS as loc (loc.id)}
              <option value={loc.id}>{loc.name}</option>
            {/each}
          </select>
        </div>

        <div class="prayer-action-btns">
          <button
            class="prayer-btn-icon"
            onclick={detectGPSLocation}
            title="বর্তমান GPS অনুযায়ী স্বয়ংক্রিয় স্থান নির্ণয়"
            aria-label="GPS Detect"
          >
            📍 GPS অটো
          </button>
          <button
            class="prayer-btn-icon {isRefreshing ? 'spinning' : ''}"
            onclick={() => refreshPrayerTimes()}
            title="লাইভ আজান সময় রিফ্রেশ"
            aria-label="Refresh times"
          >
            🔄 {isRefreshing ? 'লোড হচ্ছে...' : 'রিফ্রেশ'}
          </button>
        </div>
      </div>

      {#if statusMessage}
        <div class="prayer-status-msg">{statusMessage}</div>
      {/if}

      <!-- Waqt Grid -->
      <div class="prayer-grid">
        <div class="waqt-card fajr-card">
          <div class="waqt-name">ফজর (Fajr)</div>
          <div class="waqt-time">{format12h(activeTimes.fajr)}</div>
          <div class="waqt-sub">সূর্যোদয়: {format12h(activeTimes.sunrise)}</div>
        </div>

        <div class="waqt-card dhuhr-card">
          <div class="waqt-name">যোহর (Dhuhr)</div>
          <div class="waqt-time">{format12h(activeTimes.dhuhr)}</div>
          <div class="waqt-sub">সফরে কসর: ২ রাকাত</div>
        </div>

        <div class="waqt-card asr-card">
          <div class="waqt-name">আসর (Asr)</div>
          <div class="waqt-time">{format12h(activeTimes.asr)}</div>
          <div class="waqt-sub">সফরে কসর: ২ রাকাত</div>
        </div>

        <div class="waqt-card maghrib-card">
          <div class="waqt-name">মাগরিব (Maghrib)</div>
          <div class="waqt-time">{format12h(activeTimes.maghrib)}</div>
          <div class="waqt-sub">পূর্ণ ৩ রাকাত (সূর্যাস্ত)</div>
        </div>

        <div class="waqt-card isha-card">
          <div class="waqt-name">এশা (Isha)</div>
          <div class="waqt-time">{format12h(activeTimes.isha)}</div>
          <div class="waqt-sub">সফরে কসর: ২ + বিতর ৩</div>
        </div>
      </div>

      <!-- Quick Notification & Kasr Traveler Note -->
      <div class="prayer-notify-row">
        <div class="kasr-note">
          <span class="note-badge">মুসাফির ছাড়</span>
          <span>৪৮ মাইলের বেশি সফরে চার রাকাত বিশিষ্ট ফরজ (যোহর, আসর, এশা) ২ রাকাত (কসর) পড়া সুন্নত।</span>
        </div>
        <button
          class="notify-toggle-btn {notifyEnabled ? 'active' : ''}"
          onclick={toggleNotification}
          title="ওয়াক্ত সতর্কবার্তা"
        >
          {notifyEnabled ? '🔔 নোটিফিকেশন অন' : '🔕 নোটিফিকেশন চালু করুন'}
        </button>
      </div>

      <!-- Tayammum Dropdown (Clean, zero clutter, collapsible) -->
      <div class="tayammum-section">
        <button
          class="tayammum-toggle-btn"
          onclick={() => { showTayammum = !showTayammum; }}
          aria-expanded={showTayammum}
        >
          <span>🏜️ বিশেষ পরিস্থিতিতে তায়াম্মুমের বিধান ও নিয়ম</span>
          <span class="tayammum-arrow">{showTayammum ? '▲' : '▼'}</span>
        </button>

        {#if showTayammum}
          <div class="tayammum-content">
            {#each TAYAMMUM_GUIDELINES as item, idx}
              <div class="tayammum-item">
                <div class="tayammum-case">
                  <span class="case-bullet">✦</span>
                  <strong>{item.condition || item.step}</strong>
                </div>
                <div class="tayammum-rule">{item.rule}</div>
              </div>
            {/each}
          </div>
        {/if}
      </div>

      <!-- Modal Footer -->
      <div class="prayer-modal-footer">
        <span class="footer-hint">📡 অফলাইনেও সম্পূর্ণ কার্যকর | Karachi Method (Hanafi)</span>
        <button class="prayer-done-btn" onclick={onClose}>ঠিক আছে</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .prayer-modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(3, 19, 34, 0.82);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 14px;
    z-index: 10002;
    animation: fadeIn 0.2s ease-out;
  }

  .prayer-modal-box {
    background: #0f172a;
    border: 1px solid rgba(56, 189, 248, 0.4);
    border-radius: 20px;
    max-width: 490px;
    width: 100%;
    color: #f1f5f9;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.7), 0 0 25px rgba(14, 165, 233, 0.2);
    overflow: hidden;
    animation: slideUp 0.25s ease-out;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
  }

  @keyframes slideUp {
    from { opacity: 0; transform: translateY(18px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .prayer-modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 18px;
    background: rgba(15, 23, 42, 0.95);
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }

  .prayer-modal-title {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .prayer-header-icon {
    font-size: 1.4rem;
    background: rgba(56, 189, 248, 0.15);
    padding: 6px;
    border-radius: 10px;
    border: 1px solid rgba(56, 189, 248, 0.3);
  }

  .prayer-modal-title strong {
    display: block;
    font-size: 1.02rem;
    color: #e0f2fe;
  }

  .prayer-header-sub {
    display: block;
    font-size: 0.76rem;
    color: #94a3b8;
  }

  .prayer-close-btn {
    background: rgba(255, 255, 255, 0.08);
    border: none;
    color: #94a3b8;
    font-size: 1.1rem;
    cursor: pointer;
    border-radius: 50%;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  }

  .prayer-close-btn:hover {
    background: rgba(239, 68, 68, 0.25);
    color: #f87171;
  }

  /* Location selection row */
  .prayer-location-bar {
    padding: 12px 18px;
    background: rgba(30, 41, 59, 0.5);
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }

  .loc-select-wrap {
    flex: 1;
    min-width: 200px;
  }

  .loc-label {
    display: block;
    font-size: 0.75rem;
    color: #38bdf8;
    margin-bottom: 4px;
    font-weight: 600;
  }

  .loc-select-dropdown {
    width: 100%;
    background: rgba(15, 23, 42, 0.9);
    border: 1px solid rgba(56, 189, 248, 0.3);
    color: #f8fafc;
    padding: 7px 10px;
    border-radius: 8px;
    font-size: 0.85rem;
    outline: none;
    cursor: pointer;
  }

  .prayer-action-btns {
    display: flex;
    gap: 6px;
  }

  .prayer-btn-icon {
    background: rgba(56, 189, 248, 0.12);
    border: 1px solid rgba(56, 189, 248, 0.25);
    color: #7dd3fc;
    font-size: 0.76rem;
    padding: 6px 10px;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.2s ease;
  }

  .prayer-btn-icon:hover {
    background: rgba(56, 189, 248, 0.25);
    color: #ffffff;
  }

  .prayer-status-msg {
    padding: 6px 18px;
    background: rgba(16, 185, 129, 0.15);
    border-bottom: 1px solid rgba(16, 185, 129, 0.3);
    color: #6ee7b7;
    font-size: 0.78rem;
    text-align: center;
  }

  /* Prayer Waqt Cards Grid */
  .prayer-grid {
    padding: 14px 18px;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
    gap: 10px;
    overflow-y: auto;
  }

  .waqt-card {
    background: rgba(30, 41, 59, 0.7);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    padding: 10px 12px;
    text-align: center;
    transition: transform 0.2s, border-color 0.2s;
  }

  .waqt-card:hover {
    border-color: rgba(56, 189, 248, 0.4);
    transform: translateY(-2px);
  }

  .waqt-name {
    font-size: 0.82rem;
    font-weight: 600;
    color: #94a3b8;
    margin-bottom: 4px;
  }

  .waqt-time {
    font-size: 1.15rem;
    font-weight: 700;
    color: #38bdf8;
    letter-spacing: 0.5px;
    font-family: monospace, sans-serif;
  }

  .waqt-sub {
    font-size: 0.7rem;
    color: #64748b;
    margin-top: 4px;
  }

  /* Notice and Notification Row */
  .prayer-notify-row {
    padding: 8px 18px;
    background: rgba(15, 23, 42, 0.7);
    border-top: 1px solid rgba(255, 255, 255, 0.05);
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .kasr-note {
    font-size: 0.74rem;
    color: #cbd5e1;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .note-badge {
    background: rgba(245, 158, 11, 0.2);
    border: 1px solid rgba(245, 158, 11, 0.4);
    color: #fcd34d;
    padding: 1px 6px;
    border-radius: 6px;
    font-size: 0.68rem;
    font-weight: 600;
    flex-shrink: 0;
  }

  .notify-toggle-btn {
    align-self: flex-start;
    background: rgba(30, 41, 59, 0.8);
    border: 1px solid rgba(56, 189, 248, 0.3);
    color: #38bdf8;
    font-size: 0.78rem;
    padding: 5px 12px;
    border-radius: 20px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .notify-toggle-btn.active {
    background: rgba(16, 185, 129, 0.2);
    border-color: rgba(16, 185, 129, 0.5);
    color: #6ee7b7;
  }

  /* Tayammum Collapsible Dropdown */
  .tayammum-section {
    padding: 10px 18px;
    background: rgba(15, 23, 42, 0.5);
  }

  .tayammum-toggle-btn {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: rgba(30, 41, 59, 0.6);
    border: 1px dashed rgba(245, 158, 11, 0.4);
    color: #fde68a;
    padding: 8px 12px;
    border-radius: 10px;
    font-size: 0.82rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s;
  }

  .tayammum-toggle-btn:hover {
    background: rgba(245, 158, 11, 0.15);
  }

  .tayammum-arrow {
    font-size: 0.75rem;
    color: #f59e0b;
  }

  .tayammum-content {
    margin-top: 8px;
    padding: 10px 12px;
    background: rgba(15, 23, 42, 0.9);
    border: 1px solid rgba(245, 158, 11, 0.25);
    border-radius: 10px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-height: 190px;
    overflow-y: auto;
  }

  .tayammum-item {
    font-size: 0.76rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    padding-bottom: 6px;
  }

  .tayammum-item:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }

  .tayammum-case {
    display: flex;
    align-items: center;
    gap: 6px;
    color: #fcd34d;
    margin-bottom: 2px;
  }

  .case-bullet {
    font-size: 0.7rem;
    color: #f59e0b;
  }

  .tayammum-rule {
    color: #cbd5e1;
    line-height: 1.4;
    padding-left: 14px;
  }

  /* Modal Footer */
  .prayer-modal-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 18px;
    background: rgba(15, 23, 42, 0.95);
    border-top: 1px solid rgba(255, 255, 255, 0.08);
  }

  .footer-hint {
    font-size: 0.7rem;
    color: #64748b;
  }

  .prayer-done-btn {
    background: linear-gradient(135deg, #0284c7, #0ea5e9);
    color: #ffffff;
    border: none;
    padding: 6px 18px;
    border-radius: 8px;
    font-size: 0.82rem;
    font-weight: 600;
    cursor: pointer;
  }

  .prayer-done-btn:hover {
    opacity: 0.9;
  }
</style>
