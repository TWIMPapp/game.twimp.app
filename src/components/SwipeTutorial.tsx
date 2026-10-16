// Tinder-style first-use helper: a hand nudging a mini card left, with a hint
// that right opens the journal. Sits over the top image area (not the text)
// and lets touches through, so it never blocks the card.
export default function SwipeTutorial({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div
      className="swipe-tutorial fixed left-0 right-0 flex justify-center pointer-events-none"
      style={{ top: 96, zIndex: 1000 }}
      data-testid="swipe-tutorial"
    >
      <div
        className="pointer-events-auto rounded-2xl px-5 py-4 text-white text-center"
        style={{ background: 'rgba(0,0,0,0.65)', maxWidth: 300 }}
        onClick={onDismiss}
      >
        <div className="swipe-tutorial-stage">
          <div className="swipe-tutorial-card" />
          <div className="swipe-tutorial-hand" aria-hidden>
            👆
          </div>
        </div>
        <div className="text-sm font-semibold mt-2">Swipe left to continue</div>
        <div className="text-xs opacity-80 mt-1">Swipe right for your journal &amp; items</div>
      </div>
    </div>
  );
}
