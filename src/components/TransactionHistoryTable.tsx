import { ArrowDownLeft, ArrowUpRight, ClipboardList } from 'lucide-react';
import {
  formatVnDate,
  type InventoryTransaction,
} from '../utils/inventoryLogic';
import { ProductThumbnail } from './ProductThumbnail';

interface TransactionHistoryTableProps {
  transactions: InventoryTransaction[];
  isLoading: boolean;
  hasActiveFilter: boolean;
  onResetFilters: () => void;
}

export function TransactionHistoryTable({
  transactions,
  isLoading,
  hasActiveFilter,
  onResetFilters,
}: TransactionHistoryTableProps) {
  if (isLoading) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="divide-y divide-slate-100">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center justify-between px-5 py-3.5 animate-pulse">
              <div className="flex items-center gap-3.5">
                <div className="h-9 w-9 rounded-md bg-slate-200" />
                <div className="space-y-2">
                  <div className="h-4 w-52 rounded bg-slate-200" />
                  <div className="h-3 w-32 rounded bg-slate-100" />
                </div>
              </div>
              <div className="h-4 w-24 rounded bg-slate-200" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl px-6 py-14 text-center">
        <div className="mx-auto h-12 w-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 mb-3">
          <ClipboardList className="h-6 w-6" aria-hidden="true" />
        </div>
        <h3 className="text-base font-semibold text-slate-900">
          {hasActiveFilter ? 'Không tìm thấy phiếu giao dịch phù hợp' : 'Chưa có lịch sử xuất nhập kho'}
        </h3>
        <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
          {hasActiveFilter
            ? 'Thử điều chỉnh từ khóa tìm kiếm hoặc chọn loại phiếu khác.'
            : 'Mọi phiếu nhập và xuất kho sẽ được lưu lại tại đây theo thứ tự thời gian.'}
        </p>
        {hasActiveFilter && (
          <div className="mt-5">
            <button
              type="button"
              onClick={onResetFilters}
              className="h-10 px-4 rounded-lg border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Xóa bộ lọc
            </button>
          </div>
        )}
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
                Mã phiếu
              </th>
              <th scope="col" className="py-3 px-3">
                Loại
              </th>
              <th scope="col" className="py-3 px-3">
                Sản phẩm
              </th>
              <th scope="col" className="py-3 px-3">
                Nhân viên / Ghi chú
              </th>
              <th scope="col" className="py-3 px-3 text-right">
                Số lượng
              </th>
              <th scope="col" className="py-3 px-3">
                Đơn vị tính
              </th>
              <th scope="col" className="py-3 px-3">
                Ngày thực hiện
              </th>
              <th scope="col" className="py-3 pl-3 pr-5 text-right">
                Tồn sau phiếu
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {transactions.map((tx) => {
              const isImport = tx.type === 'import';
              return (
                <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 pl-5 pr-3 font-mono text-xs font-medium text-slate-700 whitespace-nowrap">
                    {tx.code}
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-medium ${
                        isImport ? 'text-emerald-700' : 'text-blue-700'
                      }`}
                    >
                      {isImport ? (
                        <ArrowDownLeft className="h-3.5 w-3.5" aria-hidden="true" />
                      ) : (
                        <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                      )}
                      <span>{isImport ? 'Nhập kho' : 'Xuất kho'}</span>
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2.5 min-w-[210px]">
                      <ProductThumbnail src={tx.productImageUrl} alt={tx.productName} size="sm" />
                      <span className="font-medium text-slate-900 truncate max-w-[280px] xl:max-w-none">
                        {tx.productName}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <div className="min-w-[160px]">
                      <p className="text-slate-800 font-medium">
                        {tx.employeeName ? tx.employeeName : 'Nhập hệ thống'}
                      </p>
                      {tx.note && (
                        <p className="text-xs text-slate-500 truncate max-w-[220px]">
                          {tx.note}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right whitespace-nowrap">
                    <span
                      className={`font-mono font-semibold tabular-nums ${
                        isImport ? 'text-emerald-700' : 'text-slate-900'
                      }`}
                    >
                      {isImport ? '+' : '-'}
                      {tx.quantity.toLocaleString('vi-VN')}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-700 whitespace-nowrap">
                    {tx.unit}
                  </td>
                  <td className="py-3 px-3 font-mono text-xs text-slate-600 whitespace-nowrap tabular-nums">
                    {formatVnDate(tx.date)}
                  </td>
                  <td className="py-3 pl-3 pr-5 text-right font-mono text-xs font-medium text-slate-700 whitespace-nowrap tabular-nums">
                    {tx.balanceAfter.toLocaleString('vi-VN')} {tx.unit}
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
