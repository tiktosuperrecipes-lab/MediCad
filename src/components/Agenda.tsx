import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, FileText, CheckCircle, X, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Patient, Appointment } from '../types';
import { getAppointments, saveAppointment, deleteAppointment } from '../lib/storage';
import { getLocalDateString } from '../lib/dateUtils';
import { getSettings, ClinicSettings } from '../lib/settings';

interface AgendaProps {
  patients: Patient[];
  onAddNewPatient: () => void;
}

export default function Agenda({ patients, onAddNewPatient }: AgendaProps) {
  const [selectedDate, setSelectedDate] = useState(getLocalDateString());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTime, setSelectedTime] = useState('');
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [settings, setSettings] = useState<ClinicSettings | null>(null);

  const [formData, setFormData] = useState({
    patientId: '',
    procedure: '',
    status: 'Agendado' as Appointment['status']
  });

  useEffect(() => {
    getSettings().then(setSettings);
  }, []);

  // Generate time slots dynamically based on settings
  const timeSlots = React.useMemo(() => {
    const start = settings?.agendaStartTime || '08:00';
    const end = settings?.agendaEndTime || '18:00';

    const slots = [];
    let [startHour, startMin] = start.split(':').map(Number);
    const [endHour, endMin] = end.split(':').map(Number);

    let currentHour = startHour;
    let currentMin = startMin;

    // Safety check to prevent infinite loops if end < start
    if (endHour < startHour || (endHour === startHour && endMin < startMin)) {
      return ['08:00', '08:30', '09:00', '09:30', '10:00']; // Fallback
    }

    while (currentHour < endHour || (currentHour === endHour && currentMin <= endMin)) {
      slots.push(`${currentHour.toString().padStart(2, '0')}:${currentMin.toString().padStart(2, '0')}`);
      currentMin += 30;
      if (currentMin >= 60) {
        currentHour += 1;
        currentMin -= 60;
      }
    }
    return slots;
  }, [settings]);

  const loadAppointments = async () => {
    setLoading(true);
    try {
      const data = await getAppointments(selectedDate);
      setAppointments(data);
    } catch (error) {
      console.error("Failed to load appointments", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, [selectedDate]);

  const handleOpenModal = (time: string, appointment?: Appointment) => {
    setSelectedTime(time);
    if (appointment) {
      setEditingAppointment(appointment);
      setFormData({
        patientId: appointment.patientId,
        procedure: appointment.procedure,
        status: appointment.status
      });
    } else {
      setEditingAppointment(null);
      setFormData({
        patientId: '',
        procedure: '',
        status: 'Agendado'
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingAppointment(null);
  };

  const handleSave = async () => {
    if (!formData.patientId) {
      alert('Por favor, selecione um paciente.');
      return;
    }

    try {
      if (editingAppointment) {
        await saveAppointment({
          ...editingAppointment,
          ...formData
        });
      } else {
        await saveAppointment({
          date: selectedDate,
          time: selectedTime,
          ...formData
        });
      }
      handleCloseModal();
      loadAppointments();
    } catch (error) {
      alert('Erro ao salvar agendamento.');
    }
  };

  const handleDelete = async () => {
    if (!editingAppointment) return;
    
    if (window.confirm('Tem certeza que deseja excluir este agendamento?')) {
      try {
        await deleteAppointment(editingAppointment.id);
        handleCloseModal();
        loadAppointments();
      } catch (error) {
        alert('Erro ao excluir agendamento.');
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Confirmado': return 'bg-green-100 text-green-700 border-green-200';
      case 'Finalizado': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200'; // Agendado
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-4xl mx-auto"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Agenda</h2>
          <p className="text-slate-500">Gerencie seus horários e consultas.</p>
        </div>
        <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
          <Calendar className="h-5 w-5 text-teal-600" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="border-none focus:ring-0 text-slate-700 font-medium outline-none bg-transparent"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">Carregando agenda...</div>
        ) : (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="divide-y divide-slate-100"
          >
            {timeSlots.map(time => {
              const appointment = appointments.find(a => a.time === time);
              const patient = appointment ? patients.find(p => p.id === appointment.patientId) : null;

              return (
                <motion.div variants={itemVariants} key={time} className="flex group hover:bg-slate-50 transition-colors">
                  <div className="w-24 py-4 px-6 flex items-center justify-center border-r border-slate-100 bg-slate-50/50">
                    <span className="text-sm font-medium text-slate-600">{time}</span>
                  </div>
                  
                  <div className="flex-1 p-3">
                    {appointment ? (
                      <div 
                        onClick={() => handleOpenModal(time, appointment)}
                        className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md ${getStatusColor(appointment.status)}`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-bold">{patient?.fullName || 'Paciente não encontrado'}</h4>
                            {appointment.procedure && (
                              <p className="text-sm opacity-90 mt-1">{appointment.procedure}</p>
                            )}
                          </div>
                          <span className="text-xs font-semibold px-2 py-1 rounded-full bg-white/50">
                            {appointment.status}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div 
                        onClick={() => handleOpenModal(time)}
                        className="h-full min-h-[3rem] rounded-lg border border-dashed border-slate-200 flex items-center justify-center text-slate-400 hover:text-teal-600 hover:border-teal-300 hover:bg-teal-50 cursor-pointer transition-all opacity-0 group-hover:opacity-100"
                      >
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <Plus className="h-4 w-4" />
                          Agendar
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>

      {/* Modal de Agendamento */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Clock className="h-5 w-5 text-teal-600" />
                {editingAppointment ? 'Editar Agendamento' : 'Novo Agendamento'} - {selectedTime}
              </h3>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Paciente
                </label>
                <div className="flex gap-2">
                  <select
                    value={formData.patientId}
                    onChange={(e) => setFormData({...formData, patientId: e.target.value})}
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none bg-white"
                  >
                    <option value="">-- Selecione um paciente --</option>
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>{p.fullName}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      handleCloseModal();
                      onAddNewPatient();
                    }}
                    className="p-2 bg-teal-50 text-teal-600 rounded-lg border border-teal-200 hover:bg-teal-100 transition-colors"
                    title="Cadastrar novo paciente"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Procedimento
                </label>
                <input
                  type="text"
                  value={formData.procedure}
                  onChange={(e) => setFormData({...formData, procedure: e.target.value})}
                  placeholder="Ex: Limpeza, Consulta de Rotina"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value as Appointment['status']})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none bg-white"
                >
                  <option value="Agendado">Agendado</option>
                  <option value="Confirmado">Confirmado</option>
                  <option value="Finalizado">Finalizado</option>
                </select>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-between">
              {editingAppointment ? (
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 text-rose-600 hover:bg-rose-50 font-medium rounded-lg transition-colors"
                >
                  Excluir
                </button>
              ) : <div></div>}
              
              <div className="flex gap-2">
                <button
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-200 font-medium rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg transition-colors"
                >
                  Salvar
                </button>
              </div>
            </div>
          </motion.div>
        </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
