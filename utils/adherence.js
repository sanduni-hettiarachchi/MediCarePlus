import dbService from '../services/db';

export function calculateAdherence(doseLogs, days = 7) {
  if (!doseLogs || doseLogs.length === 0) {
    return { adherence: 0, taken: 0, total: 0, message: 'No data' };
  }

  const cutoffDate = Date.now() - (days * 24 * 60 * 60 * 1000);
  const relevantLogs = doseLogs.filter(log => 
    (log.timestamp || Date.parse(log.timestamp)) > cutoffDate
  );

  if (relevantLogs.length === 0) {
    return { adherence: 0, taken: 0, total: 0, message: 'No data' };
  }

  const taken = relevantLogs.filter(log => log.status === 'Taken').length;
  const total = relevantLogs.length;
  const adherence = total > 0 ? Math.round((taken / total) * 100) : 0;

  return { adherence, taken, total, message: `${adherence}%` };
}

export function getAdherenceByDay(doseLogs, days = 7) {
  const result = [];
  const now = Date.now();

  for (let i = days - 1; i >= 0; i--) {
    const dayStart = now - (i * 24 * 60 * 60 * 1000);
    const dayEnd = dayStart + (24 * 60 * 60 * 1000);
    
    const dayLogs = doseLogs.filter(log => {
      const logTime = log.timestamp || Date.parse(log.timestamp);
      return logTime >= dayStart && logTime < dayEnd;
    });

    const taken = dayLogs.filter(log => log.status === 'Taken').length;
    const total = dayLogs.length;
    const date = new Date(dayStart);
    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    result.push({
      date: dateStr,
      taken,
      total,
      adherence: total > 0 ? Math.round((taken / total) * 100) : 0,
    });
  }

  return result;
}

export function getMissedDoses(doseLogs, days = 7) {
  const cutoffDate = Date.now() - (days * 24 * 60 * 60 * 1000);
  return doseLogs.filter(log => {
    const logTime = log.timestamp || Date.parse(log.timestamp);
    return logTime > cutoffDate && log.status === 'Missed';
  });
}

export function getUpcomingDoses(doseLogs) {
  const now = Date.now();
  return doseLogs.filter(log => {
    const logTime = log.timestamp || Date.parse(log.timestamp);
    return logTime > now && log.status === 'Upcoming';
  }).sort((a, b) => (a.timestamp || Date.parse(a.timestamp)) - (b.timestamp || Date.parse(b.timestamp)));
}
