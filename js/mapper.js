/* -------------------------------------------------------------------------- */
/*                         Visual Mapper / Editor Logic                       */
/* -------------------------------------------------------------------------- */

async function openMapper(templateKey) {
  const isAuth = sessionStorage.getItem('partner_admin_auth') === 'true';
  if (!isAuth) {
    showToast("גישה חסומה: מיועד למנהל מערכת בלבד", "warning");
    state.redirectTarget = { view: 'mapper', key: templateKey };
    switchView('login');
    return;
  }

  state.activeTemplate = templateKey;
  switchView('mapper');

  const tpl        = state.templates[templateKey];
  const hasContent = tpl.pdfBytes || (tpl.images && tpl.images.length > 0);

  if (hasContent) {
    document.getElementById('pdf-upload-fallback').classList.add('hidden');
    document.getElementById('pdf-renderer-wrapper').classList.remove('hidden');
    await renderTemplateWorkspace(tpl);
  } else {
    document.getElementById('pdf-upload-fallback').classList.remove('hidden');
    document.getElementById('pdf-renderer-wrapper').classList.add('hidden');
  }

  renderMappedFieldsList();
  updatePagesListUI();
}

async function renderTemplateWorkspace(tpl) {
  if (tpl.isImageTemplate) {
    await renderImagesForMapping(tpl.images);
  } else {
    await renderPdfForMapping(tpl.pdfBytes);
  }
}

// Handle initial file upload (PDF or flat images)
async function handlePdfUpload(event) {
  const files    = Array.from(event.target.files);
  if (files.length === 0) return;

  const pdfFiles = files.filter(f => f.type === "application/pdf");
  const imgFiles = files.filter(f => f.type.startsWith("image/"));
  const tpl      = state.templates[state.activeTemplate];

  if (imgFiles.length > 0) {
    imgFiles.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
    showToast(`מעבד ${imgFiles.length} תמונות רקע...`, "info");

    try {
      const imagesArray = [];
      for (const file of imgFiles) {
        const buffer = await readFileAsArrayBuffer(file);
        imagesArray.push({ bytes: buffer, type: file.type });
      }

      tpl.isImageTemplate = true;
      tpl.pdfBytes        = null;
      tpl.images          = imagesArray;

      document.getElementById('pdf-upload-fallback').classList.add('hidden');
      document.getElementById('pdf-renderer-wrapper').classList.remove('hidden');

      await renderImagesForMapping(imagesArray);
      await saveStateToDB();
      updateTemplateCardStatus(state.activeTemplate);
      updatePagesListUI();
    } catch (err) {
      console.error("Error loading images", err);
      showToast("שגיאה בטעינת קובצי התמונה", "error");
    }
  } else if (pdfFiles.length > 0) {
    showToast(pdfFiles.length > 1 ? `ממזג ומעבד ${pdfFiles.length} קבצים...` : "טוען קובץ PDF...", "info");

    try {
      const buffers = [];
      for (const file of pdfFiles) {
        buffers.push(await readFileAsArrayBuffer(file));
      }

      const finalBuffer = buffers.length > 1 ? await mergePdfBuffers(buffers) : buffers[0];

      showToast("ממיר דפי PDF לתמונות רקע חדות (300 DPI) למניעת שיבושי פונטים...", "info");
      const imagesArray = await convertPdfToImages(finalBuffer, 300);

      tpl.isImageTemplate = true;
      tpl.pdfBytes        = null;
      tpl.images          = imagesArray;

      document.getElementById('pdf-upload-fallback').classList.add('hidden');
      document.getElementById('pdf-renderer-wrapper').classList.remove('hidden');

      await renderImagesForMapping(imagesArray);
      await saveStateToDB();
      updateTemplateCardStatus(state.activeTemplate);
      updatePagesListUI();
      showToast("קובץ ה-PDF הומר לתמונות רקע שטוחות בהצלחה!", "success");
    } catch (err) {
      console.error("Error reading/converting PDF", err);
      showToast("שגיאה בעיבוד והמרת קובץ ה-PDF", "error");
    }
  } else {
    showToast("אנא בחרו קבצים תקינים (PDF או תמונות PNG/JPG)", "error");
  }
}

