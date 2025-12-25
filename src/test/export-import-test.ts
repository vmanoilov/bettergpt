/**
 * Export/Import System Test
 * 
 * Tests for the Phase 4 export/import functionality.
 * This file can be loaded in the browser to test the export/import features.
 */

import { exportImportService } from '../managers/export-import-service';
import { db } from '../data/database';
import type { Conversation } from '../content/types';

/**
 * Create a sample conversation for testing
 */
function createSampleConversation(): Conversation {
  return {
    id: `conv_test_${Date.now()}`,
    title: 'Sample Test Conversation',
    model: 'gpt-4',
    createdAt: Date.now() - 86400000, // 1 day ago
    updatedAt: Date.now(),
    messages: [
      {
        id: 'msg_1',
        role: 'user',
        content: 'Hello! Can you help me understand quantum computing?',
        timestamp: Date.now() - 86400000,
      },
      {
        id: 'msg_2',
        role: 'assistant',
        content: 'Of course! Quantum computing is a fascinating field that leverages the principles of quantum mechanics to process information. Unlike classical computers that use bits (0 or 1), quantum computers use quantum bits or "qubits" that can exist in multiple states simultaneously through a phenomenon called superposition.',
        timestamp: Date.now() - 86300000,
      },
      {
        id: 'msg_3',
        role: 'user',
        content: 'What are some practical applications?',
        timestamp: Date.now() - 86200000,
      },
      {
        id: 'msg_4',
        role: 'assistant',
        content: 'Quantum computing has several promising applications:\n\n1. **Cryptography**: Breaking current encryption methods and creating quantum-resistant encryption\n2. **Drug Discovery**: Simulating molecular interactions for pharmaceutical research\n3. **Optimization Problems**: Solving complex logistics and scheduling problems\n4. **Machine Learning**: Accelerating AI training and pattern recognition\n5. **Financial Modeling**: Risk analysis and portfolio optimization',
        timestamp: Date.now() - 86100000,
      },
    ],
    isArchived: false,
    isFavorite: true,
    tags: ['quantum', 'computing', 'technology'],
    totalTokens: 350,
  };
}

/**
 * Test export functionality
 */
async function testExport() {
  console.log('=== Testing Export Functionality ===\n');

  // Create and save a sample conversation
  const conversation = createSampleConversation();
  await db.saveConversation(conversation);
  console.log('✓ Sample conversation created:', conversation.id);

  // Test JSON export
  console.log('\n--- Testing JSON Export ---');
  try {
    await exportImportService.exportConversation(conversation.id, 'json');
    console.log('✓ JSON export successful');
  } catch (error) {
    console.error('✗ JSON export failed:', error);
  }

  // Test Markdown export (Standard)
  console.log('\n--- Testing Markdown Export (Standard) ---');
  try {
    await exportImportService.exportConversation(conversation.id, 'markdown', {
      template: 'standard',
    });
    console.log('✓ Markdown (Standard) export successful');
  } catch (error) {
    console.error('✗ Markdown export failed:', error);
  }

  // Test Markdown export (Obsidian)
  console.log('\n--- Testing Markdown Export (Obsidian) ---');
  try {
    await exportImportService.exportConversation(conversation.id, 'markdown', {
      template: 'obsidian',
    });
    console.log('✓ Markdown (Obsidian) export successful');
  } catch (error) {
    console.error('✗ Markdown (Obsidian) export failed:', error);
  }

  // Test Markdown export (GitHub)
  console.log('\n--- Testing Markdown Export (GitHub) ---');
  try {
    await exportImportService.exportConversation(conversation.id, 'markdown', {
      template: 'github',
    });
    console.log('✓ Markdown (GitHub) export successful');
  } catch (error) {
    console.error('✗ Markdown (GitHub) export failed:', error);
  }

  // Test Plain Text export
  console.log('\n--- Testing Plain Text Export ---');
  try {
    await exportImportService.exportConversation(conversation.id, 'txt');
    console.log('✓ Plain Text export successful');
  } catch (error) {
    console.error('✗ Plain Text export failed:', error);
  }

  // Test HTML export
  console.log('\n--- Testing HTML Export ---');
  try {
    await exportImportService.exportConversation(conversation.id, 'html');
    console.log('✓ HTML export successful');
  } catch (error) {
    console.error('✗ HTML export failed:', error);
  }

  return conversation.id;
}

/**
 * Test import functionality
 */
