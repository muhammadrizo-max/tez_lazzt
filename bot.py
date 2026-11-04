import os
import html
import asyncio
import logging
from datetime import datetime, timezone
from typing import Optional

import aiohttp
from dotenv import load_dotenv

from aiogram import Bot, Dispatcher, Router, F
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode
from aiogram.filters import Command, CommandStart, StateFilter
from aiogram.filters.command import CommandObject
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import StatesGroup, State
from aiogram.fsm.storage.memory import MemoryStorage
from aiogram.types import (
    Message,
    CallbackQuery,
    KeyboardButton,
    ReplyKeyboardMarkup,
    ReplyKeyboardRemove,
    InlineKeyboardButton,
    InlineKeyboardMarkup,
)

# =========================
# CONFIGURATION
# =========================

load_dotenv()

logging.basicConfig(level=logging.INFO)

RESTAURANT_NAME = os.getenv("RESTAURANT_NAME", "TezLazzat")
BOT_TOKEN = os.getenv("BOT_TOKEN", "8285627712:AAFaKdJvAVpvWCb2sfkrNU6gZiKVpX6uqk4")
BACKEND_API_URL = os.getenv("BACKEND_API_URL", "http://localhost:3000/api")

DELIVERY_FEE = int(os.getenv("DELIVERY_FEE", "15000"))
FREE_DELIVERY_FROM = int(os.getenv("FREE_DELIVERY_FROM", "100000"))
REFERRAL_BONUS = int(os.getenv("REFERRAL_BONUS", "10000"))
REQUIRED_CHANNEL = "-1003793342397"  # @kalitlar_kanali

# =========================
# IN-MEMORY CARTS & FAVORITES & SESSIONS
# =========================

class Cart:
    def __init__(self):
        self.items: dict[int, dict] = {}
        self.discount_amount: int = 0
        self.promo_code: Optional[str] = None

    def add(self, pid: int, name: str, price: int, qty: int = 1):
        if pid in self.items:
            self.items[pid]["quantity"] += qty
        else:
            self.items[pid] = {
                "id": pid,
                "name": name,
                "price": int(price),
                "quantity": int(qty),
            }

    def remove(self, pid: int):
        self.items.pop(pid, None)

    def subtotal(self) -> int:
        return sum(i["price"] * i["quantity"] for i in self.items.values())

    def total(self) -> int:
        st = self.subtotal()
        return max(0, st - self.discount_amount)

    def total_items_count(self) -> int:
        return sum(i["quantity"] for i in self.items.values())

    def is_empty(self) -> bool:
        return not bool(self.items)

    def clear(self):
        self.items.clear()
        self.discount_amount = 0
        self.promo_code = None

    def to_text(self) -> str:
        if self.is_empty():
            return "🛒 Savatchangiz hozircha bo'sh."

        lines = ["🛒 <b>Savatchangiz:</b>\n"]
        for index, item in enumerate(self.items.values(), start=1):
            subtotal = item["price"] * item["quantity"]
            lines.append(f"{index}. {html.escape(item['name'])} × {item['quantity']} = <b>{subtotal:,} so'm</b>")

        st = self.subtotal()
        lines.append(f"\n💵 Mahsulotlar summasi: <b>{st:,} so'm</b>")
        if self.discount_amount > 0:
            lines.append(f"🎟 Chegirma ({self.promo_code}): <b>-{self.discount_amount:,} so'm</b>")
            lines.append(f"💰 Yakuniy summa: <b>{self.total():,} so'm</b>")

        if self.total_items_count() >= 2:
            lines.append("🎁 <i>Ushbu buyurtmada kamida 2 ta taom borligi uchun Loyalty kartangizga +1 muhr qo'shiladi!</i>")

        return "\n".join(lines)

user_carts: dict[int, Cart] = {}
user_favorites: dict[int, set[int]] = {}
courier_sessions: dict[int, dict] = {}  # telegram_user_id -> courier_info

def get_cart(user_id: int) -> Cart:
    if user_id not in user_carts:
        user_carts[user_id] = Cart()
    return user_carts[user_id]

def get_favorites(user_id: int) -> set[int]:
    if user_id not in user_favorites:
        user_favorites[user_id] = set()
    return user_favorites[user_id]

async def check_channel_subscription(bot: Bot, user_id: int) -> bool:
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(f"{BACKEND_API_URL}/admin/settings") as resp:
                settings = await resp.json()
        
        mode = settings.get("required_channel_mode", "all")
        if mode == "off":
            return True

        # If mode is guests, check if user is already registered
        if mode == "guests":
            async with aiohttp.ClientSession() as session:
                async with session.get(f"{BACKEND_API_URL}/admin/users") as resp:
                    users = await resp.json()
                    u = next((usr for usr in users if usr["id"] == user_id), None)
                    if u and u.get("phone"):
                        return True # Registered users bypass guest channel sub requirement

        channel_id = settings.get("required_channel", REQUIRED_CHANNEL)
        member = await bot.get_chat_member(chat_id=channel_id, user_id=user_id)
        return member.status in ["creator", "administrator", "member"]
    except Exception as e:
        logging.warning(f"Failed channel check for user {user_id}: {e}")
        return True  # fallback if channel API restriction or error

# =========================
# FSM STATES
# =========================

class RegisterState(StatesGroup):
    waiting_name = State()
    waiting_phone = State()

class PromoUserState(StatesGroup):
    waiting_code = State()

class CourierLoginState(StatesGroup):
    waiting_username = State()
    waiting_password = State()

class CheckoutState(StatesGroup):
    waiting_location = State()
    waiting_note = State()
    waiting_payment = State()
    waiting_receipt = State()

# =========================
# KEYBOARDS
# =========================

