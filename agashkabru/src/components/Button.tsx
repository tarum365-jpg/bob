
import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Text } from './TranslatedText';
import { useI18n } from '../i18n';
import { colors, spacing } from '../constants/theme';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'outline';

export function Button({ title, onPress, variant = 'primary', disabled = false }: { title: string; onPress: () => void; variant?: ButtonVariant; disabled?: boolean }) {
  const { t } = useI18n();
  const style = variant === 'primary' ? styles.primary : variant === 'danger' ? styles.danger : variant === 'outline' ? styles.outline : styles.secondary;
  const text = variant === 'primary' || variant === 'danger' ? styles.primaryText : variant === 'outline' ? styles.outlineText : styles.secondaryText;

  return (
    <Pressable disabled={disabled} onPress={onPress} style={[styles.base, style, disabled && styles.disabled]}>
      <Text maxFontSizeMultiplier={1.0} style={[text, disabled && styles.disabledText]}>{t(title)}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 66,
    paddingVertical: 16,
    paddingHorizontal: spacing.md,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 6,
  },
  primary: { backgroundColor: colors.gold },
  danger: { backgroundColor: colors.danger },
  secondary: { backgroundColor: colors.cardSecond, borderWidth: 1, borderColor: colors.border },
  outline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.gold },
  primaryText: { color: '#FFFFFF', fontWeight: '900', fontSize: 22, textAlign: 'center' },
  secondaryText: { color: colors.text, fontWeight: '900', fontSize: 21, textAlign: 'center' },
  outlineText: { color: colors.gold, fontWeight: '900', fontSize: 22, textAlign: 'center' },
  disabled: { opacity: 0.65, backgroundColor: '#6B5A2D' },
  disabledText: { color: '#F5F3EE' },
});
