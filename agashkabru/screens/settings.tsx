import React, { useCallback, useState } from 'react';
import { Alert, Image, PanResponder, Pressable, ScrollView, StyleSheet, Switch, TextInput, View } from 'react-native';
import { Text } from '../src/components/TranslatedText';
import { Ionicons, MaterialCommunityIcons } from '../src/components/SafeIcon';
import { router, useFocusEffect } from '../src/navigation';
import { AppShell } from '../src/components/AppShell';
import { colors, spacing } from '../src/constants/theme';
import { pickAndSaveTrainerPhoto } from '../src/storage/fileStore';
import { defaultProfile, localStore } from '../src/storage/localStore';
import { CurrencyCode, TrainerProfile } from '../src/types';
import { AppLanguage, useI18n } from '../src/i18n';

type SectionKey = 'profile' | 'region' | 'notifications' | 'security' | 'about';

type SectionItem = {
  key: SectionKey;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
};

const sectionItems: SectionItem[] = [
  { key: 'profile', title: 'Профиль тренера', subtitle: 'Фото, имя, звания', icon: 'account-circle', color: '#63D471' },
  { key: 'region', title: 'Язык и регион', subtitle: 'Язык и валюта', icon: 'earth', color: '#4FA3FF' },
  { key: 'notifications', title: 'Уведомления', subtitle: 'Оплаты и система', icon: 'bell-ring', color: '#F4C430' },
  { key: 'security', title: 'Безопасность', subtitle: 'Пароль и копии', icon: 'shield-lock', color: '#E35D5D' },
  { key: 'about', title: 'О приложении', subtitle: 'Версия и сборка', icon: 'information', color: '#E5E7EB' },
];

const currencyLabels: Record<CurrencyCode, string> = { KZT: '₸ Тенге', USD: '$ Доллар', RUB: '₽ Рубль' };

