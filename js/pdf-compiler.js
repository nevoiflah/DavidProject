/* -------------------------------------------------------------------------- */
/*                     Submit, Compile, and Download PDF                      */
/* -------------------------------------------------------------------------- */

async function submitInlineForm() {
  const tpl      = state.templates[state.activeTemplate];
  const formData = {};

  // Validate text / select fields
  for (const input of document.querySelectorAll('.pdf-inline-input')) {
    const fieldName = input.dataset.fieldName;
    const fieldId   = input.dataset.fieldId;
    const field     = tpl.fields.find(f => f.id === fieldId);
    const val       = input.value.trim();

    if (field && field.required && !val) {
      input.focus();
      input.style.borderColor = 'var(--danger-color)';
      showToast(`נא למלא שדה חובה: ${field.label}`, "warning");
      return;
    }
    formData[fieldName] = val;
  }

  // Validate checkboxes
  for (const chk of document.querySelectorAll('.pdf-inline-checkbox')) {
    const fieldName = chk.dataset.fieldName;
    const fieldId   = chk.dataset.fieldId;
    const field     = tpl.fields.find(f => f.id === fieldId);

    if (field && field.required && !chk.checked) {
      chk.focus();
      showToast(`נא לסמן שדה חובה: ${field.label}`, "warning");
      return;
    }
    formData[fieldName] = chk.checked;
  }

  // Validate signatures
  const signatureImages = {};
  for (const pad of activeSignaturePads) {
    const field = tpl.fields.find(f => f.id === pad.fieldId);
    if (field && field.required && pad.isEmpty) {
      pad.canvas.style.borderColor = 'var(--danger-color)';
      showToast(`נא לחתום בתיבת החתימה: ${field.label}`, "warning");
      return;
    }
    if (!pad.isEmpty) {
      signatureImages[pad.fieldId] = pad.canvas.toDataURL('image/png');
    }
  }

  // Lock UI during async compilation
  const submitBtn = document.getElementById('btn-submit-inline-form');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<svg class="spin-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> מייצר PDF...';
  }

  showToast("מעבד את הנתונים ומייצר PDF חתום...", "info");

  try {
    state.signedPdfBytes = await compileSignedPdf(tpl, formData, signatureImages);

    // Resolve customer name
    let customerName = localStorage.getItem('currentCustomerName') || "";
    if (!customerName) {
      try {
        const nameField = tpl.fields.find(f => f.label.includes('שם') || f.name.includes('name'));
        if (nameField) customerName = (formData[nameField.name] || "").trim();
      } catch (_) {}
    }
    if (!customerName) customerName = "לקוח לא ידוע";

    const isEditing  = !!state.currentEditingSubmissionId;
    const subId      = isEditing ? state.currentEditingSubmissionId : `sub_${Date.now()}`;
    const subStatus  = isEditing ? 'approved' : 'pending';
    const subTimestamp = (isEditing && state.currentEditingSubmission)
      ? state.currentEditingSubmission.timestamp
      : new Date().toLocaleString('he-IL');

    await dbHelper.saveSubmission({
      id: subId,
      templateKey: state.activeTemplate,
      customerName,
      timestamp: subTimestamp,
      status: subStatus,
      formData,
      signatureImagesMap: signatureImages,
      pdfBytes: state.signedPdfBytes
    });

    showToast(
      isEditing
        ? "הטופס אושר והופק PDF סופי בהצלחה!"
        : "הטופס נחתם ונשמר במערכת (ממתין לאישור מנהל)",
      "success"
    );

    const blob           = new Blob([state.signedPdfBytes], { type: 'application/pdf' });
    state.signedPdfBlobUrl = URL.createObjectURL(blob);
    document.getElementById('signed-pdf-preview-frame').src = state.signedPdfBlobUrl;

    const successTitle = document.getElementById('success-title');
    const successDesc  = document.getElementById('success-desc');
    if (successTitle && successDesc) {
      if (isEditing) {
        successTitle.textContent = "הטופס אושר בהצלחה!";
        successDesc.innerHTML    = "קובץ ה-PDF הסופי הופק ונשמר. מנהל המערכת יכול להוריד את הקובץ ישירות למחשבו כעת.";
      } else {
        successTitle.textContent = "הטופס נחתם בהצלחה!";
        successDesc.innerHTML    = "הטופס המלא נשמר כטיוטה וממתין לאישור סופי של מנהל המערכת.<br>אישור והפקת PDF סופי יתבצעו מתוך לוח הבקרה.";
      }
    }

    switchView('success');
    updateMailtoLink(null);

    // Upload to Uguu.se then auto-email the admin via EmailJS
    try {
      const filename    = `Partner_Signed_${state.activeTemplate}_${Date.now()}.pdf`;
      const formDataObj = new FormData();
      formDataObj.append('files[]', blob, filename);
      const response = await fetch('https://uguu.se/upload', { method: 'POST', body: formDataObj });
      const data     = await response.json();
      if (data?.success && data.files?.[0]) {
        state.uploadedFileUrl = data.files[0].url;
        updateMailtoLink(data.files[0].url);
        await sendSignedFormEmail(customerName, state.activeTemplate, data.files[0].url);
      }
    } catch (uploadErr) {
      console.error("Uguu background upload failed", uploadErr);
    }
  } catch (err) {
    console.error("PDF generation failed", err);
    showToast("שגיאה ביצירת קובץ ה-PDF החתום: " + err.message, "error");
    // Re-enable submit button on failure
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i data-lucide="send"></i> שלח טפסים חתומים';
      lucide.createIcons();
    }
  }
}

