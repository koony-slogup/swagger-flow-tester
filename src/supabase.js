import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

let supabaseClient

if (!url || !key || key === 'YOUR_SUPABASE_URL' || key === 'YOUR_SUPABASE_ANON_KEY' || !url || url.includes('YOUR_SUPABASE_URL')) {
  console.warn('[Supabase] 환경 변수가 설정되지 않았습니다. 로컬 모드로 동작합니다.')
  
  // 메서드 체이닝을 지원하는 Mock 객체 생성
  const createMockChain = () => {
    const chain = {
      select: () => chain,
      upsert: () => chain,
      delete: () => chain,
      eq: () => chain,
      order: () => chain,
      // Promise처럼 동작하게 하여 await 가능하게 함
      then: (resolve) => Promise.resolve({ data: [], error: null }).then(resolve),
    }
    return chain
  }

  supabaseClient = {
    from: () => createMockChain(),
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    }
  }
} else {
  supabaseClient = createClient(url, key)
}

export const supabase = supabaseClient
