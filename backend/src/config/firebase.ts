// src/config/firebase.ts
import * as admin from 'firebase-admin';
import serviceAccount from './keys/serviceAccountKey.json';  // ajusta o nome do arquivo

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount)
});

export const auth = admin.auth();
export default admin;