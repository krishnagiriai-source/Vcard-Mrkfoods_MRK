const CLOUDINARY_CLOUD_NAME    = 'YOUR_EXACT_CLOUD_NAME';
const CLOUDINARY_UPLOAD_PRESET = 'YOUR_EXACT_PRESET_NAME';
```

5. Click **Commit changes** → **Commit changes**

---

## STEP 3 — Re-upload the Photo (2 minutes)

1. Go to your live site → Login → **Admin Dashboard**
2. Find Krishnadev Giri → Click **✏️ Edit**
3. Click the photo area → **select the employee photo again**
4. **Before clicking Save** → open browser **F12 → Console tab**
5. Click **💾 Save Employee Card**
6. Watch the Console — you should see:
```
✅ Photo uploaded to Cloudinary: https://res.cloudinary.com/...
✅ Employee updated in Firestore. photoURL: https://res.cloudinary.com/...
```

**If you see ❌ error** → tell me exactly what the error message says

---

## STEP 4 — Check Firestore (1 minute)

1. Go to **console.firebase.google.com**
2. Click your project → **Firestore Database**
3. Click **employees** collection
4. Click on **Krishnadev Giri's document**
5. Find the `photoURL` field

**It should now show a full URL like:**
```
https://res.cloudinary.com/mrkfoods/image/upload/v123.../photo.jpg