def main_menu_kb(user_id: int = 0) -> ReplyKeyboardMarkup:
    is_courier = user_id in courier_sessions
    rows = [
        [KeyboardButton(text="🍔 Menyu"), KeyboardButton(text="🛒 Savatcha")],
        [KeyboardButton(text="🎁 Loyalty Karta"), KeyboardButton(text="📦 Buyurtmalarim")],
        [KeyboardButton(text="❤️ Sevimlilar"), KeyboardButton(text="🎟 Promo kod")],
        [KeyboardButton(text="👤 Profilim")],
    ]
    if is_courier:
        rows.append([KeyboardButton(text="🛵 Kuryer Paneli")])
    else:
        rows.append([KeyboardButton(text="🛵 Kuryer Kirishi")])

    return ReplyKeyboardMarkup(keyboard=rows, resize_keyboard=True)

def courier_menu_kb() -> ReplyKeyboardMarkup:
    return ReplyKeyboardMarkup(
        keyboard=[
            [KeyboardButton(text="📋 Biriktirilgan buyurtmalar"), KeyboardButton(text="🔄 Statusni yangilash")],
            [KeyboardButton(text="🔙 Asosiy Menyu"), KeyboardButton(text="🚪 Kuryerdan Chiqish")],
        ],
        resize_keyboard=True,
    )

def phone_kb() -> ReplyKeyboardMarkup:
    return ReplyKeyboardMarkup(
        keyboard=[[KeyboardButton(text="📱 Telefon raqamni yuborish", request_contact=True)]],
        resize_keyboard=True,
        one_time_keyboard=True,
    )

def location_kb() -> ReplyKeyboardMarkup:
    return ReplyKeyboardMarkup(
        keyboard=[
            [KeyboardButton(text="📍 Lokatsiya yuborish", request_location=True)],
            [KeyboardButton(text="❌ Bekor qilish")],
        ],
        resize_keyboard=True,
    )

def skip_note_kb() -> ReplyKeyboardMarkup:
    return ReplyKeyboardMarkup(
        keyboard=[
            [KeyboardButton(text="O'tkazib yuborish")],
            [KeyboardButton(text="❌ Bekor qilish")],
        ],
        resize_keyboard=True,
    )

def payment_kb() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(text="💵 Naqd pul (Kuryerdan beriladi)", callback_data="pay:cash")],
            [
                InlineKeyboardButton(text="💳 Click (Online Chek)", callback_data="pay:click"),
                InlineKeyboardButton(text="💳 Payme (Online Chek)", callback_data="pay:payme"),
            ],
        ]
    )

def channel_sub_kb(channel_url: str = "https://t.me/kalitlar_kanali") -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(text="📢 Kanalga a'zo bo'lish", url=channel_url)],
            [InlineKeyboardButton(text="✅ Tekshirish", callback_data="check_sub")],
        ]
    )

def delivery_confirm_kb(order_id: int, courier_name: str) -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(text="✅ Ha, qabul qildim", callback_data=f"confirm_del:{order_id}")],
            [InlineKeyboardButton(text="⚠️ Buyurtma kelmadi!", callback_data=f"not_del:{order_id}")],
        ]
    )

def rating_stars_kb(order_id: int) -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(text="⭐ 1", callback_data=f"rate_cur:{order_id}:1"),
                InlineKeyboardButton(text="⭐ 2", callback_data=f"rate_cur:{order_id}:2"),
                InlineKeyboardButton(text="⭐ 3", callback_data=f"rate_cur:{order_id}:3"),
                InlineKeyboardButton(text="⭐ 4", callback_data=f"rate_cur:{order_id}:4"),
                InlineKeyboardButton(text="⭐ 5", callback_data=f"rate_cur:{order_id}:5"),
            ]
        ]
    )

# =========================
# ROUTER
# =========================

user_router = Router()

# 1. START & REGISTRATION
@user_router.message(CommandStart())
async def start_handler(message: Message, state: FSMContext, command: CommandObject):
    await state.clear()
    ref_code = command.args if command and command.args else None

    db_user = None
    # Sync user with backend
    async with aiohttp.ClientSession() as session:
        try:
            payload = {
                "id": message.from_user.id,
                "full_name": message.from_user.full_name,
                "username": message.from_user.username,
                "ref_by": ref_code,
            }
            async with session.post(f"{BACKEND_API_URL}/bot/sync-user", json=payload) as resp:
                res_json = await resp.json()
                db_user = res_json.get("user")
        except Exception as e:
            logging.error(f"User sync error: {e}")

    # Check if user is already registered (has phone)
    if db_user and db_user.get("phone"):
        await message.answer(
            f"👋 Qaytganingizdan xursandmiz, <b>{html.escape(db_user.get('full_name', message.from_user.full_name))}</b>!\n\n"
            f"<b>{html.escape(RESTAURANT_NAME)}</b> fast-food botiga xush kelibsiz.\n"
            f"🍔 Kerakli bo'limni tanlang:",
            reply_markup=main_menu_kb(message.from_user.id),
        )
        return

    # If new user or no phone registered yet
    await message.answer(
        f"👋 Assalomu alaykum, <b>{html.escape(message.from_user.full_name)}</b>!\n\n"
        f"<b>{html.escape(RESTAURANT_NAME)}</b> fast-food botiga xush kelibsiz.\n\n"
        f"Iltimos, botdan to'liq foydalanish uchun ismingizni kiriting:",
        reply_markup=ReplyKeyboardRemove(),
    )
    await state.set_state(RegisterState.waiting_name)

