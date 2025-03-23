import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
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

// Function to generate a clean HTML structure for the invoice
const generateInvoiceHTML = (invoice: Invoice) => {
  const companyLogo = localStorage.getItem("companyLogo") || "/default-logo.png";

  return `
    <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto;">
      <div style="text-align: center; border-bottom: 1px solid #e5e7eb; padding-bottom: 20px; margin-bottom: 20px;">
        <h1 style="font-size: 24px; font-weight: bold; color: #111827; margin: 0;">Invoice #${invoice.invoice_number}</h1>
        <p style="color: #6b7280; font-size: 14px; margin-top: 4px;">Issued on ${format(new Date(invoice.issue_date), "MMM d, yyyy")}</p>
      </div>

      <div style="margin-bottom: 20px;">
        <h2 style="font-size: 18px; font-weight: bold; color: #111827; margin-bottom: 10px;">Bill To:</h2>
        <p style="color: #374151; margin: 0;">${invoice.bill_to}</p>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <thead>
          <tr style="background-color: #f9fafb;">
            <th style="padding: 12px 8px; text-align: left; font-weight: 600; color: #374151;">Description</th>
            <th style="padding: 12px 8px; text-align: left; font-weight: 600; color: #374151;">Quantity</th>
            <th style="padding: 12px 8px; text-align: left; font-weight: 600; color: #374151;">Unit Price</th>
            <th style="padding: 12px 8px; text-align: right; font-weight: 600; color: #374151;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${invoice.items
            .map(
              (item) => `
            <tr>
              <td style="padding: 12px 8px; text-align: left; border-bottom: 1px solid #e5e7eb;">${item.description}</td>
              <td style="padding: 12px 8px; text-align: left; border-bottom: 1px solid #e5e7eb;">${item.quantity}</td>
              <td style="padding: 12px 8px; text-align: left; border-bottom: 1px solid #e5e7eb;">${formatCurrency(item.unit_price)}</td>
              <td style="padding: 12px 8px; text-align: right; border-bottom: 1px solid #e5e7eb;">${formatCurrency(item.total)}</td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>

      <div style="text-align: right;">
        <p style="font-size: 16px; font-weight: bold; color: #111827;">Total: ${formatCurrency(invoice.total)}</p>
      </div>

      <div style="margin-top: 30px; text-align: center; color: #6b7280; font-size: 12px;">
        <p>This invoice was generated from your invoice management system.</p>
      </div>
    </div>
  `;
};

const Invoices = () => {
  const navigate = useNavigate();
  const { invoices, loading } = useInvoices();
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  useEffect(() => {
    // Apply filters whenever search query or status filter changes
    let filtered = [...invoices];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (invoice) =>
          invoice.invoice_number?.toLowerCase().includes(query) ||
          invoice.bill_description.toLowerCase().includes(query)
      );
    }

    if (statusFilter) {
      filtered = filtered.filter((invoice) => invoice.status === statusFilter);
    }

    setFilteredInvoices(filtered);
  }, [searchQuery, statusFilter, invoices]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleStatusFilter = (status: string) => {
    if (statusFilter === status) {
      setStatusFilter("");
    } else {
      setStatusFilter(status);
    }
  };

  // Function to handle save as PDF
  const handleSaveAsPDF = async (invoice: Invoice) => {
    const invoiceHTML = generateInvoiceHTML(invoice);

    // Create a hidden div for the invoice content
    const printContent = document.createElement("div");
    printContent.style.position = "absolute";
    printContent.style.left = "-9999px"; // Move off-screen
    printContent.style.width = "800px"; // Fixed width for consistent rendering
    printContent.innerHTML = invoiceHTML;

    // Append the hidden div to the document
    document.body.appendChild(printContent);

    // Wait for images to load (if any)
    const images = printContent.querySelectorAll("img");
    const imagePromises = Array.from(images).map(
      (img) =>
        new Promise((resolve) => {
          if (img.complete) resolve(true);
          else img.onload = resolve;
        })
    );

    await Promise.all(imagePromises);

    // Capture the hidden div as an image using html2canvas
    const canvas = await html2canvas(printContent, {
      scale: 3, // Higher scale for better quality
      useCORS: true, // Allow cross-origin images (e.g., company logo)
      logging: true, // Enable logging for debugging
    });

    // Remove the hidden div from the document
    document.body.removeChild(printContent);

    // Convert the canvas to an image
    const imgData = canvas.toDataURL("image/png", 1.0);

    // Create a new PDF
    const pdf = new jsPDF("p", "mm", "a4");
    const imgWidth = 210; // A4 width in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // Add the image to the PDF
    pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);

    // Save the PDF
    pdf.save(`invoice-${invoice.invoice_number}.pdf`);
  };

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
              <CardTitle>Invoices</CardTitle>
              <CardDescription>Manage and track all your invoices</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search invoices..."
                  className="pl-10 w-full md:w-[300px]"
                  value={searchQuery}
                  onChange={handleSearch}
                />
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            <Button
              variant={statusFilter === "Draft" ? "default" : "outline"}
              size="sm"
              onClick={() => handleStatusFilter("Draft")}
              className="flex items-center gap-1"
            >
              <Filter className="h-3 w-3" />
              Draft
            </Button>
            <Button
              variant={statusFilter === "Sent" ? "default" : "outline"}
              size="sm"
              onClick={() => handleStatusFilter("Sent")}
              className="flex items-center gap-1"
            >
              <Filter className="h-3 w-3" />
              Sent
            </Button>
            <Button
              variant={statusFilter === "Paid" ? "default" : "outline"}
              size="sm"
              onClick={() => handleStatusFilter("Paid")}
              className="flex items-center gap-1"
            >
              <Filter className="h-3 w-3" />
              Paid
            </Button>
            <Button
              variant={statusFilter === "Overdue" ? "default" : "outline"}
              size="sm"
              onClick={() => handleStatusFilter("Overdue")}
              className="flex items-center gap-1"
            >
              <Filter className="h-3 w-3" />
              Overdue
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <p className="text-muted-foreground">Loading invoices...</p>
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="text-center py-6">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No invoices found</h3>
              <p className="text-muted-foreground mt-1">
                {searchQuery || statusFilter
                  ? "Try a different search or filter"
                  : "Create your first invoice from a job card"}
              </p>
            </div>
          ) : (
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
                  {filteredInvoices.map((invoice) => (
                    <TableRow
                      key={invoice.id}
                      className="cursor-pointer"
                      onClick={() => handleSaveAsPDF(invoice)} // Generate PDF when clicking on a row
                    >
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
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Invoices;
