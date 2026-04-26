import { Redirect } from 'expo-router';
import { useAuthStore } from '../stores/useAuthStore';

export default function Index() {
  const user = useAuthStore((state) => state.user);

  // Redirect to tabs if authenticated, otherwise to login
  if (user) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(auth)/login" />;
}
