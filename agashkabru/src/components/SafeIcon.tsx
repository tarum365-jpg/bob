import React from 'react';
import { Text, TextStyle } from 'react-native';

type Props = {
  name: string;
  size?: number;
  color?: string;
  style?: TextStyle | TextStyle[];
};

const ICONS: Record<string, string> = {
  home: '⌂',
  settings: '⚙',
  'account-group': '👥',
  'file-document': '📄',
  'clipboard-check': '📋',
  'cash-multiple': '₸',
  'shield-check': '🛡',
  'account-circle': '👤',
  palette: '🎨',
  earth: '🌐',
  'bell-ring': '🔔',
  'shield-lock': '🛡',
  information: 'i',
  'chevron-forward': '›',
  'image-edit': '✎',
  'content-save-check': '✓',
  'theme-light-dark': '◐',
  'format-color-fill': '▣',
  cellphone: '▯',
  translate: 'Я',
  'cash-clock': '₸',
  'cloud-check': '☁',
  lock: '🔒',
  'lock-reset': '↻',
  email: '@',
  'email-check': '✓',
  'application-cog': '⚙',
  'calendar-check': '✓',
  'database-check': '●',
  'download-outline': '↓',
  restore: '↻',
  'folder-open': '▣',
  'upload-outline': '↑',
  'cloud-sync': '☁',
  sync: '↻',
  'calendar-sync': '↻',
  'bell-off-outline': '🔕',
  'bell-ring-outline': '🔔',
  'calendar-month': '📅',
  'shield-refresh': '🛡',
  'clock-outline': '◷',
  'package-variant': '▣',
  'file-document-outline': '▤',
  'eye-off': '◉',
  'eye': '👁',
  'database-sync': '●',
  'chevron-back': '‹',
};

export function SafeIcon({ name, size = 24, color = '#fff', style }: Props) {
  const glyph = ICONS[name] ?? '●';
  return (
    <Text
      maxFontSizeMultiplier={1.0}
      style={[{ fontSize: size, lineHeight: Math.round(size * 1.12), color, fontWeight: '900', textAlign: 'center' }, style]}
    >
      {glyph}
    </Text>
  );
}

export const MaterialCommunityIcons = SafeIcon;
export const Ionicons = SafeIcon;
