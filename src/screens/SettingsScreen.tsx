import { 
  Upload, CheckCircle2, AlertCircle, Database, FileSpreadsheet, Globe, 
  Loader2, MapPin, Trash2, X, Download, CloudOff, HardDrive, 
  RefreshCw, Brain, Sparkles, History, Key, Eye, EyeOff, Moon, Sun
} from 'lucide-react';
import { useRef, useState, ChangeEvent, useMemo, useEffect } from 'react';
import { useAppStore, Language } from '../store/useAppStore';
import * as XLSX from 'xlsx';
import { t } from '../utils/translations';
import { cn } from '../lib/utils';
import { translateTerms } from '../utils/gemini';
import { motion, AnimatePresence } from 'framer-motion';
import { trainSystemOnData } from '../services/aiService';
import { getUserSavedKey, saveUserApiKey } from '../utils/config';

export default function SettingsScreen() {
  const { 
    mosques, importMosques, language, setLanguage, addDynamicTranslations, 
    selectedCommune, setSelectedCommune, resetApp, downloadedCommunes, 
    downloadCommune, removeDownloadedCommune,
    knowledgeBase, aiInsights, isTraining, lastTrainingDate,
    darkMode, setDarkMode
  } = useAppStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [downloadingCommune, setDownloadingCommune] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);

  const communes = useMemo(() => {
    const allCommunes = mosques.map(m => m.commune);
    return Array.from(new Set(allCommunes)).sort();
  }, [mosques]);

  const [customKey, setCustomKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isKeySaved, setIsKeySaved] = useState(false);

  useEffect(() => {
    const saved = getUserSavedKey();
    if (saved) {
      setCustomKey(saved);
      setIsKeySaved(true);
    }
  }, []);

  const handleSaveKey = () => {
    saveUserApiKey(customKey);
    setIsKeySaved(!!customKey.trim());
    setStatus({ 
      type: 'success', 
      message: customKey.trim() ? t('API Key saved to local storage.', language) : t('API Key removed.', language) 
    });
  };

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setStatus({ type: 'info', message: t('Parsing Excel file...', language) });
    setIsTranslating(true);

    const reader = new FileReader();
    reader.onload = async (e) => {
      // Use setTimeout to allow the UI to render the "Parsing..." state before blocking the main thread
      setTimeout(async () => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          let parsed = XLSX.utils.sheet_to_json(worksheet);
          
          // Handle case where CSV is parsed as a single column due to semicolon separator
          if (parsed.length > 0 && Object.keys(parsed[0] as object).length === 1) {
            const firstKey = Object.keys(parsed[0] as object)[0];
            if (firstKey.includes(';')) {
              const headers = firstKey.split(';');
              parsed = parsed.map((row: any) => {
                const values = String(row[firstKey]).split(';');
                const newRow: any = {};
                headers.forEach((header, i) => {
                  newRow[header] = values[i];
                });
                return newRow;
              });
            }
          }
        
        if (Array.isArray(parsed)) {
          const formattedMosques = parsed.map((item: any, index: number) => {
            // [LOCKED IMPORT LOGIC - DO NOT MODIFY]
            // This section is optimized for the user's specific Excel format.
            // Reverting or changing this logic may break the importation.
            
            // Helper to find keys case-insensitively
            const getVal = (keys: string[]) => {
              const foundKey = Object.keys(item).find(k => keys.includes(k.toLowerCase().trim()));
              return foundKey ? item[foundKey] : undefined;
            };

            const id = getVal(['id']) || index + 1;
            const name_ar = getVal(['dénomination_en_arabe', 'denomination_en_arabe', 'dénomination en arabe', 'denomination en arabe', 'name_ar', 'name ar', 'اسم المسجد']);
            const name_fr = getVal(['dénomination_en_français', 'denomination_en_francais', 'dénomination en français', 'denomination en francais', 'name_fr', 'name fr']);
            const name_en = getVal(['dénomination_en_anglais', 'denomination_en_anglais', 'dénomination en anglais', 'denomination en anglais', 'name_en', 'name en']);
            const genericName = getVal(['nom', 'dénomination', 'denomination', 'name', 'mosque name', 'mosque', 'اسم المسجد']);
            const name = genericName || name_fr || name_ar || name_en || 'Unknown Mosque';
            const latitude = Number(getVal(['latitude', 'lat'])) || 0;
            const longitude = Number(getVal(['longitude', 'lng', 'long'])) || 0;
            const address = getVal(['address', 'adresse', 'location', 'city', 'emplacement', 'lieu', 'العنوان', 'الموقع', 'المدينة']) || 'Unknown Address';
            // [END LOCKED IMPORT LOGIC]
            const rawCommune = getVal(['commune', 'municipality', 'district', 'commune_ar', 'commune_fr', 'ville', 'city', 'الجماعة', 'المقاطعة', 'العمالة']);
            const commune = rawCommune ? String(rawCommune).trim() : (address !== 'Unknown Address' ? (address.split(',')[0] || 'Unknown').trim() : 'Unknown');
            const type = getVal(['type', 'category', 'catégorie', 'genre', 'النوع', 'الصنف']) || 'Mosque';
            const servicesRaw = getVal(['services', 'facilities', 'équipements', 'equipements', 'الخدمات', 'المرافق']);
            const itemsRaw = getVal(['items', 'amenities', 'features', 'articles', 'composants', 'العناصر', 'المكونات']);
            const image = getVal(['image', 'photo', 'picture', 'image_url', 'url_image', 'الصورة']) || 'https://images.unsplash.com/photo-1519817650390-64a93db51149?auto=format&fit=crop&q=80&w=1000';

            // Handle comma-separated strings for arrays
            const parseArray = (val: any) => {
              if (Array.isArray(val)) return val;
              if (typeof val === 'string') return val.split(',').map(s => s.trim()).filter(Boolean);
              return [];
            };

            // Collect all other columns into extraData
            const standardKeys = ['id', 'dénomination_en_arabe', 'denomination_en_arabe', 'dénomination en arabe', 'denomination en arabe', 'dénomination_en_français', 'denomination_en_francais', 'dénomination en français', 'denomination en francais', 'dénomination_en_anglais', 'denomination_en_anglais', 'dénomination en anglais', 'denomination en anglais', 'name_ar', 'name ar', 'name_fr', 'name fr', 'name_en', 'name en', 'name', 'mosque name', 'mosque', 'nom', 'dénomination', 'denomination', 'latitude', 'lat', 'longitude', 'lng', 'long', 'address', 'adresse', 'location', 'city', 'emplacement', 'lieu', 'العنوان', 'الموقع', 'المدينة', 'type', 'category', 'catégorie', 'genre', 'النوع', 'الصنف', 'services', 'facilities', 'équipements', 'equipements', 'الخدمات', 'المرافق', 'items', 'amenities', 'features', 'articles', 'composants', 'العناصر', 'المكونات', 'image', 'photo', 'picture', 'image_url', 'url_image', 'الصورة', 'commune', 'municipality', 'district', 'commune_ar', 'commune_fr', 'ville', 'الجماعة', 'المقاطعة', 'العمالة'];
            const extraData: Record<string, any> = {};
            
            Object.keys(item).forEach(key => {
              const lowerKey = key.toLowerCase().trim();
              if (standardKeys.includes(lowerKey)) return;

              const val = item[key];
              
              // Ignore missing values, "N", and "لا"
              if (val === null || val === undefined || val === '') return;
              const valStr = String(val).trim().toUpperCase();
              if (valStr === 'N' || valStr === 'لا') return;

              // Simply pass the raw column key to extraData exactly as it was in the Excel definition.
              extraData[key.trim()] = val;
            });

            return {
              id,
              name,
              name_ar,
              name_fr,
              name_en,
              latitude,
              longitude,
              address,
              commune,
              type,
              services: parseArray(servicesRaw),
              items: parseArray(itemsRaw),
              image,
              extraData
            };
          });

          // Basic validation to ensure it looks like mosque data
          const isValid = formattedMosques.every(item => 
            item.name && !isNaN(item.latitude) && !isNaN(item.longitude)
          );
          
          if (isValid && formattedMosques.length > 0) {
            importMosques(formattedMosques);
            setStatus({ type: 'success', message: `${t('Successfully imported', language)} ${formattedMosques.length} ${t('mosques from Excel.', language)}` });
            setIsTranslating(false); // Stop loading spinner immediately
            
            // Extract terms for translation in the background
            const termCounts: Record<string, number> = {};
            const addTerm = (term: any) => {
              if (typeof term === 'string' && term.trim().length >= 2 && isNaN(Number(term))) {
                termCounts[term] = (termCounts[term] || 0) + 1;
              }
            };

            formattedMosques.forEach(m => {
              addTerm(m.type);
              if (Array.isArray(m.services)) m.services.forEach(addTerm);
              if (Array.isArray(m.items)) m.items.forEach(addTerm);
              if (m.extraData) {
                Object.entries(m.extraData).forEach(([k, v]) => {
                  addTerm(k);
                  addTerm(v);
                });
              }
            });

            const existingDict = useAppStore.getState().dynamicTranslations || {};
            
            // Sort by frequency and take top 100 to avoid long API calls
            const filteredTerms = Object.keys(termCounts)
              .filter(term => !existingDict[term])
              .sort((a, b) => termCounts[b] - termCounts[a])
              .slice(0, 100);

            if (filteredTerms.length > 0) {
              // Run translation in background without awaiting
              translateTerms(filteredTerms).then(newTranslations => {
                if (Object.keys(newTranslations).length > 0) {
                  addDynamicTranslations(newTranslations);
                }
              }).catch(console.error);
            }
          } else {
            throw new Error(t("Invalid format: Could not extract valid mosque data (name, latitude, longitude) from the Excel file.", language));
          }
        } else {
          throw new Error(t("Invalid format: Expected rows of mosques in the Excel sheet.", language));
        }
        } catch (error: any) {
          setStatus({ type: 'error', message: error.message || t("Failed to parse Excel file.", language) });
        } finally {
          setIsTranslating(false);
        }
        
        // Reset input so the same file can be uploaded again if needed
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }, 50);
    };
    reader.readAsArrayBuffer(file);
  };

  const handleReset = () => {
    resetApp();
    setShowResetConfirm(false);
    setStatus({ type: 'success', message: t('Reset Successful', language) });
  };

  const handleDownload = (commune: string) => {
    setDownloadingCommune(commune);
    setDownloadProgress(0);
    
    const interval = setInterval(() => {
      setDownloadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          downloadCommune(commune);
          setDownloadingCommune(null);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const communeStats = useMemo(() => {
    const stats: Record<string, number> = {};
    mosques.forEach(m => {
      stats[m.commune] = (stats[m.commune] || 0) + 1;
    });
    return stats;
  }, [mosques]);

  return (
    <div className="h-full bg-gray-50 dark:bg-gray-950 flex flex-col max-w-md mx-auto relative transition-colors duration-300">
      <div className="bg-white dark:bg-gray-900 border-b dark:border-gray-800 px-4 pt-safe-4 pb-4 shadow-sm z-10 transition-colors duration-300">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('Settings', language)}</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-24 space-y-4">
        
        {/* Language Selection */}
        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 transition-colors duration-300">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-3 transition-colors duration-300">
              <Globe size={20} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t('Language', language)}</h2>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-2 mt-4">
            {(['en', 'fr', 'ar'] as Language[]).map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className={`py-2 px-3 rounded-xl border text-sm font-medium transition-all ${
                  language === lang 
                    ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/40 dark:border-blue-800 dark:text-blue-300' 
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700/50'
                }`}
              >
                {lang === 'en' ? 'English' : lang === 'fr' ? 'Français' : 'العربية'}
              </button>
            ))}
          </div>
        </div>

        {/* Display Settings (Dark Mode) */}
        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 transition-colors duration-300">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-3 transition-colors duration-300">
              {darkMode ? <Moon size={20} className="text-indigo-600 dark:text-indigo-400" /> : <Sun size={20} className="text-indigo-600 dark:text-indigo-400" />}
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t('Display Settings', language)}</h2>
            </div>
          </div>

          <div 
            onClick={() => setDarkMode(!darkMode)}
            className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700 transition-colors duration-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-all active:scale-[0.98]"
          >
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-gray-700 dark:text-gray-200">{t('Dark Mode', language)}</span>
              <span className="text-[10px] bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                {darkMode ? 'ON' : 'OFF'}
              </span>
            </div>
            <button
              className={cn(
                "w-12 h-6 rounded-full relative transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900",
                darkMode ? "bg-indigo-600" : "bg-gray-200"
              )}
            >
              <div
                className={cn(
                  "absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300 shadow-sm",
                  darkMode 
                    ? (language === 'ar' ? "right-1" : "left-7") 
                    : (language === 'ar' ? "right-7" : "left-1")
                )}
              />
            </button>
          </div>
        </div>

        {/* AI Key Configuration */}
        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 transition-colors duration-300">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-cyan-50 dark:bg-cyan-900/30 rounded-full flex items-center justify-center mx-3 transition-colors duration-300">
              <Key size={20} className="text-cyan-600 dark:text-cyan-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t('AI Configuration', language)}</h2>
              <p className="text-[10px] text-gray-500 font-medium uppercase tracking-widest">{t('Personal API Key', language)}</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              {t('If the AI features fail on your phone, paste your Gemini API Key here. It will be saved locally in this browser.', language)}
            </p>
            
            <div className="relative">
              <input
                type={showKey ? "text" : "password"}
                value={customKey}
                onChange={(e) => {
                  setCustomKey(e.target.value);
                  setIsKeySaved(false);
                }}
                placeholder="AIzaSy..."
                className="w-full p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all text-sm font-mono dark:text-white"
              />
              <button 
                onClick={() => setShowKey(!showKey)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1"
              >
                {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <button
              onClick={handleSaveKey}
              className={`w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                isKeySaved 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800' 
                  : 'bg-cyan-600 text-white hover:bg-cyan-700 shadow-md shadow-cyan-100 dark:shadow-none'
              }`}
            >
              {isKeySaved ? <CheckCircle2 size={18} /> : <Key size={18} />}
              {isKeySaved ? t('Saved', language) : t('Save API Key', language)}
            </button>

            {!isKeySaved && customKey && (
              <p className="text-[10px] text-amber-600 font-medium italic text-center">
                {t('Click Save to apply changes', language)}
              </p>
            )}
          </div>
        </div>

        {/* AI Intelligence & Memory */}
        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden relative transition-colors duration-300">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Brain size={80} className="text-purple-600 dark:text-purple-400" />
          </div>
          
          <div className="flex items-center mb-4 relative z-10">
            <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-3 transition-colors duration-300">
              <Sparkles size={20} className="text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t('AI Intelligence & Memory', language)}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('Self-learning system active', language)}</p>
            </div>
          </div>

          <div className="space-y-4 relative z-10">
            <div className="bg-purple-50/50 dark:bg-purple-900/10 p-4 rounded-xl border border-purple-100 dark:border-purple-800 transition-colors duration-300">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-purple-700 dark:text-purple-400 uppercase tracking-widest">{t('Intelligence Level', language)}</span>
                <span className="text-xs font-black text-purple-900 dark:text-purple-100">
                  {knowledgeBase.lastAnalysisCount > 0 ? 'LEVEL 2: PATTERN RECOGNITION' : 'LEVEL 1: INITIALIZING'}
                </span>
              </div>
              <div className="w-full h-2 bg-purple-100 dark:bg-purple-900/30 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: knowledgeBase.lastAnalysisCount > 0 ? '65%' : '15%' }}
                  className="h-full bg-purple-500 dark:bg-purple-400"
                />
              </div>
            </div>

            {aiInsights.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest flex items-center gap-2">
                  <History size={12} />
                  {t('Learned Insights', language)}
                </h3>
                <div className="space-y-2">
                  {aiInsights.map((insight, idx) => (
                    <div key={idx} className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl border border-gray-100 dark:border-gray-800 leading-relaxed transition-colors duration-300">
                      {insight}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button 
              onClick={async () => {
                setStatus({ type: 'info', message: t('Training AI system...', language) });
                const result = await trainSystemOnData();
                if (result.success) {
                  setStatus({ type: 'success', message: t('Knowledge base updated successfully.', language) });
                } else {
                  setStatus({ type: 'error', message: `${t('Failed to analyze data.', language)} ${result.error || ''}` });
                }
              }}
              disabled={isTraining || mosques.length === 0}
              className={`w-full flex items-center justify-center py-4 rounded-2xl font-bold text-sm transition-all ${
                isTraining 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'bg-purple-600 text-white hover:bg-purple-700 shadow-lg shadow-purple-200 active:scale-[0.98]'
              }`}
            >
              {isTraining ? (
                <>
                  <RefreshCw size={18} className="animate-spin mr-2" />
                  {t('Analyzing Data Patterns...', language)}
                </>
              ) : (
                <>
                  <Brain size={18} className="mr-2" />
                  {t('Train System on Current Data', language)}
                </>
              )}
            </button>
            
            {lastTrainingDate && (
              <p className="text-[10px] text-center text-gray-400 font-medium italic">
                {t('Last memory update', language)}: {new Date(lastTrainingDate).toLocaleString()}
              </p>
            )}
          </div>
        </div>

        {/* Map Settings */}
        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 transition-colors duration-300">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-3 transition-colors duration-300">
              <MapPin size={20} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t('Map Settings', language)}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('Filter by Commune', language)}</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('Select Commune', language)}
            </label>
            <select
              value={selectedCommune || ''}
              onChange={(e) => setSelectedCommune(e.target.value || null)}
              className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm dark:text-white"
            >
              <option value="" className="dark:bg-gray-800">{t('None', language)}</option>
              {communes.map(commune => (
                <option key={commune} value={commune} className="dark:bg-gray-800">{commune}</option>
              ))}
            </select>
            {selectedCommune && (
              <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                {t('Only mosques in', language)} "{selectedCommune}" {t('will be shown on the map.', language)}
              </p>
            )}
          </div>
        </div>

        {/* Offline Data Manager */}
        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 transition-colors duration-300">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-amber-50 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-3 transition-colors duration-300">
              <CloudOff size={20} className="text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t('Offline Data', language)}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('Manage your offline data by region or commune.', language)}</p>
            </div>
          </div>

          <div className="space-y-3 mt-4">
            {communes.length > 0 ? (
              communes.map(commune => {
                const isDownloaded = downloadedCommunes.includes(commune);
                const isDownloading = downloadingCommune === commune;
                
                return (
                  <div key={commune} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700 transition-colors duration-300">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-900 dark:text-white">{commune}</span>
                        {isDownloaded && (
                          <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 text-[10px] font-black uppercase rounded-full">
                            {t('Offline', language)}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium uppercase tracking-widest">
                        {communeStats[commune] || 0} {t('mosques', language)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {isDownloading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${downloadProgress}%` }}
                              className="h-full bg-amber-500"
                            />
                          </div>
                          <span className="text-[10px] font-black text-amber-600">{downloadProgress}%</span>
                        </div>
                      ) : isDownloaded ? (
                        <button 
                          onClick={() => removeDownloadedCommune(commune)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title={t('Delete Item', language)}
                        >
                          <Trash2 size={16} />
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleDownload(commune)}
                          className="flex items-center gap-2 px-3 py-1.5 bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-amber-600 transition-all shadow-sm"
                        >
                          <Download size={14} />
                          {t('Download', language)}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-6 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <HardDrive size={32} className="mx-auto text-gray-300 mb-2" />
                <p className="text-xs text-gray-400 font-medium">{t('No data available for download', language)}</p>
              </div>
            )}
          </div>
        </div>

        {/* Data Management */}
        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 transition-colors duration-300">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-3 transition-colors duration-300">
              <Database size={20} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t('Data Management', language)}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{mosques.length} {t('mosques currently loaded', language)}</p>
            </div>
          </div>
          
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            {t('Import an Excel file', language)}
          </p>
          
          <input 
            type="file" 
            accept=".xlsx, .xls, .csv" 
            className="hidden" 
            ref={fileInputRef}
            onChange={handleFileUpload}
          />
          
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isTranslating}
            className={`w-full flex items-center justify-center py-3 rounded-xl font-medium transition-all ${
              isTranslating 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600' 
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/40'
            }`}
          >
            {isTranslating ? (
              <Loader2 size={20} className={`animate-spin ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
            ) : (
              <FileSpreadsheet size={20} className={language === 'ar' ? 'ml-2' : 'mr-2'} />
            )}
            {isTranslating ? t('Translating...', language) : t('Import Excel File', language)}
          </button>

          {status && (
            <div className={`mt-4 p-3 rounded-xl flex items-start text-sm transition-colors duration-300 ${
              status.type === 'success' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' : 
              status.type === 'info' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' : 
              'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
            }`}>
              {status.type === 'success' 
                ? <CheckCircle2 size={16} className={`mt-0.5 shrink-0 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} /> 
                : status.type === 'info'
                ? <Loader2 size={16} className={`animate-spin mt-0.5 shrink-0 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
                : <AlertCircle size={16} className={`mt-0.5 shrink-0 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
              }
              {status.message}
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
            <button 
              onClick={() => setShowResetConfirm(true)}
              className="w-full flex items-center justify-center py-3 rounded-xl font-medium transition-all bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30"
            >
              <Trash2 size={20} className={language === 'ar' ? 'ml-2' : 'mr-2'} />
              {t('Reset App', language)}
            </button>
          </div>
        </div>

      </div>

      {/* Reset Confirmation Modal */}
      <AnimatePresence>
        {showResetConfirm && (
          <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-gray-900 w-full max-w-sm rounded-[32px] p-8 shadow-2xl transition-colors duration-300"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 bg-red-50 dark:bg-red-900/30 rounded-2xl flex items-center justify-center transition-colors duration-300">
                  <AlertCircle size={24} className="text-red-600 dark:text-red-400" />
                </div>
                <button 
                  onClick={() => setShowResetConfirm(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                >
                  <X size={20} className="text-gray-400 dark:text-gray-500" />
                </button>
              </div>

              <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2 leading-tight">
                {t('Delete all data and reset the application?', language)}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">
                {t('This action cannot be undone.', language)}
              </p>

              <div className="flex gap-3">
                <button 
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1 py-4 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-2xl font-bold text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  {t('Cancel', language)}
                </button>
                <button 
                  onClick={handleReset}
                  className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-bold text-sm hover:bg-red-700 transition-colors shadow-lg shadow-red-200 dark:shadow-none"
                >
                  {t('Reset', language)}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
