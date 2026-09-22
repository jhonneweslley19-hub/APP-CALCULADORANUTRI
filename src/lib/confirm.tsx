import { createContext, useCallback, useContext, useState } from 'react'
import type { ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'
import Button from '../components/ui/Button'

interface ConfirmOptions {
  title: string
  description?: string
  confirmLabel?: string
  danger?: boolean
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>

const ConfirmContext = createContext<ConfirmFn | null>(null)

interface PendingConfirm extends ConfirmOptions {
  resolve: (value: boolean) => void
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingConfirm | null>(null)

  const confirm = useCallback<ConfirmFn>((options) => {
    return new Promise((resolve) => {
      setPending({ ...options, resolve })
    })
  }, [])

  function respond(value: boolean) {
    pending?.resolve(value)
    setPending(null)
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {pending && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-4 z-[110]">
          <div className="bg-white rounded-xl shadow-popover max-w-sm w-full p-5">
            <div className="flex items-start gap-3">
              <div
                className={`size-9 rounded-full flex items-center justify-center shrink-0 ${
                  pending.danger ? 'bg-red-100 text-red-600' : 'bg-brand-100 text-brand-700'
                }`}
              >
                <AlertTriangle className="size-5" />
              </div>
              <div>
                <p className="font-semibold text-sm text-slate-800">{pending.title}</p>
                {pending.description && <p className="text-sm text-slate-500 mt-1">{pending.description}</p>}
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <Button variant="ghost" size="sm" onClick={() => respond(false)}>
                Cancelar
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => respond(true)}
                className={pending.danger ? 'bg-red-600 hover:bg-red-700' : ''}
              >
                {pending.confirmLabel ?? 'Confirmar'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  )
}

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error('useConfirm must be used within a ConfirmProvider')
  return ctx
}
