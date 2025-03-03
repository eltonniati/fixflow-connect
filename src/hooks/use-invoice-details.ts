
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Invoice, Job } from "@/lib/types";
import { useInvoiceCreator } from "./invoice/use-invoice-creator";
import { useInvoiceFetcher } from "./invoice/use-invoice-fetcher";
import { useInvoiceUpdater } from "./invoice/use-invoice-updater";
import { useInvoiceItems } from "./invoice/use-invoice-items";

export function useInvoiceDetails() {
  const { user } = useAuth();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(false);
  
  const { createInvoiceFromJob } = useInvoiceCreator();
  const { getInvoice } = useInvoiceFetcher();
  const { updateInvoice } = useInvoiceUpdater();
  const { 
    addLineItem, 
    updateLineItem, 
    removeLineItem,
    addTax,
    updateTax,
    removeTax
  } = useInvoiceItems();

  // Wrapper for createInvoiceFromJob that also updates the state
  const handleCreateInvoiceFromJob = async (job: Job): Promise<Invoice | null> => {
    if (!user) return null;
    setLoading(true);
    try {
      const newInvoice = await createInvoiceFromJob(job);
      if (newInvoice) {
        setInvoice(newInvoice);
      }
      return newInvoice;
    } finally {
      setLoading(false);
    }
  };

  // Wrapper for getInvoice that also updates the state
  const handleGetInvoice = async (id: string): Promise<Invoice | null> => {
    if (!user) return null;
    setLoading(true);
    try {
      const fetchedInvoice = await getInvoice(id);
      if (fetchedInvoice) {
        setInvoice(fetchedInvoice);
      }
      return fetchedInvoice;
    } finally {
      setLoading(false);
    }
  };

  // Wrapper for updateInvoice that also updates the state
  const handleUpdateInvoice = async (id: string, updates: Partial<Invoice>): Promise<Invoice | null> => {
    if (!user || !invoice) return null;
    setLoading(true);
    try {
      const updatedInvoice = await updateInvoice(id, updates, invoice);
      if (updatedInvoice) {
        setInvoice(updatedInvoice);
      }
      return updatedInvoice;
    } finally {
      setLoading(false);
    }
  };

  // Wrapper for addLineItem
  const handleAddLineItem = (description: string, quantity: number, unitPrice: number) => {
    if (!invoice) return;
    const updatedInvoice = addLineItem(invoice, description, quantity, unitPrice);
    setInvoice(updatedInvoice);
  };

  // Wrapper for updateLineItem
  const handleUpdateLineItem = (id: string, updates: Partial<InvoiceLineItem>) => {
    if (!invoice) return;
    const updatedInvoice = updateLineItem(invoice, id, updates);
    setInvoice(updatedInvoice);
  };

  // Wrapper for removeLineItem
  const handleRemoveLineItem = (id: string) => {
    if (!invoice) return;
    const updatedInvoice = removeLineItem(invoice, id);
    setInvoice(updatedInvoice);
  };

  // Wrapper for addTax
  const handleAddTax = (name: string, rate: number) => {
    if (!invoice) return;
    const updatedInvoice = addTax(invoice, name, rate);
    setInvoice(updatedInvoice);
  };

  // Wrapper for updateTax
  const handleUpdateTax = (index: number, updates: Partial<InvoiceTax>) => {
    if (!invoice) return;
    const updatedInvoice = updateTax(invoice, index, updates);
    setInvoice(updatedInvoice);
  };

  // Wrapper for removeTax
  const handleRemoveTax = (index: number) => {
    if (!invoice) return;
    const updatedInvoice = removeTax(invoice, index);
    setInvoice(updatedInvoice);
  };

  // Save the current invoice
  const saveInvoice = async (): Promise<Invoice | null> => {
    if (!invoice || !invoice.id) return null;
    return handleUpdateInvoice(invoice.id, invoice);
  };

  return {
    invoice,
    loading,
    createInvoiceFromJob: handleCreateInvoiceFromJob,
    getInvoice: handleGetInvoice,
    updateInvoice: handleUpdateInvoice,
    addLineItem: handleAddLineItem,
    updateLineItem: handleUpdateLineItem,
    removeLineItem: handleRemoveLineItem,
    addTax: handleAddTax,
    updateTax: handleUpdateTax,
    removeTax: handleRemoveTax,
    saveInvoice,
    setInvoice
  };
}
