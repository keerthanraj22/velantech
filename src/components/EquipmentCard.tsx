import React from 'react';
import { Equipment, User } from '../types';
import { Star, MapPin, Fuel, ShieldCheck, ArrowRight, Zap, ImageOff, CalendarCheck } from 'lucide-react';

interface EquipmentCardProps {
  equipment: Equipment & { distanceKm?: number };
  currentUser: User | null;
  onSelectEquipment: (eq: Equipment) => void;
  onOpenBookingModal: (eq: Equipment) => void;
}

export const EquipmentCard: React.FC<EquipmentCardProps> = ({
  equipment,
  currentUser,
  onSelectEquipment,
  onOpenBookingModal
}) => {
  const canBook = currentUser?.role === 'farmer';
  const isBooked = equipment.availabilityStatus === 'Booked';
  const bookingLabel = isBooked ? 'Already booked' : !currentUser ? 'Sign in to book' : canBook ? 'Book equipment' : 'Farmer booking only';
  return (
    <div className="group bg-white rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 border border-slate-200 flex flex-col justify-between hover:border-slate-300">
      <div>
        
        {/* Top Image Container with Badges */}
        <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-slate-100">
          {equipment.images?.[0] ? (
            <img src={equipment.images[0]} alt={equipment.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
          ) : (
            <div className="w-full h-full grid place-items-center text-slate-400 bg-slate-100">
              <div className="text-center"><ImageOff className="w-7 h-7 mx-auto mb-1" /><span className="text-xs font-medium">Photo pending</span></div>
            </div>
          )}

          {/* Distance Badge */}
          {equipment.distanceKm !== undefined && (
            <div className="absolute top-3 left-3 bg-slate-900/90 backdrop-blur-md text-white px-2.5 py-1 rounded-full text-xs font-semibold flex items-center space-x-1 shadow-xs">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span>{equipment.distanceKm} km away</span>
            </div>
          )}

          {/* Availability Badge */}
          <div className={`absolute top-3 right-3 text-white px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide shadow-xs ${isBooked ? 'bg-amber-600' : 'bg-emerald-600'}`}>
            {equipment.availabilityStatus}
          </div>

          {/* HP Badge Overlay */}
          <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-md text-slate-900 px-2.5 py-1 rounded-lg text-xs font-bold flex items-center space-x-1 shadow-xs border border-slate-200">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>{equipment.horsePower} HP</span>
          </div>

          {/* Category Tag */}
          <div className="absolute bottom-3 right-3 bg-slate-900/80 text-slate-200 px-2 py-0.5 rounded text-[10px] font-semibold">
            {equipment.categoryName}
          </div>
        </div>

        {/* Details Content */}
        <div className="p-4 sm:p-5">
          
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold text-emerald-700 uppercase tracking-wider text-[11px]">
              {equipment.brand} • {equipment.model}
            </span>
            <div className="flex items-center space-x-1 text-amber-500 font-bold">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>{Number(equipment.averageRating || 0).toFixed(1)}</span>
              <span className="text-slate-400 font-normal">({equipment.totalReviews})</span>
            </div>
          </div>

          <h3
            onClick={() => onSelectEquipment(equipment)}
            className="text-base font-bold text-slate-900 group-hover:text-emerald-600 transition cursor-pointer line-clamp-1 mb-2"
            title={equipment.name}
          >
            {equipment.name}
          </h3>

          <p className="text-xs text-slate-600 line-clamp-2 mb-3">
            {equipment.description}
          </p>

          {/* Specifications Pills */}
          <div className="grid grid-cols-2 gap-2 mb-4 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs text-slate-600">
            <div className="flex items-center space-x-1.5">
              <Fuel className="w-3.5 h-3.5 text-emerald-600" />
              <span className="truncate">{equipment.fuelType}</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span className="truncate">{equipment.condition} Condition</span>
            </div>
          </div>

          {/* Location Summary */}
          <div className="flex items-center space-x-1 text-xs text-slate-500 mb-3">
            <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <span className="truncate">{equipment.location.village}, {equipment.location.district}, {equipment.location.state}</span>
          </div>

        </div>
      </div>

      {/* Pricing & Booking Action */}
      <div className="p-4 sm:p-5 pt-0 border-t border-slate-100 flex items-center justify-between mt-auto">
        <div>
          <div className="text-[10px] text-slate-400 font-semibold uppercase">Daily Rate</div>
          <div className="text-lg font-bold text-slate-900">
            ₹{equipment.dailyPrice.toLocaleString('en-IN')}
            <span className="text-xs text-slate-500 font-normal"> / day</span>
          </div>
          <div className="text-[10px] text-slate-500 font-medium">
            ₹{equipment.hourlyPrice} / hr
          </div>
        </div>

        <button
          onClick={() => onOpenBookingModal(equipment)}
          disabled={isBooked || Boolean(currentUser && !canBook)}
          title={isBooked ? 'This machinery is currently booked' : canBook || !currentUser ? 'Open the booking form' : 'Only farmer accounts can book machinery'}
          className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-500 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-xs flex items-center space-x-1.5"
        >
          <CalendarCheck className="w-3.5 h-3.5" />
          <span>{bookingLabel}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
