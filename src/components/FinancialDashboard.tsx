import React, { useState, useMemo, useEffect } from 'react';
import { Calculator, DollarSign, TrendingUp, TrendingDown, FileText, AlertCircle, Printer, Download } from 'lucide-react';
import { Patient } from '../types';
import { calculateMonthlyIR } from '../lib/taxCalculator';
import { getSettings, ClinicSettings } from '../lib/settings';
import { getLocalDateString, formatDateLong } from '../lib/dateUtils';

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
  
  useEffect(() => {
    getSettings().then(setSettings);
  }, []);

  // Calculate total income for the selected month/year
  const monthlyIncome = useMemo(() => {
    let total = 0;
    patients.forEach(patient => {
      patient.payments?.forEach(payment => {
        if (payment.date.startsWith(`${selectedYear}-${selectedMonth}`)) {
          total += payment.amount;
        }
      });
      patient.financeiro?.forEach((record: any) => {
        if (record.recordType === 'payment' && record.date.startsWith(`${selectedYear}-${selectedMonth}`)) {
          total += record.amount;
        }
      });
    });
    return total;
  }, [patients, selectedYear, selectedMonth]);

  // Calculate annual income for the selected year
  const annualIncome = useMemo(() => {
    let total = 0;
    patients.forEach(patient => {
      patient.payments?.forEach(payment => {
        if (payment.date.startsWith(selectedYear)) {
          total += payment.amount;
        }
      });
      patient.financeiro?.forEach((record: any) => {
        if (record.recordType === 'payment' && record.date.startsWith(selectedYear)) {
          total += record.amount;
        }
      });
    });
    return total;
  }, [patients, selectedYear]);

  const taxCalc = calculateMonthlyIR(monthlyIncome, deductibleExpenses);

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
  const patientAnnualTotal = useMemo(() => {
    if (!patientForReceipt) return 0;
    
    let total = 0;
    
    // Old payments
    patientForReceipt.payments?.forEach(p => {
      if (p.date.startsWith(selectedYear)) {
        total += p.amount;
      }
    });
    
    // New financeiro records
    patientForReceipt.financeiro?.forEach((record: any) => {
      if (record.recordType === 'payment' && record.date.startsWith(selectedYear)) {
        total += record.amount;
      }
    });
    
    return total;
  }, [patientForReceipt, selectedYear]);

  return (
    <div className={`max-w-5xl mx-auto space-y-6 ${printMode ? 'print:space-y-0' : ''}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Financeiro & Impostos</h2>
          <p className="text-slate-500">Acompanhe seus recebimentos e estimativa do Carnê-Leão.</p>
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 print:hidden">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-teal-100 text-teal-600 rounded-lg">
              <DollarSign className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-slate-700">Receita Mensal</h3>
          </div>
          <p className="text-3xl font-bold text-slate-900">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(monthlyIncome)}
          </p>
          <p className="text-sm text-slate-500 mt-1">Total recebido no mês</p>
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
          <p className="text-3xl font-bold text-slate-900">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(annualIncome)}
          </p>
          <p className="text-sm text-slate-500 mt-1">Total recebido no ano</p>
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
                <span className="text-slate-600">Rendimento Bruto:</span>
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
        {selectedPatientForReceipt && patientAnnualTotal > 0 && (
          <div className="px-6 pb-6 text-sm text-slate-600">
            Valor total a ser declarado em {selectedYear}: <strong className="text-slate-900">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(patientAnnualTotal)}</strong>
          </div>
        )}
      </div>

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
