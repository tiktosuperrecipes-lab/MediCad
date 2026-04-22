import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

export interface Procedure {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  category?: string;
}

export interface CardFee {
  id: string;
  installments: number;
  percentage: number;
}

export interface ClinicSettings {
  name: string;
  address: string;
  phone: string;
  doctorName: string;
  crm: string;
  cpf?: string;
  agendaStartTime?: string;
  agendaEndTime?: string;
  procedures?: Procedure[];
  cardFees?: CardFee[];
  financialPassword?: string;
}

const DEFAULT_SETTINGS: ClinicSettings = {
  name: 'Clínica Médica',
  address: 'Rua Exemplo, 123 - Centro, Cidade/UF',
  phone: '(00) 0000-0000',
  doctorName: 'Dr(a). Nome do Médico',
  crm: 'CRM 00000-UF',
  cpf: '',
  agendaStartTime: '08:00',
  agendaEndTime: '18:00',
  procedures: [],
  cardFees: [
    { id: '1', installments: 1, percentage: 2.5 },
    { id: '2', installments: 2, percentage: 3.5 },
    { id: '3', installments: 3, percentage: 4.5 },
    { id: '4', installments: 4, percentage: 5.5 },
    { id: '5', installments: 5, percentage: 6.5 },
    { id: '6', installments: 6, percentage: 7.5 },
    { id: '12', installments: 12, percentage: 12.0 },
  ],
  financialPassword: 'Samuel20206@'
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
