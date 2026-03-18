import { Upload, CheckCircle2, AlertCircle, Database, FileSpreadsheet } from 'lucide-react';
import { useRef, useState, ChangeEvent } from 'react';
import { useAppStore } from '../store/useAppStore';
import * as XLSX from 'xlsx';

export default function SettingsScreen() {
  const { mosques, importMosques } = useAppStore();
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
            // Handle comma-separated strings for arrays
            const parseArray = (val: any) => {
              if (Array.isArray(val)) return val;
              if (typeof val === 'string') return val.split(',').map(s => s.trim()).filter(Boolean);
              return [];
            };

            return {
              id: item.id || index + 1,
              name: item.name || 'Unknown Mosque',
              latitude: Number(item.latitude) || 0,
              longitude: Number(item.longitude) || 0,
              address: item.address || 'Unknown Address',
              type: item.type || 'Mosque',
              services: parseArray(item.services),
              items: parseArray(item.items),
              image: item.image || 'https://images.unsplash.com/photo-1519817650390-64a93db51149?auto=format&fit=crop&q=80&w=1000'
            };
          });

          // Basic validation to ensure it looks like mosque data
          const isValid = formattedMosques.every(item => 
            item.name && !isNaN(item.latitude) && !isNaN(item.longitude)
          );
          
          if (isValid && formattedMosques.length > 0) {
            importMosques(formattedMosques);
            setStatus({ type: 'success', message: `Successfully imported ${formattedMosques.length} mosques from Excel.` });
          } else {
            throw new Error("Invalid format: Could not extract valid mosque data (name, latitude, longitude) from the Excel file.");
          }
        } else {
          throw new Error("Invalid format: Expected rows of mosques in the Excel sheet.");
        }
      } catch (error: any) {
        setStatus({ type: 'error', message: error.message || "Failed to parse Excel file." });
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
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-24">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center mr-3">
              <Database size={20} className="text-emerald-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Data Management</h2>
              <p className="text-sm text-gray-500">{mosques.length} mosques currently loaded</p>
            </div>
          </div>
          
          <p className="text-sm text-gray-600 mb-6">
            Import an Excel file (.xlsx or .xls) to update the mosque database. The sheet should contain columns for name, latitude, longitude, address, type, services, and items.
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
            <FileSpreadsheet size={20} className="mr-2" />
            Import Excel File
          </button>

          {status && (
            <div className={`mt-4 p-3 rounded-xl flex items-start text-sm ${
              status.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
            }`}>
              {status.type === 'success' 
                ? <CheckCircle2 size={16} className="mr-2 mt-0.5 shrink-0" /> 
                : <AlertCircle size={16} className="mr-2 mt-0.5 shrink-0" />
              }
              {status.message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
