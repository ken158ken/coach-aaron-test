/**
 * 匯出格式生成器
 * 支援：MD / TXT / HTML / XLSX / DOCX
 * 用於會員聊天匯出 + 後台管理模組匯出
 */

import ExcelJS from "exceljs";
import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  HeadingLevel,
  WidthType,
  ShadingType,
  AlignmentType,
} from "docx";
import { Response } from "express";

// ===== 型別 =====

export type ExportRow = Record<string, string | number | null | undefined>;

export interface ChatExportMessage {
  time: string;      // 格式化後的時間字串
  sender: string;    // 寄件者顯示名稱
  content: string;   // 訊息內容
  imageUrl?: string | null;
  isSystem?: boolean;
}

export interface ModuleExport {
  name: string;        // 工作表名稱（中文）
  rows: ExportRow[];
}

// ===== 共用 Header Helper =====

const MIME: Record<string, string> = {
  md:   "text/markdown; charset=utf-8",
  txt:  "text/plain; charset=utf-8",
  html: "text/html; charset=utf-8",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

export function setDownloadHeaders(
  res: Response,
  filename: string,
  format: string,
): void {
  const encoded = encodeURIComponent(filename);
  res.setHeader("Content-Disposition", `attachment; filename*=UTF-8''${encoded}`);
  res.setHeader("Content-Type", MIME[format] || "application/octet-stream");
}

// ===== 表格資料：MD =====

export function toMd(rows: ExportRow[], title: string): Buffer {
  const ts = new Date().toLocaleString("zh-TW");
  if (rows.length === 0) {
    return Buffer.from(`# ${title}\n\n匯出時間：${ts}\n\n（無資料）\n`, "utf-8");
  }
  const keys = Object.keys(rows[0]);
  const header = `| ${keys.join(" | ")} |`;
  const sep    = `| ${keys.map(() => "---").join(" | ")} |`;
  const body   = rows
    .map((r) => `| ${keys.map((k) => String(r[k] ?? "").replace(/\|/g, "｜")).join(" | ")} |`)
    .join("\n");
  return Buffer.from(
    `# ${title}\n\n匯出時間：${ts}　共 ${rows.length} 筆\n\n${header}\n${sep}\n${body}\n`,
    "utf-8",
  );
}

// ===== 表格資料：TXT =====

export function toTxt(rows: ExportRow[], title: string): Buffer {
  const ts = new Date().toLocaleString("zh-TW");
  if (rows.length === 0) {
    return Buffer.from(`${title}\n\n匯出時間：${ts}\n\n（無資料）\n`, "utf-8");
  }
  const keys   = Object.keys(rows[0]);
  const header = keys.join("\t");
  const body   = rows.map((r) => keys.map((k) => String(r[k] ?? "")).join("\t")).join("\n");
  return Buffer.from(
    `${title}\n匯出時間：${ts}　共 ${rows.length} 筆\n\n${header}\n${body}\n`,
    "utf-8",
  );
}

// ===== 表格資料：HTML =====

export function toHtml(rows: ExportRow[], title: string): Buffer {
  const ts = new Date().toLocaleString("zh-TW");
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  let body = "";
  if (rows.length === 0) {
    body = "<tr><td>（無資料）</td></tr>";
  } else {
    const keys   = Object.keys(rows[0]);
    const thead  = `<tr>${keys.map((k) => `<th>${esc(k)}</th>`).join("")}</tr>`;
    const tbody  = rows
      .map((r) => `<tr>${keys.map((k) => `<td>${esc(String(r[k] ?? ""))}</td>`).join("")}</tr>`)
      .join("\n");
    body = `<thead>${thead}</thead><tbody>${tbody}</tbody>`;
  }

  const html = `<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="utf-8">
<title>${esc(title)}</title>
<style>
  body{font-family:-apple-system,"Noto Sans TC",sans-serif;padding:24px;color:#222}
  h1{font-size:1.4em;margin-bottom:4px}
  .meta{color:#888;font-size:.85em;margin-bottom:16px}
  table{border-collapse:collapse;width:100%}
  th{background:#2d6a4f;color:#fff;padding:8px 10px;text-align:left}
  td{padding:7px 10px;border-bottom:1px solid #eee}
  tr:nth-child(even) td{background:#f9f9f9}
</style>
</head>
<body>
<h1>${esc(title)}</h1>
<p class="meta">匯出時間：${ts}　共 ${rows.length} 筆</p>
<table>${body}</table>
</body>
</html>`;
  return Buffer.from(html, "utf-8");
}

// ===== 表格資料：XLSX =====

export async function toXlsx(rows: ExportRow[], title: string): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Aaron 教練系統";
  const sheetName = title.slice(0, 31);
  const ws = wb.addWorksheet(sheetName);

  if (rows.length === 0) {
    ws.addRow(["（無資料）"]);
    return Buffer.from(await wb.xlsx.writeBuffer());
  }

  const keys = Object.keys(rows[0]);

  // 標題行
  const headerRow = ws.addRow(keys);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2D6A4F" } };
    cell.alignment = { vertical: "middle", horizontal: "left" };
    cell.border = { bottom: { style: "thin", color: { argb: "FF1A4731" } } };
  });

  // 資料行
  rows.forEach((r, i) => {
    const row = ws.addRow(keys.map((k) => (r[k] == null ? "" : String(r[k]))));
    if (i % 2 === 1) {
      row.eachCell((cell) => {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF5F5F5" } };
      });
    }
  });

  // 自動欄寬
  keys.forEach((k, i) => {
    const maxLen = Math.max(k.length, ...rows.map((r) => String(r[k] ?? "").length));
    ws.getColumn(i + 1).width = Math.min(Math.max(maxLen + 2, 8), 45);
  });

  return Buffer.from(await wb.xlsx.writeBuffer());
}

