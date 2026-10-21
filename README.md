# BURGOOD Access Control & Parking Management System

Avtoturargohlar va avtoturargoh shlagbaumlarini avtomatlashtirilgan boshqarish, Hikvision ANPR kameralari orqali davlat raqamlarini aniqlash (LPR/ANPR), dinamik tariflar (soatbay, minutbay, fikslangan) va VIP obunachilar boshqaruvi tizimi.

---

## 🚀 Yangi kompyuterda ishga tushirish (Antigravity yoki boshqa kompyuterda)

### 1-usul: Avtomatik o'rnatish (Tavsiya etiladi)
Loyiha papkasini oching va **`setup_new_pc.bat`** faylini ikki marta bosing:
- Barcha kutubxonalar (`npm install`) avtomatik o'rnatiladi.
- Ma'lumotlar bazasi (SQLite) va sozlamalar tiklanadi.
- Frontend yig'iladi (`npm run build`).
- Kompyuter ish stoliga (Desktop) **BURGOOD Access Control** yorlig'i yaratiladi.

### 2-usul: Qo'lda (Terminal orqali) o'rnatish

1. **Backend sozlash:**
   ```bash
   cd backend
   npm install
   npx prisma generate
   npx prisma db push
   ```

2. **Frontend sozlash va yig'ish:**
   ```bash
   cd ../frontend
   npm install
   npm run build
   ```

3. **Tizimni ishga tushirish:**
   ```bash
   cd ../backend
   node index.js
   ```
   Brauzeringizda oching: **`http://localhost:3001`**

---

## 🛠️ Tizim arxitekturasi va texnologiyalar

- **Frontend:** React (Vite), Tailwind CSS (Burgood Design System), Lucide Icons, Socket.IO Client.
- **Backend:** Node.js, Express, Prisma ORM, Socket.IO.
- **Ma'lumotlar bazasi:** SQLite (`backend/prisma/dev.db`).
- **Kameralar integratsiyasi:** Hikvision ANPR (HTTP Webhook ISAPI XML / Multipart).
- **Shlagbaum boshqaruvi:** Hikvision Relay Trigger (ISAPI Output).

---

## 🔑 Standart kirish ma'lumotlari

- **Tizim manzili:** `http://localhost:3001`
- **Administrator:** `admin` / `admin123` *(yoki bazada saqlangan amaldagi parol)*

---

## 📞 Mualliflik va Huquqlar
© 2026 **BURGOOD Access Control**. Barcha huquqlar himoyalangan.
