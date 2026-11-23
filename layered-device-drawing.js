(function () {
  "use strict";
  const model = window.LayeredDeviceDrawing, $ = id => document.getElementById(id);
  if (!model || !$("device-canvas")) return;
  const copy = {
    zh: {
      drawingType: "绘图类型", crystalMode: "晶体结构", deviceMode: "器件层状结构", layerStack: "器件层序", preset: "层序预设", custom: "自定义", orderNote: "列表从上到下对应器件顶部至基底；点击一层进行编辑。", chooseLayer: "选择器件层",
      moveUp: "向器件顶部移动所选层", moveDown: "向基底移动所选层", remove: "删除该层", add: "添加层", selectedLayer: "所选层", name: "层名称", role: "功能类型", thickness: "相对厚度", color: "该层颜色", opacity: "不透明度", coverage: "平面尺寸比例",
      scaleNote: "厚度、平面尺寸和间距均为绘图相对值，不代表实测尺寸；预设中的 HTL/ETL 为功能层占位名称。", appearance: "主页概念图风格", style: "配色预设", homeStyle: "主页柔光 · 酒红与石墨", paperStyle: "清爽投稿 · 蓝绿", coverStyle: "深色封面", gap: "层间距", width: "基准宽度", depth: "基准深度", background: "画布底色",
      lattice: "吸收层晶格", labels: "层名称标注", softLight: "柔光", shadow: "柔和投影", rotation: "精确视角", preview: "器件预览", deviceTitle: "器件层状结构", viewControls: "器件视图控制", assembled: "组装视图", exploded: "爆炸视图", isometric: "立体视角", front: "正视", top: "俯视", reset: "重置视角", zoomIn: "放大器件", zoomOut: "缩小器件", viewport: "可旋转器件视图",
      help: "拖动旋转 · 滚轮缩放 · 双击复位。方向键旋转，+/− 缩放，0 复位。", conceptNote: "概念示意，层厚与间距不按实际尺度；晶格为等比例缩放的理想共顶点 BX₆ 正八面体。", summary: "基底 → 顶部：", layers: "层", ready: "器件绘图区已就绪。", updated: "器件预览已更新。", invalid: "请使用 1–32 字符的层名称，并检查各数值范围。",
      role_substrate: "基底", role_tco: "透明导电层", role_htl: "空穴传输层", role_absorber: "钙钛矿吸收层", role_interlayer: "界面层", role_etl: "电子传输层", role_electrode: "电极", role_custom: "其他"
    },
    en: {
      drawingType: "Drawing type", crystalMode: "Crystal structure", deviceMode: "Layered device", layerStack: "Device layer stack", preset: "Stack preset", custom: "Custom", orderNote: "The list runs from the device top to the substrate. Select a layer to edit it.", chooseLayer: "Select a device layer",
      moveUp: "Move selected layer toward the top", moveDown: "Move selected layer toward the substrate", remove: "Remove layer", add: "Add layer", selectedLayer: "Selected layer", name: "Layer name", role: "Function", thickness: "Relative thickness", color: "Layer color", opacity: "Opacity", coverage: "Lateral size ratio",
      scaleNote: "Thickness, lateral size and spacing are visual ratios, not measured dimensions. HTL/ETL are functional placeholder names.", appearance: "Homepage concept style", style: "Color preset", homeStyle: "Homepage · burgundy & graphite", paperStyle: "Paper · blue & teal", coverStyle: "Dark cover", gap: "Layer separation", width: "Base width", depth: "Base depth", background: "Background",
      lattice: "Absorber lattice", labels: "Layer labels", softLight: "Soft lighting", shadow: "Soft shadow", rotation: "Precise view", preview: "Device preview", deviceTitle: "Layered device", viewControls: "Device view controls", assembled: "Assembled", exploded: "Exploded", isometric: "3D view", front: "Front", top: "Top", reset: "Reset view", zoomIn: "Zoom device in", zoomOut: "Zoom device out", viewport: "Rotatable device view",
      help: "Drag to rotate · scroll to zoom · double-click to reset. Arrows rotate, +/− zoom, 0 resets.", conceptNote: "Conceptual illustration; thicknesses and gaps are not to scale. The lattice uses uniformly scaled ideal corner-sharing BX₆ octahedra.", summary: "Substrate → top: ", layers: "layers", ready: "Device studio ready.", updated: "Device preview updated.", invalid: "Use a 1–32 character layer name and check the numeric limits.",
      role_substrate: "Substrate", role_tco: "Transparent contact", role_htl: "Hole transport layer", role_absorber: "Perovskite absorber", role_interlayer: "Interlayer", role_etl: "Electron transport layer", role_electrode: "Electrode", role_custom: "Other"
    },
    de: {
      drawingType: "Zeichnungstyp", crystalMode: "Kristallstruktur", deviceMode: "Schichtstruktur", layerStack: "Schichtfolge", preset: "Schichtvorlage", custom: "Benutzerdefiniert", orderNote: "Die Liste reicht von oben bis zum Substrat. Eine Schicht zum Bearbeiten auswählen.", chooseLayer: "Bauteilschicht auswählen",
      moveUp: "Gewählte Schicht nach oben verschieben", moveDown: "Gewählte Schicht zum Substrat verschieben", remove: "Entfernen", add: "Hinzufügen", selectedLayer: "Gewählte Schicht", name: "Schichtname", role: "Funktion", thickness: "Relative Dicke", color: "Schichtfarbe", opacity: "Deckkraft", coverage: "Laterales Größenverhältnis",
      scaleNote: "Dicke, laterale Größe und Abstand sind Darstellungsverhältnisse, keine Messwerte. HTL/ETL sind funktionale Platzhalter.", appearance: "Stil der Homepage-Grafiken", style: "Farbvorlage", homeStyle: "Homepage · Bordeaux & Graphit", paperStyle: "Publikation · Blau & Petrol", coverStyle: "Dunkles Cover", gap: "Schichtabstand", width: "Referenzbreite", depth: "Referenztiefe", background: "Hintergrund",
      lattice: "Absorbergitter", labels: "Schichtnamen", softLight: "Weiches Licht", shadow: "Weicher Schatten", rotation: "Exakte Ansicht", preview: "Bauteilvorschau", deviceTitle: "Schichtstruktur", viewControls: "Ansichtssteuerung", assembled: "Zusammengebaut", exploded: "Explosionsansicht", isometric: "3D-Ansicht", front: "Vorne", top: "Oben", reset: "Zurücksetzen", zoomIn: "Bauteil vergrößern", zoomOut: "Bauteil verkleinern", viewport: "Drehbare Bauteilansicht",
      help: "Ziehen: drehen · Mausrad: zoomen · Doppelklick: zurücksetzen. Pfeile drehen, +/− zoomen, 0 setzt zurück.", conceptNote: "Konzeptgrafik; Dicken und Abstände sind nicht maßstabsgetreu. Das Gitter nutzt gleichmäßig skalierte ideale eckenverknüpfte BX₆-Oktaeder.", summary: "Substrat → Oberseite: ", layers: "Schichten", ready: "Schichtstudio bereit.", updated: "Bauteilvorschau aktualisiert.", invalid: "Schichtnamen mit 1–32 Zeichen verwenden und Zahlenbereiche prüfen.",
      role_substrate: "Substrat", role_tco: "Transparenter Kontakt", role_htl: "Lochtransportschicht", role_absorber: "Perowskitabsorber", role_interlayer: "Zwischenschicht", role_etl: "Elektronentransportschicht", role_electrode: "Elektrode", role_custom: "Andere"
    }
  };
  let language = document.documentElement.lang.startsWith("zh") ? "zh" : document.documentElement.lang;
  if (!copy[language]) language = "zh";
  let params = model.normalize(), selected = 3, active = false, frame = 0, refreshEditor = true, drag = null;
  const text = key => copy[language][key], viewport = $("device-viewport");
  function status(key, error = false) {
    const node = $("drawing-status"), value = text(key);
    if (node.textContent !== value) node.textContent = value;
    node.dataset.error = String(error);
  }
  function editFields() {
    const layer = params.layers[selected];
    document.querySelectorAll("[data-device-field]").forEach(input => { input.value = layer[input.dataset.deviceField]; });
  }
  function render() {
    frame = 0;
    $("device-canvas").innerHTML = model.renderSVG(params, { selectedIndex: selected });
    viewport.style.backgroundColor = params.background;
    const focusedLayer = document.activeElement?.closest("[data-device-index]")?.dataset.deviceIndex;
    $("device-layer-list").replaceChildren(...params.layers.map((layer, index) => {
      const button = document.createElement("button"), color = document.createElement("i"), label = document.createElement("span"), name = document.createElement("strong"), role = document.createElement("small");
      button.type = "button"; button.dataset.deviceIndex = index; button.setAttribute("aria-pressed", String(index === selected));
      color.style.backgroundColor = layer.color; color.setAttribute("aria-hidden", "true");
      name.textContent = layer.name; role.textContent = text("role_" + layer.role);
      label.append(name, role); button.append(color, label); return button;
    }).reverse());
    if (focusedLayer !== undefined) $("device-layer-list").querySelector(`[data-device-index="${selected}"]`)?.focus({ preventScroll: true });
    $("device-up").disabled = selected === params.layers.length - 1;
    $("device-down").disabled = selected === 0;
    $("device-remove").disabled = params.layers.length <= 2;
    $("device-add").disabled = params.layers.length >= 10;
    if (refreshEditor) { editFields(); refreshEditor = false; }
    $("device-opacity-value").textContent = Math.round(params.layers[selected].opacity * 100) + "%";
    $("device-coverage-value").textContent = params.layers[selected].coverage.toFixed(2);
    document.querySelectorAll("[data-device-param]").forEach(input => {
      const key = input.dataset.deviceParam;
      if (input.type === "checkbox") input.checked = params[key]; else input.value = params[key];
      const output = $("device-" + key + "-value");
      if (output) output.textContent = /^r[xyz]$/.test(key) ? Math.round(params[key]) + "°" : params[key].toFixed(key === "gap" ? 2 : 1);
    });
    const kind = model.classify(params.layers);
    $("device-stack-badge").textContent = `${kind === "custom" ? text("custom") : kind} · ${params.layers.length} ${text("layers")}`;
    const summary = text("summary") + params.layers.map(layer => layer.name).join(" / ");
    if ($("device-stack-summary").textContent !== summary) $("device-stack-summary").textContent = summary;
    $("device-assemble").setAttribute("aria-pressed", String(params.gap === 0));
    $("device-explode").setAttribute("aria-pressed", String(params.gap > 0));
  }
  function schedule(editor = false) { refreshEditor ||= editor; if (!frame) frame = requestAnimationFrame(render); }
  function change(next, editor = false) {
    try { params = model.normalize({ ...params, ...next }); schedule(editor); if (active) status("updated"); return true; }
    catch { status("invalid", true); return false; }
  }
  function setMode(device) {
    active = device;
    $("crystal-settings").hidden = $("crystal-preview").hidden = device;
    $("device-settings").hidden = $("device-preview").hidden = !device;
    $("drawing-mode-crystal").setAttribute("aria-pressed", String(!device));
    $("drawing-mode-device").setAttribute("aria-pressed", String(device));
    try {
      const url = new URL(location.href);
      if (device) url.searchParams.set("mode", "device"); else url.searchParams.delete("mode");
      history.replaceState(null, "", url);
      document.querySelectorAll("[data-lang]").forEach(link => { const target = new URL(link.href); if (device) target.searchParams.set("mode", "device"); else target.searchParams.delete("mode"); link.href = target; });
    } catch { /* Local file previews can restrict history. */ }
    if (device) { render(); status("ready"); }
    else { $("drawing-status").textContent = ""; $("drawing-status").dataset.error = "false"; }
  }
  function translate(next) {
    if (copy[next]) language = next;
    document.querySelectorAll("[data-device-i18n]").forEach(node => { node.textContent = text(node.dataset.deviceI18n); });
    document.querySelectorAll("[data-device-label]").forEach(node => { node.setAttribute("aria-label", text(node.dataset.deviceLabel)); });
    $("device-layer-role").replaceChildren(...model.roles.map(role => { const option = document.createElement("option"); option.value = role; option.textContent = text("role_" + role); return option; }));
    refreshEditor = true; render(); if (active) status("ready");
  }
  window.addEventListener("drawing-language", event => translate(event.detail.lang));
  $("drawing-mode-crystal").addEventListener("click", () => setMode(false));
  $("drawing-mode-device").addEventListener("click", () => setMode(true));
  $("device-layer-list").addEventListener("click", event => { const button = event.target.closest("[data-device-index]"); if (button) { selected = Number(button.dataset.deviceIndex); schedule(true); } });
  $("device-settings").addEventListener("input", event => {
    const input = event.target, field = input.dataset.deviceField, key = input.dataset.deviceParam;
    if (field) {
      const layers = params.layers.map(layer => ({ ...layer }));
      layers[selected][field] = ["thickness", "opacity", "coverage"].includes(field) ? input.value === "" ? NaN : Number(input.value) : input.value;
      if (change({ layers })) { $("device-preset").value = ""; if (field === "color") $("device-style").value = ""; }
    } else if (key) {
      const value = input.type === "checkbox" ? input.checked : input.type === "range" ? Number(input.value) : input.value;
      if (change({ [key]: value }) && key === "background") $("device-style").value = "";
    }
  });
  $("device-preset").addEventListener("change", event => {
    if (!event.target.value) return;
    const colors = (model.styles[$("device-style").value] || model.styles.home).colors;
    selected = 3; change({ layers: model.preset(event.target.value).map(layer => ({ ...layer, color: colors[layer.role] })) }, true);
  });
  $("device-style").addEventListener("change", event => { const style = model.styles[event.target.value]; if (style) change({ background: style.background, layers: params.layers.map(layer => ({ ...layer, color: style.colors[layer.role] })) }, true); });
  $("device-add").addEventListener("click", () => {
    if (params.layers.length >= 10) return;
    const layers = params.layers.map(layer => ({ ...layer }));
    layers.splice(selected + 1, 0, { name: "Interlayer", role: "interlayer", thickness: 0.04, coverage: 1, color: "#c2a374", opacity: 0.65 });
    selected++; change({ layers }, true); $("device-preset").value = "";
  });
  $("device-remove").addEventListener("click", () => {
    if (params.layers.length <= 2) return;
    const layers = params.layers.filter((_, index) => index !== selected); selected = Math.min(selected, layers.length - 1);
    change({ layers }, true); $("device-preset").value = "";
  });
  function move(delta) {
    const target = selected + delta; if (target < 0 || target >= params.layers.length) return;
    const layers = params.layers.map(layer => ({ ...layer }));
    [layers[target], layers[selected]] = [layers[selected], layers[target]]; selected = target;
    change({ layers }, true); $("device-preset").value = "";
  }
  $("device-up").addEventListener("click", () => move(1));
  $("device-down").addEventListener("click", () => move(-1));
  $("device-assemble").addEventListener("click", () => change({ gap: 0 }));
  $("device-explode").addEventListener("click", () => change({ gap: model.defaults.gap }));
  const reset = () => change({ rx: model.defaults.rx, ry: model.defaults.ry, rz: model.defaults.rz, zoom: 1 });
  const zoom = factor => change({ zoom: Math.max(0.45, Math.min(2.4, params.zoom * factor)) });
  const wrap = angle => ((angle + 180) % 360 + 360) % 360 - 180;
  $("device-iso").addEventListener("click", reset);
  $("device-reset").addEventListener("click", reset);
  $("device-front").addEventListener("click", () => change({ rx: 0, ry: 0, rz: 0, zoom: 1 }));
  $("device-top").addEventListener("click", () => change({ rx: 90, ry: 0, rz: 0, zoom: 1 }));
  $("device-zoom-in").addEventListener("click", () => zoom(1.15));
  $("device-zoom-out").addEventListener("click", () => zoom(1 / 1.15));
  viewport.addEventListener("dblclick", reset);
  viewport.addEventListener("wheel", event => { if (event.deltaY) { event.preventDefault(); zoom(event.deltaY < 0 ? 1.08 : 1 / 1.08); } }, { passive: false });
  viewport.addEventListener("pointerdown", event => {
    if (event.button !== 0 || event.isPrimary === false) return;
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY, rx: params.rx, ry: params.ry };
    viewport.classList.add("is-dragging"); viewport.focus({ preventScroll: true });
    try { viewport.setPointerCapture(event.pointerId); } catch { /* Embedded previews may not support capture. */ }
  });
  viewport.addEventListener("pointermove", event => { if (drag && drag.id === event.pointerId) change({ rx: wrap(drag.rx + (event.clientY - drag.y) * 0.4), ry: wrap(drag.ry + (event.clientX - drag.x) * 0.4) }); });
  ["pointerup", "pointercancel", "lostpointercapture"].forEach(name => viewport.addEventListener(name, event => { if (drag?.id === event.pointerId) { drag = null; viewport.classList.remove("is-dragging"); } }));
  viewport.addEventListener("keydown", event => {
    if (event.key === "ArrowLeft") change({ ry: wrap(params.ry - 5) });
    else if (event.key === "ArrowRight") change({ ry: wrap(params.ry + 5) });
    else if (event.key === "ArrowUp") change({ rx: wrap(params.rx - 5) });
    else if (event.key === "ArrowDown") change({ rx: wrap(params.rx + 5) });
    else if (["+", "="].includes(event.key)) zoom(1.15);
    else if (["-", "−"].includes(event.key)) zoom(1 / 1.15);
    else if (event.key === "0") reset();
    else return;
    event.preventDefault();
  });
  window.LayeredDeviceUI = {
    isActive: () => active,
    snapshot: transparent => ({ svg: model.renderSVG(params, { transparent }), name: `device-${model.classify(params.layers)}-${params.gap ? "exploded" : "assembled"}` })
  };
  translate(language);
  setMode(new URLSearchParams(location.search).get("mode") === "device");
})();