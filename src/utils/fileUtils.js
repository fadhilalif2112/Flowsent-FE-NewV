// src/utils/fileUtils.js

/**
 * Mengecek apakah file adalah gambar (jpg, jpeg, png, gif, webp)
 */
export function isImageFile(filename) {
  return /\.(jpg|jpeg|png|gif|webp)$/i.test(filename);
}

/**
 * Mengecek apakah file adalah PDF
 */
export function isPdfFile(filename) {
  return /\.pdf$/i.test(filename);
}

/**
 * Mengecek apakah file adalah dokumen Word
 */
export function isDocFile(filename) {
  return /\.(doc|docx|odt|rtf)$/i.test(filename);
}

/**
 * Mengecek apakah file adalah spreadsheet (Excel)
 */
export function isSpreadsheetFile(filename) {
  return /\.(xls|xlsx|ods|csv)$/i.test(filename);
}

/**
 * Mengecek apakah file adalah arsip (zip, rar, dsb)
 */
export function isArchiveFile(filename) {
  return /\.(zip|rar|7z|tar|gz)$/i.test(filename);
}

/**
 * Mengecek apakah file adalah file kode (source code)
 */
export function isCodeFile(filename) {
  return /\.(js|jsx|ts|tsx|html|css|json|xml|py|java|cpp|c|php|rb|go)$/i.test(
    filename
  );
}

/**
 * Mengecek apakah file adalah video
 */
export function isVideoFile(filename) {
  return /\.(mp4|mov|avi|mkv|webm)$/i.test(filename);
}

/**
 * Mengecek apakah file adalah audio
 */
export function isAudioFile(filename) {
  return /\.(mp3|wav|ogg|flac|m4a)$/i.test(filename);
}

/**
 * Mengambil ikon/thumbnail untuk file
 * - Gambar → thumbnail asli
 * - PDF → ikon PDF
 * - Dokumen lain → ikon sesuai tipe
 */
export function getFilePreview(file) {
  const name = file?.name?.toLowerCase?.() || "";

  if (isImageFile(name)) {
    // tampilkan thumbnail asli (jika punya file.url)
    return file.url || "../../icons/photo.png";
  }
  if (isPdfFile(name)) return "../../icons/pdf.png";
  if (isDocFile(name)) return "../../icons/doc.png";
  if (isSpreadsheetFile(name)) return "../../icons/xls.png";
  if (isArchiveFile(name)) return "../../icons/zip.png";
  if (isCodeFile(name)) return "../../icons/code.png";
  if (isVideoFile(name)) return "../../icons/video.png";
  if (isAudioFile(name)) return "../../icons/audio.png";

  // Default ikon untuk file lain
  return "../../icons/file.png";
}
