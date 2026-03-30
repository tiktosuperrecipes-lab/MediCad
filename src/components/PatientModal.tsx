import React, { useState } from 'react';
import { X, Printer, User, MapPin, Activity, FileText, Calendar, Phone, Mail, Plus, Save } from 'lucide-react';
import { Patient, Consultation } from '../types';
import { savePatient } from '../lib/storage';

export default function PatientModal({ 
  patient, 
  onClose,
  onUpdate
}: { 
  patient: Patient; 
  onClose: () => void;
  onUpdate: (p: Patient) => void;
}) {
  const [activeTab, setActiveTab] = useState<'details' | 'history'>('details');
  const [showNewConsultation, setShowNewConsultation] = useState(false);
  const [consultationForm, setConsultationForm] = useState({
    date: new Date().toISOString().split('T')[0],
    notes: '',
    returnPrediction: 'none'
  });

  const handlePrint = () => {
    window.print();
  };

  const handleSaveConsultation = () => {
    if (!consultationForm.notes.trim()) {
      alert('Por favor, preencha as anotações da consulta.');
      return;
    }

    let nextReturn = patient.nextReturn || '';
    if (consultationForm.returnPrediction !== 'none') {
      const d = new Date(consultationForm.date + 'T12:00:00');
      if (consultationForm.returnPrediction === '15_days') d.setDate(d.getDate() + 15);
      if (consultationForm.returnPrediction === '30_days') d.setDate(d.getDate() + 30);
      if (consultationForm.returnPrediction === '6_months') d.setMonth(d.getMonth() + 6);
      nextReturn = d.toISOString().split('T')[0];
    }

    const newConsultation: Consultation = {
      id: crypto.randomUUID(),
      date: consultationForm.date,
      notes: consultationForm.notes,
      returnPrediction: consultationForm.returnPrediction
    };

    const updatedPatient = {
      ...patient,
      consultations: [newConsultation, ...(patient.consultations || [])],
      nextReturn
    };

    savePatient(updatedPatient);
    onUpdate(updatedPatient);
    setShowNewConsultation(false);
    setConsultationForm({ date: new Date().toISOString().split('T')[0], notes: '', returnPrediction: 'none' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/50 backdrop-blur-sm print:static print:p-0 print:bg-white print:block">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto print:shadow-none print:max-w-none print:max-h-none print:overflow-visible flex flex-col">
        
        {/* Header */}
        <div className="sticky top-0 z-20 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between print:hidden">
          <h2 className="text-xl font-bold text-slate-800">Ficha do Paciente</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors"
            >
              <Printer className="h-4 w-4" />
              <span className="hidden sm:inline">Imprimir</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Print Header (Only visible when printing) */}
        <div className="hidden print:block border-b-2 border-slate-800 pb-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Ficha de Paciente</h1>
              <p className="text-slate-500 mt-1">Consultório Médico</p>
            </div>
            <div className="text-right text-sm text-slate-500">
              <p>Data de Cadastro: {new Date(patient.createdAt).toLocaleDateString('pt-BR')}</p>
              <p>ID: {patient.id.split('-')[0]}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 sm:px-8 border-b border-slate-200 print:hidden shrink-0">
          <div className="flex gap-6">
            <button 
              onClick={() => setActiveTab('details')}
              className={`py-4 font-medium text-sm border-b-2 transition-colors ${activeTab === 'details' ? 'border-teal-600 text-teal-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              Dados Cadastrais
            </button>
            <button 
              onClick={() => setActiveTab('history')}
              className={`py-4 font-medium text-sm border-b-2 transition-colors ${activeTab === 'history' ? 'border-teal-600 text-teal-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              Prontuário Clínico
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8 flex-1 print:p-0">
          
          {/* TAB: Dados Cadastrais */}
          <div className={`${activeTab === 'details' ? 'block' : 'hidden'} print:block space-y-8`}>
            {/* Dados Pessoais */}
            <section>
              <div className="flex items-center gap-2 mb-4 text-teal-700 print:text-slate-800 border-b border-slate-100 print:border-slate-300 pb-2">
                <User className="h-5 w-5" />
                <h3 className="text-lg font-semibold">Dados Pessoais</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <div className="sm:col-span-2">
                  <p className="text-sm text-slate-500 mb-1">Nome Completo</p>
                  <p className="font-medium text-slate-900">{patient.fullName}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">CPF</p>
                  <p className="font-medium text-slate-900">{patient.cpf}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">Data de Nascimento</p>
                  <p className="font-medium text-slate-900">
                    {patient.birthDate ? new Date(patient.birthDate).toLocaleDateString('pt-BR') : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">Gênero</p>
                  <p className="font-medium text-slate-900">{patient.gender || '-'}</p>
                </div>
              </div>
            </section>

            {/* Contato e Endereço */}
            <section>
              <div className="flex items-center gap-2 mb-4 text-teal-700 print:text-slate-800 border-b border-slate-100 print:border-slate-300 pb-2">
                <MapPin className="h-5 w-5" />
                <h3 className="text-lg font-semibold">Contato e Endereço</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <div>
                  <p className="text-sm text-slate-500 mb-1">WhatsApp</p>
                  <div className="flex items-center gap-2 font-medium text-slate-900">
                    <Phone className="h-4 w-4 text-slate-400 print:hidden" />
                    {patient.whatsapp}
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-sm text-slate-500 mb-1">E-mail</p>
                  <div className="flex items-center gap-2 font-medium text-slate-900">
                    <Mail className="h-4 w-4 text-slate-400 print:hidden" />
                    {patient.email || '-'}
                  </div>
                </div>
                <div className="sm:col-span-2 lg:col-span-3">
                  <p className="text-sm text-slate-500 mb-1">Endereço Completo</p>
                  <p className="font-medium text-slate-900">
                    {patient.street ? `${patient.street}, ${patient.number || 'S/N'} - ${patient.neighborhood}` : '-'}
                    {patient.city ? ` - ${patient.city}/${patient.state}` : ''}
                    {patient.cep ? ` (CEP: ${patient.cep})` : ''}
                  </p>
                </div>
              </div>
            </section>

            {/* Dados Clínicos */}
            <section>
              <div className="flex items-center gap-2 mb-4 text-teal-700 print:text-slate-800 border-b border-slate-100 print:border-slate-300 pb-2">
                <Activity className="h-5 w-5" />
                <h3 className="text-lg font-semibold">Dados Clínicos</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Tipo Sanguíneo</p>
                  <p className="font-medium text-slate-900">
                    {patient.bloodType ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 print:bg-transparent print:p-0 print:text-slate-900 print:text-base">
                        {patient.bloodType}
                      </span>
                    ) : '-'}
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-sm text-slate-500 mb-1">Alergias</p>
                  <p className="font-medium text-slate-900">
                    {patient.hasAllergies ? (
                      <span className="text-red-600 print:text-slate-900">{patient.allergiesDetails || 'Sim (não especificado)'}</span>
                    ) : 'Não possui'}
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-sm text-slate-500 mb-1">Medicação Contínua</p>
                  <p className="font-medium text-slate-900">
                    {patient.hasMedication ? patient.medicationDetails || 'Sim (não especificado)' : 'Não faz uso'}
                  </p>
                </div>
              </div>
            </section>

            {/* Administrativo */}
            <section>
              <div className="flex items-center gap-2 mb-4 text-teal-700 print:text-slate-800 border-b border-slate-100 print:border-slate-300 pb-2">
                <FileText className="h-5 w-5" />
                <h3 className="text-lg font-semibold">Administrativo</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Tipo de Atendimento</p>
                  <p className="font-medium text-slate-900">{patient.serviceType}</p>
                </div>
                {patient.serviceType === 'Convênio' && (
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Nome do Convênio</p>
                    <p className="font-medium text-slate-900">{patient.insuranceName || '-'}</p>
                  </div>
                )}
                <div className="sm:col-span-2">
                  <p className="text-sm text-slate-500 mb-1">Motivo da Consulta</p>
                  <div className="bg-slate-50 p-4 rounded-lg print:bg-transparent print:p-0 print:border print:border-slate-200 print:p-4">
                    <p className="text-slate-800 whitespace-pre-wrap">
                      {patient.consultationReason || 'Não informado'}
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* TAB: Prontuário Clínico */}
          <div className={`${activeTab === 'history' ? 'block' : 'hidden'} print:block print:mt-12`}>
            
            <div className="flex items-center justify-between mb-6 print:hidden">
              <h3 className="text-lg font-semibold text-slate-800">Histórico de Consultas</h3>
              {!showNewConsultation && (
                <button 
                  onClick={() => setShowNewConsultation(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Registrar Consulta
                </button>
              )}
            </div>

            {/* Print Header for History */}
            <div className="hidden print:block border-b-2 border-slate-800 pb-2 mb-6">
              <h3 className="text-xl font-bold text-slate-900">Histórico de Consultas (Prontuário)</h3>
            </div>

            {/* New Consultation Form */}
            {showNewConsultation && (
              <div className="bg-teal-50/50 p-5 rounded-xl border border-teal-100 mb-8 print:hidden animate-in fade-in slide-in-from-top-4">
                <h4 className="font-medium text-teal-900 mb-4">Nova Consulta</h4>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Data da Consulta</label>
                      <input
                        type="date"
                        value={consultationForm.date}
                        onChange={(e) => setConsultationForm({...consultationForm, date: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Previsão de Retorno</label>
                      <select
                        value={consultationForm.returnPrediction}
                        onChange={(e) => setConsultationForm({...consultationForm, returnPrediction: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none bg-white"
                      >
                        <option value="none">Sem retorno agendado</option>
                        <option value="15_days">Em 15 dias</option>
                        <option value="30_days">Em 30 dias</option>
                        <option value="6_months">Em 6 meses</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Anotações / Evolução Clínica</label>
                    <textarea
                      value={consultationForm.notes}
                      onChange={(e) => setConsultationForm({...consultationForm, notes: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none h-32 resize-none"
                      placeholder="Descreva os sintomas, diagnóstico, prescrição..."
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button 
                      onClick={() => setShowNewConsultation(false)}
                      className="px-4 py-2 text-slate-600 hover:bg-slate-100 font-medium rounded-lg transition-colors"
                    >
                      Cancelar
                    </button>
                    <button 
                      onClick={handleSaveConsultation}
                      className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg transition-colors"
                    >
                      <Save className="h-4 w-4" />
                      Salvar Consulta
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Timeline */}
            <div className="space-y-6 border-l-2 border-teal-100 pl-4 ml-2 print:border-slate-300">
              {patient.consultations && patient.consultations.length > 0 ? (
                patient.consultations.map(c => (
                  <div key={c.id} className="relative">
                    <div className="absolute -left-[25px] top-1.5 h-4 w-4 rounded-full bg-teal-500 border-4 border-white shadow-sm print:border-slate-300 print:bg-slate-800"></div>
                    <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm print:shadow-none print:border-slate-300 print:p-4">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3 gap-2">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-teal-600 print:text-slate-800" />
                          <span className="font-semibold text-slate-800">
                            {c.date.split('-').reverse().join('/')}
                          </span>
                        </div>
                        {c.returnPrediction !== 'none' && (
                          <span className="text-xs font-medium px-2.5 py-1 bg-amber-50 text-amber-700 rounded-md print:border print:border-amber-200 print:bg-transparent">
                            Retorno: {
                              c.returnPrediction === '15_days' ? '15 dias' :
                              c.returnPrediction === '30_days' ? '30 dias' : '6 meses'
                            }
                          </span>
                        )}
                      </div>
                      <p className="text-slate-700 whitespace-pre-wrap text-sm leading-relaxed">
                        {c.notes}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-slate-500 py-8 print:hidden">
                  Nenhuma consulta registrada no prontuário.
                </div>
              )}
            </div>

          </div>

          {/* Print Footer */}
          <div className="hidden print:block mt-16 pt-8 border-t border-slate-300 text-center">
            <div className="w-64 mx-auto border-b border-slate-800 mb-2"></div>
            <p className="text-sm text-slate-600">Assinatura do Médico / Responsável</p>
          </div>

        </div>
      </div>
    </div>
  );
}
