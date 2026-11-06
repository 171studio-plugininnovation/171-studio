import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, deleteDoc } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { validateEmailQuality, DISPOSABLE_DOMAINS, FAKE_DOMAINS } from '../src/utils/emailVerification';

// Add known throwaways from audit
DISPOSABLE_DOMAINS.add('en2ch.com');
DISPOSABLE_DOMAINS.add('en2ch.net');
DISPOSABLE_DOMAINS.add('en2ch.org');

async function purgeFakeAccounts() {
  console.log('--- AVVIO PULIZIA ACCOUNT CON EMAIL / DOMINI INESISTENTI O FAKE ---');
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  const usersSnap = await getDocs(collection(db, 'users'));
  console.log(`Analisi di ${usersSnap.docs.length} record nella collezione 'users'...`);

  const purgedUsers: string[] = [];

  for (const userDoc of usersSnap.docs) {
    const data = userDoc.data();
    const docId = userDoc.id;
    const email = (data.email || '').trim().toLowerCase();

    // Remove empty/system placeholder docs from users
    if (!email || email === '' || docId === 'system_stats') {
      console.log(`[ELIMINAZIONE DOC NON-UTENTE] ID: ${docId}`);
      await deleteDoc(doc(db, 'users', docId));
      purgedUsers.push(`${docId} (non-utente vuoto)`);
      continue;
    }

    const validation = validateEmailQuality(email);
    if (!validation.isValid) {
      console.log(`[ELIMINAZIONE ACCOUNT FAKE] ID: ${docId} | Email: ${email} | Motivo: ${validation.error}`);
      await deleteDoc(doc(db, 'users', docId));
      purgedUsers.push(`${email} (${validation.error})`);
    } else {
      console.log(`[CONFERMATO VALIDO] ID: ${docId} | Email: ${email} (${data.name || 'N/D'})`);
    }
  }

  // Purge spam activities associated with deleted fake accounts
  const actSnap = await getDocs(collection(db, 'activities'));
  let purgedActivitiesCount = 0;
  for (const actDoc of actSnap.docs) {
    const actData = actDoc.data();
    const actEmail = (actData.userEmail || '').trim().toLowerCase();
    if (actEmail && !validateEmailQuality(actEmail).isValid) {
      await deleteDoc(doc(db, 'activities', actDoc.id));
      purgedActivitiesCount++;
    }
  }

  console.log('--- REPORT CONCLUSIVO PULIZIA ---');
  console.log(`Account fasulli/inesistenti eliminati da Firestore: ${purgedUsers.length}`);
  purgedUsers.forEach((u, i) => console.log(`  ${i + 1}. ${u}`));
  console.log(`Log attività spam eliminati: ${purgedActivitiesCount}`);
  console.log('Pulizia completata con successo al 100%.');
}

purgeFakeAccounts().catch((err) => {
  console.error('Errore durante la pulizia:', err);
  process.exit(1);
});
