// ============================================
// MRK Foods - Admin Panel Logic
// Auth: Firebase Authentication (FREE)
// Database: Firebase Firestore (FREE)
// Photos: Cloudinary (FREE)
// ============================================

const EMPLOYEES_COL = 'employees';
let unsubscribeListener = null;

// ============================================
// ⚠️  CLOUDINARY CONFIG — FILL THESE IN
//     Get from cloudinary.com → Settings → Upload Presets
// ============================================
const CLOUDINARY_CLOUD_NAME    = 'mrkfoods';       // ← your Cloud Name here
const CLOUDINARY_UPLOAD_PRESET = 'mrk_unsigned';   // ← your unsigned preset here
const CLOUDINARY_UPLOAD_URL    = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

// ============================================
// CLOUDINARY UPLOAD — with full error visibility
// ============================================
async function uploadToCloudinary(file, folder = 'mrk-employees') {
  // Validate credentials first
  if (
    !CLOUDINARY_CLOUD_NAME    || CLOUDINARY_CLOUD_NAME    === 'YOUR_CLOUD_NAME' ||
    !CLOUDINARY_UPLOAD_PRESET || CLOUDINARY_UPLOAD_PRESET === 'YOUR_UPLOAD_PRESET'
  ) {
    throw new Error('Cloudinary credentials not configured in admin.js (lines 14-15). Update CLOUDINARY_CLOUD_NAME and CLOUDINARY_UPLOAD_PRESET.');
  }

  const formData = new FormData();
  formData.append('file',           file);
  formData.append('upload_preset',  CLOUDINARY_UPLOAD_PRESET);
  formData.append('folder',         folder);
  // Auto-transform: max 800px wide, 75% quality, auto format
  formData.append('transformation', JSON.stringify([{ width: 800, quality: 75, fetch_format: 'auto' }]));

  const res  = await fetch(CLOUDINARY_UPLOAD_URL, { method: 'POST', body: formData });
  const data = await res.json();

  if (!res.ok || data.error) {
    const msg = data.error?.message || `HTTP ${res.status}`;
    throw new Error(`Cloudinary upload failed: ${msg}`);
  }

  if (!data.secure_url) {
    throw new Error('Cloudinary returned no URL. Check your upload preset settings.');
  }

  return data.secure_url;
}

// ============================================
// AUTH
// ============================================
function doLogout() {
  if (unsubscribeListener) unsubscribeListener();
  auth.signOut().then(() => { window.location.href = 'index.html'; });
}

// ============================================
// DASHBOARD INIT
// ============================================
function initDashboard() {
  auth.onAuthStateChanged(function(user) {
    if (!user) { window.location.replace('index.html'); return; }

    const userEl  = document.getElementById('topbarUser');
    if (userEl) userEl.textContent = '👤 ' + (user.email || 'Admin');

    document.getElementById('pageLoader').style.display  = 'none';
    document.getElementById('mainContent').style.display = 'block';

    startRealtimeListener();
  });

  // Photo input → local preview
  const photoInput = document.getElementById('empPhoto');
  if (photoInput) {
    photoInput.addEventListener('change', function() {
      if (!this.files[0]) return;
      const reader = new FileReader();
      reader.onload = e => {
        const preview     = document.getElementById('photoPreview');
        const placeholder = document.getElementById('photoPlaceholder');
        preview.src           = e.target.result;
        preview.style.display = 'block';
        if (placeholder) placeholder.style.display = 'none';
      };
      reader.readAsDataURL(this.files[0]);
    });
  }

  // Logo input → local preview
  const logoInput = document.getElementById('companyLogoOverride');
  if (logoInput) {
    logoInput.addEventListener('change', function() {
      if (!this.files[0]) return;
      const prev = document.getElementById('logoPreviewImg');
      if (prev) { prev.src = URL.createObjectURL(this.files[0]); prev.style.display = 'block'; }
    });
  }
}

