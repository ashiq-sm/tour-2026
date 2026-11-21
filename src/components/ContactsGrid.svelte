<script>
  import { onMount } from 'svelte';

  let { coordinators = [], emergency = [] } = $props();

  const STORAGE_KEY = 'tour_custom_contacts_v1';
  let customContacts = $state([]);
  let showAddForm = $state(false);
  let newName = $state('');
  let newPhone = $state('');
  let importNote = $state('');

  const supportsPicker = typeof navigator !== 'undefined' && 'contacts' in navigator && 'ContactsManager' in window;

  onMount(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      if (Array.isArray(saved)) customContacts = saved;
    } catch {}
  });

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(customContacts));
    } catch {}
  }

  function openAddModal(prefillName = '') {
    newName = prefillName;
    newPhone = '';
    importNote = '';
    showAddForm = true;
  }

  function saveContact(e) {
    e.preventDefault();
    const n = newName.trim();
    const p = newPhone.trim();
    if (!n || !p) return;

    // Replace existing custom entry with same name (e.g. updating তন্ময়) or append
    const existingIdx = customContacts.findIndex((c) => c.name === n);
    if (existingIdx >= 0) {
      customContacts[existingIdx] = { name: n, phone: p };
    } else {
      customContacts = [...customContacts, { name: n, phone: p }];
    }
    persist();
    newName = '';
    newPhone = '';
    showAddForm = false;
  }

  function removeCustom(idx) {
    customContacts = customContacts.filter((_, i) => i !== idx);
    persist();
  }

  async function importFromPhone() {
    importNote = '';
    if (!supportsPicker) {
      importNote = 'এই ব্রাউজারে সরাসরি কন্টাক্ট ইমপোর্ট সাপোর্ট নেই; নিচে নাম ও নম্বর টাইপ করে সেভ করুন।';
      return;
    }
    try {
      const selected = await navigator.contacts.select(['name', 'tel'], { multiple: true });
      if (!selected || !selected.length) return;
      const added = [];
      for (const item of selected) {
        const name = (item.name && item.name[0]) ? item.name[0].trim() : 'Friend';
        const tel = (item.tel && item.tel[0]) ? item.tel[0].replace(/\s+/g, '') : '';
        if (tel) added.push({ name, phone: tel });
      }
      if (added.length) {
        customContacts = [...customContacts, ...added];
        persist();
        showAddForm = false;
      }
    } catch {
      importNote = 'কন্টাক্ট অ্যাক্সেস বাতিল হয়েছে বা সাপোর্ট করছে না; হাতে টাইপ করে যোগ করুন।';
    }
  }

  function getSavedPhone(name) {
    return customContacts.find((c) => c.name === name)?.phone || '';
  }
</script>

<div class="card">
  <div class="contacts-header">
    <div class="card-title" style="margin-bottom: 0;">👥 ট্যুর কোঅর্ডিনেটর ও নিজস্ব নম্বর</div>
    <button
      type="button"
      class="add-contact-pill"
      onclick={() => openAddModal('')}
      title="নতুন নম্বর যোগ বা ইমপোর্ট করুন"
    >
      ➕ যোগ / ইমপোর্ট
    </button>
  </div>

  <div class="btn-grid">
    {#each coordinators as c}
      {@const effectivePhone = c.phone || getSavedPhone(c.name)}
      {#if effectivePhone}
        <a href="tel:{effectivePhone}" class="action-btn">📞 {c.name}</a>
      {:else}
        <button
          type="button"
          class="action-btn static-btn"
          onclick={() => openAddModal(c.name)}
          title="ট্যাপ করে {c.name}-এর নম্বর যোগ করুন"
        >
          👤 {c.name} <span class="mini-plus">+</span>
        </button>
      {/if}
    {/each}

    {#each customContacts.filter((cc) => !coordinators.some((c) => c.name === cc.name)) as custom, idx}
      <div class="custom-contact-wrap">
        <a href="tel:{custom.phone}" class="action-btn custom-dial-btn">📞 {custom.name}</a>
        <button
          type="button"
          class="custom-del-btn"
          onclick={() => removeCustom(customContacts.indexOf(custom))}
          aria-label="Remove {custom.name}"
        >
          ×
        </button>
      </div>
    {/each}
  </div>

  {#if showAddForm}
    <div class="add-contact-panel">
      <div class="panel-top">
        <strong>নম্বর যোগ বা ফোন থেকে ইমপোর্ট করুন</strong>
        <button type="button" class="panel-close" onclick={() => { showAddForm = false; }}>✕</button>
      </div>

      <button type="button" class="import-phone-btn" onclick={importFromPhone}>
        📱 ফোনের কন্টাক্ট থেকে ইমপোর্ট করুন
      </button>
      {#if importNote}
        <div class="import-note">{importNote}</div>
      {/if}

      <form class="manual-contact-form" onsubmit={saveContact}>
        <input
          type="text"
          bind:value={newName}
          placeholder="নাম (যেমন: তন্ময় / রুমমেট)"
          required
        />
        <input
          type="tel"
          bind:value={newPhone}
          placeholder="ফোন নম্বর (যেমন: 017...)"
          required
        />
        <button type="submit" class="save-contact-btn">সেভ করুন</button>
      </form>
    </div>
  {/if}
</div>

<div class="card">
  <div class="card-title">🛡️ জরুরি সরকারি সেবা (ভেরিফায়েড)</div>
  <div class="emergency-grid">
    {#each emergency as e}
      <div class="emergency-item {e.isDanger ? 'emergency-danger-box' : ''}">
        <a href="tel:{e.phone}" class="action-btn {e.isDanger ? 'emergency' : ''}">
          {e.name}
        </a>
        {#if e.sub && e.sub.length}
          <div class="emergency-sub-list">
            {#each e.sub as s}
              <a href="tel:{s.phone}" class="emergency-sub-pill">({s.label})</a>
            {/each}
          </div>
        {/if}
      </div>
    {/each}
  </div>
</div>