// Compile final signed PDF by overlaying form data onto template pages
async function compileSignedPdf(template, formData, signatureImagesMap) {
  let pdfDoc;

  if (template.isImageTemplate) {
    pdfDoc = await PDFLib.PDFDocument.create();
    for (const imgObj of template.images) {
      const embeddedImage = imgObj.type === 'image/png'
        ? await pdfDoc.embedPng(imgObj.bytes)
        : await pdfDoc.embedJpg(imgObj.bytes);
      const pageWidthPoints  = 595;
      const pageHeightPoints = pageWidthPoints * (embeddedImage.height / embeddedImage.width);
      const page = pdfDoc.addPage([pageWidthPoints, pageHeightPoints]);
      page.drawImage(embeddedImage, { x: 0, y: 0, width: pageWidthPoints, height: pageHeightPoints });
    }
  } else {
    pdfDoc = await PDFLib.PDFDocument.load(template.pdfBytes);
  }

  if (typeof fontkit !== 'undefined') {
    pdfDoc.registerFontkit(fontkit);
  } else {
    console.error("Fontkit is not loaded! Hebrew text rendering might crash.");
  }

  // Fix 17: use cached font fetch (shared with ide-template.js)
  let customFont;
  const heeboBytes = await fetchHeeboFont();
  if (heeboBytes) {
    customFont = await pdfDoc.embedFont(heeboBytes);
  } else {
    customFont = await pdfDoc.embedStandardFont(PDFLib.StandardFonts.Helvetica);
  }

  const helveticaBoldFont = await pdfDoc.embedStandardFont(PDFLib.StandardFonts.HelveticaBold);
  const pages = pdfDoc.getPages();

  for (const field of template.fields) {
    if (field.page >= pages.length) field.page = 0;
    const page                       = pages[field.page];
    const { width: pageWidth, height: pageHeight } = page.getSize();
    const pdfX = (field.x / 100) * pageWidth;
    const pdfY = pageHeight - ((field.y + field.h) / 100) * pageHeight;
    const pdfW = (field.w / 100) * pageWidth;
    const pdfH = (field.h / 100) * pageHeight;

    if (field.type === 'text' || field.type === 'select') {
      const printableText = processRTLText(formData[field.name] || "");
      const fontSize      = Math.max(8, Math.min(14, pdfH * 0.65));

      try {
        let textWidth = 0;
        try { textWidth = customFont.widthOfTextAtSize(printableText, fontSize); } catch (_) {}
        const xPos = Math.max(pdfX + 5, pdfX + pdfW - textWidth - 5);
        page.drawText(printableText, {
          x: xPos, y: pdfY + (pdfH - fontSize) / 2 + 2,
          size: fontSize, font: customFont, color: PDFLib.rgb(0, 0, 0),
          maxWidth: pdfW - 10, lineHeight: fontSize
        });
      } catch (drawErr) {
        console.error("Error drawing text field", field.name, drawErr);
        try {
          const safeText     = printableText.replace(/[^\x00-\x7F]/g, "");
          const standardFont = await pdfDoc.embedStandardFont(PDFLib.StandardFonts.Helvetica);
          page.drawText(safeText, {
            x: pdfX + 5, y: pdfY + (pdfH - 10) / 2 + 2,
            size: 10, font: standardFont, color: PDFLib.rgb(0, 0, 0)
          });
        } catch (fallbackErr) {
          console.error("Critical fallback text drawing error:", fallbackErr);
        }
      }
    } else if (field.type === 'checkbox') {
      if (formData[field.name] === true) {
        const xSize = pdfH * 0.75;
        page.drawText('X', {
          x: pdfX + (pdfW - xSize * 0.6) / 2, y: pdfY + (pdfH - xSize * 0.85) / 2,
          size: xSize, font: helveticaBoldFont, color: PDFLib.rgb(0.1, 0.1, 0.1)
        });
      }
    } else if (field.type === 'signature') {
      const sigBase64 = signatureImagesMap[field.id] ||
        (isAutoStampField(field) ? generateCompanyStampBase64() : null);
      if (sigBase64) {
        const signatureImage = await pdfDoc.embedPng(sigBase64);
        page.drawImage(signatureImage, { x: pdfX, y: pdfY, width: pdfW, height: pdfH });
      }
    }
  }

  return await pdfDoc.save();
}

// Minimal RTL text processing — date reformatting only; Hebrew shaped natively by Heebo font
function processRTLText(text) {
  if (!text) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    const [y, m, d] = text.split('-');
    return `${d}/${m}/${y}`;
  }
  return text;
}

// Auto-email the signed PDF link to the admin via EmailJS
async function sendSignedFormEmail(customerName, templateKey, pdfLink) {
  const formNames = {
    'portability':         'טופס בקשת ניוד מספר',
    'ownership_seller':    'טופס העברת בעלות - עובד חדש',
    'ownership_buyer':     'טופס העברת בעלות - עובד עוזב',
    'ide-terms-agreement': 'הסכם שימוש ורכישת מכשיר נייד (IDE)'
  };

  const templateParams = {
    customer_name: customerName,
    form_name:     formNames[templateKey] || templateKey,
    timestamp:     new Date().toLocaleString('he-IL'),
    pdf_link:      pdfLink
  };

  try {
    await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams);
    console.log("Admin notification email sent successfully.");
  } catch (err) {
    console.error("EmailJS send failed:", err);
  }
}

function downloadSignedPdf() {
  if (!state.signedPdfBytes) return;
  const blob = new Blob([state.signedPdfBytes], { type: 'application/pdf' });
  const link = document.createElement('a');
  link.href  = URL.createObjectURL(blob);
  link.download = `Partner_Signed_${state.activeTemplate}_${Date.now()}.pdf`;
  link.click();
  showToast("הקובץ הורד למחשבכם", "success");
}
