export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock';
export type TransactionType = 'import' | 'export';

export interface Product {
  id: string;
  sku: string;
  name: string;
  imageUrl: string;
  quantity: number;
  unit: string;
  lowStockThreshold: number;
  lastImportDate: string | null;
  lastExportDate: string | null;
  updatedAt: string;
}

export interface InventoryTransaction {
  id: string;
  code: string;
  type: TransactionType;
  productId: string;
  productName: string;
  productImageUrl: string;
  quantity: number;
  unit: string;
  date: string; // YYYY-MM-DD
  employeeName: string | null;
  note: string | null;
  balanceAfter: number;
  createdAt: string;
}

export interface WarehouseState {
  products: Product[];
  transactions: InventoryTransaction[];
}

export interface ImportPayload {
  productName: string;
  imageUrl: string;
  quantity: number;
  unit: string;
  importDate: string;
  note?: string;
}

export interface ExportPayload {
  productId: string;
  employeeName: string;
  quantity: number;
  unit: string;
  exportDate: string;
  note?: string;
}

export type ValidationResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export const STANDARD_UNITS = ['Cái', 'Chiếc', 'Hộp', 'Thùng', 'Cuộn', 'Bộ', 'Kg', 'Mét'] as const;

export function normalizeText(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/\s+/g, ' ');
}

export function isValidIsoDate(dateStr: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return false;
  }
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return (
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() === m - 1 &&
    dt.getUTCDate() === d
  );
}

