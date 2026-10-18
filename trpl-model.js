/* Empirical PL decay times; fixed background and unweighted intensity-space least squares. */
(function (root) {
  "use strict";
  const units = {ps:0.001, ns:1, us:1000};
  function parseData(text) {
    if (typeof text !== "string" || text.length > 2000000) throw Error("Use a TRPL text file smaller than 2 MB.");
    const numeric = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i;
    const points = []; let names = null, delimiter = null, width = 0, unit = null;
    for (const raw of text.replace(/^\uFEFF/, "").split(/\r?\n/)) {
      const line = raw.trim(); if (!line || line.startsWith("#")) continue;
      if (delimiter === null) delimiter = line.includes("\t") ? "\t" : line.includes(";") ? ";" : line.includes(",") ? "," : " ";
      let cells;
      if (delimiter === " ") cells = line.split(/\s+/);
      else {
        cells = []; let cell = "", quoted = false;
        for (let i=0; i<line.length; i++) {
          if (line[i] === '"') { if (quoted && line[i+1] === '"') {cell += '"'; i++;} else quoted = !quoted; }
          else if (line[i] === delimiter && !quoted) {cells.push(cell.trim()); cell = "";}
          else cell += line[i];
        }
        if (quoted) throw Error("TRPL data contains an unclosed quote.");
        cells.push(cell.trim());
      }
      if (!width) {
        width = cells.length;
        if (width < 2 || width > 21) throw Error("Use one time column and 1–20 TRPL intensity columns.");
        if (!numeric.test(cells[0])) {
          const header = cells[0].toLowerCase().replace(/[µμ]/g,"u").replace(/_/g," ");
          if (!/^(time|delay|t\b|时间|延迟|zeit)/i.test(header) || /wavelength|nm|ev|波长/i.test(header)) throw Error("The first TRPL column must be time, not wavelength or energy.");
          const match = header.match(/(?:^|[^a-z])(ps|ns|us)(?:$|[^a-z])/);
          unit = match ? match[1] : null;
          if (!unit && /[\[(]|\b(?:ms|s|seconds?|minutes?|bins?)\b/.test(header)) throw Error("Use ps, ns or µs for TRPL time.");
          names = cells.slice(1);
          if (names.some(name => !name || name.length > 120) || new Set(names).size !== names.length) throw Error("TRPL column names must be nonempty, unique and at most 120 characters.");
          continue;
        }
      }
      if (cells.length !== width || cells.some(cell => !numeric.test(cell) || !Number.isFinite(Number(cell)))) throw Error("Every TRPL row must contain the same number of finite numeric columns. Use a decimal point.");
      const row = cells.map(Number);
      if (Math.abs(row[0]) > 1e12) throw Error("TRPL time values exceed the supported range.");
      points.push(row);
      if (points.length > 20000) throw Error("Use at most 20,000 TRPL time rows.");
    }
    if (points.length < 8) throw Error("Enter at least eight time rows for TRPL fitting.");
    const sorted = points.some((row,i) => i && row[0] < points[i-1][0]);
    points.sort((a,b) => a[0]-b[0]);
    if (points.some((row,i) => i && row[0] === points[i-1][0])) throw Error("Duplicate TRPL times: resolve duplicates before fitting.");
    return {points, sorted, unit, names:names || Array.from({length:width-1},(_,i)=>"Decay "+(i+1))};
  }
  function golden(fn, lo, hi) {
    const r=(Math.sqrt(5)-1)/2;
    let a=hi-r*(hi-lo), b=lo+r*(hi-lo), fa=fn(a), fb=fn(b);
    for(let i=0;i<36;i++) {
      if(fa<fb){hi=b;b=a;fb=fa;a=hi-r*(hi-lo);fa=fn(a);}
      else{lo=a;a=b;fa=fb;b=lo+r*(hi-lo);fb=fn(b);}
    }
    return fa<fb?a:b;
  }
  function simplex2(fn, seed, step) {
    const point=v=>({v,loss:fn(...v).loss});
    let vertices=[point(seed),point([seed[0]+step,seed[1]]),point([seed[0],seed[1]+step])];
    for(let iteration=0;iteration<320;iteration++) {
      vertices.sort((a,b)=>a.loss-b.loss);
      const [a,b,c]=vertices;
      if(Math.max(...b.v.map((v,i)=>Math.abs(v-a.v[i])),...c.v.map((v,i)=>Math.abs(v-a.v[i])))<1e-9)break;
      const center=a.v.map((v,i)=>(v+b.v[i])/2);
      const trial=f=>point(center.map((v,i)=>v+f*(v-c.v[i])));
      const reflected=trial(1);
      if(reflected.loss<a.loss){const expanded=trial(2);vertices[2]=expanded.loss<reflected.loss?expanded:reflected;}
      else if(reflected.loss<b.loss)vertices[2]=reflected;
      else {
        const contracted=trial(reflected.loss < c.loss ? 0.5 : -0.5);
        if(contracted.loss<Math.min(c.loss,reflected.loss))vertices[2]=contracted;
        else vertices=[a,...[b,c].map(p=>point(p.v.map((v,i)=>(v+a.v[i])/2)))];
      }
    }
    return vertices.sort((a,b)=>a.loss-b.loss)[0];
  }
  function fit(data,p) {
    if (!units[p.unit] || (data.unit && data.unit !== p.unit)) throw Error("The selected time unit must match the TRPL header.");
    if (!Number.isInteger(p.sample) || !data.names[p.sample]) throw Error("Choose a TRPL sample.");
    if (!Number.isFinite(p.background) || p.background < 0) throw Error("Enter a finite, nonnegative TRPL background.");
    if (![p.start,p.end].every(Number.isFinite) || p.start < data.points[0][0] || p.end > data.points.at(-1)[0] || p.end <= p.start) throw Error("Choose an increasing fit interval within the TRPL time range.");
    if (!["mono","bi"].includes(p.model)) throw Error("Choose a TRPL decay model.");
    const selected = data.points.filter(row=>row[0]>=p.start && row[0]<=p.end);
    if(selected.length < (p.model === "bi"?12:8)) throw Error("The fit window needs eight points for one exponential or twelve for two.");
    const tRef=selected[0][0], factor=units[p.unit];
    const x=selected.map(row=>(row[0]-tRef)*factor);
    const raw=selected.map(row=>row[p.sample+1]-p.background);
    const scale=Math.max(...raw.map(Math.abs));
    if (!Number.isFinite(scale) || scale <= 0 || raw[0] <= 0) throw Error("The reference TRPL intensity must be above background.");
    const y=raw.map(v=>v/scale), mean=y.reduce((a,b)=>a+b,0)/y.length;
    const sst=y.reduce((sum,v)=>sum+(v-mean)**2,0);
    const slope=x.reduce((sum,v,i)=>sum+v*(y[i]-mean),0);
    if(sst < 1e-12*y.length || slope >= 0) throw Error("No resolved decay in this fit window. Check the peak, background and interval.");
    const span=x.at(-1), step=Math.min(...x.slice(1).map((v,i)=>v-x[i]));
    const lo=Math.log(step/20), hi=Math.log(span*100), gridStep=(hi-lo)/31;
    function solve(log1,log2=null) {
      if(!Number.isFinite(log1) || log1<lo || log1>hi || (log2!==null && (!Number.isFinite(log2) || log2<lo || log2>hi)))return {loss:Infinity};
      const tau1=Math.exp(log1), tau2=log2===null?null:Math.exp(log2);
      if(tau2!==null && tau2/tau1 <= 1.02) return {loss:Infinity};
      let s11=0,s22=0,s12=0,b1=0,b2=0;
      for(let i=0;i<x.length;i++) {
        const e1=Math.exp(-x[i]/tau1), e2=tau2===null?0:Math.exp(-x[i]/tau2);
        s11+=e1*e1;s22+=e2*e2;s12+=e1*e2;b1+=e1*y[i];b2+=e2*y[i];
      }
      let a1=b1/s11,a2=0;
      if(tau2!==null) {
        const det=s11*s22-s12*s12;
        if(det<=1e-10*s11*s22)return {loss:Infinity};
        a1=(b1*s22-b2*s12)/det;a2=(b2*s11-b1*s12)/det;
        if(a1<=0 || a2<=0)return {loss:Infinity};
      }
      if(a1<=0)return {loss:Infinity};
      // Direct residuals retain precision near an exact fit; normal-equation
      // subtraction yy - a1*b1 - a2*b2 can cancel to a false zero.
      let loss=0;
      for(let i=0;i<x.length;i++){const residual=y[i]-a1*Math.exp(-x[i]/tau1)-(tau2===null?0:a2*Math.exp(-x[i]/tau2));loss+=residual*residual;}
      return {loss,tau1,tau2,a1,a2};
    }
    let l1=lo,l2=null,best={loss:Infinity};const seeds=[];
    for(let i=0;i<32;i++) {
      const a=lo+i*gridStep;
      if(p.model==="mono") {const value=solve(a);if(value.loss<best.loss){best=value;l1=a;}}
      else for(let j=i+1;j<32;j++) {const b=lo+j*gridStep,value=solve(a,b);if(Number.isFinite(value.loss))seeds.push({v:[a,b],loss:value.loss});if(value.loss<best.loss){best=value;l1=a;l2=b;}}
    }
    if(!Number.isFinite(best.loss))throw Error("The requested decay model could not be fitted. Try one exponential or another interval.");
    if(p.model==="mono")l1=golden(v=>solve(v).loss,Math.max(lo,l1-gridStep),Math.min(hi,l1+gridStep));
    else {
      const starts=[];
      for(const seed of seeds.sort((a,b)=>a.loss-b.loss)) {
        if(starts.every(p=>Math.hypot(...seed.v.map((v,i)=>v-p.v[i]))>gridStep))starts.push(seed);
        if(starts.length===6)break;
      }
      for(const seed of starts) {
        const optimized=simplex2(solve,seed.v,gridStep/3);
        if(optimized.loss<best.loss){best=solve(...optimized.v);[l1,l2]=optimized.v;}
      }
    }
    best=solve(l1,l2);
    const A1=best.a1*scale,A2=best.a2*scale;
    const evaluate=t=>p.background+A1*Math.exp(-(t-tRef)*factor/best.tau1)+(best.tau2===null?0:A2*Math.exp(-(t-tRef)*factor/best.tau2));
    const predictions=selected.map(row=>evaluate(row[0]));
    const residuals=selected.map((row,i)=>row[p.sample+1]-predictions[i]);
    // Recompute residuals rather than using the cancelling normal-equation loss for fit quality.
    const sse=residuals.reduce((sum,v)=>sum+(v/scale)**2,0);
    const w1=best.a1/(best.a1+best.a2),w2=1-w1;
    const tauA=w1*best.tau1+w2*(best.tau2||0);
    const tauI=w1*best.tau1*(best.tau1/tauA)+w2*(best.tau2||0)*((best.tau2||0)/tauA);
    const r2=1-sse/sst,rmse=Math.sqrt(sse/y.length)*scale;
    const weak=best.tau1<=step/2 || (best.tau2||best.tau1)>=span || (best.tau2!==null && (best.tau2/best.tau1<1.5 || Math.min(A1,A2)/(A1+A2)<0.01));
    if(![A1,A2,tauA,tauI,r2,rmse,...predictions].every(Number.isFinite))throw Error("The TRPL inputs exceed the numerical range.");
    return {tau1:best.tau1,tau2:best.tau2,A1,A2,tauA,tauI,r2,rmse,tRef,referenceIntensity:selected[0][p.sample+1],points:selected,predictions,residuals,weak};
  }
  function voltage(intensity,referenceIntensity,p) {
    if(!Number.isFinite(p.temperature) || p.temperature<=0)throw Error("Enter a positive temperature in kelvin.");
    if(p.referenceVoltage!==null && (!Number.isFinite(p.referenceVoltage) || p.referenceVoltage<0))throw Error("Enter a finite, nonnegative internal reference voltage.");
    if(![intensity,referenceIntensity,p.background].every(Number.isFinite) || p.background<0 || referenceIntensity<=p.background)throw Error("The reference TRPL intensity must be above background.");
    if(intensity<=p.background)return null;
    const delta=1.380649e-23*p.temperature/1.602176634e-19*(Math.log(intensity-p.background)-Math.log(referenceIntensity-p.background));
    const absolute=p.referenceVoltage===null?null:p.referenceVoltage+delta;
    if(!Number.isFinite(delta) || (absolute!==null && !Number.isFinite(absolute)))throw Error("The TRPL inputs exceed the numerical range.");
    return {delta,absolute};
  }
  function exportRows(data,fits,p,vp,active,source) {
    const safe=value=>/^\s*[=+@-]/.test(value)?"'"+value:value;
    const selected=fits[active]?.result;
    if(selected)voltage(selected.referenceIntensity,selected.referenceIntensity,vp);
    const rows=[["method","Empirical exponential decay; unweighted intensity-space least squares; fixed background"],["source",safe(source)],["input_time_unit",p.unit],["fit_window_input_time",p.start,p.end],["background",p.background],["temperature_K",vp.temperature],["voltage_assumption","PL proportional to np; uniform QFLS; fixed optical response; independent Vref at transient reference time"],["IRF_deconvolution","none"],["uncertainty_estimation","none"],[],["sample","A1","A2","tau1_ns","tau2_ns","tauA_ns","tauI_ns","R2","RMSE","reference_time_ns","reference_intensity","Vref_V","status"]];
    fits.forEach((item,i)=>{const r=item.result;rows.push(r?[safe(item.name),r.A1,r.A2,r.tau1,r.tau2??"",r.tauA,r.tauI,r.r2,r.rmse,r.tRef*units[p.unit],r.referenceIntensity,i===active?vp.referenceVoltage??"":"",r.weak?"poorly constrained":"fitted"]:[safe(item.name),...Array(11).fill(""),item.error]);});
    rows.push([],["sample","time_ns","measured_intensity","fitted_intensity","residual","delta_Vint_measured_mV","Vint_measured_V","delta_Vint_fit_mV","Vint_fit_V"]);
    fits.forEach((item,sample)=>{const r=item.result;if(!r)return;const options={...vp,referenceVoltage:sample===active?vp.referenceVoltage:null};r.points.forEach((row,i)=>{const measured=voltage(row[sample+1],r.referenceIntensity,options),fitted=voltage(r.predictions[i],r.referenceIntensity,options);rows.push([safe(item.name),row[0]*units[p.unit],row[sample+1],r.predictions[i],r.residuals[i],measured?measured.delta*1000:"",measured?.absolute??"",fitted?fitted.delta*1000:"",fitted?.absolute??""]);});});
    return rows;
  }
  const api={parseData,fit,voltage,exportRows,units};
  if(typeof module==="object" && module.exports)module.exports=api;else root.TRPL=api;
})(typeof globalThis!=="undefined"?globalThis:this);
