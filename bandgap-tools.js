(function(){
'use strict';
const M=window.BandgapModel;if(!M)return;
const lang=document.documentElement.lang,li=lang==='de'?1:lang.startsWith('zh')?2:0;
const T=(en,de,zh)=>[en,de,zh][li];
const words={
 title:T('Bandgap from measurements','Bandlücke aus Messungen','从测量数据估算带隙'),
 uv:T('UV–Vis–NIR · absorption edge','UV–Vis–NIR · Absorptionskante','UV–Vis–NIR · 吸收边'),
 ups:T('UPS + IPES · electronic gap','UPS + IPES · elektronische Bandlücke','UPS＋IPES · 电子带隙'),
 eqe:T('EQE · photovoltaic bandgap','EQE · photovoltaische Bandlücke','EQE · 光伏带隙估算'),
 pl:T('PL · emission energy','PL · Emissionsenergie','PL · 发射峰与带隙参考'),
 lo:T('Window start (eV)','Fensteranfang (eV)','分析区间起点（eV）'),hi:T('Window end (eV)','Fensterende (eV)','分析区间终点（eV）'),
 offset:T('Energy correction ΔE (eV)','Energiekorrektur ΔE (eV)','能量校准偏移 ΔE（eV）'),
 calc:T('Estimate from spectrum','Aus Spektrum schätzen','从光谱估算'),
 invalid:T('Settings changed. Recalculate.','Einstellungen geändert. Neu berechnen.','数据或设置已变化，请重新计算。'),
 export:T('Export estimate & curve ↓','Schätzung und Kurve exportieren ↓','导出估算结果与曲线 ↓'),
 use:T('Use in bandgap → Jsc','Für Bandlücke → Jsc verwenden','用于带隙 → Jsc'),
 compare:T('Compare methods','Methoden vergleichen','查看各方法对照'),
 empty:T('No current estimate','Keine aktuelle Schätzung','暂无有效估算'),
 sample:T('Sample / condition','Probe / Bedingung','样品／测试条件'),
 correction:T('Ecorrected = Emeasured + ΔE. Use an independent energy reference; leave 0 without one. Windows use corrected energy.','Ekorrigiert = Egemessen + ΔE. Unabhängige Energiereferenz verwenden; ohne Referenz 0 lassen. Fenster beziehen sich auf korrigierte Energie.','校正能量 = 测量能量＋ΔE。偏移应来自独立能量参考，无参考时保留 0；分析区间使用校正后的能量。'),
 settings:T('Analysis settings','Analyseeinstellungen','分析设置'),
 plot:T('Measured spectrum and analysis','Messspektrum und Auswertung','测量光谱与分析曲线'),
 norm:T('Normalized signal','Normiertes Signal','归一化信号'),
 energy:T('Photon energy (eV)','Photonenenergie (eV)','光子能量（eV）'),
 uvLimit:T('Fit-only SE excludes instrument and model uncertainty; an indirect intercept does not separate phonon energy. Tauc extrapolation assumes the selected transition and a suitable linear interval. A high R² does not establish the transition type. Excitons, tails, scattering and interference can bias the intercept. Elliott fitting is not implemented. Absorbance conversion neglects reflection and multiple reflections.','Die Fit-SE berücksichtigt keine Geräte- oder Modellunsicherheit; der indirekte Achsenabschnitt trennt die Phononenenergie nicht ab. Die Tauc-Extrapolation setzt den gewählten Übergang und ein geeignetes lineares Intervall voraus. Ein hohes R² belegt den Übergangstyp nicht. Exzitonen, Ausläufer, Streuung und Interferenz können den Achsenabschnitt verschieben. Keine Elliott-Anpassung. Die Absorbanzumrechnung vernachlässigt Reflexion und Mehrfachreflexion.','拟合 SE 不包含仪器和模型不确定度；间接跃迁外推未分离声子能量。Tauc 外推依赖所选跃迁模型和合适的线性区间；高 R² 不能证明跃迁类型。激子、带尾、散射和干涉可能使截距偏移。本工具未实现 Elliott 拟合；由吸光度换算 α 时忽略反射与多次反射。'),
 plLimit:T('This is a PL emission energy, not an independently measured electronic gap. Excitons, traps, reabsorption and detector response can shift the peak. No automatic exciton correction.','Dies ist eine PL-Emissionsenergie, keine unabhängig gemessene elektronische Bandlücke. Exzitonen, Fallen, Reabsorption und Detektorantwort können die Peaklage verschieben. Keine automatische Exzitonenkorrektur.','这是 PL 发射能量，仅作带隙参考，不能独立确定电子带隙。激子、缺陷、自吸收和探测器响应都可能改变峰位；不自动进行激子修正。'),
 eqeLimit:T('Candidate gap at maximum d(EQE)/dE. Restrict the window to the long-wavelength absorption edge and inspect smoothing sensitivity. Both derivative flanks must fall at least 5% below the maximum; flat ramps and unresolved edges are rejected. Collection losses and optical interference affect the result.','Kandidatenwert beim Maximum von d(EQE)/dE. Fenster auf die langwellige Absorptionskante begrenzen und Glättungsabhängigkeit prüfen. Beide Ableitungsflanken müssen mindestens 5% unter dem Maximum liegen; lineare Rampen und unaufgelöste Kanten werden abgelehnt. Sammlung und optische Interferenz beeinflussen das Ergebnis.','取 d(EQE)/dE 最大值对应的候选光伏带隙。请将区间限制在长波吸收边，并检查平滑参数的影响；导数两侧须至少比峰值低 5%，线性斜坡或未分辨的响应边不输出带隙。载流子收集与光学干涉会影响结果。'),
 upsLimit:T('Enter already fitted band onsets on a common reference. UPS alone is insufficient. Surface sensitivity and onset fitting affect the electronic gap.','Bereits angepasste Bandkanten mit gemeinsamer Referenz eingeben. UPS allein reicht nicht aus. Oberflächenempfindlichkeit und Kantenanpassung beeinflussen die elektronische Bandlücke.','输入已经拟合的带边位置，并确认两者采用共同能量参考。UPS 单独不能确定完整带隙；表面状态和带边拟合都会影响结果。')
};
const errors={
 number:T('Enter finite numeric values; use a decimal point.','Endliche Zahlen mit Dezimalpunkt eingeben.','请输入有效数值，使用小数点。'),
 size:T('Use a text file smaller than 2 MB.','Textdatei kleiner als 2 MB verwenden.','请使用小于 2 MB 的文本文件。'),
 columns:T('Exactly two columns are required.','Genau zwei Spalten erforderlich.','需要两列数据：横坐标和信号。'),
 count:T('Provide 5–20,000 data rows.','5–20.000 Datenzeilen erforderlich.','需要 5–20,000 行数据。'),
 duplicate:T('Duplicate horizontal coordinates are not allowed.','Doppelte x-Werte sind nicht zulässig.','横坐标不能重复。'),
 unit:T('Select a supported unit or convention; spectrum header units must match the selection.','Gültige Einheit oder Konvention auswählen; Spektrenkopf und ausgewählte Einheit müssen übereinstimmen.','请选择正确的单位或能量约定；光谱表头单位须与所选单位一致。'),
 axis:T('Wavelength and corrected photon energy must be positive.','Wellenlänge und korrigierte Energie müssen positiv sein.','波长和校正后的光子能量必须大于零。'),
 window:T('Choose an increasing interval containing enough measured points.','Aufsteigendes Intervall mit genügend Messpunkten wählen.','请选择起点小于终点、且包含足够测量点的区间。'),
 flat:T('The selected signal has too little variation to fit.','Signalvariation für die Anpassung zu klein.','所选信号变化不足，无法拟合。'),
 thickness:T('Film thickness must be positive.','Schichtdicke muss positiv sein.','薄膜厚度必须大于零。'),
 positive:T('The selected signal must be positive after background subtraction.','Ausgewähltes Signal muss nach Untergrundabzug positiv sein.','扣除背景后，所选信号必须为正。'),
 intercept:T('No physical Tauc intercept: select a rising linear region above the edge.','Kein physikalischer Tauc-Achsenabschnitt: ansteigenden linearen Bereich oberhalb der Kante wählen.','未得到有效 Tauc 截距，请选择吸收边上方的上升线性区间。'),
 boundary:T('The peak lies at a window boundary. Include both sides of the peak or edge.','Maximum liegt am Fensterrand. Beide Seiten des Peaks oder der Kante einschließen.','峰值位于区间边界，请覆盖峰或响应边的两侧。'),
 eqe:T('EQE must be between 0 and 1 after unit conversion.','EQE muss nach Umrechnung zwischen 0 und 1 liegen.','单位换算后 EQE 必须在 0–1 之间。'),
 smooth:T('Use an odd smoothing size from 5 to 51.','Ungerade Glättungsbreite von 5 bis 51 verwenden.','平滑点数必须为 5–51 的奇数。'),
 edge:T('No sufficiently resolved rising EQE edge in this interval.','Keine ausreichend ausgeprägte ansteigende EQE-Kante im Intervall.','当前区间内没有足够清晰的上升 EQE 响应边。'),
 sign:T('Distances below/above EF must be nonnegative.','Abstände unter/über EF müssen nichtnegativ sein.','相对 EF 的下方／上方距离不能为负。'),
 order:T('The corrected CBM must lie above the corrected VBM.','Korrigiertes CBM muss oberhalb des VBM liegen.','校正后的导带底必须高于价带顶。'),
 missing:T('Import and process the spectrum in this module first.','Zuerst das Spektrum in diesem Modul importieren und verarbeiten.','请先在本模块导入并处理光谱。'),
 range:T('The Jsc calculator accepts 0.5–3.0 eV.','Der Jsc-Rechner unterstützt 0,5–3,0 eV.','Jsc 计算器支持的带隙范围为 0.5–3.0 eV。')
};
const warnings={...words,
 multiedge:T('Several derivative peaks occur. Restrict the interval to the physical absorption edge and compare smoothing sizes.','Mehrere Ableitungsmaxima. Intervall auf die physikalische Absorptionskante begrenzen und Glättungsbreiten vergleichen.','导数出现多个峰，请限制到实际吸收边，并比较不同平滑窗口。'),
 linear:T('Low linear-fit R²: inspect the selected region.','Niedriges R²: gewählten Bereich prüfen.','线性拟合 R² 较低，请检查拟合区间。'),
 extrapolation:T('The intercept requires a long extrapolation beyond the fit interval.','Lange Extrapolation außerhalb des Fitintervalls erforderlich.','截距距离拟合区间较远，外推结果需谨慎检查。'),
 multipeak:T('Several local maxima occur: restrict the window to the intended emission band.','Mehrere lokale Maxima: Fenster auf das gewünschte Emissionsband begrenzen.','存在多个局部峰，请限定目标发射带的分析区间。'),
 coverage:T('The EQE variation in this interval is small. Check edge coverage.','EQE-Variation klein. Kantenabdeckung prüfen.','区间内 EQE 变化较小，请检查是否完整覆盖响应边。')
};
const esc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const $=id=>document.getElementById(id),fmt=(x,n=4)=>Number.isFinite(x)?x.toFixed(n):'—';
const number=id=>$(id).value.trim()===''?NaN:Number($(id).value);
const field=(id,label,value='',extra='')=>`<div class="rl-field"><label for="${id}">${label}</label><input id="${id}" type="number" step="any" value="${value}" ${extra}></div>`;
const select=(id,label,options)=>`<div class="rl-field"><label for="${id}">${label}</label><select id="${id}">${options.map(([v,l])=>`<option value="${v}">${l}</option>`).join('')}</select></div>`;
const action=(id,label)=>`<button id="${id}" class="rl-action" type="button">${label}</button>`;
const records={},inputs=window.BandgapInputs||{},panels={};
function section(id,title,lead){const node=document.createElement('section');node.id=id;node.className='bg-addon';node.setAttribute('data-literal','');node.innerHTML=`<h3>${title}</h3><p class="rl-small">${lead}</p>`;return node;}
function output(id){return `<div class="bg-result" aria-live="polite"><strong id="${id}-value">—</strong><span id="${id}-detail">${words.empty}</span></div><p id="${id}-message" class="bg-message" role="status"></p><svg id="${id}-chart" class="bg-chart" viewBox="0 0 640 300" role="img" aria-label="${words.plot}" hidden></svg><div id="${id}-legend" class="bg-legend" hidden></div><div class="rl-actions">${id==='bpl'?'':action(id+'-use',words.use)}${action(id+'-export',words.export)}${['beq','bpl'].includes(id)?action(id+'-compare',words.compare):''}</div>`;}
function opticalControls(id,extra){return `<div class="bg-fields">${field(id+'-lo',words.lo)}${field(id+'-hi',words.hi)}${field(id+'-offset',words.offset,'0')}${extra||''}</div><p class="rl-small">${words.correction}</p>${action(id+'-calc',words.calc)}${output(id)}`;}
const container=section('bandgap-analysis',words.title,T('Use absorption data or fitted UPS/IPES onsets. EQE and PL estimates use their existing spectrum importers.','Absorptionsdaten oder angepasste UPS/IPES-Kanten verwenden. EQE und PL nutzen ihre vorhandenen Spektrenimporte.','使用吸收光谱或已拟合的 UPS/IPES 带边；EQE 与 PL 估算直接复用各自模块中的光谱。'));
$('bandgap-jsc').insertBefore(container,$('bandgap-calculator'));
container.insertAdjacentHTML('beforeend',select('bga-method',T('Measurement method','Messmethode','测试方法'),[['uv',words.uv],['ups',words.ups]])+`<div id="bga-uv"><p class="rl-small">${T('CSV / TSV / TXT: two columns, wavelength (nm) or energy (eV), then α or absorbance. Optional header. Decimal point; max 2 MB and 20,000 rows.','CSV / TSV / TXT: zwei Spalten, Wellenlänge (nm) oder Energie (eV), dann α oder Absorbanz. Optionaler Kopf. Dezimalpunkt; maximal 2 MB und 20.000 Zeilen.','CSV／TSV／TXT 两列：波长（nm）或能量（eV），以及 α 或吸光度；可带表头。使用小数点，最多 2 MB、20,000 行。')}</p><label for="buv-data">${T('Absorption data','Absorptionsdaten','吸收光谱数据')}</label><textarea id="buv-data" rows="5" spellcheck="false" placeholder="Energy_eV,alpha_cm-1"></textarea><input id="buv-file" type="file" accept=".csv,.tsv,.txt" hidden><div class="rl-actions">${action('buv-choose',T('Choose absorption file','Absorptionsdatei wählen','选择吸收光谱文件'))}${action('buv-example',T('Load synthetic example','Synthetisches Beispiel laden','载入模拟示例'))}</div><p id="buv-source" class="rl-small"></p><div class="bg-fields">${select('buv-unit',T('Horizontal axis','Horizontale Achse','横坐标单位'),[['eV','eV'],['nm','nm']])}${select('buv-signal',T('Measured signal','Messsignal','测量信号'),[['alpha','α (cm⁻¹)'],['absorbance',T('Absorbance A = −log₁₀(T)','Absorbanz A = −log₁₀(T)','吸光度 A = −log₁₀(T)')]])}${field('buv-thickness',T('Thickness (nm; absorbance only)','Dicke (nm; nur Absorbanz)','厚度（nm，仅吸光度换算）'),'500','min="0"')}${field('buv-background',T('Constant background (signal units)','Konstanter Untergrund (Signaleinheit)','恒定背景（与信号同单位）'),'0')}${select('buv-transition',T('Assumed transition','Angenommener Übergang','假定跃迁类型'),[['direct',T('Direct allowed · (αE)²','Direkt erlaubt · (αE)²','直接允许跃迁 · (αE)²')],['indirect',T('Indirect allowed · (αE)½','Indirekt erlaubt · (αE)½','间接允许跃迁 · (αE)½')]])}</div>${opticalControls('buv')}<details class="rl-method"><summary>${words.settings}</summary><p>${words.uvLimit}</p><p>α = ln(10) A / d; (αE)ᵖ = mE + b; Eɡ = −b/m.</p><a href="https://www.nature.com/articles/s41467-017-00567-8" target="_blank" rel="noopener noreferrer">Wenger et al., Nature Communications (2017)</a></details></div><div id="bga-ups" hidden><p class="rl-small">${words.upsLimit}</p>${select('bup-convention',T('Energy convention for both onsets','Energiekonvention beider Kanten','两个带边的能量约定'),[['distance',T('Positive distances: VBM below EF / CBM above EF','Positive Abstände: VBM unter EF / CBM über EF','正距离：VBM 在 EF 下方／CBM 在 EF 上方')],['signed',T('Signed energies on one reference (e.g. vacuum)','Vorzeichenbehaftete Energien mit gleicher Referenz (z. B. Vakuum)','同一参考下的带符号能量（如真空能级）')],['binding',T('Binding energy: EB = EF − E for both','Bindungsenergie: EB = EF − E für beide','结合能：两者均采用 EB = EF − E')]])}<div class="bg-fields">${field('bup-v','VBM / UPS (eV)')}${field('bup-c','CBM / IPES (eV)')}${field('bup-dv','ΔE VBM (eV)','0')}${field('bup-dc','ΔE CBM (eV)','0')}${field('bup-sv',T('VBM standard uncertainty (eV; optional)','VBM-Standardunsicherheit (eV; optional)','VBM 标准不确定度（eV，可选）'),'','min="0"')}${field('bup-sc',T('CBM standard uncertainty (eV; optional)','CBM-Standardunsicherheit (eV; optional)','CBM 标准不确定度（eV，可选）'),'','min="0"')}</div><p class="rl-small">${T('Corrections are added to signed energies after conversion. Positive ΔE moves an edge upward. Eg = (EC + ΔEC) − (EV + ΔEV). If uncertainties are supplied, provide both; σEg = √(σV² + σC²) assumes independent errors and excludes calibration covariance.','Korrekturen werden nach Umrechnung zu vorzeichenbehafteten Energien addiert. Positives ΔE verschiebt die Kante nach oben. Eg = (EC + ΔEC) − (EV + ΔEV). Beide Unsicherheiten angeben; σEg = √(σV² + σC²) setzt unabhängige Fehler voraus und berücksichtigt keine Kalibrierkovarianz.','偏移加在转换后的带符号能量上，正 ΔE 表示能级向上移动。Eg = (EC＋ΔEC)－(EV＋ΔEV)。若输入不确定度，请同时提供两个值；σEg = √(σV²＋σC²) 假设误差独立，未包含校准协方差。')}</p>${action('bup-calc',T('Calculate electronic gap','Elektronische Bandlücke berechnen','计算电子带隙'))}${output('bup')}<p class="rl-small"><a href="https://doi.org/10.1002/adfm.202208980" target="_blank" rel="noopener noreferrer">Shin et al., Advanced Functional Materials (2023)</a></p></div><section class="bg-comparison"><h3>${words.compare}</h3><p class="rl-small">${T('Compare only the same material and conditions. Values represent different observables; no automatic averaging or exciton-binding-energy inference. Results clear when their inputs change.','Nur dasselbe Material unter gleichen Bedingungen vergleichen. Verschiedene Messgrößen: keine automatische Mittelung oder Ableitung einer Exzitonenbindungsenergie. Geänderte Eingaben löschen das Ergebnis.','请比较同一材料、同一测试条件下的结果。不同方法对应不同物理量，不自动取平均或推算激子结合能；输入变化会清除对应旧结果。')}</p>${select('bga-reference',T('Reference for differences','Referenz für Differenzen','差值比较参考'),[])}<div class="rl-table-wrap"><table class="rl-table"><thead><tr><th>${T('Method / source','Methode / Quelle','方法／来源')}</th><th>eV</th><th>Δ (meV)</th></tr></thead><tbody id="bga-rows"></tbody></table></div>${action('bga-export',T('Export method comparison ↓','Methodenvergleich exportieren ↓','导出方法对照 ↓'))}</section>`);
const eqSection=section('eq-bandgap',words.eqe,T('Reuses the current EQE import. Energy-domain local quadratic differentiation; no second upload.','Nutzt den aktuellen EQE-Import. Lokale quadratische Differentiation im Energieraum; kein erneuter Upload.','直接使用当前导入的 EQE，以能量为横轴进行局部二次拟合求导，无需重复上传。'));
eqSection.innerHTML+=opticalControls('beq',field('beq-smoothing',T('Derivative window (odd points)','Ableitungsfenster (ungerade Punktzahl)','求导平滑窗口（奇数点）'),'11','min="5" max="51" step="2"'))+`<p class="rl-small">${words.eqeLimit}</p><p class="rl-small">${T('Solid: EQE fraction. Dashed: derivative scaled to its positive maximum.','Durchgezogen: EQE-Anteil. Gestrichelt: Ableitung, auf ihr positives Maximum skaliert.','实线：EQE（小数）；虚线：按正最大值归一化的导数。')}</p><a class="bg-source" href="https://doi.org/10.1002/aenm.202100022" target="_blank" rel="noopener noreferrer">Almora et al., Advanced Energy Materials (2021)</a>`;
$('eq-output').append(eqSection);
const plSection=section('pl-bandgap',words.pl,T('Reuses the selected imported PL sample and its spectral background. A single integrated PL value contains no peak information.','Nutzt die ausgewählte importierte PL-Probe und ihren spektralen Untergrund. Ein einzelner integrierter PL-Wert enthält keine Peakposition.','复用已导入并选中的 PL 样品及光谱背景。单个 PL 积分强度不含峰位信息，无法估算带隙。'));
plSection.innerHTML+=`<p class="rl-small" id="bpl-source"></p>`+opticalControls('bpl',select('bpl-density',T('Peak convention','Peakkonvention','峰位定义'),[['density',T('Energy density · apply wavelength Jacobian','Energiedichte · Wellenlängen-Jakobi-Faktor anwenden','能量谱密度峰 · 应用波长雅可比变换')],['supplied',T('Supplied-spectrum peak · no intensity conversion','Peak des Eingabespektrums · keine Intensitätsumrechnung','输入光谱峰 · 不转换强度')]]))+`<p class="rl-small">${words.plLimit}</p><details class="rl-method"><summary>${words.settings}</summary><p>${T('For signal per nm, IE = Iλ λ²/(hc). Select the supplied-spectrum option when the signal is already per eV or is not a density per nm. The peak is refined with a quadratic through its three neighboring samples; no smoothing or spectral-response correction. Sampling step is not an uncertainty.','Für Signal pro nm: IE = Iλ λ²/(hc). Option für das gelieferte Spektrum wählen, wenn das Signal bereits pro eV oder keine Dichte pro nm ist. Peakverfeinerung mit drei benachbarten Punkten; keine Glättung oder spektrale Antwortkorrektur. Abtastschritt ist keine Unsicherheit.','信号为每 nm 谱密度时，IE = Iλ λ²/(hc)。若信号已按每 eV 表示或并非每 nm 谱密度，请选择原始光谱峰。以峰附近三个采样点作二次插值，不进行平滑或仪器响应校正；采样步长不等于不确定度。')}</p></details>`;
$('pl-voltage-calculator').querySelector('.rl-output').append(plSection);
const ids={uv:'buv',eqe:'beq',pl:'bpl',ups:'bup'};
function clear(method,message=''){delete records[method];const id=ids[method];$(id+'-value').textContent='—';$(id+'-detail').textContent=words.empty;$(id+'-message').textContent=message;$(id+'-chart').setAttribute('hidden','');$(id+'-legend').hidden=true;$(id+'-export').disabled=true;if($(id+'-use'))$(id+'-use').disabled=true;comparison();}
function render(r,source){source=source==='Supplied workbook example'?T('Supplied workbook example','Mitgeliefertes Arbeitsmappenbeispiel','随附工作簿示例'):['Your EQE data','No file selected'].includes(source)?T('Current EQE data','Aktuelle EQE-Daten','当前 EQE 数据'):source;r.source=source;records[r.method]=r;const id=ids[r.method];$(id+'-value').textContent=fmt(r.value)+' eV';
 const detail=r.method==='uv'?`R² = ${fmt(r.fit.r2,5)} · n = ${r.fit.n} · ${T('fit-only SE','nur Fit-SE','仅拟合 SE')} = ${fmt(r.se,5)} eV`:r.method==='ups'?`EV = ${fmt(r.ev)} eV · EC = ${fmt(r.ec)} eV`+(r.sigma===null?'':` · σ = ${fmt(r.sigma)} eV`):`${T('Local energy step','Lokaler Energieschritt','局部能量采样步长')} ≈ ${fmt(r.spacing,5)} eV`;
 $(id+'-detail').textContent=detail;$(id+'-message').textContent=r.warnings.filter(w=>!['plLimit','eqeLimit','upsLimit'].includes(w)).map(w=>warnings[w]).filter(Boolean).join(' ');$(id+'-export').disabled=false;if($(id+'-use'))$(id+'-use').disabled=r.value<.5||r.value>3;
 if(r.points.length)draw(id,r);comparison();
}
function draw(id,r){
 const chart=$(id+'-chart'),range=r.parameters;let points=r.points.filter(p=>p[0]>=range.lo&&p[0]<=range.hi),line=r.overlay.filter(p=>p[0]>=Math.min(range.lo,r.value)&&p[0]<=range.hi);
 if(!points.length){chart.setAttribute('hidden','');return;}
 const xmin=Math.min(range.lo,r.value),xmax=Math.max(range.hi,r.value),ys=[...points,...line].map(p=>p[1]);let ymin=Math.min(0,...ys),ymax=Math.max(...ys);if(ymin===ymax)ymax=ymin+1;const pad=(ymax-ymin)*.08;ymin-=pad;ymax+=pad;
 const left=90,right=615,top=32,bottom=224,x=v=>left+(v-xmin)/(xmax-xmin)*(right-left),y=v=>bottom-(v-ymin)/(ymax-ymin)*(bottom-top);
 let svg=`<title>${esc(words.plot)}</title><text x="${left}" y="14">${esc(r.method==='uv'?T('Normalized Tauc ordinate','Normierte Tauc-Ordinate','归一化 Tauc 纵坐标'):words.norm)}</text>`;
 const tick=v=>Math.abs(v)>=1e4||Math.abs(v)>0&&Math.abs(v)<.001?v.toExponential(1):Number(v.toPrecision(3)).toString();
 for(let i=0;i<5;i++){let xx=xmin+(xmax-xmin)*i/4,yy=ymin+(ymax-ymin)*i/4;svg+=`<path class="bg-grid" d="M${x(xx)} ${top}V${bottom}M${left} ${y(yy)}H${right}"/><text x="${x(xx)}" y="258" text-anchor="middle">${tick(xx)}</text><text x="${left-9}" y="${y(yy)+4}" text-anchor="end">${tick(yy)}</text>`;}
 function path(ps,cl){const stride=Math.max(1,Math.ceil(ps.length/800));return `<path class="${cl}" d="${ps.filter((_,i)=>i%stride===0||i===ps.length-1).map((p,i)=>(i?'L':'M')+x(p[0])+' '+y(p[1])).join(' ')}"/>`;}
 svg+=path(points,'bg-curve')+path(line,'bg-fit')+`<path class="bg-marker" d="M${x(r.value)} ${top}V${bottom}"/><text x="${(left+right)/2}" y="290" text-anchor="middle">${esc(words.energy)}</text>`;chart.innerHTML=svg;chart.removeAttribute('hidden');
 const labels=r.method==='uv'?
  [T('Measured Tauc data','Gemessene Tauc-Daten','实线：测量数据的 Tauc 变换'),T('Linear fit and extrapolation','Linearer Fit und Extrapolation','虚线：线性拟合与外推'),T('Tauc intercept Eg','Tauc-Achsenabschnitt Eg','竖直点线：Tauc 截距 Eg')]:r.method==='eqe'?
  [T('Measured EQE (fraction)','Gemessene EQE (Anteil)','实线：测量 EQE（小数）'),T('dEQE/dE normalized to its maximum','dEQE/dE auf Maximum normiert','虚线：dEQE/dE（按最大值归一化）'),T('Candidate photovoltaic gap','Kandidat für photovoltaische Bandlücke','竖直点线：候选光伏带隙')]:
  [T('Selected PL spectrum','Ausgewähltes PL-Spektrum','实线：所选样品的 PL 光谱'),null,T('PL emission peak','PL-Emissionspeak','竖直点线：PL 发射峰能量')];
 const legend=$(id+'-legend');legend.replaceChildren();
 for(const [i,label]of labels.entries()){if(!label)continue;const item=document.createElement('span');item.className=['bg-key-data','bg-key-fit','bg-key-marker'][i];item.textContent=label;legend.append(item);}
 const context=document.createElement('p');context.className='bg-plot-context';
 context.textContent=T('Current analysis','Aktuelle Auswertung','当前分析')+': '+r.source+' · '+fmt(range.lo,3)+'–'+fmt(range.hi,3)+' eV · ΔE = '+fmt(range.offset,3)+' eV'+(r.method==='eqe'?' · '+T('Derivative window','Ableitungsfenster','求导窗口')+': '+range.smoothing+' '+T('points','Punkte','点'):r.method==='uv'?' · '+(range.transition==='direct'?T('Direct allowed','Direkt erlaubt','直接允许跃迁'):T('Indirect allowed','Indirekt erlaubt','间接允许跃迁')):range.density==='density'?' · '+T('Energy-density peak','Energiedichte-Peak','能量谱密度峰'):' · '+T('Supplied-spectrum peak','Peak des Eingabespektrums','输入光谱峰'));
 legend.append(context);legend.hidden=false;
}
function comparison(){const keys=['uv','eqe','pl','ups'].filter(k=>records[k]);const previous=$('bga-reference').value;$('bga-reference').replaceChildren();for(const k of keys){const o=document.createElement('option');o.value=k;o.textContent=words[k];$('bga-reference').append(o);}if(keys.includes(previous))$('bga-reference').value=previous;
 $('bga-rows').replaceChildren();for(const k of keys){const r=records[k],tr=document.createElement('tr');for(const value of [words[k]+' · '+r.source,fmt(r.value),fmt((r.value-records[$('bga-reference').value].value)*1000,1)]){const td=document.createElement('td');td.textContent=value;tr.append(td);}$('bga-rows').append(tr);}$('bga-export').disabled=!keys.length;}
const csvText=s=>/^[=+@\-]/.test(String(s).trimStart())?"'"+s:s;
function rows(r){return [['method',r.method],['observable',r.metric],['source',csvText(r.source)],['estimate_eV',r.value],...Object.entries(r.parameters).map(([k,v])=>['input_'+k,v??'']),['fit_R2',r.fit?.r2??''],['fit_intercept_standard_error_eV',r.se??''],['independent_onset_standard_uncertainty_eV',r.sigma??''],['sampling_step_eV_not_uncertainty',r.spacing??''],['limitations',r.warnings.map(w=>warnings[w]).join(' ')],[],['energy_eV','analysis_signal'],...r.points,[],['overlay_energy_eV','overlay_signal'],...r.overlay,...(r.derivative?[[],['energy_eV','dEQE_dE'],...r.derivative]:[])];}
for(const id of ['beq','bpl'])$(id+'-compare').addEventListener('click',()=>{$('pv-tab-bandgap').click();$('bga-reference').focus();});
function use(method){const r=records[method];if(!r||method==='pl')return;if(r.value<.5||r.value>3){$(ids[method]+'-message').textContent=errors.range;return;}$('bg-eg').value=r.value.toFixed(6);$('bg-eg').dispatchEvent(new Event('input',{bubbles:true}));$('pv-tab-bandgap').click();$('bandgap-calculator').scrollIntoView({behavior:'auto',block:'start'});}
for(const [method,id]of Object.entries(ids)){if($(id+'-use'))$(id+'-use').addEventListener('click',()=>use(method));$(id+'-export').addEventListener('click',()=>{if(records[method])window.CSVExport.save('bandgap-'+method+'.csv',rows(records[method]));});}
$('bga-reference').addEventListener('change',comparison);
$('bga-export').addEventListener('click',()=>{const ref=$('bga-reference').value;window.CSVExport.save('bandgap-comparison.csv',[['reference_method',ref],['note','Different observables; no average or exciton-binding-energy inference. Compare the same sample and conditions.'],['method','source','observable','estimate_eV','difference_to_reference_meV'],...Object.entries(records).map(([k,r])=>[k,csvText(r.source),r.metric,r.value,(r.value-records[ref].value)*1000]),...Object.values(records).flatMap(r=>[[],...rows(r).filter(row=>!Array.isArray(row)||typeof row[0]!=='number')])]);});
$('bga-method').addEventListener('change',()=>{$('bga-uv').hidden=$('bga-method').value!=='uv';$('bga-ups').hidden=$('bga-method').value!=='ups';});
function params(id){return {lo:number(id+'-lo'),hi:number(id+'-hi'),offset:number(id+'-offset'),unit:'nm'};}
let uvSource=T('Pasted absorption data','Eingefügte Absorptionsdaten','粘贴的吸收光谱'),fileVersion=0;
function uvBounds(){try{const es=M.energy(M.parse($('buv-data').value),{unit:$('buv-unit').value,offset:0});$('buv-offset').value=0;$('buv-lo').value=es[0][0].toFixed(6);$('buv-hi').value=es.at(-1)[0].toFixed(6);}catch{}}
$('buv-calc').addEventListener('click',()=>{try{const r=M.tauc(M.parse($('buv-data').value),{...params('buv'),unit:$('buv-unit').value,signal:$('buv-signal').value,thickness:number('buv-thickness'),background:number('buv-background'),transition:$('buv-transition').value});render(r,uvSource);}catch(e){clear('uv',errors[e.message]||errors.number);}});
$('buv-example').addEventListener('click',()=>{fileVersion++;$('buv-file').value='';$('buv-unit').value='eV';$('buv-signal').value='alpha';$('buv-transition').value='direct';$('buv-background').value=0;$('buv-offset').value=0;$('buv-lo').value=1.62;$('buv-hi').value=1.9;uvSource=T('Synthetic example · Eg = 1.55 eV','Synthetisches Beispiel · Eg = 1,55 eV','模拟示例 · Eg = 1.55 eV');$('buv-source').textContent=uvSource;$('buv-data').value='Energy_eV,alpha_cm-1\n'+Array.from({length:101},(_,i)=>{const e=1.3+i*.01;return e.toFixed(3)+','+(1e5*Math.sqrt(Math.max(0,e-1.55))/e).toFixed(8);}).join('\n');clear('uv');$('buv-calc').click();});
$('buv-choose').addEventListener('click',()=>$('buv-file').click());
$('buv-file').addEventListener('change',async()=>{const f=$('buv-file').files[0],version=++fileVersion;if(!f)return;clear('uv');try{if(f.size>2000000)throw Error('size');if(!/\.(csv|tsv|txt)$/i.test(f.name))throw Error('columns');const text=await f.text();if(version!==fileVersion)return;M.parse(text);$('buv-data').value=text;uvSource=f.name;$('buv-source').textContent=f.name;uvBounds();}catch(e){if(version===fileVersion){$('buv-data').value='';clear('uv',errors[e.message]||errors.number);}}});
$('buv-data').addEventListener('input',()=>{fileVersion++;uvSource=T('Pasted absorption data','Eingefügte Absorptionsdaten','粘贴的吸收光谱');$('buv-source').textContent=uvSource;$('buv-file').value='';clear('uv',words.invalid);});
$('buv-unit').addEventListener('change',uvBounds);
$('buv-signal').addEventListener('change',()=>{$('buv-thickness').disabled=$('buv-signal').value!=='absorbance';});$('buv-thickness').disabled=true;
$('bup-calc').addEventListener('click',()=>{try{render(M.electronic({v:number('bup-v'),c:number('bup-c'),dv:number('bup-dv'),dc:number('bup-dc'),convention:$('bup-convention').value,sv:$('bup-sv').value.trim()===''?null:number('bup-sv'),sc:$('bup-sc').value.trim()===''?null:number('bup-sc')}),T('Entered band onsets','Eingegebene Bandkanten','手动输入的拟合带边'));}catch(e){clear('ups',errors[e.message]||errors.number);}});
function guidePLImport(message){
 clear('pl',message);const details=$('pl-import');details.open=true;
 const blocked=$('pl-intensity-fields').disabled;
 if(blocked){$('bpl-message').textContent=T('Select a reference or relative PL mode above to enable spectrum import. Peak analysis does not require voltage calibration.','Zum Spektrenimport oben Referenz- oder relativen PL-Modus wählen. Für die Peakanalyse ist keine Spannungskalibrierung nötig.','请先在上方“计算方法”选择参考或相对 PL 模式以启用光谱导入；峰位估算无需电压标定。');$('pl-mode').focus();$('pl-mode').scrollIntoView({behavior:'instant',block:'center'});return;}
 details.classList.add('bg-needs-input');$('pl-data').focus({preventScroll:true});details.scrollIntoView({behavior:'instant',block:'start'});
}
const importAction=document.createElement('button');importAction.id='bpl-open-import';importAction.type='button';importAction.className='rl-action';importAction.textContent=T('Import / edit PL spectra ↑','PL-Spektren importieren / bearbeiten ↑','导入／编辑 PL 光谱 ↑');$('bpl-calc').insertAdjacentElement('afterend',importAction);
importAction.addEventListener('click',()=>guidePLImport(T('Import wavelength–intensity spectra above, then estimate the peak.','Oben Wellenlängen–Intensitätsspektren importieren, dann Peak schätzen.','请在上方导入波长—强度光谱，再估算峰位。')));
const exampleAction=document.createElement('button');exampleAction.id='bpl-example';exampleAction.type='button';exampleAction.className='rl-action';exampleAction.textContent=T('Load synthetic reference spectra','Synthetische Referenzspektren laden','载入模拟参考光谱');importAction.insertAdjacentElement('afterend',exampleAction);
const exampleNotice=document.createElement('p');exampleNotice.id='bpl-example-note';exampleNotice.className='rl-small bg-reference-note';exampleNotice.hidden=true;exampleAction.insertAdjacentElement('afterend',exampleNotice);
let plExampleIdentity=null;
exampleAction.addEventListener('click',()=>{
 $('pl-mode').value='relative';$('pl-mode').dispatchEvent(new Event('change',{bubbles:true}));
 $('pl-import').open=true;$('pl-data').value='Wavelength_nm,Synthetic_ref_1.56eV,Synthetic_sample_1.60eV\n'+Array.from({length:251},(_,i)=>{
  const wave=650+i,energy=M.HC/wave;
  return [wave,...[[1.56,1e6],[1.60,1e5]].map(([peak,amplitude])=>amplitude*Math.exp(-.5*((energy-peak)/.035)**2)*M.HC/(wave*wave))].join(',');
 }).join('\n');
 $('pl-data').dispatchEvent(new Event('input',{bubbles:true}));$('pl-import-calculate').click();
 $('pl-file-name').textContent=T('Synthetic reference spectra · 650–900 nm','Synthetische Referenzspektren · 650–900 nm','模拟参考光谱 · 650–900 nm');$('pl-file-name').setAttribute('data-literal','');
 $('bpl-density').value='density';$('bpl-lo').value='1.4';$('bpl-hi').value='1.8';$('bpl-offset').value='0';
 plExampleIdentity=inputs.pl?.()?.identity;
 exampleNotice.textContent=T('Synthetic data for demonstration, not experimental calibration. Known energy-density Gaussian peaks: reference 1.56 eV; sample 1.60 eV. Wavelength step 1 nm, background 0. Loading this example replaces the current PL spectra and clears voltage calibration.','Synthetische Demonstrationsdaten, keine experimentelle Kalibrierung. Bekannte Gauß-Peaks der Energiedichte: Referenz 1,56 eV; Probe 1,60 eV. Wellenlängenschritt 1 nm, Untergrund 0. Das Beispiel ersetzt die aktuellen PL-Spektren und löscht die Spannungskalibrierung.','模拟数据，仅用于操作演示与数值核对，不用于实验校准。已知能量谱密度高斯峰：参考谱 1.56 eV、样品谱 1.60 eV；波长步长 1 nm、背景为 0。载入示例会替换当前 PL 光谱并清除电压标定。');exampleNotice.hidden=false;
 analyze('pl');$('bpl-value').scrollIntoView({behavior:'instant',block:'center'});
});

function analyze(method){const id=ids[method];let state;try{
 state=inputs[method]?.();
 if(method==='pl'&&!state){
  if($('pl-data').value.trim()&&!$('pl-intensity-fields').disabled){$('pl-import-calculate').click();state=inputs.pl?.();}
  if(!state){guidePLImport($('pl-data').value.trim()?T('The PL spectrum could not be processed. Check the import error below.','PL-Spektrum konnte nicht verarbeitet werden. Importfehler unten prüfen.','PL 光谱尚未成功处理，请检查导入区的格式或错误提示。'):T('No PL spectrum is loaded. Import wavelength–intensity data above; a single integrated intensity cannot give a peak energy.','Kein PL-Spektrum geladen. Oben Wellenlängen–Intensitätsdaten importieren; ein einzelnes Integral enthält keine Peakenergie.','尚未导入 PL 光谱。请在已展开的导入区上传或粘贴波长—强度数据；单个积分强度无法给出峰位能量。'));return;}
 }
 if(!state)throw Error('missing');const p=params(id);let r;if(method==='eqe')r=M.eqe(state.points,{...p,smoothing:number('beq-smoothing')});else r=M.pl(state.points,{...p,background:state.background,density:$('bpl-density').value});render(r,state.source);if(method==='pl'){$('pl-import').classList.remove('bg-needs-input');$('bpl-message').textContent=T('PL peak calculated.','PL-Peak berechnet.','PL 峰位已计算。')+' '+$('bpl-message').textContent;}}catch(e){clear(method,errors[e.message]||errors.number);}}
let eqIdentity=null,plIdentity=null,plSource=null,plBackground=null;
function refresh(method){const state=inputs[method]?.(),id=ids[method],identity=state?.identity;
 if(method==='pl'&&state&&identity===plIdentity&&state.source===plSource&&Object.is(state.background,plBackground))return;
 if(method==='pl'){plSource=state?.source;plBackground=state?.background;}
 clear(method,state?'':errors.missing);if(method==='pl'){$('bpl-source').textContent=state?.source||'';if(!state||state.identity!==plExampleIdentity)exampleNotice.hidden=true;}
 if(state&&identity!==(method==='eqe'?eqIdentity:plIdentity)){let es;try{es=M.energy(state.points,{unit:'nm',offset:0});}catch(e){clear(method,errors[e.message]||errors.number);return;}$(id+'-offset').value=0;$(id+'-lo').value=es[0][0].toFixed(6);$(id+'-hi').value=es.at(-1)[0].toFixed(6);if(method==='eqe')eqIdentity=identity;else plIdentity=identity;}
 if(!state){if(method==='eqe')eqIdentity=null;else plIdentity=null;}}
for(const method of ['eqe','pl']){$(ids[method]+'-calc').addEventListener('click',()=>analyze(method));window.addEventListener('bandgap:'+method,()=>refresh(method));}
for(const [method,id]of Object.entries(ids)){const scope=method==='uv'?$('bga-uv'):method==='ups'?$('bga-ups'):method==='eqe'?eqSection:plSection;scope.querySelectorAll('input:not([type=file]),select').forEach(el=>{el.addEventListener('input',()=>clear(method,words.invalid));el.addEventListener('change',()=>clear(method,words.invalid));});clear(method);}
refresh('eqe');refresh('pl');
// Direct links reveal the owning tab before scrolling to the analysis section.
const analysisRoutes={
 'eq-bandgap':['pv-tab-eqe','eq-bandgap'],
 'pl-bandgap':['pv-tab-pl','pl-bandgap'],
 'bandgap-analysis':['pv-tab-bandgap','bandgap-analysis']
};
for(const [host,target,label] of [
 ['eqe-calculator','eq-bandgap',T('Go to bandgap estimate ↓','Zur Bandlückenschätzung ↓','前往带隙估算 ↓')],
 ['pl-voltage-calculator','pl-bandgap',T('Go to PL emission peak ↓','Zum PL-Emissionspeak ↓','前往发射峰与带隙参考 ↓')]
]){
 const link=document.createElement('a');link.href='#'+target;link.className='rl-action bg-jump';link.textContent=label;link.setAttribute('data-literal','');
 link.addEventListener('click',event=>{event.preventDefault();history.replaceState(null,'','#'+target);openAnalysisAnchor();});
 $(host).querySelector('.rl-controls h3').insertAdjacentElement('afterend',link);
}
function openAnalysisAnchor(){
 const fragment=location.hash,route=analysisRoutes[fragment.slice(1)];if(!route)return;
 $(route[0]).click();history.replaceState(null,'',fragment);
 const target=$(route[1]);target.setAttribute('tabindex','-1');target.focus({preventScroll:true});target.scrollIntoView({behavior:'instant',block:'start'});
}
window.addEventListener('hashchange',openAnalysisAnchor);
if(document.readyState==='complete')openAnalysisAnchor();else window.addEventListener('load',()=>requestAnimationFrame(openAnalysisAnchor),{once:true});
})();