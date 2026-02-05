import React from "react";
import { IInvoice } from "@/models/Invoice";
import { formatDate } from "@/lib/utils";

interface PrintableInvoiceProps {
  invoice: IInvoice | null;
}

export const PrintableInvoice: React.FC<PrintableInvoiceProps> = ({
  invoice,
}) => {
  if (!invoice) return null;

  return (
    <div className="print-only p-8 bg-white text-black min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6 mb-8">
        <div className="flex flex-col items-start gap-4">
          <img
            src="/phoenix_logo.svg"
            alt="Phoenix Logo"
            className="h-20 w-auto"
          />
          <div className="text-[10px] space-y-0.5 text-slate-500 font-medium">
            <p>123 Healthcare Blvd, Medical District</p>
            <p>Phone: +91 98765 43210</p>
            <p>Email: billing@phoenix-international.com</p>
          </div>
        </div>
        <div className="text-right">
          <div className="bg-slate-900 text-white px-4 py-2 inline-block mb-4">
            <h2 className="text-xl font-bold uppercase tracking-widest">
              Invoice
            </h2>
          </div>
          <p className="text-sm font-bold truncate">#{invoice.invoiceNumber}</p>
          <p className="text-xs text-slate-500 mt-1">
            Date: {formatDate(invoice.createdAt)}
          </p>
        </div>
      </div>

      {/* Patient Info */}
      <div className="grid grid-cols-2 gap-12 mb-10">
        <div>
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
            Billed To
          </h3>
          <div className="border-l-4 border-slate-900 pl-4 h-full flex flex-col justify-center">
            <p className="text-lg font-bold">{invoice.patientName}</p>
            <p className="text-sm font-medium text-slate-600">
              ID: {invoice.patientID}
            </p>
          </div>
        </div>
        <div>
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
            Payment Details
          </h3>
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Mode:</span>
              <span className="font-bold">{invoice.paymentMode}</span>
            </div>
            {invoice.paymentMode === "Split" && invoice.paymentBreakdown && (
              <div className="space-y-1 border-t border-slate-100 pt-1 mt-1">
                {invoice.paymentBreakdown.map((p, i) => (
                  <div key={i} className="flex justify-between text-[11px]">
                    <span className="text-slate-400 uppercase tracking-tighter">
                      {p.mode} Amount:
                    </span>
                    <span className="font-semibold">
                      ₹{p.amount?.toLocaleString("en-IN")}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Status:</span>
              <span className="font-bold text-green-600 uppercase">Paid</span>
            </div>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="mb-10">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-100 border-y-2 border-slate-900">
              <th className="text-left py-3 px-4 text-xs font-black uppercase tracking-wider">
                Description
              </th>
              <th className="text-right py-3 px-4 text-xs font-black uppercase tracking-wider w-32">
                Amount
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {invoice.items.map((item, idx) => (
              <tr key={idx}>
                <td className="py-4 px-4 text-sm font-medium">
                  {item.description}
                </td>
                <td className="py-4 px-4 text-sm font-bold text-right">
                  ₹{item.amount.toLocaleString("en-IN")}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-slate-900 bg-slate-50">
              <td className="py-4 px-4 text-base font-black uppercase tracking-wider">
                Total Amount
              </td>
              <td className="py-4 px-4 text-xl font-bold text-right text-slate-900">
                ₹{invoice.totalAmount.toLocaleString("en-IN")}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Footer */}
      <div className="mt-20 pt-10 border-t border-dashed border-slate-300 grid grid-cols-2 gap-8">
        <div>
          <h4 className="text-xs font-bold uppercase mb-2">
            Terms & Conditions
          </h4>
          <p className="text-[10px] text-slate-500 leading-relaxed">
            1. This is a computer generated invoice and does not require a
            physical signature.
            <br />
            2. Payment is non-refundable once the service/medicine is dispensed.
            <br />
            3. Please preserve this invoice for future reference and follow-ups.
          </p>
        </div>
        <div className="flex flex-col items-end justify-end">
          <div className="w-48 border-b border-black mb-1"></div>
          <p className="text-[10px] font-bold uppercase">
            Authorized Signatory
          </p>
        </div>
      </div>

      <div className="mt-12 text-center">
        <p className="text-[10px] text-slate-400 italic">
          Thank you for choosing Phoenix International. Wish you a speedy
          recovery!
        </p>
      </div>
    </div>
  );
};
