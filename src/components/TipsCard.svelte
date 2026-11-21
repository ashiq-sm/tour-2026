<script>
  let { tips = [] } = $props();
</script>

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
