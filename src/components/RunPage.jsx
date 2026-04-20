import { useState, useCallback } from 'react'
import { useStore } from '../store'
import { computeExecutionOrder, resolveTemplate } from '../flowUtils'
import { normalizeUrl } from '../envUtils'
import { Button, MethodBadge } from './ui'
import styles from './RunPage.module.css'

export default function RunPage({ onGoToFlow }) {
  const { flowSteps, flowName, connections, getApiById, resolveEnvVars, saveFlow, setLastRunResponse, clearLastRunResponses } = useStore()
  const [results, setResults] = useState([])
  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [expandedIdx, setExpandedIdx] = useState(null)

  const stats = {
    total: results.length,
    success: results.filter(r => r.status === 'success').length,
    fail: results.filter(r => r.status === 'fail').length,
    time: results.reduce((acc, r) => acc + (r.time || 0), 0),
  }

  const runFlow = useCallback(async () => {
    // Follow connection-based execution order
    const execOrder = computeExecutionOrder(flowSteps, connections)
    const apiSteps = execOrder.filter(s => s.type !== 'header-config')
    if (apiSteps.length === 0 || running) return

    saveFlow(flowName.trim() || '이름 없는 플로우')
    clearLastRunResponses()
    setRunning(true)
    setProgress(0)
    setExpandedIdx(null)

    // Results in execution order
    const initial = apiSteps.map(s => {
      const info = getApiById(s.aid)
      return { name: info?.api.name ?? '?', method: info?.api.method ?? 'GET', status: 'pending', code: null, time: null, body: null }
    })
    setResults(initial)

    // resolvedResponses indexed by execution order position
    const resolvedResponses = new Array(execOrder.length).fill(null)

    function resolveBinding(binding) {
      const match = binding?.match(/^step(\d+)\.(.+)$/)
      if (!match) return undefined
      const prev = resolvedResponses[parseInt(match[1]) - 1]
      if (!prev) return undefined
      const rest = match[2]
      if (rest.startsWith('header.')) return prev.headers?.[rest.slice(7).toLowerCase()]
      // 중첩 경로 지원: 'data.token' → body.data.token
      const parts = rest.split('.')
      let val = prev.body
      for (const part of parts) {
        if (val == null || typeof val !== 'object') return undefined
        val = val[part]
      }
      return val
    }

    let apiResultIdx = 0

    for (let i = 0; i < execOrder.length; i++) {
      const step = execOrder[i]

      // Header-config step: skip execution, headers are accumulated below
      if (step.type === 'header-config') continue

      const info = getApiById(step.aid)
      if (!info) { apiResultIdx++; continue }

      const ri = apiResultIdx
      setResults(prev => prev.map((r, idx) => idx === ri ? { ...r, status: 'running' } : r))

      // Resolve body params
      const resolvedParams = {}
      step.params.forEach(p => {
        if (p.items) {
          // 리스트 모드: 각 아이템 개별 resolve → 배열로
          resolvedParams[p.key] = p.items.map(item => {
            let v
            if (item.binding) {
              const resolved = resolveBinding(item.binding)
              v = resolved !== undefined ? resolved : ''  // 해석 실패 시 빈값 (키 문자열 아님)
            } else {
              v = resolveTemplate(item.val ?? '', resolveBinding)
            }
            // 숫자 문자열은 숫자로 변환
            if (typeof v === 'string' && v.trim() !== '' && !isNaN(Number(v))) return Number(v)
            return v
          })
        } else {
          let val = p.binding
            ? (resolveBinding(p.binding) ?? p.val)
            : resolveTemplate(p.val ?? '', resolveBinding)
          if (typeof val === 'string') {
            const t = val.trim()
            if (t.startsWith('[') || t.startsWith('{')) {
              try { val = JSON.parse(t) } catch {}
            } else if (t === '') {
              val = null
            }
          }
          resolvedParams[p.key] = val
        }
      })

      // Priority: module auth < header-config boxes (in exec order) < step-specific headers
      const requestHeaders = {}
      ;(info.module.auths || []).forEach(a => {
        if (a.key && a.val) requestHeaders[a.key] = a.val
      })
      for (let j = 0; j < i; j++) {
        const prev = execOrder[j]
        if (prev.type !== 'header-config') continue
        ;(prev.headers || []).forEach(h => {
          if (!h.key) return
          if (step.excludedHeaders?.includes(h.key)) return
          let val = h.binding
            ? (resolveBinding(h.binding) ?? h.val)
            : resolveTemplate(h.val, resolveBinding)
          
          // Auto-fix: Ensure Bearer prefix for Authorization header if it's a bearer scheme
          if (val && h.key === 'Authorization' && (h.schemeType === 'http bearer' || h.hint === 'Bearer')) {
            if (!val.toLowerCase().startsWith('bearer ')) {
              val = 'Bearer ' + val
            }
          }

          if (val) requestHeaders[h.key] = val
        })
      }
      ;(step.reqHeaders || []).forEach(h => {
        if (!h.key) return
        let val = h.binding
          ? (resolveBinding(h.binding) ?? h.val)
          : resolveTemplate(h.val, resolveBinding)

        // Auto-fix: Ensure Bearer prefix for Authorization header if it's a bearer scheme
        if (val && h.key === 'Authorization' && (h.schemeType === 'http bearer' || h.hint === 'Bearer')) {
          if (!val.toLowerCase().startsWith('bearer ')) {
            val = 'Bearer ' + val
          }
        }

        if (val) requestHeaders[h.key] = val
      })

      const start = performance.now()
      let result
      try {
        result = await executeApi(normalizeUrl(resolveEnvVars(info.module.url)), info.api, resolvedParams, requestHeaders, {
          bodyMode: step.bodyMode, bodyRaw: step.bodyRaw
        })
      } catch (err) {
        result = { ok: false, status: 500, body: { error: err.message }, headers: {} }
      }
      const elapsed = Math.round(performance.now() - start)

      resolvedResponses[i] = result.ok ? { body: result.body, headers: result.headers } : null
      if (result.ok) setLastRunResponse(step.id, result.body, result.headers)
      setProgress(Math.round(((ri + 1) / apiSteps.length) * 100))
      setResults(prev => prev.map((r, idx) =>
        idx === ri ? {
          ...r,
          status: result.ok ? 'success' : 'fail',
          code: result.status,
          time: elapsed,
          body: JSON.stringify(result.body, null, 2),
          resHeaders: result.headers,
          reqHeaders: requestHeaders,
          curl: result.curl,
        } : r
      ))

      if (!result.ok) break
      apiResultIdx++
    }

    setRunning(false)
  }, [flowSteps, connections, flowName, getApiById, resolveEnvVars, saveFlow, setLastRunResponse, clearLastRunResponses, running])

  return (
    <div className={styles.page}>
      <div className={styles.topbar}>
        <div>
          <div className={styles.title}>실행 결과</div>
          <div className={styles.sub}>{flowName || '이름 없는 플로우'} · {flowSteps.length}개 스텝</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button size="sm" onClick={onGoToFlow}>
            <BackIcon /> 플로우로
          </Button>
          <Button variant="success" size="sm" onClick={runFlow} disabled={running || flowSteps.length === 0}>
            {running ? <SpinIcon /> : <PlayIcon />}
            {running ? '실행 중...' : '실행'}
          </Button>
        </div>
      </div>

      <div className={styles.progress_track}>
        <div className={styles.progress_fill} style={{ width: progress + '%' }} />
      </div>

      <div className={styles.body}>
        <div className={styles.results}>
          {results.length === 0 ? (
            <div className={styles.empty}>실행 버튼을 눌러 플로우를 시작하세요</div>
          ) : (
            results.map((r, i) => (
              <div key={i} className={[styles.result_card, styles[`result_${r.status}`]].join(' ')}>
                <div className={styles.result_header} onClick={() => r.body && setExpandedIdx(expandedIdx === i ? null : i)}>
                  <div className={styles.dot} />
                  <MethodBadge method={r.method} />
                  <span className={styles.result_name}>{r.name}</span>
                  {r.code && <span className={styles.result_code}>{r.code}</span>}
                  {r.time && <span className={styles.result_time}>{r.time}ms</span>}
                  {r.body && <span className={styles.chevron}>{expandedIdx === i ? '▲' : '▼'}</span>}
                </div>
                {expandedIdx === i && (
                  <div className={styles.result_expanded}>
                    {/* 요청 헤더 (Content-Type 제외) */}
                    {r.reqHeaders && Object.keys(r.reqHeaders).filter(k => k !== 'Content-Type').length > 0 && (
                      <div className={styles.result_headers}>
                        <div className={[styles.result_headers_title, styles.req_headers_title].join(' ')}>
                          ↑ 요청 헤더
                        </div>
                        {Object.entries(r.reqHeaders)
                          .filter(([k]) => k !== 'Content-Type')
                          .map(([k, v]) => (
                            <div key={k} className={styles.result_header_row}>
                              <span className={styles.result_header_key}>{k}</span>
                              <span className={[styles.result_header_val, styles.req_header_val].join(' ')}>{v}</span>
                            </div>
                          ))}
                      </div>
                    )}
                    {/* curl */}
                    {r.curl && <CurlBlock curl={r.curl} />}
                    {/* 응답 헤더 */}
                    {r.resHeaders && Object.keys(r.resHeaders).length > 0 && (
                      <div className={styles.result_headers}>
                        <div className={styles.result_headers_title}>↓ 응답 헤더</div>
                        {Object.entries(r.resHeaders).map(([k, v]) => (
                          <div key={k} className={styles.result_header_row}>
                            <span className={styles.result_header_key}>{k}</span>
                            <span className={styles.result_header_val}>{v}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {/* 응답 바디 */}
                    {r.body && <pre className={styles.result_body}>{r.body}</pre>}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <div className={styles.summary}>
          <div className={styles.summary_title}>실행 요약</div>
          <div className={styles.stats_grid}>
            <StatCard label="총 스텝" value={stats.total || '—'} />
            <StatCard label="성공" value={stats.success || (results.length ? '0' : '—')} color="var(--green)" />
            <StatCard label="실패" value={stats.fail || (results.length ? '0' : '—')} color="var(--red)" />
            <StatCard label="총 시간" value={stats.time ? stats.time + 'ms' : '—'} color="var(--text2)" />
          </div>
          <div>
            <div className={styles.stat_label}>진행률</div>
            <div className={styles.progress_track} style={{ marginTop: 6 }}>
              <div className={styles.progress_fill} style={{ width: progress + '%' }} />
            </div>
          </div>
          {results.length > 0 && !running && (
            <div className={styles.status_msg} data-ok={stats.fail === 0}>
              {stats.fail === 0 ? '✓ 모든 스텝 성공' : `✗ ${stats.fail}개 스텝 실패`}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function CurlBlock({ curl }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard.writeText(curl).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500) })
  }
  return (
    <div className={styles.curl_block}>
      <div className={styles.curl_head}>
        <span className={styles.curl_label}>curl</span>
        <button className={styles.curl_copy} onClick={copy}>{copied ? '복사됨 ✓' : '복사'}</button>
      </div>
      <pre className={styles.curl_pre}>{curl}</pre>
    </div>
  )
}

function StatCard({ label, value, color }) {
  return (
    <div className={styles.stat}>
      <span className={styles.stat_label}>{label}</span>
      <span className={styles.stat_value} style={{ color: color || 'var(--text)' }}>{value}</span>
    </div>
  )
}

function buildCurl(method, url, headers, body) {
  const parts = [`curl -X ${method}`]
  Object.entries(headers).forEach(([k, v]) => parts.push(`  -H '${k}: ${v}'`))
  if (body) parts.push(`  -d '${body.replace(/'/g, "\\'")}'`)
  parts.push(`  '${url}'`)
  return parts.join(' \\\n')
}

async function executeApi(baseUrl, api, params, extraHeaders = {}, options = {}) {
  const isBody = ['POST', 'PUT', 'PATCH'].includes(api.method)
  const path = api.path.replace(/{(\w+)}/g, (_, k) => encodeURIComponent(params[k] ?? `:${k}`))
  const queryEntries = isBody ? [] : Object.entries(params).filter(([k]) => !api.path.includes(`{${k}}`))
  const query = queryEntries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&')
  const url = baseUrl.replace(/\/$/, '') + path + (query ? '?' + query : '')

  const headers = { 'Content-Type': 'application/json', ...extraHeaders }
  let body
  if (isBody) {
    body = options.bodyMode === 'raw' && options.bodyRaw ? options.bodyRaw : JSON.stringify(params)
  }
  const curl = buildCurl(api.method, url, headers, body)
  const res = await fetch(url, { method: api.method, headers, body })

  const resHeaders = {}
  res.headers.forEach((val, key) => { resHeaders[key] = val })

  let resBody
  const ct = res.headers.get('content-type') || ''
  if (ct.includes('application/json')) {
    resBody = await res.json()
  } else {
    const text = await res.text()
    resBody = text ? { _raw: text } : {}
  }

  return { ok: res.ok, status: res.status, body: resBody, headers: resHeaders, curl }
}

function PlayIcon() {
  return <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3" /></svg>
}
function BackIcon() {
  return <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
}

function SpinIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'spin 0.7s linear infinite' }}>
      <circle cx="12" cy="12" r="10" strokeOpacity="0.3" />
      <path d="M12 2a10 10 0 0 1 10 10" />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </svg>
  )
}
