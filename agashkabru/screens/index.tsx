import React, { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Switch, TextInput, View } from 'react-native';
import { Text } from '../src/components/TranslatedText';
import { router } from '../src/navigation';
import { Button } from '../src/components/Button';
import { Card } from '../src/components/Card';
import { Input } from '../src/components/Input';
import { colors, spacing } from '../src/constants/theme';
import { localStore } from '../src/storage/localStore';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [hasPassword, setHasPassword] = useState<boolean | null>(null);
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => { (async () => {
    const saved = await localStore.getPassword();
    const rememberLogin = await localStore.getRememberLogin();
    const recoveryEmail = await localStore.getRecoveryEmail();
    setEmail(recoveryEmail || '');
    setHasPassword(!!saved);
    setRemember(rememberLogin);
    if (saved && rememberLogin) router.replace('/home');
  })(); }, []);

  async function enter() {
    const saved = await localStore.getPassword();
    if (!saved) {
      if (newPassword.length < 4) {
        Alert.alert('Ошибка', 'Создайте пароль минимум 4 символа.');
        return;
      }
      await localStore.setPassword(newPassword);
      await localStore.setRememberLogin(remember);
      if (email) await localStore.setRecoveryEmail(email);
      router.replace('/home');
      return;
    }
    if (saved === password) {
      await localStore.setRememberLogin(remember);
      if (email) await localStore.setRecoveryEmail(email);
      router.replace('/home');
    } else Alert.alert('Ошибка', 'Неверный пароль');
  }

  return (
    <View style={styles.container}>
      <Card style={styles.loginCard}>
        <View style={styles.logoBox}>
          <Text maxFontSizeMultiplier={1.0} style={styles.logoIcon}>🏋️</Text>
          <Text maxFontSizeMultiplier={1.0} style={styles.logoTitle}>AP STRENGTH</Text>
          <Text maxFontSizeMultiplier={1.0} style={styles.logoSub}>POWERLIFTING</Text>
        </View>

        <Text maxFontSizeMultiplier={1.0} style={styles.welcomeTitle}>Добро пожаловать!</Text>
        <Text maxFontSizeMultiplier={1.0} style={styles.welcomeSub}>Войдите в приложение</Text>

        <Input placeholder="E-mail восстановления" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />

        {hasPassword === false ? (
          <Input secureTextEntry={!showPassword} placeholder="Создайте пароль минимум 4 символа" value={newPassword} onChangeText={setNewPassword} />
        ) : (
          <View style={styles.passwordWrap}>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Пароль"
              placeholderTextColor={colors.muted}
              secureTextEntry={!showPassword}
              style={styles.passwordInput}
            />
            <Pressable onPress={() => setShowPassword(v => !v)}><Text style={styles.eye}>{showPassword ? '🙈' : '👁️'}</Text></Pressable>
          </View>
        )}

        <View style={styles.row}>
          <Text maxFontSizeMultiplier={1.0} style={styles.label}>Запомнить меня</Text>
          <Switch value={remember} onValueChange={setRemember} thumbColor={remember ? colors.gold : colors.muted} trackColor={{ false: colors.border, true: '#D4AF3755' }} />
        </View>

        <Button title={hasPassword === false ? 'Создать пароль и войти' : 'Войти'} onPress={enter} />

        {hasPassword !== false && (
          <Pressable style={styles.forgotButton} onPress={() => router.push('/forgot-password' as never)}>
            <Text maxFontSizeMultiplier={1.0} style={styles.forgotText}>Забыли пароль?</Text>
          </Pressable>
        )}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg, justifyContent: 'center' },
  loginCard: { padding: 18 },
  logoBox: { alignItems: 'center', marginBottom: 22 },
  logoIcon: { fontSize: 54 },
  logoTitle: { marginTop: 8, fontSize: 24, fontWeight: '900', color: colors.gold },
  logoSub: { fontSize: 12, letterSpacing: 4, color: colors.muted },
  welcomeTitle: { fontSize: 22, fontWeight: '900', color: colors.text, textAlign: 'center' },
  welcomeSub: { marginTop: 4, marginBottom: 18, fontSize: 15, color: colors.muted, textAlign: 'center' },
  passwordWrap: { minHeight: 54, borderRadius: 18, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginVertical: 6 },
  passwordInput: { flex: 1, color: colors.text, fontSize: 16, fontWeight: '700' },
  eye: { fontSize: 22 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 12 },
  label: { color: colors.text, fontSize: 16, fontWeight: '800' },
  forgotButton: { alignSelf: 'center', marginTop: 14, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.gold, borderRadius: 12, paddingVertical: 9, paddingHorizontal: 28 },
  forgotText: { fontSize: 15, fontWeight: '900', color: colors.gold },
});
