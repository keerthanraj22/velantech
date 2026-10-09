import { Equipment, EquipmentCategory, User, Booking, KnowledgeArticle, WeatherData } from '../types';

export const INITIAL_CATEGORIES: EquipmentCategory[] = [
  { id: 'cat-1', name: 'Tractor', iconName: 'Tractor', description: '2WD & 4WD tractors from 25 HP to 75 HP for all farming operations', itemCount: 18 },
  { id: 'cat-2', name: 'Power Tiller', iconName: 'Gauge', description: 'Compact power tillers for small landholdings and puddling operations', itemCount: 9 },
  { id: 'cat-3', name: 'Rotavator', iconName: 'RotateCw', description: 'Rotary tillers for soil preparation and weed removal', itemCount: 14 },
  { id: 'cat-4', name: 'Harvester', iconName: 'Wheat', description: 'Multi-crop combine harvesters for paddy, wheat, and maize', itemCount: 7 },
  { id: 'cat-5', name: 'Drone Sprayer', iconName: 'Plane', description: 'Precision agricultural drones for fast fertilizer and pesticide spraying', itemCount: 6 },
  { id: 'cat-6', name: 'Rice Transplanter', iconName: 'Sprout', description: 'Walk-behind and riding type automatic paddy transplanters', itemCount: 5 },
  { id: 'cat-7', name: 'Plough & Cultivator', iconName: 'Grid', description: 'Disc ploughs, mouldboard ploughs, and heavy-duty cultivators', itemCount: 12 },
  { id: 'cat-8', name: 'Water Pump', iconName: 'Droplets', description: 'High-volume diesel and solar water pumps for irrigation', itemCount: 11 },
  { id: 'cat-9', name: 'Mulcher & Thresher', iconName: 'Scissors', description: 'Crop residue shredders, straw balers, and grain threshers', itemCount: 8 },
  { id: 'cat-10', name: 'Excavator & Loader', iconName: 'Truck', description: 'Mini excavators and front loaders for farm bunding and land leveling', itemCount: 4 },
];

export const INITIAL_USERS: User[] = [
  {
    id: 'usr-admin-1',
    name: 'Rajesh Sharma (Admin)',
    email: 'admin@agriequip.com',
    phone: '+91 98765 43210',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    address: {
      village: 'Coimbatore HQ',
      district: 'Coimbatore',
      state: 'Tamil Nadu',
      pincode: '641001',
      latitude: 11.0168,
      longitude: 76.9558,
      formattedAddress: 'VELANTECH Hub, DB Road, RS Puram, Coimbatore, Tamil Nadu 641001'
    },
    isVerified: true,
    status: 'active',
    language: 'English',
    createdAt: '2025-01-01'
  },
  {
    id: 'usr-provider-1',
    name: 'Kovai Agro Equipment Rentals',
    email: 'provider.kovai@agriequip.com',
    phone: '+91 94432 10987',
    role: 'provider',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150',
    address: {
      village: 'Pollachi',
      district: 'Coimbatore',
      state: 'Tamil Nadu',
      pincode: '642001',
      latitude: 10.6609,
      longitude: 77.0048,
      formattedAddress: 'Main Road, Pollachi, Coimbatore, Tamil Nadu 642001'
    },
    isVerified: true,
    status: 'active',
    language: 'Tamil',
    createdAt: '2025-01-15',
    providerDetails: {
      businessName: 'Kovai Agri Machinery Center',
      gstNumber: '33AABCU9603R1ZM',
      bankName: 'State Bank of India',
      accountNumber: '30987654321',
      ifscCode: 'SBIN0001234',
      walletBalance: 48500,
      rating: 4.8,
      totalRentals: 142
    }
  },
  {
    id: 'usr-provider-2',
    name: 'Ludhiana Machinery Yard',
    email: 'provider.ludhiana@agriequip.com',
    phone: '+91 98140 12345',
    role: 'provider',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    address: {
      village: 'Jagraon',
      district: 'Ludhiana',
      state: 'Punjab',
      pincode: '142026',
      latitude: 30.7831,
      longitude: 75.4746,
      formattedAddress: 'GT Road, Jagraon, Ludhiana, Punjab 142026'
    },
    isVerified: true,
    status: 'active',
    language: 'Punjabi',
    createdAt: '2025-02-01',
    providerDetails: {
      businessName: 'Punjab Farmer Tools Co.',
      gstNumber: '03AABCP8821Q1Z8',
      bankName: 'HDFC Bank',
      accountNumber: '501002345678',
      ifscCode: 'HDFC0000456',
      walletBalance: 72000,
      rating: 4.9,
      totalRentals: 210
    }
  },
  {
    id: 'usr-farmer-1',
    name: 'Mani Kandan',
    email: 'manikandan@gmail.com',
    phone: '+91 97890 54321',
    role: 'farmer',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    address: {
      village: 'Sulur',
      district: 'Coimbatore',
      state: 'Tamil Nadu',
      pincode: '641402',
      latitude: 11.0264,
      longitude: 77.1260,
      formattedAddress: 'Farming Belt North, Sulur, Coimbatore, Tamil Nadu 641402'
    },
    isVerified: true,
    status: 'active',
    language: 'Tamil',
    createdAt: '2025-02-10',
    farmerDetails: {
      landSizeAcres: 12.5,
      primaryCrops: ['Paddy', 'Sugarcane', 'Cotton'],
      kisanCreditCardNo: 'KCC-TN-8923-2024'
    }
  },
];

