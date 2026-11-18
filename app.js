const STAT_NAMES = ["체력","힘","지능","민첩","매력","행운"];
const JOBS = {
  "전사":[20,25,10,20,10,15],"마법사":[10,5,35,15,15,20],"도적":[10,10,15,35,15,15],
  "상인":[10,5,20,10,30,25],"대장장이":[20,25,20,15,10,10],"약초사":[15,5,30,15,20,15],
  "사냥꾼":[20,15,10,25,10,20],"농부":[25,20,10,15,15,15],"학자":[10,5,35,10,25,15],"귀족":[10,10,20,10,30,20]
};
const COURSES = {
  "마법 수업":{focus:[2,5],desc:"마법 이론과 마력 제어를 배운다."},
  "검투 수업":{focus:[1,3],desc:"대련과 기초 전투 기술을 익힌다."},
  "학문 수업":{focus:[2,4],desc:"역사와 학문을 연구한다."},
  "탐험 수업":{focus:[0,5],desc:"야외 활동과 탐험 지식을 익힌다."}
};
const $ = s => document.querySelector(s);
let state = null;
function rand(n){return Math.floor(Math.random()*n)}
function pick(a){return a[rand(a.length)]}
function clamp(v){return Math.max(1,Math.min(60,v))}
function shuffle(a){return [...a].sort(()=>Math.random()-.5)}
function addStat(i,n){state.stats[i]=clamp(state.stats[i]+n)}
function log(t){state.logs.unshift(`${state.age}세 · ${t}`);state.logs=state.logs.slice(0,35)}
function statsHTML(){return `<div class="stats">${STAT_NAMES.map((n,i)=>`<div class="stat"><span>${n}</span><b>${state.stats[i]}</b><small> / 60</small><div class="bar"><i style="width:${state.stats[i]/60*100}%"></i></div></div>`).join("")}</div>`}
function headerHTML(){return `<div class="info-row"><span class="pill">${state.age}세</span><span class="pill">${state.job}</span><span class="pill">${state.path||"진로 미정"}</span><span class="pill">골드 ${state.gold}</span><span class="pill">명성 ${state.fame}</span></div>${statsHTML()}`}
function render(html){$("#game").innerHTML=html}
function startScreen(){
 render(`<div class="eyebrow2">NEW LIFE</div><h2>새로운 인생을 시작할까?</h2><p class="muted">직업을 선택하면 기본 능력치에 -3~+3의 무작위 변화가 적용돼. 총 능력치 합계는 100으로 유지돼.</p><div class="grid">${Object.entries(JOBS).map(([j,s])=>`<button class="choice" data-job="${j}"><strong>${j}</strong><small>체력 ${s[0]} · 힘 ${s[1]} · 지능 ${s[2]}<br>민첩 ${s[3]} · 매력 ${s[4]} · 행운 ${s[5]}</small></button>`).join("")}</div><div class="footer-note">시작 나이 15세 · 최대 나이 50세</div>`);
 document.querySelectorAll("[data-job]").forEach(b=>b.onclick=()=>newLife(b.dataset.job));
}
function newLife(job){
 const base=JOBS[job],delta=Array(6).fill(0);
 // Generate bounded random deltas in -3..3 with a total of zero.
 for(let tries=0;tries<500;tries++){
  const d=Array.from({length:6},()=>rand(7)-3);
  if(d.reduce((a,b)=>a+b,0)===0){d.forEach((v,i)=>delta[i]=v);break;}
 }
 state={age:15,job,stats:base.map((v,i)=>v+delta[i]),gold:20,fame:0,path:"진로 미정",academy:false,roommate:null,relationship:50,logs:[],retired:false};
 log(`${job}으로 새로운 인생을 시작했다.`);
 renderAcademyChoice();
}
function renderAcademyChoice(){
 render(`${headerHTML()}<div class="event-box"><div class="eyebrow2">AGE 15 · ACADEMY</div><h2>아카데미에 입학할까?</h2><p>아카데미에 입학하면 능력치를 빠르게 성장시킬 수 있지만, 골드와 명성을 얻을 기회는 상대적으로 적어. 입학하지 않으면 곧바로 초급 모험가의 길을 걷게 돼.</p><div class="actions"><button class="primary" id="enter">아카데미 입학</button><button class="secondary" id="skip">입학하지 않는다</button></div></div>`);
 $("#enter").onclick=()=>{state.academy=true;state.path="아카데미 학생";chooseRoommate()};
 $("#skip").onclick=()=>{state.academy=false;state.path="초급 모험가";log("아카데미에 입학하지 않고 모험가가 되었다.");adventurerTurn()};
}
function makeRoommates(){
 const names=["에린","카일","루시아","테오","미라","로웬","노아","셀린"];
 const jobs=Object.keys(JOBS);
 return Array.from({length:3},()=>{const job=pick(jobs),base=JOBS[job];return {name:pick(names),job,stats:base.map(v=>clamp(v+rand(7)-3))}});
}
function chooseRoommate(){
 state.candidates=makeRoommates();
 render(`${headerHTML()}<div class="eyebrow2">ROOMMATE SELECTION</div><h2>함께 지낼 룸메이트를 선택해</h2><p class="muted">선택한 룸메이트는 졸업하거나 중퇴할 때까지 함께해. 능력치는 협력 이벤트에 영향을 줄 수 있어.</p><div class="grid">${state.candidates.map((r,i)=>`<button class="choice" data-room="${i}"><strong>${r.name} · ${r.job}</strong><small>${STAT_NAMES.map((n,j)=>`${n} ${r.stats[j]}`).join(" / ")}</small></button>`).join("")}</div>`);
 document.querySelectorAll("[data-room]").forEach(b=>b.onclick=()=>{state.roommate=state.candidates[+b.dataset.room];log(`${state.roommate.name}와 룸메이트가 되었다.`);academyTurn()});
}
function randomNegative(course){
 const events={
 "마법 수업":()=>{addStat(2,1);addStat(0,-2);pay(5);return "마법 제어가 불안정해 체력 -2, 지능 +1. 치료비 5골드를 지불했다."},
 "검투 수업":()=>{addStat(1,1);addStat(3,-2);pay(5);return "훈련 중 발목을 다쳤다. 힘 +1, 민첩 -2. 치료비 5골드를 지불했다."},
 "학문 수업":()=>{addStat(2,2);addStat(0,-1);addStat(4,-2);pay(3);return "연구에 지나치게 몰두했다. 지능 +2, 체력 -1, 매력 -2. 회복비 3골드를 지불했다."},
 "탐험 수업":()=>{addStat(5,1);addStat(0,-1);pay(5);return "탐험 중 날씨가 나빠졌다. 행운 +1, 체력 -1. 장비 수리비 5골드를 지불했다."}
 };
 return events[course]();
}
function pay(n){const paid=Math.min(n,state.gold);state.gold-=paid;return paid}
function academyTurn(){
 if(state.age>=20){graduation();return}
 state.path="아카데미 학생";
 render(`${headerHTML()}<div class="eyebrow2">ACADEMY · YEAR ${state.age-14}</div><h2>${state.age}세, 올해의 수업</h2><p class="muted">수업 하나를 선택해. 일반 능력치는 매년 +1, 선택한 수업의 집중 능력치는 +4로 성장해.</p><div class="grid">${Object.entries(COURSES).map(([c,v])=>`<button class="choice" data-course="${c}"><strong>${c}</strong><small>${v.desc}<br>집중 능력치: ${v.focus.map(i=>STAT_NAMES[i]).join(" · ")}</small></button>`).join("")}</div>`);
 document.querySelectorAll("[data-course]").forEach(b=>b.onclick=()=>resolveCourse(b.dataset.course));
}
function resolveCourse(course){
 const focus=COURSES[course].focus;
 state.stats=state.stats.map((v,i)=>clamp(v+(focus.includes(i)?4:1)));
 log(`${course}를 수강했다. 집중 능력치가 성장했다.`);
 let note="";
 if(Math.random()<.05){note=randomNegative(course);log(note)}
 choiceEvent(note);
}
function choiceEvent(prefix=""){
 const events=["개인 활동","대회 참가","교우 관계","아카데미 중퇴","교수의 특별 지도","아카데미 장학금"];
 const event=pick(events);
 render(`${headerHTML()}<div class="event-box"><div class="eyebrow2">RANDOM EVENT</div><h2>${event}</h2><p>${eventDescription(event)}</p>${prefix?`<div class="notice">${prefix}</div>`:""}<div id="eventChoices"></div></div>`);
 const box=$("#eventChoices");
 if(event==="개인 활동"){
  box.innerHTML=`<div class="grid"><button class="choice" data-act="weak"><strong>약점 보완</strong><small>최저 능력치 +3 · 최고 능력치 -2</small></button><button class="choice" data-act="strong"><strong>강점 특화</strong><small>최고 능력치 +4 · 최저 능력치 -3</small></button><button class="choice" data-act="free"><strong>자유 연구</strong><small>원하는 능력치 +2 · 다른 무작위 능력치 -1</small></button></div>`;
  box.querySelectorAll("[data-act]").forEach(b=>b.onclick=()=>{let min=Math.min(...state.stats),max=Math.max(...state.stats),mins=state.stats.map((v,i)=>v===min?i:-1).filter(i=>i>=0),maxs=state.stats.map((v,i)=>v===max?i:-1).filter(i=>i>=0);if(b.dataset.act==="weak"){addStat(pick(mins),3);addStat(pick(maxs),-2);log("약점을 보완했다.")}else if(b.dataset.act==="strong"){addStat(pick(maxs),4);addStat(pick(mins),-3);log("강점을 특화했다.")}else{renderFreeResearch();return}finishAcademyYear()});
 } else if(event==="대회 참가"){
  box.innerHTML=`<div class="grid">${[["최상위",10,40,-20],["상위",30,30,-15],["중위",55,20,-10],["하위",80,10,-5]].map(x=>`<button class="choice" data-comp="${x.join(",")}"><strong>${x[0]} 대회</strong><small>성공 ${x[1]}% · 성공 시 명성 +${x[2]} / 실패 시 ${x[3]}</small></button>`).join("")}</div>`;
  box.querySelectorAll("[data-comp]").forEach(b=>b.onclick=()=>{const [name,chance,win,lose]=b.dataset.comp.split(",").map((v,i)=>i?+v:v);const ok=rand(100)<chance;state.fame=Math.max(0,state.fame+(ok?win:lose));log(`${name} 대회 ${ok?"성공":"실패"}: 명성 ${ok?"+":""}${ok?win:lose}`);finishAcademyYear()});
 } else if(event==="교우 관계"){
  const type=pick(["친구","경쟁자","인연"]);
  const outcomes=type==="친구"?"성공 80%: 무작위 3개 +1 / 실패 20%: 무작위 1개 -1":type==="경쟁자"?"성공 50%: 무작위 1개 +5 / 실패 50%: 무작위 1개 -5":"무작위 능력치 1개 +1";
  box.innerHTML=`<div class="notice">${type}를 만났다. ${outcomes}</div><button class="primary" id="meet">만남 이어가기</button>`;
  $("#meet").onclick=()=>{if(type==="친구"){if(rand(100)<80){shuffle([0,1,2,3,4,5]).slice(0,3).forEach(i=>addStat(i,1));log("친구와 교류하며 무작위 능력치 3개가 성장했다.")}else{addStat(rand(6),-1);log("친구와의 관계가 어색해져 능력치가 감소했다.")}}else if(type==="경쟁자"){const ok=rand(2)===0;addStat(rand(6),ok?5:-5);log(`경쟁자와의 만남: ${ok?"능력치 +5":"능력치 -5"}`)}else{addStat(rand(6),1);log("특별한 인연을 만나 능력치가 성장했다.")}finishAcademyYear()};
 } else if(event==="아카데미 중퇴"){
  box.innerHTML=`<div class="actions"><button class="primary" id="stay">계속 다닌다</button><button class="secondary" id="drop">중퇴하고 모험가가 된다</button></div>`;
  $("#stay").onclick=()=>{log("아카데미에 남기로 했다.");finishAcademyYear()};
  $("#drop").onclick=()=>{state.academy=false;state.roommate=null;state.path="초급 모험가";log("아카데미를 중퇴하고 초급 모험가가 되었다.");adventurerTurn()};
 } else if(event==="교수의 특별 지도"){
  box.innerHTML=`<p class="muted">서로 바꿀 능력치 두 개를 선택해.</p><div class="grid"><select id="swapA">${STAT_NAMES.map((n,i)=>`<option value="${i}">${n}</option>`)}</select><select id="swapB">${STAT_NAMES.map((n,i)=>`<option value="${i}" ${i===1?"selected":""}>${n}</option>`).join("")}</select><select id="newJob">${Object.keys(JOBS).map(j=>`<option>${j}</option>`).join("")}</select></div><button class="primary" id="swap">능력치 교환 및 직업 변경</button>`;
  $("#swap").onclick=()=>{const a=+$("#swapA").value,b=+$("#swapB").value;if(a===b){alert("서로 다른 능력치를 선택해 줘.");return}[state.stats[a],state.stats[b]]=[state.stats[b],state.stats[a]];state.job=$("#newJob").value;log(`교수의 지도로 ${STAT_NAMES[a]}와 ${STAT_NAMES[b]}를 교환하고 ${state.job}(으)로 직업을 변경했다.`);finishAcademyYear()};
 } else {
  box.innerHTML=`<p>교수가 장학금 신청을 권유했다. 신청하면 50% 확률로 30골드를 받을 수 있지만 실패하면 행운이 7 감소한다.</p><div class="actions"><button class="primary" id="apply">장학금 신청</button><button class="secondary" id="decline">거절</button></div>`;
  $("#apply").onclick=()=>{if(rand(2)===0){state.gold+=30;log("장학금 신청에 성공해 30골드를 받았다.")}else{addStat(5,-7);log("장학금 신청에 실패해 행운이 7 감소했다.")}finishAcademyYear()};
  $("#decline").onclick=()=>{log("장학금 신청을 거절했다.");finishAcademyYear()};
 }
}
function eventDescription(e){return {"개인 활동":"자신의 부족한 점을 보완하거나 강점을 더 키울 기회가 찾아왔다.","대회 참가":"아카데미에서 실력을 겨루는 대회가 열린다. 참가할 대회 수준을 선택해.","교우 관계":"새로운 친구, 경쟁자 또는 특별한 인연을 만날 수 있다.","아카데미 중퇴":"아카데미를 계속 다닐지, 지금 모험가의 길로 나설지 결정할 수 있다.","교수의 특별 지도":"교수가 당신의 가능성을 발견하고 능력치 교환과 직업 변경을 제안했다.","아카데미 장학금":"교수가 장학금 신청을 추천했다."}[e]}
function renderFreeResearch(){
 render(`${headerHTML()}<div class="event-box"><h2>자유 연구</h2><p>성장시키고 싶은 능력치를 선택해.</p><div class="grid">${STAT_NAMES.map((n,i)=>`<button class="choice" data-free="${i}"><strong>${n} +2</strong></button>`).join("")}</div></div>`);
 document.querySelectorAll("[data-free]").forEach(b=>b.onclick=()=>{const target=+b.dataset.free;let candidates=[0,1,2,3,4,5].filter(i=>i!==target);addStat(target,2);addStat(pick(candidates),-1);log(`${STAT_NAMES[target]}을(를) 집중 연구했다.`);finishAcademyYear()});
}
function finishAcademyYear(){
 generalEvent();
 if(!state.academy)return;
 if(state.age===19){state.age=20;graduation();return}
 state.age++;academyTurn();
}
function generalEvent(){
 const events=[
  ()=>{state.gold+=5;log("길에서 작은 주머니를 발견했다. 골드 +5.")},
  ()=>{addStat(rand(6),1);log("뜻밖의 경험으로 무작위 능력치 +1.")},
  ()=>{const paid=pay(3);log(`생활용품을 구매했다. 골드 -${paid}.`)},
  ()=>{state.fame+=2;log("작은 선행이 소문나 명성 +2.")},
  ()=>{if(state.roommate&&rand(100)<50){state.relationship=Math.min(100,state.relationship+10);if(rand(100)<state.relationship/2){addStat(4,1);log(`${state.roommate.name}와 친해져 매력 +1.`)}else log(`${state.roommate.name}와 함께 시간을 보내 친밀도가 올랐다.`)}else log("평범하고 조용한 하루를 보냈다.")}
 ];
 pick(events)();
}
function graduation(){
 state.academy=false;state.roommate=null;state.path="졸업생";
 render(`${headerHTML()}<div class="event-box"><div class="eyebrow2">AGE 20 · GRADUATION</div><h2>아카데미 졸업!</h2><p>5년간의 아카데미 생활이 끝났다. 이제 어떤 길을 걸을지 선택해.</p><div class="grid"><button class="choice" id="prof"><strong>아카데미 교수</strong><small>교수로 일하며 능력치를 더 성장시킨다. 원할 때 은퇴할 수 있다.</small></button><button class="choice" id="adv"><strong>초급 모험가</strong><small>아카데미를 떠나 의뢰와 탐험을 시작한다.</small></button></div></div>`);
 $("#prof").onclick=()=>{state.path="아카데미 교수";log("졸업 후 아카데미 교수가 되었다.");professorTurn()};
 $("#adv").onclick=()=>{state.path="초급 모험가";log("졸업 후 초급 모험가가 되었다.");adventurerTurn()};
}
function professorTurn(){
 if(state.age>=50){endLife("50세가 되어 인생의 여정을 마쳤다.");return}
 render(`${headerHTML()}<div class="event-box"><div class="eyebrow2">PROFESSOR LIFE</div><h2>${state.age}세, 교수 생활</h2><p>아카데미에서 후배들을 가르치며 연구를 이어간다. 매년 능력치가 성장하고 교수 관련 사건이 발생한다.</p><div class="notice">교수 생활: 매년 모든 능력치 +1, 무작위 능력치 1개 추가 +2</div><div class="actions"><button class="primary" id="work">교수 생활 1년 진행</button><button class="secondary" id="retire">은퇴하고 초급 모험가 되기</button></div></div>`);
 $("#work").onclick=()=>{state.stats=state.stats.map(v=>clamp(v+1));addStat(rand(6),2);state.gold+=4;log("교수로 학생들을 가르치고 연구했다. 모든 능력치 +1, 무작위 능력치 +2, 골드 +4.");state.age++;professorTurn()};
 $("#retire").onclick=()=>{state.path="초급 모험가";log("교수직에서 은퇴하고 초급 모험가가 되었다.");adventurerTurn()};
}
function adventurerTurn(){
 if(state.age>=50){endLife("50세가 되어 인생의 여정을 마쳤다.");return}
 render(`${headerHTML()}<div class="event-box"><div class="eyebrow2">ADVENTURER LIFE</div><h2>${state.age}세, 모험가의 하루</h2><p>새로운 의뢰와 탐험이 기다리고 있다. 한 해를 보내며 경험을 쌓아 보자.</p><div class="grid"><button class="choice" id="quest"><strong>의뢰 수행</strong><small>골드와 명성을 얻을 기회</small></button><button class="choice" id="train"><strong>자기 수련</strong><small>무작위 능력치 성장</small></button><button class="choice" id="explore"><strong>탐험</strong><small>예상치 못한 발견</small></button></div><div class="actions"><button class="ghost" id="retireNow">은퇴하고 인생 종료</button></div></div>`);
 $("#quest").onclick=()=>{const ok=rand(100)<65;if(ok){state.gold+=12;state.fame+=5;log("의뢰를 성공적으로 마쳤다. 골드 +12, 명성 +5.")}else{addStat(rand(6),-1);log("의뢰가 뜻대로 풀리지 않았다. 무작위 능력치 -1.")}advanceAdventurer()};
 $("#train").onclick=()=>{addStat(rand(6),3);log("수련을 통해 무작위 능력치 +3.");advanceAdventurer()};
 $("#explore").onclick=()=>{if(rand(2)){state.gold+=8;addStat(5,1);log("탐험 중 유물을 발견했다. 골드 +8, 행운 +1.")}else{addStat(0,-1);log("탐험 중 지쳐 체력 -1.")}advanceAdventurer()};
 $("#retireNow").onclick=()=>endLife("모험가 생활을 마치고 은퇴했다.");
}
function advanceAdventurer(){state.age++;adventurerTurn()}
function endLife(message){
 render(`${headerHTML()}<div class="event-box"><div class="eyebrow2">LIFE COMPLETE</div><h2>한 인생의 끝</h2><p>${message}</p><p>이번 인생: ${state.job} · 최종 나이 ${state.age}세 · 골드 ${state.gold} · 명성 ${state.fame}</p><div class="actions"><button class="primary" id="again">새 인생 시작</button></div></div>${logHTML()}`);
 $("#again").onclick=startScreen;
}
function logHTML(){return `<h3>인생 기록</h3><div class="log">${state.logs.map(x=>`<div>${x}</div>`).join("")}</div>`}
$("#resetBtn").onclick=()=>{if(confirm("현재 인생을 끝내고 새 인생을 시작할까?"))startScreen()};
startScreen();
