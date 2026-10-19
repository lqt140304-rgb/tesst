import { createContext, useContext, useRef, type ReactNode } from 'react';
import { useIsPresent } from 'motion/react';
import { useLocation, useMatches, useOutlet } from 'react-router';

/** true while this subtree and every ancestor transition layer is present (not exiting). */
const LiveCtx = createContext(true);

export function TransitionScope({ children }: { children: ReactNode }) {
  const present = useIsPresent();
  const parentLive = useContext(LiveCtx);
  return <LiveCtx.Provider value={present && parentLive}>{children}</LiveCtx.Provider>;
}

/** Latest value while live; the last live value while any ancestor layer is exiting (no flash of the next page). */
function useFrozen<T>(value: T): T {
  const live = useContext(LiveCtx);
  const ref = useRef(value);
  // eslint-disable-next-line react-hooks/refs -- intentional render-time snapshot for freeze-on-exit
  if (live) ref.current = value;
  // eslint-disable-next-line react-hooks/refs
  return ref.current;
}

/** false while an ancestor transition layer is exiting: guards must not redirect from a leaving page. */
export const useLive = () => useContext(LiveCtx);

export const FrozenOutlet = () => useFrozen(useOutlet());
export const useStableLocation = () => useFrozen(useLocation());
export const useStableMatches = () => useFrozen(useMatches());
