import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '../src/components/TranslatedText';
import { router } from '../src/navigation';
import { AppShell } from '../src/components/AppShell';
import { Button } from '../src/components/Button';
import { Card } from '../src/components/Card';
import { Input } from '../src/components/Input';
import { colors, spacing } from '../src/constants/theme';
import { localStore } from '../src/storage/localStore';

export default function ForgotPasswordScreen() {
  const [phone, setPhone] = useState('');

  async function sendSmsCode() {
    if (phone.replace(/\D/g, '').length < 10) {
      Alert.alert('Ошибка', 'Введите корректный номер телефона.');
      return;
    }
    const code = String(Math.floor(1000 + Math.random() * 9000));
    await localStore.setRecoveryPhone(phone);
    await localStore.setPasswordResetCode({ phone, code, createdAt: new Date().toISOString() });
    Alert.alert('Код отправлен', `Демо-код: ${code}\nВ реальной версии SMS подключается через SMS-сервис.`);
    router.push('/verify-sms-code' as never);
  }

  return (
    <AppShell title="Восстановление пароля" active="settings">
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.resetCard}>
          <Pressable onPress={() => router.back()}><Text style={styles.backArrow}>‹</Text></Pressable>
          <View style={styles.resetIconCircle}><Text style={styles.resetIcon}>📱</Text></View>
          <Text style={styles.resetTitle}>Введите номер телефона</Text>
          <Text style={styles.resetSub}>Мы отправим SMS с кодом для восстановления пароля</Text>
          <Input value={phone} onChangeText={setPhone} placeholder="+7 (___) ___-__-__" keyboardType="phone-pad" />
          <Button title="Отправить код" onPress={sendSmsCode} />
          <Pressable onPress={() => router.replace('/' as never)}><Text style={styles.backToLogin}>Назад к входу</Text></Pressable>
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
  backToLogin: { marginTop: 18, fontSize: 15, color: colors.gold, fontWeight: '900', textAlign: 'center' },
});
