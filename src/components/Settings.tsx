import React, { useState, useEffect } from 'react';
import { Save, Building2, Trash2, ShieldAlert, Lock, AlertTriangle, DollarSign, Plus, List, Edit3 } from 'lucide-react';
import { motion } from 'motion/react';
import { ClinicSettings, getSettings, saveSettings } from '../lib/settings';
import { resetCollection, clearPatientClinicalData } from '../lib/storage';

interface SettingsProps {
  onSave?: () => void;
}

export default function Settings({ onSave }: SettingsProps) {
  const [settings, setSettings] = useState<ClinicSettings>({
    name: '',
    address: '',
    phone: '',
    doctorName: '',
    crm: '',
    cpf: '',
    agendaStartTime: '08:00',
    agendaEndTime: '18:00'
  });
  const [saved, setSaved] = useState(false);
  const [showResetMenu, setShowResetMenu] = useState(false);
  const [password, setPassword] = useState('');
  const [isAuth, setIsAuth] = useState(false);
  const [resetStatus, setResetStatus] = useState<{type: string, success: boolean} | null>(null);
  const [newProcedure, setNewProcedure] = useState({ name: '', description: '', basePrice: 0 });
  const [newCardFee, setNewCardFee] = useState({ installments: 1, percentage: 0 });

  useEffect(() => {
    const loadSettings = async () => {
      const data = await getSettings();
      setSettings(data);
    };
    loadSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await saveSettings(settings);
      setSaved(true);
      if (onSave) onSave();
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error("Erro ao salvar configurações:", error);
    }
  };

  const handleReset = async (type: 'all' | 'patients' | 'financial' | 'agenda') => {
    if (!window.confirm(`TEM CERTEZA? Esta ação irá apagar permanentemente os dados de: ${type === 'all' ? 'TUDO' : type}. Esta ação não pode ser desfeita.`)) return;
    
    try {
      if (type === 'all') {
        await resetCollection('pacientes');
        await resetCollection('agenda');
        await resetCollection('financeiro_geral');
      } else if (type === 'patients') {
        await resetCollection('pacientes');
      } else if (type === 'financial') {
        await resetCollection('financeiro_geral');
        await clearPatientClinicalData('financial');
      } else if (type === 'agenda') {
        await resetCollection('agenda');
      }
      
      setResetStatus({ type, success: true });
      setTimeout(() => setResetStatus(null), 5000);
      if (onSave) onSave(); // To refresh global state if needed
    } catch (error) {
      console.error("Erro ao resetar dados:", error);
      alert("Erro ao resetar dados. Verifique o console.");
    }
  };

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    const correctPassword = settings.financialPassword || 'Samuel20206@';
    if (password === correctPassword) {
      setIsAuth(true);
    } else {
      alert('Senha incorreta!');
      setPassword('');
    }
  };

  const handleAddProcedure = () => {
    if (!newProcedure.name.trim()) return;
    const proc = { ...newProcedure, id: crypto.randomUUID() };
    setSettings({
      ...settings,
      procedures: [...(settings.procedures || []), proc]
    });
    setNewProcedure({ name: '', description: '', basePrice: 0 });
  };

  const handleRemoveProcedure = (id: string) => {
    setSettings({
      ...settings,
      procedures: settings.procedures?.filter(p => p.id !== id)
    });
  };

  const handleAddCardFee = () => {
    if (newCardFee.percentage < 0) return;
    const fee = { ...newCardFee, id: crypto.randomUUID() };
    setSettings({
      ...settings,
      cardFees: [...(settings.cardFees || []), fee].sort((a, b) => a.installments - b.installments)
    });
    setNewCardFee({ installments: 1, percentage: 0 });
  };

  const handleRemoveCardFee = (id: string) => {
    setSettings({
      ...settings,
      cardFees: settings.cardFees?.filter(f => f.id !== id)
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-3xl mx-auto space-y-6"
    >
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center gap-2">
          <Building2 className="h-5 w-5 text-slate-500" />
          <h2 className="font-semibold text-slate-800">Configurações da Clínica</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nome da Clínica / Consultório</label>
              <input
                type="text"
                value={settings.name}
                onChange={(e) => setSettings({...settings, name: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                placeholder="Ex: Clínica Saúde Integral"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Endereço Completo</label>
              <input
                type="text"
                value={settings.address}
                onChange={(e) => setSettings({...settings, address: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                placeholder="Ex: Rua das Flores, 123 - Sala 405 - Centro, São Paulo/SP"
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Telefone / WhatsApp</label>
                <input
                  type="text"
                  value={settings.phone}
                  onChange={(e) => setSettings({...settings, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                  placeholder="Ex: (11) 99999-9999"
                  required
                />
              </div>
            </div>

            <div className="border-t border-slate-200 pt-6 mt-2">
              <h3 className="text-sm font-semibold text-slate-800 mb-4">Configurações da Agenda</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Horário de Início</label>
                  <input
                    type="time"
                    value={settings.agendaStartTime || '08:00'}
                    onChange={(e) => setSettings({...settings, agendaStartTime: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Horário de Término</label>
                  <input
                    type="time"
                    value={settings.agendaEndTime || '18:00'}
                    onChange={(e) => setSettings({...settings, agendaEndTime: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-6 mt-2">
              <h3 className="text-sm font-semibold text-slate-800 mb-4">Dados do Profissional (Para o rodapé das impressões)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nome do(a) Médico(a)</label>
                  <input
                    type="text"
                    value={settings.doctorName}
                    onChange={(e) => setSettings({...settings, doctorName: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                    placeholder="Ex: Dra. Maria Silva"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">CRM / CRO</label>
                  <input
                    type="text"
                    value={settings.crm}
                    onChange={(e) => setSettings({...settings, crm: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                    placeholder="Ex: CRM-SP 123456"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">CPF (Para Recibos/IR)</label>
                  <input
                    type="text"
                    value={settings.cpf || ''}
                    onChange={(e) => setSettings({...settings, cpf: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                    placeholder="Ex: 000.000.000-00"
                  />
                </div>
              </div>
            </div>
          </div>

            <div className="border-t border-slate-200 pt-6 mt-2">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <List className="h-5 w-5 text-teal-600" />
                  <h3 className="text-sm font-semibold text-slate-800">Catálogo de Procedimentos</h3>
                </div>
              </div>
              
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-4">
                <p className="text-xs text-slate-500 mb-4">Cadastre seus serviços padrão para agilizar a criação de orçamentos.</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                  <div className="md:col-span-2">
                    <input
                      type="text"
                      placeholder="Nome do Procedimento"
                      value={newProcedure.name}
                      onChange={(e) => setNewProcedure({...newProcedure, name: e.target.value})}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                    />
                  </div>
                  <div>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">R$</span>
                      <input
                        type="number"
                        placeholder="Valor"
                        value={newProcedure.basePrice || ''}
                        onChange={(e) => setNewProcedure({...newProcedure, basePrice: Number(e.target.value)})}
                        className="w-full pl-8 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder="Descrição curta (opcional)"
                    value={newProcedure.description}
                    onChange={(e) => setNewProcedure({...newProcedure, description: e.target.value})}
                    className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddProcedure}
                    className="px-4 py-2 bg-teal-600 text-white text-sm font-bold rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Adicionar
                  </button>
                </div>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {settings.procedures && settings.procedures.length > 0 ? (
                  settings.procedures.map((proc) => (
                    <div key={proc.id} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg group">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-800 text-sm">{proc.name}</span>
                          <span className="text-teal-600 font-bold text-sm">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(proc.basePrice)}
                          </span>
                        </div>
                        {proc.description && <p className="text-xs text-slate-500">{proc.description}</p>}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveProcedure(proc.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                    <p className="text-sm text-slate-400">Nenhum procedimento cadastrado.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-slate-200 pt-6 mt-2">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-rose-600" />
                  <h3 className="text-sm font-semibold text-slate-800">Taxas de Cartão (Crédito/Débito)</h3>
                </div>
              </div>
              
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-4">
                <p className="text-xs text-slate-500 mb-4">Configure as taxas que serão descontadas automaticamente ao registrar pagamentos em cartão.</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Parcelas</label>
                    <select
                      value={newCardFee.installments}
                      onChange={(e) => setNewCardFee({...newCardFee, installments: Number(e.target.value)})}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none bg-white"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => (
                        <option key={n} value={n}>{n === 1 ? '1x (ou Débito)' : `${n}x`}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Taxa (%)</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Ex: 2.5"
                        value={newCardFee.percentage || ''}
                        onChange={(e) => setNewCardFee({...newCardFee, percentage: Number(e.target.value)})}
                        className="w-full pr-8 pl-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">%</span>
                    </div>
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={handleAddCardFee}
                      className="w-full px-4 py-2 bg-rose-600 text-white text-sm font-bold rounded-lg hover:bg-rose-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Adicionar Taxa
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                {settings.cardFees && settings.cardFees.length > 0 ? (
                  settings.cardFees.map((fee) => (
                    <div key={fee.id} className="flex items-center justify-between p-2 bg-white border border-slate-200 rounded-lg group">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">{fee.installments === 1 ? '1x / Débito' : `${fee.installments}x`}</span>
                        <span className="font-bold text-rose-600 text-sm">{fee.percentage}%</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveCardFee(fee.id)}
                        className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-4 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                    <p className="text-xs text-slate-400">Nenhuma taxa configurada.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-slate-200 pt-6 mt-2">
              <div className="flex items-center gap-2 mb-4">
                <Lock className="h-5 w-5 text-slate-500" />
                <h3 className="text-sm font-semibold text-slate-800">Segurança do Sistema</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Senha do Financeiro / Configurações</label>
                  <input
                    type="text"
                    value={settings.financialPassword || ''}
                    onChange={(e) => setSettings({...settings, financialPassword: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                    placeholder="Ex: SenhaSegura123"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Esta senha protege as áreas de Financeiro e Configurações.</p>
                </div>
              </div>
            </div>

          <div className="flex items-center justify-end gap-4 pt-4 border-t border-slate-200">
            {saved && (
              <span className="text-teal-600 text-sm font-medium animate-pulse">
                Configurações salvas com sucesso!
              </span>
            )}
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg transition-colors"
            >
              <Save className="h-4 w-4" />
              Salvar Configurações
            </button>
          </div>
        </form>
      </div>

      {/* Seção de Reset de Dados */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-xl shadow-sm border border-rose-200 overflow-hidden"
      >
        <div className="bg-rose-50 px-6 py-4 border-b border-rose-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-rose-600" />
            <h2 className="font-semibold text-rose-800">Zona de Perigo: Gerenciamento de Dados</h2>
          </div>
          {!showResetMenu && (
            <button 
              onClick={() => setShowResetMenu(true)}
              className="text-xs font-bold text-rose-700 hover:text-rose-800 bg-rose-100 px-3 py-1.5 rounded-lg transition-colors"
            >
              Abrir Opções de Reset
            </button>
          )}
        </div>

        {showResetMenu && (
          <div className="p-6">
            {!isAuth ? (
              <form onSubmit={handleAuth} className="max-w-sm mx-auto text-center space-y-4 py-4">
                <div className="flex justify-center">
                  <div className="p-3 bg-rose-100 rounded-full">
                    <Lock className="h-6 w-6 text-rose-600" />
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">Acesso Restrito</h3>
                  <p className="text-sm text-slate-500">Insira a senha mestra para prosseguir.</p>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Digite a senha..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none text-center"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button 
                    type="button"
                    onClick={() => { setShowResetMenu(false); setPassword(''); }}
                    className="flex-1 px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-lg transition-colors"
                  >
                    Confirmar
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-6 animate-in fade-in zoom-in-95 duration-100">
                <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-800">
                    <p className="font-bold">Atenção!</p>
                    <p>As ações abaixo são irreversíveis. Uma vez deletados, os dados não poderão ser recuperados.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => handleReset('patients')}
                    className="flex flex-col items-center justify-center p-6 border border-slate-200 rounded-xl hover:bg-rose-50 hover:border-rose-200 transition-all group"
                  >
                    <Trash2 className="h-8 w-8 text-slate-400 group-hover:text-rose-600 mb-2" />
                    <span className="font-bold text-slate-700 group-hover:text-rose-800">Resetar Pacientes</span>
                    <span className="text-xs text-slate-500 text-center mt-1">Apaga todos os cadastros de pacientes e seus históricos.</span>
                  </button>

                  <button
                    onClick={() => handleReset('financial')}
                    className="flex flex-col items-center justify-center p-6 border border-slate-200 rounded-xl hover:bg-rose-50 hover:border-rose-200 transition-all group"
                  >
                    <DollarSign className="h-8 w-8 text-slate-400 group-hover:text-rose-600 mb-2" />
                    <span className="font-bold text-slate-700 group-hover:text-rose-800">Resetar Financeiro</span>
                    <span className="text-xs text-slate-500 text-center mt-1">Limpa o caixa global e dados de pagamentos dos pacientes.</span>
                  </button>

                  <button
                    onClick={() => handleReset('agenda')}
                    className="flex flex-col items-center justify-center p-6 border border-slate-200 rounded-xl hover:bg-rose-50 hover:border-rose-200 transition-all group"
                  >
                    <Trash2 className="h-8 w-8 text-slate-400 group-hover:text-rose-600 mb-2" />
                    <span className="font-bold text-slate-700 group-hover:text-rose-800">Resetar Agenda</span>
                    <span className="text-xs text-slate-500 text-center mt-1">Apaga todos os agendamentos realizados.</span>
                  </button>

                  <button
                    onClick={() => handleReset('all')}
                    className="flex flex-col items-center justify-center p-6 border-2 border-rose-100 bg-rose-50/30 rounded-xl hover:bg-rose-100 hover:border-rose-300 transition-all group"
                  >
                    <AlertTriangle className="h-8 w-8 text-rose-400 group-hover:text-rose-600 mb-2" />
                    <span className="font-bold text-rose-700">RESET TOTAL</span>
                    <span className="text-xs text-rose-600/70 text-center mt-1">Apaga TUDO (Pacientes, Agenda e Financeiro).</span>
                  </button>
                </div>

                {resetStatus && (
                  <div className="p-3 bg-emerald-100 text-emerald-700 text-center rounded-lg font-bold animate-bounce">
                    Dados de {resetStatus.type === 'all' ? 'TUDO' : resetStatus.type} resetados com sucesso!
                  </div>
                )}

                <div className="flex justify-center pt-2">
                  <button 
                    onClick={() => { setIsAuth(false); setPassword(''); setShowResetMenu(false); }}
                    className="text-sm font-medium text-slate-500 hover:text-slate-700 underline"
                  >
                    Fechar e Bloquear Acesso
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
