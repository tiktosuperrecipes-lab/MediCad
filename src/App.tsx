import { useState, useEffect } from 'react';
import { Activity, Users, UserPlus, Settings as SettingsIcon, DollarSign, Calendar, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import PatientForm from './components/PatientForm';
import PatientList from './components/PatientList';
import Settings from './components/Settings';
import FinancialDashboard from './components/FinancialDashboard';
import Agenda from './components/Agenda';
import ReturnsList from './components/ReturnsList';
import Login from './components/Login';
import { Patient } from './types';
import { getPatients } from './lib/storage';
import { getSettings, ClinicSettings } from './lib/settings';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<'form' | 'list' | 'settings' | 'financial' | 'agenda' | 'returns'>('agenda');
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [clinicSettings, setClinicSettings] = useState<ClinicSettings | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      refreshPatients();
      loadSettings();
    }
  }, [isAuthenticated]);

  const loadSettings = async () => {
    const data = await getSettings();
    setClinicSettings(data);
  };

  const refreshPatients = async () => {
    const data = await getPatients();
    setPatients(data);
  };

  if (!isAuthenticated) {
    return <Login onLogin={() => setIsAuthenticated(true)} />;
  }

  const handleTabChange = (tab: 'form' | 'list' | 'settings' | 'financial' | 'agenda' | 'returns') => {
    setActiveTab(tab);
    if (tab !== 'form') {
      setEditingPatient(null);
    }
    // Refresh patients when switching to list, financial, agenda or returns to ensure data is up to date
    if (tab === 'list' || tab === 'financial' || tab === 'agenda' || tab === 'returns') {
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

  const pageVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
    exit: { opacity: 0, y: -10, transition: { duration: 0.2, ease: 'easeIn' } }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Header */}
      <header className="bg-teal-700 text-white shadow-md print:hidden sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <Activity className="h-8 w-8 text-teal-200" />
              <h1 className="text-xl font-bold tracking-tight">
                {clinicSettings?.name || 'MediCad'}
              </h1>
            </div>
            <nav className="flex gap-2 sm:gap-4 overflow-x-auto pb-1 sm:pb-0 hide-scrollbar">
              <button
                onClick={() => handleTabChange('agenda')}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === 'agenda' ? 'bg-teal-800 text-white' : 'text-teal-100 hover:bg-teal-600'
                }`}
              >
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline">Agenda</span>
              </button>
              <button
                onClick={() => handleTabChange('form')}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === 'form' ? 'bg-teal-800 text-white' : 'text-teal-100 hover:bg-teal-600'
                }`}
              >
                <UserPlus className="h-4 w-4" />
                <span className="hidden sm:inline">Novo Cadastro</span>
              </button>
              <button
                onClick={() => handleTabChange('list')}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === 'list' ? 'bg-teal-800 text-white' : 'text-teal-100 hover:bg-teal-600'
                }`}
              >
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Pacientes</span>
              </button>
              <button
                onClick={() => handleTabChange('returns')}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === 'returns' ? 'bg-teal-800 text-white' : 'text-teal-100 hover:bg-teal-600'
                }`}
              >
                <MessageSquare className="h-4 w-4" />
                <span className="hidden sm:inline">Retornos</span>
              </button>
              <button
                onClick={() => handleTabChange('financial')}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === 'financial' ? 'bg-teal-800 text-white' : 'text-teal-100 hover:bg-teal-600'
                }`}
              >
                <DollarSign className="h-4 w-4" />
                <span className="hidden sm:inline">Financeiro</span>
              </button>
              <button
                onClick={() => handleTabChange('settings')}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
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
        <AnimatePresence mode="wait">
          {activeTab === 'form' && (
            <motion.div key="form" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="print:hidden">
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
            </motion.div>
          )}
          {activeTab === 'list' && (
            <motion.div key="list" variants={pageVariants} initial="initial" animate="animate" exit="exit">
              <div className="mb-8 print:hidden">
                <h2 className="text-2xl font-bold text-slate-800">Lista de Pacientes</h2>
                <p className="text-slate-500">Gerencie os pacientes cadastrados no sistema.</p>
              </div>
              <PatientList 
                patients={patients} 
                onEdit={handleEdit} 
                onRefresh={refreshPatients} 
              />
            </motion.div>
          )}
          {activeTab === 'agenda' && (
            <motion.div key="agenda" variants={pageVariants} initial="initial" animate="animate" exit="exit">
              <Agenda patients={patients} />
            </motion.div>
          )}
          {activeTab === 'returns' && (
            <motion.div key="returns" variants={pageVariants} initial="initial" animate="animate" exit="exit">
              <ReturnsList patients={patients} clinicSettings={clinicSettings} />
            </motion.div>
          )}
          {activeTab === 'financial' && (
            <motion.div key="financial" variants={pageVariants} initial="initial" animate="animate" exit="exit">
              <FinancialDashboard patients={patients} onRefresh={refreshPatients} />
            </motion.div>
          )}
          {activeTab === 'settings' && (
            <motion.div key="settings" variants={pageVariants} initial="initial" animate="animate" exit="exit">
              <div className="mb-8 print:hidden">
                <h2 className="text-2xl font-bold text-slate-800">Configurações</h2>
                <p className="text-slate-500">Personalize os dados da clínica para os cabeçalhos de impressão.</p>
              </div>
              <Settings onSave={loadSettings} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

