import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyExportTransaction,
  applyImportTransaction,
  computeInventorySummary,
  filterProducts,
  filterTransactions,
  getStockStatus,
  isSafeImageUrl,
  validateExportPayload,
  validateImportPayload,
  type WarehouseState,
} from './inventoryLogic';

const baseState: WarehouseState = {
  products: [
    {
      id: 'p1',
      sku: 'SP-0001',
      name: 'Máy khoan pin 18V',
      imageUrl: '/src/assets/images/product_cordless_drill_1795410711095.jpg',
      quantity: 18,
      unit: 'Cái',
      lowStockThreshold: 10,
      lastImportDate: '2026-11-20',
      lastExportDate: '2026-11-21',
      updatedAt: '2026-11-21T08:00:00.000Z',
    },
    {
      id: 'p2',
      sku: 'SP-0002',
      name: 'Mũ bảo hộ công trường',
      imageUrl: '/src/assets/images/product_safety_helmet_1795410711575.jpg',
      quantity: 6,
      unit: 'Cái',
      lowStockThreshold: 10,
      lastImportDate: '2026-11-18',
      lastExportDate: null,
      updatedAt: '2026-11-18T08:00:00.000Z',
    },
  ],
  transactions: [],
};

test('validateImportPayload rejects invalid quantities, dates, and unsafe image URLs', () => {
  const badQty = validateImportPayload({
    productName: 'Băng keo đóng hàng',
    imageUrl: '',
    quantity: 0,
    unit: 'Cuộn',
    importDate: '2026-11-22',
  });
  assert.equal(badQty.ok, false);

  const badDate = validateImportPayload({
    productName: 'Băng keo đóng hàng',
    imageUrl: '',
    quantity: 10,
    unit: 'Cuộn',
    importDate: '2026-02-30',
  });
  assert.equal(badDate.ok, false);

  assert.equal(isSafeImageUrl('javascript:alert(1)'), false);
  assert.equal(isSafeImageUrl('data:text/html;base64,PHNjcmlwdD4='), false);
  assert.equal(isSafeImageUrl('/src/assets/images/product_cordless_drill_1795410711095.jpg'), true);
});

test('applyImportTransaction creates a new product and updates existing matching product stock', () => {
  const createRes = applyImportTransaction(
    baseState,
    {
      productName: 'Cảm biến áp suất',
      imageUrl: '/src/assets/images/product_steel_bearings_1795410712221.jpg',
      quantity: 25,
      unit: 'Cái',
      importDate: '2026-11-22',
    },
    '2026-11-22T10:00:00.000Z',
    'abc'
  );
  assert.equal(createRes.ok, true);
  if (!createRes.ok) return;
  assert.equal(createRes.product.quantity, 25);
  assert.equal(createRes.state.products.length, 3);
  assert.equal(createRes.transaction.type, 'import');
  assert.equal(createRes.transaction.balanceAfter, 25);

  const restockRes = applyImportTransaction(
    createRes.state,
    {
      productName: 'may khoan pin 18v',
      imageUrl: '',
      quantity: 7,
      unit: 'Cái',
      importDate: '2026-11-23',
    },
    '2026-11-23T10:00:00.000Z',
    'def'
  );
  assert.equal(restockRes.ok, true);
  if (!restockRes.ok) return;
  assert.equal(restockRes.state.products.length, 3);
  assert.equal(restockRes.product.quantity, 25);
  assert.equal(restockRes.product.lastImportDate, '2026-11-23');
});

test('applyExportTransaction deducts stock, records employee name, and blocks over-export', () => {
  const overExport = validateExportPayload(
    {
      productId: 'p1',
      employeeName: 'Nguyễn Văn Minh',
      quantity: 99,
      unit: 'Cái',
      exportDate: '2026-11-22',
    },
    baseState.products
  );
  assert.equal(overExport.ok, false);

  const unitMismatch = validateExportPayload(
    {
      productId: 'p1',
      employeeName: 'Nguyễn Văn Minh',
      quantity: 2,
      unit: 'Thùng',
      exportDate: '2026-11-22',
    },
    baseState.products
  );
  assert.equal(unitMismatch.ok, false);

  const exportRes = applyExportTransaction(
    baseState,
    {
      productId: 'p1',
      employeeName: 'Nguyễn Văn Minh',
      quantity: 5,
      unit: 'Cái',
      exportDate: '2026-11-22',
    },
    '2026-11-22T12:00:00.000Z',
    'exp1'
  );
  assert.equal(exportRes.ok, true);
  if (!exportRes.ok) return;
  assert.equal(exportRes.product.quantity, 13);
  assert.equal(exportRes.transaction.employeeName, 'Nguyễn Văn Minh');
  assert.equal(exportRes.transaction.balanceAfter, 13);
  assert.equal(getStockStatus(0), 'out_of_stock');
  assert.equal(getStockStatus(6, 10), 'low_stock');
  assert.equal(getStockStatus(13, 10), 'in_stock');
});

test('computeInventorySummary, filterProducts, and filterTransactions work with Vietnamese queries', () => {
  const exp = applyExportTransaction(
    baseState,
    {
      productId: 'p1',
      employeeName: 'Trần Thị Hoa',
      quantity: 18,
      unit: 'Cái',
      exportDate: '2026-11-22',
    },
    '2026-11-22T12:00:00.000Z',
    'e1'
  );
  assert.equal(exp.ok, true);
  if (!exp.ok) return;

  const summary = computeInventorySummary(exp.state.products, exp.state.transactions, '2026-11-22');
  assert.equal(summary.totalProducts, 2);
  assert.equal(summary.totalUnits, 6);
  assert.equal(summary.outOfStockCount, 1);
  assert.equal(summary.lowStockCount, 1);
  assert.equal(summary.todayExports, 18);

  const outList = filterProducts(exp.state.products, '', 'out_of_stock');
  assert.equal(outList.length, 1);
  assert.equal(outList[0].id, 'p1');

  const txByEmployee = filterTransactions(exp.state.transactions, 'tran thi hoa', 'export');
  assert.equal(txByEmployee.length, 1);
});
