// pages/history.js
var PageHistory = (function(){
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

  function parseDateString(value){
    if(!value) return null;
    var date = new Date(value + 'T00:00:00');
    if(isNaN(date.getTime())) return null;
    return date;
  }

  function formatClassDate(value){
    var date = parseDateString(value);
    if(!date) return value || '-';
    return date.getFullYear() + '.' + pad(date.getMonth() + 1) + '.' + pad(date.getDate()) + ' (' + ['일','월','화','수','목','금','토'][date.getDay()] + ')';
  }

  function formatSavedDate(value){
    if(!value) return '-';
    var date = new Date(value);
    if(isNaN(date.getTime())) return value;
    return date.getFullYear() + '.' + pad(date.getMonth() + 1) + '.' + pad(date.getDate()) + ' ' + pad(date.getHours()) + ':' + pad(date.getMinutes());
  }

  function resolveWeek(item){
    if(item && item.week) return String(item.week);
    if(item && item.classDate){
      var classDate = parseDateString(item.classDate);
      if(classDate) return Store.weekKey(classDate);
    }
    if(item && item.date){
      var savedAt = new Date(item.date);
      if(!isNaN(savedAt.getTime())) return Store.weekKey(savedAt);
    }
    return '-';
  }

  function render(){
    var history = Store.getSwapHistory();
    var html = '';
    html += '<div class="card"><div class="card-h">교체 기록';
    html += '<span class="right" style="font-size:.78em;color:var(--tx2)">총 ' + history.length + '건</span></div>';

    if(!history.length){
      html += '<p style="color:var(--tx2);font-size:.88em">등록된 교체 기록이 없습니다.</p>';
      html += '</div>';
      document.getElementById('pg').innerHTML = html;
      return;
    }

    html += '<div style="display:grid;gap:8px">';
    for(var i = 0; i < history.length; i += 1){
      var item = history[i];
      var statusLabel = item.status === 'applied' ? '적용' : '취소';
      html += '<div style="padding:12px;border:1px solid var(--bd);border-radius:12px;background:' + (item.status === 'cancelled' ? 'rgba(148,163,184,.08)' : '#fff') + '">';
      html += '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">';
      html += '<span style="font-size:.75em;padding:2px 8px;border-radius:999px;background:' + (item.status === 'applied' ? 'rgba(34,107,214,.12)' : 'rgba(148,163,184,.16)') + ';color:' + (item.status === 'applied' ? 'var(--blue)' : 'var(--tx2)') + ';font-weight:600">' + statusLabel + '</span>';
      html += '<span style="font-size:.78em;color:var(--tx2)">주차: ' + escapeHtml(resolveWeek(item)) + '</span>';
      html += '<span style="font-size:.78em;color:var(--tx3)">저장: ' + escapeHtml(formatSavedDate(item.date)) + '</span>';
      html += '</div>';
      html += '<div style="margin-top:8px;font-size:.95em"><b>' + escapeHtml(item.teacher || '') + '</b> → <b style="color:var(--blue)">' + escapeHtml(item.substitute || '') + '</b></div>';
      html += '<div style="font-size:.84em;color:var(--tx2);margin-top:4px">수업일: ' + escapeHtml(formatClassDate(item.classDate || '')) + '</div>';
      html += '<div style="font-size:.84em;color:var(--tx2);margin-top:2px">' + escapeHtml(item.day || '-') + ' / ' + (Number(item.period) + 1) + '교시 / ' + escapeHtml(item.cls || '-') + ' / ' + escapeHtml(item.subj || '-') + '</div>';
      if(item.reason){
        html += '<div style="font-size:.82em;color:var(--tx2);margin-top:4px">사유: ' + escapeHtml(item.reason) + '</div>';
      }
      if(item.by){
        html += '<div style="font-size:.8em;color:var(--tx3);margin-top:4px">등록자: ' + escapeHtml(item.by) + '</div>';
      }
      if(item.status === 'applied'){
        html += '<div style="margin-top:8px"><button class="a-btn danger sm" onclick="PageHistory.cancel(\'' + String(item.id).replace(/'/g, "\\'") + '\')">취소</button></div>';
      }
      if(item.status === 'cancelled' && item.cancelledAt){
        html += '<div style="font-size:.78em;color:var(--tx3);margin-top:4px">취소 시각: ' + escapeHtml(formatSavedDate(item.cancelledAt)) + '</div>';
      }
      html += '</div>';
    }
    html += '</div></div>';
    document.getElementById('pg').innerHTML = html;
  }

  return {
    render: render,
    cancel: function(id){
      if(!confirm('이 교체를 취소할까요? 시간표가 원래대로 돌아갑니다.')) return;
      Store.cancelSwap(id);
      Engine.rebuild();
      toast('교체를 취소했습니다.');
      render();
    }
  };
})();