// ===== 表格資料：DOCX =====

export async function toDocx(rows: ExportRow[], title: string): Promise<Buffer> {
  const ts = new Date().toLocaleString("zh-TW");
  const children: (Paragraph | Table)[] = [];

  children.push(
    new Paragraph({ text: title, heading: HeadingLevel.HEADING_1 }),
    new Paragraph({
      children: [
        new TextRun({ text: `匯出時間：${ts}　共 ${rows.length} 筆`, color: "888888", size: 20 }),
      ],
    }),
    new Paragraph({ text: "" }),
  );

  if (rows.length === 0) {
    children.push(new Paragraph({ text: "（無資料）" }));
  } else {
    const keys = Object.keys(rows[0]);

    const tableRows: TableRow[] = [
      // 表頭
      new TableRow({
        tableHeader: true,
        children: keys.map(
          (k) =>
            new TableCell({
              shading: { type: ShadingType.SOLID, fill: "2D6A4F", color: "auto" },
              children: [
                new Paragraph({
                  alignment: AlignmentType.LEFT,
                  children: [new TextRun({ text: k, bold: true, color: "FFFFFF", size: 20 })],
                }),
              ],
            }),
        ),
      }),
      // 資料行
      ...rows.map(
        (r, idx) =>
          new TableRow({
            children: keys.map(
              (k) =>
                new TableCell({
                  shading:
                    idx % 2 === 1
                      ? { type: ShadingType.SOLID, fill: "F5F5F5", color: "auto" }
                      : undefined,
                  children: [
                    new Paragraph({
                      children: [new TextRun({ text: String(r[k] ?? ""), size: 20 })],
                    }),
                  ],
                }),
            ),
          }),
      ),
    ];

    children.push(
      new Table({
        width: { size: 9000, type: WidthType.DXA },
        rows: tableRows,
      }),
    );
  }

  const doc = new Document({ sections: [{ children }] });
  return Buffer.from(await Packer.toBuffer(doc));
}

// ===== 全站匯出：多 Sheet Excel =====

