// import { useEffect, useState, type FormEvent } from 'react';
// import { X, AlertCircle } from 'lucide-react';
// import {
//   validateExportPayload,
//   type ExportPayload,
//   type Product,
// } from '../utils/inventoryLogic';
// import { ProductThumbnail } from './ProductThumbnail';

// interface ExportModalProps {
//   isOpen: boolean;
//   products: Product[];
//   initialProduct?: Product | null;
//   todayStr: string;
//   onClose: () => void;
//   onSuccess: (data: {
//     product: Product;
//     products: Product[];
//     transactions: any[];
//     message: string;
//   }) => void;
// }

// const SUGGESTED_EMPLOYEES = [
//   'Nguyễn Hoàng Nam',
//   'Trần Thị Thu Hà',
//   'Lê Minh Tuấn',
//   'Phạm Quốc Bảo',
//   'Vũ Ngọc Anh',
// ];

// export function ExportModal({
//   isOpen,
//   products,
//   initialProduct,
//   todayStr,
//   onClose,
//   onSuccess,
// }: ExportModalProps) {
//   const availableProducts = products.filter((p) => p.quantity > 0);
//   const [productId, setProductId] = useState('');
//   const [employeeName, setEmployeeName] = useState('');
//   const [quantity, setQuantity] = useState('1');
//   const [unit, setUnit] = useState('');
//   const [exportDate, setExportDate] = useState(todayStr);
//   const [note, setNote] = useState('');
//   const [error, setError] = useState<string | null>(null);
//   const [isSubmitting, setIsSubmitting] = useState(false);

//   useEffect(() => {
//     if (!isOpen) return;
//     setError(null);
//     setEmployeeName('');
//     setQuantity('1');
//     setNote('');
//     setExportDate(todayStr);

//     const target =
//       initialProduct && initialProduct.quantity > 0
//         ? initialProduct
//         : availableProducts[0] ?? products[0] ?? null;

//     if (target) {
//       setProductId(target.id);
//       setUnit(target.unit);
//     } else {
//       setProductId('');
//       setUnit('');
//     }
//   }, [isOpen, initialProduct, todayStr]);

//   if (!isOpen) return null;

//   const selectedProduct = products.find((p) => p.id === productId) ?? null;
//   const parsedQty = Number(quantity);
//   const remainingPreview =
//     selectedProduct && Number.isFinite(parsedQty) && parsedQty > 0
//       ? selectedProduct.quantity - parsedQty
//       : null;

//   const handleProductChange = (nextId: string) => {
//     setProductId(nextId);
//     const found = products.find((p) => p.id === nextId);
//     if (found) {
//       setUnit(found.unit);
//     }
//     setError(null);
//   };

//   const handleSubmit = async (e: FormEvent) => {
//     e.preventDefault();
//     setError(null);

//     const payload: ExportPayload = {
//       productId,
//       employeeName,
//       quantity: Number(quantity),
//       unit,
//       exportDate,
//       note: note.trim() || undefined,
//     };

//     const validation = validateExportPayload(payload, products);
//     if (!validation.ok) {
//       setError(validation.error);
//       return;
//     }