// Append additional pages to the active template
async function handleAppendPdf(event) {
  const file = event.target.files[0];
  if (!file) return;

  const tpl        = state.templates[state.activeTemplate];
  const hasContent = tpl.pdfBytes || (tpl.images && tpl.images.length > 0);

  if (!hasContent) {
    showToast("אין מסמך פעיל לשרשור. אנא העלו קובץ ראשון קודם.", "warning");
    return;
  }

  showToast("משרשר קובץ חדש לסוף המסמך...", "info");

  try {
    if (file.type.startsWith("image/")) {
      const imgBuffer = await readFileAsArrayBuffer(file);

      if (!tpl.isImageTemplate) {
        if (tpl.pdfBytes) {
          showToast("ממיר את המסמך הקיים לתמונות...", "info");
          tpl.images = await convertPdfToImages(tpl.pdfBytes, 300);
          tpl.pdfBytes = null;
          tpl.isImageTemplate = true;
        } else {
          tpl.images = [];
          tpl.isImageTemplate = true;
        }
      }

      tpl.images.push({ bytes: imgBuffer, type: file.type });
      await renderImagesForMapping(tpl.images);
      await saveStateToDB();
      updatePagesListUI();
      showToast("התמונה שורשרה בהצלחה!", "success");
    } else if (file.type === "application/pdf") {
      const newBytes        = await readFileAsArrayBuffer(file);
      showToast("ממיר דפי PDF לתמונות רקע חדות (300 DPI) ומשרשר...", "info");
      const appendedImages  = await convertPdfToImages(newBytes, 300);

      if (!tpl.isImageTemplate) {
        if (tpl.pdfBytes) {
          showToast("ממיר את המסמך הקיים לתמונות...", "info");
          const oldImages = await convertPdfToImages(tpl.pdfBytes, 300);
          tpl.images = oldImages.concat(appendedImages);
          tpl.pdfBytes = null;
          tpl.isImageTemplate = true;
        } else {
          tpl.images = appendedImages;
          tpl.isImageTemplate = true;
        }
      } else {
        tpl.images = tpl.images.concat(appendedImages);
      }

      await renderImagesForMapping(tpl.images);
      await saveStateToDB();
      updatePagesListUI();
      showToast("קובץ ה-PDF הומר ושורשר בהצלחה!", "success");
    }
  } catch (err) {
    console.error("Error appending file", err);
    showToast("שגיאה בשרשור והמרת הקובץ", "error");
  }
}

