import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import type { Activity } from '../types';

export async function exportActivitiesToCsv(activities: Activity[]) {
  const header = 'id,type,duration,distance,calories,notes,date\n';

  const rows = activities
    .map((a) => {
      const notes = (a.notes ?? '').replace(/,/g, ';').replace(/\n/g, ' ');
      return `${a.id},${a.type},${a.duration},${a.distance ?? ''},${a.calories},"${notes}",${a.date}`;
    })
    .join('\n');

  const csvContent = header + rows;
  const file = new File(Paths.document, 'fitness-history.csv');

  file.write(csvContent);

  const isAvailable = await Sharing.isAvailableAsync();
  if (isAvailable) {
    await Sharing.shareAsync(file.uri, { mimeType: 'text/csv', dialogTitle: 'Exporter mon historique' });
  }
}
