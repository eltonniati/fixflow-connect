import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useReactToPrint } from "react-to-print";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Plus, Trash2, Printer, Save, FileText, Send } from "lucide-react";
import { toast } from "sonner";
import { useJobs } from "@/hooks/use-jobs";
import { useInvoiceDetails } from "@/hooks/use-invoice-details";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Helper function for currency formatting
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-ZA", {
    style: 'currency',
    currency: 'ZAR',
  }).format(amount);
};

const CreateInvoice = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { getJob } = useJobs();
  const { 
    invoice, 
    loading, 
    createInvoiceFromJob, 
    addLineItem, 
    updateLineItem, 
    removeLineItem, 
    updateTax, 
    saveInvoice, 
    setInvoice 
  } = useInvoiceDetails();
  
  const [newItemDescription, setNewItemDescription] = useState("");
  const [newItemQuantity, setNewItemQuantity] = useState(1);
  const [newItemPrice, setNewItemPrice] = useState(0);
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);
  const [isPrintReady, setIsPrintReady] = useState(false);
  const invoiceRef = useRef<HTMLDivElement>(null);

  // Load job and create initial invoice
  useEffect(() => {
    const initializeInvoice = async () => {
      if (!jobId) return;
      
      const job = await getJob(jobId);
      if (!job) {
        toast.error("Job not found");
        navigate("/job-cards");
        return;
      }
      
      await createInvoiceFromJob(job);
    };
    
    initializeInvoice();
  }, [jobId]);

  const handlePrintOrPDF = useReactToPrint({
    documentTitle: `Invoice_${invoice?.invoice_number || "Draft"}`,
    onAfterPrint: () => {
      setIsPrintReady(false);
    },
  });

  const handleAddLineItem = () => {
    if (!newItemDescription) {
      toast.error("Description is required");
      return;
    }
    
    addLineItem(newItemDescription, newItemQuantity, newItemPrice);
    setNewItemDescription("");
    setNewItemQuantity(1);
    setNewItemPrice(0);
  };

  const handleSaveInvoice = async () => {
    const result = await saveInvoice();
    if (result) {
      toast.success("Invoice saved successfully");
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

  const handleUpdateStatus = async (status: "Draft" | "Sent" | "Paid" | "Overdue") => {
    if (!invoice) return;
    
    const updatedInvoice = {
      ...invoice,
      status
    };
    
    setInvoice(updatedInvoice);
    
    if (status === "Sent") {
      toast.success("Invoice marked as sent");
    } else if (status === "Paid") {
      toast.success("Invoice marked as paid");
    }
    
    await saveInvoice();
  };

  if (loading && !invoice) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto">
        <div className="flex justify-center items-center h-64">
          <p className="text-muted-foreground">Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto">
        <Button variant="ghost" onClick={() => navigate("/job-cards")} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Job Cards
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Invoice Creation Failed</CardTitle>
            <CardDescription>
              Unable to create invoice. Please try again.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => navigate("/job-cards")}>Return to Job Cards</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Printable Invoice Component
  const PrintableInvoice = () => (
    <div className="p-6 bg-white">
      <div className="border-2 border-gray-200 p-6">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold">INVOICE</h1>
            <p className="text-lg font-medium">{invoice.invoice_number}</p>
          </div>
          <div className="text-right">
            <p><strong>Issue Date:</strong> {format(new Date(invoice.issue_date), "MMMM d, yyyy")}</p>
            <p><strong>Due Date:</strong> {format(new Date(invoice.due_date), "MMMM d, yyyy")}</p>
            <p className="mt-2">
              <span className="px-3 py-1 rounded-full bg-gray-200 text-gray-800 font-medium">
                {invoice.status}
              </span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <div>
            <h2 className="text-lg font-semibold border-b mb-2">Bill To</h2>
            <p>{invoice.bill_description}</p>
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
              {invoice.line_items.map((item) => (
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
              <span>{formatCurrency(invoice.subtotal)}</span>
            </div>
            {invoice.taxes.map((tax, index) => (
              <div key={index} className="flex justify-between border-b py-2">
                <span>{tax.name} ({tax.rate}%)</span>
                <span>{formatCurrency(tax.amount)}</span>
              </div>
            ))}
            <div className="flex justify-between font-bold text-lg py-2">
              <span>Total</span>
              <span>{formatCurrency(invoice.total)}</span>
            </div>
          </div>
        </div>

        {invoice.notes && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold border-b mb-2">Notes</h2>
            <p>{invoice.notes}</p>
          </div>
        )}

        {invoice.terms && (
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
                <span className="px-3 py-1 rounded-full bg-gray-200 text-gray-800 font-medium">
                  {invoice.status}
                </span>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Amount</p>
              <p className="text-xl font-bold">{formatCurrency(invoice.total)}</p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col items-stretch gap-2">
            <Button className="w-full" onClick={handleSaveInvoice}>
              <Save className="mr-2 h-4 w-4" />
              Save Invoice
            </Button>
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
              onClick={() => handleUpdateStatus("Sent")}
              disabled={invoice.status === "Sent"}
            >
              <Send className="mr-2 h-4 w-4" />
              Mark as Sent
            </Button>
            <Button
              className="w-full"
              variant="default"
              onClick={() => handleUpdateStatus("Paid")}
              disabled={invoice.status === "Paid"}
            >
              <FileText className="mr-2 h-4 w-4" />
              Mark as Paid
            </Button>
          </CardFooter>
        </Card>

        {/* Invoice Details */}
        <div className="md:col-span-2">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Invoice Details</CardTitle>
              <CardDescription>Basic information about this invoice</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="issue-date">Issue Date</Label>
                  <Input
                    id="issue-date"
                    type="date"
                    value={invoice.issue_date}
                    onChange={(e) => setInvoice({...invoice, issue_date: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="due-date">Due Date</Label>
                  <Input
                    id="due-date"
                    type="date"
                    value={invoice.due_date}
                    onChange={(e) => setInvoice({...invoice, due_date: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bill-description">Bill To</Label>
                <Textarea
                  id="bill-description"
                  value={invoice.bill_description}
                  onChange={(e) => setInvoice({...invoice, bill_description: e.target.value})}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Line Items</CardTitle>
                <CardDescription>Products and services in this invoice</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoice.line_items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Input
                          value={item.description}
                          onChange={(e) => updateLineItem(item.id, { description: e.target.value })}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateLineItem(item.id, { quantity: parseInt(e.target.value) || 1 })}
                          className="text-right w-20 ml-auto"
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unit_price}
                          onChange={(e) => updateLineItem(item.id, { unit_price: parseFloat(e.target.value) || 0 })}
                          className="text-right w-24 ml-auto"
                        />
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(item.amount)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeLineItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              <div className="mt-4 space-y-4">
                <div className="grid gap-4 sm:grid-cols-[1fr_100px_120px_auto]">
                  <div>
                    <Input
                      placeholder="Description"
                      value={newItemDescription}
                      onChange={(e) => setNewItemDescription(e.target.value)}
                    />
                  </div>
                  <div>
                    <Input
                      type="number"
                      min="1"
                      placeholder="Qty"
                      value={newItemQuantity}
                      onChange={(e) => setNewItemQuantity(parseInt(e.target.value) || 1)}
                    />
                  </div>
                  <div>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Price"
                      value={newItemPrice}
                      onChange={(e) => setNewItemPrice(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Button onClick={handleAddLineItem}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Item
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Taxes & Totals</CardTitle>
              <CardDescription>Tax calculations and final amount</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="font-medium">Subtotal:</span>
                  <span>{formatCurrency(invoice.subtotal)}</span>
                </div>
                
                {invoice.taxes.map((tax, index) => (
                  <div key={index} className="flex justify-between items-center border-b pb-2">
                    <div className="flex items-center gap-2">
                      <Input
                        value={tax.name}
                        onChange={(e) => updateTax(index, { name: e.target.value })}
                        className="w-24 h-8"
                      />
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={tax.rate}
                        onChange={(e) => updateTax(index, { rate: parseFloat(e.target.value) || 0 })}
                        className="w-16 h-8"
                      />
                      <span>%</span>
                    </div>
                    <span>{formatCurrency(tax.amount)}</span>
                  </div>
                ))}
                
                <div className="flex justify-between items-center border-b pb-2 pt-2 font-bold text-lg">
                  <span>Total:</span>
                  <span>{formatCurrency(invoice.total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
              <CardDescription>Notes and terms for this invoice</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any additional notes here..."
                  value={invoice.notes || ""}
                  onChange={(e) => setInvoice({...invoice, notes: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="terms">Terms & Conditions</Label>
                <Textarea
                  id="terms"
                  placeholder="Add terms and conditions here..."
                  value={invoice.terms || ""}
                  onChange={(e) => setInvoice({...invoice, terms: e.target.value})}
                />
              </div>
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

export default CreateInvoice;
