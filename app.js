const prayerNames = ["Fajr","Sunrise","Dhuhr","Asr","Maghrib","Isha"];
const prayerIcons = ["🌙","☀️","☀️","🌤️","🌇","🌙"];
let schedule = {};
let lastDateKey = "";

const $ = s => document.querySelector(s);

function pad(n){return String(n).padStart(2,"0")}
function localDateKey(d){return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`}

async function getLocation(){
  return new Promise(resolve=>{
    if(!navigator.geolocation) return resolve({lat:37.5665,lon:126.9780,source:"Seoul default"});
    navigator.geolocation.getCurrentPosition(
      p=>resolve({lat:p.coords.latitude,lon:p.coords.longitude,source:"device location"}),
      ()=>resolve({lat:37.5665,lon:126.9780,source:"Seoul default"}),
      {enableHighAccuracy:false,timeout:5000,maximumAge:3600000}
    );
  });
}

async function loadPrayerTimes(){
  const loc = await getLocation();
  const d = new Date();
  const date = `${d.getDate()}-${d.getMonth()+1}-${d.getFullYear()}`;
  const url = `https://api.aladhan.com/v1/timings/${date}?latitude=${loc.lat}&longitude=${loc.lon}&method=3`;
  try{
    const res = await fetch(url);
    const json = await res.json();
    const t = json.data.timings;
    schedule = {
      Fajr:t.Fajr.slice(0,5), Sunrise:t.Sunrise.slice(0,5), Dhuhr:t.Dhuhr.slice(0,5),
      Asr:t.Asr.slice(0,5), Maghrib:t.Maghrib.slice(0,5), Isha:t.Isha.slice(0,5)
    };
    $("#countdownLabel").textContent = loc.source === "device location" ? "Based on your current device location" : "Seoul Central Mosque · Seoul default";
    $("#hijriDate").textContent = `${json.data.date.hijri.day} ${json.data.date.hijri.month.en} ${json.data.date.hijri.year} AH`;
    renderPrayerCards();
  }catch(e){
    schedule={Fajr:"05:00",Sunrise:"06:10",Dhuhr:"12:00",Asr:"15:15",Maghrib:"18:10",Isha:"19:25"};
    $("#countdownLabel").textContent="Offline fallback · verify local mosque times";
    renderPrayerCards();
  }
}

function renderPrayerCards(){
  const grid=$("#prayerGrid"); grid.innerHTML="";
  prayerNames.forEach((name,i)=>{
    const card=document.createElement("article");
    card.className="prayer-card"; card.id="card-"+name;
    card.innerHTML=`<span>${prayerIcons[i]} ${name}</span><time>${schedule[name]||"--:--"}</time>`;
    grid.appendChild(card);
  });
}

function tick(){
  const now=new Date();
  $("#clock").textContent=now.toLocaleTimeString([], {hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:false});
  $("#date").textContent=now.toLocaleDateString([], {weekday:"long",year:"numeric",month:"long",day:"numeric"});
  $("#gregDate").textContent=now.toLocaleDateString([], {weekday:"short",year:"numeric",month:"short",day:"numeric"});

  if(!Object.keys(schedule).length) return;
  let upcoming=null;
  for(const name of prayerNames){
    const [h,m]=schedule[name].split(":").map(Number);
    const target=new Date(now); target.setHours(h,m,0,0);
    if(target>now){upcoming={name,target,time:schedule[name]};break;}
  }
  if(!upcoming){
    const [h,m]=schedule.Fajr.split(":").map(Number);
    const target=new Date(now);target.setDate(target.getDate()+1);target.setHours(h,m,0,0);
    upcoming={name:"Fajr",target,time:schedule.Fajr};
  }
  $("#nextName").textContent=upcoming.name;
  $("#nextTime").textContent=upcoming.time;
  const diff=Math.max(0,upcoming.target-now);
  const hh=Math.floor(diff/3600000), mm=Math.floor(diff%3600000/60000), ss=Math.floor(diff%60000/1000);
  $("#countdown").textContent=`${pad(hh)}:${pad(mm)}:${pad(ss)}`;
  prayerNames.forEach(n=>$("#card-"+n)?.classList.toggle("active",n===upcoming.name));
}

$("#themeBtn").addEventListener("click",()=>document.body.classList.toggle("dark"));
loadPrayerTimes();
setInterval(tick,1000); tick();
setInterval(()=>{const k=localDateKey(new Date());if(k!==lastDateKey){lastDateKey=k;loadPrayerTimes()}},60000);
