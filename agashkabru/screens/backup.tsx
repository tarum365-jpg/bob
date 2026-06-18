import React, { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '../src/components/TranslatedText';
import { MaterialCommunityIcons } from '../src/components/SafeIcon';
import { useFocusEffect } from '../src/navigation';
import { AppShell } from '../src/components/AppShell';
import { colors, spacing } from '../src/constants/theme';
import { createBackupFile, pickBackupFile, shareFile } from '../src/storage/fileStore';
import { localStore } from '../src/storage/localStore';
import { BackupReminder, LastBackupInfo } from '../src/types';

type ActionButton = {
  label: string;
  icon: string;
  color: string;
  onPress: () => void;
  active?: boolean;
};

type SecurityCardProps = {
  icon: string;
  color: string;
  title: string;
  description: string | string[];
  actions: ActionButton[];
};

export default function BackupScreen() {
  const [lastBackup, setLastBackup] = useState<LastBackupInfo | null>(null);
  const [reminder, setReminder] = useState<BackupReminder>('off');

  useFocusEffect(useCallback(() => {
    localStore.getLastBackupInfo().then(setLastBackup);
    localStore.getBackupReminder().then(setReminder);
  }, []));

  async function onCreateBackup() {
    try {
      const data = await localStore.exportFullBackup();
      const info = await createBackupFile(data);
      await localStore.setLastBackupInfo(info);
      setLastBackup(info);
      Alert.alert('Копия создана', 'Резервная копия создана. Теперь её можно сохранить или отправить.');
    } catch {
      Alert.alert('Ошибка', 'Не удалось создать резервную копию.');
    }
  }

  async function onShareBackup() {
    try {
      if (!lastBackup?.fileUri) return Alert.alert('Копия не найдена', 'Сначала создайте резервную копию.');
      await shareFile(lastBackup.fileUri, 'Сохранить или отправить резервную копию', 'application/json');
    } catch {
      Alert.alert('Ошибка', 'Не удалось отправить резервную копию.');
    }
  }

  async function onRestoreBackup() {
    try {
      const data = await pickBackupFile();
      if (!data) return;
      await localStore.importFullBackup(data);
      Alert.alert('Готово', 'Данные успешно восстановлены.');
    } catch {
      Alert.alert('Ошибка', 'Не удалось восстановить данные. Проверьте, что выбран .json файл приложения.');
    }
  }

  async function setBackupReminder(value: BackupReminder) {
    setReminder(value);
    await localStore.setBackupReminder(value);
  }

  const lastCopyDate = lastBackup?.createdAt
    ? new Date(lastBackup.createdAt).toLocaleString('ru-RU')
    : 'Копия ещё не создана';

  const nextDate = useMemo(() => {
    if (!lastBackup?.createdAt || reminder === 'off') return 'Не настроено';
    const base = new Date(lastBackup.createdAt);
    if (reminder === '14days') base.setDate(base.getDate() + 14);
    if (reminder === 'monthly') base.setMonth(base.getMonth() + 1);
    return base.toLocaleDateString('ru-RU');
  }, [lastBackup, reminder]);

  return (
    <AppShell title="Безопасность" active="backup">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text maxFontSizeMultiplier={1.0} style={styles.pageTitle}>Резервные копии</Text>
        <Text maxFontSizeMultiplier={1.0} style={styles.pageSubtitle}>Сохранение базы, файлов и настроек приложения</Text>

        <SecurityCard
          icon="database-check"
          color="#F4C430"
          title="Резервная копия базы"
          description={["Клиенты", "Финансы", "Шаблоны"]}
          actions={[
            { label: 'Создать', icon: 'download-outline', color: '#F4C430', onPress: onCreateBackup },
            { label: 'Восстановить', icon: 'restore', color: '#F4C430', onPress: onRestoreBackup },
          ]}
        />

        <SecurityCard
          icon="folder-open"
          color="#4FA3FF"
          title="Файлы приложения"
          description={["PDF", "Excel", "DOCX", "Фото"]}
          actions={[
            { label: 'Экспорт', icon: 'upload-outline', color: '#4FA3FF', onPress: onShareBackup },
            { label: 'Импорт', icon: 'download-outline', color: '#4FA3FF', onPress: onRestoreBackup },
          ]}
        />

        <SecurityCard
          icon="cloud-sync"
          color="#63D471"
          title="Синхронизация"
          description={["Google Drive", "Telegram", "WhatsApp"]}
          actions={[
            { label: 'Синхронизировать', icon: 'sync', color: '#63D471', onPress: onShareBackup },
          ]}
        />

        <SecurityCard
          icon="calendar-sync"
          color="#B16CFF"
          title="Автосохранение"
          description={["Автоматическое создание резервной копии"]}
          actions={[
            { label: 'Выкл', icon: 'bell-off-outline', color: '#B16CFF', active: reminder === 'off', onPress: () => setBackupReminder('off') },
            { label: '14 дней', icon: 'bell-ring-outline', color: '#B16CFF', active: reminder === '14days', onPress: () => setBackupReminder('14days') },
            { label: 'Месяц', icon: 'calendar-month', color: '#B16CFF', active: reminder === 'monthly', onPress: () => setBackupReminder('monthly') },
          ]}
        />

        <View style={styles.restoreCard}>
          <View style={styles.restoreHeader}>
            <ColorIcon icon="shield-refresh" color="#C64545" />
            <View style={styles.restoreTextBox}>
              <Text maxFontSizeMultiplier={1.0} style={styles.restoreTitle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.82}>Полное восстановление</Text>
              <Text maxFontSizeMultiplier={1.0} style={styles.restoreSub}>Клиенты • Шаблоны • Финансы</Text>
              <Text maxFontSizeMultiplier={1.0} style={styles.restoreSub}>Настройки • Файлы</Text>
            </View>
          </View>
          <Pressable onPress={onRestoreBackup} style={styles.restoreButton}>
            <MaterialCommunityIcons name="restore" size={25} color="#FFFFFF" />
            <Text maxFontSizeMultiplier={1.0} style={styles.restoreButtonText} numberOfLines={1}>Восстановить всё</Text>
          </Pressable>
        </View>

        <View style={styles.statusCard}>
          <StatusRow icon="clock-outline" color="#63D471" label="Последняя копия" value={lastCopyDate} />
          <StatusRow icon="calendar-month" color="#4FA3FF" label="Следующее сохранение" value={nextDate} />
          <StatusRow icon="package-variant" color="#F4C430" label="Размер файла" value={lastBackup?.sizeLabel || '—'} />
          <StatusRow icon="file-document-outline" color="#E5E7EB" label="Имя файла" value={lastBackup?.fileName || '—'} />
        </View>
      </ScrollView>
    </AppShell>
  );
}

function ColorIcon({ icon, color, size = 36, compact = false }: { icon: string; color: string; size?: number; compact?: boolean }) {
  return (
    <View style={[compact ? styles.colorDotSmall : styles.colorDot, { borderColor: color, backgroundColor: `${color}28` }]}>
      <MaterialCommunityIcons name={icon as any} size={size} color={color} />
    </View>
  );
}

function SecurityCard({ icon, color, title, description, actions }: SecurityCardProps) {
  const lines = Array.isArray(description) ? description : [description];
  return (
    <View style={styles.securityCard}>
      <View style={styles.securityHeader}>
        <ColorIcon icon={icon} color={color} />
        <Text maxFontSizeMultiplier={1.0} style={[styles.cardTitle, { color }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.82}>{title}</Text>
      </View>

      <View style={styles.securityBody}>
        <View style={styles.securityTextBox}>
          {lines.map(line => (
            <Text key={line} maxFontSizeMultiplier={1.0} style={[styles.cardSub, title === 'Автосохранение' && styles.autoSaveSub]} numberOfLines={title === 'Автосохранение' ? 3 : 1} adjustsFontSizeToFit minimumFontScale={0.86}>{line}</Text>
          ))}
        </View>
        <View style={styles.actionColumn}>
          {actions.map(action => (
            <Pressable key={action.label} onPress={action.onPress} style={[styles.actionButton, { borderColor: action.color }, action.active && { backgroundColor: `${action.color}24` }]}>
              <MaterialCommunityIcons name={action.icon as any} size={21} color="#FFFFFF" />
              <Text maxFontSizeMultiplier={1.0} style={styles.actionText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.78}>{action.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

function StatusRow({ icon, color, label, value }: { icon: string; color: string; label: string; value: string }) {
  return (
    <View style={styles.statusRow}>
      <ColorIcon icon={icon} color={color} size={24} compact />
      <View style={styles.statusTextBox}>
        <Text maxFontSizeMultiplier={1.0} style={styles.statusLabel} numberOfLines={1}>{label}</Text>
      </View>
      <Text maxFontSizeMultiplier={1.0} style={styles.statusValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.76}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, paddingBottom: 96 },
  pageTitle: { fontSize: 40, lineHeight: 46, fontWeight: '900', color: colors.text, marginBottom: 8 },
  pageSubtitle: { fontSize: 23, lineHeight: 30, fontWeight: '800', color: colors.muted, marginBottom: 16 },

  securityCard: {
    borderRadius: 26,
    backgroundColor: colors.card,
    borderWidth: 1.6,
    borderColor: colors.border,
    padding: 15,
    marginBottom: 14,
  },
  securityHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  colorDot: { width: 72, height: 72, borderRadius: 36, borderWidth: 2.5, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  colorDotSmall: { width: 38, height: 38, borderRadius: 19, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  cardTitle: { flex: 1, fontSize: 33, lineHeight: 38, fontWeight: '900' },
  securityBody: { flexDirection: 'row', alignItems: 'flex-start' },
  securityTextBox: { flex: 1, paddingRight: 10, minHeight: 96, justifyContent: 'center' },
  cardSub: { fontSize: 23, lineHeight: 30, fontWeight: '900', color: colors.text },
  autoSaveSub: { fontSize: 22, lineHeight: 28, flexWrap: 'wrap' },
  actionColumn: { width: 178, gap: 9 },
  actionButton: { minHeight: 46, borderRadius: 15, backgroundColor: colors.cardSecond, borderWidth: 1.7, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6, paddingHorizontal: 10 },
  actionText: { fontSize: 19, lineHeight: 23, fontWeight: '900', color: '#FFFFFF', textAlign: 'center' },

  restoreCard: { borderRadius: 26, backgroundColor: colors.card, borderWidth: 1.8, borderColor: '#C64545', padding: 15, marginTop: 2, marginBottom: 14 },
  restoreHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  restoreTextBox: { flex: 1 },
  restoreTitle: { fontSize: 37, lineHeight: 42, fontWeight: '900', color: '#FF7070' },
  restoreSub: { marginTop: 2, fontSize: 23, lineHeight: 29, fontWeight: '900', color: colors.text },
  restoreButton: { minHeight: 58, borderRadius: 17, backgroundColor: '#C64545', alignSelf: 'center', paddingHorizontal: 30, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 9 },
  restoreButtonText: { fontSize: 25, lineHeight: 30, fontWeight: '900', color: '#FFFFFF' },

  statusCard: { borderRadius: 26, backgroundColor: colors.card, borderWidth: 1.6, borderColor: colors.border, padding: 14, marginBottom: 14 },
  statusRow: { minHeight: 66, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.border },
  statusTextBox: { flex: 1 },
  statusLabel: { fontSize: 24, lineHeight: 29, fontWeight: '900', color: colors.gold },
  statusValue: { width: '48%', fontSize: 23, lineHeight: 28, fontWeight: '900', color: colors.text, textAlign: 'left' },
});
