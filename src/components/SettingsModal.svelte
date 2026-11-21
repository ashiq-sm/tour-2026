<script>
  let {
    isOpen = false,
    fontSize = 'medium',
    fontFamily = 'system',
    themeContrast = 'glass',
    showDuaMeaning = true,
    showDuaTrans = true,
    bgDim = 'medium',
    onClose = () => {},
    onUpdate = () => {}
  } = $props();

  function setFontSize(val) {
    onUpdate({ fontSize: val });
  }

  function setFontFamily(val) {
    onUpdate({ fontFamily: val });
  }

  function setThemeContrast(val) {
    onUpdate({ themeContrast: val });
  }

  function setBgDim(val) {
    onUpdate({ bgDim: val });
  }

  function toggleDuaMeaning() {
    onUpdate({ showDuaMeaning: !showDuaMeaning });
  }

  function toggleDuaTrans() {
    onUpdate({ showDuaTrans: !showDuaTrans });
  }
</script>

{#if isOpen}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="settings-backdrop" onclick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
    <div class="settings-modal" role="dialog" aria-label="অ্যাপের সেটিংস">
      <div class="settings-header">
        <div class="settings-title">⚙️ অ্যাপ সেটিংস ও ভিউ মোড</div>
        <button class="settings-close-btn" onclick={onClose} aria-label="Close settings">✕</button>
      </div>

      <div class="settings-body">
        <!-- Font Size Setting -->
        <div class="setting-group">
          <div class="setting-label">🔤 ফন্ট সাইজ (সমগ্র অ্যাপে প্রযোজ্য)</div>
          <div class="btn-toggle-group">
            <button
              class="toggle-opt {fontSize === 'normal' ? 'active' : ''}"
              onclick={() => setFontSize('normal')}
            >
              স্বাভাবিক (100%)
            </button>
            <button
              class="toggle-opt {fontSize === 'medium' ? 'active' : ''}"
              onclick={() => setFontSize('medium')}
            >
              বড় (115%)
            </button>
            <button
              class="toggle-opt {fontSize === 'large' ? 'active' : ''}"
              onclick={() => setFontSize('large')}
            >
              অনেক বড় (130%)
            </button>
          </div>
          <div class="setting-hint">মোবাইলে রোদ বা গাড়িতে ঝাঁকুনির সময় 'বড়' বা 'অনেক বড়' নির্বাচন করুন।</div>
        </div>

        <!-- Font Style / Type (Eye friendly Bangla / English fonts) -->
        <div class="setting-group">
          <div class="setting-label">📖 ফন্ট স্টাইল (চোখের জন্য আরামদায়ক)</div>
          <div class="btn-toggle-group">
            <button
              class="toggle-opt {fontFamily === 'system' ? 'active' : ''}"
              onclick={() => setFontFamily('system')}
            >
              মডার্ন Sans
            </button>
            <button
              class="toggle-opt {fontFamily === 'serif' ? 'active' : ''}"
              onclick={() => setFontFamily('serif')}
            >
              কালপুরুষ Serif
            </button>
            <button
              class="toggle-opt {fontFamily === 'rounded' ? 'active' : ''}"
              onclick={() => setFontFamily('rounded')}
            >
              সফট Rounded
            </button>
          </div>
          <div class="setting-hint">সহজ পঠনযোগ্যতার জন্য আপনার পছন্দের ফন্ট বেছে নিন।</div>
        </div>

        <!-- Readability / Contrast Mode (Glass vs Solid High Contrast) -->
        <div class="setting-group">
          <div class="setting-label">🎨 কার্ড রিডেবিলিটি ও থিম স্টাইল</div>
          <div class="btn-toggle-group">
            <button
              class="toggle-opt {themeContrast === 'glass' ? 'active' : ''}"
              onclick={() => setThemeContrast('glass')}
            >
              ✨ ডায়নামিক ফ্রস্টেড গ্লাস
            </button>
            <button
              class="toggle-opt {themeContrast === 'solid' ? 'active' : ''}"
              onclick={() => setThemeContrast('solid')}
            >
              ☀️ হাই কনট্রাস্ট (সলিড)
            </button>
          </div>
          <div class="setting-hint">বাইরে রোদের মধ্যে সলিড মোড লেখা পড়ার সর্বোচ্চ স্বচ্ছতা নিশ্চিত করে।</div>
        </div>

        <!-- Background Picture Dimming -->
        <div class="setting-group">
          <div class="setting-label">🌄 ব্যাকগ্রাউন্ড দৃশ্যের উজ্জ্বলতা</div>
          <div class="btn-toggle-group">
            <button
              class="toggle-opt {bgDim === 'soft' ? 'active' : ''}"
              onclick={() => setBgDim('soft')}
            >
              উজ্জ্বল (স্পষ্ট দৃশ্য)
            </button>
            <button
              class="toggle-opt {bgDim === 'medium' ? 'active' : ''}"
              onclick={() => setBgDim('medium')}
            >
              স্বাভাবিক
            </button>
            <button
              class="toggle-opt {bgDim === 'dark' ? 'active' : ''}"
              onclick={() => setBgDim('dark')}
            >
              গাঢ় (টেক্সট ফোকাস)
            </button>
          </div>
        </div>

        <!-- Dua Card View Customization -->
        <div class="setting-group">
          <div class="setting-label">🕌 দোয়ার কার্ডে বাংলা লেখা প্রদর্শন</div>
          <div class="toggles-list">
            <label class="toggle-checkbox-row">
              <input type="checkbox" checked={showDuaTrans} onchange={toggleDuaTrans} />
              <div class="toggle-checkbox-text">
                <strong>বাংলা উচ্চারণ (বোল্ড)</strong>
                <span>উচ্চারণ দেখে দ্রুত পড়তে সহায়ক</span>
              </div>
            </label>

            <label class="toggle-checkbox-row">
              <input type="checkbox" checked={showDuaMeaning} onchange={toggleDuaMeaning} />
              <div class="toggle-checkbox-text">
                <strong>বাংলা অর্থ</strong>
                <span>দোয়ার বাংলা অর্থ ও তাৎপর্য</span>
              </div>
            </label>
          </div>
        </div>
      </div>

      <div class="settings-footer">
        <button class="settings-done-btn" onclick={onClose}>
          ✓ সেটিংস সম্পন্ন
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .settings-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(3, 19, 34, 0.78);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
    z-index: 10001;
    animation: fadeIn 0.2s ease-out;
  }

  .settings-modal {
    background: #0f172a;
    border: 1px solid rgba(56, 189, 248, 0.35);
    border-radius: 20px;
    max-width: 460px;
    width: 100%;
    color: #f1f5f9;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.65), 0 0 20px rgba(2, 132, 199, 0.2);
    overflow: hidden;
    animation: slideUp 0.25s ease-out;
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .settings-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 18px;
    background: rgba(255, 255, 255, 0.04);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .settings-title {
    font-size: 1.02rem;
    font-weight: 800;
    color: #38bdf8;
  }

  .settings-close-btn {
    background: rgba(255, 255, 255, 0.08);
    border: none;
    color: #94a3b8;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    cursor: pointer;
    font-size: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.15s, color 0.15s;
  }

  .settings-close-btn:hover {
    background: rgba(255, 255, 255, 0.18);
    color: #ffffff;
  }

  .settings-body {
    padding: 16px 18px;
    max-height: 72vh;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .setting-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .setting-label {
    font-size: 0.85rem;
    font-weight: 700;
    color: #e2e8f0;
  }

  .btn-toggle-group {
    display: flex;
    gap: 6px;
    background: rgba(255, 255, 255, 0.05);
    padding: 4px;
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.08);
  }

  .toggle-opt {
    flex: 1;
    background: transparent;
    border: none;
    color: #94a3b8;
    padding: 8px 6px;
    border-radius: 8px;
    font-size: 0.78rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.15s ease;
    text-align: center;
  }

  .toggle-opt:hover {
    color: #ffffff;
    background: rgba(255, 255, 255, 0.05);
  }

  .toggle-opt.active {
    background: #0284c7;
    color: #ffffff;
    box-shadow: 0 2px 8px rgba(2, 132, 199, 0.45);
  }

  .setting-hint {
    font-size: 0.72rem;
    color: #64748b;
    line-height: 1.35;
  }

  .toggles-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .toggle-checkbox-row {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.08);
    padding: 10px 12px;
    border-radius: 10px;
    cursor: pointer;
    transition: background 0.15s;
  }

  .toggle-checkbox-row:hover {
    background: rgba(255, 255, 255, 0.07);
  }

  .toggle-checkbox-row input {
    margin-top: 3px;
    accent-color: #38bdf8;
    width: 17px;
    height: 17px;
    cursor: pointer;
  }

  .toggle-checkbox-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .toggle-checkbox-text strong {
    font-size: 0.84rem;
    color: #f1f5f9;
  }

  .toggle-checkbox-text span {
    font-size: 0.72rem;
    color: #94a3b8;
  }

  .settings-footer {
    padding: 12px 18px;
    background: rgba(255, 255, 255, 0.02);
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    display: flex;
    justify-content: flex-end;
  }

  .settings-done-btn {
    background: linear-gradient(135deg, #0284c7, #0369a1);
    color: #ffffff;
    border: none;
    padding: 8px 18px;
    border-radius: 10px;
    font-size: 0.85rem;
    font-weight: 700;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(2, 132, 199, 0.4);
    transition: transform 0.12s ease;
  }

  .settings-done-btn:hover {
    transform: scale(1.02);
  }
</style>
