// import 'dotenv/config';
// import express, { type Request, type Response } from 'express';
// import fs from 'node:fs';
// import path from 'node:path';
// import crypto from 'node:crypto';
// import { createServer as createViteServer } from 'vite';
// import {
//   applyExportTransaction,
//   applyImportTransaction,
//   type ExportPayload,
//   type ImportPayload,
//   type WarehouseState,
// } from './src/utils/inventoryLogic.ts';
// import { createSeedWarehouseState } from './src/utils/seedData.ts';

// const PORT = Number(process.env.PORT) || 3000;
// const IS_PROD = process.env.NODE_ENV === 'production';

// const DATA_DIR = path.resolve(process.cwd(), 'data');
// const STORE_PATH = path.resolve(DATA_DIR, 'warehouse.json');
// const UPLOADS_DIR = path.resolve(DATA_DIR, 'uploads');
// const BACKUPS_DIR = path.resolve(DATA_DIR, 'backups');
// const MAX_BACKUPS = 50;

// function ensureDataDirs(): void {
//   fs.mkdirSync(DATA_DIR, { recursive: true });
//   fs.mkdirSync(UPLOADS_DIR, { recursive: true });
//   fs.mkdirSync(BACKUPS_DIR, { recursive: true });
// }

// function isWarehouseState(value: unknown): value is WarehouseState {
//   if (!value || typeof value !== 'object') return false;
//   const candidate = value as Partial<WarehouseState>;
//   return Array.isArray(candidate.products) && Array.isArray(candidate.transactions);
// }

// function readWarehouseFile(filePath: string): WarehouseState | null {
//   try {
//     const parsed: unknown = JSON.parse(fs.readFileSync(filePath, 'utf8'));
//     return isWarehouseState(parsed) ? parsed : null;
//   } catch {
//     return null;
//   }
// }

// function backupExistingStore(): void {
//   if (!fs.existsSync(STORE_PATH)) return;

//   // A backup must succeed before the live file is changed.
//   const stamp = new Date().toISOString().replace(/[:.]/g, '-');
//   const backupPath = path.join(BACKUPS_DIR, `warehouse-${stamp}.json`);
//   fs.copyFileSync(STORE_PATH, backupPath, fs.constants.COPYFILE_EXCL);

//   // Keep the newest backups so the backup folder cannot grow without bound.
//   try {
//     const backups = fs.readdirSync(BACKUPS_DIR)
//       .filter((name) => /^warehouse-.*\.json$/.test(name))
//       .sort()
//       .reverse();
//     for (const oldBackup of backups.slice(MAX_BACKUPS)) {
//       fs.unlinkSync(path.join(BACKUPS_DIR, oldBackup));
//     }
//   } catch (err) {
//     console.warn('Could not prune old warehouse backups:', err);
//   }
// }

// function findLatestValidBackup(): { path: string; state: WarehouseState } | null {
//   if (!fs.existsSync(BACKUPS_DIR)) return null;
//   const backups = fs.readdirSync(BACKUPS_DIR)
//     .filter((name) => /^warehouse-.*\.json$/.test(name))
//     .sort()
//     .reverse();

//   for (const name of backups) {
//     const backupPath = path.join(BACKUPS_DIR, name);
//     const state = readWarehouseFile(backupPath);
//     if (state) return { path: backupPath, state };
//   }
//   return null;
// }

// function quarantineDamagedStore(): void {
//   if (!fs.existsSync(STORE_PATH)) return;
//   const stamp = new Date().toISOString().replace(/[:.]/g, '-');
//   const damagedPath = path.join(DATA_DIR, `warehouse.corrupt-${stamp}.json`);
//   fs.renameSync(STORE_PATH, damagedPath);
//   console.error(`Kho dữ liệu lỗi đã được giữ nguyên tại: ${damagedPath}`);
// }

// function loadWarehouseState(): WarehouseState {
//   ensureDataDirs();

