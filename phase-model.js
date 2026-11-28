/* Data import, peak detection and reference matching for the spectroscopy workspace. */
(function (global) {
  "use strict";

  const MAX_LINES = 120000;
  const defaults = {
    xrd: {tolerance: 0.18, threshold: 4, wavelength: 1.5406, substrate: "auto"},
    ftir: {tolerance: 8, threshold: 5, ordinate: "absorbance"},
    raman: {tolerance: 3, threshold: 4, laser: ""}
  };
  const numberPattern = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i;

  function value(token, decimalComma) {
    let input = token.trim().replace(/^"([^"]*)"$/, "$1").replace(/\u2212/g, "-");
    if (decimalComma) input = input.replace(",", ".");
    return numberPattern.test(input) ? Number(input) : NaN;
  }

  function split(line) {
    if (line.includes("\t")) return [line.split("\t"), true, "tab"];
    if (line.includes(";")) return [line.split(";"), true, "semicolon"];
    if (line.includes(",")) {
      // A whitespace-separated decimal-comma pair is unambiguous.
      const words = line.split(/\s+/);
      if (words.length >= 2 && words.every(word => /^[-+]?\d+,\d+(?:e[-+]?\d+)?$/i.test(word))) {
        return [words, true, "space"];
      }
      return [line.split(","), false, "comma"];
    }
    return [line.split(/\s+/), false, "space"];
  }

  function readTable(text, widths = [2]) {
    if (text.length > 8 * 1024 * 1024) throw Error("sizeError");
    const rows = [];
    let delimiter, width;
    for (const lineText of text.replace(/^\uFEFF/, "").split(/\r\n|\r|\n/)) {
      const line = lineText.trim();
      if (!line || /^(?:#|\/\/|%)/.test(line)) continue;
      const [columns, commas, type] = split(line);
      const x = value(columns[0], commas);
      const row = columns.map(token => value(token, commas));
      if (!widths.includes(columns.length) || row.some(number => !Number.isFinite(number))) {
        if (delimiter || !Number.isNaN(x)) throw Error("formatError");
        continue;
      }
      if (delimiter && (type !== delimiter || width !== columns.length)) throw Error("delimiterError");
      if (row.some(number => Math.abs(number) > 1e15)) throw Error("axisError");
      delimiter = type;
      width = columns.length;
      rows.push(row);
      if (rows.length > MAX_LINES) throw Error("sizeError");
    }
    return rows;
  }

  function xrdDomain(x, axis) {
    return axis === "q" ? x >= 0 && x <= 100 : x >= 0 && x < 180;
  }

  function parse(text, mode, axis = "angle") {
    const rows = [];
    let direction = 0, repeats = 0, duplicateCount = 0;
    for (const [x, y] of readTable(text)) {
      const domain = mode === "xrd" ? xrdDomain(x, axis) :
        mode === "ftir" ? x > 0 && x <= 25000 : Math.abs(x) <= 20000;
      if (!domain) throw Error("axisError");
      const previous = rows.at(-1);
      const step = previous ? Math.sign(x - previous[0]) : 0;
      if (previous && !step) {
        repeats += 1;
        duplicateCount += 1;
        previous[1] += (y - previous[1]) / repeats;
        continue;
      }
      if (direction && step !== direction) throw Error("orderError");
      if (step) direction = step;
      rows.push([x, y]);
      repeats = 1;
    }
    if (rows.length < 5) throw Error("pointsError");
    if (direction < 0) rows.reverse();
    return {points: rows, duplicates: duplicateCount, direction};
  }

  function decode(buffer) {
    const bytes = new Uint8Array(buffer);
    if (bytes[0] === 0xff && bytes[1] === 0xfe) return new TextDecoder("utf-16le", {fatal: true}).decode(bytes);
    if (bytes[0] === 0xfe && bytes[1] === 0xff) return new TextDecoder("utf-16be", {fatal: true}).decode(bytes);
    try {
      return new TextDecoder("utf-8", {fatal: true}).decode(bytes);
    } catch {
      return new TextDecoder("gb18030", {fatal: true}).decode(bytes);
    }
  }

  async function readFile(file) {
    if (file.size > 8 * 1024 * 1024) throw Error("sizeError");
    return decode(await file.arrayBuffer());
  }

  function signal(points, mode, settings) {
    if (mode !== "ftir" || settings.ordinate !== "transmittance") return points.map(point => point[1]);
    if (points.some(point => point[1] <= 0)) throw Error("transmittanceError");
    return points.map(point => -Math.log10(point[1] / 100));
  }

  function baseline(values) {
    // Interpolate the lower quintile of each segment as a local background.
    const bins = Math.max(1, Math.min(24, Math.floor(values.length / 24)));
    const anchors = [];
    for (let b = 0; b < bins; b += 1) {
      const from = Math.floor(b * values.length / bins);
      const to = Math.floor((b + 1) * values.length / bins);
      const sorted = values.slice(from, to).sort((a, b) => a - b);
      anchors.push([(from + to - 1) / 2, sorted[Math.floor((sorted.length - 1) * 0.2)]]);
    }
    let next = 1;
    return values.map((raw, index) => {
      if (index <= anchors[0][0]) return anchors[0][1];
      while (next < anchors.length && index > anchors[next][0]) next += 1;
      if (next === anchors.length) return anchors.at(-1)[1];
      const [xa, ya] = anchors[next - 1];
      const [xb, yb] = anchors[next];
      return ya + (yb - ya) * (index - xa) / (xb - xa);
    });
  }

  function lowerBound(points, target) {
    let left = 0, right = points.length;
    while (left < right) {
      const mid = (left + right) >>> 1;
      if (points[mid][0] < target) left = mid + 1;
      else right = mid;
    }
    return left;
  }

  function detect(points, mode, settings) {
    const raw = signal(points, mode, settings);
    // Keep the plotted curve raw. A three-point filter is applied for detection.
    const smooth = raw.map((y, i) => (i > 0 && i < raw.length - 1 ? (raw[i - 1] + 2 * y + raw[i + 1]) / 4 : y));
    const bg = baseline(smooth);
    const corrected = smooth.map((y, i) => y - bg[i]);
    const maximum = corrected.reduce((max, y) => Math.max(max, y), 0);
    if (!(maximum > 0)) return {peaks: [], raw};
    const minimum = maximum * settings.threshold / 100;
    const radius = Math.max(settings.tolerance * 2.8, (points.at(-1)[0] - points[0][0]) * 0.024);
    const possibilities = [];
    for (let i = 1; i < corrected.length - 1; i += 1) {
      if (corrected[i] < minimum || corrected[i] < corrected[i - 1] || corrected[i] <= corrected[i + 1]) continue;
      const x = points[i][0];
      const flank = Math.max(8, Math.ceil(points.length / 15));
      const low = Math.max(0, i - flank, lowerBound(points, x - radius));
      const high = Math.min(points.length - 1, i + flank, lowerBound(points, x + radius));
      let left = corrected[i], right = corrected[i];
      for (let j = i - 1; j >= low; j -= 1) {
        left = Math.min(left, corrected[j]);
        if (corrected[j] > corrected[i]) break;
      }
      for (let j = i + 1; j <= high; j += 1) {
        right = Math.min(right, corrected[j]);
        if (corrected[j] > corrected[i]) break;
      }
      const prominence = corrected[i] - Math.max(left, right);
      if (prominence < Math.max(minimum * 0.5, maximum * 0.012)) continue;
      let apex = i;
      while (apex > 0 && corrected[apex - 1] === corrected[i]) apex -= 1;
      apex = Math.floor((apex + i) / 2);
      const [position, ordinate] = points[apex];
      possibilities.push({i: apex, x: position, y: ordinate, signal: raw[apex], height: corrected[i], prominence});
    }
    const peaks = [];
    const separation = settings.tolerance * 0.8;
    possibilities.sort((a, b) => b.prominence - a.prominence);
    for (const peak of possibilities) {
      if (peaks.every(existing => Math.abs(existing.x - peak.x) >= separation)) peaks.push(peak);
      if (peaks.length === 100) break;
    }
    peaks.sort((a, b) => a.x - b.x);
    return {peaks, raw};
  }

  function angleFromD(d, wavelength) {
    const sine = wavelength / (2 * d);
    return sine > 0 && sine < 1 ? 360 / Math.PI * Math.asin(sine) : NaN;
  }

  function spacing(x, wavelength, axis = "angle") {
    if (x <= 0) return NaN;
    return axis === "q" ? 2 * Math.PI / x : wavelength / (2 * Math.sin(x * Math.PI / 360));
  }

  function referenceLines(group, mode, settings) {
    return group.peaks.map(entry => {
      if (mode === "xrd") {
        const [d, intensity, label] = entry;
        const center = settings.axis === "d" ? d :
          settings.axis === "q" ? 2 * Math.PI / d : angleFromD(d, settings.wavelength);
        return {low: center, high: center, center, d, intensity, label, location: group.location, note: group.note};
      }
      const [low, high, center, label, location, note] = entry;
      return {low, high, center, label, location, note};
    }).filter(line => Number.isFinite(line.low));
  }

  function matchesForGroup(group, lines, peaks, min, max, tolerance) {
    const inRange = lines.filter(line => line.high >= min && line.low <= max);
    const edges = [];
    for (const line of inRange) {
      for (const peak of peaks) {
        const distance = Math.max(line.low - peak.x, peak.x - line.high, 0);
        if (distance <= tolerance) {
          const centerOffset = line.center == null ? null : peak.x - line.center;
          edges.push({line, peak, distance, centerOffset});
        }
      }
    }
    edges.sort((a, b) => a.distance - b.distance ||
      Math.abs(a.centerOffset ?? 0) - Math.abs(b.centerOffset ?? 0) ||
      b.peak.prominence - a.peak.prominence);
    const usedLines = new Set(), usedPeaks = new Set(), hits = [];
    for (const match of edges) {
      if (usedLines.has(match.line) || usedPeaks.has(match.peak)) continue;
      usedLines.add(match.line);
      usedPeaks.add(match.peak);
      hits.push(match);
    }
    const supporting = hits.filter(hit => !!group.substrate || !hit.peak.blank);
    const meanOffset = supporting.reduce((sum, hit) => sum + hit.distance, 0) / (supporting.length || 1);
    return {group, inRange, hits, supporting, meanOffset, outOfRange: lines.length - inRange.length};
  }

  function validGroup(group, mode, settings) {
    if (mode !== "xrd" || !group.substrate || settings.substrate === "auto") return true;
    return settings.substrate === group.substrate;
  }

  function identity(group, mode) {
    if (mode === "xrd") return group.substrate && group.substrate !== "other" ? group.substrate :
      group.name + "|" + (group.spaceGroup || group.model);
    return group.name;
  }

  function comparePeaks(peaks, blankPeaks, mode, settings, groups, min, max) {
    const byPeak = new Map();
    for (const peak of peaks) {
      peak.blank = !!blankPeaks?.some(item => Math.abs(item.x - peak.x) <= settings.tolerance);
      byPeak.set(peak, new Map());
    }
    const candidates = [];
    const pool = groups.filter(group => validGroup(group, mode, settings));
    for (const group of pool) {
      const lines = referenceLines(group, mode, settings);
      const candidate = matchesForGroup(group, lines, peaks, min, max, settings.tolerance);
      if (!candidate.hits.length) continue;
      candidates.push(candidate);
      for (const hit of candidate.hits) {
        const references = byPeak.get(hit.peak);
        const family = identity(group, mode);
        const existing = references.get(family);
        const item = {id: group.id, name: group.name, group, hit};
        if (!existing || hit.distance < existing.hit.distance) references.set(family, item);
      }
    }
    candidates.sort((a, b) => b.supporting.length - a.supporting.length ||
      b.supporting.length / b.inRange.length - a.supporting.length / a.inRange.length ||
      a.meanOffset - b.meanOffset);
    for (const peak of peaks) {
      peak.references = Array.from(byPeak.get(peak).values()).sort((a, b) => a.hit.distance - b.hit.distance);
      peak.status = peak.blank ? "blankOverlap" : peak.references.length > 1 ? "overlap" :
        peak.references.length ? "matched" : "unassigned";
    }
    return {candidates, groupCount: pool.length};
  }

  function analyze(points, blankPoints, mode, settings, groups) {
    const sample = detect(points, mode, settings);
    const blank = blankPoints ? detect(blankPoints, mode, settings) : null;
    const comparison = comparePeaks(sample.peaks, blank?.peaks, mode, settings, groups, points[0][0], points.at(-1)[0]);
    return {...sample, blank, ...comparison};
  }

  function compareSpacings(points, tolerance, groups) {
    const peaks = points.map(([x, y]) => ({x, y, prominence: y}));
    return {peaks, ...comparePeaks(peaks, null, "xrd", {axis: "d", tolerance, substrate: "auto"},
      groups, -Infinity, Infinity)};
  }

  const api = {defaults, parse, readTable, readFile, xrdDomain, analyze, compareSpacings, detect, spacing, lowerBound};
  if (typeof module === "object" && module.exports) module.exports = api;
  else global.PhaseModel = api;
})(typeof window === "undefined" ? globalThis : window);
