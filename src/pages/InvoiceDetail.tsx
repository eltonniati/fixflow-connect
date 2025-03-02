
import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useReactToPrint } from "react-to-print";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Printer, Send, CheckCircle, FileText } from "lucide-react";
import { toast } from "sonner";
import { useInvoiceDetails } from "@/hooks/use-invoice-details";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// Helper function for currency formatting
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-ZA", {
    style: 'currency',
    currency: 'ZAR',
  }).format(amount);
};

// Helper function to get status color
const getStatusColor = (status: string) => {
  switch (status) {
    case "Draft":
      return "bg-gray-100 text-gray-800";
    case "Sent":
      return "bg-blue-100 text-blue-800";
    case "Paid":
      return "bg-green-100 text-green-800";
    case "Overdue":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const InvoiceDetail = () => {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const navigate = useNavigate();
  const { invoice, loading, getInvoice, updateInvoice } = useInvoiceDetails();
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);
  const [isPrintReady, setIsPrintReady] = useState(false);
  const invoiceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (invoiceId) {
      getInvoice(invoiceId);
    }
  }, [invoiceId]);

  const handlePrintOrPDF = useReactToPrint({
    content: () => invoiceRef.current,
    documentTitle: `Invoice_${invoice?.invoice_number || "unknown"}`,
    onAfterPrint: () => {
      setIsPrintReady(false);
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
    setIsPrintReady(true);
    setTimeout(() => {
      if (invoiceRef.current) {
        handlePrintOrPDF();
      }
    }, 200);
  };

  // Printable Invoice Component
  const PrintableInvoice = () => (
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
              {invoice?.line_items.map((item) => (
                <tr key={item.id} className="border-b">
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

  // NotFound component
  const InvoiceNotFound = ({ onBack }: { onBack: () => void }) => {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto">
        <Button variant="ghost" onClick={onBack} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Invoices
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Invoice Not Found</CardTitle>
            <CardDescription>
              The invoice you're looking for does not exist or has been deleted.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={onBack}>Return to Invoices</Button>
          </CardFooter>
        </Card>
      </div>
    );
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

      <div className="grid gap-8 md:grid-cols-3">
        {/* Invoice Actions */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Invoice Actions</CardTitle>
            <CardDescription>Manage this invoice</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Invoice Number</p>
              <p className="font-medium">{invoice.invoice_number}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Status</p>
              <div className="flex items-center gap-2">
                <Badge className={getStatusColor(invoice.status)}>
                  {invoice.status}
                </Badge>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Issue Date</p>
              <p className="font-medium">{format(new Date(invoice.issue_date), "MMMM d, yyyy")}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Due Date</p>
              <p className="font-medium">{format(new Date(invoice.due_date), "MMMM d, yyyy")}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Amount</p>
              <p className="text-xl font-bold">{formatCurrency(invoice.total)}</p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col items-stretch gap-2">
            <Button 
              className="w-full" 
              variant="outline" 
              onClick={() => setIsPrintDialogOpen(true)}
            >
              <Printer className="mr-2 h-4 w-4" />
              Print Invoice
            </Button>
            <Button
              className="w-full"
              variant="secondary"
              onClick={() => handleStatusChange("Sent")}
              disabled={invoice.status === "Sent"}
            >
              <Send className="mr-2 h-4 w-4" />
              Mark as Sent
            </Button>
            <Button
              className="w-full"
              variant="default"
              onClick={() => handleStatusChange("Paid")}
              disabled={invoice.status === "Paid"}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Mark as Paid
            </Button>
            <Button
              className="w-full"
              variant="destructive"
              onClick={() => handleStatusChange("Overdue")}
              disabled={invoice.status === "Overdue"}
            >
              <FileText className="mr-2 h-4 w-4" />
              Mark as Overdue
            </Button>
          </CardFooter>
        </Card>

        {/* Invoice Details */}
        <div className="md:col-span-2">
          <Card className="mb-6">
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardTitle>Invoice #{invoice.invoice_number}</CardTitle>
                <CardDescription>
                  Created on {format(new Date(invoice.created_at!), "MMMM d, yyyy")}
                </CardDescription>
              </div>
              <Badge className={getStatusColor(invoice.status)}>
                {invoice.status}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Bill To</h3>
                <p>{invoice.bill_description}</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Items</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead className="text-right">Unit Price</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoice.line_items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.description}</TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.unit_price)}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(item.amount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label className="text-muted-foreground">Subtotal</Label>
                    <p className="font-medium">{formatCurrency(invoice.subtotal)}</p>
                  </div>
                  {invoice.taxes.map((tax, index) => (
                    <div key={index} className="flex justify-between">
                      <Label className="text-muted-foreground">{tax.name} ({tax.rate}%)</Label>
                      <p className="font-medium">{formatCurrency(tax.amount)}</p>
                    </div>
                  ))}
                  <div className="flex justify-between border-t pt-2">
                    <Label className="font-bold">Total</Label>
                    <p className="text-xl font-bold">{formatCurrency(invoice.total)}</p>
                  </div>
                </div>
              </div>

              {invoice.notes && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Notes</h3>
                  <p>{invoice.notes}</p>
                </div>
              )}

              {invoice.terms && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Terms & Conditions</h3>
                  <p>{invoice.terms}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Print Dialog */}
      <Dialog open={isPrintDialogOpen} onOpenChange={setIsPrintDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Print Invoice</DialogTitle>
            <DialogDescription>Print or save this invoice as PDF</DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-between">
            <Button variant="outline" onClick={() => setIsPrintDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Printable Invoice (hidden) */}
      <div ref={invoiceRef} className={isPrintReady ? "print-content" : "hidden print-content"}>
        {isPrintReady && <PrintableInvoice />}
      </div>
    </div>
  );
};

export default InvoiceDetail;