// ============================================
// REAL-TIME FIRESTORE LISTENER
// ============================================
function startRealtimeListener() {
  const listLoader = document.getElementById('listLoader');
  if (listLoader) listLoader.style.display = 'block';
  if (unsubscribeListener) unsubscribeListener();

  unsubscribeListener = db
    .collection(EMPLOYEES_COL)
    .orderBy('createdAt', 'asc')
    .onSnapshot(
      snapshot => {
        if (listLoader) listLoader.style.display = 'none';
        const employees = [];
        snapshot.forEach(doc => employees.push({ id: doc.id, ...doc.data() }));
        renderEmployeeList(employees);
        updateStats(employees.length);
      },
      err => {
        if (listLoader) listLoader.style.display = 'none';
        showToast('Error loading: ' + err.message, 'error');
      }
    );
}

// ============================================
// STATS
// ============================================
function updateStats(count) {
  const el = document.getElementById('statTotal');
  if (el) el.textContent = count;
}

// ============================================
// RENDER EMPLOYEE TABLE
// ============================================
function renderEmployeeList(employees) {
  const tbody = document.getElementById('empTableBody');
  const empty = document.getElementById('emptyState');
  if (!tbody) return;

  if (!employees || employees.length === 0) {
    tbody.innerHTML = '';
    if (empty) empty.style.display = 'block';
    return;
  }
  if (empty) empty.style.display = 'none';

  tbody.innerHTML = employees.map(emp => {
    const initials = emp.name
      ? emp.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
      : '?';
    const avatar = emp.photoURL
      ? `<img src="${emp.photoURL}" class="emp-avatar" alt="${escHtml(emp.name)}" style="border-radius:50%;object-fit:cover">`
      : `<div class="emp-avatar-placeholder">${initials}</div>`;
    const cardUrl = getCardUrl(emp.id);
    return `
      <tr>
        <td>
          <div class="emp-name-cell">
            ${avatar}
            <div>
              <div class="emp-name">${escHtml(emp.name)}</div>
              <div class="emp-designation">${escHtml(emp.designation || '')}</div>
            </div>
          </div>
        </td>
        <td>${escHtml(emp.mobile || '—')}</td>
        <td><span class="badge">${escHtml(emp.designation || '—')}</span></td>
        <td>
          <div class="actions-cell">
            <a href="${cardUrl}" target="_blank" class="btn btn-green btn-sm">👁️ View Card</a>
            <button onclick="copyLink('${escHtml(cardUrl)}')" class="btn btn-secondary btn-sm">🔗 Copy Link</button>
            <button onclick="showQR('${emp.id}')" class="btn btn-secondary btn-sm">📱 QR</button>
            <button onclick="editEmployee('${emp.id}')" class="btn btn-maroon btn-sm">✏️ Edit</button>
            <button onclick="deleteEmployee('${emp.id}','${escHtml(emp.name)}')" class="btn btn-danger btn-sm">🗑️ Delete</button>
          </div>
        </td>
      </tr>`;
  }).join('');
}

function getCardUrl(id) {
  const base = window.location.origin + window.location.pathname.replace('dashboard.html', '');
  return `${base}card.html?id=${id}`;
}

