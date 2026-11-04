import React, { useState, useEffect } from 'react';
import { Courier, Order } from '../types';
import {
  Bike,
  MapPin,
  Phone,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Star,
  Copy,
  ExternalLink,
  Navigation,
  DollarSign,
  PackageCheck,
  RefreshCw,
  UserCheck
} from 'lucide-react';

interface CourierDashboardProps {
  courierId: string;
}

export const CourierDashboard: React.FC<CourierDashboardProps> = ({ courierId }) => {
  const [courier, setCourier] = useState<Courier | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

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

  const fetchCourierData = async () => {
    try {
      const [cRes, oRes] = await Promise.all([
        fetch(`/api/courier/profile/${courierId}`),
        fetch(`/api/courier/orders/${courierId}`),
      ]);

      const cData = await safeJson(cRes);
      if (cData) setCourier(cData);

      const oData = await safeJson(oRes);
      if (oData) setOrders(oData);
    } catch (err) {
      console.warn('Failed to load courier data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourierData();
    const interval = setInterval(fetchCourierData, 5000); // Live poll every 5s
    return () => clearInterval(interval);
  }, [courierId]);

  const handleMarkDelivered = async (orderId: number) => {
    setActionLoading(orderId);
    setSuccessMsg(null);

    try {
      const res = await fetch(`/api/courier/orders/${orderId}/deliver`, {
        method: 'POST',
      });
      const data = await res.json();

      if (data.success) {
        setSuccessMsg(`Buyurtma #${orderId} yetkazildi deb belgilandi! Xaridorga Telegram bot orqali baholash tugmasi yuborildi.`);
        fetchCourierData();
      } else {
        alert(data.error || 'Xatolik yuz berdi');
      }
    } catch (err) {
      alert('Server bilan bog\'lanishda xatolik');
    } finally {
      setActionLoading(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Nusxalandi: ' + text);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-slate-400">
        <RefreshCw className="w-6 h-6 animate-spin mr-2 text-amber-500" />
        <span>Kuryer paneli yuklanmoqda...</span>
      </div>
    );
  }

  if (!courier) {
    return (
      <div className="p-8 text-center text-rose-400">
        Kuryer ma'lumotlari topilmadi.
      </div>
    );
  }

  const activeOrders = orders.filter((o) => ['on_way', 'preparing', 'pending', 'delivered'].includes(o.status));
  const completedOrders = orders.filter((o) => o.status === 'completed');

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Courier Header Card */}
      <div className="bg-[#1C2128] border border-[#2D333D] rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-indigo-500/20">
              <Bike className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-semibold tracking-tight text-white">{courier.full_name}</h2>
                <span className="text-xs px-2.5 py-0.5 rounded-md bg-[#16191F] text-slate-300 font-mono font-semibold border border-[#2D333D]">
                  {courier.id}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono flex items-center gap-2 mt-1">
                <span>📞 {courier.phone}</span>
                <span>•</span>
                <span>👤 @{courier.username}</span>
              </p>
            </div>
          </div>

          {/* Courier Metrics & Status */}
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto font-mono">
            <div className="bg-[#16191F] px-3.5 py-2 rounded-xl border border-[#2D333D] text-center flex-1 sm:flex-none">
              <p className="text-[10px] uppercase font-bold text-slate-500">O'rtacha Baho</p>
              <div className="flex items-center justify-center text-amber-400 font-bold text-sm space-x-1 mt-0.5">
                <Star className="w-4 h-4 fill-amber-400" />
                <span>{courier.avg_rating || '5.0'}</span>
                <span className="text-xs text-slate-500 font-normal">({courier.rating_count})</span>
              </div>
            </div>

            <div className={`px-3.5 py-2 rounded-xl border text-center flex-1 sm:flex-none ${
              courier.penalties > 0
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                : 'bg-[#16191F] border-[#2D333D] text-emerald-400'
            }`}>
              <p className="text-[10px] uppercase font-bold text-slate-500">Jarima Ballari</p>
              <div className="flex items-center justify-center font-bold text-sm space-x-1 mt-0.5">
                <AlertTriangle className="w-4 h-4" />
                <span>{courier.penalties} ball</span>
              </div>
            </div>

            <div className="bg-[#16191F] px-3.5 py-2 rounded-xl border border-[#2D333D] text-center flex-1 sm:flex-none">
              <p className="text-[10px] uppercase font-bold text-slate-500">Yetkazilgan</p>
              <div className="font-bold text-sm text-slate-200 mt-0.5">
                {courier.completed_orders} ta
              </div>
            </div>
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-between text-emerald-400 text-xs sm:text-sm">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-xs text-emerald-300 underline font-semibold ml-2">
            Yopish
          </button>
        </div>
      )}

      {/* Segregated Orders List Header */}
      <div className="flex items-center justify-between border-b border-[#2D333D] pb-3">
        <div>
          <h3 className="text-lg font-semibold tracking-tight text-white flex items-center gap-2">
            <span>Sizning Buyurtmalaringiz</span>
            <span className="text-xs px-2 py-0.5 bg-indigo-500/10 text-indigo-400 font-mono font-semibold rounded-full border border-indigo-500/20">
              {activeOrders.length} ta faol
            </span>
          </h3>
          <p className="text-xs text-slate-400">Mijozlar buyurtmalari boshqa kuryerlar bilan chalkashmaydi</p>
        </div>

        <button
          onClick={fetchCourierData}
          className="p-2 bg-[#1C2128] hover:bg-[#252A31] text-slate-300 rounded-lg text-xs font-medium border border-[#2D333D] flex items-center gap-1 transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Yangilash</span>
        </button>
      </div>

      {/* Active Orders List */}
      {activeOrders.length === 0 ? (
        <div className="bg-[#1C2128] border border-[#2D333D] rounded-2xl p-12 text-center text-slate-400">
          <PackageCheck className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h4 className="text-base font-semibold text-slate-300">Hozircha sizga biriktirilgan faol buyurtma yo'q</h4>
          <p className="text-xs text-slate-500 mt-1">Admin yangi buyurtma biriktirganda bu yerda paydo bo'ladi.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {activeOrders.map((order) => {
            const mapSearchQuery = encodeURIComponent(order.address);
            const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${mapSearchQuery}`;
            const yandexMapsUrl = `https://yandex.com/maps/?text=${mapSearchQuery}`;

            return (
              <div
                key={order.id}
                className="bg-[#1C2128] border border-[#2D333D] rounded-2xl overflow-hidden shadow-xl"
              >
                {/* Order Top Bar */}
                <div className="bg-[#16191F] px-5 py-3.5 border-b border-[#2D333D] flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-3">
                    <span className="text-lg font-mono font-bold text-indigo-400">#{order.id}</span>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-mono uppercase ${
                      order.status === 'on_way'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : order.status === 'delivered'
                        ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}>
                      {order.status === 'on_way' && '🚗 Yo\'lda'}
                      {order.status === 'delivered' && '⏳ Yetkazildi (Tasdiqlash kutilmoqda)'}
                      {order.status === 'preparing' && '👨‍🍳 Tayyorlanmoqda'}
                    </span>
                  </div>

                  <div className="text-xs text-slate-400 font-mono flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>

                {/* Order Body Details */}
                <div className="p-5 space-y-4">
                  {/* Client Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#16191F] p-4 rounded-xl border border-[#2D333D]">
                    <div>
                      <p className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Xaridor Ma'lumotlari</p>
                      <h4 className="text-base font-semibold text-white mt-0.5">{order.user_name}</h4>
                      <p className="text-xs text-slate-400 font-mono">Username: @{order.user_username || '-'}</p>
                      
                      <div className="mt-3 flex items-center space-x-2">
                        <a
                          href={`tel:${order.user_phone}`}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs rounded-lg flex items-center space-x-1.5 shadow-md shadow-emerald-500/20 transition-all font-mono"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>Qo'ng'iroq qilish</span>
                        </a>
                        <button
                          onClick={() => copyToClipboard(order.user_phone)}
                          className="p-1.5 bg-[#2D333D] hover:bg-[#363D48] text-slate-300 rounded-lg text-xs transition-colors"
                          title="Telefonni nusxalash"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Yetkazib Berish Manzili</p>
                      <p className="text-sm font-semibold text-slate-200 mt-1 flex items-start gap-1.5">
                        <MapPin className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                        <span>{order.address}</span>
                      </p>

                      {order.note && (
                        <div className="mt-2 text-xs bg-amber-500/10 border border-amber-500/20 text-amber-300 p-2 rounded-lg">
                          <strong>Izoh:</strong> {order.note}
                        </div>
                      )}

                      <div className="mt-3 flex items-center space-x-2">
                        <a
                          href={googleMapsUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 bg-[#2D333D] hover:bg-[#363D48] text-sky-400 font-medium text-xs rounded-lg border border-[#2D333D] flex items-center space-x-1.5 transition-all"
                        >
                          <Navigation className="w-3.5 h-3.5" />
                          <span>Google Maps</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                        <a
                          href={yandexMapsUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 bg-[#2D333D] hover:bg-[#363D48] text-amber-400 font-medium text-xs rounded-lg border border-[#2D333D] flex items-center space-x-1.5 transition-all"
                        >
                          <Navigation className="w-3.5 h-3.5" />
                          <span>Yandex Maps</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Food Items & Total */}
                  <div>
                    <p className="text-[10px] font-bold uppercase text-slate-500 tracking-wider mb-2">Buyurtma Qilingan Taomlar</p>
                    <div className="bg-[#16191F] rounded-xl p-3 border border-[#2D333D] space-y-1.5 text-xs text-slate-300">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                          <span>• {item.product_name} × {item.quantity}</span>
                          <span className="font-mono font-semibold">{item.price * item.quantity} so'm</span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-3 flex flex-wrap items-center justify-between bg-[#16191F] p-3 rounded-xl border border-[#2D333D]">
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">To'lov Usuli</p>
                        <p className="text-xs font-semibold text-white uppercase font-mono">{order.payment_method}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Jami Summa</p>
                        <p className="text-base font-mono font-bold text-indigo-400">{order.total_amount.toLocaleString()} so'm</p>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-2 border-t border-[#2D333D] flex items-center justify-end">
                    {order.status === 'delivered' ? (
                      <div className="text-xs text-sky-400 font-semibold flex items-center gap-2 bg-sky-500/10 px-4 py-2.5 rounded-xl border border-sky-500/20">
                        <CheckCircle2 className="w-4 h-4 animate-pulse" />
                        <span>Mijoz Telegram orqali tasdiqlashi va baholashi kutilmoqda</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleMarkDelivered(order.id)}
                        disabled={actionLoading === order.id}
                        className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-xl shadow-lg shadow-indigo-500/20 flex items-center justify-center space-x-2 transition-all"
                      >
                        {actionLoading === order.id ? (
                          <span>Yuborilmoqda...</span>
                        ) : (
                          <>
                            <CheckCircle2 className="w-5 h-5" />
                            <span>YETKAZILDI (Mijozga Tasdiqlash Yuborish)</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Completed Deliveries History */}
      {completedOrders.length > 0 && (
        <div className="mt-8 bg-[#1C2128] border border-[#2D333D] rounded-2xl p-5 space-y-3">
          <h4 className="text-sm font-semibold tracking-tight text-slate-300">Bajarilgan Buyurtmalar Tarixi ({completedOrders.length})</h4>
          <div className="space-y-2 text-xs">
            {completedOrders.map((o) => (
              <div key={o.id} className="p-3 bg-[#16191F] rounded-xl flex items-center justify-between border border-[#2D333D]">
                <div>
                  <span className="font-mono font-semibold text-indigo-400 mr-2">#{o.id}</span>
                  <span className="text-slate-300">{o.user_name} ({o.address})</span>
                </div>
                <div className="flex items-center space-x-3 font-mono">
                  <span className="font-semibold text-emerald-400">{o.total_amount.toLocaleString()} so'm</span>
                  {o.rating && (
                    <span className="flex items-center text-amber-400 font-bold">
                      <Star className="w-3.5 h-3.5 fill-amber-400 mr-0.5" />
                      {o.rating}/5
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
