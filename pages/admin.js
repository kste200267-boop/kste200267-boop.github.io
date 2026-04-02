// pages/admin.js ??愿由ъ옄 (?꾩껜)
var PageAdmin=(function(){
  var tab='accounts';
  function render(){
    var h='<div class="card"><div class="card-h">?숋툘 愿由ъ옄 ?ㅼ젙</div>';
    h+='<div class="chips" style="margin-bottom:14px">';
    var ts=[['accounts','Accounts'],['subjects','Subjects'],['timetable','Timetable'],['classEdit','Classes'],['afterBulk','After'],['notice','Notice'],['print','Print'],['periods','Periods'],['data','Data']];
    for(var i=0;i<ts.length;i++)h+='<span class="chip'+(tab===ts[i][0]?' on':'')+'" onclick="PageAdmin.tab(\''+ts[i][0]+'\')">'+ts[i][1]+'</span>';
    h+='</div><div id="ac"></div></div>';
    document.getElementById('pg').innerHTML=h;
    var fn={accounts:rAcc,subjects:rSubj,timetable:rTT,classEdit:rClassEdit,afterBulk:rAfterBulk,notice:rNotice,print:rPrint,periods:rPer,data:rDat};
    fn[tab]();
  }

  // ?? 怨꾩젙 ??
  function rAcc(){
    var acc=Auth.getAccounts(),names=Object.keys(acc).sort();
    var h='<h3 style="font-size:.92em;margin-bottom:8px">?뫀 怨꾩젙 ('+names.length+'紐?</h3>';
    h+='<div style="overflow-x:auto;max-height:350px;overflow-y:auto"><table class="a-table"><thead><tr><th>?대쫫</th><th>?꾩씠??/th><th>鍮꾨?踰덊샇</th><th>沅뚰븳</th><th></th></tr></thead><tbody>';
    for(var i=0;i<names.length;i++){var n=names[i],a=acc[n];
   h+='<tr><td>'+n+'</td><td><input id="ai'+i+'" value="'+a.id+'" data-k="'+n+'"></td><td><input id="ap'+i+'" value="" placeholder="蹂寃쎌떆?먮쭔 ?낅젰" data-k="'+n+'"></td>';
      h+='<td><select id="ar'+i+'" data-k="'+n+'"><option value="user"'+(a.role==='user'?' selected':'')+'>?쇰컲</option><option value="admin"'+(a.role==='admin'?' selected':'')+'>愿由ъ옄</option></select></td>';
      h+='<td><button class="a-btn danger sm" onclick="PageAdmin.delAcc(\''+n+'\')">??젣</button></td></tr>'}
    h+='</tbody></table></div>';
    h+='<button class="a-btn primary" style="margin-top:8px" onclick="PageAdmin.saveAcc('+names.length+')">?뮶 ???/button> <button class="a-btn outline" onclick="PageAdmin.resetAcc()">?봽 珥덇린??/button>';
    h+='<div style="margin-top:12px;padding:12px;background:var(--bg2);border-radius:6px"><div style="font-weight:600;font-size:.85em;margin-bottom:6px">???뚯썝 異붽?</div><div style="display:flex;gap:6px;flex-wrap:wrap"><input class="ti-input" id="nn" placeholder="?대쫫" style="max-width:100px"><input class="ti-input" id="ni" placeholder="?꾩씠?? style="max-width:100px"><input class="ti-input" id="np" placeholder="鍮꾨쾲" style="max-width:80px"><select class="ti-sel" id="nr"><option value="user">?쇰컲</option><option value="admin">愿由ъ옄</option></select><button class="a-btn success" onclick="PageAdmin.addAcc()">異붽?</button></div></div>';
    document.getElementById('ac').innerHTML=h;
  }  function saveAcc(c){
    var acc=Auth.getAccounts();
    for(var i=0;i<c;i++){
      var el=document.getElementById('ai'+i);
      if(!el)continue;
      var k=el.dataset.k;
      acc[k].id=el.value.trim()||k;
      acc[k].role=document.getElementById('ar'+i).value;
      var pw=document.getElementById('ap'+i).value||'';
      if(pw)acc[k].pw=pw;
    }
    Auth.saveAccounts(acc).then(function(){
      toast('Saved.');
      render();
    }).catch(function(error){
      console.error(error);
      toast('Account save failed.');
    });
  }
  function addAcc(){
    var n=document.getElementById('nn').value.trim();
    if(!n){toast('Enter a name.');return}
    var acc=Auth.getAccounts();
    if(acc[n]){toast('Account already exists.');return}
    acc[n]={id:document.getElementById('ni').value.trim()||n,pw:document.getElementById('np').value||'1234',role:document.getElementById('nr').value};
    if(!TD_A[n])TD_A[n]={h:0,s:new Array(32).fill(null)};
    if(!TD_B[n])TD_B[n]={h:0,s:new Array(32).fill(null)};
    Auth.saveAccounts(acc).then(function(){
      Engine.rebuild();
      toast('Account added.');
      render();
    }).catch(function(error){
      console.error(error);
      toast('Account add failed.');
    });
  }
  function delAcc(n){
    if(n===App.getUser()){toast('You cannot delete the signed-in account.');return}
    if(!confirm(n+' account delete?'))return;
    var acc=Auth.getAccounts();
    delete acc[n];
    Auth.saveAccounts(acc).then(function(){
      toast('Account removed.');
      render();
    }).catch(function(error){
      console.error(error);
      toast('Account delete failed.');
    });
  }
  function resetAcc(){
    if(!confirm('Reset accounts to default?'))return;
    Auth.resetAccounts().then(function(){
      toast('Accounts reset.');
      render();
    }).catch(function(error){
      console.error(error);
      toast('Account reset failed.');
    });
  }
  function rSubj(){
    var TS=Engine.TS(),names=Engine.names(),ov=Store.get('subj-ov',{});
    var h='<h3 style="font-size:.92em;margin-bottom:8px">?뱴 援먯궗蹂?怨쇰ぉ</h3>';
    h+='<div style="max-height:400px;overflow-y:auto"><table class="a-table"><thead><tr><th>?대쫫</th><th>?먮룞</th><th>?섏젙</th></tr></thead><tbody>';
    for(var i=0;i<names.length;i++){var n=names[i];h+='<tr><td>'+n+'</td><td style="color:var(--tx3)">'+TS[n]+'</td><td><input id="so'+i+'" value="'+(ov[n]||'')+'" placeholder="'+TS[n]+'" data-k="'+n+'" style="width:100px"></td></tr>'}
    h+='</tbody></table></div><button class="a-btn primary" style="margin-top:8px" onclick="PageAdmin.saveSubj('+names.length+')">?뮶 ???/button>';
    document.getElementById('ac').innerHTML=h;
  }
  function saveSubj(c){var ov={};for(var i=0;i<c;i++){var el=document.getElementById('so'+i);if(!el)continue;var v=el.value.trim();if(v)ov[el.dataset.k]=v}Store.set('subj-ov',ov);applySubjOv();toast('??λ맖')}

  // ?? ?쒓컙??(援먯궗蹂?吏곸젒 ?몄쭛) ??
  var ttSelTeacher=null;
  function rTT(){
    var names=Engine.names();
    if(!ttSelTeacher)ttSelTeacher=names[0];
    var h='<h3 style="font-size:.92em;margin-bottom:8px">?뱟 援먯궗 ?쒓컙???몄쭛</h3>';
    h+='<p style="color:var(--tx2);font-size:.82em;margin-bottom:10px">援먯궗瑜??좏깮?섍퀬 媛?移몄쓣 吏곸젒 ?섏젙?섏꽭?? ?뺤떇: <b>諛섎챸</b> (?? 1??, 2湲?) ?먮뒗 鍮덉뭏.</p>';

    // 援먯궗 ?좏깮
    h+='<div class="filter-row" style="margin-bottom:10px"><span class="filter-label">援먯궗:</span>';
    h+='<select class="ti-sel" id="ttTeacher" onchange="PageAdmin.selTTTeacher(this.value)" style="max-width:200px">';
    for(var i=0;i<names.length;i++){var n=names[i];
      h+='<option value="'+n+'"'+(n===ttSelTeacher?' selected':'')+'>'+n+' ('+Engine.TS()[n]+' 쨌 '+Engine.TD()[n].h+'h)</option>';}
    h+='</select></div>';

    // ?쒓컙????    var t=TD_A[ttSelTeacher];
    if(t){
      h+='<div style="overflow-x:auto"><table class="a-table" style="font-size:.82em"><thead><tr><th style="width:60px"></th>';
      for(var di=0;di<5;di++)h+='<th>'+DAYS[di]+'</th>';
      h+='</tr></thead><tbody>';
      var idx=0;
      for(var di=0;di<5;di++){
        for(var p=0;p<DP[DAYS[di]];p++){
          // ?쒕뒗 援먯떆(?? 횞 ?붿씪(?? 援ъ“
        }
      }
      // ??援먯떆, ???붿씪
      for(var p=0;p<7;p++){
        h+='<tr><th style="background:var(--bg2);font-weight:600">'+(p+1)+'援먯떆<br><span style="font-weight:400;font-size:.85em;color:var(--tx3)">'+PT[p].s+'</span></th>';
        for(var di=0;di<5;di++){
          var d=DAYS[di];
          if(p>=DP[d]){h+='<td style="background:var(--bg3);color:var(--tx3)">??/td>';continue}
          var si=Engine.si(d,p);
          var val=t.s[si]||'';
          // 怨쇰ぉ???쒖떆
          var subj='';
          if(val&&CS[val]&&CS[val][d])subj=CS[val][d][p]||'';
          h+='<td style="padding:2px"><input class="ti-input" style="padding:4px 6px;font-size:.82em;width:100%;text-align:center'+(val?';background:#e8f0fe':'')+'" value="'+val+'" data-teacher="'+ttSelTeacher+'" data-si="'+si+'" placeholder="??>';
          if(subj)h+='<div style="font-size:.7em;color:var(--tx3);text-align:center">'+subj+'</div>';
          h+='</td>';
        }
        h+='</tr>';
      }
      h+='</tbody></table></div>';
      h+='<div style="margin-top:10px;display:flex;gap:6px;flex-wrap:wrap">';
      h+='<button class="a-btn primary" onclick="PageAdmin.saveTT()">?뮶 ??援먯궗 ?쒓컙?????/button>';
      h+='<button class="a-btn outline" onclick="PageAdmin.resetTT()">?⑼툘 ?먮옒?濡?/button>';
      h+='</div>';
    }

    // CSV ?낅줈?쒕뒗 ?묎린濡??좎?
    h+='<details style="margin-top:16px"><summary style="font-size:.85em;color:var(--tx2);cursor:pointer">?뱤 CSV ?쇨큵 ?낅줈???ㅼ슫濡쒕뱶</summary>';
    h+='<div style="padding:10px;background:var(--bg2);border-radius:6px;margin-top:6px">';
    h+='<input type="file" id="csvF" accept=".csv" style="margin-bottom:6px"><br>';
    h+='<button class="a-btn primary sm" onclick="PageAdmin.upCSV()">?낅줈??/button> <button class="a-btn outline sm" onclick="PageAdmin.dlCSV()">?묒떇 ?ㅼ슫濡쒕뱶</button>';
    h+='</div></details>';

    document.getElementById('ac').innerHTML=h;
  }
  function selTTTeacher(name){ttSelTeacher=name;rTT()}
  function saveTT(){
    var inputs=document.querySelectorAll('[data-teacher][data-si]');
    var teacher=ttSelTeacher;
    if(!TD_A[teacher])return;
    for(var i=0;i<inputs.length;i++){
      if(inputs[i].dataset.teacher!==teacher)continue;
      var si=parseInt(inputs[i].dataset.si);
      var val=inputs[i].value.trim();
      TD_A[teacher].s[si]=val||null;
    }
    // ?쒖닔 ?먮룞 怨꾩궛
    var cnt=0;for(var j=0;j<TD_A[teacher].s.length;j++){if(TD_A[teacher].s[j])cnt++}
    TD_A[teacher].h=cnt;
    // Firebase?????    Store.set('td-custom-'+teacher,{h:cnt,s:TD_A[teacher].s});
    Engine.rebuild();
    toast(teacher+' ?쒓컙????λ맖 ('+cnt+'?쒖닔)');
    rTT();
  }
  function resetTT(){
    if(!confirm(ttSelTeacher+' ?쒓컙?쒕? ?먮낯?쇰줈 ?섎룎由닿퉴??'))return;
    Store.remove('td-custom-'+ttSelTeacher);
    toast('Reload the page to restore the default timetable.');
  }
  function upCSV(){var f=document.getElementById('csvF');if(!f.files.length){toast('?뚯씪 ?좏깮');return}var r=new FileReader();r.onload=function(e){try{var lines=e.target.result.split('\n'),cnt=0;for(var i=1;i<lines.length;i++){var c=lines[i].split(',');if(c.length<34)continue;var name=c[0].trim(),hours=parseInt(c[1])||0,sched=[];for(var j=2;j<34;j++){var v=c[j]?c[j].trim():'';sched.push(v&&v!=='-'&&v!=='null'?v:null)}if(name){TD_A[name]={h:hours,s:sched};var acc=Auth.getAccounts();if(!acc[name]){acc[name]={id:name,pw:'1234',role:'user'};Auth.saveAccounts(acc)}cnt++}}Engine.rebuild();toast(cnt+'紐??꾨즺');render()}catch(err){toast('?ㅻ쪟')}};r.readAsText(f.files[0],'UTF-8')}
  function dlCSV(){var hd='援먯궗紐??쒖닔,??,??,??,??,??,??,??,??,??,??,??,??,??,??,??,??,??,??,??,??,紐?,紐?,紐?,紐?,紐?,紐?,湲?,湲?,湲?,湲?,湲?,湲?\n',bd='';var names=Object.keys(TD_A).sort();for(var i=0;i<names.length;i++){var n=names[i],t=TD_A[n];bd+=n+','+t.h;for(var j=0;j<t.s.length;j++)bd+=','+(t.s[j]||'');bd+='\n'}var blob=new Blob(['\uFEFF'+hd+bd],{type:'text/csv;charset=utf-8'});var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='?쒓컙???묒떇.csv';a.click();toast('?ㅼ슫濡쒕뱶')}

  // ?? ?숆툒 ?쒓컙???섏젙 ??
  function rClassEdit(){
    var classes=Object.keys(CS).sort();
    var selCls=Store.get('admin-sel-class',classes[0]||'1??');
    var h='<h3 style="font-size:.92em;margin-bottom:8px">?룶 ?숆툒 ?쒓컙???섏젙 (怨?)</h3>';
    h+='<div class="filter-row"><span class="filter-label">諛?</span><select class="ti-sel" id="ceClass" onchange="Store.set(\'admin-sel-class\',this.value);PageAdmin.tab(\'classEdit\')">';
    for(var i=0;i<classes.length;i++)h+='<option value="'+classes[i]+'"'+(classes[i]===selCls?' selected':'')+'>'+classes[i]+'</option>';
    h+='</select></div>';
    if(CS[selCls]){
      h+='<div style="overflow-x:auto"><table class="a-table"><thead><tr><th></th>';
      for(var di=0;di<5;di++)h+='<th>'+DAYS[di]+'</th>';
      h+='</tr></thead><tbody>';
      for(var p=0;p<7;p++){
        h+='<tr><th>'+(p+1)+'援먯떆</th>';
        for(var di=0;di<5;di++){var d=DAYS[di];
          var val=(p<DP[d]&&CS[selCls][d])?CS[selCls][d][p]||'':'';
          if(p>=DP[d])h+='<td style="background:var(--bg2)">??/td>';
          else h+='<td><input class="ti-input" style="padding:3px 5px;font-size:.82em" value="'+val+'" data-cls="'+selCls+'" data-day="'+d+'" data-p="'+p+'"></td></tr>';
        }h+='</tr>';
      }
      h+='</tbody></table></div>';
      h+='<button class="a-btn primary" style="margin-top:8px" onclick="PageAdmin.saveClass()">?뮶 ???/button>';
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
    Store.set('class-edits',CS);Engine.rebuild();toast('?숆툒 ?쒓컙????λ맖');
  }

  // ?? 諛⑷낵???쇨큵 ??
  function rAfterBulk(){
    var names=Engine.names().filter(function(n){return Engine.TD()[n].h>0});
    var h='<h3 style="font-size:.92em;margin-bottom:8px">?뙔 諛⑷낵???쇨큵 愿由?/h3>';
    h+='<p style="color:var(--tx2);font-size:.82em;margin-bottom:10px">援먯궗蹂?諛⑷낵???꾪솴???뺤씤?섍퀬 ?쇨큵 ?깅줉?⑸땲??</p>';
    h+='<div style="max-height:400px;overflow-y:auto"><table class="a-table"><thead><tr><th>援먯궗</th><th>怨쇰ぉ</th><th>諛⑷낵???꾪솴</th><th></th></tr></thead><tbody>';
    for(var i=0;i<names.length;i++){var n=names[i];
      var after=Store.get('after-'+n,[]);
      var active=after.filter(function(a){if(!a.from&&!a.to)return true;var now=new Date().toISOString().slice(0,10);return(!a.from||now>=a.from)&&(!a.to||now<=a.to)});
      var summary=active.map(function(a){var s=a.day;if(a.p8)s+='(8:'+a.p8+')';if(a.p9)s+='(9:'+a.p9+')';return s}).join(', ');
      h+='<tr><td>'+n+'</td><td>'+Engine.TS()[n]+'</td><td style="font-size:.8em">'+(summary||'<span style="color:var(--tx3)">?놁쓬</span>')+'</td>';
      h+='<td><button class="a-btn outline sm" onclick="PageAdmin.editAfterFor(\''+n+'\')">?몄쭛</button></td></tr>';
    }
    h+='</tbody></table></div>';

    // ?쇨큵 ?깅줉
    h+='<div style="margin-top:14px;padding:12px;background:var(--bg2);border-radius:6px">';
    h+='<div style="font-weight:600;font-size:.88em;margin-bottom:8px">?쇨큵 ?깅줉</div>';
    h+='<div style="display:flex;gap:6px;flex-wrap:wrap;align-items:flex-end">';
    h+='<div><div style="font-size:.78em;color:var(--tx2)">援먯궗</div><select class="ti-sel" id="abTeacher">';
    for(var i=0;i<names.length;i++)h+='<option>'+names[i]+'</option>';
    h+='</select></div>';
    h+='<div><div style="font-size:.78em;color:var(--tx2)">?붿씪</div><select class="ti-sel" id="abDay"><option>??/option><option>??/option><option>??/option><option>紐?/option><option>湲?/option></select></div>';
    h+='<div><div style="font-size:.78em;color:var(--tx2)">8援먯떆</div><input class="ti-input" id="abP8" placeholder="諛섎챸" style="width:70px"></div>';
    h+='<div><div style="font-size:.78em;color:var(--tx2)">9援먯떆</div><input class="ti-input" id="abP9" placeholder="諛섎챸" style="width:70px"></div>';
    h+='<div><div style="font-size:.78em;color:var(--tx2)">?쒖옉</div><input class="ti-input" id="abFrom" type="date" style="width:120px"></div>';
    h+='<div><div style="font-size:.78em;color:var(--tx2)">醫낅즺</div><input class="ti-input" id="abTo" type="date" style="width:120px"></div>';
    h+='<button class="a-btn primary" onclick="PageAdmin.addAfterBulk()">異붽?</button>';
    h+='</div></div>';
    document.getElementById('ac').innerHTML=h;
  }
  function editAfterFor(name){
    var data=Store.get('after-'+name,[]);
    var msg=name+' 諛⑷낵???꾪솴:\n';
    for(var i=0;i<data.length;i++){var a=data[i];msg+=a.day+(a.p8?' 8:'+a.p8:'')+(a.p9?' 9:'+a.p9:'')+' ('+( a.from||'~')+' ~ '+(a.to||'~')+')\n'}
    msg+='\n?꾨? ??젣?섎젮硫?"??젣" ?낅젰:';
    var r=prompt(msg);
    if(r==='??젣'){Store.set('after-'+name,[]);toast(name+' 諛⑷낵????젣');render()}
  }
  function addAfterBulk(){
    var name=document.getElementById('abTeacher').value;
    var day=document.getElementById('abDay').value;
    var p8=document.getElementById('abP8').value.trim();
    var p9=document.getElementById('abP9').value.trim();
    var from=document.getElementById('abFrom').value;
    var to=document.getElementById('abTo').value;
    if(!p8&&!p9){toast('8 or 9援먯떆 ?낅젰');return}
    var data=Store.get('after-'+name,[]);
    data.push({day:day,p8:p8,p9:p9,from:from,to:to});
    Store.set('after-'+name,data);toast(name+' '+day+' 諛⑷낵??異붽?');render();
  }

  // ?? 怨듭??ы빆 ??
  function rNotice(){
    var notices=Store.get('notices',[]);
    var h='<h3 style="font-size:.92em;margin-bottom:8px">?뱼 怨듭??ы빆 寃뚯떆??/h3>';
    h+='<div style="margin-bottom:12px">';
    if(!notices.length)h+='<div style="color:var(--tx3);font-size:.85em;padding:8px">怨듭? ?놁쓬</div>';
    for(var i=0;i<notices.length;i++){var n=notices[i];
      h+='<div style="padding:10px;border:1px solid var(--bd);border-radius:6px;margin-bottom:6px">';
      h+='<div style="display:flex;justify-content:space-between;align-items:center">';
      h+='<div style="font-weight:600;font-size:.9em">'+n.title+'</div>';
      h+='<div style="display:flex;gap:4px;align-items:center"><span style="font-size:.75em;color:var(--tx3)">'+n.date+'</span>';
      h+='<button class="a-btn danger sm" onclick="PageAdmin.delNotice('+i+')">??젣</button></div></div>';
      h+='<div style="font-size:.85em;margin-top:4px;white-space:pre-wrap;color:var(--tx2)">'+n.content+'</div></div>';
    }
    h+='</div>';
    h+='<div style="padding:12px;background:var(--bg2);border-radius:6px">';
    h+='<input class="ti-input" id="ntTitle" placeholder="?쒕ぉ" style="margin-bottom:6px">';
    h+='<textarea class="ti-input" id="ntContent" placeholder="?댁슜" style="min-height:80px;resize:vertical;margin-bottom:6px"></textarea>';
    h+='<button class="a-btn primary" onclick="PageAdmin.addNotice()">?뱼 寃뚯떆</button></div>';
    document.getElementById('ac').innerHTML=h;
  }
  function addNotice(){
    var title=document.getElementById('ntTitle').value.trim();
    var content=document.getElementById('ntContent').value.trim();
    if(!title){toast('?쒕ぉ ?낅젰');return}
    var notices=Store.get('notices',[]);
    notices.unshift({title:title,content:content,date:new Date().toISOString().slice(0,10),by:App.getUser()});
    Store.set('notices',notices);toast('Notice saved.');render();
  }
  function delNotice(i){var n=Store.get('notices',[]);n.splice(i,1);Store.set('notices',n);toast('??젣');render()}

  // ?? ?몄뇙 PDF ??
  function rPrint(){
    var h='<h3 style="font-size:.92em;margin-bottom:8px">?뼥截??몄뇙???쒓컙??/h3>';
    h+='<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px">';
    h+='<select class="ti-sel" id="prTarget">';
    h+='<option value="my">???쒓컙??/option>';
    var names=Engine.names();for(var i=0;i<names.length;i++)h+='<option value="t:'+names[i]+'">'+names[i]+' ('+Engine.TS()[names[i]]+')</option>';
    var cls=Object.keys(CS).sort();for(var i=0;i<cls.length;i++)h+='<option value="c:'+cls[i]+'">'+cls[i]+' (?숆툒)</option>';
    h+='</select>';
    h+='<button class="a-btn primary" onclick="PageAdmin.doPrint()">?뼥截??몄뇙/PDF ???/button></div>';
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
    h+='<h2 style="text-align:center;margin-bottom:16px">寃쎈턿湲곌퀎湲덉냽怨좊벑?숆탳 ??'+(isClass?name+' ?숆툒':name+' ('+Engine.TS()[name]+')')+' ?쒓컙??/h2>';
    h+='<table style="width:100%;border-collapse:collapse;font-size:13px"><thead><tr><th style="border:1px solid #000;padding:8px;background:#e8e8e8"></th>';
    for(var di=0;di<5;di++)h+='<th style="border:1px solid #000;padding:8px;background:#e8e8e8">'+DAYS[di]+'</th>';
    h+='</tr></thead><tbody>';
    var TD=Engine.TD(),CTM=Engine.CTM();
    for(var p=0;p<7;p++){
      h+='<tr><th style="border:1px solid #000;padding:8px;background:#f5f5f5">'+(p+1)+'援먯떆<br>'+PT[p].s+'~'+PT[p].e+'</th>';
      for(var di=0;di<5;di++){var d=DAYS[di];
        if(p>=DP[d]){h+='<td style="border:1px solid #000;padding:8px;color:#999">-</td>';continue}
        if(isClass){
          var key=name+'|'+d+'|'+p,t=CTM[key]||'',sj='';
          if(CS[name])sj=CS[name][d][p]||'';
          h+='<td style="border:1px solid #000;padding:8px">'+(t?'<b>'+t+'</b><br><span style="font-size:11px;color:#666">'+sj+'</span>':(sj||'-'))+'</td>';
        }else{
          var cl=Engine.slot(name,d,p),sj='';
          if(cl&&CS[cl])sj=CS[cl][d][p]||'';else if(cl)sj=cl;
          h+='<td style="border:1px solid #000;padding:8px">'+(cl?(cl+'<br><span style="font-size:11px;color:#666">'+sj+'</span>'):'-')+'</td>';
        }
      }h+='</tr>';
    }
    h+='</tbody></table>';
    h+='<div style="text-align:right;margin-top:12px;font-size:11px;color:#999">異쒕젰?? '+new Date().toLocaleDateString('ko-KR')+'</div>';
    h+='</div>';
    h+='<button class="a-btn primary" style="margin-top:8px" onclick="var w=window.open(\'\');w.document.write(document.getElementById(\'printArea\').outerHTML);w.document.close();w.print()">?뼥截??몄뇙?섍린</button>';
    document.getElementById('printPreview').innerHTML=h;
  }

  // ?? 援먯떆 ??
  function rPer(){
    var h='<h3 style="font-size:.92em;margin-bottom:8px">?븧 援먯떆 ?쒓컙</h3><table class="a-table"><thead><tr><th>援먯떆</th><th>?쒖옉</th><th>醫낅즺</th></tr></thead><tbody>';
    for(var i=0;i<PT.length;i++)h+='<tr><td>'+(i+1)+'援먯떆</td><td><input type="time" id="ps'+i+'" value="'+PT[i].s+'"></td><td><input type="time" id="pe'+i+'" value="'+PT[i].e+'"></td></tr>';
    h+='</tbody></table><button class="a-btn primary" style="margin-top:8px" onclick="PageAdmin.savePT()">?뮶 ???/button>';
    document.getElementById('ac').innerHTML=h;
  }
  function savePT(){for(var i=0;i<PT.length;i++){PT[i].s=document.getElementById('ps'+i).value;PT[i].e=document.getElementById('pe'+i).value}Store.set('pt',PT);toast('??λ맖')}

  // ?? ?곗씠????
  function rDat(){
    var total=0;for(var i=0;i<localStorage.length;i++){var k=localStorage.key(i);if(k&&k.indexOf('gm-')===0)total+=localStorage.getItem(k).length}
    var h='<h3 style="font-size:.92em;margin-bottom:8px">?뮶 ?곗씠??/h3><div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px">';
    h+='<button class="a-btn success" onclick="PageAdmin.exp()">?뱿 諛깆뾽</button><button class="a-btn outline" onclick="document.getElementById(\'impF\').click()">?뱾 蹂듭썝</button>';
    h+='<input type="file" id="impF" accept=".json" style="display:none" onchange="PageAdmin.imp(event)">';
    h+='<button class="a-btn danger" onclick="PageAdmin.clr()">?뿊截?珥덇린??/button></div>';
    h+='<div style="padding:8px;background:var(--bg2);border-radius:6px;font-size:.85em">?뮸 '+( total/1024).toFixed(1)+' KB</div>';
    document.getElementById('ac').innerHTML=h;
  }
  function exp(){var d=Store.exportAll();d.subjOv=Store.get('subj-ov',{});d.notices=Store.get('notices',[]);d.classEdits=Store.get('class-edits',null);var blob=new Blob([JSON.stringify(d,null,2)],{type:'application/json'});var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='portal-backup-'+new Date().toISOString().slice(0,10)+'.json';a.click()}
  function imp(e){var f=e.target.files[0];if(!f)return;var r=new FileReader();r.onload=function(ev){try{var d=JSON.parse(ev.target.result);Store.importAll(d);if(d.subjOv)Store.set('subj-ov',d.subjOv);if(d.notices)Store.set('notices',d.notices);if(d.classEdits){Store.set('class-edits',d.classEdits);for(var k in d.classEdits)CS[k]=d.classEdits[k]}Engine.rebuild();toast('蹂듭썝');render()}catch(err){toast('?ㅻ쪟')}};r.readAsText(f)}
  function clr(){if(!confirm('?꾩껜 ??젣?'))return;var ks=[];for(var i=0;i<localStorage.length;i++){var k=localStorage.key(i);if(k&&k.indexOf('gm-')===0)ks.push(k)}ks.forEach(function(k){localStorage.removeItem(k)});location.reload()}

  return{render:render,tab:function(t){tab=t;render()},saveAcc:saveAcc,addAcc:addAcc,delAcc:delAcc,resetAcc:resetAcc,saveSubj:saveSubj,upCSV:upCSV,dlCSV:dlCSV,
    selTTTeacher:selTTTeacher,saveTT:saveTT,resetTT:resetTT,
    saveClass:saveClass,editAfterFor:editAfterFor,addAfterBulk:addAfterBulk,addNotice:addNotice,delNotice:delNotice,doPrint:doPrint,savePT:savePT,exp:exp,imp:imp,clr:clr};
})();
// 怨쇰ぉ ?ㅻ쾭?쇱씠?쒕뒗 Engine.rebuild() ?대??먯꽌 泥섎━??
