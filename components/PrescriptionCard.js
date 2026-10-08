import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Text from './PatientText';

export default function PrescriptionCard({ prescription, onViewImage, onDownload, onDelete }) {
  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View>
          <Text style={styles.doctorName}>{prescription.doctorName || 'Dr. K. Silva'}</Text>
          <Text style={styles.date}>{prescription.date || '18 Sep 2026'}</Text>
        </View>
        <View style={styles.topRowRight}>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{prescription.status || 'Active'}</Text>
          </View>
          {onDelete && (
            <TouchableOpacity style={styles.deleteBtn} onPress={() => onDelete(prescription)}>
              <Text style={styles.deleteBtnText}>🗑</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.imagePlaceholder}>
        <Text style={styles.placeholderIcon}>📜</Text>
        <Text style={styles.placeholderText}>
          {prescription.instructions || '1. Metformin 500mg (2x daily)\n2. Blood pressure tablet (1x morning)'}
        </Text>
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.btnOutline} onPress={onViewImage}>
          <Text style={styles.btnOutlineText}>View Full Image</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnPrimary} onPress={onDownload}>
          <Text style={styles.btnPrimaryText}>Download</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  topRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  date: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  statusBadge: {
    backgroundColor: '#E6F4F1',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0D8F7A',
  },
  imagePlaceholder: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  placeholderIcon: {
    fontSize: 22,
    marginRight: 10,
  },
  placeholderText: {
    fontSize: 13,
    color: '#334155',
    flex: 1,
    lineHeight: 18,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  btnOutline: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#0D8F7A',
    borderRadius: 20,
    paddingVertical: 10,
    alignItems: 'center',
  },
  btnOutlineText: {
    color: '#0D8F7A',
    fontSize: 13,
    fontWeight: '700',
  },
  btnPrimary: {
    flex: 1,
    backgroundColor: '#0D8F7A',
    borderRadius: 20,
    paddingVertical: 10,
    alignItems: 'center',
  },
  btnPrimaryText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  deleteBtn: {
    padding: 4,
  },
  deleteBtnText: {
    fontSize: 16,
  },
});
