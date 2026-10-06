import React from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  useFonts,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
} from '@expo-google-fonts/nunito';
import HeartLogo from '../../components/HeartLogo';

export default function WelcomeScreen({ navigation }) {
  const [fontsLoaded] = useFonts({
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#EAF6EF', '#FFFFFF']}
        style={StyleSheet.absoluteFillObject}
      />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Heart Logo */}
        <View style={styles.logoWrapper}>
          <HeartLogo width={70} gradientColors={['#7BBF8E', '#3F8A5C']} />
        </View>

        {/* Title */}
        <Text style={styles.brandTitle}>
          Medi<Text style={styles.brandCarePlus}>Care+</Text>
        </Text>

        {/* Tagline */}
        <Text style={styles.tagline}>
          Take Today{'\n'}For a Healthier Tomorrow
        </Text>

        {/* Hero Image with Soft Bottom Gradient Mask */}
        <View style={styles.imageContainer}>
          <Image
            source={require('../../assets/main.png')}
            style={styles.heroImage}
            resizeMode="contain"
          />
          <LinearGradient
            colors={['rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 0.85)', '#FFFFFF']}
            style={styles.imageGradientMask}
            pointerEvents="none"
          />
        </View>

        {/* Bottom Text */}
        <Text style={styles.bottomText}>Better care  Brighter days</Text>

        {/* Buttons Section */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.getStartedBtn}
            onPress={() => navigation?.navigate('Landing')}
            activeOpacity={0.8}
          >
            <Text style={styles.getStartedBtnText}>Get Started</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.alreadyAccountBtn}
            onPress={() => navigation?.navigate('Login')}
            activeOpacity={0.8}
          >
            <Text style={styles.alreadyAccountText}>I already have an account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingTop: 70,
    paddingBottom: 28,
  },
  logoWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 38,
    color: '#1F2A44',
    marginTop: 8,
    letterSpacing: -0.5,
  },
  brandCarePlus: {
    color: '#5E9470',
  },
  tagline: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 19,
    color: '#6A9A78',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 28,
  },
  imageContainer: {
    width: 320,
    height: 250,
    marginTop: 40,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  imageGradientMask: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
  },
  bottomText: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 19,
    color: '#1F2A44',
    textAlign: 'center',
    marginTop: 24,
  },
  buttonContainer: {
    width: '100%',
    paddingHorizontal: 28,
    alignItems: 'center',
    marginTop: 16,
  },
  getStartedBtn: {
    width: '100%',
    height: 55,
    backgroundColor: '#527A62',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#527A62',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  getStartedBtnText: {
    fontFamily: 'Nunito_600SemiBold',
    color: '#FFFFFF',
    fontSize: 19,
  },
  alreadyAccountBtn: {
    marginTop: 16,
    paddingVertical: 8,
    alignItems: 'center',
  },
  alreadyAccountText: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 15,
    color: '#1F2A44',
  },
});