export const INITIAL_EQUIPMENT: Equipment[] = [
  {
    id: 'eq-1',
    name: 'Mahindra 575 DI 45 HP Tractor',
    categoryId: 'cat-1',
    categoryName: 'Tractor',
    brand: 'Mahindra',
    model: '575 DI XP Plus',
    manufacturingYear: 2024,
    registrationNumber: 'TN 37 AF 4512',
    description: 'High torque 45 HP fuel efficient diesel tractor equipped with power steering and dual clutch. Ideal for ploughing, rotavating, and heavy trailer transport.',
    images: [
      'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=800',
      'https://images.unsplash.com/photo-1530267981375-f0de937f5f13?w=800'
    ],
    videos: ['https://www.w3schools.com/html/mov_bbb.mp4'],
    hourlyPrice: 450,
    dailyPrice: 2800,
    weeklyPrice: 16500,
    monthlyPrice: 58000,
    depositAmount: 3000,
    fuelType: 'Diesel',
    horsePower: 45,
    capacity: '1600 kg hydraulics capacity',
    condition: 'Excellent',
    location: {
      type: 'Point',
      coordinates: [77.0048, 10.6609], // [lng, lat]
      village: 'Pollachi',
      district: 'Coimbatore',
      state: 'Tamil Nadu',
      pincode: '642001'
    },
    availabilityStatus: 'Available',
    maintenanceStatus: 'Operational',
    averageRating: 4.9,
    totalReviews: 28,
    providerId: 'usr-provider-1',
    providerName: 'Kovai Agro Equipment Rentals',
    providerPhone: '+91 94432 10987',
    deliveryAvailable: true,
    deliveryChargePerKm: 25,
    createdAt: '2025-01-20'
  },
  {
    id: 'eq-2',
    name: 'Kubota MU4501 4WD High Performance Tractor',
    categoryId: 'cat-1',
    categoryName: 'Tractor',
    brand: 'Kubota',
    model: 'MU4501 4WD',
    manufacturingYear: 2024,
    registrationNumber: 'TN 38 BR 9081',
    description: '45 HP 4WD Japanese technology tractor with quad-trans system and ultra-low noise engine. Perfect for wet paddy field operations and heavy muddy conditions.',
    images: [
      'https://images.unsplash.com/photo-1589923188900-85dae523342b?w=800',
      'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=800'
    ],
    hourlyPrice: 550,
    dailyPrice: 3400,
    weeklyPrice: 20000,
    monthlyPrice: 72000,
    depositAmount: 4000,
    fuelType: 'Diesel',
    horsePower: 45,
    capacity: '1640 kg hydraulic lifting capacity',
    condition: 'Excellent',
    location: {
      type: 'Point',
      coordinates: [76.9558, 11.0168],
      village: 'Coimbatore North',
      district: 'Coimbatore',
      state: 'Tamil Nadu',
      pincode: '641001'
    },
    availabilityStatus: 'Available',
    maintenanceStatus: 'Operational',
    averageRating: 4.8,
    totalReviews: 34,
    providerId: 'usr-provider-1',
    providerName: 'Kovai Agro Equipment Rentals',
    providerPhone: '+91 94432 10987',
    deliveryAvailable: true,
    deliveryChargePerKm: 28,
    createdAt: '2025-01-22'
  },
  {
    id: 'eq-3',
    name: 'Class Paddy Combine Harvester C40',
    categoryId: 'cat-4',
    categoryName: 'Harvester',
    brand: 'Class',
    model: 'CROP TIGER 40',
    manufacturingYear: 2023,
    registrationNumber: 'PB 10 CX 1199',
    description: '76 HP rubber track paddy and wheat combine harvester. Features clean grain separation, low crop loss, and rapid harvesting rate (1.5 acres per hour).',
    images: [
      'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800',
      'https://images.unsplash.com/photo-1589923188900-85dae523342b?w=800'
    ],
    hourlyPrice: 1800,
    dailyPrice: 12000,
    weeklyPrice: 75000,
    monthlyPrice: 260000,
    depositAmount: 10000,
    fuelType: 'Diesel',
    horsePower: 76,
    capacity: '1.5 Acres/Hour rate',
    condition: 'Excellent',
    location: {
      type: 'Point',
      coordinates: [75.4746, 30.7831],
      village: 'Jagraon',
      district: 'Ludhiana',
      state: 'Punjab',
      pincode: '142026'
    },
    availabilityStatus: 'Available',
    maintenanceStatus: 'Operational',
    averageRating: 5.0,
    totalReviews: 19,
    providerId: 'usr-provider-2',
    providerName: 'Ludhiana Machinery Yard',
    providerPhone: '+91 98140 12345',
    deliveryAvailable: true,
    deliveryChargePerKm: 45,
    createdAt: '2025-02-05'
  },
  {
    id: 'eq-4',
    name: 'AgriFly 16L Precision Spraying Drone',
    categoryId: 'cat-5',
    categoryName: 'Drone Sprayer',
    brand: 'AgriFly Tech',
    model: 'T16 Pro Spray',
    manufacturingYear: 2024,
    registrationNumber: 'UIN-AGRI-998822',
    description: 'Autonomous 16-Liter radar obstacle detection agricultural spraying drone with 4 high-pressure centrifugal nozzles. Covers 30 acres in 1 day with zero soil compaction.',
    images: [
      'https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=800',
      'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?w=800'
    ],
    hourlyPrice: 600,
    dailyPrice: 3800,
    weeklyPrice: 22000,
    monthlyPrice: 78000,
    depositAmount: 5000,
    fuelType: 'Electric',
    horsePower: 12,
    capacity: '16 Liter Liquid Tank / 10m spray width',
    condition: 'Excellent',
    location: {
      type: 'Point',
      coordinates: [77.1260, 11.0264],
      village: 'Sulur',
      district: 'Coimbatore',
      state: 'Tamil Nadu',
      pincode: '641402'
    },
    availabilityStatus: 'Available',
    maintenanceStatus: 'Operational',
    averageRating: 4.9,
    totalReviews: 42,
    providerId: 'usr-provider-1',
    providerName: 'Kovai Agro Equipment Rentals',
    providerPhone: '+91 94432 10987',
    deliveryAvailable: true,
    deliveryChargePerKm: 15,
    createdAt: '2025-02-12'
  },
  {
    id: 'eq-5',
    name: 'Shaktiman Heavy Duty 7 Feet Rotavator',
    categoryId: 'cat-3',
    categoryName: 'Rotavator',
    brand: 'Shaktiman',
    model: 'Semi Champion 7ft',
    manufacturingYear: 2024,
    registrationNumber: 'ROT-TN-7712',
    description: 'Heavy duty 54 L-type boron steel blade rotary tiller suitable for 45 HP to 60 HP tractors. Achieves fine seedbed pulverization in single pass.',
    images: [
      'https://images.unsplash.com/photo-1530267981375-f0de937f5f13?w=800',
      'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=800'
    ],
    hourlyPrice: 250,
    dailyPrice: 1500,
    weeklyPrice: 9000,
    monthlyPrice: 32000,
    depositAmount: 2000,
    fuelType: 'Diesel',
    horsePower: 50,
    capacity: '7 Feet Tilling Width',
    condition: 'Good',
    location: {
      type: 'Point',
      coordinates: [77.0048, 10.6609],
      village: 'Pollachi',
      district: 'Coimbatore',
      state: 'Tamil Nadu',
      pincode: '642001'
    },
    availabilityStatus: 'Available',
    maintenanceStatus: 'Operational',
    averageRating: 4.7,
    totalReviews: 18,
    providerId: 'usr-provider-1',
    providerName: 'Kovai Agro Equipment Rentals',
    providerPhone: '+91 94432 10987',
    deliveryAvailable: true,
    deliveryChargePerKm: 20,
    createdAt: '2025-02-18'
  },
  {
    id: 'eq-6',
    name: 'VST Shakti 130 DI Power Tiller 13 HP',
    categoryId: 'cat-2',
    categoryName: 'Power Tiller',
    brand: 'VST Shakti',
    model: '130 DI',
    manufacturingYear: 2023,
    registrationNumber: 'TN 37 PT 4410',
    description: 'Single cylinder water cooled 13 HP power tiller with rotary unit. Excellent for sugarcane trenching, banana garden cultivation, and paddy puddling.',
    images: [
      'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=800'
    ],
    hourlyPrice: 200,
    dailyPrice: 1200,
    weeklyPrice: 7000,
    monthlyPrice: 24000,
    depositAmount: 1500,
    fuelType: 'Diesel',
    horsePower: 13,
    capacity: '600mm Tilling Depth',
    condition: 'Good',
    location: {
      type: 'Point',
      coordinates: [77.1260, 11.0264],
      village: 'Sulur',
      district: 'Coimbatore',
      state: 'Tamil Nadu',
      pincode: '641402'
    },
    availabilityStatus: 'Available',
    maintenanceStatus: 'Operational',
    averageRating: 4.6,
    totalReviews: 21,
    providerId: 'usr-provider-1',
    providerName: 'Kovai Agro Equipment Rentals',
    providerPhone: '+91 94432 10987',
    deliveryAvailable: true,
    deliveryChargePerKm: 15,
    createdAt: '2025-02-20'
  }
];

