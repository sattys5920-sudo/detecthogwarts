import CornerFlourish from './CornerFlourish';

/** A thin border + corner ornaments traced around the whole viewport, so every page reads as
 * one page bound inside the same old book rather than a loose stack of app screens. */
export default function ScreenFrame() {
  return (
    <div
      className="pointer-events-none fixed z-40"
      style={{
        top: 'env(safe-area-inset-top)',
        right: 'env(safe-area-inset-right)',
        bottom: 'env(safe-area-inset-bottom)',
        left: 'env(safe-area-inset-left)',
      }}
      aria-hidden="true"
    >
      <div className="absolute inset-1.5 border border-gold-500/35" />
      <CornerFlourish corner="tl" className="absolute -top-0.5 -left-0.5 h-7 w-7 text-seal-600/75" />
      <CornerFlourish corner="tr" className="absolute -top-0.5 -right-0.5 h-7 w-7 text-seal-600/75" />
      <CornerFlourish corner="bl" className="absolute -bottom-0.5 -left-0.5 h-7 w-7 text-seal-600/75" />
      <CornerFlourish corner="br" className="absolute -bottom-0.5 -right-0.5 h-7 w-7 text-seal-600/75" />
    </div>
  );
}
