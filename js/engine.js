// js/engine.js — 시간표 엔진 (A주/B주 자동 전환)
// 패턴: 1,2주=A형 / 3,4주=B형 / 반복
var Engine=(function(){
  var TD={},TS={},CTM={};
  var dm={'용':'용접','기':'기계','금':'금속','선':'선반','밀':'밀링'};
  var _currentType='A'; // 현재 활성 주 타입

  // 주차 번호로 A/B 판별 (학기 시작 기준)
  function getWeekType(weekKey){
    // weekKey: "2026-W13" 형태
    // 학기 시작 주를 기준으로 4주 사이클
    var semStart=Store.get('sem-start-week',null);
    if(!semStart){
      // 기본: 3월 첫째 주
      var d=new Date(new Date().getFullYear(),2,2);// 3월 2일
      semStart=Store.weekKey(d);
    }
    var startNum=parseInt(semStart.split('-W')[1])||1;
    var curNum=parseInt((weekKey||Store.weekKey()).split('-W')[1])||1;
    var diff=curNum-startNum;
    if(diff<0)diff+=52;
    var pos=diff%4; // 0,1=A주 / 2,3=B주
    return pos<2?'A':'B';
  }

  function rebuild(wk){
    var type=getWeekType(wk);
    _currentType=type;

    // 원본에서 복사
    var src=type==='A'?TD_A:TD_B;
    TD={};
    for(var t in src)TD[t]={h:src[t].h,s:src[t].s.slice()};

    // 교사별 커스텀 로드
    for(var t in TD){
      var custom=Store.get('td-custom-'+t);
      if(custom)TD[t]={h:custom.h,s:custom.s.slice()};
    }

    // 학급 시간표도 전환
    var csSrc=type==='A'?CS_A:CS_B;
    for(var k in csSrc){CS[k]={};for(var d in csSrc[k])CS[k][d]=csSrc[k][d].slice()}
    var classEdits=Store.get('class-edits');
    if(classEdits){for(var k in classEdits)CS[k]=classEdits[k]}

    // 주차별 오버라이드 적용
    var ov=Store.getWeekOverrides(wk);
    for(var key in ov){var p=key.split('|'),t=p[0],d=p[1],pr=+p[2],sub=ov[key];
      var idx=si(d,pr);if(idx>=0&&TD[t]){var cls=TD[t].s[idx];if(cls){TD[t].s[idx]=null;if(TD[sub])TD[sub].s[idx]=cls}}}

    // 개인 수정사항 반영
    for(var t in TD){
      var edits=Store.get('myedit-'+t,{});
      for(var k in edits){var idx=parseInt(k);if(!isNaN(idx)&&idx>=0&&idx<32)TD[t].s[idx]=edits[k]||null}
    }

    bTS();bCTM();
  }

  function bTS(){
    TS={};for(var t in TD){var c={},s=TD[t].s,idx=0;
      for(var di=0;di<5;di++){var d=DAYS[di],np=DP[d];for(var p=0;p<np;p++){var cl=s[idx];if(cl){if(CS[cl]){var sj=CS[cl][d]?CS[cl][d][p]:null;if(sj&&sj!=='자율'&&sj!=='동아리')c[sj]=(c[sj]||0)+1}else c[cl]=(c[cl]||0)+1}idx++}}
      var b=null,bn=0;for(var k in c)if(c[k]>bn){bn=c[k];b=k}
      if(b&&!CS[b]){var m=b.match(/\d([가-힣]+)\d/);if(m&&dm[m[1]])b=dm[m[1]]+'실기';else{var ch=b.charAt(1);if(dm[ch])b=dm[ch]+'실기'}}
      TS[t]=b||(TD[t].h===0?'관리직':'미지정');
    }
    TS['배종길']='사회';TS['조소윤']='체육';
    // 과목 오버라이드
    var ov=Store.get('subj-ov',{});for(var k in ov)if(TS[k])TS[k]=ov[k];
  }

  function bCTM(){CTM={};for(var t in TD){var s=TD[t].s,idx=0;for(var di=0;di<5;di++){var d=DAYS[di],np=DP[d];for(var p=0;p<np;p++){if(s[idx])CTM[s[idx]+'|'+d+'|'+p]=t;idx++}}}}

  function si(d,p){var i=0;for(var di=0;di<5;di++){if(DAYS[di]===d)return i+p;i+=DP[DAYS[di]]}return-1}

  return{
    rebuild:rebuild,TD:function(){return TD},TS:function(){return TS},CTM:function(){return CTM},
    currentType:function(){return _currentType},
    getWeekType:getWeekType,
    slot:function(t,d,p){var i=si(d,p);return(i>=0&&TD[t])?TD[t].s[i]||null:null},
    free:function(t,d,p){var i=si(d,p);return i>=0&&TD[t]&&!TD[t].s[i]},si:si,
    isSwapped:function(t,d,p,wk){var ov=Store.getWeekOverrides(wk);if(ov[t+'|'+d+'|'+p])return true;for(var k in ov){if(ov[k]===t){var pp=k.split('|');if(pp[1]===d&&+pp[2]===p)return true}}return false},
    today:function(){return{1:'월',2:'화',3:'수',4:'목',5:'금'}[new Date().getDay()]||null},
    nowP:function(){var n=new Date(),t=n.getHours()*60+n.getMinutes();for(var i=0;i<PT.length;i++){var a=PT[i].s.split(':'),b=PT[i].e.split(':');if(t>=a[0]*60+ +a[1]&&t<=b[0]*60+ +b[1])return i}return-1},
    names:function(){return Object.keys(TD).sort()},
    go1:function(){var r=[];for(var t in TD){var s=TD[t].s;for(var i=0;i<s.length;i++){if(s[i]&&s[i].charAt(0)==='1'){r.push(t);break}}}return r.sort()},
allCls:function(){
  var a={};
  for(var t in TD){
    var s=TD[t].s;
    for(var i=0;i<s.length;i++){
      var v=s[i];
      if(!v) continue;
      if(v==='동아리' || v==='3학선' || v==='자율') continue;
      if(/^\d(용|기|금|선|밀)\d$/.test(v) || /^\d학생선택\(.+\)$/.test(v)){
        a[v]=1;
      }
    }
  }
  return Object.keys(a).sort();
}
  };
})();