// Render PDF pages using PDF.js (vector, fallback)
async function renderPdfForMapping(pdfBuffer) {
  const container = document.getElementById('pdf-renderer-wrapper');
  container.innerHTML = '';
  pageCanvasElements  = [];

  try {
    const loadingTask = pdfjsLib.getDocument({
      data: pdfBuffer,
      cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@2.16.105/cmaps/',
      cMapPacked: true
    });
    pdfJsDocInstance = await loadingTask.promise;
    const numPages   = pdfJsDocInstance.numPages;
    document.getElementById('document-pages-info').textContent = `עמודים במסמך: ${numPages}`;

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page           = await pdfJsDocInstance.getPage(pageNum);
      const displayScale   = 1.35;
      const displayViewport = page.getViewport({ scale: displayScale });
      const devicePixelRatio = window.devicePixelRatio || 1;
      const renderScale    = displayScale * Math.max(2, devicePixelRatio);
      const renderViewport = page.getViewport({ scale: renderScale });

      const pageDiv            = document.createElement('div');
      pageDiv.className        = 'pdf-page-container';
      pageDiv.style.width      = `${displayViewport.width}px`;
      pageDiv.style.height     = `${displayViewport.height}px`;
      pageDiv.dataset.pageIndex = pageNum - 1;

      const canvas         = document.createElement('canvas');
      canvas.width         = renderViewport.width;
      canvas.height        = renderViewport.height;
      canvas.style.width   = `${displayViewport.width}px`;
      canvas.style.height  = `${displayViewport.height}px`;
      pageDiv.appendChild(canvas);

      const overlayDiv         = document.createElement('div');
      overlayDiv.className     = 'pdf-page-overlay';
      overlayDiv.style.width   = `${displayViewport.width}px`;
      overlayDiv.style.height  = `${displayViewport.height}px`;

      overlayDiv.addEventListener('dblclick', (e) => {
        if (e.target !== overlayDiv) return;
        e.preventDefault();
        e.stopPropagation();
        const rect   = overlayDiv.getBoundingClientRect();
        const clickX = ((e.clientX - rect.left) / rect.width)  * 100;
        const clickY = ((e.clientY - rect.top)  / rect.height) * 100;
        state.quickMenuData = { pageIndex: pageNum - 1, xPercent: clickX, yPercent: clickY };
        const popup          = document.getElementById('quick-menu-popup');
        popup.style.left     = `${e.clientX}px`;
        popup.style.top      = `${e.clientY}px`;
        popup.classList.remove('hidden');
      });

      pageDiv.appendChild(overlayDiv);
      container.appendChild(pageDiv);

      await page.render({ canvasContext: canvas.getContext('2d'), viewport: renderViewport }).promise;

      pageCanvasElements.push({
        canvas: canvas, overlay: overlayDiv,
        width: displayViewport.width, height: displayViewport.height
      });
    }

    drawExistingFieldsMarkup();
  } catch (err) {
    console.error("PDF.js rendering error", err);
    showToast("שגיאה ברנדור דפי ה-PDF", "error");
  }
}

// Render flat image pages (100% font-safe)
function renderImagesForMapping(imagesArray) {
  return new Promise((resolve) => {
    const container        = document.getElementById('pdf-renderer-wrapper');
    container.innerHTML    = '';
    pageCanvasElements     = [];
    document.getElementById('document-pages-info').textContent = `עמודים במסמך: ${imagesArray.length}`;

    let loadedCount = 0;

    imagesArray.forEach((imgObj, idx) => {
      const blob   = new Blob([imgObj.bytes], { type: imgObj.type });
      const imgUrl = URL.createObjectURL(blob);
      const img    = new Image();
      img.src      = imgUrl;

      img.onload = () => {
        const displayWidth  = 850;
        const aspectRatio   = img.height / img.width;
        const displayHeight = displayWidth * aspectRatio;

        const pageDiv            = document.createElement('div');
        pageDiv.className        = 'pdf-page-container';
        pageDiv.style.width      = `${displayWidth}px`;
        pageDiv.style.height     = `${displayHeight}px`;
        pageDiv.dataset.pageIndex = idx;

        const dpr    = window.devicePixelRatio || 1;
        const scale  = Math.max(2, dpr);
        const canvas = document.createElement('canvas');
        canvas.width  = displayWidth  * scale;
        canvas.height = displayHeight * scale;
        canvas.style.width  = `${displayWidth}px`;
        canvas.style.height = `${displayHeight}px`;
        pageDiv.appendChild(canvas);

        const overlayDiv        = document.createElement('div');
        overlayDiv.className    = 'pdf-page-overlay';
        overlayDiv.style.width  = `${displayWidth}px`;
        overlayDiv.style.height = `${displayHeight}px`;

        overlayDiv.addEventListener('dblclick', (e) => {
          if (e.target !== overlayDiv) return;
          e.preventDefault();
          e.stopPropagation();
          const rect   = overlayDiv.getBoundingClientRect();
          const clickX = ((e.clientX - rect.left) / rect.width)  * 100;
          const clickY = ((e.clientY - rect.top)  / rect.height) * 100;
          state.quickMenuData = { pageIndex: idx, xPercent: clickX, yPercent: clickY };
          const popup          = document.getElementById('quick-menu-popup');
          popup.style.left     = `${e.clientX}px`;
          popup.style.top      = `${e.clientY}px`;
          popup.classList.remove('hidden');
        });

        pageDiv.appendChild(overlayDiv);
        container.appendChild(pageDiv);

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        pageCanvasElements.push({
          canvas: canvas, overlay: overlayDiv,
          width: displayWidth, height: displayHeight
        });

        URL.revokeObjectURL(imgUrl);
        loadedCount++;
        if (loadedCount === imagesArray.length) {
          drawExistingFieldsMarkup();
          resolve();
        }
      };
    });
  });
}

