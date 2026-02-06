import type React from "react";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from "react";
import type { LaserOptions } from "./engine";
import { useLaserEffect } from "./useLaserEffect";

export type LaserCanvasHandle = {
  start: () => void;
  pause: () => void;
  reset: () => void;
  draw: () => void;
  setOptions: (next: Partial<LaserOptions>) => void;
  setImage: (next: CanvasImageSource) => void;
};

export type LaserCanvasOptions = LaserOptions;

export type LaserCanvasProps = Omit<
  React.CanvasHTMLAttributes<HTMLCanvasElement>,
  "children"
> & {
  image?: CanvasImageSource | null;
  imageSrc?: string;
  options?: Partial<LaserCanvasOptions>;
  autoStart?: boolean;
  crossOrigin?: HTMLImageElement["crossOrigin"];
};

export const LaserCanvas = forwardRef<LaserCanvasHandle, LaserCanvasProps>(
  function LaserCanvas(
    { image, imageSrc, options, autoStart = true, crossOrigin, ...rest },
    ref,
  ) {
    const [canvasEl, setCanvasEl] = useState<HTMLCanvasElement | null>(null);
    const api = useLaserEffect({
      canvas: canvasEl,
      image,
      imageSrc,
      options,
      autoStart,
      crossOrigin,
    });

    useImperativeHandle(ref, () => api, [api]);

    const canvasRef = useMemo(() => setCanvasEl, []);

    useEffect(() => {
      if (!canvasEl) return;
      if (rest.width || rest.height) return;
      canvasEl.width = 1;
      canvasEl.height = 1;
    }, [canvasEl, rest.width, rest.height]);

    return <canvas ref={canvasRef} {...rest} />;
  },
);
