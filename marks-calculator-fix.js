// Marks Calculator validation helper
// Obtained External/Internal must be at least 40% of corresponding Maximum.
(function () {
  function num(el) { return Number(el && el.value) || 0; }
  function enforceRow(row) {
    if (!row) return;
    var maxExt = row.querySelector('.mxE');
    var maxInt = row.querySelector('.mxI');
    var obtExt = row.querySelector('.obE');
    var obtInt = row.querySelector('.obI');
    if (!maxExt || !maxInt || !obtExt || !obtInt) return;
    var me = Math.max(0, num(maxExt));
    var mi = Math.max(0, num(maxInt));
    var minE = Math.ceil(me * 0.40);
    var minI = Math.ceil(mi * 0.40);
    obtExt.min = minE; obtExt.max = me;
    obtInt.min = minI; obtInt.max = mi;
    if (num(obtExt) < minE) obtExt.value = minE;
    if (num(obtInt) < minI) obtInt.value = minI;
    if (num(obtExt) > me) obtExt.value = me;
    if (num(obtInt) > mi) obtInt.value = mi;
    var totalMax = me + mi;
    var totalObt = num(obtExt) + num(obtInt);
    var maxTotal = row.querySelector('.mxT');
    var obtTotal = row.querySelector('.obT');
    var pct = row.querySelector('.pct');
    if (maxTotal) maxTotal.textContent = totalMax;
    if (obtTotal) obtTotal.textContent = totalObt;
    if (pct) pct.textContent = (totalMax ? (totalObt / totalMax * 100) : 0).toFixed(1) + '%';
  }
  function enforceAll() {
    var table = document.getElementById('mcTable');
    if (!table) return;
    table.querySelectorAll('tbody tr').forEach(enforceRow);
  }
  document.addEventListener('input', function (e) {
    if (e.target.closest && e.target.closest('#mcTable')) enforceRow(e.target.closest('tr'));
  });
  document.addEventListener('change', function (e) {
    if (e.target.closest && e.target.closest('#mcTable')) enforceRow(e.target.closest('tr'));
  });
  var observer = new MutationObserver(function () { enforceAll(); });
  document.addEventListener('DOMContentLoaded', function () {
    var table = document.getElementById('mcTable');
    if (table) observer.observe(table, {childList:true, subtree:true});
    enforceAll();
  });
})();