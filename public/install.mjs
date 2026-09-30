const button=document.getElementById('install-game');let promptEvent;
window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();promptEvent=event;button.hidden=false;});
const installed=()=>matchMedia('(display-mode:standalone)').matches||navigator.standalone;
button.hidden=installed();
window.addEventListener('appinstalled',()=>{button.hidden=true;promptEvent=null;});
button.onclick=async()=>{if(promptEvent){await promptEvent.prompt();await promptEvent.userChoice;promptEvent=null;}else document.getElementById('install-help').showModal();};
// An existing PWA can retain its old landscape manifest until the browser updates it.
// "any" permits all orientations; plain unlock would restore that old default.
const followOrientation=async()=>{
 try{if(installed()&&screen.orientation?.lock)await screen.orientation.lock('any');else screen.orientation?.unlock?.();}
 catch{try{screen.orientation?.unlock?.();}catch{}}
};
followOrientation();
document.getElementById('begin').addEventListener('click',followOrientation);
if('serviceWorker' in navigator)navigator.serviceWorker.register('/sw.js').catch(()=>{});