// ---- Field creation ----

window.addNewPresetField = function(type, label, name) {
  const tpl = state.templates[state.activeTemplate];
  if (!tpl) {
    showToast("אנא פתחו או בחרו תבנית קודם כל", "warning");
    return;
  }

  let finalName = name, finalLabel = label, counter = 1;
  while (tpl.fields.some(f => f.name === finalName)) {
    finalName  = `${name}_${counter}`;
    finalLabel = `${label} ${counter}`;
    counter++;
  }

  const fieldId = 'field_' + Date.now() + Math.random().toString(36).substr(2, 5);
  let widthPercent = 20, heightPercent = 4;
  if (type === 'checkbox')  { widthPercent = 3.5; heightPercent = 2.5; }
  if (type === 'signature') { widthPercent = 25;  heightPercent = 8;   }

  const offset   = tpl.fields.length;
  const newField = {
    id:       fieldId,
    name:     finalName,
    label:    finalLabel,
    type:     type,
    page:     0,
    x:        Math.min(80, 10 + (offset * 3) % 50),
    y:        Math.min(80, 15 + (offset * 4) % 60),
    w:        widthPercent,
    h:        heightPercent,
    required: true,
    color:    'purple'
  };

  tpl.fields.push(newField);
  createFieldHtmlElement(newField);
  renderMappedFieldsList();
  editFieldProperties(fieldId);
  state.mapperHasUnsavedChanges = true;
  showToast(`נוסף שדה חדש: ${finalLabel}`, "success");
};

function triggerQuickFieldAdd(type) {
  const q = state.quickMenuData;
  addNewFieldAtCoords(q.pageIndex, q.xPercent, q.yPercent, type);
  document.getElementById('quick-menu-popup').classList.add('hidden');
}

function addNewFieldAtCoords(pageIndex, xPercent, yPercent, type = 'text') {
  const tpl     = state.templates[state.activeTemplate];
  const fieldId = 'field_' + Date.now() + Math.random().toString(36).substr(2, 5);

  let defaultLabel = "כתב במקלדת";
  let widthPercent = 20, heightPercent = 4;
  if (type === 'checkbox')  { defaultLabel = "תיבת סימון"; widthPercent = 3.5; heightPercent = 2.5; }
  if (type === 'signature') { defaultLabel = "תיבת חתימה"; widthPercent = 25;  heightPercent = 8;   }

  const newField = {
    id:       fieldId,
    name:     `${type}_${tpl.fields.length + 1}`,
    label:    `${defaultLabel} ${tpl.fields.length + 1}`,
    type:     type,
    page:     pageIndex,
    x:        xPercent,
    y:        yPercent,
    w:        widthPercent,
    h:        heightPercent,
    required: true,
    color:    'purple'
  };

  tpl.fields.push(newField);
  createFieldHtmlElement(newField);
  renderMappedFieldsList();
  editFieldProperties(fieldId);
}

function drawExistingFieldsMarkup() {
  const tpl = state.templates[state.activeTemplate];
  tpl.fields.forEach(field => createFieldHtmlElement(field));
}

