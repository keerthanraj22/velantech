import React, { useState } from 'react';
import { Equipment, User } from '../types';
import {
  ArrowLeft,
  Star,
  MapPin,
  ShieldCheck,
  Truck,
  Fuel,
  Zap,
  Phone,
  Calendar,
  MessageCircle,
  Video,
  CheckCircle2,
  Clock
} from 'lucide-react';

interface EquipmentDetailViewProps {
  equipment: Equipment & { distanceKm?: number };
  currentUser: User | null;
  onBack: () => void;
  onOpenBookingModal: (eq: Equipment) => void;
}

export const EquipmentDetailView: React.FC<EquipmentDetailViewProps> = ({
  equipment,
  currentUser,
  onBack,
  onOpenBookingModal
}) => {
  const [activeImage, setActiveImage] = useState<string>(equipment.images[0]);
  const canBook = currentUser?.role === 'farmer';
  const isBooked = equipment.availabilityStatus === 'Booked';
  const bookingLabel = isBooked ? 'Machinery is booked' : !currentUser ? 'Sign in to book' : canBook ? 'Book machinery now' : 'Farmer booking only';

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center space-x-2 text-xs font-bold text-emerald-900 bg-white hover:bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-900/10 shadow-sm transition"
      >
        <ArrowLeft className="w-4 h-4 text-emerald-700" />
        <span>Back to Machinery Directory</span>
      </button>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Image Gallery & Specs */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Active Image Display */}
          <div className="bg-white rounded-3xl overflow-hidden shadow-md border border-emerald-900/10 p-2">
            <div className="relative h-72 sm:h-96 w-full rounded-2xl overflow-hidden bg-gray-100">
              <img
                src={activeImage}
                alt={equipment.name}
                className="w-full h-full object-cover"
              />
              <span className={`absolute top-4 right-4 text-white px-3 py-1 rounded-full text-xs font-extrabold uppercase shadow ${isBooked ? 'bg-amber-600' : 'bg-emerald-700'}`}>
                {equipment.availabilityStatus}
              </span>
            </div>

            {/* Thumbnail Row */}
            {equipment.images.length > 1 && (
              <div className="flex space-x-2 p-2 overflow-x-auto">
                {equipment.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(img)}
                    className={`w-20 h-16 rounded-xl overflow-hidden border-2 transition ${
                      activeImage === img ? 'border-amber-400 ring-2 ring-amber-400/50' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="Thumb" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Technical Specifications */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-emerald-900/10 space-y-4">
            <h3 className="text-base font-extrabold text-emerald-950 border-b border-gray-100 pb-2">
              Technical Specifications & Performance
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div className="bg-emerald-50/60 p-3 rounded-2xl border border-emerald-100">
                <span className="text-[10px] text-gray-500 font-bold uppercase block">Horsepower</span>
                <span className="text-sm font-black text-emerald-950 flex items-center space-x-1 mt-0.5">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span>{equipment.horsePower} HP</span>
                </span>
              </div>

              <div className="bg-emerald-50/60 p-3 rounded-2xl border border-emerald-100">
                <span className="text-[10px] text-gray-500 font-bold uppercase block">Fuel Type</span>
                <span className="text-sm font-black text-emerald-950 flex items-center space-x-1 mt-0.5">
                  <Fuel className="w-4 h-4 text-emerald-600" />
                  <span>{equipment.fuelType}</span>
                </span>
              </div>

              <div className="bg-emerald-50/60 p-3 rounded-2xl border border-emerald-100">
                <span className="text-[10px] text-gray-500 font-bold uppercase block">Manufacturing Year</span>
                <span className="text-sm font-black text-emerald-950 mt-0.5 block">{equipment.manufacturingYear}</span>
              </div>

              <div className="bg-emerald-50/60 p-3 rounded-2xl border border-emerald-100">
                <span className="text-[10px] text-gray-500 font-bold uppercase block">Condition</span>
                <span className="text-sm font-black text-emerald-950 flex items-center space-x-1 mt-0.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>{equipment.condition}</span>
                </span>
              </div>

              <div className="bg-emerald-50/60 p-3 rounded-2xl border border-emerald-100">
                <span className="text-[10px] text-gray-500 font-bold uppercase block">Hydraulics / Capacity</span>
                <span className="text-xs font-bold text-gray-800 mt-0.5 block">{equipment.capacity}</span>
              </div>

              <div className="bg-emerald-50/60 p-3 rounded-2xl border border-emerald-100">
                <span className="text-[10px] text-gray-500 font-bold uppercase block">Registration No</span>
                <span className="text-xs font-bold text-gray-800 mt-0.5 block">{equipment.registrationNumber}</span>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Equipment Description</h4>
              <p className="text-xs text-gray-600 leading-relaxed">{equipment.description}</p>
            </div>
          </div>

        </div>

        {/* Right Column: Pricing & Booking Action */}
        <div className="space-y-6">
          
          {/* Booking Card */}
          <div className="bg-white rounded-3xl p-6 shadow-lg border border-emerald-900/10 space-y-4 sticky top-24">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-400 uppercase">Rental Rate</span>
                <span className="text-xs font-bold bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full">
                  Admin Verified
                </span>
              </div>
              <div className="text-2xl font-black text-emerald-950 mt-1">
                ₹{equipment.dailyPrice.toLocaleString('en-IN')}
                <span className="text-xs text-gray-500 font-normal"> / day</span>
              </div>
              <div className="text-xs text-amber-800 font-bold mt-0.5">
                Hourly: ₹{equipment.hourlyPrice} / hr • Deposit: ₹{equipment.depositAmount}
              </div>
            </div>

            {/* Provider Info Card */}
            <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 space-y-2">
              <span className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider block">
                Equipment Provider
              </span>
              <div className="font-extrabold text-xs text-emerald-950">{equipment.providerName}</div>
              <div className="flex items-center space-x-1 text-xs text-gray-600">
                <Phone className="w-3.5 h-3.5 text-emerald-700" />
                <span>{equipment.providerPhone}</span>
              </div>
              <div className="flex items-center space-x-1 text-xs text-gray-600">
                <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                <span>{equipment.location.village}, {equipment.location.district}</span>
              </div>
            </div>

            <button
              onClick={() => onOpenBookingModal(equipment)}
              disabled={isBooked || Boolean(currentUser && !canBook)}
              className="w-full bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-200 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-extrabold py-3.5 rounded-2xl text-xs uppercase tracking-wider transition shadow-lg flex items-center justify-center space-x-2"
            >
              <Calendar className="w-4 h-4" />
              <span>{bookingLabel}</span>
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};
