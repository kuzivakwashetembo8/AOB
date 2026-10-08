import { forwardRef } from "react";

export const GameCanvasHost = forwardRef<HTMLCanvasElement>(function GameCanvasHost(_, ref) {
  return (
    <canvas
      ref={ref}
      className="canvas-host"
      aria-label="GTD 3D game world"
      tabIndex={0}
    />
  );
});
