// Student Entry: auto-calculate Grade Point (out of 10) from subject percentage.
(function () {
  function gradePointFromPercent(percent) {
    if (!Number.isFinite(percent)) return '';
    if (percent >= 90) return 10;
    if (percent >= 80) return 9;
    if (percent >= 70) return 8;
    if (percent >= 60) return 7;
    if (percent >= 50) return 6;
    if (percent >= 40) return 5;
    return 0;
  }

  function syncRow(row) {
    if (!row || !row.classList || !row.classList.contains('subject-row')) return;
    var maxInternal = Number(row.querySelector('[data-k="maxInternal"]')?.value) || 0;
    var maxExternal = Number(row.querySelector('[data-k="maxTheory"]')?.value) || 0;
    var internal = Number(row.querySelector('[data-k="internal"]')?.value) || 0;
    var external = Number(row.querySelector('[data-k="theory"]')?.value) || 0;
    var gp = row.querySelector('[data-k="gradePoint"]');
    if (!gp) return;

    var maximum = maxInternal + maxExternal;
    var obtained = internal + external;
    var next = maximum > 0 ? String(gradePointFromPercent((obtained / maximum) * 100)) : '';

    gp.readOnly = true;
    gp.title = 'Auto-filled from obtained percentage';
    if (gp.value !== next) {
      gp.value = next;
      gp.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  function syncAll() {
    document.querySelectorAll('#subjectEditor .subject-row').forEach(syncRow);
  }

  document.addEventListener('input', function (event) {
    var input = event.target.closest?.('#subjectEditor .subject-row [data-k]');
    if (!input) return;
    var key = input.dataset.k;
    if (key === 'internal' || key === 'theory' || key === 'maxInternal' || key === 'maxTheory') {
      syncRow(input.closest('.subject-row'));
    }
  }, true);

  document.addEventListener('change', function (event) {
    var input = event.target.closest?.('#subjectEditor .subject-row [data-k]');
    if (input) syncRow(input.closest('.subject-row'));
  }, true);

  var observer = new MutationObserver(syncAll);
  observer.observe(document.documentElement, { childList: true, subtree: true });

  syncAll();
  setInterval(syncAll, 800);
})();
