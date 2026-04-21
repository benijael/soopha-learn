// ═══════════════════════════════════════════════════════
//  SOOPHA LEARN — Auth Helper
//  Partagé par toutes les pages
// ═══════════════════════════════════════════════════════

// Récupère l'utilisateur courant
async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// Redirige vers login si non connecté
// Redirige vers premium.html si connecté mais pas premium
async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    window.location.href = '/pages/login.html';
    return null;
  }

  // ── Vérification accès premium ───────────────────────
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_premium')
    .eq('id', user.id)
    .single();

  if (!profile || !profile.is_premium) {
    window.location.href = '/pages/premium.html';
    return null;
  }
  // ─────────────────────────────────────────────────────

  return user;
}

// Redirige vers dashboard si déjà connecté
async function redirectIfAuthed() {
  const user = await getCurrentUser();
  if (user) {
    window.location.href = '/pages/dashboard.html';
  }
}

// Logout
async function logout() {
  await supabase.auth.signOut();
  window.location.href = '/index.html';
}

// Récupère ou crée le profil utilisateur
async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  return data;
}

// Sauvegarde la progression d'un QCM
async function saveQcmProgress(userId, courseId, slideIndex, isCorrect) {
  const { data, error } = await supabase
    .from('qcm_results')
    .upsert({
      user_id: userId,
      course_id: courseId,
      slide_index: slideIndex,
      is_correct: isCorrect,
      answered_at: new Date().toISOString()
    }, { onConflict: 'user_id,course_id,slide_index' });
  return !error;
}

// Récupère la progression d'un cours
async function getCourseProgress(userId, courseId) {
  const { data } = await supabase
    .from('qcm_results')
    .select('*')
    .eq('user_id', userId)
    .eq('course_id', courseId);
  return data || [];
}

// Marque un cours comme terminé avec son score
async function completeCourse(userId, courseId, scorePct) {
  const { error } = await supabase
    .from('course_completions')
    .upsert({
      user_id: userId,
      course_id: courseId,
      score_pct: scorePct,
      completed_at: new Date().toISOString()
    }, { onConflict: 'user_id,course_id' });
  return !error;
}

// Récupère tous les cours complétés par un user
async function getCompletedCourses(userId) {
  const { data } = await supabase
    .from('course_completions')
    .select('*')
    .eq('user_id', userId);
  return data || [];
}

// Récupère les stats globales d'un user
async function getUserStats(userId) {
  const completions = await getCompletedCourses(userId);
  const totalCorrect = completions.reduce((sum, c) => sum + (c.score_pct >= 70 ? 1 : 0), 0);
  return {
    coursesCompleted: completions.length,
    coursesPassedAt70: totalCorrect,
    avgScore: completions.length > 0
      ? Math.round(completions.reduce((s, c) => s + c.score_pct, 0) / completions.length)
      : 0
  };
}
