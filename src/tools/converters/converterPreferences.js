const HISTORY_KEY="mz-conversion-history-v1";
const FAVORITES_KEY="mz-converter-favorites-v1";
function read(key,fallback=[]){try{const v=JSON.parse(localStorage.getItem(key)||"null");return Array.isArray(v)?v:fallback}catch{return fallback}}
function write(key,value){try{localStorage.setItem(key,JSON.stringify(value))}catch{}}
export function getConversionHistory(){return read(HISTORY_KEY)}
export function addConversionHistory(entry){const current=read(HISTORY_KEY);const key=`${entry.converterId}|${entry.from}|${entry.to}|${entry.input}`;const next=[{...entry,id:key,at:Date.now()},...current.filter((x)=>x.id!==key)].slice(0,25);write(HISTORY_KEY,next);return next}
export function deleteConversionHistory(id){const next=read(HISTORY_KEY).filter((x)=>x.id!==id);write(HISTORY_KEY,next);return next}
export function clearConversionHistory(){write(HISTORY_KEY,[]);return[]}
export function getConverterFavorites(){return read(FAVORITES_KEY)}
export function toggleConverterFavorite(converterId){const current=read(FAVORITES_KEY);const next=current.includes(converterId)?current.filter((id)=>id!==converterId):[converterId,...current];write(FAVORITES_KEY,next);return next}
