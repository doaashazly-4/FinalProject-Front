// ========== BASE MODELS ==========

export interface BaseModel {
  id?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface BaseUser extends BaseModel {
  userName: string;
  email: string;
  password?: string;
  phoneNumber?: string;
  address?: string;
  birthDate?: string;
  gender?: string;
  profileImage?: string;
}

// ========== USER MODEL ==========

export interface User extends BaseUser {
  role?: UserRole;
  isActive?: boolean;
  emailConfirmed?: boolean;
}

// ========== CUSTOMER MODEL (Matches Backend) ==========

export interface Customer extends BaseModel {
  userId: string;
  address: string;
  user?: User;
  packages?: Package[];
  deliveryProofs?: DeliveryProof[];
}

// ========== COURIER MODEL (Matches Backend) ==========

export interface Courier extends BaseModel {
  userId: string;
  vehicleType: string;
  licenseNumber: string;
  isAvailable: boolean;
  isOnline: boolean;
  rating: number;
  maxWeight: number;
  status: string;
  photoUrl?: string;
  licensePhotoFront?: string;
  licensePhotoBack?: string;
  vehcelLicensePhotoFront?: string;  // Note: matches backend typo
  vehcelLicensePhotoBack?: string;   // Note: matches backend typo
  user?: User;
  locations?: CourierLocation[];
  packages?: Package[];
  deliveryProofs?: DeliveryProof[];
  transactions?: CourierTransaction[];
  courierSubscriptions?: CourierSubscription[];
}

// ========== SUPPLIER MODEL (Matches Backend) ==========

export interface Supplier extends BaseModel {
  userId: string;
  shopName: string;
  isDeleted: boolean;
  user?: User;
  couriers?: Courier[];
  requests?: Request[];
  supplierSubscriptions?: SupplierSubscription[];
}

// ========== REGISTRATION DTOs (Matches Backend API) ==========

export interface UserRegisterDTO {
  userName: string;
  email: string;
  password: string;
  confirmPassword?: string;
}

export interface CustomerRegisterDTO extends UserRegisterDTO {
  address: string;
  phoneNumber: string;
}

export interface SupplierRegisterDTO extends UserRegisterDTO {
  address: string;
  birthDate: string;
  gender: string;
  shopName: string;
  phoneNumber?: string;
}

export interface CourierRegisterDTO extends UserRegisterDTO {
  address: string;
  birthDate: string;
  gender: string;
  vehicleType: string;
  licenseNumber: string;
  maxWeight: number;
  status?: string;
  isAvailable?: boolean;
  isOnline?: boolean;
  rating?: number;
  // File uploads - will be converted to URLs after upload
  photoUrl?: string;
  licensePhotoFront?: string;
  licensePhotoBack?: string;
  vehcelLicensePhotoFront?: string;  // Matches backend spelling
  vehcelLicensePhotoBack?: string;   // Matches backend spelling
}

// Courier Registration with Files (for FormData submission)
export interface CourierRegisterWithFilesDTO {
  userName: string;
  email: string;
  password: string;
  address: string;
  birthDate: string;
  gender: string;
  vehicleType: string;
  licenseNumber: string;
  maxWeight: number;
  status: string;
  isAvailable: boolean;
  isOnline: boolean;
  rating: number;
  // File objects for upload
  photo?: File;
  licensePhotoFront?: File;
  licensePhotoBack?: File;
  vehicleLicensePhotoFront?: File;
  vehicleLicensePhotoBack?: File;
}

export interface AdminRegisterDTO extends UserRegisterDTO {
  // No extra fields for admin
}

// ========== LOGIN DTOs ==========

export interface UserLoginDTO {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  expiration: string;
  role: string;
  userId?: string;
  userName?: string;
  email?: string;
}

// ========== PROFILE DTOs ==========

export interface UserProfileDTO {
  userName?: string;
  email?: string;
  phoneNumber?: string;
  address?: string;
  profileImage?: string;
  birthDate?: string;
  gender?: string;
}

export interface CustomerProfileDTO extends UserProfileDTO {
  preferredPaymentMethod?: string;
}

export interface SupplierProfileDTO extends UserProfileDTO {
  shopName?: string;
  businessLicense?: string;
  taxId?: string;
  description?: string;
  rating?: number;
  isDeleted?: boolean;
}

export interface CourierProfileDTO extends UserProfileDTO {
  vehicleType?: string;
  licenseNumber?: string;
  maxWeight?: number;
  isAvailable?: boolean;
  isOnline?: boolean;
  rating?: number;
  completedDeliveries?: number;
  status?: string;
  photoUrl?: string;
  licensePhotoFront?: string;
  licensePhotoBack?: string;
  vehcelLicensePhotoFront?: string;
  vehcelLicensePhotoBack?: string;
}

// ========== PASSWORD DTOs ==========

export interface ChangePasswordDTO {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ForgotPasswordDTO {
  email: string;
}

export interface ResetPasswordDTO {
  token: string;
  email: string;
  newPassword: string;
  confirmPassword: string;
}

// ========== PACKAGE MODEL ==========

export interface Package extends BaseModel {
  customerId: string;
  supplierId?: string;
  courierId?: string;
  description: string;
  weight: number;
  dimensions?: string;
  pickupAddress: string;
  deliveryAddress: string;
  status: PackageStatus;
  estimatedDelivery?: Date;
  actualDelivery?: Date;
  customer?: Customer;
  supplier?: Supplier;
  courier?: Courier;
}

// ========== ORDER MODEL ==========

export interface Order extends BaseModel {
  customerId: string;
  supplierId: string;
  packageId?: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  customer?: Customer;
  supplier?: Supplier;
}

export interface OrderItem {
  id?: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  total: number;
}

// ========== DELIVERY PROOF MODEL ==========

export interface DeliveryProof extends BaseModel {
  packageId: string;
  courierId: string;
  customerId?: string;
  imageUrl: string;
  notes?: string;
  deliveredAt?: Date;
  package?: Package;
  courier?: Courier;
  customer?: Customer;
}

// ========== COURIER LOCATION MODEL ==========

export interface CourierLocation extends BaseModel {
  courierId: string;
  latitude: number;
  longitude: number;
  timestamp: Date;
  courier?: Courier;
}

// ========== TRANSACTION MODELS ==========

export interface CourierTransaction extends BaseModel {
  courierId: string;
  amount: number;
  type: TransactionType;
  description?: string;
  status: TransactionStatus;
  courier?: Courier;
}

// ========== SUBSCRIPTION MODELS ==========

export interface CourierSubscription extends BaseModel {
  courierId: string;
  planName: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  price: number;
  courier?: Courier;
}

export interface SupplierSubscription extends BaseModel {
  supplierId: string;
  planName: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  price: number;
  supplier?: Supplier;
}

// ========== REQUEST MODEL ==========

export interface Request extends BaseModel {
  supplierId: string;
  type: string;
  status: RequestStatus;
  description?: string;
  supplier?: Supplier;
}

// ========== ENUMS ==========

export enum UserRole {
  CUSTOMER = 'Customer',
  SUPPLIER = 'Supplier',
  COURIER = 'Courier',
  ADMIN = 'Admin'
}

export enum PackageStatus {
  PENDING = 'pending',
  ASSIGNED = 'assigned',
  PICKED_UP = 'picked_up',
  IN_TRANSIT = 'in_transit',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled'
}

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled'
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded'
}

export enum TransactionType {
  EARNING = 'earning',
  WITHDRAWAL = 'withdrawal',
  BONUS = 'bonus',
  PENALTY = 'penalty'
}

export enum TransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export enum RequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

export enum VehicleType {
  MOTORCYCLE = 'Motorcycle',
  CAR = 'Car',
  TRUCK = 'Truck',
  VAN = 'Van'
}

export enum Gender {
  MALE = 'Male',
  FEMALE = 'Female',
  OTHER = 'Other'
}

export enum CourierStatus {
  AVAILABLE = 'Available',
  BUSY = 'Busy',
  OFFLINE = 'Offline'
}

// ========== RESPONSE MODELS ==========

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  statusCode?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ========== FILTER MODELS ==========

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface UserFilterParams extends PaginationParams {
  role?: UserRole;
  search?: string;
  isActive?: boolean;
}

export interface PackageFilterParams extends PaginationParams {
  status?: PackageStatus;
  customerId?: string;
  supplierId?: string;
  courierId?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

// ========== DASHBOARD MODELS ==========

export interface DashboardStats {
  totalOrders?: number;
  totalRevenue?: number;
  pendingOrders?: number;
  completedOrders?: number;
  activeCustomers?: number;
  activeSuppliers?: number;
  activeCouriers?: number;
  totalPackages?: number;
  deliveredPackages?: number;
}

export interface RecentActivity {
  id: string;
  type: 'order' | 'delivery' | 'payment' | 'registration';
  description: string;
  userId?: string;
  userName?: string;
  timestamp: Date;
  metadata?: any;
}

// ========== ADMIN MODELS ==========

export interface AdminStats {
  totalUsers: number;
  totalCustomers: number;
  totalSuppliers: number;
  totalCouriers: number;
  totalOrders: number;
  totalRevenue: number;
  pendingApprovals: number;
  activeSubscriptions: number;
}

export interface UserManagement {
  users: User[];
  totalCount: number;
  activeCount: number;
  inactiveCount: number;
}
