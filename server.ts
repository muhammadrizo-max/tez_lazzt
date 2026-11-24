import express from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { store } from './src/db/store';
import { issueSession, clearSession, requireStaff, requireCourierOrStaff } from './src/auth';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '20mb' }));

// Himoya: admin/ofitsiant/kuryer API'lari token talab qiladi
app.use('/api/admin', requireStaff);
app.use('/api/tables', requireStaff);
app.use('/api/saboy-orders', requireStaff);
app.use('/api/courier', requireCourierOrStaff);

// Telegram API Helper
async function sendTelegramMessage(chatId: number | string, text: string, replyMarkup?: any) {
  const token = process.env.BOT_TOKEN;
  if (!token) {
    console.log('[Mock Telegram Notification]: No BOT_TOKEN set. Would send to', chatId, text);
    return false;
  }
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        reply_markup: replyMarkup,
      }),
    });
    const data = await res.json();
    return data.ok;
  } catch (err) {
    console.error('Failed to send Telegram message:', err);
    return false;
  }
}

async function sendTelegramPhoto(chatId: number | string, photoUrl: string, caption?: string, replyMarkup?: any) {
  const token = process.env.BOT_TOKEN;
  if (!token) return false;
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        photo: photoUrl,
        caption: caption || '',
        parse_mode: 'HTML',
        reply_markup: replyMarkup,
      }),
    });
    const data = await res.json();
    return data.ok;
  } catch (err) {
    console.error('Failed to send photo:', err);
    return false;
  }
}

async function sendTelegramVideo(chatId: number | string, videoUrl: string, caption?: string, replyMarkup?: any) {
  const token = process.env.BOT_TOKEN;
  if (!token) return false;
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendVideo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        video: videoUrl,
        caption: caption || '',
        parse_mode: 'HTML',
        reply_markup: replyMarkup,
      }),
    });
    const data = await res.json();
    return data.ok;
  } catch (err) {
    console.error('Failed to send video:', err);
    return false;
  }
}

async function sendTelegramDocument(chatId: number | string, docUrl: string, caption?: string, replyMarkup?: any) {
  const token = process.env.BOT_TOKEN;
  if (!token) return false;
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendDocument`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        document: docUrl,
        caption: caption || '',
        parse_mode: 'HTML',
        reply_markup: replyMarkup,
      }),
    });
    const data = await res.json();
    return data.ok;
  } catch (err) {
    console.error('Failed to send document:', err);
    return false;
  }
}

async function sendTelegramDocumentBuffer(chatId: number | string, buffer: Buffer, filename: string, caption?: string) {
  const token = process.env.BOT_TOKEN;
  if (!token) return false;
  try {
    const formData = new FormData();
    formData.append('chat_id', String(chatId));
    formData.append('caption', caption || '');
    const blob = new Blob([buffer], { type: 'application/json' });
    formData.append('document', blob, filename);

    const res = await fetch(`https://api.telegram.org/bot${token}/sendDocument`, {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    return data.ok;
  } catch (err) {
    console.error('Failed to send document buffer:', err);
    return false;
  }
}

// Automatic Daily Backup at 23:00 Tashkent Time (UTC+5) to user 6582564319 and backup group
let lastBackupDay = '';
if (!process.env.VERCEL) {
  setInterval(async () => {
    const sysSettings = store.getSettings();
    const targetUser = sysSettings.backup_user_id || '6582564319';
    const targetGroup = sysSettings.backup_group_id || '-1003857127288';
    const targetTime = sysSettings.backup_time || '23:00';
    const [targetHour] = targetTime.split(':').map(Number);

    const now = new Date();
    // Tashkent is UTC+5
    const tashkentTime = new Date(now.getTime() + (5 * 60 + now.getTimezoneOffset()) * 60000);
    const hours = tashkentTime.getHours();
    const dateStr = tashkentTime.toISOString().split('T')[0];

    if (hours === (targetHour || 23) && lastBackupDay !== dateStr) {
      lastBackupDay = dateStr;
      const rawData = store.getRawData();
      const buffer = Buffer.from(rawData, 'utf-8');
      const filename = `fastfood_backup_${dateStr}.json`;
      const caption = `📦 <b>Avtomatik Kunlik Avariya Zaxira (Backup)</b>\n📅 Sana: ${dateStr} (Toshkent vaqti ${targetTime})`;
      
      if (targetUser) await sendTelegramDocumentBuffer(targetUser, buffer, filename, caption);
      if (targetGroup) await sendTelegramDocumentBuffer(targetGroup, buffer, filename, caption);
    }
  }, 60000);
}

