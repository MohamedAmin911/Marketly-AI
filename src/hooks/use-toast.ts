"use client";

import { useCallback, useState } from "react";

type Toast = {
  id: number;
  title: string;
  description?: string;
};

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((toastInput: Omit<Toast, "id">) => {
    const id = Date.now();
    setToasts((items) => [...items, { ...toastInput, id }]);
    window.setTimeout(() => setToasts((items) => items.filter((item) => item.id !== id)), 3200);
  }, []);

  return { toasts, toast };
}
