import ProHomePage from '@/app/pro/page';
import Link from 'next/link';

// Task C legacy reference: Pro promo slot verification helper
export function LegacyProPromoSlot() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2">
      <div data-testid="pro-promo-slot">
        <Link href="/pro">Go Pro — videos, notes, diary</Link>
      </div>
    </div>
  );
}

export default ProHomePage;
