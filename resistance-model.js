/* Single-cell, area-normalized single-diode model. SI current density: A/cm2.
 * Reference Voc calibrates J0 at the selected n and T. It is not a temperature model.
 * Governing equation: Green, Solid-State Electronics (1981), doi:10.1016/0038-1101(81)90062-9.
 */
(function (root) {
  "use strict";
  const KB = 1.380649e-23, Q = 1.602176634e-19;
  const limits = {voc: [0.2, 2], jph: [1, 60], n: [1, 2], temperature: [200, 400], rs: [0, 50], rsh: [10, 1e6], pin: [10, 200]};
  const extendedIdealityRange = [0.5, 5];
  function idealityRange(mode = "classic") {
    if (mode === "classic") return limits.n;
    if (mode === "extended") return extendedIdealityRange;
    throw new RangeError("Invalid ideality mode");
  }
  function validate(p) {
    const nRange = idealityRange(p.idealityMode);
    for (const key of Object.keys(limits)) {
      const value = p[key], bounds = key === "n" ? nRange : limits[key];
      if (key === "rsh" && value === Infinity) continue;
      if (!Number.isFinite(value) || value < bounds[0] || value > bounds[1]) throw new RangeError("Invalid " + key);
    }
    return p;
  }
  function model(parameters, {sampleCurve = true} = {}) {
    const p = validate({...parameters});
    const a = p.n * KB * p.temperature / Q, jl = p.jph / 1000;
    const j0 = jl / Math.expm1(p.voc / a);
    const junctionCurrent = u => jl - j0 * Math.expm1(u / a) - (p.rsh === Infinity ? 0 : u / p.rsh);
    function currentAt(voltage) {
      if (!Number.isFinite(voltage) || voltage < 0 || voltage > p.voc * 1.001) throw new RangeError("Voltage outside reference sweep");
      if (p.rs === 0) return junctionCurrent(voltage);
      let lo = 0, hi = Math.max(voltage, p.voc);
      // V = U - J(U) Rs is strictly increasing: bisection has a unique root.
      for (let i = 0; i < 65; i++) {
        const u = (lo + hi) / 2;
        if (u - junctionCurrent(u) * p.rs > voltage) hi = u; else lo = u;
      }
      return junctionCurrent((lo + hi) / 2);
    }
    let lo = 0, hi = p.voc;
    for (let i = 0; i < 65; i++) {
      const u = (lo + hi) / 2;
      if (junctionCurrent(u) > 0) lo = u; else hi = u;
    }
    const voc = p.rsh === Infinity ? p.voc : (lo + hi) / 2;
    const jsc = currentAt(0);
    lo = 0; hi = voc;
    const ratio = (Math.sqrt(5) - 1) / 2;
    let c = hi - ratio * (hi - lo), d = lo + ratio * (hi - lo);
    const powerAt = v => v * currentAt(v);
    let pc = powerAt(c), pd = powerAt(d);
    for (let i = 0; i < 65; i++) {
      if (pc > pd) { hi = d; d = c; pd = pc; c = hi - ratio * (hi - lo); pc = powerAt(c); }
      else { lo = c; c = d; pc = pd; d = lo + ratio * (hi - lo); pd = powerAt(d); }
    }
    const vmp = (lo + hi) / 2, jmp = currentAt(vmp), pmax = vmp * jmp;
    return {parameters: p, a, j0, currentAt, voc, jsc, vmp, jmp, pmax,
      ff: pmax / (voc * jsc), efficiency: pmax * 1000 / p.pin * 100,
      points: sampleCurve ? Array.from({length: 301}, (_, i) => {
        const v = voc * i / 300, j = i === 300 ? 0 : Math.max(0, currentAt(v));
        return {v, j, power: v * j};
      }) : []};
  }
  function compare(p) {
    validate(p);
    const ideal = model({...p, rs: 0, rsh: Infinity});
    const series = model({...p, rsh: Infinity});
    const shunt = model({...p, rs: 0});
    const both = model(p);
    return {ideal, series, shunt, both};
  }
  function fromMeasured(measured, {n, temperature, rs, rsh, pin, idealityMode}) {
    const assumptions = {n, temperature, rs, rsh, pin};
    if (idealityMode !== undefined) assumptions.idealityMode = idealityMode;
    validate({voc: measured.voc, jph: measured.jsc, ...assumptions});
    const a = n * KB * temperature / Q, s = measured.jsc / 1000, v = measured.voc;
    const u = s * rs, g = rsh === Infinity ? 0 : 1 / rsh;
    const numerator = s + (u - v) * g;
    if (v <= u || numerator <= 0) throw new RangeError("Incompatible measured endpoints");
    // Solve the single-diode equation at (0, Jsc) and (Voc, 0), using assumed resistances.
    const j0 = numerator / (Math.exp(u / a) * Math.expm1((v - u) / a));
    const jph = j0 * Math.expm1(v / a) + v * g;
    if (!Number.isFinite(j0) || j0 <= 0) throw new RangeError("Invalid endpoint calibration");
    return validate({voc: a * Math.log1p(jph / j0), jph: jph * 1000, ...assumptions});
  }
  function idealityFromSlope(slopeMv, temperature, base = "log10") {
    if (!Number.isFinite(slopeMv) || slopeMv <= 0) throw new RangeError("Slope must be positive");
    if (!Number.isFinite(temperature) || temperature < 200 || temperature > 400) throw new RangeError("Invalid temperature");
    if (!["ln", "log10"].includes(base)) throw new RangeError("Invalid logarithm base");
    return slopeMv / (1000 * KB * temperature / Q * (base === "log10" ? Math.LN10 : 1));
  }
  function fitSunsVoc(text, temperature) {
    if (typeof text !== "string" || text.length > 2e6) throw new RangeError("Invalid Suns–Voc data");
    const lines = text.trim().split(/\r?\n/).map(line => line.trim()).filter(Boolean);
    if (/^(sun[s]?|intensity|lichtintensität|光强)[ \t,;]+v_?oc(?:\s*\(v\))?$/i.test(lines[0])) lines.shift();
    if (lines.length < 2 || lines.length > 20000) throw new RangeError("Invalid Suns–Voc point count");
    const numeric = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i;
    const points = lines.map(line => {
      const cells = (/[,\t;]/.test(line) ? line.split(/[,\t;]/) : line.split(/\s+/)).map(cell => cell.trim());
      if (cells.length !== 2 || !cells.every(cell => numeric.test(cell))) throw new RangeError("Invalid Suns–Voc columns");
      const [intensity, voc] = cells.map(Number);
      if (!Number.isFinite(intensity) || intensity <= 0 || !Number.isFinite(voc) || voc <= 0) {
        throw new RangeError("Intensity and Voc must be positive");
      }
      return [Math.log(intensity), voc];
    }).sort((a, b) => a[0] - b[0]);
    const count = points.length;
    const meanX = points.reduce((sum, [x]) => sum + x, 0) / count;
    const meanV = points.reduce((sum, [, v]) => sum + v, 0) / count;
    let xx = 0, xv = 0, vv = 0;
    for (const [x, v] of points) {
      xx += (x - meanX) ** 2;
      xv += (x - meanX) * (v - meanV);
      vv += (v - meanV) ** 2;
    }
    const slopeMv = 1000 * xv / xx;
    const n = idealityFromSlope(slopeMv, temperature, "ln");
    const r2 = Math.min(1, (xv / xx) * (xv / vv));
    const nonmonotonic = points.some(([x, v], i) => i > 0 && x > points[i - 1][0] && v < points[i - 1][1]);
    return {n, slopeMv, r2, count, nonmonotonic};
  }
  function fitMeasuredIdeality(measured, {temperature, rs, rsh, pin, idealityMode = "classic"}) {
    const stepsPerUnit = 1000;
    const [lowerStep, upperStep] = idealityRange(idealityMode).map(n => Math.round(n * stepsPerUnit));
    const points = measured.points.filter(([voltage]) => voltage > 0 && voltage < measured.voc);
    if (points.length < 3) throw new RangeError("The scan needs at least three interior J–V points");

    // Match the measured endpoints at each trial n and minimize current-density
    // residuals over the measured power-generating region at fixed Rs, Rsh and T.
    let best;
    function score(step) {
      const n = step / stepsPerUnit;
      let parameters;
      try {
        parameters = fromMeasured(measured, {n, temperature, rs, rsh, pin, idealityMode});
      } catch (error) {
        if (error instanceof RangeError) return Infinity;
        throw error;
      }
      const {currentAt} = model(parameters, {sampleCurve: false});
      const squaredError = points.reduce((sum, [v, j]) => sum + (1000 * currentAt(v) - j) ** 2, 0);
      if (Number.isFinite(squaredError) && (!best || squaredError < best.squaredError)) {
        best = {parameters, squaredError, step};
      }
      return squaredError;
    }
    // Search at the same 0.001 resolution used by the model n input.
    const coarseStep = Math.ceil((upperStep - lowerStep) / 20);
    for (let step = lowerStep; step < upperStep; step += coarseStep) score(step);
    score(upperStep);
    if (!best) throw new RangeError("No model in the selected n range fits the measured endpoints");

    let lo = Math.max(lowerStep, best.step - coarseStep);
    let hi = Math.min(upperStep, best.step + coarseStep);
    while (hi - lo > 4) {
      const offset = Math.floor((hi - lo) / 3);
      if (score(lo + offset) <= score(hi - offset)) hi -= offset;
      else lo += offset;
    }
    for (let step = lo; step <= hi; step++) score(step);
    const {parameters, squaredError, step} = best;
    return {parameters, rmse: Math.sqrt(squaredError / points.length), count: points.length,
      atLimit: step === lowerStep || step === upperStep};
  }
  function targetFF(p, targetPercent) {
    validate(p);
    if (!Number.isFinite(targetPercent) || targetPercent < 50 || targetPercent > 99.99) throw new RangeError("Target FF must be 50–99.99%");
    const target = targetPercent / 100;
    const ffAt = changes => model({...p, ...changes}, {sampleCurve: false}).ff;
    const idealFF = ffAt({rs: 0, rsh: Infinity});
    const bisect = (lo, hi, keepLower) => {
      for (let i = 0; i < 38; i++) {
        const mid = (lo + hi) / 2;
        if (keepLower(mid)) lo = mid; else hi = mid;
      }
      return (lo + hi) / 2;
    };
    // These are conditional model bounds, not a fit or a unique resistance pair.
    const idealAtN = n => ffAt({n, rs: 0, rsh: Infinity});
    const [lowerN, upperN] = idealityRange(p.idealityMode);
    let maxN;
    if (idealAtN(lowerN) < target) maxN = {status: "below_range", value: lowerN};
    else if (idealAtN(upperN) >= target) maxN = {status: "at_least", value: upperN};
    else maxN = {status: "bound", value: bisect(lowerN, upperN, n => idealAtN(n) >= target)};
    if (target > idealFF + 1e-12) return {targetPercent, idealFF, status: "above_ideal", maxN, maxRs: null, minRsh: null};
    let maxRs, minRsh;
    if (ffAt({rs: 0}) < target - 1e-12) maxRs = {status: "blocked_by_shunt"};
    else if (ffAt({rs: limits.rs[1]}) >= target) maxRs = {status: "at_least", value: limits.rs[1]};
    else maxRs = {status: "bound", value: bisect(0, limits.rs[1], rs => ffAt({rs}) >= target)};
    const withoutLeakage = ffAt({rsh: Infinity});
    if (withoutLeakage < target - 1e-12) minRsh = {status: "blocked_by_series"};
    else if (Math.abs(withoutLeakage - target) < 1e-12) minRsh = {status: "infinite", value: Infinity};
    else if (ffAt({rsh: limits.rsh[0]}) >= target) minRsh = {status: "at_most", value: limits.rsh[0]};
    else if (ffAt({rsh: limits.rsh[1]}) < target) minRsh = {status: "above_range", value: limits.rsh[1]};
    else minRsh = {status: "bound", value: 10 ** bisect(1, 6, logR => ffAt({rsh: 10 ** logR}) < target)};
    return {targetPercent, idealFF, status: "within_ideal", maxN, maxRs, minRsh};
  }
  const areaLimits = [1e-6, 1e4];
  function deviceValues(result, area) {
    if (!Number.isFinite(area) || area < areaLimits[0] || area > areaLimits[1]) throw new RangeError("Active area must be 0.000001–10000 cm²");
    // Uniform single-cell conversion: I = J A, P = p A and R_device = R_area / A.
    const p = result.parameters;
    return {area, isc: result.jsc * area, imp: result.jmp * area, pmax: result.pmax * area,
      incidentPower: p.pin * area / 1000, rs: p.rs / area, rsh: p.rsh / area};
  }
  const api = {model, compare, fromMeasured, validate, limits, idealityRange, idealityFromSlope,
    fitSunsVoc, fitMeasuredIdeality, targetFF, areaLimits, deviceValues};
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.SolarResistance = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