// ============================================
// SAVE EMPLOYEE  (Create OR Update)
// KEY FIX: photoURL is always preserved correctly
// ============================================
async function saveEmployee() {
  const saveBtn = document.getElementById('saveEmpBtn');
  const empId   = (document.getElementById('empId').value || '').trim();
  const name    = (document.getElementById('empName').value || '').trim();

  if (!name) { showToast('Employee name is required', 'error'); return; }

  if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = '⏳ Saving…'; }

  try {
    // ── Build data object ──────────────────────────────────────
    const empData = {
      name:               name,
      designation:        (document.getElementById('empDesignation').value       || '').trim(),
      mobile:             (document.getElementById('empMobile').value            || '').trim(),
      email:              (document.getElementById('empEmail').value             || '').trim(),
      website:            (document.getElementById('empWebsite').value           || '').trim(),
      address:            (document.getElementById('empAddress').value           || '').trim(),
      whatsapp:           (document.getElementById('empWhatsapp').value          || '').trim(),
      googleLocationLink: (document.getElementById('empGoogleLocationLink')?.value || '').trim(),
      facebook:           (document.getElementById('empFacebook').value          || '').trim(),
      linkedin:           (document.getElementById('empLinkedin').value          || '').trim(),
      instagram:          (document.getElementById('empInstagram').value         || '').trim(),
      catalogueLink:      (document.getElementById('empCatalogueLink').value     || '').trim(),
      updatedAt:          firebase.firestore.FieldValue.serverTimestamp(),
    };

    // ── KEY FIX: preserve existing photoURL from hidden field ──
    const existingPhotoURL = (document.getElementById('existingPhotoURL')?.value || '').trim();
    if (existingPhotoURL) {
      empData.photoURL = existingPhotoURL;
    }

    // ── Upload NEW photo if selected ───────────────────────────
    const photoInput = document.getElementById('empPhoto');
    if (photoInput && photoInput.files && photoInput.files[0]) {
      showToast('📤 Uploading photo…', 'success');
      try {
        const uploadedUrl   = await uploadToCloudinary(photoInput.files[0], 'mrk-employees/photos');
        empData.photoURL    = uploadedUrl;  // overwrite with fresh URL
        console.log('✅ Photo uploaded to Cloudinary:', uploadedUrl);
        showToast('✅ Photo uploaded!', 'success');
      } catch (uploadErr) {
        console.error('❌ Photo upload error:', uploadErr);
        showToast('❌ Photo upload failed: ' + uploadErr.message, 'error');
        // Don't block save — keep existing photoURL if any
      }
    }

    // ── Upload company logo if selected ───────────────────────
    const logoInput = document.getElementById('companyLogoOverride');
    if (logoInput && logoInput.files && logoInput.files[0]) {
      try {
        empData.logoURL = await uploadToCloudinary(logoInput.files[0], 'mrk-employees/logos');
      } catch (_) { /* optional — skip silently */ }
    }

    // ── Write to Firestore ─────────────────────────────────────
    if (empId) {
      await db.collection(EMPLOYEES_COL).doc(empId).update(empData);
      console.log('✅ Employee updated in Firestore. photoURL:', empData.photoURL);
      showToast('✅ Employee updated successfully!', 'success');
    } else {
      empData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
      const newDoc = await db.collection(EMPLOYEES_COL).add(empData);
      console.log('✅ Employee created in Firestore. ID:', newDoc.id, 'photoURL:', empData.photoURL);
      showToast('✅ Employee created successfully!', 'success');
    }

    closeModal('empModal');

  } catch (err) {
    console.error('❌ Save error:', err);
    showToast('❌ Error saving: ' + err.message, 'error');
  } finally {
    if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = '💾 Save Employee Card'; }
  }
}

// ============================================
// EDIT EMPLOYEE — KEY FIX: stores photoURL in hidden field
// ============================================
async function editEmployee(id) {
  try {
    const doc = await db.collection(EMPLOYEES_COL).doc(id).get();
    if (!doc.exists) { showToast('Employee not found', 'error'); return; }
    const emp = { id: doc.id, ...doc.data() };

    document.getElementById('empId').value                                         = emp.id;
    document.getElementById('empName').value                                       = emp.name || '';
    document.getElementById('empDesignation').value                                = emp.designation || '';
    document.getElementById('empMobile').value                                     = emp.mobile || '';
    document.getElementById('empEmail').value                                      = emp.email || '';
    document.getElementById('empWebsite').value                                    = emp.website || '';
    document.getElementById('empAddress').value                                    = emp.address || '';
    document.getElementById('empWhatsapp').value                                   = emp.whatsapp || '';
    const locEl = document.getElementById('empGoogleLocationLink');
    if (locEl) locEl.value                                                         = emp.googleLocationLink || '';
    document.getElementById('empFacebook').value                                   = emp.facebook || '';
    document.getElementById('empLinkedin').value                                   = emp.linkedin || '';
    document.getElementById('empInstagram').value                                  = emp.instagram || '';
    document.getElementById('empCatalogueLink').value                              = emp.catalogueLink || '';

    // ── KEY FIX: store existing photoURL in hidden field ───────
    const hiddenPhotoField = document.getElementById('existingPhotoURL');
    if (hiddenPhotoField) hiddenPhotoField.value = emp.photoURL || '';

    // ── Show current photo preview in admin form ───────────────
    const preview     = document.getElementById('photoPreview');
    const placeholder = document.getElementById('photoPlaceholder');
    if (emp.photoURL) {
      preview.src           = emp.photoURL;
      preview.style.display = 'block';
      if (placeholder) placeholder.style.display = 'none';
    } else {
      preview.style.display = 'none';
      if (placeholder) placeholder.style.display = 'flex';
    }

    document.getElementById('modalTitle').textContent = 'Edit Employee';
    openModal('empModal');
  } catch (err) {
    console.error(err);
    showToast('Error loading employee: ' + err.message, 'error');
  }
}

