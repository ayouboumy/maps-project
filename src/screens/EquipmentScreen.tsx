import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, Plus, Trash2, X, Package, 
  Search, Filter, LayoutGrid, List as ListIcon
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { t } from '../utils/translations';
import { useState, useMemo } from 'react';
import { cn } from '../lib/utils';

export default function EquipmentScreen() {
  const { selectedMosque, language, updateMosqueItems, setIsEquipmentOpen } = useAppStore();
  const [newItemName, setNewItemName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  if (!selectedMosque) return null;

  const handleAddItem = () => {
    if (newItemName.trim()) {
      const updatedItems = [...(selectedMosque.items || []), newItemName.trim()];
      updateMosqueItems(selectedMosque.id, updatedItems);
      setNewItemName('');
    }
  };

  const handleDeleteItem = (index: number) => {
    const updatedItems = (selectedMosque.items || []).filter((_, i) => i !== index);
    updateMosqueItems(selectedMosque.id, updatedItems);
  };

  const filteredItems = useMemo(() => {
    const items = selectedMosque.items || [];
    if (!searchQuery.trim()) return items;
    return items.filter(item => 
      item.toLowerCase().includes(searchQuery.toLowerCase().trim())
    );
  }, [selectedMosque.items, searchQuery]);

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[3000] bg-gray-50 flex flex-col"
    >
      {/* Header */}
      <div className="bg-white px-6 pt-safe-4 pb-6 shadow-sm border-b border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={() => setIsEquipmentOpen(false)}
            className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft size={24} className={language === 'ar' ? 'rotate-180' : ''} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center">
              <Package size={18} />
            </div>
            <h1 className="text-lg font-black text-gray-900 uppercase tracking-tight">
              {t('Equipment', language)}
            </h1>
          </div>
          <div className="w-10" /> {/* Spacer */}
        </div>

        <div className="flex flex-col gap-4">
          <div className="relative">
            <div className={`absolute inset-y-0 ${language === 'ar' ? 'right-0 pr-3' : 'left-0 pl-3'} flex items-center pointer-events-none`}>
              <Search size={18} className="text-gray-400" />
            </div>
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('Search equipment...', language)}
              className={`w-full ${language === 'ar' ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-sm font-medium`}
            />
          </div>

          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input 
                type="text"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
                placeholder={t('Add new equipment...', language)}
                className="w-full px-4 py-3 bg-emerald-50/50 border border-emerald-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-sm font-bold text-emerald-900 placeholder:text-emerald-300"
              />
            </div>
            <button 
              onClick={handleAddItem}
              disabled={!newItemName.trim()}
              className="px-6 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:scale-95 shadow-lg shadow-emerald-100 flex items-center gap-2"
            >
              <Plus size={20} />
              <span className="hidden sm:inline">{t('Add', language)}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
              {filteredItems.length} {t('Items', language)}
            </span>
          </div>
          <div className="flex bg-white p-1 rounded-xl border border-gray-100 shadow-sm">
            <button 
              onClick={() => setViewMode('grid')}
              className={cn(
                "p-2 rounded-lg transition-all",
                viewMode === 'grid' ? "bg-emerald-50 text-emerald-600 shadow-sm" : "text-gray-400 hover:text-gray-600"
              )}
            >
              <LayoutGrid size={18} />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={cn(
                "p-2 rounded-lg transition-all",
                viewMode === 'list' ? "bg-emerald-50 text-emerald-600 shadow-sm" : "text-gray-400 hover:text-gray-600"
              )}
            >
              <ListIcon size={18} />
            </button>
          </div>
        </div>

        <div className={cn(
          "grid gap-4",
          viewMode === 'grid' ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-1"
        )}>
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item, idx) => (
              <motion.div
                layout
                key={`${item}-${idx}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={cn(
                  "bg-white rounded-2xl border border-gray-100 p-4 flex items-center justify-between group hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-900/5 transition-all",
                  viewMode === 'list' ? "py-5" : "flex-col text-center gap-4"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center transition-transform group-hover:rotate-12",
                  viewMode === 'grid' ? "w-12 h-12" : ""
                )}>
                  <Package size={viewMode === 'grid' ? 24 : 20} />
                </div>
                
                <div className="flex-1 px-2">
                  <span className="text-sm font-black text-gray-900 line-clamp-2 leading-tight">
                    {item}
                  </span>
                </div>

                <button 
                  onClick={() => handleDeleteItem(idx)}
                  className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={18} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {filteredItems.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-[32px] flex items-center justify-center mb-6">
              <Package size={40} className="text-gray-300" />
            </div>
            <h3 className="text-lg font-black text-gray-900 mb-2">{t('No equipment found', language)}</h3>
            <p className="text-sm text-gray-500 max-w-[200px]">
              {searchQuery ? t('Try a different search term', language) : t('Start by adding your first item above', language)}
            </p>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-6 bg-white border-t border-gray-100">
        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
          <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0">
            <img src={selectedMosque.image} className="w-full h-full object-cover" alt="" />
          </div>
          <div>
            <h4 className="text-xs font-black text-gray-900 line-clamp-1">{selectedMosque.name}</h4>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{selectedMosque.commune}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
