// pages/schedule.js — 학사일정 (나이스 API)
var PageSchedule = (function() {
  var monthOff = 0;
  function render() {
    var d = new Date(); d.setMonth(d.getMonth() + monthOff);
    var y = d.getFullYear(), m = d.getMonth();
    var from = y + Neis.pad(m + 1) + '01';
    var last = new Date(y, m + 1, 0);
    var to = y + Neis.pad(m + 1) + Neis.pad(last.getDate());
    var label = y + '년 ' + (m + 1) + '월';

    var h = '<div class="card"><div class="card-h">📆 학사일정</div>';
    h += '<div class="week-nav"><button onclick="PageSchedule.prev()">◀</button><span class="wk-label">' + label + '</span><button onclick="PageSchedule.next()">▶</button><button onclick="PageSchedule.now()" style="margin-left:4px">이번달</button></div>';
    h += '<div id="calG" style="color:var(--tx2);font-size:.88em;padding:20px 0;text-align:center">🔄 불러오는 중...</div></div>';
    document.getElementById('pg').innerHTML = h;

    Neis.getSchedule(from, to, function(events) {
      var dn = ['일','월','화','수','목','금','토'];
      var firstDay = new Date(y, m, 1).getDay();
      var lastDate = last.getDate();
      var todayStr = Neis.ymd(new Date());

      // 달력 그리드
      var g = '<div style="margin-bottom:14px">';
      g += '<div style="display:grid;grid-template-columns:repeat(7,1fr);text-align:center;font-size:.8em;font-weight:600;color:var(--tx2);margin-bottom:4px">';
      for (var i = 0; i < 7; i++) g += '<div style="padding:4px;' + (i===0?'color:var(--red)':'') + (i===6?'color:var(--blue)':'') + '">' + dn[i] + '</div>';
      g += '</div>';

      g += '<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px">';
      // 빈칸
      for (var i = 0; i < firstDay; i++) g += '<div style="min-height:60px"></div>';

      for (var day = 1; day <= lastDate; day++) {
        var ds = y + Neis.pad(m + 1) + Neis.pad(day);
        var dow = new Date(y, m, day).getDay();
        var isT = ds === todayStr;
        var dayEvents = events.filter(function(e) { return e.date === ds; });

        g += '<div style="min-height:60px;padding:3px;border-radius:4px;background:' + (isT ? 'var(--blue-bg)' : 'var(--bg)') + ';border:1px solid ' + (isT ? 'var(--blue)' : 'var(--bd)') + '">';
        g += '<div style="font-size:.78em;font-weight:' + (isT ? '700' : '500') + ';color:' + (dow===0 ? 'var(--red)' : dow===6 ? 'var(--blue)' : isT ? 'var(--blue)' : 'var(--tx)') + ';margin-bottom:2px">' + day + '</div>';

        for (var j = 0; j < dayEvents.length; j++) {
          var ev = dayEvents[j];
          var color = ev.type === '휴업일' ? 'var(--red)' : ev.name.indexOf('시험') >= 0 ? 'var(--orange)' : 'var(--green)';
          g += '<div style="font-size:.68em;padding:1px 3px;margin-bottom:1px;border-radius:2px;background:' + color + ';color:#fff;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="' + ev.name + '">' + ev.name + '</div>';
        }
        g += '</div>';
      }
      g += '</div></div>';

      // 이벤트 리스트
      if (events.length) {
        g += '<div style="margin-top:8px"><div style="font-weight:600;font-size:.9em;margin-bottom:8px">📋 이번 달 일정 (' + events.length + '건)</div>';
        var seen = {};
        for (var i = 0; i < events.length; i++) {
          var ev = events[i];
          var key = ev.date + ev.name;
          if (seen[key]) continue; seen[key] = 1;
          var dd = ev.date;
          var dateLabel = dd.substr(4, 2) + '/' + dd.substr(6, 2);
          var badge = ev.type === '휴업일' ? '<span style="background:var(--red);color:#fff;padding:1px 6px;border-radius:8px;font-size:.72em;margin-right:4px">휴업</span>' : '';
          g += '<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--bg2);font-size:.85em">';
          g += '<span style="color:var(--tx3);min-width:40px;font-weight:500">' + dateLabel + '</span>';
          g += '<span>' + badge + ev.name + '</span>';
          g += '</div>';
        }
        g += '</div>';
      }

      document.getElementById('calG').innerHTML = g;
    });
  }
  return { render:render, prev:function(){monthOff--;render()}, next:function(){monthOff++;render()}, now:function(){monthOff=0;render()} };
})();
