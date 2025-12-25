/**
 * Template Manager
 * 
 * Manages custom templates for export formatting.
 * Supports handlebars-style template syntax for dynamic data.
 */

import type { Conversation } from '../content/types';

export interface Template {
  id: string;
  name: string;
  format: 'markdown' | 'html' | 'txt';
  template: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
}

export interface TemplateVariable {
  name: string;
  description: string;
  example: string;
}

export class TemplateManager {
  private templates: Map<string, Template> = new Map();

  /**
   * Built-in template variables
   */
  private readonly variables: TemplateVariable[] = [
    { name: 'title', description: 'Conversation title', example: 'My Conversation' },
    { name: 'model', description: 'AI model used', example: 'gpt-4' },
    { name: 'createdAt', description: 'Creation date', example: '2024-01-01' },
    { name: 'updatedAt', description: 'Last update date', example: '2024-01-02' },
    { name: 'totalTokens', description: 'Total tokens used', example: '1500' },
    { name: 'tags', description: 'Conversation tags', example: 'tag1, tag2' },
    { name: 'messageCount', description: 'Number of messages', example: '10' },
    { name: 'messages', description: 'Array of messages', example: '[...]' },
    { name: 'messages[].role', description: 'Message role', example: 'user' },
    { name: 'messages[].content', description: 'Message content', example: 'Hello!' },
    { name: 'messages[].timestamp', description: 'Message timestamp', example: '1234567890' },
  ];

  constructor() {
    this.loadDefaultTemplates();
  }