//   // Seed data is created only on the very first run, when no store exists.
//   if (!fs.existsSync(STORE_PATH)) {
//     const seed = createSeedWarehouseState();
//     saveWarehouseStateSync(seed);
//     return seed;
//   }

//   const loaded = readWarehouseFile(STORE_PATH);
//   if (loaded) return loaded;

//   console.error('Warehouse store is invalid. It will NOT be replaced with seed data.');
//   quarantineDamagedStore();

//   const backup = findLatestValidBackup();
//   if (backup) {
//     console.warn(`Restoring warehouse from backup: ${backup.path}`);
//     saveWarehouseStateSync(backup.state);
//     return backup.state;
//   }

//   throw new Error(
//     `Không thể đọc data/warehouse.json và không tìm thấy bản sao lưu hợp lệ. ` +
//     `File lỗi đã được giữ trong thư mục data. Hãy khôi phục thủ công trước khi chạy lại.`
//   );
// }

// function saveWarehouseStateSync(state: WarehouseState): void {
//   ensureDataDirs();
//   backupExistingStore();

//   const tmpPath = `${STORE_PATH}.${crypto.randomBytes(6).toString('hex')}.tmp`;
//   try {
//     fs.writeFileSync(tmpPath, JSON.stringify(state, null, 2), 'utf8');
//     fs.renameSync(tmpPath, STORE_PATH);
//   } catch (err) {
//     try {
//       if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
//     } catch {
//       // Preserve the original write error.
//     }
//     throw err;
//   }
// }

// let warehouseState: WarehouseState = loadWarehouseState();
// let mutationQueue: Promise<void> = Promise.resolve();

// function runSerialized<T>(fn: () => T): Promise<T> {
//   const next = mutationQueue.then(() => fn());
//   mutationQueue = next.then(
//     () => undefined,
//     () => undefined
//   );
//   return next;
// }

// // Connected SSE clients for real-time inventory sync
// const sseClients = new Set<Response>();

// function broadcastUpdate(eventType: string, payload: unknown): void {
//   const frame = `event: ${eventType}\ndata: ${JSON.stringify(payload)}\n\n`;
//   for (const res of sseClients) {
//     try {
//       res.write(frame);
//     } catch {
//       sseClients.delete(res);
//     }
//   }
// }

// const MIME_EXT_MAP: Record<string, string> = {
//   'image/png': '.png',
//   'image/jpeg': '.jpg',
//   'image/jpg': '.jpg',
//   'image/webp': '.webp',
//   'image/gif': '.gif',
// };

// async function startServer(): Promise<void> {
//   const app = express();
//   app.disable('x-powered-by');

//   // Serve uploaded product images safely
//   app.use(
//     '/uploads',
//     (_req, res, next) => {
//       res.setHeader('X-Content-Type-Options', 'nosniff');
//       res.setHeader('Cache-Control', 'public, max-age=86400');
//       next();
//     },
//     express.static(UPLOADS_DIR, { dotfiles: 'deny', index: false })
//   );

//   // Health & real-time SSE stream
//   app.get('/api/events', (req: Request, res: Response) => {
//     res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
//     res.setHeader('Cache-Control', 'no-cache, no-transform');
//     res.setHeader('Connection', 'keep-alive');
//     res.flushHeaders?.();

//     res.write(`event: connected\ndata: ${JSON.stringify({ serverTime: new Date().toISOString() })}\n\n`);
//     sseClients.add(res);

//     const heartbeat = setInterval(() => {
//       try {
//         res.write(`: heartbeat\n\n`);
//       } catch {
//         clearInterval(heartbeat);
//         sseClients.delete(res);
//       }
//     }, 25000);

//     req.on('close', () => {
//       clearInterval(heartbeat);
//       sseClients.delete(res);
//     });
//   });

