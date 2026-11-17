async (page) => {
  return page.evaluate(() => {
    const check = (ok, message) => { if (!ok) throw new Error(message); };
    const click = id => document.querySelector('.scr.on [data-node-id="' + id + '"]').click();
    const pick = id => {const el=document.getElementById('pick');el.value=id;el.dispatchEvent(new Event('change'));};
    const values = () => JSON.parse(localStorage.getItem('memoryon-html-demo-v1')).values;
    const families = {VG:'장면을 묶는 탐험가',VO:'장면을 잇는 길잡이',WG:'말을 묶는 정리왕',WO:'이야기를 잇는 기록가'};
    const results=[];
    for (const [a, q1] of [['V','24:1079'],['W','24:1083']])
      for (const [b, q2] of [['G','24:1097'],['O','24:1101']])
        for (const [c, q3] of [['S','24:1115'],['D','24:1119']])
          for (const [d, q4] of [['I','24:1133'],['T','24:1137']]) {
            pick('24:588'); [q1,q2,q3,q4,'24:1166','24:1178'].forEach(click);
            const v=values(), code=['343','344','345','346'].map(id=>v['VariableID:24:'+id]).join('');
            check(code===a+b+c+d, 'Preference code mismatch: '+code);
            check(v['VariableID:24:351']===families[a+b], 'Strategy family mismatch: '+a+b+' / '+v['VariableID:24:351']);
            check(v['VariableID:24:354']==='그림 다시 찾기 1 / 1', 'Recognition result mismatch');
            results.push(code);
          }
    check(new Set(results).size===16,'Missing preference combinations');
    check(document.querySelectorAll('.scr').length===32,'Missing screens');
    check([...document.images].every(i=>i.complete&&i.naturalWidth>0),'Missing embedded image');
    check(!document.querySelector('script[src],link[href^="http"]'),'External dependency');
    pick('24:425');
    return {passed:true,combinations:results.length,screens:32};
  });
}
