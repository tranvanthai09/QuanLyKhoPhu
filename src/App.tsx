import { useEffect, useMemo, useState } from 'react';
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Boxes,
  CheckCircle2,
  ClipboardList,
  Download,
  Menu,
  Search,
  Warehouse,
  X,
} from 'lucide-react';
import { ExportModal } from './components/ExportModal';
import { ImportModal } from './components/ImportModal';
import { InventoryTable } from './components/InventoryTable';
import { TransactionHistoryTable } from './components/TransactionHistoryTable';
import {
  buildCsvReport,
  computeInventorySummary,
  filterProducts,
  filterTransactions,
  getStockStatus,
  type InventoryTransaction,
  type Product,
  type StockStatus,
  type TransactionType,
} from './utils/inventoryLogic';

type ActiveTab = 'inventory' | 'history';

function getTodayIsoLocal(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('inventory');
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sseConnected, setSseConnected] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | StockStatus>('all');
  const [txTypeFilter, setTxTypeFilter] = useState<'all' | TransactionType>('all');

  const [importModalOpen, setImportModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [selectedProductForModal, setSelectedProductForModal] = useState<Product | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [todayStr] = useState<string>(() => getTodayIsoLocal());

  const fetchInventory = async () => {
    try {
      setLoadError(null);
      const res = await fetch('/api/inventory');
      if (!res.ok) {
        throw new Error('Không thể tải dữ liệu kho.');
      }
      const data = await res.json();
      setProducts(Array.isArray(data.products) ? data.products : []);
      setTransactions(Array.isArray(data.transactions) ? data.transactions : []);
    } catch {
      setLoadError('Không thể kết nối tới máy chủ quản lý kho. Vui lòng thử tải lại.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();

    const eventSource = new EventSource('/api/events');
    eventSource.addEventListener('connected', () => {
      setSseConnected(true);
    });
    eventSource.addEventListener('inventory_update', (evt) => {
      try {
        const payload = JSON.parse((evt as MessageEvent).data);
        if (Array.isArray(payload.products)) {
          setProducts(payload.products);
        }
        if (Array.isArray(payload.transactions)) {
          setTransactions(payload.transactions);
        }
      } catch {
        // Ignore malformed SSE payload
      }
    });
    eventSource.onerror = () => {
      setSseConnected(false);
    };

    return () => {
      eventSource.close();
    };
  }, []);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  const summary = useMemo(
    () => computeInventorySummary(products, transactions, todayStr),
    [products, transactions, todayStr]
  );

  const filteredProducts = useMemo(
    () => filterProducts(products, searchQuery, statusFilter),
    [products, searchQuery, statusFilter]
  );

  const filteredTransactions = useMemo(
    () => filterTransactions(transactions, searchQuery, txTypeFilter),
    [transactions, searchQuery, txTypeFilter]
  );

  const lowStockProducts = useMemo(
    () =>
      products.filter((p) => {
        const st = getStockStatus(p.quantity, p.lowStockThreshold);
        return st === 'low_stock' || st === 'out_of_stock';
      }),
    [products]
  );

  const handleOpenImport = (product: Product | null = null) => {
    setSelectedProductForModal(product);
    setImportModalOpen(true);
  };

  const handleOpenExport = (product: Product | null = null) => {
    setSelectedProductForModal(product);
    setExportModalOpen(true);
  };

  const handleExportCsv = () => {
    const csv = buildCsvReport(products, transactions);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bao-cao-xuat-nhap-kho-${todayStr}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const hasInventoryFilter = searchQuery.trim() !== '' || statusFilter !== 'all';
  const hasHistoryFilter = searchQuery.trim() !== '' || txTypeFilter !== 'all';

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      {/* Mobile Sidebar Backdrop */}
      {mobileNavOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-150 lg:static lg:translate-x-0 ${
          mobileNavOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-16 px-5 flex items-center justify-between border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-slate-900 text-white flex items-center justify-center">
              <Warehouse className="h-4 w-4" aria-hidden="true" />
            </div>
            <span className="font-display text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap">
              KhoVận
            </span>
          </div>
          <button
            type="button"
            onClick={() => setMobileNavOpen(false)}
            aria-label="Đóng menu điều hướng"
            className="lg:hidden h-8 w-8 inline-flex items-center justify-center rounded-md text-slate-500 hover:bg-slate-100"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <nav className="p-3 space-y-1" aria-label="Điều hướng chính">
          <button
            type="button"
            onClick={() => {
              setActiveTab('inventory');
              setMobileNavOpen(false);
            }}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === 'inventory'
                ? 'bg-slate-900 text-white'
                : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <Boxes className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Tồn kho hiện tại</span>
            </span>
            <span
              className={`font-mono text-xs tabular-nums ${
                activeTab === 'inventory' ? 'text-slate-300' : 'text-slate-500'
              }`}
            >
              {products.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('history');
              setMobileNavOpen(false);
            }}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === 'history'
                ? 'bg-slate-900 text-white'
                : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <ClipboardList className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Nhật ký xuất nhập</span>
            </span>
            <span
              className={`font-mono text-xs tabular-nums ${
                activeTab === 'history' ? 'text-slate-300' : 'text-slate-500'
              }`}
            >
              {transactions.length}
            </span>
          </button>
        </nav>

        {/* Low stock sidebar alert list */}
        <div className="mt-4 px-4 py-4 border-t border-slate-100 flex-1 overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-slate-500">
              Cần nhập bổ sung
            </h2>
            <span className="text-xs font-mono tabular-nums text-slate-500">
              {lowStockProducts.length}
            </span>
          </div>

          {lowStockProducts.length === 0 ? (
            <p className="text-xs text-slate-500 leading-relaxed">
              Tất cả mặt hàng đều đang ở mức tồn kho an toàn.
            </p>
          ) : (
            <ul className="space-y-2.5">
              {lowStockProducts.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-100 last:border-b-0"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-800 truncate">
                      {item.name}
                    </p>
                    <p
                      className={`text-xs font-mono tabular-nums mt-0.5 ${
                        item.quantity <= 0 ? 'text-red-700' : 'text-amber-700'
                      }`}
                    >
                      Còn {item.quantity} {item.unit}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleOpenImport(item)}
                    aria-label={`Nhập bổ sung ${item.name}`}
                    className="h-7 px-2 rounded border border-slate-200 text-xs font-medium text-blue-700 hover:bg-blue-50 transition-colors shrink-0"
                  >
                    Nhập
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="px-4 py-3 border-t border-slate-200 text-xs text-slate-500">
          <span>
            {sseConnected ? 'Đồng bộ thời gian thực' : 'Đang kết nối lại...'}
          </span>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Bar */}
        <header className="h-16 bg-white border-b border-slate-200 px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-4 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Mở menu điều hướng"
              className="lg:hidden h-9 w-9 inline-flex items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 shrink-0"
            >
              <Menu className="h-4 w-4" aria-hidden="true" />
            </button>
            <h1 className="text-base sm:text-lg font-semibold text-slate-900 truncate">
              {activeTab === 'inventory'
                ? 'Tồn kho thực tế'
                : 'Nhật ký xuất nhập'}
            </h1>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => handleOpenExport(null)}
              className="inline-flex items-center gap-1.5 h-9 sm:h-10 px-2.5 sm:px-4 rounded-lg border border-slate-300 bg-white text-xs sm:text-sm font-medium text-slate-800 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
            >
              <ArrowUpFromLine className="h-4 w-4" aria-hidden="true" />
              <span>Xuất kho</span>
            </button>
            <button
              type="button"
              onClick={() => handleOpenImport(null)}
              className="inline-flex items-center gap-1.5 h-9 sm:h-10 px-2.5 sm:px-4 rounded-lg bg-blue-700 text-xs sm:text-sm font-medium text-white hover:bg-blue-800 transition-colors whitespace-nowrap shrink-0"
            >
              <ArrowDownToLine className="h-4 w-4" aria-hidden="true" />
              <span>Nhập kho</span>
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 max-w-[1360px] w-full mx-auto space-y-5">
          {toastMessage && (
            <div
              role="status"
              className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-700 shrink-0" aria-hidden="true" />
                <span>{toastMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setToastMessage(null)}
                aria-label="Đóng thông báo"
                className="text-emerald-700 hover:text-emerald-900 text-xs font-medium"
              >
                Đóng
              </button>
            </div>
          )}

          {loadError && (
            <div
              role="alert"
              className="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
            >
              <span>{loadError}</span>
              <button
                type="button"
                onClick={fetchInventory}
                className="h-8 px-3 rounded-md border border-red-300 bg-white text-xs font-medium text-red-700 hover:bg-red-50"
              >
                Thử lại
              </button>
            </div>
          )}

          {/* 4-Column Flat KPI Strip */}
          <section
            aria-label="Tổng quan tồn kho"
            className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-slate-200 border border-slate-200 rounded-xl overflow-hidden"
          >
            <div className="bg-white px-4 sm:px-5 py-4">
              <p className="text-xs font-medium text-slate-500">Tổng mặt hàng</p>
              <p className="mt-1.5 text-2xl font-semibold font-mono tabular-nums text-slate-900">
                {summary.totalProducts.toLocaleString('vi-VN')}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Đang quản lý trong kho
              </p>
            </div>

            <div className="bg-white px-4 sm:px-5 py-4">
              <p className="text-xs font-medium text-slate-500">Tổng số lượng tồn</p>
              <p className="mt-1.5 text-2xl font-semibold font-mono tabular-nums text-slate-900">
                {summary.totalUnits.toLocaleString('vi-VN')}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Cộng dồn mọi đơn vị tính
              </p>
            </div>

            <div className="bg-white px-4 sm:px-5 py-4">
              <p className="text-xs font-medium text-slate-500">Cảnh báo tồn thấp</p>
              <p
                className={`mt-1.5 text-2xl font-semibold font-mono tabular-nums ${
                  summary.lowStockCount + summary.outOfStockCount > 0
                    ? 'text-amber-700'
                    : 'text-emerald-700'
                }`}
              >
                {(summary.lowStockCount + summary.outOfStockCount).toLocaleString('vi-VN')}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {summary.outOfStockCount} hết hàng · {summary.lowStockCount} sắp hết
              </p>
            </div>

            <div className="bg-white px-4 sm:px-5 py-4">
              <p className="text-xs font-medium text-slate-500">Giao dịch hôm nay</p>
              <p className="mt-1.5 text-2xl font-semibold font-mono tabular-nums text-slate-900">
                <span className="text-emerald-700">+{summary.todayImports}</span>
                <span className="text-slate-300 mx-1.5">/</span>
                <span className="text-slate-900">-{summary.todayExports}</span>
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Tổng {summary.totalImportCount} nhập · {summary.totalExportCount} xuất
              </p>
            </div>
          </section>

          {/* Search & Filter Toolbar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
              <div className="relative flex-1 max-w-md">
                <label htmlFor="warehouse-search" className="sr-only">
                  Tìm kiếm sản phẩm hoặc nhân viên
                </label>
                <Search
                  className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  id="warehouse-search"
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    activeTab === 'inventory'
                      ? 'Tìm tên sản phẩm, mã SKU, đơn vị...'
                      : 'Tìm tên sản phẩm, nhân viên, mã phiếu...'
                  }
                  className="w-full h-10 pl-9 pr-3 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              {activeTab === 'inventory' ? (
                <div
                  className="inline-flex items-center p-1 rounded-lg bg-slate-200/70 self-start"
                  role="group"
                  aria-label="Lọc trạng thái tồn kho"
                >
                  {(
                    [
                      { id: 'all', label: 'Tất cả' },
                      { id: 'in_stock', label: 'Còn hàng' },
                      { id: 'low_stock', label: 'Sắp hết' },
                      { id: 'out_of_stock', label: 'Hết hàng' },
                    ] as const
                  ).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setStatusFilter(item.id)}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                        statusFilter === item.id
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              ) : (
                <div
                  className="inline-flex items-center p-1 rounded-lg bg-slate-200/70 self-start"
                  role="group"
                  aria-label="Lọc loại phiếu giao dịch"
                >
                  {(
                    [
                      { id: 'all', label: 'Tất cả phiếu' },
                      { id: 'import', label: 'Phiếu nhập' },
                      { id: 'export', label: 'Phiếu xuất' },
                    ] as const
                  ).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setTxTypeFilter(item.id)}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                        txTypeFilter === item.id
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() =>
                  setActiveTab(activeTab === 'inventory' ? 'history' : 'inventory')
                }
                className="lg:hidden h-10 px-3.5 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap shrink-0"
              >
                {activeTab === 'inventory' ? 'Xem nhật ký' : 'Xem tồn kho'}
              </button>
              <button
                type="button"
                onClick={handleExportCsv}
                className="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
              >
                <Download className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Xuất báo cáo CSV</span>
              </button>
            </div>
          </div>

          {/* Main View */}
          {activeTab === 'inventory' ? (
            <InventoryTable
              products={filteredProducts}
              isLoading={isLoading}
              hasActiveFilter={hasInventoryFilter}
              onQuickImport={(prod) => handleOpenImport(prod)}
              onQuickExport={(prod) => handleOpenExport(prod)}
              onOpenNewImport={() => handleOpenImport(null)}
              onResetFilters={() => {
                setSearchQuery('');
                setStatusFilter('all');
              }}
            />
          ) : (
            <TransactionHistoryTable
              transactions={filteredTransactions}
              isLoading={isLoading}
              hasActiveFilter={hasHistoryFilter}
              onResetFilters={() => {
                setSearchQuery('');
                setTxTypeFilter('all');
              }}
            />
          )}
        </main>
      </div>

      {/* Modals */}
      <ImportModal
        isOpen={importModalOpen}
        products={products}
        initialProduct={selectedProductForModal}
        todayStr={todayStr}
        onClose={() => setImportModalOpen(false)}
        onSuccess={({ products: nextProds, transactions: nextTxs, message }) => {
          setProducts(nextProds);
          setTransactions(nextTxs);
          setToastMessage(message);
        }}
      />

      <ExportModal
        isOpen={exportModalOpen}
        products={products}
        initialProduct={selectedProductForModal}
        todayStr={todayStr}
        onClose={() => setExportModalOpen(false)}
        onSuccess={({ products: nextProds, transactions: nextTxs, message }) => {
          setProducts(nextProds);
          setTransactions(nextTxs);
          setToastMessage(message);
        }}
      />
    </div>
  );
}
