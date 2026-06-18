import React, { useMemo, useRef, useState } from 'react';
import { Modal, PanResponder, Platform, Pressable, StatusBar, StyleSheet, View } from 'react-native';
import { Text } from './TranslatedText';
import { Ionicons, MaterialCommunityIcons } from './SafeIcon';
import { router, useCurrentRoute } from '../navigation';
import { useI18n } from '../i18n';
import { colors, spacing } from '../constants/theme';

const drawerItems = [
  { key: 'home', icon: 'home', family: 'Ionicons', path: '/home', color: '#F4C430' },
  { key: 'clients', icon: 'account-group', family: 'MaterialCommunityIcons', path: '/clients', color: '#63D471' },
  { key: 'templates', icon: 'file-document', family: 'MaterialCommunityIcons', path: '/plans', color: '#4FA3FF' },
  { key: 'assignment', icon: 'clipboard-check', family: 'MaterialCommunityIcons', path: '/assign', color: '#F59E0B' },
  { key: 'finance', icon: 'cash-multiple', family: 'MaterialCommunityIcons', path: '/finance', color: '#F4C430' },
  { key: 'security', icon: 'shield-check', family: 'MaterialCommunityIcons', path: '/backup', color: '#5DADEC' },
  { key: 'settings', icon: 'settings', family: 'Ionicons', path: '/settings', color: '#E5E7EB' },
];

type Props = {
  title: string;
  active?: 'home' | 'clients' | 'plans' | 'assign' | 'finance' | 'backup' | 'settings';
  children: React.ReactNode;
};

function NavIcon({ family, name, size, color }: { family: string; name: string; size: number; color: string }) {
  if (family === 'Ionicons') return <Ionicons name={name as any} size={size} color={color} />;
  return <MaterialCommunityIcons name={name as any} size={size} color={color} />;
}

export function AppShell({ title, children }: Props) {
  const [open, setOpen] = useState(false);
  const { path } = useCurrentRoute();
  const { t } = useI18n();
  const canGoBack = path !== '/' && path !== '/home';
  const touchStart = useRef({ x: 0, y: 0, time: 0 });

  function onTouchStartCapture(event: any) {
    const touch = event?.nativeEvent?.touches?.[0] || event?.nativeEvent;
    touchStart.current = { x: touch?.pageX || 0, y: touch?.pageY || 0, time: Date.now() };
  }

  function onTouchEndCapture(event: any) {
    const touch = event?.nativeEvent?.changedTouches?.[0] || event?.nativeEvent;
    const dx = (touch?.pageX || 0) - touchStart.current.x;
    const dy = Math.abs((touch?.pageY || 0) - touchStart.current.y);
    const dt = Date.now() - touchStart.current.time;
    if (dt > 900 || dy > 80 || Math.abs(dx) < 82) return;
    if (dx > 0 && canGoBack) router.back();
    if (dx < 0) router.forward();
  }

  const swipe = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 18 && Math.abs(g.dx) > Math.abs(g.dy) * 1.15,
    onMoveShouldSetPanResponderCapture: (_, g) => Math.abs(g.dx) > 24 && Math.abs(g.dx) > Math.abs(g.dy) * 1.15,
    onPanResponderTerminationRequest: () => false,
    onPanResponderRelease: (_, g) => {
      if (g.dx > 45 && canGoBack) router.back();
      if (g.dx < -45) router.forward();
    },
  }), [canGoBack]);
  function go(path: string) {
    setOpen(false);
    setTimeout(() => path === '/home' ? router.replace(path as never) : router.push(path as never), 60);
  }

  return (
    <View style={styles.root} {...swipe.panHandlers} onTouchStartCapture={onTouchStartCapture} onTouchEndCapture={onTouchEndCapture}>
      <View style={styles.header}> 
        <Pressable onPress={() => setOpen(true)} style={styles.menuButton} accessibilityLabel="Открыть меню">
          <Text maxFontSizeMultiplier={1.0} style={styles.menuIcon}>☰</Text>
        </Pressable>
        {canGoBack && <Pressable onPress={() => router.back()} style={styles.backChip}><Text style={styles.backChipText}>‹</Text></Pressable>}
        <Text maxFontSizeMultiplier={1.0} style={styles.headerTitle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.78}>{t(title) || title}</Text>
      </View>

      <View style={styles.body}>{children}</View>

      <Modal transparent visible={open} animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
        <View style={styles.drawer}> 
          <Text maxFontSizeMultiplier={1.0} style={styles.drawerTitle}>{t('sections')}</Text>
          {drawerItems.map(item => (
            <Pressable key={item.path} onPress={() => go(item.path)} style={styles.drawerItem}>
              <View style={styles.drawerIconBox}><NavIcon family={item.family} name={item.icon} size={28} color={item.color} /></View>
              <Text maxFontSizeMultiplier={1.0} style={styles.drawerItemText} numberOfLines={1}>{t(item.key)}</Text>
            </Pressable>
          ))}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background, paddingBottom: 26 },
  header: {
    minHeight: 92,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 8 : 18,
    paddingHorizontal: spacing.md,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  menuButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.md,
  },
  menuIcon: { fontSize: 27, fontWeight: '900', color: colors.gold },
  backChip: { width: 36, height: 48, alignItems: 'center', justifyContent: 'center', marginRight: 6 },
  backChipText: { fontSize: 38, lineHeight: 42, fontWeight: '900', color: colors.gold },
  headerTitle: { flex: 1, fontSize: 27, lineHeight: 32, fontWeight: '900', color: colors.gold },
  body: { flex: 1 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  drawer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '82%',
    backgroundColor: colors.card,
    paddingHorizontal: spacing.lg,
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  drawerTitle: { fontSize: 30, fontWeight: '900', color: colors.gold, marginTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 14 : 28, marginBottom: spacing.lg },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  drawerIconBox: { width: 46, height: 46, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cardSecond, marginRight: 10 },
  drawerItemText: { fontSize: 22, fontWeight: '900', color: colors.text },
});
