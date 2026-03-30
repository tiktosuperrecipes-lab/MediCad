import React from 'react';
import { X, Printer, User, MapPin, Activity, FileText, Calendar, Phone, Mail } from 'lucide-react';
import { Patient } from '../types';

export default function PatientModal({ patient, onClose }: { patient: Patient; onClose: () => void }) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/50 backdrop-blur-sm print:static print:p-0 print:bg-white print:block">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto print:shadow-none print:max-w-none print:max-h-none print:overflow-visible">
        
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between print:hidden">
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

        {/* Content */}
        <div className="p-6 sm:p-8 space-y-8 print:p-0 print:space-y-6">
          
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