// Create interactive draggable/resizable div for a field
function createFieldHtmlElement(field) {
  if (!pageCanvasElements[field.page]) field.page = 0;

  const pageOverlay = pageCanvasElements[field.page].overlay;

  const fieldDiv       = document.createElement('div');
  fieldDiv.className   = 'mapped-field-box';
  if (field.color === 'yellow') fieldDiv.classList.add('yellow-box');
  fieldDiv.id          = `box-${field.id}`;
  fieldDiv.style.left  = `${field.x}%`;
  fieldDiv.style.top   = `${field.y}%`;
  fieldDiv.style.width = `${field.w}%`;
  fieldDiv.style.height = `${field.h}%`;

  const labelSpan       = document.createElement('span');
  labelSpan.className   = 'mapped-field-label';
  labelSpan.textContent = field.label;
  fieldDiv.appendChild(labelSpan);

  const deleteBtn       = document.createElement('button');
  deleteBtn.className   = 'field-box-delete-btn';
  deleteBtn.innerHTML   = '×';
  deleteBtn.title       = 'מחיקת שדה';
  deleteBtn.addEventListener('mousedown', (e) => e.stopPropagation());
  deleteBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    e.preventDefault();
    deleteField(field.id);
  });
  fieldDiv.appendChild(deleteBtn);

  const handle       = document.createElement('div');
  handle.className   = 'resize-handle';
  if (field.color === 'yellow') handle.classList.add('yellow-handle');
  fieldDiv.appendChild(handle);

  fieldDiv.addEventListener('dblclick', (e) => {
    e.stopPropagation();
    editFieldProperties(field.id);
  });

  setupDragAndResize(fieldDiv, handle, field);
  pageOverlay.appendChild(fieldDiv);
}

