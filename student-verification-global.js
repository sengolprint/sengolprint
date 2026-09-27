// Keep Barcode, QR instruction and Signature global for every student and across refreshes.
(function () {
  var GLOBAL_KEY = 'marksheet-global-verification-v2';
  var LEGACY_KEY = 'marksheet-verification-settings-v1';
  var MEDIA_KEY = 'marksheet-media-boxes-v1';

  function $(id) { return document.getElementById(id); }
  function readJson(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
    catch (_) { return fallback; }
  }
  function writeJson(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) {}
  }

  function readGlobal() {
    var saved = readJson(GLOBAL_KEY, null);
    if (saved) return saved;
    var legacy = readJson(LEGACY_KEY, {});
    var media = readJson(MEDIA_KEY, {});
    return {
      barcodeTemplate: legacy.barcodeTemplate || '',
      qrTemplate: legacy.qrTemplate || '',
      signatureSrc: legacy.signatureSrc || (media.signature && media.signature.src) || '',
      savedAt: legacy.savedAt || ''
    };
  }

  function persistGlobal(global) {
    global.savedAt = global.savedAt || new Date().toISOString();
    writeJson(GLOBAL_KEY, global);
    writeJson(LEGACY_KEY, {
      barcodeTemplate: global.barcodeTemplate || '',
      qrTemplate: global.qrTemplate || '',
      signatureSrc: global.signatureSrc || '',
      savedAt: global.savedAt
    });

    var media = readJson(MEDIA_KEY, {});
    media.signature = Object.assign({x:150,y:229,w:42,h:18,src:''}, media.signature || {});
    if (global.signatureSrc) media.signature.src = global.signatureSrc;
    writeJson(MEDIA_KEY, media);
  }

  function applyGlobal() {
    var global = readGlobal();
    if (!global) return;

    var barcode = $('msBarcodeText');
    var qr = $('msQrText');
    if (barcode && barcode.value !== (global.barcodeTemplate || '')) barcode.value = global.barcodeTemplate || '';
    if (qr && qr.value !== (global.qrTemplate || '')) qr.value = global.qrTemplate || '';

    if (global.signatureSrc) {
      var media = readJson(MEDIA_KEY, {});
      media.signature = Object.assign({x:150,y:229,w:42,h:18,src:''}, media.signature || {}, {src:global.signatureSrc});
      writeJson(MEDIA_KEY, media);

      document.querySelectorAll('[data-media-key="signature"] img').forEach(function (img) {
        if (img.src !== global.signatureSrc) img.src = global.signatureSrc;
        img.dataset.pendingSrc = global.signatureSrc;
        var box = img.closest('[data-media-key="signature"]');
        if (box) box.classList.add('has-image');
      });
    }
  }

  function captureFromCurrent() {
    var old = readGlobal();
    var media = readJson(MEDIA_KEY, {});
    var signatureSrc = (media.signature && media.signature.src) || old.signatureSrc || '';
    var signatureImg = document.querySelector('[data-media-key="signature"] img');
    if (signatureImg && signatureImg.src && !/^data:,?$/.test(signatureImg.src)) signatureSrc = signatureImg.src;

    var global = {
      barcodeTemplate: $('msBarcodeText') ? $('msBarcodeText').value.trim() : (old.barcodeTemplate || ''),
      qrTemplate: $('msQrText') ? $('msQrText').value.trim() : (old.qrTemplate || ''),
      signatureSrc: signatureSrc,
      savedAt: new Date().toISOString()
    };
    persistGlobal(global);
    applyGlobal();
  }

  // Capture the processed/cropped signature after the app handles the upload.
  document.addEventListener('change', function (event) {
    if (!event.target || event.target.id !== 'msSignatureImage') return;
    setTimeout(captureFromCurrent, 700);
    setTimeout(captureFromCurrent, 1500);
  }, true);

  // The existing save button still saves to the server; this adds a durable global local copy too.
  document.addEventListener('click', function (event) {
    if (!event.target || event.target.id !== 'saveVerificationSettings') return;
    setTimeout(captureFromCurrent, 100);
    setTimeout(captureFromCurrent, 900);
  }, true);

  // Re-apply after student changes / add / duplicate / restore / refresh-created DOM.
  document.addEventListener('change', function (event) {
    if (event.target && event.target.id === 'studentRecordList') setTimeout(applyGlobal, 0);
  }, true);
  document.addEventListener('click', function (event) {
    if (!event.target || !event.target.closest) return;
    if (event.target.closest('#previousStudent,#nextStudent,#addStudentRecord,#duplicateStudentRecord,#restoreStudentData')) {
      setTimeout(applyGlobal, 50);
      setTimeout(applyGlobal, 500);
    }
  }, true);

  var observer = new MutationObserver(function () { setTimeout(applyGlobal, 0); });
  observer.observe(document.documentElement, {childList:true, subtree:true});

  // Seed from existing saved settings, then keep it stable against per-student form loads.
  var initial = readGlobal();
  if (initial) persistGlobal(initial);
  applyGlobal();
  setTimeout(applyGlobal, 500);
  setTimeout(applyGlobal, 1500);
  setInterval(applyGlobal, 1000);
})();
