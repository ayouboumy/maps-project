import { Language, useAppStore } from '../store/useAppStore';

const dictionary: Record<string, Record<Language, string>> = {
  // Export functionality
  'Export Map Image': { en: 'Export Map Image', fr: 'Exporter la carte (Image)', ar: 'تصدير صورة الخريطة' },
  'Capturing Map': { en: 'Capturing Map', fr: 'Capture de la carte', ar: 'جاري التقاط الخريطة' },
  'Hide Names': { en: 'Hide Names', fr: 'Masquer les noms', ar: 'إخفاء الأسماء' },
  'Show Names': { en: 'Show Names', fr: 'Afficher les noms', ar: 'إظهار الأسماء' },
  'Rendering high-resolution analysis. Please wait...': { en: 'Rendering high-resolution analysis. Please wait...', fr: 'Génération de l\'analyse haute résolution. Veuillez patienter...', ar: 'جاري إنشاء تحليل عالي الدقة. يرجى الانتظار...' },
  'Failed to export map image. Image contains unsupported styles (oklch) or server blocked tiles.': { 
    en: 'Failed to export map image. Image contains unsupported styles (oklch) or server blocked tiles.', 
    fr: 'Échec de l\'exportation. L\'image contient des styles non supportés (oklch) ou les tuiles ont été bloquées.', 
    ar: 'فشل التصدير. تحتوي الصورة على أنماط غير مدعومة أو تم حظر البلاطات.' 
  },
  'Failed to export map image. Please try again.': { en: 'Failed to export map image. Please try again.', fr: 'Échec de l\'exportation de la carte. Veuillez réessayer.', ar: 'فشل تصدير صورة الخريطة. يرجى المحاولة مرة أخرى.' },
  
  'Edit Mosque Data': { en: 'Edit Mosque Data', fr: 'Modifier les données de la mosquée', ar: 'تعديل بيانات المسجد' },
  'Save Changes': { en: 'Save Changes', fr: 'Enregistrer les modifications', ar: 'حفظ التغييرات' },
  'Add Custom Field': { en: 'Add Custom Field', fr: 'Ajouter un champ personnalisé', ar: 'إضافة حقل مخصص' },
  'Field Name (e.g., Imam Name)': { en: 'Field Name (e.g., Imam Name)', fr: 'Nom du champ (ex: Nom de l\'Imam)', ar: 'اسم الحقل (مثال: اسم الإمام)' },
  'Field Value': { en: 'Field Value', fr: 'Valeur du champ', ar: 'قيمة الحقل' },
  'Add': { en: 'Add', fr: 'Ajouter', ar: 'إضافة' },
  
  'Settings': { en: 'Settings', fr: 'Paramètres', ar: 'الإعدادات' },
  'Display Settings': { en: 'Display Settings', fr: 'Paramètres d\'affichage', ar: 'إعدادات العرض' },
  'Dark Mode': { en: 'Dark Mode', fr: 'Mode sombre', ar: 'الوضع الداكن' },
  'Data Management': { en: 'Data Management', fr: 'Gestion des données', ar: 'إدارة البيانات' },
  'mosques currently loaded': { en: 'mosques currently loaded', fr: 'mosquées actuellement chargées', ar: 'مساجد محملة حالياً' },
  'Import an Excel file': { 
    en: 'Import an Excel file (.xlsx or .xls) to update the mosque database. The sheet should contain columns for name, latitude, longitude, address, type, services, and items.', 
    fr: 'Importez un fichier Excel (.xlsx ou .xls) pour mettre à jour la base de données. La feuille doit contenir les colonnes nom, latitude, longitude, adresse, type, services et items.', 
    ar: 'قم باستيراد ملف Excel (.xlsx أو .xls) لتحديث قاعدة بيانات المساجد. يجب أن تحتوي الورقة على أعمدة للاسم وخط العرض وخط الطول والعنوان والنوع والخدمات والعناصر.' 
  },
  'Import Excel File': { en: 'Import Excel File', fr: 'Importer un fichier Excel', ar: 'استيراد ملف إكسل' },
  'Parsing Excel file...': { en: 'Parsing Excel file...', fr: 'Analyse du fichier Excel...', ar: 'جاري تحليل ملف إكسل...' },
  'Translating new terms intelligently...': { en: 'Translating new terms intelligently...', fr: 'Traduction intelligente des nouveaux termes...', ar: 'جاري ترجمة المصطلحات الجديدة بذكاء...' },
  'Translating...': { en: 'Translating...', fr: 'Traduction...', ar: 'جاري الترجمة...' },
  'Language': { en: 'Language', fr: 'Langue', ar: 'اللغة' },
  'Select Language': { en: 'Select Language', fr: 'Choisir la langue', ar: 'اختر اللغة' },
  'Map': { en: 'Map', fr: 'Carte', ar: 'الخريطة' },
  'Search': { en: 'Search', fr: 'Recherche', ar: 'بحث' },
  'Favorites': { en: 'Favorites', fr: 'Favoris', ar: 'المفضلة' },
  'Search mosques...': { en: 'Search mosques...', fr: 'Rechercher des mosquées...', ar: 'ابحث عن المساجد...' },
  'No mosques found': { en: 'No mosques found', fr: 'Aucune mosquée trouvée', ar: 'لم يتم العثور على مساجد' },
  'No favorite mosques yet': { en: 'No favorite mosques yet', fr: 'Aucune mosquée favorite', ar: 'لا توجد مساجد مفضلة بعد' },
  'Tap the heart icon on a mosque to add it to your favorites.': { 
    en: 'Tap the heart icon on a mosque to add it to your favorites.', 
    fr: 'Appuyez sur l\'icône cœur d\'une mosquée pour l\'ajouter à vos favoris.', 
    ar: 'اضغط على أيقونة القلب على المسجد لإضافته إلى مفضلتك.' 
  },
  'Successfully imported': { en: 'Successfully imported', fr: 'Importation réussie de', ar: 'تم استيراد بنجاح' },
  'mosques from Excel.': { en: 'mosques from Excel.', fr: 'mosquées depuis Excel.', ar: 'مسجد من إكسل.' },
  'Invalid format: Could not extract valid mosque data (name, latitude, longitude) from the Excel file. If your coordinates are in Lambert projection, please convert them to WGS84 (GPS) first.': { 
    en: 'Invalid format: Could not extract valid mosque data (name, latitude, longitude) from the Excel file. If your coordinates are in Lambert projection, please convert them to WGS84 (GPS) first.', 
    fr: 'Format invalide : Impossible d\'extraire des données valides (nom, latitude, longitude) du fichier Excel. Si vos coordonnées sont en projection Lambert, veuillez d\'abord les convertir en WGS84 (GPS).', 
    ar: 'تنسيق غير صالح: تعذر استخراج بيانات مسجد صالحة (الاسم، خط العرض، خط الطول) من ملف إكسل. إذا كانت إحداثياتك بنظام لامبرت، يرجى تحويلها إلى WGS84 (GPS) أولاً.' 
  },
  'Invalid format: Could not extract valid mosque data (name, latitude, longitude) from the Excel file.': { en: 'Invalid format: Could not extract valid mosque data (name, latitude, longitude) from the Excel file.', fr: 'Format invalide : Impossible d\'extraire des données valides (nom, latitude, longitude) du fichier Excel.', ar: 'تنسيق غير صالح: تعذر استخراج بيانات مسجد صالحة (الاسم، خط العرض، خط الطول) من ملف إكسل.' },
  'Invalid format: Expected rows of mosques in the Excel sheet.': { en: 'Invalid format: Expected rows of mosques in the Excel sheet.', fr: 'Format invalide : Des lignes de mosquées étaient attendues dans la feuille Excel.', ar: 'تنسيق غير صالح: كان من المتوقع وجود صفوف من المساجد في ورقة إكسل.' },
  'Failed to parse Excel file.': { en: 'Failed to parse Excel file.', fr: 'Échec de l\'analyse du fichier Excel.', ar: 'فشل في تحليل ملف إكسل.' },
  'Navigate': { en: 'Navigate', fr: 'Naviguer', ar: 'توجيه' },
  'Save': { en: 'Save', fr: 'Enregistrer', ar: 'حفظ' },
  'Details': { en: 'Details', fr: 'Détails', ar: 'تفاصيل' },
  'My Location': { en: 'My Location', fr: 'Ma position', ar: 'موقعي' },
  'Location access denied or unavailable.': { en: 'Location access denied or unavailable.', fr: 'Accès à la position refusé ou indisponible.', ar: 'الوصول إلى الموقع مرفوض أو غير متاح.' },
  'Geolocation is not supported by your browser.': { en: 'Geolocation is not supported by your browser.', fr: 'La géolocalisation n\'est pas prise en charge par votre navigateur.', ar: 'تحديد الموقع الجغرافي غير مدعوم في متصفحك.' },
  'Search mosques, cities...': { en: 'Search mosques, cities...', fr: 'Rechercher des mosquées, des villes...', ar: 'ابحث عن المساجد، المدن...' },
  'Filters': { en: 'Filters', fr: 'Filtres', ar: 'تصفية' },
  'Type': { en: 'Type', fr: 'Type', ar: 'النوع' },
  'All': { en: 'All', fr: 'Tout', ar: 'الكل' },
  'Try adjusting your search or filters': { en: 'Try adjusting your search or filters', fr: 'Essayez d\'ajuster votre recherche ou vos filtres', ar: 'حاول تعديل بحثك أو عوامل التصفية' },
  'Saved Mosques': { en: 'Saved Mosques', fr: 'Mosquées enregistrées', ar: 'المساجد المحفوظة' },
  'places saved': { en: 'places saved', fr: 'lieux enregistrés', ar: 'أماكن محفوظة' },
  'No favorites yet': { en: 'No favorites yet', fr: 'Aucun favori pour le moment', ar: 'لا توجد مفضلة بعد' },
  'Save your favorite mosques to quickly access them later, even offline.': { en: 'Save your favorite mosques to quickly access them later, even offline.', fr: 'Enregistrez vos mosquées préférées pour y accéder rapidement plus tard, même hors ligne.', ar: 'احفظ مساجدك المفضلة للوصول إليها بسرعة لاحقًا، حتى بدون إنترنت.' },
  'Explore Mosques': { en: 'Explore Mosques', fr: 'Explorer les mosquées', ar: 'استكشف المساجد' },
  'Open in Maps': { en: 'Open in Maps', fr: 'Ouvrir dans Maps', ar: 'افتح في الخرائط' },
  'Services': { en: 'Services', fr: 'Services', ar: 'الخدمات' },
  'Facilities': { en: 'Facilities', fr: 'Équipements', ar: 'المرافق' },
  'No facilities listed': { en: 'No facilities listed', fr: 'Aucun équipement listé', ar: 'لا توجد مرافق مدرجة' },
  'Additional Information': { en: 'Additional Information', fr: 'Informations supplémentaires', ar: 'معلومات إضافية' },
  'Unknown Mosque': { en: 'Unknown Mosque', fr: 'Mosquée inconnue', ar: 'مسجد غير معروف' },
  'Unknown Address': { en: 'Unknown Address', fr: 'Adresse inconnue', ar: 'عنوان غير معروف' },
  'Mosque': { en: 'Mosque', fr: 'Mosquée', ar: 'مسجد' },
  'Grand Mosque': { en: 'Grand Mosque', fr: 'Grande Mosquée', ar: 'مسجد كبير' },
  'Historic Mosque': { en: 'Historic Mosque', fr: 'Mosquée Historique', ar: 'مسجد تاريخي' },
  'University Mosque': { en: 'University Mosque', fr: 'Mosquée Universitaire', ar: 'مسجد جامعي' },
  'Local Mosque': { en: 'Local Mosque', fr: 'Mosquée de Quartier', ar: 'مسجد محلي' },
  'Nearest Mosques': { en: 'Nearest Mosques', fr: 'Mosquées les plus proches', ar: 'أقرب المساجد' },
  'Location access is required to find nearest mosques.': { en: 'Location access is required to find nearest mosques.', fr: 'L\'accès à la position est requis pour trouver les mosquées les plus proches.', ar: 'الوصول إلى الموقع مطلوب للعثور على أقرب المساجد.' },
  'No mosques found.': { en: 'No mosques found.', fr: 'Aucune mosquée trouvée.', ar: 'لم يتم العثور على مساجد.' },
  'Directions': { en: 'Directions', fr: 'Itinéraire', ar: 'الاتجاهات' },
  'Clear': { en: 'Clear', fr: 'Effacer', ar: 'مسح' },
  'Clear Route': { en: 'Clear Route', fr: 'Effacer l\'itinéraire', ar: 'مسح المسار' },
  'Calculating...': { en: 'Calculating...', fr: 'Calcul en cours...', ar: 'جاري الحساب...' },
  'Start': { en: 'Start', fr: 'Démarrer', ar: 'ابدأ' },
  'Google Maps': { en: 'Google Maps', fr: 'Google Maps', ar: 'خرائط جوجل' },
  'Location': { en: 'Location', fr: 'Position', ar: 'الموقع' },
  'Position': { en: 'Position', fr: 'Position', ar: 'الموقع' },
  'Copied': { en: 'Copied', fr: 'Copié', ar: 'تم النسخ' },
  'Street Mode': { en: 'Street Mode', fr: 'Mode Rue', ar: 'وضع الشارع' },
  'Satellite Mode': { en: 'Satellite Mode', fr: 'Mode Satellite', ar: 'وضع القمر الصناعي' },
  'Terrain Mode': { en: 'Terrain Mode', fr: 'Mode Terrain', ar: 'وضع التضاريس' },
  'Road': { en: 'Road', fr: 'Route', ar: 'طريق' },
  'Walking': { en: 'Walking', fr: 'À pied', ar: 'مشي' },
  'Driving': { en: 'Driving', fr: 'En voiture', ar: 'قيادة' },
  'Your Location': { en: 'Your Location', fr: 'Votre position', ar: 'موقعك' },
  'Share': { en: 'Share', fr: 'Partager', ar: 'مشاركة' },
  'View Full Details': { en: 'View Full Details', fr: 'Voir les détails complets', ar: 'عرض التفاصيل الكاملة' },
  'Nearby Mosques': { en: 'Nearby Mosques', fr: 'Mosquées à proximité', ar: 'مساجد قريبة' },
  'Commune': { en: 'Commune', fr: 'Commune', ar: 'الجماعة' },
  'Location Details': { en: 'Location Details', fr: 'Détails de l\'emplacement', ar: 'تفاصيل الموقع' },
  'Address': { en: 'Address', fr: 'Adresse', ar: 'العنوان' },
  'Capacity & Space': { en: 'Capacity & Space', fr: 'Capacité et Espace', ar: 'السعة والمساحة' },
  'Prayer Areas': { en: 'Prayer Areas', fr: 'Espaces de Prière', ar: 'أماكن الصلاة' },
  'Sanitary Facilities': { en: 'Sanitary Facilities', fr: 'Installations Sanitaires', ar: 'المرافق الصحية' },
  'Staff & Housing': { en: 'Staff & Housing', fr: 'Personnel et Logement', ar: 'الموظفون والسكن' },
  'General Information': { en: 'General Information', fr: 'Informations Générales', ar: 'معلومات عامة' },
  'Land Information': { en: 'Land Information', fr: 'Informations Terrain', ar: 'معلومات القطعة الأرضية' },
  'Construction Information': { en: 'Construction Information', fr: 'Informations Construction', ar: 'معلومات البناء' },
  'Services Information': { en: 'Services Information', fr: 'Services & Réseaux', ar: 'معلومات الخدمات' },
  'Mosque Components': { en: 'Mosque Components', fr: 'Composants de la Mosquée', ar: 'مكونات المسجد' },
  'Revenue Assets': { en: 'Revenue Assets', fr: 'Ambiance Commerciale', ar: 'معلومات الأملاك ذات العائد' },
  
  // Fields
  'Mosque Code': { en: 'Mosque Code', fr: 'Code Mosquée', ar: 'رمز المسجد' },
  'Spending Entity': { en: 'Spending Entity', fr: 'Gestionnaire', ar: 'جهة الإنفاق' },
  'Nature': { en: 'Nature', fr: 'Nature', ar: 'nature' },
  'Build Date': { en: 'Build Date', fr: 'Date de Construction', ar: 'تاريخ البناء' },
  'Building Condition': { en: 'Building Condition', fr: 'État du bâtiment', ar: 'حالة البناية' },
  'Land Area': { en: 'Land Area', fr: 'Surface Terrain', ar: 'مساحة القطعة الأرضية' },
  'Built Area': { en: 'Built Area', fr: 'Surface Bâtie', ar: 'المساحة المبنية' },
  'Unbuilt Area': { en: 'Unbuilt Area', fr: 'Surface Non Bâtie', ar: 'غير المبنية: المساحة' },
  'Developed Unbuilt Area': { en: 'Developed Unbuilt Area', fr: 'Surface Non Bâtie Aménagée', ar: 'غير المبنية: المساحة المهيأة' },
  'Undeveloped Unbuilt Area': { en: 'Undeveloped Unbuilt Area', fr: 'Surface Non Bâtie Non Aménagée', ar: 'غير المبنية: المساحة غير المهيأة' },
  'Topographic': { en: 'Topographic', fr: 'Topographie', ar: 'topogaphique' },
  'Slopes Presence': { en: 'Slopes Presence', fr: 'Existence de talus', ar: 'existance de talus' },
  'Water Gutter Presence': { en: 'Water Gutter Presence', fr: 'Existence de rigoles', ar: 'existance de rigoles d\'eau' },
  'Ravin': { en: 'Ravin', fr: 'Ravin', ar: 'ravin' },
  'Thermal Zone': { en: 'Thermal Zone', fr: 'Zone Thermique', ar: 'zone_thermique' },
  'Construction Type': { en: 'Construction Type', fr: 'Type de Construction', ar: 'نوع اليناء' },
  'Reinforced Concrete': { en: 'Reinforced Concrete', fr: 'Béton Armé', ar: 'béton_armé' },
  'Adobe Earth': { en: 'Adobe Earth', fr: 'Terre Adobe', ar: 'construction_en_terre_adobe' },
  'Pisé Earth': { en: 'Pisé Earth', fr: 'Terre Pisé', ar: 'construction_en_terre_pisé' },
  'Stone': { en: 'Stone', fr: 'Pierre', ar: 'msq_mat_pierre' },
  'Traditional Brick': { en: 'Traditional Brick', fr: 'Brique Traditionnelle', ar: 'brique_traditionnel' },
  'Wooden Sheet': { en: 'Wooden Sheet', fr: 'Tôle en Bois', ar: 'tôle_en_bois' },
  'Metal Sheet': { en: 'Metal Sheet', fr: 'Tôle Métallique', ar: 'tôle_métallique' },
  'Access Points Count': { en: 'Access Points Count', fr: 'Nombre d\'accès', ar: 'nombre_d_accès_à_la_mosquée' },
  'Road Network': { en: 'Road Network', fr: 'Réseau Routier', ar: 'réseau_routier' },
  'Drivable Track': { en: 'Drivable Track', fr: 'Piste Carrossable', ar: 'piste_carossable' },
  'Non-Drivable Track': { en: 'Non-Drivable Track', fr: 'Piste Non Carrossable', ar: 'piste_non_carossable' },
  'Handicap Access': { en: 'Handicap Access', fr: 'Accès Handicapé', ar: 'accessibilité_handicapé' },
  'Drinking Water Network': { en: 'Drinking Water Network', fr: 'Réseau Eau Potable', ar: 'branché_au_réseau_d_eau_potable' },
  'Cluster by Commune': { en: 'Cluster by Commune', fr: 'Regrouper par Commune', ar: 'تجميع حسب الجماعة' },
  'Color by Prayer Type': { en: 'Color by Prayer Type', fr: 'Couleur par Type de Prière', ar: 'تلوين حسب نوع الصلاة' },
  'Map Tools': { en: 'Map Tools', fr: 'Outils de Carte', ar: 'أدوات الخريطة' },
  'Friday Mosque': { en: 'Friday Mosque', fr: 'Mosquée de Vendredi', ar: 'مسجد الجمعة (جامع)' },
  '5 Prayers': { en: '5 Prayers', fr: '5 Prières', ar: 'مسجد خمس أوقات' },
  'Zawiya / Shrine': { en: 'Zawiya / Shrine', fr: 'Zaouïa / Mausolée', ar: 'زاوية / ضريح' },
  'Default Mosque': { en: 'Other Mosque', fr: 'Autre Mosquée', ar: 'مسجد آخر' },
  'Well': { en: 'Well', fr: 'Puits', ar: 'puits' },
  'Sources': { en: 'Sources', fr: 'Sources', ar: 'sources' },
  'Electricity Network': { en: 'Electricity Network', fr: 'Réseau Électricité', ar: 'branché_au_réseau_d_électricité' },
  'Photovoltaic': { en: 'Photovoltaic', fr: 'Photovoltaïque', ar: 'photovoltaïque' },
  'Traditional': { en: 'Traditional', fr: 'Traditionnel', ar: 'traditionnel' },
  'Sanitation Network': { en: 'Sanitation Network', fr: 'Réseau Assainissement', ar: 'branché_au_réseau_d_assainissement' },
  'Septic Tank': { en: 'Septic Tank', fr: 'Fosse Septique', ar: 'fosse_septique_puits_perdu' },
  'Maqasoura Area': { en: 'Maqasoura Area', fr: 'Surface Maqasoura', ar: 'مساحة المقصورة' },
  'Men Hall Count': { en: 'Men Hall Count', fr: 'Nombre Salle Hommes', ar: 'عدد قاعة الصلاة للرجال' },
  'Men Hall Area': { en: 'Men Hall Area', fr: 'Surface Salle Hommes', ar: 'مساحة قاعة الصلاة للرجال' },
  'Women Hall Count': { en: 'Women Hall Count', fr: 'Nombre Salle Femmes', ar: 'عدد قاعة الصلاة للنساء' },
  'Women Hall Area': { en: 'Women Hall Area', fr: 'Surface Salle Femmes', ar: 'مساحة قاعة الصلاة للنساء' },
  'Men Toilets Count': { en: 'Men Toilets Count', fr: 'Nombre WC Hommes', ar: 'عدد مراحيض الرجال' },
  'Men Toilets Area': { en: 'Men Toilets Area', fr: 'Surface WC Hommes', ar: 'مساحة مراحيض الرجال' },
  'Women Toilets Count': { en: 'Women Toilets Count', fr: 'Nombre WC Femmes', ar: 'عدد مراحيض للنساء' },
  'Women Toilets Area': { en: 'Women Toilets Area', fr: 'Surface WC Femmes', ar: 'مساحة مراحيض للنساء' },
  'Minaret Height': { en: 'Minaret Height', fr: 'Hauteur Minaret', ar: 'ارتفاع الصومعة' },
  'Minaret Floors': { en: 'Minaret Floors', fr: 'Étages Minaret', ar: 'عدد طبقات الصومعة' },
  'Minaret Base': { en: 'Minaret Base', fr: 'Base Minaret', ar: 'قاعدة الصومعة' },
  'Imam Housing Count': { en: 'Imam Housing Count', fr: 'Nombre Logement Imam', ar: 'عدد سكن الامام' },
  'Imam Housing Area': { en: 'Imam Housing Area', fr: 'Surface Logement Imam', ar: 'مساحة سكن الإمام' },
  'Muezzin Housing Count': { en: 'Muezzin Housing Count', fr: 'Nombre Logement Muezzin', ar: 'عدد سكن المؤذن' },
  'Muezzin Housing Area': { en: 'Muezzin Housing Area', fr: 'Surface Logement Muezzin', ar: 'مساحة سكن المؤذن' },
  'Storage Count': { en: 'Storage Count', fr: 'Nombre Magasin', ar: 'عدد المخزن' },
  'Storage Area': { en: 'Storage Area', fr: 'Surface Magasin', ar: 'مساحة المخزن' },
  'Msid Count': { en: 'Msid Count', fr: 'Nombre Msid', ar: 'عدد المسيد' },
  'Msid Area': { en: 'Msid Area', fr: 'Surface Msid', ar: 'مساحة المسيد' },
  'Quranic School Count': { en: 'Quranic School Count', fr: 'Nombre École Coranique', ar: 'عدد الكتاب القرآني القرآنية' },
  'Quranic School Area': { en: 'Quranic School Area', fr: 'Surface École Coranique', ar: 'مساحة الكتاب القرآني القرآنية' },
  'School Count': { en: 'School Count', fr: 'Nombre École', ar: 'عدد المدرسة' },
  'School Area': { en: 'School Area', fr: 'Surface École', ar: 'مساحة المدرسة' },
  'Meeting Room Count': { en: 'Meeting Room Count', fr: 'Nombre Salle Réunion', ar: 'عدد قاعة الاجتماعات' },
  'Meeting Room Area': { en: 'Meeting Room Area', fr: 'Surface Salle Réunion', ar: 'مساحة قاعة الاجتماعات' },
  'Patio Count': { en: 'Patio Count', fr: 'Nombre Sahn', ar: 'عدد الصحن' },
  'Patio Area': { en: 'Patio Area', fr: 'Surface Sahn', ar: 'مساحة الصحن' },
  'Gallery Count': { en: 'Gallery Count', fr: 'Nombre Arwaqa', ar: 'عدد الأروقة' },
  'Gallery Area': { en: 'Gallery Area', fr: 'Surface Arwaqa', ar: 'مساحة الأروقة' },
  'Imam Room Count': { en: 'Imam Room Count', fr: 'Nombre Chambre Imam', ar: 'عدد غرفة الامام' },
  'Imam Room Area': { en: 'Imam Room Area', fr: 'Surface Chambre Imam', ar: 'مساحة غرفة الامام' },
  'Muezzin Room Count': { en: 'Muezzin Room Count', fr: 'Nombre Chambre Muezzin', ar: 'عدد غرفة المؤذن' },
  'Muezzin Room Area': { en: 'Muezzin Room Area', fr: 'Surface Chambre المؤذن', ar: 'مساحة غرفة المؤذن' },
  'Timer Room Count': { en: 'Timer Room Count', fr: 'Nombre Chambre Mouaqqit', ar: 'عدد غرفة المؤقت' },
  'Timer Room Area': { en: 'Timer Room Area', fr: 'Surface Chambre Mouaqqit', ar: 'مساحة غرفة المؤقت' },
  'Mortuary Count': { en: 'Mortuary Count', fr: 'Nombre Chambre Mortuaire', ar: 'عدد غرفة الموتى' },
  'Mortuary Area': { en: 'Mortuary Area', fr: 'Surface Chambre Mortuaire', ar: 'مساحة غرفة الموتى' },
  'Commercial Shops Count': { en: 'Commercial Shops Count', fr: 'Nombre Boutiques', ar: 'عدد محلات تجارية' },
  'Commercial Area': { en: 'Commercial Area', fr: 'Surface Boutiques', ar: 'مساحة محلات تجارية' },
  'Housing Rental Count': { en: 'Housing Rental Count', fr: 'Nombre Logements Cents', ar: 'عدد سكن' },
  'Housing Area': { en: 'Housing Area', fr: 'Surface Logements', ar: 'مساحة سكن' },
  
  // Specific literal matches for Excel keys from attachment
  'اسم المسجد': { en: 'Mosque Name', fr: 'Nom de la Mosquée', ar: 'اسم المسجد' },
  'رمز المسجد': { en: 'Mosque Code', fr: 'Code de la Mosquée', ar: 'رمز المسجد' },
  'عنوان المسجد': { en: 'Address', fr: 'Adresse', ar: 'عنوان المسجد' },
  'الجماعة': { en: 'Commune', fr: 'Commune', ar: 'الجماعة' },
  'جهة الإنفاق': { en: 'Spending Authority', fr: 'Autorité de dépense', ar: 'جهة الإنفاق' },
  'تاريخ البناء': { en: 'Build Date', fr: 'Date de construction', ar: 'تاريخ البناء' },
  'حالة البناية': { en: 'Building Condition', fr: 'État du bâtiment', ar: 'حالة البناية' },
  'مساحة القطعة الأرضية': { en: 'Plot Area', fr: 'Surface de la parcelle', ar: 'مساحة القطعة الأرضية' },
  'المساحة المبنية': { en: 'Built Area', fr: 'Surface bâtie', ar: 'المساحة المبنية' },
  'غير المبنية: المساحة': { en: 'Unbuilt Area', fr: 'Surface non bâtie', ar: 'غير المبنية: المساحة' },
  'مساحة المقصورة': { en: 'Maqasoura Area', fr: 'Surface Maqasoura', ar: 'مساحة المقصورة' },
  'عدد قاعة الصلاة للرجال': { en: 'Men Prayer Hall Count', fr: 'Nombre salles hommes', ar: 'عدد قاعة الصلاة للرجال' },
  'مساحة قاعة الصلاة للرجال': { en: 'Men Prayer Hall Area', fr: 'Surface salles hommes', ar: 'مساحة قاعة الصلاة للرجال' },
  'عدد قاعة الصلاة للنساء': { en: 'Women Prayer Hall Count', fr: 'Nombre salles femmes', ar: 'عدد قاعة الصلاة للنساء' },
  'مساحة قاعة الصلاة للنساء': { en: 'Women Prayer Hall Area', fr: 'Surface salles femmes', ar: 'مساحة قاعة الصلاة للنساء' },
  'عدد مراحيض الرجال': { en: 'Men Toilets Count', fr: 'Nombre WC hommes', ar: 'عدد مراحيض الرجال' },
  'مساحة مراحيض الرجال': { en: 'Men Toilets Area', fr: 'Surface WC hommes', ar: 'مساحة مراحيض الرجال' },
  'عدد مراحيض للنساء': { en: 'Women Toilets Count', fr: 'Nombre WC femmes', ar: 'عدد مراحيض للنساء' },
  'مساحة مراحيض للنساء': { en: 'Women Toilets Area', fr: 'Surface WC femmes', ar: 'مساحة مراحيض للنساء' },
  'ارتفاع الصومعة': { en: 'Minaret Height', fr: 'Hauteur minaret', ar: 'ارتفاع الصومعة' },
  'عدد طبقات الصومعة': { en: 'Minaret Floors', fr: 'Étages minaret', ar: 'عدد طبقات الصومعة' },
  'قاعدة الصومعة': { en: 'Minaret Base', fr: 'Base minaret', ar: 'قاعدة الصومعة' },
  'عدد سكن الامام': { en: 'Imam Housing Count', fr: 'Nombre logements imam', ar: 'عدد سكن الامام' },
  'مساحة سكن الإمام': { en: 'Imam Housing Area', fr: 'Surface logements imam', ar: 'مساحة سكن الإمام' },
  'عدد محلات تجارية': { en: 'Shops Count', fr: 'Nombre boutiques', ar: 'عدد محلات تجارية' },
  'مساحة محلات تجارية': { en: 'Shops Area', fr: 'Surface boutiques', ar: 'مساحة محلات تجارية' },
  'عدد سكن': { en: 'Housing Count', fr: 'Nombre logements', ar: 'عدد سكن' },
  'مساحة سكن': { en: 'Housing Area', fr: 'Surface logements', ar: 'مساحة سكن' },
  'Key Highlights': { en: 'Key Highlights', fr: 'Points Forts', ar: 'أبرز النقاط' },
  'Capacity': { en: 'Capacity', fr: 'Capacité', ar: 'السعة' },
  'Surface': { en: 'Surface', fr: 'Surface', ar: 'المساحة' },
  'Condition': { en: 'Condition', fr: 'État', ar: 'الحالة' },
  'Built Year': { en: 'Built Year', fr: 'Construit en', ar: 'سنة البناء' },
  'Map Settings': { en: 'Map Settings', fr: 'Paramètres de la carte', ar: 'إعدادات الخريطة' },
  'Filter by Commune': { en: 'Filter by Commune', fr: 'Filtrer par commune', ar: 'تصفية حسب الجماعة' },
  'Select Commune': { en: 'Select Commune', fr: 'Sélectionner une commune', ar: 'اختر الجماعة' },
  'None': { en: 'None', fr: 'Aucun', ar: 'لا شيء' },
  'Only mosques in': { en: 'Only mosques in', fr: 'Seules les mosquées de', ar: 'فقط المساجد في' },
  'will be shown on the map.': { en: 'will be shown on the map.', fr: 'seront affichées sur la carte.', ar: 'ستظهر على الخريطة.' },
  'Reset App': { en: 'Reset App', fr: 'Réinitialiser l\'application', ar: 'إعادة ضبط التطبيق' },
  'Reset': { en: 'Reset', fr: 'Réinitialiser', ar: 'إعادة ضبط' },
  'Delete all data and reset the application?': { en: 'Delete all data and reset the application?', fr: 'Supprimer toutes les données et réinitialiser l\'application ?', ar: 'حذف جميع البيانات وإعادة ضبط التطبيق؟' },
  'This action cannot be undone.': { en: 'This action cannot be undone.', fr: 'Cette action est irréversible.', ar: 'هذا الإجراء لا يمكن التراجع عنه.' },
  'Reset Successful': { en: 'Reset Successful', fr: 'Réinitialisation réussie', ar: 'تمت إعادة الضبط بنجاح' },
  'AI Configuration': { en: 'AI Configuration', fr: 'Configuration AI', ar: 'إعداد الذكاء الاصطناعي' },
  'Personal API Key': { en: 'Personal API Key', fr: 'Clé API personnelle', ar: 'مفتاح API الخاص' },
  'If the AI features fail on your phone, paste your Gemini API Key here. It will be saved locally in this browser.': { 
    en: 'If the AI features fail on your phone, paste your Gemini API Key here. It will be saved locally in this browser.', 
    fr: 'Si les fonctionnalités AI échouent sur votre téléphone, collez votre clé API Gemini ici. Elle sera enregistrée localement dans ce navigateur.', 
    ar: 'إذا فشلت ميزات الذكاء الاصطناعي على هاتفك، فقم بلصق مفتاح Gemini API هنا. وسيتم حفظه محليًا في هذا المتصفح.' 
  },
  'Save API Key': { en: 'Save API Key', fr: 'Enregistrer la clé API', ar: 'حفظ مفتاح API' },
  'API Key saved to local storage.': { en: 'API Key saved to local storage.', fr: 'Clé API enregistrée localement.', ar: 'تم حفظ مفتاح API في التخزين المحلي.' },
  'API Key removed.': { en: 'API Key removed.', fr: 'Clé API supprimée.', ar: 'تمت إزالة مفتاح API.' },
  'Saved': { en: 'Saved', fr: 'Enregistré', ar: 'تم الحفظ' },
  'Click Save to apply changes': { en: 'Click Save to apply changes', fr: 'Cliquez sur Enregistrer pour appliquer les modifications', ar: 'انقر فوق حفظ لتطبيق التغييرات' },
  'AI Search': { en: 'AI Search', fr: 'Recherche AI', ar: 'البحث بالذكاء الاصطناعي' },
  'Smart AI Matches': { en: 'Smart AI Matches', fr: 'Matchs AI intelligents', ar: 'مطابقات الذكاء الاصطناعي الذكية' },
  'Regional Insight': { en: 'Regional Insight', fr: 'Aperçu régional', ar: 'نظرة إقليمية' },
  'Showing nearby results (AI processing offline)': { en: 'Showing nearby results (AI processing offline)', fr: 'Affichage des résultats à proximité (traitement AI hors ligne)', ar: 'عرض النتائج القريبة (معالجة الذكاء الاصطناعي غير متصلة)' },
  'Data Points': { en: 'Data Points', fr: 'Points de données', ar: 'نقاط البيانات' },
  'Identity': { en: 'Identity', fr: 'Identité', ar: 'الهوية' },
  'Structure': { en: 'Structure', fr: 'Structure', ar: 'البنية' },
  'Economy': { en: 'Economy', fr: 'Économie', ar: 'الاقتصاد' },
  'Occupancy Rate': { en: 'Occupancy Rate', fr: 'Taux d\'occupation', ar: 'نسبة الإشغال' },
  'Built': { en: 'Built', fr: 'Bâti', ar: 'مبني' },
  'Total': { en: 'Total', fr: 'Total', ar: 'إجمالي' },
  'Built vs Total Space': { en: 'Built vs Total Space', fr: 'Espace Bâti vs Total', ar: 'المساحة المبنية مقابل المساحة الإجمالية' },
  'Technical inventory tracking': { en: 'Technical inventory tracking', fr: 'Suivi de l\'inventaire technique', ar: 'تتبع المخزون التقني' },
  'Optimize Route': { en: 'Optimize Route', fr: 'Optimiser l\'itinéraire', ar: 'تحسين المسار' },
  'Clear Optimized Route': { en: 'Clear Optimized Route', fr: 'Effacer l\'itinéraire optimisé', ar: 'مسح المسار المحسن' },
  'Start Tour': { en: 'Start Tour', fr: 'Commencer la tournée', ar: 'بدء الجولة' },

  'Downloaded': { en: 'Downloaded', fr: 'Téléchargé', ar: 'تم التحميل' },
  'Available for Download': { en: 'Available for Download', fr: 'Disponible au téléchargement', ar: 'متاح للتحميل' },
  'Manage your offline data by region or commune.': { en: 'Manage your offline data by region or commune.', fr: 'Gérez vos données hors ligne par région ou commune.', ar: 'إدارة بياناتك بدون اتصال حسب الجهة أو الجماعة.' },
  'Download data for': { en: 'Download data for', fr: 'Télécharger les données pour', ar: 'تحميل البيانات لـ' },
  'Removing data for': { en: 'Removing data for', fr: 'Suppression des données pour', ar: 'جاري حذف البيانات لـ' },
  'All data for this region is available offline.': { en: 'All data for this region is available offline.', fr: 'Toutes les données de cette région sont disponibles hors ligne.', ar: 'جميع بيانات هذه المنطقة متاحة بدون اتصال.' },
  'Offline': { en: 'Offline', fr: 'Hors ligne', ar: 'بدون اتصال' },
  'Online': { en: 'Online', fr: 'En ligne', ar: 'متصل' },
  'Size': { en: 'Size', fr: 'Taille', ar: 'الحجم' },
  'KB': { en: 'KB', fr: 'Ko', ar: 'ك.ب' },
  'MB': { en: 'MB', fr: 'Mo', ar: 'م.ب' },
  'AI Intelligence & Memory': { en: 'AI Intelligence & Memory', fr: 'Intelligence AI & Mémoire', ar: 'ذكاء اصطناعي وذاكرة' },
  'نوع اليناء': { en: 'Construction Type', fr: 'Type de construction', ar: 'نوع اليناء' },

  // Common Data Keys & Values (from Excel)
  'Mosques': { en: 'Mosques', fr: 'Mosquées', ar: 'مساجد' },
  'Cancel': { en: 'Cancel', fr: 'Annuler', ar: 'إلغاء' },
  'Map Legend': { en: 'Map Legend', fr: 'Légende de la carte', ar: 'مفتاح الخريطة' },
  'User Location': { en: 'User Location', fr: 'Votre position', ar: 'موقعك' },
  'Destination': { en: 'Destination', fr: 'Destination', ar: 'الوجهة' },
  'Walking Route': { en: 'Walking Route', fr: 'Itinéraire à pied', ar: 'مسار مشي' },
  'Driving Route': { en: 'Driving Route', fr: 'Itinéraire en voiture', ar: 'مسار قيادة' },
  'Edit Items': { en: 'Edit Items', fr: 'Modifier les éléments', ar: 'تعديل العناصر' },
  'Add Item': { en: 'Add Item', fr: 'Ajouter un élément', ar: 'إضافة عنصر' },
  'Item Name': { en: 'Item Name', fr: 'Nom de l\'élément', ar: 'اسم العنصر' },
  'Delete Item': { en: 'Delete Item', fr: 'Supprimer l\'élément', ar: 'حذف العنصر' },
  'No items added yet': { en: 'No items added yet', fr: 'Aucun élément ajouté pour le moment', ar: 'لم يتم إضافة أي عناصر بعد' },
  'Enter item name...': { en: 'Enter item name...', fr: 'Entrez le nom de l\'élément...', ar: 'أدخل اسم العنصر...' },
  'Close': { en: 'Close', fr: 'Fermer', ar: 'إغلاق' },
  'Equipment': { en: 'Equipment', fr: 'Équipement', ar: 'التجهيزات' },
  'Search equipment...': { en: 'Search equipment...', fr: 'Rechercher un équipement...', ar: 'بحث عن التجهيزات...' },
  'Add new equipment...': { en: 'Add new equipment...', fr: 'Ajouter un nouvel équipement...', ar: 'إضافة تجهيزات جديدة...' },
  'Items': { en: 'Items', fr: 'Éléments', ar: 'عناصر' },
  'No equipment found': { en: 'No equipment found', fr: 'Aucun équipement trouvé', ar: 'لم يتم العثور على تجهيزات' },
  'Try a different search term': { en: 'Try a different search term', fr: 'Essayez un autre terme de recherche', ar: 'حاول استخدام مصطلح بحث آخر' },
  'Start by adding your first item above': { en: 'Start by adding your first item above', fr: 'Commencez par ajouter votre premier élément ci-dessus', ar: 'ابدأ بإضافة أول عنصر أعلاه' },
  'Manage Equipment': { en: 'Manage Equipment', fr: 'Gérer l\'équipement', ar: 'إدارة التجهيزات' },
  'Offline Data': { en: 'Offline Data', fr: 'Données hors ligne', ar: 'البيانات بدون اتصال' },
  'Download Manager': { en: 'Download Manager', fr: 'Gestionnaire de téléchargement', ar: 'مدير التحميل' },
  'Download': { en: 'Download', fr: 'Télécharger', ar: 'تحميل' },

  // Strict Categories Literal Matches
  'mhai': { en: 'MHAI', fr: 'MHAI', ar: 'mhai' },
  'association': { en: 'Association', fr: 'Association', ar: 'جمعية' },
  'comité_de_quartier': { en: 'Neighborhood Committee', fr: 'Comité de quartier', ar: 'لجنة الحي' },
  'bienfaiteurs': { en: 'Benefactors', fr: 'Bienfaiteurs', ar: 'محسنون' },
  'autre': { en: 'Other', fr: 'Autre', ar: 'آخر' },
  'ouverture': { en: 'Opening', fr: 'Ouverture', ar: 'افتتاح' },
  'topogaphique': { en: 'Topographic', fr: 'Topographique', ar: 'طبغرافي' },
  'existance de talus': { en: 'Existence of Slopes', fr: 'Existence de talus', ar: 'وجود انحدار' },
  'existance de rigoles d\'eau': { en: 'Existence of Water Channels', fr: 'Existence de rigoles d\'eau', ar: 'وجود سواقي' },
  'ter_gmp_autre': { en: 'Other Land Info', fr: 'Autre info terrain', ar: 'معلومات أرضية أخرى' },
  'zone_thermique': { en: 'Thermal Zone', fr: 'Zone thermique', ar: 'المنطقة الحرارية' },
  'béton_armé': { en: 'Reinforced Concrete', fr: 'Béton armé', ar: 'خرسانة مسلحة' },
  'construction_en_terre_adobe': { en: 'Adobe Earth Construction', fr: 'Construction en terre adobe', ar: 'بناء بتراب أدوبي' },
  'construction_en_terre_pisé': { en: 'Pisé Earth Construction', fr: 'Construction en terre pisé', ar: 'بناء بتراب بيزي' },
  'msq_mat_pierre': { en: 'Stone Material', fr: 'Matériel en pierre', ar: 'مادة حجرية' },
  'brique_traditionnel': { en: 'Traditional Brick', fr: 'Brique traditionnelle', ar: 'ياجور تقليدي' },
  'tôle_en_bois': { en: 'Wooden Sheet', fr: 'Tôle en bois', ar: 'توب خشبي' },
  'tôle_métallique': { en: 'Metal Sheet', fr: 'Tôle métallique', ar: 'توب معدني' },
  'nombre_d_accès_à_la_mosquée': { en: 'Number of Accesses', fr: 'Nombre d\'accès', ar: 'عدد الولوجيات' },
  'réseau_routier': { en: 'Road Network', fr: 'Réseau routier', ar: 'شبكة طرقية' },
  'piste_carossable': { en: 'Drivable Track', fr: 'Piste carrossable', ar: 'مسلك للعربات' },
  'piste_non_carossable': { en: 'Non-Drivable Track', fr: 'Piste non carrossable', ar: 'مسلك غير صالح للعربات' },
  'accessibilité_handicapé': { en: 'Handicap Accessibility', fr: 'Accessibilité handicapé', ar: 'ولوجيات ذوي الاحتياجات' },
  'branché_au_réseau_d_eau_potable': { en: 'Connected to Water Network', fr: 'Branché au réseau d\'eau', ar: 'شبكة الماء' },
  'branché_au_réseau_d_electricityé': { en: 'Connected to Electricity', fr: 'Branché au réseau électrique', ar: 'شبكة الكهرباء' },
  'branché_au_réseau_d_assainissement': { en: 'Connected to Sanitation', fr: 'Branché au réseau d\'assainissement', ar: 'شبكة التطهير' },
  'fosse_septique_puits_perdu': { en: 'Septic Tank', fr: 'Fosse septique', ar: 'حفرة صحية' },

  // Common Data Keys & Values (from Excel)
  'salle de prière hommes': { en: 'Men\'s prayer room', fr: 'Salle de prière hommes', ar: 'قاعة صلاة الرجال' },
  'salle de prière femmes': { en: 'Women\'s prayer room', fr: 'Salle de prière femmes', ar: 'قاعة صلاة النساء' },
  'sanitaires': { en: 'Restrooms', fr: 'Sanitaires', ar: 'مرافق صحية' },
  'woudou': { en: 'Ablution area', fr: 'Lieu d\'ablution', ar: 'مكان الوضوء' },
  'logement imam': { en: 'Imam\'s housing', fr: 'Logement imam', ar: 'سكن الإمام' },
  'logement muezzin': { en: 'Muezzin\'s housing', fr: 'Logement muezzin', ar: 'سكن المؤذن' },
  'salle de prière': { en: 'Prayer room', fr: 'Salle de prière', ar: 'قاعة الصلاة' },
  'capacité': { en: 'Capacity', fr: 'Capacité', ar: 'السعة' },
  'surface': { en: 'Surface', fr: 'Surface', ar: 'المساحة' },
  'nombre': { en: 'Count', fr: 'Nombre', ar: 'العدد' },
  'mosquée': { en: 'Mosque', fr: 'Mosquée', ar: 'مسجد' },
  'zaouia': { en: 'Zaouia', fr: 'Zaouia', ar: 'زاوية' },
  'lieu de prière': { en: 'Prayer place', fr: 'Lieu de prière', ar: 'مصلى' },
  'urbain': { en: 'Urban', fr: 'Urbain', ar: 'حضري' },
  'rural': { en: 'Rural', fr: 'Rural', ar: 'قروي' },
  'oui': { en: 'Yes', fr: 'Oui', ar: 'نعم' },
  'non': { en: 'No', fr: 'Non', ar: 'لا' },
  'etat': { en: 'Condition', fr: 'Etat', ar: 'الحالة' },
  'bon': { en: 'Good', fr: 'Bon', ar: 'جيد' },
  'moyen': { en: 'Average', fr: 'Moyen', ar: 'متوسط' },
  'mauvais': { en: 'Bad', fr: 'Mauvais', ar: 'سيء' },
  'en construction': { en: 'Under construction', fr: 'En construction', ar: 'قيد الإنشاء' },
  'fermé': { en: 'Closed', fr: 'Fermé', ar: 'مغلق' },
  'ouvert': { en: 'Open', fr: 'Ouvert', ar: 'مفتوح' },
};

