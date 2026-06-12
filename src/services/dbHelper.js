import { db } from '../config/firebase';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  query,
  where,
  orderBy,
  onSnapshot
} from 'firebase/firestore';

export async function createDocumentInDb(userId, name, content = '') {
  const docRef = await addDoc(collection(db, 'documents'), {
    userId,
    name,
    status: 'pending', // pending -> processed -> analyzing -> analyzed | failed
    content,
    analysis: null,
    created_at: new Date().toISOString()
  });
  return docRef.id;
}

export async function updateDocumentInDb(docId, updateData) {
  const docRef = doc(db, 'documents', docId);
  await updateDoc(docRef, updateData);
}

export async function deleteDocument(docId) {
  const docRef = doc(db, 'documents', docId);
  await deleteDoc(docRef);
}

export async function getDocumentFromDb(docId) {
  const docRef = doc(db, 'documents', docId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() };
  } else {
    throw new Error('Documento não encontrado.');
  }
}

export function subscribeToUserDocuments(userId, onUpdate, onError) {
  const q = query(
    collection(db, 'documents'),
    where('userId', '==', userId),
    orderBy('created_at', 'desc')
  );

  return onSnapshot(q, (querySnapshot) => {
    const documents = [];
    querySnapshot.forEach((doc) => {
      documents.push({ id: doc.id, ...doc.data() });
    });
    onUpdate(documents);
  }, onError);
}
