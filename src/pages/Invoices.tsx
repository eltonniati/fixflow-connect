import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useReactToPrint } from "react-to-print";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer } from "lucide-react";
import { toast } from "sonner";
import { useInvoiceDetails } from "@/hooks/use-invoice-details";
import { InvoiceActions } from "@/components/invoice/InvoiceActions";
import { InvoiceDetails } from "@/components/invoice/InvoiceDetails";
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
  }, [invoiceId, getInvoice]);

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

  const PrintableContent = () => (
    <div className="print-content">
      <div className="invoice-header">
        <h1>INVOICE</h1>
        <p>Invoice No: {invoice.invoice_number}</p>
        <p>Date: {new Date(invoice.issue_date).toLocaleDateString()}</p>
        <p>Due Date: {new Date(invoice.due_date).toLocaleDateString()}</p>
      </div>
      <div className="invoice-details">
        <div className="billing-info">
          <p><strong>Bill To:</strong></p>
          <p>{invoice.customer_name}</p>
          <p>{invoice.customer_title}</p>
          <p>Phone: {invoice.customer_phone}</p>
        </div>
        <div className="billing-info">
          <p><strong>Payment Details:</strong></p>
          <p>Account No: {invoice.account_number}</p>
          <p>Account Name: {invoice.account_name}</p>
          <p>Bank Name: {invoice.bank_name}</p>
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Description</th>
            <th>Qty</th>
            <th>Unit Price</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items.map((item, index) => (
            <tr key={index}>
              <td>{index + 1}</td>
              <td>{item.description}</td>
              <td>{item.quantity}</td>
              <td>${parseFloat(item.price).toFixed(2)}</td>
              <td>${parseFloat(item.total).toFixed(2)}</td>
            </tr>
          ))}
          <tr className="total-row">
            <td colSpan={4} style={{ textAlign: 'right' }}>Grand Total:</td>
            <td>${invoice.items.reduce((sum, item) => sum + parseFloat(item.total), 0).toFixed(2)}</td>
          </tr>
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
  );

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto">
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
              padding: 20px;
              font-family: 'Helvetica', Arial, sans-serif;
              color: #2d3748;
            }
            
            .print-content .invoice-header {
              background: linear-gradient(135deg, #2b6cb0 0%, #3182ce 100%);
              color: white;
              padding: 25px;
              border-radius: 12px 12px 0 0;
              text-align: center;
              margin-bottom: 0;
            }
            
            .print-content .invoice-header h1 {
              font-size: 32px;
              font-weight: 700;
              margin: 0;
              letter-spacing: 1px;
            }
            
            .print-content .invoice-header p {
              font-size: 14px;
              margin: 4px 0;
              opacity: 0.9;
            }
            
            .print-content .invoice-details {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              padding: 25px;
              background: #f7fafc;
              border: 1px solid #e2e8f0;
              border-top: none;
            }
            
            .print-content .billing-info {
              background: white;
              padding: 20px;
              border-radius: 8px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.05);
            }
            
            .print-content .billing-info p {
              margin: 6px 0;
              font-size: 14px;
            }
            
            .print-content .billing-info p strong {
              color: #2b6cb0;
            }
            
            .print-content table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
              background: white;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 2px 4px rgba(0,0,0,0.05);
            }
            
            .print-content th {
              background: #2d3748;
              color: white;
              padding: 12px 15px;
              font-weight: 600;
              text-transform: uppercase;
              font-size: 12px;
              letter-spacing: 0.5px;
            }
            
            .print-content td {
              padding: 12px 15px;
              border-bottom: 1px solid #edf2f7;
              font-size: 14px;
            }
            
            .print-content tr:last-child td {
              border-bottom: none;
            }
            
            .print-content tr:nth-child(even) {
              background: #f7fafc;
            }
            
            .print-content .total-row {
              background: #edf2f7;
              font-weight: 600;
            }
            
            .print-content .footer {
              background: #edf2f7;
              padding: 20px;
              border-radius: 0 0 12px 12px;
              text-align: center;
              font-size: 12px;
              color: #4a5568;
              border: 1px solid #e2e8f0;
              border-top: none;
            }
            
            .print-content .footer p {
              margin: 4px 0;
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
            
            <div ref={printableInvoiceRef} className="print-content border rounded-lg shadow-lg">
              <PrintableContent />
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

      {!isPreviewMode && (
        <div ref={printableInvoiceRef} className="hidden">
          <PrintableContent />
        </div>
      )}
    </div>
  );
};

export default InvoiceDetail;
