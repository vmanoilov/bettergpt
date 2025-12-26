<script lang="ts">
  import { onMount } from 'svelte';
  import Sidebar from './Sidebar.svelte';
  import CommandPalette from './CommandPalette.svelte';
  import { ChatGPTObserver } from '../lib/chatgpt/observer';
  import type { ChatGPTMessage } from '../lib/chatgpt/observer';

  let sidebarOpen = false;
  let commandPaletteOpen = false;
  let observer: ChatGPTObserver;

  onMount(() => {
    console.log('[BetterGPT] Extension loaded on ChatGPT page');

    // Initialize ChatGPT observer
    observer = new ChatGPTObserver();
    observer.start(handleNewMessage, handleConversationChange);

    // Listen for keyboard shortcuts
    document.addEventListener('keydown', handleKeydown);

    // Listen for messages from background
    chrome.runtime.onMessage.addListener(handleMessage);

    return () => {
      if (observer) {
        observer.stop();
      }
      document.removeEventListener('keydown', handleKeydown);
    };
  });

  function handleKeydown(event: KeyboardEvent) {
    // Ctrl/Cmd + K for command palette
    if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
      event.preventDefault();
      commandPaletteOpen = !commandPaletteOpen;
    }

    // Ctrl/Cmd + B for sidebar
    if ((event.ctrlKey || event.metaKey) && event.key === 'b') {
      event.preventDefault();
      sidebarOpen = !sidebarOpen;
    }
  }

  function handleMessage(message: unknown) {
    // Handle messages from background script
    console.log('[BetterGPT] Message from background:', message);
  }

  async function handleNewMessage(message: ChatGPTMessage) {
    console.log('[BetterGPT] New message captured:', message);

    // Save to database
    try {
      await chrome.runtime.sendMessage({
        type: 'SAVE_MESSAGE',
        conversationId: observer.getCurrentConversationId(),
        message: {
          role: message.role,
          content: message.content,
          timestamp: message.timestamp,
        },
      });
    } catch (error) {
      console.error('[BetterGPT] Failed to save message:', error);
    }
  }

  function handleConversationChange(conversationId: string) {
    console.log('[BetterGPT] Conversation changed:', conversationId);

    // Update conversation metadata
    try {
      chrome.runtime.sendMessage({
        type: 'UPDATE_CONVERSATION',
        conversationId,
        title: observer.getConversationTitle(),
        url: window.location.href,
      });
    } catch (error) {
      console.error('[BetterGPT] Failed to update conversation:', error);
    }
  }

  function closeSidebar() {
    sidebarOpen = false;
  }

  function closeCommandPalette() {
    commandPaletteOpen = false;
  }
</script>

<div class="bettergpt-extension">
  <!-- Toggle Button (floating) -->
  <button
    on:click={() => (sidebarOpen = !sidebarOpen)}
    class="fixed top-4 right-4 z-[9999] bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 shadow-lg transition-all"
    title="Toggle BetterGPT Sidebar (Ctrl+B)"
  >
    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M4 6h16M4 12h16M4 18h16"
      />
    </svg>
  </button>

  <!-- Sidebar -->
  <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />

  <!-- Command Palette -->
  <CommandPalette isOpen={commandPaletteOpen} onClose={closeCommandPalette} />
</div>

<style>
  .bettergpt-extension {
    /* Ensure we don't break ChatGPT's layout */
    position: relative;
    z-index: 9998;
  }
</style>
