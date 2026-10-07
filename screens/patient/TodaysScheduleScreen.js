import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import FiveTabBottomBar from '../../components/FiveTabBottomBar';
import Header from '../../components/Header';
import OfflineBanner from '../../components/OfflineBanner';
import BottomSheetConfirmation from '../../components/BottomSheetConfirmation';
import dbService from '../../services/db';
import { getFirebaseServices } from '../../firebase/firebaseConfig';
import Text from '../../components/PatientText';
import { useT } from '../../i18n/LanguageContext';
import { fontSize } from '../../theme/typography';

export default function TodaysScheduleScreen({
  navigation,
  onNavigateTab,
  userPreferences = {},
  currentUser,
  isOffline = false,
  onRetryOffline,
}) {
  const language = userPreferences.language || 'en';
  const t = useT();
  const patientId = currentUser?.id || 'usr-patient-1';
  const userRole = currentUser?.role || 'patient';
  const { firestore } = getFirebaseServices();

  const [doses, setDoses] = useState([]);
  const [skipTarget, setSkipTarget] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekOffset, setWeekOffset] = useState(0);
  const [skipConfirmingId, setSkipConfirmingId] = useState(null);

  // Helper to format date as YYYY-MM-DD
  const formatDateKey = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Helper to check if date is today
  const isToday = (date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  // Helper to check if date is in the past
  const isPast = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate < today;
  };

  // Helper to check if date is in the future
  const isFuture = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate > today;
  };

  // Get week days for the week containing selectedDate
  const getWeekDays = (date) => {
    const week = [];
    const startOfWeek = new Date(date);
    const dayOfWeek = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      week.push(day);
    }
    return week;
  };

  // Get day name from i18n keys
  const getDayName = (date) => {
    const dayIndex = date.getDay();
    const dayKeys = ['weekSun', 'weekMon', 'weekTue', 'weekWed', 'weekThu', 'weekFri', 'weekSat'];
    return t(dayKeys[dayIndex]);
  };

  // Helper to parse time string like "8:00 AM" to minutes from midnight
  const parseTimeToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const match = String(timeStr).trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
    if (!match) return 0;
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const period = match[3] ? match[3].toUpperCase() : null;

    if (period === 'PM' && hours < 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes;
  };

  // Build unique schedule list per medicine and reminder time
  const buildScheduleList = (logs, selectedDateKey) => {
    const medicines = dbService.getMedicines(patientId);
    const scheduleList = [];
    const seenKeys = new Set();

    medicines.forEach((med) => {
      const times = dbService.getReminderTimes(med.id);
      const timeStrs = times.length > 0 ? times.map((t) => t.timeStr) : ['9:00 AM'];

      timeStrs.forEach((timeStr) => {
        const itemKey = `${med.id}_${timeStr}`;
        if (seenKeys.has(itemKey)) return;
        seenKeys.add(itemKey);

        const log = logs.find(
          (l) =>
            l.medicineId === med.id &&
            (l.date === selectedDateKey || l.date === 'Today') &&
            (l.time === timeStr || l.timeStr === timeStr)
        ) || logs.find(
          (l) =>
            l.medicineId === med.id &&
            (l.date === selectedDateKey || l.date === 'Today')
        );

        scheduleList.push({
          id: itemKey,
          medicineId: med.id,
          logId: log ? (log.id || log.firestoreId) : null,
          name: med.name,
          dose: med.dose,
          meal: med.mealInstruction,
          time: timeStr,
          status: log ? log.status : 'Pending',
        });
      });
    });

    return scheduleList;
  };

  // Load doses from Firestore for selected date
  useEffect(() => {
    const selectedDateKey = formatDateKey(selectedDate);

    const initSchedule = async () => {
      await dbService.ensureDailyDoseLogs(patientId, userRole, selectedDateKey);

      if (!firestore || isOffline) {
        const logs = dbService.getDoseLogs(patientId);
        const scheduleList = buildScheduleList(logs, selectedDateKey);
        setDoses(scheduleList);
      }
    };

    initSchedule();

    if (!firestore || isOffline) return;

    const q = query(
      collection(firestore, 'dose_logs'),
      where('patientId', '==', patientId),
      where('date', '==', selectedDateKey)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const logs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        const scheduleList = buildScheduleList(logs, selectedDateKey);
        setDoses(scheduleList);
      },
      (error) => {
        console.error('Firestore query error:', error);
        const logs = dbService.getDoseLogs(patientId);
        const scheduleList = buildScheduleList(logs, selectedDateKey);
        setDoses(scheduleList);
      }
    );

    return () => unsubscribe();
  }, [patientId, selectedDate, firestore, isOffline]);

  const handleMarkTaken = async (doseItem) => {
    const selectedDateKey = formatDateKey(selectedDate);

    // Optimistically update React state immediately
    setDoses((prevDoses) =>
      prevDoses.map((d) => (d.id === doseItem.id ? { ...d, status: 'Taken' } : d))
    );

    try {
      if (doseItem.logId) {
        await dbService.updateDoseLog(doseItem.logId, 'Taken');
      } else {
        const newLog = await dbService.addDoseLog({
          patientId,
          medicineId: doseItem.medicineId || doseItem.id,
          medicineName: doseItem.name,
          dose: doseItem.dose,
          time: doseItem.time,
          date: selectedDateKey,
          status: 'Taken',
        });
        if (newLog?.id) {
          setDoses((prevDoses) =>
            prevDoses.map((d) =>
              d.id === doseItem.id ? { ...d, logId: newLog.id } : d
            )
          );
        }
      }
    } catch (error) {
      console.error('Error marking dose taken:', error);
      setDoses((prevDoses) =>
        prevDoses.map((d) => (d.id === doseItem.id ? { ...d, status: doseItem.status } : d))
      );
    }
  };

  const handleConfirmSkip = async () => {
    if (!skipTarget) return;
    const doseItem = skipTarget;
    setSkipTarget(null);
    const selectedDateKey = formatDateKey(selectedDate);

    // Optimistically update React state immediately
    setDoses((prevDoses) =>
      prevDoses.map((d) => (d.id === doseItem.id ? { ...d, status: 'Skipped' } : d))
    );

    try {
      if (doseItem.logId) {
        await dbService.updateDoseLog(doseItem.logId, 'Skipped');
      } else {
        const newLog = await dbService.addDoseLog({
          patientId,
          medicineId: doseItem.medicineId || doseItem.id,
          medicineName: doseItem.name,
          dose: doseItem.dose,
          time: doseItem.time,
          date: selectedDateKey,
          status: 'Skipped',
        });
        if (newLog?.id) {
          setDoses((prevDoses) =>
            prevDoses.map((d) =>
              d.id === doseItem.id ? { ...d, logId: newLog.id } : d
            )
          );
        }
      }
    } catch (error) {
      console.error('Error marking dose skipped:', error);
      setDoses((prevDoses) =>
        prevDoses.map((d) => (d.id === doseItem.id ? { ...d, status: doseItem.status } : d))
      );
    }
  };

  // Group doses by time
  const timeGroups = {};
  doses.forEach((item) => {
    if (!timeGroups[item.time]) {
      timeGroups[item.time] = [];
    }
    timeGroups[item.time].push(item);
  });

  // Sort time groups chronologically
  const sortedTimeKeys = Object.keys(timeGroups).sort(
    (a, b) => parseTimeToMinutes(a) - parseTimeToMinutes(b)
  );

  const handleCompleteAll = async (timeStr) => {
    const groupItems = timeGroups[timeStr] || [];
    const pendingItems = groupItems.filter((it) => it.status !== 'Taken');
    if (pendingItems.length === 0) return;

    setDoses((prevDoses) =>
      prevDoses.map((d) =>
        d.time === timeStr && d.status !== 'Taken' ? { ...d, status: 'Taken' } : d
      )
    );

    for (const item of pendingItems) {
      await handleMarkTaken(item);
    }
  };

  const handleWeekNav = (direction) => {
    const newOffset = weekOffset + direction;
    setWeekOffset(newOffset);
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + (direction * 7));
    setSelectedDate(newDate);
  };

  const handleSelectDate = (date) => {
    setSelectedDate(date);
  };

  // Calculate progress for selected date
  const takenCount = doses.filter(d => d.status === 'Taken').length;
  const totalCount = doses.length;
  const progressPercent = totalCount > 0 ? (takenCount / totalCount) * 100 : 0;

  // Get week days for display
  const weekDays = getWeekDays(selectedDate);

  // Determine day type for dose status logic
  const selectedIsPast = isPast(selectedDate);
  const selectedIsToday = isToday(selectedDate);
  const selectedIsFuture = isFuture(selectedDate);

  return (
    <View style={styles.container}>
      <Header
        showLogo
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
        {isOffline ? <OfflineBanner onRetry={onRetryOffline} /> : null}

        <View style={styles.topHeaderGroup}>
          <Text style={[styles.greetingText, { fontSize: fontSize(22, userPreferences.largeText) }]}>{t('greeting')}</Text>
          <Text style={[styles.subtitleText, { fontSize: fontSize(14, userPreferences.largeText) }]}>{t('scheduleSubtitle')}</Text>
        </View>

        {/* Weekly Day Selector with Navigation */}
        <View style={styles.weekNavContainer}>
          <TouchableOpacity 
            onPress={() => handleWeekNav(-1)} 
            style={styles.weekNavBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.weekNavText}>‹</Text>
          </TouchableOpacity>
          
          <View style={styles.daysRow}>
            {weekDays.map((date, i) => {
              const dayName = getDayName(date);
              const isSelected = formatDateKey(date) === formatDateKey(selectedDate);
              return (
                <TouchableOpacity
                  key={formatDateKey(date)}
                  onPress={() => handleSelectDate(date)}
                  style={[styles.dayChip, isSelected && styles.selectedDayChip]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={`${dayName} ${date.getDate()}`}
                  minAccessibleHeight={48}
                >
                  <Text style={[styles.dayText, isSelected && styles.selectedDayText]}>
                    {dayName}
                  </Text>
                  <Text style={[styles.dateNumText, isSelected && styles.selectedDayText]}>
                    {date.getDate()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity 
            onPress={() => handleWeekNav(1)} 
            style={styles.weekNavBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.weekNavText}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Progress Card */}
        <View style={styles.progressCard}>
          <View style={styles.progressRow}>
            <View>
              <Text style={styles.progressTodayText}>
                {selectedIsToday ? t('todaysSchedule') : selectedDate.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
              </Text>
              <Text style={styles.progressDateText}>
                {selectedIsToday ? t('dateStr') : ''}
              </Text>
            </View>
            <View style={styles.takenBadge}>
              <Text style={styles.takenBadgeText}>{t('takenProgress', { taken: takenCount, total: totalCount })}</Text>
            </View>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
          </View>
        </View>

        {/* Grouped Dose Sections */}
        {sortedTimeKeys.map((timeStr) => {
          const groupItems = timeGroups[timeStr];
          const hasPending = groupItems.some((it) => it.status !== 'Taken');

          return (
            <View key={timeStr} style={styles.timeGroupSection}>
              {/* Group Header Row */}
              <View style={styles.groupHeaderRow}>
                <Text style={styles.groupTimeText}>{timeStr}</Text>
                {hasPending && (
                  <TouchableOpacity
                    onPress={() => handleCompleteAll(timeStr)}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  >
                    <Text style={styles.completeAllText}>{t('completeAll')}</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Compact Dose Cards */}
              {groupItems.map((item) => {
                const isTaken = item.status === 'Taken';
                const isSkipped = item.status === 'Skipped';
                const isMissed = item.status === 'Missed' || (item.status === 'Pending' && selectedIsPast);
                const isUpcoming = item.status === 'Pending' && selectedIsFuture;

                // Determine if buttons should be shown
                const showButtons = selectedIsToday && !isTaken && !isSkipped && !isMissed;
                const isReadOnly = selectedIsPast || selectedIsFuture;

                return (
                  <View
                    key={item.id}
                    style={[
                      styles.doseRowCard,
                      isTaken && styles.takenDoseRowCard,
                      isMissed && styles.missedDoseRowCard,
                    ]}
                  >
                    {/* Left: Pill Icon */}
                    <View style={styles.pillIconWrapper}>
                      <View style={styles.pillDarkCircle} />
                      <View style={styles.pillLightCircle} />
                    </View>

                    {/* Middle: Medicine Name & Details */}
                    <View style={styles.medInfoCol}>
                      <Text style={styles.medNameText}>{item.name}</Text>
                      <Text style={styles.medSubText}>
                        {item.dose} · {item.meal}
                      </Text>
                    </View>

                    {/* Right: Horizontal Action Buttons */}
                    <View style={styles.rightButtonsRow}>
                      {isUpcoming ? (
                        <View style={styles.upcomingPill}>
                          <Text style={styles.upcomingPillText}>{t('upcoming')}</Text>
                        </View>
                      ) : isMissed ? (
                        <View style={styles.missedPill}>
                          <Text style={styles.missedPillText}>{t('missed')}</Text>
                        </View>
                      ) : isSkipped ? (
                        <View style={styles.skippedPill}>
                          <Text style={styles.skippedPillText}>{t('skipped')}</Text>
                        </View>
                      ) : showButtons ? (
                        <>
                          <TouchableOpacity
                            style={[
                              styles.actionPillBtn,
                              styles.takeNowPillBtn,
                            ]}
                            onPress={() => handleMarkTaken(item)}
                          >
                            <Text style={styles.actionPillText}>
                              {t('takeNow')}
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[
                              styles.skipOutlineBtn,
                            ]}
                            onPress={() => setSkipTarget(item)}
                          >
                            <Text style={styles.skipOutlineText}>{t('skip')}</Text>
                          </TouchableOpacity>
                        </>
                      ) : (
                        <View style={styles.takenPill}>
                          <Text style={styles.takenPillText}>{t('taken')}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          );
        })}
      </ScrollView>

      <BottomSheetConfirmation
        visible={Boolean(skipTarget)}
        title={t('skipThisDose')}
        message={t('skipConfirm')}
        confirmLabel={t('skipDose')}
        cancelLabel={t('cancel')}
        onConfirm={handleConfirmSkip}
        onCancel={() => setSkipTarget(null)}
      />

      <FiveTabBottomBar
        activeTab="schedule"
        onSelectTab={(tabKey) => onNavigateTab && onNavigateTab(tabKey)}
        language={language}
        isLargeText={userPreferences.largeText}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  bellBtn: {
    padding: 6,
  },
  bellIcon: {
    fontSize: 22,
  },
  topHeaderGroup: {
    marginTop: 8,
    marginBottom: 14,
  },
  greetingText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  subtitleText: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flex: 1,
  },
  weekNavContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  weekNavBtn: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    minWidth: 40,
    alignItems: 'center',
  },
  weekNavText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0D8F7A',
  },
  dayChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  selectedDayChip: {
    backgroundColor: '#0B7666',
    borderColor: '#0B7666',
  },
  dayText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  dateNumText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 2,
  },
  selectedDayText: {
    color: '#FFFFFF',
  },
  progressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressTodayText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  progressDateText: {
    fontSize: 14,
    color: '#64748B',
  },
  takenBadge: {
    backgroundColor: '#E6F4F1',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  takenBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0D8F7A',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#0B7666',
  },
  timeGroupSection: {
    marginBottom: 16,
  },
  groupHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  groupTimeText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  completeAllText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0D8F7A',
  },
  doseRowCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    padding: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 64,
  },
  takenDoseRowCard: {
    backgroundColor: '#EAF5F2',
    borderColor: '#0D8F7A',
  },
  missedDoseRowCard: {
    backgroundColor: '#FEF2F2',
    borderColor: '#EF4444',
  },
  pillIconWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    width: 28,
    height: 28,
  },
  pillDarkCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#0D8F7A',
    marginRight: -4,
    zIndex: 2,
  },
  pillLightCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#A7F3D0',
    zIndex: 1,
  },
  medInfoCol: {
    flex: 1,
    marginRight: 8,
  },
  medNameText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  medSubText: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
  },
  rightButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionPillBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  takenPillBtn: {
    backgroundColor: '#0B7666',
  },
  takeNowPillBtn: {
    backgroundColor: '#0B7666',
  },
  actionPillText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  skipOutlineBtn: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 14,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skipConfirmBtn: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  skipOutlineText: {
    color: '#64748B',
    fontWeight: '600',
    fontSize: 14,
  },
  skipConfirmText: {
    color: '#EF4444',
    fontWeight: '700',
  },
  upcomingPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    minHeight: 48,
    justifyContent: 'center',
  },
  upcomingPillText: {
    color: '#64748B',
    fontWeight: '700',
    fontSize: 14,
  },
  missedPill: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    minHeight: 48,
    justifyContent: 'center',
  },
  missedPillText: {
    color: '#EF4444',
    fontWeight: '700',
    fontSize: 14,
  },
  skippedPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    minHeight: 48,
    justifyContent: 'center',
  },
  skippedPillText: {
    color: '#64748B',
    fontWeight: '700',
    fontSize: 14,
  },
  takenPill: {
    backgroundColor: '#0B7666',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    minHeight: 48,
    justifyContent: 'center',
  },
  takenPillText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
