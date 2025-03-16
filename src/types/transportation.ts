export type TransportationType = 'flight' | 'train' | 'rental_car' | 'taxi' | 'charter' | 'ferry' | 'bus' | 'subway' | 'other';

export type TransportationStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export type CabinClass = 'economy' | 'premium_economy' | 'business' | 'first';

// 基礎交通記錄類型
export interface Transportation {
  id: string;
  tripId: string;
  itineraryDayId?: string; // 選填，關聯到特定行程日
  type: TransportationType;
  title: string;
  departureDateTime: string;
  arrivalDateTime: string;
  departureLocation: string;
  arrivalLocation: string;
  price: number;
  currency: string;
  status: TransportationStatus;
  bookingReference?: string; // 預訂編號
  bookingWebsite?: string; // 預訂網站
  confirmationNumber?: string; // 確認號
  notes?: string; // 備註
  createdAt: string;
  updatedAt: string;
}

// 機票特定資訊
export interface FlightDetails {
  airline: string;
  flightNumber: string;
  departureTerminal?: string;
  arrivalTerminal?: string;
  cabin: CabinClass;
  baggageAllowance?: string;
  seatNumber?: string;
  layovers?: {
    airport: string;
    arrivalTime: string;
    departureTime: string;
    duration: number; // 分鐘
  }[];
  mileagePoints?: {
    program: string;
    number: string;
    pointsEarned?: number;
  };
}

// 高鐵/火車特定資訊
export interface TrainDetails {
  trainNumber: string;
  departureStation: string;
  arrivalStation: string;
  trainType?: string; // 車種
  carNumber?: string;  // 車廂號
  seatNumber?: string; // 座位號
  seatClass?: string;  // 座位等級
  platform?: string;   // 月台
}

// 租車特定資訊
export interface RentalCarDetails {
  company: string;
  vehicleType: string;
  model?: string;
  pickupLocation: string;
  dropoffLocation: string;
  pickupDateTime: string;
  dropoffDateTime: string;
  rentalDays: number;
  driverName?: string;
  licensePlate?: string;
  insuranceDetails?: string;
  fuelPolicy?: string;
  mileageLimit?: string;
  additionalOptions?: {
    name: string;
    price: number;
    currency: string;
  }[];
}

// 計程車特定資訊
export interface TaxiDetails {
  company?: string;
  driverName?: string;
  driverContact?: string;
  vehicleType?: string;
  licensePlate?: string;
  estimatedDistance?: number;
  distanceUnit?: 'km' | 'miles';
  preBooked: boolean;
}

// 包車特定資訊
export interface CharterDetails {
  company: string;
  driverName?: string;
  driverContact?: string;
  vehicleType: string;
  passengerCapacity: number;
  contractNumber?: string;
  routeDetails?: string;
  includedServices?: string[];
  durationHours: number;
  isFullDay: boolean;
}

// 渡輪特定資訊
export interface FerryDetails {
  company: string;
  vesselName?: string;
  departurePort: string;
  arrivalPort: string;
  cabinType?: string;
  cabinNumber?: string;
  deckLevel?: string;
}

// 巴士特定資訊
export interface BusDetails {
  company: string;
  busNumber: string;
  departureStation: string;
  arrivalStation: string;
  seatNumber?: string;
}

// 地鐵特定資訊
export interface SubwayDetails {
  line: string;
  departureStation: string;
  arrivalStation: string;
  transferStations?: string[];
  ticketType?: string;
}

// 完整的交通記錄（包含特定類型的詳細資訊）
export interface TransportationRecord extends Transportation {
  flightDetails?: FlightDetails;
  trainDetails?: TrainDetails;
  rentalCarDetails?: RentalCarDetails;
  taxiDetails?: TaxiDetails;
  charterDetails?: CharterDetails;
  ferryDetails?: FerryDetails;
  busDetails?: BusDetails;
  subwayDetails?: SubwayDetails;
  otherDetails?: Record<string, any>;
} 