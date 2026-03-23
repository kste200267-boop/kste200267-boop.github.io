// pages/weekly.js — 주간 업무 (구글 캘린더 직접)
var PageWeekly=(function(){
var CID='243121397435-jlu52hqe8or79msoqj5qkrpuop9o1f0d.apps.googleusercontent.com';
var SC='https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events';
var token=null,events=[],weekOff=0,tc=null;
var DEPTS=[
{n:'교무부',kw:['교무','시간표','수업','교과','성적'],c:'#0F9D58'},
{n:'학생부',kw:['생활지도','학생부','선도','출결','학교폭력'],c:'#4285F4'},
{n:'진로상담부',kw:['진로','상담','진학','대학','입시'],c:'#F4B400'},
{n:'도제교육부',kw:['도제','현장실습','산학','NCS'],c:'#DB4437'},
{n:'학년부',kw:['학년','용접','밀링','기계융합','담임'],c:'#AB47BC'},
{n:'산업취업부',kw:['취업','산업체','채용','면접'],c:'#00ACC1'},
{n:'인재개발부',kw:['인재','역량','워크숍'],c:'#FF7043'},
{n:'개인 업무',kw:['개인','연수','출장','휴가'],c:'#607D8B'}];

function cls(t){var m=t.match(/\[([^\]]+)\]/);if(m){for(var i=0;i<DEPTS.length;i++){if(DEPTS[i].n===m[1])return DEPTS[i];for(var j=0;j<DEPTS[i].kw.length;j++)if(m[1].indexOf(DEPTS[i].kw[j])>=0)return DEPTS[i]}}
var tl=t.toLowerCase(),best=null,bs=0;for(var i=0;i<DEPTS.length;i++){if(DEPTS[i].n==='개인 업무')continue;var sc=0;for(var j=0;j<DEPTS[i].kw.length;j++)if(tl.indexOf(DEPTS[i].kw[j])>=0)sc+=DEPTS[i].kw[j].length;if(sc>bs){bs=sc;best=DEPTS[i]}}return best||DEPTS[DEPTS.length-1]}
function ct(t){return t.replace(/\[[^\]]+\]\s*/,'')}

function initGIS(){
var s=document.createElement('script');s.src='https://accounts.google.com/gsi/client';
s.onload=function(){tc=google.accounts.oauth2.initTokenClient({client_id:CID,scope:SC,callback:function(r){if(r.error)return;token=r.access_token;sessionStorage.setItem('gcal-t',token);load()}});
var sv=sessionStorage.getItem('gcal-t');if(sv){token=sv;load()}};document.head.appendChild(s)}

function load(){
var mon=Store.getMonday(new Date());mon.setDate(mon.getDate()+weekOff*7);
var sun=new Date(mon);sun.setDate(mon.getDate()+6);sun.setHours(23,59,59);
var url='https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin='+mon.toISOString()+'&timeMax='+sun.toISOString()+'&singleEvents=true&orderBy=startTime&maxResults=200';
var x=new XMLHttpRequest();x.open('GET',url);x.setRequestHeader('Authorization','Bearer '+token);
x.onload=function(){if(x.status===401){token=null;sessionStorage.removeItem('gcal-t');rLogin();return}
var d=JSON.parse(x.responseText);events=(d.items||[]).map(function(e){var dp=cls(e.summary||'');var ia=!!(e.start&&e.start.date);
return{id:e.id,title:e.summary||'',start:ia?e.start.date+'T00:00:00':e.start.dateTime,end:ia?(e.end?e.end.date+'T23:59:59':e.start.date+'T23:59:59'):(e.end?e.end.dateTime:e.start.dateTime),ia:ia,dn:dp.n,dc:dp.c,loc:e.location||''}});rWeek()};
x.onerror=function(){toast('네트워크 오류')};x.send()}

function rLogin(){
var h='<div class="card"><div class="card-h">📋 주간 업무</div><div style="text-align:center;padding:30px 0">';
h+='<p style="color:var(--tx2);font-size:.9em;margin-bottom:16px">Google 캘린더 로그인으로 부서별 주간 업무를 확인하세요</p>';
h+='<button class="a-btn primary" style="padding:12px 28px;font-size:.95em" onclick="PageWeekly.login()">📅 Google 캘린더 로그인</button></div></div>';
document.getElementById('pg').innerHTML=h}

