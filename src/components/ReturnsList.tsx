import React, { useMemo } from 'react';
import { MessageSquare, Calendar, User, Phone, AlertCircle, Search } from 'lucide-react';
import { Patient } from '../types';
import { ClinicSettings } from '../lib/settings';

interface ReturnsListProps {
  patients: Patient[];
  clinicSettings: ClinicSettings | null;
}

export default function ReturnsList({ patients, clinicSettings }: ReturnsListProps) {
  const [searchTerm, setSearchTerm] = React.useState('');

  const returnPatients = useMemo(() => {
    const today = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setDate(today.getDate() - 180);

    return patients.filter(patient => {
      // Se não tem histórico clínico, entra na lista
      if (!patient.historico_clinico || patient.historico_clinico.length === 0) {
        return true;
      }

      // Encontrar a data da última evolução
      // O formato é "DD/MM/YYYY HH:mm:ss: texto"
      const lastEvolution = patient.historico_clinico[0]; // Assumindo que o mais recente está no topo (arrayUnion adiciona ao fim, mas o app exibe invertido ou adicionamos ao início no estado?)
      // Na verdade, arrayUnion adiciona ao fim. Vamos pegar o último elemento.
      const lastEntry = patient.historico_clinico[patient.historico_clinico.length - 1];
      
      try {
        const datePart = lastEntry.split(': ')[0]; // "DD/MM/YYYY HH:mm:ss"
        const [date, time] = datePart.split(' ');
        const [day, month, year] = date.split('/').map(Number);
        const [hour, minute, second] = time.split(':').map(Number);
        
        const lastDate = new Date(year, month - 1, day, hour, minute, second);
        
        return lastDate < sixMonthsAgo;
      } catch (e) {
        console.error("Erro ao processar data de evolução:", lastEntry);
        return true; // Na dúvida, inclui na lista
      }
    }).sort((a, b) => {
      // Ordenar por quem está há mais tempo sem vir (opcional)
      return a.fullName.localeCompare(b.fullName);
    });
  }, [patients]);

  const filteredPatients = returnPatients.filter(p => 
    p.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.whatsapp.includes(searchTerm)
  );

  const handleWhatsAppClick = (patient: Patient) => {
    const clinicName = clinicSettings?.name || 'nossa clínica';
    const message = `Olá ${patient.fullName.split(' ')[0]}, tudo bem? Aqui é da clínica do Dr(a). ${clinicName}. Notamos que faz mais de 6 meses da sua última revisão preventiva. A saúde bucal em dia evita problemas maiores! Vamos agendar sua limpeza para esta semana?`;
    
    // Limpar o número de telefone (remover caracteres não numéricos)
    const cleanPhone = patient.whatsapp.replace(/\D/g, '');
    const whatsappUrl = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(message)}`;
    
    window.open(whatsappUrl, '_blank');
  };

  const getLastConsultationDate = (patient: Patient) => {
    if (!patient.historico_clinico || patient.historico_clinico.length === 0) {
      return 'Nunca registrado';
    }
    const lastEntry = patient.historico_clinico[patient.historico_clinico.length - 1];
    return lastEntry.split(': ')[0].split(' ')[0];
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Inteligência de Retornos</h2>
          <p className="text-slate-500">Pacientes que não realizam procedimentos há mais de 180 dias.</p>
        </div>
        
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar paciente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredPatients.length > 0 ? (
          filteredPatients.map((patient) => (
            <div 
              key={patient.id}
              className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-teal-100 rounded-full flex items-center justify-center text-teal-700">
                  <User className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{patient.fullName}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1 text-xs text-slate-500">
                      <Calendar className="h-3 w-3" />
                      Última Consulta: {getLastConsultationDate(patient)}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-slate-500">
                      <Phone className="h-3 w-3" />
                      {patient.whatsapp}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleWhatsAppClick(patient)}
                className="flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg transition-all shadow-sm hover:shadow-md active:scale-95"
              >
                <MessageSquare className="h-4 w-4" />
                Lembrar no WhatsApp
              </button>
            </div>
          ))
        ) : (
          <div className="bg-white p-12 text-center rounded-xl border border-dashed border-slate-300">
            <div className="inline-flex items-center justify-center h-16 w-16 bg-slate-100 rounded-full text-slate-400 mb-4">
              <AlertCircle className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Tudo em dia!</h3>
            <p className="text-slate-500 max-w-xs mx-auto">
              Não há pacientes pendentes de retorno preventivo no momento.
            </p>
          </div>
        )}
      </div>

      <div className="bg-teal-50 border border-teal-100 p-4 rounded-xl flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-teal-600 shrink-0 mt-0.5" />
        <div className="text-sm text-teal-800">
          <p className="font-bold">Dica de Pós-Venda:</p>
          <p>Manter o contato preventivo aumenta a fidelização e garante que o paciente realize a manutenção necessária antes que problemas graves apareçam.</p>
        </div>
      </div>
    </div>
  );
}
