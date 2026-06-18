import React from 'react';
import { LogBox, StatusBar } from 'react-native';
import { NavigationProvider, useCurrentRoute } from './src/navigation';
import { I18nProvider } from './src/i18n';
import LoginScreen from './screens/index';
import HomeScreen from './screens/home';
import ClientsScreen from './screens/clients';
import PlansScreen from './screens/plans';
import AssignScreen from './screens/assign';
import FinanceScreen from './screens/finance';
import SettingsScreen from './screens/settings';
import BackupScreen from './screens/backup';
import ForgotPasswordScreen from './screens/forgot-password';
import VerifySmsCodeScreen from './screens/verify-sms-code';
import NewPasswordScreen from './screens/new-password';
import PasswordResetSuccessScreen from './screens/password-reset-success';
import ClientProfileScreen from './screens/client-profile';

LogBox.ignoreAllLogs(true);

if (typeof console !== 'undefined') {
  console.warn = () => undefined;
  console.log = () => undefined;
}

function CurrentScreen() {
  const { path } = useCurrentRoute();
  if (path === '/home') return <HomeScreen />;
  if (path === '/clients') return <ClientsScreen />;
  if (path === '/plans') return <PlansScreen />;
  if (path === '/assign') return <AssignScreen />;
  if (path === '/finance') return <FinanceScreen />;
  if (path === '/settings') return <SettingsScreen />;
  if (path === '/backup') return <BackupScreen />;
  if (path === '/forgot-password') return <ForgotPasswordScreen />;
  if (path === '/verify-sms-code') return <VerifySmsCodeScreen />;
  if (path === '/new-password') return <NewPasswordScreen />;
  if (path === '/password-reset-success') return <PasswordResetSuccessScreen />;
  if (path === '/client-profile') return <ClientProfileScreen />;
  return <LoginScreen />;
}

export default function App() {
  return (
    <I18nProvider>
    <NavigationProvider>
      <StatusBar barStyle="light-content" backgroundColor="#191E28" />
      <CurrentScreen />
    </NavigationProvider>
    </I18nProvider>
  );
}
