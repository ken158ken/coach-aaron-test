/**
 * Three.js 模組型別聲明
 * 補充 @types/three 在 tsconfig types 限制下的型別識別
 *
 * @description
 * tsconfig.json 設定 "types": ["vite/client"] 會限制 TypeScript 只自動載入
 * vite/client 的型別。此聲明檔讓動態 import("three") 能正確推斷型別。
 */

declare module "three";
