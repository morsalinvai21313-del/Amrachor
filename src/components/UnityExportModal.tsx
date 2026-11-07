import React, { useState } from 'react';
import { Code, Download, Copy, Check, X, FileCode } from 'lucide-react';
import { UNITY_PROJECT_SCRIPTS, UnityScriptFile } from '../unity/unityExportData';

interface UnityExportModalProps {
  onClose: () => void;
}

export const UnityExportModal: React.FC<UnityExportModalProps> = ({ onClose }) => {
  const [selectedFile, setSelectedFile] = useState<UnityScriptFile>(UNITY_PROJECT_SCRIPTS[0]);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([selectedFile.code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = selectedFile.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-slate-900 border-2 border-amber-500 rounded-3xl shadow-2xl flex flex-col h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 px-6 py-4 flex items-center justify-between text-slate-950">
          <div className="flex items-center gap-3 font-black text-lg">
            <Code className="w-6 h-6" />
            <div>
              <span>ইউনিটি ৩ডি সি# আর্কিটেকচার এক্সপোর্টার</span>
              <span className="text-xs font-mono font-bold ml-2 bg-slate-950 text-amber-300 px-2 py-0.5 rounded">
                com.amra.chor
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-black/20 text-slate-950 transition cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body Split View */}
        <div className="flex-1 flex flex-col sm:flex-row overflow-hidden">
          {/* Left Sidebar: File Tree */}
          <div className="w-full sm:w-64 bg-slate-950/90 border-r border-slate-800 p-3 overflow-y-auto flex flex-col gap-1.5">
            <div className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider px-2 py-1">
              Unity C# Scripts ({UNITY_PROJECT_SCRIPTS.length})
            </div>
            {UNITY_PROJECT_SCRIPTS.map((f) => (
              <button
                key={f.path}
                onClick={() => setSelectedFile(f)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-mono font-medium transition cursor-pointer text-left ${
                  selectedFile.path === f.path
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                    : 'text-slate-300 hover:bg-slate-800/60'
                }`}
              >
                <FileCode className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="truncate">{f.name}</span>
              </button>
            ))}

            <div className="mt-4 p-3 bg-slate-900 rounded-xl border border-slate-800 text-[11px] text-slate-400">
              <div className="font-bold text-amber-400 mb-1">Android Build Info:</div>
              <div>Package: com.amra.chor</div>
              <div>Pipeline: URP (Universal)</div>
              <div>Input: New Input System</div>
            </div>
          </div>

          {/* Right Editor Area */}
          <div className="flex-1 flex flex-col bg-slate-900 overflow-hidden">
            {/* Editor Toolbar */}
            <div className="p-3 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between">
              <div className="text-xs font-mono text-cyan-300 truncate">
                {selectedFile.path}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg border border-slate-700 transition cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'কপি হয়েছে!' : 'কপি করুন'}</span>
                </button>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-lg transition cursor-pointer shadow-md"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>ডাউনলোড</span>
                </button>
              </div>
            </div>

            {/* Code Content */}
            <pre className="flex-1 p-4 overflow-auto text-xs font-mono text-emerald-400 bg-slate-950 leading-relaxed selection:bg-amber-500 selection:text-slate-950">
              <code>{selectedFile.code}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
