/* Shared controls for the expanded characterization workspaces. */
(function () {
  "use strict";
  const phase = window.PhaseModel;
  const extra = window.PhaseExtraModel;
  const reference = window.PhaseReference;
  const samples = window.PhaseSamples;
  const library = reference.xrd;
  const el = id => document.getElementById("phase-extra-" + id);
  const plot = window.PhasePlot.create(el("chart"), el("probe"));
  const secondary = window.PhasePlot.create(el("secondary-chart"), el("secondary-probe"));
  const mapCanvas = el("map-canvas");
  const dataByMode = new Map();
  const thermalUnits = {mW: "mW", Wg: "W/g", percent: "%", mg: "mg"};
  let active = "", context, mapProjection, lastResult, lastFile;

  const sources = {
    diffraction: [["diffSource", "https://pyfai.readthedocs.io/en/latest/usage/tutorial/FiberGrazingIncidence.html"],
      ["diffExampleSource", "https://pmc.ncbi.nlm.nih.gov/articles/PMC12603034/"]],
    dsc: [["dscSource", "https://goldbook.iupac.org/terms/view/D01708"], ["thermalStudy", "https://doi.org/10.1021/acs.chemmater.9b03190"]],
    tga: [["tgaSource", "https://goldbook.iupac.org/terms/view/T06324"], ["thermalStudy", "https://doi.org/10.1021/acs.chemmater.9b03190"]],
    xps: [["xpsSource", "https://pmc.ncbi.nlm.nih.gov/articles/PMC8303190/"],
      ["xpsConstraints", "https://doi.org/10.1063/5.0086359"]],
    saed: [["saedSource", "https://pmc.ncbi.nlm.nih.gov/articles/PMC12959404/"]]
  };

  function t(key, args) { return context.t(key, args); }
  function fmt(value, precision = 3) {
    if (!Number.isFinite(value)) return "—";
    if (value !== 0 && (Math.abs(value) < 10 ** (-precision) || Math.abs(value) > 1e7)) return value.toExponential(2);
    return new Intl.NumberFormat(context.locale, {maximumFractionDigits: precision, useGrouping: false}).format(value);
  }
  function node(tag, text, css) {
    const result = document.createElement(tag);
    if (text != null) result.textContent = text;
    if (css) result.className = css;
    return result;
  }

  function state() { return dataByMode.get(active); }

  function slot(mode, settings) {
    if (mode === "diffraction") return settings.kind + ":" + settings.axis;
    if (mode === "thermal") return settings.kind;
    return mode;
  }

  const options = () => state().settings;
  const record = () => state().files.get(slot(active, options()));
  const diffractionUnit = settings => settings.axis === "q" ? "Å⁻¹" : "°";
  const diffractionAxis = settings => t(settings.axis === "q" ? "qLabel" : "xrdX");

  function exampleKey(mode, settings) {
    const inputs = mode === "diffraction" ?
      [settings.axis === "angle" ? settings.wavelength : "", settings.kind === "series" ? settings.axisSeries : ""] :
      mode === "thermal" ? [settings.units, settings.units === "Wg" ? settings.mass : "", settings.sign] : [];
    return JSON.stringify([context.preset.id, ...inputs]);
  }

  function makeDemo(mode, target, retarget = false) {
    const settings = target.settings;
    if (mode === "thermal" && settings.kind === "dsc") {
      if (settings.mass === "") settings.mass = extra.models.thermal.mass;
      if (settings.ramp === "") settings.ramp = extra.models.thermal.ramp;
    }
    const where = slot(mode, settings);
    const existing = target.files.get(where);
    const demo = samples.dataForExtra(mode, context.preset, reference, settings, extra);
    target.examples.add(where);
    if (!demo) {
      target.files.delete(where);
      return;
    }
    const {data, source, traceAt} = demo;
    if (traceAt != null && (retarget || existing?.preset?.id !== context.preset.id)) settings.traceAt = traceAt;
    const file = {data, source, preset:context.preset, simulated:true, name:"", frame:(data.frames?.length ?? 1)-1,
      demoKey:exampleKey(mode, settings), traceAt:traceAt == null ? undefined : settings.traceAt};
    target.files.set(where, file);
    return file;
  }

  function syncDemo(mode, target) {
    const where = slot(mode, target.settings);
    const file = target.files.get(where);
    if (target.examples.has(where) && (!file || file.simulated && file.demoKey !== exampleKey(mode, target.settings))) {
      makeDemo(mode, target, mode === "diffraction");
    }
  }

  function ensure(mode) {
    if (dataByMode.has(mode)) return;
    const value = {settings: {...extra.models[mode]}, files: new Map(), examples: new Set(),
      pausedImports: new Map(), request: 0, message: "", text: ""};
    if (mode === "diffraction") value.settings.incidence = "";
    makeDemo(mode, value);
    dataByMode.set(mode, value);
  }

  function setField(key, value) {
    const target = state();
    const wasExample = target.examples.has(slot(active, options()));
    const structural = active === "diffraction" ? ["axis", "kind"].includes(key) :
      active === "thermal" && key === "kind";
    if (active === "thermal" && key === "kind" && value !== target.settings.kind) {
      target.thermalSettings ??= new Map();
      target.thermalSettings.set(target.settings.kind, target.settings);
      target.settings = target.thermalSettings.get(value) ??
        {...extra.models.thermal, kind: value, units: value === "dsc" ? "mW" : "percent"};
    } else {
      target.settings[key] = value;
    }
    target.message = "";
    if (structural) target.request += 1;
    if (active === "diffraction" && key === "axis") {
      target.settings.tolerance = value === "q" ? .015 : .18;
      target.settings.traceAt = value === "q" ? 1 : 13.95;
      target.settings.traceWidth = value === "q" ? .065 : .55;
    }
    if (structural && !record() && wasExample) target.examples.add(slot(active, options()));
    syncDemo(active, target);
    if (active === "diffraction" && record()?.simulated) {
      const sample = record();
      if (key === "traceAt") sample.traceAt = value;
      if (structural && sample.traceAt != null) target.settings.traceAt = sample.traceAt;
    }
    if (["kind", "axis", "axisSeries", "units", "wavelength"].includes(key)) {
      const keepFocus = document.activeElement === el(key);
      renderInputs();
      if (keepFocus) el(key)?.focus({preventScroll: true});
    }
    render();
  }

  function field(key, label, control) {
    const outer = node("label");
    control.id = "phase-extra-" + key;
    outer.append(node("span", label), control);
    return outer;
  }

  function select(key, label, entries) {
    const input = node("select");
    for (const [value, name] of entries) {
      const option = node("option", name);
      option.value = value;
      input.append(option);
    }
    input.value = options()[key];
    input.addEventListener("change", () => setField(key, input.value));
    return field(key, label, input);
  }

  function number(key, label, min, max, optional = false) {
    const input = node("input");
    input.type = "number";
    input.step = "any";
    input.inputMode = "decimal";
    input.min = min;
    input.max = max;
    input.required = !optional;
    input.value = options()[key];
    input.addEventListener("change", () => {
      if (!input.checkValidity()) {
        input.value = options()[key];
        state().message = "rangeError";
        renderMessage();
        return;
      }
      setField(key, input.value === "" ? "" : input.valueAsNumber);
    });
    return field(key, label, input);
  }

  function fieldRow(...fields) { const row = node("div", null, "phase-fields"); row.append(...fields); return row; }

  function schema(mode, settings) {
    if (mode === "diffraction") {
      return settings.kind === "series" ?
        t("formatThree", {frame: t(settings.axisSeries), x: diffractionAxis(settings)}) :
        t("formatTwo", {x: diffractionAxis(settings), y: t("intensity")});
    }
    if (mode === "thermal") return t("formatTwo", {x: t("temperature"), y: signalLabel(mode, settings)});
    if (mode === "xps") return t("formatTwo", {x: t("energy"), y: t("intensity")});
    return t("formatD");
  }

  function signalLabel(mode, settings) {
    if (mode !== "thermal") return t("intensity");
    return t(settings.kind === "dsc" ? "heatFlow" : "massLabel", {unit: thermalUnits[settings.units]});
  }

  function renderInputs() {
    const settings = options();
    const formats = el("format"), parameters = el("settings");
    formats.replaceChildren();
    parameters.replaceChildren();
    let help, formatSelection = "";
    if (active === "diffraction") {
      const q = settings.axis === "q";
      const unit = diffractionUnit(settings);
      help = "diffHelp";
      formatSelection = (settings.kind === "series" ? " · " + t(settings.axisSeries) : "") + " · " + diffractionAxis(settings);
      formats.append(fieldRow(select("kind", t("diffSetup"), [["series", t("diffSeries")], ["scan", t("diffSingle")]])),
        fieldRow(select("axis", t("diffAxis"), [["q", t("diffQ")], ["angle", t("diffAngle")]])));
      if (settings.kind === "series") formats.append(fieldRow(select("axisSeries", t("seriesAxis"),
        [["seconds", t("seconds")], ["temperature", t("temperature")], ["indexer", t("indexer")]])));
      if (!q) parameters.append(fieldRow(number("wavelength", t("wavelength"), .05, 5)));
      parameters.append(fieldRow(number("incidence", t("geometry"), 0, 20, true),
        number("tolerance", t("tolerance", {unit}), q ? .0001 : .001, q ? .25 : 3)));
      parameters.append(fieldRow(select("substrate", t("substrate"),
        [["auto", t("allSubstrates")], ["FTO", "FTO"], ["ITO", "ITO"], ["none", t("noSubstrate")]])));
      if (settings.kind === "series") parameters.append(fieldRow(number("traceAt", t("traceAt", {unit}), 0, q ? 100 : 179),
        number("traceWidth", t("traceWidth", {unit}), .0001, q ? 10 : 90)));
    } else if (active === "thermal") {
      const dsc = settings.kind === "dsc";
      help = dsc ? "dscHelp" : "tgaHelp";
      formatSelection = " · " + (dsc ? "DSC" : "TGA") + " · " + thermalUnits[settings.units];
      formats.append(fieldRow(select("kind", t("thermalMode"), [["dsc", "DSC"], ["tga", "TGA"]]),
        select("units", t("signalUnits"), dsc ? [["mW", "mW"], ["Wg", "W/g"]] : [["percent", "%"], ["mg", "mg"]])));
      parameters.append(fieldRow(number("low", t("windowLow", {unit: "°C"}), -273.15, 3000, true),
        number("high", t("windowHigh", {unit: "°C"}), -273.15, 3000, true)));
      if (dsc) {
        parameters.append(fieldRow(number("ramp", t("rampRate"), .0001, 10000)));
        if (settings.units === "mW") parameters.append(fieldRow(number("mass", t("sampleMass"), .0001, 100000)));
        parameters.append(fieldRow(select("sign", t("heatSign"), [["endoPositive", t("endoPositive")], ["exoPositive", t("exoPositive")]])));
      }
    } else if (active === "xps") {
      help = "xpsHelp";
      parameters.append(fieldRow(select("kind", t("fitKind"), [["one", t("oneDoublet")], ["two", t("twoDoublets")]])),
        fieldRow(number("low", t("windowLow", {unit: "eV"}), 0, 2000),
        number("high", t("windowHigh", {unit: "eV"}), 0, 2000)),
        fieldRow(number("correction", t("correction"), -50, 50), number("split", t("split"), 1, 10)),
        fieldRow(number("centerA", t("centerA"), 0, 2000)));
      if (settings.kind === "two") parameters.append(fieldRow(number("centerB", t("centerB"), 0, 2000)));
    } else {
      help = "saedHelp";
      parameters.append(fieldRow(number("tolerance", t("tolerance", {unit: "Å"}), .0001, 1)));
    }
    el("format-panel").hidden = !formats.firstElementChild;
    el("format-selection").textContent = formatSelection;
    el("formats").textContent = schema(active, settings);
    el("help").textContent = t(help);
    el("text").placeholder = schema(active, settings);
  }

  function renderMessage() {
    const error = state().message;
    el("status").textContent = error ? t(error) : "";
    el("status").dataset.error = String(!!error);
  }

  function inputError(target, error) {
    const key = error.message === "formatError" ? "extraFormatError" : error.message;
    target.message = Object.hasOwn(window.PhaseExtraStrings, key) || Object.hasOwn(window.PhaseStrings, key) ? key : "readError";
    if (target === state()) renderMessage();
  }

  function parse(mode, text, settings) {
    if (mode === "diffraction") return extra.parseDiffraction(text, settings);
    if (mode === "saed") return extra.parseSpacings(text);
    const data = phase.parse(text, "raman");
    const min = mode === "thermal" ? -273.15 : 0, max = mode === "thermal" ? 3000 : 2000;
    if (data.points[0][0] < min || data.points.at(-1)[0] > max) throw Error("axisError");
    return data;
  }

  function install(mode, target, where, name, text) {
    const data = parse(mode, text, target.settings);
    target.files.set(where, {data, name, simulated:false, frame:0});
    target.pausedImports.delete(where);
    target.examples.delete(where);
    target.message = "";
    const needsDscMetadata = mode === "thermal" && target.settings.kind === "dsc";
    if (needsDscMetadata) {
      target.settings.ramp = "";
      target.settings.mass = "";
    }
    if (active === mode) {
      if (needsDscMetadata) renderInputs();
      render();
    }
  }

  async function loadFile(file) {
    const mode = active, target = state(), where = slot(mode, options());
    const request = ++target.request;
    try {
      const text = await phase.readFile(file);
      if (request !== target.request) return;
      install(mode, target, where, file.name, text);
    } catch (error) {
      if (request === target.request) inputError(target, error);
    }
  }

  function chartOptions(points, xLabel, yLabel, other) {
    return {points, xLabel, yLabel, peaks: [], markers: true, locale: context.locale, digits: 3, ...other};
  }

  function sourceLink(text, url) {
    const link = node("a", text, "phase-source-link");
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    return link;
  }

  function methodInfo(key) {
    const list = node("div", null, "phase-extra-source");
    for (const [label, url] of sources[key]) list.append(sourceLink(t(label) + " ↗", url));
    const method = {diffraction: "diffMethod", thermal: options().kind + "Method", xps: "xpsMethod", saed: "saedMethod"};
    el("method").textContent = t(method[active]);
    el("sources").replaceChildren(list);
  }

  function table(headers, rows, label) {
    const outer = node("div", null, "phase-table-scroll");
    outer.tabIndex = 0;
    outer.setAttribute("aria-label", label);
    const grid = node("table", null, "phase-table");
    const head = grid.createTHead().insertRow();
    for (const item of headers) {
      const column = node("th", item);
      column.scope = "col";
      head.append(column);
    }
    const body = grid.createTBody();
    for (const values of rows) {
      const row = body.insertRow();
      for (const item of values) row.insertCell().textContent = item;
    }
    outer.append(grid);
    return outer;
  }

  function metrics(items) {
    const block = node("dl", null, "phase-extra-metrics");
    for (const [label, value] of items) {
      const group = node("div");
      group.append(node("dt", label), node("dd", value));
      block.append(group);
    }
    return block;
  }


  function references(candidates, peakCount, spacings) {
    const referenceId = lastFile?.source?.group?.id;
    if (referenceId) candidates = candidates.slice().sort((a,b) => Number(b.group.id === referenceId) - Number(a.group.id === referenceId));
    const group = node("div");
    group.append(node("h3", t("candidatesExtra")));
    if (!candidates.length) {
      group.append(node("p", t("noCandidates"), "phase-note"));
      return group;
    }
    for (const option of candidates.slice(0, 8)) {
      const {group: ref, supporting} = option;
      const lines = supporting.length + " / " + (spacings ? peakCount : option.inRange.length);
      const preview = node("details", null, "phase-extra-candidate");
      preview.append(node("summary", ref.name + " · " + lines + (ref.spaceGroup ? " · " + ref.spaceGroup : "")));
      preview.append(node("p", [ref.model, ref.kind, ref.location].filter(Boolean).join(" · "), "phase-note"));
      if (ref.url) preview.append(sourceLink(t("source"), ref.url));
      const rows = supporting.slice().sort((a, b) => a.peak.x - b.peak.x).map(hit =>
        [fmt(hit.peak.x, 4), fmt(hit.line.center, 4), fmt(hit.centerOffset, 4), hit.line.label || "—"]);
      preview.append(table([t("observed"), t("band"), t("delta"), "hkl"], rows, ref.name));
      group.append(preview);
    }
    return group;
  }

  function legend(entries) {
    const host = el("legend");
    host.replaceChildren();
    for (const [key, color, dashed] of entries) {
      const item = node("span");
      const swatch = node("i");
      swatch.style.borderColor = "var(--" + color + ")";
      if (dashed) swatch.style.borderBottomStyle = "dashed";
      item.append(swatch, node("span", t(key)));
      host.append(item);
    }
  }

  function drawMap() {
    if (active !== "diffraction" || !lastFile?.map || el("map").hidden) return;
    const {frames} = lastFile.data;
    const grid = lastFile.map;
    const {width, height} = mapCanvas.getBoundingClientRect();
    if (width < 2 || height < 2) return;
    const pixelRatio = Math.min(3, window.devicePixelRatio || 1);
    mapCanvas.width = Math.round(width * pixelRatio);
    mapCanvas.height = Math.round(height * pixelRatio);
    const ctx = mapCanvas.getContext("2d");
    ctx.scale(pixelRatio, pixelRatio);
    const css = getComputedStyle(mapCanvas);
    const margin = 62, right = width - 14, top = 15, bottom = height - 36;
    const first = frames[0].index, last = frames.at(-1).index;
    const toY = at => bottom - (at - first) / (last - first) * (bottom - top);
    const rowWidth = (right - margin) / grid.rows[0].length;
    const amplitude = grid.high - grid.low || 1;
    for (let i = 0; i < frames.length; i += 1) {
      const at = frames[i].index;
      const start = i === 0 ? first : (at + frames[i - 1].index) / 2;
      const end = i === frames.length - 1 ? last : (at + frames[i + 1].index) / 2;
      const rowTop = toY(end), rowHeight = toY(start) - rowTop;
      for (let x = 0; x < grid.rows[i].length; x += 1) {
        const intensity = grid.rows[i][x];
        if (intensity === null) continue;
        const f = Math.min(1, Math.max(0, (intensity - grid.low) / amplitude));
        const p = f < .65 ? f / .65 : (f - .65) / .35;
        const a = f < .65 ? [8, 35, 54] : [38, 139, 144];
        const b = f < .65 ? [38, 139, 144] : [255, 207, 113];
        const colors = a.map((value, index) => Math.round(value + p * (b[index] - value)));
        ctx.fillStyle = "rgb(" + colors.join(",") + ")";
        ctx.fillRect(margin + x * rowWidth, rowTop, rowWidth + .42, rowHeight + .32);
      }
    }
    ctx.strokeStyle = css.getPropertyValue("--control");
    ctx.strokeRect(margin, top, right - margin, bottom - top);
    const y = toY(frames[lastFile.frame].index);
    ctx.beginPath();
    ctx.moveTo(margin, y);
    ctx.lineTo(right, y);
    ctx.setLineDash([4, 3]);
    ctx.strokeStyle = "#fff6de";
    ctx.lineWidth = 1.3;
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.font = "11px " + css.getPropertyValue("--sans");
    ctx.fillStyle = css.getPropertyValue("--muted");
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    for (const index of [first, (last + first) / 2, last]) ctx.fillText(fmt(index, 2), margin - 6, toY(index));
    const axis = diffractionAxis(options());
    ctx.textAlign = "center";
    const count = width < 390 ? 2 : 4;
    for (let i = 0; i <= count; i += 1) {
      const fraction = i / count;
      ctx.fillText(fmt(grid.left + (grid.right - grid.left) * fraction, 2), margin + (right - margin) * fraction, bottom + 11);
    }
    ctx.fillText(axis, (margin + right) / 2, height - 8);
    ctx.save();
    ctx.translate(9, (top + bottom) / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(t(options().axisSeries), 0, 0);
    ctx.restore();
    mapProjection = {left: margin, right, top, bottom, first, last};
  }

  function diffraction(file, settings) {
    const {frames} = file.data;
    const frame = frames[file.frame];
    const match = phase.analyze(frame.points, null, "xrd", extra.diffractionSettings(settings), library);
    const output = [
      metrics([[t("peakTable"), String(match.peaks.length)], [t("candidatesExtra"), String(match.candidates.length)]]),
      references(match.candidates, match.peaks.length, false)
    ];
    const axis = diffractionAxis(settings);
    const mainPlot = chartOptions(frame.points, axis, t("intensity"), {peaks: match.peaks});
    if (settings.kind === "scan") return {plot: mainPlot, output, match};
    file.map ??= extra.heatmap(frames);
    const key = [settings.tolerance, settings.traceAt, settings.traceWidth].join("/");
    if (file.track?.key !== key) file.track = {key, rows: extra.track(frames, settings)};
    const tracked = file.track.rows.filter(row => row.match);
    output.unshift(node("p", t("tracked", {n: tracked.length, total: frames.length}), "phase-note"));
    return {plot: mainPlot, output, match, tracked, tracking: file.track.rows,
      secondary: tracked.length ? chartOptions(tracked.map(row => [row.index, row.match.y]), t(settings.axisSeries), t("intensity"), {scatter: true}) : null,
      secondaryTitle: "featureTrack"};
  }

  function thermal(file, settings) {
    const dsc = settings.kind === "dsc";
    const result = dsc ? extra.dsc(file.data, settings) : extra.tga(file.data, settings);
    const direction = file.data.direction;
    const temp = x => Number.isFinite(x) ? fmt(x, 2) + " °C" : "—";
    const temperature = t("temperature");
    const y = signalLabel(active, settings);
    const directionMessage = node("p", t(direction > 0 ? "heating" : "cooling"), "phase-note");
    if (dsc) {
      const cards = metrics([
        [t("onset"), temp(result.onset)],
        [t("peakTemp"), result.interiorPeak ? temp(result.peak.x) : "—"],
        [t("enthalpy"), result.enthalpy == null ?
          t(settings.units === "mW" ? "dscNeedsMassRamp" : "dscNeedsRamp") : fmt(result.enthalpy) + " J/g"],
        [t("heatEvent"), result.interiorPeak && result.kind ? t(result.kind) : "—"]
      ]);
      return {thermal: result, output: [directionMessage, cards], plot: chartOptions(file.data.points, temperature, y, {
        peaks: result.interiorPeak ? [result.peak] : [], curves: [{points: result.baseline, color: "phase-fit", dashed: true}]
      }), legend: [["baseline", "phase-fit", true]]};
    }
    const output = [directionMessage, metrics([[t("massLoss"), fmt(result.loss) + " %"]])];
    if (result.stages.length) {
      const rows = result.stages.map(item => [
        fmt(direction > 0 ? item.from : item.to, 2), fmt(direction > 0 ? item.to : item.from, 2),
        fmt(item.peak, 2), fmt(item.rate, 5), fmt(item.loss, 4)
      ]);
      output.push(node("h3", t("massStages")), table(
        [t("startTemp"), t("endTemp"), t("peakTemp") + " (°C)", t("dtgSlope"), t("lossPct")], rows, t("massStages")
      ));
    } else output.push(node("p", t("noMassStage"), "phase-note"));
    return {thermal: result, output, plot: chartOptions(file.data.points, temperature, y),
      secondary: chartOptions(result.dtg, temperature, t("dtgSlope")), secondaryTitle: "dtg"};
  }

  function xps(file, settings) {
    const result = extra.fitXps(file.data, settings);
    const x = t("energy"), y = t("intensity");
    const curves = [
      {points: result.baseline, color: "phase-reference", dashed: true},
      {points: result.aCurve, color: "phase-component-a"},
      {points: result.fitted, color: "phase-fit"}
    ];
    const labels = [["baseline", "phase-reference", true], ["compA", "phase-component-a"]];
    if (result.components.length === 2) {
      curves.splice(2, 0, {points: result.bCurve, color: "phase-component-b"});
      labels.push(["compB", "phase-component-b"]);
    }
    labels.push(["fitted", "phase-fit"]);
    const rows = result.components.map((component, i) =>
      [t(i ? "compB" : "compA"), component.amplitude > 0 ? fmt(component.center) : "—",
        component.amplitude > 0 ? fmt(component.partner) : "—",
        component.amplitude > 0 ? fmt(component.width) : "—", fmt(component.area)]);
    return {xps: result, plot: chartOptions(result.points, x, y, {curves, reverse: true}), legend: labels,
      secondary: chartOptions(result.residual, x, t("intensity"), {reverse: true}), secondaryTitle: "residual",
      output: [metrics([["RMSE", fmt(result.rmse)], ["R²", fmt(result.r2, 4)]]),
        table([t("component"), "4f₇/₂ (eV)", "4f₅/₂ (eV)", "FWHM (eV)", t("fittedArea")], rows, t("component"))]};
  }

  function saed(file, settings) {
    const points = file.data.points;
    const result = phase.compareSpacings(points, settings.tolerance, library);
    const top = result.candidates[0];
    return {match: result, plot: chartOptions(points, t("dAxis"), t(file.data.intensities ? "intensity" : "sticks"), {sticks: true, reverse: true}),
      output: [metrics([[t("listedSpacings"), String(points.length)], [t("matches"), top ? top.supporting.length + " / " + points.length : "0 / " + points.length]]),
        references(result.candidates, points.length, true)]};
  }

  function fallbackPlot(file, settings) {
    if (active === "diffraction") return chartOptions(file?.data.frames?.[file.frame]?.points, diffractionAxis(settings), t("intensity"));
    if (active === "thermal") return chartOptions(file?.data.points, t("temperature"), signalLabel(active, settings));
    if (active === "xps") return chartOptions(file?.data.points?.map(([x, y]) => [x + settings.correction, y]), t("energy"), t("intensity"), {reverse: true});
    return chartOptions(file?.data.points, t("dAxis"), t("intensity"), {sticks: true, reverse: true});
  }

  function render() {
    const file = record(), settings = options();
    const isSeries = active === "diffraction" && settings.kind === "series";
    const title = {diffraction: isSeries ? "seriesTitle" : "diffTitle", thermal: settings.kind + "Title",
      xps: "xpsTitle", saed: "saedTitle"};
    const renderResult = {diffraction, thermal, xps, saed};
    const name = file ? file.simulated ? context.exampleName(file.source, file.preset) : file.name || t("pasted") : "";
    const support = samples.evidence(active, context.preset, reference, settings.kind);
    const paused = state().pausedImports.has(slot(active, settings));
    const demo = el("demo");
    demo.disabled = !support && !paused;
    demo.textContent = t(paused ? "returnImport" : file?.simulated ? "resetExample" : "tryExample");
    demo.title = paused || (file && !file.simulated) ? t("savedInTab") : "";
    el("chart").closest(".phase-plot-card").toggleAttribute("data-empty", !file);
    context.renderProvenance(el("chart-source"), file, active, settings.kind);
    el("dataset").hidden = !file;
    el("dataset").toggleAttribute("data-simulated", !!file?.simulated);
    el("name").textContent = name;
    el("info").textContent = file ? t(file.data.frames ? "frames" : "points", {n: file.data.frames?.length ?? file.data.points.length}) : "";
    el("plot-title").textContent = t(title[active]);
    el("chart").setAttribute("aria-label", t(title[active]));
    const bits = [name, ...(active === "diffraction" && settings.incidence !== "" ? [t("angleRecorded", {n: fmt(settings.incidence)})] : [])].filter(Boolean);
    el("context").textContent = bits.join(" · ");
    lastFile = file;
    let errorText = "";
    lastResult = null;
    if (file) {
      try { lastResult = renderResult[active](file, settings); }
      catch (error) { errorText = Object.hasOwn(window.PhaseExtraStrings, error.message) ? t(error.message) : t("readError"); }
    }
    el("analysis-status").textContent = errorText;
    el("result-jump").hidden = !lastResult;
    el("result").replaceChildren(...(lastResult?.output ?? [node("p", errorText || t(support ? "empty" : "emptyImport"), "phase-note")]));
    const selectFrame = !!(isSeries && lastResult);
    el("map").hidden = !selectFrame;
    if (selectFrame) {
      const frames = file.data.frames;
      el("frame").max = frames.length - 1;
      el("frame").value = file.frame;
      el("frame-value").textContent = fmt(frames[file.frame].index) + " · " + t(settings.axisSeries);
      el("frame").setAttribute("aria-valuetext", el("frame-value").textContent);
      mapCanvas.setAttribute("aria-label", t("seriesMap") + " · " + t("frames", {n: frames.length}));
      el("color-range").textContent = t("colorRange", {min: fmt(file.map.low, 1), max: fmt(file.map.high, 1)});
      drawMap();
    }
    const secondaryOptions = lastResult?.secondary;
    el("secondary").hidden = !secondaryOptions;
    if (secondaryOptions) {
      el("secondary-title").textContent = t(lastResult.secondaryTitle);
      el("secondary-chart").setAttribute("aria-label", t(lastResult.secondaryTitle));
      secondary.draw(secondaryOptions);
    }
    el("empty").hidden = !!file;
    el("empty").textContent = t(support ? "empty" : "emptyImport");
    plot.draw(lastResult?.plot ?? fallbackPlot(file, settings));
    legend(file ? [[file.simulated ? "simulatedCurve" : "sampleCurve", "phase-sample"], ...(lastResult?.legend ?? [])] : []);
    el("export").disabled = !lastResult;
    renderMessage();
    methodInfo(active === "thermal" ? settings.kind : active);
  }


  function matchNames(peak) {
    return (peak.references ?? []).map(ref => ref.id + " " + ref.name).join(" | ");
  }
  function matchUrls(peak) {
    return Array.from(new Set((peak.references ?? []).map(ref => ref.group.url).filter(Boolean))).join(" | ");
  }

  function exportRows(result, file, settings) {
    if (active === "diffraction") {
      const {frames} = file.data;
      const positionUnit = settings.axis === "q" ? "A^-1" : "degree_2theta";
      const diffractionRow = (rowType, at, peak) => [
        rowType, settings.kind === "series" ? settings.axisSeries : "", settings.kind === "series" ? at : "",
        positionUnit, settings.axis === "angle" ? settings.wavelength : "", settings.incidence, settings.tolerance,
        peak?.x, peak?.y, peak ? phase.spacing(peak.x, settings.wavelength, settings.axis) : "",
        peak?.prominence, matchNames(peak ?? {}), matchUrls(peak ?? {})
      ];
      const rows = result.match.peaks.map(peak => diffractionRow("selected_scan", frames[file.frame].index, peak));
      for (const frame of result.tracking ?? []) rows.push(diffractionRow("target_track", frame.index, frame.match));
      return {name: "diffraction-results", header: [
        "record", "series_coordinate_type", "series_coordinate", "x_unit", "wavelength_A", "incidence_angle_deg",
        "match_tolerance", "peak_position", "intensity", "d_A", "prominence", "references", "sources"
      ], rows};
    }
    if (active === "saed") return {name: "saed-spacings", header: ["d_A", "intensity", "tolerance_A", "status", "references", "sources"],
      rows: result.match.peaks.map(peak => [peak.x, file.data.intensities ? peak.y : "", settings.tolerance,
        peak.status, matchNames(peak), matchUrls(peak)])};
    if (active === "thermal") {
      const thermal = result.thermal;
      if (settings.kind === "dsc") return {name: "dsc-results", header: ["temperature_C", "raw_heat_flow", "heat_flow_unit", "linear_baseline",
        "corrected_heat_flow", "ramp_C_per_min", "mass_mg", "input_heat_flow_sign", "onset_C", "peak_C", "enthalpy_endotherm_positive_J_g"],
        rows: thermal.scan.map(([x, y], i) => [x, y, settings.units === "mW" ? "mW" : "W/g", thermal.baseline[i][1],
          thermal.corrected[i][1], settings.ramp, settings.units === "mW" ? settings.mass : "", settings.sign,
          thermal.onset, thermal.interiorPeak ? thermal.peak.x : "", thermal.enthalpy])};
      return {name: "tga-results", header: ["record", "temperature_C", "raw_mass", "raw_mass_unit", "mass_percent",
        "dtg_percent_per_C", "window_loss_pct_points", "stage_from_C", "stage_to_C", "stage_loss_pct_points"],
        rows: thermal.scan.map(([x, y], i) => ["scan", x, y, settings.units === "percent" ? "%" : "mg",
          thermal.curve[i][1], thermal.dtg[i][1], thermal.loss])
          .concat(thermal.stages.map(stage => {
            const forward = file.data.direction > 0;
            return ["stage", stage.peak, "", "", "", stage.rate, thermal.loss,
              forward ? stage.from : stage.to, forward ? stage.to : stage.from, stage.loss];
          }))};
    }
    const fit = result.xps;
    const [a, b] = fit.components;
    return {name: "xps-pb4f-fit", header: ["calibrated_energy_eV", "intensity", "background", "fit", "residual",
      "component_A", "component_B", "energy_shift_eV", "split_eV", "A_4f7_2_eV", "B_4f7_2_eV",
      "FWHM_eV", "area_A_in_window", "area_B_in_window", "RMSE", "R2"],
      rows: fit.points.map(([x, y], i) => [x, y, fit.baseline[i][1], fit.fitted[i][1], fit.residual[i][1],
        fit.aCurve[i][1] - fit.baseline[i][1], b ? fit.bCurve[i][1] - fit.baseline[i][1] : "", settings.correction,
        settings.split, a.amplitude > 0 ? a.center : "", b?.amplitude > 0 ? b.center : "", a.width, a.area, b?.area,
        fit.rmse, fit.r2])};
  }

  function exportResult() {
    if (!lastResult || !lastFile) return;
    const {name, header, rows} = exportRows(lastResult, lastFile, options());
    const origin = lastFile.simulated ? "simulated" : lastFile.name || "pasted";
    const material = lastFile.source?.type === "structure" ? lastFile.preset.material.key : "";
    const phaseModel = material ? lastFile.preset.ref : "";
    context.openCsv(name + ".csv", [
      "data_source", "example_material", "example_phase_model", "example_provenance", "example_source", ...header
    ], rows.map(row => [origin, material, phaseModel, lastFile.source?.type, lastFile.source?.url, ...row]), "exportAnalysisTitle");
  }

  el("file").addEventListener("change", event => {
    const file = event.currentTarget.files[0];
    if (file) loadFile(file);
    event.currentTarget.value = "";
  });
  const drop = el("drop");
  drop.addEventListener("dragover", event => {
    if (!event.dataTransfer.types.includes("Files")) return;
    event.preventDefault();
    drop.dataset.drag = "true";
  });
  drop.addEventListener("dragleave", () => { delete drop.dataset.drag; });
  drop.addEventListener("drop", event => {
    event.preventDefault();
    delete drop.dataset.drag;
    const files = event.dataTransfer.files;
    if (files.length === 1) loadFile(files[0]);
    else if (files.length > 1) inputError(state(), Error("filesError"));
  });
  el("text").addEventListener("input", () => { state().text = el("text").value; });
  el("import").addEventListener("click", () => {
    const target = state();
    target.request += 1;
    try { install(active, target, slot(active, options()), "", el("text").value); }
    catch (error) { inputError(target, error); }
  });
  el("demo").addEventListener("click", () => {
    const target = state(), settings = target.settings;
    const where = slot(active, settings);
    const paused = target.pausedImports.get(where);
    target.request += 1;
    target.message = "";
    if (paused) {
      target.settings = paused.settings;
      target.files.set(where, paused.file);
      target.examples.delete(where);
      target.pausedImports.delete(where);
    } else {
      const file = record();
      if (file && !file.simulated) {
        target.pausedImports.set(where, {file, settings: {...settings}});
        target.settings = {...extra.models[active]};
        if (active === "diffraction") Object.assign(target.settings, {
          kind: settings.kind, axis: settings.axis, axisSeries: settings.axisSeries, incidence: "",
          tolerance: settings.axis === "q" ? .015 : .18, traceAt: settings.axis === "q" ? 1 : 13.95,
          traceWidth: settings.axis === "q" ? .065 : .55
        });
        if (active === "thermal") Object.assign(target.settings, {kind: settings.kind, units: settings.kind === "dsc" ? "mW" : "percent"});
      }
      makeDemo(active, target);
    }
    renderInputs();
    render();
  });
  el("clear").addEventListener("click", () => {
    state().request += 1;
    state().message = "";
    const where = slot(active, options());
    state().files.delete(where);
    state().examples.delete(where);
    render();
    el("file").focus();
  });
  el("frame").addEventListener("input", () => {
    const file = record();
    if (!file?.data.frames) return;
    file.frame = Number(el("frame").value);
    render();
  });
  mapCanvas.addEventListener("click", event => {
    const rect = mapCanvas.getBoundingClientRect();
    const x = event.clientX - rect.left, y = event.clientY - rect.top;
    const p = mapProjection;
    if (!p || y < p.top || y > p.bottom || x < p.left || x > p.right) return;
    const target = p.last - (y - p.top) / (p.bottom - p.top) * (p.last - p.first);
    const file = record();
    const frames = file.data.frames;
    let index = 0;
    for (let i = 1; i < frames.length; i += 1) {
      if (Math.abs(frames[i].index - target) < Math.abs(frames[index].index - target)) index = i;
    }
    file.frame = index;
    render();
  });
  new ResizeObserver(drawMap).observe(mapCanvas);
  el("export").addEventListener("click", exportResult);
  const compactPanel = matchMedia("(max-width: 690px)");
  el("settings-panel").open = !compactPanel.matches;
  el("format-panel").open = !compactPanel.matches;
  compactPanel.addEventListener("change", event => { el("format-panel").open = !event.matches; });

  window.PhaseExtras = {
    show(mode, helpers) {
      context = helpers;
      active = mode;
      ensure(mode);
      syncDemo(mode, state());
      el("text").value = state().text;
      el("file").value = "";
      renderInputs();
      render();
    },
    redraw() { if (active) render(); }
  };
})();
