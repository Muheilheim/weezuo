(function(){
"use strict";
const tabs=[...document.querySelectorAll("[data-pv-tool]")];
function selectTool(key,focus=false){
  const selected=tabs.find(tab=>tab.dataset.pvTool===key);
  if(!selected)return;
  tabs.forEach(tab=>{
    const active=tab===selected;
    tab.setAttribute("aria-selected",String(active));tab.tabIndex=active?0:-1;
    document.getElementById(tab.getAttribute("aria-controls")).hidden=!active;
  });
  if(focus)selected.focus({preventScroll:true});
}
tabs.forEach((tab,index)=>{
  tab.addEventListener("click",()=>{
    selectTool(tab.dataset.pvTool);
    history.replaceState(null,"","#"+tab.dataset.pvTool);
  });
  tab.addEventListener("keydown",event=>{
    let next;
    if(event.key==="ArrowRight")next=(index+1)%tabs.length;
    if(event.key==="ArrowLeft")next=(index+tabs.length-1)%tabs.length;
    if(event.key==="Home")next=0;
    if(event.key==="End")next=tabs.length-1;
    if(next===undefined)return;
    event.preventDefault();tabs[next].click();tabs[next].focus({preventScroll:true});
  });
});
function selectFromHash(){selectTool(location.hash.slice(1));}
window.addEventListener("hashchange",selectFromHash);
selectFromHash();
const data=window.PV_SPECTRAL_DATA, M=window.PVSpectral;
if(!data||!M)return;
M.checkSpectrum(data.spectrum);
const fmt=(v,n=2)=>Number(v).toFixed(n);
const $=id=>document.getElementById(id);
function saveCSV(name,rows){
  const csv="\uFEFF"+rows.map(row=>row.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(",")).join("\r\n");
  const url=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"})),a=document.createElement("a");
  a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);
}
function chart(id,series,axes,marker){
  const target=$(id),w=640,h=360,left=65,right=620,top=40,bottom=300;
  const x=v=>left+(v-axes.xmin)/(axes.xmax-axes.xmin)*(right-left);
  const y=v=>bottom-v/axes.ymax*(bottom-top);
  let s="";
  for(let i=0;i<=5;i++){
    const xv=axes.xmin+(axes.xmax-axes.xmin)*i/5,yv=axes.ymax*i/5;
    s+='<line class="rl-gridline" x1="'+x(xv)+'" y1="'+top+'" x2="'+x(xv)+'" y2="'+bottom+'"/><text x="'+x(xv)+'" y="322" text-anchor="middle">'+fmt(xv,axes.xdigits||0)+'</text>';
    s+='<line class="rl-gridline" x1="'+left+'" y1="'+y(yv)+'" x2="'+right+'" y2="'+y(yv)+'"/><text x="55" y="'+(y(yv)+4)+'" text-anchor="end">'+fmt(yv,axes.ydigits||0)+'</text>';
  }
  s+='<path class="rl-axis" fill="none" d="M65 40V300H620"/><text x="65" y="20">'+axes.ylabel+'</text><text x="343" y="350" text-anchor="middle">'+axes.xlabel+'</text>';
  for(const line of series){
    s+='<path class="rl-curve '+(line.dashed?"rl-ideal":"")+'" stroke="'+(line.dashed?"var(--muted)":"var(--teal)")+'" d="'+line.points.map((p,i)=>(i?"L":"M")+fmt(x(p[0]),3)+" "+fmt(y(p[1]),3)).join(" ")+'"/>';
  }
  if(marker)s+='<line class="rl-axis" x1="'+x(marker[0])+'" x2="'+x(marker[0])+'" y1="40" y2="300" stroke-dasharray="3 4"/><circle cx="'+x(marker[0])+'" cy="'+y(marker[1])+'" r="5.5" fill="var(--teal)" stroke="var(--surface)" stroke-width="2"/>';
  target.innerHTML=s;
}
function svg(id,title){return '<svg class="rl-chart" viewBox="0 0 640 360" role="img" aria-label="'+title+'"><g id="'+id+'"></g></svg>';}
function transfer(j,message){
  const input=$("rl-jph");
  if(!input||j<Number(input.min)||j>Number(input.max)){message.textContent="The resistance lab accepts a reference current density of 1–60 mA/cm².";return;}
  input.value=fmt(j,4);input.dispatchEvent(new Event("input",{bubbles:true}));
  message.textContent="Reference Jsc updated in the resistance lab.";
  selectTool("solar-cell-tools",true);
  history.replaceState(null,"","#solar-cell-tools");
  $("solar-cell-tools").scrollIntoView({behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth",block:"start"});
}
const bandRoot=$("bandgap-calculator");
let bandResult=null;
if(bandRoot){
bandRoot.innerHTML='<div class="sp-shell"><div class="rl-main"><div class="rl-controls">'+
  '<h3>Absorption edge</h3><p class="rl-small">Set the bandgap and the fraction of above-gap photons collected.</p>'+
  '<div class="rl-field"><label for="bg-eg">Bandgap Eɡ</label><div class="rl-input-row"><input id="bg-eg" type="number" min="0.5" max="3" step="0.01" value="1.55"><span class="rl-unit">eV</span></div><label class="sr-only" for="bg-eg-slider">Adjust bandgap in eV</label><input id="bg-eg-slider" type="range" min="0.5" max="3" step="0.01" value="1.55"><div class="rl-range-labels"><span>0.5 eV</span><span>3.0 eV</span></div></div>'+
  '<div class="rl-field"><label for="bg-collection">EQE above the bandgap</label><div class="rl-input-row"><input id="bg-collection" type="number" min="0" max="100" step="1" value="100"><span class="rl-unit">%</span></div><label class="sr-only" for="bg-collection-slider">Adjust uniform EQE percentage</label><input id="bg-collection-slider" type="range" min="0" max="100" step="1" value="100"><div class="rl-range-labels"><span>0%</span><span>100% · ideal</span></div></div>'+
  '<div class="sp-row"><button class="rl-action" type="button" data-eg="1.12">1.12 eV</button><button class="rl-action" type="button" data-eg="1.55">1.55 eV</button><button class="rl-action" type="button" data-eg="1.75">1.75 eV</button></div>'+
  '<label class="rl-check sp-wide"><input id="bg-show-table" type="checkbox" checked>Compare supplied bandgap table</label>'+
  '<p class="sp-message" id="bg-message" role="status"></p>'+
'</div><div class="rl-output"><div class="rl-chart-heading"><div><h3>Bandgap vs. short-circuit current</h3><p class="rl-small">AM1.5G · step-edge absorption model</p></div></div>'+
  svg("bg-chart","Calculated short-circuit current density versus bandgap, compared with the supplied bandgap table")+
  '<div class="sp-legend"><span id="bg-curve-legend">Spectrum integral · EQE 100%</span><span class="sp-table-line" id="bg-table-legend">Supplied table · nominal maximum</span></div>'+
  '<dl class="rl-metrics" aria-live="polite" aria-atomic="true"><div><dt>Absorption cutoff</dt><dd id="bg-cutoff"></dd><span class="rl-metric-note">λɡ = hc / Eɡ</span></div><div><dt>Calculated Jsc</dt><dd id="bg-jsc"></dd><span class="rl-metric-note" id="bg-eqe-note"></span></div><div><dt>100% EQE limit</dt><dd id="bg-limit"></dd><span class="rl-metric-note">Same bandgap</span></div></dl>'+
  '<p class="sp-summary" id="bg-table-value"></p><div class="sp-row"><button class="rl-action" type="button" id="bg-export">Export bandgap curve ↓</button><button class="rl-action" type="button" id="bg-to-lab">Use Jsc in resistance lab ↑</button></div>'+
'</div></div></div><details class="rl-method"><summary>Bandgap model &amp; source table</summary><p class="rl-equation">λɡ = hc / (q Eɡ) · Jsc = q ∫₂₈₀ⁿᵐ^λɡ Φ(λ) EQE dλ</p><p>EQE is constant above the bandgap and zero below it. Every collected photon contributes one electron. This is a photocurrent ceiling for the selected spectrum and EQE, not an efficiency limit or a prediction of Voc.</p><p>The solid curve integrates the supplied AM1.5G spectrum using hc/q = 1239.841984 eV·nm. The dashed curve preserves all 251 values from the supplied bandgap table (0.50–3.00 eV). That workbook contains values without calculation formulas; its full derivation cannot be recovered. It uses a different approximate wavelength conversion and stepwise current values. The two curves differ by up to 1.1194 mA/cm², which cannot be attributed to rounding alone from the available evidence. The table is an independent comparison and is not used to calibrate the integral. Between listed bandgaps, the table comparison is linearly interpolated.</p><p>Source: <span>bandgap for Jsc.xlsx, Sheet1</span>; spectral irradiance: <span>ASTMG173_and_Integrated_Jsc_modified2.xls, SMARTS2, global tilt column</span>. All 251 table rows and 2,002 spectral samples were checked against the original files. <a href="https://www.nlr.gov/grid/solar-resource/spectra-am1.5" target="_blank" rel="noopener noreferrer">ASTM G173-03 reference spectrum ↗</a>.</p></details>';
const curve=Array.from({length:251},(_,i)=>{const eg=.5+i*.01;return [eg,M.bandgap(data.spectrum,eg).ideal];});
const table=data.bandgapTable.map(p=>[p[0],p[2]]);
function updateBandgap(){
  const eg=$("bg-eg").valueAsNumber,percent=$("bg-collection").valueAsNumber;
  try{
    bandResult=M.bandgap(data.spectrum,eg,percent/100);
    $("bg-eg").removeAttribute("aria-invalid");$("bg-collection").removeAttribute("aria-invalid");
    $("bg-message").textContent="";$("bg-message").dataset.error="false";
    $("bg-eg-slider").value=eg;$("bg-collection-slider").value=percent;
    $("bg-eg-slider").setAttribute("aria-valuetext",eg+" electron volts");$("bg-collection-slider").setAttribute("aria-valuetext",percent+" percent");
    $("bg-cutoff").innerHTML=fmt(bandResult.cutoff,1)+'<small> nm</small>';
    $("bg-jsc").innerHTML=fmt(bandResult.jsc)+'<small> mA/cm²</small>';
    $("bg-limit").innerHTML=fmt(bandResult.ideal)+'<small> mA/cm²</small>';
    $("bg-eqe-note").textContent="Uniform EQE: "+fmt(percent,1)+"%";
    $("bg-curve-legend").textContent="Spectrum integral · EQE "+fmt(percent,0)+"%";
    $("bg-table-legend").hidden=!$("bg-show-table").checked;
    const lookup=M.interpolate(table,eg);
    $("bg-table-value").textContent="At "+fmt(eg,3)+" eV: supplied table "+fmt(lookup)+" mA/cm²; spectrum integral at 100% EQE "+fmt(bandResult.ideal)+" mA/cm².";
    const series=[{points:curve.map(p=>[p[0],p[1]*percent/100])}];
    if($("bg-show-table").checked)series.unshift({points:table,dashed:true});
    chart("bg-chart",series,{xmin:.5,xmax:3,ymax:70,xdigits:1,xlabel:"Bandgap (eV)",ylabel:"Short-circuit density (mA/cm²)"},[eg,bandResult.jsc]);
    $("bg-export").disabled=false;$("bg-to-lab").disabled=bandResult.jsc<1||bandResult.jsc>60;
  }catch(e){bandResult=null;$("bg-message").textContent=e.message;$("bg-message").dataset.error="true";$("bg-export").disabled=true;$("bg-to-lab").disabled=true;
    $("bg-eg").setAttribute("aria-invalid",String(!Number.isFinite(eg)||eg<.5||eg>3));$("bg-collection").setAttribute("aria-invalid",String(!Number.isFinite(percent)||percent<0||percent>100));
    ["bg-cutoff","bg-jsc","bg-limit"].forEach(id=>$(id).textContent="—");$("bg-chart").innerHTML="";$("bg-table-value").textContent="Enter valid inputs to calculate.";
  }
}
["bg-eg","bg-collection"].forEach(id=>$(id).addEventListener("input",updateBandgap));
["bg-eg","bg-collection"].forEach(id=>$(id+"-slider").addEventListener("input",()=>{$(id).value=$(id+"-slider").value;updateBandgap();}));
$("bg-show-table").addEventListener("change",updateBandgap);
bandRoot.querySelectorAll("[data-eg]").forEach(b=>b.addEventListener("click",()=>{$("bg-eg").value=b.dataset.eg;updateBandgap();}));
$("bg-to-lab").addEventListener("click",()=>{if(bandResult)transfer(bandResult.jsc,$("bg-message"));});
$("bg-export").addEventListener("click",()=>{
  if(!bandResult)return;
  const fraction=$("bg-collection").valueAsNumber/100;
  saveCSV("bandgap-jsc.csv",[["spectrum",data.meta.spectrum],["uniform_EQE_percent",fraction*100],["method","Piecewise-linear irradiance, exact per-interval Simpson integration"],[],["bandgap_eV","cutoff_nm","ideal_Jsc_mA_cm2","selected_EQE_Jsc_mA_cm2","supplied_table_Jsc_mA_cm2"],...curve.map(p=>[p[0],M.HC_EV_NM/p[0],p[1],p[1]*fraction,M.interpolate(table,p[0])])]);
});
updateBandgap();
}
const eqRoot=$("eqe-calculator");
if(eqRoot){
let result=null,eqePoints=null,source="example",plot="eqe",fileVersion=0;
eqRoot.innerHTML='<div class="sp-shell"><div class="rl-main"><div class="rl-controls">'+
  '<h3>Your EQE spectrum</h3><p class="rl-small">Paste two columns from Excel or import a CSV, TSV or TXT file. Wavelength must be in nm.</p>'+
  '<div class="rl-field sp-wide"><label for="eq-unit">EQE values are in</label><select id="eq-unit"><option value="percent">Percent (%) · 0–100</option><option value="fraction">Fraction · 0–1</option></select><p class="rl-small sp-unit-help">Choose Fraction for decimal values such as 0.82; choose Percent for values such as 82. The selected unit is applied when calculating.</p></div>'+
  '<div class="rl-field sp-wide"><label for="eq-data">Wavelength (nm) &amp; EQE</label><textarea id="eq-data" spellcheck="false" aria-describedby="eq-format eq-message" placeholder="Wavelength_nm,EQE_percent&#10;400,80&#10;500,90&#10;600,85"></textarea><p class="rl-small" id="eq-format">Two columns separated by tabs, commas, semicolons or spaces. An optional wavelength / EQE header is accepted. Use a decimal point.</p><label for="eq-file" class="sr-only">Import EQE text data</label><input id="eq-file" type="file" accept=".csv,.tsv,.txt,text/csv,text/plain"></div>'+
  '<div class="sp-row"><button type="button" class="rl-action sp-calculate" id="eq-calculate">Integrate EQE</button><button type="button" class="rl-action" id="eq-example">Load workbook example</button><button type="button" class="rl-action" id="eq-clear">Clear</button></div>'+
  '<p class="sp-message" id="eq-message" role="status"></p>'+
'</div><div class="rl-output sp-result" id="eq-output"><div class="rl-chart-heading"><div><h3 id="eq-chart-title">External quantum efficiency</h3><p class="rl-small" id="eq-source"></p></div></div>'+
  '<div class="sp-chart-switch" role="group" aria-label="EQE chart type"><button type="button" data-eq-plot="eqe" aria-pressed="true">EQE</button><button type="button" data-eq-plot="cumulative" aria-pressed="false">Cumulative Jsc</button><button type="button" data-eq-plot="density" aria-pressed="false">Spectral current</button></div>'+
  svg("eq-chart","EQE spectrum or its cumulative integrated short-circuit current")+
  '<dl class="rl-metrics" aria-live="polite" aria-atomic="true"><div><dt>Integrated Jsc</dt><dd id="eq-jsc"></dd><span class="rl-metric-note">AM1.5G</span></div><div><dt>Integration interval</dt><dd id="eq-span"></dd><span class="rl-metric-note">nm · supplied data overlap</span></div><div><dt>Photon-weighted EQE</dt><dd id="eq-weighted"></dd><span class="rl-metric-note">Within this interval</span></div></dl>'+
  '<p class="sp-summary" id="eq-coverage"></p><p class="sp-caption" id="eq-legacy"></p>'+
  '<div class="sp-row"><button type="button" class="rl-action" id="eq-export">Export integral data ↓</button><button type="button" class="rl-action" id="eq-to-lab">Use Jsc in resistance lab ↑</button></div>'+
  '<p class="sp-caption">Your imported or pasted EQE stays in this browser. No data is uploaded to a server.</p>'+
'</div></div></div><details class="rl-method"><summary>EQE integration, coverage &amp; units</summary>'+
  '<p class="rl-equation">Jsc = q ∫ Φ(λ) EQE(λ) dλ = (q/hc) ∫ Eλ(λ) λ EQE(λ) dλ</p>'+
  '<p>The selected reference is ASTM G173-03 AM1.5G global tilt from the supplied workbook’s SMARTS2 sheet: 2,002 points from 280 to 4,000 nm. Irradiance is in W·m⁻²·nm⁻¹, wavelength in nm, EQE a fraction, and output in mA/cm². The conversion factor multiplying ∫Eλ λ EQE dλ is q/(hc) × 10⁻¹⁰. The spectrum integrates to '+fmt(data.meta.power_W_m2,4)+' W/m² and is used without renormalization.</p>'+
  '<p>All irradiance and EQE wavelength points are merged. Irradiance and EQE are each linearly interpolated between samples. Simpson integration on each interval exactly integrates the resulting cubic expression. This retains the original spectral resolution and accepts irregular EQE spacing.</p>'+
  '<p>The integral covers only the overlap between the reference spectrum and the supplied EQE span. EQE is assumed zero outside that span; missing response tails can underestimate a full-device Jsc. Results with nonzero endpoints are flagged. Duplicate wavelengths and values outside the selected EQE unit range are rejected.</p>'+
  '<p>The supplied example contains 181 EQE points from 300 to 1,200 nm. Its original workbook cached 37.2297434 mA/cm²; reintegration on the complete reference spectrum gives 37.2488907 mA/cm². A 5 nm trapezoid calculation with exact constants gives 37.2301072 mA/cm². These differences reflect the integration grid and constants; the original workbook is preserved.</p>'+
  '<p>This calculation does not apply spectral-mismatch corrections, device area corrections or EQE bias-light corrections. It computes short-circuit current density from the entered external quantum efficiency.</p>'+
  '<div class="rl-source-links"><a href="https://www.nlr.gov/grid/solar-resource/spectra-am1.5" target="_blank" rel="noopener noreferrer">Reference AM1.5 spectra ↗</a><a href="https://www.pveducation.org/pvcdrom/solar-cell-operation/quantum-efficiency" target="_blank" rel="noopener noreferrer">PVEducation · Quantum efficiency ↗</a></div></details>';
function empty(message,error=false){
  result=null;eqePoints=null;$("eq-message").textContent=message;$("eq-message").dataset.error=String(error);
  $("eq-data").setAttribute("aria-invalid",String(error));
  ["eq-jsc","eq-span","eq-weighted"].forEach(id=>$(id).textContent="—");
  $("eq-chart").innerHTML="";$("eq-coverage").textContent="";$("eq-legacy").textContent="";$("eq-source").textContent="No current result";
  $("eq-export").disabled=true;$("eq-to-lab").disabled=true;
}
function drawEQE(){
  if(!result)return;
  const axes={xmin:result.lo,xmax:result.hi,ymax:100,xlabel:"Wavelength (nm)",ylabel:"EQE (%)"};
  let points;
  if(plot==="eqe"){points=result.points.map(p=>[p.w,p.eqe*100]);$("eq-chart-title").textContent="External quantum efficiency";}
  else if(plot==="cumulative"){points=result.points.map(p=>[p.w,p.cumulative]);axes.ymax=Math.max(1,result.jsc*1.1);axes.ydigits=1;axes.ylabel="Integrated current (mA/cm²)";$("eq-chart-title").textContent="Cumulative short-circuit current";}
  else {points=result.points.map(p=>[p.w,p.density]);axes.ymax=Math.max(.001,...points.map(p=>p[1]))*1.1;axes.ydigits=3;axes.ylabel="Spectral current (mA/cm²/nm)";$("eq-chart-title").textContent="Spectral current contribution";}
  chart("eq-chart",[{points}],axes);
  eqRoot.querySelectorAll("[data-eq-plot]").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.eqPlot===plot)));
}
function calculate(){
  try{
    const parsed=M.parseEQE($("eq-data").value,$("eq-unit").value);eqePoints=parsed.points;
    result=M.integrate(data.spectrum,eqePoints[0][0],eqePoints.at(-1)[0],eqePoints);
    if(result.points.length<2)throw Error("No wavelength overlap with the 280–4000 nm reference spectrum.");
    $("eq-data").removeAttribute("aria-invalid");$("eq-message").dataset.error="false";
    $("eq-message").textContent=eqePoints.length+" EQE points integrated."+(parsed.sorted?" Wavelengths sorted in ascending order.":"");
    $("eq-source").textContent=(source==="example"?"Supplied workbook example":"Your EQE data")+" · "+eqePoints.length+" points · AM1.5G";
    $("eq-jsc").innerHTML=fmt(result.jsc,4)+'<small> mA/cm²</small>';
    $("eq-span").innerHTML=fmt(result.lo,0)+"–"+fmt(result.hi,0);
    $("eq-span").style.fontSize="20px";
    $("eq-weighted").innerHTML=fmt(result.limit?result.jsc/result.limit*100:0)+'<small> %</small>';
    const endpoint=eqePoints[0][1]>.01||eqePoints.at(-1)[1]>.01;
    const outside=eqePoints[0][0]<280||eqePoints.at(-1)[0]>4000;
    $("eq-coverage").textContent="Measured-range integral: "+fmt(result.lo,1)+"–"+fmt(result.hi,1)+" nm. EQE is assumed zero outside the supplied span."+(endpoint?" At least one endpoint exceeds 1%; unmeasured response may add current.":"")+(outside?" Data outside 280–4000 nm has no reference irradiance and is excluded.":"");
    $("eq-legacy").textContent=source==="example"?"Workbook cached Jsc: "+fmt(data.meta.legacyJsc_mA_cm2,4)+" mA/cm². Full-spectrum difference: +"+fmt(result.jsc-data.meta.legacyJsc_mA_cm2,4)+" mA/cm² ("+fmt((result.jsc/data.meta.legacyJsc_mA_cm2-1)*100,4)+"%).":"";
    $("eq-export").disabled=false;$("eq-to-lab").disabled=result.jsc<1||result.jsc>60;
    drawEQE();
  }catch(e){empty(e.message,true);}
}
function example(){
  fileVersion++;source="example";$("eq-unit").value="percent";$("eq-file").value="";
  $("eq-data").value="Wavelength_nm,EQE_percent\n"+data.exampleEQE.map(p=>p[0]+","+Number(p[1].toPrecision(12))).join("\n");calculate();
}
$("eq-data").addEventListener("input",()=>{fileVersion++;source="custom";empty("Data changed. Select Integrate EQE to update the result.");});
$("eq-unit").addEventListener("change",()=>{source="custom";calculate();});
$("eq-calculate").addEventListener("click",calculate);
$("eq-example").addEventListener("click",example);
$("eq-clear").addEventListener("click",()=>{fileVersion++;source="custom";$("eq-data").value="";$("eq-file").value="";empty("Paste two columns or import a CSV, TSV or TXT file.");});
$("eq-file").addEventListener("change",async()=>{
  const file=$("eq-file").files[0],version=++fileVersion;if(!file)return;
  if(file.size>2000000){empty("Use a file smaller than 2 MB.",true);return;}
  if(!/\.(csv|tsv|txt)$/i.test(file.name)){empty("Save the EQE columns as CSV, TSV or TXT, or paste them directly from Excel.",true);return;}
  try{const text=await file.text();if(version!==fileVersion)return;source="custom";$("eq-data").value=text;calculate();}catch(e){empty("Unable to read this text file.",true);}
});
eqRoot.querySelectorAll("[data-eq-plot]").forEach(b=>b.addEventListener("click",()=>{plot=b.dataset.eqPlot;drawEQE();}));
$("eq-to-lab").addEventListener("click",()=>{if(result)transfer(result.jsc,$("eq-message"));});
$("eq-export").addEventListener("click",()=>{
  if(!result)return;
  saveCSV("eqe-integrated-jsc.csv",[["spectrum",data.meta.spectrum],["source",source==="example"?"Supplied workbook example":"User EQE"],["Jsc_mA_cm2",result.jsc],["interval_nm",result.lo,result.hi],["assumption","EQE zero outside supplied span; no spectrum renormalization"],[],["wavelength_nm","EQE_percent","irradiance_W_m2_nm","spectral_current_mA_cm2_nm","cumulative_Jsc_mA_cm2"],...result.points.map(p=>[p.w,p.eqe*100,p.irradiance,p.density,p.cumulative])]);
});
example();
}
})();
