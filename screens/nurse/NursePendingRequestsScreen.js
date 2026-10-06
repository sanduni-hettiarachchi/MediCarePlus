import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Button from '../../components/Button';
import Header from '../../components/Header';
import dbService from '../../services/db';

export default function NursePendingRequestsScreen({ navigation, currentUser }) {
  const [pendingLinks, setPendingLinks] = useState([]);

  useEffect(() => {
    const links = dbService.getCareLinksForMember(currentUser?.id);
    const pending = links.filter(l => l.status === 'Pending');
    setPendingLinks(pending);
  }, [currentUser?.id]);

  const handleAccept = async (link) => {
    await dbService.updateCareLink(link.id, { status: 'Active' });
    setPendingLinks((current) => current.filter((l) => l.id !== link.id));
  };

  const handleDecline = async (link) => {
    await dbService.removeCareLink(link.id);
    setPendingLinks((current) => current.filter((l) => l.id !== link.id));
  };

  return (
    <View style={styles.container}>
      <Header
        title="Pending Requests"
        subtitle="Accept or decline care requests"
        onBack={() => navigation?.goBack()}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {pendingLinks.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No pending requests</Text>
          </View>
        ) : (
          pendingLinks.map((link) => (
            <View key={link.id} style={styles.requestCard}>
              <View style={styles.requestHeader}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{(link.memberName || 'P').charAt(0)}</Text>
                </View>
                <View style={styles.requestInfo}>
                  <Text style={styles.patientName}>Patient invitation</Text>
                  <Text style={styles.invitedBy}>Invited by patient</Text>
                </View>
              </View>
              
              <View style={styles.permissionsPreview}>
                <Text style={styles.permissionsTitle}>Permissions:</Text>
                {link.permissions?.viewSchedule && <Text style={styles.permissionItem}>• View medication schedule</Text>}
                {link.permissions?.viewAdherence && <Text style={styles.permissionItem}>• View adherence history</Text>}
                {link.permissions?.receiveAlerts && <Text style={styles.permissionItem}>• Receive missed-dose alerts</Text>}
                {link.permissions?.addNotes && <Text style={styles.permissionItem}>• Add care notes</Text>}
                {link.permissions?.viewCareNotes && <Text style={styles.permissionItem}>• View care notes</Text>}
                {link.permissions?.contact && <Text style={styles.permissionItem}>• Contact patient</Text>}
              </View>

              <View style={styles.actionButtons}>
                <Button
                  title="Decline"
                  onPress={() => handleDecline(link)}
                  style={styles.declineBtn}
                  variant="outline"
                />
                <Button
                  title="Accept"
                  onPress={() => handleAccept(link)}
                  style={styles.acceptBtn}
                />
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#94A3B8',
  },
  requestCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  requestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#3B82F6',
  },
  requestInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  invitedBy: {
    fontSize: 13,
    color: '#64748B',
  },
  permissionsPreview: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  permissionsTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  permissionItem: {
    fontSize: 13,
    color: '#475569',
    marginBottom: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  declineBtn: {
    flex: 1,
  },
  acceptBtn: {
    flex: 1,
  },
});
