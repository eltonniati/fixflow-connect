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
import { Card } from "@/components/ui/card";

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
            <PrintableInvoice invoice={invoice} />
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

      {/* Hidden printable content when not in preview mode */}
      {!isPreviewMode && (
        <div ref={printableInvoiceRef} className="hidden">
          <PrintableInvoice invoice={invoice} />
        </div>
      )}
    </div>
  );
};

export default InvoiceDetail;
