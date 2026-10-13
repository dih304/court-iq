'use strict';
const $ = id => document.getElementById(id);
const STORE_KEY = 'court-iq-player-v2';
const DEFAULTS = {profile:null, logs:[], shots:[], checkins:[], completedWeeks:[], journal:[], goals:[]};
let data = loadData();
let activeTab = 'home';
let activeDrills = [];
let checkedDrills = new Set();
let timerSeconds = 30, timerTotal = 30, timerInterval = null, timerRunning = false;
let selectedReadiness = null;
let toastTimeout = null;

const GOALS = {
  shooting:{name:'Shooting consistency',symbol:'◎',subtitle:'Build a repeatable shot and trust your mechanics.',focus:'shooting'},
  handles:{name:'Ball handling',symbol:'↝',subtitle:'Get comfortable changing pace and protecting the ball.',focus:'handles'},
  finishing:{name:'Finishing at the rim',symbol:'↗',subtitle:'Improve footwork, touch, and confidence around the basket.',focus:'finishing'},
  defense:{name:'Defense & footwork',symbol:'◇',subtitle:'Build balance, quick feet, and disciplined movement.',focus:'defense'},
  allaround:{name:'All-around game',symbol:'✦',subtitle:'Develop a balanced foundation across key skills.',focus:'allaround'}
};
const WEEK_THEMES = [
  ['Build your base','Own the fundamentals. Smooth, balanced reps come first.'],
  ['Repeat good habits','Use the same setup and focus on consistency.'],
  ['Add control','Change direction and pace without losing technique.'],
  ['Practice at pace','Add game-like movement while staying under control.'],
  ['Make smart reads','Choose the right move instead of forcing a highlight.'],
  ['Review & refine','Compare your notes and choose the next skill to build.']
];
const DRILLS = {
 shooting:[
  ['Form & balance','Easy close-range form reps. Hold your finish and stay balanced.',5],
  ['Spot shooting','Pick 3–5 spots and track makes out of attempts.',10],
  ['Free-throw routine','Take a breath, repeat your routine, and focus on the target.',5],
  ['Move into the shot','Practice footwork into a balanced shot at a comfortable pace.',7],
  ['Review your misses','Notice one pattern and choose a cue for next time.',3]
 ],
 handles:[
  ['Stationary control','Low pounds, crossovers, and between-the-legs at a controlled pace.',5],
  ['Moving control','Walk, then jog through changes of direction with eyes up.',8],
  ['Weak-hand focus','Give your less-comfortable hand extra clean repetitions.',7],
  ['Change of pace','Slow down, accelerate into space, and stay balanced.',6],
  ['Control finisher','Keep the ball close and count clean reps, not rushed reps.',4]
 ],
 finishing:[
  ['Footwork prep','Practice balanced gathers and controlled steps without rushing.',5],
  ['Strong-hand finishes','Approach under control and finish softly when a hoop is available.',8],
  ['Weak-hand practice','Work the less-comfortable side at a manageable speed.',8],
  ['Angle & balance','Approach from different safe angles and keep your body balanced.',6],
  ['Reset & repeat','Pick one footwork cue and repeat it cleanly.',3]
 ],
 defense:[
  ['Defensive stance','Stay balanced with hips back and eyes up; avoid overreaching.',4],
  ['Lateral footwork','Use short controlled slides; stop if your form breaks down.',7],
  ['Closeout technique','Approach under control, shorten steps, and stay balanced.',7],
  ['Reaction & recovery','Change direction with control and reset between reps.',7],
  ['Footwork review','Repeat the movement that felt least natural.',3]
 ],
 allaround:[
  ['Ball control','Warm up with both hands and keep your eyes up.',5],
  ['Shooting mechanics','Focus on balance, a consistent release, and follow-through.',8],
  ['Finishing footwork','Practice controlled gathers and both-side footwork.',7],
  ['Defense & movement','Work on stance, slides, and balanced stops.',6],
  ['Player review','Write down one win and one thing to revisit.',3]
 ]
};
const NO_BALL_DRILLS = [
 ['Dynamic warm-up','Easy marching, arm circles, ankle mobility, and gentle movement.',5],
 ['Footwork fundamentals','Practice balanced pivots and controlled steps in a clear space.',7],
 ['Defensive movement','Use small lateral steps with control and plenty of rest.',7],
 ['Visualization','Picture a confident game action and the decision you would make.',5],
 ['Quick review','Choose one skill cue to remember next time.',3]
];

