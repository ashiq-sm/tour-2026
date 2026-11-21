<script>
  let { coordinators = [], emergency = [] } = $props();
</script>

<div class="card">
  <div class="card-title">👥 ট্যুর কোঅর্ডিনেটর ও টিম লিডস</div>
  <div class="btn-grid">
    {#each coordinators as c}
      {#if c.phone}
        <a href="tel:{c.phone}" class="action-btn">📞 {c.name}</a>
      {:else}
        <span class="action-btn static-btn">👤 {c.name}</span>
      {/if}
    {/each}
  </div>
</div>

<div class="card">
  <div class="card-title">🛡️ জরুরি সরকারি সেবা</div>
  <div class="btn-grid">
    {#each emergency as e}
      <a href="tel:{e.phone}" class="action-btn {e.isDanger ? 'emergency' : ''}">{e.name}</a>
    {/each}
  </div>
</div>