export async function toFullXlsx(modules: ModuleExport[]): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Aaron 教練系統";
  wb.created = new Date();

  for (const mod of modules) {
    const sheetName = mod.name.slice(0, 31);
    const ws = wb.addWorksheet(sheetName);

    if (mod.rows.length === 0) {
      ws.addRow(["（無資料）"]);
      continue;
    }

    const keys = Object.keys(mod.rows[0]);

    const headerRow = ws.addRow(keys);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2D6A4F" } };
      cell.alignment = { vertical: "middle" };
    });

    mod.rows.forEach((r, i) => {
      const row = ws.addRow(keys.map((k) => (r[k] == null ? "" : String(r[k]))));
      if (i % 2 === 1) {
        row.eachCell((cell) => {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF5F5F5" } };
        });
      }
    });

    keys.forEach((k, i) => {
      const maxLen = Math.max(k.length, ...mod.rows.map((r) => String(r[k] ?? "").length));
      ws.getColumn(i + 1).width = Math.min(Math.max(maxLen + 2, 8), 45);
    });
  }

  return Buffer.from(await wb.xlsx.writeBuffer());
}

// ===== 聊天記錄：MD =====

export function chatToMd(msgs: ChatExportMessage[], title: string): Buffer {
  const ts = new Date().toLocaleString("zh-TW");
  const lines: string[] = [
    `# 對話記錄：${title}`,
    "",
    `匯出時間：${ts}　共 ${msgs.length} 則訊息`,
    "",
    "---",
    "",
  ];

  for (const m of msgs) {
    if (m.isSystem) {
      lines.push(`> *【系統】${m.content}*`);
    } else {
      lines.push(`**[${m.time}] ${m.sender}**`);
      if (m.content) lines.push(m.content);
      if (m.imageUrl) lines.push(`![圖片](${m.imageUrl})`);
    }
    lines.push("");
  }

  return Buffer.from(lines.join("\n"), "utf-8");
}

// ===== 聊天記錄：TXT =====

export function chatToTxt(msgs: ChatExportMessage[], title: string): Buffer {
  const ts = new Date().toLocaleString("zh-TW");
  const lines: string[] = [
    `對話記錄：${title}`,
    `匯出時間：${ts}　共 ${msgs.length} 則訊息`,
    "=".repeat(60),
    "",
  ];

  for (const m of msgs) {
    if (m.isSystem) {
      lines.push(`【系統訊息】${m.content}`);
    } else {
      lines.push(`[${m.time}] ${m.sender}`);
      if (m.content) lines.push(m.content);
      if (m.imageUrl) lines.push(`（圖片：${m.imageUrl}）`);
    }
    lines.push("");
  }

  return Buffer.from(lines.join("\n"), "utf-8");
}

// ===== 聊天記錄：XLSX =====

export async function chatToXlsx(msgs: ChatExportMessage[], title: string): Promise<Buffer> {
  return toXlsx(
    msgs.map((m) => ({
      時間: m.time,
      發送者: m.sender,
      訊息內容: m.content,
      圖片連結: m.imageUrl || "",
      訊息類型: m.isSystem ? "系統訊息" : "一般訊息",
    })),
    `對話記錄：${title}`,
  );
}

// ===== 聊天記錄：DOCX =====

export async function chatToDocx(msgs: ChatExportMessage[], title: string): Promise<Buffer> {
  const ts = new Date().toLocaleString("zh-TW");
  const children: Paragraph[] = [
    new Paragraph({ text: `對話記錄：${title}`, heading: HeadingLevel.HEADING_1 }),
    new Paragraph({
      children: [
        new TextRun({ text: `匯出時間：${ts}　共 ${msgs.length} 則訊息`, color: "888888", size: 20 }),
      ],
    }),
    new Paragraph({ text: "" }),
  ];

  for (const m of msgs) {
    if (m.isSystem) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: `【系統】${m.content}`, italics: true, color: "888888", size: 18 })],
        }),
      );
    } else {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `[${m.time}] `, color: "888888", size: 18 }),
            new TextRun({ text: m.sender, bold: true, size: 20 }),
          ],
        }),
      );
      if (m.content) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: m.content, size: 20 })],
            indent: { left: 360 },
          }),
        );
      }
      if (m.imageUrl) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: `（圖片：${m.imageUrl}）`, color: "888888", size: 18 })],
            indent: { left: 360 },
          }),
        );
      }
    }
    children.push(new Paragraph({ text: "" }));
  }

  const doc = new Document({ sections: [{ children }] });
  return Buffer.from(await Packer.toBuffer(doc));
}
