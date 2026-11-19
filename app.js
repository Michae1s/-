const jobs = {
  "전사":[20,25,10,20,10,15],
  "마법사":[10,5,35,15,15,20],
  "도적":[10,10,15,35,15,15],
  "약초사":[15,5,30,15,20,15],
  "사냥꾼":[20,15,10,25,10,20],
  "귀족":[10,10,20,10,30,20]
};

const statNames=["체력","힘","지능","민첩","매력","행운"];
const rankNames=["견습 모험가","정식 모험가","숙련 모험가","베테랑 모험가","전설 모험가"];
const rankFame=[0,100,200,300,400];
const rankExamBase=[60,50,40,30];
const rankExamFee=[20,35,50,65];
const places=[
 {name:"에메랄드 숲",tier:0,gold:12,fame:4,lossGold:3,lossFame:2,stats:["체력","민첩"],jobs:["약초사","사냥꾼"]},
 {name:"초록빛 평원",tier:0,gold:8,fame:7,lossGold:2,lossFame:2,stats:["체력","행운"],jobs:["사냥꾼","귀족"]},
 {name:"잊힌 광산",tier:0,gold:20,fame:3,lossGold:5,lossFame:3,stats:["힘","체력"],jobs:["전사","도적"]},
 {name:"수정 동굴",tier:1,gold:25,fame:8,lossGold:6,lossFame:4,stats:["지능","행운"],jobs:["마법사"]},
 {name:"망각의 늪",tier:1,gold:12,fame:12,lossGold:5,lossFame:4,stats:["체력","지능"],jobs:["약초사"]},
 {name:"고대 유적",tier:1,gold:35,fame:7,lossGold:8,lossFame:5,stats:["지능","행운"],jobs:["마법사","귀족"]},
 {name:"영원의 설산",tier:2,gold:30,fame:12,lossGold:10,lossFame:6,stats:["체력","힘"],jobs:["전사","사냥꾼"]},
 {name:"망령의 성",tier:2,gold:20,fame:20,lossGold:12,lossFame:7,stats:["지능","매력"],jobs:["도적","귀족"]},
 {name:"용의 협곡",tier:2,gold:55,fame:10,lossGold:15,lossFame:8,stats:["힘","민첩"],jobs:["전사"]},
 {name:"태양의 신전",tier:3,gold:45,fame:25,lossGold:18,lossFame:10,stats:["지능","매력"],jobs:["마법사","귀족"]},
 {name:"심연의 미궁",tier:3,gold:70,fame:15,lossGold:20,lossFame:12,stats:["지능","행운"],jobs:["도적"]},
 {name:"천공의 섬",tier:3,gold:55,fame:30,lossGold:22,lossFame:13,stats:["민첩","행운"],jobs:["사냥꾼","귀족"]},
 {name:"신들의 무덤",tier:4,gold:120,fame:40,lossGold:40,lossFame:20,stats:["지능","행운"],jobs:[],special:true}
];
const rarityNames=["일반","고급","희귀","영웅","전설"];
const rarityBonus=[1,2,3,4,8];
const rarityTables=[
 [90,10,0,0,0],[65,25,10,0,0],[40,30,20,10,0],[20,35,25,15,5],[0,0,25,60,15]
];
const questTypes=[
 {name:"토벌",stats:["힘","체력","민첩"]},
 {name:"호위",stats:["체력","민첩","매력"]},
 {name:"탐험",stats:["지능","행운","체력"]},
 {name:"배달",stats:["민첩","체력","행운"]}
];
const tierNames=["초급","중급","상급","전설","특별"];
function clamp(n,min,max){return Math.max(min,Math.min(max,n))}
function weightedPick(items,weights){
 const total=weights.reduce((a,b)=>a+b,0);let roll=Math.random()*total;
 for(let i=0;i<items.length;i++){roll-=weights[i];if(roll<=0)return items[i]}
 return items[items.length-1];
}
function effectiveStats(){
 const out=[...game.stats];
 (game.inventory||[]).forEach(item=>{
   item.bonuses.forEach(([name,value])=>{const i=statNames.indexOf(name);if(i>=0)out[i]+=value});
   (item.penalties||[]).forEach(([name,percent])=>{const i=statNames.indexOf(name);if(i>=0)out[i]-=Math.floor(game.stats[i]*percent)});
 });
 return out;
}
function statValue(name){return effectiveStats()[statNames.indexOf(name)]||1}
function rankLabel(){return rankNames[game.rank||0]}
function moneyChange(amount){game.gold=Math.max(0,game.gold+amount)}
function fameChange(amount){game.fame=Math.max(0,game.fame+amount)}
function activityFinish(cost=1){
 game.activitiesLeft-=cost;
 if(game.activitiesLeft<=0){
   game.age++;
   game.activitiesLeft=3;
   game.exploreOptions=null;
   game.questOptions=null;
 }
 if(game.age>=50){endLife();return}
 renderEvent();
}
function activityHeader(){return `${game.age}세 · ${rankLabel()} · 남은 활동 ${game.activitiesLeft}/3`}
function makeQuestOptions(){
 const selected=[];
 const available=[...questTypes];
 for(let k=0;k<2;k++){
   let weights=available.map(q=>{
     const streak=game.questStreak?.type===q.name?(game.questStreak.count||0):0;
     return streak>=3?10:30;
   });
   const q=weightedPick(available,weights);
   selected.push({...q,difficulty:Math.random()<.5?"하급":"상급"});
   available.splice(available.indexOf(q),1);
 }
 return selected;
}
function updateQuestStreak(type){
 if(!game.questStreak)game.questStreak={type,count:0};
 if(game.questStreak.type===type)game.questStreak.count++;
 else game.questStreak={type,count:1};
}
function getUnlockedPlaces(){
 const maxTier=Math.min(game.rank||0,3);
 return places.filter(p=>p.tier<=maxTier&&!p.special);
}
function explorationWeights(list){
 return list.map(p=>{
   const base=[60,50,40,30][p.tier]||10;
   const avg=(statValue(p.stats[0])+statValue(p.stats[1]))/2;
   const jobBonus=p.jobs.includes(game.job)?5:0;
   return Math.min(100,base+jobBonus+avg/10);
 });
}
function rollExplorationPlace(){
 if((game.rank||0)===4 && Math.random()<.03)return places.find(p=>p.special);
 const list=getUnlockedPlaces();
 return weightedPick(list,explorationWeights(list));
}
function prepareExploreOptions(){
 if(!game.exploreOptions)game.exploreOptions=[rollExplorationPlace(),rollExplorationPlace()];
 return game.exploreOptions;
}
function gearRoll(place){
 const rarity=weightedPick([0,1,2,3,4],rarityTables[place.tier]);
 const bonus=rarityBonus[rarity];
 const stats=[...statNames].sort(()=>Math.random()-.5);
 const two=Math.random()<.3;
 const item={id:Date.now()+Math.random(),name:`${rarityNames[rarity]} ${["수호의 부적","탐험가의 장화","고대의 반지","용사의 망토","마력의 장신구"][Math.floor(Math.random()*5)]}`,rarity:rarityNames[rarity],bonuses:two?[[stats[0],bonus],[stats[1],bonus]]:[[stats[0],bonus]],penalties:[]};
 // Rare special equipment: one large boost and two base-stat reductions.
 if(rarity===4 && Math.random()<.10){
   item.name="전설의 대가";
   item.bonuses=[[stats[0],30]];
   item.penalties=[[stats[1],.5],[stats[2],.5]];
   item.special=true;
 }
 return item;
}
function itemDescription(item){
 const plus=item.bonuses.map(x=>`${x[0]} +${x[1]}`).join(", ");
 const minus=(item.penalties||[]).map(x=>`${x[0]} 기본 능력치 -${Math.round(x[1]*100)}%`).join(", ");
 return `${item.rarity} · ${plus}${minus?" · "+minus:""}`;
}
function receiveGear(item){
 if(game.inventory.length<6){game.inventory.push(item);present("장비 발견!",`${item.name}을(를) 획득했습니다. 장비 효과는 자동 적용됩니다.`,[itemDescription(item)]);nextAfterResult(()=>activityFinish(1));return}
 setEvent("가방이 가득 찼다",`${item.name}을(를) 발견했지만 장비가 6개 가득 찼습니다. 교체할 장비를 선택하세요.`,game.inventory.map((old,i)=>({label:`${old.name} 교체 (${itemDescription(old)})`,action:()=>{game.inventory[i]=item;present("장비 교체",`${old.name}을(를) 버리고 ${item.name}을(를) 장착했습니다.`,[itemDescription(item)]);nextAfterResult(()=>activityFinish(1))}})).concat([{label:"새 장비를 포기한다",action:()=>{present("장비를 포기했다","가방을 비우지 않고 새 장비를 두고 왔습니다.",[]);nextAfterResult(()=>activityFinish(1))}}]));
}
function showExplorationResult(place){
 const chosenIndex=(game.exploreOptions||[]).indexOf(place);
 if(chosenIndex>=0)game.exploreOptions.splice(chosenIndex,1);
 const avg=(statValue(place.stats[0])+statValue(place.stats[1]))/2;
 const base=[60,50,40,30,10][place.tier];
 const chance=clamp(base+avg,5,100);
 const success=Math.random()*100<chance;
 if(!success){
   game.hp=Math.max(0,game.hp-10);
   const lost=place.stats[Math.floor(Math.random()*place.stats.length)];
   const loss=[1,2,3,4,10][place.tier];
   const changes=changeStats({[lost]:-loss});
   moneyChange(-place.lossGold);fameChange(-place.lossFame);
   const details=[`체력 -10`,...changes,`금화 -${place.lossGold}`,`명성 -${place.lossFame}`,`성공 확률 ${Math.round(chance)}%`];
   present("탐험 실패",`${place.name} 탐험에 실패했습니다. 아이템은 발견하지 못했습니다.`,details);
   nextAfterResult(()=>{if(game.hp<=0)endLife();else activityFinish(1)});
   return;
 }
 moneyChange(place.gold);fameChange(place.fame);
 const amount=[1,2,3,4,5][place.tier];
 const changes=changeStats({[place.stats[0]]:amount,[place.stats[1]]:amount});
 const details=[`금화 +${place.gold}`,`명성 +${place.fame}`,...changes,`성공 확률 ${Math.round(chance)}%`];
 if(Math.random()<.03){
   game.hp=100;
   present("생명 물약 발견!",`${place.name} 탐험에 성공하고 희귀한 생명 물약을 발견했습니다. 체력이 100으로 회복됩니다. 장비는 발견하지 않았습니다.`,details.concat(["체력 100 회복"]));
   nextAfterResult(()=>activityFinish(1));return;
 }
 if(Math.random()<.70){
   const item=gearRoll(place);
   present("탐험 성공",`${place.name}에서 보물을 발견했습니다. 장비 발견 확률 70%에 성공했습니다.`,details);
   nextAfterResult(()=>receiveGear(item));return;
 }
 present("탐험 성공",`${place.name} 탐험을 마쳤습니다. 장비는 발견하지 못했습니다.`,details);
 nextAfterResult(()=>activityFinish(1));
}
function doQuest(q){
 game.questOptions=(game.questOptions||[]).filter(option=>option.name!==q.name);
 updateQuestStreak(q.name);
 const avg=q.stats.reduce((s,n)=>s+statValue(n),0)/q.stats.length;
 const chance=clamp((q.difficulty==="하급"?25:10)+avg,5,95);
 const ok=Math.random()*100<chance;
 if(ok){
   const g=q.difficulty==="하급"?15:32;
   const f=q.difficulty==="하급"?10:22;
   moneyChange(g);fameChange(f);
   const c=q.difficulty==="하급"?1:2;
   const changes=changeStats({[q.stats[0]]:c,[q.stats[1]]:c});
   present(`${q.difficulty} ${q.name} 의뢰 성공`,`${q.name} 의뢰를 성공적으로 마쳤습니다. 성공 확률 ${Math.round(chance)}%.`,[`금화 +${g}`,`명성 +${f}`,...changes]);
 }else{
   game.hp=Math.max(0,game.hp-5);
   const stat=q.stats[Math.floor(Math.random()*q.stats.length)];
   const d=q.difficulty==="하급"?1:2;
   const g=q.difficulty==="하급"?5:12, f=q.difficulty==="하급"?3:8;
   const changes=changeStats({[stat]:-d});
   moneyChange(-g);fameChange(-f);
   present(`${q.difficulty} ${q.name} 의뢰 실패`,`${q.name} 의뢰를 완수하지 못했습니다. 성공 확률 ${Math.round(chance)}%.`,["체력 -5",...changes,`금화 -${g}`,`명성 -${f}`]);
 }
 nextAfterResult(()=>{if(game.hp<=0)endLife();else activityFinish(1)});
}
function promotionAction(){
 const next=game.rank||0,fee=rankExamFee[next],base=rankExamBase[next];
 const top=effectiveStats().slice().sort((a,b)=>b-a).slice(0,2);
 const chance=clamp(base+(top[0]+top[1])/2,5,100);
 if(game.gold<fee){present("금화가 부족합니다",`승급 시험 비용은 금화 ${fee}개입니다.`,[]);nextAfterResult(renderEvent);return}
 moneyChange(-fee);
 if(Math.random()*100<chance){
   game.rank++;
   game.career=rankLabel();
   present("승급 시험 합격!",`${rankLabel()}으로 승급했습니다. 성공 확률 ${Math.round(chance)}%.`,[`금화 -${fee}`,`명성 기준 ${rankFame[game.rank]}`]);
 }else{
   fameChange(-20);
   const changes=changeStats(Object.fromEntries(statNames.map(n=>[n,-1])));
   present("승급 시험 불합격",`시험에 합격하지 못했습니다. 성공 확률 ${Math.round(chance)}%.`,[`금화 -${fee}`,"명성 -20",...changes]);
 }
 nextAfterResult(()=>activityFinish(2));
}

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
  $("hpLabel").textContent=game.hp;$("rankLabel").textContent=rankLabel();
  $("activityLabel").textContent=`${game.activitiesLeft}/3`;
  renderStats("gameStats",game.stats);
  const eff=effectiveStats();
  $("effectiveStats").innerHTML=statNames.map((n,i)=>`<div class="stat"><span>${n} (장비 적용)</span><b>${eff[i]}</b></div>`).join("");
  $("inventoryList").innerHTML=game.inventory.length?game.inventory.map((it,i)=>`<div class="gear"><b>${i+1}. ${it.name}</b><span>${itemDescription(it)}</span></div>`).join(""):"<p class='muted'>아직 장비가 없습니다. 탐험에서 장비를 발견할 수 있습니다.</p>";
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
  game={age:15,job:chosenJob,career:"아카데미 입학 결정",stats:[...previewStats],gold:20,fame:0,hp:100,rank:0,activitiesLeft:3,inventory:[],questStreak:{type:"",count:0},exploreOptions:null,questOptions:null,phase:"academyDecision",year:0,retired:false};
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
      {label:"입학하지 않고 모험가가 된다",action:()=>{game.career=rankLabel();game.phase="adventurer";present("모험가의 길","아카데미 대신 세상으로 나아갑니다.",[]);nextAfterResult(renderEvent)}}
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
      {label:"초급 모험가",action:()=>{game.career=rankLabel();game.phase="adventurer";present("모험가의 길","이제 넓은 세상으로 떠납니다.",[]);nextAfterResult(renderEvent)}}
    ]);
  } else if(game.phase==="professor"){
    setEvent(`${game.age}세 · 아카데미 교수`,"교수로서 한 해를 보냈습니다.","강의와 연구를 통해 경험을 쌓았습니다.",[
      {label:"교수 생활을 계속한다",action:()=>{let idx=Math.floor(Math.random()*6);let ch=changeStats(Object.fromEntries(statNames.map(n=>[n,1])));let extra=changeStats({[statNames[idx]]:2});game.gold+=4;game.age++;present("교수 생활의 성과","강의와 연구가 성과를 거두었습니다.",ch.concat(extra,"금화 +4"));nextAfterResult(renderEvent)}},
      {label:"교수직을 은퇴하고 모험가가 된다",action:()=>{game.career=rankLabel();game.phase="adventurer";present("새로운 도전","교수직에서 물러나 모험가로 새 출발합니다.",[]);nextAfterResult(renderEvent)}},
      {label:"인생을 마무리한다",action:()=>endLife()}
    ]);
  } else if(game.phase==="adventurer"){
    game.career=rankLabel();
    const options=[
      {label:"의뢰 수행",action:()=>showQuestMenu()},
      {label:"탐험",action:()=>showExploreMenu()},
      {label:"수련 (+2 무작위 능력치)",action:()=>{const i=Math.floor(Math.random()*6);const c=changeStats({[statNames[i]]:2});present("수련 결과",`${statNames[i]} 능력치를 단련했습니다.`,c);nextAfterResult(()=>activityFinish(1))}},
      {label:"휴식 (체력 +25)",action:()=>{const before=game.hp;game.hp=Math.min(100,game.hp+25);present("휴식",`체력이 ${game.hp-before} 회복되었습니다.`,[`체력 ${before} → ${game.hp}`]);nextAfterResult(()=>activityFinish(1))}}
    ];
    if((game.rank||0)<4 && game.fame>=rankFame[(game.rank||0)+1] && game.activitiesLeft>=2){
      options.push({label:`승급 시험 도전 (활동 2회 · 금화 ${rankExamFee[game.rank]}개)`,action:()=>promotionAction()});
    }
    options.push({label:"은퇴하고 인생을 마무리한다",action:()=>endLife()});
    setEvent(activityHeader(),"모험가의 활동",`올해 남은 활동 기회는 ${game.activitiesLeft}회입니다. 현재 명성 ${game.fame} / 다음 승급 기준 ${game.rank<4?rankFame[game.rank+1]:"최고 등급"} · 체력 ${game.hp}/100`,options);
  } else if(game.phase==="ended"){
    setEvent("인생의 끝","한 사람의 인생이 마무리되었습니다.",`${game.age}세까지 살아온 ${game.job}의 이야기였습니다. 새로운 인생을 시작할 수 있습니다.`,[
      {label:"새로운 인생 시작하기",action:()=>location.reload()}
    ]);
  }
  if(game.age>=50 && game.phase!=="ended"){endLife()}
}

