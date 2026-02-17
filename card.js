// ============================================
// MRK Foods - Public Card Logic
// NO authentication required
// ============================================

const STORAGE_KEY = 'mrk_employees';

function getEmployees() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch { return []; }
}

function getIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

function escHtml(s) {
  if (!s) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function initCard() {
  const id = getIdFromUrl();
  if (!id) { showError('No employee ID specified.'); return; }

  const emps = getEmployees();
  const emp = emps.find(e => e.id === id);
  if (!emp) { showError('Employee card not found. Please check the link.'); return; }

  renderCard(emp);
}

function renderCard(emp) {
  // Hide error, show card
  document.getElementById('errorState').style.display = 'none';
  const card = document.getElementById('digitalCard');
  card.style.display = 'block';

  // Company Logo
  const logoImg = document.getElementById('cardLogo');
  if (emp.logo) {
    logoImg.src = emp.logo;
    logoImg.style.display = 'block';
  } else {
    // try default logo path
    logoImg.src = 'mrk_logo.jpg';
    logoImg.onerror = function() { this.style.display = 'none'; };
    logoImg.style.display = 'block';
  }

  // Employee Photo
  const photoEl = document.getElementById('cardPhoto');
  const photoPlaceholder = document.getElementById('cardPhotoPlaceholder');
  if (emp.photo) {
    photoEl.src = emp.photo;
    photoEl.style.display = 'block';
    photoPlaceholder.style.display = 'none';
  } else {
    photoEl.style.display = 'none';
    const initials = emp.name ? emp.name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase() : '?';
    photoPlaceholder.textContent = initials;
    photoPlaceholder.style.display = 'flex';
  }

  // Name & Designation
  document.getElementById('cardName').textContent = emp.name || '';
  document.getElementById('cardDesignation').textContent = emp.designation || '';

  // Contact Info
  const contactList = document.getElementById('contactList');
  let contactHTML = '';
  if (emp.mobile) {
    contactHTML += `<li class="contact-item"><div class="contact-icon phone">📞</div><div class="contact-text"><a href="tel:${escHtml(emp.mobile)}">${escHtml(emp.mobile)}</a></div></li>`;
  }
  if (emp.email) {
    contactHTML += `<li class="contact-item"><div class="contact-icon email">✉️</div><div class="contact-text"><a href="mailto:${escHtml(emp.email)}">${escHtml(emp.email)}</a></div></li>`;
  }
  if (emp.website) {
    let url = emp.website;
    if (!url.startsWith('http')) url = 'https://' + url;
    contactHTML += `<li class="contact-item"><div class="contact-icon web">🌐</div><div class="contact-text"><a href="${escHtml(url)}" target="_blank">${escHtml(emp.website)}</a></div></li>`;
  }
  if (emp.address) {
    contactHTML += `<li class="contact-item"><div class="contact-icon address">📍</div><div class="contact-text">${escHtml(emp.address)}</div></li>`;
  }
  contactList.innerHTML = contactHTML;

  // WhatsApp button
  const waBtn = document.getElementById('btnWhatsapp');
  if (emp.whatsapp || emp.mobile) {
    const waNum = (emp.whatsapp || emp.mobile).replace(/[^0-9]/g, '');
    waBtn.href = `https://wa.me/${waNum}`;
    waBtn.style.display = 'flex';
  } else {
    waBtn.style.display = 'none';
  }

  // Call button
  const callBtn = document.getElementById('btnCall');
  if (emp.mobile) {
    callBtn.href = `tel:${emp.mobile}`;
    callBtn.style.display = 'flex';
  } else {
    callBtn.style.display = 'none';
  }

  // Email button
  const emailBtn = document.getElementById('btnEmail');
  if (emp.email) {
    emailBtn.href = `mailto:${emp.email}`;
    emailBtn.style.display = 'flex';
  } else {
    emailBtn.style.display = 'none';
  }

  // Save Contact (vCard)
  document.getElementById('btnSave').onclick = function() { saveContact(emp); };

  // Share button
  document.getElementById('btnShare').onclick = function() { shareCard(emp); };

  // Catalogue button
  const catBtn = document.getElementById('btnCatalogue');
  if (emp.catalogueLink) {
    let catUrl = emp.catalogueLink;
    if (!catUrl.startsWith('http')) catUrl = 'https://' + catUrl;
    catBtn.href = catUrl;
    catBtn.style.display = 'flex';
  } else {
    catBtn.style.display = 'none';
  }

  // Social Links
  const fbBtn = document.getElementById('socialFb');
  const lnBtn = document.getElementById('socialLn');
  const igBtn = document.getElementById('socialIg');
  const wasSocial = document.getElementById('socialWa');

  if (emp.facebook) { fbBtn.href = emp.facebook; fbBtn.style.display = 'flex'; } else { fbBtn.style.display = 'none'; }
  if (emp.linkedin) { lnBtn.href = emp.linkedin; lnBtn.style.display = 'flex'; } else { lnBtn.style.display = 'none'; }
  if (emp.instagram) { igBtn.href = emp.instagram; igBtn.style.display = 'flex'; } else { igBtn.style.display = 'none'; }
  if (emp.whatsapp || emp.mobile) {
    const waNum = (emp.whatsapp || emp.mobile).replace(/[^0-9]/g, '');
    wasSocial.href = `https://wa.me/${waNum}`;
    wasSocial.style.display = 'flex';
  } else {
    wasSocial.style.display = 'none';
  }

  // QR Code
  const cardUrl = window.location.href;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(cardUrl)}&color=3d0009&bgcolor=ffffff&qzone=1`;
  document.getElementById('cardQR').src = qrUrl;
}

// ---- Save Contact as vCard ----
function saveContact(emp) {
  const vcard = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${emp.name || ''}`,
    `N:${(emp.name || '').split(' ').reverse().join(';')}`,
    emp.mobile ? `TEL;TYPE=CELL:${emp.mobile}` : '',
    emp.email ? `EMAIL:${emp.email}` : '',
    emp.website ? `URL:${emp.website}` : '',
    emp.designation ? `TITLE:${emp.designation}` : '',
    'ORG:MRK Foods Private Limited',
    emp.address ? `ADR;TYPE=WORK:;;${emp.address}` : '',
    'END:VCARD'
  ].filter(Boolean).join('\r\n');

  const blob = new Blob([vcard], { type: 'text/vcard' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${(emp.name || 'contact').replace(/\s+/g, '_')}.vcf`;
  a.click();
  URL.revokeObjectURL(url);
}

// ---- Share Card ----
async function shareCard(emp) {
  const cardUrl = window.location.href;
  if (navigator.share) {
    try {
      await navigator.share({
        title: `${emp.name} - MRK Foods Private Limited`,
        text: `Contact card for ${emp.name}, ${emp.designation || ''}`,
        url: cardUrl
      });
    } catch {}
  } else {
    navigator.clipboard.writeText(cardUrl).then(() => {
      alert('Card link copied to clipboard!');
    }).catch(() => {
      prompt('Copy this link:', cardUrl);
    });
  }
}

// ---- Show Error ----
function showError(msg) {
  document.getElementById('errorState').style.display = 'flex';
  document.getElementById('errorMsg').textContent = msg;
  const card = document.getElementById('digitalCard');
  if (card) card.style.display = 'none';
}

// Init
document.addEventListener('DOMContentLoaded', initCard);
