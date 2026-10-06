import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import BottomSheetConfirmation from '../../components/BottomSheetConfirmation';
import Button from '../../components/Button';
import FiveTabBottomBar from '../../components/FiveTabBottomBar';
import Header from '../../components/Header';
import UndoSnackbar from '../../components/UndoSnackbar';
import dbService from '../../services/db';

export default function ManagePatientScheduleScreen({ navigation, onNavigateTab, hasAlertBadge = false }) {
  const [medicines, setMedicines] = useState([]);
  const [editingMed, setEditingMed] = useState(null);
  const [newTime, setNewTime] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [removedDose, setRemovedDose] = useState(null);
  const [snackbarMsg, setSnackbarMsg] = useState('');

  const loadData = () => {
    const list = dbService.getMedicines();
    const enriched = list.map((m) => {
      const times = dbService.getReminderTimes(m.id);
      return { ...m, timeStr: times[0] ? times[0].timeStr : '9:00 AM' };
    });
    setMedicines(enriched);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenEdit = (med) => {
    setEditingMed(med);
    setNewTime(med.timeStr);
  };

  const handleSaveTimeChange = () => {
    if (!editingMed || !newTime.trim()) return;
    dbService.updateMedicine(editingMed.id, {}, [newTime.trim()]);
    setEditingMed(null);
    loadData();
  };

  const handleConfirmRemove = () => {
    if (!deleteTarget) return;
    setRemovedDose(dbService.deleteMedicine(deleteTarget.id));
    setSnackbarMsg(`Removed ${deleteTarget.name}`);
    setDeleteTarget(null);
    loadData();
  };

  const handleUndoRemove = () => {
    if (!removedDose?.medicine) return;
    dbService.restoreMedicine(removedDose.medicine, removedDose.times);
    setRemovedDose(null);
    setSnackbarMsg('');
    loadData();
  };

  return (
    <View style={styles.container}>
      <Header
        title="Manage Schedule"
        subtitle="Remote dose configuration for Mrs. Perera"
        onBack={() => navigation?.goBack()}
        rightElement={
          <TouchableOpacity
            style={styles.bellBtn}
            onPress={() => navigation?.navigate('Notifications')}
          >
            <Text style={styles.bellIcon}>🔔</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionHeader}>SCHEDULED DOSES</Text>

        {medicines.map((item) => (
          <View key={item.id} style={styles.scheduleRow}>
            <View style={styles.infoCol}>
              <Text style={styles.medName}>{item.name}</Text>
              <Text style={styles.medDetail}>
                {item.dose} · {item.mealInstruction}
              </Text>
              <View style={styles.timeTag}>
                <Text style={styles.timeTagText}>🕒 {item.timeStr}</Text>
              </View>
            </View>

            <View style={styles.actionsCol}>
              <TouchableOpacity
                style={styles.editBtn}
                onPress={() => handleOpenEdit(item)}
              >
                <Text style={styles.editBtnText}>Edit time</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => setDeleteTarget(item)}
              >
                <Text style={styles.deleteBtnText}>Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {/* Edit Time Inline Drawer */}
        {editingMed && (
          <View style={styles.editDrawer}>
            <Text style={styles.drawerTitle}>Change time for {editingMed.name}</Text>
            <TextInput
              style={styles.timeInput}
              value={newTime}
              onChangeText={setNewTime}
              placeholder="e.g. 2:30 PM"
            />
            <View style={styles.drawerButtons}>
              <Button
                title="Save time"
                onPress={handleSaveTimeChange}
                style={styles.drawerSaveBtn}
              />
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => setEditingMed(null)}
                style={styles.drawerCancelBtn}
              />
            </View>
          </View>
        )}
      </ScrollView>

      {/* Remove Dose Confirmation */}
      <BottomSheetConfirmation
        visible={Boolean(deleteTarget)}
        title="Remove dose?"
        message={
          deleteTarget
            ? `Are you sure you want to remove ${deleteTarget.name} from schedule?`
            : ''
        }
        confirmLabel="Remove dose"
        cancelLabel="Cancel"
        onConfirm={handleConfirmRemove}
        onCancel={() => setDeleteTarget(null)}
      />

      <UndoSnackbar
        message={snackbarMsg}
        onUndo={handleUndoRemove}
        onDismiss={() => { setSnackbarMsg(''); setRemovedDose(null); }}
      />

      <FiveTabBottomBar
        activeTab="schedule"
        onSelectTab={(tabKey) => onNavigateTab && onNavigateTab(tabKey)}
        hasAlertBadge={hasAlertBadge}
        profileLabel="Profiles"
      />
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
    paddingBottom: 40,
  },
  bellBtn: {
    padding: 6,
  },
  bellIcon: {
    fontSize: 22,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
    marginTop: 8,
    marginBottom: 12,
  },
  scheduleRow: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  infoCol: {
    flex: 1,
    paddingRight: 10,
  },
  medName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  medDetail: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  timeTag: {
    backgroundColor: '#E6F4F1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  timeTagText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0D8F7A',
  },
  actionsCol: {
    alignItems: 'flex-end',
    gap: 8,
  },
  editBtn: {
    backgroundColor: '#0D8F7A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  editBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  deleteBtn: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  deleteBtnText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '700',
  },
  editDrawer: {
    backgroundColor: '#EAF5F2',
    borderRadius: 16,
    padding: 16,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#0D8F7A',
  },
  drawerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0D8F7A',
    marginBottom: 8,
  },
  timeInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    color: '#0F172A',
    marginBottom: 12,
  },
  drawerButtons: {
    gap: 8,
  },
  drawerSaveBtn: {
    marginBottom: 0,
  },
  drawerCancelBtn: {
    marginBottom: 0,
  },
});