function showQuestMenu(){
 if(game.activitiesLeft<1)return;
 if(!game.questOptions)game.questOptions=makeQuestOptions();
 const choices=game.questOptions.map(q=>({label:`${q.difficulty} ${q.name} 의뢰`,action:()=>doQuest(q)}));
 choices.push({label:"돌아가기",action:()=>renderEvent()});
 setEvent(activityHeader(),"길드 의뢰 게시판","올해 등장한 의뢰 두 가지 중 하나를 선택하세요. 같은 의뢰 유형은 한 해에 한 번만 선택할 수 있습니다.",choices);
}
function showExploreMenu(){
 if(game.activitiesLeft<1)return;
 const opts=prepareExploreOptions();
 const choices=opts.map((p,i)=>({label:`${p.name} · ${tierNames[p.tier]} 지역`,action:()=>showExplorationResult(p)}));
 choices.push({label:"돌아가기",action:()=>renderEvent()});
 setEvent(activityHeader(),"탐험 장소 선택","장소마다 성공 확률, 보상, 실패 위험이 다릅니다. 같은 장소가 두 번 등장할 수도 있습니다.",choices);
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
    {label:"중퇴하고 모험가가 된다",action:()=>{game.career=rankLabel();game.phase="adventurer";present("아카데미 중퇴","아카데미를 떠나 모험가의 길을 선택했습니다.",[]);nextAfterResult(renderEvent)}}
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
function advanceAdventurer(){activityFinish(1)}
function endLife(){game.phase="ended";game.career="인생 종료";renderEvent()}
$("jobSelect").value=chosenJob;refreshPreview();
