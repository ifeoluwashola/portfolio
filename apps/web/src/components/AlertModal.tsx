"use client";
import React from 'react';
import { ShieldAlert, AlertCircle, CheckCircle2, X } from 'lucide-react';

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: 'error' | 'warning' | 'success';
  onConfirm?: () => void;
  confirmText?: string;
  showCancel?: boolean;
}

export const AlertModal: React.FC<AlertModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  type = 'warning',
  onConfirm,
  confirmText = 'Acknowledge_',
  showCancel = false
}) => {
  if (!isOpen) return null;

  const themes = {
    error: {
      icon: <ShieldAlert className="w-8 h-8 text-red-500" />,
      border: 'border-red-500/20',
      bg: 'bg-red-500/5',
      button: 'bg-red-500 hover:bg-red-400 text-white'
    },
    warning: {
      icon: <AlertCircle className="w-8 h-8 text-yellow-500" />,
      border: 'border-yellow-500/20',
      bg: 'bg-yellow-500/5',
      button: 'bg-yellow-500 hover:bg-yellow-400 text-slate-950'
    },
    success: {
      icon: <CheckCircle2 className="w-8 h-8 text-emerald-500" />,
      border: 'border-emerald-500/20',
      bg: 'bg-emerald-500/5',
      button: 'bg-emerald-500 hover:bg-emerald-400 text-white'
    }
  };

  const currentTheme = themes[type];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm" 
        onClick={onClose}
      />
      <div className={`relative w-full max-w-md bg-card border ${currentTheme.border} rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200`}>
        <div className={`p-8 ${currentTheme.bg}`}>
          <div className="flex justify-between items-start mb-6">
            {currentTheme.icon}
            <button 
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <h3 className="text-xl font-bold text-foreground uppercase tracking-tight mb-2">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed font-mono whitespace-pre-wrap">
            {message}
          </p>
        </div>

        <div className="p-6 bg-muted/30 flex justify-end gap-3">
          {showCancel && (
            <button
              onClick={onClose}
              className="px-6 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            onClick={onConfirm || onClose}
            className={`px-8 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all ${currentTheme.button}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
