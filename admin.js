// ============================================
// MRK Foods - Admin Panel Logic
// ============================================

const ADMIN_USER = 'admin';
const ADMIN_PASS = 'admin123';
const STORAGE_KEY = 'mrk_employees';

// ---- AUTH ----
function login() {
  const u = document.getElementById('username').value.trim();
  const p = document.getElementById('password').value;
  const err = document.getElementById('loginError');
  if (u === ADMIN_USER && p === ADMIN_PASS) {
    sessionStorage.setItem('mrk_admin', '1');
    window.location.href = 'dashboard.html';
  } else {
    err.textContent = 'Invalid credentials. Please try again.';
    err.style.display = 'block';
    document.getElementById('password').value = '';
  }
}

function checkAuth() {
  if (!sessionStorage.getItem('mrk_admin')) {
    window.location.href = 'index.html';
  }
}

function logout() {
  sessionStorage.removeItem('mrk_admin');
  window.location.href = 'index.html';
}

// ---- EMPLOYEE STORAGE ----
function getEmployees() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch { return []; }
}

function saveEmployees(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function generateId() {
  return 'emp' + Date.now();
}

// ---- IMAGE HELPERS ----
function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ---- DASHBOARD INIT ----
function initDashboard() {
  checkAuth();
  renderEmployeeList();
  updateStats();

  // Photo preview
  const photoInput = document.getElementById('empPhoto');
  if (photoInput) {
    photoInput.addEventListener('change', async function () {
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
    logoInput.addEventListener('change', async function () {
      if (this.files[0]) {
        const data = await readFileAsDataURL(this.files[0]);
        const preview = document.getElementById('logoPreviewImg');
        if (preview) { preview.src = data; preview.style.display = 'block'; }
      }
    });
  }
}

function updateStats() {
  const emps = getEmployees();
  const el = document.getElementById('statTotal');
  if (el) el.textContent = emps.length;
}

// ---- RENDER LIST ----
function renderEmployeeList() {
  const emps = getEmployees();
  const tbody = document.getElementById('empTableBody');
  const empty = document.getElementById('emptyState');
  if (!tbody) return;

  if (emps.length === 0) {
    tbody.innerHTML = '';
    if (empty) empty.style.display = 'block';
    return;
  }
  if (empty) empty.style.display = 'none';

  tbody.innerHTML = emps.map(emp => {
    const initials = emp.name ? emp.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '?';
    const avatar = emp.photo
      ? `<img src="${emp.photo}" class="emp-avatar" alt="${emp.name}">`
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
            <button onclick="deleteEmployee('${emp.id}')" class="btn btn-danger btn-sm">🗑️ Delete</button>
          </div>
        </td>
      </tr>`;
  }).join('');
}

function getCardUrl(id) {
  const base = window.location.origin + window.location.pathname.replace('dashboard.html', '');
  return `${base}card.html?id=${id}`;
}

// ---- CREATE / SAVE EMPLOYEE ----
async function saveEmployee() {
  const id = document.getElementById('empId').value || generateId();
  const name = document.getElementById('empName').value.trim();
  const designation = document.getElementById('empDesignation').value.trim();
  const mobile = document.getElementById('empMobile').value.trim();
  const email = document.getElementById('empEmail').value.trim();
  const website = document.getElementById('empWebsite').value.trim();
  const address = document.getElementById('empAddress').value.trim();
  const whatsapp = document.getElementById('empWhatsapp').value.trim();
  const facebook = document.getElementById('empFacebook').value.trim();
  const linkedin = document.getElementById('empLinkedin').value.trim();
  const instagram = document.getElementById('empInstagram').value.trim();
  const catalogueLink = document.getElementById('empCatalogueLink').value.trim();

  if (!name) { showToast('Employee name is required', 'error'); return; }

  const emps = getEmployees();
  const existingIdx = emps.findIndex(e => e.id === id);

  let photo = existingIdx >= 0 ? emps[existingIdx].photo : null;
  let logo = existingIdx >= 0 ? emps[existingIdx].logo : null;

  // Handle photo upload
  const photoInput = document.getElementById('empPhoto');
  if (photoInput && photoInput.files[0]) {
    photo = await readFileAsDataURL(photoInput.files[0]);
  }

  // Handle logo override
  const logoInput = document.getElementById('companyLogoOverride');
  if (logoInput && logoInput.files[0]) {
    logo = await readFileAsDataURL(logoInput.files[0]);
  }

  const emp = { id, name, designation, mobile, email, website, address, whatsapp, facebook, linkedin, instagram, catalogueLink, photo, logo, createdAt: existingIdx >= 0 ? emps[existingIdx].createdAt : new Date().toISOString() };

  if (existingIdx >= 0) {
    emps[existingIdx] = emp;
  } else {
    emps.push(emp);
  }

  saveEmployees(emps);
  closeModal('empModal');
  renderEmployeeList();
  updateStats();
  showToast(existingIdx >= 0 ? 'Employee updated successfully!' : 'Employee created successfully!', 'success');
}

// ---- EDIT ----
function editEmployee(id) {
  const emp = getEmployees().find(e => e.id === id);
  if (!emp) return;

  document.getElementById('empId').value = emp.id;
  document.getElementById('empName').value = emp.name || '';
  document.getElementById('empDesignation').value = emp.designation || '';
  document.getElementById('empMobile').value = emp.mobile || '';
  document.getElementById('empEmail').value = emp.email || '';
  document.getElementById('empWebsite').value = emp.website || '';
  document.getElementById('empAddress').value = emp.address || '';
  document.getElementById('empWhatsapp').value = emp.whatsapp || '';
  document.getElementById('empFacebook').value = emp.facebook || '';
  document.getElementById('empLinkedin').value = emp.linkedin || '';
  document.getElementById('empInstagram').value = emp.instagram || '';
  document.getElementById('empCatalogueLink').value = emp.catalogueLink || '';

  if (emp.photo) {
    const preview = document.getElementById('photoPreview');
    const placeholder = document.getElementById('photoPlaceholder');
    preview.src = emp.photo;
    preview.style.display = 'block';
    if (placeholder) placeholder.style.display = 'none';
  }

  document.getElementById('modalTitle').textContent = 'Edit Employee';
  openModal('empModal');
}

// ---- DELETE ----
function deleteEmployee(id) {
  if (!confirm('Are you sure you want to delete this employee card?')) return;
  const emps = getEmployees().filter(e => e.id !== id);
  saveEmployees(emps);
  renderEmployeeList();
  updateStats();
  showToast('Employee deleted.', 'success');
}

// ---- QR MODAL ----
function showQR(id) {
  const emp = getEmployees().find(e => e.id === id);
  if (!emp) return;
  const cardUrl = getCardUrl(id);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(cardUrl)}&color=3d0009&bgcolor=ffffff`;

  document.getElementById('qrEmpName').textContent = emp.name;
  document.getElementById('qrImage').src = qrUrl;
  document.getElementById('qrCardUrl').textContent = cardUrl;
  document.getElementById('qrCardUrlHidden').value = cardUrl;

  openModal('qrModal');
}

async function downloadQR() {
  const img = document.getElementById('qrImage');
  try {
    const resp = await fetch(img.src);
    const blob = await resp.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
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
  const url = document.getElementById('qrCardUrlHidden').value;
  copyLink(url);
}

// ---- HELPERS ----
function copyLink(url) {
  navigator.clipboard.writeText(url).then(() => {
    showToast('Link copied to clipboard!', 'success');
  }).catch(() => {
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
  const modal = document.getElementById(id);
  if (modal) modal.classList.add('active');
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.remove('active');
    if (id === 'empModal') resetForm();
  }
}

function resetForm() {
  const form = document.getElementById('empForm');
  if (form) form.reset();
  document.getElementById('empId').value = '';
  document.getElementById('modalTitle').textContent = 'Add New Employee';
  const preview = document.getElementById('photoPreview');
  const placeholder = document.getElementById('photoPlaceholder');
  if (preview) { preview.style.display = 'none'; preview.src = ''; }
  if (placeholder) placeholder.style.display = 'flex';
}

function showToast(msg, type = 'success') {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = (type === 'success' ? '✅ ' : '❌ ') + msg;
  toast.className = 'toast show ' + type;
  setTimeout(() => { toast.className = 'toast'; }, 3500);
}

function escHtml(s) {
  if (!s) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// Enter key login
document.addEventListener('DOMContentLoaded', function () {
  const passInput = document.getElementById('password');
  if (passInput) {
    passInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') login();
    });
  }
  const userInput = document.getElementById('username');
  if (userInput) {
    userInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') login();
    });
  }
});

// ============================================
// PUBLISH / EXPORT SYSTEM
// Generates employees-data.js for GitHub upload
// ============================================

async function publishCards() {
  try {
    const employees = JSON.parse(localStorage.getItem("MRK_EMPLOYEES") || "[]");

    const response = await fetch("/api/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ employees })
    });

    const result = await response.json();

    if (result.success) {
      alert("Published successfully!");
    } else {
      alert("Publish failed!");
      console.error(result);
    }

  } catch (err) {
    console.error(err);
    alert("Server error");
  }
}

