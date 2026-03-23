// pages/admin.js — 관리자 (강화)
var PageAdmin=(function(){
var tab='accounts';
function render(){
var h='<div class="card"><div class="card-h">⚙️ 관리자 설정</div>';
h+='<div class="chips" style="margin-bottom:14px">';
var tabs=[{id:'accounts',l:'👤 계정'},{id:'subjects',l:'📚 과목'},{id:'timetable',l:'📅 시간표'},{id:'periods',l:'⏰ 교시'},{id:'data',l:'💾 데이터'}];
for(var i=0;i<tabs.length;i++){var t=tabs[i];h+='<span class="chip'+(tab===t.id?' on':'')+'" onclick="PageAdmin.tab(\''+t.id+'\')">'+t.l+'</span>'}
h+='</div><div id="aC"></div></div>';
document.getElementById('pg').innerHTML=h;
({accounts:rAcc,subjects:rSub,timetable:rTT,periods:rPT,data:rDat})[tab]()}

function rAcc(){
var acc=Auth.getAccounts(),ns=Object.keys(acc).sort();
var h='<div style="font-weight:600;font-size:.9em;margin-bottom:8px">계정 ('+ns.length+'명)</div>';
h+='<div style="overflow-x:auto"><table class="a-table"><thead><tr><th>이름</th><th>아이디</th><th>비밀번호</th><th>권한</th><th></th></tr></thead><tbody>';
for(var i=0;i<ns.length;i++){var n=ns[i],a=acc[n];
h+='<tr><td>'+n+'</td><td><input id="ai-'+i+'" value="'+a.id+'" data-k="'+n+'"></td>';
h+='<td><input id="ap-'+i+'" value="'+a.pw+'" data-k="'+n+'"></td>';
h+='<td><select id="ar-'+i+'" data-k="'+n+'"><option value="user"'+(a.role==='user'?' selected':'')+'>일반</option><option value="admin"'+(a.role==='admin'?' selected':'')+'>관리자</option></select></td>';
h+='<td><button class="a-btn danger sm" onclick="PageAdmin.delAcc(\''+n+'\')">삭제</button></td></tr>'}
h+='</tbody></table></div>';
h+='<button class="a-btn primary" style="margin-top:10px" onclick="PageAdmin.saveAcc('+ns.length+')">💾 일괄 저장</button> ';
h+='<button class="a-btn outline" onclick="PageAdmin.resetAcc()">🔄 초기화</button>';
h+='<div style="margin-top:16px;padding:14px;background:var(--bg2);border-radius:var(--radius-sm)"><div style="font-weight:600;font-size:.88em;margin-bottom:8px">➕ 회원 추가</div>';
h+='<div style="display:flex;gap:6px;flex-wrap:wrap;align-items:flex-end">';
h+='<div><div style="font-size:.76em;color:var(--tx2)">이름</div><input class="ti-input" id="naN" style="width:90px"></div>';
h+='<div><div style="font-size:.76em;color:var(--tx2)">아이디</div><input class="ti-input" id="naI" style="width:90px"></div>';
h+='<div><div style="font-size:.76em;color:var(--tx2)">비밀번호</div><input class="ti-input" id="naP" style="width:70px" value="1234"></div>';
h+='<div><div style="font-size:.76em;color:var(--tx2)">권한</div><select class="ti-sel" id="naR"><option value="user">일반</option><option value="admin">관리자</option></select></div>';
h+='<button class="a-btn success" onclick="PageAdmin.addAcc()">추가</button></div></div>';
document.getElementById('aC').innerHTML=h}

function saveAcc(c){var acc=Auth.getAccounts();for(var i=0;i<c;i++){var el=document.getElementById('ai-'+i);if(!el)continue;var k=el.dataset.k;acc[k].id=el.value.trim()||k;acc[k].pw=document.getElementById('ap-'+i).value||'1234';acc[k].role=document.getElementById('ar-'+i).value}Auth.saveAccounts(acc);toast('저장됨')}
function resetAcc(){if(!confirm('전체 초기화?'))return;Store.remove('accounts');Auth.initAccounts();toast('초기화');render()}
function delAcc(n){if(n==='김스데반'){toast('슈퍼관리자 삭제 불가');return}if(!confirm(n+' 삭제?'))return;var a=Auth.getAccounts();delete a[n];Auth.saveAccounts(a);toast('삭제됨');render()}
function addAcc(){var n=document.getElementById('naN').value.trim(),id=document.getElementById('naI').value.trim(),pw=document.getElementById('naP').value||'1234',r=document.getElementById('naR').value;
if(!n){toast('이름 입력');return}var a=Auth.getAccounts();if(a[n]){toast('이미 존재');return}
a[n]={id:id||n,pw:pw,role:r};Auth.saveAccounts(a);
if(!TD_ORIGINAL[n]){TD_ORIGINAL[n]={h:0,s:new Array(32).fill(null)};Engine.rebuild()}
toast(n+' 추가됨');render()}

function rSub(){
var TS=Engine.TS(),ns=Engine.names(),ov=Store.get('subject-overrides',{});
var h='<div style="font-weight:600;font-size:.9em;margin-bottom:8px">교사별 과목 수정</div>';
h+='<p style="color:var(--tx2);font-size:.8em;margin-bottom:10px">비워두면 자동 감지값 사용</p>';
h+='<div style="max-height:500px;overflow-y:auto"><table class="a-table"><thead><tr><th>이름</th><th>자동</th><th>수정값</th></tr></thead><tbody>';
for(var i=0;i<ns.length;i++){var n=ns[i];h+='<tr><td>'+n+'</td><td style="color:var(--tx2)">'+TS[n]+'</td><td><input id="sj-'+i+'" data-k="'+n+'" value="'+(ov[n]||'')+'" placeholder="자동"></td></tr>'}
h+='</tbody></table></div><button class="a-btn primary" style="margin-top:10px" onclick="PageAdmin.saveSub('+ns.length+')">💾 저장</button>';
document.getElementById('aC').innerHTML=h}

function saveSub(c){var ov={};for(var i=0;i<c;i++){var el=document.getElementById('sj-'+i);if(!el)continue;var v=el.value.trim();if(v)ov[el.dataset.k]=v}
Store.set('subject-overrides',ov);applySO();toast('과목 저장됨')}
function applySO(){var ov=Store.get('subject-overrides',{});var TS=Engine.TS();for(var k in ov)if(TS[k]!==undefined)TS[k]=ov[k]}

function rTT(){
var h='<div style="font-weight:600;font-size:.9em;margin-bottom:8px">시간표 관리</div>';
h+='<div style="padding:14px;background:var(--bg2);border-radius:var(--radius-sm);margin-bottom:14px">';
h+='<div style="font-weight:600;font-size:.88em;margin-bottom:6px">📤 CSV 시간표 업로드</div>';
h+='<p style="color:var(--tx2);font-size:.78em;margin-bottom:8px">형식: 1행=헤더, A=교사명, B=시수, C~AH=32슬롯(월1~금6)</p>';
h+='<input type="file" id="xlF" accept=".csv" style="margin-bottom:6px"><br>';
h+='<button class="a-btn primary" onclick="PageAdmin.upCSV()">📤 업로드</button> ';
h+='<button class="a-btn outline" onclick="PageAdmin.dlTpl()">📥 현재 시간표 CSV 다운로드</button></div>';
h+='<div style="font-weight:600;font-size:.88em;margin-bottom:6px">등록 교사 ('+Engine.names().length+'명)</div>';
h+='<div style="max-height:300px;overflow-y:auto"><table class="a-table"><thead><tr><th>이름</th><th>과목</th><th>시수</th><th>수업 반</th></tr></thead><tbody>';
var ns=Engine.names(),TD=Engine.TD(),TS=Engine.TS();
for(var i=0;i<ns.length;i++){var n=ns[i],cl={},s=TD[n].s;
for(var j=0;j<s.length;j++)if(s[j]&&s[j]!=='동아리'&&s[j]!=='3학선')cl[s[j]]=1;
h+='<tr><td>'+n+'</td><td>'+TS[n]+'</td><td>'+TD[n].h+'</td><td style="font-size:.76em;color:var(--tx2)">'+(Object.keys(cl).sort().join(', ')||'—')+'</td></tr>'}
h+='</tbody></table></div>';
document.getElementById('aC').innerHTML=h}

function upCSV(){var f=document.getElementById('xlF').files[0];if(!f){toast('파일 선택');return}
var r=new FileReader();r.onload=function(e){try{
var lines=e.target.result.split('\n').filter(function(l){return l.trim()}),cnt=0;
for(var i=1;i<lines.length;i++){var c=lines[i].split(','),nm=c[0]?c[0].trim().replace(/"/g,''):'',hr=parseInt(c[1])||0;if(!nm)continue;
var sc=[];for(var j=2;j<34;j++){var v=c[j]?c[j].trim().replace(/"/g,''):'';sc.push(!v||v==='null'||v==='-'?null:v)}
while(sc.length<32)sc.push(null);TD_ORIGINAL[nm]={h:hr,s:sc};cnt++}
Engine.rebuild();var acc=Auth.getAccounts();for(var n in TD_ORIGINAL)if(!acc[n])acc[n]={id:n,pw:'1234',role:'user'};
Auth.saveAccounts(acc);Store.set('td-custom',TD_ORIGINAL);toast(cnt+'명 업로드');render()}catch(err){toast('파싱 오류')}};r.readAsText(f)}

function dlTpl(){var ns=Object.keys(TD_ORIGINAL).sort();
var csv='교사명,시수,월1,월2,월3,월4,월5,월6,월7,화1,화2,화3,화4,화5,화6,화7,수1,수2,수3,수4,수5,수6,목1,목2,목3,목4,목5,목6,금1,금2,금3,금4,금5,금6\n';
for(var i=0;i<ns.length;i++){var n=ns[i],t=TD_ORIGINAL[n];csv+=n+','+t.h;for(var j=0;j<32;j++)csv+=','+(t.s[j]||'');csv+='\n'}
var b=new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'});var a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='시간표.csv';a.click();toast('다운로드')}

function rPT(){
var h='<div style="font-weight:600;font-size:.9em;margin-bottom:8px">교시 시간</div>';
h+='<table class="a-table"><thead><tr><th>교시</th><th>시작</th><th>종료</th></tr></thead><tbody>';
for(var i=0;i<PT.length;i++)h+='<tr><td>'+(i+1)+'교시</td><td><input type="time" id="ps-'+i+'" value="'+PT[i].s+'"></td><td><input type="time" id="pe-'+i+'" value="'+PT[i].e+'"></td></tr>';
h+='</tbody></table><button class="a-btn primary" style="margin-top:10px" onclick="PageAdmin.savePT()">💾 저장</button>';
document.getElementById('aC').innerHTML=h}
function savePT(){for(var i=0;i<PT.length;i++){PT[i].s=document.getElementById('ps-'+i).value;PT[i].e=document.getElementById('pe-'+i).value}Store.set('pt',PT);toast('저장됨')}

function rDat(){
var h='<div style="font-weight:600;font-size:.9em;margin-bottom:8px">데이터 관리</div>';
h+='<button class="a-btn success" onclick="PageAdmin.exp()">📥 전체 백업</button> ';
h+='<button class="a-btn outline" onclick="document.getElementById(\'impF\').click()">📤 복원</button>';
h+='<input type="file" id="impF" accept=".json" style="display:none" onchange="PageAdmin.imp(event)"> ';
h+='<button class="a-btn danger" onclick="PageAdmin.clr()">🗑️ 전체 초기화</button>';
h+='<div style="margin-top:10px;font-size:.78em;color:var(--tx3)">백업: 계정+교체기록+할일+교시+과목수정</div>';
document.getElementById('aC').innerHTML=h}
function exp(){var d=Store.exportAll();d.so=Store.get('subject-overrides',{});var b=new Blob([JSON.stringify(d,null,2)],{type:'application/json'});var a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='portal-'+new Date().toISOString().slice(0,10)+'.json';a.click();toast('다운로드')}
function imp(e){var f=e.target.files[0];if(!f)return;var r=new FileReader();r.onload=function(ev){try{var d=JSON.parse(ev.target.result);Store.importAll(d);if(d.so)Store.set('subject-overrides',d.so);Engine.rebuild();applySO();toast('복원 완료');render()}catch(er){toast('파일 오류')}};r.readAsText(f)}
function clr(){if(!confirm('전체 삭제? 되돌릴 수 없습니다.'))return;var ks=[];for(var i=0;i<localStorage.length;i++){var k=localStorage.key(i);if(k&&k.indexOf('gm-')===0)ks.push(k)}ks.forEach(function(k){localStorage.removeItem(k)});location.reload()}

return{render:render,tab:function(t){tab=t;render()},saveAcc:saveAcc,resetAcc:resetAcc,delAcc:delAcc,addAcc:addAcc,saveSub:saveSub,upCSV:upCSV,dlTpl:dlTpl,savePT:savePT,exp:exp,imp:imp,clr:clr,initOverrides:function(){applySO()}};
})();
