import { useEffect, useState } from "react";
import { Size } from "./figure";

export const useWindowSize = () => {
  const [size, setSize] = useState<Size>({ w: 0, h: 0 });
  useEffect(() => {
    setSize({ w: window.innerWidth, h: window.innerHeight });
  }, []);
  return size;
};