//   // Read current warehouse state
//   app.get('/api/inventory', (_req: Request, res: Response) => {
//     res.json({
//       products: warehouseState.products,
//       transactions: warehouseState.transactions,
//       serverTime: new Date().toISOString(),
//     });
//   });

//   // Upload product image (base64 data URL -> safe local file under data/uploads)
//   app.post('/api/upload-image', express.json({ limit: '3mb' }), (req: Request, res: Response) => {
//     try {
//       const dataUrl = typeof req.body?.dataUrl === 'string' ? req.body.dataUrl.trim() : '';
//       const match = /^data:(image\/(?:png|jpeg|jpg|webp|gif));base64,([A-Za-z0-9+/=]+)$/i.exec(dataUrl);
//       if (!match) {
//         res.status(400).json({ error: 'Định dạng ảnh không hợp lệ. Chỉ hỗ trợ PNG, JPG, WEBP hoặc GIF.' });
//         return;
//       }

//       const mime = match[1].toLowerCase();
//       const ext = MIME_EXT_MAP[mime];
//       if (!ext) {
//         res.status(400).json({ error: 'Loại tệp hình ảnh không được hỗ trợ.' });
//         return;
//       }

//       const buffer = Buffer.from(match[2], 'base64');
//       if (buffer.length === 0 || buffer.length > 2 * 1024 * 1024) {
//         res.status(400).json({ error: 'Kích thước ảnh phải nhỏ hơn 2MB.' });
//         return;
//       }

//       ensureDataDirs();
//       const safeName = `${Date.now()}_${crypto.randomBytes(10).toString('hex')}${ext}`;
//       const resolvedPath = path.resolve(UPLOADS_DIR, safeName);
//       if (!resolvedPath.startsWith(UPLOADS_DIR + path.sep)) {
//         res.status(400).json({ error: 'Đường dẫn lưu tệp không hợp lệ.' });
//         return;
//       }

//       fs.writeFileSync(resolvedPath, buffer);
//       res.status(201).json({ url: `/uploads/${safeName}` });
//     } catch (err) {
//       console.error('Upload image failed:', err);
//       res.status(500).json({ error: 'Không thể lưu hình ảnh sản phẩm.' });
//     }
//   });

//   // Import stock
//   app.post('/api/import', express.json({ limit: '100kb' }), async (req: Request, res: Response) => {
//     try {
//       const body = (req.body ?? {}) as Partial<ImportPayload>;
//       const payload: ImportPayload = {
//         productName: typeof body.productName === 'string' ? body.productName : '',
//         imageUrl: typeof body.imageUrl === 'string' ? body.imageUrl : '',
//         quantity: Number(body.quantity),
//         unit: typeof body.unit === 'string' ? body.unit : '',
//         importDate: typeof body.importDate === 'string' ? body.importDate : '',
//         note: typeof body.note === 'string' ? body.note : undefined,
//       };

//       const result = await runSerialized(() => {
//         const applied = applyImportTransaction(warehouseState, payload);
//         if (!applied.ok) return applied;
//         warehouseState = applied.state;
//         saveWarehouseStateSync(warehouseState);
//         return applied;
//       });

//       if (!result.ok) {
//         res.status(400).json({ error: result.error });
//         return;
//       }

//       const responseBody = {
//         product: result.product,
//         transaction: result.transaction,
//         products: warehouseState.products,
//         transactions: warehouseState.transactions,
//         serverTime: new Date().toISOString(),
//       };

//       broadcastUpdate('inventory_update', responseBody);
//       res.status(201).json(responseBody);
//     } catch (err) {
//       console.error('Import stock failed:', err);
//       res.status(500).json({ error: 'Lỗi hệ thống khi xử lý phiếu nhập kho.' });
//     }
//   });