@user_router.message(StateFilter(RegisterState.waiting_name))
async def register_name_handler(message: Message, state: FSMContext):
    name = (message.text or "").strip()
    if len(name) < 2:
        await message.answer("Iltimos, ismingizni to'g'ri kiriting:")
        return

    await state.update_data(full_name=name)
    await state.set_state(RegisterState.waiting_phone)
    await message.answer(
        "📱 Endi telefon raqamingizni pastdagi tugma orqali yuboring:",
        reply_markup=phone_kb(),
    )

@user_router.message(StateFilter(RegisterState.waiting_phone), F.contact)
async def register_phone_contact_handler(message: Message, state: FSMContext):
    data = await state.get_data()
    full_name = data.get("full_name")
    phone = message.contact.phone_number

    async with aiohttp.ClientSession() as session:
        try:
            payload = {
                "id": message.from_user.id,
                "full_name": full_name,
                "username": message.from_user.username,
                "phone": phone,
            }
            await session.post(f"{BACKEND_API_URL}/bot/sync-user", json=payload)
        except Exception as e:
            logging.error(f"User sync error: {e}")

    await state.clear()
    await message.answer(
        f"✅ Rahmat, <b>{html.escape(full_name)}</b>! Muvaffaqiyatli ro'yxatdan o'tdingiz.\n\n"
        f"🍔 Kerakli bo'limni tanlang:",
        reply_markup=main_menu_kb(message.from_user.id),
    )

@user_router.message(StateFilter(RegisterState.waiting_phone), F.text)
async def register_phone_text_handler(message: Message, state: FSMContext):
    phone = message.text.strip()
    if len(phone) < 7:
        await message.answer("Iltimos, to'g'ri telefon raqam kiriting:")
        return

    data = await state.get_data()
    full_name = data.get("full_name")

    async with aiohttp.ClientSession() as session:
        try:
            payload = {
                "id": message.from_user.id,
                "full_name": full_name,
                "username": message.from_user.username,
                "phone": phone,
            }
            await session.post(f"{BACKEND_API_URL}/bot/sync-user", json=payload)
        except Exception as e:
            logging.error(f"User sync error: {e}")

    await state.clear()
    await message.answer(
        f"✅ Rahmat, <b>{html.escape(full_name)}</b>! Muvaffaqiyatli ro'yxatdan o'tdingiz.\n\n"
        f"🍔 Kerakli bo'limni tanlang:",
        reply_markup=main_menu_kb(message.from_user.id),
    )

# 2. LOYALTY CARD VIEW
@user_router.message(F.text == "🎁 Loyalty Karta")
async def show_loyalty_card(message: Message):
    async with aiohttp.ClientSession() as session:
        try:
            async with session.get(f"{BACKEND_API_URL}/admin/settings") as resp:
                settings = await resp.json()
        except Exception:
            settings = {}

        try:
            async with session.get(f"{BACKEND_API_URL}/admin/users") as resp:
                users = await resp.json()
                user = next((u for u in users if u["id"] == message.from_user.id), None)
        except Exception as e:
            logging.error(f"Failed to fetch user loyalty: {e}")
            user = None

    loyalty_enabled = settings.get("loyalty_enabled", True)
    if not loyalty_enabled:
        await message.answer(
            "🎁 <b>Loyalty Sadoqat Tizimi</b>\n\n"
            "Hozirda loyalty karta tizimi vaqtincha to'xtatilgan. Sizning ilgari to'plagan muhrlaringiz va natijalaringiz xavfsiz saqlanmoqda!",
            reply_markup=main_menu_kb(message.from_user.id),
        )
        return

    stamps = user.get("loyalty_stamps", 0) if user else 0
    target = settings.get("loyalty_target_stamps", 6)
    prize_desc = settings.get("loyalty_prize_description", "Bepul Combo Set va Ichimlik 🎁")
    is_full = user.get("is_loyalty_full", False) if user else False

    stamps_str = " ".join(["🟢" if i < stamps else "⚪" for i in range(target)])

    msg = (
        f"💳 <b>LOYALTY SADOQAT KARTANGIZ</b>\n\n"
        f"Holat: [ {stamps_str} ] ({stamps} / {target})\n\n"
        f"📌 <b>Muhr olish qoidasi:</b>\n"
        f"Bitta buyurtmada kamida <b>2 ta taom</b> xarid qilganingizda kartangizga +1 ta muhr qo'shiladi.\n\n"
        f"🎁 <b>Mukofot:</b> {html.escape(prize_desc)}"
    )

    if is_full:
        msg += f"\n\n🎉 <b>TABRIKLAYMIZ! Kartangiz to'liq to'ldi!</b> Adminlarimiz tez orada sizga mukofotingizni ({html.escape(prize_desc)}) taqdim etishadi."

    await message.answer(msg, reply_markup=main_menu_kb(message.from_user.id))

# 3. MENU & CATEGORIES
@user_router.message(F.text == "🍔 Menyu")
async def show_menu(message: Message):
    async with aiohttp.ClientSession() as session:
        try:
            async with session.get(f"{BACKEND_API_URL}/admin/menu") as resp:
                data = await resp.json()
                categories = data.get("categories", [])
        except Exception as e:
            logging.error(f"Failed to fetch menu: {e}")
            categories = [
                {"id": 1, "name": "Burgerlar", "emoji": "🍔"},
                {"id": 2, "name": "Lavashlar", "emoji": "🌯"},
                {"id": 3, "name": "Pitsalar", "emoji": "🍕"},
                {"id": 4, "name": "Ichimliklar", "emoji": "🥤"},
                {"id": 5, "name": "Snoacklar", "emoji": "🍟"},
            ]

    buttons = []
    for c in categories:
        buttons.append([InlineKeyboardButton(text=f"{c.get('emoji', '🍽')} {c['name']}", callback_data=f"cat:{c['id']}")])

    await message.answer("🍔 Kategoriyani tanlang:", reply_markup=InlineKeyboardMarkup(inline_keyboard=buttons))

