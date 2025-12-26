<script lang="ts">
  import { onMount } from 'svelte';
  import ChatPanel from './ChatPanel.svelte';
  import Settings from './Settings.svelte';
  import { isUIVisible } from '@stores';

  let visible = false;
  let showSettings = false;

  // Subscribe to store
  isUIVisible.subscribe((value) => {
    visible = value;
  });

  function handleClose() {
    isUIVisible.set(false);
    showSettings = false;
  }

  function toggleSettings() {
    showSettings = !showSettings;
  }

  onMount(() => {
    console.log('[App] Component mounted');

    // Listen for global settings toggle
    chrome.runtime.onMessage.addListener((message) => {
      if (message.type === 'TOGGLE_SETTINGS') {
        showSettings = true;
        isUIVisible.set(true);
      }
    });
  });
</script>

<div
  class="app-container fixed top-0 right-0 w-[400px] h-screen z-[2147483647] transition-transform duration-300 ease-in-out {visible
    ? 'translate-x-0'
    : 'translate-x-full'}"
>
  {#if showSettings}
    <div class="relative h-full">
      <Settings onClose={handleClose} />
      <button
        on:click={toggleSettings}
        class="absolute bottom-4 left-4 bg-neutral-700 text-white px-3 py-2 rounded-lg text-sm hover:bg-neutral-800 transition-colors"
      >
        ← Back to Chat
      </button>
    </div>
  {:else}
    <div class="relative h-full">
      <ChatPanel onClose={handleClose} />
      <button
        on:click={toggleSettings}
        class="absolute bottom-4 left-4 bg-neutral-700 text-white px-3 py-2 rounded-lg text-sm hover:bg-neutral-800 transition-colors shadow-lg"
        title="Settings"
      >
        ⚙️ Settings
      </button>
    </div>
  {/if}
</div>

<style>
  .app-container {
    box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);
  }
</style>
