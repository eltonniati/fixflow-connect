import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Search, FileText, Filter } from "lucide-react";
import { useInvoices } from "@/hooks/use-invoices";
import { Invoice } from "@/lib/types";
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";

// Set up pdfMake fonts
pdfMake.vfs = pdfFonts.pdfMake.vfs;

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

// Function to handle save as PDF using pdfmake
const handleSaveAsPDF = (invoice: Invoice) => {
  const docDefinition = {
    content: [
      // Invoice Header
      {
        text: `Invoice #${invoice.invoice_number}`,
        style: "header",
      },
      {
        text: `Issued on ${format(new Date(invoice.issue_date), "MMM d, yyyy")}`,
        style: "subheader",
      },
      // Bill To Section
      {
        text: "Bill To:",
        style: "sectionHeader",
      },
      {
        text: invoice.bill_to,
        margin: [0, 5, 0, 15],
      },
      // Items Table
      {
        table: {
          headerRows: 1,
          widths: ["*", "auto", "auto", "auto"], // Flexible column widths
          body: [
            [
              { text: "Description", style: "tableHeader", alignment: "left" },
              { text: "Quantity", style: "tableHeader", alignment: "left" },
              { text: "Unit Price", style: "tableHeader", alignment: "left" },
              { text: "Amount", style: "tableHeader", alignment: "right" },
            ],
            ...invoice.items.map((item) => [
              { text: item.description, alignment: "left" },
              { text: item.quantity, alignment: "left" },
              { text: formatCurrency(item.unit_price), alignment: "left" },
              { text: formatCurrency(item.total), alignment: "right" },
            ]),
          ],
        },
        layout: "lightHorizontalLines", // Adds horizontal lines between rows
      },
      // Total
      {
        text: `Total: ${formatCurrency(invoice.total)}`,
        style: "total",
        alignment: "right",
      },
      // Footer Note
      {
        text: "This invoice was generated from your invoice management system.",
        style: "footer",
        alignment: "center",
      },
    ],
    styles: {
      header: {
        fontSize: 24,
        bold: true,
        margin: [0, 0, 0, 10],
      },
      subheader: {
        fontSize: 14,
        margin: [0, 0, 0, 20],
      },
      sectionHeader: {
        fontSize: 18,
        bold: true,
        margin: [0, 10, 0, 5],
      },
      tableHeader: {
        bold: true,
        fontSize: 13,
        color: "black",
        fillColor: "#f9fafb", // Light gray background for header row
      },
      total: {
        fontSize: 16,
        bold: true,
        margin: [0, 10, 0, 20],
      },
      footer: {
        fontSize: 12,
        margin: [0, 30, 0, 0],
      },
    },
    defaultStyle: {
      font: "Roboto", // Default font
    },
  };

  // Generate and download the PDF
  pdfMake.createPdf(docDefinition).download(`invoice-${invoice.invoice_number}.pdf`);
};

const Invoices = () => {
  const navigate = useNavigate();
  const { invoices, loading } = useInvoices();
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  // Filter invoices based on search query and status
  useEffect(() => {
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
