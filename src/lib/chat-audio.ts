/**
 * Fase 2 — Transcripción de audio en servidor (nota de voz).
 *
 * Cuando exista `POST /api/transcribe` (p. ej. Whisper u otro STT), implementar
 * esta función para enviar el archivo y devolver el texto transcrito.
 *
 * Env sugerida: `TRANSCRIBE_API_KEY` o la que use el proveedor elegido.
 */
export async function uploadAudioForTranscription(file: File): Promise<string> {
  void file;
  throw new Error(
    "uploadAudioForTranscription: no implementado. Agregar /api/transcribe y conectar acá.",
  );
}
