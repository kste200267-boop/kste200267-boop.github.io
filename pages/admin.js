// pages/admin.js — 관리자 (전체)
var PageAdmin=(function(){
  var tab='accounts';
  function render(){
    var h='<div class="card"><div class="card-h">⚙️ 관리자 설정</div>';
    h+='<div class="chips" style="margin-bottom:14px">';
    var ts=[['accounts','👤 계정'],['subjects','📚 과목'],['timetable','📅 시간표'],['classEdit','🏫 학급편집'],['afterBulk','🌙 방과후'],['notice','📢 공지'],['print','🖨️ 출력'],['periods','🕐 교시'],['data','💾 데이터']];
    for(var i=0;i<ts.length;i++)h+='<span class="chip'+(tab===ts[i][0]?' on':'')+'" onclick="PageAdmin.tab(\''+ts[i][0]+'\')">'+ts[i][1]+'</span>';
    h+='</div><div id="ac"></div></div>';
    document.getElementById('pg').innerHTML=h;
    var fn={accounts:rAcc,subjects:rSubj,timetable:rTT,classEdit:rClassEdit,afterBulk:rAfterBulk,notice:rNotice,print:rPrint,periods:rPer,data:rDat};
    fn[tab]();
  }

  // ── 계정 ──
  function rAcc(){
    var acc=Auth.getAccounts(),names=Object.keys(acc).sort();
    var h='<h3 style="font-size:.92em;margin-bottom:8px">👤 계정 ('+names.length+'명)</h3>';
    h+='<div style="overflow-x:auto;max-height:350px;overflow-y:auto"><table class="a-table"><thead><tr><th>이름</th><th>아이디</th><th>비밀번호</th><th>권한</th><th></th></tr></thead><tbody>';
    for(var i=0;i<names.length;i++){var n=names[i],a=acc[n];
      h+='<tr><td>'+n+'</td><td><input id="ai'+i+'" value="'+a.id+'" data-k="'+n+'"></td><td><input id="ap'+i+'" value="'+a.pw+'" data-k="'+n+'"></td>';
      h+='<td><select id="ar'+i+'" data-k="'+n+'"><option value="user"'+(a.role==='user'?' selected':'')+'>일반</option><option value="admin"'+(a.role==='admin'?' selected':'')+'>관리자</option></select></td>';
      h+='<td><button class="a-btn danger sm" onclick="PageAdmin.delAcc(\''+n+'\')">삭제</button></td></tr>'}
    h+='</tbody></table></div>';
    h+='<button class="a-btn primary" style="margin-top:8px" onclick="PageAdmin.saveAcc('+names.length+')">💾 저장</button> <button class="a-btn outline" onclick="PageAdmin.resetAcc()">🔄 초기화</button>';
    h+='<div style="margin-top:12px;padding:12px;background:var(--bg2);border-radius:6px"><div style="font-weight:600;font-size:.85em;margin-bottom:6px">➕ 회원 추가</div><div style="display:flex;gap:6px;flex-wrap:wrap"><input class="ti-input" id="nn" placeholder="이름" style="max-width:100px"><input class="ti-input" id="ni" placeholder="아이디" style="max-width:100px"><input class="ti-input" id="np" placeholder="비번" style="max-width:80px"><select class="ti-sel" id="nr"><option value="user">일반</option><option value="admin">관리자</option></select><button class="a-btn success" onclick="PageAdmin.addAcc()">추가</button></div></div>';
    document.getElementById('ac').innerHTML=h;
  }
  function saveAcc(c){var acc=Auth.getAccounts();for(var i=0;i<c;i++){var el=document.getElementById('ai'+i);if(!el)continue;var k=el.dataset.k;acc[k].id=el.value.trim()||k;acc[k].pw=document.getElementById('ap'+i).value||'1234';acc[k].role=document.getElementById('ar'+i).value}Auth.saveAccounts(acc);toast('저장됨')}
  function addAcc(){var n=document.getElementById('nn').value.trim();if(!n){toast('이름 입력');return}var acc=Auth.getAccounts();if(acc[n]){toast('이미 존재');return}acc[n]={id:document.getElementById('ni').value.trim()||n,pw:document.getElementById('np').value||'1234',role:document.getElementById('nr').value};if(!TD_ORIGINAL[n])TD_ORIGINAL[n]={h:0,s:new Array(32).fill(null)};Auth.saveAccounts(acc);Engine.rebuild();toast(n+' 추가');render()}
  function delAcc(n){if(n===App.getUser()){toast('본인 삭제 불가');return}if(!confirm(n+' 삭제?'))return;var acc=Auth.getAccounts();delete acc[n];Auth.saveAccounts(acc);toast('삭제됨');render()}
  function resetAcc(){if(!confirm('전체 초기화?'))return;Store.remove('accounts');Auth.initAccounts();toast('완료');render()}

  // ── 과목 ──
  function rSubj(){
    var TS=Engine.TS(),names=Engine.names(),ov=Store.get('subj-ov',{});
    var h='<h3 style="font-size:.92em;margin-bottom:8px">📚 교사별 과목</h3>';
    h+='<div style="max-height:400px;overflow-y:auto"><table class="a-table"><thead><tr><th>이름</th><th>자동</th><th>수정</th></tr></thead><tbody>';
    for(var i=0;i<names.length;i++){var n=names[i];h+='<tr><td>'+n+'</td><td style="color:var(--tx3)">'+TS[n]+'</td><td><input id="so'+i+'" value="'+(ov[n]||'')+'" placeholder="'+TS[n]+'" data-k="'+n+'" style="width:100px"></td></tr>'}
    h+='</tbody></table></div><button class="a-btn primary" style="margin-top:8px" onclick="PageAdmin.saveSubj('+names.length+')">💾 저장</button>';
    document.getElementById('ac').innerHTML=h;
  }
  function saveSubj(c){var ov={};for(var i=0;i<c;i++){var el=document.getElementById('so'+i);if(!el)continue;var v=el.value.trim();if(v)ov[el.dataset.k]=v}Store.set('subj-ov',ov);applySubjOv();toast('저장됨')}

  // ── 시간표 CSV ──
  function rTT(){
    var h='<h3 style="font-size:.92em;margin-bottom:8px">📅 교사 시간표 관리</h3>';
    h+='<div style="padding:12px;background:var(--bg2);border-radius:6px;margin-bottom:12px">';
    h+='<p style="font-size:.82em;color:var(--tx2);margin-bottom:8px">CSV: 교사명,시수,월1,...,금6 (34열)</p>';
    h+='<input type="file" id="csvF" accept=".csv" style="margin-bottom:6px"><br>';
    h+='<button class="a-btn primary" onclick="PageAdmin.upCSV()">📊 업로드</button> <button class="a-btn outline" onclick="PageAdmin.dlCSV()">📥 양식 다운로드</button></div>';
    h+='<div style="max-height:250px;overflow-y:auto"><table class="a-table"><thead><tr><th>이름</th><th>과목</th><th>시수</th></tr></thead><tbody>';
    var names=Engine.names(),TD=Engine.TD(),TS=Engine.TS();
    for(var i=0;i<names.length;i++){var n=names[i];h+='<tr><td>'+n+'</td><td>'+TS[n]+'</td><td>'+TD[n].h+'</td></tr>'}
    h+='</tbody></table></div>';
    document.getElementById('ac').innerHTML=h;
  }
  function upCSV(){var f=document.getElementById('csvF');if(!f.files.length){toast('파일 선택');return}var r=new FileReader();r.onload=function(e){try{var lines=e.target.result.split('\n'),cnt=0;for(var i=1;i<lines.length;i++){var c=lines[i].split(',');if(c.length<34)continue;var name=c[0].trim(),hours=parseInt(c[1])||0,sched=[];for(var j=2;j<34;j++){var v=c[j]?c[j].trim():'';sched.push(v&&v!=='-'&&v!=='null'?v:null)}if(name){TD_ORIGINAL[name]={h:hours,s:sched};var acc=Auth.getAccounts();if(!acc[name]){acc[name]={id:name,pw:'1234',role:'user'};Auth.saveAccounts(acc)}cnt++}}Engine.rebuild();toast(cnt+'명 완료');render()}catch(err){toast('오류')}};r.readAsText(f.files[0],'UTF-8')}
  function dlCSV(){var hd='교사명,시수,월1,월2,월3,월4,월5,월6,월7,화1,화2,화3,화4,화5,화6,화7,수1,수2,수3,수4,수5,수6,목1,목2,목3,목4,목5,목6,금1,금2,금3,금4,금5,금6\n',bd='';var names=Object.keys(TD_ORIGINAL).sort();for(var i=0;i<names.length;i++){var n=names[i],t=TD_ORIGINAL[n];bd+=n+','+t.h;for(var j=0;j<t.s.length;j++)bd+=','+(t.s[j]||'');bd+='\n'}var blob=new Blob(['\uFEFF'+hd+bd],{type:'text/csv;charset=utf-8'});var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='시간표_양식.csv';a.click();toast('다운로드')}

  // ── 학급 시간표 수정 ──
  function rClassEdit(){
    var classes=Object.keys(CS).sort();
    var selCls=Store.get('admin-sel-class',classes[0]||'1용1');
    var h='<h3 style="font-size:.92em;margin-bottom:8px">🏫 학급 시간표 수정 (고1)</h3>';
    h+='<div class="filter-row"><span class="filter-label">반:</span><select class="ti-sel" id="ceClass" onchange="Store.set(\'admin-sel-class\',this.value);PageAdmin.tab(\'classEdit\')">';
    for(var i=0;i<classes.length;i++)h+='<option value="'+classes[i]+'"'+(classes[i]===selCls?' selected':'')+'>'+classes[i]+'</option>';
    h+='</select></div>';
    if(CS[selCls]){
      h+='<div style="overflow-x:auto"><table class="a-table"><thead><tr><th></th>';
      for(var di=0;di<5;di++)h+='<th>'+DAYS[di]+'</th>';
      h+='</tr></thead><tbody>';
      for(var p=0;p<7;p++){
        h+='<tr><th>'+(p+1)+'교시</th>';
        for(var di=0;di<5;di++){var d=DAYS[di];
          var val=(p<DP[d]&&CS[selCls][d])?CS[selCls][d][p]||'':'';
          if(p>=DP[d])h+='<td style="background:var(--bg2)">—</td>';
          else h+='<td><input class="ti-input" style="padding:3px 5px;font-size:.82em" value="'+val+'" data-cls="'+selCls+'" data-day="'+d+'" data-p="'+p+'"></td></tr>';
        }h+='</tr>';
      }
      h+='</tbody></table></div>';
      h+='<button class="a-btn primary" style="margin-top:8px" onclick="PageAdmin.saveClass()">💾 저장</button>';
    }
    document.getElementById('ac').innerHTML=h;
  }
  function saveClass(){
    var inputs=document.querySelectorAll('[data-cls][data-day][data-p]');
    for(var i=0;i<inputs.length;i++){
      var cls=inputs[i].dataset.cls,day=inputs[i].dataset.day,p=parseInt(inputs[i].dataset.p);
      var val=inputs[i].value.trim();
      if(CS[cls]&&CS[cls][day])CS[cls][day][p]=val||null;
    }
    Store.set('class-edits',CS);Engine.rebuild();toast('학급 시간표 저장됨');
  }

  // ── 방과후 일괄 ──
  function rAfterBulk(){
    var names=Engine.names().filter(function(n){return Engine.TD()[n].h>0});
    var h='<h3 style="font-size:.92em;margin-bottom:8px">🌙 방과후 일괄 관리</h3>';
    h+='<p style="color:var(--tx2);font-size:.82em;margin-bottom:10px">교사별 방과후 현황을 확인하고 일괄 등록합니다.</p>';
    h+='<div style="max-height:400px;overflow-y:auto"><table class="a-table"><thead><tr><th>교사</th><th>과목</th><th>방과후 현황</th><th></th></tr></thead><tbody>';
    for(var i=0;i<names.length;i++){var n=names[i];
      var after=Store.get('after-'+n,[]);
      var active=after.filter(function(a){if(!a.from&&!a.to)return true;var now=new Date().toISOString().slice(0,10);return(!a.from||now>=a.from)&&(!a.to||now<=a.to)});
      var summary=active.map(function(a){var s=a.day;if(a.p8)s+='(8:'+a.p8+')';if(a.p9)s+='(9:'+a.p9+')';return s}).join(', ');
      h+='<tr><td>'+n+'</td><td>'+Engine.TS()[n]+'</td><td style="font-size:.8em">'+(summary||'<span style="color:var(--tx3)">없음</span>')+'</td>';
      h+='<td><button class="a-btn outline sm" onclick="PageAdmin.editAfterFor(\''+n+'\')">편집</button></td></tr>';
    }
    h+='</tbody></table></div>';

    // 일괄 등록
    h+='<div style="margin-top:14px;padding:12px;background:var(--bg2);border-radius:6px">';
    h+='<div style="font-weight:600;font-size:.88em;margin-bottom:8px">일괄 등록</div>';
    h+='<div style="display:flex;gap:6px;flex-wrap:wrap;align-items:flex-end">';
    h+='<div><div style="font-size:.78em;color:var(--tx2)">교사</div><select class="ti-sel" id="abTeacher">';
    for(var i=0;i<names.length;i++)h+='<option>'+names[i]+'</option>';
    h+='</select></div>';
    h+='<div><div style="font-size:.78em;color:var(--tx2)">요일</div><select class="ti-sel" id="abDay"><option>월</option><option>화</option><option>수</option><option>목</option><option>금</option></select></div>';
    h+='<div><div style="font-size:.78em;color:var(--tx2)">8교시</div><input class="ti-input" id="abP8" placeholder="반명" style="width:70px"></div>';
    h+='<div><div style="font-size:.78em;color:var(--tx2)">9교시</div><input class="ti-input" id="abP9" placeholder="반명" style="width:70px"></div>';
    h+='<div><div style="font-size:.78em;color:var(--tx2)">시작</div><input class="ti-input" id="abFrom" type="date" style="width:120px"></div>';
    h+='<div><div style="font-size:.78em;color:var(--tx2)">종료</div><input class="ti-input" id="abTo" type="date" style="width:120px"></div>';
    h+='<button class="a-btn primary" onclick="PageAdmin.addAfterBulk()">추가</button>';
    h+='</div></div>';
    document.getElementById('ac').innerHTML=h;
  }
  function editAfterFor(name){
    var data=Store.get('after-'+name,[]);
    var msg=name+' 방과후 현황:\n';
    for(var i=0;i<data.length;i++){var a=data[i];msg+=a.day+(a.p8?' 8:'+a.p8:'')+(a.p9?' 9:'+a.p9:'')+' ('+( a.from||'~')+' ~ '+(a.to||'~')+')\n'}
    msg+='\n전부 삭제하려면 "삭제" 입력:';
    var r=prompt(msg);
    if(r==='삭제'){Store.set('after-'+name,[]);toast(name+' 방과후 삭제');render()}
  }
  function addAfterBulk(){
    var name=document.getElementById('abTeacher').value;
    var day=document.getElementById('abDay').value;
    var p8=document.getElementById('abP8').value.trim();
    var p9=document.getElementById('abP9').value.trim();
    var from=document.getElementById('abFrom').value;
    var to=document.getElementById('abTo').value;
    if(!p8&&!p9){toast('8 or 9교시 입력');return}
    var data=Store.get('after-'+name,[]);
    data.push({day:day,p8:p8,p9:p9,from:from,to:to});
    Store.set('after-'+name,data);toast(name+' '+day+' 방과후 추가');render();
  }

  // ── 공지사항 ──
  function rNotice(){
    var notices=Store.get('notices',[]);
    var h='<h3 style="font-size:.92em;margin-bottom:8px">📢 공지사항 게시판</h3>';
    h+='<div style="margin-bottom:12px">';
    if(!notices.length)h+='<div style="color:var(--tx3);font-size:.85em;padding:8px">공지 없음</div>';
    for(var i=0;i<notices.length;i++){var n=notices[i];
      h+='<div style="padding:10px;border:1px solid var(--bd);border-radius:6px;margin-bottom:6px">';
      h+='<div style="display:flex;justify-content:space-between;align-items:center">';
      h+='<div style="font-weight:600;font-size:.9em">'+n.title+'</div>';
      h+='<div style="display:flex;gap:4px;align-items:center"><span style="font-size:.75em;color:var(--tx3)">'+n.date+'</span>';
      h+='<button class="a-btn danger sm" onclick="PageAdmin.delNotice('+i+')">삭제</button></div></div>';
      h+='<div style="font-size:.85em;margin-top:4px;white-space:pre-wrap;color:var(--tx2)">'+n.content+'</div></div>';
    }
    h+='</div>';
    h+='<div style="padding:12px;background:var(--bg2);border-radius:6px">';
    h+='<input class="ti-input" id="ntTitle" placeholder="제목" style="margin-bottom:6px">';
    h+='<textarea class="ti-input" id="ntContent" placeholder="내용" style="min-height:80px;resize:vertical;margin-bottom:6px"></textarea>';
    h+='<button class="a-btn primary" onclick="PageAdmin.addNotice()">📢 게시</button></div>';
    document.getElementById('ac').innerHTML=h;
  }
  function addNotice(){
    var title=document.getElementById('ntTitle').value.trim();
    var content=document.getElementById('ntContent').value.trim();
    if(!title){toast('제목 입력');return}
    var notices=Store.get('notices',[]);
    notices.unshift({title:title,content:content,date:new Date().toISOString().slice(0,10),by:App.getUser()});
    Store.set('notices',notices);toast('게시됨');render();
  }
  function delNotice(i){var n=Store.get('notices',[]);n.splice(i,1);Store.set('notices',n);toast('삭제');render()}

  // ── 인쇄 PDF ──
  function rPrint(){
    var h='<h3 style="font-size:.92em;margin-bottom:8px">🖨️ 인쇄용 시간표</h3>';
    h+='<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px">';
    h+='<select class="ti-sel" id="prTarget">';
    h+='<option value="my">내 시간표</option>';
    var names=Engine.names();for(var i=0;i<names.length;i++)h+='<option value="t:'+names[i]+'">'+names[i]+' ('+Engine.TS()[names[i]]+')</option>';
    var cls=Object.keys(CS).sort();for(var i=0;i<cls.length;i++)h+='<option value="c:'+cls[i]+'">'+cls[i]+' (학급)</option>';
    h+='</select>';
    h+='<button class="a-btn primary" onclick="PageAdmin.doPrint()">🖨️ 인쇄/PDF 저장</button></div>';
    h+='<div id="printPreview"></div>';
    document.getElementById('ac').innerHTML=h;
  }
  function doPrint(){
    var sel=document.getElementById('prTarget').value;
    var name='',isClass=false;
    if(sel==='my'){name=App.getUser()}
    else if(sel.indexOf('t:')===0){name=sel.substr(2)}
    else if(sel.indexOf('c:')===0){name=sel.substr(2);isClass=true}

    var h='<div id="printArea" style="background:#fff;padding:20px;color:#000">';
    h+='<h2 style="text-align:center;margin-bottom:16px">경북기계금속고등학교 — '+(isClass?name+' 학급':name+' ('+Engine.TS()[name]+')')+' 시간표</h2>';
    h+='<table style="width:100%;border-collapse:collapse;font-size:13px"><thead><tr><th style="border:1px solid #000;padding:8px;background:#e8e8e8"></th>';
    for(var di=0;di<5;di++)h+='<th style="border:1px solid #000;padding:8px;background:#e8e8e8">'+DAYS[di]+'</th>';
    h+='</tr></thead><tbody>';
    var TD=Engine.TD(),CTM=Engine.CTM();
    for(var p=0;p<7;p++){
      h+='<tr><th style="border:1px solid #000;padding:8px;background:#f5f5f5">'+(p+1)+'교시<br>'+PT[p].s+'~'+PT[p].e+'</th>';
      for(var di=0;di<5;di++){var d=DAYS[di];
        if(p>=DP[d]){h+='<td style="border:1px solid #000;padding:8px;color:#999">—</td>';continue}
        if(isClass){
          var key=name+'|'+d+'|'+p,t=CTM[key]||'',sj='';
          if(CS[name])sj=CS[name][d][p]||'';
          h+='<td style="border:1px solid #000;padding:8px">'+(t?'<b>'+t+'</b><br><span style="font-size:11px;color:#666">'+sj+'</span>':(sj||'—'))+'</td>';
        }else{
          var cl=Engine.slot(name,d,p),sj='';
          if(cl&&CS[cl])sj=CS[cl][d][p]||'';else if(cl)sj=cl;
          h+='<td style="border:1px solid #000;padding:8px">'+(cl?(cl+'<br><span style="font-size:11px;color:#666">'+sj+'</span>'):'—')+'</td>';
        }
      }h+='</tr>';
    }
    h+='</tbody></table>';
    h+='<div style="text-align:right;margin-top:12px;font-size:11px;color:#999">출력일: '+new Date().toLocaleDateString('ko-KR')+'</div>';
    h+='</div>';
    h+='<button class="a-btn primary" style="margin-top:8px" onclick="var w=window.open(\'\');w.document.write(document.getElementById(\'printArea\').outerHTML);w.document.close();w.print()">🖨️ 인쇄하기</button>';
    document.getElementById('printPreview').innerHTML=h;
  }

  // ── 교시 ──
  function rPer(){
    var h='<h3 style="font-size:.92em;margin-bottom:8px">🕐 교시 시간</h3><table class="a-table"><thead><tr><th>교시</th><th>시작</th><th>종료</th></tr></thead><tbody>';
    for(var i=0;i<PT.length;i++)h+='<tr><td>'+(i+1)+'교시</td><td><input type="time" id="ps'+i+'" value="'+PT[i].s+'"></td><td><input type="time" id="pe'+i+'" value="'+PT[i].e+'"></td></tr>';
    h+='</tbody></table><button class="a-btn primary" style="margin-top:8px" onclick="PageAdmin.savePT()">💾 저장</button>';
    document.getElementById('ac').innerHTML=h;
  }
  function savePT(){for(var i=0;i<PT.length;i++){PT[i].s=document.getElementById('ps'+i).value;PT[i].e=document.getElementById('pe'+i).value}Store.set('pt',PT);toast('저장됨')}

  // ── 데이터 ──
  function rDat(){
    var total=0;for(var i=0;i<localStorage.length;i++){var k=localStorage.key(i);if(k&&k.indexOf('gm-')===0)total+=localStorage.getItem(k).length}
    var h='<h3 style="font-size:.92em;margin-bottom:8px">💾 데이터</h3><div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px">';
    h+='<button class="a-btn success" onclick="PageAdmin.exp()">📥 백업</button><button class="a-btn outline" onclick="document.getElementById(\'impF\').click()">📤 복원</button>';
    h+='<input type="file" id="impF" accept=".json" style="display:none" onchange="PageAdmin.imp(event)">';
    h+='<button class="a-btn danger" onclick="PageAdmin.clr()">🗑️ 초기화</button></div>';
    h+='<div style="padding:8px;background:var(--bg2);border-radius:6px;font-size:.85em">💿 '+( total/1024).toFixed(1)+' KB</div>';
    document.getElementById('ac').innerHTML=h;
  }
  function exp(){var d=Store.exportAll();d.subjOv=Store.get('subj-ov',{});d.notices=Store.get('notices',[]);d.classEdits=Store.get('class-edits',null);var blob=new Blob([JSON.stringify(d,null,2)],{type:'application/json'});var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='portal-backup-'+new Date().toISOString().slice(0,10)+'.json';a.click()}
  function imp(e){var f=e.target.files[0];if(!f)return;var r=new FileReader();r.onload=function(ev){try{var d=JSON.parse(ev.target.result);Store.importAll(d);if(d.subjOv)Store.set('subj-ov',d.subjOv);if(d.notices)Store.set('notices',d.notices);if(d.classEdits){Store.set('class-edits',d.classEdits);for(var k in d.classEdits)CS[k]=d.classEdits[k]}Engine.rebuild();toast('복원');render()}catch(err){toast('오류')}};r.readAsText(f)}
  function clr(){if(!confirm('전체 삭제?'))return;var ks=[];for(var i=0;i<localStorage.length;i++){var k=localStorage.key(i);if(k&&k.indexOf('gm-')===0)ks.push(k)}ks.forEach(function(k){localStorage.removeItem(k)});location.reload()}

  return{render:render,tab:function(t){tab=t;render()},saveAcc:saveAcc,addAcc:addAcc,delAcc:delAcc,resetAcc:resetAcc,saveSubj:saveSubj,upCSV:upCSV,dlCSV:dlCSV,
    saveClass:saveClass,editAfterFor:editAfterFor,addAfterBulk:addAfterBulk,addNotice:addNotice,delNotice:delNotice,doPrint:doPrint,savePT:savePT,exp:exp,imp:imp,clr:clr};
})();
function applySubjOv(){var ov=Store.get('subj-ov',{});var TS=Engine.TS();for(var k in ov)if(TS[k])TS[k]=ov[k]}
var _oRb=Engine.rebuild;Engine.rebuild=function(w){_oRb(w);applySubjOv()};
