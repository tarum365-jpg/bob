
import React from 'react';
import { TextInput, StyleSheet, TextInputProps } from 'react-native';
import { colors, spacing } from '../constants/theme';
import { useI18n } from '../i18n';

export function Input(props: TextInputProps) {
  const { t } = useI18n();
  const placeholder = typeof props.placeholder === 'string' ? t(props.placeholder) : props.placeholder;
  return <TextInput maxFontSizeMultiplier={1.0} placeholderTextColor={colors.muted} {...props} placeholder={placeholder} style={[styles.input, props.style]} />;
}

const styles = StyleSheet.create({
  input: {
    minHeight: 68,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    marginVertical: 6,
    color: colors.text,
    fontSize: 22,
    fontWeight: '700',
  }
});
