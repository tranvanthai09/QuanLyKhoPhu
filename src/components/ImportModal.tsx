// import { useEffect, useState, type FormEvent, type ChangeEvent } from 'react';
// import { Upload, X, AlertCircle } from 'lucide-react';
// import {
//   STANDARD_UNITS,
//   validateImportPayload,
//   type ImportPayload,
//   type Product,
// } from '../utils/inventoryLogic';
// import { PRESET_PRODUCT_IMAGES } from '../utils/seedData';
// import { ProductThumbnail } from './ProductThumbnail';

// interface ImportModalProps {
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

// export function ImportModal({
//   isOpen,
//   products,
//   initialProduct,
//   todayStr,
//   onClose,
//   onSuccess,
// }: ImportModalProps) {
//   const [productName, setProductName] = useState('');
//   const [imageUrl, setImageUrl] = useState<string>(PRESET_PRODUCT_IMAGES[0].url);
//   const [quantity, setQuantity] = useState('10');
//   const [unit, setUnit] = useState('Cái');
//   const [customUnit, setCustomUnit] = useState('');
//   const [importDate, setImportDate] = useState(todayStr);
//   const [note, setNote] = useState('');
//   const [error, setError] = useState<string | null>(null);
//   const [isUploadingImage, setIsUploadingImage] = useState(false);
//   const [isSubmitting, setIsSubmitting] = useState(false);

//   useEffect(() => {
//     if (!isOpen) return;
//     setError(null);
//     setNote('');
//     setImportDate(todayStr);
//     if (initialProduct) {
//       setProductName(initialProduct.name);
//       setImageUrl(initialProduct.imageUrl || PRESET_PRODUCT_IMAGES[0].url);
//       setQuantity('10');
//       const isStandard = (STANDARD_UNITS as readonly string[]).includes(initialProduct.unit);
//       if (isStandard) {
//         setUnit(initialProduct.unit);
//         setCustomUnit('');
//       } else {
//         setUnit('__custom__');
//         setCustomUnit(initialProduct.unit);
//       }
//     } else {
//       setProductName('');
//       setImageUrl(PRESET_PRODUCT_IMAGES[0].url);
//       setQuantity('10');
//       setUnit('Cái');
//       setCustomUnit('');
//     }
//   }, [isOpen, initialProduct, todayStr]);

//   if (!isOpen) return null;

//   const effectiveUnit = unit === '__custom__' ? customUnit.trim() : unit;

//   const handleSelectExisting = (prodId: string) => {
//     const found = products.find((p) => p.id === prodId);
//     if (!found) return;
//     setProductName(found.name);
//     if (found.imageUrl) {
//       setImageUrl(found.imageUrl);
//     }
//     const isStandard = (STANDARD_UNITS as readonly string[]).includes(found.unit);
//     if (isStandard) {
//       setUnit(found.unit);
//       setCustomUnit('');
//     } else {
//       setUnit('__custom__');
//       setCustomUnit(found.unit);
//     }
//     setError(null);
//   };

//   const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (!file) return;
//     if (!file.type.startsWith('image/')) {
//       setError('Vui lòng chọn tệp hình ảnh hợp lệ (PNG, JPG, WEBP).');
//       return;
//     }
//     if (file.size > 2 * 1024 * 1024) {
//       setError('Kích thước ảnh tải lên tối đa 2MB.');
//       return;
//     }

//     setError(null);
//     setIsUploadingImage(true);
//     try {
//       const dataUrl = await new Promise<string>((resolve, reject) => {
//         const reader = new FileReader();
//         reader.onload = () => resolve(String(reader.result || ''));
//         reader.onerror = () => reject(new Error('Không thể đọc tệp ảnh.'));
//         reader.readAsDataURL(file);
//       });

//       const res = await fetch('/api/upload-image', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ filename: file.name, dataUrl }),
//       });
//       const json = await res.json();
//       if (!res.ok) {
//         setError(json.error || 'Tải ảnh lên thất bại.');
//         return;
//       }
//       setImageUrl(json.url);
//     } catch {
//       setError('Không thể tải ảnh lên máy chủ. Vui lòng thử lại.');
//     } finally {
//       setIsUploadingImage(false);
//     }
//   };

