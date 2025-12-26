<script lang="ts">
  import { onMount } from 'svelte';
  import ChatPanel from './ChatPanel.svelte';
  import Settings from './Settings.svelte';
  import History from './History.svelte';
  import { isUIVisible } from '@stores';
  import type { Message } from '../lib/db';

  let visible = false;
  let currentView: 'chat' | 'settings' | 'history' = 'chat';
  let selectedConversationId: number | null = null;
  let selectedMessages: Message[] = [];

  // Subscribe to store
  isUIVisible.subscribe((value) => {
    visible = value;
  });

  function handleClose() {
    isUIVisible.set(false);
    currentView = 'chat';
  }

  function showSettings() {
    currentView = 'settings';
  }

  function showHistory() {
    currentView = 'history';
  }

  function showChat() {
    currentView = 'chat';
  }

  function handleSelectConversation(conversationId: number, messages: Message[]) {
    selectedConversationId = conversationId;
    selectedMessages = messages;
    currentView = 'chat';
  }

  onMount(() => {
    console.log('[App] Component mounted');

    // Listen for global settings toggle
    chrome.runtime.onMessage.addListener((message) => {
      if (message.type === 'TOGGLE_SETTINGS') {
        currentView = 'settings';
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
  <div class="relative h-full">
    {#if currentView === 'settings'}
      <Settings onClose={handleClose} />
      <button
        on:click={showChat}
        class="absolute bottom-4 left-4 bg-neutral-700 text-white px-3 py-2 rounded-lg text-sm hover:bg-neutral-800 transition-colors shadow-lg"
      >
        ← Back to Chat
      </button>
    {:else if currentView === 'history'}
      <History onClose={handleClose} onSelectConversation={handleSelectConversation} />
      <button
        on:click={showChat}
        class="absolute bottom-4 left-4 bg-neutral-700 text-white px-3 py-2 rounded-lg text-sm hover:bg-neutral-800 transition-colors shadow-lg"
      >
        ← Back to Chat
      </button>
    {:else}
      <ChatPanel
        onClose={handleClose}
        initialConversationId={selectedConversationId}
        initialMessages={selectedMessages}
      />
      <div class="absolute bottom-4 left-4 flex gap-2">
        <button
          on:click={showHistory}
          class="bg-neutral-700 text-white px-3 py-2 rounded-lg text-sm hover:bg-neutral-800 transition-colors shadow-lg"
          title="History"
        >
          📜 History
        </button>
        <button
          on:click={showSettings}
          class="bg-neutral-700 text-white px-3 py-2 rounded-lg text-sm hover:bg-neutral-800 transition-colors shadow-lg"
          title="Settings"
        >
          ⚙️ Settings
        </button>
      </div>
    {/if}
  </div>
</div>

<style>
  .app-container {
    box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);
  }
</style>
