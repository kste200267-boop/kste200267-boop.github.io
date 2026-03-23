// js/engine.js — 시간표 엔진
var Engine=(function(){
  var TD={},TS={},CTM={};
  var dm={'용':'용접','기':'기계','금':'금속','선':'선반','밀':'밀링'};
  function rebuild(wk){
    TD={};for(var t in TD_ORIGINAL)TD[t]={h:TD_ORIGINAL[t].h,s:TD_ORIGINAL[t].s.slice()};
    var ov=Store.getWeekOverrides(wk);
    for(var key in ov){var p=key.split('|'),t=p[0],d=p[1],pr=+p[2],sub=ov[key];
      var idx=si(d,pr);if(idx>=0&&TD[t]){var cls=TD[t].s[idx];if(cls){TD[t].s[idx]=null;if(TD[sub])TD[sub].s[idx]=cls}}}
    bTS();bCTM();
  }
  function bTS(){
    TS={};for(var t in TD){var c={},s=TD[t].s,idx=0;
      for(var di=0;di<5;di++){var d=DAYS[di],np=DP[d];for(var p=0;p<np;p++){var cl=s[idx];if(cl){if(CS[cl]){var sj=CS[cl][d][p];if(sj&&sj!=='자율'&&sj!=='동아리')c[sj]=(c[sj]||0)+1}else c[cl]=(c[cl]||0)+1}idx++}}
      var b=null,bn=0;for(var k in c)if(c[k]>bn){bn=c[k];b=k}
      if(b&&!CS[b]){var m=b.match(/\d([가-힣]+)\d/);if(m&&dm[m[1]])b=dm[m[1]]+'실기';else{var ch=b.charAt(1);if(dm[ch])b=dm[ch]+'실기'}}
      TS[t]=b||(TD[t].h===0?'관리직':'미지정');
    }
    TS['배종길']='사회';TS['조소윤']='체육';
  }
  function bCTM(){CTM={};for(var t in TD){var s=TD[t].s,idx=0;for(var di=0;di<5;di++){var d=DAYS[di],np=DP[d];for(var p=0;p<np;p++){if(s[idx])CTM[s[idx]+'|'+d+'|'+p]=t;idx++}}}}
  function si(d,p){var i=0;for(var di=0;di<5;di++){if(DAYS[di]===d)return i+p;i+=DP[DAYS[di]]}return-1}
  return{
    rebuild:rebuild,TD:function(){return TD},TS:function(){return TS},CTM:function(){return CTM},
    slot:function(t,d,p){var i=si(d,p);return(i>=0&&TD[t])?TD[t].s[i]||null:null},
    free:function(t,d,p){var i=si(d,p);return i>=0&&TD[t]&&!TD[t].s[i]},si:si,
    isSwapped:function(t,d,p,wk){var ov=Store.getWeekOverrides(wk);if(ov[t+'|'+d+'|'+p])return true;for(var k in ov){if(ov[k]===t){var pp=k.split('|');if(pp[1]===d&&+pp[2]===p)return true}}return false},
    today:function(){return{1:'월',2:'화',3:'수',4:'목',5:'금'}[new Date().getDay()]||null},
    nowP:function(){var n=new Date(),t=n.getHours()*60+n.getMinutes();for(var i=0;i<PT.length;i++){var a=PT[i].s.split(':'),b=PT[i].e.split(':');if(t>=a[0]*60+ +a[1]&&t<=b[0]*60+ +b[1])return i}return-1},
    names:function(){return Object.keys(TD).sort()},
    go1:function(){var r=[];for(var t in TD){var s=TD[t].s;for(var i=0;i<s.length;i++){if(s[i]&&s[i].charAt(0)==='1'){r.push(t);break}}}return r.sort()},
    allCls:function(){var a={};for(var t in TD){var s=TD[t].s;for(var i=0;i<s.length;i++){if(s[i]&&s[i]!=='동아리'&&s[i]!=='3학선')a[s[i]]=1}}return Object.keys(a).sort()}
  };
})();
