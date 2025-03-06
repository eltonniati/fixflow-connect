
import { Invoice } from "@/lib/types";
import { format } from "date-fns";
import { formatCurrency } from "./InvoiceActions";
import { useCompanies } from "@/hooks/use-companies";
import { useEffect, useState } from "react";

interface PrintableInvoiceProps {
  invoice: Invoice;
}

export const PrintableInvoice = ({ invoice }: PrintableInvoiceProps) => {
  const { companies, fetchCompanies } = useCompanies();
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    if (companies && companies.length > 0) {
      // Use the first company logo as default
      setCompanyLogo(companies[0]?.logo_url || null);
    }
  }, [companies]);

  const InvoiceTemplate = () => (
    <div className="border-2 border-gray-200 p-6 max-w-[210mm] mx-auto">
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center">
          {companyLogo && (
            <div className="mr-4">
              <img 
                src={companyLogo} 
                alt="Company Logo" 
                className="h-16 w-auto object-contain"
              />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold">INVOICE</h1>
            <p className="text-base font-medium">{invoice?.invoice_number}</p>
          </div>
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

      <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
        <div>
          <h2 className="text-base font-semibold border-b mb-2">Bill To</h2>
          <p className="whitespace-pre-line">{invoice?.bill_description}</p>
        </div>
        {companies && companies.length > 0 && (
          <div className="text-right">
            <h2 className="text-base font-semibold border-b mb-2">From</h2>
            <p className="font-medium">{companies[0]?.name}</p>
            <p className="whitespace-pre-line">{companies[0]?.address}</p>
            <p>{companies[0]?.email}</p>
            <p>{companies[0]?.phone}</p>
          </div>
        )}
      </div>

      <div className="mb-6">
        <h2 className="text-base font-semibold border-b mb-2">Items</h2>
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

      <div className="flex justify-end mb-6">
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
        <div className="mb-4 text-sm">
          <h2 className="text-base font-semibold border-b mb-2">Notes</h2>
          <p>{invoice.notes}</p>
        </div>
      )}

      {invoice?.terms && (
        <div className="mb-4 text-sm">
          <h2 className="text-base font-semibold border-b mb-2">Terms & Conditions</h2>
          <p>{invoice.terms}</p>
        </div>
      )}

      <div className="mt-6 text-xs text-center border-t pt-2">
        <p>Generated on: {format(new Date(), "MMMM d, yyyy HH:mm")}</p>
      </div>
    </div>
  );

  return (
    <div className="p-4 bg-white print:p-0 print:m-0">
      <div className="flex flex-col">
        {/* First invoice - Customer Copy */}
        <div className="mb-8 pb-1 border-b print:mb-0 print:pb-8">
          <div className="text-xs font-bold mb-1 text-center">CUSTOMER COPY</div>
          <InvoiceTemplate />
        </div>
        
        {/* Second invoice - Device Copy */}
        <div className="page-break-before">
          <div className="text-xs font-bold mb-1 text-center">DEVICE COPY</div>
          <InvoiceTemplate />
        </div>
      </div>
      
      <style>
        {`
          @media print {
            body {
              margin: 0;
              padding: 0;
            }
            
            .page-break-before {
              page-break-before: always;
            }
            
            @page {
              size: A4;
              margin: 10mm;
            }
          }
        `}
      </style>
    </div>
  );
};
