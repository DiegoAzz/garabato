/**
 * Gestor de Pistas de FL Studio para GARABATO FEST 3D
 * Almacena archivos de audio reales (.mp3, .wav, .ogg, .flac) en IndexedDB nativo
 * y los sincroniza entre el panel /admin y la pantalla /show.
 */

const DB_NAME = 'GarabatoFLStudioDB';
const DB_VERSION = 1;
const STORE_NAME = 'tracks';

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export class FLStudioManager {
  constructor() {
    this.currentTrackId = null;
  }

  /**
   * Guarda un archivo de FL Studio en la biblioteca IndexedDB
   */
  async saveTrack(file) {
    const db = await openDB();
    const id = 'fl_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    const track = {
      id,
      name: file.name.replace(/\.[^/.]+$/, ''), // Sin extensión
      fileName: file.name,
      size: file.size,
      type: file.type || 'audio/mpeg',
      createdAt: new Date().toISOString(),
      blob: file
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(track);
      req.onsuccess = () => {
        resolve({
          id: track.id,
          name: track.name,
          fileName: track.fileName,
          size: track.size,
          type: track.type,
          createdAt: track.createdAt
        });
      };
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Obtiene la lista de pistas disponibles (sin el blob pesado)
   */
  async listTracks() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => {
        const list = (req.result || []).map(t => ({
          id: t.id,
          name: t.name,
          fileName: t.fileName,
          size: t.size,
          type: t.type,
          createdAt: t.createdAt
        }));
        resolve(list);
      };
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Obtiene el Blob de audio de una pista específica para reproducirla
   */
  async getTrackBlob(id) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);
      req.onsuccess = () => {
        if (req.result && req.result.blob) {
          resolve(req.result.blob);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Elimina una pista de la biblioteca
   */
  async deleteTrack(id) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  }
}
