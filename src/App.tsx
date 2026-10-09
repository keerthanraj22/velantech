import React, { useState, useEffect } from 'react';
import {
  User,
  UserRole,
  Equipment,
  EquipmentCategory,
  Booking,
  KnowledgeArticle,
  WeatherData,
  FilterState,
  SupportComplaint
} from './types';
import {
  fetchCategories,
  fetchEquipmentList,
  fetchBookings,
  fetchKnowledgeArticles,
  fetchWeatherData,
  fetchAdminAnalytics,
  fetchUsersList
} from './services/api';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomeView } from './views/HomeView';
import { EquipmentDetailView } from './views/EquipmentDetailView';
import { FarmerDashboard } from './views/FarmerDashboard';
import { ProviderDashboard } from './views/ProviderDashboard';
import { AdminDashboard } from './views/AdminDashboard';
import { KnowledgeCenter } from './components/KnowledgeCenter';
import { BookingModal } from './components/BookingModal';
import { InvoiceModal } from './components/InvoiceModal';
import { AiFarmingAdvisorModal } from './components/AiFarmingAdvisorModal';
import { AuthModal } from './components/AuthModal';
import { AddEquipmentModal } from './components/AddEquipmentModal';
import i18n from './i18n';

export default function App() {
  // No account is assumed: users must choose their own role and authenticate.
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('agri_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return null;
  });

  const [activeView, setActiveView] = useState<string>('home');
  const [selectedLanguage, setSelectedLanguage] = useState<string>(() => localStorage.getItem('agri_language') || 'English');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => localStorage.getItem('agri_theme') === 'dark' ? 'dark' : 'light');

  // Selected Equipment for Detail Page
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);

  // App Data State
  const [categories, setCategories] = useState<EquipmentCategory[]>([]);
  const [equipmentList, setEquipmentList] = useState<(Equipment & { distanceKm?: number })[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [knowledgeArticles, setKnowledgeArticles] = useState<KnowledgeArticle[]>([]);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [usersList, setUsersList] = useState<User[]>([]);

  // Filter State
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    categoryId: 'all',
    radiusKm: 100,
    userLat: 11.0168, // Coimbatore GPS
    userLng: 76.9558,
    minPrice: 0,
    maxPrice: 100000,
    fuelType: 'all',
    minHp: 0,
    availability: 'all',
    sortBy: 'distance'
  });

  // Modal Control States
  const [bookingModalEquipment, setBookingModalEquipment] = useState<Equipment | null>(null);
  const [invoiceModalBooking, setInvoiceModalBooking] = useState<Booking | null>(null);
  const [showAiAdvisorModal, setShowAiAdvisorModal] = useState<boolean>(false);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(() => {
    const hasSavedSession = Boolean(localStorage.getItem('agri_user'));
    const hasSeenWelcome = sessionStorage.getItem('agri_auth_welcome_seen') === 'true';
    return !hasSavedSession && !hasSeenWelcome;
  });
  const [authTargetRole, setAuthTargetRole] = useState<UserRole>('farmer');
  const [showAddEquipmentModal, setShowAddEquipmentModal] = useState<boolean>(false);

  // Save current user to localStorage whenever updated
  const handleUserLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('agri_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('agri_user');
    setActiveView('home');
  };

  // Load Data on Initial Render & Filter Change
  const loadData = async () => {
    const cats = await fetchCategories();
    setCategories(cats);

    const eq = await fetchEquipmentList({
      categoryId: filters.categoryId,
      search: filters.searchQuery,
      userLat: filters.userLat,
      userLng: filters.userLng,
      radiusKm: filters.radiusKm,
      fuelType: filters.fuelType,
      minHp: filters.minHp,
      sortBy: filters.sortBy,
      includeUnapproved: currentUser?.role === 'admin'
    });
    setEquipmentList(eq);

    const bks = await fetchBookings();
    setBookings(bks);

    const arts = await fetchKnowledgeArticles();
    setKnowledgeArticles(arts);

    const w = await fetchWeatherData();
    setWeather(w);

    const stats = await fetchAdminAnalytics();
    setAnalytics(stats);

    const uList = await fetchUsersList();
    setUsersList(uList);
  };

  useEffect(() => {
    loadData();
  }, [filters, currentUser?.role]);

  useEffect(() => {
    i18n.changeLanguage(selectedLanguage);
    localStorage.setItem('agri_language', selectedLanguage);
    document.documentElement.lang = selectedLanguage === 'English' ? 'en' : selectedLanguage;
  }, [selectedLanguage]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('agri_theme', theme);
  }, [theme]);

  const handleSelectEquipment = (eq: Equipment) => {
    setSelectedEquipment(eq);
    setActiveView('detail');
  };

  const handleOpenBooking = (eq: Equipment) => {
    if (!currentUser) {
      setAuthTargetRole('farmer');
      setShowAuthModal(true);
      return;
    }
    if (currentUser.role !== 'farmer') {
      window.alert('Only farmer accounts can book machinery. Providers manage listings and admins review approvals.');
      return;
    }
    setBookingModalEquipment(eq);
  };

  const handleOpenAuthModal = (role: UserRole = 'farmer') => {
    setAuthTargetRole(role);
    setShowAuthModal(true);
  };

  const handleCloseAuthModal = () => {
    sessionStorage.setItem('agri_auth_welcome_seen', 'true');
    setShowAuthModal(false);
  };

  const handleOpenAddEquipmentModal = () => {
    if (!currentUser) {
      setAuthTargetRole('farmer');
      setShowAuthModal(true);
      return;
    }
    if (currentUser.role !== 'provider' && currentUser.role !== 'admin') {
      window.alert('Only equipment providers and administrators can add machinery listings. Farmers can browse and book approved equipment.');
      return;
    }
    setShowAddEquipmentModal(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 selection:bg-emerald-600 selection:text-white">
      
      {/* Top Navbar */}
      <Navbar
        currentUser={currentUser}
        onSelectLanguage={setSelectedLanguage}
        selectedLanguage={selectedLanguage}
        onOpenAiAdvisor={() => setShowAiAdvisorModal(true)}
        onOpenAuthModal={handleOpenAuthModal}
        onLogout={handleLogout}
        onNavigateToView={(view) => {
          setActiveView(view);
          setSelectedEquipment(null);
        }}
        activeView={activeView}
        onOpenAddEquipmentModal={handleOpenAddEquipmentModal}
        theme={theme}
        onToggleTheme={() => setTheme((current) => current === 'light' ? 'dark' : 'light')}
      />

      {/* Main Container Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        
        {/* VIEW 1: Home / Equipment Directory */}
        {activeView === 'home' && (
          <HomeView
            categories={categories}
            equipmentList={equipmentList}
            weather={weather}
            filters={filters}
            onFilterChange={setFilters}
            onSelectEquipment={handleSelectEquipment}
            onOpenBookingModal={handleOpenBooking}
            onOpenAiAdvisor={() => setShowAiAdvisorModal(true)}
            currentUser={currentUser}
            onRefreshEquipment={loadData}
          />
        )}

        {/* VIEW 2: Equipment Detail Page */}
        {activeView === 'detail' && selectedEquipment && (
          <EquipmentDetailView
            equipment={selectedEquipment}
            currentUser={currentUser}
            onBack={() => setActiveView('home')}
            onOpenBookingModal={handleOpenBooking}
          />
        )}

        {/* Knowledge Center */}
        {activeView === 'knowledge' && (
          <KnowledgeCenter articles={knowledgeArticles} />
        )}

        {/* VIEW 5: Dashboard (Role Adaptive or Prompt Sign-In) */}
        {activeView === 'dashboard' && (
          <>
            {!currentUser ? (
              <div className="bg-white rounded-2xl p-12 text-center max-w-md mx-auto shadow-xs border border-slate-200 space-y-4 my-8">
                <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto font-bold text-2xl">
                  🔑
                </div>
                <h3 className="text-lg font-bold text-slate-900">Sign In to Access Dashboard</h3>
                <p className="text-xs text-slate-600">
                  Select your role (Farmer, Equipment Provider, or Admin) to view your custom portal.
                </p>
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    onClick={() => handleOpenAuthModal('farmer')}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs"
                  >
                    🌾 Farmer Portal
                  </button>
                  <button
                    onClick={() => handleOpenAuthModal('provider')}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl text-xs"
                  >
                    🚜 Provider Portal
                  </button>
                </div>
              </div>
            ) : (
              <>
                {currentUser.role === 'farmer' && (
                  <FarmerDashboard
                    currentUser={currentUser}
                    bookings={bookings}
                    onOpenInvoice={(bk) => setInvoiceModalBooking(bk)}
                    onOpenBooking={handleOpenBooking}
                    onSelectEquipment={handleSelectEquipment}
                    onUpdateUser={handleUserLogin}
                  />
                )}

                {currentUser.role === 'provider' && (
                  <ProviderDashboard
                    currentUser={currentUser}
                    equipmentList={equipmentList}
                    bookings={bookings}
                    onRefreshData={loadData}
                    onOpenAddEquipmentModal={handleOpenAddEquipmentModal}
                  />
                )}

                {currentUser.role === 'admin' && (
                  <AdminDashboard
                    currentUser={currentUser}
                    analytics={analytics}
                    equipmentList={equipmentList}
                    categories={categories}
                    users={usersList}
                    bookings={bookings}
                    complaints={[]}
                    onRefreshData={loadData}
                    onOpenAddEquipmentModal={handleOpenAddEquipmentModal}
                  />
                )}

              </>
            )}
          </>
        )}

      </main>

      {/* Footer */}
      <Footer />

      {/* Modals */}
      {bookingModalEquipment && (
        <BookingModal
          equipment={bookingModalEquipment}
          currentUser={currentUser!}
          onClose={() => setBookingModalEquipment(null)}
          onBookingSuccess={(bk) => {
            loadData();
            setActiveView('dashboard');
          }}
        />
      )}

      {invoiceModalBooking && (
        <InvoiceModal
          booking={invoiceModalBooking}
          onClose={() => setInvoiceModalBooking(null)}
        />
      )}

      {showAiAdvisorModal && (
        <AiFarmingAdvisorModal onClose={() => setShowAiAdvisorModal(false)} />
      )}

      {showAuthModal && (
        <AuthModal
          currentUser={currentUser}
          targetRole={authTargetRole}
          onClose={handleCloseAuthModal}
          onLoginSuccess={(user) => {
            handleUserLogin(user);
            loadData();
            // Providers work from their management console; the public landing
            // page remains the entry point for farmer and admin accounts.
            setActiveView(user.role === 'provider' ? 'dashboard' : 'home');
          }}
        />
      )}

      {showAddEquipmentModal && (
        <AddEquipmentModal
          currentUser={currentUser}
          categories={categories}
          onClose={() => setShowAddEquipmentModal(false)}
          onSuccess={() => {
            loadData();
            setActiveView(currentUser.role === 'provider' ? 'dashboard' : 'home');
          }}
        />
      )}

    </div>
  );
}
