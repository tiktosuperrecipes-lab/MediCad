import { collection, addDoc, doc, updateDoc, deleteDoc, getDocs, arrayUnion, arrayRemove, query, where, orderBy } from 'firebase/firestore';
import { db } from './firebase';
import { Patient, Appointment, GlobalFinancialRecord, ExpenseRecord } from '../types';

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

export async function deleteClinicalEvolution(patientId: string, entry: string): Promise<void> {
  try {
    const patientRef = doc(db, 'pacientes', patientId);
    await updateDoc(patientRef, {
      historico_clinico: arrayRemove(entry)
    });
  } catch (error) {
    console.error("Erro ao excluir evolução clínica:", error);
    throw error;
  }
}

export async function updateClinicalEvolution(patientId: string, oldEntry: string, newEntry: string): Promise<void> {
  try {
    const patientRef = doc(db, 'pacientes', patientId);
    const { getDoc } = await import('firebase/firestore');
    const docSnap = await getDoc(patientRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      const historico = data.historico_clinico || [];
      const newHistorico = historico.map((e: string) => e === oldEntry ? newEntry : e);
      await updateDoc(patientRef, { historico_clinico: newHistorico });
    }
  } catch (error) {
    console.error("Erro ao atualizar evolução clínica:", error);
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

    // Se for um pagamento, sincroniza com o financeiro global
    if (record.recordType === 'payment') {
      const patientSnapshot = await getDocs(query(collection(db, 'pacientes'), where('__name__', '==', patientId)));
      const patientData = patientSnapshot.docs[0]?.data() as Patient;
      
      await addGlobalFinancialRecord({
        id: record.id, // Usa o mesmo ID para facilitar a sincronização
        patientId: patientId,
        patientName: patientData?.fullName || 'Paciente Desconhecido',
        date: record.date,
        amount: record.amount,
        method: record.method,
        procedure: record.procedure || record.notes || 'Pagamento avulso',
        status: record.status || (record.receiptIssued ? 'Pago' : 'Pendente'),
        receiptIssued: record.receiptIssued || false,
        createdAt: new Date().toISOString(),
        installments: record.installments,
        cardFee: record.cardFee,
        netAmount: record.netAmount
      });
    }
  } catch (error) {
    console.error("Erro ao adicionar registro financeiro:", error);
    throw error;
  }
}

