import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, MapPin, Navigation, Heart, CheckCircle2, 
  Clipboard, Check, Share2, Building2, Users, Maximize, 
  Home, Droplets, Info, Activity, Clock, ShieldCheck,
  Package, Map, Zap, Layout, DollarSign, Waves, Globe, 
  Thermometer, Ruler, Layers, ShoppingBag, School, BookOpen,
  Dna, Sparkles, Edit3, Save, Plus, Trash2, X, Camera
} from 'lucide-react';
import { Mosque } from '../types';
import { useAppStore } from '../store/useAppStore';
import { cn } from '../lib/utils';
import { t, getLocalizedName } from '../utils/translations';
import { useState, useMemo, useEffect } from 'react';

interface ProfileScreenProps {
  mosque: Mosque;
  onClose: () => void;
}

export default function ProfileScreen({ mosque, onClose }: ProfileScreenProps) {
  const { favorites, toggleFavorite, language, routeProfile, userLocation, setIsEquipmentOpen, darkMode, updateMosque } = useAppStore();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'land' | 'construction' | 'services' | 'components' | 'revenue' | 'other'>('general');
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Record<string, any>>({});
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldValue, setNewFieldValue] = useState('');
  const isFavorite = favorites.includes(mosque.id);
  const displayCode = mosque.code || 
    (mosque.extraData && Object.entries(mosque.extraData).find(([k]) => k.toLowerCase().includes('code') || k.includes('رمز'))?.[1]);

  useEffect(() => {
    if (isEditing) {
      setEditData({
        name: mosque.name,
        address: mosque.address,
        image: mosque.image,
        ...(mosque.extraData || {})
      });
    }
  }, [isEditing, mosque]);

  const handleSave = () => {
    const { name, address, image, ...extraData } = editData;
    updateMosque(mosque.id, {
      name,
      address,
      image,
      extraData
    });
    setIsEditing(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditData(prev => ({
          ...prev,
          image: reader.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddField = () => {
    if (newFieldName && newFieldValue) {
      setEditData(prev => ({
        ...prev,
        [newFieldName]: newFieldValue
      }));
      setNewFieldName('');
      setNewFieldValue('');
    }
  };

  const removeField = (key: string) => {
    const newData = { ...editData };
    delete newData[key];
    setEditData(newData);
  };

  const handleCopyPosition = () => {
    const coords = `${mosque.latitude}, ${mosque.longitude}`;
    navigator.clipboard.writeText(coords);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: mosque.name,
          text: `${mosque.name} - ${mosque.address}`,
          url: `https://www.google.com/maps/search/?api=1&query=${mosque.latitude},${mosque.longitude}`,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    }
  };

  const handleOpenGoogleMapsRoute = () => {
    const travelMode = (routeProfile || 'foot') === 'foot' ? 'walking' : 'driving';
    if (userLocation) {
      window.open(`https://www.google.com/maps/dir/?api=1&origin=${userLocation.latitude},${userLocation.longitude}&destination=${mosque.latitude},${mosque.longitude}&travelmode=${travelMode}`, '_blank');
    } else {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${mosque.latitude},${mosque.longitude}&travelmode=${travelMode}`, '_blank');
    }
  };

  // Optimized & Strict Manual Data Categorization based on specific 6-category structure provided by user
  const categories = useMemo(() => {
    const exactStructure = {
      general: [
        "اسم المسجد", "رمز المسجد", "عنوان المسجد", "الجماعة", "جهة الإنفاق", 
        "type", "nature", "تاريخ البناء", "حالة البناية", "statut", "etat", "province", "ville", "commune",
        "mhai", "association", "comité_de_quartier", "bienfaiteurs", "autre", "ouverture",
        "code", "address", "رمز", "عنوان"
      ],
      land: [
        "مساحة القطعة الأرضية", "المساحة المبنية", "غير المبنية: المساحة", "غير المبنية: المساحة المهيأة", 
        "غير المبنية: المساحة غير المهيأة", "x", "y", "longitude", "latitude", "superficie", "surface terrain", "surface batie",
        "topographique", "topogaphique", "existance de talus", "existance de rigoles d'eau", "ravin", 
        "ter_gmp_autre", "zone_thermique", "titre foncier", "foncier"
      ],
      construction: [
        "نوع اليناء", "béton_armé", "construction_en_terre_adobe", "construction_en_terre_pisé", 
        "msq_mat_pierre", "brique_traditionnel", "tôle_en_bois", "tôle_métallique",
        "beton arme", "pierre", "construction", "mur", "plafond", "toiture", "charpente"
      ],
      services: [
        "nombre_d_accès_à_la_mosquée", "réseau_routier", "piste_carossable", "piste_non_carossable", 
        "accessibilité_handicapé", "branché_au_réseau_d_eau_potable", "puits", "sources", 
        "branché_au_réseau_d_électricité", "photovoltaïque", "traditionnel", 
        "branché_au_réseau_d_assainissement", "fosse_septique_puits_perdu", "aucun",
        "eau", "electricite", "assainissement", "piste", "route", "solaire", "photovoltaique"
      ],
      items: [
        "مساحة المقصورة", "عدد قاعة الصلاة للرجال", "مساحة قاعة الصلاة للرجال", "عدد قاعة الصلاة للنساء",
        "مساحة قاعة الصلاة للنساء", "عدد مراحيض الرجال", "مساحة مراحيض الرجال", "عدد مراحيض للنساء",
        "مساحة مراحيض للنساء", "ارتفاع الصومعة", "عدد طبقات الصومعة", "قاعدة الصومعة", "عدد سكن الامام",
        "مساحة سكن الإمام", "عدد سكن المؤذن", "مساحة سكن المؤذن", "عدد المخزن", "مساحة المخزن",
        "عدد المسيد", "مساحة المسيد", "عدد الكتاب القرآني القرآنية", "مساحة الكتاب القرآني القرآنية",
        "عدد المدرسة", "مساحة المدرسة", "عدد قاعة الاجتماعات", "مساحة قاعة الاجتماعات",
        "عدد الصحن", "مساحة الصحن", "عدد الأروقة", "مساحة الأروقة", "عدد غرفة الامام", "مساحة غرفة الامام",
        "عدد غرفة المؤذن", "مساحة غرفة المؤذن", "عدد غرفة المؤقت", "مساحة غرفة المؤقت",
        "عدد غرفة الموتى", "مساحة غرفة الموتى",
        "salle de priere", "toilettes", "wc", "minaret", "logement", "ecole", "msid", "sahn", "arwaqa"
      ],
      revenue: [
        "عدد محلات تجارية", "مساحة محلات تجارية", "عدد سكن", "مساحة سكن",
        "shops", "boutiques", "magasins", "loyer", "revenu", "wakf", "habous"
      ],
      other: []
    };

    const sections = {
      general: [] as {key: string, value: any}[],
      land: [] as {key: string, value: any}[],
      construction: [] as {key: string, value: any}[],
      services: [] as {key: string, value: any}[],
      items: [] as {key: string, value: any}[],
      revenue: [] as {key: string, value: any}[],
      other: [] as {key: string, value: any}[]
    };

    const usedKeys = new Set<string>();

    const normalize = (str: string) => {
      // Gentle normalization to avoid destroying data
      return str.toLowerCase()
        .replace(/_/g, ' ')
        .replace(/\s+/g, ' ')
        .replace(/[أإآا]/g, 'ا')
        .replace(/[ةه]/g, 'ه')
        .replace(/[يى]/g, 'ي')
        .replace(/[éèêë]/g, 'e')
        .replace(/[àâä]/g, 'a')
        .replace(/[îï]/g, 'i')
        .replace(/[ôö]/g, 'o')
        .replace(/[ûü]/g, 'u')
        .replace(/[ç]/g, 'c')
        .replace(/[\(\)\[\]\.،:]/g, '') // remove common punctuation from Excel headers
        .trim();
    };

    // Include base properties as part of the data pool
    const dataSource = { 
      // Base mappings that correspond to user properties if they uploaded standard fields
      "اسم المسجد": mosque.name,
      "longitude": mosque.longitude,
      "latitude": mosque.latitude,
      "عنوان المسجد": mosque.address,
      "address": mosque.address,
      "code": mosque.code,
      "رمز المسجد": mosque.code,
      "type": mosque.type,
      ...mosque.extraData
    };

    // Add explicit services and items if they weren't in extraData pool
    if (mosque.services && mosque.services.length > 0) {
      mosque.services.forEach((s: string) => {
        const normS = normalize(s);
        const alreadyIn = Object.keys(dataSource).some(k => normalize(k) === normS);
        if (!alreadyIn) {
          sections.services.push({ key: s, value: "OUI" });
        }
      });
    }
    if (mosque.items && mosque.items.length > 0) {
      mosque.items.forEach((i: string) => {
        const normI = normalize(i);
        const alreadyIn = Object.keys(dataSource).some(k => normalize(k) === normI);
        if (!alreadyIn) {
          sections.items.push({ key: i, value: "OUI" });
        }
      });
    }

    // Map according to exact user-defined structure
    Object.entries(exactStructure).forEach(([sectionId, keys]) => {
      keys.forEach(k => {
        const normK = normalize(k);
        
        let foundKey = Object.keys(dataSource).find(dataKey => dataKey === k);
        if (!foundKey) {
          foundKey = Object.keys(dataSource).find(dataKey => dataKey.trim() === k.trim());
        }
        if (!foundKey) {
          foundKey = Object.keys(dataSource).find(dataKey => {
            const nData = normalize(dataKey);
            if (nData === normK) return true;
            // Fuzzy match for longer keys (e.g. accounting for units like (م2) or extra words)
            if (normK.length >= 5 && nData.includes(normK)) return true;
            if (nData.length >= 5 && normK.includes(nData)) return true;
            return false;
          });
        }

        if (foundKey && !usedKeys.has(foundKey)) {
          const val = (dataSource as any)[foundKey];
          if (val !== undefined && val !== null && val !== '') {
            sections[sectionId as keyof typeof sections].push({ 
              key: k, // Display using the exact structured key requested by the user
              value: val 
            });
            usedKeys.add(foundKey);
          }
        }
      });
    });

    // Heuristics for any MISSING unmapped keys
    if (mosque.extraData) {
      Object.keys(mosque.extraData).forEach(key => {
        if (!usedKeys.has(key)) {
          const val = mosque.extraData![key];
          if (val !== undefined && val !== null && val !== '') {
            const nData = normalize(key);
            // Auto-categorize based on keywords if they were missed by exact structure
            const nDataLc = nData.toLowerCase();
            if (nData.includes('مساحه') || nData.includes('مساحات') || nData.includes('عدد') || nDataLc.includes('surface') || nDataLc.includes('superficie') || nDataLc.includes('nombre') || nDataLc.includes('nb ')) {
               if (nData.includes('سكن') || nData.includes('محل') || nData.includes('تجار') || nDataLc.includes('boutique') || nDataLc.includes('magasin') || nDataLc.includes('commerce') || nDataLc.includes('loyer')) {
                 sections.revenue.push({ key, value: val });
               } else if (nData.includes('ارض') || nData.includes('قطعه') || nData.includes('مبنيه') || nDataLc.includes('terrain') || nDataLc.includes('parcelle') || nDataLc.includes('foncier')) {
                 sections.land.push({ key, value: val });
               } else {
                 sections.items.push({ key, value: val });
               }
            } else if (nData.includes('شبكه') || nData.includes('ماء') || nData.includes('كهرباء') || nData.includes('صرف') || nData.includes('طريق') || nDataLc.includes('reseau') || nDataLc.includes('eau') || nDataLc.includes('electricite') || nDataLc.includes('assainissement') || nDataLc.includes('route') || nDataLc.includes('piste') || nDataLc.includes('solaire') || nDataLc.includes('photovoltaique')) {
               sections.services.push({ key, value: val });
            } else if (nData.includes('بناء') || nData.includes('تراب') || nData.includes('حجر') || nData.includes('اسمنت') || nData.includes('خرسانه') || nDataLc.includes('construction') || nDataLc.includes('pierre') || nDataLc.includes('beton') || nDataLc.includes('brique') || nDataLc.includes('mur') || nDataLc.includes('toiture')) {
               sections.construction.push({ key, value: val });
            } else if (nData.includes('جماعه') || nData.includes('اقليم') || nData.includes('عنوان') || nData.includes('رمز') || nDataLc.includes('commune') || nDataLc.includes('address') || nDataLc.includes('code') || nDataLc.includes('ville') || nDataLc.includes('province') || nDataLc.includes('statut') || nDataLc.includes('etat')) {
               sections.general.push({ key, value: val });
            } else {
               sections.other.push({ key, value: val });
            }
            usedKeys.add(key);
          }
        }
      });
    }

    // Include unmapped base fields into other if desired, but here we just map extraData

    return { sections };
  }, [mosque]);

  const tabs = [
    { id: 'general', label: 'معلومات عامة', icon: Info },
    { id: 'land', label: 'معلومات القطعة الأرضية', icon: Map },
    { id: 'construction', label: 'معلومات البناء', icon: Building2 },
    { id: 'services', label: 'معلومات الخدمات', icon: Zap },
    { id: 'items', label: 'مكونات المسجد', icon: Layout },
    { id: 'revenue', label: 'معلومات الأملاك ذات العائد', icon: DollarSign },
    { id: 'other', label: 'معلومات إضافية', icon: Clipboard }
  ] as const;


  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[2000] bg-gray-50 dark:bg-gray-950 overflow-hidden flex flex-col transition-colors duration-300"
    >
      {/* Compact Navigation Bar */}
      <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-4 px-6 pt-safe-4 backdrop-blur-sm bg-white/10 dark:bg-black/10">
        <button 
          onClick={onClose}
          className="p-2.5 bg-white dark:bg-gray-900 rounded-xl text-gray-900 dark:text-white border border-gray-100 dark:border-gray-800 shadow-lg active:scale-90 transition-all"
        >
          <ArrowLeft size={20} className={language === 'ar' ? 'rotate-180' : ''} />
        </button>

        <div className="flex gap-2">
          <button 
            onClick={() => setIsEditing(!isEditing)}
            className={cn(
              "p-2.5 rounded-xl border shadow-lg active:scale-90 transition-all",
              isEditing 
                ? "bg-blue-600 text-white border-blue-600" 
                : "bg-white dark:bg-gray-900 text-gray-900 dark:text-white border-gray-100 dark:border-gray-800"
            )}
          >
            {isEditing ? <Save size={20} onClick={(e) => { e.stopPropagation(); handleSave(); }} /> : <Edit3 size={20} />}
          </button>
          <button 
            onClick={handleShare}
            className="p-2.5 bg-white dark:bg-gray-900 rounded-xl text-gray-900 dark:text-white border border-gray-100 dark:border-gray-800 shadow-lg active:scale-90 transition-all"
          >
            <Share2 size={20} />
          </button>
          <button 
            onClick={() => toggleFavorite(mosque.id)}
            className={cn(
              "p-2.5 rounded-xl border shadow-lg active:scale-90 transition-all",
              isFavorite 
                ? "bg-red-500 text-white border-red-500" 
                : "bg-white dark:bg-gray-900 text-gray-900 dark:text-white border-gray-100 dark:border-gray-800"
            )}
          >
            <Heart size={20} className={cn(isFavorite && "fill-current")} />
          </button>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="flex-1 overflow-y-auto no-scrollbar pb-32">
        {/* Compact Hero Banner */}
        <div className="relative h-[38vh] min-h-[300px]">
          <img 
            src={isEditing ? editData.image || mosque.image : mosque.image} 
            alt={mosque.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-50 via-gray-50/20 to-transparent" />
          
          {isEditing && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
              <label className="flex flex-col items-center gap-2 cursor-pointer group">
                <div className="w-16 h-16 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center border-2 border-white/50 transition-all group-active:scale-90 shadow-2xl">
                  <Camera size={32} className="text-white" />
                </div>
                <span className="text-white font-black text-xs uppercase tracking-widest drop-shadow-md">
                  {t('Change Photo', language)}
                </span>
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleImageUpload}
                />
              </label>
            </div>
          )}
          
          <div className="absolute bottom-6 left-6 right-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 bg-emerald-500 text-white rounded-md text-[8px] font-black uppercase tracking-widest">{mosque.type}</span>
            </div>
            <h1 className="text-3xl font-serif font-black text-gray-900 dark:text-white leading-tight mb-1 drop-shadow-sm">
              {getLocalizedName(mosque, language)}
            </h1>
            {displayCode && (
              <div className="mb-2">
                <span className="text-[10px] font-black tracking-widest text-emerald-600 dark:text-emerald-400 uppercase bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-md inline-block border border-emerald-100 dark:border-emerald-800 shadow-sm">
                  رمز المسجد {displayCode}
                </span>
              </div>
            )}
            <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 text-sm font-medium">
              <MapPin size={14} className="shrink-0" />
              <span className="line-clamp-1">{t(mosque.address, language)}</span>
            </div>
          </div>
        </div>

        {/* Action & Stats Summary */}
        <div className="px-5 -mt-4 relative z-10 space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={handleOpenGoogleMapsRoute}
              className="flex flex-col items-center justify-center p-3 bg-emerald-600 text-white rounded-2xl shadow-xl active:scale-95 transition-all text-center"
            >
              <Navigation size={20} />
              <span className="text-[8px] font-black uppercase tracking-tighter mt-1">{t('Google Maps', language)}</span>
            </button>
            <button 
              onClick={handleCopyPosition}
              className="flex flex-col items-center justify-center p-3 bg-blue-600 dark:bg-blue-500 text-white rounded-2xl shadow-xl active:scale-95 transition-all text-center"
            >
              {copied ? <Check size={20} /> : <Clipboard size={20} />}
              <span className="text-[8px] font-black uppercase tracking-tighter mt-1">{copied ? t('Copied', language) : t('Copy GPS', language)}</span>
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex overflow-x-auto no-scrollbar gap-2 py-1 -mx-5 px-5">
            {tabs.map(tab => {
              const isActive = activeTab === tab.id;
              const items = categories.sections[tab.id as keyof typeof categories.sections];
              if (!items || items.length === 0) return null;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 rounded-2xl whitespace-nowrap transition-all flex-shrink-0 font-bold text-sm",
                    isActive 
                      ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-md"
                      : "bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 border border-gray-100 dark:border-gray-800"
                  )}
                >
                  <tab.icon size={16} className={isActive ? "" : "text-gray-400"} />
                  {t(tab.label, language)}
                </button>
              );
            })}
          </div>

          {/* Document Content */}
          <div className="pb-20 pt-4">
            {isEditing ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white dark:bg-gray-900 rounded-[32px] border border-gray-100 dark:border-gray-800 p-6 shadow-xl space-y-6"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-black text-gray-900 dark:text-white">{t('Edit Mosque Data', language)}</h3>
                  <button onClick={() => setIsEditing(false)} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                    <X size={24} />
                  </button>
                </div>

                <div className="space-y-4">
                  {Object.entries(editData).map(([key, value]) => (
                    <div key={key} className="flex items-end gap-3 group">
                      {key !== 'image' && (
                        <>
                          <div className="flex-1 space-y-1">
                            <label className="text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest px-1">
                              {key}
                            </label>
                            <input
                              type="text"
                              value={value}
                              onChange={(e) => setEditData(prev => ({ ...prev, [key]: e.target.value }))}
                              className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl px-4 py-3 text-sm font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                            />
                          </div>
                          {key !== 'name' && key !== 'address' && (
                            <button 
                              onClick={() => removeField(key)}
                              className="p-3 text-gray-300 hover:text-red-500 transition-all"
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </div>

                <div className="pt-6 border-t border-gray-100 dark:border-gray-800">
                  <h4 className="text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest mb-4 px-1">{t('Add Custom Field', language)}</h4>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      placeholder={t('Field Name (e.g., Imam Name)', language)}
                      value={newFieldName}
                      onChange={(e) => setNewFieldName(e.target.value)}
                      className="flex-1 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl px-4 py-3 text-sm font-bold outline-none ring-1 ring-gray-100 dark:ring-gray-800 focus:ring-2 focus:ring-emerald-500 transition-all"
                    />
                    <input
                      placeholder={t('Field Value', language)}
                      value={newFieldValue}
                      onChange={(e) => setNewFieldValue(e.target.value)}
                      className="flex-1 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl px-4 py-3 text-sm font-bold outline-none ring-1 ring-gray-100 dark:ring-gray-800 focus:ring-2 focus:ring-emerald-500 transition-all"
                    />
                    <button
                      onClick={handleAddField}
                      className="bg-emerald-600 text-white p-3 rounded-2xl shadow-lg hover:bg-emerald-700 transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                      <Plus size={20} />
                      <span className="sm:hidden font-bold">{t('Add', language)}</span>
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleSave}
                  className="w-full bg-blue-600 text-white p-4 rounded-3xl font-black text-lg shadow-xl hover:bg-blue-700 transition-all active:scale-95 flex items-center justify-center gap-3"
                >
                  <Save size={24} />
                  {t('Save Changes', language)}
                </button>
              </motion.div>
            ) : (
              <AnimatePresence mode="wait">
                {tabs.map((tab) => {
                if (tab.id !== activeTab) return null;
                
                const items = categories.sections[tab.id as keyof typeof categories.sections];
                if (!items || items.length === 0) return (
                  <motion.div 
                    key="empty"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-8 text-center text-gray-400 dark:text-gray-600 font-medium"
                  >
                    {t('No data available in this category', language)}
                  </motion.div>
                );

                return (
                  <motion.div 
                    key={tab.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="relative"
                  >
                    {/* Components Data Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {items.map((item, i) => (
                        <motion.div 
                          key={i} 
                          initial={{ opacity: 0, y: 15 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: i * 0.03 }}
                          className={cn(
                            "group bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-4 rounded-3xl hover:border-emerald-200 dark:hover:border-emerald-800 transition-all duration-300",
                            items.length % 2 !== 0 && i === 0 ? "sm:col-span-2" : ""
                          )}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <span className="text-[9px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest block mb-1 group-hover:text-emerald-500 transition-colors">
                                {t(item.key, language)}
                              </span>
                              <span className="text-sm font-bold text-gray-900 dark:text-gray-100 leading-tight">
                                {t(String(item.value), language)}
                              </span>
                            </div>
                            <div className="w-8 h-8 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-300 dark:text-gray-600 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-900/30 group-hover:text-emerald-500 transition-all shrink-0">
                              <CheckCircle2 size={14} />
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>

          {/* Technical Inventory Footer Link */}
          <div className="pt-6">
            <button 
              onClick={() => setIsEquipmentOpen(true)}
              className="group relative w-full overflow-hidden p-6 bg-gray-900 dark:bg-white rounded-[40px] text-white dark:text-gray-900 shadow-2xl active:scale-95 transition-all"
            >
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                <Package size={80} />
              </div>
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-white/10 dark:bg-black/10 rounded-2xl flex items-center justify-center text-emerald-400 dark:text-emerald-600">
                    <Activity size={28} />
                  </div>
                  <div>
                    <h4 className="text-lg font-black tracking-tight leading-none mb-1.5">{t('Technical Inventory', language)}</h4>
                    <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">{t('Track state of maintenance and equipment', language)}</p>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-white/5 dark:bg-gray-100 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                  <ArrowLeft size={20} className={cn(language === 'ar' ? '' : 'rotate-180')} />
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
