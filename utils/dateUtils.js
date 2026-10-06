export function formatDate(date) {
  const d = date ? new Date(date) : new Date();
  return d.toLocaleDateString();
}

export function formatDateKey(date = new Date()) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatHeaderDate(date = new Date()) {
  const d = new Date(date);
  const options = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' };
  return d.toLocaleDateString('en-US', options);
}

export function formatDisplayDate(date = new Date()) {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function computeAdherenceStats(doseLogs = [], medicines = [], daysCount = 7) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let totalTaken = 0;
  let totalScheduled = 0;
  const dailyStats = [];
  const missedCounts = {};

  for (let i = daysCount - 1; i >= 0; i--) {
    const dayDate = new Date(today);
    dayDate.setDate(today.getDate() - i);
    const dateKey = formatDateKey(dayDate);
    const dayName = dayDate.toLocaleDateString('en-US', { weekday: 'short' });

    const dayLogs = doseLogs.filter((log) => log.date === dateKey || formatDateKey(new Date(log.timestamp || Date.now())) === dateKey);
    const takenInDay = dayLogs.filter((log) => String(log.status).toLowerCase() === 'taken').length;
    const missedInDay = dayLogs.filter((log) => ['missed', 'skipped'].includes(String(log.status).toLowerCase())).length;
    
    // Total expected for the day is either total logged items or number of active medicines
    const expectedInDay = Math.max(dayLogs.length, medicines.length || 1);
    const dayAdherence = expectedInDay > 0 ? Math.round((takenInDay / expectedInDay) * 100) : 0;

    totalTaken += takenInDay;
    totalScheduled += expectedInDay;

    dailyStats.push({
      dayName,
      dateKey,
      dateNum: dayDate.getDate(),
      percentage: dayAdherence,
      taken: takenInDay,
      total: expectedInDay,
    });

    dayLogs.forEach((log) => {
      if (['missed', 'skipped'].includes(String(log.status).toLowerCase())) {
        const medName = log.medicineName || medicines.find(m => m.id === log.medicineId)?.name || 'Medication';
        missedCounts[medName] = (missedCounts[medName] || 0) + 1;
      }
    });
  }

  const overallAdherence = totalScheduled > 0 ? Math.round((totalTaken / totalScheduled) * 100) : 0;
  
  let mostMissedMed = null;
  let maxMissedCount = 0;
  Object.entries(missedCounts).forEach(([name, count]) => {
    if (count > maxMissedCount) {
      maxMissedCount = count;
      mostMissedMed = name;
    }
  });

  return {
    adherencePercent: overallAdherence,
    totalTaken,
    totalScheduled,
    dailyStats,
    mostMissedMedName: mostMissedMed || (medicines[0]?.name ? `${medicines[0].name}` : 'None'),
    mostMissedCount: maxMissedCount,
  };
}
