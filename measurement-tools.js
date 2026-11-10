(function(){
'use strict';
const M=window.MeasurementModel;if(!M)return;
const lang=document.documentElement.lang,T=(en,de,zh)=>lang==='de'?de:lang.startsWith('zh')?zh:en,$=id=>document.getElementById(id);
const esc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=(x,n=4)=>x===Infinity?'∞':Number.isFinite(x)?Math.abs(x)>=10000||Math.abs(x)>0&&Math.abs(x)<.001?x.toExponential(3):Number(x.toFixed(n)).toString():'—';
const safe=x=>/^[=+@-]/.test(String(x).trimStart())?"'"+x:x;
const field=(id,label,value='',extra='')=>'<div class="rl-field"><label for="'+id+'">'+label+'</label><input id="'+id+'" type="number" step="any" value="'+value+'" '+extra+'></div>';
const select=(id,label,options)=>'<div class="rl-field"><label for="'+id+'">'+label+'</label><select id="'+id+'">'+options.map(([v,s])=>'<option value="'+v+'">'+s+'</option>').join('')+'</select></div>';
const button=(id,label,primary=false)=>'<button id="'+id+'" type="button" class="rl-action'+(primary?' sp-calculate':'')+'">'+label+'</button>';
const messages={
 size:T('Use a text file smaller than 2 MB.','Eine Textdatei unter 2 MB verwenden.','请使用小于 2 MB 的文本文件。'),
 columns:T('Use two columns: voltage, then current or current density.','Zwei Spalten verwenden: Spannung, dann Strom oder Stromdichte.','请使用两列：电压，以及电流或电流密度。'),
 header:T('The header must identify voltage and current.','Die Kopfzeile muss Spannung und Strom benennen.','表头应标明电压和电流。'),
 format:T('Check the numeric columns, encoding and decimal points.','Zahlenspalten, Kodierung und Dezimalpunkte prüfen.','请检查数字列、文本编码及小数点；不接受空值或非有限数。'),
 count:T('Use 5–20,000 J–V points; a converted spectrum needs at least two points.','5–20.000 J–V-Punkte verwenden; ein Spektrum benötigt mindestens zwei Punkte.','J–V 需 5–20,000 个点；光谱转换至少需要两个点。'),
 unit:T('Choose supported units; convert unsupported units before importing.','Unterstützte Einheiten wählen; andere Einheiten vor dem Import umrechnen.','请选择支持的单位；其他单位需先换算再导入。'),
 mismatch:T('Selected units conflict with the file header.','Gewählte Einheiten widersprechen der Kopfzeile.','所选单位与文件表头不一致。'),
 pin:T('Enter a positive incident power density.','Eine positive eingestrahlte Leistungsdichte angeben.','请输入正的入射光功率密度。'),
 area:T('Current data needs a positive active area in cm².','Stromdaten benötigen eine positive aktive Fläche in cm².','输入电流 I 时，需要填写正的有效面积（cm²）。'),
 window:T('Use a slope-fit half-width greater than 0 and at most 25% of Voc.','Eine Fit-Halbbreite über 0 bis höchstens 25 % von Voc verwenden.','斜率拟合半宽须大于 0 且不超过 Voc 的 25%。'),
 sweep:T('Use monotonic scans with at least five points each. Separate ambiguous or repeated-voltage scans.','Monotone Scans mit je mindestens fünf Punkten verwenden. Mehrdeutige Scans trennen.','每个扫描需单调电压且至少五个点；请拆分歧义或重复电压的扫描。'),
 zero:T('The scan must include or bracket V = 0; Jsc is not extrapolated.','Der Scan muss V = 0 enthalten oder einschließen; keine Jsc-Extrapolation.','扫描需包含或跨过 V = 0，不外推 Jsc。'),
 jsc:T('Jsc must be nonzero. Check the illuminated scan and units.','Jsc muss ungleich null sein. Beleuchteten Scan und Einheiten prüfen.','Jsc 为零，请检查光照扫描数据及单位。'),
 voc:T('No measured J = 0 crossing: Voc, FF and PCE cannot be extracted. Check the scan range and original data.','Kein gemessener J = 0-Durchgang: Voc, FF und PCE sind nicht bestimmbar. Scanbereich und Originaldaten prüfen.','扫描内没有实测 J = 0 交点，无法提取 Voc、FF 和 PCE。请核对扫描范围及原始数据。'),
 crossings:T('Ambiguous zero crossings on both voltage sides or with substantial current recovery: select a single valid branch.','Mehrdeutige Nulldurchgänge auf beiden Spannungsseiten oder mit deutlichem Stromanstieg: einen gültigen Zweig wählen.','电压两侧均有过零，或过零后电流显著恢复，交点有歧义；请选取单个有效分支。'),
 duplicate:T('Resolve duplicate spectral coordinates before converting.','Doppelte Spektralkoordinaten vor der Umrechnung auflösen.','转换前请处理重复的光谱坐标。'),
 range:T('The data exceeds the numerical range.','Die Daten überschreiten den Zahlenbereich.','数据超出数值范围。'),
 loading:T('Wait for the file to finish loading, or upload / paste valid data above.','Datei vollständig laden lassen oder oben gültige Daten importieren.','请等待文件读取完成，或先在上方上传／粘贴有效数据。')
};
const errorText=e=>messages[e.message]||messages.format;
function plot(svg,points,xLabel,yLabel,overlays=[],marker=null){
 const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);let xmin=Math.min(...xs),xmax=Math.max(...xs),ymin=Math.min(...ys),ymax=Math.max(...ys);
 const pad=(ymax-ymin)*.06||1;ymin-=pad;ymax+=pad;
 if(!(xmax>xmin&&ymax>ymin&&[xmax-xmin,ymax-ymin].every(Number.isFinite)))return false;
 const left=82,right=616,top=30,bottom=233,x=v=>left+(v-xmin)/(xmax-xmin)*(right-left),y=v=>bottom-(v-ymin)/(ymax-ymin)*(bottom-top);
 let content='<title>'+esc(xLabel+' · '+yLabel)+'</title><text x="'+left+'" y="16">'+esc(yLabel)+'</text>';
 for(let i=0;i<5;i++){const xx=xmin+(xmax-xmin)*i/4,yy=ymin+(ymax-ymin)*i/4;content+='<path class="bg-grid" d="M'+x(xx)+' '+top+'V'+bottom+'M'+left+' '+y(yy)+'H'+right+'"/><text x="'+x(xx)+'" y="259" text-anchor="middle">'+fmt(xx,3)+'</text><text x="'+(left-8)+'" y="'+(y(yy)+4)+'" text-anchor="end">'+fmt(yy,3)+'</text>';}
 function path(ps,cls){const stride=Math.max(1,Math.ceil(ps.length/1000));return '<path class="'+cls+'" d="'+ps.filter((_,i)=>i%stride===0||i===ps.length-1).map((p,i)=>(i?'L':'M')+x(p[0])+' '+y(p[1])).join(' ')+'"/>';}
 content+=path(points,'bg-curve');for(const line of overlays)content+=path(line,'bg-fit');
 if(marker)content+='<circle cx="'+x(marker[0])+'" cy="'+y(marker[1])+'" r="5" fill="var(--teal)"/>';
 svg.innerHTML=content+'<text x="350" y="292" text-anchor="middle">'+esc(xLabel)+'</text>';svg.removeAttribute('hidden');return true;
}
const root=$('jv-calculator');
if(root){
 root.setAttribute('data-literal','');
 const units=[['mAcm2','J (mA/cm²)'],['Acm2','J (A/cm²)'],['mA','I (mA)'],['A','I (A)']];
 root.innerHTML='<div class="sp-shell"><div class="rl-main"><div class="rl-controls"><h3>'+T('Measured J–V curve','Gemessene J–V-Kurve','实测 J–V 曲线')+'</h3><div class="calc-import"><div class="calc-import-toolbar">'+button('jv-choose',T('Choose file','Datei auswählen','选择文件'))+button('jv-example',T('Synthetic example','Synthetisches Beispiel','模拟示例'))+'</div><p id="jv-source" class="rl-small calc-file-status" role="status">'+T('No file selected','Keine Datei ausgewählt','未选择文件')+'</p><input id="jv-file" type="file" accept=".csv,.tsv,.txt" hidden><label for="jv-data">'+T('Voltage / current data','Spannungs- / Stromdaten','电压／电流数据')+'</label><textarea id="jv-data" rows="5" spellcheck="false" placeholder="Voltage_V,Current_density_mA/cm2"></textarea><p class="rl-small">'+T('CSV / TSV / TXT, two columns, optional header; decimal point. Max 2 MB / 20,000 points. Forward and reverse scans are kept separate.','CSV / TSV / TXT, zwei Spalten, optionaler Kopf, Dezimalpunkt. Max. 2 MB / 20.000 Punkte. Hin- und Rückscan bleiben getrennt.','CSV／TSV／TXT 两列，可带表头，使用小数点；最多 2 MB／20,000 点。正反扫描分别计算。')+'</p></div>'+
 select('jv-vunit',T('Voltage unit','Spannungseinheit','电压单位'),[['V','V'],['mV','mV']])+select('jv-unit',T('Current input unit','Strom-Eingabeeinheit','电流输入单位'),units)+
 field('jv-area',T('Active area (cm²; required for I)','Aktive Fläche (cm²; für I erforderlich)','有效面积（cm²，输入 I 时必填）'),'','min="0"')+field('jv-pin',T('Incident power (mW/cm²)','Einstrahlung (mW/cm²)','入射光功率密度（mW/cm²）'),'100','min="0"')+
 field('jv-window',T('Slope-fit half-width (% of Voc)','Fit-Halbbreite (% von Voc)','斜率拟合半宽（占 Voc 的 %）'),'5','min="0" max="25"')+
 '<p class="rl-small">'+T('Default power is 1 sun = 100 mW/cm². Current polarity is normalized from J(0).','Standard: 1 Sun = 100 mW/cm². Das Stromvorzeichen wird aus J(0) normiert.','默认 1 sun = 100 mW/cm²；根据 J(0) 自动统一输出电流的正负号。')+'</p><div class="sp-row">'+button('jv-calc',T('Extract parameters','Parameter bestimmen','提取参数'),true)+'</div><p id="jv-message" class="sp-message" role="status"></p></div><div class="rl-output"><h3>'+T('J–V parameters','J–V-Parameter','J–V 参数')+'</h3><dl class="rl-metrics measurement-metrics" aria-live="polite">'+['PCE','Jsc','Voc','FF','Rs','Rsh'].map((k,i)=>'<div><dt>'+k+([4,5].includes(i)?',app':'')+([4,5].includes(i)?' · '+T('slope estimate','Steigungsschätzung','斜率估算'):'')+'</dt><dd id="jv-'+k.toLowerCase()+'">—</dd><span class="rl-metric-note">'+['%','mA/cm²','V','%','Ω·cm²','Ω·cm²'][i]+'</span></div>').join('')+'</dl>'+
 select('jv-scan',T('Displayed scan','Angezeigter Scan','显示的扫描'),[])+
 '<svg id="jv-chart" class="bg-chart" viewBox="0 0 640 300" role="img" aria-label="J–V" hidden></svg><p id="jv-context" class="rl-small"></p><p id="jv-warnings" class="sp-message" role="status"></p><div class="rl-table-wrap"><table class="rl-table"><thead><tr><th scope="col">'+T('Fit','Fit','拟合')+'</th><th scope="col">'+T('Voltage range (V)','Spannungsbereich (V)','电压区间（V）')+'</th><th scope="col">N</th><th scope="col">R²</th></tr></thead><tbody id="jv-fits"></tbody></table></div><p class="rl-small">'+T('Compare the selected scan with module 03; its model parameters change only when you apply the starting-model action there.','Den gewählten Scan mit Modul 03 vergleichen; Modellparameter werden erst durch die dortige Startmodell-Aktion geändert.','将当前扫描送至模块 03 对照；在模块 03 点击建立起始模型后，才会修改模型参数。')+'</p><div class="sp-row">'+button('jv-compare',T('Compare with module 03 →','Mit Modul 03 vergleichen →','与模块 03 对照 →'))+button('jv-export',T('Export parameters & curve ↓','Parameter und Kurve exportieren ↓','导出参数与曲线 ↓'))+'</div></div></div></div><details class="rl-method"><summary>'+T('Method, units & limitations','Methode, Einheiten und Grenzen','方法、单位与适用范围')+'</summary><p>'+T('Jsc and Voc use measured intersections with linear interpolation. The maximum power is the exact maximum of the piecewise-linear measured curve. No endpoint extrapolation. PCE = 100 Pmax / Pin; FF = 100 Pmax / (Jsc |Voc|).','Jsc und Voc werden linear zwischen Messpunkten interpoliert. Pmax ist das exakte Maximum der abschnittsweise linearen Messkurve. Keine Endpunkt-Extrapolation. PCE = 100 Pmax / Pin; FF = 100 Pmax / (Jsc |Voc|).','Jsc、Voc 由实测交点及线性插值得到；Pmax 取分段线性实测曲线的最大值。不外推端点。PCE = 100 Pmax / Pin；FF = 100 Pmax / (Jsc |Voc|)。')+'</p><p>'+T('Rs ≈ −1000/(dJ/dV) near Voc; Rsh ≈ −1000/(dJ/dV) near 0 V, with J in mA/cm². These are apparent differential resistances, not unique single-diode fit parameters. At least three measured points per fit; ∞ means a flat fitted slope. A single scan PCE is not stabilized efficiency.','Rs ≈ −1000/(dJ/dV) nahe Voc; Rsh ≈ −1000/(dJ/dV) nahe 0 V bei J in mA/cm². Dies sind differentielle Näherungswerte, keine eindeutigen Diodenmodellparameter. Mindestens drei Messpunkte je Fit; ∞ bedeutet flache Steigung. Scan-PCE ist kein stabilisierter Wirkungsgrad.','Rs ≈ −1000/(dJ/dV)（Voc 附近）；Rsh ≈ −1000/(dJ/dV)（0 V 附近），J 的单位为 mA/cm²。它们是表观微分电阻估算，不等同于单二极管模型唯一拟合参数。每个区间至少三个实测点；∞ 表示拟合斜率为零。扫描 PCE 不等于稳态效率。')+'</p><p>'+T('For a voltage-independent photocurrent in the one-diode model, Rdiff = −dV/dJ = Rs + 1/(gd + 1/Rsh), with J in A/cm². Near Voc, diode differential resistance contributes; near short circuit, Rdiff ≈ Rs + Rsh only when diode conductance is negligible. Fit-window choice and scan history affect these apparent values.','Bei spannungsunabhängigem Photostrom im Ein-Dioden-Modell gilt Rdiff = −dV/dJ = Rs + 1/(gd + 1/Rsh), mit J in A/cm². Nahe Voc trägt der differentielle Diodenwiderstand bei; am Kurzschluss gilt Rdiff ≈ Rs + Rsh nur bei vernachlässigbarer Diodenleitfähigkeit. Fitfenster und Scanverlauf beeinflussen diese scheinbaren Werte.','在光生电流不随电压变化的单二极管模型下，Rdiff = −dV/dJ = Rs + 1/(gd + 1/Rsh)，此式 J 用 A/cm²。Voc 附近含二极管微分电阻贡献；短路附近仅在二极管电导可忽略时，Rdiff ≈ Rs + Rsh。拟合区间及扫描历史都会影响表观值。')+'</p><p>'+T('Voc retains the input voltage sign. Curves, power and slope fits use the positive generating-voltage magnitude; original polarity is exported. Additional crossings are accepted only when subsequent generating current never exceeds 0.1% of Jsc; the first crossing from 0 V is then used with a warning. This threshold is a software rule, not instrument uncertainty.','Voc behält das Eingangsvorzeichen. Kurven, Leistung und Fits verwenden den positiven Generator-Spannungsbetrag; die Originalpolarität wird exportiert. Weitere Durchgänge werden nur akzeptiert, wenn der spätere Generatorstrom 0,1 % von Jsc nicht überschreitet; dann gilt der erste Durchgang ab 0 V mit Warnung. Diese Softwareregel ist keine Geräteunsicherheit.','Voc 保留输入电压正负号；曲线、功率和斜率拟合按正向发电电压的大小计算，导出保留原始极性。仅当后续发电电流不超过 Jsc 的 0.1% 时，允许额外过零并带提示采用从 0 V 出发的首个交点。此阈值是软件判据，不代表仪器测量不确定度。')+'</p><div class="rl-source-links"><a href="https://doi.org/10.1016/0038-1101(81)90062-9" target="_blank" rel="noopener noreferrer">Green · Solid-State Electronics (1981) ↗</a><a href="https://doi.org/10.1016/j.solmat.2008.01.003" target="_blank" rel="noopener noreferrer">Smestad et al. · Solar Energy Materials and Solar Cells (2008) ↗</a><a href="https://doi.org/10.1002/pssa.201800448" target="_blank" rel="noopener noreferrer">Tada · Phys. Status Solidi A (2018) ↗</a></div></details>';
 let results=null,fileVersion=0,source=T('Pasted J–V data','Eingefügte J–V-Daten','粘贴的 J–V 数据');
 const warning=code=>code==='noise_crossings'?T('Used the first zero crossing from 0 V; later generating-current excursions stay below 0.1% of Jsc. Inspect the near-zero tail.','Erster Nulldurchgang ab 0 V verwendet; spätere Generatorstrom-Ausschläge bleiben unter 0,1 % von Jsc. Verlauf nahe null prüfen.','采用从 0 V 出发的首个过零点；后续发电电流波动未超过 Jsc 的 0.1%，请检查近零尾段。'):code.startsWith('sparse_')?T('Too few points near ','Zu wenige Punkte nahe ','拟合区间点数不足：')+(code.endsWith('rsh')?'0 V':'Voc')+T('; enlarge the fit window.','; Fitfenster vergrößern.','；请增大拟合半宽。'):code.startsWith('slope_')?T('A nonphysical positive slope prevents a resistance estimate.','Eine positive Steigung verhindert die Widerstandsschätzung.','拟合斜率为正，无法给出物理合理的电阻估算。'):code==='physical'?T('FF or PCE exceeds 100%; check units, illumination and measurement.','FF oder PCE über 100 %: Einheiten, Beleuchtung und Messung prüfen.','FF 或 PCE 超过 100%，请检查单位、光强与测量。'):T('The generating branch is not monotonic; inspect the measured curve.','Der Generatorzweig ist nicht monoton; Messkurve prüfen.','发电区电流并非单调，请检查实测曲线。');
 const direction=r=>r.index+' · '+(r.direction>0?T('Increasing V','Steigendes V','电压递增'):T('Decreasing V','Fallendes V','电压递减'));
 function clear(message=''){results=null;$('jv-compare').disabled=true;$('jv-export').disabled=true;$('jv-scan').replaceChildren();$('jv-scan').disabled=true;for(const k of ['pce','jsc','voc','ff','rs','rsh'])$('jv-'+k).textContent='—';$('jv-chart').setAttribute('hidden','');$('jv-chart').replaceChildren();$('jv-fits').replaceChildren();$('jv-context').textContent='';$('jv-warnings').textContent='';$('jv-message').textContent=message;}
 function show(){
  const r=results?.[Number($('jv-scan').value)];if(!r)return;
  for(const k of ['pce','jsc','voc','ff'])$('jv-'+k).textContent=fmt(k==='voc'?r.signedVoc:r[k]);
  for(const k of ['rs','rsh'])$('jv-'+k).textContent=fmt(r[k].resistance);
  const lines=[r.rs,r.rsh].filter(f=>f.count>=3).map(f=>[[f.lo,f.intercept+f.slope*f.lo],[f.hi,f.intercept+f.slope*f.hi]]);
  plot($('jv-chart'),r.points,r.voltagePolarity<0?T('Normalized voltage (V)','Normierte Spannung (V)','极性归一后的电压（V）'):T('Voltage (V)','Spannung (V)','电压（V）'),'J (mA/cm²)',lines,[r.vmp,r.jmp]);
  $('jv-context').textContent=direction(r)+' · Vmpp = '+fmt(r.vmp)+' V · Jmpp = '+fmt(r.jmp)+' mA/cm² · Pmax = '+fmt(r.pmax)+' mW/cm² · '+T('Dashed: local fits. Dot: MPP.','Gestrichelt: lokale Fits. Punkt: MPP.','虚线：局部拟合；圆点：最大功率点。')+(r.voltagePolarity<0?T(' Original Voc = ',' Original-Voc = ',' 原始 Voc = ')+fmt(r.signedVoc)+' V; '+T('voltage polarity is normalized for curves, power, fits and module 03.','Spannung für Kurven, Leistung, Fits und Modul 03 normiert.','图表、功率、拟合及模块 03 使用归一后的正向电压。'):'');
  $('jv-warnings').textContent=r.warnings.map(warning).join(' ');$('jv-fits').replaceChildren();
  for(const [name,fit]of [['Rs',r.rs],['Rsh',r.rsh]]){const row=document.createElement('tr');for(const text of [name,fit.lo===null?'—':fmt(fit.lo)+' … '+fmt(fit.hi),fit.count,fmt(fit.r2)]){const td=document.createElement('td');td.textContent=text;row.append(td);}$('jv-fits').append(row);}
 }
 function unit(){ $('jv-area').disabled=['mAcm2','Acm2'].includes($('jv-unit').value); }
 function metadata(data){if(data.voltageUnit)$('jv-vunit').value=data.voltageUnit;if(data.currentUnit)$('jv-unit').value=data.currentUnit;unit();}
 function calculate(){clear();let data;try{data=M.parseJV($('jv-data').value);results=M.analyzeJV(data,{voltageUnit:$('jv-vunit').value,currentUnit:$('jv-unit').value,area:Number($('jv-area').value),pin:$('jv-pin').value.trim()?Number($('jv-pin').value):NaN,fitPercent:$('jv-window').value.trim()?Number($('jv-window').value):NaN});for(const [i,r]of results.entries()){const option=document.createElement('option');option.value=i;option.textContent=direction(r);$('jv-scan').append(option);}$('jv-scan').disabled=results.length===1;$('jv-export').disabled=false;$('jv-compare').disabled=!window.ResistanceLab;$('jv-message').textContent=T('Scans extracted: ','Bestimmte Scans: ','已提取扫描数：')+results.length;show();}catch(e){clear(errorText(e));if(data){
   const voltageUnit=data.voltageUnit||$('jv-vunit').value,currentUnit=data.currentUnit||$('jv-unit').value;
   if(plot($('jv-chart'),data.points,T('Voltage','Spannung','电压')+' ('+voltageUnit+')',units.find(([value])=>value===currentUnit)[1]))$('jv-context').textContent=T('Input preview: ','Eingabevorschau: ','原始数据预览：')+data.points.length+T(' points. Original values and polarity; parameters unavailable. Confirm units for headerless data.',' Punkte. Originalwerte und Vorzeichen; keine Parameter bestimmt. Einheiten bei Daten ohne Kopfzeile prüfen.',' 个点。保留原始数值与正负号，尚未提取参数；无表头时请确认输入单位。');
  }}}
 $('jv-calc').addEventListener('click',calculate);$('jv-scan').addEventListener('change',show);
 $('jv-compare').addEventListener('click',()=>{
   const r=results?.[Number($('jv-scan').value)];
   if(!r||!window.ResistanceLab?.compareMeasurement(r,source))return;
   $('pv-tab-resistance').click();
   $('solar-cell-tools').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
  });
 $('jv-choose').addEventListener('click',()=>$('jv-file').click());
 $('jv-data').addEventListener('input',()=>{fileVersion++;$('jv-file').value='';source=T('Pasted J–V data','Eingefügte J–V-Daten','粘贴的 J–V 数据');$('jv-source').textContent=source;clear();try{metadata(M.parseJV($('jv-data').value));}catch{}});
 for(const id of ['jv-vunit','jv-unit','jv-area','jv-pin','jv-window'])for(const event of ['input','change'])$(id).addEventListener(event,()=>{unit();clear();});
 $('jv-file').addEventListener('change',async()=>{
  const file=$('jv-file').files[0],version=++fileVersion;if(!file)return;clear(messages.loading);source=file.name;$('jv-source').textContent=source;
  try{if(file.size>2000000)throw Error('size');if(!/\.(csv|tsv|txt)$/i.test(file.name))throw Error('format');const text=await file.text();if(version!==fileVersion)return;const parsed=M.parseJV(text);$('jv-data').value=text;metadata(parsed);calculate();}
  catch(e){if(version===fileVersion){$('jv-data').value='';clear(errorText(e));}}
 });
 $('jv-example').addEventListener('click',()=>{fileVersion++;$('jv-file').value='';$('jv-data').value='Voltage_V,Current_density_mA/cm2\n'+Array.from({length:281},(_,i)=>{const v=-.1+i*.005;return v+','+(25*(1-(v/1.15)**12)-.1*v);}).join('\n');metadata(M.parseJV($('jv-data').value));$('jv-pin').value=100;$('jv-window').value=5;source=T('Synthetic J–V example','Synthetisches J–V-Beispiel','模拟 J–V 示例');$('jv-source').textContent=source;calculate();});
 $('jv-export').addEventListener('click',()=>{
  if(!results)return;
  const rows=[['source',safe(source)],['method','Measured piecewise-linear J-V; apparent differential Rs/Rsh; no extrapolation'],['definition_reference_DOI','10.1016/0038-1101(81)90062-9'],['PCE_reporting_reference_DOI','10.1016/j.solmat.2008.01.003'],['apparent_resistance_reference_DOI','10.1002/pssa.201800448'],['Pin_mW_cm-2',results[0].parameters.pin],['input_current_unit',results[0].parameters.currentUnit],['input_voltage_unit',results[0].parameters.voltageUnit],['active_area_cm2',results[0].parameters.area||''],['slope_half_width_percent_Voc',results[0].parameters.fitPercent],[],['scan','direction','PCE_percent','Jsc_mA_cm-2','Voc_V','FF_percent','Rs_apparent_ohm_cm2','Rsh_apparent_ohm_cm2','Vmpp_V','Jmpp_mA_cm-2','Pmax_mW_cm-2','input_polarity','warnings','voltage_polarity','normalized_Voc_V','near_zero_threshold_mA_cm2'],...results.map(r=>[r.index,r.direction>0?'increasing_V':'decreasing_V',r.pce,r.jsc,r.signedVoc,r.ff,r.rs.resistance??'',r.rsh.resistance??'',r.vmp,r.jmp,r.pmax,r.polarity,r.warnings.join(';'),r.voltagePolarity,r.voc,r.noiseTolerance])];
  for(const r of results){rows.push([],['scan',r.index],['curve_voltage_coordinate','input voltage in V times voltage_polarity; power and fits use this normalized coordinate'],['fit','lo_V','hi_V','n','slope_mA_cm-2_V-1','intercept_mA_cm-2','R2']);for(const k of ['rs','rsh']){const f=r[k];rows.push([k,f.lo??'',f.hi??'',f.count,f.slope??'',f.intercept??'',f.r2??'']);}rows.push([],['voltage_V','output_current_density_mA_cm-2'],...r.points);}
  window.CSVExport.save('measured-jv.csv',rows);
 });
 unit();clear();
}
function converters(){
 for(const kind of ['uv','pl']){
  const isPL=kind==='pl',id=isPL?'pl-energy':'buv-energy',host=isPL?$('pl-voltage-calculator'):$('bga-uv');if(!host)continue;
  const section=document.createElement('section');section.id=id;section.className='bg-addon calc-subtool measurement-converter';section.setAttribute('data-literal','');
  section.innerHTML='<h3>'+T('Spectrum · nm → eV','Spektrum · nm → eV','光谱 · nm → eV')+'</h3><div class="sp-shell"><div class="rl-main"><div class="rl-controls"><p class="rl-small">'+T('Reuses the spectrum imported above. Original data stays available.','Verwendet das oben importierte Spektrum. Originaldaten bleiben verfügbar.','直接复用上方导入的光谱，保留原始数据。')+'</p>'+
  (isPL?select(id+'-mode',T('PL intensity conversion','PL-Intensitätsumrechnung','PL 强度转换方式'),[['density',T('Per nm → per eV (Jacobian)','Pro nm → pro eV (Jacobi-Faktor)','每 nm → 每 eV（Jacobian 校正）')],['axis',T('Convert horizontal axis only','Nur horizontale Achse umrechnen','仅转换横轴，保留原始强度')]]):'<p class="rl-small">'+T('Absorbance and α retain their measured values.','Absorbanz und α behalten ihre Messwerte.','吸光度 A 与吸收系数 α 保持测量值不变。')+'</p>')+
  '<p class="rl-small">'+T('E (eV) = 1239.841984 / λ (nm). Equal nm steps become unequal eV steps. Export keeps the measured sampling, sorted by increasing energy; no interpolation.','E (eV) = 1239,841984 / λ (nm). Gleiche nm-Schritte ergeben ungleiche eV-Schritte. Export mit ursprünglichen Messpunkten, nach Energie sortiert; ohne Interpolation.','E（eV）= 1239.841984 / λ（nm）。等间隔 nm 转换后是非等间隔 eV；导出保留实测采样点并按能量递增排序，不插值。')+'</p>'+
  (isPL?'<p class="rl-small">'+T('Density mode assumes intensity per nm: Iₑ = Iλ λ² / (hc). Raw spectra are converted without background or detector-response correction. Export includes every PL sample column.','Dichtemodus setzt Intensität pro nm voraus: Iₑ = Iλ λ² / (hc). Rohspektren ohne Untergrund- oder Detektorkorrektur. Export enthält alle PL-Spalten.','谱密度模式假设输入为每 nm 的强度：Iₑ = Iλ λ² / (hc)。转换原始光谱，不扣背景、不校正探测器响应；导出包含全部 PL 样品列。')+'</p><p class="rl-small">'+T('For counts per wavelength bin, first normalize by each bin width. This operation preserves the signal type; photon counts and optical power require a separate calibration. Horizontal-axis-only mode displays original readings and is not a per-eV density.','Zählwerte je Wellenlängen-Bin zuerst durch die jeweilige Binbreite teilen. Der Signaltyp bleibt erhalten; Photonenzählrate und optische Leistung erfordern eine separate Kalibrierung. Die reine Achsenumrechnung zeigt Originalwerte, keine Dichte pro eV.','若输入是每个波长 bin 的计数，须先按各 bin 宽度归一化。此换元保持原信号类型；光子计数与光功率之间还需单独标定。仅转换横轴模式显示原始读数，不代表每 eV 谱密度。')+'</p>':'')+
  '<div class="rl-source-links"><a href="https://doi.org/10.1021/jz401508t" target="_blank" rel="noopener noreferrer">Mooney &amp; Kambhampati · J. Phys. Chem. Lett. (2013) ↗</a><a href="https://doi.org/10.1021/jz502066v" target="_blank" rel="noopener noreferrer">'+T('Official absorption correction (2014)','Offizielle Korrektur zur Absorption (2014)','吸收谱正式更正（2014）')+'</a></div>'+
  '<div class="sp-row">'+button(id+'-convert',T('Convert / preview eV','Umrechnen / eV-Vorschau','转换／预览 eV'),true)+button(id+'-export',T('Export eV spectrum ↓','eV-Spektrum exportieren ↓','导出 eV 光谱 ↓'))+'</div><p class="sp-message" id="'+id+'-message" role="status"></p></div><div class="rl-output"><p class="rl-small" id="'+id+'-summary" role="status">'+T('Upload a spectrum above, then convert it here.','Oben ein Spektrum importieren, dann hier umrechnen.','先在上方导入光谱，再在这里转换。')+'</p><svg class="bg-chart" id="'+id+'-chart" viewBox="0 0 640 300" role="img" aria-label="eV" hidden></svg></div></div></div>';
  host.append(section);
  const jump=document.createElement('button');jump.type='button';jump.className='rl-action measurement-jump';jump.id=id+'-open';jump.setAttribute('data-literal','');jump.textContent=T('Spectrum: nm → eV ↓','Spektrum: nm → eV ↓','光谱：nm → eV ↓');
  const header=$(isPL?'pl-file-choose':'buv-choose').closest('.calc-input-header,.uv-import-header');if(header)header.append(jump);
  jump.addEventListener('click',()=>{section.scrollIntoView({behavior:'instant',block:'center'});$(id+'-convert').focus({preventScroll:true});});
  let converted=null,names=[],source='',pending=false;
  function clear(){converted=null;$(id+'-export').disabled=true;$(id+'-chart').setAttribute('hidden','');$(id+'-chart').replaceChildren();$(id+'-summary').textContent=T('Convert the current spectrum to preview and export.','Aktuelles Spektrum für Vorschau und Export umrechnen.','转换当前光谱后可预览并导出。');$(id+'-message').textContent='';}
  function convert(){
   clear();try{
    if(pending)throw Error('loading');
    let points,unit,index=0;
    if(isPL){
     if(!window.BandgapInputs?.pl?.()){
      if($('pl-import-message').dataset.error==='true')throw Error('loading');
      $('pl-import-calculate').click();
     }
     if(!window.BandgapInputs?.pl?.())throw Error('loading');
     const data=window.PLVoltage.parseSpectra($('pl-data').value);points=data.points;names=data.names;unit='nm';index=Number($('pl-sample').value)||0;source=$('pl-file-name').textContent;
    }else{
     points=window.BandgapModel.parse($('buv-data').value);unit=$('buv-unit').value;if(points.axisUnit&&points.axisUnit!==unit)throw Error('mismatch');names=[$('buv-signal').value==='alpha'?'alpha_cm-1':'absorbance'];source=$('buv-source').textContent;
    }
    converted=M.convertSpectrum(points,{unit,density:isPL&&$(id+'-mode').value==='density'});
    const selected=converted.points.map(row=>[row[0],row[index+1]]);
    plot($(id+'-chart'),selected,T('Photon energy (eV)','Photonenenergie (eV)','光子能量（eV）'),isPL?(converted.density?'PL (a.u./eV)':'PL (a.u.)'):names[0]);
    $(id+'-summary').textContent=(isPL?names[index]+' · ':'')+converted.points.length+' '+T('points','Punkte','个点')+' · '+fmt(converted.points[0][0])+'–'+fmt(converted.points.at(-1)[0])+' eV · '+T('original sampling','ursprüngliche Abtastung','原始采样');
    $(id+'-export').disabled=false;$(id+'-message').textContent=T('Converted. Original imported spectrum retained.','Umgerechnet. Originalspektrum bleibt erhalten.','已转换，原始导入光谱已保留。');
   }catch(e){clear();$(id+'-message').textContent=errorText(e);}
  }
  $(id+'-convert').addEventListener('click',convert);
  $(id+'-export').addEventListener('click',()=>{
   if(!converted)return;
   window.CSVExport.save((isPL?'pl':'uv-vis')+'-energy-eV.csv',[['source',safe(source)],['energy_unit','eV'],['HC_eV_nm',M.HC],['change_of_variable_reference_DOI','10.1021/jz401508t'],['absorption_correction_reference_DOI','10.1021/jz502066v'],['input_axis_unit',converted.unit],['intensity_conversion',converted.density?'I_E = I_lambda * lambda_nm^2 / HC_eV_nm':'horizontal axis only; ordinate unchanged'],['sampling',converted.spacing],['corrections','raw spectrum; no background, energy offset or detector-response correction'],[],['energy_eV',...names.map(n=>safe(n+(converted.density?'_per_eV':''))),'wavelength_nm'],...converted.points.map((row,i)=>[...row,converted.wavelengths[i]])]);
  });
  for(const control of isPL?['pl-data','pl-sample',id+'-mode']:['buv-data','buv-unit','buv-signal'])for(const event of ['input','change'])$(control).addEventListener(event,()=>{if(control.endsWith('-data'))pending=false;clear();});
  $(isPL?'pl-file':'buv-file').addEventListener('change',()=>{pending=!!$(isPL?'pl-file':'buv-file').files[0];clear();});
  if(isPL){window.addEventListener('bandgap:pl',()=>{clear();if(window.BandgapInputs?.pl?.()||$('pl-import-message').dataset.error==='true')pending=false;});}
  else{window.addEventListener('measurement:uv',()=>{pending=false;clear();});$('buv-example').addEventListener('click',()=>{pending=false;clear();});}
  clear();
 }
}
document.addEventListener('DOMContentLoaded',converters,{once:true});
})();
