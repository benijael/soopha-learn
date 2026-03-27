
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = 'https://nxbvkoltbuowearddemd.supabase.co'
const SUPABASE_ANON_KEY = 'ta_anon_key_ici'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

export async function goToCTF() {
  const { data: { session }, error } = await supabase.auth.getSession()

  if (error || !session) {
    window.location.href = '/login'
    return
  }

  const token = session.access_token
  window.location.href = `https://ctfd.soopha-network.com/sso/supabase?token=${token}`
}
