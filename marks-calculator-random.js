// Marks Calculator: varied subject marks with exact overall target percentage.
(function () {
  function q(id) { return document.getElementById(id); }
  var table = q('mcTable');
  var auto = q('mcAuto');
  if (!table || !auto) return;

  var tbody = table.querySelector('tbody');
  var fillButton = q('mcFillMarks');

  // Disable legacy auto-fill behavior.
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

  // Keep a second explicit exact button if the UI can show it.
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
    return {
      maxE: maxE,
      maxI: maxI,
      minE: Math.ceil(maxE * 0.40),
      minI: Math.ceil(maxI * 0.40),
      minTotal: Math.ceil(maxE * 0.40) + Math.ceil(maxI * 0.40),
      maxTotal: maxE + maxI
    };
  }

  function recalculate() {
    var got = 0, maximum = 0;
    Array.prototype.forEach.call(tbody.rows, function (row) {
      var lim = rowLimits(row);
      var obE = Math.max(0, Number(row.querySelector('.obE')?.value) || 0);
      var obI = Math.max(0, Number(row.querySelector('.obI')?.value) || 0);
      var mt = lim.maxTotal;
      var ot = obE + obI;
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

    for (var attempt = 0; attempt < 100; attempt++) {
      var ext = rand(lowE, highE);
      var intl = desired - ext;
      var key = ext + '|' + intl;
      if (key !== previousPair && !usedPairs.has(key)) return [ext, intl, key];
    }
    for (var e = lowE; e <= highE; e++) {
      var i = desired - e, k = e + '|' + i;
      if (k !== previousPair && !usedPairs.has(k)) return [e, i, k];
    }
    var fallbackE = rand(lowE, highE), fallbackI = desired - fallbackE;
    return [fallbackE, fallbackI, fallbackE + '|' + fallbackI];
  }

  function chooseVariedTotal(lim, target, usedTotals, previousTotal, rowIndex) {
    var base = clamp(Math.round(lim.maxTotal * target / 100), lim.minTotal, lim.maxTotal);
    var offsets = [-5, 4, -3, 6, -2, 3, -7, 7, -1, 2, -4, 5, 1, 0];
    var start = (press + rowIndex * 3) % offsets.length;

    for (var a = 0; a < offsets.length; a++) {
      var total = clamp(base + offsets[(start + a) % offsets.length], lim.minTotal, lim.maxTotal);
      if (!usedTotals.has(total) && total !== previousTotal) return total;
    }
    for (var d = 0; d <= lim.maxTotal - lim.minTotal; d++) {
      var down = base - d, up = base + d;
      if (down >= lim.minTotal && !usedTotals.has(down) && down !== previousTotal) return down;
      if (up <= lim.maxTotal && !usedTotals.has(up) && up !== previousTotal) return up;
    }
    return base;
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
      obE.value = pair[0];
      obI.value = pair[1];
      obE.min = lim.minE; obE.max = lim.maxE;
      obI.min = lim.minI; obI.max = lim.maxI;
    });
    recalculate();
  }

  // Exact overall target with varied subject totals.
  function fillExact() {
    var target = clamp(Number(auto.value) || 40, 40, 100);
    auto.value = target;
    press++;
    var rows = Array.prototype.slice.call(tbody.rows);
    if (!rows.length) return;

    var limits = rows.map(rowLimits);
    var grandMax = limits.reduce(function (s, x) { return s + x.maxTotal; }, 0);
    var grandMin = limits.reduce(function (s, x) { return s + x.minTotal; }, 0);

    // Integer marks can only represent percentages in steps of 100 / grandMax.
    // Use the nearest integer grand total, which gives the exact requested one-decimal result whenever possible.
    var targetObtained = clamp(Math.round(grandMax * target / 100), grandMin, grandMax);

    var totals = [], usedTotals = new Set();
    rows.forEach(function (row, index) {
      var lim = limits[index];
      var previousTotal = (Number(row.querySelector('.obE')?.value) || 0) + (Number(row.querySelector('.obI')?.value) || 0);
      var total = chooseVariedTotal(lim, target, usedTotals, previousTotal, index);
      totals.push(total);
      usedTotals.add(total);
    });

    var current = totals.reduce(function (a, b) { return a + b; }, 0);
    var guard = 0;
    while (current !== targetObtained && guard++ < 10000) {
      var direction = current < targetObtained ? 1 : -1;
      var changed = false;

      // Prefer adjustments that keep all subject totals different.
      for (var k = 0; k < rows.length; k++) {
        var idx = (k + press + guard) % rows.length;
        var next = totals[idx] + direction;
        if (next < limits[idx].minTotal || next > limits[idx].maxTotal) continue;
        var occupied = totals.some(function (v, j) { return j !== idx && v === next; });
        if (occupied) continue;
        totals[idx] = next;
        current += direction;
        changed = true;
        if (current === targetObtained) break;
      }
      if (changed) continue;

      // Exact grand percentage has priority if uniqueness is impossible.
      for (var j = 0; j < rows.length; j++) {
        var next2 = totals[j] + direction;
        if (next2 < limits[j].minTotal || next2 > limits[j].maxTotal) continue;
        totals[j] = next2;
        current += direction;
        changed = true;
        break;
      }
      if (!changed) break;
    }

    applyTotals(rows, totals);
  }

  // Both buttons now honor the entered target exactly at overall level.
  fillButton.onclick = function (event) {
    event.preventDefault();
    event.stopPropagation();
    fillExact();
  };
  exactButton.onclick = function (event) {
    event.preventDefault();
    event.stopPropagation();
    fillExact();
  };
  auto.onkeydown = function (event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      fillExact();
    }
  };
})();