// Drag & resize with page-crossing support
function setupDragAndResize(element, resizeHandle, field) {
  let isDragging = false, isResizing = false;
  let startX, startY, startLeft, startTop, startWidth, startHeight;

  element.addEventListener('mousedown', (e) => {
    if (e.target === resizeHandle || e.target.classList.contains('field-box-delete-btn')) return;
    e.preventDefault();
    e.stopPropagation();
    isDragging = true;
    startX     = e.clientX; startY = e.clientY;
    startLeft  = parseFloat(element.style.left) || 0;
    startTop   = parseFloat(element.style.top)  || 0;
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup',   onStop);
  });

  resizeHandle.addEventListener('mousedown', (e) => {
    e.preventDefault(); e.stopPropagation();
    isResizing  = true;
    startX      = e.clientX; startY = e.clientY;
    startWidth  = parseFloat(element.style.width)  || 0;
    startHeight = parseFloat(element.style.height) || 0;
    document.addEventListener('mousemove', onResize);
    document.addEventListener('mouseup',   onStop);
  });

  element.addEventListener('touchstart', (e) => {
    if (e.target === resizeHandle || e.target.classList.contains('field-box-delete-btn')) return;
    const touch = e.touches[0];
    isDragging = true;
    startX = touch.clientX; startY = touch.clientY;
    startLeft = parseFloat(element.style.left) || 0;
    startTop  = parseFloat(element.style.top)  || 0;
    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('touchend',  onStop);
  }, { passive: false });

  resizeHandle.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    isResizing  = true;
    startX = touch.clientX; startY = touch.clientY;
    startWidth  = parseFloat(element.style.width)  || 0;
    startHeight = parseFloat(element.style.height) || 0;
    document.addEventListener('touchmove', onTouchResize, { passive: false });
    document.addEventListener('touchend',  onStop);
  }, { passive: false });

  function onMove(e)      { if (isDragging)  updatePosition(e.clientX, e.clientY); }
  function onResize(e)    { if (isResizing)  updateSize(e.clientX, e.clientY); }
  function onTouchMove(e) {
    if (!isDragging) return;
    if (e.cancelable) e.preventDefault();
    const t = e.touches[0];
    updatePosition(t.clientX, t.clientY);
  }
  function onTouchResize(e) {
    if (!isResizing) return;
    if (e.cancelable) e.preventDefault();
    const t = e.touches[0];
    updateSize(t.clientX, t.clientY);
  }

  function updatePosition(clientX, clientY) {
    const parent      = element.parentElement;
    const parentWidth = parent.clientWidth;
    const parentHeight = parent.clientHeight;
    const newLeft     = startLeft + ((clientX - startX) / parentWidth)  * 100;
    const newTop      = startTop  + ((clientY - startY) / parentHeight) * 100;
    element.style.left = `${newLeft.toFixed(2)}%`;
    element.style.top  = `${newTop.toFixed(2)}%`;
    field.x = parseFloat(newLeft.toFixed(2));
    field.y = parseFloat(newTop.toFixed(2));
  }

  function updateSize(clientX, clientY) {
    const parent      = element.parentElement;
    const parentWidth = parent.clientWidth;
    const parentHeight = parent.clientHeight;
    let newW = startWidth  + ((clientX - startX) / parentWidth)  * 100;
    let newH = startHeight + ((clientY - startY) / parentHeight) * 100;
    newW = Math.max(2, Math.min(100 - field.x, newW));
    newH = Math.max(1, Math.min(100 - field.y, newH));
    element.style.width  = `${newW.toFixed(2)}%`;
    element.style.height = `${newH.toFixed(2)}%`;
    field.w = parseFloat(newW.toFixed(2));
    field.h = parseFloat(newH.toFixed(2));
  }

  function onStop(e) {
    document.removeEventListener('mousemove',  onMove);
    document.removeEventListener('mouseup',    onStop);
    document.removeEventListener('touchmove',  onTouchMove);
    document.removeEventListener('touchend',   onStop);
    document.removeEventListener('mousemove',  onResize);
    document.removeEventListener('touchmove',  onTouchResize);

    if (isDragging) {
      isDragging = false;
      const clientX = e.clientX ?? (e.changedTouches?.[0]?.clientX);
      const clientY = e.clientY ?? (e.changedTouches?.[0]?.clientY);

      if (clientX !== undefined && clientY !== undefined) {
        const pageContainers = document.querySelectorAll('.pdf-page-container');
        let targetPageIdx = -1, targetPageRect = null, targetOverlay = null;

        for (const container of pageContainers) {
          const rect = container.getBoundingClientRect();
          if (clientX >= rect.left && clientX <= rect.right &&
              clientY >= rect.top  && clientY <= rect.bottom) {
            targetPageIdx  = parseInt(container.dataset.pageIndex);
            targetPageRect = rect;
            targetOverlay  = container.querySelector('.pdf-page-overlay');
            break;
          }
        }

        if (targetPageIdx !== -1 && targetOverlay) {
          const relX = ((clientX - targetPageRect.left) / targetPageRect.width)  * 100;
          const relY = ((clientY - targetPageRect.top)  / targetPageRect.height) * 100;
          const newX = Math.max(0, Math.min(100 - field.w, relX));
          const newY = Math.max(0, Math.min(100 - field.h, relY));

          if (targetPageIdx !== field.page) {
            field.page = targetPageIdx;
            if (element.parentElement) element.parentElement.removeChild(element);
            targetOverlay.appendChild(element);
            showToast(`השדה הועבר לעמוד ${targetPageIdx + 1}`, "info");
          }

          field.x = parseFloat(newX.toFixed(2));
          field.y = parseFloat(newY.toFixed(2));
          element.style.left = `${field.x}%`;
          element.style.top  = `${field.y}%`;
        } else {
          field.x = Math.max(0, Math.min(100 - field.w, field.x));
          field.y = Math.max(0, Math.min(100 - field.h, field.y));
          element.style.left = `${field.x}%`;
          element.style.top  = `${field.y}%`;
        }
      }
      saveStateToDB();
      renderMappedFieldsList();
    }

    if (isResizing) {
      isResizing = false;
      saveStateToDB();
      renderMappedFieldsList();
    }
  }
}

// ---- Sidebar lists ----

