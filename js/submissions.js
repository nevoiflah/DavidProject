/* -------------------------------------------------------------------------- */
/*                          Submissions Management                            */
/* -------------------------------------------------------------------------- */

async function renderSubmissions() {
  const wrapper = document.getElementById('submissions-list-wrapper');
  if (!wrapper) return;

  const isAuth = sessionStorage.getItem('partner_admin_auth') === 'true';
  if (!isAuth) {
    wrapper.innerHTML = `
      <div style="text-align: center; padding: 2.5rem 1.5rem; display: flex; flex-direction: column; align-items: center; gap: 1rem;">
        <div style="width: 50px; height: 50px; border-radius: 50%; background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.2); display: flex; align-items: center; justify-content: center; color: #f59e0b; box-shadow: 0 0 10px rgba(245, 158, 11, 0.15);">
          <i data-lucide="lock" style="width: 24px; height: 24px;"></i>
        </div>
        <div style="font-weight: 600; color: var(--text-main); font-size: 1.1rem;">אזור מוגן למנהל מערכת</div>
        <div style="color: var(--text-muted); font-size: 0.9rem; max-width: 420px; line-height: 1.5; margin: 0 auto;">
          הגישה לצפייה בטפסים שנחתמו על ידי לקוחות, עריכתם, אישורם והורדתם דורשת התחברות כמנהל מערכת.
        </div>
        <button class="btn btn-primary" data-action="redirect-login" style="margin-top: 0.5rem; padding: 10px 20px; display: inline-flex; align-items: center; gap: 8px;">
          <i data-lucide="log-in" style="width: 16px; height: 16px;"></i> התחבר לצפייה בטפסים
        </button>
      </div>
    `;
    if (typeof lucide !== 'undefined') lucide.createIcons();
    return;
  }

  try {
    const list = await dbHelper.getAllSubmissions();
    list.sort((a, b) => b.id.localeCompare(a.id));

    if (!list || list.length === 0) {
      wrapper.innerHTML = `<div class="card-desc" style="text-align: center; padding: 2rem;">טרם התקבלו טפסים חתומים.</div>`;
      return;
    }

    const formNames = {
      'portability':         'טופס בקשת ניוד מספר',
      'ownership_seller':    'טופס העברת בעלות - עובד חדש',
      'ownership_buyer':     'טופס העברת בעלות - עובד עוזב',
      'ide-terms-agreement': 'הסכם שימוש ורכישת מכשיר נייד (חברת IDE)'
    };

    let html = `
      <table style="width: 100%; border-collapse: collapse; text-align: right; min-width: 600px;">
        <thead>
          <tr style="border-bottom: 1px solid var(--panel-border); color: var(--text-muted); font-size: 0.9rem;">
            <th style="padding: 12px 8px;">שם הלקוח</th>
            <th style="padding: 12px 8px;">סוג הטופס</th>
            <th style="padding: 12px 8px;">תאריך ושעה</th>
            <th style="padding: 12px 8px;">סטטוס</th>
            <th style="padding: 12px 8px; text-align: left;">פעולות</th>
          </tr>
        </thead>
        <tbody>
    `;

    for (const sub of list) {
      const formName = formNames[sub.templateKey] || "טופס כללי";
      const status   = sub.status || 'pending';

      const statusLabelHtml = status === 'approved'
        ? `<span style="padding: 4px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: bold; background: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3);">מאושר</span>`
        : `<span style="padding: 4px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: bold; background: rgba(245, 158, 11, 0.15); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.3);">ממתין לאישור</span>`;

      const actionButtonsHtml = status === 'approved'
        ? `<button class="btn btn-primary" data-action="download-pdf" data-id="${sub.id}" style="padding: 6px 12px; font-size: 0.8rem; height: 32px; display: inline-flex; align-items: center; gap: 4px;">
             <i data-lucide="download" style="width: 14px; height: 14px;"></i> הורד PDF
           </button>`
        : `<button class="btn btn-primary" data-action="edit-submission" data-template="${sub.templateKey}" data-id="${sub.id}" style="padding: 6px 12px; font-size: 0.8rem; height: 32px; background: var(--accent-hover); border-color: var(--accent-hover); display: inline-flex; align-items: center; gap: 4px;">
             <i data-lucide="edit-3" style="width: 14px; height: 14px;"></i> ערוך ואשר
           </button>`;

      html += `
        <tr style="border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 0.95rem;">
          <td style="padding: 14px 8px; font-weight: 500; color: var(--text-main);">${escapeHtml(sub.customerName)}</td>
          <td style="padding: 14px 8px; color: var(--text-muted);">${formName}</td>
          <td style="padding: 14px 8px; color: var(--text-muted);">${sub.timestamp}</td>
          <td style="padding: 14px 8px;">${statusLabelHtml}</td>
          <td style="padding: 14px 8px; text-align: left;">
            ${actionButtonsHtml}
            <button class="btn btn-secondary" data-action="delete-submission" data-id="${sub.id}" style="padding: 6px 12px; font-size: 0.8rem; border-color: rgba(244,63,94,0.3); color: var(--danger-color); margin-right: 8px; height: 32px; display: inline-flex; align-items: center; gap: 4px;">
              <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i> מחק
            </button>
          </td>
        </tr>
      `;
    }

    html += `</tbody></table>`;
    wrapper.innerHTML = html;
    if (typeof lucide !== 'undefined') lucide.createIcons();
  } catch (err) {
    console.error("Error rendering submissions:", err);
    wrapper.innerHTML = `<div class="card-desc" style="text-align: center; padding: 2rem; color: var(--danger-color);">שגיאה בטעינת הרשומות מתוך בסיס הנתונים.</div>`;
  }
}

async function downloadSubmissionPdf(id) {
  try {
    const sub = await dbHelper.loadSubmission(id);
    if (!sub || !sub.pdfBytes) {
      showToast("הקובץ לא נמצא בבסיס הנתונים", "error");
      return;
    }

    const filenameMap = {
      'portability':         'Partner_Signed_Portability',
      'ownership_seller':    'Partner_Signed_Ownership_NewEmployee',
      'ownership_buyer':     'Partner_Signed_Ownership_LeavingEmployee',
      'ide-terms-agreement': 'Partner_Signed_IdeTermsAgreement'
    };
    const formName = filenameMap[sub.templateKey] || 'Signed_Form';

    const blob = new Blob([sub.pdfBytes], { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href  = URL.createObjectURL(blob);
    link.download = `${formName}_${sub.customerName.replace(/\s+/g, '_')}.pdf`;
    link.click();
    showToast("הקובץ הורד למחשבכם", "success");
  } catch (err) {
    console.error("Failed to download submission PDF:", err);
    showToast("שגיאה בהורדת הקובץ", "error");
  }
}

async function deleteSubmission(id) {
  if (!confirm("האם אתה בטוח שברצונך למחוק את הטופס החתום הזה לצמיתות?")) return;
  try {
    await dbHelper.deleteSubmission(id);
    showToast("הטופס נמחק בהצלחה", "success");
    await renderSubmissions();
  } catch (err) {
    console.error("Failed to delete submission:", err);
    showToast("שגיאה במחיקת הטופס", "error");
  }
}

function escapeHtml(str) {
  if (!str) return "";
  return str
    .replace(/&/g,  "&amp;")
    .replace(/</g,  "&lt;")
    .replace(/>/g,  "&gt;")
    .replace(/"/g,  "&quot;")
    .replace(/'/g,  "&#039;");
}
