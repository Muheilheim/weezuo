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
  function model(parameters) {
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
      points: Array.from({length: 301}, (_, i) => {
        const v = voc * i / 300, j = i === 300 ? 0 : Math.max(0, currentAt(v));
        return {v, j, power: v * j};
      })};
  }
  function compare(p) {
    validate(p);
    const ideal = model({...p, rs: 0, rsh: Infinity});
    const series = model({...p, rsh: Infinity});
    const shunt = model({...p, rs: 0});
    const both = model(p);
    return {ideal, series, shunt, both};
  }
  const api = {model, compare, validate, limits};
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.SolarResistance = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
