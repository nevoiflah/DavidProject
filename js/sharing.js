/* -------------------------------------------------------------------------- */
/*                   Cloud Sharing and Configuration Export/Import            */
/* -------------------------------------------------------------------------- */

function updateMailtoLink(fileUrl) {
  let urlToUse = "", userName = "לקוח פרטנר";

  try { urlToUse = fileUrl || state.uploadedFileUrl || ""; } catch (_) {}

  try {
    const tpl = state.templates[state.activeTemplate];
    if (tpl && tpl.fields) {
      const nameField = tpl.fields.find(f => f.label.includes('שם') || f.name.includes('name'));
      if (nameField) {
        const inputEl = document.querySelector(`[data-field-id="${nameField.id}"]`);
        if (inputEl && inputEl.value) userName = inputEl.value.trim();
      }
    }
  } catch (err) {
    console.error("Error finding name in updateMailtoLink:", err);
  }

  const recipient  = "mayako@ide-tech.com";
  const subjectMap = {
    'portability':         'טפסים חתומים - בקשת ניוד',
    'ownership_seller':    'טפסים חתומים - העברת בעלות עובד חדש',
    'ownership_buyer':     'טפסים חתומים - העברת בעלות עובד עוזב',
    'ide-terms-agreement': 'הסכם חתום - שימוש ורכישת מכשיר IDE'
  };
  const subject = subjectMap[state.activeTemplate] || "טפסים חתומים";

  const body = urlToUse
    ? `היי מיה,\n\nמצורפים הטפסים החתומים של ${userName}. לצפייה והורדה לחצי כאן:\n${urlToUse}`
    : `היי מיה,\n\nמצורפים הטפסים החתומים של ${userName}.\n\nקובץ ה-PDF החתום הורד למחשבך באופן אוטומטי (בתיקיית ההורדות).\nאנא גררי או צרפי את הקובץ למייל זה.\n\nתודה.`;

  const mailtoUrl = `https://outlook.office.com/mail/deeplink/compose?to=${encodeURIComponent(recipient)}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  const mailtoLinkEl = document.getElementById('btn-send-mailto-link');
  if (mailtoLinkEl) mailtoLinkEl.href = mailtoUrl;
}

async function exportTemplateConfig(templateKey) {
  const tpl = state.templates[templateKey];
  if (!tpl || (!tpl.pdfBytes && (!tpl.images || tpl.images.length === 0))) {
    showToast("התבנית ריקה, לא ניתן לייצא הגדרות", "warning");
    return;
  }

  showToast("מכין קובץ ייצוא להורדה...", "info");

  try {
    const configData = {
      templateKey,
      isImageTemplate: tpl.isImageTemplate,
      fields:          tpl.fields,
      pdfBytes:        tpl.pdfBytes ? arrayBufferToBase64(tpl.pdfBytes) : null,
      images:          tpl.images ? tpl.images.map(img => ({ bytes: arrayBufferToBase64(img.bytes), type: img.type })) : []
    };

    const blob = new Blob([JSON.stringify(configData)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href  = URL.createObjectURL(blob);
    link.download = `Partner_Template_Config_${templateKey}.json`;
    link.click();
    showToast("קובץ ההגדרות יוצא בהצלחה!", "success");
  } catch (err) {
    console.error("Export configuration failed", err);
    showToast("שגיאה בייצוא הגדרות", "error");
  }
}

async function importTemplateConfig(file) {
  if (!file) return;
  showToast("מעבד את קובץ ההגדרות...", "info");

  try {
    const text   = await new Promise((resolve, reject) => {
      const reader   = new FileReader();
      reader.onload  = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });

    const data   = JSON.parse(text);
    const tplKey = data.templateKey;

    if (!tplKey || !state.templates[tplKey]) {
      showToast("מפתח תבנית לא נתמך בקובץ המיובא", "error");
      return;
    }

    const tpl            = state.templates[tplKey];
    tpl.isImageTemplate  = data.isImageTemplate || false;
    tpl.fields           = data.fields  || [];
    tpl.pdfBytes         = data.pdfBytes ? base64ToArrayBuffer(data.pdfBytes) : null;
    tpl.images           = data.images  ? data.images.map(img => ({ bytes: base64ToArrayBuffer(img.bytes), type: img.type })) : [];

    await saveStateToDB();
    updateTemplateCardStatus(tplKey);
    showToast("התבנית יובאה בהצלחה!", "success");
    switchView('dashboard');
  } catch (err) {
    console.error("Import configuration failed", err);
    showToast("שגיאה בייבוא הגדרות: קובץ לא תקין", "error");
  }
}

async function shareTemplateConfig(templateKey) {
  const tpl = state.templates[templateKey];
  if (!tpl || (!tpl.pdfBytes && (!tpl.images || tpl.images.length === 0))) {
    showToast("התבנית ריקה, לא ניתן לשתף אותה", "warning");
    return;
  }

  showToast("אורז את הטופס ומעלה לענן השיתוף...", "info");

  try {
    const configData = {
      templateKey,
      isImageTemplate: tpl.isImageTemplate,
      fields:          tpl.fields,
      pdfBytes:        tpl.pdfBytes ? arrayBufferToBase64(tpl.pdfBytes) : null,
      images:          tpl.images ? tpl.images.map(img => ({ bytes: arrayBufferToBase64(img.bytes), type: img.type })) : []
    };

    const blob        = new Blob([JSON.stringify(configData)], { type: 'application/json' });
    const filename    = `partner_config_${templateKey}_${Date.now()}.json`;
    const formDataObj = new FormData();
    formDataObj.append('files[]', blob, filename);

    const response = await fetch('https://uguu.se/upload', { method: 'POST', body: formDataObj });
    const resData  = await response.json();

    if (resData?.success && resData.files?.[0]) {
      const cloudConfigUrl = resData.files[0].url;
      const shareUrl       = `${window.location.origin}${window.location.pathname}?config=${encodeURIComponent(cloudConfigUrl)}&fill=${templateKey}`;

      document.getElementById('share-link-input').value = shareUrl;
      document.getElementById('share-modal').classList.remove('hidden');
      showToast("הטופס הועלה לענן בהצלחה!", "success");
    } else {
      throw new Error("Cloud upload response was unsuccessful");
    }
  } catch (err) {
    console.error("Cloud sharing failed", err);
    showToast("שגיאה בשיתוף הענן. נסה שוב מאוחר יותר", "error");
  }
}

async function loadConfigFromUrlParam() {
  const urlParams = new URLSearchParams(window.location.search);
  const configUrl = urlParams.get('config');
  const fillParam = urlParams.get('fill');
  if (!configUrl) return;

  const loader = document.getElementById('shared-loading-overlay');
  if (loader) { loader.classList.remove('hidden'); loader.style.display = 'flex'; }

  console.log("Fetching shared template configuration from:", configUrl);

  try {
    const response = await fetch(configUrl);
    if (!response.ok) throw new Error("HTTP error " + response.status);

    const data   = await response.json();
    const tplKey = data.templateKey || fillParam;

    if (!tplKey || !state.templates[tplKey]) throw new Error("Template key unsupported: " + tplKey);

    const tpl            = state.templates[tplKey];
    tpl.isImageTemplate  = data.isImageTemplate || false;
    tpl.fields           = data.fields  || [];
    tpl.pdfBytes         = data.pdfBytes ? base64ToArrayBuffer(data.pdfBytes) : null;
    tpl.images           = data.images  ? data.images.map(img => ({ bytes: base64ToArrayBuffer(img.bytes), type: img.type })) : [];

    await saveStateToDB();
    updateTemplateCardStatus(tplKey);
    showToast("הגדרות טופס משותף נטענו בהצלחה!", "success");

    if (loader) { loader.classList.add('hidden'); loader.style.display = 'none'; }

    state.isCustomerFillMode = true;
    if (state.clientName) {
      openFormFiller(tplKey);
    } else {
      state.directFillTemplate = tplKey;
      switchView('dashboard');
    }
  } catch (err) {
    console.error("Failed to load configuration from URL param:", err);
    if (loader) { loader.classList.add('hidden'); loader.style.display = 'none'; }
    showToast("שגיאה בטעינת קובץ ההגדרות מהקישור", "error");
  }
}