//   const handleSubmit = async (e: FormEvent) => {
//     e.preventDefault();
//     setError(null);

//     const payload: ImportPayload = {
//       productName,
//       imageUrl,
//       quantity: Number(quantity),
//       unit: effectiveUnit,
//       importDate,
//       note: note.trim() || undefined,
//     };

//     const validation = validateImportPayload(payload);
//     if (!validation.ok) {
//       setError(validation.error);
//       return;
//     }

//     setIsSubmitting(true);
//     try {
//       const res = await fetch('/api/import', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(validation.data),
//       });
//       const json = await res.json();
//       if (!res.ok) {
//         setError(json.error || 'Không thể lưu phiếu nhập kho.');
//         return;
//       }
//       onSuccess({
//         product: json.product,
//         products: json.products,
//         transactions: json.transactions,
//         message: `Đã nhập +${validation.data.quantity} ${validation.data.unit} "${json.product.name}" vào kho.`,
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
//       aria-labelledby="import-modal-title"
//     >
//       <div className="w-full max-w-lg rounded-xl bg-white border border-slate-200 shadow-xl overflow-hidden my-auto">
//         <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
//           <div>
//             <h2 id="import-modal-title" className="text-lg font-semibold text-slate-900">
//               Lập phiếu nhập kho
//             </h2>
//             <p className="text-xs text-slate-500 mt-0.5">
//               Thêm sản phẩm mới hoặc nhập bổ sung vào tồn kho hiện tại
//             </p>
//           </div>
//           <button
//             type="button"
//             onClick={onClose}
//             aria-label="Đóng cửa sổ nhập kho"
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

//           {products.length > 0 && !initialProduct && (
//             <div>
//               <label
//                 htmlFor="import-existing-select"
//                 className="block text-xs font-medium text-slate-600 mb-1.5"
//               >
//                 Chọn nhanh sản phẩm có sẵn (hoặc nhập tên mới bên dưới)
//               </label>
//               <select
//                 id="import-existing-select"
//                 defaultValue=""
//                 onChange={(e) => handleSelectExisting(e.target.value)}
//                 className="w-full h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
//               >
//                 <option value="">-- Tạo sản phẩm mới --</option>
//                 {products.map((p) => (
//                   <option key={p.id} value={p.id}>
//                     {p.name} (Hiện tồn: {p.quantity} {p.unit})
//                   </option>
//                 ))}
//               </select>
//             </div>
//           )}

//           <div>
//             <label
//               htmlFor="import-product-name"
//               className="block text-sm font-medium text-slate-800 mb-1.5"
//             >
//               Tên sản phẩm <span className="text-red-600">*</span>
//             </label>
//             <input
//               id="import-product-name"
//               type="text"
//               required
//               value={productName}
//               onChange={(e) => setProductName(e.target.value)}
//               placeholder="Ví dụ: Máy khoan động lực không dây 18V"
//               className="w-full h-10 rounded-lg border border-slate-300 px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
//             />
//           </div>

//           <div>
//             <span className="block text-sm font-medium text-slate-800 mb-1.5">
//               Hình ảnh sản phẩm
//             </span>
//             <div className="flex items-start gap-4">
//               <ProductThumbnail src={imageUrl} alt={productName || 'Xem trước sản phẩm'} size="lg" />
//               <div className="flex-1 min-w-0 space-y-2">
//                 <div className="flex flex-wrap items-center gap-2">
//                   <label
//                     htmlFor="import-image-file"
//                     className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors"
//                   >
//                     <Upload className="h-3.5 w-3.5" aria-hidden="true" />
//                     <span>{isUploadingImage ? 'Đang tải ảnh...' : 'Tải ảnh từ máy'}</span>
//                   </label>
//                   <input
//                     id="import-image-file"
//                     type="file"
//                     accept="image/png,image/jpeg,image/webp,image/gif"
//                     onChange={handleFileUpload}
//                     disabled={isUploadingImage}
//                     className="sr-only"
//                   />
//                   <span className="text-xs text-slate-500">hoặc chọn mẫu nhanh:</span>
//                 </div>

