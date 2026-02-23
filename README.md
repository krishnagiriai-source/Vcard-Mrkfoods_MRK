# MRK Foods Digital Cards — Firebase Cloud Edition

## ✅ What Changed (vs Old Version)
| Old System | New System |
|---|---|
| localStorage (only on 1 device) | Firebase Firestore (syncs everywhere) |
| GitHub publish API (500 errors) | Direct Firestore writes — no publish needed |
| sessionStorage auth (breaks on other devices) | Firebase Authentication (works on all devices) |
| employees-data.js file on GitHub | Real-time cloud database |

---

## 📁 New File Structure
```
mrk-cards/
├── index.html          → Admin Login (Firebase Auth)
├── dashboard.html      → Admin Panel (Firestore real-time)
├── card.html           → Public Employee Card (reads Firestore)
├── admin.js            → Admin Logic (Firebase)
├── card.js             → Card Rendering Logic (Firebase)
├── firebase-config.js  → ⚠️ YOU MUST FILL IN YOUR CONFIG HERE
├── style.css           → All Styles (unchanged)
├── firestore.rules     → Firestore Security Rules
├── storage.rules       → Firebase Storage Rules
├── vercel.json         → Vercel Config
└── mrk_logo.jpg        → Company Logo (add this file!)

FILES TO DELETE from your old repo:
├── publish.js          ← DELETE (not needed anymore)
├── debug.js            ← DELETE
├── employees-data.js   ← DELETE (replaced by Firestore)
└── api/ folder         ← DELETE (no serverless API needed)
```

---

## 🔥 STEP 1 — Create Firebase Project (FREE)

1. Go to **https://console.firebase.google.com/**
2. Click **"Add project"**
3. Name it: `mrk-foods-cards`
4. Disable Google Analytics (optional) → **Create project**
5. Wait ~30 seconds for it to create

---

## 🔥 STEP 2 — Enable Firestore Database

1. In Firebase Console → left sidebar → **"Firestore Database"**
2. Click **"Create database"**
3. Choose **"Start in production mode"** → click Next
4. Select location: `asia-south1 (Mumbai)` → **Enable**
5. Once created, click **"Rules"** tab → paste this and **Publish**:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /employees/{docId} {
      allow read:   if true;
      allow create: if request.auth != null;
      allow update: if request.auth != null;
      allow delete: if request.auth != null;
    }
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

---

## 🔥 STEP 3 — Enable Firebase Storage

1. In Firebase Console → left sidebar → **"Storage"**
2. Click **"Get started"**
3. Choose **"Start in production mode"** → Next → Done
4. Click **"Rules"** tab → paste this and **Publish**:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /employees/{empId}/{fileName} {
      allow read:  if true;
      allow write: if request.auth != null
                   && request.resource.size < 5 * 1024 * 1024
                   && request.resource.contentType.matches('image/.*');
    }
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

---

## 🔥 STEP 4 — Enable Authentication

1. In Firebase Console → left sidebar → **"Authentication"**
2. Click **"Get started"**
3. Click **"Email/Password"** → **Enable** → Save
4. Click **"Users"** tab → **"Add user"**
5. Enter your admin email (e.g. `admin@mrkfoods.in`) and a strong password
6. Click **"Add user"** — this is your login for the dashboard

---

## 🔥 STEP 5 — Get Your Firebase Config

1. In Firebase Console → ⚙️ **Project Settings** (gear icon top left)
2. Scroll down to **"Your apps"** → click **"</> Web"**
3. App nickname: `mrk-cards-web` → **Register app**
4. You will see a code block like this — **copy ALL the values**:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "mrk-foods-cards.firebaseapp.com",
  projectId: "mrk-foods-cards",
  storageBucket: "mrk-foods-cards.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

5. Open **`firebase-config.js`** and replace all the `REPLACE_WITH_...` values with your real values

---

## 🔥 STEP 6 — Upload to GitHub & Deploy on Vercel

1. Go to your GitHub repo: **github.com/krishnagiriai-source/Vcard-Mrkfoods_MRK**
2. **DELETE** these files (click file → pencil → delete):
   - `api/publish.js`
   - `api/debug.js` (if exists)  
   - `employees-data.js`
   - `publish.js`
   - `debug.js`
3. **Upload** all new files:
   - `index.html`, `dashboard.html`, `card.html`
   - `admin.js`, `card.js`
   - `firebase-config.js` ← **make sure you filled in your real config!**
   - `vercel.json`
4. Vercel auto-deploys in ~30 seconds

---

## 🔐 How to Log In

- URL: `https://vcard-mrkfoods-mrk.vercel.app/`
- Email: whatever you set in Step 4
- Password: whatever you set in Step 4

---

## ✅ How It Works Now

1. **Admin logs in** → Firebase Auth (works on any device)
2. **Add/Edit/Delete employee** → Saves to Firestore instantly
3. **Customer opens card link** → Reads from Firestore (no login, always fresh data)
4. **No publish button** → Changes are live immediately, everywhere
5. **Photos stored** in Firebase Storage → permanent URLs, not localStorage blobs

---

## 🌍 Multi-Device Access

- Log in from your phone, laptop, or any computer
- All devices see the same employees
- Edit on one device → all other cards update within seconds

---

## 💰 Cost

Firebase Spark Plan (FREE):
- Firestore: 50,000 reads/day, 20,000 writes/day (more than enough)
- Storage: 5 GB free
- Auth: Unlimited users free
- No credit card required

---

## 🆘 Troubleshooting

| Problem | Fix |
|---|---|
| "Firebase: Error (auth/configuration-not-found)" | You haven't filled in firebase-config.js with real values |
| "Missing or insufficient permissions" | Re-paste the Firestore Rules and click Publish |
| Photos not uploading | Re-paste the Storage Rules and click Publish |
| Login fails | Check you created the user in Firebase → Authentication → Users |
| Dashboard shows 0 employees | Check Firestore Rules allow read: if true |
