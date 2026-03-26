// ═══════════════════════════════════════════════════════
//  SOOPHA LEARN — Configuration Supabase
//  1. Va sur supabase.com → ton projet → Settings → API
//  2. Copie ton Project URL et ton anon/public key
//  3. Colle-les ici
// ═══════════════════════════════════════════════════════

const SUPABASE_URL = 'REMPLACE_PAR_TON_PROJECT_URL';
// Exemple : 'https://xyzabcdef.supabase.co'

const SUPABASE_ANON_KEY = 'REMPLACE_PAR_TON_ANON_KEY';
// Exemple : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'

// ═══════════════════════════════════════════════════════
//  Ne touche pas au reste
// ═══════════════════════════════════════════════════════
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