// =======================
// AUTHENTICATION API
// =======================

app.post('/api/auth/logout', (req, res) => {
  clearSession(res);
  res.json({ success: true });
});

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body || {};

  if (typeof username !== 'string' || typeof password !== 'string' || !username.trim() || !password.trim()) {
    return res.status(400).json({ error: 'Username va parol kiritilishi shart!' });
  }

  const sysSettings = store.getSettings();
  const adminUser = String(sysSettings.admin_username || process.env.ADMIN_USERNAME || 'admin');
  const adminPass = String(sysSettings.admin_password || process.env.ADMIN_PASSWORD || '');
  const emergencyPin = String(sysSettings.emergency_pin || '');

  const cleanUser = username.trim().toLowerCase();
  const cleanPass = password.trim();

  // 1. Admin: faqat admin nomi bilan. Favqulodda PIN ham faqat admin nomi bilan ishlaydi.
  if (cleanUser === adminUser.toLowerCase()) {
    const passOk = adminPass && cleanPass === adminPass;
    const pinOk = emergencyPin && cleanPass === emergencyPin;
    if (passOk || pinOk) {
      const user = { role: 'admin' as const, username: adminUser, name: 'Tizim Admini' };
      return res.json({ success: true, user: { ...user, token: issueSession(res, { u: adminUser, r: 'admin' }) } });
    }
  }

  // 2. Ofitsiant
  const waiter = store
    .getWaiters()
    .find((w) => String(w.username || '').toLowerCase() === cleanUser && w.password === cleanPass);
  if (waiter) {
    if (!waiter.is_active) {
      return res.status(403).json({ error: 'Sizning ofitsiantlik hisobingiz bloklangan!' });
    }
    const user = { role: 'ofitsiant' as const, username: waiter.username, name: waiter.full_name };
    return res.json({ success: true, user: { ...user, token: issueSession(res, { u: waiter.username, r: 'ofitsiant' }) } });
  }

  // 3. Kuryer
  const courier = store
    .getCouriers()
    .find((c) => String(c.username || '').toLowerCase() === cleanUser && c.password === cleanPass);
  if (courier) {
    if (!courier.is_active) {
      return res.status(403).json({ error: 'Sizning kuryerlik hisobingiz bloklangan!' });
    }
    const user = {
      role: 'courier' as const,
      username: courier.username,
      name: courier.full_name,
      courier_id: courier.id,
      courier,
    };
    return res.json({
      success: true,
      user: { ...user, token: issueSession(res, { u: courier.username, r: 'courier', cid: courier.id }) },
    });
  }

  return res.status(401).json({ error: "Loginingiz yoki parolingiz noto'g'ri! Kirish rad etildi." });
});

// =======================
// RESTAURANT TABLES API
// =======================
app.get('/api/tables', (req, res) => {
  res.json(store.getTables());
});

app.put('/api/tables/:id', (req, res) => {
  const updated = store.updateTable(Number(req.params.id), req.body);
  if (!updated) return res.status(404).json({ error: 'Stol topilmadi' });
  res.json(updated);
});

app.post('/api/tables/add', (req, res) => {
  const { name, seats, location } = req.body;
  const newTable = store.addTable(name, seats, location);
  res.json({ success: true, table: newTable });
});

app.delete('/api/tables/:id', (req, res) => {
  store.deleteTable(Number(req.params.id));
  res.json({ success: true });
});

app.post('/api/admin/tables/delete', (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'Stol ID talab qilinadi' });
  store.deleteTable(Number(id));
  res.json({ success: true });
});

