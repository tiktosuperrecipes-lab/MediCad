import React, { useState, useEffect } from 'react';
import { ShieldCheck, Calendar, Plus, Trash2, Edit2, Save, X, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MaintenanceRecord } from '../types';
import { getMaintenanceRecords, saveMaintenanceRecord, deleteMaintenanceRecord } from '../lib/storage';

const INITIAL_FORM = {
  title: '',
  lastDate: new Date().toISOString().split('T')[0],
  nextDate: '',
  frequencyMonths: 6,
  notes: ''
};

export default function MaintenanceReminders() {
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(INITIAL_FORM);

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = async () => {
    setIsLoading(true);
    try {
      const data = await getMaintenanceRecords();
      setRecords(data.sort((a, b) => new Date(a.lastDate).getTime() - new Date(b.lastDate).getTime()));
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStatus = (nextDate?: string): 'Em dia' | 'Vencendo' | 'Atrasado' => {
    if (!nextDate) return 'Em dia';
    const next = new Date(nextDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const diffTime = next.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'Atrasado';
    if (diffDays <= 15) return 'Vencendo';
    return 'Em dia';
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const status = calculateStatus(form.nextDate);
      await saveMaintenanceRecord({
        ...form,
        id: editingId || undefined,
        status,
        createdAt: new Date().toISOString()
      } as any);
      
      setIsModalOpen(false);
      setEditingId(null);
      setForm(INITIAL_FORM);
      loadRecords();
    } catch (error) {
      alert("Erro ao salvar lembrete.");
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Deseja excluir este lembrete?")) {
      await deleteMaintenanceRecord(id);
      loadRecords();
    }
  };

  const handleEdit = (record: MaintenanceRecord) => {
    setEditingId(record.id);
    setForm({
      title: record.title,
      lastDate: record.lastDate,
      nextDate: record.nextDate || '',
      frequencyMonths: record.frequencyMonths || 6,
      notes: record.notes || ''
    });
    setIsModalOpen(true);
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'Em dia':
        return <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full text-xs font-bold uppercase"><CheckCircle2 className="h-3 w-3" /> Em dia</span>;
      case 'Vencendo':
        return <span className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full text-xs font-bold uppercase"><Clock className="h-3 w-3" /> Vencendo</span>;
      case 'Atrasado':
        return <span className="flex items-center gap-1 text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full text-xs font-bold uppercase"><AlertTriangle className="h-3 w-3" /> Atrasado</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Manutenção e Vigilância</h2>
          <p className="text-slate-500">Controle de prazos para alvarás, dedetização e limpezas obrigatórias.</p>
        </div>
        <button
          onClick={() => {
            setEditingId(null);
            setForm(INITIAL_FORM);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-all shadow-sm font-medium"
        >
          <Plus className="h-4 w-4" />
          <span>Novo Lembrete</span>
        </button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="h-10 w-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium">Carregando lembretes...</p>
        </div>
      ) : records.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center">
          <div className="bg-slate-50 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="h-8 w-8 text-slate-300" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">Nenhum lembrete registrado</h3>
          <p className="text-slate-500 max-w-sm mx-auto mb-6">
            Registre as datas de manutenções obrigatórias para não perder os prazos da Vigilância Sanitária.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="text-teal-600 font-bold hover:underline"
          >
            Começar agora
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {records.map((record) => (
            <motion.div
              layout
              key={record.id}
              className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col"
            >
              <div className="p-5 flex-1">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-bold text-slate-800 text-lg">{record.title}</h3>
                  {getStatusDisplay(calculateStatus(record.nextDate))}
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" /> Última:</span>
                    <span className="font-medium text-slate-700">{new Date(record.lastDate).toLocaleDateString('pt-BR')}</span>
                  </div>
                  {record.nextDate && (
                    <div className="flex items-center justify-between text-slate-500">
                      <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> Próxima:</span>
                      <span className={`font-bold ${calculateStatus(record.nextDate) === 'Atrasado' ? 'text-rose-600' : 'text-slate-900'}`}>
                        {new Date(record.nextDate).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  )}
                  {record.notes && (
                    <div className="mt-3 p-2 bg-slate-50 rounded text-slate-500 border-l-2 border-slate-200 italic">
                      "{record.notes}"
                    </div>
                  )}
                </div>
              </div>
              
              <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  onClick={() => handleEdit(record)}
                  className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-all"
                  title="Editar"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(record.id)}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                  title="Excluir"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal de Cadastro/Edição */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="bg-teal-600 p-6 text-white flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold">{editingId ? 'Editar Lembrete' : 'Novo Lembrete'}</h3>
                  <p className="text-teal-100 text-sm opacity-90">Controle de datas importantes</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Título do Lembrete</label>
                  <input
                    required
                    type="text"
                    placeholder="Ex: Dedetização, Caixa D'água, Alvará..."
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition-all outline-none"
                    value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Última Realização</label>
                    <input
                      required
                      type="date"
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition-all outline-none"
                      value={form.lastDate}
                      onChange={e => setForm({ ...form, lastDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Próxima Data (Venc.)</label>
                    <input
                      type="date"
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition-all outline-none"
                      value={form.nextDate}
                      onChange={e => setForm({ ...form, nextDate: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Observações (Opcional)</label>
                  <textarea
                    rows={3}
                    placeholder="Ex: Empresa responsável, número do protocolo..."
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition-all outline-none resize-none"
                    value={form.notes}
                    onChange={e => setForm({ ...form, notes: e.target.value })}
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-4 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-700 transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    <Save className="h-5 w-5" />
                    Salvar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
