/* eslint-disable no-console */
/**
 * generate-coach-photos.cjs
 * @description 從 assets/個人寫真 複製圖片到 public/coach-photos 並生成 manifest JSON
 * @usage node scripts/generate-coach-photos.cjs
 */

const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);

/**
 * 檢查檔案是否為圖片
 * @param {string} filePath 檔案路徑
 * @returns {boolean}
 */
function isImageFile(filePath) {
  return IMAGE_EXTENSIONS.has(path.extname(filePath).toLowerCase());
}

/**
 * 檢查路徑是否存在
 * @param {string} targetPath 目標路徑
 * @returns {Promise<boolean>}
 */
async function pathExists(targetPath) {
  try {
    await fsp.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

/**
 * 列出目錄內的所有子目錄
 * @param {string} dirPath 目錄路徑
 * @returns {Promise<string[]>}
 */
async function listDirectories(dirPath) {
  const entries = await fsp.readdir(dirPath, { withFileTypes: true });
  return entries
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort((a, b) => a.localeCompare(b, "zh-Hant"));
}

/**
 * 遞迴列出目錄內所有圖片檔案
 * @param {string} dirPath 目錄路徑
 * @returns {Promise<string[]>}
 */
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

  results.sort((a, b) => a.localeCompare(b, "en"));
  return results;
}

/**
 * 確保目錄存在
 * @param {string} dirPath 目錄路徑
 */
async function ensureDirectory(dirPath) {
  await fsp.mkdir(dirPath, { recursive: true });
}

/**
 * 轉換為 POSIX 風格路徑
 * @param {string} p 路徑
 * @returns {string}
 */
function toPosixPath(p) {
  return p.split(path.sep).join("/");
}

/**
 * 編碼 URL 路徑 (保留 /)
 * @param {string} urlPath URL 路徑
 * @returns {string}
 */
function encodeUrlPath(urlPath) {
  return urlPath
    .split("/")
    .map((seg) => encodeURIComponent(seg))
    .join("/");
}

async function main() {
  // 路徑設定 (相對於此腳本位置)
  const repoRoot = path.resolve(__dirname, "..");

  // 來源：上層專案的 assets/個人寫真
  const sourceRoot = path.resolve(
    repoRoot,
    "..",
    "coach-aaron-test",
    "assets",
    "個人寫真",
  );

  // 目標：frontend/public/coach-photos
  const frontendPublicRoot = path.join(repoRoot, "frontend", "public");
  const destRoot = path.join(frontendPublicRoot, "coach-photos");

  // Manifest 位置：frontend/src/data/coachPhotos.json
  const frontendSrcRoot = path.join(repoRoot, "frontend", "src");
  const dataDir = path.join(frontendSrcRoot, "data");
  const manifestPath = path.join(dataDir, "coachPhotos.json");

  if (!(await pathExists(sourceRoot))) {
    console.error(`[generate-coach-photos] 來源資料夾不存在: ${sourceRoot}`);
    console.error(
      "[generate-coach-photos] 請確認 coach-aaron-test/assets/個人寫真 資料夾位置",
    );
    process.exitCode = 1;
    return;
  }

  console.log("[generate-coach-photos] 掃描相簿資料夾...");
  console.log(`[generate-coach-photos] 來源: ${sourceRoot}`);

  const albumNames = await listDirectories(sourceRoot);
  if (albumNames.length === 0) {
    console.warn("[generate-coach-photos] 未找到任何相簿資料夾。");
  }

  // 重建目標資料夾以避免過期檔案
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
        toPosixPath(
          path.posix.join(
            "/coach-photos",
            albumName,
            toPosixPath(relativeInsideAlbum),
          ),
        ),
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
    source: "coach-aaron-test/assets/個人寫真",
    publicBase: "/coach-photos",
    albums,
  };

  await fsp.writeFile(manifestPath, JSON.stringify(manifest, null, 2), "utf8");

  const totalPhotos = albums.reduce((sum, a) => sum + a.count, 0);
  console.log(
    `[generate-coach-photos] 完成! 相簿數: ${albums.length}, 總圖片: ${totalPhotos}`,
  );
  console.log(`[generate-coach-photos] Manifest: ${manifestPath}`);
  console.log(`[generate-coach-photos] 公開圖片: ${destRoot}`);
}

main().catch((err) => {
  console.error("[generate-coach-photos] 執行失敗:", err);
  process.exitCode = 1;
});