export default function SettingsScreen() {
  const { language, setLanguage, t } = useI18n();
  const [section, setSection] = useState<SectionKey | null>(null);
  const [profile, setProfile] = useState<TrainerProfile>(defaultProfile);
  const [password, setPassword] = useState('');
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [autoLogin, setAutoLogin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useFocusEffect(useCallback(() => {
    (async () => {
      setProfile(await localStore.getProfile());
      setRecoveryEmail(await localStore.getRecoveryEmail());
      setAutoLogin(await localStore.getRememberLogin());
    })();
  }, []));

  async function saveProfile() {
    await localStore.saveProfile(profile);
    Alert.alert('Сохранено', 'Профиль обновлён. Главная страница обновится автоматически.');
  }

  async function pickPhoto() {
    const uri = await pickAndSaveTrainerPhoto();
    if (uri) {
      const next = { ...profile, photoUri: uri };
      setProfile(next);
      await localStore.saveProfile(next);
      Alert.alert('Фото обновлено', 'Фото тренера сохранено.');
    }
  }

  async function savePassword() {
    if (password.trim().length < 4) return Alert.alert('Ошибка', 'Пароль должен быть минимум 4 символа.');
    await localStore.setPassword(password.trim());
    await localStore.setRememberLogin(false);
    setAutoLogin(false);
    setPassword('');
    Alert.alert('Готово', 'Пароль изменён. Автоматический вход отключён.');
  }

  async function saveRecoveryEmail() {
    await localStore.setRecoveryEmail(recoveryEmail.trim());
    Alert.alert('Сохранено', 'E-mail восстановления сохранён.');
  }

  async function toggleAuto(value: boolean) {
    setAutoLogin(value);
    await localStore.setRememberLogin(value);
  }

  async function setCurrency(currency: CurrencyCode) {
    const next = { ...profile, currency };
    setProfile(next);
    await localStore.saveProfile(next);
  }

  function resetPassword() { router.push('/forgot-password' as never); }

  const selected = section ? sectionItems.find(i => i.key === section)! : null;
  const sectionSwipeBack = React.useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, gesture) => !!section && gesture.dx > 45 && Math.abs(gesture.dy) < 35,
    onPanResponderRelease: (_, gesture) => { if (section && gesture.dx > 85) setSection(null); },
  }), [section]);

  return <AppShell title="settings" active="settings">
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {!section && <>
        <Text maxFontSizeMultiplier={1.0} style={styles.screenTitle}>{t('appParams')}</Text>
        <Text maxFontSizeMultiplier={1.0} style={styles.screenSub}>{t('appParamsSub')}</Text>

        <View style={styles.sectionGrid}>
          {sectionItems.map(item => <Pressable key={item.key} onPress={() => setSection(item.key)} style={styles.sectionCard}>
            <View style={[styles.bigIconBox, { borderColor: item.color, backgroundColor: item.color + '22' }]}>
              <MaterialCommunityIcons name={item.icon} size={32} color={item.color} />
            </View>
            <View style={styles.sectionTextBox}>
              <Text maxFontSizeMultiplier={1.0} style={[styles.sectionTitle, { color: item.color === '#E5E7EB' ? colors.text : item.color }]} numberOfLines={1}>{t(item.key === 'profile' ? 'profile' : item.key === 'region' ? 'languageRegion' : item.key === 'notifications' ? 'notifications' : item.key === 'security' ? 'security' : 'about')}</Text>
              <Text maxFontSizeMultiplier={1.0} style={styles.sectionSub} numberOfLines={1}>{t(item.key === 'profile' ? 'photoNameTitles' : item.key === 'region' ? 'languageCurrency' : item.key === 'notifications' ? 'paymentsSystem' : item.key === 'security' ? 'passwordCopies' : 'versionBuild')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={26} color={item.color} />
          </Pressable>)}
        </View>
      </>}

      {selected && <View style={[styles.panel, { borderColor: selected.color }]} {...sectionSwipeBack.panHandlers}>
        <Pressable onPress={() => setSection(null)} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.gold} />
          <Text style={styles.backText}>{t('back')}</Text>
        </Pressable>
        <View style={styles.panelHeader}>
          <View style={[styles.panelIconBox, { backgroundColor: selected.color + '22', borderColor: selected.color }]}>
            <MaterialCommunityIcons name={selected.icon} size={32} color={selected.color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text maxFontSizeMultiplier={1.0} style={[styles.panelTitle, { color: selected.color }]} numberOfLines={1} adjustsFontSizeToFit>{t(selected.key === 'profile' ? 'profile' : selected.key === 'region' ? 'languageRegion' : selected.key === 'notifications' ? 'notifications' : selected.key === 'security' ? 'security' : 'about')}</Text>
            <Text maxFontSizeMultiplier={1.0} style={styles.panelSub} numberOfLines={2}>{t(selected.key === 'profile' ? 'photoNameTitles' : selected.key === 'region' ? 'languageCurrency' : selected.key === 'notifications' ? 'paymentsSystem' : selected.key === 'security' ? 'passwordCopies' : 'versionBuild')}</Text>
          </View>
        </View>

        {section === 'profile' && <ProfilePanel profile={profile} setProfile={setProfile} pickPhoto={pickPhoto} saveProfile={saveProfile} t={t} />}
        {section === 'region' && <RegionPanel profile={profile} setProfile={setProfile} setCurrency={setCurrency} language={language} setLanguage={setLanguage} t={t} />}
        {section === 'notifications' && <NotificationsPanel />}
        {section === 'security' && <SecurityPanel password={password} setPassword={setPassword} recoveryEmail={recoveryEmail} setRecoveryEmail={setRecoveryEmail} autoLogin={autoLogin} toggleAuto={toggleAuto} savePassword={savePassword} saveRecoveryEmail={saveRecoveryEmail} resetPassword={resetPassword} showPassword={showPassword} setShowPassword={setShowPassword} />}
        {section === 'about' && <AboutPanel />}
      </View>}
    </ScrollView>
  </AppShell>;
}


