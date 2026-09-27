// Student Entry: compact Total row + Semester/SGPA/Result/CGPA tables; hides old summary cards.
(function () {
  function $(id) { return document.getElementById(id); }
  function n(v) { return Number(v) || 0; }

  function ensureStyle() {
    if ($('studentCompactSummaryStyle')) return;
    var style = document.createElement('style');
    style.id = 'studentCompactSummaryStyle';
    style.textContent = [
      '#studentCompactTotals,#studentSemesterSummaryGrid{width:100%;overflow-x:auto;margin-top:8px}',
      '#studentCompactTotals table,#studentSemesterSummaryGrid table{width:100%;min-width:1040px;border-collapse:collapse;table-layout:fixed;background:#fff;color:#111;font-size:.72rem}',
      '#studentCompactTotals td,#studentSemesterSummaryGrid th,#studentSemesterSummaryGrid td{border:1px solid #111!important;padding:4px 5px!important;text-align:center!important;height:27px!important;box-sizing:border-box!important}',
      '#studentCompactTotals td{font-weight:800!important}',
      '#studentCompactTotals td:first-child{text-align:center!important}',
      '#studentSemesterSummaryGrid th{font-weight:800!important;background:#fff!important}',
      '#studentSemesterSummaryGrid input{width:100%!important;height:22px!important;border:0!important;border-radius:0!important;padding:1px 3px!important;margin:0!important;text-align:center!important;background:transparent!important;box-shadow:none!important;outline:none!important;font:inherit!important;color:#111!important}',
      '#studentSemesterSummaryGrid input:focus{outline:1px solid #94a3b8!important;background:#fff!important}',
      '#subjectEditor table tfoot.student-entry-total-foot{display:none!important}',
      '.form-total-row.student-old-hidden,.marks-help.student-old-hidden{display:none!important}'
    ].join('\n');
    document.head.appendChild(style);
  }

  function rowsAndSums() {
    var subjectEditor = $('subjectEditor');
    var table = subjectEditor && subjectEditor.querySelector('table.subject-table');
    var rows = table ? Array.prototype.slice.call(table.querySelectorAll('tbody tr.subject-row')) : [];
    var s = {credits:0,minInternal:0,maxInternal:0,internal:0,minExternal:0,maxExternal:0,external:0,earned:0};
    rows.forEach(function(row){
      function v(k){ var el=row.querySelector('[data-k="'+k+'"]'); return n(el && el.value); }
      s.credits+=v('credits'); s.minInternal+=v('minInternal'); s.maxInternal+=v('maxInternal');
      s.internal+=v('internal'); s.minExternal+=v('minExternal'); s.maxExternal+=v('maxTheory');
      s.external+=v('theory'); s.earned+=v('earnedCredit');
    });
    return {table:table,s:s};
  }

  function hideOldBlocks() {
    var help = document.querySelector('#subjectEditor + .add-subject + .marks-help') || document.querySelector('.marks-help');
    if (help) help.classList.add('student-old-hidden');
    var oldTotal = document.querySelector('.form-total-row');
    if (oldTotal) oldTotal.classList.add('student-old-hidden');
    var result = $('msResult');
    var oldResultCard = result && result.closest('.student-data-card');
    if (oldResultCard) oldResultCard.style.display = 'none';
  }

  function ensureTotals() {
    var subjectEditor = $('subjectEditor');
    if (!subjectEditor) return;
    var data = rowsAndSums(), table = data.table, s = data.s;
    if (!table) return;

    var oldFoot = table.tFoot;
    if (oldFoot) oldFoot.classList.add('student-entry-total-foot');

    var wrap = $('studentCompactTotals');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.id = 'studentCompactTotals';
      var t = document.createElement('table');
      t.innerHTML = '<colgroup><col style="width:140px"><col style="width:420px"><col style="width:65px"><col style="width:120px"><col style="width:85px"><col style="width:120px"><col style="width:85px"><col style="width:75px"><col style="width:80px"><col style="width:80px"></colgroup><tbody><tr><td colspan="2">Total</td><td data-t="credits"></td><td data-t="irange"></td><td data-t="internal"></td><td data-t="erange"></td><td data-t="external"></td><td data-t="obtained"></td><td></td><td data-t="earned"></td></tr></tbody>';
      wrap.appendChild(t);
      var addButton = subjectEditor.parentElement && subjectEditor.parentElement.querySelector('.add-subject');
      if (addButton) addButton.insertAdjacentElement('afterend', wrap); else subjectEditor.insertAdjacentElement('afterend', wrap);
    }
    wrap.querySelector('[data-t="credits"]').textContent=s.credits;
    wrap.querySelector('[data-t="irange"]').textContent=s.minInternal+'/'+s.maxInternal;
    wrap.querySelector('[data-t="internal"]').textContent=s.internal;
    wrap.querySelector('[data-t="erange"]').textContent=s.minExternal+'/'+s.maxExternal;
    wrap.querySelector('[data-t="external"]').textContent=s.external;
    wrap.querySelector('[data-t="obtained"]').textContent=s.internal+s.external;
    wrap.querySelector('[data-t="earned"]').textContent=s.earned;
  }

  function ensureSemesterGrid() {
    var totals = $('studentCompactTotals');
    if (!totals) return;
    var wrap = $('studentSemesterSummaryGrid');
    if (!wrap) {
      wrap = document.createElement('div'); wrap.id='studentSemesterSummaryGrid';
      var labels=['I','II','III','IV','V','VI','VII','VIII','IX','X'];
      var table=document.createElement('table');
      table.style.minWidth='760px';
      table.innerHTML='<tbody><tr><th style="width:96px">Semester</th>'+labels.map(function(x){return '<th>'+x+'</th>';}).join('')+'<th style="width:88px">Result</th><th style="width:88px">CGPA</th></tr><tr><th>SGPA</th>'+labels.map(function(_,i){return '<td><input data-source="msSgpa'+(i+1)+'"></td>';}).join('')+'<td><input data-source="msResult"></td><td><input data-source="msCgpa"></td></tr></tbody>';
      wrap.appendChild(table); totals.insertAdjacentElement('afterend',wrap);
      wrap.querySelectorAll('[data-source]').forEach(function(input){
        input.addEventListener('input',function(){var src=$(input.dataset.source);if(!src)return;src.value=input.value;src.dispatchEvent(new Event('input',{bubbles:true}));src.dispatchEvent(new Event('change',{bubbles:true}));});
      });
    }
    wrap.querySelectorAll('[data-source]').forEach(function(input){var src=$(input.dataset.source);if(src&&input.value!==String(src.value||''))input.value=src.value||'';});
  }

  function syncAll(){ensureStyle();hideOldBlocks();ensureTotals();ensureSemesterGrid();}
  document.addEventListener('input',function(e){if(e.target&&e.target.closest&&e.target.closest('#subjectEditor'))syncAll();},true);
  document.addEventListener('change',function(e){if(e.target&&e.target.closest&&e.target.closest('#subjectEditor'))syncAll();},true);
  document.addEventListener('click',function(e){if(e.target&&e.target.closest&&e.target.closest('.add-subject,#subjectEditor'))setTimeout(syncAll,0);},true);
  new MutationObserver(function(){setTimeout(syncAll,0);}).observe(document.documentElement,{childList:true,subtree:true});
  syncAll(); setInterval(syncAll,500);
})();
