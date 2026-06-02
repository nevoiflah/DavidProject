# Partner Digital Forms

A browser-based digital form signing system for managing Partner Communications telecom forms at IDE. Allows employees to fill and sign official PDF forms directly in the browser without printing, scanning, or third-party subscriptions. The admin receives a copy of each signed PDF automatically by email.

---

## What It Does

The system has two distinct roles:

**Admin (your friend at IDE)**
- Uploads Partner PDF forms and visually maps input fields onto them by dragging boxes over the relevant lines in the document
- Shares a link with a client or employee when a form needs to be signed
- Receives an automatic email with a download link to the signed PDF after submission
- Views, approves, and downloads all submitted forms from the admin panel

**Client / Employee**
- Opens the app (on any device, including mobile)
- Enters their name
- Sees the actual Partner PDF rendered on screen with input boxes overlaid exactly where the admin placed them
- Types into the fields and draws their signature with a finger or mouse directly on the document
- Submits, receives a downloadable signed PDF, and optionally sends it via Gmail

No installation is required on either side. The app runs entirely in the browser.

---

## Forms Included

The following official Partner Communications forms are bundled and load automatically on first visit:

| Form | File | Template Key |
|---|---|---|
| Portability request | `טופס ניוד_.pdf` | `portability` |
| Ownership transfer (new employee / transferor) | `העברת בעלות פרטי לעסקי ועסקי לפרטי.PDF` | `ownership_seller` |
| Ownership transfer (leaving employee / transferee) | same PDF, different field set | `ownership_buyer` |
| IDE mobile device usage agreement | `תקנון טלפונים.pdf` | `ide-terms-agreement` |

The IDE agreement form also has a pre-built field mapping (employee name, ID, date, device selection, signature) that works immediately without any admin setup.

---

## How to Deploy

The app is a static site with no server or backend. Deploy by dragging the project folder into Netlify.

