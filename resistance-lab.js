(function () {
  "use strict";
  const root = document.getElementById("resistance-calculator");
  if (!root || !window.SolarResistance) return;
  const lang = document.documentElement.lang, T = (en, de, zh) => lang === "de" ? de : lang.startsWith("zh") ? zh : en;
  let measurement = null;
  const electricalSnapshots = {eis:null,sclc:null};
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
      '<p data-literal>' + T("Paper sources:", "Fachliteratur:", "论文来源：") + '</p><div class="rl-source-links">' +
      '<a href="https://doi.org/10.1016/0038-1101(81)90062-9" target="_blank" rel="noopener noreferrer">Green · Solid-State Electronics (1981) ↗</a>' +
      '<a href="https://doi.org/10.1002/pssa.201800448" target="_blank" rel="noopener noreferrer">Tada · Phys. Status Solidi A (2018) ↗</a>' +
      '<a href="https://doi.org/10.1002/aenm.202000502" target="_blank" rel="noopener noreferrer">Caprioglio et al. · Ideality factor in perovskites ↗</a>' +
      '<a href="https://arxiv.org/abs/1804.09049" target="_blank" rel="noopener noreferrer">Calado et al. · Transient ideality factor ↗</a>' +
      '</div></details>';
  const measuredLabel = T("Measured · module 06", "Gemessen · Modul 06", "实测 · 模块 06");
  const measuredSection = document.createElement("section");
  measuredSection.className = "rl-measurement"; measuredSection.hidden = true; measuredSection.setAttribute("data-literal", "");
  measuredSection.setAttribute("aria-labelledby", "rl-measured-title");
  measuredSection.innerHTML = '<h3 id="rl-measured-title">' + T("Measured curve comparison", "Vergleich mit Messkurve", "实测曲线对照") + '</h3><p id="rl-measured-source" class="rl-small"></p>' +
    '<div class="rl-table-wrap"><table class="rl-table"><thead><tr><th scope="col">' + T("Quantity", "Größe", "参数") + '</th><th scope="col">' + measuredLabel + '</th><th scope="col">' + T("Current model", "Aktuelles Modell", "当前模型") + '</th></tr></thead><tbody id="rl-measured-table"></tbody></table></div>' +
    '<p class="rl-small" id="rl-measured-slopes"></p><p class="rl-small">' + T("Rs,app and Rsh,app are local slope estimates. Applying them assumes they are circuit resistances; this is a starting model, not a unique fit. Your current n and T are retained. Reference Jph and Voc,0 are calculated to match measured Jsc and Voc. FF and PCE remain independent comparisons.", "Rs,app und Rsh,app sind lokale Steigungsschätzungen. Ihre Verwendung als Schaltungswiderstände ist eine Annahme: ein Startmodell, kein eindeutiger Fit. Aktuelle n und T bleiben erhalten. Jph und Voc,0 werden an gemessene Jsc und Voc angepasst. FF und PCE bleiben unabhängige Vergleichswerte.", "Rs,app、Rsh,app 是局部斜率估算。将其用作等效电路电阻属于建模假设，只建立起始模型，不是唯一拟合。沿用当前 n、T，换算参考 Jph、Voc,0，使模型经过实测 Jsc、Voc；FF、PCE 保留为独立对照。") + '</p>' +
    '<div class="rl-actions"><button type="button" class="rl-action" id="rl-use-measured">' + T("Build starting model from apparent values", "Startmodell aus scheinbaren Werten", "用表观参数建立起始模型") + '</button><button type="button" class="rl-action" id="rl-back-jv">' + T("Back to module 06", "Zurück zu Modul 06", "返回模块 06") + '</button></div><p id="rl-measured-status" class="sp-message" role="status"></p>' +
    '<details><summary>' + T("Assumptions & paper sources", "Annahmen und Fachliteratur", "假设与论文依据") + '</summary><p class="rl-small">' + T("This is a saved snapshot of the selected scan. Send it again after editing module 06; Reset example clears it. Density comparisons use mA/cm². Whole-device overlays need a known measured active area; model and measured illumination are listed separately. The endpoint conversion is an algebraic rearrangement of the single-diode equation, not a published parameter-fitting method.", "Gespeicherter Stand des gewählten Scans. Nach Änderungen in Modul 06 erneut senden; Beispiel zurücksetzen löscht ihn. Dichtevergleich in mA/cm². Gerätekurven benötigen eine bekannte Messfläche; Beleuchtungen sind separat angegeben. Die Endpunktumrechnung ist eine algebraische Umstellung der Ein-Dioden-Gleichung, kein publiziertes Fitverfahren.", "对照保存当前扫描的快照；修改模块 06 后需重新发送，重置示例会清除快照。电流密度按 mA/cm² 对照；器件总量叠图需要已知实测面积，实测与模型的光强分别列出。端点换算由单二极管方程代数推导，不声称是论文提出的参数拟合方法。") + '</p><div class="rl-source-links"><a href="https://doi.org/10.1016/0038-1101(81)90062-9" target="_blank" rel="noopener noreferrer">Green · Solid-State Electronics (1981) ↗</a><a href="https://doi.org/10.1002/pssa.201800448" target="_blank" rel="noopener noreferrer">Tada · Phys. Status Solidi A (2018) ↗</a></div></details>';
  $(".rl-metrics").after(measuredSection);
  const electricalSection=document.createElement('section');electricalSection.className='rl-electrical';electricalSection.hidden=true;electricalSection.setAttribute('data-literal','');
  electricalSection.innerHTML='<h3>'+T('EIS / SCLC comparison','EIS- / SCLC-Vergleich','EIS／SCLC 对照')+'</h3><p id="rl-electrical-current" class="rl-small"></p>'+['eis','sclc'].map(kind=>'<div id="rl-electrical-'+kind+'" hidden><h4>'+kind.toUpperCase()+'</h4><p id="rl-'+kind+'-source" class="rl-small"></p><div class="rl-table-wrap"><table class="rl-table"><tbody id="rl-'+kind+'-table"></tbody></table></div><button id="rl-back-'+kind+'" type="button" class="rl-action">'+T('Back to module ','Zurück zu Modul ','返回模块 ')+(kind==='eis'?'07':'08')+'</button></div>').join('')+'<p class="rl-small">'+T('Applying EIS Rs to a DC model is an assumption. Its parallel-branch R is not Rsh. SCLC trap density and mobility are comparison quantities, without an automatic resistance conversion. Snapshots remain until resent or this model is reset.','Die Übernahme von EIS-Rs in ein DC-Modell ist eine Annahme. Der Parallelwiderstand ist nicht Rsh. SCLC-Fallendichte und Mobilität dienen zum Vergleich, ohne automatische Widerstandsumrechnung. Schnappschüsse bleiben bis zum erneuten Senden oder Modellreset.','将 EIS 的 Rs 用于直流模型属于建模假设，并联支路 R 不等于 Rsh。SCLC 陷阱密度与迁移率仅作对照，不自动换算电阻。快照保留至重新发送或重置本模型。')+'</p><button type="button" class="rl-action" id="rl-use-eis">'+T('Use EIS Rs as a starting value','EIS-Rs als Startwert verwenden','用 EIS 的 Rs 作为起始值')+'</button><p id="rl-electrical-status" class="sp-message" role="status"></p>';
  $('.rl-metrics').after(electricalSection);
  function updateElectrical(){
    electricalSection.hidden=!electricalSnapshots.eis&&!electricalSnapshots.sclc;
    $('#rl-electrical-current').textContent=valid?'03 · Rs = '+deviceFmt(parameters.rs)+' Ω·cm² · A = '+areaText()+' cm²':T('Correct the model inputs before applying Rs.','Modelleingaben vor Übernahme von Rs korrigieren.','请先修正模型输入，再使用 Rs。');
    for(const kind of ['eis','sclc']){
      const e=electricalSnapshots[kind];$('#rl-electrical-'+kind).hidden=!e;const table=$('#rl-'+kind+'-table');table.replaceChildren();if(!e)continue;
      $('#rl-'+kind+'-source').textContent=e.source+' · '+T('Sample: ','Probe: ','样品：')+(e.sampleId||T('not specified','nicht angegeben','未填写'))+' · '+(e.conditions||T('conditions not specified','Bedingungen nicht angegeben','未填写测量条件'));
      const values=kind==='eis'?[['Rs (Ω)',e.rs],['Rs·A (Ω·cm²)',e.area?e.rs*e.area:null],['Rbranch (Ω)',e.r],['τ (s)',e.tau],['Ceff (F)',e.ceff],['n',e.n],['A (cm²)',e.area]]:[['Nt,app (cm⁻³)',e.nt],['μapp (cm² V⁻¹ s⁻¹)',e.mu],['V₂ (Veff)',e.tfl],['L (nm)',e.thickness],['εr',e.epsilon],['log slope',e.slope],['R²',e.r2]];
      for(const [key,value]of values){const row=document.createElement('tr'),label=document.createElement('th'),cell=document.createElement('td');label.scope='row';label.textContent=key;cell.textContent=Number.isFinite(value)?deviceFmt(value):'—';row.append(label,cell);table.append(row);}
    }
    const e=electricalSnapshots.eis,rs=e?.rs*e?.area;$('#rl-use-eis').hidden=!e;$('#rl-use-eis').disabled=!valid||!e?.converged||e.warnings.length>0||!Number.isFinite(e.area)||e.area<SolarResistance.areaLimits[0]||e.area>SolarResistance.areaLimits[1]||!Number.isFinite(rs)||rs<SolarResistance.limits.rs[0]||rs>SolarResistance.limits.rs[1];
  }
  function measuredScale() {
    return !measurement ? null : quantity === "density" ? 1 : measurement.parameters.area > 0 ? measurement.parameters.area : null;
  }
  function updateMeasurement() {
    if (!measurement) return;
    const m = measurement, active = valid ? results?.both : null;
    $("#rl-measured-source").textContent = m.source + " · " + T("Scan ", "Scan ", "扫描 ") + m.index + (m.direction > 0 ? " · V ↑" : " · V ↓") + " · " + T("Snapshot", "Gespeicherter Stand", "快照") + (m.voltagePolarity < 0 ? " · " + T("Original Voc = ", "Original-Voc = ", "原始 Voc = ") + fmt(m.signedVoc, 4) + " V · " + T("comparison uses positive generating voltage", "Vergleich mit positiver Generatorspannung", "对照使用归一后的正向发电电压") : "");
    $("#rl-measured-slopes").textContent = "Rs,app = " + (m.rs.resistance == null ? "—" : deviceFmt(m.rs.resistance)) + " · Rsh,app = " + (m.rsh.resistance == null ? "—" : deviceFmt(m.rsh.resistance)) + " Ω·cm² · " + T("fit half-width: ", "Fit-Halbbreite: ", "拟合半宽：") + m.parameters.fitPercent + "% Voc" +
      (quantity === "total" && measuredScale() === null ? " · " + T("Use Per cm² to view the measured curve: its active area is unknown.", "Für die Messkurve Per cm² wählen: Messfläche unbekannt.", "实测面积未知，请切换“每 cm²”查看实测曲线。") : "");
    $("#rl-measured-table").replaceChildren();
    const rows = [
      ["Voc (V)", m.voc, active?.voc], ["Jsc (mA/cm²)", m.jsc, active?.jsc * 1000],
      ["FF (%)", m.ff, active?.ff * 100], ["PCE (%)", m.pce, active?.efficiency],
      ["Pin (mW/cm²)", m.parameters.pin, active?.parameters.pin]
    ];
    for (const [label, measured, simulated] of rows) {
      const row = document.createElement("tr"), heading = document.createElement("th"); heading.scope = "row"; heading.textContent = label; row.append(heading);
      for (const value of [measured, simulated]) {const cell = document.createElement("td"); cell.textContent = Number.isFinite(value) ? fmt(value, 4) : "—"; row.append(cell);}
      $("#rl-measured-table").append(row);
    }
  }
  let darkMeasurement=null;
  const darkSection=document.createElement('section');darkSection.className='char-comparison rl-dark';darkSection.hidden=true;darkSection.setAttribute('data-literal','');
  darkSection.innerHTML='<h3>'+T('Dark J–V snapshot · 06','Dunkel-J–V-Schnappschuss · 06','暗态 J–V 快照 · 06')+'</h3><p id="rl-dark-source" class="rl-small"></p><div class="rl-table-wrap"><table class="rl-table"><tbody id="rl-dark-table"></tbody></table></div><p class="rl-small">'+T('Rdiff,0 may initialize Rsh only as an approximation; napp and T are separate starting assumptions. Check diode/contact/series contributions. Illuminated reference Jph and Voc stay as entered; the model recalibrates its own J0. Dark J0,app is only a comparison quantity. Snapshot stays until resent or reset.','Rdiff,0 nähert Rsh nur als Startannahme an; napp und T sind eigene Startannahmen. Dioden-/Kontakt-/Serienbeiträge prüfen. Beleuchtete Referenzen Jph und Voc bleiben; das Modell kalibriert sein eigenes J0. Dunkel-J0,app dient nur zum Vergleich. Schnappschuss bleibt bis erneut gesendet/zurückgesetzt.','Rdiff,0 仅可近似用作 Rsh 起始假设；napp 与温度是独立起始假设，需核对二极管、接触及串联贡献。光照参考 Jph、Voc 保持输入值，模型会重新标定自身 J0；暗态 J0,app 仅作对照。快照保留至重新发送或重置。')+'</p><div class="sp-row"><button type="button" class="rl-action" id="rl-dark-rsh">'+T('Use Rdiff,0 as Rsh start','Rdiff,0 als Rsh-Start','用 Rdiff,0 作为 Rsh 起始值')+'</button><button type="button" class="rl-action" id="rl-dark-n">'+T('Use napp + T as start','napp + T als Start','用 napp 与温度作为起始值')+'</button></div><p id="rl-dark-status" class="sp-message" role="status"></p>';
  $('.rl-metrics').after(darkSection);
  const darkInRange=(key,value)=>Number.isFinite(value)&&value>=SolarResistance.limits[key][0]&&value<=SolarResistance.limits[key][1];
  function updateDark(){
    const d=darkMeasurement;darkSection.hidden=!d;if(!d)return;
    $('#rl-dark-source').textContent=d.parameters.sampleId+' · '+d.source+' · scan '+d.index+' · '+d.parameters.conditions;
    $('#rl-dark-table').replaceChildren();for(const [label,value]of [['Jreverse (A/cm²)',d.reverseJ],['Vreverse (V)',d.reverseV],['Rdiff,0 (Ω·cm²)',d.zero.resistance],['R² · near zero',d.zero.r2],['napp',d.diode.n],['J₀,app (A/cm²)',d.diode.j0],['R² · forward ln J',d.diode.r2],['T (K)',d.parameters.temperature]]){const row=document.createElement('tr'),th=document.createElement('th'),td=document.createElement('td');th.scope='row';th.textContent=label;td.textContent=value===Infinity?'∞':Number.isFinite(value)?deviceFmt(value):'—';row.append(th,td);$('#rl-dark-table').append(row);}
    $('#rl-dark-rsh').disabled=!valid||!d.zero.usable||!darkInRange('rsh',d.zero.resistance);
    $('#rl-dark-n').disabled=!valid||!d.diode.usable||!darkInRange('n',d.diode.n)||!darkInRange('temperature',d.parameters.temperature);
  }
  window.ResistanceLab = {compareMeasurement(scan, source) {
    if (!scan || !Array.isArray(scan.points) || scan.points.length > 20000 || !scan.points.every(p => p.length === 2 && p.every(Number.isFinite))) return false;
    measurement = {...scan, source: String(source), points: scan.points.map(p => [...p]), parameters: {...scan.parameters}, rs: {...scan.rs}, rsh: {...scan.rsh}, warnings: [...scan.warnings]};
    measuredSection.hidden = false; $(".rl-metrics").after(measuredSection);
    $("#rl-measured-status").textContent = T("Comparison loaded. Model inputs are unchanged.", "Vergleich geladen. Modelleingaben sind unverändert.", "已载入对照，尚未修改模型输入。");
    updateMeasurement(); drawChart(); return true;
  },compareElectrical(kind,r,source){
    if(!['eis','sclc'].includes(kind)||!r?.parameters||typeof source!=='string'||source.length>2000)return false;
    const p=r.parameters;if(typeof p.sampleId!=='string'||p.sampleId.length>80||typeof p.conditions!=='string'||p.conditions.length>240||p.area!==null&&(!Number.isFinite(p.area)||p.area<=0))return false;
    const rows=kind==='eis'?r.all:r.points,width=kind==='eis'?3:2;if(!Array.isArray(rows)||rows.length<5||rows.length>(kind==='eis'?5000:20000)||rows.some(a=>!Array.isArray(a)||a.length!==width||!a.every(Number.isFinite)))return false;
    const base={source,sampleId:p.sampleId,conditions:p.conditions,area:p.area,points:rows.map(a=>[...a]),applied:null};let next;
    if(kind==='eis'){
      if(![r.rs,r.r,r.q,r.n,r.tau,r.ceff].every(v=>Number.isFinite(v)&&v>0)||!Number.isFinite(r.nrmse)||r.nrmse<0||!Array.isArray(r.warnings)||r.warnings.some(v=>typeof v!=='string'))return false;
      next={...base,rs:r.rs,r:r.r,q:r.q,n:r.n,tau:r.tau,ceff:r.ceff,nrmse:r.nrmse,converged:r.converged===true,warnings:[...r.warnings],model:p.model,fmin:p.fmin,fmax:p.fmax};
    }else{
      if([r.nt,r.mu,r.tfl].some(v=>v!==null&&(!Number.isFinite(v)||v<=0))||![p.thickness,p.epsilon,r.high?.slope,r.high?.r2].every(Number.isFinite))return false;
      next={...base,nt:r.nt,mu:r.mu,tfl:r.tfl,thickness:p.thickness,epsilon:p.epsilon,slope:r.high.slope,r2:r.high.r2,scan:p.scan+1,tflSource:r.tflSource};
    }
    electricalSnapshots[kind]=next;$('.rl-metrics').after(electricalSection);updateElectrical();$('#rl-electrical-status').textContent=T('Snapshot loaded. Select Use EIS Rs explicitly; SCLC does not change model parameters. Applying Rs requires a converged fit without warnings, known measured area and Rs·A within 0–50 Ω·cm².','Schnappschuss geladen. EIS-Rs ausdrücklich übernehmen; SCLC ändert keine Parameter. Rs erfordert einen konvergierten Fit ohne Warnungen, bekannte Messfläche und Rs·A von 0–50 Ω·cm².','已载入快照。使用 EIS 的 Rs 需明确点击起始值按钮；SCLC 不改变模型参数。 使用 Rs 需无警告的收敛拟合、已知测量面积，且 Rs·A 在 0–50 Ω·cm² 内。');return true;
  }};
  Object.assign(window.ResistanceLab,{compareDark(r,source){
    if(!r?.parameters||!r.zero||!r.diode||typeof source!=='string'||source.length>2000||!Array.isArray(r.points)||r.points.length<5||r.points.length>20000||r.points.some(a=>!Array.isArray(a)||a.length!==2||!a.every(Number.isFinite)))return false;
    const p=r.parameters;if(typeof p.sampleId!=='string'||!p.sampleId.trim()||p.sampleId.length>80||typeof p.conditions!=='string'||p.conditions.length>240||!Number.isFinite(p.temperature)||p.temperature<=0||!Array.isArray(r.warnings)||r.warnings.some(v=>typeof v!=='string')||[r.reverseJ,r.diode.n,r.diode.j0].some(v=>v!==null&&!Number.isFinite(v)))return false;
    darkMeasurement={...r,source,parameters:{...p},zero:{...r.zero},diode:{...r.diode},points:r.points.map(a=>[...a]),warnings:[...r.warnings],applied:[]};$('.rl-metrics').after(darkSection);updateDark();$('#rl-dark-status').textContent=T('Snapshot loaded without changing model inputs. Apply each qualified starting assumption explicitly; out-of-range or unqualified values are disabled.','Schnappschuss ohne Modelländerung geladen. Geprüfte Startannahmen ausdrücklich übernehmen; ungeeignete Werte deaktiviert.','已载入快照，模型参数未改动。起始假设需分别点击；未满足质量条件或超出模型范围的值不可应用。');return true;
  },clearDark(){darkMeasurement=null;darkSection.hidden=true;}});
  for(const kind of ['rsh','n'])$('#rl-dark-'+kind).addEventListener('click',()=>{
    const d=darkMeasurement;if(!d||$('#rl-dark-'+kind).disabled)return;const values=kind==='rsh'?{rsh:d.zero.resistance}:{n:d.diode.n,temperature:d.parameters.temperature},next={...results.both.parameters,...values};
    try{SolarResistance.model(next,{sampleCurve:false});$('#rl-preset').value='custom';setControls(next);d.applied.push({kind,...values});$('#rl-dark-status').textContent=T('Starting assumption applied. Model J0 is recalibrated from its illuminated reference; dark J0,app was not assigned.','Startannahme übernommen. Modell-J0 aus beleuchteter Referenz neu kalibriert; Dunkel-J0,app nicht zugewiesen.','已应用起始假设；模型 J0 按光照参考重新标定，未直接使用暗态 J0,app。');}catch{$('#rl-dark-status').textContent=T('Check fit quality and model ranges.','Fitqualität und Modellgrenzen prüfen.','请检查拟合质量及模型范围。');}
  });
  $('#rl-use-eis').addEventListener('click',()=>{
    const e=electricalSnapshots.eis;if(!e||$('#rl-use-eis').disabled)return;
    try{const next={...results.both.parameters,rs:e.rs*e.area};SolarResistance.model(next,{sampleCurve:false});$('#rl-area').value=e.area;$('#rl-preset').value='custom';setControls(next);e.applied={...next,area:e.area};$('#rl-electrical-status').textContent=T('EIS Rs·A applied as a starting assumption. Parallel R was not used as Rsh.','EIS Rs·A als Startannahme übernommen. Parallel-R wird nicht als Rsh verwendet.','已将 EIS 的 Rs·A 用作起始假设，并联支路 R 未作为 Rsh。');}catch{$('#rl-electrical-status').textContent=T('Cannot apply: verify fit quality, measured area and model ranges.','Übernahme nicht möglich: Fitqualität, Messfläche und Modellgrenzen prüfen.','无法应用：请核对拟合质量、测量面积和模型范围。');}
  });
  for(const kind of ['eis','sclc'])$('#rl-back-'+kind).addEventListener('click',()=>{document.getElementById('pv-tab-'+kind).click();document.getElementById(kind+'-analysis').scrollIntoView({behavior:'smooth',block:'start'});});
  $("#rl-use-measured").addEventListener("click", () => {
    if (!measurement) return;
    try {
      const nextArea = measurement.parameters.area > 0 ? measurement.parameters.area : $("#rl-area").valueAsNumber;
      if (!Number.isFinite(nextArea) || nextArea < SolarResistance.areaLimits[0] || nextArea > SolarResistance.areaLimits[1]) throw new RangeError("Invalid area");
      const next = SolarResistance.fromMeasured(measurement, {n: $("#rl-n").valueAsNumber, temperature: $("#rl-temperature").valueAsNumber, rs: measurement.rs.resistance, rsh: measurement.rsh.resistance, pin: measurement.parameters.pin});
      $("#rl-area").value = nextArea; $("#rl-preset").value = "custom"; setControls(next);
      measurement.initialization = {...next, area: nextArea};
      $("#rl-measured-status").textContent = T("Starting model applied using apparent resistances. FF/PCE differences show the remaining curve mismatch; adjust the model as needed.", "Startmodell mit scheinbaren Widerständen angewendet. FF/PCE-Abweichungen zeigen verbleibende Kurvenunterschiede; Modell bei Bedarf anpassen.", "已按表观电阻建立起始模型。FF／PCE 差异反映剩余曲线偏差，可继续调整模型。");
    } catch {
      $("#rl-measured-status").textContent = T("Cannot initialize: slopes must be available and compatible with positive J0. Model ranges: Rs 0–50, Rsh 10–10⁶ or ∞ Ω·cm²; reference Voc 0.2–2 V, Jph 1–60 mA/cm²; n 1–2, T 200–400 K, Pin 10–200 mW/cm²; area 10⁻⁶–10⁴ cm². Inputs were not changed.", "Initialisierung nicht möglich: Steigungen müssen verfügbar und mit positivem J0 vereinbar sein. Modellbereiche: Rs 0–50, Rsh 10–10⁶ oder ∞ Ω·cm²; Referenz-Voc 0,2–2 V, Jph 1–60 mA/cm²; n 1–2, T 200–400 K, Pin 10–200 mW/cm²; Fläche 10⁻⁶–10⁴ cm². Eingaben bleiben unverändert.", "无法建立模型：需有可用斜率，并满足 J0 为正的端点条件。模型范围：Rs 0–50、Rsh 10–10⁶ 或 ∞ Ω·cm²；参考 Voc 0.2–2 V、Jph 1–60 mA/cm²；n 1–2、T 200–400 K、Pin 10–200 mW/cm²；面积 10⁻⁶–10⁴ cm²。输入未被修改。");
    }
  });
  $("#rl-back-jv").addEventListener("click", () => {document.getElementById("pv-tab-jv").click(); document.getElementById("jv-analysis").scrollIntoView({behavior: "smooth", block: "start"});});
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
    if (!readInputs()) {updateTarget(); updateMeasurement(); updateElectrical(); updateDark(); return;}
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
    updateMeasurement();
    drawChart();
  }
  function chartBounds() {
    const scale = displayScale(), ms = measuredScale();
    return {
      xmax: Math.max(parameters.voc, ms === null ? 0 : measurement.voc),
      ymax: Math.max((plot === "pv" ? results.ideal.pmax * 1000 : parameters.jph) * scale, ms === null ? 0 : (plot === "pv" ? measurement.pmax : Math.max(measurement.jsc, ...measurement.points.filter(([v]) => v >= 0 && v <= measurement.voc).map(([, j]) => j))) * ms) * 1.12
    };
  }
  function drawChart() {
    if (!results) return;
    const isPower = plot === "pv", scale = displayScale(), {xmax, ymax} = chartBounds();
    const x = v => 65 + v / xmax * 555;
    const y = value => 300 - value / ymax * 260;
    let svg = "";
    for (let i = 0; i <= 5; i++) {
      const v = xmax * i / 5, val = ymax * i / 5;
      svg += '<line class="rl-gridline" x1="' + x(v) + '" y1="40" x2="' + x(v) + '" y2="300"/><text x="' + x(v) + '" y="322" text-anchor="middle">' + fmt(v, 2) + '</text>';
      svg += '<line class="rl-gridline" x1="65" y1="' + y(val) + '" x2="620" y2="' + y(val) + '"/><text x="55" y="' + (y(val) + 4) + '" text-anchor="end">' + (quantity === "total" ? deviceFmt(val) : fmt(val, 1)) + '</text>';
    }
    svg += '<path class="rl-axis" fill="none" d="M65 40V300H620"/><text x="343" y="350" text-anchor="middle">Voltage (V)</text><text x="65" y="20">' + (isPower ? "Power" + (quantity === "density" ? " density" : "") + " (" + powerUnit() + ")" : "Current" + (quantity === "density" ? " density" : "") + " (" + currentUnit() + ")") + '</text>';
    for (const key of shown) {
      const r = results[key];
      const path = r.points.map((point, i) => (i ? "L" : "M") + fmt(x(point.v), 3) + " " + fmt(y((isPower ? point.power : point.j) * 1000 * scale), 3)).join(" ");
      svg += '<path class="rl-curve rl-' + key + '" d="' + path + '"/>';
    }
    if (measuredScale() !== null) {
      const m = measurement, ms = measuredScale();
      const points = [[0, m.jsc], ...m.points.filter(([v]) => v > 0 && v < m.voc), [m.vmp, m.jmp], [m.voc, 0]].sort((a, b) => a[0] - b[0]);
      const stride = Math.max(1, Math.ceil(points.length / 1000));
      const path = points.filter((p, i) => i % stride === 0 || i === points.length - 1 || p[0] === m.vmp).map(([v, j], i) => (i ? "L" : "M") + fmt(x(v), 3) + " " + fmt(y((isPower ? v * j : j) * ms), 3)).join(" ");
      svg += '<path class="rl-curve rl-measured-curve" d="' + path + '"/>';
    }
    const r = results[mode], mppY = y((isPower ? r.pmax : r.jmp) * 1000 * scale);
    svg += '<circle cx="' + x(r.vmp) + '" cy="' + mppY + '" r="5.5" fill="var(--ink)" stroke="var(--surface)" stroke-width="2"><title>Maximum power: ' + displayValue(r.pmax * 1000 * scale) + ' ' + powerUnit() + ' at ' + fmt(r.vmp, 3) + ' V</title></circle>';
    svg += '<line id="rl-probe-line" class="rl-axis" stroke-dasharray="2 4" y1="40" y2="300"/><circle id="rl-probe-dot" r="4" fill="var(--surface)" stroke="var(--teal)" stroke-width="2"/>';
    $("#rl-chart-content").innerHTML = svg;
    $("#rl-legend").innerHTML = shown.map(key => '<span><svg aria-hidden="true"><line class="rl-curve rl-' + key + '" x1="0" y1="5" x2="23" y2="5"/></svg>' + names[key] + '</span>').join("");
    if (measuredScale() !== null) {
      const entry = document.createElement("span"); entry.setAttribute("data-literal", "");
      entry.innerHTML = '<svg aria-hidden="true"><line class="rl-curve rl-measured-curve" x1="0" y1="5" x2="23" y2="5"/></svg>';
      entry.append(document.createTextNode(measuredLabel)); $("#rl-legend").append(entry);
    }
    updateMeasurement(); updateElectrical(); updateDark();
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
    const {xmax, ymax} = chartBounds();
    const px = x ? x(v) : 65 + v / xmax * 555;
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
    measurement = null; measuredSection.hidden = true; darkMeasurement=null; darkSection.hidden=true; electricalSnapshots.eis=null; electricalSnapshots.sclc=null; electricalSection.hidden=true;
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
    if (measurement) {
      const m = measurement, safe = value => /^[=+@-]/.test(String(value).trimStart()) ? "'" + value : value;
      rows.push([], ["measurement_snapshot_source", safe(m.source)], ["measurement_scan", m.index, m.direction > 0 ? "increasing_V" : "decreasing_V"],
        ["measurement_Pin_mW_cm2", m.parameters.pin], ["measurement_area_cm2", m.parameters.area || "unknown"],
        ["measurement_Voc_V", m.voc], ["measurement_original_Voc_V", m.signedVoc ?? m.voc], ["measurement_voltage_polarity", m.voltagePolarity ?? 1], ["measurement_near_zero_threshold_mA_cm2", m.noiseTolerance ?? ""], ["measurement_Jsc_mA_cm2", m.jsc], ["measurement_FF_percent", m.ff], ["measurement_PCE_percent", m.pce],
        ["measurement_Rs_apparent_ohm_cm2", m.rs.resistance ?? ""], ["measurement_Rsh_apparent_ohm_cm2", m.rsh.resistance ?? ""],
        ["measurement_fit_half_width_percent_Voc", m.parameters.fitPercent], ["measurement_warnings", m.warnings.join(";")],
        ["measurement_note", "Snapshot; apparent slopes are not unique circuit parameters. Initialization assumes Rs/Rsh and retains n/T, solving reference Jph and Voc from measured endpoints; FF and PCE are independent comparisons."],
        ["measurement_initialization", m.initialization ? JSON.stringify(m.initialization, (key, value) => value === Infinity ? "Infinity" : value) : "not applied"],
        ["single_diode_reference_DOI", "10.1016/0038-1101(81)90062-9"], ["apparent_resistance_reference_DOI", "10.1002/pssa.201800448"]);
      for (const key of ["rs", "rsh"]) {const f = m[key]; rows.push(["measurement_" + key + "_fit", "lo_V", f.lo ?? "", "hi_V", f.hi ?? "", "N", f.count, "R2", f.r2 ?? ""]);}
      rows.push([], ["measured_voltage_V", "measured_output_current_density_mA_cm2"], ...m.points);
    }
    for(const [kind,e]of Object.entries(electricalSnapshots))if(e){
      const safe=v=>typeof v==='string'&&/^[=+@-]/.test(v.trimStart())?"'"+v:v;
      rows.push([],['electrical_snapshot',kind],...Object.entries(e).filter(([k])=>k!=='points').map(([k,v])=>[kind+'_'+k,safe(v&&typeof v==='object'?JSON.stringify(v):v??'')]),[kind+'_note',kind==='eis'?'Rs*measured area may initialize only series resistance as a modelling assumption; parallel R is not Rsh.':'Classical apparent Nt/mu, not converted into Rs/Rsh.'],[],kind==='eis'?['eis_f_Hz','eis_Re_Z_ohm','eis_Im_Z_ohm']:['sclc_Veff_V','sclc_J_A_cm-2'],...e.points);
    }
    if(darkMeasurement){const d=darkMeasurement,safe=v=>typeof v==='string'&&/^[=+@-]/.test(v.trimStart())?"'"+v:v;rows.push([],['dark_snapshot_source',safe(d.source)],['dark_sample_id',safe(d.parameters.sampleId)],['dark_conditions',safe(d.parameters.conditions)],['dark_scan',d.index],['dark_reverse_V',d.reverseV],['dark_reverse_J_A_cm-2',d.reverseJ??''],['dark_Rdiff0_ohm_cm2',d.zero.resistance??''],['dark_n_apparent',d.diode.n??''],['dark_J0_apparent_A_cm-2',d.diode.j0??''],['dark_temperature_K',d.parameters.temperature],['dark_near_zero_fit',JSON.stringify(d.zero)],['dark_forward_fit',JSON.stringify(d.diode)],['dark_warnings',d.warnings.join(';')],['dark_applied_assumptions',JSON.stringify(d.applied)],['dark_note','Only explicit qualified Rdiff0/Rsh or n/T starting assumptions; illuminated Jph/Voc retained; dark J0 is not assigned.'],[],['dark_original_V','dark_signed_J_A_cm-2'],...d.points);}
    window.CSVExport.save("solar-cell-resistance-" + mode + ".csv", rows);
  });
  setControls(defaults);
})();
