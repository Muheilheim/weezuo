(function(root){
  "use strict";
  const Q=1.602176634e-19,H=6.62607015e-34,C=299792458;
  const HC_EV_NM=H*C/Q*1e9, FACTOR=Q/(H*C)*1e-10;
  function interpolate(points,x){
    if(x<points[0][0] || x>points.at(-1)[0]) return 0;
    let lo=0,hi=points.length-1;
    while(hi-lo>1){const m=(lo+hi)>>1;if(points[m][0]>x)hi=m;else lo=m;}
    if(points[hi][0]===points[lo][0])return points[lo][1];
    return points[lo][1]+(points[hi][1]-points[lo][1])*(x-points[lo][0])/(points[hi][0]-points[lo][0]);
  }
  function checkSpectrum(spectrum){
    if(!Array.isArray(spectrum)||spectrum.length<2)throw Error("A spectrum needs at least two points.");
    for(let i=0;i<spectrum.length;i++){
      const [w,p]=spectrum[i];
      if(!Number.isFinite(w)||w<=0||!Number.isFinite(p)||p<0||(i&&w<=spectrum[i-1][0]))throw Error("Spectrum wavelengths must increase and irradiance must be finite and nonnegative.");
    }
  }
  function integrate(spectrum,lo,hi,eqe=null){
    lo=Math.max(lo,spectrum[0][0],eqe?eqe[0][0]:-Infinity);
    hi=Math.min(hi,spectrum.at(-1)[0],eqe?eqe.at(-1)[0]:Infinity);
    if(hi<=lo) return {jsc:0,limit:0,points:[],lo,hi};
    const grid=[...new Set([lo,hi,...spectrum.filter(p=>p[0]>lo&&p[0]<hi).map(p=>p[0]),...(eqe?eqe.filter(p=>p[0]>lo&&p[0]<hi).map(p=>p[0]):[])])].sort((a,b)=>a-b);
    const at=w=>{const irradiance=interpolate(spectrum,w), eff=eqe?interpolate(eqe,w):1;return {w,irradiance,eqe:eff,density:irradiance*w*eff*FACTOR,idealDensity:irradiance*w*FACTOR};};
    let sum=0,limit=0,prev=at(grid[0]);
    const points=[{...prev,cumulative:0}];
    for(let i=1;i<grid.length;i++){
      const next=at(grid[i]),mid=at((prev.w+next.w)/2),dx=(next.w-prev.w)/6;
      sum+=dx*(prev.density+4*mid.density+next.density);
      limit+=dx*(prev.idealDensity+4*mid.idealDensity+next.idealDensity);
      points.push({...next,cumulative:sum});prev=next;
    }
    return {jsc:sum,limit,points,lo,hi};
  }
  function bandgap(spectrum,eg,collection=1){
    if(!Number.isFinite(eg)||eg<.5||eg>3)throw Error("Bandgap must be 0.5–3.0 eV.");
    if(!Number.isFinite(collection)||collection<0||collection>1)throw Error("Collection must be 0–100%.");
    const cutoff=HC_EV_NM/eg;
    const result=integrate(spectrum,spectrum[0][0],cutoff);
    return {eg,cutoff,ideal:result.jsc,jsc:result.jsc*collection};
  }
  function parseEQE(text,unit="percent"){
    if(!["percent","fraction"].includes(unit))throw Error("Choose EQE in percent or fraction.");
    if(typeof text!=="string"||text.length>2000000)throw Error("Use a text file smaller than 2 MB.");
    const lines=text.replace(/^\uFEFF/,"").split(/\r?\n/),points=[];
    let skippedHeader=false;
    for(let i=0;i<lines.length;i++){
      const line=lines[i].trim();if(!line||line.startsWith("#"))continue;
      const delimiter=line.includes("\t")?"\t":line.includes(",")?",":line.includes(";")?";":/\s+/;
      const cells=line.split(delimiter).map(s=>s.trim().replace(/^"|"$/g,""));
      const wave=Number(cells[0]),eff=Number((cells[1]||"").replace(/%$/,""));
      if(!points.length&&!skippedHeader && (!Number.isFinite(wave)||!Number.isFinite(eff)) && /wavelength|lambda|波长/i.test(line) && /eqe|ipce|量子/i.test(line)) {skippedHeader=true;continue;}
      const numeric=/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i;
      if(cells.length!==2||!numeric.test(cells[0])||!numeric.test((cells[1]||"").replace(/%$/,"").trim())||!Number.isFinite(wave)||!Number.isFinite(eff))throw Error("Line "+(i+1)+": enter exactly two numeric columns (wavelength in nm, EQE). Use a decimal point.");
      if(wave<=0||wave>100000)throw Error("Line "+(i+1)+": wavelength must be positive and in nm.");
      if(unit==="fraction" && cells[1].endsWith("%"))throw Error("Percent signs require the Percent (%) setting.");
      const fraction=unit==="percent"?eff/100:eff;
      if(fraction<0||fraction>1)throw Error("Line "+(i+1)+": EQE must be "+(unit==="percent"?"0–100%.":"0–1."));
      points.push([wave,fraction]);
      if(points.length>20000)throw Error("Use at most 20,000 EQE points.");
    }
    if(points.length<2)throw Error("Enter at least two wavelength / EQE rows.");
    const sorted=points.some((p,i)=>i&&p[0]<points[i-1][0]);
    points.sort((a,b)=>a[0]-b[0]);
    for(let i=1;i<points.length;i++)if(points[i][0]===points[i-1][0])throw Error("Duplicate wavelength "+points[i][0]+" nm. Resolve duplicates before integrating.");
    return {points,sorted};
  }
  const api={interpolate,integrate,bandgap,parseEQE,checkSpectrum,HC_EV_NM,FACTOR};
  if(typeof module==="object"&&module.exports)module.exports=api;else root.PVSpectral=api;
})(typeof globalThis!=="undefined"?globalThis:this);
