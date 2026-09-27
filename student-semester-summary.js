// Student Entry: permanent totals row + semester/SGPA/result/CGPA grid after Subject & Marks Details.
(function () {
  function $(id) { return document.getElementById(id); }
  function n(v) { return Number(v) || 0; }

  function ensureStyle() {
    if ($('studentSemesterSummaryStyle')) return;
    var style = document.createElement('style');
    style.id = 'studentSemesterSummaryStyle';
    style.textContent = [
      '#subjectEditor .student-entry-total-row td{border-top:1px solid #111!important;border-bottom:1px solid #111!important;background:#fff!important;font-weight:800!important;padding:6px 4px!important;text-align:center!important;color:#111!important}',
      '#subjectEditor .student-entry-total-row td:first-child{text-align:center!important}',
      '#studentSemesterSummaryGrid{margin-top:10px;overflow-x:auto}',
      '#studentSemesterSummaryGrid table{width:100%;min-width:760px;border-collapse:collapse;table-layout:fixed;font-size:12px;background:#fff}',
      '#studentSemesterSummaryGrid table th,#studentSemesterSummaryGrid table td{border:1px solid #111;padding:4px 5px;text-align:center;height:28px;box-sizing:border-box}',
      '#studentSemesterSummaryGrid table th{font-weight:800;background:#fff}',
      '#studentSemesterSummaryGrid .student-sem-summary-input{width:100%!important;height:24px!important;border:0!important;border-radius:0!important;padding:2px 4px!important;margin:0!important;text-align:center!important;background:transparent!important;box-shadow:none!important;outline:none}',
      '#studentSemesterSummaryGrid .student-sem-summary-input:focus{outline:1px solid #94a3b8!important;background:#fff!important}'
    ].join('\n');
    document.head.appendChild(style);
  }

  function getSubjectRows(table) {
    return Array.prototype.slice.call(table.querySelectorAll('tbody tr.subject-row'));
  }

  function ensureSubjectTotalRow() {
    var subjectEditor = $('subjectEditor');
    if (!subjectEditor) return;
    var table = subjectEditor.querySelector('table.subject-table');
    if (!table) return;

    // Use TFOOT so the app can freely rebuild/add/remove TBODY rows without deleting the Total row.
    var tfoot = table.tFoot;
    if (!tfoot) tfoot = table.createTFoot();
    var totalRow = tfoot.querySelector('.student-entry-total-row');
    if (!totalRow) {
      totalRow = tfoot.insertRow();
      totalRow.className = 'student-entry-total-row';
      totalRow.innerHTML = '<td colspan="2">Total</td><td data-total="credits">0</td><td data-total="internal-range">0/0</td><td data-total="internal">0</td><td data-total="external-range">0/0</td><td data-total="external">0</td><td data-total="obtained">0</td><td></td><td data-total="earned">0</td>';
    }

    var rows = getSubjectRows(table);
    var sums = { credits:0, minInternal:0, maxInternal:0, internal:0, minExternal:0, maxExternal:0, external:0, earned:0 };
    rows.forEach(function (row) {
      function v(key) { var el = row.querySelector('[data-k="' + key + '"]'); return n(el && el.value); }
      sums.credits += v('credits');
      sums.minInternal += v('minInternal');
      sums.maxInternal += v('maxInternal');
      sums.internal += v('internal');
      sums.minExternal += v('minExternal');
      sums.maxExternal += v('maxTheory');
      sums.external += v('theory');
      sums.earned += v('earnedCredit');
    });

    totalRow.querySelector('[data-total="credits"]').textContent = sums.credits;
    totalRow.querySelector('[data-total="internal-range"]').textContent = sums.minInternal + '/' + sums.maxInternal;
    totalRow.querySelector('[data-total="internal"]').textContent = sums.internal;
    totalRow.querySelector('[data-total="external-range"]').textContent = sums.minExternal + '/' + sums.maxExternal;
    totalRow.querySelector('[data-total="external"]').textContent = sums.external;
    totalRow.querySelector('[data-total="obtained"]').textContent = sums.internal + sums.external;
    totalRow.querySelector('[data-total="earned"]').textContent = sums.earned;
  }

  function ensureGrid() {
    var subjectEditor = $('subjectEditor');
    if (!subjectEditor || $('studentSemesterSummaryGrid')) return;

    var wrap = document.createElement('div');
    wrap.id = 'studentSemesterSummaryGrid';
    var table = document.createElement('table');
    var labels = ['I','II','III','IV','V','VI','VII','VIII','IX','X'];
    table.innerHTML = '<tbody><tr><th style="width:96px">Semester</th>' + labels.map(function (x) { return '<th>' + x + '</th>'; }).join('') + '<th style="width:82px">Result</th><th style="width:82px">CGPA</th></tr><tr><th>SGPA</th>' + labels.map(function (_, i) { return '<td><input class="student-sem-summary-input" data-source="msSgpa' + (i + 1) + '" type="text"></td>'; }).join('') + '<td><input class="student-sem-summary-input" data-source="msResult" type="text"></td><td><input class="student-sem-summary-input" data-source="msCgpa" type="text"></td></tr></tbody>';
    wrap.appendChild(table);

    var parent = subjectEditor.parentElement;
    var addButton = parent && parent.querySelector('.add-subject');
    if (addButton) addButton.insertAdjacentElement('afterend', wrap);
    else subjectEditor.insertAdjacentElement('afterend', wrap);

    wrap.querySelectorAll('[data-source]').forEach(function (input) {
      var source = $(input.dataset.source);
      if (source) input.value = source.value || '';
      input.addEventListener('input', function () {
        var src = $(input.dataset.source);
        if (!src) return;
        src.value = input.value;
        src.dispatchEvent(new Event('input', { bubbles: true }));
        src.dispatchEvent(new Event('change', { bubbles: true }));
      });
    });
  }

  function syncAll() {
    ensureStyle();
    ensureSubjectTotalRow();
    ensureGrid();
    var wrap = $('studentSemesterSummaryGrid');
    if (wrap) wrap.querySelectorAll('[data-source]').forEach(function (input) {
      var source = $(input.dataset.source);
      if (source && input.value !== source.value) input.value = source.value || '';
    });
  }

  document.addEventListener('input', function (event) {
    if (event.target && event.target.closest && event.target.closest('#subjectEditor')) ensureSubjectTotalRow();
  }, true);
  document.addEventListener('change', function (event) {
    if (event.target && event.target.closest && event.target.closest('#subjectEditor')) ensureSubjectTotalRow();
  }, true);
  document.addEventListener('click', function (event) {
    if (event.target && event.target.closest && event.target.closest('#subjectEditor, .add-subject')) setTimeout(syncAll, 0);
  }, true);

  var observer = new MutationObserver(function(){ setTimeout(syncAll, 0); });
  observer.observe(document.documentElement, { childList: true, subtree: true });
  syncAll();
  setInterval(syncAll, 500);
})();
