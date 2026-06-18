import React, { useCallback, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '../src/components/TranslatedText';
import { router, useFocusEffect } from '../src/navigation';
import { useI18n } from '../src/i18n';
import { AppShell } from '../src/components/AppShell';
import { Card } from '../src/components/Card';
import { colors, spacing } from '../src/constants/theme';
import { defaultProfile, localStore } from '../src/storage/localStore';
import { Client, PlanTemplate, TrainerProfile } from '../src/types';

function initial(name: string) { return (name || '?').trim().slice(0, 1).toUpperCase(); }
function money(value?: string) { return Number(String(value || '').replace(/[^0-9.,]/g, '').replace(',', '.')) || 0; }

export default function HomeScreen() {
  const { t } = useI18n();
  const [profile, setProfile] = useState<TrainerProfile>(defaultProfile);
  const [clients, setClients] = useState<Client[]>([]);
  const [plans, setPlans] = useState<PlanTemplate[]>([]);

  useFocusEffect(useCallback(() => { localStore.getProfile().then(setProfile); localStore.getClients().then(setClients); localStore.getPlans().then(setPlans); }, []));

  const active = clients.filter(c => c.status === 'active').length;
  const monthly = clients.reduce((sum, c) => sum + money(c.amount), 0);
  const currency = profile.currency === 'USD' ? '$' : profile.currency === 'RUB' ? '₽' : '₸';
  const cards = [
    { title: t('clients'), icon: '👥', color: colors.client, value: String(clients.length), line1: t('total'), line2: `${active} ${t('active')}`, path: '/clients' },
    { title: t('templates'), icon: '📄', color: colors.template, value: String(plans.filter(p => !p.isArchived).length), line1: t('programs'), line2: '', path: '/plans' },
    { title: t('assignment'), icon: '📋', color: colors.success, value: String(active), line1: t('active'), line2: t('clients').toLowerCase(), path: '/assign' },
    { title: t('finance'), icon: '💰', color: colors.finance, value: `${currency} ${monthly.toLocaleString('ru-RU')}`, line1: t('income'), line2: '', path: '/finance' },
    { title: t('security'), icon: '🛡️', color: colors.backup, value: t('dataCopy'), line1: t('data'), line2: '', path: '/backup' },
    { title: t('settings'), icon: '⚙', color: colors.muted, value: t('appAndProfile'), line1: t('appAndApp'), line2: '', path: '/settings' },
  ];

  return <AppShell title={profile.appTitle || 'agashka.power'} active="home"><ScrollView style={styles.page} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <Card style={styles.hero}>
      <View style={styles.profileTop}>
        {profile.photoUri ? <Image source={{ uri: profile.photoUri }} style={styles.trainerPhoto} /> : <View style={styles.photoPlaceholder}><Text style={styles.photoLetter}>{initial(profile.trainerName)}</Text></View>}
        <View style={styles.profileInfo}>
          <Text maxFontSizeMultiplier={1.0} style={styles.name} numberOfLines={1}>{profile.trainerName || 'Murat'}</Text>
          <Text maxFontSizeMultiplier={1.0} style={styles.sport} numberOfLines={2} adjustsFontSizeToFit>{profile.sportTitle || 'Тренер'}</Text>
          <Text maxFontSizeMultiplier={1.0} style={styles.badge} numberOfLines={2} adjustsFontSizeToFit>🏆 {profile.shortTitle || profile.achievements || 'МС IPF троеборье'}</Text>
          <Text maxFontSizeMultiplier={1.0} style={styles.city} numberOfLines={1}>📍 {profile.city || 'Алматы'}</Text>
        </View>
      </View>
      <View style={styles.achievementsBox}>
        <Text maxFontSizeMultiplier={1.0} style={styles.achievementLine} numberOfLines={1} adjustsFontSizeToFit>🥉 {profile.worldAchievement || 'Бронзовый призёр чемпионата IPF'}</Text>
        <Text maxFontSizeMultiplier={1.0} style={styles.achievementLine} numberOfLines={1} adjustsFontSizeToFit>🏅 {profile.asiaAchievement || 'Чемпион Азии IPF'}</Text>
      </View>
      {!!profile.description?.trim() && <View style={styles.quoteBox}>
        <Text maxFontSizeMultiplier={1.0} style={styles.quoteText} numberOfLines={3} adjustsFontSizeToFit>{profile.description.trim()}</Text>
      </View>}
    </Card>

    <View style={styles.grid}>{cards.map(card => <Pressable key={card.title} style={styles.tile} onPress={() => router.push(card.path as never)}>
      <View style={[styles.iconBox, { borderColor: `${card.color}66`, backgroundColor: `${card.color}22` }]}><Text style={styles.tileIcon}>{card.icon}</Text></View>
      <Text maxFontSizeMultiplier={1.0} style={[styles.tileTitle, { color: card.color }]} numberOfLines={2}>{card.title}</Text>
      <Text maxFontSizeMultiplier={1.0} style={styles.tileValue} numberOfLines={1}>{card.value}</Text>
      <Text maxFontSizeMultiplier={1.0} style={styles.tileSub} numberOfLines={1}>{card.line1}</Text>
      {!!card.line2 && <Text maxFontSizeMultiplier={1.0} style={styles.tileSub} numberOfLines={1}>{card.line2}</Text>}
      <Text style={[styles.arrow, { color: card.color }]}>›</Text>
    </Pressable>)}</View>
  </ScrollView></AppShell>;
}

const styles = StyleSheet.create({
  page: { flex: 1 }, content: { padding: spacing.md, paddingBottom: 108 }, hero: { padding: 16, borderColor: '#D4AF3744' }, profileTop: { flexDirection: 'row', alignItems: 'flex-start' },
  trainerPhoto: { width: 132, height: 160, borderRadius: 22, backgroundColor: colors.cardSecond }, photoPlaceholder: { width: 132, height: 160, borderRadius: 22, backgroundColor: colors.cardSecond, alignItems: 'center', justifyContent: 'center' }, photoLetter: { fontSize: 48, fontWeight: '900', color: colors.gold }, profileInfo: { flex: 1, marginLeft: 16, minHeight: 160 }, name: { fontSize: 34, lineHeight: 40, fontWeight: '900', color: colors.text }, sport: { marginTop: 6, fontSize: 18, lineHeight: 22, fontWeight: '900', color: colors.gold }, badge: { marginTop: 10, fontSize: 17, lineHeight: 22, color: colors.text, fontWeight: '800' }, city: { marginTop: 8, fontSize: 16, color: colors.muted, fontWeight: '800' }, achievementsBox: { marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border }, achievementLine: { marginTop: 5, fontSize: 17, lineHeight: 22, color: colors.text, fontWeight: '800' }, quoteBox: { marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border }, quoteText: { fontSize: 17, lineHeight: 22, color: colors.text, fontWeight: '800' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 12 }, tile: { width: '48.5%', minHeight: 116, backgroundColor: colors.card, borderRadius: 20, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: colors.border }, iconBox: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1 }, tileIcon: { fontSize: 24 }, tileTitle: { position: 'absolute', left: 64, top: 23, right: 12, fontSize: 18, lineHeight: 22, fontWeight: '900' }, tileValue: { marginTop: 16, fontSize: 20, lineHeight: 24, fontWeight: '900', color: colors.text }, tileSub: { marginTop: 2, fontSize: 12, color: colors.muted, fontWeight: '800' }, arrow: { position: 'absolute', right: 14, bottom: 4, fontSize: 28, fontWeight: '900' },
});