@user_router.callback_query(F.data.startswith("cat:"))
async def show_category_products(callback: CallbackQuery):
    cat_id = int(callback.data.split(":")[1])
    async with aiohttp.ClientSession() as session:
        try:
            async with session.get(f"{BACKEND_API_URL}/admin/menu") as resp:
                data = await resp.json()
                products = [p for p in data.get("products", []) if p["category_id"] == cat_id and p.get("is_active", True)]
        except Exception:
            products = []

    await callback.answer()
    if not products:
        await callback.message.answer("Ushbu kategoriyada mahsulotlar hozircha yo'q.")
        return

    favs = get_favorites(callback.from_user.id)
    for p in products:
        is_fav = p["id"] in favs
        fav_icon = "❤️" if is_fav else "🤍"
        caption = (
            f"<b>{html.escape(p['name'])}</b>\n\n"
            f"{html.escape(p.get('description', ''))}\n\n"
            f"💰 Narx: <b>{p['price']:,} so'm</b>"
        )
        kb = InlineKeyboardMarkup(
            inline_keyboard=[
                [
                    InlineKeyboardButton(text="🛒 Savatga qo'shish", callback_data=f"add_cart:{p['id']}:{p['name']}:{p['price']}"),
                    InlineKeyboardButton(text=f"{fav_icon} Sevimlim", callback_data=f"toggle_fav:{p['id']}"),
                ]
            ]
        )
        if p.get("photo_url"):
            await callback.message.answer_photo(p["photo_url"], caption=caption, reply_markup=kb)
        else:
            await callback.message.answer(caption, reply_markup=kb)

@user_router.callback_query(F.data.startswith("toggle_fav:"))
async def toggle_favorite_handler(callback: CallbackQuery):
    pid = int(callback.data.split(":")[1])
    favs = get_favorites(callback.from_user.id)
    if pid in favs:
        favs.remove(pid)
        await callback.answer("Sevimlilardan olib tashlandi 💔", show_alert=False)
    else:
        favs.add(pid)
        await callback.answer("Sevimlilarga qo'shildi ❤️", show_alert=False)

@user_router.callback_query(F.data.startswith("add_cart:"))
async def add_cart_handler(callback: CallbackQuery):
    parts = callback.data.split(":")
    pid = int(parts[1])
    name = parts[2]
    price = int(parts[3])

    cart = get_cart(callback.from_user.id)
    cart.add(pid, name, price, 1)

    await callback.answer("✅ Savatga qo'shildi!", show_alert=False)
    await callback.message.answer(f"✅ <b>{html.escape(name)}</b> savatchangizga qo'shildi.")

# 4. CART & CHECKOUT
@user_router.message(F.text == "🛒 Savatcha")
async def show_cart(message: Message):
    cart = get_cart(message.from_user.id)
    kb = InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(text="✅ Buyurtma berish", callback_data="checkout_start")],
            [InlineKeyboardButton(text="🧹 Savatni tozalash", callback_data="cart_clear")],
        ]
    ) if not cart.is_empty() else None

    await message.answer(cart.to_text(), reply_markup=kb)

@user_router.callback_query(F.data == "cart_clear")
async def clear_cart_handler(callback: CallbackQuery):
    cart = get_cart(callback.from_user.id)
    cart.clear()
    await callback.answer("Savatcha tozalandi")
    await callback.message.edit_text("🛒 Savatchangiz tozalab tashlandi.")

@user_router.callback_query(F.data == "checkout_start")
async def checkout_start(callback: CallbackQuery, state: FSMContext):
    cart = get_cart(callback.from_user.id)
    if cart.is_empty():
        await callback.answer("Savatchingiz bo'sh!", show_alert=True)
        return

    await state.set_state(CheckoutState.waiting_location)
    await callback.answer()
    await callback.message.answer(
        "📍 Yetkazib berish manzilini yuboring (Lokatsiya tugmasini bosing yoki manzilni yozing):",
        reply_markup=location_kb(),
    )

@user_router.message(StateFilter(CheckoutState.waiting_location))
async def location_receive(message: Message, state: FSMContext):
    if message.text == "❌ Bekor qilish":
        await state.clear()
        await message.answer("Buyurtma bekor qilindi.", reply_markup=main_menu_kb(message.from_user.id))
        return

    if message.location:
        address = f"Lokatsiya: {message.location.latitude}, {message.location.longitude}"
    elif message.text:
        address = message.text.strip()
    else:
        await message.answer("Iltimos, manzilni yuboring.")
        return

    await state.update_data(address=address)
    await state.set_state(CheckoutState.waiting_note)
    await message.answer("📝 Kuryer uchun izoh qoldiring yoki 'O'tkazib yuborish' tugmasini bosing:", reply_markup=skip_note_kb())

@user_router.message(StateFilter(CheckoutState.waiting_note))
async def note_receive(message: Message, state: FSMContext):
    if message.text == "❌ Bekor qilish":
        await state.clear()
        await message.answer("Buyurtma bekor qilindi.", reply_markup=main_menu_kb(message.from_user.id))
        return

    note = "" if message.text == "O'tkazib yuborish" else message.text.strip()
    await state.update_data(note=note)
    await state.set_state(CheckoutState.waiting_payment)

    await message.answer("💳 To'lov usulini tanlang:", reply_markup=payment_kb())

