(function () {
  "use strict";
  const root=document.getElementById("trpl-calculator"), M=window.TRPL;
  if(!root || !M)return;
  const $=id=>document.getElementById("trpl-"+id);
  const T=(en,de,zh)=>document.documentElement.lang==='de'?de:document.documentElement.lang.startsWith('zh')?zh:en;
  const field=(id,label,value,extra="")=>'<div class="rl-field"><label for="trpl-'+id+'">'+label+'</label><input id="trpl-'+id+'" type="number" step="any" value="'+value+'" '+extra+'></div>';
  root.innerHTML='<div class="rl-shell pl-shell trpl-shell"><div class="rl-main"><form id="trpl-form" class="rl-controls">'+
    '<h3>TRPL data and fitting</h3><p class="rl-small">Upload time–intensity data. Each intensity column represents one sample or condition.</p>'+
    '<details class="pl-import" id="trpl-import" open><summary>Import TRPL curves</summary><p class="rl-small">CSV, TSV or TXT; first column time, followed by 1–20 intensity columns. Optional header; select ps, ns or µs. Decimal point required.</p><input id="trpl-file" type="file" accept=".csv,.tsv,.txt,text/csv,text/plain" hidden><button type="button" class="rl-action" id="trpl-choose">Choose TRPL file</button><p id="trpl-source" class="rl-small"></p><label for="trpl-data" class="sr-only">TRPL time–intensity data</label><textarea id="trpl-data" rows="5" spellcheck="false" placeholder="Time (ns),Sample A,Sample B&#10;0,1000,800&#10;10,780,650"></textarea><p class="rl-small">Editing the data clears previous results. Select Fit TRPL data to update them.</p></details>'+
    '<div class="rl-field"><label for="trpl-unit">Input time unit</label><select id="trpl-unit"><option value="ps">ps</option><option value="ns" selected>ns</option><option value="us">µs</option></select></div>'+
    '<div class="rl-field"><label for="trpl-sample">Displayed TRPL sample</label><select id="trpl-sample"></select></div>'+
    '<div class="rl-field"><label for="trpl-model">Decay model</label><select id="trpl-model"><option value="mono">One exponential</option><option value="bi">Two exponentials</option></select></div>'+
    field("background","Constant TRPL background (same intensity unit)","0",'min="0"')+field("start","Fit start (input time unit)","0")+field("end","Fit end (input time unit)","400")+
    '<p class="rl-small">Choose a window after the pulse and instrument response. The reference is the first measured point inside this window.</p><div class="rl-actions"><button type="button" class="rl-action" id="trpl-fit">Fit TRPL data</button><button type="button" class="rl-action" id="trpl-example">Load TRPL example</button></div>'+
    '<h3 class="trpl-voltage-heading">Transient internal voltage</h3>'+field("temperature","Temperature T (K)","300",'min="0"')+field("reference-voltage","Calibrated Vref at the reference time (V, optional)","",'min="0"')+
    '<p class="rl-small">Leave Vref blank for relative voltage. Absolute voltage needs an independent calibration for this sample at this transient reference time; a steady-state voltage cannot be reused automatically.</p><p id="trpl-message" role="status" class="rl-error"></p></form>'+
    '<div class="rl-output"><h3>TRPL decay analysis</h3><p class="rl-small" id="trpl-reference"></p><dl class="rl-metrics">'+
    '<div><dt>PL decay time τ1</dt><dd id="trpl-tau1">—</dd></div><div><dt>PL decay time τ2</dt><dd id="trpl-tau2">—</dd></div><div><dt>Amplitude-weighted PL time τA</dt><dd id="trpl-tauA">—</dd></div><div><dt>Intensity-weighted PL time τI</dt><dd id="trpl-tauI">—</dd></div><div><dt>R² · intensity-space fit</dt><dd id="trpl-r2">—</dd></div><div><dt>RMSE · intensity units</dt><dd id="trpl-rmse">—</dd></div></dl><p class="rl-error" id="trpl-warning" role="status"></p>'+
    '<div class="rl-chart-heading pl-chart-heading"><h3>Measured and fitted TRPL</h3><div class="sp-chart-switch" role="group" aria-label="TRPL plot view"><button type="button" data-trpl-view="log" aria-pressed="true">Log intensity</button><button type="button" data-trpl-view="linear" aria-pressed="false">Linear intensity</button><button type="button" data-trpl-view="residual" aria-pressed="false">Fit residuals</button></div></div><svg id="trpl-decay-chart" class="rl-chart pl-chart" viewBox="0 0 640 360" role="img" aria-label="TRPL measurements and fit"><g id="trpl-decay-content"></g></svg>'+
    '<div class="trpl-legend" data-literal><span class="trpl-measured" id="trpl-decay-solid"></span><span class="trpl-fitted" id="trpl-decay-dashed"></span><p id="trpl-decay-context"></p></div><p class="sp-caption">Background-subtracted intensity. Log plots omit nonpositive values; fitting retains them. Residual = measured − fitted.</p>'+
    '<h3 id="trpl-voltage-title">Relative internal voltage change</h3><svg id="trpl-voltage-chart" class="rl-chart pl-chart" viewBox="0 0 640 360" role="img" aria-label="TRPL-derived voltage versus time"><g id="trpl-voltage-content"></g></svg>'+
    '<div class="trpl-legend" data-literal><span class="trpl-measured">'+T('Solid: voltage from measured PL','Durchgezogen: Spannung aus gemessener PL','实线：由实测 PL 换算的电压')+'</span><span class="trpl-fitted">'+T('Dashed: voltage from fitted PL','Gestrichelt: Spannung aus PL-Fit','虚线：由拟合 PL 换算的电压')+'</span></div><p id="trpl-voltage-context" class="rl-small" data-literal></p><p id="trpl-voltage-message" class="rl-small" role="status"></p><div class="rl-probe"><div class="rl-probe-top"><label for="trpl-probe">Inspect TRPL time and voltage</label><output id="trpl-probe-reading"></output></div><input id="trpl-probe" type="range" min="0" max="1" step="1" value="0" disabled></div>'+
    '<p class="pl-equation" id="trpl-equation"></p><p class="rl-small">τA = (A1 τ1 + A2 τ2)/(A1 + A2); τI = (A1 τ1² + A2 τ2²)/(A1 τ1 + A2 τ2). Amplitudes refer to the fit reference time; all reported times are in ns.</p><p class="pl-equation">Vint(t) = Vref + (kBT/q) ln[(I(t) − B)/(Iref − B)]</p><p class="sp-caption">This voltage estimate assumes PL proportional to np, a uniform quasi-Fermi-level splitting, fixed temperature and unchanged optical response. Nonpositive corrected PL has no inferred voltage. TRPL decay time alone does not determine absolute voltage or Voc.</p>'+
    '<h3 class="trpl-batch-heading">TRPL sample comparison</h3><div class="rl-table-wrap"><table class="rl-table"><thead><tr><th>Sample</th><th>τ1 (ns)</th><th>τ2 (ns)</th><th>τA (ns)</th><th>τI (ns)</th><th>R²</th><th>Fit status</th></tr></thead><tbody id="trpl-rows"></tbody></table></div><div class="rl-actions"><button type="button" class="rl-action" id="trpl-export" disabled>Export TRPL results ↓</button></div><p class="rl-small">TRPL data and results stay in your browser.</p></div></div><details class="rl-method"><summary>TRPL methods, assumptions and sources</summary><p>Unweighted nonlinear least squares on intensity, with a fixed user-supplied background and positive exponential amplitudes. Fits use every point in the chosen interval; display curves may be reduced for readability. No instrument-response deconvolution or uncertainty estimation is performed.</p><p>Single and double exponentials are empirical decay descriptions. Fast and slow components do not identify recombination or extraction mechanisms; PL decay times are not automatically carrier lifetimes. A long lifetime relative to the observation window or two similar components can be poorly constrained.</p><a href="https://doi.org/10.1002/aenm.201904134" target="_blank" rel="noopener noreferrer">Kirchartz et al., Adv. Energy Mater. (2020)</a></details></div>';
  let data=null, fits=[], version=0, dirty=false, view="log", voltageRows=null;
  const number=id=>$(id).value.trim()===""?NaN:Number($(id).value);
  const format=value=>Number(value.toPrecision(5)).toString();
  const parameters=()=>({unit:$("unit").value,background:number("background"),start:number("start"),end:number("end"),model:$("model").value});
  const voltageParameters=()=>({background:number("background"),temperature:number("temperature"),referenceVoltage:$("reference-voltage").value.trim()===""?null:number("reference-voltage")});
  const selectedFit=()=>fits[Number($("sample").value)]?.result;
  function clearResults(message="") {
    fits=[];voltageRows=null;$("export").disabled=true;$("probe").disabled=true;$("probe-reading").textContent="—";
    for(const id of ["tau1","tau2","tauA","tauI","r2","rmse"])$(id).textContent="—";
    for(const id of ["decay-content","voltage-content","rows"])$(id).replaceChildren();
    for(const id of ["reference","warning","voltage-message","equation","decay-solid","decay-dashed","decay-context","voltage-context"])$(id).textContent="";
    $("message").textContent=message;$("voltage-title").textContent="Relative internal voltage change";$("fit").disabled=false;
  }
  function loadData(text,label,literal=false) {
    data=M.parseData(text);dirty=false;$("source").toggleAttribute("data-literal",literal);$("source").textContent=label;$("data").value=text;$("reference-voltage").value="";
    if(data.unit)$("unit").value=data.unit;
    $("sample").replaceChildren();
    data.names.forEach((name,i)=>{const option=document.createElement("option");option.value=i;option.textContent=name;option.dataset.literal="";$("sample").append(option);});
    let start=data.points[0][0];
    for(let j=1;j<=data.names.length;j++){let peak=0;for(let i=1;i<data.points.length;i++)if(data.points[i][j]>data.points[peak][j])peak=i;start=Math.max(start,data.points[peak][0]);}
    $("start").value=start;$("end").value=data.points.at(-1)[0];$("data").removeAttribute("aria-invalid");
    $("message").textContent=data.sorted?"TRPL curves loaded; time values sorted in ascending order.":"TRPL curves loaded. Check the time unit, background and fit window.";
  }
  async function fitAll() {
    const token=++version;clearResults("Fitting TRPL samples…");$("fit").disabled=true;
    try {
      if(dirty || !data)loadData($("data").value,"Pasted TRPL data");
      const p=parameters(), results=[];
      for(let sample=0;sample<data.names.length;sample++) {
        await new Promise(resolve=>setTimeout(resolve,0));if(token!==version)return;
        try{results.push({name:data.names[sample],result:M.fit(data,{...p,sample})});}catch(error){results.push({name:data.names[sample],error:error.message});}
      }
      if(token!==version)return;fits=results;$("message").textContent="TRPL fitting finished. Inspect the residuals and any fit warnings.";render();
    }catch(error){if(token!==version)return;data=null;dirty=true;$("data").setAttribute("aria-invalid","true");clearResults(error.message);}
    finally{if(token===version)$("fit").disabled=false;}
  }
  function render() {
    $("rows").replaceChildren();
    fits.forEach(item=>{const r=item.result,row=document.createElement("tr");const values=[item.name,r?format(r.tau1):"—",r?.tau2?format(r.tau2):"—",r?format(r.tauA):"—",r?format(r.tauI):"—",r?r.r2.toFixed(5):"—",item.error||(r.weak?"Check fit constraints":"Fitted")];values.forEach((value,i)=>{const cell=document.createElement(i===0?"th":"td");cell.textContent=value;if(i===0){cell.scope="row";cell.dataset.literal="";}row.append(cell);});$("rows").append(row);});
    $("export").disabled=!fits.some(item=>item.result);
    const r=selectedFit();
    for(const key of ["tau1","tau2","tauA","tauI","r2","rmse"])$(key).textContent=!r || r[key]===null?"—":key.startsWith("tau")?format(r[key])+" ns":key==="r2"?r.r2.toFixed(5):format(r.rmse);
    if(!r){$("message").textContent=fits[Number($("sample").value)]?.error||"No TRPL fit available.";$("decay-content").replaceChildren();$("voltage-content").replaceChildren();$("probe").disabled=true;$("probe-reading").textContent="—";$("reference").textContent="";$("warning").textContent="";voltageRows=null;for(const id of ["equation","decay-solid","decay-dashed","decay-context","voltage-context","voltage-message"])$(id).textContent="";return;}
    $("reference").replaceChildren();const label=document.createElement("span");label.textContent="Reference time / intensity: ";$("reference").append(label,format(r.tRef*M.units[$("unit").value])+" ns / "+format(r.referenceIntensity));
    $("warning").textContent=r.weak?"A component is weak or poorly resolved by this time window. Adjust the interval and compare with one exponential.":"";
    $("equation").textContent=r.tau2===null?"I(t) = B + A1 exp[−(t − tref)/τ1]":"I(t) = B + A1 exp[−(t − tref)/τ1] + A2 exp[−(t − tref)/τ2]";
    $("probe").max=r.points.length-1;$("probe").disabled=false;$("probe").value=Math.min(Number($("probe").value),r.points.length-1);
    drawDecay();updateVoltage();
  }
  const tickFormat=value=>Math.abs(value)>=1e4 || (value!==0 && Math.abs(value)<.01)?value.toExponential(1).replace(/\.0e/,"e").replace("e+","e"):Number(value.toPrecision(4)).toString();
  let maps={};
  const escape=value=>String(value).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  function chart(id,first,second,yLabel,log=false) {
    const valid=[...first,...second].filter(v=>v[1]!==null && Number.isFinite(v[1]) && (!log || v[1]>0));
    if(!valid.length){$(id+"-content").replaceChildren();delete maps[id];return;}
    const r=selectedFit(),factor=M.units[$("unit").value],xmin=r.points[0][0]*factor,xmax=r.points.at(-1)[0]*factor;
    const values=valid.map(v=>log?Math.log10(v[1]):v[1]);let ymin=Math.min(...values),ymax=Math.max(...values);
    const pad=Math.max((ymax-ymin)*.08,log?.1:Math.max(Math.abs(ymax)*.03,.001));ymin-=pad;ymax+=pad;
    const measure=document.createElementNS("http://www.w3.org/2000/svg","text");measure.setAttribute("class","pl-tick");$(id+"-content").replaceChildren(measure);
    let tickWidth=0;for(let i=0;i<5;i++){const y=ymin+(ymax-ymin)*i/4;measure.textContent=tickFormat(log?10**y:y);tickWidth=Math.max(tickWidth,measure.getComputedTextLength());}
    const font=parseFloat(getComputedStyle(measure).fontSize),labelX=font+4;
    const plot={left:Math.ceil(tickWidth)+font+28,right:600,top:24,bottom:278};
    const xp=x=>plot.left+(x-xmin)/(xmax-xmin)*(plot.right-plot.left),yp=y=>plot.bottom-((log?Math.log10(y):y)-ymin)/(ymax-ymin)*(plot.bottom-plot.top);
    maps[id]={xp,yp,left:plot.left,right:plot.right};let svg="";
    for(let i=0;i<5;i++){const x=xmin+(xmax-xmin)*i/4,y=ymin+(ymax-ymin)*i/4;svg+='<path class="pl-grid" d="M'+xp(x)+' '+plot.top+'V'+plot.bottom+'M'+plot.left+' '+(plot.bottom-(plot.bottom-plot.top)*i/4)+'H'+plot.right+'"/><text class="pl-tick" x="'+xp(x)+'" y="312" text-anchor="middle">'+tickFormat(x)+'</text><text class="pl-tick" x="'+(plot.left-12)+'" y="'+(plot.bottom-(plot.bottom-plot.top)*i/4+4)+'" text-anchor="end">'+tickFormat(log?10**y:y)+'</text>';}
    function path(points,className){let d="",connected=false;const stride=Math.max(1,Math.ceil(points.length/600));for(let i=0;i<points.length;i++){const [x,y]=points[i];if(y===null || !Number.isFinite(y) || (log && y<=0)){connected=false;continue;}if(i%stride && i!==points.length-1 && connected)continue;d+=(connected?"L":"M")+xp(x)+" "+yp(y);connected=true;}return '<path class="'+className+'" d="'+d+'"/>';}
    svg+=path(first,"trpl-data-curve")+path(second,"pl-curve")+'<text class="pl-axis-label" x="'+((plot.left+plot.right)/2)+'" y="350" text-anchor="middle">Time (ns)</text><text class="pl-axis-label" x="'+labelX+'" y="'+((plot.top+plot.bottom)/2)+'" text-anchor="middle" transform="rotate(-90 '+labelX+' '+((plot.top+plot.bottom)/2)+')">'+escape(yLabel)+'</text><circle id="trpl-'+id+'-probe" class="pl-probe-dot" r="4" hidden/>';
    $(id+"-content").innerHTML=svg;
  }
  function drawDecay() {
    const r=selectedFit();if(!r)return;const p=parameters(),factor=M.units[p.unit];
    const measured=r.points.map((row,i)=>[row[0]*factor,view==="residual"?r.residuals[i]:row[Number($("sample").value)+1]-p.background]);
    const predicted=r.points.map((row,i)=>[row[0]*factor,view==="residual"?0:r.predictions[i]-p.background]);
    $("decay-solid").textContent=view==="residual"?T('Solid: measured − fitted','Durchgezogen: Messung − Fit','实线：实测值－拟合值（残差）'):T('Solid: measured PL − background','Durchgezogen: gemessene PL − Untergrund','实线：实测 PL 扣除背景');
    $("decay-dashed").textContent=view==="residual"?T('Dashed: zero residual','Gestrichelt: Nullresiduum','虚线：零残差参考线'):T('Dashed: fitted PL − background','Gestrichelt: PL-Fit − Untergrund','虚线：拟合 PL 扣除背景');
    $("decay-context").textContent=data.names[Number($("sample").value)]+' · '+(p.model==='mono'?T('One exponential','Ein Exponentialterm','单指数'):T('Two exponentials','Zwei Exponentialterme','双指数'))+' · '+p.start+'–'+p.end+' '+$("unit").selectedOptions[0].textContent+' · B = '+p.background;
    chart("decay",measured,predicted,view==="residual"?"Residual intensity":"Corrected PL intensity",view==="log");
  }
  function updateVoltage() {
    const r=selectedFit();if(!r)return;const p=voltageParameters(),factor=M.units[$("unit").value];
    try {
      voltageRows=r.points.map((row,i)=>({time:row[0]*factor,measured:M.voltage(row[Number($("sample").value)+1],r.referenceIntensity,p),fitted:M.voltage(r.predictions[i],r.referenceIntensity,p)}));
      $("export").disabled=!fits.some(item=>item.result);
      const value=v=>v===null?null:p.referenceVoltage===null?v.delta*1000:v.absolute;
      $("voltage-title").textContent=p.referenceVoltage===null?"Relative internal voltage change":"Reference-calibrated internal voltage";
      $("voltage-context").textContent=data.names[Number($("sample").value)]+' · T = '+p.temperature+' K · '+(p.referenceVoltage===null?T('Relative to the first measured point in the fit window','Relativ zum ersten Messpunkt im Fitfenster','相对拟合区间内首个实测点'):'Vref = '+p.referenceVoltage+' V');
      chart("voltage",voltageRows.map(row=>[row.time,value(row.measured)]),voltageRows.map(row=>[row.time,value(row.fitted)]),p.referenceVoltage===null?"Relative voltage (mV)":"Internal voltage (V)");
      $("voltage-message").textContent=p.referenceVoltage===null?"Relative to the measured reference point. Supply a calibrated Vref for absolute voltage.":"Vref applies only to this sample and the displayed transient reference time.";
    }catch(error){voltageRows=null;$("voltage-content").replaceChildren();$("voltage-message").textContent=error.message;$("export").disabled=true;}
    probe();
  }
  function probe() {
    const r=selectedFit();if(!r)return;const i=Number($("probe").value),p=parameters(),row=r.points[i],x=row[0]*M.units[p.unit],signal=row[Number($("sample").value)+1]-p.background;
    const vr=voltageRows?.[i]?.measured,absolute=voltageParameters().referenceVoltage!==null;
    const voltage=vr?(absolute?format(vr.absolute)+" V":format(vr.delta*1000)+" mV"):"—";
    $("probe-reading").textContent=format(x)+" ns · PL = "+format(signal)+" · ΔI = "+format(r.residuals[i])+" · "+(absolute?"Vint":"ΔVint")+" = "+voltage;
    $("probe").setAttribute("aria-valuetext",$("probe-reading").textContent);
    for(const [id,y] of [["decay",view==="residual"?r.residuals[i]:signal],["voltage",vr?(absolute?vr.absolute:vr.delta*1000):null]]) {
      const dot=$(id+"-probe"),mapping=maps[id];if(!dot || !mapping)continue;
      const valid=y!==null && Number.isFinite(y) && (id!=="decay" || view!=="log" || y>0);dot.toggleAttribute("hidden",!valid);
      if(valid){dot.setAttribute("cx",mapping.xp(x));dot.setAttribute("cy",mapping.yp(y));}
    }
  }
  function invalidate(){version++;clearResults("TRPL settings changed. Select Fit TRPL data to update results.");$("reference-voltage").value="";}
  $("form").addEventListener("submit",event=>event.preventDefault());
  $("data").addEventListener("input",()=>{dirty=true;data=null;$("file").value="";$("source").removeAttribute("data-literal");$("source").textContent="Pasted TRPL data";invalidate();});
  for(const id of ["unit","model","background","start","end"])$(id).addEventListener("input",invalidate);
  $("reference-voltage").addEventListener("input",updateVoltage);
  $("temperature").addEventListener("input",()=>{$("reference-voltage").value="";updateVoltage();});
  $("sample").addEventListener("change",()=>{$("reference-voltage").value="";$("message").textContent="";render();});
  $("fit").addEventListener("click",fitAll);
  $("choose").addEventListener("click",()=>$("file").click());
  $("file").addEventListener("change",async()=>{
    const file=$("file").files[0];if(!file)return;const token=++version;clearResults("Reading TRPL file…");data=null;dirty=true;$("reference-voltage").value="";$("source").setAttribute("data-literal","");$("source").textContent=file.name;$("data").value="";$("sample").replaceChildren();
    try{if(file.size>2000000)throw Error("Use a TRPL text file smaller than 2 MB.");if(!/\.(csv|tsv|txt)$/i.test(file.name))throw Error("Save TRPL data as CSV, TSV or TXT, or paste columns from Excel.");let text;try{text=new TextDecoder("utf-8",{fatal:true}).decode(await file.arrayBuffer());}catch{throw Error("Use UTF-8 for TRPL text files.");}if(token!==version)return;$("background").value="0";loadData(text,file.name,true);await fitAll();}
    catch(error){if(token!==version)return;data=null;dirty=true;$("data").value="";clearResults(error.message);}
  });
  $("example").addEventListener("click",()=>{version++;$("file").value="";$("model").value="mono";$("background").value="5";$("unit").value="ns";$("temperature").value="300";loadData("Time (ns),Single,Double\n"+Array.from({length:201},(_,i)=>[i*2,5+1000*Math.exp(-i*2/40),5+700*Math.exp(-i*2/15)+300*Math.exp(-i*2/90)].join(",")).join("\n"),"Demonstration TRPL data");fitAll();});
  root.querySelectorAll("[data-trpl-view]").forEach(button=>button.addEventListener("click",()=>{view=button.dataset.trplView;root.querySelectorAll("[data-trpl-view]").forEach(b=>b.setAttribute("aria-pressed",String(b===button)));drawDecay();probe();}));
  $("probe").addEventListener("input",probe);
  for(const id of ["decay","voltage"])$(id+"-chart").addEventListener("pointermove",event=>{
    const r=selectedFit(),mapping=maps[id];if(!r || !mapping)return;const svgX=new DOMPoint(event.clientX,event.clientY).matrixTransform($(id+"-chart").getScreenCTM().inverse()).x;if(svgX<mapping.left || svgX>mapping.right)return;
    const time=r.points[0][0]+(svgX-mapping.left)/(mapping.right-mapping.left)*(r.points.at(-1)[0]-r.points[0][0]);let lo=0,hi=r.points.length-1;
    while(hi-lo>1){const mid=(lo+hi)>>1;if(r.points[mid][0]<time)lo=mid;else hi=mid;}
    $("probe").value=Math.abs(r.points[lo][0]-time)<Math.abs(r.points[hi][0]-time)?lo:hi;probe();
  });
  $("export").addEventListener("click",()=>{
    if(!fits.some(item=>item.result))return;
    try{window.CSVExport.save("trpl-decay-and-voltage.csv",M.exportRows(data,fits,parameters(),voltageParameters(),Number($("sample").value),$("source").textContent));}
    catch(error){$("voltage-message").textContent=error.message;}
  });
  let chartWidth=0;
  new ResizeObserver(([entry])=>{const width=entry.contentRect.width;if(width>0 && width!==chartWidth){chartWidth=width;if(selectedFit()){drawDecay();updateVoltage();}}}).observe(root);
  $("example").click();
})();
