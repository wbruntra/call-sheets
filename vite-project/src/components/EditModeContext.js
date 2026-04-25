import { createContext, useContext, useState, useEffect } from 'react';

export const EditModeContext = createContext({ editing: true, isMobile: false });

export function useEditMode() {
  return useContext(EditModeContext);
}

export function useIsMobile(breakpoint = 860) {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < breakpoint : false
  );

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [breakpoint]);

  return isMobile;
}