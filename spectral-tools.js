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
function selectFromHash(){
  const key=location.hash.slice(1);
  selectTool(key==="bg-voc"?"bandgap-jsc":key);
}
window.addEventListener("hashchange",selectFromHash);
selectFromHash();
const data=window.PV_SPECTRAL_DATA, M=window.PVSpectral;
if(!data||!M)return;
M.checkSpectrum(data.spectrum);
const fmt=(v,n=2)=>Number(v).toFixed(n);
const $=id=>document.getElementById(id);
const lang=document.documentElement.lang.toLowerCase();
const T=(en,de,zh)=>lang.startsWith("zh")?zh:lang==="de"?de:en;
function saveCSV(name,rows){
 window.CSVExport.save(name,rows);
}
function chart(id,series,axes,marker){
  const left=65, right=axes.right?575:620, top=40, bottom=300;
  const x=value=>left+(value-axes.xmin)/(axes.xmax-axes.xmin)*(right-left);
  const y=(value,secondary=false)=>bottom-value/(secondary?axes.right.ymax:axes.ymax)*(bottom-top);
  let markup="";
  for(let index=0;index<=5;index++){
    const fraction=index/5, xv=axes.xmin+(axes.xmax-axes.xmin)*fraction;
    const xp=x(xv), yp=y(axes.ymax*fraction);
    markup+='<line class="rl-gridline" x1="'+xp+'" y1="'+top+'" x2="'+xp+'" y2="'+bottom+'"/>';
    markup+='<text x="'+xp+'" y="322" text-anchor="middle">'+fmt(xv,axes.xdigits||0)+'</text>';
    markup+='<line class="rl-gridline" x1="'+left+'" y1="'+yp+'" x2="'+right+'" y2="'+yp+'"/>';
    markup+='<text x="55" y="'+(yp+4)+'" text-anchor="end">'+fmt(axes.ymax*fraction,axes.ydigits||0)+'</text>';
    if(axes.right){
      markup+='<text class="sp-voc-axis" x="'+(right+10)+'" y="'+(yp+4)+'">'+fmt(axes.right.ymax*fraction,axes.right.ydigits)+'</text>';
    }
  }
  markup+='<path class="rl-axis" fill="none" d="M'+left+' '+top+'V'+bottom+'H'+right+'"/>';
  markup+='<text x="'+left+'" y="20">'+axes.ylabel+'</text>';
  markup+='<text x="'+((left+right)/2)+'" y="350" text-anchor="middle">'+axes.xlabel+'</text>';
  if(axes.right){
    markup+='<path class="rl-axis" fill="none" d="M'+right+' '+top+'V'+bottom+'"/>';
    markup+='<text class="sp-voc-axis" x="'+right+'" y="20" text-anchor="end">'+axes.right.label+'</text>';
  }
  for(const line of series){
    const style=line.className??(line.dashed?"rl-ideal":"");
    const color=line.color??(line.dashed?"var(--muted)":"var(--teal)");
    let path="", newSegment=true;
    for(const [xp,yp] of line.points){
      if(!Number.isFinite(yp)){
        newSegment=true;
        continue;
      }
      path+=(newSegment?"M":"L")+fmt(x(xp),3)+" "+fmt(y(yp,line.secondary),3)+" ";
      newSegment=false;
    }
    markup+='<path class="rl-curve '+style+'" stroke="'+color+'" d="'+path+'"/>';
    if(line.reference){
      const [eg,voc]=line.reference;
      markup+='<circle class="sp-eqe-voc-mark" cx="'+x(eg)+'" cy="'+y(voc,true)+'" r="4.5" fill="var(--surface)" stroke="'+color+'" stroke-width="2"/>';
    }
  }
  if(marker){
    const xp=x(marker.x);
    markup+='<line class="rl-axis sp-selected-bandgap" x1="'+xp+'" x2="'+xp+'" y1="'+top+'" y2="'+bottom+'" stroke-dasharray="3 4"/>';
    if(Number.isFinite(marker.primary)){
      markup+='<circle class="sp-jsc-mark" cx="'+xp+'" cy="'+y(marker.primary)+'" r="5.5" fill="var(--teal)" stroke="var(--surface)" stroke-width="2"/>';
    }
    if(Number.isFinite(marker.secondary)){
      const yp=y(marker.secondary,true);
      markup+='<rect class="sp-voc-mark" x="'+(xp-3.5)+'" y="'+(yp-3.5)+'" width="7" height="7" transform="rotate(45 '+xp+' '+yp+')" fill="var(--sp-voc-color)" stroke="var(--surface)" stroke-width="1.5"/>';
    }
  }
  $(id).innerHTML=markup;
}
function svg(id,title){return '<svg class="rl-chart" viewBox="0 0 640 360" role="img" aria-label="'+title+'"><g id="'+id+'"></g></svg>';}
function transfer(j,message,reference=null){
  const input=$("rl-jph");
  if(!input||j<Number(input.min)||j>Number(input.max)){message.textContent="The resistance lab accepts a reference current density of 1–60 mA/cm².";return;}
  if(reference){
    if(!window.ResistanceLab?.applyBandgapReference({...reference,jph:j})){
      message.textContent=T("Check the model inputs in 03 before applying the reference.",
        "Vor der Übernahme die Modelleingaben in 03 prüfen.","应用前请检查模块 03 的模型输入。");
      return;
    }
    message.textContent="";
  }else{
    input.value=fmt(j,4);input.dispatchEvent(new Event("input",{bubbles:true}));
    message.textContent="Reference Jsc updated in the resistance lab.";
  }
  selectTool("solar-cell-tools",true);
  history.replaceState(null,"","#solar-cell-tools");
  $("solar-cell-tools").scrollIntoView({behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth",block:"start"});
}

function mountBandgapVoc(root,bandgapCurrents,drawBandgap){
  const settings=document.createElement("div");
  settings.dataset.literal="";
  settings.innerHTML=`
    <div class="rl-field">
      <label for="bg-voc-temperature">${T("Cell temperature","Zelltemperatur","电池温度")}</label>
      <div class="rl-input-row"><input id="bg-voc-temperature" type="number" min="200" max="400" step="any" value="298.15"><span class="rl-unit">K</span></div>
    </div>
    <details class="sp-voc-settings">
      <summary>${T("Refine the voltage estimate","Spannung genauer abschätzen","校正开路电压估算")}</summary>
      <label class="rl-check"><input id="bg-voc-use-eqe" type="checkbox" disabled aria-describedby="bg-voc-eqe-status"> ${T("Calculate Jsc and radiative Voc from module 02 EQE","Jsc und Strahlungs-Voc aus der EQE von Modul 02 berechnen","用模块 02 的 EQE 计算 Jsc 和辐射 Voc")}</label>
      <p class="rl-small sp-voc-status" id="bg-voc-eqe-status" role="status"></p>
      <button id="bg-voc-from-pl" class="rl-action" type="button" disabled>
        ${T("Copy absolute PLQY and T from 04","Absolute PLQY und T aus 04 übernehmen","导入 04 的绝对 PLQY 与温度")}
      </button>
      <p class="rl-small sp-voc-status" id="bg-voc-pl-status" role="status"></p>
      <label class="rl-check">
        <input id="bg-voc-use-jv" type="checkbox" disabled>
        ${T("Compare with a matching illuminated J–V scan from 06","Mit einem passenden beleuchteten J–V-Scan aus 06 vergleichen","对照 06 中同条件的光照 J–V 扫描")}
      </label>
      <p class="rl-small sp-voc-status" id="bg-voc-jv-status" role="status"></p>
      <div class="rl-field">
        <label for="bg-voc-plqy">${T("Absolute external PLQY","Absolute externe PLQY","绝对外部 PLQY")}</label>
        <div class="rl-input-row"><input id="bg-voc-plqy" type="number" min="0" max="100" step="any"><span class="rl-unit">%</span></div>
      </div>
      <div class="rl-field" id="bg-voc-reference">
        <label for="bg-voc-reference-loss">${T("Loss from reference iVoc and measured Voc","Verlust aus Referenz-iVoc und gemessenem Voc","由参考实测 Voc 标定的电压损失")}</label>
        <strong><output id="bg-voc-reference-loss" aria-live="polite">—</output></strong>
        <div class="sp-row">
          <button id="bg-voc-reference-jv" type="button" class="rl-action" disabled>${T("Set 06 pair as reference","06-Messpaar als Referenz","将 06 配对设为参考")}</button>
          <button id="bg-voc-reference-pl" type="button" class="rl-action" aria-describedby="bg-voc-reference-pl-status" disabled>${T("Set 04 pair as reference","04-Messpaar als Referenz","将 04 配对设为参考")}</button>
          <button id="bg-voc-reference-clear" type="button" class="rl-action" disabled>${T("Clear reference","Referenz zurücksetzen","清除参考")}</button>
        </div>
        <p class="rl-small sp-voc-status" id="bg-voc-reference-pl-status" role="status"></p>
        <p class="rl-small sp-voc-status" id="bg-voc-reference-source" role="status"></p>
        <p class="rl-small">${T("Use a matched iVoc/Voc pair from the same device as the reference. Apply it to devices with the same structure and measurement conditions.","Ein iVoc/Voc-Messpaar desselben Geräts als Referenz verwenden. Die Referenz gilt für Geräte desselben Aufbaus und mit gleichen Messbedingungen.","用同一器件的 iVoc 与实测 Voc 配对作为参考。标定值用于同结构、同测量条件的器件。")}</p>
      </div>
      <p class="rl-small">${T("Use EQE from the same sample and optical stack. Absolute PLQY should be measured at the entered temperature and one-sun-equivalent excitation. Pair J–V data from the same device and conditions.","EQE derselben Probe mit gleichem optischem Schichtaufbau verwenden. Die absolute PLQY bei der eingegebenen Temperatur und einer Anregung äquivalent zu einer Sonne messen. Für den J–V-Vergleich dasselbe Gerät und dieselben Bedingungen wählen.","选用同一样品和光学结构的 EQE。绝对 PLQY 应在所填温度、一倍日照等效激发下测得。配对 J–V 时，需使用同一器件和测量条件。")}</p>
    </details>`;
  $("bg-message").before(settings);

  const spectrum=document.createElement("section");
  spectrum.id="bg-eqe-spectrum";
  spectrum.className="sp-eqe-spectrum";
  spectrum.hidden=true;
  spectrum.dataset.literal="";
  spectrum.setAttribute("aria-labelledby","bg-eqe-spectrum-title");
  spectrum.innerHTML=`
    <h4 id="bg-eqe-spectrum-title">${T("EQE spectrum from module 02","EQE-Spektrum aus Modul 02","模块 02 的 EQE 光谱")}</h4>
    <p class="rl-small" id="bg-voc-source"></p>
    <dl class="rl-metrics sp-bandgap-metrics" aria-live="polite" aria-atomic="true">
      <div><dt>${T("Integrated Jsc","Integrierter Jsc","EQE 积分 Jsc")}</dt><dd id="bg-spectrum-jsc">—</dd><span class="rl-metric-note">AM1.5G</span></div>
      <div><dt>${T("Radiative-limit Voc","Voc an der Strahlungsgrenze","EQE 辐射极限 Voc")}</dt><dd id="bg-voc-eqe">—</dd><span class="rl-metric-note" id="bg-spectrum-voc-note"></span></div>
    </dl>
    <div class="rl-field">
      <label for="bg-eqe-reference-eg">${T("Reference bandgap of this EQE spectrum","Referenzbandlücke dieses EQE-Spektrums","该 EQE 光谱的参考带隙")}</label>
      <div class="rl-input-row"><input id="bg-eqe-reference-eg" type="number" min="0.5" max="3" step="any" aria-describedby="bg-eqe-curve-note"><span class="rl-unit">eV</span></div>
      <p class="rl-small" id="bg-eqe-curve-note"></p>
    </div>`;

  const output=document.createElement("section");
  output.id="bg-voc-details";
  output.className="sp-voc";
  output.dataset.literal="";
  output.setAttribute("aria-labelledby","bg-voc-title");
  output.innerHTML=`
    <h4 id="bg-voc-title">${T("Voc references and corrections","Voc-Referenzen und Korrekturen","Voc 参考与校正")}</h4>
    <dl class="rl-metrics" aria-live="polite" aria-atomic="true">
      <div><dt>${T("SQ radiative limit","SQ-Strahlungsgrenze","SQ 辐射极限")}</dt><dd id="bg-voc-sq">—</dd><span class="rl-metric-note">AM1.5G · 100% EQE</span></div>
      <div hidden><dt>${T("Implied Voc","Implizite Leerlaufspannung","内部等效电压")}</dt><dd id="bg-voc-implied">—</dd><span class="rl-metric-note">QFLS / q</span></div>
      <div hidden><dt id="bg-voc-terminal-title">${T("Estimated terminal Voc","Geschätzte Leerlaufspannung an den Kontakten","器件端开路电压估算")}</dt><dd id="bg-voc-terminal">—</dd></div>

      <div hidden><dt>${T("Measured terminal Voc · 06","Gemessener Voc an den Kontakten · 06","06 实测端 Voc")}</dt><dd id="bg-voc-measured">—</dd></div>
      <div hidden><dt>${T("iVoc minus measured Voc","iVoc minus gemessenem Voc","iVoc 与实测 Voc 的差值")}</dt><dd id="bg-voc-difference">—</dd></div>
    </dl>
    <p class="rl-small sp-voc-status" id="bg-voc-jv-source"></p>
    <p class="sp-message sp-voc-status" id="bg-voc-message" role="status" data-error="true"></p>
    <details class="sp-voc-method">
      <summary>${T("Model and assumptions","Modell und Annahmen","模型与条件")}</summary>
      <p class="rl-small">${T(
        "The SQ value assumes a single junction with step absorption and emission into one hemisphere. For the imported EQE spectrum, the AM1.5G photon flux gives Jsc and the blackbody photon flux gives J₀,rad. The two currents give the radiative voltage limit at the selected temperature. EQE outside the supplied range is set to zero. Coverage at the absorption edge and in its long-wavelength tail affects the limit.",
        "Der SQ-Wert gilt für eine Einzelzelle mit stufenförmiger Absorption und Emission in einen Halbraum. Beim importierten EQE-Spektrum liefert der AM1.5G-Photonenfluss Jsc und der Schwarzkörper-Photonenfluss J₀,rad. Beide Ströme ergeben die Strahlungsgrenze der Spannung bei der gewählten Temperatur. Außerhalb des gelieferten Bereichs beträgt die EQE null. Messpunkte an der Absorptionskante und in ihrem langwelligen Ausläufer beeinflussen die Grenze.",
        "SQ 值采用单结阶跃吸收和单侧半球发射。导入的 EQE 光谱分别用 AM1.5G 光子通量和黑体光子通量加权，得到 Jsc 和 J₀,rad。两项电流给出所选温度下的辐射极限 Voc。范围外的 EQE 取零，吸收边及长波尾部的覆盖会影响估算。")}</p>
      <p class="rl-small">${T(
        "The uniform EQE slider scales the effective photocurrent used for both plotted quantities. At each bandgap and temperature, Voc = (kBT/q) ln(1 + Jsc/J₀,rad) uses the fixed radiative dark current of a step absorber. The 100% setting gives the SQ value. A spectrum from 02 is used for its separate radiative voltage and for PL-based estimates when selected.",
        "Die konstante EQE skaliert den effektiven Photostrom für beide Kurven. Bei jeder Bandlücke und Temperatur gilt Voc = (kBT/q) ln(1 + Jsc/J₀,rad) mit dem festen radiativen Dunkelstrom eines Stufenabsorbers. 100 % entsprechen dem SQ-Wert. Ein ausgewähltes Spektrum aus 02 dient der spektralen Strahlungsspannung und den PL-basierten Schätzungen.",
        "均匀 EQE 滑块按比例调整图中两项计算所用的有效光生电流。在每个带隙和温度下，Voc = (kBT/q) ln(1 + Jsc/J₀,rad)，其中 J₀,rad 固定为阶跃吸收模型的辐射暗电流。100% EQE 对应 SQ 值。选用 02 的光谱后，该光谱用于计算单列的辐射电压和基于 PL 的估算。")}</p>
      <p class="rl-small"><a href="https://doi.org/10.1016/j.solener.2016.02.015">Rühle (2016)</a> · <a href="https://doi.org/10.1103/PhysRevB.76.085303">Rau (2007)</a></p>
    </details>`;

  const plot=document.createElement("div");
  plot.id="bg-combined-plot";
  plot.className="sp-combined-plot";
  plot.dataset.literal="";
  plot.hidden=true;
  plot.innerHTML=`
    ${svg("bg-chart",T("Bandgap versus short-circuit current density and estimated open-circuit voltage","Bandlücke, Kurzschlussstromdichte und geschätzte Leerlaufspannung","带隙与短路电流密度、估算开路电压的关系"))}
    <div class="sp-legend">
      <span id="bg-curve-legend"></span>
      <span id="bg-sq-voc-legend" class="sp-sq-voc-line">${T("SQ limit Voc (100% EQE)","SQ-Grenze Voc (100 % EQE)","SQ 极限 Voc（100% EQE）")}</span>
      <span id="bg-voc-legend" class="sp-voc-line"></span>
      <span id="bg-eqe-voc-legend" class="sp-eqe-voc-line"></span>
      <span id="bg-table-legend" class="sp-table-line">${T("Reference Jsc table","Jsc-Referenztabelle","Jsc 参考表")}</span>
    </div>`;
  const tableSummary=root.querySelector("#bg-table-value");
  tableSummary.before(plot);
  tableSummary.after(spectrum,output);
  const temperature=$("bg-voc-temperature"), useEqe=$("bg-voc-use-eqe");
  const plqy=$("bg-voc-plqy");
  const selectedMetric=$("bg-voc-selected"), selectedNote=$("bg-voc-selected-note");
  const status=$("bg-voc-message"), source=$("bg-voc-source");
  const spectrumJsc=$("bg-spectrum-jsc"), spectrumVoc=$("bg-voc-eqe");
  const spectrumNote=$("bg-spectrum-voc-note"), eqeStatus=$("bg-voc-eqe-status");
  const referenceGap=$("bg-eqe-reference-eg"), curveNote=$("bg-eqe-curve-note");
  let shiftedEQE=null;
  const metrics=["bg-voc-sq","bg-voc-implied","bg-voc-terminal","bg-voc-measured","bg-voc-difference"].map($);
  const [sqVoltage, impliedVoltage, terminalVoltage, measuredVoltage, voltageDifference]=metrics;
  const plButton=$("bg-voc-from-pl"), plStatus=$("bg-voc-pl-status");
  const useJv=$("bg-voc-use-jv"), jvStatus=$("bg-voc-jv-status"), jvSource=$("bg-voc-jv-source");
  const inputs=window.BandgapInputs=window.BandgapInputs||{};
  let importedPL=null, pairedJV=null;
  const useJVReference=$("bg-voc-reference-jv"), usePLReference=$("bg-voc-reference-pl");
  const clearReference=$("bg-voc-reference-clear"), referenceValue=$("bg-voc-reference-loss");
  const referenceSource=$("bg-voc-reference-source"), terminalTitle=$("bg-voc-terminal-title");
  const plReferenceStatus=$("bg-voc-reference-pl-status");
  // Half the displayed 0.1 mV precision for the reference loss.
  const referenceTolerance=0.00005;
  let reference=null, currentJVReference=null, lastBasis=null;

  function makeReference(implied,voc,kelvin,source){
    if(!(Number.isFinite(implied)&&Number.isFinite(voc)&&implied>=voc&&voc>0&&kelvin>=200&&kelvin<=400))return null;
    return {implied,voc,temperature:kelvin,loss:implied-voc,source};
  }
  function readPLReference(){
    const pair=inputs.plVoltagePair?.();
    if(!pair)return {};
    const candidate=makeReference(pair.implied,pair.voc,pair.temperature,"04"+(pair.sampleId?" · "+pair.sampleId:""));
    if(!candidate)return {message:T(
      "For a 04 reference, measure Voc at 200–400 K and check that Voc is at most iVoc.",
      "Für eine 04-Referenz Voc bei 200–400 K messen und prüfen, ob Voc höchstens iVoc erreicht.",
      "要将 04 设为参考，请确认测量温度在 200–400 K 内，实测 Voc 不高于 iVoc。")};
    const referencePLQY=pair.plqy??plqy.valueAsNumber;
    if(!(referencePLQY>0&&referencePLQY<=100))return {message:T(
      "Enter the absolute PLQY of the 04 reference device in 01 to check the voltage basis.",
      "Die absolute PLQY des 04-Referenzgeräts in 01 eingeben, um die Spannungsbasis zu prüfen.",
      "请在 01 输入 04 参考器件的绝对 PLQY，以核对内部电压。")};
    const radiative=radiativeAt(pair.temperature);
    if(!radiative)return {message:T(
      "Check the optical inputs in 01 before saving a 04 reference.",
      "Vor dem Speichern einer 04-Referenz die optischen Eingaben in 01 prüfen.",
      "保存 04 参考前，请检查 01 的光学输入。")};
    const expected=window.PLVoltage.calculate({
      mode:"absolute",temperature:pair.temperature,plqy:referencePLQY,
      generation:radiative.generation,j0rad:radiative.j0rad
    }).voltage;
    const gap=Math.abs(pair.implied-expected);
    if(gap>referenceTolerance){
      const difference=fmt(1000*gap,1)+" mV";
      return {message:pair.plqy!=null
        ?T("04 and 01 differ by "+difference+" in iVoc. Copy the optical inputs from 01 into 04 before saving.",
          "04 und 01 weichen bei iVoc um "+difference+" ab. Vor dem Speichern die optischen Eingaben aus 01 in 04 übernehmen.",
          "04 与 01 算出的 iVoc 相差 "+difference+"。请先在 04 使用模块 01 的光学参数。")
        :T("04 and 01 differ by "+difference+" in iVoc. Check the reference PLQY and optical inputs.",
          "04 und 01 weichen bei iVoc um "+difference+" ab. Referenz-PLQY und optische Eingaben prüfen.",
          "04 与 01 的 iVoc 相差 "+difference+"。请核对参考器件的 PLQY 与光学输入。")};
    }
    const message=pair.plqy==null?T(
      "Confirm that the PLQY entered in 01 was measured on the 04 reference device at the same temperature.",
      "Bestätigen, dass die in 01 eingegebene PLQY am 04-Referenzgerät bei gleicher Temperatur gemessen wurde.",
      "保存前请确认 01 填写的 PLQY 来自 04 的同一参考器件，且测量温度一致。"):"";
    return {reference:{...candidate,source:candidate.source+" · "+radiative.source},message};
  }
  function renderReference(){
    const candidate=readPLReference();
    usePLReference.disabled=!candidate.reference;
    plReferenceStatus.textContent=candidate.message??"";
    clearReference.disabled=!reference;
    referenceValue.textContent=reference?fmt(reference.loss*1000,1)+" mV":"—";
    referenceSource.textContent=reference
      ?reference.source+" · iVoc "+fmt(reference.implied,4)+"\u00a0V · Voc "+fmt(reference.voc,4)+"\u00a0V · "+reference.temperature+"\u00a0K"
      :"";
  }


  function opticalContext(kelvin=temperature.valueAsNumber){
    const eqe=useEqe.checked?inputs.eqe?.():null;
    return {eg:$("bg-eg").valueAsNumber,temperature:kelvin,eqe,
      eqePercent:eqe?null:$("bg-collection").valueAsNumber};
  }
  function sameOpticalBasis(a,b){
    return Object.is(a.eg,b.eg)&&a.eqe?.identity===b.eqe?.identity&&Object.is(a.eqePercent,b.eqePercent);
  }
  function sameContext(a,b){
    return a.temperature===b.temperature&&sameOpticalBasis(a,b);
  }
  function opticalBasis({eg,eqe,eqePercent}){
    return {eg,eqeIdentity:eqe?.identity,eqePercent};
  }
  inputs.opticalBasis=()=>opticalBasis(opticalContext());
  function eqeName(eqe){
    return eqe.source==="Supplied workbook example"
      ?T("Workbook example","Beispieldaten aus der Arbeitsmappe","工作簿示例"):eqe.source;
  }
  const radiativeAt=kelvin=>{
    const context=opticalContext(kelvin), {eg,eqe,eqePercent}=context;
    if(!eqe&&!(eg>=.5&&eg<=3))return null;
    try{
      const result=eqe?M.eqeVoc(data.spectrum,eqe.points,kelvin):M.bandgapVoc(data.spectrum,eg,kelvin,eqePercent/100);
      if(!(result.jsc>0))return null;
      let basisLabel;
      if(eqe)basisLabel="02 EQE · "+eqeName(eqe);
      else basisLabel=(eqePercent===100?"SQ":"EQE "+fmt(eqePercent,1)+"%")+" · Eg = "+fmt(eg,3)+" eV";
      return {generation:result.jsc,j0rad:result.j0rad,basis:opticalBasis(context),source:basisLabel};
    }catch{return null;}
  };
  inputs.radiativeAt=radiativeAt;
  function clearPair(){
    if(!pairedJV)return;
    pairedJV=null;
    useJv.checked=false;
    jvStatus.textContent=T("The scan, measurement temperature or optical inputs changed. Confirm the pairing again.",
      "Scan, Messtemperatur oder optische Eingaben geändert. Den Vergleich erneut bestätigen.",
      "扫描、测量温度或光学输入已变更。请重新确认配对。");
  }

  let curveTemperature, curveCollection, voltageCurve, sqCurve;

  function show(metric,value,unit="V",digits=3){
    metric.textContent=fmt(value,digits)+" "+unit;
    metric.parentElement.hidden=false;
  }

  function update(){
    currentJVReference=null;
    useJVReference.disabled=true;
    renderReference();
    const context=opticalContext(), {eg,temperature:kelvin,eqe}=context;
    if(!lastBasis||!sameOpticalBasis(lastBasis,context)){
      lastBasis=context;
      window.dispatchEvent(new Event("bandgap:optics"));
    }
    useEqe.disabled=!inputs.eqe?.();
    const absolute=inputs.absolutePLQY?.(), scan=inputs.illuminatedJv?.();
    const validBandgap=eg>=.5&&eg<=3;
    const validTemperature=kelvin>=200&&kelvin<=400;
    const hasGeneration=(eqe?.jsc??bandResult?.jsc)>0;
    plButton.disabled=!(hasGeneration&&absolute&&absolute.temperature>=200&&absolute.temperature<=400);
    useJv.disabled=!(scan&&validTemperature&&hasGeneration);
    if(importedPL&&(!absolute||absolute.plqy!==importedPL.plqy||
      absolute.temperature!==importedPL.temperature||absolute.sampleId!==importedPL.sampleId||
      !sameContext(importedPL.context,context))){
      importedPL=null;
      plqy.value="";
      plStatus.textContent=T("The source or optical inputs changed. Copy the PLQY again.",
        "Quelle oder optische Eingaben geändert. PLQY erneut übernehmen.",
        "来源或光学输入已变更。请重新导入 PLQY。");
      clearPair();
    }
    if(pairedJV&&(!scan||scan.identity!==pairedJV.identity||
      !Object.is(scan.temperature,pairedJV.temperature)||!sameContext(pairedJV.context,context)))clearPair();
    const measurement=pairedJV?scan:null;
    for(const [index,metric] of metrics.entries()){
      metric.textContent="—";
      metric.parentElement.hidden=index!==0;
    }
    selectedMetric.textContent="—";
    selectedNote.textContent="";
    status.textContent="";
    spectrum.hidden=!eqe;
    spectrumVoc.textContent="—";
    const referenceEg=referenceGap.valueAsNumber, validGap=referenceEg>=.5&&referenceEg<=3;
    if(eqe){
      spectrumJsc.innerHTML=fmt(eqe.jsc,4)+'<small> mA/cm²</small>';
      source.textContent=eqeName(eqe)+" · "+fmt(eqe.points[0][0],1)+"–"+fmt(eqe.points.at(-1)[0],1)+" nm";
      spectrumNote.textContent=!validTemperature
        ?T("Requires a temperature of 200–400 K","Temperatur von 200–400 K erforderlich","需要 200–400 K 的电池温度")
        :eqe.jsc>0
          ?fmt(kelvin,2)+" K · "+T("Radiative recombination","Strahlende Rekombination","仅计辐射复合")
          :T("Requires a positive EQE signal","Positives EQE-Signal erforderlich","需要非零 EQE 响应");
      if(validGap)referenceGap.removeAttribute("aria-invalid");
      else referenceGap.setAttribute("aria-invalid","true");
      curveNote.textContent=validGap
        ?T("The reference starts at the selected bandgap when EQE is enabled. The open circle uses the original spectrum. Other points use a shift in photon energy.",
          "Die Referenz übernimmt beim Aktivieren der EQE die gewählte Bandlücke. Der offene Kreis beruht auf dem Originalspektrum. Die anderen Punkte nutzen eine Verschiebung der Photonenenergie.",
          "启用时取当时所选的带隙，可改为样品的带隙。图中空心圆用原光谱计算，其余点按光子能量平移光谱。")
        :T("Enter a reference bandgap of 0.5–3.0 eV to plot the EQE curve.",
          "Eine Referenzbandlücke von 0,5–3,0 eV für die EQE-Kurve eingeben.",
          "请输入 0.5–3.0 eV 的参考带隙以绘制 EQE 曲线。");
    }
    for(const input of [temperature,plqy])input.removeAttribute("aria-invalid");
    jvSource.textContent="";
    if(measurement){
      const recordedT=measurement.temperature;
      const hasTemperature=Number.isFinite(recordedT)&&recordedT>0;
      const notes=[];
      if(recordedT==null)notes.push(T(
        "06 temperature is missing. Confirm that the measurements were made at the same temperature.",
        "Messtemperatur in 06 fehlt. Gleiche Messtemperatur bestätigen.",
        "06 未填写测量温度。请确认两项测量的温度一致。"));
      else if(!hasTemperature)notes.push(T(
        "Enter a positive measurement temperature in 06 to save the reference.",
        "Zum Speichern der Referenz eine positive Messtemperatur in 06 eingeben.",
        "请在 06 填写有效的测量温度后再保存参考。"));
      else if(recordedT!==kelvin)notes.push(T(
        "The 06 scan temperature differs from 01. Use a scan at the same temperature to save a reference.",
        "Die Scan-Temperatur in 06 weicht von 01 ab. Für eine Referenz einen Scan bei gleicher Temperatur verwenden.",
        "06 的扫描温度与 01 不同。保存参考须使用相同温度的扫描。"));
      if(measurement.pin!==100)notes.push(T(
        "06 differs from the nominal 100 mW/cm² used in 01. Check that excitation is equivalent before saving a reference.",
        "06 weicht von den nominellen 100 mW/cm² in 01 ab. Vor dem Speichern äquivalente Anregung prüfen.",
        "06 的光强与 01 采用的标称 100 mW/cm² 不同。保存参考前请核对激发条件是否等效。"));
      jvStatus.textContent=notes.join(" ");
      jvSource.textContent="06 · "+measurement.source+" · "+measurement.scan+
        " · Jsc "+fmt(measurement.jsc)+" mA/cm² · Pᵢₙ "+fmt(measurement.pin)+" mW/cm²"+
        (hasTemperature?" · T = "+recordedT+" K":"");
      show(measuredVoltage,measurement.voc);
    }
    if(!validTemperature){
      temperature.setAttribute("aria-invalid","true");
      status.textContent=T("Enter a cell temperature of 200–400 K.","Eine Zelltemperatur von 200–400 K eingeben.","请输入 200–400 K 的电池温度。");
    }
    let radiative, voltage, eqeCurve, sqReference;
    try{
      if(validTemperature){
        if(curveTemperature!==kelvin){
          sqCurve=M.bandgapVocCurve(bandgapCurrents,kelvin);
          curveTemperature=kelvin;
          curveCollection=undefined;
        }
        sqReference=sqCurve;
      }
      if(validTemperature&&validBandgap){
        const sq=M.bandgapVoc(data.spectrum,eg,kelvin);
        show(sqVoltage,sq.voc,"V",4);
        if(bandResult){
          const collection=bandResult.eqePercent/100;
          radiative=collection===1?sq:M.bandgapVoc(data.spectrum,eg,kelvin,collection);
          if(curveCollection!==collection){
            voltageCurve=collection===1?sqCurve:M.bandgapVocCurve(bandgapCurrents,kelvin,collection);
            curveCollection=collection;
          }
          show(selectedMetric,radiative.voc,"V",4);
          selectedNote.textContent="EQE "+fmt(bandResult.eqePercent,1)+"%";
          if(collection<1){
            const loss=fmt(1000*(sq.voc-radiative.voc),1)+"\u00a0mV";
            selectedNote.textContent+=" · "+T("−"+loss+" vs SQ","−"+loss+" ggü. SQ","较 SQ 低 "+loss);
          }
          voltage={eg,voc:radiative.voc,temperature:kelvin,points:voltageCurve};
        }
      }
      if(validTemperature&&eqe){
        radiative=eqe.jsc>0?M.eqeVoc(data.spectrum,eqe.points,kelvin):null;
        if(radiative){
          show(spectrumVoc,radiative.voc,"V",4);
          if(validGap){
            if(!shiftedEQE||shiftedEQE.identity!==eqe.identity||shiftedEQE.eg!==referenceEg||shiftedEQE.temperature!==kelvin){
              const grid=bandgapCurrents.filter((_,index)=>index%5===0).map(([gap])=>gap);
              const bandgaps=[...new Set([...grid,referenceEg])].sort((a,b)=>a-b);
              const points=M.eqeVocCurve(data.spectrum,eqe.points,kelvin,referenceEg,bandgaps);
              shiftedEQE={identity:eqe.identity,eg:referenceEg,temperature:kelvin,voc:radiative.voc,points,source:eqeName(eqe)};
            }
            eqeCurve=shiftedEQE;
          }
        }
      }
    }catch{
      status.textContent=T("Check the calculation inputs and EQE coverage.","Eingaben und EQE-Wellenlängenbereich prüfen.","请检查输入和 EQE 的波长覆盖范围。");
      radiative=null;
    }
    drawBandgap(voltage,eqeCurve,sqReference);
    if(!radiative)return;

    const percent=plqy.valueAsNumber;
    if(plqy.value===""&&!plqy.validity.badInput)return;
    if(!(percent>0&&percent<=100)){
      plqy.setAttribute("aria-invalid","true");
      status.textContent=T("Absolute PLQY must be above 0% and at most 100%.","Die absolute PLQY muss über 0 % und höchstens bei 100 % liegen.","绝对 PLQY 应大于 0% 且不超过 100%。");
      return;
    }
    if(!(radiative.jsc>0)){
      status.textContent=T("A positive EQE is needed to estimate iVoc.","Für die iVoc-Schätzung ist eine positive EQE nötig.","估算 iVoc 需要大于 0% 的 EQE。");
      return;
    }
    const implied=window.PLVoltage.calculate({mode:"absolute",temperature:kelvin,
      generation:radiative.jsc,j0rad:radiative.j0rad,plqy:percent}).voltage;
    if(!(implied>0)){
      status.textContent=T("These inputs give no positive implied Voc.","Diese Eingaben ergeben keine positive implizite Leerlaufspannung.","当前输入未得到正的内部等效电压。");
      return;
    }
    show(impliedVoltage,implied);
    if(measurement){
      show(voltageDifference,1000*(implied-measurement.voc),"mV",1);
      if(measurement.temperature==null||measurement.temperature===kelvin){
        const scanSource="06 · "+measurement.source+" · "+measurement.scan+
          " · Pᵢₙ "+fmt(measurement.pin)+" mW/cm²";
        currentJVReference=makeReference(implied,measurement.voc,kelvin,scanSource);
        useJVReference.disabled=!currentJVReference;
      }
    }
    if(!reference)return;
    if(kelvin!==reference.temperature){
      status.textContent=T("Choose a reference at the target temperature.","Eine Referenz bei der Zieltemperatur auswählen.","请选择与目标温度一致的标定参考。");
      return;
    }
    if(reference.loss>=implied){
      status.textContent=T("The reference loss is larger than or equal to the target iVoc.",
        "Der Referenzverlust ist größer als oder gleich dem Ziel-iVoc.","参考损失已达到或超过目标 iVoc。");
      return;
    }
    terminalTitle.textContent=implied===reference.implied
      ?T("Recalculated reference Voc","Nachgerechneter Referenz-Voc","参考端电压复算")
      :T("Estimated terminal Voc","Geschätzte Leerlaufspannung an den Kontakten","器件端开路电压估算");
    show(terminalVoltage,implied-reference.loss);
  }

  useJVReference.addEventListener("click",()=>{
    if(currentJVReference){
      reference=currentJVReference;
      update();
    }
  });
  usePLReference.addEventListener("click",()=>{
    const candidate=readPLReference();
    if(candidate.reference){
      reference=candidate.reference;
      update();
    }
  });
  clearReference.addEventListener("click",()=>{
    reference=null;
    update();
  });
  temperature.addEventListener("input",update);
  plqy.addEventListener("input",()=>{
    importedPL=null;
    plStatus.textContent="";
    if(reference)clearPair();
    update();
  });
  plButton.addEventListener("click",()=>{
    const absolute=inputs.absolutePLQY?.();
    if(!absolute||plButton.disabled)return;
    clearPair();
    temperature.value=absolute.temperature;
    plqy.value=absolute.plqy;
    importedPL={...absolute,context:opticalContext()};
    plStatus.textContent="04 · PLQY "+absolute.plqy+"% · "+absolute.temperature+" K"+
      (absolute.sampleId?" · "+absolute.sampleId:"");
    update();
  });
  useJv.addEventListener("change",()=>{
    const scan=inputs.illuminatedJv?.();
    pairedJV=useJv.checked&&scan?{identity:scan.identity,temperature:scan.temperature,context:opticalContext()}:null;
    jvStatus.textContent="";
    update();
  });
  window.addEventListener("bandgap:pl",update);
  window.addEventListener("bandgap:jv",update);
  document.addEventListener("input",event=>{
    if(event.target.id==="pl-comparison-sample")update();
  });
  referenceGap.addEventListener("input",update);
  useEqe.addEventListener("change",()=>{
    eqeStatus.textContent="";
    if(useEqe.checked&&referenceGap.value==="")referenceGap.value=$("bg-eg").value;
    update();
  });
  window.addEventListener("bandgap:eqe",()=>{
    if(useEqe.checked)eqeStatus.textContent=T("The EQE data changed. Select it again to use the new spectrum.","Die EQE-Daten wurden geändert. Erneut auswählen, um das neue Spektrum zu verwenden.","EQE 数据已变更。请重新选择后用于计算。");
    useEqe.checked=false;
    referenceGap.value="";
    shiftedEQE=null;
    update();
  });
  return update;
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
'</div><div class="rl-output"><div class="rl-chart-heading"><div><h3 id="bg-voc" data-literal>'+T("Bandgap vs. Jsc and Voc","Bandlücke, Jsc und Voc","带隙与 Jsc、Voc")+'</h3><p class="rl-small">AM1.5G · step-edge absorption model</p></div></div>'+
  '<dl class="rl-metrics sp-bandgap-metrics" aria-live="polite" aria-atomic="true">'+
    '<div><dt>Calculated Jsc</dt><dd id="bg-jsc"></dd><span class="rl-metric-note" id="bg-eqe-note"></span></div>'+
    '<div data-literal><dt>'+T("Estimated Voc","Geschätzter Voc","估算 Voc")+'</dt><dd id="bg-voc-selected">—</dd><span class="rl-metric-note" id="bg-voc-selected-note"></span></div>'+
    '<div><dt>Absorption cutoff</dt><dd id="bg-cutoff"></dd><span class="rl-metric-note">λɡ = hc / Eɡ</span></div>'+
    '<div><dt>100% EQE limit</dt><dd id="bg-limit"></dd><span class="rl-metric-note">Same bandgap</span></div></dl>'+
  '<p class="sp-summary" id="bg-table-value"></p><div class="sp-row"><button class="rl-action" type="button" id="bg-export">Export bandgap curve ↓</button><button class="rl-action" type="button" id="bg-to-lab">Use Jsc in resistance lab ↑</button><button class="rl-action" type="button" id="bg-voc-to-lab" data-literal disabled>'+T("Use uniform-EQE Jsc and Voc in 03","Jsc und Voc bei konstanter EQE in 03 verwenden","将均匀 EQE 的 Jsc 与 Voc 用于 03")+'</button></div>'+
'</div></div></div><details class="rl-method"><summary>Bandgap model &amp; source table</summary><p class="rl-equation">λɡ = hc / (q Eɡ) · Jsc = q ∫₂₈₀ⁿᵐ^λɡ Φ(λ) EQE dλ</p><p>EQE is constant above the bandgap and zero below it. Every collected photon contributes one electron. This is a photocurrent ceiling for the selected spectrum and EQE, not an efficiency limit or a prediction of Voc.</p><p>The spectral Jsc curve integrates the supplied AM1.5G spectrum using hc/q = 1239.841984 eV·nm. The Jsc reference-table curve preserves all 251 values from the supplied bandgap table (0.50–3.00 eV). That workbook contains values without calculation formulas; its full derivation cannot be recovered. It uses a different approximate wavelength conversion and stepwise current values. At 100% EQE, the integrated Jsc and the reference table differ by up to 1.1194 mA/cm². The available evidence is insufficient to attribute this difference solely to rounding. The table is an independent comparison and is not used to calibrate the integral. Between listed bandgaps, the table comparison is linearly interpolated.</p><p>Source: <span>bandgap for Jsc.xlsx, Sheet1</span>; spectral irradiance: <span>ASTMG173_and_Integrated_Jsc_modified2.xls, SMARTS2, global tilt column</span>. All 251 table rows and 2,002 spectral samples were checked against the original files. <a href="https://www.nlr.gov/grid/solar-resource/spectra-am1.5" target="_blank" rel="noopener noreferrer">ASTM G173-03 reference spectrum ↗</a>.</p></details>';
const curve=Array.from({length:251},(_,i)=>{const eg=.5+i*.01;return [eg,M.bandgap(data.spectrum,eg).ideal];});
const table=data.bandgapTable.map(p=>[p[0],p[2]]);
const axes={xmin:.5,xmax:3,ymax:70,xdigits:1,ylabel:"Jsc (mA/cm²)",
  xlabel:T("Bandgap (eV)","Bandlücke (eV)","带隙（eV）"),
  right:{ymax:3,ydigits:1,label:"Voc (V)"}};
const modelLink=$("bg-voc-to-lab");
let selectedVoltage=null, selectedEQECurve=null, selectedSQCurve=null;
modelLink.title=T("03 accepts 1–60 mA/cm² and 0.2–2.0 V.",
  "03 akzeptiert 1–60 mA/cm² und 0,2–2,0 V.","03 的输入范围为 1–60 mA/cm² 和 0.2–2.0 V。");
const updateVoc=mountBandgapVoc(bandRoot,curve,drawBandgap);

function drawBandgap(voltage,eqeCurve,sqReference){
  selectedVoltage=voltage;
  selectedEQECurve=eqeCurve;
  selectedSQCurve=sqReference;
  const limits=window.SolarResistance?.limits;
  modelLink.disabled=!(limits&&bandResult&&voltage&&
    [["voc",voltage.voc],["jph",bandResult.jsc]].every(([key,value])=>value>=limits[key][0]&&value<=limits[key][1]));
  const series=[], showTable=Boolean(bandResult&&$("bg-show-table").checked);
  $("bg-curve-legend").hidden=!bandResult;
  $("bg-table-legend").hidden=!showTable;
  $("bg-sq-voc-legend").hidden=!sqReference;
  $("bg-voc-legend").hidden=!voltage;
  $("bg-eqe-voc-legend").hidden=!eqeCurve;
  if(bandResult){
    const percent=bandResult.eqePercent;
    if(showTable)series.push({points:table,dashed:true});
    series.push({points:curve.map(([eg,jsc])=>[eg,jsc*percent/100]),className:"sp-jsc-curve"});
    $("bg-curve-legend").textContent=T("Integrated Jsc","Integrierter Jsc","光谱积分 Jsc")+" · EQE "+fmt(percent,1)+"%";
  }
  if(sqReference)series.push({points:sqReference,secondary:true,
    className:"sp-sq-voc-curve",color:"var(--sp-sq-voc-color)"});
  if(voltage){
    series.push({points:voltage.points,secondary:true,className:"sp-voc-curve",color:"var(--sp-voc-color)"});
    $("bg-voc-legend").textContent=T("Uniform EQE Voc (fixed J₀,rad)","Voc bei konstanter EQE (festes J₀,rad)","均匀 EQE Voc（固定 J₀,rad）")+
      " · "+fmt(voltage.temperature,2)+" K"+
      (voltage.points===sqReference?T(" · overlaps SQ"," · deckungsgleich mit SQ"," · 与 SQ 重合"):"");
  }
  let rightMax=axes.right.ymax;
  if(eqeCurve){
    series.push({points:eqeCurve.points,secondary:true,reference:[eqeCurve.eg,eqeCurve.voc],
      className:"sp-eqe-voc-curve",color:"var(--sp-eqe-voc-color)"});
    $("bg-eqe-voc-legend").textContent=T("Imported EQE Voc (energy shift)","Voc aus importierter EQE (Energieverschiebung)","导入 EQE 的 Voc（光谱平移）")+
      " · "+fmt(eqeCurve.temperature,2)+" K";
    for(const [,voc] of eqeCurve.points)if(voc>rightMax)rightMax=Math.ceil(voc);
  }
  $("bg-combined-plot").hidden=!series.length;
  if(!series.length){
    $("bg-chart").replaceChildren();
    return;
  }
  const plotAxes={...axes,right:{...axes.right,ymax:rightMax}};
  chart("bg-chart",series,plotAxes,bandResult?{
    x:bandResult.eg,primary:bandResult.jsc,secondary:voltage?.voc
  }:null);
}

function updateBandgap(){
  const eg=$("bg-eg").valueAsNumber,percent=$("bg-collection").valueAsNumber;
  try{
    bandResult={...M.bandgap(data.spectrum,eg,percent/100),eqePercent:percent};
    $("bg-eg").removeAttribute("aria-invalid");$("bg-collection").removeAttribute("aria-invalid");
    $("bg-message").textContent="";$("bg-message").dataset.error="false";
    $("bg-eg-slider").value=eg;$("bg-collection-slider").value=percent;
    $("bg-eg-slider").setAttribute("aria-valuetext",eg+" electron volts");$("bg-collection-slider").setAttribute("aria-valuetext",percent+" percent");
    $("bg-cutoff").innerHTML=fmt(bandResult.cutoff,1)+'<small> nm</small>';
    $("bg-jsc").innerHTML=fmt(bandResult.jsc)+'<small> mA/cm²</small>';
    $("bg-limit").innerHTML=fmt(bandResult.ideal)+'<small> mA/cm²</small>';
    $("bg-eqe-note").textContent="Uniform EQE: "+fmt(percent,1)+"%";
    const lookup=M.interpolate(table,eg);
    $("bg-table-value").textContent="At "+fmt(eg,3)+" eV: supplied table "+fmt(lookup)+" mA/cm²; spectrum integral at 100% EQE "+fmt(bandResult.ideal)+" mA/cm².";
    $("bg-export").disabled=false;$("bg-to-lab").disabled=bandResult.jsc<1||bandResult.jsc>60;
  }catch(e){bandResult=null;$("bg-message").textContent=e.message;$("bg-message").dataset.error="true";$("bg-export").disabled=true;$("bg-to-lab").disabled=true;
    $("bg-eg").setAttribute("aria-invalid",String(!Number.isFinite(eg)||eg<.5||eg>3));$("bg-collection").setAttribute("aria-invalid",String(!Number.isFinite(percent)||percent<0||percent>100));
    ["bg-cutoff","bg-jsc","bg-limit"].forEach(id=>$(id).textContent="—");
    $("bg-eqe-note").textContent="";
    $("bg-table-value").textContent="Enter valid inputs to calculate.";
  }
  updateVoc();
}
["bg-eg","bg-collection"].forEach(id=>$(id).addEventListener("input",updateBandgap));
["bg-eg","bg-collection"].forEach(id=>$(id+"-slider").addEventListener("input",()=>{$(id).value=$(id+"-slider").value;updateBandgap();}));
$("bg-show-table").addEventListener("change",updateBandgap);
bandRoot.querySelectorAll("[data-eg]").forEach(b=>b.addEventListener("click",()=>{$("bg-eg").value=b.dataset.eg;updateBandgap();}));
$("bg-to-lab").addEventListener("click",()=>{if(bandResult)transfer(bandResult.jsc,$("bg-message"));});
modelLink.addEventListener("click",()=>{
  if(modelLink.disabled)return;
  const {eg,voc,temperature}=selectedVoltage;
  transfer(bandResult.jsc,$("bg-message"),{eg,voc,temperature,eqePercent:bandResult.eqePercent});
});
$("bg-export").addEventListener("click",()=>{
  if(!bandResult)return;
  const fraction=bandResult.eqePercent/100;
  saveCSV("bandgap-jsc.csv",[
    ["spectrum",data.meta.spectrum],["uniform_EQE_percent",bandResult.eqePercent],
    ["method","Piecewise-linear irradiance, exact per-interval Simpson integration"],
    ["temperature_K",selectedVoltage?.temperature??""],
    ["Voc_basis","EQE-scaled photocurrent at fixed radiative dark current"],[],
    ["bandgap_eV","cutoff_nm","ideal_Jsc_mA_cm2","selected_EQE_Jsc_mA_cm2","supplied_table_Jsc_mA_cm2","selected_EQE_Voc_V","SQ_Voc_100pct_EQE_V"],
    ...curve.map(([eg,jsc],index)=>[eg,M.HC_EV_NM/eg,jsc,jsc*fraction,M.interpolate(table,eg),
      selectedVoltage?.points[index][1]??"",selectedSQCurve?.[index][1]??""]),
    ...(selectedEQECurve?[
      [],["EQE_source",/^\s*[=+@-]/.test(selectedEQECurve.source)?"'"+selectedEQECurve.source:selectedEQECurve.source],
      ["EQE_reference_bandgap_eV",selectedEQECurve.eg],
      ["EQE_temperature_K",selectedEQECurve.temperature],
      ["EQE_curve_method","Photon-energy shift of imported EQE samples by Eg minus the reference Eg"],
      ["bandgap_eV","EQE_shifted_Voc_V"],...selectedEQECurve.points.map(([eg,voc])=>[eg,voc??""])
    ]:[])
  ]);
});
updateBandgap();
}
const eqRoot=$("eqe-calculator");
if(eqRoot){
let result=null,eqePoints=null,source="example",sourceName="",plot="eqe",fileVersion=0;
const pastedSource=()=>document.documentElement.lang==='de'?"Eingefügte EQE-Daten":document.documentElement.lang.startsWith('zh')?"粘贴的 EQE 数据":"Pasted EQE data";
const sourceLabel=()=>source==="example"?"Supplied workbook example":sourceName||pastedSource();
window.BandgapInputs=window.BandgapInputs||{};
window.BandgapInputs.eqe=()=>eqePoints&&result
  ?{points:eqePoints,identity:eqePoints,source:sourceLabel(),jsc:result.jsc}
  :null;
eqRoot.innerHTML='<div class="sp-shell"><div class="rl-main"><div class="rl-controls">'+
  '<h3>Your EQE spectrum</h3><p class="rl-small">Paste two columns from Excel or import a CSV, TSV or TXT file. Wavelength must be in nm.</p>'+
  '<div class="rl-field sp-wide calc-import"><div class="calc-import-toolbar"><button id="eq-file-choose" type="button" class="rl-action" aria-describedby="eq-file-name">Choose file</button><button type="button" class="rl-action" id="eq-example">Load workbook example</button><button type="button" class="rl-action calc-quiet" id="eq-clear">Clear</button></div><p id="eq-file-name" class="rl-small calc-file-status" role="status">No file selected</p><label for="eq-data">Wavelength (nm) &amp; EQE</label><textarea id="eq-data" spellcheck="false" aria-describedby="eq-format eq-message" placeholder="Wavelength_nm,EQE_percent&#10;400,80&#10;500,90&#10;600,85"></textarea><p class="rl-small" id="eq-format">Two columns separated by tabs, commas, semicolons or spaces. An optional wavelength / EQE header is accepted. Use a decimal point.</p><input id="eq-file" type="file" hidden aria-label="Import EQE text data" accept=".csv,.tsv,.txt,text/csv,text/plain"></div>'+
  '<div class="rl-field sp-wide"><label for="eq-unit">EQE values are in</label><select id="eq-unit"><option value="percent">Percent (%) · 0–100</option><option value="fraction">Fraction · 0–1</option></select><p class="rl-small sp-unit-help">Choose Fraction for decimal values such as 0.82; choose Percent for values such as 82. The selected unit is applied when calculating.</p></div>'+
  '<div class="sp-row calc-actions"><button type="button" class="rl-action sp-calculate" id="eq-calculate">Integrate EQE</button></div>'+
  '<p class="sp-message" id="eq-message" role="status"></p>'+
'</div><div class="rl-output sp-result" id="eq-output"><div class="rl-chart-heading"><div><h3 id="eq-chart-title">External quantum efficiency</h3><p class="rl-small" id="eq-source"></p></div></div>'+
  '<div class="sp-chart-switch" role="group" aria-label="EQE chart type"><button type="button" data-eq-plot="eqe" aria-pressed="true">EQE</button><button type="button" data-eq-plot="cumulative" aria-pressed="false">Cumulative Jsc</button><button type="button" data-eq-plot="density" aria-pressed="false">Spectral current</button></div>'+
  svg("eq-chart","EQE spectrum or its cumulative integrated short-circuit current")+
  '<dl class="rl-metrics" aria-live="polite" aria-atomic="true"><div><dt>Integrated Jsc</dt><dd id="eq-jsc"></dd><span class="rl-metric-note">AM1.5G</span></div><div><dt>Integration interval</dt><dd id="eq-span"></dd><span class="rl-metric-note">nm · supplied data overlap</span></div><div><dt>Photon-weighted EQE</dt><dd id="eq-weighted"></dd><span class="rl-metric-note">Within this interval</span></div></dl>'+
  '<p class="sp-summary" id="eq-coverage"></p><p class="sp-caption" id="eq-legacy"></p>'+
  '<div class="sp-row"><button type="button" class="rl-action" id="eq-export">Export integral data ↓</button><button type="button" class="rl-action" id="eq-to-lab">Use Jsc in resistance lab ↑</button>'+
  '<button type="button" class="rl-action" id="eq-to-bandgap" data-literal disabled>'+T("View Jsc and radiative Voc in 01","Jsc und Strahlungs-Voc in 01 anzeigen","在 01 查看 Jsc 与辐射 Voc")+'</button></div>'+
  '<p class="sp-caption">Your imported or pasted EQE stays in this browser.</p>'+
'</div></div></div><details class="rl-method"><summary>EQE integration, coverage &amp; units</summary>'+
  '<p class="rl-equation">Jsc = q ∫ Φ(λ) EQE(λ) dλ = (q/hc) ∫ Eλ(λ) λ EQE(λ) dλ</p>'+
  '<p>The selected reference is ASTM G173-03 AM1.5G global tilt from the supplied workbook’s SMARTS2 sheet: 2,002 points from 280 to 4,000 nm. Irradiance is in W·m⁻²·nm⁻¹, wavelength in nm, EQE a fraction, and output in mA/cm². The conversion factor multiplying ∫Eλ λ EQE dλ is q/(hc) × 10⁻¹⁰. The spectrum integrates to '+fmt(data.meta.power_W_m2,4)+' W/m² and is used without renormalization.</p>'+
  '<p>All irradiance and EQE wavelength points are merged. Irradiance and EQE are each linearly interpolated between samples. Simpson integration on each interval exactly integrates the resulting cubic expression. This retains the original spectral resolution and accepts irregular EQE spacing.</p>'+
  '<p>The integral covers only the overlap between the reference spectrum and the supplied EQE span. EQE is assumed zero outside that span; missing response tails can underestimate a full-device Jsc. Results with nonzero endpoints are flagged. Duplicate wavelengths and values outside the selected EQE unit range are rejected.</p>'+
  '<p>The supplied example contains 181 EQE points from 300 to 1,200 nm. Its original workbook cached 37.2297434 mA/cm²; reintegration on the complete reference spectrum gives 37.2488907 mA/cm². A 5 nm trapezoid calculation with exact constants gives 37.2301072 mA/cm². These differences reflect the integration grid and constants; the original workbook is preserved.</p>'+
  '<p>This calculation does not apply spectral-mismatch corrections, device area corrections or EQE bias-light corrections. It computes short-circuit current density from the entered external quantum efficiency.</p>'+
  '<div class="rl-source-links"><a href="https://www.nlr.gov/grid/solar-resource/spectra-am1.5" target="_blank" rel="noopener noreferrer">Reference AM1.5 spectra ↗</a><a href="https://www.pveducation.org/pvcdrom/solar-cell-operation/quantum-efficiency" target="_blank" rel="noopener noreferrer">PVEducation · Quantum efficiency ↗</a></div></details>';
function empty(message,error=false){
  result=null;eqePoints=null;window.dispatchEvent(new Event("bandgap:eqe"));$("eq-message").textContent=message;$("eq-message").dataset.error=String(error);
  $("eq-data").setAttribute("aria-invalid",String(error));
  ["eq-jsc","eq-span","eq-weighted"].forEach(id=>$(id).textContent="—");
  $("eq-chart").innerHTML="";$("eq-coverage").textContent="";$("eq-legacy").textContent="";$("eq-source").textContent="No current result";
  $("eq-export").disabled=true;$("eq-to-lab").disabled=true;$("eq-to-bandgap").disabled=true;
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
    $("eq-to-bandgap").disabled=!$("bg-voc-use-eqe");
    drawEQE();
    window.dispatchEvent(new Event("bandgap:eqe"));
  }catch(e){empty(e.message,true);}
}
function example(){
  fileVersion++;source="example";sourceName="";$("eq-unit").value="percent";$("eq-file").value="";$("eq-file-name").removeAttribute("data-literal");$("eq-file-name").textContent="No file selected";
  $("eq-data").value="Wavelength_nm,EQE_percent\n"+data.exampleEQE.map(p=>p[0]+","+Number(p[1].toPrecision(12))).join("\n");calculate();
}
$("eq-data").addEventListener("input",()=>{fileVersion++;source="custom";sourceName="";$("eq-file").value="";$("eq-file-name").removeAttribute("data-literal");$("eq-file-name").textContent=pastedSource();empty("Data changed. Select Integrate EQE to update the result.");});
$("eq-unit").addEventListener("change",calculate);
$("eq-calculate").addEventListener("click",calculate);
$("eq-example").addEventListener("click",example);
$("eq-clear").addEventListener("click",()=>{fileVersion++;source="custom";sourceName="";$("eq-data").value="";$("eq-file").value="";$("eq-file-name").removeAttribute("data-literal");$("eq-file-name").textContent="No file selected";empty("Paste two columns or import a CSV, TSV or TXT file.");});
$("eq-file-choose").addEventListener("click",()=>$("eq-file").click());
$("eq-file").addEventListener("change",async()=>{
  const file=$("eq-file").files[0],version=++fileVersion;if(!file)return;
  $("eq-file-name").setAttribute("data-literal","");$("eq-file-name").textContent=file.name;
  empty("Reading EQE file…");
  if(file.size>2000000){empty("Use a file smaller than 2 MB.",true);return;}
  if(!/\.(csv|tsv|txt)$/i.test(file.name)){empty("Save the EQE columns as CSV, TSV or TXT, or paste them directly from Excel.",true);return;}
  try{const text=await file.text();if(version!==fileVersion)return;source="custom";sourceName=file.name;$("eq-data").value=text;calculate();}catch(e){if(version!==fileVersion)return;empty("Unable to read this text file.",true);}
});
eqRoot.querySelectorAll("[data-eq-plot]").forEach(b=>b.addEventListener("click",()=>{plot=b.dataset.eqPlot;drawEQE();}));
$("eq-to-lab").addEventListener("click",()=>{if(result)transfer(result.jsc,$("eq-message"));});
$("eq-to-bandgap").addEventListener("click",()=>{
  const useSpectrum=$("bg-voc-use-eqe");
  if(!result||!useSpectrum||useSpectrum.disabled)return;
  useSpectrum.checked=true;
  useSpectrum.dispatchEvent(new Event("change",{bubbles:true}));
  selectTool("bandgap-jsc",true);
  history.replaceState(null,"","#bg-voc");
  const target=$("bg-eqe-voc-legend").hidden?$("bg-eqe-spectrum"):$("bg-combined-plot");
  target.scrollIntoView({behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth",block:"start"});
});
$("eq-export").addEventListener("click",()=>{
  if(!result)return;
  saveCSV("eqe-integrated-jsc.csv",[["spectrum",data.meta.spectrum],["source",/^\s*[=+@-]/.test(sourceLabel())?"'"+sourceLabel():sourceLabel()],["Jsc_mA_cm2",result.jsc],["interval_nm",result.lo,result.hi],["assumption","EQE zero outside supplied span; no spectrum renormalization"],[],["wavelength_nm","EQE_percent","irradiance_W_m2_nm","spectral_current_mA_cm2_nm","cumulative_Jsc_mA_cm2"],...result.points.map(p=>[p.w,p.eqe*100,p.irradiance,p.density,p.cumulative])]);
});
example();
}
})();
