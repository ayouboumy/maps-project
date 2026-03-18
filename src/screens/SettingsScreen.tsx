import { Upload, CheckCircle2, AlertCircle, Database, FileSpreadsheet, Globe } from 'lucide-react';
import { useRef, useState, ChangeEvent } from 'react';
import { useAppStore, Language } from '../store/useAppStore';
import * as XLSX from 'xlsx';
import { t } from '../utils/translations';

export default function SettingsScreen() {
  const { mosques, importMosques, language, setLanguage } = useAppStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const parsed = XLSX.utils.sheet_to_json(worksheet);
        
        if (Array.isArray(parsed)) {
          const formattedMosques = parsed.map((item: any, index: number) => {
            // Helper to find keys case-insensitively
            const getVal = (keys: string[]) => {
              const foundKey = Object.keys(item).find(k => keys.includes(k.toLowerCase().trim()));
              return foundKey ? item[foundKey] : undefined;
            };

            const id = getVal(['id']) || index + 1;
            const name = getVal(['name', 'mosque name', 'mosque']) || 'Unknown Mosque';
            const latitude = Number(getVal(['latitude', 'lat'])) || 0;
            const longitude = Number(getVal(['longitude', 'lng', 'long'])) || 0;
            const address = getVal(['address', 'location', 'city']) || 'Unknown Address';
            const type = getVal(['type', 'category']) || 'Mosque';
            const servicesRaw = getVal(['services', 'facilities']);
            const itemsRaw = getVal(['items', 'amenities', 'features']);
            const image = getVal(['image', 'photo', 'picture']) || 'https://images.unsplash.com/photo-1519817650390-64a93db51149?auto=format&fit=crop&q=80&w=1000';

            // Handle comma-separated strings for arrays
            const parseArray = (val: any) => {
              if (Array.isArray(val)) return val;
              if (typeof val === 'string') return val.split(',').map(s => s.trim()).filter(Boolean);
              return [];
            };

            // Collect all other columns into extraData
            const standardKeys = ['id', 'name', 'mosque name', 'mosque', 'latitude', 'lat', 'longitude', 'lng', 'long', 'address', 'location', 'city', 'type', 'category', 'services', 'facilities', 'items', 'amenities', 'features', 'image', 'photo', 'picture'];
            const extraData: Record<string, any> = {};
            const combinedData: Record<string, { N?: any, S?: any, originalKey?: string }> = {};
            
            Object.keys(item).forEach(key => {
              const lowerKey = key.toLowerCase().trim();
              if (standardKeys.includes(lowerKey)) return;

              const val = item[key];
              
              // Ignore missing values and "N"
              if (val === null || val === undefined || val === '') return;
              if (String(val).trim().toUpperCase() === 'N') return;

              let isCombined = false;
              
              if (lowerKey.startsWith('nombre')) {
                const base = lowerKey.replace(/^nombre\s*/, '').trim();
                if (base) {
                  if (!combinedData[base]) combinedData[base] = { originalKey: key.replace(/^nombre\s*/i, '').trim() };
                  combinedData[base].N = val;
                  isCombined = true;
                }
              } else if (lowerKey.startsWith('surface')) {
                const base = lowerKey.replace(/^surface\s*/, '').trim();
                if (base) {
                  if (!combinedData[base]) combinedData[base] = { originalKey: key.replace(/^surface\s*/i, '').trim() };
                  combinedData[base].S = val;
                  isCombined = true;
                }
              }

              if (!isCombined) {
                extraData[key] = val;
              }
            });

            // Process combined data
            Object.keys(combinedData).forEach(base => {
              const { N, S, originalKey } = combinedData[base];
              const displayKey = originalKey || base;
              
              if (N !== undefined && S !== undefined) {
                extraData[displayKey] = `N=${N}, S=${S}`;
              } else if (N !== undefined) {
                extraData[`Nombre ${displayKey}`] = N;
              } else if (S !== undefined) {
                extraData[`Surface ${displayKey}`] = S;
              }
            });

            return {
              id,
              name,
              latitude,
              longitude,
              address,
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
          } else {
            throw new Error(t("Invalid format: Could not extract valid mosque data (name, latitude, longitude) from the Excel file.", language));
          }
        } else {
          throw new Error(t("Invalid format: Expected rows of mosques in the Excel sheet.", language));
        }
      } catch (error: any) {
        setStatus({ type: 'error', message: error.message || t("Failed to parse Excel file.", language) });
      }
      
      // Reset input so the same file can be uploaded again if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
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
            className="w-full flex items-center justify-center py-3 bg-emerald-50 text-emerald-700 rounded-xl font-medium hover:bg-emerald-100 transition-colors"
          >
            <FileSpreadsheet size={20} className={language === 'ar' ? 'ml-2' : 'mr-2'} />
            {t('Import Excel File', language)}
          </button>

          {status && (
            <div className={`mt-4 p-3 rounded-xl flex items-start text-sm ${
              status.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
            }`}>
              {status.type === 'success' 
                ? <CheckCircle2 size={16} className={`mt-0.5 shrink-0 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} /> 
                : <AlertCircle size={16} className={`mt-0.5 shrink-0 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
              }
              {status.message}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
