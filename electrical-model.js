/* EIS: Z = Rs + [1/R + Q(j 2 pi f)^n]^-1. SCLC: doi:10.1021/acsenergylett.0c02599, eqs 1-2. */
(function(root){
'use strict';
const JV=typeof module==='object'&&module.exports?require('./measurement-model.js'):root.MeasurementModel;
const EPS0=8.8541878128e-14,QE=1.602176634e-19; // F/cm and C; lengths below use cm.
const fail=code=>{throw Error(code);},finite=Number.isFinite;
function parseEIS(text){
 if(typeof text!=='string'||text.length>2000000)fail('size');
 const rows=[],numeric=/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i;let header=null;
 for(const raw of text.replace(/^\uFEFF/,'').split(/\r?\n/)){
  const line=raw.trim();if(!line||line.startsWith('#'))continue;
  const cells=(/[\t;,]/.test(line)?line.split(/[\t;,]/):line.split(/\s+/)).map(s=>s.trim().replace(/^"(.*)"$/,'$1'));
  if(cells.length!==3)fail('eis_columns');
  if(cells.every(s=>numeric.test(s)&&finite(Number(s))))rows.push(cells.map(Number));
  else if(!header&&!rows.length&&/freq|频率|frequenz|^f(?:_|\W|$)/i.test(cells[0])&&/real|re(?:\W|_|$)|z['′]|实部/i.test(cells[1])&&/imag|im(?:\W|_|$)|z['′]{2}|z["″]|虚部/i.test(cells[2])){
   const f=cells[0],unit=s=>/k(?:ohm|Ω)/i.test(s)?'kohm':/m(?:ohm|Ω)/i.test(s)?'unsupported':/(?:ohm|Ω)/i.test(s)?'ohm':null;
   const u1=unit(cells[1]),u2=unit(cells[2]);if(/(?:k|m|g)hz|rad/i.test(f)||/cm|mm|m[²2]/i.test(cells[1]+cells[2])||u1==='unsupported'||u2==='unsupported'||u1&&u2&&u1!==u2)fail('unit');
   const s=cells[2].replace(/[\s_]/g,'');header={unit:u1||u2,imag:/^[-−]|^minus|^negative/i.test(s)?'negative':'signed'};
  }else fail('format');
  if(rows.length>5000)fail('eis_count');
 }
 if(rows.length<8)fail('eis_count');return {points:rows,header};
}
function normalizeEIS(data,p){
 if(!data||!Array.isArray(data.points)||data.points.length<8||data.points.length>5000||data.points.some(r=>!Array.isArray(r)||r.length!==3||!r.every(finite)))fail('format');
 if(!['ohm','kohm'].includes(p.unit)||!['signed','negative'].includes(p.imag))fail('unit');
 if(data.header&&(data.header.unit&&data.header.unit!==p.unit||data.header.imag!==p.imag))fail('mismatch');
 const scale=p.unit==='kohm'?1000:1,seen=new Set();
 return data.points.map(([f,re,im])=>{
  if(f<=0||seen.has(f))fail('frequency');seen.add(f);
  const row=[f,re*scale,im*scale*(p.imag==='negative'?-1:1)];
  if(!row.every(finite)||Math.hypot(row[1],row[2])===0)fail('range');return row;
 }).sort((a,b)=>a[0]-b[0]);
}
function impedance(f,rs,r,q,n=1){
 const magnitude=q*Math.pow(2*Math.PI*f,n),a=1/r+magnitude*Math.cos(n*Math.PI/2),b=magnitude*Math.sin(n*Math.PI/2),d=a*a+b*b;
 return [rs+a/d,-b/d];
}
function solve(matrix,values){
 const a=matrix.map((r,i)=>[...r,values[i]]),n=values.length;
 for(let k=0;k<n;k++){
  let pivot=k;for(let i=k+1;i<n;i++)if(Math.abs(a[i][k])>Math.abs(a[pivot][k]))pivot=i;
  if(!finite(a[pivot][k])||Math.abs(a[pivot][k])<1e-25)return null;
  [a[k],a[pivot]]=[a[pivot],a[k]];
  const div=a[k][k];for(let j=k;j<=n;j++)a[k][j]/=div;
  for(let i=0;i<n;i++)if(i!==k){const m=a[i][k];for(let j=k;j<=n;j++)a[i][j]-=m*a[k][j];}
 }
 return a.map(r=>r[n]);
}
function fitEIS(data,p){
 const all=normalizeEIS(data,p);if(!['rc','cpe'].includes(p.model))fail('unit');
 const lo=p.fmin??all[0][0],hi=p.fmax??all.at(-1)[0];if(!finite(lo)||!finite(hi)||lo<=0||hi<=lo)fail('window');
 const points=all.filter(r=>r[0]>=lo&&r[0]<=hi);if(points.length<8)fail('eis_count');
 const re=points.map(r=>r[1]),span=Math.max(...re)-Math.min(...re),maximum=Math.max(...points.map(r=>Math.hypot(r[1],r[2])));
 if(span<=maximum*1e-7)fail('eis_arc');
 const peak=points.reduce((a,b)=>b[2]<a[2]?b:a),rs=Math.max(Math.min(...re),maximum*1e-6),r=Math.max(span,maximum*.01),n=p.model==='rc'?1:.85;
 let theta=[Math.log(rs),Math.log(r),Math.log(1/(r*(2*Math.PI*peak[0])**n)),...(p.model==='cpe'?[n]:[])];
 const limits=[[-25,35],[-25,35],[-45,5],[.05,1]],clamp=t=>t.map((v,i)=>Math.min(limits[i][1],Math.max(limits[i][0],v)));
 theta=clamp(theta);
 const evaluate=t=>{
  const pars=[Math.exp(t[0]),Math.exp(t[1]),Math.exp(t[2]),t.length===4?t[3]:1],values=[];
  for(const [f,x,y]of points){const z=impedance(f,...pars),weight=Math.hypot(x,y);values.push((z[0]-x)/weight,(z[1]-y)/weight);}
  return values;
 };
 const cost=v=>v.reduce((s,x)=>s+x*x,0);let residual=evaluate(theta),score=cost(residual),lambda=.001,converged=false,iterations=0;
 for(;iterations<160;iterations++){
  if(score/points.length<1e-18){converged=true;break;}
  const jac=theta.map((_,j)=>{const t=[...theta],h=1e-5;t[j]+=h;return evaluate(t).map((v,i)=>(v-residual[i])/h);});
  const normal=jac.map(a=>jac.map(b=>a.reduce((s,v,i)=>s+v*b[i],0))),gradient=jac.map(a=>a.reduce((s,v,i)=>s+v*residual[i],0));
  const step=solve(normal.map((row,i)=>row.map((v,j)=>v+(i===j?lambda*Math.max(normal[i][i],1e-12):0))),gradient.map(v=>-v));
  if(!step){lambda*=10;continue;}
  const trial=clamp(theta.map((v,i)=>v+step[i])),rr=evaluate(trial),ss=cost(rr);
  if(finite(ss)&&ss<score){
   const relative=(score-ss)/Math.max(score,1e-30),move=Math.max(...trial.map((v,i)=>Math.abs(v-theta[i])));
   theta=trial;residual=rr;score=ss;lambda=Math.max(1e-10,lambda/3);
   if(relative<1e-9&&move<1e-5){converged=true;break;}
  }else{lambda*=10;if(lambda>1e16)break;}
 }
 const pars=[Math.exp(theta[0]),Math.exp(theta[1]),Math.exp(theta[2]),theta.length===4?theta[3]:1],tau=(pars[1]*pars[2])**(1/pars[3]),fc=1/(2*Math.PI*tau);
 if(![...pars,tau,fc,tau/pars[1],score].every(finite)||tau<=0||fc<=0)fail('range');
 const warnings=[];if(!converged)warnings.push('convergence');
 if(theta.some((v,i)=>Math.abs(v-limits[i][0])<1e-5||Math.abs(v-limits[i][1])<1e-5))warnings.push('bounds');
 if(fc<points[0][0]||fc>points.at(-1)[0])warnings.push('peak');
 if(points.some(r=>r[2]>0))warnings.push('inductive');
 if(Math.sqrt(score/points.length)>.05)warnings.push('residual');
 const fitted=points.map(([f,re,im])=>{const z=impedance(f,...pars),mag=Math.hypot(re,im);return [f,re,im,...z,100*(z[0]-re)/mag,100*(z[1]-im)/mag];});
 return {all,points,fitted,rs:pars[0],r:pars[1],q:pars[2],n:pars[3],tau,fc,ceff:tau/pars[1],nrmse:Math.sqrt(score/points.length),converged,iterations,warnings,parameters:{...p,fmin:lo,fmax:hi},initialization:'Rs=min(Re Z), R=span(Re Z), Q from maximum -Im Z; n=0.85 for CPE',weighting:'sum((Re residual)^2+(Im residual)^2)/|Z_measured|^2'};
}
function logFit(points,lo,hi,optional=false){
 if(lo===null&&hi===null&&optional)return null;
 if(!finite(lo)||!finite(hi)||lo<=0||hi<=lo)fail('window');
 const rows=points.filter(r=>r[0]>=lo&&r[0]<=hi);if(rows.length<3)fail('fit_count');
 const xy=rows.map(([v,j])=>[Math.log10(v),Math.log10(j)]),mx=xy.reduce((s,r)=>s+r[0],0)/xy.length,my=xy.reduce((s,r)=>s+r[1],0)/xy.length;
 let xx=0,yy=0,cross=0;for(const [x,y]of xy){xx+=(x-mx)**2;yy+=(y-my)**2;cross+=(x-mx)*(y-my);}
 if(xx<=0)fail('window');const slope=cross/xx,intercept=my-slope*mx,error=xy.reduce((s,[x,y])=>s+(y-intercept-slope*x)**2,0);
 return {slope,intercept,r2:yy?Math.max(0,1-error/yy):0,count:rows.length,lo:rows[0][0],hi:rows.at(-1)[0],requested:[lo,hi],rows};
}
function prepareSCLC(data,p){
 if(!data||!Array.isArray(data.points)||data.points.length<5||data.points.length>20000||data.points.some(r=>!Array.isArray(r)||r.length!==2||!r.every(finite)))fail('format');
 if(!['V','mV'].includes(p.voltageUnit)||!['mAcm2','Acm2','mA','A'].includes(p.currentUnit))fail('unit');
 if(data.voltageUnit&&data.voltageUnit!==p.voltageUnit||data.currentUnit&&data.currentUnit!==p.currentUnit)fail('mismatch');
 if(!finite(p.offset)||![1,-1].includes(p.vsign)||![1,-1].includes(p.isign))fail('unit');
 const isCurrent=['A','mA'].includes(p.currentUnit);if(isCurrent&&(!finite(p.area)||p.area<=0))fail('area');
 const sweeps=JV.splitSweeps(data.points);if(!Number.isInteger(p.scan)||p.scan<0||p.scan>=sweeps.length)fail('sweep');
 const scale=(['mA','mAcm2'].includes(p.currentUnit) ? .001 : 1)/(isCurrent?p.area:1),sweep=sweeps[p.scan];
 const transformed=sweep.points.map(([v,j])=>[p.vsign*v/(p.voltageUnit==='mV'?1000:1)-p.offset,p.isign*j*scale]);
 if(transformed.some(r=>!r.every(finite)))fail('range');
 const points=transformed.filter(([v,j])=>v>0&&j>0).sort((a,b)=>a[0]-b[0]);if(points.length<5)fail('positive');
 return {points,transformed,original:sweep.points,scanCount:sweeps.length,direction:sweep.direction,excluded:transformed.length-points.length};
}
function analyzeSCLC(data,p){
 const prepared=prepareSCLC(data,p),{points}=prepared;
 if(![p.thickness,p.epsilon].every(v=>finite(v)&&v>0))fail('material');
 const ohmic=logFit(points,p.ohmicLo,p.ohmicHi,true),trap=logFit(points,p.trapLo,p.trapHi,true),high=logFit(points,p.highLo,p.highHi);
 if(ohmic&&trap&&ohmic.hi>=trap.lo||trap&&trap.hi>=high.lo||ohmic&&ohmic.hi>=high.lo)fail('overlap');
 const warnings=[],highValid=Math.abs(high.slope-2)<=.3&&high.r2>=.98;
 if(!highValid)warnings.push('quadratic');if(ohmic&&(Math.abs(ohmic.slope-1)>.3||ohmic.r2<.95))warnings.push('ohmic');
 let tfl=null,tflSource='unavailable';
 if(p.tfl!==null){
  if(!finite(p.tfl)||p.tfl<points[0][0]||p.tfl>points.at(-1)[0]||p.tfl<=0||p.tfl>high.lo)fail('tfl');
  tfl=p.tfl;tflSource='manual_effective_voltage';
 }else if(trap&&highValid&&trap.slope>Math.max(2.3,high.slope+.3)&&trap.r2>=.95){
  const v=10**((high.intercept-trap.intercept)/(trap.slope-high.slope));
  if(finite(v)&&v>=trap.hi&&v<=high.lo){tfl=v;tflSource='upper_intersection_V2';}
 }
 if(tfl===null)warnings.push('tfl');
 const thicknessCm=p.thickness*1e-7,epsilon=EPS0*p.epsilon;
 const coefficient=high.rows.reduce((s,[v,j])=>s+v*v*j,0)/high.rows.reduce((s,[v])=>s+v**4,0),mu=highValid?8*coefficient*thicknessCm**3/(9*epsilon):null;
 const nt=tfl===null?null:2*epsilon*tfl/(QE*thicknessCm**2);
 if(!finite(coefficient)||coefficient<=0)fail('range');
 if([mu,nt].some(v=>v!==null&&(!finite(v)||v<=0)))fail('range');
 return {...prepared,ohmic,trap,high,coefficient,mu,nt,tfl,tflSource,warnings,parameters:{...p},model:'classical apparent estimates; dark single-carrier, ohmic injection, negligible ionic redistribution, uniform epsilon and thickness, trap-free quadratic mobility window'};
}
const api={EPS0,QE,parseEIS,normalizeEIS,impedance,fitEIS,logFit,prepareSCLC,analyzeSCLC};
if(typeof module==='object'&&module.exports)module.exports=api;else root.ElectricalModel=api;
})(typeof globalThis!=='undefined'?globalThis:this);
