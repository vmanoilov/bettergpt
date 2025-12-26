/**
 * UI Integration Example for Export/Import System
 * 
 * This file demonstrates how to integrate the export/import functionality
 * into the BetterGPT UI components.
 */

import { exportImportService } from '../../managers/export-import-service';
import type { ExportFormat, ImportFormat } from '../../managers/export-import-service';

/**
 * Example: Export button handler for a conversation
 */
export function createExportButton(conversationId: string): HTMLButtonElement {
  const button = document.createElement('button');
  button.textContent = '📤 Export';
  button.className = 'export-button';
  
  button.onclick = () => showExportDialog(conversationId);
  
  return button;
}

/**
 * Example: Export dialog with format selection
 */
function showExportDialog(conversationId: string): void {
  // Create modal
  const modal = document.createElement('div');
  modal.className = 'modal export-modal';
  
  modal.innerHTML = `
    <div class="modal-content">
      <h2>Export Conversation</h2>
      
      <div class="format-selector">
        <label>Select Format:</label>
        <select id="exportFormat">
          <option value="json">JSON (Full Data)</option>
          <option value="markdown">Markdown</option>
          <option value="txt">Plain Text</option>
          <option value="html">HTML</option>
          <option value="pdf">PDF</option>
        </select>
      </div>
      
      <div class="template-selector" id="templateSelector" style="display: none;">
        <label>Template:</label>
        <select id="exportTemplate">
          <option value="standard">Standard</option>
          <option value="obsidian">Obsidian</option>
          <option value="github">GitHub</option>
        </select>
      </div>
      
      <div class="options">
        <label>
          <input type="checkbox" id="includeMetadata" checked>
          Include metadata
        </label>
        <label>
          <input type="checkbox" id="includeThreads">
          Include thread conversations
        </label>
      </div>
      
      <div class="button-group">
        <button class="primary" id="exportBtn">Export</button>
        <button class="secondary" id="cancelBtn">Cancel</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Show template selector for markdown
  const formatSelect = modal.querySelector('#exportFormat') as HTMLSelectElement;
  const templateSelector = modal.querySelector('#templateSelector') as HTMLElement;
  
  formatSelect.onchange = () => {
    if (formatSelect.value === 'markdown') {
      templateSelector.style.display = 'block';
    } else {
      templateSelector.style.display = 'none';
    }
  };
  
  // Export button handler
  const exportBtn = modal.querySelector('#exportBtn') as HTMLButtonElement;
  exportBtn.onclick = async () => {
    const format = formatSelect.value as ExportFormat;
    const template = (modal.querySelector('#exportTemplate') as HTMLSelectElement).value;
    const includeMetadata = (modal.querySelector('#includeMetadata') as HTMLInputElement).checked;
    const includeThreads = (modal.querySelector('#includeThreads') as HTMLInputElement).checked;
    
    try {
      exportBtn.disabled = true;
      exportBtn.textContent = 'Exporting...';
      
      await exportImportService.exportConversation(conversationId, format, {
        template: format === 'markdown' ? template : undefined,
        includeMetadata,
        includeThreads,
      });
      
      // Show success message
      showNotification('Export completed successfully!', 'success');
      
      // Close modal
      document.body.removeChild(modal);
    } catch (error) {
      showNotification(`Export failed: ${error}`, 'error');
      exportBtn.disabled = false;
      exportBtn.textContent = 'Export';
    }
  };
  
  // Cancel button handler
  const cancelBtn = modal.querySelector('#cancelBtn') as HTMLButtonElement;
  cancelBtn.onclick = () => {
    document.body.removeChild(modal);
  };
}

/**
 * Example: Bulk export button handler
 */
export function createBulkExportButton(conversationIds: string[]): HTMLButtonElement {
  const button = document.createElement('button');
  button.textContent = `📦 Export ${conversationIds.length} Conversations`;
  button.className = 'bulk-export-button';
  
  button.onclick = async () => {
    try {
      button.disabled = true;
      button.textContent = 'Exporting...';
      
      await exportImportService.exportMultipleConversations(conversationIds, 'json');
      
      showNotification(`Successfully exported ${conversationIds.length} conversations!`, 'success');
    } catch (error) {
      showNotification(`Bulk export failed: ${error}`, 'error');
    } finally {
      button.disabled = false;
      button.textContent = `📦 Export ${conversationIds.length} Conversations`;
    }
  };
  
  return button;
}

/**
 * Example: Import button handler
 */
export function createImportButton(): HTMLButtonElement {
  const button = document.createElement('button');
  button.textContent = '📥 Import';
  button.className = 'import-button';
  
  button.onclick = () => showImportDialog();
  
  return button;
}

/**
 * Example: Import dialog
 */
function showImportDialog(): void {
  // Create modal
  const modal = document.createElement('div');
  modal.className = 'modal import-modal';
  
  modal.innerHTML = `
    <div class="modal-content">
      <h2>Import Conversations</h2>
      
      <div class="format-selector">
        <label>Select Format:</label>
        <select id="importFormat">
          <option value="json">JSON (BetterGPT)</option>
          <option value="markdown">Markdown</option>
          <option value="chatgpt">ChatGPT Export</option>
          <option value="txt">Plain Text</option>
        </select>
      </div>
      
      <div class="file-input">
        <input type="file" id="importFile" accept=".json,.md,.txt,.markdown">
        <label for="importFile" class="file-label">
          📁 Choose File
        </label>
        <span id="fileName">No file selected</span>
      </div>
      
      <div class="options">
        <label>
          <input type="checkbox" id="generateNewIds" checked>
          Generate new IDs (recommended)
        </label>
        <label>
          <input type="checkbox" id="preserveFolders">
          Preserve folder structure
        </label>
      </div>
      
      <div class="button-group">
        <button class="primary" id="importBtn" disabled>Import</button>
        <button class="secondary" id="cancelBtn">Cancel</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // File input handler
  const fileInput = modal.querySelector('#importFile') as HTMLInputElement;
  const fileName = modal.querySelector('#fileName') as HTMLElement;
  const importBtn = modal.querySelector('#importBtn') as HTMLButtonElement;
  
  fileInput.onchange = () => {
    if (fileInput.files && fileInput.files.length > 0) {
      fileName.textContent = fileInput.files[0].name;
      importBtn.disabled = false;
    } else {
      fileName.textContent = 'No file selected';
      importBtn.disabled = true;
    }
  };
  
  // Import button handler
  importBtn.onclick = async () => {
    if (!fileInput.files || fileInput.files.length === 0) return;
    
    const file = fileInput.files[0];
    const format = (modal.querySelector('#importFormat') as HTMLSelectElement).value as ImportFormat;
    const generateNewIds = (modal.querySelector('#generateNewIds') as HTMLInputElement).checked;
    const preserveFolders = (modal.querySelector('#preserveFolders') as HTMLInputElement).checked;
    
    try {
      importBtn.disabled = true;
      importBtn.textContent = 'Importing...';
      
      const count = await exportImportService.importFromFile(file, format, {
        generateNewIds,
        preserveFolders,
      });
      
      showNotification(`Successfully imported ${count} conversation(s)!`, 'success');
      
      // Close modal and refresh conversation list
      document.body.removeChild(modal);
      
      // Trigger conversation list refresh
      window.dispatchEvent(new CustomEvent('conversations-updated'));
    } catch (error) {
      showNotification(`Import failed: ${error}`, 'error');
      importBtn.disabled = false;
      importBtn.textContent = 'Import';
    }
  };
  
  // Cancel button handler
  const cancelBtn = modal.querySelector('#cancelBtn') as HTMLButtonElement;
  cancelBtn.onclick = () => {
    document.body.removeChild(modal);
  };
}

