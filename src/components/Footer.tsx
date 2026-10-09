
import React from 'react';
import { PhoneCall, ShieldCheck, MapPin, Mail, Heart, HelpCircle } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 pt-12 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          
          {/* Brand Info */}
          <div>
            <img
              src="/images/velantech-brand-lockup.png"
              alt="VELANTECH — Smart Technology. Better Farming."
              className="velantech-brand-lockup mb-4 h-32 w-32"
            />
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              India's premier location-based agricultural equipment sharing & rental platform connecting local farmers with trusted equipment providers.
            </p>
            <div className="flex items-center space-x-2 text-xs text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Admin Verified Machinery & Operators</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold text-slate-200 mb-4 uppercase tracking-wider">Quick Navigation</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><a href="#equipment" className="hover:text-white transition">Nearby Equipment Directory</a></li>
              <li><a href="#knowledge" className="hover:text-white transition">Government Subsidy Schemes</a></li>
              <li><a href="#weather" className="hover:text-white transition">Agricultural Weather Forecast</a></li>
              <li><a href="#provider" className="hover:text-white transition">Register as Equipment Provider</a></li>
            </ul>
          </div>

          {/* Equipment Categories */}
          <div>
            <h4 className="text-xs font-bold text-slate-200 mb-4 uppercase tracking-wider">Top Machinery</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>4WD Heavy Tractors (45 - 75 HP)</li>
              <li>Combine Paddy & Wheat Harvesters</li>
              <li>Drone Spraying Equipment</li>
              <li>Rotavators & Rotary Tillers</li>
              <li>Solar & Diesel Water Pumps</li>
            </ul>
          </div>

          {/* Contact & Farmer Helpline */}
          <div>
            <h4 className="text-xs font-bold text-slate-200 mb-4 uppercase tracking-wider">Farmer Helpline</h4>
            <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/60 space-y-3">
              <div className="flex items-center space-x-3 text-emerald-400">
                <PhoneCall className="w-5 h-5 text-emerald-400" />
                <div>
                  <div className="text-[10px] uppercase text-slate-400 font-semibold">Toll-Free Kisan Helpline</div>
                  <div className="text-base font-bold text-white">1800-425-AGRI (2474)</div>
                </div>
              </div>
              <div className="flex items-center space-x-2 text-xs text-slate-300">
                <Mail className="w-4 h-4 text-emerald-500" />
                <span>support@velantech.in</span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-slate-300">
                <MapPin className="w-4 h-4 text-emerald-500" />
                <span>Coimbatore, Tamil Nadu & Pan-India</span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom copyright */}
        <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
          <div>
            © {new Date().getFullYear()} VELANTECH. All rights reserved.
          </div>
          <div className="flex items-center space-x-1 mt-2 sm:mt-0">
            <span>Empowering Indian Farmers with</span>
            <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500 inline" />
            <span>& Modern Mechanization</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
