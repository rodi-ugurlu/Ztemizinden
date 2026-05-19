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
import { Textarea } from '@/components/ui/textarea';
import { useServiceStore, type ServiceTicket } from '@/store/useServiceStore';
import { Calculator, Receipt, AlertCircle, Package, Wrench } from 'lucide-react';

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
  const [laborCost, setLaborCost] = useState('');
  const [partsCost, setPartsCost] = useState('');
  const [extraCost, setExtraCost] = useState('');
  const [partsSummary, setPartsSummary] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const myProposal = ticket?.offers.find((p) => p.status === 'ACCEPTED');
  const estimatedCost = myProposal?.estimatedCost || 0;
  const actualCost = parseNumber(laborCost) + parseNumber(partsCost) + parseNumber(extraCost);
  const costDifference = actualCost - estimatedCost;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticket || actualCost <= 0 || !notes.trim()) return;

    setIsSubmitting(true);
    setSubmitError('');

    try {
      await completeJob(ticket.id, {
        actualCost,
        notes: notes.trim(),
        partsSummary: partsSummary.trim() || 'Parça değişimi yapılmadı',
      });

      setLaborCost('');
      setPartsCost('');
      setExtraCost('');
      setPartsSummary('');
      setNotes('');
      onClose();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Hakediş gönderilemedi');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white border-slate-200 text-slate-900 sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
              <Receipt className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-slate-900">Hakediş - İş Tamamlama</DialogTitle>
              <DialogDescription className="text-slate-400">
                İşi tamamlayın ve nihai maliyeti girin
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {ticket && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Ticket Info Summary */}
            <div className="bg-slate-50/50 rounded-lg p-4 border border-slate-200">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Arıza Kaydı</p>
              <p className="font-medium text-slate-900 text-sm mb-3 truncate">{ticket.title}</p>

              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Müşteri</p>
              <p className="font-medium text-slate-900 text-sm">{ticket.customerCompany}</p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-slate-50/30 rounded-lg p-3 border border-slate-200">
                <p className="text-xs text-slate-500 mb-1">Tahmini Maliyet</p>
                <p className="text-lg font-semibold text-slate-900">
                  {estimatedCost.toLocaleString('tr-TR')} TL
                </p>
              </div>
              <div className="bg-slate-50/30 rounded-lg p-3 border border-slate-200">
                <p className="text-xs text-slate-500 mb-1">Gerçekleşen</p>
                <p className="text-lg font-semibold text-slate-900">
                  {actualCost.toLocaleString('tr-TR')} TL
                </p>
              </div>
              <div className="bg-slate-50/30 rounded-lg p-3 border border-slate-200">
                <p className="text-xs text-slate-500 mb-1">Fark</p>
                <p
                  className={`text-lg font-semibold ${
                    costDifference > 0
                      ? 'text-red-600'
                      : costDifference < 0
                      ? 'text-emerald-600'
                      : 'text-slate-400'
                  }`}
                >
                  {costDifference > 0 ? '+' : ''}
                  {costDifference.toLocaleString('tr-TR')} TL
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <CostInput id="laborCost" label="İşçilik" icon={Wrench} value={laborCost} onChange={setLaborCost} />
              <CostInput id="partsCost" label="Parça" icon={Package} value={partsCost} onChange={setPartsCost} />
              <CostInput id="extraCost" label="Ek Masraf" icon={Calculator} value={extraCost} onChange={setExtraCost} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="partsSummary" className="text-sm font-semibold text-red-600 uppercase tracking-wider">
                Değişen Parça / Malzeme
              </Label>
              <Input
                id="partsSummary"
                placeholder="Örn: filtre seti, rulman, sensör kablosu..."
                value={partsSummary}
                onChange={(e) => setPartsSummary(e.target.value)}
                className="bg-slate-50 border-slate-200 text-slate-900"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes" className="text-sm font-semibold text-red-600 uppercase tracking-wider">
                Servis Notu
              </Label>
              <Textarea
                id="notes"
                placeholder="Yapılan müdahale, test sonucu, garanti/tekrar arıza için önemli notlar..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="bg-slate-50 border-slate-200 text-slate-900"
                rows={4}
                required
              />
            </div>

            {/* Warning if significantly different */}
            {Math.abs(costDifference) > estimatedCost * 0.2 && estimatedCost > 0 && actualCost > 0 && (
              <div className="bg-red-50 border border-red-200/30 rounded-lg p-3 flex gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-red-600 font-medium">Tahmini Maliyetten Farklı</p>
                  <p className="text-xs text-red-300/70 mt-1">
                    Gerçekleşen maliyet tahminiden %20'den fazla farklı. Müşteri
                    onayı gerekebilir.
                  </p>
                </div>
              </div>
            )}
            {submitError && <p className="text-sm text-red-600">{submitError}</p>}

            <DialogFooter className="gap-3 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="bg-transparent border-slate-200 text-slate-700 hover:bg-red-50"
              >
                İptal
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || actualCost <= 0 || !notes.trim()}
                className="bg-red-600 hover:bg-red-700 text-white"
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

function CostInput({
  id,
  label,
  icon: Icon,
  value,
  onChange,
}: {
  id: string;
  label: string;
  icon: React.ElementType;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label
        htmlFor={id}
        className="text-xs font-semibold text-red-600 uppercase tracking-wider flex items-center gap-2"
      >
        <Icon className="w-4 h-4" />
        {label}
      </Label>
      <Input
        id={id}
        type="number"
        min="0"
        step="0.01"
        placeholder="0.00"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="bg-slate-50 border-slate-200 text-slate-900"
      />
    </div>
  );
}

function parseNumber(value: string) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}
