import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useServiceStore, type ServiceTicket } from '@/store/useServiceStore';
import { Calculator, Receipt, AlertCircle } from 'lucide-react';

interface FinalBillingDialogProps {
  ticket: ServiceTicket | null;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * FinalBillingDialog Component
 *
 * Modal for entering actual costs when completing a job (Hakediş).
 * Allows service providers to bill the final amount which may differ from estimate.
 */
export default function FinalBillingDialog({
  ticket,
  isOpen,
  onClose,
}: FinalBillingDialogProps) {
  const { completeJob } = useServiceStore();
  const [actualCost, setActualCost] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const myProposal = ticket?.proposals.find((p) => p.status === 'Accepted');
  const estimatedCost = myProposal?.estimatedCost || 0;
  const costDifference = parseFloat(actualCost || '0') - estimatedCost;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticket || !actualCost) return;

    setIsSubmitting(true);

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    completeJob(ticket.id, parseFloat(actualCost));

    setIsSubmitting(false);
    setActualCost('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-neutral-900 border-neutral-800 text-neutral-100 sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
              <Receipt className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-white">Hakediş - İş Tamamlama</DialogTitle>
              <DialogDescription className="text-neutral-400">
                İşi tamamlayın ve nihai maliyeti girin
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {ticket && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Ticket Info Summary */}
            <div className="bg-neutral-800/50 rounded-lg p-4 border border-neutral-800">
              <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Arıza Kaydı</p>
              <p className="font-medium text-white text-sm mb-3 truncate">{ticket.title}</p>

              <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Müşteri</p>
              <p className="font-medium text-white text-sm">{ticket.customerCompany}</p>
            </div>

            {/* Cost Comparison */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-neutral-800/30 rounded-lg p-3 border border-neutral-800">
                <p className="text-xs text-neutral-500 mb-1">Tahmini Maliyet</p>
                <p className="text-lg font-semibold text-white">
                  {estimatedCost.toLocaleString('tr-TR')} TL
                </p>
              </div>
              <div className="bg-neutral-800/30 rounded-lg p-3 border border-neutral-800">
                <p className="text-xs text-neutral-500 mb-1">Fark</p>
                <p
                  className={`text-lg font-semibold ${
                    costDifference > 0
                      ? 'text-amber-400'
                      : costDifference < 0
                      ? 'text-emerald-400'
                      : 'text-neutral-400'
                  }`}
                >
                  {costDifference > 0 ? '+' : ''}
                  {costDifference.toLocaleString('tr-TR')} TL
                </p>
              </div>
            </div>

            {/* Actual Cost Input */}
            <div className="space-y-2">
              <Label
                htmlFor="actualCost"
                className="text-sm font-semibold text-amber-500 uppercase tracking-wider flex items-center gap-2"
              >
                <Calculator className="w-4 h-4" />
                Gerçekleşen Maliyet (TL)
              </Label>
              <Input
                id="actualCost"
                type="number"
                placeholder="0.00"
                value={actualCost}
                onChange={(e) => setActualCost(e.target.value)}
                className="bg-neutral-800 border-neutral-700 text-white text-lg"
                required
                autoFocus
              />
              <p className="text-xs text-neutral-500">
                İşçilik, malzeme ve ekstra masraflar dahil toplam tutar
              </p>
            </div>

            {/* Warning if significantly different */}
            {Math.abs(costDifference) > estimatedCost * 0.2 && estimatedCost > 0 && actualCost && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 flex gap-3">
                <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-amber-400 font-medium">Tahmini Maliyetten Farklı</p>
                  <p className="text-xs text-amber-300/70 mt-1">
                    Gerçekleşen maliyet tahminiden %20'den fazla farklı. Müşteri
                    onayı gerekebilir.
                  </p>
                </div>
              </div>
            )}

            <DialogFooter className="gap-3 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="bg-transparent border-neutral-700 text-neutral-300 hover:bg-neutral-800"
              >
                İptal
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !actualCost}
                className="bg-emerald-600 hover:bg-emerald-500 text-white"
              >
                {isSubmitting ? 'İşleniyor...' : 'İşi Tamamla & Hakediş Oluştur'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
