# MRK Foods Digital Cards System

## 📁 File Structure
```
mrk-cards/
├── index.html        → Admin Login
├── dashboard.html    → Admin Panel
├── card.html         → Public Employee Card
├── admin.js          → Admin Logic
├── card.js           → Card Rendering Logic
├── style.css         → All Styles
├── vercel.json       → Vercel Config
└── mrk_logo.jpg      → Company Logo (add this file!)
```

## 🔐 Admin Login
- URL: `https://your-domain.vercel.app/`
- Username: `admin`
- Password: `admin123`

## 🚀 Vercel Deployment Steps

### Step 1: Create GitHub Repository
1. Go to https://github.com/new
2. Create a new repo (e.g., `mrk-digital-cards`)
3. Make it **Public**

### Step 2: Upload Files
Upload all files to the repo:
- index.html
- dashboard.html
- card.html
- admin.js
- card.js
- style.css
- vercel.json
- **mrk_logo.jpg** (your company logo file)

### Step 3: Deploy on Vercel
1. Go to https://vercel.com
2. Click "New Project"
3. Import your GitHub repository
4. Framework Preset: **Other**
5. Click **Deploy**

### Step 4: Get Your Domain
Vercel will give you: `https://mrk-digital-cards.vercel.app`

## 📱 How to Use

### Create Employee Card:
1. Login → Dashboard → "Add New Employee"
2. Fill details, upload photo
3. **Paste catalogue link** (Google Drive / OneDrive share link)
4. Save → Get QR + Link

### Share with Customer:
- Copy the link: `https://your-domain.vercel.app/card.html?id=emp1234`
- OR print/share the QR code
- Customer opens → NO login required

## ⚠️ IMPORTANT NOTE
This system uses **localStorage** for data storage.
- Data is stored in the browser where the admin panel is used
- Data persists on that device/browser

### For multi-device access (optional upgrade):
To share data across devices, connect to a backend like:
- Firebase Firestore (free tier available)
- Supabase (free tier available)

## 🔄 Update Steps (GitHub)
To update files after deployment:
1. Go to your GitHub repo
2. Click the file you want to update
3. Click the pencil (edit) icon
4. Make changes → Commit
5. Vercel auto-deploys in ~30 seconds

## 📞 Card Features
✅ Company logo with brand colors
✅ Employee photo (full, no cropping)
✅ Call, WhatsApp, Email buttons
✅ Save Contact (downloads .vcf)
✅ Share Card button
✅ View Catalogue (opens your link)
✅ QR code (scan to save contact)
✅ Social links: Facebook, LinkedIn, Instagram, WhatsApp
✅ NO login required for customer
