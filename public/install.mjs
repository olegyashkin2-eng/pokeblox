const button=document.getElementById('install-game');let promptEvent;
window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();promptEvent=event;button.hidden=false;});
const installed=()=>matchMedia('(display-mode:standalone)').matches||navigator.standalone;
button.hidden=installed();
window.addEventListener('appinstalled',()=>{button.hidden=true;promptEvent=null;});
button.onclick=async()=>{if(promptEvent){await promptEvent.prompt();await promptEvent.userChoice;promptEvent=null;}else document.getElementById('install-help').showModal();};
// Follow the device orientation, including an already installed copy of the game.
const unlockOrientation=()=>{try{screen.orientation?.unlock?.();}catch{}};
unlockOrientation();
document.getElementById('begin').addEventListener('click',unlockOrientation);
if('serviceWorker' in navigator)navigator.serviceWorker.register('/sw.js').catch(()=>{});
