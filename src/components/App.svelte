<script lang="ts">
  import { onMount } from 'svelte';
  import ChatPanel from './ChatPanel.svelte';
  import { isUIVisible } from '@stores';

  let visible = false;

  // Subscribe to store
  isUIVisible.subscribe((value) => {
    visible = value;
  });

  function handleClose() {
    isUIVisible.set(false);
  }

  onMount(() => {
    console.log('[App] Component mounted');
  });
</script>

<div
  class="app-container fixed top-0 right-0 w-[400px] h-screen z-[2147483647] transition-transform duration-300 ease-in-out {visible
    ? 'translate-x-0'
    : 'translate-x-full'}"
>
  <ChatPanel onClose={handleClose} />
</div>

<style>
  .app-container {
    box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);
  }
</style>
