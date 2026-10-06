import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts, Nunito_700Bold } from '@expo-google-fonts/nunito';
import * as ExpoSplashScreen from 'expo-splash-screen';
import HeartLogo from '../../components/HeartLogo';

export default function SplashScreen({ navigation, currentUser }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [fontsLoaded] = useFonts({
    Nunito_700Bold,
  });

  useEffect(() => {
    try {
      if (ExpoSplashScreen && typeof ExpoSplashScreen.hideAsync === 'function') {
        ExpoSplashScreen.hideAsync().catch(() => {});
      }
    } catch (e) {
      // Ignore splash hide errors on web
    }
  }, []);

  useEffect(() => {
    if (fontsLoaded) {
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.delay(1000),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start(() => {
        if (currentUser) {
          const roleScreens = {
            caregiver: 'CaregiverProfiles',
            doctor: 'HomeVisitSummary',
            nurse: 'NurseMyPatients',
            pharmacist: 'PharmacistPatientMedicines',
            patient: 'TodaysSchedule',
          };
          const target = roleScreens[currentUser.role] || 'TodaysSchedule';
          navigation?.replace ? navigation.replace(target) : navigation?.navigate?.(target);
        } else {
          navigation?.replace ? navigation.replace('Welcome') : navigation?.navigate?.('Welcome');
        }
      });
    }
  }, [fontsLoaded, fadeAnim, navigation, currentUser]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#EAF6EF', '#FFFFFF']}
        style={StyleSheet.absoluteFillObject}
      />
      <Animated.View style={[styles.centeredGroup, { opacity: fadeAnim }]}>
        <HeartLogo width={80} gradientColors={['#7FA68B', '#5E8B6C']} />
        <Text style={styles.brandTitle}>
          Medi<Text style={styles.brandCarePlus}>Care+</Text>
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centeredGroup: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: '-4%',
  },
  brandTitle: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 36,
    color: '#1F2A44',
    marginTop: 16,
    letterSpacing: -0.5,
  },
  brandCarePlus: {
    color: '#6F9577',
  },
});
