"use client";

import { openDB, IDBPDatabase } from 'idb';

const DB_NAME = 'its-offline-cache';
const STORE_NAME = 'lessons';
const VERSION = 1;

export class OfflineContentManager {
    private db: Promise<IDBPDatabase>;

    constructor() {
        this.db = openDB(DB_NAME, VERSION, {
            upgrade(db) {
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                }
            },
        });
    }

    async saveLesson(lesson: any, blob: Blob) {
        const database = await this.db;
        await database.put(STORE_NAME, {
            ...lesson,
            contentBlob: blob,
            syncedAt: new Date().toISOString()
        });
    }

    async getLesson(id: number) {
        const database = await this.db;
        return database.get(STORE_NAME, id);
    }

    async getAllLessons() {
        const database = await this.db;
        return database.getAll(STORE_NAME);
    }

    async deleteLesson(id: number) {
        const database = await this.db;
        await database.delete(STORE_NAME, id);
    }

    async getStorageUsage() {
        if ('storage' in navigator && 'estimate' in navigator.storage) {
            const estimate = await navigator.storage.estimate();
            return {
                usage: estimate.usage || 0,
                quota: estimate.quota || 0,
                percentage: ((estimate.usage || 0) / (estimate.quota || 1)) * 100
            };
        }
        return null;
    }
}

export const offlineManager = typeof window !== 'undefined' ? new OfflineContentManager() : null;
