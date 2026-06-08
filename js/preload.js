/* -------------------------------------------------------------------------- */
/*   Auto-preload bundled Partner PDFs into templates on first load           */
/* -------------------------------------------------------------------------- */

const PDF_PRELOAD_MAP = [
  { templateKey: 'portability',         assetKey: 'PDF_NIYUD',    label: 'טופס ניוד מספר' },
  { templateKey: 'ide-terms-agreement', assetKey: 'PDF_TAKANON',   label: 'תקנון טלפונים' }
];

// Ownership forms use the updated per-form PDFs (with IDE stamps already printed).
// They are rendered directly via PDF.js (pdfBytes) rather than the image pipeline.
const OWNERSHIP_PDF_FILES = {
  ownership_seller: 'ownership_seller_updated.pdf',
  ownership_buyer:  'ownership_buyer_updated.pdf'
};
const OWNERSHIP_PDF_VERSION = '2026-06-08d';

// Fetches the updated ownership PDFs and loads them as the template background.
async function loadOwnershipPdfsFromFile() {
  const needsRefresh = localStorage.getItem('ownership_pdf_version') !== OWNERSHIP_PDF_VERSION;

  for (const [templateKey, fileName] of Object.entries(OWNERSHIP_PDF_FILES)) {
    const tpl = state.templates[templateKey];
    if (!tpl) continue;
    if (tpl.pdfBytes && !needsRefresh) continue; // already loaded this version

    try {
      const resp = await fetch(encodeURI(fileName));
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      const buf = await resp.arrayBuffer();

      tpl.pdfBytes        = buf;
      tpl.isImageTemplate = false;
      tpl.images          = [];

      await dbHelper.save(templateKey, {
        fields:          tpl.fields,
        isImageTemplate: false,
        pdfBytes:        buf,
        images:          []
      });
      updateTemplateCardStatus(templateKey);
      console.log(`Loaded updated PDF for ${templateKey} (${fileName})`);
    } catch (err) {
      console.warn(`Could not load updated PDF for ${templateKey} (${fileName}):`, err);
    }
  }

  localStorage.setItem('ownership_pdf_version', OWNERSHIP_PDF_VERSION);
}

function setCardLoading(templateKey, isLoading) {
  const badge   = document.getElementById(`badge-${templateKey}`);
  const card    = document.getElementById(`card-${templateKey}`);
  if (!badge || !card) return;

  if (isLoading) {
    badge.textContent = "טוען רקע...";
    badge.className   = 'card-badge badge-loading';
    card.classList.add('card-preloading');
  } else {
    card.classList.remove('card-preloading');
  }
}

async function autoPreloadPdfTemplates() {
  if (typeof PDF_ASSETS === 'undefined') {
    console.warn("pdf-assets.js not loaded — skipping preload.");
    return;
  }

  let anyPreloaded = false;

  for (const { templateKey, assetKey, label } of PDF_PRELOAD_MAP) {
    const tpl = state.templates[templateKey];
    if (!tpl) continue;

    const alreadyLoaded = tpl.images && tpl.images.length > 0;
    if (alreadyLoaded) continue;

    console.log(`Preloading "${label}" (${templateKey})...`);
    setCardLoading(templateKey, true);

    try {
      const pdfBuffer = base64ToArrayBuffer(PDF_ASSETS[assetKey]);
      const images    = await convertPdfToImages(pdfBuffer, 300);

      tpl.isImageTemplate = true;
      tpl.pdfBytes        = null;
      tpl.images          = images;

      await dbHelper.save(templateKey, {
        fields:          tpl.fields,
        isImageTemplate: tpl.isImageTemplate,
        pdfBytes:        null,
        images:          images
      });

      setCardLoading(templateKey, false);
      updateTemplateCardStatus(templateKey);
      anyPreloaded = true;
      console.log(`  ✓ ${label} — ${images.length} page(s) ready`);
    } catch (err) {
      console.error(`Failed to preload template "${templateKey}":`, err);
      setCardLoading(templateKey, false);
    }
  }

  if (anyPreloaded) {
    showToast("הטפסים נטענו אוטומטית ומוכנים למיפוי", "success");
  }
}
