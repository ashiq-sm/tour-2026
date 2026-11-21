<script>
  let { tips = [] } = $props();
</script>

<div class="card tips-card">
  <div class="card-title">💡 স্মার্ট ট্রাভেল টিপস (পাহাড় ও দ্বীপের জন্য)</div>
  <div class="tips-list">
    {#each tips as t}
      <div class="tip-item">
        <div class="tip-icon">{t.icon}</div>
        <div class="tip-content">
          <div class="tip-title">{t.title}</div>
          <div class="tip-desc">{t.desc}</div>
        </div>
      </div>
    {/each}
  </div>
</div>
