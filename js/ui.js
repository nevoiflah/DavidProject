// View switching
function switchView(viewName) {
  const isAuth = sessionStorage.getItem('partner_admin_auth') === 'true';
  if (!isAuth && !state.isCustomerFillMode && viewName === 'mapper') {
    state.redirectTarget = { view: viewName, key: state.activeTemplate };
    viewName = 'login';
  }

  state.activeView = viewName;

  // Update document title per view
  const viewTitles = {
    'dashboard':   'Partner Digital Forms - לוח בקרה',
    'login':       'Partner Digital Forms - כניסת מנהל',
    'mapper':      'Partner Digital Forms - עורך מיפוי',
    'form-filler': 'Partner Digital Forms - מילוי טופס',
    'success':     'Partner Digital Forms - הטופס נחתם'
  };
  document.title = viewTitles[viewName] || 'Partner Digital Forms';

  document.querySelectorAll('.btn-nav').forEach(btn => btn.classList.remove('active'));
  const activeNavBtn = document.getElementById(`nav-${viewName}`);
  if (activeNavBtn) activeNavBtn.classList.add('active');

  document.querySelectorAll('.view-panel').forEach(panel => panel.classList.add('hidden'));
  document.getElementById(`view-${viewName}`).classList.remove('hidden');

  const navEl = document.querySelector('header nav');
  if (navEl) {
    navEl.style.display = state.isCustomerFillMode ? 'none' : 'flex';
  }

  toggleAdminControls();
  lucide.createIcons();
}

function toggleAdminControls() {
  const isAuth = sessionStorage.getItem('partner_admin_auth') === 'true';

  const navLogin  = document.getElementById('nav-login');
  const navLogout = document.getElementById('nav-logout');
  if (navLogin)  navLogin.style.display  = isAuth ? 'none'        : 'inline-flex';
  if (navLogout) navLogout.style.display = isAuth ? 'inline-flex' : 'none';

  document.querySelectorAll('.btn-admin-only').forEach(el => {
    el.style.display = isAuth ? 'inline-flex' : 'none';
  });

  // Drives client-only CSS (e.g. lone fill button spanning full card width)
  document.body.classList.toggle('is-admin', isAuth);

  const adminToolbar = document.getElementById('admin-global-toolbar');
  if (adminToolbar) adminToolbar.style.display = isAuth ? 'flex' : 'none';

  const onboardingPanel = document.getElementById('client-onboarding-panel');
  const contentArea     = document.getElementById('dashboard-content-area');
  const activeClientBar = document.getElementById('active-client-bar');

  if (isAuth) {
    if (onboardingPanel) onboardingPanel.style.display = 'none';
    if (contentArea)     contentArea.style.display     = 'block';
    if (activeClientBar) activeClientBar.style.display = 'none';
  } else {
    if (state.clientName) {
      if (onboardingPanel) onboardingPanel.style.display = 'none';
      if (contentArea)     contentArea.style.display     = 'block';
      if (activeClientBar) activeClientBar.style.display = 'flex';
      const display = document.getElementById('active-client-display');
      if (display) display.textContent = state.clientName;
    } else {
      if (onboardingPanel) onboardingPanel.style.display = 'block';
      if (contentArea)     contentArea.style.display     = 'none';
      if (activeClientBar) activeClientBar.style.display = 'none';
    }
  }
}

// Set client name for the session
window.setSessionClientName = function() {
  const input = document.getElementById('onboarding-client-name');
  const name  = input ? input.value.trim() : "";
  if (!name) {
    showToast("אנא הזן את שם הלקוח / שם החברה", "warning");
    return;
  }
  state.clientName = name;
  localStorage.setItem('currentCustomerName', name);

  const onboardingPanel = document.getElementById('client-onboarding-panel');
  const contentArea     = document.getElementById('dashboard-content-area');
  const activeClientBar = document.getElementById('active-client-bar');

  if (onboardingPanel) onboardingPanel.style.display = 'none';
  if (contentArea)     contentArea.style.display     = 'block';
  if (activeClientBar) activeClientBar.style.display = 'flex';

  const display = document.getElementById('active-client-display');
  if (display) display.textContent = name;

  if (state.directFillTemplate) {
    const tplKey = state.directFillTemplate;
    state.directFillTemplate = null;
    openFormFiller(tplKey);
  }
};

// Reset / change client name
window.resetSessionClientName = function() {
  state.clientName = "";
  localStorage.removeItem('currentCustomerName');
  state.directFillTemplate = null;

  const input = document.getElementById('onboarding-client-name');
  if (input) input.value = "";

  const onboardingPanel = document.getElementById('client-onboarding-panel');
  const contentArea     = document.getElementById('dashboard-content-area');
  const activeClientBar = document.getElementById('active-client-bar');

  if (onboardingPanel) onboardingPanel.style.display = 'block';
  if (contentArea)     contentArea.style.display     = 'none';
  if (activeClientBar) activeClientBar.style.display = 'none';
};