async function testImport() {
  console.log('\n\n=== Testing Import Functionality ===\n');

  // Create sample JSON import data
  const sampleData = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    conversations: [
      {
        id: 'conv_import_test',
        title: 'Imported Conversation',
        model: 'gpt-3.5-turbo',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [
          {
            id: 'msg_import_1',
            role: 'user',
            content: 'This is an imported message',
            timestamp: Date.now(),
          },
          {
            id: 'msg_import_2',
            role: 'assistant',
            content: 'This is the response',
            timestamp: Date.now(),
          },
        ],
        isArchived: false,
        isFavorite: false,
      },
    ],
  };

  // Test JSON import
  console.log('--- Testing JSON Import ---');
  try {
    const jsonBlob = new Blob([JSON.stringify(sampleData, null, 2)], {
      type: 'application/json',
    });
    const jsonFile = new File([jsonBlob], 'test-import.json', {
      type: 'application/json',
    });

    const count = await exportImportService.importFromFile(jsonFile, 'json');
    console.log(`✓ JSON import successful: ${count} conversation(s) imported`);
  } catch (error) {
    console.error('✗ JSON import failed:', error);
  }

  // Test Markdown import
  console.log('\n--- Testing Markdown Import ---');
  const markdownData = `# Test Markdown Import

## 👤 User

Can you explain what machine learning is?

## 🤖 Assistant

Machine learning is a subset of artificial intelligence that enables systems to learn and improve from experience without being explicitly programmed.

---`;

  try {
    const mdBlob = new Blob([markdownData], { type: 'text/markdown' });
    const mdFile = new File([mdBlob], 'test-import.md', {
      type: 'text/markdown',
    });

    const count = await exportImportService.importFromFile(mdFile, 'markdown');
    console.log(`✓ Markdown import successful: ${count} conversation(s) imported`);
  } catch (error) {
    console.error('✗ Markdown import failed:', error);
  }

  // Test Plain Text import
  console.log('\n--- Testing Plain Text Import ---');
  const textData = `Test Plain Text Import
${'='.repeat(50)}

[USER]
What is artificial intelligence?

[ASSISTANT]
Artificial Intelligence (AI) refers to the simulation of human intelligence in machines.

---`;

  try {
    const txtBlob = new Blob([textData], { type: 'text/plain' });
    const txtFile = new File([txtBlob], 'test-import.txt', {
      type: 'text/plain',
    });

    const count = await exportImportService.importFromFile(txtFile, 'txt');
    console.log(`✓ Plain Text import successful: ${count} conversation(s) imported`);
  } catch (error) {
    console.error('✗ Plain Text import failed:', error);
  }
}

/**
 * Test template system
 */
async function testTemplates() {
  console.log('\n\n=== Testing Template System ===\n');

  // List available templates
  console.log('--- Available Templates ---');
  const templates = exportImportService.getTemplates();
  templates.forEach(template => {
    console.log(`- ${template.name} (${template.format}): ${template.description}`);
  });

  // List template variables
  console.log('\n--- Template Variables ---');
  const variables = exportImportService.getTemplateVariables();
  variables.forEach(variable => {
    console.log(`- {{${variable.name}}}: ${variable.description}`);
  });

  // Create a custom template
  console.log('\n--- Creating Custom Template ---');
  try {
    exportImportService.createTemplate({
      id: 'custom-simple',
      name: 'Simple Custom Template',
      format: 'txt',
      template: `{{title}}

Model: {{model}}
Messages: {{messageCount}}

{{#each messages}}
[{{role}}] {{content}}

{{/each}}`,
      description: 'A simple custom template',
    });
    console.log('✓ Custom template created successfully');
  } catch (error) {
    console.error('✗ Custom template creation failed:', error);
  }
}

/**
 * Test bulk export
 */
async function testBulkExport() {
  console.log('\n\n=== Testing Bulk Export ===\n');

  // Create multiple conversations
  const conversations: string[] = [];
  for (let i = 0; i < 3; i++) {
    const conv = createSampleConversation();
    conv.id = `conv_bulk_${i}_${Date.now()}`;
    conv.title = `Bulk Export Test ${i + 1}`;
    await db.saveConversation(conv);
    conversations.push(conv.id);
    console.log(`✓ Created conversation ${i + 1}:`, conv.id);
  }

  // Export multiple conversations
  console.log('\n--- Exporting Multiple Conversations ---');
  try {
    await exportImportService.exportMultipleConversations(conversations, 'json');
    console.log('✓ Bulk export successful');
  } catch (error) {
    console.error('✗ Bulk export failed:', error);
  }
}

/**
 * Run all tests
 */
export async function runAllTests() {
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║   Phase 4 Export/Import System Tests            ║');
  console.log('╚══════════════════════════════════════════════════╝\n');

  try {
    await testExport();
    await testImport();
    await testTemplates();
    await testBulkExport();

    console.log('\n\n╔══════════════════════════════════════════════════╗');
    console.log('║   All Tests Completed!                           ║');
    console.log('╚══════════════════════════════════════════════════╝\n');
  } catch (error) {
    console.error('\n\n✗ Test suite failed:', error);
  }
}

// Export test functions
export { testExport, testImport, testTemplates, testBulkExport };
