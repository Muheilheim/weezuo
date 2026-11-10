/* Measured J–V: Green 1981, doi:10.1016/0038-1101(81)90062-9; apparent slope resistance: Tada 2018, doi:10.1002/pssa.201800448.
 * Spectrum change of variable: doi:10.1021/jz401508t, with absorption correction doi:10.1021/jz502066v. */
(function(root){
'use strict';
const HC=6.62607015e-34*299792458/1.602176634e-19*1e9;
const fail=code=>{throw Error(code);};
const finite=x=>Number.isFinite(x);
function parseJV(text){
 if(typeof text!=='string'||text.length>2000000)fail('size');
 const numeric=/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i;
 const points=[];let header=false,voltageUnit=null,currentUnit=null;
 for(const raw of text.replace(/^\uFEFF/,'').split(/\r?\n/)){
  const line=raw.trim();if(!line||line.startsWith('#'))continue;
  const cells=(/[\t;,]/.test(line)?line.split(/[\t;,]/):line.split(/\s+/)).map(x=>x.trim().replace(/^"(.*)"$/,'$1'));
  if(cells.length!==2)fail('columns');
  if(cells.every(x=>numeric.test(x)&&finite(Number(x))))points.push(cells.map(Number));
  else if(!header&&!points.length&&cells.every(x=>/[a-zA-Z\u4e00-\u9fff]/.test(x)&&!/^[-+]?(?:nan|inf(?:inity)?)$/i.test(x))){
   const v=cells[0].normalize('NFKC'),j=cells[1].normalize('NFKC').replace(/\s/g,'').replace(/\^/g,'').replace(/\u2212/g,'-').replace(/\/?cm-2/gi,'/cm2');
   if(!/voltage|potential|bias|spannung|电压|^(?:mV|V)(?:$|[ _([])/i.test(v))fail('header');
   if(!/current|strom|电流|^[JI](?:$|[ _([])|^(?:mA|A)(?:$|\/)/i.test(j))fail('header');
   if(/(?:^|[^a-z])(?:uV|kV|µV|μV)(?:$|[^a-z])/i.test(v)||/[µμu]A|nA|m2(?!\d)|mm2/i.test(j.replace(/cm2/gi,'')))fail('unit');
   if(/(?:^|[^a-z])mV(?:$|[^a-z])/i.test(v))voltageUnit='mV';
   else if(/(?:^|[^a-z])V(?:$|[^a-z])/i.test(v))voltageUnit='V';
   if(/mA\/cm2/i.test(j))currentUnit='mAcm2';
   else if(/A\/cm2/i.test(j))currentUnit='Acm2';
   else if(/(?:^|[^a-z])mA(?:$|[^a-z])/i.test(j))currentUnit='mA';
   else if(/(?:^|[^a-z])A(?:$|[^a-z])/.test(j))currentUnit='A';
   header=true;
  }else fail('format');
  if(points.length>20000)fail('count');
 }
 if(points.length<5)fail('count');
 return {points,voltageUnit,currentUnit};
}
function splitSweeps(points){
 const sweeps=[];let rows=[points[0]],direction=0;
 for(let i=1;i<points.length;i++){
  const previous=points[i-1],point=points[i],step=Math.sign(point[0]-previous[0]);
  if(step===0){
   if(point[1]===previous[1])continue;
   if(rows.length<5)fail('sweep');
   sweeps.push({points:rows,direction});rows=[point];direction=0;continue;
  }
  if(direction&&step!==direction){if(rows.length<5)fail('sweep');sweeps.push({points:rows,direction});rows=[previous,point];}
  else rows.push(point);
  direction=step;
 }
 if(rows.length<5||!direction)fail('sweep');
 sweeps.push({points:rows,direction});
 if(sweeps.length>20)fail('sweep');
 return sweeps;
}
function at(points,v){
 const exact=points.find(p=>p[0]===v);if(exact)return exact[1];
 for(let i=1;i<points.length;i++){
  const a=points[i-1],b=points[i];
  if(a[0]<v&&b[0]>v)return a[1]+(b[1]-a[1])*(v-a[0])/(b[0]-a[0]);
 }
 fail('zero');
}
function slopeFit(points,center,halfWidth){
 const rows=points.filter(p=>Math.abs(p[0]-center)<=halfWidth+1e-12);
 if(rows.length<3)return {resistance:null,count:rows.length,lo:null,hi:null,r2:null};
 const mx=rows.reduce((s,p)=>s+p[0],0)/rows.length,my=rows.reduce((s,p)=>s+p[1],0)/rows.length;
 let xx=0,xy=0,yy=0;
 for(const [x,y]of rows){xx+=(x-mx)**2;xy+=(x-mx)*(y-my);yy+=(y-my)**2;}
 const slope=xy/xx,intercept=my-slope*mx;
 const residual=rows.reduce((s,[x,y])=>s+(y-intercept-slope*x)**2,0);
 const resistance=Math.abs(slope)<1e-12?Infinity:slope<0?1000/-slope:null;
 return {resistance,count:rows.length,lo:rows[0][0],hi:rows.at(-1)[0],slope,intercept,r2:yy?Math.max(0,1-residual/yy):1};
}
function analyzeJV(data,p){
 if(!data||!Array.isArray(data.points)||data.points.length<5||data.points.length>20000||data.points.some(row=>!Array.isArray(row)||row.length!==2||!row.every(finite)))fail('format');
 if(!['V','mV'].includes(p.voltageUnit)||!['mAcm2','Acm2','mA','A'].includes(p.currentUnit))fail('unit');
 if(data.voltageUnit&&data.voltageUnit!==p.voltageUnit||data.currentUnit&&data.currentUnit!==p.currentUnit)fail('mismatch');
 if(!finite(p.pin)||p.pin<=0)fail('pin');
 if(!finite(p.fitPercent)||p.fitPercent<=0||p.fitPercent>25)fail('window');
 const isCurrent=['A','mA'].includes(p.currentUnit);
 if(isCurrent&&(!finite(p.area)||p.area<=0))fail('area');
 const scale=(['A','Acm2'].includes(p.currentUnit)?1000:1)/(isCurrent?p.area:1);
 const converted=data.points.map(([v,j])=>[v/(p.voltageUnit==='mV'?1000:1),j*scale]);
 if(converted.some(row=>!row.every(finite)))fail('range');
 return splitSweeps(converted).map((sweep,index)=>{
  const points=[...sweep.points].sort((a,b)=>a[0]-b[0]);
  const j0=at(points,0);if(j0===0)fail('jsc');
  const polarity=Math.sign(j0),signed=points.map(([v,j])=>[v,j*polarity]),jsc=Math.abs(j0);
  const roots=[];
  for(let i=0;i<signed.length;i++){
   const a=signed[i],b=signed[i+1];
   if(a[0]!==0&&a[1]===0)roots.push(a[0]);
   if(b&&a[1]*b[1]<0){const v=a[0]-a[1]*(b[0]-a[0])/(b[1]-a[1]);if(v!==0)roots.push(v);}
  }
  if(!roots.length)fail('voc');
  const voltagePolarity=Math.sign(roots[0]);
  if(roots.some(v=>Math.sign(v)!==voltagePolarity))fail('crossings');
  const voc=Math.min(...roots.map(Math.abs)),normalized=signed.map(([v,j])=>[v===0?0:v*voltagePolarity,j]).sort((a,b)=>a[0]-b[0]),noiseTolerance=jsc*.001;
  // shortcut: 0.1% of Jsc bounds post-crossing recovery; use instrument uncertainty for calibrated noise handling.
  if(roots.length>1&&normalized.some(([v,j])=>v>voc&&j>noiseTolerance))fail('crossings');
  const knots=[[0,jsc],...normalized.filter(([v])=>v>0&&v<voc),[voc,0]];
  let pmax=0,vmp=0,jmp=0;
  const consider=(v,j)=>{if(v*j>pmax){pmax=v*j;vmp=v;jmp=j;}};
  for(let i=1;i<knots.length;i++){
   const a=knots[i-1],b=knots[i],m=(b[1]-a[1])/(b[0]-a[0]),c=a[1]-m*a[0];
   consider(a[0],a[1]);consider(b[0],b[1]);
   const vertex=-c/(2*m);if(m<0&&vertex>a[0]&&vertex<b[0])consider(vertex,c+m*vertex);
  }
  const ff=100*pmax/(voc*jsc),pce=100*pmax/p.pin;
  if(![jsc,voc,pmax,vmp,jmp,ff,pce].every(finite)||pmax<=0)fail('range');
  const rs=slopeFit(normalized,voc,p.fitPercent*voc/100),rsh=slopeFit(normalized,0,p.fitPercent*voc/100),warnings=[];
  if(roots.length>1)warnings.push('noise_crossings');
  for(const [name,fit]of [['rs',rs],['rsh',rsh]])if(fit.resistance===null)warnings.push(fit.count<3?'sparse_'+name:'slope_'+name);
  if(normalized.some((p,i)=>i&&p[0]>=0&&p[0]<=voc&&p[1]>normalized[i-1][1]+jsc*1e-3))warnings.push('nonmonotonic');
  if(ff>100||pce>100)warnings.push('physical');
  return {index:index+1,direction:sweep.direction,points:normalized,polarity,voltagePolarity,signedVoc:voc*voltagePolarity,zeroCrossings:roots.length,noiseTolerance,jsc,voc,pmax,vmp,jmp,ff,pce,rs,rsh,warnings,parameters:{...p}};
 });
}
function convertSpectrum(points,{unit='nm',density=false}={}){
 if(!['nm','eV'].includes(unit)||typeof density!=='boolean')fail('unit');
 if(!Array.isArray(points)||points.length<2||points.length>20000)fail('count');
 const width=points[0]?.length,seen=new Set();
 if(width<2||width>101)fail('columns');
 const result=points.map(row=>{
  if(!Array.isArray(row)||row.length!==width||!row.every(finite)||row[0]<=0)fail('format');
  if(seen.has(row[0]))fail('duplicate');seen.add(row[0]);
  const wavelength=unit==='nm'?row[0]:HC/row[0],energy=unit==='nm'?HC/row[0]:row[0],factor=unit==='nm'&&density?wavelength*wavelength/HC:1;
  const values=[energy,...row.slice(1).map(y=>y*factor)];
  if(!values.every(finite)||energy<=0||!finite(wavelength))fail('range');
  return {values,wavelength};
 }).sort((a,b)=>a.values[0]-b.values[0]);
 return {points:result.map(r=>r.values),wavelengths:result.map(r=>r.wavelength),unit,density,spacing:'original samples; increasing energy; no resampling'};
}
const api={HC,parseJV,splitSweeps,analyzeJV,convertSpectrum};
if(typeof module==='object'&&module.exports)module.exports=api;else root.MeasurementModel=api;
})(typeof globalThis!=='undefined'?globalThis:this);
