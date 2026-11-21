/**
 * Utility to trigger native Android Clock Alarms via Android Intents,
 * or fallback to calendar / alarm instructions.
 */
export function isAndroidDevice() {
  if (typeof navigator === 'undefined') return false;
  return /Android/i.test(navigator.userAgent || '');
}

export function buildAndroidAlarmIntent(r) {
  try {
    const d = new Date(r.iso);
    const hour = d.getHours();
    const minutes = d.getMinutes();
    const title = (r.title || 'ট্যুর রিমাইন্ডার').replace(/[#&;=?]/g, ' ').substring(0, 50);

    // Standard Android Alarm Clock intent
    // action: android.intent.action.SET_ALARM
    // extra: android.intent.extra.HOUR (int)
    // extra: android.intent.extra.MINUTES (int)
    // extra: android.intent.extra.MESSAGE (string)
    // extra: android.intent.extra.SKIP_UI (boolean)
    const intentUrl = `intent:#Intent;action=android.intent.action.SET_ALARM;i.android.intent.extra.HOUR=${hour};i.android.intent.extra.MINUTES=${minutes};S.android.intent.extra.MESSAGE=${encodeURIComponent(title)};b.android.intent.extra.SKIP_UI=false;end`;
    return {
      hour,
      minutes,
      title,
      intentUrl,
      formattedTime: `${String(hour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
    };
  } catch (e) {
    return null;
  }
}

export function openAndroidAlarm(r) {
  const data = buildAndroidAlarmIntent(r);
  if (!data) return;

  if (isAndroidDevice()) {
    // Attempt launching Android intent directly to open Clock app SET_ALARM
    window.location.href = data.intentUrl;
  } else {
    // On non-Android (Desktop/iOS), inform user
    alert(`⏰ ফোনের অ্যালার্ম সময়: ${data.formattedTime}\nবিষয়: ${data.title}\n\n(Android ডিভাইসে চাপলে সরাসরি ফোনের Clock অ্যাপে অ্যালার্ম সেট হবে। তাছাড়া নিচের '📅 ক্যালেন্ডার অ্যালার্ম (.ics)' দিয়ে সরাসরি ক্যালেন্ডারে যোগ করতে পারেন)`);
  }
}
