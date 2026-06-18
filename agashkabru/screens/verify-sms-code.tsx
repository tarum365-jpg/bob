import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Text } from '../src/components/TranslatedText';
import { router } from '../src/navigation';
import { AppShell } from '../src/components/AppShell';
import { Button } from '../src/components/Button';
import { Card } from '../src/components/Card';
import { colors, spacing } from '../src/constants/theme';
import { localStore } from '../src/storage/localStore';

export default function VerifySmsCodeScreen() {
  const [digits, setDigits] = useState(['', '', '', '']);
  const code = digits.join('');

  async function verifyCode() {
    const saved = await localStore.getPasswordResetCode();
    if (!saved?.code) return Alert.alert('Ошибка', 'Код не найден. Запросите код заново.');
    if (code !== saved.code) return Alert.alert('Ошибка', 'Неверный SMS-код.');
    await localStore.setPasswordResetVerified(true);
    router.push('/new-password' as never);
  }

  return (
    <AppShell title="Восстановление пароля" active="settings">
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.resetCard}>
          <Pressable onPress={() => router.back()}><Text style={styles.backArrow}>‹</Text></Pressable>
          <View style={styles.resetIconCircle}><Text style={styles.resetIcon}>💬</Text></View>
          <Text style={styles.resetTitle}>Введите код из SMS</Text>
          <Text style={styles.resetSub}>Введите 4 цифры, отправленные на ваш номер телефона</Text>
          <View style={styles.codeRow}>{digits.map((digit, index) => <TextInput key={index} value={digit} onChangeText={v => { const next = [...digits]; next[index] = v.replace(/\D/g, '').slice(0, 1); setDigits(next); }} keyboardType="number-pad" maxLength={1} style={styles.codeBox} />)}</View>
          <Text style={styles.timerText}>Код можно отправить повторно через 00:45</Text>
          <Button title="Подтвердить" onPress={verifyCode} />
          <Pressable onPress={() => router.replace('/forgot-password' as never)}><Text style={styles.backToLogin}>Изменить номер телефона</Text></Pressable>
        </Card>
      </ScrollView>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, paddingBottom: 120 },
  resetCard: { padding: 18 },
  backArrow: { fontSize: 36, color: colors.gold, fontWeight: '900' },
  resetIconCircle: { width: 82, height: 82, borderRadius: 41, borderWidth: 1, borderColor: colors.border, alignSelf: 'center', alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  resetIcon: { fontSize: 40 },
  resetTitle: { fontSize: 24, lineHeight: 30, fontWeight: '900', color: colors.text, textAlign: 'center' },
  resetSub: { marginTop: 8, marginBottom: 18, fontSize: 15, lineHeight: 21, color: colors.muted, textAlign: 'center' },
  codeRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 20 },
  codeBox: { width: 62, height: 62, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.cardSecond, color: colors.text, fontSize: 26, fontWeight: '900', textAlign: 'center' },
  timerText: { fontSize: 14, color: colors.muted, textAlign: 'center', marginBottom: 16 },
  backToLogin: { marginTop: 18, fontSize: 15, color: colors.gold, fontWeight: '900', textAlign: 'center' },
});
