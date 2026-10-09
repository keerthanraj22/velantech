import React, { useEffect, useRef, useState } from 'react';
import { Equipment, EquipmentCategory, FilterState, WeatherData, User } from '../types';
import { MapView } from '../components/MapView';
import { EquipmentCard } from '../components/EquipmentCard';
import { useTranslation } from 'react-i18next';
import { WeatherWidget } from '../components/WeatherWidget';
import {
  Search,
  SlidersHorizontal,
  MapPin,
  Map as MapIcon,
  Grid,
  Tractor,
  RotateCw,
  Gauge,
  Wheat,
  Droplets,
  Zap,
  Filter,
  Sprout,
  ShieldCheck,
  Warehouse,
  CheckCircle2
} from 'lucide-react';

interface HomeViewProps {
  categories: EquipmentCategory[];
  equipmentList: (Equipment & { distanceKm?: number })[];
  weather: WeatherData | null;
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  onSelectEquipment: (eq: Equipment) => void;
  onOpenBookingModal: (eq: Equipment) => void;
  onOpenAiAdvisor: () => void;
  currentUser: User | null;
  onRefreshEquipment: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  categories,
  equipmentList,
  weather,
  filters,
  onFilterChange,
  onSelectEquipment,
  onOpenBookingModal,
  onOpenAiAdvisor,
  currentUser,
  onRefreshEquipment
}) => {
  const { t } = useTranslation();
  const [showMapView, setShowMapView] = useState(true);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const journeyRef = useRef<HTMLElement>(null);
  const journeyLandscapeRef = useRef<HTMLDivElement>(null);
  const journeyStageRef = useRef(0);
  const [journeyStage, setJourneyStage] = useState(0);

  const radiusOptions = [5, 10, 20, 30, 50, 100, 250, 500];

  useEffect(() => {
    let frame = 0;
    let target = 0;
    let displayed = 0;
    let visible = true;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    const readScrollProgress = () => {
      const section = journeyRef.current;
      if (!section) return;
      const rect = section.getBoundingClientRect();
      const scrollDistance = Math.max(section.offsetHeight - window.innerHeight, 1);
      target = Math.min(1, Math.max(0, -rect.top / scrollDistance));
    };

    const renderJourney = () => {
      frame = 0;
      if (!reduceMotion.matches) displayed += (target - displayed) * 0.105;
      else displayed = target;
      if (Math.abs(target - displayed) < 0.0005) displayed = target;

      const landscape = journeyLandscapeRef.current;
      if (landscape) {
        landscape.style.setProperty('--journey-progress', displayed.toFixed(4));
        landscape.style.setProperty('--journey-speed', Math.min(1, Math.abs(target - displayed) * 16).toFixed(3));
      }
      const stage = displayed >= .76 ? 3 : displayed >= .40 ? 2 : displayed >= .08 ? 1 : 0;
      if (journeyStageRef.current !== stage) {
        journeyStageRef.current = stage;
        setJourneyStage(stage);
      }
      if (visible || Math.abs(target - displayed) > 0.0005) frame = requestAnimationFrame(renderJourney);
    };
    const onScroll = () => {
      readScrollProgress();
      if (!frame) frame = requestAnimationFrame(renderJourney);
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) onScroll();
    }, { threshold: 0 });
    if (journeyRef.current) observer.observe(journeyRef.current);
    readScrollProgress();
    frame = requestAnimationFrame(renderJourney);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    reduceMotion.addEventListener('change', onScroll);
    return () => { cancelAnimationFrame(frame); observer.disconnect(); window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); reduceMotion.removeEventListener('change', onScroll); };
  }, []);

  return (
    <div className="space-y-6">

      <section className="farm-hero rounded-[28px] overflow-hidden border border-emerald-900/10 shadow-xl">
        <div className="farm-hero__content">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 border border-white/25 px-3 py-1 text-[10px] font-bold tracking-[.14em] uppercase text-amber-100">
            <Sprout className="w-3.5 h-3.5" /> Smart farming • India
          </div>
          <h1>Powering every acre with the <span>right equipment.</span></h1>
          <p>Find, compare and rent trusted agricultural machinery from nearby providers — built for India’s farms.</p>
          <div className="flex flex-wrap gap-3 pt-3">
            <button onClick={() => document.getElementById('equipment')?.scrollIntoView({ behavior: 'smooth' })} className="farm-hero__cta">Find equipment</button>
            <button onClick={() => document.getElementById('equipment')?.scrollIntoView({ behavior: 'smooth' })} className="farm-hero__secondary">Explore machinery</button>
          </div>
          <div className="flex flex-wrap gap-2 pt-5">
            <span className="farm-hero__chip"><MapPin className="w-3.5 h-3.5" /> Local providers</span>
            <span className="farm-hero__chip"><ShieldCheck className="w-3.5 h-3.5" /> Verified listings</span>
          </div>
        </div>
        <div className="farm-hero__scene" aria-label="Modern and traditional farming in India">
          <figure className="farm-hero__photo">
            <img src="/images/tractor-hero.jpg" alt="Red tractor preparing a field" />
            <figcaption><Tractor className="w-3.5 h-3.5" /> Ready when your field is</figcaption>
          </figure>
          <figure className="farm-hero__heritage">
            <img src="/images/madu.jpg" alt="Traditional oxen working a wet field" />
            <figcaption>Rooted in local farming</figcaption>
          </figure>
        </div>
      </section>

      <section ref={journeyRef} className="farm-journey" aria-label="Equipment delivery journey from provider to farmer">
        <div className="farm-journey__sticky">
          <div className="farm-journey__heading">
            <span>HOW VELANTECH WORKS</span>
            <h2>From trusted provider to <em>field ready.</em></h2>
            <p>Discover trusted equipment, book what you need, and get your farm ready — all in one simple journey.</p>
          </div>
          <div ref={journeyLandscapeRef} className="farm-journey__landscape" style={{ '--journey-progress': 0, '--journey-speed': 0 } as React.CSSProperties}>
            <div className="farm-journey__sun" />
            <div className="farm-journey__field-lines" />
            <div className="farm-journey__person farm-journey__person--provider" aria-label="Equipment provider">
              <span className="farm-journey__avatar"><Warehouse /></span><strong>Trusted provider</strong><small>Verified equipment nearby</small>
            </div>
            <div className="farm-journey__person farm-journey__person--farmer" aria-label="Farmer">
              <span className="farm-journey__avatar"><Sprout /></span><strong>Your farm</strong><small>{journeyStage === 3 ? 'Equipment arrived' : 'Ready for work'}</small>
            </div>
            <div className="farm-journey__road"><span /></div>
            <div className="farm-journey__tractor" aria-label="Tractor travelling to the farm">
              <Tractor />
              <span className="farm-journey__tractor-label">On the way</span>
              <span className="farm-journey__dust" aria-hidden="true"><i /><i /><i /><i /><i /></span>
            </div>
            <div className="farm-journey__steps" aria-label="Three simple steps">
              <div className={journeyStage >= 1 ? 'is-active' : ''}><b>01</b><span>Discover<small>Find trusted equipment nearby</small></span></div>
              <div className={journeyStage >= 2 ? 'is-active' : ''}><b>02</b><span>Book<small>Reserve the right machine</small></span></div>
              <div className={journeyStage >= 3 ? 'is-active' : ''}><b>{journeyStage === 3 ? <CheckCircle2 /> : '03'}</b><span>Field ready<small>Equipment at your farm</small></span></div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Weather Advisory Banner */}
      {weather && <WeatherWidget weather={weather} />}

      {/* Main Search & Discovery Section */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-xs border border-slate-200 space-y-4">
        
        {/* Search Bar Input */}
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder={t('searchPlaceholder')}
              value={filters.searchQuery}
              onChange={(e) => onFilterChange({ ...filters, searchQuery: e.target.value })}
              className="w-full bg-slate-100 border-none rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
            />
          </div>

          {/* Radius Selector */}
          <div className="flex items-center space-x-2 bg-emerald-50/80 p-2 rounded-xl border border-emerald-100 text-xs w-full md:w-auto">
            <MapPin className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span className="font-bold text-slate-900 whitespace-nowrap">{t('distanceRadius')}:</span>
            <select
              value={filters.radiusKm}
              onChange={(e) => onFilterChange({ ...filters, radiusKm: Number(e.target.value) })}
              className="bg-white border border-emerald-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-800 focus:outline-none"
            >
              {radiusOptions.map((r) => (
                <option key={r} value={r}>
                  {r} KM
                </option>
              ))}
            </select>
          </div>

          {/* Map/Grid Toggle Button */}
          <button
            onClick={() => setShowMapView(!showMapView)}
            className="flex items-center space-x-2 bg-slate-900 text-white hover:bg-slate-800 px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-xs w-full md:w-auto justify-center"
          >
            {showMapView ? <Grid className="w-4 h-4 text-emerald-400" /> : <MapIcon className="w-4 h-4 text-emerald-400" />}
            <span>{showMapView ? 'Hide Map' : 'Show Map View'}</span>
          </button>

          {/* Toggle Filters */}
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="flex items-center space-x-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-xs font-bold transition border border-slate-200 w-full md:w-auto justify-center"
          >
            <SlidersHorizontal className="w-4 h-4 text-slate-500" />
            <span>Filters</span>
          </button>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => onFilterChange({ ...filters, categoryId: 'all' })}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
              filters.categoryId === 'all'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {t('allCategories')} ({equipmentList.length})
          </button>

          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onFilterChange({ ...filters, categoryId: cat.id })}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                filters.categoryId === cat.id
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Advanced Filter Drawer */}
        {showAdvancedFilters && (
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Fuel Type</label>
              <select
                value={filters.fuelType}
                onChange={(e) => onFilterChange({ ...filters, fuelType: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-medium text-slate-800"
              >
                <option value="all">All Fuel Types</option>
                <option value="Diesel">Diesel</option>
                <option value="Petrol">Petrol</option>
                <option value="Electric">Electric / Solar</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Minimum Horse Power (HP)</label>
              <input
                type="number"
                placeholder="e.g. 45"
                value={filters.minHp || ''}
                onChange={(e) => onFilterChange({ ...filters, minHp: Number(e.target.value) })}
                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-medium text-slate-800"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Sort By</label>
              <select
                value={filters.sortBy}
                onChange={(e) => onFilterChange({ ...filters, sortBy: e.target.value as any })}
                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-medium text-slate-800"
              >
                <option value="distance">Nearest First</option>
                <option value="price_low">Lowest Price First</option>
                <option value="price_high">Highest Price First</option>
                <option value="rating">Highest Rating First</option>
              </select>
            </div>
          </div>
        )}

      </div>

      {/* Map View Display */}
      {showMapView && (
        <MapView
          userLat={filters.userLat}
          userLng={filters.userLng}
          radiusKm={filters.radiusKm}
          equipmentList={equipmentList}
          onSelectEquipment={onSelectEquipment}
        />
      )}

      {/* Equipment Cards Grid */}
      <div id="equipment" className="space-y-4 scroll-mt-24">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <span>Explore Agricultural Machinery</span>
            <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200/60 px-2.5 py-0.5 rounded-full font-semibold">
              {equipmentList.length} Items found
            </span>
          </h2>
        </div>

        {equipmentList.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-slate-300 space-y-3">
            <div className="w-12 h-12 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center mx-auto">
              <Tractor className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">No approved machinery found nearby</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {currentUser?.role === 'farmer'
                ? 'Equipment appears here after a provider submits it and an administrator approves it. You can also search a wider area.'
                : 'Try expanding the search radius or selecting "All Machinery".'}
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <button onClick={onRefreshEquipment} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs">Refresh equipment</button>
              <button onClick={() => onFilterChange({ ...filters, radiusKm: 500, categoryId: 'all' })} className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-xl text-xs">Search within 500 KM</button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {equipmentList.map((eq) => (
              <EquipmentCard
                key={eq.id}
                equipment={eq}
                currentUser={currentUser}
                onSelectEquipment={onSelectEquipment}
                onOpenBookingModal={onOpenBookingModal}
              />
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