/**
 * Example: Export menu for conversation context menu
 */
export function createExportMenu(conversationId: string): HTMLElement {
  const menu = document.createElement('div');
  menu.className = 'export-menu';
  
  const formats = [
    { id: 'json', name: 'JSON', icon: '📄' },
    { id: 'markdown', name: 'Markdown', icon: '📝' },
    { id: 'txt', name: 'Plain Text', icon: '📃' },
    { id: 'html', name: 'HTML', icon: '🌐' },
  ];
  
  formats.forEach(format => {
    const item = document.createElement('div');
    item.className = 'menu-item';
    item.innerHTML = `${format.icon} Export as ${format.name}`;
    
    item.onclick = async () => {
      try {
        await exportImportService.exportConversation(
          conversationId,
          format.id as ExportFormat
        );
        showNotification(`Exported as ${format.name}`, 'success');
      } catch (error) {
        showNotification(`Export failed: ${error}`, 'error');
      }
    };
    
    menu.appendChild(item);
  });
  
  return menu;
}

/**
 * Example: Quick export button with default format
 */
export function createQuickExportButton(
  conversationId: string,
  format: ExportFormat = 'json'
): HTMLButtonElement {
  const button = document.createElement('button');
  button.textContent = `Export (${format.toUpperCase()})`;
  button.className = 'quick-export-button';
  
  button.onclick = async () => {
    try {
      button.disabled = true;
      await exportImportService.exportConversation(conversationId, format);
      showNotification('Export completed!', 'success');
    } catch (error) {
      showNotification(`Export failed: ${error}`, 'error');
    } finally {
      button.disabled = false;
    }
  };
  
  return button;
}

/**
 * Helper: Show notification
 */
function showNotification(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  // Auto-remove after 3 seconds
  setTimeout(() => {
    notification.classList.add('fade-out');
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 300);
  }, 3000);
}

