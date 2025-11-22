import React, { useRef, useState } from 'react';
import { Download, Upload, X, Database, Cloud, CloudUpload, CloudDownload, Link, Copy, Check } from 'lucide-react';
import { NativeLanguage, t } from '../../data/languages';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: () => void;
  onImport: (file: File) => void;
  onCloudUpload: () => Promise<string>; // Returns URL
  onCloudDownload: (url: string) => Promise<void>;
  nativeLang: NativeLanguage;
}

export const BackupModal: React.FC<BackupModalProps> = ({ 
  isOpen, onClose, onExport, onImport, onCloudUpload, onCloudDownload, nativeLang 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [inputUrl, setInputUrl] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      if (window.confirm(t(nativeLang, 'import_warning'))) {
        onImport(e.target.files[0]);
      }
      e.target.value = ''; // Reset
    }
  };

  const handleUpload = async () => {
      setIsLoading(true);
      setGeneratedUrl(null);
      try {
          const url = await onCloudUpload();
          setGeneratedUrl(url);
      } catch (e: any) {
          alert("Upload thất bại: " + e.message);
      } finally {
          setIsLoading(false);
      }
  };

  const handleDownload = async () => {
      if (!inputUrl.trim()) return;
      if (!window.confirm(t(nativeLang, 'import_warning'))) return;

      setIsLoading(true);
      try {
          await onCloudDownload(inputUrl.trim());
          alert(t(nativeLang, 'success_import'));
          onClose();
      } catch (e: any) {
          alert("Download thất bại: " + e.message);
      } finally {
          setIsLoading(false);
      }
  };

  const copyToClipboard = () => {
      if (generatedUrl) {
          navigator.clipboard.writeText(generatedUrl);
          setCopySuccess(true);
          setTimeout(() => setCopySuccess(false), 2000);
      }
  };

  return (
    <div className="absolute inset-0 z-50 bg-white dark:bg-slate-800 flex flex-col animate-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-700">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Database className="text-indigo-600 dark:text-indigo-400" /> {t(nativeLang, 'backup')}
        </h3>
        <button onClick={onClose} className="p-2 bg-slate-100 dark:bg-slate-700 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600">
          <X size={20} className="text-slate-500 dark:text-slate-400" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        
        {/* Local File Section */}
        <div className="space-y-4">
            <h4 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-700 pb-2">Local File</h4>
            
            <div className="flex gap-4">
                <button
                onClick={onExport}
                className="flex-1 p-4 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-2xl hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:border-indigo-200 dark:hover:border-indigo-700 transition-all group flex flex-col items-center justify-center gap-2"
                >
                    <div className="w-10 h-10 bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 rounded-full shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Download size={20} />
                    </div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{t(nativeLang, 'export_data')}</span>
                </button>

                <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 p-4 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-2xl hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:border-indigo-200 dark:hover:border-indigo-700 transition-all group flex flex-col items-center justify-center gap-2"
                >
                    <div className="w-10 h-10 bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Upload size={20} />
                    </div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{t(nativeLang, 'import_data')}</span>
                </button>
            </div>
        </div>

        {/* Cloud Section */}
        <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-2">
                <h4 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-2">
                    <Cloud size={16} /> {t(nativeLang, 'cloud_sync')}
                </h4>
            </div>
            
            <div className="bg-slate-50 dark:bg-slate-700/30 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 space-y-6">
                <p className="text-xs text-slate-500 dark:text-slate-400 italic">{t(nativeLang, 'cloud_help')}</p>

                {/* Upload Area */}
                <div>
                    <button
                        onClick={handleUpload}
                        disabled={isLoading}
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-200 dark:shadow-none disabled:opacity-70 mb-3"
                    >
                        {isLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <CloudUpload size={18} />}
                        {t(nativeLang, 'cloud_upload')}
                    </button>

                    {generatedUrl && (
                        <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-indigo-100 dark:border-indigo-900 animate-in fade-in">
                            <p className="text-xs font-bold text-green-600 dark:text-green-400 mb-1 flex items-center gap-1"><Check size={12} /> {t(nativeLang, 'upload_success')}</p>
                            <div className="flex gap-2">
                                <input 
                                    type="text" 
                                    readOnly 
                                    value={generatedUrl} 
                                    className="flex-1 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-2 py-1.5 text-xs text-slate-600 dark:text-slate-200 outline-none select-all"
                                />
                                <button 
                                    onClick={copyToClipboard}
                                    className="p-1.5 bg-indigo-50 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-800"
                                    title="Copy"
                                >
                                    {copySuccess ? <Check size={14} /> : <Copy size={14} />}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Download Area */}
                <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                     <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 block">Khôi phục dữ liệu:</label>
                     <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Link size={14} className="absolute left-3 top-3 text-slate-400 dark:text-slate-500" />
                            <input 
                                type="text" 
                                value={inputUrl}
                                onChange={(e) => setInputUrl(e.target.value)}
                                placeholder={t(nativeLang, 'enter_url_placeholder')}
                                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                            />
                        </div>
                        <button 
                            onClick={handleDownload}
                            disabled={isLoading || !inputUrl.trim()}
                            className="px-4 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold rounded-xl transition-all disabled:opacity-50"
                        >
                             {isLoading ? <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"/> : <CloudDownload size={18} />}
                        </button>
                     </div>
                </div>

            </div>
        </div>

        <input 
          type="file" 
          ref={fileInputRef} 
          accept=".json" 
          className="hidden" 
          onChange={handleFileChange} 
        />
      </div>
    </div>
  );
};