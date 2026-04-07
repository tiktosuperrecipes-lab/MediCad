import { useState, useEffect } from 'react';
import { Activity, Users, UserPlus, Settings as SettingsIcon, DollarSign } from 'lucide-react';
import PatientForm from './components/PatientForm';
import PatientList from './components/PatientList';
import Settings from './components/Settings';
import FinancialDashboard from './components/FinancialDashboard';
import Login from './components/Login';
import { Patient } from './types';
import { getPatients } from './lib/storage';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<'form' | 'list' | 'settings' | 'financial'>('form');
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);

  useEffect(() => {
    if (isAuthenticated) {
      refreshPatients();
    }
  }, [isAuthenticated]);

  const refreshPatients = async () => {
    const data = await getPatients();
    setPatients(data);
  };

  if (!isAuthenticated) {
    return <Login onLogin={() => setIsAuthenticated(true)} />;
  }

  const handleTabChange = (tab: 'form' | 'list' | 'settings' | 'financial') => {
    setActiveTab(tab);
    if (tab !== 'form') {
      setEditingPatient(null);
    }
    // Refresh patients when switching to list or financial to ensure data is up to date
    if (tab === 'list' || tab === 'financial') {
      refreshPatients();
    }
  };

  const handleEdit = (patient: Patient) => {
    setEditingPatient(patient);
    setActiveTab('form');
  };

  const handleFormSuccess = () => {
    refreshPatients();
    handleTabChange('list');
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
              <button
                onClick={() => handleTabChange('financial')}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'financial' ? 'bg-teal-800 text-white' : 'text-teal-100 hover:bg-teal-600'
                }`}
              >
                <DollarSign className="h-4 w-4" />
                <span className="hidden sm:inline">Financeiro</span>
              </button>
              <button
                onClick={() => handleTabChange('settings')}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'settings' ? 'bg-teal-800 text-white' : 'text-teal-100 hover:bg-teal-600'
                }`}
              >
                <SettingsIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Configurações</span>
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
              onSuccess={handleFormSuccess} 
            />
          </div>
        ) : activeTab === 'list' ? (
          <div>
            <div className="mb-8 print:hidden">
              <h2 className="text-2xl font-bold text-slate-800">Lista de Pacientes</h2>
              <p className="text-slate-500">Gerencie os pacientes cadastrados no sistema.</p>
            </div>
            <PatientList 
              patients={patients} 
              onEdit={handleEdit} 
              onRefresh={refreshPatients} 
            />
          </div>
        ) : activeTab === 'financial' ? (
          <FinancialDashboard patients={patients} />
        ) : (
          <div>
            <div className="mb-8 print:hidden">
              <h2 className="text-2xl font-bold text-slate-800">Configurações</h2>
              <p className="text-slate-500">Personalize os dados da clínica para os cabeçalhos de impressão.</p>
            </div>
            <Settings />
          </div>
        )}
      </main>
    </div>
  );
}
