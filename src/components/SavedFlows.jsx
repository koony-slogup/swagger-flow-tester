import { useState } from 'react'
import { useStore } from '../store'
import { Button, MethodBadge } from './ui'
import styles from './SavedFlows.module.css'

export default function SavedFlows({ onLoad, onRun }) {
  const { savedFlows, deleteSavedFlow, duplicateFlow, getApiById } = useStore()
  const [expandedId, setExpandedId] = useState(null)

  return (
    <div className={styles.page}>
      <div className={styles.topbar}>
        <div>
          <div className={styles.title}>저장된 플로우</div>
          <div className={styles.sub}>{savedFlows.length}개 저장됨</div>
        </div>
      </div>

      <div className={styles.content}>
        {savedFlows.length === 0 ? (
          <div className={styles.empty}>
            <SaveIcon />
            <p>저장된 플로우가 없습니다</p>
            <span>플로우 빌더에서 저장하세요</span>
          </div>
        ) : (
          <div className={styles.grid}>
            {savedFlows.map(flow => (
              <div key={flow.id} className={styles.card} onClick={() => onLoad(flow)}>
                <div className={styles.card_body}>
                  <div className={styles.card_name}>{flow.name}</div>
                  <div className={styles.card_meta}>
                    <span>{flow.stepCount}개 스텝</span>
                    <span>{flow.moduleNames?.join(', ')}</span>
                    <span>{flow.savedAt}</span>
                  </div>
                  {expandedId === flow.id && (
                    <div className={styles.step_pills}>
                      {flow.steps.map((s, si) => {
                        const info = getApiById(s.aid)
                        return (
                          <span key={s.id} className={styles.pill}>
                            {si + 1}. {info?.api.name ?? '?'}
                          </span>
                        )
                      })}
                    </div>
                  )}
                </div>
                <div className={styles.card_footer} onClick={e => e.stopPropagation()}>
                  <Button size="sm" variant="success" onClick={() => onRun(flow)}>
                    <PlayIcon /> 실행
                  </Button>
                  <Button size="sm" onClick={() => { setExpandedId(expandedId === flow.id ? null : flow.id) }} title="스텝 보기">
                    <StepsIcon />
                  </Button>
                  <Button size="sm" onClick={() => duplicateFlow(flow.id)} title="복사">
                    <CopyIcon />
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => { if (window.confirm(`"${flow.name}" 플로우를 삭제할까요?`)) deleteSavedFlow(flow.id) }}>삭제</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function PlayIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  )
}

function StepsIcon() {
  return <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
}
function CopyIcon() {
  return <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
}
function SaveIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.25">
      <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  )
}