@user_router.callback_query(StateFilter(CheckoutState.waiting_payment), F.data.startswith("pay:"))
async def payment_select(callback: CallbackQuery, state: FSMContext):
    pay_method = callback.data.split(":")[1]
    data = await state.get_data()
    cart = get_cart(callback.from_user.id)

    total = cart.total()
    delivery = 0 if total >= FREE_DELIVERY_FROM else DELIVERY_FEE
    grand_total = total + delivery

    await state.update_data(pay_method=pay_method, grand_total=grand_total)

    if pay_method in ["click", "payme"]:
        await state.set_state(CheckoutState.waiting_receipt)
        await callback.answer()
        card_num = "8600 1234 5678 9012"
        await callback.message.answer(
            f"💳 <b>ONLINE TO'LOV M`ALUMOTLARI:</b>\n\n"
            f"Karta raqami: <code>{card_num}</code>\n"
            f"Ega: FastFood TezLazzat\n"
            f"To'lov summasi: <b>{grand_total:,} so'm</b>\n\n"
            f"📥 Iltimos, to'lovni amalga oshirib, <b>chek rasmini yoki faylini</b> ushbu chatga yuboring:",
            reply_markup=ReplyKeyboardRemove(),
        )
        return

    # CASH Payment Flow
    order_id = None
    async with aiohttp.ClientSession() as session:
        try:
            items_list = [
                {"product_id": item["id"], "name": item["name"], "price": item["price"], "quantity": item["quantity"]}
                for item in cart.items.values()
            ]
            payload = {
                "user_id": callback.from_user.id,
                "user_name": callback.from_user.full_name,
                "items": items_list,
                "total_amount": grand_total,
                "delivery_fee": delivery,
                "address": data.get("address", ""),
                "note": data.get("note", ""),
                "payment_method": "cash",
            }
            async with session.post(f"{BACKEND_API_URL}/orders/create", json=payload) as resp:
                res_data = await resp.json()
                if res_data.get("success"):
                    order_id = res_data.get("order", {}).get("id")
        except Exception as e:
            logging.error(f"Failed to submit cash order to API: {e}")

    await callback.answer()
    order_ref = f"#{order_id}" if order_id else "yangi"
    await callback.message.answer(
        f"✅ <b>Buyurtmangiz ({order_ref}) muvaffaqiyatli qabul qilindi!</b>\n\n"
        f"📍 Manzil: {html.escape(data.get('address', ''))}\n"
        f"💳 To'lov usuli: <b>NAQD PUL</b>\n"
        f"💰 Jami summa: <b>{grand_total:,} so'm</b>\n\n"
        f"⏱ Tez orada kuryer tayinlanadi va buyurtmangiz yetkaziladi!",
        reply_markup=main_menu_kb(callback.from_user.id),
    )

    cart.clear()
    await state.clear()

@user_router.message(StateFilter(CheckoutState.waiting_receipt), F.photo | F.document)
async def receipt_file_handler(message: Message, state: FSMContext):
    data = await state.get_data()
    cart = get_cart(message.from_user.id)
    pay_method = data.get("pay_method", "click")
    grand_total = data.get("grand_total", cart.total())

    receipt_url = "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80"
    file_id = None
    if message.photo:
        file_id = message.photo[-1].file_id
    elif message.document:
        file_id = message.document.file_id

    if file_id and BOT_TOKEN:
        try:
            bot_inst = message.bot
            file_info = await bot_inst.get_file(file_id)
            if file_info and file_info.file_path:
                receipt_url = f"https://api.telegram.org/file/bot{BOT_TOKEN}/{file_info.file_path}"
            else:
                receipt_url = f"file_photo_{file_id}"
        except Exception as err:
            logging.error(f"Failed to fetch Telegram file URL: {err}")
            receipt_url = f"file_photo_{file_id}"
    elif file_id:
        receipt_url = f"file_photo_{file_id}"

    order_id = None
    async with aiohttp.ClientSession() as session:
        try:
            items_list = [
                {"product_id": item["id"], "name": item["name"], "price": item["price"], "quantity": item["quantity"]}
                for item in cart.items.values()
            ]
            payload = {
                "user_id": message.from_user.id,
                "user_name": message.from_user.full_name,
                "items": items_list,
                "total_amount": grand_total,
                "address": data.get("address", ""),
                "note": data.get("note", ""),
                "payment_method": pay_method,
                "payment_receipt_url": receipt_url,
            }
            async with session.post(f"{BACKEND_API_URL}/orders/create", json=payload) as resp:
                res_data = await resp.json()
                if res_data.get("success"):
                    order_id = res_data.get("order", {}).get("id")
        except Exception as e:
            logging.error(f"Failed to submit online order with receipt: {e}")

    await state.clear()
    cart.clear()

    order_ref = f"#{order_id}" if order_id else "yangi"
    await message.answer(
        f"✅ <b>Chek qabul qilindi! Buyurtma ({order_ref}) rasmiylashtirildi.</b>\n\n"
        f"💳 To'lov: <b>{pay_method.upper()}</b>\n"
        f"💰 Summa: <b>{grand_total:,} so'm</b>\n\n"
        f"⏳ Adminlarimiz chekni ko'rib tasdiqlashlari bilan sizga xabar yuboriladi!",
        reply_markup=main_menu_kb(message.from_user.id),
    )