//                 <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
//                   {PRESET_PRODUCT_IMAGES.map((preset) => {
//                     const selected = imageUrl === preset.url;
//                     return (
//                       <button
//                         key={preset.url}
//                         type="button"
//                         onClick={() => setImageUrl(preset.url)}
//                         aria-label={`Chọn ảnh mẫu ${preset.label}`}
//                         title={preset.label}
//                         className={`rounded-md p-0.5 border transition-colors ${
//                           selected
//                             ? 'border-blue-600 ring-1 ring-blue-600'
//                             : 'border-slate-200 hover:border-slate-400'
//                         }`}
//                       >
//                         <img
//                           src={preset.url}
//                           alt={preset.label}
//                           className="h-8 w-8 rounded object-cover"
//                         />
//                       </button>
//                     );
//                   })}
//                 </div>

//                 <input
//                   id="import-image-url"
//                   type="text"
//                   aria-label="Đường dẫn URL hình ảnh sản phẩm"
//                   value={imageUrl}
//                   onChange={(e) => setImageUrl(e.target.value)}
//                   placeholder="Hoặc dán đường dẫn URL hình ảnh..."
//                   className="w-full h-8 rounded-md border border-slate-200 px-2.5 text-xs text-slate-700 font-mono placeholder:text-slate-400 focus:border-blue-600 focus:outline-none"
//                 />
//               </div>
//             </div>
//           </div>

//           <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
//             <div>
//               <label
//                 htmlFor="import-quantity"
//                 className="block text-sm font-medium text-slate-800 mb-1.5"
//               >
//                 Số lượng <span className="text-red-600">*</span>
//               </label>
//               <input
//                 id="import-quantity"
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
//                 htmlFor="import-unit"
//                 className="block text-sm font-medium text-slate-800 mb-1.5"
//               >
//                 Đơn vị tính <span className="text-red-600">*</span>
//               </label>
//               <select
//                 id="import-unit"
//                 value={unit}
//                 onChange={(e) => setUnit(e.target.value)}
//                 className="w-full h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
//               >
//                 {STANDARD_UNITS.map((u) => (
//                   <option key={u} value={u}>
//                     {u}
//                   </option>
//                 ))}
//                 <option value="__custom__">Đơn vị khác...</option>
//               </select>
//             </div>

//             <div>
//               <label
//                 htmlFor="import-date"
//                 className="block text-sm font-medium text-slate-800 mb-1.5"
//               >
//                 Ngày nhập <span className="text-red-600">*</span>
//               </label>
//               <input
//                 id="import-date"
//                 type="date"
//                 required
//                 value={importDate}
//                 onChange={(e) => setImportDate(e.target.value)}
//                 className="w-full h-10 rounded-lg border border-slate-300 px-3 text-sm font-mono text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
//               />
//             </div>
//           </div>

//           {unit === '__custom__' && (
//             <div>
//               <label
//                 htmlFor="import-custom-unit"
//                 className="block text-sm font-medium text-slate-800 mb-1.5"
//               >
//                 Nhập đơn vị tính tùy chỉnh <span className="text-red-600">*</span>
//               </label>
//               <input
//                 id="import-custom-unit"
//                 type="text"
//                 required
//                 value={customUnit}
//                 onChange={(e) => setCustomUnit(e.target.value)}
//                 placeholder="Ví dụ: Pallet, Lít, Kiện"
//                 className="w-full h-10 rounded-lg border border-slate-300 px-3 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
//               />
//             </div>
//           )}

//           <div>
//             <label
//               htmlFor="import-note"
//               className="block text-sm font-medium text-slate-800 mb-1.5"
//             >
//               Ghi chú nhập kho
//             </label>
//             <input
//               id="import-note"
//               type="text"
//               value={note}
//               onChange={(e) => setNote(e.target.value)}
//               placeholder="Nhà cung cấp, số lô hoặc ghi chú kiểm nhận..."
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
//               disabled={isSubmitting || isUploadingImage}
//               className="h-10 px-5 rounded-lg bg-blue-700 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-50 transition-colors whitespace-nowrap shrink-0"
//             >
//               {isSubmitting ? 'Đang lưu...' : 'Xác nhận nhập kho'}
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ChangeEvent,
} from 'react';
import { Upload, X, AlertCircle, Search, ChevronDown } from 'lucide-react';
import {
  STANDARD_UNITS,
  validateImportPayload,
  type ImportPayload,
  type Product,
} from '../utils/inventoryLogic';
import { PRESET_PRODUCT_IMAGES } from '../utils/seedData';
import { ProductThumbnail } from './ProductThumbnail';

