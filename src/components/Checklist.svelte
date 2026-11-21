<script>
  import { onMount } from 'svelte';

  let { items = [] } = $props();

  let checkedMap = $state({});
  let customItems = $state([]);
  let newItemText = $state('');

  onMount(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('tour_checklist_v2') || '{}');
      checkedMap = saved;
      const savedCustom = JSON.parse(localStorage.getItem('tour_custom_items_v1') || '[]');
      customItems = savedCustom;
    } catch {
      checkedMap = {};
      customItems = [];
    }
  });

  function isChecked(key, defVal = false) {
    return key in checkedMap ? checkedMap[key] : defVal;
  }

  function toggleItem(key, currentVal) {
    checkedMap = { ...checkedMap, [key]: !currentVal };
    localStorage.setItem('tour_checklist_v2', JSON.stringify(checkedMap));
  }

  function addCustom() {
    const trimmed = newItemText.trim();
    if (!trimmed) return;
    customItems = [...customItems, { id: Date.now(), text: trimmed }];
    localStorage.setItem('tour_custom_items_v1', JSON.stringify(customItems));
    newItemText = '';
  }

  function removeCustom(id) {
    customItems = customItems.filter(it => it.id !== id);
    localStorage.setItem('tour_custom_items_v1', JSON.stringify(customItems));
  }
</script>

<div class="card">
  <div class="card-title">🎒 প্যাকিং ও প্রস্তুতি চেকলিস্ট (অফলাইনে সেভ থাকবে)</div>

  {#each items as item, idx}
    {@const key = 'base_' + idx}
    {@const val = isChecked(key, item.default)}
    <label class="check-item">
      <input type="checkbox" checked={val} onchange={() => toggleItem(key, val)} />
      <span class={val ? 'checked-text' : ''}>{@html item.text}</span>
    </label>
  {/each}

  {#each customItems as cItem (cItem.id)}
    {@const key = 'cust_' + cItem.id}
    {@const val = isChecked(key, false)}
    <div class="check-item custom-check-row">
      <label class="custom-check-label">
        <input type="checkbox" checked={val} onchange={() => toggleItem(key, val)} />
        <span class={val ? 'checked-text' : ''}>{cItem.text}</span>
      </label>
      <button class="remove-custom-btn" onclick={() => removeCustom(cItem.id)} aria-label="Remove">✕</button>
    </div>
  {/each}

  <form class="add-custom-form" onsubmit={(e) => { e.preventDefault(); addCustom(); }}>
    <input
      type="text"
      bind:value={newItemText}
      placeholder="+ নিজস্ব প্রয়োজনীয় জিনিস যোগ করুন (যেমন: চার্জার, ক্যাপ...)"
      class="add-custom-input"
    />
    <button type="submit" class="add-custom-btn">যোগ</button>
  </form>
</div>
