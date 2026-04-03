// pages/admin.js
var PageAdmin = (function(){
  var tab = 'accounts';
  var ttSelTeacher = null;

  var TAB_ITEMS = [
    ['accounts', '계정 관리'],
    ['subjects', '교사 과목'],
    ['timetable', '교사 시간표'],
    ['classEdit', '학급 시간표'],
    ['afterBulk', '방과후 관리'],
    ['notice', '공지사항'],
    ['print', '인쇄/PDF'],
    ['periods', '교시 시간'],
    ['data', '데이터']
  ];

  function escapeHtml(value){
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function getAdminDayKeys(){
    if(typeof DAYS !== 'undefined' && Array.isArray(DAYS) && DAYS.length >= 5){
      return DAYS.slice(0, 5);
    }
    return ['월', '화', '수', '목', '금'];
  }

  function getAdminDayLabel(index){
    return ['월', '화', '수', '목', '금'][index] || '';
  }

  function getPeriodsForDay(dayKey){
    if(typeof DP !== 'undefined' && DP && typeof DP[dayKey] === 'number'){
      return DP[dayKey];
    }
    return 7;
  }

  function getTeacherNames(){
    return Engine.names ? Engine.names() : [];
  }

  function getTeacherState(name){
    var td = Engine.TD ? Engine.TD() : {};
    if(td && td[name]) return td[name];
    return { h: 0, s: new Array(32).fill(null) };
  }

  function getTeacherSubject(name){
    var ts = Engine.TS ? Engine.TS() : {};
    return ts[name] || '';
  }

  function setContent(html){
    var root = document.getElementById('ac');
    if(root) root.innerHTML = html;
  }

  function rebuildAndRender(){
    try{
      if(Engine && typeof Engine.rebuild === 'function') Engine.rebuild();
    }catch(error){
      console.error('Engine.rebuild error:', error);
    }
    render();
  }

  function downloadBlob(blob, filename){
    var link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    setTimeout(function(){
      try{ URL.revokeObjectURL(link.href); }catch(ignore){}
    }, 1000);
  }

  function render(){
    var html = '';
    html += '<div class="card"><div class="card-h">관리자 설정</div>';
    html += '<div class="chips" style="margin-bottom:14px">';
    for(var i = 0; i < TAB_ITEMS.length; i += 1){
      html += '<span class="chip' + (tab === TAB_ITEMS[i][0] ? ' on' : '') + '" onclick="PageAdmin.tab(\'' + TAB_ITEMS[i][0] + '\')">' + TAB_ITEMS[i][1] + '</span>';
    }
    html += '</div><div id="ac"></div></div>';
    document.getElementById('pg').innerHTML = html;

    var renderers = {
      accounts: rAcc,
      subjects: rSubj,
      timetable: rTT,
      classEdit: rClassEdit,
      afterBulk: rAfterBulk,
      notice: rNotice,
      print: rPrint,
      periods: rPer,
      data: rDat
    };
    if(renderers[tab]) renderers[tab]();
  }

  function rAcc(){
    var accounts = Auth.getAccounts();
    var names = Object.keys(accounts).sort();
    var html = '';
    html += '<h3 style="font-size:.92em;margin-bottom:8px">교원 계정 (' + names.length + '명)</h3>';
    html += '<p style="color:var(--tx2);font-size:.82em;margin-bottom:10px">교원 이름을 기준으로 계정을 관리합니다. 비밀번호는 변경할 때만 입력하면 됩니다.</p>';
    html += '<div style="overflow-x:auto;max-height:350px;overflow-y:auto">';
    html += '<table class="a-table"><thead><tr><th>교원명</th><th>아이디</th><th>비밀번호 변경</th><th>권한</th><th>삭제</th></tr></thead><tbody>';
    for(var i = 0; i < names.length; i += 1){
      var name = names[i];
      var account = accounts[name];
      html += '<tr>';
      html += '<td>' + escapeHtml(name) + '</td>';
      html += '<td><input class="ti-input" id="ai' + i + '" value="' + escapeHtml(account.id || name) + '" data-k="' + escapeHtml(name) + '"></td>';
      html += '<td><input class="ti-input" id="ap' + i + '" value="" placeholder="변경 시에만 입력" data-k="' + escapeHtml(name) + '"></td>';
      html += '<td><select class="ti-sel" id="ar' + i + '" data-k="' + escapeHtml(name) + '">';
      html += '<option value="user"' + (account.role === 'user' ? ' selected' : '') + '>일반</option>';
      html += '<option value="admin"' + (account.role === 'admin' ? ' selected' : '') + '>관리자</option>';
      html += '</select></td>';
      html += '<td><button class="a-btn danger sm" onclick="PageAdmin.delAcc(\'' + name.replace(/'/g, "\\'") + '\')">삭제</button></td>';
      html += '</tr>';
    }
    html += '</tbody></table></div>';
    html += '<div style="margin-top:10px;display:flex;gap:6px;flex-wrap:wrap">';
    html += '<button class="a-btn primary" onclick="PageAdmin.saveAcc(' + names.length + ')">저장</button>';
    html += '<button class="a-btn outline" onclick="PageAdmin.resetAcc()">기본 계정 초기화</button>';
    html += '</div>';

    html += '<div style="margin-top:12px;padding:12px;background:var(--bg2);border-radius:6px">';
    html += '<div style="font-weight:600;font-size:.85em;margin-bottom:6px">새 계정 추가</div>';
    html += '<div style="display:flex;gap:6px;flex-wrap:wrap">';
    html += '<input class="ti-input" id="nn" placeholder="교원명" style="max-width:120px">';
    html += '<input class="ti-input" id="ni" placeholder="아이디" style="max-width:140px">';
    html += '<input class="ti-input" id="np" placeholder="비밀번호" style="max-width:120px">';
    html += '<select class="ti-sel" id="nr"><option value="user">일반</option><option value="admin">관리자</option></select>';
    html += '<button class="a-btn success" onclick="PageAdmin.addAcc()">추가</button>';
    html += '</div></div>';
    setContent(html);
  }

  function saveAcc(count){
    var accounts = Auth.getAccounts();
    for(var i = 0; i < count; i += 1){
      var idInput = document.getElementById('ai' + i);
      if(!idInput) continue;
      var key = idInput.dataset.k;
      if(!accounts[key]) continue;
      accounts[key].id = idInput.value.trim() || key;
      accounts[key].role = document.getElementById('ar' + i).value;
      var pw = document.getElementById('ap' + i).value || '';
      if(pw) accounts[key].pw = pw;
    }
    Auth.saveAccounts(accounts).then(function(){
      toast('계정이 저장되었습니다.');
      rebuildAndRender();
    }).catch(function(error){
      console.error(error);
      toast('계정 저장 중 오류가 발생했습니다.');
    });
  }

  function addAcc(){
    var name = (document.getElementById('nn').value || '').trim();
    var id = (document.getElementById('ni').value || '').trim();
    var pw = document.getElementById('np').value || '';
    var role = document.getElementById('nr').value || 'user';
    if(!name){
      toast('교원명을 입력해 주세요.');
      return;
    }

    var accounts = Auth.getAccounts();
    if(accounts[name]){
      toast('이미 등록된 계정입니다.');
      return;
    }

    accounts[name] = {
      id: id || name,
      pw: pw || '1234',
      role: role
    };

    Auth.saveAccounts(accounts).then(function(){
      toast('계정이 추가되었습니다.');
      rebuildAndRender();
    }).catch(function(error){
      console.error(error);
      toast('계정 추가 중 오류가 발생했습니다.');
    });
  }

  function delAcc(name){
    if(name === App.getUser()){
      toast('현재 로그인한 계정은 삭제할 수 없습니다.');
      return;
    }
    if(!confirm(name + ' 계정을 삭제할까요?')) return;

    var accounts = Auth.getAccounts();
    delete accounts[name];
    Auth.saveAccounts(accounts).then(function(){
      toast('계정이 삭제되었습니다.');
      rebuildAndRender();
    }).catch(function(error){
      console.error(error);
      toast('계정 삭제 중 오류가 발생했습니다.');
    });
  }

  function resetAcc(){
    if(!confirm('계정을 기본값으로 초기화할까요?')) return;
    Auth.resetAccounts().then(function(){
      toast('기본 계정으로 초기화되었습니다.');
      rebuildAndRender();
    }).catch(function(error){
      console.error(error);
      toast('계정 초기화 중 오류가 발생했습니다.');
    });
  }

  function rSubj(){
    var names = getTeacherNames();
    var autoSubjects = Engine.TS ? Engine.TS() : {};
    var overrides = Store.get('subj-ov', {});
    var html = '';
    html += '<h3 style="font-size:.92em;margin-bottom:8px">교사별 과목 설정</h3>';
    html += '<p style="color:var(--tx2);font-size:.82em;margin-bottom:10px">자동 계산된 과목명을 유지하거나, 필요한 경우 수동 과목명을 덮어쓸 수 있습니다.</p>';
    html += '<div style="max-height:400px;overflow-y:auto"><table class="a-table"><thead><tr><th>교원명</th><th>자동 과목</th><th>수동 과목</th></tr></thead><tbody>';
    for(var i = 0; i < names.length; i += 1){
      var name = names[i];
      html += '<tr>';
      html += '<td>' + escapeHtml(name) + '</td>';
      html += '<td style="color:var(--tx3)">' + escapeHtml(autoSubjects[name] || '') + '</td>';
      html += '<td><input class="ti-input" id="so' + i + '" value="' + escapeHtml(overrides[name] || '') + '" placeholder="' + escapeHtml(autoSubjects[name] || '직접 입력') + '" data-k="' + escapeHtml(name) + '" style="width:140px"></td>';
      html += '</tr>';
    }
    html += '</tbody></table></div>';
    html += '<button class="a-btn primary" style="margin-top:8px" onclick="PageAdmin.saveSubj(' + names.length + ')">저장</button>';
    setContent(html);
  }

  function saveSubj(count){
    var overrides = {};
    for(var i = 0; i < count; i += 1){
      var input = document.getElementById('so' + i);
      if(!input) continue;
      var value = input.value.trim();
      if(value) overrides[input.dataset.k] = value;
    }
    Store.set('subj-ov', overrides);
    rebuildAndRender();
    toast('과목 설정이 저장되었습니다.');
  }
  function rTT(){
    var names = getTeacherNames();
    if(!names.length){
      setContent('<div style="color:var(--tx3);font-size:.9em">등록된 교원이 없습니다.</div>');
      return;
    }
    if(!ttSelTeacher || names.indexOf(ttSelTeacher) === -1) ttSelTeacher = names[0];

    var dayKeys = getAdminDayKeys();
    var teacherState = getTeacherState(ttSelTeacher);
    var html = '';
    html += '<h3 style="font-size:.92em;margin-bottom:8px">교사 시간표 직접 수정</h3>';
    html += '<p style="color:var(--tx2);font-size:.82em;margin-bottom:10px">교사를 선택한 뒤 각 칸에 반을 직접 입력합니다. 저장하면 현재 사용자 화면에도 바로 반영됩니다.</p>';
    html += '<div class="filter-row" style="margin-bottom:10px"><span class="filter-label">교사</span>';
    html += '<select class="ti-sel" id="ttTeacher" onchange="PageAdmin.selTTTeacher(this.value)" style="max-width:240px">';
    for(var i = 0; i < names.length; i += 1){
      var name = names[i];
      var state = getTeacherState(name);
      html += '<option value="' + escapeHtml(name) + '"' + (name === ttSelTeacher ? ' selected' : '') + '>' + escapeHtml(name) + ' (' + escapeHtml(getTeacherSubject(name)) + ', ' + state.h + 'h)</option>';
    }
    html += '</select></div>';

    html += '<div style="overflow-x:auto"><table class="a-table" style="font-size:.82em"><thead><tr><th style="width:64px"></th>';
    for(var d = 0; d < dayKeys.length; d += 1){
      html += '<th>' + getAdminDayLabel(d) + '</th>';
    }
    html += '</tr></thead><tbody>';
    for(var p = 0; p < 7; p += 1){
      html += '<tr>';
      html += '<th style="background:var(--bg2);font-weight:600">' + (p + 1) + '교시<br><span style="font-weight:400;font-size:.85em;color:var(--tx3)">' + escapeHtml((PT[p] && PT[p].s) || '') + '</span></th>';
      for(var di = 0; di < dayKeys.length; di += 1){
        var dayKey = dayKeys[di];
        if(p >= getPeriodsForDay(dayKey)){
          html += '<td style="background:var(--bg3);color:var(--tx3)">-</td>';
          continue;
        }
        var slotIndex = Engine.si(dayKey, p);
        var value = teacherState.s[slotIndex] || '';
        var subject = '';
        if(value && CS[value] && CS[value][dayKey]){
          subject = CS[value][dayKey][p] || '';
        }
        html += '<td style="padding:2px">';
        html += '<input class="ti-input" style="padding:4px 6px;font-size:.82em;width:100%;text-align:center' + (value ? ';background:#e8f0fe' : '') + '" value="' + escapeHtml(value) + '" data-teacher="' + escapeHtml(ttSelTeacher) + '" data-si="' + slotIndex + '" placeholder="반명">';
        if(subject){
          html += '<div style="font-size:.7em;color:var(--tx3);text-align:center">' + escapeHtml(subject) + '</div>';
        }
        html += '</td>';
      }
      html += '</tr>';
    }
    html += '</tbody></table></div>';
    html += '<div style="margin-top:10px;display:flex;gap:6px;flex-wrap:wrap">';
    html += '<button class="a-btn primary" onclick="PageAdmin.saveTT()">선택 교사 시간표 저장</button>';
    html += '<button class="a-btn outline" onclick="PageAdmin.resetTT()">선택 교사 시간표 초기화</button>';
    html += '</div>';

    html += '<details style="margin-top:16px"><summary style="font-size:.85em;color:var(--tx2);cursor:pointer">CSV 일괄 업로드 / 양식 다운로드</summary>';
    html += '<div style="padding:10px;background:var(--bg2);border-radius:6px;margin-top:6px">';
    html += '<input type="file" id="csvF" accept=".csv" style="margin-bottom:6px"><br>';
    html += '<button class="a-btn primary sm" onclick="PageAdmin.upCSV()">업로드</button> ';
    html += '<button class="a-btn outline sm" onclick="PageAdmin.dlCSV()">양식 다운로드</button>';
    html += '</div></details>';

    setContent(html);
  }
  function selTTTeacher(name){ ttSelTeacher = name; rTT(); }
  function saveTT(){
    if(!ttSelTeacher) return;
    var current = getTeacherState(ttSelTeacher);
    var slots = Array.isArray(current.s) ? current.s.slice() : new Array(32).fill(null);
    var inputs = document.querySelectorAll('[data-teacher][data-si]');
    for(var i = 0; i < inputs.length; i += 1){
      if(inputs[i].dataset.teacher !== ttSelTeacher) continue;
      var slotIndex = parseInt(inputs[i].dataset.si, 10);
      slots[slotIndex] = inputs[i].value.trim() || null;
    }
    var count = 0;
    for(var j = 0; j < slots.length; j += 1){
      if(slots[j]) count += 1;
    }
    Store.set('td-custom-' + ttSelTeacher, { h: count, s: slots });
    if(TD_A[ttSelTeacher]){
      TD_A[ttSelTeacher] = { h: count, s: slots.slice() };
    }
    Engine.rebuild();
    toast(ttSelTeacher + ' 시간표가 저장되었습니다. (' + count + '시간)');
    rTT();
  }

  function resetTT(){
    if(!ttSelTeacher) return;
    if(!confirm(ttSelTeacher + ' 시간표 수정을 초기화할까요?')) return;
    Store.remove('td-custom-' + ttSelTeacher);
    Engine.rebuild();
    toast('선택 교사의 시간표 수정값을 초기화했습니다.');
    rTT();
  }

  function upCSV(){
    var fileInput = document.getElementById('csvF');
    if(!fileInput || !fileInput.files || !fileInput.files.length){
      toast('CSV 파일을 선택해 주세요.');
      return;
    }

    var reader = new FileReader();
    reader.onload = function(event){
      try{
        var text = String(event.target.result || '');
        var lines = text.split(/\r?\n/).filter(Boolean);
        var count = 0;
        var accountMap = Auth.getAccounts();
        for(var i = 1; i < lines.length; i += 1){
          var cols = lines[i].split(',');
          if(cols.length < 34) continue;
          var name = (cols[0] || '').trim();
          if(!name) continue;
          var hours = parseInt(cols[1], 10) || 0;
          var slots = [];
          for(var j = 2; j < 34; j += 1){
            var value = cols[j] ? cols[j].trim() : '';
            slots.push(value && value !== '-' && value !== 'null' ? value : null);
          }
          TD_A[name] = { h: hours, s: slots };
          Store.set('td-custom-' + name, { h: hours, s: slots.slice() });
          if(!accountMap[name]){
            accountMap[name] = { id: name, pw: '1234', role: 'user' };
          }
          count += 1;
        }
        Auth.saveAccounts(accountMap).then(function(){
          Engine.rebuild();
          toast(count + '명의 시간표를 불러왔습니다.');
          render();
        }).catch(function(error){
          console.error(error);
          toast('계정 저장 중 오류가 발생했습니다.');
        });
      }catch(error){
        console.error(error);
        toast('CSV 처리 중 오류가 발생했습니다.');
      }
    };
    reader.readAsText(fileInput.files[0], 'UTF-8');
  }

  function dlCSV(){
    var header = ['교사명', '시수'];
    var dayKeys = getAdminDayKeys();
    for(var di = 0; di < dayKeys.length; di += 1){
      for(var p = 0; p < getPeriodsForDay(dayKeys[di]); p += 1){
        header.push(getAdminDayLabel(di) + (p + 1));
      }
    }
    while(header.length < 34) header.push('예비');

    var body = [];
    var names = Object.keys(TD_A).sort();
    for(var i = 0; i < names.length; i += 1){
      var name = names[i];
      var state = TD_A[name];
      var row = [name, state.h];
      for(var j = 0; j < 32; j += 1){
        row.push(state.s[j] || '');
      }
      body.push(row.join(','));
    }
    var csv = '\uFEFF' + header.join(',') + '\n' + body.join('\n');
    downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), '교사시간표_양식.csv');
    toast('CSV 양식을 다운로드했습니다.');
  }

  function rClassEdit(){
    var classes = Object.keys(CS || {}).sort();
    if(!classes.length){
      setContent('<div style="color:var(--tx3);font-size:.9em">학급 시간표 데이터가 없습니다.</div>');
      return;
    }
    var selected = Store.get('admin-sel-class', classes[0]);
    if(classes.indexOf(selected) === -1) selected = classes[0];

    var dayKeys = getAdminDayKeys();
    var html = '';
    html += '<h3 style="font-size:.92em;margin-bottom:8px">학급 시간표 수정</h3>';
    html += '<div class="filter-row"><span class="filter-label">학급</span>';
    html += '<select class="ti-sel" id="ceClass" onchange="Store.set(\'admin-sel-class\',this.value);PageAdmin.tab(\'classEdit\')">';
    for(var i = 0; i < classes.length; i += 1){
      html += '<option value="' + escapeHtml(classes[i]) + '"' + (classes[i] === selected ? ' selected' : '') + '>' + escapeHtml(classes[i]) + '</option>';
    }
    html += '</select></div>';
    html += '<div style="overflow-x:auto"><table class="a-table"><thead><tr><th></th>';
    for(var d = 0; d < dayKeys.length; d += 1){
      html += '<th>' + getAdminDayLabel(d) + '</th>';
    }
    html += '</tr></thead><tbody>';
    for(var p = 0; p < 7; p += 1){
      html += '<tr><th>' + (p + 1) + '교시</th>';
      for(var di = 0; di < dayKeys.length; di += 1){
        var dayKey = dayKeys[di];
        var value = (p < getPeriodsForDay(dayKey) && CS[selected] && CS[selected][dayKey]) ? (CS[selected][dayKey][p] || '') : '';
        if(p >= getPeriodsForDay(dayKey)){
          html += '<td style="background:var(--bg2)">-</td>';
        }else{
          html += '<td><input class="ti-input" style="padding:3px 5px;font-size:.82em" value="' + escapeHtml(value) + '" data-cls="' + escapeHtml(selected) + '" data-day="' + escapeHtml(dayKey) + '" data-p="' + p + '"></td>';
        }
      }
      html += '</tr>';
    }
    html += '</tbody></table></div>';
    html += '<button class="a-btn primary" style="margin-top:8px" onclick="PageAdmin.saveClass()">저장</button>';
    setContent(html);
  }

  function saveClass(){
    var inputs = document.querySelectorAll('[data-cls][data-day][data-p]');
    for(var i = 0; i < inputs.length; i += 1){
      var cls = inputs[i].dataset.cls;
      var day = inputs[i].dataset.day;
      var period = parseInt(inputs[i].dataset.p, 10);
      var value = inputs[i].value.trim();
      if(CS[cls] && CS[cls][day]){
        CS[cls][day][period] = value || null;
      }
    }
    Store.set('class-edits', CS);
    Engine.rebuild();
    toast('학급 시간표가 저장되었습니다.');
  }

  function rAfterBulk(){
    var names = getTeacherNames().filter(function(name){
      var state = getTeacherState(name);
      return state.h > 0;
    });
    var html = '';
    html += '<h3 style="font-size:.92em;margin-bottom:8px">방과후 일괄 관리</h3>';
    html += '<p style="color:var(--tx2);font-size:.82em;margin-bottom:10px">교사별 방과후 운영 현황을 확인하고 관리자 화면에서 직접 추가할 수 있습니다.</p>';
    html += '<div style="max-height:400px;overflow-y:auto"><table class="a-table"><thead><tr><th>교사</th><th>과목</th><th>운영 현황</th><th>정리</th></tr></thead><tbody>';
    for(var i = 0; i < names.length; i += 1){
      var name = names[i];
      var after = Store.get('after-' + name, []);
      var active = after.filter(function(item){
        if(!item.from && !item.to) return true;
        var now = new Date().toISOString().slice(0, 10);
        return (!item.from || now >= item.from) && (!item.to || now <= item.to);
      });
      var summary = active.map(function(item){
        var text = item.day || '';
        if(item.p8) text += '(8:' + item.p8 + ')';
        if(item.p9) text += '(9:' + item.p9 + ')';
        return text;
      }).join(', ');
      html += '<tr>';
      html += '<td>' + escapeHtml(name) + '</td>';
      html += '<td>' + escapeHtml(getTeacherSubject(name)) + '</td>';
      html += '<td style="font-size:.8em">' + (summary ? escapeHtml(summary) : '<span style="color:var(--tx3)">없음</span>') + '</td>';
      html += '<td><button class="a-btn outline sm" onclick="PageAdmin.editAfterFor(\'' + name.replace(/'/g, "\\'") + '\')">비우기</button></td>';
      html += '</tr>';
    }
    html += '</tbody></table></div>';

    html += '<div style="margin-top:14px;padding:12px;background:var(--bg2);border-radius:6px">';
    html += '<div style="font-weight:600;font-size:.88em;margin-bottom:8px">방과후 추가</div>';
    html += '<div style="display:flex;gap:6px;flex-wrap:wrap;align-items:flex-end">';
    html += '<div><div style="font-size:.78em;color:var(--tx2)">교사</div><select class="ti-sel" id="abTeacher">';
    for(var j = 0; j < names.length; j += 1){
      html += '<option>' + escapeHtml(names[j]) + '</option>';
    }
    html += '</select></div>';
    html += '<div><div style="font-size:.78em;color:var(--tx2)">요일</div><select class="ti-sel" id="abDay"><option>월</option><option>화</option><option>수</option><option>목</option><option>금</option></select></div>';
    html += '<div><div style="font-size:.78em;color:var(--tx2)">8교시</div><input class="ti-input" id="abP8" placeholder="반명" style="width:90px"></div>';
    html += '<div><div style="font-size:.78em;color:var(--tx2)">9교시</div><input class="ti-input" id="abP9" placeholder="반명" style="width:90px"></div>';
    html += '<div><div style="font-size:.78em;color:var(--tx2)">시작일</div><input class="ti-input" id="abFrom" type="date" style="width:140px"></div>';
    html += '<div><div style="font-size:.78em;color:var(--tx2)">종료일</div><input class="ti-input" id="abTo" type="date" style="width:140px"></div>';
    html += '<button class="a-btn primary" onclick="PageAdmin.addAfterBulk()">추가</button>';
    html += '</div></div>';
    setContent(html);
  }

  function editAfterFor(name){
    var rows = Store.get('after-' + name, []);
    if(!rows.length){
      toast('등록된 방과후가 없습니다.');
      return;
    }
    if(!confirm(name + ' 교사의 방과후 목록을 모두 비울까요?')) return;
    Store.set('after-' + name, []);
    toast(name + ' 교사의 방과후를 비웠습니다.');
    render();
  }

  function addAfterBulk(){
    var name = document.getElementById('abTeacher').value;
    var day = document.getElementById('abDay').value;
    var p8 = document.getElementById('abP8').value.trim();
    var p9 = document.getElementById('abP9').value.trim();
    var from = document.getElementById('abFrom').value;
    var to = document.getElementById('abTo').value;
    if(!p8 && !p9){
      toast('8교시 또는 9교시 정보를 입력해 주세요.');
      return;
    }
    var rows = Store.get('after-' + name, []);
    rows.push({ day: day, p8: p8, p9: p9, from: from, to: to });
    Store.set('after-' + name, rows);
    toast(name + ' 교사의 방과후가 추가되었습니다.');
    render();
  }
  function rNotice(){
    var notices = Store.get('notices', []);
    var html = '';
    html += '<h3 style="font-size:.92em;margin-bottom:8px">공지사항 게시</h3>';
    html += '<div style="margin-bottom:12px">';
    if(!notices.length){
      html += '<div style="color:var(--tx3);font-size:.85em;padding:8px">등록된 공지사항이 없습니다.</div>';
    }
    for(var i = 0; i < notices.length; i += 1){
      var item = notices[i];
      html += '<div style="padding:10px;border:1px solid var(--bd);border-radius:6px;margin-bottom:6px">';
      html += '<div style="display:flex;justify-content:space-between;align-items:center">';
      html += '<div style="font-weight:600;font-size:.9em">' + escapeHtml(item.title || '') + '</div>';
      html += '<div style="display:flex;gap:4px;align-items:center"><span style="font-size:.75em;color:var(--tx3)">' + escapeHtml(item.date || '') + '</span>';
      html += '<button class="a-btn danger sm" onclick="PageAdmin.delNotice(' + i + ')">삭제</button></div></div>';
      html += '<div style="font-size:.85em;margin-top:4px;white-space:pre-wrap;color:var(--tx2)">' + escapeHtml(item.content || '') + '</div></div>';
    }
    html += '</div>';
    html += '<div style="padding:12px;background:var(--bg2);border-radius:6px">';
    html += '<input class="ti-input" id="ntTitle" placeholder="제목" style="margin-bottom:6px">';
    html += '<textarea class="ti-input" id="ntContent" placeholder="내용" style="min-height:80px;resize:vertical;margin-bottom:6px"></textarea>';
    html += '<button class="a-btn primary" onclick="PageAdmin.addNotice()">공지 등록</button></div>';
    setContent(html);
  }

  function addNotice(){
    var title = document.getElementById('ntTitle').value.trim();
    var content = document.getElementById('ntContent').value.trim();
    if(!title){
      toast('제목을 입력해 주세요.');
      return;
    }
    var notices = Store.get('notices', []);
    notices.unshift({
      title: title,
      content: content,
      date: new Date().toISOString().slice(0, 10),
      by: App.getUser()
    });
    Store.set('notices', notices);
    toast('공지사항이 저장되었습니다.');
    render();
  }

  function delNotice(index){
    var notices = Store.get('notices', []);
    notices.splice(index, 1);
    Store.set('notices', notices);
    toast('공지사항이 삭제되었습니다.');
    render();
  }

  function rPrint(){
    var names = getTeacherNames();
    var classes = Object.keys(CS || {}).sort();
    var html = '';
    html += '<h3 style="font-size:.92em;margin-bottom:8px">인쇄 / PDF</h3>';
    html += '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px">';
    html += '<select class="ti-sel" id="prTarget">';
    html += '<option value="my">내 시간표</option>';
    for(var i = 0; i < names.length; i += 1){
      html += '<option value="t:' + escapeHtml(names[i]) + '">' + escapeHtml(names[i]) + ' (' + escapeHtml(getTeacherSubject(names[i])) + ')</option>';
    }
    for(var j = 0; j < classes.length; j += 1){
      html += '<option value="c:' + escapeHtml(classes[j]) + '">' + escapeHtml(classes[j]) + ' (학급)</option>';
    }
    html += '</select>';
    html += '<button class="a-btn primary" onclick="PageAdmin.doPrint()">미리보기</button></div>';
    html += '<div id="printPreview"></div>';
    setContent(html);
  }

  function doPrint(){
    var target = document.getElementById('prTarget').value;
    var name = '';
    var isClass = false;
    if(target === 'my') name = App.getUser();
    else if(target.indexOf('t:') === 0) name = target.substr(2);
    else if(target.indexOf('c:') === 0){
      name = target.substr(2);
      isClass = true;
    }

    var dayKeys = getAdminDayKeys();
    var html = '';
    html += '<div id="printArea" style="background:#fff;padding:20px;color:#000">';
    html += '<h2 style="text-align:center;margin-bottom:16px">경북기계금속고등학교 ' + escapeHtml(isClass ? (name + ' 학급 시간표') : (name + ' 시간표')) + '</h2>';
    html += '<table style="width:100%;border-collapse:collapse;font-size:13px"><thead><tr><th style="border:1px solid #000;padding:8px;background:#e8e8e8"></th>';
    for(var d = 0; d < dayKeys.length; d += 1){
      html += '<th style="border:1px solid #000;padding:8px;background:#e8e8e8">' + getAdminDayLabel(d) + '</th>';
    }
    html += '</tr></thead><tbody>';

    var ctm = Engine.CTM ? Engine.CTM() : {};
    for(var p = 0; p < 7; p += 1){
      html += '<tr>';
      html += '<th style="border:1px solid #000;padding:8px;background:#f5f5f5">' + (p + 1) + '교시<br>' + escapeHtml((PT[p] && PT[p].s) || '') + '~' + escapeHtml((PT[p] && PT[p].e) || '') + '</th>';
      for(var di = 0; di < dayKeys.length; di += 1){
        var dayKey = dayKeys[di];
        if(p >= getPeriodsForDay(dayKey)){
          html += '<td style="border:1px solid #000;padding:8px;color:#999">-</td>';
          continue;
        }

        if(isClass){
          var key = name + '|' + dayKey + '|' + p;
          var teacher = ctm[key] || '';
          var subject = '';
          if(CS[name] && CS[name][dayKey]) subject = CS[name][dayKey][p] || '';
          html += '<td style="border:1px solid #000;padding:8px">' + (teacher ? ('<b>' + escapeHtml(teacher) + '</b><br><span style="font-size:11px;color:#666">' + escapeHtml(subject) + '</span>') : (escapeHtml(subject) || '-')) + '</td>';
        }else{
          var className = Engine.slot ? Engine.slot(name, dayKey, p) : '';
          var subjectName = '';
          if(className && CS[className] && CS[className][dayKey]) subjectName = CS[className][dayKey][p] || '';
          html += '<td style="border:1px solid #000;padding:8px">' + (className ? (escapeHtml(className) + '<br><span style="font-size:11px;color:#666">' + escapeHtml(subjectName || className) + '</span>') : '-') + '</td>';
        }
      }
      html += '</tr>';
    }
    html += '</tbody></table>';
    html += '<div style="text-align:right;margin-top:12px;font-size:11px;color:#999">출력일: ' + new Date().toLocaleDateString('ko-KR') + '</div>';
    html += '</div>';
    html += '<button class="a-btn primary" style="margin-top:8px" onclick="var w=window.open(\'\');w.document.write(document.getElementById(\'printArea\').outerHTML);w.document.close();w.print()">인쇄하기</button>';
    document.getElementById('printPreview').innerHTML = html;
  }

  function rPer(){
    var html = '';
    html += '<h3 style="font-size:.92em;margin-bottom:8px">교시 시간 설정</h3>';
    html += '<table class="a-table"><thead><tr><th>교시</th><th>시작</th><th>종료</th></tr></thead><tbody>';
    for(var i = 0; i < PT.length; i += 1){
      html += '<tr>';
      html += '<td>' + (i + 1) + '교시</td>';
      html += '<td><input type="time" id="ps' + i + '" value="' + escapeHtml(PT[i].s || '') + '"></td>';
      html += '<td><input type="time" id="pe' + i + '" value="' + escapeHtml(PT[i].e || '') + '"></td>';
      html += '</tr>';
    }
    html += '</tbody></table>';
    html += '<button class="a-btn primary" style="margin-top:8px" onclick="PageAdmin.savePT()">저장</button>';
    setContent(html);
  }

  function savePT(){
    for(var i = 0; i < PT.length; i += 1){
      PT[i].s = document.getElementById('ps' + i).value;
      PT[i].e = document.getElementById('pe' + i).value;
    }
    Store.set('pt', PT);
    toast('교시 시간이 저장되었습니다.');
  }

  function rDat(){
    var total = 0;
    for(var i = 0; i < localStorage.length; i += 1){
      var key = localStorage.key(i);
      if(key && key.indexOf('gm-') === 0){
        total += (localStorage.getItem(key) || '').length;
      }
    }

    var html = '';
    html += '<h3 style="font-size:.92em;margin-bottom:8px">데이터 관리</h3>';
    html += '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px">';
    html += '<button class="a-btn success" onclick="PageAdmin.exp()">백업</button>';
    html += '<button class="a-btn outline" onclick="document.getElementById(\'impF\').click()">복원</button>';
    html += '<input type="file" id="impF" accept=".json" style="display:none" onchange="PageAdmin.imp(event)">';
    html += '<button class="a-btn danger" onclick="PageAdmin.clr()">로컬 캐시 초기화</button>';
    html += '</div>';
    html += '<div style="padding:8px;background:var(--bg2);border-radius:6px;font-size:.85em">로컬 사용량: ' + (total / 1024).toFixed(1) + ' KB</div>';
    setContent(html);
  }

  function exp(){
    var data = Store.exportAll();
    data.subjOv = Store.get('subj-ov', {});
    data.notices = Store.get('notices', []);
    data.classEdits = Store.get('class-edits', null);
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    downloadBlob(blob, 'portal-backup-' + new Date().toISOString().slice(0, 10) + '.json');
    toast('백업 파일을 다운로드했습니다.');
  }

  function imp(event){
    var file = event.target.files[0];
    if(!file) return;
    var reader = new FileReader();
    reader.onload = function(loadEvent){
      try{
        var data = JSON.parse(loadEvent.target.result);
        Store.importAll(data);
        if(data.subjOv) Store.set('subj-ov', data.subjOv);
        if(data.notices) Store.set('notices', data.notices);
        if(data.classEdits){
          Store.set('class-edits', data.classEdits);
          for(var key in data.classEdits){
            CS[key] = data.classEdits[key];
          }
        }
        Engine.rebuild();
        toast('백업 파일을 복원했습니다.');
        render();
      }catch(error){
        console.error(error);
        toast('복원 중 오류가 발생했습니다.');
      }
    };
    reader.readAsText(file);
  }

  function clr(){
    if(!confirm('로컬 캐시를 초기화할까요?')) return;
    if(Store && typeof Store.clearLocalCache === 'function'){
      Store.clearLocalCache();
    }else{
      var keys = [];
      for(var i = 0; i < localStorage.length; i += 1){
        var key = localStorage.key(i);
        if(key && key.indexOf('gm-') === 0) keys.push(key);
      }
      keys.forEach(function(key){
        localStorage.removeItem(key);
      });
    }
    location.reload();
  }

  return {
    render: render,
    tab: function(nextTab){
      tab = nextTab;
      render();
    },
    saveAcc: saveAcc,
    addAcc: addAcc,
    delAcc: delAcc,
    resetAcc: resetAcc,
    saveSubj: saveSubj,
    selTTTeacher: selTTTeacher,
    saveTT: saveTT,
    resetTT: resetTT,
    upCSV: upCSV,
    dlCSV: dlCSV,
    saveClass: saveClass,
    editAfterFor: editAfterFor,
    addAfterBulk: addAfterBulk,
    addNotice: addNotice,
    delNotice: delNotice,
    doPrint: doPrint,
    savePT: savePT,
    exp: exp,
    imp: imp,
    clr: clr
  };
})();
