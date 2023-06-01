import { useEffect } from "react";

export const useKey = (key: string, handler: (e: KeyboardEvent) => void) => {
  const inHandler = (e: KeyboardEvent) => {
    if (e.key === key) {
      handler(e);
    }
  };
  useEffect(() => {
    document.addEventListener("keydown", inHandler);
    return () => document.removeEventListener("keydown", inHandler);
  });
};
