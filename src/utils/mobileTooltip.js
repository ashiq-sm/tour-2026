/**
 * Universal Mobile Long-Press / Desktop Hover Tooltip Dispatcher
 * Automatically detects elements with title or aria-label attributes
 * and shows an elegant floating tooltip on mobile long-press (>= 400ms)
 * without triggering default click action if held.
 */

let tooltipEl = null;
let longPressTimer = null;
let hideTimer = null;
let touchStartX = 0;
let touchStartY = 0;
let activeTarget = null;

function ensureTooltipElement() {
  if (typeof document === 'undefined') return null;
  if (!tooltipEl) {
    tooltipEl = document.createElement('div');
    tooltipEl.className = 'mobile-touch-tooltip';
    tooltipEl.setAttribute('role', 'tooltip');
    tooltipEl.setAttribute('aria-hidden', 'true');
    document.body.appendChild(tooltipEl);
  }
  return tooltipEl;
}

export function showMobileTooltip(text, x, y) {
  if (!text) return;
  const tip = ensureTooltipElement();
  if (!tip) return;

  if (hideTimer) {
    clearTimeout(hideTimer);
    hideTimer = null;
  }

  tip.textContent = text;
  tip.classList.add('visible');
  tip.setAttribute('aria-hidden', 'false');

  // Positioning logic
  const padding = 12;
  const tipRect = tip.getBoundingClientRect();
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;

  let left = x - tipRect.width / 2;
  let top = y - tipRect.height - 14; // Default above finger / element

  // If too close to top of viewport, show below
  if (top < 10) {
    top = y + 28;
  }

  // Constrain horizontally
  if (left < padding) left = padding;
  if (left + tipRect.width > screenWidth - padding) {
    left = screenWidth - tipRect.width - padding;
  }

  tip.style.left = `${left}px`;
  tip.style.top = `${top}px`;

  // Auto-dismiss after 2.8s
  hideTimer = setTimeout(() => {
    hideMobileTooltip();
  }, 2800);
}

export function hideMobileTooltip() {
  if (tooltipEl) {
    tooltipEl.classList.remove('visible');
    tooltipEl.setAttribute('aria-hidden', 'true');
  }
  if (longPressTimer) {
    clearTimeout(longPressTimer);
    longPressTimer = null;
  }
}

export function initMobileLongPressTooltips() {
  if (typeof window === 'undefined') return () => {};

  function findTooltipTarget(el) {
    while (el && el !== document.body) {
      if (
        (el.hasAttribute('title') && el.getAttribute('title').trim()) ||
        (el.hasAttribute('data-tooltip') && el.getAttribute('data-tooltip').trim()) ||
        (el.hasAttribute('aria-label') && el.getAttribute('aria-label').trim())
      ) {
        return el;
      }
      el = el.parentElement;
    }
    return null;
  }

  function handleTouchStart(e) {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;

    const target = findTooltipTarget(e.target);
    if (!target) return;

    activeTarget = target;
    const text = target.getAttribute('data-tooltip') || target.getAttribute('title') || target.getAttribute('aria-label');

    // Remove native title temporarily to avoid conflicting OS callouts
    if (target.hasAttribute('title')) {
      target.setAttribute('data-tooltip', target.getAttribute('title'));
      target.removeAttribute('title');
    }

    longPressTimer = setTimeout(() => {
      const rect = target.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const topY = rect.top;

      // Gentle haptic feedback if supported on mobile
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try { navigator.vibrate(35); } catch {}
      }

      showMobileTooltip(text, centerX, topY);
    }, 420); // 420ms long-press threshold
  }

  function handleTouchMove(e) {
    if (!longPressTimer) return;
    const touch = e.touches[0];
    // Cancel if finger moved more than 8px (scrolling)
    if (Math.hypot(touch.clientX - touchStartX, touch.clientY - touchStartY) > 8) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }
  }

  function handleTouchEnd() {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }
  }

  window.addEventListener('touchstart', handleTouchStart, { passive: true });
  window.addEventListener('touchmove', handleTouchMove, { passive: true });
  window.addEventListener('touchend', handleTouchEnd, { passive: true });
  window.addEventListener('touchcancel', handleTouchEnd, { passive: true });
  window.addEventListener('scroll', hideMobileTooltip, { passive: true });

  return () => {
    window.removeEventListener('touchstart', handleTouchStart);
    window.removeEventListener('touchmove', handleTouchMove);
    window.removeEventListener('touchend', handleTouchEnd);
    window.removeEventListener('touchcancel', handleTouchEnd);
    window.removeEventListener('scroll', hideMobileTooltip);
  };
}
