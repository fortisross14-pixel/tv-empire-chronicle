import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { Sheet } from './Sheet';

interface Ask {
  title: string;
  text: string;
  confirm: string;
  danger?: boolean;
}

type AskFn = (ask: Ask) => Promise<boolean>;

const ConfirmContext = createContext<AskFn>(() => Promise.resolve(false));

/** In-game confirmation sheet instead of the browser's native confirm() dialog. */
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<(Ask & { resolve: (ok: boolean) => void }) | null>(null);
  const ask = useCallback<AskFn>((a) => new Promise((resolve) => setPending({ ...a, resolve })), []);
  const close = (ok: boolean) => {
    pending?.resolve(ok);
    setPending(null);
  };
  return (
    <ConfirmContext.Provider value={ask}>
      {children}
      {pending && (
        <Sheet title={pending.title} onClose={() => close(false)}
          footer={<>
            <button className="btn ghost" onClick={() => close(false)}>Keep it</button>
            <button className={pending.danger ? 'btn danger-solid' : 'btn primary'} onClick={() => close(true)}>{pending.confirm}</button>
          </>}>
          <p>{pending.text}</p>
        </Sheet>
      )}
    </ConfirmContext.Provider>
  );
}

export const useConfirm = () => useContext(ConfirmContext);
