import React, { useState, useMemo } from 'react';
import { Calculator, AlertTriangle, CheckCircle2, XCircle, Info, DollarSign, Percent, Receipt } from 'lucide-react';
import { motion } from 'motion/react';
import { calculateMonthlyIR } from '../lib/taxCalculator';

export default function BusinessCalculator() {
  const [treatmentValue, setTreatmentValue] = useState<number>(0);
  const [costValue, setCostValue] = useState<number>(0);
  const [issueReceipt, setIssueReceipt] = useState<boolean>(true);
  const [otherCosts, setOtherCosts] = useState<number>(0);

  const results = useMemo(() => {
    const grossProfit = treatmentValue - costValue - otherCosts;
    
    // Tax calculation
    // Since tax is progressive and monthly, we estimate the tax impact of THIS specific deal
    // as if it were the only income, or we can use a simplified average rate (e.g. 15-27%)
    // To be more helpful, we'll show the tax based on the progressive table for this value
    const taxInfo = issueReceipt ? calculateMonthlyIR(treatmentValue, costValue + otherCosts) : { taxAmount: 0 };
    const taxAmount = taxInfo.taxAmount;
    
    const netProfit = grossProfit - taxAmount;
    const margin = treatmentValue > 0 ? (netProfit / treatmentValue) * 100 : 0;
    const markup = costValue > 0 ? ((treatmentValue - costValue) / costValue) * 100 : 0;

    let status: 'excellent' | 'good' | 'warning' | 'danger' = 'excellent';
    let message = '';

    if (netProfit <= 0) {
      status = 'danger';
      message = 'Prejuízo detectado! Você está pagando para trabalhar.';
    } else if (margin < 20) {
      status = 'danger';
      message = 'Margem muito baixa! O risco da operação não compensa o lucro.';
    } else if (margin < 40) {
      status = 'warning';
      message = 'Margem de atenção. Considere aumentar o valor ou reduzir custos.';
    } else if (margin < 60) {
      status = 'good';
      message = 'Bom negócio. Margem saudável para serviços odontológicos.';
    } else {
      status = 'excellent';
      message = 'Excelente negócio! Margem de lucro muito alta.';
    }

    return {
      grossProfit,
      taxAmount,
      netProfit,
      margin,
      markup,
      status,
      message
    };
  }, [treatmentValue, costValue, issueReceipt, otherCosts]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="bg-teal-700 p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <Calculator className="h-6 w-6 text-teal-200" />
          <h3 className="text-xl font-bold">Simulador de Lucro Real</h3>
        </div>
        <p className="text-teal-100 text-sm">
          Calcule se um tratamento vale a pena levando em conta custos, impostos e taxas.
        </p>
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Inputs */}
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-slate-400" />
              Valor do Tratamento (Venda)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">R$</span>
              <input
                type="number"
                value={treatmentValue || ''}
                onChange={(e) => setTreatmentValue(Number(e.target.value))}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none font-bold text-lg"
                placeholder="0,00"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
              <Info className="h-4 w-4 text-slate-400" />
              Custo Direto (Alinhador / Protético / Material)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">R$</span>
              <input
                type="number"
                value={costValue || ''}
                onChange={(e) => setCostValue(Number(e.target.value))}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none font-bold text-lg text-red-600"
                placeholder="0,00"
              />
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Dica: Se for parcelar a compra, use o valor total com juros.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
              <Percent className="h-4 w-4 text-slate-400" />
              Outros Custos (Taxa de Cartão / Comissão)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">R$</span>
              <input
                type="number"
                value={otherCosts || ''}
                onChange={(e) => setOtherCosts(Number(e.target.value))}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none font-bold text-lg text-red-600"
                placeholder="0,00"
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${issueReceipt ? 'bg-teal-100 text-teal-700' : 'bg-slate-200 text-slate-500'}`}>
                <Receipt className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-slate-800">Emitir Recibo?</p>
                <p className="text-xs text-slate-500">Calcula o impacto do Imposto de Renda (Carnê-Leão)</p>
              </div>
            </div>
            <button
              onClick={() => setIssueReceipt(!issueReceipt)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${issueReceipt ? 'bg-teal-600' : 'bg-slate-300'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${issueReceipt ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-6">
          <div className={`p-6 rounded-2xl border-2 transition-colors ${
            results.status === 'excellent' ? 'bg-emerald-50 border-emerald-200' :
            results.status === 'good' ? 'bg-teal-50 border-teal-200' :
            results.status === 'warning' ? 'bg-amber-50 border-amber-200' :
            'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-start gap-4">
              {results.status === 'excellent' || results.status === 'good' ? (
                <CheckCircle2 className={`h-8 w-8 mt-1 ${results.status === 'excellent' ? 'text-emerald-600' : 'text-teal-600'}`} />
              ) : results.status === 'warning' ? (
                <AlertTriangle className="h-8 w-8 mt-1 text-amber-600" />
              ) : (
                <XCircle className="h-8 w-8 mt-1 text-red-600" />
              )}
              <div>
                <h4 className={`text-xl font-bold ${
                  results.status === 'excellent' ? 'text-emerald-900' :
                  results.status === 'good' ? 'text-teal-900' :
                  results.status === 'warning' ? 'text-amber-900' :
                  'text-red-900'
                }`}>
                  {results.status === 'excellent' ? 'Excelente Negócio' :
                   results.status === 'good' ? 'Bom Negócio' :
                   results.status === 'warning' ? 'Atenção' :
                   'Negócio Arriscado'}
                </h4>
                <p className={`mt-1 text-sm ${
                  results.status === 'excellent' ? 'text-emerald-700' :
                  results.status === 'good' ? 'text-teal-700' :
                  results.status === 'warning' ? 'text-amber-700' :
                  'text-red-700'
                }`}>
                  {results.message}
                </p>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-4">
              <div className="bg-white/50 p-4 rounded-xl">
                <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Lucro Líquido</p>
                <p className={`text-2xl font-black ${results.netProfit > 0 ? 'text-slate-900' : 'text-red-600'}`}>
                  {formatCurrency(results.netProfit)}
                </p>
              </div>
              <div className="bg-white/50 p-4 rounded-xl">
                <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Margem Real</p>
                <p className={`text-2xl font-black ${results.margin > 40 ? 'text-emerald-600' : results.margin > 20 ? 'text-amber-600' : 'text-red-600'}`}>
                  {results.margin.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 border-b border-slate-100">
              <span className="text-slate-600">Lucro Bruto (Sem Imposto)</span>
              <span className="font-bold text-slate-900">{formatCurrency(results.grossProfit)}</span>
            </div>
            <div className="flex justify-between items-center p-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-slate-600">Imposto Estimado (IR)</span>
                {!issueReceipt && <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">Isento</span>}
              </div>
              <span className={`font-bold ${issueReceipt ? 'text-red-600' : 'text-slate-400'}`}>
                - {formatCurrency(results.taxAmount)}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 border-b border-slate-100">
              <span className="text-slate-600">Markup (Sobre o Custo)</span>
              <span className="font-bold text-slate-900">{results.markup.toFixed(1)}%</span>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-xl flex gap-3 items-start">
            <Info className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
            <div className="text-xs text-blue-800 leading-relaxed">
              <p className="font-bold mb-1">Por que isso importa?</p>
              <p>
                Muitas vezes o valor parece alto (R$ 8.200), mas após pagar o fornecedor (R$ 4.910) e o imposto (aprox. 27,5% sobre o lucro), o que sobra pode não pagar nem a hora clínica. 
                <strong> Idealmente, sua margem líquida deve estar acima de 40%.</strong>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
