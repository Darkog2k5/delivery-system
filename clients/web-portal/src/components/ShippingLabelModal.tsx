import { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';
import { Printer, X } from 'lucide-react';
import { OrderLabel } from '../types/api';
import { formatCurrency, formatDateTime } from '../utils/status';

interface Props {
  label: OrderLabel | null;
  onClose: () => void;
}

export function ShippingLabelModal({ label, onClose }: Props) {
  const barcodeRef = useRef<SVGSVGElement | null>(null);
  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!label) return;
    if (barcodeRef.current) {
      JsBarcode(barcodeRef.current, label.barcodeValue, {
        format: 'CODE128',
        lineColor: '#0f172a',
        width: 1.8,
        height: 46,
        displayValue: true,
        fontSize: 13,
        margin: 4,
      });
    }
    if (qrCanvasRef.current) {
      const url = `${window.location.origin}/track?code=${encodeURIComponent(label.trackingCode)}`;
      QRCode.toCanvas(qrCanvasRef.current, url, {
        width: 96,
        margin: 1,
        color: { dark: '#0f172a', light: '#ffffff' },
      });
    }
  }, [label]);

  if (!label) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3 no-print">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Tem Vận Đơn Nhiệt Chuẩn A6 (100 × 150 mm)
            </h3>
            <p className="text-xs text-slate-500">
              UC09 — Code 128 Barcode &amp; Public Tracking QR Code
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 bg-slate-100 flex justify-center">
          <div className="printable-label w-[360px] rounded-lg border-2 border-slate-900 bg-white p-4 text-slate-900 shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-2">
              <div>
                <div className="text-lg font-black tracking-tight text-spx-orange">
                  SPX EXPRESS
                </div>
                <div className="text-[10px] font-semibold uppercase text-slate-500">
                  Khổ A6 ({label.paperSizeMm} mm)
                </div>
              </div>
              <div className="rounded bg-slate-900 px-2.5 py-1 text-sm font-black text-white">
                {label.hubCode}
              </div>
            </div>

            {/* 1D Barcode */}
            <div className="my-2 flex flex-col items-center border-b border-dashed border-slate-400 pb-2">
              <svg ref={barcodeRef} className="max-w-full" />
            </div>

            {/* Sender & Receiver */}
            <div className="grid grid-cols-1 gap-2 border-b border-slate-300 pb-2 text-xs">
              <div className="rounded bg-slate-50 p-2">
                <div className="text-[10px] font-bold uppercase text-slate-500">
                  Từ (Người gửi):
                </div>
                <div className="font-bold">
                  {label.senderName} · {label.senderPhone}
                </div>
                <div className="text-slate-600">{label.senderAddress}</div>
              </div>

              <div className="rounded border border-slate-300 p-2">
                <div className="text-[10px] font-bold uppercase text-slate-500">
                  Đến (Người nhận):
                </div>
                <div className="text-sm font-bold">
                  {label.receiverName} · {label.receiverPhone}
                </div>
                <div className="text-slate-700">{label.receiverAddress}</div>
              </div>
            </div>

            {/* Item + QR + COD */}
            <div className="mt-2 flex items-center justify-between gap-3">
              <div className="flex-1 text-xs space-y-1">
                <div>
                  <span className="text-slate-500">Nội dung:</span>{' '}
                  <span className="font-semibold">{label.itemName}</span>
                </div>
                <div>
                  <span className="text-slate-500">KL tính cước:</span>{' '}
                  <span className="font-semibold">
                    {label.chargeableWeightGram} g
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Ngày tạo:</span>{' '}
                  <span>{formatDateTime(label.createdAt)}</span>
                </div>
                <div className="mt-2 rounded border-2 border-slate-900 bg-amber-50 px-2.5 py-1.5">
                  <div className="text-[10px] font-bold uppercase text-slate-600">
                    Tiền thu hộ (COD)
                  </div>
                  <div className="text-base font-black text-spx-orange">
                    {formatCurrency(label.codAmount)}
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center">
                <canvas ref={qrCanvasRef} className="rounded border border-slate-200" />
                <span className="mt-1 text-[9px] font-medium text-slate-500">
                  Quét để tra cứu
                </span>
              </div>
            </div>

            {label.note && (
              <div className="mt-2 border-t border-dashed border-slate-300 pt-1.5 text-[11px] text-slate-600">
                <span className="font-semibold">Ghi chú:</span> {label.note}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-5 py-3 no-print">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Đóng
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-spx-orange px-4 py-2 text-xs font-semibold text-white hover:bg-spx-dark"
          >
            <Printer className="h-4 w-4" />
            In Tem A6
          </button>
        </div>
      </div>
    </div>
  );
}
