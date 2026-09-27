// Marks Calculator: varied auto-fill with 40% minimums and a new set on every press.
(function () {
  function q(id) { return document.getElementById(id); }
  var table = q('mcTable');
  var auto = q('mcAuto');
  if (!table || !auto) return;

  var tbody = table.querySelector('tbody');
  var fillButton = q('mcFillMarks');

  // Replace the old onchange handler that filled every row with identical percentages.
  auto.onchange = null;
  auto.min = '40';
  auto.max = '100';

  if (!fillButton) {
    fillButton = document.createElement('button');
    fillButton.id = 'mcFillMarks';
    fillButton.type = 'button';
    fillButton.textContent = 'Fill Marks';
    fillButton.style.cssText = 'height:32px;padding:4px 12px;border:0;border-radius:8px;background:#176b50;color:#fff;font-weight:800;cursor:pointer;margin-left:7px';
    var label = auto.closest('label');
    if (label) {
      label.childNodes[0].textContent = 'Target ';
      label.appendChild(fillButton);
    } else {
      auto.insertAdjacentElement('afterend', fillButton);
    }
  }

  var press = 0;
  function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
  function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

  function recalculate() {
    var got = 0, maximum = 0;
    Array.prototype.forEach.call(tbody.rows, function (row) {
      var maxE = Math.max(0, Number(row.querySelector('.mxE')?.value) || 0);
      var maxI = Math.max(0, Number(row.querySelector('.mxI')?.value) || 0);
      var obE = Math.max(0, Number(row.querySelector('.obE')?.value) || 0);
      var obI = Math.max(0, Number(row.querySelector('.obI')?.value) || 0);
      var mt = maxE + maxI;
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

  function choosePair(maxE, maxI, target, rowIndex, used, previous) {
    var minE = Math.ceil(maxE * 0.40);
    var minI = Math.ceil(maxI * 0.40);
    var minTotal = minE + minI;
    var maxTotal = maxE + maxI;

    for (var attempt = 0; attempt < 180; attempt++) {
      // Each subject gets a small independent variation around the entered target.
      var variation = rand(-7, 7);
      var rowPercent = clamp(target + variation, 40, 100);
      var desired = clamp(Math.round(maxTotal * rowPercent / 100), minTotal, maxTotal);
      var lowE = Math.max(minE, desired - maxI);
      var highE = Math.min(maxE, desired - minI);
      if (lowE > highE) continue;
      var ext = rand(lowE, highE);
      var intl = desired - ext;
      var key = ext + '|' + intl;
      if (intl < minI || intl > maxI) continue;
      if (used.has(key) || key === previous) continue;
      return [ext, intl, key];
    }

    // Deterministic fallback: find any unused valid pair different from the row's current pair.
    for (var e = minE; e <= maxE; e++) {
      for (var i = minI; i <= maxI; i++) {
        var k = e + '|' + i;
        if (!used.has(k) && k !== previous) return [e, i, k];
      }
    }
    return [minE, minI, minE + '|' + minI];
  }

  function fillMarks() {
    var target = clamp(Number(auto.value) || 40, 40, 100);
    auto.value = target;
    press++;
    var used = new Set();
    var rows = Array.prototype.slice.call(tbody.rows);

    rows.forEach(function (row, rowIndex) {
      var mxE = row.querySelector('.mxE'), mxI = row.querySelector('.mxI');
      var obE = row.querySelector('.obE'), obI = row.querySelector('.obI');
      if (!mxE || !mxI || !obE || !obI) return;

      var maxE = Math.max(0, Number(mxE.value) || 0);
      var maxI = Math.max(0, Number(mxI.value) || 0);
      var previous = (Number(obE.value) || 0) + '|' + (Number(obI.value) || 0);
      var pair = choosePair(maxE, maxI, target, rowIndex + press, used, previous);
      used.add(pair[2]);
      obE.value = pair[0];
      obI.value = pair[1];
      obE.min = Math.ceil(maxE * 0.40); obE.max = maxE;
      obI.min = Math.ceil(maxI * 0.40); obI.max = maxI;
    });

    recalculate();
  }

  fillButton.onclick = function (event) {
    event.preventDefault();
    event.stopPropagation();
    fillMarks();
  };
  auto.onkeydown = function (event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      fillMarks();
    }
  };
})();
