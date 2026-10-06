// Backfill script to add medicineName, dose, and time to dose_logs
// Run this script once to update existing dose_logs with medicine information

const dbService = require('../services/db');

function backfillDoseLogNames() {
  console.log('Starting dose_logs backfill...');
  
  const doseLogs = dbService.localCache.dose_logs || [];
  const medicines = dbService.localCache.medicines || [];
  
  let updatedCount = 0;
  
  doseLogs.forEach((log) => {
    if (!log.medicineName && log.medicineId) {
      const medicine = medicines.find((m) => m.id === log.medicineId);
      if (medicine) {
        log.medicineName = medicine.name;
        log.dose = medicine.dose;
        log.time = log.time || 'Unknown';
        updatedCount++;
      }
    }
  });
  
  if (updatedCount > 0) {
    dbService.persistLocalCache();
    console.log(`Backfilled ${updatedCount} dose_logs with medicine names.`);
  } else {
    console.log('No dose_logs needed backfilling.');
  }
  
  return updatedCount;
}

// Run the backfill
if (require.main === module) {
  backfillDoseLogNames();
}

module.exports = backfillDoseLogNames;
