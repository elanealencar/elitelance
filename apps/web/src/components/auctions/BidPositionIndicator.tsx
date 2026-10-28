type BidPositionIndicatorProps = {
  hasBid: boolean;
  isLeading: boolean;
  loading?: boolean;
};

export function BidPositionIndicator({
  hasBid,
  isLeading,
  loading = false,
}: BidPositionIndicatorProps) {
  if (loading) {
    return (
      <p className="mt-4 text-sm text-muted">
        Verificando sua posição no leilão...
      </p>
    );
  }

  if (!hasBid) {
    return (
      <div className="mt-4 rounded-xl border border-border bg-surface p-4">
        <p className="text-sm text-muted">
          Você ainda não participou deste leilão.
        </p>
      </div>
    );
  }

  if (isLeading) {
    return (
      <div
        className="mt-4 rounded-xl border border-primary/40 bg-primary/10 p-4"
        role="status"
      >
        <p className="font-bold text-primary">
          ✓ Você está ganhando!
        </p>
        <p className="mt-1 text-sm text-muted">
          Seu lance é o maior registrado até agora.
        </p>
      </div>
    );
  }

  return (
    <div
      className="mt-4 rounded-xl border border-yellow-400/40 bg-yellow-400/10 p-4"
      role="status"
    >
      <p className="font-bold text-yellow-400">
        Seu lance foi superado!
      </p>
      <p className="mt-1 text-sm text-muted">
        Outro participante ofereceu um valor maior.
        Você pode realizar um novo lance.
      </p>
    </div>
  );
}