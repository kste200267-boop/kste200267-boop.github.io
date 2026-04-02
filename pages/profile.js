// pages/profile.js
var PageProfile = (function(){
  function escapeHtml(value){
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function getTeacherState(user){
    var td = Engine.TD();
    var base = td[user];
    if(base) return base;
    return { h: 0, s: new Array(32).fill(null) };
  }

  function getEditableState(user){
    var editable = TD_A[user] || TD_B[user];
    if(!editable){
      editable = { h: 0, s: new Array(32).fill(null) };
      TD_A[user] = editable;
      if(!TD_B[user]) TD_B[user] = { h: 0, s: new Array(32).fill(null) };
    }
    return editable;
  }

  function getAfterData(user){
    return Store.get('after-' + user, []);
  }

  function setAfterData(user, rows){
    Store.set('after-' + user, rows);
  }

  function updateTopSummary(user){
    var top = document.getElementById('tSub');
    if(!top) return;
    var ts = Engine.TS();
    var td = Engine.TD();
    var hour = td[user] && td[user].h ? td[user].h : 0;
    top.textContent = ts[user] + (hour ? (' \ucd1d ' + hour + '\uc2dc\uac04') : '');
  }

  function finishProfileSave(user, accounts){
    return Auth.saveAccounts(accounts).then(function(){
      Engine.rebuild();
      updateTopSummary(user);
      toast('\uc800\uc7a5\ub418\uc5c8\uc2b5\ub2c8\ub2e4.');
      render();
    }).catch(function(error){
      console.error(error);
      toast('\ud504\ub85c\ud544 \uc800\uc7a5 \uc911 \uc624\ub958\uac00 \ubc1c\uc0dd\ud588\uc2b5\ub2c8\ub2e4.');
    });
  }

  function renderSummaryCard(user, myAcc, teacherState, subjectName, classNames, afterCount){
    var roleLabel = myAcc.role === 'admin' ? '\uad00\ub9ac\uc790' : '\uad50\uc6d0';
    var classesText = classNames.length ? classNames.join(', ') : '\ubbf8\uc9c0\uc815';
    var html = '';
    html += '<div class="card">';
    html += '<div class="card-h">\ub0b4 \uc815\ubcf4</div>';
    html += '<div style="display:flex;gap:16px;flex-wrap:wrap;font-size:.9em">';
    html += '<div><span style="color:var(--tx2)">\uacc4\uc815:</span> <b>' + escapeHtml(user) + '</b></div>';
    html += '<div><span style="color:var(--tx2)">\uacfc\ubaa9:</span> <b>' + escapeHtml(subjectName || '\ubbf8\uc785\ub825') + '</b></div>';
    html += '<div><span style="color:var(--tx2)">\uc2dc\uc218:</span> <b>' + teacherState.h + 'h</b></div>';
    if(afterCount){
      html += '<div><span style="color:var(--teal)">\ubc29\uacfc\ud6c4:</span> <b>' + afterCount + 'h</b></div>';
    }
    html += '<div><span style="color:var(--tx2)">\uad8c\ud55c:</span> ' + roleLabel + '</div>';
    html += '<div><span style="color:var(--tx2)">\ub2f4\ub2f9 \ubc18:</span> <span style="font-size:.85em">' + escapeHtml(classesText) + '</span></div>';
    html += '</div></div>';
    return html;
  }

  function renderProfileCard(user, myAcc, mySubject, autoSubject){
    var html = '';
    html += '<div class="card">';
    html += '<div class="card-h">\uae30\ubcf8 \uc815\ubcf4 \uc218\uc815</div>';
    html += '<p style="color:var(--tx2);font-size:.82em;margin-bottom:8px">';
    html += '\uacfc\ubaa9\uba85, \uc544\uc774\ub514, \ube44\ubc00\ubc88\ud638\ub97c \ud55c \uacf3\uc5d0\uc11c \uad00\ub9ac\ud569\ub2c8\ub2e4.';
    html += '</p>';
    html += '<div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:10px">';
    html += '<div style="flex:1;min-width:140px">';
    html += '<div style="font-size:.78em;color:var(--tx2);margin-bottom:2px">\ub0b4 \uacfc\ubaa9</div>';
    html += '<input class="ti-input" id="prSubj" value="' + escapeHtml(mySubject) + '" placeholder="' + escapeHtml(autoSubject || '\ube48 \uce78\uc774\uba74 \uc790\ub3d9 \uacfc\ubaa9\uc744 \uc0ac\uc6a9\ud569\ub2c8\ub2e4.') + '">';
    html += '</div>';
    html += '<div style="flex:1;min-width:140px">';
    html += '<div style="font-size:.78em;color:var(--tx2);margin-bottom:2px">\ub85c\uadf8\uc778 \uc544\uc774\ub514</div>';
    html += '<input class="ti-input" id="prId" value="' + escapeHtml(myAcc.id || user) + '">';
    html += '</div>';
    html += '</div>';
    html += '<div style="font-size:.78em;color:var(--tx2);margin-bottom:2px">\ube44\ubc00\ubc88\ud638 \ubcc0\uacbd (\ubcc0\uacbd \uc2dc\uc5d0\ub9cc \uc785\ub825)</div>';
    html += '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px">';
    html += '<input class="ti-input" id="prPwCur" type="password" placeholder="\ud604\uc7ac \ube44\ubc00\ubc88\ud638" style="max-width:150px">';
    html += '<input class="ti-input" id="prPwNew" type="password" placeholder="\uc0c8 \ube44\ubc00\ubc88\ud638" style="max-width:150px">';
    html += '<input class="ti-input" id="prPwNew2" type="password" placeholder="\uc0c8 \ube44\ubc00\ubc88\ud638 \ud655\uc778" style="max-width:150px">';
    html += '</div>';
    html += '<button class="a-btn primary" onclick="PageProfile.saveInfo()">\uae30\ubcf8 \uc815\ubcf4 \uc800\uc7a5</button>';
    html += '</div>';
    return html;
  }

  function renderTimetableCard(user){
    var editable = getEditableState(user);
    var mySubjs = Store.get('tt-subj-' + user, {});
    var html = '';
    html += '<div class="card">';
    html += '<div class="card-h">\uc2dc\uac04\ud45c \uc9c1\uc811 \uc785\ub825</div>';
    html += '<p style="color:var(--tx2);font-size:.82em;margin-bottom:8px">';
    html += '\uac01 \uce78\uc5d0 \ubc18\uc744 \uc4f0\uace0, \uc544\ub798 \uce78\uc5d0 \uacfc\ubaa9\uc744 \uc785\ub825\ud558\uba74 \ud574\ub2f9 \uad50\uc0ac \uc2dc\uac04\ud45c\uc5d0 \ubc18\uc601\ub429\ub2c8\ub2e4.';
    html += '</p>';
    html += '<div style="overflow-x:auto"><table class="a-table" style="font-size:.82em"><thead><tr><th></th>';
    for(var di = 0; di < 5; di += 1){
      html += '<th>' + escapeHtml(DAYS[di]) + '</th>';
    }
    html += '</tr></thead><tbody>';
    for(var p = 0; p < 7; p += 1){
      html += '<tr>';
      html += '<th style="background:var(--bg2);font-size:.82em">' + (p + 1) + '\uad50\uc2dc<br><span style="font-weight:400;color:var(--tx3)">' + escapeHtml(PT[p].s) + '</span></th>';
      for(var dayIndex = 0; dayIndex < 5; dayIndex += 1){
        var day = DAYS[dayIndex];
        if(p >= DP[day]){
          html += '<td style="background:var(--bg3)">-</td>';
          continue;
        }
        var slotIndex = Engine.si(day, p);
        var classValue = editable.s[slotIndex] || '';
        var autoSubject = '';
        if(classValue && CS[classValue] && CS[classValue][day]){
          autoSubject = CS[classValue][day][p] || '';
        }
        var customSubject = mySubjs[String(slotIndex)] || '';
        html += '<td style="padding:2px">';
        html += '<input class="ti-input" style="padding:2px 4px;font-size:.82em;text-align:center;margin-bottom:1px' + (classValue ? ';background:#e8f0fe' : '') + '" value="' + escapeHtml(classValue) + '" data-si="' + slotIndex + '" data-type="cls" placeholder="\ubc18">';
        html += '<input class="ti-input" style="padding:2px 4px;font-size:.75em;text-align:center;color:var(--blue)" value="' + escapeHtml(customSubject || autoSubject) + '" data-si="' + slotIndex + '" data-type="subj" placeholder="\uacfc\ubaa9">';
        html += '</td>';
      }
      html += '</tr>';
    }
    html += '</tbody></table></div>';
    html += '<div style="margin-top:8px;display:flex;gap:6px">';
    html += '<button class="a-btn primary" onclick="PageProfile.saveTT()">\uc2dc\uac04\ud45c \uc800\uc7a5</button>';
    html += '<button class="a-btn outline" onclick="PageProfile.resetTT()">\ucd08\uae30\ud654</button>';
    html += '</div>';
    html += '</div>';
    return html;
  }

  function renderAfterCard(user){
    var after = getAfterData(user);
    var today = new Date().toISOString().slice(0, 10);
    var html = '';
    html += '<div class="card">';
    html += '<div class="card-h">\ubc29\uacfc\ud6c4 \uc218\uc5c5</div>';
    html += '<p style="color:var(--tx2);font-size:.82em;margin-bottom:8px">';
    html += '\uc694\uc77c, \uad50\uc2dc, \uc6b4\uc601 \uae30\uac04\uc744 \uae30\ub85d\ud574 \ub450\uba74 \uc5c5\ubb34 \uc778\uc218\uc778\uacc4\uc5d0\ub3c4 \ub3c4\uc6c0\uc774 \ub429\ub2c8\ub2e4.';
    html += '</p>';
    if(after.length){
      for(var i = 0; i < after.length; i += 1){
        var row = after[i] || {};
        var expired = false;
        if(row.from && today < row.from) expired = true;
        if(row.to && today > row.to) expired = true;
        html += '<div style="display:flex;align-items:center;gap:6px;padding:6px;border:1px solid var(--bd);border-radius:6px;margin-bottom:4px;font-size:.85em;opacity:' + (expired ? 0.45 : 1) + '">';
        html += '<b>' + escapeHtml(row.day || '-') + '</b>';
        if(row.p8) html += ' 8\uad50\uc2dc:' + escapeHtml(row.p8);
        if(row.p9) html += ' 9\uad50\uc2dc:' + escapeHtml(row.p9);
        html += '<span style="color:var(--tx3);font-size:.82em;margin-left:auto">' + escapeHtml(row.from || '~') + ' ~ ' + escapeHtml(row.to || '~') + (expired ? ' (\ub9cc\ub8cc)' : '') + '</span>';
        html += '<button class="a-btn danger sm" onclick="PageProfile.delAfter(' + i + ')">\uc0ad\uc81c</button>';
        html += '</div>';
      }
    }else{
      html += '<div style="color:var(--tx3);font-size:.85em;margin-bottom:8px">\ub4f1\ub85d\ub41c \ubc29\uacfc\ud6c4\uac00 \uc5c6\uc2b5\ub2c8\ub2e4.</div>';
    }

    html += '<div style="display:flex;gap:6px;flex-wrap:wrap;align-items:flex-end;margin-top:8px">';
    html += '<div><div style="font-size:.72em;color:var(--tx2)">\uc694\uc77c</div><select class="ti-sel" id="afDay"><option>\uc6d4</option><option>\ud654</option><option>\uc218</option><option>\ubaa9</option><option>\uae08</option></select></div>';
    html += '<div><div style="font-size:.72em;color:var(--tx2)">8\uad50\uc2dc</div><input class="ti-input" id="afP8" placeholder="\ubc18\uba85" style="width:90px"></div>';
    html += '<div><div style="font-size:.72em;color:var(--tx2)">9\uad50\uc2dc</div><input class="ti-input" id="afP9" placeholder="\ubc18\uba85" style="width:90px"></div>';
    html += '<div><div style="font-size:.72em;color:var(--tx2)">\uc2dc\uc791\uc77c</div><input class="ti-input" id="afFrom" type="date" style="width:140px"></div>';
    html += '<div><div style="font-size:.72em;color:var(--tx2)">\uc885\ub8cc\uc77c</div><input class="ti-input" id="afTo" type="date" style="width:140px"></div>';
    html += '<button class="a-btn success" onclick="PageProfile.addAfter()">\ubc29\uacfc\ud6c4 \ucd94\uac00</button>';
    html += '</div></div>';
    return html;
  }

  function render(){
    var user = App.getUser();
    var accounts = Auth.getAccounts();
    var myAcc = accounts[user] || { id: user, role: 'user' };
    var ts = Engine.TS();
    var subjectOverrides = Store.get('subj-ov', {});
    var mySubject = subjectOverrides[user] || '';
    var autoSubject = ts[user] || '';
    var teacherState = getTeacherState(user);

    var classMap = {};
    if(teacherState && Array.isArray(teacherState.s)){
      for(var i = 0; i < teacherState.s.length; i += 1){
        var className = teacherState.s[i];
        if(className && className !== '\ub3d9\uc544\ub9ac'){
          classMap[className] = 1;
        }
      }
    }
    var classNames = Object.keys(classMap);

    var after = getAfterData(user);
    var activeAfter = after.filter(function(item){
      if(!item.from && !item.to) return true;
      var today = new Date().toISOString().slice(0, 10);
      return (!item.from || today >= item.from) && (!item.to || today <= item.to);
    });
    var afterCount = 0;
    for(var j = 0; j < activeAfter.length; j += 1){
      if(activeAfter[j].p8) afterCount += 1;
      if(activeAfter[j].p9) afterCount += 1;
    }

    var html = '';
    html += renderSummaryCard(user, myAcc, teacherState, mySubject || autoSubject, classNames, afterCount);
    html += renderProfileCard(user, myAcc, mySubject, autoSubject);
    html += renderTimetableCard(user);
    html += renderAfterCard(user);

    document.getElementById('pg').innerHTML = html;
  }

  function saveInfo(){
    var user = App.getUser();
    var accounts = Auth.getAccounts();
    if(!accounts[user]) return;

    var subjectValue = document.getElementById('prSubj').value.trim();
    var subjectOverrides = Store.get('subj-ov', {});
    if(subjectValue){
      subjectOverrides[user] = subjectValue;
    }else{
      delete subjectOverrides[user];
    }
    Store.set('subj-ov', subjectOverrides);

    var newId = document.getElementById('prId').value.trim();
    if(newId) accounts[user].id = newId;

    var currentPassword = document.getElementById('prPwCur').value;
    var newPassword = document.getElementById('prPwNew').value;
    var newPassword2 = document.getElementById('prPwNew2').value;

    if(currentPassword || newPassword || newPassword2){
      if(!currentPassword){
        toast('\ud604\uc7ac \ube44\ubc00\ubc88\ud638\ub97c \uc785\ub825\ud574 \uc8fc\uc138\uc694.');
        return;
      }
      if(!newPassword){
        toast('\uc0c8 \ube44\ubc00\ubc88\ud638\ub97c \uc785\ub825\ud574 \uc8fc\uc138\uc694.');
        return;
      }
      if(newPassword !== newPassword2){
        toast('\uc0c8 \ube44\ubc00\ubc88\ud638\uac00 \uc77c\uce58\ud558\uc9c0 \uc54a\uc2b5\ub2c8\ub2e4.');
        return;
      }
      Auth.verifyUserPassword(user, currentPassword).then(function(ok){
        if(!ok){
          toast('\ud604\uc7ac \ube44\ubc00\ubc88\ud638\uac00 \uc62c\ubc14\ub974\uc9c0 \uc54a\uc2b5\ub2c8\ub2e4.');
          return;
        }
        accounts[user].pw = newPassword;
        finishProfileSave(user, accounts);
      }).catch(function(error){
        console.error(error);
        toast('\ube44\ubc00\ubc88\ud638 \ud655\uc778\uc5d0 \uc2e4\ud328\ud588\uc2b5\ub2c8\ub2e4.');
      });
      return;
    }

    finishProfileSave(user, accounts);
  }

  function saveTT(){
    var user = App.getUser();
    var editable = getEditableState(user);
    var classInputs = document.querySelectorAll('[data-si][data-type="cls"]');
    var subjectInputs = document.querySelectorAll('[data-si][data-type="subj"]');

    for(var i = 0; i < classInputs.length; i += 1){
      var slotIndex = parseInt(classInputs[i].dataset.si, 10);
      editable.s[slotIndex] = classInputs[i].value.trim() || null;
    }

    var mySubjects = {};
    for(var j = 0; j < subjectInputs.length; j += 1){
      var subjectIndex = subjectInputs[j].dataset.si;
      var subjectValue = subjectInputs[j].value.trim();
      if(subjectValue){
        mySubjects[subjectIndex] = subjectValue;
      }
    }
    Store.set('tt-subj-' + user, mySubjects);

    var count = 0;
    for(var k = 0; k < editable.s.length; k += 1){
      if(editable.s[k]) count += 1;
    }
    editable.h = count;
    TD_A[user] = editable;
    Store.set('td-custom-' + user, { h: count, s: editable.s });
    Store.set('myedit-' + user, {});
    Engine.rebuild();
    updateTopSummary(user);
    toast('\uc2dc\uac04\ud45c\uac00 \uc800\uc7a5\ub418\uc5c8\uc2b5\ub2c8\ub2e4. (' + count + '\uc2dc\uac04)');
    render();
  }

  function resetTT(){
    var user = App.getUser();
    if(!confirm('\uc2dc\uac04\ud45c \uc218\uc815 \ub0b4\uc5ed\uc744 \ucd08\uae30\ud654\ud560\uae4c\uc694?')) return;
    Store.remove('td-custom-' + user);
    Store.remove('myedit-' + user);
    Store.remove('tt-subj-' + user);
    if(TD_A[user]) delete TD_A[user];
    Engine.rebuild();
    updateTopSummary(user);
    toast('\uc2dc\uac04\ud45c \uc218\uc815 \ub0b4\uc5ed\uc774 \ucd08\uae30\ud654\ub418\uc5c8\uc2b5\ub2c8\ub2e4.');
    render();
  }

  function addAfter(){
    var user = App.getUser();
    var rows = getAfterData(user);
    var day = document.getElementById('afDay').value;
    var p8 = document.getElementById('afP8').value.trim();
    var p9 = document.getElementById('afP9').value.trim();
    var from = document.getElementById('afFrom').value;
    var to = document.getElementById('afTo').value;
    if(!p8 && !p9){
      toast('8\uad50\uc2dc \ub610\ub294 9\uad50\uc2dc \uc815\ubcf4\ub97c \uc785\ub825\ud574 \uc8fc\uc138\uc694.');
      return;
    }
    rows.push({ day: day, p8: p8, p9: p9, from: from, to: to });
    setAfterData(user, rows);
    toast(day + ' \ubc29\uacfc\ud6c4\uac00 \ucd94\uac00\ub418\uc5c8\uc2b5\ub2c8\ub2e4.');
    render();
  }

  function delAfter(index){
    var user = App.getUser();
    var rows = getAfterData(user);
    rows.splice(index, 1);
    setAfterData(user, rows);
    toast('\ubc29\uacfc\ud6c4\uac00 \uc0ad\uc81c\ub418\uc5c8\uc2b5\ub2c8\ub2e4.');
    render();
  }

  return {
    render: render,
    saveInfo: saveInfo,
    saveTT: saveTT,
    resetTT: resetTT,
    addAfter: addAfter,
    delAfter: delAfter
  };
})();
