import { Alert, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { translateNow } from '../i18n';
import { Client, LastBackupInfo, PlanTemplate, TrainerProfile } from '../types';

function t(key: string) { return translateNow(key); }

type PickedFile = { fileName: string; fileUri: string; fileType: string };

type PhotoSource = 'camera' | 'gallery' | null;

function safeName(name: string) {
  return String(name || 'file').replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 90);
}

function choosePhotoSource(): Promise<PhotoSource> {
  return new Promise((resolve) => {
    Alert.alert(t('Фото'), t('Выберите источник фото'), [
      { text: t('Галерея'), onPress: () => resolve('gallery') },
      { text: t('Камера'), onPress: () => resolve('camera') },
      { text: t('Отмена'), style: 'cancel', onPress: () => resolve(null) },
    ], { cancelable: true, onDismiss: () => resolve(null) });
  });
}

async function copyUriIfPossible(uri: string, prefix: string, extension = 'jpg') {
  try {
    const FileSystem = await import('expo-file-system');
    const dir = `${FileSystem.documentDirectory || ''}agashka/`;
    if (!FileSystem.documentDirectory) return uri;
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true }).catch(() => undefined);
    const target = `${dir}${prefix}_${Date.now()}.${safeName(extension).replace(/^\./, '')}`;
    await FileSystem.copyAsync({ from: uri, to: target });
    return target;
  } catch {
    return uri;
  }
}

export async function ensureFolders() { return true; }

function wait(ms: number) { return new Promise(resolve => setTimeout(resolve, ms)); }

async function pickImageSafe(prefix: string) {
  const source = await choosePhotoSource();
  if (!source) return null;

  // На Android нельзя запускать системную камеру/галерею в тот же миллисекундный момент,
  // когда закрывается Alert. Иначе кнопка выглядит тупиковой. Даем окну закрыться.
  await wait(420);

  try {
    if (source === 'gallery') {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(t('Ошибка'), t('Нет доступа к галерее'));
        return null;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'] as any,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.9,
        exif: false,
      });
      if ((result as any).canceled) return null;
      const asset = (result as any).assets?.[0];
      if (!asset?.uri) return null;
      const ext = String(asset.fileName || asset.uri).split('.').pop() || 'jpg';
      return await copyUriIfPossible(asset.uri, prefix, ext);
    }

    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(t('Ошибка'), t('Нет доступа к камере'));
      return null;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'] as any,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
      exif: false,
    });
    if ((result as any).canceled) return null;
    const asset = (result as any).assets?.[0];
    if (!asset?.uri) return null;
    const ext = String(asset.fileName || asset.uri).split('.').pop() || 'jpg';
    return await copyUriIfPossible(asset.uri, prefix, ext);
  } catch (error) {
    Alert.alert(t('Ошибка'), t('Не удалось открыть камеру или галерею'));
    return null;
  }
}

export async function pickAndSaveClientPhoto() { return pickImageSafe('client'); }
export async function pickAndSaveTrainerPhoto() { return pickImageSafe('trainer'); }

export async function pickAndSaveFile(): Promise<PickedFile | null> {
  try {
    // Открывает системный Android picker: Мои файлы, Загрузки, Google Drive, память телефона.
    const result = await DocumentPicker.getDocumentAsync({
      multiple: false,
      copyToCacheDirectory: true,
      type: '*/*',
    });
    if ((result as any).canceled) return null;
    const asset = (result as any).assets?.[0] || result;
    if (!asset?.uri) return null;
    const fileName = asset.name || asset.fileName || t('Файл');
    const ext = String(fileName).split('.').pop() || 'dat';
    const savedUri = await copyUriIfPossible(asset.uri, 'template_file', ext);
    return {
      fileName,
      fileUri: savedUri,
      fileType: asset.mimeType || 'application/octet-stream',
    };
  } catch (error) {
    Alert.alert(t('Ошибка'), t('Не удалось открыть выбор файла'));
    return null;
  }
}

export async function shareFile(uri: string, message?: string, mimeType?: string) {
  try {
    const Sharing = await import('expo-sharing');
    const canShare = await Sharing.isAvailableAsync();
    if (!canShare) {
      Alert.alert(t('Отправить файл'), t('На этом устройстве отправка файла недоступна'));
      return;
    }
    await Sharing.shareAsync(uri, {
      mimeType,
      dialogTitle: message || t('Отправить файл'),
    });
  } catch {
    Alert.alert(t('Ошибка'), t('Не удалось отправить файл'));
  }
}

function formatBytes(bytes?: number) {
  if (!bytes || bytes <= 0) return '0 KB';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export async function createBackupFile(payload: any): Promise<LastBackupInfo> {
  const now = new Date();
  const body = JSON.stringify(payload ?? {}, null, 2);
  try {
    const FileSystem = await import('expo-file-system');
    const dir = `${FileSystem.documentDirectory || ''}agashka/backups/`;
    const fileName = `agashka-backup-${now.toISOString().slice(0, 10)}.json`;
    const fileUri = `${dir}${fileName}`;
    if (FileSystem.documentDirectory) {
      await FileSystem.makeDirectoryAsync(dir, { intermediates: true }).catch(() => undefined);
      await FileSystem.writeAsStringAsync(fileUri, body);
      return {
        fileUri,
        fileName,
        createdAt: now.toISOString(),
        sizeLabel: formatBytes(body.length),
        clientsCount: Array.isArray(payload?.clients) ? payload.clients.length : 0,
        templatesCount: Array.isArray(payload?.plans) ? payload.plans.length : 0,
      } as LastBackupInfo;
    }
  } catch {}
  return {
    fileUri: 'memory://backup.json',
    fileName: `agashka-backup-${now.toISOString().slice(0, 10)}.json`,
    createdAt: now.toISOString(),
    sizeLabel: formatBytes(body.length),
    clientsCount: Array.isArray(payload?.clients) ? payload.clients.length : 0,
    templatesCount: Array.isArray(payload?.plans) ? payload.plans.length : 0,
  } as LastBackupInfo;
}

export async function pickBackupFile() {
  try {
    const file = await pickAndSaveFile();
    if (!file?.fileUri) return null;
    const FileSystem = await import('expo-file-system');
    const text = await FileSystem.readAsStringAsync(file.fileUri);
    return JSON.parse(text);
  } catch {
    Alert.alert(t('Ошибка'), t('Не удалось восстановить данные'));
    return null;
  }
}

export async function makePortableBackup(clients: Client[], plans: PlanTemplate[], recoveryEmail = '', profile?: TrainerProfile) {
  return { app: 'Agashka Power', version: '2.17.6', type: 'full-backup', createdAt: new Date().toISOString(), clients, plans, recoveryEmail, profile };
}

export async function restorePortableFiles(data: any): Promise<PlanTemplate[]> {
  return Array.isArray(data?.plans) ? data.plans : [];
}

export async function restoreProfilePhoto(data: any) { return data?.profile?.photoUri ?? null; }
export async function restoreClientPhotos(data: any, clients: Client[]) { return clients; }
