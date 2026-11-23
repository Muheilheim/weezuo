(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory(require("./perovskite-model.js"));
  else root.LayeredDeviceDrawing = factory(root.PerovskiteDrawing);
})(typeof globalThis !== "undefined" ? globalThis : this, function (crystal) {
  "use strict";
  const roles = ["substrate", "tco", "htl", "absorber", "interlayer", "etl", "electrode", "custom"];
  const styles = {
    home: { background: "#f4f0e7", colors: { substrate: "#b4d3df", tco: "#75929c", htl: "#394547", absorber: "#7c3e51", interlayer: "#c2a374", etl: "#45644d", electrode: "#414c55", custom: "#82939d" } },
    paper: { background: "#ffffff", colors: { substrate: "#c9e6f1", tco: "#8fbacb", htl: "#219ebc", absorber: "#646c98", interlayer: "#e3b55f", etl: "#60a092", electrode: "#314b5a", custom: "#99aebe" } },
    cover: { background: "#183541", colors: { substrate: "#8bb9c9", tco: "#5e8799", htl: "#496d70", absorber: "#a6586d", interlayer: "#d8b56e", etl: "#638770", electrode: "#74838c", custom: "#95adb7" } }
  };
  function preset(kind = "pin") {
    if (!["pin", "nip"].includes(kind)) throw new Error("Unknown device preset");
    return [
      { name: "Glass", role: "substrate", thickness: 0.20, coverage: 1.08, opacity: 0.46 },
      { name: "TCO", role: "tco", thickness: 0.07, coverage: 1, opacity: 0.76 },
      { name: kind === "pin" ? "HTL" : "ETL", role: kind === "pin" ? "htl" : "etl", thickness: 0.08, coverage: 1, opacity: 0.94 },
      { name: "Perovskite", role: "absorber", thickness: 0.46, coverage: 1, opacity: 0.92 },
      { name: "Interlayer", role: "interlayer", thickness: 0.035, coverage: 1, opacity: 0.65 },
      { name: kind === "pin" ? "ETL" : "HTL", role: kind === "pin" ? "etl" : "htl", thickness: 0.08, coverage: 1, opacity: 0.94 },
      { name: "Metal", role: "electrode", thickness: 0.13, coverage: 0.76, opacity: 1 }
    ].map(layer => ({ ...layer, color: styles.home.colors[layer.role] }));
  }
  const defaults = { layers: preset(), width: 3.6, depth: 2.4, gap: 0.18, rx: 26, ry: -32, rz: 0, zoom: 1, background: styles.home.background, showLattice: true, showLabels: true, softLight: true, shadow: true };
  const limits = { width: [2, 5], depth: [1.5, 4], gap: [0, 0.5], rx: [-180, 180], ry: [-180, 180], rz: [-180, 180], zoom: [0.45, 2.4] };
  const colorOK = value => typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value);
  function bounded(value, low, high) { return typeof value === "number" && Number.isFinite(value) && value >= low && value <= high; }
  function normalize(input = {}) {
    const p = Object.fromEntries(Object.keys(defaults).map(key => [key, Object.hasOwn(input, key) ? input[key] : defaults[key]]));
    for (const [key, range] of Object.entries(limits)) if (!bounded(p[key], ...range)) throw new Error("Invalid device parameter: " + key);
    if (!colorOK(p.background)) throw new Error("Invalid background");
    for (const key of ["showLattice", "showLabels", "softLight", "shadow"]) if (typeof p[key] !== "boolean") throw new Error("Invalid switch: " + key);
    if (!Array.isArray(p.layers) || p.layers.length < 2 || p.layers.length > 10) throw new Error("Use 2 to 10 layers");
    p.layers = p.layers.map(layer => {
      if (!layer || typeof layer.name !== "string") throw new Error("Invalid layer name");
      const name = layer.name.trim(), chars = [...name];
      if (!name || chars.length > 32 || /[\u0000-\u001f\u007f-\u009f\ufffd]/.test(name) || chars.some(c => c.codePointAt(0) >= 0xd800 && c.codePointAt(0) <= 0xdfff)) throw new Error("Use a printable name of up to 32 characters");
      if (!roles.includes(layer.role) || !colorOK(layer.color)) throw new Error("Invalid layer role or color");
      if (!bounded(layer.thickness, 0.02, 1.5) || !bounded(layer.coverage, 0.35, 1.15) || !bounded(layer.opacity, 0, 1)) throw new Error("Invalid layer geometry or opacity");
      return { name, role: layer.role, color: layer.color, thickness: layer.thickness, coverage: layer.coverage, opacity: layer.opacity };
    });
    return p;
  }
  function classify(layers) {
    const order = layers.filter(layer => layer.role !== "interlayer").map(layer => layer.role).join(",");
    if (order === "substrate,tco,htl,absorber,etl,electrode") return "p-i-n";
    if (order === "substrate,tco,etl,absorber,htl,electrode") return "n-i-p";
    return "custom";
  }
  const escape = value => String(value).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[c]);
  const sub = (a, b) => a.map((v, i) => v - b[i]);
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const f = n => Number(n.toFixed(3));
  function tint(hex, amount) { return "#" + hex.slice(1).match(/../g).map(c => { const n = parseInt(c, 16); return Math.round(amount < 0 ? n * (1 + amount) : n + (255 - n) * amount).toString(16).padStart(2, "0"); }).join(""); }
  function buildGeometry(input = {}) {
    const p = normalize(input), height = p.layers.reduce((sum, layer) => sum + layer.thickness, 0) + p.gap * (p.layers.length - 1);
    let y = -height / 2;
    const layers = p.layers.map((layer, index) => {
      const width = p.width * layer.coverage, depth = p.depth * layer.coverage, bottom = y, top = y + layer.thickness;
      y = top + p.gap;
      const vertices = [[-width / 2, bottom, -depth / 2], [width / 2, bottom, -depth / 2], [width / 2, bottom, depth / 2], [-width / 2, bottom, depth / 2], [-width / 2, top, -depth / 2], [width / 2, top, -depth / 2], [width / 2, top, depth / 2], [-width / 2, top, depth / 2]];
      return { index, ...layer, width, depth, bottom, top, vertices, faces: [[0, 1, 2, 3], [4, 7, 6, 5], [3, 2, 6, 7], [0, 4, 5, 1], [0, 3, 7, 4], [1, 5, 6, 2]] };
    });
    return { params: p, height, layers };
  }
  function buildLattice(layer) {
    const unit = crystal.buildGeometry(1), pitch = Math.min(layer.thickness * 0.9, 0.44);
    const nx = Math.max(1, Math.min(6, Math.floor(layer.width * 0.82 / pitch))), nz = Math.max(1, Math.min(4, Math.floor(layer.depth * 0.82 / pitch)));
    const atoms = [], faces = [], bonds = [], lookup = new Map();
    for (let i = 0; i < nx; i++) for (let k = 0; k < nz; k++) {
      const local = unit.atoms.map(atom => {
        const grid = [atom.position[0] + i, atom.position[1], atom.position[2] + k], key = grid.map(v => v * 2).join(",");
        if (!lookup.has(key)) {
          lookup.set(key, atoms.length);
          atoms.push({ site: atom.site, position: [(grid[0] - nx / 2) * pitch, layer.bottom + (layer.thickness - pitch) / 2 + grid[1] * pitch, (grid[2] - nz / 2) * pitch] });
        }
        return lookup.get(key);
      });
      unit.octahedra[0].faces.forEach(face => faces.push(face.map(index => local[index])));
      unit.bonds.forEach(pair => bonds.push(pair.map(index => local[index])));
    }
    return { atoms, faces, bonds, pitch, nx, nz };
  }
  function labelLines(value) {
    const lines = [""]; let length = 0;
    for (const char of value) { const units = char.codePointAt(0) > 127 || /[MW@%&#]/.test(char) ? 2 : /[ilI.,:;!|' ]/.test(char) ? 0.55 : /[A-Z0-9]/.test(char) ? 1.4 : 1; if (length + units > 24) { lines.push(""); length = 0; } lines[lines.length - 1] += char; length += units; }
    return lines;
  }
  function renderSVG(input = {}, options = {}) {
    const geometry = buildGeometry(input), p = geometry.params;
    const rotated = geometry.layers.flatMap(layer => layer.vertices.map(v => crystal.rotate(v, p)));
    const xs = rotated.map(v => v[0]), ys = rotated.map(v => v[1]);
    const scale = Math.min((p.showLabels ? 610 : 820) / (Math.max(...xs) - Math.min(...xs)), 550 / (Math.max(...ys) - Math.min(...ys))) * p.zoom;
    const project = v => { const r = crystal.rotate(v, p); return [(p.showLabels ? 365 : 500) + r[0] * scale, 350 - r[1] * scale, r[2]]; };
    const scene = [], definitions = [];
    let currentLayer = 0;
    const sphereColors = { a: "#809777", b: "#593440", x: "#c3d0d0" };
    for (const site of Object.keys(sphereColors)) definitions.push(`<radialGradient id="device-sphere-${site}" cx="28%" cy="23%" r="78%"><stop offset="0" stop-color="${tint(sphereColors[site], 0.75)}"/><stop offset="0.35" stop-color="${sphereColors[site]}"/><stop offset="1" stop-color="${tint(sphereColors[site], -0.55)}"/></radialGradient>`);
    function polygon(points, depth, attrs) { scene.push({ layer: currentLayer, depth, markup: `<polygon points="${points.map(v => `${f(v[0])},${f(v[1])}`).join(" ")}" ${attrs}/>` }); }
    geometry.layers.forEach(layer => {
      currentLayer = layer.index;
      const points = layer.vertices.map(project), inLattice = p.showLattice && layer.role === "absorber";
      layer.faces.forEach((face, faceIndex) => {
        const vectors = face.map(i => crystal.rotate(layer.vertices[i], p)), normal = cross(sub(vectors[1], vectors[0]), sub(vectors[2], vectors[0]));
        if (normal[2] <= 1e-9) return;
        const light = (normal[0] * -0.3 + normal[1] * 0.6 + normal[2] * 0.74) / Math.hypot(...normal);
        const base = p.softLight ? tint(layer.color, Math.max(-0.24, Math.min(0.2, light * 0.2))) : layer.color;
        const id = `device-layer-${layer.index}-${faceIndex}`;
        definitions.push(`<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${p.softLight ? tint(base, 0.22) : base}"/><stop offset="0.4" stop-color="${base}"/><stop offset="1" stop-color="${p.softLight ? tint(base, -0.16) : base}"/></linearGradient>`);
        const opacity = layer.opacity * (inLattice ? (faceIndex === 1 ? 0.035 : 0.14) : 1);
        const selected = options.selectedIndex === layer.index;
        polygon(face.map(i => points[i]), vectors.reduce((sum, v) => sum + v[2], 0) / 4, `data-layer="${layer.index}" data-face="${faceIndex}" fill="url(#${id})" fill-opacity="${f(opacity)}" stroke="${selected ? "#c59b52" : tint(layer.color, 0.26)}" stroke-opacity="${selected ? 0.95 : layer.opacity * 0.75}" stroke-width="${selected ? 2.5 : 1}" stroke-linejoin="round"`);
      });
      if (inLattice && layer.opacity > 0) {
        const lattice = buildLattice(layer), atoms = lattice.atoms.map(atom => project(atom.position));
        lattice.faces.forEach(face => polygon(face.map(i => atoms[i]), face.reduce((sum, i) => sum + atoms[i][2], 0) / 3, `data-octa-face="true" fill="${layer.color}" fill-opacity="${f(layer.opacity * 0.32)}" stroke="${tint(layer.color, 0.44)}" stroke-opacity="0.52" stroke-width="0.65"`));
        lattice.bonds.forEach(([a, b]) => scene.push({ layer: currentLayer, depth: (atoms[a][2] + atoms[b][2]) / 2, markup: `<line x1="${f(atoms[a][0])}" y1="${f(atoms[a][1])}" x2="${f(atoms[b][0])}" y2="${f(atoms[b][1])}" stroke="${tint(layer.color, 0.5)}" stroke-opacity="${f(layer.opacity * 0.65)}" stroke-width="1.3"/>` }));
        lattice.atoms.forEach((atom, index) => {
          const point = atoms[index], radius = lattice.pitch * { a: 0.12, b: 0.075, x: 0.065 }[atom.site] * scale;
          scene.push({ layer: currentLayer, depth: point[2], markup: `<circle data-lattice-site="${atom.site}" cx="${f(point[0])}" cy="${f(point[1])}" r="${f(radius)}" fill="${p.softLight ? `url(#device-sphere-${atom.site})` : sphereColors[atom.site]}" opacity="${layer.opacity}"/>` });
        });
      }
    });
    // Parallel disjoint layers have a consistent front-to-back order along the stacking normal.
    const stackDirection = crystal.rotate([0, 1, 0], p)[2] >= 0 ? 1 : -1;
    // shortcut: faces inside each lattice layer use painter ordering; intersecting objects need a depth buffer.
    scene.sort((a, b) => (a.layer - b.layer) * stackDirection || a.depth - b.depth);
    const shadow = p.shadow ? Array.from({ length: 18 }, (_, i) => `<ellipse cx="${p.showLabels ? 365 : 500}" cy="674" rx="${f(290 * (1 - i / 22))}" ry="${f(37 * (1 - i / 22))}" fill="#1b333c" opacity="0.012"/>`).join("") : "";
    let labels = "";
    if (p.showLabels) {
      const anchors = geometry.layers.map(layer => {
        const candidates = [[-1, -1], [-1, 1], [1, -1], [1, 1]].map(([x, z]) => project([x * layer.width / 2, (layer.bottom + layer.top) / 2, z * layer.depth / 2]));
        return { layer, point: candidates.sort((a, b) => b[0] - a[0])[0] };
      }).sort((a, b) => a.point[1] - b.point[1]);
      const labelYs = anchors.map((item, i) => Math.max(72 + i * 62, Math.min(692 - (anchors.length - 1 - i) * 62, item.point[1])));
      for (let i = 1; i < labelYs.length; i++) labelYs[i] = Math.max(labelYs[i], labelYs[i - 1] + 62);
      const textColor = parseInt(p.background.slice(1, 3), 16) < 90 ? "#edf4ee" : "#29444b";
      anchors.forEach(({ layer, point }, i) => {
        const y = labelYs[i], lines = labelLines(layer.name), start = y - (lines.length - 1) * 10;
        labels += `<g data-layer-label="${layer.index}"><path d="M${f(point[0])},${f(point[1])} L700,${f(y)} L723,${f(y)}" fill="none" stroke="${tint(layer.color, 0.15)}" stroke-width="1.5"/><circle cx="${f(point[0])}" cy="${f(point[1])}" r="3" fill="${tint(layer.color, 0.2)}"/><text x="736" y="${f(start + 6)}" fill="${textColor}" font-size="18">${lines.map((line, j) => `<tspan x="736" dy="${j ? 20 : 0}">${escape(line)}</tspan>`).join("")}</text></g>`;
      });
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="760" viewBox="0 0 1000 760" role="img" aria-labelledby="device-svg-title device-svg-description"><title id="device-svg-title">Layered perovskite device · ${escape(classify(p.layers))}</title><desc id="device-svg-description">Conceptual orthographic layer stack, bottom to top: ${escape(p.layers.map(layer => layer.name).join(" / "))}. Thicknesses, separation and colors are visual parameters, not measured material data. Optional lattice uses uniformly scaled ideal corner-sharing BX6 octahedra.</desc><defs>${definitions.join("")}</defs>${options.transparent ? "" : `<rect width="1000" height="760" fill="${p.background}"/>`}<g font-family="Microsoft YaHei, Noto Sans SC, PingFang SC, Arial, sans-serif">${shadow}${scene.map(item => item.markup).join("")}${labels}</g></svg>`;
  }
  return { roles, styles, defaults, limits, preset, normalize, classify, buildGeometry, buildLattice, renderSVG };
});