
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "./StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Printer, Send, CheckCircle, FileText } from "lucide-react";
import { format } from "date-fns";
import { Invoice } from "@/lib/types";

interface InvoiceActionsProps {
  invoice: Invoice;
  onPrint: () => void;
  onStatusChange: (status: "Draft" | "Sent" | "Paid" | "Overdue") => void;
}

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-ZA", {
    style: 'currency',
    currency: 'ZAR',
  }).format(amount);
};

export const InvoiceActions = ({ invoice, onPrint, onStatusChange }: InvoiceActionsProps) => {
  return (
    <Card>
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
            <StatusBadge status={invoice.status} />
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
          onClick={onPrint}
        >
          <Printer className="mr-2 h-4 w-4" />
          Print Invoice
        </Button>
        <Button
          className="w-full"
          variant="secondary"
          onClick={() => onStatusChange("Sent")}
          disabled={invoice.status === "Sent"}
        >
          <Send className="mr-2 h-4 w-4" />
          Mark as Sent
        </Button>
        <Button
          className="w-full"
          variant="default"
          onClick={() => onStatusChange("Paid")}
          disabled={invoice.status === "Paid"}
        >
          <CheckCircle className="mr-2 h-4 w-4" />
          Mark as Paid
        </Button>
        <Button
          className="w-full"
          variant="destructive"
          onClick={() => onStatusChange("Overdue")}
          disabled={invoice.status === "Overdue"}
        >
          <FileText className="mr-2 h-4 w-4" />
          Mark as Overdue
        </Button>
      </CardFooter>
    </Card>
  );
};
