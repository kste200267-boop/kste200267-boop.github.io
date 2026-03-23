// data/teachers.js — 교사 37명 원본 시간표
var DAYS=['월','화','수','목','금'];
var DP={월:7,화:7,수:6,목:6,금:6};
var PT=[{s:'08:50',e:'09:40'},{s:'09:50',e:'10:40'},{s:'10:50',e:'11:40'},{s:'11:50',e:'12:40'},{s:'13:30',e:'14:20'},{s:'14:30',e:'15:20'},{s:'15:30',e:'16:20'}];

var TD_ORIGINAL={
'김진희':{h:16,s:[null,'1기1',null,null,null,'1용2',null,'1금1',null,'1기2',null,'1용1',null,null,'1기2',null,'1용2','1용1',null,'1기1',null,null,'1용2','1용1','1금1',null,'3선2','1기2','1기1','1금1',null,null]},
'김효경':{h:17,s:['2기1',null,'1금2',null,'2기2',null,null,'2금1',null,null,'1금2',null,'2기1','동아리','2금2','2금1',null,null,'2기1','2금2','2기2',null,'1금2',null,null,'2기1',null,'2금1',null,null,'2기2','2금2']},
'장은지':{h:19,s:['1금2','1용2',null,null,'1금1','1금2',null,'1기1',null,'1금2','1금1',null,'1기2',null,'1용2','1금2','1기1',null,null,'1용1','1기1',null,null,null,'1기2','1용1','1기2','1금1',null,null,'1용1','1용2']},
'조효정':{h:15,s:['2금2','1용1',null,null,null,null,null,null,null,'2용2',null,null,'2용2','동아리','2용1','1용2',null,'2용1','2용2',null,null,'1기1','1금1',null,'2용1',null,'2금2',null,'1기2',null,null,'1금2']},
'최은지':{h:13,s:[null,'1금2',null,'1금1',null,null,'1용2',null,null,null,'1용1','1금2',null,'동아리',null,null,null,'1기1','1기2',null,null,null,null,'1용2',null,'1기2',null,'1용1','1금1',null,null,'1기1']},
'원어민':{h:8,s:[null,null,null,'1금1',null,null,null,null,null,null,'1용1','1금2',null,null,null,null,null,'2용1','2용2',null,null,null,null,'1용2',null,'1기2',null,null,null,null,null,'1기1']},
'임성빈':{h:19,s:['1용2',null,'1용2','1기2','1금2',null,'1금1',null,'1기2','1용1','1기1',null,null,null,null,'1기1','1금2','1용2','1용1',null,null,'1금1',null,'1기1',null,null,'1금1','1용2',null,'1기2','1금2','1용1']},
'김스데반':{h:9,s:[null,'1기2','1금1','1금2','1용2',null,null,null,null,null,null,null,null,null,'1기1',null,null,null,null,null,'1용2',null,null,'1금2','1용1','1금1',null,null,null,null,null,null]},
'배종길':{h:9,s:[null,null,null,null,null,null,null,'1금2','1용1','1기1',null,'1기2','1금1',null,null,null,null,null,null,null,null,null,null,null,null,null,'1용1',null,'1용2','1기1','1기2',null]},
'이경주':{h:18,s:[null,'1금1',null,null,'1기1',null,'1용1','1기2','1금2',null,null,null,'1용1',null,'1금2','1기2',null,'1금1','1기1','1용2','1금2',null,null,'1금1',null,'1기1','1용2',null,'1용1',null,'1용2','1기2']},
'전우성':{h:12,s:[null,null,null,null,null,'3용2',null,'3선1',null,null,'1기2','1금1','1금2',null,null,null,'1용1','3밀2',null,'3선2',null,null,null,null,'3용1',null,null,null,null,'1용2','1기1','3밀1']},
'김현석':{h:17,s:[null,null,'2금2','2금2','2금2','2금2','2금2',null,'2금1','2금1','2금1','2금1','2금1','동아리',null,null,null,null,null,null,null,null,null,null,null,null,'3선1','3선1','3선1','3선1','3선1','3선1']},
'안언영':{h:19,s:['1기2',null,'1기1','1기1',null,'1기2','1기2',null,'1금1','1금1',null,'1용2','1용2',null,'1용1','1용1',null,null,'1용2','1기2','1금1','1금2',null,null,'1기1',null,'1금2','1금2',null,'1용1',null,null]},
'허수진':{h:18,s:[null,null,null,null,null,'2기2','2금1','2용2','2용2',null,'2용1','2기1','2금2',null,'2금1','2용1','2금2',null,'2금2','2기1',null,'2기2',null,null,'2금1',null,null,'2기1',null,'2용1','2용2','2기2']},
'박건우':{h:17,s:[null,'3용2',null,null,null,'1기1','1기1','1용2','1용2',null,null,null,null,null,null,null,'1기2','1기2','1금1','1금1',null,'1용1','1용1',null,'1금2','1금2','3용2','3용2','3용2','3용2',null,null]},
'최재훈':{h:14,s:['1금1',null,'1용1','1용1',null,null,null,null,null,'1용2','1용2',null,null,'동아리','1금1','1금1',null,null,'1금2','1금2',null,null,'1기2','1기2',null,null,'1기1','1기1',null,null,null,null]},
'김보라':{h:17,s:[null,null,null,null,'1용1','1용1',null,null,null,null,null,'1기1','1기1','동아리','3학선',null,null,null,null,null,'1기2','1기2',null,null,'1용2','1용2',null,null,'1금2','1금2','1금1','1금1']},
'김윤희':{h:6,s:[null,null,'1기2','1용2',null,null,null,'1용1','1기1',null,null,null,null,null,null,null,'1금1','1금2',null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
'조소윤':{h:9,s:[null,null,null,null,'1기2','1금1','1금2',null,null,null,null,null,null,null,null,null,null,null,null,null,'1용1','1용2','1기1','2기2','2기1','2금1',null,null,null,null,null,null]},
'전준우':{h:16,s:[null,null,'3용2','3용2','3용2',null,'2용2','3용1','3용1','3용1','3용1','3용1','3용1','동아리','2용2','2용2','2용2','2용2',null,'3용2',null,null,null,null,null,null,null,null,null,null,null,null]},
'강수연':{h:17,s:['2용2','2용2','2용2','2용2','2용2','2용2',null,'2용1','2용1','2용1',null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,'2용1',null,null,null,'2용1','2용1']},
'양원우':{h:17,s:[null,null,null,null,'3선1','3선1','3선1','3용2','3용2','3용2','3용2','3용2','3용2','동아리',null,null,null,null,null,null,null,null,null,null,null,null,'3선1','3선1','3선1',null,null,null]},
'구다현':{h:16,s:[null,null,null,null,null,null,null,null,null,null,null,null,null,null,'2기2','2기2','2기2','2기2',null,null,'2기1','2기1','2기1','2기1','2기1','2기1',null,null,'2기2','2기2','2기2',null]},
'김재훈':{h:16,s:['2금1','2금1','2금1','2금1','2금1','2금1',null,null,null,null,null,null,null,null,null,null,null,null,null,null,'2금2','2금2','2금2','2금2','2금2','2금2',null,null,null,null,null,null]},
'김만유':{h:17,s:[null,null,null,null,null,null,null,'2기2','2기2','2기2','2기2','2기2','2기2','동아리',null,null,null,null,'2기1','2기1','2기1',null,null,null,null,null,null,'2기1','2기1','2기1',null,null]},
'조한솔':{h:12,s:[null,null,null,null,null,null,null,null,null,null,'2용2','2용1','동아리',null,null,null,null,null,'2용1',null,null,null,null,null,null,null,'2용2','2용2',null,null,null,'2용1']},
'김보혜':{h:15,s:[null,'3선1',null,null,'2기1','2기1','2기1',null,'3선1','3선1','3선1','3선1','3선1',null,'2기1','2기1','2기1','2기1','3선1','3선1',null,null,null,null,null,null,null,null,null,null,null,null]},
'장혜영':{h:17,s:['1기1','2기1','2기1',null,null,null,null,'2기1','2기1','2기1','2기1',null,null,'동아리','2기2','2기2','2기2','2기2',null,null,null,null,'2기2',null,null,null,'2기2','2기2','2기2','2기2',null,null]},
'이민수':{h:21,s:['3밀2','3밀2','3밀2','3밀2','3밀2','3밀2','3밀2','3밀2','3밀2','3밀2','3밀2',null,null,'동아리','3밀2','3밀2','3밀2',null,'3밀2',null,null,null,null,null,null,null,null,'3밀2','3밀2','3밀2','3밀2','3밀2']},
'장용준':{h:17,s:['2기2',null,null,null,null,null,'3선2',null,null,null,'2기2','2기2','2기2','동아리','3선2','3선2','3선2','3선2','3선2',null,null,null,null,null,'2기2','2기2',null,null,'2기1','2기1','2기1','2기1']},
'최미향':{h:0,s:[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
'이병문':{h:0,s:[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
'신우동':{h:15,s:['3선2','3선2','3선2','3선2','3선2',null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,'3밀1','3밀1','3밀1','3밀1','3밀1','3밀1',null,null,null,null,null,null]},
'김태훈':{h:14,s:[null,null,null,null,null,null,null,null,null,null,null,null,null,null,'3용1','3용1','3용1','3용1','3용1','3용1',null,null,null,null,null,null,'3밀2',null,null,null,'3밀2','3밀2']},
'이창빈':{h:17,s:[null,null,null,null,null,null,null,'3밀1','3밀1','3밀1','3밀1','3밀1','3밀1','동아리','3밀1','3밀1','3밀1',null,'3밀1',null,null,null,null,null,null,null,null,'3밀1',null,null,null,null]},
'박정현':{h:16,s:['3용1','3용1','3용1','3용1','3용1','3용1','3용1',null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,'3용1',null,'3용1','3용1','3용1','3용1',null,null]},
'임재혁':{h:15,s:[null,null,null,null,null,null,null,'3선2','3선2','3선2','3선2','3선2','3선2','동아리',null,null,null,null,null,null,'3선2',null,null,null,null,null,null,null,null,null,null,null]}
};
