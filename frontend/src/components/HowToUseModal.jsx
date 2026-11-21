import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Car, 
  Zap, 
  HelpCircle, 
  X, 
  ShieldCheck, 
  DollarSign, 
  ArrowRight, 
  Globe, 
  CheckCircle2, 
  Maximize2 
} from 'lucide-react';
import { HOW_TO_USE_TRANSLATIONS } from '../data/howToUseData';

const HowToUseModal = ({ isOpen, onClose, defaultTab = 'RIDER', isStandalonePage = false, user = null }) => {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('volnxt_lang') || 'en';
  });
  const [activeTab, setActiveTab] = useState(defaultTab);

  // Sync tab if prop changes
  useEffect(() => {
    if (defaultTab) setActiveTab(defaultTab);
  }, [defaultTab]);

  // Persist language choice
  const handleLanguageChange = (newLang) => {
    setLang(newLang);
    localStorage.setItem('volnxt_lang', newLang);
  };

  const t = HOW_TO_USE_TRANSLATIONS[lang] || HOW_TO_USE_TRANSLATIONS.en;

  const getChargeLink = user ? (user.role === 'RIDER' ? '/rider/dashboard' : '/provider/dashboard') : '/register';
  const provideChargeLink = user ? (user.role === 'PROVIDER' ? '/provider/dashboard' : '/rider/dashboard') : '/register-provider';

  const content = (
    <div className={`w-full bg-white text-black text-left flex flex-col ${
      isStandalonePage 
        ? 'rounded-3xl shadow-xl border border-gray-100 overflow-hidden' 
        : 'relative max-w-4xl rounded-none sm:rounded-3xl shadow-2xl border-0 sm:border sm:border-gray-100 overflow-hidden z-10 h-full sm:h-auto max-h-[100dvh] sm:max-h-[92vh]'
    }`}>
      {/* Header with Title, Close Button & Language Switcher */}
      <div className="p-3.5 sm:p-6 pb-3 sm:pb-4 border-b border-gray-100 bg-gradient-to-b from-gray-50/95 to-white flex-shrink-0">
        {/* Top Row: Operational Badge & Close Button */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full border border-emerald-200">
              <HelpCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-emerald-600" />
              {t.badge}
            </span>
            
            {!isStandalonePage && (
              <Link 
                to="/how-to-use"
                onClick={onClose}
                className="hidden sm:inline-flex items-center gap-1 text-[11px] text-gray-500 hover:text-black font-semibold transition"
                title={t.openFullPage}
              >
                <Maximize2 className="h-3 w-3" />
                <span>{t.openFullPage}</span>
              </Link>
            )}
          </div>

          {/* Modal Close Button: Pinned to top-right on mobile & desktop */}
          {!isStandalonePage && onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close modal"
              className="p-1.5 text-gray-400 hover:text-black rounded-full hover:bg-gray-100 transition -mr-1"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Title & Subtitle */}
        <div className="mb-3">
          <h3 className="text-base sm:text-2xl font-black text-black tracking-tight leading-snug">
            {t.title}
          </h3>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5 leading-relaxed line-clamp-2 sm:line-clamp-none">
            {t.subtitle}
          </p>
        </div>

        {/* Multilingual Selector: Fully responsive grid on mobile */}
        <div className="w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="w-full sm:w-auto flex items-center bg-gray-100/90 p-1 rounded-xl border border-gray-200/80">
            <div className="px-2 text-gray-500 hidden sm:flex items-center gap-1.5 text-xs font-semibold flex-shrink-0">
              <Globe className="h-3.5 w-3.5" />
              <span>{t.selectLanguage}:</span>
            </div>

            <div className="grid grid-cols-3 w-full sm:w-auto sm:flex sm:items-center gap-1">
              <button
                type="button"
                onClick={() => handleLanguageChange('en')}
                className={`py-1.5 px-2 text-xs font-bold rounded-lg transition-all text-center ${
                  lang === 'en'
                    ? 'bg-black text-white shadow-sm'
                    : 'text-gray-600 hover:text-black hover:bg-gray-200/50'
                }`}
              >
                English
              </button>

              <button
                type="button"
                onClick={() => handleLanguageChange('te')}
                className={`py-1.5 px-2 text-xs font-bold rounded-lg transition-all text-center ${
                  lang === 'te'
                    ? 'bg-black text-white shadow-sm'
                    : 'text-gray-600 hover:text-black hover:bg-gray-200/50'
                }`}
              >
                తెలుగు
              </button>

              <button
                type="button"
                onClick={() => handleLanguageChange('hi')}
                className={`py-1.5 px-2 text-xs font-bold rounded-lg transition-all text-center ${
                  lang === 'hi'
                    ? 'bg-black text-white shadow-sm'
                    : 'text-gray-600 hover:text-black hover:bg-gray-200/50'
                }`}
              >
                हिन्दी
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Role Switcher Tabs */}
      <div className="px-3.5 sm:px-6 pt-3 sm:pt-4 bg-white flex-shrink-0">
        <div className="grid grid-cols-2 bg-gray-100 p-1 sm:p-1.5 rounded-2xl gap-1 sm:gap-1.5 border border-gray-200/80">
          <button
            type="button"
            onClick={() => setActiveTab('RIDER')}
            className={`py-2 sm:py-2.5 px-2 sm:px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 sm:gap-2 transition ${
              activeTab === 'RIDER'
                ? 'bg-black text-white shadow-md'
                : 'text-gray-600 hover:text-black hover:bg-gray-200/60'
            }`}
          >
            <Car className="h-4 w-4 flex-shrink-0" />
            <span className="sm:hidden truncate">{t.tabRider}</span>
            <span className="hidden sm:inline truncate">{t.tabRiderFull}</span>
          </button>
          
          <button
            type="button"
            onClick={() => setActiveTab('PROVIDER')}
            className={`py-2 sm:py-2.5 px-2 sm:px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 sm:gap-2 transition ${
              activeTab === 'PROVIDER'
                ? 'bg-black text-white shadow-md'
                : 'text-gray-600 hover:text-black hover:bg-gray-200/60'
            }`}
          >
            <Zap className="h-4 w-4 text-emerald-400 flex-shrink-0" />
            <span className="sm:hidden truncate">{t.tabProvider}</span>
            <span className="hidden sm:inline truncate">{t.tabProviderFull}</span>
          </button>
        </div>
      </div>

      {/* Scrollable Content Body */}
      <div className="p-3.5 sm:p-6 overflow-y-auto space-y-3.5 sm:space-y-4 flex-1 overscroll-contain">
        {activeTab === 'RIDER' ? (
          /* ================= RIDER WORKFLOW ================= */
          <div className="space-y-3.5 sm:space-y-4">
            {/* Header Banner */}
            <div className="bg-emerald-50/80 border border-emerald-200/80 p-3 sm:p-4 rounded-2xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="p-2 sm:p-2.5 bg-emerald-600 text-white rounded-xl shadow-sm flex-shrink-0">
                  <Car className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-black">{t.riderHeaderTitle}</h4>
                  <p className="text-[11px] sm:text-xs text-gray-600 mt-0.5">{t.riderHeaderDesc}</p>
                </div>
              </div>
              <span className="hidden sm:inline-block text-[11px] font-bold text-emerald-700 bg-white px-3 py-1 rounded-full border border-emerald-200 shadow-sm flex-shrink-0">
                {t.riderBadge}
              </span>
            </div>

            {/* Steps Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3.5">
              {t.riderSteps.map((s, index) => (
                <div 
                  key={s.step} 
                  className={`p-3 sm:p-4 rounded-2xl border border-gray-200 bg-white hover:border-gray-300 transition ${
                    index === t.riderSteps.length - 1 ? 'md:col-span-2' : ''
                  }`}
                >
                  <div className="flex items-start gap-2.5 mb-1.5">
                    <span className="h-6 w-6 rounded-full bg-black text-white text-xs font-black flex items-center justify-center flex-shrink-0 shadow-sm mt-0.5">
                      {s.step}
                    </span>
                    <h5 className="font-bold text-xs sm:text-sm text-black leading-snug">
                      {s.title}
                    </h5>
                  </div>
                  <p className="text-[11px] sm:text-xs text-gray-600 leading-relaxed pl-8">
                    {s.desc}
                  </p>
                </div>
              ))}
            </div>

            {/* Pro Tips Box */}
            <div className="p-3 sm:p-4 bg-gray-50 border border-gray-200 rounded-2xl text-[11px] sm:text-xs text-gray-600 space-y-1.5">
              <div className="font-bold text-black flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                <span>{t.riderTipsTitle}</span>
              </div>
              {t.riderTips.map((tip, idx) => (
                <p key={idx} className="flex items-start gap-1.5">
                  <span className="text-emerald-600 font-bold">•</span>
                  <span>{tip}</span>
                </p>
              ))}
            </div>
          </div>
        ) : (
          /* ================= PROVIDER WORKFLOW ================= */
          <div className="space-y-3.5 sm:space-y-4">
            {/* Header Banner */}
            <div className="bg-amber-50/80 border border-amber-200/80 p-3 sm:p-4 rounded-2xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="p-2 sm:p-2.5 bg-black text-white rounded-xl shadow-sm flex-shrink-0">
                  <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-400" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-black">{t.providerHeaderTitle}</h4>
                  <p className="text-[11px] sm:text-xs text-gray-600 mt-0.5">{t.providerHeaderDesc}</p>
                </div>
              </div>
              <span className="hidden sm:inline-block text-[11px] font-bold text-amber-800 bg-white px-3 py-1 rounded-full border border-amber-200 shadow-sm flex-shrink-0">
                {t.providerBadge}
              </span>
            </div>

            {/* Steps Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3.5">
              {t.providerSteps.map((s, index) => (
                <div 
                  key={s.step} 
                  className={`p-3 sm:p-4 rounded-2xl border border-gray-200 bg-white hover:border-gray-300 transition ${
                    index === t.providerSteps.length - 1 ? 'md:col-span-2' : ''
                  }`}
                >
                  <div className="flex items-start gap-2.5 mb-1.5">
                    <span className="h-6 w-6 rounded-full bg-black text-white text-xs font-black flex items-center justify-center flex-shrink-0 shadow-sm mt-0.5">
                      {s.step}
                    </span>
                    <h5 className="font-bold text-xs sm:text-sm text-black leading-snug">
                      {s.title}
                    </h5>
                  </div>
                  <p className="text-[11px] sm:text-xs text-gray-600 leading-relaxed pl-8">
                    {s.desc}
                  </p>
                </div>
              ))}
            </div>

            {/* Pro Tips Box */}
            <div className="p-3 sm:p-4 bg-gray-50 border border-gray-200 rounded-2xl text-[11px] sm:text-xs text-gray-600 space-y-1.5">
              <div className="font-bold text-black flex items-center gap-1.5">
                <DollarSign className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                <span>{t.providerTipsTitle}</span>
              </div>
              {t.providerTips.map((tip, idx) => (
                <p key={idx} className="flex items-start gap-1.5">
                  <span className="text-amber-600 font-bold">•</span>
                  <span>{tip}</span>
                </p>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer CTA */}
      <div className="p-3.5 sm:p-5 pt-3 sm:pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-3 bg-gray-50/70 flex-shrink-0">
        <div className="text-[11px] sm:text-xs text-gray-500 font-medium text-center sm:text-left w-full sm:w-auto">
          {activeTab === 'RIDER' ? t.riderCtaSub : t.providerCtaSub}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {!isStandalonePage && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial text-center px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-100 transition"
            >
              {t.closeBtn}
            </button>
          )}

          <Link
            to={activeTab === 'RIDER' ? getChargeLink : provideChargeLink}
            onClick={onClose ? onClose : undefined}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 bg-black hover:bg-gray-900 text-white text-xs font-bold px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl shadow-md transition"
          >
            <span>{activeTab === 'RIDER' ? t.riderCta : t.providerCta}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );

  if (isStandalonePage) {
    return content;
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 md:p-6 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
          />

          {/* Modal Dialog Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="w-full h-full sm:h-auto sm:max-w-4xl flex items-center justify-center z-10"
          >
            {content}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default HowToUseModal;