interface ImportModalProps {
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

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function ImportModal({
  isOpen,
  products,
  initialProduct,
  todayStr,
  onClose,
  onSuccess,
}: ImportModalProps) {
  const [productName, setProductName] = useState('');
  const [selectedExistingId, setSelectedExistingId] = useState('');
  const [existingSearch, setExistingSearch] = useState('');
  const [isExistingDropdownOpen, setIsExistingDropdownOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>(PRESET_PRODUCT_IMAGES[0].url);
  const [quantity, setQuantity] = useState('10');
  const [unit, setUnit] = useState('Cái');
  const [customUnit, setCustomUnit] = useState('');
  const [importDate, setImportDate] = useState(todayStr);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const existingDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setNote('');
    setImportDate(todayStr);
    setSelectedExistingId('');
    setExistingSearch('');
    setIsExistingDropdownOpen(false);

    if (initialProduct) {
      setProductName(initialProduct.name);
      setImageUrl(initialProduct.imageUrl || PRESET_PRODUCT_IMAGES[0].url);
      setQuantity('10');
      const isStandard = (STANDARD_UNITS as readonly string[]).includes(initialProduct.unit);
      if (isStandard) {
        setUnit(initialProduct.unit);
        setCustomUnit('');
      } else {
        setUnit('__custom__');
        setCustomUnit(initialProduct.unit);
      }
    } else {
      setProductName('');
      setImageUrl(PRESET_PRODUCT_IMAGES[0].url);
      setQuantity('10');
      setUnit('Cái');
      setCustomUnit('');
    }
  }, [isOpen, initialProduct, todayStr]);

