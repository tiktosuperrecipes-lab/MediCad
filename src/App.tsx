import { useState } from 'react';
import { Activity, Users, UserPlus } from 'lucide-react';
import PatientForm from './components/PatientForm';
import PatientList from './components/PatientList';
import { Patient } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<'form' | 'list'>('form');
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);

  const handleTabChange = (tab: 'form' | 'list') => {
    setActiveTab(tab);
    if (tab === 'list') {
      setEditingPatient(null);
    }
  };

  const handleEdit = (patient: Patient) => {
    setEditingPatient(patient);
    setActiveTab('form');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Header */}
      <header className="bg-teal-700 text-white shadow-md print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <Activity className="h-8 w-8 text-teal-200" />
              <h1 className="text-xl font-bold tracking-tight">MediCad</h1>
            </div>
            <nav className="flex gap-2 sm:gap-4">
              <button
                onClick={() => handleTabChange('form')}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'form' ? 'bg-teal-800 text-white' : 'text-teal-100 hover:bg-teal-600'
                }`}
              >
                <UserPlus className="h-4 w-4" />
                <span className="hidden sm:inline">Novo Cadastro</span>
              </button>
              <button
                onClick={() => handleTabChange('list')}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'list' ? 'bg-teal-800 text-white' : 'text-teal-100 hover:bg-teal-600'
                }`}
              >
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Pacientes</span>
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 print:p-0 print:py-0">
        {activeTab === 'form' ? (
          <div className="print:hidden">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-800">
                {editingPatient ? 'Editar Paciente' : 'Novo Paciente'}
              </h2>
              <p className="text-slate-500">
                {editingPatient ? 'Atualize os dados do paciente abaixo.' : 'Preencha os dados abaixo para cadastrar um novo paciente.'}
              </p>
            </div>
            <PatientForm 
              initialData={editingPatient}
              onSuccess={() => handleTabChange('list')} 
            />
          </div>
        ) : (
          <div>
            <div className="mb-8 print:hidden">
              <h2 className="text-2xl font-bold text-slate-800">Lista de Pacientes</h2>
              <p className="text-slate-500">Gerencie os pacientes cadastrados no sistema.</p>
            </div>
            <PatientList onEdit={handleEdit} />
          </div>
        )}
      </main>
    </div>
  );
}
