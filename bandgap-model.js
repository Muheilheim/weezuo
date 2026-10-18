/* Band-edge estimates. Inputs and results remain local; no cross-method averaging. */
(function(root){
  'use strict';
  const HC=6.62607015e-34*299792458/1.602176634e-19*1e9;
  function fail(code){throw Error(code);}
  function finite(...v){if(v.some(x=>!Number.isFinite(x)))fail('number');}
  function parse(text){
    if(typeof text!=='string'||text.length>2000000)fail('size');
    const lines=text.replace(/^\uFEFF/,'').split(/\r?\n/).map(x=>x.trim()).filter(x=>x&&!x.startsWith('#'));
    const points=[];let header=false,axisUnit=null;const numeric=/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i;
    for(const line of lines){
      const cells=(/[\t,;]/.test(line)?line.split(/[\t,;]/):line.split(/\s+/)).map(x=>x.trim().replace(/^"(.*)"$/,'$1'));
      if(cells.length!==2)fail('columns');
      const values=cells.map(x=>numeric.test(x)?Number(x):NaN);
      if(values.some(x=>!Number.isFinite(x))){
        if(!points.length&&!header&&cells.every(x=>/[a-zA-Z\u4e00-\u9fff]/.test(x)&&!/^[-+]?(?:nan|inf(?:inity)?)$/i.test(x))){
          const label=cells[0].replace(/[µμ]/g,'u');
          if(/(?:^|[^a-z])(?:pm|um|mm|cm|m|kev|mev|hz|thz|angstroms?)(?:$|[^a-z])|[åÅ]/i.test(label))fail('unit');
          axisUnit=/(?:^|[^a-z])ev(?:$|[^a-z])/i.test(label)?'eV':/(?:^|[^a-z])nm(?:$|[^a-z])/i.test(label)?'nm':null;
          header=true;continue;
        }
        fail('number');
      }
      points.push(values);
    }
    check(points);if(axisUnit)Object.defineProperty(points,'axisUnit',{value:axisUnit});return points.sort((a,b)=>a[0]-b[0]);
  }
  function check(points){
    if(!Array.isArray(points)||points.length<5||points.length>20000)fail('count');
    const seen=new Set();for(const p of points){if(p.length!==2)fail('columns');finite(...p);if(seen.has(p[0]))fail('duplicate');seen.add(p[0]);}
  }
  function energy(points,p={}){
    check(points);const offset=p.offset??0;finite(offset);
    if(!['nm','eV'].includes(p.unit)||(points.axisUnit&&points.axisUnit!==p.unit))fail('unit');
    return points.map(([x,y])=>{if(x<=0)fail('axis');const e=(p.unit==='nm'?HC/x:x)+offset;finite(e);if(e<=0)fail('axis');return [e,y,x];}).sort((a,b)=>a[0]-b[0]);
  }
  function windowed(points,p,n=5){
    finite(p.lo,p.hi);if(p.lo>=p.hi)fail('window');
    const out=points.filter(r=>r[0]>=p.lo-1e-10&&r[0]<=p.hi+1e-10);if(out.length<n)fail('window');return out;
  }
  function linear(points){
    const n=points.length,mx=points.reduce((s,p)=>s+p[0],0)/n,my=points.reduce((s,p)=>s+p[1],0)/n;
    let xx=0,xy=0,yy=0;for(const [x,y]of points){xx+=(x-mx)**2;xy+=(x-mx)*(y-my);yy+=(y-my)**2;}
    if(xx<=0||yy<=0)fail('flat');const slope=xy/xx,intercept=my-slope*mx;
    const sse=points.reduce((s,[x,y])=>s+(y-(slope*x+intercept))**2,0);
    return {slope,intercept,r2:1-sse/yy,rmse:Math.sqrt(sse/n),n,mx,xx,variance:sse/(n-2)};
  }
  function tauc(points,p){
    const es=energy(points,p),base=p.background??0;finite(base);if(!['alpha','absorbance'].includes(p.signal))fail('unit');
    if(p.signal==='absorbance'){finite(p.thickness);if(p.thickness<=0)fail('thickness');}
    if(!['direct','indirect'].includes(p.transition))fail('unit');
    const power=p.transition==='direct'?2:.5;
    const a=es.map(([e,y])=>[e,(y-base)*(p.signal==='alpha'?1:Math.LN10/(p.thickness*1e-7))]);
    a.forEach(row=>finite(...row));const selected=windowed(a,p);if(selected.some(r=>r[1]<=0))fail('positive');
    const scale=Math.max(...selected.map(r=>r[1]*r[0]));if(!Number.isFinite(scale)||scale<=0)fail('number');
    const transform=([e,y])=>[e,y>0?(y*e/scale)**power:0];
    const transformed=a.map(transform);transformed.forEach(row=>finite(...row));const fitPoints=selected.map(transform),fit=linear(fitPoints),value=-fit.intercept/fit.slope;
    if(fit.slope<=0||!Number.isFinite(value)||value<=0||value>=selected[0][0])fail('intercept');
    const se=Math.sqrt(fit.variance*(1/fit.n+(value-fit.mx)**2/fit.xx))/Math.abs(fit.slope);
    const warnings=[];if(fit.r2<.98)warnings.push('linear');if(selected[0][0]-value>p.hi-p.lo)warnings.push('extrapolation');
    return {method:'uv',value,fit,se,warnings,points:transformed,overlay:[[value,0],[p.hi,fit.slope*p.hi+fit.intercept]],used:fitPoints,parameters:{...p},metric:'Tauc intercept'};
  }
  // Least-squares quadratic on irregularly spaced points; centered/scaled x for stability.
  function quadratic(points,center){
    const span=Math.max(...points.map(p=>Math.abs(p[0]-center)));if(!span)fail('flat');
    const a=Array.from({length:3},()=>[0,0,0,0]);
    for(const [x,y] of points){const t=(x-center)/span,v=[1,t,t*t];for(let i=0;i<3;i++){for(let j=0;j<3;j++)a[i][j]+=v[i]*v[j];a[i][3]+=v[i]*y;}}
    for(let i=0;i<3;i++){let k=i;for(let j=i+1;j<3;j++)if(Math.abs(a[j][i])>Math.abs(a[k][i]))k=j;[a[i],a[k]]=[a[k],a[i]];if(Math.abs(a[i][i])<1e-12)fail('flat');const pivot=a[i][i];for(let j=i;j<4;j++)a[i][j]/=pivot;for(let j=0;j<3;j++)if(j!==i){const f=a[j][i];for(let k=i;k<4;k++)a[j][k]-=f*a[i][k];}}
    return {a:a[0][3],b:a[1][3]/span,c:a[2][3]/span**2};
  }
  function peak(points){
    let at=0;for(let i=1;i<points.length;i++)if(points[i][1]>points[at][1])at=i;
    if(at===0||at===points.length-1)fail('boundary');
    if(points[at][1]<=0)fail('positive');
    const max=points[at][1],tol=Math.abs(max)*1e-12;if(points.some((r,i)=>i>0&&i<points.length-1&&Math.abs(r[1]-max)<=tol&&Math.abs(points[i-1][1]-max)<=tol&&Math.abs(points[i+1][1]-max)<=tol))fail('flat');
    const q=quadratic(points.slice(at-1,at+2),points[at][0]);
    const candidate=points[at][0]-q.b/(2*q.c);
    const value=q.c<0&&candidate>=points[at-1][0]&&candidate<=points[at+1][0]?candidate:points[at][0];
    return {value,spacing:Math.max(points[at][0]-points[at-1][0],points[at+1][0]-points[at][0]),at};
  }
  function pl(points,p){
    finite(p.background??0);if(!['density','supplied'].includes(p.density))fail('unit');
    const es=energy(points,p).map(([e,y,x])=>[e,(y-(p.background??0))*(p.unit==='nm'&&p.density==='density'?x*x/HC:1)]);
    es.forEach(row=>finite(...row));const selected=windowed(es,p),pk=peak(selected);
    const max=Math.max(...selected.map(x=>x[1])),scaled=es.map(([e,y])=>[e,y/max]);
    const warnings=['plLimit'];let peaks=0;for(let i=1;i<selected.length-1;i++)if(selected[i][1]>selected[i-1][1]&&selected[i][1]>=selected[i+1][1]&&selected[i][1]>.5*max)peaks++;if(peaks>1)warnings.push('multipeak');
    return {method:'pl',value:pk.value,spacing:pk.spacing,warnings,points:scaled,overlay:[],parameters:{...p},metric:p.density==='density'?'PL energy-density peak':'PL supplied-spectrum peak'};
  }
  function eqe(points,p){
    const es=energy(points,p);if(es.some(r=>r[1]<0||r[1]>1))fail('eqe');
    const k=Number(p.smoothing);if(!Number.isInteger(k)||k<5||k>51||k%2===0)fail('smooth');
    const selected=windowed(es,p,k+4),half=(k-1)/2,derivative=[];
    for(let i=half;i<selected.length-half;i++){const q=quadratic(selected.slice(i-half,i+half+1),selected[i][0]);derivative.push([selected[i][0],q.b]);}
    const pk=peak(derivative);if(derivative[pk.at][1]<=0)fail('edge');
    const yrange=Math.max(...selected.map(r=>r[1]))-Math.min(...selected.map(r=>r[1]));if(yrange<.02)fail('edge');
    const dmax=Math.max(...derivative.map(r=>r[1]));
    // A genuine inflection needs a resolved derivative maximum with both flanks.
    if(dmax-derivative[0][1]<=Math.max(1e-12,dmax*.05)||dmax-derivative.at(-1)[1]<=Math.max(1e-12,dmax*.05))fail('edge');
    const warnings=['eqeLimit'];if(yrange<.2)warnings.push('coverage');
    const maxima=[];for(let i=1;i<derivative.length-1;i++)if(derivative[i][1]>derivative[i-1][1]&&derivative[i][1]>=derivative[i+1][1]&&derivative[i][1]>.5*dmax&&(maxima.length===0||i-maxima.at(-1)>half))maxima.push(i);if(maxima.length>1)warnings.push('multiedge');
    return {method:'eqe',value:pk.value,spacing:pk.spacing,warnings,points:selected.map(([e,y])=>[e,y]),overlay:derivative.map(([e,y])=>[e,y/dmax]),derivative,parameters:{...p},metric:'Maximum d(EQE)/dE'};
  }
  function electronic(p){
    const {v,c,dv=0,dc=0,convention}=p;finite(v,c,dv,dc);
    let ev,ec;if(convention==='distance'){if(v<0||c<0)fail('sign');ev=-v;ec=c;}
    else if(convention==='binding'){ev=-v;ec=-c;}
    else if(convention==='signed'){ev=v;ec=c;}else fail('unit');
    ev+=dv;ec+=dc;const value=ec-ev;finite(ev,ec,value);if(value<=0)fail('order');
    let sigma=null;const sv=p.sv??null,sc=p.sc??null;if(sv!==null||sc!==null){finite(sv,sc);if(sv<0||sc<0)fail('number');sigma=Math.hypot(sv,sc);finite(sigma);}
    return {method:'ups',value,ev,ec,sigma,warnings:['upsLimit'],points:[],overlay:[],parameters:{...p},metric:'CBM - VBM'};
  }
  const api={HC,parse,energy,linear,tauc,pl,eqe,electronic};
  if(typeof module==='object'&&module.exports)module.exports=api;else root.BandgapModel=api;
})(typeof globalThis!=='undefined'?globalThis:this);