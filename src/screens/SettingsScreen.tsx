import { Upload, CheckCircle2, AlertCircle, Database, FileSpreadsheet, Globe, Loader2, MapPin, RefreshCw, Trash2, X } from 'lucide-react';
import { useRef, useState, ChangeEvent, useMemo } from 'react';
import { useAppStore, Language } from '../store/useAppStore';
import * as XLSX from 'xlsx';
import { t, dictionary } from '../utils/translations';
import { translateTerms, mapExcelColumns } from '../utils/gemini';

export default function SettingsScreen() {
  const { mosques, importMosques, language, setLanguage, addDynamicTranslations, selectedCommune, setSelectedCommune, resetApp } = useAppStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const communes = useMemo(() => {
    const allCommunes = mosques.map(m => {
      if (m.commune) return m.commune;
      return (m.address.split(',')[0] || 'Unknown').trim();
    }).filter(Boolean);
    return Array.from(new Set(allCommunes)).sort();
  }, [mosques]);

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setStatus({ type: 'info', message: t('Parsing Excel file...', language) });
    setIsTranslating(true);
    setProgress(10);

    const reader = new FileReader();
    reader.onload = async (e) => {
      setTimeout(async () => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const parsed = XLSX.utils.sheet_to_json(worksheet);
        
          if (!Array.isArray(parsed) || parsed.length === 0) {
            throw new Error(t("Invalid format: Expected rows of mosques in the Excel sheet.", language));
          }

          setProgress(20);
          setStatus({ type: 'info', message: t('Analyzing columns...', language) });

          // Get all unique headers from the first few rows, sanitized and limited
          const headers = Array.from(new Set(parsed.slice(0, 10).flatMap(row => Object.keys(row as object))))
            .map(h => String(h).trim().slice(0, 200)) // Truncate extremely long headers
            .filter(h => h.length > 0)
            .slice(0, 150); // Limit to 150 columns max
          
          // Use Gemini to map columns intelligently
          const mapping = await mapExcelColumns(headers);
          
          setProgress(40);
          setStatus({ type: 'info', message: t('Importing data...', language) });

          const formattedMosques = parsed.map((item: any, index: number) => {
            const getVal = (key?: string) => key ? item[key] : undefined;

            const id = getVal(mapping.id) || index + 1;
            const name_ar = getVal(mapping.name_ar);
            const name_fr = getVal(mapping.name_fr);
            const name_en = getVal(mapping.name_en);
            const name = getVal(mapping.name) || name_fr || name_ar || name_en || 'Unknown Mosque';
            const latitude = Number(getVal(mapping.latitude)) || 0;
            const longitude = Number(getVal(mapping.longitude)) || 0;
            
            const rawAddress = getVal(mapping.address);
            const addressStr = rawAddress ? String(rawAddress).trim() : '';
            
            const rawCommune = getVal(mapping.commune);
            const communeStr = rawCommune ? String(rawCommune).trim() : (addressStr ? addressStr.split(',')[0].trim() : '');
            
            const address = addressStr || t('Unknown Address', language);
            const commune = communeStr || t('Unknown', language);
            
            const rawType = getVal(mapping.type);
            const type = rawType ? String(rawType).trim() : 'Mosque';
            const servicesRaw = getVal(mapping.services);
            const itemsRaw = getVal(mapping.items);
            const image = getVal(mapping.image) || 'https://images.unsplash.com/photo-1519817650390-64a93db51149?auto=format&fit=crop&q=80&w=1000';

            const parseArray = (val: any) => {
              if (Array.isArray(val)) return val.map(s => String(s).trim()).filter(Boolean);
              if (typeof val === 'string') return val.split(',').map(s => s.trim()).filter(Boolean);
              return [];
            };

            // Collect extra data
            const mappedValues = Object.values(mapping);
            const extraData: Record<string, any> = {};
            Object.keys(item).forEach(key => {
              if (mappedValues.includes(key)) return;
              const val = item[key];
              if (val === null || val === undefined || val === '' || String(val).trim().toUpperCase() === 'N') return;
              extraData[key] = val;
            });

            return {
              id, name, name_ar, name_fr, name_en, latitude, longitude, address, commune, type,
              services: parseArray(servicesRaw),
              items: parseArray(itemsRaw),
              image, extraData
            };
          });

          setProgress(60);
          setStatus({ type: 'info', message: t('Translating content...', language) });

          // Extract terms for translation
          const termCounts: Record<string, number> = {};
          const addTerm = (term: any) => {
            if (typeof term === 'string' && term.trim().length >= 2 && isNaN(Number(term))) {
              const cleanTerm = term.trim();
              termCounts[cleanTerm] = (termCounts[cleanTerm] || 0) + 1;
            }
          };

          formattedMosques.forEach(m => {
            addTerm(m.type);
            addTerm(m.commune);
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
          const filteredTerms = Object.keys(termCounts)
            .filter(term => {
              const lower = term.toLowerCase();
              // Skip if in static dictionary
              if (Object.keys(dictionary).some(k => k.toLowerCase() === lower)) return false;
              // Skip if in dynamic translations
              if (Object.keys(existingDict).some(k => k.toLowerCase() === lower)) return false;
              // Skip if it's already a translation of something else
              if (term === 'Unknown Address' || term === 'Unknown') return false;
              if (term === t('Unknown Address', language) || term === t('Unknown', language)) return false;
              return true;
            })
            .sort((a, b) => termCounts[b] - termCounts[a])
            .slice(0, 400); // Increase limit to 400

          if (filteredTerms.length > 0) {
            const newTranslations = await translateTerms(filteredTerms);
            if (Object.keys(newTranslations).length > 0) {
              addDynamicTranslations(newTranslations);
            }
          }

          setProgress(100);
          importMosques(formattedMosques);
          setStatus({ type: 'success', message: `${t('Successfully imported', language)} ${formattedMosques.length} ${t('mosques.', language)}` });
        } catch (error: any) {
          setStatus({ type: 'error', message: error.message || t("Failed to parse Excel file.", language) });
        } finally {
          setIsTranslating(false);
          setTimeout(() => setProgress(0), 2000);
        }
        
        // Reset input so the same file can be uploaded again if needed
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }, 50);
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="h-full bg-gray-50 flex flex-col max-w-md mx-auto">
      <div className="bg-white px-4 pt-safe-4 pb-4 shadow-sm z-10">
        <h1 className="text-2xl font-bold text-gray-900">{t('Settings', language)}</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-24 space-y-4">
        
        {/* Language Selection */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center mx-3">
              <Globe size={20} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{t('Language', language)}</h2>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-2 mt-4">
            {(['en', 'fr', 'ar'] as Language[]).map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className={`py-2 px-3 rounded-xl border text-sm font-medium transition-colors ${
                  language === lang 
                    ? 'bg-blue-50 border-blue-200 text-blue-700' 
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {lang === 'en' ? 'English' : lang === 'fr' ? 'Français' : 'العربية'}
              </button>
            ))}
          </div>
        </div>

        {/* Map Settings */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center mx-3">
              <MapPin size={20} className="text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{t('Map Settings', language)}</h2>
              <p className="text-sm text-gray-500">{t('Filter by Commune', language)}</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              {t('Select Commune', language)}
            </label>
            <select
              value={selectedCommune || ''}
              onChange={(e) => setSelectedCommune(e.target.value || null)}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
            >
              <option value="">{t('None', language)}</option>
              {communes.map(commune => (
                <option key={commune} value={commune}>{commune}</option>
              ))}
            </select>
            {selectedCommune && (
              <p className="text-xs text-indigo-600 font-medium">
                {t('Only mosques in', language)} "{selectedCommune}" {t('will be shown on the map.', language)}
              </p>
            )}
          </div>
        </div>

        {/* Data Management */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center mx-3">
              <Database size={20} className="text-emerald-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{t('Data Management', language)}</h2>
              <p className="text-sm text-gray-500">{mosques.length} {t('mosques currently loaded', language)}</p>
            </div>
          </div>
          
          <p className="text-sm text-gray-600 mb-6">
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
            className={`w-full flex items-center justify-center py-3 rounded-xl font-medium transition-colors ${
              isTranslating 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            {isTranslating ? (
              <Loader2 size={20} className={`animate-spin ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
            ) : (
              <FileSpreadsheet size={20} className={language === 'ar' ? 'ml-2' : 'mr-2'} />
            )}
            {isTranslating ? t('Translating...', language) : t('Import Excel File', language)}
          </button>

          {progress > 0 && (
            <div className="mt-4">
              <div className="flex justify-between text-xs font-medium text-gray-500 mb-1.5">
                <span>{t('Import Progress', language)}</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {status && (
            <div className={`mt-4 p-3 rounded-xl flex items-start text-sm ${
              status.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 
              status.type === 'info' ? 'bg-blue-50 text-blue-700' : 
              'bg-red-50 text-red-700'
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
        </div>

        {/* Reset App */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center mx-3">
              <RefreshCw size={20} className="text-red-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{t('Reset App', language)}</h2>
              <p className="text-sm text-gray-500">{t('Clear all data and settings', language)}</p>
            </div>
          </div>
          
          {!showResetConfirm ? (
            <button 
              onClick={() => setShowResetConfirm(true)}
              className="w-full flex items-center justify-center py-3 bg-red-50 text-red-700 rounded-xl font-medium hover:bg-red-100 transition-colors"
            >
              <Trash2 size={18} className={language === 'ar' ? 'ml-2' : 'mr-2'} />
              {t('Reset App', language)}
            </button>
          ) : (
            <div className="space-y-3 p-3 bg-red-50 rounded-xl border border-red-100">
              <p className="text-sm text-red-800 font-medium">
                {t('Resetting the app will clear all your favorites and imported data. This cannot be undone.', language)}
              </p>
              <div className="flex gap-2">
                <button 
                  onClick={() => resetApp()}
                  className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 transition-colors"
                >
                  {t('Reset Now', language)}
                </button>
                <button 
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1 py-2 bg-white text-gray-700 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  {t('Cancel', language)}
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