//     setIsSubmitting(true);
//     try {
//       const res = await fetch('/api/export', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(validation.data),
//       });
//       const json = await res.json();
//       if (!res.ok) {
//         setError(json.error || 'Không thể lưu phiếu xuất kho.');
//         return;
//       }
//       onSuccess({
//         product: json.product,
//         products: json.products,
//         transactions: json.transactions,
//         message: `Đã xuất -${validation.data.quantity} ${validation.data.unit} "${json.product.name}" cho ${validation.data.employeeName}.`,
//       });
//       onClose();
//     } catch {
//       setError('Mất kết nối tới máy chủ. Vui lòng thử lại.');
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   return (
//     <div
//       className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 overflow-y-auto"
//       role="dialog"
//       aria-modal="true"
//       aria-labelledby="export-modal-title"
//     >
//       <div className="w-full max-w-lg rounded-xl bg-white border border-slate-200 shadow-xl overflow-hidden my-auto">
//         <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
//           <div>
//             <h2 id="export-modal-title" className="text-lg font-semibold text-slate-900">
//               Lập phiếu xuất kho
//             </h2>
//             <p className="text-xs text-slate-500 mt-0.5">
//               Xuất hàng cho nhân viên và cập nhật tồn kho theo thời gian thực
//             </p>
//           </div>
//           <button
//             type="button"
//             onClick={onClose}
//             aria-label="Đóng cửa sổ xuất kho"
//             className="h-9 w-9 inline-flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors focus-visible:outline-2 focus-visible:outline-blue-600"
//           >
//             <X className="h-5 w-5" aria-hidden="true" />
//           </button>
//         </div>

//         <form onSubmit={handleSubmit} className="p-6 space-y-4">
//           {error && (
//             <div
//               role="alert"
//               className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700"
//             >
//               <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
//               <span>{error}</span>
//             </div>
//           )}

//           <div>
//             <label
//               htmlFor="export-product-select"
//               className="block text-sm font-medium text-slate-800 mb-1.5"
//             >
//               Chọn sản phẩm xuất <span className="text-red-600">*</span>
//             </label>
//             <select
//               id="export-product-select"
//               required
//               value={productId}
//               onChange={(e) => handleProductChange(e.target.value)}
//               className="w-full h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
//             >
//               {products.length === 0 ? (
//                 <option value="">Kho hiện chưa có sản phẩm nào</option>
//               ) : (
//                 products.map((p) => (
//                   <option key={p.id} value={p.id} disabled={p.quantity <= 0}>
//                     {p.name} — Tồn: {p.quantity} {p.unit}
//                     {p.quantity <= 0 ? ' (Hết hàng)' : ''}
//                   </option>
//                 ))
//               )}
//             </select>
//           </div>

//           {selectedProduct && (
//             <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5">
//               <div className="flex items-center gap-3 min-w-0">
//                 <ProductThumbnail
//                   src={selectedProduct.imageUrl}
//                   alt={selectedProduct.name}
//                   size="sm"
//                 />
//                 <div className="min-w-0">
//                   <p className="text-sm font-medium text-slate-900 truncate">
//                     {selectedProduct.name}
//                   </p>
//                   <p className="text-xs text-slate-500 font-mono">
//                     {selectedProduct.sku} · Hiện tồn: {selectedProduct.quantity} {selectedProduct.unit}
//                   </p>
//                 </div>
//               </div>
//               {remainingPreview !== null && (
//                 <div className="text-right shrink-0">
//                   <p className="text-xs text-slate-500">Tồn sau xuất</p>
//                   <p
//                     className={`text-sm font-mono font-semibold tabular-nums ${
//                       remainingPreview < 0
//                         ? 'text-red-600'
//                         : remainingPreview <= selectedProduct.lowStockThreshold
//                           ? 'text-amber-700'
//                           : 'text-emerald-700'
//                     }`}
//                   >
//                     {remainingPreview} {selectedProduct.unit}
//                   </p>
//                 </div>
//               )}
//             </div>
//           )}

//           <div>
//             <label
//               htmlFor="export-employee-name"
//               className="block text-sm font-medium text-slate-800 mb-1.5"
//             >
//               Tên nhân viên nhận / xuất kho <span className="text-red-600">*</span>
//             </label>
//             <input
//               id="export-employee-name"
//               type="text"
//               required
//               list="employee-suggestions"
//               value={employeeName}
//               onChange={(e) => setEmployeeName(e.target.value)}
//               placeholder="Lâm"
//               className="w-full h-10 rounded-lg border border-slate-300 px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
//             />
//             <datalist id="employee-suggestions">
//               {SUGGESTED_EMPLOYEES.map((name) => (
//                 <option key={name} value={name} />
//               ))}
//             </datalist>
//           </div>

//           <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
//             <div>
//               <label
//                 htmlFor="export-quantity"
//                 className="block text-sm font-medium text-slate-800 mb-1.5"
//               >
//                 Số lượng xuất <span className="text-red-600">*</span>
//               </label>
//               <input
//                 id="export-quantity"
//                 type="number"
//                 min={1}
//                 step={1}
//                 required
//                 value={quantity}
//                 onChange={(e) => setQuantity(e.target.value)}
//                 className="w-full h-10 rounded-lg border border-slate-300 px-3 text-sm font-mono tabular-nums text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
//               />
//             </div>

//             <div>
//               <label
//                 htmlFor="export-unit"
//                 className="block text-sm font-medium text-slate-800 mb-1.5"
//               >
//                 Đơn vị tính <span className="text-red-600">*</span>
//               </label>
//               <input
//                 id="export-unit"
//                 type="text"
//                 required
//                 value={unit}
//                 onChange={(e) => setUnit(e.target.value)}
//                 placeholder="Cái"
//                 className="w-full h-10 rounded-lg border border-slate-300 bg-slate-50 px-3 text-sm text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
//               />
//             </div>

//             <div>
//               <label
//                 htmlFor="export-date"
//                 className="block text-sm font-medium text-slate-800 mb-1.5"
//               >
//                 Ngày xuất <span className="text-red-600">*</span>
//               </label>
//               <input
//                 id="export-date"
//                 type="date"
//                 required
//                 value={exportDate}
//                 onChange={(e) => setExportDate(e.target.value)}
//                 className="w-full h-10 rounded-lg border border-slate-300 px-3 text-sm font-mono text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
//               />
//             </div>
//           </div>

//           <div>
//             <label
//               htmlFor="export-note"
//               className="block text-sm font-medium text-slate-800 mb-1.5"
//             >
//               Lý do / Bộ phận nhận
//             </label>
//             <input
//               id="export-note"
//               type="text"
//               value={note}
//               onChange={(e) => setNote(e.target.value)}
//               placeholder="Ví dụ: Cấp phát tổ sản xuất A"
//               className="w-full h-10 rounded-lg border border-slate-300 px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
//             />
//           </div>

//           <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
//             <button
//               type="button"
//               onClick={onClose}
//               className="h-10 px-4 rounded-lg border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
//             >
//               Hủy
//             </button>
//             <button
//               type="submit"
//               disabled={isSubmitting || availableProducts.length === 0}
//               className="h-10 px-5 rounded-lg bg-slate-900 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50 transition-colors whitespace-nowrap shrink-0"
//             >
//               {isSubmitting ? 'Đang xử lý...' : 'Xác nhận xuất kho'}
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }

