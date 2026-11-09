(function(){
'use strict';
const lang=document.documentElement.lang,li=lang==='de'?1:lang.startsWith('zh')?2:0;
const T=(en,de,zh)=>[en,de,zh][li],$=id=>document.getElementById(id);
const node=(tag,cls)=>{const e=document.createElement(tag);e.className=cls;return e;};
const parameters=T('Parameters','Parameter','输入参数'),paste=T('Paste / edit data','Daten einfügen / bearbeiten','粘贴／编辑数据');
for(const id of ['eq-bandgap','pl-bandgap']){
 const addon=$(id);if(!addon)continue;
 const owner=addon.closest('.sp-shell'),shell=node('div','sp-shell'),main=node('div','rl-main'),controls=node('div','rl-controls'),output=node('div','rl-output');
 const children=[...addon.children],start=children.findIndex(e=>e.classList.contains('bg-fields')),result=children.findIndex(e=>e.classList.contains('bg-result'));
 if(!owner||start<0||result<0)continue;
 for(const child of children.slice(2,result))controls.append(child);
 for(const child of children.slice(result))output.append(child);
 const settings=output.querySelector(':scope>.rl-method');if(settings)controls.append(settings);
 main.append(controls,output);shell.append(main);addon.append(shell);addon.classList.add('calc-subtool');owner.after(addon);
}
const configurations=[
 ['resistance-calculator',null,null,null,null,'rl-reset','rl-export'],
 ['bandgap-calculator',null,null,null,null,null,null],
 ['eqe-calculator','eq-calculate','eq-file-choose','eq-file-name',null,'eq-clear',null],
 ['pl-voltage-calculator','pl-import-calculate','pl-file-choose','pl-file-name','pl-import-fields','pl-reset',null],
 ['trpl-calculator','trpl-fit','trpl-choose','trpl-source',null,null,null],
 ['pl-pseudo-jv','pjv-calc','pjv-choose',null,'pjv-data-fields',null,'pjv-export'],
 ['bga-ups','bup-calc',null,null,null,null,null],
 ['eq-bandgap','beq-calc',null,null,null,null,null],
 ['pl-bandgap','bpl-calc',null,null,null,null,null]
];
for(const [hostId,calcId,chooseId,sourceId,guardId,resetId,exportId] of configurations){
 const host=$(hostId),shell=host?.querySelector('.rl-shell,.sp-shell');
 if(!shell||shell.classList.contains('calc-workspace'))continue;
 const controls=shell.querySelector('.rl-controls'),output=shell.querySelector('.rl-output');
 if(!controls||!output)continue;
 shell.classList.add('calc-workspace');
 const title=controls.querySelector(':scope>h3')||node('h3','');
 title.classList.add('calc-controls-title');title.setAttribute('data-literal','');
 title.textContent=chooseId?T('Data & parameters','Daten & Parameter','数据与参数'):parameters;
 const body=node('div','calc-controls-scroll');body.tabIndex=0;body.setAttribute('role','region');body.setAttribute('aria-label',parameters);
 const footer=node('div','calc-controls-footer'),primary=node('fieldset','calc-primary-actions');
 const actions=node('div','calc-result-actions');
 const links=[...controls.querySelectorAll(':scope>.bg-jump,:scope>.pjv-jump')];
 for(const link of links){link.classList.add('calc-link');actions.append(link);}
 const status=[...controls.children].filter(e=>e.matches('.sp-message,.rl-error,.calc-auto-note'));
 let importHeader=null;
 if(chooseId&&$(chooseId)){
  const choose=$(chooseId),imported=choose.closest('.calc-import'),toolbar=choose.closest('.calc-import-toolbar');
  const source=sourceId?$(sourceId):null;
  importHeader=node('fieldset','calc-import calc-input-header');importHeader.append(toolbar);
  if(source){importHeader.append(source);const label=()=>{source.title=source.textContent;};label();new MutationObserver(label).observe(source,{childList:true,characterData:true,subtree:true});}
  for(const quiet of [...toolbar.querySelectorAll('.calc-quiet')])primary.append(quiet);
  toolbar.classList.toggle('calc-single-upload',toolbar.children.length===1);
  if(!choose.querySelector('.uv-icon')){const icon=node('span','uv-icon uv-icon-folder');icon.setAttribute('aria-hidden','true');choose.prepend(icon);}
  if(imported.tagName==='DETAILS'){
   // Keep mode-dependent controls in their original fieldset when the data editor collapses.
   if(hostId==='pl-voltage-calculator')for(const child of [...imported.children])if(child.matches('fieldset,.calc-actions,.sp-message'))imported.parentElement.append(child);
   imported.classList.remove('calc-import');imported.classList.add('calc-data-editor');imported.open=false;
   imported.querySelector('summary').textContent=paste;imported.querySelector('summary').setAttribute('data-literal','');
  }else{
   const editor=node('details','calc-data-editor'),summary=node('summary','');summary.textContent=paste;summary.setAttribute('data-literal','');editor.append(summary);
   editor.append(...imported.children);imported.append(editor);imported.classList.remove('calc-import');imported.classList.add('calc-data-block');
  }
 }
 if(calcId&&$(calcId)){primary.prepend($(calcId));if(hostId==='pl-voltage-calculator')primary.prepend($('pl-import-message'));}
 const reset=resetId?$(resetId):null;if(reset)reset.classList.add('calc-quiet');
 if(hostId==='pl-pseudo-jv')primary.append($('pjv-example'));
 for(const e of status)footer.append(e);
 if(!calcId&&!status.some(e=>e.matches('.calc-auto-note'))){const note=node('p','rl-small calc-auto-note');note.textContent=T('Updates automatically as you change parameters.','Wird bei Parameteränderungen automatisch aktualisiert.','参数修改后自动更新结果。');note.setAttribute('data-literal','');footer.append(note);}
 if(primary.children.length)footer.append(primary);if(reset)footer.append(reset);
 for(const child of [...controls.children])if(child!==title&&child!==importHeader)body.append(child);
 for(const empty of [...body.querySelectorAll('.sp-row,.rl-actions,.calc-actions')])if(!empty.children.length&&!empty.textContent.trim())empty.remove();
 controls.replaceChildren(title,...(importHeader?[importHeader]:[]),body,footer);
 if(guardId&&$(guardId)){
  const group=$(guardId),sync=()=>{if(importHeader){importHeader.hidden=group.hidden;importHeader.disabled=group.disabled;}if(hostId==='pl-voltage-calculator'){primary.hidden=group.hidden;primary.disabled=group.disabled;}};
  sync();controls.addEventListener('input',sync);controls.addEventListener('change',sync);new MutationObserver(sync).observe(group,{attributes:true,attributeFilter:['hidden','disabled']});
 }
 const header=node('div','calc-result-header'),first=output.firstElementChild;
 if(first&&(first.tagName==='H3'||first.classList.contains('rl-chart-heading')))header.append(first);
 else{const heading=node('h3','');heading.textContent=T('Results','Ergebnisse','计算结果');heading.setAttribute('data-literal','');header.append(heading);}
 for(const child of [...output.children])if(child.matches('.sp-row,.rl-actions')&&child.querySelector('button,a'))actions.prepend(child);
 if(exportId&&$(exportId))actions.prepend($(exportId));
 const firstExport=actions.querySelector('button[id$="-export"]');if(firstExport)actions.prepend(firstExport);
 const results=node('div','calc-results-scroll');results.tabIndex=0;results.setAttribute('role','region');results.setAttribute('aria-label',T('Results and charts','Ergebnisse und Diagramme','结果与图表'));
 results.append(...output.children);
 const metrics=results.querySelector(':scope>.rl-metrics');if(metrics)results.prepend(metrics);
 output.replaceChildren(header,results,...(actions.children.length?[actions]:[]));
 if(hostId==='resistance-calculator'){
  const extra=node('details','calc-result-details'),summary=node('summary','');summary.textContent=T('Target FF & device conversion','Ziel-FF und Geräteumrechnung','目标 FF 与器件换算');summary.setAttribute('data-literal','');extra.append(summary);
  const sections=[...results.querySelectorAll(':scope>.rl-target,:scope>.rl-device')];if(sections.length){sections[0].before(extra);extra.append(...sections);}
 }
}
const uv=$('bga-uv')?.querySelector('.uv-workspace');
if(uv){uv.classList.add('calc-workspace');uv.querySelector('.uv-import-header h4').textContent=T('Data & parameters','Daten & Parameter','数据与参数');const actions=$('buv-export').parentElement;actions.prepend($('buv-export'));}
})();
