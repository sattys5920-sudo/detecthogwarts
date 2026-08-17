export default function PaperTexture() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden="true">
      <div className="absolute inset-0 paper-stains" />
      <div className="absolute inset-0 paper-grain" />
    </div>
  );
}
