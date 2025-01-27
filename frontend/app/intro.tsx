import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Video, { VideoRef } from 'react-native-video';
import { router, useNavigation } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Button } from '@/src/components/form/Button';
import { Text } from '@/src/components/typography/Text';
import { tokens } from '@/src/theme/tokens';
import { useUserStore } from '@/src/stores/useUserStore';
import LottieView from 'lottie-react-native';

export default function IntroScreen() {
  const videoRef = useRef<VideoRef>(null);
  const [isPaused, setIsPaused] = useState(false);
  const setFirstLaunch = useUserStore((state) => state.setFirstLaunch);
  const navigation = useNavigation();
  
  useEffect(() => {
    // Subscribe to navigation events
    const unsubscribe = navigation.addListener('beforeRemove', () => {
      setIsPaused(true);
      if (videoRef.current) {
        videoRef.current.seek(0);
      }
    });
    
    return () => {
      unsubscribe();
      setIsPaused(true);
    };
  }, [navigation]);
  
  const handleNavigation = (route: 'login' | 'register') => {
    setFirstLaunch(false);
    setIsPaused(true);
    router.push(`/(auth)/${route}`);
  };
  
  return (
    <View style={styles.container}>
    <StatusBar style="light" />
    
    {/* Background Video */}
    <Video
    ref={videoRef}
    source={require('@/assets/videos/intro.mp4')}
    style={styles.video}
    repeat
    resizeMode="cover"
    rate={1.0}
    volume={1}
    ignoreSilentSwitch={"ignore"}
    playInBackground={false}
    paused={isPaused}
    onEnd={() => {
      if (videoRef.current) {
        videoRef.current.seek(0);
      }
    }}
    />
    
    {/* Overlay */}
    <View style={styles.overlay} />
    
    {/* Content */}
    <View style={styles.content}>
    <Text variant="h1" style={styles.title}>
    LUME
    </Text>
    
    <Text style={styles.motto}>
    Ignite your culinary journey
    </Text>
    
    <View style={styles.buttonContainer}>
    
    <Button
    title="Create Account"
    onPress={() => handleNavigation('register')}
    style={[styles.button, styles.outlineButton]}
    titleStyle={{ color: '#0E0E0E' }}
    />
    <Button
    title="I already have an account"
    onPress={() => handleNavigation('login')}
    style={styles.button}
    titleStyle={{ color: '#FFF5E6' }}
    />
    </View>
    </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  video: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  content: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: tokens.spacing.xl,
    bottom: tokens.spacing.xxl,
  },
  title: {
    color: '#FFF',
    fontSize: 64,
    fontWeight: tokens.fontWeight.bold,
    textAlign: 'center',
    marginBottom: tokens.spacing.md,
  },
  motto: {
    color: '#FFF',
    fontSize: tokens.fontSize.xl,
    textAlign: 'center',
    marginBottom: tokens.spacing.xxl,
  },
  buttonContainer: {
    gap: tokens.spacing.md,
  },
  button: {
    backgroundColor: 'rgba(255, 245, 230, 0.6)',
  },
  outlineButton: {
    backgroundColor: '#FFF5E6',
  },
  
});