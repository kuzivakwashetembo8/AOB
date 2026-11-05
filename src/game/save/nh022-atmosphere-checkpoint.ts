/** GTD-NH-ATM-022 — small device-local atmosphere checkpoint, not a game save.
 * IndexedDB preferred; localStorage is the optional fallback when unavailable.
 */
import {
 validateAtmosphereSnapshot022,type AtmosphereSnapshot022,
} from "@/game/atmosphere/nh022-atmosphere-model";
const DB="gtd-nh022-atmosphere";
const STORE="checkpoints";
const KEY="north-heights";
const FALLBACK="gtd-nh022-atmosphere-v1";
function openDb():Promise<IDBDatabase>{
 return new Promise((resolve,reject)=>{
  if(typeof indexedDB==="undefined"){reject(new Error("IndexedDB unavailable"));return;}
  const request=indexedDB.open(DB,1);
  request.onupgradeneeded=()=>{
   const db=request.result;
   if(!db.objectStoreNames.contains(STORE))db.createObjectStore(STORE);
  };
  request.onsuccess=()=>resolve(request.result);
  request.onerror=()=>reject(request.error??new Error("Atmosphere storage unavailable"));
 });
}
export async function loadAtmosphereCheckpoint022():Promise<AtmosphereSnapshot022|null>{
 try{
  const db=await openDb();
  const value=await new Promise<unknown>((resolve,reject)=>{
   const tx=db.transaction(STORE,"readonly"),request=tx.objectStore(STORE).get(KEY);
   request.onsuccess=()=>resolve(request.result);
   request.onerror=()=>reject(request.error);
  });
  db.close();
  if(validateAtmosphereSnapshot022(value))return value;
 }catch{/* Offline/private mode may disable IndexedDB. */}
 try{
  const raw=localStorage.getItem(FALLBACK);
  if(raw){const value:unknown=JSON.parse(raw);if(validateAtmosphereSnapshot022(value))return value;}
 }catch{/* Corrupt or unavailable local storage must not block a game. */}
 return null;
}
export async function saveAtmosphereCheckpoint022(snapshot:AtmosphereSnapshot022):Promise<boolean>{
 if(!validateAtmosphereSnapshot022(snapshot))return false;
 // Write a compact fallback synchronously for pagehide or browser eviction.
 try{localStorage.setItem(FALLBACK,JSON.stringify(snapshot));}catch{/* Optional. */}
 try{
  const db=await openDb();
  await new Promise<void>((resolve,reject)=>{
   const tx=db.transaction(STORE,"readwrite");
   tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);
   tx.objectStore(STORE).put(snapshot,KEY);
  });
  db.close();return true;
 }catch{return false;}
}
export function saveAtmosphereImmediately022(snapshot:AtmosphereSnapshot022){
 if(!validateAtmosphereSnapshot022(snapshot))return;
 try{localStorage.setItem(FALLBACK,JSON.stringify(snapshot));}catch{/* Optional. */}
}