export function isSafeImageUrl(rawUrl: string): boolean {
  const url = rawUrl.trim();
  if (!url) return false;
  if (url.startsWith('/src/assets/images/') || url.startsWith('/uploads/')) {
    return !url.includes('..') && !/[<>"'`]/.test(url);
  }
  if (/^data:image\/(png|jpeg|jpg|webp|gif);base64,[A-Za-z0-9+/=]+$/i.test(url)) {
    return url.length <= 3_000_000;
  }
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

export function getStockStatus(quantity: number, lowStockThreshold = 10): StockStatus {
  if (quantity <= 0) return 'out_of_stock';
  if (quantity <= lowStockThreshold) return 'low_stock';
  return 'in_stock';
}

export function getStockStatusLabel(status: StockStatus): string {
  switch (status) {
    case 'in_stock':
      return 'Còn hàng';
    case 'low_stock':
      return 'Sắp hết';
    case 'out_of_stock':
      return 'Hết hàng';
  }
}

export function formatVnDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (!match) return dateStr;
  return `${match[3]}/${match[2]}/${match[1]}`;
}

export function validateImportPayload(input: ImportPayload): ValidationResult<ImportPayload> {
  const productName = (input.productName ?? '').trim();
  const unit = (input.unit ?? '').trim();
  const imageUrl = (input.imageUrl ?? '').trim();
  const importDate = (input.importDate ?? '').trim();
  const note = input.note ? input.note.trim().slice(0, 200) : undefined;
  const quantity = Number(input.quantity);

  if (productName.length < 2 || productName.length > 120) {
    return { ok: false, error: 'Tên sản phẩm phải từ 2 đến 120 ký tự.' };
  }
  if (!Number.isFinite(quantity) || quantity <= 0 || !Number.isInteger(quantity)) {
    return { ok: false, error: 'Số lượng nhập phải là số nguyên dương lớn hơn 0.' };
  }
  if (quantity > 1_000_000) {
    return { ok: false, error: 'Số lượng nhập vượt quá giới hạn cho phép (1.000.000).' };
  }
  if (unit.length < 1 || unit.length > 30) {
    return { ok: false, error: 'Vui lòng nhập đơn vị tính hợp lệ (tối đa 30 ký tự).' };
  }
  if (!isValidIsoDate(importDate)) {
    return { ok: false, error: 'Ngày nhập không hợp lệ (định dạng YYYY-MM-DD).' };
  }
  if (imageUrl && !isSafeImageUrl(imageUrl)) {
    return { ok: false, error: 'Đường dẫn hình ảnh không hợp lệ hoặc không được hỗ trợ.' };
  }

  return {
    ok: true,
    data: {
      productName,
      imageUrl,
      quantity,
      unit,
      importDate,
      note,
    },
  };
}

export function validateExportPayload(
  input: ExportPayload,
  products: Product[]
): ValidationResult<ExportPayload> {
  const productId = (input.productId ?? '').trim();
  const employeeName = (input.employeeName ?? '').trim();
  const unit = (input.unit ?? '').trim();
  const exportDate = (input.exportDate ?? '').trim();
  const note = input.note ? input.note.trim().slice(0, 200) : undefined;
  const quantity = Number(input.quantity);

  if (!productId) {
    return { ok: false, error: 'Vui lòng chọn sản phẩm cần xuất kho.' };
  }

  const product = products.find((p) => p.id === productId);
  if (!product) {
    return { ok: false, error: 'Không tìm thấy sản phẩm trong hệ thống.' };
  }

  if (employeeName.length < 2 || employeeName.length > 80) {
    return { ok: false, error: 'Tên nhân viên phải từ 2 đến 80 ký tự.' };
  }
  if (!Number.isFinite(quantity) || quantity <= 0 || !Number.isInteger(quantity)) {
    return { ok: false, error: 'Số lượng xuất phải là số nguyên dương lớn hơn 0.' };
  }
  if (product.quantity <= 0) {
    return { ok: false, error: `Sản phẩm "${product.name}" đã hết hàng trong kho.` };
  }
  if (quantity > product.quantity) {
    return {
      ok: false,
      error: `Số lượng xuất (${quantity}) vượt quá tồn kho hiện tại (${product.quantity} ${product.unit}).`,
    };
  }
  if (unit.length < 1 || unit.length > 30) {
    return { ok: false, error: 'Vui lòng nhập đơn vị tính hợp lệ.' };
  }
  if (normalizeText(unit) !== normalizeText(product.unit)) {
    return {
      ok: false,
      error: `Đơn vị xuất phải khớp với đơn vị lưu kho của sản phẩm (${product.unit}).`,
    };
  }
  if (!isValidIsoDate(exportDate)) {
    return { ok: false, error: 'Ngày xuất không hợp lệ (định dạng YYYY-MM-DD).' };
  }

  return {
    ok: true,
    data: {
      productId,
      employeeName,
      quantity,
      unit: product.unit,
      exportDate,
      note,
    },
  };
}

function generateSku(existingProducts: Product[]): string {
  const num = existingProducts.length + 1;
  let candidate = `SP-${String(num).padStart(4, '0')}`;
  let offset = 1;
  while (existingProducts.some((p) => p.sku === candidate)) {
    candidate = `SP-${String(num + offset).padStart(4, '0')}`;
    offset += 1;
  }
  return candidate;
}

function generateTxCode(type: TransactionType, existingTransactions: InventoryTransaction[]): string {
  const prefix = type === 'import' ? 'PN' : 'PX';
  const count = existingTransactions.filter((t) => t.type === type).length + 1;
  let candidate = `${prefix}-${String(count).padStart(4, '0')}`;
  let offset = 1;
  while (existingTransactions.some((t) => t.code === candidate)) {
    candidate = `${prefix}-${String(count + offset).padStart(4, '0')}`;
    offset += 1;
  }
  return candidate;
}

export function applyImportTransaction(
  state: WarehouseState,
  rawInput: ImportPayload,
  nowIso = new Date().toISOString(),
  idSuffix = Math.random().toString(36).slice(2, 8)
): { ok: true; state: WarehouseState; product: Product; transaction: InventoryTransaction } | { ok: false; error: string } {
  const validation = validateImportPayload(rawInput);
  if (!validation.ok) {
    return validation;
  }
  const input = validation.data;
  const normalizedTargetName = normalizeText(input.productName);
  const normalizedTargetUnit = normalizeText(input.unit);

  const existingIndex = state.products.findIndex(
    (p) =>
      normalizeText(p.name) === normalizedTargetName &&
      normalizeText(p.unit) === normalizedTargetUnit
  );

  let updatedProduct: Product;
  let nextProducts: Product[];

  if (existingIndex >= 0) {
    const current = state.products[existingIndex];
    const nextQty = current.quantity + input.quantity;
    updatedProduct = {
      ...current,
      quantity: nextQty,
      imageUrl: input.imageUrl || current.imageUrl,
      lastImportDate:
        !current.lastImportDate || input.importDate >= current.lastImportDate
          ? input.importDate
          : current.lastImportDate,
      updatedAt: nowIso,
    };
    nextProducts = [
      updatedProduct,
      ...state.products.filter((_, idx) => idx !== existingIndex),
    ];
  } else {
    updatedProduct = {
      id: `prod_${Date.now()}_${idSuffix}`,
      sku: generateSku(state.products),
      name: input.productName,
      imageUrl: input.imageUrl || '',
      quantity: input.quantity,
      unit: input.unit,
      lowStockThreshold: 10,
      lastImportDate: input.importDate,
      lastExportDate: null,
      updatedAt: nowIso,
    };
    nextProducts = [updatedProduct, ...state.products];
  }

  const transaction: InventoryTransaction = {
    id: `tx_${Date.now()}_${idSuffix}`,
    code: generateTxCode('import', state.transactions),
    type: 'import',
    productId: updatedProduct.id,
    productName: updatedProduct.name,
    productImageUrl: updatedProduct.imageUrl,
    quantity: input.quantity,
    unit: updatedProduct.unit,
    date: input.importDate,
    employeeName: null,
    note: input.note ?? null,
    balanceAfter: updatedProduct.quantity,
    createdAt: nowIso,
  };

  return {
    ok: true,
    product: updatedProduct,
    transaction,
    state: {
      products: nextProducts,
      transactions: [transaction, ...state.transactions],
    },
  };
}

export function applyExportTransaction(
  state: WarehouseState,
  rawInput: ExportPayload,
  nowIso = new Date().toISOString(),
  idSuffix = Math.random().toString(36).slice(2, 8)
): { ok: true; state: WarehouseState; product: Product; transaction: InventoryTransaction } | { ok: false; error: string } {
  const validation = validateExportPayload(rawInput, state.products);
  if (!validation.ok) {
    return validation;
  }
  const input = validation.data;
  const currentIndex = state.products.findIndex((p) => p.id === input.productId);
  const current = state.products[currentIndex];
  const nextQty = current.quantity - input.quantity;

  const updatedProduct: Product = {
    ...current,
    quantity: nextQty,
    lastExportDate:
      !current.lastExportDate || input.exportDate >= current.lastExportDate
        ? input.exportDate
        : current.lastExportDate,
    updatedAt: nowIso,
  };

  const nextProducts = state.products.map((p, idx) =>
    idx === currentIndex ? updatedProduct : p
  );

  const transaction: InventoryTransaction = {
    id: `tx_${Date.now()}_${idSuffix}`,
    code: generateTxCode('export', state.transactions),
    type: 'export',
    productId: updatedProduct.id,
    productName: updatedProduct.name,
    productImageUrl: updatedProduct.imageUrl,
    quantity: input.quantity,
    unit: updatedProduct.unit,
    date: input.exportDate,
    employeeName: input.employeeName,
    note: input.note ?? null,
    balanceAfter: updatedProduct.quantity,
    createdAt: nowIso,
  };

  return {
    ok: true,
    product: updatedProduct,
    transaction,
    state: {
      products: nextProducts,
      transactions: [transaction, ...state.transactions],
    },
  };
}

export interface InventorySummary {
  totalProducts: number;
  totalUnits: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalImportCount: number;
  totalExportCount: number;
  todayImports: number;
  todayExports: number;
}

export function computeInventorySummary(
  products: Product[],
  transactions: InventoryTransaction[],
  todayStr: string
): InventorySummary {
  let totalUnits = 0;
  let lowStockCount = 0;
  let outOfStockCount = 0;

  for (const product of products) {
    totalUnits += product.quantity;
    const status = getStockStatus(product.quantity, product.lowStockThreshold);
    if (status === 'low_stock') lowStockCount += 1;
    if (status === 'out_of_stock') outOfStockCount += 1;
  }

  let totalImportCount = 0;
  let totalExportCount = 0;
  let todayImports = 0;
  let todayExports = 0;

  for (const tx of transactions) {
    if (tx.type === 'import') {
      totalImportCount += 1;
      if (tx.date === todayStr) todayImports += tx.quantity;
    } else {
      totalExportCount += 1;
      if (tx.date === todayStr) todayExports += tx.quantity;
    }
  }

  return {
    totalProducts: products.length,
    totalUnits,
    lowStockCount,
    outOfStockCount,
    totalImportCount,
    totalExportCount,
    todayImports,
    todayExports,
  };
}

export function filterProducts(
  products: Product[],
  search: string,
  statusFilter: 'all' | StockStatus
): Product[] {
  const q = normalizeText(search);
  return products.filter((p) => {
    const status = getStockStatus(p.quantity, p.lowStockThreshold);
    if (statusFilter !== 'all' && status !== statusFilter) {
      return false;
    }
    if (!q) return true;
    return (
      normalizeText(p.name).includes(q) ||
      normalizeText(p.sku).includes(q) ||
      normalizeText(p.unit).includes(q)
    );
  });
}

export function filterTransactions(
  transactions: InventoryTransaction[],
  search: string,
  typeFilter: 'all' | TransactionType
): InventoryTransaction[] {
  const q = normalizeText(search);
  return transactions.filter((tx) => {
    if (typeFilter !== 'all' && tx.type !== typeFilter) {
      return false;
    }
    if (!q) return true;
    return (
      normalizeText(tx.productName).includes(q) ||
      normalizeText(tx.code).includes(q) ||
      (tx.employeeName ? normalizeText(tx.employeeName).includes(q) : false)
    );
  });
}

export function buildCsvReport(products: Product[], transactions: InventoryTransaction[]): string {
  const escape = (v: string | number | null) => {
    const str = v === null ? '' : String(v);
    return `"${str.replace(/"/g, '""')}"`;
  };

  const lines: string[] = [];
  lines.push(['Mã SKU', 'Tên sản phẩm', 'Tồn kho hiện tại', 'Đơn vị tính', 'Trạng thái', 'Ngày nhập gần nhất', 'Ngày xuất gần nhất'].map(escape).join(','));
  for (const p of products) {
    lines.push([
      p.sku,
      p.name,
      p.quantity,
      p.unit,
      getStockStatusLabel(getStockStatus(p.quantity, p.lowStockThreshold)),
      p.lastImportDate ?? '',
      p.lastExportDate ?? '',
    ].map(escape).join(','));
  }

  lines.push('');
  lines.push(['Mã phiếu', 'Loại phiếu', 'Tên sản phẩm', 'Nhân viên xuất', 'Số lượng', 'Đơn vị tính', 'Ngày thực hiện', 'Tồn sau giao dịch'].map(escape).join(','));
  for (const t of transactions) {
    lines.push([
      t.code,
      t.type === 'import' ? 'Nhập kho' : 'Xuất kho',
      t.productName,
      t.employeeName ?? 'Nhập hệ thống',
      t.type === 'import' ? `+${t.quantity}` : `-${t.quantity}`,
      t.unit,
      t.date,
      t.balanceAfter,
    ].map(escape).join(','));
  }

  return '\uFEFF' + lines.join('\n');
}
