/**
 * Test Data Generator for Phase 3 Features
 * 
 * This script creates sample conversations with links to help test:
 * - Conversation forking
 * - Conversation continuation
 * - Graph visualization
 * - Context management
 * 
 * Run this in the browser console to populate test data.
 */

// Import required modules (assumes they're accessible in the extension context)
import { db } from './src/data/database';
import { conversationLinkManager } from './src/managers/conversation-link-manager';
import type { Conversation, ConversationMessage } from './src/content/types';

async function generateTestData() {
  console.log('[TestDataGenerator] Starting...');

  // Helper to create a message
  function createMessage(id: string, role: 'user' | 'assistant', content: string, timestamp: number): ConversationMessage {
    return {
      id,
      role,
      content,
      timestamp,
    };
  }

  // Helper to create a conversation
  function createConversation(id: string, title: string, model: string, messages: ConversationMessage[]): Conversation {
    return {
      id,
      title,
      model,
      createdAt: messages[0]?.timestamp || Date.now(),
      updatedAt: messages[messages.length - 1]?.timestamp || Date.now(),
      messages,
      isArchived: false,
      isFavorite: false,
      tags: [],
    };
  }

  try {
    // Create base conversation 1
    const conv1Messages = [
      createMessage('msg1_1', 'user', 'What is artificial intelligence?', Date.now() - 10000000),
      createMessage('msg1_2', 'assistant', 'Artificial intelligence (AI) is the simulation of human intelligence by machines...', Date.now() - 9900000),
      createMessage('msg1_3', 'user', 'Can you explain machine learning?', Date.now() - 9800000),
      createMessage('msg1_4', 'assistant', 'Machine learning is a subset of AI that enables computers to learn from data...', Date.now() - 9700000),
    ];
    const conv1 = createConversation('test_conv_1', 'AI Fundamentals', 'gpt-4', conv1Messages);
    await db.saveConversation(conv1);
    console.log('[TestDataGenerator] Created conversation 1');

    // Create base conversation 2
    const conv2Messages = [
      createMessage('msg2_1', 'user', 'How do neural networks work?', Date.now() - 8000000),
      createMessage('msg2_2', 'assistant', 'Neural networks are computing systems inspired by biological neural networks...', Date.now() - 7900000),
      createMessage('msg2_3', 'user', 'What are activation functions?', Date.now() - 7800000),
      createMessage('msg2_4', 'assistant', 'Activation functions determine whether a neuron should be activated...', Date.now() - 7700000),
    ];
    const conv2 = createConversation('test_conv_2', 'Neural Networks Deep Dive', 'gpt-4', conv2Messages);
    await db.saveConversation(conv2);
    console.log('[TestDataGenerator] Created conversation 2');

    // Fork conversation 1 at message 2
    const fork1 = await conversationLinkManager.forkAtMessage(
      conv1.id,
      'msg1_2',
      {
        title: 'AI Fundamentals - Deep Learning Path',
        model: 'gpt-4',
      }
    );
    console.log('[TestDataGenerator] Created fork from conversation 1');

    // Continue from fork
    const continuation1 = await conversationLinkManager.continueFromConversation(
      fork1.conversation.id,
      {
        title: 'Deep Learning Advanced Topics',
        model: 'gpt-4-turbo',
      },
      {
        includeAllMessages: true,
      }
    );
    console.log('[TestDataGenerator] Created continuation from fork');

    // Fork conversation 2
    const fork2 = await conversationLinkManager.forkAtMessage(
      conv2.id,
      'msg2_2',
      {
        title: 'Neural Networks - CNN Focus',
        model: 'gpt-4',
      }
    );
    console.log('[TestDataGenerator] Created fork from conversation 2');

    // Create reference link between related topics
    await conversationLinkManager.createReference(
      conv1.id,
      conv2.id,
      'Related AI topics'
    );
    console.log('[TestDataGenerator] Created reference link');

    // Create a standalone conversation
    const conv3Messages = [
      createMessage('msg3_1', 'user', 'Explain blockchain technology', Date.now() - 6000000),
      createMessage('msg3_2', 'assistant', 'Blockchain is a distributed ledger technology...', Date.now() - 5900000),
    ];
    const conv3 = createConversation('test_conv_3', 'Blockchain Basics', 'gpt-3.5-turbo', conv3Messages);
    await db.saveConversation(conv3);
    console.log('[TestDataGenerator] Created standalone conversation 3');

    // Create complex chain: conv1 -> fork -> continuation -> another fork
    const fork3 = await conversationLinkManager.forkAtMessage(
      continuation1.conversation.id,
      continuation1.conversation.messages[0].id,
      {
        title: 'Deep Learning - Computer Vision',
        model: 'gpt-4',
      }
    );
    console.log('[TestDataGenerator] Created complex chain');

    console.log('[TestDataGenerator] ✅ Test data generation complete!');
    console.log('[TestDataGenerator] Created:');
    console.log('  - 3 base conversations');
    console.log('  - 4 forks');
    console.log('  - 1 continuation');
    console.log('  - 1 reference link');
    console.log('  - Complex conversation chains');
    console.log('\nYou can now test:');
    console.log('  - List view to see all conversations');
    console.log('  - Graph view to visualize relationships');
    console.log('  - Context view to explore linked context');
    console.log('  - Fork/Continue actions on any conversation');

  } catch (error) {
    console.error('[TestDataGenerator] ❌ Error:', error);
    throw error;
  }
}

// Export for manual execution
export { generateTestData };

// Auto-run if in browser console
if (typeof window !== 'undefined') {
  console.log('[TestDataGenerator] Run generateTestData() to create test conversations');
}
