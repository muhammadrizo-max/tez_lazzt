export interface User {
  id: number;
  full_name: string;
  username?: string;
  phone: string;
  referral_code: string;
  referral_bonus: number;
  loyalty_stamps: number; // e.g. 0 to 6
  loyalty_completed_count: number;
  is_loyalty_full: boolean;
  compensation_bonus: number;
  created_at: string;
}

export interface Courier {
  id: string; // e.g., CUR-8492
  full_name: string;
  phone: string;
  username: string; // auto-generated e.g. kuryer_anvar
  password: string; // auto-generated e.g. X92aL7
  is_active: boolean;
  is_online: boolean;
  penalties: number; // Jarima ballari
  rating_sum: number;
  rating_count: number;
  avg_rating: number; // 0.0 - 5.0
  completed_orders: number;
  created_at: string;
}

export interface Category {
  id: number;
  name: string;
  emoji?: string;
  order_num: number;
  is_active: boolean;
}

export interface Product {
  id: number;
  category_id: number;
  name: string;
  description?: string;
  price: number;
  photo_url?: string;
  is_active: boolean;
}

export interface OrderItem {
  id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  price: number;
}

export type OrderStatus = 'pending' | 'preparing' | 'on_way' | 'delivered' | 'completed' | 'disputed' | 'cancelled';

export interface Order {
  id: number;
  user_id: number;
  user_name: string;
  user_phone: string;
  user_username?: string;
  items: OrderItem[];
  total_amount: number;
  delivery_fee: number;
  discount_amount: number;
  promo_code?: string;
  address: string;
  lat?: number;
  lng?: number;
  note?: string;
  payment_method: 'cash' | 'click' | 'payme';
  payment_status: 'pending' | 'confirmed' | 'rejected';
  payment_receipt_url?: string;
  payment_reject_reason?: string;
  courier_id?: string;
  courier_name?: string;
  courier_phone?: string;
  status: OrderStatus;
  rating?: number;
  rating_comment?: string;
  created_at: string;
  updated_at: string;
}

export interface PromoCode {
  id: number;
  code: string;
  discount_type: 'percent' | 'fixed';
  discount_value: number;
  max_uses?: number;
  used_count: number;
  expires_at?: string;
  is_active: boolean;
}

export interface SystemSettings {
  restaurant_name: string;
  bot_username: string;
  delivery_fee: number;
  free_delivery_from: number;
  referral_bonus: number;
  courier_penalty_compensation: number;
  loyalty_enabled: boolean;
  loyalty_target_stamps: number;
  loyalty_prize_description: string;
  backup_user_id: string;
  backup_group_id: string;
  backup_time: string;
  required_channel: string;
  required_channel_mode: 'all' | 'guests' | 'off';
  payment_group_id: string;
  admin_username?: string;
  admin_password?: string;
  emergency_pin?: string;
}

export interface Waiter {
  id: string; // e.g., OFI-1001
  full_name: string;
  phone: string;
  username: string;
  password: string;
  is_active: boolean;
  created_at: string;
}

export interface RestaurantTable {
  id: number;
  name: string;
  seats: number;
  location?: string; // e.g. "Zalda", "Xonada", "Tashqarida", "Podvalda", "2-qavatda"
  status: 'empty' | 'occupied' | 'reserved';
  waiter_name?: string;
  items: OrderItem[];
  total_amount: number;
  saboy_total?: number;
  saboy_items?: OrderItem[];
  updated_at?: string;
}

export interface SaboyOrder {
  id: number;
  client_name: string;
  items: OrderItem[];
  total_amount: number;
  status: 'pending' | 'ready' | 'completed';
  created_at: string;
}

export interface AuthUser {
  role: 'admin' | 'courier' | 'ofitsiant';
  username: string;
  name: string;
  courier_id?: string;
  courier?: Courier;
}

export interface SystemStats {
  today_orders: number;
  today_revenue: number;
  total_orders: number;
  total_revenue: number;
  total_users: number;
  active_couriers: number;
  disputed_orders: number;
}
