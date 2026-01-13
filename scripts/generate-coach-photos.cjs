/* eslint-disable no-console */

const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);

function isImageFile(filePath) {
  return IMAGE_EXTENSIONS.has(path.extname(filePath).toLowerCase());
}

async function pathExists(targetPath) {
  try {
    await fsp.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function listDirectories(dirPath) {
  const entries = await fsp.readdir(dirPath, { withFileTypes: true });
  return entries
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort((a, b) => a.localeCompare(b, 'zh-Hant'));
}

async function walkFilesRecursively(dirPath) {
  const results = [];
  const stack = [dirPath];

  while (stack.length > 0) {
    const current = stack.pop();
    const entries = await fsp.readdir(current, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
      } else if (entry.isFile() && isImageFile(fullPath)) {
        results.push(fullPath);
      }
    }
  }

  results.sort((a, b) => a.localeCompare(b, 'en'));
  return results;
}

async function ensureDirectory(dirPath) {
  await fsp.mkdir(dirPath, { recursive: true });
}

function toPosixPath(p) {
  return p.split(path.sep).join('/');
}

function encodeUrlPath(urlPath) {
  // Encode spaces / unicode safely for use in <img src>
  // Keep '/' intact; encode URI components segment-wise.
  return urlPath
    .split('/')
    .map((seg) => encodeURIComponent(seg))
    .join('/');
}

async function main() {
  const repoRoot = path.resolve(__dirname, '..');
  const sourceRoot = path.join(repoRoot, 'assets', '個人寫真');

  const frontendPublicRoot = path.join(repoRoot, 'frontend', 'public');
  const destRoot = path.join(frontendPublicRoot, 'coach-photos');

  const frontendSrcRoot = path.join(repoRoot, 'frontend', 'src');
  const dataDir = path.join(frontendSrcRoot, 'data');
  const manifestPath = path.join(dataDir, 'coachPhotos.json');

  if (!(await pathExists(sourceRoot))) {
    console.error(`[generate-coach-photos] Source folder not found: ${sourceRoot}`);
    process.exitCode = 1;
    return;
  }

  console.log('[generate-coach-photos] Scanning albums...');

  const albumNames = await listDirectories(sourceRoot);
  if (albumNames.length === 0) {
    console.warn('[generate-coach-photos] No album folders found.');
  }

  // Recreate destination to avoid stale files after renames.
  await fsp.rm(destRoot, { recursive: true, force: true });
  await ensureDirectory(destRoot);
  await ensureDirectory(dataDir);

  const albums = [];

  for (const albumName of albumNames) {
    const albumSourceDir = path.join(sourceRoot, albumName);
    const albumFiles = await walkFilesRecursively(albumSourceDir);

    if (albumFiles.length === 0) {
      continue;
    }

    const photos = [];
    for (const filePath of albumFiles) {
      const relativeInsideAlbum = path.relative(albumSourceDir, filePath);

      const destAlbumDir = path.join(destRoot, albumName);
      const destFilePath = path.join(destAlbumDir, relativeInsideAlbum);
      await ensureDirectory(path.dirname(destFilePath));

      await fsp.copyFile(filePath, destFilePath);

      const publicUrl = encodeUrlPath(
        toPosixPath(path.posix.join('/coach-photos', albumName, toPosixPath(relativeInsideAlbum)))
      );
      photos.push(publicUrl);
    }

    albums.push({
      album: albumName,
      count: photos.length,
      photos,
    });
  }

  const manifest = {
    generatedAt: new Date().toISOString(),
    source: 'assets/個人寫真',
    publicBase: '/coach-photos',
    albums,
  };

  await fsp.writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');

  console.log(`[generate-coach-photos] Done. Albums: ${albums.length}`);
  console.log(`[generate-coach-photos] Manifest: ${manifestPath}`);
  console.log(`[generate-coach-photos] Public photos: ${destRoot}`);
}

main().catch((err) => {
  console.error('[generate-coach-photos] Failed:', err);
  process.exitCode = 1;
});
