/* -------------------------------------------------------------------------- */
/*          Inline PDF / Image Filler Renderer & Overlay Setup                */
/* -------------------------------------------------------------------------- */

let _fillerResizeObserver = null;
let _pageStepperObserver  = null;

// Builds the page-navigation stepper above the rendered PDF pages.
// Hidden automatically for single-page forms.
function buildPageStepper() {
  const stepper = document.getElementById('filler-page-stepper');
  const wrapper = document.getElementById('filler-pdf-renderer-wrapper');
  const root    = document.getElementById('filler-workspace-container');
  if (!stepper || !wrapper) return;

  if (_pageStepperObserver) { _pageStepperObserver.disconnect(); _pageStepperObserver = null; }

  const pages = [...wrapper.querySelectorAll('.pdf-page-container')];
  stepper.innerHTML = '';

  if (pages.length <= 1) { stepper.classList.add('hidden'); return; }
  stepper.classList.remove('hidden');

  pages.forEach((pageEl, i) => {
    if (i > 0) {
      const line = document.createElement('span');
      line.className = 'page-step-line';
      stepper.appendChild(line);
    }
    const step = document.createElement('button');
    step.type           = 'button';
    step.className      = 'page-step';
    step.dataset.stepIndex = i;
    step.setAttribute('role', 'tab');
    step.setAttribute('aria-label', `עמוד ${i + 1}`);
    step.innerHTML = `<span class="page-step-dot"><span class="page-step-num">${i + 1}</span><i data-lucide="check" class="page-step-check"></i></span><span class="page-step-label">עמוד ${i + 1}</span>`;
    step.addEventListener('click', () => pageEl.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    stepper.appendChild(step);
  });
  lucide.createIcons();

  // Scroll-spy: highlight whichever page sits near the top of the workspace
  _pageStepperObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) setActivePageStep(+entry.target.dataset.pageIndex);
    });
  }, { root, rootMargin: '-5% 0px -80% 0px', threshold: 0 });
  pages.forEach(p => _pageStepperObserver.observe(p));

  // Recompute completion ticks as the user fills the form
  wrapper.addEventListener('input',  refreshStepCompletion);
  wrapper.addEventListener('change', refreshStepCompletion);

  setActivePageStep(0);
  refreshStepCompletion();
}

function setActivePageStep(idx) {
  document.querySelectorAll('#filler-page-stepper .page-step').forEach(s => {
    s.classList.toggle('active', +s.dataset.stepIndex === idx);
  });
}

// Marks a page step "done" when its required text fields and required
// signatures are all filled.
function refreshStepCompletion() {
  const wrapper = document.getElementById('filler-pdf-renderer-wrapper');
  if (!wrapper) return;
  const pages = [...wrapper.querySelectorAll('.pdf-page-container')];
  pages.forEach((pageEl, i) => {
    const inputs = [...pageEl.querySelectorAll('.pdf-inline-input[required]')];
    const textOk = inputs.every(inp => inp.value && inp.value.trim() !== '');

    const reqSigs = [...pageEl.querySelectorAll('.pdf-inline-signature-canvas[data-required="1"]')];
    const sigOk = reqSigs.every(c => {
      const pad = activeSignaturePads.find(p => p.fieldId === c.dataset.fieldId);
      return pad ? !pad.isEmpty : false;
    });

    const hasReq = inputs.length + reqSigs.length > 0;
    const step = document.querySelector(`#filler-page-stepper .page-step[data-step-index="${i}"]`);
    if (step) step.classList.toggle('done', hasReq && textOk && sigOk);
  });
}

