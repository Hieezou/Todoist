import { initializeApp } from 'firebase/app';
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  getFirestore,
  query,
  setDoc,
  where,
} from 'firebase/firestore';
import { firebaseConfig, cloudEnabled } from './firebaseConfig';

let db = null;
let tasksCollection = null;

if (cloudEnabled) {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  tasksCollection = collection(db, 'tasks');
}

export const getUserTasks = async userId => {
  if (!cloudEnabled || !tasksCollection) return [];
  const tasksQuery = query(tasksCollection, where('ownerId', '==', userId));
  const snapshot = await getDocs(tasksQuery);
  return snapshot.docs.map(docSnapshot => ({ id: docSnapshot.id, ...docSnapshot.data() }));
};

export const saveTaskToCloud = async (userId, task) => {
  if (!cloudEnabled || !tasksCollection) return;
  const taskRef = doc(tasksCollection, task.id);
  await setDoc(taskRef, { ...task, ownerId: userId });
};

export const deleteTaskFromCloud = async id => {
  if (!cloudEnabled || !tasksCollection) return;
  const taskRef = doc(tasksCollection, id);
  await deleteDoc(taskRef);
};
