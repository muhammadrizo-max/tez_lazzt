import React, { useState, useEffect } from 'react';
import { AuthUser, Category, Courier, Order, Product, PromoCode, RestaurantTable, SystemStats, User, Waiter } from '../types';
import {
  LayoutDashboard,
  Bike,
  Package,
  UtensilsCrossed,
  Ticket,
  Users,
  Send,
  Settings,
  Plus,
  RefreshCw,
  Star,
  AlertTriangle,
  CheckCircle2,
  Copy,
  UserPlus,
  Search,
  Check,
  X,
  Phone,
  ShieldAlert,
  ArrowRight,
  Edit,
  Trash2,
  Upload,
  Image as ImageIcon,
  KeyRound,
  TrendingUp,
  PieChart as PieChartIcon,
  BarChart3,
  CreditCard,
  Eye,
  Printer,
  ArrowLeftRight,
  Menu as MenuIcon,
  ChevronLeft,
  ChevronRight,
  Grid,
  Sun,
  Moon,
  ShoppingBag,
  PhoneCall,
  Receipt,
  Calendar,
  Clock,
  Sparkles,
  Minus,
  LogOut,
  Palette,
  MapPin,
  UserCheck,
  Download,
  ChevronDown,
  Map
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';

const PRESET_FOOD_IMAGES = [
  { name: 'Cheeseburger', url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80' },
  { name: 'Double Burger', url: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=600&q=80' },
  { name: 'Mol go\'shtli Lavash', url: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=600&q=80' },
  { name: 'Tovuqli Lavash', url: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=600&q=80' },
  { name: 'Pitsa Pepperoni', url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80' },
  { name: 'Coca Cola 0.5L', url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=600&q=80' },
  { name: 'Fri Kartoshkasi', url: 'https://images.unsplash.com/photo-1576107232684-1279f390859f?auto=format&fit=crop&w=600&q=80' },
  { name: 'Xot-dog', url: 'https://images.unsplash.com/photo-1619740455993-9e612b1af08a?auto=format&fit=crop&w=600&q=80' },
];

const CHART_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#3b82f6'];

interface AdminDashboardProps {
  authUser?: AuthUser;
  onLogout?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ authUser, onLogout }) => {
  const isOfitsiant = authUser?.role === 'ofitsiant' || authUser?.role === 'waiter';

  // Navigation & View States
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<
    'pos' | 'orders' | 'menu' | 'couriers' | 'promos' | 'users' | 'stats'
  >('pos');

  // Mobile POS Tab State: 'cart' (Stollar/Savat) or 'menu' (Menyu)
  const [mobilePosTab, setMobilePosTab] = useState<'cart' | 'menu'>('cart');

  // Staff SubTab: 'couriers' or 'waiters'
  const [staffSubTab, setStaffSubTab] = useState<'couriers' | 'waiters'>('couriers');

  // Theme State: 'dark' | 'light' | 'sabzi' | 'qizil' | 'sariq'
  const [colorTheme, setColorTheme] = useState<'dark' | 'light' | 'sabzi' | 'qizil' | 'sariq'>(
    () => (localStorage.getItem('tezlazzat_theme') as any) || 'dark'
  );

  // Table Location & Status Filters in Zal mode
  const [selectedLocationFilter, setSelectedLocationFilter] = useState<string>('all');
  const [tableStatusFilter, setTableStatusFilter] = useState<'all' | 'empty' | 'occupied' | 'reserved'>('all');

  // Settings Modal Active Tab: 'system' | 'tables'
  const [settingsTab, setSettingsTab] = useState<'system' | 'tables'>('system');

  // POS Sub-mode: ZAL (Hall), SABOY (Takeaway), DASTAVKA (Delivery)
  const [posMode, setPosMode] = useState<'zal' | 'saboy' | 'dastavka'>('zal');

  // Core Data States
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [waiters, setWaiters] = useState<Waiter[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [settings, setSettings] = useState<any>(null);

  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);

  // Table CRUD Modal & Forms
  const [showAddTableModal, setShowAddTableModal] = useState(false);
  const [editingTable, setEditingTable] = useState<RestaurantTable | null>(null);
  const [newTableName, setNewTableName] = useState('');
  const [newTableSeats, setNewTableSeats] = useState<number>(4);
  const [newTableLocation, setNewTableLocation] = useState('Zalda');

  // Waiter CRUD Modal & Forms
  const [showAddWaiterModal, setShowAddWaiterModal] = useState(false);
  const [editingWaiter, setEditingWaiter] = useState<Waiter | null>(null);
  const [newWaiterName, setNewWaiterName] = useState('');
  const [newWaiterPhone, setNewWaiterPhone] = useState('');
  const [generatedWaiter, setGeneratedWaiter] = useState<Waiter | null>(null);

  // Active Delivery Order Customer selection for product ordering
  const [selectedDeliveryOrderId, setSelectedDeliveryOrderId] = useState<number | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [newCatIcon, setNewCatIcon] = useState<string>('🍔');
  const [statsTimeframe, setStatsTimeframe] = useState<'weekly' | 'monthly' | 'all'>('weekly');

  // POS State
  const [selectedTableId, setSelectedTableId] = useState<number>(1);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<number | 'all'>('all');
  const [productSearch, setProductSearch] = useState('');
  
  // Saboy Cart State
  const [saboyItems, setSaboyItems] = useState<{ id: number; product_id: number; product_name: string; quantity: number; price: number }[]>([]);
  const [saboyClientName, setSaboyClientName] = useState('');
  const [showSaboyTableDropdown, setShowSaboyTableDropdown] = useState(false);
  const [saboyOrders, setSaboyOrders] = useState<{ id: number; client_name: string; items: { id: number; product_id: number; product_name: string; quantity: number; price: number }[]; total_amount: number; status: string; created_at: string }[]>([]);
  const [activePhoneInput, setActivePhoneInput] = useState<'name' | 'phone' | 'address' | 'note'>('name');

  // Modals & Forms State
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferTargetTableId, setTransferTargetTableId] = useState<number | null>(null);

  // POS Checkout & Receipt Modal
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [checkoutTarget, setCheckoutTarget] = useState<{ type: 'table' | 'saboy'; tableId?: number } | null>(null);
  const [checkoutReceiptType, setCheckoutReceiptType] = useState<'keshbek' | 'oddiy'>('keshbek');
  const [checkoutPaymentMethod, setCheckoutPaymentMethod] = useState<'cash' | 'click' | 'payme'>('cash');
  const [checkoutUserPhone, setCheckoutUserPhone] = useState('');
  const [printedReceiptData, setPrintedReceiptData] = useState<any>(null);
  const [kitchenTicketData, setKitchenTicketData] = useState<any>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Thermal printer audio beep effect
  const playKitchenPrinterBeep = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const audioCtx = new AudioCtx();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.35);
    } catch (e) {
      console.error('Audio beep error:', e);
    }
  };

  // Phone Order Creation Modal (in Dastavka POS)
  const [showPhoneOrderModal, setShowPhoneOrderModal] = useState(false);
  const [showYandexMapModal, setShowYandexMapModal] = useState(false);
  const [phoneOrderForm, setPhoneOrderForm] = useState({
    name: '',
    phone: '+998',
    address: '',
    note: '',
    courier_id: '',
  });
  const [phoneOrderCart, setPhoneOrderCart] = useState<{ product_id: number; product_name: string; quantity: number; price: number }[]>([]);

  // Other Modals (Couriers, Products, Categories, Promos, Broadcast)
  const [showAddCourierModal, setShowAddCourierModal] = useState(false);
  const [editingCourier, setEditingCourier] = useState<Courier | null>(null);
  const [newCourierName, setNewCourierName] = useState('');
  const [newCourierPhone, setNewCourierPhone] = useState('');
  const [newCourierUsername, setNewCourierUsername] = useState('');
  const [newCourierPassword, setNewCourierPassword] = useState('');
  const [generatedCourier, setGeneratedCourier] = useState<Courier | null>(null);

  const [newWaiterUsername, setNewWaiterUsername] = useState('');
  const [newWaiterPassword, setNewWaiterPassword] = useState('');

  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatEmoji, setNewCatEmoji] = useState('🍔');

  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [newProdCatId, setNewProdCatId] = useState<number>(1);
  const [newProdName, setNewProdName] = useState('');
  const [newProdDesc, setNewProdDesc] = useState('');
  const [newProdPrice, setNewProdPrice] = useState<number>(25000);
  const [newProdPhoto, setNewProdPhoto] = useState('');

  const [showAddPromoModal, setShowAddPromoModal] = useState(false);
  const [editingPromo, setEditingPromo] = useState<PromoCode | null>(null);
  const [newPromoCode, setNewPromoCode] = useState('');
  const [newPromoType, setNewPromoType] = useState<'percent' | 'fixed'>('percent');
  const [newPromoVal, setNewPromoVal] = useState<number>(10);
  const [newPromoUses, setNewPromoUses] = useState<number>(100);
  const [newPromoExpiresAt, setNewPromoExpiresAt] = useState<string>('2026-12-31');

  // Broadcast Modal State
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState('');

  // Virtual Keyboard State
  const [showVirtualKeyboard, setShowVirtualKeyboard] = useState(false);

  // Active User Filter Tab for Loyalty Page
  const [userCategoryFilter, setUserCategoryFilter] = useState<'all' | 'active' | 'high_volume' | 'loyalty_full'>('all');

  const [orderFilter, setOrderFilter] = useState<string>('all');
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userFilterLoyalty, setUserFilterLoyalty] = useState<'all' | 'full' | 'stamped'>('all');
  const [lineChartRange, setLineChartRange] = useState<'weekly' | 'monthly' | 'all'>('weekly');

  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState<Order | null>(null);
  const [receiptImgError, setReceiptImgError] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // Settings Form State
  const [settingsForm, setSettingsForm] = useState({
    admin_username: 'admin',
    admin_password: 'admin123',
    backup_user_id: '6582564319',
    backup_group_id: '-1003857127288',
    backup_time: '23:00',
    payment_group_id: '-1003857127288',
    channel_username: '@kalitlar_kanali',
    required_channel_mode: 'all' as 'all' | 'guests' | 'off',
    loyalty_enabled: true,
    loyalty_target_stamps: 6,
    loyalty_prize_description: 'Bepul Combo Set va Ichimlik 🎁',
    delivery_fee: 15000,
    free_delivery_from: 100000,
  });

  const safeJson = async (res: Response) => {
    try {
      const ct = res.headers.get('content-type') || '';
      if (res.ok && ct.includes('application/json')) {
        return await res.json();
      }
    } catch {
      return null;
    }
    return null;
  };

  const loadAllData = async (showSpin = false) => {
    if (showSpin) setIsRefreshing(true);
    try {
      const [sRes, cRes, wRes, oRes, mRes, pRes, uRes, tRes, setRes, saboyRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/couriers'),
        fetch('/api/admin/waiters'),
        fetch('/api/admin/orders'),
        fetch('/api/admin/menu'),
        fetch('/api/admin/promos'),
        fetch('/api/admin/users'),
        fetch('/api/tables'),
        fetch('/api/admin/settings'),
        fetch('/api/saboy-orders'),
      ]);

      const saboyData = await safeJson(saboyRes);
      if (saboyData && Array.isArray(saboyData)) setSaboyOrders(saboyData);

      const statsData = await safeJson(sRes);
      if (statsData) setStats(statsData);

      const couriersData = await safeJson(cRes);
      if (couriersData) setCouriers(couriersData);

      const waitersData = await safeJson(wRes);
      if (waitersData) setWaiters(waitersData);

      const ordersData = await safeJson(oRes);
      if (ordersData) setOrders(ordersData);

      const mData = await safeJson(mRes);
      if (mData) {
        setCategories(mData.categories || []);
        setProducts(mData.products || []);
      }

      const promosData = await safeJson(pRes);
      if (promosData) setPromos(promosData);

      const usersData = await safeJson(uRes);
      if (usersData) setUsers(usersData);

      const tablesData = await safeJson(tRes);
      if (tablesData && Array.isArray(tablesData)) {
        setTables(tablesData);
      }

      const setData = await safeJson(setRes);
      if (setData) {
        setSettings(setData);
        setSettingsForm({
          admin_username: setData.admin_username || 'admin',
          admin_password: setData.admin_password || 'admin123',
          backup_user_id: setData.backup_user_id || '6582564319',
          backup_group_id: setData.backup_group_id || '-1003857127288',
          backup_time: setData.backup_time || '23:00',
          payment_group_id: setData.payment_group_id || '-1003857127288',
          channel_username: setData.required_channel || setData.channel_username || '@kalitlar_kanali',
          required_channel_mode: setData.required_channel_mode || 'all',
          loyalty_enabled: setData.loyalty_enabled ?? true,
          loyalty_target_stamps: setData.loyalty_target_stamps ?? 6,
          loyalty_prize_description: setData.loyalty_prize_description || 'Bepul Combo Set va Ichimlik 🎁',
          delivery_fee: setData.delivery_fee || 15000,
          free_delivery_from: setData.free_delivery_from || 100000,
        });
      }
    } catch (err) {
      console.warn('Failed to load admin data:', err);
    } finally {
      setLoading(false);
      if (showSpin) setTimeout(() => setIsRefreshing(false), 600);
    }
  };

  useEffect(() => {
    if (isOfitsiant) {
      if (activeTab !== 'pos') {
        setActiveTab('pos');
      }
      if (posMode === 'dastavka') {
        setPosMode('zal');
      }
    }
  }, [isOfitsiant, activeTab, posMode]);

  useEffect(() => {
    loadAllData();
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', colorTheme);
    localStorage.setItem('tezlazzat_theme', colorTheme);
  }, [colorTheme]);

  useEffect(() => {
    if (!autoRefreshEnabled) return;
    const interval = setInterval(() => {
      loadAllData();
    }, 7000);
    return () => clearInterval(interval);
  }, [autoRefreshEnabled]);

  // Table getters
  const currentSelectedTable = tables.find((t) => t.id === selectedTableId) || {
    id: selectedTableId,
    name: `Stol ${selectedTableId}`,
    seats: 4,
    status: 'empty' as const,
    items: [],
    total_amount: 0,
  };

  // Add item to Table or Saboy Cart
  const handleAddProductToPOS = async (product: Product) => {
    if (posMode === 'zal') {
      const existingItemIndex = currentSelectedTable.items.findIndex((i) => i.product_id === product.id);
      let updatedItems = [...currentSelectedTable.items];

      if (existingItemIndex > -1) {
        updatedItems[existingItemIndex].quantity += 1;
      } else {
        updatedItems.push({
          id: Date.now(),
          product_id: product.id,
          product_name: product.name,
          quantity: 1,
          price: product.price,
        });
      }

      // Optimistic update
      const newStatus = 'occupied';
      const waiterToAssign = currentSelectedTable.waiter_name || authUser?.name || undefined;
      const updatedTables = tables.map((t) =>
        t.id === selectedTableId
          ? {
              ...t,
              status: newStatus as any,
              items: updatedItems,
              total_amount: updatedItems.reduce((s, item) => s + item.price * item.quantity, 0),
              waiter_name: waiterToAssign,
            }
          : t
      );
      setTables(updatedTables);

      try {
        await fetch(`/api/tables/${selectedTableId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: newStatus,
            items: updatedItems,
            waiter_name: waiterToAssign,
          }),
        });
      } catch (err) {
        console.error('Failed to update table:', err);
      }
    } else if (posMode === 'saboy') {
      setSaboyItems((prev) => {
        const idx = prev.findIndex((i) => i.product_id === product.id);
        if (idx > -1) {
          return prev.map((item, i) =>
            i === idx ? { ...item, quantity: item.quantity + 1 } : item
          );
        }
        return [
          ...prev,
          {
            id: Date.now() + Math.random(),
            product_id: product.id,
            product_name: product.name,
            quantity: 1,
            price: product.price,
          },
        ];
      });
    } else if (posMode === 'dastavka') {
      if (!selectedDeliveryOrderId) {
        alert("⚠️ Iltimos, avval chap tomondan mijozni tanlang yoki '+ Yangi Telefon Buyurtmasi' orqali mijoz qo'shing!");
        return;
      }
      const targetOrder = orders.find((o) => o.id === selectedDeliveryOrderId);
      if (!targetOrder) return;

      const currentItems = targetOrder.items || [];
      const idx = currentItems.findIndex((i) => i.product_id === product.id);
      let updatedItems = [...currentItems];

      if (idx > -1) {
        updatedItems[idx] = { ...updatedItems[idx], quantity: updatedItems[idx].quantity + 1 };
      } else {
        updatedItems.push({
          id: Date.now(),
          product_id: product.id,
          product_name: product.name,
          quantity: 1,
          price: product.price,
        });
      }

      const totalAmt = updatedItems.reduce((s, item) => s + item.price * item.quantity, 0);

      setOrders((prev) =>
        prev.map((o) => (o.id === selectedDeliveryOrderId ? { ...o, items: updatedItems, total_amount: totalAmt } : o))
      );

      try {
        await fetch('/api/admin/orders/update-items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order_id: selectedDeliveryOrderId, items: updatedItems, total_amount: totalAmt }),
        });
      } catch (err) {
        console.error('Failed to update delivery order items:', err);
      }
    }
  };

  // Decrement item quantity in Table or Saboy Cart
  const handleRemoveProductFromPOS = async (productId: number) => {
    if (posMode === 'zal') {
      const idx = currentSelectedTable.items.findIndex((i) => i.product_id === productId);
      if (idx === -1) return;

      let updatedItems = [...currentSelectedTable.items];
      if (updatedItems[idx].quantity > 1) {
        updatedItems[idx].quantity -= 1;
      } else {
        updatedItems.splice(idx, 1);
      }

      const newStatus = updatedItems.length > 0 ? 'occupied' : 'empty';
      const updatedTables = tables.map((t) =>
        t.id === selectedTableId
          ? {
              ...t,
              status: newStatus as any,
              items: updatedItems,
              total_amount: updatedItems.reduce((s, item) => s + item.price * item.quantity, 0),
            }
          : t
      );
      setTables(updatedTables);

      try {
        await fetch(`/api/tables/${selectedTableId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: newStatus,
            items: updatedItems,
          }),
        });
      } catch (err) {
        console.error('Failed to update table:', err);
      }
    } else if (posMode === 'saboy') {
      setSaboyItems((prev) => {
        const idx = prev.findIndex((i) => i.product_id === productId);
        if (idx === -1) return prev;
        if (prev[idx].quantity > 1) {
          const updated = [...prev];
          updated[idx].quantity -= 1;
          return updated;
        }
        return prev.filter((i) => i.product_id !== productId);
      });
    } else if (posMode === 'dastavka') {
      if (!selectedDeliveryOrderId) return;
      const targetOrder = orders.find((o) => o.id === selectedDeliveryOrderId);
      if (!targetOrder) return;

      const currentItems = targetOrder.items || [];
      const idx = currentItems.findIndex((i) => i.product_id === productId);
      if (idx === -1) return;

      let updatedItems = [...currentItems];
      if (updatedItems[idx].quantity > 1) {
        updatedItems[idx] = { ...updatedItems[idx], quantity: updatedItems[idx].quantity - 1 };
      } else {
        updatedItems.splice(idx, 1);
      }

      const totalAmt = updatedItems.reduce((s, item) => s + item.price * item.quantity, 0);

      setOrders((prev) =>
        prev.map((o) => (o.id === selectedDeliveryOrderId ? { ...o, items: updatedItems, total_amount: totalAmt } : o))
      );

      try {
        await fetch('/api/admin/orders/update-items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order_id: selectedDeliveryOrderId, items: updatedItems, total_amount: totalAmt }),
        });
      } catch (err) {
        console.error('Failed to update delivery order items:', err);
      }
    }
  };

  // Get current product quantity in active cart
  const getItemQtyInCart = (productId: number) => {
    if (posMode === 'zal') {
      const item = currentSelectedTable.items.find((i) => i.product_id === productId);
      return item ? item.quantity : 0;
    }
    if (posMode === 'saboy') {
      const item = saboyItems.find((i) => i.product_id === productId);
      return item ? item.quantity : 0;
    }
    if (posMode === 'dastavka') {
      if (!selectedDeliveryOrderId) return 0;
      const order = orders.find((o) => o.id === selectedDeliveryOrderId);
      if (!order) return 0;
      const item = (order.items || []).find((i) => i.product_id === productId);
      return item ? item.quantity : 0;
    }
    return 0;
  };

  // Clear current POS Cart / Table
  const handleClearTableAction = async (tableId: number, tableName?: string) => {
    try {
      // 1. Immediate optimistic UI state reset
      setTables((prev) =>
        prev.map((tbl) =>
          tbl.id === tableId
            ? { ...tbl, status: 'empty', items: [], total_amount: 0, waiter_name: undefined }
            : tbl
        )
      );

      // 2. Call server endpoints to clear backend
      await Promise.all([
        fetch(`/api/tables/clear/${tableId}`, { method: 'POST' }).catch(() => {}),
        fetch(`/api/tables/${tableId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'empty', items: [], total_amount: 0, waiter_name: null }),
        }).catch(() => {}),
      ]);

      // 3. Refresh store state
      loadAllData(true);
    } catch (err) {
      console.error('Stolni tozalashda xatolik:', err);
    }
  };

  const handleClearPOS = async () => {
    if (posMode === 'zal') {
      try {
        await handleClearTableAction(selectedTableId);
      } catch (err) {
        console.error('Stolni bekor qilishda xatolik:', err);
      }
    } else if (posMode === 'saboy') {
      setSaboyItems([]);
      setSaboyClientName('');
    }
  };

  // Reserve Table (Bron)
  const handleReserveTable = async () => {
    const newStatus = currentSelectedTable.status === 'reserved' ? 'empty' : 'reserved';
    try {
      await fetch(`/api/tables/${selectedTableId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      loadAllData();
    } catch (err) {
      alert('Stolni bron qilishda xatolik');
    }
  };

  // Transfer Table (Stolni o'tkazish)
  const handleExecuteTransfer = async () => {
    if (!transferTargetTableId || transferTargetTableId === selectedTableId) {
      alert("Iltimos, boshqa maqsadli stolni tanlang!");
      return;
    }
    try {
      const res = await fetch('/api/tables/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from_table_id: selectedTableId,
          to_table_id: transferTargetTableId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        setShowTransferModal(false);
        setSelectedTableId(transferTargetTableId);
        loadAllData();
      } else {
        alert(data.message || 'Xatolik yuz berdi');
      }
    } catch (err) {
      alert('Stolni o\'tkazishda xatolik');
    }
  };

  // Kitchen Ticket (Tayyorlash / Oshxonaga yuborish - To'g'ridan-to'g'ri chek)
  const handleSendToKitchen = async () => {
    if (posMode === 'zal') {
      if (currentSelectedTable.items.length === 0) {
        alert("Oshxonaga yuborish uchun stolda kamida 1 ta mahsulot bo'lishi kerak!");
        return;
      }
      setKitchenTicketData({
        title: `OSHXONA BUYURTMASI - ${currentSelectedTable.name}${currentSelectedTable.waiter_name ? ` (Ofitsiant: ${currentSelectedTable.waiter_name})` : ''}`,
        date: new Date().toLocaleString('ru-RU'),
        items: currentSelectedTable.items,
        total: currentSelectedTable.total_amount,
      });

      playKitchenPrinterBeep();
      setToastMessage("🍳 Buyurtma oshxonaga yuborildi! Chek apparatiga uzatildi...");
      setTimeout(() => setToastMessage(null), 3000);

      setTimeout(() => {
        window.print();
        setTimeout(() => setKitchenTicketData(null), 500);
      }, 100);
    } else if (posMode === 'saboy') {
      if (!saboyClientName.trim()) {
        alert("⚠️ Saboy (olib ketish) buyurtmasi uchun mijoz ismi yoki maxsus belgini kiritish MAJBURIY!");
        return;
      }
      if (saboyItems.length === 0) {
        alert("Oshxonaga yuborish uchun kamida 1 ta mahsulot tanlang!");
        return;
      }
      const totalAmt = saboyItems.reduce((s, i) => s + i.price * i.quantity, 0);

      try {
        const res = await fetch('/api/saboy-orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client_name: saboyClientName.trim(),
            items: saboyItems,
            total_amount: totalAmt,
          }),
        });
        const data = await res.json();
        if (data.success) {
          setKitchenTicketData({
            title: `OSHXONA BUYURTMASI - SABOY (${saboyClientName.trim()})`,
            date: new Date().toLocaleString('ru-RU'),
            items: saboyItems,
            total: totalAmt,
          });

          playKitchenPrinterBeep();
          setToastMessage("🍳 Buyurtma oshxonaga yuborildi! Chek apparatiga uzatildi...");
          setTimeout(() => setToastMessage(null), 3000);

          setTimeout(() => {
            window.print();
            setTimeout(() => setKitchenTicketData(null), 500);
          }, 100);
          setSaboyItems([]);
          setSaboyClientName('');
          loadAllData();
        }
      } catch (err) {
        console.error('Failed to save saboy order:', err);
      }
    }
  };

  // Dastavka order Tayyorlash (Kitchen Ticket direct print)
  const handleSendDeliveryToKitchen = (o: Order) => {
    setKitchenTicketData({
      title: `OSHXONA BUYURTMASI - DASTAVKA (#ORD-${o.id} • ${o.user_name})`,
      date: new Date().toLocaleString('ru-RU'),
      items: o.items || [],
      total: o.total_amount,
    });

    playKitchenPrinterBeep();
    setToastMessage("🍳 Buyurtma oshxonaga yuborildi! Chek apparatiga uzatildi...");
    setTimeout(() => setToastMessage(null), 3000);

    setTimeout(() => {
      window.print();
      setTimeout(() => setKitchenTicketData(null), 500);
    }, 100);
  };

  // Complete Saboy Order
  const handleCompleteSaboyOrder = async (id: number) => {
    try {
      await fetch('/api/saboy-orders/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      loadAllData();
    } catch (err) {
      alert("Saboy buyurtmasini yakunlashda xatolik");
    }
  };

  // Cancel Delivery Order
  const handleCancelOrder = async (orderId: number) => {
    try {
      setOrders((prev) => prev.filter((o) => Number(o.id) !== Number(orderId)));
      if (Number(selectedDeliveryOrderId) === Number(orderId)) {
        setSelectedDeliveryOrderId(null);
      }
      await fetch('/api/admin/orders/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: Number(orderId) }),
      });
      loadAllData(true);
    } catch (err) {
      console.error("Buyurtmani bekor qilishda xatolik:", err);
    }
  };

  // Open Checkout Modal
  const handleOpenCheckoutModal = (type: 'table' | 'saboy', tableId?: number) => {
    const tId = tableId || selectedTableId;
    const targetTable = tables.find((t) => t.id === tId);

    if (type === 'table') {
      if (!targetTable || targetTable.items.length === 0) {
        alert("Ushbu stolda buyurtma mavjud emas!");
        return;
      }
    } else {
      if (!saboyClientName.trim()) {
        alert("⚠️ Saboy (olib ketish) buyurtmasi uchun mijoz ismi yoki maxsus belgini kiritish MAJBURIY! (Chalkashlik bo'lmasligi uchun)");
        return;
      }
      if (saboyItems.length === 0) {
        alert("Saboy savatchasida buyurtma yo'q!");
        return;
      }
    }

    setCheckoutTarget({ type, tableId: tId });
    setShowCheckoutModal(true);
  };

  // Execute Checkout & Print Receipt
  const handleExecuteCheckout = async () => {
    if (!checkoutTarget) return;

    if (checkoutTarget.type === 'table') {
      const tId = checkoutTarget.tableId || selectedTableId;
      const targetTable = tables.find((t) => t.id === tId);
      if (!targetTable) return;

      try {
        const res = await fetch('/api/tables/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            table_id: tId,
            payment_method: checkoutPaymentMethod,
            receipt_type: checkoutReceiptType,
            user_phone: checkoutUserPhone,
          }),
        });
        const data = await res.json();
        if (data.success) {
          setPrintedReceiptData({
            order_id: data.order?.id || Date.now(),
            table_name: targetTable.name,
            items: targetTable.items,
            total_amount: targetTable.total_amount,
            receipt_type: checkoutReceiptType,
            payment_method: checkoutPaymentMethod,
            date: new Date().toLocaleString('ru-RU'),
            phone: checkoutUserPhone,
          });
          setShowCheckoutModal(false);
          loadAllData();
        } else {
          alert(data.message || 'Xatolik yuz berdi');
        }
      } catch (err) {
        alert('To\'lovni amalga oshirishda xatolik');
      }
    } else if (checkoutTarget.type === 'saboy') {
      const saboyTotal = saboyItems.reduce((s, i) => s + i.price * i.quantity, 0);
      setPrintedReceiptData({
        order_id: Date.now(),
        table_name: `Saboy ${saboyClientName ? `(${saboyClientName})` : ''}`,
        items: saboyItems,
        total_amount: saboyTotal,
        receipt_type: checkoutReceiptType,
        payment_method: checkoutPaymentMethod,
        date: new Date().toLocaleString('ru-RU'),
        phone: checkoutUserPhone,
      });

      // Clear saboy
      setSaboyItems([]);
      setSaboyClientName('');
      setShowCheckoutModal(false);
    }
  };

  // Theme Change Handler
  const handleThemeChange = (theme: 'dark' | 'light' | 'sabzi' | 'qizil' | 'sariq') => {
    setColorTheme(theme);
    localStorage.setItem('tezlazzat_theme', theme);
  };

  // Table Management Handlers
  const handleAddTable = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTable) {
        const res = await fetch('/api/admin/tables/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: Number(editingTable.id),
            name: newTableName,
            seats: Number(newTableSeats),
            location: newTableLocation,
          }),
        });
        const data = await res.json();
        if (data.success) {
          alert('Stol ma\'lumotlari muvaffaqiyatli tahrirlandi!');
        } else {
          alert(data.error || 'Tahrirlashda xatolik!');
        }
      } else {
        const res = await fetch('/api/tables/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: newTableName,
            seats: Number(newTableSeats),
            location: newTableLocation,
          }),
        });
        const data = await res.json();
        if (data.success) {
          alert('Yangi stol muvaffaqiyatli qo\'shildi!');
        } else {
          alert(data.error || 'Stol qo\'shishda xatolik!');
        }
      }
      setShowAddTableModal(false);
      setEditingTable(null);
      setNewTableName('');
      setNewTableSeats(4);
      setNewTableLocation('Zalda');
      loadAllData(true);
    } catch (err) {
      alert('Stolni saqlashda xatolik yuz berdi');
    }
  };

  const handleDeleteTable = async (tableId: number) => {
    try {
      const res = await fetch('/api/admin/tables/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: Number(tableId) }),
      });
      const data = await res.json();
      if (data.success) {
        setTables((prev) => {
          const next = prev.filter((t) => Number(t.id) !== Number(tableId));
          if (Number(selectedTableId) === Number(tableId) && next.length > 0) {
            setSelectedTableId(next[0].id);
          }
          return next;
        });
        if (editingTable && Number(editingTable.id) === Number(tableId)) {
          setEditingTable(null);
          setNewTableName('');
          setNewTableSeats(4);
          setNewTableLocation('Zalda');
        }
      } else {
        alert(data.error || 'Stolni o\'chirishda xatolik');
      }
      loadAllData(true);
    } catch (err) {
      alert('Stolni o\'chirishda xatolik yuz berdi');
    }
  };

  // Waiters Management Handlers
  const handleAddWaiter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWaiterName.trim() || !newWaiterPhone.trim()) {
      alert("Iltimos, ofitsiant ismi va telefon raqamini kiriting!");
      return;
    }
    try {
      const res = await fetch('/api/admin/waiters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: newWaiterName, phone: newWaiterPhone }),
      });
      const data = await res.json();
      if (data.success && data.waiter) {
        setGeneratedWaiter(data.waiter);
        setNewWaiterName('');
        setNewWaiterPhone('');
        loadAllData();
      } else {
        alert(data.error || 'Ofitsiant qo\'shishda xatolik');
      }
    } catch (err) {
      alert('Ofitsiant qo\'shishda xatolik');
    }
  };

  const handleDeleteWaiter = async (waiterId: string) => {
    try {
      await fetch('/api/admin/waiters/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: waiterId }),
      });
      loadAllData(true);
    } catch (err) {
      console.error('Ofitsiantni o\'chirishda xatolik:', err);
    }
  };

  const handleResetWaiterCredentials = async (waiterId: string) => {
    try {
      const res = await fetch('/api/admin/waiters/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: waiterId, reset_credentials: true }),
      });
      const data = await res.json();
      if (data.success && data.waiter) {
        setGeneratedWaiter(data.waiter);
        loadAllData();
      } else {
        alert(data.error || 'Parolni yangilashda xatolik');
      }
    } catch (err) {
      alert('Parolni yangilashda xatolik');
    }
  };

  const generate10CharLogin = (): string => {
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
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) {
      alert("Kategoriya nomini kiriting!");
      return;
    }
    try {
      if (editingCategory) {
        await fetch('/api/admin/categories/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingCategory.id,
            name: newCatName,
            icon: newCatIcon || '📁',
          }),
        });
        alert("Kategoriya yangilandi!");
      } else {
        await fetch('/api/admin/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: newCatName,
            icon: newCatIcon || '📁',
          }),
        });
        alert("Yangi kategoriya qo'shildi!");
      }
      setShowAddCategoryModal(false);
      setEditingCategory(null);
      setNewCatName('');
      loadAllData(true);
    } catch (err) {
      alert("Kategoriyani saqlashda xatolik!");
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim() || !newProdPrice) {
      alert("Mahsulot nomi va narxini kiriting!");
      return;
    }
    try {
      if (editingProduct) {
        await fetch('/api/admin/products/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingProduct.id,
            category_id: newProdCatId,
            name: newProdName,
            description: newProdDesc,
            price: Number(newProdPrice),
            photo_url: newProdPhoto,
          }),
        });
        alert("Mahsulot tahrirlandi!");
      } else {
        await fetch('/api/admin/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            category_id: newProdCatId,
            name: newProdName,
            description: newProdDesc,
            price: Number(newProdPrice),
            photo_url: newProdPhoto,
          }),
        });
        alert("Yangi mahsulot qo'shildi!");
      }
      setShowAddProductModal(false);
      setEditingProduct(null);
      setNewProdName('');
      setNewProdDesc('');
      setNewProdPrice(25000);
      setNewProdPhoto('');
      loadAllData(true);
    } catch (err) {
      alert("Mahsulotni saqlashda xatolik!");
    }
  };

  const handleSaveCourier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourierName.trim() || !newCourierPhone.trim()) {
      alert("Kuryer ismi va telefon raqamini kiriting!");
      return;
    }
    try {
      if (editingCourier) {
        await fetch('/api/admin/couriers/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingCourier.id,
            full_name: newCourierName,
            phone: newCourierPhone,
            username: newCourierUsername,
            password: newCourierPassword,
          }),
        });
        alert("Kuryer ma'lumotlari yangilandi!");
      } else {
        await fetch('/api/admin/couriers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            full_name: newCourierName,
            phone: newCourierPhone,
            username: newCourierUsername || generate10CharLogin(),
            password: newCourierPassword || String(Math.floor(10000000 + Math.random() * 90000000)),
          }),
        });
        alert("Yangi kuryer muvaffaqiyatli qo'shildi!");
      }
      setShowAddCourierModal(false);
      setEditingCourier(null);
      setNewCourierName('');
      setNewCourierPhone('');
      setNewCourierUsername('');
      setNewCourierPassword('');
      loadAllData(true);
    } catch (err) {
      alert("Kuryerni saqlashda xatolik!");
    }
  };

  const handleDeleteCourier = async (courierId: string) => {
    try {
      await fetch('/api/admin/couriers/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: courierId }),
      });
      loadAllData(true);
    } catch (err) {
      console.error("Kuryerni o'chirishda xatolik:", err);
    }
  };

  const handleSaveWaiter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWaiterName.trim() || !newWaiterPhone.trim()) {
      alert("Ofitsiant ismi va telefon raqamini kiriting!");
      return;
    }
    try {
      if (editingWaiter) {
        await fetch('/api/admin/waiters/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingWaiter.id,
            full_name: newWaiterName,
            phone: newWaiterPhone,
            username: newWaiterUsername,
            password: newWaiterPassword,
          }),
        });
        alert("Ofitsiant ma'lumotlari yangilandi!");
      } else {
        await fetch('/api/admin/waiters', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            full_name: newWaiterName,
            phone: newWaiterPhone,
            username: newWaiterUsername || generate10CharLogin(),
            password: newWaiterPassword || String(Math.floor(10000000 + Math.random() * 90000000)),
          }),
        });
        alert("Yangi ofitsiant muvaffaqiyatli qo'shildi!");
      }
      setShowAddWaiterModal(false);
      setEditingWaiter(null);
      setNewWaiterName('');
      setNewWaiterPhone('');
      setNewWaiterUsername('');
      setNewWaiterPassword('');
      loadAllData(true);
    } catch (err) {
      alert("Ofitsiantni saqlashda xatolik!");
    }
  };

  // Phone Delivery Order Submit (Creates delivery order first, then food items are attached from catalog)
  const handleCreatePhoneOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneOrderForm.name.trim() || !phoneOrderForm.phone.trim() || !phoneOrderForm.address.trim()) {
      alert("Iltimos, mijoz ismi, telefon va manzilini to'liq kiriting!");
      return;
    }

    try {
      const res = await fetch('/api/admin/orders/create-manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_name: phoneOrderForm.name,
          user_phone: phoneOrderForm.phone,
          address: phoneOrderForm.address,
          note: phoneOrderForm.note || '',
          items: [],
          total_amount: 0,
          courier_id: phoneOrderForm.courier_id || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data.order) {
        alert("✅ Mijoz yetkazib berish ro'yxatiga qo'shildi! Endi menyudan taomlarni biriktirishingiz mumkin.");
        setShowPhoneOrderModal(false);
        setPhoneOrderForm({ name: '', phone: '+998', address: '', note: '', courier_id: '' });
        setPhoneOrderCart([]);
        setSelectedDeliveryOrderId(data.order.id);
        loadAllData(true);
      }
    } catch (err) {
      alert("Mijozni ro'yxatga qo'shishda xatolik!");
    }
  };

  // Export Statistics to CSV / Excel File
  const handleExportExcel = () => {
    if (!stats) return;
    const today = new Date().toISOString().split('T')[0];

    let csvContent = "\uFEFF"; // UTF-8 BOM for Excel
    csvContent += "TEZLAZZAT RESTORAN - TO'LIQ STATISTIKA HISOBOI\n";
    csvContent += `Sana: ${new Date().toLocaleString('ru-RU')}\n\n`;

    csvContent += "UMUMIY KO'RSATKICHLAR\n";
    csvContent += `Bugungi tushum (so'm);${stats.today_revenue || 0}\n`;
    csvContent += `Bugungi buyurtmalar count;${stats.today_orders || 0}\n`;
    csvContent += `Jami tushum (so'm);${stats.total_revenue || 0}\n`;
    csvContent += `Jami buyurtmalar count;${stats.total_orders || 0}\n`;
    csvContent += `Jami mijozlar count;${stats.total_users || 0}\n`;
    csvContent += `Aktiv kuryerlar count;${stats.active_couriers || 0}\n\n`;

    csvContent += "BUYURTMALAR RO'YXATI (HISTORY)\n";
    csvContent += "ID;Mijoz;Telefon;Summa (so'm);Holat;To'lov usuli;Sana\n";
    orders.forEach((o) => {
      csvContent += `${o.id};"${o.user_name || ''}";"${o.user_phone || ''}";${o.total_amount || 0};"${o.status}";"${o.payment_method}";"${o.created_at}"\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `TezLazzat_Statistika_${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Promo Handlers
  const handleSavePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPromoCode.trim() || !newPromoVal) {
      alert("Iltimos, promo kod va chegirma miqdorini kiriting!");
      return;
    }
    try {
      const endpoint = editingPromo ? '/api/admin/promos/update' : '/api/admin/promos';
      const bodyPayload = editingPromo
        ? {
            id: editingPromo.id,
            code: newPromoCode.trim().toUpperCase(),
            discount_type: newPromoType,
            discount_value: Number(newPromoVal),
            max_uses: Number(newPromoUses) || 100,
            expires_at: newPromoExpiresAt || '2026-12-31',
            is_active: true,
          }
        : {
            code: newPromoCode.trim().toUpperCase(),
            discount_type: newPromoType,
            discount_value: Number(newPromoVal),
            max_uses: Number(newPromoUses) || 100,
            expires_at: newPromoExpiresAt || '2026-12-31',
          };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload),
      });
      if (res.ok) {
        alert(editingPromo ? "✅ Promo kod muvaffaqiyatli tahrirlandi!" : "✅ Yangi promo kod yaratildi!");
        setShowAddPromoModal(false);
        setEditingPromo(null);
        setNewPromoCode('');
        setNewPromoVal(10);
        setNewPromoUses(100);
        setNewPromoExpiresAt('2026-12-31');
        loadAllData(true);
      }
    } catch (err) {
      alert("Promo kodni saqlashda xatolik");
    }
  };

  const handleDeletePromo = async (promoId: number) => {
    try {
      await fetch('/api/admin/promos/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: promoId }),
      });
      loadAllData(true);
    } catch (err) {
      console.error("Promo kodni o'chirishda xatolik:", err);
    }
  };

  // Handlers for Management
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsForm),
      });
      if (res.ok) {
        alert("Tizim sozlamalari muvaffaqiyatli saqlandi!");
        setShowSettingsModal(false);
        loadAllData(true);
      }
    } catch (err) {
      alert("Sozlamalarni saqlashda xatolik");
    }
  };

  const handleAddCourier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourierName.trim() || !newCourierPhone.trim()) return;
    try {
      const res = await fetch('/api/admin/couriers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: newCourierName, phone: newCourierPhone }),
      });
      const data = await res.json();
      if (data.success) {
        setGeneratedCourier(data.courier);
        setNewCourierName('');
        setNewCourierPhone('');
        loadAllData();
      }
    } catch (err) {
      alert('Kuryer qo\'shishda xatolik');
    }
  };

  const handleAssignCourier = async (orderId: number, courierId: string) => {
    try {
      const res = await fetch('/api/admin/orders/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId, courier_id: courierId }),
      });
      if (res.ok) {
        loadAllData();
      }
    } catch (err) {
      alert('Kuryerni biriktirishda xatolik');
    }
  };

  const handleOrderStatusChange = async (orderId: number, status: string) => {
    try {
      const res = await fetch('/api/admin/orders/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId, status }),
      });
      if (res.ok) {
        loadAllData();
      }
    } catch (err) {
      alert('Buyurtma holatini o\'zgartirishda xatolik');
    }
  };

  const handleConfirmPayment = async (orderId: number) => {
    try {
      const res = await fetch('/api/admin/orders/confirm-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId }),
      });
      if (res.ok) {
        setSelectedReceiptOrder(null);
        loadAllData(true);
      }
    } catch (err) {
      alert("To'lovni tasdiqlashda xatolik");
    }
  };

  const handleRejectPayment = async (orderId: number) => {
    if (!rejectReason.trim()) {
      alert("Iltimos, rad etish sababini kiriting!");
      return;
    }
    try {
      const res = await fetch('/api/admin/orders/reject-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId, reason: rejectReason }),
      });
      if (res.ok) {
        alert("To'lov rad etildi va foydalanuvchiga xabar yuborildi!");
        setSelectedReceiptOrder(null);
        setRejectReason('');
        loadAllData(true);
      }
    } catch (err) {
      alert("To'lovni rad etishda xatolik");
    }
  };

  // Filter products by category & search term
  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategoryFilter === 'all' || p.category_id === selectedCategoryFilter;
    const matchesSearch = p.name.toLowerCase().includes(productSearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] space-y-4">
        <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
        <p className="text-sm font-medium text-slate-400">TezLazzat POS Tizimi yuklanmoqda...</p>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-64px)] bg-[#0F1115] text-[#E2E8F0] overflow-hidden relative">
      {/* Sidebar Backdrop Overlay when open */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ========================================================= */}
      {/* 1. Slide-over Drawer Sidebar (Overlay Navigation) */}
      {/* ========================================================= */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#16191F] border-r border-[#2D333D] transition-transform duration-300 flex flex-col shadow-2xl ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header Toggle */}
        <div className="h-14 px-4 border-b border-[#2D333D] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MenuIcon className="w-5 h-5 text-amber-400" />
            <span className="font-black text-sm tracking-tight text-white">TEZLAZZAT POS</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1.5 hover:bg-[#252A31] text-slate-400 hover:text-white rounded-lg transition-all"
            title="Yopish"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sidebar Nav Items */}
        <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
          {(isOfitsiant
            ? [{ id: 'pos', label: 'Zal & Saboy Xizmati', icon: Grid, badge: null, color: 'text-amber-400' }]
            : [
                { id: 'pos', label: 'POS Kassa', icon: Grid, badge: null, color: 'text-amber-400' },
                { id: 'orders', label: 'Dastavka & Buyurtmalar', icon: Package, badge: orders.filter(o => o.status === 'pending').length, color: 'text-sky-400' },
                { id: 'menu', label: 'Menyu Boshqaruvi', icon: UtensilsCrossed, badge: null, color: 'text-emerald-400' },
                { id: 'couriers', label: 'Kuryer & Ofitsiantlar', icon: Bike, badge: couriers.filter(c => c.is_online).length + waiters.length, color: 'text-indigo-400' },
                { id: 'promos', label: 'Promokodlar', icon: Ticket, badge: null, color: 'text-purple-400' },
                { id: 'users', label: 'Mijozlar & Sadoqat', icon: Users, badge: null, color: 'text-rose-400' },
                { id: 'stats', label: 'Statistika', icon: LayoutDashboard, badge: null, color: 'text-yellow-400' },
              ]
          ).map((item) => {
            const IconComponent = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id as any);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-[#1C2128]'
                }`}
              >
                <div className="flex items-center space-x-2.5 truncate">
                  <IconComponent className={`w-4 h-4 shrink-0 ${isActive ? 'text-slate-950' : item.color}`} />
                  <span className="truncate">{item.label}</span>
                </div>

                {item.badge !== null && item.badge > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${isActive ? 'bg-slate-950 text-amber-400' : 'bg-indigo-500/20 text-indigo-300'}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {/* Settings in Sidebar (Admin only) */}
          {!isOfitsiant && (
            <button
              onClick={() => {
                setShowSettingsModal(true);
                setSidebarOpen(false);
              }}
              className="w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-slate-400 hover:text-white hover:bg-[#1C2128] mt-2 border-t border-[#2D333D]/50 pt-3"
            >
              <Settings className="w-4 h-4 text-slate-400 shrink-0" />
              <span>Sozlamalar</span>
            </button>
          )}
        </nav>

        {/* Sidebar Footer User Info & Logout */}
        {authUser && (
          <div className="p-3 border-t border-[#2D333D] shrink-0 bg-[#0F1115]/50">
            <div className="flex items-center justify-between">
              <div className="truncate pr-2">
                <p className="text-xs font-bold text-white truncate">{authUser.full_name}</p>
                <p className="text-[10px] text-amber-400 font-mono uppercase truncate">{authUser.role}</p>
              </div>
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="p-1.5 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-all"
                  title="Chiqish"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}
      </aside>

      {/* ========================================================= */}
      {/* 2. Asosiy Ishchi Oyna (Main Workspace Area) */}
      {/* ========================================================= */}
      <div className="flex-1 flex flex-col overflow-hidden w-full">
        {/* Top Header Controls Bar */}
        <header className="h-14 bg-[#16191F] border-b border-[#2D333D] px-3 sm:px-4 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            {/* 3-line Hamburger Menu Toggle */}
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="p-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/40 rounded-xl transition-all shadow cursor-pointer flex items-center justify-center shrink-0 active:scale-95"
              title="Menyu ☰"
            >
              <MenuIcon className="w-5 h-5 text-amber-400" />
            </button>

            <div>
              <h2 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                {isOfitsiant
                  ? '🤵 OFITSIANT PANELI - ZAL VA SABOY'
                  : activeTab === 'pos'
                  ? '🖥️ KASSA & STOLLAR PANELI'
                  : activeTab === 'orders'
                  ? '🚚 DASTAVKA VA TELEGRAM BUYURTMALARI'
                  : activeTab === 'menu'
                  ? '🍔 MENYU VA MAHSULOTLAR'
                  : activeTab === 'couriers'
                  ? '🛵 KURYERLAR VA OFITSIANTLAR'
                  : activeTab === 'promos'
                  ? '🎟️ PROMOKODLAR'
                  : activeTab === 'users'
                  ? '👥 MIJOZLAR VA LOYALTY SADOQAT TIZIMI'
                  : '📊 TIZIM STATISTIKASI'}
              </h2>
            </div>
          </div>

          {/* Top Right Controls: Theme Toggle -> Refresh -> Settings */}
          <div className="flex items-center space-x-2">
            {/* Dark/Light Theme Toggle */}
            <button
              onClick={() => {
                const nextTheme = colorTheme === 'dark' ? 'light' : 'dark';
                setColorTheme(nextTheme);
                localStorage.setItem('tezlazzat_theme', nextTheme);
              }}
              className="p-2 bg-[#1C2128] hover:bg-[#252A31] border border-[#2D333D] rounded-xl transition-all shadow-md flex items-center justify-center cursor-pointer"
              title={colorTheme === 'dark' ? "To'q rejim (Dark Mode)" : "Yorug' rejim (Light Mode)"}
            >
              {colorTheme === 'dark' ? (
                <Moon className="w-4 h-4 text-indigo-400" />
              ) : (
                <Sun className="w-4 h-4 text-amber-400" />
              )}
            </button>

            {/* Refresh Button */}
            <button
              onClick={() => loadAllData(true)}
              className="p-2 bg-[#1C2128] hover:bg-[#2D333D] border border-[#2D333D] text-slate-300 hover:text-white rounded-xl text-xs flex items-center gap-1.5 transition-all"
              title="Yangilash"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-amber-400' : ''}`} />
            </button>

            {/* Top Right Sozlamalar Icon Button (Admin only) */}
            {!isOfitsiant && (
              <button
                onClick={() => setShowSettingsModal(true)}
                className="p-2 bg-[#1C2128] hover:bg-[#252A31] text-slate-300 hover:text-white border border-[#2D333D] rounded-xl transition-all shadow-md"
                title="Sozlamalar"
              >
                <Settings className="w-5 h-5" />
              </button>
            )}
          </div>
        </header>

        {/* Main Workspace Content Area */}
        <div className="flex-1 overflow-hidden p-2 sm:p-3 bg-[#0F1115]">
          {/* ========================================================= */}
          {/* TAB 1: POS KASSA (ZAL, SABOY, DASTAVKA) */}
          {/* ========================================================= */}
          {activeTab === 'pos' && (
            <div className="h-full flex flex-col gap-2.5">
              {/* Top Sub-tabs (ZAL, SABOY, DASTAVKA) matching exact design drawing */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between bg-[#16191F] p-2 rounded-xl border border-[#2D333D] shrink-0 gap-2">
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <button
                    onClick={() => setPosMode('zal')}
                    className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                      posMode === 'zal'
                        ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/30 font-black'
                        : 'bg-[#1C2128] text-slate-400 hover:text-white border border-[#2D333D]'
                    }`}
                  >
                    🏛️ ZAL (Stollar)
                  </button>

                  <button
                    onClick={() => setPosMode('saboy')}
                    className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                      posMode === 'saboy'
                        ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/30 font-black'
                        : 'bg-[#1C2128] text-slate-400 hover:text-white border border-[#2D333D]'
                    }`}
                  >
                    🛍️ SABOY (Olib ketish)
                  </button>

                  {!isOfitsiant && (
                    <button
                      onClick={() => setPosMode('dastavka')}
                      className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                        posMode === 'dastavka'
                          ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/30 font-black'
                          : 'bg-[#1C2128] text-slate-400 hover:text-white border border-[#2D333D]'
                      }`}
                    >
                      🚚 DASTAVKA (Buyurtmalar)
                    </button>
                  )}
                </div>

                {/* Status indicator */}
                <div className="hidden md:flex items-center space-x-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Bo'sh: {tables.filter(t => t.status === 'empty' || (!t.status && t.items.length === 0)).length}
                  </span>
                  <span className="flex items-center gap-1 text-yellow-400 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                    Bron: {tables.filter(t => t.status === 'reserved').length}
                  </span>
                  <span className="flex items-center gap-1 text-rose-400 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                    Band: {tables.filter(t => t.status === 'occupied' || t.items.length > 0).length}
                  </span>
                </div>
              </div>

              {/* Mobile View Switcher (lg:hidden) */}
              <div className="flex lg:hidden items-center bg-[#16191F] p-1 rounded-xl border border-[#2D333D] shrink-0">
                <button
                  type="button"
                  onClick={() => setMobilePosTab('cart')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    mobilePosTab === 'cart'
                      ? 'bg-amber-500 text-slate-950 shadow font-black'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Grid className="w-3.5 h-3.5" />
                  <span>{posMode === 'saboy' ? '🛍️ Saboy Savati' : '🏛️ Stollar & Savat'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMobilePosTab('menu')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    mobilePosTab === 'menu'
                      ? 'bg-amber-500 text-slate-950 shadow font-black'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <UtensilsCrossed className="w-3.5 h-3.5" />
                  <span>🍔 Menyu (Taomlar)</span>
                </button>
              </div>

              {/* Main POS Split Grid (Left Cart/Tables + Right Catalog) */}
              <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 overflow-hidden">
                {/* ------------------------------------------------------------- */}
                {/* LEFT SECTION (POS Action Panel & Cart / Tables Panel) */}
                {/* ------------------------------------------------------------- */}
                <div className={`${mobilePosTab === 'cart' ? 'flex' : 'hidden lg:flex'} lg:col-span-5 bg-[#16191F] border border-[#2D333D] rounded-2xl flex-col overflow-hidden`}>
                  {/* MODE 1: ZAL STOLLAR GRID & ACTIVE CART */}
                  {posMode === 'zal' && (
                    <div className="flex-1 flex flex-col p-3 overflow-hidden">
                      {/* Location & Status Filter Bar */}
                      <div className="space-y-1.5 pb-2 mb-1 shrink-0">
                        {/* Location Pills */}
                        <div className="flex items-center space-x-1 overflow-x-auto scrollbar-none">
                          {['all', 'Zalda', 'Xonada', 'Tashqarida', 'Podvalda', '2-qavatda'].map((loc) => (
                            <button
                              key={loc}
                              onClick={() => setSelectedLocationFilter(loc)}
                              className={`px-2 py-1 rounded-lg text-[10px] sm:text-[11px] font-bold whitespace-nowrap transition-all ${
                                selectedLocationFilter === loc
                                  ? 'bg-amber-500 text-slate-950 shadow-sm font-black'
                                  : 'bg-[#0F1115] text-slate-400 hover:text-white border border-[#2D333D]'
                              }`}
                            >
                              {loc === 'all' ? '📍 BARCHA ZALLAR' : `📍 ${loc.toUpperCase()}`}
                            </button>
                          ))}
                        </div>

                        {/* Status Pills (BO'SH / BAND / BRON Filter) */}
                        <div className="flex items-center space-x-1 overflow-x-auto scrollbar-none">
                          <button
                            onClick={() => setTableStatusFilter('all')}
                            className={`px-2 py-1 rounded-lg text-[10px] sm:text-[11px] font-bold whitespace-nowrap transition-all ${
                              tableStatusFilter === 'all'
                                ? 'bg-amber-500 text-slate-950 shadow-sm font-black'
                                : 'bg-[#0F1115] text-slate-400 hover:text-white border border-[#2D333D]'
                            }`}
                          >
                            📋 BARCHASI ({tables.length})
                          </button>
                          <button
                            onClick={() => setTableStatusFilter('empty')}
                            className={`px-2 py-1 rounded-lg text-[10px] sm:text-[11px] font-bold whitespace-nowrap transition-all ${
                              tableStatusFilter === 'empty'
                                ? 'bg-emerald-500 text-slate-950 shadow-sm font-black'
                                : 'bg-[#0F1115] text-emerald-400 hover:text-emerald-300 border border-emerald-500/30'
                            }`}
                          >
                            🟢 BO'SH ({tables.filter(t => t.status !== 'occupied' && t.status !== 'reserved' && t.items.length === 0).length})
                          </button>
                          <button
                            onClick={() => setTableStatusFilter('occupied')}
                            className={`px-2 py-1 rounded-lg text-[10px] sm:text-[11px] font-bold whitespace-nowrap transition-all ${
                              tableStatusFilter === 'occupied'
                                ? 'bg-rose-500 text-white shadow-sm font-black'
                                : 'bg-[#0F1115] text-rose-400 hover:text-rose-300 border border-rose-500/30'
                            }`}
                          >
                            🔴 BAND ({tables.filter(t => t.status === 'occupied' || t.items.length > 0).length})
                          </button>
                          <button
                            onClick={() => setTableStatusFilter('reserved')}
                            className={`px-2 py-1 rounded-lg text-[10px] sm:text-[11px] font-bold whitespace-nowrap transition-all ${
                              tableStatusFilter === 'reserved'
                                ? 'bg-yellow-500 text-slate-950 shadow-sm font-black'
                                : 'bg-[#0F1115] text-yellow-400 hover:text-yellow-300 border border-yellow-500/30'
                            }`}
                          >
                            🟡 BRON ({tables.filter(t => t.status === 'reserved').length})
                          </button>
                        </div>
                      </div>

                      {/* Tables Selection Grid (Auto-rows, proper card spacing, no overlap) */}
                      <div className="flex-1 min-h-[220px] bg-[#0F1115] border border-[#2D333D] rounded-xl p-2.5 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5 content-start items-stretch auto-rows-max">
                        {tables
                          .filter((t) => {
                            const matchesLoc = selectedLocationFilter === 'all' || (t.location || 'Zalda') === selectedLocationFilter;
                            const matchesStatus =
                              tableStatusFilter === 'all' ||
                              (tableStatusFilter === 'occupied' && (t.status === 'occupied' || t.items.length > 0)) ||
                              (tableStatusFilter === 'reserved' && t.status === 'reserved') ||
                              (tableStatusFilter === 'empty' && t.status !== 'occupied' && t.status !== 'reserved' && t.items.length === 0);
                            return matchesLoc && matchesStatus;
                          })
                          .map((t) => {
                          const isSelected = t.id === selectedTableId;
                          const isOccupied = t.status === 'occupied' || t.items.length > 0;
                          const isReserved = t.status === 'reserved';

                          return (
                            <div
                              key={t.id}
                              onClick={() => setSelectedTableId(t.id)}
                              className={`relative p-2.5 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-md min-h-[150px] ${
                                isSelected
                                  ? 'border-amber-400 bg-amber-500/10 ring-2 ring-amber-400/40'
                                  : isOccupied
                                  ? 'border-rose-500/50 bg-rose-500/10 hover:border-rose-400'
                                  : isReserved
                                  ? 'border-yellow-500/50 bg-yellow-500/10 hover:border-yellow-400'
                                  : 'border-emerald-500/30 bg-[#1C2128] hover:border-emerald-500/60'
                              }`}
                            >
                              <div className="flex items-center justify-between pb-1.5 border-b border-[#2D333D]/60 shrink-0">
                                <span className="font-bold text-xs sm:text-sm text-white truncate">{t.name}</span>
                                <div className="flex items-center space-x-1 shrink-0">
                                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold uppercase shrink-0 ${
                                    isOccupied ? 'bg-rose-500 text-white' : isReserved ? 'bg-yellow-500 text-black' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                  }`}>
                                    {isOccupied ? 'BAND' : isReserved ? 'BRON' : 'BO\'SH'}
                                  </span>
                                </div>
                              </div>

                              <div className="my-1.5 space-y-1 flex-1">
                                <span className="text-[10px] text-indigo-400 font-semibold block">📍 {t.location || 'Zalda'}</span>
                                {t.waiter_name ? (
                                  <span className="text-[11px] font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/30 flex items-center gap-1 my-1 truncate">
                                    🤵 Ofitsiant: {t.waiter_name}
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-slate-500 bg-slate-800/40 px-1.5 py-0.5 rounded border border-slate-700/40 flex items-center gap-1 my-1 truncate">
                                    🤵 Biriktirilmagan
                                  </span>
                                )}
                                <p className="text-[10px] sm:text-xs text-slate-400 font-mono">
                                  {t.items.length > 0 ? `${t.items.reduce((s,i)=>s+i.quantity,0)} ta mahsulot` : `${t.seats} kishilik`}
                                </p>
                                <p className="text-xs sm:text-sm font-bold text-amber-400 font-mono">
                                  {t.total_amount > 0 ? `${t.total_amount.toLocaleString()} so'm` : "0 so'm"}
                                </p>
                                {(() => {
                                  // Find active saboy orders associated with this table
                                  const matchingSaboyOrders = saboyOrders.filter(
                                    so => so.client_name.toLowerCase().includes(t.name.toLowerCase()) || so.client_name.toLowerCase().includes(`stol ${t.id}`)
                                  );
                                  const saboySumFromOrders = matchingSaboyOrders.reduce((sum, s) => sum + s.total_amount, 0);
                                  const isCurrentDraftSaboy = saboyClientName.toLowerCase().includes(t.name.toLowerCase()) && saboyItems.length > 0;
                                  const draftSaboySum = isCurrentDraftSaboy ? saboyItems.reduce((sum, i) => sum + (i.price * i.quantity), 0) : 0;
                                  const totalSaboyPrice = saboySumFromOrders + draftSaboySum;

                                  if (totalSaboyPrice > 0) {
                                    return (
                                      <div className="bg-amber-500/10 border border-amber-500/30 rounded px-1.5 py-0.5 mt-1 flex items-center justify-between">
                                        <span className="text-[9px] font-bold text-amber-400">🛍️ Saboy:</span>
                                        <span className="text-[10px] font-mono font-extrabold text-amber-300">
                                          {totalSaboyPrice.toLocaleString()} so'm
                                        </span>
                                      </div>
                                    );
                                  }
                                  return null;
                                })()}
                              </div>

                              {/* CONTROL BUTTONS ROW: SABOY (🛍️) + BEKOR (❌) + CHEK (🖨️) */}
                              <div className="pt-1.5 mt-auto border-t border-[#2D333D]/60 flex items-center justify-between gap-1 shrink-0">
                                {/* Saboy Button */}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedTableId(t.id);
                                    setPosMode('saboy');
                                    setSaboyClientName(`${t.name} Saboy`);
                                  }}
                                  className="p-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-bold transition-all cursor-pointer active:scale-95 flex items-center justify-center shrink-0"
                                  title="Saboy 🛍️"
                                >
                                  <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
                                </button>

                                {/* Bekor Qilish / Clear Table Button (❌) */}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleClearTableAction(t.id, t.name);
                                  }}
                                  className="p-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 rounded-lg text-xs font-bold transition-all cursor-pointer active:scale-95 flex items-center justify-center shrink-0"
                                  title="Stolni tozalash / Bekor qilish ❌"
                                >
                                  <X className="w-3.5 h-3.5 text-rose-400" />
                                </button>

                                {/* Chek / Printer Button (🖨️) */}
                                {isOccupied && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenCheckoutModal('table', t.id);
                                    }}
                                    className="p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shadow hover:scale-105 transition-all flex items-center justify-center shrink-0"
                                    title="Chek chiqarish va to'lov olish 🖨️"
                                  >
                                    <Printer className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Selected Table Order Breakdown List */}
                      <div className="flex-1 min-h-[200px] mt-2.5 bg-[#0F1115] border border-[#2D333D] rounded-xl p-3 flex flex-col overflow-hidden">
                        <div className="pb-2 border-b border-[#2D333D] space-y-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                                <span>📌 {currentSelectedTable.name} Savatchasi</span>
                                <span className="text-xs font-normal text-slate-400">({currentSelectedTable.seats} kishilik)</span>
                              </h3>
                            </div>
                            <span className="text-xs font-bold text-emerald-400 font-mono">
                              Jami: {currentSelectedTable.total_amount.toLocaleString()} so'm
                            </span>
                          </div>

                          {/* OFITSIANT SELECTOR & DISPLAY ROW */}
                          <div className="bg-[#16191F] p-2 rounded-xl border border-[#2D333D] flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                                🤵 Ofitsiant:
                              </span>
                              <select
                                value={currentSelectedTable.waiter_name || ''}
                                onChange={async (e) => {
                                  const val = e.target.value;
                                  const updatedName = val ? val : undefined;
                                  setTables(prev => prev.map(tbl => tbl.id === selectedTableId ? { ...tbl, waiter_name: updatedName } : tbl));
                                  try {
                                    await fetch(`/api/tables/${selectedTableId}`, {
                                      method: 'PUT',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ waiter_name: val || null }),
                                    });
                                  } catch (err) {
                                    console.error('Waiter assignment failed:', err);
                                  }
                                }}
                                className="bg-[#0F1115] text-xs font-bold text-white border border-amber-500/40 rounded-lg px-2.5 py-1 focus:outline-none focus:border-amber-400 cursor-pointer"
                              >
                                <option value="">-- Biriktirilmagan --</option>
                                {waiters.map((w) => (
                                  <option key={w.id} value={w.full_name}>
                                    {w.full_name}
                                  </option>
                                ))}
                                {authUser?.name && !waiters.some(w => w.full_name === authUser.name) && (
                                  <option value={authUser.name}>{authUser.name} (Siz)</option>
                                )}
                              </select>
                            </div>

                            {authUser?.name && currentSelectedTable.waiter_name !== authUser.name && (
                              <button
                                type="button"
                                onClick={async () => {
                                  const updatedName = authUser.name;
                                  setTables(prev => prev.map(tbl => tbl.id === selectedTableId ? { ...tbl, waiter_name: updatedName } : tbl));
                                  try {
                                    await fetch(`/api/tables/${selectedTableId}`, {
                                      method: 'PUT',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ waiter_name: updatedName }),
                                    });
                                  } catch (err) {
                                    console.error('Self assignment failed:', err);
                                  }
                                }}
                                className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                              >
                                <span>🙋‍♂️ Menga biriktirish</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Items List */}
                        <div className="flex-1 my-2 overflow-y-auto space-y-2 pr-1">
                          {currentSelectedTable.items.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs">
                              <ShoppingBag className="w-8 h-8 opacity-40 mb-2 text-amber-400" />
                              <p>Ushbu stol hali bo'sh.</p>
                              <p className="text-[10px] text-slate-600 mt-1">O'ng tarafdagi menyudan mahsulot tanlang</p>
                            </div>
                          ) : (
                            currentSelectedTable.items.map((item) => (
                              <div
                                key={item.id || item.product_id}
                                className="p-2.5 bg-[#16191F] border border-[#2D333D] rounded-xl flex items-center justify-between text-xs"
                              >
                                <div className="flex-1 pr-2">
                                  <p className="font-semibold text-slate-200">{item.product_name}</p>
                                  <p className="text-[10px] text-slate-400 font-mono">
                                    {item.price.toLocaleString()} x {item.quantity} = {(item.price * item.quantity).toLocaleString()} so'm
                                  </p>
                                </div>

                                <div className="flex items-center space-x-1.5 bg-[#0F1115] p-1 rounded-lg border border-[#2D333D]">
                                  <button
                                    onClick={() => handleRemoveProductFromPOS(item.product_id)}
                                    className="p-1 hover:bg-rose-500/20 text-rose-400 rounded transition-all"
                                  >
                                    <Minus className="w-3.5 h-3.5" />
                                  </button>
                                  <span className="px-2 font-bold font-mono text-white text-xs">{item.quantity}</span>
                                  <button
                                    onClick={() => handleAddProductToPOS({ id: item.product_id, name: item.product_name, price: item.price } as any)}
                                    className="p-1 hover:bg-emerald-500/20 text-emerald-400 rounded transition-all"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>

                        {/* Mobile Quick Add Dish Button */}
                        <button
                          type="button"
                          onClick={() => setMobilePosTab('menu')}
                          className="lg:hidden w-full my-2 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shrink-0"
                        >
                          <Plus className="w-4 h-4 text-amber-400" />
                          <span>Menyudan Taom Qo'shish 🍔</span>
                        </button>

                        {/* Bottom Action Controls (BRON, STOLNI KO'CHIRISH, TAYYORLASH) */}
                        <div className="pt-2 border-t border-[#2D333D] grid grid-cols-3 gap-2">
                          {/* BRON (Yellow) */}
                          <button
                            onClick={handleReserveTable}
                            className={`py-2 px-1 text-center font-bold text-xs rounded-xl transition-all ${
                              currentSelectedTable.status === 'reserved'
                                ? 'bg-yellow-500 text-slate-950 shadow-md'
                                : 'bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 border border-yellow-500/30'
                            }`}
                          >
                            BRON 🟡
                          </button>

                          {/* STOLNI KO'CHIRISH (Blue) */}
                          <button
                            onClick={() => setShowTransferModal(true)}
                            className="py-2 px-1 bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-500/30 font-bold text-[11px] rounded-xl transition-all flex items-center justify-center gap-1"
                            title="Stolni boshqa stolga ko'chirish"
                          >
                            <ArrowLeftRight className="w-3 h-3" />
                            <span>KO'CHIRISH</span>
                          </button>

                          {/* TAYYORLASH (Green) */}
                          <button
                            onClick={handleSendToKitchen}
                            className="py-2 px-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] rounded-xl shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-1"
                          >
                            <span>TAYYORLASH 🟢</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* MODE 2: SABOY CART & SAVED ORDERS */}
                  {posMode === 'saboy' && (
                    <div className="flex-1 flex flex-col p-3 overflow-y-auto space-y-3">
                      <div className="pb-2 border-b border-[#2D333D]">
                        <h3 className="font-bold text-sm text-amber-400 flex items-center gap-2">
                          <span>🛍️ Saboy (Olib ketish) Buyurtmasi</span>
                        </h3>
                        <div className="mt-2 space-y-1 relative">
                          <label className="text-[11px] font-bold text-amber-300 flex items-center justify-between">
                            <span>Mijoz Ismi yoki Biriktirilgan Stol</span>
                            <span className="text-rose-400 font-bold">* (MAJBURIY)</span>
                          </label>

                          <div className="relative flex items-center">
                            <input
                              type="text"
                              value={saboyClientName}
                              onChange={(e) => setSaboyClientName(e.target.value)}
                              placeholder="Stol tanlang (∨) yoki nom kiriting..."
                              className={`w-full bg-[#0F1115] border rounded-xl pr-10 pl-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none transition-all ${
                                !saboyClientName.trim()
                                  ? 'border-rose-500/70 focus:border-rose-400 bg-rose-500/5'
                                  : 'border-amber-500/50 focus:border-amber-400'
                              }`}
                              required
                            />

                            <button
                              type="button"
                              onClick={() => setShowSaboyTableDropdown(!showSaboyTableDropdown)}
                              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white transition-all flex items-center justify-center"
                              title="Stollar ro'yxatini chiqarish"
                            >
                              <ChevronDown className="w-4 h-4 text-slate-400" />
                            </button>

                            {/* Saboy Table Selection Dropdown Menu */}
                            {showSaboyTableDropdown && (
                              <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-[#1C2128] border border-[#2D333D] rounded-xl shadow-2xl p-2 max-h-56 overflow-y-auto space-y-1">
                                <p className="text-[10px] font-bold text-slate-400 px-2 py-1 border-b border-[#2D333D]">
                                  📌 Saboy buyurtmasini qaysi stolga biriktirasiz?
                                </p>
                                {tables.map((tbl) => (
                                  <button
                                    key={tbl.id}
                                    type="button"
                                    onClick={() => {
                                      setSelectedTableId(tbl.id);
                                      setSaboyClientName(`${tbl.name} Saboy`);
                                      setShowSaboyTableDropdown(false);
                                    }}
                                    className="w-full text-left px-3 py-2 hover:bg-[#252A31] rounded-lg text-xs font-semibold text-white flex items-center justify-between transition-all"
                                  >
                                    <span>{tbl.name} ({tbl.location || 'Zalda'})</span>
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${tbl.items.length > 0 ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-700 text-slate-400'}`}>
                                      {tbl.items.length > 0 ? `${tbl.items.length} ta taom` : "Bo'sh"}
                                    </span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Saboy Current Items Cart */}
                      <div className="max-h-52 overflow-y-auto space-y-2 pr-1">
                        {saboyItems.length === 0 ? (
                          <div className="py-4 text-center text-slate-500 text-xs">
                            <ShoppingBag className="w-8 h-8 opacity-30 mx-auto mb-1 text-amber-400" />
                            <p>Saboy savatchasi bo'sh.</p>
                            <p className="text-[10px] text-slate-600 mt-0.5">O'ng tarafdagi menyudan mahsulot tanlang</p>
                          </div>
                        ) : (
                          saboyItems.map((item) => (
                            <div
                              key={item.id || item.product_id}
                              className="p-2 bg-[#0F1115] border border-[#2D333D] rounded-xl flex items-center justify-between text-xs"
                            >
                              <div className="flex-1 pr-2">
                                <p className="font-semibold text-slate-200">{item.product_name}</p>
                                <p className="text-[10px] text-slate-400 font-mono">
                                  {item.price.toLocaleString()} x {item.quantity} = {(item.price * item.quantity).toLocaleString()} so'm
                                </p>
                              </div>

                              <div className="flex items-center space-x-1.5 bg-[#16191F] p-1 rounded-lg border border-[#2D333D]">
                                <button
                                  onClick={() => handleRemoveProductFromPOS(item.product_id)}
                                  className="p-1 hover:bg-rose-500/20 text-rose-400 rounded transition-all"
                                >
                                  <Minus className="w-3.5 h-3.5" />
                                </button>
                                <span className="px-2 font-bold font-mono text-white text-xs">{item.quantity}</span>
                                <button
                                  onClick={() => handleAddProductToPOS({ id: item.product_id, name: item.product_name, price: item.price } as any)}
                                  className="p-1 hover:bg-emerald-500/20 text-emerald-400 rounded transition-all"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Mobile Quick Add Dish Button */}
                      <button
                        type="button"
                        onClick={() => setMobilePosTab('menu')}
                        className="lg:hidden w-full my-2 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shrink-0"
                      >
                        <Plus className="w-4 h-4 text-amber-400" />
                        <span>Menyudan Taom Qo'shish 🍔</span>
                      </button>

                      {/* Saboy Form Actions */}
                      <div className="pt-2 border-t border-[#2D333D] space-y-2">
                        <div className="flex justify-between items-center text-xs font-bold">
                          <span className="text-slate-300">Savatcha Summasi:</span>
                          <span className="text-amber-400 font-mono text-sm">
                            {saboyItems.reduce((s, i) => s + i.price * i.quantity, 0).toLocaleString()} so'm
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={handleClearPOS}
                            className="py-2.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 font-bold text-xs rounded-xl transition-all active:scale-95"
                          >
                            BEKOR 🔴
                          </button>

                          <button
                            onClick={handleSendToKitchen}
                            className="py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition-all active:scale-95 flex items-center justify-center gap-1"
                          >
                            <span>TAYYORLASH 🟢</span>
                          </button>
                        </div>
                      </div>

                      {/* ACTIVE SABOY ORDERS CARDS LIST */}
                      <div className="pt-3 border-t border-[#2D333D] space-y-2">
                        <h4 className="font-bold text-xs text-amber-400 flex items-center justify-between">
                          <span>📦 FAOL SABOY BUYURTMALARI ({saboyOrders.length} ta)</span>
                          <span className="text-[10px] text-slate-500">Mijoz olib ketguncha saqlanadi</span>
                        </h4>

                        {saboyOrders.length === 0 ? (
                          <p className="text-[11px] text-slate-500 text-center py-2">
                            Saqlangan faol Saboy buyurtmalari yo'q.
                          </p>
                        ) : (
                          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                            {saboyOrders.map((sOrd) => (
                              <div key={sOrd.id} className="p-3 bg-[#0F1115] border border-amber-500/30 rounded-xl space-y-2 text-xs">
                                <div className="flex items-center justify-between border-b border-[#2D333D] pb-1.5">
                                  <span className="font-bold text-amber-300">#SABOY-{sOrd.id} • {sOrd.client_name}</span>
                                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-mono font-bold">
                                    {sOrd.status.toUpperCase()}
                                  </span>
                                </div>

                                <div className="space-y-0.5 text-[11px] text-slate-300">
                                  {sOrd.items?.map((it, idx) => (
                                    <p key={idx}>
                                      • {it.product_name} x {it.quantity} = {(it.price * it.quantity).toLocaleString()} so'm
                                    </p>
                                  ))}
                                </div>

                                <div className="flex justify-between items-center pt-1.5 border-t border-[#2D333D]">
                                  <span className="font-bold text-emerald-400 font-mono">
                                    {sOrd.total_amount.toLocaleString()} so'm
                                  </span>
                                  <div className="flex items-center space-x-1.5">
                                    <button
                                      onClick={() => {
                                        setSaboyClientName(sOrd.client_name);
                                        setSaboyItems(sOrd.items || []);
                                      }}
                                      className="px-2 py-1 bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 rounded text-[10px] font-bold"
                                      title="Tahrirlash / Qo'shimcha qo'shish"
                                    >
                                      ✏️ Tahrirlash
                                    </button>
                                    <button
                                      onClick={() => {
                                        setPrintedReceiptData({
                                          order_id: sOrd.id,
                                          table_name: `SABOY (${sOrd.client_name})`,
                                          items: sOrd.items,
                                          total_amount: sOrd.total_amount,
                                          receipt_type: 'oddiy',
                                          payment_method: 'cash',
                                          date: new Date().toLocaleString('ru-RU'),
                                        });
                                      }}
                                      className="px-2 py-1 bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 rounded text-[10px] font-bold"
                                      title="Chek chiqarish"
                                    >
                                      🖨️ Chek
                                    </button>
                                    <button
                                      onClick={() => handleCompleteSaboyOrder(sOrd.id)}
                                      className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold shadow"
                                      title="Topshirildi va yakunlandi"
                                    >
                                      🟢 Topshirildi
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* MODE 3: DASTAVKA POS (Incoming Phone + Telegram Bot Orders) */}
                  {posMode === 'dastavka' && (
                    <div className="flex-1 flex flex-col p-3 overflow-y-auto space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-[#2D333D]">
                        <h3 className="font-bold text-sm text-sky-400 flex items-center gap-1.5">
                          <PhoneCall className="w-4 h-4" />
                          <span>Dastavka Operatori</span>
                        </h3>
                        <button
                          onClick={() => setShowPhoneOrderModal(true)}
                          className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-md"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Yangi Telefon Buyurtmasi</span>
                        </button>
                      </div>

                      {/* Quick Active Orders Queue */}
                      <div className="space-y-2">
                        {orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled').length === 0 ? (
                          <div className="p-8 text-center text-slate-500 text-xs">
                            Hozirda faol yetkazish buyurtmalari yo'q.
                          </div>
                        ) : (
                          orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled').slice(0, 15).map((o) => (
                            <div
                              key={o.id}
                              className={`p-3 border rounded-xl text-xs space-y-2 transition-all ${
                                selectedDeliveryOrderId === o.id
                                  ? 'bg-[#1C2128] border-sky-500 shadow-md ring-1 ring-sky-500'
                                  : 'bg-[#0F1115] border-[#2D333D]'
                              }`}
                            >
                              <div className="flex items-center justify-between border-b border-[#2D333D] pb-1.5">
                                <span className="font-bold text-sky-400">#ORD-{o.id} • {o.user_name}</span>
                                <span className="text-[10px] px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-mono font-bold uppercase">
                                  {o.status}
                                </span>
                              </div>

                              <p className="text-[11px] text-slate-300">📞 {o.user_phone} | 📍 {o.address}</p>

                              {/* Items list */}
                              <div className="space-y-0.5 text-[11px] text-slate-400">
                                {o.items?.map((it, idx) => (
                                  <p key={idx}>
                                    • {it.product_name} x {it.quantity} = {(it.price * it.quantity).toLocaleString()} so'm
                                  </p>
                                ))}
                              </div>

                              {/* Courier Assignment & Control Bar */}
                              <div className="grid grid-cols-1 gap-1.5 pt-1 border-t border-[#2D333D]">
                                <div>
                                  <label className="block text-[10px] text-slate-400 mb-0.5 font-bold">Kuryer biriktirish:</label>
                                  <select
                                    value={o.courier_id || ''}
                                    onChange={(e) => handleAssignCourier(o.id, e.target.value)}
                                    className="w-full bg-[#16191F] border border-[#2D333D] rounded-lg p-1.5 text-xs text-white"
                                  >
                                    <option value="">Kuryer tanlanmagan</option>
                                    {couriers.map((c) => (
                                      <option key={c.id} value={c.id}>
                                        🛵 {c.full_name} ({c.is_online ? 'Aktiv' : 'Offline'})
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                <div className="flex justify-between items-center pt-1">
                                  <span className="font-bold text-emerald-400 font-mono text-xs">
                                    Jami: {o.total_amount.toLocaleString()} so'm
                                  </span>

                                  <div className="flex items-center space-x-1.5">
                                    <button
                                      onClick={() => handleSendDeliveryToKitchen(o)}
                                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-bold shadow transition-all active:scale-95 flex items-center gap-1"
                                      title="Oshxonaga chek chiqarish va tayyorlash"
                                    >
                                      🍳 Tayyorlash 🟢
                                    </button>

                                    <button
                                      onClick={() => handleCancelOrder(o.id)}
                                      className="px-2 py-1 bg-rose-600/20 text-rose-300 hover:bg-rose-600/30 border border-rose-500/30 rounded text-[11px] font-bold"
                                      title="Buyurtmani bekor qilish"
                                    >
                                      ❌ Bekor qilish
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* ------------------------------------------------------------- */}
                {/* RIGHT SECTION (POS Product Catalog Grid with + / - Buttons) */}
                {/* ------------------------------------------------------------- */}
                <div className={`${mobilePosTab === 'menu' ? 'flex' : 'hidden lg:flex'} lg:col-span-7 bg-[#16191F] border border-[#2D333D] rounded-2xl p-3 flex-col overflow-hidden relative`}>
                  {/* Category Filter Pills & Search */}
                  <div className="space-y-2 pb-2 border-b border-[#2D333D] shrink-0">
                    <div className="flex items-center justify-between gap-2">
                      {/* Search Bar */}
                      <div className="relative flex-1">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          value={productSearch}
                          onChange={(e) => setProductSearch(e.target.value)}
                          placeholder="Mahsulot qidirish..."
                          className="w-full bg-[#0F1115] border border-[#2D333D] rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>

                    {/* Category Filter Pills */}
                    <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
                      <button
                        onClick={() => setSelectedCategoryFilter('all')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                          selectedCategoryFilter === 'all'
                            ? 'bg-amber-500 text-slate-950 font-bold'
                            : 'bg-[#0F1115] text-slate-400 hover:text-white border border-[#2D333D]'
                        }`}
                      >
                        BARCHASI
                      </button>
                      {categories.map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => setSelectedCategoryFilter(cat.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                            selectedCategoryFilter === cat.id
                              ? 'bg-amber-500 text-slate-950 font-bold'
                              : 'bg-[#0F1115] text-slate-400 hover:text-white border border-[#2D333D]'
                          }`}
                        >
                          {cat.emoji} {cat.name.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Product Cards Grid (Fully structured, visible +/- buttons, bottom space for mobile banner) */}
                  <div className="flex-1 mt-2.5 overflow-y-auto grid content-start items-start grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-2.5 pr-1 pb-28 sm:pb-32">
                    {filteredProducts.map((prod) => {
                      const qtyInCart = getItemQtyInCart(prod.id);
                      return (
                        <div
                          key={prod.id}
                          className="bg-[#0F1115] border border-[#2D333D] rounded-xl overflow-hidden flex flex-col justify-between hover:border-amber-500/50 transition-all group shadow-sm h-full min-h-[170px]"
                        >
                          {/* Image Box */}
                          <div
                            onClick={() => handleAddProductToPOS(prod)}
                            className="h-20 sm:h-22 bg-black/40 relative overflow-hidden flex items-center justify-center shrink-0 cursor-pointer"
                          >
                            {prod.photo_url ? (
                              <img
                                src={prod.photo_url}
                                alt={prod.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300"
                              />
                            ) : (
                              <UtensilsCrossed className="w-6 h-6 text-slate-600" />
                            )}
                            {qtyInCart > 0 && (
                              <span className="absolute top-1 right-1 px-1.5 py-0.5 bg-amber-500 text-slate-950 text-[10px] font-black rounded-md shadow-md">
                                {qtyInCart} ta
                              </span>
                            )}
                          </div>

                          {/* Info & Quantity controls */}
                          <div className="p-2 flex-1 flex flex-col justify-between space-y-1.5">
                            <div onClick={() => handleAddProductToPOS(prod)} className="cursor-pointer">
                              <h4 className="font-bold text-[11px] sm:text-xs text-white line-clamp-1 leading-tight">{prod.name}</h4>
                              <p className="text-[11px] font-bold text-amber-400 font-mono mt-0.5">
                                {prod.price.toLocaleString()} so'm
                              </p>
                            </div>

                            {/* - and + Buttons (Always visible on every card) */}
                            <div className="pt-1.5 border-t border-[#2D333D] flex items-center justify-between gap-1.5 shrink-0 mt-auto">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveProductFromPOS(prod.id);
                                }}
                                className="flex-1 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 rounded-lg text-xs font-bold flex items-center justify-center transition-all cursor-pointer active:scale-95"
                                title="Kamaytirish"
                              >
                                <Minus className="w-3.5 h-3.5 text-rose-400" />
                              </button>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAddProductToPOS(prod);
                                }}
                                className="flex-1 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-bold flex items-center justify-center transition-all cursor-pointer active:scale-95"
                                title="Qo'shish"
                              >
                                <Plus className="w-3.5 h-3.5 text-emerald-400" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Floating Mobile Cart Summary Banner */}
                  {mobilePosTab === 'menu' && (
                    <div className="lg:hidden fixed bottom-3 left-3 right-3 z-40 bg-amber-500 text-slate-950 p-2.5 rounded-2xl shadow-2xl flex items-center justify-between font-bold border border-amber-300">
                      <div className="flex items-center space-x-2 pl-1">
                        <ShoppingBag className="w-5 h-5 text-slate-950 shrink-0" />
                        <div>
                          <p className="text-xs leading-tight font-black">
                            {posMode === 'saboy' ? '🛍️ Saboy Buyurtmasi' : `📌 ${currentSelectedTable.name}`}
                          </p>
                          <p className="text-[11px] opacity-90 font-mono">
                            {posMode === 'saboy'
                              ? `${saboyItems.reduce((s,i)=>s+i.quantity,0)} ta taom • ${saboyItems.reduce((s,i)=>s+(i.price*i.quantity),0).toLocaleString()} so'm`
                              : `${currentSelectedTable.items.reduce((s,i)=>s+i.quantity,0)} ta taom • ${currentSelectedTable.total_amount.toLocaleString()} so'm`}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setMobilePosTab('cart')}
                        className="px-3 py-1.5 bg-slate-950 text-amber-400 rounded-xl text-xs font-black shadow flex items-center gap-1 shrink-0 hover:bg-slate-900 transition-all"
                      >
                        <span>Savatni Ko'rish</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: DASTAVKA VA BUYURTMALAR (Full Orders View) */}
          {/* ========================================================= */}
          {activeTab === 'orders' && (
            <div className="h-full flex flex-col space-y-3 overflow-hidden">
              <div className="flex items-center justify-between bg-[#16191F] p-3 rounded-xl border border-[#2D333D] shrink-0">
                <div className="flex items-center space-x-2">
                  {['all', 'pending', 'preparing', 'on_way', 'completed', 'disputed'].map((st) => (
                    <button
                      key={st}
                      onClick={() => setOrderFilter(st)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
                        orderFilter === st
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'bg-[#0F1115] text-slate-400 hover:text-white border border-[#2D333D]'
                      }`}
                    >
                      {st === 'all' ? 'Barchasi' : st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Orders List */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {orders
                  .filter((o) => orderFilter === 'all' || o.status === orderFilter)
                  .map((o) => (
                    <div key={o.id} className="p-4 bg-[#16191F] border border-[#2D333D] rounded-xl text-xs space-y-3">
                      <div className="flex items-center justify-between border-b border-[#2D333D] pb-2">
                        <div>
                          <span className="font-bold text-indigo-400 text-sm">#ORD-{o.id}</span>
                          <span className="ml-2 text-slate-400">{o.created_at}</span>
                        </div>
                        <span className="px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 font-bold uppercase">
                          {o.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <p className="font-semibold text-slate-300">Mijoz Information:</p>
                          <p className="text-white">{o.user_name}</p>
                          <p className="text-slate-400 font-mono">{o.user_phone}</p>
                          <p className="text-slate-400">{o.address}</p>
                        </div>

                        <div>
                          <p className="font-semibold text-slate-300">Mahsulotlar:</p>
                          {o.items.map((it, idx) => (
                            <p key={idx} className="text-slate-300">
                              • {it.product_name} x {it.quantity} = {(it.price * it.quantity).toLocaleString()} so'm
                            </p>
                          ))}
                        </div>

                        <div className="space-y-2">
                          <p className="font-bold text-emerald-400 font-mono text-sm">
                            Jami: {o.total_amount.toLocaleString()} so'm
                          </p>
                          {/* Courier selector */}
                          <div>
                            <label className="block text-[11px] text-slate-400 mb-1">Kuryer biriktirish:</label>
                            <select
                              value={o.courier_id || ''}
                              onChange={(e) => handleAssignCourier(o.id, e.target.value)}
                              className="w-full bg-[#0F1115] border border-[#2D333D] rounded-lg p-2 text-xs text-white"
                            >
                              <option value="">Kuryer tanlanmagan</option>
                              {couriers.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.full_name} ({c.is_online ? 'Aktiv' : 'Offline'})
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 3: MENYU BOSHQARUVI (Kategoriyalar + Taomlar) */}
          {/* ========================================================= */}
          {activeTab === 'menu' && (
            <div className="h-full flex flex-col space-y-3 overflow-y-auto pr-1">
              {/* Top Header & Actions */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-[#16191F] p-3 rounded-xl border border-[#2D333D] gap-2 shrink-0">
                <div>
                  <h3 className="font-bold text-sm text-white flex items-center gap-2">
                    <span>🍔 Menyu Kategoriyalari va Mahsulotlar Boshqaruvi</span>
                  </h3>
                  <p className="text-[11px] text-slate-400">Kategoriyalarni tahrirlash hamda taomlarni boshqarish paneli</p>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setEditingCategory(null);
                      setNewCatName('');
                      setNewCatIcon('🍔');
                      setShowAddCategoryModal(true);
                    }}
                    className="px-3.5 py-2 bg-[#1C2128] hover:bg-[#252A31] border border-amber-500/40 text-amber-300 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow"
                  >
                    <Plus className="w-4 h-4 text-amber-400" />
                    <span>Kategoriya Qo'shish</span>
                  </button>

                  <button
                    onClick={() => {
                      setEditingProduct(null);
                      setNewProdCatId(categories[0]?.id || 1);
                      setNewProdName('');
                      setNewProdDesc('');
                      setNewProdPrice(25000);
                      setNewProdPhoto('');
                      setShowAddProductModal(true);
                    }}
                    className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all"
                  >
                    <Plus className="w-4 h-4 text-slate-950" />
                    <span>Mahsulot Qo'shish</span>
                  </button>
                </div>
              </div>

              {/* SECTION 1: KATEGORIYALAR BOSHQARUVI */}
              <div className="bg-[#16191F] border border-[#2D333D] rounded-2xl p-4 space-y-3 shrink-0">
                <div className="flex items-center justify-between border-b border-[#2D333D] pb-2">
                  <h4 className="font-bold text-xs text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <span>📂 Menyu Kategoriyalari ({categories.length} ta)</span>
                  </h4>
                  <span className="text-[10px] text-slate-500">Mijozlar menyusida birinchi bo'lib ko'rinadi</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
                  {categories.map((cat) => {
                    const prodCount = products.filter((p) => p.category_id === cat.id).length;
                    return (
                      <div
                        key={cat.id}
                        className="p-3 bg-[#0F1115] border border-[#2D333D] hover:border-amber-500/40 rounded-xl flex items-center justify-between text-xs transition-all group"
                      >
                        <div className="truncate pr-1">
                          <p className="font-bold text-white flex items-center gap-1.5 truncate">
                            <span className="text-base">{cat.icon || '📁'}</span>
                            <span className="truncate">{cat.name}</span>
                          </p>
                          <p className="text-[10px] text-slate-500 mt-0.5">{prodCount} ta taom</p>
                        </div>

                        <div className="flex items-center space-x-1 opacity-90 group-hover:opacity-100 shrink-0">
                          <button
                            onClick={() => {
                              setEditingCategory(cat);
                              setNewCatName(cat.name);
                              setNewCatIcon(cat.icon || '📁');
                              setShowAddCategoryModal(true);
                            }}
                            className="p-1 hover:bg-amber-500/20 text-amber-400 rounded transition-all"
                            title="Kategoriyani tahrirlash"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={async () => {
                              try {
                                await fetch('/api/admin/categories/delete', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ id: cat.id }),
                                });
                                loadAllData(true);
                              } catch (err) {
                                console.error("Kategoriyani o'chirishda xatolik:", err);
                              }
                            }}
                            className="p-1 hover:bg-rose-500/20 text-rose-400 rounded transition-all"
                            title="Kategoriyani o'chirish"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SECTION 2: MAHSULOTLAR BOSHQARUVI */}
              <div className="bg-[#16191F] border border-[#2D333D] rounded-2xl p-4 space-y-3 flex-1 flex flex-col">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-[#2D333D] pb-3 shrink-0">
                  <h4 className="font-bold text-xs text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <span>🍔 Taomlar va Mahsulotlar ({filteredProducts.length} ta)</span>
                  </h4>

                  {/* Filter pills & Search input */}
                  <div className="flex items-center space-x-2 w-full sm:w-auto">
                    <input
                      type="text"
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      placeholder="Taom qidirish..."
                      className="bg-[#0F1115] border border-[#2D333D] rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 w-full sm:w-48"
                    />
                    <select
                      value={selectedCategoryFilter}
                      onChange={(e) => setSelectedCategoryFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                      className="bg-[#0F1115] border border-[#2D333D] rounded-xl px-2.5 py-1.5 text-xs text-amber-300 font-bold focus:outline-none"
                    >
                      <option value="all">Barcha Kategoriyalar</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.icon} {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Products Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 overflow-y-auto">
                  {filteredProducts.map((p) => {
                    const catObj = categories.find((c) => c.id === p.category_id);
                    return (
                      <div
                        key={p.id}
                        className="p-3 bg-[#0F1115] border border-[#2D333D] hover:border-slate-600 rounded-xl text-xs flex flex-col justify-between space-y-2 transition-all"
                      >
                        <div className="flex space-x-2.5">
                          {p.photo_url ? (
                            <img src={p.photo_url} alt={p.name} className="w-14 h-14 rounded-lg object-cover border border-[#2D333D] shrink-0" />
                          ) : (
                            <div className="w-14 h-14 rounded-lg bg-[#16191F] border border-[#2D333D] flex items-center justify-center text-xl shrink-0">
                              {catObj?.icon || '🍔'}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 font-semibold border border-amber-500/20">
                              {catObj?.name || 'Kategoriya'}
                            </span>
                            <p className="font-bold text-white truncate mt-1">{p.name}</p>
                            <p className="text-amber-400 font-mono font-black text-sm mt-0.5">
                              {p.price.toLocaleString()} so'm
                            </p>
                          </div>
                        </div>

                        {p.description && (
                          <p className="text-[10px] text-slate-400 line-clamp-2 italic">{p.description}</p>
                        )}

                        <div className="flex items-center justify-end space-x-1.5 pt-2 border-t border-[#2D333D]/60">
                          <button
                            onClick={() => {
                              setEditingProduct(p);
                              setNewProdCatId(p.category_id);
                              setNewProdName(p.name);
                              setNewProdDesc(p.description || '');
                              setNewProdPrice(p.price);
                              setNewProdPhoto(p.photo_url || '');
                              setShowAddProductModal(true);
                            }}
                            className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all"
                          >
                            <Edit className="w-3 h-3" />
                            <span>Tahrirlash</span>
                          </button>

                          <button
                            onClick={async () => {
                              try {
                                await fetch('/api/admin/products/delete', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ id: p.id }),
                                });
                                loadAllData(true);
                              } catch (err) {
                                console.error("Mahsulotni o'chirishda xatolik:", err);
                              }
                            }}
                            className="p-1 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-all"
                            title="Mahsulotni o'chirish"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 4: KURYERLAR VA OFITSIANTLAR BOSHQARUVI */}
          {/* ========================================================= */}
          {activeTab === 'couriers' && (
            <div className="h-full flex flex-col space-y-3 overflow-hidden">
              <div className="flex items-center justify-between bg-[#16191F] p-3 rounded-xl border border-[#2D333D]">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setStaffSubTab('couriers')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      staffSubTab === 'couriers'
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'bg-[#0F1115] text-slate-400 hover:text-white border border-[#2D333D]'
                    }`}
                  >
                    <Bike className="w-4 h-4" />
                    <span>🛵 KURYERLAR ({couriers.length})</span>
                  </button>

                  <button
                    onClick={() => setStaffSubTab('waiters')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      staffSubTab === 'waiters'
                        ? 'bg-amber-500 text-slate-950 shadow-md'
                        : 'bg-[#0F1115] text-slate-400 hover:text-white border border-[#2D333D]'
                    }`}
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>🤵 OFITSIANTLAR ({waiters.length})</span>
                  </button>
                </div>

                {staffSubTab === 'couriers' ? (
                  <button
                    onClick={() => {
                      setEditingCourier(null);
                      setNewCourierName('');
                      setNewCourierPhone('+998');
                      setNewCourierUsername(generate10CharLogin());
                      setNewCourierPassword(String(Math.floor(10000000 + Math.random() * 90000000)));
                      setShowAddCourierModal(true);
                    }}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-md"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Yangi Kuryer Qo'shish</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setEditingWaiter(null);
                      setNewWaiterName('');
                      setNewWaiterPhone('+998');
                      setNewWaiterUsername(generate10CharLogin());
                      setNewWaiterPassword(String(Math.floor(10000000 + Math.random() * 90000000)));
                      setShowAddWaiterModal(true);
                    }}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold flex items-center gap-1 shadow-md"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Yangi Ofitsiant Qo'shish</span>
                  </button>
                )}
              </div>

              {/* COURIERS SUB-TAB */}
              {staffSubTab === 'couriers' && (
                <div className="flex-1 bg-[#16191F] border border-[#2D333D] rounded-xl overflow-y-auto p-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                  {couriers.length === 0 ? (
                    <div className="col-span-2 p-8 text-center text-slate-500 text-xs">
                      Hozircha tizimda kuryerlar ro'yxati mavjud emas. Yuqoridagi "Yangi Kuryer Qo'shish" tugmasini bosing.
                    </div>
                  ) : (
                    couriers.map((c) => (
                      <div key={c.id} className="p-4 bg-[#0F1115] border border-[#2D333D] rounded-xl text-xs space-y-2 relative">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white text-sm">{c.full_name}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${c.is_online ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>
                            {c.is_online ? 'Online' : 'Offline'}
                          </span>
                        </div>
                        <p className="text-slate-400 font-mono">📞 {c.phone} | ID: {c.id}</p>
                        <div className="p-2 bg-[#16191F] rounded-lg border border-[#2D333D] flex justify-between items-center text-[11px]">
                          <div>
                            <span className="text-slate-400">Login (10): </span>
                            <b className="text-indigo-300 font-mono">{c.username}</b>
                            <span className="text-slate-400 ml-3">Parol: </span>
                            <b className="text-emerald-300 font-mono">{c.password}</b>
                          </div>
                        </div>

                        <div className="pt-2 flex justify-between items-center text-[11px] border-t border-[#2D333D]">
                          <span className="text-slate-400">Bajarilgan buyurtmalar: <b className="text-amber-400">{c.completed_orders || 0} ta</b></span>
                          <div className="flex items-center space-x-1.5">
                            <button
                              onClick={() => {
                                setEditingCourier(c);
                                setNewCourierName(c.full_name);
                                setNewCourierPhone(c.phone);
                                setNewCourierUsername(c.username || '');
                                setNewCourierPassword(c.password || '');
                                setShowAddCourierModal(true);
                              }}
                              className="px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded text-[10px] font-bold flex items-center gap-1 transition-all"
                              title="Tahrirlash"
                            >
                              <Edit className="w-3 h-3" />
                              <span>Tahrirlash</span>
                            </button>
                            <button
                              onClick={() => handleDeleteCourier(c.id)}
                              className="p-1 text-rose-400 hover:bg-rose-500/10 rounded transition-all"
                              title="O'chirish"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* WAITERS SUB-TAB */}
              {staffSubTab === 'waiters' && (
                <div className="flex-1 bg-[#16191F] border border-[#2D333D] rounded-xl overflow-y-auto p-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                  {waiters.length === 0 ? (
                    <div className="col-span-2 p-8 text-center text-slate-500 text-xs">
                      Hozircha tizimda ofitsiantlar ro'yxati mavjud emas. Yuqoridagi "Yangi Ofitsiant Qo'shish" tugmasini bosing.
                    </div>
                  ) : (
                    waiters.map((w) => (
                      <div key={w.id} className="p-4 bg-[#0F1115] border border-[#2D333D] rounded-xl text-xs space-y-2 relative">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-amber-400 text-sm flex items-center gap-1.5">
                            <UserCheck className="w-4 h-4 text-amber-400" />
                            <span>{w.full_name}</span>
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${w.is_online ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>
                            {w.is_online ? 'Online (Aktiv)' : 'Offline'}
                          </span>
                        </div>
                        <p className="text-slate-400 font-mono">📞 {w.phone} | ID: {w.id}</p>
                        <div className="p-2 bg-[#16191F] rounded-lg border border-[#2D333D] flex justify-between items-center text-[11px]">
                          <div>
                            <span className="text-slate-400">Login (10): </span>
                            <b className="text-amber-300 font-mono">{w.username}</b>
                            <span className="text-slate-400 ml-3">Parol: </span>
                            <b className="text-emerald-300 font-mono">{w.password}</b>
                          </div>
                        </div>
                        <div className="pt-2 flex justify-between items-center text-[11px] border-t border-[#2D333D]">
                          <span className="text-slate-400">Xizmat ko'rsatilgan stollar: <b className="text-white">{w.active_tables_count || 0} ta</b></span>
                          <div className="flex items-center space-x-1.5">
                            <button
                              onClick={() => {
                                setEditingWaiter(w);
                                setNewWaiterName(w.full_name);
                                setNewWaiterPhone(w.phone);
                                setNewWaiterUsername(w.username || '');
                                setNewWaiterPassword(w.password || '');
                                setShowAddWaiterModal(true);
                              }}
                              className="px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded text-[10px] font-bold flex items-center gap-1 transition-all"
                              title="Tahrirlash"
                            >
                              <Edit className="w-3 h-3" />
                              <span>Tahrirlash</span>
                            </button>
                            <button
                              onClick={() => handleDeleteWaiter(w.id)}
                              className="p-1 text-rose-400 hover:bg-rose-500/10 rounded transition-all"
                              title="O'chirish"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 5: PROMOKODLAR */}
          {/* ========================================================= */}
          {activeTab === 'promos' && (
            <div className="h-full flex flex-col space-y-3 overflow-hidden">
              <div className="flex items-center justify-between bg-[#16191F] p-3 rounded-xl border border-[#2D333D]">
                <div className="flex items-center space-x-2">
                  <Ticket className="w-5 h-5 text-purple-400" />
                  <h3 className="font-bold text-sm text-white">Promokodlar Boshqaruvi ({promos.length} ta)</h3>
                </div>
                <button
                  onClick={() => {
                    setEditingPromo(null);
                    setNewPromoCode('');
                    setNewPromoVal(10);
                    setNewPromoType('percent');
                    setNewPromoUses(100);
                    setNewPromoExpiresAt('2026-12-31');
                    setShowAddPromoModal(true);
                  }}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-md"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Yangi Promokod Yaratish</span>
                </button>
              </div>

              <div className="flex-1 bg-[#16191F] border border-[#2D333D] rounded-xl overflow-y-auto p-3 grid grid-cols-1 md:grid-cols-3 gap-3">
                {promos.length === 0 ? (
                  <div className="col-span-3 p-8 text-center text-slate-500 text-xs">
                    Hozircha tizimda promokodlar mavjud emas. Yaratish uchun tugmani bosing.
                  </div>
                ) : (
                  promos.map((p) => {
                    const isExpired = p.expires_at ? new Date(p.expires_at) < new Date() : false;
                    const isMaxedOut = p.used_count >= (p.max_uses || 100);
                    const isInactive = isExpired || isMaxedOut || !p.is_active;

                    return (
                      <div
                        key={p.id}
                        className={`p-3.5 bg-[#0F1115] border rounded-xl text-xs space-y-2 relative transition-all ${
                          isInactive ? 'border-rose-500/30 opacity-70' : 'border-[#2D333D] hover:border-amber-500/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`font-mono font-bold text-sm tracking-wider ${isInactive ? 'line-through text-slate-500' : 'text-amber-400'}`}>
                            🎟️ {p.code}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            isInactive ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'
                          }`}>
                            {isExpired ? 'Muddati o\'tgan' : isMaxedOut ? 'Tugagan' : p.is_active ? 'Aktiv' : 'Nofaol'}
                          </span>
                        </div>

                        <div className="space-y-1 text-slate-300 text-[11px]">
                          <p> Chegirma: <b className="text-emerald-400">{p.discount_value}{p.discount_type === 'percent' ? '%' : ' so\'m'}</b></p>
                          <p> Ishlatildi: <b className="text-sky-400">{p.used_count || 0} / {p.max_uses || 'Cheksiz'}</b></p>
                          <p> Amal qilish muddati: <b className="text-slate-400 font-mono">{p.expires_at || 'Cheklanmagan'}</b></p>
                        </div>

                        <div className="pt-2 flex justify-end items-center space-x-1 border-t border-[#2D333D]">
                          <button
                            onClick={() => {
                              setEditingPromo(p);
                              setNewPromoCode(p.code);
                              setNewPromoType(p.discount_type || 'percent');
                              setNewPromoVal(p.discount_value || 10);
                              setNewPromoUses(p.max_uses || 100);
                              setNewPromoExpiresAt(p.expires_at || '2026-12-31');
                              setShowAddPromoModal(true);
                            }}
                            className="px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded text-[10px] font-bold flex items-center gap-1"
                            title="Tahrirlash"
                          >
                            <Edit className="w-3 h-3" />
                            <span>Tahrirlash</span>
                          </button>
                          <button
                            onClick={() => handleDeletePromo(p.id)}
                            className="p-1 text-rose-400 hover:bg-rose-500/10 rounded transition-all"
                            title="O'chirish"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 6: MIJOZLAR & SADOQAT TIZIMI */}
          {/* ========================================================= */}
          {activeTab === 'users' && (
            <div className="h-full flex flex-col space-y-3 overflow-hidden">
              <div className="bg-[#16191F] p-3 rounded-xl border border-[#2D333D] flex items-center justify-between">
                <h3 className="font-bold text-sm text-white">Mijozlar Ro'yxati va Sadoqat (Loyalty Card)</h3>
                <input
                  type="text"
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                  placeholder="Mijoz ismi yoki telefoni..."
                  className="bg-[#0F1115] border border-[#2D333D] rounded-xl px-3 py-1.5 text-xs text-white"
                />
              </div>

              <div className="flex-1 bg-[#16191F] border border-[#2D333D] rounded-xl overflow-y-auto p-3 grid grid-cols-1 md:grid-cols-3 gap-3">
                {users.map((u) => (
                  <div key={u.id} className="p-3 bg-[#0F1115] border border-[#2D333D] rounded-xl text-xs space-y-1.5">
                    <p className="font-bold text-white">{u.full_name}</p>
                    <p className="text-slate-400 font-mono">📞 {u.phone}</p>
                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-[#2D333D]">
                      <span className="text-amber-400 font-bold">Stamplar: {u.loyalty_stamps || 0}/6</span>
                      <span className="text-emerald-400 font-bold">Yutug'lar: {u.loyalty_completed_count || 0} ta</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 7: STATISTIKA (Line Graph & Bar Chart Weekly/Monthly/All-time) */}
          {/* ========================================================= */}
          {activeTab === 'stats' && (
            <div className="h-full overflow-y-auto space-y-4 pr-1">
              <div className="flex items-center justify-between bg-[#16191F] p-3 rounded-2xl border border-[#2D333D]">
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <LayoutDashboard className="w-4 h-4 text-amber-400" />
                  <span>Tizim va Savdo Statistikasi</span>
                </h3>
                <button
                  onClick={handleExportExcel}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Excel (CSV) Statistika Yuklab Olish</span>
                </button>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="p-4 bg-[#16191F] border border-[#2D333D] rounded-2xl">
                  <p className="text-xs text-slate-400 font-semibold">Bugungi Tushum</p>
                  <p className="text-xl font-black text-emerald-400 font-mono mt-1">
                    {(stats?.today_revenue || 0).toLocaleString()} so'm
                  </p>
                </div>
                <div className="p-4 bg-[#16191F] border border-[#2D333D] rounded-2xl">
                  <p className="text-xs text-slate-400 font-semibold">Bugungi Buyurtmalar</p>
                  <p className="text-xl font-black text-sky-400 font-mono mt-1">
                    {stats?.today_orders || 0} ta
                  </p>
                </div>
                <div className="p-4 bg-[#16191F] border border-[#2D333D] rounded-2xl">
                  <p className="text-xs text-slate-400 font-semibold">Umumiy Savdo Tushumi</p>
                  <p className="text-xl font-black text-amber-400 font-mono mt-1">
                    {(stats?.total_revenue || 0).toLocaleString()} so'm
                  </p>
                </div>
                <div className="p-4 bg-[#16191F] border border-[#2D333D] rounded-2xl">
                  <p className="text-xs text-slate-400 font-semibold">Jami Buyurtmalar</p>
                  <p className="text-xl font-black text-purple-400 font-mono mt-1">
                    {stats?.total_orders || 0} ta
                  </p>
                </div>
              </div>

              {/* 1. NEW: Line Graph for Revenue Trend */}
              <div className="bg-[#16191F] border border-[#2D333D] rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-[#2D333D] pb-3">
                  <h4 className="font-bold text-sm text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-sky-400" />
                    <span>Tushum va Buyurtmalar Chiziqli Dinamikasi (Line Graph)</span>
                  </h4>
                  <span className="text-[11px] text-sky-400 font-semibold bg-sky-500/10 px-2.5 py-1 rounded-lg border border-sky-500/20">
                    📈 Chiziqli Grafik
                  </span>
                </div>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={[
                      { time: '09:00', tushum: 420000, buyurtma: 5 },
                      { time: '11:00', tushum: 890000, buyurtma: 12 },
                      { time: '13:00', tushum: 2450000, buyurtma: 28 },
                      { time: '15:00', tushum: 1800000, buyurtma: 19 },
                      { time: '17:00', tushum: 1350000, buyurtma: 14 },
                      { time: '19:00', tushum: 3100000, buyurtma: 34 },
                      { time: '21:00', tushum: 2700000, buyurtma: 29 },
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2D333D" />
                      <XAxis dataKey="time" stroke="#94a3b8" />
                      <YAxis yAxisId="left" stroke="#38bdf8" />
                      <YAxis yAxisId="right" orientation="right" stroke="#f59e0b" />
                      <Tooltip contentStyle={{ backgroundColor: '#0F1115', borderColor: '#2D333D', borderRadius: '12px', color: '#fff' }} />
                      <Line yAxisId="left" type="monotone" dataKey="tushum" name="Tushum (so'm)" stroke="#38bdf8" strokeWidth={3} dot={{ r: 5 }} />
                      <Line yAxisId="right" type="monotone" dataKey="buyurtma" name="Buyurtmalar ta" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Visual Interactive Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* 2. Revenue Bar Chart with Timeframe Switchers (Haftalik, Oylik, Butun davr) */}
                <div className="bg-[#16191F] border border-[#2D333D] rounded-2xl p-4 flex flex-col justify-between">
                  <div className="flex items-center justify-between gap-2 mb-4 border-b border-[#2D333D] pb-3">
                    <h4 className="font-bold text-sm text-white flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-emerald-400" />
                      <span>Savdo Statistika Ustunli Grafiki</span>
                    </h4>

                    {/* Timeframe Toggle Buttons */}
                    <div className="flex items-center space-x-1 bg-[#0F1115] p-1 rounded-xl border border-[#2D333D]">
                      <button
                        onClick={() => setStatsTimeframe('weekly')}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                          statsTimeframe === 'weekly'
                            ? 'bg-amber-500 text-slate-950 shadow'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Haftalik
                      </button>
                      <button
                        onClick={() => setStatsTimeframe('monthly')}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                          statsTimeframe === 'monthly'
                            ? 'bg-amber-500 text-slate-950 shadow'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Oylik
                      </button>
                      <button
                        onClick={() => setStatsTimeframe('all')}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                          statsTimeframe === 'all'
                            ? 'bg-amber-500 text-slate-950 shadow'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Butun Davr
                      </button>
                    </div>
                  </div>

                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={
                        statsTimeframe === 'weekly' ? [
                          { label: 'Dush', amount: 1200000 },
                          { label: 'Sesh', amount: 1550000 },
                          { label: 'Chorsh', amount: 1400000 },
                          { label: 'Paysh', amount: 1900000 },
                          { label: 'Juma', amount: 2400000 },
                          { label: 'Shanb', amount: 2800000 },
                          { label: 'Yaksh', amount: stats?.today_revenue || 2100000 },
                        ] : statsTimeframe === 'monthly' ? [
                          { label: '1-hafta', amount: 9500000 },
                          { label: '2-hafta', amount: 12400000 },
                          { label: '3-hafta', amount: 14100000 },
                          { label: '4-hafta', amount: 16800000 },
                        ] : [
                          { label: 'Yanvar', amount: 42000000 },
                          { label: 'Fevral', amount: 48500000 },
                          { label: 'Mart', amount: 53000000 },
                          { label: 'Aprel', amount: 61000000 },
                          { label: 'May', amount: 67000000 },
                          { label: 'Iyun', amount: 72000000 },
                        ]
                      }>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2D333D" />
                        <XAxis dataKey="label" stroke="#94a3b8" />
                        <YAxis stroke="#94a3b8" />
                        <Tooltip contentStyle={{ backgroundColor: '#0F1115', borderColor: '#2D333D', borderRadius: '12px', color: '#fff' }} />
                        <Bar dataKey="amount" fill="#10b981" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 3. Top Popular Dishes Pie Chart */}
                <div className="bg-[#16191F] border border-[#2D333D] rounded-2xl p-4 flex flex-col justify-between">
                  <h4 className="font-bold text-sm text-white flex items-center gap-2 mb-4 border-b border-[#2D333D] pb-3">
                    <PieChartIcon className="w-4 h-4 text-amber-400" />
                    <span>Eng Ko'p Sotilgan Taomlar Ulushi</span>
                  </h4>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Cheeseburger', value: 45 },
                            { name: 'Mol Lavash', value: 30 },
                            { name: 'Pepperoni Pitsa', value: 15 },
                            { name: 'Fri Kartoshkasi', value: 10 },
                          ]}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          dataKey="value"
                          label={true}
                        >
                          {CHART_COLORS.map((color, idx) => (
                            <Cell key={idx} fill={color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#0F1115', borderColor: '#2D333D', borderRadius: '12px', color: '#fff' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* MODAL 1: SOZLAMALAR (Triggered from Top Right Icon & Sidebar) */}
      {/* ========================================================= */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-[#1C2128] border border-[#2D333D] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 bg-[#16191F] border-b border-[#2D333D] flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Settings className="w-5 h-5 text-indigo-400" />
                <span className="font-bold text-base text-white">Sozlamalar Paneli</span>
              </div>
              <button onClick={() => setShowSettingsModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sub-tab switcher inside Settings Modal */}
            <div className="flex border-b border-[#2D333D] bg-[#0F1115] p-2 space-x-2">
              <button
                onClick={() => setSettingsTab('system')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  settingsTab === 'system'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-[#1C2128] text-slate-400 hover:text-white border border-[#2D333D]'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>⚙️ TIZIM SOZLAMALARI</span>
              </button>

              <button
                onClick={() => setSettingsTab('tables')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  settingsTab === 'tables'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'bg-[#1C2128] text-slate-400 hover:text-white border border-[#2D333D]'
                }`}
              >
                <UtensilsCrossed className="w-4 h-4" />
                <span>🍽️ STOLLAR BOSHQARUVI</span>
              </button>
            </div>

            {/* TAB 1: SYSTEM SETTINGS */}
            {settingsTab === 'system' && (
              <form onSubmit={handleSaveSettings} className="p-4 overflow-y-auto space-y-4 text-xs">
                {/* Admin Login & Password Section */}
                <div className="p-3.5 bg-[#0F1115] rounded-xl border border-[#2D333D] space-y-3">
                  <h4 className="font-bold text-emerald-400 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4" />
                    <span>Admin Login va Paroli</span>
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Admin Username</label>
                      <input
                        type="text"
                        value={settingsForm.admin_username}
                        onChange={(e) => setSettingsForm({ ...settingsForm, admin_username: e.target.value })}
                        className="w-full bg-[#1C2128] border border-[#2D333D] rounded-lg p-2 text-emerald-300 font-mono font-bold"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Admin Paroli</label>
                      <input
                        type="text"
                        value={settingsForm.admin_password}
                        onChange={(e) => setSettingsForm({ ...settingsForm, admin_password: e.target.value })}
                        className="w-full bg-[#1C2128] border border-[#2D333D] rounded-lg p-2 text-white font-mono font-bold"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Delivery Fees & Telegram Group */}
                <div className="p-3.5 bg-[#0F1115] rounded-xl border border-[#2D333D] space-y-3">
                  <h4 className="font-bold text-indigo-400 flex items-center gap-1.5">
                    <Settings className="w-4 h-4" />
                    <span>Telegram Guruh va Etkazib Berish Narxi</span>
                  </h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Telegram Guruh ID</label>
                      <input
                        type="text"
                        value={settingsForm.payment_group_id}
                        onChange={(e) => setSettingsForm({ ...settingsForm, payment_group_id: e.target.value })}
                        className="w-full bg-[#1C2128] border border-[#2D333D] rounded-lg p-2 text-sky-400 font-mono font-bold"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Yetkazib berish (so'm)</label>
                      <input
                        type="number"
                        value={settingsForm.delivery_fee}
                        onChange={(e) => setSettingsForm({ ...settingsForm, delivery_fee: Number(e.target.value) })}
                        className="w-full bg-[#1C2128] border border-[#2D333D] rounded-lg p-2 text-white font-mono"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Bepul yetkazish (so'm)</label>
                      <input
                        type="number"
                        value={settingsForm.free_delivery_from}
                        onChange={(e) => setSettingsForm({ ...settingsForm, free_delivery_from: Number(e.target.value) })}
                        className="w-full bg-[#1C2128] border border-[#2D333D] rounded-lg p-2 text-white font-mono"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex justify-end space-x-2 border-t border-[#2D333D]">
                  <button
                    type="button"
                    onClick={() => setShowSettingsModal(false)}
                    className="px-4 py-2 bg-[#2D333D] text-slate-300 rounded-xl font-semibold"
                  >
                    Yopish
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-lg"
                  >
                    Tizim Sozlamalarini Saqlash
                  </button>
                </div>
              </form>
            )}

            {/* TAB 2: TABLE MANAGEMENT (Add/Edit Tables with location, capacity, etc.) */}
            {settingsTab === 'tables' && (
              <div className="p-4 overflow-y-auto space-y-4 text-xs max-h-[70vh]">
                {/* Form for Adding / Editing Table */}
                <form onSubmit={handleAddTable} className="p-3.5 bg-[#0F1115] rounded-xl border border-[#2D333D] space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-amber-400 flex items-center gap-1.5">
                      <Plus className="w-4 h-4" />
                      <span>{editingTable ? `Stol #${editingTable.id} - Tahrirlash` : "Yangi Stol Qo'shish"}</span>
                    </h4>
                    {editingTable && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingTable(null);
                          setNewTableName('');
                          setNewTableSeats(4);
                          setNewTableLocation('Zalda');
                        }}
                        className="text-[11px] text-slate-400 hover:text-white underline"
                      >
                        Bekor qilish
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Stol Nomi / Raqami</label>
                      <input
                        type="text"
                        placeholder="Masalan: Stol #13"
                        value={newTableName}
                        onChange={(e) => setNewTableName(e.target.value)}
                        className="w-full bg-[#1C2128] border border-[#2D333D] rounded-lg p-2 text-white font-bold"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Sig'imi (kishilik)</label>
                      <input
                        type="number"
                        min={1}
                        max={30}
                        value={newTableSeats}
                        onChange={(e) => setNewTableSeats(Number(e.target.value))}
                        className="w-full bg-[#1C2128] border border-[#2D333D] rounded-lg p-2 text-white font-mono"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Joylashuvi (Zal / Xona)</label>
                      <input
                        type="text"
                        placeholder="Zalda, Xonada, Tashqarida..."
                        value={newTableLocation}
                        onChange={(e) => setNewTableLocation(e.target.value)}
                        className="w-full bg-[#1C2128] border border-[#2D333D] rounded-lg p-2 text-indigo-300 font-bold"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl shadow-md flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{editingTable ? "O'zgarishlarni Saqlash" : "Stolni Qo'shish"}</span>
                    </button>
                  </div>
                </form>

                {/* Existing Tables List */}
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-300">Mavjud Stollar Ro'yxati ({tables.length} ta)</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {tables.map((tbl) => (
                      <div key={tbl.id} className="p-3 bg-[#0F1115] border border-[#2D333D] rounded-xl flex items-center justify-between">
                        <div>
                          <p className="font-bold text-white text-sm">{tbl.name}</p>
                          <p className="text-[11px] text-slate-400">
                            📍 <b className="text-indigo-400">{tbl.location || 'Zalda'}</b> | 👥 {tbl.seats} kishilik
                          </p>
                        </div>
                        <div className="flex items-center space-x-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingTable(tbl);
                              setNewTableName(tbl.name);
                              setNewTableSeats(tbl.seats);
                              setNewTableLocation(tbl.location || 'Zalda');
                            }}
                            className="p-1.5 text-amber-400 hover:bg-amber-500/10 rounded-lg transition-all"
                            title="Stolni tahrirlash"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteTable(tbl.id)}
                            className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                            title="Stolni o'chirish"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: STOLNI KO'CHIRISH (Table Transfer Modal) */}
      {/* ========================================================= */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#1C2128] border border-[#2D333D] rounded-2xl p-5 space-y-4">
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <ArrowLeftRight className="w-5 h-5 text-sky-400" />
              <span>Stol Buyurtmalarini Ko'chirish</span>
            </h3>

            <p className="text-xs text-slate-300">
              <b>{currentSelectedTable.name}</b> dagi barcha buyurtmalarni qaysi stolga o'tkazmoqchisiz?
            </p>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-400">Maqsadli Stolni Tanlang:</label>
              <select
                value={transferTargetTableId || ''}
                onChange={(e) => setTransferTargetTableId(Number(e.target.value))}
                className="w-full bg-[#0F1115] border border-[#2D333D] rounded-xl p-2.5 text-xs text-white font-bold"
              >
                <option value="">Stolni tanlang...</option>
                {tables
                  .filter((t) => t.id !== selectedTableId)
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.status === 'empty' ? 'Bo\'sh' : 'Band'})
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setShowTransferModal(false)}
                className="px-4 py-2 bg-[#2D333D] text-slate-300 text-xs rounded-xl font-semibold"
              >
                Bekor qilish
              </button>
              <button
                onClick={handleExecuteTransfer}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl shadow-lg"
              >
                Ko'chirishni Tasdiqlash
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: CHEK VA TO'LOV MODAL (Keshbekli / Oddiy Chek) */}
      {/* ========================================================= */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#1C2128] border border-[#2D333D] rounded-2xl p-5 space-y-4">
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <Printer className="w-5 h-5 text-indigo-400" />
              <span>Chek va To'lov Paneli</span>
            </h3>

            {/* Receipt Type Selection (Keshbekli vs Oddiy) */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300">Chek turini tanlang:</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setCheckoutReceiptType('keshbek')}
                  className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                    checkoutReceiptType === 'keshbek'
                      ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300 shadow-lg'
                      : 'border-[#2D333D] bg-[#0F1115] text-slate-400'
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>KESHBEKLI CHEK 🎁</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCheckoutReceiptType('oddiy')}
                  className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                    checkoutReceiptType === 'oddiy'
                      ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300 shadow-lg'
                      : 'border-[#2D333D] bg-[#0F1115] text-slate-400'
                  }`}
                >
                  <Receipt className="w-4 h-4 text-indigo-400" />
                  <span>ODDIY CHEK 📄</span>
                </button>
              </div>
            </div>

            {/* If Keshbek, enter Customer Phone */}
            {checkoutReceiptType === 'keshbek' && (
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-300">Mijoz Telefon Raqami (Sadoqat Stamp uchun):</label>
                <input
                  type="text"
                  value={checkoutUserPhone}
                  onChange={(e) => setCheckoutUserPhone(e.target.value)}
                  placeholder="+998901234567"
                  className="w-full bg-[#0F1115] border border-[#2D333D] rounded-xl p-2.5 text-xs text-emerald-300 font-mono font-bold"
                />
              </div>
            )}

            {/* Payment Method */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300">To'lov usuli:</label>
              <div className="grid grid-cols-3 gap-2">
                {['cash', 'click', 'payme'].map((pm) => (
                  <button
                    key={pm}
                    type="button"
                    onClick={() => setCheckoutPaymentMethod(pm as any)}
                    className={`py-2 text-xs font-bold rounded-xl border uppercase transition-all ${
                      checkoutPaymentMethod === pm
                        ? 'bg-indigo-600 text-white border-indigo-500 shadow-md'
                        : 'bg-[#0F1115] text-slate-400 border-[#2D333D]'
                    }`}
                  >
                    {pm === 'cash' ? '💵 Naqd' : pm === 'click' ? '🔹 Click' : '🟢 Payme'}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setShowCheckoutModal(false)}
                className="px-4 py-2 bg-[#2D333D] text-slate-300 text-xs rounded-xl font-semibold"
              >
                Bekor qilish
              </button>
              <button
                onClick={handleExecuteCheckout}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Chek Chiqarish 🖨️</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 4: CHOP ETILUVCHI CHEK PREVIEW (Exact CHek.txt paper receipt layout) */}
      {/* ========================================================= */}
      {printedReceiptData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-sm bg-white text-slate-900 rounded-2xl p-5 shadow-2xl font-mono text-xs space-y-2.5 leading-tight border border-slate-300 my-auto">
            <div className="text-center font-mono">
              <p className="font-extrabold text-xs tracking-tighter text-slate-800">==================================================</p>
              <p className="font-black text-sm uppercase text-slate-900">"{settings.restaurant_name || 'PizzaMario'}" KAFESI</p>
              <p className="font-bold text-[11px] uppercase text-slate-800">MChJ "MAZALI FOODS"</p>
              <p className="text-[10px] text-slate-700">STIR (INN): 308492015</p>
              <p className="text-[10px] text-slate-700">Manzil: Toshkent sh., Chilonzor t., 10-mavze</p>
              <p className="font-extrabold text-xs tracking-tighter text-slate-800">==================================================</p>
            </div>

            <div className="flex justify-between text-[11px] font-bold text-slate-800">
              <span>Kassir: {authUser?.name || 'Admin'}</span>
              <span>{printedReceiptData.date}</span>
            </div>
            <p className="font-extrabold text-xs tracking-tighter text-slate-800 text-center">==================================================</p>

            {/* Main Table / Order Header */}
            <div className="bg-slate-100 p-1.5 rounded text-center border border-slate-300 font-extrabold text-xs">
              📌 1. ZAL | {printedReceiptData.table_name || 'Kassa'}
            </div>

            <p className="text-[10px] font-mono tracking-tighter text-slate-600">--------------------------------------------------</p>
            <div className="grid grid-cols-12 font-bold text-[10px] text-slate-700 pb-1 border-b border-slate-300">
              <span className="col-span-5">Taomlar</span>
              <span className="col-span-2 text-center">Soni</span>
              <span className="col-span-2 text-right">Narxi</span>
              <span className="col-span-3 text-right">Summa</span>
            </div>

            <div className="space-y-1 text-[11px] text-slate-900">
              {printedReceiptData.items?.map((it: any, idx: number) => (
                <div key={idx} className="grid grid-cols-12 items-center">
                  <span className="col-span-5 truncate">{idx + 1}. {it.product_name || it.name}</span>
                  <span className="col-span-2 text-center">{it.quantity}</span>
                  <span className="col-span-2 text-right text-[10px]">{it.price?.toLocaleString()}</span>
                  <span className="col-span-3 text-right font-bold">{(it.price * it.quantity)?.toLocaleString()}</span>
                </div>
              ))}
              {printedReceiptData.table_service_fee ? (
                <div className="flex justify-between font-bold pt-1 text-[11px] text-slate-800">
                  <span>Xizmat haqi (10%)</span>
                  <span>{printedReceiptData.table_service_fee.toLocaleString()} UZS</span>
                </div>
              ) : null}
            </div>

            <p className="text-[10px] font-mono tracking-tighter text-slate-600">--------------------------------------------------</p>
            <div className="flex justify-between font-extrabold text-xs text-slate-900">
              <span>{printedReceiptData.table_name || 'Stol'} jami:</span>
              <span>{printedReceiptData.total_amount?.toLocaleString()} UZS</span>
            </div>

            <p className="font-extrabold text-xs tracking-tighter text-slate-800 text-center">==================================================</p>
            <div className="space-y-1">
              <div className="flex justify-between font-black text-sm text-slate-900">
                <span>JAMI TO'LANDI:</span>
                <span className="text-indigo-900">{printedReceiptData.total_amount?.toLocaleString()} UZS</span>
              </div>
              <div className="flex justify-between text-[11px] font-bold text-slate-800">
                <span>To'lov turi:</span>
                <span className="uppercase text-indigo-800">
                  {printedReceiptData.payment_method === 'cash' ? 'Naqd' : 'Karta (Humo/Uzcard)'}
                </span>
              </div>
            </div>

            <p className="font-extrabold text-xs tracking-tighter text-slate-800 text-center">==================================================</p>
            
            {/* KESHBEK QR-KOD BLOCK */}
            <div className="text-center space-y-1 pt-1">
              <p className="font-extrabold text-[10px] uppercase tracking-wide text-emerald-800">
                🎁 KESHBEK OLISH UCHUN SKANERLANG:
              </p>
              <div className="flex justify-center py-1">
                <div className="w-24 h-24 border-2 border-slate-900 p-1 rounded-lg bg-white flex flex-col items-center justify-center">
                  <div className="w-full h-full bg-slate-900 flex items-center justify-center text-white text-[8px] font-bold text-center p-1 rounded">
                    QR-KOD SOLIQ
                    <br />
                    KESHBEK
                  </div>
                </div>
              </div>
              <p className="text-[9px] text-slate-700 font-medium leading-tight">
                Ushbu chekni "Soliq" ilovasi orqali skanerlang
                <br />
                va keshbekingizni qo'lga kiriting!
              </p>
            </div>

            <p className="font-extrabold text-xs tracking-tighter text-slate-800 text-center">==================================================</p>
            <div className="flex justify-between text-[9px] font-bold text-slate-600">
              <span>Fiskal chek №: 00928374</span>
              <span>FMF: 8492015829</span>
            </div>

            <p className="font-extrabold text-xs tracking-tighter text-slate-800 text-center">==================================================</p>
            <div className="text-center font-bold text-xs text-slate-800">
              Xaridingiz uchun rahmat! Yoqimli ishtaha!
            </div>
            <p className="font-extrabold text-xs tracking-tighter text-slate-800 text-center">==================================================</p>

            <div className="pt-2 flex space-x-2">
              <button
                onClick={() => setPrintedReceiptData(null)}
                className="w-full py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl"
              >
                Yopish
              </button>
              <button
                onClick={() => {
                  window.print();
                  setPrintedReceiptData(null);
                }}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-lg"
              >
                Chop etish 🖨️
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 5: OSHXONA CHEKI (Kitchen Ticket Printable - Hidden on screen, visible only when printing) */}
      {/* ========================================================= */}
      {kitchenTicketData && (
        <div className="hidden print:block fixed inset-0 bg-white text-slate-900 p-6 font-mono space-y-4 z-[9999]">
          <div className="text-center border-b-2 border-dashed border-slate-900 pb-3">
            <h2 className="font-extrabold text-base text-slate-900 uppercase">{kitchenTicketData.title}</h2>
            <p className="text-[10px] text-slate-700 mt-1">🕒 {kitchenTicketData.date}</p>
          </div>

          <div className="space-y-2 text-sm font-bold text-slate-900">
            {kitchenTicketData.items?.map((it: any, idx: number) => (
              <div key={idx} className="flex justify-between p-2 border-b border-slate-300">
                <span>{it.product_name || it.name}</span>
                <span className="font-extrabold text-base">x{it.quantity}</span>
              </div>
            ))}
          </div>

          {kitchenTicketData.total ? (
            <div className="pt-2 border-t-2 border-slate-900 font-extrabold text-sm flex justify-between">
              <span>JAMI:</span>
              <span>{kitchenTicketData.total?.toLocaleString()} UZS</span>
            </div>
          ) : null}
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 6: YANGI TELEFON BUYURTMASI MODAL (WITH VIRTUAL KEYBOARD) */}
      {/* ========================================================= */}
      {showPhoneOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-2xl bg-[#1C2128] border border-[#2D333D] rounded-2xl p-6 space-y-4 my-auto shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-[#2D333D]">
              <h3 className="font-bold text-lg text-white flex items-center gap-2">
                <PhoneCall className="w-5 h-5 text-sky-400" />
                <span>Yangi Telefon Buyurtmasi Qabul Qilish</span>
              </h3>
              <button onClick={() => setShowPhoneOrderModal(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreatePhoneOrder} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1 text-xs">
                    Mijoz Ismi {activePhoneInput === 'name' && <span className="text-amber-400 font-bold">✏️ (Kiritilmoqda)</span>}
                  </label>
                  <input
                    type="text"
                    value={phoneOrderForm.name}
                    onFocus={() => setActivePhoneInput('name')}
                    onChange={(e) => setPhoneOrderForm({ ...phoneOrderForm, name: e.target.value })}
                    placeholder="Anvar Karimov"
                    className={`w-full bg-[#0F1115] border rounded-xl p-3 text-sm text-white font-semibold transition-all ${
                      activePhoneInput === 'name' ? 'border-amber-500 ring-2 ring-amber-500/50 bg-[#16191F]' : 'border-[#2D333D]'
                    }`}
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1 text-xs">
                    Telefon Raqami {activePhoneInput === 'phone' && <span className="text-amber-400 font-bold">✏️ (Kiritilmoqda)</span>}
                  </label>
                  <input
                    type="text"
                    value={phoneOrderForm.phone}
                    onFocus={() => setActivePhoneInput('phone')}
                    onChange={(e) => setPhoneOrderForm({ ...phoneOrderForm, phone: e.target.value })}
                    className={`w-full bg-[#0F1115] border rounded-xl p-3 text-sm text-white font-mono font-bold transition-all ${
                      activePhoneInput === 'phone' ? 'border-amber-500 ring-2 ring-amber-500/50 bg-[#16191F]' : 'border-[#2D333D]'
                    }`}
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-300 font-semibold text-xs">
                    Etkazib Berish Manzili {activePhoneInput === 'address' && <span className="text-amber-400 font-bold">✏️ (Kiritilmoqda)</span>}
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowYandexMapModal(true)}
                    className="text-sky-400 hover:text-sky-300 text-xs font-bold flex items-center gap-1 bg-sky-500/10 px-2.5 py-1 rounded-lg border border-sky-500/30"
                  >
                    <MapPin className="w-4 h-4 text-red-500" />
                    <span>Yandex Xaritalar 📍</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={phoneOrderForm.address}
                    onFocus={() => setActivePhoneInput('address')}
                    onChange={(e) => setPhoneOrderForm({ ...phoneOrderForm, address: e.target.value })}
                    placeholder="Chilonzor 9-mavze, 12-uy, 44-xonadon"
                    className={`w-full bg-[#0F1115] border rounded-xl p-3 pr-10 text-sm text-white font-medium transition-all ${
                      activePhoneInput === 'address' ? 'border-amber-500 ring-2 ring-amber-500/50 bg-[#16191F]' : 'border-[#2D333D]'
                    }`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowYandexMapModal(true)}
                    className="absolute right-2 top-2.5 p-1 text-red-500 hover:text-red-400 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-all"
                    title="Yandex Xaritadan manzil belgilash"
                  >
                    <Map className="w-5 h-5 text-red-500" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1 text-xs">
                  Qo'shimcha Izoh (Ixtiyoriy) {activePhoneInput === 'note' && <span className="text-amber-400 font-bold">✏️ (Kiritilmoqda)</span>}
                </label>
                <input
                  type="text"
                  value={phoneOrderForm.note || ''}
                  onFocus={() => setActivePhoneInput('note')}
                  onChange={(e) => setPhoneOrderForm({ ...phoneOrderForm, note: e.target.value })}
                  placeholder="Mo'ljal: Korzinka yonida, Domofon #44..."
                  className={`w-full bg-[#0F1115] border rounded-xl p-3 text-sm text-white transition-all ${
                    activePhoneInput === 'note' ? 'border-amber-500 ring-2 ring-amber-500/50 bg-[#16191F]' : 'border-[#2D333D]'
                  }`}
                />
              </div>

              {/* VIRTUAL KEYBOARD FOR TOUCH / MOBILE POS (KATTALASHTIRILGAN) */}
              <div className="bg-[#0F1115] border border-[#2D333D] rounded-2xl p-3 space-y-2.5 mt-2 shadow-inner">
                <div className="flex justify-between items-center px-1 pb-1.5 border-b border-[#2D333D]">
                  <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    ⌨️ KATTIK VIRTUAL KLAVIATURA (<span className="text-white uppercase font-black">{activePhoneInput}</span>)
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">Tugmalarni bosib kiritishingiz mumkin</span>
                </div>

                {/* Numbers */}
                <div className="grid grid-cols-12 gap-1.5">
                  {['1','2','3','4','5','6','7','8','9','0','+','-'].map((k) => (
                    <button
                      type="button"
                      key={k}
                      onClick={() => setPhoneOrderForm(f => ({ ...f, [activePhoneInput]: f[activePhoneInput] + k }))}
                      className="py-2.5 sm:py-3.5 bg-[#1C2128] hover:bg-amber-500 hover:text-slate-950 active:scale-95 border border-[#2D333D] rounded-xl text-base sm:text-lg font-black text-white transition-all shadow-md"
                    >
                      {k}
                    </button>
                  ))}
                </div>

                {/* Letters Q-P */}
                <div className="grid grid-cols-10 gap-1.5">
                  {['Q','W','E','R','T','Y','U','I','O','P'].map((k) => (
                    <button
                      type="button"
                      key={k}
                      onClick={() => setPhoneOrderForm(f => ({ ...f, [activePhoneInput]: f[activePhoneInput] + k }))}
                      className="py-2.5 sm:py-3.5 bg-[#1C2128] hover:bg-amber-500 hover:text-slate-950 active:scale-95 border border-[#2D333D] rounded-xl text-base sm:text-lg font-black text-white transition-all shadow-md"
                    >
                      {k}
                    </button>
                  ))}
                </div>

                {/* Letters A-L */}
                <div className="grid grid-cols-9 gap-1.5">
                  {['A','S','D','F','G','H','J','K','L'].map((k) => (
                    <button
                      type="button"
                      key={k}
                      onClick={() => setPhoneOrderForm(f => ({ ...f, [activePhoneInput]: f[activePhoneInput] + k }))}
                      className="py-2.5 sm:py-3.5 bg-[#1C2128] hover:bg-amber-500 hover:text-slate-950 active:scale-95 border border-[#2D333D] rounded-xl text-base sm:text-lg font-black text-white transition-all shadow-md"
                    >
                      {k}
                    </button>
                  ))}
                </div>

                {/* Letters Z-M & Uzbek specials */}
                <div className="grid grid-cols-9 gap-1.5">
                  {['Z','X','C','V','B','N','M',"O'", "G'"].map((k) => (
                    <button
                      type="button"
                      key={k}
                      onClick={() => setPhoneOrderForm(f => ({ ...f, [activePhoneInput]: f[activePhoneInput] + k }))}
                      className="py-2.5 sm:py-3.5 bg-[#1C2128] hover:bg-amber-500 hover:text-slate-950 active:scale-95 border border-[#2D333D] rounded-xl text-base sm:text-lg font-black text-white transition-all shadow-md"
                    >
                      {k}
                    </button>
                  ))}
                </div>

                {/* Space, Backspace, Clear */}
                <div className="grid grid-cols-4 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setPhoneOrderForm(f => ({ ...f, [activePhoneInput]: f[activePhoneInput] + ' ' }))}
                    className="col-span-2 py-3 bg-[#252A31] hover:bg-slate-600 active:scale-95 border border-[#2D333D] rounded-xl text-xs sm:text-sm font-bold text-white transition-all shadow-md"
                  >
                    BO'SH JOY (Space)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPhoneOrderForm(f => ({ ...f, [activePhoneInput]: f[activePhoneInput].slice(0, -1) }))}
                    className="py-3 bg-amber-600/30 hover:bg-amber-600 text-amber-200 active:scale-95 border border-amber-500/40 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-md"
                  >
                    ⌫ O'chirish
                  </button>
                  <button
                    type="button"
                    onClick={() => setPhoneOrderForm(f => ({ ...f, [activePhoneInput]: '' }))}
                    className="py-3 bg-rose-600/30 hover:bg-rose-600 text-rose-200 active:scale-95 border border-rose-500/40 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-md"
                  >
                    Tozalash
                  </button>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPhoneOrderModal(false)}
                  className="px-4 py-2 bg-[#2D333D] text-slate-300 text-xs rounded-xl font-semibold"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl shadow-lg flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Mijozni Qo'shish va Davom Etish ➡️</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: KATEGORIYA QO'SHISH / TAHRIRLASH */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#1C2128] border border-[#2D333D] rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#2D333D]">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <span>📁 {editingCategory ? "Kategoriyani Tahrirlash" : "Yangi Kategoriya Qo'shish"}</span>
              </h3>
              <button onClick={() => setShowAddCategoryModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Kategoriya Nomi</label>
                <input
                  type="text"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="masalan: Burgerlar"
                  className="w-full bg-[#0F1115] border border-[#2D333D] rounded-xl p-2.5 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Kategoriya Belgisi / Emoji</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={newCatIcon}
                    onChange={(e) => setNewCatIcon(e.target.value)}
                    className="w-16 bg-[#0F1115] border border-[#2D333D] rounded-xl p-2.5 text-center text-lg text-white"
                    required
                  />
                  <div className="flex flex-wrap gap-1">
                    {['🍔', '🌯', '🍕', '🥤', '🍟', '🍦', '🥩', '🍜', '☕', '🍰'].map((em) => (
                      <button
                        type="button"
                        key={em}
                        onClick={() => setNewCatIcon(em)}
                        className={`w-8 h-8 rounded-lg border text-base flex items-center justify-center transition-all ${
                          newCatIcon === em ? 'border-amber-400 bg-amber-500/20' : 'border-[#2D333D] bg-[#0F1115] hover:border-slate-500'
                        }`}
                      >
                        {em}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-[#2D333D]">
                <button
                  type="button"
                  onClick={() => setShowAddCategoryModal(false)}
                  className="px-4 py-2 bg-[#2D333D] text-slate-300 text-xs rounded-xl font-semibold"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl shadow-lg"
                >
                  Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: MAHSULOT QO'SHISH / TAHRIRLASH */}
      {showAddProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[#1C2128] border border-[#2D333D] rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#2D333D]">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <span>🍔 {editingProduct ? "Taom/Mahsulotni Tahrirlash" : "Yangi Taom Qo'shish"}</span>
              </h3>
              <button onClick={() => setShowAddProductModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Kategoriya</label>
                <select
                  value={newProdCatId}
                  onChange={(e) => setNewProdCatId(Number(e.target.value))}
                  className="w-full bg-[#0F1115] border border-[#2D333D] rounded-xl p-2.5 text-white font-semibold"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.icon} {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Mahsulot Nomi</label>
                  <input
                    type="text"
                    value={newProdName}
                    onChange={(e) => setNewProdName(e.target.value)}
                    placeholder="Cheeseburger Max"
                    className="w-full bg-[#0F1115] border border-[#2D333D] rounded-xl p-2.5 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Narxi (so'm)</label>
                  <input
                    type="number"
                    value={newProdPrice}
                    onChange={(e) => setNewProdPrice(Number(e.target.value))}
                    className="w-full bg-[#0F1115] border border-[#2D333D] rounded-xl p-2.5 text-amber-400 font-mono font-bold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Tavsif / Tarkibi</label>
                <textarea
                  value={newProdDesc}
                  onChange={(e) => setNewProdDesc(e.target.value)}
                  placeholder="Ikki qatlam go'sht, eriydigan sir, maxsus sous..."
                  rows={2}
                  className="w-full bg-[#0F1115] border border-[#2D333D] rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Rasm URL Manzili</label>
                <input
                  type="text"
                  value={newProdPhoto}
                  onChange={(e) => setNewProdPhoto(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-[#0F1115] border border-[#2D333D] rounded-xl p-2.5 text-white font-mono text-[11px]"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-[#2D333D]">
                <button
                  type="button"
                  onClick={() => setShowAddProductModal(false)}
                  className="px-4 py-2 bg-[#2D333D] text-slate-300 text-xs rounded-xl font-semibold"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black rounded-xl shadow-lg"
                >
                  Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: KURYER QO'SHISH / TAHRIRLASH */}
      {showAddCourierModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#1C2128] border border-[#2D333D] rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#2D333D]">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <span>🚴 {editingCourier ? "Kuryer Ma'lumotlarini Tahrirlash" : "Yangi Kuryer Qo'shish"}</span>
              </h3>
              <button onClick={() => setShowAddCourierModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCourier} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Kuryer Ismi-Sharifi</label>
                <input
                  type="text"
                  value={newCourierName}
                  onChange={(e) => setNewCourierName(e.target.value)}
                  placeholder="Jasur Rahimov"
                  className="w-full bg-[#0F1115] border border-[#2D333D] rounded-xl p-2.5 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Telefon Raqami</label>
                <input
                  type="text"
                  value={newCourierPhone}
                  onChange={(e) => setNewCourierPhone(e.target.value)}
                  className="w-full bg-[#0F1115] border border-[#2D333D] rounded-xl p-2.5 text-white font-mono"
                  required
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-slate-300 font-semibold">Login (10 belgili format)</label>
                  <button
                    type="button"
                    onClick={() => setNewCourierUsername(generate10CharLogin())}
                    className="text-[10px] text-indigo-400 hover:underline font-bold"
                  >
                    🎲 Yangi Generatsiya
                  </button>
                </div>
                <input
                  type="text"
                  value={newCourierUsername}
                  onChange={(e) => setNewCourierUsername(e.target.value)}
                  maxLength={10}
                  className="w-full bg-[#0F1115] border border-[#2D333D] rounded-xl p-2.5 text-indigo-300 font-mono font-bold text-sm"
                  placeholder="aBcDefG!12"
                  required
                />
                <p className="text-[10px] text-slate-500 mt-1">7 ta harf + 1 ta belgi + 2 ta raqam (Jami 10 xona)</p>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-slate-300 font-semibold">Parol (8 xonali raqam)</label>
                  <button
                    type="button"
                    onClick={() => setNewCourierPassword(String(Math.floor(10000000 + Math.random() * 90000000)))}
                    className="text-[10px] text-emerald-400 hover:underline font-bold"
                  >
                    🎲 Yangi Generatsiya
                  </button>
                </div>
                <input
                  type="text"
                  value={newCourierPassword}
                  onChange={(e) => setNewCourierPassword(e.target.value)}
                  className="w-full bg-[#0F1115] border border-[#2D333D] rounded-xl p-2.5 text-emerald-300 font-mono font-bold"
                  required
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-[#2D333D]">
                <button
                  type="button"
                  onClick={() => setShowAddCourierModal(false)}
                  className="px-4 py-2 bg-[#2D333D] text-slate-300 text-xs rounded-xl font-semibold"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg"
                >
                  Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: OFITSIANT QO'SHISH / TAHRIRLASH */}
      {showAddWaiterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#1C2128] border border-[#2D333D] rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#2D333D]">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <span>🤵 {editingWaiter ? "Ofitsiant Ma'lumotlarini Tahrirlash" : "Yangi Ofitsiant Qo'shish"}</span>
              </h3>
              <button onClick={() => setShowAddWaiterModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveWaiter} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Ofitsiant Ismi-Sharifi</label>
                <input
                  type="text"
                  value={newWaiterName}
                  onChange={(e) => setNewWaiterName(e.target.value)}
                  placeholder="Bobur Salimov"
                  className="w-full bg-[#0F1115] border border-[#2D333D] rounded-xl p-2.5 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Telefon Raqami</label>
                <input
                  type="text"
                  value={newWaiterPhone}
                  onChange={(e) => setNewWaiterPhone(e.target.value)}
                  className="w-full bg-[#0F1115] border border-[#2D333D] rounded-xl p-2.5 text-white font-mono"
                  required
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-slate-300 font-semibold">Login (10 belgili format)</label>
                  <button
                    type="button"
                    onClick={() => setNewWaiterUsername(generate10CharLogin())}
                    className="text-[10px] text-indigo-400 hover:underline font-bold"
                  >
                    🎲 Yangi Generatsiya
                  </button>
                </div>
                <input
                  type="text"
                  value={newWaiterUsername}
                  onChange={(e) => setNewWaiterUsername(e.target.value)}
                  maxLength={10}
                  className="w-full bg-[#0F1115] border border-[#2D333D] rounded-xl p-2.5 text-amber-300 font-mono font-bold text-sm"
                  placeholder="xYzAbCd#99"
                  required
                />
                <p className="text-[10px] text-slate-500 mt-1">7 ta harf + 1 ta belgi + 2 ta raqam (Jami 10 xona)</p>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-slate-300 font-semibold">Parol (8 xonali raqam)</label>
                  <button
                    type="button"
                    onClick={() => setNewWaiterPassword(String(Math.floor(10000000 + Math.random() * 90000000)))}
                    className="text-[10px] text-emerald-400 hover:underline font-bold"
                  >
                    🎲 Yangi Generatsiya
                  </button>
                </div>
                <input
                  type="text"
                  value={newWaiterPassword}
                  onChange={(e) => setNewWaiterPassword(e.target.value)}
                  className="w-full bg-[#0F1115] border border-[#2D333D] rounded-xl p-2.5 text-emerald-300 font-mono font-bold"
                  required
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-[#2D333D]">
                <button
                  type="button"
                  onClick={() => setShowAddWaiterModal(false)}
                  className="px-4 py-2 bg-[#2D333D] text-slate-300 text-xs rounded-xl font-semibold"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl shadow-lg"
                >
                  Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PROMOKOD YARATISH / TAHRIRLASH */}
      {showAddPromoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#1C2128] border border-[#2D333D] rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#2D333D]">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Ticket className="w-4 h-4 text-purple-400" />
                <span>{editingPromo ? "Promokodni Tahrirlash" : "Yangi Promokod Yaratish"}</span>
              </h3>
              <button
                onClick={() => {
                  setShowAddPromoModal(false);
                  setEditingPromo(null);
                }}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePromo} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Promokod Nomi / Kodi</label>
                <input
                  type="text"
                  value={newPromoCode}
                  onChange={(e) => setNewPromoCode(e.target.value.toUpperCase())}
                  placeholder="TAAM10 yoki TEZLAZZAT2026"
                  className="w-full bg-[#0F1115] border border-[#2D333D] rounded-xl p-2.5 text-amber-400 font-mono font-bold uppercase"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Chegirma Turi</label>
                  <select
                    value={newPromoType}
                    onChange={(e) => setNewPromoType(e.target.value as any)}
                    className="w-full bg-[#0F1115] border border-[#2D333D] rounded-xl p-2.5 text-white"
                  >
                    <option value="percent">Foiz (%)</option>
                    <option value="fixed">Fikslangan Summa (so'm)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    {newPromoType === 'percent' ? 'Foiz miqdori (%)' : 'Summa (so\'m)'}
                  </label>
                  <input
                    type="number"
                    value={newPromoVal}
                    onChange={(e) => setNewPromoVal(Number(e.target.value))}
                    className="w-full bg-[#0F1115] border border-[#2D333D] rounded-xl p-2.5 text-emerald-400 font-mono font-bold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Maksimal Ishlatish Soni</label>
                  <input
                    type="number"
                    value={newPromoUses}
                    onChange={(e) => setNewPromoUses(Number(e.target.value))}
                    className="w-full bg-[#0F1115] border border-[#2D333D] rounded-xl p-2.5 text-white font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Amal Qilish Sanasi</label>
                  <input
                    type="date"
                    value={newPromoExpiresAt}
                    onChange={(e) => setNewPromoExpiresAt(e.target.value)}
                    className="w-full bg-[#0F1115] border border-[#2D333D] rounded-xl p-2.5 text-white font-mono"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-[#2D333D]">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddPromoModal(false);
                    setEditingPromo(null);
                  }}
                  className="px-4 py-2 bg-[#2D333D] text-slate-300 text-xs rounded-xl font-semibold"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl shadow-lg"
                >
                  {editingPromo ? "O'zgarishlarni Saqlash" : "Saqlash va Yaratish"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: YANDEX MAP ADDRESS PICKER MODAL */}
      {/* ========================================================= */}
      {showYandexMapModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-2xl bg-[#1C2128] border border-[#2D333D] rounded-2xl p-5 space-y-4 shadow-2xl my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#2D333D]">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <MapPin className="w-5 h-5 text-red-500" />
                <span>Yandex Xaritalar Orqali Manzil Belgilash</span>
              </h3>
              <button onClick={() => setShowYandexMapModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Location Pills */}
            <div className="space-y-1.5">
              <p className="text-[11px] font-bold text-slate-400">📍 Mashhur/Tezkor hududlar:</p>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {[
                  "Toshkent sh., Chilonzor tumani, 9-mavze, 14-uy",
                  "Toshkent sh., Yunusobod tumani, 4-mavze, 22-uy",
                  "Toshkent sh., Mirzo Ulug'bek t., Buyuk Ipak Yo'li, 45-uy",
                  "Toshkent sh., Shayxontohur t., Samarqand Darvoza, 10-uy",
                  "Toshkent sh., Sergeli tumani, 8-hudud, 3-uy",
                  "Toshkent sh., Yakkasaroy t., Shota Rustaveli, 18-uy"
                ].map((loc, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setPhoneOrderForm(prev => ({ ...prev, address: loc }));
                    }}
                    className="px-2.5 py-1 bg-[#0F1115] hover:bg-[#252A31] text-sky-300 border border-[#2D333D] rounded-xl text-[11px] font-medium whitespace-nowrap transition-all"
                  >
                    {loc}
                  </button>
                ))}
              </div>
            </div>

            {/* Interactive Yandex Map Frame */}
            <div className="relative h-64 w-full bg-[#0F1115] border border-[#2D333D] rounded-xl overflow-hidden flex items-center justify-center">
              <iframe
                title="Yandex Map"
                src="https://yandex.uz/map-widget/v1/?ll=69.2401%2C41.2995&z=13&l=map"
                className="w-full h-full border-0"
                allowFullScreen
              />
              <div className="absolute top-3 left-3 bg-[#1C2128]/90 backdrop-blur border border-[#2D333D] px-3 py-1.5 rounded-xl text-xs text-amber-300 font-bold flex items-center gap-1.5 shadow-lg">
                <MapPin className="w-4 h-4 text-red-500 animate-bounce" />
                <span>Markaziy Toshkent Xaritasi</span>
              </div>
            </div>

            {/* Selected Address Display */}
            <div className="space-y-1 bg-[#0F1115] p-3 border border-[#2D333D] rounded-xl">
              <label className="block text-[11px] font-bold text-amber-400">
                Aniq Tanlangan Manzil Matni:
              </label>
              <input
                type="text"
                value={phoneOrderForm.address}
                onChange={(e) => setPhoneOrderForm({ ...phoneOrderForm, address: e.target.value })}
                placeholder="Xaritalar yoki tahrir orqali manzil kiriting..."
                className="w-full bg-[#16191F] border border-[#2D333D] rounded-lg p-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
              <p className="text-[10px] text-slate-400">
                💡 Manzil xaritalardan aniq matn ko'rinishida saqlanadi (koordinata emas).
              </p>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end space-x-2 pt-2 border-t border-[#2D333D]">
              <button
                type="button"
                onClick={() => setShowYandexMapModal(false)}
                className="px-4 py-2 bg-[#2D333D] hover:bg-[#383F4B] text-slate-300 text-xs rounded-xl font-semibold transition-all"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!phoneOrderForm.address.trim()) {
                    alert("Iltimos, manzilni kiriting yoki tanlang!");
                    return;
                  }
                  setShowYandexMapModal(false);
                }}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg transition-all flex items-center gap-1.5"
              >
                <span>Manzilni Tasdiqlash va Saqlash</span>
                <span>✅</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* 3-Second Temporary Kitchen Ticket Notification Toast Banner */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[99999] bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white font-black px-6 py-3.5 rounded-2xl shadow-2xl border-2 border-emerald-400 flex items-center gap-3 transition-all animate-bounce">
          <span className="text-2xl animate-pulse">🍳</span>
          <span className="text-sm sm:text-base tracking-wide">{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