/**
 * Example: Initialize export/import in UI manager
 */
export function initializeExportImport(): void {
  console.log('[Export/Import] Initializing UI integration');
  
  // Add import button to toolbar
  const toolbar = document.querySelector('.toolbar');
  if (toolbar) {
    const importBtn = createImportButton();
    toolbar.appendChild(importBtn);
  }
  
  // Listen for conversation selection
  window.addEventListener('conversation-selected', ((event: CustomEvent) => {
    const conversationId = event.detail.conversationId;
    
    // Add export button to conversation actions
    const actions = document.querySelector('.conversation-actions');
    if (actions) {
      const exportBtn = createExportButton(conversationId);
      actions.appendChild(exportBtn);
    }
  }) as EventListener);
  
  // Listen for bulk selection
  window.addEventListener('conversations-selected', ((event: CustomEvent) => {
    const conversationIds = event.detail.conversationIds;
    
    if (conversationIds.length > 1) {
      const bulkActions = document.querySelector('.bulk-actions');
      if (bulkActions) {
        const bulkExportBtn = createBulkExportButton(conversationIds);
        bulkActions.appendChild(bulkExportBtn);
      }
    }
  }) as EventListener);
  
  console.log('[Export/Import] UI integration initialized');
}

/**
 * Export Settings UI Component
 * Provides interface for configuring auto-export, format selection, and viewing history
 */
export function createExportSettingsButton(): HTMLButtonElement {
  const button = document.createElement('button');
  button.textContent = '⚙️ Export Settings';
  button.className = 'export-settings-button';
  
  button.onclick = () => showExportSettingsDialog();
  
  return button;
}

/**
 * Show export settings dialog
 */
