/* Page state, import controls, reference evidence and export. */
(function () {
  "use strict";
  const model = window.PhaseModel;
  const library = window.PhaseReference;
  const samples = window.PhaseSamples;
  const langs = ["zh", "en", "de"];
  const basicModes = ["xrd", "ftir", "raman"];
  const modes = [...basicModes, "thermal", "diffraction", "xps", "saed"];
  const tabs = Array.from(document.querySelectorAll("[data-mode]"));
  const el = name => document.getElementById("phase-" + name);
  const query = new URLSearchParams(location.search);
  let lang = langs.includes(query.get("lang")) ? query.get("lang") : "zh";
  let mode = modes.includes(query.get("mode")) ? query.get("mode") : "xrd";
  let selected = samples.choose(query.get("material"), query.get("phase"));
  const phaseMemory = new Map([[selected.material.key, selected.ref]]);
  let exportURL = "";
  const states = {};

  const t = (key, values = {}) => ((PhaseStrings[key] ?? PhaseExtraStrings[key])?.[langs.indexOf(lang)] || key)
    .replace(/\{(\w+)\}/g, (_, field) => String(values[field] ?? ""));
  const unit = () => mode === "xrd" ? "°" : "cm⁻¹";
  const current = () => states[mode];
  const basic = () => basicModes.includes(mode);
  const locale = () => lang === "zh" ? "zh-CN" : lang;
  const digits = () => mode === "xrd" ? 3 : 1;
  const fmt = (value, precision = digits()) => Number.isFinite(value) ?
    new Intl.NumberFormat(locale(), {maximumFractionDigits: precision, useGrouping: false}).format(value) : "—";
  const spectrumLabel = () => t(mode === "ftir" ? current().settings.ordinate : "intensity");

  function node(tag, content, className) {
    const element = document.createElement(tag);
    if (content != null) element.textContent = content;
    if (className) element.className = className;
    return element;
  }

  function materialName(choice) {
    return choice.material.label || t(choice.material.labelKey);
  }

  function exampleName(source, choice) {
    if (!source) return "";
    return source.type === "method" ? t(source.label) :
      materialName(choice) + (source.compositionOnly ? " · " + t("compositionReference") :
        choice.description ? " · " + t(choice.description) : "");
  }

  function renderMaterialSelector() {
    const buttons = el("material-buttons");
    buttons.replaceChildren();
    for (const material of samples.materials) {
      const button = node("button", material.label || t(material.labelKey), "phase-button");
      button.type = "button";
      button.dataset.material = material.key;
      button.setAttribute("aria-pressed", String(material.key === selected.material.key));
      button.addEventListener("click", () => selectMaterial(material.key, phaseMemory.get(material.key), "material"));
      buttons.append(button);
    }
    const crystal = el("crystal");
    crystal.replaceChildren();
    for (const [id, key] of selected.material.phases) {
      const option = node("option", t(key));
      option.value = id;
      crystal.append(option);
    }
    el("material-phase").hidden = !selected.ref;
    crystal.value = selected.ref ?? "";
    el("material-summary").textContent = materialName(selected) +
      (selected.description ? " · " + t(selected.description) : "");
    const optical = document.querySelector(".phase-optical-links .phase-note");
    optical.textContent = t("opticalNote") + (selected.ref ? " " +
      t("opticalSelected", {material: materialName(selected)}) + "." : "");
  }

  function selectMaterial(key, phase, focus) {
    selected = samples.choose(key, phase);
    phaseMemory.set(selected.material.key, selected.ref);
    setLanguage(lang, true);
    render();
    if (focus === "material") el("material-buttons").querySelector('[data-material="' + selected.material.key + '"]')?.focus();
    if (focus === "phase") {
      el("materials-panel").open = true;
      el("crystal").focus();
    }
  }

  function renderProvenance(host, record, technique, kind) {
    host.replaceChildren();
    if (record && !record.simulated) {
      host.append(node("p", t("currentImport"), "phase-note"));
      return;
    }
    const support = samples.evidence(technique, selected, library, kind);
    const source = record?.source;
    if (!source && support) return;
    if (!source) {
      const key = !selected.ref ? "customImport" : technique === "xps" && !selected.material.lead ?
        "sampleXpsRange" : "noSamplePreset";
      host.append(node("p", t(key), "phase-note"));
      const alternate = selected.material.phases.find(([id]) =>
        id !== selected.ref && samples.evidence(technique, samples.choose(selected.material.key, id), library, kind));
      if (alternate) {
        const button = node("button", t("availablePhase", {phase:t(alternate[1])}), "phase-link-button");
        button.type = "button";
        button.addEventListener("click", () => selectMaterial(selected.material.key, alternate[0], "phase"));
        host.append(button);
      }
      return;
    }
    const badge = source.type === "band" ? "sourceBands" : source.type === "method" ?
      "sourceMethod" : technique === "saed" ? "sourceRings" : "sourceStructure";
    host.append(node("strong", t(badge)));
    if (source.url) {
      const link = node("a", t(source.citation), "phase-source-link");
      link.href = source.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      host.append(link);
    }
    if (source.type === "method") {
      host.append(node("p", t("methodNotice"), "phase-note"));
      return;
    }
    const conditions = node("details", null, "phase-provenance-details");
    conditions.append(node("summary", t("sampleConditions")));
    if (source.type === "band") {
      conditions.append(node("p", source.ref === "ftir-47" ? t("harisConditions") : source.group.model, "phase-note"));
      if (source.compositionOnly) conditions.append(node("p", t("sameFormulaEvidence"), "phase-note"));
    } else {
      const g = source.group;
      conditions.append(node("p", [g.model, g.spaceGroup, g.temperature ? g.temperature + " K" : ""].filter(Boolean).join(" · "), "phase-note"));
      if (selected.material.key === "mixed" && g.note) conditions.append(node("p", g.note, "phase-note"));
    }
    const explanation = technique === "saed" ? "sourceSAED" :
      technique === "diffraction" && kind === "series" ? "sourceSeries" : "sourceShape";
    conditions.append(node("p", t(explanation), "phase-note"));
    host.append(conditions);
  }

  function demoState(targetMode) {
    return {
      sample: null, blank: null, pausedImport: null, exampleActive: true, exampleId: null,
      settings: {...model.defaults[targetMode]}, result: null, referenceID: null, focusPeak: null,
      search: "", expanded: false, markers: true, requests: {sample: 0, blank: 0},
      lastImport: null, lastSettings: null
    };
  }

  function refreshDemo(state, activeMode) {
    if (!state.exampleActive || state.exampleId === selected.id) return false;
    const example = samples.primary(activeMode, selected, library, state.settings);
    state.sample = example ? {...example, simulated: true, preset: selected} : null;
    state.exampleId = selected.id;
    state.referenceID = example?.source.group.id ?? null;
    state.search = "";
    if (activeMode === "raman") state.settings.laser = example?.laser ?? "";
    recompute(state, activeMode);
    return true;
  }

  function setMessage(id, key, error, args) {
    el(id).textContent = key ? t(key, args) : "";
    el(id).dataset.error = String(!!error);
  }

  function renderMessages() {
    const state = current();
    for (const [id, value] of [["import-status", state.lastImport], ["settings-status", state.lastSettings]]) {
      setMessage(id, value?.key, value?.error, value?.args);
    }
  }

  function updateQuery() {
    try {
      const url = new URL(location.href);
      url.searchParams.set("lang", lang);
      url.searchParams.set("mode", mode);
      url.searchParams.set("material", selected.material.key);
      if (selected.ref) url.searchParams.set("phase", selected.ref);
      else url.searchParams.delete("phase");
      history.replaceState(null, "", url);
    } catch { /* The workspace still works on file URLs. */ }
  }

  function setLanguage(next, updateURL) {
    lang = next;
    const home = {en: "./index.html", de: "./de.html", zh: "./zh.html"}[lang];
    document.documentElement.lang = locale();
    document.title = t("title") + " · Weiwei Zuo";
    document.querySelector('meta[name="description"]').content = t("intro");
    document.querySelectorAll("[data-t]").forEach(element => {
      element.textContent = t(element.dataset.t);
    });
    document.querySelectorAll("[data-aria]").forEach(element => {
      element.setAttribute("aria-label", t(element.dataset.aria));
    });
    document.querySelectorAll("[data-placeholder]").forEach(element => {
      element.placeholder = t(element.dataset.placeholder);
    });
    el("clear").title = t("clear");
    el("theme").setAttribute("aria-label", t("dark"));
    for (const key of ["brand", "home", "footer-home"]) el(key).href = home;
    el("tools").href = home + "#solar-cell-tools";
    const drawQuery = new URLSearchParams({lang});
    if (selected.material.drawing.includes("|")) drawQuery.set("compound", selected.material.drawing);
    el("drawing").href = "./drawing.html?" + drawQuery.toString();
    el("optical-uv").href = home + "#bandgap-analysis";
    el("optical-pl").href = home + "#pl-bandgap";
    for (const link of document.querySelectorAll("[data-language]")) {
      const urls = new URLSearchParams({lang:link.dataset.language, mode, material:selected.material.key});
      if (selected.ref) urls.set("phase", selected.ref);
      link.href = "?" + urls.toString();
      if (link.dataset.language === lang) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    }
    renderMaterialSelector();
    if (updateURL) updateQuery();
  }

  function setTheme(theme) {
    document.documentElement.dataset.theme = theme;
    el("theme").setAttribute("aria-pressed", String(theme === "dark"));
    el("theme").textContent = theme === "dark" ? "☀" : "◐";
  }

  function settingsInputs() {
    const settings = current().settings;
    el("axis-note").textContent = t(mode + "Note");
    el("tolerance-label").textContent = t("tolerance", {unit: unit()});
    el("tolerance").min = mode === "xrd" ? "0.01" : "0.1";
    el("tolerance").max = mode === "xrd" ? "3" : "100";
    el("tolerance").value = settings.tolerance;
    el("threshold").value = settings.threshold;
    if (mode === "xrd") {
      el("wavelength").value = settings.wavelength;
      el("substrate").value = settings.substrate;
    } else if (mode === "ftir") {
      el("ordinate").value = settings.ordinate;
    } else {
      el("laser").value = settings.laser;
    }
    el("markers").checked = current().markers;
  }

  function datasetName() {
    const sample = current().sample;
    if (!sample) return "";
    return sample.simulated ? exampleName(sample.source, sample.preset) : sample.pasted ? t("pasted") : sample.name;
  }

  function refreshSource() {
    const {sample, blank, settings, result, pausedImport, exampleActive} = current();
    el("formats").textContent = t("formatTwo", {x: t(mode + "X"), y: spectrumLabel()});
    const examplePairs = {xrd: "14.02, 1350", ftir: settings.ordinate === "transmittance" ? "1712, 47.5" : "1712, 0.36", raman: "108, 624"};
    el("text").placeholder = t("pairHint", {pair: examplePairs[mode]});
    el("dataset").hidden = !sample;
    el("dataset").toggleAttribute("data-simulated", !!sample?.simulated);
    el("file-name").textContent = datasetName();
    el("file-info").textContent = sample ?
      t(sample.simulated ? "simulated" : "imported") + " · " + t("points", {n: sample.points.length}) : "";
    el("blank-item").hidden = !blank;
    el("blank-name").textContent = blank ? blank.simulated ? t("blankDemo") : blank.name : "";
    el("plot-title").textContent = t(mode + "Plot");
    el("chart").setAttribute("aria-label", t(mode + "Plot") + " · " + datasetName());
    const context = [];
    if (sample) {
      context.push(t(sample.simulated ? "simulated" : "imported"));
      context.push(fmt(sample.points[0][0]) + "–" + fmt(sample.points.at(-1)[0]) + " " + unit());
      if (mode === "xrd") context.push("λ " + fmt(settings.wavelength, 5) + " Å");
      if (mode === "raman" && settings.laser) context.push("λ " + fmt(Number(settings.laser), 2) + " nm");
      if (mode === "ftir") context.push(spectrumLabel());
    }
    el("result-context").textContent = context.join(" · ");
    const support = samples.evidence(mode, selected, library);
    const demo = el("demo");
    demo.disabled = !support && !pausedImport;
    demo.textContent = t(pausedImport ? "returnImport" : exampleActive && sample ? "resetExample" : "tryExample");
    demo.title = pausedImport || (sample && !sample.simulated) ? t("savedInTab") : "";
    el("chart").closest(".phase-plot-card").toggleAttribute("data-empty", !sample);
    el("chart-empty").hidden = !!sample;
    el("chart-empty").textContent = t(support ? "empty" : "emptyImport");
    renderProvenance(el("chart-source"), sample, mode);
    el("curve-label").textContent = t(sample?.simulated ? "simulatedCurve" : "sampleCurve");
    el("blank-legend").hidden = !sample || !blank;
    el("blank-legend").querySelector("[data-t]").textContent = t(blank?.simulated ? "blankDemoCurve" : "blankCurve");
    el("peaks-jump").hidden = !sample;
    el("export").disabled = !result?.peaks.length;
  }

  function recompute(state, activeMode) {
    state.focusPeak = null;
    state.result = state.sample ? model.analyze(state.sample.points, state.blank?.points ?? null,
      activeMode, state.settings, library[activeMode]) : null;
    if (!state.result?.candidates.some(candidate => candidate.group.id === state.referenceID)) {
      state.referenceID = null;
    }
  }

  function switchMode(next, setURL) {
    mode = next;
    for (const tab of tabs) {
      const active = tab.dataset.mode === mode;
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active ? 0 : -1;
    }
    el("workspace").hidden = !basic();
    el("extra-workspace").hidden = basic();
    el(basic() ? "workspace" : "extra-workspace").setAttribute("aria-labelledby", "phase-tab-" + mode);
    if (basic()) {
      if (!states[mode]) states[mode] = demoState(mode);
      document.querySelectorAll("[data-for]").forEach(element => { element.hidden = element.dataset.for !== mode; });
      el("file").value = "";
      el("blank").value = "";
      el("text").value = current().pastedText || "";
      el("search").value = current().search;
      settingsInputs();
    }
    setLanguage(lang, setURL);
    render();
  }

  function pickCandidate(candidate, preserveFocus) {
    const state = current();
    state.referenceID = state.referenceID === candidate.group.id ? null : candidate.group.id;
    renderReferences();
    renderPlot();
    if (preserveFocus) el("candidate-list").querySelector('[data-reference="' + candidate.group.id + '"]')?.focus();
  }

  function selectedReference() {
    const state = current();
    return state.result?.candidates.find(candidate => candidate.group.id === state.referenceID);
  }

  const supportText = candidate => t("support", {
    matched: candidate.supporting.length, total: candidate.inRange.length
  });

  const types = {
    "原始CIF模拟": ["CIF 模拟", "CIF simulation", "CIF-Simulation"],
    "精修结构模拟": ["精修结构模拟", "Refined structure simulation", "Simulation der verfeinerten Struktur"],
    "实验晶胞换算": ["晶胞换算", "Calculated from unit cell", "Aus der Elementarzelle berechnet"],
    "文献实测": ["文献实测", "Measured reference", "Gemessene Referenz"],
    "文献实验": ["文献实验", "Literature measurement", "Literaturmessung"],
    "官能团经验区间": ["官能团区间", "Functional-group range", "Bereich funktioneller Gruppen"],
    "实测峰·作者归属": ["实测峰，作者归属", "Measured and assigned by authors", "Gemessen und von Autoren zugeordnet"]
  };
  const typeText = group => types[group.kind]?.[langs.indexOf(lang)] || group.kind;
  function choice(candidate) {
    const {group} = candidate;
    const button = node("button", null, "phase-choice");
    button.type = "button";
    button.dataset.reference = group.id;
    button.setAttribute("aria-pressed", String(current().referenceID === group.id));
    const meta = mode === "xrd" ? [group.model, group.spaceGroup, typeText(group)].filter(Boolean) :
      [group.laser ? t("refExcitation", {value: group.laser}) : "", typeText(group)].filter(Boolean);
    if (candidate.supporting.length < 2) meta.push(t("singlePeak"));
    button.append(node("strong", group.name), node("span", candidate.supporting.length + " / " + candidate.inRange.length,
      "phase-ratio"), node("small", meta.join(" · ")));
    button.setAttribute("aria-label", group.name + " · " + supportText(candidate) + " · " + meta.join(" · "));
    button.addEventListener("click", event => pickCandidate(candidate, event.detail === 0));
    return button;
  }

  function normalized(value) {
    return value.normalize("NFKC").toLowerCase().replace(/[\s\p{P}]+/gu, "");
  }

  function renderReferences() {
    const state = current();
    const list = el("candidate-list");
    const groupCount = state.result?.groupCount ?? library[mode].length;
    el("candidates-title").textContent = t(mode + "Candidates");
    el("library-info").textContent = t("libraryInfo", {n: groupCount});
    const search = normalized(state.search);
    const matches = (state.result?.candidates || []).filter(({group}) =>
      !search || normalized([group.name, group.model, group.category, group.substrate || "", group.id].join(" ")).includes(search));
    const sourceId = state.sample?.source?.group?.id;
    if (sourceId) matches.sort((a,b) => Number(b.group.id === sourceId) - Number(a.group.id === sourceId));
    const keep = state.expanded ? 30 : 4;
    const materials = matches.filter(candidate => !candidate.group.substrate);
    const substrates = matches.filter(candidate => candidate.group.substrate);
    list.replaceChildren();
    if (materials.length) {
      const cards = node("div", null, "phase-choices");
      cards.append(...materials.slice(0, keep).map(choice));
      list.append(cards);
    }
    if (substrates.length) {
      const cards = node("div", null, "phase-choices");
      cards.append(...substrates.slice(0, state.expanded ? 12 : 2).map(choice));
      list.append(node("h3", t("substrateHits"), "phase-subheading"), cards);
    }
    if (!matches.length) list.append(node("p", t(state.sample ? "noCandidates" : "empty"), "phase-note"));
    el("more").hidden = materials.length <= 4 && substrates.length <= 2;
    el("more").textContent = t(state.expanded ? "fewer" : "more");
    renderReferenceDetail(selectedReference());
  }

  function bandPosition(line) {
    if (line.low !== line.high) return fmt(line.low) + "–" + fmt(line.high);
    return fmt(line.center ?? line.low);
  }

  function renderReferenceDetail(candidate) {
    const panel = el("reference-detail");
    panel.replaceChildren();
    panel.hidden = !candidate;
    if (!candidate) return;
    const {group, hits} = candidate;
    const masked = hits.length - candidate.supporting.length;
    panel.append(node("h3", group.name));
    const context = [
      group.model, group.spaceGroup, group.temperature ? group.temperature + " K" : "",
      typeText(group), group.laser ? t("refExcitation", {value: group.laser}) : ""
    ].filter(Boolean);
    panel.append(node("p", context.join(" · "), "phase-note"));
    const coverage = t("coverageDetail", {
      support: supportText(candidate), outside: candidate.outOfRange,
      masked: masked ? t("blankMasked", {n: masked}) : ""
    });
    panel.append(node("p", coverage, "phase-note"));
    const givenLaser = current().settings.laser;
    const refLaser = Number(group.laser);
    if (givenLaser && Number.isFinite(refLaser) && refLaser > 0 && Math.abs(Number(givenLaser) - refLaser) > 1) {
      panel.append(node("p", t("laserDifferent"), "phase-note"));
    }
    if (group.source || group.location) panel.append(node("p", [group.source, group.location].filter(Boolean).join(" · "), "phase-note"));
    if (group.note) panel.append(node("p", group.note, "phase-note"));
    if (group.url) {
      const link = node("a", t("source"), "phase-source-link");
      link.href = group.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      panel.append(link);
    }
    const region = node("div", null, "phase-table-scroll");
    region.tabIndex = 0;
    region.setAttribute("aria-label", t("observed") + " / " + t("band"));
    const table = node("table", null, "phase-table");
    const header = table.createTHead().insertRow();
    for (const text of [t("observed"), t("band"), t("delta"), t("provenance")]) {
      const cell = node("th", text);
      cell.scope = "col";
      header.append(cell);
    }
    const body = table.createTBody();
    for (const hit of hits.slice().sort((a, b) => a.peak.x - b.peak.x)) {
      const row = body.insertRow();
      row.append(node("td", fmt(hit.peak.x)), node("td", bandPosition(hit.line)),
        node("td", fmt(hit.centerOffset ?? hit.distance)));
      const context = mode === "xrd" ? hit.line.label : [hit.line.label, hit.line.location, hit.line.note].filter(Boolean).join(" · ");
      row.append(node("td", context || "—"));
    }
    region.append(table);
    panel.append(region);
  }

  function status(peak) {
    return t(peak.status, {n: peak.references.length});
  }

  function focusPeak(peak) {
    const state = current();
    state.focusPeak = state.focusPeak === peak ? null : peak;
    el("peak-rows").querySelectorAll("tr").forEach(row => {
      const active = Number(row.dataset.index) === state.focusPeak?.i;
      row.toggleAttribute("data-active", active);
      row.querySelector("button").setAttribute("aria-pressed", String(active));
    });
    renderPlot();
  }

  function renderPeaks() {
    const state = current();
    const peaks = state.result?.peaks || [];
    el("peak-x").textContent = t(mode + "X");
    el("peak-d").hidden = mode !== "xrd";
    el("peaks-info").textContent = peaks.length ? t("peakInfo", {
      n: peaks.length, unassigned: peaks.filter(peak => peak.status === "unassigned").length
    }) : "";
    el("no-peaks").textContent = peaks.length ? "" : t(state.sample ? "noPeaks" : "empty");
    el("peak-scroll").hidden = !peaks.length;
    const rows = el("peak-rows");
    rows.replaceChildren();
    const sequence = mode === "ftir" ? peaks.slice().reverse() : peaks;
    for (const peak of sequence) {
      const row = rows.insertRow();
      row.dataset.index = String(peak.i);
      const control = node("button", fmt(peak.x), "phase-link-button");
      control.type = "button";
      control.setAttribute("aria-pressed", String(state.focusPeak === peak));
      control.addEventListener("click", () => focusPeak(peak));
      row.insertCell().append(control);
      if (mode === "xrd") row.insertCell().textContent = fmt(model.spacing(peak.x, state.settings.wavelength), 4);
      row.insertCell().textContent = fmt(peak.y, 5);
      const assignment = row.insertCell();
      if (!peak.references.length) {
        assignment.textContent = status(peak);
        continue;
      }
      const detail = node("details", null, "phase-peak-ref");
      detail.append(node("summary", status(peak)));
      const labels = node("div", null, "phase-ref-items");
      for (const entry of peak.references) {
        const button = node("button", entry.name + " · " + bandPosition(entry.hit.line) + " " + unit(), "phase-link-button");
        button.type = "button";
        button.addEventListener("click", () => {
          const candidate = state.result.candidates.find(item => item.group.id === entry.id);
          if (candidate) {
            state.referenceID = candidate.group.id;
            renderReferences();
            renderPlot();
            el("reference-detail").scrollIntoView({block: "nearest"});
          }
        });
        labels.append(button);
      }
      detail.append(labels);
      assignment.append(detail);
    }
  }

  function renderPlot() {
    const state = current();
    const reference = selectedReference();
    el("ref-legend").hidden = !reference;
    el("ref-label").textContent = reference ? t("refLabel") + " · " + reference.group.name : "";
    PhasePlot.draw({
      points: state.sample?.points ?? null, blank: state.blank?.points ?? null,
      peaks: state.result?.peaks ?? [], markers: state.markers, focusPeak: state.focusPeak, reference,
      reverse: mode === "ftir", xLabel: t(mode + "X"), yLabel: spectrumLabel(),
      locale: locale(), digits: digits(), onPick: focusPeak
    });
  }

  function render() {
    if (!basic()) {
      PhaseExtras.show(mode, {t, locale: locale(), openCsv: showCsv, preset:selected, exampleName, renderProvenance});
      return;
    }
    if (refreshDemo(current(), mode)) {
      settingsInputs();
      el("search").value = current().search;
    }
    refreshSource();
    renderMessages();
    renderReferences();
    renderPeaks();
    renderPlot();
    const suffix = {xrd: "Xrd", ftir: "Ftir", raman: "Raman"}[mode];
    el("method-text").textContent = t("methodBase") + " " + t("method" + suffix);
  }

  function installData(parsed, target, name, activeMode, state, pasted = false) {
    const data = {points: parsed.points, name, pasted, simulated: false};
    if (target === "sample" && activeMode === "ftir" && state.settings.ordinate === "transmittance" &&
      data.points.some(point => point[1] <= 0)) throw Error("transmittanceError");
    state[target] = data;
    if (target === "sample") {
      state.exampleActive = false;
      state.pausedImport = null;
      if (state.blank?.simulated) state.blank = null;
    }
    state.referenceID = null;
    const message = parsed.duplicates ? {key: "duplicates", args: {n: parsed.duplicates}} : null;
    if (target === "sample") state.lastImport = message;
    else state.lastSettings = message;
    recompute(state, activeMode);
    if (mode === activeMode) render();
  }

  function inputError(state, target, error) {
    const key = Object.hasOwn(PhaseStrings, error.message) ? error.message : "readError";
    const message = {key, error: true};
    if (target === "sample") state.lastImport = message;
    else state.lastSettings = message;
    if (state === current()) renderMessages();
  }

  async function loadFile(file, target) {
    const activeMode = mode, state = current();
    const request = ++state.requests[target];
    try {
      const text = await model.readFile(file);
      if (request !== state.requests[target] || state !== states[activeMode]) return;
      installData(model.parse(text, activeMode), target, file.name, activeMode, state);
    } catch (error) {
      if (request === state.requests[target] && state === states[activeMode]) inputError(state, target, error);
    }
  }

  function applySettings() {
    const state = current();
    const settings = {...state.settings};
    try {
      for (const key of ["tolerance", "threshold", ...(mode === "xrd" ? ["wavelength"] : [])]) {
        const field = el(key);
        if (!field.value || !field.checkValidity()) throw Error("rangeError");
        settings[key] = field.valueAsNumber;
      }
      if (mode === "xrd") settings.substrate = el("substrate").value;
      if (mode === "ftir") {
        settings.ordinate = el("ordinate").value;
        if (state.sample?.simulated && settings.ordinate !== state.settings.ordinate) {
          const example = state.sample.absorbance;
          state.sample.points = settings.ordinate === "transmittance" ?
            example.map(([x, absorbance]) => [x, 100 * 10 ** (-absorbance)]) : example;
        }
        if (settings.ordinate === "transmittance" && state.sample?.points.some(point => point[1] <= 0)) {
          throw Error("transmittanceError");
        }
      }
      if (mode === "raman") {
        if (!el("laser").checkValidity()) throw Error("rangeError");
        settings.laser = el("laser").value;
      }
      if (mode === "xrd" && state.exampleActive && settings.wavelength !== state.settings.wavelength) state.exampleId = null;
      state.settings = settings;
      state.lastSettings = null;
      if (!refreshDemo(state, mode)) recompute(state, mode);
      settingsInputs();
      render();
    } catch (error) {
      settingsInputs();
      inputError(state, "blank", error);
    }
  }

  function csvCell(value) {
    if (typeof value === "string" && /^[=+\-@\t\r]/.test(value)) value = "'" + value;
    return '"' + String(value ?? "").replace(/"/g, '""') + '"';
  }

  function exportPeaks() {
    const state = current();
    const header = [
      "technique", "data_source", "sample", "x", "x_unit", "y_raw", "y_type", "d_A",
      "xray_wavelength_A", "excitation_nm", "tolerance", "height_threshold_pct",
      "blank_substrate", "reference_status", "reference_groups", "reference_sources",
      "example_material", "example_phase_model", "example_provenance", "example_source"
    ];
    const rows = state.result.peaks.map(peak => [
      mode, state.sample.simulated ? "simulated" : "imported", datasetName(),
      peak.x, mode === "xrd" ? "degree_2theta" : "cm^-1", peak.y, state.settings.ordinate || "intensity",
      mode === "xrd" ? model.spacing(peak.x, state.settings.wavelength) : "",
      state.settings.wavelength, state.settings.laser, state.settings.tolerance, state.settings.threshold,
      state.blank ? state.blank.simulated ? "simulated" : state.blank.name : "",
      peak.status, peak.references.map(item => item.id + " " + item.name).join(" | "),
      Array.from(new Set(peak.references.map(item => item.group.url).filter(Boolean))).join(" | "),
      state.sample.preset?.material.key, state.sample.source?.compositionOnly ? "" : state.sample.preset?.ref,
      state.sample.source?.type, state.sample.source?.url
    ]);
    showCsv(mode + "-peaks.csv", header, rows, "csvTitle");
  }

  function showCsv(filename, header, rows, titleKey) {
    const csv = "\uFEFF" + [header, ...rows].map(row => row.map(csvCell).join(",")).join("\r\n");
    if (exportURL) URL.revokeObjectURL(exportURL);
    exportURL = URL.createObjectURL(new Blob([csv], {type: "text/csv;charset=utf-8"}));
    el("csv-title").textContent = t(titleKey);
    el("download").href = exportURL;
    el("download").download = filename;
    el("csv-name").textContent = filename;
    el("csv-text").value = csv;
    el("csv-status").textContent = "";
    el("csv").showModal();
  }

  for (const tab of tabs) {
    tab.addEventListener("click", () => switchMode(tab.dataset.mode, true));
    tab.addEventListener("keydown", event => {
      const index = modes.indexOf(mode);
      const moves = {ArrowLeft: (index + modes.length - 1) % modes.length,
        ArrowRight: (index + 1) % modes.length, Home: 0, End: modes.length - 1};
      if (!Object.hasOwn(moves, event.key)) return;
      event.preventDefault();
      switchMode(modes[moves[event.key]], true);
      tabs[moves[event.key]].focus();
    });
  }
  for (const link of document.querySelectorAll("[data-language]")) {
    link.addEventListener("click", event => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      setLanguage(link.dataset.language, true);
      render();
    });
  }
  el("theme").addEventListener("click", () => {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    setTheme(next);
    try { localStorage.setItem("weiwei-research-theme", next); } catch { /* Storage is optional. */ }
    if (basic()) renderPlot();
    else PhaseExtras.redraw();
  });
  el("diffraction-link").addEventListener("click", () => {
    switchMode("diffraction", true);
    el("tab-diffraction").focus();
  });
  for (const [id, target] of [["file", "sample"], ["blank", "blank"]]) {
    el(id).addEventListener("change", event => {
      const file = event.target.files[0];
      if (file) loadFile(file, target);
      event.target.value = "";
    });
  }
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
    if (files.length === 1) loadFile(files[0], "sample");
    else if (files.length > 1) inputError(current(), "sample", Error("filesError"));
  });
  el("text").addEventListener("input", () => { current().pastedText = el("text").value; });
  el("use-text").addEventListener("click", () => {
    const state = current();
    state.requests.sample += 1;
    try {
      const text = el("text").value;
      if (text.length > 8 * 1024 * 1024) throw Error("sizeError");
      installData(model.parse(text, mode), "sample", "", mode, state, true);
    } catch (error) {
      inputError(state, "sample", error);
    }
  });
  el("crystal").addEventListener("change", event => selectMaterial(selected.material.key, event.target.value, "phase"));
  el("demo").addEventListener("click", () => {
    const state = current();
    state.requests.sample += 1;
    state.requests.blank += 1;
    if (state.pausedImport) {
      Object.assign(state, state.pausedImport, {pausedImport: null, exampleActive: false, exampleId: null});
      recompute(state, mode);
      settingsInputs();
      el("search").value = state.search;
    } else {
      if (state.sample && !state.sample.simulated) {
        const {sample, blank, settings, referenceID, search, expanded, markers, lastImport, lastSettings} = state;
        state.pausedImport = {sample, blank, settings, referenceID, search, expanded, markers, lastImport, lastSettings};
        state.blank = null;
        state.settings = {...model.defaults[mode]};
        state.expanded = false;
        state.markers = true;
        state.lastSettings = null;
      }
      state.exampleActive = true;
      state.exampleId = null;
      state.lastImport = null;
    }
    render();
  });
  el("clear").addEventListener("click", () => {
    const state = current();
    state.sample = null;
    state.exampleActive = false;
    state.lastImport = null;
    state.requests.sample += 1;
    if (state.blank?.simulated) state.blank = null;
    recompute(state, mode);
    render();
    el("file").focus();
  });
  el("blank-clear").addEventListener("click", () => {
    const state = current();
    state.blank = null;
    state.requests.blank += 1;
    state.lastSettings = null;
    recompute(state, mode);
    render();
    el("blank").focus();
  });
  for (const key of ["tolerance", "threshold", "wavelength", "substrate", "ordinate", "laser"]) {
    el(key).addEventListener("change", applySettings);
  }
  el("markers").addEventListener("change", () => {
    current().markers = el("markers").checked;
    renderPlot();
  });
  el("search").addEventListener("input", () => {
    current().search = el("search").value;
    renderReferences();
  });
  el("more").addEventListener("click", () => {
    current().expanded = !current().expanded;
    renderReferences();
  });
  for (const button of document.querySelectorAll("[data-phase-jump]")) {
    button.addEventListener("click", () => {
      const heading = document.getElementById(button.dataset.phaseJump);
      heading.focus({preventScroll: true});
      heading.scrollIntoView({block: "start"});
    });
  }
  el("export").addEventListener("click", exportPeaks);
  el("copy").addEventListener("click", async () => {
    const text = el("csv-text");
    try {
      await navigator.clipboard.writeText(text.value);
      el("csv-status").textContent = t("copied");
    } catch {
      text.focus();
      text.select();
      el("csv-status").textContent = t("selectText");
    }
  });

  let theme;
  try { theme = localStorage.getItem("weiwei-research-theme"); } catch { /* Storage is optional. */ }
  if (theme !== "light" && theme !== "dark") theme = matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  setTheme(theme);
  const compactPanel = matchMedia("(max-width: 690px)");
  el("settings-panel").open = !compactPanel.matches;
  el("materials-panel").open = !compactPanel.matches;
  compactPanel.addEventListener("change", event => { el("materials-panel").open = !event.matches; });
  switchMode(mode, false);
})();