import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { X, AlertCircle, Search, ChevronDown } from 'lucide-react';
import {
  validateExportPayload,
  type ExportPayload,
  type Product,
} from '../utils/inventoryLogic';
import { ProductThumbnail } from './ProductThumbnail';

interface ExportModalProps {
  isOpen: boolean;
  products: Product[];
  initialProduct?: Product | null;
  todayStr: string;
  onClose: () => void;
  onSuccess: (data: {
    product: Product;
    products: Product[];
    transactions: any[];
    message: string;
  }) => void;
}

const SUGGESTED_EMPLOYEES = [
  'Lâm',
  'Phong',
  'Thái',
  'Tưởng',
  'Tài',
  "Phát",
  "Phi"
];

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function ExportModal({
  isOpen,
  products,
  initialProduct,
  todayStr,
  onClose,
  onSuccess,
}: ExportModalProps) {
  const availableProducts = products.filter((p) => p.quantity > 0);
  const [productId, setProductId] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [employeeName, setEmployeeName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('');
  const [exportDate, setExportDate] = useState(todayStr);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dropdownContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setEmployeeName('');
    setQuantity('1');
    setNote('');
    setExportDate(todayStr);
    setProductSearch('');
    setIsDropdownOpen(false);

    const target =
      initialProduct && initialProduct.quantity > 0
        ? initialProduct
        : availableProducts[0] ?? products[0] ?? null;

    if (target) {
      setProductId(target.id);
      setUnit(target.unit);
    } else {
      setProductId('');
      setUnit('');
    }
  }, [isOpen, initialProduct, todayStr]);

  useEffect(() => {
    if (!isDropdownOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownContainerRef.current &&
        !dropdownContainerRef.current.contains(e.target as Node)
      ) {
        setIsDropdownOpen(false);
        setProductSearch('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen]);

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === productId) ?? null,
    [products, productId]
  );

  const filteredProducts = useMemo(() => {
    const keyword = normalizeText(productSearch);
    if (!keyword) return products;
    return products.filter(
      (p) =>
        normalizeText(p.name).includes(keyword) ||
        normalizeText(p.sku || '').includes(keyword)
    );
  }, [products, productSearch]);

  if (!isOpen) return null;

  const parsedQty = Number(quantity);
  const remainingPreview =
    selectedProduct && Number.isFinite(parsedQty) && parsedQty > 0
      ? selectedProduct.quantity - parsedQty
      : null;

  const handleSelectProduct = (product: Product) => {
    if (product.quantity <= 0) return;
    setProductId(product.id);
    setUnit(product.unit);
    setProductSearch('');
    setIsDropdownOpen(false);
    setError(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const payload: ExportPayload = {
      productId,
      employeeName,
      quantity: Number(quantity),
      unit,
      exportDate,
      note: note.trim() || undefined,
    };

    const validation = validateExportPayload(payload, products);
    if (!validation.ok) {
      setError(validation.error);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validation.data),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || 'Không thể lưu phiếu xuất kho.');
        return;
      }
      onSuccess({
        product: json.product,
        products: json.products,
        transactions: json.transactions,
        message: `Đã xuất -${validation.data.quantity} ${validation.data.unit} "${json.product.name}" cho ${validation.data.employeeName}.`,
      });
      onClose();
    } catch {
      setError('Mất kết nối tới máy chủ. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedDisplayText = selectedProduct
    ? `${selectedProduct.name} — Tồn: ${selectedProduct.quantity} ${selectedProduct.unit}`
    : '';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-modal-title"
    >
      <div className="w-full max-w-lg rounded-xl bg-white border border-slate-200 shadow-xl overflow-hidden my-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h2 id="export-modal-title" className="text-lg font-semibold text-slate-900">
              Lập phiếu xuất kho
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Xuất hàng cho nhân viên và cập nhật tồn kho theo thời gian thực
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng cửa sổ xuất kho"
            className="h-9 w-9 inline-flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors focus-visible:outline-2 focus-visible:outline-blue-600"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700"
            >
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          <div ref={dropdownContainerRef} className="relative">
            <label
              htmlFor="export-product-search"
              className="block text-sm font-medium text-slate-800 mb-1.5"
            >
              Chọn sản phẩm xuất <span className="text-red-600">*</span>
            </label>

            {/* Input ẩn giữ ràng buộc required cho form khi chưa chọn sản phẩm */}
            <input
              tabIndex={-1}
              autoComplete="off"
              value={productId}
              onChange={() => {}}
              required
              aria-hidden="true"
              className="sr-only"
            />

            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
                aria-hidden="true"
              />
              <input
                id="export-product-search"
                type="text"
                autoComplete="off"
                disabled={products.length === 0}
                placeholder={
                  products.length === 0
                    ? 'Kho hiện chưa có sản phẩm nào'
                    : 'Gõ tên hoặc mã SKU để tìm sản phẩm...'
                }
                value={isDropdownOpen ? productSearch : selectedDisplayText}
                onFocus={() => {
                  if (products.length === 0) return;
                  setIsDropdownOpen(true);
                  setProductSearch('');
                }}
                onChange={(e) => {
                  setProductSearch(e.target.value);
                  if (!isDropdownOpen) {
                    setIsDropdownOpen(true);
                  }
                }}
                className="w-full h-10 rounded-lg border border-slate-300 bg-white pl-9 pr-9 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 disabled:bg-slate-100 disabled:text-slate-500"
              />
              <button
                type="button"
                disabled={products.length === 0}
                onClick={() => {
                  setIsDropdownOpen((prev) => {
                    const next = !prev;
                    if (next) setProductSearch('');
                    return next;
                  });
                }}
                aria-label="Mở hoặc đóng danh sách sản phẩm"
                className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400 hover:text-slate-600 disabled:opacity-50"
              >
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${
                    isDropdownOpen ? 'rotate-180' : ''
                  }`}
                  aria-hidden="true"
                />
              </button>
            </div>

            {isDropdownOpen && products.length > 0 && (
              <ul
                role="listbox"
                aria-label="Danh sách sản phẩm"
                className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-slate-200 bg-white py-1 text-sm shadow-lg"
              >
                {filteredProducts.length === 0 ? (
                  <li className="px-3 py-2 text-slate-500">
                    Không tìm thấy sản phẩm phù hợp với &ldquo;{productSearch}&rdquo;
                  </li>
                ) : (
                  filteredProducts.map((p) => {
                    const isOutOfStock = p.quantity <= 0;
                    const isSelected = p.id === productId;

                    return (
                      <li
                        key={p.id}
                        role="option"
                        aria-selected={isSelected}
                        aria-disabled={isOutOfStock}
                        onClick={() => handleSelectProduct(p)}
                        className={`px-3 py-2 flex items-center justify-between gap-2 ${
                          isOutOfStock
                            ? 'cursor-not-allowed text-slate-400 bg-slate-50'
                            : isSelected
                              ? 'cursor-pointer bg-blue-50 text-blue-700 font-medium'
                              : 'cursor-pointer text-slate-900 hover:bg-slate-100'
                        }`}
                      >
                        <span className="truncate">
                          {p.name}
                          {p.sku ? (
                            <span className="ml-1.5 font-mono text-xs text-slate-400">
                              ({p.sku})
                            </span>
                          ) : null}
                        </span>
                        <span className="text-xs font-mono shrink-0">
                          Tồn: {p.quantity} {p.unit}
                          {isOutOfStock ? ' (Hết hàng)' : ''}
                        </span>
                      </li>
                    );
                  })
                )}
              </ul>
            )}
          </div>

          {selectedProduct && (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5">
              <div className="flex items-center gap-3 min-w-0">
                <ProductThumbnail
                  src={selectedProduct.imageUrl}
                  alt={selectedProduct.name}
                  size="sm"
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {selectedProduct.name}
                  </p>
                  <p className="text-xs text-slate-500 font-mono">
                    {selectedProduct.sku} · Hiện tồn: {selectedProduct.quantity} {selectedProduct.unit}
                  </p>
                </div>
              </div>
              {remainingPreview !== null && (
                <div className="text-right shrink-0">
                  <p className="text-xs text-slate-500">Tồn sau xuất</p>
                  <p
                    className={`text-sm font-mono font-semibold tabular-nums ${
                      remainingPreview < 0
                        ? 'text-red-600'
                        : remainingPreview <= selectedProduct.lowStockThreshold
                          ? 'text-amber-700'
                          : 'text-emerald-700'
                    }`}
                  >
                    {remainingPreview} {selectedProduct.unit}
                  </p>
                </div>
              )}
            </div>
          )}

          <div>
            <label
              htmlFor="export-employee-name"
              className="block text-sm font-medium text-slate-800 mb-1.5"
            >
              Tên nhân viên nhận / xuất kho <span className="text-red-600">*</span>
            </label>
            <input
              id="export-employee-name"
              type="text"
              required
              list="employee-suggestions"
              value={employeeName}
              onChange={(e) => setEmployeeName(e.target.value)}
              placeholder="Ví dụ: Nguyễn Văn Minh"
              className="w-full h-10 rounded-lg border border-slate-300 px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
            <datalist id="employee-suggestions">
              {SUGGESTED_EMPLOYEES.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label
                htmlFor="export-quantity"
                className="block text-sm font-medium text-slate-800 mb-1.5"
              >
                Số lượng xuất <span className="text-red-600">*</span>
              </label>
              <input
                id="export-quantity"
                type="number"
                min={1}
                step={1}
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full h-10 rounded-lg border border-slate-300 px-3 text-sm font-mono tabular-nums text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>

            <div>
              <label
                htmlFor="export-unit"
                className="block text-sm font-medium text-slate-800 mb-1.5"
              >
                Đơn vị tính <span className="text-red-600">*</span>
              </label>
              <input
                id="export-unit"
                type="text"
                required
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="Cái"
                className="w-full h-10 rounded-lg border border-slate-300 bg-slate-50 px-3 text-sm text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>

            <div>
              <label
                htmlFor="export-date"
                className="block text-sm font-medium text-slate-800 mb-1.5"
              >
                Ngày xuất <span className="text-red-600">*</span>
              </label>
              <input
                id="export-date"
                type="date"
                required
                value={exportDate}
                onChange={(e) => setExportDate(e.target.value)}
                className="w-full h-10 rounded-lg border border-slate-300 px-3 text-sm font-mono text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="export-note"
              className="block text-sm font-medium text-slate-800 mb-1.5"
            >
              Lý do / Bộ phận nhận
            </label>
            <input
              id="export-note"
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ví dụ: Cấp phát tổ sản xuất A"
              className="w-full h-10 rounded-lg border border-slate-300 px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="h-10 px-4 rounded-lg border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting || availableProducts.length === 0}
              className="h-10 px-5 rounded-lg bg-slate-900 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50 transition-colors whitespace-nowrap shrink-0"
            >
              {isSubmitting ? 'Đang xử lý...' : 'Xác nhận xuất kho'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