function renderMappedFieldsList() {
  const list = document.getElementById('mapped-fields-list');
  list.innerHTML = '';

  const tpl = state.templates[state.activeTemplate];
  if (!tpl || tpl.fields.length === 0) {
    list.innerHTML = `<div class="card-desc" style="text-align: center; padding: 1rem;">טרם נוספו שדות. לחצו על המקשים למעלה או בצעו דאבל-קליק על דפי ה-PDF.</div>`;
    return;
  }

  tpl.fields.forEach(field => {
    const item    = document.createElement('div');
    item.className = 'field-item';
    item.id       = `item-${field.id}`;

    let typeIcon = 'keyboard', typeName = 'מקלדת';
    if (field.type === 'checkbox')  { typeIcon = 'check-square'; typeName = "צ'קבוקס"; }
    if (field.type === 'signature') { typeIcon = 'signature';    typeName = 'חתימה';   }

    item.innerHTML = `
      <div class="field-item-info">
        <span class="field-item-name">${field.label}</span>
        <span class="field-item-meta">${typeName} (${field.name}) | עמ' ${field.page + 1}</span>
      </div>
      <div class="field-item-actions">
        <button class="btn-icon" data-action="edit-field" data-id="${field.id}" title="עריכת מאפיינים">
          <i data-lucide="settings-2" style="width: 16px; height: 16px;"></i>
        </button>
        <button class="btn-icon" data-action="delete-field" data-id="${field.id}" title="מחק שדה" style="color: var(--danger-color);">
          <i data-lucide="trash-2" style="width: 16px; height: 16px;"></i>
        </button>
      </div>
    `;
    list.appendChild(item);
  });

  lucide.createIcons();
}

function updatePagesListUI() {
  const container = document.getElementById('document-pages-list');
  if (!container) return;
  container.innerHTML = '';

  const tpl = state.templates[state.activeTemplate];
  if (!tpl) return;

  const pageCount = tpl.isImageTemplate ? tpl.images.length : (pdfJsDocInstance ? pdfJsDocInstance.numPages : 0);
  document.getElementById('document-pages-info').textContent = `עמודים במסמך: ${pageCount}`;

  if (pageCount === 0) {
    container.innerHTML = `<div style="text-align: center; font-size: 0.75rem; color: var(--text-muted); padding: 4px;">אין עמודים במסמך.</div>`;
    return;
  }

  for (let i = 0; i < pageCount; i++) {
    const item = document.createElement('div');
    Object.assign(item.style, {
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '6px 10px', background: 'rgba(255, 255, 255, 0.03)',
      border: '1px solid var(--panel-border)', borderRadius: '6px',
      fontSize: '0.8rem', transition: 'all 0.2s', marginBottom: '4px'
    });
    item.innerHTML = `
      <span style="font-weight: 500; color: var(--text-main);">עמוד ${i + 1}</span>
      <button class="btn-icon" data-action="delete-page" data-page-index="${i}" title="מחק עמוד זה" style="color: var(--danger-color); padding: 2px;">
        <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
      </button>
    `;
    container.appendChild(item);
  }

  if (typeof lucide !== 'undefined') lucide.createIcons();
}

window.deletePage = function(pageIndex) {
  const tpl = state.templates[state.activeTemplate];
  if (!tpl) return;

  const pageCount = tpl.isImageTemplate ? tpl.images.length : 0;
  if (pageCount <= 1) {
    showToast("לא ניתן למחוק את העמוד האחרון במסמך", "warning");
    return;
  }

  if (!confirm(`האם אתה בטוח שברצונך למחוק את עמוד ${pageIndex + 1}? כל השדות הממופים בעמוד זה יימחקו גם כן.`)) return;

  showToast(`מוחק עמוד ${pageIndex + 1}...`, "info");

  try {
    if (tpl.isImageTemplate) tpl.images.splice(pageIndex, 1);

    tpl.fields = tpl.fields.filter(field => {
      if (field.page === pageIndex) {
        const box = document.getElementById(`box-${field.id}`);
        if (box) box.remove();
        return false;
      }
      if (field.page > pageIndex) {
        field.page -= 1;
        const box = document.getElementById(`box-${field.id}`);
        if (box) box.dataset.pageIndex = field.page;
      }
      return true;
    });

    if (tpl.isImageTemplate) {
      renderImagesForMapping(tpl.images).then(() => {
        renderMappedFieldsList();
        updatePagesListUI();
        saveStateToDB();
        showToast(`עמוד ${pageIndex + 1} נמחק בהצלחה`, "success");
      });
    }
  } catch (err) {
    console.error("Error deleting page:", err);
    showToast("שגיאה במחיקת העמוד", "error");
  }
};

