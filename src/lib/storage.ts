import { collection, addDoc, doc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { Patient } from '../types';

const STORAGE_KEY = '@medicad:patients';

export function getPatients(): Patient[] {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

export async function savePatient(patient: Patient): Promise<void> {
  try {
    // Mantendo o salvamento local temporariamente para não quebrar o app
    const patients = getPatients();
    const index = patients.findIndex(p => p.id === patient.id);
    
    if (index >= 0) {
      patients[index] = patient;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(patients));
      
      // Atualiza no Firestore (usando setDoc para manter o ID existente)
      await setDoc(doc(db, 'pacientes', patient.id), patient);
    } else {
      patients.push(patient);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(patients));
      
      // Salva no Firestore usando addDoc conforme solicitado
      await addDoc(collection(db, 'pacientes'), patient);
    }
  } catch (error) {
    console.error("Erro detalhado ao salvar paciente no Firestore:", error);
  }
}

export function deletePatient(id: string): void {
  const patients = getPatients();
  const filtered = patients.filter(p => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}
