// TakaBoom - Firebase Realtime Database - Asia Southeast1
import { initializeApp } from 'firebase/app'
import { getDatabase, ref, get, set, update, onValue, off } from 'firebase/database'

const firebaseConfig = {
  apiKey: "AIzaSyDykDdg_PUE-uNXEFMGkOqGTIS9r9UkaRM",
  authDomain: "massenger-v20.firebaseapp.com",
  databaseURL: "https://massenger-v20-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "massenger-v20",
  storageBucket: "massenger-v20.firebasestorage.app",
  messagingSenderId: "756660049752",
  appId: "1:756660049752:web:7cea19cf70840dacbc372d",
  measurementId: "G-P4JHE0MQQ7"
}

const app = initializeApp(firebaseConfig)
export const db = getDatabase(app)

// Helpers for TakaBoom
export const userRef = (userId) => ref(db, `takaboom/users/${userId}`)
export const leaderboardRef = () => ref(db, `takaboom/leaderboard`)
export const withdrawsRef = (userId) => ref(db, `takaboom/withdraws/${userId}`)

export { ref, get, set, update, onValue, off }
