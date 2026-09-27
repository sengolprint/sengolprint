// Marks Calculator: exact overall target with unique subject totals whenever mathematically possible.
(function () {
  function q(id) { return document.getElementById(id); }
  var table = q('mcTable');
  var auto = q('mcAuto');
  if (!table || !auto) return;

  var tbody = table.querySelector('tbody');
  var fillButton = q('mcFillMarks');
  auto.onchange = null;
  auto.min = '40';
  auto.max = '100';
  auto.step = '0.1';

  if (!fillButton) {
    fillButton = document.createElement('button');
    fillButton.id = 'mcFillMarks';
    fillButton.type = 'button';
    fillButton.textContent = 'Fill Marks';
    auto.insertAdjacentElement('afterend', fillButton);
  }

  var exactButton = q('mcExactMarks');
  if (!exactButton) {
    exactButton = document.createElement('button');
    exactButton.id = 'mcExactMarks';
    exactButton.type = 'button';
    exactButton.textContent = 'Fix Exact %';
    exactButton.style.cssText = 'height:32px;padding:4px 12px;border:0;border-radius:8px;background:#2456a6;color:#fff;font-weight:800;cursor:pointer;margin-left:2px';
    fillButton.insertAdjacentElement('afterend', exactButton);
  }

  var press = 0;
  function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
  function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

  function rowLimits(row) {
    var maxE = Math.max(0, Number(row.querySelector('.mxE')?.value) || 0);
    var maxI = Math.max(0, Number(row.querySelector('.mxI')?.value) || 0);
    var minE = Math.ceil(maxE * 0.40);
    var minI = Math.ceil(maxI * 0.40);
    return { maxE:maxE, maxI:maxI, minE:minE, minI:minI, minTotal:minE+minI, maxTotal:maxE+maxI };
  }

  function recalculate() {
    var got = 0, maximum = 0;
    Array.prototype.forEach.call(tbody.rows, function (row) {
      var lim = rowLimits(row);
      var obE = Math.max(0, Number(row.querySelector('.obE')?.value) || 0);
      var obI = Math.max(0, Number(row.querySelector('.obI')?.value) || 0);
      var mt = lim.maxTotal, ot = obE + obI;
      var mxT = row.querySelector('.mxT'), obT = row.querySelector('.obT'), pct = row.querySelector('.pct');
      if (mxT) mxT.textContent = mt;
      if (obT) obT.textContent = ot;
      if (pct) pct.textContent = (mt ? ot / mt * 100 : 0).toFixed(1) + '%';
      got += ot; maximum += mt;
    });
    var pc = maximum ? got / maximum * 100 : 0;
    var summary = q('mcSummary');
    if (summary) summary.innerHTML = '<div style="padding:12px;border:1px solid #dbe2ea;border-radius:12px"><small>Status</small><b style="display:block;color:' + (pc >= 40 ? '#00875a' : '#c62828') + '">' + (pc >= 40 ? 'Pass' : 'Fail') + '</b></div><div style="padding:12px;border:1px solid #dbe2ea;border-radius:12px"><small>Obtained</small><b style="display:block">' + got + '</b></div><div style="padding:12px;border:1px solid #dbe2ea;border-radius:12px"><small>Total &nbsp; ' + pc.toFixed(1) + '%</small><b style="display:block">' + maximum + '</b></div>';
  }

  function splitTotal(lim, desired, previousPair, usedPairs) {
    var lowE = Math.max(lim.minE, desired - lim.maxI);
    var highE = Math.min(lim.maxE, desired - lim.minI);
    if (lowE > highE) return null;

    var choices = [];
    for (var e = lowE; e <= highE; e++) choices.push(e);
    choices.sort(function(a,b){ return ((a * 17 + press * 11) % 23) - ((b * 17 + press * 11) % 23); });

    for (var c = 0; c < choices.length; c++) {
      var ext = choices[c], intl = desired - ext, key = ext + '|' + intl;
      if (key !== previousPair && !usedPairs.has(key)) return [ext, intl, key];
    }
    for (var d = 0; d < choices.length; d++) {
      var ext2 = choices[d], intl2 = desired - ext2, key2 = ext2 + '|' + intl2;
      if (!usedPairs.has(key2)) return [ext2, intl2, key2];
    }
    var fallback = choices.length ? choices[rand(0, choices.length - 1)] : lowE;
    return [fallback, desired - fallback, fallback + '|' + (desired - fallback)];
  }

  function applyTotals(rows, totals) {
    var usedPairs = new Set();
    rows.forEach(function (row, index) {
      var lim = rowLimits(row);
      var obE = row.querySelector('.obE'), obI = row.querySelector('.obI');
      if (!obE || !obI) return;
      var previousPair = (Number(obE.value) || 0) + '|' + (Number(obI.value) || 0);
      var pair = splitTotal(lim, totals[index], previousPair, usedPairs);
      if (!pair) return;
      usedPairs.add(pair[2]);
      obE.value = pair[0]; obI.value = pair[1];
      obE.min = lim.minE; obE.max = lim.maxE;
      obI.min = lim.minI; obI.max = lim.maxI;
    });
    recalculate();
  }

  function candidateTotals(lim, target, rowIndex, previousTotal) {
    var ideal = clamp(lim.maxTotal * target / 100, lim.minTotal, lim.maxTotal);
    var values = [];
    for (var v = lim.minTotal; v <= lim.maxTotal; v++) values.push(v);
    var wobble = ((rowIndex * 5 + press * 3) % 9) - 4;
    values.sort(function (a, b) {
      var sa = Math.abs(a - (ideal + wobble)) + (a === previousTotal ? 2.5 : 0);
      var sb = Math.abs(b - (ideal + wobble)) + (b === previousTotal ? 2.5 : 0);
      if (sa !== sb) return sa - sb;
      return ((a + press + rowIndex) % 2) - ((b + press + rowIndex) % 2);
    });
    return values;
  }

  // Backtracking search: all subject totals must be different and their sum must equal targetObtained.
  function findUniqueExactTotals(limits, targetObtained, target, previousTotals) {
    var n = limits.length;
    var order = Array.from({length:n}, function(_,i){ return i; });
    order.sort(function(a,b){
      return (limits[a].maxTotal - limits[a].minTotal) - (limits[b].maxTotal - limits[b].minTotal);
    });

    var candidates = limits.map(function(lim, i){ return candidateTotals(lim, target, i, previousTotals[i]); });
    var result = new Array(n);
    var used = new Set();
    var nodes = 0, NODE_LIMIT = 200000;

    function remainingBounds(pos) {
      var min = 0, max = 0;
      for (var p = pos; p < n; p++) {
        var idx = order[p], vals = candidates[idx], lo = null, hi = null;
        for (var c = 0; c < vals.length; c++) {
          if (used.has(vals[c])) continue;
          if (lo === null || vals[c] < lo) lo = vals[c];
          if (hi === null || vals[c] > hi) hi = vals[c];
        }
        if (lo === null) return null;
        min += lo; max += hi;
      }
      return [min, max];
    }

    function dfs(pos, sum) {
      if (++nodes > NODE_LIMIT) return false;
      if (pos === n) return sum === targetObtained;
      var bounds = remainingBounds(pos);
      if (!bounds || sum + bounds[0] > targetObtained || sum + bounds[1] < targetObtained) return false;

      var idx = order[pos], vals = candidates[idx];
      for (var c = 0; c < vals.length; c++) {
        var v = vals[c];
        if (used.has(v)) continue;
        var nextSum = sum + v;
        if (nextSum > targetObtained) continue;
        used.add(v); result[idx] = v;
        if (dfs(pos + 1, nextSum)) return true;
        used.delete(v); result[idx] = undefined;
      }
      return false;
    }

    return dfs(0, 0) ? result : null;
  }

  function fallbackExactTotals(limits, targetObtained, target) {
    // Used only when unique totals are mathematically impossible (for example all rows at 100%).
    var totals = limits.map(function(lim){ return clamp(Math.round(lim.maxTotal * target / 100), lim.minTotal, lim.maxTotal); });
    var current = totals.reduce(function(a,b){ return a+b; }, 0), guard = 0;
    while (current !== targetObtained && guard++ < 10000) {
      var dir = current < targetObtained ? 1 : -1, changed = false;
      for (var i = 0; i < totals.length; i++) {
        var next = totals[i] + dir;
        if (next < limits[i].minTotal || next > limits[i].maxTotal) continue;
        totals[i] = next; current += dir; changed = true;
        if (current === targetObtained) break;
      }
      if (!changed) break;
    }
    return totals;
  }

  function fillExact() {
    var target = clamp(Number(auto.value) || 40, 40, 100);
    auto.value = target;
    press++;
    var rows = Array.prototype.slice.call(tbody.rows);
    if (!rows.length) return;

    var limits = rows.map(rowLimits);
    var grandMax = limits.reduce(function(s,x){ return s + x.maxTotal; }, 0);
    var grandMin = limits.reduce(function(s,x){ return s + x.minTotal; }, 0);
    var targetObtained = clamp(Math.round(grandMax * target / 100), grandMin, grandMax);
    var previousTotals = rows.map(function(row){
      return (Number(row.querySelector('.obE')?.value) || 0) + (Number(row.querySelector('.obI')?.value) || 0);
    });

    var totals = findUniqueExactTotals(limits, targetObtained, target, previousTotals);
    if (!totals) totals = fallbackExactTotals(limits, targetObtained, target);
    applyTotals(rows, totals);
  }

  fillButton.onclick = function (event) { event.preventDefault(); event.stopPropagation(); fillExact(); };
  exactButton.onclick = function (event) { event.preventDefault(); event.stopPropagation(); fillExact(); };
  auto.onkeydown = function (event) { if (event.key === 'Enter') { event.preventDefault(); fillExact(); } };
})();
