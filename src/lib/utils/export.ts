import { saveAs } from 'file-saver';
import JSZip from 'jszip';

/**
 * Export data to a JSON file
 */
export async function exportToJSON(data: unknown, filename: string): Promise<void> {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  saveAs(blob, filename);
}

/**
 * Import data from a JSON file
 */
export async function importFromJSON<T>(file: File): Promise<T> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        resolve(data);
      } catch (error) {
        reject(new Error('Invalid JSON file'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsText(file);
  });
}

/**
 * Export multiple files as a ZIP archive
 */
export async function exportToZip(
  files: Array<{ name: string; content: string | Blob }>,
  zipFilename: string
): Promise<void> {
  const zip = new JSZip();

  files.forEach((file) => {
    zip.file(file.name, file.content);
  });

  const blob = await zip.generateAsync({ type: 'blob' });
  saveAs(blob, zipFilename);
}

/**
 * Extract files from a ZIP archive
 */
export async function importFromZip(file: File): Promise<Record<string, string>> {
  const zip = new JSZip();
  const contents: Record<string, string> = {};

  const zipData = await zip.loadAsync(file);

  for (const filename in zipData.files) {
    const fileData = zipData.files[filename];
    if (!fileData.dir) {
      contents[filename] = await fileData.async('text');
    }
  }

  return contents;
}
