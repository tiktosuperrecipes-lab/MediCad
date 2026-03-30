import React, { useState, useEffect } from 'react';
import { Search, FileText, Trash2, User, Calendar, Phone, Edit2 } from 'lucide-react';
import { Patient } from '../types';
import { getPatients, deletePatient } from '../lib/storage';
import PatientModal from './PatientModal';

export default function PatientList({ onEdit }: { onEdit: (patient: Patient) => void }) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  useEffect(() => {
    setPatients(getPatients());
  }, []);

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o paciente ${name}? Esta ação não pode ser desfeita.`)) {
      deletePatient(id);
      setPatients(getPatients());
    }
  };

  const filteredPatients = patients.filter(p => 
    p.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.cpf.includes(searchTerm)
  );

  return (
    <div className="max-w-6xl mx-auto">
      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between print:hidden">
        <div className="relative w-full sm:max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Buscar por nome ou CPF..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
          />
        </div>
        <div className="text-sm text-slate-500 font-medium">
          {filteredPatients.length} {filteredPatients.length === 1 ? 'paciente encontrado' : 'pacientes encontrados'}
        </div>
      </div>

      {/* Patient Grid */}
      {filteredPatients.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 print:hidden">
          {filteredPatients.map(patient => (
            <div key={patient.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col">
              <div className="p-5 flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div className="h-12 w-12 bg-teal-50 rounded-full flex items-center justify-center text-teal-600 shrink-0">
                    <User className="h-6 w-6" />
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    patient.serviceType === 'Particular' 
                      ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}>
                    {patient.serviceType}
                  </span>
                </div>
                
                <h3 className="text-lg font-semibold text-slate-800 mb-1 line-clamp-1" title={patient.fullName}>
                  {patient.fullName}
                </h3>
                
                <div className="space-y-2 mt-4">
                  <div className="flex items-center text-sm text-slate-600">
                    <FileText className="h-4 w-4 mr-2 text-slate-400" />
                    {patient.cpf}
                  </div>
                  <div className="flex items-center text-sm text-slate-600">
                    <Phone className="h-4 w-4 mr-2 text-slate-400" />
                    {patient.whatsapp}
                  </div>
                  {patient.birthDate && (
                    <div className="flex items-center text-sm text-slate-600">
                      <Calendar className="h-4 w-4 mr-2 text-slate-400" />
                      {new Date(patient.birthDate).toLocaleDateString('pt-BR')}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="bg-slate-50 px-5 py-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => setSelectedPatient(patient)}
                  className="text-sm font-medium text-teal-600 hover:text-teal-700 transition-colors"
                >
                  Ver Detalhes
                </button>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onEdit(patient)}
                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Editar paciente"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(patient.id, patient.fullName)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Excluir paciente"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center print:hidden">
          <div className="mx-auto h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
            <User className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-1">Nenhum paciente encontrado</h3>
          <p className="text-slate-500">
            {searchTerm ? 'Tente buscar com outros termos.' : 'Cadastre seu primeiro paciente na aba "Novo Cadastro".'}
          </p>
        </div>
      )}

      {selectedPatient && (
        <PatientModal 
          patient={selectedPatient} 
          onClose={() => setSelectedPatient(null)} 
        />
      )}
    </div>
  );
}
