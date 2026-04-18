import { initializeApp } from 'firebase/app'
import { getDatabase, ref, onValue, set } from 'firebase/database'

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL:       import.meta.env.VITE_FIREBASE_DB_URL,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
const database = getDatabase(app)

/** Subscribe to live zone updates. Returns unsubscribe fn. */
export function subscribeToZones(callback) {
  const zonesRef = ref(database, '/zones')
  return onValue(zonesRef, (snapshot) => {
    const data = snapshot.val()
    if (data) callback(Object.values(data))
  })
}

/** Push a manual zone density update */
export async function pushZoneUpdate(zoneKey, payload) {
  const zoneRef = ref(database, `/zones/${zoneKey}`)
  await set(zoneRef, payload)
}

export { database }