# 5. BUYURTMALARIM (User Orders)
@user_router.message(F.text == "📦 Buyurtmalarim")
async def show_user_orders(message: Message):
    async with aiohttp.ClientSession() as session:
        try:
            async with session.get(f"{BACKEND_API_URL}/user/orders/{message.from_user.id}") as resp:
                orders = await resp.json()
        except Exception as e:
            logging.error(f"Failed to fetch user orders: {e}")
            orders = []

    if not orders:
        await message.answer("📦 Sizda hali hech qanday buyurtmalar mavjud emas.")
        return

    msg = "📦 <b>Sizning buyurtmalaringiz:</b>\n\n"
    for o in orders[:5]:
        status_emoji = {
            "pending": "🟡 Kutilmoqda",
            "preparing": "👨‍🍳 Tayyorlanmoqda",
            "on_way": "🛵 Yo'lda",
            "delivered": "✅ Yetkazildi",
            "completed": "🏁 Yakunlandi",
            "cancelled": "❌ Bekor qilingan",
        }.get(o.get("status", "pending"), "🟡 Kutilmoqda")

        items_str = ", ".join([f"{i['product_name']} ({i['quantity']}x)" for i in o.get("items", [])])
        msg += (
            f"<b>Buyurtma #{o['id']}</b> — {status_emoji}\n"
            f"🍔 {items_str}\n"
            f"💰 Summa: <b>{o['total_amount']:,} so'm</b>\n"
            f"💳 To'lov: <b>{o.get('payment_method', 'naqd').upper()}</b> ({o.get('payment_status', 'pending')})\n"
            f"📅 Sana: {o.get('created_at', '')[:16]}\n"
            f"---------------------------\n"
        )

    await message.answer(msg)

# 6. SEVIMLILAR (Favorites)
@user_router.message(F.text == "❤️ Sevimlilar")
async def show_favorites(message: Message):
    favs = get_favorites(message.from_user.id)
    if not favs:
        await message.answer("❤️ Sevimlilar ro'yxatingiz bo'sh. Menyu bo'limidan mahsulotlardagi '❤️ Sevimlim' tugmasini bosing.")
        return

    async with aiohttp.ClientSession() as session:
        try:
            async with session.get(f"{BACKEND_API_URL}/admin/menu") as resp:
                data = await resp.json()
                all_prods = data.get("products", [])
                fav_prods = [p for p in all_prods if p["id"] in favs]
        except Exception:
            fav_prods = []

    if not fav_prods:
        await message.answer("❤️ Sevimli mahsulotlar topilmadi.")
        return

    await message.answer(f"❤️ <b>Sizning sevimli taomlaringiz ({len(fav_prods)} ta):</b>")
    for p in fav_prods:
        caption = f"❤️ <b>{html.escape(p['name'])}</b>\n💰 Narxi: <b>{p['price']:,} so'm</b>"
        kb = InlineKeyboardMarkup(
            inline_keyboard=[
                [
                    InlineKeyboardButton(text="🛒 Savatga qo'shish", callback_data=f"add_cart:{p['id']}:{p['name']}:{p['price']}"),
                    InlineKeyboardButton(text="💔 O'chirish", callback_data=f"toggle_fav:{p['id']}"),
                ]
            ]
        )
        if p.get("photo_url"):
            await message.answer_photo(p["photo_url"], caption=caption, reply_markup=kb)
        else:
            await message.answer(caption, reply_markup=kb)

# 7. PROMO KOD WITH MANDATORY CHANNEL SUB CHECK
@user_router.message(F.text in ["🎁 Promo kod", "🎟 Promo kod"])
async def start_promo_input(message: Message, state: FSMContext, bot: Bot):
    is_sub = await check_channel_subscription(bot, message.from_user.id)
    if not is_sub:
        await message.answer(
            "⚠️ <b>Kanalga a'zolik talab qilinadi!</b>\n\n"
            "Promo kodlardan foydalanish uchun rasmiy kanalimizga a'zo bo'ling:\n"
            "👉 t.me/kalitlar_kanali",
            reply_markup=channel_sub_kb(),
        )
        return

    await state.set_state(PromoUserState.waiting_code)
    await message.answer(
        "🎁 Promo kodni kiriting (masalan: <b>WELCOME2026</b>):",
        reply_markup=ReplyKeyboardRemove(),
    )

@user_router.callback_query(F.data == "check_sub")
async def check_sub_callback(callback: CallbackQuery, bot: Bot):
    is_sub = await check_channel_subscription(bot, callback.from_user.id)
    if is_sub:
        await callback.answer("✅ Rahmat! Kanalga a'zo ekansiz.", show_alert=True)
        await callback.message.edit_text("✅ Rahmat! Endi promo kodlardan va barcha imkoniyatlardan foydalanishingiz mumkin.")
    else:
        await callback.answer("❌ Siz hali kanalga a'zo bo'lmadingiz!", show_alert=True)

@user_router.message(StateFilter(PromoUserState.waiting_code))
async def apply_promo_code(message: Message, state: FSMContext):
    code = (message.text or "").strip()
    await state.clear()

    async with aiohttp.ClientSession() as session:
        try:
            async with session.post(
                f"{BACKEND_API_URL}/promo/validate",
                json={"code": code},
            ) as resp:
                data = await resp.json()
        except Exception as e:
            logging.error(f"Promo validate error: {e}")
            data = {"valid": False, "error": "Server bilan bog'lanishda xatolik."}

    if data.get("valid"):
        cart = get_cart(message.from_user.id)
        subtotal = cart.subtotal()
        promo = data.get("promo", {})
        disc_type = promo.get("discount_type")
        val = promo.get("discount_value", 0)

        if disc_type == "percent":
            discount = int((subtotal * val) / 100)
        else:
            discount = int(val)

        cart.discount_amount = discount
        cart.promo_code = code

        await message.answer(
            f"🎉 <b>Promo kod muvaffaqiyatli qo'llanildi!</b>\n\n"
            f"🎟 Kod: <b>{code}</b>\n"
            f"💰 Chegirma summasi: <b>{discount:,} so'm</b>\n\n"
            f"🛒 Savatdagi yakuniy summa yangilandi!",
            reply_markup=main_menu_kb(message.from_user.id),
        )
    else:
        await message.answer(
            f"❌ <b>Xatolik:</b> {data.get('error', 'Promo kod yaroqsiz.')}",
            reply_markup=main_menu_kb(message.from_user.id),
        )

