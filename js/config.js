export const firebaseConfig = {
  apiKey: "AIzaSyAmCU80NgtOkJuxVmlRpf8isoKlXGzveBA",
  authDomain: "quimichool.firebaseapp.com",
  databaseURL: "https://quimichool-default-rtdb.firebaseio.com",
  projectId: "quimichool",
  storageBucket: "quimichool.firebasestorage.app",
  messagingSenderId: "420754755153",
  appId: "1:420754755153:web:a72efa174d3a5d41e7b270"
};

export const MAX_PLAYERS = 50;
export const MAX_SCORE = 1000;
export const MIN_SCORE = 200;

export function hasFirebaseConfig() {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.databaseURL && firebaseConfig.projectId);
}
