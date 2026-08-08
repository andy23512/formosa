import Dexie, { Table } from 'dexie';
import { KeyRecord } from './models/key-record.models';
import { prefixStorageKey } from './utils/store.utils';

export class AppDB extends Dexie {
  keyRecords!: Table<KeyRecord, number>;

  constructor() {
    super(prefixStorageKey('appDB'));
    this.version(1).stores({
      keyRecords: '++id, timestamp, topicId, lessonId, isCorrect',
    });
  }
}

export const db = new AppDB();
