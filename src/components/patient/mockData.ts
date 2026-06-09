export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  location: string;
  nextAvailable: string;
  videoEnabled: boolean;
}

export interface Appointment {
  id: string;
  doctorName: string;
  specialty: string;
  date: string;
  time: string;
  videoEnabled: boolean;
}

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  instructions: string;
  taken: number;
  total: number;
}

export interface TrackerMetric {
  id: string;
  label: string;
  value: string;
  unit?: string;
}

export interface HealthCategory {
  id: string;
  label: string;
}

export const MOCK_DOCTORS: Doctor[] = [
  { id: '1', name: 'Dr. Anne Lopez', specialty: 'Dentist', location: 'Forest Hill, Queens', nextAvailable: '01/06/24', videoEnabled: true },
  { id: '2', name: 'Dr. Tamez Rebecca', specialty: 'Dermatology', location: 'Manhattan, NY', nextAvailable: '01/08/24', videoEnabled: true },
  { id: '3', name: 'Dr. James Chen', specialty: 'Cardiology', location: 'Brooklyn, NY', nextAvailable: '01/10/24', videoEnabled: false },
  { id: '4', name: 'Dr. Sarah Miller', specialty: 'Ophthalmology', location: 'Queens, NY', nextAvailable: '01/12/24', videoEnabled: true },
  { id: '5', name: 'Dr. Robert Kim', specialty: 'Dental', location: 'Bronx, NY', nextAvailable: '01/14/24', videoEnabled: false },
];

export const MOCK_APPOINTMENTS: Appointment[] = [
  { id: '1', doctorName: 'Dr. Tamez Rebecca', specialty: 'Dermatology', date: '03/15/2024', time: '10:00', videoEnabled: true },
  { id: '2', doctorName: 'Dr. James Chen', specialty: 'Cardiology', date: '03/22/2024', time: '14:30', videoEnabled: false },
];

export const MOCK_MEDICATIONS: Medication[] = [
  { id: '1', name: 'Acetaminophen 120 mg', dosage: '120 mg', instructions: '1 suppository as needed every 4 hrs', taken: 24, total: 60 },
  { id: '2', name: 'Lisinopril 10 mg', dosage: '10 mg', instructions: '1 tablet daily with food', taken: 18, total: 30 },
];

export const MOCK_TRACKER_METRICS: TrackerMetric[] = [
  { id: 'bp', label: 'Blood Pressure', value: '120/80', unit: 'mmHg' },
  { id: 'temp', label: 'Temperature', value: '98', unit: 'F' },
  { id: 'pulse', label: 'Pulse', value: '74', unit: 'bpm' },
];

export const HEALTH_CATEGORIES: HealthCategory[] = [
  { id: 'cardiology', label: 'Cardiology' },
  { id: 'dental', label: 'Dental' },
  { id: 'ophthalmology', label: 'Ophthalmology' },
  { id: 'dermatology', label: 'Dermatology' },
  { id: 'pediatrics', label: 'Pediatrics' },
];

export const MOCK_MESSAGES = [
  { id: '1', sender: 'Dr. Tamez Rebecca', preview: 'Your lab results are ready for review.', time: '2h ago', unread: true },
  { id: '2', sender: 'Care Team', preview: 'Reminder: appointment tomorrow at 10:00 AM.', time: '1d ago', unread: false },
  { id: '3', sender: 'Dr. James Chen', preview: 'Please update your blood pressure readings.', time: '3d ago', unread: false },
];