//   // Export stock
//   app.post('/api/export', express.json({ limit: '100kb' }), async (req: Request, res: Response) => {
//     try {
//       const body = (req.body ?? {}) as Partial<ExportPayload>;
//       const payload: ExportPayload = {
//         productId: typeof body.productId === 'string' ? body.productId : '',
//         employeeName: typeof body.employeeName === 'string' ? body.employeeName : '',
//         quantity: Number(body.quantity),
//         unit: typeof body.unit === 'string' ? body.unit : '',
//         exportDate: typeof body.exportDate === 'string' ? body.exportDate : '',
//         note: typeof body.note === 'string' ? body.note : undefined,
//       };

//       const result = await runSerialized(() => {
//         const applied = applyExportTransaction(warehouseState, payload);
//         if (!applied.ok) return applied;
//         warehouseState = applied.state;
//         saveWarehouseStateSync(warehouseState);
//         return applied;
//       });

//       if (!result.ok) {
//         res.status(400).json({ error: result.error });
//         return;
//       }

//       const responseBody = {
//         product: result.product,
//         transaction: result.transaction,
//         products: warehouseState.products,
//         transactions: warehouseState.transactions,
//         serverTime: new Date().toISOString(),
//       };

//       broadcastUpdate('inventory_update', responseBody);
//       res.status(201).json(responseBody);
//     } catch (err) {
//       console.error('Export stock failed:', err);
//       res.status(500).json({ error: 'Lỗi hệ thống khi xử lý phiếu xuất kho.' });
//     }
//   });

//   if (!IS_PROD) {
//     const vite = await createViteServer({
//       server: { middlewareMode: true },
//       appType: 'spa',
//     });
//     app.use(vite.middlewares);
//   } else {
//     const distDir = path.resolve(process.cwd(), 'dist');
//     app.use(express.static(distDir));
//     app.get('*', (_req: Request, res: Response) => {
//       res.sendFile(path.resolve(distDir, 'index.html'));
//     });
//   }

//   app.listen(PORT, '0.0.0.0', () => {
//     console.log(`Warehouse server listening on http://0.0.0.0:${PORT}`);
//   });
// }

// startServer().catch((err) => {
//   console.error('Fatal server startup error:', err);
//   process.exit(1);
// });


import 'dotenv/config';
import express, { type Request, type Response } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import pg from 'pg';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { createServer as createViteServer } from 'vite';
import {
  applyExportTransaction,
  applyImportTransaction,
  type ExportPayload,
  type ImportPayload,
  type Product,
  type Transaction,
  type WarehouseState,
} from './src/utils/inventoryLogic.ts';

const { Pool } = pg;

const PORT = Number(process.env.PORT) || 3000;
const IS_PROD = process.env.NODE_ENV === 'production';

const DATABASE_URL = process.env.DATABASE_URL?.trim() || '';
const SUPABASE_URL = process.env.SUPABASE_URL?.trim() || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || '';
const SUPABASE_STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET?.trim() || 'product-images';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const UPLOADS_DIR = path.resolve(DATA_DIR, 'uploads');

if (!DATABASE_URL) {
  throw new Error('Thiếu biến môi trường DATABASE_URL (chuỗi kết nối PostgreSQL từ Supabase).');
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,
});

const supabaseStorageClient: SupabaseClient | null =
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
    : null;

function toDateOnlyString(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === 'string') {
    return value.slice(0, 10);
  }
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  return String(value).slice(0, 10);
}

function toIsoString(value: unknown): string {
  if (!value) return new Date().toISOString();
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString();
  }
  return String(value);
}

function mapProductRow(row: Record<string, unknown>): Product {
  return {
    id: String(row.id),
    sku: String(row.sku),
    name: String(row.name),
    imageUrl: typeof row.image_url === 'string' ? row.image_url : '',
    quantity: Number(row.quantity ?? 0),
    unit: String(row.unit),
    lowStockThreshold: Number(row.low_stock_threshold ?? 10),
    lastImportDate: toDateOnlyString(row.last_import_date) ?? undefined,
    lastExportDate: toDateOnlyString(row.last_export_date) ?? undefined,
    updatedAt: toIsoString(row.updated_at),
  } as Product;
}

