import { renderLaser } from "./laserRenderer";

export type OrderMode = "ltr" | "rtl" | "zigzag" | "random";

export type LaserOptions = {
  laserSize: number;
  durationMs: number;
  orderMode: OrderMode;
  backgroundColor: string;
  laserEnabled: boolean;
};

export type LaserEngine = {
  setImage: (image: CanvasImageSource) => void;
  setOptions: (next: Partial<LaserOptions>) => void;
  start: () => void;
  pause: () => void;
  reset: () => void;
  draw: () => void;
  destroy: () => void;
};

type GridMetrics = {
  cols: number;
  rows: number;
  colWidths: number[];
  rowHeights: number[];
  colOffsets: number[];
  rowOffsets: number[];
  order: Array<{ col: number; row: number }>;
};

type DistanceMetrics = {
  blockDistances: number[];
  cumulative: number[];
  totalDistance: number;
};

type Cache<T> = {
  key: string;
  value: T | null;
};

const defaultOptions: LaserOptions = {
  laserSize: 16,
  durationMs: 6000,
  orderMode: "ltr",
  backgroundColor: "transparent",
  laserEnabled: true,
};

function getImageSize(image: CanvasImageSource) {
  if (image instanceof HTMLImageElement) {
    return { width: image.naturalWidth, height: image.naturalHeight };
  }
  if (image instanceof HTMLVideoElement) {
    return { width: image.videoWidth, height: image.videoHeight };
  }
  const canvas = image as HTMLCanvasElement;
  return { width: canvas.width, height: canvas.height };
}

function buildOrder(rows: number, cols: number, mode: OrderMode) {
  const order: Array<{ col: number; row: number }> = [];

  for (let row = 0; row < rows; row += 1) {
    if (mode === "rtl") {
      for (let col = cols - 1; col >= 0; col -= 1) {
        order.push({ col, row });
      }
      continue;
    }

    if (mode === "zigzag") {
      const isEvenRow = row % 2 === 0;
      if (isEvenRow) {
        for (let col = 0; col < cols; col += 1) {
          order.push({ col, row });
        }
      } else {
        for (let col = cols - 1; col >= 0; col -= 1) {
          order.push({ col, row });
        }
      }
      continue;
    }

    for (let col = 0; col < cols; col += 1) {
      order.push({ col, row });
    }
  }

  if (mode === "random") {
    for (let i = order.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
  }

  return order;
}

function buildOffsets(sizes: number[]) {
  const offsets: number[] = [];
  sizes.reduce((acc, size) => {
    offsets.push(acc);
    return acc + size;
  }, 0);
  return offsets;
}

function buildCumulative(distances: number[]) {
  const cumulative: number[] = [];
  distances.reduce((acc, value) => {
    const next = acc + value;
    cumulative.push(next);
    return next;
  }, 0);
  return cumulative;
}

function findBlockAtDistance(cumulative: number[], distance: number) {
  let low = 0;
  let high = cumulative.length - 1;
  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    if (distance <= cumulative[mid]) {
      high = mid;
    } else {
      low = mid + 1;
    }
  }
  const index = low;
  const prev = index > 0 ? cumulative[index - 1] : 0;
  return { index, localX: distance - prev };
}

