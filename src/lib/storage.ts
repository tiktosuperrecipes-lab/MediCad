import { collection, addDoc, doc, updateDoc, deleteDoc, getDocs, arrayUnion, arrayRemove, query, where, orderBy } from 'firebase/firestore';
import { db } from './firebase';
import { Patient, Appointment, GlobalFinancialRecord } from '../types';

const STORAGE_KEY = '@medicad:patients';

export async function getAppointments(date: string): Promise<Appointment[]> {
  try {
    const q = query(collection(db, 'agenda'), where('date', '==', date));
    const querySnapshot = await getDocs(q);
    const appointments: Appointment[] = [];
    
    querySnapshot.forEach((doc) => {
      appointments.push({
        ...doc.data() as Appointment,
        id: doc.id
      });
    });
    
    return appointments;
  } catch (error) {
    console.error("Erro ao buscar agenda no Firestore:", error);
    return [];
  }
}

export async function saveAppointment(appointment: Omit<Appointment, 'id'> | Appointment): Promise<void> {
  try {
    const cleanAppointment = JSON.parse(JSON.stringify(appointment));
    
    if ('id' in cleanAppointment && cleanAppointment.id) {
      const { id, ...appointmentData } = cleanAppointment;
      const appointmentRef = doc(db, 'agenda', id);
      await updateDoc(appointmentRef, appointmentData);
    } else {
      await addDoc(collection(db, 'agenda'), cleanAppointment);
    }
  } catch (error) {
    console.error("Erro ao salvar agendamento no Firestore:", error);
    throw error;
  }
}

export async function deleteAppointment(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'agenda', id));
  } catch (error) {
    console.error("Erro ao excluir agendamento no Firestore:", error);
    throw error;
  }
}

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

export async function addPatientPhoto(patientId: string, base64Image: string): Promise<void> {
  try {
    const patientRef = doc(db, 'pacientes', patientId);
    await updateDoc(patientRef, {
      fotos: arrayUnion(base64Image)
    });
  } catch (error) {
    console.error("Erro ao salvar foto do paciente:", error);
    throw error;
  }
}

export async function removePatientPhoto(patientId: string, base64Image: string): Promise<void> {
  try {
    const patientRef = doc(db, 'pacientes', patientId);
    await updateDoc(patientRef, {
      fotos: arrayRemove(base64Image)
    });
  } catch (error) {
    console.error("Erro ao remover foto do paciente:", error);
    throw error;
  }
}

// Global Financial Records
export async function addGlobalFinancialRecord(record: Omit<GlobalFinancialRecord, 'id'>): Promise<void> {
  try {
    const cleanRecord = JSON.parse(JSON.stringify(record));
    await addDoc(collection(db, 'financeiro_geral'), {
      ...cleanRecord,
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("Erro ao adicionar registro financeiro global:", error);
    throw error;
  }
}

export async function getGlobalFinancialRecords(): Promise<GlobalFinancialRecord[]> {
  try {
    const q = query(collection(db, 'financeiro_geral'), orderBy('date', 'desc'));
    const querySnapshot = await getDocs(q);
    const records: GlobalFinancialRecord[] = [];
    
    querySnapshot.forEach((doc) => {
      records.push({
        ...doc.data() as GlobalFinancialRecord,
        id: doc.id
      });
    });
    
    return records;
  } catch (error) {
    console.error("Erro ao buscar registros financeiros globais:", error);
    return [];
  }
}

export async function updateGlobalFinancialRecordStatus(id: string, status: 'Pendente' | 'Pago'): Promise<void> {
  try {
    const recordRef = doc(db, 'financeiro_geral', id);
    await updateDoc(recordRef, { status });
  } catch (error) {
    console.error("Erro ao atualizar status do registro financeiro:", error);
    throw error;
  }
}

// Data Reset Functions
export async function resetCollection(collectionName: string): Promise<void> {
  try {
    const querySnapshot = await getDocs(collection(db, collectionName));
    const deletePromises = querySnapshot.docs.map(document => deleteDoc(doc(db, collectionName, document.id)));
    await Promise.all(deletePromises);
  } catch (error) {
    console.error(`Erro ao resetar coleção ${collectionName}:`, error);
    throw error;
  }
}

export async function clearPatientClinicalData(area: 'all' | 'financial' | 'clinical'): Promise<void> {
  try {
    const querySnapshot = await getDocs(collection(db, 'pacientes'));
    const updatePromises = querySnapshot.docs.map(document => {
      const patientRef = doc(db, 'pacientes', document.id);
      const updates: any = {};
      
      if (area === 'all' || area === 'financial') {
        updates.payments = [];
        updates.financeiro = [];
        updates.budgets = [];
      }
      
      if (area === 'all' || area === 'clinical') {
        updates.historico_clinico = [];
        updates.consultations = [];
        updates.prescriptions = [];
        updates.examRequests = [];
        updates.certificates = [];
        updates.fotos = [];
      }
      
      return updateDoc(patientRef, updates);
    });
    await Promise.all(updatePromises);
  } catch (error) {
    console.error(`Erro ao limpar dados clínicos (${area}):`, error);
    throw error;
  }
}
