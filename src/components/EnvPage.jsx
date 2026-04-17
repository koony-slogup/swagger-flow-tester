import { useState } from 'react'
import { useStore } from '../store'
import { Button, FormGroup, Input } from './ui'
import styles from './EnvPage.module.css'

export default function EnvPage() {
  const {
    envs, activeEnvId,
    addEnv, removeEnv, renameEnv, setActiveEnv,
    addEnvVar, removeEnvVar, updateEnvVar,
  } = useStore()

  const [newEnvName, setNewEnvName] = useState('')
  const [editingEnvId, setEditingEnvId] = useState(null)
  const [editingName, setEditingName] = useState('')

  const selectedEnv = envs.find(e => e.id === (editingEnvId || activeEnvId)) ?? envs[0] ?? null

  function handleAddEnv() {
    const name = newEnvName.trim()
    if (!name) return
    addEnv(name)
    setNewEnvName('')
  }

  function startRenaming(env) {
    setEditingName(env.name)
    setEditingEnvId(env.id + '_rename')
  }

  function commitRename(env) {
    const name = editingName.trim()
    if (name && name !== env.name) renameEnv(env.id, name)
    setEditingEnvId(null)
  }

  return (
    <div className={styles.page}>
      <div className={styles.topbar}>
        <div>
          <div className={styles.title}>환경변수</div>
          <div className={styles.sub}>모듈 URL에 <code>{'{{API_HOST}}'}</code> 형식으로 사용하세요</div>
        </div>
      </div>

      <div className={styles.body}>
        {/* Left: environment list */}
        <div className={styles.env_list}>
          <div className={styles.section_title}>환경 목록</div>

          {envs.length === 0 && (
            <div className={styles.empty}>환경이 없습니다</div>
          )}

          {envs.map(env => (
            <div
              key={env.id}
              className={[styles.env_item, (selectedEnv?.id === env.id) ? styles.env_item_active : ''].join(' ')}
              onClick={() => { setEditingEnvId(null); setActiveEnv(env.id) }}
            >
              {editingEnvId === env.id + '_rename' ? (
                <input
                  className={styles.rename_input}
                  value={editingName}
                  onChange={e => setEditingName(e.target.value)}
                  onBlur={() => commitRename(env)}
                  onKeyDown={e => { if (e.key === 'Enter') commitRename(env); if (e.key === 'Escape') setEditingEnvId(null) }}
                  autoFocus
                  onClick={e => e.stopPropagation()}
                />
              ) : (
                <span className={styles.env_name}>{env.name}</span>
              )}

              <div className={styles.env_actions}>
                {activeEnvId === env.id && (
                  <span className={styles.active_badge}>활성</span>
                )}
                <button
                  className={styles.icon_btn}
                  title="이름 변경"
                  onClick={e => { e.stopPropagation(); startRenaming(env) }}
                >✎</button>
                <button
                  className={styles.icon_btn_danger}
                  title="삭제"
                  onClick={e => { e.stopPropagation(); if (window.confirm(`"${env.name}" 환경을 삭제할까요?`)) removeEnv(env.id) }}
                >✕</button>
              </div>
            </div>
          ))}

          <div className={styles.add_env_row}>
            <input
              className={styles.add_env_input}
              value={newEnvName}
              onChange={e => setNewEnvName(e.target.value)}
              placeholder="새 환경 이름..."
              onKeyDown={e => e.key === 'Enter' && handleAddEnv()}
            />
            <Button size="sm" variant="primary" onClick={handleAddEnv} disabled={!newEnvName.trim()}>추가</Button>
          </div>
        </div>

        {/* Right: variable editor */}
        <div className={styles.var_panel}>
          {!selectedEnv ? (
            <div className={styles.empty_panel}>왼쪽에서 환경을 선택하거나 추가하세요</div>
          ) : (
            <>
              <div className={styles.var_header}>
                <div className={styles.section_title}>{selectedEnv.name} · 변수</div>
                <Button size="sm" onClick={() => addEnvVar(selectedEnv.id)}>+ 변수 추가</Button>
              </div>

              {(selectedEnv.vars || []).length === 0 ? (
                <div className={styles.empty}>변수가 없습니다. 변수 추가 버튼을 눌러 시작하세요.</div>
              ) : (
                <div className={styles.var_table}>
                  <div className={styles.var_row_header}>
                    <span>변수명</span>
                    <span>값</span>
                    <span />
                  </div>
                  {(selectedEnv.vars || []).map((v, i) => (
                    <div key={i} className={styles.var_row}>
                      <Input
                        value={v.key}
                        onChange={e => updateEnvVar(selectedEnv.id, i, 'key', e.target.value)}
                        placeholder="API_HOST"
                        style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}
                      />
                      <Input
                        value={v.val}
                        onChange={e => updateEnvVar(selectedEnv.id, i, 'val', e.target.value)}
                        placeholder="값"
                        style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}
                      />
                      <button
                        className={styles.remove_var_btn}
                        onClick={() => removeEnvVar(selectedEnv.id, i)}
                        title="삭제"
                      >✕</button>
                    </div>
                  ))}
                </div>
              )}

              <div className={styles.usage_hint}>
                <div className={styles.usage_title}>사용법</div>
                <div className={styles.usage_body}>
                  <p>모듈 URL에 <code>{'{{API_HOST}}'}</code>을 사용하세요.</p>
                  <p>예시: <code>{'http://{{API_HOST}}/api'}</code></p>
                  <p>활성 환경의 변수가 실행 시 자동으로 치환됩니다.</p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