export function createLaserEngine(
  canvas: HTMLCanvasElement,
  initialOptions: Partial<LaserOptions> = {},
): LaserEngine {
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas 2D context is not available.");
  }
  const context: CanvasRenderingContext2D = ctx;

  let options: LaserOptions = { ...defaultOptions, ...initialOptions };
  let sourceCanvas: HTMLCanvasElement | null = null;
  let animationId: number | null = null;
  let running = false;

  let currentIndex = 0;
  let sweepX = 0;
  let lastTime = 0;
  let elapsedMs = 0;

  const gridCache: Cache<GridMetrics> = { key: "", value: null };
  const distanceCache: Cache<DistanceMetrics> = { key: "", value: null };

  function resetCaches() {
    gridCache.key = "";
    gridCache.value = null;
    distanceCache.key = "";
    distanceCache.value = null;
  }

  function setImage(image: CanvasImageSource) {
    const { width, height } = getImageSize(image);

    canvas.width = width;
    canvas.height = height;

    sourceCanvas = document.createElement("canvas");
    sourceCanvas.width = width;
    sourceCanvas.height = height;
    const sourceCtx = sourceCanvas.getContext("2d");
    if (!sourceCtx) return;
    sourceCtx.drawImage(image, 0, 0, width, height);

    reset();
    draw();
  }

  function setOptions(next: Partial<LaserOptions>) {
    options = { ...options, ...next };
    resetCaches();
    if (!running) {
      reset();
      draw();
    }
  }

  function reset() {
    currentIndex = 0;
    sweepX = 0;
    elapsedMs = 0;
    lastTime = 0;
    resetCaches();
    if (animationId !== null) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
    running = false;
  }

  function start() {
    if (!sourceCanvas || running) return;
    running = true;
    lastTime = 0;
    animationId = requestAnimationFrame(tick);
  }

  function pause() {
    running = false;
    lastTime = 0;
    if (animationId !== null) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
  }

  function destroy() {
    pause();
    sourceCanvas = null;
  }

  function getGridMetrics(): GridMetrics {
    if (!sourceCanvas) {
      return {
        cols: 0,
        rows: 0,
        colWidths: [],
        rowHeights: [],
        colOffsets: [],
        rowOffsets: [],
        order: [],
      };
    }

    const laserSize = Math.max(1, options.laserSize);
    const cols = Math.max(1, Math.ceil(canvas.width / laserSize));
    const rows = Math.max(1, Math.ceil(canvas.height / laserSize));
    const key = `${canvas.width}x${canvas.height}:${laserSize}:${options.orderMode}`;

    if (gridCache.value && gridCache.key === key) {
      return gridCache.value;
    }

    const colWidths = Array.from({ length: cols }, (_, i) =>
      i === cols - 1 ? canvas.width - laserSize * (cols - 1) : laserSize,
    );
    const rowHeights = Array.from({ length: rows }, (_, i) =>
      i === rows - 1 ? canvas.height - laserSize * (rows - 1) : laserSize,
    );

    const order = buildOrder(rows, cols, options.orderMode);
    const metrics: GridMetrics = {
      cols,
      rows,
      colWidths,
      rowHeights,
      colOffsets: buildOffsets(colWidths),
      rowOffsets: buildOffsets(rowHeights),
      order,
    };

    gridCache.key = key;
    gridCache.value = metrics;

    return metrics;
  }

  function getDistanceMetrics(metrics: GridMetrics): DistanceMetrics {
    const key = `${metrics.rows}x${metrics.cols}:${options.orderMode}`;
    if (distanceCache.value && distanceCache.key === key) {
      return distanceCache.value;
    }

    const blockDistances = metrics.order.map(
      (cell) => metrics.colWidths[cell.col],
    );
    const cumulative = buildCumulative(blockDistances);
    const totalDistance = cumulative.length
      ? cumulative[cumulative.length - 1]
      : 0;

    const distances: DistanceMetrics = {
      blockDistances,
      cumulative,
      totalDistance,
    };

    distanceCache.key = key;
    distanceCache.value = distances;

    return distances;
  }

  function drawBackground() {
    context.fillStyle = options.backgroundColor;
    context.fillRect(0, 0, canvas.width, canvas.height);
  }

  function drawCompletedBlocks(metrics: GridMetrics) {
    if (!sourceCanvas) return;
    for (let i = 0; i < currentIndex; i += 1) {
      const cell = metrics.order[i];
      if (!cell) continue;
      const sx = metrics.colOffsets[cell.col];
      const sy = metrics.rowOffsets[cell.row];
      const blockWidth = metrics.colWidths[cell.col];
      const blockHeight = metrics.rowHeights[cell.row];
      context.drawImage(
        sourceCanvas,
        sx,
        sy,
        blockWidth,
        blockHeight,
        sx,
        sy,
        blockWidth,
        blockHeight,
      );
    }
  }

  function drawCurrentBlock(metrics: GridMetrics) {
    if (!sourceCanvas) return;
    if (currentIndex >= metrics.order.length) return;
    const cell = metrics.order[currentIndex];
    if (!cell) return;

    const sx = metrics.colOffsets[cell.col];
    const sy = metrics.rowOffsets[cell.row];
    const blockWidth = metrics.colWidths[cell.col];
    const blockHeight = metrics.rowHeights[cell.row];
    const revealWidth = Math.min(sweepX, blockWidth);
    const showLaser = options.laserEnabled && options.orderMode !== "random";

    if (revealWidth > 0) {
      context.drawImage(
        sourceCanvas,
        sx,
        sy,
        revealWidth,
        blockHeight,
        sx,
        sy,
        revealWidth,
        blockHeight,
      );
    }

    if (showLaser && revealWidth > 0 && revealWidth < blockWidth) {
      const laserSize = options.laserSize;
      const laserX = sx + revealWidth;
      const laserY = sy + (blockHeight - laserSize) / 2;

      renderLaser({
        ctx: context,
        laserX,
        laserY,
        laserSize,
        blockTop: sy,
        blockHeight,
      });
    }
  }

  function draw() {
    if (!sourceCanvas) return;
    const metrics = getGridMetrics();
    drawBackground();
    drawCompletedBlocks(metrics);
    drawCurrentBlock(metrics);
    if (currentIndex >= metrics.order.length) {
      context.drawImage(sourceCanvas, 0, 0);
    }
  }

  function tick(timestamp: number) {
    if (!running || !sourceCanvas) return;

    const metrics = getGridMetrics();
    const distanceMetrics = getDistanceMetrics(metrics);
    const { cumulative, totalDistance } = distanceMetrics;

    if (!lastTime) lastTime = timestamp;
    const dt = Math.max(0, (timestamp - lastTime) / 1000);
    lastTime = timestamp;

    const durationMs = Math.max(50, options.durationMs);
    elapsedMs = Math.min(durationMs, elapsedMs + dt * 1000);
    const distance = totalDistance * (elapsedMs / durationMs);

    if (distance >= totalDistance) {
      currentIndex = distanceMetrics.blockDistances.length;
      sweepX = 0;
    } else {
      const { index, localX } = findBlockAtDistance(cumulative, distance);
      currentIndex = index;
      sweepX = localX;
    }

    if (elapsedMs >= durationMs) {
      running = false;
    }

    draw();
    animationId = requestAnimationFrame(tick);
  }

  return { setImage, setOptions, start, pause, reset, draw, destroy };
}
