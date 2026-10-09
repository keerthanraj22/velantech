export type UserRole = 'admin' | 'farmer' | 'provider';

export interface LocationCoordinates {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

export interface UserAddress {
  village: string;
  district: string;
  state: string;
  pincode: string;
  latitude: number;
  longitude: number;
  formattedAddress?: string;
}

export interface FarmerField {
  id: string;
  name: string;
  location: string;
  village: string;
  district: string;
  state: string;
  pincode: string;
  areaAcres: number;
  crop: string;
  soilType?: string;
  irrigationType?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  avatar?: string;
  address: UserAddress;
  isVerified: boolean;
  status: 'active' | 'pending_approval' | 'suspended';
  language: string;
  createdAt: string;
  // Role specific fields
  providerDetails?: {
    businessName: string;
    gstNumber?: string;
    bankName: string;
    accountNumber: string;
    ifscCode: string;
    walletBalance: number;
    rating: number;
    totalRentals: number;
  };
  farmerDetails?: {
    landSizeAcres: number;
    primaryCrops: string[];
    kisanCreditCardNo?: string;
  };
}

export type FuelType = 'Diesel' | 'Petrol' | 'Electric' | 'Manual' | 'Hybrid';
export type EquipmentCondition = 'Excellent' | 'Good' | 'Fair';
export type EquipmentAvailability = 'Available' | 'Booked' | 'Under Maintenance';

export interface EquipmentCategory {
  id: string;
  name: string;
  iconName: string;
  description: string;
  itemCount?: number;
}

export interface Equipment {
  id: string;
  name: string;
  categoryId: string;
  categoryName: string;
  brand: string;
  model: string;
  manufacturingYear: number;
  registrationNumber: string;
  description: string;
  images: string[];
  videos?: string[];
  hourlyPrice: number;
  dailyPrice: number;
  weeklyPrice: number;
  monthlyPrice: number;
  depositAmount: number;
  fuelType: FuelType;
  horsePower: number;
  capacity: string;
  condition: EquipmentCondition;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
    village: string;
    district: string;
    state: string;
    pincode: string;
  };
  availabilityStatus: EquipmentAvailability;
  maintenanceStatus: 'Operational' | 'Scheduled Maintenance' | 'In Repair';
  averageRating: number;
  totalReviews: number;
  providerId: string;
  providerName: string;
  providerPhone: string;
  deliveryAvailable: boolean;
  deliveryChargePerKm: number;
  createdAt: string;
  /** A listing is not visible to renters until an administrator approves it. */
  onboardingStatus?: 'pending_approval' | 'approved' | 'rejected';
}

export type BookingStatus = 'Pending' | 'Approved' | 'Rejected' | 'En Route' | 'In Use' | 'Completed' | 'Cancelled';
export type PaymentStatus = 'Pending' | 'Paid' | 'Failed' | 'Refunded';
export type PayoutStatus = 'Pending' | 'Processing' | 'Paid' | 'Failed' | 'Cancelled';
export type PaymentMethod = 'UPI' | 'Credit Card' | 'Debit Card' | 'Net Banking' | 'Wallet' | 'Cash on Delivery';

export interface Booking {
  id: string;
  bookingNumber: string;
  equipmentId: string;
  equipmentName: string;
  equipmentImage: string;
  farmerId: string;
  farmerName: string;
  farmerPhone: string;
  providerId: string;
  providerName: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;
  startTime: string; // HH:MM
  endTime: string;
  rentalDurationHours: number;
  rentalType: 'hourly' | 'daily' | 'weekly';
  rentalAmount: number;
  deliveryCharge: number;
  depositAmount: number;
  gstAmount: number;
  totalAmount: number;
  /** Values below are calculated and controlled by the backend. */
  platformFee?: number;
  providerAmount?: number;
  payoutStatus?: PayoutStatus;
  payoutId?: string;
  paymentId?: string;
  refundStatus?: 'Not Requested' | 'Pending' | 'Processing' | 'Completed' | 'Failed';
  bookingStatus: BookingStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  deliveryOperatorId?: string;
  deliveryStatus?: 'Assigned' | 'Picked Up' | 'Delivered' | 'Returned';
  farmerAddress: UserAddress;
  notes?: string;
  createdAt: string;
}

export interface Review {
  id: string;
  equipmentId: string;
  farmerId: string;
  farmerName: string;
  farmerAvatar?: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface KnowledgeArticle {
  id: string;
  title: string;
  category: 'Government Scheme' | 'Equipment Guide' | 'Maintenance' | 'Safety' | 'Crop Tips';
  summary: string;
  content: string;
  author: string;
  readTimeMinutes: number;
  thumbnail: string;
  tags: string[];
  createdAt: string;
}

export interface WeatherData {
  city: string;
  district: string;
  tempC: number;
  condition: string;
  humidity: number;
  windSpeedKm: number;
  rainProbability: number;
  forecast: {
    day: string;
    temp: number;
    condition: string;
    rainProb: number;
  }[];
  alert?: string;
}

export interface FilterState {
  searchQuery: string;
  categoryId: string;
  radiusKm: number; // 5, 10, 20, 30, 50, 100
  userLat: number;
  userLng: number;
  minPrice: number;
  maxPrice: number;
  fuelType: string;
  minHp: number;
  availability: string;
  sortBy: 'distance' | 'price_low' | 'price_high' | 'rating' | 'newest';
}

export interface ChatMessage {
  id: string;
  bookingId?: string;
  senderId: string;
  receiverId: string;
  senderName: string;
  message: string;
  timestamp: string;
}

export interface SupportComplaint {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  subject: string;
  description: string;
  status: 'Open' | 'In Progress' | 'Resolved';
  priority: 'Low' | 'Medium' | 'High';
  createdAt: string;
}
