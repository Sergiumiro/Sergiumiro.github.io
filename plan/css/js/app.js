// ============================================================
// APP.JS — boot / init
// ============================================================
(function boot() {
  updateCacheBadge();
  var loaded = loadFromStorage();

  // Migrate old single-plan format
  if (!loaded) {
    try {
      var old = localStorage.getItem('work_plan_v1');
      if (old) {
        var od = JSON.parse(old);
        if (od && od.project) {
          var mg = normalizePlan(od);
          plans = [mg]; activePlanId = mg.id; loaded = true;
          toast('План перенесён из старого формата','✅');
        }
      }
    } catch(e) {}
  }

  if (loaded) {
    renderAll();
    plans.forEach(function(p){ pushUndoFor(p.id); });
    toast('Планы загружены','💾');
  }

  updateUndoUI();
  startNowTicker();
})();
