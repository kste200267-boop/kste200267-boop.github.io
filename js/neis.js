// js/neis.js — 나이스 교육정보 API 연동
var Neis = (function() {
  var KEY = '090d1bde6d4d4e44a10ab8b7c1e43b39';
  var BASE = 'https://open.neis.go.kr/hub';
  // 경북교육청
  var OFFICE = 'R10';
  var SCHOOL_CODE = null; // 최초 실행 시 자동 검색
  var SCHOOL_NAME = '경북기계금속고등학교';

  function pad(n) { return String(n).padStart(2, '0'); }
  function ymd(d) { return d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()); }

  // 학교 코드 자동 검색 (최초 1회)
  function ensureSchoolCode(cb) {
    if (SCHOOL_CODE) { cb(); return; }
    // 로컬 캐시 확인
    var cached = Store.get('neis-school-code', null);
    if (cached) { SCHOOL_CODE = cached; cb(); return; }

    var url = BASE + '/schoolInfo?KEY=' + KEY + '&Type=json&pIndex=1&pSize=5&ATPT_OFCDC_SC_CODE=' + OFFICE + '&SCHUL_NM=' + encodeURIComponent(SCHOOL_NAME);
    fetch(url).then(function(r) { return r.json(); }).then(function(data) {
      try {
        var rows = data.schoolInfo[1].row;
        SCHOOL_CODE = rows[0].SD_SCHUL_CODE;
        Store.set('neis-school-code', SCHOOL_CODE);
        cb();
      } catch (e) {
        console.error('학교 코드 검색 실패', e);
        cb();
      }
    }).catch(function(e) { console.error('NEIS API 오류', e); cb(); });
  }

  // 급식 조회
  function getMeals(from, to, cb) {
    ensureSchoolCode(function() {
      if (!SCHOOL_CODE) { cb([]); return; }
      var url = BASE + '/mealServiceDietInfo?KEY=' + KEY + '&Type=json&pIndex=1&pSize=100'
        + '&ATPT_OFCDC_SC_CODE=' + OFFICE
        + '&SD_SCHUL_CODE=' + SCHOOL_CODE
        + '&MLSV_FROM_YMD=' + from
        + '&MLSV_TO_YMD=' + to;
      fetch(url).then(function(r) { return r.json(); }).then(function(data) {
        try {
          var rows = data.mealServiceDietInfo[1].row;
          var meals = rows.map(function(r) {
            return {
              date: r.MLSV_YMD,
              type: r.MMEAL_SC_NM, // 조식/중식/석식
              menu: r.DDISH_NM.replace(/<br\/>/g, '\n').replace(/\d+\./g, '').replace(/[()]/g, ''),
              cal: r.CAL_INFO,
              origin: r.ORPLC_INFO ? r.ORPLC_INFO.replace(/<br\/>/g, '\n') : ''
            };
          });
          cb(meals);
        } catch (e) { cb([]); }
      }).catch(function() { cb([]); });
    });
  }

  // 학사일정 조회
  function getSchedule(from, to, cb) {
    ensureSchoolCode(function() {
      if (!SCHOOL_CODE) { cb([]); return; }
      var url = BASE + '/SchoolSchedule?KEY=' + KEY + '&Type=json&pIndex=1&pSize=100'
        + '&ATPT_OFCDC_SC_CODE=' + OFFICE
        + '&SD_SCHUL_CODE=' + SCHOOL_CODE
        + '&AA_FROM_YMD=' + from
        + '&AA_TO_YMD=' + to;
      fetch(url).then(function(r) { return r.json(); }).then(function(data) {
        try {
          var rows = data.SchoolSchedule[1].row;
          var events = rows.map(function(r) {
            return {
              date: r.AA_YMD,
              name: r.EVENT_NM,
              content: r.EVENT_CNTNT || '',
              type: r.SBTR_DD_SC_NM // 수업일수/휴업일 등
            };
          });
          cb(events);
        } catch (e) { cb([]); }
      }).catch(function() { cb([]); });
    });
  }

  return {
    getMeals: getMeals,
    getSchedule: getSchedule,
    ymd: ymd,
    pad: pad
  };
})();
