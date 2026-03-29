import Dexie, { type Table } from 'dexie';

export interface PendingAction {
  id?: number;
  type: string;
  payload: any;
  status: 'pending' | 'failed';
  retryCount: number;
  createdAt: string;
}

export class CareSyncIndexedDB extends Dexie {
  pendingActions!: Table<PendingAction, number>;
  
  // Cache tables for offline viewing
  patientsCache!: Table<any, string>;
  appointmentsCache!: Table<any, string>;

  constructor() {
    super('CareSyncLocalDB');
    this.version(1).stores({
      pendingActions: '++id, type, status',
      patientsCache: 'id',
      appointmentsCache: 'id, patientId, date'
    });
  }
}

export const localDb = new CareSyncIndexedDB();
