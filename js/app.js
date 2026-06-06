// Initialize EmailJS
emailjs.init(EMAILJS_PUBLIC_KEY);

// Configure PDF.js Worker
if (window.location.protocol === 'file:') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = '';
} else {
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
}

document.addEventListener("DOMContentLoaded", async () => {
  lucide.createIcons();

  // Navigation
  document.getElementById('nav-dashboard').addEventListener('click', () => switchView('dashboard'));
  document.getElementById('nav-login')?.addEventListener('click', () => switchView('login'));
  document.getElementById('nav-logout')?.addEventListener('click', () => handleLogout());
  document.getElementById('btn-login-back')?.addEventListener('click', () => switchView('dashboard'));

  // Dashboard card actions: map + fill
  document.querySelectorAll('[data-action="map"]').forEach(btn => {
    btn.addEventListener('click', () => openMapper(btn.dataset.template));
  });
  document.querySelectorAll('[data-action="fill"]').forEach(btn => {
    btn.addEventListener('click', () => openFormFiller(btn.dataset.template));
  });

  // Sidebar accordions
  document.querySelectorAll('[data-action="toggle-accordion"]').forEach(btn => {
    btn.addEventListener('click', () => toggleGroupAccordion(btn.dataset.target));
  });

  // Preset field creation buttons
  document.querySelectorAll('.preset-field-btn').forEach(btn => {
    btn.addEventListener('click', () => addNewPresetField(btn.dataset.presetType, btn.dataset.presetLabel, btn.dataset.presetName));
  });

  // File upload triggers
  document.getElementById('btn-trigger-append-pdf')?.addEventListener('click', () => document.getElementById('append-pdf-input').click());
  document.getElementById('btn-trigger-pdf-upload')?.addEventListener('click', () => document.getElementById('pdf-file-input').click());

  // Mapper footer
  document.getElementById('btn-save-mapping')?.addEventListener('click', () => saveCurrentMapping());
  document.getElementById('btn-cancel-mapper')?.addEventListener('click', () => {
    if (confirmLeaveMapper()) goBackToDashboard();
  });

  // Form filler footer
  document.getElementById('btn-submit-inline-form')?.addEventListener('click', () => submitInlineForm());
  document.getElementById('btn-cancel-inline-form')?.addEventListener('click', () => goBackToDashboard());

  // Success screen
  document.getElementById('btn-download-signed-pdf')?.addEventListener('click', () => downloadSignedPdf());
  document.getElementById('btn-success-back')?.addEventListener('click', () => goBackToDashboard());

  // Field modal
  document.getElementById('btn-close-modal-x')?.addEventListener('click', () => closeFieldModal());
  document.getElementById('btn-close-modal-cancel')?.addEventListener('click', () => closeFieldModal());
  document.getElementById('btn-save-field-modal')?.addEventListener('click', () => saveFieldModalDetails());

  // Quick-add context menu
  document.querySelectorAll('[data-action="quick-add"]').forEach(btn => {
    btn.addEventListener('click', () => triggerQuickFieldAdd(btn.dataset.type));
  });

  // Dismiss quick-menu on outside click
  document.addEventListener('click', (e) => {
    const popup = document.getElementById('quick-menu-popup');
    if (popup && !popup.classList.contains('hidden') && !popup.contains(e.target)) {
      popup.classList.add('hidden');
    }
  });

  // Onboarding
  const onboardingInput = document.getElementById('onboarding-client-name');
  if (onboardingInput) {
    if (state.clientName) onboardingInput.value = state.clientName;
    onboardingInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') setSessionClientName();
    });
  }
  document.getElementById('btn-set-session-client')?.addEventListener('click', () => setSessionClientName());
  document.getElementById('btn-reset-session-client')?.addEventListener('click', () => resetSessionClientName());

  // Login form
  document.getElementById('login-form')?.addEventListener('submit', handleLogin);

  // File inputs
  document.getElementById('append-pdf-input')?.addEventListener('change', handleAppendPdf);
  document.getElementById('pdf-file-input')?.addEventListener('change', handlePdfUpload);

  // Admin config import
  const importInput   = document.getElementById('import-config-input');
  const importTrigger = document.getElementById('btn-import-config-trigger');
  importInput?.addEventListener('change', (e) => { if (e.target.files[0]) importTemplateConfig(e.target.files[0]); });
  importTrigger?.addEventListener('click', () => importInput?.click());

  // Export default-mappings.js button
  document.getElementById('btn-export-default-mappings')?.addEventListener('click', () => {
    exportDefaultMappingsFile();
  });

  // Manual server sync button
  document.getElementById('btn-sync-to-server')?.addEventListener('click', async () => {
    const btn = document.getElementById('btn-sync-to-server');
    if (btn) { btn.disabled = true; btn.innerHTML = '<i data-lucide="loader" style="width:14px;height:14px;" class="spin-icon"></i> מסנכרן...'; lucide.createIcons(); }
    await syncAllMappingsToServer();
    showToast("המיפויים סונכרנו לשרת בהצלחה!", "success");
    if (btn) { btn.disabled = false; btn.innerHTML = '<i data-lucide="cloud-upload" style="width:14px;height:14px;"></i> סנכרן מיפויים לשרת'; lucide.createIcons(); }
  });

  // Share modal
  document.getElementById('btn-close-share-modal-x')?.addEventListener('click',  () => document.getElementById('share-modal').classList.add('hidden'));
  document.getElementById('btn-close-share-modal-ok')?.addEventListener('click', () => document.getElementById('share-modal').classList.add('hidden'));
  document.getElementById('btn-copy-share-link')?.addEventListener('click', () => {
    const input = document.getElementById('share-link-input');
    if (input) {
      input.select();
      input.setSelectionRange(0, 99999);
      navigator.clipboard.writeText(input.value)
        .then(() => showToast("הקישור הועתק ללוח!", "success"))
        .catch(() => showToast("שגיאה בהעתקת הקישור", "error"));
    }
  });

  // Dashboard card: export & share (direct binding for reliability)
  document.querySelectorAll('[data-action="export-json"]').forEach(btn => {
    btn.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); exportTemplateConfig(btn.dataset.template); });
  });
  document.querySelectorAll('[data-action="share-link"]').forEach(btn => {
    btn.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); shareTemplateConfig(btn.dataset.template); });
  });

  // Event delegation: mapped fields list
  document.getElementById('mapped-fields-list')?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const { action, id } = btn.dataset;
    if (action === 'edit-field')   editFieldProperties(id);
    else if (action === 'delete-field') deleteField(id);
  });

  // Event delegation: pages list
  document.getElementById('document-pages-list')?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action="delete-page"]');
    if (btn) deletePage(parseInt(btn.dataset.pageIndex));
  });

  // 1. Load whatever this browser already has saved locally
  await loadStateFromDB();

  // Migration: if ide-terms-agreement was previously saved as the programmatic PDF
  // (pdfBytes non-null = auto-generated), clear it so the real תקנון file loads instead.
  const ideTpl = state.templates['ide-terms-agreement'];
  if (ideTpl && ideTpl.pdfBytes) {
    ideTpl.pdfBytes        = null;
    ideTpl.images          = [];
    ideTpl.isImageTemplate = false;
    ideTpl.fields          = [];
    await dbHelper.save('ide-terms-agreement', { fields: [], isImageTemplate: false, pdfBytes: null, images: [] });
    console.log('Cleared stale auto-generated IDE template — will reload from תקנון PDF.');
  }

  // 2. Pull admin-saved field definitions from the Netlify server — the source of truth.
  //    Overwrites the local copy so synced mapping changes propagate to every device.
  await loadMappingsFromServer();

  // 3. Apply bundled default field positions only for templates the server has nothing for
  loadDefaultMappings();

  // 4. Convert bundled PDFs to images for any template that still has no background
  await autoPreloadPdfTemplates();
  await autoInitializeIDETemplate();

  // Restore onboarding input if name already set
  if (onboardingInput && state.clientName) onboardingInput.value = state.clientName;

  // Handle URL parameters: ?fill=<template> and ?config=<url>
  const urlParams = new URLSearchParams(window.location.search);
  const fillParam = urlParams.get('fill');

  await loadConfigFromUrlParam();

  if (fillParam && state.templates[fillParam]) {
    state.isCustomerFillMode = true;
    if (state.clientName) {
      openFormFiller(fillParam);
    } else {
      state.directFillTemplate = fillParam;
      switchView('dashboard');
    }
  } else {
    state.isCustomerFillMode = false;
    switchView('dashboard');
  }
});
