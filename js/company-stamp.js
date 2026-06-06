/* -------------------------------------------------------------------------- */
/*              Company Stamp — א.י.ד.א.י טכנולוגיות מים בע"מ                */
/* -------------------------------------------------------------------------- */

// Field IDs that receive the company stamp automatically
const COMPANY_STAMP_FIELD_IDS = new Set([
  'dm_niyud_sig_agent',   // portability: sales-rep signature (page 2)
  'dm_ob_sig_buyer',      // ownership_buyer: buyer signature (page 1)
  'dm_ob_sig_payment',    // ownership_buyer: payment signature (page 2)
  'dm_ob_sig_ide',        // ownership_buyer: IDE/seller signature (page 0)
  'dm_os_sig_seller'      // ownership_seller: seller signature (page 0)
]);

// Returns true for any field that should carry the company stamp.
// Catches both hard-coded IDs and any admin-mapped field whose label contains "IDE".
function isAutoStampField(field) {
  if (!field) return false;
  return COMPANY_STAMP_FIELD_IDS.has(field.id) ||
    !!(field.label && field.label.includes('IDE'));
}

let _cachedStampBase64 = null;

// Generates (and caches) the company stamp as a base64 PNG.
function generateCompanyStampBase64() {
  if (_cachedStampBase64) return _cachedStampBase64;

  const W = 320, H = 110;
  const cx = W / 2, cy = H / 2;

  const canvas = document.createElement('canvas');
  canvas.width  = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, W, H);

  const INK = '#1a3080';

  // Outer border
  ctx.strokeStyle = INK;
  ctx.lineWidth   = 6;
  ctx.beginPath();
  ctx.ellipse(cx, cy, W / 2 - 6, H / 2 - 5, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Inner border
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(cx, cy, W / 2 - 17, H / 2 - 14, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle   = INK;
  ctx.textAlign   = 'center';
  ctx.textBaseline = 'middle';

  // Line 1 — main name (largest)
  ctx.font = 'bold 30px Arial, sans-serif';
  ctx.fillText('א.י.ד.א.י', cx, cy - 24);

  // Line 2 — company type
  ctx.font = 'bold 17px Arial, sans-serif';
  ctx.fillText('טכנולוגיות מים בע"מ', cx, cy + 6);

  // Line 3 — registration number
  ctx.font = '14px Arial, sans-serif';
  ctx.fillText('515840650', cx, cy + 30);

  _cachedStampBase64 = canvas.toDataURL('image/png');
  return _cachedStampBase64;
}
