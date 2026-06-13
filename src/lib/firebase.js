// Legacy shim — re-exports from firebase.ts
export { auth, db, default } from './firebase.ts';
// Stub exports for old _legacy component imports
export const DB = null;
export const ref = () => null;
export const set = () => Promise.resolve();
export const get = () => Promise.resolve({ val: () => null, exists: () => false });
export const push = () => Promise.resolve({ key: 'mock-key' });
export const remove = () => Promise.resolve();
export const update = () => Promise.resolve();
export const onValue = (_ref, cb) => { cb({ val: () => null, exists: () => false }); return () => {}; };
export const getDatabase = () => null;
export const initializeApp = () => ({});
