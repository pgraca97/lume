// frontend/src/components/SplashScreen.tsx
import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import LottieView from 'lottie-react-native';
import * as ExpoSplashScreen from 'expo-splash-screen';
import { useSplashStore } from '../stores/useSplashStore';
import { tokens } from '@/src/theme/tokens';

export const CustomSplashScreen: React.FC = () => {
  const animation = useRef<LottieView>(null);
  const completeSplash = useSplashStore((state) => state.complete);

  const textOpacity = useRef(new Animated.Value(0)).current;
  const [showText, setShowText] = useState(true);

    // Add fade-out animation
    const screenOpacity = useRef(new Animated.Value(1)).current;
    const screenScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const prepare = async () => {
      try {
        animation.current?.play();
        await ExpoSplashScreen.hideAsync();
      } catch (e) {
        console.warn(e);
      }

      await new Promise(resolve => setTimeout(resolve, 500));
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 1000,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start();
    };
    prepare();
  }, []);

  const handleAnimationFinish = () => {
   completeSplash();
   setTimeout(() => {
    Animated.parallel([
      Animated.timing(screenOpacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(screenScale, {
        toValue: 1.1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start(completeSplash);
  }, 500); // Add slight delay after Lottie completes
  };

  return (
    <View style={styles.container}>
      <LottieView
        ref={animation}
        source={require('@/assets/animations/splash.json')}
        style={styles.animation}
        autoPlay={false}
        loop={false}
        resizeMode="contain"
        onAnimationFinish={handleAnimationFinish}
        speed={1.2}
        renderMode="HARDWARE"
      />
            {showText && (
        <Animated.Text
          style={[
            styles.text,
            { 
              opacity: textOpacity,
              transform: [{ translateY: textOpacity.interpolate({
                inputRange: [0, 1],
                outputRange: [30, 0]
              }) }]
            }
          ]}
        >
          Your daily cooking companion
        </Animated.Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  animation: {
    width: 200,
    height: 213,
  },
  text: {
    position: 'absolute',
    bottom: tokens.spacing.xxl,
    fontSize: tokens.fontSize.lg,
    color: tokens.colors.primary[500],
   // fontFamily: tokens.fontFamily.body,
    letterSpacing: 0.5,
  },
});