function loadData(){
  try {
    const parsed = JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
    return {...DEFAULTS, ...parsed,
      logs:Array.isArray(parsed.logs)?parsed.logs:[],
      shots:Array.isArray(parsed.shots)?parsed.shots:[],
      checkins:Array.isArray(parsed.checkins)?parsed.checkins:[],
      completedWeeks:Array.isArray(parsed.completedWeeks)?parsed.completedWeeks:[],
      journal:Array.isArray(parsed.journal)?parsed.journal:[],
      goals:Array.isArray(parsed.goals)?parsed.goals:[]};
  } catch(e) { return {...DEFAULTS}; }
}
function saveData(){
  try { localStorage.setItem(STORE_KEY, JSON.stringify(data)); return true; }
  catch(e) { showToast('Could not save: device storage may be full. Export your stats.'); return false; }
}
function esc(value){
  return String(value ?? '').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function localDate(date=new Date()){
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}
function dateOffset(days){
  const d=new Date(); d.setHours(12,0,0,0); d.setDate(d.getDate()+days); return localDate(d);
}
function formatDate(key){
  const d=new Date(`${key}T12:00:00`);
  if(Number.isNaN(d.getTime())) return key;
  return d.toLocaleDateString(undefined,{month:'short',day:'numeric'});
}
function weekStart(date=new Date()){
  const d=new Date(date); d.setHours(0,0,0,0); d.setDate(d.getDate()-(d.getDay()+6)%7); return localDate(d);
}
function logsThisWeek(){
  const start=weekStart();
  return data.logs.filter(l=>l.date>=start && l.date<=localDate()).length;
}
function minutesThisWeek(){
  const start=weekStart();
  return data.logs.filter(l=>l.date>=start && l.date<=localDate()).reduce((sum,l)=>sum+(Number(l.minutes)||0),0);
}
function currentStreak(){
  const unique=[...new Set(data.logs.map(l=>l.date))].sort().reverse();
  if(!unique.length) return 0;
  let cursor=unique.includes(localDate())?localDate():dateOffset(-1);
  if(!unique.includes(cursor)) return 0;
  let count=0;
  while(unique.includes(cursor)){count++; const d=new Date(`${cursor}T12:00:00`);d.setDate(d.getDate()-1);cursor=localDate(d);}
  return count;
}
function bestStreak(){
  const days=[...new Set(data.logs.map(l=>l.date))].sort();
  let best=0, run=0, prev=null;
  for(const day of days){
    const gap=prev?Math.round((new Date(`${day}T12:00:00`)-new Date(`${prev}T12:00:00`))/86400000):0;
    run=prev&&gap===1?run+1:1; best=Math.max(best,run); prev=day;
  }
  return best;
}
function profileDefaults(){
  return {name:'Player',goal:'allaround',level:'intermediate',days:'4',duration:'30',equipment:'court',target:''};
}
function getProfile(){return {...profileDefaults(),...(data.profile||{})};}
function workoutForToday(){
  const p=getProfile();
  let raw=p.equipment==='none' ? NO_BALL_DRILLS : [...(DRILLS[p.goal]||DRILLS.allaround)];
  if(p.equipment==='space') raw=raw.map(d=>[d[0],d[1].replace(/when a hoop is available/g,'as shadow reps without a hoop').replace(/Pick 3–5 spots and track makes out of attempts\./g,'Choose a safe spot and rehearse your shot motion without a hoop.').replace(/Free-throw routine/g,'Shooting routine (no hoop)').replace(/Take a breath, repeat your routine, and focus on the target\./g,'Repeat your routine and focus on a consistent release.').replace(/Practice footwork into a balanced shot at a comfortable pace\./g,'Practice footwork into a balanced shadow shot.').replace(/finishes softly when a hoop is available/g,'rehearse a soft finish motion').replace(/finish softly/g,'rehearse the finishing motion'),d[2]]);
  const total=Number(p.duration)||30;
  const original=raw.reduce((s,d)=>s+d[2],0);
  let allocated=raw.map(d=>Math.max(2,Math.floor(d[2]*total/original)));
  let difference=total-allocated.reduce((s,n)=>s+n,0);
  let i=0;
  while(difference!==0 && i<1000){const ix=i%allocated.length;if(difference>0){allocated[ix]++;difference--;}else if(allocated[ix]>2){allocated[ix]--;difference++;}i++;}
  return raw.map((d,ix)=>[d[0],d[1],allocated[ix]]);
}
function isScheduledDay(date=new Date()){
  const p=getProfile(), days=Number(p.days)||4;
  // Stable recommended schedule: Mon/Wed/Fri, then Tue/Thu added as training frequency increases.
  const day=date.getDay();
  const base=[1,3,5];
  const extra=[2,4];
  const schedule=days===2?[1,4]:days===3?base:days===4?[1,3,5,0]:[1,2,4,5,0];
  return schedule.includes(day);
}
function lastCheckin(){return [...data.checkins].reverse().find(c=>c.date===localDate())||null;}
function readinessMessage(){
  const c=lastCheckin();
  if(!c) return 'Start with a quick check-in and choose the right intensity for today.';
  if(c.readiness==='tired') return 'Keep today light: easy movement, fundamentals, and extra rest are enough.';
  if(c.readiness==='okay') return 'Keep the quality high and the pace controlled. Rest whenever you need.';
  return 'You’re feeling ready. Stay focused on clean reps instead of rushing.';
}
function showToast(message){
  const el=$('toast');el.textContent=message;el.classList.add('show');clearTimeout(toastTimeout);
  toastTimeout=setTimeout(()=>el.classList.remove('show'),2300);
}
function showSetup(){
  $('setupView').classList.remove('hidden');$('appView').classList.add('hidden');$('bottomNav').classList.add('hidden');
  const p=getProfile();
  for(const [id,key] of [['playerName','name'],['goal','goal'],['level','level'],['days','days'],['duration','duration'],['equipment','equipment'],['target','target']]){
    const el=$(id);if(el)el.value=p[key]??profileDefaults()[key];
  }
}
function showApp(){
  $('setupView').classList.add('hidden');$('appView').classList.remove('hidden');$('bottomNav').classList.remove('hidden');render();
}
function setTab(tab){
  activeTab=tab;
  document.querySelectorAll('.nav-button').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));
  render();
  window.scrollTo({top:0,behavior:'smooth'});
}
function headerTitle(){return ({home:'Home',train:'Train',progress:'Progress',plan:'My plan',recovery:'Recovery'})[activeTab]||'Home';}
function render(){
  if(!data.profile){showSetup();return;}
  const p=getProfile(), goal=GOALS[p.goal]||GOALS.allaround;
  const content=$('viewContent');
  const views={home:renderHome,train:renderTrain,progress:renderProgress,plan:renderPlan,recovery:renderRecovery};
  content.innerHTML=(views[activeTab]||renderHome)();
}
function renderHero(){
  const p=getProfile(),goal=GOALS[p.goal]||GOALS.allaround;
  const today=new Date().toLocaleDateString(undefined,{weekday:'long',month:'short',day:'numeric'});
  return `<section class="hero">
    <div class="hero-art"></div>
    <div class="hero-topline"><div class="eyebrow">PLAYER DASHBOARD</div><span class="date-chip">${esc(today.toUpperCase())}</span></div>
    <h1>Show up.<br><em>Level up.</em></h1>
    <p>Small improvements stack. Let’s make today’s reps count, ${esc(p.name||'Player')}.</p>
    <div class="hero-stats">
      <div class="mini-stat"><span>SESSIONS THIS WEEK</span><strong>${logsThisWeek()}</strong><small>logged</small></div>
      <div class="mini-stat"><span>MINUTES THIS WEEK</span><strong>${minutesThisWeek()}</strong><small>on court</small></div>
      <div class="mini-stat"><span>CURRENT STREAK</span><strong>${currentStreak()}</strong><small>${currentStreak()===1?'day':'days'}</small></div>
    </div>
  </section>`;
}
function renderWorkoutCard(){
  const p=getProfile(), goal=GOALS[p.goal]||GOALS.allaround, drills=workoutForToday();
  const check=lastCheckin();
  const isTired=check&&check.readiness==='tired';
  return `<section class="section">
    <div class="section-head"><div><div class="eyebrow">TODAY'S FOCUS</div><h2>${isTired?'Light skill session':goal.name}</h2><p>${isTired?'Listen to your body and keep it easy.':'A plan that fits your goal and available time.'}</p></div><span class="pill">${Number(p.duration)} MIN</span></div>
    <div class="card featured-card">
      <div class="featured-top"><span class="eyebrow">PERSONALIZED SESSION</span><span class="goal-symbol">${goal.symbol}</span></div>
      <h3>${isScheduledDay()?'Training day. Let’s work.':'Optional skill day'}</h3>
      <p>${isTired?'Do the drills gently, take longer rests, and stop if anything hurts.':goal.subtitle} Keep technique first.</p>
      <div class="feature-meta"><span>◷ ${Number(p.duration)} min</span><span>▤ ${drills.length} drills</span><span>◎ ${esc(p.level)}</span></div>
      <button class="button button-primary" data-action="start-workout">Start workout <span>↗</span></button>
    </div>
    <div class="card"><div class="section-head"><div><h3>Session preview</h3><p>Your drills before you start.</p></div><button class="text-link" data-tab="train">See all →</button></div><div class="drill-list">${drills.slice(0,3).map((d,i)=>drillRow(d,i)).join('')}</div></div>
  </section>`;
}
function drillRow(d,i){return `<div class="drill-row"><div class="drill-number">${String(i+1).padStart(2,'0')}</div><div class="drill-info"><strong>${esc(d[0])}</strong><small>${esc(d[1])}</small></div><div class="drill-min">${d[2]}m</div></div>`;}
function renderWeekStrip(){
  const start=new Date();start.setHours(12,0,0,0);start.setDate(start.getDate()-(start.getDay()+6)%7);
  const days=['M','T','W','T','F','S','S'];
  return `<div class="day-strip">${days.map((day,i)=>{const d=new Date(start);d.setDate(start.getDate()+i);const key=localDate(d);const done=data.logs.some(l=>l.date===key);const today=key===localDate();return `<div class="day-dot ${done?'done':''} ${today?'today':''}">${day}<b>${d.getDate()}</b></div>`;}).join('')}</div>`;
}
function renderHome(){
  const p=getProfile(), goal=GOALS[p.goal]||GOALS.allaround;
  const weeklyGoal=Number(p.days)||4, count=logsThisWeek(), pct=Math.min(100,Math.round(count/weeklyGoal*100));
  const completed=data.completedWeeks.length;
  return `${renderHero()}
    <section class="section">
      <div class="section-head"><div><div class="eyebrow">YOUR NEXT REP</div><h2>Today’s workout</h2></div><button class="text-link" data-tab="train">Full session →</button></div>
      ${renderWorkoutCard()}
    </section>
    <section class="section">
      <div class="section-head"><div><div class="eyebrow">CONSISTENCY WINS</div><h2>Your week at a glance</h2></div></div>
      <div class="card progress-card"><div class="progress-ring" style="--progress:${pct}%"><strong>${pct}%</strong></div><div class="progress-copy"><strong>${count} of ${weeklyGoal} sessions logged</strong><p>Build a routine you can repeat. Rest days count as part of the plan, too.</p></div></div>
      ${renderWeekStrip()}
    </section>
    <section class="section">
      <div class="section-head"><div><div class="eyebrow">QUICK ACCESS</div><h2>Keep building</h2></div></div>
      <div class="split-grid">
        <button class="quick-card" data-tab="progress"><span class="quick-icon">▥</span><strong>Track progress</strong><small>Review sessions, shots, and your streak.</small></button>
        <button class="quick-card" data-action="open-checkin"><span class="quick-icon">☼</span><strong>Daily check-in</strong><small>Adjust your intensity to your energy.</small></button>
        <button class="quick-card" data-tab="plan"><span class="quick-icon">▦</span><strong>Six-week roadmap</strong><small>${completed}/6 weeks marked complete.</small></button>
        <button class="quick-card" data-tab="recovery"><span class="quick-icon">♡</span><strong>Recover smarter</strong><small>Warm up, reset, and take care of yourself.</small></button>
      </div>
    </section>
    <section class="section"><div class="section-head"><div><div class="eyebrow">DAILY CHECK-IN</div><h2>How are you feeling?</h2></div><button class="text-link" data-action="open-checkin">Check in →</button></div><div class="card"><div class="goal-banner"><div class="goal-symbol">${lastCheckin()?({'fresh':'⚡','okay':'◒','tired':'☾'}[lastCheckin().readiness]):'☼'}</div><div><strong>${lastCheckin()?({'fresh':'Feeling ready','okay':'Taking it steady','tired':'Keeping it light'}[lastCheckin().readiness]):'Check in before you train'}</strong><p>${esc(readinessMessage())}</p></div></div></div></section>`;
}
function renderTrain(){
  const p=getProfile(), drills=workoutForToday();
  return `${renderHero()}
    <section class="section"><div class="section-head"><div><div class="eyebrow">TRAINING FLOOR</div><h2>Your session</h2><p>${esc(GOALS[p.goal]?.name||'All-around game')} · ${p.duration} minutes</p></div><span class="pill">${drills.length} DRILLS</span></div>
    <div class="card"><div class="featured-top"><span class="eyebrow">WORKOUT CHECKLIST</span><span class="goal-symbol">${GOALS[p.goal]?.symbol||'✦'}</span></div><p class="muted">${esc(readinessMessage())}</p><div class="drill-list">${drills.map(drillRow).join('')}</div><div class="divider"></div><button class="button button-primary button-wide" data-action="start-workout">Start focus mode <span>↗</span></button></div>
    <div class="card"><h3>How to get the most out of this</h3><div class="tip-row"><span class="tip-icon">1</span><div><strong>Warm up first</strong><p>Move easily for 5–8 minutes before intense drills.</p></div></div><div class="tip-row"><span class="tip-icon">2</span><div><strong>Count quality reps</strong><p>Slow down when technique gets sloppy. Smooth control matters more than speed.</p></div></div><div class="tip-row"><span class="tip-icon">3</span><div><strong>Write one takeaway</strong><p>After the workout, record one win and one focus for next time.</p></div></div></div>
    </section>`;
}
function renderProgress(){
  const sessions=data.logs.length, minutes=data.logs.reduce((s,l)=>s+(Number(l.minutes)||0),0);
  const makes=data.shots.reduce((s,x)=>s+(Number(x.makes)||0),0), attempts=data.shots.reduce((s,x)=>s+(Number(x.attempts)||0),0);
  const pct=attempts?Math.round(makes/attempts*100):0;
  const shotRows=[...data.shots].reverse().slice(0,5);
  const logs=[...data.logs].reverse().slice(0,8);
  return `${renderHero()}<section class="section">
    <div class="section-head"><div><div class="eyebrow">PLAYER PROGRESS</div><h2>Numbers tell a story</h2><p>Track the work you put in — not just the outcome.</p></div></div>
    <div class="stats-grid">
      <div class="stat-card"><span class="stat-label">TOTAL SESSIONS</span><strong>${sessions}</strong><small>logged workouts</small></div>
      <div class="stat-card"><span class="stat-label">TOTAL MINUTES</span><strong>${minutes}</strong><small>training time</small></div>
      <div class="stat-card"><span class="stat-label">SHOTS MADE</span><strong>${makes}</strong><small>recorded makes</small></div>
      <div class="stat-card"><span class="stat-label">BEST STREAK</span><strong>${bestStreak()}</strong><small>consecutive days</small></div>
    </div>
    <div class="card" style="margin-top:11px"><div class="section-head"><div><h3>Shooting log</h3><p>Record makes and attempts from a drill.</p></div></div>
      <form id="shotForm" class="log-form">
        <div class="field"><label for="shotMakes">Makes</label><input id="shotMakes" type="number" inputmode="numeric" min="0" max="10000" value="0" required></div>
        <div class="field"><label for="shotAttempts">Attempts</label><input id="shotAttempts" type="number" inputmode="numeric" min="1" max="10000" value="10" required></div>
        <div class="field full-row"><label for="shotNote">Drill / spot <span class="sub-label">OPTIONAL</span></label><input id="shotNote" maxlength="60" placeholder="e.g. corner catch-and-shoot"></div>
        <button class="button button-primary button-wide full-row" type="submit">Save shooting stats <span>✓</span></button>
      </form>
      <div class="shooting-result"><strong>${pct}%</strong><span>${makes} makes out of ${attempts} logged attempts · descriptive tracking, not a grade</span></div>
      ${shotRows.length?shotRows.map(s=>`<div class="history-row"><div><strong>${esc(s.note||'Shooting practice')}</strong><small>${esc(formatDate(s.date))}</small></div><div class="history-right"><strong>${s.makes}/${s.attempts}</strong><small>${s.attempts?Math.round(s.makes/s.attempts*100):0}%</small></div></div>`).join(''):'<div class="history-empty">Your shooting logs will appear here after you record a session.</div>'}
    </div>
    <div class="card"><div class="section-head"><div><h3>Workout history</h3><p>Your latest saved sessions.</p></div><button class="text-link" data-action="export-csv">Export CSV ↓</button></div>
      ${logs.length?logs.map(l=>`<div class="history-row"><div><strong>${esc(l.title)}</strong><small>${esc(formatDate(l.date))} · ${l.drillsDone||0}/${l.drillCount||0} drills checked</small></div><div class="history-right"><strong>${Number(l.minutes)||0} min</strong><small>completed</small></div></div>`).join(''):'<div class="empty-state"><div class="empty-icon">▥</div><strong>No sessions yet</strong><p>Finish your first workout and your history will start building here.</p><button class="button button-primary" data-tab="train">Start a workout</button></div>'}
    </div>
    <div class="card"><div class="section-head"><div><h3>Player journal</h3><p>One win. One next step.</p></div></div>
      <form id="journalForm"><div class="field"><label for="journalWin">What went well?</label><input id="journalWin" maxlength="120" placeholder="e.g. kept my eyes up while dribbling"></div><div class="field"><label for="journalFocus">What will you work on next?</label><input id="journalFocus" maxlength="120" placeholder="e.g. stay balanced on jump shots"></div><button class="button button-soft button-wide" type="submit">Save reflection</button></form>
      ${data.journal.slice(-3).reverse().map(j=>`<div class="note-item"><small>${esc(formatDate(j.date))}</small><p><b>Win:</b> ${esc(j.win||'—')}<br><b>Next:</b> ${esc(j.focus||'—')}</p></div>`).join('')}
    </div>
  </section>`;
}
function renderPlan(){
  const p=getProfile(),goal=GOALS[p.goal]||GOALS.allaround;
  const weeks=WEEK_THEMES.map((w,i)=>`<button class="week-card ${i===Math.min(5,Math.floor(data.logs.length/Math.max(1,Number(p.days)*1.3)))?'current':''} ${data.completedWeeks.includes(i)?'complete':''}" data-action="toggle-week" data-week="${i}"><div class="week-top"><span class="week-no">WEEK ${String(i+1).padStart(2,'0')}</span><span class="week-status">${data.completedWeeks.includes(i)?'✓':'↗'}</span></div><strong>${w[0]}</strong><small>${w[1]}</small></button>`).join('');
  return `${renderHero()}<section class="section">
    <div class="section-head"><div><div class="eyebrow">YOUR DEVELOPMENT PLAN</div><h2>Made around your game</h2><p>Start simple. Repeat what works. Adjust as you grow.</p></div></div>
    <div class="card"><div class="goal-banner"><div class="goal-symbol">${goal.symbol}</div><div><strong>${esc(goal.name)}</strong><p>${esc(goal.subtitle)}</p></div></div><div class="divider"></div><div class="badge-row"><span class="badge">${Number(p.days)} days / week</span><span class="badge">${Number(p.duration)} min / session</span><span class="badge">${esc(p.level)}</span><span class="badge">${esc(({court:'ball + hoop',space:'ball, no hoop',none:'no ball'}[p.equipment])||'ball + hoop')}</span></div>${p.target?`<div class="divider"></div><p class="muted"><b>Your personal target:</b> ${esc(p.target)}</p>`:''}<div class="divider"></div><button class="button button-outline button-wide" data-action="edit-profile">Adjust my plan</button></div>
    <div class="section-head"><div><div class="eyebrow">SIX-WEEK ROADMAP</div><h2>Build one layer at a time</h2><p>Tap a week to mark it complete when you feel ready.</p></div></div>
    <div class="week-grid">${weeks}</div>
    <div class="card" style="margin-top:12px"><div class="section-head"><div><h3>Weekly schedule</h3><p>Suggested days based on your availability.</p></div></div>${renderWeekStrip()}<p class="microcopy">Schedule is a flexible suggestion. Move sessions around your school, team practices, and rest needs.</p></div>
  </section>`;
}
function renderRecovery(){
  const c=lastCheckin();
  return `${renderHero()}<section class="section">
    <div class="section-head"><div><div class="eyebrow">TRAIN SMARTER</div><h2>Recovery is part of progress</h2><p>Consistency works best when you also give yourself time to recover.</p></div></div>
    <div class="card featured-card"><div class="eyebrow">DAILY READINESS</div><h3>${c?({'fresh':'You’re feeling ready','okay':'Keep a steady pace','tired':'Today can be a light day'}[c.readiness]):'Check in with yourself'}</h3><p>${esc(readinessMessage())}</p><button class="button button-primary" data-action="open-checkin">Daily check-in <span>↗</span></button></div>
    <div class="card"><div class="tip-row"><span class="tip-icon">↗</span><div><strong>Warm up for 5–8 minutes</strong><p>Start with easy movement and dynamic mobility. Build intensity gradually rather than jumping straight into hard reps.</p></div></div>
      <div class="tip-row"><span class="tip-icon">◌</span><div><strong>Keep technique in control</strong><p>Pause when form starts to fall apart. Short breaks can help you return to better-quality practice.</p></div></div>
      <div class="tip-row"><span class="tip-icon">☾</span><div><strong>Make room for rest</strong><p>Sleep, food, hydration, and easier days support learning and performance. You don’t have to train hard every day.</p></div></div>
      <div class="tip-row"><span class="tip-icon">♡</span><div><strong>Listen to pain and fatigue</strong><p>Stop an exercise that causes pain, and talk to a trusted adult or qualified coach if something feels wrong.</p></div></div>
      <div class="tip-row"><span class="tip-icon">✦</span><div><strong>Finish with a reflection</strong><p>Record one win and one thing to improve next time. That makes the next workout more intentional.</p></div></div>
    </div>
    <div class="card"><div class="section-head"><div><h3>Recent check-ins</h3><p>Your daily notes stay on this device.</p></div></div>${data.checkins.slice(-5).reverse().map(x=>`<div class="history-row"><div><strong>${esc(({fresh:'Ready',okay:'Taking it steady',tired:'Tired — light day'}[x.readiness])||x.readiness)}</strong><small>${esc(formatDate(x.date))}</small>${x.note?`<small>${esc(x.note)}</small>`:''}</div></div>`).join('')||'<div class="history-empty">Your check-ins will appear here.</div>'}</div>
  </section>`;
}

