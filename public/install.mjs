const button=document.getElementById('install-game');let promptEvent;
window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();promptEvent=event;button.hidden=false;});
const installed=()=>matchMedia('(display-mode:standalone)').matches||navigator.standalone;
button.hidden=installed();
window.addEventListener('appinstalled',()=>{button.hidden=true;promptEvent=null;});
button.onclick=async()=>{if(promptEvent){await promptEvent.prompt();await promptEvent.userChoice;promptEvent=null;}else document.getElementById('install-help').showModal();};
// Orientation locking is best effort; iOS uses the visible rotate prompt instead.
document.getElementById('begin').addEventListener('click',()=>{if(matchMedia('(pointer:coarse)').matches&&installed())screen.orientation?.lock?.('landscape').catch(()=>{});});
if('serviceWorker' in navigator)navigator.serviceWorker.register('/sw.js').catch(()=>{});
