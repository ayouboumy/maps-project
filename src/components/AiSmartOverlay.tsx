import { useState, useEffect } from 'react';
import { Sparkles, Brain, X, ChevronRight, MessageSquare } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { motion, AnimatePresence } from 'framer-motion';
import { t } from '../utils/translations';

export default function AiSmartOverlay() {
  const { selectedCommune, language, aiInsights, knowledgeBase, mosques } = useAppStore();
  const [showInsight, setShowInsight] = useState(false);
  const [localInsight, setLocalInsight] = useState<string | null>(null);

  useEffect(() => {
    if (selectedCommune) {
      // Find a relevant insight from the pre-trained ones or generate a simple pattern
      const relevantPatterns = Object.entries(knowledgeBase.regionalPatterns)
        .filter(([commune]) => commune === selectedCommune);
      
      if (relevantPatterns.length > 0) {
        setLocalInsight(relevantPatterns[0][1]);
        setShowInsight(true);
      } else {
        // Fallback: simple stats-based insight
        const count = mosques.filter(m => m.commune === selectedCommune).length;
        if (count > 0) {
          setLocalInsight(`${selectedCommune} has ${count} mosques in our database. Most are categorized as ${mosques.find(m => m.commune === selectedCommune)?.type || 'standard'}.`);
          setShowInsight(true);
        } else {
          setLocalInsight(null);
          setShowInsight(false);
        }
      }
    } else {
      setShowInsight(false);
    }
  }, [selectedCommune, knowledgeBase, mosques]);

  if (!selectedCommune) return null;

  return (
    <AnimatePresence>
      {showInsight && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="absolute top-safe-20 left-4 z-[1000] max-w-[280px]"
        >
          <div className="bg-white/90 backdrop-blur-md border border-purple-100 rounded-2xl p-4 shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Sparkles size={14} className="text-purple-600" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-purple-600">{t('Regional Insight', language)}</span>
              </div>
              <button onClick={() => setShowInsight(false)} className="text-gray-400 hover:text-gray-600">
                <X size={14} />
              </button>
            </div>
            
            <p className="text-xs text-gray-700 leading-relaxed font-bold">
              {localInsight}
            </p>
            
            <div className="mt-3 flex items-center gap-2 text-[10px] font-bold text-gray-400">
              <Brain size={10} />
              <span>Learned from system training</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