function openWorkout(){
  activeDrills=workoutForToday();checkedDrills=new Set();
  $('workoutModalTitle').textContent=GOALS[getProfile().goal]?.name||'Today’s workout';
  $('modalSubtitle').textContent=`${getProfile().duration} minutes · Focus on good reps, not rushing.`;
  $('modalDrills').innerHTML=activeDrills.map((d,i)=>`<label class="modal-drill"><input type="checkbox" data-drill="${i}"><div><strong>${esc(d[0])}</strong><small>${esc(d[1])}</small></div><span class="drill-min">${d[2]}m</span></label>`).join('');
  $('modalDrills').querySelectorAll('input').forEach(el=>el.addEventListener('change',()=>{const n=Number(el.dataset.drill);el.checked?checkedDrills.add(n):checkedDrills.delete(n);}));
  stopTimer();setTimer(30);document.querySelectorAll('[data-timer-seconds]').forEach(b=>b.classList.toggle('selected',Number(b.dataset.timerSeconds)===30));$('timerLabel').textContent='READY WHEN YOU ARE';$('timerToggle').textContent='Start timer';
  $('workoutModal').classList.remove('hidden');
}
function closeWorkout(){stopTimer();$('workoutModal').classList.add('hidden');}
function setTimer(seconds){
  timerSeconds=Math.max(0,seconds);timerTotal=Math.max(1,seconds);
  $('timerDisplay').textContent=formatTimer(timerSeconds);$('timerProgress').style.width='0%';
}
function formatTimer(seconds){return `${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;}
function stopTimer(){if(timerInterval)clearInterval(timerInterval);timerInterval=null;timerRunning=false;const b=$('timerToggle');if(b)b.textContent='Start timer';}
function toggleTimer(){
  if(timerRunning){stopTimer();$('timerLabel').textContent='PAUSED';return;}
  if(timerSeconds<=0)setTimer(30);
  timerRunning=true;$('timerToggle').textContent='Pause timer';$('timerLabel').textContent='YOU’RE IN FOCUS MODE';
  timerInterval=setInterval(()=>{
    timerSeconds=Math.max(0,timerSeconds-1);
    $('timerDisplay').textContent=formatTimer(timerSeconds);
    $('timerProgress').style.width=`${(1-timerSeconds/timerTotal)*100}%`;
    if(timerSeconds===0){stopTimer();$('timerLabel').textContent='TIMER COMPLETE';showToast('Timer complete — reset and go again.');}
  },1000);
}
function completeWorkout(){
  stopTimer();
  const p=getProfile(),title=GOALS[p.goal]?.name||'Basketball workout';
  data.logs.push({id:`${Date.now()}-${Math.random().toString(16).slice(2,6)}`,date:localDate(),title,minutes:Number(p.duration)||30,drillsDone:checkedDrills.size,drillCount:activeDrills.length});
  saveData();closeWorkout();activeTab='progress';document.querySelectorAll('.nav-button').forEach(b=>b.classList.toggle('active',b.dataset.tab===activeTab));render();showToast('Session saved. Good work!');
}
function openCheckin(){
  selectedReadiness=lastCheckin()?.readiness||null;
  $('readinessChoices').querySelectorAll('button').forEach(b=>b.classList.toggle('selected',b.dataset.readiness===selectedReadiness));
  $('checkinNote').value=lastCheckin()?.note||'';
  $('checkinModal').classList.remove('hidden');
}
function saveCheckin(){
  if(!selectedReadiness){showToast('Choose how you feel first.');return;}
  const record={date:localDate(),readiness:selectedReadiness,note:$('checkinNote').value.trim()};
  data.checkins=data.checkins.filter(c=>c.date!==record.date);data.checkins.push(record);saveData();
  $('checkinModal').classList.add('hidden');render();showToast('Check-in saved.');
}
function exportCsv(){
  const rows=[['Type','Date','Title / note','Minutes','Drills checked','Makes','Attempts','Readiness']];
  data.logs.forEach(l=>rows.push(['Workout',l.date,l.title,l.minutes,l.drillsDone||0,'','','']));
  data.shots.forEach(s=>rows.push(['Shooting',s.date,s.note||'Shooting practice','','',s.makes,s.attempts,'']));
  data.checkins.forEach(c=>rows.push(['Check-in',c.date,c.note||'','','','','',c.readiness]));
  data.journal.forEach(j=>rows.push(['Journal',j.date,`Win: ${j.win||''} / Next: ${j.focus||''}`,'','','','','']));
  const csv=rows.map(row=>row.map(v=>`"${String(v??'').replace(/"/g,'""')}"`).join(',')).join('\r\n');
  const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'}),url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download='court-iq-player-progress.csv';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function handleSubmit(e){
  if(e.target.id==='profileForm'){
    e.preventDefault();
    data.profile={name:$('playerName').value.trim().slice(0,24)||'Player',goal:$('goal').value,level:$('level').value,days:$('days').value,duration:$('duration').value,equipment:$('equipment').value,target:$('target').value.trim().slice(0,90)};
    saveData();activeTab='home';showApp();showToast('Your personalized plan is ready.');return;
  }
  if(e.target.id==='shotForm'){
    e.preventDefault();
    const makes=Number($('shotMakes').value),attempts=Number($('shotAttempts').value),note=$('shotNote').value.trim();
    if(!Number.isInteger(makes)||!Number.isInteger(attempts)||attempts<1||makes<0||makes>attempts||attempts>10000){showToast('Check your makes and attempts.');return;}
    data.shots.push({date:localDate(),makes,attempts,note:note.slice(0,60)});saveData();render();showToast(`Saved ${makes}/${attempts} shots.`);return;
  }
  if(e.target.id==='journalForm'){
    e.preventDefault();const win=$('journalWin').value.trim(),focus=$('journalFocus').value.trim();
    if(!win&&!focus){showToast('Add a win or a next step first.');return;}
    data.journal.push({date:localDate(),win:win.slice(0,120),focus:focus.slice(0,120)});saveData();render();showToast('Reflection saved.');return;
  }
}
document.addEventListener('submit',handleSubmit);
document.addEventListener('click',e=>{
  const tab=e.target.closest('[data-tab]');
  if(tab){setTab(tab.dataset.tab);return;}
  const nav=e.target.closest('.nav-button');
  if(nav){setTab(nav.dataset.tab);return;}
  const timerPreset=e.target.closest('[data-timer-seconds]');
  if(timerPreset){
    stopTimer();const secs=Number(timerPreset.dataset.timerSeconds)||30;setTimer(secs);
    document.querySelectorAll('[data-timer-seconds]').forEach(b=>b.classList.toggle('selected',b===timerPreset));
    $('timerLabel').textContent='READY WHEN YOU ARE';return;
  }
  const actionEl=e.target.closest('[data-action]');
  if(!actionEl)return;
  const action=actionEl.dataset.action;
  if(action==='home')setTab('home');
  else if(action==='start-workout')openWorkout();
  else if(action==='close-modal')closeWorkout();
  else if(action==='timer-toggle')toggleTimer();
  else if(action==='timer-reset'){stopTimer();setTimer(timerTotal);$('timerLabel').textContent='READY WHEN YOU ARE';}
  else if(actionEl.hasAttribute('data-timer-seconds')){stopTimer();const secs=Number(actionEl.dataset.timerSeconds)||30;setTimer(secs);document.querySelectorAll('[data-timer-seconds]').forEach(b=>b.classList.toggle('selected',b===actionEl));$('timerLabel').textContent='READY WHEN YOU ARE';}
  else if(action==='complete-workout')completeWorkout();
  else if(action==='open-checkin')openCheckin();
  else if(action==='close-checkin')$('checkinModal').classList.add('hidden');
  else if(action==='save-checkin')saveCheckin();
  else if(action==='edit-profile')showSetup();
  else if(action==='export-csv')exportCsv();
  else if(action==='toggle-week'){
    const i=Number(actionEl.dataset.week);
    if(data.completedWeeks.includes(i))data.completedWeeks=data.completedWeeks.filter(x=>x!==i);else data.completedWeeks.push(i);
    saveData();render();showToast(data.completedWeeks.includes(i)?`Week ${i+1} completed!`:`Week ${i+1} reopened.`);
  }
});
$('readinessChoices').addEventListener('click',e=>{
  const btn=e.target.closest('[data-readiness]');if(!btn)return;
  selectedReadiness=btn.dataset.readiness;
  $('readinessChoices').querySelectorAll('button').forEach(b=>b.classList.toggle('selected',b===btn));
});
$('workoutModal').addEventListener('click',e=>{if(e.target===$('workoutModal'))closeWorkout();});
$('checkinModal').addEventListener('click',e=>{if(e.target===$('checkinModal'))$('checkinModal').classList.add('hidden');});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeWorkout();$('checkinModal').classList.add('hidden');}});
if('serviceWorker' in navigator && /^https?:$/.test(location.protocol)){
  window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
}
if(data.profile){showApp();}else{showSetup();}