function ProfilePanel({ profile, setProfile, pickPhoto, saveProfile, t }: { profile: TrainerProfile; setProfile: React.Dispatch<React.SetStateAction<TrainerProfile>>; pickPhoto: () => void; saveProfile: () => void; t: (key: string) => string }) {
  const initials = (profile.trainerName || 'AP').slice(0, 2).toUpperCase();
  return <View style={styles.innerBlock}>
    <View style={styles.profileTopRow}>
      {profile.photoUri ? <Image source={{ uri: profile.photoUri }} style={styles.photo} /> : <View style={styles.photoEmpty}><Text style={styles.photoText}>{initials}</Text></View>}
      <View style={styles.profileActionsColumn}>
        <Pressable onPress={pickPhoto} style={[styles.actionButton, styles.greenButton]}><MaterialCommunityIcons name="image-edit" size={22} color="#1F252E" /><Text style={[styles.actionButtonText, styles.darkButtonText]}>{t('changePhoto')}</Text></Pressable>
        <Pressable onPress={saveProfile} style={[styles.actionButton, styles.yellowButton]}><MaterialCommunityIcons name="content-save-check" size={22} color="#1F252E" /><Text style={[styles.actionButtonText, styles.darkButtonText]}>{t('save')}</Text></Pressable>
      </View>
    </View>
    <PremiumInput label={t('appName')} placeholder={t('appName')} value={profile.appTitle} onChangeText={v => setProfile(p => ({ ...p, appTitle: v }))} />
    <PremiumInput label={t('trainerName')} placeholder={t('trainerName')} value={profile.trainerName} onChangeText={v => setProfile(p => ({ ...p, trainerName: v }))} />
    <PremiumInput label={t('whoAmI')} placeholder={t('whoAmI')} value={profile.sportTitle} onChangeText={v => setProfile(p => ({ ...p, sportTitle: v }))} />
    <PremiumInput label={t('shortTitle')} placeholder={t('shortTitle')} value={profile.shortTitle || ''} onChangeText={v => setProfile(p => ({ ...p, shortTitle: v }))} />
    <PremiumInput label={t('city')} placeholder={t('enterCity')} value={profile.city || ''} onChangeText={v => setProfile(p => ({ ...p, city: v }))} />
    <PremiumInput label={t('achievement1')} placeholder={t('achievement1')} value={profile.worldAchievement || ''} onChangeText={v => setProfile(p => ({ ...p, worldAchievement: v }))} />
    <PremiumInput label={t('achievement2')} placeholder={t('achievement2')} value={profile.asiaAchievement || ''} onChangeText={v => setProfile(p => ({ ...p, asiaAchievement: v }))} />
    <PremiumInput label={t('description')} placeholder={t('description')} value={profile.description} onChangeText={v => setProfile(p => ({ ...p, description: v }))} multiline />
  </View>;
}

function AppearancePanel() {
  return <View style={styles.innerBlock}>
    <InfoRow icon="theme-light-dark" color="#B16CFF" title="Тема" value="Графитовая" />
    <InfoRow icon="format-color-fill" color="#F4C430" title="Акцент" value="Золото" />
    <InfoRow icon="cellphone" color="#4FA3FF" title="Интерфейс" value="Мобильный" />
  </View>;
}

function RegionPanel({ profile, setProfile, setCurrency, language, setLanguage, t }: { profile: TrainerProfile; setProfile: React.Dispatch<React.SetStateAction<TrainerProfile>>; setCurrency: (currency: CurrencyCode) => void; language: AppLanguage; setLanguage: (lang: AppLanguage) => void; t: (key: string) => string }) {
  const languages = [
    { code: 'ru' as const, label: 'Русский' },
    { code: 'kk' as const, label: 'Қазақша' },
    { code: 'en' as const, label: 'English' },
  ];
  return <View style={styles.innerBlock}>
    <Text style={styles.groupLabel}>{t('appLanguage')}</Text>
    <View style={styles.languageGrid}>{languages.map(item => <Pressable key={item.code} onPress={() => setLanguage(item.code)} style={[styles.languageBtn, language === item.code && styles.languageActive]}><Text style={[styles.languageText, language === item.code && styles.languageTextActive]}>{item.label}</Text></Pressable>)}</View>
    <PremiumInput label={t('city')} placeholder={t('enterCity')} value={profile.city || ''} onChangeText={v => setProfile(p => ({ ...p, city: v }))} />
    <Text style={styles.groupLabel}>{t('currency')}</Text>
    <View style={styles.currencyRow}>{(['KZT', 'USD', 'RUB'] as CurrencyCode[]).map(c => <Pressable key={c} onPress={() => setCurrency(c)} style={[styles.currencyBtn, profile.currency === c && styles.currencyActive]}><Text style={[styles.currencyText, profile.currency === c && styles.currencyTextActive]}>{currencyLabels[c]}</Text></Pressable>)}</View>
  </View>;
}

