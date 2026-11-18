const jobs = {
  "전사": [20, 25, 10, 20, 10, 15],
  "마법사": [10, 5, 35, 15, 15, 20],
  "도적": [10, 10, 15, 35, 15, 15],
  "상인": [10, 5, 20, 10, 30, 25],
  "대장장이": [20, 25, 20, 15, 10, 10],
  "약초사": [15, 5, 30, 15, 20, 15],
  "사냥꾼": [20, 15, 10, 25, 10, 20],
  "농부": [25, 20, 10, 15, 15, 15],
  "학자": [10, 5, 35, 10, 25, 15],
  "귀족": [10, 10, 20, 10, 30, 20]
};
const statNames = ["체력", "힘", "지능", "민첩", "매력", "행운"];
const jobSelect = document.querySelector("#job");
const statsEl = document.querySelector("#stats");
const totalEl = document.querySelector("#total");
const notice = document.querySelector("#notice");
let currentStats = [];

Object.keys(jobs).forEach(job => {
  const option = document.createElement("option");
  option.value = job;
  option.textContent = job;
  jobSelect.appendChild(option);
});

function rollStats(job) {
  const base = jobs[job];
  // 각 능력치는 직업 기본값에서 -3~+3, 변화량의 합은 0이 되도록 다시 추첨합니다.
  for (let attempt = 0; attempt < 100000; attempt++) {
    const deltas = base.map(() => Math.floor(Math.random() * 7) - 3);
    if (deltas.reduce((a, b) => a + b, 0) !== 0) continue;
    const result = base.map((value, i) => value + deltas[i]);
    if (result.every(value => value >= 1 && value <= 100)) return result;
  }
  return [...base];
}

function renderStats() {
  statsEl.innerHTML = "";
  currentStats.forEach((value, index) => {
    const row = document.createElement("div");
    row.className = "stat";
    row.innerHTML = `<span>${statNames[index]}</span><div class="track"><div class="fill" style="width:${value}%"></div></div><strong>${value}</strong>`;
    statsEl.appendChild(row);
  });
  const total = currentStats.reduce((a, b) => a + b, 0);
  totalEl.textContent = `합계 ${total}`;
}

function reroll() {
  currentStats = rollStats(jobSelect.value);
  renderStats();
  notice.textContent = "새로운 능력치가 결정되었습니다. 모든 능력치의 합은 100입니다.";
}
jobSelect.addEventListener("change", reroll);
document.querySelector("#reroll").addEventListener("click", reroll);
document.querySelector("#start").addEventListener("click", () => {
  const life = { age: 15, job: jobSelect.value, stats: currentStats, startedAt: new Date().toISOString() };
  localStorage.setItem("eldoria-current-life", JSON.stringify(life));
  document.querySelector("#lifeText").textContent =
    `당신은 15살 ${life.job}(으)로 새로운 인생을 시작했습니다.`;
  document.querySelector("#life").classList.remove("hidden");
  notice.textContent = "인생이 저장되었습니다. (현재는 이 기기와 브라우저에 저장됩니다.)";
});
document.querySelector("#newLife").addEventListener("click", () => {
  document.querySelector("#life").classList.add("hidden");
  reroll();
  window.scrollTo({ top: 0, behavior: "smooth" });
});
reroll();
