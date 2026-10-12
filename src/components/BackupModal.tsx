import React, { useState } from 'react';
import { exportSystemDataAsJSON, importSystemDataFromJSON } from '../utils/storage';
import { Download, Upload, RefreshCw, X, Check, AlertTriangle } from 'lucide-react';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  showToast: (msg: string) => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({
  isOpen,
  onClose,
  showToast,
}) => {
  const [importText, setImportText] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  if (!isOpen) return null;

  const handleDownloadBackup = () => {
    const json = exportSystemDataAsJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `nkroful_agric_shs_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('✓ System backup downloaded successfully.');
  };

  const handleApplyImport = () => {
    setErrorMsg('');
    if (!importText.trim()) {
      setErrorMsg('Please paste a valid JSON backup text.');
      return;
    }

    const success = importSystemDataFromJSON(importText);
    if (success) {
      showToast('✓ Backup restored successfully! Refreshing...');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } else {
      setErrorMsg('Invalid JSON format or corrupted data.');
    }
  };

  const handleReset = () => {
    if (
      window.confirm(
        'Are you sure you want to clear all locally saved score drafts? This action cannot be undone.'
      )
    ) {
      localStorage.clear();
      showToast('Local scores cleared.');
      setTimeout(() => {
        window.location.reload();
      }, 800);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/50 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-300 rounded-lg max-w-lg w-full p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <h2 className="text-base font-bold text-slate-900">
            Data Backup & System Sync
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-600">
          All continuous assessment marks and student drafts entered in this portal are stored securely in browser storage. You can backup your academic sheets or restore data across staff computers below.
        </p>

        {/* Download Backup */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-900">Download Data Backup</div>
            <div className="text-[11px] text-slate-500">
              Exports all saved grades, teachers, and records as JSON
            </div>
          </div>
          <button
            type="button"
            onClick={handleDownloadBackup}
            className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </button>
        </div>

        {/* Restore Backup */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-800">
            Restore Backup from JSON
          </label>
          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            rows={4}
            placeholder="Paste your JSON backup data here..."
            className="w-full text-xs font-mono p-2.5 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none"
          />

          {errorMsg && (
            <div className="text-[11px] text-red-600 font-semibold flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="button"
            onClick={handleApplyImport}
            className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded flex items-center gap-1.5 transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Restore & Apply</span>
          </button>
        </div>

        {/* Reset */}
        <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={handleReset}
            className="text-xs text-red-600 hover:text-red-800 font-semibold flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Reset Local Drafts</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
