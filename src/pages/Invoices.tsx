import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Search, FileText, Filter, Printer, Download } from "lucide-react";
import { useInvoices } from "@/hooks/use-invoices";
import { Invoice } from "@/lib/types";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

// Helper function for currency formatting
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
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

// PDF Component
const InvoicePDF = ({ invoice }: { invoice: Invoice }) => {
  return (
    <div className="p-6 max-w-3xl mx-auto font-sans">
      {/* Header */}
      <div className="text-center border-b pb-4 mb-6">
        <img 
          src="/logo.png" 
          className="h-16 mx-auto mb-4"
          alt="Company Logo"
        />
        <h1 className="text-2xl font-bold">Invoice #{invoice.invoice_number}</h1>
        <div className="flex justify-center gap-4 mt-2 text-sm">
          <p>Issued: {format(new Date(invoice.issue_date), "MMM d, yyyy")}</p>
          <p>Due: {format(new Date(invoice.due_date), "MMM d, yyyy")}</p>
        </div>
      </div>

      {/* Bill To */}
      <div className="mb-8 grid grid-cols-2">
        <div>
          <h2 className="text-lg font-semibold mb-2">Bill To:</h2>
          <p className="text-gray-700">{invoice.bill_to}</p>
        </div>
        <div className="text-right">
          <div className="inline-block p-3 bg-gray-100 rounded-lg">
            <p className="font-semibold">Status:</p>
            <p className="text-blue-600">{invoice.status}</p>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <table className="w-full mb-8">
        <thead className="bg-gray-50">
          <tr>
            <th className="text-left p-3">Description</th>
            <th className="text-left p-3">Qty</th>
            <th className="text-left p-3">Unit Price</th>
            <th className="text-right p-3">Amount</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items.map((item, index) => (
            <tr key={index} className="border-t">
              <td className="p-3">{item.description}</td>
              <td className="p-3">{item.quantity}</td>
              <td className="p-3">{formatCurrency(item.unit_price)}</td>
              <td className="p-3 text-right">{formatCurrency(item.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="grid grid-cols-2 gap-4 max-w-md ml-auto">
        <div className="text-right">Subtotal:</div>
        <div className="text-right">{formatCurrency(invoice.subtotal)}</div>
        
        <div className="text-right">Tax ({invoice.tax_rate}%):</div>
        <div className="text-right">{formatCurrency(invoice.tax_amount)}</div>
        
        <div className="text-right font-bold">Total:</div>
        <div className="text-right font-bold">{formatCurrency(invoice.total)}</div>
      </div>

      {/* Footer */}
      <div className="mt-12 pt-4 border-t text-sm text-gray-600 text-center">
        <p>Thank you for your business!</p>
        <p>{invoice.company_name} • {invoice.company_address}</p>
      </div>
    </div>
  );
};

// PDF Generation Function
const generateInvoicePDF = async (invoice: Invoice) => {
  // Create temporary container
  const tempDiv = document.createElement("div");
  tempDiv.style.position = "absolute";
  tempDiv.style.left = "-9999px";
  tempDiv.style.width = "800px";
  
  // Render PDF component
  const pdfHTML = ReactDOMServer.renderToString(<InvoicePDF invoice={invoice} />);
  tempDiv.innerHTML = pdfHTML;
  document.body.appendChild(tempDiv);

  // Generate PDF
  const canvas = await html2canvas(tempDiv, {
    scale: 2,
    useCORS: true,
    logging: true,
  });

  const pdf = new jsPDF("p", "mm", "a4");
  const imgData = canvas.toDataURL("image/png");
  const imgWidth = 210; // A4 width in mm
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
  pdf.save(`invoice-${invoice.invoice_number}-${format(new Date(), "yyyyMMdd")}.pdf`);

  // Cleanup
  document.body.removeChild(tempDiv);
};

// Invoice Page Component
const InvoicePage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { invoices, loading } = useInvoices();
  const [invoice, setInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    const foundInvoice = invoices.find((inv) => inv.id === id);
    if (foundInvoice) setInvoice(foundInvoice);
  }, [id, invoices]);

  if (loading) return <div>Loading...</div>;
  if (!invoice) return <div>Invoice not found</div>;

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto">
      <Button variant="ghost" onClick={() => navigate("/dashboard")} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Invoice #{invoice.invoice_number}</CardTitle>
              <CardDescription>Manage and track this invoice</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => generateInvoicePDF(invoice)}
              >
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
              <Button variant="outline">
                <Printer className="mr-2 h-4 w-4" />
                Print
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* PDF Preview (hidden on screen) */}
          <div className="hidden print:block">
            <InvoicePDF invoice={invoice} />
          </div>

          {/* Interactive View (hidden in print) */}
          <div className="print:hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                    <TableCell>{format(new Date(invoice.issue_date), "MMM d, yyyy")}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{invoice.bill_description}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(invoice.status)}>
                        {invoice.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(invoice.total)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InvoicePage;