export async function updateFinancialRecord(patientId: string, updatedRecord: any): Promise<void> {
  try {
    const patientRef = doc(db, 'pacientes', patientId);
    const { getDoc } = await import('firebase/firestore');
    const docSnap = await getDoc(patientRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      const financeiro = data.financeiro || [];
      const newFinanceiro = financeiro.map((f: any) => f.id === updatedRecord.id ? updatedRecord : f);
      
      // Also check old budgets/payments arrays for compatibility if needed
      let budgets = data.budgets || [];
      let payments = data.payments || [];
      
      const newBudgets = budgets.map((b: any) => b.id === updatedRecord.id ? updatedRecord : b);
      const newPayments = payments.map((p: any) => p.id === updatedRecord.id ? updatedRecord : p);

      await updateDoc(patientRef, { 
        financeiro: newFinanceiro,
        budgets: newBudgets,
        payments: newPayments
      });
    }
  } catch (error) {
    console.error("Erro ao atualizar registro financeiro:", error);
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
export async function addGlobalFinancialRecord(record: Omit<GlobalFinancialRecord, 'id'> & { id?: string }): Promise<void> {
  try {
    const { id, ...data } = record;
    const cleanRecord = JSON.parse(JSON.stringify(data));
    
    if (id) {
      const recordRef = doc(db, 'financeiro_geral', id);
      await updateDoc(recordRef, {
        ...cleanRecord,
        createdAt: new Date().toISOString()
      }).catch(async (err) => {
        // Se o documento não existir, cria um novo com o ID fornecido
        if (err.code === 'not-found') {
          const { setDoc } = await import('firebase/firestore');
          await setDoc(recordRef, {
            ...cleanRecord,
            createdAt: new Date().toISOString()
          });
        } else {
          throw err;
        }
      });
    } else {
      await addDoc(collection(db, 'financeiro_geral'), {
        ...cleanRecord,
        createdAt: new Date().toISOString()
      });
    }
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

export async function deleteGlobalFinancialRecord(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'financeiro_geral', id));
  } catch (error) {
    console.error("Erro ao excluir registro financeiro global:", error);
    throw error;
  }
}

export async function updateGlobalFinancialRecordStatus(id: string, status: 'Pendente' | 'Pago'): Promise<void> {
  try {
    const { getDoc } = await import('firebase/firestore');
    const recordRef = doc(db, 'financeiro_geral', id);
    const recordSnap = await getDoc(recordRef);
    
    if (!recordSnap.exists()) throw new Error("Registro global não encontrado");
    
    const recordData = recordSnap.data() as GlobalFinancialRecord;
    await updateDoc(recordRef, { status });

    // Sincroniza com o prontuário do paciente
    const patientId = recordData.patientId;
    const patientRef = doc(db, 'pacientes', patientId);
    const patientSnap = await getDoc(patientRef);

    if (patientSnap.exists()) {
      const patientData = patientSnap.data() as Patient;
      if (patientData.financeiro) {
        const updatedFinanceiro = patientData.financeiro.map((item: any) => {
          if (item.id === id) {
            return { 
              ...item, 
              status: status // Sincroniza o status no prontuário do paciente
            };
          }
          return item;
        });
        await updateDoc(patientRef, { financeiro: updatedFinanceiro });
      }
    }
  } catch (error) {
    console.error("Erro ao atualizar status do registro financeiro:", error);
    throw error;
  }
}

export async function updateGlobalFinancialRecordReceipt(id: string, receiptIssued: boolean): Promise<void> {
  try {
    const { getDoc, setDoc } = await import('firebase/firestore');
    const recordRef = doc(db, 'financeiro_geral', id);
    const recordSnap = await getDoc(recordRef);
    
    let patientId = '';
    
    if (recordSnap.exists()) {
      const recordData = recordSnap.data() as GlobalFinancialRecord;
      patientId = recordData.patientId;
      await updateDoc(recordRef, { receiptIssued });
    } else {
      // Se não existir no global, tentamos encontrar no prontuário do paciente primeiro
      // para obter os dados necessários para criar o registro global
      console.warn("Registro global não encontrado para ID:", id, ". Tentando sincronizar do paciente.");
    }

    // Sincroniza com o prontuário do paciente (ou busca o paciente se não tivermos o ID)
    if (!patientId) {
      const patients = await getDocs(collection(db, 'pacientes'));
      for (const pDoc of patients.docs) {
        const pData = pDoc.data() as Patient;
        let found = pData.financeiro?.find((f: any) => f.id === id);
        let isOldPayment = false;
        
        if (!found) {
          found = pData.payments?.find((p: any) => p.id === id);
          if (found) isOldPayment = true;
        }

        if (found && (isOldPayment || (found as any).recordType === 'payment')) {
          const payment = found as any;
          patientId = pDoc.id;
          // Se não existia no global, criamos agora
          await setDoc(recordRef, {
            patientId: patientId,
            patientName: pData.fullName,
            date: payment.date,
            amount: payment.amount,
            method: payment.method,
            procedure: payment.notes || (isOldPayment ? 'Pagamento antigo' : 'Pagamento sincronizado'),
            status: payment.status || 'Pago',
            receiptIssued,
            createdAt: new Date().toISOString()
          });
          break;
        }
      }
    }

    if (patientId) {
      const patientRef = doc(db, 'pacientes', patientId);
      const patientSnap = await getDoc(patientRef);

      if (patientSnap.exists()) {
        const patientData = patientSnap.data() as Patient;
        const updates: any = {};

        if (patientData.financeiro) {
          updates.financeiro = patientData.financeiro.map((item: any) => {
            if (item.id === id) {
              const updatedItem = { 
                ...item, 
                receiptIssued,
                receiptDate: receiptIssued ? getLocalDateString() : null
              };
              return JSON.parse(JSON.stringify(updatedItem));
            }
            return item;
          });
        }

        if (patientData.payments) {
          updates.payments = patientData.payments.map((item: any) => {
            if (item.id === id) {
              const updatedItem = { 
                ...item, 
                receiptIssued,
                receiptDate: receiptIssued ? getLocalDateString() : null
              };
              return JSON.parse(JSON.stringify(updatedItem));
            }
            return item;
          });
        }

        if (Object.keys(updates).length > 0) {
          await updateDoc(patientRef, updates);
        }
      }
    } else {
      throw new Error("Registro não encontrado em nenhuma coleção.");
    }
  } catch (error) {
    console.error("Erro ao atualizar recibo do registro financeiro:", error);
    throw error;
  }
}

// Expense Management (Livro Caixa)
export async function getExpenses(year?: string, month?: string): Promise<ExpenseRecord[]> {
  try {
    let q = query(collection(db, 'livro_caixa'), orderBy('date', 'desc'));
    
    if (year && month) {
      const startDate = `${year}-${month}-01`;
      const endDate = `${year}-${month}-31`;
      q = query(collection(db, 'livro_caixa'), 
        where('date', '>=', startDate), 
        where('date', '<=', endDate),
        orderBy('date', 'desc')
      );
    } else if (year) {
      const startDate = `${year}-01-01`;
      const endDate = `${year}-12-31`;
      q = query(collection(db, 'livro_caixa'), 
        where('date', '>=', startDate), 
        where('date', '<=', endDate),
        orderBy('date', 'desc')
      );
    }

    const querySnapshot = await getDocs(q);
    const expenses: ExpenseRecord[] = [];
    
    querySnapshot.forEach((doc) => {
      expenses.push({
        ...doc.data() as ExpenseRecord,
        id: doc.id
      });
    });
    
    return expenses;
  } catch (error) {
    console.error("Erro ao buscar despesas no Firestore:", error);
    return [];
  }
}

export async function saveExpense(expense: Omit<ExpenseRecord, 'id'> | ExpenseRecord): Promise<void> {
  try {
    const cleanExpense = JSON.parse(JSON.stringify(expense));
    
    if ('id' in cleanExpense && cleanExpense.id) {
      const { id, ...expenseData } = cleanExpense;
      const expenseRef = doc(db, 'livro_caixa', id);
      await updateDoc(expenseRef, expenseData);
    } else {
      await addDoc(collection(db, 'livro_caixa'), {
        ...cleanExpense,
        createdAt: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error("Erro ao salvar despesa no Firestore:", error);
    throw error;
  }
}

export async function deleteExpense(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'livro_caixa', id));
  } catch (error) {
    console.error("Erro ao excluir despesa no Firestore:", error);
    throw error;
  }
}

function getLocalDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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
