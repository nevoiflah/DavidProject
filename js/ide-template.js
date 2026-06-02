/* -------------------------------------------------------------------------- */
/*          IDE Mobile Agreement — Auto-generated template on first load      */
/* -------------------------------------------------------------------------- */

async function autoInitializeIDETemplate() {
  const tpl = state.templates['ide-terms-agreement'];
  if (!tpl) return;

  // If the preloader already loaded תקנון טלפונים.pdf as the background, don't overwrite it.
  // The actual PDF is the source of truth; the programmatic generator was a fallback.
  if (tpl.images && tpl.images.length > 0) {
    updateTemplateCardStatus('ide-terms-agreement');
    return;
  }

  if (tpl.pdfBytes && tpl.pdfBytes.byteLength > 0) {
    updateTemplateCardStatus('ide-terms-agreement');
    return;
  }

  console.log("Generating IDE Mobile Agreement PDF dynamically (fallback — no bundled PDF found)...");

  const pdfDoc = await PDFLib.PDFDocument.create();
  if (typeof fontkit !== 'undefined') {
    pdfDoc.registerFontkit(fontkit);
  }

  // Fix 17: use cached font fetch
  let customFont;
  const heeboBytes = await fetchHeeboFont();
  if (heeboBytes) {
    customFont = await pdfDoc.embedFont(heeboBytes);
  } else {
    customFont = await pdfDoc.embedStandardFont(PDFLib.StandardFonts.Helvetica);
  }

  try {
    // ------------------ PAGE 1: Contract Text ------------------
    const page1 = pdfDoc.addPage([595, 842]);
    const { width: p1W, height: p1H } = page1.getSize();

    page1.drawRectangle({ x: 20, y: 20, width: p1W - 40, height: p1H - 40, borderWidth: 1, borderColor: PDFLib.rgb(0.8, 0.8, 0.8), color: PDFLib.rgb(1, 1, 1) });
    page1.drawRectangle({ x: 20, y: p1H - 65, width: p1W - 40, height: 45, color: PDFLib.rgb(0.06, 0.09, 0.16) });
    drawHebrewTextRightAligned(page1, "תנאי שימוש ורכישת מכשיר נייד - חברת IDE", p1W - 35, p1H - 53, 16, customFont, PDFLib.rgb(1, 1, 1));

    let y = p1H - 95;
    const textLines = [
      { text: "1. כללי ומשך ההסכם", isHeader: true },
      { text: "• החברה מעמידה לרשות העובד מכשיר טלפון וקו תקשורת לשימוש מעורב (עסקי ופרטי)." },
      { text: "• תקופת ההסכם: משך ההסכם עבור כל מכשיר הינו 30 חודשים (להלן: \"תקופת ההסכם\")." },
      { text: "• עובד אשר בחר לממש את זכאותו ולרכוש מכשיר טלפון במסגרת ההסכם, ובמועד סיום העסקתו - בין אם עקב" },
      { text: "  התפטרות ובין אם עקב פיטורים - טרם חלפו 30 חודשים ממועד הרכישה, יהיה מחויב בתשלום מלוא היתרה" },
      { text: "  ו/או ההפרש שנותר לתשלום עבור המכשיר, בהתאם לתנאי ההסכם." },
      { text: "" },
      { text: "2. שימוש בחו\"ל", isHeader: true },
      { text: "• המכשיר כולל חבילת חו\"ל מובנית ל-121 מדינות בהתאם למדיניות החברה." },
      { text: "• באחריות העובד לוודא כי יעד הנסיעה כלול ברשימה בטרם השימוש. חריגות יחויבו על חשבון העובד." },
      { text: "" },
      { text: "3. שדרוגים ותשלומים נוספים", isHeader: true },
      { text: "• במידה והעובד בחר לשדרג את המכשיר לדגם יקר יותר בתוספת תשלום מול חברת הסלולר או החברה," },
      { text: "  לא יינתן כל זיכוי או החזר בגין סכום זה במקרה של סיום התקשרות או החזרת המכשיר." },
      { text: "" },
      { text: "4. סיום העסקה ורכישת המכשיר", isHeader: true },
      { text: "במקרה של סיום יחסי עובד-מעסיק (מכל סיבה שהיא) לפני תום 30 חודשי ההסכם, יחולו הכללים הבאים:" },
      { text: "• ניוד המספר: העובד מתחייב לבצע ניוד של קו הטלפון חזרה לבעלותו הפרטית לא יאוחר ממועד סיום יחסי" },
      { text: "  עובד-מעסיק." },
      { text: "• עובד אשר בחר לממש את ההטבה ולרכוש מכשיר טלפון במסגרת ההסכם, ובמועד סיום העסקתו - בין אם עקב" },
      { text: "  התפטרות ובין אם עקב פיטורים - טרם חלפו 30 חודשים ממועד הרכישה, יהיה מחויב בתשלום מלוא היתרה" },
      { text: "  ו/או ההפרש שנותר לתשלום עבור המכשיר, בהתאם לתנאי ההסכם." },
      { text: "• העובד נותן בזאת את הסכמתו לכך שהסכום שנותר לתשלום ינוכה מכל סכום שיגיע לו מהמעסיק בעת" },
      { text: "  סיום העסקתו, לרבות משכרו האחרון ו/או מתשלומי גמר חשבון." },
      { text: "• עובד שעזב את החברה בתוך שישה חודשים ממועד קבלת המכשיר יחויב במלוא עלות הרכישה של המכשיר." },
      { text: "• חישוב העלות: מחיר הרכישה ייקבע לפי: מחיר הרכישה המקורי של המכשיר בתוספת מע\"מ כחוק פחות" },
      { text: "  מספר חודשי השימוש בפועל. לדוגמה: אם המכשיר עלה 3,000 ש\"ח והעובד עזב לאחר 10 חודשים," },
      { text: "  יתרת התשלום תהיה עבור 20 החודשים הנותרים." },
      { text: "" },
      { text: "5. אבטחה ופרטיות", isHeader: true },
      { text: "• העובד אחראי לגיבוי תכניו הפרטיים. עם רכישת המכשיר, החברה תסיר כל הרשאת גישה לרשת" },
      { text: "  הארגונית/מיילים של החברה." },
      { text: "" },
      { text: "נספחים מצורפים:  1. נספח א: עיקרי ההסכם (תנאי תכנית).  2. נספח ב: רשימת דגמי טלפונים ומחירון." }
    ];

    textLines.forEach(lineObj => {
      if (lineObj.text === "") { y -= 8; return; }
      if (lineObj.isHeader) {
        y -= 4;
        drawHebrewTextRightAligned(page1, lineObj.text, p1W - 35, y, 11, customFont, PDFLib.rgb(0.06, 0.09, 0.2), true);
        y -= 14;
      } else {
        drawHebrewTextRightAligned(page1, lineObj.text, p1W - 35, y, 8.5, customFont, PDFLib.rgb(0.2, 0.2, 0.2));
        y -= 12;
      }
    });

    y = p1H - 580;
    page1.drawLine({ start: { x: 30, y }, end: { x: p1W - 30, y }, thickness: 1, color: PDFLib.rgb(0.8, 0.8, 0.8) });
    y -= 25;

    page1.drawRectangle({ x: p1W - 200, y: y - 5, width: 170, height: 20, color: PDFLib.rgb(0.95, 0.95, 0.98) });
    drawHebrewTextRightAligned(page1, "חתימה ואישור התנאים המפורטים לעיל:", p1W - 35, y, 10, customFont, PDFLib.rgb(0.06, 0.09, 0.2), true);
    y -= 20;
    drawHebrewTextRightAligned(page1, "אני מאשר כי קראתי את תנאי ההסכם, לרבות התחייבותי ל-30 חודשי שימוש ותנאי רכישת המכשיר במקרה של עזיבה.", p1W - 35, y, 8.5, customFont, PDFLib.rgb(0.1, 0.1, 0.1));
    y -= 25;
    drawHebrewTextRightAligned(page1, "מכשיר נבחר מהמחירון: _____________________________________________________", p1W - 35, y, 9.5, customFont, PDFLib.rgb(0.06, 0.09, 0.2), true);
    y -= 25;
    drawHebrewTextRightAligned(page1, "שם העובד: __________________  |  ת.ז: ___________________  |  תאריך: __________", p1W - 35, y, 9.5, customFont, PDFLib.rgb(0.06, 0.09, 0.2), true);
    y -= 35;
    drawHebrewTextRightAligned(page1, "חתימת העובד: _______________", p1W - 35, y, 9.5, customFont, PDFLib.rgb(0.06, 0.09, 0.2), true);

    // ------------------ PAGE 2: Appendix A ------------------
    const page2 = pdfDoc.addPage([595, 842]);
    page2.drawRectangle({ x: 20, y: 20, width: p1W - 40, height: p1H - 40, borderWidth: 1, borderColor: PDFLib.rgb(0.8, 0.8, 0.8), color: PDFLib.rgb(1, 1, 1) });
    page2.drawRectangle({ x: 20, y: p1H - 65, width: p1W - 40, height: 45, color: PDFLib.rgb(0.06, 0.09, 0.16) });
    drawHebrewTextRightAligned(page2, "נספח א' - תנאי תכנית IDE מנויים עסקיים", p1W - 35, p1H - 53, 15, customFont, PDFLib.rgb(1, 1, 1));

    let ty = p1H - 95;
    drawHebrewTextRightAligned(page2, "ריכוז זכויות וחובות במסלול פרטנר IDE:", p1W - 35, ty, 11, customFont, PDFLib.rgb(0.06, 0.09, 0.2), true);
    ty -= 25;

    const col1X = 35, col2X = 200, tableW = p1W - 70;
    page2.drawRectangle({ x: col1X, y: ty - 5, width: tableW, height: 25, color: PDFLib.rgb(0.9, 0.9, 0.95) });
    page2.drawRectangle({ x: col1X, y: ty - 5, width: tableW, height: 25, borderWidth: 1, borderColor: PDFLib.rgb(0.7, 0.7, 0.7) });
    drawHebrewTextRightAligned(page2, "נושא ותנאי בהסכם", p1W - 55, ty + 2, 10, customFont, PDFLib.rgb(0.06, 0.09, 0.2), true);
    drawHebrewTextRightAligned(page2, "פירוט ההטבה ומפרט השירות", col2X + 210, ty + 2, 10, customFont, PDFLib.rgb(0.06, 0.09, 0.2), true);
    ty -= 25;

    const rows = [
      { label: "תשלום חודשי קבוע",                           val: "25 ₪ לחודש" },
      { label: "כמות דקות / הודעות בארץ",                    val: "7000 דקות שיחה / 5000 הודעות SMS" },
      { label: "דקות לחו\"ל ליעדים נבחרים (012)",            val: "500 דקות למספרים נייחים (לארה\"ב וקנדה גם ניידים)" },
      { label: "נפח גלישה בארץ",                             val: "250GB במהירות דור 5" },
      { label: "חבילת חו\"ל (תקפה ל-30 יום)",                val: "דקת שיחה 0.6 ₪  |  2GB ב-49 ₪  |  6GB ב-82 ₪ (יעדים נבחרים)" },
      { label: "אחריות ושירות תיקונים",                       val: "שבר מסך ראשון בשנה חינם. שבר שני ומעלה: 250 ₪. שאר תיקונים חינם." },
      { label: "עלויות אובדן / גניבה (Total Loss)",          val: "מכשירים בדרג ב': השתתפות עצמית של 300 ₪ בלבד." },
      { label: "שירותים נוספים כלולים",                      val: "ESIM, FUNTONE, PARTNER 2, דור 5 (כלולים ללא תשלום)" }
    ];

    rows.forEach((r, idx) => {
      if (idx % 2 === 1) page2.drawRectangle({ x: col1X, y: ty - 5, width: tableW, height: 25, color: PDFLib.rgb(0.97, 0.97, 0.99) });
      page2.drawRectangle({ x: col1X, y: ty - 5, width: tableW, height: 25, borderWidth: 1, borderColor: PDFLib.rgb(0.85, 0.85, 0.85) });
      page2.drawLine({ start: { x: col2X + 170, y: ty + 20 }, end: { x: col2X + 170, y: ty - 5 }, thickness: 1, color: PDFLib.rgb(0.85, 0.85, 0.85) });
      drawHebrewTextRightAligned(page2, r.label, col2X + 160, ty + 2, 9, customFont, PDFLib.rgb(0.1, 0.1, 0.1), true);
      drawHebrewTextRightAligned(page2, r.val,   p1W - 235,   ty + 2, 8.5, customFont, PDFLib.rgb(0.2, 0.2, 0.2));
      ty -= 25;
    });

    ty -= 15;
    drawHebrewTextRightAligned(page2, "דגשים קריטיים ומידע נוסף:", p1W - 35, ty, 11, customFont, PDFLib.rgb(0.06, 0.09, 0.2), true);
    ty -= 20;
    [
      "• בכל שדרוג או רכישת מכשיר חדש - העובד זכאי לקבל מגן מסך קדמי ואחורי ללא תוספת תשלום כלל.",
      "• בסיום 30 חודשים, במידה והעובד לא הוסיף תשלום מכיסו בעת הרכישה המקורית - עליו לשלם תשלום סופי חד פעמי של",
      "  200 ₪ בתוספת מע\"מ כחוק ישירות לחברת הסלולר לצורך העברת הבעלות הסופית על שמו.",
      "• בסיום 30 חודשים, במידה והעובד הוסיף תשלום מכיסו בעת הרכישה המקורית (שדרוג דגם) - הוא זכאי לקבל את המכשיר",
      "  לבעלותו הפרטית המלאה בסיום 30 חודשי שימוש ללא כל תוספת תשלום נוספת."
    ].forEach(pt => {
      drawHebrewTextRightAligned(page2, pt, p1W - 35, ty, 8.5, customFont, PDFLib.rgb(0.2, 0.2, 0.2));
      ty -= 12;
    });

    // ------------------ PAGE 3: Appendix B (Pricing Table) ------------------
    const page3 = pdfDoc.addPage([595, 842]);
    page3.drawRectangle({ x: 20, y: 20, width: p1W - 40, height: p1H - 40, borderWidth: 1, borderColor: PDFLib.rgb(0.8, 0.8, 0.8), color: PDFLib.rgb(1, 1, 1) });
    page3.drawRectangle({ x: 20, y: p1H - 65, width: p1W - 40, height: 45, color: PDFLib.rgb(0.06, 0.09, 0.16) });
    drawHebrewTextRightAligned(page3, "נספח ב' - רשימת דגמי טלפונים ומחירון (מאי 2026)", p1W - 35, p1H - 53, 14, customFont, PDFLib.rgb(1, 1, 1));

    let p3y = p1H - 90;
    drawHebrewTextRightAligned(page3, "מחירון שדרוג והשתתפות עובד חודשית (המחירים לפני מע\"מ):", p1W - 35, p3y, 10, customFont, PDFLib.rgb(0.06, 0.09, 0.2), true);
    p3y -= 20;

    const c1X = 35, c2X = 215, c3X = 295, c4X = 375, c5X = 455, p3W = p1W - 70;
    page3.drawRectangle({ x: c1X, y: p3y - 5, width: p3W, height: 22, color: PDFLib.rgb(0.06, 0.09, 0.2) });
    drawHebrewTextRightAligned(page3, "דגם מכשיר",                  c2X - 5,   p3y + 2, 8.5, customFont, PDFLib.rgb(1, 1, 1), true);
    drawHebrewTextRightAligned(page3, "רכישה בסוף תקופה",           c3X - 5,   p3y + 2, 8.5, customFont, PDFLib.rgb(1, 1, 1), true);
    drawHebrewTextRightAligned(page3, "תשלום חברה",                  c4X - 5,   p3y + 2, 8.5, customFont, PDFLib.rgb(1, 1, 1), true);
    drawHebrewTextRightAligned(page3, "תוספת עובד",                  c5X - 5,   p3y + 2, 8.5, customFont, PDFLib.rgb(1, 1, 1), true);
    drawHebrewTextRightAligned(page3, "סה\"כ עלות (לפני מע\"מ)",    p1W - 40,  p3y + 2, 8.5, customFont, PDFLib.rgb(1, 1, 1), true);
    p3y -= 22;

    const phonesData = [
      { model: "Samsung Galaxy S26 256GB",       end: "200", comp: "1410", emp: "0",    total: "1410" },
      { model: "Samsung Galaxy S26 512GB",       end: "-",   comp: "1410", emp: "562",  total: "1972" },
      { model: "Samsung Galaxy S26 Plus 256GB",  end: "-",   comp: "1410", emp: "492",  total: "1902" },
      { model: "Samsung Galaxy S26 Plus 512GB",  end: "-",   comp: "1410", emp: "1062", total: "2472" },
      { model: "Samsung Galaxy S26 Ultra 256GB", end: "-",   comp: "1410", emp: "1074", total: "2484" },
      { model: "Samsung Galaxy S26 Ultra 512GB", end: "-",   comp: "1410", emp: "1621", total: "3031" },
      { model: "Samsung Galaxy S25 128GB",       end: "200", comp: "1410", emp: "0",    total: "1410" },
      { model: "Samsung Galaxy S25 256GB",       end: "200", comp: "1410", emp: "0",    total: "1410" },
      { model: "Samsung Galaxy S25 512GB",       end: "-",   comp: "1410", emp: "749",  total: "2159" },
      { model: "Samsung Galaxy S25 Ultra 256GB", end: "-",   comp: "1410", emp: "465",  total: "1875" },
      { model: "Samsung Galaxy S25 Ultra 512GB", end: "-",   comp: "1410", emp: "771",  total: "2181" },
      { model: "iPhone 16 128GB 5G",             end: "200", comp: "1410", emp: "0",    total: "1410" },
      { model: "iPhone 16 256GB 5G",             end: "-",   comp: "1410", emp: "613",  total: "2023" },
      { model: "iPhone 17 256GB 5G",             end: "-",   comp: "1410", emp: "571",  total: "1981" },
      { model: "iPhone 17 512GB 5G",             end: "-",   comp: "1410", emp: "1334", total: "2744" },
      { model: "iPhone Air 256GB 5G",            end: "-",   comp: "1410", emp: "486",  total: "1896" },
      { model: "iPhone Air 512GB 5G",            end: "-",   comp: "1410", emp: "1199", total: "2609" },
      { model: "iPhone 17 Pro 256GB 5G",         end: "-",   comp: "1410", emp: "1715", total: "3125" },
      { model: "iPhone 17 Pro 512GB 5G",         end: "-",   comp: "1410", emp: "2478", total: "3888" },
      { model: "iPhone 17 Pro MAX 256GB 5G",     end: "-",   comp: "1410", emp: "2096", total: "3506" },
      { model: "iPhone 17 Pro MAX 512GB 5G",     end: "-",   comp: "1410", emp: "2859", total: "4269" }
    ];

    phonesData.forEach((p, idx) => {
      if (idx % 2 === 1) page3.drawRectangle({ x: c1X, y: p3y - 5, width: p3W, height: 18, color: PDFLib.rgb(0.97, 0.97, 0.99) });
      page3.drawRectangle({ x: c1X, y: p3y - 5, width: p3W, height: 18, borderWidth: 1, borderColor: PDFLib.rgb(0.88, 0.88, 0.88) });
      [c2X, c3X, c4X, c5X].forEach(xVal => page3.drawLine({ start: { x: xVal, y: p3y + 13 }, end: { x: xVal, y: p3y - 5 }, thickness: 1, color: PDFLib.rgb(0.88, 0.88, 0.88) }));
      drawHebrewTextRightAligned(page3, p.model, c2X - 5,  p3y + 1, 7.5, customFont, PDFLib.rgb(0.1, 0.1, 0.1), true);
      drawHebrewTextRightAligned(page3, p.end,   c3X - 5,  p3y + 1, 7.5, customFont, PDFLib.rgb(0.2, 0.2, 0.2));
      drawHebrewTextRightAligned(page3, p.comp,  c4X - 5,  p3y + 1, 7.5, customFont, PDFLib.rgb(0.2, 0.2, 0.2));
      drawHebrewTextRightAligned(page3, p.emp,   c5X - 5,  p3y + 1, 7.5, customFont, PDFLib.rgb(0.2, 0.2, 0.2));
      drawHebrewTextRightAligned(page3, p.total, p1W - 40, p3y + 1, 7.5, customFont, PDFLib.rgb(0.2, 0.2, 0.2), true);
      p3y -= 18;
    });

    const pdfBytes = await pdfDoc.save();
    tpl.pdfBytes        = pdfBytes;
    tpl.isImageTemplate = false;

    const phoneListStr = phonesData.map(p => p.model).join(', ');

    tpl.fields = [
      { id: 'field_ide_model', name: 'device_model',      label: 'סוג המכשיר הנייד',  type: 'select',    page: 0, x: 25,   y: 77.2, w: 43.5, h: 3.2, required: true, color: 'purple', options: phoneListStr },
      { id: 'field_ide_name',  name: 'employee_name',     label: 'שם העובד',           type: 'text',      page: 0, x: 64.5, y: 82.5, w: 22,   h: 2.8, required: true, color: 'purple' },
      { id: 'field_ide_id',    name: 'employee_id',       label: 'תעודת זהות',         type: 'text',      page: 0, x: 37,   y: 82.5, w: 18,   h: 2.8, required: true, color: 'purple' },
      { id: 'field_ide_date',  name: 'agreement_date',    label: 'תאריך',              type: 'text',      page: 0, x: 19.5, y: 82.5, w: 10,   h: 2.8, required: true, color: 'purple' },
      { id: 'field_ide_sig',   name: 'employee_signature',label: 'חתימת העובד',        type: 'signature', page: 0, x: 54,   y: 86.8, w: 23,   h: 5.5, required: true, color: 'purple' }
    ];

    console.log("Generating high-res flat background images for mapping...");
    tpl.images          = await convertPdfToImages(pdfBytes, 300);
    tpl.isImageTemplate = true;

    await saveStateToDB();
    updateTemplateCardStatus('ide-terms-agreement');
    console.log("IDE Mobile template auto-initialized successfully!");
  } catch (err) {
    console.error("Error auto-initializing IDE mobile template:", err);
  }
}

// Draw right-aligned Hebrew text on a PDF page
function drawHebrewTextRightAligned(page, text, xRight, y, size, font, color, isBold = false) {
  if (!text) return;
  let textWidth = 0;
  try { textWidth = font.widthOfTextAtSize(text, size); } catch (e) { console.error("Error getting width for text", text, e); }
  try {
    page.drawText(text, { x: xRight - textWidth, y, size, font, color });
  } catch (drawErr) {
    console.error("Error drawing Hebrew text, trying ASCII fallback", text, drawErr);
    try {
      const safeText = text.replace(/[^\x00-\x7F]/g, "");
      if (safeText.trim()) page.drawText(safeText, { x: xRight - 50, y, size, color });
    } catch (fallbackErr) {
      console.error("Failed to draw fallback text", fallbackErr);
    }
  }
}
