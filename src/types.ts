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
}
