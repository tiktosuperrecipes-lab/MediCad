import React, { useState, useEffect } from 'react';
import { X, Printer, User, MapPin, Activity, FileText, Calendar, Phone, Mail, Plus, Save, Pill, Stethoscope, FileBadge, DollarSign, Trash2, Image as ImageIcon, Upload, Maximize2, Edit2, FileX } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Patient, Consultation, Prescription, Medication, ExamRequest, Certificate, Budget, BudgetItem, Payment, PatientPhoto } from '../types';
import { savePatient, addClinicalEvolution, addFinancialRecord, addPatientPhoto, removePatientPhoto, addGlobalFinancialRecord, updateGlobalFinancialRecordReceipt } from '../lib/storage';
import { getSettings, ClinicSettings } from '../lib/settings';
import { getLocalDateString, formatDateShort, formatDateLong } from '../lib/dateUtils';
import { compressImage } from '../lib/imageUtils';

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
  const [printMode, setPrintMode] = useState<'history' | 'prescription' | 'exam' | 'certificate' | 'details' | 'budget' | 'receipt'>('details');
  const [settings, setSettings] = useState<ClinicSettings | null>(null);

  useEffect(() => {
    getSettings().then(setSettings);
  }, []);
  
  // History State
  const [showNewConsultation, setShowNewConsultation] = useState(openNewConsultation);
  const [consultationForm, setConsultationForm] = useState({
    date: getLocalDateString(),
    notes: '',
    returnPrediction: 'none',
    amount: '',
    paymentMethod: ''
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
  const [printReceiptPaymentId, setPrintReceiptPaymentId] = useState<string | null>(null);
  
  // Photo Gallery State
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [viewingPhoto, setViewingPhoto] = useState<string | PatientPhoto | null>(null);
  const [pendingPhoto, setPendingPhoto] = useState<{base64: string, description: string, linkedConsultation: string} | null>(null);
  const [isEditingPhotoDetails, setIsEditingPhotoDetails] = useState(false);
  const [editPhotoForm, setEditPhotoForm] = useState({ description: '', linkedConsultation: '' });
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [paymentForm, setPaymentForm] = useState({
    amount: 0,
    method: 'pix' as Payment['method'],
    notes: '',
    receiptIssued: false
  });

  const handlePrint = (mode: 'history' | 'prescription' | 'exam' | 'certificate' | 'details' | 'budget' | 'receipt', callback?: () => void) => {
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

  const handleSaveConsultation = async () => {
    if (!consultationForm.notes.trim()) {
      alert('Por favor, preencha as anotações da consulta.');
      return;
    }

    try {
      // Usando arrayUnion conforme solicitado no PASSO 2
      await addClinicalEvolution(patient.id, consultationForm.notes);
      
      // Atualizando o estado local para refletir a mudança imediatamente
      const timestamp = new Date().toLocaleString('pt-BR');
      const evolutionEntry = `${timestamp}: ${consultationForm.notes}`;
      
      let newPayment: any = null;
      if (consultationForm.amount && parseFloat(consultationForm.amount) > 0) {
        const paymentId = crypto.randomUUID();
        const amount = parseFloat(consultationForm.amount);
        const method = consultationForm.paymentMethod || 'Não informado';
        const procedure = consultationForm.notes.substring(0, 100) + (consultationForm.notes.length > 100 ? '...' : '');
        
        newPayment = {
          id: paymentId,
          date: consultationForm.date,
          amount: amount,
          method: method.toLowerCase().includes('pix') ? 'pix' : 
                  method.toLowerCase().includes('cartão') ? 'credit' : 
                  method.toLowerCase().includes('dinheiro') ? 'cash' : 'transfer',
          notes: `Evolução: ${procedure}`,
          status: 'Pendente',
          receiptIssued: false,
          recordType: 'payment'
        };
        
        await addFinancialRecord(patient.id, newPayment);
      }

      const updatedPatient = {
        ...patient,
        historico_clinico: [evolutionEntry, ...(patient.historico_clinico || [])],
        financeiro: newPayment ? [newPayment, ...(patient.financeiro || [])] : patient.financeiro
      };

      onUpdate(updatedPatient);
      setShowNewConsultation(false);
      setConsultationForm({ 
        date: getLocalDateString(), 
        notes: '', 
        returnPrediction: 'none',
        amount: '',
        paymentMethod: ''
      });
      alert('Evolução salva com sucesso!');
    } catch (error) {
      alert('Erro ao salvar evolução.');
    }
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
      date: getLocalDateString(),
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
      date: getLocalDateString(),
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
      date: getLocalDateString(),
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

  const handleSaveBudget = async () => {
    if (budgetItems.length === 0) {
      alert('Adicione pelo menos um item ao orçamento.');
      return;
    }

    const totalAmount = budgetItems.reduce((sum, item) => sum + item.total, 0);
    const finalAmount = totalAmount - budgetDiscount;

    const newBudget: Budget & { recordType: 'budget' } = {
      id: crypto.randomUUID(),
      date: getLocalDateString(),
      items: budgetItems,
      totalAmount,
      discount: budgetDiscount,
      finalAmount,
      status: 'pending',
      recordType: 'budget'
    };

    try {
      await addFinancialRecord(patient.id, newBudget);
      
      const updatedPatient = {
        ...patient,
        financeiro: [newBudget, ...(patient.financeiro || [])]
      };

      onUpdate(updatedPatient);
      setBudgetItems([]);
      setBudgetDiscount(0);
      alert('Orçamento salvo com sucesso no Firebase!');
    } catch (error) {
      alert('Erro ao salvar orçamento no Firebase.');
    }
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
      budgets: patient.budgets?.filter(b => b.id !== id),
      financeiro: patient.financeiro?.filter((f: any) => f.id !== id)
    };
    savePatient(updatedPatient);
    onUpdate(updatedPatient);
  };

  const handleSavePayment = async () => {
    if (paymentForm.amount <= 0) {
      alert('O valor do pagamento deve ser maior que zero.');
      return;
    }

    const newPayment: Payment & { recordType: 'payment' } = {
      id: crypto.randomUUID(),
      date: getLocalDateString(),
      amount: paymentForm.amount,
      method: paymentForm.method,
      notes: paymentForm.notes,
      status: 'Pendente',
      receiptIssued: paymentForm.receiptIssued,
      receiptDate: paymentForm.receiptIssued ? getLocalDateString() : undefined,
      recordType: 'payment'
    };

    try {
      await addFinancialRecord(patient.id, newPayment);
      
      const updatedPatient = {
        ...patient,
        financeiro: [newPayment, ...(patient.financeiro || [])]
      };

      onUpdate(updatedPatient);
      setPaymentForm({ amount: 0, method: 'pix', notes: '', receiptIssued: false });
      alert('Pagamento registrado com sucesso no Firebase!');
    } catch (error) {
      alert('Erro ao registrar pagamento no Firebase.');
    }
  };

  const handleDeletePayment = (id: string) => {
    const updatedPatient = {
      ...patient,
      payments: patient.payments?.filter(p => p.id !== id),
      financeiro: patient.financeiro?.filter((f: any) => f.id !== id)
    };
    savePatient(updatedPatient);
    onUpdate(updatedPatient);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPhoto(true);
    try {
      const base64Image = await compressImage(file);
      setPendingPhoto({
        base64: base64Image,
        description: '',
        linkedConsultation: ''
      });
    } catch (error) {
      console.error("Erro ao processar foto:", error);
      alert('Erro ao processar a foto. Tente novamente.');
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSavePhoto = () => {
    if (!pendingPhoto) return;
    
    const newPhoto: PatientPhoto = {
      id: crypto.randomUUID(),
      base64: pendingPhoto.base64,
      description: pendingPhoto.description,
      date: new Date().toLocaleString('pt-BR'),
      linkedConsultation: pendingPhoto.linkedConsultation
    };

    const updatedPatient = {
      ...patient,
      fotos: [...(patient.fotos || []), newPhoto]
    };
    
    savePatient(updatedPatient);
    onUpdate(updatedPatient);
    setPendingPhoto(null);
  };

  const handleDeletePhoto = async (photoToDelete: string | PatientPhoto) => {
    if (!window.confirm('Tem certeza que deseja excluir esta foto?')) return;

    try {
      const updatedPatient = {
        ...patient,
        fotos: patient.fotos?.filter(f => {
          if (typeof f === 'string' && typeof photoToDelete === 'string') return f !== photoToDelete;
          if (typeof f !== 'string' && typeof photoToDelete !== 'string') return f.id !== photoToDelete.id;
          return f !== photoToDelete;
        })
      };
      savePatient(updatedPatient);
      onUpdate(updatedPatient);
      setViewingPhoto(null);
    } catch (error) {
      console.error("Erro ao excluir foto:", error);
      alert('Erro ao excluir a foto.');
    }
  };

  const handleUpdatePhotoDetails = () => {
    if (!viewingPhoto) return;

    const isString = typeof viewingPhoto === 'string';
    
    const updatedPhoto: PatientPhoto = {
      id: isString ? crypto.randomUUID() : (viewingPhoto as PatientPhoto).id,
      base64: isString ? viewingPhoto as string : (viewingPhoto as PatientPhoto).base64,
      description: editPhotoForm.description,
      date: isString ? new Date().toLocaleString('pt-BR') : (viewingPhoto as PatientPhoto).date,
      linkedConsultation: editPhotoForm.linkedConsultation
    };

    const updatedPatient = {
      ...patient,
      fotos: patient.fotos?.map(f => {
        if (typeof f === 'string') {
          return f === viewingPhoto ? updatedPhoto : f;
        } else {
          return f.id === (viewingPhoto as PatientPhoto).id ? updatedPhoto : f;
        }
      })
    };

    savePatient(updatedPatient);
    onUpdate(updatedPatient);
    setViewingPhoto(updatedPhoto);
    setIsEditingPhotoDetails(false);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/50 backdrop-blur-sm print:static print:p-0 print:bg-white print:block">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto print:shadow-none print:max-w-none print:max-h-none print:overflow-visible flex flex-col"
      >
        
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
              <p>Data: {formatDateShort(getLocalDateString())}</p>
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
              Evolução e Fotos
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
          <AnimatePresence mode="wait">
            {/* TAB 1: Dados Cadastrais e Anamnese Base */}
            {activeTab === 'details' && (
              <motion.div 
                key="details"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className={`${printMode === 'details' ? 'print:block' : 'print:hidden'} space-y-8`}
              >
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
                    {formatDateShort(patient.birthDate)}
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
          </motion.div>
          )}

          {/* TAB 2: Evolução/Histórico de Consultas */}
          {activeTab === 'history' && (
          <motion.div 
            key="history"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className={`${printMode === 'history' ? 'print:block' : 'print:hidden'} print:mt-12`}
          >
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Valor deste Atendimento (R$)</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0,00"
                        value={consultationForm.amount}
                        onChange={(e) => setConsultationForm({...consultationForm, amount: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Forma de Pagamento</label>
                      <input
                        type="text"
                        placeholder="PIX, Cartão, Dinheiro..."
                        value={consultationForm.paymentMethod}
                        onChange={(e) => setConsultationForm({...consultationForm, paymentMethod: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                      />
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
              {/* Listagem do Histórico Clínico (Novo formato PASSO 2) */}
              {patient.historico_clinico && patient.historico_clinico.length > 0 && (
                patient.historico_clinico.map((entry, idx) => (
                  <div key={`hist-${idx}`} className="relative">
                    <div className="absolute -left-[25px] top-1.5 h-4 w-4 rounded-full bg-teal-500 border-4 border-white shadow-sm print:border-slate-300 print:bg-slate-800"></div>
                    <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm print:shadow-none print:border-slate-300 print:p-4">
                      <p className="text-slate-700 whitespace-pre-wrap text-sm leading-relaxed">
                        {entry}
                      </p>
                    </div>
                  </div>
                ))
              )}

              {/* Listagem das Consultas (Formato antigo para compatibilidade) */}
              {patient.consultations && patient.consultations.length > 0 ? (
                patient.consultations.map(c => (
                  <div key={c.id} className="relative">
                    <div className="absolute -left-[25px] top-1.5 h-4 w-4 rounded-full bg-slate-400 border-4 border-white shadow-sm print:border-slate-300 print:bg-slate-800"></div>
                    <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm print:shadow-none print:border-slate-300 print:p-4 opacity-75">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3 gap-2">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-slate-500 print:text-slate-800" />
                          <span className="font-semibold text-slate-800">
                            {formatDateShort(c.date)} (Antigo)
                          </span>
                        </div>
                      </div>
                      <p className="text-slate-700 whitespace-pre-wrap text-sm leading-relaxed">
                        {c.notes}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                (!patient.historico_clinico || patient.historico_clinico.length === 0) && (
                  <div className="text-slate-500 py-8 print:hidden">
                    Nenhuma evolução registrada.
                  </div>
                )
              )}
            </div>

            {/* Galeria de Fotos */}
            <div className={`mt-12 pt-8 border-t border-slate-200 print:hidden ${printMode !== 'history' ? 'print:hidden' : ''}`}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <ImageIcon className="h-5 w-5 text-teal-600" />
                  Galeria de Fotos
                </h3>
                <div>
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    ref={fileInputRef}
                    onChange={handlePhotoUpload}
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingPhoto}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                  >
                    {isUploadingPhoto ? (
                      <span className="animate-pulse">Processando...</span>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        Adicionar Foto
                      </>
                    )}
                  </button>
                </div>
              </div>

              {patient.fotos && patient.fotos.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {patient.fotos.map((foto, idx) => {
                    const isObj = typeof foto !== 'string';
                    const src = isObj ? (foto as PatientPhoto).base64 : foto as string;
                    const desc = isObj ? (foto as PatientPhoto).description : '';
                    
                    return (
                      <div 
                        key={isObj ? (foto as PatientPhoto).id : idx} 
                        onClick={() => setViewingPhoto(foto)}
                        className="aspect-square rounded-xl overflow-hidden border border-slate-200 cursor-pointer group relative bg-slate-100"
                      >
                        <img 
                          src={src} 
                          alt={`Foto ${idx + 1}`} 
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        {desc && (
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-900/80 to-transparent p-3 pt-6">
                            <p className="text-white text-xs truncate font-medium">{desc}</p>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/20 transition-colors flex items-center justify-center">
                          <Maximize2 className="text-white opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 drop-shadow-md" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <ImageIcon className="h-8 w-8 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">Nenhuma foto adicionada ao prontuário.</p>
                </div>
              )}
            </div>
          </motion.div>
          )}

          {/* TAB 3: Receituário e Pedido de Exames */}
          {activeTab === 'prescriptions' && (
          <motion.div 
            key="prescriptions"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className={`${printMode === 'prescription' || printMode === 'exam' ? 'print:block' : 'print:hidden'}`}
          >
            
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
          </motion.div>
          )}

          {/* TAB 4: Atestados */}
          {activeTab === 'certificates' && (
          <motion.div 
            key="certificates"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className={`${printMode === 'certificate' ? 'print:block' : 'print:hidden'}`}
          >
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
          </motion.div>
          )}

          {/* TAB 5: Financeiro */}
          {activeTab === 'financial' && (
          <motion.div 
            key="financial"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className={`${printMode === 'budget' || printMode === 'receipt' ? 'print:block' : 'print:hidden'}`}
          >
            
            {/* Orçamentos */}
            <div className={`mb-12 ${printMode === 'receipt' ? 'print:hidden' : ''}`}>
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
                const budgetToPrint = printBudgetId 
                  ? (patient.budgets?.find(b => b.id === printBudgetId) || (patient.financeiro?.find(f => (f as any).id === printBudgetId && (f as any).recordType === 'budget') as Budget))
                  : null;
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
            <div className={`border-t border-slate-200 pt-8 print:border-none print:pt-0 ${printMode === 'budget' ? 'print:hidden' : ''}`}>
              <h3 className="text-lg font-semibold text-slate-800 mb-6 print:hidden">Registrar Pagamento</h3>
              
              {printMode !== 'receipt' && (
                <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 mb-8 print:hidden">
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
                    <div className="md:col-span-2 flex items-end pb-2">
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <div className="relative flex items-center">
                          <input
                            type="checkbox"
                            checked={paymentForm.receiptIssued}
                            onChange={(e) => setPaymentForm({...paymentForm, receiptIssued: e.target.checked})}
                            className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-slate-300 bg-white transition-all checked:bg-teal-600 checked:border-teal-600 focus:outline-none"
                          />
                          <svg className="absolute h-3.5 w-3.5 pointer-events-none hidden peer-checked:block text-white left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        </div>
                        <span className="text-sm font-medium text-slate-700 group-hover:text-teal-600 transition-colors">Declarar no IR (Recibo)?</span>
                      </label>
                      <p className="text-[10px] text-slate-400 mt-0.5 ml-7">Afeta o cálculo do Carnê-Leão</p>
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
              )}

              {/* Histórico Financeiro */}
              <div className={`space-y-6 ${printMode === 'receipt' ? 'print:mt-0' : ''}`}>
                <h4 className="font-semibold text-slate-800 print:hidden">Histórico Financeiro</h4>
                
                {(!patient.budgets?.length && !patient.payments?.length && !patient.financeiro?.length) ? (
                  <p className="text-slate-500 text-center py-8 bg-slate-50 rounded-lg border border-slate-200">
                    Nenhum registro financeiro encontrado.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {/* Registros do Firebase (Novo formato PASSO 3) */}
                    {patient.financeiro?.map((record: any) => {
                      if (record.recordType === 'payment') {
                        const payment = record as Payment;
                        return (
                          <div key={payment.id} className={`flex items-center justify-between p-4 bg-white border border-slate-200 rounded-lg border-l-4 border-l-green-500 ${printMode === 'receipt' && printReceiptPaymentId !== payment.id ? 'print:hidden' : ''} ${printMode === 'receipt' && printReceiptPaymentId === payment.id ? 'print:block print:border-none print:p-0 print:shadow-none' : ''}`}>
                            <div className="print:hidden">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900">Pagamento Recebido (Firebase)</span>
                                <span className="text-sm text-slate-500">
                                  {formatDateShort(payment.date)}
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
                                {payment.receiptIssued && (
                                  <>
                                    <span>•</span>
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-teal-50 text-teal-700 rounded text-[10px] font-bold uppercase tracking-wider border border-teal-100">
                                      Recibo Emitido {payment.receiptDate && `(${formatDateShort(payment.receiptDate)})`}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Receipt Print View */}
                            <div className={`hidden ${printMode === 'receipt' && printReceiptPaymentId === payment.id ? 'print:block w-full' : ''}`}>
                              <div className="text-center mb-8">
                                <h2 className="text-2xl font-bold text-slate-900 uppercase tracking-wider">Recibo</h2>
                                <p className="text-slate-500 mt-1">Nº {payment.id.substring(0, 8).toUpperCase()}</p>
                              </div>
                              
                              <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 mb-8">
                                <div className="flex justify-between items-center mb-6 border-b border-slate-200 pb-6">
                                  <span className="text-lg text-slate-600">Valor Recebido:</span>
                                  <span className="text-3xl font-bold text-slate-900">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(payment.amount)}
                                  </span>
                                </div>
                                
                                <div className="space-y-4 text-slate-800 leading-relaxed">
                                  <p>
                                    Recebi(emos) de <strong>{patient.fullName}</strong>, 
                                    {patient.cpf ? ` inscrito(a) no CPF sob o nº ${patient.cpf},` : ''} 
                                    a importância supra de {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(payment.amount)}, 
                                    referente a serviços prestados em saúde.
                                  </p>
                                  {payment.notes && (
                                    <p><strong>Referente a:</strong> {payment.notes}</p>
                                  )}
                                </div>
                              </div>

                              <div className="flex justify-between items-end mt-16">
                                <div className="text-slate-600">
                                  <p>{settings?.address?.split('-')?.[1]?.trim() || 'Local'}, {formatDateLong(payment.date)}</p>
                                </div>
                                <div className="text-center w-64">
                                  <div className="border-t border-slate-800 pt-2">
                                    <p className="font-bold text-slate-900">{settings?.doctorName || 'Nome do Profissional'}</p>
                                    <p className="text-sm text-slate-600">{settings?.crm || 'CRM/CRO'}</p>
                                    {settings?.cpf && <p className="text-sm text-slate-600">CPF: {settings.cpf}</p>}
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-4 print:hidden">
                              <div className="text-lg font-bold text-green-600">
                                + {formatCurrency(payment.amount)}
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={async () => {
                                    if (!payment.receiptIssued) {
                                      try {
                                        await updateGlobalFinancialRecordReceipt(payment.id, true);
                                        const updatedPatient = {
                                          ...patient,
                                          financeiro: patient.financeiro?.map((f: any) => 
                                            (f.id === payment.id && f.recordType === 'payment')
                                              ? { ...f, receiptIssued: true, receiptDate: getLocalDateString() } 
                                              : f
                                          )
                                        };
                                        onUpdate(updatedPatient);
                                      } catch (error) {
                                        console.error("Erro ao emitir recibo:", error);
                                        alert("Erro ao emitir recibo.");
                                      }
                                    }
                                    setPrintReceiptPaymentId(payment.id);
                                    handlePrint('receipt', () => setPrintReceiptPaymentId(null));
                                  }}
                                  className={`p-2 rounded-lg transition-colors ${payment.receiptIssued ? 'text-teal-600 bg-teal-50 hover:bg-teal-100' : 'text-slate-400 hover:text-teal-600 hover:bg-teal-50'}`}
                                  title={payment.receiptIssued ? "Reimprimir Recibo" : "Imprimir Recibo"}
                                >
                                  <Printer className="h-4 w-4" />
                                </button>
                                {payment.receiptIssued && (
                                  <button
                                    onClick={async () => {
                                      if (window.confirm('Deseja remover o registro de recibo deste pagamento? Ele deixará de aparecer no faturamento declarado.')) {
                                        try {
                                          await updateGlobalFinancialRecordReceipt(payment.id, false);
                                          const updatedPatient = {
                                            ...patient,
                                            financeiro: patient.financeiro?.map((f: any) => 
                                              (f.id === payment.id && f.recordType === 'payment')
                                                ? { ...f, receiptIssued: false, receiptDate: null } 
                                                : f
                                            )
                                          };
                                          onUpdate(updatedPatient);
                                        } catch (error) {
                                          console.error("Erro ao remover recibo:", error);
                                          alert("Erro ao remover recibo.");
                                        }
                                      }
                                    }}
                                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Remover Recibo (Desdeclarar)"
                                  >
                                    <FileX className="h-4 w-4" />
                                  </button>
                                )}
                                <button
                                  onClick={() => {
                                    const updatedPatient = {
                                      ...patient,
                                      financeiro: patient.financeiro?.filter((f: any) => f.id !== payment.id)
                                    };
                                    savePatient(updatedPatient);
                                    onUpdate(updatedPatient);
                                  }}
                                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Excluir Pagamento"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      } else if (record.recordType === 'budget') {
                        const budget = record as Budget;
                        return (
                          <div key={budget.id} className={`p-4 bg-white border border-slate-200 rounded-lg border-l-4 border-l-blue-500 ${printMode === 'receipt' ? 'print:hidden' : ''}`}>
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900">Orçamento Gerado (Firebase)</span>
                                <span className="text-sm text-slate-500">
                                  {formatDateShort(budget.date)}
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
                                  onClick={() => {
                                    const updatedPatient = {
                                      ...patient,
                                      financeiro: patient.financeiro?.filter((f: any) => f.id !== budget.id)
                                    };
                                    savePatient(updatedPatient);
                                    onUpdate(updatedPatient);
                                  }}
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
                        );
                      }
                      return null;
                    })}

                    {/* Pagamentos Antigos (Compatibilidade) */}
                    {patient.payments?.map((payment) => (
                      <div key={payment.id} className={`flex items-center justify-between p-4 bg-white border border-slate-200 rounded-lg border-l-4 border-l-slate-400 opacity-75 ${printMode === 'receipt' && printReceiptPaymentId !== payment.id ? 'print:hidden' : ''} ${printMode === 'receipt' && printReceiptPaymentId === payment.id ? 'print:block print:border-none print:p-0 print:shadow-none' : ''}`}>
                        <div className="print:hidden">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">Pagamento Recebido (Antigo)</span>
                            <span className="text-sm text-slate-500">
                              {formatDateShort(payment.date)}
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

                        <div className="flex items-center gap-4 print:hidden">
                          <div className="text-lg font-bold text-slate-500">
                            + {formatCurrency(payment.amount)}
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={async () => {
                                if (!payment.receiptIssued) {
                                  try {
                                    await updateGlobalFinancialRecordReceipt(payment.id, true);
                                    const updatedPatient = {
                                      ...patient,
                                      payments: patient.payments?.map((p: any) => 
                                        p.id === payment.id ? { ...p, receiptIssued: true, receiptDate: getLocalDateString() } : p
                                      )
                                    };
                                    onUpdate(updatedPatient);
                                  } catch (error) {
                                    console.error("Erro ao emitir recibo:", error);
                                    alert("Erro ao emitir recibo.");
                                  }
                                }
                                setPrintReceiptPaymentId(payment.id);
                                handlePrint('receipt', () => setPrintReceiptPaymentId(null));
                              }}
                              className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                              title="Imprimir Recibo"
                            >
                              <Printer className="h-4 w-4" />
                            </button>
                            {payment.receiptIssued && (
                              <button
                                onClick={async () => {
                                  if (window.confirm('Deseja remover o registro de recibo deste pagamento? Ele deixará de aparecer no faturamento declarado.')) {
                                    try {
                                      await updateGlobalFinancialRecordReceipt(payment.id, false);
                                      const updatedPatient = {
                                        ...patient,
                                        payments: patient.payments?.map((p: any) => 
                                          p.id === payment.id ? { ...p, receiptIssued: false, receiptDate: null } : p
                                        )
                                      };
                                      onUpdate(updatedPatient);
                                    } catch (error) {
                                      console.error("Erro ao remover recibo:", error);
                                      alert("Erro ao remover recibo.");
                                    }
                                  }
                                }}
                                className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Remover Recibo (Desdeclarar)"
                              >
                                <FileX className="h-4 w-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDeletePayment(payment.id)}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Excluir Pagamento"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Orçamentos Antigos (Compatibilidade) */}
                    {patient.budgets?.map((budget) => (
                      <div key={budget.id} className={`p-4 bg-white border border-slate-200 rounded-lg border-l-4 border-l-slate-400 opacity-75 ${printMode === 'receipt' ? 'print:hidden' : ''}`}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">Orçamento Gerado (Antigo)</span>
                            <span className="text-sm text-slate-500">
                              {formatDateShort(budget.date)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-slate-500">
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
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
          )}
          </AnimatePresence>

          {/* Print Footer */}
          <div className={`hidden ${printMode === 'receipt' ? 'print:hidden' : 'print:block'} mt-32 pt-8 text-center`}>
            <div className="w-80 mx-auto border-b border-slate-800 mb-2"></div>
            <p className="text-base text-slate-800 font-medium">{settings?.doctorName || 'Assinatura do(a) Profissional'}</p>
            <p className="text-sm text-slate-600">{settings?.crm || 'CRM/CRO'}</p>
          </div>

        </div>
      </motion.div>

      {/* Photo Viewer Modal */}
      {viewingPhoto && (() => {
        const isObj = typeof viewingPhoto !== 'string';
        const src = isObj ? (viewingPhoto as PatientPhoto).base64 : viewingPhoto as string;
        const desc = isObj ? (viewingPhoto as PatientPhoto).description : '';
        const date = isObj ? (viewingPhoto as PatientPhoto).date : '';
        const linked = isObj ? (viewingPhoto as PatientPhoto).linkedConsultation : '';

        return (
          <div className="fixed inset-0 z-[60] bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
            <div className="relative max-w-6xl w-full max-h-[95vh] flex flex-col md:flex-row bg-white rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
              
              {/* Image Area */}
              <div className="flex-1 bg-slate-100 flex items-center justify-center relative min-h-[50vh] md:min-h-0">
                <img 
                  src={src} 
                  alt="Visualização Clínica" 
                  className="max-w-full max-h-[95vh] object-contain"
                />
              </div>

              {/* Details Sidebar */}
              <div className="w-full md:w-80 bg-white flex flex-col border-l border-slate-200">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-teal-600" />
                    Detalhes da Foto
                  </h3>
                  <div className="flex items-center gap-1">
                    {!isEditingPhotoDetails && (
                      <button 
                        onClick={() => {
                          setIsEditingPhotoDetails(true);
                          const isString = typeof viewingPhoto === 'string';
                          setEditPhotoForm({ 
                            description: isString ? '' : (viewingPhoto as PatientPhoto).description || '', 
                            linkedConsultation: isString ? '' : (viewingPhoto as PatientPhoto).linkedConsultation || '' 
                          });
                        }}
                        className="flex items-center gap-1 px-2 py-1 bg-teal-50 text-teal-700 hover:bg-teal-100 rounded-md transition-colors text-xs font-bold border border-teal-200"
                        title="Editar detalhes"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                        Editar Detalhes
                      </button>
                    )}
                    <button 
                      onClick={() => {
                        setViewingPhoto(null);
                        setIsEditingPhotoDetails(false);
                      }}
                      className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div className="p-6 flex-1 overflow-y-auto space-y-6">
                  {isEditingPhotoDetails ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Descrição</label>
                        <textarea
                          value={editPhotoForm.description}
                          onChange={(e) => setEditPhotoForm({...editPhotoForm, description: e.target.value})}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none resize-none h-32 text-sm"
                          placeholder="Adicione uma descrição..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Vincular a uma Consulta</label>
                        <select
                          value={editPhotoForm.linkedConsultation}
                          onChange={(e) => setEditPhotoForm({...editPhotoForm, linkedConsultation: e.target.value})}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none bg-white text-sm"
                        >
                          <option value="">-- Nenhuma consulta vinculada --</option>
                          {patient.historico_clinico?.map((entry, idx) => {
                            const snippet = entry.substring(0, 60) + (entry.length > 60 ? '...' : '');
                            return <option key={idx} value={entry}>{snippet}</option>;
                          })}
                        </select>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <button 
                          onClick={() => setIsEditingPhotoDetails(false)}
                          className="flex-1 px-4 py-2 text-slate-600 hover:bg-slate-100 font-medium rounded-lg transition-colors text-sm"
                        >
                          Cancelar
                        </button>
                        <button 
                          onClick={handleUpdatePhotoDetails}
                          className="flex-1 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
                        >
                          <Save className="h-4 w-4" />
                          Salvar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {date && (
                        <div>
                          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 block">Data de Adição</label>
                          <p className="text-slate-700 text-sm flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-slate-400" />
                            {date}
                          </p>
                        </div>
                      )}
                      
                      {desc && (
                        <div>
                          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 block">Descrição</label>
                          <p className="text-slate-700 text-sm whitespace-pre-wrap bg-slate-50 p-3 rounded-lg border border-slate-100">{desc}</p>
                        </div>
                      )}

                      {linked && (
                        <div>
                          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 block">Consulta Vinculada</label>
                          <div className="text-slate-700 text-sm bg-teal-50/50 p-3 rounded-lg border border-teal-100">
                            <p className="line-clamp-3 text-teal-900">{linked}</p>
                          </div>
                        </div>
                      )}

                      {!date && !desc && !linked && (
                        <div className="text-center py-8 text-slate-400">
                          <p className="text-sm">Nenhum detalhe adicional registrado para esta foto.</p>
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div className="p-4 border-t border-slate-100 bg-slate-50">
                  <button 
                    onClick={() => handleDeletePhoto(viewingPhoto)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 rounded-xl transition-all font-medium shadow-sm"
                  >
                    <Trash2 className="h-4 w-4" />
                    Excluir Foto
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Pending Photo Upload Modal */}
      {pendingPhoto && (
        <div className="fixed inset-0 z-[70] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Upload className="h-5 w-5 text-teal-600" />
                Detalhes da Foto
              </h3>
              <button onClick={() => setPendingPhoto(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="aspect-video bg-slate-100 rounded-lg overflow-hidden border border-slate-200 flex items-center justify-center">
                <img src={pendingPhoto.base64} alt="Preview" className="max-h-full object-contain" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Descrição (Opcional)</label>
                <textarea
                  value={pendingPhoto.description}
                  onChange={(e) => setPendingPhoto({...pendingPhoto, description: e.target.value})}
                  placeholder="Ex: Foto do dente 36 antes do procedimento..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none resize-none h-20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Vincular a uma Consulta (Opcional)</label>
                <select
                  value={pendingPhoto.linkedConsultation}
                  onChange={(e) => setPendingPhoto({...pendingPhoto, linkedConsultation: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none bg-white"
                >
                  <option value="">-- Nenhuma consulta vinculada --</option>
                  {patient.historico_clinico?.map((entry, idx) => {
                    const snippet = entry.substring(0, 60) + (entry.length > 60 ? '...' : '');
                    return <option key={idx} value={entry}>{snippet}</option>;
                  })}
                </select>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
              <button
                onClick={() => setPendingPhoto(null)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-200 font-medium rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSavePhoto}
                className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                Salvar Foto
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
