import { Patient } from '../types';

const STORAGE_KEY = '@medicad:patients';

export function getPatients(): Patient[] {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

export function savePatient(patient: Patient): void {
  const patients = getPatients();
  const index = patients.findIndex(p => p.id === patient.id);
  
  if (index >= 0) {
    patients[index] = patient;
  } else {
    patients.push(patient);
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(patients));
}

export function deletePatient(id: string): void {
  const patients = getPatients();
  const filtered = patients.filter(p => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}
