/* Single-temperature dark J–V: empirical slopes, not a unique circuit or mechanism fit. */
(function(root){
'use strict';
const M=typeof module==='object'&&module.exports?require('./measurement-model.js'):root.MeasurementModel;
const finite=Number.isFinite,fail=code=>{throw Error(code);},KTQ=1.380649e-23/1.602176634e-19;
function fit(rows,min=3){
 const base={count:rows.length,lo:rows[0]?.[0]??null,hi:rows.at(-1)?.[0]??null,slope:null,intercept:null,r2:null};
 if(rows.length<min)return base;
 const mx=rows.reduce((s,p)=>s+p[0],0)/rows.length,my=rows.reduce((s,p)=>s+p[1],0)/rows.length;
 let xx=0,xy=0,yy=0;for(const [x,y]of rows){xx+=(x-mx)**2;xy+=(x-mx)*(y-my);yy+=(y-my)**2;}
 if(!(xx>0))return base;
 const slope=xy/xx,intercept=my-slope*mx,residual=rows.reduce((s,[x,y])=>s+(y-intercept-slope*x)**2,0),r2=yy?Math.max(0,1-residual/yy):1;
 return [slope,intercept,r2].every(finite)?{...base,slope,intercept,r2}:base;
}
function at(rows,x){
 if(!rows.length||x<rows[0][0]||x>rows.at(-1)[0])return null;
 let lo=0,hi=rows.length-1;while(lo<=hi){const mid=(lo+hi)>>1;if(rows[mid][0]===x)return rows[mid][1];if(rows[mid][0]<x)lo=mid+1;else hi=mid-1;}
 const a=rows[hi],b=rows[lo];return a[1]*(1-(x-a[0])/(b[0]-a[0]))+b[1]*((x-a[0])/(b[0]-a[0]));
}
function analyze(data,p){
 if(!data||!Array.isArray(data.points)||data.points.length<5||data.points.length>20000||data.points.some(a=>!Array.isArray(a)||a.length!==2||!a.every(finite)))fail('format');
 if(!p||!['V','mV'].includes(p.voltageUnit)||!['Acm2','mAcm2','A','mA'].includes(p.currentUnit))fail('unit');
 if(data.voltageUnit&&data.voltageUnit!==p.voltageUnit||data.currentUnit&&data.currentUnit!==p.currentUnit)fail('mismatch');
 if(![p.reverseSign,p.currentSign].every(s=>s===1||s===-1))fail('dark_sign');
 const isCurrent=['A','mA'].includes(p.currentUnit),area=p.area??null,thickness=p.thickness??null;
 if(area!==null&&(!finite(area)||area<=0)||isCurrent&&area===null)fail('area');
 if(![p.probe,p.temperature,p.zeroWindow,p.threshold].every(v=>finite(v)&&v>0)||!finite(p.fitLo)||p.fitLo<=0||!finite(p.fitHi)||p.fitHi<=p.fitLo||thickness!==null&&(!finite(thickness)||thickness<=0)||p.noiseFloor!=null&&(!finite(p.noiseFloor)||p.noiseFloor<=0))fail('dark_parameters');
 if(typeof p.sampleId!=='string'||p.sampleId.length>80||typeof p.conditions!=='string'||p.conditions.length>240)fail('dark_identity');
 const scale=(p.currentUnit.startsWith('mA')?.001:1)/(isCurrent?area:1),noiseFloor=p.noiseFloor==null?null:p.noiseFloor*scale;
 const converted=data.points.map(([v,j])=>[v/(p.voltageUnit==='mV'?1000:1),j*scale]);
 if(!finite(scale)||noiseFloor!==null&&(!finite(noiseFloor)||noiseFloor<=0)||converted.some(a=>!a.every(finite)))fail('range');
 return M.splitSweeps(converted).map((sweep,index)=>{
  const points=[...sweep.points].sort((a,b)=>a[0]-b[0]),forward=points.map(([v,j])=>[-p.reverseSign*v,p.currentSign*j]).sort((a,b)=>a[0]-b[0]);
  const above=j=>Math.abs(j)>(noiseFloor??0),warnings=[],jZero=at(points,0),reverseV=p.reverseSign*p.probe,forwardV=-reverseV,reverseJ=at(points,reverseV),forwardJ=at(points,forwardV);
  if(noiseFloor===null)warnings.push('noise_unknown');
  if(jZero===null)warnings.push('zero_uncovered');else if(noiseFloor!==null&&Math.abs(jZero)>noiseFloor)warnings.push('zero_offset');
  if(reverseJ===null||forwardJ===null)warnings.push('probe_uncovered');
  let rectification=null,rectificationLowerBound=null;
  if(reverseJ!==null&&forwardJ!==null){
   if(above(reverseJ)&&above(forwardJ))rectification=Math.abs(forwardJ)/Math.abs(reverseJ);
   else if(noiseFloor!==null&&Math.abs(reverseJ)<=noiseFloor&&Math.abs(forwardJ)>noiseFloor)rectificationLowerBound=Math.abs(forwardJ)/noiseFloor;
   else warnings.push('ratio_unresolved');
   if(noiseFloor!==null&&Math.abs(reverseJ)<=noiseFloor)warnings.push('reverse_below_floor');
  }
  const zeroRows=forward.filter(([v])=>Math.abs(v)<=p.zeroWindow+1e-12),zero=fit(zeroRows);
  zero.bracketsZero=zeroRows.length>0&&zeroRows[0][0]<0&&zeroRows.at(-1)[0]>0;
  zero.resistance=zero.slope===null?null:zero.slope===0?Infinity:1/zero.slope;
  zero.usable=zero.bracketsZero&&finite(zero.resistance)&&zero.resistance>0&&zero.r2>=.98;
  if(!zero.bracketsZero||zero.slope===null)warnings.push('zero_fit_sparse');else if(!(zero.slope>0))warnings.push('zero_slope');else if(zero.r2<.98)warnings.push('zero_fit_quality');
  const inWindow=forward.filter(([v])=>v>=p.fitLo-1e-12&&v<=p.fitHi+1e-12),positive=inWindow.filter(([,j])=>j>0&&above(j)),diode=fit(positive.map(([v,j])=>[v,Math.log(j)]),4);
  diode.excluded=inWindow.length-positive.length;diode.warnings=[];diode.n=null;diode.j0=null;
  diode.decades=positive.length?Math.log10(Math.max(...positive.map(a=>a[1])))-Math.log10(Math.min(...positive.map(a=>a[1]))):0;
  if(diode.slope!==null&&diode.slope>0){const n=1/(KTQ*p.temperature*diode.slope),j0=Math.exp(diode.intercept);if(finite(n)&&n>0&&finite(j0)&&j0>0){diode.n=n;diode.j0=j0;}else diode.warnings.push('diode_range');}
  else diode.warnings.push(diode.count<4?'diode_sparse':'diode_slope');
  if(diode.r2!==null&&diode.r2<.98)diode.warnings.push('diode_fit_quality');
  if(diode.decades<1)diode.warnings.push('diode_span');
  if(diode.slope!==null&&diode.slope*diode.lo<3)diode.warnings.push('diode_low_bias');
  if(diode.excluded)diode.warnings.push('diode_excluded');
  diode.usable=diode.n!==null&&!diode.warnings.length;warnings.push(...diode.warnings);
  function thresholdCrossings(rows,absolute=false){
   if(noiseFloor!==null&&p.threshold<=noiseFloor)return [];
   const zero=at(rows,0),domain=rows.filter(([v])=>v>=0);if(zero!==null&&domain[0]?.[0]!==0)domain.unshift([0,zero]);
   const roots=[];if(domain.length&&(absolute?Math.abs(domain[0][1]):domain[0][1])===p.threshold)roots.push(domain[0][0]);
   for(let i=1;i<domain.length;i++){
    const a=domain[i-1],b=domain[i],target=a[1]<p.threshold&&b[1]>=p.threshold?p.threshold:absolute&&a[1]>-p.threshold&&b[1]<=-p.threshold?-p.threshold:null;
    if(target!==null)roots.push(a[0]+(target-a[1])*(b[0]-a[0])/(b[1]-a[1]));
   }return [...new Set(roots)];
  }
  const crossings=thresholdCrossings(forward),reverseCrossings=thresholdCrossings(points.map(([v,j])=>[p.reverseSign*v,j]).sort((a,b)=>a[0]-b[0]),true);
  const turnOn=crossings.length===1?-p.reverseSign*crossings[0]:null,reverseThreshold=reverseCrossings.length===1?p.reverseSign*reverseCrossings[0]:null;
  if(noiseFloor!==null&&p.threshold<=noiseFloor)warnings.push('threshold_below_floor');
  if(turnOn===null)warnings.push(crossings.length>1?'threshold_ambiguous':'threshold_uncovered');
  const local=points.map(([v,j],i)=>{
   const start=Math.min(Math.max(i-1,0),points.length-3),rows=points.slice(start,start+3),f=fit(rows),g=f.slope;
   const valid=v!==0&&above(j)&&rows.every(([x,y])=>Math.sign(x)===Math.sign(v)&&Math.sign(y)===Math.sign(j)&&above(y));
   const logFit=valid?fit(rows.map(([x,y])=>[Math.log(Math.abs(x)),Math.log(Math.abs(y))])):null;
   const lnFit=rows.every(([x,y])=>-p.reverseSign*x>0&&p.currentSign*y>(noiseFloor??0))?fit(rows.map(([x,y])=>[-p.reverseSign*x,Math.log(p.currentSign*y)])):null,localN=lnFit?.slope>0?1/(KTQ*p.temperature*lnFit.slope):null;
   return [v,j,g,g===null?null:g===0?Infinity:1/g,logFit?.slope??null,thickness===null?null:v/(thickness*1e-7),finite(localN)?localN:null];
  });
  const mechanisms={};if(thickness!==null){
   const l=thickness*1e-7;
   for(const kind of ['schottky','pf','fn']){
    const rows=positive.map(([v,j])=>{const e=v/l;return kind==='schottky'?[Math.sqrt(e),Math.log(j)]:kind==='pf'?[Math.sqrt(e),Math.log(j)-Math.log(e)]:[1/e,Math.log(j)-2*Math.log(e)];}).filter(a=>a.every(finite)).sort((a,b)=>a[0]-b[0]);
    mechanisms[kind]={...fit(rows,4),points:rows};
   }
  }
  const zeroCrossings=[];for(let i=0;i<points.length;i++){const a=points[i],b=points[i+1];if(a[1]===0)zeroCrossings.push(a[0]);else if(b&&Math.sign(a[1])*Math.sign(b[1])<0)zeroCrossings.push(a[0]-a[1]*(b[0]-a[0])/(b[1]-a[1]));}
  return {index:index+1,direction:sweep.direction,points,original:sweep.points.map(a=>[...a]),forward,noiseFloor,jZero,reverseV,forwardV,reverseJ,forwardJ,reverseI:area!==null&&reverseJ!==null?reverseJ*area:null,forwardI:area!==null&&forwardJ!==null?forwardJ*area:null,reversePower:reverseJ===null?null:reverseV*reverseJ,rectification:finite(rectification)?rectification:null,rectificationLowerBound:finite(rectificationLowerBound)?rectificationLowerBound:null,zero,diode,turnOn,reverseThreshold,reverseThresholdCrossings:reverseCrossings.length,thresholdCrossings:crossings.length,zeroCrossings,local,mechanisms,conductivity:thickness!==null&&zero.slope!==null?zero.slope*thickness*1e-7:null,parameters:{...p,area,thickness,sampleId:p.sampleId.trim()},warnings};
 });
}
function compareScans(a,b){
 if(!a||!b||!Array.isArray(a.points)||!Array.isArray(b.points))fail('format');
 const lo=Math.max(a.points[0][0],b.points[0][0]),hi=Math.min(a.points.at(-1)[0],b.points.at(-1)[0]);if(!(hi>lo))return null;
 const xs=[...new Set([lo,hi,...a.points.map(p=>p[0]),...b.points.map(p=>p[0])].filter(x=>x>=lo&&x<=hi))].sort((x,y)=>x-y),points=xs.map(v=>[v,at(a.points,v)-at(b.points,v)]);
 let signedArea=0,absoluteArea=0,maxDelta=0,maxV=lo;
 for(let i=0;i<points.length;i++){
  const [x,y]=points[i];if(Math.abs(y)>maxDelta){maxDelta=Math.abs(y);maxV=x;}
  if(i){
   const [x0,y0]=points[i-1],dx=x-x0;signedArea+=dx*(y0/2+y/2);
   if(Math.sign(y0)*Math.sign(y)<0){const scale=Math.max(Math.abs(y0),Math.abs(y)),a=Math.abs(y0)/scale,b=Math.abs(y)/scale;absoluteArea+=dx*scale*(a*a+b*b)/(2*(a+b));}
   else absoluteArea+=dx*(Math.abs(y0)/2+Math.abs(y)/2);
  }
 }
 return {lo,hi,signedArea,absoluteArea,meanAbsolute:absoluteArea/(hi-lo),maxDelta,maxV,points};
}
const api={analyze,compareScans};if(typeof module==='object'&&module.exports)module.exports=api;else root.DarkJVModel=api;
})(typeof globalThis!=='undefined'?globalThis:this);