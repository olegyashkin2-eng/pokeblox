// CPU integration fixtures: the real vendored GLTF loader and Draco worker
// decode the shipped assets. Only image upload is replaced (no WebGL in Node).
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import * as THREE from 'three';
import {GLTFLoader} from '../public/vendor/GLTFLoader.js';
import {ORIGINAL_IDS} from '../public/classic-models.mjs';
import {ALL_IDS} from '../public/data.mjs';

export async function classicFixtures(){
 const base=new URL('../public/',import.meta.url),pending=new Map();let serial=0;
 const context=vm.createContext({console,WebAssembly,TextDecoder,setTimeout,clearTimeout,
  postMessage(message){const p=pending.get(message.id);pending.delete(message.id);if(message.type==='error')p.reject(Error(message.error));else p.resolve(message.geometry);}});
 vm.runInContext('self=globalThis;',context);
 vm.runInContext(await readFile(new URL('vendor/draco/draco_wasm_wrapper.js',base),'utf8'),context);
 const source=await readFile(new URL('vendor/DRACOLoader.js',base),'utf8');
 vm.runInContext(source.slice(source.indexOf('function DRACOWorker()'),source.lastIndexOf('export {'))+'\nDRACOWorker();',context);
 context.onmessage({data:{type:'init',decoderConfig:{wasmBinary:await readFile(new URL('vendor/draco/draco_decoder.wasm',base))}}});
 const decoder={preload(){},decodeDracoFile(buffer,callback,attributeIDs,attributeTypes,vertexColorSpace,onError){
  const id=serial++;
  const promise=new Promise((resolve,reject)=>pending.set(id,{resolve,reject}));
  context.onmessage({data:{type:'decode',id,buffer,taskConfig:{attributeIDs,attributeTypes,vertexColorSpace,useUniqueIDs:true}}});
  promise.then(raw=>{const g=new THREE.BufferGeometry();if(raw.index)g.setIndex(new THREE.BufferAttribute(raw.index.array,1));for(const a of raw.attributes)g.setAttribute(a.name,new THREE.BufferAttribute(a.array,a.itemSize));callback(g);}).catch(onError);
 }};
 const loader=new GLTFLoader().setDRACOLoader(decoder);
 loader.pluginCallbacks.unshift(()=>({name:'CPUImageUpload',loadTexture:()=>Promise.resolve(new THREE.Texture())}));
 const models=new Map();
 for(const id of ALL_IDS){
  const b=await readFile(new URL(`assets/${id}.glb`,base));
  models.set(id,await loader.parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),''));
 }
 return models;
}
