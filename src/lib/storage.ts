import { collection, addDoc, doc, updateDoc, deleteDoc, getDocs } from 'firebase/firestore';
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
      // É uma edição: Atualiza no Firestore usando updateDoc
      const patientRef = doc(db, 'pacientes', patient.id);
      
      // Removemos o ID do payload para não duplicar dados desnecessários no documento
      const { id, ...patientData } = patient;
      await updateDoc(patientRef, patientData);

      // Atualiza o fallback local
      patients[index] = patient;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(patients));
    } else {
      // É um novo paciente: Salva no Firestore usando addDoc
      const { id, ...patientData } = patient;
      await addDoc(collection(db, 'pacientes'), patientData);

      // Atualiza o fallback local
      patients.push(patient);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(patients));
    }
  } catch (error) {
    console.error("Erro detalhado ao salvar paciente no Firestore:", error);
  }
}

export async function deletePatient(id: string): Promise<void> {
  try {
    // Exclui o documento correspondente no Firestore
    await deleteDoc(doc(db, 'pacientes', id));
    
    // Mantém o fallback local sincronizado
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      const patients = JSON.parse(data);
      const filtered = patients.filter((p: Patient) => p.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    }
  } catch (error) {
    console.error("Erro ao excluir paciente no Firestore:", error);
  }
}
