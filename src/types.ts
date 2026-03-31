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
}