// Saboy (Olib ketish) API
app.get('/api/saboy-orders', (req, res) => {
  res.json(store.getSaboyOrders());
});

app.post('/api/saboy-orders', (req, res) => {
  const { client_name, items, total_amount, order_id } = req.body;
  const saboy = store.saveSaboyOrder(client_name, items, total_amount, order_id);
  res.json({ success: true, saboy });
});

app.post('/api/saboy-orders/complete', (req, res) => {
  const { id } = req.body;
  store.completeSaboyOrder(Number(id));
  res.json({ success: true });
});

app.delete('/api/saboy-orders/:id', (req, res) => {
  store.completeSaboyOrder(Number(req.params.id));
  res.json({ success: true });
});

app.post('/api/tables/move', (req, res) => {
  const { from_table_id, to_table_id } = req.body;
  const result = store.moveTableOrder(Number(from_table_id), Number(to_table_id));
  res.json(result);
});

app.post('/api/tables/clear/:id', (req, res) => {
  const table = store.clearTable(Number(req.params.id));
  res.json({ success: true, table });
});

app.post('/api/tables/checkout', (req, res) => {
  const { table_id, payment_method, receipt_type, user_phone } = req.body;
  const result = store.checkoutTable(Number(table_id), payment_method || 'cash', receipt_type || 'oddiy', user_phone);
  res.json(result);
});

// =======================
// ADMIN API ENDPOINTS
// =======================

app.get('/api/admin/stats', (req, res) => {
  res.json(store.getStats());
});

app.get('/api/admin/settings', (req, res) => {
  res.json(store.getSettings());
});

app.post('/api/admin/settings', (req, res) => {
  const updated = store.updateSettings(req.body);
  res.json({ success: true, settings: updated });
});

app.get('/api/admin/backup', (req, res) => {
  const raw = store.getRawData();
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename=fastfood_backup_${new Date().toISOString().split('T')[0]}.json`);
  res.send(raw);
});

app.post('/api/admin/manual-backup-telegram', async (req, res) => {
  const sysSettings = store.getSettings();
  const targetUser = sysSettings.backup_user_id || '6582564319';
  const targetGroup = sysSettings.backup_group_id || '-1003857127288';
  
  const rawData = store.getRawData();
  const buffer = Buffer.from(rawData, 'utf-8');
  const dateStr = new Date().toISOString().split('T')[0];
  const timeStr = new Date().toLocaleTimeString('ru-RU');
  const filename = `fastfood_manual_backup_${dateStr}.json`;
  const caption = `📦 <b>Qo'lda Yuborilgan Avariya Zaxirasi (Backup)</b>\n📅 Sana: ${dateStr} ${timeStr}`;

  let userSent = false;
  let groupSent = false;

  if (targetUser) {
    userSent = await sendTelegramDocumentBuffer(targetUser, buffer, filename, caption);
  }
  if (targetGroup) {
    groupSent = await sendTelegramDocumentBuffer(targetGroup, buffer, filename, caption);
  }

  res.json({
    success: userSent || groupSent,
    userSent,
    groupSent,
    targetUser,
    targetGroup,
  });
});

app.post('/api/admin/restore', (req, res) => {
  const { json } = req.body;
  if (!json) return res.status(400).json({ error: 'Backup fayl mazmuni kiritilmagan' });
  const ok = store.restoreData(typeof json === 'string' ? json : JSON.stringify(json));
  if (!ok) return res.status(400).json({ error: 'Fayl strukturasi mos kelmadi!' });
  res.json({ success: true });
});

app.get('/api/admin/couriers', (req, res) => {
  res.json(store.getCouriers());
});

app.post('/api/admin/couriers', (req, res) => {
  const { full_name, phone, username, password } = req.body;
  if (!full_name || !phone) {
    return res.status(400).json({ error: 'Kuryer ismi va telefoni kiritilishi shart!' });
  }
  const newCourier = store.addCourier(full_name, phone, username, password);
  res.json({ success: true, courier: newCourier });
});

