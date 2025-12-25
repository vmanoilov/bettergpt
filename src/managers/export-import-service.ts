/**
 * Export/Import Service
 * 
 * Central service for managing export and import operations.
 * Integrates ExportManager, ImportManager, and TemplateManager.
 */

import { exportManager, type ExportFormat, type ExportOptions } from './export-manager';
import { importManager, type ImportFormat, type ImportOptions } from './import-manager';
import { templateManager, type Template } from './template-manager';
import type { Conversation } from '../content/types';

export class ExportImportService {
  /**
   * Export a single conversation
   */
  async exportConversation(
    conversationId: string,
    format: ExportFormat,
    options?: Partial<ExportOptions>
  ): Promise<void> {
    const exportOptions: ExportOptions = {
      format,
      includeMetadata: true,
      includeThreads: false,
      ...options,
    };

    const result = await exportManager.exportConversation(conversationId, exportOptions);

    if (result.success && result.data && result.filename) {
      exportManager.downloadFile(result.data, result.filename);
      
      if (result.error) {
        console.warn('[ExportImportService]', result.error);
      }
    } else {
      throw new Error(result.error || 'Export failed');
    }
  }

  /**
   * Export multiple conversations
   */
  async exportMultipleConversations(
    conversationIds: string[],
    format: ExportFormat,
    options?: Partial<ExportOptions>
  ): Promise<void> {
    const exportOptions: ExportOptions = {
      format,
      includeMetadata: true,
      includeThreads: false,
      ...options,
    };

    const result = await exportManager.exportMultipleConversations(
      conversationIds,
      exportOptions
    );

    if (result.success && result.data && result.filename) {
      exportManager.downloadFile(result.data, result.filename);
      
      if (result.error) {
        console.warn('[ExportImportService]', result.error);
      }
    } else {
      throw new Error(result.error || 'Export failed');
    }
  }

  /**
   * Import conversations from a file
   */
  async importFromFile(
    file: File,
    format: ImportFormat,
    options?: Partial<ImportOptions>
  ): Promise<number> {
    const importOptions: ImportOptions = {
      format,
      generateNewIds: true,
      preserveFolders: false,
      ...options,
    };

    const result = await importManager.importFromFile(file, importOptions);

    if (result.success) {
      if (result.warnings && result.warnings.length > 0) {
        console.warn('[ExportImportService] Import warnings:', result.warnings);
      }
      return result.conversationsImported || 0;
    } else {
      throw new Error(result.error || 'Import failed');
    }
  }

  /**
   * Get available export formats
   */
  getExportFormats(): Array<{ id: ExportFormat; name: string; extension: string }> {
    return [
      { id: 'markdown', name: 'Markdown', extension: 'md' },
      { id: 'txt', name: 'Plain Text', extension: 'txt' },
      { id: 'json', name: 'JSON', extension: 'json' },
      { id: 'html', name: 'HTML', extension: 'html' },
      { id: 'pdf', name: 'PDF', extension: 'pdf' },
      { id: 'docx', name: 'DOCX', extension: 'docx' },
    ];
  }

  /**
   * Get available import formats
   */
  getImportFormats(): Array<{ id: ImportFormat; name: string; extensions: string[] }> {
    return [
      { id: 'json', name: 'JSON', extensions: ['.json'] },
      { id: 'markdown', name: 'Markdown', extensions: ['.md', '.markdown'] },
      { id: 'chatgpt', name: 'ChatGPT Export', extensions: ['.json'] },
      { id: 'txt', name: 'Plain Text', extensions: ['.txt'] },
    ];
  }

  /**
   * Get available templates for a format
   */
  getTemplates(format?: 'markdown' | 'html' | 'txt'): Template[] {
    if (format) {
      return templateManager.getTemplatesByFormat(format);
    }
    return templateManager.getAllTemplates();
  }

  /**
   * Create a custom template
   */
  createTemplate(template: Omit<Template, 'createdAt' | 'updatedAt'>): void {
    const validation = templateManager.validateTemplate(template.template);
    
    if (!validation.valid) {
      throw new Error(`Invalid template: ${validation.errors.join(', ')}`);
    }

    templateManager.addTemplate({
      ...template,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  }

  /**
   * Get template variables
   */
  getTemplateVariables(): Array<{ name: string; description: string; example: string }> {
    return templateManager.getAvailableVariables();
  }

  /**
   * Preview template rendering
   */
  previewTemplate(templateId: string, conversation: Conversation): string {
    return templateManager.render(templateId, conversation);
  }

  /**
   * Export with custom template
   */
  async exportWithCustomTemplate(
    conversationId: string,
    customTemplate: string,
    format: 'markdown' | 'html' | 'txt'
  ): Promise<void> {
    const validation = templateManager.validateTemplate(customTemplate);
    
    if (!validation.valid) {
      throw new Error(`Invalid template: ${validation.errors.join(', ')}`);
    }

    const exportOptions: ExportOptions = {
      format: format as ExportFormat,
      customTemplate,
      includeMetadata: true,
    };

    const result = await exportManager.exportConversation(conversationId, exportOptions);

    if (result.success && result.data && result.filename) {
      exportManager.downloadFile(result.data, result.filename);
    } else {
      throw new Error(result.error || 'Export failed');
    }
  }
}

// Export singleton instance
export const exportImportService = new ExportImportService();

// Re-export types and managers for direct access if needed
export { exportManager } from './export-manager';
export { importManager } from './import-manager';
export { templateManager } from './template-manager';
export type { ExportFormat, ExportOptions } from './export-manager';
export type { ImportFormat, ImportOptions } from './import-manager';
export type { Template } from './template-manager';
