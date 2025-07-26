// firebaseConfig.js



// import { initializeApp } from 'firebase/app';
// import { getStorage } from 'firebase/storage';
// import { getFirestore } from 'firebase/firestore';

// const firebaseConfig = {
//   apiKey: "AIzaSyDoQa08An-qFnPSq9nYuG4yTf7G3m4xKAM",
//   authDomain: "beyteeapp-4c81b.firebaseapp.com",
//   projectId: "beyteeapp-4c81b",
//   storageBucket: "beyteeapp-4c81b.appspot.com",
//   messagingSenderId: "896634042113",
//   appId: "1:896634042113:web:6f8f76b990d7ff4ed34d00",
//   measurementId: "G-TXS9845REB"
// };

// const app = initializeApp(firebaseConfig);
// const storage = getStorage(app);
// const db = getFirestore(app);

// export { storage, db };



import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyDoQa08An-qFnPSq9nYuG4yTf7G3m4xKAM",
  authDomain: "beyteeapp-4c81b.firebaseapp.com",
  projectId: "beyteeapp-4c81b",
  storageBucket: "beyteeapp-4c81b.firebasestorage.app",
  messagingSenderId: "896634042113",
  appId: "1:896634042113:web:6f8f76b990d7ff4ed34d00",
  measurementId: "G-TXS9845REB"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const storage = getStorage(app);

export { db, storage };