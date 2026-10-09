import React, { useEffect, useRef, useState } from 'react';
import { User, EquipmentCategory, Equipment } from '../types';
import { X, Upload, Trash2, ShieldAlert, Tractor, Camera, MapPin } from 'lucide-react';
import { createEquipment } from '../services/api';

interface AddEquipmentModalProps {
  currentUser: User | null;
  categories: EquipmentCategory[];
  onClose: () => void;
  onSuccess: () => void;
}

type EquipmentDefaults = {
  brand: string;
  model: string;
  power: number;
  powerLabel: string;
  powerUnit: string;
  fuelType: Equipment['fuelType'];
  hourlyPrice: number;
  dailyPrice: number;
  weeklyPrice: number;
  depositAmount: number;
  deliveryCharge: number;
  titleExample: string;
};

const CATEGORY_DEFAULTS: Record<string, EquipmentDefaults> = {
  Tractor: { brand: 'Mahindra', model: '575 DI XP Plus', power: 45, powerLabel: 'Horsepower', powerUnit: 'HP', fuelType: 'Diesel', hourlyPrice: 350, dailyPrice: 2500, weeklyPrice: 15000, depositAmount: 2500, deliveryCharge: 20, titleExample: 'Mahindra 575 DI 45 HP Tractor' },
  'Power Tiller': { brand: 'VST', model: 'Shakti 135 DI', power: 13, powerLabel: 'Horsepower', powerUnit: 'HP', fuelType: 'Diesel', hourlyPrice: 180, dailyPrice: 1200, weeklyPrice: 7000, depositAmount: 1500, deliveryCharge: 15, titleExample: 'VST Shakti 13 HP Power Tiller' },
  Rotavator: { brand: 'Fieldking', model: 'Regular Plus 7 ft', power: 45, powerLabel: 'Tractor power required', powerUnit: 'HP', fuelType: 'Manual', hourlyPrice: 220, dailyPrice: 1500, weeklyPrice: 9000, depositAmount: 2000, deliveryCharge: 20, titleExample: 'Fieldking 7 ft Rotavator' },
  Harvester: { brand: 'Kubota', model: 'DC-70G', power: 70, powerLabel: 'Horsepower', powerUnit: 'HP', fuelType: 'Diesel', hourlyPrice: 1200, dailyPrice: 9000, weeklyPrice: 54000, depositAmount: 10000, deliveryCharge: 40, titleExample: 'Kubota DC-70G Combine Harvester' },
  'Drone Sprayer': { brand: 'DJI', model: 'Agras T25', power: 25, powerLabel: 'Spray tank capacity', powerUnit: 'L', fuelType: 'Electric', hourlyPrice: 750, dailyPrice: 5000, weeklyPrice: 30000, depositAmount: 10000, deliveryCharge: 10, titleExample: 'DJI Agras T25 Drone Sprayer' },
  'Rice Transplanter': { brand: 'Kubota', model: 'SPV-8', power: 21, powerLabel: 'Horsepower', powerUnit: 'HP', fuelType: 'Diesel', hourlyPrice: 500, dailyPrice: 3500, weeklyPrice: 21000, depositAmount: 5000, deliveryCharge: 25, titleExample: 'Kubota 8-row Rice Transplanter' },
  'Plough & Cultivator': { brand: 'Mahindra', model: 'Heavy Duty Cultivator', power: 45, powerLabel: 'Tractor power required', powerUnit: 'HP', fuelType: 'Manual', hourlyPrice: 150, dailyPrice: 1000, weeklyPrice: 6000, depositAmount: 1500, deliveryCharge: 15, titleExample: 'Heavy Duty 9 Tyne Cultivator' },
  'Water Pump': { brand: 'Kirloskar', model: 'Jalraaj 5 HP', power: 5, powerLabel: 'Motor power', powerUnit: 'HP', fuelType: 'Diesel', hourlyPrice: 100, dailyPrice: 700, weeklyPrice: 4000, depositAmount: 1000, deliveryCharge: 10, titleExample: 'Kirloskar 5 HP Water Pump' },
  'Mulcher & Thresher': { brand: 'Sonalika', model: 'Super Straw Mulcher', power: 50, powerLabel: 'Tractor power required', powerUnit: 'HP', fuelType: 'Manual', hourlyPrice: 300, dailyPrice: 2200, weeklyPrice: 13000, depositAmount: 3000, deliveryCharge: 25, titleExample: 'Sonalika Super Straw Mulcher' },
  'Excavator & Loader': { brand: 'JCB', model: '3DX', power: 74, powerLabel: 'Horsepower', powerUnit: 'HP', fuelType: 'Diesel', hourlyPrice: 1500, dailyPrice: 11000, weeklyPrice: 66000, depositAmount: 15000, deliveryCharge: 50, titleExample: 'JCB 3DX Backhoe Loader' }
};

