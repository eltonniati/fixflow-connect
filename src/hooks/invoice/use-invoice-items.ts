
import { v4 as uuidv4 } from "uuid";
import { Invoice, InvoiceLineItem, InvoiceTax } from "@/lib/types";
import { calculateInvoiceTotals } from "@/lib/invoice-utils";

export function useInvoiceItems() {
  const addLineItem = (invoice: Invoice, description: string, quantity: number, unitPrice: number): Invoice => {
    if (!invoice) return invoice;

    const newItem: InvoiceLineItem = {
      id: uuidv4(),
      description,
      quantity,
      unit_price: unitPrice,
      amount: quantity * unitPrice
    };

    const updatedLineItems = [...invoice.line_items, newItem];
    const { subtotal, tax_total, total, taxes } = calculateInvoiceTotals(updatedLineItems, invoice.taxes);

    return {
      ...invoice,
      line_items: updatedLineItems,
      subtotal,
      tax_total,
      bill_amount: subtotal,
      total,
      taxes
    };
  };

  const updateLineItem = (invoice: Invoice, id: string, updates: Partial<InvoiceLineItem>): Invoice => {
    if (!invoice) return invoice;

    const updatedLineItems = invoice.line_items.map(item => {
      if (item.id === id) {
        const updatedItem = {
          ...item,
          ...updates
        };
        // Recalculate amount if quantity or unit_price changed
        if (updates.quantity !== undefined || updates.unit_price !== undefined) {
          updatedItem.amount = (updates.quantity ?? item.quantity) * (updates.unit_price ?? item.unit_price);
        }
        return updatedItem;
      }
      return item;
    });

    const { subtotal, tax_total, total, taxes } = calculateInvoiceTotals(updatedLineItems, invoice.taxes);

    return {
      ...invoice,
      line_items: updatedLineItems,
      subtotal,
      tax_total,
      bill_amount: subtotal,
      total,
      taxes
    };
  };

  const removeLineItem = (invoice: Invoice, id: string): Invoice => {
    if (!invoice) return invoice;

    const updatedLineItems = invoice.line_items.filter(item => item.id !== id);
    const { subtotal, tax_total, total, taxes } = calculateInvoiceTotals(updatedLineItems, invoice.taxes);

    return {
      ...invoice,
      line_items: updatedLineItems,
      subtotal,
      tax_total,
      bill_amount: subtotal,
      total,
      taxes
    };
  };

  const addTax = (invoice: Invoice, name: string, rate: number): Invoice => {
    if (!invoice) return invoice;

    const amount = invoice.subtotal * (rate / 100);
    const newTax: InvoiceTax = {
      name,
      rate,
      amount
    };

    const updatedTaxes = [...invoice.taxes, newTax];
    const taxTotal = updatedTaxes.reduce((sum, tax) => sum + tax.amount, 0);
    const total = invoice.subtotal + taxTotal;

    return {
      ...invoice,
      taxes: updatedTaxes,
      tax_total: taxTotal,
      total
    };
  };

  const updateTax = (invoice: Invoice, index: number, updates: Partial<InvoiceTax>): Invoice => {
    if (!invoice) return invoice;

    const updatedTaxes = invoice.taxes.map((tax, i) => {
      if (i === index) {
        const updatedTax = {
          ...tax,
          ...updates
        };
        // Recalculate amount if rate changed
        if (updates.rate !== undefined) {
          updatedTax.amount = invoice.subtotal * (updates.rate / 100);
        }
        return updatedTax;
      }
      return tax;
    });

    const taxTotal = updatedTaxes.reduce((sum, tax) => sum + tax.amount, 0);
    const total = invoice.subtotal + taxTotal;

    return {
      ...invoice,
      taxes: updatedTaxes,
      tax_total: taxTotal,
      total
    };
  };

  const removeTax = (invoice: Invoice, index: number): Invoice => {
    if (!invoice) return invoice;

    const updatedTaxes = invoice.taxes.filter((_, i) => i !== index);
    const taxTotal = updatedTaxes.reduce((sum, tax) => sum + tax.amount, 0);
    const total = invoice.subtotal + taxTotal;

    return {
      ...invoice,
      taxes: updatedTaxes,
      tax_total: taxTotal,
      total
    };
  };

  return {
    addLineItem,
    updateLineItem,
    removeLineItem,
    addTax,
    updateTax,
    removeTax
  };
}