// Accordion toggle
window.toggleGroupAccordion = function(groupId) {
  const body    = document.getElementById('body-' + groupId);
  const chevron = document.getElementById('chevron-' + groupId);
  if (body && chevron) {
    const isHidden = body.style.display === 'none';
    body.style.display    = isHidden ? 'block' : 'none';
    chevron.style.transform = isHidden ? 'rotate(0deg)' : 'rotate(180deg)';
  }
};

// Clean up all state and DOM after leaving mapper/filler/success views
function goBackToDashboard() {
  try {
    state.isCustomerFillMode = false;
    switchView('dashboard');
  } catch (viewErr) {
    console.error("Error switching view:", viewErr);
  }

  try {
    if (state.signedPdfBlobUrl) {
      URL.revokeObjectURL(state.signedPdfBlobUrl);
      state.signedPdfBlobUrl = null;
    }
    state.signedPdfBytes = null;
    state.uploadedFileUrl = "";
    state.currentEditingSubmissionId = null;
    state.currentEditingSubmission   = null;

    const previewFrame = document.getElementById('signed-pdf-preview-frame');
    if (previewFrame) previewFrame.src = "about:blank";
  } catch (pdfCleanErr) {
    console.error("Error cleaning PDF data:", pdfCleanErr);
  }

  try {
    if (activeSignaturePads && Array.isArray(activeSignaturePads)) {
      activeSignaturePads.forEach(pad => {
        const sPad = pad.signaturePad || pad.padInstance || pad.instance;
        if (sPad && typeof sPad.clear === 'function') sPad.clear();
        pad.isEmpty = true;
      });
    }
  } catch (padErr) {
    console.warn("Could not clear signature pads:", padErr);
  }

  try {
    const formWrapper = document.getElementById('filler-pdf-renderer-wrapper');
    if (formWrapper) {
      formWrapper.querySelectorAll('input[type="text"]').forEach(input => input.value = "");
      formWrapper.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
    }
  } catch (formCleanErr) {
    console.error("Error resetting form inputs:", formCleanErr);
  }
}

// Persist all template data to IndexedDB, and push field definitions to the server if admin
async function saveStateToDB() {
  for (const [key, val] of Object.entries(state.templates)) {
    const templateData = {
      fields:          val.fields,
      isImageTemplate: val.isImageTemplate,
      pdfBytes:        val.pdfBytes,
      images:          val.images
    };
    await dbHelper.save(key, templateData);
  }

  // If the admin is logged in, also push field definitions to the shared server store
  const isAdmin = sessionStorage.getItem('partner_admin_auth') === 'true';
  if (isAdmin) {
    syncAllMappingsToServer();
  }
}

// Push every template's field definitions to the Netlify serverless store.
// Only the fields array is synced (not the large image buffers — those come from the bundle).
async function syncAllMappingsToServer() {
  for (const [key, val] of Object.entries(state.templates)) {
    if (!val.fields || val.fields.length === 0) continue;
    try {
      await fetch('/.netlify/functions/sync-mapping', {
        method:  'POST',
        headers: {
          'Content-Type':      'application/json',
          'x-admin-password':  'PartnerAdmin2026!'
        },
        // Tag the sync with the current PDF version so the loader can tell a
        // current mapping from a stale pre-update one (ownership forms).
        body: JSON.stringify({ template: key, fields: val.fields, version: OWNERSHIP_PDF_VERSION })
      });
    } catch (err) {
      console.warn(`Could not sync "${key}" to server:`, err);
    }
  }
}

// Maps each template key to its bundled PDF asset key in PDF_ASSETS
// Ownership templates intentionally omitted — they load their updated per-form
// PDFs via loadOwnershipPdfsFromFile() instead of the bundled PDF_OWNERSHIP asset.
const TEMPLATE_ASSET_MAP = {
  'portability':         'PDF_NIYUD',
  'ide-terms-agreement': 'PDF_TAKANON'
};

// Load raw PDF bytes from the bundle into a template so it can render immediately.
// This lets the filler open via PDF.js without waiting for the 15-40s image conversion.
function loadPdfBytesFromBundle(templateKey) {
  const tpl      = state.templates[templateKey];
  const assetKey = TEMPLATE_ASSET_MAP[templateKey];
  if (!tpl || !assetKey) return;
  if (tpl.pdfBytes || (tpl.images && tpl.images.length > 0)) return; // already has content
  if (typeof PDF_ASSETS === 'undefined' || !PDF_ASSETS[assetKey]) return;

  tpl.pdfBytes        = base64ToArrayBuffer(PDF_ASSETS[assetKey]);
  tpl.isImageTemplate = false;
}

