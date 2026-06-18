import React, { useCallback, useState } from 'react';
import { Alert, Image, Modal, PanResponder, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '../src/components/TranslatedText';
import { useFocusEffect } from '../src/navigation';
import { AppShell } from '../src/components/AppShell';
import { Input } from '../src/components/Input';
import { colors, spacing } from '../src/constants/theme';
import { pickAndSaveClientPhoto } from '../src/storage/fileStore';
import { localStore } from '../src/storage/localStore';
import { Client, ClientStatus } from '../src/types';
import { makeId } from '../src/utils/id';

function initial(name: string) { return (name || '?').trim().slice(0, 1).toUpperCase(); }
function progressFor(_: Client, i: number) { return Math.min(95, 40 + (i % 6) * 9); }
function statusColor(status: ClientStatus) { return status === 'active' ? colors.success : status === 'unpaid' ? colors.red : colors.muted; }
function statusLabel(status: ClientStatus) { return status === 'active' ? 'Активен' : status === 'pause' ? 'Пауза' : status === 'finished' ? 'Завершён' : 'Не активен'; }
function money(v?: string) { return v && String(v).trim() ? String(v) : 'Тариф не указан'; }

const emptyClient: Client = { id: '', name: '', phone: '', goal: '', tariff: '', paidAt: '', endsAt: '', amount: '', status: 'active', comment: '' };

export default function ClientsScreen() {
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'unpaid'>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [draft, setDraft] = useState<Client>(emptyClient);
  const [isNew, setIsNew] = useState(false);

  const load = useCallback(() => { localStore.getClients().then(setClients); }, []);
  useFocusEffect(load);

  const activeCount = clients.filter(c => c.status === 'active').length;
  const unpaidCount = clients.filter(c => c.status !== 'active').length;
  const filtered = clients.filter(c => {
    const okSearch = !search || `${c.name} ${c.goal} ${c.phone} ${c.amount} ${c.comment}`.toLowerCase().includes(search.toLowerCase());
    const okFilter = filter === 'all' || (filter === 'active' ? c.status === 'active' : c.status !== 'active');
    return okSearch && okFilter;
  });

  function addClient() { setDraft({ ...emptyClient, id: makeId() }); setIsNew(true); setModalOpen(true); }
  function openClient(client: Client) { setDraft(client); setIsNew(false); setModalOpen(true); }

  async function saveClient() {
    const cleanName = draft.name.trim();
    if (!cleanName) return Alert.alert('Ошибка', 'Введите имя клиента');

    const clientToSave: Client = {
      ...emptyClient,
      ...draft,
      id: draft.id || makeId(),
      name: cleanName,
      phone: draft.phone.trim(),
      goal: draft.goal.trim(),
      tariff: draft.tariff.trim(),
      amount: draft.amount.trim(),
      paidAt: draft.paidAt.trim(),
      endsAt: draft.endsAt.trim(),
      comment: draft.comment.trim(),
      status: draft.status || 'active',
    };

    try {
      await localStore.upsertClient(clientToSave);
      const savedClients = await localStore.getClients();
      setClients(savedClients);
      setSearch('');
      setFilter('all');
      setDraft(emptyClient);
      setIsNew(false);
      setModalOpen(false);
      Alert.alert('Готово', 'Клиент сохранён и добавлен в раздел «Клиенты».');
    } catch (error) {
      Alert.alert('Ошибка сохранения', 'Клиент не был сохранён. Попробуйте ещё раз.');
    }
  }

  async function pickPhoto() {
    const uri = await pickAndSaveClientPhoto();
    if (uri) setDraft(p => ({ ...p, photoUri: uri }));
  }

  function confirmDelete() {
    if (isNew || !draft.id) return setModalOpen(false);
    Alert.alert('Удалить клиента?', 'Карточка клиента исчезнет из раздела «Клиенты». Данные этого клиента будут удалены.', [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Удалить', style: 'destructive', onPress: async () => { await localStore.deleteClient(draft.id); setModalOpen(false); load(); } },
    ]);
  }

  function setStatus(status: ClientStatus) { setDraft(p => ({ ...p, status })); }

  const modalSwipeBack = React.useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, gesture) => modalOpen && gesture.dx > 45 && Math.abs(gesture.dy) < 35,
    onPanResponderRelease: (_, gesture) => { if (modalOpen && gesture.dx > 85) setModalOpen(false); },
  }), [modalOpen]);

  const filters = [
    { key: 'all' as const, label: 'Все', count: clients.length },
    { key: 'active' as const, label: 'Активные', count: activeCount },
    { key: 'unpaid' as const, label: 'Не активные', count: unpaidCount },
  ];

  return <AppShell title="Клиенты" active="clients"><ScrollView style={styles.page} contentContainerStyle={styles.content}>
    <View style={styles.topRow}><Input placeholder="Поиск клиента" value={search} onChangeText={setSearch} style={styles.search} /><Pressable style={styles.addRound} onPress={addClient}><Text style={styles.plus}>+</Text></Pressable></View>
    <View style={styles.filters}>{filters.map(f => <Pressable key={f.key} onPress={() => setFilter(f.key)} style={[styles.filterChip, filter === f.key && styles.filterActive]}>
      <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]} numberOfLines={1}>{f.label}</Text>
      <Text style={styles.filterCount}>{f.count}</Text>
    </Pressable>)}</View>
    <Text style={styles.counter}>Найдено: {filtered.length} из {clients.length}</Text>

    {filtered.length === 0 && <View style={styles.emptyCard}>
      <Text style={styles.emptyIcon}>👥</Text>
      <Text style={styles.emptyTitle}>Нет клиентов</Text>
      <Text style={styles.emptyText}>Нажмите «+», чтобы добавить первого клиента.</Text>
    </View>}

    {filtered.map((client, index) => {
      const progress = progressFor(client, index);
      return <Pressable key={client.id} onPress={() => openClient(client)} style={styles.clientCard}>
        {client.photoUri ? <Image source={{ uri: client.photoUri }} style={styles.avatar} /> : <View style={styles.avatarPlaceholder}><Text style={styles.initialText}>{initial(client.name)}</Text></View>}
        <View style={styles.clientInfo}>
          <Text style={styles.clientName} numberOfLines={2}>{client.name || 'Клиент'}</Text>
          <Text style={[styles.status, { color: statusColor(client.status) }]}>● {statusLabel(client.status)}</Text>
          <Text style={styles.clientLine} numberOfLines={2}>🎯 {client.goal || 'Цель не указана'}</Text>
          <Text style={styles.clientLine} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>💰 {money(client.amount)}   🗓️ до: {client.endsAt || '—'}</Text>
          <View style={styles.progressRow}><Text style={styles.progressLabel}>Прогресс</Text><View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${progress}%` }]} /></View><Text style={styles.progressValue}>{progress}%</Text></View>
        </View>
        <Text style={styles.chevron}>›</Text>
      </Pressable>;
    })}

    <Modal visible={modalOpen} animationType="slide" onRequestClose={() => setModalOpen(false)}>
      <View style={styles.modalRoot} {...modalSwipeBack.panHandlers}><ScrollView contentContainerStyle={styles.modalContent}>
        <View style={styles.modalHeader}><Pressable onPress={() => setModalOpen(false)}><Text style={styles.backText}>← Назад</Text></Pressable><Text style={styles.modalTitle}>{isNew ? 'Новый клиент' : 'Карточка клиента'}</Text></View>
        <View style={styles.photoRow}>{draft.photoUri ? <Image source={{ uri: draft.photoUri }} style={styles.editAvatar} /> : <View style={styles.editAvatarPlaceholder}><Text style={styles.editInitial}>?</Text></View>}<Pressable onPress={pickPhoto} style={styles.photoButton}><Text style={styles.photoButtonText}>📷 Изменить фото клиента</Text></Pressable></View>

        <Input placeholder="ФИО клиента" value={draft.name} onChangeText={v => setDraft(p => ({ ...p, name: v }))} />
        <Input placeholder="Телефон / WhatsApp" value={draft.phone} onChangeText={v => setDraft(p => ({ ...p, phone: v }))} />
        <Input placeholder="Цель клиента" value={draft.goal} onChangeText={v => setDraft(p => ({ ...p, goal: v }))} />
        <Input placeholder="Тариф" value={draft.tariff} onChangeText={v => setDraft(p => ({ ...p, tariff: v }))} />
        <Input placeholder="Сумма / оплата" value={draft.amount} onChangeText={v => setDraft(p => ({ ...p, amount: v }))} />
        <Input placeholder="Дата оплаты" value={draft.paidAt} onChangeText={v => setDraft(p => ({ ...p, paidAt: v }))} />
        <Input placeholder="Оплачено до" value={draft.endsAt} onChangeText={v => setDraft(p => ({ ...p, endsAt: v }))} />

        <Text style={styles.subTitle}>Статус клиента</Text>
        <View style={styles.statusButtons}>{(['active', 'unpaid', 'pause', 'finished'] as ClientStatus[]).map(s => <Pressable key={s} onPress={() => setStatus(s)} style={[styles.statusButton, draft.status === s && styles.statusButtonActive]}><Text style={[styles.statusButtonText, draft.status === s && styles.statusButtonTextActive]}>{statusLabel(s)}</Text></Pressable>)}</View>

        <Input placeholder="Комментарий / заметки" value={draft.comment} onChangeText={v => setDraft(p => ({ ...p, comment: v }))} multiline />
        <Pressable style={styles.save} onPress={saveClient}><Text style={styles.saveText}>💾 Сохранить изменения</Text></Pressable>
        {!isNew && <Pressable style={styles.delete} onPress={confirmDelete}><Text style={styles.deleteText}>🗑 Удалить клиента из базы</Text></Pressable>}
        <Pressable style={styles.cancel} onPress={() => setModalOpen(false)}><Text style={styles.cancelText}>Закрыть без изменений</Text></Pressable>
      </ScrollView></View>
    </Modal>
  </ScrollView></AppShell>;
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  content: { padding: spacing.md, paddingBottom: 44 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  search: { flex: 1 },
  addRound: { width: 54, height: 54, borderRadius: 27, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center' },
  plus: { fontSize: 34, fontWeight: '900', color: colors.background },
  filters: { gap: 8, marginTop: 12 },
  filterChip: { minHeight: 52, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  filterActive: { borderColor: colors.gold },
  filterText: { fontSize: 18, fontWeight: '900', color: colors.text, flexShrink: 1 },
  filterTextActive: { color: colors.gold },
  filterCount: { minWidth: 34, height: 28, borderRadius: 14, backgroundColor: colors.background, color: colors.text, fontWeight: '900', textAlign: 'center', paddingTop: 4, fontSize: 14, overflow: 'hidden' },
  counter: { marginVertical: 12, fontSize: 20, color: colors.gold, fontWeight: '900' },
  emptyCard: { minHeight: 180, borderRadius: 22, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, padding: 18, marginTop: 8, marginBottom: 12, alignItems: 'center', justifyContent: 'center' },
  emptyIcon: { fontSize: 42, marginBottom: 8 },
  emptyTitle: { fontSize: 24, lineHeight: 28, color: colors.text, fontWeight: '900', marginBottom: 6 },
  emptyText: { fontSize: 17, lineHeight: 22, color: colors.muted, fontWeight: '700', textAlign: 'center' },
  clientCard: { minHeight: 112, borderRadius: 22, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, paddingVertical: 10, paddingHorizontal: 12, marginBottom: 9, flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 66, height: 66, borderRadius: 33, marginRight: 12 },
  avatarPlaceholder: { width: 66, height: 66, borderRadius: 33, backgroundColor: colors.client, marginRight: 12, alignItems: 'center', justifyContent: 'center' },
  initialText: { fontSize: 28, fontWeight: '900', color: '#FFF' },
  clientInfo: { flex: 1, minWidth: 0, paddingRight: 4 },
  clientName: { fontSize: 18, lineHeight: 22, fontWeight: '900', color: colors.text },
  status: { marginTop: 1, fontSize: 14, fontWeight: '900' },
  clientLine: { marginTop: 1, fontSize: 14, lineHeight: 17, color: colors.muted, fontWeight: '800' },
  progressRow: { flexDirection: 'row', alignItems: 'center', marginTop: 5, gap: 5 },
  progressLabel: { color: colors.muted, fontSize: 12, fontWeight: '800' },
  progressTrack: { flex: 1, height: 7, borderRadius: 4, backgroundColor: colors.cardSecond },
  progressFill: { height: 7, borderRadius: 4, backgroundColor: colors.success },
  progressValue: { color: colors.success, fontSize: 12, fontWeight: '900' },
  chevron: { fontSize: 30, color: colors.muted, fontWeight: '900', marginLeft: 4 },
  modalRoot: { flex: 1, backgroundColor: colors.background },
  modalContent: { padding: spacing.md, paddingTop: 78, paddingBottom: 150 },
  modalHeader: { marginBottom: 14 },
  modalTitle: { fontSize: 28, color: colors.gold, fontWeight: '900' },
  closeText: { color: colors.muted, fontSize: 28, fontWeight: '900' },
  backText: { color: colors.gold, fontSize: 24, fontWeight: '900', marginBottom: 8 },
  photoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  editAvatar: { width: 92, height: 92, borderRadius: 46 },
  editAvatarPlaceholder: { width: 92, height: 92, borderRadius: 46, backgroundColor: colors.client, alignItems: 'center', justifyContent: 'center' },
  editInitial: { fontSize: 32, color: '#FFF', fontWeight: '900' },
  photoButton: { flex: 1, height: 56, borderRadius: 16, borderWidth: 1, borderColor: colors.gold, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.card },
  photoButtonText: { color: colors.gold, fontSize: 16, fontWeight: '900', textAlign: 'center' },
  subTitle: { color: colors.gold, fontSize: 18, fontWeight: '900', marginTop: 8, marginBottom: 8 },
  statusButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  statusButton: { minHeight: 42, paddingHorizontal: 12, borderRadius: 14, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.card },
  statusButtonActive: { borderColor: colors.gold },
  statusButtonText: { color: colors.text, fontSize: 14, fontWeight: '900' },
  statusButtonTextActive: { color: colors.gold },
  save: { height: 58, borderRadius: 16, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  saveText: { color: colors.background, fontSize: 18, fontWeight: '900' },
  delete: { height: 56, borderRadius: 16, borderWidth: 1, borderColor: colors.red, alignItems: 'center', justifyContent: 'center', marginTop: 12, backgroundColor: colors.card },
  deleteText: { color: colors.red, fontSize: 17, fontWeight: '900' },
  cancel: { height: 52, alignItems: 'center', justifyContent: 'center' },
  cancelText: { color: colors.muted, fontSize: 16, fontWeight: '800' },
});
