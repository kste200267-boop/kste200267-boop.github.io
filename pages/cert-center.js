var PageCertCenter = (function(){
  var CACHE_KEY = 'gm-cert-center-cache-v1';
  var META_COLLECTION = 'certCenterMeta';
  var CLASS_COLLECTION = 'certCenterClasses';
  var LOG_COLLECTION = 'certCenterUploads';

  var CERT_OPTIONS = ['선택', '취득', '미취득'];
  var PROGRAM_OPTIONS = ['선택', '참여', '미참여'];

  var DEFAULT_CERTS = [
    '피복아크용접기능사 필기',
    '피복아크용접기능사 실기',
    '가스텅스텐아크용접기능사 필기',
    '가스텅스텐아크용접기능사 실기',
    '이산화탄소가스아크용접기능사 필기',
    '이산화탄소가스아크용접기능사 실기',
    '컴퓨터응용선반기능사 필기',
    '컴퓨터응용선반기능사 실기',
    '컴퓨터응용밀링기능사 필기',
    '컴퓨터응용밀링기능사 실기',
    '전산응용기계제도기능사 필기',
    '전산응용기계제도기능사 실기',
    '3D프린터운용기능사 필기',
    '3D프린터운용기능사 실기'
  ];

  var DEFAULT_PROGRAMS = [
    { name: '방과후 용접 실기', teacher: '', schedule: '', targetCert: '피복아크용접기능사 실기' },
    { name: '방과후 취업 면접', teacher: '', schedule: '', targetCert: '' },
    { name: '방과후 3D프린팅 실습', teacher: '', schedule: '', targetCert: '3D프린터운용기능사 실기' }
  ];

  var CLASS_INFO = [
    { code: '1용1', grade: 1, dept: '스마트용접과', classNo: 1 },
    { code: '1용2', grade: 1, dept: '스마트용접과', classNo: 2 },
    { code: '1기1', grade: 1, dept: '융합기계과', classNo: 1 },
    { code: '1기2', grade: 1, dept: '융합기계과', classNo: 2 },
    { code: '1금1', grade: 1, dept: '스마트금형과', classNo: 1 },
    { code: '1금2', grade: 1, dept: '스마트금형과', classNo: 2 },
    { code: '2용1', grade: 2, dept: '스마트용접과', classNo: 1 },
    { code: '2용2', grade: 2, dept: '스마트용접과', classNo: 2 },
    { code: '2기1', grade: 2, dept: '융합기계과', classNo: 1 },
    { code: '2기2', grade: 2, dept: '융합기계과', classNo: 2 },
    { code: '2금1', grade: 2, dept: '스마트금형과', classNo: 1 },
    { code: '2금2', grade: 2, dept: '스마트금형과', classNo: 2 },
    { code: '3용1', grade: 3, dept: '스마트용접과', classNo: 1 },
    { code: '3용2', grade: 3, dept: '스마트용접과', classNo: 2 },
    { code: '3선1', grade: 3, dept: '컴퓨터응용선반과', classNo: 1 },
    { code: '3선2', grade: 3, dept: '컴퓨터응용선반과', classNo: 2 },
    { code: '3밀1', grade: 3, dept: '컴퓨터응용밀링과', classNo: 1 },
    { code: '3밀2', grade: 3, dept: '컴퓨터응용밀링과', classNo: 2 }
  ];

  var state = {
    loaded: false,
    loading: false,
    tab: 'dashboard',
    selectedClass: '1용1',
    filters: { grade: '전체', dept: '전체', cert: '전체', program: '전체', keyword: '' },
    config: createDefaultConfig(),
    classes: {},
    logs: [],
    rosterMap: {},
    lastSync: '',
    programDraft: { name: '', teacher: '', schedule: '', targetCert: '' }
  };

  var saveTimers = {};

  hydrateFromCache();

  function createDefaultConfig(){
    var cfg = {
      certs: DEFAULT_CERTS.slice(),
      programs: [],
      programMeta: {},
      updatedAt: '',
      updatedBy: ''
    };
    DEFAULT_PROGRAMS.forEach(function(item){
      cfg.programs.push(item.name);
      cfg.programMeta[item.name] = {
        teacher: item.teacher || '',
        schedule: item.schedule || '',
        targetCert: item.targetCert || ''
      };
    });
    return cfg;
  }

  function fdb(){
    try{
      return (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length) ? firebase.firestore() : null;
    }catch(e){
      return null;
    }
  }

  function hydrateFromCache(){
    try{
      var raw = localStorage.getItem(CACHE_KEY);
      if(!raw) return;
      var cached = JSON.parse(raw);
      if(!cached) return;
      state.config = normalizeConfig(cached.config);
      state.rosterMap = cached.rosterMap || {};
      state.classes = buildClassState(cached.classes || {}, state.rosterMap);
      state.logs = Array.isArray(cached.logs) ? cached.logs.slice(0, 40) : [];
      state.lastSync = cached.lastSync || '';
    }catch(e){
      console.error('cert center cache read error:', e);
    }
  }

  function cacheState(){
    try{
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        config: state.config,
        classes: state.classes,
        logs: state.logs.slice(0, 40),
        rosterMap: state.rosterMap,
        lastSync: state.lastSync
      }));
    }catch(e){
      console.error('cert center cache write error:', e);
    }
  }

  function pad(n){
    return String(n || 0).padStart(2, '0');
  }

  function esc(str){
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function quote(str){
    return String(str == null ? '' : str)
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'")
      .replace(/\r/g, ' ')
      .replace(/\n/g, ' ');
  }

  function tidyText(str){
    return String(str == null ? '' : str).replace(/\s+/g, ' ').trim();
  }

  function normalizeHeader(str){
    return tidyText(str).replace(/\s+/g, '').toLowerCase();
  }

  function normalizeCertStatus(value){
    value = tidyText(value);
    return CERT_OPTIONS.indexOf(value) >= 0 ? value : '선택';
  }

  function normalizeProgramStatus(value){
    value = tidyText(value);
    return PROGRAM_OPTIONS.indexOf(value) >= 0 ? value : '선택';
  }

  function normalizeAttendance(value){
    var text = tidyText(value);
    if(!text) return '';
    var num = parseFloat(text.replace(/%/g, ''));
    if(isNaN(num)) return text;
    if(num < 0) num = 0;
    if(num > 100) num = 100;
    return String(Math.round(num * 10) / 10);
  }

  function getClassMeta(code){
    for(var i = 0; i < CLASS_INFO.length; i += 1){
      if(CLASS_INFO[i].code === code) return CLASS_INFO[i];
    }
    return null;
  }

  function getClassLabel(code){
    var meta = getClassMeta(code);
    if(!meta) return code;
    return meta.grade + '학년 ' + meta.dept + ' ' + meta.classNo + '반';
  }

  function getClassGroupKey(meta){
    return meta.grade + '||' + meta.dept + '||' + meta.classNo;
  }

  function getFallbackRoster(meta){
    var list = (typeof CERT_PRELOADED_ROSTERS !== 'undefined' && CERT_PRELOADED_ROSTERS[getClassGroupKey(meta)]) || [];
    var out = [];
    for(var i = 0; i < list.length; i += 1){
      out.push({
        number: i + 1,
        name: tidyText(list[i])
      });
    }
    return out;
  }

  function buildRosterMapFromSnapshot(snapshot){
    var map = {};
    if(snapshot && typeof snapshot.forEach === 'function'){
      snapshot.forEach(function(doc){
        var rows = [];
        var data = doc.data() || {};
        var students = Array.isArray(data.students) ? data.students.slice() : [];
        students.sort(function(a, b){
          return (parseInt(a.num, 10) || 0) - (parseInt(b.num, 10) || 0);
        });
        students.forEach(function(item){
          var num = parseInt(item.num, 10) || 0;
          if(!num) return;
          rows.push({ number: num, name: tidyText(item.name || '') });
        });
        map[doc.id] = rows;
      });
    }
    return map;
  }

  function normalizeConfig(raw){
    var base = createDefaultConfig();
    var certMap = {};
    var programMap = {};
    var cfg = raw && typeof raw === 'object' ? raw : {};
    var certs = Array.isArray(cfg.certs) ? cfg.certs : [];
    var programs = Array.isArray(cfg.programs) ? cfg.programs : [];

    base.certs.concat(certs).forEach(function(name){
      name = tidyText(name);
      if(!name || certMap[name]) return;
      certMap[name] = true;
    });

    base.programs.concat(programs).forEach(function(name){
      name = tidyText(name);
      if(!name || programMap[name]) return;
      programMap[name] = true;
    });

    var normalized = {
      certs: Object.keys(certMap),
      programs: Object.keys(programMap),
      programMeta: {},
      updatedAt: cfg.updatedAt || '',
      updatedBy: cfg.updatedBy || ''
    };

    normalized.programs.forEach(function(name){
      var defaults = base.programMeta[name] || { teacher: '', schedule: '', targetCert: '' };
      var src = (cfg.programMeta && cfg.programMeta[name]) || {};
      normalized.programMeta[name] = {
        teacher: tidyText(src.teacher || defaults.teacher || ''),
        schedule: tidyText(src.schedule || defaults.schedule || ''),
        targetCert: tidyText(src.targetCert || defaults.targetCert || '')
      };
    });

    return normalized;
  }

  function getProgramMeta(name){
    return state.config.programMeta[name] || { teacher: '', schedule: '', targetCert: '' };
  }

  function createStudent(meta, number, fallbackName, existing){
    var source = existing && typeof existing === 'object' ? existing : {};
    var student = {
      id: source.id || (meta.code + '-' + pad(number)),
      classCode: meta.code,
      grade: meta.grade,
      dept: meta.dept,
      classNo: meta.classNo,
      number: number,
      name: tidyText(source.name || fallbackName || ('학생' + pad(number))),
      note: tidyText(source.note || ''),
      certs: {},
      programs: {}
    };

    state.config.certs.forEach(function(certName){
      student.certs[certName] = normalizeCertStatus(source.certs && source.certs[certName]);
    });

    state.config.programs.forEach(function(programName){
      var programSource = source.programs && source.programs[programName];
      var metaInfo = getProgramMeta(programName);
      var entry = {
        status: '선택',
        attendance: '',
        targetCert: metaInfo.targetCert || '',
        certResult: '선택',
        note: '',
        updatedAt: '',
        updatedBy: ''
      };
      if(typeof programSource === 'string'){
        entry.status = normalizeProgramStatus(programSource);
      }else if(programSource && typeof programSource === 'object'){
        entry.status = normalizeProgramStatus(programSource.status || programSource.value);
        entry.attendance = normalizeAttendance(programSource.attendance || '');
        entry.targetCert = tidyText(programSource.targetCert || metaInfo.targetCert || '');
        entry.certResult = normalizeCertStatus(programSource.certResult || programSource.result || '');
        entry.note = tidyText(programSource.note || '');
        entry.updatedAt = tidyText(programSource.updatedAt || '');
        entry.updatedBy = tidyText(programSource.updatedBy || '');
      }
      student.programs[programName] = entry;
    });

    return student;
  }

  function buildClassState(rawClasses, rosterMap){
    var out = {};
    CLASS_INFO.forEach(function(meta){
      var code = meta.code;
      var doc = rawClasses && rawClasses[code] ? rawClasses[code] : {};
      var existing = Array.isArray(doc.students) ? doc.students.slice() : [];
      var existingByNumber = {};
      existing.forEach(function(student){
        var num = parseInt(student.number, 10) || parseInt(student.num, 10) || 0;
        if(!num) return;
        existingByNumber[num] = student;
      });

      var roster = (rosterMap && rosterMap[code] && rosterMap[code].length) ? rosterMap[code] : getFallbackRoster(meta);
      var total = Math.max(roster.length, existing.length, 1);
      var students = [];

      for(var number = 1; number <= total; number += 1){
        var rosterEntry = roster[number - 1] || {};
        students.push(createStudent(meta, number, rosterEntry.name || '', existingByNumber[number]));
      }

      existing.forEach(function(student){
        var num = parseInt(student.number, 10) || parseInt(student.num, 10) || 0;
        if(!num || num <= total) return;
        students.push(createStudent(meta, num, '', student));
      });

      students.sort(function(a, b){ return a.number - b.number; });
      out[code] = {
        classCode: code,
        grade: meta.grade,
        dept: meta.dept,
        classNo: meta.classNo,
        updated: doc.updated || '',
        updatedBy: doc.updatedBy || '',
        students: students
      };
    });
    return out;
  }

  function ensureClassDoc(code){
    if(state.classes[code]) return state.classes[code];
    var meta = getClassMeta(code);
    if(!meta) return null;
    state.classes[code] = buildClassState({}, state.rosterMap)[code];
    return state.classes[code];
  }

  function getAllStudents(){
    var list = [];
    CLASS_INFO.forEach(function(meta){
      var doc = ensureClassDoc(meta.code);
      if(doc && Array.isArray(doc.students)){
        doc.students.forEach(function(student){
          list.push(student);
        });
      }
    });
    return list;
  }

  function hasCert(student, certName){
    if(certName && certName !== '전체') return student.certs[certName] === '취득';
    for(var i = 0; i < state.config.certs.length; i += 1){
      if(student.certs[state.config.certs[i]] === '취득') return true;
    }
    return false;
  }

  function hasProgram(student, programName){
    if(programName && programName !== '전체'){
      return student.programs[programName] && student.programs[programName].status === '참여';
    }
    for(var i = 0; i < state.config.programs.length; i += 1){
      var entry = student.programs[state.config.programs[i]];
      if(entry && entry.status === '참여') return true;
    }
    return false;
  }

  function hasAnyInput(student){
    if(tidyText(student.note)) return true;
    for(var i = 0; i < state.config.certs.length; i += 1){
      if(student.certs[state.config.certs[i]] !== '선택') return true;
    }
    for(var j = 0; j < state.config.programs.length; j += 1){
      var entry = student.programs[state.config.programs[j]];
      if(!entry) continue;
      if(entry.status !== '선택') return true;
      if(tidyText(entry.attendance) || tidyText(entry.targetCert) || entry.certResult !== '선택' || tidyText(entry.note)) return true;
    }
    return false;
  }

  function getScopedStudents(){
    var keyword = tidyText(state.filters.keyword).toLowerCase();
    return getAllStudents().filter(function(student){
      if(state.filters.grade !== '전체' && String(student.grade) !== String(state.filters.grade)) return false;
      if(state.filters.dept !== '전체' && student.dept !== state.filters.dept) return false;
      if(keyword){
        var hay = [
          getClassLabel(student.classCode),
          student.classCode,
          student.name,
          student.dept,
          student.number
        ].join(' ').toLowerCase();
        if(hay.indexOf(keyword) < 0) return false;
      }
      return true;
    });
  }

  function toPercent(value, total){
    if(!total) return 0;
    return Math.round((value / total) * 1000) / 10;
  }

  function barHtml(rate, tone){
    var color = tone || 'var(--blue)';
    return '<div class="cert-progress-track"><div class="cert-progress-fill" style="width:' + rate + '%;background:' + color + ';"></div></div>';
  }

  function computeDashboardStats(){
    var scoped = getScopedStudents();
    var certLens = state.filters.cert;
    var programLens = state.filters.program;
    var total = scoped.length;
    var certStudents = 0;
    var programStudents = 0;
    var inputStudents = 0;
    var attendanceSum = 0;
    var attendanceCount = 0;
    var gradeMap = {};
    var classMap = {};
    var certMap = {};
    var programMap = {};

    state.config.certs.forEach(function(name){ certMap[name] = 0; });
    state.config.programs.forEach(function(name){
      programMap[name] = { count: 0, attendanceSum: 0, attendanceCount: 0 };
    });

    scoped.forEach(function(student){
      if(hasCert(student, certLens)) certStudents += 1;
      if(hasProgram(student, programLens)) programStudents += 1;
      if(hasAnyInput(student)) inputStudents += 1;

      var gradeKey = String(student.grade);
      if(!gradeMap[gradeKey]){
        gradeMap[gradeKey] = { grade: student.grade, total: 0, cert: 0, program: 0, input: 0 };
      }
      if(!classMap[student.classCode]){
        classMap[student.classCode] = { code: student.classCode, label: getClassLabel(student.classCode), total: 0, cert: 0, program: 0, input: 0 };
      }

      gradeMap[gradeKey].total += 1;
      classMap[student.classCode].total += 1;

      if(hasCert(student, certLens)){
        gradeMap[gradeKey].cert += 1;
        classMap[student.classCode].cert += 1;
      }
      if(hasProgram(student, programLens)){
        gradeMap[gradeKey].program += 1;
        classMap[student.classCode].program += 1;
      }
      if(hasAnyInput(student)){
        gradeMap[gradeKey].input += 1;
        classMap[student.classCode].input += 1;
      }

      state.config.certs.forEach(function(certName){
        if(student.certs[certName] === '취득') certMap[certName] += 1;
      });

      state.config.programs.forEach(function(programName){
        var entry = student.programs[programName];
        if(!entry) return;
        if(entry.status === '참여') programMap[programName].count += 1;
        var num = parseFloat(String(entry.attendance || '').replace(/%/g, ''));
        if(!isNaN(num)){
          programMap[programName].attendanceSum += num;
          programMap[programName].attendanceCount += 1;
          attendanceSum += num;
          attendanceCount += 1;
        }
      });
    });

    var grades = Object.keys(gradeMap).map(function(key){
      var item = gradeMap[key];
      item.certRate = toPercent(item.cert, item.total);
      item.programRate = toPercent(item.program, item.total);
      item.inputRate = toPercent(item.input, item.total);
      return item;
    }).sort(function(a, b){ return a.grade - b.grade; });

    var classes = Object.keys(classMap).map(function(code){
      var item = classMap[code];
      item.certRate = toPercent(item.cert, item.total);
      item.programRate = toPercent(item.program, item.total);
      item.inputRate = toPercent(item.input, item.total);
      return item;
    }).sort(function(a, b){ return a.code.localeCompare(b.code); });

    var certs = state.config.certs.map(function(name){
      return { name: name, count: certMap[name] || 0, rate: toPercent(certMap[name] || 0, total) };
    }).sort(function(a, b){ return b.count - a.count; });

    var programs = state.config.programs.map(function(name){
      var item = programMap[name] || { count: 0, attendanceSum: 0, attendanceCount: 0 };
      var avg = item.attendanceCount ? Math.round((item.attendanceSum / item.attendanceCount) * 10) / 10 : 0;
      return {
        name: name,
        count: item.count,
        rate: toPercent(item.count, total),
        avgAttendance: avg,
        targetCert: getProgramMeta(name).targetCert || ''
      };
    }).sort(function(a, b){ return b.count - a.count; });

    var concerns = classes.slice().sort(function(a, b){
      if(a.inputRate !== b.inputRate) return a.inputRate - b.inputRate;
      return a.certRate - b.certRate;
    }).slice(0, 5);

    return {
      students: scoped,
      total: total,
      certStudents: certStudents,
      programStudents: programStudents,
      inputStudents: inputStudents,
      certRate: toPercent(certStudents, total),
      programRate: toPercent(programStudents, total),
      inputRate: toPercent(inputStudents, total),
      avgAttendance: attendanceCount ? Math.round((attendanceSum / attendanceCount) * 10) / 10 : 0,
      grades: grades,
      classes: classes,
      certs: certs,
      programs: programs,
      concerns: concerns
    };
  }

  function renderKpiCard(title, value, sub, tone){
    return '' +
      '<div class="cert-kpi-card">' +
        '<div class="cert-kpi-label">' + esc(title) + '</div>' +
        '<div class="cert-kpi-value" style="color:' + (tone || 'var(--blue)') + ';">' + esc(value) + '</div>' +
        '<div class="cert-kpi-sub">' + esc(sub) + '</div>' +
      '</div>';
  }

  function renderFilterSelect(id, value, options, label){
    var html = '<label class="cert-inline-field"><span>' + esc(label) + '</span><select class="ti-sel" onchange="PageCertCenter.setFilter(\'' + id + '\', this.value)">';
    options.forEach(function(option){
      html += '<option value="' + esc(option) + '"' + (String(value) === String(option) ? ' selected' : '') + '>' + esc(option) + '</option>';
    });
    html += '</select></label>';
    return html;
  }

  function renderDashboard(){
    var stats = computeDashboardStats();
    var deptOptions = ['전체'];
    CLASS_INFO.forEach(function(meta){
      if(deptOptions.indexOf(meta.dept) < 0) deptOptions.push(meta.dept);
    });

    var html = '' +
      '<div class="card cert-hero">' +
        '<div>' +
          '<div class="cert-eyebrow">교원 공통 업로드형 운영</div>' +
          '<div class="cert-hero-title">자격증 · 방과후 통합 관리</div>' +
          '<div class="cert-hero-sub">반별 업로드, 방과후 업로드, 직접 입력이 한 통계로 합쳐집니다. 마지막 동기화: ' + esc(formatDateTime(state.lastSync || new Date().toISOString())) + '</div>' +
        '</div>' +
        '<div class="cert-hero-actions">' +
          '<button class="a-btn primary" onclick="PageCertCenter.printOverall()">통합 보고서 인쇄</button>' +
          '<button class="a-btn outline" onclick="PageCertCenter.printSelectedGrade()">선택 학년 인쇄</button>' +
          '<button class="a-btn outline" onclick="PageCertCenter.refresh()">새로 불러오기</button>' +
        '</div>' +
      '</div>';

    html += '<div class="card">' +
      '<div class="card-h">조건 검색과 도움말<span class="right">필터를 바꾸면 표와 그래프가 함께 갱신됩니다.</span></div>' +
      '<div class="filter-row">' +
        renderFilterSelect('grade', state.filters.grade, ['전체', '1', '2', '3'], '학년') +
        renderFilterSelect('dept', state.filters.dept, deptOptions, '학과') +
        renderFilterSelect('cert', state.filters.cert, ['전체'].concat(state.config.certs), '자격증') +
        renderFilterSelect('program', state.filters.program, ['전체'].concat(state.config.programs), '방과후') +
        '<label class="cert-inline-field cert-grow"><span>검색</span><input class="ti-input" value="' + esc(state.filters.keyword) + '" placeholder="학반, 학생 이름, 학과 검색" oninput="PageCertCenter.setFilter(\'keyword\', this.value)"></label>' +
        '<button class="a-btn outline" onclick="PageCertCenter.clearFilters()">초기화</button>' +
      '</div>' +
      '<details class="cert-help">' +
        '<summary>이 화면에서 무엇을 볼 수 있나요?</summary>' +
        '<ul>' +
          '<li>위 카드 숫자는 현재 필터 범위 안에서 집계한 전체 학생 수, 자격증 취득 학생 수, 방과후 참여 학생 수, 실제 입력률입니다.</li>' +
          '<li>산점도는 반별 방과후 참여율과 자격증 취득률의 관계를 한 번에 보여줍니다. 오른쪽 위로 갈수록 두 지표가 함께 좋은 반입니다.</li>' +
          '<li>문제가 보이는 반은 표의 반명 버튼을 눌러 바로 반별 입력 시트로 이동할 수 있습니다.</li>' +
        '</ul>' +
      '</details>' +
    '</div>';

    html += '<div class="cert-kpi-grid">' +
      renderKpiCard('학생 수', stats.total + '명', '현재 조건에 포함된 학생', 'var(--blue)') +
      renderKpiCard('자격증 취득', stats.certStudents + '명', '취득률 ' + stats.certRate + '%', 'var(--green)') +
      renderKpiCard('방과후 참여', stats.programStudents + '명', '참여율 ' + stats.programRate + '%', 'var(--orange)') +
      renderKpiCard('입력률', stats.inputRate + '%', '평균 출석률 ' + stats.avgAttendance + '%', 'var(--purple)') +
    '</div>';

    html += '<div class="cert-pane-grid">';

    html += '<div class="card">' +
      '<div class="card-h">학년별 입력 현황</div>';
    if(!stats.grades.length){
      html += '<div class="cert-empty">표시할 데이터가 없습니다.</div>';
    }else{
      stats.grades.forEach(function(item){
        html += '<div class="cert-list-row">' +
          '<div class="cert-list-title">' + item.grade + '학년</div>' +
          '<div class="cert-list-metrics">입력 ' + item.inputRate + '% · 취득 ' + item.certRate + '% · 참여 ' + item.programRate + '%</div>' +
          barHtml(item.inputRate, 'linear-gradient(90deg,var(--blue),#6fa8ff)') +
        '</div>';
      });
    }
    html += '</div>';

    html += '<div class="card">' +
      '<div class="card-h">문제 짚기</div>';
    if(!stats.concerns.length){
      html += '<div class="cert-empty">표시할 데이터가 없습니다.</div>';
    }else{
      stats.concerns.forEach(function(item){
        html += '<button class="cert-alert-row" onclick="PageCertCenter.openClass(\'' + quote(item.code) + '\')">' +
          '<span>' + esc(item.label) + '</span>' +
          '<span>입력 ' + item.inputRate + '% · 취득 ' + item.certRate + '%</span>' +
        '</button>';
      });
    }
    html += '</div>';

    html += '</div>';

    html += '<div class="cert-pane-grid">';

    html += '<div class="card">' +
      '<div class="card-h">자격증별 취득 현황</div>' +
      '<div class="cert-scroll-area">';
    if(!stats.certs.length){
      html += '<div class="cert-empty">자격증 항목이 없습니다.</div>';
    }else{
      stats.certs.forEach(function(item, index){
        var tone = index % 2 === 0 ? 'var(--green)' : 'var(--cyan)';
        html += '<div class="cert-list-row">' +
          '<div class="cert-list-title">' + esc(item.name) + '</div>' +
          '<div class="cert-list-metrics">' + item.count + '명 (' + item.rate + '%)</div>' +
          barHtml(item.rate, tone) +
        '</div>';
      });
    }
    html += '</div></div>';

    html += '<div class="card">' +
      '<div class="card-h">방과후 참여 현황</div>' +
      '<div class="cert-scroll-area">';
    if(!stats.programs.length){
      html += '<div class="cert-empty">방과후 항목이 없습니다.</div>';
    }else{
      stats.programs.forEach(function(item){
        html += '<div class="cert-list-row">' +
          '<div class="cert-list-title">' + esc(item.name) + '</div>' +
          '<div class="cert-list-metrics">' + item.count + '명 · 평균 출석 ' + item.avgAttendance + '%' + (item.targetCert ? ' · 목표 ' + esc(item.targetCert) : '') + '</div>' +
          barHtml(item.rate, 'linear-gradient(90deg,var(--orange),#f7b267)') +
        '</div>';
      });
    }
    html += '</div></div>';

    html += '</div>';

    html += '<div class="card">' +
      '<div class="card-h">반별 비교와 상관관계<span class="right">방과후 참여율과 자격증 취득률을 함께 봅니다.</span></div>' +
      '<div class="cert-dashboard-grid">' +
        '<div class="cert-table-shell">' +
          '<table class="a-table cert-summary-table">' +
            '<thead><tr><th>반</th><th>입력률</th><th>참여율</th><th>취득률</th><th></th></tr></thead>' +
            '<tbody>';
    if(!stats.classes.length){
      html += '<tr><td colspan="5">표시할 반이 없습니다.</td></tr>';
    }else{
      stats.classes.forEach(function(item){
        html += '<tr>' +
          '<td>' + esc(item.label) + '</td>' +
          '<td>' + item.inputRate + '%</td>' +
          '<td>' + item.programRate + '%</td>' +
          '<td>' + item.certRate + '%</td>' +
          '<td><button class="a-btn sm outline" onclick="PageCertCenter.openClass(\'' + quote(item.code) + '\')">열기</button></td>' +
        '</tr>';
      });
    }
    html += '</tbody></table>' +
        '</div>' +
        '<div>' +
          '<canvas id="certScatterCanvas" class="cert-chart" width="760" height="340"></canvas>' +
          '<div class="cert-chart-note">가로축: 방과후 참여율 / 세로축: 자격증 취득률 / 점 크기: 입력률</div>' +
        '</div>' +
      '</div>' +
    '</div>';

    return html;
  }

  function renderClassSelector(currentCode){
    var html = '<div class="chips">';
    CLASS_INFO.forEach(function(meta){
      html += '<button class="chip' + (meta.code === currentCode ? ' on' : '') + '" onclick="PageCertCenter.openClass(\'' + quote(meta.code) + '\')">' + esc(meta.code) + '</button>';
    });
    html += '</div>';
    return html;
  }

  function getClassProgress(doc){
    var total = doc.students.length;
    var input = 0;
    doc.students.forEach(function(student){
      if(hasAnyInput(student)) input += 1;
    });
    return {
      total: total,
      input: input,
      rate: toPercent(input, total)
    };
  }

  function renderSheet(){
    var doc = ensureClassDoc(state.selectedClass);
    var progress = getClassProgress(doc);
    var html = '' +
      '<div class="card">' +
        '<div class="card-h">반별 직접 입력<span class="right">' + esc(getClassLabel(state.selectedClass)) + '</span></div>' +
        renderClassSelector(state.selectedClass) +
        '<div class="cert-toolbar-row">' +
          '<div class="cert-status-badge">학생 수 ' + doc.students.length + '명</div>' +
          '<div class="cert-status-badge">입력률 ' + progress.rate + '%</div>' +
          '<div class="cert-status-badge">저장 담당 ' + esc(doc.updatedBy || '미기록') + '</div>' +
          '<button class="a-btn outline" onclick="PageCertCenter.downloadCurrentClassCsv()">현재 반 CSV 내보내기</button>' +
          '<button class="a-btn primary" onclick="PageCertCenter.printClass()">현재 반 보고서 인쇄</button>' +
        '</div>' +
        '<details class="cert-help">' +
          '<summary>입력 방법 보기</summary>' +
          '<ul>' +
            '<li>자격증은 취득 / 미취득, 방과후는 참여 / 미참여로 선택하면 자동 저장됩니다.</li>' +
            '<li>방과후 출석률, 목표 자격증, 자격증 결과처럼 더 자세한 값은 방과후 업로드 탭에서 한 번에 올릴 수 있습니다.</li>' +
            '<li>비고는 자유롭게 남길 수 있으며 반 진행률 계산에도 반영됩니다.</li>' +
          '</ul>' +
        '</details>' +
      '</div>';

    html += '<div class="card">' +
      '<div class="cert-table-shell cert-table-tall">' +
        '<table class="a-table cert-sheet-table">' +
          '<thead><tr>' +
            '<th class="cert-sticky-1">번호</th>' +
            '<th class="cert-sticky-2">이름</th>';
    state.config.certs.forEach(function(name){
      html += '<th><div class="cert-col-head">' + esc(name) + '</div></th>';
    });
    state.config.programs.forEach(function(name){
      html += '<th><div class="cert-col-head">' + esc(name) + '</div></th>';
    });
    html += '<th>비고</th></tr></thead><tbody>';

    doc.students.forEach(function(student){
      html += '<tr>' +
        '<td class="cert-sticky-1">' + student.number + '</td>' +
        '<td class="cert-sticky-2"><div class="cert-student-name">' + esc(student.name) + '</div><div class="cert-student-sub">' + esc(student.classCode) + '</div></td>';
      state.config.certs.forEach(function(name, certIndex){
        html += '<td><select class="ti-sel" onchange="PageCertCenter.updateCert(\'' + quote(student.id) + '\',' + certIndex + ',this.value)">';
        CERT_OPTIONS.forEach(function(option){
          html += '<option value="' + esc(option) + '"' + (student.certs[name] === option ? ' selected' : '') + '>' + esc(option) + '</option>';
        });
        html += '</select></td>';
      });
      state.config.programs.forEach(function(name, programIndex){
        var entry = student.programs[name] || { status: '선택' };
        html += '<td><select class="ti-sel" onchange="PageCertCenter.updateProgramStatus(\'' + quote(student.id) + '\',' + programIndex + ',this.value)">';
        PROGRAM_OPTIONS.forEach(function(option){
          html += '<option value="' + esc(option) + '"' + (entry.status === option ? ' selected' : '') + '>' + esc(option) + '</option>';
        });
        html += '</select></td>';
      });
      html += '<td><input class="ti-input" value="' + esc(student.note) + '" placeholder="비고" onchange="PageCertCenter.updateNote(\'' + quote(student.id) + '\', this.value)"></td></tr>';
    });

    html += '</tbody></table></div></div>';
    return html;
  }

  function renderCertNameDatalist(){
    var html = '<datalist id="certNameList">';
    state.config.certs.forEach(function(name){
      html += '<option value="' + esc(name) + '"></option>';
    });
    html += '</datalist>';
    return html;
  }

  function renderClassUpload(){
    var html = '' +
      '<div class="card">' +
        '<div class="card-h">반별 업로드</div>' +
        renderClassSelector(state.selectedClass) +
        '<div class="cert-toolbar-row">' +
          '<button class="a-btn outline" onclick="PageCertCenter.downloadClassTemplate()">반별 업로드 양식 다운로드</button>' +
          '<input type="file" id="certClassUploadInput" accept=".csv,.xlsx,.xls">' +
          '<button class="a-btn primary" onclick="PageCertCenter.uploadClassFile()">반별 파일 반영</button>' +
        '</div>' +
        '<details class="cert-help">' +
          '<summary>반별 업로드 양식 설명</summary>' +
          '<ul>' +
            '<li>기본 열은 학반, 번호, 이름, 비고이며 뒤에 현재 등록된 자격증과 방과후 항목이 자동으로 붙습니다.</li>' +
            '<li>자격증 칸은 선택 / 취득 / 미취득, 방과후 칸은 선택 / 참여 / 미참여만 입력하면 됩니다.</li>' +
            '<li>학반 열이 없어도 현재 선택한 반 기준으로 반영할 수 있습니다.</li>' +
          '</ul>' +
        '</details>' +
      '</div>';

    html += '<div class="cert-pane-grid">';

    html += '<div class="card">' +
      '<div class="card-h">자격증 항목 추가</div>' +
      '<div class="cert-inline-form">' +
        '<input class="ti-input" id="certItemInput" placeholder="예: 생산자동화기능사 실기">' +
        '<button class="a-btn primary" onclick="PageCertCenter.addCert()">항목 추가</button>' +
      '</div>' +
      '<div class="cert-chip-list">';
    state.config.certs.forEach(function(name){
      html += '<span class="cert-tag">' + esc(name) + '</span>';
    });
    html += '</div></div>';

    html += '<div class="card">' +
      '<div class="card-h">방과후 항목 추가</div>' +
      '<div class="cert-stack">' +
        '<input class="ti-input" id="programNameInput" list="certProgramList" placeholder="방과후명">' +
        '<input class="ti-input" id="programTeacherInput" placeholder="담당 교사">' +
        '<input class="ti-input" id="programScheduleInput" placeholder="운영 시기 또는 일시">' +
        '<input class="ti-input" id="programTargetCertInput" list="certNameList" placeholder="목표 자격증">' +
        '<button class="a-btn primary" onclick="PageCertCenter.addProgram()">방과후 추가</button>' +
      '</div>' +
      '<div class="cert-chip-list">';
    state.config.programs.forEach(function(name){
      var meta = getProgramMeta(name);
      html += '<div class="cert-meta-card"><div class="cert-meta-name">' + esc(name) + '</div><div class="cert-meta-sub">' +
        (meta.teacher ? '담당 ' + esc(meta.teacher) + ' · ' : '') +
        (meta.schedule ? esc(meta.schedule) + ' · ' : '') +
        (meta.targetCert ? '목표 ' + esc(meta.targetCert) : '목표 미설정') +
      '</div></div>';
    });
    html += '</div></div>';

    html += '</div>';

    html += '<datalist id="certProgramList">';
    state.config.programs.forEach(function(name){
      html += '<option value="' + esc(name) + '"></option>';
    });
    html += '</datalist>';
    html += renderCertNameDatalist();

    return html;
  }

  function renderProgramUpload(){
    var html = '' +
      '<div class="card">' +
        '<div class="card-h">방과후 업로드</div>' +
        '<div class="cert-stack">' +
          '<label class="cert-inline-field cert-grow"><span>방과후명</span><input class="ti-input" list="certProgramListUpload" value="' + esc(state.programDraft.name) + '" placeholder="예: 방과후 용접 실기" onchange="PageCertCenter.setProgramDraft(\'name\', this.value)"></label>' +
          '<label class="cert-inline-field"><span>담당 교사</span><input class="ti-input" value="' + esc(state.programDraft.teacher) + '" onchange="PageCertCenter.setProgramDraft(\'teacher\', this.value)"></label>' +
          '<label class="cert-inline-field"><span>운영 시기</span><input class="ti-input" value="' + esc(state.programDraft.schedule) + '" onchange="PageCertCenter.setProgramDraft(\'schedule\', this.value)"></label>' +
          '<label class="cert-inline-field"><span>목표 자격증</span><input class="ti-input" list="certNameList" value="' + esc(state.programDraft.targetCert) + '" onchange="PageCertCenter.setProgramDraft(\'targetCert\', this.value)"></label>' +
        '</div>' +
        '<div class="cert-toolbar-row">' +
          '<button class="a-btn outline" onclick="PageCertCenter.downloadProgramTemplate()">방과후 업로드 양식 다운로드</button>' +
          '<input type="file" id="certProgramUploadInput" accept=".csv,.xlsx,.xls">' +
          '<button class="a-btn primary" onclick="PageCertCenter.uploadProgramFile()">방과후 파일 반영</button>' +
        '</div>' +
        '<details class="cert-help">' +
          '<summary>방과후 업로드 양식 설명</summary>' +
          '<ul>' +
            '<li>학반, 번호, 이름을 기준으로 학생을 찾고 참여여부, 출석률, 목표 자격증, 자격증 결과, 비고를 반영합니다.</li>' +
            '<li>자격증 결과가 취득 또는 미취득으로 들어오면 동일한 자격증 항목에도 같이 반영됩니다.</li>' +
            '<li>새 목표 자격증을 적으면 자격증 목록에 자동으로 추가할 수 있습니다.</li>' +
          '</ul>' +
        '</details>' +
      '</div>' +
      '<div class="card">' +
        '<div class="card-h">현재 방과후 목록</div>' +
        '<div class="cert-chip-list">';
    if(!state.config.programs.length){
      html += '<div class="cert-empty">등록된 방과후가 없습니다.</div>';
    }else{
      state.config.programs.forEach(function(name){
        var meta = getProgramMeta(name);
        html += '<button class="cert-meta-card cert-meta-button" onclick="PageCertCenter.loadProgramDraft(\'' + quote(name) + '\')">' +
          '<div class="cert-meta-name">' + esc(name) + '</div>' +
          '<div class="cert-meta-sub">' +
            (meta.teacher ? '담당 ' + esc(meta.teacher) + ' · ' : '') +
            (meta.schedule ? esc(meta.schedule) + ' · ' : '') +
            (meta.targetCert ? '목표 ' + esc(meta.targetCert) : '목표 미설정') +
          '</div>' +
        '</button>';
      });
    }
    html += '</div></div>' +
      '<datalist id="certProgramListUpload">';
    state.config.programs.forEach(function(name){
      html += '<option value="' + esc(name) + '"></option>';
    });
    html += '</datalist>' +
      renderCertNameDatalist();
    return html;
  }

  function renderLogs(){
    var html = '' +
      '<div class="card">' +
        '<div class="card-h">업로드 기록<span class="right">누가 언제 무엇을 반영했는지 남깁니다.</span></div>' +
        '<div class="cert-table-shell">' +
          '<table class="a-table cert-summary-table">' +
            '<thead><tr><th>시각</th><th>작성자</th><th>유형</th><th>대상</th><th>메모</th></tr></thead><tbody>';
    if(!state.logs.length){
      html += '<tr><td colspan="5">기록이 아직 없습니다.</td></tr>';
    }else{
      state.logs.forEach(function(item){
        html += '<tr>' +
          '<td>' + esc(formatDateTime(item.updatedAt)) + '</td>' +
          '<td>' + esc(item.updatedBy || '-') + '</td>' +
          '<td>' + esc(item.kind || '-') + '</td>' +
          '<td>' + esc(item.target || '-') + '</td>' +
          '<td>' + esc(item.message || '-') + '</td>' +
        '</tr>';
      });
    }
    html += '</tbody></table></div></div>';
    return html;
  }

  function renderLoading(){
    var pg = document.getElementById('pg');
    if(!pg) return;
    pg.innerHTML = '' +
      '<div class="card cert-loading-card">' +
        '<div class="cert-spinner"></div>' +
        '<div class="cert-loading-text">자격증·방과후 데이터를 불러오는 중입니다.</div>' +
      '</div>';
  }

  function renderTab(id, label){
    return '<button class="chip' + (state.tab === id ? ' on' : '') + '" onclick="PageCertCenter.setTab(\'' + id + '\')">' + esc(label) + '</button>';
  }

  function render(){
    var pg = document.getElementById('pg');
    if(!pg) return;

    if(!state.loaded && !state.loading){
      loadAll();
      renderLoading();
      return;
    }

    var html = '' +
      '<div class="cert-page">' +
        '<div class="cert-tab-row">' +
          renderTab('dashboard', '통합 대시보드') +
          renderTab('sheet', '반별 직접 입력') +
          renderTab('classUpload', '반별 업로드') +
          renderTab('programUpload', '방과후 업로드') +
          renderTab('logs', '업로드 기록') +
        '</div>';

    if(state.tab === 'dashboard') html += renderDashboard();
    if(state.tab === 'sheet') html += renderSheet();
    if(state.tab === 'classUpload') html += renderClassUpload();
    if(state.tab === 'programUpload') html += renderProgramUpload();
    if(state.tab === 'logs') html += renderLogs();

    html += '</div>';
    pg.innerHTML = html;

    if(state.tab === 'dashboard'){
      drawScatterChart();
    }
  }

  function drawScatterChart(){
    var canvas = document.getElementById('certScatterCanvas');
    if(!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext('2d');
    var stats = computeDashboardStats();
    var width = canvas.width;
    var height = canvas.height;
    var padLeft = 58;
    var padRight = 24;
    var padTop = 24;
    var padBottom = 42;
    var plotW = width - padLeft - padRight;
    var plotH = height - padTop - padBottom;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    for(var i = 0; i <= 4; i += 1){
      var x = padLeft + (plotW / 4) * i;
      var y = padTop + (plotH / 4) * i;

      ctx.strokeStyle = '#e8edf3';
      ctx.beginPath();
      ctx.moveTo(x, padTop);
      ctx.lineTo(x, padTop + plotH);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(padLeft, y);
      ctx.lineTo(padLeft + plotW, y);
      ctx.stroke();

      ctx.fillStyle = '#6b7280';
      ctx.font = '12px Noto Sans KR, sans-serif';
      ctx.fillText(String(i * 25), x - 8, padTop + plotH + 18);
      ctx.fillText(String(100 - i * 25), 18, y + 4);
    }

    ctx.strokeStyle = '#8b95a7';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(padLeft, padTop);
    ctx.lineTo(padLeft, padTop + plotH);
    ctx.lineTo(padLeft + plotW, padTop + plotH);
    ctx.stroke();

    ctx.fillStyle = '#22304a';
    ctx.font = '600 13px Noto Sans KR, sans-serif';
    ctx.fillText('방과후 참여율', padLeft + plotW / 2 - 34, height - 10);

    ctx.save();
    ctx.translate(14, padTop + plotH / 2 + 34);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('자격증 취득률', 0, 0);
    ctx.restore();

    stats.classes.forEach(function(item){
      var x = padLeft + (plotW * item.programRate / 100);
      var y = padTop + plotH - (plotH * item.certRate / 100);
      var r = 6 + (item.inputRate / 25);
      ctx.fillStyle = 'rgba(34, 107, 214, 0.18)';
      ctx.beginPath();
      ctx.arc(x, y, r + 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#226bd6';
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#172033';
      ctx.font = '12px Noto Sans KR, sans-serif';
      ctx.fillText(item.code, x + r + 4, y - 2);
    });
  }

  function formatDateTime(value){
    if(!value) return '미기록';
    try{
      var d = new Date(value);
      if(isNaN(d.getTime())) return value;
      return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
    }catch(e){
      return value;
    }
  }

  function loadAll(){
    if(state.loading) return;
    state.loading = true;
    var db = fdb();

    if(!db){
      state.loaded = true;
      state.loading = false;
      state.classes = buildClassState(state.classes, state.rosterMap);
      state.lastSync = new Date().toISOString();
      cacheState();
      render();
      return;
    }

    Promise.all([
      db.collection(META_COLLECTION).doc('config').get().catch(function(){ return null; }),
      db.collection(CLASS_COLLECTION).get().catch(function(){ return null; }),
      db.collection('roster').get().catch(function(){ return null; }),
      db.collection(LOG_COLLECTION).orderBy('updatedAt', 'desc').limit(40).get().catch(function(){ return null; })
    ]).then(function(results){
      var configDoc = results[0];
      var classSnap = results[1];
      var rosterSnap = results[2];
      var logSnap = results[3];
      var rawClasses = {};

      if(classSnap && typeof classSnap.forEach === 'function'){
        classSnap.forEach(function(doc){
          rawClasses[doc.id] = doc.data() || {};
        });
      }

      state.rosterMap = buildRosterMapFromSnapshot(rosterSnap);
      state.config = normalizeConfig(configDoc && configDoc.exists ? configDoc.data() : state.config);
      state.classes = buildClassState(rawClasses, state.rosterMap);
      state.logs = [];

      if(logSnap && typeof logSnap.forEach === 'function'){
        logSnap.forEach(function(doc){
          state.logs.push(doc.data() || {});
        });
      }

      state.loaded = true;
      state.loading = false;
      state.lastSync = new Date().toISOString();
      cacheState();
      render();
    }).catch(function(error){
      console.error('cert center load error:', error);
      state.loaded = true;
      state.loading = false;
      state.classes = buildClassState(state.classes, state.rosterMap);
      state.lastSync = new Date().toISOString();
      cacheState();
      if(typeof toast === 'function') toast('데이터를 불러오는 중 오류가 발생했습니다.');
      render();
    });
  }

  function writeClassDoc(code){
    var db = fdb();
    var doc = ensureClassDoc(code);
    if(!doc) return Promise.resolve();
    doc.updated = new Date().toISOString();
    doc.updatedBy = App.getUser ? (App.getUser() || '') : '';
    cacheState();
    if(!db) return Promise.resolve();
    return db.collection(CLASS_COLLECTION).doc(code).set(doc);
  }

  function saveConfig(){
    var db = fdb();
    state.config.updatedAt = new Date().toISOString();
    state.config.updatedBy = App.getUser ? (App.getUser() || '') : '';
    cacheState();
    if(!db) return Promise.resolve();
    return db.collection(META_COLLECTION).doc('config').set(state.config);
  }

  function queueClassSave(code){
    if(saveTimers[code]) clearTimeout(saveTimers[code]);
    saveTimers[code] = setTimeout(function(){
      writeClassDoc(code).catch(function(error){
        console.error('cert center class save error:', error);
      });
    }, 400);
  }

  function addLog(kind, target, message){
    var item = {
      kind: kind,
      target: target,
      message: message,
      updatedAt: new Date().toISOString(),
      updatedBy: App.getUser ? (App.getUser() || '') : ''
    };
    state.logs.unshift(item);
    state.logs = state.logs.slice(0, 40);
    cacheState();
    var db = fdb();
    if(db){
      db.collection(LOG_COLLECTION).add(item).catch(function(error){
        console.error('cert center log save error:', error);
      });
    }
  }

  function findStudentById(code, studentId){
    var doc = ensureClassDoc(code);
    if(!doc) return null;
    for(var i = 0; i < doc.students.length; i += 1){
      if(doc.students[i].id === studentId) return doc.students[i];
    }
    return null;
  }

  function findStudentByNumber(code, number, createIfMissing){
    var doc = ensureClassDoc(code);
    if(!doc) return null;
    number = parseInt(number, 10) || 0;
    if(!number) return null;
    for(var i = 0; i < doc.students.length; i += 1){
      if(doc.students[i].number === number) return doc.students[i];
    }
    if(!createIfMissing) return null;
    var meta = getClassMeta(code);
    if(!meta) return null;
    var roster = (state.rosterMap[code] && state.rosterMap[code][number - 1]) || {};
    var student = createStudent(meta, number, roster.name || '', null);
    doc.students.push(student);
    doc.students.sort(function(a, b){ return a.number - b.number; });
    return student;
  }

  function parseCsv(text){
    text = String(text || '').replace(/\r/g, '');
    var rows = [];
    var row = [];
    var cell = '';
    var inQuotes = false;
    for(var i = 0; i < text.length; i += 1){
      var ch = text.charAt(i);
      var next = text.charAt(i + 1);
      if(inQuotes){
        if(ch === '"' && next === '"'){
          cell += '"';
          i += 1;
        }else if(ch === '"'){
          inQuotes = false;
        }else{
          cell += ch;
        }
      }else{
        if(ch === '"'){
          inQuotes = true;
        }else if(ch === ','){
          row.push(tidyText(cell));
          cell = '';
        }else if(ch === '\n'){
          row.push(tidyText(cell));
          if(row.join('').trim()) rows.push(row);
          row = [];
          cell = '';
        }else{
          cell += ch;
        }
      }
    }
    row.push(tidyText(cell));
    if(row.join('').trim()) rows.push(row);
    return rows;
  }

  function rowsToObjects(rows){
    if(!rows || !rows.length) return { headers: [], rows: [] };
    var rawHeaders = rows[0];
    var headers = rawHeaders.map(function(item){ return normalizeHeader(item); });
    var list = [];
    for(var i = 1; i < rows.length; i += 1){
      var row = rows[i];
      var obj = {};
      var hasValue = false;
      for(var j = 0; j < headers.length; j += 1){
        var val = row[j] == null ? '' : String(row[j]).trim();
        if(val) hasValue = true;
        obj[headers[j]] = val;
      }
      if(hasValue) list.push(obj);
    }
    return { headers: rawHeaders, rows: list };
  }

  function getField(obj, aliases){
    for(var i = 0; i < aliases.length; i += 1){
      var key = normalizeHeader(aliases[i]);
      if(obj[key] != null && obj[key] !== '') return obj[key];
    }
    return '';
  }

  function ensureSheetJs(callback){
    if(typeof XLSX !== 'undefined'){
      callback();
      return;
    }
    var script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
    script.onload = callback;
    script.onerror = function(){
      if(typeof toast === 'function') toast('Excel 라이브러리를 불러오지 못했습니다.');
    };
    document.head.appendChild(script);
  }

  function parseUploadFile(file, callback){
    if(!file){
      callback('파일을 선택해 주세요.');
      return;
    }
    var name = String(file.name || '').toLowerCase();
    if(name.indexOf('.csv') > -1){
      var reader = new FileReader();
      reader.onload = function(e){
        callback(null, parseCsv(e.target.result));
      };
      reader.readAsText(file, 'UTF-8');
      return;
    }
    if(name.indexOf('.xlsx') > -1 || name.indexOf('.xls') > -1){
      ensureSheetJs(function(){
        var reader = new FileReader();
        reader.onload = function(e){
          try{
            var data = new Uint8Array(e.target.result);
            var workbook = XLSX.read(data, { type: 'array' });
            var sheet = workbook.Sheets[workbook.SheetNames[0]];
            var rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false });
            callback(null, rows);
          }catch(error){
            callback('엑셀 파일을 읽는 중 오류가 발생했습니다.');
          }
        };
        reader.readAsArrayBuffer(file);
      });
      return;
    }
    callback('CSV 또는 Excel 파일만 업로드할 수 있습니다.');
  }

  function findClassCodeFromValue(value){
    value = tidyText(value);
    if(!value) return state.selectedClass;
    for(var i = 0; i < CLASS_INFO.length; i += 1){
      var meta = CLASS_INFO[i];
      if(value === meta.code) return meta.code;
      if(value === getClassLabel(meta.code)) return meta.code;
    }
    return value;
  }

  function maybeAddCertItem(name){
    name = tidyText(name);
    if(!name) return false;
    if(state.config.certs.indexOf(name) >= 0) return false;
    state.config.certs.push(name);
    CLASS_INFO.forEach(function(meta){
      var doc = ensureClassDoc(meta.code);
      doc.students.forEach(function(student){
        student.certs[name] = '선택';
      });
    });
    return true;
  }

  function maybeAddProgramItem(name, teacher, schedule, targetCert){
    name = tidyText(name);
    if(!name) return false;
    if(state.config.programs.indexOf(name) < 0){
      state.config.programs.push(name);
    }
    state.config.programMeta[name] = {
      teacher: tidyText(teacher || ''),
      schedule: tidyText(schedule || ''),
      targetCert: tidyText(targetCert || '')
    };
    CLASS_INFO.forEach(function(meta){
      var doc = ensureClassDoc(meta.code);
      doc.students.forEach(function(student){
        if(!student.programs[name]){
          student.programs[name] = {
            status: '선택',
            attendance: '',
            targetCert: tidyText(targetCert || ''),
            certResult: '선택',
            note: '',
            updatedAt: '',
            updatedBy: ''
          };
        }
      });
    });
    return true;
  }

  function csvEscape(value){
    value = String(value == null ? '' : value);
    if(value.indexOf(',') >= 0 || value.indexOf('"') >= 0 || value.indexOf('\n') >= 0){
      return '"' + value.replace(/"/g, '""') + '"';
    }
    return value;
  }

  function downloadCsv(filename, rows){
    var csv = '\uFEFF' + rows.map(function(row){
      return row.map(csvEscape).join(',');
    }).join('\n');
    var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
  }

  function buildClassRowsForExport(code){
    var doc = ensureClassDoc(code);
    var rows = [];
    var header = ['학반', '번호', '이름', '비고'];
    state.config.certs.forEach(function(name){ header.push(name); });
    state.config.programs.forEach(function(name){ header.push(name); });
    rows.push(header);
    doc.students.forEach(function(student){
      var row = [code, student.number, student.name, student.note || ''];
      state.config.certs.forEach(function(name){
        row.push(student.certs[name] || '선택');
      });
      state.config.programs.forEach(function(name){
        var entry = student.programs[name] || { status: '선택' };
        row.push(entry.status || '선택');
      });
      rows.push(row);
    });
    return rows;
  }

  function buildProgramRowsForExport(name, teacher, schedule, targetCert){
    var rows = [[
      '학반', '번호', '이름', '방과후명', '담당교사', '운영시기', '참여여부', '출석률', '목표자격증', '자격증결과', '비고'
    ]];
    getAllStudents().forEach(function(student){
      var entry = student.programs[name] || { status: '선택', attendance: '', targetCert: targetCert || '', certResult: '선택', note: '' };
      rows.push([
        student.classCode,
        student.number,
        student.name,
        name,
        teacher || '',
        schedule || '',
        entry.status || '선택',
        entry.attendance || '',
        entry.targetCert || targetCert || '',
        entry.certResult || '선택',
        entry.note || ''
      ]);
    });
    return rows;
  }

  function reportHead(title){
    return '<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><title>' + esc(title) + '</title><style>' +
      '@page{size:A4 portrait;margin:14mm}' +
      'body{font-family:"Noto Sans KR",sans-serif;color:#162033;margin:0}' +
      'h1{font-size:22px;margin:0 0 8px}' +
      'h2{font-size:15px;margin:20px 0 8px}' +
      '.meta{font-size:12px;color:#5b6576;margin-bottom:14px}' +
      '.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:16px}' +
      '.card{border:1px solid #d9e0ea;border-radius:12px;padding:12px;background:#f7fafc}' +
      '.label{font-size:11px;color:#5b6576;margin-bottom:6px}' +
      '.value{font-size:20px;font-weight:700;color:#1d4ed8}' +
      'table{width:100%;border-collapse:collapse;font-size:11px}' +
      'th,td{border:1px solid #d9e0ea;padding:7px 8px;text-align:left;vertical-align:top}' +
      'th{background:#eef4fb;font-weight:700}' +
      '.foot{margin-top:18px;font-size:11px;color:#687385}' +
      '</style></head><body>';
  }

  function reportCard(label, value){
    return '<div class="card"><div class="label">' + esc(label) + '</div><div class="value">' + esc(value) + '</div></div>';
  }

  function reportTable(headers, rows){
    var html = '<table><thead><tr>';
    headers.forEach(function(head){ html += '<th>' + esc(head) + '</th>'; });
    html += '</tr></thead><tbody>';
    if(!rows.length){
      html += '<tr><td colspan="' + headers.length + '">표시할 데이터가 없습니다.</td></tr>';
    }else{
      rows.forEach(function(row){
        html += '<tr>';
        row.forEach(function(cell){
          html += '<td>' + esc(cell) + '</td>';
        });
        html += '</tr>';
      });
    }
    html += '</tbody></table>';
    return html;
  }

  function reportFoot(){
    return '<div class="foot">브라우저 인쇄 메뉴에서 PDF 저장을 선택하면 A4 보고서로 보관할 수 있습니다.</div></body></html>';
  }

  function currentFilterLabel(){
    return [
      state.filters.grade === '전체' ? '전체 학년' : state.filters.grade + '학년',
      state.filters.dept === '전체' ? '전체 학과' : state.filters.dept,
      state.filters.cert === '전체' ? '전체 자격증' : state.filters.cert,
      state.filters.program === '전체' ? '전체 방과후' : state.filters.program
    ].join(' / ');
  }

  function buildOverviewReportHtml(){
    var stats = computeDashboardStats();
    var html = reportHead('자격증·방과후 통합 보고서');
    html += '<h1>경북기계금속고등학교 자격증·방과후 통합 보고서</h1>';
    html += '<div class="meta">생성시각: ' + esc(formatDateTime(new Date().toISOString())) + ' / 범위: ' + esc(currentFilterLabel()) + '</div>';
    html += '<div class="grid">';
    html += reportCard('학생 수', stats.total + '명');
    html += reportCard('자격증 취득', stats.certStudents + '명 (' + stats.certRate + '%)');
    html += reportCard('방과후 참여', stats.programStudents + '명 (' + stats.programRate + '%)');
    html += reportCard('입력률', stats.inputRate + '%');
    html += '</div>';
    html += '<h2>학년별 현황</h2>' + reportTable(['학년', '학생 수', '입력률', '참여율', '취득률'], stats.grades.map(function(item){ return [item.grade + '학년', item.total + '명', item.inputRate + '%', item.programRate + '%', item.certRate + '%']; }));
    html += '<h2>반별 비교</h2>' + reportTable(['반', '학생 수', '입력률', '참여율', '취득률'], stats.classes.map(function(item){ return [item.label, item.total + '명', item.inputRate + '%', item.programRate + '%', item.certRate + '%']; }));
    html += '<h2>자격증별 취득 현황</h2>' + reportTable(['자격증', '취득 학생 수', '비율'], stats.certs.map(function(item){ return [item.name, item.count + '명', item.rate + '%']; }));
    html += '<h2>방과후 참여 현황</h2>' + reportTable(['방과후', '참여 학생 수', '평균 출석률', '목표 자격증'], stats.programs.map(function(item){ return [item.name, item.count + '명', item.avgAttendance + '%', item.targetCert || '-']; }));
    html += reportFoot();
    return html;
  }

  function buildGradeReportHtml(grade){
    var prev = state.filters.grade;
    state.filters.grade = String(grade);
    var stats = computeDashboardStats();
    state.filters.grade = prev;

    var html = reportHead(grade + '학년 보고서');
    html += '<h1>' + grade + '학년 자격증·방과후 보고서</h1>';
    html += '<div class="meta">생성시각: ' + esc(formatDateTime(new Date().toISOString())) + '</div>';
    html += '<div class="grid">';
    html += reportCard('학생 수', stats.total + '명');
    html += reportCard('자격증 취득', stats.certStudents + '명 (' + stats.certRate + '%)');
    html += reportCard('방과후 참여', stats.programStudents + '명 (' + stats.programRate + '%)');
    html += reportCard('입력률', stats.inputRate + '%');
    html += '</div>';
    html += '<h2>반별 비교</h2>' + reportTable(['반', '학생 수', '입력률', '참여율', '취득률'], stats.classes.map(function(item){ return [item.label, item.total + '명', item.inputRate + '%', item.programRate + '%', item.certRate + '%']; }));
    html += reportFoot();
    return html;
  }

  function buildClassReportHtml(code){
    var doc = ensureClassDoc(code);
    var progress = getClassProgress(doc);
    var html = reportHead(getClassLabel(code) + ' 보고서');
    html += '<h1>' + esc(getClassLabel(code)) + ' 보고서</h1>';
    html += '<div class="meta">생성시각: ' + esc(formatDateTime(new Date().toISOString())) + ' / 입력률 ' + progress.rate + '%</div>';
    html += '<h2>학생별 현황</h2>';
    var headers = ['번호', '이름', '비고'];
    if(state.config.certs.length) headers.push('자격증 취득');
    if(state.config.programs.length) headers.push('방과후 참여');
    html += reportTable(headers, doc.students.map(function(student){
      var row = [student.number + '번', student.name, student.note || '-'];
      if(state.config.certs.length){
        row.push(state.config.certs.filter(function(name){ return student.certs[name] === '취득'; }).join(', ') || '-');
      }
      if(state.config.programs.length){
        row.push(state.config.programs.filter(function(name){ return student.programs[name] && student.programs[name].status === '참여'; }).join(', ') || '-');
      }
      return row;
    }));
    html += reportFoot();
    return html;
  }

  function openPrintWindow(html){
    var win = window.open('', '_blank', 'width=1024,height=900');
    if(!win){
      if(typeof toast === 'function') toast('팝업 차단을 해제한 뒤 다시 시도해 주세요.');
      return;
    }
    win.document.open();
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(function(){ win.print(); }, 300);
  }

  return {
    render: render,
    setTab: function(tab){ state.tab = tab; render(); },
    openClass: function(code){ state.selectedClass = code; state.tab = 'sheet'; render(); },
    setFilter: function(key, value){ state.filters[key] = value; render(); },
    clearFilters: function(){ state.filters = { grade: '전체', dept: '전체', cert: '전체', program: '전체', keyword: '' }; render(); },
    refresh: function(){ state.loaded = false; loadAll(); renderLoading(); },
    updateCert: function(studentId, certIndex, value){
      var certName = state.config.certs[certIndex];
      var student = findStudentById(state.selectedClass, studentId);
      if(!student || !certName) return;
      student.certs[certName] = normalizeCertStatus(value);
      queueClassSave(state.selectedClass);
      render();
    },
    updateProgramStatus: function(studentId, programIndex, value){
      var programName = state.config.programs[programIndex];
      var student = findStudentById(state.selectedClass, studentId);
      if(!student || !programName) return;
      if(!student.programs[programName]) student.programs[programName] = { status: '선택', attendance: '', targetCert: getProgramMeta(programName).targetCert || '', certResult: '선택', note: '', updatedAt: '', updatedBy: '' };
      student.programs[programName].status = normalizeProgramStatus(value);
      student.programs[programName].updatedAt = new Date().toISOString();
      student.programs[programName].updatedBy = App.getUser ? (App.getUser() || '') : '';
      queueClassSave(state.selectedClass);
      render();
    },
    updateNote: function(studentId, value){
      var student = findStudentById(state.selectedClass, studentId);
      if(!student) return;
      student.note = tidyText(value);
      queueClassSave(state.selectedClass);
      render();
    },
    addCert: function(){
      var input = document.getElementById('certItemInput');
      var name = tidyText(input && input.value);
      if(!name){ if(typeof toast === 'function') toast('자격증 항목명을 입력해 주세요.'); return; }
      if(!maybeAddCertItem(name)){ if(typeof toast === 'function') toast('이미 등록된 자격증입니다.'); return; }
      saveConfig().then(function(){ addLog('항목 추가', '자격증', name + ' 항목을 추가했습니다.'); });
      if(input) input.value = '';
      render();
    },
    addProgram: function(){
      var name = tidyText((document.getElementById('programNameInput') || {}).value);
      var teacher = tidyText((document.getElementById('programTeacherInput') || {}).value);
      var schedule = tidyText((document.getElementById('programScheduleInput') || {}).value);
      var targetCert = tidyText((document.getElementById('programTargetCertInput') || {}).value);
      if(!name){ if(typeof toast === 'function') toast('방과후명을 입력해 주세요.'); return; }
      if(targetCert) maybeAddCertItem(targetCert);
      maybeAddProgramItem(name, teacher, schedule, targetCert);
      saveConfig().then(function(){ addLog('항목 추가', '방과후', name + ' 항목을 추가했습니다.'); });
      ['programNameInput','programTeacherInput','programScheduleInput','programTargetCertInput'].forEach(function(id){
        var el = document.getElementById(id);
        if(el) el.value = '';
      });
      render();
    },
    downloadClassTemplate: function(){ downloadCsv(state.selectedClass + '_자격증방과후_업로드양식.csv', buildClassRowsForExport(state.selectedClass)); },
    uploadClassFile: function(){
      var input = document.getElementById('certClassUploadInput');
      var file = input && input.files && input.files[0];
      parseUploadFile(file, function(error, rows){
        if(error){ if(typeof toast === 'function') toast(error); return; }
        var parsed = rowsToObjects(rows);
        if(!parsed.rows.length){ if(typeof toast === 'function') toast('반영할 행이 없습니다.'); return; }
        var changed = {};
        var count = 0;
        parsed.rows.forEach(function(row){
          var classCode = findClassCodeFromValue(getField(row, ['학반', '반', 'class', 'classcode'])) || state.selectedClass;
          var doc = ensureClassDoc(classCode);
          if(!doc) return;
          var number = parseInt(getField(row, ['번호', 'num', 'number']), 10) || 0;
          if(!number) return;
          var student = findStudentByNumber(classCode, number, true);
          var name = tidyText(getField(row, ['이름', 'name']));
          if(name) student.name = name;
          student.note = tidyText(getField(row, ['비고', 'note', 'memo'])) || student.note;
          state.config.certs.forEach(function(certName){
            var value = row[normalizeHeader(certName)];
            if(value != null && value !== '') student.certs[certName] = normalizeCertStatus(value);
          });
          state.config.programs.forEach(function(programName){
            var value = row[normalizeHeader(programName)];
            if(value != null && value !== ''){
              if(!student.programs[programName]) student.programs[programName] = { status: '선택', attendance: '', targetCert: getProgramMeta(programName).targetCert || '', certResult: '선택', note: '', updatedAt: '', updatedBy: '' };
              student.programs[programName].status = normalizeProgramStatus(value);
            }
          });
          changed[classCode] = true;
          count += 1;
        });
        Promise.all(Object.keys(changed).map(writeClassDoc)).then(function(){
          addLog('반별 업로드', state.selectedClass, (file && file.name ? file.name : '파일') + ' 반영, ' + count + '행 처리');
          render();
          if(typeof toast === 'function') toast('반별 업로드가 반영되었습니다.');
        }).catch(function(saveError){
          console.error(saveError);
          if(typeof toast === 'function') toast('업로드 저장 중 오류가 발생했습니다.');
        });
      });
    },
    setProgramDraft: function(key, value){
      state.programDraft[key] = tidyText(value);
      if(key === 'name'){
        var meta = getProgramMeta(state.programDraft.name);
        if(meta && state.config.programMeta[state.programDraft.name]){
          state.programDraft.teacher = meta.teacher || '';
          state.programDraft.schedule = meta.schedule || '';
          state.programDraft.targetCert = meta.targetCert || '';
        }
      }
      render();
    },
    loadProgramDraft: function(name){
      var meta = getProgramMeta(name);
      state.programDraft = { name: name, teacher: meta.teacher || '', schedule: meta.schedule || '', targetCert: meta.targetCert || '' };
      render();
    },
    downloadProgramTemplate: function(){
      var name = tidyText(state.programDraft.name);
      if(!name){ if(typeof toast === 'function') toast('먼저 방과후명을 입력해 주세요.'); return; }
      downloadCsv(name + '_방과후_업로드양식.csv', buildProgramRowsForExport(name, state.programDraft.teacher, state.programDraft.schedule, state.programDraft.targetCert));
    },
    uploadProgramFile: function(){
      var input = document.getElementById('certProgramUploadInput');
      var file = input && input.files && input.files[0];
      var draftName = tidyText(state.programDraft.name);
      if(!draftName){ if(typeof toast === 'function') toast('방과후명을 먼저 입력해 주세요.'); return; }
      parseUploadFile(file, function(error, rows){
        if(error){ if(typeof toast === 'function') toast(error); return; }
        var parsed = rowsToObjects(rows);
        if(!parsed.rows.length){ if(typeof toast === 'function') toast('반영할 행이 없습니다.'); return; }
        var programName = draftName;
        var teacher = tidyText(state.programDraft.teacher);
        var schedule = tidyText(state.programDraft.schedule);
        var targetCert = tidyText(state.programDraft.targetCert);
        if(targetCert) maybeAddCertItem(targetCert);
        maybeAddProgramItem(programName, teacher, schedule, targetCert);
        var changed = {};
        var count = 0;
        parsed.rows.forEach(function(row){
          var rowProgram = tidyText(getField(row, ['방과후명', '프로그램', 'program'])) || programName;
          var rowTeacher = tidyText(getField(row, ['담당교사', '담당', 'teacher'])) || teacher;
          var rowSchedule = tidyText(getField(row, ['운영시기', '일시', 'schedule'])) || schedule;
          var rowTargetCert = tidyText(getField(row, ['목표자격증', '목표자격', 'targetcert'])) || targetCert;
          var rowStatus = normalizeProgramStatus(getField(row, ['참여여부', '참여상태', 'status']) || '선택');
          var rowAttendance = normalizeAttendance(getField(row, ['출석률', 'attendance']));
          var rowCertResult = normalizeCertStatus(getField(row, ['자격증결과', '자격증취득', '결과', 'certresult']));
          var rowNote = tidyText(getField(row, ['비고', 'note', 'memo']));
          var classCode = findClassCodeFromValue(getField(row, ['학반', '반', 'class', 'classcode']));
          var number = parseInt(getField(row, ['번호', 'num', 'number']), 10) || 0;
          if(!classCode || !number) return;
          if(rowTargetCert) maybeAddCertItem(rowTargetCert);
          maybeAddProgramItem(rowProgram, rowTeacher, rowSchedule, rowTargetCert);
          var student = findStudentByNumber(classCode, number, true);
          if(!student) return;
          var name = tidyText(getField(row, ['이름', 'name']));
          if(name) student.name = name;
          if(!student.programs[rowProgram]){
            student.programs[rowProgram] = { status: '선택', attendance: '', targetCert: rowTargetCert, certResult: '선택', note: '', updatedAt: '', updatedBy: '' };
          }
          student.programs[rowProgram].status = rowStatus;
          student.programs[rowProgram].attendance = rowAttendance;
          student.programs[rowProgram].targetCert = rowTargetCert;
          student.programs[rowProgram].certResult = rowCertResult;
          student.programs[rowProgram].note = rowNote;
          student.programs[rowProgram].updatedAt = new Date().toISOString();
          student.programs[rowProgram].updatedBy = App.getUser ? (App.getUser() || '') : '';
          if(rowTargetCert){ student.certs[rowTargetCert] = rowCertResult !== '선택' ? rowCertResult : student.certs[rowTargetCert]; }
          changed[classCode] = true;
          count += 1;
        });
        saveConfig().then(function(){ return Promise.all(Object.keys(changed).map(writeClassDoc)); }).then(function(){
          addLog('방과후 업로드', programName, (file && file.name ? file.name : '파일') + ' 반영, ' + count + '행 처리');
          render();
          if(typeof toast === 'function') toast('방과후 업로드가 반영되었습니다.');
        }).catch(function(saveError){
          console.error(saveError);
          if(typeof toast === 'function') toast('방과후 저장 중 오류가 발생했습니다.');
        });
      });
    },
    downloadCurrentClassCsv: function(){ downloadCsv(state.selectedClass + '_현재현황.csv', buildClassRowsForExport(state.selectedClass)); },
    printOverall: function(){ openPrintWindow(buildOverviewReportHtml()); },
    printSelectedGrade: function(){
      if(state.filters.grade === '전체'){ if(typeof toast === 'function') toast('학년 필터를 먼저 선택해 주세요.'); return; }
      openPrintWindow(buildGradeReportHtml(state.filters.grade));
    },
    printClass: function(){ openPrintWindow(buildClassReportHtml(state.selectedClass)); }
  };
})();
