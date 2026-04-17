import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !key || key === '여기에_anon_key_입력') {
  console.warn('[Supabase] .env에 VITE_SUPABASE_ANON_KEY를 입력하세요.')
}

export const supabase = createClient(url, key)