  useEffect(() => {
    if (!isExistingDropdownOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        existingDropdownRef.current &&
        !existingDropdownRef.current.contains(e.target as Node)
      ) {
        setIsExistingDropdownOpen(false);
        setExistingSearch('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isExistingDropdownOpen]);

  const selectedExistingProduct = useMemo(
    () => products.find((p) => p.id === selectedExistingId) ?? null,
    [products, selectedExistingId]
  );

  const filteredExistingProducts = useMemo(() => {
    const keyword = normalizeText(existingSearch);
    if (!keyword) return products;
    return products.filter(
      (p) =>
        normalizeText(p.name).includes(keyword) ||
        normalizeText(p.sku || '').includes(keyword)
    );
  }, [products, existingSearch]);

  if (!isOpen) return null;

  const effectiveUnit = unit === '__custom__' ? customUnit.trim() : unit;

  const handleSelectExisting = (prodId: string) => {
    const found = products.find((p) => p.id === prodId);
    if (!found) return;
    setProductName(found.name);
    if (found.imageUrl) {
      setImageUrl(found.imageUrl);
    }
    const isStandard = (STANDARD_UNITS as readonly string[]).includes(found.unit);
    if (isStandard) {
      setUnit(found.unit);
      setCustomUnit('');
    } else {
      setUnit('__custom__');
      setCustomUnit(found.unit);
    }
    setError(null);
  };

  const handlePickExistingProduct = (prodId: string) => {
    setSelectedExistingId(prodId);
    setExistingSearch('');
    setIsExistingDropdownOpen(false);
    if (prodId) {
      handleSelectExisting(prodId);
    } else {
      setError(null);
    }
  };

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Vui lòng chọn tệp hình ảnh hợp lệ (PNG, JPG, WEBP).');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('Kích thước ảnh tải lên tối đa 2MB.');
      return;
    }

    setError(null);
    setIsUploadingImage(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('Không thể đọc tệp ảnh.'));
        reader.readAsDataURL(file);
      });

      const res = await fetch('/api/upload-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, dataUrl }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || 'Tải ảnh lên thất bại.');
        return;
      }
      setImageUrl(json.url);
    } catch {
      setError('Không thể tải ảnh lên máy chủ. Vui lòng thử lại.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const payload: ImportPayload = {
      productName,
      imageUrl,
      quantity: Number(quantity),
      unit: effectiveUnit,
      importDate,
      note: note.trim() || undefined,
    };

    const validation = validateImportPayload(payload);
    if (!validation.ok) {
      setError(validation.error);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validation.data),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || 'Không thể lưu phiếu nhập kho.');
        return;
      }
      onSuccess({
        product: json.product,
        products: json.products,
        transactions: json.transactions,
        message: `Đã nhập +${validation.data.quantity} ${validation.data.unit} "${json.product.name}" vào kho.`,
      });
      onClose();
    } catch {
      setError('Mất kết nối tới máy chủ. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedExistingDisplayText = selectedExistingProduct
    ? `${selectedExistingProduct.name} (Hiện tồn: ${selectedExistingProduct.quantity} ${selectedExistingProduct.unit})`
    : '';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="import-modal-title"
    >
      <div className="w-full max-w-lg rounded-xl bg-white border border-slate-200 shadow-xl overflow-hidden my-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h2 id="import-modal-title" className="text-lg font-semibold text-slate-900">
              Lập phiếu nhập kho
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Thêm sản phẩm mới hoặc nhập bổ sung vào tồn kho hiện tại
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng cửa sổ nhập kho"
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

          {products.length > 0 && !initialProduct && (
            <div ref={existingDropdownRef} className="relative">
              <label
                htmlFor="import-existing-search"
                className="block text-xs font-medium text-slate-600 mb-1.5"
              >
                Tìm nhanh sản phẩm có sẵn (hoặc nhập tên mới bên dưới)
              </label>

              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
                  aria-hidden="true"
                />
                <input
                  id="import-existing-search"
                  type="text"
                  autoComplete="off"
                  placeholder="-- Tạo sản phẩm mới -- (Gõ tên hoặc SKU để tìm...)"
                  value={
                    isExistingDropdownOpen ? existingSearch : selectedExistingDisplayText
                  }
                  onFocus={() => {
                    setIsExistingDropdownOpen(true);
                    setExistingSearch('');
                  }}
                  onChange={(e) => {
                    setExistingSearch(e.target.value);
                    if (!isExistingDropdownOpen) {
                      setIsExistingDropdownOpen(true);
                    }
                  }}
                  className="w-full h-10 rounded-lg border border-slate-300 bg-white pl-9 pr-9 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
                <button
                  type="button"
                  onClick={() => {
                    setIsExistingDropdownOpen((prev) => {
                      const next = !prev;
                      if (next) setExistingSearch('');
                      return next;
                    });
                  }}
                  aria-label="Mở hoặc đóng danh sách sản phẩm có sẵn"
                  className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400 hover:text-slate-600"
                >
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${
                      isExistingDropdownOpen ? 'rotate-180' : ''
                    }`}
                    aria-hidden="true"
                  />
                </button>
              </div>

              {isExistingDropdownOpen && (
                <ul
                  role="listbox"
                  aria-label="Danh sách sản phẩm có sẵn"
                  className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-slate-200 bg-white py-1 text-sm shadow-lg"
                >
                  <li
                    role="option"
                    aria-selected={selectedExistingId === ''}
                    onClick={() => handlePickExistingProduct('')}
                    className={`px-3 py-2 cursor-pointer border-b border-slate-100 ${
                      selectedExistingId === ''
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    -- Tạo sản phẩm mới --
                  </li>

                  {filteredExistingProducts.length === 0 ? (
                    <li className="px-3 py-2 text-slate-500">
                      Không tìm thấy sản phẩm phù hợp với &ldquo;{existingSearch}&rdquo;
                    </li>
                  ) : (
                    filteredExistingProducts.map((p) => {
                      const isSelected = p.id === selectedExistingId;

                      return (
                        <li
                          key={p.id}
                          role="option"
                          aria-selected={isSelected}
                          onClick={() => handlePickExistingProduct(p.id)}
                          className={`px-3 py-2 flex items-center justify-between gap-2 cursor-pointer ${
                            isSelected
                              ? 'bg-blue-50 text-blue-700 font-medium'
                              : 'text-slate-900 hover:bg-slate-100'
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
                          <span className="text-xs font-mono shrink-0 text-slate-500">
                            Hiện tồn: {p.quantity} {p.unit}
                          </span>
                        </li>
                      );
                    })
                  )}
                </ul>
              )}
            </div>
          )}

          <div>
            <label
              htmlFor="import-product-name"
              className="block text-sm font-medium text-slate-800 mb-1.5"
            >
              Tên sản phẩm <span className="text-red-600">*</span>
            </label>
            <input
              id="import-product-name"
              type="text"
              required
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="Ví dụ: Máy khoan động lực không dây 18V"
              className="w-full h-10 rounded-lg border border-slate-300 px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>

          <div>
            <span className="block text-sm font-medium text-slate-800 mb-1.5">
              Hình ảnh sản phẩm
            </span>
            <div className="flex items-start gap-4">
              <ProductThumbnail src={imageUrl} alt={productName || 'Xem trước sản phẩm'} size="lg" />
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <label
                    htmlFor="import-image-file"
                    className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{isUploadingImage ? 'Đang tải ảnh...' : 'Tải ảnh từ máy'}</span>
                  </label>
                  <input
                    id="import-image-file"
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    onChange={handleFileUpload}
                    disabled={isUploadingImage}
                    className="sr-only"
                  />
                  <span className="text-xs text-slate-500">hoặc chọn mẫu nhanh:</span>
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {PRESET_PRODUCT_IMAGES.map((preset) => {
                    const selected = imageUrl === preset.url;
                    return (
                      <button
                        key={preset.url}
                        type="button"
                        onClick={() => setImageUrl(preset.url)}
                        aria-label={`Chọn ảnh mẫu ${preset.label}`}
                        title={preset.label}
                        className={`rounded-md p-0.5 border transition-colors ${
                          selected
                            ? 'border-blue-600 ring-1 ring-blue-600'
                            : 'border-slate-200 hover:border-slate-400'
                        }`}
                      >
                        <img
                          src={preset.url}
                          alt={preset.label}
                          className="h-8 w-8 rounded object-cover"
                        />
                      </button>
                    );
                  })}
                </div>

                <input
                  id="import-image-url"
                  type="text"
                  aria-label="Đường dẫn URL hình ảnh sản phẩm"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="Hoặc dán đường dẫn URL hình ảnh..."
                  className="w-full h-8 rounded-md border border-slate-200 px-2.5 text-xs text-slate-700 font-mono placeholder:text-slate-400 focus:border-blue-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label
                htmlFor="import-quantity"
                className="block text-sm font-medium text-slate-800 mb-1.5"
              >
                Số lượng <span className="text-red-600">*</span>
              </label>
              <input
                id="import-quantity"
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
                htmlFor="import-unit"
                className="block text-sm font-medium text-slate-800 mb-1.5"
              >
                Đơn vị tính <span className="text-red-600">*</span>
              </label>
              <select
                id="import-unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
              >
                {STANDARD_UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
                <option value="__custom__">Đơn vị khác...</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="import-date"
                className="block text-sm font-medium text-slate-800 mb-1.5"
              >
                Ngày nhập <span className="text-red-600">*</span>
              </label>
              <input
                id="import-date"
                type="date"
                required
                value={importDate}
                onChange={(e) => setImportDate(e.target.value)}
                className="w-full h-10 rounded-lg border border-slate-300 px-3 text-sm font-mono text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>
          </div>

          {unit === '__custom__' && (
            <div>
              <label
                htmlFor="import-custom-unit"
                className="block text-sm font-medium text-slate-800 mb-1.5"
              >
                Nhập đơn vị tính tùy chỉnh <span className="text-red-600">*</span>
              </label>
              <input
                id="import-custom-unit"
                type="text"
                required
                value={customUnit}
                onChange={(e) => setCustomUnit(e.target.value)}
                placeholder="Ví dụ: Pallet, Lít, Kiện"
                className="w-full h-10 rounded-lg border border-slate-300 px-3 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>
          )}

          <div>
            <label
              htmlFor="import-note"
              className="block text-sm font-medium text-slate-800 mb-1.5"
            >
              Ghi chú nhập kho
            </label>
            <input
              id="import-note"
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Nhà cung cấp, số lô hoặc ghi chú kiểm nhận..."
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
              disabled={isSubmitting || isUploadingImage}
              className="h-10 px-5 rounded-lg bg-blue-700 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-50 transition-colors whitespace-nowrap shrink-0"
            >
              {isSubmitting ? 'Đang lưu...' : 'Xác nhận nhập kho'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}