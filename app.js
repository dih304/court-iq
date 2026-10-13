const $=id=>document.getElementById(id);
const KEY='courtiq-data-v1';
const defaults={profile:null,logs:[],shots:[],completedWeeks:[],bestStreak:0,notes:[]};
let data=loadData(), activeDrills=[], timerRemaining=30, timerTotal=30, timerInterval=null, timerRunning=false, checkedDrills=new Set(), deferredInstall=null;
function loadData(){try{return {...defaults,...JSON.parse(localStorage.getItem(KEY)||'{}')}}catch{return {...defaults}}}
function saveData(){localStorage.setItem(KEY,JSON.stringify(data))}
const goalNames={shooting:'Shooting consistency',handles:'Ball handling',finishing:'Finishing at the rim',defense:'Defense & footwork',allaround:'All-around game'};
const goalIcon={shooting:'◎',handles:'↝',finishing:'↑',defense:'◇',allaround:'✦'};
function getWorkout(dayIndex= new Date().getDay()){
 const p=data.profile||{goal:'allaround',level:'intermediate',duration:'30',equipment:'court'};
 const base={
 shooting:[['Form shooting','Build a balanced, repeatable release',6],['Spot shooting','Shoot from 3–5 comfortable spots',10],['Free throws','Reset your routine before each rep',5],['Game-speed shots','Move into shots with good footwork',7]],
 handles:[['Stationary control','Low pounds, crossovers, between-legs',5],['Moving control','Change pace and direction with control',8],['Weak-hand focus','Keep eyes up and use both hands',7],['Pressure moves','One move into an explosive first step',6]],
 finishing:[['Footwork prep','Practice balanced gathers without rushing',5],['Strong-hand finishes','Use both sides when possible',8],['Weak-hand finishes','Control the ball and finish softly',8],['Change-angle finishes','Use safe, controlled approach angles',6]],
 defense:[['Defensive stance','Stay balanced and keep steps controlled',4],['Lateral footwork','Short slides; avoid crossing feet',7],['Closeout technique','Chop steps and keep balance',7],['Reaction & recovery','Change direction with control',7]],
 allaround:[['Ball control','Warm-up with both hands',5],['Shooting mechanics','Form reps and balanced follow-through',8],['Finishing footwork','Controlled gathers and both-side reps',7],['Defense & movement','Stance, slides, and balance',6]]
 };
 let drills=[...(base[p.goal]||base.allaround)];
 if(p.equipment==='space') drills=drills.map(d=>({...d[2]&&{}})).length?drills.map(d=>[d[0],d[1].replace(/Shoot from 3–5 comfortable spots/,'Use a safe spot and shadow your release').replace(/Free throws/,'Shooting routine (no hoop)').replace(/Game-speed shots/,'Footwork into shadow shots'),d[2]]):drills;
 if(p.equipment==='none') drills=[['Dynamic warm-up','Marching, arm circles, gentle mobility',5],['Footwork fundamentals','Balanced pivots and controlled steps',7],['Defensive movement','Easy lateral steps with good form',7],['Visualization','Picture game reads and confident decisions',5]];
 const total=Number(p.duration)||30;
 let sum=drills.reduce((a,d)=>a+d[2],0);
 drills=drills.map(d=>[d[0],d[1],Math.max(2,Math.round(d[2]*total/sum))]);
 return drills;
}
function dateKey(d=new Date()){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
function daysBetween(a,b){return Math.round((new Date(b+'T12:00:00')-new Date(a+'T12:00:00'))/86400000)}
function streak(){const days=[...new Set(data.logs.map(l=>l.date))].sort().reverse();if(!days.length)return 0;let start=days[0]===dateKey()?dateKey():dateKey(new Date(Date.now()-86400000));if(!days.includes(start))return 0;let n=0,cur=start;while(days.includes(cur)){n++;cur=dateKey(new Date(new Date(cur+'T12:00:00').getTime()-86400000))}return n}
function thisWeekCount(){const now=new Date(),monday=new Date(now);monday.setDate(now.getDate()-(now.getDay()+6)%7);monday.setHours(0,0,0,0);return data.logs.filter(l=>new Date(l.date+'T12:00:00')>=monday).length}
function showToast(s){const t=$('toast');t.textContent=s;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2100)}
function showSetup(){ $('setupScreen').classList.remove('hidden');$('appScreen').classList.add('hidden');$('bottomNav').classList.add('hidden');if(data.profile){$('goal').value=data.profile.goal;$('level').value=data.profile.level;$('days').value=data.profile.days;$('duration').value=data.profile.duration;$('equipment').value=data.profile.equipment;$('notes').value=data.profile.notes||''}}
function showApp(){ $('setupScreen').classList.add('hidden');$('appScreen').classList.remove('hidden');$('bottomNav').classList.remove('hidden');render()}
$('profileForm').addEventListener('submit',e=>{e.preventDefault();data.profile={goal:$('goal').value,level:$('level').value,days:$('days').value,duration:$('duration').value,equipment:$('equipment').value,notes:$('notes').value.trim()};saveData();showApp();showToast('Your plan is ready')});
$('editPlan').addEventListener('click',showSetup);
function render(){
 if(!data.profile)return;
 const p=data.profile, workout=getWorkout();
 $('welcomeText').textContent=`Focus: ${goalNames[p.goal]}. Build consistency with ${p.days} training days each week.`;
 $('weekSessions').textContent=`${thisWeekCount()} sessions`;
 $('streak').textContent=`${streak()} ${streak()===1?'day':'days'}`;
 $('durationPill').textContent=`${p.duration} MIN`;
 $('todayTitle').textContent=goalNames[p.goal];
 $('todayWorkout').innerHTML=workout.map((d,i)=>`<div class="drill"><div class="drill-num">${String(i+1).padStart(2,'0')}</div><div class="drill-copy"><strong>${esc(d[0])}</strong><small>${esc(d[1])}</small></div><div class="drill-time">${d[2]} MIN</div></div>`).join('');
 $('planSummary').innerHTML=`<div class="plan-summary"><div class="plan-badge">${goalIcon[p.goal]}</div><div><strong>${esc(goalNames[p.goal])}</strong><p>${p.days} days/week · ${p.duration} minutes/session · ${esc(p.level[0].toUpperCase()+p.level.slice(1))} level</p>${p.notes?`<p style="margin-top:6px">Your note: ${esc(p.notes)}</p>`:''}</div></div>`;
 $('weekGrid').innerHTML=Array.from({length:6},(_,i)=>`<button class="week ${i===Math.min(5,Math.floor(data.logs.length/Math.max(1,Number(p.days)*1.5)))?'current':''}" data-week="${i}"><strong>WEEK ${i+1} ${data.completedWeeks.includes(i)?'✓':''}</strong><small>${['Build your base','Repeat good habits','Add control','Practice at pace','Make smart reads','Review & refine'][i]}</small></button>`).join('');
 $('weekGrid').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{const i=Number(b.dataset.week);if(data.completedWeeks.includes(i))data.completedWeeks=data.completedWeeks.filter(x=>x!==i);else data.completedWeeks.push(i);saveData();render();showToast(data.completedWeeks.includes(i)?`Week ${i+1} marked complete`:`Week ${i+1} reopened`)}));
 $('statSessions').textContent=data.logs.length;
 $('statMinutes').textContent=data.logs.reduce((a,l)=>a+(l.minutes||0),0);
 $('statShots').textContent=data.shots.reduce((a,s)=>a+s.makes,0);
 $('statStreak').textContent=Math.max(data.bestStreak||0,streak());
 $('history').innerHTML=data.logs.length?[...data.logs].reverse().slice(0,6).map(l=>`<div class="history-item"><div><strong>${esc(l.title)}</strong><br><span>${esc(l.date)}</span></div><div style="text-align:right"><strong>${l.minutes} min</strong><br><span>${l.drillsDone||0} drills checked</span></div></div>`).join(''):'<div class="empty">No sessions logged yet. Finish your first workout to start your history.</div>';
}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function openWorkout(){activeDrills=getWorkout();checkedDrills=new Set();$('drillList').innerHTML=activeDrills.map((d,i)=>`<label class="drill-check"><input type="checkbox" data-drill="${i}"><span><strong>${esc(d[0])}</strong><br><span class="muted tiny">${d[2]} min · ${esc(d[1])}</span></span></label>`).join('');$('drillList').querySelectorAll('input').forEach(c=>c.addEventListener('change',()=>{if(c.checked)checkedDrills.add(Number(c.dataset.drill));else checkedDrills.delete(Number(c.dataset.drill))}));$('timerTitle').textContent='Workout timer';$('timerDrill').textContent='Use the timer for each drill or your full session.';setTimer(30);$('workoutModal').classList.remove('hidden')}
$('startWorkout').addEventListener('click',openWorkout);
$('closeModal').addEventListener('click',()=>{stopTimer();$('workoutModal').classList.add('hidden')});
function setTimer(sec){timerRemaining=sec;timerTotal=sec;$('timerDisplay').textContent=fmt(sec);$('timerBar').style.width='0%'}
function fmt(sec){return `${String(Math.floor(sec/60)).padStart(2,'0')}:${String(sec%60).padStart(2,'0')}`}
function stopTimer(){clearInterval(timerInterval);timerInterval=null;timerRunning=false;$('timerStart').textContent='Start'}
function startTimer(){if(timerRunning){stopTimer();return}if(timerRemaining<=0)setTimer(30);timerRunning=true;$('timerStart').textContent='Pause';timerInterval=setInterval(()=>{timerRemaining--;if(timerRemaining<=0){timerRemaining=0;stopTimer();showToast('Timer complete — reset and go again')} $('timerDisplay').textContent=fmt(timerRemaining);$('timerBar').style.width=`${100*(1-timerRemaining/timerTotal)}%`},1000)}
$('timerStart').addEventListener('click',startTimer);
$('timerReset').addEventListener('click',()=>{stopTimer();setTimer(30)});
$('completeWorkout').addEventListener('click',()=>{stopTimer();const now=dateKey();const mins=Number(data.profile.duration)||30;data.logs.push({date:now,title:goalNames[data.profile.goal],minutes:mins,drillsDone:checkedDrills.size});data.bestStreak=Math.max(data.bestStreak||0,streak()+1);saveData();$('workoutModal').classList.add('hidden');render();showToast('Session saved — nice work')});
$('saveShots').addEventListener('click',()=>{const makes=Number($('makesInput').value),attempts=Number($('attemptsInput').value);if(makes<0||attempts<0||makes>attempts||!Number.isFinite(makes)||!Number.isFinite(attempts)){ $('shotFeedback').textContent='Check your numbers: makes cannot exceed attempts.';return}if(attempts===0){$('shotFeedback').textContent='Enter at least one attempt to save.';return}data.shots.push({date:dateKey(),makes,attempts});saveData();$('shotFeedback').textContent=`Saved: ${makes}/${attempts} (${Math.round(makes/attempts*100)}%).`;render()});
$('exportCsv').addEventListener('click',()=>{const rows=[['Date','Workout','Minutes','Drills checked'],...data.logs.map(l=>[l.date,l.title,l.minutes,l.drillsDone||0]),[],['Shooting stats'],['Date','Makes','Attempts'],...data.shots.map(s=>[s.date,s.makes,s.attempts])];const csv=rows.map(r=>r.map(v=>`"${String(v??'').replace(/"/g,'""')}"`).join(',')).join('\n');const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='court-iq-stats.csv';a.click();URL.revokeObjectURL(a.href)});
document.querySelectorAll('.nav-item').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('.nav-item').forEach(n=>n.classList.toggle('active',n===b));const target={home:0,train:1,stats:2,plan:3}[b.dataset.target];const sections=[document.querySelector('.hero'),document.querySelectorAll('.section')[0],document.querySelectorAll('.section')[2],document.querySelectorAll('.section')[1]];sections[target].scrollIntoView({behavior:'smooth',block:'start'})}));
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredInstall=e;$('installBtn').classList.remove('hidden')});
$('installBtn').addEventListener('click',async()=>{if(deferredInstall){deferredInstall.prompt();await deferredInstall.userChoice;deferredInstall=null;$('installBtn').classList.add('hidden')}else showToast('On iPhone: Share → Add to Home Screen')});
if('serviceWorker' in navigator && location.protocol.startsWith('http'))window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
if(data.profile)showApp();else showSetup();
