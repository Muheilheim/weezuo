/* Composition presets mirror drawing.html. Diffraction and band examples use cited library entries. */
(function (global) {
  "use strict";

  const materials = [
    {key:"CsPbBr3", label:"CsPbBr₃", drawing:"Cs|Pb|Br", lead:true,
      phases:[["B09","ortho"],["B10","tetragonalQD"],["B11","cubic"],["B13","monoclinic"]]},
    {key:"CsPbI3", label:"CsPbI₃", drawing:"Cs|Pb|I", lead:true,
      phases:[["I12","blackGamma"],["I10","hotAlpha"],["I11","beta"],["I13","yellowDelta"]]},
    {key:"CsSnI3", label:"CsSnI₃", drawing:"Cs|Sn|I", lead:false,
      phases:[["S10","tinGamma"],["S08","tinAlpha"],["S09","tinBeta"],["S11","yellowChain"]]},
    {key:"MAPbI3", label:"MAPbI₃", drawing:"MA|Pb|I", lead:true,
      phases:[["I02","roomTetragonal"],["I01","hotAlpha"],["I04","lowGamma"]]},
    {key:"FAPbI3", label:"FAPbI₃", drawing:"FA|Pb|I", lead:true,
      phases:[["I05","blackAlpha"],["I081","hexDelta"],["I06","lowBeta"]]},
    {key:"SrTiO3", label:"SrTiO₃", drawing:"Sr|Ti|O", lead:false, phases:[["O01","cubic"]]},
    {key:"mixed", labelKey:"mixedPreset", drawing:"mixed", lead:true, phases:[["M18","mixedRecorded"]]},
    {key:"custom", labelKey:"customPreset", drawing:"", lead:false, phases:[]}
  ];

  const ftir = {
    I05: {
      ref:"ftir-47", range:[1250,1850], heights:[1,.26,.56],
      label:"harisFigure", url:"https://pmc.ncbi.nlm.nih.gov/articles/PMC10030310/#fig1"
    },
    I081: {ref:"ftir-48", range:[1500,1860], label:"ftirPressure"},
    I02: {ref:"ftir-60", range:[840,1680], label:"mapbFtir", compositionOnly:true}
  };
  const raman = {
    B09: {ref:"raman-2", range:[30,125], label:"brRaman"},
    I12: {ref:"raman-7", range:[35,280], label:"gammaRaman"},
    I13: {ref:"raman-3", range:[30,135], label:"deltaCsRaman"},
    I081: {ref:"raman-1", range:[24,145], label:"deltaFaRaman"},
    I02: {ref:"raman-9", range:[65,480], label:"mapbRaman", compositionOnly:true}
  };

  function choose(key, phase) {
    const material = materials.find(item => item.key === key) ?? materials[4];
    const [ref, description] = material.phases.find(item => item[0] === phase) ?? material.phases[0] ?? [];
    return {material, ref, description, id: material.key + "/" + (ref ?? "")};
  }

  function evidence(mode, selected, library, kind) {
    if (!selected.ref) return null;
    if (mode === "thermal") return {type:"method", label:kind === "tga" ? "tgaDemoLabel" : "dscDemoLabel",
      citation:kind === "tga" ? "tgaSource" : "dscSource",
      url:kind === "tga" ? "https://goldbook.iupac.org/terms/view/T06324" : "https://goldbook.iupac.org/terms/view/D01708"};
    if (mode === "xps") return selected.material.lead ? {type:"method", label:"xpsDemoLabel", citation:"xpsConstraints",
      url:"https://doi.org/10.1063/5.0086359"} : null;
    const band = mode === "ftir" || mode === "raman";
    const rule = band ? (mode === "ftir" ? ftir : raman)[selected.ref] : null;
    const group = (band ? library[mode] : library.xrd).find(g => g.id === (band ? rule?.ref : selected.ref));
    if (!group) return null;
    const peaks = band ? group.peaks.filter(row =>
      row[2] != null && row[2] >= rule.range[0] && row[2] <= rule.range[1]) : group.peaks;
    if (!peaks.length) return null;
    return {group, peaks, type:band ? "band" : "structure", ...rule,
      url:rule?.url || group.url, citation:rule?.label || "structureSource"};
  }

  function spacingX(d, axis, wavelength) {
    if (axis === "q") return 2 * Math.PI / d;
    return 360 / Math.PI * Math.asin(wavelength / (2 * d));
  }

  function diffractionLines(group, axis, wavelength) {
    const max = axis === "q" ? 5.1 : 78;
    return group.peaks.map(([d, intensity], i) => {
      const x = spacingX(d, axis, wavelength);
      const weight = intensity == null ? [1,.48,.66,.34,.42,.3][i % 6] : Math.pow(Math.max(0, intensity) / 100, .62);
      return [x, weight, axis === "q" ? .009 : .086];
    }).filter(([x]) => Number.isFinite(x) && x >= 0 && x <= max).sort((a,b)=>a[0]-b[0]);
  }

  function shape(lines, lo, hi, size, scale, gain = 1) {
    return Array.from({length:size}, (_, index) => {
      const x = lo + (hi - lo) * index / (size - 1);
      const y = lines.reduce((level, [center, weight, width]) =>
        level + gain * weight * Math.exp(-.5 * ((x - center) / width) ** 2), .025 + .004 * index / (size - 1));
      return [Number(x.toFixed(7)), Number((y * scale).toFixed(8))];
    });
  }

  function primary(mode, selected, library, settings) {
    const source = evidence(mode, selected, library);
    if (!source) return null;
    if (mode === "xrd") {
      const lines = diffractionLines(source.group, "angle", settings.wavelength);
      if (!lines.length) return null;
      const lo = Math.max(0, Math.min(8, lines[0][0] - 1));
      const hi = Math.max(55, lines.at(-1)[0] + 1);
      return {points:shape(lines, lo, hi, 4401, 4200), source};
    }
    const isFTIR = mode === "ftir";
    const [lo, hi] = source.range;
    const lines = source.peaks.map((row, i) => [
      row[2], source.heights?.[i] ?? [1,.58,.79,.45,.55,.38,.43][i % 7],
      isFTIR ? 4.2 + (i % 3) * 1.25 : .95 + (i % 4) * .2
    ]);
    const native = shape(lines, lo, hi, Math.ceil((hi - lo) / (isFTIR ? .5 : .15)) + 1, isFTIR ? .62 : 950);
    const points = isFTIR && settings.ordinate === "transmittance" ?
      native.map(([x,y]) => [x,100 * 10 ** (-y)]) : native;
    return {points, absorbance:isFTIR ? native : undefined, source, laser:source.group.laser || ""};
  }

  function dataForExtra(mode, selected, library, settings, model) {
    const source = evidence(mode, selected, library, settings.kind);
    if (!source) return null;
    if (source.type === "method") return {data:model.demo(mode, settings), source};
    if (mode === "saed") {
      const chosen = [];
      for (const row of source.group.peaks.slice().sort((a,b)=>(b[1] ?? 1)-(a[1] ?? 1))) {
        if (!chosen.some(([d])=>Math.abs(d - row[0]) < .07)) chosen.push([row[0], 1]);
        if (chosen.length >= 6) break;
      }
      chosen.sort((a,b)=>a[0]-b[0]);
      return {data:{points:chosen, intensities:false}, source};
    }
    const lines = diffractionLines(source.group, settings.axis, settings.wavelength);
    if (!lines.length) return null;
    const q = settings.axis === "q";
    const lo = Math.max(0, Math.min(q ? .6 : 8, lines[0][0] - (q ? .1 : 1)));
    const hi = Math.max(q ? 3.85 : 55, lines.at(-1)[0] + (q ? .05 : 1));
    const series = settings.kind === "series";
    const frames = Array.from({length:series ? 24 : 1}, (_, i) => ({
      index:!series ? 0 : settings.axisSeries === "temperature" ? 25 + 4 * i :
        settings.axisSeries === "seconds" ? 2 * i : i + 1,
      points:shape(lines, lo, hi, series ? 1051 : 3001, 3600, series ? .18 + .82 / (1 + Math.exp(-(i - 10) / 2.3)) : 1)
    }));
    const traceAt = lines.reduce((best, row) => row[1] > best[1] ? row : best)[0];
    return {data:{frames}, source, traceAt};
  }

  const api = {materials, choose, evidence, primary, dataForExtra};
  if (typeof module === "object" && module.exports) module.exports = api;
  else global.PhaseSamples = api;
})(typeof window === "undefined" ? globalThis : window);
