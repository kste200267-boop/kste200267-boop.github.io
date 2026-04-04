// pages/swap.js
var PageSwap = (function(){
  var selectedTeacher = null;
  var selectedDate = '';
  var selectedSlots = {};
  var swapReason = '';

  function escapeHtml(value){
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function pad(value){
    return String(value).padStart(2, '0');
  }

  function toDateString(date){
    return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate());
  }

  function parseDateString(value){
    if(!value) return null;
    var date = new Date(value + 'T00:00:00');
    if(isNaN(date.getTime())) return null;
    return date;
  }

  function getDefaultDate(){
    var date = new Date();
    while(date.getDay() === 0 || date.getDay() === 6){
      date.setDate(date.getDate() + 1);
    }
    return toDateString(date);
  }

  function getDayKeyFromDate(value){
    var date = parseDateString(value);
    if(!date) return '';
    var map = { 1: '월', 2: '화', 3: '수', 4: '목', 5: '금' };
    return map[date.getDay()] || '';
  }

  function getWeekdayLabel(value){
    var date = parseDateString(value);
    if(!date) return '';
    return ['일', '월', '화', '수', '목', '금', '토'][date.getDay()] || '';
  }

  function formatDateLabel(value){
    var date = parseDateString(value);
    if(!date) return value || '';
    return date.getFullYear() + '.' + pad(date.getMonth() + 1) + '.' + pad(date.getDate()) + ' (' + getWeekdayLabel(value) + ')';
  }

  function getSelectedWeekKey(){
    var date = parseDateString(selectedDate) || new Date();
    return Store.weekKey(date);
  }

  function getHistoryWeek(item){
    if(item && item.week) return String(item.week);
    if(item && item.classDate){
      var date = parseDateString(item.classDate);
      if(date) return Store.weekKey(date);
    }
    if(item && item.date){
      var createdAt = new Date(item.date);
      if(!isNaN(createdAt.getTime())) return Store.weekKey(createdAt);
    }
    return Store.weekKey();
  }

  function findAppliedSwap(teacher, day, period, weekKey){
    var history = Store.getSwapHistory();
    for(var i = 0; i < history.length; i += 1){
      var item = history[i];
      if(!item || item.status !== 'applied') continue;
      if(getHistoryWeek(item) !== weekKey) continue;
      if(item.teacher === teacher && item.day === day && Number(item.period) === Number(period)){
        return item;
      }
    }
    return null;
  }

  function getSlotSubject(className, day, period){
    if(!className) return '';
    if(CS[className] && CS[className][day]){
      return CS[className][day][period] || '';
    }
    return className;
  }

  function getTeacherNames(){
    return Engine.names ? Engine.names() : [];
  }

  function ensureState(){
    if(!selectedDate) selectedDate = getDefaultDate();
    var names = getTeacherNames();
    if(!selectedTeacher || names.indexOf(selectedTeacher) === -1){
      selectedTeacher = App.getUser() || names[0] || '';
    }
  }

  function rebuildForSelectedWeek(){
    Engine.rebuild(getSelectedWeekKey());
  }

  function clearSelections(){
    selectedSlots = {};
  }

  function buildSlotCards(dayKey, weekKey){
    var html = '';
    if(!dayKey){
      html += '<div style="padding:14px;border:1px dashed var(--bd);border-radius:10px;color:var(--tx2);font-size:.88em">';
      html += '주말은 정규 수업 교체 대상이 아닙니다. 월요일부터 금요일 사이 날짜를 선택해 주세요.';
      html += '</div>';
      return html;
    }

    html += '<div style="display:grid;gap:10px">';
    for(var period = 0; period < (DP[dayKey] || 0); period += 1){
      var key = dayKey + '|' + period;
      var className = Engine.slot(selectedTeacher, dayKey, period);
      var subject = getSlotSubject(className, dayKey, period);
      var appliedSwap = findAppliedSwap(selectedTeacher, dayKey, period, weekKey);
      var isChecked = !!selectedSlots[key];
      var disabled = !className || className === '동아리' || className === '자습' || !!appliedSwap;
      html += '<div class="pc' + (disabled ? ' dis' : '') + (isChecked ? ' ck' : '') + '"';
      if(!disabled){
        html += ' onclick="PageSwap.toggleSlot(\'' + key + '\')"';
      }
      html += '>';
      html += '<div class="pc-box">' + (disabled ? (appliedSwap ? '완료' : '-') : (isChecked ? '선택' : '')) + '</div>';
      html += '<div>';
      html += '<div class="pc-l">' + (period + 1) + '교시 <span style="font-weight:400;color:var(--tx3);font-size:.82em">' + escapeHtml((PT[period] && PT[period].s) || '') + '~' + escapeHtml((PT[period] && PT[period].e) || '') + '</span></div>';
      if(appliedSwap){
        html += '<div class="pc-d">' + escapeHtml(className || '-') + ' / ' + escapeHtml(subject || '-') + '</div>';
        html += '<div style="font-size:.8em;color:var(--blue);margin-top:3px">이미 ' + escapeHtml(appliedSwap.substitute || '') + ' 교사로 교체됨</div>';
      }else if(className){
        html += '<div class="pc-d">' + escapeHtml(className) + (subject ? ' / ' + escapeHtml(subject) : '') + '</div>';
      }else{
        html += '<div class="pc-d">수업 없음</div>';
      }
      html += '</div></div>';
    }
    html += '</div>';
    return html;
  }

  function getCandidateResults(dayKey, weekKey){
    var keys = Object.keys(selectedSlots);
    var results = [];
    for(var i = 0; i < keys.length; i += 1){
      var parts = keys[i].split('|');
      var period = Number(parts[1]);
      var className = Engine.slot(selectedTeacher, dayKey, period);
      if(!className) continue;
      var subject = getSlotSubject(className, dayKey, period);
      var candidates = [];
      var teachers = getTeacherNames();
      for(var j = 0; j < teachers.length; j += 1){
        var teacher = teachers[j];
        if(teacher === selectedTeacher) continue;
        if(Engine.free(teacher, dayKey, period)){
          candidates.push({
            teacher: teacher,
            subject: Engine.TS()[teacher] || ''
          });
        }
      }
      results.push({
        key: keys[i],
        day: dayKey,
        period: period,
        className: className,
        subject: subject,
        classDate: selectedDate,
        candidates: candidates,
        weekKey: weekKey
      });
    }
    results.sort(function(a, b){ return a.period - b.period; });
    return results;
  }

  function buildCandidateSection(dayKey, weekKey){
    var results = getCandidateResults(dayKey, weekKey);
    if(!results.length){
      return '<div style="padding:14px;border:1px dashed var(--bd);border-radius:10px;color:var(--tx2);font-size:.88em">교체할 교시를 먼저 선택해 주세요.</div>';
    }

    var html = '';
    html += '<div style="background:var(--bg2);border-radius:var(--radius);padding:14px;margin-top:12px">';
    html += '<div style="font-weight:700;margin-bottom:10px">교체 가능 교사</div>';
    html += '<div style="font-size:.8em;color:var(--tx2);margin-bottom:10px">' + escapeHtml(formatDateLabel(selectedDate)) + ' / ' + escapeHtml(weekKey) + ' 기준으로 빈 시간을 다시 계산했습니다.</div>';
    for(var i = 0; i < results.length; i += 1){
      var result = results[i];
      html += '<div style="margin-bottom:14px">';
      html += '<div style="font-weight:600;font-size:.88em;margin-bottom:6px">';
      html += escapeHtml(formatDateLabel(result.classDate)) + ' ' + (result.period + 1) + '교시 / ';
      html += '<span style="color:var(--blue)">' + escapeHtml(result.className) + '</span>';
      if(result.subject) html += ' (' + escapeHtml(result.subject) + ')';
      html += '</div>';
      if(!result.candidates.length){
        html += '<div style="color:var(--red);font-size:.83em">해당 시간에 비어 있는 교사가 없습니다.</div>';
      }else{
        for(var j = 0; j < result.candidates.length; j += 1){
          var candidate = result.candidates[j];
          html += '<div style="display:flex;align-items:center;gap:8px;padding:8px 10px;margin-bottom:4px;background:var(--bg);border-radius:6px;border:1px solid var(--bd)">';
          html += '<div style="flex:1;font-size:.85em"><b>' + escapeHtml(candidate.teacher) + '</b>';
          if(candidate.subject) html += ' <span style="color:var(--tx2)">(' + escapeHtml(candidate.subject) + ')</span>';
          html += '</div>';
          html += '<button class="a-btn primary sm" onclick="PageSwap.applySwap(' + result.period + ', \'' + candidate.teacher.replace(/'/g, "\\'") + '\')">교체 적용</button>';
          html += '</div>';
        }
      }
      html += '</div>';
    }
    html += '</div>';
    return html;
  }

  function buildHistorySection(weekKey){
    var history = Store.getSwapHistory();
    if(!history.length){
      return '<div class="card"><div class="card-h">교체 이력</div><p style="color:var(--tx2);font-size:.88em">등록된 교체 이력이 없습니다.</p></div>';
    }

    var html = '';
    html += '<div class="card"><div class="card-h">교체 이력';
    html += '<span class="right" style="font-size:.78em;color:var(--tx2)">선택 주차: ' + escapeHtml(weekKey) + '</span></div>';
    html += '<div style="display:grid;gap:8px">';
    for(var i = 0; i < Math.min(history.length, 20); i += 1){
      var item = history[i];
      var statusLabel = item.status === 'applied' ? '적용' : '취소';
      var dateLabel = formatDateLabel(item.classDate || '');
      var saveDate = item.date ? new Date(item.date).toLocaleString('ko-KR') : '';
      var isCurrentWeek = getHistoryWeek(item) === weekKey;
      html += '<div style="padding:10px;border:1px solid ' + (isCurrentWeek ? 'rgba(34,107,214,.35)' : 'var(--bd)') + ';border-radius:10px;background:' + (item.status === 'cancelled' ? 'rgba(148,163,184,.08)' : '#fff') + '">';
      html += '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">';
      html += '<span style="font-size:.75em;padding:2px 8px;border-radius:999px;background:' + (item.status === 'applied' ? 'rgba(34,107,214,.12)' : 'rgba(148,163,184,.15)') + ';color:' + (item.status === 'applied' ? 'var(--blue)' : 'var(--tx2)') + ';font-weight:600">' + statusLabel + '</span>';
      html += '<span style="font-size:.78em;color:var(--tx2)">' + escapeHtml(item.week || getHistoryWeek(item)) + '</span>';
      if(saveDate) html += '<span style="font-size:.78em;color:var(--tx3)">저장: ' + escapeHtml(saveDate) + '</span>';
      html += '</div>';
      html += '<div style="margin-top:6px;font-size:.9em"><b>' + escapeHtml(item.teacher || '') + '</b> → <b style="color:var(--blue)">' + escapeHtml(item.substitute || '') + '</b></div>';
      html += '<div style="font-size:.84em;color:var(--tx2);margin-top:4px">' + escapeHtml(dateLabel || (item.day || '')) + ' / ' + (Number(item.period) + 1) + '교시 / ' + escapeHtml(item.cls || '-') + ' / ' + escapeHtml(item.subj || '-') + '</div>';
      if(item.reason){
        html += '<div style="font-size:.82em;color:var(--tx2);margin-top:4px">사유: ' + escapeHtml(item.reason) + '</div>';
      }
      if(item.status === 'applied'){
        html += '<div style="margin-top:8px"><button class="a-btn danger sm" onclick="PageSwap.cancel(\'' + String(item.id).replace(/'/g, "\\'") + '\')">취소</button></div>';
      }
      html += '</div>';
    }
    html += '</div></div>';
    return html;
  }

  function render(){
    ensureState();
    rebuildForSelectedWeek();

    var weekKey = getSelectedWeekKey();
    var dayKey = getDayKeyFromDate(selectedDate);
    var teachers = getTeacherNames();
    var html = '';
    html += '<div class="card"><div class="card-h">수업 교체</div>';
    html += '<p style="color:var(--tx2);font-size:.83em;margin-bottom:12px">교체할 날짜를 먼저 고르면 해당 주차를 기준으로 빈 시간 교사를 다시 계산합니다. 저장하면 그 날짜가 속한 주간 시간표에 반영됩니다.</p>';

    html += '<div class="filter-row" style="margin-bottom:12px;gap:10px;flex-wrap:wrap">';
    html += '<div><div style="font-size:.78em;color:var(--tx2);margin-bottom:4px">교사</div><select class="ti-sel" onchange="PageSwap.pickTeacher(this.value)" style="min-width:220px">';
    for(var i = 0; i < teachers.length; i += 1){
      html += '<option value="' + escapeHtml(teachers[i]) + '"' + (teachers[i] === selectedTeacher ? ' selected' : '') + '>' + escapeHtml(teachers[i]) + ' (' + escapeHtml(Engine.TS()[teachers[i]] || '') + ')</option>';
    }
    html += '</select></div>';
    html += '<div><div style="font-size:.78em;color:var(--tx2);margin-bottom:4px">수업일</div><input class="ti-input" type="date" value="' + escapeHtml(selectedDate) + '" onchange="PageSwap.pickDate(this.value)" style="min-width:180px"></div>';
    html += '<div><div style="font-size:.78em;color:var(--tx2);margin-bottom:4px">주차</div><div class="ti-input" style="display:flex;align-items:center;min-width:160px;background:var(--bg2)">' + escapeHtml(weekKey) + '</div></div>';
    html += '<div><div style="font-size:.78em;color:var(--tx2);margin-bottom:4px">요일</div><div class="ti-input" style="display:flex;align-items:center;min-width:120px;background:var(--bg2)">' + escapeHtml(getWeekdayLabel(selectedDate) || '-') + '</div></div>';
    html += '</div>';

    html += '<div style="padding:10px 12px;border-radius:10px;background:rgba(34,107,214,.08);border:1px solid rgba(34,107,214,.14);font-size:.84em;color:var(--tx2);margin-bottom:12px">';
    html += '<b>' + escapeHtml(formatDateLabel(selectedDate)) + '</b> 기준으로 교체를 저장합니다. 이미 저장된 같은 주차 교체도 후보 계산에 반영됩니다.';
    html += '</div>';

    html += '<div style="font-weight:600;font-size:.85em;margin-bottom:6px">교시 선택</div>';
    html += buildSlotCards(dayKey, weekKey);

    html += '<div style="font-weight:600;font-size:.85em;margin:14px 0 6px">교체 사유</div>';
    html += '<input class="ti-input" id="swReason" value="' + escapeHtml(swapReason) + '" placeholder="예: 출장, 연수, 병가 등" oninput="PageSwap.setReason(this.value)">';

    html += '<div style="font-weight:600;font-size:.85em;margin:14px 0 6px">교체 가능 교사</div>';
    html += buildCandidateSection(dayKey, weekKey);
    html += '</div>';

    html += buildHistorySection(weekKey);
    document.getElementById('pg').innerHTML = html;
  }

  function applySwap(period, substituteTeacher){
    ensureState();
    rebuildForSelectedWeek();

    var dayKey = getDayKeyFromDate(selectedDate);
    if(!dayKey){
      toast('수업일은 평일만 선택할 수 있습니다.');
      return;
    }

    var className = Engine.slot(selectedTeacher, dayKey, period);
    if(!className){
      toast('선택한 교시에 수업이 없습니다.');
      return;
    }

    if(!Engine.free(substituteTeacher, dayKey, period)){
      toast('선택한 교사가 더 이상 비어 있지 않습니다. 다시 확인해 주세요.');
      render();
      return;
    }

    var payload = {
      teacher: selectedTeacher,
      day: dayKey,
      period: Number(period),
      cls: className,
      subj: getSlotSubject(className, dayKey, period),
      substitute: substituteTeacher,
      by: App.getUser(),
      classDate: selectedDate,
      targetDate: selectedDate,
      reason: swapReason.trim()
    };

    var conflict = Store.checkSwapConflict(payload);
    if(!conflict.ok){
      if(conflict.code === 'teacher-slot-conflict'){
        toast('해당 교시는 이미 다른 교체가 등록되어 있습니다.');
      }else if(conflict.code === 'substitute-slot-conflict'){
        toast('선택한 교사는 같은 시간에 이미 다른 교체에 배정되어 있습니다.');
      }else{
        toast('교체 충돌이 감지되었습니다.');
      }
      render();
      return;
    }

    var confirmMessage = [
      selectedTeacher + ' 교사의',
      formatDateLabel(selectedDate) + ' ' + (Number(period) + 1) + '교시를',
      substituteTeacher + ' 교사로 교체할까요?'
    ].join(' ');
    if(!confirm(confirmMessage)) return;

    var result = Store.addSwap(payload);
    if(!result || result.ok === false){
      if(result && result.code === 'teacher-slot-conflict'){
        toast('해당 교시는 이미 다른 교체가 등록되어 있습니다.');
      }else if(result && result.code === 'substitute-slot-conflict'){
        toast('선택한 교사는 같은 시간에 이미 다른 교체에 배정되어 있습니다.');
      }else{
        toast('교체 저장 중 오류가 발생했습니다.');
      }
      render();
      return;
    }

    clearSelections();
    swapReason = '';
    rebuildForSelectedWeek();
    toast('교체가 저장되었습니다.');
    render();
  }

  return {
    render: render,
    pickTeacher: function(name){
      selectedTeacher = name;
      clearSelections();
      render();
    },
    pickDate: function(value){
      selectedDate = value || getDefaultDate();
      clearSelections();
      render();
    },
    toggleSlot: function(key){
      if(selectedSlots[key]) delete selectedSlots[key];
      else selectedSlots[key] = true;
      render();
    },
    setReason: function(value){
      swapReason = value || '';
    },
    applySwap: applySwap,
    cancel: function(id){
      if(!confirm('이 교체를 취소할까요? 선택한 날짜 주차에서도 바로 원래 시간표로 돌아갑니다.')) return;
      Store.cancelSwap(id);
      rebuildForSelectedWeek();
      toast('교체를 취소했습니다.');
      render();
    }
  };
})();