app.post('/api/admin/couriers/update', (req, res) => {
  const { id, full_name, phone, username, password, reset_credentials } = req.body;
  if (!id) return res.status(400).json({ error: 'Courier ID talab qilinadi' });
  const updated = store.updateCourier(id, { full_name, phone, username, password, reset_credentials });
  if (!updated) return res.status(404).json({ error: 'Kuryer topilmadi' });
  res.json({ success: true, courier: updated });
});

app.post('/api/admin/couriers/delete', (req, res) => {
  const { id } = req.body;
  store.deleteCourier(id);
  res.json({ success: true });
});

// Waiters API
app.get('/api/admin/waiters', (req, res) => {
  res.json(store.getWaiters());
});

app.post('/api/admin/waiters', (req, res) => {
  const { full_name, phone, username, password } = req.body;
  if (!full_name || !phone) {
    return res.status(400).json({ error: 'Ofitsiant ismi va telefoni kiritilishi shart!' });
  }
  const newWaiter = store.addWaiter(full_name, phone, username, password);
  res.json({ success: true, waiter: newWaiter });
});

app.post('/api/admin/waiters/update', (req, res) => {
  const { id, full_name, phone, username, password, reset_credentials } = req.body;
  if (!id) return res.status(400).json({ error: 'Waiter ID talab qilinadi' });
  const updated = store.updateWaiter(id, { full_name, phone, username, password, reset_credentials });
  if (!updated) return res.status(404).json({ error: 'Ofitsiant topilmadi' });
  res.json({ success: true, waiter: updated });
});

app.post('/api/admin/waiters/delete', (req, res) => {
  const { id } = req.body;
  store.deleteWaiter(id);
  res.json({ success: true });
});

app.get('/api/admin/orders', (req, res) => {
  res.json(store.getOrders());
});

app.get('/api/admin/settings', (req, res) => {
  res.json(store.getSettings());
});

app.post('/api/admin/settings', (req, res) => {
  const updated = store.updateSettings(req.body);
  res.json({ success: true, settings: updated });
});

app.post('/api/admin/orders/create-manual', (req, res) => {
  const { user_name, user_phone, address, note, items, total_amount, courier_id } = req.body;
  if (!user_name || !user_phone || !address) {
    return res.status(400).json({ error: 'Mijoz ismi, telefoni va manzili kiritilishi shart' });
  }

  let user = store.getUsers().find((u) => u.phone === user_phone);
  if (!user) {
    const userId = Math.floor(10000000 + Math.random() * 90000000);
    user = store.syncUser({
      id: userId,
      full_name: user_name,
      phone: user_phone,
    });
  }

  const newOrder = store.createOrder({
    user_id: user.id,
    user_name: user.full_name || user_name,
    items: items || [],
    total_amount: Number(total_amount || 0),
    delivery_fee: 15000,
    discount_amount: 0,
    address,
    note,
    payment_method: 'cash',
  });

  if (courier_id) {
    store.assignCourierToOrder(newOrder.id, courier_id);
  }

  res.json({ success: true, order: newOrder });
});

app.post('/api/admin/orders/update-items', (req, res) => {
  const { order_id, items, total_amount } = req.body;
  const orderId = Number(order_id);
  const orders = store.getOrders();
  const order = orders.find((o) => o.id === orderId);

  if (!order) return res.status(404).json({ error: 'Buyurtma topilmadi' });

  order.items = items || [];
  order.total_amount = Number(total_amount || 0);
  store.saveData();

  res.json({ success: true, order });
});

