import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Button from '../../../components/Button';

export default function ScanQRScreen() {
  const [requested, setRequested] = useState(false);
  return <View style={styles.screen}><Text style={styles.eyebrow}>PHARMACY WORKSPACE</Text><Text style={styles.title}>Scan patient QR</Text><Text style={styles.subtitle}>Request temporary access to an authorized prescription.</Text><TouchableOpacity style={styles.scanner} onPress={() => setRequested(true)}><Text style={styles.corner}>⌗</Text><Text style={styles.scanText}>{requested ? 'Access request sent' : 'Tap to scan QR code'}</Text></TouchableOpacity>{requested ? <View style={styles.pending}><Text style={styles.pendingTitle}>Waiting for consent</Text><Text style={styles.pendingText}>The patient must authorize prescription access before details are shown.</Text></View> : <Button title="Start scanner" onPress={() => setRequested(true)} />}</View>;
}

const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: '#F5F7F2', padding: 22 }, eyebrow: { color: '#1D8062', fontSize: 10, fontWeight: '800', letterSpacing: 1.2, marginTop: 12 }, title: { color: '#173C35', fontSize: 29, fontWeight: '900', marginTop: 7 }, subtitle: { color: '#6B7B72', lineHeight: 20, marginTop: 7, marginBottom: 20 }, scanner: { height: 280, borderRadius: 18, backgroundColor: '#173C35', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }, corner: { color: '#B7D8BF', fontSize: 70 }, scanText: { color: '#FFFFFF', fontWeight: '800', marginTop: 10 }, pending: { backgroundColor: '#E4F0E5', borderRadius: 14, padding: 16 }, pendingTitle: { color: '#1D8062', fontWeight: '900' }, pendingText: { color: '#527166', lineHeight: 18, marginTop: 5 } });
