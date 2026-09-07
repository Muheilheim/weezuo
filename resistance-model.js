/* Single-cell, area-normalized single-diode model. SI current density: A/cm2.
 * Reference Voc calibrates J0 at the selected n and T. It is not a temperature model.
 * See the linked Sandia PVPMC single-diode model in the calculator documentation.
 */
(function (root) {
  "use strict";
  const KB = 1.380649e-23, Q = 1.602176634e-19;
  const limits = {voc: [0.2, 2], jph: [1, 60], n: [1, 2], temperature: [200, 400], rs: [0, 50], rsh: [10, 1e6], pin: [10, 200]};
  function validate(p) {
    for (const key of Object.keys(limits)) {
      const value = p[key], bounds = limits[key];
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
  function idealityFromSlope(slopeMv, temperature, base = "log10") {
    if (!Number.isFinite(slopeMv) || slopeMv <= 0) throw new RangeError("Slope must be positive");
    if (!Number.isFinite(temperature) || temperature < 200 || temperature > 400) throw new RangeError("Invalid temperature");
    if (!["ln", "log10"].includes(base)) throw new RangeError("Invalid logarithm base");
    return slopeMv / (1000 * KB * temperature / Q * (base === "log10" ? Math.LN10 : 1));
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
    let maxN;
    if (idealAtN(1) < target) maxN = {status: "below_range", value: 1};
    else if (idealAtN(2) >= target) maxN = {status: "at_least", value: 2};
    else maxN = {status: "bound", value: bisect(1, 2, n => idealAtN(n) >= target)};
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
  const api = {model, compare, validate, limits, idealityFromSlope, targetFF};
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.SolarResistance = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
