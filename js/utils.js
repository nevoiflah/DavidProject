// Fix 17: Cache Heebo font bytes so it's only fetched once per session
const HEEBO_FONT_URL = 'https://fonts.gstatic.com/s/heebo/v28/NGSpv5_NC0k9P_v6ZUCbLRAHxK1EiSycckOhz0w.ttf';
let _heeboFontCache = null;

async function fetchHeeboFont() {
  if (_heeboFontCache) return _heeboFontCache;
  try {
    const response = await fetch(HEEBO_FONT_URL);
    if (!response.ok) throw new Error('HTTP error ' + response.status);
    _heeboFontCache = await response.arrayBuffer();
    return _heeboFontCache;
  } catch (err) {
    console.warn("Failed to fetch Heebo font:", err);
    return null;
  }
}

// Binary conversion helpers
function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function base64ToArrayBuffer(base64) {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

function readFileAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

async function mergePdfBuffers(buffers) {
  const mergedPdf = await PDFLib.PDFDocument.create();
  for (const buffer of buffers) {
    const pdf = await PDFLib.PDFDocument.load(buffer);
    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }
  return await mergedPdf.save();
}

async function convertPdfToImages(pdfBuffer, dpi = 300) {
  const scale = dpi / 72;
  const loadingTask = pdfjsLib.getDocument({
    data: pdfBuffer,
    cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@2.16.105/cmaps/',
    cMapPacked: true
  });
  const pdfDoc  = await loadingTask.promise;
  const numPages = pdfDoc.numPages;
  const imagesArray = [];

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page     = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width  = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');

    await page.render({ canvasContext: ctx, viewport }).promise;

    const base64      = canvas.toDataURL('image/png').split(',')[1];
    const arrayBuffer = base64ToArrayBuffer(base64);
    imagesArray.push({ bytes: arrayBuffer, type: 'image/png' });
  }
  return imagesArray;
}
