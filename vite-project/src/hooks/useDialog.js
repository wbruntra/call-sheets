import { useState, useCallback } from 'react';

/**
 * Promise-based modal dialogs to replace alert/confirm/prompt.
 *
 * showAlert({ title?, message })              → Promise<void>
 * showConfirm({ title?, message, confirmLabel?, cancelLabel? }) → Promise<boolean>
 * showPasswordPrompt({ title?, message })     → Promise<string|null>
 */
export function useDialog() {
  const [dialog, setDialog] = useState(null);

  const showAlert = useCallback(({ title, message }) =>
    new Promise((resolve) => {
      setDialog({ type: 'alert', title, message, resolve });
    }), []);

  const showConfirm = useCallback(({ title, message, confirmLabel = 'OK', cancelLabel = 'Cancel' }) =>
    new Promise((resolve) => {
      setDialog({ type: 'confirm', title, message, confirmLabel, cancelLabel, resolve });
    }), []);

  const showPasswordPrompt = useCallback(({ title, message }) =>
    new Promise((resolve) => {
      setDialog({ type: 'password', title, message, resolve });
    }), []);

  const closeDialog = useCallback((result) => {
    setDialog(d => { d?.resolve(result); return null; });
  }, []);

  return { dialog, showAlert, showConfirm, showPasswordPrompt, closeDialog };
}
