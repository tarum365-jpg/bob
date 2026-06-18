import React, { useCallback, useMemo, useState } from 'react';
import { Alert, Modal, PanResponder, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '../src/components/TranslatedText';
import { useFocusEffect } from '../src/navigation';
import { AppShell } from '../src/components/AppShell';
import { Button } from '../src/components/Button';
import { Input } from '../src/components/Input';
import { colors, spacing } from '../src/constants/theme';
import { pickAndSaveFile, shareFile } from '../src/storage/fileStore';
import { localStore } from '../src/storage/localStore';
import { PlanCategory, PlanTemplate } from '../src/types';
import { makeId } from '../src/utils/id';

const cats: Array<{ label: PlanCategory; icon: string }> = [
  { label: 'Жим лёжа', icon: '🎯' },
  { label: 'Сила', icon: '⚡' },
  { label: 'Пауэрлифтинг', icon: '🏋️' },
  { label: 'Набор массы', icon: '💪' },
  { label: 'Здоровье', icon: '💗' },
  { label: 'Похудение', icon: '🔥' },
];

const durations = ['8 недель', '12 недель', '16 недель'];
const emptyPlan: PlanTemplate = {
  id: '', title: '', category: 'Жим лёжа', duration: '8 недель', level: '', goal: '',
  fileName: '', fileUri: '', fileType: '', version: '1.0', isArchived: false, createdAt: '', comment: '',
};

function categoryIcon(category: string) {
  return cats.find(c => c.label === category)?.icon || '📄';
}

function formatDate(value?: string) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('ru-RU');
}

