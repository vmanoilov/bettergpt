/**
 * Folder Manager
 * 
 * Manages folder operations:
 * - Create/delete/rename folders
 * - Nested folder structure
 * - Drag-and-drop support
 */

import type { Folder } from '../content/types';
import { db } from '../data/database';

export class FolderManager {
  /**
   * Initialize folder manager
   */
  initialize(): void {
    console.log('[FolderManager] Initializing');
  }

  /**
   * Create a new folder
   */
  async createFolder(name: string, parentId?: string): Promise<Folder> {
    console.log('[FolderManager] Creating folder:', name);

    const folder: Folder = {
      id: this.generateFolderId(),
      name,
      parentId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await db.saveFolder(folder);
    return folder;
  }

  /**
   * Rename a folder
   */
  async renameFolder(folderId: string, newName: string): Promise<void> {
    console.log('[FolderManager] Renaming folder:', folderId, 'to', newName);
    await db.updateFolder(folderId, { name: newName });
  }

  /**
   * Delete a folder
   */
  async deleteFolder(folderId: string): Promise<void> {
    console.log('[FolderManager] Deleting folder:', folderId);
    await db.deleteFolder(folderId);
  }

  /**
   * Move folder to a new parent
   */
  async moveFolder(folderId: string, newParentId?: string): Promise<void> {
    console.log('[FolderManager] Moving folder:', folderId, 'to parent:', newParentId);
    await db.updateFolder(folderId, { parentId: newParentId });
  }

  /**
   * Get all folders
   */
  async getAllFolders(): Promise<Folder[]> {
    return await db.getAllFolders();
  }

  /**
   * Get root folders (folders without a parent)
   */
  async getRootFolders(): Promise<Folder[]> {
    return await db.getRootFolders();
  }

  /**
   * Get child folders of a parent
   */
  async getChildFolders(parentId: string): Promise<Folder[]> {
    return await db.getChildFolders(parentId);
  }

  /**
   * Get folder by ID
   */
  async getFolder(folderId: string): Promise<Folder | undefined> {
    return await db.getFolder(folderId);
  }

  /**
   * Get folder tree (hierarchical structure)
   */
  async getFolderTree(): Promise<FolderTreeNode[]> {
    const allFolders = await db.getAllFolders();
    const rootFolders = allFolders.filter(f => !f.parentId);
    
    return rootFolders.map(folder => this.buildFolderNode(folder, allFolders));
  }

  /**
   * Build folder tree node recursively
   */
  private buildFolderNode(folder: Folder, allFolders: Folder[]): FolderTreeNode {
    const children = allFolders
      .filter(f => f.parentId === folder.id)
      .map(child => this.buildFolderNode(child, allFolders));

    return {
      ...folder,
      children: children.length > 0 ? children : undefined,
    };
  }

  /**
   * Get folder path (breadcrumb)
   */
  async getFolderPath(folderId: string): Promise<Folder[]> {
    const path: Folder[] = [];
    let currentId: string | undefined = folderId;

    while (currentId) {
      const folder = await db.getFolder(currentId);
      if (!folder) break;
      
      path.unshift(folder);
      currentId = folder.parentId;
    }

    return path;
  }

  /**
   * Set folder color
   */
  async setFolderColor(folderId: string, color: string): Promise<void> {
    console.log('[FolderManager] Setting folder color:', folderId, color);
    await db.updateFolder(folderId, { color });
  }

  /**
   * Set folder icon
   */
  async setFolderIcon(folderId: string, icon: string): Promise<void> {
    console.log('[FolderManager] Setting folder icon:', folderId, icon);
    await db.updateFolder(folderId, { icon });
  }

  /**
   * Check if folder name is valid
   */
  isValidFolderName(name: string): boolean {
    return name.trim().length > 0 && name.length <= 100;
  }

  /**
   * Generate folder ID
   */
  private generateFolderId(): string {
    return `folder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Cleanup
   */
  destroy(): void {
    console.log('[FolderManager] Destroying');
  }
}

/**
 * Folder tree node interface
 */
export interface FolderTreeNode extends Folder {
  children?: FolderTreeNode[];
}

// Export singleton instance
export const folderManager = new FolderManager();
