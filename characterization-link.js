/* Compare independent measurements for a user-labelled sample; no lifetime, voltage or resistance conversion. */
(function(){
'use strict';
const lang=document.documentElement.lang,T=(en,de,zh)=>lang==='de'?de:lang.startsWith('zh')?zh:en,$=id=>document.getElementById(id);
const fmt=v=>Number.isFinite(v)?v!==0&&(Math.abs(v)<.001||Math.abs(v)>1e4)?v.toExponential(4):String(Number(v.toPrecision(6))):'—';
const safe=v=>typeof v==='string'&&/^[=+@-]/.test(v.trimStart())?"'"+v:v;
let sclc=null;const panels={};
const idField=kind=>$(kind==='sclc'?'sclc-sampleid':kind+'-comparison-sample'),conditionField=kind=>$(kind==='sclc'?'sclc-conditions':kind+'-comparison-conditions');
const identity=kind=>idField(kind)?.value.trim()||'';
for(const kind of ['pl','trpl']){
 const root=$(kind==='pl'?'pl-voltage-calculator':'trpl-calculator');if(!root)continue;
 const fields=document.createElement('fieldset');fields.className='rl-field char-identity';fields.setAttribute('data-literal','');
 fields.innerHTML='<label for="'+kind+'-comparison-sample">'+T('Sample / device ID for SCLC comparison','Proben- / Geräte-ID für SCLC-Vergleich','SCLC 对照用样品／器件 ID')+'</label><input type="text" maxlength="80" id="'+kind+'-comparison-sample"><label for="'+kind+'-comparison-conditions">'+T('Measurement conditions','Messbedingungen','测量条件')+'</label><input type="text" maxlength="240" id="'+kind+'-comparison-conditions">';
 const controls=root.querySelector('.rl-controls');controls.querySelector('h3').after(fields);
 for(const suffix of ['data','file','sample'])$(kind+'-'+suffix)?.addEventListener(suffix==='data'?'input':'change',()=>{idField(kind).value='';conditionField(kind).value='';render();});
 $(kind==='pl'?'pl-reset':'trpl-example')?.addEventListener('click',()=>{idField(kind).value='';conditionField(kind).value='';render();});
 root.addEventListener('input',render);root.addEventListener('change',render);
}
for(const [kind,id]of [['sclc','sclc-calculator'],['pl','pl-voltage-calculator'],['trpl','trpl-calculator']]){
 const host=$(id);if(!host)continue;const panel=document.createElement('section');panel.className='char-comparison';panel.id=kind+'-sclc-comparison';panel.hidden=true;panel.setAttribute('data-literal','');
 panel.innerHTML='<h3>'+T('Same-sample SCLC / PL / TRPL comparison','SCLC / PL / TRPL derselben Probe','同一样品 SCLC／PL／TRPL 对照')+'</h3><p class="rl-small char-source"></p><p class="rl-small char-status" role="status"></p><div class="rl-table-wrap"><table class="rl-table"><tbody></tbody></table></div><p class="rl-small">'+T('Matching IDs are a user assertion. Check device structure, bias, illumination, temperature and acquisition history. Nt,app, mobility, PL voltage and empirical PL decay times remain independent quantities; no direct conversion or automatic mechanism assignment. Resend after changing SCLC; edits to PL/TRPL clear or update their live comparison.','Gleiche IDs sind eine Nutzerzuordnung. Struktur, Bias, Beleuchtung, Temperatur und Messhistorie prüfen. Nt,app, Mobilität, PL-Spannung und empirische PL-Abklingzeiten bleiben unabhängige Größen; keine direkte Umrechnung oder automatische Mechanismuszuordnung. Nach SCLC-Änderungen erneut senden; PL/TRPL aktualisieren den aktuellen Vergleich.','ID 相同仅表示用户指定同一样品，仍需核对器件结构、偏压、光照、温度和测量历史。Nt,app、迁移率、PL 电压与经验 PL 衰减时间保持各自含义，不直接互换或自动归属机制。修改 SCLC 后需重新发送；PL／TRPL 的改动会清除或更新当前对照。')+'</p><button type="button" class="rl-action char-clear">'+T('Clear SCLC comparison','SCLC-Vergleich löschen','清除 SCLC 对照')+'</button>';
 const output=host.querySelector('.rl-output'),metrics=output.querySelector('.rl-metrics,.pl-metrics,.trpl-metrics');(metrics||output.querySelector('h3')).after(panel);panel.querySelector('button').addEventListener('click',clear);panels[kind]=panel;
}
function read(kind){try{return kind==='pl'?window.PLVoltageLab?.comparisonSummary():window.TRPLLab?.comparisonSummary();}catch{return null;}}
function matching(kind){return !!sclc&&identity(kind)===sclc.sampleId;}
function render(){
 for(const [kind,panel]of Object.entries(panels)){
  panel.hidden=!sclc;if(!sclc)continue;
  panel.querySelector('.char-source').textContent=T('SCLC snapshot: ','SCLC-Schnappschuss: ','SCLC 快照：')+sclc.sampleId+' · '+sclc.source+' · '+(sclc.conditions||T('conditions not specified','Bedingungen nicht angegeben','未填写条件'));
  const rows=[['SCLC · Nt,app (cm⁻³)',sclc.nt],['SCLC · μapp (cm² V⁻¹ s⁻¹)',sclc.mu],['SCLC · V₂ (Veff)',sclc.tfl]],states=[];
  for(const dest of kind==='sclc'?['pl','trpl']:[kind]){
   const r=read(dest),match=matching(dest);states.push(dest.toUpperCase()+': '+(!identity(dest)?T('enter this measurement’s sample ID','ID dieser Messung eingeben','请填写本次测量的样品 ID'):!match?T('sample ID mismatch; excluded','abweichende ID; ausgeschlossen','样品 ID 不同，未纳入'):!r?T('no current valid result','kein aktuelles gültiges Ergebnis','当前没有有效结果'):T('matching ID; current result','gleiche ID; aktuelles Ergebnis','ID 相符，使用当前结果')));
   if(r&&match){
    if(dest==='pl')rows.push(['PL · ΔVint (V)',r.delta],['PL · Vint (V)',r.voltage],['PL · QFLS (eV)',r.qfls]);
    else rows.push(['TRPL · τA (ns)',r.tauA],['TRPL · τI (ns)',r.tauI],['TRPL · R²',r.r2]);
    states.push(dest.toUpperCase()+' · '+r.sample+' · '+(conditionField(dest).value.trim()||T('conditions not specified','Bedingungen nicht angegeben','未填写条件'))+(r.weak?' · '+T('check fit constraints','Fitgrenzen prüfen','需检查拟合约束'):''));
   }
  }
  panel.querySelector('.char-status').textContent=states.join(' · ');const body=panel.querySelector('tbody');body.replaceChildren();
  for(const [key,value]of rows){const row=document.createElement('tr'),label=document.createElement('th'),cell=document.createElement('td');label.scope='row';label.textContent=key;cell.textContent=fmt(value);row.append(label,cell);body.append(row);}
 }
}
function clear(){sclc=null;render();}
window.CharacterizationLink={receive(r,source){
 const p=r?.parameters;if(!p||typeof p.sampleId!=='string'||!p.sampleId.trim()||p.sampleId.length>80||typeof p.conditions!=='string'||p.conditions.length>240||typeof source!=='string'||source.length>2000||[r.nt,r.mu,r.tfl].some(v=>v!==null&&(!Number.isFinite(v)||v<=0)))return false;
 sclc={sampleId:p.sampleId.trim(),conditions:p.conditions,source,nt:r.nt,mu:r.mu,tfl:r.tfl,thickness:p.thickness,epsilon:p.epsilon,scan:p.scan+1};render();return true;
},clear,appendRows(kind,rows){
 rows.push([],['comparison_sample_id',safe(identity(kind))],['comparison_conditions',safe(conditionField(kind)?.value.trim()||'')]);if(!sclc)return;
 rows.push(['SCLC_comparison_sample_id',safe(sclc.sampleId)],['SCLC_comparison_source',safe(sclc.source)],['SCLC_comparison_conditions',safe(sclc.conditions)],['comparison_note','Independent quantities; sample IDs are user assertions, not proof of matched device or conditions. No direct resistance, voltage or lifetime conversion.']);
 const ownMatch=matching(kind);rows.push(['SCLC_matches_current_sample',ownMatch]);if(!ownMatch)return;
 for(const [key,value]of Object.entries(sclc))if(typeof value==='number'||value===null)rows.push(['linked_SCLC_'+key,value??'']);
 for(const dest of ['pl','trpl']){const r=read(dest),match=matching(dest);rows.push(['linked_'+dest+'_same_sample',match]);if(match&&r)for(const [key,value]of Object.entries(r))rows.push(['linked_'+dest+'_'+key,safe(value??'')]);}
}};
window.addEventListener('bandgap:pl',render);
const trplRows=$('trpl-rows');if(trplRows)new MutationObserver(render).observe(trplRows,{childList:true,subtree:true,characterData:true});
render();
})();
