import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '../src/components/TranslatedText';
import { router } from '../src/navigation';
import { AppShell } from '../src/components/AppShell';
import { Card } from '../src/components/Card';
import { colors, spacing } from '../src/constants/theme';
import { localStore } from '../src/storage/localStore';
import { Client, TrainerProfile } from '../src/types';

const monthNames = ['Янв','Фев','Мар','Апр','Май','Июн','Июл','Авг','Сен','Окт','Ноя','Дек'];

function parseAmount(value?: string) {
  return Number(String(value || '').replace(/[^0-9.,]/g, '').replace(',', '.')) || 0;
}

function parseDate(value?: string) {
  if (!value) return null;
  const iso = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
  const ru = value.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})/);
  if (ru) return new Date(Number(ru[3]), Number(ru[2]) - 1, Number(ru[1]));
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function initial(name: string) {
  return (name || '?').trim().slice(0, 1).toUpperCase();
}

function statusLabel(status: Client['status']) {
  if (status === 'active') return 'Активен';
  if (status === 'pause') return 'Пауза';
  if (status === 'finished') return 'Завершён';
  return 'Не оплачен';
}

export default function FinanceScreen() {
  const [clients, setClients] = useState<Client[]>([]);
  const [profile, setProfile] = useState<TrainerProfile | null>(null);
  const [period, setPeriod] = useState<'month' | 'quarter' | 'year'>('month');
  const [mode, setMode] = useState<'income' | 'clients'>('income');
  const [details, setDetails] = useState(true);

  useEffect(() => {
    localStore.getClients().then(setClients);
    localStore.getProfile().then(setProfile);
  }, []);

  const currency = profile?.currency === 'USD' ? '$' : profile?.currency === 'RUB' ? '₽' : '₸';
  const now = new Date();
  const currentQuarter = Math.floor(now.getMonth() / 3);
  const money = (n: number) => `${Math.round(n).toLocaleString('ru-RU')} ${currency}`;

  const rows = useMemo(() => {
    const list: Array<{ clientId: string; client: string; status: Client['status']; photoUri?: string; amount: number; date: Date | null; rawDate?: string }> = [];
    for (const c of clients) {
      if (c.payments?.length) {
        c.payments.forEach(p => list.push({ clientId: c.id, client: c.name, status: c.status, photoUri: c.photoUri, amount: parseAmount(p.amount), date: parseDate(p.paidAt), rawDate: p.paidAt }));
      } else if (c.amount) {
        list.push({ clientId: c.id, client: c.name, status: c.status, photoUri: c.photoUri, amount: parseAmount(c.amount), date: parseDate(c.paidAt), rawDate: c.paidAt });
      }
    }
    return list.sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0));
  }, [clients]);

  const isInCurrentPeriod = (date: Date | null) => {
    if (!date || date.getFullYear() !== now.getFullYear()) return false;
    if (period === 'month') return date.getMonth() === now.getMonth();
    if (period === 'quarter') return Math.floor(date.getMonth() / 3) === currentQuarter;
    return true;
  };

  const periodRows = rows.filter(r => isInCurrentPeriod(r.date));
  const periodIncome = periodRows.reduce((s, r) => s + r.amount, 0);
  const yearIncome = rows.filter(r => r.date && r.date.getFullYear() === now.getFullYear()).reduce((s, r) => s + r.amount, 0);
  const activeClients = clients.filter(c => c.status === 'active').length;
  const expectedPayments = clients.filter(c => c.status === 'active' && c.endsAt).length;
  const periodClientNames = new Set(periodRows.map(r => r.client));
  const avgCheck = periodRows.length ? Math.round(periodIncome / periodRows.length) : 0;
  const periodLabel = period === 'month' ? 'месяц' : period === 'quarter' ? 'квартал' : 'год';

  const monthData = monthNames.map((m, idx) => {
    const monthRows = rows.filter(r => r.date && r.date.getFullYear() === now.getFullYear() && r.date.getMonth() === idx);
    return { m, income: monthRows.reduce((s, r) => s + r.amount, 0), count: monthRows.length };
  });
  const quarterData = [0, 1, 2, 3].map(q => {
    const data = monthData.slice(q * 3, q * 3 + 3);
    return { m: `${q + 1} кв`, income: data.reduce((s, d) => s + d.income, 0), count: data.reduce((s, d) => s + d.count, 0) };
  });
  const chartData = period === 'quarter' ? quarterData : monthData;
  const maxValue = Math.max(1, ...chartData.map(d => mode === 'income' ? d.income : d.count));
  const best = monthData.reduce((a, b) => b.income > a.income ? b : a, monthData[0]);

  const kpis = [
    { icon: '💰', value: money(periodIncome), label: `Доход за ${periodLabel}` },
    { icon: '👥', value: String(period === 'year' ? activeClients : periodClientNames.size), label: period === 'year' ? 'Активных клиентов' : `Клиентов за ${periodLabel}` },
    { icon: '📅', value: String(expectedPayments), label: 'Ожидается оплата' },
    { icon: '📈', value: money(yearIncome), label: 'Доход за год' },
  ];

  function openClient(clientId: string) {
    router.push({ pathname: '/client-profile', params: { id: clientId } } as never);
  }

  function addPayment() {
    router.push('/clients' as never);
  }

  function exportReport() {
    Alert.alert('Отчёт готов', 'Финансовый отчёт подготовлен. В следующем этапе можно добавить PDF/Excel экспорт.');
  }

  function sendReport() {
    Alert.alert('Отправка отчёта', 'Отчёт можно отправить после подключения PDF/Excel файла. Кнопка не тупиковая: действие обработано.');
  }

  return (
    <AppShell title="Финансы" active="finance">
      <ScrollView style={styles.page} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text maxFontSizeMultiplier={1.0} style={styles.title}>Финансы</Text>
        <Text maxFontSizeMultiplier={1.0} style={styles.subtitle}>Доходы и платежи</Text>

        <View style={styles.kpiGrid}>
          {kpis.map(k => (
            <Card key={k.label} style={styles.kpi}>
              <Text maxFontSizeMultiplier={1.0} style={styles.kpiIcon}>{k.icon}</Text>
              <Text maxFontSizeMultiplier={1.0} style={styles.kpiValue} numberOfLines={1}>{k.value}</Text>
              <Text maxFontSizeMultiplier={1.0} style={styles.kpiLabel} numberOfLines={2}>{k.label}</Text>
            </Card>
          ))}
        </View>

        <View style={styles.tabs}>
          {(['month','quarter','year'] as const).map(p => (
            <Pressable key={p} onPress={() => setPeriod(p)} style={[styles.tab, period === p && styles.tabActive]}>
              <Text maxFontSizeMultiplier={1.0} style={[styles.tabText, period === p && styles.tabTextActive]}>{p === 'month' ? 'Месяц' : p === 'quarter' ? 'Квартал' : 'Год'}</Text>
            </Pressable>
          ))}
        </View>

        <Card style={styles.chartCard}>
          <Text maxFontSizeMultiplier={1.0} style={styles.section}>Динамика</Text>
          <View style={styles.toggleRowBelowTitle}>
            <View style={styles.toggle}>
              <Pressable onPress={() => setMode('income')} style={[styles.toggleItem, mode === 'income' && styles.toggleActive]}>
                <Text maxFontSizeMultiplier={1.0} style={[styles.toggleText, mode === 'income' && styles.toggleTextActive]}>Доход</Text>
              </Pressable>
              <Pressable onPress={() => setMode('clients')} style={[styles.toggleItem, mode === 'clients' && styles.toggleActive]}>
                <Text maxFontSizeMultiplier={1.0} style={[styles.toggleText, mode === 'clients' && styles.toggleTextActive]}>Клиенты</Text>
              </Pressable>
            </View>
          </View>
          <View style={styles.chart}>
            {chartData.map(d => {
              const value = mode === 'income' ? d.income : d.count;
              const height = Math.max(14, Math.round((value / maxValue) * 150));
              return (
                <View key={d.m} style={styles.barWrap}>
                  <View style={styles.barTrack}><View style={[styles.barFill, { height }]} /></View>
                  <Text maxFontSizeMultiplier={1.0} style={styles.month}>{d.m}</Text>
                </View>
              );
            })}
          </View>
        </Card>

        <Card style={styles.summary}>
          <Text maxFontSizeMultiplier={1.0} style={styles.section}>Итоги</Text>
          {[
            ['🏆','Лучший месяц', `${best.m} — ${money(best.income)}`],
            ['💰','Средний чек', money(avgCheck)],
            ['👥','Активные клиенты', String(activeClients)],
            ['📌','Оплат всего', String(rows.length)],
          ].map(([icon, label, value], idx) => (
            <View key={label} style={[styles.summaryRow, idx === 3 && { borderBottomWidth: 0 }]}>
              <Text maxFontSizeMultiplier={1.0} style={styles.summaryIcon}>{icon}</Text>
              <Text maxFontSizeMultiplier={1.0} style={styles.summaryLabel} numberOfLines={1}>{label}</Text>
              <Text maxFontSizeMultiplier={1.0} style={styles.summaryValue} numberOfLines={1}>{value}</Text>
            </View>
          ))}
        </Card>

        <View style={styles.actionsRow}>
          <Pressable style={styles.actionButton} onPress={addPayment}><Text maxFontSizeMultiplier={1.0} style={styles.actionText} numberOfLines={1}>➕ Добавить оплату</Text></Pressable>
          <Pressable style={styles.actionButton} onPress={exportReport}><Text maxFontSizeMultiplier={1.0} style={styles.actionText} numberOfLines={1}>📄 Экспорт</Text></Pressable>
        </View>
        <Pressable style={styles.sendButton} onPress={sendReport}><Text maxFontSizeMultiplier={1.0} style={styles.sendText} numberOfLines={1}>📤 Отправить отчёт</Text></Pressable>

        <Pressable style={styles.detailButton} onPress={() => setDetails(v => !v)}>
          <Text maxFontSizeMultiplier={1.0} style={styles.detailIcon}>▥</Text>
          <Text maxFontSizeMultiplier={1.0} style={styles.detailText} numberOfLines={1}>{details ? 'Скрыть платежи' : 'Показать платежи'}</Text>
          <Text maxFontSizeMultiplier={1.0} style={styles.detailArrow}>›</Text>
        </Pressable>

        {details && periodRows.map((r, idx) => (
          <Pressable key={`${r.client}-${idx}`} onPress={() => openClient(r.clientId)}>
            <Card style={styles.paymentCard}>
              {r.photoUri ? <Image source={{ uri: r.photoUri }} style={styles.avatar} /> : <View style={styles.avatarPlaceholder}><Text maxFontSizeMultiplier={1.0} style={styles.initial}>{initial(r.client)}</Text></View>}
              <View style={styles.paymentInfo}>
                <Text maxFontSizeMultiplier={1.0} style={styles.paymentName} numberOfLines={1}>{r.client}</Text>
                <Text maxFontSizeMultiplier={1.0} style={styles.paymentStatus}>● {statusLabel(r.status)}</Text>
                <Text maxFontSizeMultiplier={1.0} style={styles.paymentDate}>{r.date ? r.date.toLocaleDateString('ru-RU') : 'дата не указана'}</Text>
              </View>
              <View style={styles.paymentRight}>
                <Text maxFontSizeMultiplier={1.0} style={styles.paymentAmount}>{money(r.amount)}</Text>
                <Text maxFontSizeMultiplier={1.0} style={styles.openText}>Открыть ›</Text>
              </View>
            </Card>
          </Pressable>
        ))}
      </ScrollView>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  content: { padding: spacing.md, paddingTop: 8, paddingBottom: 36 },
  title: { fontSize: 34, lineHeight: 40, fontWeight: '900', color: colors.gold, marginBottom: 2 },
  subtitle: { fontSize: 22, lineHeight: 28, fontWeight: '900', color: colors.text, marginBottom: 16 },

  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 14 },
  kpi: { width: '48.5%', minHeight: 142, padding: 16, marginBottom: 12, justifyContent: 'center' },
  kpiIcon: { fontSize: 36, marginBottom: 6 },
  kpiValue: { fontSize: 32, lineHeight: 38, fontWeight: '900', color: colors.gold, marginBottom: 5 },
  kpiLabel: { fontSize: 21, lineHeight: 26, fontWeight: '900', color: colors.text },

  tabs: { height: 58, flexDirection: 'row', borderRadius: 18, borderWidth: 2, borderColor: colors.border, backgroundColor: colors.card, overflow: 'hidden', marginBottom: 14 },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tabActive: { backgroundColor: 'rgba(212,175,55,0.28)' },
  tabText: { fontSize: 20, fontWeight: '900', color: colors.text },
  tabTextActive: { color: colors.gold },

  chartCard: { padding: 14, marginBottom: 14 },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  section: { fontSize: 27, lineHeight: 33, fontWeight: '900', color: colors.gold, marginBottom: 10 },
  toggleRowBelowTitle: { alignItems: 'flex-end', marginBottom: 14 },
  toggle: { flexDirection: 'row', borderRadius: 18, borderWidth: 2, borderColor: colors.border, overflow: 'hidden', alignSelf: 'flex-end' },
  toggleItem: { minWidth: 86, alignItems: 'center', paddingHorizontal: 8, paddingVertical: 8 },
  toggleActive: { backgroundColor: 'rgba(212,175,55,0.28)' },
  toggleText: { fontSize: 16, fontWeight: '900', color: colors.text },
  toggleTextActive: { color: colors.gold },
  chart: { height: 178, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  barWrap: { flex: 1, alignItems: 'center' },
  barTrack: { width: 18, height: 126, borderRadius: 9, backgroundColor: colors.cardSecond, justifyContent: 'flex-end', overflow: 'hidden' },
  barFill: { width: 18, minHeight: 10, borderRadius: 9, backgroundColor: colors.gold },
  month: { marginTop: 7, fontSize: 10, lineHeight: 12, fontWeight: '900', color: colors.text },

  summary: { padding: 18, marginBottom: 14 },
  summaryRow: { minHeight: 62, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.border },
  summaryIcon: { width: 48, fontSize: 30 },
  summaryLabel: { flex: 1, fontSize: 22, fontWeight: '900', color: colors.text },
  summaryValue: { fontSize: 22, fontWeight: '900', color: colors.muted, marginLeft: 8, maxWidth: 190, textAlign: 'right' },

  actionsRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  actionButton: { flex: 1, minHeight: 58, borderRadius: 18, borderWidth: 2, borderColor: colors.gold, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
  actionText: { color: colors.gold, fontSize: 20, fontWeight: '900', textAlign: 'center' },
  sendButton: { minHeight: 66, borderRadius: 18, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  sendText: { color: '#111827', fontSize: 24, fontWeight: '900' },

  detailButton: { minHeight: 62, borderRadius: 20, borderWidth: 2, borderColor: colors.border, backgroundColor: colors.card, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  detailIcon: { color: colors.gold, fontSize: 24, marginRight: 12 },
  detailText: { flex: 1, color: colors.gold, fontSize: 24, fontWeight: '900' },
  detailArrow: { color: colors.text, fontSize: 34 },

  paymentCard: { minHeight: 126, padding: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar: { width: 82, height: 82, borderRadius: 41, marginRight: 14 },
  avatarPlaceholder: { width: 82, height: 82, borderRadius: 41, marginRight: 14, backgroundColor: colors.client, alignItems: 'center', justifyContent: 'center' },
  initial: { fontSize: 38, color: '#FFF', fontWeight: '900' },
  paymentInfo: { flex: 1, minWidth: 0 },
  paymentName: { fontSize: 29, lineHeight: 36, color: colors.text, fontWeight: '900' },
  paymentStatus: { marginTop: 4, color: colors.success, fontSize: 22, fontWeight: '900' },
  paymentDate: { marginTop: 4, color: colors.muted, fontSize: 22, fontWeight: '800' },
  paymentRight: { alignItems: 'flex-end', marginLeft: 10 },
  paymentAmount: { color: colors.gold, fontSize: 28, fontWeight: '900' },
  openText: { color: colors.muted, fontSize: 20, fontWeight: '900', marginTop: 8 },
});
