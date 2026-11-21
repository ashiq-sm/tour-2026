<script>
  let {
    isOpen = false,
    viewerCount = 24,
    onClose = () => {}
  } = $props();

  // Curated distribution representing SUST GEB 18 tour members & visitors
  let spotBreakdown = $derived([
    { name: 'সিলেট (Sylhet 출발)', count: Math.max(2, Math.round(viewerCount * 0.42)), badge: 'যাত্রার প্রস্তুতি' },
    { name: 'চট্টগ্রাম / ট্রেন পথ', count: Math.max(1, Math.round(viewerCount * 0.28)), badge: 'ট্রাভেল ট্র্যাকিং' },
    { name: 'মিরিঞ্জা ভ্যালি (লামা)', count: Math.max(1, Math.round(viewerCount * 0.18)), badge: 'পাহাড় ও ক্লাউড' },
    { name: 'কক্সবাজার ও সেন্টমার্টিন', count: Math.max(1, Math.round(viewerCount * 0.12)), badge: 'জাহাজ ও প্রবাল' }
  ]);

  let copied = $state(false);

  function copyViewerLink() {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      copied = true;
      setTimeout(() => { copied = false; }, 2200);
    }
  }
</script>

{#if isOpen}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="viewers-modal-backdrop" onclick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
    <div class="viewers-modal" role="dialog" aria-label="লাইভ ভিউয়ার্স বিস্তারিত">
      <div class="viewers-modal-header">
        <div class="viewers-modal-title">
          <span class="live-pulse-badge"></span>
          <span>লাইভ একটিভ অডিয়েন্স</span>
        </div>
        <button class="viewers-modal-close" onclick={onClose} aria-label="Close">✕</button>
      </div>

      <div class="viewers-modal-body">
        <div class="viewers-stat-card">
          <div class="stat-num">{viewerCount}</div>
          <div class="stat-label">জন বর্তমানে অ্যাপটি দেখছেন</div>
          <div class="stat-sub">SUST GEB ব্যাচ ১৮ ও শুভানুধ্যায়ী ট্যুর ট্র্যাকার</div>
        </div>

        <div class="viewers-section-title">📍 অবস্থান ও অ্যাক্টিভিটি অনুমান:</div>
        <div class="viewers-list">
          {#each spotBreakdown as item}
            <div class="viewer-row">
              <div class="viewer-row-info">
                <span class="viewer-spot-name">{item.name}</span>
                <span class="viewer-activity-badge">{item.badge}</span>
              </div>
              <div class="viewer-count-pill">{item.count} জন</div>
            </div>
          {/each}
        </div>

        <div class="viewers-privacy-note">
          🔒 <b>গোপনীয়তা সুরক্ষা:</b> ব্যবহারকারীদের ব্যক্তিগত তথ্য বা আইপি ট্র্যাক করা হয় না; শুধুমাত্র সেশন ও রুট ট্র্যাকিং অ্যাক্টিভিটি প্রদর্শিত হচ্ছে।
        </div>
      </div>

      <div class="viewers-modal-footer">
        <button class="btn-share-viewer-link" onclick={copyViewerLink}>
          {copied ? '✓ লিংক কপি হয়েছে!' : '🔗 বন্ধুদের সাথে লিংক শেয়ার করুন'}
        </button>
        <button class="btn-close-viewer" onclick={onClose}>
          বন্ধ করুন
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .viewers-modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(3, 19, 34, 0.82);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
    z-index: 10006;
    animation: fadeIn 0.2s ease-out;
  }

  .viewers-modal {
    background: #0f172a;
    border: 1px solid rgba(52, 211, 153, 0.45);
    border-radius: 20px;
    max-width: 440px;
    width: 100%;
    color: #f1f5f9;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.7), 0 0 25px rgba(16, 185, 129, 0.25);
    overflow: hidden;
    animation: scaleUp 0.25s ease-out;
  }

  @keyframes scaleUp {
    from { opacity: 0; transform: scale(0.92); }
    to { opacity: 1; transform: scale(1); }
  }

  .viewers-modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 18px;
    background: rgba(16, 185, 129, 0.08);
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }

  .viewers-modal-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.98rem;
    font-weight: 800;
    color: #34d399;
  }

  .live-pulse-badge {
    width: 8px;
    height: 8px;
    background: #10b981;
    border-radius: 50%;
    box-shadow: 0 0 10px #34d399;
    animation: livePulse 1.6s infinite ease-in-out;
  }

  .viewers-modal-close {
    background: rgba(255, 255, 255, 0.08);
    border: none;
    color: #94a3b8;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    cursor: pointer;
    font-size: 0.95rem;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.15s, color 0.15s;
  }

  .viewers-modal-close:hover {
    background: rgba(255, 255, 255, 0.18);
    color: #ffffff;
  }

  .viewers-modal-body {
    padding: 16px 18px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .viewers-stat-card {
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(6, 78, 59, 0.35));
    border: 1px solid rgba(52, 211, 153, 0.35);
    border-radius: 14px;
    padding: 14px;
    text-align: center;
  }

  .stat-num {
    font-size: 2.2rem;
    font-weight: 900;
    color: #34d399;
    line-height: 1;
    font-family: monospace;
    letter-spacing: -0.04em;
  }

  .stat-label {
    font-size: 0.92rem;
    font-weight: 700;
    color: #f1f5f9;
    margin-top: 4px;
  }

  .stat-sub {
    font-size: 0.72rem;
    color: #94a3b8;
    margin-top: 2px;
  }

  .viewers-section-title {
    font-size: 0.82rem;
    font-weight: 700;
    color: #bae6fd;
    margin-top: 4px;
  }

  .viewers-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .viewer-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.06);
    padding: 8px 12px;
    border-radius: 10px;
  }

  .viewer-row-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .viewer-spot-name {
    font-size: 0.82rem;
    font-weight: 700;
    color: #f8fafc;
  }

  .viewer-activity-badge {
    font-size: 0.68rem;
    color: #6ee7b7;
  }

  .viewer-count-pill {
    background: rgba(16, 185, 129, 0.18);
    border: 1px solid rgba(52, 211, 153, 0.3);
    color: #34d399;
    font-size: 0.75rem;
    font-weight: 800;
    padding: 3px 8px;
    border-radius: 12px;
  }

  .viewers-privacy-note {
    font-size: 0.72rem;
    color: #64748b;
    background: rgba(0, 0, 0, 0.2);
    padding: 8px 10px;
    border-radius: 8px;
    line-height: 1.4;
  }

  .viewers-modal-footer {
    padding: 12px 18px;
    background: rgba(255, 255, 255, 0.02);
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  .btn-share-viewer-link {
    background: rgba(16, 185, 129, 0.2);
    border: 1px solid rgba(52, 211, 153, 0.4);
    color: #34d399;
    font-size: 0.78rem;
    font-weight: 700;
    padding: 7px 12px;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .btn-share-viewer-link:hover {
    background: rgba(16, 185, 129, 0.35);
    color: #ffffff;
  }

  .btn-close-viewer {
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.15);
    color: #cbd5e1;
    font-size: 0.78rem;
    font-weight: 700;
    padding: 7px 12px;
    border-radius: 8px;
    cursor: pointer;
  }

  .btn-close-viewer:hover {
    background: rgba(255, 255, 255, 0.16);
    color: #ffffff;
  }
</style>
