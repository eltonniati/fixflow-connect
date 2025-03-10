import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useReactToPrint } from "react-to-print";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer } from "lucide-react";
import { toast } from "sonner";
import { useInvoiceDetails } from "@/hooks/use-invoice-details";
import { InvoiceActions } from "@/components/invoice/InvoiceActions";
import { InvoiceDetails } from "@/components/invoice/InvoiceDetails";
import { PrintableInvoice } from "@/components/invoice/PrintableInvoice";
import { InvoiceNotFound } from "@/components/invoice/InvoiceNotFound";
import { PrintDialog } from "@/components/invoice/PrintDialog";

const InvoiceDetail = () => {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const navigate = useNavigate();
  const { invoice, loading, getInvoice, updateInvoice } = useInvoiceDetails();
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const printableInvoiceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (invoiceId) {
      getInvoice(invoiceId);
    }
  }, [invoiceId]);

  const handlePrintOrPDF = useReactToPrint({
    documentTitle: `Invoice_${invoice?.invoice_number || "unknown"}`,
    contentRef: printableInvoiceRef,
    onAfterPrint: () => {
      setIsPreviewMode(false);
      toast.success("Invoice printed/saved successfully");
    },
    onPrintError: (error) => {
      console.error("Print error:", error);
      toast.error("Failed to print invoice");
      setIsPreviewMode(false);
    },
  });

  const handleStatusChange = async (status: "Draft" | "Sent" | "Paid" | "Overdue") => {
    if (!invoice || !invoiceId) return;
    
    try {
      await updateInvoice(invoiceId, { status });
      toast.success(`Status updated to ${status}`);
    } catch (error) {
      toast.error("Failed to update status");
      console.error(error);
    }
  };

  const handlePrint = () => {
    setIsPrintDialogOpen(false);
    setIsPreviewMode(true);
    
    // Small delay to ensure the print content is ready
    setTimeout(() => {
      if (printableInvoiceRef.current) {
        handlePrintOrPDF();
      } else {
        toast.error("Print content not ready");
        setIsPreviewMode(false);
      }
    }, 200);
  };

  const handlePreview = () => {
    setIsPrintDialogOpen(false);
    setIsPreviewMode(true);
  };

  if (loading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto">
        <div className="flex justify-center items-center h-64">
          <p className="text-muted-foreground">Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return <InvoiceNotFound onBack={() => navigate("/job-cards")} />;
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto">
      {/* Add print-specific styles directly in the component */}
      <style>
        {`
          @media print {
            body * {
              visibility: hidden;
            }
            
            .print-content, .print-content * {
              visibility: visible;
            }
            
            .print-content {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              margin: 0;
              padding: 0;
              font-family: Arial, sans-serif;
              color: #333;
            }
            
            .print-content .invoice-header {
              text-align: center;
              margin-bottom: 20px;
              padding: 20px;
              background-color: #f5f5f5;
              border-radius: 8px;
            }
            
            .print-content .invoice-header h1 {
              font-size: 24px;
              font-weight: bold;
              margin: 0;
              color: #333;
            }
            
            .print-content .invoice-header p {
              font-size: 14px;
              color: #666;
              margin: 0;
            }
            
            .print-content .invoice-details {
              display: flex;
              justify-content: space-between;
              margin-bottom: 20px;
              padding: 20px;
              background-color: #f5f5f5;
              border-radius: 8px;
            }
            
            .print-content .invoice-details div {
              flex: 1;
            }
            
            .print-content .invoice-details div:last-child {
              text-align: right;
            }
            
            .print-content table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            
            .print-content th, .print-content td {
              border: 1px solid #ddd;
              padding: 10px;
              text-align: left;
            }
            
            .print-content th {
              background-color: #333;
              color: #fff;
              font-weight: bold;
            }
            
            .print-content tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            
            .print-content .footer {
              text-align: center;
              margin-top: 20px;
              padding: 20px;
              background-color: #f5f5f5;
              border-radius: 8px;
              font-size: 12px;
              color: #666;
            }
            
            .no-print {
              display: none;
            }
          }
        `}
      </style>

      <div className="no-print">
        <Button variant="ghost" onClick={() => navigate("/job-cards")} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Job Cards
        </Button>

        {isPreviewMode ? (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Invoice Preview</h2>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsPreviewMode(false)}>
                  Back to Details
                </Button>
                <Button onClick={() => handlePrintOrPDF()}>
                  <Printer className="mr-2 h-4 w-4" />
                  Print Now
                </Button>
              </div>
            </div>
            
            <div ref={printableInvoiceRef} className="print-content border rounded-lg shadow-sm bg-white">
              <div className="invoice-header">
                <h1>INVOICE</h1>
                <p>Invoice Number: {invoice.invoice_number}</p>
                <p>Date: {new Date(invoice.issue_date).toLocaleDateString()}</p>
              </div>
              <div className="invoice-details">
                <div>
                  <p><strong>INVOICE TO:</strong></p>
                  <p>{invoice.customer_name}</p>
                  <p>{invoice.customer_title}</p>
                  <p>Phone: {invoice.customer_phone}</p>
                </div>
                <div>
                  <p><strong>PAYMENT INFO:</strong></p>
                  <p>Account No: {invoice.account_number}</p>
                  <p>Account Name: {invoice.account_name}</p>
                  <p>Bank Name: {invoice.bank_name}</p>
                </div>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>NO</th>
                    <th>DESCRIPTION</th>
                    <th>QTY</th>
                    <th>PRICE</th>
                    <th>TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item, index) => (
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td>{item.description}</td>
                      <td>{item.quantity}</td>
                      <td>{item.price}</td>
                      <td>{item.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="footer">
                <p>Thank you for your business!</p>
                <p>Phone: {invoice.company_phone}</p>
                <p>Website: {invoice.company_website}</p>
                <p>Address: {invoice.company_address}</p>
                <p><strong>Terms & Conditions:</strong></p>
                <p>{invoice.terms_and_conditions}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-3">
            <div className="md:col-span-1">
              <InvoiceActions 
                invoice={invoice} 
                onPrint={() => setIsPrintDialogOpen(true)} 
                onStatusChange={handleStatusChange} 
              />
            </div>

            <div className="md:col-span-2">
              <InvoiceDetails invoice={invoice} />
            </div>
          </div>
        )}

        <PrintDialog 
          open={isPrintDialogOpen} 
          onOpenChange={setIsPrintDialogOpen} 
          onPrint={handlePrint}
          onPreview={handlePreview}
          showPreviewOption={true}
        />
      </div>

      {/* Hidden printable content when not in preview mode */}
      {!isPreviewMode && (
        <div ref={printableInvoiceRef} className="hidden">
          <div className="print-content">
            <div className="invoice-header">
              <h1>INVOICE</h1>
              <p>Invoice Number: {invoice.invoice_number}</p>
              <p>Date: {new Date(invoice.issue_date).toLocaleDateString()}</p>
            </div>
            <div className="invoice-details">
              <div>
                <p><strong>INVOICE TO:</strong></p>
                <p>{invoice.customer_name}</p>
                <p>{invoice.customer_title}</p>
                <p>Phone: {invoice.customer_phone}</p>
              </div>
              <div>
                <p><strong>PAYMENT INFO:</strong></p>
                <p>Account No: {invoice.account_number}</p>
                <p>Account Name: {invoice.account_name}</p>
                <p>Bank Name: {invoice.bank_name}</p>
              </div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>NO</th>
                  <th>DESCRIPTION</th>
                  <th>QTY</th>
                  <th>PRICE</th>
                  <th>TOTAL</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, index) => (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td>{item.description}</td>
                    <td>{item.quantity}</td>
                    <td>{item.price}</td>
                    <td>{item.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="footer">
              <p>Thank you for your business!</p>
              <p>Phone: {invoice.company_phone}</p>
              <p>Website: {invoice.company_website}</p>
              <p>Address: {invoice.company_address}</p>
              <p><strong>Terms & Conditions:</strong></p>
              <p>{invoice.terms_and_conditions}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceDetail;
