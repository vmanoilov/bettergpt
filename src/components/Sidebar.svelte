<script lang="ts">
  import { onMount } from 'svelte';
  import { formatRelativeTime } from '../lib/utils/date';
  import type { Conversation } from '../lib/db';

  export let isOpen = false;
  export let onClose: () => void = () => {};

  let conversations: Conversation[] = [];
  let searchQuery = '';
  let isLoading = false;
  let selectedFolder = 'all';
  let folders = ['all', 'favorites', 'archived'];

  onMount(async () => {
    await loadConversations();
  });

  async function loadConversations() {
    isLoading = true;
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'GET_CONVERSATIONS',
      });

      if (response.success) {
        conversations = response.conversations || [];
      }
    } catch (error) {
      console.error('[Sidebar] Failed to load conversations:', error);
    } finally {
      isLoading = false;
    }
  }

  async function selectConversation(conversationId: number) {
    // Navigate to conversation in ChatGPT
    // For now, just highlight it
    console.log('Selected conversation:', conversationId);
  }

  async function exportConversation(conversationId: number, event: Event) {
    event.stopPropagation();

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'EXPORT_CONVERSATION',
        conversationId,
        format: 'markdown',
      });

      if (response.success && response.content) {
        // Download the file
        const blob = new Blob([response.content], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `conversation-${conversationId}.md`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('[Sidebar] Failed to export conversation:', error);
    }
  }

  async function pinConversation(conversationId: number, event: Event) {
    event.stopPropagation();
    // Implement pin/unpin logic
    console.log('Pin conversation:', conversationId);
  }

  async function deleteConversation(conversationId: number, event: Event) {
    event.stopPropagation();

    if (!confirm('Delete this conversation from history?')) {
      return;
    }

    try {
      await chrome.runtime.sendMessage({
        type: 'DELETE_CONVERSATION',
        conversationId,
      });
      await loadConversations();
    } catch (error) {
      console.error('[Sidebar] Failed to delete conversation:', error);
    }
  }

  $: filteredConversations = conversations.filter((conv) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return conv.title.toLowerCase().includes(query);
  });
</script>

<div
  class="bettergpt-sidebar fixed top-0 right-0 h-full w-80 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 shadow-xl z-[10000] transition-transform duration-300 {isOpen
    ? 'translate-x-0'
    : 'translate-x-full'}"
>
  <!-- Header -->
  <div class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
    <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Chat History</h2>
    <button
      on:click={onClose}
      class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
    >
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    </button>
  </div>

  <!-- Search -->
  <div class="p-4 border-b border-gray-200 dark:border-gray-700">
    <input
      type="search"
      bind:value={searchQuery}
      placeholder="Search conversations..."
      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
    />
  </div>

  <!-- Folders/Filters -->
  <div class="flex gap-2 p-4 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
    {#each folders as folder}
      <button
        on:click={() => (selectedFolder = folder)}
        class="px-3 py-1 text-sm rounded-full transition-colors {selectedFolder === folder
          ? 'bg-blue-600 text-white'
          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'}"
      >
        {folder.charAt(0).toUpperCase() + folder.slice(1)}
      </button>
    {/each}
  </div>

  <!-- Conversation List -->
  <div class="flex-1 overflow-y-auto">
    {#if isLoading}
      <div class="text-center py-12 text-gray-500 dark:text-gray-400">
        <p class="text-sm">Loading conversations...</p>
      </div>
    {:else if filteredConversations.length === 0}
      <div class="text-center py-12 text-gray-500 dark:text-gray-400">
        <p class="text-sm">
          {searchQuery ? 'No conversations found' : 'No conversations yet'}
        </p>
      </div>
    {:else}
      <div class="divide-y divide-gray-200 dark:divide-gray-700">
        {#each filteredConversations as conversation}
          <button
            on:click={() => selectConversation(conversation.id)}
            class="w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <div class="flex items-start justify-between gap-2">
              <div class="flex-1 min-w-0">
                <h3 class="font-medium text-gray-900 dark:text-white truncate">
                  {conversation.title}
                </h3>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {formatRelativeTime(conversation.lastMessageAt || conversation.updatedAt)}
                </p>
              </div>
              <div class="flex gap-1">
                <button
                  on:click={(e) => pinConversation(conversation.id, e)}
                  class="text-gray-400 hover:text-yellow-500 p-1"
                  title="Pin"
                >
                  📌
                </button>
                <button
                  on:click={(e) => exportConversation(conversation.id, e)}
                  class="text-gray-400 hover:text-blue-500 p-1"
                  title="Export"
                >
                  💾
                </button>
                <button
                  on:click={(e) => deleteConversation(conversation.id, e)}
                  class="text-gray-400 hover:text-red-500 p-1"
                  title="Delete"
                >
                  🗑️
                </button>
              </div>
            </div>
          </button>
        {/each}
      </div>
    {/if}
  </div>
</div>

<style>
  .bettergpt-sidebar {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }
</style>
