
import { Invoice } from "@/lib/types";
import { format } from "date-fns";
import { formatCurrency } from "./InvoiceActions";

interface PrintableInvoiceProps {
  invoice: Invoice;
}

export const PrintableInvoice = ({ invoice }: PrintableInvoiceProps) => {
  return (
    <div className="p-6 bg-white">
      <div className="border-2 border-gray-200 p-6">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold">INVOICE</h1>
            <p className="text-lg font-medium">{invoice?.invoice_number}</p>
          </div>
          <div className="text-right">
            <p><strong>Issue Date:</strong> {format(new Date(invoice?.issue_date || new Date()), "MMMM d, yyyy")}</p>
            <p><strong>Due Date:</strong> {format(new Date(invoice?.due_date || new Date()), "MMMM d, yyyy")}</p>
            <p className="mt-2">
              <span className="px-3 py-1 rounded-full bg-gray-200 text-gray-800 font-medium">
                {invoice?.status}
              </span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <div>
            <h2 className="text-lg font-semibold border-b mb-2">Bill To</h2>
            <p>{invoice?.bill_description}</p>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-lg font-semibold border-b mb-2">Items</h2>
          <table className="w-full">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2">Description</th>
                <th className="py-2 text-right">Quantity</th>
                <th className="py-2 text-right">Unit Price</th>
                <th className="py-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice?.line_items.map((item, idx) => (
                <tr key={idx} className="border-b">
                  <td className="py-2">{item.description}</td>
                  <td className="py-2 text-right">{item.quantity}</td>
                  <td className="py-2 text-right">{formatCurrency(item.unit_price)}</td>
                  <td className="py-2 text-right">{formatCurrency(item.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end mb-8">
          <div className="w-64">
            <div className="flex justify-between border-b py-2">
              <span>Subtotal</span>
              <span>{formatCurrency(invoice?.subtotal || 0)}</span>
            </div>
            {invoice?.taxes.map((tax, index) => (
              <div key={index} className="flex justify-between border-b py-2">
                <span>{tax.name} ({tax.rate}%)</span>
                <span>{formatCurrency(tax.amount)}</span>
              </div>
            ))}
            <div className="flex justify-between font-bold text-lg py-2">
              <span>Total</span>
              <span>{formatCurrency(invoice?.total || 0)}</span>
            </div>
          </div>
        </div>

        {invoice?.notes && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold border-b mb-2">Notes</h2>
            <p>{invoice.notes}</p>
          </div>
        )}

        {invoice?.terms && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold border-b mb-2">Terms & Conditions</h2>
            <p>{invoice.terms}</p>
          </div>
        )}

        <div className="mt-6 text-sm text-center border-t pt-2">
          <p>Generated on: {format(new Date(), "MMMM d, yyyy HH:mm")}</p>
        </div>
      </div>
    </div>
  );
};
