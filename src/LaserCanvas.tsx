import type * as React from "react";

export type LaserCanvasProps = {
  /** wrapper(div) に付けるクラス */
  className?: string;
  /** canvas に付けるクラス */
  canvasClassName?: string;

  intensity?: number;
  dimBackground?: boolean;
} & Omit<React.CanvasHTMLAttributes<HTMLCanvasElement>, "className">;

export function LaserCanvas({
  className = "",
  canvasClassName = "",
  intensity = 1,
  dimBackground = true,
  ...canvasProps
}: LaserCanvasProps) {
  // TODO: canvasProps / intensity / dimBackground を使って描画ロジックを書く

  return (
    <div
      className={[
        "relative overflow-hidden rounded-xl",
        dimBackground ? "bg-black/80" : "bg-transparent",
        className,
      ].join(" ")}
    >
      <canvas
        {...canvasProps}
        className={["block h-full w-full", canvasClassName].join(" ")}
      />
    </div>
  );
}
