(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.PerovskiteDrawing = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  const sites = { a: ["Cs", "Rb", "K", "MA", "FA", "Sr", "Ba", "Ca"], b: ["Pb", "Sn", "Ge", "Ti", "Zr"], x: ["Br", "I", "Cl", "O"] };
  const mixtureSites = { a: ["Cs", "Rb", "K", "MA", "FA"], b: ["Pb", "Sn", "Ge"], x: ["I", "Br", "Cl"] };
  const speciesColors = { Cs: "#3f8c82", Rb: "#789d65", K: "#b5954c", MA: "#d5a65d", FA: "#7b82ba", Pb: "#65303a", Sn: "#ce8250", Ge: "#9d71a3", I: "#936ab1", Br: "#b65a60", Cl: "#74a874", Sr: "#758ba2", Ba: "#aa895c", Ca: "#719975", Ti: "#4a7f9e", Zr: "#876d9a", O: "#ca6058" };
  // Deliberately illustrative size cues, not tabulated ionic or molecular radii.
  const speciesSizes = { Cs: 0.9, Rb: 0.83, K: 0.76, MA: 1.04, FA: 1.22, Pb: 1, Sn: 0.88, Ge: 0.78, I: 1.16, Br: 1, Cl: 0.82 };
  const styles = {
    reference: { aColor: "#3f8c82", bColor: "#65303a", xColor: "#b65a60", faceColor: "#80a9b2", edgeColor: "#637d85", background: "#f6f5ef", faceOpacity: 0.30 },
    paper: { aColor: "#219ebc", bColor: "#023047", xColor: "#e5a52b", faceColor: "#90c9e6", edgeColor: "#4c8398", background: "#ffffff", faceOpacity: 0.24 },
    cover: { aColor: "#58aaa1", bColor: "#883c52", xColor: "#e3817e", faceColor: "#7198a4", edgeColor: "#a0bcc5", background: "#163842", faceOpacity: 0.34 }
  };
  const defaults = {
    a: "Cs", b: "Pb", x: "Br", cells: 2, ...styles.reference,
    aScale: 1, bScale: 1, xScale: 1, edgeWidth: 1.2,
    showOcta: true, showBonds: true, showCell: false, showLabels: false,
    showA: true, speciesStyle: true, showAxes: true, shaded: true, shadow: true,
    rx: 24, ry: -32, rz: -6, zoom: 1
  };
  const ranges = { cells: [1, 4], aScale: [0.25, 1.8], bScale: [0.25, 1.8], xScale: [0.25, 1.8], faceOpacity: [0, 1], edgeWidth: [0, 4], rx: [-180, 180], ry: [-180, 180], rz: [-180, 180], zoom: [0.45, 2.4] };
  const bools = ["showOcta", "showBonds", "showCell", "showLabels", "showA", "speciesStyle", "showAxes", "shaded", "shadow"];
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
    p.composition = input.composition == null ? null : normalizeComposition(input.composition);
    p.occupancyMode = input.occupancyMode ?? "average";
    if (!["average", "discrete"].includes(p.occupancyMode)) throw new Error("Invalid occupancy mode");
    p.seed = input.seed ?? 1;
    if (!Number.isInteger(p.seed) || p.seed < 0 || p.seed > 1000000) throw new Error("Invalid arrangement seed");
    return p;
  }
  function normalizeComposition(input) {
    if (!input || typeof input !== "object" || Array.isArray(input) || Object.keys(input).some(k => !Object.hasOwn(mixtureSites, k))) throw new Error("Invalid composition");
    const result = {};
    for (const [site, allowed] of Object.entries(mixtureSites)) {
      const values = input[site];
      if (!values || typeof values !== "object" || Array.isArray(values) || Object.keys(values).some(k => !allowed.includes(k))) throw new Error("Invalid mixture site " + site);
      result[site] = {};
      let sum = 0;
      for (const species of allowed) {
        const fraction = Object.hasOwn(values, species) ? values[species] : 0;
        if (typeof fraction !== "number" || !Number.isFinite(fraction) || fraction < 0 || fraction > 1) throw new Error("Invalid fraction " + species);
        if (fraction > 0) result[site][species] = fraction;
        sum += fraction;
      }
      if (Math.abs(sum - 1) > 1e-8) throw new Error("Fractions must sum to 1 at " + site);
    }
    return result;
  }
  function compositionOf(p) { return p.composition || { a: { [p.a]: 1 }, b: { [p.b]: 1 }, x: { [p.x]: 1 } }; }
  const fractionText = value => String(Number(value.toPrecision(10)));
  const subscript = value => String(value).replace(/[0-9.\-]/g, ch => ({"0":"₀","1":"₁","2":"₂","3":"₃","4":"₄","5":"₅","6":"₆","7":"₇","8":"₈","9":"₉",".":".","-":"₋"})[ch]);
  function formula(p, ascii = false) {
    const c = compositionOf(p), number = v => ascii ? fractionText(v) : subscript(fractionText(v));
    const parts = site => Object.entries(c[site]).map(([name, ratio]) => name + (ratio === 1 ? "" : number(ratio))).join("");
    return parts("a") + (Object.keys(c.b).length > 1 ? "(" + parts("b") + ")" : parts("b")) + (Object.keys(c.x).length > 1 ? "(" + parts("x") + ")" : parts("x")) + (ascii ? "3" : "₃");
  }
  function appearance(p, site, species) {
    return { color: p.speciesStyle ? speciesColors[species] : p[site + "Color"], size: p.speciesStyle ? (speciesSizes[species] || 1) : 1 };
  }
  function siteOccupancies(input = {}) {
    const p = normalize(input), c = compositionOf(p), geometry = buildGeometry(p.cells), assignments = new Map(), stats = {};
    const periodicKey = atom => atom.position.map(v => (v * 2) % (p.cells * 2)).join(",");
    const hash = key => { let h = (2166136261 ^ p.seed) >>> 0; for (const ch of key) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0; h ^= h >>> 16; h = Math.imul(h, 0x7feb352d); h ^= h >>> 15; return h >>> 0; };
    for (const site of Object.keys(sites)) {
      const atoms = geometry.atoms.filter(atom => atom.site === site), keys = [...new Set(atoms.map(periodicKey))].sort((a,b) => hash(site+a)-hash(site+b) || a.localeCompare(b));
      const total = keys.length, allocation = Object.entries(c[site]).map(([species, fraction], order) => ({ species, fraction, count: Math.floor(fraction * total), remainder: fraction * total % 1, order }));
      const remaining = total - allocation.reduce((sum, item) => sum + item.count, 0);
      [...allocation].sort((a,b) => b.remainder-a.remainder || a.order-b.order).slice(0,remaining).forEach(item => item.count++);
      const lookup = new Map();let offset = 0;
      for (const item of allocation) for (let i=0;i<item.count;i++) lookup.set(keys[offset++], item.species);
      stats[site] = { total, requested: { ...c[site] }, counts: Object.fromEntries(allocation.map(v => [v.species,v.count])), realized: Object.fromEntries(allocation.map(v => [v.species,v.count/total])) };
      atoms.forEach(atom => assignments.set(site + ":" + atom.id, lookup.get(periodicKey(atom))));
    }
    return { assignments, stats };
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
  function renderSVG(input = {}, options = {}) {
    const p = normalize(input), geometry = buildGeometry(p.cells), composition = compositionOf(p), occupancy = siteOccupancies(p);
    const width = 1000, height = 760, center = p.cells / 2;
    const transformed = geometry.atoms.map(a => rotate(a.position.map(v => v - center), p));
    const radii = { a: 0.17, b: 0.13, x: 0.12 };
    const maxRadius = Math.max(...Object.keys(sites).flatMap(site => Object.keys(composition[site]).map(species => p[site + "Scale"] * radii[site] * appearance(p,site,species).size)));
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
    geometry.atoms.forEach((atom, i) => {
      if (atom.site === "a" && !p.showA) return;
      const [x,y,depth] = points[i], site = atom.site, entries = Object.entries(composition[site]);
      const discrete = p.occupancyMode === "discrete", selected = occupancy.assignments.get(site + ":" + atom.id);
      const occupants = discrete ? [[selected,1]] : entries;
      const size = occupants.reduce((sum,[species,fraction]) => sum + appearance(p,site,species).size * fraction,0);
      const r = radii[site] * p[site + "Scale"] * size * scale;
      const color = appearance(p,site,occupants[0][0]).color, fill = species => p.shaded ? `url(#sphere-${site}-${species})` : appearance(p,site,species).color;
      let markup = `<g data-atom="${site}:${atom.id}" data-occupancy="${discrete ? "discrete" : "average"}"><circle data-site="${site}" data-species="${occupants.map(v=>v[0]).join(" ")}" cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${fill(occupants[0][0])}" stroke="${tint(color,-0.25)}" stroke-width="0.5"/>`;
      if (occupants.length > 1) {
        let angle = -Math.PI / 2;
        for (const [species,fraction] of occupants) {
          const next = angle + fraction * 2 * Math.PI, start = [x+r*Math.cos(angle),y+r*Math.sin(angle)], end = [x+r*Math.cos(next),y+r*Math.sin(next)];
          markup += `<path data-species="${species}" data-fraction="${fractionText(fraction)}" d="M ${f(x)} ${f(y)} L ${f(start[0])} ${f(start[1])} A ${f(r)} ${f(r)} 0 ${fraction>0.5?1:0} 1 ${f(end[0])} ${f(end[1])} Z" fill="${fill(species)}"/>`;
          angle = next;
        }
      }
      if (p.showLabels) markup += `<text x="${f(x)}" y="${f(y+5)}" text-anchor="middle" font-size="${f(Math.max(10,Math.min(24,r*0.9)))}" fill="#ffffff" stroke="#142c35" stroke-width="0.6" paint-order="stroke">${escapeXML(occupants.length > 1 ? site.toUpperCase() : occupants[0][0])}</text>`;
      scene.push({depth,markup:markup+"</g>"});
    });
    // shortcut: transparent faces use painter depth ordering; use a depth buffer for dense intersecting geometry.
    scene.sort((a, b) => a.depth - b.depth);
    const title = `${formula(p)} · ${p.cells} × ${p.cells} × ${p.cells}`;
    const definitions = Object.keys(sites).flatMap(site => Object.keys(composition[site]).map(species => {
      const color = appearance(p,site,species).color;
      return `<radialGradient id="sphere-${site}-${species}" cx="30%" cy="24%" r="78%"><stop offset="0" stop-color="${tint(color,0.74)}"/><stop offset="0.32" stop-color="${tint(color,0.12)}"/><stop offset="0.72" stop-color="${tint(color,-0.15)}"/><stop offset="1" stop-color="${tint(color,-0.56)}"/></radialGradient>`;
    })).join("");
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
    const ink = dot(p.background.slice(1).match(/../g).map(c=>parseInt(c,16)),[0.299,0.587,0.114]) < 128 && !options.transparent ? "#f5f3ed" : "#203b46";
    const labels = Object.keys(sites).map((site,i) => `<text x="30" y="${700+i*22}" font-size="14" fill="${ink}">${site.toUpperCase()}: ${Object.entries(composition[site]).map(([species,ratio])=>escapeXML(species+" "+fractionText(ratio*100)+"%")).join(" · ")}</text>`).join("");
    const compositionDescription = Object.entries(composition).map(([site,values])=>site.toUpperCase()+": "+Object.entries(values).map(([species,ratio])=>species+"="+fractionText(ratio)).join(", ")).join("; ");
    const realizedDescription = p.composition && p.occupancyMode === "discrete" ? " Periodic-cell realized fractions: " + Object.entries(occupancy.stats).map(([site,stats])=>site.toUpperCase()+": "+Object.entries(stats.realized).map(([species,ratio])=>species+"="+fractionText(ratio)).join(", ")).join("; ")+". Finite supercell approximation, not measured chemical order." : " Mixed-color sectors denote average site occupancies, not multiple atoms at one position or measured ordering.";
    return `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="760" viewBox="0 0 1000 760" role="img" aria-labelledby="drawing-title drawing-description"><title id="drawing-title">${escapeXML(title)}</title><desc id="drawing-description">Ideal cubic ABX3 schematic. ${escapeXML(compositionDescription)}. Boundary-weighted ratio 1:1:3. Relative visual sizes, not measured radii. Orthographic view.${escapeXML(realizedDescription)}</desc><defs>${definitions}</defs>${background}<g font-family="Arial, sans-serif"><text x="30" y="30" font-size="18" fill="${ink}">${escapeXML(formula(p))}${p.composition ? " · " + (p.occupancyMode === "average" ? "Average occupancy" : "Discrete schematic") : ""}</text>${shadow}${scene.map(item=>item.markup).join("")}${axes}${p.composition ? labels : ""}</g></svg>`;
  }
  return { sites, mixtureSites, speciesColors, styles, defaults, ranges, normalize, normalizeComposition, compositionOf, appearance, siteOccupancies, fractionText, buildGeometry, rotate, formula, renderSVG };
});