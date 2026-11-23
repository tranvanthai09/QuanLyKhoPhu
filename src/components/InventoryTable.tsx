import { ArrowDownToLine, ArrowUpFromLine, PackageOpen } from 'lucide-react';
import {
  formatVnDate,
  getStockStatus,
  getStockStatusLabel,
  type Product,
} from '../utils/inventoryLogic';
import { ProductThumbnail } from './ProductThumbnail';

interface InventoryTableProps {
  products: Product[];
  isLoading: boolean;
  hasActiveFilter: boolean;
  onQuickImport: (product: Product) => void;
  onQuickExport: (product: Product) => void;
  onOpenNewImport: () => void;
  onResetFilters: () => void;
}

export function InventoryTable({
  products,
  isLoading,
  hasActiveFilter,
  onQuickImport,
  onQuickExport,
  onOpenNewImport,
  onResetFilters,
}: InventoryTableProps) {
  if (isLoading) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="divide-y divide-slate-100">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between px-5 py-3.5 animate-pulse">
              <div className="flex items-center gap-3.5">
                <div className="h-11 w-11 rounded-lg bg-slate-200" />
                <div className="space-y-2">
                  <div className="h-4 w-48 rounded bg-slate-200" />
                  <div className="h-3 w-24 rounded bg-slate-100" />
                </div>
              </div>
              <div className="h-4 w-20 rounded bg-slate-200" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl px-6 py-14 text-center">
        <div className="mx-auto h-12 w-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 mb-3">
          <PackageOpen className="h-6 w-6" aria-hidden="true" />
        </div>
        <h3 className="text-base font-semibold text-slate-900">
          {hasActiveFilter ? 'Không tìm thấy sản phẩm phù hợp' : 'Kho hiện chưa có sản phẩm'}
        </h3>
        <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
          {hasActiveFilter
            ? 'Thử thay đổi từ khóa tìm kiếm hoặc bỏ bộ lọc trạng thái để xem toàn bộ danh sách tồn kho.'
            : 'Bắt đầu bằng cách lập phiếu nhập kho đầu tiên để theo dõi số lượng tồn theo thời gian thực.'}
        </p>
        <div className="mt-5">
          {hasActiveFilter ? (
            <button
              type="button"
              onClick={onResetFilters}
              className="h-10 px-4 rounded-lg border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Xóa bộ lọc
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenNewImport}
              className="h-10 px-4 rounded-lg bg-blue-700 text-sm font-medium text-white hover:bg-blue-800 transition-colors"
            >
              Nhập kho sản phẩm đầu tiên
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-500">
              <th scope="col" className="py-3 pl-5 pr-3">
                Sản phẩm
              </th>
              <th scope="col" className="py-3 px-3 text-right">
                Tồn kho thực tế
              </th>
              <th scope="col" className="py-3 px-3">
                Đơn vị tính
              </th>
              <th scope="col" className="py-3 px-3">
                Trạng thái
              </th>
              <th scope="col" className="py-3 px-3">
                Ngày nhập gần nhất
              </th>
              <th scope="col" className="py-3 px-3">
                Ngày xuất gần nhất
              </th>
              <th scope="col" className="py-3 pl-3 pr-5 text-right">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {products.map((product) => {
              const status = getStockStatus(product.quantity, product.lowStockThreshold);
              const statusLabel = getStockStatusLabel(status);
              const statusColorClass =
                status === 'out_of_stock'
                  ? 'text-red-700 font-medium'
                  : status === 'low_stock'
                    ? 'text-amber-700 font-medium'
                    : 'text-emerald-700 font-medium';

              return (
                <tr
                  key={product.id}
                  className="hover:bg-slate-50/80 transition-colors"
                >
                  <td className="py-3 pl-5 pr-3">
                    <div className="flex items-center gap-3.5 min-w-[240px]">
                      <ProductThumbnail src={product.imageUrl} alt={product.name} size="md" />
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900 truncate max-w-xs">
                          {product.name}
                        </p>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">
                          {product.sku}
                          <span aria-hidden="true"> · </span>
                          Ngưỡng cảnh báo: {product.lowStockThreshold}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right whitespace-nowrap">
                    <span
                      className={`font-mono text-base font-semibold tabular-nums ${
                        status === 'out_of_stock'
                          ? 'text-red-700'
                          : status === 'low_stock'
                            ? 'text-amber-700'
                            : 'text-slate-900'
                      }`}
                    >
                      {product.quantity.toLocaleString('vi-VN')}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-700 whitespace-nowrap">
                    {product.unit}
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <span className={`text-xs ${statusColorClass}`}>
                      {statusLabel}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono text-xs text-slate-600 whitespace-nowrap tabular-nums">
                    {formatVnDate(product.lastImportDate)}
                  </td>
                  <td className="py-3 px-3 font-mono text-xs text-slate-600 whitespace-nowrap tabular-nums">
                    {formatVnDate(product.lastExportDate)}
                  </td>
                  <td className="py-3 pl-3 pr-5 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onQuickImport(product)}
                        aria-label={`Nhập thêm ${product.name}`}
                        className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:border-blue-300 hover:text-blue-700 transition-colors whitespace-nowrap shrink-0"
                      >
                        <ArrowDownToLine className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Nhập</span>
                      </button>
                      <button
                        type="button"
                        disabled={product.quantity <= 0}
                        onClick={() => onQuickExport(product)}
                        aria-label={`Xuất kho ${product.name}`}
                        className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:border-slate-400 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap shrink-0"
                      >
                        <ArrowUpFromLine className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Xuất</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
