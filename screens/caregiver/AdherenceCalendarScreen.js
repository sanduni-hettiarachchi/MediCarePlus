import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Header from '../../components/Header';
import dbService from '../../services/db';
import { formatDateKey } from '../../utils/dateUtils';

const weekdays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function AdherenceCalendarScreen({ navigation, currentUser, route }) {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [referenceDate, setReferenceDate] = useState(new Date());
  const [doseLogs, setDoseLogs] = useState([]);
  const [patientId, setPatientId] = useState(null);

  useEffect(() => {
    if (route?.params?.patientId) {
      setPatientId(route.params.patientId);
    } else {
      const links = dbService.getCareLinksForMember(currentUser?.id);
      const activeLink = links.find(l => l.status === 'Active');
      if (activeLink) {
        setPatientId(activeLink.patientId);
      }
    }
  }, [route?.params?.patientId, currentUser?.id]);

  useEffect(() => {
    const unsubscribe = dbService.subscribeToDoseLogs(patientId, (logs) => {
      setDoseLogs(logs || []);
    });
    return () => unsubscribe();
  }, [patientId]);

  // Helper to get days in month
  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();

  // Helper to get day of week for first day of month
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  // Determine status for a specific date
  const getStatusForDate = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);

    const dateKey = formatDateKey(checkDate);
    const logsForDate = doseLogs.filter(
      (l) => l.date === dateKey || formatDateKey(new Date(l.timestamp || Date.now())) === dateKey
    );

    if (logsForDate.length > 0) {
      const hasTaken = logsForDate.some((l) => String(l.status).toLowerCase() === 'taken');
      const hasMissed = logsForDate.some((l) => ['missed', 'skipped'].includes(String(l.status).toLowerCase()));
      if (hasTaken && !hasMissed) return 'taken';
      if (hasMissed) return 'missed';
    }

    if (checkDate < today) {
      return 'missed';
    }
    return 'upcoming';
  };

  // Generate month calendar data
  const generateMonthData = (year, month) => {
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const days = [];
    
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      const status = getStatusForDate(date);
      days.push({ dayNum: i, status, date });
    }
    
    const cells = Array(firstDay).fill(null).concat(days);
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  };

  // Generate week data (7 days)
  const generateWeekData = (date) => {
    const startOfWeek = new Date(date);
    const dayOfWeek = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      const status = getStatusForDate(day);
      days.push({ dayNum: day.getDate(), status, date: day });
    }
    return days;
  };

  // Generate 3 months data
  const generateThreeMonthsData = (date) => {
    const months = [];
    for (let i = 2; i >= 0; i--) {
      const monthDate = new Date(date.getFullYear(), date.getMonth() - i, 1);
      months.push({
        year: monthDate.getFullYear(),
        month: monthDate.getMonth(),
        name: monthNames[monthDate.getMonth()],
        cells: generateMonthData(monthDate.getFullYear(), monthDate.getMonth())
      });
    }
    return months;
  };

  // Navigation handlers
  const handlePrev = () => {
    const newDate = new Date(referenceDate);
    if (selectedPeriod === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else if (selectedPeriod === 'month') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() - 3);
    }
    setReferenceDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(referenceDate);
    if (selectedPeriod === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else if (selectedPeriod === 'month') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 3);
    }
    setReferenceDate(newDate);
  };

  // Get header subtitle based on period
  const getHeaderSubtitle = () => {
    if (selectedPeriod === 'week') {
      const weekStart = new Date(referenceDate);
      const dayOfWeek = weekStart.getDay();
      const diff = weekStart.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      weekStart.setDate(diff);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      return `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} adherence history`;
    } else if (selectedPeriod === 'month') {
      return `${monthNames[referenceDate.getMonth()]} ${referenceDate.getFullYear()} adherence history`;
    } else {
      const startMonth = new Date(referenceDate.getFullYear(), referenceDate.getMonth() - 2, 1);
      const endMonth = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);
      return `${monthNames[startMonth.getMonth()]} - ${monthNames[endMonth.getMonth()]} ${referenceDate.getFullYear()} adherence history`;
    }
  };

  // Render day cell
  const renderDayCell = (day, isToday = false, index) => {
    if (!day) return <View key={`empty-${index}`} style={styles.dayBox} />;
    const statusStyle = day.status === 'taken' ? styles.takenCell : day.status === 'missed' ? styles.missedCell : styles.upcomingCell;
    const numberStyle = day.status === 'upcoming' ? styles.upcomingNumber : styles.completedNumber;
    return (
      <View key={`${day.dayNum}-${index}`} style={[styles.dayBox, statusStyle, isToday && styles.todayCell]}>
        <Text style={[styles.dayNumText, numberStyle]}>{day.dayNum}</Text>
        {day.status !== 'upcoming' ? <Text style={styles.statusSymbol}>{day.status === 'taken' ? '✓' : '×'}</Text> : null}
      </View>
    );
  };

  // Render content based on selected period
  const renderContent = () => {
    const today = new Date();
    
    if (selectedPeriod === 'week') {
      const weekDays = generateWeekData(referenceDate);
      return (
        <View style={styles.calendarCard}>
          <View style={styles.periodTabs}>
            <TouchableOpacity onPress={() => setSelectedPeriod('week')} style={[styles.periodTab, selectedPeriod === 'week' && styles.selectedPeriodTab]}>
              <Text style={[styles.periodTabText, selectedPeriod === 'week' && styles.selectedPeriodTabText]}>Week</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setSelectedPeriod('month')} style={[styles.periodTab, selectedPeriod === 'month' && styles.selectedPeriodTab]}>
              <Text style={[styles.periodTabText, selectedPeriod === 'month' && styles.selectedPeriodTabText]}>Month</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setSelectedPeriod('threeMonths')} style={[styles.periodTab, selectedPeriod === 'threeMonths' && styles.selectedPeriodTab]}>
              <Text style={[styles.periodTabText, selectedPeriod === 'threeMonths' && styles.selectedPeriodTabText]}>3 Months</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.weekdaysRow}>
            {weekdays.map((day, index) => <Text key={`${day}-${index}`} style={styles.weekdayText}>{day}</Text>)}
          </View>
          <View style={styles.weekRow}>
            {weekDays.map((day, index) => {
              const isToday = day.date.toDateString() === today.toDateString();
              return renderDayCell(day, isToday, index);
            })}
          </View>
        </View>
      );
    } else if (selectedPeriod === 'month') {
      const cells = generateMonthData(referenceDate.getFullYear(), referenceDate.getMonth());
      const weeks = Array.from({ length: cells.length / 7 }, (_, index) => cells.slice(index * 7, index * 7 + 7));
      return (
        <View style={styles.calendarCard}>
          <View style={styles.periodTabs}>
            <TouchableOpacity onPress={() => setSelectedPeriod('week')} style={[styles.periodTab, selectedPeriod === 'week' && styles.selectedPeriodTab]}>
              <Text style={[styles.periodTabText, selectedPeriod === 'week' && styles.selectedPeriodTabText]}>Week</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setSelectedPeriod('month')} style={[styles.periodTab, selectedPeriod === 'month' && styles.selectedPeriodTab]}>
              <Text style={[styles.periodTabText, selectedPeriod === 'month' && styles.selectedPeriodTabText]}>Month</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setSelectedPeriod('threeMonths')} style={[styles.periodTab, selectedPeriod === 'threeMonths' && styles.selectedPeriodTab]}>
              <Text style={[styles.periodTabText, selectedPeriod === 'threeMonths' && styles.selectedPeriodTabText]}>3 Months</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.monthTitle}>{monthNames[referenceDate.getMonth()]} {referenceDate.getFullYear()}</Text>
          <View style={styles.weekdaysRow}>
            {weekdays.map((day, index) => <Text key={`${day}-${index}`} style={styles.weekdayText}>{day}</Text>)}
          </View>
          <View style={styles.weeksGrid}>
            {weeks.map((week, weekIndex) => (
              <View key={`week-${weekIndex}`} style={styles.weekRow}>
                {week.map((day, cellIndex) => {
                  const isToday = day && day.date && day.date.toDateString() === today.toDateString();
                  return renderDayCell(day, isToday, cellIndex);
                })}
              </View>
            ))}
          </View>
        </View>
      );
    } else {
      const threeMonths = generateThreeMonthsData(referenceDate);
      return (
        <View style={styles.calendarCard}>
          <View style={styles.periodTabs}>
            <TouchableOpacity onPress={() => setSelectedPeriod('week')} style={[styles.periodTab, selectedPeriod === 'week' && styles.selectedPeriodTab]}>
              <Text style={[styles.periodTabText, selectedPeriod === 'week' && styles.selectedPeriodTabText]}>Week</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setSelectedPeriod('month')} style={[styles.periodTab, selectedPeriod === 'month' && styles.selectedPeriodTab]}>
              <Text style={[styles.periodTabText, selectedPeriod === 'month' && styles.selectedPeriodTabText]}>Month</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setSelectedPeriod('threeMonths')} style={[styles.periodTab, selectedPeriod === 'threeMonths' && styles.selectedPeriodTab]}>
              <Text style={[styles.periodTabText, selectedPeriod === 'threeMonths' && styles.selectedPeriodTabText]}>3 Months</Text>
            </TouchableOpacity>
          </View>
          {threeMonths.map((monthData, idx) => {
            const weeks = Array.from({ length: monthData.cells.length / 7 }, (_, index) => monthData.cells.slice(index * 7, index * 7 + 7));
            return (
              <View key={`month-${idx}`} style={styles.threeMonthSection}>
                <Text style={styles.monthTitle}>{monthData.name} {monthData.year}</Text>
                <View style={styles.weekdaysRow}>
                  {weekdays.map((day, index) => <Text key={`${day}-${index}`} style={styles.weekdayText}>{day}</Text>)}
                </View>
                <View style={styles.weeksGrid}>
                  {weeks.map((week, weekIndex) => (
                    <View key={`week-${weekIndex}`} style={styles.weekRow}>
                      {week.map((day, cellIndex) => {
                        const isToday = day && day.date && day.date.toDateString() === today.toDateString();
                        return renderDayCell(day, isToday, cellIndex);
                      })}
                    </View>
                  ))}
                </View>
              </View>
            );
          })}
        </View>
      );
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Adherence Calendar" subtitle={getHeaderSubtitle()} onBack={() => navigation?.goBack()} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.legendCard}>
          <View style={styles.legendItem}><View style={[styles.swatch, styles.takenCell]} /><Text style={styles.legendText}>Taken</Text></View>
          <View style={styles.legendItem}><View style={[styles.swatch, styles.missedCell]} /><Text style={styles.legendText}>Missed</Text></View>
          <View style={styles.legendItem}><View style={[styles.swatch, styles.upcomingCell]} /><Text style={styles.legendText}>Upcoming</Text></View>
        </View>
        <View style={styles.navRow}>
          <TouchableOpacity onPress={handlePrev} style={styles.navBtn}>
            <Text style={styles.navText}>‹ Previous</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleNext} style={styles.navBtn}>
            <Text style={styles.navText}>Next ›</Text>
          </TouchableOpacity>
        </View>
        {renderContent()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  legendCard: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#F8FAFC', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#E2E8F0', marginTop: 8, marginBottom: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  swatch: { width: 16, height: 16, borderRadius: 4, marginRight: 6 },
  takenCell: { backgroundColor: '#3D7A66' },
  missedCell: { backgroundColor: '#C0392B' },
  upcomingCell: { backgroundColor: '#E5E7EB' },
  legendText: { fontSize: 13, fontWeight: '600', color: '#475569' },
  navRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  navBtn: { paddingHorizontal: 16, paddingVertical: 8 },
  navText: { fontSize: 14, fontWeight: '600', color: '#0D8F7A' },
  calendarCard: { backgroundColor: '#F8FAFC', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 16 },
  monthTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A', marginBottom: 10, textAlign: 'center' },
  periodTabs: { flexDirection: 'row', marginBottom: 12, borderRadius: 8, backgroundColor: '#E5E7EB', padding: 3 },
  periodTab: { flex: 1, paddingVertical: 7 },
  periodTabText: { textAlign: 'center', color: '#374151', fontSize: 12, fontWeight: '600' },
  selectedPeriodTab: { backgroundColor: '#FFFFFF', borderRadius: 6 },
  selectedPeriodTabText: { color: '#0F172A' },
  threeMonthSection: { marginBottom: 20 },
  weekdaysRow: { flexDirection: 'row', marginBottom: 6 },
  weekdayText: { flex: 1, color: '#6B7280', fontSize: 12, textAlign: 'center' },
  weeksGrid: { marginTop: 6 },
  weekRow: { flexDirection: 'row', marginTop: 6 },
  dayBox: { flex: 1, aspectRatio: 1, borderRadius: 14, borderWidth: 0, alignItems: 'center', justifyContent: 'center' },
  todayCell: { borderWidth: 2, borderColor: '#1F2A44' },
  dayNumText: { fontSize: 11, fontWeight: '700', marginBottom: 1 },
  completedNumber: { color: '#FFFFFF' },
  upcomingNumber: { color: '#374151' },
  statusSymbol: { fontSize: 10, lineHeight: 12, color: '#FFFFFF', fontWeight: '700' },
});
