import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '../src/components/TranslatedText';
import { router } from '../src/navigation';
import { AppShell } from '../src/components/AppShell';
import { Button } from '../src/components/Button';
import { Card } from '../src/components/Card';
import { Input } from '../src/components/Input';
import { colors, spacing } from '../src/constants/theme';
import { localStore } from '../src/storage/localStore';

export default function NewPasswordScreen() {
  const [newPassword, setNewPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');

  async function saveNewPassword() {
    const verified = await localStore.getPasswordResetVerified();
    if (!verified) return Alert.alert('Ошибка', 'Сначала подтвердите SMS-код.');
    if (newPassword.length < 8) return Alert.alert('Ошибка', 'Пароль должен быть минимум 8 символов.');
    if (newPassword !== repeatPassword) return Alert.alert('Ошибка', 'Пароли не совпадают.');
    await localStore.setPassword(newPassword);
    await localStore.setRememberLogin(false);
    await localStore.clearPasswordResetCode();
    await localStore.setPasswordResetVerified(false);
    router.replace('/password-reset-success' as never);
  }

  return (
    <AppShell title="Новый пароль" active="settings">
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.resetCard}>
          <View style={styles.resetIconCircle}><Text style={styles.resetIcon}>🔐</Text></View>
          <Text style={styles.resetTitle}>Создайте новый пароль</Text>
          <Text style={styles.resetSub}>Придумайте надёжный пароль для входа в приложение</Text>
          <Input value={newPassword} onChangeText={setNewPassword} placeholder="Новый пароль" secureTextEntry />
          <Input value={repeatPassword} onChangeText={setRepeatPassword} placeholder="Повторите новый пароль" secureTextEntry />
          <View style={styles.passwordRules}>
            <Text style={styles.ruleOk}>✓ Минимум 8 символов</Text>
            <Text style={styles.ruleOk}>✓ Цифры и буквы</Text>
            <Text style={styles.ruleOk}>✓ Заглавные и строчные буквы</Text>
          </View>
          <Button title="Сохранить пароль" onPress={saveNewPassword} />
        </Card>
      </ScrollView>
    </AppShell>
  );
}
const styles = StyleSheet.create({
  content: { padding: spacing.md, paddingBottom: 120 }, resetCard: { padding: 18 }, resetIconCircle: { width: 82, height: 82, borderRadius: 41, borderWidth: 1, borderColor: colors.border, alignSelf: 'center', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }, resetIcon: { fontSize: 40 }, resetTitle: { fontSize: 24, lineHeight: 30, fontWeight: '900', color: colors.text, textAlign: 'center' }, resetSub: { marginTop: 8, marginBottom: 18, fontSize: 15, lineHeight: 21, color: colors.muted, textAlign: 'center' }, passwordRules: { marginVertical: 12 }, ruleOk: { fontSize: 14, lineHeight: 20, fontWeight: '800', color: colors.success },
});
