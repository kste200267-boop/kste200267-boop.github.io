// data/sheet-loader.js — 구글 시트에서 시간표 자동 로드
var SheetLoader=(function(){
  var URLS={
    base:'https://docs.google.com/spreadsheets/d/e/2PACX-1vRk0Sx9pV6efzkE2ZIXqJ6mkAFESk7w1CbtpzpZXRstAvedvX2r6iLQkMkZhvFYAQ/pub?output=csv',
    weekA:'https://docs.google.com/spreadsheets/d/e/2PACX-1vSub-gcVUw-NI0i7aNNKgV61TIiR_nyV3EWkd2ZqwmJo_iS_ZisucANAL_P5yPRfQ/pub?output=csv',
    weekB:'https://docs.google.com/spreadsheets/d/e/2PACX-1vQR0jbcVpLPrMIss4RJ_XYYLUBhA-03OuHvILYOIy9c-4soTsKW45DAFQp4T4oxeg/pub?output=csv'
  };

  // CSV 파싱 (따옴표 내 콤마 + 셀 내 줄바꿈 처리)
  function parseCSV(text){
    text=(text||'').replace(/\r/g,'');
    var result=[];
    var row=[];
    var cell='';
    var inQ=false;

    for(var i=0;i<text.length;i++){
      var ch=text[i];
      var next=text[i+1];

      if(inQ){
        if(ch==='"' && next==='"'){
          cell+='"';
          i++;
        }else if(ch==='"'){
          inQ=false;
        }else{
          cell+=ch;
        }
      }else{
        if(ch==='"'){
          inQ=true;
        }else if(ch===','){
          row.push(cell.trim());
          cell='';
        }else if(ch==='\n'){
          row.push(cell.trim());
          if(row.some(function(v){ return v!==''; })){
            result.push(row);
          }
          row=[];
          cell='';
        }else{
          cell+=ch;
        }
      }
    }

    row.push(cell.trim());
    if(row.some(function(v){ return v!==''; })){
      result.push(row);
    }

    return result;
  }

  // 학급 시간표 추출 (행5~22, B열=반이름)
  // 열 매핑: C~I=월1~7, J~P=화1~7, Q~V=수1~6, W~AB=목1~6, AC~AH=금1~6
 // 열 매핑: C~I=월1~7, J~P=화1~7, Q~W=수1~7, X~AD=목1~7, AE~AK=금1~7
var CLASS_MAP={'용접1':'1용1','용접2':'1용2','기계1':'1기1','기계2':'1기2','금형1':'1금1','금형2':'1금2'};
var DAY_COLS={
  월:[2,3,4,5,6,7,8],
  화:[9,10,11,12,13,14,15],
  수:[16,17,18,19,20,21,22],
  목:[23,24,25,26,27,28,29],
  금:[30,31,32,33,34,35,36]
};
function cleanTeacherSlot(v){
  v=(v||'').replace(/\n/g,'').trim();
  if(!v) return null;

  // 정상값만 허용
  if(/^\d(용|기|금|선|밀)\d$/.test(v)) return v;              // 1용1, 2기2 ...
  if(/^\d학생선택\(.+\)$/.test(v)) return v;                  // 3학생선택(밀링가공)
  if(v==='동아리' || v==='자율' || v==='3학선') return v;

  // 쉼표가 들어간 긴 문자열은 깨진 데이터로 간주
  if(v.indexOf(',')>=0) return null;

  // 그 외는 일단 버림
  return null;
}
function extractClasses(rows){
  var classes={};
  var teacherStart = rows.length;

  // "교사" 헤더 위치 찾기
  for(var i=0;i<rows.length;i++){
    var joined = rows[i].join(' ').replace(/\n/g,'').replace(/\s+/g,'');
    if(joined.indexOf('교사') >= 0){
      teacherStart = i;
      break;
    }
  }

  // 교사 섹션 전까지만 반 시간표 추출
  for(var i=0;i<teacherStart;i++){
    var row=rows[i];
    var className=(row[1]||'').replace(/\n/g,'').trim();
    var mapped=CLASS_MAP[className];
    if(!mapped) continue;

    if(classes[mapped]) continue;

    var cls={};

    for(var day in DAY_COLS){
      var cols=DAY_COLS[day];
      var periods=[];
      var lastValue=null;

      for(var j=0;j<cols.length;j++){
        var ci=cols[j];
        var v=(ci<row.length)?row[ci]:'';
        v=(v||'').replace(/\n/g,'').trim();

        // 병합 셀 보정
        if(v){
          lastValue=v;
          periods.push(v);
        }else{
          periods.push(lastValue);
        }
      }

      cls[day]=periods;
    }

    classes[mapped]=cls;
  }

  return classes;
}
  // 교사 시간표 추출 (헤더 위치가 조금 달라도 탐색)
function extractTeachers(rows){
  var teachers={};
  var started=false;

  function isValidTeacherName(name){
    name=(name||'').trim();
    if(!name) return false;
    if(name.length>10) return false;              // 너무 긴 건 교사명 아님
    if(name.indexOf(',')>=0) return false;        // 쉼표 포함하면 깨진 행
    if(name.indexOf('(')>=0 || name.indexOf(')')>=0) return false; // 관리직 등 제거
    if(/[0-9]/.test(name)) return false;          // 숫자 포함하면 교사명 아님
    if(/교시|요일|시간표|관리직/.test(name)) return false;
    return /^[가-힣]+$/.test(name);               // 한글 이름만 허용
  }

  function cleanTeacherSlot(v){
    v=(v||'').replace(/\n/g,'').trim();
    if(!v) return null;

    // 정상 반코드
    if(/^[123](용|기|금|선|밀)\d$/.test(v)) return v;

    // 학생선택
    if(/^[123]학생선택\(.+\)$/.test(v)) return v;

    // 기타 허용값
    if(v==='동아리' || v==='자율' || v==='3학선') return v;

    return null;
  }

  for(var i=0;i<rows.length;i++){
    var row=rows[i];

    if(!started){
      var joined=row.join(' ').replace(/\n/g,'').replace(/\s+/g,'');
      if(joined.indexOf('교사')>=0){
        started=true;
        continue;
      }
    }

    if(!started) continue;

    var first=(row[0]||'').replace(/\n/g,'').trim();
    var name=first.replace(/\(강사\)/g,'').replace(/（강사）/g,'').trim();

    // 여기서 깨진 행 차단
    if(!isValidTeacherName(name)) continue;

    var hours=parseInt(row[1],10)||0;
    var sched=[];

  for(var j=2;j<37;j++){
  var raw=(j<row.length)?row[j]:'';
  sched.push(cleanTeacherSlot(raw));
}

    teachers[name]={h:hours,s:sched};
  }

  return teachers;
}

  // 시트 1개 로드
  function loadSheet(url,cb){
    fetch(url).then(function(r){return r.text()}).then(function(text){
      var rows=parseCSV(text);
      cb(null,rows);
    }).catch(function(err){cb(err,null)});
  }

  // 전체 로드 (A주 + B주)
  function loadAll(cb){
    var done=0,total=2,error=null;

    function check(){
      done++;
      if(done>=total){
        // CS 초기화
        CS={};
        for(var k in CS_A){CS[k]={};for(var d in CS_A[k])CS[k][d]=CS_A[k][d].slice();}
        // 로드 완료 시간 저장
        Store.set('sheet-loaded',new Date().toISOString());
        if(cb)cb(error);
      }
    }

    // A주 (1,2주차)
    loadSheet(URLS.weekA,function(err,rows){
      if(err){error=err;check();return;}
      TD_A=extractTeachers(rows);
      CS_A=extractClasses(rows);
      // 로컬 캐시
      try{
        localStorage.setItem('cache-TD_A',JSON.stringify(TD_A));
        localStorage.setItem('cache-CS_A',JSON.stringify(CS_A));
      }catch(e){}
      check();
    });

    // B주 (3,4주차)
    loadSheet(URLS.weekB,function(err,rows){
      if(err){error=err;check();return;}
      TD_B=extractTeachers(rows);
      CS_B=extractClasses(rows);
      try{
        localStorage.setItem('cache-TD_B',JSON.stringify(TD_B));
        localStorage.setItem('cache-CS_B',JSON.stringify(CS_B));
      }catch(e){}
      check();
    });
  }

  // 캐시에서 빠른 로드 (오프라인/속도)
  function loadFromCache(){
    try{
      var a=localStorage.getItem('cache-TD_A');
      var b=localStorage.getItem('cache-TD_B');
      var ca=localStorage.getItem('cache-CS_A');
      var cb2=localStorage.getItem('cache-CS_B');
      if(a)TD_A=JSON.parse(a);
      if(b)TD_B=JSON.parse(b);
      if(ca)CS_A=JSON.parse(ca);
      if(cb2)CS_B=JSON.parse(cb2);
      if(a||b){
        CS={};
        for(var k in CS_A){CS[k]={};for(var d in CS_A[k])CS[k][d]=CS_A[k][d].slice();}
        return true;
      }
    }catch(e){}
    return false;
  }

  return{loadAll:loadAll,loadFromCache:loadFromCache,URLS:URLS};
})();