export const INITIAL_BOOKINGS: Booking[] = [
  {
    id: 'bk-2026-001',
    bookingNumber: 'AGRI-BK-88910',
    equipmentId: 'eq-1',
    equipmentName: 'Mahindra 575 DI 45 HP Tractor',
    equipmentImage: 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=800',
    farmerId: 'usr-farmer-1',
    farmerName: 'Mani Kandan',
    farmerPhone: '+91 97890 54321',
    providerId: 'usr-provider-1',
    providerName: 'Kovai Agro Equipment Rentals',
    startDate: '2026-08-01',
    endDate: '2026-08-03',
    startTime: '07:00',
    endTime: '18:00',
    rentalDurationHours: 33,
    rentalType: 'daily',
    rentalAmount: 8400,
    deliveryCharge: 500,
    depositAmount: 3000,
    gstAmount: 1602,
    totalAmount: 13502,
    bookingStatus: 'Approved',
    paymentStatus: 'Paid',
    paymentMethod: 'UPI',
    razorpayOrderId: 'order_P91283091823',
    razorpayPaymentId: 'pay_Q99120391203',
    deliveryOperatorId: 'usr-delivery-1',
    deliveryStatus: 'Assigned',
    farmerAddress: {
      village: 'Sulur',
      district: 'Coimbatore',
      state: 'Tamil Nadu',
      pincode: '641402',
      latitude: 11.0264,
      longitude: 77.1260,
      formattedAddress: 'Farm Field 12B, Sulur, Coimbatore, Tamil Nadu'
    },
    notes: 'Please deliver early morning at 6:30 AM before sunrise.',
    createdAt: '2026-07-25'
  }
];

