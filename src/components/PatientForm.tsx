import React, { useState } from 'react';
import { Save, User, MapPin, Activity, FileText, CheckCircle2 } from 'lucide-react';
import { formatCPF, formatPhone, formatCEP } from '../lib/formatters';
import { savePatient } from '../lib/storage';
import { Patient } from '../types';
import { getLocalDateString } from '../lib/dateUtils';

const initialFormState: Omit<Patient, 'id' | 'createdAt'> = {
  fullName: '',
  birthDate: '',
  cpf: '',
  gender: '',
  whatsapp: '',
  email: '',
  cep: '',
  street: '',
  number: '',
  neighborhood: '',
  city: '',
  state: '',
  bloodType: '',
  hasAllergies: false,
  allergiesDetails: '',
  hasMedication: false,
  medicationDetails: '',
  serviceType: 'Particular',
  insuranceName: '',
  consultationReason: '',
  consultations: [],
  nextReturn: '',
};

export default function PatientForm({ onSuccess, initialData }: { onSuccess: () => void, initialData?: Patient | null }) {
  const [formData, setFormData] = useState<Omit<Patient, 'id' | 'createdAt'>>(initialData || initialFormState);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isLoadingCEP, setIsLoadingCEP] = useState(false);

  // Update form data when initialData changes
  React.useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData(initialFormState);
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
      return;
    }

    let formattedValue = value;
    if (name === 'cpf') formattedValue = formatCPF(value);
    if (name === 'whatsapp') formattedValue = formatPhone(value);

    setFormData(prev => ({ ...prev, [name]: formattedValue }));
  };

  const handleCEPChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const cep = formatCEP(e.target.value);
    setFormData(prev => ({ ...prev, cep }));

    if (cep.length === 9) {
      setIsLoadingCEP(true);
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cep.replace('-', '')}/json/`);
        const data = await response.json();
        if (!data.erro) {
          setFormData(prev => ({
            ...prev,
            street: data.logradouro || '',
            neighborhood: data.bairro || '',
            city: data.localidade || '',
            state: data.uf || '',
          }));
        }
      } catch (error) {
        console.error("Erro ao buscar CEP", error);
      } finally {
        setIsLoadingCEP(false);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newPatient: Patient = {
      ...formData,
      id: initialData?.id || crypto.randomUUID(),
      createdAt: initialData?.createdAt || getLocalDateString(),
    };

    savePatient(newPatient);
    
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      setFormData(initialFormState);
      onSuccess();
    }, 2000);
  };

  return (
    <div className="max-w-4xl mx-auto">
      {showSuccess && (
        <div className="mb-6 p-4 bg-teal-50 border border-teal-200 rounded-lg flex items-center gap-3 text-teal-800 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="h-6 w-6 text-teal-600" />
          <p className="font-medium">Paciente salvo com sucesso!</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Dados Pessoais */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center gap-2">
            <User className="h-5 w-5 text-teal-600" />
            <h2 className="text-lg font-semibold text-slate-800">Dados Pessoais</h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Nome Completo *</label>
              <input
                required
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                placeholder="Ex: Maria da Silva"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Data de Nascimento</label>
              <input
                type="date"
                name="birthDate"
                value={formData.birthDate}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">CPF *</label>
              <input
                required
                type="text"
                name="cpf"
                value={formData.cpf}
                onChange={handleChange}
                maxLength={14}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                placeholder="000.000.000-00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Gênero</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all bg-white"
              >
                <option value="">Selecione...</option>
                <option value="Feminino">Feminino</option>
                <option value="Masculino">Masculino</option>
                <option value="Outro">Outro</option>
                <option value="Prefere não informar">Prefere não informar</option>
              </select>
            </div>
          </div>
        </div>

        {/* Contato e Endereço */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-teal-600" />
            <h2 className="text-lg font-semibold text-slate-800">Contato e Endereço</h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">WhatsApp *</label>
              <input
                required
                type="text"
                name="whatsapp"
                value={formData.whatsapp}
                onChange={handleChange}
                maxLength={15}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                placeholder="(00) 00000-0000"
              />
            </div>
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">E-mail</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                placeholder="paciente@email.com"
              />
            </div>
            
            <div className="col-span-1 md:col-span-2 lg:col-span-3 border-t border-slate-100 pt-4 mt-2"></div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                CEP {isLoadingCEP && <span className="text-teal-600 text-xs ml-2 animate-pulse">Buscando...</span>}
              </label>
              <input
                type="text"
                name="cep"
                value={formData.cep}
                onChange={handleCEPChange}
                maxLength={9}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                placeholder="00000-000"
              />
            </div>
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Rua / Logradouro</label>
              <input
                type="text"
                name="street"
                value={formData.street}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Número</label>
              <input
                type="text"
                name="number"
                value={formData.number}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Bairro</label>
              <input
                type="text"
                name="neighborhood"
                value={formData.neighborhood}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Cidade</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Estado</label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  maxLength={2}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all uppercase"
                  placeholder="UF"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Dados Clínicos */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center gap-2">
            <Activity className="h-5 w-5 text-teal-600" />
            <h2 className="text-lg font-semibold text-slate-800">Dados Clínicos</h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tipo Sanguíneo</label>
              <select
                name="bloodType"
                value={formData.bloodType}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all bg-white"
              >
                <option value="">Não informado</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>
            
            <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="hasAllergies"
                    checked={formData.hasAllergies}
                    onChange={handleChange}
                    className="w-4 h-4 text-teal-600 border-slate-300 rounded focus:ring-teal-500"
                  />
                  <span className="text-sm font-medium text-slate-700">Possui Alergias?</span>
                </label>
                {formData.hasAllergies && (
                  <textarea
                    name="allergiesDetails"
                    value={formData.allergiesDetails}
                    onChange={handleChange}
                    placeholder="Quais alergias?"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all h-24 resize-none"
                  />
                )}
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="hasMedication"
                    checked={formData.hasMedication}
                    onChange={handleChange}
                    className="w-4 h-4 text-teal-600 border-slate-300 rounded focus:ring-teal-500"
                  />
                  <span className="text-sm font-medium text-slate-700">Uso de Medicação Contínua?</span>
                </label>
                {formData.hasMedication && (
                  <textarea
                    name="medicationDetails"
                    value={formData.medicationDetails}
                    onChange={handleChange}
                    placeholder="Quais medicações?"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all h-24 resize-none"
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Administrativo */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center gap-2">
            <FileText className="h-5 w-5 text-teal-600" />
            <h2 className="text-lg font-semibold text-slate-800">Administrativo</h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Atendimento</label>
              <select
                name="serviceType"
                value={formData.serviceType}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all bg-white"
              >
                <option value="Particular">Particular</option>
                <option value="Convênio">Convênio</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Convênio</label>
              <input
                type="text"
                name="insuranceName"
                value={formData.insuranceName}
                onChange={handleChange}
                disabled={formData.serviceType !== 'Convênio'}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all disabled:bg-slate-100 disabled:text-slate-400"
                placeholder={formData.serviceType === 'Convênio' ? "Ex: Unimed, Bradesco..." : "Apenas para convênios"}
              />
            </div>
            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Motivo da Consulta</label>
              <textarea
                name="consultationReason"
                value={formData.consultationReason}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all h-24 resize-none"
                placeholder="Descreva brevemente o motivo da visita..."
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 pb-12">
          <button
            type="submit"
            className="flex items-center gap-2 px-8 py-3 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-xl shadow-sm shadow-teal-600/20 transition-all active:scale-95"
          >
            <Save className="h-5 w-5" />
            {initialData ? 'Salvar Alterações' : 'Salvar Paciente'}
          </button>
        </div>
      </form>
    </div>
  );
}
