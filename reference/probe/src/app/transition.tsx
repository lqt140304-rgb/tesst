import { createContext, useContext, useRef, type ReactNode } from 'react';
import { useIsPresent } from 'motion/react';
import { useLocation, useOutlet } from 'react-router';

/** true while this subtree and every ancestor transition layer is present (not exiting). */
const LiveCtx = createContext(true);
export function TransitionScope({ children }: { children: ReactNode }) {
  const present = useIsPresent();
  const parentLive = useContext(LiveCtx);
  return <LiveCtx.Provider value={present && parentLive}>{children}</LiveCtx.Provider>;
}
/** Returns the latest value while live; freezes the last live value while any ancestor layer is exiting. */
function useFrozen<T>(value: T): T {
  const live = useContext(LiveCtx);
  const ref = useRef(value);
  // eslint-disable-next-line react-hooks/refs -- intentional: freeze-on-exit needs a render-time snapshot
  if (live) ref.current = value;
  // eslint-disable-next-line react-hooks/refs
  return ref.current;
}
export function FrozenOutlet() { return useFrozen(useOutlet()); }
export function useStableLocation() { return useFrozen(useLocation()); }
