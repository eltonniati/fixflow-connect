
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { Invoice } from "@/lib/types";
import { StatusBadge } from "./StatusBadge";
import { formatCurrency } from "./InvoiceActions";

interface InvoiceDetailsProps {
  invoice: Invoice;
}

export const InvoiceDetails = ({ invoice }: InvoiceDetailsProps) => {
  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle>Invoice #{invoice.invoice_number}</CardTitle>
          <CardDescription>
            Created on {format(new Date(invoice.created_at!), "MMMM d, yyyy")}
          </CardDescription>
        </div>
        <StatusBadge status={invoice.status} />
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
              {invoice.line_items.map((item, idx) => (
                <TableRow key={idx}>
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
  );
};