function mapTransactionRow(row: Record<string, unknown>): Transaction {
  return {
    id: String(row.id),
    code: String(row.code),
    type: row.type === 'export' ? 'export' : 'import',
    productId: String(row.product_id),
    productName: String(row.product_name),
    productImageUrl: typeof row.product_image_url === 'string' ? row.product_image_url : '',
    quantity: Number(row.quantity ?? 0),
    unit: String(row.unit),
    date: toDateOnlyString(row.date) || '',
    employeeName: row.employee_name ? String(row.employee_name) : null,
    note: row.note ? String(row.note) : null,
    balanceAfter: Number(row.balance_after ?? 0),
    createdAt: toIsoString(row.created_at),
  } as Transaction;
}

async function fetchWarehouseState(client: pg.Pool | pg.PoolClient = pool): Promise<WarehouseState> {
  const [productsRes, transactionsRes] = await Promise.all([
    client.query('SELECT * FROM public.products ORDER BY sku ASC, id ASC'),
    client.query('SELECT * FROM public.transactions ORDER BY created_at DESC'),
  ]);

  return {
    products: productsRes.rows.map(mapProductRow),
    transactions: transactionsRes.rows.map(mapTransactionRow),
  };
}

async function upsertProductToDb(client: pg.PoolClient, product: Product): Promise<void> {
  const p = product as Product & {
    lastImportDate?: string | null;
    lastExportDate?: string | null;
    updatedAt?: string;
  };

  await client.query(
    `INSERT INTO public.products (
      id, sku, name, image_url, quantity, unit,
      low_stock_threshold, last_import_date, last_export_date, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    ON CONFLICT (id) DO UPDATE SET
      sku = EXCLUDED.sku,
      name = EXCLUDED.name,
      image_url = EXCLUDED.image_url,
      quantity = EXCLUDED.quantity,
      unit = EXCLUDED.unit,
      low_stock_threshold = EXCLUDED.low_stock_threshold,
      last_import_date = EXCLUDED.last_import_date,
      last_export_date = EXCLUDED.last_export_date,
      updated_at = EXCLUDED.updated_at`,
    [
      p.id,
      p.sku,
      p.name,
      p.imageUrl ?? '',
      Number(p.quantity ?? 0),
      p.unit,
      Number(p.lowStockThreshold ?? 10),
      p.lastImportDate || null,
      p.lastExportDate || null,
      p.updatedAt || new Date().toISOString(),
    ]
  );
}

async function insertTransactionToDb(client: pg.PoolClient, tx: Transaction): Promise<void> {
  const t = tx as Transaction & {
    productId: string;
    productName: string;
    productImageUrl?: string;
    employeeName?: string | null;
    note?: string | null;
    balanceAfter: number;
    createdAt?: string;
  };

  await client.query(
    `INSERT INTO public.transactions (
      id, code, type, product_id, product_name, product_image_url,
      quantity, unit, date, employee_name, note, balance_after, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
    [
      t.id,
      t.code,
      t.type,
      t.productId,
      t.productName,
      t.productImageUrl ?? '',
      Number(t.quantity),
      t.unit,
      t.date,
      t.employeeName ?? null,
      t.note ?? null,
      Number(t.balanceAfter),
      t.createdAt || new Date().toISOString(),
    ]
  );
}

// Connected SSE clients for real-time inventory sync
const sseClients = new Set<Response>();

function broadcastUpdate(eventType: string, payload: unknown): void {
  const frame = `event: ${eventType}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const res of sseClients) {
    try {
      res.write(frame);
    } catch {
      sseClients.delete(res);
    }
  }
}

const MIME_EXT_MAP: Record<string, string> = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

