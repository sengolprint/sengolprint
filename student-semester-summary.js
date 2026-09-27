// Student Entry: semester/SGPA/result/CGPA grid shown after Subject & Marks Details.
(function () {
  function $(id) { return document.getElementById(id); }

  function ensureGrid() {
    var subjectEditor = $('subjectEditor');
    if (!subjectEditor || $('studentSemesterSummaryGrid')) return;

    var wrap = document.createElement('div');
    wrap.id = 'studentSemesterSummaryGrid';
    wrap.style.cssText = 'margin-top:12px;overflow-x:auto;';

    var table = document.createElement('table');
    table.style.cssText = 'width:100%;min-width:760px;border-collapse:collapse;table-layout:fixed;font-size:12px;background:#fff;';

    var labels = ['I','II','III','IV','V','VI','VII','VIII','IX','X'];
    var head = '<tr><th style="width:96px">Semester</th>' + labels.map(function (x) {
      return '<th>' + x + '</th>';
    }).join('') + '<th style="width:82px">Result</th><th style="width:82px">CGPA</th></tr>';

    var body = '<tr><th>SGPA</th>' + labels.map(function (_, i) {
      return '<td><input class="student-sem-summary-input" data-source="msSgpa' + (i + 1) + '" type="text"></td>';
    }).join('') + '<td><input class="student-sem-summary-input" data-source="msResult" type="text"></td><td><input class="student-sem-summary-input" data-source="msCgpa" type="text"></td></tr>';

    table.innerHTML = '<tbody>' + head + body + '</tbody>';
    wrap.appendChild(table);

    var style = document.createElement('style');
    style.id = 'studentSemesterSummaryStyle';
    style.textContent = [
      '#studentSemesterSummaryGrid table th,#studentSemesterSummaryGrid table td{border:1px solid #111;padding:4px 5px;text-align:center;height:28px;box-sizing:border-box}',
      '#studentSemesterSummaryGrid table th{font-weight:800;background:#fff}',
      '#studentSemesterSummaryGrid .student-sem-summary-input{width:100%!important;height:24px!important;border:0!important;border-radius:0!important;padding:2px 4px!important;margin:0!important;text-align:center!important;background:transparent!important;box-shadow:none!important;outline:none}',
      '#studentSemesterSummaryGrid .student-sem-summary-input:focus{outline:1px solid #94a3b8!important;background:#fff!important}'
    ].join('\n');
    document.head.appendChild(style);

    var parent = subjectEditor.parentElement;
    var addButton = parent && parent.querySelector('.add-subject');
    if (addButton) addButton.insertAdjacentElement('afterend', wrap);
    else subjectEditor.insertAdjacentElement('afterend', wrap);

    function syncFromSource(input) {
      var source = $(input.dataset.source);
      if (source && input.value !== source.value) input.value = source.value || '';
    }

    wrap.querySelectorAll('[data-source]').forEach(function (input) {
      syncFromSource(input);
      input.addEventListener('input', function () {
        var source = $(input.dataset.source);
        if (!source) return;
        source.value = input.value;
        source.dispatchEvent(new Event('input', { bubbles: true }));
        source.dispatchEvent(new Event('change', { bubbles: true }));
      });
    });

    document.addEventListener('input', function (event) {
      if (!event.target || !event.target.id) return;
      var mirror = wrap.querySelector('[data-source="' + event.target.id + '"]');
      if (mirror && mirror.value !== event.target.value) mirror.value = event.target.value || '';
    }, true);

    setInterval(function () {
      wrap.querySelectorAll('[data-source]').forEach(syncFromSource);
    }, 700);
  }

  var observer = new MutationObserver(ensureGrid);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  ensureGrid();
})();
