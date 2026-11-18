import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { LogOut, Palette, X, Check } from 'lucide-react'
import { useTheme } from '@/hooks/useTheme'
import useUser from '@/hooks/useUser'
import { cn } from '@/lib/utils'

// ─── Avatar catalog ───────────────────────────────────────────────────────────
export type AvatarDef = { id: string; emoji: string; bg: string; label: string }

const AVATARS_GENERIC: AvatarDef[] = [
  { id: 'smile',     emoji: '😊', bg: '#6366f1', label: 'Sorridente'  },
  { id: 'cool',      emoji: '😎', bg: '#0ea5e9', label: 'Cool'        },
  { id: 'nerd',      emoji: '🤓', bg: '#10b981', label: 'Nerd'        },
  { id: 'ninja',     emoji: '🥷', bg: '#374151', label: 'Ninja'       },
  { id: 'cowboy',    emoji: '🤠', bg: '#d97706', label: 'Cowboy'      },
  { id: 'robot',     emoji: '🤖', bg: '#3b82f6', label: 'Robô'        },
  { id: 'alien',     emoji: '👽', bg: '#84cc16', label: 'Alien'       },
  { id: 'ghost',     emoji: '👻', bg: '#a855f7', label: 'Fantasma'    },
  { id: 'cat',       emoji: '🐱', bg: '#f59e0b', label: 'Gato'        },
  { id: 'fox',       emoji: '🦊', bg: '#ea580c', label: 'Raposa'      },
  { id: 'wolf',      emoji: '🐺', bg: '#6b7280', label: 'Lobo'        },
  { id: 'lion',      emoji: '🦁', bg: '#ca8a04', label: 'Leão'        },
]

const AVATARS_CHARACTERS: AvatarDef[] = [
  { id: 'wizard',    emoji: '🧙‍♂️', bg: '#7c3aed', label: 'Mago'         },
  { id: 'elf',       emoji: '🧝‍♀️', bg: '#059669', label: 'Elfa'         },
  { id: 'vampire',   emoji: '🧛', bg: '#dc2626', label: 'Vampiro'      },
  { id: 'zombie',    emoji: '🧟', bg: '#65a30d', label: 'Zumbi'        },
  { id: 'hero',      emoji: '🦸', bg: '#2563eb', label: 'Herói'        },
  { id: 'villain',   emoji: '🦹', bg: '#7f1d1d', label: 'Vilão'        },
  { id: 'astronaut', emoji: '👨‍🚀', bg: '#0c4a6e', label: 'Astronauta'  },
  { id: 'detective', emoji: '🕵️', bg: '#1e293b', label: 'Detetive'    },
  { id: 'king',      emoji: '🤴', bg: '#92400e', label: 'Rei'          },
  { id: 'princess',  emoji: '👸', bg: '#be185d', label: 'Princesa'     },
  { id: 'dragon',    emoji: '🐉', bg: '#b91c1c', label: 'Dragão'       },
  { id: 'pirate',    emoji: '🏴‍☠️', bg: '#18181b', label: 'Pirata'       },
  { id: 'samurai',   emoji: '⚔️', bg: '#991b1b', label: 'Samurai'      },
  { id: 'witch',     emoji: '🧙‍♀️', bg: '#4c1d95', label: 'Bruxa'        },
  { id: 'mermaid',   emoji: '🧜‍♀️', bg: '#0369a1', label: 'Sereia'       },
  { id: 'unicorn',   emoji: '🦄', bg: '#db2777', label: 'Unicórnio'    },
]

export const ALL_AVATARS = [...AVATARS_GENERIC, ...AVATARS_CHARACTERS]

export function getAvatarDef(id?: string | null): AvatarDef {
  return ALL_AVATARS.find(a => a.id === id) ?? AVATARS_GENERIC[0]
}