app.post('/api/orders/create', (req, res) => {
  const { user_id, user_name, items, total_amount, delivery_fee, discount_amount, promo_code, address, note, payment_method, payment_receipt_url } = req.body;
  if (!user_id || !items || !items.length || !total_amount) {
    return res.status(400).json({ error: 'Buyurtma ma\'lumotlari to\'liq emas!' });
  }

  const newOrder = store.createOrder({
    user_id: Number(user_id),
    user_name: user_name || 'Xaridor',
    items,
    total_amount: Number(total_amount),
    delivery_fee: Number(delivery_fee || 0),
    discount_amount: Number(discount_amount || 0),
    promo_code,
    address: address || 'Manzil berilmadi',
    note,
    payment_method,
    payment_receipt_url,
  });

  // Notify admin payment group
  const adminGroup = store.getSettings().payment_group_id;
  const sysSettings = store.getSettings();
  const alertMsg =
    `🔔 <b>YANGI BUYURTMA #${newOrder.id}</b>\n\n` +
    `👤 Xaridor: <b>${newOrder.user_name}</b>\n` +
    `📞 Tel: <code>${newOrder.user_phone}</code>\n` +
    `💰 Summa: <b>${newOrder.total_amount.toLocaleString()} so'm</b>\n` +
    `💳 To'lov: <b>${newOrder.payment_method.toUpperCase()}</b> (${newOrder.payment_status})\n` +
    `📍 Manzil: ${newOrder.address}\n` +
    (newOrder.payment_receipt_url ? `📎 <b>Chek fayli biriktirilgan!</b>` : '');

  sendTelegramMessage(adminGroup, alertMsg);

  res.json({ success: true, order: newOrder });
});

app.post('/api/admin/orders/confirm-payment', (req, res) => {
  const { order_id } = req.body;
  const updated = store.confirmPayment(Number(order_id));
  if (!updated) return res.status(404).json({ error: 'Buyurtma topilmadi' });

  // Send message to Telegram customer
  sendTelegramMessage(
    updated.user_id,
    `✅ <b>To'lovingiz tasdiqlandi!</b>\n\nBuyurtmangiz <b>#${updated.id}</b> bo'yicha to'lov qabul qilindi. Taom tayyorlanmoqda! 🍔`
  );

  res.json({ success: true, order: updated });
});

app.post('/api/admin/orders/reject-payment', (req, res) => {
  const { order_id, reason } = req.body;
  const updated = store.rejectPayment(Number(order_id), reason);
  if (!updated) return res.status(404).json({ error: 'Buyurtma topilmadi' });

  sendTelegramMessage(
    updated.user_id,
    `❌ <b>To'lov rad etildi!</b>\n\nBuyurtma <b>#${updated.id}</b> bo'yicha to'lov cheki tasdiqlanmadi.\nIzoh: <i>${reason || 'To\'lov summasi mos kelmadi'}</i>`
  );

  res.json({ success: true, order: updated });
});

app.post('/api/admin/orders/assign', (req, res) => {
  const { order_id, courier_id } = req.body;
  if (!order_id || !courier_id) {
    return res.status(400).json({ error: 'Order ID va Courier ID talab qilinadi' });
  }

  const updated = store.assignCourierToOrder(Number(order_id), courier_id);
  if (!updated) {
    return res.status(404).json({ error: 'Buyurtma yoki kuryer topilmadi' });
  }

  sendTelegramMessage(
    updated.user_id,
    `🚗 <b>Buyurtmangiz Kuryerga topshirildi!</b>\n\n` +
      `Kuryer: <b>${updated.courier_name}</b>\n` +
      `Telefon: <code>${updated.courier_phone}</code>\n` +
      `Buyurtma raqami: <b>#${updated.id}</b>`
  );

  res.json({ success: true, order: updated });
});

app.post('/api/admin/orders/status', (req, res) => {
  const { order_id, status } = req.body;
  const updated = store.updateOrderStatus(Number(order_id), status);
  if (!updated) {
    return res.status(404).json({ error: 'Buyurtma topilmadi' });
  }

  res.json({ success: true, order: updated });
});

app.post('/api/admin/orders/cancel', (req, res) => {
  const { order_id } = req.body;
  const numId = Number(order_id);
  store.updateOrderStatus(numId, 'cancelled');
  store.deleteOrder(numId);
  res.json({ success: true, message: 'Buyurtma bekor qilindi va o\'chirildi' });
});

app.get('/api/admin/menu', (req, res) => {
  res.json({
    categories: store.getCategories(),
    products: store.getProducts(),
  });
});

