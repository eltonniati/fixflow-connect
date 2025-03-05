
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText, Printer } from "lucide-react";

interface PrintDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPrint: () => void;
  onPreview?: () => void;
  showPreviewOption?: boolean;
}

export const PrintDialog = ({ 
  open, 
  onOpenChange, 
  onPrint, 
  onPreview,
  showPreviewOption = false
}: PrintDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Print Document</DialogTitle>
          <DialogDescription>Print or save this document as PDF</DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <div className="flex gap-2">
            {showPreviewOption && onPreview && (
              <Button variant="secondary" onClick={onPreview}>
                <FileText className="mr-2 h-4 w-4" />
                Preview
              </Button>
            )}
            <Button onClick={onPrint}>
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
