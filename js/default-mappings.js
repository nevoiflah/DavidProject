// Auto-derived field mappings from PDF coordinate analysis.
// All positions are percentages of page width/height, extracted from the actual form rectangles.
// ide-terms-agreement is excluded — it has its own programmatic field setup in ide-template.js.

const DEFAULT_FIELD_MAPPINGS = {

  /* ------------------------------------------------------------------ */
  /*  טופס בקשת ניוד מספר  —  portability                               */
  /* ------------------------------------------------------------------ */
  "portability": {
    "fields": [
      // ── Page 1: client header fields ────────────────────────────────
      {
        "id": "dm_niyud_client_name",
        "name": "client_name",
        "label": "שם לקוח",
        "type": "text",
        "page": 0,
        "x": 47, "y": 11.3, "w": 39, "h": 2.8,
        "required": true, "color": "purple"
      },
      {
        "id": "dm_niyud_client_num",
        "name": "client_number",
        "label": "מספר לקוח",
        "type": "text",
        "page": 0,
        "x": 47, "y": 14.0, "w": 39, "h": 2.8,
        "required": false, "color": "purple"
      },
      {
        "id": "dm_niyud_date",
        "name": "form_date",
        "label": "תאריך",
        "type": "text",
        "page": 0,
        "x": 48, "y": 20.5, "w": 18, "h": 2.8,
        "required": true, "color": "purple"
      },
      // ── Page 1: numbers table — row 1 (first number to port) ────────
      {
        "id": "dm_niyud_phone1",
        "name": "port_number_1",
        "label": "מס' מנוייד (1)",
        "type": "text",
        "page": 0,
        "x": 83.1, "y": 55.8, "w": 10.2, "h": 2.8,
        "required": true, "color": "purple"
      },
      {
        "id": "dm_niyud_operator1",
        "name": "from_operator_1",
        "label": "מפעיל ננטש (1)",
        "type": "text",
        "page": 0,
        "x": 18.8, "y": 55.8, "w": 14.8, "h": 2.8,
        "required": true, "color": "purple"
      },
      {
        "id": "dm_niyud_idnum1",
        "name": "id_number_1",
        "label": "מספר זיהוי (1)",
        "type": "text",
        "page": 0,
        "x": 33.7, "y": 55.8, "w": 7.8, "h": 2.8,
        "required": false, "color": "purple"
      },
      // ── Page 1: customer signature ───────────────────────────────────
      {
        "id": "dm_niyud_sig_customer",
        "name": "sig_customer",
        "label": "חתימת לקוח",
        "type": "signature",
        "page": 0,
        "x": 33, "y": 76.5, "w": 26, "h": 9,
        "required": true, "color": "purple"
      },
      // ── Page 2: sales rep fields ─────────────────────────────────────
      {
        "id": "dm_niyud_agent_name",
        "name": "agent_name",
        "label": "שם נציג מכירות",
        "type": "text",
        "page": 1,
        "x": 8.4, "y": 84.2, "w": 22.3, "h": 2.8,
        "required": false, "color": "yellow"
      },
      {
        "id": "dm_niyud_sig_agent",
        "name": "sig_agent",
        "label": "חתימת נציג מכירות",
        "type": "signature",
        "page": 1,
        "x": 36.4, "y": 82.0, "w": 34.2, "h": 8,
        "required": false, "color": "yellow"
      },
      {
        "id": "dm_niyud_agent_date",
        "name": "agent_date",
        "label": "תאריך (נציג)",
        "type": "text",
        "page": 1,
        "x": 81.5, "y": 84.2, "w": 11.6, "h": 2.8,
        "required": false, "color": "yellow"
      }
    ]
  },

  /* ------------------------------------------------------------------ */
  /*  העברת בעלות — עובד חדש (מוסר)  —  ownership_seller               */
  /*  Uses page 0 of the ownership PDF                                   */
  /* ------------------------------------------------------------------ */
  "ownership_seller": {
    "fields": [
      // ── Subscriber phone numbers to transfer ────────────────────────
      {
        "id": "dm_os_phones",
        "name": "transfer_phones",
        "label": "מספרי קו להעברה",
        "type": "text",
        "page": 0,
        "x": 2.4, "y": 27.5, "w": 90.9, "h": 2.8,
        "required": true, "color": "purple"
      },
      // ── Seller identity row ──────────────────────────────────────────
      {
        "id": "dm_os_seller_name",
        "name": "seller_name",
        "label": "שם המוכר / עוזב",
        "type": "text",
        "page": 0,
        "x": 57.6, "y": 58.5, "w": 25.2, "h": 2.8,
        "required": true, "color": "purple"
      },
      {
        "id": "dm_os_seller_id",
        "name": "seller_id",
        "label": "ת.ז / ח.פ מוכר",
        "type": "text",
        "page": 0,
        "x": 31.8, "y": 58.5, "w": 25.8, "h": 2.8,
        "required": true, "color": "purple"
      },
      {
        "id": "dm_os_seller_clientnum",
        "name": "seller_client_number",
        "label": "מספר לקוח מוכר",
        "type": "text",
        "page": 0,
        "x": 82.8, "y": 58.5, "w": 10.4, "h": 2.8,
        "required": false, "color": "purple"
      },
      {
        "id": "dm_os_seller_type",
        "name": "seller_client_type",
        "label": "סוג לקוח",
        "type": "text",
        "page": 0,
        "x": 4.2, "y": 58.5, "w": 27.6, "h": 2.8,
        "required": false, "color": "purple"
      },
      // ── Page 1: buyer/customer signatures (top + bottom) ─────────────
      {
        "id": "dm_os_sig_buyer_top",
        "name": "sig_buyer_top",
        "label": "חתימת IDE",
        "type": "signature",
        "page": 1,
        "x": 12.8, "y": 39.0, "w": 30, "h": 8,
        "required": true, "color": "purple"
      },
      {
        "id": "dm_os_sig_buyer_bottom",
        "name": "sig_buyer_bottom",
        "label": "חתימת IDE",
        "type": "signature",
        "page": 1,
        "x": 4, "y": 88.0, "w": 40, "h": 9,
        "required": true, "color": "purple"
      },
      // ── Page 2: payment-page customer signature ──────────────────────
      {
        "id": "dm_os_sig_payment",
        "name": "sig_buyer_payment",
        "label": "חתימת IDE",
        "type": "signature",
        "page": 2,
        "x": 20.8, "y": 89.5, "w": 32.3, "h": 8,
        "required": false, "color": "yellow"
      }
    ]
  },

  /* ------------------------------------------------------------------ */
  /*  העברת בעלות — עובד עוזב (מקבל)  —  ownership_buyer               */
  /*  Uses pages 1 and 2 of the ownership PDF                            */
  /* ------------------------------------------------------------------ */
  "ownership_buyer": {
    "fields": [
      // ── Page 0: client signature at top (near "סוג לקוח") ────────────
      {
        "id": "dm_ob_sig_client_top",
        "name": "sig_client_top",
        "label": "חתימת IDE",
        "type": "signature",
        "page": 0,
        "x": 4, "y": 57.0, "w": 40, "h": 8,
        "required": true, "color": "purple"
      },
      // ── Page 0: IDE (transferor) signature at bottom ─────────────────
      {
        "id": "dm_ob_sig_ide",
        "name": "sig_ide_seller",
        "label": "חתימת IDE (מוכר)",
        "type": "signature",
        "page": 0,
        "x": 4, "y": 68.0, "w": 40, "h": 10,
        "required": true, "color": "purple"
      },
      // ── Page 1 (buyer details) ───────────────────────────────────────
      {
        "id": "dm_ob_buyer_name",
        "name": "buyer_name",
        "label": "שם הקונה / מצטרף",
        "type": "text",
        "page": 1,
        "x": 12.8, "y": 39.3, "w": 49.5, "h": 2.8,
        "required": true, "color": "purple"
      },
      {
        "id": "dm_ob_buyer_id",
        "name": "buyer_id",
        "label": "ת.ז קונה",
        "type": "text",
        "page": 1,
        "x": 58.1, "y": 73.5, "w": 28.1, "h": 2.8,
        "required": true, "color": "purple"
      },
      {
        "id": "dm_ob_cc_holder",
        "name": "cc_holder_name",
        "label": "שם בעל כרטיס אשראי",
        "type": "text",
        "page": 1,
        "x": 1.9, "y": 73.5, "w": 44.3, "h": 2.8,
        "required": false, "color": "purple"
      },
      {
        "id": "dm_ob_zip",
        "name": "buyer_zip",
        "label": "מיקוד",
        "type": "text",
        "page": 1,
        "x": 86.2, "y": 73.5, "w": 7.3, "h": 2.8,
        "required": false, "color": "purple"
      },
      {
        "id": "dm_ob_city",
        "name": "buyer_city",
        "label": "יישוב",
        "type": "text",
        "page": 1,
        "x": 81.7, "y": 76.2, "w": 11.8, "h": 2.8,
        "required": false, "color": "purple"
      },
      {
        "id": "dm_ob_address",
        "name": "buyer_address",
        "label": "רחוב / ת.ד",
        "type": "text",
        "page": 1,
        "x": 31.4, "y": 76.2, "w": 50.3, "h": 2.8,
        "required": false, "color": "purple"
      },
      {
        "id": "dm_ob_apt",
        "name": "buyer_apt",
        "label": "דירה",
        "type": "text",
        "page": 1,
        "x": 15.2, "y": 76.2, "w": 16.2, "h": 2.8,
        "required": false, "color": "purple"
      },
      {
        "id": "dm_ob_house",
        "name": "buyer_house",
        "label": "מספר בית",
        "type": "text",
        "page": 1,
        "x": 1.9, "y": 76.2, "w": 13.3, "h": 2.8,
        "required": false, "color": "purple"
      },
      {
        "id": "dm_ob_contact",
        "name": "contact_name",
        "label": "שם איש קשר",
        "type": "text",
        "page": 1,
        "x": 64.1, "y": 79.0, "w": 23.3, "h": 2.8,
        "required": false, "color": "purple"
      },
      {
        "id": "dm_ob_contact_phone",
        "name": "contact_phone",
        "label": "נייד איש קשר",
        "type": "text",
        "page": 1,
        "x": 17.1, "y": 79.0, "w": 19.6, "h": 2.8,
        "required": false, "color": "purple"
      },
      {
        "id": "dm_ob_sig_buyer",
        "name": "sig_buyer",
        "label": "חתימת הלקוח הקונה",
        "type": "signature",
        "page": 1,
        "x": 4, "y": 88.0, "w": 40, "h": 9,
        "required": true, "color": "purple"
      },
      // ── Page 2 (payment / bank details) ─────────────────────────────
      {
        "id": "dm_ob_cc_number",
        "name": "cc_number",
        "label": "מספר כרטיס אשראי",
        "type": "text",
        "page": 2,
        "x": 70.9, "y": 43.2, "w": 23.4, "h": 2.8,
        "required": false, "color": "purple"
      },
      {
        "id": "dm_ob_cc_expiry",
        "name": "cc_expiry",
        "label": "תוקף כרטיס",
        "type": "text",
        "page": 2,
        "x": 54.7, "y": 43.2, "w": 16.2, "h": 2.8,
        "required": false, "color": "purple"
      },
      {
        "id": "dm_ob_sig_payment",
        "name": "sig_buyer_payment",
        "label": "חתימת IDE",
        "type": "signature",
        "page": 2,
        "x": 20.8, "y": 89.5, "w": 32.3, "h": 8,
        "required": false, "color": "yellow"
      }
    ]
  },

  /* ------------------------------------------------------------------ */
  /*  הסכם שימוש ורכישת מכשיר נייד (IDE)  —  ide-terms-agreement        */
  /*  Signature section is on page 2 (index 1) of תקנון טלפונים.pdf     */
  /*  Coordinates extracted from actual PDF text positions               */
  /* ------------------------------------------------------------------ */
  "ide-terms-agreement": {
    "fields": [
      {
        "id": "dm_ide_name",
        "name": "employee_name",
        "label": "שם העובד",
        "type": "text",
        "page": 1,
        "x": 57.2, "y": 35.2, "w": 18.5, "h": 2.8,
        "required": true, "color": "purple"
      },
      {
        "id": "dm_ide_id",
        "name": "employee_id",
        "label": "תעודת זהות",
        "type": "text",
        "page": 1,
        "x": 32.5, "y": 35.2, "w": 19.5, "h": 2.8,
        "required": true, "color": "purple"
      },
      {
        "id": "dm_ide_date",
        "name": "agreement_date",
        "label": "תאריך",
        "type": "text",
        "page": 1,
        "x": 16.4, "y": 35.2, "w": 12.0, "h": 2.8,
        "required": true, "color": "purple"
      },
      {
        "id": "dm_ide_sig",
        "name": "employee_signature",
        "label": "חתימת העובד",
        "type": "signature",
        "page": 1,
        "x": 2.0, "y": 38.5, "w": 55.0, "h": 8.0,
        "required": true, "color": "purple"
      }
    ]
  }

};
