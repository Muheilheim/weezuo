/* Numerical analysis for diffraction series, thermal traces and Pb 4f spectra. */
(function (global) {
  "use strict";
  const phase = typeof module === "object" && module.exports ? require("./phase-model.js") : global.PhaseModel;
  const wave = 1.5406;
  const models = {
    diffraction: {kind: "series", axis: "q", axisSeries: "seconds", wavelength: wave, substrate: "auto", tolerance: .015, traceAt: 1, traceWidth: .065},
    thermal: {kind: "dsc", low: "", high: "", units: "mW", mass: 5, ramp: 10, sign: "endoPositive"},
    xps: {kind: "two", low: 133, high: 147, correction: 0, centerA: 138.5, centerB: 137, split: 4.86},
    saed: {tolerance: .04}
  };

  function diffractionSettings(options) {
    return {...phase.defaults.xrd, axis: options.axis, wavelength: options.wavelength,
      tolerance: options.tolerance, substrate: options.substrate};
  }

  function parseDiffraction(text, settings) {
    if (settings.kind === "scan") return {frames: [{index: 0, points: phase.parse(text, "xrd", settings.axis).points}]};
    const grouped = new Map();
    for (const [frame, x, y] of phase.readTable(text, [3])) {
      if (!phase.xrdDomain(x, settings.axis)) throw Error("axisError");
      if (!grouped.has(frame)) grouped.set(frame, []);
      grouped.get(frame).push([x, y]);
      if (grouped.size > 250) throw Error("frameLimit");
    }
    if (grouped.size < 2) throw Error("framesError");
    const frames = Array.from(grouped, ([index, points]) => {
      points.sort((a, b) => a[0] - b[0]);
      if (points.length < 5) throw Error("framePoints");
      if (points.some(([x], i) => i > 0 && x === points[i - 1][0])) throw Error("duplicateFrameX");
      return {index, points};
    }).sort((a, b) => a.index - b.index);
    return {frames};
  }

  function parseSpacings(text) {
    const rows = phase.readTable(text, [1, 2]);
    if (rows.some(([d, y]) => d <= 0 || d > 1000 || (y !== undefined && y < 0))) throw Error("spacingError");
    const points = Array.from(new Map(rows.map(([d, y]) => [d, y ?? 1]))).sort((a, b) => a[0] - b[0]);
    if (points.length < 2) throw Error("spacingCount");
    if (points.length > 100) throw Error("spacingLimit");
    return {points, intensities: rows[0].length === 2};
  }

  function track(frames, options) {
    const settings = diffractionSettings(options);
    return frames.map(({index, points}) => {
      const {peaks} = phase.detect(points, "xrd", settings);
      const match = peaks.filter(peak => Math.abs(peak.x - options.traceAt) <= options.traceWidth)
        .sort((a, b) => b.prominence - a.prominence)[0];
      return {index, match};
    });
  }

  function heatmap(frames, width = 320) {
    const left = frames.reduce((x, frame) => Math.min(x, frame.points[0][0]), Infinity);
    const right = frames.reduce((x, frame) => Math.max(x, frame.points.at(-1)[0]), -Infinity);
    let low = Infinity, high = -Infinity;
    const rows = frames.map(frame => {
      const points = frame.points;
      for (const [, y] of points) {
        low = Math.min(low, y);
        high = Math.max(high, y);
      }
      let at = 0;
      return Array.from({length: width}, (_, i) => {
        const x = left + (right - left) * i / (width - 1);
        if (x < points[0][0] || x > points.at(-1)[0]) return null;
        while (at + 1 < points.length - 1 && points[at + 1][0] < x) at += 1;
        const [x0, y0] = points[at], [x1, y1] = points[at + 1];
        return y0 + (y1 - y0) * (x - x0) / (x1 - x0);
      });
    });
    return {left, right, low, high, rows};
  }

  function interval(points, low, high, count) {
    const left = low === "" ? points[0][0] : low;
    const right = high === "" ? points.at(-1)[0] : high;
    if (!Number.isFinite(left) || !Number.isFinite(right) || left >= right) throw Error("intervalError");
    const selected = points.filter(([x]) => x >= left && x <= right);
    if (selected.length < count) throw Error("intervalPoints");
    return selected;
  }

  function averages(points) {
    const [x, y] = points.reduce(([a, b], [position, value]) => [a + position, b + value], [0, 0]);
    return [x / points.length, y / points.length];
  }

  function fitBaseline(points) {
    const count = Math.max(1, Math.min(20, Math.floor(points.length * .045)));
    const [x0, y0] = averages(points.slice(0, count));
    const [x1, y1] = averages(points.slice(-count));
    return x => y0 + (x - x0) * (y1 - y0) / (x1 - x0);
  }

  function area(points) {
    let total = 0;
    for (let i = 1; i < points.length; i += 1) {
      total += (points[i][0] - points[i - 1][0]) * (points[i][1] + points[i - 1][1]) / 2;
    }
    return total;
  }

  function dsc(input, settings) {
    const {points, direction} = input;
    const scan = interval(points, settings.low, settings.high, 5);
    const baseline = fitBaseline(scan);
    const correction = scan.map(([t, y]) => [t, y - baseline(t)]);
    const sign = settings.sign === "endoPositive" ? 1 : -1;
    const scale = settings.units === "Wg" ? 1 : settings.mass > 0 ? 1 / settings.mass : null;
    let peakIndex = 0;
    for (let i = 1; i < correction.length; i += 1) {
      if (Math.abs(correction[i][1]) > Math.abs(correction[peakIndex][1])) peakIndex = i;
    }
    const [peakX, peakY] = correction[peakIndex];
    let onset = null, strongest = 0;
    for (let i = 1; i < correction.length - 1; i += 1) {
      if (direction * (i - peakIndex) >= 0 || peakY === 0) continue;
      const slope = (correction[i + 1][1] - correction[i - 1][1]) / (correction[i + 1][0] - correction[i - 1][0]);
      const strength = direction * Math.sign(peakY) * slope;
      if (strength > strongest) {
        strongest = strength;
        const intercept = correction[i][0] - correction[i][1] / slope;
        onset = intercept >= scan[0][0] && intercept <= scan.at(-1)[0] &&
          direction * (intercept - peakX) < 0 ? intercept : null;
      }
    }
    if (peakIndex === 0 || peakIndex === scan.length - 1) onset = null;
    return {scan, baseline: scan.map(([x]) => [x, baseline(x)]),
      corrected: correction, peak: {x: peakX, y: scan[peakIndex][1], prominence: Math.abs(peakY)},
      interiorPeak: peakY !== 0 && peakIndex > 0 && peakIndex < scan.length - 1, onset,
      enthalpy: scale === null || !(settings.ramp > 0) ? null : area(correction) * scale * sign * 60 / settings.ramp,
      kind: peakY * sign > 0 ? "endo" : peakY * sign < 0 ? "exo" : null};
  }

  function tga(input, settings) {
    const {points, direction} = input;
    if (points.some(([, mass]) => mass < 0)) throw Error("massError");
    const initial = (direction > 0 ? points[0] : points.at(-1))[1];
    if (initial <= 0) throw Error("massError");
    const scale = settings.units === "mg" ? 100 / initial : 1;
    const scan = interval(points, settings.low, settings.high, 5);
    const curve = scan.map(([x, y]) => [x, y * scale]);
    const radius = Math.min(6, Math.max(1, Math.round(curve.length / 350)));
    const dtg = curve.map(([x], i) => {
      const first = curve[Math.max(0, i - radius)], last = curve[Math.min(curve.length - 1, i + radius)];
      return [x, (last[1] - first[1]) / (last[0] - first[0])];
    });
    const losses = dtg.map(([, slope]) => -direction * slope);
    const max = losses.reduce((best, loss) => Math.max(best, loss), 0);
    const stages = [];
    if (max > 0) {
      const threshold = max * .08;
      let first = -1, apex = -1;
      for (let i = 0; i <= losses.length; i += 1) {
        if (losses[i] >= threshold) {
          if (first < 0) first = apex = i;
          if (losses[i] > losses[apex]) apex = i;
        } else if (first >= 0) {
          const a = Math.max(0, first - 1), b = Math.min(curve.length - 1, i);
          if (b > a) stages.push({from: curve[a][0], to: curve[b][0], peak: curve[apex][0],
            rate: dtg[apex][1], loss: direction * (curve[a][1] - curve[b][1])});
          first = apex = -1;
        }
      }
    }
    if (direction < 0) stages.reverse();
    return {scan, curve, dtg, stages, loss: direction * (curve[0][1] - curve.at(-1)[1])};
  }

  function profile(x, center, width) {
    const k = (2 * (x - center) / width) ** 2;
    return .66 * Math.exp(-Math.LN2 * k) + .34 / (1 + k);
  }

  function doublet(x, center, width, split) {
    return profile(x, center, width) + .75 * profile(x, center + split, width);
  }

  function evaluateFit(points, cA, cB, width, split) {
    let aa = 0, bb = 0, ab = 0, ay = 0, by = 0, yy = 0;
    for (const [x, value] of points) {
      const a = doublet(x, cA, width, split);
      const b = cB == null ? 0 : doublet(x, cB, width, split);
      aa += a * a;
      bb += b * b;
      ab += a * b;
      ay += a * value;
      by += b * value;
      yy += value * value;
    }
    let best = {a: 0, b: 0, sse: yy};
    function use(a, b) {
      if (a < 0 || b < 0) return;
      const sse = Math.max(0, yy + a * a * aa + b * b * bb + 2 * a * b * ab - 2 * (a * ay + b * by));
      if (sse < best.sse) best = {a, b, sse};
    }
    if (aa > 0) use(ay / aa, 0);
    if (bb > 0) use(0, by / bb);
    const det = aa * bb - ab * ab;
    if (det > aa * bb * 1e-8) use((ay * bb - by * ab) / det, (by * aa - ay * ab) / det);
    return {...best, cA, cB, width};
  }

  function fitXps(input, settings) {
    const adjusted = input.points.map(([energy, y]) => [energy + settings.correction, y]);
    const points = interval(adjusted, settings.low, settings.high, 24);
    const two = settings.kind === "two";
    const centers = two ? [settings.centerA, settings.centerB] : [settings.centerA];
    if (settings.split < 1 || (two && Math.abs(centers[0] - centers[1]) < .50) ||
        Math.min(...centers) - .50 < points[0][0] ||
        Math.max(...centers) + settings.split + .50 > points.at(-1)[0]) throw Error("xpsWindow");
    const baselineAt = fitBaseline(points);
    const centered = points.map(([x, y]) => [x, y - baselineAt(x)]);
    const stride = Math.max(1, Math.floor(points.length / 1400));
    const work = centered.filter((_, i) => i % stride === 0);
    let best = null;
    function trial(cA, cB, width) {
      if (width < .35 || width > 2.50 || Math.abs(cA - centers[0]) > .43 ||
          (cB != null && (Math.abs(cB - centers[1]) > .43 ||
            Math.sign(cB - cA) !== Math.sign(centers[1] - centers[0]) || Math.abs(cA - cB) < .34))) return;
      const candidate = evaluateFit(work, cA, cB, width, settings.split);
      if (!best || candidate.sse < best.sse) best = candidate;
    }
    for (const a of [-.25, 0, .25]) {
      for (const b of two ? [-.25, 0, .25] : [null]) {
        for (const width of [.55, .80, 1.15, 1.55, 2.05]) {
          trial(centers[0] + a, b == null ? null : centers[1] + b, width);
        }
      }
    }
    for (const step of [.12, .06, .03, .015, .0075]) {
      const {cA, cB, width} = best;
      for (const a of [-step, 0, step]) {
        for (const b of two ? [-step, 0, step] : [0]) {
          for (const w of [-step, 0, step]) trial(cA + a, two ? cB + b : null, width + w);
        }
      }
    }
    const {cA, cB, width} = best;
    const amplitudes = evaluateFit(centered, cA, cB, width, settings.split);
    const baseline = [], fitted = [], residual = [], aCurve = [], bCurve = [], aSignal = [], bSignal = [];
    let ss = 0, sum = 0;
    for (const [x, y] of points) {
      const base = baselineAt(x);
      const a = amplitudes.a * doublet(x, cA, width, settings.split);
      const b = two ? amplitudes.b * doublet(x, cB, width, settings.split) : 0;
      const fit = base + a + b;
      const diff = y - fit;
      baseline.push([x, base]);
      fitted.push([x, fit]);
      residual.push([x, diff]);
      aCurve.push([x, base + a]);
      aSignal.push([x, a]);
      if (two) {
        bCurve.push([x, base + b]);
        bSignal.push([x, b]);
      }
      ss += diff * diff;
      sum += y;
    }
    const mean = sum / points.length;
    const total = points.reduce((value, [,y]) => value + (y - mean) ** 2, 0);
    const components = [{center: cA, partner: cA + settings.split, area: area(aSignal), width, amplitude: amplitudes.a}];
    if (two) components.push({center: cB, partner: cB + settings.split, area: area(bSignal), width, amplitude: amplitudes.b});
    return {points, baseline, fitted, residual, aCurve, bCurve, components,
      rmse: Math.sqrt(ss / points.length), r2: total > 0 ? 1 - ss / total : null};
  }

  const gaussian = (x, center, width) => Math.exp(-.5 * ((x - center) / width) ** 2);
  function demo(mode, settings) {
    if (mode === "thermal") {
      const isDsc = settings.kind === "dsc";
      const points = Array.from({length: 441}, (_, i) => {
        const x = isDsc ? 30 + i * .30 : 35 + i * .9;
        const mass = 100 - 7.5 / (1 + Math.exp((112 - x) / 4.8)) - 16 / (1 + Math.exp((265 - x) / 7.1));
        let y = isDsc ? .19 + i * .00051 + 1.84 * gaussian(x, 99, 6.5) : mass;
        if (isDsc && settings.units === "Wg") y /= settings.mass;
        if (isDsc && settings.sign === "exoPositive") y *= -1;
        if (!isDsc && settings.units === "mg") y *= .082;
        return [x, y];
      });
      return {points, direction: 1};
    }
    if (mode === "xps") {
      const points = Array.from({length: 501}, (_, i) => {
        const x = 132 + i * .034;
        const y = 130 + 4 * (x - 132) + 2000 * doublet(x, 138.52, .88, 4.86) +
          415 * doublet(x, 137.04, .88, 4.86) + 7 * Math.sin(i * 1.71);
        return [x, y];
      });
      return {points, direction: 1};
    }
    throw Error("noSamplePreset");
  }

  const api = {models, parseDiffraction, parseSpacings, diffractionSettings, track, heatmap, dsc, tga, fitXps, demo};
  if (typeof module === "object" && module.exports) module.exports = api;
  else global.PhaseExtraModel = api;
})(typeof window === "undefined" ? globalThis : window);