// ---- Field modal ----

function editFieldProperties(fieldId) {
  state.currentEditingFieldId = fieldId;
  const tpl   = state.templates[state.activeTemplate];
  const field = tpl.fields.find(f => f.id === fieldId);
  if (!field) return;

  document.getElementById('modal-field-name').value     = field.name;
  document.getElementById('modal-field-label').value    = field.label;
  document.getElementById('modal-field-required').checked = field.required;
  document.getElementById('modal-field-color').value    = field.color || 'purple';

  const optGroup = document.getElementById('modal-field-options-group');
  if (optGroup) {
    if (field.type === 'select') {
      optGroup.style.display = 'block';
      document.getElementById('modal-field-options').value = field.options || "";
    } else {
      optGroup.style.display = 'none';
    }
  }

  document.querySelectorAll('.mapped-field-box').forEach(b => b.classList.remove('active'));
  const activeBox = document.getElementById(`box-${fieldId}`);
  if (activeBox) activeBox.classList.add('active');

  document.getElementById('field-modal').classList.remove('hidden');
}

function closeFieldModal() {
  document.getElementById('field-modal').classList.add('hidden');
}

function saveFieldModalDetails() {
  const fieldId = state.currentEditingFieldId;
  const tpl     = state.templates[state.activeTemplate];
  const field   = tpl.fields.find(f => f.id === fieldId);
  if (!field) return;

  const nameVal  = document.getElementById('modal-field-name').value.replace(/[^a-zA-Z0-9_]/g, "");
  const labelVal = document.getElementById('modal-field-label').value.trim();
  const reqVal   = document.getElementById('modal-field-required').checked;
  const colorVal = document.getElementById('modal-field-color').value;

  if (!nameVal || !labelVal) {
    showToast("אנא מלאו את כל פרטי השדה", "error");
    return;
  }

  field.name     = nameVal;
  field.label    = labelVal;
  field.required = reqVal;
  field.color    = colorVal;

  if (field.type === 'select') {
    field.options = document.getElementById('modal-field-options').value.trim();
  }

  const box = document.getElementById(`box-${fieldId}`);
  if (box) {
    const handle = box.querySelector('.resize-handle');
    if (colorVal === 'yellow') {
      box.classList.add('yellow-box');
      if (handle) handle.classList.add('yellow-handle');
    } else {
      box.classList.remove('yellow-box');
      if (handle) handle.classList.remove('yellow-handle');
    }
    const boxLabel = box.querySelector('.mapped-field-label');
    if (boxLabel) boxLabel.textContent = labelVal;
  }

  renderMappedFieldsList();
  closeFieldModal();
  showToast("השדה עודכן בהצלחה", "success");
}

function deleteField(fieldId) {
  const tpl = state.templates[state.activeTemplate];
  tpl.fields = tpl.fields.filter(f => f.id !== fieldId);
  const box  = document.getElementById(`box-${fieldId}`);
  if (box) box.remove();
  renderMappedFieldsList();
  showToast("השדה נמחק", "info");
}

async function saveCurrentMapping() {
  const tpl = state.templates[state.activeTemplate];
  if (tpl.fields.length === 0) {
    showToast("אנא מפו לפחות שדה אחד לפני השמירה", "warning");
    return;
  }
  await saveStateToDB();
  updateTemplateCardStatus(state.activeTemplate);
  state.mapperHasUnsavedChanges = false;
  showToast("מיפוי השדות נשמר! כדי לשלוח ללקוחות לחצו על 'שתף קישור' בלוח הבקרה.", "success");
  switchView('dashboard');
}

function confirmLeaveMapper() {
  const tpl = state.templates[state.activeTemplate];
  if (tpl && tpl.fields.length > 0 && state.mapperHasUnsavedChanges) {
    return confirm("יש שינויים שלא נשמרו במיפוי. האם לצאת בלי לשמור?");
  }
  return true;
}
