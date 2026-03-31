import React, { useState, useEffect } from 'react';
import { Save, Building2 } from 'lucide-react';
import { ClinicSettings, getSettings, saveSettings } from '../lib/settings';

export default function Settings() {
  const [settings, setSettings] = useState<ClinicSettings>({
    name: '',
    address: '',
    phone: '',
    doctorName: '',
    crm: '',
    cpf: ''
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSettings(getSettings());
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-3xl mx-auto">
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
    </div>
  );
}
