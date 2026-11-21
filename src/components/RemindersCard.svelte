<script>
  import { onMount, onDestroy } from 'svelte';

  let { reminders = [] } = $props();

  let notifPermission = $state('default');
  let enabledMap = $state({});
  let firedIds = new Set();
  let nowTs = $state(Date.now());
  let inAppBanner = $state(null);
  let tickTimer = null;
  let showCalTip = $state(false);

  let upcoming = $derived.by(() => {
    return reminders
      .map((r) => ({ ...r, ts: new Date(r.iso).getTime() }))
      .filter((r) => r.ts > nowTs)
      .sort((a, b) => a.ts - b.ts)[0] || null;
  });

  function formatCountdown(targetTs) {
    const diff = Math.max(0, targetTs - nowTs);
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    if (d > 0) return `${d} দিন ${h} ঘণ্টা ${m} মি.`;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  onMount(() => {
    if ('Notification' in window) {
      notifPermission = Notification.permission;
    }
    try {
      enabledMap = JSON.parse(localStorage.getItem('tour_rem_enabled_v1') || '{}');
      const savedFired = JSON.parse(localStorage.getItem('tour_rem_fired_v1') || '[]');
      firedIds = new Set(savedFired);
    } catch {
      enabledMap = {};
    }

    tickTimer = setInterval(() => {
      nowTs = Date.now();
      checkDueReminders();
    }, 1000);
  });

  onDestroy(() => {
    if (tickTimer) clearInterval(tickTimer);
  });

  function isRemEnabled(id) {
    return id in enabledMap ? enabledMap[id] : true;
  }

  function toggleReminder(id) {
    const next = !isRemEnabled(id);
    enabledMap = { ...enabledMap, [id]: next };
    localStorage.setItem('tour_rem_enabled_v1', JSON.stringify(enabledMap));
  }

  async function requestNotifications() {
    if (!('Notification' in window)) {
      alert('এই ব্রাউজারে নোটিফিকেশন সমর্থিত নয়; নিচের 📅 ক্যালেন্ডার অ্যালার্ম (.ics) ফাইল ডাউনলোড করুন।');
      return;
    }
    const res = await Notification.requestPermission();
    notifPermission = res;
    if (res === 'granted') {
      fireNotification(
        '✅ ট্যুর রিমাইন্ডার সক্রিয় হয়েছে!',
        'যাত্রা, জাহাজ ও চেক-আউটের আগে সময়মতো নোটিফিকেশন পাবেন।'
      );
    }
  }

  function testNotification() {
    if (notifPermission === 'granted') {
      fireNotification(
        upcoming ? upcoming.title : '🔔 Study Tour 2026 রিমাইন্ডার',
        upcoming ? upcoming.body : 'সবগুলো প্রস্তুতি ও রিমাইন্ডার ঠিকমতো কাজ করছে!'
      );
    } else {
      inAppBanner = {
        title: upcoming ? upcoming.title : '🔔 রিমাইন্ডার প্রিভিউ',
        body: upcoming ? upcoming.body : 'প্রথমে "নোটিফিকেশন চালু করুন" চাপুন অথবা ক্যালেন্ডারে সেভ করুন।'
      };
      setTimeout(() => { inAppBanner = null; }, 5000);
    }
  }

  async function fireNotification(title, body) {
    inAppBanner = { title, body };
    setTimeout(() => { inAppBanner = null; }, 6000);
    try {
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.ready;
        if (reg && reg.showNotification) {
          await reg.showNotification(title, {
            body,
            icon: '/tour-2026/icon-192.png',
            badge: '/tour-2026/icon-192.png',
            vibrate: [200, 100, 200]
          });
          return;
        }
      }
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body, icon: '/tour-2026/icon-192.png' });
      }
    } catch {}
  }

  function checkDueReminders() {
    const now = Date.now();
    for (const r of reminders) {
      if (!isRemEnabled(r.id) || firedIds.has(r.id)) continue;
      const target = new Date(r.iso).getTime();
      // Fire if within [target, target + 10 mins]
      if (now >= target && now <= target + 600000) {
        firedIds.add(r.id);
        localStorage.setItem('tour_rem_fired_v1', JSON.stringify([...firedIds]));
        fireNotification(r.title, r.body);
      }
    }
  }

  function toIcsUtc(iso) {
    const d = new Date(iso);
    return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  }

  function downloadCalendarAlarms() {
    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//StudyTour2026//SUST GEB//EN',
      'CALSCALE:GREGORIAN'
    ];
    for (const r of reminders) {
      if (!isRemEnabled(r.id)) continue;
      const start = toIcsUtc(r.iso);
      const end = toIcsUtc(new Date(new Date(r.iso).getTime() + 1800000).toISOString());
      lines.push(
        'BEGIN:VEVENT',
        `UID:${r.id}@studytour2026`,
        `DTSTAMP:${toIcsUtc(new Date().toISOString())}`,
        `DTSTART:${start}`,
        `DTEND:${end}`,
        `SUMMARY:${r.title.replace(/,/g, '\\,')}`,
        `DESCRIPTION:${r.body.replace(/,/g, '\\,')}`,
        'BEGIN:VALARM',
        'TRIGGER:-PT0M',
        'ACTION:DISPLAY',
        `DESCRIPTION:${r.title}`,
        'END:VALARM',
        'END:VEVENT'
      );
    }
    lines.push('END:VCALENDAR');
    const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'study_tour_2026_alarms.ics';
    a.click();
    URL.revokeObjectURL(a.href);

    // Show friendly popup tips
    showCalTip = true;
  }