// ─── Avatar bubble ────────────────────────────────────────────────────────────
export function AvatarBubble({ avatarId, size = 'md', className }: { avatarId?: string | null; size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const av = getAvatarDef(avatarId)
  const sizeClass = size === 'sm' ? 'h-7 w-7 text-base' : size === 'lg' ? 'h-14 w-14 text-3xl' : 'h-9 w-9 text-xl'
  return (
    <div
      className={cn('rounded-full flex items-center justify-center shrink-0 select-none', sizeClass, className)}
      style={{ background: av.bg }}
      title={av.label}
    >
      <span role="img" aria-label={av.label} className="leading-none">{av.emoji}</span>
    </div>
  )
}

// ─── Avatar Picker ────────────────────────────────────────────────────────────
function AvatarPicker({ currentId, onSelect, onClose }: { currentId?: string | null; onSelect: (id: string) => void; onClose: () => void }) {
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative z-10 bg-background rounded-2xl shadow-2xl border border-border/60 w-full max-w-sm flex flex-col"
        style={{ maxHeight: 'min(90vh, 560px)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
          <h3 className="font-semibold text-base">Escolher avatar</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-4">
          <Section title="Genéricos" avatars={AVATARS_GENERIC} currentId={currentId} onSelect={onSelect} />
          <Section title="Personagens" avatars={AVATARS_CHARACTERS} currentId={currentId} onSelect={onSelect} />
        </div>
      </div>
    </div>,
    document.body
  )
}

function Section({ title, avatars, currentId, onSelect }: { title: string; avatars: AvatarDef[]; currentId?: string | null; onSelect: (id: string) => void }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-2">{title}</p>
      <div className="grid grid-cols-6 gap-2">
        {avatars.map(av => (
          <button
            key={av.id}
            onClick={() => onSelect(av.id)}
            title={av.label}
            className={cn(
              'relative flex flex-col items-center gap-1 rounded-xl p-1.5 transition-all hover:scale-105',
              currentId === av.id ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : 'hover:bg-muted'
            )}
          >
            <div className="h-10 w-10 rounded-full flex items-center justify-center text-xl" style={{ background: av.bg }}>
              <span role="img" aria-label={av.label}>{av.emoji}</span>
            </div>
            {currentId === av.id && (
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                <Check className="h-2.5 w-2.5 text-primary-foreground" />
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Profile Dropdown ─────────────────────────────────────────────────────────
export function UserProfileDropdown() {
  const { user, setUser, logout } = useUser()
  const { theme, customBackground, setTheme, setCustomBackground } = useTheme()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [appearanceOpen, setAppearanceOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  async function handleAvatarSelect(avatarId: string) {
    if (!user) return
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('easier_token') ?? ''}`,
        },
        body: JSON.stringify({ avatar: avatarId }),
      })
      if (res.ok) {
        const updated = await res.json()
        setUser({ ...user, avatar: updated.avatar })
        localStorage.setItem('easier_user', JSON.stringify({ ...user, avatar: updated.avatar }))
      }
    } catch { /* noop */ }
    finally {
      setPickerOpen(false)
    }
  }

  function handleLogout() {
    logout()
    setOpen(false)
    setAppearanceOpen(false)
    navigate('/login', { replace: true })
  }

  if (!user) return null

  return (
    <>
      <div ref={ref} className="relative">
        <button
          onClick={() => setOpen(v => !v)}
          className="relative rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-transform hover:scale-105 active:scale-95"
          aria-label="Perfil do usuário"
        >
          <AvatarBubble avatarId={user.avatar} size="md" />
          <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-background" />
        </button>

        {open && (
          <div className="absolute right-0 top-12 w-64 bg-background border border-border/60 rounded-2xl shadow-xl z-50 overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-4 border-b border-border/60">
              <div className="relative shrink-0">
                <AvatarBubble avatarId={user.avatar} size="lg" />
                <button
                  onClick={() => { setPickerOpen(true); setOpen(false) }}
                  className="absolute inset-0 rounded-full bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                  title="Trocar avatar"
                >
                  <Palette className="h-4 w-4 text-white" />
                </button>
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
            </div>

            <div className="p-2 space-y-2">
              <button
                onClick={() => {
                  setAppearanceOpen(true)
                  setOpen(false)
                }}
                className="w-full flex items-center gap-2 rounded-lg border border-border/60 bg-muted/10 px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                <Palette className="h-4 w-4" />
                Aparência
              </button>

              <div className="border-t border-border/60 pt-2">
                <MenuItem
                  icon={<LogOut className="h-4 w-4" />}
                  label="Sair"
                  onClick={handleLogout}
                  danger
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {appearanceOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onClick={() => setAppearanceOpen(false)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div
            className="relative z-10 w-full max-w-xl rounded-2xl border border-border/70 bg-background shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border/70 px-5 py-4">
              <div className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                <h3 className="text-lg font-semibold">Aparência</h3>
              </div>
              <button onClick={() => setAppearanceOpen(false)} className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-5 p-5">
              <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
                <button
                  onClick={() => { setPickerOpen(true); setAppearanceOpen(false) }}
                  className="flex w-full items-center justify-between rounded-lg border border-border bg-background/40 px-3 py-2.5 text-left text-sm text-foreground hover:bg-muted transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    Trocar avatar
                  </span>
                  <span className="text-xs text-muted-foreground">Selecionar</span>
                </button>
              </div>

              <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Tema</p>
                <div className="grid grid-cols-3 gap-2">
                  {(['light', 'dark', 'custom'] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setTheme(mode)}
                      className={cn(
                        'rounded-lg border px-2 py-2 text-sm font-medium transition-colors',
                        theme === mode
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border text-muted-foreground hover:bg-muted'
                      )}
                    >
                      {mode === 'light' ? 'Claro' : mode === 'dark' ? 'Escuro' : 'Personalizado'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Cor de fundo</label>
                  <span className="text-xs text-muted-foreground uppercase tracking-wide">{customBackground}</span>
                </div>

                <div className="flex items-center gap-3 rounded-lg border border-border bg-background/40 px-3 py-2.5">
                  <input
                    type="color"
                    value={customBackground}
                    onChange={(e) => {
                      const nextColor = e.target.value
                      setCustomBackground(nextColor)
                      if (theme !== 'custom') {
                        setTheme('custom')
                      }
                    }}
                    className="h-10 w-12 cursor-pointer rounded border-0 bg-transparent p-0"
                    aria-label="Cor de fundo personalizada"
                  />
                  <div
                    className="h-8 flex-1 rounded-md border border-border"
                    style={{ background: customBackground }}
                    aria-label="Preview da cor de fundo"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-border/70 px-5 py-4">
              <button
                type="button"
                onClick={() => setAppearanceOpen(false)}
                className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-muted"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  setAppearanceOpen(false)
                  setOpen(false)
                }}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {pickerOpen && (
        <AvatarPicker
          currentId={user.avatar}
          onSelect={handleAvatarSelect}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </>
  )
}

function MenuItem({ icon, label, onClick, danger = false }: { icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
        danger
          ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}
