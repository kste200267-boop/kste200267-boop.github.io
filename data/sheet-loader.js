// data/sheet-loader.js — 구글 시트에서 시간표 자동 로드
var SheetLoader=(function(){
  var URLS={
    base:'https://docs.google.com/spreadsheets/d/e/2PACX-1vRk0Sx9pV6efzkE2ZIXqJ6mkAFESk7w1CbtpzpZXRstAvedvX2r6iLQkMkZhvFYAQ/pub?output=csv',
    weekA:'https://docs.google.com/spreadsheets/d/e/2PACX-1vSub-gcVUw-NI0i7aNNKgV61TIiR_nyV3EWkd2ZqwmJo_iS_ZisucANAL_P5yPRfQ/pub?output=csv',
    weekB:'https://docs.google.com/spreadsheets/d/e/2PACX-1vQR0jbcVpLPrMIss4RJ_XYYLUBhA-03OuHvILYOIy9c-4soTsKW45DAFQp4T4oxeg/pub?output=csv'
  };

  // CSV 파싱 (따옴표 내 콤마 처리)
  function parseCSV(text){
    var lines=text.split('\n');
    var result=[];
    for(var i=0;i<lines.length;i++){
      var line=lines[i].replace(/\r/g,'');
      if(!line)continue;
      var row=[],cell='',inQ=false;
      for(var j=0;j<line.length;j++){
        var ch=line[j];
        if(inQ){
          if(ch==='"'&&line[j+1]==='"'){cell+='"';j++}
          else if(ch==='"')inQ=false;
          else cell+=ch;
        }else{
          if(ch==='"')inQ=true;
          else if(ch===','){row.push(cell.trim());cell=''}
          else cell+=ch;
        }
      }
      row.push(cell.trim());
      result.push(row);
    }
    return result;
  }

  // 학급 시간표 추출 (행5~22, B열=반이름)
  // 열 매핑: C~I=월1~7, J~P=화1~7, Q~V=수1~6, W~AB=목1~6, AC~AH=금1~6
  var CLASS_MAP={'용접1':'1용1','용접2':'1용2','기계1':'1기1','기계2':'1기2','금형1':'1금1','금형2':'1금2'};
  var DAY_COLS={월:[2,3,4,5,6,7,8],화:[9,10,11,12,13,14,15],수:[16,17,18,19,20,21],목:[22,23,24,25,26,27],금:[28,29,30,31,32,33]};

  function extractClasses(rows){
    var classes={};
    for(var i=4;i<22&&i<rows.length;i++){
      var row=rows[i];
      var className=(row[1]||'').replace(/\n/g,'').trim();
      var mapped=CLASS_MAP[className];
      if(!mapped)continue;
      var cls={};
      for(var day in DAY_COLS){
        var cols=DAY_COLS[day];
        var periods=[];
        for(var j=0;j<cols.length;j++){
          var ci=cols[j];
          var v=(ci<row.length)?row[ci]:'';
          v=v.replace(/\n/g,'').trim();
          periods.push(v||null);
        }
        cls[day]=periods;
      }
      classes[mapped]=cls;
    }
    return classes;
  }

  // 교사 시간표 추출 (행24=헤더 "교 사", 행25~)
  function extractTeachers(rows){
    var teachers={};
    var started=false;
    for(var i=0;i<rows.length;i++){
      var row=rows[i];
      var first=(row[0]||'').replace(/\n/g,'').trim();
      if(first.indexOf('교')>=0&&first.indexOf('사')>=0){started=true;continue}
      if(!started)continue;
      var name=first.replace(/\(강사\)/g,'').replace(/（강사）/g,'').trim();
      if(!name)continue;
      var hours=parseInt(row[1])||0;
      // 32 슬롯: 열2~33 (월1~7, 화1~7, 수1~6, 목1~6, 금1~6)
      var sched=[];
      for(var j=2;j<34;j++){
        var v=(j<row.length)?(row[j]||'').replace(/\n/g,'').trim():'';
        sched.push(v||null);
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
        for(var k in CS_A){CS[k]={};for(var d in CS_A[k])CS[k][d]=CS_A[k][d].slice()}
        // 로드 완료 시간 저장
        Store.set('sheet-loaded',new Date().toISOString());
        if(cb)cb(error);
      }
    }

    // A주 (1,2주차)
    loadSheet(URLS.weekA,function(err,rows){
      if(err){error=err;check();return}
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
      if(err){error=err;check();return}
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
        for(var k in CS_A){CS[k]={};for(var d in CS_A[k])CS[k][d]=CS_A[k][d].slice()}
        return true;
      }
    }catch(e){}
    return false;
  }

  return{loadAll:loadAll,loadFromCache:loadFromCache,URLS:URLS};
})();
