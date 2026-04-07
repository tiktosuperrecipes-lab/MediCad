import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

export interface ClinicSettings {
  name: string;
  address: string;
  phone: string;
  doctorName: string;
  crm: string;
  cpf?: string;
  agendaStartTime?: string;
  agendaEndTime?: string;
}

const DEFAULT_SETTINGS: ClinicSettings = {
  name: 'Clínica Médica',
  address: 'Rua Exemplo, 123 - Centro, Cidade/UF',
  phone: '(00) 0000-0000',
  doctorName: 'Dr(a). Nome do Médico',
  crm: 'CRM 00000-UF',
  cpf: '',
  agendaStartTime: '08:00',
  agendaEndTime: '18:00'
};

const SETTINGS_DOC_ID = 'clinica_principal';
const SETTINGS_COLLECTION = 'configuracoes';

export const getSettings = async (): Promise<ClinicSettings> => {
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as ClinicSettings;
    }
    
    // Fallback para localStorage se não houver no Firestore
    const localData = localStorage.getItem('medicad_settings');
    return localData ? JSON.parse(localData) : DEFAULT_SETTINGS;
  } catch (error) {
    console.error("Erro ao buscar configurações:", error);
    return DEFAULT_SETTINGS;
  }
};

export const saveSettings = async (settings: ClinicSettings): Promise<void> => {
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID);
    
    // Remove undefined values to avoid Firestore "Unsupported field value: undefined" error
    const cleanSettings = JSON.parse(JSON.stringify(settings));
    
    await setDoc(docRef, cleanSettings);
    localStorage.setItem('medicad_settings', JSON.stringify(settings));
  } catch (error) {
    console.error("Erro ao salvar configurações:", error);
    throw error;
  }
};