export const AddEquipmentModal: React.FC<AddEquipmentModalProps> = ({
  currentUser,
  categories,
  onClose,
  onSuccess
}) => {
  const isAuthorized = currentUser?.role === 'provider' || currentUser?.role === 'admin';

  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || 'cat-1');
  const [brand, setBrand] = useState('Mahindra');
  const [model, setModel] = useState('2025 Heavy Duty');
  const [horsePower, setHorsePower] = useState(45);
  const [fuelType, setFuelType] = useState('Diesel');
  const [regNo, setRegNo] = useState('');
  const [dailyPrice, setDailyPrice] = useState(2500);
  const [hourlyPrice, setHourlyPrice] = useState(350);
  const [weeklyPrice, setWeeklyPrice] = useState(15000);
  const [depositAmount, setDepositAmount] = useState(2500);
  const [deliveryChargePerKm, setDeliveryChargePerKm] = useState(20);
  const [district, setDistrict] = useState(currentUser?.address?.district || 'Coimbatore');
  const [village, setVillage] = useState(currentUser?.address?.village || 'Pollachi');
  const [stateName, setStateName] = useState(currentUser?.address?.state || 'Tamil Nadu');
  const [pincode, setPincode] = useState(currentUser?.address?.pincode || '641001');
  const [longitude, setLongitude] = useState(currentUser?.address?.longitude || 77.0048);
  const [latitude, setLatitude] = useState(currentUser?.address?.latitude || 10.6609);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [description, setDescription] = useState('');
  
  // Real Uploaded Photos State (Base64 Data URLs)
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [locationMsg, setLocationMsg] = useState<{ text: string; isError: boolean } | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const selectedCategory = categories.find((category) => category.id === categoryId);
  const categoryDefaults = CATEGORY_DEFAULTS[selectedCategory?.name || 'Tractor'] || CATEGORY_DEFAULTS.Tractor;

  const applyCategoryDefaults = (nextCategoryId: string) => {
    const nextCategory = categories.find((category) => category.id === nextCategoryId);
    const defaults = CATEGORY_DEFAULTS[nextCategory?.name || 'Tractor'] || CATEGORY_DEFAULTS.Tractor;
    setCategoryId(nextCategoryId);
    setBrand(defaults.brand);
    setModel(defaults.model);
    setHorsePower(defaults.power);
    setFuelType(defaults.fuelType);
    setHourlyPrice(defaults.hourlyPrice);
    setDailyPrice(defaults.dailyPrice);
    setWeeklyPrice(defaults.weeklyPrice);
    setDepositAmount(defaults.depositAmount);
    setDeliveryChargePerKm(defaults.deliveryCharge);
  };

  const stopCamera = () => {
    cameraStreamRef.current?.getTracks().forEach((track) => track.stop());
    cameraStreamRef.current = null;
    setCameraOpen(false);
  };

  useEffect(() => stopCamera, []);

  useEffect(() => {
    if (cameraOpen && videoRef.current && cameraStreamRef.current) {
      videoRef.current.srcObject = cameraStreamRef.current;
      void videoRef.current.play();
    }
  }, [cameraOpen]);

  const openCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setErrorMsg('Camera access is not supported by this browser. Please choose a photo from your device.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false
      });
      cameraStreamRef.current = stream;
      setErrorMsg('');
      setCameraOpen(true);
    } catch (error) {
      console.error('Unable to access camera', error);
      setErrorMsg('Camera permission was denied or no camera is available. Allow camera access in your browser settings and try again.');
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height);
    setUploadedImages((previous) => [...previous, canvas.toDataURL('image/jpeg', 0.9)]);
    setErrorMsg('');
    stopCamera();
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationMsg({ text: 'Location access is not supported by this browser. Enter the address manually.', isError: true });
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${position.coords.latitude}&lon=${position.coords.longitude}&zoom=18&addressdetails=1`);
          if (!response.ok) throw new Error('Address lookup failed');
          const result = await response.json();
          const address = result.address || {};
          setVillage(address.village || address.town || address.city || address.municipality || address.suburb || '');
          setDistrict(address.county || address.state_district || address.city_district || '');
          setStateName(address.state || '');
          setPincode(address.postcode || '');
          setLocationMsg({ text: 'Current location and address selected. You can edit any field.', isError: false });
        } catch {
          setLocationMsg({ text: 'Current map coordinates were selected, but the address could not be found. Please enter the address manually.', isError: true });
        } finally {
          setIsGettingLocation(false);
        }
      },
      () => {
        setIsGettingLocation(false);
        setLocationMsg({ text: 'Location permission was denied. Allow it in the browser address-bar settings, then try again.', isError: true });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Handle file upload from device memory / camera / file picker
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const selectedFiles: File[] = Array.from(files as FileList);
    selectedFiles.forEach((file) => {
      if (!file.type.startsWith('image/')) {
        setErrorMsg('Please select valid image files (JPG, PNG, WebP).');
        return;
      }

      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const base64Data = uploadEvent.target?.result as string;
        if (base64Data) {
          setUploadedImages((prev) => [...prev, base64Data]);
          setErrorMsg('');
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !isAuthorized) {
      setErrorMsg('Please sign in before submitting equipment.');
      return;
    }

    if (!name.trim()) {
      setErrorMsg('Please enter equipment title.');
      return;
    }

    if (uploadedImages.length === 0) {
      setErrorMsg('Please upload at least one real photo of your machinery.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    const payload: Partial<Equipment> = {
      name,
      categoryId,
      categoryName: selectedCategory?.name || 'Tractor',
      brand,
      model,
      manufacturingYear: 2024,
      registrationNumber: regNo || `TN-${Math.floor(10 + Math.random() * 89)}-REG-${Math.floor(1000 + Math.random() * 8999)}`,
      description: description || 'High efficiency farm equipment available for immediate rental.',
      images: uploadedImages,
      hourlyPrice: Number(hourlyPrice),
      dailyPrice: Number(dailyPrice),
      weeklyPrice: Number(weeklyPrice),
      monthlyPrice: Number(dailyPrice) * 22,
      depositAmount: Number(depositAmount),
      fuelType: fuelType as Equipment['fuelType'],
      horsePower: Number(horsePower),
      capacity: `${horsePower} ${categoryDefaults.powerUnit} ${categoryDefaults.powerLabel.toLowerCase()}`,
      condition: 'Excellent' as const,
      location: {
        type: 'Point',
        coordinates: [Number(longitude), Number(latitude)],
        village,
        district,
        state: stateName,
        pincode
      },
      providerId: currentUser.id,
      providerName: currentUser.providerDetails?.businessName || currentUser.name,
      providerPhone: currentUser.phone,
      deliveryAvailable: true,
      deliveryChargePerKm: Number(deliveryChargePerKm)
    };

    const created = await createEquipment(payload, currentUser.role);
    setIsSubmitting(false);

    if (created) {
      window.alert(created.onboardingStatus === 'approved'
        ? 'Equipment published successfully. Farmers can now book it.'
        : 'Equipment submitted for administrator approval. Farmers will be able to book it after an admin approves and publishes the listing.');
      onSuccess();
      onClose();
    } else {
      setErrorMsg('Failed to publish equipment. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-xl border border-slate-200 overflow-hidden my-8">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
              <Tractor className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">List New Farm Equipment</h3>
              <p className="text-xs text-slate-400">Submit equipment with photos for administrator approval</p>
            </div>
          </div>
          <button onClick={() => { stopCamera(); onClose(); }} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {!isAuthorized ? (
          <div className="p-8 text-center space-y-3">
            <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto" />
            <h4 className="text-base font-bold text-slate-900">Access Restricted</h4>
            <p className="text-xs text-slate-600 max-w-sm mx-auto">
              Only equipment providers and administrators can submit machinery. Provider listings are reviewed before they are published for farmers to book.
            </p>
            <button
              onClick={onClose}
              className="mt-2 bg-slate-900 text-white px-5 py-2 rounded-xl text-xs font-bold"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
            
            {errorMsg && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs font-bold">
                {errorMsg}
              </div>
            )}

            {/* REAL PHOTO UPLOAD SECTION */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider">
                    📸 Upload Real Machinery Photos
                  </label>
                  <p className="text-[11px] text-slate-500">
                    Upload real photos from your computer or phone gallery.
                  </p>
                </div>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded border border-emerald-200">
                  {uploadedImages.length} Photo(s) Selected
                </span>
              </div>

              {/* Photo Upload Dropzone */}
              {cameraOpen ? (
                <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-950">
                  <video ref={videoRef} autoPlay playsInline muted className="w-full max-h-72 object-contain" />
                  <div className="flex justify-center gap-2 p-3 bg-white">
                    <button type="button" onClick={capturePhoto} className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg font-bold">
                      <Camera className="w-4 h-4" /> Capture photo
                    </button>
                    <button type="button" onClick={stopCamera} className="px-3 py-2 rounded-lg font-bold text-slate-600 hover:bg-slate-100">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-2">
                  <button type="button" onClick={openCamera} className="border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-white rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition text-center group">
                    <Camera className="w-7 h-7 text-slate-400 group-hover:text-emerald-600 transition mb-1" />
                    <span className="font-bold text-slate-800 text-xs">Open camera</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">Allow access to take a photo.</span>
                  </button>
                  <label className="border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-white rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition text-center group">
                    <Upload className="w-7 h-7 text-slate-400 group-hover:text-emerald-600 transition mb-1" />
                    <span className="font-bold text-slate-800 text-xs">Choose from gallery</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">Multiple photos are supported.</span>
                    <input type="file" accept="image/*" multiple capture="environment" onChange={handleFileUpload} className="hidden" />
                  </label>
                </div>
              )}

              {/* Thumbnails Preview Grid */}
              {uploadedImages.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-2">
                  {uploadedImages.map((imgSrc, idx) => (
                    <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-100 aspect-video">
                      <img src={imgSrc} alt={`Upload ${idx}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="absolute top-1 right-1 bg-rose-600 text-white p-1 rounded-full opacity-90 hover:opacity-100 transition shadow-xs"
                        title="Remove photo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Equipment Name & Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Equipment Title *</label>
                <input
                  type="text"
                  required
                  placeholder={`e.g. ${categoryDefaults.titleExample}`}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Category *</label>
                <select
                  value={categoryId}
                  onChange={(e) => applyCategoryDefaults(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-slate-800 font-semibold"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Brand, HP, Fuel Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Brand</label>
                <input
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Model</label>
                <input
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">{categoryDefaults.powerLabel} ({categoryDefaults.powerUnit})</label>
                <input
                  type="number"
                  value={horsePower}
                  onChange={(e) => setHorsePower(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Fuel Type</label>
                <select
                  value={fuelType}
                  onChange={(e) => setFuelType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-slate-800"
                >
                  <option>Diesel</option>
                  <option>Petrol</option>
                  <option>Electric</option>
                  <option>Hybrid</option>
                  <option>Manual</option>
                </select>
              </div>
            </div>

            {/* Exact Price Rates */}
            <div className="bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-100 space-y-2">
              <label className="block font-bold text-emerald-900 uppercase text-[10px] tracking-wider">
                Exact Rental Pricing Breakdown (₹)
              </label>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] text-slate-600 font-bold">Hourly Rate (₹)</label>
                  <input
                    type="number"
                    value={hourlyPrice}
                    onChange={(e) => setHourlyPrice(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-600 font-bold">Daily Rate (₹)</label>
                  <input
                    type="number"
                    value={dailyPrice}
                    onChange={(e) => setDailyPrice(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-600 font-bold">Weekly Rate (₹)</label>
                  <input
                    type="number"
                    value={weeklyPrice}
                    onChange={(e) => setWeeklyPrice(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 font-bold text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="block text-[10px] text-slate-600 font-bold">Security Deposit (₹)</label>
                  <input
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-600 font-bold">Delivery Fee / Km (₹)</label>
                  <input
                    type="number"
                    value={deliveryChargePerKm}
                    onChange={(e) => setDeliveryChargePerKm(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 font-bold text-slate-900"
                  />
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <label className="block font-bold text-slate-900">Equipment location</label>
                  <p className="text-[10px] text-slate-500">This is where farmers will see the machinery on the map.</p>
                </div>
                <button type="button" onClick={useCurrentLocation} disabled={isGettingLocation} className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-[10px] font-bold">
                  <MapPin className="w-3.5 h-3.5" />
                  {isGettingLocation ? 'Finding location...' : 'Use my location'}
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block font-bold text-slate-700 mb-1">District</label>
                <input
                  type="text"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  placeholder="e.g. Coimbatore"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Village / Yard Town</label>
                <input
                  type="text"
                  value={village}
                  onChange={(e) => setVillage(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">State</label>
                <input type="text" value={stateName} onChange={(e) => setStateName(e.target.value)} placeholder="e.g. Tamil Nadu" className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800" />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">PIN code</label>
                <input type="text" inputMode="numeric" value={pincode} onChange={(e) => setPincode(e.target.value)} placeholder="e.g. 641001" className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800" />
              </div>
              </div>
              {locationMsg && <p className={`text-[10px] font-medium ${locationMsg.isError ? 'text-amber-700' : 'text-emerald-700'}`}>{locationMsg.text}</p>}
            </div>

            {/* Description */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Description & Attachments Specs</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mention implement attachments included (e.g. 7-ft rotavator, double clutch, power steering)..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => { stopCamera(); onClose(); }}
                className="px-4 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition disabled:opacity-50"
              >
                {isSubmitting ? 'Publishing Equipment...' : 'Publish Machinery Listing'}
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};