async function showExportSettingsDialog(): Promise<void> {
  const { exportManager } = await import('../../managers/export-manager');
  
  // Get current export history
  const history = await exportManager.getExportHistory(20);
  
  // Create modal
  const modal = document.createElement('div');
  modal.className = 'modal export-settings-modal';
  
  const historyHTML = history.map(record => `
    <tr class="${record.success ? 'success' : 'failure'}">
      <td>${new Date(record.timestamp).toLocaleString()}</td>
      <td>${record.format.toUpperCase()}</td>
      <td>${record.filename}</td>
      <td>${record.success ? '✓' : '✗'}</td>
      <td>${record.error || '-'}</td>
    </tr>
  `).join('');
  
  modal.innerHTML = `
    <div class="modal-content export-settings-content">
      <h2>Export Settings & History</h2>
      
      <div class="settings-section">
        <h3>Auto-Export Settings</h3>
        <p class="note">Configure automatic export when conversations are completed (Future feature)</p>
        
        <div class="setting-item">
          <label>
            <input type="checkbox" id="autoExportEnabled" disabled>
            Enable auto-export
          </label>
        </div>
        
        <div class="setting-item">
          <label>Default Export Format:</label>
          <select id="autoExportFormat" disabled>
            <option value="json">JSON</option>
            <option value="markdown">Markdown</option>
            <option value="txt">Text</option>
            <option value="html">HTML</option>
            <option value="pdf">PDF</option>
            <option value="docx">DOCX/RTF</option>
          </select>
        </div>
      </div>
      
      <div class="history-section">
        <h3>Export History</h3>
        <div class="history-actions">
          <button class="secondary small" id="clearHistoryBtn">Clear History</button>
          <button class="secondary small" id="refreshHistoryBtn">Refresh</button>
        </div>
        
        ${history.length === 0 ? `
          <p class="no-history">No export history yet. Exports will be tracked here.</p>
        ` : `
          <div class="history-table-wrapper">
            <table class="history-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Format</th>
                  <th>Filename</th>
                  <th>Status</th>
                  <th>Error</th>
                </tr>
              </thead>
              <tbody>
                ${historyHTML}
              </tbody>
            </table>
          </div>
        `}
      </div>
      
      <div class="button-group">
        <button class="primary" id="closeBtn">Close</button>
      </div>
      
      <style>
        .export-settings-modal .modal-content {
          max-width: 800px;
          max-height: 80vh;
          overflow-y: auto;
        }
        
        .settings-section, .history-section {
          margin-bottom: 30px;
          padding: 20px;
          background: #f9f9f9;
          border-radius: 8px;
        }
        
        .settings-section h3, .history-section h3 {
          margin-top: 0;
          color: #333;
          font-size: 18px;
          border-bottom: 2px solid #e0e0e0;
          padding-bottom: 10px;
        }
        
        .note {
          color: #666;
          font-size: 14px;
          font-style: italic;
          margin-bottom: 15px;
        }
        
        .setting-item {
          margin: 15px 0;
        }
        
        .setting-item label {
          display: block;
          margin-bottom: 5px;
          font-weight: 500;
        }
        
        .setting-item select {
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
          width: 200px;
        }
        
        .history-actions {
          margin-bottom: 15px;
          display: flex;
          gap: 10px;
        }
        
        .history-table-wrapper {
          overflow-x: auto;
        }
        
        .history-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
        }
        
        .history-table th {
          background: #f0f0f0;
          padding: 10px;
          text-align: left;
          font-weight: 600;
          border-bottom: 2px solid #ddd;
        }
        
        .history-table td {
          padding: 8px 10px;
          border-bottom: 1px solid #eee;
        }
        
        .history-table tr.success {
          background: #f0fff0;
        }
        
        .history-table tr.failure {
          background: #fff0f0;
        }
        
        .no-history {
          text-align: center;
          color: #999;
          padding: 20px;
          font-style: italic;
        }
        
        .button.small {
          padding: 6px 12px;
          font-size: 13px;
        }
      </style>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Clear history button handler
  const clearHistoryBtn = modal.querySelector('#clearHistoryBtn') as HTMLButtonElement;
  if (clearHistoryBtn) {
    clearHistoryBtn.onclick = async () => {
      if (confirm('Are you sure you want to clear all export history?')) {
        await exportManager.clearExportHistory();
        showNotification('Export history cleared', 'success');
        document.body.removeChild(modal);
        showExportSettingsDialog(); // Refresh the dialog
      }
    };
  }
  
  // Refresh history button handler
  const refreshHistoryBtn = modal.querySelector('#refreshHistoryBtn') as HTMLButtonElement;
  if (refreshHistoryBtn) {
    refreshHistoryBtn.onclick = () => {
      document.body.removeChild(modal);
      showExportSettingsDialog(); // Refresh the dialog
    };
  }
  
  // Close button handler
  const closeBtn = modal.querySelector('#closeBtn') as HTMLButtonElement;
  closeBtn.onclick = () => {
    document.body.removeChild(modal);
  };
}

/**
 * Show quick export menu for a conversation
 * Provides quick access to common export formats
 */
export function showQuickExportMenu(conversationId: string, targetElement: HTMLElement): void {
  const menu = document.createElement('div');
  menu.className = 'quick-export-menu';
  
  const formats = [
    { format: 'json', icon: '📄', label: 'JSON' },
    { format: 'markdown', icon: '📝', label: 'Markdown' },
    { format: 'txt', icon: '📃', label: 'Text' },
    { format: 'html', icon: '🌐', label: 'HTML' },
    { format: 'pdf', icon: '📕', label: 'PDF' },
  ];
  
  menu.innerHTML = `
    <div class="menu-header">Quick Export</div>
    ${formats.map(f => `
      <button class="menu-item" data-format="${f.format}">
        ${f.icon} ${f.label}
      </button>
    `).join('')}
    <button class="menu-item advanced" data-format="advanced">
      ⚙️ Advanced Options
    </button>
    
    <style>
      .quick-export-menu {
        position: absolute;
        background: white;
        border: 1px solid #ddd;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        padding: 8px;
        z-index: 1000;
        min-width: 180px;
      }
      
      .quick-export-menu .menu-header {
        padding: 8px 12px;
        font-weight: 600;
        font-size: 13px;
        color: #666;
        border-bottom: 1px solid #eee;
        margin-bottom: 4px;
      }
      
      .quick-export-menu .menu-item {
        width: 100%;
        padding: 10px 12px;
        text-align: left;
        background: none;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        transition: background 0.2s;
      }
      
      .quick-export-menu .menu-item:hover {
        background: #f0f0f0;
      }
      
      .quick-export-menu .menu-item.advanced {
        margin-top: 4px;
        border-top: 1px solid #eee;
        padding-top: 12px;
        color: #0066cc;
      }
    </style>
  `;
  
  // Position menu near target element
  const rect = targetElement.getBoundingClientRect();
  menu.style.top = `${rect.bottom + 5}px`;
  menu.style.left = `${rect.left}px`;
  
  document.body.appendChild(menu);
  
  // Close menu when clicking outside
  const closeMenu = (e: MouseEvent) => {
    if (!menu.contains(e.target as Node)) {
      document.body.removeChild(menu);
      document.removeEventListener('click', closeMenu);
    }
  };
  
  setTimeout(() => {
    document.addEventListener('click', closeMenu);
  }, 0);
  
  // Handle menu item clicks
  menu.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', async () => {
      const format = (item as HTMLElement).dataset.format;
      
      if (format === 'advanced') {
        showExportDialog(conversationId);
      } else {
        try {
          await exportImportService.exportConversation(conversationId, format as any);
          showNotification(`Exported as ${format.toUpperCase()}`, 'success');
        } catch (error) {
          showNotification(`Export failed: ${error}`, 'error');
        }
      }
      
      document.body.removeChild(menu);
      document.removeEventListener('click', closeMenu);
    });
  });
}