app.post('/api/admin/categories', (req, res) => {
  const { name, emoji, icon } = req.body;
  if (!name) return res.status(400).json({ error: 'Kategoriya nomi kiritilishi shart' });
  const cat = store.addCategory(name, emoji || icon);
  res.json({ success: true, category: cat });
});

app.post('/api/admin/categories/update', (req, res) => {
  const { id, name, emoji, icon } = req.body;
  if (!id) return res.status(400).json({ error: 'Category ID talab qilinadi' });
  const cat = store.updateCategory(Number(id), name, emoji || icon);
  res.json({ success: true, category: cat });
});

app.post('/api/admin/categories/delete', (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'Category ID talab qilinadi' });
  store.deleteCategory(Number(id));
  res.json({ success: true });
});

app.post('/api/admin/products', (req, res) => {
  const { category_id, name, description, price, photo_url } = req.body;
  if (!name || !price || !category_id) {
    return res.status(400).json({ error: 'Majburiy maydonlar kiritilmadi' });
  }
  const prod = store.addProduct({
    category_id: Number(category_id),
    name,
    description: description || '',
    price: Number(price),
    photo_url: photo_url || 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80',
    is_active: true,
  });
  res.json({ success: true, product: prod });
});

app.post('/api/admin/products/update', (req, res) => {
  const { id, category_id, name, description, price, photo_url, is_active } = req.body;
  if (!id) return res.status(400).json({ error: 'Product ID talab qilinadi' });
  const prod = store.updateProduct(Number(id), {
    category_id: category_id ? Number(category_id) : undefined,
    name,
    description,
    price: price !== undefined ? Number(price) : undefined,
    photo_url,
    is_active,
  });
  if (!prod) return res.status(404).json({ error: 'Mahsulot topilmadi' });
  res.json({ success: true, product: prod });
});

app.post('/api/admin/products/delete', (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'Product ID talab qilinadi' });
  store.deleteProduct(Number(id));
  res.json({ success: true });
});

app.post('/api/admin/products/toggle', (req, res) => {
  const { product_id } = req.body;
  const prod = store.toggleProduct(Number(product_id));
  res.json({ success: true, product: prod });
});

app.get('/api/admin/promos', (req, res) => {
  res.json(store.getPromos());
});

app.post('/api/admin/promos', async (req, res) => {
  const { code, discount_type, discount_value, max_uses, expires_at, broadcast } = req.body;
  if (!code || !discount_value) {
    return res.status(400).json({ error: 'Promo kodi va chegirma qiymati kiritilishi shart' });
  }
  const newPromo = store.addPromo({
    code: code.toUpperCase(),
    discount_type: discount_type || 'fixed',
    discount_value: Number(discount_value),
    max_uses: max_uses ? Number(max_uses) : undefined,
    expires_at: expires_at || '2026-12-31',
    is_active: true,
  });

  // Broadcast to Channel -1003793342397 if requested
  if (broadcast) {
    const channelId = '-1003793342397'; // t.me/kalitlar_kanali
    const discountText = newPromo.discount_type === 'percent'
      ? `${newPromo.discount_value}% chegirma`
      : `${newPromo.discount_value.toLocaleString()} so'm chegirma`;
    
    const formattedDate = newPromo.expires_at ? newPromo.expires_at.split('-').reverse().join('.') : 'Cheksiz';

    const channelMessage =
      `✨ <b>Yangi Promo Kod</b>\n\n` +
      `🤖 FastFood\n\n` +
      `<code>${newPromo.code}</code>\n\n` +
      `💎 ${discountText}\n` +
      `👥 0 / ${newPromo.max_uses || 50}\n` +
      `⏳ ${formattedDate}`;

    const botUsername = store.getSettings().bot_username || 'TezLazzat_bot';
    const inlineKeyboard = {
      inline_keyboard: [
        [
          { text: '🤖 Botga o\'tish', url: `https://t.me/${botUsername}` }
        ]
      ]
    };

    await sendTelegramMessage(channelId, channelMessage, inlineKeyboard);
  }

  res.json({ success: true, promo: newPromo });
});

app.post('/api/admin/promos/delete', (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'Promo ID talab qilinadi' });
  store.deletePromo(Number(id));
  res.json({ success: true });
});

