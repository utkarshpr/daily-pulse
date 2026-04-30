import React, { useCallback, useState } from 'react';
import ConfirmDialog from '../components/ConfirmDialog';

export function useConfirm() {
  const [state, setState] = useState({ open: false });

  const confirm = useCallback((opts) => {
    return new Promise((resolve) => {
      setState({
        open: true,
        ...opts,
        onConfirm: () => {
          setState((s) => ({ ...s, open: false }));
          resolve(true);
        },
        onCancel: () => {
          setState((s) => ({ ...s, open: false }));
          resolve(false);
        },
      });
    });
  }, []);

  const dialog = (
    <ConfirmDialog
      open={state.open}
      title={state.title}
      message={state.message}
      confirmLabel={state.confirmLabel}
      tone={state.tone}
      onConfirm={state.onConfirm}
      onCancel={state.onCancel}
    />
  );

  return { confirm, dialog };
}
