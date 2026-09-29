import { Vector3 } from "three";
export interface Obstacle {
  x: number;
  z: number;
  w: number;
  d: number;
  height: number;
}
export class Collision {
  obstacles: Obstacle[] = [];
  add(x: number, z: number, w: number, d: number, height = 5) {
    this.obstacles.push({ x, z, w, d, height });
  }
  free(x: number, z: number, r = 0.45) {
    return (
      Math.abs(x) < 57 - r &&
      Math.abs(z) < 57 - r &&
      !this.obstacles.some(
        (o) =>
          Math.abs(x - o.x) < o.w / 2 + r && Math.abs(z - o.z) < o.d / 2 + r,
      )
    );
  }
  move(p: Vector3, dx: number, dz: number, r = 0.4) {
    if (this.free(p.x + dx, p.z, r)) p.x += dx;
    if (this.free(p.x, p.z + dz, r)) p.z += dz;
  }
  clear(a: Vector3, b: Vector3, r = 0.1) {
    const n = Math.ceil(a.distanceTo(b) / 0.4);
    for (let i = 1; i <= n; i++) {
      const t = i / n;
      if (!this.free(a.x + (b.x - a.x) * t, a.z + (b.z - a.z) * t, r))
        return false;
    }
    return true;
  }
  cameraDistance(a: Vector3, b: Vector3) {
    let max = a.distanceTo(b);
    for (let t = 0.08; t <= 1; t += 0.025) {
      const p = a.clone().lerp(b, t);
      if (
        p.y < 0.35 ||
        this.obstacles.some(
          (o) =>
            p.y < o.height + 0.2 &&
            Math.abs(p.x - o.x) < o.w / 2 + 0.22 &&
            Math.abs(p.z - o.z) < o.d / 2 + 0.22,
        )
      ) {
        max = Math.max(0.65, a.distanceTo(b) * Math.max(0.05, t - 0.035));
        break;
      }
    }
    return max;
  }
}
// Static walkable grid is the waypoint graph. A* runs only when a direct route is blocked.
export class Navigation {
  nodes: Vector3[] = [];
  neighbors: number[][] = [];
  constructor(public collision: Collision) {
    for (let z = -54; z <= 54; z += 3)
      for (let x = -54; x <= 54; x += 3)
        if (collision.free(x, z, 0.65)) this.nodes.push(new Vector3(x, 0, z));
    this.neighbors = this.nodes.map((a, i) =>
      this.nodes.flatMap((b, j) =>
        j !== i && a.distanceTo(b) < 4.3 && collision.clear(a, b, 0.55)
          ? [j]
          : [],
      ),
    );
  }
  path(start: Vector3, end: Vector3): Vector3[] {
    if (this.collision.clear(start, end, 0.5)) return [end.clone()];
    const nearest = (p: Vector3) => {
      let best = -1,
        d = Infinity;
      this.nodes.forEach((n, i) => {
        const dd = n.distanceToSquared(p);
        if (dd < d && this.collision.clear(p, n, 0.45)) {
          d = dd;
          best = i;
        }
      });
      return best;
    };
    const s = nearest(start),
      e = nearest(end);
    if (s < 0 || e < 0) return [];
    const open = new Set([s]),
      came = new Map<number, number>(),
      g = new Map([[s, 0]]);
    let iterations = 0;
    while (open.size && iterations++ < 1800) {
      let current = -1,
        cost = Infinity;
      open.forEach((i) => {
        const f = g.get(i)! + this.nodes[i].distanceTo(this.nodes[e]);
        if (f < cost) {
          cost = f;
          current = i;
        }
      });
      if (current === e) {
        const route = [end.clone(), this.nodes[e]];
        while (came.has(current)) {
          current = came.get(current)!;
          route.push(this.nodes[current]);
        }
        return route.reverse();
      }
      open.delete(current);
      for (const next of this.neighbors[current]) {
        const tentative =
          g.get(current)! + this.nodes[current].distanceTo(this.nodes[next]);
        if (tentative < (g.get(next) ?? Infinity)) {
          g.set(next, tentative);
          came.set(next, current);
          open.add(next);
        }
      }
    }
    return [];
  }
}
