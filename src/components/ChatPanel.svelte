<script lang="ts">
  import { onMount } from 'svelte';
  import { capturePageContext } from '../content/context';
  import type { AIStreamChunkMessage } from '../content/types';
  import type { Message } from '../lib/db';

  export let onClose: () => void = () => {};
  export let initialConversationId: number | null = null;
  export let initialMessages: Message[] = [];

  let messageInput = '';
  let messages: Array<{ role: 'user' | 'assistant'; content: string; streaming?: boolean }> = [];
  let isLoading = false;
  let currentConversationId: number | null = null;
  let messagesContainer: HTMLDivElement;

  onMount(() => {
    // Load initial conversation if provided
    if (initialConversationId && initialMessages.length > 0) {
      currentConversationId = initialConversationId;
      messages = initialMessages.map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      }));
      scrollToBottom();
    }

    // Listen for streaming chunks
    chrome.runtime.onMessage.addListener(handleStreamChunk);

    return () => {
      chrome.runtime.onMessage.removeListener(handleStreamChunk);
    };
  });

  function handleStreamChunk(message: AIStreamChunkMessage) {
    if (message.type === 'AI_STREAM_CHUNK') {
      const lastMessage = messages[messages.length - 1];

      if (message.done) {
        // Mark streaming as complete
        if (lastMessage && lastMessage.streaming) {
          messages = messages.map((msg, idx) =>
            idx === messages.length - 1 ? { ...msg, streaming: false } : msg
          );
        }
        isLoading = false;
      } else if (message.chunk) {
        // Append chunk to last message
        if (lastMessage && lastMessage.role === 'assistant' && lastMessage.streaming) {
          messages = messages.map((msg, idx) =>
            idx === messages.length - 1 ? { ...msg, content: msg.content + message.chunk } : msg
          );
        } else {
          // Create new streaming message
          messages = [
            ...messages,
            {
              role: 'assistant',
              content: message.chunk,
              streaming: true,
            },
          ];
        }
        scrollToBottom();
      }
    }
  }

  async function handleSendMessage() {
    if (!messageInput.trim() || isLoading) return;

    const userMessage = messageInput;
    messageInput = '';
    isLoading = true;

    // Add user message to UI
    messages = [...messages, { role: 'user', content: userMessage }];
    scrollToBottom();

    try {
      // Capture page context
      const context = capturePageContext();

      // Send to background script
      const response = await chrome.runtime.sendMessage({
        type: 'AI_REQUEST',
        payload: {
          message: userMessage,
          context,
          conversationId: currentConversationId,
          stream: true,
        },
      });

      if (response.success) {
        if (response.conversationId) {
          currentConversationId = response.conversationId;
        }

        // For non-streaming responses
        if (!response.streaming && response.result) {
          messages = [...messages, { role: 'assistant', content: response.result }];
          isLoading = false;
          scrollToBottom();
        }
      } else {
        // Show error
        messages = [
          ...messages,
          {
            role: 'assistant',
            content: `Error: ${response.error || 'Failed to get response'}`,
          },
        ];
        isLoading = false;
      }
    } catch (error) {
      console.error('[ChatPanel] Error sending message:', error);
      messages = [
        ...messages,
        {
          role: 'assistant',
          content: `Error: ${error instanceof Error ? error.message : 'Failed to send message'}`,
        },
      ];
      isLoading = false;
    }
  }

  function handleKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  }

  function scrollToBottom() {
    setTimeout(() => {
      if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }
    }, 0);
  }

  function newConversation() {
    messages = [];
    currentConversationId = null;
    messageInput = '';
  }
</script>

<div class="chat-panel flex flex-col h-full bg-white">
  <!-- Header -->
  <div
    class="header flex items-center justify-between p-4 border-b border-neutral-200 bg-neutral-50"
  >
    <div class="flex items-center gap-3">
      <h2 class="text-lg font-semibold text-neutral-900">BetterGPT</h2>
      {#if messages.length > 0}
        <button
          on:click={newConversation}
          class="text-sm text-primary-600 hover:text-primary-700 font-medium"
          title="New conversation"
        >
          New Chat
        </button>
      {/if}
    </div>
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

  <!-- Messages -->
  <div bind:this={messagesContainer} class="messages flex-1 overflow-y-auto p-4 space-y-4">
    {#if messages.length === 0}
      <div class="text-center text-neutral-500 py-12">
        <h3 class="text-xl font-medium mb-2">Welcome to BetterGPT</h3>
        <p class="text-sm mb-4">Your personal AI assistant is ready to help!</p>
        <div class="text-xs text-neutral-400 space-y-1">
          <p>• Select text on any page and ask questions</p>
          <p>• Get help with writing, coding, and research</p>
          <p>• Press Ctrl+Shift+A to toggle this panel</p>
        </div>
      </div>
    {:else}
      {#each messages as message}
        <div class="message {message.role === 'user' ? 'user-message' : 'assistant-message'}">
          <div
            class="message-content rounded-lg p-3 {message.role === 'user'
              ? 'bg-primary-600 text-white ml-auto'
              : 'bg-neutral-100 text-neutral-900'} max-w-[80%] whitespace-pre-wrap break-words"
          >
            {message.content}
            {#if message.streaming}
              <span class="inline-block w-2 h-4 bg-neutral-400 ml-1 animate-pulse">|</span>
            {/if}
          </div>
        </div>
      {/each}
    {/if}
  </div>

  <!-- Input -->
  <div class="input-area p-4 border-t border-neutral-200 bg-neutral-50">
    <div class="flex gap-2">
      <textarea
        bind:value={messageInput}
        on:keypress={handleKeyPress}
        placeholder="Type your message..."
        rows="2"
        disabled={isLoading}
        class="input-field flex-1 resize-none disabled:opacity-50"
      />
      <button
        on:click={handleSendMessage}
        disabled={!messageInput.trim() || isLoading}
        class="btn-primary self-end disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Sending...' : 'Send'}
      </button>
    </div>
    {#if isLoading}
      <div class="text-xs text-neutral-500 mt-2">AI is thinking...</div>
    {/if}
  </div>
</div>

<style>
  .chat-panel {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }
</style>
