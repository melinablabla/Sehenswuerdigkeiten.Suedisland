const locations = [
  {id:'diamond', name:'Diamond Beach', lat:64.0449, lon:-16.1790},
  {id:'black-sand', name:'Black Sand Beach (Reynisfjara)', lat:63.4045, lon:-19.0456},
  {id:'seljalandsfoss', name:'Seljalandsfoss', lat:63.6156, lon:-19.9896},
  {id:'reykjavik', name:'Reykjavik', lat:64.1466, lon:-21.9426},
  {id:'blue-lagoon', name:'Blue Lagoon', lat:63.8804, lon:-22.4495}
];

document.addEventListener('DOMContentLoaded', ()=>{
  // CARD ACCORDION
  const cards = document.querySelectorAll('.card');
  cards.forEach(card=>{
    const btn = card.querySelector('.card-head');
    btn.addEventListener('click', ()=>{
      const isOpen = card.classList.contains('open');
      // close all
      document.querySelectorAll('.card.open').forEach(c=>c.classList.remove('open'));
      if(!isOpen){
        card.classList.add('open');
        // if map card opened, init map
        if(card.dataset.key === 'reise'){
          if(!window.__mapInitialized){ initMap(); window.__mapInitialized = true; }
        }
      }
    });
  });
});

function initMap(){
  const map = L.map('map').setView([64.0, -19.0], 6);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap'
  }).addTo(map);

  // add markers
  const waypoints = [];
  locations.forEach(loc=>{
    L.marker([loc.lat, loc.lon]).addTo(map).bindPopup(`<strong>${loc.name}</strong>`);
    waypoints.push(L.latLng(loc.lat, loc.lon));
  });

  // draw routing control (visual route)
  const control = L.Routing.control({
    waypoints: waypoints,
    routeWhileDragging: false,
    addWaypoints: false,
    showAlternatives: false,
    fitSelectedRoute: true
  }).addTo(map);

  // fetch pairwise durations via OSRM and list them
  loadDurations();
}

async function fetchLegDuration(a,b){
  const url = `https://router.project-osrm.org/route/v1/driving/${a.lon},${a.lat};${b.lon},${b.lat}?overview=false`;
  try{
    const res = await fetch(url);
    const data = await res.json();
    if(data && data.routes && data.routes[0]){
      return data.routes[0].duration; // seconds
    }
  }catch(e){console.warn('OSRM error',e)}
  return null;
}

function formatDuration(sec){
  if(sec === null) return 'n/a';
  const h = Math.floor(sec/3600); const m = Math.round((sec%3600)/60);
  if(h>0) return `${h}h ${m}min`;
  return `${m}min`;
}

async function loadDurations(){
  const ul = document.getElementById('durations');
  ul.innerHTML = '<li>Lade Fahrzeiten...</li>';
  const items = [];
  for(let i=0;i<locations.length-1;i++){
    const a = locations[i]; const b = locations[i+1];
    const sec = await fetchLegDuration(a,b);
    items.push({from:a.name,to:b.name,duration:sec});
  }
  ul.innerHTML = '';
  items.forEach(it=>{
    const li = document.createElement('li');
    li.textContent = `${it.from} → ${it.to}: ${formatDuration(it.duration)}`;
    ul.appendChild(li);
  });
}
