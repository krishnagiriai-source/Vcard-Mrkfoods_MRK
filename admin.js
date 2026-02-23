// ============================================
// MRK Foods - Admin Panel Logic
// Powered by Firebase Firestore + Storage + Auth
// ============================================

const EMPLOYEES_COL = 'employees'; // Firestore collection name
let unsubscribeListener = null;    // Real-time listener handle

// ============================================
// AUTH
// ============================================

function doLogout() {
  if (unsubscribeListener) unsubscribeListener();
  auth.signOut().then(() => {
    window.location.href = 'index.html';
  });
}

// ============================================
// DASHBOARD INIT
// ============================================

function initDashboard() {
  // Check auth state — redirect to login if not signed in
  auth.onAuthStateChanged(function(user) {
    if (!user) {
      window.location.replace('index.html');
      return;
    }

    // Show user email in topbar
    const userEl = document.getElementById('topbarUser');
    if (userEl) userEl.textContent = '👤 ' + (user.email || 'Admin');

    // Hide loader, show content
    const loader  = document.getElementById('pageLoader');
    const content = document.getElementById('mainContent');
    if (loader)  loader.style.display  = 'none';
    if (content) content.style.display = 'block';

    // Start real-time listener
    startRealtimeListener();
  });

  // Photo preview
  const photoInput = document.getElementById('empPhoto');
  if (photoInput) {
    photoInput.addEventListener('change', async function() {
      if (this.files[0]) {
        const data = await readFileAsDataURL(this.files[0]);
        const preview = document.getElementById('photoPreview');
        const placeholder = document.getElementById('photoPlaceholder');
        preview.src = data;
        preview.style.display = 'block';
        if (placeholder) placeholder.style.display = 'none';
      }
    });
  }

  // Logo preview
  const logoInput = document.getElementById('companyLogoOverride');
  if (logoInput) {
    logoInput.addEventListener('change', async function() {
      if (this.files[0]) {
        const data = await readFileAsDataURL(this.files[0]);
        const prev = document.getElementById('logoPreviewImg');
        if (prev) { prev.src = data; prev.style.display = 'block'; }
      }
    });
  }
}

// ============================================
// REAL-TIME FIRESTORE LISTENER
// ============================================