// Re-renders the filler when the container width changes (e.g. phone rotation),
// saving and restoring any values the user already typed or signed.
function setupFillerResizeObserver(tpl) {
  const container = document.getElementById('filler-pdf-renderer-wrapper');
  if (!container || typeof ResizeObserver === 'undefined') return;

  if (_fillerResizeObserver) { _fillerResizeObserver.disconnect(); _fillerResizeObserver = null; }

  let lastWidth   = container.clientWidth;
  let debounceTimer = null;

  _fillerResizeObserver = new ResizeObserver(entries => {
    const newWidth = entries[0]?.contentRect?.width ?? container.clientWidth;
    if (Math.abs(newWidth - lastWidth) < 30) return;
    lastWidth = newWidth;

    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
      // Snapshot current form data before clearing
      const savedValues = {};
      for (const input of container.querySelectorAll('.pdf-inline-input')) {
        savedValues[input.dataset.fieldName] = input.value;
      }
      // Snapshot signatures (null = user explicitly cleared; data-URL = has content)
      const savedSigs = {};
      for (const pad of activeSignaturePads) {
        savedSigs[pad.fieldId] = pad.isEmpty ? null : pad.canvas.toDataURL('image/png');
      }

      // Re-render at new width
      container.innerHTML = '';
      activeSignaturePads = [];
      try {
        if (tpl.isImageTemplate) {
          await renderImagesForFilling(tpl.images, tpl.fields);
        } else {
          await renderPdfForFilling(tpl.pdfBytes, tpl.fields);
        }
      } catch (e) { console.error('Resize re-render failed', e); return; }

      // Restore text/select values immediately
      for (const input of container.querySelectorAll('.pdf-inline-input')) {
        const saved = savedValues[input.dataset.fieldName];
        if (saved !== undefined) input.value = saved;
      }

      // Restore signatures after canvas initialisation settles (100ms timeout inside setupInlineFields)
      setTimeout(() => {
        for (const pad of activeSignaturePads) {
          if (!(pad.fieldId in savedSigs)) continue;
          const saved = savedSigs[pad.fieldId];
          if (saved) {
            const img = new Image();
            img.onload = () => { pad.ctx.drawImage(img, 0, 0, pad.canvas.width, pad.canvas.height); pad.isEmpty = false; pad.showingPlaceholder = false; };
            img.src = saved;
          } else {
            // User had cleared this pad — restore the empty "sign here" guide
            drawSignaturePlaceholder(pad.ctx, pad.canvas);
            pad.isEmpty = true;
            pad.showingPlaceholder = true;
          }
        }
        refreshStepCompletion();
      }, 200);
    }, 300);
  });

  _fillerResizeObserver.observe(container);
}

async function openFormFiller(templateKey, submissionId = null) {
  // Tear down any resize observer from a previous form
  if (_fillerResizeObserver) { _fillerResizeObserver.disconnect(); _fillerResizeObserver = null; }

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
    setupFillerResizeObserver(tpl);
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

  buildPageStepper();
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
        if (loadedCount === imagesArray.length) { buildPageStepper(); resolve(); }
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
      const autoStamp      = isAutoStampField(field);
      const sCanvas        = document.createElement('canvas');
      sCanvas.className    = 'pdf-inline-signature-canvas';
      if (field.color === 'yellow') sCanvas.classList.add('yellow-field');
      sCanvas.dataset.fieldId  = field.id;
      sCanvas.dataset.required = field.required ? '1' : '0';
      sCanvas.style.left   = `${field.x}%`;
      sCanvas.style.top    = `${field.y}%`;
      sCanvas.style.width  = `${field.w}%`;
      sCanvas.style.height = `${field.h}%`;
      overlayDiv.appendChild(sCanvas);

      // Toolbar (undo + clear) anchored just above the signature box
      const toolbar       = document.createElement('div');
      toolbar.className   = 'sig-toolbar';
      toolbar.style.left  = `${field.x}%`;
      toolbar.style.top   = `calc(${field.y}% - 28px)`;

      const undoBtn       = document.createElement('button');
      undoBtn.type        = 'button';
      undoBtn.className    = 'sig-tool-btn sig-undo';
      undoBtn.innerHTML   = '<i data-lucide="undo-2"></i> בטל';

      const clearBtn      = document.createElement('button');
      clearBtn.type       = 'button';
      clearBtn.className   = 'sig-tool-btn sig-clear';
      clearBtn.innerHTML  = '<i data-lucide="eraser"></i> נקה';

      toolbar.appendChild(undoBtn);
      toolbar.appendChild(clearBtn);
      overlayDiv.appendChild(toolbar);

      setTimeout(() => {
        const rect    = sCanvas.getBoundingClientRect();
        sCanvas.width  = rect.width  || 150;
        sCanvas.height = rect.height || 50;

        const sCtx = sCanvas.getContext('2d');
        sCtx.fillStyle = '#ffffff';
        sCtx.fillRect(0, 0, sCanvas.width, sCanvas.height);

        const pad = initInlineSignatureDrawing(sCanvas, sCtx, field.id, clearBtn, undoBtn, autoStamp);

        if (sub && sub.signatureImagesMap && sub.signatureImagesMap[field.id]) {
          const img = new Image();
          img.onload = () => {
            sCtx.drawImage(img, 0, 0, sCanvas.width, sCanvas.height);
            pad.isEmpty = false; pad.showingPlaceholder = false;
            refreshStepCompletion();
          };
          img.src = sub.signatureImagesMap[field.id];
        } else if (autoStamp) {
          const stamp = new Image();
          stamp.onload = () => {
            sCtx.drawImage(stamp, 0, 0, sCanvas.width, sCanvas.height);
            pad.isEmpty = false; pad.showingPlaceholder = false;
            refreshStepCompletion();
          };
          stamp.src = generateCompanyStampBase64();
        } else {
          // Empty pad — show the "sign here" guide so users know where to draw
          drawSignaturePlaceholder(sCtx, sCanvas);
          pad.showingPlaceholder = true;
        }
        lucide.createIcons();
      }, 100);
    }
  });
}

