import React, { useState, useEffect, useRef } from 'react';
import { Search, FileText, Trash2, User, Calendar, Phone, Edit2, Download, Upload, Activity } from 'lucide-react';
import { motion } from 'motion/react';
import { Patient } from '../types';
import { getPatients, deletePatient } from '../lib/storage';
import PatientModal from './PatientModal';
import ReturnAlerts from './ReturnAlerts';
import { formatDateShort } from '../lib/dateUtils';

export default function PatientList({ 
  onEdit, 
  patients, 
  onRefresh 
}: { 
  onEdit: (patient: Patient) => void;
  patients: Patient[];
  onRefresh: () => void;
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o paciente ${name}? Esta ação não pode ser desfeita.`)) {
      await deletePatient(id);
      onRefresh();
    }
  };

  const handleExportBackup = () => {
    const dataStr = JSON.stringify(patients, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const dateStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
    a.download = `medicad-backup-${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const importedData = JSON.parse(event.target?.result as string);
        if (Array.isArray(importedData)) {
          // Merge imported data with existing data
          const existingPatients = await getPatients();
          const mergedPatients = [...existingPatients];
          
          let added = 0;
          let updated = 0;

          importedData.forEach((importedPatient: Patient) => {
            const existingIndex = mergedPatients.findIndex(p => p.id === importedPatient.id);
            if (existingIndex >= 0) {
              // Merge arrays safely for backward compatibility
              mergedPatients[existingIndex] = {
                ...importedPatient,
                historico_clinico: importedPatient.historico_clinico || mergedPatients[existingIndex].historico_clinico || [],
                prescriptions: importedPatient.prescriptions || mergedPatients[existingIndex].prescriptions || [],
                examRequests: importedPatient.examRequests || mergedPatients[existingIndex].examRequests || [],
                certificates: importedPatient.certificates || mergedPatients[existingIndex].certificates || [],
                financeiro: importedPatient.financeiro || mergedPatients[existingIndex].financeiro || [],
              };
              updated++;
            } else {
              // Ensure new patients have the arrays even if from old backup
              mergedPatients.push({
                ...importedPatient,
                historico_clinico: importedPatient.historico_clinico || [],
                prescriptions: importedPatient.prescriptions || [],
                examRequests: importedPatient.examRequests || [],
                certificates: importedPatient.certificates || [],
                financeiro: importedPatient.financeiro || [],
              });
              added++;
            }
          });

          localStorage.setItem('@medicad:patients', JSON.stringify(mergedPatients));
          onRefresh();
          alert(`Backup restaurado com sucesso!\n\n${added} novos pacientes adicionados.\n${updated} pacientes atualizados.`);
        } else {
          alert('Arquivo de backup inválido. Certifique-se de usar o arquivo .json gerado pelo sistema.');
        }
      } catch (error) {
        alert('Erro ao ler o arquivo de backup. O arquivo pode estar corrompido.');
      }
    };
    reader.readAsText(file);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const filteredPatients = patients.filter(p => 
    p.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.cpf.includes(searchTerm)
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <ReturnAlerts patients={patients} />

      {/* Actions & Search Bar */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex flex-col lg:flex-row gap-4 items-center justify-between print:hidden"
      >
        <div className="relative w-full lg:max-w-md">
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
        
        <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-end">
          <div className="text-sm text-slate-500 font-medium hidden sm:block mr-2">
            {filteredPatients.length} {filteredPatients.length === 1 ? 'paciente' : 'pacientes'}
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleExportBackup}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors"
              title="Baixar cópia de segurança"
            >
              <Download className="h-4 w-4" />
              <span className="text-sm">Exportar Backup</span>
            </button>
            
            <input 
              type="file" 
              accept=".json" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleImportBackup}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors"
              title="Restaurar cópia de segurança"
            >
              <Upload className="h-4 w-4" />
              <span className="text-sm">Importar Backup</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Patient Grid */}
      {filteredPatients.length > 0 ? (
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 print:hidden"
        >
          {filteredPatients.map(patient => (
            <motion.div 
              variants={itemVariants}
              key={patient.id} 
              className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col"
            >
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
                      {formatDateShort(patient.birthDate)}
                    </div>
                  )}
                  {patient.historico_clinico && patient.historico_clinico.length > 0 && (
                    <div className="flex items-center text-sm text-slate-600 mt-2">
                      <Activity className="h-4 w-4 mr-2 text-teal-500" />
                      <span className="text-teal-700 font-medium">{patient.historico_clinico.length} {patient.historico_clinico.length === 1 ? 'consulta registrada' : 'consultas registradas'}</span>
                    </div>
                  )}
                  {patient.nextReturn && (
                    <div className="flex items-center text-sm text-amber-700 mt-1 bg-amber-50 px-2 py-1 rounded-md w-fit border border-amber-100">
                      <Calendar className="h-4 w-4 mr-2 text-amber-600" />
                      <span className="font-medium">Retorno: {formatDateShort(patient.nextReturn)}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="bg-slate-50 px-5 py-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => setSelectedPatient(patient)}
                  className="text-sm font-medium text-teal-600 hover:text-teal-700 transition-colors flex items-center gap-1"
                >
                  <FileText className="h-4 w-4" />
                  Abrir Prontuário
                </button>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setSelectedPatient({...patient, _openEvolution: true} as any)}
                    className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                    title="Nova Evolução"
                  >
                    <Activity className="h-4 w-4" />
                  </button>
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
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center print:hidden"
        >
          <div className="mx-auto h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
            <User className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-1">Nenhum paciente encontrado</h3>
          <p className="text-slate-500">
            {searchTerm ? 'Tente buscar com outros termos.' : 'Cadastre seu primeiro paciente na aba "Novo Cadastro".'}
          </p>
        </motion.div>
      )}

      {selectedPatient && (
        <PatientModal 
          patient={selectedPatient} 
          onClose={() => setSelectedPatient(null)} 
          onUpdate={(updated) => {
            setSelectedPatient(updated);
            onRefresh();
          }}
          initialTab={(selectedPatient as any)._openEvolution ? 'history' : 'details'}
          openNewConsultation={(selectedPatient as any)._openEvolution}
        />
      )}
    </div>
  );
}
