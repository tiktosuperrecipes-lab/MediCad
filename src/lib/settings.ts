export interface ClinicSettings {
  name: string;
  address: string;
  phone: string;
  doctorName: string;
  crm: string;
}

const DEFAULT_SETTINGS: ClinicSettings = {
  name: 'Clínica Médica',
  address: 'Rua Exemplo, 123 - Centro, Cidade/UF',
  phone: '(00) 0000-0000',
  doctorName: 'Dr(a). Nome do Médico',
  crm: 'CRM 00000-UF'
};

export const getSettings = (): ClinicSettings => {
  const data = localStorage.getItem('medicad_settings');
  return data ? JSON.parse(data) : DEFAULT_SETTINGS;
};

export const saveSettings = (settings: ClinicSettings): void => {
  localStorage.setItem('medicad_settings', JSON.stringify(settings));
};