function startRealtimeListener() {
  const listLoader = document.getElementById('listLoader');
  if (listLoader) listLoader.style.display = 'block';

  // unsubscribe previous listener if any
  if (unsubscribeListener) unsubscribeListener();

  unsubscribeListener = db
    .collection(EMPLOYEES_COL)
    .orderBy('createdAt', 'asc')
    .onSnapshot(
      function(snapshot) {
        if (listLoader) listLoader.style.display = 'none';
        const employees = [];
        snapshot.forEach(doc => {
          employees.push({ id: doc.id, ...doc.data() });
        });
        renderEmployeeList(employees);
        updateStats(employees.length);
      },
      function(err) {
        if (listLoader) listLoader.style.display = 'none';
        console.error('Firestore listener error:', err);
        showToast('Error loading employees: ' + err.message, 'error');
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
// RENDER EMPLOYEE LIST
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
      ? `<img src="${emp.photoURL}" class="emp-avatar" alt="${escHtml(emp.name)}">`
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
            <button onclick="deleteEmployee('${emp.id}', '${escHtml(emp.name)}')" class="btn btn-danger btn-sm">🗑️ Delete</button>
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
// SAVE EMPLOYEE (Create / Update)
// ============================================

async function saveEmployee() {
  const saveBtn = document.getElementById('saveEmpBtn');
  const empId   = document.getElementById('empId').value.trim();
  const name    = document.getElementById('empName').value.trim();

  if (!name) { showToast('Employee name is required', 'error'); return; }

  if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = '⏳ Saving…'; }

  try {
    const photoInput = document.getElementById('empPhoto');
    const logoInput  = document.getElementById('companyLogoOverride');

    let photoURL = null;
    let logoURL  = null;

    // --- Upload photo to Firebase Storage if a new file is selected ---
    if (photoInput && photoInput.files[0]) {
      showToast('Uploading photo…', 'success');
      const targetId = empId || ('emp_' + Date.now());
      photoURL = await uploadFileToStorage(photoInput.files[0], `employees/${targetId}/photo`);
    }

    // --- Upload logo if provided ---
    if (logoInput && logoInput.files[0]) {
      showToast('Uploading logo…', 'success');
      const targetId = empId || ('emp_' + Date.now());
      logoURL = await uploadFileToStorage(logoInput.files[0], `employees/${targetId}/logo`);
    }

    const empData = {
      name:           name,
      designation:    document.getElementById('empDesignation').value.trim(),
      mobile:         document.getElementById('empMobile').value.trim(),
      email:          document.getElementById('empEmail').value.trim(),
      website:        document.getElementById('empWebsite').value.trim(),
      address:        document.getElementById('empAddress').value.trim(),
      whatsapp:       document.getElementById('empWhatsapp').value.trim(),
      facebook:       document.getElementById('empFacebook').value.trim(),
      linkedin:       document.getElementById('empLinkedin').value.trim(),
      instagram:      document.getElementById('empInstagram').value.trim(),
      catalogueLink:  document.getElementById('empCatalogueLink').value.trim(),
      updatedAt:      firebase.firestore.FieldValue.serverTimestamp(),
    };

    if (empId) {
      // UPDATE existing document
      const updatePayload = { ...empData };
      if (photoURL) updatePayload.photoURL = photoURL;  // only overwrite if new upload
      if (logoURL)  updatePayload.logoURL  = logoURL;
      await db.collection(EMPLOYEES_COL).doc(empId).update(updatePayload);
      showToast('Employee updated successfully!', 'success');
    } else {
      // CREATE new document
      empData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
      if (photoURL) empData.photoURL = photoURL;
      if (logoURL)  empData.logoURL  = logoURL;
      await db.collection(EMPLOYEES_COL).add(empData);
      showToast('Employee created successfully!', 'success');
    }

    closeModal('empModal');

  } catch (err) {
    console.error('Save employee error:', err);
    showToast('Error saving employee: ' + err.message, 'error');
  } finally {
    if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = '💾 Save Employee Card'; }
  }
}

// ============================================
// UPLOAD FILE TO FIREBASE STORAGE
// ============================================

async function uploadFileToStorage(file, path) {
  // Compress image before upload to keep Firestore / Storage lean
  const compressed = await compressImage(file, 800, 0.75);
  const ref        = storage.ref(path);
  const snapshot   = await ref.put(compressed);
  return await snapshot.ref.getDownloadURL();
}

// Simple client-side image compression
function compressImage(file, maxWidth, quality) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = function(e) {
      const img = new Image();
      img.onload = function() {
        const canvas = document.createElement('canvas');
        let w = img.width, h = img.height;
        if (w > maxWidth) { h = Math.round(h * maxWidth / w); w = maxWidth; }
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        canvas.toBlob(blob => resolve(blob), 'image/jpeg', quality);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = e => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ============================================
// EDIT EMPLOYEE
// ============================================

async function editEmployee(id) {
  try {
    const doc = await db.collection(EMPLOYEES_COL).doc(id).get();
    if (!doc.exists) { showToast('Employee not found', 'error'); return; }
    const emp = { id: doc.id, ...doc.data() };

    document.getElementById('empId').value            = emp.id;
    document.getElementById('empName').value          = emp.name || '';
    document.getElementById('empDesignation').value   = emp.designation || '';
    document.getElementById('empMobile').value        = emp.mobile || '';
    document.getElementById('empEmail').value         = emp.email || '';
    document.getElementById('empWebsite').value       = emp.website || '';
    document.getElementById('empAddress').value       = emp.address || '';
    document.getElementById('empWhatsapp').value      = emp.whatsapp || '';
    document.getElementById('empFacebook').value      = emp.facebook || '';
    document.getElementById('empLinkedin').value      = emp.linkedin || '';
    document.getElementById('empInstagram').value     = emp.instagram || '';
    document.getElementById('empCatalogueLink').value = emp.catalogueLink || '';

    if (emp.photoURL) {
      const preview     = document.getElementById('photoPreview');
      const placeholder = document.getElementById('photoPlaceholder');
      preview.src       = emp.photoURL;
      preview.style.display = 'block';
      if (placeholder) placeholder.style.display = 'none';
    }

    document.getElementById('modalTitle').textContent = 'Edit Employee';
    openModal('empModal');
  } catch (err) {
    showToast('Error loading employee: ' + err.message, 'error');
  }
}

// ============================================
// DELETE EMPLOYEE
// ============================================

async function deleteEmployee(id, name) {
  if (!confirm(`Are you sure you want to delete "${name}"? This cannot be undone.`)) return;

  try {
    await db.collection(EMPLOYEES_COL).doc(id).delete();

    // Also try to delete files from Storage (non-fatal if they don't exist)
    try {
      await storage.ref(`employees/${id}/photo`).delete();
    } catch (_) {}
    try {
      await storage.ref(`employees/${id}/logo`).delete();
    } catch (_) {}

    showToast('Employee deleted.', 'success');
  } catch (err) {
    showToast('Error deleting employee: ' + err.message, 'error');
  }
}

// ============================================
// QR MODAL
// ============================================

function showQR(id) {
  // Fetch from the already-rendered table (no extra DB call needed)
  const row     = document.querySelector(`[onclick="showQR('${id}')"]`)?.closest('tr');
  const empName = row ? row.querySelector('.emp-name')?.textContent : id;
  const cardUrl = getCardUrl(id);
  const qrUrl   = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(cardUrl)}&color=3d0009&bgcolor=ffffff`;

  document.getElementById('qrEmpName').textContent     = empName || '';
  document.getElementById('qrImage').src               = qrUrl;
  document.getElementById('qrCardUrl').textContent     = cardUrl;
  document.getElementById('qrCardUrlHidden').value     = cardUrl;

  openModal('qrModal');
}

async function downloadQR() {
  const img = document.getElementById('qrImage');
  try {
    const resp = await fetch(img.src);
    const blob = await resp.blob();
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    const name = document.getElementById('qrEmpName').textContent.replace(/\s+/g, '_');
    a.download = `${name}_QR.png`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('QR downloaded!', 'success');
  } catch {
    showToast('Download failed. Right-click QR to save.', 'error');
  }
}

function copyQRLink() {
  copyLink(document.getElementById('qrCardUrlHidden').value);
}

// ============================================
// HELPERS
// ============================================

function copyLink(url) {
  navigator.clipboard.writeText(url)
    .then(() => showToast('Link copied to clipboard!', 'success'))
    .catch(() => {
      const ta = document.createElement('textarea');
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      showToast('Link copied!', 'success');
    });
}

function openModal(id) {
  const m = document.getElementById(id);
  if (m) m.classList.add('active');
}

function closeModal(id) {
  const m = document.getElementById(id);
  if (m) {
    m.classList.remove('active');
    if (id === 'empModal') resetForm();
  }
}

function resetForm() {
  const form = document.getElementById('empForm');
  if (form) form.reset();
  document.getElementById('empId').value = '';
  document.getElementById('modalTitle').textContent = 'Add New Employee';
  const preview     = document.getElementById('photoPreview');
  const placeholder = document.getElementById('photoPlaceholder');
  if (preview)     { preview.style.display = 'none'; preview.src = ''; }
  if (placeholder)   placeholder.style.display = 'flex';
  const logoPrev = document.getElementById('logoPreviewImg');
  if (logoPrev)  { logoPrev.style.display = 'none'; logoPrev.src = ''; }
}

function showToast(msg, type = 'success') {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent  = (type === 'success' ? '✅ ' : '❌ ') + msg;
  toast.className    = 'toast show ' + type;
  setTimeout(() => { toast.className = 'toast'; }, 3500);
}

function escHtml(s) {
  if (!s) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
