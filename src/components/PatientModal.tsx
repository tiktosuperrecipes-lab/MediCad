import React, { useState, useEffect } from 'react';
import { X, Printer, User, MapPin, Activity, FileText, Calendar, Phone, Mail, Plus, Save, Pill, Stethoscope, FileBadge, DollarSign, Trash2 } from 'lucide-react';
import { Patient, Consultation, Prescription, Medication, ExamRequest, Certificate, Budget, BudgetItem, Payment } from '../types';
import { savePatient } from '../lib/storage';
import { getSettings, ClinicSettings } from '../lib/settings';

export default function PatientModal({ 
  patient, 
  onClose,
  onUpdate,
  initialTab = 'details',
  openNewConsultation = false
}: { 
  patient: Patient; 
  onClose: () => void;
  onUpdate: (p: Patient) => void;
  initialTab?: 'details' | 'history' | 'prescriptions' | 'certificates' | 'financial';
  openNewConsultation?: boolean;
}) {
  const [activeTab, setActiveTab] = useState<'details' | 'history' | 'prescriptions' | 'certificates' | 'financial'>(initialTab);
  const [printMode, setPrintMode] = useState<'history' | 'prescription' | 'exam' | 'certificate' | 'details' | 'budget'>('details');
  const [settings, setSettings] = useState<ClinicSettings | null>(null);

  useEffect(() => {
    setSettings(getSettings());
  }, []);
  
  // History State
  const [showNewConsultation, setShowNewConsultation] = useState(openNewConsultation);
  const [consultationForm, setConsultationForm] = useState({
    date: new Date().toISOString().split('T')[0],
    notes: '',
    returnPrediction: 'none'
  });

  // Anamnesis State
  const [anamnesisForm, setAnamnesisForm] = useState({
    qp: patient.qp || '',
    hma: patient.hma || '',
    hpp: patient.hpp || '',
    physicalExam: patient.physicalExam || ''
  });

  // Prescription State
  const [medications, setMedications] = useState<Medication[]>([]);
  const [currentMed, setCurrentMed] = useState({ name: '', posology: '' });
  const [examRequestText, setExamRequestText] = useState('');

  // Certificate State
  const [certificateForm, setCertificateForm] = useState({
    days: 1,
    cid: ''
  });

  // Financial State
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
  const [currentBudgetItem, setCurrentBudgetItem] = useState({ description: '', quantity: 1, unitPrice: 0 });
  const [budgetDiscount, setBudgetDiscount] = useState(0);
  const [printBudgetId, setPrintBudgetId] = useState<string | null>(null);
  
  const [paymentForm, setPaymentForm] = useState({
    amount: 0,
    method: 'pix' as Payment['method'],
    notes: ''
  });

  const handlePrint = (mode: 'history' | 'prescription' | 'exam' | 'certificate' | 'details' | 'budget', callback?: () => void) => {
    setPrintMode(mode);
    setTimeout(() => {
      window.print();
      if (callback) {
        // Add a small delay after print dialog closes before clearing state
        // to ensure the print rendering is completely finished
        setTimeout(callback, 100);
      }
    }, 100);
  };

  const handleSaveAnamnesis = () => {
    const updatedPatient = {
      ...patient,
      ...anamnesisForm
    };
    savePatient(updatedPatient);
    onUpdate(updatedPatient);
    alert('Anamnese salva com sucesso!');
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

  const handleAddMedication = () => {
    if (!currentMed.name.trim() || !currentMed.posology.trim()) return;
    setMedications([...medications, { id: crypto.randomUUID(), ...currentMed }]);
    setCurrentMed({ name: '', posology: '' });
  };

  const handleRemoveMedication = (id: string) => {
    setMedications(medications.filter(m => m.id !== id));
  };

  const handleSavePrescription = () => {
    if (medications.length === 0) {
      alert('Adicione pelo menos um medicamento.');
      return;
    }
    const newPrescription: Prescription = {
      id: crypto.randomUUID(),
      date: new Date().toISOString().split('T')[0],
      medications
    };
    const updatedPatient = {
      ...patient,
      prescriptions: [newPrescription, ...(patient.prescriptions || [])]
    };
    savePatient(updatedPatient);
    onUpdate(updatedPatient);
    handlePrint('prescription', () => setMedications([]));
  };

  const handleSaveExam = () => {
    if (!examRequestText.trim()) {
      alert('Preencha o pedido de exames.');
      return;
    }
    const newExam: ExamRequest = {
      id: crypto.randomUUID(),
      date: new Date().toISOString().split('T')[0],
      requestText: examRequestText
    };
    const updatedPatient = {
      ...patient,
      examRequests: [newExam, ...(patient.examRequests || [])]
    };
    savePatient(updatedPatient);
    onUpdate(updatedPatient);
    handlePrint('exam', () => setExamRequestText(''));
  };

  const handleSaveCertificate = () => {
    const text = `Atesto para os devidos fins que o(a) paciente ${patient.fullName}, portador do CPF ${patient.cpf}, necessita de ${certificateForm.days} dias de repouso a partir desta data por motivos de tratamento odontológico.${certificateForm.cid ? ` CID: ${certificateForm.cid}` : ''}`;
    
    const newCert: Certificate = {
      id: crypto.randomUUID(),
      date: new Date().toISOString().split('T')[0],
      days: certificateForm.days,
      cid: certificateForm.cid,
      text
    };
    const updatedPatient = {
      ...patient,
      certificates: [newCert, ...(patient.certificates || [])]
    };
    savePatient(updatedPatient);
    onUpdate(updatedPatient);
    handlePrint('certificate', () => setCertificateForm({ days: 1, cid: '' }));
  };

  const handleAddBudgetItem = () => {
    if (!currentBudgetItem.description.trim() || currentBudgetItem.quantity <= 0 || currentBudgetItem.unitPrice <= 0) return;
    
    const newItem: BudgetItem = {
      id: crypto.randomUUID(),
      description: currentBudgetItem.description,
      quantity: currentBudgetItem.quantity,
      unitPrice: currentBudgetItem.unitPrice,
      total: currentBudgetItem.quantity * currentBudgetItem.unitPrice
    };
    
    setBudgetItems([...budgetItems, newItem]);
    setCurrentBudgetItem({ description: '', quantity: 1, unitPrice: 0 });
  };

  const handleRemoveBudgetItem = (id: string) => {
    setBudgetItems(budgetItems.filter(item => item.id !== id));
  };

  const handleSaveBudget = () => {
    if (budgetItems.length === 0) {
      alert('Adicione pelo menos um item ao orçamento.');
      return;
    }

    const totalAmount = budgetItems.reduce((sum, item) => sum + item.total, 0);
    const finalAmount = totalAmount - budgetDiscount;

    const newBudget: Budget = {
      id: crypto.randomUUID(),
      date: new Date().toISOString().split('T')[0],
      items: budgetItems,
      totalAmount,
      discount: budgetDiscount,
      finalAmount,
      status: 'pending'
    };

    const updatedPatient = {
      ...patient,
      budgets: [newBudget, ...(patient.budgets || [])]
    };

    savePatient(updatedPatient);
    onUpdate(updatedPatient);
    setBudgetItems([]);
    setBudgetDiscount(0);
    alert('Orçamento salvo com sucesso!');
  };

  const handlePrintCurrentBudget = () => {
    if (budgetItems.length === 0) {
      alert('Adicione pelo menos um item ao orçamento para imprimir.');
      return;
    }
    setPrintBudgetId(null);
    handlePrint('budget');
  };

  const handlePrintSavedBudget = (id: string) => {
    setPrintBudgetId(id);
    handlePrint('budget', () => setPrintBudgetId(null));
  };

  const handleDeleteBudget = (id: string) => {
    const updatedPatient = {
      ...patient,
      budgets: patient.budgets?.filter(b => b.id !== id)
    };
    savePatient(updatedPatient);
    onUpdate(updatedPatient);
  };

  const handleSavePayment = () => {
    if (paymentForm.amount <= 0) {
      alert('O valor do pagamento deve ser maior que zero.');
      return;
    }

    const newPayment: Payment = {
      id: crypto.randomUUID(),
      date: new Date().toISOString().split('T')[0],
      amount: paymentForm.amount,
      method: paymentForm.method,
      notes: paymentForm.notes
    };

    const updatedPatient = {
      ...patient,
      payments: [newPayment, ...(patient.payments || [])]
    };

    savePatient(updatedPatient);
    onUpdate(updatedPatient);
    setPaymentForm({ amount: 0, method: 'pix', notes: '' });
  };

  const handleDeletePayment = (id: string) => {
    const updatedPatient = {
      ...patient,
      payments: patient.payments?.filter(p => p.id !== id)
    };
    savePatient(updatedPatient);
    onUpdate(updatedPatient);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/50 backdrop-blur-sm print:static print:p-0 print:bg-white print:block">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto print:shadow-none print:max-w-none print:max-h-none print:overflow-visible flex flex-col">
        
        {/* Header */}
        <div className="sticky top-0 z-20 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between print:hidden">
          <h2 className="text-xl font-bold text-slate-800">Prontuário Eletrônico: {patient.fullName}</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePrint('details')}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors"
            >
              <Printer className="h-4 w-4" />
              <span className="hidden sm:inline">Imprimir Ficha</span>
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
              <h1 className="text-3xl font-bold text-slate-900">{settings?.name || 'Clínica Médica'}</h1>
              <p className="text-slate-500 mt-1">{settings?.address || 'Endereço não configurado'}</p>
              <p className="text-slate-500">Telefone: {settings?.phone || 'Não configurado'}</p>
            </div>
            <div className="text-right text-sm text-slate-500">
              <p>Data: {new Date().toLocaleDateString('pt-BR')}</p>
              <p>Paciente: {patient.fullName}</p>
              <p>CPF: {patient.cpf}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 sm:px-8 border-b border-slate-200 print:hidden shrink-0 overflow-x-auto">
          <div className="flex gap-6 min-w-max">
            <button 
              onClick={() => setActiveTab('details')}
              className={`py-4 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'details' ? 'border-teal-600 text-teal-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              <User className="h-4 w-4" />
              Dados e Anamnese
            </button>
            <button 
              onClick={() => setActiveTab('history')}
              className={`py-4 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'history' ? 'border-teal-600 text-teal-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              <Activity className="h-4 w-4" />
              Evolução
            </button>
            <button 
              onClick={() => setActiveTab('prescriptions')}
              className={`py-4 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'prescriptions' ? 'border-teal-600 text-teal-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              <Pill className="h-4 w-4" />
              Receitas e Exames
            </button>
            <button 
              onClick={() => setActiveTab('certificates')}
              className={`py-4 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'certificates' ? 'border-teal-600 text-teal-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              <FileBadge className="h-4 w-4" />
              Atestados
            </button>
            <button 
              onClick={() => setActiveTab('financial')}
              className={`py-4 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'financial' ? 'border-teal-600 text-teal-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              <DollarSign className="h-4 w-4" />
              Financeiro
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8 flex-1 print:p-0">
          
          {/* TAB 1: Dados Cadastrais e Anamnese Base */}
          <div className={`${activeTab === 'details' ? 'block' : 'hidden'} ${printMode === 'details' ? 'print:block' : 'print:hidden'} space-y-8`}>
            {/* Dados Pessoais */}
            <section className={printMode !== 'details' ? 'print:hidden' : ''}>
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
            <section className={printMode !== 'details' ? 'print:hidden' : ''}>
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

            {/* Dados Clínicos e Anamnese */}
            <section className={printMode !== 'details' ? 'print:hidden' : ''}>
              <div className="flex items-center justify-between mb-4 border-b border-slate-100 print:border-slate-300 pb-2">
                <div className="flex items-center gap-2 text-teal-700 print:text-slate-800">
                  <Activity className="h-5 w-5" />
                  <h3 className="text-lg font-semibold">Anamnese Base</h3>
                </div>
                <button 
                  onClick={handleSaveAnamnesis}
                  className="print:hidden flex items-center gap-2 px-3 py-1.5 bg-teal-50 text-teal-700 hover:bg-teal-100 font-medium rounded-lg transition-colors text-sm"
                >
                  <Save className="h-4 w-4" />
                  Salvar Anamnese
                </button>
              </div>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Tipo Sanguíneo</p>
                    <p className="font-medium text-slate-900">{patient.bloodType || '-'}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-sm text-slate-500 mb-1">Alergias</p>
                    <p className="font-medium text-slate-900">
                      {patient.hasAllergies ? <span className="text-red-600 print:text-slate-900">{patient.allergiesDetails || 'Sim (não especificado)'}</span> : 'Não possui'}
                    </p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-sm text-slate-500 mb-1">Medicação Contínua</p>
                    <p className="font-medium text-slate-900">
                      {patient.hasMedication ? patient.medicationDetails || 'Sim (não especificado)' : 'Não faz uso'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 pt-4 border-t border-slate-100">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Queixa Principal (QP)</label>
                    <textarea
                      value={anamnesisForm.qp}
                      onChange={(e) => setAnamnesisForm({...anamnesisForm, qp: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none h-24 resize-none print:border-none print:p-0 print:resize-none"
                      placeholder="Qual o motivo principal da consulta?"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">História da Moléstia Atual (HMA)</label>
                    <textarea
                      value={anamnesisForm.hma}
                      onChange={(e) => setAnamnesisForm({...anamnesisForm, hma: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none h-32 resize-none print:border-none print:p-0 print:resize-none"
                      placeholder="Evolução da queixa principal..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">História Patológica Pregressa (HPP / Comorbidades)</label>
                    <textarea
                      value={anamnesisForm.hpp}
                      onChange={(e) => setAnamnesisForm({...anamnesisForm, hpp: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none h-24 resize-none print:border-none print:p-0 print:resize-none"
                      placeholder="Doenças prévias, cirurgias, histórico familiar..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Exame Físico Padrão</label>
                    <textarea
                      value={anamnesisForm.physicalExam}
                      onChange={(e) => setAnamnesisForm({...anamnesisForm, physicalExam: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none h-32 resize-none print:border-none print:p-0 print:resize-none"
                      placeholder="Sinais vitais, inspeção, palpação..."
                    />
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* TAB 2: Evolução/Histórico de Consultas */}
          <div className={`${activeTab === 'history' ? 'block' : 'hidden'} ${printMode === 'history' ? 'print:block' : 'print:hidden'} print:mt-12`}>
            <div className={`flex items-center justify-between mb-6 print:hidden ${printMode !== 'history' ? 'hidden' : ''}`}>
              <h3 className="text-lg font-semibold text-slate-800">Histórico de Consultas</h3>
              <div className="flex gap-2">
                <button 
                  onClick={() => handlePrint('history')}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors"
                >
                  <Printer className="h-4 w-4" />
                  Imprimir Histórico
                </button>
                {!showNewConsultation && (
                  <button 
                    onClick={() => setShowNewConsultation(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    Registrar Evolução
                  </button>
                )}
              </div>
            </div>

            <div className={`hidden print:block border-b-2 border-slate-800 pb-2 mb-6 ${printMode !== 'history' ? 'print:hidden' : ''}`}>
              <h3 className="text-xl font-bold text-slate-900">Evolução Clínica (Prontuário)</h3>
            </div>

            {showNewConsultation && (
              <div className="bg-teal-50/50 p-5 rounded-xl border border-teal-100 mb-8 print:hidden animate-in fade-in slide-in-from-top-4">
                <h4 className="font-medium text-teal-900 mb-4">Nova Evolução</h4>
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
                      Salvar Evolução
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className={`space-y-6 border-l-2 border-teal-100 pl-4 ml-2 print:border-slate-300 ${printMode !== 'history' && printMode !== 'details' ? 'print:hidden' : ''}`}>
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
                  Nenhuma evolução registrada.
                </div>
              )}
            </div>
          </div>

          {/* TAB 3: Receituário e Pedido de Exames */}
          <div className={`${activeTab === 'prescriptions' ? 'block' : 'hidden'} ${printMode === 'prescription' || printMode === 'exam' ? 'print:block' : 'print:hidden'}`}>
            
            {/* Receituário */}
            <div className={`mb-12 ${printMode === 'exam' ? 'print:hidden' : ''}`}>
              <div className="flex items-center justify-between mb-6 print:hidden">
                <h3 className="text-lg font-semibold text-slate-800">Receituário</h3>
                <button 
                  onClick={handleSavePrescription}
                  className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  <Printer className="h-4 w-4" />
                  Imprimir Receita
                </button>
              </div>

              <div className="hidden print:block border-b-2 border-slate-800 pb-2 mb-6">
                <h3 className="text-2xl font-bold text-slate-900 text-center">RECEITUÁRIO</h3>
              </div>

              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 mb-6 print:hidden">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Medicamento</label>
                    <input
                      type="text"
                      value={currentMed.name}
                      onChange={(e) => setCurrentMed({...currentMed, name: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                      placeholder="Ex: Amoxicilina 500mg"
                    />
                  </div>
                  <div className="md:col-span-2 flex gap-2">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Posologia</label>
                      <input
                        type="text"
                        value={currentMed.posology}
                        onChange={(e) => setCurrentMed({...currentMed, posology: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                        placeholder="Ex: Tomar 1 comprimido de 8 em 8 horas por 7 dias"
                        onKeyDown={(e) => e.key === 'Enter' && handleAddMedication()}
                      />
                    </div>
                    <button 
                      onClick={handleAddMedication}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-lg transition-colors h-[42px]"
                    >
                      Adicionar
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {medications.map((med, index) => (
                  <div key={med.id} className="flex items-start justify-between p-4 bg-white border border-slate-200 rounded-lg print:border-none print:p-0 print:mb-6">
                    <div>
                      <h4 className="font-bold text-slate-900 text-lg">{index + 1}. {med.name}</h4>
                      <p className="text-slate-700 mt-1 ml-4">Uso: {med.posology}</p>
                    </div>
                    <button 
                      onClick={() => handleRemoveMedication(med.id)}
                      className="text-red-500 hover:text-red-700 print:hidden p-2"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                ))}
                {medications.length === 0 && (
                  <p className="text-slate-500 text-center py-4 print:hidden">Nenhum medicamento adicionado.</p>
                )}
              </div>
            </div>

            {/* Pedido de Exames */}
            <div className={`border-t border-slate-200 pt-8 print:border-none print:pt-0 ${printMode === 'prescription' ? 'print:hidden' : ''}`}>
              <div className="flex items-center justify-between mb-6 print:hidden">
                <h3 className="text-lg font-semibold text-slate-800">Pedido de Exames</h3>
                <button 
                  onClick={handleSaveExam}
                  className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  <Printer className="h-4 w-4" />
                  Imprimir Exames
                </button>
              </div>

              <div className="hidden print:block border-b-2 border-slate-800 pb-2 mb-6">
                <h3 className="text-2xl font-bold text-slate-900 text-center">PEDIDO DE EXAMES</h3>
              </div>

              <div className="print:hidden">
                <textarea
                  value={examRequestText}
                  onChange={(e) => setExamRequestText(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none h-48 resize-none"
                  placeholder="Solicito os seguintes exames:&#10;1. Hemograma completo&#10;2. Glicemia de jejum..."
                />
              </div>
              
              <div className="hidden print:block whitespace-pre-wrap text-slate-900 text-lg leading-relaxed">
                {examRequestText}
              </div>
            </div>
          </div>

          {/* TAB 4: Atestados */}
          <div className={`${activeTab === 'certificates' ? 'block' : 'hidden'} ${printMode === 'certificate' ? 'print:block' : 'print:hidden'}`}>
            <div className="flex items-center justify-between mb-6 print:hidden">
              <h3 className="text-lg font-semibold text-slate-800">Atestado Odontológico</h3>
              <button 
                onClick={handleSaveCertificate}
                className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <Printer className="h-4 w-4" />
                Imprimir Atestado
              </button>
            </div>

            <div className="hidden print:block border-b-2 border-slate-800 pb-2 mb-12">
              <h3 className="text-2xl font-bold text-slate-900 text-center">ATESTADO ODONTOLÓGICO</h3>
            </div>

            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 mb-8 print:hidden">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Dias de Repouso</label>
                  <input
                    type="number"
                    min="1"
                    value={certificateForm.days}
                    onChange={(e) => setCertificateForm({...certificateForm, days: parseInt(e.target.value) || 1})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">CID (Opcional)</label>
                  <input
                    type="text"
                    value={certificateForm.cid}
                    onChange={(e) => setCertificateForm({...certificateForm, cid: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none uppercase"
                    placeholder="Ex: K04.0"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white p-8 border border-slate-200 rounded-xl print:border-none print:p-0 text-lg leading-loose text-slate-900 text-justify">
              Atesto para os devidos fins que o(a) paciente <strong>{patient.fullName}</strong>, 
              portador(a) do CPF <strong>{patient.cpf}</strong>, necessita de <strong>{certificateForm.days}</strong> {certificateForm.days === 1 ? 'dia' : 'dias'} de repouso 
              a partir desta data por motivos de tratamento odontológico.
              {certificateForm.cid && <span> CID: <strong>{certificateForm.cid}</strong>.</span>}
            </div>
          </div>

          {/* TAB 5: Financeiro */}
          <div className={`${activeTab === 'financial' ? 'block' : 'hidden'} ${printMode === 'budget' ? 'print:block' : 'print:hidden'}`}>
            
            {/* Orçamentos */}
            <div className="mb-12">
              <div className="flex items-center justify-between mb-6 print:hidden">
                <h3 className="text-lg font-semibold text-slate-800">Orçamento</h3>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={handleSaveBudget}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors"
                  >
                    <Save className="h-4 w-4" />
                    Salvar Orçamento
                  </button>
                  <button 
                    onClick={handlePrintCurrentBudget}
                    className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    <Printer className="h-4 w-4" />
                    Imprimir Orçamento
                  </button>
                </div>
              </div>

              <div className="hidden print:block border-b-2 border-slate-800 pb-2 mb-6">
                <h3 className="text-2xl font-bold text-slate-900 text-center">ORÇAMENTO</h3>
              </div>

              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 mb-6 print:hidden">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                  <div className="md:col-span-6">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Procedimento / Item</label>
                    <input
                      type="text"
                      value={currentBudgetItem.description}
                      onChange={(e) => setCurrentBudgetItem({...currentBudgetItem, description: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                      placeholder="Ex: Restauração Resina"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Qtd</label>
                    <input
                      type="number"
                      min="1"
                      value={currentBudgetItem.quantity}
                      onChange={(e) => setCurrentBudgetItem({...currentBudgetItem, quantity: parseInt(e.target.value) || 1})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Valor Unit. (R$)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={currentBudgetItem.unitPrice}
                      onChange={(e) => setCurrentBudgetItem({...currentBudgetItem, unitPrice: parseFloat(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <button 
                      onClick={handleAddBudgetItem}
                      className="w-full px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-lg transition-colors h-[42px]"
                    >
                      Adicionar
                    </button>
                  </div>
                </div>
              </div>

              {(() => {
                const budgetToPrint = printBudgetId ? patient.budgets?.find(b => b.id === printBudgetId) : null;
                const displayItems = budgetToPrint ? budgetToPrint.items : budgetItems;
                const displayDiscount = budgetToPrint ? budgetToPrint.discount : budgetDiscount;
                
                if (displayItems.length === 0) return null;

                return (
                  <div className="bg-white border border-slate-200 rounded-lg overflow-hidden mb-6 print:border-none">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 print:bg-transparent print:border-slate-800">
                          <th className="p-4 font-semibold text-slate-700">Procedimento / Item</th>
                          <th className="p-4 font-semibold text-slate-700 text-center">Qtd</th>
                          <th className="p-4 font-semibold text-slate-700 text-right">Valor Unit.</th>
                          <th className="p-4 font-semibold text-slate-700 text-right">Total</th>
                          {!budgetToPrint && <th className="p-4 print:hidden"></th>}
                        </tr>
                      </thead>
                      <tbody>
                        {displayItems.map((item) => (
                          <tr key={item.id} className="border-b border-slate-100 last:border-0 print:border-slate-200">
                            <td className="p-4 text-slate-800">{item.description}</td>
                            <td className="p-4 text-slate-800 text-center">{item.quantity}</td>
                            <td className="p-4 text-slate-800 text-right">{formatCurrency(item.unitPrice)}</td>
                            <td className="p-4 text-slate-800 text-right font-medium">{formatCurrency(item.total)}</td>
                            {!budgetToPrint && (
                              <td className="p-4 text-right print:hidden">
                                <button 
                                  onClick={() => handleRemoveBudgetItem(item.id)}
                                  className="text-red-500 hover:text-red-700 p-1"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-slate-50 print:bg-transparent">
                        <tr>
                          <td colSpan={3} className="p-4 text-right font-semibold text-slate-700">Subtotal:</td>
                          <td className="p-4 text-right font-bold text-slate-900">
                            {formatCurrency(displayItems.reduce((sum, item) => sum + item.total, 0))}
                          </td>
                          {!budgetToPrint && <td className="print:hidden"></td>}
                        </tr>
                        {!budgetToPrint && (
                          <tr className="print:hidden">
                            <td colSpan={3} className="p-4 text-right font-semibold text-slate-700 align-middle">Desconto (R$):</td>
                            <td className="p-4">
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={budgetDiscount}
                                onChange={(e) => setBudgetDiscount(parseFloat(e.target.value) || 0)}
                                className="w-full px-3 py-1 border border-slate-300 rounded focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-right"
                              />
                            </td>
                            <td></td>
                          </tr>
                        )}
                        {displayDiscount > 0 && (
                          <tr className={budgetToPrint ? "" : "hidden print:table-row"}>
                            <td colSpan={3} className="p-4 text-right font-semibold text-slate-700">Desconto:</td>
                            <td className="p-4 text-right font-bold text-red-600">
                              - {formatCurrency(displayDiscount)}
                            </td>
                          </tr>
                        )}
                        <tr>
                          <td colSpan={3} className="p-4 text-right font-bold text-slate-900 text-lg">Total Final:</td>
                          <td className="p-4 text-right font-bold text-teal-700 text-lg">
                            {formatCurrency(displayItems.reduce((sum, item) => sum + item.total, 0) - displayDiscount)}
                          </td>
                          {!budgetToPrint && <td className="print:hidden"></td>}
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                );
              })()}
            </div>

            {/* Pagamentos */}
            <div className="border-t border-slate-200 pt-8 print:hidden">
              <h3 className="text-lg font-semibold text-slate-800 mb-6">Registrar Pagamento</h3>
              
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                  <div className="md:col-span-3">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Valor (R$)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={paymentForm.amount}
                      onChange={(e) => setPaymentForm({...paymentForm, amount: parseFloat(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                    />
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Forma de Pagamento</label>
                    <select
                      value={paymentForm.method}
                      onChange={(e) => setPaymentForm({...paymentForm, method: e.target.value as Payment['method']})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none bg-white"
                    >
                      <option value="pix">PIX</option>
                      <option value="credit">Cartão de Crédito</option>
                      <option value="debit">Cartão de Débito</option>
                      <option value="cash">Dinheiro</option>
                      <option value="transfer">Transferência</option>
                    </select>
                  </div>
                  <div className="md:col-span-4">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Observações (Opcional)</label>
                    <input
                      type="text"
                      value={paymentForm.notes}
                      onChange={(e) => setPaymentForm({...paymentForm, notes: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                      placeholder="Ex: Parcela 1/3"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <button 
                      onClick={handleSavePayment}
                      className="w-full px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg transition-colors h-[42px]"
                    >
                      Registrar
                    </button>
                  </div>
                </div>
              </div>

              {/* Histórico Financeiro */}
              <div className="space-y-6">
                <h4 className="font-semibold text-slate-800">Histórico Financeiro</h4>
                
                {(!patient.budgets?.length && !patient.payments?.length) ? (
                  <p className="text-slate-500 text-center py-8 bg-slate-50 rounded-lg border border-slate-200">
                    Nenhum registro financeiro encontrado.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {/* Pagamentos */}
                    {patient.payments?.map((payment) => (
                      <div key={payment.id} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-lg border-l-4 border-l-green-500">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">Pagamento Recebido</span>
                            <span className="text-sm text-slate-500">
                              {new Date(payment.date).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                          <div className="text-sm text-slate-600 mt-1 flex items-center gap-2">
                            <span className="capitalize">{payment.method}</span>
                            {payment.notes && (
                              <>
                                <span>•</span>
                                <span>{payment.notes}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-lg font-bold text-green-600">
                            + {formatCurrency(payment.amount)}
                          </div>
                          <button
                            onClick={() => handleDeletePayment(payment.id)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Excluir Pagamento"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Orçamentos Salvos */}
                    {patient.budgets?.map((budget) => (
                      <div key={budget.id} className="p-4 bg-white border border-slate-200 rounded-lg border-l-4 border-l-blue-500">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">Orçamento Gerado</span>
                            <span className="text-sm text-slate-500">
                              {new Date(budget.date).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-blue-600">
                              {formatCurrency(budget.finalAmount)}
                            </span>
                            <button
                              onClick={() => handlePrintSavedBudget(budget.id)}
                              className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                              title="Imprimir Orçamento"
                            >
                              <Printer className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteBudget(budget.id)}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Excluir Orçamento"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        <div className="text-sm text-slate-600 mt-2">
                          <ul className="list-disc list-inside space-y-1">
                            {budget.items.map((item, idx) => (
                              <li key={idx} className="truncate">
                                {item.quantity}x {item.description} - {formatCurrency(item.unitPrice)}
                              </li>
                            ))}
                          </ul>
                          {budget.discount > 0 && (
                            <div className="mt-2 text-red-500 font-medium">
                              Desconto aplicado: {formatCurrency(budget.discount)}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Print Footer */}
          <div className="hidden print:block mt-32 pt-8 text-center">
            <div className="w-80 mx-auto border-b border-slate-800 mb-2"></div>
            <p className="text-base text-slate-800 font-medium">{settings?.doctorName || 'Assinatura do(a) Profissional'}</p>
            <p className="text-sm text-slate-600">{settings?.crm || 'CRM/CRO'}</p>
          </div>

        </div>
      </div>
    </div>
  );
}