function NotificationsPanel() {
  const [paymentReminders, setPaymentReminders] = useState(true);
  const [backupNotices, setBackupNotices] = useState(true);
  const [systemNotices, setSystemNotices] = useState(false);
  return <View style={styles.innerBlock}>
    <NotifyRow icon="cash-clock" color="#F4C430" title="Напоминания об оплатах" active={paymentReminders} onPress={() => setPaymentReminders(v => !v)} />
    <NotifyRow icon="cloud-check" color="#B16CFF" title="Резервные копии" active={backupNotices} onPress={() => setBackupNotices(v => !v)} />
    <NotifyRow icon="bell-ring" color="#63D471" title="Системные уведомления" active={systemNotices} onPress={() => setSystemNotices(v => !v)} />
  </View>;
}

function SecurityPanel(props: { password: string; setPassword: (v: string) => void; recoveryEmail: string; setRecoveryEmail: (v: string) => void; autoLogin: boolean; toggleAuto: (v: boolean) => void; savePassword: () => void; saveRecoveryEmail: () => void; resetPassword: () => void; showPassword: boolean; setShowPassword: (v: boolean) => void }) {
  return <View style={styles.innerBlock}>
    <Pressable onPress={() => router.push('/backup' as never)} style={[styles.actionButton, styles.outlineButton]}><MaterialCommunityIcons name="database-sync" size={22} color={colors.gold} /><Text style={[styles.actionButtonText, { color: colors.gold }]}>Открыть резервные копии</Text></Pressable>
    <Text style={styles.groupLabel}>Пароль приложения</Text>
    <View style={styles.passwordField}>
      <MaterialCommunityIcons name="lock" size={24} color="#E35D5D" />
      <TextInput value={props.password} onChangeText={props.setPassword} placeholder="Новый пароль" placeholderTextColor={colors.muted} secureTextEntry={!props.showPassword} style={styles.fieldInput} maxFontSizeMultiplier={1.0} />
      <Pressable onPress={() => props.setShowPassword(!props.showPassword)}><MaterialCommunityIcons name={props.showPassword ? 'eye-off' : 'eye'} size={24} color={colors.gold} /></Pressable>
    </View>
    <Pressable onPress={props.savePassword} style={[styles.actionButton, styles.redButton]}><MaterialCommunityIcons name="lock-reset" size={22} color="#fff" /><Text style={styles.actionButtonText}>Сменить пароль</Text></Pressable>
    <Text style={styles.groupLabel}>E-mail восстановления</Text>
    <View style={styles.passwordField}>
      <MaterialCommunityIcons name="email" size={24} color="#4FA3FF" />
      <TextInput value={props.recoveryEmail} onChangeText={props.setRecoveryEmail} placeholder="E-mail восстановления" placeholderTextColor={colors.muted} keyboardType="email-address" autoCapitalize="none" style={styles.fieldInput} maxFontSizeMultiplier={1.0} />
    </View>
    <Pressable onPress={props.saveRecoveryEmail} style={[styles.actionButton, styles.blueButton]}><MaterialCommunityIcons name="email-check" size={22} color="#fff" /><Text style={styles.actionButtonText}>Сохранить e-mail</Text></Pressable>
    <View style={styles.switchRow}><View style={{ flex: 1 }}><Text style={styles.switchTitle}>Автоматический вход</Text><Text style={styles.switchSub}>Открывать без пароля</Text></View><Switch value={props.autoLogin} onValueChange={props.toggleAuto} thumbColor={props.autoLogin ? colors.gold : colors.muted} trackColor={{ false: colors.border, true: '#D4AF3755' }} /></View>
    <Pressable onPress={props.resetPassword} style={[styles.actionButton, styles.outlineButton]}><MaterialCommunityIcons name="restore" size={22} color={colors.gold} /><Text style={[styles.actionButtonText, { color: colors.gold }]}>Сбросить пароль</Text></Pressable>
  </View>;
}

