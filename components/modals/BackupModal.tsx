
import React, { useRef, useState, useEffect } from 'react';
import { Download, Upload, X, Database, AlertTriangle, Cloud, CloudUpload, CloudDownload, Settings, LogOut, User } from 'lucide-react';
import { NativeLanguage, t } from '../../data/languages';
import { GoogleDriveService, GoogleUserProfile } from '../../services/googleDriveService';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: () => void;
  onImport: (file: File) => void;
  onDriveUpload: (clientId: string) => Promise<void>;
  onDriveDownload: (clientId: string) => Promise<void>;
  nativeLang: NativeLanguage;
}

// Instantiate service locally for Auth check (parent uses it for operations)
const authService = new GoogleDriveService();

export const BackupModal: React.FC<BackupModalProps> = ({ 
  isOpen, onClose, onExport, onImport, onDriveUpload, onDriveDownload, nativeLang 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [clientId, setClientId] = useState('');
  const [isLoadingDrive, setIsLoadingDrive] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [userProfile, setUserProfile] = useState<GoogleUserProfile | null>(null);

  useEffect(() => {
    const savedId = localStorage.getItem('google_client_id');
    if (savedId) {
        setClientId(savedId);
        // Initialize service so we can try to use it
        authService.init(savedId);
    }
  }, []);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      if (window.confirm(t(nativeLang, 'import_warning'))) {
        onImport(e.target.files[0]);
      }
      e.target.value = ''; // Reset
    }
  };

  const handleClientIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setClientId(val);
    localStorage.setItem('google_client_id', val);
    authService.init(val);
  };

  const handleLogin = async () => {
      if (!clientId) {
          alert(t(nativeLang, 'client_id_placeholder'));
          setShowConfig(true);
          return;
      }
      
      setIsLoadingDrive(true);
      try {
          await authService.login();
          const profile = await authService.getUserInfo();
          setUserProfile(profile);
      } catch (e: any) {
          console.error(e);
          alert(e.message || "Login failed");
      } finally {
          setIsLoadingDrive(false);
      }
  };

  const handleLogout = () => {
      authService.logout();
      setUserProfile(null);
  };

  const handleDriveAction = async (action: 'upload' | 'download') => {
    if (!userProfile) {
        await handleLogin();
        if (!authService.isTokenValid) return; // If login failed or cancelled
    }

    if (action === 'download' && !window.confirm(t(nativeLang, 'import_warning'))) {
        return;
    }

    setIsLoadingDrive(true);
    try {
        if (action === 'upload') {
            await onDriveUpload(clientId);
            alert("Lưu lên Google Drive thành công!");
        } else {
            await onDriveDownload(clientId);
        }
    } catch (e: any) {
        console.error(e);
        alert(`Lỗi: ${e.message || "Không thể kết nối Drive"}`);
    } finally {
        setIsLoadingDrive(false);
    }
  };

  return (
    <div className="absolute inset-0 z-50 bg-white flex flex-col animate-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center justify-between p-6 border-b border-slate-100">
        <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Database className="text-indigo-600" /> {t(nativeLang, 'backup')}
        </h3>
        <button onClick={onClose} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200">
          <X size={20} className="text-slate-500" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        
        {/* Local File Section */}
        <div className="space-y-4">
            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">Local File</h4>
            
            <div className="flex gap-4">
                <button
                onClick={onExport}
                className="flex-1 p-4 bg-slate-50 border border-slate-200 rounded-2xl hover:bg-indigo-50 hover:border-indigo-200 transition-all group flex flex-col items-center justify-center gap-2"
                >
                    <div className="w-10 h-10 bg-white text-indigo-600 rounded-full shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Download size={20} />
                    </div>
                    <span className="text-xs font-bold text-slate-700">{t(nativeLang, 'export_data')}</span>
                </button>

                <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 p-4 bg-slate-50 border border-slate-200 rounded-2xl hover:bg-indigo-50 hover:border-indigo-200 transition-all group flex flex-col items-center justify-center gap-2"
                >
                    <div className="w-10 h-10 bg-white text-slate-600 rounded-full shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Upload size={20} />
                    </div>
                    <span className="text-xs font-bold text-slate-700">{t(nativeLang, 'import_data')}</span>
                </button>
            </div>
        </div>

        {/* Google Drive Section */}
        <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <Cloud size={16} /> {t(nativeLang, 'google_drive')}
                </h4>
                <button 
                    onClick={() => setShowConfig(!showConfig)}
                    className="p-1 text-slate-300 hover:text-slate-600 rounded-full"
                    title={t(nativeLang, 'drive_config_title')}
                >
                    <Settings size={14} />
                </button>
            </div>
            
            {/* Hidden Configuration */}
            {showConfig && (
                <div className="bg-slate-50 p-3 rounded-lg space-y-2 mb-4 animate-in fade-in slide-in-from-top-2">
                     <label className="text-xs font-bold text-slate-700 block">{t(nativeLang, 'client_id')}</label>
                     <input 
                        type="text" 
                        value={clientId}
                        onChange={handleClientIdChange}
                        placeholder={t(nativeLang, 'client_id_placeholder')}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:border-indigo-500 outline-none font-mono"
                    />
                    <p className="text-[10px] text-slate-400">{t(nativeLang, 'gdrive_help')}</p>
                </div>
            )}

            {/* Login / Status Area */}
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                {userProfile ? (
                    <div className="space-y-4">
                         <div className="flex items-center justify-between">
                             <div className="flex items-center gap-3">
                                 <img src={userProfile.picture} alt="Avatar" className="w-10 h-10 rounded-full border-2 border-white shadow-sm" />
                                 <div>
                                     <p className="text-xs text-slate-500 font-medium">{t(nativeLang, 'connected_as')}</p>
                                     <p className="text-sm font-bold text-slate-900">{userProfile.name}</p>
                                 </div>
                             </div>
                             <button 
                                onClick={handleLogout}
                                className="p-2 bg-white text-slate-400 hover:text-red-500 rounded-xl hover:shadow-sm transition-all"
                                title={t(nativeLang, 'logout_google')}
                             >
                                 <LogOut size={18} />
                             </button>
                         </div>

                         <div className="flex gap-3 pt-2">
                            <button
                                onClick={() => handleDriveAction('upload')}
                                disabled={isLoadingDrive}
                                className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-green-200 disabled:opacity-70"
                            >
                                {isLoadingDrive ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <CloudUpload size={16} />}
                                {t(nativeLang, 'sync_upload')}
                            </button>

                            <button
                                onClick={() => handleDriveAction('download')}
                                disabled={isLoadingDrive}
                                className="flex-1 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-70"
                            >
                                {isLoadingDrive ? <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"/> : <CloudDownload size={16} />}
                                {t(nativeLang, 'sync_download')}
                            </button>
                         </div>
                    </div>
                ) : (
                    <div className="text-center py-2">
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm text-slate-300">
                            <User size={24} />
                        </div>
                        <p className="text-xs text-slate-500 mb-4">{t(nativeLang, 'not_connected')}</p>
                        <button 
                             onClick={handleLogin}
                             disabled={isLoadingDrive}
                             className="w-full py-3 bg-white border border-slate-200 hover:border-slate-300 hover:shadow-md text-slate-700 font-bold rounded-xl transition-all flex items-center justify-center gap-2 relative overflow-hidden"
                        >
                            {/* Fake Google Icon */}
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                            {t(nativeLang, 'login_google')}
                        </button>
                    </div>
                )}
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
