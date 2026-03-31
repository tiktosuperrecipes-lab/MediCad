import React from 'react';
import { Bell, MessageCircle, Calendar } from 'lucide-react';
import { Patient } from '../types';

export default function ReturnAlerts({ patients }: { patients: Patient[] }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);

  const alerts = patients
    .filter(p => {
      if (!p.nextReturn) return false;
      const [year, month, day] = p.nextReturn.split('-');
      const returnDate = new Date(Number(year), Number(month) - 1, Number(day));
      return returnDate <= nextWeek;
    })
    .sort((a, b) => {
      return new Date(a.nextReturn!).getTime() - new Date(b.nextReturn!).getTime();
    });

  if (alerts.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6 print:hidden">
        <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center gap-2">
          <Bell className="h-5 w-5 text-slate-400" />
          <h2 className="font-semibold text-slate-700">Alertas de Retorno</h2>
        </div>
        <div className="p-6 text-center text-slate-500 text-sm">
          Nenhum paciente com retorno agendado para os próximos 7 dias.
        </div>
      </div>
    );
  }

  const getStatus = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-');
    const returnDate = new Date(Number(year), Number(month) - 1, Number(day));
    
    if (returnDate < today) return { label: 'Atrasado', color: 'text-red-700 bg-red-50 border-red-200' };
    if (returnDate.getTime() === today.getTime()) return { label: 'Hoje', color: 'text-amber-700 bg-amber-50 border-amber-200' };
    return { label: 'Na semana', color: 'text-blue-700 bg-blue-50 border-blue-200' };
  };

  const handleWhatsApp = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const text = encodeURIComponent('Olá, aqui é do consultório. Verificamos que está na hora do seu retorno. Podemos agendar?');
    window.open(`https://wa.me/55${cleanPhone}?text=${text}`, '_blank');
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-amber-200 overflow-hidden mb-6 print:hidden">
      <div className="bg-amber-50 px-4 py-3 border-b border-amber-200 flex items-center gap-2">
        <Bell className="h-5 w-5 text-amber-600" />
        <h2 className="font-semibold text-amber-900">Alertas de Retorno</h2>
      </div>
      <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
        {alerts.map(patient => {
          const status = getStatus(patient.nextReturn!);
          return (
            <div key={patient.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
              <div className="flex items-start gap-3">
                <div className="mt-1">
                  <Calendar className="h-5 w-5 text-slate-400" />
                </div>
                <div>
                  <h3 className="font-medium text-slate-800">{patient.fullName}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${status.color}`}>
                      {status.label}
                    </span>
                    <span className="text-sm text-slate-500">
                      {patient.nextReturn!.split('-').reverse().join('/')}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleWhatsApp(patient.whatsapp)}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition-colors w-full sm:w-auto"
              >
                <MessageCircle className="h-4 w-4" />
                Avisar via WhatsApp
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
