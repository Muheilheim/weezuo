(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.PerovskiteDrawing = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  const sites = { a: ["Cs", "Rb", "K", "MA", "FA", "Sr", "Ba", "Ca"], b: ["Pb", "Sn", "Ge", "Ti", "Zr"], x: ["Br", "I", "Cl", "O"] };
  const styles = {
    reference: { aColor: "#3f8c82", bColor: "#65303a", xColor: "#b65a60", faceColor: "#80a9b2", edgeColor: "#637d85", background: "#f6f5ef", faceOpacity: 0.30 },
    paper: { aColor: "#219ebc", bColor: "#023047", xColor: "#e5a52b", faceColor: "#90c9e6", edgeColor: "#4c8398", background: "#ffffff", faceOpacity: 0.24 },
    cover: { aColor: "#58aaa1", bColor: "#883c52", xColor: "#e3817e", faceColor: "#7198a4", edgeColor: "#a0bcc5", background: "#163842", faceOpacity: 0.34 }
  };
  const defaults = {
    a: "Cs", b: "Pb", x: "Br", cells: 2, ...styles.reference,
    aScale: 1, bScale: 1, xScale: 1, edgeWidth: 1.2,
    showOcta: true, showBonds: true, showCell: false, showLabels: false,
    showA: true, showAxes: true, shaded: true, shadow: true,
    rx: 24, ry: -32, rz: -6, zoom: 1
  };
  const ranges = { cells: [1, 4], aScale: [0.25, 1.8], bScale: [0.25, 1.8], xScale: [0.25, 1.8], faceOpacity: [0, 1], edgeWidth: [0, 4], rx: [-180, 180], ry: [-180, 180], rz: [-180, 180], zoom: [0.45, 2.4] };
  const bools = ["showOcta", "showBonds", "showCell", "showLabels", "showA", "showAxes", "shaded", "shadow"];
  const colors = ["aColor", "bColor", "xColor", "faceColor", "edgeColor", "background"];
  function normalize(input = {}) {
    const p = { ...defaults };
    for (const key of Object.keys(defaults)) if (Object.hasOwn(input, key)) p[key] = input[key];
    for (const key of Object.keys(sites)) if (!sites[key].includes(p[key])) throw new Error("Unsupported site: " + key);
    for (const [key, [min, max]] of Object.entries(ranges)) {
      if (typeof p[key] !== "number" || !Number.isFinite(p[key]) || p[key] < min || p[key] > max) throw new Error("Out of range: " + key);
    }
    if (!Number.isInteger(p.cells)) throw new Error("Supercell must be an integer");
    for (const key of colors) if (typeof p[key] !== "string" || !/^#[0-9a-f]{6}$/i.test(p[key])) throw new Error("Invalid color: " + key);
    for (const key of bools) if (typeof p[key] !== "boolean") throw new Error("Invalid switch: " + key);
    return p;
  }
  const escapeXML = value => String(value).replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[ch]);
  const subtract = (a, b) => a.map((v, i) => v - b[i]);
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const dot = (a, b) => a.reduce((s, v, i) => s + v * b[i], 0);
  function buildGeometry(n) {
    if (!Number.isInteger(n) || n < 1 || n > 4) throw new Error("Supercell must be 1 to 4");
    const atoms = [], lookup = new Map(), octahedra = [], bonds = [], cellLines = [];
    function add(site, point) {
      const key = point.map(x => x * 2).join(",");
      if (!lookup.has(key)) {
        lookup.set(key, atoms.length);
        atoms.push({ id: key, site, position: point });
      }
      return lookup.get(key);
    }
    for (let i = 0; i <= n; i++) for (let j = 0; j <= n; j++) for (let k = 0; k <= n; k++) add("a", [i, j, k]);
    const directions = [[0.5, 0, 0], [-0.5, 0, 0], [0, 0.5, 0], [0, -0.5, 0], [0, 0, 0.5], [0, 0, -0.5]];
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) for (let k = 0; k < n; k++) {
      const center = [i + 0.5, j + 0.5, k + 0.5];
      const b = add("b", center);
      const vertices = directions.map(d => add("x", center.map((v, axis) => v + d[axis])));
      vertices.forEach(x => bonds.push([b, x]));
      const faces = [], edges = [];
      for (let u = 0; u < 2; u++) for (let v = 2; v < 4; v++) for (let w = 4; w < 6; w++) {
        const face = [vertices[u], vertices[v], vertices[w]];
        const [a, b, c] = face.map(index => atoms[index].position);
        if (dot(cross(subtract(b, a), subtract(c, a)), subtract(a, center)) < 0) face.reverse();
        faces.push(face);
      }
      for (let u = 0; u < 6; u++) for (let v = u + 1; v < 6; v++) if (Math.floor(u / 2) !== Math.floor(v / 2)) edges.push([vertices[u], vertices[v]]);
      octahedra.push({ center: b, vertices, faces, edges });
    }
    for (let axis = 0; axis < 3; axis++) for (let i = 0; i <= n; i++) for (let j = 0; j <= n; j++) {
      const start = [0, 0, 0], end = [0, 0, 0];
      const other = [0, 1, 2].filter(a => a !== axis);
      start[other[0]] = end[other[0]] = i;
      start[other[1]] = end[other[1]] = j;
      end[axis] = n;
      cellLines.push([start, end]);
    }
    return { n, atoms, octahedra, bonds, cellLines, counts: { a: (n + 1) ** 3, b: n ** 3, x: 3 * n * n * (n + 1) }, weightedCounts: { a: n ** 3, b: n ** 3, x: 3 * n ** 3 } };
  }
  function rotate(point, p) {
    const angles = [p.rx, p.ry, p.rz].map(d => d * Math.PI / 180);
    const [sx, sy, sz] = angles.map(Math.sin), [cx, cy, cz] = angles.map(Math.cos);
    const [x, y, z] = point;
    const u = cy * x + sy * z, v = -sy * x + cy * z;
    const h = cx * y - sx * v, d = sx * y + cx * v;
    return [cz * u - sz * h, sz * u + cz * h, d];
  }
  const f = n => Number(n.toFixed(3));
  function tint(hex, amount) {
    const channels = hex.slice(1).match(/../g).map(c => parseInt(c, 16));
    return "#" + channels.map(c => Math.round(amount >= 0 ? c + (255 - c) * amount : c * (1 + amount)).toString(16).padStart(2, "0")).join("");
  }
  const formula = p => p.a + p.b + p.x + "₃";
  function renderSVG(input = {}, options = {}) {
    const p = normalize(input), geometry = buildGeometry(p.cells);
    const width = 1000, height = 760, center = p.cells / 2;
    const transformed = geometry.atoms.map(a => rotate(a.position.map(v => v - center), p));
    const maxRadius = Math.max(p.aScale * 0.17, p.bScale * 0.13, p.xScale * 0.12);
    const xs = transformed.map(v => v[0]), ys = transformed.map(v => v[1]);
    const scale = Math.min(820 / (Math.max(...xs) - Math.min(...xs) + maxRadius * 2), 580 / (Math.max(...ys) - Math.min(...ys) + maxRadius * 2)) * p.zoom;
    const project = point => [500 + point[0] * scale, 350 - point[1] * scale, point[2]];
    const points = transformed.map(project), scene = [];
    function line(a, b, color, stroke, opacity = 1, extra = "") {
      scene.push({ depth: (a[2] + b[2]) / 2, markup: `<line x1="${f(a[0])}" y1="${f(a[1])}" x2="${f(b[0])}" y2="${f(b[1])}" stroke="${color}" stroke-width="${f(stroke)}" stroke-opacity="${opacity}" stroke-linecap="round" ${extra}/>` });
    }
    if (p.showCell) geometry.cellLines.forEach(pair => line(...pair.map(v => project(rotate(v.map(x => x - center), p))), p.edgeColor, 1.3, 0.55, 'stroke-dasharray="5 5"'));
    if (p.showOcta) geometry.octahedra.forEach(octa => {
      octa.faces.forEach(face => {
        const projected = face.map(i => points[i]);
        const [a, b, c] = face.map(i => transformed[i]);
        const normal = cross(subtract(b, a), subtract(c, a));
        const light = dot(normal, [-0.3, 0.6, 0.74]) / Math.hypot(...normal);
        const fill = p.shaded ? tint(p.faceColor, Math.max(-0.18, light * 0.16)) : p.faceColor;
        scene.push({ depth: projected.reduce((s, v) => s + v[2], 0) / 3, markup: `<polygon points="${projected.map(v => `${f(v[0])},${f(v[1])}`).join(" ")}" fill="${fill}" fill-opacity="${p.faceOpacity}"/>` });
      });
      if (p.edgeWidth) octa.edges.forEach(([a, b]) => line(points[a], points[b], p.edgeColor, p.edgeWidth, 0.7));
    });
    if (p.showBonds) geometry.bonds.forEach(([a, b]) => line(points[a], points[b], tint(p.bColor, 0.3), 4, 0.75));
    const radii = { a: 0.17, b: 0.13, x: 0.12 };
    geometry.atoms.forEach((atom, i) => {
      if (atom.site === "a" && !p.showA) return;
      const [x, y, depth] = points[i], r = radii[atom.site] * p[atom.site + "Scale"] * scale;
      const label = p[atom.site];
      let markup = `<circle data-site="${atom.site}" cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${p.shaded ? `url(#sphere-${atom.site})` : p[atom.site + "Color"]}" stroke="${tint(p[atom.site + "Color"], -0.25)}" stroke-width="0.5"/>`;
      if (p.showLabels) markup += `<text x="${f(x)}" y="${f(y + 5)}" text-anchor="middle" font-size="${f(Math.max(12, Math.min(24, r * 0.9)))}" fill="${p.shaded ? "#ffffff" : (dot(p[atom.site + "Color"].slice(1).match(/../g).map(c => parseInt(c, 16)), [0.299, 0.587, 0.114]) > 150 ? "#142c35" : "#ffffff")}" stroke="#142c35" stroke-width="0.6" paint-order="stroke">${escapeXML(label)}</text>`;
      scene.push({ depth, markup });
    });
    // shortcut: transparent faces use painter depth ordering; use a depth buffer for dense intersecting geometry.
    scene.sort((a, b) => a.depth - b.depth);
    const title = `${formula(p)} · ${p.cells} × ${p.cells} × ${p.cells}`;
    const definitions = Object.keys(radii).map(site => `<radialGradient id="sphere-${site}" cx="30%" cy="24%" r="78%"><stop offset="0" stop-color="${tint(p[site + "Color"], 0.74)}"/><stop offset="0.32" stop-color="${tint(p[site + "Color"], 0.12)}"/><stop offset="0.72" stop-color="${tint(p[site + "Color"], -0.15)}"/><stop offset="1" stop-color="${tint(p[site + "Color"], -0.56)}"/></radialGradient>`).join("");
    const background = options.transparent ? "" : `<rect width="1000" height="760" fill="${p.background}"/>`;
    const shadow = p.shadow ? Array.from({ length: 18 }, (_, i) => {
      const radius = 1 - i / 22;
      return `<ellipse cx="500" cy="655" rx="${f(290 * radius)}" ry="${f(34 * radius)}" fill="#172f35" opacity="0.012"/>`;
    }).join("") : "";
    let axes = "";
    if (p.showAxes) {
      const darkCanvas = dot(p.background.slice(1).match(/../g).map(c => parseInt(c, 16)), [0.299, 0.587, 0.114]) < 128;
      const axisColors = darkCanvas ? ["#e7a09c", "#8bd4c7", "#aacbe8"] : ["#b75555", "#308277", "#507ba0"];
      [[1, 0, 0], [0, 1, 0], [0, 0, 1]].forEach((vector, i) => {
        const [x, y] = rotate(vector, p), end = [90 + x * 66, 656 - y * 66];
        axes += `<line x1="90" y1="656" x2="${f(end[0])}" y2="${f(end[1])}" stroke="${axisColors[i]}" stroke-width="3"/><text x="${f(90 + x * 90)}" y="${f(666 - y * 90)}" font-size="30" text-anchor="middle" fill="${axisColors[i]}">${["a", "b", "c"][i]}</text>`;
      });
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="760" viewBox="0 0 1000 760" role="img" aria-labelledby="drawing-title drawing-description"><title id="drawing-title">${escapeXML(title)}</title><desc id="drawing-description">Ideal cubic ABX3 schematic. A: ${escapeXML(p.a)}; B: ${escapeXML(p.b)}; X: ${escapeXML(p.x)}. Boundary-weighted ratio 1:1:3. Relative visual sizes, not measured radii. Orthographic view.</desc><defs>${definitions}</defs>${background}<g font-family="Arial, sans-serif">${shadow}${scene.map(item => item.markup).join("")}${axes}</g></svg>`;
  }
  return { sites, styles, defaults, ranges, normalize, buildGeometry, rotate, formula, renderSVG };
});