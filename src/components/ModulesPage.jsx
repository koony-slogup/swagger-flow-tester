import { useState } from 'react'
import { useStore } from '../store'
import { Button, Modal, FormGroup, Input } from './ui'
import { MethodBadge } from './ui'
import styles from './ModulesPage.module.css'

export default function ModulesPage() {
  const { modules, addModule, removeModule, renameModule, refreshModule } = useStore()
  const { addModuleAuth, removeModuleAuth, updateModuleAuth } = useStore()

  const [addOpen, setAddOpen]     = useState(false)
  const [name, setName]           = useState('')
  const [url, setUrl]             = useState('')
  const [adding, setAdding]       = useState(false)

  // Rename modal state
  const [renameTarget, setRenameTarget] = useState(null) // { id, name }
  const [renameName, setRenameName]     = useState('')

  // Delete confirm state
  const [deleteTarget, setDeleteTarget] = useState(null) // { id, name }

  async function handleAdd() {
    if (!name.trim() || !url.trim()) return
    setAdding(true)
    await addModule(name.trim(), url.trim())
    setAdding(false)
    setName(''); setUrl(''); setAddOpen(false)
  }

  function openRename(mod) {
    setRenameTarget(mod)
    setRenameName(mod.name)
  }

  function confirmRename() {
    if (!renameName.trim()) return
    renameModule(renameTarget.id, renameName.trim())
    setRenameTarget(null)
  }

  function confirmDelete() {
    removeModule(deleteTarget.id)
    setDeleteTarget(null)
  }

  return (
    <div className={styles.page}>
      <div className={styles.topbar}>
        <div>
          <div className={styles.title}>모듈 관리</div>
          <div className={styles.sub}>각 서비스의 Swagger URL을 등록하세요</div>
        </div>
        <Button variant="primary" size="sm" onClick={() => setAddOpen(true)}>
          <PlusIcon /> 모듈 추가
        </Button>
      </div>

      <div className={styles.content}>
        <div className={styles.grid}>
          {modules.map(mod => (
            <ModuleCard
              key={mod.id}
              mod={mod}
              onRefresh={() => refreshModule(mod.id)}
              onRename={() => openRename(mod)}
              onDelete={() => setDeleteTarget(mod)}
              onAddAuth={() => addModuleAuth(mod.id)}
              onRemoveAuth={(idx) => removeModuleAuth(mod.id, idx)}
              onUpdateAuth={(idx, field, val) => updateModuleAuth(mod.id, idx, field, val)}
            />
          ))}
          <div className={styles.add_card} onClick={() => setAddOpen(true)}>
            <PlusIcon size={18} />
            <span>모듈 추가</span>
          </div>
        </div>
      </div>

      {/* 모듈 추가 모달 */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="모듈 추가">
        <FormGroup label="모듈 이름">
          <Input value={name} onChange={e => setName(e.target.value)}
            placeholder="예: user-service" autoFocus />
        </FormGroup>
        <FormGroup label="Swagger Base URL">
          <Input value={url} onChange={e => setUrl(e.target.value)}
            placeholder="예: http://localhost:8081"
            onKeyDown={e => e.key === 'Enter' && handleAdd()} />
        </FormGroup>
        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <Button style={{ flex: 1 }} onClick={() => setAddOpen(false)}>취소</Button>
          <Button variant="primary" style={{ flex: 1 }} onClick={handleAdd} disabled={adding}>
            {adding ? '불러오는 중...' : '추가'}
          </Button>
        </div>
      </Modal>

      {/* 이름 변경 모달 */}
      <Modal open={!!renameTarget} onClose={() => setRenameTarget(null)} title="모듈 이름 변경">
        <FormGroup label="새 이름">
          <Input value={renameName} onChange={e => setRenameName(e.target.value)}
            autoFocus onKeyDown={e => e.key === 'Enter' && confirmRename()} />
        </FormGroup>
        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <Button style={{ flex: 1 }} onClick={() => setRenameTarget(null)}>취소</Button>
          <Button variant="primary" style={{ flex: 1 }} onClick={confirmRename}
            disabled={!renameName.trim()}>변경</Button>
        </div>
      </Modal>

      {/* 삭제 확인 모달 */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="모듈 삭제">
        <p style={{ fontSize: 13, color: 'var(--text2)', margin: '4px 0 20px', lineHeight: 1.6 }}>
          <strong style={{ color: 'var(--text)' }}>{deleteTarget?.name}</strong> 모듈을 삭제하시겠습니까?<br />
          <span style={{ color: 'var(--text3)', fontSize: 12 }}>
            이 모듈을 사용하는 플로우 스텝은 실행 시 오류가 발생할 수 있습니다.
          </span>
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <Button style={{ flex: 1 }} onClick={() => setDeleteTarget(null)}>취소</Button>
          <Button variant="danger" style={{ flex: 1 }} onClick={confirmDelete}>삭제</Button>
        </div>
      </Modal>
    </div>
  )
}

function ModuleCard({ mod, onRefresh, onRename, onDelete, onAddAuth, onRemoveAuth, onUpdateAuth }) {
  const [authOpen, setAuthOpen]   = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const auths = mod.auths || []

  async function handleRefresh() {
    setRefreshing(true)
    await onRefresh()
    setRefreshing(false)
  }

  return (
    <div className={styles.card}>
      <div className={styles.card_header}>
        <div className={styles.dot} style={{
          background: mod.status === 'ok' ? 'var(--green)'
            : mod.status === 'loading' ? 'var(--yellow, #f5a623)' : 'var(--red)'
        }} />
        <span className={styles.card_name}>{mod.name}</span>
        <span className={styles.status_badge} data-ok={mod.status === 'ok'}>
          {mod.status === 'ok' ? 'connected' : mod.status === 'loading' ? 'loading...' : 'error'}
        </span>
        <div className={styles.card_actions}>
          <button className={styles.icon_btn} onClick={handleRefresh} disabled={refreshing}
            title="Swagger 재로드 및 인증 재감지">
            <RefreshIcon spinning={refreshing || mod.status === 'loading'} />
          </button>
          <button className={styles.icon_btn} onClick={onRename} title="이름 변경">
            <EditIcon />
          </button>
          <button className={[styles.icon_btn, styles.icon_btn_danger].join(' ')} onClick={onDelete} title="모듈 삭제">
            <TrashIcon />
          </button>
        </div>
      </div>
      <div className={styles.card_url}>{mod.url}</div>

      {/* Auth headers section */}
      <div className={styles.auth_section}>
        <button className={styles.auth_toggle} onClick={() => setAuthOpen(o => !o)}>
          <LockIcon />
          <span>고정 인증 헤더</span>
          {auths.filter(a => a.key && a.val).length > 0 && (
            <span className={styles.auth_badge}>{auths.filter(a => a.key && a.val).length}개 적용됨</span>
          )}
          <span className={styles.auth_chevron}>{authOpen ? '▲' : '▼'}</span>
        </button>
        {authOpen && (
          <div className={styles.auth_body}>
            <div className={styles.auth_hint}>플로우 실행 시 이 모듈의 모든 요청에 자동으로 포함됩니다</div>
            {auths.map((a, i) => (
              <div key={i} className={styles.auth_row}>
                <input className={styles.auth_key} value={a.key}
                  placeholder="헤더명 (예: Authorization)"
                  onChange={e => onUpdateAuth(i, 'key', e.target.value)} />
                <input
                  className={[styles.auth_val, !a.val && a.hint ? styles.auth_val_empty : ''].join(' ')}
                  value={a.val}
                  placeholder={a.hint ? `${a.hint} <값 입력>` : '값 (예: Bearer token...)'}
                  onChange={e => onUpdateAuth(i, 'val', e.target.value)} />
                {a.hint && !a.val && <span className={styles.auth_auto_badge}>자동감지</span>}
                <button className={styles.auth_remove} onClick={() => onRemoveAuth(i)}>×</button>
              </div>
            ))}
            <button className={styles.auth_add} onClick={onAddAuth}>+ 헤더 추가</button>
          </div>
        )}
      </div>

      <div className={styles.api_list}>
        {mod.apis.map(api => (
          <div key={api.id} className={styles.api_row}>
            <MethodBadge method={api.method} />
            <span className={styles.api_path}>{api.path}</span>
          </div>
        ))}
        {mod.apis.length === 0 && <div className={styles.api_empty}>등록된 API 없음</div>}
      </div>
    </div>
  )
}

function LockIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  )
}
function RefreshIcon({ spinning }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
      style={{ animation: spinning ? 'spin 0.8s linear infinite' : 'none' }}>
      <polyline points="23 4 23 10 17 10"/>
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </svg>
  )
}
function EditIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  )
}
function TrashIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
      <path d="M10 11v6M14 11v6"/>
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
    </svg>
  )
}
function PlusIcon({ size = 12 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}
