/**
 * Sparkline drawing utility
 */

export function drawSparkline(
  canvas: HTMLCanvasElement,
  data: number[],
  color: string,
): void {
  const ctx = canvas.getContext("2d");
  if (!ctx || data.length < 2) return;

  const width = canvas.width;
  const height = canvas.height;
  const padding = 2;

  // Clear canvas
  ctx.clearRect(0, 0, width, height);

  // Calculate min/max for scaling
  const min = Math.min(...data) - 2;
  const max = Math.max(...data) + 2;
  const range = max - min || 1;

  // Draw area fill
  ctx.beginPath();
  ctx.moveTo(padding, height - padding);

  data.forEach((value, i) => {
    const x = padding + (i / (data.length - 1)) * (width - 2 * padding);
    const y =
      height - padding - ((value - min) / range) * (height - 2 * padding);
    ctx.lineTo(x, y);
  });

  ctx.lineTo(width - padding, height - padding);
  ctx.closePath();
  ctx.fillStyle = `${color}20`; // 12.5% opacity
  ctx.fill();

  // Draw line
  ctx.beginPath();
  data.forEach((value, i) => {
    const x = padding + (i / (data.length - 1)) * (width - 2 * padding);
    const y =
      height - padding - ((value - min) / range) * (height - 2 * padding);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}
