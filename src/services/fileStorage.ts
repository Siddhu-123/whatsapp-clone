import { get, set, del } from 'idb-keyval';
import { FileHandleMetadata } from '../types/chat';

const FILE_HANDLE_KEY = 'wa_mac_zip_file_handle_v1';
const FILE_METADATA_KEY = 'wa_mac_zip_file_metadata_v1';

export function isFileSystemAccessSupported(): boolean {
  return typeof window !== 'undefined' && 'showOpenFilePicker' in window;
}

export async function getSavedMacZipHandle(): Promise<FileSystemFileHandle | null> {
  try {
    const handle = await get<FileSystemFileHandle>(FILE_HANDLE_KEY);
    return handle || null;
  } catch (err) {
    console.error('Failed to get file handle from storage:', err);
    return null;
  }
}

export async function getSavedFileMetadata(): Promise<FileHandleMetadata | null> {
  try {
    const meta = await get<FileHandleMetadata>(FILE_METADATA_KEY);
    return meta || null;
  } catch {
    return null;
  }
}

export async function verifyHandlePermission(handle: any, promptIfNeeded = false): Promise<boolean> {
  try {
    const queryOpts = { mode: 'read' };
    if (typeof handle.queryPermission === 'function') {
      if ((await handle.queryPermission(queryOpts)) === 'granted') {
        return true;
      }
    }
    if (promptIfNeeded && typeof handle.requestPermission === 'function') {
      if ((await handle.requestPermission(queryOpts)) === 'granted') {
        return true;
      }
    }
  } catch (err) {
    console.warn('Error checking handle permission:', err);
  }
  return false;
}

export async function pickAndSaveMacZipFile(): Promise<{ file: File; handle: FileSystemFileHandle }> {
  if (!isFileSystemAccessSupported()) {
    throw new Error('File System Access API is not supported in this browser. Please drag and drop the zip file instead.');
  }

  const [handle] = await (window as any).showOpenFilePicker({
    types: [
      {
        description: 'WhatsApp Chat Export Archives',
        accept: {
          'application/zip': ['.zip'],
          'application/x-zip-compressed': ['.zip']
        }
      }
    ],
    multiple: false
  });

  const file = await handle.getFile();

  // Save handle and metadata in IndexedDB
  await set(FILE_HANDLE_KEY, handle);
  const metadata: FileHandleMetadata = {
    name: file.name,
    size: file.size,
    lastModified: file.lastModified,
    type: file.type
  };
  await set(FILE_METADATA_KEY, metadata);

  return { file, handle };
}

export async function readMacZipFile(handle: FileSystemFileHandle): Promise<File> {
  return await handle.getFile();
}

export async function clearSavedMacZipHandle(): Promise<void> {
  await del(FILE_HANDLE_KEY);
  await del(FILE_METADATA_KEY);
}
