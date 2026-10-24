<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';

const props = withDefaults(defineProps<{ speed?: number }>(), { speed: 1 });
type Cell = { walls: [boolean, boolean, boolean, boolean]; order: number };
type Scene = { columns: number; rows: number; cellSize: number; cells: Cell[]; visited: number[]; path: number[] };

const canvas = ref<HTMLCanvasElement | null>(null);
let frame = 0;
let resizeObserver: ResizeObserver | undefined;
let drawingContext: CanvasRenderingContext2D | null = null;
let scene: Scene | undefined;
let reducedMotion = false;
let startedAt = 0;
let lastFrameAt = 0;
let width = 0;
let height = 0;

function buildScene(): Scene {
  const cellSize = 44;
  const columns = Math.max(8, Math.floor(width / cellSize));
  const rows = Math.max(7, Math.floor(height / cellSize));
  const cells: Cell[] = Array.from({ length: columns * rows }, () => ({
    walls: [true, true, true, true],
    order: -1,
  }));
  const visited = new Set<number>();
  const stack = [Math.floor(rows / 2) * columns];
  const directions = [
    { dx: 0, dy: -1, wall: 0, opposite: 2 },
    { dx: 1, dy: 0, wall: 1, opposite: 3 },
    { dx: 0, dy: 1, wall: 2, opposite: 0 },
    { dx: -1, dy: 0, wall: 3, opposite: 1 },
  ];
  let order = 0;

  while (stack.length) {
    const current = stack[stack.length - 1];
    const x = current % columns;
    const y = Math.floor(current / columns);
    visited.add(current);
    if (cells[current].order < 0) cells[current].order = order++;

    const options = directions
      .map((direction) => ({ ...direction, nextX: x + direction.dx, nextY: y + direction.dy }))
      .filter(({ nextX, nextY }) => nextX >= 0 && nextX < columns && nextY >= 0 && nextY < rows)
      .filter(({ nextX, nextY }) => !visited.has(nextY * columns + nextX));

    if (!options.length) {
      stack.pop();
      continue;
    }

    const direction = options[Math.floor(Math.random() * options.length)];
    const next = direction.nextY * columns + direction.nextX;
    cells[current].walls[direction.wall] = false;
    cells[next].walls[direction.opposite] = false;
    stack.push(next);
  }

  const start = Math.floor(rows / 2) * columns;
  const finish = start + columns - 1;
  cells[start].walls[3] = false;
  cells[finish].walls[1] = false;

  const parents = new Int32Array(cells.length).fill(-1);
  const queue = [start];
  parents[start] = start;
  for (let cursor = 0; cursor < queue.length && parents[finish] === -1; cursor++) {
    const current = queue[cursor];
    for (const direction of directions) {
      if (cells[current].walls[direction.wall]) continue;
      const nextX = current % columns + direction.dx;
      const nextY = Math.floor(current / columns) + direction.dy;
      if (nextX < 0 || nextX >= columns || nextY < 0 || nextY >= rows) continue;
      const next = nextY * columns + nextX;
      if (parents[next] !== -1) continue;
      parents[next] = current;
      queue.push(next);
    }
  }

  const path: number[] = [];
  if (parents[finish] !== -1) {
    for (let current = finish; current !== start; current = parents[current]) path.push(current);
    path.push(start);
    path.reverse();
  }

  return { columns, rows, cellSize, cells, visited: queue, path };
}

