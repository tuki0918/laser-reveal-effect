import { useEffect, useMemo, useRef } from "react";
import {
  createLaserEngine,
  type LaserEngine,
  type LaserOptions,
} from "./engine";

export type UseLaserEffectParams = {
  canvas: HTMLCanvasElement | null;
  image?: CanvasImageSource | null;
  imageSrc?: string;
  options?: Partial<LaserOptions>;
  autoStart?: boolean;
  crossOrigin?: HTMLImageElement["crossOrigin"];
};

export function useLaserEffect({
  canvas,
  image,
  imageSrc,
  options,
  autoStart = true,
  crossOrigin = "anonymous",
}: UseLaserEffectParams) {
  const engineRef = useRef<LaserEngine | null>(null);
  const optionsRef = useRef<Partial<LaserOptions> | undefined>(options);
  const lastOptionsRef = useRef<Partial<LaserOptions> | undefined>(options);
  optionsRef.current = options;

  useEffect(() => {
    if (!canvas) return;
    if (!engineRef.current) {
      engineRef.current = createLaserEngine(canvas, optionsRef.current);
    }
    return () => {
      engineRef.current?.destroy();
      engineRef.current = null;
    };
  }, [canvas]);

  useEffect(() => {
    if (!engineRef.current || !options) return;
    if (lastOptionsRef.current !== options) {
      engineRef.current.setOptions(options);
      lastOptionsRef.current = options;
    }
  }, [options]);

  useEffect(() => {
    if (!canvas || !engineRef.current || !image) return;
    engineRef.current.setImage(image);
    if (autoStart) {
      engineRef.current.start();
    }
  }, [image, autoStart, canvas]);

  useEffect(() => {
    if (!canvas || !engineRef.current || !imageSrc) return;
    const img = new Image();
    img.crossOrigin = crossOrigin;
    img.onload = () => {
      engineRef.current?.setImage(img);
      if (autoStart) {
        engineRef.current?.start();
      }
    };
    img.src = imageSrc;
  }, [imageSrc, autoStart, crossOrigin, canvas]);

  return useMemo(() => {
    return {
      start: () => engineRef.current?.start(),
      pause: () => engineRef.current?.pause(),
      reset: () => engineRef.current?.reset(),
      draw: () => engineRef.current?.draw(),
      setOptions: (next: Partial<LaserOptions>) =>
        engineRef.current?.setOptions(next),
      setImage: (next: CanvasImageSource) => engineRef.current?.setImage(next),
    };
  }, []);
}
