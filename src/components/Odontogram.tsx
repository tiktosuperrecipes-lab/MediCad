import React, { useState } from 'react';
import { ToothCondition, OdontogramData } from '../types';
import { Info, Save, RotateCcw, AlertCircle, CheckCircle2, Shield, Activity } from 'lucide-react';
import { motion } from 'motion/react';

interface OdontogramProps {
  data: OdontogramData;
  onChange: (newData: OdontogramData) => void;
}

const TOOTH_NUMBERS = {
  upper: [
    [18, 17, 16, 15, 14, 13, 12, 11],
    [21, 22, 23, 24, 25, 26, 27, 28]
  ],
  lower: [
    [48, 47, 46, 45, 44, 43, 42, 41],
    [31, 32, 33, 34, 35, 36, 37, 38]
  ]
};

type Face = 'top' | 'bottom' | 'left' | 'right' | 'center';

export default function Odontogram({ data, onChange }: OdontogramProps) {
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const [currentMode, setCurrentMode] = useState<'caries' | 'restored' | 'none'>('caries');

  const handleFaceClick = (toothNumber: number, face: Face) => {
    const toothData = data[toothNumber] || {};
    const currentVal = toothData[face] || 'none';
    const newVal = currentVal === currentMode ? 'none' : currentMode;

    onChange({
      ...data,
      [toothNumber]: {
        ...toothData,
        [face]: newVal
      }
    });
  };

  const handleStatusChange = (toothNumber: number, status: ToothCondition['status']) => {
    const toothData = data[toothNumber] || {};
    onChange({
      ...data,
      [toothNumber]: {
        ...toothData,
        status: toothData.status === status ? 'none' : status
      }
    });
  };

  const getFaceColor = (toothNumber: number, face: Face) => {
    const condition = data[toothNumber]?.[face];
    if (condition === 'caries') return '#ef4444'; // red-500
    if (condition === 'restored') return '#3b82f6'; // blue-500
    return '#f8fafc'; // slate-50
  };

  const getFaceName = (num: number, face: Face) => {
    const isUpper = num >= 11 && num <= 28;
    const isRightSide = (num >= 11 && num <= 18) || (num >= 41 && num <= 48);
    
    switch (face) {
      case 'top': return 'Vestibular (V)';
      case 'bottom': return isUpper ? 'Palatina (P)' : 'Lingual (L)';
      case 'center': return (num % 10 <= 3) ? 'Incisal (I)' : 'Oclusal (O)';
      case 'left': return isRightSide ? 'Distal (D)' : 'Mesial (M)';
      case 'right': return isRightSide ? 'Mesial (M)' : 'Distal (D)';
      default: return '';
    }
  };

  const renderTooth = (num: number) => {
    const toothData = data[num] || {};
    const isMissing = toothData.status === 'missing';
    const isImplant = toothData.status === 'implant';
    const isEndo = toothData.status === 'endodontics';

    return (
      <div key={num} className="flex flex-col items-center gap-1">
        <span className="text-[10px] font-bold text-slate-400">{num}</span>
        <div 
          className={`relative w-10 h-10 cursor-pointer transition-all ${selectedTooth === num ? 'ring-2 ring-teal-500 rounded-sm' : ''}`}
          onClick={() => setSelectedTooth(num)}
        >
          {isMissing ? (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-100 rounded-sm">
              <div className="w-full h-0.5 bg-red-400 rotate-45 absolute" />
              <div className="w-full h-0.5 bg-red-400 -rotate-45 absolute" />
            </div>
          ) : (
            <svg viewBox="0 0 100 100" className="w-full h-full">
              {/* Top Face */}
              <path 
                d="M0 0 L100 0 L75 25 L25 25 Z" 
                fill={getFaceColor(num, 'top')} 
                stroke="#cbd5e1" 
                strokeWidth="2"
                onClick={(e) => { handleFaceClick(num, 'top'); }}
              >
                <title>{getFaceName(num, 'top')}</title>
              </path>
              {/* Bottom Face */}
              <path 
                d="M0 100 L100 100 L75 75 L25 75 Z" 
                fill={getFaceColor(num, 'bottom')} 
                stroke="#cbd5e1" 
                strokeWidth="2"
                onClick={(e) => { handleFaceClick(num, 'bottom'); }}
              >
                <title>{getFaceName(num, 'bottom')}</title>
              </path>
              {/* Left Face */}
              <path 
                d="M0 0 L0 100 L25 75 L25 25 Z" 
                fill={getFaceColor(num, 'left')} 
                stroke="#cbd5e1" 
                strokeWidth="2"
                onClick={(e) => { handleFaceClick(num, 'left'); }}
              >
                <title>{getFaceName(num, 'left')}</title>
              </path>
              {/* Right Face */}
              <path 
                d="M100 0 L100 100 L75 75 L75 25 Z" 
                fill={getFaceColor(num, 'right')} 
                stroke="#cbd5e1" 
                strokeWidth="2"
                onClick={(e) => { handleFaceClick(num, 'right'); }}
              >
                <title>{getFaceName(num, 'right')}</title>
              </path>
              {/* Center Face */}
              <rect 
                x="25" y="25" width="50" height="50" 
                fill={getFaceColor(num, 'center')} 
                stroke="#cbd5e1" 
                strokeWidth="2"
                onClick={(e) => { handleFaceClick(num, 'center'); }}
              >
                <title>{getFaceName(num, 'center')}</title>
              </rect>
              
              {/* Status Indicators */}
              {isImplant && (
                <circle cx="50" cy="50" r="15" fill="none" stroke="#10b981" strokeWidth="8" />
              )}
              {isEndo && (
                <line x1="50" y1="10" x2="50" y2="90" stroke="#f59e0b" strokeWidth="8" strokeDasharray="5,5" />
              )}
            </svg>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 p-4 bg-white rounded-xl border border-slate-200">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-4">
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setCurrentMode('caries')}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-2 ${currentMode === 'caries' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500'}`}
            >
              <div className="w-3 h-3 rounded-full bg-red-500" />
              Cárie / Problema
            </button>
            <button
              onClick={() => setCurrentMode('restored')}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-2 ${currentMode === 'restored' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
            >
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              Restaurado / Ok
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[10px] text-slate-500">
          <Info className="h-3 w-3" />
          <span>Clique nas faces do dente para marcar. Clique no dente para opções extras.</span>
        </div>
      </div>

      <div className="overflow-x-auto pb-4">
        <div className="min-w-[800px] space-y-12">
          {/* Upper Arch */}
          <div className="flex justify-center gap-12">
            <div className="flex gap-2">
              {TOOTH_NUMBERS.upper[0].map(renderTooth)}
            </div>
            <div className="flex gap-2">
              {TOOTH_NUMBERS.upper[1].map(renderTooth)}
            </div>
          </div>

          {/* Lower Arch */}
          <div className="flex justify-center gap-12">
            <div className="flex gap-2">
              {TOOTH_NUMBERS.lower[0].map(renderTooth)}
            </div>
            <div className="flex gap-2">
              {TOOTH_NUMBERS.lower[1].map(renderTooth)}
            </div>
          </div>
        </div>
      </div>

      {/* Tooth Details / Quick Actions */}
      {selectedTooth && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-50 p-4 rounded-xl border border-slate-200"
        >
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-bold text-slate-800 flex items-center gap-2">
              Opções para o Dente {selectedTooth}
            </h4>
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  if (confirm(`Deseja limpar todas as marcações do dente ${selectedTooth}?`)) {
                    onChange({
                      ...data,
                      [selectedTooth]: {
                        top: 'none', bottom: 'none', left: 'none', right: 'none', center: 'none',
                        status: 'none', notes: ''
                      }
                    });
                  }
                }}
                className="text-[10px] text-red-500 hover:text-red-700 underline font-medium"
              >
                Limpar Dente
              </button>
              <button 
                onClick={() => setSelectedTooth(null)}
                className="text-xs text-slate-500 hover:text-slate-700 underline"
              >
                Fechar
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button
              onClick={() => handleStatusChange(selectedTooth, 'missing')}
              className={`p-3 rounded-lg border text-sm font-medium transition-all flex flex-col items-center gap-2 ${data[selectedTooth]?.status === 'missing' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            >
              <RotateCcw className="h-4 w-4 rotate-45" />
              Ausente / Extraído
            </button>
            <button
              onClick={() => handleStatusChange(selectedTooth, 'implant')}
              className={`p-3 rounded-lg border text-sm font-medium transition-all flex flex-col items-center gap-2 ${data[selectedTooth]?.status === 'implant' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            >
              <Shield className="h-4 w-4" />
              Implante
            </button>
            <button
              onClick={() => handleStatusChange(selectedTooth, 'endodontics')}
              className={`p-3 rounded-lg border text-sm font-medium transition-all flex flex-col items-center gap-2 ${data[selectedTooth]?.status === 'endodontics' ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            >
              <Activity className="h-4 w-4" />
              Endodontia
            </button>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Observações</label>
              <textarea
                value={data[selectedTooth]?.notes || ''}
                onChange={(e) => onChange({
                  ...data,
                  [selectedTooth]: {
                    ...(data[selectedTooth] || {}),
                    notes: e.target.value
                  }
                })}
                placeholder="Ex: Fratura na cúspide..."
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none resize-none h-12"
              />
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-200">
            <label className="text-[10px] font-bold text-slate-400 uppercase mb-3 block">Resumo das Faces</label>
            <div className="flex flex-wrap gap-4">
              {(['top', 'bottom', 'left', 'right', 'center'] as Face[]).map(face => (
                <div key={face} className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                  <div 
                    className="w-3 h-3 rounded-sm border border-slate-200" 
                    style={{ backgroundColor: getFaceColor(selectedTooth, face) }}
                  />
                  <span className="text-[10px] font-bold text-slate-700">
                    {getFaceName(selectedTooth, face)}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {data[selectedTooth]?.[face] === 'caries' ? '(Cárie)' : data[selectedTooth]?.[face] === 'restored' ? '(Restaurado)' : '(Saudável)'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Legend */}
      <div className="flex flex-col gap-4 pt-4 border-t border-slate-100">
        <div className="flex flex-wrap gap-6">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded-sm" />
            <span className="text-xs text-slate-600">Cárie / Problema</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded-sm" />
            <span className="text-xs text-slate-600">Restauração / Tratado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-emerald-500 rounded-full" />
            <span className="text-xs text-slate-600">Implante</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-l-2 border-r-2 border-amber-500 border-dashed" />
            <span className="text-xs text-slate-600">Canal (Endo)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-slate-100 relative overflow-hidden rounded-sm">
              <div className="absolute inset-0 border-t border-red-400 rotate-45" />
              <div className="absolute inset-0 border-t border-red-400 -rotate-45" />
            </div>
            <span className="text-xs text-slate-600">Ausente</span>
          </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-4 flex items-center gap-1">
            <Info className="h-3 w-3" />
            Guia de Faces (Nomenclatura Técnica)
          </h4>
          <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
            {/* Visual Map */}
            <div className="relative w-20 h-20 bg-white rounded border border-slate-200 p-1 shadow-sm">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <path d="M0 0 L100 0 L75 25 L25 25 Z" fill="#f8fafc" stroke="#e2e8f0" />
                <text x="50" y="18" fontSize="14" textAnchor="middle" fill="#94a3b8" fontWeight="bold">V</text>
                
                <path d="M0 100 L100 100 L75 75 L25 75 Z" fill="#f8fafc" stroke="#e2e8f0" />
                <text x="50" y="92" fontSize="14" textAnchor="middle" fill="#94a3b8" fontWeight="bold">L/P</text>
                
                <path d="M0 0 L0 100 L25 75 L25 25 Z" fill="#f8fafc" stroke="#e2e8f0" />
                <text x="14" y="55" fontSize="14" textAnchor="middle" fill="#94a3b8" fontWeight="bold">M/D</text>
                
                <path d="M100 0 L100 100 L75 75 L75 25 Z" fill="#f8fafc" stroke="#e2e8f0" />
                <text x="86" y="55" fontSize="14" textAnchor="middle" fill="#94a3b8" fontWeight="bold">D/M</text>
                
                <rect x="25" y="25" width="50" height="50" fill="#f8fafc" stroke="#e2e8f0" />
                <text x="50" y="55" fontSize="14" textAnchor="middle" fill="#94a3b8" fontWeight="bold">O/I</text>
              </svg>
            </div>

            {/* Labels */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-3 flex-1">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-700">V - Vestibular</span>
                <span className="text-[9px] text-slate-400">Face voltada para a bochecha/lábios</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-700">L / P - Lingual ou Palatina</span>
                <span className="text-[9px] text-slate-400">Face voltada para a língua ou céu da boca</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-700">O / I - Oclusal ou Incisal</span>
                <span className="text-[9px] text-slate-400">Face de mastigação ou corte</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-700">M - Mesial</span>
                <span className="text-[9px] text-slate-400">Lado do dente voltado para o centro do arco</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-700">D - Distal</span>
                <span className="text-[9px] text-slate-400">Lado do dente voltado para o fundo da boca</span>
              </div>
              <div className="text-[9px] text-teal-600 font-medium italic self-center">
                * Passe o mouse sobre cada dente para ver a nomenclatura exata.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
