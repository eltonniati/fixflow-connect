
import { Invoice } from "@/lib/types";
import { format } from "date-fns";
import { formatCurrency } from "./InvoiceActions";

interface PrintableInvoiceProps {
  invoice: Invoice;
}

export const PrintableInvoice = ({ invoice }: PrintableInvoiceProps) => {
  const InvoiceTemplate = () => (
    <div className="border-2 border-gray-200 p-4">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h1 className="text-2xl font-bold">INVOICE</h1>
          <p className="text-base font-medium">{invoice?.invoice_number}</p>
        </div>
        <div className="text-right text-sm">
          <p><strong>Issue Date:</strong> {format(new Date(invoice?.issue_date || new Date()), "MMMM d, yyyy")}</p>
          <p><strong>Due Date:</strong> {format(new Date(invoice?.due_date || new Date()), "MMMM d, yyyy")}</p>
          <p className="mt-1">
            <span className="px-2 py-0.5 rounded-full bg-gray-200 text-gray-800 font-medium text-xs">
              {invoice?.status}
            </span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
        <div>
          <h2 className="text-base font-semibold border-b mb-1">Bill To</h2>
          <p>{invoice?.bill_description}</p>
        </div>
      </div>

      <div className="mb-4">
        <h2 className="text-base font-semibold border-b mb-1">Items</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="py-1">Description</th>
              <th className="py-1 text-right">Qty</th>
              <th className="py-1 text-right">Unit Price</th>
              <th className="py-1 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice?.line_items.map((item, idx) => (
              <tr key={idx} className="border-b">
                <td className="py-1">{item.description}</td>
                <td className="py-1 text-right">{item.quantity}</td>
                <td className="py-1 text-right">{formatCurrency(item.unit_price)}</td>
                <td className="py-1 text-right">{formatCurrency(item.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end mb-4">
        <div className="w-48 text-sm">
          <div className="flex justify-between border-b py-1">
            <span>Subtotal</span>
            <span>{formatCurrency(invoice?.subtotal || 0)}</span>
          </div>
          {invoice?.taxes.map((tax, index) => (
            <div key={index} className="flex justify-between border-b py-1">
              <span>{tax.name} ({tax.rate}%)</span>
              <span>{formatCurrency(tax.amount)}</span>
            </div>
          ))}
          <div className="flex justify-between font-bold py-1">
            <span>Total</span>
            <span>{formatCurrency(invoice?.total || 0)}</span>
          </div>
        </div>
      </div>

      {invoice?.notes && (
        <div className="mb-3 text-sm">
          <h2 className="text-base font-semibold border-b mb-1">Notes</h2>
          <p>{invoice.notes}</p>
        </div>
      )}

      {invoice?.terms && (
        <div className="mb-3 text-sm">
          <h2 className="text-base font-semibold border-b mb-1">Terms & Conditions</h2>
          <p>{invoice.terms}</p>
        </div>
      )}

      <div className="mt-3 text-xs text-center border-t pt-1">
        <p>Generated on: {format(new Date(), "MMMM d, yyyy HH:mm")}</p>
      </div>
    </div>
  );

  return (
    <div className="p-4 bg-white print:p-0">
      <div className="flex flex-col">
        {/* First invoice - Customer Copy */}
        <div className="mb-2 pb-1 border-b">
          <div className="text-xs font-bold mb-1 text-center">CUSTOMER COPY</div>
          <InvoiceTemplate />
        </div>
        
        {/* Second invoice - Device Copy */}
        <div className="page-break-avoid">
          <div className="text-xs font-bold mb-1 text-center">DEVICE COPY</div>
          <InvoiceTemplate />
        </div>
      </div>
      
      <style>
        {`
          @media print {
            .page-break-avoid {
              page-break-inside: avoid;
            }
          }
        `}
      </style>
    </div>
  );
};
