// data/sheet-loader.js — 구글 시트에서 시간표 자동 로드 (안전 버전)
var SheetLoader=(function(){
  var URLS={
    base:'https://docs.google.com/spreadsheets/d/e/2PACX-1vRk0Sx9pV6efzkE2ZIXqJ6mkAFESk7w1CbtpzpZXRstAvedvX2r6iLQkMkZhvFYAQ/pub?output=csv',
    weekA:'https://docs.google.com/spreadsheets/d/e/2PACX-1vSub-gcVUw-NI0i7aNNKgV61TIiR_nyV3EWkd2ZqwmJo_iS_ZisucANAL_P5yPRfQ/pub?output=csv',
    weekB:'https://docs.google.com/spreadsheets/d/e/2PACX-1vQR0jbcVpLPrMIss4RJ_XYYLUBhA-03OuHvILYOIy9c-4soTsKW45DAFQp4T4oxeg/pub?output=csv'
  };

  var CLASS_MAP={
    '용접1':'1용1','용접2':'1용2',
    '기계1':'1기1','기계2':'1기2',
    '금형1':'1금1','금형2':'1금2'
  };

  var DAY_COLS={
    월:[2,3,4,5,6,7,8],
    화:[9,10,11,12,13,14,15],
    수:[16,17,18,19,20,21],
    목:[22,23,24,25,26,27],
    금:[28,29,30,31,32,33]
  };

  function safeObj(v){
    return (v && typeof v==='object' && !Array.isArray(v)) ? v : {};
  }

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

  function cleanTeacherSlot(v){
    v=(v||'').replace(/\n/g,'').trim();
    if(!v) return null;

    if(/^[123](용|기|금|선|밀)\d$/.test(v)) return v;
    if(/^[123]학생선택\(.+\)$/.test(v)) return v;
    if(v==='동아리' || v==='자율' || v==='3학선') return v;
    if(v.indexOf(',')>=0) return null;

    return null;
  }

  function extractClasses(rows){
    var classes={};
    var teacherStart=rows.length;

    try{
      for(var i=0;i<rows.length;i++){
        var joined=(rows[i]||[]).join(' ').replace(/\n/g,'').replace(/\s+/g,'');
        if(joined.indexOf('교사')>=0){
          teacherStart=i;
          break;
        }
      }

      for(var r=0;r<teacherStart;r++){
        var row=rows[r]||[];
        var className=(row[1]||'').replace(/\n/g,'').trim();
        var mapped=CLASS_MAP[className];
        if(!mapped) continue;
        if(classes[mapped]) continue;

        var cls={};
        for(var day in DAY_COLS){
          var cols=DAY_COLS[day];
          var periods=[];

          for(var j=0;j<cols.length;j++){
            var ci=cols[j];
            var v=(ci<row.length)?row[ci]:'';
            v=(v||'').replace(/\n/g,'').trim();
            periods.push(v||null);
          }

          cls[day]=periods;
        }

        classes[mapped]=cls;
      }
    }catch(e){
      console.error('extractClasses error:',e);
    }

    return classes;
  }

  function extractTeachers(rows){
    var teachers={};
    var started=false;

    function isValidTeacherName(name){
      name=(name||'').trim();
      if(!name) return false;
      if(name.length>10) return false;
      if(name.indexOf(',')>=0) return false;
      if(name.indexOf('(')>=0 || name.indexOf(')')>=0) return false;
      if(/[0-9]/.test(name)) return false;
      if(/교시|요일|시간표|관리직/.test(name)) return false;
      return /^[가-힣]+$/.test(name);
    }

    try{
      for(var i=0;i<rows.length;i++){
        var row=rows[i]||[];

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

        if(!isValidTeacherName(name)) continue;

        var hours=parseInt(row[1],10)||0;
        var sched=[];

        for(var j=2;j<34;j++){
          var raw=(j<row.length)?row[j]:'';
          sched.push(cleanTeacherSlot(raw));
        }

        teachers[name]={h:hours,s:sched};
      }
    }catch(e){
      console.error('extractTeachers error:',e);
    }

    return teachers;
  }

  function loadSheet(url,cb){
    var done=false;
    var timer=setTimeout(function(){
      if(done) return;
      done=true;
      cb(new Error('sheet load timeout'),null);
    },7000);

    fetch(url)
      .then(function(r){
        if(!r.ok) throw new Error('HTTP '+r.status);
        return r.text();
      })
      .then(function(text){
        if(done) return;
        done=true;
        clearTimeout(timer);

        var rows=parseCSV(text);
        cb(null,rows);
      })
      .catch(function(err){
        if(done) return;
        done=true;
        clearTimeout(timer);
        cb(err,null);
      });
  }

  function cloneClasses(src){
    src=safeObj(src);
    var out={};
    for(var k in src){
      out[k]={};
      for(var d in src[k]){
        out[k][d]=(src[k][d]||[]).slice();
      }
    }
    return out;
  }

  function loadAll(cb){
    var done=0;
    var total=2;
    var errors=[];

    function finishOne(){
      done++;
      if(done<total) return;

      try{
        TD_A=safeObj(TD_A);
        TD_B=safeObj(TD_B);
        CS_A=safeObj(CS_A);
        CS_B=safeObj(CS_B);

        if(typeof CS!=='object' || !CS) CS={};
        CS=cloneClasses(CS_A);
      }catch(e){
        console.error('finalize loadAll error:',e);
        errors.push(e);
      }

      if(typeof cb==='function'){
        cb(errors.length ? errors[0] : null);
      }
    }

    loadSheet(URLS.weekA,function(err,rows){
      if(err){
        console.error('weekA load error:',err);
        errors.push(err);
        finishOne();
        return;
      }

      try{
        TD_A=extractTeachers(rows);
        CS_A=extractClasses(rows);

        localStorage.setItem('cache-TD_A',JSON.stringify(TD_A||{}));
        localStorage.setItem('cache-CS_A',JSON.stringify(CS_A||{}));
      }catch(e){
        console.error('weekA parse/store error:',e);
        errors.push(e);
      }

      finishOne();
    });

    loadSheet(URLS.weekB,function(err,rows){
      if(err){
        console.error('weekB load error:',err);
        errors.push(err);
        finishOne();
        return;
      }

      try{
        TD_B=extractTeachers(rows);
        CS_B=extractClasses(rows);

        localStorage.setItem('cache-TD_B',JSON.stringify(TD_B||{}));
        localStorage.setItem('cache-CS_B',JSON.stringify(CS_B||{}));
      }catch(e){
        console.error('weekB parse/store error:',e);
        errors.push(e);
      }

      finishOne();
    });
  }

  function loadFromCache(){
    try{
      var a=localStorage.getItem('cache-TD_A');
      var b=localStorage.getItem('cache-TD_B');
      var ca=localStorage.getItem('cache-CS_A');
      var cb2=localStorage.getItem('cache-CS_B');

      if(a) TD_A=JSON.parse(a);
      if(b) TD_B=JSON.parse(b);
      if(ca) CS_A=JSON.parse(ca);
      if(cb2) CS_B=JSON.parse(cb2);

      TD_A=safeObj(TD_A);
      TD_B=safeObj(TD_B);
      CS_A=safeObj(CS_A);
      CS_B=safeObj(CS_B);

      var hasA=Object.keys(TD_A).length>0 || Object.keys(CS_A).length>0;
      var hasB=Object.keys(TD_B).length>0 || Object.keys(CS_B).length>0;

      if(hasA || hasB){
        CS=cloneClasses(CS_A);
        return true;
      }
    }catch(e){
      console.error('loadFromCache error:',e);
    }
    return false;
  }

  return{
    loadAll:loadAll,
    loadFromCache:loadFromCache,
    URLS:URLS
  };
})();
