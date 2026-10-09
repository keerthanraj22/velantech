import React from 'react';
import { WeatherData } from '../types';
import { CloudRain, Sun, Wind, Droplets, AlertTriangle, CloudLightning } from 'lucide-react';

interface WeatherWidgetProps {
  weather: WeatherData;
}

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({ weather }) => {
  return (
    <div className="bg-emerald-50/80 text-slate-900 p-5 rounded-2xl shadow-xs border border-emerald-100">
      
      {/* Top Current Weather Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center space-x-2">
            <CloudRain className="w-5 h-5 text-emerald-600 animate-pulse" />
            <h3 className="text-base font-bold text-slate-900">
              {weather.city}, {weather.district}
            </h3>
          </div>
          <p className="text-xs text-slate-600 mt-0.5">{weather.condition}</p>
        </div>

        <div className="flex items-baseline space-x-2">
          <span className="text-3xl font-extrabold text-slate-900">{weather.tempC}°C</span>
          <span className="text-xs text-emerald-700 font-semibold">{weather.rainProbability}% Rain Prob.</span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-3 gap-2 bg-white/80 p-3 rounded-xl border border-emerald-100 text-xs mb-4">
        <div className="flex items-center space-x-2">
          <Droplets className="w-4 h-4 text-emerald-600" />
          <div>
            <div className="text-[10px] text-slate-500 uppercase font-medium">Humidity</div>
            <div className="font-bold text-slate-800">{weather.humidity}%</div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Wind className="w-4 h-4 text-emerald-600" />
          <div>
            <div className="text-[10px] text-slate-500 uppercase font-medium">Wind Speed</div>
            <div className="font-bold text-slate-800">{weather.windSpeedKm} km/h</div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <CloudLightning className="w-4 h-4 text-amber-500" />
          <div>
            <div className="text-[10px] text-slate-500 uppercase font-medium">Rain Forecast</div>
            <div className="font-bold text-slate-800">{weather.rainProbability}%</div>
          </div>
        </div>
      </div>

      {/* Crop Advisory Banner */}
      {weather.alert && (
        <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl mb-4 flex items-start space-x-2.5 text-xs text-amber-900">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-amber-800">Agricultural Advisory: </span>
            <span>{weather.alert}</span>
          </div>
        </div>
      )}

      {/* 5-Day Forecast Row */}
      <div className="grid grid-cols-5 gap-2 text-center text-xs">
        {weather.forecast.map((f, i) => (
          <div key={i} className="bg-white/80 p-2 rounded-xl border border-emerald-100">
            <div className="text-[10px] text-slate-500 font-semibold">{f.day}</div>
            <div className="text-sm font-bold text-slate-900 my-0.5">{f.temp}°</div>
            <div className="text-[9px] text-emerald-700 font-medium truncate">{f.rainProb}% Rain</div>
          </div>
        ))}
      </div>

    </div>
  );
};
