import React, { useCallback, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '../src/components/TranslatedText';
import { AppShell } from '../src/components/AppShell';
import { Button } from '../src/components/Button';
import { Card } from '../src/components/Card';
import { Input } from '../src/components/Input';
import { colors, spacing } from '../src/constants/theme';
import { pickAndSaveFile, shareFile } from '../src/storage/fileStore';
import { localStore } from '../src/storage/localStore';
import { Client, PlanCategory, PlanTemplate } from '../src/types';
import { makeId } from '../src/utils/id';
import { router, useFocusEffect } from '../src/navigation';

const categories: Array<{ label: PlanCategory | 'Все'; icon: string }> = [
  { label: 'Все', icon: '📋' },
  { label: 'Жим лёжа', icon: '🎯' },
  { label: 'Сила', icon: '⚡' },
  { label: 'Пауэрлифтинг', icon: '🏋️' },
  { label: 'Набор массы', icon: '💪' },
];

function initial(name: string) {
  return (name || '?').trim().slice(0, 1).toUpperCase();
}

export default function AssignScreen() {
  const [clients, setClients] = useState<Client[]>([]);
  const [plans, setPlans] = useState<PlanTemplate[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<PlanTemplate | null>(null);
  const [manualFile, setManualFile] = useState<{ fileName: string; fileUri: string; fileType: string } | null>(null);
  const [category, setCategory] = useState<PlanCategory | 'Все'>('Все');
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState(new Date().toLocaleDateString('ru-RU'));
  const [showAllClients, setShowAllClients] = useState(false);

  useFocusEffect(useCallback(() => {
    localStore.getClients().then(setClients);
    localStore.getPlans().then(setPlans);
  }, []));

  const activeClients = clients.filter(c => c.status === 'active');
  const visibleClients = showAllClients ? activeClients : activeClients.slice(0, 3);
  const filteredPlans = plans.filter(p =>
    !p.isArchived &&
    (category === 'Все' || p.category === category) &&
    (!search || `${p.title} ${p.category} ${p.fileName} ${p.comment || ''}`.toLowerCase().includes(search.toLowerCase()))
  );

  async function chooseManualFile() {
    const f = await pickAndSaveFile();
    if (f) setManualFile(f);
  }

  async function assign() {
    if (!selectedClient) return Alert.alert('Ошибка', 'Выберите клиента.');
    if (!selectedPlan && !manualFile) return Alert.alert('Ошибка', 'Выберите шаблон или файл программы.');
    const fileUri = manualFile?.fileUri || selectedPlan?.fileUri || '';
    const fileName = manualFile?.fileName || selectedPlan?.fileName || '';
    const title = selectedPlan?.title || manualFile?.fileName || 'Разовая программа';
    const clientsNow = await localStore.getClients();
    const updated = clientsNow.map(c => {
      if (c.id !== selectedClient.id) return c;
      const old = (c.assignedPlanHistory || []).map(p => p.status === 'active' ? { ...p, status: 'archived' as const } : p);
      return {
        ...c,
        assignedPlanId: selectedPlan?.id,
        assignedPlanHistory: [{
          id: makeId(),
          planId: selectedPlan?.id || 'manual',
          title,
          fileName,
          fileUri,
          duration: selectedPlan?.duration,
          assignedAt: new Date().toISOString(),
          startDate,
          status: 'active' as const,
          comment: selectedPlan?.comment,
        }, ...old],
      };
    });
    await localStore.saveClients(updated);
    Alert.alert('Готово', 'Программа назначена клиенту.');
  }

  async function sendFile() {
    const uri = manualFile?.fileUri || selectedPlan?.fileUri;
    if (!uri) return Alert.alert('Файл не выбран');
    await shareFile(uri, 'Отправить файл клиенту');
  }

  return (
    <AppShell title="Назначение" active="assign">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.screenTitle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.82}>Назначение программы</Text>

        <View style={styles.stepsCard}>
          <Step n="1" label="Клиент" active={!!selectedClient} />
          <View style={styles.stepLine} />
          <Step n="2" label="Шаблон" active={!!selectedPlan || !!manualFile} />
          <View style={styles.stepLine} />
          <Step n="3" label="Отправка" />
        </View>

        <View style={styles.sectionHeader}>
          <View style={styles.headerLinksOnly}>
            <Pressable onPress={() => setShowAllClients(v => !v)}>
              <Text style={styles.headerLink} numberOfLines={1}>{showAllClients ? 'Скрыть' : 'Все клиенты'}</Text>
            </Pressable>
            <Pressable onPress={() => router.push('/clients' as never)}>
              <Text style={styles.headerLinkMuted} numberOfLines={1}>База ›</Text>
            </Pressable>
          </View>
        </View>

        {visibleClients.length ? (
          <View style={styles.clientRow}>
            {visibleClients.map(c => (
              <Pressable key={c.id} onPress={() => setSelectedClient(c)} style={[styles.clientMini, selectedClient?.id === c.id && styles.selected]}>
                {c.photoUri ? <Image source={{ uri: c.photoUri }} style={styles.miniAvatar} /> : <View style={styles.miniAvatarEmpty}><Text style={styles.miniInitial}>{initial(c.name)}</Text></View>}
                <Text style={styles.miniName} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.82}>{c.name}</Text>
                <Text style={styles.miniStatus} numberOfLines={1}>Активен</Text>
              </Pressable>
            ))}
          </View>
        ) : (
          <Card style={styles.emptyClientCard}>
            <Text style={styles.emptyIcon}>👤</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.emptyTitle}>Клиент не выбран</Text>
              <Text style={styles.emptyText}>Добавьте клиента или выберите его из базы.</Text>
            </View>
          </Card>
        )}

        <Text style={styles.sectionTitle}>📄 Шаблон программы</Text>
        <Input placeholder="Поиск шаблона" value={search} onChangeText={setSearch} />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {categories.map(c => (
            <Pressable key={c.label} onPress={() => setCategory(c.label)} style={[styles.chip, category === c.label && styles.chipActive]}>
              <Text style={[styles.chipText, category === c.label && styles.chipTextActive]} numberOfLines={1}>{c.icon} {c.label}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {filteredPlans.slice(0, 5).map(p => (
          <Pressable key={p.id} onPress={() => setSelectedPlan(p)} style={[styles.programCard, selectedPlan?.id === p.id && styles.selected]}>
            <View style={styles.docIcon}><Text style={styles.docEmoji}>📄</Text></View>
            <View style={styles.programTextBlock}>
              <Text style={styles.programTitle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.78}>{p.title}</Text>
              <Text style={styles.programSub} numberOfLines={1}>{p.category} • {p.duration} • v{p.version || '1.0'}</Text>
              <Text style={styles.programFile} numberOfLines={1}>{p.fileName}</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        ))}

        <Pressable style={styles.fileCard} onPress={chooseManualFile}>
          <View style={styles.docIcon}><Text style={styles.docEmoji}>📎</Text></View>
          <View style={styles.programTextBlock}>
            <Text style={styles.programTitle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.78}>Выбрать файл</Text>
            <Text style={styles.programSub} numberOfLines={1}>{manualFile?.fileName || 'PDF • DOCX • XLSX'}</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </Pressable>

        <Card style={styles.summary}>
          <Text style={styles.summaryTitle} numberOfLines={1}>📌 Итог назначения</Text>
          <SummaryRow icon="👤" label="Клиент" value={selectedClient?.name || 'Не выбран'} />
          <SummaryRow icon="📄" label="План" value={selectedPlan?.title || 'Не выбран'} />
          <SummaryRow icon="📎" label="Файл" value={manualFile?.fileName || selectedPlan?.fileName || 'Не выбран'} />
          <Input placeholder="Дата начала" value={startDate} onChangeText={setStartDate} />
          <Button title="✅ Назначить" onPress={assign} />
          <Button title="📤 Отправить файл" onPress={sendFile} variant="outline" />
        </Card>
      </ScrollView>
    </AppShell>
  );
}

function Step({ n, label, active }: { n: string; label: string; active?: boolean }) {
  return (
    <View style={styles.step}>
      <View style={[styles.stepCircle, active && styles.stepActive]}>
        <Text style={styles.stepN}>{n}</Text>
      </View>
      <Text style={[styles.stepLabel, active && { color: colors.gold }]} numberOfLines={1}>{label}</Text>
    </View>
  );
}

function SummaryRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.sumIcon}>{icon}</Text>
      <View style={styles.sumTextBlock}>
        <Text style={styles.sumLabel} numberOfLines={1}>{label}</Text>
        <Text style={styles.sumValue} numberOfLines={2}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, paddingBottom: 42 },
  screenTitle: { fontSize: 34, lineHeight: 42, color: colors.text, fontWeight: '900', marginBottom: 14 },
  stepsCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 22, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.card, paddingVertical: 14, paddingHorizontal: 12, marginBottom: 16 },
  step: { alignItems: 'center', width: 86 },
  stepLine: { flex: 1, height: 4, borderRadius: 4, backgroundColor: colors.gold, marginHorizontal: 3, marginBottom: 20 },
  stepCircle: { width: 54, height: 54, borderRadius: 27, backgroundColor: colors.cardSecond, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.gold },
  stepActive: { borderColor: colors.gold, backgroundColor: colors.cardSecond },
  stepN: { fontSize: 24, color: colors.gold, fontWeight: '900' },
  stepLabel: { marginTop: 7, color: colors.gold, fontWeight: '900', fontSize: 16, textAlign: 'center' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', gap: 10, marginTop: 4 },
  headerLinks: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerLinksOnly: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 8, marginBottom: 4 },
  sectionTitle: { fontSize: 28, lineHeight: 34, color: colors.gold, fontWeight: '900', marginVertical: 12 },
  headerLink: { color: colors.gold, fontSize: 19, fontWeight: '900' },
  headerLinkMuted: { color: colors.muted, fontSize: 18, fontWeight: '900' },
  clientRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  clientMini: { width: '31.5%', minHeight: 128, borderRadius: 20, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', padding: 8 },
  selected: { borderColor: colors.gold, borderWidth: 2.5 },
  miniAvatar: { width: 54, height: 54, borderRadius: 27, marginBottom: 7 },
  miniAvatarEmpty: { width: 54, height: 54, borderRadius: 27, backgroundColor: colors.client, alignItems: 'center', justifyContent: 'center', marginBottom: 7 },
  miniInitial: { color: '#FFF', fontWeight: '900', fontSize: 24 },
  miniName: { color: colors.text, fontWeight: '900', fontSize: 17, lineHeight: 21, textAlign: 'center' },
  miniStatus: { color: colors.success, fontSize: 13, fontWeight: '900', marginTop: 4 },
  emptyClientCard: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, marginBottom: 8 },
  emptyIcon: { fontSize: 32 },
  emptyTitle: { color: colors.text, fontSize: 22, fontWeight: '900' },
  emptyText: { color: colors.muted, fontSize: 17, fontWeight: '700', marginTop: 4 },
  chips: { gap: 8, paddingBottom: 8, paddingTop: 6 },
  chip: { height: 48, paddingHorizontal: 14, borderRadius: 14, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.card, justifyContent: 'center' },
  chipActive: { borderColor: colors.gold, borderWidth: 2 },
  chipText: { color: colors.text, fontWeight: '900', fontSize: 17 },
  chipTextActive: { color: colors.gold },
  programCard: { minHeight: 92, borderRadius: 20, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.card, flexDirection: 'row', alignItems: 'center', padding: 12, marginTop: 10 },
  fileCard: { minHeight: 94, borderRadius: 20, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.card, flexDirection: 'row', alignItems: 'center', padding: 12, marginTop: 10 },
  docIcon: { width: 58, height: 58, borderRadius: 29, borderWidth: 1.5, borderColor: colors.gold, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  docEmoji: { fontSize: 28 },
  programTextBlock: { flex: 1, minWidth: 0 },
  programTitle: { color: colors.text, fontSize: 24, lineHeight: 29, fontWeight: '900' },
  programSub: { color: colors.gold, fontSize: 19, lineHeight: 24, fontWeight: '800', marginTop: 2 },
  programFile: { color: colors.muted, fontSize: 18, lineHeight: 22, fontWeight: '800', marginTop: 2 },
  chevron: { color: colors.muted, fontSize: 34, fontWeight: '900', marginLeft: 6 },
  summary: { padding: 16, marginTop: 14 },
  summaryTitle: { color: colors.gold, fontSize: 30, lineHeight: 36, fontWeight: '900', marginBottom: 10 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', minHeight: 74, borderBottomWidth: 1, borderBottomColor: colors.border, paddingVertical: 8 },
  sumIcon: { width: 44, fontSize: 28 },
  sumTextBlock: { flex: 1, minWidth: 0 },
  sumLabel: { color: colors.text, fontWeight: '900', fontSize: 20 },
  sumValue: { color: colors.muted, fontWeight: '800', fontSize: 19, marginTop: 2 },
});