app.post('/api/admin/promos/update', (req, res) => {
  const { id, code, discount_type, discount_value, max_uses, expires_at, is_active } = req.body;
  if (!id) return res.status(400).json({ error: 'Promo ID talab qilinadi' });
  const updated = store.updatePromo(Number(id), {
    code,
    discount_type,
    discount_value,
    max_uses,
    expires_at,
    is_active,
  });
  res.json({ success: true, promo: updated });
});

app.post('/api/admin/tables/delete', (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'Table ID talab qilinadi' });
  store.deleteTable(Number(id));
  res.json({ success: true });
});

app.post('/api/admin/tables/update', (req, res) => {
  const { id, name, seats, location } = req.body;
  if (!id) return res.status(400).json({ error: 'Table ID talab qilinadi' });
  const updated = store.updateTable(Number(id), { name, seats, location });
  res.json({ success: true, table: updated });
});

// User & Loyalty API
app.get('/api/user/orders/:userId', (req, res) => {
  const userId = Number(req.params.userId);
  res.json(store.getUserOrders(userId));
});

app.post('/api/bot/sync-user', (req, res) => {
  const user = store.syncUser(req.body);
  res.json({ success: true, user });
});

app.post('/api/admin/users/reset-loyalty', (req, res) => {
  const { user_id } = req.body;
  const user = store.resetUserLoyalty(Number(user_id));
  if (!user) return res.status(404).json({ error: 'Mijoz topilmadi' });

  sendTelegramMessage(
    user.id,
    `🎁 <b>SOVG'ANGIZ TASHDIQLANDI!</b>\n\nRestoran tomonidan loyalty sovg'angiz berildi. Yangi muhrlar to'plash uchun xaridlarni davom ettiring!`
  );

  res.json({ success: true, user });
});

app.post('/api/promo/validate', (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: 'Promo kod kiritilishi shart' });
  const result = store.validatePromoCode(code);
  res.json(result);
});

app.get('/api/admin/users', (req, res) => {
  res.json(store.getUsers());
});

app.post('/api/admin/broadcast', async (req, res) => {
  const { text, media_type, media_url, caption } = req.body;
  if (!text && !caption && !media_url) return res.status(400).json({ error: 'Xabar mazmuni talab qilinadi' });

  const users = store.getUsers();
  let successCount = 0;
  const msgContent = caption || text || '';

  for (const u of users) {
    let ok = false;
    if (media_type === 'photo' && media_url) {
      ok = await sendTelegramPhoto(u.id, media_url, msgContent);
    } else if (media_type === 'video' && media_url) {
      ok = await sendTelegramVideo(u.id, media_url, msgContent);
    } else if (media_type === 'document' && media_url) {
      ok = await sendTelegramDocument(u.id, media_url, msgContent);
    } else {
      ok = await sendTelegramMessage(u.id, msgContent);
    }
    if (ok) successCount++;
  }

  res.json({ success: true, total: users.length, sent: successCount });
});

// =======================
// COURIER API ENDPOINTS
// =======================

app.get('/api/courier/profile/:id', (req, res) => {
  const courierId = req.params.id;
  const couriers = store.getCouriers();
  const courier = couriers.find((c) => c.id === courierId);
  if (!courier) {
    return res.status(404).json({ error: 'Kuryer topilmadi' });
  }
  res.json(courier);
});

app.get('/api/courier/orders/:courierId', (req, res) => {
  const { courierId } = req.params;
  const allOrders = store.getOrders();
  const courierOrders = allOrders.filter((o) => o.courier_id === courierId);
  res.json(courierOrders);
});

app.post('/api/courier/status', (req, res) => {
  const { courier_id, is_online } = req.body;
  const updated = store.updateCourierStatus(courier_id, is_online);
  res.json({ success: true, courier: updated });
});

