// pages/roster.js — 학생 명부 v4 (CSV: 번호,이름,주소,본인휴대폰,어머니휴대폰,아버지휴대폰,사진URL)
var PageRoster=(function(){

  var ALL_CLS=[
    '1용1','1용2','1기1','1기2','1금1','1금2',
    '2용1','2용2','2기1','2기2','2금1','2금2',
    '3용1','3용2','3선1','3선2','3밀1','3밀2'
  ];

  var _cls  = Store.get('roster-sel-cls','1용1')||'1용1';
  var _tab  = 'list';
  var _search = '';
  var _selStu = null;
  var _counsels = null;
  var _counselLoading = false;
  var _detail = null;
  var _students = {};
  var _cfg = {};

  function loadCfg(){ _cfg = Store.get('roster-cfg',{}); }

  function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
  function uid(){return Date.now().toString(36)+Math.random().toString(36).substr(2,5);}
  function pad(n){return String(n).padStart(2,'0');}
  function nowDate(){var d=new Date();return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());}
  function nowTime(){var d=new Date();return pad(d.getHours())+':'+pad(d.getMinutes());}

  var COLORS=['#1a73e8','#0f9d58','#f4b400','#ea4335','#ab47bc','#00acc1','#ff7043','#795548'];
  function ac(num){return COLORS[(parseInt(num)||0)%COLORS.length];}

  // 구글 드라이브 링크 → 이미지 직접 표시 URL
  function toImgUrl(url){
    if(!url)return '';
    url=url.trim();
    // https://drive.google.com/uc?id=FILE_ID&export=view (업로더 출력 형식)
    var m0=url.match(/[?&]id=([^&]+)/);
    if(m0)return 'https://drive.google.com/thumbnail?id='+m0[1]+'&sz=w300';
    // https://drive.google.com/file/d/FILE_ID/view
    var m1=url.match(/\/file\/d\/([^\/\?]+)/);
    if(m1)return 'https://drive.google.com/thumbnail?id='+m1[1]+'&sz=w300';
    // 이미 thumbnail URL
    if(url.indexOf('drive.google.com/thumbnail')>=0)return url;
    return url;
  }

  function fdb(){
    try{return(typeof firebase!=='undefined'&&firebase.apps&&firebase.apps.length)?firebase.firestore():null;}
    catch(e){return null;}
  }

  function studentsKey(cls){return 'roster-students-'+cls;}

  function loadStudents(cls,cb){
    var cached=Store.get(studentsKey(cls),null);
    if(cached){_students[cls]=cached;if(cb)cb(cached);}
    var db=fdb();if(!db){if(!cached&&cb)cb([]);return;}
    db.collection('roster').doc(cls).get().then(function(doc){
      var data=doc.exists?(doc.data().students||[]):[];
      _students[cls]=data;
      Store.set(studentsKey(cls),data);
      if(cb)cb(data);
    }).catch(function(){if(!cached&&cb)cb([]);});
  }

  function saveStudents(cls,students,cb){
    _students[cls]=students;
    Store.set(studentsKey(cls),students);
    var db=fdb();if(!db){toast('Firebase 없음');if(cb)cb();return;}
    db.collection('roster').doc(cls).set({
      students:students,
      updated:new Date().toISOString(),
      updatedBy:App.getUser()
    }).then(function(){if(cb)cb();}).catch(function(e){toast('저장 실패: '+e.message);});
  }

  function parseCSV(text){
    text=(text||'').replace(/\r/g,'');
    var res=[],row=[],cell='',inQ=false;
    for(var i=0;i<text.length;i++){
      var ch=text[i],nx=text[i+1];
      if(inQ){if(ch==='"'&&nx==='"'){cell+='"';i++;}else if(ch==='"')inQ=false;else cell+=ch;}
      else{if(ch==='"')inQ=true;else if(ch===','){row.push(cell.trim());cell='';}
           else if(ch==='\n'){row.push(cell.trim());if(row.some(function(v){return v;}))res.push(row);row=[];cell='';}
           else cell+=ch;}
    }
    row.push(cell.trim());if(row.some(function(v){return v;}))res.push(row);
    return res;
  }

  function csvToStudents(rows){
    if(rows.length<2)return[];
    var cols=rows[0].map(function(c){return c.trim().toLowerCase().replace(/\s/g,'');});

    // ★ 컬럼 매핑: 번호,이름,주소,본인휴대폰,어머니휴대폰,아버지휴대폰,사진URL
    var COL={
      num:    ['번호','no','num','순번'],
      name:   ['이름','성명','name'],
      addr:   ['주소','address','집주소'],
      sphone: ['본인휴대폰','본인전화','학생전화','전화','phone','연락처','본인연락처','휴대폰'],
      mphone: ['어머니휴대폰','어머니전화','모전화','모연락처','어머니'],
      fphone: ['아버지휴대폰','아버지전화','부전화','부연락처','아버지'],
      // 구버전 호환
      pphone1:['보호자전화','보호자전화1','보호자연락처','비상연락처'],
      pphone2:['보호자전화2','보호자2'],
      pname:  ['보호자명','보호자이름','보호자','부모님'],
      photo:  ['사진url','사진','photo','photourl','이미지url','이미지']
    };

    function findCol(key){
      var cands=COL[key]||[key];
      for(var i=0;i<cands.length;i++){
        var idx=cols.indexOf(cands[i].toLowerCase().replace(/\s/g,''));
        if(idx>=0)return idx;
      }
      return -1;
    }
    var idxMap={};
    for(var k in COL)idxMap[k]=findCol(k);

    var students=[];
    for(var i=1;i<rows.length;i++){
      var r=rows[i];
      if(!r.some(function(v){return v;}))continue;
      var s={id:uid()};
      for(var k in idxMap){if(idxMap[k]>=0)s[k]=(r[idxMap[k]]||'').trim();}
      if(s.name||s.num)students.push(s);
    }
    return students.sort(function(a,b){return(parseInt(a.num)||0)-(parseInt(b.num)||0);});
  }

  function parseExcel(file,cb){
    var reader=new FileReader();
    reader.onload=function(e){
      try{
        var data=new Uint8Array(e.target.result);
        var wb=XLSX.read(data,{type:'array'});
        var ws=wb.Sheets[wb.SheetNames[0]];
        var csv=XLSX.utils.sheet_to_csv(ws);
        cb(csvToStudents(parseCSV(csv)));
      }catch(err){toast('파일 읽기 실패: '+err.message);}
    };
    reader.readAsArrayBuffer(file);
  }

  function counselKey(cls,k){return 'counsel-'+cls+'-'+k;}
  function loadCounsels(cls,k,cb){
    _counselLoading=true;
    var db=fdb();if(!db){_counselLoading=false;cb([]);return;}
    db.collection('portal').doc(counselKey(cls,k)).get()
      .then(function(doc){_counselLoading=false;cb(doc.exists?(doc.data().entries||[]):[]);})
      .catch(function(){_counselLoading=false;cb([]);});
  }
  function saveCounsels(cls,k,entries,cb){
    var db=fdb();if(!db){toast('Firebase 없음');return;}
    db.collection('portal').doc(counselKey(cls,k))
      .set({entries:entries,updated:new Date().toISOString()})
      .then(function(){if(cb)cb();}).catch(function(){toast('저장 실패');});
  }

  // 사진 아바타 HTML
  function avatarHtml(s,size){
    var sz=size||48;
    var imgUrl=toImgUrl(s.photo||'');
    if(imgUrl){
      return '<img src="'+esc(imgUrl)+'" style="width:'+sz+'px;height:'+sz+'px;border-radius:50%;object-fit:cover;margin:0 auto '+(sz>50?'8':'5')+'px;display:block;border:2px solid rgba(255,255,255,.4)" onerror="this.style.display=\'none\';this.nextSibling.style.display=\'flex\'">'
        +'<div style="display:none;width:'+sz+'px;height:'+sz+'px;border-radius:50%;background:'+ac(s.num)+';color:#fff;align-items:center;justify-content:center;font-size:'+(sz>50?'1.8':'1.1')+'em;font-weight:700;margin:0 auto '+(sz>50?'8':'5')+'px">'+esc(s.name?s.name.charAt(0):'?')+'</div>';
    }
    return '<div style="width:'+sz+'px;height:'+sz+'px;border-radius:50%;background:'+ac(s.num)+';color:#fff;display:flex;align-items:center;justify-content:center;font-size:'+(sz>50?'1.8':'1.1')+'em;font-weight:700;margin:0 auto '+(sz>50?'8':'5')+'px">'+esc(s.name?s.name.charAt(0):'?')+'</div>';
  }

  function render(){
    loadCfg();
    var h='<div class="card" style="padding:0;overflow:hidden">';

    // 학년 탭
    h+='<div style="display:flex;border-bottom:1px solid var(--bd);background:var(--bg2);overflow-x:auto">';
    ['1','2','3'].forEach(function(g){
      var on=_cls.charAt(0)===g;
      h+='<div style="padding:10px 20px;cursor:pointer;font-size:.85em;font-weight:'+(on?700:500)+
         ';color:'+(on?'var(--blue)':'var(--tx2)')+
         ';border-bottom:'+(on?'2px solid var(--blue)':'2px solid transparent')+
         ';white-space:nowrap;flex-shrink:0" onclick="PageRoster.selGrade(\''+g+'\')">'+g+'학년</div>';
    });
    h+='</div>';

    // 반 탭
    var gradeCls=ALL_CLS.filter(function(c){return c.charAt(0)===_cls.charAt(0);});
    h+='<div style="display:flex;gap:5px;padding:8px 12px;border-bottom:1px solid var(--bd);overflow-x:auto">';
    gradeCls.forEach(function(c){
      var has=_students[c]&&_students[c].length>0;
      h+='<span class="chip'+(c===_cls?' on':'')+'" onclick="PageRoster.selCls(\''+c+'\')" style="'+(has&&c!==_cls?'border-color:var(--green);':'')+'">'+c+'</span>';
    });
    h+='</div>';

    // 기능 탭
    h+='<div style="display:flex;border-bottom:1px solid var(--bd)">';
    [{id:'list',icon:'👥',label:'명부'},{id:'counsel',icon:'📝',label:'상담일지'}].forEach(function(t){
      var on=_tab===t.id;
      h+='<div style="padding:9px 14px;cursor:pointer;font-size:.82em;font-weight:'+(on?700:500)+
         ';color:'+(on?'var(--blue)':'var(--tx2)')+
         ';border-bottom:'+(on?'2px solid var(--blue)':'2px solid transparent')+
         ';flex-shrink:0" onclick="PageRoster.setTab(\''+t.id+'\')">'+t.icon+' '+t.label+'</div>';
    });
    if(App.isAdmin()){
      h+='<div style="margin-left:auto;display:flex;align-items:center;padding:0 10px">';
      h+='<button class="a-btn primary sm" onclick="PageRoster.setTab(\'upload\')">📤 업로드</button></div>';
    }
    h+='</div>';

    h+='<div>';
    if(_tab==='list')         h+=renderList();
    else if(_tab==='counsel') h+=renderCounsel();
    else if(_tab==='upload'&&App.isAdmin()) h+=renderUpload();
    h+='</div></div>';

    if(_detail)h+=renderDetailModal(_detail);
    document.getElementById('pg').innerHTML=h;

    if(!_students[_cls]&&(_tab==='list'||_tab==='counsel')){
      loadStudents(_cls,function(){render();});
    }
  }

  function renderList(){
    var students=_students[_cls]||[];
    if(!students.length){
      var h='<div style="text-align:center;padding:60px 20px;color:var(--tx3)">';
      h+='<div style="font-size:2.5em;margin-bottom:10px">👥</div>';
      h+='<div style="font-weight:600;color:var(--tx);margin-bottom:8px">'+_cls+' 학생 데이터 없음</div>';
      if(App.isAdmin())h+='<button class="a-btn primary" onclick="PageRoster.setTab(\'upload\')">📤 학생 데이터 업로드</button>';
      else h+='<div style="font-size:.83em">관리자에게 데이터 등록을 요청하세요</div>';
      return h+'</div>';
    }
    var q=_search.toLowerCase();
    var filtered=q?students.filter(function(s){return((s.name||'')+(s.num||'')).toLowerCase().indexOf(q)>=0;}):students;
    var h='<div style="padding:14px">';
    h+='<div style="display:flex;gap:8px;align-items:center;margin-bottom:12px;flex-wrap:wrap">';
    h+='<input class="ti-input" placeholder="이름·번호 검색..." style="max-width:200px;flex:1" value="'+esc(_search)+'" oninput="PageRoster.setSearch(this.value)">';
    h+='<span style="font-size:.82em;color:var(--tx2)"><b>'+filtered.length+'</b>/'+students.length+'명</span>';
    h+='</div>';
    if(!filtered.length)return h+'<div style="text-align:center;padding:20px;color:var(--tx3)">검색 결과 없음</div></div>';
    h+='<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(88px,1fr));gap:10px">';
    filtered.forEach(function(s){
      var idx=students.indexOf(s);
      var hasPhone=!!(s.mphone||s.fphone||s.sphone||s.pphone1||s.pphone2);
      h+='<div onclick="PageRoster.showDetail('+idx+')" style="background:var(--bg);border:1px solid var(--bd);border-radius:10px;padding:10px 6px;text-align:center;cursor:pointer;box-shadow:var(--shadow);transition:all .15s" onmouseover="this.style.transform=\'translateY(-2px)\'" onmouseout="this.style.transform=\'\'">';
      h+=avatarHtml(s,48);
      h+='<div style="font-weight:700;font-size:.83em;word-break:keep-all">'+esc(s.name||'')+'</div>';
      h+='<div style="font-size:.72em;color:var(--tx2)">'+esc(s.num||'')+'번</div>';
      if(hasPhone)h+='<div style="font-size:.62em;color:var(--green);margin-top:2px">📞</div>';
      h+='</div>';
    });
    return h+'</div></div>';
  }

  function renderDetailModal(s){
    var h='<div style="position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:999;display:flex;align-items:center;justify-content:center;padding:16px" onclick="PageRoster.closeDetail()">';
    h+='<div style="background:var(--bg);border-radius:var(--radius);width:100%;max-width:360px;overflow:hidden;max-height:90vh;overflow-y:auto" onclick="event.stopPropagation()">';
    h+='<div style="background:linear-gradient(135deg,'+ac(s.num)+','+ac((parseInt(s.num)||0)+3)+');padding:22px;text-align:center;color:#fff">';
    h+=avatarHtml(s,70);
    h+='<div style="font-size:1.15em;font-weight:700">'+esc(s.name||'')+'</div>';
    h+='<div style="font-size:.82em;opacity:.8;margin-top:3px">'+esc(_cls)+' '+esc(s.num||'')+'번</div>';
    h+='</div>';
    h+='<div style="padding:14px">';

    // ★ 상세 정보: 새 컬럼 구조 우선, 구버전 호환
    var rows=[
      ['🏠 주소', s.addr, false],
      ['📱 본인휴대폰', s.sphone, true],
      ['👩 어머니휴대폰', s.mphone, true],
      ['👨 아버지휴대폰', s.fphone, true],
      // 구버전 호환
      ['👨‍👩‍👧 보호자', s.pname, false],
      ['📞 보호자전화1', s.pphone1, true],
      ['📞 보호자전화2', s.pphone2, true],
    ];
    rows.forEach(function(r){
      if(!r[1])return;
      h+='<div style="display:flex;gap:10px;padding:8px 0;border-bottom:1px solid var(--bg2)">';
      h+='<div style="font-size:.77em;color:var(--tx2);min-width:90px;flex-shrink:0">'+r[0]+'</div>';
      if(r[2]){var cl=r[1].replace(/[^0-9]/g,'');h+='<a href="tel:'+cl+'" style="color:var(--blue);font-weight:600;font-size:.9em;text-decoration:none">'+esc(r[1])+'</a>';}
      else h+='<div style="font-size:.88em;word-break:keep-all;line-height:1.4">'+esc(r[1])+'</div>';
      h+='</div>';
    });

    // 관리자: 사진 URL 수정
    if(App.isAdmin()){
      h+='<div style="margin-top:10px;padding:10px;background:var(--bg2);border-radius:8px">';
      h+='<div style="font-size:.77em;color:var(--tx2);margin-bottom:4px">📷 사진 URL (구글 드라이브 업로더 CSV URL 또는 공유 링크)</div>';
      h+='<input class="ti-input" id="photoUrlInput" value="'+esc(s.photo||'')+'" placeholder="https://drive.google.com/uc?id=..." style="font-size:.8em;margin-bottom:6px">';
      h+='<button class="a-btn primary sm" onclick="PageRoster.savePhotoUrl(\''+esc(s.id)+'\')">사진 URL 저장</button>';
      h+='</div>';
    }

    // 전화 버튼 — 새 컬럼 우선
    if(s.sphone){var cs=s.sphone.replace(/[^0-9]/g,'');h+='<a href="tel:'+cs+'" style="display:block;margin-top:12px;padding:11px;background:var(--blue);color:#fff;border-radius:8px;text-align:center;font-weight:700;font-size:.9em;text-decoration:none">📱 본인 전화</a>';}
    if(s.mphone){var cm=s.mphone.replace(/[^0-9]/g,'');h+='<a href="tel:'+cm+'" style="display:block;margin-top:6px;padding:11px;background:#e91e8c;color:#fff;border-radius:8px;text-align:center;font-weight:700;font-size:.9em;text-decoration:none">👩 어머니 전화</a>';}
    if(s.fphone){var cf=s.fphone.replace(/[^0-9]/g,'');h+='<a href="tel:'+cf+'" style="display:block;margin-top:6px;padding:11px;background:#0f9d58;color:#fff;border-radius:8px;text-align:center;font-weight:700;font-size:.9em;text-decoration:none">👨 아버지 전화</a>';}
    // 구버전 호환
    if(!s.mphone&&!s.fphone&&s.pphone1){var cp=s.pphone1.replace(/[^0-9]/g,'');h+='<a href="tel:'+cp+'" style="display:block;margin-top:12px;padding:11px;background:var(--green);color:#fff;border-radius:8px;text-align:center;font-weight:700;font-size:.9em;text-decoration:none">📞 보호자 전화1</a>';}
    if(!s.mphone&&!s.fphone&&s.pphone2){var cp2=s.pphone2.replace(/[^0-9]/g,'');h+='<a href="tel:'+cp2+'" style="display:block;margin-top:6px;padding:11px;background:var(--cyan);color:#fff;border-radius:8px;text-align:center;font-weight:700;font-size:.9em;text-decoration:none">📞 보호자 전화2</a>';}

    var key=(s.num||'')+'-'+(s.name||'');
    h+='<button onclick="PageRoster.goToCounsel(\''+esc(key)+'\')" style="display:block;width:100%;margin-top:6px;padding:11px;border-radius:8px;border:1px solid var(--bd);background:var(--bg);cursor:pointer;font-size:.88em;font-weight:600">📝 상담일지 보기</button>';
    h+='<button onclick="PageRoster.closeDetail()" style="display:block;width:100%;margin-top:6px;padding:10px;border-radius:8px;border:1px solid var(--bd);background:var(--bg);cursor:pointer;font-size:.85em">닫기</button>';
    h+='</div></div></div>';
    return h;
  }

  function renderUpload(){
    var students=_students[_cls]||[];
    var h='<div style="padding:16px">';
    h+='<div style="font-weight:700;font-size:.95em;margin-bottom:14px">📤 '+_cls+' 학생 데이터 관리</div>';

    // CSV 양식
    h+='<div style="padding:12px;background:var(--bg2);border-radius:8px;margin-bottom:12px">';
    h+='<div style="font-weight:600;font-size:.85em;margin-bottom:6px">1단계: CSV 양식 다운로드</div>';
    h+='<div style="font-size:.78em;color:var(--tx2);margin-bottom:8px;line-height:1.7">';
    // ★ 컬럼 순서 표시 변경
    h+='컬럼: <b>번호, 이름, 주소, 본인휴대폰, 어머니휴대폰, 아버지휴대폰, 사진URL</b><br>';
    h+='사진URL: 명부 업로더(<b>roster-uploader.html</b>)로 자동 생성됩니다';
    h+='</div>';
    h+='<button class="a-btn primary" onclick="PageRoster.downloadTemplate()">📥 CSV 양식 다운로드</button>';
    h+='</div>';

    // 파일 업로드
    h+='<div style="padding:12px;background:var(--bg2);border-radius:8px;margin-bottom:12px">';
    h+='<div style="font-weight:600;font-size:.85em;margin-bottom:6px">2단계: 파일 업로드 (CSV 또는 Excel)</div>';
    h+='<input type="file" id="rosterFile" accept=".csv,.xlsx,.xls" style="margin-bottom:8px;font-size:.85em"><br>';
    h+='<button class="a-btn primary" onclick="PageRoster.uploadFile()">📤 업로드 및 저장</button>';
    h+='</div>';

    // 현재 학생 목록
    if(students.length){
      h+='<div style="padding:12px;background:var(--bg2);border-radius:8px;margin-bottom:12px">';
      h+='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">';
      h+='<div style="font-weight:600;font-size:.85em">현재 등록 ('+students.length+'명)</div>';
      h+='<button class="a-btn danger sm" onclick="PageRoster.clearStudents()">전체 삭제</button></div>';
      h+='<div style="max-height:300px;overflow-y:auto">';
      h+='<table class="a-table" style="font-size:.78em"><thead><tr><th>번호</th><th>이름</th><th>본인</th><th>어머니</th><th>아버지</th><th>사진</th><th></th></tr></thead><tbody>';
      students.forEach(function(s,i){
        var imgUrl=toImgUrl(s.photo||'');
        h+='<tr><td>'+esc(s.num||'')+'</td><td style="font-weight:600">'+esc(s.name||'')+'</td>';
        h+='<td>'+esc(s.sphone||'')+'</td>';
        h+='<td>'+esc(s.mphone||s.pphone1||'')+'</td>';
        h+='<td>'+esc(s.fphone||s.pphone2||'')+'</td>';
        h+='<td style="text-align:center">';
        if(imgUrl)h+='<img src="'+esc(imgUrl)+'" style="width:28px;height:28px;border-radius:50%;object-fit:cover">';
        else h+='<span style="color:var(--tx3);font-size:.8em">없음</span>';
        h+='</td>';
        h+='<td><button class="a-btn danger sm" onclick="PageRoster.deleteStu('+i+')">✕</button></td></tr>';
      });
      h+='</tbody></table></div></div>';
    }

    // 업로더 안내
    h+='<div style="padding:12px;background:rgba(79,142,247,.08);border-radius:8px;border-left:3px solid var(--blue)">';
    h+='<div style="font-weight:600;font-size:.85em;margin-bottom:6px">📷 사진 포함 명부 등록 방법</div>';
    h+='<div style="font-size:.78em;color:var(--tx2);line-height:1.9">';
    h+='① <b>roster-uploader.html</b> 열기<br>';
    h+='② 반 선택 → CSV 업로드 → 사진 붙여넣기(Ctrl+V)<br>';
    h+='③ 구글 로그인 → 드라이브에 업로드 시작<br>';
    h+='④ 완료 후 CSV URL 복사 → 여기 2단계에서 업로드';
    h+='</div></div></div>';
    return h;
  }

  function renderCounsel(){
    var students=_students[_cls]||[];
    var h='<div style="padding:14px">';
    h+='<div style="margin-bottom:12px"><div style="font-size:.77em;color:var(--tx2);margin-bottom:3px;font-weight:600">학생 선택</div>';
    h+='<select class="ti-sel" id="stuSel" onchange="PageRoster.selStudent(this.value)" style="width:100%;max-width:280px">';
    h+='<option value="">-- 학생 선택 --</option>';
    students.forEach(function(s){
      var key=(s.num||'')+'-'+(s.name||'');
      h+='<option value="'+esc(key)+'"'+(_selStu&&_selStu.key===key?' selected':'')+'>'+esc(s.num)+'번 '+esc(s.name)+'</option>';
    });
    h+='</select></div>';
    if(!_selStu)return h+'<div style="text-align:center;padding:32px;color:var(--tx3);font-size:.85em">학생을 선택하면 상담 기록을 볼 수 있습니다</div></div>';
    h+='<div style="padding:12px;background:var(--bg2);border-radius:8px;margin-bottom:12px">';
    h+='<div style="font-weight:600;font-size:.85em;margin-bottom:8px">'+esc(_selStu.num)+'번 '+esc(_selStu.name)+' — 상담 추가</div>';
    h+='<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px">';
    h+='<div><div style="font-size:.7em;color:var(--tx2);margin-bottom:2px">날짜</div><input type="date" class="ti-input" id="cDate" value="'+nowDate()+'" style="width:128px"></div>';
    h+='<div><div style="font-size:.7em;color:var(--tx2);margin-bottom:2px">시간</div><input type="time" class="ti-input" id="cTime" value="'+nowTime()+'" style="width:98px"></div>';
    h+='<div style="flex:1;min-width:100px"><div style="font-size:.7em;color:var(--tx2);margin-bottom:2px">작성자</div><input class="ti-input" id="cAuthor" value="'+esc(App.getUser())+'" style="width:100%"></div>';
    h+='</div>';
    h+='<textarea class="ti-input" id="cContent" placeholder="상담 내용..." style="min-height:80px;resize:vertical;width:100%;margin-bottom:8px"></textarea>';
    h+='<button class="a-btn primary" onclick="PageRoster.saveCounsel()">💾 저장</button></div>';
    h+='<div id="counselEntries">';
    if(_counselLoading){h+='<div style="text-align:center;padding:20px;color:var(--tx3);font-size:.85em">불러오는 중...</div>';}
    else if(!_counsels||!_counsels.length){h+='<div style="padding:12px;color:var(--tx3);font-size:.85em;text-align:center">상담 기록 없음</div>';}
    else{
      _counsels.slice().sort(function(a,b){return(a.date+'T'+(a.time||'00:00'))>(b.date+'T'+(b.time||'00:00'))?-1:1;}).forEach(function(e){
        h+='<div style="padding:12px;border:1px solid var(--bd);border-radius:8px;background:var(--bg);margin-bottom:8px">';
        h+='<div style="display:flex;align-items:center;gap:7px;margin-bottom:7px;flex-wrap:wrap">';
        h+='<span style="font-size:.8em;font-weight:700;color:var(--blue)">📅 '+esc(e.date)+'</span>';
        if(e.time)h+='<span style="font-size:.76em;color:var(--tx2)">⏰ '+esc(e.time)+'</span>';
        h+='<span style="font-size:.75em;background:var(--blue-bg);color:var(--blue);padding:1px 7px;border-radius:8px">👤 '+esc(e.author)+'</span>';
        h+='<button onclick="PageRoster.deleteCounsel(\''+esc(e.id)+'\')" style="margin-left:auto;background:none;border:none;color:var(--tx3);cursor:pointer;font-size:.85em">✕</button>';
        h+='</div>';
        h+='<div style="font-size:.88em;white-space:pre-wrap;word-break:keep-all;line-height:1.65">'+esc(e.content)+'</div></div>';
      });
    }
    return h+'</div></div>';
  }

  return{
    render:render,
    selGrade:function(g){
      var first=ALL_CLS.filter(function(c){return c.charAt(0)===g;})[0];
      if(!first)return;
      _cls=first;Store.set('roster-sel-cls',first);_search='';_detail=null;_tab='list';render();
    },
    selCls:function(cls){_cls=cls;Store.set('roster-sel-cls',cls);_search='';_detail=null;if(_tab==='upload')_tab='list';render();},
    setTab:function(t){_tab=t;_detail=null;_counsels=null;_selStu=null;render();},
    setSearch:function(v){_search=v;render();},
    showDetail:function(idx){_detail=(_students[_cls]||[])[idx]||null;render();},
    closeDetail:function(){_detail=null;render();},
    // ★ CSV 양식: 번호,이름,주소,본인휴대폰,어머니휴대폰,아버지휴대폰,사진URL
    downloadTemplate:function(){
      var csv='\uFEFF번호,이름,주소,본인휴대폰,어머니휴대폰,아버지휴대폰,사진URL\n';
      csv+='1,홍길동,경북 경산시,010-1234-5678,010-9876-5432,010-1111-2222,https://drive.google.com/uc?id=예시ID&export=view\n';
      csv+='2,김철수,경북 경산시,010-2222-3333,010-4444-5555,,\n';
      var blob=new Blob([csv],{type:'text/csv;charset=utf-8'});
      var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=_cls+'_학생명부_양식.csv';a.click();
    },
    uploadFile:function(){
      var fi=document.getElementById('rosterFile');
      if(!fi||!fi.files.length){toast('파일을 선택하세요');return;}
      var f=fi.files[0],name=f.name.toLowerCase();
      function saveWithPhotoPreserve(students){
        var existing=_students[_cls]||[],photoMap={};
        existing.forEach(function(s){if(s.photo)photoMap[(s.num||'')+'-'+(s.name||'')]=s.photo;});
        students.forEach(function(s){
          var k=(s.num||'')+'-'+(s.name||'');
          if(!s.photo&&photoMap[k])s.photo=photoMap[k];
        });
        saveStudents(_cls,students,function(){toast(students.length+'명 저장됨');render();});
      }
      if(name.endsWith('.csv')){
        var reader=new FileReader();
        reader.onload=function(e){
          var students=csvToStudents(parseCSV(e.target.result));
          if(!students.length){toast('학생 데이터가 없습니다');return;}
          saveWithPhotoPreserve(students);
        };
        reader.readAsText(f,'UTF-8');
      }else if(name.endsWith('.xlsx')||name.endsWith('.xls')){
        function doExcel(){
          parseExcel(f,function(students){
            if(!students.length){toast('데이터 없음');return;}
            saveWithPhotoPreserve(students);
          });
        }
        if(typeof XLSX==='undefined'){
          var script=document.createElement('script');
          script.src='https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
          script.onload=doExcel;
          document.head.appendChild(script);
          toast('Excel 라이브러리 로딩 중...');
        }else{doExcel();}
      }else{toast('CSV 또는 Excel 파일만 지원');}
    },
    savePhotoUrl:function(studentId){
      var input=document.getElementById('photoUrlInput');
      if(!input)return;
      var url=input.value.trim();
      var students=_students[_cls]||[];
      var target=null;
      for(var i=0;i<students.length;i++){if(students[i].id===studentId){target=students[i];break;}}
      if(!target){toast('학생을 찾을 수 없습니다');return;}
      target.photo=url;
      if(_detail&&_detail.id===studentId)_detail.photo=url;
      saveStudents(_cls,students,function(){toast('사진 URL 저장됨');render();});
    },
    deleteStu:function(idx){
      if(!confirm('삭제할까요?'))return;
      var students=_students[_cls]||[];
      students.splice(idx,1);
      saveStudents(_cls,students,function(){toast('삭제됨');render();});
    },
    clearStudents:function(){
      if(!confirm(_cls+' 전체 삭제?'))return;
      saveStudents(_cls,[],function(){toast('삭제됨');render();});
    },
    goToCounsel:function(key){
      var parts=key.split('-');
      _selStu={key:key,num:parts[0],name:parts.slice(1).join('-')};
      _tab='counsel';_detail=null;_counsels=null;_counselLoading=false;render();
      loadCounsels(_cls,key,function(entries){_counsels=entries;_counselLoading=false;render();});
    },
    selStudent:function(key){
      if(!key){_selStu=null;_counsels=null;render();return;}
      var students=_students[_cls]||[];
      var found=null;
      for(var i=0;i<students.length;i++){if(((students[i].num||'')+'-'+(students[i].name||''))===key){found=students[i];break;}}
      _selStu=found?{key:key,num:found.num,name:found.name}:null;
      _counsels=null;render();
      if(_selStu)loadCounsels(_cls,key,function(entries){_counsels=entries;_counselLoading=false;render();});
    },
    saveCounsel:function(){
      if(!_selStu){toast('학생 선택');return;}
      var date=(document.getElementById('cDate')||{}).value||nowDate();
      var time=(document.getElementById('cTime')||{}).value||nowTime();
      var author=((document.getElementById('cAuthor')||{}).value||App.getUser()).trim();
      var content=((document.getElementById('cContent')||{}).value||'').trim();
      if(!content){toast('내용 입력');return;}
      var updated=(_counsels||[]).concat([{id:uid(),date:date,time:time,author:author,content:content}]);
      saveCounsels(_cls,_selStu.key,updated,function(){
        _counsels=updated;toast('저장됨');
        var el=document.getElementById('cContent');if(el)el.value='';render();
      });
    },
    deleteCounsel:function(eid){
      if(!confirm('삭제할까요?'))return;
      var updated=(_counsels||[]).filter(function(e){return e.id!==eid;});
      saveCounsels(_cls,_selStu.key,updated,function(){_counsels=updated;toast('삭제됨');render();});
    }
  };
})();
