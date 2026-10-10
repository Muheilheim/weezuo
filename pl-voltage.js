(function () {
  "use strict";
  const root = document.getElementById("pl-voltage-calculator");
  if (!root || !window.PLVoltage) return;
  const field = (id, label, value, attributes = "") => '<div class="rl-field"><label for="pl-' + id + '">' + label + '</label><input id="pl-' + id + '" type="number" value="' + value + '" step="any" aria-describedby="pl-message" ' + attributes + '></div>';
  root.innerHTML = '<div class="sp-shell pl-shell"><div class="rl-main"><form class="rl-controls" id="pl-form">' +
    '<h3>PL calibration</h3><p class="rl-small">Use integrated, background-corrected PL measured under consistent optical conditions.</p>' +
    '<div class="rl-field"><label for="pl-mode">Calculation method</label><select id="pl-mode"><option value="reference">Known internal-voltage reference</option><option value="relative">Relative voltage change only</option><option value="absolute">Absolute external PLQY</option></select></div>' +
    field("temperature", "Temperature T (K)", "300", 'min="0" required') +
    '<fieldset id="pl-intensity-fields"><legend class="sr-only">Relative PL intensities</legend>' +
    '<details class="pl-import" id="pl-import"><summary>Import steady-state PL spectra</summary><p class="rl-small">Use unnormalized spectra acquired with the same detector settings and optical collection conditions.</p><p class="rl-small">CSV, TSV or TXT: first column wavelength in nm, then one PL intensity column per sample. An optional header names the samples.</p>' +
    '<div class="rl-field"><label for="pl-data">Wavelength and PL columns</label><textarea id="pl-data" spellcheck="false" rows="5" aria-describedby="pl-import-message" placeholder="Wavelength_nm,Reference,Sample_A,Sample_B&#10;700,10,1,2&#10;750,100,10,20&#10;800,10,1,2"></textarea></div>' +
    '<input type="file" id="pl-file" hidden accept=".csv,.tsv,.txt,text/csv,text/plain" aria-label="Import steady-state PL spectra"><div class="sp-file-picker"><button type="button" class="rl-action" id="pl-file-choose">Choose file</button><span id="pl-file-name" class="rl-small">No file selected</span></div>' +
    '<div class="sp-row"><button type="button" class="rl-action" id="pl-import-calculate">Integrate PL spectra</button><button type="button" class="rl-action" id="pl-import-clear">Clear PL data</button></div><p class="sp-message" id="pl-import-message" role="status"></p>' +
    '<fieldset id="pl-spectrum-fields" hidden disabled><div class="rl-field"><label for="pl-sample">Displayed sample</label><select id="pl-sample"></select></div><div class="rl-field"><label for="pl-reference-sample">Reference sample</label><select id="pl-reference-sample"></select></div>' +
    field("wave-min", "Integration start (nm)", "700", 'min="0"') + field("wave-max", "Integration end (nm)", "800", 'min="0"') + field("baseline", "Constant spectral background (a.u.)", "0", 'min="0"') +
    '<p class="rl-small">The same interval and constant background apply to every column. Negative spectral values are retained. Detector response is not corrected automatically.</p></fieldset></details>' +
    field("intensity", "Measured integrated PL I (a.u.)", "100", 'min="0" required') +
    field("reference-intensity", "Reference integrated PL Iref (a.u.)", "1000", 'min="0" required') +
    field("background", "Common PL background B (a.u.)", "0", 'min="0" required') + '</fieldset>' +
    '<fieldset id="pl-reference-fields"><legend class="sr-only">Internal-voltage calibration</legend>' +
    field("reference-voltage", "Known internal reference Vref (V)", "1.2", 'min="0" required') + '</fieldset>' +
    '<fieldset id="pl-absolute-fields" hidden disabled><legend class="sr-only">Absolute PL calibration</legend>' +
    field("plqy", "External PLQY (%)", "1", 'min="0" max="100" required') +
    field("generation", "Photogenerated current JG (mA/cm²)", "25", 'min="0" required') +
    field("j0rad", "Radiative dark current J0,rad (A/cm²)", "1e-23", 'min="0" required') + '</fieldset>' +
    '<fieldset id="pl-terminal-fields"><legend class="sr-only">Terminal comparison</legend>' +
    field("terminal-voltage", "Measured terminal voltage (V, optional)", "") + '</fieldset>' +
    '<p class="sp-message" id="pl-message" role="status"></p><div class="sp-row"><button type="button" class="rl-action" id="pl-reset">Reset PL example</button></div>' +
    '</form><div class="rl-output"><div class="rl-chart-heading"><div><h3>PL-derived internal equivalent voltage</h3><p class="rl-small">Single-point inference · QFLS/q</p></div></div>' +
    '<dl class="rl-metrics" aria-live="polite" aria-atomic="true"><div><dt id="pl-main-label">Internal equivalent voltage</dt><dd id="pl-value">—</dd><span class="rl-metric-note" id="pl-main-note">Vint = QFLS/q</span></div>' +
    '<div><dt>Quasi-Fermi-level splitting</dt><dd id="pl-qfls">—</dd><span class="rl-metric-note">QFLS (eV)</span></div>' +
    '<div><dt id="pl-change-label">Change from reference</dt><dd id="pl-change">—</dd><span class="rl-metric-note" id="pl-change-note">ΔVint (mV)</span></div>' +
    '<div><dt>Internal − terminal voltage</dt><dd id="pl-difference">—</dd><span class="rl-metric-note">Vint − Vterminal (mV)</span></div></dl>' +
    '<div class="rl-chart-heading pl-chart-heading"><div><h3>PL–voltage relationship</h3><p class="rl-small" id="pl-chart-context"></p></div><div class="sp-chart-switch" role="group" aria-label="PL horizontal axis"><button type="button" data-pl-axis="log" aria-pressed="true">Log PL axis</button><button type="button" data-pl-axis="linear" aria-pressed="false">Linear PL axis</button></div></div>' +
    '<svg class="rl-chart pl-chart" id="pl-chart" viewBox="0 0 640 360" role="img" aria-labelledby="pl-chart-title pl-chart-description"><title id="pl-chart-title">PL–voltage relationship</title><desc id="pl-chart-description">Model curve with the current input point and an adjustable probe. Use the slider below to inspect values.</desc><g id="pl-chart-content"></g></svg>' +
    '<div class="pl-legend"><span class="pl-input-marker">Input point</span><span class="pl-probe-marker">Curve probe</span></div>' +
    '<div class="rl-probe"><div class="rl-probe-top"><label for="pl-probe">Inspect PL on the curve</label><output id="pl-probe-reading" for="pl-probe"></output></div><input id="pl-probe" type="range" min="0" max="4" step="0.001" value="2" aria-describedby="pl-probe-help"></div>' +
    '<p class="sp-caption" id="pl-probe-help">Move the slider, or point to the plot. The curve holds temperature and optical response fixed; points beyond the measurement are model extrapolations.</p>' +
    '<p class="rl-equation pl-equation" id="pl-equation"></p><p class="sp-summary" id="pl-calibration-note"></p>' +
    '<p class="pl-sensitivity"><span>Voltage change for a tenfold PL increase at this temperature:</span> <strong id="pl-decade">—</strong></p>' +
    '<p class="sp-caption">Illustrative defaults; replace them with your measured values. Relative PL alone determines a voltage change, not an absolute voltage.</p>' +
    '<section id="pl-batch" hidden><h3>Results for uploaded spectra</h3><p class="rl-small" id="pl-batch-span"></p><div class="rl-table-wrap"><table class="rl-table"><thead><tr><th scope="col">Sample</th><th scope="col">Background-subtracted integral (a.u.)</th><th scope="col">ΔVint (mV)</th><th scope="col">Vint (V)</th></tr></thead><tbody id="pl-batch-rows"></tbody></table></div><p class="rl-small">An uncalibrated spectrum gives a voltage change relative to the selected reference. For absolute voltage, choose a known internal-voltage reference and enter its measured Vref.</p></section>' +
    '<div class="sp-row"><button type="button" class="rl-action" id="pl-export">Export PL result ↓</button></div>' +
    '<p class="sp-caption">PL inputs and results stay in this browser.</p></div></div></div>' +
    '<details class="rl-method"><summary>PL voltage: assumptions, units &amp; sources</summary>' +
    '<p>At fixed temperature and optical response, integrated PL is proportional to exp(QFLS/kBT). The intensity ratio therefore gives ΔVint = (kBT/q) ln[(I − B)/(Iref − B)]. No diode ideality factor multiplies this PL-to-voltage conversion.</p>' +
    '<p>A reference point must have an independently known internal voltage QFLS/q. Using measured Voc as Vref additionally assumes negligible internal-to-terminal voltage mismatch at that reference point.</p>' +
    '<p>Absolute calibration uses Vint = (kBT/q) ln[ηPL,ext JG/J0,rad]. External PLQY is entered as a percentage; JG in mA/cm² is converted to A/cm² before comparison with J0,rad. Both currents must use the same area and optical emission convention. J0,rad must be independently supplied from a consistent absorptance/EQE and thermal-emission calculation.</p>' +
    '<p>These formulas use the Boltzmann approximation and a steady carrier distribution. Keep temperature, collection geometry, detector settings and spectral response consistent; correct background and avoid detector saturation. Changes in spectrum, optical outcoupling, reabsorption or sample state can invalidate a simple PL ratio.</p>' +
    '<p>Vint describes absorber QFLS/q, not built-in voltage or terminal voltage. A single PL point does not determine pseudo-FF. The signed internal-to-terminal difference alone does not identify a unique loss mechanism.</p>' +
    '<div class="rl-source-links"><a href="https://doi.org/10.1002/aenm.201901631" target="_blank" rel="noopener noreferrer">QFLS and terminal voltage · Caprioglio et al. ↗</a><a href="https://doi.org/10.1002/aenm.201904134" target="_blank" rel="noopener noreferrer">PL characterization · Kirchartz et al. ↗</a></div></details>';
  const $ = id => root.querySelector("#pl-" + id);
  const number = id => $(id).value.trim() === "" ? NaN : Number($(id).value);
  let result = null, parameters = null, relation = null, axis = "log";
  let spectra = null, integrals = null, batch = null, fileVersion = 0, importError = "";
  function modeFields() {
    const mode = $("mode").value;
    for (const [id, show] of [["intensity-fields", mode !== "absolute"], ["reference-fields", mode === "reference"], ["absolute-fields", mode === "absolute"], ["terminal-fields", mode !== "relative"]]) {
      $(id).hidden = !show; $(id).disabled = !show;
    }
    $("main-label").textContent = mode === "relative" ? "Relative internal voltage change" : "Internal equivalent voltage";
    $("main-note").textContent = mode === "relative" ? "ΔVint (mV)" : "Vint = QFLS/q";
    $("change-label").textContent = mode === "absolute" ? "Nonradiative voltage deficit" : "Change from reference";
    $("change-note").textContent = mode === "absolute" ? "−(kBT/q) ln(ηPL,ext) · mV" : "ΔVint (mV)";
    $("equation").textContent = mode === "absolute" ? "Vint = (kBT/q) ln[ηPL,ext JG/J0,rad]" : (mode === "reference" ? "Vint = Vref + (kBT/q) ln[(I − B)/(Iref − B)]" : "ΔVint = (kBT/q) ln[(I − B)/(Iref − B)]");
    $("calibration-note").textContent = mode === "absolute" ? (spectra ? "Raw arbitrary-unit spectra do not determine external PLQY. Supply independently measured PLQY, JG and J0,rad." : "Absolute PLQY requires a consistent radiative dark current and photogeneration calibration.") : mode === "reference" ? "Vref is an independently calibrated internal voltage. It is not automatically the measured Voc." : "Only the voltage change is known. Absolute QFLS and terminal comparison require an internal-voltage reference or absolute PL calibration.";
  }
  function calculate() {
    result = null; $("export").disabled = true;
    root.querySelectorAll("input").forEach(input => input.removeAttribute("aria-invalid"));
    try {
      if (importError && $("mode").value !== "absolute") throw Error(importError);
      if (spectra && $("mode").value !== "absolute") {
        integrals = window.PLVoltage.integrateSpectra(spectra, number("wave-min"), number("wave-max"));
        const baseline = number("baseline");
        if (!Number.isFinite(baseline) || baseline < 0) throw Error("Enter a finite, nonnegative spectral background.");
        $("intensity").value = integrals[Number($("sample").value)];
        $("reference-intensity").value = integrals[Number($("reference-sample").value)];
        $("background").value = baseline * (number("wave-max") - number("wave-min"));
      }
      parameters = {mode: $("mode").value, temperature: number("temperature"), intensity: number("intensity"), referenceIntensity: number("reference-intensity"), background: number("background"), referenceVoltage: number("reference-voltage"), plqy: number("plqy"), generation: number("generation"), j0rad: number("j0rad"), terminalVoltage: $("terminal-voltage").value.trim() === "" ? null : number("terminal-voltage")};
      result = window.PLVoltage.calculate(parameters);
      relation = window.PLVoltage.curve(parameters);
      const display = (value, unit, digits) => value === null ? "—" : value.toFixed(digits) + " " + unit;
      $("value").textContent = parameters.mode === "relative" ? display(result.delta * 1000, "mV", 3) : display(result.voltage, "V", 5);
      $("qfls").textContent = display(result.qfls, "eV", 5);
      $("change").textContent = display((parameters.mode === "absolute" ? result.nonradiativeLoss : result.delta) * 1000, "mV", 3);
      $("difference").textContent = display(result.difference === null ? null : result.difference * 1000, "mV", 3);
      $("decade").textContent = display(result.perDecade * 1000, "mV", 3);
      $("message").textContent = ""; $("message").dataset.error = "false"; $("export").disabled = false;
      drawBatch(); drawChart();
    } catch (error) {
      result = null; relation = null; batch = null; $("batch").hidden = true; $("batch-rows").replaceChildren(); $("chart-content").innerHTML = ""; $("probe").disabled = true; $("probe-reading").textContent = "—";
      ["value", "qfls", "change", "difference", "decade"].forEach(id => $(id).textContent = "—");
      $("message").textContent = error.message; $("message").dataset.error = "true";
      root.querySelectorAll("input:enabled").forEach(input => { if (!input.validity.valid) input.setAttribute("aria-invalid", "true"); });
    }
  }
  function drawBatch() {
    $("batch").hidden = !spectra || parameters.mode === "absolute";
    $("batch-rows").replaceChildren(); batch = null;
    if ($("batch").hidden) return;
    batch = spectra.names.map((name, i) => {
      try {
        const value = window.PLVoltage.calculate({...parameters, intensity:integrals[i], terminalVoltage:null});
        return {name, integral:integrals[i], corrected:integrals[i] - parameters.background, ...value};
      } catch (error) { return {name, integral:integrals[i], corrected:integrals[i] - parameters.background, error:error.message}; }
    });
    $("batch-span").textContent = number("wave-min") + "–" + number("wave-max") + " nm";
    for (const item of batch) {
      const row = document.createElement("tr");
      for (const [i, text] of [item.name, item.corrected.toPrecision(6), item.error ? "Invalid PL integral" : (item.delta * 1000).toFixed(3), item.voltage === null || item.error ? "—" : item.voltage.toFixed(5)].entries()) {
        const cell = document.createElement(i ? "td" : "th"); cell.textContent = text;
        if (!i) cell.scope = "row";
        row.append(cell);
      }
      $("batch-rows").append(row);
    }
  }
  function clearImport() {
    fileVersion++; spectra = null; integrals = null; batch = null; importError = "";
    $("data").value = ""; $("file").value = ""; $("file-name").textContent = "No file selected";
    $("import-message").textContent = ""; $("data").removeAttribute("aria-invalid");
    $("spectrum-fields").hidden = true; $("spectrum-fields").disabled = true;
    for (const id of ["intensity", "reference-intensity", "background"]) $(id).readOnly = false;
  }
  function loadSpectra() {
    try {
      spectra = window.PLVoltage.parseSpectra($("data").value); importError = "";
      for (const id of ["sample", "reference-sample"]) {
        $(id).replaceChildren();
        spectra.names.forEach((name, i) => { const option = document.createElement("option"); option.value = i; option.textContent = name; $(id).append(option); });
      }
      $("sample").value = spectra.names.length > 1 ? "1" : "0"; $("reference-sample").value = "0";
      $("wave-min").value = spectra.points[0][0]; $("wave-max").value = spectra.points.at(-1)[0]; $("baseline").value = "0";
      $("spectrum-fields").hidden = false; $("spectrum-fields").disabled = false;
      for (const id of ["intensity", "reference-intensity", "background"]) $(id).readOnly = true;
      $("mode").value = "relative"; $("reference-voltage").value = "";
      $("data").removeAttribute("aria-invalid"); $("import-message").dataset.error = "false";
      $("import-message").textContent = spectra.sorted ? "PL spectra loaded. Wavelengths sorted in ascending order." : "PL spectra loaded. Relative voltage mode selected; supply Vref for absolute voltage.";
      modeFields(); calculate();
    } catch (error) {
      spectra = null; importError = error.message;
      $("spectrum-fields").hidden = true; $("spectrum-fields").disabled = true;
      $("data").setAttribute("aria-invalid", "true"); $("import-message").textContent = error.message; $("import-message").dataset.error = "true"; calculate();
    }
  }
  $("data").addEventListener("input", () => {
    $("file").value = ""; $("file-name").textContent = "Pasted PL data";
    fileVersion++; spectra = null; importError = "PL data changed. Select Integrate PL spectra to update the result.";
    $("spectrum-fields").hidden = true; $("spectrum-fields").disabled = true;
    $("import-message").textContent = importError; $("import-message").dataset.error = "false"; calculate();
  });
  $("import-calculate").addEventListener("click", () => { fileVersion++; loadSpectra(); });
  $("import-clear").addEventListener("click", () => { clearImport(); $("intensity").value = ""; $("reference-intensity").value = ""; $("background").value = "0"; calculate(); });
  $("file-choose").addEventListener("click", () => $("file").click());
  $("file").addEventListener("change", async () => {
    const file = $("file").files[0], version = ++fileVersion; if (!file) return;
    $("file-name").textContent = file.name; $("import").open = true;
    spectra = null; importError = "Reading PL file…"; calculate();
    try {
      if (file.size > 2000000) throw Error("Use a PL text file smaller than 2 MB.");
      if (!/\.(csv|tsv|txt)$/i.test(file.name)) throw Error("Save PL data as CSV, TSV or TXT, or paste the columns from Excel.");
      const text = await file.text(); if (version !== fileVersion) return;
      $("data").value = text; loadSpectra();
    } catch (error) {
      if (version !== fileVersion) return;
      importError = error.message; $("import-message").textContent = error.message; $("import-message").dataset.error = "true"; calculate();
    }
  });
  const plot = {left:72, right:618, top:30, bottom:294};
  let yMin = 0, yMax = 1;
  const xPosition = logPL => plot.left + (axis === "log" ? (logPL - relation.minLog) / (relation.maxLog - relation.minLog) : (10 ** logPL - 10 ** relation.minLog) / (10 ** relation.maxLog - 10 ** relation.minLog)) * (plot.right - plot.left);
  const yPosition = value => plot.bottom - (value - yMin) / (yMax - yMin) * (plot.bottom - plot.top);
  const plText = logPL => logPL < -300 || logPL > 300 ? "10^" + logPL.toFixed(2) : Number((10 ** logPL).toPrecision(4)).toString();
  function probe(logPL) {
    if (!relation) return;
    const value = relation.base + relation.slope * logPL, x = xPosition(logPL), y = yPosition(value);
    $("probe").value = logPL;
    $("probe-reading").textContent = plText(logPL) + (parameters.mode === "absolute" ? " %" : " a.u.") + " → " + value.toFixed(parameters.mode === "relative" ? 3 : 5) + (parameters.mode === "relative" ? " mV" : " V");
    $("probe").setAttribute("aria-valuetext", $("probe-reading").textContent);
    $("probe-dot").setAttribute("cx", x); $("probe-dot").setAttribute("cy", y);
    $("probe-guide").setAttribute("d", "M" + x + " " + plot.bottom + "V" + y + "H" + plot.left);
  }
  function drawChart() {
    if (!relation) return;
    const linearAllowed = relation.minLog >= -300 && relation.maxLog <= 300;
    if (!linearAllowed) axis = "log";
    root.querySelectorAll("[data-pl-axis]").forEach(button => {
      button.setAttribute("aria-pressed", String(button.dataset.plAxis === axis));
      button.disabled = button.dataset.plAxis === "linear" && !linearAllowed;
    });
    const low = relation.points[0][1], high = relation.points.at(-1)[1], padding = (high - low) * 0.1;
    yMin = low - padding; yMax = high + padding;
    let svg = "";
    for (let i = 0; i <= 4; i++) {
      const value = yMin + (yMax - yMin) * i / 4, y = yPosition(value);
      svg += '<path class="pl-grid" d="M' + plot.left + ' ' + y + 'H' + plot.right + '"/><text class="pl-tick" x="64" y="' + (y + 4) + '" text-anchor="end">' + value.toFixed(parameters.mode === "relative" ? 0 : 2) + '</text>';
      const logPL = axis === "log" ? relation.minLog + (relation.maxLog - relation.minLog) * i / 4 : Math.log10(10 ** relation.minLog + (10 ** relation.maxLog - 10 ** relation.minLog) * i / 4);
      const x = xPosition(logPL);
      svg += '<path class="pl-grid" d="M' + x + ' ' + plot.top + 'V' + plot.bottom + '"/><text class="pl-tick" x="' + x + '" y="316" text-anchor="middle">' + plText(logPL) + '</text>';
    }
    const xLabel = parameters.mode === "absolute" ? "External PLQY (%)" : "Background-subtracted integrated PL intensity (a.u.)";
    const yLabel = parameters.mode === "relative" ? "Relative voltage (mV)" : "Internal voltage (V)";
    const path = relation.points.map(([x, y], i) => (i ? "L" : "M") + xPosition(x) + " " + yPosition(y)).join(" ");
    svg += '<path class="pl-curve" d="' + path + '"/><text class="pl-axis-label" x="345" y="349" text-anchor="middle">' + xLabel + '</text><text class="pl-axis-label" x="18" y="162" text-anchor="middle" transform="rotate(-90 18 162)">' + yLabel + '</text>';
    svg += '<path class="pl-probe-guide" id="pl-probe-guide"/><circle class="pl-input-dot" cx="' + xPosition(relation.measuredLog) + '" cy="' + yPosition(relation.measuredValue) + '" r="6"/><circle class="pl-probe-dot" id="pl-probe-dot" r="4"/>';
    $("chart-content").innerHTML = svg;
    $("chart-context").textContent = parameters.mode === "absolute" ? "Fixed JG and J0,rad; PLQY varies." : "Background-corrected integrated PL; fixed temperature and optical response.";
    $("probe").min = relation.minLog; $("probe").max = relation.maxLog; $("probe").disabled = false;
    probe(relation.measuredLog);
  }
  $("probe").addEventListener("input", () => probe(Number($("probe").value)));
  for (const eventName of ["pointermove", "pointerdown"]) $("chart").addEventListener(eventName, event => {
    if (!relation) return;
    const bounds = $("chart").getBoundingClientRect(), x = (event.clientX - bounds.left) / bounds.width * 640;
    if (x < plot.left || x > plot.right) return;
    const fraction = (x - plot.left) / (plot.right - plot.left);
    const logPL = axis === "log" ? relation.minLog + fraction * (relation.maxLog - relation.minLog) : Math.log10(10 ** relation.minLog + fraction * (10 ** relation.maxLog - 10 ** relation.minLog));
    probe(logPL);
  });
  root.querySelectorAll("[data-pl-axis]").forEach(button => button.addEventListener("click", () => { axis = button.dataset.plAxis; drawChart(); }));
  $("form").addEventListener("submit", event => event.preventDefault());
  $("form").addEventListener("input", event => { if (!["pl-data", "pl-file"].includes(event.target.id)) calculate(); });
  $("sample").addEventListener("change", calculate);
  $("reference-sample").addEventListener("change", () => { if (spectra && $("mode").value === "reference") $("reference-voltage").value = ""; calculate(); });
  $("mode").addEventListener("change", () => { modeFields(); calculate(); });
  $("reset").addEventListener("click", () => { clearImport(); $("form").reset(); modeFields(); calculate(); });
  $("export").addEventListener("click", () => {
    if (!result) return;
    const keys = parameters.mode === "absolute" ? ["plqy", "generation", "j0rad"] : ["intensity", "referenceIntensity", "background", ...(parameters.mode === "reference" ? ["referenceVoltage"] : [])];
    const csvLabel = value => /^\s*[=+@-]/.test(value) ? "'" + value : value;
    const importedRows = batch ? [["PL_source", csvLabel($("file-name").textContent)], ["integration_nm", number("wave-min"), number("wave-max")], ["constant_spectral_background_au", number("baseline")], ["reference_sample", csvLabel(spectra.names[Number($("reference-sample").value)])], ["method", "Piecewise-linear spectra; trapezoidal integral; no negative-value clipping or detector-response correction"], [], ["sample", "raw_integrated_PL_au", "background_subtracted_integrated_PL_au", "delta_Vint_mV", "Vint_V", "status"], ...batch.map(item => [csvLabel(item.name), item.integral, item.corrected, item.error ? "" : item.delta * 1000, item.voltage ?? "", item.error || "valid"]), []] : [];
    window.CSVExport.save("pl-internal-voltage.csv", [["method", parameters.mode], ["temperature_K", parameters.temperature], ...keys.map(key => [key, parameters[key]]), ["JG_unit", "mA/cm2"], ["J0rad_unit", "A/cm2"], ["PLQY_unit", "percent"], ["referenceVoltage_unit", "V"], ["terminalVoltage_V", parameters.mode === "relative" ? "" : parameters.terminalVoltage ?? ""], ["Vint_V", result.voltage ?? ""], ["QFLS_eV", result.qfls ?? ""], ["delta_Vint_V", result.delta ?? ""], ["nonradiative_deficit_V", result.nonradiativeLoss ?? ""], ["Vint_minus_terminal_V", result.difference ?? ""], ["assumption", "Boltzmann approximation; consistent temperature and optical response; Vref is internal QFLS/q"], [], ...importedRows, ["log10_PL_background_corrected_au_or_PLQY_percent", parameters.mode === "relative" ? "delta_Vint_mV" : "Vint_V"], ...relation.points]);
  });
  modeFields(); calculate();
})();
