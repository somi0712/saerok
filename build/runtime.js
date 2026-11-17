(() => {
  'use strict';
  const phone = document.getElementById('phone'), wrap = document.getElementById('wrap'), canvas = document.getElementById('canvas');
  const $ = id => phone.querySelector('[data-node-id="' + id + '"]');
  const screen = id => phone.querySelector('.scr[data-id="' + id + '"]');
  const info = Object.fromEntries(META.list.map(s => [s.id, s]));
  const byNum = Object.fromEntries(META.list.map(s => [s.num, s.id]));
  const defaults = Object.fromEntries(Object.entries(FIGMA.variables).map(([id, v]) => [id, v.value]));
  const ids = Object.fromEntries(Object.entries(FIGMA.variables).map(([id, v]) => [v.name, id]));
  const storageKey = 'memoryon-html-demo-v1';
  let state = {...defaults}, current = null, historyStack = [], toastTimer;
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
    if (saved && saved.version === 1 && saved.values) for (const [id, value] of Object.entries(saved.values)) {
      if (id in defaults && typeof value === typeof defaults[id] && (typeof value !== 'number' || Number.isFinite(value))) state[id] = typeof value === 'string' ? value.slice(0, 200) : value;
    }
  } catch (_) { /* shortcut: blocked storage uses memory until the browser allows local storage. */ }
  const get = name => state[ids[name]];
  const set = (name, value) => { if (ids[name]) state[ids[name]] = value; };
  function toast(text) {const el = document.getElementById('toast'); el.textContent = text; el.classList.add('on'); clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('on'), 2200);}
  function save() {try {localStorage.setItem(storageKey, JSON.stringify({version:1,values:state}));} catch (_) {toast('선택은 현재 열린 화면에서만 유지돼요.');}}
  document.querySelectorAll('img[data-a]').forEach(img => {img.src = A[img.dataset.a];});
  const petSources = Object.fromEntries([['몽글','24:1224'],['새봄','24:1248'],['반짝','24:1266']].map(([name,id]) => [name, $(id).querySelector('img').src]));
  function paint() {
    for (const [id, binding] of Object.entries(FIGMA.bindings)) {
      const el = $(id); if (!el) continue;
      if (binding.characters) {
        const value = state[binding.characters.id];
        if (value !== undefined && el.tagName !== 'INPUT') {
          el.textContent = String(value); el.style.whiteSpace = 'pre-line';
          if (el.className.includes('leading-[0]')) el.style.lineHeight = el.className.includes('--headingsize') ? 'var(--headingline)' : 'var(--bodyline)';
        }
      }
      if (binding.visible && !el.dataset.name?.startsWith('펫 / ')) el.hidden = !state[binding.visible.id];
    }
    for (const [css, name] of [['--bodysize','bodySize'],['--bodyline','bodyLine'],['--headingsize','headingSize'],['--headingline','headingLine']]) phone.style.setProperty(css, get(name) + 'px');
    const image = petSources[get('petName')] || petSources['몽글'];
    for (const id of ['24:1287','24:1354','24:1417']) {const el = $(id); if (el) {el.hidden = false; const img = el.querySelector('img'); if (img) img.src = image;}}
    const field = document.getElementById('profile-name'); if (document.activeElement !== field) field.value = get('name');
    const petLabel = $('43:839'); if (petLabel) petLabel.textContent = '기억 친구 ' + get('petName') + ' · Lv.' + (get('grown') ? '2' : '1');
    for (const id of ['43:808','46:925']) {const el = $(id); if(el) el.textContent=get('fontName');}
    const optionIds = {'60대':'24:988','70대':'24:992','80대 이상':'42:782','50대':'42:774','기타':'24:996','여성':'24:1005','남성':'24:1009','답변 안 함':'24:1013'};
    for (const [label, id] of Object.entries(optionIds)) {const el=$(id); if(el) el.classList.toggle('sel', label===get('age') || label===get('gender'));}
  }
  function show(id, push = true) {
    if (!screen(id)) return;
    if (push && current && current !== id) historyStack.push(current);
    phone.querySelectorAll('.scr').forEach(el => {const active=el.dataset.id===id; el.classList.toggle('on',active); el.setAttribute('aria-hidden',String(!active)); el.inert=!active;});
    current=id; const body=screen(id).querySelector('.overflow-y-auto'); if(body) body.scrollTop=0;
    const meta=info[id]; document.getElementById('title').textContent=meta.label+' · '+meta.group;
    document.querySelectorAll('.item').forEach(el => el.setAttribute('aria-current',String(el.dataset.id===id)));
    document.getElementById('pick').value=id;
    try {window.history.replaceState(null,'','#s'+meta.num);} catch (_) {}
    paint();
  }
  function back(){if(historyStack.length) show(historyStack.pop(),false); else show(byNum[13],false);}
  function evaluate(data) {
    if (!data) return undefined;
    if (data.type==='VARIABLE_ALIAS') return state[data.value?.id || data.id];
    if (data.type!=='EXPRESSION') return data.value;
    const {expressionFunction:f,expressionArguments:args}=data.value;
    const v=args.map(evaluate);
    switch(f){case 'EQUALS':return v[0]===v[1];case 'NOT_EQUAL':return v[0]!==v[1];case 'AND':return v.every(Boolean);case 'OR':return v.some(Boolean);case 'NOT':return !v[0];case 'ADDITION':return v[0]+v[1];case 'SUBTRACTION':return v[0]-v[1];case 'LESS_THAN':return v[0]<v[1];case 'GREATER_THAN':return v[0]>v[1];case 'GREATER_THAN_OR_EQUAL':return v[0]>=v[1];case 'LESS_THAN_OR_EQUAL':return v[0]<=v[1];default:throw new Error('지원하지 않는 선택 계산: '+f);}
  }
  function execute(actions, navigate = true) {
    for (const action of actions || []) {
      if(action.type==='SET_VARIABLE') {const value=evaluate(action.variableValue); if(action.variableId in defaults && typeof value===typeof defaults[action.variableId]) state[action.variableId]=value;}
      else if(action.type==='CONDITIONAL') {for(const block of action.conditionalBlocks){if(!block.condition || evaluate(block.condition)){execute(block.actions,navigate);break;}}}
      else if(action.type==='NODE' && navigate) show(action.destinationId);
      else if(action.type==='BACK' && navigate) back();
      else if(action.type==='CLOSE' && navigate) back();
    }
  }
  function trigger(id) {
    const before=current;
    for(const reaction of FIGMA.sources[id] || []) if(reaction.trigger?.type==='ON_CLICK') execute(reaction.actions);
    paint(); save();
    if(id==='4:849' && before===current && !get('tapDone')) toast('먼저 초록색 큰 카드를 눌러 주세요.');
    if(id==='4:958' && before===current && !get('answerDone')) toast('마지막 그림을 골라 주세요.');
  }
  const nav=document.getElementById('nav'), pick=document.getElementById('pick');
  META.groups.forEach(group => {
    const box=document.createElement('div'); box.className='group'; const heading=document.createElement('h2'); heading.textContent=group.name; box.appendChild(heading);
    const optgroup=document.createElement('optgroup'); optgroup.label=group.name;
    group.ids.forEach(id => {const s=info[id], b=document.createElement('button'); b.className='item'; b.dataset.id=id; b.textContent=String(s.num).padStart(2,'0')+'  '+s.label; b.onclick=()=>show(id); box.appendChild(b); const option=document.createElement('option'); option.value=id; option.textContent=b.textContent; optgroup.appendChild(option);});
    nav.appendChild(box);pick.appendChild(optgroup);
  });
  const step=d=>show(META.order[Math.max(0,Math.min(META.order.length-1,META.order.indexOf(current)+d))]);
  pick.onchange=()=>show(pick.value); document.getElementById('prev').onclick=()=>back(); document.getElementById('next').onclick=()=>step(1);
  document.getElementById('restart').onclick=()=>{historyStack=[];show(byNum[13],false);};
  document.getElementById('hot').onchange=e=>document.getElementById('app').classList.toggle('show-hot',e.target.checked);
  document.getElementById('dark').onchange=e=>document.documentElement.dataset.theme=e.target.checked?'dark':'light';
  function wire(el, target) {if(el) el.dataset.go=target;}
  for(const[id,target]of Object.entries(META.links)) wire($(id),target);
  phone.querySelectorAll('[data-name="이전"]').forEach(el=>wire(el,'back'));
  phone.querySelectorAll('[data-name="도움"]').forEach(el=>wire(el,12));
  phone.querySelectorAll('[data-name="설정"]').forEach(el=>wire(el,11));
  const tabs={'탭 / home':'home','탭 / learn':4,'탭 / practice':3,'탭 / records':'records'};
  phone.querySelectorAll('[data-name^="탭 / "]').forEach(el=>wire(el,tabs[el.dataset.name]));
  wire($('44:926'),29);
  for(const id of Object.keys(FIGMA.sources)) {const el=$(id);if(el) el.dataset.figma=id;}
  const field=document.getElementById('profile-name');
  const updateName=()=>{const name=field.value.replace(/[\u0000-\u001f\u007f]/g,'').slice(0,20).trim() || '정희';set('name',name);set('greeting',name+'님, 반가워요.');paint();save();};
  field.addEventListener('input',updateName);field.addEventListener('blur',updateName);
  const clear=$('45:843'); if(clear) clear.dataset.custom='clear';
  const nameBox=$('24:974'); if(nameBox) nameBox.addEventListener('click',e=>{if(!e.target.closest('[data-custom]'))field.focus();});
  const days=['4:1022','4:1024','4:1026','4:1028','4:1030'];days.forEach(id=>{if($(id))$(id).dataset.custom='day';});
  phone.addEventListener('click', event=>{
    const el=event.target.closest('[data-figma],[data-custom],[data-go]');if(!el)return;event.preventDefault();
    if(el.dataset.custom==='clear'){field.value='';field.focus();return;}
    if(el.dataset.custom==='day'){el.classList.toggle('sel');const names=days.filter(id=>$(id)?.classList.contains('sel')).map(id=>$(id).textContent.trim());$('4:1032').textContent=(names.join(' · ')||'요일을 골라 주세요')+' / 오전 10시';return;}
    if(el.dataset.figma) {trigger(el.dataset.figma);return;}
    let target=el.dataset.go;if(target==='back')return back();if(target==='home')target=[28,29,30].includes(info[current].num)?29:1;if(target==='records')target=[28,29,30].includes(info[current].num)?30:10;
    if(+target===3){set('tapDone',false);set('tapLabel','큰 버튼을 눌러 보세요.');set('conditions','도움 없이 진행 · 진행자와 구두 회상');}
    show(byNum[target]);save();
  });
  phone.querySelectorAll('[data-figma],[data-go],[data-custom]').forEach(el=>{if(!['INPUT','BUTTON'].includes(el.tagName)){el.setAttribute('role','button');el.tabIndex=0;}});
  phone.addEventListener('keydown',e=>{const el=e.target.closest('[role="button"]');if(el && (e.key==='Enter'||e.key===' ')){e.preventDefault();el.click();}});
  document.addEventListener('keydown',e=>{if(e.target.closest('input,select,textarea,[contenteditable]'))return;if(e.key==='ArrowRight')step(1);if(e.key==='ArrowLeft')back();});
  function fit(){const rect=canvas.getBoundingClientRect(), mobile=window.innerWidth<=860, pad=mobile?0:8;const scale=Math.max(.2,Math.min(1,(rect.width-2*pad)/414,mobile?10:(rect.height-2*pad)/920));phone.style.transform='scale('+scale+')';wrap.style.width=414*scale+'px';wrap.style.height=920*scale+'px';}
  window.addEventListener('resize',fit);
  // shortcut: account actions are local demo transitions; replace with verified authentication before a real service launch.
  function selfCheck(){const held=state;try{for(const cue of ['V','W'])for(const arrange of ['G','O']){state={...defaults};set('cue',cue);const question=arrange==='G'?'24:1097':'24:1101';for(const r of FIGMA.sources[question])execute(r.actions,false);if(get('arrange')!==arrange || !get('typeName'))throw new Error('유형 계산 실패');}state={...defaults};const evalCond={type:'EXPRESSION',value:{expressionFunction:'AND',expressionArguments:[{type:'BOOLEAN',value:true},{type:'BOOLEAN',value:false}]}};if(evaluate(evalCond)!==false)throw new Error('선택 조건 실패');}finally{state=held;}}
  selfCheck();const match=location.hash.match(/^#s(\d+)$/);show(match&&byNum[+match[1]]?byNum[+match[1]]:byNum[13],false);fit();
})();
