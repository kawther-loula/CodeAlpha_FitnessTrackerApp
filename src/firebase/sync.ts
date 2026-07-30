import { doc, setDoc, getDoc } from 'firebase/firestore';
import { firestore, auth } from './config';
import { db } from '../db/database';

const TABLES = ['activities', 'goals', 'waterLogs', 'profile', 'achievements', 'dailySteps', 'weightLogs', 'favoriteWorkouts'];

export async function uploadToCloud() {
    const user = auth.currentUser;
    if (!user) throw new Error('Utilisateur non connecté');

    const backup: Record<string, any[]> = {};
    for (const table of TABLES) {
        backup[table] = db.getAllSync(`SELECT * FROM ${table};`);
    }

    await setDoc(doc(firestore, 'backups', user.uid), {
        data: backup,
        updatedAt: new Date().toISOString(),
    });
}

export async function downloadFromCloud(): Promise<boolean> {
    const user = auth.currentUser;
    if (!user) throw new Error('Utilisateur non connecté');

    const snapshot = await getDoc(doc(firestore, 'backups', user.uid));

    if (!snapshot.exists()) return false;

    const backup = snapshot.data().data as Record<string, any[]>;

    for (const table of TABLES) {
        if (!backup[table]) continue;

        db.runSync(`DELETE FROM ${table};`);

        for (const row of backup[table]) {
            const columns = Object.keys(row).filter((c) => c !== 'id');
            const placeholders = columns.map(() => '?').join(', ');
            const values = columns.map((c) => row[c]);

            db.runSync(`INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders});`, values);
        }
    }

    return true;
}

export async function getLastSyncDate(): Promise<string | null> {
    const user = auth.currentUser;
    if (!user) return null;

    const snapshot = await getDoc(doc(firestore, 'backups', user.uid));
    if (!snapshot.exists()) return null;

    return snapshot.data().updatedAt ?? null;
}