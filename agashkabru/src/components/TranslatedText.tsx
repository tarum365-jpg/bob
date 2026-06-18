import React from 'react';
import { Text as RNText, TextProps } from 'react-native';
import { useI18n } from '../i18n';

function translateChild(child: React.ReactNode, t: (key: string) => string): React.ReactNode {
  if (typeof child === 'string') return t(child);
  if (Array.isArray(child)) return child.map((item, index) => <React.Fragment key={index}>{translateChild(item, t)}</React.Fragment>);
  return child;
}

export function Text(props: TextProps) {
  const { t } = useI18n();
  return <RNText {...props}>{translateChild(props.children, t)}</RNText>;
}
