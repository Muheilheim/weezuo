(function () {
  "use strict";
  const model = window.PerovskiteDrawing;
  const byId = id => document.getElementById(id);
  if (!model || !byId("drawing-canvas")) return;
  const copy = {
    zh: {
      skip: "跳转到绘图区", studio: "科研绘图区", navigation: "导航", language: "语言", home: "返回主页", theme: "切换明暗主题", heading: "科研插图，从这里开始",
      intro: "绘制钙钛矿晶体或器件层状结构，自定义配色与视角。所有绘制与导出均在本机完成。", settings: "绘图设置", structure: "组成与超胞", compound: "组成预设", custom: "自定义", cells: "超胞尺寸",
      ideal: "理想立方 ABX₃（Pm3̅m）示意。BX₆ 正八面体共顶点连接。更换元素不判定物相或稳定性；MA/FA 以球体简化表示。",
      appearance: "配色与光影", style: "风格预设", reference: "旧图柔光 · 青绿与暗红", paper: "清爽投稿 · 蓝与金", cover: "深色封面 · 烟蓝与珊瑚", siteColor: "位点 / 颜色", size: "相对球半径",
      aColor: "A 位颜色", bColor: "B 位颜色", xColor: "X 位颜色", aScale: "A 位相对半径", bScale: "B 位相对半径", xScale: "X 位相对半径",
      faces: "八面体面色", opacity: "面不透明度", edges: "八面体边色", edgeWidth: "边线宽度", background: "画布底色",
      showOcta: "BX₆ 八面体", showBonds: "B–X 键", showA: "A 位原子", showCell: "晶胞框架", showLabels: "原子标签", showAxes: "晶轴方向", shaded: "球面柔光", shadow: "柔和投影",
      radiusNote: "半径仅控制视觉尺寸，不代表离子半径。旧图预设提取既有参考图的配色与柔光特征。", rotation: "精确视角", rx: "绕 X 轴旋转视角", ry: "绕 Y 轴旋转视角", rz: "绕 Z 轴旋转视角",
      export: "导出插图", resolution: "PNG 宽度", transparent: "透明背景", png: "导出 PNG", svg: "导出 SVG", exportNote: "按当前视角导出。SVG 可继续编辑；透明背景会保留开启的投影。",
      preview: "晶体预览", live: "LIVE CANVAS / 实时预览", views: "视角控制", alongA: "沿 a 轴", alongB: "沿 b 轴", alongC: "沿 c 轴", iso: "等轴测", reset: "重置视角", zoomIn: "放大", zoomOut: "缩小", viewport: "可旋转晶体视图", legend: "位点图例",
      help: "拖动旋转 · 滚轮缩放 · 双击复位。键盘：方向键旋转，+/− 缩放，0 复位。", loading: "正在准备晶体…", caption: "角点 A · 体心 B · 面心 X。边界加权后 A:B:X = 1:1:3。",
      approximation: "正交投影示意；透明面的遮挡为近似排序，适合结构说明图。", tools: "返回光伏分析工具 →", counts: "显示球体 A {a} · B {b} · X {x}（含边界）",
      ready: "绘图区已就绪。", exporting: "正在生成 PNG…", downloaded: "已发起图片下载。", failed: "导出失败，请重试或改用 SVG。", invalid: "参数超出范围，请检查设置。",
      rulesTitle: "结构依据与绘图范围", rulesBody: "每个 BX₆ 单元含 6 个 X 顶点、8 个等边三角面和 12 条等长边；相邻单元共用 X 顶点，A 位处于十二配位空隙。这里绘制理想立方模型，不模拟真实材料的八面体倾斜、键长畸变或分子取向。", sources: "结构参考"
    },
    en: {
      skip: "Skip to drawing", studio: "Structure studio", navigation: "Navigation", language: "Language", home: "Back to home", theme: "Toggle light or dark theme", heading: "Research figures, from crystal to device",
      intro: "Draw perovskite crystals or layered devices with your own colors and view. Drawing and export run locally in your browser.", settings: "Drawing settings", structure: "Composition & supercell", compound: "Composition", custom: "Custom", cells: "Supercell",
      ideal: "Ideal cubic ABX₃ (Pm3̅m) schematic with corner-sharing regular BX₆ octahedra. Element choices do not predict phase or stability. MA/FA are simplified spheres.",
      appearance: "Color & lighting", style: "Style preset", reference: "Reference · teal & burgundy", paper: "Paper · blue & gold", cover: "Cover · smoke blue & coral", siteColor: "Site / color", size: "Relative ball radius",
      aColor: "A-site color", bColor: "B-site color", xColor: "X-site color", aScale: "A-site relative radius", bScale: "B-site relative radius", xScale: "X-site relative radius",
      faces: "Octahedron faces", opacity: "Face opacity", edges: "Octahedron edges", edgeWidth: "Edge width", background: "Canvas background",
      showOcta: "BX₆ octahedra", showBonds: "B–X bonds", showA: "A sites", showCell: "Cell framework", showLabels: "Atom labels", showAxes: "Crystal axes", shaded: "Soft lighting", shadow: "Soft shadow",
      radiusNote: "Radii control visual size, not ionic radii. The reference preset draws on the colors and soft lighting of earlier supplied figures.", rotation: "Precise view", rx: "Rotate view around X", ry: "Rotate view around Y", rz: "Rotate view around Z",
      export: "Export figure", resolution: "PNG width", transparent: "Transparent background", png: "Export PNG", svg: "Export SVG", exportNote: "Exports the current view. SVG stays editable; transparent export retains an enabled shadow.",
      preview: "Crystal preview", live: "LIVE CANVAS", views: "View controls", alongA: "Along a", alongB: "Along b", alongC: "Along c", iso: "Isometric", reset: "Reset view", zoomIn: "Zoom in", zoomOut: "Zoom out", viewport: "Rotatable crystal view", legend: "Site legend",
      help: "Drag to rotate · scroll to zoom · double-click to reset. Keyboard: arrows rotate, +/− zoom, 0 resets.", loading: "Preparing the crystal…", caption: "A at corners · B at body centers · X at face centers. Boundary-weighted A:B:X = 1:1:3.",
      approximation: "Orthographic schematic; transparent surfaces use approximate depth ordering.", tools: "Back to photovoltaic analysis →", counts: "Displayed spheres A {a} · B {b} · X {x} (including boundaries)",
      ready: "Drawing studio ready.", exporting: "Generating PNG…", downloaded: "Image download requested.", failed: "Export failed. Retry or use SVG.", invalid: "Parameter out of range. Check the settings.",
      rulesTitle: "Structure & drawing scope", rulesBody: "Each BX₆ unit has 6 X vertices, 8 equilateral triangular faces and 12 equal edges. Neighboring units share X vertices; A sites occupy twelve-coordinate cavities. This ideal cubic model does not simulate octahedral tilts, bond-length distortions or molecular orientations.", sources: "Structure references"
    },
    de: {
      skip: "Zur Zeichenfläche", studio: "Strukturstudio", navigation: "Navigation", language: "Sprache", home: "Zur Startseite", theme: "Helles oder dunkles Design", heading: "Kristalle und Schichtstapel gestalten",
      intro: "Perowskitkristalle und Schichtstapel mit eigenen Farben und Ansichten gestalten. Zeichnen und Export erfolgen lokal im Browser.", settings: "Zeicheneinstellungen", structure: "Zusammensetzung & Superzelle", compound: "Zusammensetzung", custom: "Benutzerdefiniert", cells: "Superzelle",
      ideal: "Ideales kubisches ABX₃ (Pm3̅m) mit eckenverknüpften regulären BX₆-Oktaedern. Die Elementwahl sagt weder Phase noch Stabilität voraus. MA/FA werden als Kugeln dargestellt.",
      appearance: "Farben & Licht", style: "Stilvorlage", reference: "Referenz · Petrol & Bordeaux", paper: "Publikation · Blau & Gold", cover: "Cover · Rauchblau & Koralle", siteColor: "Position / Farbe", size: "Relativer Kugelradius",
      aColor: "Farbe der A-Position", bColor: "Farbe der B-Position", xColor: "Farbe der X-Position", aScale: "Relativer Radius A", bScale: "Relativer Radius B", xScale: "Relativer Radius X",
      faces: "Oktaederflächen", opacity: "Deckkraft", edges: "Oktaederkanten", edgeWidth: "Kantenbreite", background: "Hintergrund",
      showOcta: "BX₆-Oktaeder", showBonds: "B–X-Bindungen", showA: "A-Positionen", showCell: "Zellgerüst", showLabels: "Atomsymbole", showAxes: "Kristallachsen", shaded: "Weiches Licht", shadow: "Weicher Schatten",
      radiusNote: "Die Radien bestimmen nur die Darstellung, nicht die Ionenradien. Die Referenzvorlage übernimmt Farben und weiches Licht früherer Vorlagen.", rotation: "Exakte Ansicht", rx: "Ansicht um X drehen", ry: "Ansicht um Y drehen", rz: "Ansicht um Z drehen",
      export: "Abbildung exportieren", resolution: "PNG-Breite", transparent: "Transparenter Hintergrund", png: "PNG exportieren", svg: "SVG exportieren", exportNote: "Exportiert die aktuelle Ansicht. SVG bleibt editierbar; ein aktivierter Schatten bleibt bei Transparenz erhalten.",
      preview: "Kristallvorschau", live: "LIVE-VORSCHAU", views: "Ansichtssteuerung", alongA: "Entlang a", alongB: "Entlang b", alongC: "Entlang c", iso: "Isometrisch", reset: "Zurücksetzen", zoomIn: "Vergrößern", zoomOut: "Verkleinern", viewport: "Drehbare Kristallansicht", legend: "Positionslegende",
      help: "Ziehen: drehen · Mausrad: zoomen · Doppelklick: zurücksetzen. Tastatur: Pfeile drehen, +/− zoomen, 0 setzt zurück.", loading: "Kristall wird vorbereitet…", caption: "A an Ecken · B im Raumzentrum · X in Flächenmitten. Randgewichtet A:B:X = 1:1:3.",
      approximation: "Orthogonale Projektion mit näherungsweiser Tiefensortierung transparenter Flächen.", tools: "Zur Photovoltaikanalyse →", counts: "Gezeigte Kugeln A {a} · B {b} · X {x} (einschließlich Randatomen)",
      ready: "Strukturstudio bereit.", exporting: "PNG wird erstellt…", downloaded: "Bilddownload angefordert.", failed: "Export fehlgeschlagen. Erneut versuchen oder SVG verwenden.", invalid: "Parameter außerhalb des Bereichs. Einstellungen prüfen.",
      rulesTitle: "Struktur und Darstellungsumfang", rulesBody: "Jede BX₆-Einheit hat 6 X-Ecken, 8 gleichseitige Dreiecksflächen und 12 gleich lange Kanten. Benachbarte Einheiten teilen X-Ecken; A liegt in zwölffach koordinierten Hohlräumen. Das ideale kubische Modell simuliert weder Oktaederkippungen noch Bindungslängenverzerrungen oder Molekülorientierungen.", sources: "Strukturquellen"
    }
  };
  let lang = new URLSearchParams(location.search).get("lang");
  if (!Object.hasOwn(copy, lang)) lang = "zh";
  let params = { ...model.defaults }, frame = 0, drag = null, exportBusy = false;
  const canvasHost = byId("drawing-canvas"), viewport = byId("drawing-viewport");
  const text = key => copy[lang][key];
  function status(key, error = false) {
    byId("drawing-status").textContent = text(key);
    byId("drawing-status").dataset.error = String(error);
  }
  function syncControls() {
    document.querySelectorAll("[data-param]").forEach(input => {
      const key = input.dataset.param;
      if (input.type === "checkbox") input.checked = params[key];
      else input.value = params[key];
      const output = byId(key + "-value");
      if (output) output.textContent = key === "faceOpacity" ? Math.round(params[key] * 100) + "%" : /Scale$/.test(key) ? params[key].toFixed(2) : /^r[xyz]$/.test(key) ? Math.round(params[key]) + "°" : params[key].toFixed(1);
    });
    const compound = [params.a, params.b, params.x].join("|");
    byId("compound").value = Array.from(byId("compound").options).some(o => o.value === compound) ? compound : "";
  }
  function render() {
    frame = 0;
    canvasHost.innerHTML = model.renderSVG(params);
    viewport.style.backgroundColor = params.background;
    byId("drawing-formula").textContent = model.formula(params);
    byId("drawing-cell-badge").textContent = Array(3).fill(params.cells).join(" × ");
    const counts = model.buildGeometry(params.cells).counts;
    const message = text("counts").replace("{a}", params.showA ? counts.a : 0).replace("{b}", counts.b).replace("{x}", counts.x);
    if (byId("drawing-counts").textContent !== message) byId("drawing-counts").textContent = message;
    byId("drawing-legend").replaceChildren(...["a", "b", "x"].map(site => {
      const span = document.createElement("span"), dot = document.createElement("i");
      dot.style.backgroundColor = params[site + "Color"];
      dot.setAttribute("aria-hidden", "true");
      span.append(dot, `${site.toUpperCase()} · ${params[site]}`);
      return span;
    }));
    syncControls();
  }
  function schedule() { if (!frame) frame = requestAnimationFrame(render); }
  function change(next, manual = false) {
    try {
      params = model.normalize({ ...params, ...next });
      if (manual) document.querySelectorAll("[data-view]").forEach(button => button.setAttribute("aria-pressed", "false"));
      schedule();
    } catch { status("invalid", true); }
  }
  function setLanguage(next) {
    lang = next;
    document.documentElement.lang = next === "zh" ? "zh-CN" : next;
    document.title = text("studio") + " · Weiwei Zuo";
    document.querySelector('meta[name="description"]').content = text("intro");
    document.querySelectorAll("[data-i18n]").forEach(node => { node.textContent = text(node.dataset.i18n); });
    document.querySelectorAll("[data-label]").forEach(node => { node.setAttribute("aria-label", text(node.dataset.label)); });
    document.querySelectorAll("[data-lang]").forEach(link => {
      if (link.dataset.lang === lang) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
    const home = lang === "en" ? "./index.html" : `./${lang}.html`;
    byId("home-link").href = byId("drawing-brand").href = home;
    byId("tools-link").href = home + "#solar-cell-tools";
    try { const url = new URL(location.href); url.searchParams.set("lang", lang); history.replaceState(null, "", url); } catch { /* File previews can restrict history. */ }
    status(exportBusy ? "exporting" : "ready");
    render();
    window.dispatchEvent(new CustomEvent("drawing-language", { detail: { lang } }));
  }
  document.querySelectorAll("[data-lang]").forEach(link => link.addEventListener("click", event => { event.preventDefault(); setLanguage(link.dataset.lang); }));
  document.querySelector(".drawing-settings").addEventListener("input", event => {
    const input = event.target, key = input.dataset.param;
    if (!key) return;
    const value = input.type === "checkbox" ? input.checked : input.type === "range" || key === "cells" ? Number(input.value) : input.value;
    change({ [key]: value }, /^r[xyz]$/.test(key));
    if (/Color$|background|faceOpacity/.test(key)) byId("drawing-style").value = "";
  });
  byId("compound").addEventListener("change", event => {
    if (!event.target.value) return;
    const [a, b, x] = event.target.value.split("|");
    change({ a, b, x });
  });
  byId("drawing-style").addEventListener("change", event => { if (model.styles[event.target.value]) change(model.styles[event.target.value]); });
  const views = { a: { rx: 0, ry: 90, rz: 0 }, b: { rx: 90, ry: 0, rz: 0 }, c: { rx: 0, ry: 0, rz: 0 }, iso: { rx: 35.264, ry: -45, rz: 0 } };
  document.querySelectorAll("[data-view]").forEach(button => button.addEventListener("click", () => {
    change({ ...views[button.dataset.view], zoom: 1 });
    document.querySelectorAll("[data-view]").forEach(b => b.setAttribute("aria-pressed", String(b === button)));
  }));
  function resetView() { change({ rx: model.defaults.rx, ry: model.defaults.ry, rz: model.defaults.rz, zoom: 1 }, true); }
  function zoom(factor) { change({ zoom: Math.max(0.45, Math.min(2.4, params.zoom * factor)) }); }
  const wrap = angle => ((angle + 180) % 360 + 360) % 360 - 180;
  byId("reset-view").addEventListener("click", resetView);
  byId("zoom-in").addEventListener("click", () => zoom(1.15));
  byId("zoom-out").addEventListener("click", () => zoom(1 / 1.15));
  viewport.addEventListener("dblclick", resetView);
  viewport.addEventListener("wheel", event => { if (!event.deltaY) return; event.preventDefault(); zoom(event.deltaY > 0 ? 1 / 1.08 : 1.08); }, { passive: false });
  viewport.addEventListener("pointerdown", event => {
    if (event.button !== 0 || event.isPrimary === false) return;
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY, rx: params.rx, ry: params.ry };
    viewport.classList.add("is-dragging");
    viewport.focus({ preventScroll: true });
    try { viewport.setPointerCapture(event.pointerId); } catch { /* Capture may be unavailable in embedded previews. */ }
  });
  viewport.addEventListener("pointermove", event => {
    if (!drag || drag.id !== event.pointerId) return;
    change({ rx: wrap(drag.rx + (event.clientY - drag.y) * 0.4), ry: wrap(drag.ry + (event.clientX - drag.x) * 0.4) }, true);
  });
  function endDrag(event) {
    if (!drag || event.pointerId !== drag.id) return;
    drag = null;
    viewport.classList.remove("is-dragging");
  }
  ["pointerup", "pointercancel", "lostpointercapture"].forEach(name => viewport.addEventListener(name, endDrag));
  viewport.addEventListener("keydown", event => {
    const rotations = { ArrowLeft: { ry: wrap(params.ry - 5) }, ArrowRight: { ry: wrap(params.ry + 5) }, ArrowUp: { rx: wrap(params.rx - 5) }, ArrowDown: { rx: wrap(params.rx + 5) } };
    if (rotations[event.key]) change(rotations[event.key], true);
    else if (event.key === "+" || event.key === "=") zoom(1.15);
    else if (event.key === "-" || event.key === "−") zoom(1 / 1.15);
    else if (event.key === "0") resetView();
    else return;
    event.preventDefault();
  });
  function download(blob, filename) {
    const url = URL.createObjectURL(blob), anchor = document.createElement("a");
    anchor.href = url; anchor.download = filename;
    document.body.append(anchor);
    try { anchor.click(); } finally { anchor.remove(); setTimeout(() => URL.revokeObjectURL(url), 3000); }
  }
  function snapshot() {
    const transparent = byId("export-transparent").checked;
    if (window.LayeredDeviceUI?.isActive()) return window.LayeredDeviceUI.snapshot(transparent);
    const name = `${params.a}${params.b}${params.x}3-${params.cells}x${params.cells}x${params.cells}${transparent ? "-transparent" : ""}`;
    return { svg: model.renderSVG(params, { transparent }), name };
  }
  byId("export-svg").addEventListener("click", () => {
    try {
      const { svg, name } = snapshot();
      download(new Blob(['<?xml version="1.0" encoding="UTF-8"?>\n', svg], { type: "image/svg+xml;charset=utf-8" }), name + ".svg");
      status("downloaded");
    } catch { status("failed", true); }
  });
  byId("export-png").addEventListener("click", async () => {
    if (exportBusy) return;
    let objectURL, image, timer;
    exportBusy = true;
    byId("export-png").disabled = byId("export-svg").disabled = true;
    status("exporting");
    try {
      const { svg, name } = snapshot(), width = Number(byId("export-width").value);
      if (![1200, 2400, 3600].includes(width)) throw new Error("Invalid resolution");
      image = new Image();
      objectURL = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }));
      await new Promise((resolve, reject) => {
        timer = setTimeout(() => reject(new Error("Image timeout")), 15000);
        image.onload = resolve; image.onerror = () => reject(new Error("SVG decode failed"));
        image.src = objectURL;
      });
      clearTimeout(timer);
      const canvas = document.createElement("canvas");
      canvas.width = width; canvas.height = Math.round(width * 0.76);
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Canvas unavailable");
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise((resolve, reject) => {
        timer = setTimeout(() => reject(new Error("PNG timeout")), 15000);
        canvas.toBlob(value => value ? resolve(value) : reject(new Error("PNG encode failed")), "image/png");
      });
      download(blob, name + ".png");
      status("downloaded");
    } catch { status("failed", true); }
    finally {
      clearTimeout(timer);
      if (image) { image.onload = null; image.onerror = null; }
      if (objectURL) URL.revokeObjectURL(objectURL);
      exportBusy = false;
      byId("export-png").disabled = byId("export-svg").disabled = false;
    }
  });
  let initialTheme;
  try { initialTheme = localStorage.getItem("weiwei-research-theme"); } catch { /* Private mode can restrict storage. */ }
  if (!["light", "dark"].includes(initialTheme)) initialTheme = window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  function setTheme(theme) {
    document.documentElement.dataset.theme = theme;
    byId("drawing-theme").setAttribute("aria-pressed", String(theme === "dark"));
  }
  setTheme(initialTheme);
  byId("drawing-theme").addEventListener("click", () => {
    const theme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    setTheme(theme);
    try { localStorage.setItem("weiwei-research-theme", theme); } catch { /* Drawing remains available without storage. */ }
  });
  setLanguage(lang);
})();