async function startServer(): Promise<void> {
  // Verify DB connection on startup
  const checkRes = await pool.query('SELECT COUNT(*)::int AS total FROM public.products');
  console.log(`Connected to Supabase PostgreSQL. Products count: ${checkRes.rows[0]?.total ?? 0}`);

  const app = express();
  app.disable('x-powered-by');

  // Local fallback uploads dir when Supabase Storage env vars are not configured
  if (!supabaseStorageClient) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    app.use(
      '/uploads',
      (_req, res, next) => {
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Cache-Control', 'public, max-age=86400');
        next();
      },
      express.static(UPLOADS_DIR, { dotfiles: 'deny', index: false })
    );
  }

  // Health & real-time SSE stream
  app.get('/api/events', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    res.write(`event: connected\ndata: ${JSON.stringify({ serverTime: new Date().toISOString() })}\n\n`);
    sseClients.add(res);

    const heartbeat = setInterval(() => {
      try {
        res.write(`: heartbeat\n\n`);
      } catch {
        clearInterval(heartbeat);
        sseClients.delete(res);
      }
    }, 25000);

    req.on('close', () => {
      clearInterval(heartbeat);
      sseClients.delete(res);
    });
  });

  // Read current warehouse state from PostgreSQL
  app.get('/api/inventory', async (_req: Request, res: Response) => {
    try {
      const state = await fetchWarehouseState();
      res.json({
        products: state.products,
        transactions: state.transactions,
        serverTime: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Fetch inventory failed:', err);
      res.status(500).json({ error: 'Không thể tải dữ liệu kho hàng từ cơ sở dữ liệu.' });
    }
  });

  // Upload product image -> Supabase Storage (or local fallback if unconfigured)
  app.post('/api/upload-image', express.json({ limit: '3mb' }), async (req: Request, res: Response) => {
    try {
      const dataUrl = typeof req.body?.dataUrl === 'string' ? req.body.dataUrl.trim() : '';
      const match = /^data:(image\/(?:png|jpeg|jpg|webp|gif));base64,([A-Za-z0-9+/=]+)$/i.exec(dataUrl);
      if (!match) {
        res.status(400).json({ error: 'Định dạng ảnh không hợp lệ. Chỉ hỗ trợ PNG, JPG, WEBP hoặc GIF.' });
        return;
      }

      const mime = match[1].toLowerCase();
      const ext = MIME_EXT_MAP[mime];
      if (!ext) {
        res.status(400).json({ error: 'Loại tệp hình ảnh không được hỗ trợ.' });
        return;
      }

      const buffer = Buffer.from(match[2], 'base64');
      if (buffer.length === 0 || buffer.length > 2 * 1024 * 1024) {
        res.status(400).json({ error: 'Kích thước ảnh phải nhỏ hơn 2MB.' });
        return;
      }

      const safeName = `${Date.now()}_${crypto.randomBytes(10).toString('hex')}${ext}`;

      if (supabaseStorageClient) {
        const { error: uploadError } = await supabaseStorageClient.storage
          .from(SUPABASE_STORAGE_BUCKET)
          .upload(safeName, buffer, {
            contentType: mime,
            upsert: false,
          });

        if (uploadError) {
          console.error('Supabase Storage upload error:', uploadError);
          res.status(500).json({ error: 'Không thể tải ảnh lên Supabase Storage.' });
          return;
        }

        const { data: publicData } = supabaseStorageClient.storage
          .from(SUPABASE_STORAGE_BUCKET)
          .getPublicUrl(safeName);

        res.status(201).json({ url: publicData.publicUrl });
        return;
      }

      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
      const resolvedPath = path.resolve(UPLOADS_DIR, safeName);
      if (!resolvedPath.startsWith(UPLOADS_DIR + path.sep)) {
        res.status(400).json({ error: 'Đường dẫn lưu tệp không hợp lệ.' });
        return;
      }

      fs.writeFileSync(resolvedPath, buffer);
      res.status(201).json({ url: `/uploads/${safeName}` });
    } catch (err) {
      console.error('Upload image failed:', err);
      res.status(500).json({ error: 'Không thể lưu hình ảnh sản phẩm.' });
    }
  });

  // Import stock
  app.post('/api/import', express.json({ limit: '100kb' }), async (req: Request, res: Response) => {
    const client = await pool.connect();
    try {
      const body = (req.body ?? {}) as Partial<ImportPayload>;
      const payload: ImportPayload = {
        productName: typeof body.productName === 'string' ? body.productName : '',
        imageUrl: typeof body.imageUrl === 'string' ? body.imageUrl : '',
        quantity: Number(body.quantity),
        unit: typeof body.unit === 'string' ? body.unit : '',
        importDate: typeof body.importDate === 'string' ? body.importDate : '',
        note: typeof body.note === 'string' ? body.note : undefined,
      };

      await client.query('BEGIN');
      await client.query('LOCK TABLE public.products IN SHARE ROW EXCLUSIVE MODE');

      const currentState = await fetchWarehouseState(client);
      const applied = applyImportTransaction(currentState, payload);
      if (!applied.ok) {
        await client.query('ROLLBACK');
        res.status(400).json({ error: applied.error });
        return;
      }

      await upsertProductToDb(client, applied.product);
      await insertTransactionToDb(client, applied.transaction);
      await client.query('COMMIT');

      const latestState = await fetchWarehouseState(client);
      const responseBody = {
        product: applied.product,
        transaction: applied.transaction,
        products: latestState.products,
        transactions: latestState.transactions,
        serverTime: new Date().toISOString(),
      };

      broadcastUpdate('inventory_update', responseBody);
      res.status(201).json(responseBody);
    } catch (err) {
      try {
        await client.query('ROLLBACK');
      } catch {
        // Ignore rollback errors
      }
      console.error('Import stock failed:', err);
      res.status(500).json({ error: 'Lỗi hệ thống khi xử lý phiếu nhập kho.' });
    } finally {
      client.release();
    }
  });

  // Export stock
  app.post('/api/export', express.json({ limit: '100kb' }), async (req: Request, res: Response) => {
    const client = await pool.connect();
    try {
      const body = (req.body ?? {}) as Partial<ExportPayload>;
      const payload: ExportPayload = {
        productId: typeof body.productId === 'string' ? body.productId : '',
        employeeName: typeof body.employeeName === 'string' ? body.employeeName : '',
        quantity: Number(body.quantity),
        unit: typeof body.unit === 'string' ? body.unit : '',
        exportDate: typeof body.exportDate === 'string' ? body.exportDate : '',
        note: typeof body.note === 'string' ? body.note : undefined,
      };

      await client.query('BEGIN');
      await client.query('LOCK TABLE public.products IN SHARE ROW EXCLUSIVE MODE');

      const currentState = await fetchWarehouseState(client);
      const applied = applyExportTransaction(currentState, payload);
      if (!applied.ok) {
        await client.query('ROLLBACK');
        res.status(400).json({ error: applied.error });
        return;
      }

      await upsertProductToDb(client, applied.product);
      await insertTransactionToDb(client, applied.transaction);
      await client.query('COMMIT');

      const latestState = await fetchWarehouseState(client);
      const responseBody = {
        product: applied.product,
        transaction: applied.transaction,
        products: latestState.products,
        transactions: latestState.transactions,
        serverTime: new Date().toISOString(),
      };

      broadcastUpdate('inventory_update', responseBody);
      res.status(201).json(responseBody);
    } catch (err) {
      try {
        await client.query('ROLLBACK');
      } catch {
        // Ignore rollback errors
      }
      console.error('Export stock failed:', err);
      res.status(500).json({ error: 'Lỗi hệ thống khi xử lý phiếu xuất kho.' });
    } finally {
      client.release();
    }
  });

  if (!IS_PROD) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Warehouse server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});