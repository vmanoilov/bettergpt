<script lang="ts">
  import { onMount } from 'svelte';
  import { formatRelativeTime } from '../lib/utils/date';
  import type { Conversation, Message } from '../lib/db';

  export let onClose: () => void = () => {};
  export let onSelectConversation: (conversationId: number, messages: Message[]) => void = () => {};

  let conversations: (Conversation & { messageCount?: number })[] = [];
  let selectedConversationId: number | null = null;
  let searchQuery = '';
  let isLoading = false;

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
      console.error('[History] Failed to load conversations:', error);
    } finally {
      isLoading = false;
    }
  }

  async function selectConversation(conversationId: number) {
    selectedConversationId = conversationId;

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'GET_CONVERSATION',
        conversationId,
      });

      if (response.success && response.messages) {
        onSelectConversation(conversationId, response.messages);
        onClose();
      }
    } catch (error) {
      console.error('[History] Failed to load conversation:', error);
    }
  }

  async function deleteConversation(conversationId: number, event: Event) {
    event.stopPropagation();

    if (!confirm('Are you sure you want to delete this conversation?')) {
      return;
    }

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'DELETE_CONVERSATION',
        conversationId,
      });

      if (response.success) {
        await loadConversations();
      }
    } catch (error) {
      console.error('[History] Failed to delete conversation:', error);
    }
  }

  async function exportConversation(conversationId: number, event: Event) {
    event.stopPropagation();

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'GET_CONVERSATION',
        conversationId,
      });

      if (response.success) {
        const conversation = response.conversation;
        const messages = response.messages;

        // Export as JSON
        const exportData = {
          conversation,
          messages,
          exportedAt: new Date().toISOString(),
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
          type: 'application/json',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `conversation-${conversationId}-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('[History] Failed to export conversation:', error);
    }
  }

  async function exportAsMarkdown(conversationId: number, event: Event) {
    event.stopPropagation();

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'GET_CONVERSATION',
        conversationId,
      });

      if (response.success) {
        const conversation = response.conversation;
        const messages = response.messages;

        // Build markdown
        let markdown = `# ${conversation.title}\n\n`;
        markdown += `Created: ${new Date(conversation.createdAt).toLocaleString()}\n\n`;
        markdown += `---\n\n`;

        for (const message of messages) {
          const role = message.role === 'user' ? '👤 User' : '🤖 Assistant';
          markdown += `## ${role}\n\n`;
          markdown += `${message.content}\n\n`;
          markdown += `---\n\n`;
        }

        const blob = new Blob([markdown], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `conversation-${conversationId}-${Date.now()}.md`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('[History] Failed to export as markdown:', error);
    }
  }

  $: filteredConversations = conversations.filter((conv) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return conv.title.toLowerCase().includes(query);
  });
</script>

<div class="history-panel flex flex-col h-full bg-white">
  <!-- Header -->
  <div
    class="header flex items-center justify-between p-4 border-b border-neutral-200 bg-neutral-50"
  >
    <h2 class="text-lg font-semibold text-neutral-900">Conversation History</h2>
    <button
      on:click={onClose}
      class="text-neutral-600 hover:text-neutral-900 transition-colors"
      aria-label="Close"
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
  <div class="p-4 border-b border-neutral-200">
    <input
      type="search"
      bind:value={searchQuery}
      placeholder="Search conversations..."
      class="input-field w-full"
    />
  </div>

  <!-- Content -->
  <div class="flex-1 overflow-y-auto">
    {#if isLoading}
      <div class="text-center py-12 text-neutral-500">
        <p class="text-sm">Loading conversations...</p>
      </div>
    {:else if filteredConversations.length === 0}
      <div class="text-center py-12 text-neutral-500">
        <p class="text-sm">
          {searchQuery ? 'No conversations found' : 'No conversations yet'}
        </p>
        <p class="text-xs mt-1">Start chatting to create your first conversation</p>
      </div>
    {:else}
      <div class="divide-y divide-neutral-200">
        {#each filteredConversations as conversation}
          <button
            on:click={() => selectConversation(conversation.id)}
            class="w-full text-left p-4 hover:bg-neutral-50 transition-colors {conversation.id ===
            selectedConversationId
              ? 'bg-primary-50'
              : ''}"
          >
            <div class="flex items-start justify-between gap-2">
              <div class="flex-1 min-w-0">
                <h3 class="font-medium text-neutral-900 truncate">{conversation.title}</h3>
                <p class="text-xs text-neutral-500 mt-1">
                  {formatRelativeTime(conversation.lastMessageAt || conversation.updatedAt)}
                </p>
              </div>
              <div class="flex gap-1">
                <button
                  on:click={(e) => exportAsMarkdown(conversation.id, e)}
                  class="text-xs text-neutral-600 hover:text-neutral-900 px-2 py-1"
                  title="Export as Markdown"
                >
                  📄
                </button>
                <button
                  on:click={(e) => exportConversation(conversation.id, e)}
                  class="text-xs text-neutral-600 hover:text-neutral-900 px-2 py-1"
                  title="Export as JSON"
                >
                  💾
                </button>
                <button
                  on:click={(e) => deleteConversation(conversation.id, e)}
                  class="text-xs text-error hover:text-error-dark px-2 py-1"
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
  .history-panel {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }
</style>
