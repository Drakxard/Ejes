export interface MejoraEntry {
  tema: string;
  enunciado: string;
  ejercicio: string;
}

export async function appendMejorarFile(
  dirHandle: FileSystemDirectoryHandle,
  entry: MejoraEntry
) {
  const fileHandle = await dirHandle.getFileHandle('mejorar.js', { create: true });

  let ejercicios: MejoraEntry[] = [];
  try {
    const file = await fileHandle.getFile();
    const text = await file.text();
    const match = text.match(/export const ejercicios = (\[[\s\S]*\]);?/);
    if (match?.[1]) {
      ejercicios = JSON.parse(match[1]);
    }
  } catch {
    // File might not exist yet or be malformed
  }

  ejercicios.push(entry);
  const writable = await fileHandle.createWritable();
  await writable.write(
    `export const ejercicios = ${JSON.stringify(ejercicios, null, 2)};\n`
  );
  await writable.close();
}

