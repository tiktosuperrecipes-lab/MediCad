export interface Consultation {
  id: string;
  date: string;
  notes: string;
  returnPrediction: string;
}

export interface Medication {
  id: string;
  name: string;
  posology: string;
}

export interface Prescription {
  id: string;
  date: string;
  medications: Medication[];
}

export interface ExamRequest {
  id: string;
  date: string;
  requestText: string;
}

export interface Certificate {
  id: string;
  date: string;
  days: number;
  cid: string;
  text: string;
}

export interface BudgetItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Budget {
  id: string;
  date: string;
  items: BudgetItem[];
  totalAmount: number;
  discount: number;
  finalAmount: number;
  status: 'pending' | 'approved' | 'rejected';
}

export interface Payment {
  id: string;
  date: string;
  amount: number;
  method: 'pix' | 'credit' | 'debit' | 'cash' | 'transfer';
  notes?: string;
  receiptIssued?: boolean;
  receiptDate?: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  procedure: string;
  status: 'Agendado' | 'Confirmado' | 'Finalizado';
}

export interface PatientPhoto {
  id: string;
  base64: string;
  description: string;
  date: string;
  linkedConsultation?: string;
}

export interface Patient {
  id: string;
  // Personal
  fullName: string;
  birthDate: string;
  cpf: string;
  gender: string;
  // Contact & Address
  whatsapp: string;
  email: string;
  cep: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  // Clinical
  bloodType: string;
  hasAllergies: boolean;
  allergiesDetails: string;
  hasMedication: boolean;
  medicationDetails: string;
  // Admin
  serviceType: 'Particular' | 'Convênio';
  insuranceName: string;
  consultationReason: string;
  createdAt: string;
  // CRM & Prontuário
  consultations?: Consultation[];
  historico_clinico?: string[];
  fotos?: (string | PatientPhoto)[];
  nextReturn?: string;

  // Anamnese Base
  qp?: string;
  hma?: string;
  hpp?: string;
  physicalExam?: string;

  // Receituários, Exames e Atestados
  prescriptions?: Prescription[];
  examRequests?: ExamRequest[];
  certificates?: Certificate[];

  // Financeiro
  budgets?: Budget[];
  payments?: Payment[];
  financeiro?: (Budget | Payment)[];
}
