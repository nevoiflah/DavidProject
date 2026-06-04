// EmailJS credentials
const EMAILJS_SERVICE_ID  = 'service_0ubvhn8';
const EMAILJS_TEMPLATE_ID = 'template_m1yu7gd';
const EMAILJS_PUBLIC_KEY  = '3Gd9evrWKFqUP0XLw';

// Application state — single source of truth
const state = {
  activeView: 'dashboard',
  activeTemplate: null, // 'portability' | 'ownership_seller' | 'ownership_buyer' | 'ide-terms-agreement'
  isCustomerFillMode: false,
  clientName: "",
  directFillTemplate: null,

  templates: {
    'portability':         { pdfBytes: null, images: [], isImageTemplate: false, fields: [] },
    'ownership_seller':    { pdfBytes: null, images: [], isImageTemplate: false, fields: [] },
    'ownership_buyer':     { pdfBytes: null, images: [], isImageTemplate: false, fields: [] },
    'ide-terms-agreement': { pdfBytes: null, images: [], isImageTemplate: false, fields: [] }
  },

  quickMenuData: { pageIndex: 0, xPercent: 0, yPercent: 0 },
  currentEditingFieldId: null,
  signedPdfBytes: null,
  signedPdfBlobUrl: null,
  uploadedFileUrl: "",
  redirectTarget: null,
  currentEditingSubmissionId: null,
  currentEditingSubmission: null
};

// Mutable rendering globals (reset per view)
let activeSignaturePads = [];
let pdfJsDocInstance = null;
let pageCanvasElements = [];
