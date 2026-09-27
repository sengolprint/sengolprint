// Student Entry: compact Total row + auto-calculated read-only SGPA/CGPA/Result.
(function () {
  function $(id) { return document.getElementById(id); }
  function n(v) { return Number(v) || 0; }
  function field(row,key){ return row.querySelector('[data-k="'+key+'"]'); }
  function value(row,key){ var el=field(row,key); return n(el && el.value); }

  function ensureStyle() {
    if ($('studentCompactSummaryStyle')) return;
    var style = document.createElement('style');
    style.id = 'studentCompactSummaryStyle';
    style.textContent = [
      '#studentCompactTotals,#studentSemesterSummaryGrid{width:100%;overflow-x:auto;margin-top:8px}',
      '#studentCompactTotals table,#studentSemesterSummaryGrid table{width:100%;min-width:1040px;border-collapse:collapse;table-layout:fixed;background:#fff;color:#111;font-size:.72rem}',
      '#studentCompactTotals td,#studentSemesterSummaryGrid th,#studentSemesterSummaryGrid td{border:1px solid #111!important;padding:4px 5px!important;text-align:center!important;height:27px!important;box-sizing:border-box!important}',
      '#studentCompactTotals td{font-weight:800!important}',
      '#studentSemesterSummaryGrid th{font-weight:800!important;background:#fff!important}',
      '#studentSemesterSummaryGrid input{width:100%!important;height:22px!important;border:0!important;border-radius:0!important;padding:1px 3px!important;margin:0!important;text-align:center!important;background:#f8fafc!important;box-shadow:none!important;outline:none!important;font:inherit!important;color:#111!important;font-weight:700!important;cursor:default!important}',
      '#subjectEditor table tfoot.student-entry-total-foot{display:none!important}',
      '.form-total-row.student-old-hidden,.marks-help.student-old-hidden{display:none!important}'
    ].join('\n');
    document.head.appendChild(style);
  }

  function subjectRows() {
    var editor=$('subjectEditor'), table=editor&&editor.querySelector('table.subject-table');
    var rows=table?Array.prototype.slice.call(table.querySelectorAll('tbody tr.subject-row')):[];
    return {table:table,rows:rows};
  }

  function activeRows() {
    return subjectRows().rows.filter(function(row){
      var code=field(row,'code'), name=field(row,'name');
      return String(code&&code.value||'').trim() || String(name&&name.value||'').trim() || value(row,'credits') || value(row,'maxInternal') || value(row,'maxTheory');
    });
  }

  function calculateAcademicSummary() {
    var rows=activeRows(), totalCredits=0, totalCreditPoints=0, pass=true;
    rows.forEach(function(row){
      var credits=value(row,'credits'), gp=value(row,'gradePoint');
      totalCredits+=credits;
      totalCreditPoints+=credits*gp;
      if (value(row,'internal') < value(row,'minInternal') || value(row,'theory') < value(row,'minExternal') || gp<=0) pass=false;
    });
    var sgpa=totalCredits ? totalCreditPoints/totalCredits : 0;
    var semesterRaw=String(($('msSemester')&&$('msSemester').value)||'').toUpperCase().replace(/SEMESTER/g,'').trim();
    var map={'1':1,'I':1,'2':2,'II':2,'3':3,'III':3,'4':4,'IV':4,'5':5,'V':5,'6':6,'VI':6,'7':7,'VII':7,'8':8,'VIII':8,'9':9,'IX':9,'10':10,'X':10};
    var semester=map[semesterRaw]||1;
    var sgpaText=rows.length && totalCredits ? sgpa.toFixed(2) : '';

    if ($('msSgpa')) $('msSgpa').value=sgpaText;
    for(var i=1;i<=10;i++){
      var el=$('msSgpa'+i);
      if(!el) continue;
      el.readOnly=true;
      if(i===semester) el.value=sgpaText;
      if(i>semester) el.value='';
    }

    var filled=[];
    for(var j=1;j<=semester;j++){
      var sem=$('msSgpa'+j), v=sem ? parseFloat(sem.value) : NaN;
      if(Number.isFinite(v)) filled.push(v);
    }
    var cgpa=filled.length ? filled.reduce(function(a,b){return a+b;},0)/filled.length : 0;
    if ($('msCgpa')) { $('msCgpa').value=filled.length?cgpa.toFixed(2):''; $('msCgpa').readOnly=true; }
    if ($('msResult')) { $('msResult').value=rows.length?(pass?'Pass':'Fail'):''; $('msResult').disabled=true; }
  }

  function hideOldBlocks() {
    var help=document.querySelector('.marks-help'); if(help) help.classList.add('student-old-hidden');
    var oldTotal=document.querySelector('.form-total-row'); if(oldTotal) oldTotal.classList.add('student-old-hidden');
    var result=$('msResult'), card=result&&result.closest('.student-data-card'); if(card) card.style.display='none';
  }

  function ensureTotals() {
    var data=subjectRows(), table=data.table, rows=data.rows; if(!table) return;
    var s={credits:0,minInternal:0,maxInternal:0,internal:0,minExternal:0,maxExternal:0,external:0,earned:0};
    rows.forEach(function(row){s.credits+=value(row,'credits');s.minInternal+=value(row,'minInternal');s.maxInternal+=value(row,'maxInternal');s.internal+=value(row,'internal');s.minExternal+=value(row,'minExternal');s.maxExternal+=value(row,'maxTheory');s.external+=value(row,'theory');s.earned+=value(row,'earnedCredit');});
    if(table.tFoot) table.tFoot.classList.add('student-entry-total-foot');
    var wrap=$('studentCompactTotals');
    if(!wrap){
      wrap=document.createElement('div'); wrap.id='studentCompactTotals';
      var t=document.createElement('table');
      t.innerHTML='<colgroup><col style="width:140px"><col style="width:420px"><col style="width:65px"><col style="width:120px"><col style="width:85px"><col style="width:120px"><col style="width:85px"><col style="width:75px"><col style="width:80px"><col style="width:80px"></colgroup><tbody><tr><td colspan="2">Total</td><td data-t="credits"></td><td data-t="irange"></td><td data-t="internal"></td><td data-t="erange"></td><td data-t="external"></td><td data-t="obtained"></td><td></td><td data-t="earned"></td></tr></tbody>';
      wrap.appendChild(t);
      var add=$('addSubjectRow'); if(add) add.insertAdjacentElement('afterend',wrap); else $('subjectEditor').insertAdjacentElement('afterend',wrap);
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
    var totals=$('studentCompactTotals'); if(!totals) return;
    var wrap=$('studentSemesterSummaryGrid');
    if(!wrap){
      wrap=document.createElement('div'); wrap.id='studentSemesterSummaryGrid';
      var labels=['I','II','III','IV','V','VI','VII','VIII','IX','X'];
      var table=document.createElement('table'); table.style.minWidth='760px';
      table.innerHTML='<tbody><tr><th style="width:96px">Semester</th>'+labels.map(function(x){return '<th>'+x+'</th>';}).join('')+'<th style="width:88px">Result</th><th style="width:88px">CGPA</th></tr><tr><th>SGPA</th>'+labels.map(function(_,i){return '<td><input readonly tabindex="-1" data-source="msSgpa'+(i+1)+'"></td>';}).join('')+'<td><input readonly tabindex="-1" data-source="msResult"></td><td><input readonly tabindex="-1" data-source="msCgpa"></td></tr></tbody>';
      wrap.appendChild(table); totals.insertAdjacentElement('afterend',wrap);
    }
    wrap.querySelectorAll('[data-source]').forEach(function(input){var src=$(input.dataset.source);input.readOnly=true;input.tabIndex=-1;if(src)input.value=src.value||'';});
  }

  function lockSourceFields(){
    for(var i=1;i<=10;i++){var s=$('msSgpa'+i);if(s)s.readOnly=true;}
    if($('msCgpa'))$('msCgpa').readOnly=true;
    if($('msResult'))$('msResult').disabled=true;
  }

  function syncAll(){ensureStyle();hideOldBlocks();calculateAcademicSummary();lockSourceFields();ensureTotals();ensureSemesterGrid();}
  document.addEventListener('input',function(e){if(e.target&&((e.target.closest&&e.target.closest('#subjectEditor'))||e.target.id==='msSemester'))setTimeout(syncAll,0);},true);
  document.addEventListener('change',function(e){if(e.target&&((e.target.closest&&e.target.closest('#subjectEditor'))||e.target.id==='msSemester'))setTimeout(syncAll,0);},true);
  document.addEventListener('click',function(e){if(e.target&&e.target.closest&&e.target.closest('.add-subject,#subjectEditor'))setTimeout(syncAll,0);},true);
  new MutationObserver(function(){setTimeout(syncAll,0);}).observe(document.documentElement,{childList:true,subtree:true});
  syncAll(); setInterval(syncAll,500);
})();