export default function PlansScreen() {
  const [plans, setPlans] = useState<PlanTemplate[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<PlanCategory | 'Все'>('Все');
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<PlanTemplate>(emptyPlan);

  const load = useCallback(() => { localStore.getPlans().then(setPlans); }, []);
  useFocusEffect(load);

  const activePlans = useMemo(() => plans.filter(p => !p.isArchived), [plans]);
  const filtered = useMemo(() => activePlans.filter(p => {
    const matchesFilter = filter === 'Все' || p.category === filter;
    const haystack = `${p.title} ${p.category} ${p.duration} ${p.level} ${p.goal} ${p.comment} ${p.fileName}`.toLowerCase();
    const matchesSearch = !search || haystack.includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  }), [activePlans, filter, search]);

  function startUpload() {
    setDraft({ ...emptyPlan, id: makeId(), createdAt: new Date().toISOString() });
    setOpen(true);
  }

  function openEdit(plan: PlanTemplate) {
    setDraft(plan);
    setOpen(true);
  }

  async function chooseFile() {
    const file = await pickAndSaveFile();
    if (file) setDraft(p => ({ ...p, ...file, title: p.title || file.fileName.replace(/\.[^.]+$/, '') }));
  }

  async function savePlan() {
    if (!draft.title.trim()) return Alert.alert('Ошибка', 'Введите название шаблона.');
    if (!draft.fileUri) return Alert.alert('Ошибка', 'Выберите файл PDF / Word / Excel.');
    const exists = plans.some(p => p.id === draft.id);
    const next = exists ? plans.map(p => p.id === draft.id ? draft : p) : [draft, ...plans];
    await localStore.savePlans(next);
    setOpen(false);
    load();
  }

  async function archivePlan() {
    Alert.alert('Архивировать шаблон?', 'Шаблон исчезнет из активной библиотеки, но останется в памяти приложения.', [
      { text: 'Отмена', style: 'cancel' },
      { text: 'В архив', style: 'destructive', onPress: async () => {
        await localStore.savePlans(plans.map(p => p.id === draft.id ? { ...p, isArchived: true } : p));
        setOpen(false);
        load();
      }},
    ]);
  }

  async function deletePlan() {
    Alert.alert('Удалить шаблон?', 'Файл и карточка шаблона будут удалены из списка приложения.', [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Удалить', style: 'destructive', onPress: async () => {
        await localStore.savePlans(plans.filter(p => p.id !== draft.id));
        setOpen(false);
        load();
      }},
    ]);
  }

  const isExisting = plans.some(p => p.id === draft.id);
  const modalSwipeBack = React.useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, gesture) => open && gesture.dx > 45 && Math.abs(gesture.dy) < 35,
    onPanResponderRelease: (_, gesture) => { if (open && gesture.dx > 85) setOpen(false); },
  }), [open]);

  return (
    <AppShell title="Шаблоны" active="plans">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topRow}>
          <Input placeholder="Поиск шаблона" value={search} onChangeText={setSearch} style={styles.search} />
          <Pressable style={styles.addRound} onPress={startUpload} accessibilityLabel="Добавить шаблон"><Text style={styles.plus}>+</Text></Pressable>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersRow}>
          <Pressable onPress={() => setFilter('Все')} style={[styles.filterChip, filter === 'Все' && styles.filterActive]}>
            <Text style={[styles.filterText, filter === 'Все' && styles.filterActiveText]} numberOfLines={1}>• Все</Text>
            <View style={styles.countPill}><Text style={styles.countText}>{activePlans.length}</Text></View>
          </Pressable>
          {cats.map(c => {
            const count = activePlans.filter(p => p.category === c.label).length;
            const active = filter === c.label;
            return <Pressable key={c.label} onPress={() => setFilter(c.label)} style={[styles.filterChip, active && styles.filterActive]}>
              <Text style={[styles.filterText, active && styles.filterActiveText]} numberOfLines={1}>{c.icon} {c.label}</Text>
              <View style={styles.countPill}><Text style={styles.countText}>{count}</Text></View>
            </Pressable>;
          })}
        </ScrollView>

        <Text style={styles.resultText}>Найдено: {filtered.length} из {activePlans.length}</Text>

        {filtered.length === 0 ? (
          <View style={styles.emptyCard}><View style={styles.emptyIconBox}><Text style={styles.emptyIcon}>📁</Text></View><View style={styles.emptyTextBox}><Text style={styles.emptyTitle}>Нет активных шаблонов</Text><Text style={styles.emptySub}>Нажми “+”, чтобы загрузить PDF, Word или Excel.</Text></View></View>
        ) : filtered.map(p => (
          <Pressable key={p.id} style={styles.planCard} onPress={() => openEdit(p)}>
            <View style={styles.planIcon}><Text style={styles.planEmoji}>{categoryIcon(p.category)}</Text></View>
            <View style={styles.planMain}>
              <Text style={styles.planTitle} numberOfLines={1}>{p.title}</Text>
              <Text style={styles.planSub} numberOfLines={1}>{p.category} • {p.duration}{p.level ? ` • ${p.level}` : ''}</Text>
              <Text style={styles.planFile} numberOfLines={1}>📄 {p.fileName || 'Файл не выбран'}   v{p.version || '1.0'}</Text>
            </View>
            <View style={styles.planActions}>
              <Pressable onPress={() => p.fileUri ? shareFile(p.fileUri, 'Отправить шаблон') : Alert.alert('Нет файла', 'У этого шаблона не выбран файл.')} style={styles.sendButton}>
                <Text style={styles.sendText}>📤</Text>
              </Pressable>
              <Text style={styles.chevron}>›</Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>

      <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={styles.modalRoot} {...modalSwipeBack.panHandlers}>
          <ScrollView contentContainerStyle={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.modalHeader}>
              <Pressable onPress={() => setOpen(false)} style={styles.backButton}><Text style={styles.modalBackText}>← Назад</Text></Pressable>
              <Text style={styles.modalTitle}>{isExisting ? 'Карточка шаблона' : 'Новый шаблон'}</Text>
            </View>

            <View style={styles.templateHead}>
              <View style={styles.bigTemplateIcon}><Text style={styles.bigTemplateEmoji}>{categoryIcon(draft.category)}</Text></View>
              <Pressable style={styles.fileButton} onPress={chooseFile}><Text style={styles.fileButtonText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.82}>📄 {draft.fileUri ? 'Заменить файл' : 'Выбрать файл'}</Text></Pressable>
            </View>
            <Text style={styles.fileHint} numberOfLines={2}>{draft.fileName || 'Поддерживаются файлы: .pdf, .docx, .xlsx'}</Text>

            <View style={styles.formGrid}>
              <Input placeholder="Название шаблона" value={draft.title} onChangeText={v => setDraft(p => ({ ...p, title: v }))} style={styles.fullInput} />
              <Input placeholder="Цель программы" value={draft.goal} onChangeText={v => setDraft(p => ({ ...p, goal: v }))} style={styles.fullInput} />
              <Input placeholder="Уровень" value={draft.level} onChangeText={v => setDraft(p => ({ ...p, level: v }))} style={styles.halfInput} />
              <Input placeholder="Версия" value={draft.version} onChangeText={v => setDraft(p => ({ ...p, version: v }))} style={styles.halfInput} />
            </View>

            <Text style={styles.formTitle}>Категория</Text>
            <View style={styles.categoryGrid}>{cats.map(item => { const active = draft.category === item.label; return <Pressable key={item.label} onPress={() => setDraft(p => ({ ...p, category: item.label }))} style={[styles.categoryChip, active && styles.categoryChipActive]}><Text style={styles.categoryIcon}>{item.icon}</Text><Text style={[styles.categoryText, active && styles.categoryTextActive]} numberOfLines={1}>{item.label}</Text></Pressable>; })}</View>

            <Text style={styles.formTitle}>Длительность</Text>
            <View style={styles.durationRow}>{durations.map(item => { const active = draft.duration === item; return <Pressable key={item} onPress={() => setDraft(p => ({ ...p, duration: item }))} style={[styles.durationButton, active && styles.durationButtonActive]}><Text style={[styles.durationText, active && styles.durationTextActive]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.82}>{item}</Text></Pressable>; })}</View>

            <Input placeholder="Комментарий тренера" value={draft.comment} onChangeText={v => setDraft(p => ({ ...p, comment: v }))} multiline />
            <Text style={styles.createdText}>Создан: {formatDate(draft.createdAt)}</Text>

            <View style={styles.buttonRow}>
              <Pressable style={styles.saveButton} onPress={savePlan}><Text style={styles.saveText}>💾 Сохранить</Text></Pressable>
              {isExisting && <Pressable style={styles.archiveButton} onPress={archivePlan}><Text style={styles.archiveButtonText}>🗄 Архив</Text></Pressable>}
            </View>
            {isExisting && <Pressable style={styles.deleteButton} onPress={deletePlan}><Text style={styles.deleteText}>🗑 Удалить шаблон</Text></Pressable>}
          </ScrollView>
        </View>
      </Modal>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, paddingBottom: 40 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  search: { flex: 1 },
  addRound: { width: 66, height: 66, borderRadius: 33, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center' },
  plus: { fontSize: 42, fontWeight: '900', color: colors.background, marginTop: -3 },
  filtersRow: { gap: 10, paddingTop: 12, paddingBottom: 2 },
  filterChip: { minHeight: 54, borderRadius: 16, paddingLeft: 14, paddingRight: 9, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 10 },
  filterActive: { borderColor: colors.gold },
  filterText: { color: colors.text, fontWeight: '900', fontSize: 21, lineHeight: 25 },
  filterActiveText: { color: colors.gold },
  countPill: { minWidth: 32, height: 28, borderRadius: 14, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  countText: { color: colors.text, fontSize: 15, fontWeight: '900' },
  resultText: { marginTop: 16, marginBottom: 10, color: colors.gold, fontSize: 27, fontWeight: '900' },
  emptyCard: { borderRadius: 22, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, padding: 18, minHeight: 160, flexDirection: 'row', alignItems: 'center' },
  emptyIconBox: { width: 88, height: 88, borderRadius: 22, backgroundColor: colors.cardSecond, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  emptyIcon: { fontSize: 44 },
  emptyTextBox: { flex: 1 },
  emptyTitle: { color: colors.text, fontSize: 27, fontWeight: '900' },
  emptySub: { color: colors.muted, fontSize: 21, fontWeight: '700', marginTop: 8 },
  planCard: { minHeight: 126, borderRadius: 22, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, padding: 14, marginBottom: 11, flexDirection: 'row', alignItems: 'center' },
  planIcon: { width: 74, height: 74, borderRadius: 24, borderWidth: 1, borderColor: colors.gold, backgroundColor: colors.cardSecond, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  planEmoji: { fontSize: 31 },
  planMain: { flex: 1, paddingRight: 8 },
  planTitle: { color: colors.text, fontSize: 25, lineHeight: 30, fontWeight: '900' },
  planSub: { color: colors.gold, fontSize: 19, lineHeight: 24, fontWeight: '900', marginTop: 3 },
  planFile: { color: colors.muted, fontSize: 18, lineHeight: 23, fontWeight: '700', marginTop: 3 },
  planActions: { width: 62, alignItems: 'center', justifyContent: 'center', gap: 8 },
  sendButton: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.cardSecond, alignItems: 'center', justifyContent: 'center' },
  sendText: { fontSize: 24 },
  chevron: { color: colors.muted, fontSize: 40, fontWeight: '900', lineHeight: 42 },
  modalRoot: { flex: 1, backgroundColor: colors.background },
  modalContent: { padding: spacing.md, paddingTop: 78, paddingBottom: 130 },
  modalHeader: { marginBottom: 18 },
  modalTitle: { color: colors.gold, fontSize: 34, fontWeight: '900', marginTop: 6 },
  closeText: { color: colors.muted, fontSize: 32, fontWeight: '900' },
  backButton: { alignSelf: 'flex-start', marginBottom: 6 },
  modalBackText: { color: colors.gold, fontSize: 24, fontWeight: '900' },
  templateHead: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  bigTemplateIcon: { width: 88, height: 88, borderRadius: 28, borderWidth: 1, borderColor: colors.gold, backgroundColor: colors.cardSecond, alignItems: 'center', justifyContent: 'center' },
  bigTemplateEmoji: { fontSize: 40 },
  fileButton: { flex: 1, height: 68, borderRadius: 18, borderWidth: 1, borderColor: colors.gold, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  fileButtonText: { fontSize: 24, fontWeight: '900', color: colors.gold },
  fileHint: { marginTop: 10, marginBottom: 14, fontSize: 21, lineHeight: 20, fontWeight: '700', color: colors.muted },
  formGrid: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 12 },
  fullInput: { width: '100%' },
  halfInput: { flex: 1, minWidth: '46%' },
  formTitle: { marginTop: 16, marginBottom: 10, color: colors.gold, fontSize: 25, fontWeight: '900' },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryChip: { minWidth: '31%', minHeight: 66, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.cardSecond, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  categoryChipActive: { borderColor: colors.gold },
  categoryIcon: { fontSize: 26, marginBottom: 2 },
  categoryText: { fontSize: 18, lineHeight: 21, fontWeight: '900', textAlign: 'center', color: colors.text },
  categoryTextActive: { color: colors.gold },
  durationRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  durationButton: { flex: 1, height: 68, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.cardSecond, alignItems: 'center', justifyContent: 'center' },
  durationButtonActive: { borderColor: colors.gold },
  durationText: { fontSize: 20, fontWeight: '900', color: colors.text },
  durationTextActive: { color: colors.gold },
  createdText: { marginTop: 8, color: colors.muted, fontSize: 21, fontWeight: '700' },
  buttonRow: { flexDirection: 'row', gap: 12, marginTop: 18 },
  saveButton: { flex: 1, height: 58, borderRadius: 17, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center' },
  saveText: { color: colors.text, fontSize: 21, fontWeight: '900' },
  archiveButton: { flex: 1, height: 58, borderRadius: 17, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  archiveButtonText: { color: colors.gold, fontSize: 21, fontWeight: '900' },
  deleteButton: { height: 58, borderRadius: 17, borderWidth: 1, borderColor: colors.red, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  deleteText: { color: colors.red, fontSize: 21, fontWeight: '900' },
});
