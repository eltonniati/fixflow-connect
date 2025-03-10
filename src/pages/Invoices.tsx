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
  const printRef = useRef<HTMLDivElement>(null);

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

  // Function to handle printing
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const companyLogo = localStorage.getItem('companyLogo') || '/default-logo.png';
    
    // HTML content for the print window
    const printContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invoices Report</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f9f9f9;
            background-image: url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23d1d5db' fill-opacity='0.1' fill-rule='evenodd'/%3E%3C/svg%3E");
            background-attachment: fixed;
            background-position: center;
          }
          .report-container {
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            padding: 20px;
            max-width: 1000px;
            margin: 0 auto;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-bottom: 20px;
            border-bottom: 1px solid #e5e7eb;
            margin-bottom: 20px;
          }
          .logo {
            max-height: 60px;
            max-width: 200px;
          }
          .title {
            font-size: 24px;
            font-weight: bold;
            color: #111827;
            margin: 0;
          }
          .date {
            color: #6b7280;
            font-size: 14px;
            margin-top: 4px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          th, td {
            padding: 12px 8px;
            text-align: left;
            border-bottom: 1px solid #e5e7eb;
          }
          th {
            background-color: #f9fafb;
            font-weight: 600;
            color: #374151;
          }
          tr:hover {
            background-color: #f9fafb;
          }
          .status-badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 9999px;
            font-size: 12px;
            font-weight: 500;
          }
          .status-Draft {
            background-color: #f3f4f6;
            color: #374151;
          }
          .status-Sent {
            background-color: #dbeafe;
            color: #1e40af;
          }
          .status-Paid {
            background-color: #d1fae5;
            color: #065f46;
          }
          .status-Overdue {
            background-color: #fee2e2;
            color: #b91c1c;
          }
          .text-right {
            text-align: right;
          }
          .footer {
            margin-top: 30px;
            text-align: center;
            color: #6b7280;
            font-size: 12px;
          }
          @media print {
            body {
              background: none;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .report-container {
              box-shadow: none;
              max-width: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="report-container">
          <div class="header">
            <div>
              <h1 class="title">Invoices Report</h1>
              <p class="date">Generated on ${format(new Date(), "MMMM d, yyyy")}</p>
            </div>
            <img src="${companyLogo}" alt="Company Logo" class="logo" onerror="this.style.display='none'"/>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Date</th>
                <th>Description</th>
                <th>Status</th>
                <th class="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${filteredInvoices.map((invoice) => `
                <tr>
                  <td>${invoice.invoice_number}</td>
                  <td>${format(new Date(invoice.issue_date), "MMM d, yyyy")}</td>
                  <td>${invoice.bill_description}</td>
                  <td><span class="status-badge status-${invoice.status}">${invoice.status}</span></td>
                  <td class="text-right">${formatCurrency(invoice.total)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="footer">
            <p>This report was generated from your invoice management system.</p>
          </div>
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
              setTimeout(function() {
                window.close();
              }, 100);
            }, 500);
          }
        </script>
      </body>
      </html>
    `;
    
    printWindow.document.open();
    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  // Function to handle save as PDF
  const handleSaveAsPDF = () => {
    // Use the same print function but don't auto-close the window
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const companyLogo = localStorage.getItem('companyLogo') || '/default-logo.png';
    
    // HTML content for the print window (same as print but without auto-close)
    const printContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invoices Report</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f9f9f9;
            background-image: url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23d1d5db' fill-opacity='0.1' fill-rule='evenodd'/%3E%3C/svg%3E");
            background-attachment: fixed;
            background-position: center;
          }
          .report-container {
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            padding: 20px;
            max-width: 1000px;
            margin: 0 auto;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-bottom: 20px;
            border-bottom: 1px solid #e5e7eb;
            margin-bottom: 20px;
          }
          .logo {
            max-height: 60px;
            max-width: 200px;
          }
          .title {
            font-size: 24px;
            font-weight: bold;
            color: #111827;
            margin: 0;
          }
          .date {
            color: #6b7280;
            font-size: 14px;
            margin-top: 4px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          th, td {
            padding: 12px 8px;
            text-align: left;
            border-bottom: 1px solid #e5e7eb;
          }
          th {
            background-color: #f9fafb;
            font-weight: 600;
            color: #374151;
          }
          tr:hover {
            background-color: #f9fafb;
          }
          .status-badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 9999px;
            font-size: 12px;
            font-weight: 500;
          }
          .status-Draft {
            background-color: #f3f4f6;
            color: #374151;
          }
          .status-Sent {
            background-color: #dbeafe;
            color: #1e40af;
          }
          .status-Paid {
            background-color: #d1fae5;
            color: #065f46;
          }
          .status-Overdue {
            background-color: #fee2e2;
            color: #b91c1c;
          }
          .text-right {
            text-align: right;
          }
          .footer {
            margin-top: 30px;
            text-align: center;
            color: #6b7280;
            font-size: 12px;
          }
          .save-instructions {
            background-color: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            padding: 12px;
            margin: 24px auto;
            max-width: 500px;
            text-align: center;
          }
          .save-instructions h3 {
            margin-top: 0;
            color: #374151;
          }
          @media print {
            body {
              background: none;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .report-container {
              box-shadow: none;
              max-width: none;
            }
            .save-instructions {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="report-container">
          <div class="header">
            <div>
              <h1 class="title">Invoices Report</h1>
              <p class="date">Generated on ${format(new Date(), "MMMM d, yyyy")}</p>
            </div>
            <img src="${companyLogo}" alt="Company Logo" class="logo" onerror="this.style.display='none'"/>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Date</th>
                <th>Description</th>
                <th>Status</th>
                <th class="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${filteredInvoices.map((invoice) => `
                <tr>
                  <td>${invoice.invoice_number}</td>
                  <td>${format(new Date(invoice.issue_date), "MMM d, yyyy")}</td>
                  <td>${invoice.bill_description}</td>
                  <td><span class="status-badge status-${invoice.status}">${invoice.status}</span></td>
                  <td class="text-right">${formatCurrency(invoice.total)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="footer">
            <p>This report was generated from your invoice management system.</p>
          </div>
          
          <div class="save-instructions">
            <h3>Save as PDF Instructions</h3>
            <p>To save this report as a PDF:</p>
            <ol style="text-align: left; display: inline-block;">
              <li>Press Ctrl+P (Windows) or Cmd+P (Mac)</li>
              <li>Select "Save as PDF" as the destination</li>
              <li>Click "Save"</li>
            </ol>
            <p>This message won't appear in the saved PDF.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    printWindow.document.open();
    printWindow.document.write(printContent);
    printWindow.document.close();
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
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={handlePrint}
                  title="Print"
                >
                  <Printer className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={handleSaveAsPDF}
                  title="Save as PDF"
                >
                  <Download className="h-4 w-4" />
                </Button>
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
          <div ref={printRef}>
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
                      <TableHead className="print:hidden"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInvoices.map((invoice) => (
                      <TableRow 
                        key={invoice.id}
                        className="cursor-pointer"
                        onClick={() => navigate(`/invoices/${invoice.id}`)}
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
                        <TableCell className="print:hidden">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/invoices/${invoice.id}`);
                            }}
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add print-specific styles */}
      <style jsx global>{`
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
          }
          .print-hide {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Invoices;
