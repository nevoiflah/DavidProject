/* -------------------------------------------------------------------------- */
/*   Auto-preload bundled Partner PDFs into templates on first load           */
/* -------------------------------------------------------------------------- */

const PDF_PRELOAD_MAP = [
  { templateKey: 'portability',         assetKey: 'PDF_NIYUD',    label: 'טופס ניוד מספר' },
  { templateKey: 'ownership_seller',    assetKey: 'PDF_OWNERSHIP', label: 'העברת בעלות - עובד חדש' },
  { templateKey: 'ownership_buyer',     assetKey: 'PDF_OWNERSHIP', label: 'העברת בעלות - עובד עוזב' },
  { templateKey: 'ide-terms-agreement', assetKey: 'PDF_TAKANON',   label: 'תקנון טלפונים' }
];

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
