import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useReactToPrint } from "react-to-print";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter 
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  ArrowLeft, 
  Plus, 
  Save, 
  Trash2, 
  Printer,
  FileText 
} from "lucide-react";
import { toast } from "sonner";
import { useJobs } from "@/hooks/use-jobs";
import { useInvoiceDetails } from "@/hooks/use-invoice-details";
import { useCompanies } from "@/hooks/use-companies";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Job, Company, InvoiceLineItem, InvoiceTax } from "@/lib/types";

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
  }).format(amount);
};

const InvoiceForm = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { getJob } = useJobs();
  const { createInvoiceFromJob, invoice, addLineItem, updateLineItem, removeLineItem, updateInvoice, saveInvoice } = useInvoiceDetails();
  const { companies } = useCompanies();
  
  const [job, setJob] = useState<Job | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [newItemDescription, setNewItemDescription] = useState("");
  const [newItemQuantity, setNewItemQuantity] = useState(1);
  const [newItemUnitPrice, setNewItemUnitPrice] = useState(0);
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);
  const [isPrintReady, setIsPrintReady] = useState(false);
  
  const invoiceRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const loadData = async () => {
      if (!jobId) return;
      
      const jobData = await getJob(jobId);
      if (!jobData) {
        toast.error("Job not found");
        navigate("/job-cards");
        return;
      }
      
      setJob(jobData);
      
      if (companies.length > 0) {
        setCompany(companies[0]);
      }
      
      const invoiceData = await createInvoiceFromJob(jobData);
      if (!invoiceData) {
        toast.error("Failed to create invoice");
      }
      
      setLoading(false);
    };
    
    loadData();
  }, [jobId, companies.length]);
  
  const handleAddLineItem = () => {
    if (!newItemDescription || newItemQuantity <= 0 || newItemUnitPrice <= 0) {
      toast.error("Please fill in all fields for the new item");
      return;
    }
    
    addLineItem(newItemDescription, newItemQuantity, newItemUnitPrice);
    
    setNewItemDescription("");
    setNewItemQuantity(1);
    setNewItemUnitPrice(0);
  };
  
  const handleUpdateLineItem = (id: string, field: keyof InvoiceLineItem, value: string | number) => {
    const updates: Partial<InvoiceLineItem> = {};
    
    if (field === 'quantity' || field === 'unit_price') {
      updates[field] = Number(value);
    } else if (field === 'description') {
      updates[field] = value as string;
    }
    
    updateLineItem(id, updates);
  };
  
  const handleSaveInvoice = async () => {
    if (!invoice) return;
    
    setSaving(true);
    try {
      const result = await saveInvoice();
      if (result) {
        toast.success("Invoice saved successfully");
        navigate(`/invoices/${result.id}`);
      } else {
        toast.error("Failed to save invoice");
      }
    } catch (error) {
      console.error("Error saving invoice:", error);
      toast.error("An error occurred while saving the invoice");
    } finally {
      setSaving(false);
    }
  };
  
  const handlePrintInvoice = useReactToPrint({
    documentTitle: `Invoice_${invoice?.invoice_number || "draft"}`,
    onBeforePrint: () => {
      setIsPrintReady(true);
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          resolve();
        }, 200);
      });
    },
    onAfterPrint: () => {
      setIsPrintReady(false);
      toast.success("Invoice printed/saved successfully");
    },
    onPrintError: (error) => {
      console.error("Print error:", error);
      toast.error("Failed to print invoice");
      setIsPrintReady(false);
    },
    contentRef: invoiceRef
  });
  
  const handlePrint = () => {
    setIsPrintDialogOpen(false);
    if (invoiceRef.current) {
      handlePrintInvoice();
    } else {
      toast.error("Print content not ready");
    }
  };
  
  if (loading || !invoice) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto">
        <div className="flex justify-center items-center h-64">
          <p className="text-muted-foreground">Loading invoice form...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto">
      <Button
        variant="ghost"
        onClick={() => navigate(-1)}
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>
      
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Create Invoice</h1>
        <p className="text-muted-foreground">for Job Card #{job?.job_card_number}</p>
      </div>
      
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Invoice Details</CardTitle>
              <CardDescription>Enter invoice information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="invoice-number">Invoice Number</Label>
                  <Input
                    id="invoice-number"
                    value={invoice?.invoice_number || ''}
                    readOnly
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invoice-status">Status</Label>
                  <Select
                    value={invoice.status}
                    onValueChange={(value) => updateInvoice(invoice.id!, { status: value as any })}
                  >
                    <SelectTrigger id="invoice-status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Draft">Draft</SelectItem>
                      <SelectItem value="Sent">Sent</SelectItem>
                      <SelectItem value="Paid">Paid</SelectItem>
                      <SelectItem value="Overdue">Overdue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="issue-date">Issue Date</Label>
                  <Input
                    id="issue-date"
                    type="date"
                    value={invoice.issue_date}
                    onChange={(e) => updateInvoice(invoice.id!, { issue_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="due-date">Due Date</Label>
                  <Input
                    id="due-date"
                    type="date"
                    value={invoice.due_date}
                    onChange={(e) => updateInvoice(invoice.id!, { due_date: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={invoice.bill_description}
                  onChange={(e) => updateInvoice(invoice.id!, { bill_description: e.target.value })}
                  placeholder="Invoice description..."
                />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Line Items</CardTitle>
              <CardDescription>Add items to this invoice</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[300px]">Description</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right w-[70px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoice.line_items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Input
                          value={item.description}
                          onChange={(e) => handleUpdateLineItem(item.id, 'description', e.target.value)}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleUpdateLineItem(item.id, 'quantity', e.target.value)}
                          className="w-20 ml-auto"
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unit_price}
                          onChange={(e) => handleUpdateLineItem(item.id, 'unit_price', e.target.value)}
                          className="w-24 ml-auto"
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
                  
                  <TableRow>
                    <TableCell>
                      <Input
                        placeholder="Description"
                        value={newItemDescription}
                        onChange={(e) => setNewItemDescription(e.target.value)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        min="1"
                        value={newItemQuantity}
                        onChange={(e) => setNewItemQuantity(Number(e.target.value))}
                        className="w-20 ml-auto"
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={newItemUnitPrice}
                        onChange={(e) => setNewItemUnitPrice(Number(e.target.value))}
                        className="w-24 ml-auto"
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(newItemQuantity * newItemUnitPrice)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleAddLineItem}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter className="flex justify-end border-t pt-4">
              <div className="space-y-1 text-right min-w-40">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(invoice.subtotal)}</span>
                </div>
                {invoice.taxes.map((tax, index) => (
                  <div key={index} className="flex justify-between">
                    <span>{tax.name} ({tax.rate}%):</span>
                    <span>{formatCurrency(tax.amount)}</span>
                  </div>
                ))}
                <div className="flex justify-between font-bold">
                  <span>Total:</span>
                  <span>{formatCurrency(invoice.total)}</span>
                </div>
              </div>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={invoice.notes || ''}
                  onChange={(e) => updateInvoice(invoice.id!, { notes: e.target.value })}
                  placeholder="Any additional notes..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="terms">Terms & Conditions</Label>
                <Textarea
                  id="terms"
                  value={invoice.terms || ''}
                  onChange={(e) => updateInvoice(invoice.id!, { terms: e.target.value })}
                  placeholder="Payment terms and conditions..."
                />
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Actions</CardTitle>
            <CardDescription>Save or print your invoice</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              className="w-full"
              onClick={handleSaveInvoice}
              disabled={saving}
            >
              <Save className="mr-2 h-4 w-4" />
              Save Invoice
            </Button>
            <Button
              className="w-full"
              variant="outline"
              onClick={() => setIsPrintDialogOpen(true)}
            >
              <Printer className="mr-2 h-4 w-4" />
              Print Preview
            </Button>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="rounded-md bg-muted p-4 text-sm">
              <div className="font-medium">Summary</div>
              <div className="mt-2">
                <div className="flex justify-between">
                  <span>Invoice #:</span>
                  <span>{invoice.invoice_number}</span>
                </div>
                <div className="flex justify-between">
                  <span>Date:</span>
                  <span>{format(new Date(invoice.issue_date), "MMM d, yyyy")}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Amount:</span>
                  <span>{formatCurrency(invoice.total)}</span>
                </div>
              </div>
            </div>
          </CardFooter>
        </Card>
      </div>
      
      <Dialog open={isPrintDialogOpen} onOpenChange={setIsPrintDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Print Invoice</DialogTitle>
          </DialogHeader>
          <p>Print or save this invoice as a PDF?</p>
          <DialogFooter>
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
      
      <div 
        ref={invoiceRef} 
        className={isPrintReady ? "print-content" : "hidden print-content"}
      >
        {isPrintReady && (
          <div className="p-6 max-w-4xl mx-auto bg-white">
            <div className="border-2 border-gray-200 p-6">
              <div className="flex justify-between">
                <div>
                  <h1 className="text-3xl font-bold">INVOICE</h1>
                  <p className="text-lg">#{invoice.invoice_number}</p>
                </div>
                <div className="text-right">
                  <p><strong>Date:</strong> {format(new Date(invoice.issue_date), "MMMM d, yyyy")}</p>
                  <p><strong>Due:</strong> {format(new Date(invoice.due_date), "MMMM d, yyyy")}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-6 my-8">
                <div>
                  <h2 className="font-semibold border-b mb-2">From</h2>
                  <p>{company?.name || "Your Company"}</p>
                  <p>{company?.address || "Company Address"}</p>
                  <p>{company?.phone || "Phone Number"}</p>
                  <p>{company?.email || "Email Address"}</p>
                </div>
                <div>
                  <h2 className="font-semibold border-b mb-2">To</h2>
                  <p>{job?.customer.name}</p>
                  <p>{job?.customer.phone}</p>
                  {job?.customer.email && <p>{job.customer.email}</p>}
                </div>
              </div>
              
              <div className="my-8">
                <h2 className="font-semibold border-b mb-2">Job Details</h2>
                <p><strong>Job Card:</strong> #{job?.job_card_number}</p>
                <p><strong>Device:</strong> {job?.device.name} {job?.device.model}</p>
              </div>
              
              <div className="my-8">
                <h2 className="font-semibold border-b mb-2">Items</h2>
                <table className="w-full mt-4">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left pb-2">Description</th>
                      <th className="text-right pb-2">Quantity</th>
                      <th className="text-right pb-2">Unit Price</th>
                      <th className="text-right pb-2">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.line_items.map((item, index) => (
                      <tr key={index} className="border-b">
                        <td className="py-2">{item.description}</td>
                        <td className="text-right py-2">{item.quantity}</td>
                        <td className="text-right py-2">{formatCurrency(item.unit_price)}</td>
                        <td className="text-right py-2">{formatCurrency(item.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                <div className="flex justify-end mt-4">
                  <div className="space-y-1 text-right w-48">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>{formatCurrency(invoice.subtotal)}</span>
                    </div>
                    {invoice.taxes.map((tax, index) => (
                      <div key={index} className="flex justify-between">
                        <span>{tax.name} ({tax.rate}%):</span>
                        <span>{formatCurrency(tax.amount)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between font-bold border-t pt-1">
                      <span>Total:</span>
                      <span>{formatCurrency(invoice.total)}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {invoice.notes && (
                <div className="my-8">
                  <h2 className="font-semibold border-b mb-2">Notes</h2>
                  <p>{invoice.notes}</p>
                </div>
              )}
              
              {invoice.terms && (
                <div className="my-8">
                  <h2 className="font-semibold border-b mb-2">Terms & Conditions</h2>
                  <p>{invoice.terms}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoiceForm;
