import { hexagramPoints, centroid, pointsToAttr } from "../components/tutorial/sigilGeometry.js";

let failures = 0;
const approx = (a, b, eps = 1e-9) => Math.abs(a - b) <= eps;
function check(name, cond) {
  if (cond) { console.log("PASS", name); }
  else { console.error("FAIL", name); failures++; }
}

const c = 90, R = 50;
const { up, down } = hexagramPoints(c, c, R);

// Both triangles centred on (c, c)
const cu = centroid(up), cd = centroid(down);
check("up centroid x == center", approx(cu[0], c));
check("up centroid y == center", approx(cu[1], c));
check("down centroid x == center", approx(cd[0], c));
check("down centroid y == center", approx(cd[1], c));

// down is the 180° reflection of up through the centre (as a set)
const reflect = ([x, y]) => [2 * c - x, 2 * c - y];
for (const p of up) {
  const r = reflect(p);
  const found = down.some(q => approx(q[0], r[0]) && approx(q[1], r[1]));
  check(`reflection of ${p} present in down`, found);
}

// attr serialises to "x,y x,y x,y"
check("pointsToAttr format", /^(-?\d+(\.\d+)?,-?\d+(\.\d+)?)( -?\d+(\.\d+)?,-?\d+(\.\d+)?){2}$/.test(pointsToAttr(up)));

if (failures) { console.error(`\n${failures} failing assertion(s)`); process.exit(1); }
console.log("\nAll geometry assertions passed.");