1. Go to [netlify.com](https://netlify.com) and sign in
2. Click **Sites**, then drag the entire `DavidProject` folder onto the drop zone
3. Netlify will publish it and give you a URL (e.g. `https://random-name.netlify.app`)
4. Share that URL with clients for form filling

To update the app, drag the folder again or connect a Git repository.

---

## Admin Login

The admin login is accessible from the top navigation bar under **"כניסת מנהל"**.

Default credentials:
- **Username:** `admin`
- **Password:** `PartnerAdmin2026!`

To change the password, edit `js/auth.js` line 4 and redeploy.

The admin session is stored in `sessionStorage` and expires when the browser tab is closed.

---

## Email Notifications

When a client submits a signed form, the system automatically emails the signed PDF download link to `mayako@ide-tech.com` via EmailJS.

The EmailJS configuration is in `js/state.js`:

```js
const EMAILJS_SERVICE_ID  = 'service_zktab4h';
const EMAILJS_TEMPLATE_ID = 'template_m1yu7gd';
const EMAILJS_PUBLIC_KEY  = '3Gd9evrWKFqUP0XLw';
```

The email is sent from the connected Gmail account. The download link points to a temporary URL on uguu.se that expires after approximately 24 hours, so the signed PDF should be downloaded promptly. All submissions are also stored locally in the browser's IndexedDB on the client's device and can be accessed by the admin if they use the same browser.

To change the recipient email, update the **"To Email"** field in the EmailJS template at [dashboard.emailjs.com](https://dashboard.emailjs.com).

---

## First-Time Setup (Admin)

On first visit, the PDFs are converted to high-resolution images (300 DPI) in the background. This takes 15 to 40 seconds depending on device speed. Each form card will show a pulsing "טוען רקע..." badge while conversion is in progress.

After the backgrounds load, the IDE agreement is fully ready to use. The other three forms need field mapping before they can be filled by clients.

**To map a form:**
1. Log in as admin
2. Click "העלה ומפה שדות" on the relevant card
3. The PDF background will appear in the workspace
4. Use the accordion panel on the left to add preset fields (client name, ID, phone, etc.) or double-click directly on the PDF to place a field at that exact location
5. Drag fields to reposition them, drag the resize handle at the bottom-right corner of each field to resize
6. Double-click any field to edit its label, identifier, color, and whether it is required
7. Click "שמור מיפוי ויזואלי" to save — the form card will update to "מוכן לשימוש"

Mappings are saved to IndexedDB in the admin's browser and persist across sessions. Use "ייצוא" (Export) to download the mapping as a JSON file for backup, and "ייבוא הגדרות מטופס" to restore it on a different device.

---

## Sharing a Form with a Client

There is only one correct way to share a form with a client: the green "שתף קישור ללקוח" button on each form card.

**Why the plain site URL does not work for clients**

Field mappings (the positions of input boxes and signature fields) are stored in the admin's browser IndexedDB. That storage is local to the admin's device. When a client opens the site on their own device, their IndexedDB is empty and the form has no fields — the PDF background renders but there is nothing to fill in.

**The correct workflow**

1. Log in as admin on the Netlify URL (not a local file)
2. Map the fields for each form using the visual editor
3. Click the green "שתף קישור ללקוח" button on the form card
4. The app packages the PDF backgrounds and all field positions into a single JSON file and uploads it to a temporary cloud host
5. A sharable link is generated in the format `?config=<url>&fill=<key>`
6. Copy that link and send it to the client via WhatsApp, email, or any other channel
7. When the client opens the link, the app downloads the config and the form loads completely with all fields in the correct positions

**Important limitation**

The cloud link is valid for approximately 24 hours because it uses uguu.se as a temporary host. After it expires, the admin must click "שתף קישור ללקוח" again to generate a new link. If a form is shared frequently, consider generating a fresh link each time or on a daily basis.

**If you set up the field mapping on a local file (opening index.html directly)**

The IndexedDB data for a local file is stored under the `file://` origin. That data does not carry over to the Netlify deployment because Netlify uses an `https://` origin, which is a separate storage scope. Always do the initial field mapping directly on the deployed Netlify URL, not on a local copy of the file.

---

## Project Structure

```
DavidProject/
├── index.html              Main HTML shell — all views, modals, script tags
├── css/
│   ├── base.css            CSS variables, reset, focus rings, reduced-motion
│   ├── components.css      Header, buttons, cards, forms, badges
│   └── views.css           Mapper, filler, success screen, modals, toast, mobile layout
├── js/
│   ├── state.js            Central app state object and EmailJS credentials
│   ├── db.js               IndexedDB helper (templates + submissions stores)
│   ├── utils.js            Binary helpers, PDF merge, PDF-to-image conversion, font cache
│   ├── auth.js             Admin login and logout
│   ├── ui.js               View switching, toast, admin controls, onboarding, DB load/save
│   ├── mapper.js           Visual field editor — drag/drop, resize, field CRUD, page management
│   ├── filler.js           Inline form filling — renders PDF, overlays inputs and signature canvases
│   ├── pdf-compiler.js     Compiles signed PDF by overlaying data onto template pages
│   ├── submissions.js      Admin submissions table — list, download, delete
│   ├── sharing.js          Export/import JSON config, cloud share, mailto link
│   ├── ide-template.js     Programmatically generates the IDE mobile agreement PDF with pre-set fields
│   ├── preload.js          Auto-converts bundled PDFs to images on first visit
│   ├── pdf-assets.js       Bundled PDF files encoded as base64 strings (auto-generated)
│   └── app.js              DOMContentLoaded init and all event binding
└── [PDF files]             The three original Partner form PDFs
```

---

## How the PDF Signing Works

The app does not use PDF form fields (AcroForm). Instead:

1. When the admin uploads a PDF, it is converted to flat PNG images at 300 DPI using PDF.js. This eliminates all font rendering issues with Hebrew text.
2. The admin places field boxes visually on top of these images. Each box records its position as a percentage of the page width and height, so it is resolution-independent.
3. When the client fills the form, those same PNG images are rendered in the browser with transparent HTML inputs and signature canvases overlaid at the exact recorded coordinates.
4. On submission, pdf-lib creates a new PDF document using the PNG images as page backgrounds, then draws the text values and signature images directly onto each page at the calculated pixel coordinates.
5. The result is a flat, non-editable PDF with the content baked in.

---

## Technology Stack

| Library | Version | Purpose |
|---|---|---|
| pdf-lib | 1.17.1 | PDF creation and field injection |
| @pdf-lib/fontkit | 1.1.1 | Custom font embedding (Heebo Hebrew) |
| PDF.js | 2.16.105 | Rendering PDF pages as canvas images |
| Lucide | latest | Icon set |
| EmailJS Browser SDK | 4.x | Automatic email delivery on submission |
| Heebo (Google Fonts) | v28 | Hebrew-optimized font for UI and generated PDFs |

No build tools, no framework, no package manager. All scripts load from CDN or as local files.

---

## Updating the Bundled PDFs

The three PDFs are embedded as base64 strings inside `js/pdf-assets.js`. To replace or add a PDF:

1. Place the new PDF in the project folder
2. Run the following Python script from the project directory:

```python
import base64

files = {
    'PDF_NIYUD':     'טופס ניוד_.pdf',
    'PDF_OWNERSHIP': 'העברת בעלות פרטי לעסקי ועסקי לפרטי.PDF',
    'PDF_TAKANON':   'תקנון טלפונים.pdf',
}

with open('js/pdf-assets.js', 'w') as out:
    out.write('// Embedded Partner PDF forms (base64). Generated automatically — do not edit by hand.\n')
    out.write('const PDF_ASSETS = {\n')
    for key, path in files.items():
        with open(path, 'rb') as f:
            b64 = base64.b64encode(f.read()).decode('ascii')
        out.write(f'  {key}: "{b64}",\n')
    out.write('};\n')
```

3. Redeploy to Netlify

After updating a PDF, the admin must clear the corresponding template from IndexedDB (or open the site in a fresh browser profile) so the new version gets converted and saved. Existing field mappings will be lost and need to be remapped.

---

## Data Storage and Privacy

All signed PDFs and field mappings are stored exclusively in the browser's IndexedDB on the device where they were created. Nothing is sent to any server except:

- The signed PDF download link sent to the admin via EmailJS (the PDF itself is temporarily hosted on uguu.se for up to 24 hours)
- The Heebo font file, fetched once from Google Fonts CDN and cached in memory for the session

No user data is logged, tracked, or stored server-side by this application.

---

## Known Limitations

- The 24-hour uguu.se link expiry means the admin must download the signed PDF promptly after receiving the email notification.
- IndexedDB data is browser-specific. If the admin clears browser data or switches browsers, all saved mappings and submissions are lost. Use the JSON export feature to back up form configurations.
- The app does not support more than one concurrent admin session editing the same template.
- Signature fields are captured as drawn images, not cryptographic signatures. They are not legally binding in all jurisdictions without additional verification.
