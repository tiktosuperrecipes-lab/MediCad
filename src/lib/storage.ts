import { collection, addDoc, doc, updateDoc, deleteDoc, getDocs, arrayUnion } from 'firebase/firestore';
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
    // Remove undefined values to avoid Firestore "Unsupported field value: undefined" error
    const cleanPatient = JSON.parse(JSON.stringify(patient));
    
    // Mantendo o salvamento local temporariamente para não quebrar o app
    const patients = await getPatients();
    const index = patients.findIndex(p => p.id === cleanPatient.id);
    
    if (index >= 0) {
      // É uma edição: Atualiza no Firestore usando updateDoc
      const patientRef = doc(db, 'pacientes', cleanPatient.id);
      
      // Removemos o ID do payload para não duplicar dados desnecessários no documento
      const { id, ...patientData } = cleanPatient;
      await updateDoc(patientRef, patientData);

      // Atualiza o fallback local
      patients[index] = cleanPatient;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(patients));
    } else {
      // É um novo paciente: Salva no Firestore usando addDoc
      const { id, ...patientData } = cleanPatient;
      await addDoc(collection(db, 'pacientes'), patientData);

      // Atualiza o fallback local
      patients.push(cleanPatient);
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

export async function addClinicalEvolution(patientId: string, text: string): Promise<void> {
  try {
    const patientRef = doc(db, 'pacientes', patientId);
    const timestamp = new Date().toLocaleString('pt-BR');
    const evolutionEntry = `${timestamp}: ${text}`;
    
    // Ensure we don't send undefined
    if (text === undefined) throw new Error("Evolution text is undefined");

    await updateDoc(patientRef, {
      historico_clinico: arrayUnion(evolutionEntry)
    });
  } catch (error) {
    console.error("Erro ao adicionar evolução clínica:", error);
    throw error;
  }
}

export async function addFinancialRecord(patientId: string, record: any): Promise<void> {
  try {
    if (!record) throw new Error("Financial record is null or undefined");
    
    const patientRef = doc(db, 'pacientes', patientId);
    
    // Remove undefined values to avoid Firestore "Unsupported field value: undefined" error
    const cleanRecord = JSON.parse(JSON.stringify(record));

    await updateDoc(patientRef, {
      financeiro: arrayUnion(cleanRecord)
    });
  } catch (error) {
    console.error("Erro ao adicionar registro financeiro:", error);
    throw error;
  }
}