export const INITIAL_KNOWLEDGE_ARTICLES: KnowledgeArticle[] = [
  {
    id: 'art-1',
    title: 'PM-KUSUM Scheme 2026: Get 60% Subsidy on Solar Water Pumps',
    category: 'Government Scheme',
    summary: 'Complete guide on eligibility, required documents, and step-by-step online application process for installing solar pumps on farmland.',
    content: 'The Pradhan Mantri Kisan Urja Suraksha evam Utthaan Mahabhiyan (PM-KUSUM) scheme provides up to 60% subsidy for farmers installing stand-alone solar water pumps. Central government provides 30%, state government provides 30%, and bank loan covers 30%.',
    author: 'Ministry of Agriculture',
    readTimeMinutes: 5,
    thumbnail: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=800',
    tags: ['PM-KUSUM', 'Solar Pump', 'Subsidy', 'Irrigation'],
    createdAt: '2026-07-10'
  },
  {
    id: 'art-2',
    title: 'Sub-Mission on Agricultural Mechanization (SMAM) Guide',
    category: 'Government Scheme',
    summary: 'How small and marginal farmers can avail 40% to 50% subsidy on buying or renting heavy tractors and harvesters.',
    content: 'SMAM aims to reach unreached farmers with farm mechanization. Custom Hiring Centers (CHCs) established under SMAM enable local equipment sharing.',
    author: 'VELANTECH Knowledge Team',
    readTimeMinutes: 6,
    thumbnail: 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=800',
    tags: ['SMAM', 'Tractor Subsidy', 'Custom Hiring Center'],
    createdAt: '2026-07-15'
  },
  {
    id: 'art-3',
    title: 'Pre-Rental Checklist: 7 Tractor Safety & Maintenance Inspections',
    category: 'Maintenance',
    summary: 'Crucial checks before operating rented tractors: Engine oil levels, tyre inflation, hydraulic fluid, brake responsiveness, and PTO shaft shield.',
    content: 'Always conduct a 5-minute visual inspection before turning the key. Check for oil leaks under the oil pan, inspect air filter cleanliness, and verify headlights and indicator signals.',
    author: 'Senior Mechanical Engineer',
    readTimeMinutes: 4,
    thumbnail: 'https://images.unsplash.com/photo-1589923188900-85dae523342b?w=800',
    tags: ['Tractor Maintenance', 'Safety Tips', 'Rental Checklist'],
    createdAt: '2026-07-20'
  }
];

