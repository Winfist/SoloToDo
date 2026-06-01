// Pure geometry for the arcane sigil. No React/DOM — unit-testable via node.
// A hexagram = two equilateral triangles sharing centre (cx, cy), one rotated 180°.
// For circumradius R: apex (cx, cy-R); base corners (cx ± R·√3/2, cy + R/2).

const round = (n) => Math.round(n * 100) / 100;

export function hexagramPoints(cx, cy, R) {
  const h = (Math.sqrt(3) / 2) * R;
  const half = R / 2;
  const up = [
    [cx, cy - R],
    [cx + h, cy + half],
    [cx - h, cy + half],
  ];
  const down = [
    [cx, cy + R],
    [cx - h, cy - half],
    [cx + h, cy - half],
  ];
  return { up, down };
}

export function centroid(points) {
  const n = points.length;
  const sx = points.reduce((s, p) => s + p[0], 0);
  const sy = points.reduce((s, p) => s + p[1], 0);
  return [sx / n, sy / n];
}

export function pointsToAttr(points) {
  return points.map(([x, y]) => `${round(x)},${round(y)}`).join(" ");
}
