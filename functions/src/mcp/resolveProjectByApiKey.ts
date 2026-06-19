import * as admin from 'firebase-admin';

export interface ResolvedProject {
  projectId: string;
  projectData: admin.firestore.DocumentData;
}

export async function resolveProjectByApiKey(
  db: admin.firestore.Firestore,
  apiKey: string,
): Promise<ResolvedProject | null> {
  const snap = await db.collection('projects').where('apiKey', '==', apiKey).limit(1).get();
  if (snap.empty) return null;

  const projectDoc = snap.docs[0];
  return { projectId: projectDoc.id, projectData: projectDoc.data() };
}
