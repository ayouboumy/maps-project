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

    // Check file size (limit to 10MB for safety)
    console.log("File selected:", file.name, "Size:", file.size, "Type:", file.type);
    if (file.size > 10 * 1024 * 1024) {
      setStatus({ type: 'error', message: t('File is too large (max 10MB).', language) });
      return;
    }

    setStatus({ type: 'info', message: t('Parsing Excel file...', language) });
    setIsTranslating(true);
    setProgress(10);

    const reader = new FileReader();
    reader.onerror = () => {
      setStatus({ type: 'error', message: t('Failed to read file.', language) });
      setIsTranslating(false);
    };
    reader.onload = (e) => {
      const result = e.target?.result;
      if (!result) {
        setStatus({ type: 'error', message: t('Failed to read file.', language) });
        setIsTranslating(false);
        return;
      }

      const data = new Uint8Array(result as ArrayBuffer);
      
      // Use a longer timeout on mobile/slower devices to ensure UI updates
      setTimeout(async () => {
        try {
          console.log("Starting Excel parse...");
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          if (!firstSheetName) {
            throw new Error(t("The Excel file is empty.", language));
          }
          const worksheet = workbook.Sheets[firstSheetName];
          const parsed = XLSX.utils.sheet_to_json(worksheet);
          console.log("Parsed Excel Data (first 5 rows):", parsed.slice(0, 5));
        
          if (!Array.isArray(parsed) || parsed.length === 0) {
            throw new Error(t("Invalid format: Expected rows of mosques in the Excel sheet.", language));
          }

          setStatus({ type: 'info', message: `${t('Found', language)} ${parsed.length} ${t('rows. Mapping columns...', language)}` });
          setProgress(20);

          // Get all unique headers from the first few rows, sanitized and limited
          const headers = Array.from(new Set(parsed.slice(0, 10).flatMap(row => Object.keys(row as object))))
            .map(h => String(h).trim().slice(0, 200)) // Truncate extremely long headers
            .filter(h => h.length > 0)
            .slice(0, 150); // Limit to 150 columns max
          
          // Use Gemini to map columns intelligently
          let mapping = await mapExcelColumns(headers);
          console.log("Detected Column Mapping:", mapping);
          
          // Fallback mapping if Gemini fails or returns empty
          const findHeader = (patterns: RegExp[], excludePatterns: RegExp[] = []) => 
            headers.find(h => 
              patterns.some(p => p.test(h)) && 
              !excludePatterns.some(p => p.test(h))
            );

          // Priority mapping for name to avoid picking up ID columns
          if (!mapping.name) {
            // Try to find a header that looks like a name but NOT an ID
            mapping.name = findHeader(
              [/nom/i, /mosqu/i, /intitul/i, /name/i, /label/i], 
              [/id/i, /code/i, /num/i, /n°/i, /index/i]
            );
            // If still not found, take the first non-ID header that isn't coordinate
            if (!mapping.name) {
              mapping.name = headers.find(h => 
                !/id/i.test(h) && !/code/i.test(h) && !/num/i.test(h) && 
                !/lat/i.test(h) && !/long/i.test(h) && !/coord/i.test(h) &&
                !/gps/i.test(h) && !/^x$/i.test(h) && !/^y$/i.test(h)
              );
            }
          }

          if (!mapping.latitude) mapping.latitude = findHeader([/lat/i, /coord_x/i, /gps_x/i, /^x$/i]);
          if (!mapping.longitude) mapping.longitude = findHeader([/long/i, /coord_y/i, /gps_y/i, /^y$/i]);
          if (!mapping.address) mapping.address = findHeader([/adresse/i, /localis/i, /lieu/i, /emplacement/i, /douar/i, /quartier/i]);
          if (!mapping.commune) mapping.commune = findHeader([/commune/i, /ville/i, /municipalit/i, /province/i, /cercle/i]);
          if (!mapping.type) mapping.type = findHeader([/type/i, /catégorie/i, /genre/i, /nature/i]);
          if (!mapping.services) mapping.services = findHeader([/service/i, /prestation/i, /équipement/i, /equipement/i]);
          if (!mapping.id) mapping.id = findHeader([/id/i, /code/i, /num/i, /n°/i, /index/i]);

          setProgress(40);
          setStatus({ type: 'info', message: t('Importing data...', language) });

          const formattedMosques = parsed.map((item: any, index: number) => {
            const getVal = (key?: string) => key ? item[key] : undefined;
            const parseCoord = (val: any) => {
              if (val === undefined || val === null || val === '') return 0;
              // Handle French decimals (commas) and non-numeric characters
              const str = String(val).replace(',', '.').replace(/[^\d.-]/g, '');
              const num = parseFloat(str);
              return isNaN(num) ? 0 : num;
            };

            const id = getVal(mapping.id) || index + 1;
            const name_ar = getVal(mapping.name_ar);
            const name_fr = getVal(mapping.name_fr);
            const name_en = getVal(mapping.name_en);
            
            // Get raw name and ensure it's not just a number if possible
            let rawName = getVal(mapping.name);
            if (rawName && !isNaN(Number(rawName)) && (name_fr || name_ar || name_en)) {
              // If name is a number but we have localized names, use one of them instead
              rawName = name_fr || name_ar || name_en;
            }
            
            const name = rawName || name_fr || name_ar || name_en || 'Unknown Mosque';
            const latitude = parseCoord(getVal(mapping.latitude));
            const longitude = parseCoord(getVal(mapping.longitude));
            
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
          }).filter(m => m.name && m.name !== 'Unknown Mosque' && m.latitude !== 0 && m.longitude !== 0);

          console.log("Formatted Mosques for Import (after filtering):", formattedMosques.slice(0, 5));
          if (formattedMosques.length === 0) {
            throw new Error(t("Invalid format: Could not extract valid mosque data (name, latitude, longitude) from the Excel file.", language));
          }
          setProgress(60);
          setStatus({ type: 'info', message: t('Importing data...', language) });

          try {
            importMosques(formattedMosques);
          } catch (storageError: any) {
            if (storageError.name === 'QuotaExceededError' || storageError.message?.includes('quota')) {
              throw new Error(t("The file is too large to store in the browser. Please try a smaller file (max 2000 mosques).", language));
            }
            throw storageError;
          }

          setStatus({ type: 'success', message: `${t('Successfully imported', language)} ${formattedMosques.length} ${t('mosques.', language)}` });
          setProgress(80);

          // Translate column headers in the background - with a timeout
          if (headers.length > 0) {
            setStatus({ type: 'info', message: t('Translating column titles...', language) });
            
            // Use a promise that resolves after a timeout to avoid hanging the UI
            const translationPromise = translateTerms(headers);
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Translation timed out')), 15000)
            );

            try {
              const headerTranslations = await Promise.race([translationPromise, timeoutPromise]) as Record<string, Record<Language, string>>;
              if (Object.keys(headerTranslations).length > 0) {
                addDynamicTranslations(headerTranslations);
                setStatus({ type: 'success', message: `${t('Successfully imported', language)} ${formattedMosques.length} ${t('mosques.', language)} (${t('Translations updated', language)})` });
              }
            } catch (transError) {
              console.warn("Background translation failed or timed out:", transError);
              // Final success message even if translation fails
              setStatus({ type: 'success', message: `${t('Successfully imported', language)} ${formattedMosques.length} ${t('mosques.', language)}` });
            }
          }

          setProgress(100);
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
            accept=".xlsx, .xls, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" 
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
