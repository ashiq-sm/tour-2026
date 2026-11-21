<script>
  import { onMount, onDestroy } from 'svelte';
  import { openAndroidAlarm, isAndroidDevice } from '../utils/androidAlarm';

  let { reminders = [] } = $props();

  let notifPermission = $state('default');
  let enabledMap = $state({});
  let firedIds = new Set();
  let nowTs = $state(Date.now());
  let inAppBanner = $state(null);
  let tickTimer = null;
  let hasAndroid = $state(false);

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
    hasAndroid = isAndroidDevice();
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
      alert('এই ব্রাউজারে নোটিফিকেশন সমর্থিত নয়; নিচের 📅 Phone Alarms (.ics) অথবা ⏰ Android Alarm ব্যবহার করুন।');
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
        body: upcoming ? upcoming.body : 'প্রথমে "Enable Notifications" চাপুন অথবা ফোনের ক্যালেন্ডারে সেভ করুন।'
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
  }

  function handleSetNextAlarm() {
    if (upcoming) {
      openAndroidAlarm(upcoming);
    } else if (reminders.length > 0) {
      openAndroidAlarm(reminders[0]);
    }
  }
</script>

<div class="card reminders-card">
  <div class="card-title">🔔 রিমাইন্ডার ও স্মার্ট অ্যালার্ট</div>

  {#if upcoming}
    <div class="next-up-banner">
      <div class="next-up-header">
        <div class="next-up-label">⏱️ পরবর্তী রিমাইন্ডার ({upcoming.label})</div>
        <button class="btn-quick-alarm" onclick={() => openAndroidAlarm(upcoming)} title="ফোনের Clock অ্যাপে অ্যালার্ম সেট করুন">
          ⏰ Android Alarm
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

    <button class="rem-btn rem-btn-alarm" onclick={handleSetNextAlarm} title="Android ডিভাইসে ঘড়ির Clock অ্যাপ খুলবে">
      ⏰ Android ঘড়িতে অ্যালার্ম
    </button>

    <button class="rem-btn rem-btn-cal" onclick={downloadCalendarAlarms}>
      📅 ক্যালেন্ডার অ্যালার্ম (.ics)
    </button>
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
            <button
              class="rem-mini-alarm-btn"
              onclick={() => openAndroidAlarm(r)}
              title="এই সময়ের জন্য Android Alarm সেট করুন"
              aria-label="Set Android Alarm"
            >
              ⏰ Alarm
            </button>
          </div>
          <div class="rem-title">{r.title}</div>
          <div class="rem-body">{r.body}</div>
        </div>
      </div>
    {/each}
  </div>
</div>

{#if inAppBanner}
  <div class="inapp-notif-banner">
    <strong>{inAppBanner.title}</strong>
    <p>{inAppBanner.body}</p>
  </div>
{/if}

<style>
  .reminders-card {
    border-color: rgba(56, 189, 248, 0.35);
  }

  .next-up-banner {
    background: linear-gradient(135deg, rgba(14, 165, 233, 0.22), rgba(3, 105, 161, 0.12));
    border: 1px solid rgba(56, 189, 248, 0.4);
    border-radius: 0.75rem;
    padding: 0.75rem 0.9rem;
    margin-bottom: 0.9rem;
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
    color: #38bdf8;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .btn-quick-alarm {
    background: rgba(245, 158, 11, 0.2);
    border: 1px solid rgba(245, 158, 11, 0.5);
    color: #fbbf24;
    font-size: 0.72rem;
    font-weight: 700;
    padding: 0.2rem 0.55rem;
    border-radius: 0.4rem;
    cursor: pointer;
    transition: all 0.15s ease;
    white-space: nowrap;
  }

  .btn-quick-alarm:hover {
    background: rgba(245, 158, 11, 0.35);
    transform: scale(1.02);
  }

  .next-up-title {
    font-size: 0.92rem;
    font-weight: 700;
    color: #f1f5f9;
    margin-bottom: 0.2rem;
  }

  .next-up-countdown {
    font-size: 0.8rem;
    color: #94a3b8;
  }

  .next-up-countdown span {
    color: #f59e0b;
    font-weight: 700;
    font-family: monospace;
    font-size: 0.92rem;
  }

  .rem-actions-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
    gap: 0.45rem;
    margin-bottom: 0.85rem;
  }

  .rem-btn {
    padding: 0.55rem 0.65rem;
    border-radius: 0.55rem;
    font-size: 0.78rem;
    font-weight: 600;
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
  }

  .rem-btn-active {
    background: rgba(16, 185, 129, 0.2);
    color: #34d399;
    border: 1px solid rgba(16, 185, 129, 0.4);
  }

  .rem-btn-alarm {
    background: rgba(245, 158, 11, 0.16);
    color: #fbbf24;
    border: 1px solid rgba(245, 158, 11, 0.45);
  }

  .rem-btn-alarm:hover {
    background: rgba(245, 158, 11, 0.28);
  }

  .rem-btn-cal {
    background: rgba(255, 255, 255, 0.08);
    color: #e2e8f0;
    border: 1px solid rgba(255, 255, 255, 0.15);
  }

  .rem-btn-cal:hover {
    background: rgba(255, 255, 255, 0.14);
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
    background: rgba(255, 255, 255, 0.035);
    border: 1px solid rgba(255, 255, 255, 0.08);
    padding: 0.55rem 0.7rem;
    border-radius: 0.55rem;
    transition: background 0.15s;
  }

  .rem-item:hover {
    background: rgba(255, 255, 255, 0.06);
  }

  .rem-checkbox-label input {
    margin-top: 0.25rem;
    accent-color: #38bdf8;
    cursor: pointer;
    width: 16px;
    height: 16px;
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
    font-size: 0.72rem;
    color: #38bdf8;
    font-weight: 700;
  }

  .rem-mini-alarm-btn {
    background: rgba(245, 158, 11, 0.15);
    border: 1px solid rgba(245, 158, 11, 0.4);
    color: #fbbf24;
    font-size: 0.68rem;
    font-weight: 600;
    padding: 0.15rem 0.45rem;
    border-radius: 0.35rem;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .rem-mini-alarm-btn:hover {
    background: rgba(245, 158, 11, 0.3);
    transform: scale(1.04);
  }

  .rem-title {
    font-size: 0.85rem;
    font-weight: 600;
    color: #f1f5f9;
    line-height: 1.3;
  }

  .rem-body {
    font-size: 0.75rem;
    color: #94a3b8;
    margin-top: 0.15rem;
    line-height: 1.35;
  }

  .rem-past {
    opacity: 0.5;
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