  /**
   * Load default templates
   */
  private loadDefaultTemplates(): void {
    // Standard Markdown template
    this.addTemplate({
      id: 'markdown-standard',
      name: 'Standard Markdown',
      format: 'markdown',
      template: `# {{title}}

**Model:** {{model}}
**Created:** {{createdAt}}
**Updated:** {{updatedAt}}
{{#if totalTokens}}**Tokens:** {{totalTokens}}{{/if}}
{{#if tags}}**Tags:** {{tags}}{{/if}}

{{#each messages}}
## {{#if (eq role "user")}}👤 User{{else}}🤖 Assistant{{/if}}

{{content}}

{{/each}}`,
      description: 'Standard markdown format with emoji indicators',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Obsidian template
    this.addTemplate({
      id: 'markdown-obsidian',
      name: 'Obsidian Markdown',
      format: 'markdown',
      template: `---
title: {{title}}
model: {{model}}
created: {{createdAt}}
updated: {{updatedAt}}
{{#if tags}}tags: [{{tags}}]{{/if}}
---

# {{title}}

{{#each messages}}
> [!{{role}}] {{role}}
> {{content}}

{{/each}}`,
      description: 'Obsidian-compatible markdown with YAML frontmatter',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // GitHub template
    this.addTemplate({
      id: 'markdown-github',
      name: 'GitHub Markdown',
      format: 'markdown',
      template: `# {{title}}

\`\`\`
Model: {{model}}
Created: {{createdAt}}
Updated: {{updatedAt}}
{{#if totalTokens}}Tokens: {{totalTokens}}{{/if}}
\`\`\`

{{#each messages}}
### {{#if (eq role "user")}}👤{{else}}🤖{{/if}} {{role}}

{{content}}

{{/each}}`,
      description: 'GitHub-flavored markdown format',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Minimal text template
    this.addTemplate({
      id: 'txt-minimal',
      name: 'Minimal Text',
      format: 'txt',
      template: `{{title}}
${'='.repeat(50)}

{{#each messages}}
[{{role}}]
{{content}}

{{/each}}`,
      description: 'Minimal plain text format',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // HTML Academic template
    this.addTemplate({
      id: 'html-academic',
      name: 'Academic HTML',
      format: 'html',
      template: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>{{title}}</title>
  <style>
    body { font-family: 'Times New Roman', serif; max-width: 800px; margin: 40px auto; padding: 20px; line-height: 1.8; }
    h1 { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; }
    .metadata { text-align: center; color: #666; margin: 20px 0; }
    .message { margin: 30px 0; }
    .message-header { font-weight: bold; margin-bottom: 10px; text-transform: uppercase; font-size: 0.9em; }
    .message-content { text-align: justify; }
  </style>
</head>
<body>
  <h1>{{title}}</h1>
  <div class="metadata">
    <p>Model: {{model}} | Created: {{createdAt}}</p>
  </div>
  {{#each messages}}
  <div class="message">
    <div class="message-header">{{role}}</div>
    <div class="message-content">{{content}}</div>
  </div>
  {{/each}}
</body>
</html>`,
      description: 'Academic-style HTML format',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  }

  /**
   * Add a template
   */
  addTemplate(template: Template): void {
    this.templates.set(template.id, template);
  }

  /**
   * Get a template by ID
   */
  getTemplate(id: string): Template | undefined {
    return this.templates.get(id);
  }

  /**
   * Get all templates
   */
  getAllTemplates(): Template[] {
    return Array.from(this.templates.values());
  }

  /**
   * Get templates by format
   */
  getTemplatesByFormat(format: 'markdown' | 'html' | 'txt'): Template[] {
    return Array.from(this.templates.values()).filter(t => t.format === format);
  }

  /**
   * Delete a template
   */
  deleteTemplate(id: string): boolean {
    return this.templates.delete(id);
  }

  /**
   * Update a template
   */
  updateTemplate(id: string, updates: Partial<Template>): boolean {
    const template = this.templates.get(id);
    if (!template) {
      return false;
    }

    this.templates.set(id, {
      ...template,
      ...updates,
      updatedAt: Date.now(),
    });

    return true;
  }

  /**
   * Render a template with conversation data
   */
  render(templateId: string, conversation: Conversation): string {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    return this.renderTemplate(template.template, conversation);
  }

  /**
   * Render a custom template string
   */
  renderCustom(templateString: string, conversation: Conversation): string {
    return this.renderTemplate(templateString, conversation);
  }

  /**
   * Simple handlebars-style template renderer
   * Supports: {{variable}}, {{#if variable}}, {{#each array}}, {{#eq a b}}
   */
  private renderTemplate(template: string, conversation: Conversation): string {
    // Prepare data object
    const data = {
      ...conversation,
      createdAt: new Date(conversation.createdAt).toLocaleString(),
      updatedAt: new Date(conversation.updatedAt).toLocaleString(),
      tags: conversation.tags?.join(', ') || '',
      messageCount: conversation.messages.length,
    };

    let result = template;

    // Process {{#each messages}} blocks
    result = this.processEach(result, 'messages', data.messages);

    // Process {{#if variable}} blocks
    result = this.processIf(result, data);

    // Replace simple variables {{variable}}
    result = this.replaceVariables(result, data);

    return result;
  }

  /**
   * Process {{#each}} blocks
   */
  private processEach(template: string, arrayName: string, array: any[]): string {
    const eachRegex = new RegExp(`{{#each ${arrayName}}}([\\s\\S]*?){{/each}}`, 'g');
    
    return template.replace(eachRegex, (match, content) => {
      return array.map(item => {
        let itemContent = content;
        
        // Replace item properties
        Object.keys(item).forEach(key => {
          const value = item[key];
          itemContent = itemContent.replace(new RegExp(`{{${key}}}`, 'g'), String(value || ''));
        });

        // Process nested {{#if (eq role "user")}} helpers
        itemContent = this.processInlineHelpers(itemContent, item);

        return itemContent;
      }).join('');
    });
  }

  /**
   * Process inline helpers like {{#if (eq role "user")}}
   */
  private processInlineHelpers(template: string, data: any): string {
    // Process {{#if (eq a b)}}text{{else}}other{{/if}}
    const eqIfRegex = /{{#if \(eq (\w+) "([^"]*)"\)}}([^{]*){{else}}([^{]*){{\/if}}/g;
    
    return template.replace(eqIfRegex, (match, key, value, trueText, falseText) => {
      return data[key] === value ? trueText : falseText;
    });
  }

  /**
   * Process {{#if variable}} blocks
   */
  private processIf(template: string, data: any): string {
    const ifRegex = /{{#if (\w+)}}([^]*?){{\/if}}/g;
    
    return template.replace(ifRegex, (match, variable, content) => {
      const value = data[variable];
      return value && value !== '' && value !== 0 ? content : '';
    });
  }

  /**
   * Replace simple variables {{variable}}
   */
  private replaceVariables(template: string, data: any): string {
    Object.keys(data).forEach(key => {
      if (typeof data[key] !== 'object') {
        const regex = new RegExp(`{{${key}}}`, 'g');
        template = template.replace(regex, String(data[key] || ''));
      }
    });
    
    return template;
  }

  /**
   * Get available template variables
   */
  getAvailableVariables(): TemplateVariable[] {
    return this.variables;
  }

  /**
   * Validate a template string
   */
  validateTemplate(template: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check for unclosed tags
    const openTags = (template.match(/{{#/g) || []).length;
    const closeTags = (template.match(/{{\/}/g) || []).length;
    
    if (openTags !== closeTags) {
      errors.push('Unclosed template tags detected');
    }

    // Check for valid variables
    const variableRegex = /{{(\w+)}}/g;
    let match;
    const validVars = this.variables.map(v => v.name);
    
    while ((match = variableRegex.exec(template)) !== null) {
      const varName = match[1];
      if (!validVars.includes(varName) && varName !== 'each' && varName !== 'if') {
        errors.push(`Unknown variable: ${varName}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

// Export singleton instance
export const templateManager = new TemplateManager();
