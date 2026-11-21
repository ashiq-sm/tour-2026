<script>
  import { onMount } from 'svelte';

  let deferredPrompt = $state(null);
  let isStandalone = $state(false);
  let showBanner = $state(false);
  let isIOS = $state(false);
  let installStatus = $state(''); // '', 'installing', 'installed'

  onMount(() => {
    // Check if running in standalone mode (already installed PWA)
    const checkStandalone = () => {
      return (
        window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true ||
        document.referrer.includes('android-app://')
      );
    };

    isStandalone = checkStandalone();
    isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

    // Listen to beforeinstallprompt event (Chromium on Android / Desktop)
    const handleBeforeInstallPrompt = (e) => {
      // Prevent browser default mini-infobar
      e.preventDefault();
      deferredPrompt = e;
      // User requested: show popup on every refresh if not installed / uninstalled
      if (!isStandalone) {
        showBanner = true;
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    window.addEventListener('appinstalled', () => {
      deferredPrompt = null;
      isStandalone = true;
      showBanner = false;
      installStatus = 'installed';
    });

    // If on Android Chrome and beforeinstallprompt hasn't fired yet or after 2s,
    // if still not standalone, show the prompt so user has 1-tap guidance
    const timer = setTimeout(() => {
      if (!isStandalone) {
        showBanner = true;
      }
    }, 1500);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      clearTimeout(timer);
    };
  });

  async function triggerInstall() {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        showBanner = false;
      }
      deferredPrompt = null;
    } else if (isIOS) {
      alert('📲 iPhone/iPad এ ইনস্টল করতে:\nনিচের Safari Share বাটনে ট্যাপ করে "Add to Home Screen" সিলেক্ট করুন।');
    } else {
      // Direct Chrome Android manual fallback
      alert('📱 অ্যাপটি ইনস্টল করতে:\nব্রাউজারের ৩-ডট (⋮) মেনু চাপুন এবং "Install app" বা "Add to Home screen" চাপুন।');
    }
  }

  function dismissBanner() {
    showBanner = false;
  }
</script>

{#if showBanner && !isStandalone}
  <div class="install-bar" role="banner" aria-label="Install App Prompt">
    <div class="install-bar-content">
      <img src="/tour-2026/icon-192.png" alt="App Icon" class="install-icon" />
      <div class="install-text">
        <div class="install-title">📱 অ্যাপটি ফোনে ইনস্টল করুন</div>
        <div class="install-sub">অফলাইনে ম্যাপ, রিমাইন্ডার ও দোয়া দেখতে ইনস্টল রাখুন</div>
      </div>
    </div>
    <div class="install-actions">
      <button class="btn-install-confirm" onclick={triggerInstall}>
        ইনস্টল করুন
      </button>
      <button class="btn-install-dismiss" onclick={dismissBanner} title="এখন নয়" aria-label="Close">
        ✕
      </button>
    </div>
  </div>
{/if}

<style>
  .install-bar {
    position: fixed;
    bottom: 1rem;
    left: 50%;
    transform: translateX(-50%);
    width: calc(100% - 1.5rem);
    max-width: 540px;
    background: rgba(8, 28, 48, 0.94);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    border: 1px solid rgba(56, 189, 248, 0.45);
    border-radius: 1rem;
    padding: 0.8rem 1rem;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.65), 0 0 15px rgba(56, 189, 248, 0.25);
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    animation: slideUp 0.35s ease-out;
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translate(-50%, 25px);
    }
    to {
      opacity: 1;
      transform: translate(-50%, 0);
    }
  }

  .install-bar-content {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    min-width: 0;
  }

  .install-icon {
    width: 42px;
    height: 42px;
    border-radius: 0.6rem;
    box-shadow: 0 2px 6px rgba(0,0,0,0.4);
    flex-shrink: 0;
  }

  .install-text {
    min-width: 0;
  }

  .install-title {
    font-size: 0.95rem;
    font-weight: 700;
    color: #38bdf8;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .install-sub {
    font-size: 0.75rem;
    color: #94a3b8;
    line-height: 1.25;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .install-actions {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    flex-shrink: 0;
  }

  .btn-install-confirm {
    background: linear-gradient(135deg, #0284c7, #0369a1);
    color: #ffffff;
    border: 1px solid rgba(56, 189, 248, 0.6);
    padding: 0.5rem 0.9rem;
    border-radius: 0.55rem;
    font-size: 0.85rem;
    font-weight: 700;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(2, 132, 199, 0.4);
    transition: transform 0.15s ease, background 0.15s;
    white-space: nowrap;
  }

  .btn-install-confirm:hover,
  .btn-install-confirm:active {
    background: linear-gradient(135deg, #0ea5e9, #0284c7);
    transform: scale(1.02);
  }

  .btn-install-dismiss {
    background: rgba(255, 255, 255, 0.08);
    color: #94a3b8;
    border: none;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    cursor: pointer;
    font-size: 0.95rem;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.15s;
  }

  .btn-install-dismiss:hover {
    background: rgba(255, 255, 255, 0.18);
    color: #ffffff;
  }
</style>
