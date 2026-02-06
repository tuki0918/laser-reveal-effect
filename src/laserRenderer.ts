export type LaserRenderParams = {
  ctx: CanvasRenderingContext2D;
  laserX: number;
  laserY: number;
  laserSize: number;
  blockTop: number;
  blockHeight: number;
};

export function renderLaser({
  ctx,
  laserX,
  laserY,
  laserSize,
  blockTop,
  blockHeight,
}: LaserRenderParams) {
  const jitter = (Math.random() - 0.5) * 2;
  const coreWidth = Math.max(2, laserSize * 0.25);
  const glowWidth = laserSize * 1.4;

  ctx.save();
  ctx.globalCompositeOperation = "lighter";

  const glowGradient = ctx.createLinearGradient(
    laserX - glowWidth / 2,
    0,
    laserX + glowWidth / 2,
    0,
  );
  glowGradient.addColorStop(0, "rgba(255, 255, 255, 0)");
  glowGradient.addColorStop(0.5, "rgba(255, 230, 190, 0.35)");
  glowGradient.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.fillStyle = glowGradient;
  ctx.fillRect(laserX - glowWidth / 2, blockTop, glowWidth, blockHeight);

  const coreGradient = ctx.createLinearGradient(
    laserX - coreWidth / 2,
    0,
    laserX + coreWidth / 2,
    0,
  );
  coreGradient.addColorStop(0, "rgba(255, 255, 255, 0)");
  coreGradient.addColorStop(0.5, "rgba(255, 255, 255, 0.95)");
  coreGradient.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.fillStyle = coreGradient;
  ctx.fillRect(laserX - coreWidth / 2, blockTop, coreWidth, blockHeight);

  ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
  ctx.fillRect(laserX - laserSize / 2, laserY + jitter, laserSize, laserSize);

  ctx.restore();
}