</script>

<div class="reminders-inner">
  {#if upcoming}
    <div class="next-up-banner">
      <div class="next-up-header">
        <div class="next-up-label">⏱️ পরবর্তী রিমাইন্ডার ({upcoming.label})</div>
        <button class="btn-quick-sync" onclick={downloadCalendarAlarms} title="ক্যালেন্ডারে সিঙ্ক করুন">
          📅 সিঙ্ক (.ics)
        </button>
      </div>
      <div class="next-up-title">{upcoming.title}</div>
      <div class="next-up-countdown">বাকি: <span>{formatCountdown(upcoming.ts)}</span></div>
    </div>
  {/if}

  <div class="rem-actions-row">
    {#if notifPermission !== 'granted'}
      <button class="rem-btn rem-btn-primary" onclick={requestNotifications}>
        🔔 নোটিফিকেশন চালু করুন
      </button>
    {:else}
      <button class="rem-btn rem-btn-active" onclick={testNotification}>
        ✅ নোটিফিকেশন সক্রিয় (Test)
      </button>
    {/if}

    <button class="rem-btn rem-btn-cal" onclick={downloadCalendarAlarms}>
      📅 ক্যালেন্ডার অ্যালার্ম ডাউনলোড (.ics)
    </button>
  </div>

  <!-- Helpful short tips for .ics calendar sync on phones -->
  <div class="ics-tips-box">
    <div class="ics-tips-header">
      <span class="ics-tips-badge">💡 ক্যালেন্ডার টিপস</span>
      <span>Android ও iPhone-এ অ্যালার্ম সিঙ্ক করার নিয়ম:</span>
    </div>
    <ol class="ics-tips-list">
      <li>বাটন চাপলে <b>study_tour_2026_alarms.ics</b> ফাইলটি ডাউনলোড হবে।</li>
      <li>ডাউনলোড শেষ হলে নোটিফিকেশন বা ফাইল ম্যানেজার থেকে ফাইলে <b>ট্যাপ (Open)</b> করুন।</li>
      <li>আপনার <b>Google Calendar</b> বা ফোনের <b>Calendar</b> অ্যাপে <b>"Add All" / "আমদানি করুন"</b> দিলেই ৮টি গুরুত্বপূর্ণ অ্যালার্ম স্বয়ংক্রিয়ভাবে ফোনে সেট হয়ে যাবে!</li>
    </ol>
  </div>

  <div class="rem-list">
    {#each reminders as r (r.id)}
      {@const isPast = new Date(r.iso).getTime() + 600000 < nowTs}
      <div class="rem-item {isPast ? 'rem-past' : ''}">
        <label class="rem-checkbox-label">
          <input
            type="checkbox"
            checked={isRemEnabled(r.id)}
            onchange={() => toggleReminder(r.id)}
          />
        </label>
        <div class="rem-info">
          <div class="rem-time-row">
            <span class="rem-time">{r.label}</span>
          </div>
          <div class="rem-title">{r.title}</div>
          <div class="rem-body">{r.body}</div>
        </div>
      </div>
    {/each}
  </div>
</div>

{#if showCalTip}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="info-modal-backdrop" onclick={(e) => { if (e.target === e.currentTarget) showCalTip = false; }}>
    <div class="info-modal-box">
      <div class="info-modal-header">
        <strong style="color: #0369a1;">📅 ক্যালেন্ডার (.ics) অ্যালার্ম সেট হয়েছে!</strong>
        <button class="info-modal-close" onclick={() => { showCalTip = false; }} aria-label="Close">✕</button>
      </div>
      <div class="info-modal-body" style="font-size: 0.88rem; line-height: 1.6;">
        <p><b>study_tour_2026_alarms.ics</b> ফাইলটি আপনার ফোনে ডাউনলোড হয়েছে।</p>
        <div style="background: rgba(2, 132, 199, 0.08); padding: 10px 12px; border-radius: 10px; margin: 10px 0; border: 1px solid rgba(2, 132, 199, 0.25);">
          📱 <b>কীভাবে ফোনের ক্যালেন্ডারে যুক্ত করবেন:</b>
          <ol style="padding-left: 20px; margin-top: 6px;">
            <li>ফোনের নোটিফিকেশন বার নামিয়ে ডাউনলোড ফাইলে ক্লিক করুন (বা Downloads ফোল্ডার থেকে খুলুন)।</li>
            <li><b>Google Calendar</b> অথবা ফোনের <b>Calendar</b> সিলেক্ট করে <b>"Add all" (সব যোগ করুন)</b> চাপুন।</li>
          </ol>
        </div>
        <p style="color: #047857; font-weight: 700;">✅ ট্রেন, বাস, জাহাজ ও সূর্যাস্তের নির্দিষ্ট সময়ে ফোন আপনাআপনি অ্যালার্ম বাজিয়ে সতর্ক করবে!</p>
      </div>
      <div class="info-modal-footer">
        <button class="btn-modal-ok" onclick={() => { showCalTip = false; }}>
          বুঝেছি ✓
        </button>
      </div>
    </div>
  </div>
{/if}

{#if inAppBanner}
  <div class="inapp-notif-banner">
    <strong>{inAppBanner.title}</strong>
    <p>{inAppBanner.body}</p>
  </div>
{/if}

<style>
  .reminders-inner {
    padding-top: 4px;
  }

  .next-up-banner {
    background: linear-gradient(135deg, rgba(224, 242, 254, 0.96), rgba(240, 249, 255, 0.94));
    border: 1px solid rgba(2, 132, 199, 0.35);
    border-radius: 0.75rem;
    padding: 0.75rem 0.9rem;
    margin-bottom: 0.9rem;
    box-shadow: 0 4px 14px rgba(2, 132, 199, 0.12);
  }

  .next-up-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    margin-bottom: 0.25rem;
  }

  .next-up-label {
    font-size: 0.76rem;
    color: #0369a1;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .btn-quick-sync {
    background: #0284c7;
    border: 1px solid #0369a1;
    color: #ffffff;
    font-size: 0.74rem;
    font-weight: 700;
    padding: 0.22rem 0.6rem;
    border-radius: 0.45rem;
    cursor: pointer;
    transition: all 0.15s ease;
    white-space: nowrap;
    box-shadow: 0 2px 6px rgba(2, 132, 199, 0.3);
  }

  .btn-quick-sync:hover {
    background: #0369a1;
    transform: scale(1.02);
  }

  .next-up-title {
    font-size: 0.94rem;
    font-weight: 800;
    color: #0f172a;
    margin-bottom: 0.2rem;
  }

  .next-up-countdown {
    font-size: 0.8rem;
    color: #334155;
    font-weight: 600;
  }

  .next-up-countdown span {
    color: #b45309;
    font-weight: 800;
    font-family: monospace;
    font-size: 0.95rem;
  }

  .rem-actions-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 0.5rem;
    margin-bottom: 0.75rem;
  }

  .rem-btn {
    padding: 0.6rem 0.75rem;
    border-radius: 0.6rem;
    font-size: 0.8rem;
    font-weight: 700;
    cursor: pointer;
    border: none;
    text-align: center;
    transition: transform 0.12s ease, background 0.15s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.3rem;
  }

  .rem-btn:hover {
    transform: translateY(-1px);
  }

  .rem-btn-primary {
    background: #0284c7;
    color: #ffffff;
    box-shadow: 0 2px 8px rgba(2, 132, 199, 0.35);
  }

  .rem-btn-active {
    background: #dcfce7;
    color: #15803d;
    border: 1px solid rgba(22, 163, 74, 0.4);
    box-shadow: 0 2px 6px rgba(22, 163, 74, 0.15);
  }

  .rem-btn-cal {
    background: #0369a1;
    color: #ffffff;
    border: 1px solid rgba(56, 189, 248, 0.4);
    box-shadow: 0 2px 8px rgba(3, 105, 161, 0.3);
  }

  .rem-btn-cal:hover {
    background: #0284c7;
  }

  .ics-tips-box {
    background: rgba(2, 132, 199, 0.08);
    border: 1px solid rgba(2, 132, 199, 0.22);
    border-radius: 0.65rem;
    padding: 0.65rem 0.8rem;
    margin-bottom: 0.85rem;
  }

  .ics-tips-header {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.78rem;
    font-weight: 700;
    color: #0369a1;
    margin-bottom: 0.3rem;
  }

  .ics-tips-badge {
    background: #0284c7;
    color: #ffffff;
    font-size: 0.68rem;
    padding: 1px 6px;
    border-radius: 8px;
    font-weight: 700;
  }

  .ics-tips-list {
    padding-left: 18px;
    font-size: 0.76rem;
    color: #334155;
    line-height: 1.45;
  }

  .ics-tips-list li {
    margin-bottom: 2px;
  }

  .rem-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .rem-item {
    display: flex;
    align-items: flex-start;
    gap: 0.65rem;
    background: rgba(255, 255, 255, 0.88);
    border: 1px solid rgba(0, 0, 0, 0.08);
    padding: 0.6rem 0.75rem;
    border-radius: 0.65rem;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
    transition: background 0.15s;
  }

  .rem-item:hover {
    background: #ffffff;
  }

  .rem-checkbox-label input {
    margin-top: 0.25rem;
    accent-color: #0284c7;
    cursor: pointer;
    width: 17px;
    height: 17px;
  }

  .rem-info {
    flex: 1;
    min-width: 0;
  }

  .rem-time-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.4rem;
    margin-bottom: 0.15rem;
  }

  .rem-time {
    font-size: 0.74rem;
    color: #0369a1;
    font-weight: 800;
  }

  .rem-title {
    font-size: 0.88rem;
    font-weight: 700;
    color: #0f172a;
    line-height: 1.32;
  }

  .rem-body {
    font-size: 0.78rem;
    color: #334155;
    margin-top: 0.15rem;
    line-height: 1.38;
  }

  .rem-past {
    opacity: 0.6;
    background: rgba(241, 245, 249, 0.75);
  }

  .btn-modal-ok {
    background: #0284c7;
    color: white;
    border: none;
    padding: 6px 16px;
    border-radius: 8px;
    font-weight: 700;
    cursor: pointer;
  }

  .inapp-notif-banner {
    position: fixed;
    top: 1rem;
    left: 50%;
    transform: translateX(-50%);
    width: calc(100% - 1.5rem);
    max-width: 440px;
    background: rgba(15, 23, 42, 0.95);
    border: 1px solid #38bdf8;
    border-radius: 0.75rem;
    padding: 0.75rem 1rem;
    color: #f1f5f9;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
    z-index: 10000;
    animation: slideDown 0.3s ease-out;
  }

  .inapp-notif-banner strong {
    display: block;
    color: #38bdf8;
    font-size: 0.88rem;
    margin-bottom: 0.2rem;
  }

  .inapp-notif-banner p {
    font-size: 0.78rem;
    color: #cbd5e1;
    margin: 0;
  }

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translate(-50%, -20px);
    }
    to {
      opacity: 1;
      transform: translate(-50%, 0);
    }
  }
</style>
