<script lang="ts">
  export let onClose: () => void = () => {};

  let messageInput = '';
  let messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];

  function handleSendMessage() {
    if (!messageInput.trim()) return;

    messages = [...messages, { role: 'user', content: messageInput }];
    messageInput = '';

    // TODO: Implement AI request logic
    setTimeout(() => {
      messages = [
        ...messages,
        {
          role: 'assistant',
          content: 'This is a placeholder response. AI integration coming soon!',
        },
      ];
    }, 500);
  }

  function handleKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  }
</script>

<div class="chat-panel flex flex-col h-full bg-white">
  <!-- Header -->
  <div
    class="header flex items-center justify-between p-4 border-b border-neutral-200 bg-neutral-50"
  >
    <h2 class="text-lg font-semibold text-neutral-900">BetterGPT</h2>
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
  <div class="messages flex-1 overflow-y-auto p-4 space-y-4">
    {#if messages.length === 0}
      <div class="text-center text-neutral-500 py-12">
        <h3 class="text-xl font-medium mb-2">Welcome to BetterGPT</h3>
        <p class="text-sm">Your personal AI assistant is ready to help!</p>
      </div>
    {:else}
      {#each messages as message}
        <div class="message {message.role === 'user' ? 'user-message' : 'assistant-message'}">
          <div
            class="message-content rounded-lg p-3 {message.role === 'user'
              ? 'bg-primary-600 text-white ml-auto'
              : 'bg-neutral-100 text-neutral-900'} max-w-[80%]"
          >
            {message.content}
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
        class="input-field flex-1 resize-none"
      />
      <button
        on:click={handleSendMessage}
        disabled={!messageInput.trim()}
        class="btn-primary self-end disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Send
      </button>
    </div>
  </div>
</div>

<style>
  .chat-panel {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }
</style>