function draw(timestamp: number) {
  const element = canvas.value;
  const context = drawingContext;
  if (!element || !context || !scene) return;

  if (!reducedMotion && timestamp - lastFrameAt < 100) {
    frame = window.requestAnimationFrame(draw);
    return;
  }
  lastFrameAt = timestamp;

  const elapsed = reducedMotion ? 30_000 : (timestamp - startedAt) * props.speed;
  const { columns, rows, cellSize, cells, visited, path } = scene;
  const generated = reducedMotion ? cells.length : Math.min(cells.length, Math.floor(elapsed / 5));
  const solving = Math.max(0, elapsed - cells.length * 5 - 900);
  const explored = reducedMotion ? visited.length : Math.min(visited.length, Math.floor(solving / 13));
  const pathStart = visited.length * 13 + cells.length * 5 + 1500;
  const pathLength = reducedMotion ? path.length : Math.min(path.length, Math.max(0, Math.floor((elapsed - pathStart) / 36)));
  const runnerIndex = reducedMotion ? path.length - 1 : Math.min(path.length - 1, Math.floor((elapsed - pathStart) / 36));
  const dpr = Math.min(window.devicePixelRatio || 1, 1);
  const mazeWidth = columns * cellSize;
  const mazeHeight = rows * cellSize;
  const offsetX = Math.max(16, (width - mazeWidth) / 2);
  const offsetY = Math.max(16, (height - mazeHeight) / 2);

  context.clearRect(0, 0, element.width, element.height);
  context.save();
  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  context.lineWidth = 1;
  context.lineCap = 'round';

  const generatedCells = new Path2D();
  const mazeWalls = new Path2D();
  const recentWalls = new Path2D();
  for (let index = 0; index < cells.length; index++) {
    const cell = cells[index];
    const x = offsetX + (index % columns) * cellSize;
    const y = offsetY + Math.floor(index / columns) * cellSize;
    if (cell.order >= generated) continue;

    generatedCells.rect(x + 2, y + 2, cellSize - 4, cellSize - 4);
    const walls = cell.order >= generated - 5 ? recentWalls : mazeWalls;
    if (cell.walls[0]) { walls.moveTo(x, y); walls.lineTo(x + cellSize, y); }
    if (cell.walls[1]) { walls.moveTo(x + cellSize, y); walls.lineTo(x + cellSize, y + cellSize); }
    if (cell.walls[2]) { walls.moveTo(x, y + cellSize); walls.lineTo(x + cellSize, y + cellSize); }
    if (cell.walls[3]) { walls.moveTo(x, y); walls.lineTo(x, y + cellSize); }
  }

  context.fillStyle = 'rgba(20, 107, 149, 0.045)';
  context.fill(generatedCells);
  context.strokeStyle = 'rgba(75, 156, 199, 0.23)';
  context.stroke(mazeWalls);
  context.strokeStyle = 'rgba(90, 239, 245, 0.75)';
  context.stroke(recentWalls);

  const exploredCells = new Path2D();
  for (let index = 0; index < explored; index++) {
    const cell = visited[index];
    const x = offsetX + (cell % columns) * cellSize;
    const y = offsetY + Math.floor(cell / columns) * cellSize;
    exploredCells.rect(x + 5, y + 5, cellSize - 10, cellSize - 10);
  }
  context.fillStyle = 'rgba(25, 230, 239, 0.12)';
  context.fill(exploredCells);

  if (pathLength > 1) {
    context.beginPath();
    for (let index = 0; index < pathLength; index++) {
      const cell = path[index];
      const x = offsetX + (cell % columns) * cellSize + cellSize / 2;
      const y = offsetY + Math.floor(cell / columns) * cellSize + cellSize / 2;
      if (index === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    }
    context.strokeStyle = 'rgba(159, 112, 255, 0.82)';
    context.lineWidth = 2.5;
    context.shadowColor = 'rgba(159, 112, 255, 0.8)';
    context.shadowBlur = 11;
    context.stroke();
    context.shadowBlur = 0;
  }

  if (runnerIndex >= 0 && path.length) {
    const runner = path[runnerIndex];
    const x = offsetX + (runner % columns) * cellSize + cellSize / 2;
    const y = offsetY + Math.floor(runner / columns) * cellSize + cellSize / 2;
    context.beginPath();
    context.arc(x, y, 4.5, 0, Math.PI * 2);
    context.fillStyle = '#a6fbff';
    context.shadowColor = '#19e6ef';
    context.shadowBlur = 16;
    context.fill();
    context.shadowBlur = 0;
  }
  context.restore();

  const cycleDuration = cells.length * 5 + visited.length * 13 + path.length * 36 + 4500;
  if (!reducedMotion && elapsed >= cycleDuration) {
    scene = buildScene();
    startedAt = timestamp;
  }
  if (!reducedMotion && !document.hidden) frame = window.requestAnimationFrame(draw);
}

function resize() {
  const element = canvas.value;
  if (!element) return;
  drawingContext ??= element.getContext('2d');
  if (!drawingContext) return;
  width = window.innerWidth;
  height = window.innerHeight;
  const dpr = Math.min(window.devicePixelRatio || 1, 1);
  element.width = Math.round(width * dpr);
  element.height = Math.round(height * dpr);
  scene = buildScene();
  startedAt = performance.now();
  lastFrameAt = 0;
  if (frame) window.cancelAnimationFrame(frame);
  draw(startedAt);
}

function handleVisibilityChange() {
  if (document.hidden) {
    if (frame) window.cancelAnimationFrame(frame);
    frame = 0;
    return;
  }
  startedAt = performance.now();
  if (!reducedMotion) frame = window.requestAnimationFrame(draw);
}

onMounted(() => {
  reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  resizeObserver = new ResizeObserver(resize);
  if (canvas.value) resizeObserver.observe(canvas.value);
  window.addEventListener('resize', resize, { passive: true });
  document.addEventListener('visibilitychange', handleVisibilityChange);
  resize();
});

onBeforeUnmount(() => {
  if (frame) window.cancelAnimationFrame(frame);
  resizeObserver?.disconnect();
  window.removeEventListener('resize', resize);
  document.removeEventListener('visibilitychange', handleVisibilityChange);
  drawingContext = null;
});
</script>

<template>
  <canvas ref="canvas" class="admin-maze-canvas" aria-hidden="true"></canvas>
</template>
