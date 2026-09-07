(function () {
  "use strict";
  const root = document.getElementById("resistance-calculator");
  if (!root || !window.SolarResistance) return;
  const defaults = {voc: 1.2, jph: 25, n: 1.5, temperature: 300, rs: 2, rsh: 2000, pin: 100};
  const highFF = {voc: 1.2, jph: 25, n: 1, temperature: 300, rs: 0.1, rsh: 100000, pin: 100};
  const silicon = {voc: 0.65, jph: 35, n: 1, temperature: 300, rs: 2, rsh: 2000, pin: 100};
  const mode = "both", shown = ["ideal", "series", "shunt", "both"];
  let parameters = {...defaults}, area = 1, quantity = "density", plot = "jv", results, targetResult, valid = true;
  const names = {ideal: "Ideal reference", series: "Series only", shunt: "Shunt only", both: "Both resistances"};
  const $ = selector => root.querySelector(selector);
  const $$ = selector => [...root.querySelectorAll(selector)];
  const fmt = (v, digits = 2) => Number(v).toFixed(digits);
  const deviceFmt = v => v === Infinity ? "∞" : v !== 0 && (Math.abs(v) < 0.01 || Math.abs(v) >= 1e5) ? v.toExponential(2) : fmt(v);
  const areaText = () => String(Number(area.toPrecision(8)));
  const displayScale = () => quantity === "total" ? area : 1;
  const currentUnit = () => quantity === "total" ? "mA" : "mA/cm²";
  const powerUnit = () => quantity === "total" ? "mW" : "mW/cm²";
  const displayValue = v => quantity === "total" ? deviceFmt(v) : fmt(v);
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
      '<div class="rl-field rl-preset"><label for="rl-preset">Example parameters</label><select id="rl-preset"><option value="perovskite">Perovskite-like · n = 1.50</option><option value="highff">High-FF example · n = 1.00</option><option value="silicon">Silicon-like · illustrative</option><option value="custom" disabled>Custom parameters</option></select></div>' +
      referenceField("voc", "Reference open-circuit voltage Vₒ꜀,₀", "V", "0.001") +
      referenceField("jph", "Reference short-circuit density Jₛ꜀,₀", "mA/cm²", "0.1") +
      '<div class="rl-field rl-area-field"><label for="rl-area">Active area A</label><div class="rl-input-row"><input type="number" id="rl-area" min="0.000001" max="10000" step="any" value="1" aria-describedby="rl-error rl-area-note"><span class="rl-unit">cm²</span></div><p class="rl-small rl-control-hint" id="rl-area-note">Use the illuminated active area, excluding inactive borders. 1 cm² = 100 mm².</p></div>' +
      numberField("n", "Model ideality factor n", "—", "0.01") +
      numberField("temperature", "Cell temperature T", "K", "0.01") +
      '<p class="rl-small rl-n-note">n is constant along each model curve. A measured light-intensity ideality factor may differ.</p>' +
      '<fieldset class="rl-field" id="rl-series-controls"><legend>Series resistance Rₛ</legend><div class="rl-input-row"><label class="sr-only" for="rl-rs">Series resistance (Ω·cm²)</label><input id="rl-rs" type="number" data-param="rs" min="0" max="50" step="0.01" value="2" aria-describedby="rl-error"><span class="rl-unit">Ω·cm²</span></div><label class="sr-only" for="rl-rs-slider">Adjust series resistance</label><input type="range" id="rl-rs-slider" min="0" max="50" step="0.01" value="2"><div class="rl-range-labels"><span>0 · ideal</span><span>50</span></div><p class="rl-small rl-control-hint">Use the number field for small Rₛ values (0.01 steps).</p></fieldset>' +
      '<fieldset class="rl-field" id="rl-shunt-controls"><legend>Shunt resistance Rₛₕ</legend><div class="rl-input-row"><label class="sr-only" for="rl-rsh">Shunt resistance (Ω·cm²)</label><input id="rl-rsh" type="number" data-param="rsh" min="10" max="1000000" step="any" value="2000" aria-describedby="rl-error"><span class="rl-unit">Ω·cm²</span></div><label class="sr-only" for="rl-rsh-slider">Adjust shunt resistance (logarithmic scale)</label><input type="range" id="rl-rsh-slider" min="1" max="6" step="0.01" value="3.30103"><div class="rl-range-labels"><span>10</span><span>10⁶ · log scale</span></div><label class="rl-check"><input id="rl-infinite" type="checkbox">Infinite Rₛₕ (no leakage)</label></fieldset>' +
      '<details class="rl-advanced"><summary>Estimate n from a Vₒ꜀–light slope</summary><p class="rl-small">Enter a fitted slope from stabilized Vₒ꜀ versus light intensity at the cell temperature above.</p>' +
      '<div class="rl-field"><label for="rl-log-base">Light-intensity axis</label><select id="rl-log-base"><option value="log10">log₁₀(intensity) · per decade</option><option value="ln">ln(intensity) · natural log</option></select></div>' +
      '<div class="rl-field"><label for="rl-slope">Vₒ꜀ slope</label><div class="rl-input-row"><input id="rl-slope" type="number" min="0" step="any" value="89.3" aria-describedby="rl-n-estimate"><span class="rl-unit" id="rl-slope-unit">mV/decade</span></div></div>' +
      '<p class="rl-small" id="rl-n-estimate" role="status"></p><button class="rl-action" type="button" id="rl-use-n">Use estimate as model n</button><p class="rl-small rl-control-hint">Applying this value is a modeling assumption. Use a consistent preconditioning and settling protocol; report the fitted light range. Local slopes can vary with intensity. n alone does not identify a recombination mechanism.</p></details>' +
      '<details class="rl-advanced"><summary>Illumination &amp; reference settings</summary><p class="rl-small">The visible voltage and short-circuit density define the reference cell (Rₛ = 0, Rₛₕ = ∞). Jₗ = Jₛ꜀,₀; J₀ is recalculated at the selected n and T.</p>' +
      numberField("pin", "Incident power density Pᵢₙ", "mW/cm²", "0.1") +
      '<p class="rl-small">Pᵢₙ sets the efficiency denominator only. Set Jₗ separately for the chosen illumination. Changing T keeps the entered reference voltage fixed; it does not forecast thermal degradation.</p></details>' +
      '<p id="rl-error" class="rl-error" role="status" hidden></p><div class="rl-actions"><button class="rl-action" id="rl-reset" type="button">Reset example</button></div>' +
    '</form><div class="rl-output">' +
      '<section class="rl-target" aria-labelledby="rl-target-title"><div class="rl-target-heading"><h3 id="rl-target-title">How close is the target FF?</h3><div class="rl-field"><label for="rl-target-ff">Target FF (%)</label><input type="number" id="rl-target-ff" min="50" max="99.99" step="0.01" value="89" aria-describedby="rl-target-status"></div></div>' +
      '<dl class="rl-target-metrics"><div><dt>Ideal FF₀ ceiling</dt><dd id="rl-ff0"></dd></div><div><dt>FF loss from resistances</dt><dd id="rl-ff-gap"></dd></div><div><dt>Ideal FF₀ − target</dt><dd id="rl-target-margin"></dd></div></dl>' +
      '<p id="rl-target-status" class="rl-target-status" role="status"></p><p id="rl-n-bound" class="rl-small"></p>' +
      '<details id="rl-target-details"><summary>Resistance requirements for this target</summary><dl class="rl-target-bounds"><div><dt id="rl-rs-bound-label"></dt><dd id="rl-rs-bound"></dd></div><div><dt id="rl-rsh-bound-label"></dt><dd id="rl-rsh-bound"></dd></div></dl><p class="rl-small">Each bound varies one resistance while holding the other at its current value, with the same reference Vₒ꜀, Jₛ꜀, n and T. They are separate conditions, not a fitted pair. FF alone cannot determine both resistances.</p></details>' +
      '<p class="rl-small rl-target-note">FF₀ is the resistance-free limit of this constant-n model, not a universal perovskite limit or a measured pseudo-FF. Losses and margins are in percentage points (pp).</p></section>' +
      '<section class="rl-device" aria-labelledby="rl-device-title"><h3 id="rl-device-title">Device at 1 cm²</h3><dl class="rl-device-metrics"><div><dt>Short-circuit current Iₛ꜀</dt><dd id="rl-device-isc"></dd></div><div><dt>Maximum power Pₘₐₓ</dt><dd id="rl-device-pmax"></dd></div><div><dt>Device Rₛ</dt><dd id="rl-device-rs"></dd></div><div><dt>Device Rₛₕ</dt><dd id="rl-device-rsh"></dd></div></dl><p class="rl-small" id="rl-device-input"></p><p class="rl-small rl-area-assumption">At fixed current density and resistances in Ω·cm², area scales total current and power; FF and efficiency stay the same. This uniform single-cell model does not predict extra losses caused by scaling up a device.</p></section>' +
      '<div class="rl-quantity-switch" role="group" aria-label="Result units"><button type="button" data-quantity="density" aria-pressed="true">Per cm²</button><button type="button" data-quantity="total" aria-pressed="false">Whole device</button></div>' +
      '<div class="rl-chart-heading"><div><h3 id="rl-chart-title">Current density–voltage</h3><p class="rl-small" id="rl-context"></p></div><div class="rl-plot-switch" role="group" aria-label="Chart type"><button type="button" data-plot="jv" aria-pressed="true">J–V</button><button type="button" data-plot="pv" aria-pressed="false">P–V</button></div></div>' +
      '<svg class="rl-chart" id="rl-chart" viewBox="0 0 640 360" role="img" aria-labelledby="rl-svg-title rl-svg-desc"><title id="rl-svg-title">Solar-cell current density versus voltage</title><desc id="rl-svg-desc">Calculated curves in the power-generating quadrant. Exact values are listed in the comparison table below.</desc><g id="rl-chart-content"></g></svg>' +
      '<div class="rl-legend" id="rl-legend" aria-label="Curve legend"></div>' +
      '<div class="rl-probe"><div class="rl-probe-top"><label for="rl-probe">Inspect voltage on the curve</label><output id="rl-probe-value" for="rl-probe"></output></div><input id="rl-probe" type="range" min="0" max="1.15" step="0.001" value="0.9"></div>' +
      '<dl class="rl-metrics" aria-live="polite" aria-atomic="true">' +
        '<div><dt>Fill factor</dt><dd id="rl-ff"></dd><span class="rl-metric-note" id="rl-ff-note"></span></div>' +
        '<div><dt id="rl-pmax-label">Maximum power density</dt><dd id="rl-pmax"></dd><span class="rl-metric-note" id="rl-mpp-note"></span></div>' +
        '<div><dt>Power loss vs. ideal</dt><dd id="rl-loss"></dd><span class="rl-metric-note">Same reference cell</span></div>' +
        '<div><dt>Open-circuit voltage</dt><dd id="rl-voc-result"></dd><span class="rl-metric-note">Vₒ꜀</span></div>' +
        '<div><dt id="rl-current-label">Short-circuit current density</dt><dd id="rl-jsc"></dd><span class="rl-metric-note" id="rl-current-note">Jₛ꜀</span></div>' +
        '<div><dt>Model efficiency</dt><dd id="rl-efficiency"></dd><span class="rl-metric-note" id="rl-pin-note"></span></div>' +
      '</dl><p class="rl-insight" id="rl-insight"></p>' +
      '<div class="rl-table-wrap"><table class="rl-table"><caption>Same cell, four resistance conditions</caption><thead><tr><th scope="col">Model</th><th scope="col">Vₒ꜀ (V)</th><th scope="col" id="rl-table-current">Jₛ꜀ (mA/cm²)</th><th scope="col">FF (%)</th><th scope="col" id="rl-table-power">Pₘₐₓ (mW/cm²)</th></tr></thead><tbody id="rl-table-body"></tbody></table></div>' +
    '</div></div><div class="rl-footer"><p>Vₒ꜀,₀ and Jₛ꜀,₀ set the ideal reference; the results show the cell with the selected resistances (Ω·cm²). Curves show the power-generating region. The solid dot marks the selected model’s maximum power point.</p><button type="button" class="rl-action" id="rl-export">Export curve data ↓</button></div></div>' +
    '<details class="rl-method"><summary>Model, units &amp; sources</summary>' +
      '<p>The cell is represented by a photocurrent source, a diode, a parallel leakage resistance and a series resistance. The same Jₗ, J₀, n and T are used for all four curves.</p>' +
      '<svg class="rl-schematic" viewBox="0 0 430 160" role="img" aria-label="Equivalent circuit: photocurrent source, diode and shunt resistor in parallel, connected to a series resistor and output terminals"><g fill="none" stroke="currentColor" stroke-width="1.7"><path d="M35 50H290m50 0h65M35 130H405M35 50v24m0 32v24M140 50v27m0 25v28M230 50v20m0 40v20"/><circle cx="35" cy="90" r="16"/><path d="M35 102V78m-5 7 5-7 5 7M127 78h26l-13 23zm0 24h26"/><rect x="222" y="70" width="16" height="40"/><rect x="290" y="42" width="50" height="16"/><circle cx="408" cy="50" r="3"/><circle cx="408" cy="130" r="3"/></g><g fill="currentColor" font-family="Arial,sans-serif" font-size="13"><text x="19" y="153">Jₗ</text><text x="123" y="153">Diode</text><text x="217" y="153">Rₛₕ</text><text x="307" y="31">Rₛ</text><text x="390" y="95">V</text><text x="388" y="38">+</text><text x="390" y="151">−</text></g></svg>' +
      '<p class="rl-equation">J = Jₗ − J₀ [exp((V + J Rₛ) / (n kT/q)) − 1] − (V + J Rₛ) / Rₛₕ</p>' +
      '<p>The reference short-circuit density Jₛ꜀,₀ equals the photocurrent density Jₗ. It is independently adjustable together with reference Vₒ꜀,₀; the calculated Vₒ꜀ and Jₛ꜀ include resistance losses. Internally J is in A/cm² and Rₛ, Rₛₕ are in Ω·cm², so J × R is in volts. For cell area A in cm²: R (Ω) = R (Ω·cm²) / A and I (mA) = J (mA/cm²) × A. The ideal reference means Rₛ = 0 and Rₛₕ = ∞; diode recombination remains present.</p>' +
      '<p>Active area A is entered in cm² (0.000001–10000); 1 cm² = 100 mm². Total device power equals power density × A, and total incident power equals incident power density × A. Both resistance inputs remain area-normalized in Ω·cm²; their device values and target bounds in Ω are divided by A. Keep the same illuminated area for current density and incident power. The model describes one uniformly illuminated cell, not a series-connected module or a geometry-dependent loss model.</p>' +
      '<p>J₀ = Jₗ / [exp(Vₒ꜀,₀ / (n kT/q)) − 1]. FF = Pₘₐₓ / (Vₒ꜀ Jₛ꜀) for densities, or Pₘₐₓ / (Vₒ꜀ Iₛ꜀) for device totals. Power loss = 100 × (1 − Pₘₐₓ/Pₘₐₓ,₀). Efficiency = 100 × output power / incident power, using densities or totals consistently. Power loss is evaluated from the solved curve, not an approximate fill-factor formula.</p>' +
      '<p>FF₀ is solved numerically with Rₛ = 0 and Rₛₕ = ∞ at the selected Vₒ꜀,₀, n and T. The target check uses this same model. Resistance bounds use FF = Pₘₐₓ/(Vₒ꜀ Jₛ꜀) with the recalculated terminal Vₒ꜀ and Jₛ꜀, and search Rₛ = 0–50 or Rₛₕ = 10–10⁶ Ω·cm² plus the no-leakage limit. They are approximate conditional thresholds, not extraction from measured data. The displayed n ceiling assumes zero resistance losses and searches n = 1–2.</p>' +
      '<p>For S = dVₒ꜀/dln(Φ), n = S/(kT/q); for S = dVₒ꜀/dlog₁₀(Φ), n = S/[ln(10) kT/q]. Slopes entered in mV are converted to V. At 300 K, the denominators are 25.852 mV per unit ln(Φ) and 59.526 mV per decade. A light-intensity fit is an effective ideality factor over its measured range; it need not equal the constant n that describes an operating J–V curve. Values near 1 do not by themselves establish radiative recombination. This tool does not infer recombination fractions.</p>' +
      '<p>A measured Suns–Vₒ꜀ curve can support a pseudo-J–V analysis when photocurrent scales with intensity and collection is sufficiently voltage independent. Its difference from measured FF can help assess transport-related losses, subject to those assumptions and consistent stabilization. The resistance-free curve here is a simulation, not a Suns–Vₒ꜀ measurement.</p>' +
      '<p>Single-cell, uniform-illumination model with constant resistances. It does not include hysteresis, ion migration, breakdown, a second diode, or parameter fitting to measured data. Example presets are not fitted experimental devices. CSV includes all four signed J–V and P–V curves, including points beyond each model’s open-circuit voltage, plus parameters and maximum-power coordinates.</p>' +
      '<p>Background reading and governing equation:</p><div class="rl-source-links">' +
      '<a href="https://www.pveducation.org/pvcdrom/solar-cell-operation/fill-factor" target="_blank" rel="noopener noreferrer">PVEducation · Fill factor ↗</a>' +
      '<a href="https://doi.org/10.1002/aenm.202000502" target="_blank" rel="noopener noreferrer">Caprioglio et al. · Ideality factor in perovskites ↗</a>' +
      '<a href="https://arxiv.org/abs/1804.09049" target="_blank" rel="noopener noreferrer">Calado et al. · Transient ideality factor ↗</a>' +
      '<a href="https://www.pveducation.org/pvcdrom/solar-cell-operation/series-resistance" target="_blank" rel="noopener noreferrer">PVEducation · Series resistance ↗</a>' +
      '<a href="https://www.pveducation.org/pvcdrom/solar-cell-operation/shunt-resistance" target="_blank" rel="noopener noreferrer">PVEducation · Shunt resistance ↗</a>' +
      '<a href="https://www.pveducation.org/pvcdrom/solar-cell-operation/impact-of-both-series-and-shunt-resistance" target="_blank" rel="noopener noreferrer">PVEducation · Both resistances ↗</a>' +
      '<a href="https://pvpmc.sandia.gov/modeling-guide/2-dc-module-iv/single-diode-equivalent-circuit-models/" target="_blank" rel="noopener noreferrer">Sandia PVPMC · Single-diode model ↗</a></div></details>';
  const insight = "Increasing series resistance or decreasing shunt resistance reduces power. Adjust either resistance to explore its contribution to the combined loss.";
  function setControls(p) {
    parameters = {...p, rsh: p.rsh === Infinity ? 1e6 : p.rsh};
    $$("[data-param]").forEach(input => {input.value = parameters[input.dataset.param]; input.removeAttribute("aria-invalid");});
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
    const nextArea = $("#rl-area").valueAsNumber;
    const badArea = !Number.isFinite(nextArea) || nextArea < SolarResistance.areaLimits[0] || nextArea > SolarResistance.areaLimits[1];
    $("#rl-area").setAttribute("aria-invalid", String(badArea));
    if (badArea) errors.push("Active area: enter 0.000001–10000 cm².");
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
    if (valid) {parameters = next; area = nextArea; syncSliders();}
    return valid;
  }
  function updateEstimate() {
    const base = $("#rl-log-base").value;
    $("#rl-slope-unit").textContent = base === "log10" ? "mV/decade" : "mV / unit ln(Φ)";
    $("#rl-use-n").disabled = true;
    try {
      const n = SolarResistance.idealityFromSlope($("#rl-slope").valueAsNumber, $("#rl-temperature").valueAsNumber, base);
      const inRange = n >= 1 && n <= 2;
      $("#rl-slope").removeAttribute("aria-invalid");
      $("#rl-n-estimate").textContent = "Effective n ≈ " + fmt(n, 3) + " at " + fmt($("#rl-temperature").valueAsNumber, 2) + " K." + (inRange ? "" : " Outside this calculator’s model range (1–2); the estimate is not clipped.");
      $("#rl-use-n").disabled = !inRange;
      return inRange ? n : null;
    } catch {
      $("#rl-slope").setAttribute("aria-invalid", String(!Number.isFinite($("#rl-slope").valueAsNumber) || $("#rl-slope").valueAsNumber <= 0));
      $("#rl-n-estimate").textContent = "Enter a positive slope and a cell temperature of 200–400 K.";
      return null;
    }
  }
  function updateTarget() {
    targetResult = null;
    $("#rl-target-details").hidden = true;
    $("#rl-target-margin").textContent = "—";
    $("#rl-n-bound").textContent = "";
    if (!valid || !results) {
      $("#rl-target-status").textContent = "Correct the cell inputs to update the target check. Other results retain the last valid values.";
      $(".rl-target").dataset.state = "invalid";
      return;
    }
    const ideal = results.ideal, active = results.both;
    $("#rl-ff0").textContent = fmt(ideal.ff * 100) + "%";
    $("#rl-ff-gap").textContent = fmt((ideal.ff - active.ff) * 100) + " pp";
    const target = $("#rl-target-ff").valueAsNumber;
    const targetValid = Number.isFinite(target) && target >= 50 && target <= 99.99;
    $("#rl-target-ff").setAttribute("aria-invalid", String(!targetValid));
    if (!targetValid) {
      $("#rl-target-status").textContent = "Enter a target FF of 50–99.99%. The J–V calculation is unchanged.";
      $(".rl-target").dataset.state = "invalid";
      return;
    }
    targetResult = SolarResistance.targetFF(active.parameters, target);
    const margin = ideal.ff * 100 - target;
    $("#rl-target-margin").textContent = (margin >= 0 ? "+" : "−") + fmt(Math.abs(margin)) + " pp";
    const bound = targetResult.maxN;
    $("#rl-n-bound").textContent = bound.status === "below_range"
      ? "Even n = 1 cannot reach this target at the selected reference voltage and temperature."
      : bound.status === "at_least"
        ? "With zero resistance losses, all n values in the model range (1–2) can reach this target."
        : "For this target, the resistance-free model requires n ≲ " + fmt(bound.value, 3) + ". Resistance losses leave less room.";
    if (targetResult.status === "above_ideal") {
      $(".rl-target").dataset.state = "unreachable";
      $("#rl-target-status").textContent = "Not reachable with this constant n: the " + fmt(target) + "% target exceeds FF₀ = " + fmt(ideal.ff * 100) + "%, even at Rₛ = 0 and Rₛₕ = ∞. Changing resistances cannot close this gap.";
      return;
    }
    const met = active.ff * 100 >= target - 1e-10;
    $(".rl-target").dataset.state = met ? "met" : "within";
    $("#rl-target-status").textContent = met
      ? "Current settings meet the " + fmt(target) + "% target within this model (FF = " + fmt(active.ff * 100) + "%)."
      : "The " + fmt(target) + "% target is within the ideal ceiling. Current FF is " + fmt(active.ff * 100) + "%; explore the resistance requirements below.";
    $("#rl-target-details").hidden = false;
    const p = active.parameters, rs = targetResult.maxRs, rsh = targetResult.minRsh;
    const resistance = value => value === Infinity ? "∞" : Number(value.toPrecision(4)).toLocaleString("en-US", {maximumFractionDigits:4});
    $("#rl-rs-bound-label").textContent = "Maximum Rₛ · fixed Rₛₕ = " + resistance(p.rsh) + " Ω·cm²";
    $("#rl-rsh-bound-label").textContent = "Minimum Rₛₕ · fixed Rₛ = " + resistance(p.rs) + " Ω·cm²";
    $("#rl-rs-bound").textContent = rs.status === "blocked_by_shunt" ? "Not reachable even at Rₛ = 0; increase Rₛₕ."
      : (rs.status === "at_least" ? "≥ " : "≈ ") + resistance(rs.value) + " Ω·cm²" + (rs.status === "at_least" ? " (search limit)" : "");
    $("#rl-rsh-bound").textContent = rsh.status === "blocked_by_series" ? "Not reachable even at Rₛₕ = ∞; decrease Rₛ."
      : rsh.status === "infinite" ? "∞ · no leakage"
      : (rsh.status === "above_range" ? "> " : rsh.status === "at_most" ? "≤ " : "≈ ") + resistance(rsh.value) + " Ω·cm²" + (rsh.status === "above_range" ? " (outside search range)" : rsh.status === "at_most" ? " (search limit)" : "");
    if (Number.isFinite(rs.value)) $("#rl-rs-bound").textContent += " · " + (rs.status === "at_least" ? "≥ " : "≈ ") + deviceFmt(rs.value / area) + " Ω for this area";
    if (Number.isFinite(rsh.value)) $("#rl-rsh-bound").textContent += " · " + (rsh.status === "above_range" ? "> " : rsh.status === "at_most" ? "≤ " : "≈ ") + deviceFmt(rsh.value / area) + " Ω for this area";
  }
  function update() {
    $("#rl-rsh").disabled = $("#rl-infinite").checked;
    $("#rl-rsh-slider").disabled = $("#rl-infinite").checked;
    updateEstimate();
    if (!readInputs()) {updateTarget(); return;}
    const p = {...parameters, rsh: $("#rl-infinite").checked ? Infinity : parameters.rsh};
    results = SolarResistance.compare(p);
    const active = results[mode], ideal = results.ideal, device = SolarResistance.deviceValues(active, area), scale = displayScale();
    $("#rl-context").textContent = names[mode] + " · " + fmt(p.temperature, 2) + " K · n = " + fmt(p.n) + " · A = " + areaText() + " cm²";
    $("#rl-device-title").textContent = "Device at " + areaText() + " cm²";
    $("#rl-device-isc").textContent = deviceFmt(device.isc * 1000) + " mA";
    $("#rl-device-pmax").textContent = deviceFmt(device.pmax * 1000) + " mW";
    $("#rl-device-rs").textContent = deviceFmt(device.rs) + " Ω";
    $("#rl-device-rsh").textContent = deviceFmt(device.rsh) + " Ω";
    $("#rl-device-input").textContent = "Incident power: " + deviceFmt(device.incidentPower * 1000) + " mW · Current at maximum power: " + deviceFmt(device.imp * 1000) + " mA";
    $("#rl-pmax-label").textContent = quantity === "total" ? "Maximum device power" : "Maximum power density";
    $("#rl-current-label").textContent = quantity === "total" ? "Short-circuit current" : "Short-circuit current density";
    $("#rl-current-note").textContent = quantity === "total" ? "Iₛ꜀" : "Jₛ꜀";
    $("#rl-table-current").textContent = quantity === "total" ? "Iₛ꜀ (mA)" : "Jₛ꜀ (mA/cm²)";
    $("#rl-table-power").textContent = "Pₘₐₓ (" + powerUnit() + ")";
    $$("[data-quantity]").forEach(button => button.setAttribute("aria-pressed", String(button.dataset.quantity === quantity)));
    $("#rl-ff").innerHTML = fmt(active.ff * 100) + '<small> %</small>';
    $("#rl-ff-note").textContent = "Ideal: " + fmt(ideal.ff * 100) + "%";
    $("#rl-pmax").innerHTML = displayValue(active.pmax * 1000 * scale) + '<small> ' + powerUnit() + '</small>';
    $("#rl-mpp-note").textContent = "at " + fmt(active.vmp, 3) + " V · " + displayValue(active.jmp * 1000 * scale) + " " + currentUnit();
    $("#rl-loss").innerHTML = fmt(Math.max(0, 100 * (1 - active.pmax / ideal.pmax))) + '<small> %</small>';
    $("#rl-voc-result").innerHTML = fmt(active.voc, 3) + '<small> V</small>';
    $("#rl-jsc").innerHTML = displayValue(active.jsc * 1000 * scale) + '<small> ' + currentUnit() + '</small>';
    $("#rl-efficiency").innerHTML = fmt(active.efficiency) + '<small> %</small>';
    $("#rl-pin-note").textContent = "Pᵢₙ = " + displayValue(p.pin * scale) + " " + powerUnit();
    $("#rl-insight").textContent = insight + (active.efficiency > 100 ? " The entered photocurrent and incident power produce efficiency above 100%; choose a physically consistent reference cell and illumination." : "");
    $("#rl-table-body").innerHTML = shown.map(key => {
      const r = results[key];
      return '<tr data-active="' + (key === mode) + '"><th scope="row">' + names[key] + '</th><td>' + fmt(r.voc, 3) + '</td><td>' + displayValue(r.jsc * 1000 * scale) + '</td><td>' + fmt(r.ff * 100) + '</td><td>' + displayValue(r.pmax * 1000 * scale) + '</td></tr>';
    }).join("");
    $("#rl-probe").max = active.voc;
    $("#rl-probe").value = active.vmp;
    updateTarget();
    drawChart();
  }
  function drawChart() {
    if (!results) return;
    const isPower = plot === "pv", scale = displayScale(), ymax = (isPower ? results.ideal.pmax * 1000 : parameters.jph) * 1.12 * scale;
    const x = v => 65 + v / parameters.voc * 555;
    const y = value => 300 - value / ymax * 260;
    let svg = "";
    for (let i = 0; i <= 5; i++) {
      const v = parameters.voc * i / 5, val = ymax * i / 5;
      svg += '<line class="rl-gridline" x1="' + x(v) + '" y1="40" x2="' + x(v) + '" y2="300"/><text x="' + x(v) + '" y="322" text-anchor="middle">' + fmt(v, 2) + '</text>';
      svg += '<line class="rl-gridline" x1="65" y1="' + y(val) + '" x2="620" y2="' + y(val) + '"/><text x="55" y="' + (y(val) + 4) + '" text-anchor="end">' + (quantity === "total" ? deviceFmt(val) : fmt(val, 1)) + '</text>';
    }
    svg += '<path class="rl-axis" fill="none" d="M65 40V300H620"/><text x="343" y="350" text-anchor="middle">Voltage (V)</text><text x="65" y="20">' + (isPower ? "Power" + (quantity === "density" ? " density" : "") + " (" + powerUnit() + ")" : "Current" + (quantity === "density" ? " density" : "") + " (" + currentUnit() + ")") + '</text>';
    for (const key of shown) {
      const r = results[key];
      const path = r.points.map((point, i) => (i ? "L" : "M") + fmt(x(point.v), 3) + " " + fmt(y((isPower ? point.power : point.j) * 1000 * scale), 3)).join(" ");
      svg += '<path class="rl-curve rl-' + key + '" d="' + path + '"/>';
    }
    const r = results[mode], mppY = y((isPower ? r.pmax : r.jmp) * 1000 * scale);
    svg += '<circle cx="' + x(r.vmp) + '" cy="' + mppY + '" r="5.5" fill="var(--ink)" stroke="var(--surface)" stroke-width="2"><title>Maximum power: ' + displayValue(r.pmax * 1000 * scale) + ' ' + powerUnit() + ' at ' + fmt(r.vmp, 3) + ' V</title></circle>';
    svg += '<line id="rl-probe-line" class="rl-axis" stroke-dasharray="2 4" y1="40" y2="300"/><circle id="rl-probe-dot" r="4" fill="var(--surface)" stroke="var(--teal)" stroke-width="2"/>';
    $("#rl-chart-content").innerHTML = svg;
    $("#rl-legend").innerHTML = shown.map(key => '<span><svg aria-hidden="true"><line class="rl-curve rl-' + key + '" x1="0" y1="5" x2="23" y2="5"/></svg>' + names[key] + '</span>').join("");
    $("#rl-chart-title").textContent = (isPower ? "Power" : "Current") + (quantity === "density" ? " density" : "") + "–voltage";
    $("#rl-svg-title").textContent = $("#rl-chart-title").textContent;
    $('[data-plot="jv"]').textContent = quantity === "total" ? "I–V" : "J–V";
    $$("[data-plot]").forEach(button => button.setAttribute("aria-pressed", String(button.dataset.plot === plot)));
    updateProbe(x, y);
  }
  function updateProbe(x, y) {
    if (!results) return;
    const r = results[mode], v = Math.min(r.voc, Number($("#rl-probe").value));
    const j = Math.max(0, r.currentAt(v)), p = v * j, scale = displayScale();
    $("#rl-probe-value").textContent = fmt(v, 3) + " V · " + displayValue(j * 1000 * scale) + " " + currentUnit() + " · " + displayValue(p * 1000 * scale) + " " + powerUnit();
    $("#rl-probe").setAttribute("aria-valuetext", $("#rl-probe-value").textContent);
    const ymax = (plot === "pv" ? results.ideal.pmax * 1000 : parameters.jph) * 1.12 * scale;
    const px = x ? x(v) : 65 + v / parameters.voc * 555;
    const py = y ? y((plot === "pv" ? p : j) * 1000 * scale) : 300 - (plot === "pv" ? p : j) * 1000 * scale / ymax * 260;
    $("#rl-probe-line").setAttribute("x1", px); $("#rl-probe-line").setAttribute("x2", px);
    $("#rl-probe-dot").setAttribute("cx", px); $("#rl-probe-dot").setAttribute("cy", py);
  }
  $$("[data-plot]").forEach(button => button.addEventListener("click", () => {plot = button.dataset.plot; drawChart();}));
  $$("[data-quantity]").forEach(button => button.addEventListener("click", () => {if (valid) {quantity = button.dataset.quantity; update();}}));
  $("#rl-area").addEventListener("input", update);
  $(".rl-controls").addEventListener("submit", event => event.preventDefault());
  $$("[data-param]").forEach(input => input.addEventListener("input", () => {$("#rl-preset").value = "custom"; update();}));
  $$("[data-reference-slider]").forEach(slider => slider.addEventListener("input", () => {
    $("#rl-" + slider.dataset.referenceSlider).value = slider.value; $("#rl-preset").value = "custom"; update();
  }));
  $("#rl-rs-slider").addEventListener("input", event => {$("#rl-rs").value = event.target.value; $("#rl-preset").value = "custom"; update();});
  $("#rl-rsh-slider").addEventListener("input", event => {$("#rl-rsh").value = Math.round(10 ** Number(event.target.value)); $("#rl-preset").value = "custom"; update();});
  $("#rl-infinite").addEventListener("change", () => {$("#rl-preset").value = "custom"; update();});
  $("#rl-probe").addEventListener("input", () => updateProbe());
  $("#rl-preset").addEventListener("change", event => {setControls(event.target.value === "silicon" ? silicon : event.target.value === "highff" ? highFF : defaults);});
  $("#rl-target-ff").addEventListener("input", updateTarget);
  $("#rl-log-base").addEventListener("change", updateEstimate);
  $("#rl-slope").addEventListener("input", updateEstimate);
  $("#rl-use-n").addEventListener("click", () => {
    const n = updateEstimate();
    if (n === null) return;
    $("#rl-n").value = fmt(n, 3); $("#rl-preset").value = "custom"; update();
  });
  $("#rl-reset").addEventListener("click", () => {
    $("#rl-preset").value = "perovskite"; $("#rl-target-ff").value = 89;
    $("#rl-log-base").value = "log10"; $("#rl-slope").value = 89.3;
    $("#rl-area").value = 1; quantity = "density";
    setControls(defaults);
  });
  $("#rl-export").addEventListener("click", () => {
    if (!valid || !results) return;
    const p = results.both.parameters;
    const rows = [
      ["Solar cell resistance lab", "Steady-state single-diode model"],
      ["selected_model", mode], ["reference_Voc_V", p.voc], ["photocurrent_mA_cm2", p.jph],
      ["n", p.n], ["temperature_K", p.temperature], ["series_ohm_cm2", p.rs], ["shunt_ohm_cm2", p.rsh === Infinity ? "Infinity" : p.rsh],
      ["incident_power_mW_cm2", p.pin], ["J0_A_cm2", results.ideal.j0],
      ["active_area_cm2", area], ["display_quantity", quantity],
      ["series_device_ohm", p.rs / area], ["shunt_device_ohm", p.rsh === Infinity ? "Infinity" : p.rsh / area],
      ["incident_power_device_mW", p.pin * area],
      ["ideal_FF0_percent", results.ideal.ff * 100],
      ["resistance_FF_loss_pp", (results.ideal.ff - results.both.ff) * 100],
      ["target_FF_percent", targetResult ? targetResult.targetPercent : "not evaluated: invalid target"],
      ["target_status", targetResult ? targetResult.status : "not evaluated"],
      ["note", "Constant-n uniform single-cell simulation, not measured pseudo-FF or a unique resistance fit. Area scales current and power at fixed densities and area-normalized resistances; it does not predict geometry-dependent scale-up losses. Signed currents and powers; sweep extends to ideal reference Voc."], [],
      ["model", "Voc_V", "Jsc_mA_cm2", "Vmp_V", "Jmp_mA_cm2", "Pmax_mW_cm2", "FF_percent", "efficiency_percent", "Isc_mA", "Imp_mA", "Pmax_mW"]
    ];
    for (const key of Object.keys(names)) {
      const r = results[key], device = SolarResistance.deviceValues(r, area); rows.push([key, r.voc, r.jsc * 1000, r.vmp, r.jmp * 1000, r.pmax * 1000, r.ff * 100, r.efficiency, device.isc * 1000, device.imp * 1000, device.pmax * 1000]);
    }
    rows.push([], ["Voltage_V", "ideal_J_mA_cm2", "series_J_mA_cm2", "shunt_J_mA_cm2", "both_J_mA_cm2", "ideal_P_mW_cm2", "series_P_mW_cm2", "shunt_P_mW_cm2", "both_P_mW_cm2", "ideal_I_mA", "series_I_mA", "shunt_I_mA", "both_I_mA", "ideal_P_mW", "series_P_mW", "shunt_P_mW", "both_P_mW"]);
    const voltages = [...new Set([...Array.from({length: 401}, (_, i) => p.voc * i / 400), ...Object.values(results).flatMap(r => [r.voc, r.vmp])])].sort((a, b) => a - b);
    for (const v of voltages) {
      const currents = Object.keys(names).map(key => results[key].currentAt(v) * 1000);
      rows.push([v, ...currents, ...currents.map(j => v * j), ...currents.map(j => j * area), ...currents.map(j => v * j * area)]);
    }
    window.CSVExport.save("solar-cell-resistance-" + mode + ".csv", rows);
  });
  setControls(defaults);
})();
