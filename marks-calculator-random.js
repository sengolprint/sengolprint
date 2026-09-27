// Marks Calculator: Auto-fill at X% => overall result is X% (nearest possible integer-mark total), with varied subject totals.
(function () {
  function q(id) { return document.getElementById(id); }
  var table = q('mcTable'), auto = q('mcAuto'), fillButton = q('mcFillMarks');
  if (!table || !auto || !fillButton) return;
  var tbody = table.querySelector('tbody');
  var press = 0;

  auto.onchange = null;
  auto.min = '40';
  auto.max = '100';
  auto.step = '0.1';
  fillButton.textContent = 'Fill';
  var oldExact = q('mcExactMarks');
  if (oldExact) oldExact.remove();

  function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
  function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

  function limits(row) {
    var maxE = Math.max(0, Number(row.querySelector('.mxE')?.value) || 0);
    var maxI = Math.max(0, Number(row.querySelector('.mxI')?.value) || 0);
    var minE = Math.ceil(maxE * 0.40), minI = Math.ceil(maxI * 0.40);
    return { maxE:maxE, maxI:maxI, minE:minE, minI:minI, minTotal:minE+minI, maxTotal:maxE+maxI };
  }

  function recalc() {
    var got = 0, maximum = 0;
    Array.prototype.forEach.call(tbody.rows, function(row) {
      var l = limits(row);
      var e = Number(row.querySelector('.obE')?.value) || 0;
      var i = Number(row.querySelector('.obI')?.value) || 0;
      var total = e + i;
      var mxT = row.querySelector('.mxT'), obT = row.querySelector('.obT'), pct = row.querySelector('.pct');
      if (mxT) mxT.textContent = l.maxTotal;
      if (obT) obT.textContent = total;
      if (pct) pct.textContent = (l.maxTotal ? total / l.maxTotal * 100 : 0).toFixed(1) + '%';
      got += total; maximum += l.maxTotal;
    });
    var pc = maximum ? got / maximum * 100 : 0;
    var summary = q('mcSummary');
    if (summary) summary.innerHTML = '<div style="padding:12px;border:1px solid #dbe2ea;border-radius:12px"><small>Status</small><b style="display:block;color:' + (pc >= 40 ? '#00875a' : '#c62828') + '">' + (pc >= 40 ? 'Pass' : 'Fail') + '</b></div><div style="padding:12px;border:1px solid #dbe2ea;border-radius:12px"><small>Obtained</small><b style="display:block">' + got + '</b></div><div style="padding:12px;border:1px solid #dbe2ea;border-radius:12px"><small>Total &nbsp; ' + pc.toFixed(1) + '%</small><b style="display:block">' + maximum + '</b></div>';
  }

  function shuffledCandidates(l, target, rowIndex, previousTotal) {
    var ideal = l.maxTotal * target / 100;
    var values = [];
    for (var v = l.minTotal; v <= l.maxTotal; v++) values.push(v);
    values.sort(function(a,b) {
      var da = Math.abs(a - ideal), db = Math.abs(b - ideal);
      if (a === previousTotal) da += 1.5;
      if (b === previousTotal) db += 1.5;
      if (da !== db) return da - db;
      return (((a * 17 + rowIndex * 13 + press * 19) % 97) - ((b * 17 + rowIndex * 13 + press * 19) % 97));
    });
    return values;
  }

  // Finds DIFFERENT subject totals whose sum is the exact required grand obtained marks.
  function findUniqueTotals(ls, wanted, target, previousTotals) {
    var n = ls.length, result = new Array(n), used = new Set(), nodes = 0;
    var order = Array.from({length:n}, function(_,i){ return i; });
    order.sort(function(a,b){ return (ls[a].maxTotal-ls[a].minTotal) - (ls[b].maxTotal-ls[b].minTotal); });
    var cand = ls.map(function(l,i){ return shuffledCandidates(l,target,i,previousTotals[i]); });
    var suffixMin = new Array(n+1).fill(0), suffixMax = new Array(n+1).fill(0);
    for (var p=n-1; p>=0; p--) {
      var idx=order[p];
      suffixMin[p]=suffixMin[p+1]+ls[idx].minTotal;
      suffixMax[p]=suffixMax[p+1]+ls[idx].maxTotal;
    }
    function dfs(pos,sum){
      if (++nodes > 500000) return false;
      if (pos===n) return sum===wanted;
      if (sum + suffixMin[pos] > wanted || sum + suffixMax[pos] < wanted) return false;
      var idx=order[pos], vals=cand[idx];
      for (var c=0;c<vals.length;c++){
        var v=vals[c];
        if (used.has(v)) continue;
        if (sum+v > wanted) continue;
        used.add(v); result[idx]=v;
        if (dfs(pos+1,sum+v)) return true;
        used.delete(v);
      }
      return false;
    }
    return dfs(0,0) ? result : null;
  }

  function exactFallback(ls, wanted, target) {
    var totals = ls.map(function(l){ return clamp(Math.round(l.maxTotal * target / 100), l.minTotal, l.maxTotal); });
    var sum = totals.reduce(function(a,b){return a+b;},0), guard=0;
    while (sum !== wanted && guard++ < 20000) {
      var dir = sum < wanted ? 1 : -1, changed=false;
      for (var i=0;i<totals.length;i++) {
        var next=totals[i]+dir;
        if (next<ls[i].minTotal || next>ls[i].maxTotal) continue;
        totals[i]=next; sum+=dir; changed=true;
        if (sum===wanted) break;
      }
      if (!changed) break;
    }
    return totals;
  }

  function splitTotal(l, desired, previousPair, usedPairs, rowIndex) {
    var low = Math.max(l.minE, desired-l.maxI), high = Math.min(l.maxE, desired-l.minI);
    var choices=[];
    for (var e=low;e<=high;e++) choices.push(e);
    choices.sort(function(a,b){ return (((a*23 + rowIndex*11 + press*29)%101) - ((b*23 + rowIndex*11 + press*29)%101)); });
    for (var c=0;c<choices.length;c++) {
      var ext=choices[c], intl=desired-ext, key=ext+'|'+intl;
      if (key!==previousPair && !usedPairs.has(key)) return [ext,intl,key];
    }
    var ext2 = choices.length ? choices[rand(0,choices.length-1)] : low;
    return [ext2, desired-ext2, ext2+'|'+(desired-ext2)];
  }

  function fill() {
    var target = clamp(Number(auto.value) || 40, 40, 100);
    auto.value = target;
    press++;
    var rows = Array.prototype.slice.call(tbody.rows);
    if (!rows.length) return;
    var ls = rows.map(limits);
    var grandMax = ls.reduce(function(s,l){ return s+l.maxTotal; },0);
    var grandMin = ls.reduce(function(s,l){ return s+l.minTotal; },0);
    var wanted = clamp(Math.round(grandMax * target / 100), grandMin, grandMax);
    var previousTotals = rows.map(function(row){ return (Number(row.querySelector('.obE')?.value)||0)+(Number(row.querySelector('.obI')?.value)||0); });
    var totals = findUniqueTotals(ls,wanted,target,previousTotals) || exactFallback(ls,wanted,target);
    var usedPairs = new Set();
    rows.forEach(function(row,index){
      var e=row.querySelector('.obE'), i=row.querySelector('.obI');
      if (!e || !i) return;
      var previous=(Number(e.value)||0)+'|'+(Number(i.value)||0);
      var pair=splitTotal(ls[index],totals[index],previous,usedPairs,index);
      usedPairs.add(pair[2]);
      e.value=pair[0]; i.value=pair[1];
      e.min=ls[index].minE; e.max=ls[index].maxE;
      i.min=ls[index].minI; i.max=ls[index].maxI;
    });
    recalc();
  }

  fillButton.onclick = function(e){ e.preventDefault(); e.stopPropagation(); fill(); };
  auto.onkeydown = function(e){ if(e.key==='Enter'){ e.preventDefault(); fill(); } };
})();