function rWeek(){
var mon=Store.getMonday(new Date());mon.setDate(mon.getDate()+weekOff*7);
var dates=[];for(var i=0;i<7;i++){var dd=new Date(mon);dd.setDate(mon.getDate()+i);dates.push(dd)}
var lb=(dates[0].getMonth()+1)+'/'+dates[0].getDate()+' ~ '+(dates[6].getMonth()+1)+'/'+dates[6].getDate();
var dn=['월','화','수','목','금','토','일'],ts=new Date().toDateString();

var h='<div class="card"><div class="card-h">📋 주간 업무<span class="right"><button class="a-btn outline sm" onclick="PageWeekly.lo()">로그아웃</button></span></div>';
h+='<div class="week-nav"><button onclick="PageWeekly.p()">◀</button><span class="wk-label">'+lb+'</span><button onclick="PageWeekly.n()">▶</button><button onclick="PageWeekly.t()" style="margin-left:4px">이번주</button></div>';
h+='<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:10px">';
for(var i=0;i<DEPTS.length;i++)h+='<span style="font-size:.7em;padding:2px 7px;border-radius:10px;background:'+DEPTS[i].c+';color:#fff">'+DEPTS[i].n+'</span>';
h+='</div>';

// 주간 그리드
h+='<div style="display:grid;grid-template-columns:repeat(7,minmax(0,1fr));border:1px solid var(--bd);border-radius:var(--radius-sm);overflow:hidden">';
for(var i=0;i<7;i++){var dd=dates[i],iT=dd.toDateString()===ts,iW=i>=5;
h+='<div style="border-right:'+(i<6?'1px solid var(--bd)':'none')+';min-height:120px;display:flex;flex-direction:column">';
h+='<div style="text-align:center;padding:6px 2px;border-bottom:1px solid var(--bd);background:'+(iT?'var(--blue)':iW?'var(--bg3)':'var(--bg2)')+'"><div style="font-size:.7em;color:'+(iT?'#fff':iW?'var(--red)':'var(--tx2)')+'">'+dn[i]+'</div><div style="font-size:.85em;font-weight:600;color:'+(iT?'#fff':'var(--tx)')+'">'+dd.getDate()+'</div></div>';
h+='<div style="padding:3px;flex:1;background:var(--bg)">';
var dS=new Date(dd);dS.setHours(0,0,0,0);var dE=new Date(dd);dE.setHours(23,59,59);
var de=events.filter(function(e){return new Date(e.start)<=dE&&new Date(e.end)>=dS});
de.sort(function(a,b){if(a.ia&&!b.ia)return-1;if(!a.ia&&b.ia)return 1;return new Date(a.start)-new Date(b.start)});
if(!de.length)h+='<div style="font-size:.68em;color:var(--tx3);text-align:center;padding:10px 0">—</div>';
for(var j=0;j<de.length;j++){var e=de[j],tm='';
if(!e.ia){var st=new Date(e.start);tm=String(st.getHours()).padStart(2,'0')+':'+String(st.getMinutes()).padStart(2,'0')}
h+='<div style="padding:2px 4px;margin-bottom:2px;border-radius:3px;border-left:3px solid '+e.dc+';font-size:.68em" title="'+e.title+(e.loc?' — '+e.loc:'')+'">';
if(tm)h+='<span style="color:var(--tx3)">'+tm+' </span>';
h+='<span style="font-weight:500">'+ct(e.title)+'</span></div>'}
h+='</div></div>'}h+='</div>';

// 부서별 요약
h+='<div style="margin-top:12px"><div style="font-weight:600;font-size:.88em;margin-bottom:6px">부서별 ('+events.length+'건)</div>';
var bd={};for(var i=0;i<events.length;i++){var e=events[i];if(!bd[e.dn])bd[e.dn]=[];bd[e.dn].push(e)}
for(var i=0;i<DEPTS.length;i++){var d=DEPTS[i];if(!bd[d.n])continue;
h+='<div style="margin-bottom:6px"><span style="font-size:.78em;padding:1px 7px;border-radius:8px;background:'+d.c+';color:#fff;font-weight:600">'+d.n+' ('+bd[d.n].length+')</span><div style="margin-top:2px">';
for(var j=0;j<bd[d.n].length;j++){var e=bd[d.n][j];var ds=new Date(e.start);
h+='<div style="font-size:.8em;padding:1px 0"><span style="color:var(--tx3)">'+(ds.getMonth()+1)+'/'+ds.getDate()+'</span> '+ct(e.title)+'</div>'}
h+='</div></div>'}h+='</div></div>';
document.getElementById('pg').innerHTML=h}

function render(){if(!tc&&typeof google==='undefined')initGIS();else if(token)load();else{var sv=sessionStorage.getItem('gcal-t');if(sv){token=sv;load()}else rLogin()}}
return{render:render,login:function(){if(tc)tc.requestAccessToken();else{initGIS();setTimeout(function(){if(tc)tc.requestAccessToken()},1500)}},
lo:function(){token=null;sessionStorage.removeItem('gcal-t');rLogin()},
p:function(){weekOff--;load()},n:function(){weekOff++;load()},t:function(){weekOff=0;load()}};
})();
