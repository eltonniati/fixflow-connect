import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Search, FileText, Filter, Printer, Mail, MessageCircle } from "lucide-react";
import { useInvoices } from "@/hooks/use-invoices";
import { Invoice } from "@/lib/types";
import { useReactToPrint } from "react-to-print";
import { toast } from "sonner";

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

const Invoices = () => {
  const navigate = useNavigate();
  const { invoices, loading } = useInvoices();
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const printableTableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Apply filters whenever search query or status filter changes
    let filtered = [...invoices];
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        invoice => 
          invoice.invoice_number?.toLowerCase().includes(query) || 
          invoice.bill_description.toLowerCase().includes(query)
      );
    }
    
    if (statusFilter) {
      filtered = filtered.filter(invoice => invoice.status === statusFilter);
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

  const handlePrint = useReactToPrint({
    content: () => printableTableRef.current,
    documentTitle: "Invoices",
    onAfterPrint: () => {
      toast.success("Invoices printed successfully");
    },
    onPrintError: (error) => {
      console.error("Print error:", error);
      toast.error("Failed to print invoices");
    },
  });

  const handleSendEmail = () => {
    // Implement email sending logic here
    toast.info("Sending invoice via email...");
  };

  const handleSendWhatsApp = () => {
    // Implement WhatsApp sending logic here
    toast.info("Sending invoice via WhatsApp...");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto">
      {/* Add print-specific styles directly in the component */}
      <style>
        {`
          @media print {
            body * {
              visibility: hidden;
            }
            
            .printable-content, .printable-content * {
              visibility: visible;
            }
            
            .printable-content {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              margin: 0;
              padding: 0;
              font-family: Arial, sans-serif;
              color: #333;
            }
            
            .printable-content .invoice-header {
              text-align: center;
              margin-bottom: 20px;
              padding: 20px;
              background-color: #f5f5f5;
              border-radius: 8px;
            }
            
            .printable-content .invoice-header h1 {
              font-size: 24px;
              font-weight: bold;
              margin: 0;
              color: #333;
            }
            
            .printable-content .invoice-header p {
              font-size: 14px;
              color: #666;
              margin: 0;
            }
            
            .printable-content table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            
            .printable-content th, .printable-content td {
              border: 1px solid #ddd;
              padding: 10px;
              text-align: left;
            }
            
            .printable-content th {
              background-color: #333;
              color: #fff;
              font-weight: bold;
            }
            
            .printable-content tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            
            .printable-content .footer {
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
              <div className="w-full md:w-auto">
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
                <div ref={printableTableRef} className="printable-content">
                  <div className="invoice-header">
                    <h1>Invoice List</h1>
                    <p>Generated on: {format(new Date(), "MMM d, yyyy")}</p>
                  </div>
                  <table>
                    <thead>
                      <tr>
                        <th>Invoice #</th>
                        <th>Date</th>
                        <th>Description</th>
                        <th>Status</th>
                        <th className="text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredInvoices.map((invoice) => (
                        <tr key={invoice.id}>
                          <td className="font-medium">{invoice.invoice_number}</td>
                          <td>{format(new Date(invoice.issue_date), "MMM d, yyyy")}</td>
                          <td>{invoice.bill_description}</td>
                          <td>
                            <Badge className={getStatusColor(invoice.status)}>
                              {invoice.status}
                            </Badge>
                          </td>
                          <td className="text-right">{formatCurrency(invoice.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="footer">
                    <p>Thank you for your business!</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Print and Send Buttons */}
        <div className="mt-6 no-print flex gap-4">
          <Button onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print Invoices
          </Button>
          <Button onClick={handleSendEmail}>
            <Mail className="mr-2 h-4 w-4" />
            Send via Email
          </Button>
          <Button onClick={handleSendWhatsApp}>
            <MessageCircle className="mr-2 h-4 w-4" />
            Send via WhatsApp
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Invoices;
