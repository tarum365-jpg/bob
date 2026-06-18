import { BackupReminder, Client, LastBackupInfo, PlanTemplate, TrainerProfile } from '../types';
import { APP_BUILD, STORAGE_KEYS } from './keys';
import { makePortableBackup, restoreClientPhotos, restorePortableFiles, restoreProfilePhoto } from './fileStore';

/**
 * Expo Go SDK 54 safe storage.
 *
 * We deliberately do not import @react-native-async-storage/async-storage here.
 * It is JS-only to avoid native storage dependency during Expo Go testing.
 * This JS-only storage keeps the demo stable in Expo Go. It survives navigation
 * and hot reload in the same app session. For a final standalone APK/dev-client,
 * native persistent storage can be restored separately after Expo Go testing.
 */
type StoreMap = Record<string, string>;
const globalStoreKey = '__AGASHKA_POWER_JS_STORE__';
const memoryStore: StoreMap = ((globalThis as any)[globalStoreKey] ||= {});

const SafeStorage = {
  async getItem(key: string): Promise<string | null> {
    return Object.prototype.hasOwnProperty.call(memoryStore, key) ? memoryStore[key] : null;
  },
  async setItem(key: string, value: string): Promise<void> {
    memoryStore[key] = String(value);
  },
  async removeItem(key: string): Promise<void> {
    delete memoryStore[key];
  },
  async multiRemove(keys: string[]): Promise<void> {
    keys.forEach((key) => delete memoryStore[key]);
  },
};

export const defaultProfile: TrainerProfile = {
  appTitle: '',
  trainerName: '',
  sportTitle: '',
  shortTitle: '',
  description: '',
  worldAchievement: '',
  asiaAchievement: '',
  phone: '',
  whatsapp: '',
  instagram: '',
  city: '',
  achievements: '',
  currency: 'KZT',
  photoSize: 'large',
};

async function getJson<T>(key: string, fallback: T): Promise<T> {
  const raw = await SafeStorage.getItem(key);
  if (!raw) return fallback;
  try { return { ...(fallback as any), ...(JSON.parse(raw) as any) } as T; } catch { return fallback; }
}

async function getArrayJson<T>(key: string, fallback: T): Promise<T> {
  const raw = await SafeStorage.getItem(key);
  if (!raw) return fallback;
  try { return JSON.parse(raw) as T; } catch { return fallback; }
}

async function setJson<T>(key: string, value: T): Promise<void> {
  await SafeStorage.setItem(key, JSON.stringify(value));
}

export const localStore = {
  getClients: () => getArrayJson<Client[]>(STORAGE_KEYS.clients, []),
  saveClients: (items: Client[]) => setJson(STORAGE_KEYS.clients, items),
  async getClient(id: string) { return (await localStore.getClients()).find(c => c.id === id) ?? null; },
  async upsertClient(client: Client) {
    const clients = await localStore.getClients();
    const exists = clients.some(c => c.id === client.id);
    await localStore.saveClients(exists ? clients.map(c => c.id === client.id ? client : c) : [client, ...clients]);
  },
  async deleteClient(id: string) {
    const clients = await localStore.getClients();
    await localStore.saveClients(clients.filter(c => c.id !== id));
  },

  getPlans: () => getArrayJson<PlanTemplate[]>(STORAGE_KEYS.plans, []),
  savePlans: (items: PlanTemplate[]) => setJson(STORAGE_KEYS.plans, items),
  async getPlan(id: string) { return (await localStore.getPlans()).find(p => p.id === id) ?? null; },

  getProfile: () => getJson<TrainerProfile>(STORAGE_KEYS.trainerProfile, defaultProfile),
  saveProfile: (profile: TrainerProfile) => setJson(STORAGE_KEYS.trainerProfile, { ...defaultProfile, ...profile }),

  getPassword: async () => (await SafeStorage.getItem(STORAGE_KEYS.appPassword)) ?? '',
  setPassword: (password: string) => SafeStorage.setItem(STORAGE_KEYS.appPassword, password),
  getRememberLogin: async () => (await SafeStorage.getItem(STORAGE_KEYS.rememberLogin)) === 'true',
  setRememberLogin: (value: boolean) => SafeStorage.setItem(STORAGE_KEYS.rememberLogin, String(value)),
  getRecoveryEmail: async () => (await SafeStorage.getItem(STORAGE_KEYS.recoveryEmail)) ?? '',
  setRecoveryEmail: (email: string) => SafeStorage.setItem(STORAGE_KEYS.recoveryEmail, email),
  getRecoveryPhone: async () => (await SafeStorage.getItem(STORAGE_KEYS.recoveryPhone)) ?? '',
  setRecoveryPhone: (phone: string) => SafeStorage.setItem(STORAGE_KEYS.recoveryPhone, phone),

  getLastBackupInfo: () => getJson<LastBackupInfo | null>(STORAGE_KEYS.lastBackupInfo, null),
  setLastBackupInfo: (info: LastBackupInfo) => setJson(STORAGE_KEYS.lastBackupInfo, info),
  getBackupReminder: async (): Promise<BackupReminder> => ((await SafeStorage.getItem(STORAGE_KEYS.backupReminder)) as BackupReminder) || 'off',
  setBackupReminder: (value: BackupReminder) => SafeStorage.setItem(STORAGE_KEYS.backupReminder, value),

  setPasswordResetCode: (payload: { phone: string; code: string; createdAt: string }) => setJson(STORAGE_KEYS.passwordResetCode, payload),
  async getPasswordResetCode(): Promise<{ phone: string; code: string; createdAt: string } | null> {
    const raw = await SafeStorage.getItem(STORAGE_KEYS.passwordResetCode);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  },
  clearPasswordResetCode: () => SafeStorage.removeItem(STORAGE_KEYS.passwordResetCode),
  setPasswordResetVerified: (value: boolean) => SafeStorage.setItem(STORAGE_KEYS.passwordResetVerified, JSON.stringify(value)),
  async getPasswordResetVerified(): Promise<boolean> {
    const raw = await SafeStorage.getItem(STORAGE_KEYS.passwordResetVerified);
    return raw ? JSON.parse(raw) === true : false;
  },

  async exportFullBackup() {
    return makePortableBackup(await localStore.getClients(), await localStore.getPlans(), await localStore.getRecoveryEmail(), await localStore.getProfile());
  },
  exportData: async () => localStore.exportFullBackup(),
  async importFullBackup(data: any) {
    if (Array.isArray(data.clients)) await localStore.saveClients(await restoreClientPhotos(data, data.clients));
    const restoredPlans = await restorePortableFiles(data);
    await localStore.savePlans(restoredPlans);
    if (data.profile) {
      const photoUri = await restoreProfilePhoto(data);
      await localStore.saveProfile({ ...defaultProfile, ...data.profile, ...(photoUri ? { photoUri } : {}) });
    }
    if (typeof data.recoveryEmail === 'string') await localStore.setRecoveryEmail(data.recoveryEmail);
  },
  importData: async (data: any) => localStore.importFullBackup(data),

  resetClientsAndPayments: async () => localStore.saveClients([]),
  resetPlans: async () => localStore.savePlans([]),
  resetBrand: async () => localStore.saveProfile(defaultProfile),
  clearBusinessData: async () => {
    await SafeStorage.multiRemove([STORAGE_KEYS.clients, STORAGE_KEYS.plans, STORAGE_KEYS.lastBackupInfo]);
  },
  clearAll: async () => {
    await SafeStorage.multiRemove(Object.values(STORAGE_KEYS));
  },
  buildInfo: APP_BUILD,
};