// Draws the dashed baseline + "חתום כאן" hint on an empty signature pad.
function drawSignaturePlaceholder(ctx, canvas) {
  const w = canvas.width, h = canvas.height;
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);

  // dashed signing line
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth   = Math.max(1, h * 0.02);
  ctx.setLineDash([6, 5]);
  ctx.beginPath();
  ctx.moveTo(w * 0.08, h * 0.74);
  ctx.lineTo(w * 0.92, h * 0.74);
  ctx.stroke();
  ctx.setLineDash([]);

  // hint text
  ctx.fillStyle    = '#94a3b8';
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `${Math.max(11, Math.min(h * 0.3, 20))}px Heebo, sans-serif`;
  ctx.fillText('חתום כאן', w / 2, h * 0.42);
  ctx.restore();
}

// Freehand drawing on signature canvas, with undo + clear support.
function initInlineSignatureDrawing(sCanvas, sCtx, fieldId, clearBtn, undoBtn, autoStamp) {
  let drawing = false;
  const padObj = { fieldId, canvas: sCanvas, ctx: sCtx, isEmpty: true, showingPlaceholder: false, isAutoStamp: !!autoStamp, undoStack: [] };
  activeSignaturePads.push(padObj);

  function beginStroke(pos) {
    drawing = true;
    // Wipe the "sign here" guide before the first real stroke is captured
    if (padObj.showingPlaceholder) {
      sCtx.fillStyle = '#ffffff';
      sCtx.fillRect(0, 0, sCanvas.width, sCanvas.height);
      padObj.showingPlaceholder = false;
    }
    // Snapshot the pre-stroke state so this stroke can be undone
    try {
      padObj.undoStack.push(sCtx.getImageData(0, 0, sCanvas.width, sCanvas.height));
      if (padObj.undoStack.length > 40) padObj.undoStack.shift();
    } catch (_) {}
    padObj.isEmpty = false;
    sCanvas.style.borderColor = 'var(--success-color)';
    sCtx.beginPath();
    sCtx.moveTo(pos.x, pos.y);
    refreshStepCompletion();
  }

  function moveStroke(pos) {
    if (!drawing) return;
    sCtx.lineTo(pos.x, pos.y);
    sCtx.strokeStyle = '#0f172a';
    sCtx.lineWidth   = 2.5;
    sCtx.lineCap     = 'round';
    sCtx.lineJoin    = 'round';
    sCtx.stroke();
  }

  // Restores the pad to its initial state (stamp, or empty guide).
  function resetToBase() {
    sCtx.fillStyle = '#ffffff';
    sCtx.fillRect(0, 0, sCanvas.width, sCanvas.height);
    sCanvas.style.borderColor = 'var(--accent-color)';
    if (padObj.isAutoStamp) {
      const stamp = new Image();
      stamp.onload = () => sCtx.drawImage(stamp, 0, 0, sCanvas.width, sCanvas.height);
      stamp.src = generateCompanyStampBase64();
      padObj.isEmpty = false;
      padObj.showingPlaceholder = false;
    } else {
      drawSignaturePlaceholder(sCtx, sCanvas);
      padObj.isEmpty = true;
      padObj.showingPlaceholder = true;
    }
    refreshStepCompletion();
  }

  sCanvas.addEventListener('mousedown',  (e) => beginStroke(getMousePos(sCanvas, e)));
  sCanvas.addEventListener('mousemove',  (e) => moveStroke(getMousePos(sCanvas, e)));
  sCanvas.addEventListener('mouseup',    () => drawing = false);
  sCanvas.addEventListener('mouseleave', () => drawing = false);
  sCanvas.addEventListener('touchstart', (e) => beginStroke(getTouchPos(sCanvas, e.touches[0])), { passive: true });
  sCanvas.addEventListener('touchmove',  (e) => moveStroke(getTouchPos(sCanvas, e.touches[0])),  { passive: true });
  sCanvas.addEventListener('touchend',   () => drawing = false);

  clearBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    padObj.undoStack = [];
    resetToBase();
  });

  if (undoBtn) undoBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!padObj.undoStack.length) { resetToBase(); return; }
    const prev = padObj.undoStack.pop();
    sCtx.putImageData(prev, 0, 0);
    if (!padObj.undoStack.length && !padObj.isAutoStamp) {
      // Back to the blank base — restore the guide
      drawSignaturePlaceholder(sCtx, sCanvas);
      padObj.isEmpty = true;
      padObj.showingPlaceholder = true;
      sCanvas.style.borderColor = 'var(--accent-color)';
    } else {
      padObj.isEmpty = false;
    }
    refreshStepCompletion();
  });

  return padObj;
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
