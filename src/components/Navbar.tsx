import React, { useState } from 'react';
import {
  Globe,
  MapPin,
  Bell,
  User as UserIcon,
  Bot,
  PlusCircle,
  LogOut,
  ShieldAlert,
  ChevronDown,
  Sparkles,
  LogIn,
  Sun,
  Moon
  , Menu, X
} from 'lucide-react';
import { User, UserRole } from '../types';
import i18n from '../i18n';
import { useTranslation } from 'react-i18next';

interface NavbarProps {
  currentUser: User | null;
  onSelectLanguage: (lang: string) => void;
  selectedLanguage: string;
  onOpenAiAdvisor: () => void;
  onOpenAuthModal: (role?: UserRole) => void;
  onLogout: () => void;
  onNavigateToView: (view: string) => void;
  activeView: string;
  onOpenAddEquipmentModal?: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onSelectLanguage,
  selectedLanguage,
  onOpenAiAdvisor,
  onOpenAuthModal,
  onLogout,
  onNavigateToView,
  activeView,
  onOpenAddEquipmentModal,
  theme,
  onToggleTheme
}) => {
  const { t } = useTranslation();
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false);

  const languages = [
    { code: 'English', label: 'English' },
    { code: 'Tamil', label: 'தமிழ் (Tamil)' },
    { code: 'Hindi', label: 'हिंदी (Hindi)' },
    { code: 'Telugu', label: 'తెలుగు (Telugu)' },
    { code: 'Kannada', label: 'ಕನ್ನಡ (Kannada)' },
    { code: 'Malayalam', label: 'മലയാളം (Malayalam)' },
    { code: 'Marathi', label: 'मराठी (Marathi)' },
    { code: 'Gujarati', label: 'ગુજરાતી (Gujarati)' },
    { code: 'Punjabi', label: 'ਪੰਜਾਬੀ (Punjabi)' },
    { code: 'Bengali', label: 'বাংলা (Bengali)' }
  ];

  const handleLangChange = (langCode: string) => {
    i18n.changeLanguage(langCode);
    onSelectLanguage(langCode);
    setShowLangMenu(false);
  };

  // Farmers rent machinery; providers submit listings for admin approval.
  const canSubmitEquipment = currentUser?.role === 'provider';
  const providerNav = [
    ['dashboard', 'Dashboard'], ['equipment', 'My Equipment'],
    ['bookings', 'Bookings'], ['earnings', 'Earnings'],
    ['maintenance', 'Maintenance'], ['knowledge', t('knowledgeCenter')]
  ];
  const navigateProvider = (target: string) => {
    if (target === 'knowledge') onNavigateToView('knowledge');
    else { onNavigateToView('dashboard'); window.dispatchEvent(new CustomEvent('velantech:provider-nav', { detail: target })); }
    setShowMobileNav(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white text-slate-900 shadow-xs border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-24 sm:h-28">
          
          {/* Logo & Brand Name */}
          <div className="flex items-center cursor-pointer" onClick={() => onNavigateToView(currentUser?.role === 'provider' ? 'dashboard' : 'home')}>
            <img
              src="/images/velantech-brand-lockup.png"
              alt="VELANTECH — Smart Technology. Better Farming."
              className="velantech-brand-lockup h-[5.25rem] w-[5.25rem] sm:h-24 sm:w-24"
            />
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2 text-sm font-medium overflow-x-auto max-w-[52vw]">
            {canSubmitEquipment ? providerNav.map(([view, label]) => (
              <button key={view} onClick={() => navigateProvider(view)} className={`px-2 py-1.5 rounded-lg transition-colors whitespace-nowrap ${activeView === 'dashboard' && view === 'dashboard' ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}>{label}</button>
            )) : <>
            <button
              onClick={() => onNavigateToView('home')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                activeView === 'home' ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {t('nearbyEquipment')}
            </button>
            <button
              onClick={() => onNavigateToView('knowledge')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                activeView === 'knowledge' ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {t('knowledgeCenter')}
            </button>
            <button
              onClick={() => onNavigateToView('dashboard')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                activeView === 'dashboard' ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {t('dashboard')}
            </button>
            </>}
          </nav>

          {/* Right Action Bar */}
          <div className="flex items-center space-x-2 sm:space-x-3">

            <button
              onClick={() => setShowMobileNav(!showMobileNav)}
              className="md:hidden grid place-items-center w-9 h-9 rounded-lg border border-slate-200 text-emerald-800 bg-emerald-50"
              aria-label="Open navigation menu"
              aria-expanded={showMobileNav}
            >
              {showMobileNav ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>

            <button
              onClick={onToggleTheme}
              className="theme-toggle p-2 rounded-lg border border-slate-200 bg-slate-100 hover:bg-amber-50 text-slate-700 transition"
              title={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
              aria-label={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-300" />}
            </button>
            
            {/* AI Assistant Button */}
            <button
              onClick={onOpenAiAdvisor}
              className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg font-bold text-xs shadow-xs transition active:scale-95"
              title={canSubmitEquipment ? 'AI Equipment Advisor' : 'Smart AI Agronomist & Machinery Advisor'}
            >
              <Sparkles className="w-4 h-4 text-white" />
              <span className="hidden sm:inline">{canSubmitEquipment ? 'AI Equipment Advisor' : t('aiAdvisor')}</span>
            </button>

            {/* Language Switcher */}
            <div className="relative">
              <button
                onClick={() => setShowLangMenu(!showLangMenu)}
                className="flex items-center space-x-1 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 border border-slate-200"
              >
                <Globe className="w-3.5 h-3.5 text-slate-500" />
                <span className="max-w-[70px] truncate">{selectedLanguage}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {showLangMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white text-slate-800 rounded-xl shadow-lg border border-slate-200 py-1 z-50 text-xs">
                  <div className="px-3 py-1.5 font-bold text-slate-400 border-b border-slate-100 uppercase tracking-wider text-[10px]">
                    {t('language')}
                  </div>
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => handleLangChange(lang.code)}
                      className={`w-full text-left px-3 py-2 hover:bg-emerald-50 transition flex items-center justify-between ${
                        selectedLanguage === lang.code ? 'font-bold text-emerald-700 bg-emerald-50/50' : 'text-slate-700'
                      }`}
                    >
                      <span>{lang.label}</span>
                      {selectedLanguage === lang.code && <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Providers submit machinery; administrator approval controls publication. */}
            {canSubmitEquipment && onOpenAddEquipmentModal && (
              <button
                onClick={onOpenAddEquipmentModal}
                className="flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 text-white px-2 sm:px-3 py-1.5 rounded-lg font-bold text-xs transition shadow-xs"
              >
                <PlusCircle className="w-4 h-4 text-emerald-400" />
                <span className="hidden sm:inline">+ Add Equipment</span>
              </button>
            )}

            {/* User Account / Login State */}
            {currentUser ? (
              <div className="relative flex items-center space-x-1">
                <button
                  onClick={() => setShowRoleMenu(!showRoleMenu)}
                  className="flex items-center space-x-2 bg-slate-100 hover:bg-slate-200 p-1.5 rounded-lg border border-slate-200 transition"
                  title="User Profile & Role Settings"
                >
                  {currentUser.avatar ? <img src={currentUser.avatar} alt={currentUser.name} className="w-7 h-7 rounded-full object-cover border border-slate-200" /> : <span className="w-7 h-7 rounded-full bg-emerald-600 text-white grid place-items-center text-[10px] font-bold">{currentUser.name.slice(0, 2).toUpperCase()}</span>}
                  <div className="hidden lg:block text-left pr-1">
                    <span className="block text-xs font-bold text-slate-900 leading-tight max-w-[90px] truncate">
                      {currentUser.name}
                    </span>
                    <span className="block text-[9px] font-bold text-emerald-700 uppercase leading-none">
                      {currentUser.role}
                    </span>
                  </div>
                  <ChevronDown className="w-3 h-3 text-slate-500" />
                </button>

                {showRoleMenu && (
                  <div className="absolute right-0 mt-36 w-52 bg-white text-slate-800 rounded-xl shadow-lg border border-slate-200 py-1 z-50 text-xs space-y-0.5">
                    <div className="px-3 py-1.5 font-bold text-slate-400 border-b border-slate-100 uppercase tracking-wider text-[10px]">
                      Account & Role Portal
                    </div>
                    
                    <button
                      onClick={() => { onOpenAuthModal('farmer'); setShowRoleMenu(false); }}
                      className={`w-full text-left px-3 py-2 hover:bg-emerald-50 flex items-center justify-between ${currentUser.role === 'farmer' ? 'font-bold text-emerald-700' : ''}`}
                    >
                      <span>🌾 Farmer Login</span>
                      {currentUser.role === 'farmer' && <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">Active</span>}
                    </button>

                    <button
                      onClick={() => { onOpenAuthModal('provider'); setShowRoleMenu(false); }}
                      className={`w-full text-left px-3 py-2 hover:bg-emerald-50 flex items-center justify-between ${currentUser.role === 'provider' ? 'font-bold text-emerald-700' : ''}`}
                    >
                      <span>🚜 Equipment Provider</span>
                      {currentUser.role === 'provider' && <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">Active</span>}
                    </button>

                    <button
                      onClick={() => { onOpenAuthModal('admin'); setShowRoleMenu(false); }}
                      className={`w-full text-left px-3 py-2 hover:bg-emerald-50 flex items-center justify-between ${currentUser.role === 'admin' ? 'font-bold text-emerald-700' : ''}`}
                    >
                      <span>🛡️ Admin Portal</span>
                      {currentUser.role === 'admin' && <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">Active</span>}
                    </button>

                    <div className="border-t border-slate-100 pt-1">
                      <button
                        onClick={() => { onLogout(); setShowRoleMenu(false); }}
                        className="w-full text-left px-3 py-2 hover:bg-rose-50 text-rose-700 font-bold flex items-center space-x-1.5"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out (Logout)</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => onOpenAuthModal('farmer')}
                className="flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition shadow-xs"
              >
                <LogIn className="w-3.5 h-3.5 text-emerald-400" />
                <span>Sign In</span>
              </button>
            )}

          </div>
        </div>
        {showMobileNav && (
          <nav className="md:hidden pb-3 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
            {(canSubmitEquipment ? providerNav : [
              ['home', t('nearbyEquipment')],
              ['knowledge', t('knowledgeCenter')],
              ['dashboard', t('dashboard')]
            ]).map(([view, label]) => (
              <button
                key={view}
                onClick={() => canSubmitEquipment ? navigateProvider(view) : (() => { onNavigateToView(view); setShowMobileNav(false); })()}
                className={`px-3 py-2.5 rounded-xl text-left text-xs font-bold ${activeView === view ? 'bg-emerald-700 text-white' : 'bg-emerald-50 text-emerald-900'}`}
              >
                {label}
              </button>
            ))}
            <button onClick={() => { onOpenAiAdvisor(); setShowMobileNav(false); }} className="px-3 py-2.5 rounded-xl text-left text-xs font-bold bg-amber-50 text-amber-900">{canSubmitEquipment ? 'AI Equipment Advisor' : 'AI Crop & Equipment Advisor'}</button>
          </nav>
        )}
      </div>
    </header>
  );
};
