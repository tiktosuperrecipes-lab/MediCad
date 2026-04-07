import React, { useState, useMemo, useEffect } from 'react';
import { Calculator, DollarSign, TrendingUp, TrendingDown, FileText, AlertCircle, Printer, Download, CheckCircle, Clock } from 'lucide-react';
import { Patient, GlobalFinancialRecord } from '../types';
import { calculateMonthlyIR } from '../lib/taxCalculator';
import { getSettings, ClinicSettings } from '../lib/settings';
import { getLocalDateString, formatDateLong, formatDateShort } from '../lib/dateUtils';
import { savePatient, getGlobalFinancialRecords, updateGlobalFinancialRecordStatus, updateGlobalFinancialRecordReceipt } from '../lib/storage';

interface FinancialDashboardProps {
  patients: Patient[];
}

export default function FinancialDashboard({ patients }: FinancialDashboardProps) {
  const todayStr = getLocalDateString();
  const [tYear, tMonth] = todayStr.split('-');
  const [selectedYear, setSelectedYear] = useState(tYear);
  const [selectedMonth, setSelectedMonth] = useState(tMonth);
  const [deductibleExpenses, setDeductibleExpenses] = useState<number>(0);
  const [printMode, setPrintMode] = useState(false);
  const [selectedPatientForReceipt, setSelectedPatientForReceipt] = useState<string>('');
  const [settings, setSettings] = useState<ClinicSettings | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'cashflow' | 'taxes'>('cashflow');
  const [globalRecords, setGlobalRecords] = useState<GlobalFinancialRecord[]>([]);
  
  useEffect(() => {
    getSettings().then(setSettings);
    loadGlobalRecords();
  }, []);

  const loadGlobalRecords = async () => {
    const records = await getGlobalFinancialRecords();
    setGlobalRecords(records);
  };

  const handleUpdateStatus = async (id: string, status: 'Pendente' | 'Pago') => {
    try {
      await updateGlobalFinancialRecordStatus(id, status);
      await loadGlobalRecords();
    } catch (error) {
      alert('Erro ao atualizar status.');
    }
  };

  const handleToggleReceipt = async (id: string, currentStatus: boolean) => {
    try {
      await updateGlobalFinancialRecordReceipt(id, !currentStatus);
      await loadGlobalRecords();
    } catch (error) {
      alert('Erro ao atualizar recibo.');
    }
  };

  // Calculate totals for cashflow
  const { pendingTotal, receivedTotal, unifiedPendingRecords, unifiedReceivedRecords, monthlyIncome, monthlyDeclaredIncome } = useMemo(() => {
    const currentMonthPrefix = `${selectedYear}-${selectedMonth}`;
    
    // Usar um Map para evitar duplicados entre globalRecords e patient records
    const allRecordsMap = new Map<string, any>();
    
    // 1. Adicionar registros globais (têm prioridade de status)
    globalRecords.forEach(record => {
      if (record.date.startsWith(currentMonthPrefix)) {
        allRecordsMap.set(record.id, record);
      }
    });
    
    // 2. Adicionar registros dos pacientes (para retrocompatibilidade e sincronia)
    patients.forEach(patient => {
      // New financeiro records
      patient.financeiro?.forEach((record: any) => {
        if (record.recordType === 'payment' && record.date.startsWith(currentMonthPrefix)) {
          if (!allRecordsMap.has(record.id)) {
            const unifiedRecord = {
              id: record.id,
              patientId: patient.id,
              patientName: patient.fullName,
              date: record.date,
              amount: record.amount,
              method: record.method,
              procedure: record.notes || 'Pagamento registrado no prontuário',
              status: record.status || (record.receiptIssued ? 'Pago' : 'Pendente'),
              receiptIssued: record.receiptIssued || false
            };
            allRecordsMap.set(record.id, unifiedRecord);
          } else {
            const existing = allRecordsMap.get(record.id);
            if (record.receiptIssued !== undefined && record.receiptIssued !== existing.receiptIssued) {
              allRecordsMap.set(record.id, { ...existing, receiptIssued: record.receiptIssued });
            }
          }
        }
      });

      // Old payments records
      patient.payments?.forEach((record: any) => {
        if (record.date.startsWith(currentMonthPrefix)) {
          if (!allRecordsMap.has(record.id)) {
            const unifiedRecord = {
              id: record.id,
              patientId: patient.id,
              patientName: patient.fullName,
              date: record.date,
              amount: record.amount,
              method: record.method,
              procedure: record.notes || 'Pagamento antigo',
              status: record.status || (record.receiptIssued ? 'Pago' : 'Pendente'),
              receiptIssued: record.receiptIssued || false
            };
            allRecordsMap.set(record.id, unifiedRecord);
          } else {
            const existing = allRecordsMap.get(record.id);
            if (record.receiptIssued !== undefined && record.receiptIssued !== existing.receiptIssued) {
              allRecordsMap.set(record.id, { ...existing, receiptIssued: record.receiptIssued });
            }
          }
        }
      });
    });
    
    const allRecords = Array.from(allRecordsMap.values());
    const pendingList = allRecords.filter(r => r.status === 'Pendente');
    const receivedList = allRecords.filter(r => r.status === 'Pago');
    
    return { 
      pendingTotal: pendingList.reduce((sum, r) => sum + r.amount, 0), 
      receivedTotal: receivedList.reduce((sum, r) => sum + r.amount, 0),
      unifiedPendingRecords: pendingList,
      unifiedReceivedRecords: receivedList,
      monthlyIncome: receivedList.reduce((sum, r) => sum + r.amount, 0),
      monthlyDeclaredIncome: receivedList.filter(r => r.receiptIssued).reduce((sum, r) => sum + r.amount, 0)
    };
  }, [globalRecords, patients, selectedYear, selectedMonth]);

  // Calculate annual income for the selected year
  const { annualIncome, annualDeclaredIncome } = useMemo(() => {
    const allRecordsMap = new Map<string, any>();
    
    // 1. Global
    globalRecords.forEach(record => {
      if (record.date.startsWith(selectedYear)) {
        allRecordsMap.set(record.id, record);
      }
    });
    
    // 2. Patients
    patients.forEach(patient => {
      // New financeiro records
      patient.financeiro?.forEach((record: any) => {
        if (record.recordType === 'payment' && record.date.startsWith(selectedYear)) {
          if (!allRecordsMap.has(record.id)) {
            const unifiedRecord = {
              id: record.id,
              status: record.status || (record.receiptIssued ? 'Pago' : 'Pendente'),
              amount: record.amount,
              receiptIssued: record.receiptIssued || false
            };
            allRecordsMap.set(record.id, unifiedRecord);
          } else {
            const existing = allRecordsMap.get(record.id);
            if (record.receiptIssued !== undefined && record.receiptIssued !== existing.receiptIssued) {
              allRecordsMap.set(record.id, { ...existing, receiptIssued: record.receiptIssued });
            }
          }
        }
      });

      // Old payments records
      patient.payments?.forEach((record: any) => {
        if (record.date.startsWith(selectedYear)) {
          if (!allRecordsMap.has(record.id)) {
            const unifiedRecord = {
              id: record.id,
              status: record.status || (record.receiptIssued ? 'Pago' : 'Pendente'),
              amount: record.amount,
              receiptIssued: record.receiptIssued || false
            };
            allRecordsMap.set(record.id, unifiedRecord);
          } else {
            const existing = allRecordsMap.get(record.id);
            if (record.receiptIssued !== undefined && record.receiptIssued !== existing.receiptIssued) {
              allRecordsMap.set(record.id, { ...existing, receiptIssued: record.receiptIssued });
            }
          }
        }
      });
    });

    const allRecords = Array.from(allRecordsMap.values());
    const paidRecords = allRecords.filter(r => r.status === 'Pago');

    return { 
      annualIncome: paidRecords.reduce((sum, r) => sum + r.amount, 0), 
      annualDeclaredIncome: paidRecords.filter(r => r.receiptIssued).reduce((sum, r) => sum + r.amount, 0) 
    };
  }, [globalRecords, patients, selectedYear]);

  const taxCalc = calculateMonthlyIR(monthlyDeclaredIncome, deductibleExpenses);

  const months = [
    { value: '01', label: 'Janeiro' },
    { value: '02', label: 'Fevereiro' },
    { value: '03', label: 'Março' },
    { value: '04', label: 'Abril' },
    { value: '05', label: 'Maio' },
    { value: '06', label: 'Junho' },
    { value: '07', label: 'Julho' },
    { value: '08', label: 'Agosto' },
    { value: '09', label: 'Setembro' },
    { value: '10', label: 'Outubro' },
    { value: '11', label: 'Novembro' },
    { value: '12', label: 'Dezembro' },
  ];

  const years = Array.from({ length: 5 }, (_, i) => (Number(tYear) - i).toString());


  const handlePrintAnnualReceipt = () => {
    if (!selectedPatientForReceipt) {
      alert('Selecione um paciente para gerar o recibo.');
      return;
    }
    setPrintMode(true);
    setTimeout(() => {
      window.print();
      setPrintMode(false);
    }, 100);
  };

  const patientForReceipt = patients.find(p => p.id === selectedPatientForReceipt);
  
  const { patientAnnualTotal, patientAnnualUndeclared } = useMemo(() => {
    if (!patientForReceipt) return { patientAnnualTotal: 0, patientAnnualUndeclared: 0 };
    
    let declared = 0;
    let undeclared = 0;
    
    // Old payments
    patientForReceipt.payments?.forEach(p => {
      if (p.date.startsWith(selectedYear)) {
        if (p.receiptIssued) declared += p.amount;
        else undeclared += p.amount;
      }
    });
    
    // New financeiro records
    patientForReceipt.financeiro?.forEach((record: any) => {
      if (record.recordType === 'payment' && record.date.startsWith(selectedYear)) {
        if (record.receiptIssued) declared += record.amount;
        else undeclared += record.amount;
      }
    });
    
    return { patientAnnualTotal: declared, patientAnnualUndeclared: undeclared };
  }, [patientForReceipt, selectedYear]);

  const handleDeclareAllForPatient = async () => {
    if (!patientForReceipt) return;
    
    const updatedPatient = { ...patientForReceipt };
    
    // Update old payments
    if (updatedPatient.payments) {
      updatedPatient.payments = updatedPatient.payments.map(p => {
        if (p.date.startsWith(selectedYear)) {
          return { ...p, receiptIssued: true };
        }
        return p;
      });
    }
    
    // Update new financeiro records
    if (updatedPatient.financeiro) {
      updatedPatient.financeiro = updatedPatient.financeiro.map((record: any) => {
        if (record.recordType === 'payment' && record.date.startsWith(selectedYear)) {
          return { ...record, receiptIssued: true };
        }
        return record;
      });
    }
    
    await savePatient(updatedPatient);
    alert('Todos os pagamentos deste paciente no ano selecionado foram marcados como declarados.');
  };

  return (
    <div className={`max-w-5xl mx-auto space-y-6 ${printMode ? 'print:space-y-0' : ''}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Financeiro</h2>
          <p className="text-slate-500">Controle de caixa e impostos da clínica.</p>
        </div>
        <div className="flex gap-2">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none bg-white"
          >
            {months.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none bg-white"
          >
            {years.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex border-b border-slate-200 print:hidden">
        <button
          onClick={() => setActiveSubTab('cashflow')}
          className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
            activeSubTab === 'cashflow' ? 'border-teal-600 text-teal-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Controle de Caixa
        </button>
        <button
          onClick={() => setActiveSubTab('taxes')}
          className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
            activeSubTab === 'taxes' ? 'border-teal-600 text-teal-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Impostos & Recibos
        </button>
      </div>

      {activeSubTab === 'cashflow' ? (
        <div className="space-y-6">
          {/* Cashflow Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-slate-700">Recebido no Mês</h3>
              </div>
              <p className="text-3xl font-bold text-emerald-700">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(receivedTotal)}
              </p>
              <p className="text-xs text-slate-500 mt-1">Total de pagamentos com status 'Pago'</p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
                  <Clock className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-slate-700">A Receber (Pendente)</h3>
              </div>
              <p className="text-3xl font-bold text-amber-700">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(pendingTotal)}
              </p>
              <p className="text-xs text-slate-500 mt-1">Total de pagamentos com status 'Pendente'</p>
            </div>
          </div>

          {/* Lists */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Contas a Receber */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-500" />
                  Contas a Receber
                </h3>
                <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-1 rounded-full">
                  {unifiedPendingRecords.length}
                </span>
              </div>
              <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
                {unifiedPendingRecords.length > 0 ? (
                  unifiedPendingRecords.map(record => (
                    <div key={record.id} className="p-4 hover:bg-slate-50 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-bold text-slate-900">{record.patientName}</p>
                          <p className="text-xs text-slate-500">{formatDateShort(record.date)} • {record.method}</p>
                        </div>
                        <p className="font-bold text-teal-700">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(record.amount)}</p>
                      </div>
                      <p className="text-sm text-slate-600 mb-3 line-clamp-1">{record.procedure}</p>
                      <button
                        onClick={() => handleUpdateStatus(record.id, 'Pago')}
                        className="w-full flex items-center justify-center gap-2 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-200 transition-all"
                      >
                        <CheckCircle className="h-3 w-3" />
                        Dar Baixa (Pago)
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-slate-500 italic text-sm">Nenhum pagamento pendente este mês.</div>
                )}
              </div>
            </div>

            {/* Contas Recebidas */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  Contas Recebidas
                </h3>
                <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-1 rounded-full">
                  {unifiedReceivedRecords.length}
                </span>
              </div>
              <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
                {unifiedReceivedRecords.length > 0 ? (
                  unifiedReceivedRecords.map(record => (
                    <div key={record.id} className="p-4 hover:bg-slate-50 transition-colors">
                      <div className="flex justify-between items-start mb-1">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-slate-900">{record.patientName}</p>
                            {record.receiptIssued && (
                              <span className="bg-teal-100 text-teal-700 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase">Recibo</span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500">{formatDateShort(record.date)} • {record.method}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-slate-900">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(record.amount)}</p>
                          <button
                            onClick={() => handleToggleReceipt(record.id, !!record.receiptIssued)}
                            className={`text-[10px] font-bold mt-1 underline ${record.receiptIssued ? 'text-rose-600 hover:text-rose-700' : 'text-teal-600 hover:text-teal-700'}`}
                          >
                            {record.receiptIssued ? 'Remover Recibo' : 'Marcar Recibo'}
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-slate-600 line-clamp-1">{record.procedure}</p>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-slate-500 italic text-sm">Nenhum pagamento recebido este mês.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 print:hidden">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-teal-100 text-teal-600 rounded-lg">
              <DollarSign className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-slate-700">Receita Mensal</h3>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(monthlyIncome)}
          </p>
          <div className="mt-2 pt-2 border-t border-slate-100">
            <p className="text-sm font-medium text-teal-700">
              Declarado: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(monthlyDeclaredIncome)}
            </p>
            <p className="text-xs text-slate-500">Base para o Carnê-Leão</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-rose-100 text-rose-600 rounded-lg">
              <Calculator className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-slate-700">Estimativa IR (Carnê-Leão)</h3>
          </div>
          <p className="text-3xl font-bold text-slate-900">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(taxCalc.taxAmount)}
          </p>
          <p className="text-sm text-slate-500 mt-1">
            Alíquota efetiva: {taxCalc.effectiveRate.toFixed(2)}%
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
              <TrendingUp className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-slate-700">Receita Anual ({selectedYear})</h3>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(annualIncome)}
          </p>
          <div className="mt-2 pt-2 border-t border-slate-100">
            <p className="text-sm font-medium text-blue-700">
              Declarado: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(annualDeclaredIncome)}
            </p>
            <p className="text-xs text-slate-500">Total com recibo no ano</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden print:hidden">
        <div className="p-6 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <FileText className="h-5 w-5 text-slate-500" />
            Simulador do Carnê-Leão
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            Insira suas despesas dedutíveis (Livro Caixa) para ver o valor real do imposto a pagar no mês.
          </p>
        </div>
        
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Despesas Dedutíveis do Mês (R$)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-slate-500 sm:text-sm">R$</span>
              </div>
              <input
                type="number"
                min="0"
                step="0.01"
                value={deductibleExpenses || ''}
                onChange={(e) => setDeductibleExpenses(parseFloat(e.target.value) || 0)}
                className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                placeholder="0,00"
              />
            </div>
            <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <h4 className="text-sm font-medium text-slate-700 mb-2">O que pode ser deduzido?</h4>
              <ul className="text-sm text-slate-600 space-y-1 list-disc list-inside">
                <li>Aluguel do consultório</li>
                <li>Condomínio e IPTU</li>
                <li>Água, luz, telefone, internet</li>
                <li>Salário e encargos de funcionários</li>
                <li>Material de consumo (luvas, seringas, etc)</li>
                <li>Conselhos de classe (CRM/CRO)</li>
              </ul>
            </div>
          </div>

          <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
            <h4 className="font-medium text-slate-800 mb-4">Resumo do Cálculo</h4>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Rendimento Declarado (Com Recibo):</span>
                <span className="font-medium">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(taxCalc.grossIncome)}</span>
              </div>
              <div className="flex justify-between text-rose-600">
                <span>(-) Despesas Dedutíveis:</span>
                <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(taxCalc.deductibleExpenses)}</span>
              </div>
              <div className="pt-3 border-t border-slate-200 flex justify-between font-medium">
                <span className="text-slate-800">Base de Cálculo:</span>
                <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(taxCalc.baseCalc)}</span>
              </div>
              <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                <span className="text-slate-800 font-semibold">Imposto Devido (DARF):</span>
                <span className="text-xl font-bold text-teal-600">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(taxCalc.taxAmount)}
                </span>
              </div>
            </div>

            <div className="mt-6 flex items-start gap-2 text-xs text-slate-500 bg-white p-3 rounded border border-slate-100">
              <AlertCircle className="h-4 w-4 shrink-0 text-amber-500" />
              <p>
                Este é um cálculo estimado baseado na tabela progressiva mensal da Receita Federal. 
                Consulte sempre seu contador para a emissão oficial do DARF e preenchimento do Carnê-Leão Web.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recibo Anual (IR) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden print:hidden">
        <div className="p-6 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <Download className="h-5 w-5 text-slate-500" />
            Recibo Anual para Imposto de Renda
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            Gere um recibo consolidado com todos os pagamentos de um paciente no ano selecionado ({selectedYear}).
          </p>
        </div>
        <div className="p-6 flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-slate-700 mb-1">Selecione o Paciente</label>
            <select
              value={selectedPatientForReceipt}
              onChange={(e) => setSelectedPatientForReceipt(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none bg-white"
            >
              <option value="">-- Selecione --</option>
              {patients.filter(p => 
                (p.payments && p.payments.some(pay => pay.date.startsWith(selectedYear))) ||
                (p.financeiro && p.financeiro.some((record: any) => record.recordType === 'payment' && record.date.startsWith(selectedYear)))
              ).map(p => (
                <option key={p.id} value={p.id}>{p.fullName} (CPF: {p.cpf || 'Não informado'})</option>
              ))}
            </select>
          </div>
          <button
            onClick={handlePrintAnnualReceipt}
            disabled={!selectedPatientForReceipt || patientAnnualTotal === 0}
            className="flex items-center justify-center gap-2 px-6 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors w-full sm:w-auto h-[42px]"
          >
            <Printer className="h-4 w-4" />
            Gerar Recibo Anual
          </button>
        </div>
        {selectedPatientForReceipt && (
          <div className="px-6 pb-6 space-y-3">
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <span>Total Declarado (Com Recibo):</span>
                    <strong className="text-teal-700">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(patientAnnualTotal)}</strong>
                  </div>
                  {patientAnnualUndeclared > 0 && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <span>Total Não Declarado (Sem Recibo):</span>
                      <strong className="text-rose-600">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(patientAnnualUndeclared)}</strong>
                    </div>
                  )}
                </div>
                
                {patientAnnualUndeclared > 0 && (
                  <button
                    onClick={handleDeclareAllForPatient}
                    className="text-xs font-bold text-teal-700 hover:text-teal-800 bg-teal-50 hover:bg-teal-100 px-3 py-2 rounded-lg border border-teal-200 transition-all"
                  >
                    Declarar Tudo para este Paciente
                  </button>
                )}
              </div>
              
              {patientAnnualUndeclared > 0 && (
                <div className="mt-3 flex items-start gap-2 text-[11px] text-amber-600 bg-amber-50 p-2 rounded border border-amber-100">
                  <AlertCircle className="h-3 w-3 shrink-0 mt-0.5" />
                  <p>
                    Atenção: O paciente pagou um total de {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(patientAnnualTotal + patientAnnualUndeclared)}. 
                    Se você emitir o recibo anual com o valor total, clique em "Declarar Tudo" para que seu cálculo de imposto fique correto.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )}

  {/* Print View for Annual Receipt */}
      {printMode && patientForReceipt && (
        <div className="hidden print:block w-full max-w-3xl mx-auto pt-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 uppercase tracking-wider mb-2">Recibo Anual</h2>
            <p className="text-lg text-slate-600">Para fins de Declaração de Imposto de Renda</p>
            <p className="text-slate-500 mt-1">Ano-Calendário: {selectedYear}</p>
          </div>
          
          <div className="bg-white border-2 border-slate-200 rounded-2xl p-10 mb-12">
            <div className="space-y-6 text-slate-800 text-lg leading-relaxed text-justify">
              <p>
                Declaro para os devidos fins que recebi(emos) de <strong>{patientForReceipt.fullName}</strong>, 
                {patientForReceipt.cpf ? ` inscrito(a) no CPF sob o nº ${patientForReceipt.cpf},` : ''} 
                a importância total de <strong>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(patientAnnualTotal)}</strong> 
                {' '}({patientAnnualTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', currencyDisplay: 'name' })}), 
                referente a serviços prestados em saúde durante o ano de {selectedYear}.
              </p>
            </div>
          </div>

          <div className="flex justify-between items-end mt-24">
            <div className="text-slate-600 text-lg">
              <p>{settings?.address?.split('-')?.[1]?.trim() || 'Local'}, {formatDateLong(getLocalDateString())}</p>
            </div>
            <div className="text-center w-80">
              <div className="border-t-2 border-slate-800 pt-4">
                <p className="font-bold text-slate-900 text-lg">{settings?.doctorName || 'Nome do Profissional'}</p>
                <p className="text-slate-600">{settings?.crm || 'CRM/CRO'}</p>
                {settings?.cpf && <p className="text-slate-600">CPF: {settings.cpf}</p>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