// Pull field definitions from the server and apply them as the source of truth,
// overwriting the local copy so synced changes reach every device. Also loads raw
// PDF bytes from the bundle so forms are immediately usable without waiting for
// the background image conversion.
async function loadMappingsFromServer() {
  try {
    const response = await fetch('/.netlify/functions/sync-mapping');
    if (!response.ok) return;

    const serverData = await response.json();
    let anyUpdated = false;

    for (const [key, data] of Object.entries(serverData)) {
      if (!data || !data.fields || data.fields.length === 0) continue;
      // Ownership server mappings are only honored when they were synced for the
      // CURRENT PDF version. Anything older (or version-less) is stale pre-update
      // data — skip it and let the bundled default-mappings apply instead.
      if ((key === 'ownership_seller' || key === 'ownership_buyer') && data.version !== OWNERSHIP_PDF_VERSION) continue;

      const tpl = state.templates[key];
      if (!tpl) continue;

      // Server is the source of truth — overwrite the local copy so a synced
      // mapping change propagates to every device on the next load.
      tpl.fields = data.fields;

      // Load PDF bytes from bundle so the fill button enables and filler renders instantly
      loadPdfBytesFromBundle(key);

      await dbHelper.save(key, {
        fields:          tpl.fields,
        isImageTemplate: tpl.isImageTemplate,
        pdfBytes:        tpl.pdfBytes,
        images:          tpl.images
      });
      updateTemplateCardStatus(key);
      anyUpdated = true;
    }

    if (anyUpdated) {
      console.log('Field mappings loaded from server — forms ready to fill.');
    }
  } catch (err) {
    // Silently ignore — server may not be available (e.g. local file:// usage)
    console.warn('Could not load mappings from server:', err);
  }
}

// Apply embedded default mappings (from js/default-mappings.js) for any template
// that has no local fields. This is the most reliable cross-device fallback —
// it requires no network call and works on every browser including mobile.
function loadDefaultMappings() {
  if (typeof DEFAULT_FIELD_MAPPINGS === 'undefined') return; // file not deployed yet

  let anyApplied = false;
  for (const [key, data] of Object.entries(DEFAULT_FIELD_MAPPINGS)) {
    if (!data || !data.fields || data.fields.length === 0) continue;
    const tpl = state.templates[key];
    if (!tpl || (tpl.fields && tpl.fields.length > 0)) continue; // don't overwrite

    tpl.fields = data.fields;
    loadPdfBytesFromBundle(key);
    updateTemplateCardStatus(key);
    anyApplied = true;
  }
  if (anyApplied) console.log('Default field mappings applied from bundle.');
}

// Generate and download js/default-mappings.js containing all current field definitions.
// Admin drops this file into the project and redeploys — all users get the fields instantly.
function exportDefaultMappingsFile() {
  const output = {};
  for (const [key, tpl] of Object.entries(state.templates)) {
    if (tpl.fields && tpl.fields.length > 0) {
      output[key] = { fields: tpl.fields };
    }
  }

  if (Object.keys(output).length === 0) {
    showToast("אין מיפויים שמורים לייצוא. אנא מפה שדות תחילה.", "warning");
    return;
  }

  const js = `// Auto-generated default field mappings — produced by the admin panel.\n// Drop this file into js/ and redeploy to Netlify.\nconst DEFAULT_FIELD_MAPPINGS = ${JSON.stringify(output, null, 2)};\n`;

  const blob = new Blob([js], { type: 'text/javascript' });
  const link = document.createElement('a');
  link.href     = URL.createObjectURL(blob);
  link.download = 'default-mappings.js';
  link.click();
  showToast("קובץ default-mappings.js הורד. הכנס אותו לתיקיית js/ ופרס מחדש.", "success");
}

// Restore all template data from IndexedDB on load
async function loadStateFromDB() {
  for (const key of Object.keys(state.templates)) {
    try {
      const val = await dbHelper.load(key);
      if (val) {
        state.templates[key].fields          = val.fields          || [];
        state.templates[key].isImageTemplate = val.isImageTemplate || false;
        state.templates[key].pdfBytes        = val.pdfBytes        || null;
        state.templates[key].images          = val.images          || [];
        updateTemplateCardStatus(key);
      }
    } catch (e) {
      console.error("Error loading template from IndexedDB", key, e);
    }
  }

  state.clientName = localStorage.getItem('currentCustomerName') || "";
}

function updateTemplateCardStatus(templateKey) {
  const badge   = document.getElementById(`badge-${templateKey}`);
  const fillBtn = document.getElementById(`btn-fill-${templateKey}`);
  const tpl     = state.templates[templateKey];

  const hasContent = tpl.pdfBytes || (tpl.images && tpl.images.length > 0);

  if (hasContent && tpl.fields.length > 0) {
    badge.textContent = tpl.isImageTemplate ? "מוכן לשימוש (תמונות)" : "מוכן לשימוש (PDF)";
    badge.className   = 'card-badge badge-ready';
    fillBtn.classList.remove('btn-disabled');
    fillBtn.removeAttribute('disabled');
  } else if (hasContent) {
    badge.textContent = "רקע הועלה (טרם מופה)";
    badge.className   = 'card-badge badge-pending';
    fillBtn.classList.add('btn-disabled');
    fillBtn.setAttribute('disabled', 'true');
  } else {
    badge.textContent = "ממתין להעלאת רקע";
    badge.className   = 'card-badge badge-pending';
    fillBtn.classList.add('btn-disabled');
    fillBtn.setAttribute('disabled', 'true');
  }
}

// Toast notification
function showToast(message, type = 'info') {
  const toast = document.getElementById('toast-notification');
  toast.className = `toast toast-${type} show`;
  toast.textContent = message;
  setTimeout(() => toast.classList.remove('show'), 4000);
}