function AboutPanel() {
  return <View style={styles.innerBlock}>
    <InfoRow icon="application-cog" color="#E5E7EB" title="Версия" value="v2.17 SDK54" />
    <InfoRow icon="calendar-check" color="#63D471" title="Сборка" value="2026" />
    <InfoRow icon="shield-check" color="#F4C430" title="Статус" value="Готово" />
  </View>;
}

function PremiumInput({ label, placeholder, value, onChangeText, multiline }: { label: string; placeholder: string; value: string; onChangeText: (v: string) => void; multiline?: boolean }) {
  return <View style={styles.inputWrap}>
    <Text maxFontSizeMultiplier={1.0} style={styles.inputLabel}>{label}</Text>
    <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={colors.muted} multiline={multiline} style={[styles.textInput, multiline && styles.textArea]} maxFontSizeMultiplier={1.0} />
  </View>;
}

function InfoRow({ icon, color, title, value }: { icon: string; color: string; title: string; value: string }) {
  return <View style={styles.infoRow}><MaterialCommunityIcons name={icon} size={26} color={color} /><Text maxFontSizeMultiplier={1.0} style={styles.infoTitle} numberOfLines={1}>{title}</Text><Text maxFontSizeMultiplier={1.0} style={styles.infoValue} numberOfLines={1}>{value}</Text></View>;
}

