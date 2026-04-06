import { collection, addDoc, doc, setDoc, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import { Patient } from '../types';

const STORAGE_KEY = '@medicad:patients';

export async function getPatients(): Promise<Patient[]> {
  try {
    const querySnapshot = await getDocs(collection(db, 'pacientes'));
    const patients: Patient[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data() as Patient;
      patients.push({
        ...data,
        id: doc.id // Garante que o ID do objeto seja o mesmo do documento no Firestore
      });
    });
    
    return patients;
  } catch (error) {
    console.error("Erro ao buscar pacientes no Firestore:", error);
    // Fallback de segurança: tenta carregar do localStorage se o Firebase falhar
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }
}

export async function savePatient(patient: Patient): Promise<void> {
  try {
    // Mantendo o salvamento local temporariamente para não quebrar o app
    const patients = await getPatients();
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

export async function deletePatient(id: string): Promise<void> {
  const patients = await getPatients();
  const filtered = patients.filter(p => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}
