// pages/roster.js — 학생 명부
// 탭1: 📄 명부 PDF  (Google Drive iframe)
// 탭2: 🔍 학생 검색 (구글 시트 CSV → 카드 + 전화클릭)
// 탭3: 📝 상담일지  (Firestore 누적, 교사 누구나)
var PageRoster=(function(){

  var ALL_CLS=[
    '1용1','1용2','1기1','1기2','1금1','1금2',
    '2용1','2용2','2기1','2기2','2금1','2금2',
    '3용1','3용2','3선1','3선2','3밀1','3밀2'
  ];

  var _cls   = Store.get('roster-sel-cls','1용1')||'1용1';
  var _tab   = 'pdf';
  var _cfg   = Store.get('roster-cfg',{});
  var _sheetData = {};
  var _sheetLoading = {};
  var _search = '';
  var _selStu = null;
  var _counsels = null;
  var _counselLoading = false;
  var _detail = null;

  function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
  function uid(){return Date.now().toString(36)+Math.random().toString(36).substr(2,5);}
  function pad(n){return String(n).padStart(2,'0');}
  function nowDate(){var d=new Date();return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());}
  function nowTime(){var d=new Date();return pad(d.getHours())+':'+pad(d.getMinutes());}

  var COLORS=['#1a73e8','#0f9d58','#f4b400','#ea4335','#ab47bc','#00acc1','#ff7043','#795548'];
  function ac(num){return COLORS[(parseInt(num)||0)%COLORS.length];}

  function toEmbed(url){
    if(!url)return '';
    url=url.trim();
    if(url.indexOf('/preview')>-1)return url;
    var m=url.match(/\/file\/d\/([^\/\?]+)/);
    if(m)return 'https://drive.google.com/file/d/'+m[1]+'/preview';
    var m2=url.match(/[?&]id=([^&]+)/);
    if(m2)return 'https://drive.google.com/file/d/'+m2[1]+'/preview';
    return url;
  }

  function db(){
    try{return(typeof firebase!=='undefined'&&firebase.apps&&firebase.apps.length)?firebase.firestore():null;}
    catch(e){return null;}
  }

  // CSV 파싱
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

  // 컬럼 유연 매핑 (나이스 엑셀 형식 포함)
  var FMAP={
    'num':   ['번호','no','num','순번'],
    'name':  ['이름','성명','name'],
    'addr':  ['주소','address','집주소'],
    'pname': ['보호자명','보호자이름','보호자','부모님'],
    'pphone':['보호자전화','보호자연락처','부모전화','비상연락처'],
    'sphone':['본인휴대폰','학생전화','전화','phone','연락처','본인연락처','휴대폰']
  };
  function gf(student,key){
    var cands=FMAP[key]||[key];
    for(var ci=0;ci<cands.length;ci++){
      var k=cands[ci].replace(/\s/g,'').toLowerCase();
      for(var col in student){
        if(col.replace(/\s/g,'').toLowerCase()===k)return student[col]||'';
      }
    }
    return '';
  }

  function csvToStudents(rows){
    if(!rows.length)return{cols:[],students:[]};
    var cols=rows[0].map(function(c){return c.trim();});
    var students=[];
    for(var i=1;i<rows.length;i++){
      if(!rows[i].some(function(v){return v;}))continue;
      var obj={};
      cols.forEach(function(c,ci){obj[c]=(rows[i][ci]||'').trim();});
      students.push(obj);
    }
    return{cols:cols,students:students};
  }

  function loadSheet(cls){
    var url=(_cfg[cls]||{}).sheetUrl;
    if(!url||_sheetData[cls]||_sheetLoading[cls])return;
    _sheetLoading[cls]=true;
    fetch(url)
      .then(function(r){if(!r.ok)throw new Error('HTTP '+r.status);return r.text();})
      .then(function(text){_sheetData[cls]=csvToStudents(parseCSV(text));_sheetLoading[cls]=false;if(_cls===cls&&_tab==='search')render();})
      .catch(function(){_sheetLoading[cls]=false;if(_cls===cls&&_tab==='search')render();});
  }

  // 상담 Firestore
  function counselKey(cls,k){return 'counsel-'+cls+'-'+k;}
  function loadCounsels(cls,k,cb){
    _counselLoading=true;
    var d=db();if(!d){_counselLoading=false;cb([]);return;}
    d.collection('portal').doc(counselKey(cls,k)).get()
      .then(function(doc){_counselLoading=false;cb(doc.exists?(doc.data().entries||[]):[]);})
      .catch(function(){_counselLoading=false;cb([]);});
  }
  function saveCounsels(cls,k,entries,cb){
    var d=db();if(!d){toast('Firebase 없음');return;}
    d.collection('portal').doc(counselKey(cls,k))
      .set({entries:entries,updated:new Date().toISOString()})
      .then(function(){if(cb)cb();}).catch(function(){toast('저장 실패');});
  }

  function getCounselStudentList(cls){
    if(_sheetData[cls]&&_sheetData[cls].students.length){
      return _sheetData[cls].students.map(function(s){
        var num=gf(s,'num'),name=gf(s,'name');
        return{key:num+'-'+name,num:num,name:name};
      }).sort(function(a,b){return(parseInt(a.num)||0)-(parseInt(b.num)||0);});
    }
    return Store.get('roster-manual-'+cls,[]);
  }

  // ── 렌더 ──
  function render(){
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
      var cfg=_cfg[c]||{};
      var has=!!(cfg.pdfUrl||cfg.sheetUrl);
      h+='<span class="chip'+(c===_cls?' on':'')+'" onclick="PageRoster.selCls(\''+c+'\')" '+
         'style="'+(has&&c!==_cls?'border-color:var(--green);':'')+'">'+c+'</span>';
    });
    h+='</div>';

    // 기능 탭
    h+='<div style="display:flex;border-bottom:1px solid var(--bd)">';
    [{id:'pdf',icon:'📄',label:'명부 PDF'},{id:'search',icon:'🔍',label:'학생 검색'},{id:'counsel',icon:'📝',label:'상담일지'}].forEach(function(t){
      var on=_tab===t.id;
      h+='<div style="padding:9px 14px;cursor:pointer;font-size:.82em;font-weight:'+(on?700:500)+
         ';color:'+(on?'var(--blue)':'var(--tx2)')+
         ';border-bottom:'+(on?'2px solid var(--blue)':'2px solid transparent')+
         ';flex-shrink:0" onclick="PageRoster.setTab(\''+t.id+'\')">'+t.icon+' '+t.label+'</div>';
    });
    if(App.isAdmin()){
      h+='<div style="margin-left:auto;display:flex;align-items:center;padding:0 10px">';
      h+='<button class="a-btn outline sm" onclick="PageRoster.setTab(\'settings\')">⚙️ 설정</button></div>';
    }
    h+='</div>';

    h+='<div>';
    if(_tab==='pdf')          h+=renderPDF();
    else if(_tab==='search')  h+=renderSearch();
    else if(_tab==='counsel') h+=renderCounsel();
    else if(_tab==='settings'&&App.isAdmin()) h+=renderSettings();
    h+='</div></div>';

    if(_detail)h+=renderDetailModal(_detail);

    document.getElementById('pg').innerHTML=h;
    if(_tab==='search')loadSheet(_cls);
  }

  function renderPDF(){
    var url=(_cfg[_cls]||{}).pdfUrl;
    if(!url){
      var h='<div style="text-align:center;padding:60px 20px;color:var(--tx3)">';
      h+='<div style="font-size:2.5em;margin-bottom:10px">📄</div>';
      h+='<div style="font-weight:600;color:var(--tx);margin-bottom:8px">'+_cls+' PDF 미등록</div>';
      if(App.isAdmin())h+='<button class="a-btn primary" onclick="PageRoster.setTab(\'settings\')">⚙️ 설정에서 링크 등록</button>';
      else h+='<div style="font-size:.83em">관리자에게 PDF 등록을 요청하세요</div>';
      h+='</div>';
      return h;
    }
    var embed=toEmbed(url);
    return '<div>'+
      '<div style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:var(--bg2);border-bottom:1px solid var(--bd)">'+
      '<span style="font-size:.83em;color:var(--tx2);flex:1">'+_cls+' 사진명렬·주소록</span>'+
      '<a href="'+esc(url)+'" target="_blank" class="a-btn outline sm">↗ 새 탭</a>'+
      (App.isAdmin()?'<button class="a-btn outline sm" onclick="PageRoster.setTab(\'settings\')">🔗 수정</button>':'')+
      '</div>'+
      '<iframe src="'+esc(embed)+'" style="width:100%;border:none;min-height:700px;display:block" allowfullscreen></iframe>'+
      '</div>';
  }

  function renderSearch(){
    var sheetUrl=(_cfg[_cls]||{}).sheetUrl;
    var h='<div style="padding:14px">';
    if(!sheetUrl){
      h+='<div style="text-align:center;padding:40px;color:var(--tx3)">';
      h+='<div style="font-size:2em;margin-bottom:8px">🔍</div>';
      h+='<div style="font-weight:600;color:var(--tx);margin-bottom:8px">구글 시트 미등록</div>';
      h+='<div style="font-size:.83em;margin-bottom:14px;line-height:1.7">나이스 → 학급명렬표 → 엑셀 다운<br>→ 구글 시트 붙여넣기 → CSV 웹게시 → ⚙️ 설정에서 URL 입력</div>';
      if(App.isAdmin())h+='<button class="a-btn primary" onclick="PageRoster.setTab(\'settings\')">⚙️ 설정</button>';
      return h+'</div></div>';
    }
    if(_sheetLoading[_cls]){
      return h+'<div style="text-align:center;padding:40px"><div style="width:28px;height:28px;border:3px solid var(--bd);border-top-color:var(--blue);border-radius:50%;animation:spin .8s linear infinite;margin:0 auto 10px"></div><div style="color:var(--tx2);font-size:.88em">불러오는 중...</div></div></div>';
    }
    if(!_sheetData[_cls]){loadSheet(_cls);return h+'<div style="text-align:center;padding:30px;color:var(--tx3)">로딩 중...</div></div>';}
    var students=_sheetData[_cls].students;
    if(!students.length)return h+'<div style="text-align:center;padding:30px;color:var(--tx3)">데이터 없음</div></div>';

    var q=_search.toLowerCase();
    var filtered=q?students.filter(function(s){return(gf(s,'name')+gf(s,'num')).toLowerCase().indexOf(q)>=0;}):students;

    h+='<div style="display:flex;gap:8px;align-items:center;margin-bottom:12px;flex-wrap:wrap">';
    h+='<input class="ti-input" placeholder="이름·번호 검색..." style="max-width:200px;flex:1" value="'+esc(_search)+'" oninput="PageRoster.setSearch(this.value)">';
    h+='<span style="font-size:.82em;color:var(--tx2)"><b>'+filtered.length+'</b>/'+students.length+'명</span>';
    h+='<button class="a-btn outline sm" onclick="PageRoster.reloadSheet()">🔄</button>';
    h+='</div>';

    if(!filtered.length){return h+'<div style="text-align:center;padding:20px;color:var(--tx3)">검색 결과 없음</div></div>';}

    h+='<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(80px,1fr));gap:8px">';
    filtered.forEach(function(s){
      var num=gf(s,'num'),name=gf(s,'name');
      var hasPhone=!!(gf(s,'pphone')||gf(s,'sphone'));
      h+='<div onclick="PageRoster.showDetail('+students.indexOf(s)+')" '+
         'style="background:var(--bg);border:1px solid var(--bd);border-radius:10px;padding:10px 6px;text-align:center;cursor:pointer;box-shadow:var(--shadow);transition:all .15s" '+
         'onmouseover="this.style.boxShadow=\'var(--shadow-lg)\';this.style.transform=\'translateY(-1px)\'" '+
         'onmouseout="this.style.boxShadow=\'var(--shadow)\';this.style.transform=\'\'">';
      h+='<div style="width:42px;height:42px;border-radius:50%;background:'+ac(num)+';color:#fff;display:flex;align-items:center;justify-content:center;font-size:1.05em;font-weight:700;margin:0 auto 5px">'+esc(name?name.charAt(0):'?')+'</div>';
      h+='<div style="font-weight:700;font-size:.83em;word-break:keep-all">'+esc(name)+'</div>';
      h+='<div style="font-size:.72em;color:var(--tx2)">'+esc(num)+'번</div>';
      if(hasPhone)h+='<div style="font-size:.62em;color:var(--green);margin-top:2px">📞</div>';
      h+='</div>';
    });
    return h+'</div></div>';
  }

  function renderDetailModal(s){
    var num=gf(s,'num'),name=gf(s,'name');
    var addr=gf(s,'addr'),pname=gf(s,'pname');
    var pphone=gf(s,'pphone'),sphone=gf(s,'sphone');
    var h='<div style="position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:999;display:flex;align-items:center;justify-content:center;padding:16px" onclick="PageRoster.closeDetail()">';
    h+='<div style="background:var(--bg);border-radius:var(--radius);width:100%;max-width:340px;overflow:hidden" onclick="event.stopPropagation()">';
    h+='<div style="background:linear-gradient(135deg,'+ac(num)+','+ac((parseInt(num)||0)+3)+');padding:22px;text-align:center;color:#fff">';
    h+='<div style="width:60px;height:60px;border-radius:50%;background:rgba(255,255,255,.22);display:flex;align-items:center;justify-content:center;font-size:1.7em;font-weight:700;margin:0 auto 8px">'+esc(name?name.charAt(0):'?')+'</div>';
    h+='<div style="font-size:1.15em;font-weight:700">'+esc(name)+'</div>';
    h+='<div style="font-size:.82em;opacity:.8;margin-top:3px">'+esc(_cls)+' '+esc(num)+'번</div></div>';
    h+='<div style="padding:14px">';
    [['🏠 주소',addr,false],['👨‍👩‍👧 보호자',pname,false],['📞 보호자 전화',pphone,true],['📱 학생 전화',sphone,true]].forEach(function(r){
      if(!r[1])return;
      h+='<div style="display:flex;gap:10px;padding:8px 0;border-bottom:1px solid var(--bg2)">';
      h+='<div style="font-size:.77em;color:var(--tx2);min-width:80px;flex-shrink:0">'+esc(r[0])+'</div>';
      if(r[2]){var cl=r[1].replace(/[^0-9]/g,'');h+='<a href="tel:'+cl+'" style="color:var(--blue);font-weight:600;font-size:.9em;text-decoration:none">'+esc(r[1])+'</a>';}
      else h+='<div style="font-size:.88em;word-break:keep-all;line-height:1.4">'+esc(r[1])+'</div>';
      h+='</div>';
    });
    if(pphone){var cp=pphone.replace(/[^0-9]/g,'');h+='<a href="tel:'+cp+'" style="display:block;margin-top:12px;padding:11px;background:var(--green);color:#fff;border-radius:8px;text-align:center;font-weight:700;font-size:.9em;text-decoration:none">📞 보호자 전화</a>';}
    if(sphone&&sphone!==pphone){var cs=sphone.replace(/[^0-9]/g,'');h+='<a href="tel:'+cs+'" style="display:block;margin-top:6px;padding:11px;background:var(--blue);color:#fff;border-radius:8px;text-align:center;font-weight:700;font-size:.9em;text-decoration:none">📱 학생 전화</a>';}
    var key=(gf(s,'num')+'-'+gf(s,'name'));
    h+='<button onclick="PageRoster.goToCounsel(\''+esc(key)+'\')" style="display:block;width:100%;margin-top:6px;padding:11px;border-radius:8px;border:1px solid var(--bd);background:var(--bg);cursor:pointer;font-size:.88em;font-weight:600">📝 상담일지 보기</button>';
    h+='<button onclick="PageRoster.closeDetail()" style="display:block;width:100%;margin-top:6px;padding:10px;border-radius:8px;border:1px solid var(--bd);background:var(--bg);cursor:pointer;font-size:.85em">닫기</button>';
    h+='</div></div></div>';
    return h;
  }

  function renderCounsel(){
    var stuList=getCounselStudentList(_cls);
    var h='<div style="padding:14px">';
    h+='<div style="display:flex;gap:8px;align-items:flex-end;flex-wrap:wrap;margin-bottom:12px">';
    h+='<div style="flex:1;min-width:140px"><div style="font-size:.77em;color:var(--tx2);margin-bottom:3px;font-weight:600">학생 선택</div>';
    h+='<select class="ti-sel" id="stuSel" onchange="PageRoster.selStudent(this.value)" style="width:100%">';
    h+='<option value="">-- 학생 선택 --</option>';
    stuList.forEach(function(s){
      h+='<option value="'+esc(s.key)+'"'+(_selStu&&_selStu.key===s.key?' selected':'')+'>'+esc(s.num)+'번 '+esc(s.name)+'</option>';
    });
    h+='</select></div>';
    if(!(_sheetData[_cls]&&_sheetData[_cls].students.length)){
      h+='<div style="display:flex;gap:4px;align-items:flex-end">';
      h+='<div><div style="font-size:.7em;color:var(--tx2);margin-bottom:2px">번호</div><input class="ti-input" id="mNum" placeholder="1" style="width:50px;padding:7px 6px"></div>';
      h+='<div><div style="font-size:.7em;color:var(--tx2);margin-bottom:2px">이름</div><input class="ti-input" id="mName" placeholder="홍길동" style="width:88px;padding:7px 8px"></div>';
      h+='<button class="a-btn outline sm" style="height:36px" onclick="PageRoster.addManualStudent()">+</button>';
      h+='</div>';
    }
    h+='</div>';
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
    if(_counselLoading){
      h+='<div style="text-align:center;padding:20px;color:var(--tx3);font-size:.85em">불러오는 중...</div>';
    }else if(!_counsels||!_counsels.length){
      h+='<div style="padding:12px;color:var(--tx3);font-size:.85em;text-align:center">상담 기록 없음</div>';
    }else{
      var sorted=_counsels.slice().sort(function(a,b){return(a.date+'T'+(a.time||'00:00'))>(b.date+'T'+(b.time||'00:00'))?-1:1;});
      sorted.forEach(function(e){
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

  function renderSettings(){
    var cfg=_cfg[_cls]||{};
    var h='<div style="padding:16px">';
    h+='<div style="font-weight:700;font-size:.9em;margin-bottom:14px">⚙️ '+_cls+' 설정</div>';

    h+='<div style="margin-bottom:16px;padding:14px;background:var(--bg2);border-radius:8px">';
    h+='<div style="font-weight:600;font-size:.85em;margin-bottom:4px">📄 PDF 링크 (Google Drive)</div>';
    h+='<div style="font-size:.75em;color:var(--tx2);margin-bottom:8px;line-height:1.6">Drive에 PDF 업로드 → 공유 → "링크 있는 모든 사용자" → 링크 복사</div>';
    h+='<input class="ti-input" id="cfgPdf" value="'+esc(cfg.pdfUrl||'')+'" placeholder="https://drive.google.com/file/d/..." style="margin-bottom:8px">';
    h+='<button class="a-btn primary sm" onclick="PageRoster.saveCfg(\'pdfUrl\',\'cfgPdf\')">저장</button>';
    if(cfg.pdfUrl)h+=' <button class="a-btn danger sm" onclick="PageRoster.clearCfg(\'pdfUrl\')">삭제</button>';
    h+='</div>';

    h+='<div style="margin-bottom:16px;padding:14px;background:var(--bg2);border-radius:8px">';
    h+='<div style="font-weight:600;font-size:.85em;margin-bottom:4px">🔍 구글 시트 CSV URL (검색용)</div>';
    h+='<div style="font-size:.75em;color:var(--tx2);margin-bottom:8px;line-height:1.7">나이스 → 학급명렬표 → 엑셀 다운 → 구글 시트 붙여넣기<br>→ 파일 → 웹에 게시 → <b>해당 탭 선택, CSV</b> → 게시 → URL 복사<br><b>컬럼:</b> 번호, 이름, 주소, 보호자명, 보호자전화, 본인휴대폰</div>';
    h+='<input class="ti-input" id="cfgSheet" value="'+esc(cfg.sheetUrl||'')+'" placeholder="https://docs.google.com/spreadsheets/d/.../pub?output=csv" style="margin-bottom:8px">';
    h+='<button class="a-btn primary sm" onclick="PageRoster.saveCfg(\'sheetUrl\',\'cfgSheet\')">저장</button>';
    if(cfg.sheetUrl)h+=' <button class="a-btn danger sm" onclick="PageRoster.clearCfg(\'sheetUrl\')">삭제</button>';
    h+='</div>';

    h+='<div style="font-size:.82em;font-weight:600;margin-bottom:8px;color:var(--tx2)">전체 반 현황</div>';
    h+='<div style="overflow-x:auto"><table class="a-table" style="font-size:.78em"><thead><tr><th>반</th><th>PDF</th><th>시트</th><th></th></tr></thead><tbody>';
    ALL_CLS.forEach(function(c){
      var cc=_cfg[c]||{};
      h+='<tr><td style="font-weight:600">'+c+'</td>';
      h+='<td style="color:'+(cc.pdfUrl?'var(--green)':'var(--tx3)')+'">'+( cc.pdfUrl?'✓':'—')+'</td>';
      h+='<td style="color:'+(cc.sheetUrl?'var(--green)':'var(--tx3)')+'">'+( cc.sheetUrl?'✓':'—')+'</td>';
      h+='<td><button class="a-btn outline sm" onclick="PageRoster.selCls(\''+c+'\');PageRoster.setTab(\'settings\')">편집</button></td></tr>';
    });
    h+='</tbody></table></div></div>';
    return h;
  }

  return{
    render:render,
    selGrade:function(g){
      var first=ALL_CLS.filter(function(c){return c.charAt(0)===g;})[0];
      if(!first)return;
      _cls=first;Store.set('roster-sel-cls',first);_search='';_detail=null;_tab='pdf';render();
    },
    selCls:function(cls){_cls=cls;Store.set('roster-sel-cls',cls);_search='';_detail=null;if(_tab!=='settings')_tab='pdf';render();},
    setTab:function(t){_tab=t;_detail=null;_counsels=null;_selStu=null;render();},
    setSearch:function(v){_search=v;render();},
    reloadSheet:function(){delete _sheetData[_cls];delete _sheetLoading[_cls];loadSheet(_cls);render();},
    showDetail:function(idx){_detail=_sheetData[_cls]?_sheetData[_cls].students[idx]:null;render();},
    closeDetail:function(){_detail=null;render();},
    goToCounsel:function(key){
      var parts=key.split('-');
      _selStu={key:key,num:parts[0],name:parts.slice(1).join('-')};
      _tab='counsel';_detail=null;_counsels=null;_counselLoading=false;render();
      loadCounsels(_cls,key,function(entries){_counsels=entries;_counselLoading=false;render();});
    },
    selStudent:function(key){
      if(!key){_selStu=null;_counsels=null;render();return;}
      var list=getCounselStudentList(_cls);
      for(var i=0;i<list.length;i++){if(list[i].key===key){_selStu=list[i];break;}}
      _counsels=null;render();
      loadCounsels(_cls,key,function(entries){_counsels=entries;_counselLoading=false;render();});
    },
    addManualStudent:function(){
      var num=(document.getElementById('mNum')||{}).value||'';
      var name=(document.getElementById('mName')||{}).value||'';
      if(!num.trim()||!name.trim()){toast('번호와 이름 입력');return;}
      var list=Store.get('roster-manual-'+_cls,[]);
      var key=num.trim()+'-'+name.trim();
      if(list.some(function(s){return s.key===key;})){toast('이미 있는 학생');return;}
      list.push({key:key,num:num.trim(),name:name.trim()});
      list.sort(function(a,b){return(parseInt(a.num)||0)-(parseInt(b.num)||0);});
      Store.set('roster-manual-'+_cls,list);toast(name+' 추가됨');render();
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
    },
    saveCfg:function(field,inputId){
      var el=document.getElementById(inputId);
      if(!el||!el.value.trim()){toast('URL 입력');return;}
      if(!_cfg[_cls])_cfg[_cls]={};
      _cfg[_cls][field]=el.value.trim();
      Store.set('roster-cfg',_cfg);
      if(field==='sheetUrl'){delete _sheetData[_cls];delete _sheetLoading[_cls];}
      toast('저장됨');render();
    },
    clearCfg:function(field){
      if(!confirm('삭제할까요?'))return;
      if(_cfg[_cls])delete _cfg[_cls][field];
      Store.set('roster-cfg',_cfg);
      if(field==='sheetUrl'){delete _sheetData[_cls];delete _sheetLoading[_cls];}
      render();
    }
  };
})();
