(function () {
  "use strict";
  const root = document.getElementById("resistance-calculator");
  if (!root || !window.SolarResistance) return;
  const defaults = {voc: 1.15, jph: 25, n: 1.5, temperature: 298.15, rs: 2, rsh: 2000, pin: 100};
  const silicon = {voc: 0.65, jph: 35, n: 1, temperature: 300, rs: 2, rsh: 2000, pin: 100};
  const mode = "both", shown = ["ideal", "series", "shunt", "both"];
  let parameters = {...defaults}, plot = "jv", results, valid = true;
  const names = {ideal: "Ideal reference", series: "Series only", shunt: "Shunt only", both: "Both resistances"};
  const $ = selector => root.querySelector(selector);
  const $$ = selector => [...root.querySelectorAll(selector)];
  const fmt = (v, digits = 2) => Number(v).toFixed(digits);
  const numberField = (key, title, unit, step) => {
    const bounds = SolarResistance.limits[key];
    return '<div class="rl-field"><label for="rl-' + key + '">' + title + '</label><div class="rl-input-row"><input type="number" id="rl-' + key + '" data-param="' + key + '" min="' + bounds[0] + '" max="' + bounds[1] + '" step="' + step + '" value="' + defaults[key] + '" aria-describedby="rl-error"><span class="rl-unit">' + unit + '</span></div></div>';
  };
  const referenceField = (key, title, unit, step) => {
    const bounds = SolarResistance.limits[key];
    const slider = '<label class="sr-only" for="rl-' + key + '-slider">Adjust ' + title + '</label><input type="range" id="rl-' + key + '-slider" data-reference-slider="' + key + '" min="' + bounds[0] + '" max="' + bounds[1] + '" step="' + step + '" value="' + defaults[key] + '"><div class="rl-range-labels"><span>' + bounds[0] + ' ' + unit + '</span><span>' + bounds[1] + ' ' + unit + '</span></div>';
    return numberField(key, title, unit, step).replace(/<\/div>$/, slider + "</div>");
  };
  root.innerHTML =
    '<h3 class="sr-only">Effect of Both Resistances Calculator</h3><div class="rl-shell"><div class="rl-main"><form class="rl-controls" novalidate>' +
      '<h3>Explore the cell</h3><p class="rl-small">Set the ideal reference, then adjust Rₛ and Rₛₕ.</p>' +
      '<div class="rl-field rl-preset"><label for="rl-preset">Example parameters</label><select id="rl-preset"><option value="perovskite">Perovskite-like · illustrative</option><option value="silicon">Silicon-like · illustrative</option><option value="custom" disabled>Custom parameters</option></select></div>' +
      referenceField("voc", "Reference open-circuit voltage Vₒ꜀,₀", "V", "0.01") +
      referenceField("jph", "Reference short-circuit density Jₛ꜀,₀", "mA/cm²", "0.1") +
      '<fieldset class="rl-field" id="rl-series-controls"><legend>Series resistance Rₛ</legend><div class="rl-input-row"><label class="sr-only" for="rl-rs">Series resistance (Ω·cm²)</label><input id="rl-rs" type="number" data-param="rs" min="0" max="50" step="0.1" value="2" aria-describedby="rl-error"><span class="rl-unit">Ω·cm²</span></div><label class="sr-only" for="rl-rs-slider">Adjust series resistance</label><input type="range" id="rl-rs-slider" min="0" max="50" step="0.1" value="2"><div class="rl-range-labels"><span>0 · ideal</span><span>50</span></div></fieldset>' +
      '<fieldset class="rl-field" id="rl-shunt-controls"><legend>Shunt resistance Rₛₕ</legend><div class="rl-input-row"><label class="sr-only" for="rl-rsh">Shunt resistance (Ω·cm²)</label><input id="rl-rsh" type="number" data-param="rsh" min="10" max="1000000" step="any" value="2000" aria-describedby="rl-error"><span class="rl-unit">Ω·cm²</span></div><label class="sr-only" for="rl-rsh-slider">Adjust shunt resistance (logarithmic scale)</label><input type="range" id="rl-rsh-slider" min="1" max="6" step="0.01" value="3.30103"><div class="rl-range-labels"><span>10</span><span>10⁶ · log scale</span></div><label class="rl-check"><input id="rl-infinite" type="checkbox">Infinite Rₛₕ (no leakage)</label></fieldset>' +
      '<details class="rl-advanced"><summary>Diode &amp; illumination settings</summary><p class="rl-small">The visible voltage and short-circuit density define the reference cell (Rₛ = 0, Rₛₕ = ∞). Jₗ = Jₛ꜀,₀; J₀ is recalculated at the selected n and T.</p>' +
      numberField("n", "Diode ideality factor n", "—", "0.01") +
      numberField("temperature", "Cell temperature T", "K", "0.01") +
      numberField("pin", "Incident power density Pᵢₙ", "mW/cm²", "0.1") +
      '<p class="rl-small">Pᵢₙ sets the efficiency denominator only. Set Jₗ separately for the chosen illumination. Changing T keeps the entered reference voltage fixed; it does not forecast thermal degradation.</p></details>' +
      '<p id="rl-error" class="rl-error" role="status" hidden></p><div class="rl-actions"><button class="rl-action" id="rl-reset" type="button">Reset example</button></div>' +
    '</form><div class="rl-output">' +
      '<div class="rl-chart-heading"><div><h3 id="rl-chart-title">Current density–voltage</h3><p class="rl-small" id="rl-context"></p></div><div class="rl-plot-switch" role="group" aria-label="Chart type"><button type="button" data-plot="jv" aria-pressed="true">J–V</button><button type="button" data-plot="pv" aria-pressed="false">P–V</button></div></div>' +
      '<svg class="rl-chart" id="rl-chart" viewBox="0 0 640 360" role="img" aria-labelledby="rl-svg-title rl-svg-desc"><title id="rl-svg-title">Solar-cell current density versus voltage</title><desc id="rl-svg-desc">Calculated curves in the power-generating quadrant. Exact values are listed in the comparison table below.</desc><g id="rl-chart-content"></g></svg>' +
      '<div class="rl-legend" id="rl-legend" aria-label="Curve legend"></div>' +
      '<div class="rl-probe"><div class="rl-probe-top"><label for="rl-probe">Inspect voltage on the curve</label><output id="rl-probe-value" for="rl-probe"></output></div><input id="rl-probe" type="range" min="0" max="1.15" step="0.001" value="0.9"></div>' +
      '<dl class="rl-metrics" aria-live="polite" aria-atomic="true">' +
        '<div><dt>Fill factor</dt><dd id="rl-ff"></dd><span class="rl-metric-note" id="rl-ff-note"></span></div>' +
        '<div><dt>Maximum power density</dt><dd id="rl-pmax"></dd><span class="rl-metric-note" id="rl-mpp-note"></span></div>' +
        '<div><dt>Power loss vs. ideal</dt><dd id="rl-loss"></dd><span class="rl-metric-note">Same reference cell</span></div>' +
        '<div><dt>Open-circuit voltage</dt><dd id="rl-voc-result"></dd><span class="rl-metric-note">Vₒ꜀</span></div>' +
        '<div><dt>Short-circuit current density</dt><dd id="rl-jsc"></dd><span class="rl-metric-note">Jₛ꜀</span></div>' +
        '<div><dt>Model efficiency</dt><dd id="rl-efficiency"></dd><span class="rl-metric-note" id="rl-pin-note"></span></div>' +
      '</dl><p class="rl-insight" id="rl-insight"></p>' +
      '<div class="rl-table-wrap"><table class="rl-table"><caption>Same cell, four resistance conditions</caption><thead><tr><th scope="col">Model</th><th scope="col">Vₒ꜀ (V)</th><th scope="col">Jₛ꜀ (mA/cm²)</th><th scope="col">FF (%)</th><th scope="col">Pₘₐₓ (mW/cm²)</th></tr></thead><tbody id="rl-table-body"></tbody></table></div>' +
    '</div></div><div class="rl-footer"><p>Vₒ꜀,₀ and Jₛ꜀,₀ set the ideal reference; the results show the cell with the selected resistances (Ω·cm²). Curves show the power-generating region. The solid dot marks the selected model’s maximum power point.</p><button type="button" class="rl-action" id="rl-export">Export curve data ↓</button></div></div>' +
    '<details class="rl-method"><summary>Model, units &amp; sources</summary>' +
      '<p>The cell is represented by a photocurrent source, a diode, a parallel leakage resistance and a series resistance. The same Jₗ, J₀, n and T are used for all four curves.</p>' +
      '<svg class="rl-schematic" viewBox="0 0 430 160" role="img" aria-label="Equivalent circuit: photocurrent source, diode and shunt resistor in parallel, connected to a series resistor and output terminals"><g fill="none" stroke="currentColor" stroke-width="1.7"><path d="M35 50H290m50 0h65M35 130H405M35 50v24m0 32v24M140 50v27m0 25v28M230 50v20m0 40v20"/><circle cx="35" cy="90" r="16"/><path d="M35 102V78m-5 7 5-7 5 7M127 78h26l-13 23zm0 24h26"/><rect x="222" y="70" width="16" height="40"/><rect x="290" y="42" width="50" height="16"/><circle cx="408" cy="50" r="3"/><circle cx="408" cy="130" r="3"/></g><g fill="currentColor" font-family="Arial,sans-serif" font-size="13"><text x="19" y="153">Jₗ</text><text x="123" y="153">Diode</text><text x="217" y="153">Rₛₕ</text><text x="307" y="31">Rₛ</text><text x="390" y="95">V</text><text x="388" y="38">+</text><text x="390" y="151">−</text></g></svg>' +
      '<p class="rl-equation">J = Jₗ − J₀ [exp((V + J Rₛ) / (n kT/q)) − 1] − (V + J Rₛ) / Rₛₕ</p>' +
      '<p>The reference short-circuit density Jₛ꜀,₀ equals the photocurrent density Jₗ. It is independently adjustable together with reference Vₒ꜀,₀; the calculated Vₒ꜀ and Jₛ꜀ include resistance losses. Internally J is in A/cm² and Rₛ, Rₛₕ are in Ω·cm², so J × R is in volts. For cell area A in cm²: R (Ω) = R (Ω·cm²) / A and I (mA) = J (mA/cm²) × A. The ideal reference means Rₛ = 0 and Rₛₕ = ∞; diode recombination remains present.</p>' +
      '<p>J₀ = Jₗ / [exp(Vₒ꜀,₀ / (n kT/q)) − 1]. FF = Pₘₐₓ / (Vₒ꜀ Jₛ꜀). Power loss = 100 × (1 − Pₘₐₓ/Pₘₐₓ,₀). Efficiency = 100 × Pₘₐₓ/Pᵢₙ. Power loss is evaluated from the solved curve, not an approximate fill-factor formula.</p>' +
      '<p>Single-cell, uniform-illumination model with constant resistances. It does not include hysteresis, ion migration, breakdown, a second diode, or parameter fitting to measured data. Example presets are not fitted experimental devices. CSV includes all four signed J–V and P–V curves, including points beyond each model’s open-circuit voltage, plus parameters and maximum-power coordinates.</p>' +
      '<p>Background reading and governing equation:</p><div class="rl-source-links">' +
      '<a href="https://www.pveducation.org/pvcdrom/solar-cell-operation/series-resistance" target="_blank" rel="noopener noreferrer">PVEducation · Series resistance ↗</a>' +
      '<a href="https://www.pveducation.org/pvcdrom/solar-cell-operation/shunt-resistance" target="_blank" rel="noopener noreferrer">PVEducation · Shunt resistance ↗</a>' +
      '<a href="https://www.pveducation.org/pvcdrom/solar-cell-operation/impact-of-both-series-and-shunt-resistance" target="_blank" rel="noopener noreferrer">PVEducation · Both resistances ↗</a>' +
      '<a href="https://pvpmc.sandia.gov/modeling-guide/2-dc-module-iv/single-diode-equivalent-circuit-models/" target="_blank" rel="noopener noreferrer">Sandia PVPMC · Single-diode model ↗</a></div></details>';
  const insight = "Increasing series resistance or decreasing shunt resistance reduces power. Adjust either resistance to explore its contribution to the combined loss.";
  function setControls(p) {
    parameters = {...p};
    $$("[data-param]").forEach(input => {input.value = p[input.dataset.param]; input.removeAttribute("aria-invalid");});
    $("#rl-infinite").checked = p.rsh === Infinity;
    syncSliders(); update();
  }
  function syncSliders() {
    $$("[data-reference-slider]").forEach(slider => {
      const key = slider.dataset.referenceSlider; slider.value = parameters[key];
      slider.setAttribute("aria-valuetext", parameters[key] + (key === "voc" ? " volts" : " milliamps per square centimeter"));
    });
    $("#rl-rs-slider").value = parameters.rs;
    const rsh = parameters.rsh === Infinity ? 1e6 : parameters.rsh;
    $("#rl-rsh-slider").value = Math.log10(rsh);
    $("#rl-rs-slider").setAttribute("aria-valuetext", parameters.rs + " ohm square centimeters");
    $("#rl-rsh-slider").setAttribute("aria-valuetext", Math.round(rsh) + " ohm square centimeters");
  }
  function readInputs() {
    const next = {...parameters}, errors = [];
    $$("[data-param]").forEach(input => {
      const key = input.dataset.param;
      const ignored = key === "rsh" && $("#rl-infinite").checked;
      if (ignored) {input.removeAttribute("aria-invalid"); return;}
      const bounds = SolarResistance.limits[key], value = input.valueAsNumber;
      const bad = !Number.isFinite(value) || value < bounds[0] || value > bounds[1];
      input.setAttribute("aria-invalid", String(bad));
      if (bad) {
        const label = key === "rs" ? "Series resistance" : key === "rsh" ? "Shunt resistance" : input.closest(".rl-field").querySelector("label").textContent;
        errors.push(label + ": enter " + bounds[0] + "–" + bounds[1] + ".");
      } else next[key] = value;
    });
    valid = errors.length === 0;
    $("#rl-error").hidden = valid;
    $("#rl-error").textContent = errors.join(" ") + (valid ? "" : " Results show the last valid inputs.");
    $("#rl-export").disabled = !valid;
    if (valid) {parameters = next; syncSliders();}
    return valid;
  }
  function update() {
    $("#rl-rsh").disabled = $("#rl-infinite").checked;
    $("#rl-rsh-slider").disabled = $("#rl-infinite").checked;
    if (!readInputs()) return;
    const p = {...parameters, rsh: $("#rl-infinite").checked ? Infinity : parameters.rsh};
    results = SolarResistance.compare(p);
    const active = results[mode], ideal = results.ideal;
    $("#rl-context").textContent = names[mode] + " · " + fmt(p.temperature, 2) + " K · n = " + fmt(p.n);
    $("#rl-ff").innerHTML = fmt(active.ff * 100) + '<small> %</small>';
    $("#rl-ff-note").textContent = "Ideal: " + fmt(ideal.ff * 100) + "%";
    $("#rl-pmax").innerHTML = fmt(active.pmax * 1000) + '<small> mW/cm²</small>';
    $("#rl-mpp-note").textContent = "at " + fmt(active.vmp, 3) + " V · " + fmt(active.jmp * 1000) + " mA/cm²";
    $("#rl-loss").innerHTML = fmt(Math.max(0, 100 * (1 - active.pmax / ideal.pmax))) + '<small> %</small>';
    $("#rl-voc-result").innerHTML = fmt(active.voc, 3) + '<small> V</small>';
    $("#rl-jsc").innerHTML = fmt(active.jsc * 1000) + '<small> mA/cm²</small>';
    $("#rl-efficiency").innerHTML = fmt(active.efficiency) + '<small> %</small>';
    $("#rl-pin-note").textContent = "Pᵢₙ = " + fmt(p.pin, 1) + " mW/cm²";
    $("#rl-insight").textContent = insight + (active.efficiency > 100 ? " The entered photocurrent and incident power produce efficiency above 100%; choose a physically consistent reference cell and illumination." : "");
    $("#rl-table-body").innerHTML = shown.map(key => {
      const r = results[key];
      return '<tr data-active="' + (key === mode) + '"><th scope="row">' + names[key] + '</th><td>' + fmt(r.voc, 3) + '</td><td>' + fmt(r.jsc * 1000) + '</td><td>' + fmt(r.ff * 100) + '</td><td>' + fmt(r.pmax * 1000) + '</td></tr>';
    }).join("");
    $("#rl-probe").max = active.voc;
    $("#rl-probe").value = active.vmp;
    drawChart();
  }
  function drawChart() {
    if (!results) return;
    const isPower = plot === "pv", ymax = (isPower ? results.ideal.pmax * 1000 : parameters.jph) * 1.12;
    const x = v => 65 + v / parameters.voc * 555;
    const y = value => 300 - value / ymax * 260;
    let svg = "";
    for (let i = 0; i <= 5; i++) {
      const v = parameters.voc * i / 5, val = ymax * i / 5;
      svg += '<line class="rl-gridline" x1="' + x(v) + '" y1="40" x2="' + x(v) + '" y2="300"/><text x="' + x(v) + '" y="322" text-anchor="middle">' + fmt(v, 2) + '</text>';
      svg += '<line class="rl-gridline" x1="65" y1="' + y(val) + '" x2="620" y2="' + y(val) + '"/><text x="55" y="' + (y(val) + 4) + '" text-anchor="end">' + fmt(val, 1) + '</text>';
    }
    svg += '<path class="rl-axis" fill="none" d="M65 40V300H620"/><text x="343" y="350" text-anchor="middle">Voltage (V)</text><text x="65" y="20">' + (isPower ? "Power density (mW/cm²)" : "Current density (mA/cm²)") + '</text>';
    for (const key of shown) {
      const r = results[key];
      const path = r.points.map((point, i) => (i ? "L" : "M") + fmt(x(point.v), 3) + " " + fmt(y((isPower ? point.power : point.j) * 1000), 3)).join(" ");
      svg += '<path class="rl-curve rl-' + key + '" d="' + path + '"/>';
    }
    const r = results[mode], mppY = y((isPower ? r.pmax : r.jmp) * 1000);
    svg += '<circle cx="' + x(r.vmp) + '" cy="' + mppY + '" r="5.5" fill="var(--ink)" stroke="var(--surface)" stroke-width="2"><title>Maximum power: ' + fmt(r.pmax * 1000) + ' mW/cm² at ' + fmt(r.vmp, 3) + ' V</title></circle>';
    svg += '<line id="rl-probe-line" class="rl-axis" stroke-dasharray="2 4" y1="40" y2="300"/><circle id="rl-probe-dot" r="4" fill="var(--surface)" stroke="var(--teal)" stroke-width="2"/>';
    $("#rl-chart-content").innerHTML = svg;
    $("#rl-legend").innerHTML = shown.map(key => '<span><svg aria-hidden="true"><line class="rl-curve rl-' + key + '" x1="0" y1="5" x2="23" y2="5"/></svg>' + names[key] + '</span>').join("");
    $("#rl-chart-title").textContent = isPower ? "Power density–voltage" : "Current density–voltage";
    $("#rl-svg-title").textContent = $("#rl-chart-title").textContent;
    $$("[data-plot]").forEach(button => button.setAttribute("aria-pressed", String(button.dataset.plot === plot)));
    updateProbe(x, y);
  }
  function updateProbe(x, y) {
    if (!results) return;
    const r = results[mode], v = Math.min(r.voc, Number($("#rl-probe").value));
    const j = Math.max(0, r.currentAt(v)), p = v * j;
    $("#rl-probe-value").textContent = fmt(v, 3) + " V · " + fmt(j * 1000) + " mA/cm² · " + fmt(p * 1000) + " mW/cm²";
    $("#rl-probe").setAttribute("aria-valuetext", $("#rl-probe-value").textContent);
    const ymax = (plot === "pv" ? results.ideal.pmax * 1000 : parameters.jph) * 1.12;
    const px = x ? x(v) : 65 + v / parameters.voc * 555;
    const py = y ? y((plot === "pv" ? p : j) * 1000) : 300 - (plot === "pv" ? p : j) * 1000 / ymax * 260;
    $("#rl-probe-line").setAttribute("x1", px); $("#rl-probe-line").setAttribute("x2", px);
    $("#rl-probe-dot").setAttribute("cx", px); $("#rl-probe-dot").setAttribute("cy", py);
  }
  $$("[data-plot]").forEach(button => button.addEventListener("click", () => {plot = button.dataset.plot; drawChart();}));
  $(".rl-controls").addEventListener("submit", event => event.preventDefault());
  $$("[data-param]").forEach(input => input.addEventListener("input", () => {$("#rl-preset").value = "custom"; update();}));
  $$("[data-reference-slider]").forEach(slider => slider.addEventListener("input", () => {
    $("#rl-" + slider.dataset.referenceSlider).value = slider.value; $("#rl-preset").value = "custom"; update();
  }));
  $("#rl-rs-slider").addEventListener("input", event => {$("#rl-rs").value = event.target.value; $("#rl-preset").value = "custom"; update();});
  $("#rl-rsh-slider").addEventListener("input", event => {$("#rl-rsh").value = Math.round(10 ** Number(event.target.value)); $("#rl-preset").value = "custom"; update();});
  $("#rl-infinite").addEventListener("change", () => {$("#rl-preset").value = "custom"; update();});
  $("#rl-probe").addEventListener("input", () => updateProbe());
  $("#rl-preset").addEventListener("change", event => {setControls(event.target.value === "silicon" ? silicon : defaults);});
  $("#rl-reset").addEventListener("click", () => {$("#rl-preset").value = "perovskite"; setControls(defaults);});
  $("#rl-export").addEventListener("click", () => {
    if (!valid || !results) return;
    const p = results.both.parameters;
    const rows = [
      ["Solar cell resistance lab", "Steady-state single-diode model"],
      ["selected_model", mode], ["reference_Voc_V", p.voc], ["photocurrent_mA_cm2", p.jph],
      ["n", p.n], ["temperature_K", p.temperature], ["series_ohm_cm2", p.rs], ["shunt_ohm_cm2", p.rsh === Infinity ? "Infinity" : p.rsh],
      ["incident_power_mW_cm2", p.pin], ["J0_A_cm2", results.ideal.j0],
      ["note", "Signed currents and powers; sweep extends to ideal reference Voc."], [],
      ["model", "Voc_V", "Jsc_mA_cm2", "Vmp_V", "Jmp_mA_cm2", "Pmax_mW_cm2", "FF_percent", "efficiency_percent"]
    ];
    for (const key of Object.keys(names)) {
      const r = results[key]; rows.push([key, r.voc, r.jsc * 1000, r.vmp, r.jmp * 1000, r.pmax * 1000, r.ff * 100, r.efficiency]);
    }
    rows.push([], ["Voltage_V", "ideal_J_mA_cm2", "series_J_mA_cm2", "shunt_J_mA_cm2", "both_J_mA_cm2", "ideal_P_mW_cm2", "series_P_mW_cm2", "shunt_P_mW_cm2", "both_P_mW_cm2"]);
    const voltages = [...new Set([...Array.from({length: 401}, (_, i) => p.voc * i / 400), ...Object.values(results).flatMap(r => [r.voc, r.vmp])])].sort((a, b) => a - b);
    for (const v of voltages) {
      const currents = Object.keys(names).map(key => results[key].currentAt(v) * 1000);
      rows.push([v, ...currents, ...currents.map(j => v * j)]);
    }
    window.CSVExport.save("solar-cell-resistance-" + mode + ".csv", rows);
  });
  setControls(defaults);
})();