app.post('/api/courier/orders/:id/deliver', async (req, res) => {
  const orderId = Number(req.params.id);
  const updatedOrder = store.updateOrderStatus(orderId, 'delivered');

  if (!updatedOrder) {
    return res.status(404).json({ error: 'Buyurtma topilmadi' });
  }

  const customerMessage =
    `📦 <b>Buyurtmangiz yetkazildi!</b>\n\n` +
    `Buyurtmangiz kuryer <b>${updatedOrder.courier_name}</b> tomonidan manzilga yetkazildi.\n` +
    `Bu amalni tasdiqlab kuryerni baholang:`;

  const inlineKeyboard = {
    inline_keyboard: [
      [
        { text: '✅ Buyurtmani tasdiqlash', callback_data: `confirm_del:${orderId}` }
      ],
      [
        { text: '❌ Buyurtma kelmadi', callback_data: `not_del:${orderId}` }
      ]
    ]
  };

  const telegramSent = await sendTelegramMessage(updatedOrder.user_id, customerMessage, inlineKeyboard);

  res.json({
    success: true,
    order: updatedOrder,
    telegramSent,
  });
});

app.post('/api/bot/delivery-response', async (req, res) => {
  const { action, order_id, stars, comment } = req.body;
  const orderId = Number(order_id);
  const order = store.getOrders().find((o) => o.id === orderId);

  if (!order) return res.status(404).json({ error: 'Buyurtma topilmadi' });

  if (action === 'confirm') {
    return res.json({ success: true, message: 'Rating requested' });
  }

  if (action === 'rate') {
    const starCount = Number(stars) || 5;
    order.rating = starCount;
    order.rating_comment = comment || '';
    store.updateOrderStatus(orderId, 'completed');

    if (order.courier_id) {
      store.rateCourier(order.courier_id, starCount);
    }

    return res.json({
      success: true,
      message: `Rahmat! Bahoyingiz qabul qilindi (${starCount}/5 ⭐).`,
    });
  }

  if (action === 'not_delivered') {
    store.updateOrderStatus(orderId, 'disputed');
    let penaltyCount = 0;
    if (order.courier_id) {
      const courier = store.addCourierPenalty(order.courier_id, order.user_id);
      penaltyCount = courier?.penalties || 1;
    }

    const sysSettings = store.getSettings();
    const compensationAmount = sysSettings.courier_penalty_compensation || 15000;

    // Notify user of compensation discount/bonus
    await sendTelegramMessage(
      order.user_id,
      `⚠️ <b>Kuryerimiz xatosi uchun uzr so'raymiz!</b>\n\nKuryerga jarima bali berildi. Sizning balansingizga <b>${compensationAmount.toLocaleString()} so'm</b> kompensatsiya bonusi qo'shildi!`
    );

    const adminGroup = store.getSettings().payment_group_id;
    const alertMessage =
      `⚠️ <b>DIQQAT! BUYURTMA KELMAGANLIGI HAQIDA SHIKOYAT!</b>\n\n` +
      `📦 Buyurtma raqami: <b>#${order.id}</b>\n` +
      `👤 Mijoz: <b>${order.user_name}</b> (<code>${order.user_phone}</code>)\n` +
      `🚗 Kuryer: <b>${order.courier_name}</b> (ID: <code>${order.courier_id}</code>)\n` +
      `❌ Kuryerga +1 jarima bali berildi! Jami jarima: <b>${penaltyCount}</b>\n` +
      `💸 Mijozga <b>${compensationAmount.toLocaleString()} so'm</b> kompensatsiya berildi.`;

    await sendTelegramMessage(adminGroup, alertMessage);

    return res.json({
      success: true,
      message: 'Kuryerga jarima bali berildi va mijozga kompensatsiya ajratildi.',
    });
  }

  res.json({ success: false });
});

// =======================
// VITE / STATIC SERVING
// =======================

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}

app.use((err: any, req: any, res: any, next: any) => {
  console.error('XATO:', err);
  res.status(500).json({ error: String(err?.message || err), stack: err?.stack });
});

// Umumiy xato ushlagich: stack ni klientga chiqarmaydi
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[server error]', err);
  if (res.headersSent) return next(err);
  res.status(500).json({ error: 'Serverda ichki xatolik yuz berdi' });
});

export default app;
