<script>
  import { onMount, onDestroy } from 'svelte';

  let { reminders = [] } = $props();

  let notifPermission = $state('default');
  let enabledMap = $state({});
  let firedIds = new Set();
  let nowTs = $state(Date.now());
  let inAppBanner = $state(null);
  let tickTimer = null;

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
      alert('এই ব্রাউজারে নোটিফিকেশন সমর্থিত নয়; নিচের 📅 Phone Alarms (.ics) বাটনটি ব্যবহার করুন।');
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
</script>

<div class="card reminders-card">
  <div class="card-title">🔔 রিমাইন্ডার ও স্মার্ট অ্যালার্ট</div>

  {#if upcoming}
    <div class="next-up-banner">
      <div class="next-up-label">⏱️ পরবর্তী রিমাইন্ডার ({upcoming.label})</div>
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
      📅 ফোনের অ্যালার্ম (.ics)
    </button>
  </div>

  <div class="rem-list">
    {#each reminders as r (r.id)}
      {@const isPast = new Date(r.iso).getTime() + 600000 < nowTs}
      <label class="rem-row {isPast ? 'rem-past' : ''}">
        <input
          type="checkbox"
          checked={isRemEnabled(r.id)}
          onchange={() => toggleReminder(r.id)}
        />
        <div class="rem-info">
          <div class="rem-time">{r.label}</div>
          <div class="rem-title">{r.title}</div>
          <div class="rem-body">{r.body}</div>
        </div>
      </label>
    {/each}
  </div>
</div>

{#if inAppBanner}
  <div class="inapp-notif-banner">
    <strong>{inAppBanner.title}</strong>
    <p>{inAppBanner.body}</p>
  </div>
{/if}
