import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Lock, KeyRound, Eye, EyeOff, AlertCircle, TrendingUp } from 'lucide-react';

interface PasswordLockProps {
  onUnlock: () => void;
  correctPassword?: string;
  title?: string;
  description?: string;
}

export default function PasswordLock({ 
  onUnlock, 
  correctPassword = 'Samuel20206@',
  title = 'Área Restrita',
  description = 'Digite a senha para acessar estas informações.'
}: PasswordLockProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState(false);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === correctPassword) {
      onUnlock();
      setPasswordError(false);
    } else {
      setPasswordError(true);
      setPassword('');
      setTimeout(() => setPasswordError(false), 2000);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white p-8 rounded-2xl border border-slate-200 shadow-xl"
      >
        <div className="flex flex-col items-center text-center mb-8">
          <div className="p-4 bg-teal-50 text-teal-600 rounded-full mb-4">
            <Lock className="h-10 w-10" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">{title}</h2>
          <p className="text-slate-500 mt-2">{description}</p>
        </div>

        <form onSubmit={handleUnlock} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Senha de Acesso</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <KeyRound className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full pl-10 pr-10 py-3 border rounded-xl focus:ring-2 outline-none transition-all ${
                  passwordError 
                    ? 'border-rose-300 focus:ring-rose-100 bg-rose-50' 
                    : 'border-slate-300 focus:ring-teal-100'
                }`}
                placeholder="Digite sua senha..."
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {passwordError && (
              <motion.p 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-rose-500 mt-2 font-medium flex items-center gap-1"
              >
                <AlertCircle className="h-3 w-3" /> Senha incorreta. Tente novamente.
              </motion.p>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl transition-all shadow-md shadow-teal-100 flex items-center justify-center gap-2 group"
          >
            Acessar Área
            <TrendingUp className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </form>

        <p className="text-[10px] text-center text-slate-400 mt-8 uppercase tracking-widest font-medium">
          Sistema de Segurança MediCad
        </p>
      </motion.div>
    </div>
  );
}