export const MOCK_WEATHER: WeatherData = {
  city: 'Coimbatore',
  district: 'Coimbatore',
  tempC: 28,
  condition: 'Partly Cloudy with Light Showers',
  humidity: 78,
  windSpeedKm: 14,
  rainProbability: 35,
  alert: 'Optimal soil moisture conditions for land tilling & fertilizer application today.',
  forecast: [
    { day: 'Today', temp: 28, condition: 'Light Rain', rainProb: 35 },
    { day: 'Tomorrow', temp: 30, condition: 'Sunny', rainProb: 10 },
    { day: 'Thu', temp: 29, condition: 'Partly Cloudy', rainProb: 20 },
    { day: 'Fri', temp: 27, condition: 'Moderate Rain', rainProb: 65 },
    { day: 'Sat', temp: 28, condition: 'Clear Sky', rainProb: 5 }
  ]
};

export const TAMILNADU_DISTRICTS_VILLAGES: Record<string, string[]> = {
  'Coimbatore': ['Pollachi', 'Sulur', 'Anaimalai', 'Kinathukadavu', 'Mettupalayam', 'Annur', 'Valparai', 'Thondamuthur'],
  'Salem': ['Attur', 'Mettur', 'Omalur', 'Yercaud', 'Gangavalli', 'Sankari', 'Edappadi'],
  'Madurai': ['Melur', 'Vadipatti', 'Usilampatti', 'Peraiyur', 'Thirumangalam', 'Alanganallur'],
  'Tanjore': ['Kumbakonam', 'Papanasam', 'Orathanadu', 'Thiruvaiyaru', 'Pattukkottai'],
  'Ludhiana': ['Jagraon', 'Khanna', 'Samrala', 'Raikot', 'Payal'],
  'Nashik': ['Malegaon', 'Sinnar', 'Niphad', 'Yeola', 'Satana']
};
