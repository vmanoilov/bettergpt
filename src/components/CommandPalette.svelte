<script lang="ts">
  import { onMount, onDestroy } from 'svelte';

  export let isOpen = false;
  export let onClose: () => void = () => {};

  let searchQuery = '';
  let selectedIndex = 0;
  let actions = [
    { id: 'search', label: 'Search conversations', icon: '🔍', action: () => console.log('Search') },
    { id: 'export', label: 'Export current conversation', icon: '💾', action: () => console.log('Export') },
    { id: 'new', label: 'New conversation', icon: '✨', action: () => console.log('New') },
    { id: 'settings', label: 'Settings', icon: '⚙️', action: () => console.log('Settings') },
  ];

  function handleKeydown(event: KeyboardEvent) {
    if (!isOpen) return;

    if (event.key === 'Escape') {
      onClose();
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      selectedIndex = Math.min(selectedIndex + 1, filteredActions.length - 1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      selectedIndex = Math.max(selectedIndex - 1, 0);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (filteredActions[selectedIndex]) {
        filteredActions[selectedIndex].action();
        onClose();
      }
    }
  }

  onMount(() => {
    document.addEventListener('keydown', handleKeydown);
  });

  onDestroy(() => {
    document.removeEventListener('keydown', handleKeydown);
  });

  $: filteredActions = actions.filter((action) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return action.label.toLowerCase().includes(query);
  });

  $: if (filteredActions.length > 0 && selectedIndex >= filteredActions.length) {
    selectedIndex = filteredActions.length - 1;
  }
</script>

{#if isOpen}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div
    class="bettergpt-command-palette-overlay fixed inset-0 bg-black bg-opacity-50 z-[10001] flex items-start justify-center pt-32"
    on:click={onClose}
  >
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div
      class="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl"
      on:click|stopPropagation
    >
      <!-- Search Input -->
      <div class="p-4 border-b border-gray-200 dark:border-gray-700">
        <input
          type="text"
          bind:value={searchQuery}
          placeholder="Type a command or search..."
          class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border-0 text-lg focus:outline-none focus:ring-0 text-gray-900 dark:text-white"
          autofocus
        />
      </div>

      <!-- Actions List -->
      <div class="max-h-96 overflow-y-auto">
        {#if filteredActions.length === 0}
          <div class="p-8 text-center text-gray-500 dark:text-gray-400">
            <p>No actions found</p>
          </div>
        {:else}
          {#each filteredActions as action, index}
            <button
              on:click={() => {
                action.action();
                onClose();
              }}
              class="w-full text-left px-4 py-3 flex items-center gap-3 transition-colors {index ===
              selectedIndex
                ? 'bg-blue-50 dark:bg-blue-900'
                : 'hover:bg-gray-50 dark:hover:bg-gray-700'}"
            >
              <span class="text-2xl">{action.icon}</span>
              <span class="text-gray-900 dark:text-white font-medium">{action.label}</span>
            </button>
          {/each}
        {/if}
      </div>

      <!-- Footer -->
      <div class="px-4 py-2 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 flex justify-between">
        <span>↑↓ Navigate</span>
        <span>↵ Select</span>
        <span>ESC Close</span>
      </div>
    </div>
  </div>
{/if}

<style>
  .bettergpt-command-palette-overlay {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }
</style>