# 8. PROFILIM (User Profile)
@user_router.message(F.text == "👤 Profilim")
async def show_profile(message: Message):
    bot_info = await message.bot.get_me()
    ref_link = f"https://t.me/{bot_info.username}?start={message.from_user.id}"

    async with aiohttp.ClientSession() as session:
        try:
            async with session.get(f"{BACKEND_API_URL}/user/orders/{message.from_user.id}") as resp:
                orders = await resp.json()
                order_count = len(orders)
        except Exception:
            order_count = 0

        try:
            async with session.get(f"{BACKEND_API_URL}/admin/users") as resp:
                users = await resp.json()
                u_data = next((u for u in users if u["id"] == message.from_user.id), None)
        except Exception:
            u_data = None

    ref_bonus = u_data.get("referral_bonus", 0) if u_data else 0
    comp_bonus = u_data.get("compensation_bonus", 0) if u_data else 0

    msg = (
        f"👤 <b>Sizning Profilingiz:</b>\n\n"
        f"📝 Ism: <b>{html.escape(message.from_user.full_name)}</b>\n"
        f"🆔 Telegram ID: <code>{message.from_user.id}</code>\n"
        f"📦 Jami buyurtmalar: <b>{order_count} ta</b>\n"
        f"🎁 Referral bonusi: <b>{ref_bonus:,} so'm</b>\n"
        f"💸 Kompensatsiya bonusi: <b>{comp_bonus:,} so'm</b>\n\n"
        f"🔗 <b>Sizning taklif havolangiz:</b>\n"
        f"<code>{ref_link}</code>\n\n"
        f"<i>Do'stlaringiz ushbu havola orqali kirsalar, sizga har bir taklif uchun bonus beriladi!</i>"
    )
    await message.answer(msg, reply_markup=main_menu_kb(message.from_user.id))

# ======================================================
# COURIER PANEL IN TELEGRAM BOT
# ======================================================

@user_router.message(F.text.in_(["🛵 Kuryer Kirishi", "/courier", "🛵 Kuryer Paneli"]))
async def courier_login_start(message: Message, state: FSMContext):
    user_id = message.from_user.id
    if user_id in courier_sessions:
        cur = courier_sessions[user_id]
        await message.answer(
            f"🛵 <b>Kuryer Paneli</b> — Xush kelibsiz, <b>{cur['full_name']}</b>!\n"
            f"Tizim kuryer ID: <code>{cur['id']}</code>",
            reply_markup=courier_menu_kb(),
        )
        return

    await state.set_state(CourierLoginState.waiting_username)
    await message.answer(
        "🛵 <b>Kuryer Tizimiga Kirish</b>\n\n"
        "Iltimos, kuryer Login (Username)ingizni kiriting:",
        reply_markup=ReplyKeyboardRemove(),
    )

@user_router.message(StateFilter(CourierLoginState.waiting_username))
async def courier_receive_username(message: Message, state: FSMContext):
    username = message.text.strip()
    await state.update_data(username=username)
    await state.set_state(CourierLoginState.waiting_password)
    await message.answer("🔑 Endi parolingizni kiriting:")

@user_router.message(StateFilter(CourierLoginState.waiting_password))
async def courier_receive_password(message: Message, state: FSMContext):
    password = message.text.strip()
    data = await state.get_data()
    username = data.get("username")

    async with aiohttp.ClientSession() as session:
        try:
            async with session.post(
                f"{BACKEND_API_URL}/auth/login",
                json={"username": username, "password": password},
            ) as resp:
                res_data = await resp.json()
        except Exception as e:
            logging.error(f"Courier login error: {e}")
            res_data = {"success": False, "error": "Server xatosi."}

    await state.clear()
    if res_data.get("success") and res_data.get("user", {}).get("role") == "courier":
        courier_info = res_data.get("user", {}).get("courier", {})
        courier_sessions[message.from_user.id] = courier_info

        await message.answer(
            f"✅ <b>Muvaffaqiyatli kirdi!</b>\n\n"
            f"Xush kelibsiz, <b>{courier_info.get('full_name')}</b>!\n"
            f"Siz endi bot orqali kuryerlik buyurtmalarini boshqarishingiz mumkin.",
            reply_markup=courier_menu_kb(),
        )
    else:
        await message.answer(
            f"❌ <b>Login yoki parol noto'g'ri!</b>\n"
            f"Faqat tasdiqlangan kuryerlar tizimga kira oladi.",
            reply_markup=main_menu_kb(message.from_user.id),
        )

@user_router.message(F.text == "📋 Biriktirilgan buyurtmalar")
async def show_courier_orders(message: Message):
    user_id = message.from_user.id
    if user_id not in courier_sessions:
        await message.answer("Siz kuryer sifatida kirmagansiz.", reply_markup=main_menu_kb(user_id))
        return

    cur = courier_sessions[user_id]
    async with aiohttp.ClientSession() as session:
        try:
            async with session.get(f"{BACKEND_API_URL}/admin/orders") as resp:
                orders = await resp.json()
        except Exception as e:
            logging.error(f"Failed to fetch admin orders: {e}")
            orders = []

    cur_orders = [o for o in orders if o.get("courier_id") == cur["id"] and o.get("status") not in ["delivered", "completed", "cancelled"]]

    if not cur_orders:
        await message.answer("📋 Sizga biriktirilgan faol buyurtmalar yo'q.")
        return

    await message.answer(f"📦 <b>Sizga biriktirilgan buyurtmalar ({len(cur_orders)} ta):</b>")
    for o in cur_orders:
        items_str = "\n".join([f"• {i['product_name']} ({i['quantity']}x) - {i['price']:,} so'm" for i in o.get("items", [])])
        msg = (
            f"<b>Buyurtma #{o['id']}</b>\n"
            f"👤 Mijoz: <b>{o['user_name']}</b> (<code>{o.get('user_phone')}</code>)\n"
            f"📍 Manzil: <b>{o['address']}</b>\n"
            f"📝 Izoh: {o.get('note') or 'Yo\'q'}\n\n"
            f"🍔 <b>Mahsulotlar:</b>\n{items_str}\n\n"
            f"💰 Umumiy summa: <b>{o['total_amount']:,} so'm</b>\n"
            f"💳 To'lov: <b>{o.get('payment_method', 'naqd').upper()}</b>\n"
            f"🔴 Status: <b>{o['status']}</b>"
        )
        kb = InlineKeyboardMarkup(
            inline_keyboard=[
                [InlineKeyboardButton(text="🛵 Yo'lda", callback_data=f"cur_status:{o['id']}:on_way")],
                [InlineKeyboardButton(text="✅ Yetkazildi (Mijozga tasdiqlash yuborish)", callback_data=f"cur_status:{o['id']}:delivered")],
            ]
        )
        await message.answer(msg, reply_markup=kb)

