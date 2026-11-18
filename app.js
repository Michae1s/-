const jobs = {
  "전사":[20,25,10,20,10,15],"마법사":[10,5,35,15,15,20],"도적":[10,10,15,35,15,15],
  "상인":[10,5,20,10,30,25],"대장장이":[20,25,20,15,10,10],"약초사":[15,5,30,15,20,15],
  "사냥꾼":[20,15,10,25,10,20],"농부":[25,20,10,15,15,15],"학자":[10,5,35,10,25,15],"귀족":[10,10,20,10,30,20]
};
const statNames=["체력","힘","지능","민첩","매력","행운"];
const $=id=>document.getElementById(id);
let chosenJob="전사", previewStats=[], game=null, pending=null;

function variedStats(base){
  // Keep the total at 100 while varying each stat within approximately -3..+3.
  let a=[...base];
  for(let i=0;i<6;i++){
    let j=Math.floor(Math.random()*6);
    if(i===j) continue;
    let d=Math.floor(Math.random()*7)-3;
    d=Math.max(-3,Math.min(3,d,a[i]-1,60-a[j]));
    a[i]-=d;a[j]+=d;
  }
  return a;
}
function renderStats(target,arr){
  $(target).innerHTML=statNames.map((n,i)=>`<div class="stat"><span>${n}</span><b>${arr[i]}</b></div>`).join("");
}
function refreshPreview(){previewStats=variedStats(jobs[chosenJob]);renderStats("startStats",previewStats)}
function updateStatus(){
  $("ageLabel").textContent=game.age+"세";$("careerLabel").textContent=game.career;
  $("goldLabel").textContent=game.gold;$("fameLabel").textContent=game.fame;
  $("statusAge").textContent=game.age+"세";$("statusJob").textContent=game.job;
  $("statusGold").textContent=game.gold;$("statusFame").textContent=game.fame;
  renderStats("gameStats",game.stats);
}
function showTab(tab){
  document.querySelectorAll(".tab").forEach(b=>b.classList.toggle("active",b.dataset.tab===tab));
  $("eventView").classList.toggle("hidden",tab!=="event");$("statusView").classList.toggle("hidden",tab!=="status");
}
document.querySelectorAll(".tab").forEach(b=>b.addEventListener("click",()=>showTab(b.dataset.tab)));
Object.keys(jobs).forEach(j=>{let o=document.createElement("option");o.value=j;o.textContent=j;$("jobSelect").append(o)});
$("jobSelect").addEventListener("change",e=>{chosenJob=e.target.value;refreshPreview()});
$("rerollBtn").addEventListener("click",refreshPreview);
$("startBtn").addEventListener("click",()=>{
  game={age:15,job:chosenJob,career:"아카데미 입학 결정",stats:[...previewStats],gold:20,fame:0,phase:"academyDecision",year:0,retired:false};
  $("setup").classList.add("hidden");$("game").classList.remove("hidden");updateStatus();renderEvent();
});
function present(title,text,changes=[]){
  $("resultTitle").textContent=title;$("resultText").textContent=text;
  $("resultChanges").innerHTML=changes.map(c=>`<span class="change">${c}</span>`).join("");
  $("resultBox").classList.remove("hidden");$("choices").classList.add("hidden");
  $("continueBtn").onclick=()=>{pending=null;$("resultBox").classList.add("hidden");$("choices").classList.remove("hidden");if(pendingNext)pendingNext();};
}
let pendingNext=null;
function setEvent(phase,title,text,choices){
  // Support both 4-argument calls (phase, title, description, choices)
  // and legacy 3-argument calls (phase, description, choices).
  if (choices === undefined) {
    choices = text;
    text = title;
    title = phase;
  }
  $("phaseLabel").textContent=phase;
  $("eventTitle").textContent=title;
  $("eventText").textContent=typeof text === "string" ? text : "";
  $("choices").innerHTML="";
  $("resultBox").classList.add("hidden");
  $("choices").classList.remove("hidden");
  (Array.isArray(choices) ? choices : []).forEach(c=>{
    let b=document.createElement("button");
    b.className="choice";
    b.textContent=typeof c.label === "string" ? c.label : "선택하기";
    b.onclick=typeof c.action === "function" ? c.action : ()=>{};
    $("choices").append(b);
  });
}
function changeStats(changes){
  let labels=[];
  Object.entries(changes).forEach(([name,val])=>{let i=statNames.indexOf(name);if(i<0)return;let before=game.stats[i];game.stats[i]=Math.max(1,Math.min(60,before+val));let actual=game.stats[i]-before;if(actual)labels.push(`${name} ${actual>0?"+":""}${actual}`)});
  return labels;
}
function nextAfterResult(fn){pendingNext=fn}
function renderEvent(){
  updateStatus();
  if(game.phase==="academyDecision"){
    game.career="진로 선택";
    setEvent("15세 · 인생의 첫 선택","아카데미에 입학하면 능력치를 빠르게 성장시킬 수 있지만, 금화와 명성을 얻을 기회는 적어집니다.",[
      {label:"아카데미에 입학한다",action:()=>{game.career="아카데미 학생";game.phase="academy";game.year=0;present("아카데미 입학","5년 동안 매년 수업을 선택합니다.",[],);nextAfterResult(renderEvent)}},
      {label:"입학하지 않고 모험가가 된다",action:()=>{game.career="초급 모험가";game.phase="adventurer";present("모험가의 길","아카데미 대신 세상으로 나아갑니다.",[]);nextAfterResult(renderEvent)}}
    ]);
  } else if(game.phase==="academy"){
    if(game.year>=5){game.age=20;game.phase="careerChoice";game.career="졸업생";renderEvent();return}
    const courses=[
      ["마법 수업","지능", "행운"],["검투 수업","힘","민첩"],["학문 수업","지능","매력"],["탐험 수업","체력","행운"]
    ];
    setEvent(`${game.age}세 · 아카데미 ${game.year+1}년 차`,"올해 어떤 수업을 듣겠습니까?","수업을 선택하면 기본 능력치가 성장하고, 드물게 수업 중 사건이 발생합니다.",courses.map(c=>({label:c[0],action:()=>{
      let changes={};statNames.forEach(n=>changes[n]=1);changes[c[1]]+=3;changes[c[2]]+=3;
      let ch=changeStats(changes);let msg=`${c[0]}을(를) 성실히 수강했습니다.`;
      if(Math.random()<.05){let incident=[["마법 실험 중 체력이 떨어졌다",{체력:-2,지능:1},-5],["검투 실습 중 부상을 입었다",{민첩:-2,힘:1},-5],["학문 연구에 몰두해 컨디션이 나빠졌다",{체력:-1,지능:2,매력:-2},-3],["탐험 수업 중 장비를 수리했다",{체력:-1,행운:1},-5]][Math.floor(Math.random()*4)];let extra=changeStats(incident[1]);game.gold=Math.max(0,game.gold+incident[2]);msg+=" "+incident[0];ch=ch.concat(extra,`금화 ${incident[2]}`)}
      game.year++;game.age=15+game.year;present("수업 결과",msg,ch);nextAfterResult(()=>{game.phase="academyRandom";renderEvent()});
    }})));
  } else if(game.phase==="academyRandom"){
    const r=Math.floor(Math.random()*6);
    if(r===0) personalEvent(); else if(r===1) contestEvent(); else if(r===2) socialEvent(); else if(r===3) dropoutEvent(); else if(r===4) professorEvent(); else scholarshipEvent();
  } else if(game.phase==="careerChoice"){
    setEvent("20세 · 졸업","아카데미를 졸업했습니다. 앞으로 어떤 길을 걷겠습니까?",[
      {label:"아카데미 교수",action:()=>{game.career="아카데미 교수";game.phase="professor";present("교수 임용","후배들을 가르치며 학문을 이어갑니다.",[]);nextAfterResult(renderEvent)}},
      {label:"초급 모험가",action:()=>{game.career="초급 모험가";game.phase="adventurer";present("모험가의 길","이제 넓은 세상으로 떠납니다.",[]);nextAfterResult(renderEvent)}}
    ]);
  } else if(game.phase==="professor"){
    setEvent(`${game.age}세 · 아카데미 교수`,"교수로서 한 해를 보냈습니다.","강의와 연구를 통해 경험을 쌓았습니다.",[
      {label:"교수 생활을 계속한다",action:()=>{let idx=Math.floor(Math.random()*6);let ch=changeStats(Object.fromEntries(statNames.map(n=>[n,1])));let extra=changeStats({[statNames[idx]]:2});game.gold+=4;game.age++;present("교수 생활의 성과","강의와 연구가 성과를 거두었습니다.",ch.concat(extra,"금화 +4"));nextAfterResult(renderEvent)}},
      {label:"교수직을 은퇴하고 모험가가 된다",action:()=>{game.career="초급 모험가";game.phase="adventurer";present("새로운 도전","교수직에서 물러나 모험가로 새 출발합니다.",[]);nextAfterResult(renderEvent)}},
      {label:"인생을 마무리한다",action:()=>endLife()}
    ]);
  } else if(game.phase==="adventurer"){
    setEvent(`${game.age}세 · 초급 모험가`,"모험가로서 어떤 하루를 보내겠습니까?","모험과 훈련을 통해 능력치와 재산을 키울 수 있습니다.",[
      {label:"의뢰를 수행한다",action:()=>{let ok=Math.random()<.65;let d=ok?15:-5;game.gold=Math.max(0,game.gold+d);if(ok)game.fame+=5;present(ok?"의뢰 성공":"의뢰 실패",ok?"의뢰를 무사히 마치고 보상을 받았습니다.":"의뢰를 완수하지 못해 시간을 허비했습니다.",[`금화 ${d>0?"+":""}${d}`,...(ok?["명성 +5"]:[])]);nextAfterResult(()=>advanceAdventurer())}},
      {label:"수련한다",action:()=>{let i=Math.floor(Math.random()*6);let ch=changeStats({[statNames[i]]:2});present("수련 결과",`${statNames[i]} 능력치를 집중적으로 단련했습니다.`,ch);nextAfterResult(()=>advanceAdventurer())}},
      {label:"탐험한다",action:()=>{let ok=Math.random()<.5;game.gold=Math.max(0,game.gold+(ok?10:0));let ch=ok?changeStats({행운:1}):[];present(ok?"탐험 성공":"별다른 성과가 없었다",ok?"탐험 중 값진 물건을 발견했습니다.":"위험을 피하느라 성과를 얻지 못했습니다.",ch.concat(ok?["금화 +10"]:[]));nextAfterResult(()=>advanceAdventurer())}},
      {label:"은퇴하고 인생을 마무리한다",action:()=>endLife()}
    ]);
  } else if(game.phase==="ended"){
    setEvent("인생의 끝","한 사람의 인생이 마무리되었습니다.",`${game.age}세까지 살아온 ${game.job}의 이야기였습니다. 새로운 인생을 시작할 수 있습니다.`,[
      {label:"새로운 인생 시작하기",action:()=>location.reload()}
    ]);
  }
  if(game.age>=50 && game.phase!=="ended"){endLife()}
}
function personalEvent(){
  setEvent("아카데미 · 개인 활동","개인 활동","자신의 능력을 발전시킬 방법을 선택하세요.",[
    {label:"약점 보완: 가장 낮은 능력치 +3, 가장 높은 능력치 -2",action:()=>{let lo=game.stats.indexOf(Math.min(...game.stats)),hi=game.stats.indexOf(Math.max(...game.stats));let c=changeStats({[statNames[lo]]:3,[statNames[hi]]:-2});present("약점 보완", "부족한 부분을 채우는 데 집중했습니다.",c);nextAfterResult(()=>{game.phase="academy";renderEvent()})}},
    {label:"강점 특화: 가장 높은 능력치 +4, 가장 낮은 능력치 -3",action:()=>{let lo=game.stats.indexOf(Math.min(...game.stats)),hi=game.stats.indexOf(Math.max(...game.stats));let c=changeStats({[statNames[hi]]:4,[statNames[lo]]:-3});present("강점 특화","자신 있는 분야를 더욱 갈고닦았습니다.",c);nextAfterResult(()=>{game.phase="academy";renderEvent()})}},
    {label:"자유 연구: 원하는 능력치 +2, 다른 능력치 -1",action:()=>{let i=prompt("올릴 능력치를 선택하세요: 체력, 힘, 지능, 민첩, 매력, 행운");if(!statNames.includes(i))return;let other=statNames.filter(n=>n!==i)[Math.floor(Math.random()*5)];let c=changeStats({[i]:2,[other]:-1});present("자유 연구", "관심 분야를 연구했습니다.",c);nextAfterResult(()=>{game.phase="academy";renderEvent()})}}
  ]);
}
function contestEvent(){
  let tiers=[["최상위 대회",.1,40,-20],["상위 대회",.3,30,-15],["중위 대회",.55,20,-10],["하위 대회",.8,10,-5]];
  setEvent("아카데미 · 대회 참가","대회 참가","어느 수준의 대회에 참가하겠습니까?",tiers.map(t=>({label:`${t[0]} (성공 확률 ${Math.round(t[1]*100)}%)`,action:()=>{let ok=Math.random()<t[1],d=ok?t[2]:t[3];game.fame=Math.max(0,game.fame+d);present(ok?"대회에서 성과를 거뒀다":"대회에서 아쉬운 결과를 얻었다",ok?"뛰어난 실력을 인정받았습니다.":"기대만큼의 결과를 얻지 못했습니다.",[`명성 ${d>0?"+":""}${d}`]);nextAfterResult(()=>{game.phase="academy";renderEvent()})}})));
}
function socialEvent(){
  let type=Math.floor(Math.random()*3);
  if(type===0){let ok=Math.random()<.8;if(ok){let picks=[...Array(6).keys()].sort(()=>Math.random()-.5).slice(0,3);let changes={};picks.forEach(i=>changes[statNames[i]]=1);let c=changeStats(changes);present("새로운 친구","친구와 함께하며 서로에게 좋은 영향을 받았습니다.",c)}else{let i=Math.floor(Math.random()*6),c=changeStats({[statNames[i]]:-1});present("친구와의 오해","작은 오해가 생겨 기운이 빠졌습니다.",c)}}
  else if(type===1){let ok=Math.random()<.5,i=Math.floor(Math.random()*6),c=changeStats({[statNames[i]]:ok?5:-5});present(ok?"경쟁에서 성장했다":"경쟁에서 밀렸다",ok?"경쟁자의 존재가 자극이 되었습니다.":"경쟁에서 아쉬운 결과를 얻었습니다.",c)}
  else{let i=Math.floor(Math.random()*6),c=changeStats({[statNames[i]]:1});present("특별한 인연","뜻밖의 만남이 좋은 자극이 되었습니다.",c)}
  nextAfterResult(()=>{game.phase="academy";renderEvent()});
}
function dropoutEvent(){
  setEvent("아카데미 · 중퇴 고민","중퇴 여부 결정","학업을 계속할까요, 아니면 아카데미를 떠나 모험가가 될까요?",[
    {label:"아카데미에 남는다",action:()=>{present("학업을 이어가기로 했다","남은 학업에 집중하기로 했습니다.",[]);nextAfterResult(()=>{game.phase="academy";renderEvent()})}},
    {label:"중퇴하고 모험가가 된다",action:()=>{game.career="초급 모험가";game.phase="adventurer";present("아카데미 중퇴","아카데미를 떠나 모험가의 길을 선택했습니다.",[]);nextAfterResult(renderEvent)}}
  ]);
}
function professorEvent(){
  let a=Math.floor(Math.random()*6),b;do{b=Math.floor(Math.random()*6)}while(a===b);
  setEvent("아카데미 · 교수의 특별 지도","교수의 특별 지도","교수가 특별 지도를 제안했습니다. 두 능력치의 수치를 맞바꾸고 직업을 바꿀 수 있습니다.",[
    {label:"특별 지도를 받는다",action:()=>{let x=game.stats[a];game.stats[a]=game.stats[b];game.stats[b]=x;let newJob=prompt("희망 직업을 입력하세요: "+Object.keys(jobs).join(", "),game.job);if(newJob&&jobs[newJob])game.job=newJob;present("특별 지도 완료",`${statNames[a]}와 ${statNames[b]}의 수치를 교환했습니다. 직업: ${game.job}`,[`${statNames[a]} ↔ ${statNames[b]}`]);nextAfterResult(()=>{game.phase="academy";renderEvent()})}},
    {label:"제안을 거절한다",action:()=>{present("평소처럼 수업을 이어간다","현재의 길을 유지하기로 했습니다.",[]);nextAfterResult(()=>{game.phase="academy";renderEvent()})}}
  ]);
}
function scholarshipEvent(){
  setEvent("아카데미 · 장학금","장학금 신청","장학금을 신청할 기회가 생겼습니다. 신청 성공 확률은 50%입니다.",[
    {label:"장학금을 신청한다",action:()=>{let ok=Math.random()<.5;if(ok){game.gold+=30;present("장학금 선정","성실한 노력을 인정받아 장학금을 받았습니다.",["금화 +30"])}else{let c=changeStats({행운:-7});present("장학금 탈락","아쉽게 선정되지 못해 자신감이 조금 떨어졌습니다.",c)}nextAfterResult(()=>{game.phase="academy";renderEvent()})}},
    {label:"신청하지 않는다",action:()=>{present("신청하지 않았다","이번에는 장학금 신청을 건너뛰었습니다.",[]);nextAfterResult(()=>{game.phase="academy";renderEvent()})}}
  ]);
}
function advanceAdventurer(){game.age++;if(game.age>=50)endLife();else renderEvent()}
function endLife(){game.phase="ended";game.career="인생 종료";renderEvent()}
$("jobSelect").value=chosenJob;refreshPreview();
