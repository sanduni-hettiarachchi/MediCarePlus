# MediCare+

MediCare+ is a patient-centred medication, health-record, adherence, and care-coordination mobile app built with JavaScript, React Native, Expo, and Firebase. The installed mobile app belongs primarily to the patient.

## Product scope

- Patient medication schedule with taken/pending adherence states
- Separate medication and health reminders
- Patient health profile with automatic BMI calculation
- Doctor patient summary with health history and adherence
- Handwritten prescription upload flow with manual verification
- Manual prescriptions tied to the doctor's verified registration number
- Immutable finalized prescriptions and doctor notes with version/addendum history
- Future health plans for tests, reviews, and follow-up appointments
- Patient-controlled QR sharing for doctor and pharmacist access
- Invited caregiver support from the patient-owned app
- External doctor/pharmacist portal workflows; clinicians do not need to install the patient app
- Doctor portal login with SLMC registration verification
- Doctor-only creation of prescriptions, doctor notes, and future health-plan items
- Consent, access history, and audit-log boundaries for sensitive records

## Run locally

1. Install Node.js and Expo tooling.
2. Run `npm install`.
3. Add Firebase values as `EXPO_PUBLIC_FIREBASE_*` environment variables.
4. Run `npm start` and open the app on an Android emulator, iOS simulator, or Expo Go.

For local doctor-portal testing on web, open `http://localhost:8081/doctor` (or the port shown by Expo). This is a separate portal entry point, not a patient-app installation role.

Firebase credentials must remain in environment configuration and must not be committed.

Copy `.env.example` to `.env`, fill in the Firebase project values, and deploy `firestore.rules` after reviewing them with your supervisor. The current UI services are intentionally small contracts; connect them to Firebase Authentication, Firestore, Storage, and Expo Camera/Image Picker before submitting a production-backed build.

## Implementation order

1. Authentication and patient medication CRUD.
2. Adherence history and reminders.
3. Health profile, measurements, BMI, and lab history.
4. Doctor prescription upload/manual entry and immutable versioning.
5. Doctor notes, patient summary, health plans, and care-team access.
6. Caregiver support, external clinician portals, pharmacist QR access, dispensing, refill, testing, and audit logs.

The current entry point contains a working patient dashboard vertical slice. The patient profile owns QR sharing and consent. The doctor portal requires a doctor account plus SLMC registration number and a patient-generated access token; it does not create patients. Doctor and pharmacist screens in the repository represent secure portal workflows, not additional patient-app installation roles. Service modules currently define the domain contracts; replace their placeholder persistence with Firebase Authentication, Firestore, Storage, and role-based security rules.