export function t(key: string, lang: Language): string {
  if (!key) return '';
  
  const cleanKey = key.trim();
  const lowerKey = cleanKey.toLowerCase();
  
  // Check dynamic translations first
  const dynamicTranslations = useAppStore.getState().dynamicTranslations;
  if (dynamicTranslations) {
    if (dynamicTranslations[cleanKey] && dynamicTranslations[cleanKey][lang]) {
      return dynamicTranslations[cleanKey][lang];
    }
    for (const dictKey in dynamicTranslations) {
      if (dictKey.toLowerCase() === lowerKey && dynamicTranslations[dictKey][lang]) {
        return dynamicTranslations[dictKey][lang];
      }
    }
  }

  // Direct match
  if (dictionary[cleanKey] && dictionary[cleanKey][lang]) {
    return dictionary[cleanKey][lang];
  }
  
  // Case-insensitive match for data keys
  for (const dictKey in dictionary) {
    if (dictKey.toLowerCase() === lowerKey) {
      return dictionary[dictKey][lang];
    }
  }

  // Handle combined keys like "Nombre salle de prière hommes" or "salle de prière hommes N=..., S=..."
  if (lang === 'ar') {
    let translated = cleanKey;
    
    // Replace known parts
    translated = translated.replace(/Nombre/gi, 'عدد');
    translated = translated.replace(/Surface/gi, 'مساحة');
    translated = translated.replace(/salle de prière hommes/gi, 'قاعة صلاة الرجال');
    translated = translated.replace(/salle de prière femmes/gi, 'قاعة صلاة النساء');
    translated = translated.replace(/salle de prière/gi, 'قاعة الصلاة');
    translated = translated.replace(/sanitaires/gi, 'مرافق صحية');
    translated = translated.replace(/logement imam/gi, 'سكن الإمام');
    translated = translated.replace(/logement muezzin/gi, 'سكن المؤذن');
    translated = translated.replace(/woudou/gi, 'مكان الوضوء');
    translated = translated.replace(/N=/g, 'العدد=');
    translated = translated.replace(/S=/g, 'المساحة=');
    
    return translated;
  }

  if (lang === 'en') {
    let translated = cleanKey;
    
    // Replace known parts
    translated = translated.replace(/Nombre/gi, 'Count');
    translated = translated.replace(/Surface/gi, 'Surface');
    translated = translated.replace(/salle de prière hommes/gi, 'Men\'s prayer room');
    translated = translated.replace(/salle de prière femmes/gi, 'Women\'s prayer room');
    translated = translated.replace(/salle de prière/gi, 'Prayer room');
    translated = translated.replace(/sanitaires/gi, 'Restrooms');
    translated = translated.replace(/logement imam/gi, 'Imam\'s housing');
    translated = translated.replace(/logement muezzin/gi, 'Muezzin\'s housing');
    translated = translated.replace(/woudou/gi, 'Ablution area');
    translated = translated.replace(/N=/g, 'Count=');
    translated = translated.replace(/S=/g, 'Surface=');
    
    return translated;
  }

  return cleanKey;
}

export function getLocalizedName(mosque: any, lang: Language): string {
  if (lang === 'ar' && mosque.name_ar) return mosque.name_ar;
  if (lang === 'fr' && mosque.name_fr) return mosque.name_fr;
  if (lang === 'en' && mosque.name_en) return mosque.name_en;
  return mosque.name;
}
