/* PLQY-derived internal-voltage pseudo J-V. Positive current denotes power output.
 * Boltzmann calibration, constant generation/optics/temperature, no transport model.
 */
(function(root){
'use strict';
const VT=1.380649e-23/1.602176634e-19;
const fail=code=>{throw Error(code);};
function bounded(v,lo,hi){if(!Number.isFinite(v)||v<lo||v>hi)fail('range');}
function common(p){
 bounded(p.temperature,200,400);bounded(p.generation,1e-6,1000);bounded(p.pin,.01,1000);
 if(!Number.isFinite(p.j0rad)||p.j0rad<=0||p.j0rad>1)fail('j0');
 return VT*p.temperature;
}
function voltage(s,eta,p){
 if(!Number.isFinite(s)||s<=0||!Number.isFinite(eta)||eta<=0||eta>1)fail('yield');
 const v=VT*p.temperature*(Math.log(eta)+Math.log(s)+Math.log(p.generation)-Math.log(1000)-Math.log(p.j0rad));
 if(!Number.isFinite(v))fail('number');return v;
}
function parse(text,p){
 if(typeof text!=='string'||text.length>2000000)fail('size');
 if(!['percent','fraction'].includes(p.yieldUnit)||!['suns','current'].includes(p.xUnit))fail('unit');
 const number=/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i;
 const rows=[];let header=false;
 for(const raw of text.replace(/^\uFEFF/,'').split(/\r?\n/)){
  const line=raw.trim();if(!line||line.startsWith('#'))continue;
  const sep=line.includes('\t')?'\t':line.includes(';')?';':line.includes(',')?',':/\s+/;
  const cells=line.split(sep).map(v=>v.trim().replace(/^"([^"]*)"$/,'$1'));
  if(cells.length!==2)fail('columns');
  const values=cells.map(v=>number.test(v)?Number(v):NaN);
  if(values.some(v=>!Number.isFinite(v))){
   if(rows.length||header||!/(?:suns?|intensity|light|generation|current|jg|光强|电流|intensit)/i.test(cells[0])||!/plqy|quantum.?yield|量子产率/i.test(cells[1]))fail('columns');
   // Explicit units are never guessed. Bare labels use the selected units.
   const clean=v=>v.normalize('NFKC').replace(/[−–⁻]/g,'-').replace(/[_()\[\]{}]/g,' ').trim();
   const hx=clean(cells[0]),hy=clean(cells[1]);
   const sun=/\bsuns?\b/i.test(hx),current=/current|电流|strom|\bjg\b/i.test(hx);
   const xu=hx.replace(/(?:absorbed|excitation|relative|reference|target|intensity|light|generation|current|density|suns?|\bjg\b|\bref\b|\bto\b|光强|激发|电流密度|电流|光生|目标|相对|anregungsintensität|intensität|generationsstrom|stromdichte)/gi,'').replace(/[\s·*^]/g,'');
   if(xu&&!/^mA(?:\/cm2|cm-?2)$/.test(xu))fail('unit');
   const x=sun?'suns':current||xu?'current':null;
   if(sun&&(current||xu))fail('unit');
   const yu=hy.replace(/(?:external|absolute|photoluminescence|quantum[\s-]*yield|plqy|量子产率|外部|绝对|externe)/gi,'').replace(/\s/g,'');
   const y=/^(?:%|percent|percentage|百分比|百分数|百分)$/i.test(yu)?'percent':/^(?:fraction|0-1|1|dimensionless|unitless|小数|无量纲|anteil)$/i.test(yu)?'fraction':null;
   if(yu&&!y)fail('unit');
   if((x&&x!==p.xUnit)||(y&&y!==p.yieldUnit))fail('unit');
   header=true;continue;
  }
  const [x,y]=values;const eta=y/(p.yieldUnit==='percent'?100:1);
  if(x<=0||eta<=0||eta>1)fail('yield');
  rows.push([x,eta]);if(rows.length>2000)fail('count');
 }
 if(rows.length<5)fail('count');rows.sort((a,b)=>a[0]-b[0]);
 for(let i=1;i<rows.length;i++)if(rows[i][0]===rows[i-1][0])fail('duplicate');
 return rows;
}
function metrics(voc,jg,pin,peak){
 const ff=peak.power/(voc*jg),efficiency=peak.power/pin*100;
 if(![voc,ff,efficiency,peak.v,peak.j,peak.power].every(Number.isFinite)||voc<=0||ff<=0||ff>=1||peak.power<=0)fail('number');
 return {voc,ff,efficiency,vmp:peak.v,jmp:peak.j,pmax:peak.power,generation:jg};
}
function simulate(p){
 const thermal=common(p);bounded(p.plqy,Number.MIN_VALUE,100);bounded(p.ideality,1,2);
 const voc=voltage(1,p.plqy/100,p);if(voc<.05||voc>3)fail('voc');
 const a=p.ideality*thermal,z=voc/a,den=Math.expm1(z);
 const current=v=>p.generation*(1-Math.expm1(v/a)/den);
 let lo=0,hi=z;
 // At MPP u + ln(1+u) = Voc/(n Vt), retaining the diode -1 term.
 for(let i=0;i<80;i++){const u=(lo+hi)/2;if(u+Math.log1p(u)>z)hi=u;else lo=u;}
 const vmp=a*(lo+hi)/2,jmp=current(vmp),peak={v:vmp,j:jmp,power:vmp*jmp};
 const points=Array.from({length:301},(_,i)=>{const v=voc*i/300;return {v,j:i===300?0:current(v),kind:'model'};});
 return {mode:'single',...metrics(voc,p.generation,p.pin,peak),points,observations:[],inputPoints:[],parameters:Object.fromEntries(['temperature','generation','j0rad','pin','plqy','ideality'].map(k=>[k,p[k]])),thermal,coverage:{minVoltage:0,maxVoltage:voc,globalMPP:true,oneSunInterpolated:false},warnings:['single','transport'],method:'PLQY-calibrated constant-n single diode; diode minus-one retained; no Rs/Rsh'};
}
function reconstruct(rows,p){
 const thermal=common(p);if(!Array.isArray(rows)||rows.length<5||rows.length>2000)fail('count');
 const data=rows.map(row=>{if(!Array.isArray(row)||row.length!==2)fail('columns');const [x,eta]=row;return {s:p.xUnit==='suns'?x:x/p.generation,eta};}).sort((a,b)=>a.s-b.s);
 if(!['suns','current'].includes(p.xUnit))fail('unit');
 for(let i=0;i<data.length;i++){
  const r=data[i];r.v=voltage(r.s,r.eta,p);r.j=p.generation*(1-r.s);r.kind='input';
  if(!Number.isFinite(r.j))fail('number');
  if(r.v<=0||r.v>3)fail('voc');
  if(i&&r.s===data[i-1].s)fail('duplicate');
  if(i&&r.v<=data[i-1].v+1e-12)fail('monotonic');
 }
 const exact=data.find(r=>Math.abs(r.s-1)<1e-12);
 if(data[0].s>=1||(!exact&&data.at(-1).s<1))fail('coverage');
 let anchor,oneSunInterpolated=!exact;
 if(exact)anchor={...exact,s:1,j:0};
 else{
  const hi=data.findIndex(r=>r.s>1),a=data[hi-1],b=data[hi],f=-Math.log(a.s)/(Math.log(b.s)-Math.log(a.s));
  anchor={s:1,eta:Math.exp(Math.log(a.eta)*(1-f)+Math.log(b.eta)*f),v:a.v+(b.v-a.v)*f,j:0,kind:'interpolated'};
 }
 const used=[...data.filter(r=>r.s<1-1e-12),anchor];if(used.length<5)fail('count');
 let peak={v:used[0].v,j:used[0].j,power:used[0].v*used[0].j};
 const points=[];
 for(let i=1;i<used.length;i++){
  const left=used[i-1],right=used[i],logLeft=Math.log(left.s),a=(right.v-left.v)/(Math.log(right.s)-logLeft);
  const at=v=>{const s=Math.exp(logLeft+(v-left.v)/a);return {v,j:p.generation*(1-s),s,kind:'interpolation'};};
  const power=v=>{const r=at(v);return {...r,power:r.v*r.j};};
  let lo=left.v,hi=right.v;
  for(let k=0;k<70;k++){const v=(lo+hi)/2,s=Math.exp(logLeft+(v-left.v)/a);if(1-s*(1+v/a)>0)lo=v;else hi=v;}
  for(const candidate of [power(left.v),power(right.v),power((lo+hi)/2)])if(candidate.power>peak.power)peak=candidate;
  const n=Math.max(1,Math.ceil(300/(used.length-1)));
  for(let k=i===1?0:1;k<=n;k++)points.push(at(left.v+(right.v-left.v)*k/n));
 }
 points.at(-1).j=0;
 // Unmeasured 0..Vmin cannot beat Pmax when P <= Vmin*JG throughout it.
 const globalMPP=peak.power>=used[0].v*p.generation*(1+1e-12);
 const warnings=['transport','jgProxy'];if(!globalMPP)warnings.push('partial');if(oneSunInterpolated)warnings.push('anchor');
 if(used.some((r,i)=>i&&Math.log(r.s/used[i-1].s)>Math.log(10)))warnings.push('sparse');
 return {mode:'data',...metrics(anchor.v,p.generation,p.pin,peak),points,observations:used,inputPoints:data,parameters:Object.fromEntries(['temperature','generation','j0rad','pin','xUnit','yieldUnit'].map(k=>[k,p[k]])),thermal,coverage:{minVoltage:used[0].v,maxVoltage:anchor.v,globalMPP,oneSunInterpolated},warnings,method:'Suns-PLQY; log(S)-log(PLQY) interpolation; Jout=JG,ref*(1-S); no extrapolation; FF normalized to assumed Jsc=JG,ref'};
}
function example(){
 const p={temperature:300,generation:25,j0rad:1e-23,pin:100,plqy:1,ideality:1.5,xUnit:'suns',yieldUnit:'percent'};
 const rows=Array.from({length:41},(_,i)=>{const s=10**(-5+5*i/40);return [s,.01*s**.5];});return {parameters:p,rows,text:'Intensity_suns,PLQY_percent\n'+rows.map(([s,y])=>s+','+y*100).join('\n')};
}
function exportRows(r,source){
 const safe=v=>/^\s*[=+@-]/.test(v)?"'"+v:v;
 return [['source',safe(source)],['mode',r.mode],['method',r.method],...Object.entries(r.parameters).map(([k,v])=>['input_'+k,v]),['implied_Voc_V',r.voc],['assumed_Jsc_mA_cm2',r.generation],['pseudo_FF_JG_normalized_percent',r.ff*100],['pseudo_efficiency_percent',r.efficiency],['Vmp_V',r.vmp],['Jmp_mA_cm2',r.jmp],['Pmax_mW_cm2',r.pmax],['measured_voltage_min_V',r.coverage.minVoltage],['global_MPP_covered_given_JleJG',r.coverage.globalMPP],['one_sun_anchor_interpolated',r.coverage.oneSunInterpolated],['limitations',r.warnings.join(';')],[],['internal_voltage_V','positive_output_current_mA_cm2','output_power_mW_cm2','curve_origin'],...r.points.map(x=>[x.v,x.j,x.v*x.j,x.kind]),[],['supplied_excitation_suns','PLQY_fraction','internal_voltage_V','output_current_mA_cm2','origin'],...r.inputPoints.map(x=>[x.s,x.eta,x.v,x.j,x.kind])];
}
const api={VT,parse,voltage,simulate,reconstruct,example,exportRows};if(typeof module==='object'&&module.exports)module.exports=api;else root.PLPseudoJV=api;
})(typeof globalThis!=='undefined'?globalThis:this);
