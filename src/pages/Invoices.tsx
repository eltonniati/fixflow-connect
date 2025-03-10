import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Search, FileText, Filter, Printer } from "lucide-react";
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

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto">
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
              border: none;
              box-shadow: none;
              font-family: Arial, sans-serif;
            }
            
            .printable-content table {
              width: 100%;
              border-collapse: collapse;
            }
            
            .printable-content th, .printable-content td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
            }
            
            .printable-content th {
              background-color: #f5f5f5;
              font-weight: bold;
            }
            
            .printable-content .print-header {
              text-align: center;
              margin-bottom: 20px;
            }
            
            .printable-content .print-header h1 {
              font-size: 24px;
              margin: 0;
            }
            
            .printable-content .print-header p {
              font-size: 14px;
              color: #666;
              margin: 0;
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
                  <div className="print-header">
                    <h1>Invoices</h1>
                    <p>Generated on: {format(new Date(), "MMM d, yyyy")}</p>
                  </div>
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
                        <TableRow key={invoice.id}>
                          <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                          <TableCell>{format(new Date(invoice.issue_date), "MMM d, yyyy")}</TableCell>
                          <TableCell>{invoice.bill_description}</TableCell>
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
              </div>
            )}
          </CardContent>
        </Card>

        {/* Print Button */}
        <div className="mt-6 no-print">
          <Button onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print Invoices
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Invoices;