@user_router.callback_query(F.data.startswith("cur_status:"))
async def courier_update_status_handler(callback: CallbackQuery):
    parts = callback.data.split(":")
    order_id = int(parts[1])
    new_status = parts[2]

    user_id = callback.from_user.id
    if user_id not in courier_sessions:
        await callback.answer("Siz kuryer sessionida emassiz!", show_alert=True)
        return

    async with aiohttp.ClientSession() as session:
        try:
            if new_status == "delivered":
                async with session.post(f"{BACKEND_API_URL}/courier/orders/{order_id}/deliver") as resp:
                    res = await resp.json()
            else:
                async with session.post(f"{BACKEND_API_URL}/admin/orders/status", json={"order_id": order_id, "status": new_status}) as resp:
                    res = await resp.json()
        except Exception as e:
            logging.error(f"Courier status change error: {e}")
            res = {"success": False}

    await callback.answer("Status yangilandi!")
    await callback.message.edit_text(f"✅ Buyurtma #{order_id} statusi <b>{new_status.upper()}</b> qilib o'zgartirildi!")

@user_router.message(F.text == "🔄 Statusni yangilash")
async def refresh_courier_panel(message: Message):
    await show_courier_orders(message)

@user_router.message(F.text == "🔙 Asosiy Menyu")
async def back_to_main_menu(message: Message):
    await message.answer("Asosiy menyuga qaytdingiz.", reply_markup=main_menu_kb(message.from_user.id))

@user_router.message(F.text == "🚪 Kuryerdan Chiqish")
async def logout_courier(message: Message):
    user_id = message.from_user.id
    courier_sessions.pop(user_id, None)
    await message.answer("🚪 Kuryer panelidan chiqdingiz.", reply_markup=main_menu_kb(user_id))

# ======================================================
# COURIER DELIVERY CONFIRMATION & RATING HANDLERS FOR USER
# ======================================================

@user_router.callback_query(F.data.startswith("confirm_del:"))
async def confirm_delivery_handler(callback: CallbackQuery):
    order_id = int(callback.data.split(":")[1])
    await callback.answer("Rahmat!")
    await callback.message.edit_text(
        f"🎉 <b>Buyurtma #{order_id} yetkazilgani tasdiqlandi!</b>\n\n"
        f"Iltimos, kuryer xizmatini 1 dan 5 gacha yulduzchalar orqali baholang:",
        reply_markup=rating_stars_kb(order_id),
    )

@user_router.callback_query(F.data.startswith("rate_cur:"))
async def rate_courier_handler(callback: CallbackQuery):
    parts = callback.data.split(":")
    order_id = int(parts[1])
    stars = int(parts[2])

    async with aiohttp.ClientSession() as session:
        try:
            await session.post(
                f"{BACKEND_API_URL}/bot/delivery-response",
                json={"action": "rate", "order_id": order_id, "stars": stars},
            )
        except Exception as e:
            logging.error(f"Failed to post rating to API: {e}")

    await callback.answer(f"Siz {stars} ⭐ baho berdingiz!", show_alert=True)
    await callback.message.edit_text(
        f"⭐️ <b>Kuryer xizmatiga {stars}/5 baho berdingiz!</b>\n\n"
        f"Fikringiz va bahoyingiz uchun sizga kattakon rahmat! Ishtahangiz chog' bo'lsin! 😋"
    )

@user_router.callback_query(F.data.startswith("not_del:"))
async def not_delivered_handler(callback: CallbackQuery):
    order_id = int(callback.data.split(":")[1])

    async with aiohttp.ClientSession() as session:
        try:
            await session.post(
                f"{BACKEND_API_URL}/bot/delivery-response",
                json={"action": "not_delivered", "order_id": order_id},
            )
        except Exception as e:
            logging.error(f"Failed to post not_delivered to API: {e}")

    await callback.answer("Xabaringiz adminlarga yuborildi!", show_alert=True)
    await callback.message.edit_text(
        f"⚠️ <b>Buyurtma kelmaganligi bo'yicha xabar qabul qilindi!</b>\n\n"
        f"Buyurtma #{order_id} bo'yicha kuryerga jarima bali belgilandi. Balansingizga 15,000 so'm kompensatsiya ajratildi!"
    )

# =========================
# MAIN BOT ENTRYPOINT
# =========================

async def main():
    if not BOT_TOKEN:
        print("Error: BOT_TOKEN not found in environment!")
        return

    bot = Bot(token=BOT_TOKEN, default=DefaultBotProperties(parse_mode=ParseMode.HTML))
    dp = Dispatcher(storage=MemoryStorage())
    dp.include_router(user_router)

    logging.info(f"Telegram Bot ({RESTAURANT_NAME}) to'liq foydalanuvchi va kuryer paneli bilan ishga tushdi...")
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())

