import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '../src/components/TranslatedText';
import { router } from '../src/navigation';
import { AppShell } from '../src/components/AppShell';
import { Button } from '../src/components/Button';
import { colors, spacing } from '../src/constants/theme';

export default function PasswordResetSuccessScreen() {
  return <AppShell title="Готово" active="settings"><View style={styles.successPage}><View style={styles.successCircle}><Text style={styles.successIcon}>✓</Text></View><Text style={styles.title}>Пароль успешно изменён!</Text><Text style={styles.sub}>Теперь вы можете войти в приложение с новым паролем.</Text><Button title="Перейти к входу" onPress={() => router.replace('/' as never)} /></View></AppShell>;
}
const styles = StyleSheet.create({ successPage: { flex: 1, justifyContent: 'center', padding: spacing.lg }, successCircle: { width: 88, height: 88, borderRadius: 44, borderWidth: 1, borderColor: colors.border, alignSelf: 'center', alignItems: 'center', justifyContent: 'center', marginBottom: 22 }, successIcon: { fontSize: 48, color: colors.success, fontWeight: '900' }, title: { fontSize: 25, color: colors.text, fontWeight: '900', textAlign: 'center' }, sub: { marginVertical: 18, color: colors.muted, fontSize: 16, textAlign: 'center', lineHeight: 23 } });
