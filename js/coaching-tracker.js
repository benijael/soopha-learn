/**
 * SooPHA Learn — Coaching Tracker
 * ─────────────────────────────────────────────────────────────
 * À inclure dans CHAQUE page de cours APRÈS config.js et auth.js
 *
 * <script src="../js/coaching-tracker.js"></script>
 *
 * Usage dans le cours :
 *   await CoachingTracker.saveAttempt('pentest1', scorePct);
 *
 * La fonction s'occupe de tout :
 *   - Sauvegarder la tentative en base
 *   - Compter les échecs
 *   - Afficher le bon niveau d'alerte
 * ─────────────────────────────────────────────────────────────
 */

var CoachingTracker = (function () {

  // ── Seuils ──────────────────────────────────────────────────
  var THRESHOLD_HIGHLIGHT = 2; // bouton aide → vert vif
  var THRESHOLD_ALERT     = 3; // alerte rouge proactive

  // ── Sauvegarder une tentative et évaluer le déclencheur ─────
  async function saveAttempt(courseId, scorePct) {
    var user = await getCurrentUser();
    if (!user) return;

    // 1. INSERT la tentative
    var { error } = await supabase
      .from('qcm_attempts')
      .insert({
        user_id:   user.id,
        course_id: courseId,
        score_pct: Math.round(scorePct)
      });

    if (error) {
      console.warn('[CoachingTracker] INSERT error:', error.message);
      return;
    }

    // 2. Compter les échecs pour ce cours
    var { count, error: countErr } = await supabase
      .from('qcm_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .eq('passed', false);

    if (countErr) {
      console.warn('[CoachingTracker] COUNT error:', countErr.message);
      return;
    }

    // 3. Déclencher le bon niveau d'UI
    if (count >= THRESHOLD_ALERT) {
      _showAlert(courseId, count);
    } else if (count >= THRESHOLD_HIGHLIGHT) {
      _highlightButton(courseId, count);
    }
  }

  // ── Charger le résumé d'échecs (pour le dashboard/formations) ─
  async function getFailedSummary(userId) {
    var { data, error } = await supabase
      .from('v_failed_attempts_summary')
      .select('course_id, failed_attempts, best_score')
      .eq('user_id', userId)
      .gt('failed_attempts', 0);

    if (error) {
      console.warn('[CoachingTracker] getFailedSummary error:', error.message);
      return {};
    }

    // Retourne un map { course_id: { failed_attempts, best_score } }
    var map = {};
    (data || []).forEach(function (row) {
      map[row.course_id] = {
        failed: row.failed_attempts,
        best:   row.best_score
      };
    });
    return map;
  }

  // ── UI : alerte rouge proactive (3+ échecs) ─────────────────
  function _showAlert(courseId, failCount) {
    // Supprimer une alerte existante pour éviter les doublons
    var existing = document.getElementById('coaching-alert-' + courseId);
    if (existing) existing.remove();

    // Récupérer le nom du cours depuis la page
    var courseName = document.title.replace(' — SooPHA Learn', '') || courseId;

    var alert = document.createElement('div');
    alert.id = 'coaching-alert-' + courseId;
    alert.style.cssText = [
      'position:fixed',
      'bottom:24px',
      'right:24px',
      'z-index:9999',
      'background:#0a0f0a',
      'border:1px solid rgba(255,68,102,0.5)',
      'border-left:3px solid #ff4466',
      'padding:1rem 1.2rem',
      'max-width:320px',
      'box-shadow:0 0 24px rgba(255,68,102,0.15)',
      'animation:slideInAlert 0.3s ease'
    ].join(';');

    alert.innerHTML = [
      '<style>',
      '@keyframes slideInAlert{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}',
      '</style>',
      '<div style="font-family:var(--mono,monospace);font-size:0.62rem;color:rgba(255,68,102,0.8);letter-spacing:0.1em;margin-bottom:0.4rem">',
      '⚠️ // ' + failCount + ' TENTATIVES SANS SUCCÈS',
      '</div>',
      '<div style="font-size:0.82rem;color:#fff;margin-bottom:0.8rem;line-height:1.5">',
      'Ce module semble difficile. Un formateur peut t\'aider à débloquer la situation en <strong style="color:#00ff88">session privée 1-to-1</strong>.',
      '</div>',
      '<div style="display:flex;gap:0.6rem;align-items:center">',
      '<a href="coaching.html?module=' + encodeURIComponent(courseId) + '&name=' + encodeURIComponent(courseName) + '"',
      '   style="font-family:var(--mono,monospace);font-size:0.65rem;background:#00ff88;color:#050c07;padding:0.45rem 0.9rem;text-decoration:none;font-weight:700;letter-spacing:0.08em">',
      'RÉSERVER →',
      '</a>',
      '<button onclick="document.getElementById(\'coaching-alert-' + courseId + '\').remove()"',
      '        style="background:none;border:none;font-family:var(--mono,monospace);font-size:0.6rem;color:rgba(0,255,136,0.3);cursor:pointer;letter-spacing:0.08em">',
      'Plus tard',
      '</button>',
      '</div>'
    ].join('');

    document.body.appendChild(alert);

    // Auto-fermeture après 12 secondes
    setTimeout(function () {
      if (document.getElementById('coaching-alert-' + courseId)) {
        alert.style.opacity = '0';
        alert.style.transition = 'opacity 0.4s';
        setTimeout(function () { alert.remove(); }, 400);
      }
    }, 12000);
  }

  // ── UI : highlight bouton aide (2 échecs) ────────────────────
  function _highlightButton(courseId, failCount) {
    // Cherche le bouton help s'il existe dans la page cours
    var helpBtn = document.getElementById('coaching-help-btn');
    if (!helpBtn) return;

    helpBtn.style.color     = 'rgba(0,255,136,0.8)';
    helpBtn.style.borderColor = 'rgba(0,255,136,0.4)';
    helpBtn.setAttribute('data-fail-count', failCount);

    // Optionnel : petit badge avec le nombre d'échecs
    if (!helpBtn.querySelector('.fail-badge')) {
      var badge = document.createElement('span');
      badge.className = 'fail-badge';
      badge.textContent = failCount + 'x';
      badge.style.cssText = 'margin-left:6px;background:rgba(255,180,0,0.15);color:#ffb400;font-size:0.55rem;padding:1px 5px;border:1px solid rgba(255,180,0,0.3)';
      helpBtn.appendChild(badge);
    }
  }

  // ── Utilitaire : récupérer l'user courant ───────────────────
  async function getCurrentUser() {
    try {
      var result = await supabase.auth.getUser();
      return result.data && result.data.user ? result.data.user : null;
    } catch (e) {
      return null;
    }
  }

  // ── API publique ─────────────────────────────────────────────
  return {
    saveAttempt:      saveAttempt,
    getFailedSummary: getFailedSummary
  };

})();
