import { createContext, useContext } from 'react';

export const EditModeContext = createContext(true);

export function useEditMode() {
  return useContext(EditModeContext);
}