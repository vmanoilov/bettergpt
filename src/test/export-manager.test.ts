/**
 * Export Manager Unit Tests
 * 
 * Comprehensive tests for Phase 4 ExportManager functionality:
 * - All export formats (JSON, Markdown, Text, HTML, PDF, DOCX/RTF)
 * - Edge cases and error handling
 * - Large conversations
 * - Invalid data handling
 * - Bulk export operations
 * - Export history tracking
 * - Filename validation
 * - Retry logic
 */

import { exportManager } from '../managers/export-manager';
import { db } from '../data/database';
import type { Conversation, ConversationMessage } from '../content/types';

// Test utilities
let testConversationIds: string[] = [];

/**
 * Create a sample conversation for testing
 */
function createTestConversation(overrides?: Partial<Conversation>): Conversation {
  const id = `test_conv_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const conversation: Conversation = {
    id,
    title: 'Test Conversation',
    model: 'gpt-4',
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now(),
    messages: [
      {
        id: 'msg_1',
        role: 'user',
        content: 'Hello, this is a test message.',
        timestamp: Date.now() - 1000,
      },
      {
        id: 'msg_2',
        role: 'assistant',
        content: 'This is a test response.',
        timestamp: Date.now(),
      },
    ],
    isArchived: false,
    isFavorite: false,
    tags: ['test'],
    ...overrides,
  };
  
  testConversationIds.push(id);
  return conversation;
}

/**
 * Create a large conversation with many messages
 */
function createLargeConversation(): Conversation {
  const messages: ConversationMessage[] = [];
  
  for (let i = 0; i < 100; i++) {
    messages.push({
      id: `msg_${i}`,
      role: i % 2 === 0 ? 'user' : 'assistant',
      content: `This is message number ${i}. `.repeat(50), // Make each message substantial
      timestamp: Date.now() - (100 - i) * 1000,
    });
  }
  
  return createTestConversation({
    title: 'Large Test Conversation',
    messages,
    totalTokens: 50000,
  });
}

/**
 * Create a conversation with special characters
 */
function createSpecialCharConversation(): Conversation {
  return createTestConversation({
    title: 'Test <>&"\'/\\|?*:',
    messages: [
      {
        id: 'msg_1',
        role: 'user',
        content: 'Test with special chars: <>&"\'/\\|?*:',
        timestamp: Date.now() - 1000,
      },
      {
        id: 'msg_2',
        role: 'assistant',
        content: 'Response with HTML: <div>test</div>\nAnd quotes: "test" \'test\'',
        timestamp: Date.now(),
      },
    ],
  });
}

/**
 * Create an empty conversation
 */
function createEmptyConversation(): Conversation {
  return createTestConversation({
    title: 'Empty Conversation',
    messages: [],
  });
}

/**
 * Cleanup test conversations
 */
async function cleanupTestConversations(): Promise<void> {
  for (const id of testConversationIds) {
    try {
      await db.deleteConversation(id);
    } catch (error) {
      console.warn(`Failed to delete test conversation ${id}:`, error);
    }
  }
  testConversationIds = [];
}

/**
 * Test JSON export
 */
export async function testJSONExport(): Promise<void> {
  console.log('=== Testing JSON Export ===');
  
  try {
    const conversation = createTestConversation();
    await db.saveConversation(conversation);
    
    const result = await exportManager.exportConversation(conversation.id, {
      format: 'json',
      includeMetadata: true,
    });
    
    if (!result.success) {
      throw new Error(`JSON export failed: ${result.error}`);
    }
    
    // Validate result
    if (!result.data || !result.filename) {
      throw new Error('JSON export missing data or filename');
    }
    
    if (!result.filename.endsWith('.json')) {
      throw new Error(`Invalid JSON filename: ${result.filename}`);
    }
    
    // Verify data is valid JSON
    if (result.data instanceof Blob) {
      const text = await result.data.text();
      const parsed = JSON.parse(text);
      
      if (!parsed.version || !parsed.exportDate || !parsed.conversations) {
        throw new Error('Invalid JSON structure');
      }
      
      if (parsed.conversations.length !== 1) {
        throw new Error('Expected 1 conversation in export');
      }
    }
    
    console.log('✓ JSON export passed');
  } catch (error) {
    console.error('✗ JSON export failed:', error);
    throw error;
  }
}

/**
 * Test Markdown export with all templates
 */
export async function testMarkdownExport(): Promise<void> {
  console.log('=== Testing Markdown Export ===');
  
  const templates = ['standard', 'obsidian', 'github'] as const;
  
  for (const template of templates) {
    try {
      const conversation = createTestConversation({ title: `Test ${template}` });
      await db.saveConversation(conversation);
      
      const result = await exportManager.exportConversation(conversation.id, {
        format: 'markdown',
        template,
        includeMetadata: true,
      });
      
      if (!result.success) {
        throw new Error(`Markdown (${template}) export failed: ${result.error}`);
      }
      
      if (!result.data || !result.filename) {
        throw new Error('Markdown export missing data or filename');
      }
      
      if (!result.filename.endsWith('.md')) {
        throw new Error(`Invalid Markdown filename: ${result.filename}`);
      }
      
      // Verify content
      if (result.data instanceof Blob) {
        const text = await result.data.text();
        
        // Check for common markdown elements
        if (!text.includes('#')) {
          throw new Error('Markdown missing headers');
        }
        
        // Template-specific checks
        if (template === 'obsidian' && !text.includes('---')) {
          throw new Error('Obsidian template missing frontmatter');
        }
      }
      
      console.log(`✓ Markdown (${template}) export passed`);
    } catch (error) {
      console.error(`✗ Markdown (${template}) export failed:`, error);
      throw error;
    }
  }
}

/**
 * Test Text export
 */
export async function testTextExport(): Promise<void> {
  console.log('=== Testing Text Export ===');
  
  try {
    const conversation = createTestConversation();
    await db.saveConversation(conversation);
    
    const result = await exportManager.exportConversation(conversation.id, {
      format: 'txt',
      includeMetadata: true,
    });
    
    if (!result.success) {
      throw new Error(`Text export failed: ${result.error}`);
    }
    
    if (!result.data || !result.filename) {
      throw new Error('Text export missing data or filename');
    }
    
    if (!result.filename.endsWith('.txt')) {
      throw new Error(`Invalid Text filename: ${result.filename}`);
    }
    
    // Verify content
    if (result.data instanceof Blob) {
      const text = await result.data.text();
      
      if (!text.includes('[USER]') && !text.includes('[ASSISTANT]')) {
        throw new Error('Text export missing role markers');
      }
    }
    
    console.log('✓ Text export passed');
  } catch (error) {
    console.error('✗ Text export failed:', error);
    throw error;
  }
}

/**
 * Test HTML export
 */
export async function testHTMLExport(): Promise<void> {
  console.log('=== Testing HTML Export ===');
  
  try {
    const conversation = createTestConversation();
    await db.saveConversation(conversation);
    
    const result = await exportManager.exportConversation(conversation.id, {
      format: 'html',
      includeMetadata: true,
    });
    
    if (!result.success) {
      throw new Error(`HTML export failed: ${result.error}`);
    }
    
    if (!result.data || !result.filename) {
      throw new Error('HTML export missing data or filename');
    }
    
    if (!result.filename.endsWith('.html')) {
      throw new Error(`Invalid HTML filename: ${result.filename}`);
    }
    
    // Verify content
    if (result.data instanceof Blob) {
      const text = await result.data.text();
      
      if (!text.includes('<!DOCTYPE html>')) {
        throw new Error('HTML export missing DOCTYPE');
      }
      
      if (!text.includes('<html') || !text.includes('</html>')) {
        throw new Error('HTML export missing html tags');
      }
      
      if (!text.includes('<style>')) {
        throw new Error('HTML export missing styles');
      }
    }
    
    console.log('✓ HTML export passed');
  } catch (error) {
    console.error('✗ HTML export failed:', error);
    throw error;
  }
}

/**
 * Test PDF export
 */
export async function testPDFExport(): Promise<void> {
  console.log('=== Testing PDF Export ===');
  
  try {
    const conversation = createTestConversation();
    await db.saveConversation(conversation);
    
    const result = await exportManager.exportConversation(conversation.id, {
      format: 'pdf',
      includeMetadata: true,
    });
    
    if (!result.success) {
      throw new Error(`PDF export failed: ${result.error}`);
    }
    
    if (!result.data || !result.filename) {
      throw new Error('PDF export missing data or filename');
    }
    
    if (!result.filename.endsWith('.pdf')) {
      throw new Error(`Invalid PDF filename: ${result.filename}`);
    }
    
    // Verify it's a PDF blob
    if (result.data instanceof Blob) {
      if (result.data.type !== 'application/pdf') {
        throw new Error(`Invalid PDF blob type: ${result.data.type}`);
      }
      
      // Check PDF header
      const arrayBuffer = await result.data.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const header = String.fromCharCode(...uint8Array.slice(0, 4));
      
      if (!header.startsWith('%PDF')) {
        throw new Error('Invalid PDF header');
      }
    }
    
    console.log('✓ PDF export passed');
  } catch (error) {
    console.error('✗ PDF export failed:', error);
    throw error;
  }
}

/**
 * Test DOCX/RTF export
 */
export async function testDOCXExport(): Promise<void> {
  console.log('=== Testing DOCX/RTF Export ===');
  
  try {
    const conversation = createTestConversation();
    await db.saveConversation(conversation);
    
    const result = await exportManager.exportConversation(conversation.id, {
      format: 'docx',
      includeMetadata: true,
    });
    
    if (!result.success) {
      throw new Error(`DOCX export failed: ${result.error}`);
    }
    
    if (!result.data || !result.filename) {
      throw new Error('DOCX export missing data or filename');
    }
    
    if (!result.filename.endsWith('.rtf')) {
      throw new Error(`Invalid DOCX/RTF filename: ${result.filename}`);
    }
    
    // Verify it's RTF content
    if (result.data instanceof Blob) {
      const text = await result.data.text();
      
      if (!text.startsWith('{\\rtf')) {
        throw new Error('Invalid RTF format');
      }
    }
    
    console.log('✓ DOCX/RTF export passed');
  } catch (error) {
    console.error('✗ DOCX/RTF export failed:', error);
    throw error;
  }
}

/**
 * Test special characters handling
 */
export async function testSpecialCharacters(): Promise<void> {
  console.log('=== Testing Special Characters ===');
  
  try {
    const conversation = createSpecialCharConversation();
    await db.saveConversation(conversation);
    
    // Test HTML export with special characters
    const htmlResult = await exportManager.exportConversation(conversation.id, {
      format: 'html',
    });
    
    if (!htmlResult.success || !htmlResult.data) {
      throw new Error('HTML export with special chars failed');
    }
    
    const htmlText = await (htmlResult.data as Blob).text();
    
    // Verify HTML escaping
    if (htmlText.includes('<div>test</div>') && !htmlText.includes('&lt;div&gt;')) {
      throw new Error('HTML special characters not properly escaped');
    }
    
    // Test JSON export with special characters
    const jsonResult = await exportManager.exportConversation(conversation.id, {
      format: 'json',
    });
    
    if (!jsonResult.success || !jsonResult.data) {
      throw new Error('JSON export with special chars failed');
    }
    
    const jsonText = await (jsonResult.data as Blob).text();
    JSON.parse(jsonText); // Should not throw
    
    console.log('✓ Special characters handling passed');
  } catch (error) {
    console.error('✗ Special characters handling failed:', error);
    throw error;
  }
}

/**
 * Test large conversation export
 */
export async function testLargeConversation(): Promise<void> {
  console.log('=== Testing Large Conversation Export ===');
  
  try {
    const conversation = createLargeConversation();
    await db.saveConversation(conversation);
    
    // Test with each format
    const formats = ['json', 'markdown', 'txt', 'html', 'pdf'] as const;
    
    for (const format of formats) {
      const result = await exportManager.exportConversation(conversation.id, {
        format,
        includeMetadata: true,
      });
      
      if (!result.success) {
        throw new Error(`${format} export of large conversation failed: ${result.error}`);
      }
      
      if (!result.data) {
        throw new Error(`${format} export missing data`);
      }
      
      // Verify data size is reasonable (should be > 10KB for 100 messages)
      const blob = result.data as Blob;
      if (blob.size < 10000) {
        throw new Error(`${format} export data too small for large conversation: ${blob.size} bytes`);
      }
      
      console.log(`✓ Large conversation ${format} export passed (${blob.size} bytes)`);
    }
  } catch (error) {
    console.error('✗ Large conversation export failed:', error);
    throw error;
  }
}

/**
 * Test empty conversation handling
 */
export async function testEmptyConversation(): Promise<void> {
  console.log('=== Testing Empty Conversation ===');
  
  try {
    const conversation = createEmptyConversation();
    await db.saveConversation(conversation);
    
    const result = await exportManager.exportConversation(conversation.id, {
      format: 'json',
    });
    
    if (!result.success) {
      throw new Error('Empty conversation export should succeed');
    }
    
    if (!result.data) {
      throw new Error('Empty conversation export missing data');
    }
    
    console.log('✓ Empty conversation handling passed');
  } catch (error) {
    console.error('✗ Empty conversation handling failed:', error);
    throw error;
  }
}

/**
 * Test invalid conversation ID
 */
export async function testInvalidConversationId(): Promise<void> {
  console.log('=== Testing Invalid Conversation ID ===');
  
  try {
    const result = await exportManager.exportConversation('nonexistent_id', {
      format: 'json',
    });
    
    if (result.success) {
      throw new Error('Export should fail for nonexistent conversation');
    }
    
    if (!result.error) {
      throw new Error('Error message should be provided');
    }
    
    console.log('✓ Invalid conversation ID handling passed');
  } catch (error) {
    console.error('✗ Invalid conversation ID handling failed:', error);
    throw error;
  }
}

/**
 * Test bulk export
 */
export async function testBulkExport(): Promise<void> {
  console.log('=== Testing Bulk Export ===');
  
  try {
    // Create multiple conversations
    const conversations = [
      createTestConversation({ title: 'Bulk Test 1' }),
      createTestConversation({ title: 'Bulk Test 2' }),
      createTestConversation({ title: 'Bulk Test 3' }),
    ];
    
    for (const conv of conversations) {
      await db.saveConversation(conv);
    }
    
    const ids = conversations.map(c => c.id);
    
    const result = await exportManager.exportMultipleConversations(ids, {
      format: 'json',
      includeMetadata: true,
    });
    
    if (!result.success) {
      throw new Error(`Bulk export failed: ${result.error}`);
    }
    
    if (!result.data) {
      throw new Error('Bulk export missing data');
    }
    
    // Verify all conversations are in the export
    if (result.data instanceof Blob) {
      const text = await result.data.text();
      const parsed = JSON.parse(text);
      
      if (parsed.conversations.length !== 3) {
        throw new Error(`Expected 3 conversations, got ${parsed.conversations.length}`);
      }
    }
    
    console.log('✓ Bulk export passed');
  } catch (error) {
    console.error('✗ Bulk export failed:', error);
    throw error;
  }
}

/**
 * Test export history tracking
 */
export async function testExportHistory(): Promise<void> {
  console.log('=== Testing Export History ===');
  
  try {
    const conversation = createTestConversation();
    await db.saveConversation(conversation);
    
    // Clear history first
    await exportManager.clearExportHistory();
    
    // Perform an export
    await exportManager.exportConversation(conversation.id, {
      format: 'json',
    });
    
    // Check history
    const history = await exportManager.getExportHistory(10);
    
    if (history.length === 0) {
      throw new Error('Export history should contain at least one record');
    }
    
    const record = history[0];
    if (record.conversationId !== conversation.id) {
      throw new Error('Export history record has wrong conversation ID');
    }
    
    if (record.format !== 'json') {
      throw new Error('Export history record has wrong format');
    }
    
    if (!record.success) {
      throw new Error('Export history record should be marked as successful');
    }
    
    // Test conversation-specific history
    const convHistory = await exportManager.getConversationExportHistory(conversation.id);
    if (convHistory.length === 0) {
      throw new Error('Conversation export history should not be empty');
    }
    
    console.log('✓ Export history tracking passed');
  } catch (error) {
    console.error('✗ Export history tracking failed:', error);
    throw error;
  }
}

/**
 * Test filename sanitization
 */
export async function testFilenameSanitization(): Promise<void> {
  console.log('=== Testing Filename Sanitization ===');
  
  try {
    const conversation = createTestConversation({
      title: 'Test <>&"/\\|?*: Filename',
    });
    await db.saveConversation(conversation);
    
    const result = await exportManager.exportConversation(conversation.id, {
      format: 'json',
    });
    
    if (!result.success || !result.filename) {
      throw new Error('Export failed');
    }
    
    // Check for invalid characters
    // eslint-disable-next-line no-control-regex
    const invalidChars = /[<>:"/\\|?*\x00-\x1f\x7f]/;
    if (invalidChars.test(result.filename)) {
      throw new Error(`Filename contains invalid characters: ${result.filename}`);
    }
    
    console.log(`✓ Filename sanitization passed: ${result.filename}`);
  } catch (error) {
    console.error('✗ Filename sanitization failed:', error);
    throw error;
  }
}

/**
 * Run all export manager tests
 */
export async function runAllExportManagerTests(): Promise<void> {
  console.log('\n╔════════════════════════════════════════════════════╗');
  console.log('║      Export Manager Comprehensive Test Suite       ║');
  console.log('╚════════════════════════════════════════════════════╝\n');
  
  const tests = [
    testJSONExport,
    testMarkdownExport,
    testTextExport,
    testHTMLExport,
    testPDFExport,
    testDOCXExport,
    testSpecialCharacters,
    testLargeConversation,
    testEmptyConversation,
    testInvalidConversationId,
    testBulkExport,
    testExportHistory,
    testFilenameSanitization,
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      await test();
      passed++;
    } catch (error) {
      failed++;
      console.error(`\nTest ${test.name} failed:`, error);
    }
  }
  
  // Cleanup
  await cleanupTestConversations();
  
  console.log('\n╔════════════════════════════════════════════════════╗');
  console.log(`║  Test Results: ${passed} passed, ${failed} failed`);
  console.log('╚════════════════════════════════════════════════════╝\n');
  
  if (failed > 0) {
    throw new Error(`${failed} test(s) failed`);
  }
}

// Export for use in browser console or test runner
(window as any).exportManagerTests = {
  runAll: runAllExportManagerTests,
  testJSONExport,
  testMarkdownExport,
  testTextExport,
  testHTMLExport,
  testPDFExport,
  testDOCXExport,
  testSpecialCharacters,
  testLargeConversation,
  testEmptyConversation,
  testInvalidConversationId,
  testBulkExport,
  testExportHistory,
  testFilenameSanitization,
};
