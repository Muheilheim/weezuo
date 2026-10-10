/* PL-derived QFLS/q in the Boltzmann approximation; currents use A/cm² internally. */
(function (root) {
  "use strict";
  const KB = 1.380649e-23, Q = 1.602176634e-19;
  function calculate(p) {
    if (!Number.isFinite(p.temperature) || p.temperature <= 0) throw Error("Enter a positive temperature in kelvin.");
    if (!["reference", "relative", "absolute"].includes(p.mode)) throw Error("Choose a PL calibration method.");
    const thermal = KB * p.temperature / Q;
    let voltage = null, delta = null, nonradiativeLoss = null, logRatio;
    if (p.mode === "absolute") {
      if (!Number.isFinite(p.plqy) || p.plqy <= 0 || p.plqy > 100) throw Error("External PLQY must be greater than 0 and at most 100%.");
      if (!Number.isFinite(p.generation) || p.generation <= 0) throw Error("Enter a positive photogenerated current density in mA/cm².");
      if (!Number.isFinite(p.j0rad) || p.j0rad <= 0) throw Error("Enter a positive radiative dark current density in A/cm².");
      // Separate logarithms avoid overflow or underflow in the current ratio.
      logRatio = (Math.log(p.plqy) - Math.log(100)) + Math.log(p.generation) - Math.log(1000) - Math.log(p.j0rad);
      voltage = thermal * logRatio;
      nonradiativeLoss = -thermal * (Math.log(p.plqy) - Math.log(100));
    } else {
      if (!Number.isFinite(p.background) || p.background < 0) throw Error("Enter a finite, nonnegative PL background.");
      if (![p.intensity, p.referenceIntensity].every(v => Number.isFinite(v) && v > p.background)) throw Error("Both PL intensities must be finite and greater than the background.");
      logRatio = Math.log(p.intensity - p.background) - Math.log(p.referenceIntensity - p.background);
      delta = thermal * logRatio;
      if (p.mode === "reference") {
        if (!Number.isFinite(p.referenceVoltage) || p.referenceVoltage < 0) throw Error("Enter a finite, nonnegative internal reference voltage.");
        voltage = p.referenceVoltage + delta;
      }
    }
    if (p.mode !== "relative" && p.terminalVoltage !== null && p.terminalVoltage !== undefined && !Number.isFinite(p.terminalVoltage)) throw Error("Enter a finite terminal voltage or leave it blank.");
    const difference = p.mode !== "relative" && Number.isFinite(p.terminalVoltage) ? voltage - p.terminalVoltage : null;
    if (![thermal, voltage, delta, nonradiativeLoss, difference].every(v => v === null || Number.isFinite(v))) throw Error("The inputs exceed the numerical range.");
    return {voltage, qfls: voltage, delta, nonradiativeLoss, difference, thermal, perDecade: thermal * Math.LN10, logRatio};
  }
  function curve(p) {
    const result = calculate(p), relative = p.mode === "relative";
    const slope = result.thermal * Math.LN10 * (relative ? 1000 : 1);
    const measuredLog = p.mode === "absolute" ? Math.log10(p.plqy) : Math.log10(p.intensity - p.background);
    const referenceLog = p.mode === "absolute" ? 0 : Math.log10(p.referenceIntensity - p.background);
    const base = p.mode === "absolute" ? result.voltage - slope * measuredLog : (relative ? 0 : p.referenceVoltage) - slope * referenceLog;
    const minLog = p.mode === "absolute" ? Math.min(-6, Math.floor(measuredLog)) : Math.min(referenceLog - 3, Math.floor(measuredLog));
    const maxLog = p.mode === "absolute" ? 2 : Math.max(referenceLog + 1, Math.ceil(measuredLog));
    const points = Array.from({length:81}, (_, i) => {
      const logPL = minLog + (maxLog - minLog) * i / 80;
      return [logPL, base + slope * logPL];
    });
    if (!points.every(point => point.every(Number.isFinite)) || !(points.at(-1)[1] > points[0][1])) throw Error("The inputs exceed the numerical range.");
    return {base, slope, minLog, maxLog, measuredLog, measuredValue:base + slope * measuredLog, points};
  }
  function parseSpectra(text) {
    if (typeof text !== "string" || text.length > 2000000) throw Error("Use a PL text file smaller than 2 MB.");
    const numeric = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i;
    const points = []; let names = null, delimiter = null, width = 0;
    for (const raw of text.replace(/^\uFEFF/, "").split(/\r?\n/)) {
      const line = raw.trim(); if (!line || line.startsWith("#")) continue;
      if (delimiter === null) delimiter = line.includes("\t") ? "\t" : line.includes(";") ? ";" : line.includes(",") ? "," : " ";
      let cells;
      if (delimiter === " ") cells = line.split(/\s+/);
      else {
        cells = []; let cell = "", quoted = false;
        for (let i = 0; i < line.length; i++) {
          if (line[i] === '"') {
            if (quoted && line[i + 1] === '"') { cell += '"'; i++; } else quoted = !quoted;
          } else if (line[i] === delimiter && !quoted) { cells.push(cell.trim()); cell = ""; }
          else cell += line[i];
        }
        if (quoted) throw Error("PL data contains an unclosed quote.");
        cells.push(cell.trim());
      }
      if (!width) {
        width = cells.length;
        if (width < 2 || width > 101) throw Error("Use one wavelength column and 1–100 PL intensity columns.");
        if (!numeric.test(cells[0])) {
          if (!/wavelength|lambda|波长|wellenl/i.test(cells[0]) || /eV|energy|time|时间|[uµμ]m/i.test(cells[0])) throw Error("The first column must be wavelength in nm, not time or energy.");
          names = cells.slice(1);
          if (names.some(name => !name || name.length > 120) || new Set(names).size !== names.length) throw Error("PL column names must be nonempty, unique and at most 120 characters.");
          continue;
        }
      }
      if (cells.length !== width || cells.some(cell => !numeric.test(cell) || !Number.isFinite(Number(cell)))) throw Error("Every PL row must contain the same number of finite numeric columns. Use a decimal point.");
      const row = cells.map(Number);
      if (row[0] <= 0 || row[0] > 100000) throw Error("PL wavelengths must be positive and in nm.");
      points.push(row);
      if (points.length > 20000) throw Error("Use at most 20,000 PL wavelength rows.");
    }
    if (points.length < 2) throw Error("Enter at least two wavelength rows for each PL spectrum.");
    const sorted = points.some((row, i) => i && row[0] < points[i - 1][0]);
    points.sort((a, b) => a[0] - b[0]);
    if (points.some((row, i) => i && row[0] === points[i - 1][0])) throw Error("Duplicate PL wavelengths: resolve duplicates before integrating.");
    return {points, sorted, names:names || Array.from({length:width - 1}, (_, i) => "Spectrum " + (i + 1))};
  }
  function integrateSpectra(data, lo, hi) {
    if (![lo, hi].every(Number.isFinite) || lo < data.points[0][0] || hi > data.points.at(-1)[0] || hi <= lo) throw Error("Choose an increasing integration interval within the uploaded wavelength range.");
    const integrals = data.names.map(() => 0);
    for (let i = 1; i < data.points.length; i++) {
      const a = data.points[i - 1], b = data.points[i], left = Math.max(lo, a[0]), right = Math.min(hi, b[0]);
      if (right <= left) continue;
      const t0 = (left - a[0]) / (b[0] - a[0]), t1 = (right - a[0]) / (b[0] - a[0]);
      for (let j = 0; j < integrals.length; j++) {
        const y0 = a[j + 1] * (1 - t0) + b[j + 1] * t0, y1 = a[j + 1] * (1 - t1) + b[j + 1] * t1;
        integrals[j] += (y0 / 2 + y1 / 2) * (right - left);
      }
    }
    if (!integrals.every(Number.isFinite)) throw Error("The inputs exceed the numerical range.");
    return integrals;
  }
  const api = {calculate, curve, parseSpectra, integrateSpectra};
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.PLVoltage = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