// ============================================
// DELETE
// ============================================
async function deleteEmployee(id, name) {
  if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
  try {
    await db.collection(EMPLOYEES_COL).doc(id).delete();
    showToast('Employee deleted.', 'success');
  } catch (err) {
    showToast('Error: ' + err.message, 'error');
  }
}

// ============================================
// QR MODAL
// ============================================
function showQR(id) {
  const rows   = document.querySelectorAll('#empTableBody tr');
  let empName  = id;
  rows.forEach(row => {
    if (row.innerHTML.includes(`editEmployee('${id}')`)) {
      empName = row.querySelector('.emp-name')?.textContent || id;
    }
  });
  const cardUrl = getCardUrl(id);
  const qrUrl   = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(cardUrl)}&color=3d0009&bgcolor=ffffff`;
  document.getElementById('qrEmpName').textContent    = empName;
  document.getElementById('qrImage').src              = qrUrl;
  document.getElementById('qrCardUrl').textContent    = cardUrl;
  document.getElementById('qrCardUrlHidden').value    = cardUrl;
  openModal('qrModal');
}

async function downloadQR() {
  const img = document.getElementById('qrImage');
  try {
    const resp = await fetch(img.src);
    const blob = await resp.blob();
    const url  = URL.createObjectURL(blob);
    const a    = Object.assign(document.createElement('a'), {
      href: url,
      download: document.getElementById('qrEmpName').textContent.replace(/\s+/g,'_') + '_QR.png'
    });
    a.click(); URL.revokeObjectURL(url);
    showToast('QR downloaded!', 'success');
  } catch { showToast('Right-click the QR to save.', 'error'); }
}

function copyQRLink() { copyLink(document.getElementById('qrCardUrlHidden').value); }

// ============================================
// MODAL HELPERS
// ============================================
function openModal(id) {
  const m = document.getElementById(id);
  if (m) m.classList.add('active');
}

function closeModal(id) {
  const m = document.getElementById(id);
  if (m) { m.classList.remove('active'); if (id === 'empModal') resetForm(); }
}

function resetForm() {
  const form = document.getElementById('empForm');
  if (form) form.reset();

  document.getElementById('empId').value                  = '';
  document.getElementById('modalTitle').textContent       = 'Add New Employee';

  // Clear hidden photo URL field
  const hiddenPhoto = document.getElementById('existingPhotoURL');
  if (hiddenPhoto) hiddenPhoto.value = '';

  const preview     = document.getElementById('photoPreview');
  const placeholder = document.getElementById('photoPlaceholder');
  if (preview)     { preview.style.display = 'none'; preview.src = ''; }
  if (placeholder)   placeholder.style.display = 'flex';

  const logoPrev = document.getElementById('logoPreviewImg');
  if (logoPrev)  { logoPrev.style.display = 'none'; logoPrev.src = ''; }

  const locEl = document.getElementById('empGoogleLocationLink');
  if (locEl) locEl.value = '';
}

// ============================================
// UTILITIES
// ============================================
function copyLink(url) {
  navigator.clipboard.writeText(url)
    .then(() => showToast('Link copied!', 'success'))
    .catch(() => {
      const ta = document.createElement('textarea');
      ta.value = url; document.body.appendChild(ta);
      ta.select(); document.execCommand('copy');
      document.body.removeChild(ta);
      showToast('Link copied!', 'success');
    });
}

function showToast(msg, type = 'success') {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.className   = 'toast show ' + type;
  setTimeout(() => { toast.className = 'toast'; }, 4000);
}

function escHtml(s) {
  if (!s) return '';
  return String(s)
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;');
}
