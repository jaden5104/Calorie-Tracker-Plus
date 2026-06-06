import { useState, useEffect, useCallback } from 'react';

export interface TempPhoto {
  id: string;
  imageData: string;
  note: string;
  createdAt: string;
  expiresAt: string;
}

const DB_NAME = 'caly_photos';
const STORE_NAME = 'temp_photos';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function getAllPhotos(): Promise<TempPhoto[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result as TempPhoto[]);
    req.onerror = () => reject(req.error);
  });
}

async function putPhoto(photo: TempPhoto): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(photo);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function deletePhotoFromDB(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

function purgeExpired(photos: TempPhoto[]): { valid: TempPhoto[]; expired: string[] } {
  const now = new Date();
  const valid: TempPhoto[] = [];
  const expired: string[] = [];
  for (const p of photos) {
    if (new Date(p.expiresAt) < now) {
      expired.push(p.id);
    } else {
      valid.push(p);
    }
  }
  return { valid, expired };
}

export function usePhotoStore() {
  const [photos, setPhotos] = useState<TempPhoto[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAndPurge = useCallback(async () => {
    try {
      const all = await getAllPhotos();
      const { valid, expired } = purgeExpired(all);
      await Promise.all(expired.map(deletePhotoFromDB));
      setPhotos(valid);
    } catch {
      setPhotos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAndPurge();
  }, [loadAndPurge]);

  const addPhoto = useCallback(async (file: File, note: string, expirationHours: number) => {
    try {
      const imageData = await readFileAsBase64(file);
      const now = new Date();
      const expiresAt = new Date(now.getTime() + expirationHours * 60 * 60 * 1000);
      const photo: TempPhoto = {
        id: crypto.randomUUID(),
        imageData,
        note,
        createdAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
      };
      await putPhoto(photo);
      setPhotos(prev => [photo, ...prev]);
    } catch (err) {
      console.error('Failed to add photo:', err);
    }
  }, []);

  const deletePhoto = useCallback(async (id: string) => {
    try {
      await deletePhotoFromDB(id);
      setPhotos(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      console.error('Failed to delete photo:', err);
    }
  }, []);

  return { photos, loading, addPhoto, deletePhoto, refresh: loadAndPurge };
}