function NotifyRow({ icon, color, title, active, onPress }: { icon: string; color: string; title: string; active: boolean; onPress?: () => void }) {
  return <Pressable onPress={onPress} style={[styles.notifyRow, active && { borderColor: '#63D471' }]}><MaterialCommunityIcons name={icon} size={26} color={color} /><Text maxFontSizeMultiplier={1.0} style={styles.notifyTitle} numberOfLines={1}>{title}</Text><Text maxFontSizeMultiplier={1.0} style={[styles.notifyStatus, { color: active ? '#63D471' : colors.muted }]}>{active ? 'Вкл' : 'Выкл'}</Text></Pressable>;
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, paddingBottom: 190 },
  screenTitle: { fontSize: 34, lineHeight: 40, fontWeight: '900', color: colors.text, marginBottom: 4 },
  screenSub: { fontSize: 20, lineHeight: 26, fontWeight: '800', color: colors.muted, marginBottom: 14 },
  sectionGrid: { gap: 10 },
  sectionCard: { minHeight: 92, borderRadius: 22, backgroundColor: colors.card, borderWidth: 2, borderColor: colors.border, padding: 10, flexDirection: 'row', alignItems: 'center' },
  bigIconBox: { width: 64, height: 64, borderRadius: 20, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  sectionTextBox: { flex: 1, minWidth: 0 },
  sectionTitle: { fontSize: 25, lineHeight: 31, fontWeight: '900', color: colors.text },
  sectionSub: { marginTop: 2, fontSize: 17, lineHeight: 21, fontWeight: '800', color: colors.muted },
  panel: { marginTop: 4, borderRadius: 24, backgroundColor: colors.card, borderWidth: 2, padding: 12 },
  backButton: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  backText: { fontSize: 18, lineHeight: 22, fontWeight: '900', color: colors.gold },
  panelHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  panelIconBox: { width: 56, height: 56, borderRadius: 20, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  panelTitle: { fontSize: 32, lineHeight: 38, fontWeight: '900' },
  panelSub: { marginTop: 1, fontSize: 19, lineHeight: 24, fontWeight: '800', color: colors.muted },
  innerBlock: { gap: 11 },
  profileTopRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  profileActionsColumn: { flex: 1, gap: 10 },
  photo: { width: 96, height: 120, borderRadius: 18, backgroundColor: colors.cardSecond },
  photoEmpty: { width: 96, height: 120, borderRadius: 18, backgroundColor: colors.cardSecond, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  photoText: { fontSize: 32, fontWeight: '900', color: colors.gold },
  helpText: { fontSize: 18, lineHeight: 24, fontWeight: '800', color: colors.muted },
  inputWrap: { gap: 5 },
  inputLabel: { fontSize: 24, lineHeight: 30, fontWeight: '900', color: colors.gold },
  textInput: { minHeight: 62, borderRadius: 16, backgroundColor: colors.cardSecond, borderWidth: 1.5, borderColor: colors.border, paddingHorizontal: 14, color: colors.text, fontSize: 23, fontWeight: '800' },
  textArea: { minHeight: 126, textAlignVertical: 'top', paddingTop: 12, lineHeight: 28 },
  actionButton: { minHeight: 52, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 12 },
  actionButtonText: { fontSize: 19, lineHeight: 23, fontWeight: '900', color: '#fff' },
  darkButtonText: { color: '#1F252E' },
  greenButton: { backgroundColor: '#63D471' },
  yellowButton: { backgroundColor: colors.gold },
  redButton: { backgroundColor: '#C64545' },
  blueButton: { backgroundColor: '#2F80ED' },
  outlineButton: { backgroundColor: colors.cardSecond, borderWidth: 2, borderColor: colors.gold },
  groupLabel: { fontSize: 22, lineHeight: 27, fontWeight: '900', color: colors.gold, marginTop: 4 },
  currencyRow: { flexDirection: 'row', gap: 8 },
  currencyBtn: { flex: 1, minHeight: 52, borderRadius: 16, backgroundColor: colors.cardSecond, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  currencyActive: { borderColor: colors.gold, backgroundColor: '#D4AF3722' },
  currencyText: { fontSize: 17, fontWeight: '900', color: colors.text },
  currencyTextActive: { color: colors.gold },
  languageGrid: { gap: 8 },
  languageBtn: { minHeight: 56, borderRadius: 16, backgroundColor: colors.cardSecond, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  languageActive: { borderColor: '#4FA3FF', backgroundColor: '#4FA3FF22' },
  languageText: { fontSize: 20, fontWeight: '900', color: colors.text },
  languageTextActive: { color: '#4FA3FF' },
  passwordField: { minHeight: 56, borderRadius: 16, backgroundColor: colors.cardSecond, borderWidth: 1.5, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 8 },
  fieldInput: { flex: 1, fontSize: 20, fontWeight: '800', color: colors.text },
  switchRow: { minHeight: 68, borderRadius: 18, backgroundColor: colors.cardSecond, borderWidth: 1.5, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12 },
  switchTitle: { fontSize: 20, lineHeight: 24, fontWeight: '900', color: colors.text },
  switchSub: { marginTop: 2, fontSize: 15, lineHeight: 19, fontWeight: '800', color: colors.muted },
  infoRow: { minHeight: 58, borderRadius: 16, backgroundColor: colors.cardSecond, borderWidth: 1.5, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 10 },
  infoTitle: { flex: 1, fontSize: 18, fontWeight: '900', color: colors.text },
  infoValue: { maxWidth: '48%', fontSize: 17, fontWeight: '900', color: colors.muted, textAlign: 'right' },
  notifyRow: { minHeight: 58, borderRadius: 16, backgroundColor: colors.cardSecond, borderWidth: 1.5, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 10 },
  notifyTitle: { flex: 1, fontSize: 18, fontWeight: '900', color: colors.text },
  notifyStatus: { fontSize: 17, fontWeight: '900' },
});
