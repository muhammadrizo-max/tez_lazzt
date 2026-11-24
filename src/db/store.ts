import fs from 'fs';
import path from 'path';
import { Category, Courier, Order, Product, PromoCode, RestaurantTable, SaboyOrder, SystemSettings, SystemStats, User, Waiter } from '../types';

const BUNDLED_DATA_FILE = path.join(process.cwd(), 'data.json');
const DATA_FILE = process.env.VERCEL ? '/tmp/data.json' : BUNDLED_DATA_FILE;

function generateLogin10(): string {
  const letters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const symbols = '!@#$%&*_-';
  const digits = '0123456789';

  let part1 = '';
  for (let i = 0; i < 7; i++) {
    part1 += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  const part2 = symbols.charAt(Math.floor(Math.random() * symbols.length));
  let part3 = '';
  for (let i = 0; i < 2; i++) {
    part3 += digits.charAt(Math.floor(Math.random() * digits.length));
  }
  return part1 + part2 + part3;
}

// Initial Mock Data
const defaultCategories: Category[] = [
  { id: 1, name: 'Burgerlar', emoji: '🍔', order_num: 1, is_active: true },
  { id: 2, name: 'Lavashlar', emoji: '🌯', order_num: 2, is_active: true },
  { id: 3, name: 'Pitsa', emoji: '🍕', order_num: 3, is_active: true },
  { id: 4, name: 'Ichimliklar', emoji: '🥤', order_num: 4, is_active: true },
  { id: 5, name: 'Snoacklar', emoji: '🍟', order_num: 5, is_active: true },
];

const defaultProducts: Product[] = [
  {
    id: 1,
    category_id: 1,
    name: 'Cheeseburger Max',
    description: 'Toshkent uslubida pishirilgan, ikki qatlam mol go\'shti va sirli sous',
    price: 35000,
    photo_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80',
    is_active: true,
  },
  {
    id: 2,
    category_id: 1,
    name: 'Gamburger Standart',
    description: 'Shirali go\'sht, pomidor, bodring, yangi sous',
    price: 28000,
    photo_url: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=600&q=80',
    is_active: true,
  },
  {
    id: 3,
    category_id: 2,
    name: 'Mol go\'shtli Lavash Mini',
    description: 'Nafis lavash hamiri, tandem pishgan mol go\'shti, chipslar',
    price: 32000,
    photo_url: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=600&q=80',
    is_active: true,
  },
  {
    id: 4,
    category_id: 2,
    name: 'Tovuqli Sirli Lavash',
    description: 'Eriydigan pishloq va tovuq go\'shtli maxsus lavash',
    price: 34000,
    photo_url: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=600&q=80',
    is_active: true,
  },
  {
    id: 5,
    category_id: 4,
    name: 'Coca-Cola 0.5L',
    description: 'Muzdek tetiklashtiruvchi ichimlik',
    price: 9000,
    photo_url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=600&q=80',
    is_active: true,
  },
];

const defaultCouriers: Courier[] = [
  {
    id: 'CUR-1001',
    full_name: 'Baxrom Alimov',
    phone: '+998901234567',
    username: '1001928374',
    password: '84920156',
    is_active: true,
    is_online: true,
    penalties: 0,
    rating_sum: 48,
    rating_count: 10,
    avg_rating: 4.8,
    completed_orders: 42,
    created_at: new Date().toISOString(),
  },
  {
    id: 'CUR-1002',
    full_name: 'Sardor Karimov',
    phone: '+998939876543',
    username: '1002938475',
    password: '73910482',
    is_active: true,
    is_online: true,
    penalties: 1,
    rating_sum: 36,
    rating_count: 8,
    avg_rating: 4.5,
    completed_orders: 29,
    created_at: new Date().toISOString(),
  },
];

const defaultUsers: User[] = [];

const defaultOrders: Order[] = [];

const defaultPromos: PromoCode[] = [
  {
    id: 1,
    code: 'WELCOME2026',
    discount_type: 'percent',
    discount_value: 30,
    max_uses: 50,
    used_count: 0,
    expires_at: '2026-08-31',
    is_active: true,
  },
  {
    id: 2,
    code: 'TEZLAZZAT10',
    discount_type: 'fixed',
    discount_value: 15000,
    max_uses: 100,
    used_count: 0,
    expires_at: '2026-12-31',
    is_active: true,
  }
];

const defaultTables: RestaurantTable[] = Array.from({ length: 12 }, (_, i) => ({
  id: i + 1,
  name: `Stol ${i + 1}`,
  seats: i % 3 === 0 ? 6 : i % 2 === 0 ? 4 : 2,
  location: i < 6 ? 'Zalda' : i < 10 ? 'Xonada' : 'Tashqarida',
  status: 'empty',
  items: [],
  total_amount: 0,
}));

const defaultWaiters: Waiter[] = [
  {
    id: 'OFI-1001',
    full_name: 'Jasur Valiyev',
    phone: '+998901112233',
    username: '1003948571',
    password: '83920145',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'OFI-1002',
    full_name: 'Otabek Rajabov',
    phone: '+998935556677',
    username: '1004857291',
    password: '74920156',
    is_active: true,
    created_at: new Date().toISOString(),
  },
];

export interface DataState {
  categories: Category[];
  products: Product[];
  couriers: Courier[];
  waiters: Waiter[];
  users: User[];
  orders: Order[];
  promos: PromoCode[];
  settings: SystemSettings;
  tables: RestaurantTable[];
  saboy_orders?: SaboyOrder[];
}

class StoreManager {
  private state: DataState;

  constructor() {
    this.state = this.loadData();
  }

  private loadData(): DataState {
    try {
      const sourceFile = fs.existsSync(DATA_FILE)
        ? DATA_FILE
        : fs.existsSync(BUNDLED_DATA_FILE)
          ? BUNDLED_DATA_FILE
          : null;
      if (sourceFile) {
        const raw = fs.readFileSync(sourceFile, 'utf-8');
        const parsed = JSON.parse(raw);
        // Ensure default settings structure is complete
        parsed.settings = {
          restaurant_name: parsed.settings?.restaurant_name || process.env.RESTAURANT_NAME || 'TezLazzat',
          bot_username: parsed.settings?.bot_username || 'TezLazzat_bot',
          delivery_fee: parsed.settings?.delivery_fee ?? 15000,
          free_delivery_from: parsed.settings?.free_delivery_from ?? 100000,
          referral_bonus: parsed.settings?.referral_bonus ?? 10000,
          courier_penalty_compensation: parsed.settings?.courier_penalty_compensation ?? 15000,
          loyalty_enabled: parsed.settings?.loyalty_enabled ?? true,
          loyalty_target_stamps: parsed.settings?.loyalty_target_stamps ?? 6,
          loyalty_prize_description: parsed.settings?.loyalty_prize_description || 'Bepul Combo Set va Ichimlik 🎁',
          backup_user_id: parsed.settings?.backup_user_id || '6582564319',
          backup_group_id: parsed.settings?.backup_group_id || '-1003857127288',
          backup_time: parsed.settings?.backup_time || '23:00',
          required_channel: parsed.settings?.required_channel || '-1003793342397',
          required_channel_mode: parsed.settings?.required_channel_mode || parsed.settings?.required_channel_target || 'all',
          payment_group_id: parsed.settings?.payment_group_id && parsed.settings.payment_group_id !== '-1003793342397' ? parsed.settings.payment_group_id : '-1003857127288',
          admin_username: parsed.settings?.admin_username || process.env.ADMIN_USERNAME || 'admin',
          admin_password: parsed.settings?.admin_password || process.env.ADMIN_PASSWORD || 'admin123',
          emergency_pin: process.env.EMERGENCY_PIN || process.env.ADMIN_PIN || '998877',
        };
        // Normalize users for loyalty card fields
        if (Array.isArray(parsed.users)) {
          parsed.users = parsed.users.map((u: any) => ({
            ...u,
            loyalty_stamps: u.loyalty_stamps ?? 0,
            loyalty_completed_count: u.loyalty_completed_count ?? 0,
            is_loyalty_full: u.is_loyalty_full ?? false,
            compensation_bonus: u.compensation_bonus ?? 0,
          }));
        }
        if (!Array.isArray(parsed.tables) || parsed.tables.length === 0) {
          parsed.tables = defaultTables;
        }
        if (!Array.isArray(parsed.waiters) || parsed.waiters.length === 0) {
          parsed.waiters = defaultWaiters;
        }
        return parsed;
      }
    } catch (e) {
      console.error('Failed to read data.json, initializing default:', e);
    }
    const initial: DataState = {
      categories: defaultCategories,
      products: defaultProducts,
      couriers: defaultCouriers,
      waiters: defaultWaiters,
      users: defaultUsers,
      orders: defaultOrders,
      promos: defaultPromos,
      tables: defaultTables,
      settings: {
        restaurant_name: process.env.RESTAURANT_NAME || 'TezLazzat',
        bot_username: 'TezLazzat_bot',
        delivery_fee: parseInt(process.env.DELIVERY_FEE || '15000'),
        free_delivery_from: parseInt(process.env.FREE_DELIVERY_FROM || '100000'),
        referral_bonus: parseInt(process.env.REFERRAL_BONUS || '10000'),
        courier_penalty_compensation: 15000,
        loyalty_enabled: true,
        loyalty_target_stamps: 6,
        loyalty_prize_description: 'Bepul Combo Set va Ichimlik 🎁',
        backup_user_id: '6582564319',
        backup_group_id: '-1003857127288',
        backup_time: '23:00',
        required_channel: '-1003793342397',
        required_channel_mode: 'all',
        payment_group_id: process.env.PAYMENT_ADMIN_GROUP_ID || '-1003857127288',
        admin_username: process.env.ADMIN_USERNAME || 'admin',
        admin_password: process.env.ADMIN_PASSWORD || 'admin123',
        emergency_pin: process.env.EMERGENCY_PIN || process.env.ADMIN_PIN || '998877',
      },
    };
    this.saveData(initial);
    return initial;
  }

  public saveData(data?: DataState) {
    if (data) this.state = data;
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.state, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to write data.json:', e);
    }
  }

  // Getters
  public getCategories() { return this.state.categories; }
  public getProducts() { return this.state.products; }
  public getCouriers() { return this.state.couriers; }
  public getWaiters() {
    if (!this.state.waiters) this.state.waiters = defaultWaiters;
    return this.state.waiters;
  }
  public getUsers() { return this.state.users; }
  public getOrders() { return this.state.orders; }
  public getPromos() { return this.state.promos; }
  public getSettings() { return this.state.settings; }

  // Settings Action
  public updateSettings(newSettings: Partial<SystemSettings>) {
    this.state.settings = { ...this.state.settings, ...newSettings };
    this.saveData();
    return this.state.settings;
  }

  // Backup & Restore
  public getRawData() {
    return JSON.stringify(this.state, null, 2);
  }

  public restoreData(jsonData: string) {
    try {
      const parsed = JSON.parse(jsonData);
      if (parsed.categories && parsed.products && parsed.users) {
        this.state = parsed;
        this.saveData();
        return true;
      }
    } catch (err) {
      console.error('Restore error:', err);
    }
    return false;
  }

  // User Actions
  public syncUser(data: { id: number; full_name: string; username?: string; phone?: string; ref_by?: string }) {
    let user = this.state.users.find((u) => u.id === data.id);
    if (!user) {
      user = {
        id: data.id,
        full_name: data.full_name,
        username: data.username,
        phone: data.phone || '',
        referral_code: `REF${Math.floor(1000 + Math.random() * 9000)}`,
        referral_bonus: data.ref_by ? this.state.settings.referral_bonus : 0,
        loyalty_stamps: 0,
        loyalty_completed_count: 0,
        is_loyalty_full: false,
        compensation_bonus: 0,
        created_at: new Date().toISOString(),
      };
      this.state.users.push(user);

      // Reward referrer if valid
      if (data.ref_by) {
        const referrer = this.state.users.find((u) => u.id === Number(data.ref_by));
        if (referrer) {
          referrer.referral_bonus += this.state.settings.referral_bonus;
        }
      }
    } else {
      if (data.full_name) user.full_name = data.full_name;
      if (data.username !== undefined) user.username = data.username;
      if (data.phone) user.phone = data.phone;
    }
    this.saveData();
    return user;
  }

  public resetUserLoyalty(userId: number) {
    const u = this.state.users.find((user) => user.id === userId);
    if (u) {
      u.loyalty_stamps = 0;
      u.is_loyalty_full = false;
      this.saveData();
    }
    return u;
  }

  // Courier Actions
  public addCourier(full_name: string, phone: string, customUsername?: string, customPassword?: string): Courier {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    // 10-char login: 7 letters + 1 symbol + 2 digits
    const username = customUsername || generateLogin10();
    const password = customPassword || String(Math.floor(10000000 + Math.random() * 90000000));
    const courier_id = `CUR-${randomNum}`;

    const courier: Courier = {
      id: courier_id,
      full_name,
      phone,
      username,
      password,
      is_active: true,
      is_online: true,
      penalties: 0,
      rating_sum: 0,
      rating_count: 0,
      avg_rating: 5.0,
      completed_orders: 0,
      created_at: new Date().toISOString(),
    };

    this.state.couriers.push(courier);
    this.saveData();
    return courier;
  }

  public updateCourierStatus(courier_id: string, is_online: boolean) {
    const c = this.state.couriers.find((item) => item.id === courier_id);
    if (c) {
      c.is_online = is_online;
      this.saveData();
    }
    return c;
  }

  public addCourierPenalty(courier_id: string, affectedUserId?: number) {
    const c = this.state.couriers.find((item) => item.id === courier_id);
    if (c) {
      c.penalties += 1;
    }
    // Give compensation bonus to user
    if (affectedUserId) {
      const u = this.state.users.find((user) => user.id === affectedUserId);
      if (u) {
        u.compensation_bonus += (this.state.settings.courier_penalty_compensation || 15000);
      }
    }
    this.saveData();
    return c;
  }

  public rateCourier(courier_id: string, stars: number) {
    const c = this.state.couriers.find((item) => item.id === courier_id);
    if (c) {
      c.rating_sum += stars;
      c.rating_count += 1;
      c.avg_rating = Number((c.rating_sum / c.rating_count).toFixed(1));
      this.saveData();
    }
    return c;
  }

  // Order Actions
  public createOrder(orderData: {
    user_id: number;
    user_name: string;
    items: any[];
    total_amount: number;
    delivery_fee: number;
    discount_amount: number;
    promo_code?: string;
    address: string;
    note?: string;
    payment_method: 'cash' | 'click' | 'payme';
    payment_receipt_url?: string;
  }): Order {
    const newId = Math.max(100, ...this.state.orders.map((o) => o.id)) + 1;
    const user = this.state.users.find((u) => u.id === orderData.user_id);

    // Calculate item count: at least 2 distinct items or total items quantity >= 2 grants +1 loyalty stamp
    const totalItemsCount = orderData.items.reduce((sum, item) => sum + (item.quantity || 1), 0);
    const grantsLoyalty = totalItemsCount >= 2;

    if (user && grantsLoyalty && this.state.settings.loyalty_enabled !== false) {
      user.loyalty_stamps += 1;
      const target = this.state.settings.loyalty_target_stamps || 6;
      if (user.loyalty_stamps >= target) {
        user.is_loyalty_full = true;
        user.loyalty_completed_count += 1;
      }
    }

    const newOrder: Order = {
      id: newId,
      user_id: orderData.user_id,
      user_name: orderData.user_name,
      user_phone: user?.phone || '',
      user_username: user?.username || '',
      items: orderData.items.map((it, index) => ({
        id: index + 1,
        product_id: it.product_id || it.id || index + 1,
        product_name: it.name || it.product_name,
        quantity: it.quantity || 1,
        price: it.price || 0,
      })),
      total_amount: orderData.total_amount,
      delivery_fee: orderData.delivery_fee,
      discount_amount: orderData.discount_amount || 0,
      promo_code: orderData.promo_code,
      address: orderData.address,
      note: orderData.note || '',
      payment_method: orderData.payment_method,
      payment_status: orderData.payment_method === 'cash' ? 'confirmed' : 'pending',
      payment_receipt_url: orderData.payment_receipt_url,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.state.orders.unshift(newOrder);
    this.saveData();
    return newOrder;
  }

  public confirmPayment(order_id: number) {
    const o = this.state.orders.find((item) => item.id === order_id);
    if (o) {
      o.payment_status = 'confirmed';
      o.updated_at = new Date().toISOString();
      this.saveData();
    }
    return o;
  }

  public rejectPayment(order_id: number, reason?: string) {
    const o = this.state.orders.find((item) => item.id === order_id);
    if (o) {
      o.payment_status = 'rejected';
      o.payment_reject_reason = reason || 'To\'lov cheki noto\'g\'ri yoki tasdiqlanmadi';
      o.updated_at = new Date().toISOString();
      this.saveData();
    }
    return o;
  }

  public assignCourierToOrder(order_id: number, courier_id: string) {
    const order = this.state.orders.find((o) => o.id === order_id);
    const courier = this.state.couriers.find((c) => c.id === courier_id);
    if (!order || !courier) return null;

    order.courier_id = courier.id;
    order.courier_name = courier.full_name;
    order.courier_phone = courier.phone;
    order.status = 'on_way';
    order.updated_at = new Date().toISOString();
    this.saveData();
    return order;
  }

  public updateOrderStatus(order_id: number, status: Order['status']) {
    const order = this.state.orders.find((o) => o.id === order_id);
    if (!order) return null;

    order.status = status;
    order.updated_at = new Date().toISOString();

    if (status === 'completed' && order.courier_id) {
      const courier = this.state.couriers.find((c) => c.id === order.courier_id);
      if (courier) {
        courier.completed_orders += 1;
      }
    }

    this.saveData();
    return order;
  }

  public getStats(): SystemStats {
    const today = new Date().toISOString().split('T')[0];
    const todayOrders = this.state.orders.filter(
      (o) => o.created_at.startsWith(today) && o.status !== 'cancelled'
    );
    const todayRevenue = todayOrders.reduce((sum, o) => sum + o.total_amount, 0);

    const totalRevenue = this.state.orders
      .filter((o) => o.status === 'completed' || o.status === 'delivered')
      .reduce((sum, o) => sum + o.total_amount, 0);

    const disputedCount = this.state.orders.filter((o) => o.status === 'disputed').length;

    return {
      today_orders: todayOrders.length,
      today_revenue: todayRevenue,
      total_orders: this.state.orders.length,
      total_revenue: totalRevenue,
      total_users: this.state.users.length,
      active_couriers: this.state.couriers.filter((c) => c.is_online).length,
      disputed_orders: disputedCount,
    };
  }

  // Categories & Products
  public addCategory(name: string, emoji?: string) {
    const newId = Math.max(0, ...this.state.categories.map((c) => c.id)) + 1;
    const cat: Category = {
      id: newId,
      name,
      emoji: emoji || '🍔',
      order_num: newId,
      is_active: true,
    };
    this.state.categories.push(cat);
    this.saveData();
    return cat;
  }

  public updateCategory(id: number, name: string, emoji?: string) {
    const cat = this.state.categories.find((c) => c.id === id);
    if (cat) {
      if (name) cat.name = name;
      if (emoji) cat.emoji = emoji;
      this.saveData();
    }
    return cat;
  }

  public deleteCategory(id: number) {
    this.state.categories = this.state.categories.filter((c) => c.id !== id);
    this.state.products = this.state.products.filter((p) => p.category_id !== id);
    this.saveData();
    return true;
  }

  public addProduct(p: Omit<Product, 'id'>) {
    const newId = Math.max(0, ...this.state.products.map((item) => item.id)) + 1;
    const product: Product = { ...p, id: newId };
    this.state.products.push(product);
    this.saveData();
    return product;
  }

  public updateProduct(id: number, updates: Partial<Product>) {
    const p = this.state.products.find((item) => item.id === id);
    if (p) {
      if (updates.name !== undefined) p.name = updates.name;
      if (updates.description !== undefined) p.description = updates.description;
      if (updates.price !== undefined) p.price = Number(updates.price);
      if (updates.category_id !== undefined) p.category_id = Number(updates.category_id);
      if (updates.photo_url !== undefined) p.photo_url = updates.photo_url;
      if (updates.is_active !== undefined) p.is_active = updates.is_active;
      this.saveData();
    }
    return p;
  }

  public deleteProduct(id: number) {
    this.state.products = this.state.products.filter((p) => p.id !== id);
    this.saveData();
    return true;
  }

  public toggleProduct(id: number) {
    const p = this.state.products.find((item) => item.id === id);
    if (p) {
      p.is_active = !p.is_active;
      this.saveData();
    }
    return p;
  }

  public updateCourier(id: string, updates: { full_name?: string; phone?: string; username?: string; password?: string; reset_credentials?: boolean }) {
    const c = this.state.couriers.find((item) => item.id === id);
    if (c) {
      if (updates.full_name) c.full_name = updates.full_name;
      if (updates.phone) c.phone = updates.phone;
      if (updates.username) c.username = updates.username;
      if (updates.password) c.password = updates.password;
      if (updates.reset_credentials) {
        c.username = generateLogin10();
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let password = '';
        for (let i = 0; i < 6; i++) {
          password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        c.password = password;
      }
      this.saveData();
    }
    return c;
  }

  public deleteCourier(id: string) {
    this.state.couriers = this.state.couriers.filter((c) => c.id !== id);
    this.saveData();
    return true;
  }

  // Waiter Actions
  public addWaiter(full_name: string, phone: string, customUsername?: string, customPassword?: string): Waiter {
    if (!this.state.waiters) this.state.waiters = defaultWaiters;
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    // 10-char login: 7 letters + 1 symbol + 2 digits
    const username = customUsername || generateLogin10();
    const password = customPassword || String(Math.floor(10000000 + Math.random() * 90000000));

    const waiter: Waiter = {
      id: `OFI-${randomNum}`,
      full_name,
      phone,
      username,
      password,
      is_active: true,
      created_at: new Date().toISOString(),
    };

    this.state.waiters.push(waiter);
    this.saveData();
    return waiter;
  }

  public updateWaiter(id: string, updates: { full_name?: string; phone?: string; username?: string; password?: string; reset_credentials?: boolean }) {
    if (!this.state.waiters) this.state.waiters = defaultWaiters;
    const w = this.state.waiters.find((item) => item.id === id);
    if (w) {
      if (updates.full_name) w.full_name = updates.full_name;
      if (updates.phone) w.phone = updates.phone;
      if (updates.username) w.username = updates.username;
      if (updates.password) w.password = updates.password;
      if (updates.reset_credentials) {
        w.username = generateLogin10();
        w.password = String(Math.floor(10000000 + Math.random() * 90000000));
      }
      this.saveData();
    }
    return w;
  }

  public deleteWaiter(id: string) {
    if (!this.state.waiters) this.state.waiters = defaultWaiters;
    this.state.waiters = this.state.waiters.filter((w) => w.id !== id);
    this.saveData();
    return true;
  }

  // Promos
  public addPromo(promo: Omit<PromoCode, 'id' | 'used_count'>) {
    const newId = Math.max(0, ...this.state.promos.map((p) => p.id)) + 1;
    const newPromo: PromoCode = { ...promo, id: newId, used_count: 0 };
    this.state.promos.push(newPromo);
    this.saveData();
    return newPromo;
  }

  public deletePromo(id: number) {
    this.state.promos = this.state.promos.filter((p) => p.id !== id);
    this.saveData();
    return true;
  }

  public updatePromo(id: number, updates: Partial<PromoCode>) {
    const p = this.state.promos.find((item) => item.id === id);
    if (p) {
      if (updates.code !== undefined) p.code = updates.code.toUpperCase();
      if (updates.discount_type !== undefined) p.discount_type = updates.discount_type;
      if (updates.discount_value !== undefined) p.discount_value = Number(updates.discount_value);
      if (updates.max_uses !== undefined) p.max_uses = updates.max_uses !== undefined ? Number(updates.max_uses) : undefined;
      if (updates.expires_at !== undefined) p.expires_at = updates.expires_at;
      if (updates.is_active !== undefined) p.is_active = updates.is_active;
      this.saveData();
    }
    return p;
  }

  public validatePromoCode(code: string) {
    const cleanCode = code.trim().toUpperCase();
    const promo = this.state.promos.find((p) => p.code === cleanCode && p.is_active);
    if (!promo) {
      return { valid: false, error: 'Promo kod topilmadi yoki faol emas!' };
    }
    if (promo.max_uses && promo.used_count >= promo.max_uses) {
      return { valid: false, error: 'Ushbu promo kodning ishlatilish limiti tugagan!' };
    }
    if (promo.expires_at) {
      const today = new Date().toISOString().split('T')[0];
      if (today > promo.expires_at) {
        return { valid: false, error: 'Ushbu promo kodning amal qilish muddati tugagan!' };
      }
    }
    return { valid: true, promo };
  }

  public getUserOrders(userId: number) {
    return this.state.orders.filter((o) => o.user_id === userId);
  }

  // Tables Management
  public getTables() {
    if (!this.state.tables) {
      this.state.tables = defaultTables;
      this.saveData();
    }
    return this.state.tables;
  }

  public getTable(id: number) {
    return this.getTables().find((t) => Number(t.id) === Number(id));
  }

  public addTable(name: string, seats: number, location?: string): RestaurantTable {
    const tables = this.getTables();
    const newId = Math.max(0, ...tables.map((t) => Number(t.id) || 0)) + 1;
    const newTable: RestaurantTable = {
      id: newId,
      name: name || `Stol ${newId}`,
      seats: Number(seats) || 4,
      location: location || 'Zalda',
      status: 'empty',
      items: [],
      total_amount: 0,
      updated_at: new Date().toISOString(),
    };
    tables.push(newTable);
    this.saveData();
    return newTable;
  }

  public deleteTable(id: number) {
    const targetId = Number(id);
    const tables = this.getTables();
    const filtered = tables.filter((t) => Number(t.id) !== targetId);

    // Renumber standard "Stol N" tables sequentially starting from 1
    let standardSeq = 1;
    filtered.forEach((t) => {
      if (/^Stol\s+\d+$/i.test(t.name.trim())) {
        t.name = `Stol ${standardSeq}`;
        standardSeq++;
      }
    });

    this.state.tables = filtered;
    this.saveData();
    return true;
  }

  public deleteOrder(order_id: number) {
    this.state.orders = this.state.orders.filter((o) => Number(o.id) !== Number(order_id));
    this.saveData();
    return true;
  }

  public updateTable(id: number, updates: Partial<RestaurantTable>) {
    const targetId = Number(id);
    const table = this.getTables().find((t) => Number(t.id) === targetId);
    if (!table) return null;
    if (updates.status !== undefined) table.status = updates.status;
    if (updates.seats !== undefined) table.seats = Number(updates.seats);
    if (updates.name !== undefined) table.name = updates.name;
    if (updates.location !== undefined) table.location = updates.location;
    if (updates.waiter_name !== undefined) table.waiter_name = updates.waiter_name;
    if (updates.items !== undefined) {
      table.items = updates.items;
      table.total_amount = updates.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    }
    table.updated_at = new Date().toISOString();
    this.saveData();
    return table;
  }

  public moveTableOrder(fromId: number, toId: number) {
    const fromTable = this.getTable(fromId);
    const toTable = this.getTable(toId);
    if (!fromTable || !toTable) return { success: false, message: "Stollar topilmadi!" };
    if (!fromTable.items || fromTable.items.length === 0) {
      return { success: false, message: "Manba stolda buyurtma yo'q!" };
    }

    toTable.items = [...toTable.items, ...fromTable.items];
    toTable.total_amount = toTable.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    toTable.status = 'occupied';
    if (fromTable.waiter_name) toTable.waiter_name = fromTable.waiter_name;
    toTable.updated_at = new Date().toISOString();

    fromTable.items = [];
    fromTable.total_amount = 0;
    fromTable.status = 'empty';
    fromTable.waiter_name = undefined;
    fromTable.updated_at = new Date().toISOString();

    this.saveData();
    return { success: true, message: `${fromTable.name} buyurtmalari muvaffaqiyatli ${toTable.name} ga o'tkazildi!` };
  }

  public clearTable(id: number) {
    const table = this.getTable(id);
    if (!table) return null;
    table.items = [];
    table.total_amount = 0;
    table.status = 'empty';
    table.waiter_name = undefined;
    table.updated_at = new Date().toISOString();
    this.saveData();
    return table;
  }

  public checkoutTable(tableId: number, paymentMethod: 'cash' | 'click' | 'payme', receiptType: 'keshbek' | 'oddiy', phone?: string) {
    const table = this.getTable(tableId);
    if (!table || table.items.length === 0) return { success: false, message: "Stolda buyurtma mavjud emas!" };

    // Create completed order record
    const newId = Math.max(0, ...this.state.orders.map((o) => o.id)) + 1;
    const completedOrder: Order = {
      id: newId,
      user_id: 0,
      user_name: table.name,
      user_phone: phone || '+998000000000',
      items: [...table.items],
      total_amount: table.total_amount,
      delivery_fee: 0,
      discount_amount: 0,
      address: `Zal - ${table.name}`,
      payment_method: paymentMethod,
      payment_status: 'confirmed',
      status: 'completed',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.state.orders.push(completedOrder);

    // Process cashback if keshbek receipt type
    let cashbackEarned = 0;
    if (receiptType === 'keshbek' && phone) {
      const cleanPhone = phone.trim();
      let user = this.state.users.find(u => u.phone === cleanPhone);
      if (user) {
        user.loyalty_stamps = (user.loyalty_stamps || 0) + 1;
        if (user.loyalty_stamps >= (this.state.settings.loyalty_target_stamps || 6)) {
          user.loyalty_stamps = 0;
          user.loyalty_completed_count = (user.loyalty_completed_count || 0) + 1;
          user.is_loyalty_full = true;
        }
      }
    }

    // Clear table
    table.items = [];
    table.total_amount = 0;
    table.status = 'empty';
    table.waiter_name = undefined;
    table.updated_at = new Date().toISOString();

    this.saveData();
    return { success: true, order: completedOrder };
  }

  public getSaboyOrders(): SaboyOrder[] {
    if (!this.state.saboy_orders) {
      this.state.saboy_orders = [];
    }
    return this.state.saboy_orders;
  }

  public saveSaboyOrder(clientName: string, items: any[], totalAmount: number, orderId?: number): SaboyOrder {
    const saboys = this.getSaboyOrders();
    if (orderId) {
      const existing = saboys.find((s) => s.id === Number(orderId));
      if (existing) {
        if (clientName) existing.client_name = clientName;
        existing.items = items;
        existing.total_amount = totalAmount;
        this.saveData();
        return existing;
      }
    }
    const newId = Math.max(100, ...saboys.map((s) => s.id), 0) + 1;
    const newSaboy: SaboyOrder = {
      id: newId,
      client_name: clientName || `Saboy #${newId}`,
      items: items || [],
      total_amount: totalAmount || 0,
      status: 'pending',
      created_at: new Date().toISOString(),
    };
    saboys.unshift(newSaboy);
    this.saveData();
    return newSaboy;
  }

  public completeSaboyOrder(id: number) {
    const saboys = this.getSaboyOrders();
    this.state.saboy_orders = saboys.filter((s) => s.id !== Number(id));
    this.saveData();
    return true;
  }
}

export const store = new StoreManager();
