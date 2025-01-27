// src/components/layout/AuthLayout.tsx
import { View, SafeAreaView, StyleSheet } from 'react-native';
import { useHeaderHeight } from '@react-navigation/elements';
import { tokens } from '@/src/theme/tokens';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export const AuthLayout = ({ children }: AuthLayoutProps) => {
  const headerHeight = useHeaderHeight();

  return (
    <SafeAreaView style={styles.container}>
      <View style={[
        styles.content,
        { marginTop: headerHeight } // Ajudst margin top based on header height
      ]}>
        {children}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.background.primary,
  },
  content: {
    flex: 1,

  }
});