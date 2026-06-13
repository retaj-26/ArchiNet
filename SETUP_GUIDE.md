# ArchiNet - Full Stack Setup Guide

كاملة منصة ArchiNet مع Frontend و Backend متكاملة.

## 📋 المتطلبات

- **Node.js** v16+ ([تحميل](https://nodejs.org/))
- **PostgreSQL** v12+ ([تحميل](https://www.postgresql.org/))
- **npm** أو **yarn**
- **Git** (اختياري)

---

## 🚀 خطوات التثبيت

### 1️⃣ إعداد قاعدة البيانات PostgreSQL

**Windows / Mac / Linux:**

```sql
-- الاتصال بـ PostgreSQL
psql -U postgres

-- إنشاء قاعدة البيانات والمستخدم
CREATE DATABASE archinet_db;
CREATE USER archinet_user WITH PASSWORD 'secure_password_123';
GRANT ALL PRIVILEGES ON DATABASE archinet_db TO archinet_user;

-- خروج
\q
```

### 2️⃣ إعداد Backend

```bash
# انتقل للمجلد
cd ArchiNet/backend

# انسخ ملف البيئة
cp .env.example .env

# حرر .env وأضف بيانات قاعدة البيانات
nano .env
# أو
code .env

# يجب أن تبدو بهذا الشكل:
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=archinet_db
# DB_USER=archinet_user
# DB_PASSWORD=secure_password_123
# SERVER_PORT=5000
# FRONTEND_URL=http://localhost:3000

# تثبيت المكتبات
npm install

# تشغيل Migrations
npm run migrate

# إذا نجحت: ✓ All migrations completed successfully
```

### 3️⃣ تشغيل Backend Server

```bash
# من مجلد backend
npm run dev

# يجب أن تري:
# ========================================
#   ArchiNet Backend Server
#   Running on port 5000
#   Environment: development
# ========================================
```

### 4️⃣ تشغيل Frontend

**الطريقة 1: خادم محلي بسيط (نوصى به)**

```bash
# من مجلد المشروع الرئيسي
cd ArchiNet

# استخدم Python (مثبت عادة في Mac/Linux)
python3 -m http.server 3000

# أو Node.js
npx http-server -p 3000

# أو Live Server في VS Code
# انقر بزر اليمين على index.html -> Open with Live Server
```

**الطريقة 2: فتح مباشر**
- افتح المتصفح: `http://localhost:3000`
- أو اسحب `index.html` مباشرة للمتصفح

---

## 🧪 اختبار النظام

### ✅ التحقق من الاتصال

```bash
# في Terminal أو PowerShell جديد:
curl http://localhost:5000/api/health

# يجب أن ترى:
# {
#   "status": "healthy",
#   "timestamp": "2026-05-20T10:00:00Z",
#   "environment": "development"
# }
```

### ✅ اختبار Forms

1. افتح المتصفح: `http://localhost:3000`
2. املأ نموذج "طلب تصميم شبكة" واضغط إرسال
3. يجب أن ترى رسالة نجاح خضراء
4. جرب "طلب دعم فني" أيضاً

### ✅ التحقق من قاعدة البيانات

```bash
# افتح PostgreSQL
psql -U archinet_user -d archinet_db

# شاهد البيانات المخزنة
SELECT * FROM network_requests;
SELECT * FROM support_tickets;

# خروج
\q
```

---

## 🏗️ هيكل المشروع

```
ArchiNet/
├── index.html              # الواجهة الأمامية
├── styles.css              # التصاميم
├── app.js                  # JavaScript (متصل بـ Backend APIs)
├── ai_prompt_for_vscode.md # البرومبت
│
└── backend/                # خادم Node.js
    ├── server.js           # البداية
    ├── package.json        # المكتبات
    ├── .env                # متغيرات البيئة
    ├── config/
    │   └── database.js     # اتصال PostgreSQL
    ├── controllers/
    │   ├── networkController.js
    │   └── supportController.js
    ├── routes/
    │   ├── networkRoutes.js
    │   └── supportRoutes.js
    ├── middleware/
    │   └── validators.js
    └── migrations/
        └── runMigrations.js
```

---

## 📡 API Endpoints

### Network Requests

```
POST /api/network/requests
GET /api/network/requests
GET /api/network/requests/:id
PATCH /api/network/requests/:id/status
```

### Support Tickets

```
POST /api/support/tickets
GET /api/support/tickets
GET /api/support/tickets/:id
PATCH /api/support/tickets/:id
```

---

## 🔧 استكشاف الأخطاء

### ❌ Backend لا يتصل بقاعدة البيانات

```bash
# تحقق من:
1. PostgreSQL يعمل:
   # Windows: خدمات Windows
   # Mac: brew services list
   # Linux: systemctl status postgresql

2. البيانات صحيحة في .env

3. جرب الاتصال:
   psql -U archinet_user -d archinet_db
```

### ❌ Frontend لا يتصل بـ Backend

```bash
# تحقق من:
1. Backend يعمل على port 5000
   curl http://localhost:5000/api/health

2. CORS مفعل في Backend (موجود بالفعل)

3. تحقق من كونسول المتصفح (F12) للأخطاء
```

### ❌ Migrations فشلت

```bash
cd backend
npm run migrate

# إذا استمرت المشكلة:
# حذف قاعدة البيانات وأعد إنشاءها
# ثم شغل npm run migrate مجدداً
```

---

## 🚀 الخطوات التالية

- [ ] إضافة تحقق من صحة المدخلات (Validation) - ✅ موجود
- [ ] نظام تسجيل المستخدمين
- [ ] لوحة تحكم Admin
- [ ] نظام البريد الإلكتروني للإخطارات
- [ ] نشر على خادم حقيقي (Deploy)

---

## 💡 نصائح مهمة

✅ **افتح 3 Terminals:**
1. Terminal 1: Backend (`npm run dev`)
2. Terminal 2: Frontend (`python3 -m http.server 3000`)
3. Terminal 3: للأوامر الأخرى

✅ **إذا أضفت بيانات جديدة:**
- البيانات تُحفظ في قاعدة البيانات تلقائياً
- يمكنك عرضها عبر PostgreSQL

✅ **للتطوير والاختبار:**
- استخدم DevTools في المتصفح (F12)
- شاهد Logs في Terminal الخاص بـ Backend

---

## 📞 الدعم والمساعدة

إذا واجهت مشاكل:

1. تحقق من الـ Logs في Terminals
2. تأكد من تثبيت جميع المتطلبات
3. جرب إعادة تشغيل الخوادم
4. حذف `node_modules` وأعد `npm install`

---

**تم! النظام جاهز للاستخدام** 🎉
