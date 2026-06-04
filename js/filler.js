/* -------------------------------------------------------------------------- */
/*          Inline PDF / Image Filler Renderer & Overlay Setup                */
/* -------------------------------------------------------------------------- */

async function openFormFiller(templateKey, submissionId = null) {
  state.activeTemplate             = templateKey;
  state.currentEditingSubmissionId = submissionId;

  const submitBtn = document.getElementById('btn-submit-inline-form');
  if (submitBtn) {
    submitBtn.innerHTML = submissionId
      ? '<i data-lucide="check-square"></i> אשר והפק PDF סופי'
      : '<i data-lucide="send"></i> שלח טפסים חתומים';
  }

  if (submissionId) {
    try {
      const sub = await dbHelper.loadSubmission(submissionId);
      state.currentEditingSubmission = sub || null;
    } catch (subErr) {
      console.error("Error loading submission for editing", subErr);
      state.currentEditingSubmission = null;
    }
  } else {
    state.currentEditingSubmission = null;
  }

  const tpl = state.templates[templateKey];

  // Guard: if no fields have been mapped yet, refuse to open a blank form
  const hasContent = tpl && (tpl.images?.length > 0 || tpl.pdfBytes);
  const hasFields  = tpl && tpl.fields?.length > 0;

  if (!hasContent || !hasFields) {
    const isAdmin = sessionStorage.getItem('partner_admin_auth') === 'true';
    if (isAdmin) {
      showToast("טרם בוצע מיפוי שדות לטופס זה. אנא מפה שדות תחילה.", "warning");
    } else {
      // Show a friendly full-screen message for clients
      switchView('form-filler');
      const container = document.getElementById('filler-pdf-renderer-wrapper');
      container.innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:1.5rem;text-align:center;color:var(--text-muted);padding:3rem;">
          <i data-lucide="alert-circle" style="width:56px;height:56px;color:var(--warning-color);"></i>
          <h2 style="color:var(--text-main);font-size:1.4rem;">הטופס אינו זמין כרגע</h2>
          <p style="max-width:420px;line-height:1.7;">הקישור ששלחו אליך אינו מכיל את הגדרות הטופס.<br>בקש מהמנהל לשלוח קישור מעודכן דרך כפתור <b>שתף קישור</b>.</p>
        </div>
      `;
      lucide.createIcons();
    }
    return;
  }

  switchView('form-filler');

  const container = document.getElementById('filler-pdf-renderer-wrapper');
  container.innerHTML = '';
  activeSignaturePads = [];

  const titles = {
    'portability':         'טופס בקשת ניוד מספר',
    'ownership_seller':    'טופס העברת בעלות - עובד חדש',
    'ownership_buyer':     'טופס העברת בעלות - עובד עוזב',
    'ide-terms-agreement': 'הסכם שימוש ורכישת מכשיר נייד (חברת IDE)'
  };
  let formTitleText = titles[templateKey] || 'טופס';
  if (submissionId) formTitleText += " (עריכת מנהל)";
  document.getElementById('filler-form-title').textContent = formTitleText;

  showToast("טוען את מסמך ה-PDF למילוי...", "info");

  try {
    if (tpl.isImageTemplate) {
      await renderImagesForFilling(tpl.images, tpl.fields);
    } else {
      await renderPdfForFilling(tpl.pdfBytes, tpl.fields);
    }
    showToast("המסמך מוכן להקלדה ולחתימה!", "success");
  } catch (err) {
    console.error("Error rendering template for filling", err);
    showToast("שגיאה ברנדור דפי ה-PDF למילוי", "error");
  }
}

async function renderPdfForFilling(pdfBytes, fields) {
  const container   = document.getElementById('filler-pdf-renderer-wrapper');
  const loadingTask = pdfjsLib.getDocument({
    data: pdfBytes,
    cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@2.16.105/cmaps/',
    cMapPacked: true
  });
  pdfJsDocInstance = await loadingTask.promise;
  const numPages   = pdfJsDocInstance.numPages;

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page            = await pdfJsDocInstance.getPage(pageNum);
    const naturalViewport = page.getViewport({ scale: 1 });
    const maxWidth        = (container.clientWidth || window.innerWidth) - 16;
    const displayScale    = Math.min(1.35, maxWidth / naturalViewport.width);
    const displayViewport = page.getViewport({ scale: displayScale });
    const dpr             = window.devicePixelRatio || 1;
    const renderScale     = displayScale * Math.max(2, dpr);
    const renderViewport  = page.getViewport({ scale: renderScale });

    const pageDiv             = document.createElement('div');
    pageDiv.className         = 'pdf-page-container';
    pageDiv.style.width       = `${displayViewport.width}px`;
    pageDiv.style.height      = `${displayViewport.height}px`;
    pageDiv.dataset.pageIndex = pageNum - 1;

    const canvas        = document.createElement('canvas');
    canvas.width        = renderViewport.width;
    canvas.height       = renderViewport.height;
    canvas.style.width  = `${displayViewport.width}px`;
    canvas.style.height = `${displayViewport.height}px`;
    pageDiv.appendChild(canvas);

    const overlayDiv        = document.createElement('div');
    overlayDiv.className    = 'pdf-page-overlay';
    overlayDiv.style.width  = `${displayViewport.width}px`;
    overlayDiv.style.height = `${displayViewport.height}px`;
    pageDiv.appendChild(overlayDiv);
    container.appendChild(pageDiv);

    await page.render({ canvasContext: canvas.getContext('2d'), viewport: renderViewport }).promise;

    const pageFields = fields.filter(f => f.page === pageNum - 1);
    setupInlineFields(pageFields, overlayDiv, displayViewport.height);
  }
}

function renderImagesForFilling(imagesArray, fields) {
  return new Promise((resolve) => {
    const container = document.getElementById('filler-pdf-renderer-wrapper');
    let loadedCount = 0;

    imagesArray.forEach((imgObj, idx) => {
      const blob   = new Blob([imgObj.bytes], { type: imgObj.type });
      const imgUrl = URL.createObjectURL(blob);
      const img    = new Image();
      img.src      = imgUrl;

      img.onload = () => {
        const maxWidth      = (container.clientWidth || window.innerWidth) - 16;
        const displayWidth  = Math.min(850, maxWidth);
        const aspectRatio   = img.height / img.width;
        const displayHeight = displayWidth * aspectRatio;

        const pageDiv             = document.createElement('div');
        pageDiv.className         = 'pdf-page-container';
        pageDiv.style.width       = `${displayWidth}px`;
        pageDiv.style.height      = `${displayHeight}px`;
        pageDiv.dataset.pageIndex = idx;

        const dpr    = window.devicePixelRatio || 1;
        const canvas = document.createElement('canvas');
        canvas.width  = displayWidth  * Math.max(2, dpr);
        canvas.height = displayHeight * Math.max(2, dpr);
        canvas.style.width  = `${displayWidth}px`;
        canvas.style.height = `${displayHeight}px`;
        pageDiv.appendChild(canvas);

        const overlayDiv        = document.createElement('div');
        overlayDiv.className    = 'pdf-page-overlay';
        overlayDiv.style.width  = `${displayWidth}px`;
        overlayDiv.style.height = `${displayHeight}px`;
        pageDiv.appendChild(overlayDiv);
        container.appendChild(pageDiv);

        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);

        const pageFields = fields.filter(f => f.page === idx);
        setupInlineFields(pageFields, overlayDiv, displayHeight);

        URL.revokeObjectURL(imgUrl);
        loadedCount++;
        if (loadedCount === imagesArray.length) resolve();
      };
    });
  });
}

// Injects actual DOM inputs on top of page overlays
function setupInlineFields(pageFields, overlayDiv, containerHeight) {
  const sub      = state.currentEditingSubmission;
  const formData = sub ? (sub.formData || {}) : {};

  pageFields.forEach(field => {
    if (field.type === 'text' || field.type === 'select') {
      const el        = field.type === 'text' ? document.createElement('input') : document.createElement('select');
      el.className    = 'pdf-inline-input';
      if (field.color === 'yellow') el.classList.add('yellow-field');
      el.dataset.fieldId   = field.id;
      el.dataset.fieldName = field.name;
      el.style.left   = `${field.x}%`;
      el.style.top    = `${field.y}%`;
      el.style.width  = `${field.w}%`;
      el.style.height = `${field.h}%`;

      const rectHeight  = (field.h / 100) * containerHeight;
      el.style.fontSize = `${Math.max(10, rectHeight * 0.55)}px`;

      if (field.required) el.setAttribute('required', 'true');

      if (field.type === 'text') {
        el.type = 'text';
        if (field.label.includes('תאריך')) el.type = 'date';
        else if (field.label.includes('טלפון') || field.label.includes('נייד')) el.type = 'tel';
        el.placeholder = field.label;

        if (formData[field.name] !== undefined) {
          el.value = formData[field.name];
        } else if (state.clientName) {
          const lbl = field.label || "", nm = field.name || "";
          if (lbl.includes('שם') || lbl.includes('חברה') || nm.includes('name') || nm.includes('client') || nm.includes('company')) {
            el.value = state.clientName;
          }
        }
      } else {
        // select
        el.style.padding = '0 6px';
        const placeholder     = document.createElement('option');
        placeholder.value     = "";
        placeholder.textContent = `-- בחרו ${field.label} --`;
        placeholder.disabled  = true;
        placeholder.selected  = true;
        el.appendChild(placeholder);

        const optionsList = (field.options || "").split(',').map(o => o.trim()).filter(Boolean);
        optionsList.forEach(optVal => {
          const opt    = document.createElement('option');
          opt.value    = optVal;
          opt.textContent = optVal;
          el.appendChild(opt);
        });

        if (formData[field.name] !== undefined) el.value = formData[field.name];
      }

      overlayDiv.appendChild(el);
    } else if (field.type === 'checkbox') {
      const chk        = document.createElement('input');
      chk.type         = 'checkbox';
      chk.className    = 'pdf-inline-checkbox';
      if (field.color === 'yellow') chk.classList.add('yellow-field');
      chk.dataset.fieldId   = field.id;
      chk.dataset.fieldName = field.name;
      chk.style.left   = `${field.x}%`;
      chk.style.top    = `${field.y}%`;
      chk.style.width  = `${field.w}%`;
      chk.style.height = `${field.h}%`;
      if (field.required) chk.setAttribute('required', 'true');
      if (formData[field.name] !== undefined) chk.checked = formData[field.name] === true;
      overlayDiv.appendChild(chk);
    } else if (field.type === 'signature') {
      const sCanvas        = document.createElement('canvas');
      sCanvas.className    = 'pdf-inline-signature-canvas';
      if (field.color === 'yellow') sCanvas.classList.add('yellow-field');
      sCanvas.dataset.fieldId = field.id;
      sCanvas.style.left   = `${field.x}%`;
      sCanvas.style.top    = `${field.y}%`;
      sCanvas.style.width  = `${field.w}%`;
      sCanvas.style.height = `${field.h}%`;
      overlayDiv.appendChild(sCanvas);

      const clearBtn           = document.createElement('button');
      clearBtn.type            = 'button';
      clearBtn.textContent     = 'נקה';
      clearBtn.style.position  = 'absolute';
      clearBtn.style.left      = `${field.x}%`;
      clearBtn.style.top       = `calc(${field.y}% - 22px)`;
      clearBtn.style.zIndex    = '30';
      clearBtn.style.background = '#ef4444';
      clearBtn.style.color     = 'white';
      clearBtn.style.border    = 'none';
      clearBtn.style.padding   = '2px 8px';
      clearBtn.style.borderRadius = '4px';
      clearBtn.style.fontSize  = '0.7rem';
      clearBtn.style.cursor    = 'pointer';
      overlayDiv.appendChild(clearBtn);

      setTimeout(() => {
        const rect    = sCanvas.getBoundingClientRect();
        sCanvas.width  = rect.width  || 150;
        sCanvas.height = rect.height || 50;

        const sCtx = sCanvas.getContext('2d');
        sCtx.fillStyle = '#ffffff';
        sCtx.fillRect(0, 0, sCanvas.width, sCanvas.height);

        initInlineSignatureDrawing(sCanvas, sCtx, field.id, clearBtn);

        if (sub && sub.signatureImagesMap && sub.signatureImagesMap[field.id]) {
          const img = new Image();
          img.onload = () => {
            sCtx.drawImage(img, 0, 0, sCanvas.width, sCanvas.height);
            const pad = activeSignaturePads.find(p => p.fieldId === field.id);
            if (pad) pad.isEmpty = false;
          };
          img.src = sub.signatureImagesMap[field.id];
        } else if (isAutoStampField(field)) {
          const stamp = new Image();
          stamp.onload = () => {
            sCtx.drawImage(stamp, 0, 0, sCanvas.width, sCanvas.height);
            const pad = activeSignaturePads.find(p => p.fieldId === field.id);
            if (pad) pad.isEmpty = false;
          };
          stamp.src = generateCompanyStampBase64();
        }
      }, 100);
    }
  });
}

// Freehand drawing on signature canvas
function initInlineSignatureDrawing(sCanvas, sCtx, fieldId, clearBtn) {
  let drawing = false;
  const padObj = { fieldId, canvas: sCanvas, ctx: sCtx, isEmpty: true };
  activeSignaturePads.push(padObj);

  sCanvas.addEventListener('mousedown', (e) => {
    drawing = true;
    padObj.isEmpty = false;
    sCanvas.style.borderColor = 'var(--success-color)';
    sCtx.beginPath();
    const pos = getMousePos(sCanvas, e);
    sCtx.moveTo(pos.x, pos.y);
  });

  sCanvas.addEventListener('mousemove', (e) => {
    if (!drawing) return;
    const pos = getMousePos(sCanvas, e);
    sCtx.lineTo(pos.x, pos.y);
    sCtx.strokeStyle = '#0f172a';
    sCtx.lineWidth   = 2.5;
    sCtx.lineCap     = 'round';
    sCtx.lineJoin    = 'round';
    sCtx.stroke();
  });

  sCanvas.addEventListener('mouseup',    () => drawing = false);
  sCanvas.addEventListener('mouseleave', () => drawing = false);

  sCanvas.addEventListener('touchstart', (e) => {
    drawing = true;
    padObj.isEmpty = false;
    sCanvas.style.borderColor = 'var(--success-color)';
    sCtx.beginPath();
    const pos = getTouchPos(sCanvas, e.touches[0]);
    sCtx.moveTo(pos.x, pos.y);
  }, { passive: true });

  sCanvas.addEventListener('touchmove', (e) => {
    if (!drawing) return;
    const pos = getTouchPos(sCanvas, e.touches[0]);
    sCtx.lineTo(pos.x, pos.y);
    sCtx.strokeStyle = '#0f172a';
    sCtx.lineWidth   = 2.5;
    sCtx.lineCap     = 'round';
    sCtx.lineJoin    = 'round';
    sCtx.stroke();
  }, { passive: true });

  sCanvas.addEventListener('touchend', () => drawing = false);

  clearBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    sCtx.fillStyle = '#ffffff';
    sCtx.fillRect(0, 0, sCanvas.width, sCanvas.height);
    sCanvas.style.borderColor = 'var(--accent-color)';
    padObj.isEmpty = true;
  });
}

function getMousePos(canvasDom, mouseEvent) {
  const rect = canvasDom.getBoundingClientRect();
  return {
    x: ((mouseEvent.clientX - rect.left) / rect.width)  * canvasDom.width,
    y: ((mouseEvent.clientY - rect.top)  / rect.height) * canvasDom.height
  };
}

function getTouchPos(canvasDom, touch) {
  const rect = canvasDom.getBoundingClientRect();
  return {
    x: ((touch.clientX - rect.left) / rect.width)  * canvasDom.width,
    y: ((touch.clientY - rect.top)  / rect.height) * canvasDom.height
  };
}
