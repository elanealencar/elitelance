import { formatCurrency, formatDateBR } from "@/lib/format";
import { getBidHistory } from "@/services/bids";
import { unstable_rethrow } from "next/navigation";

type BidHistoryProps = {
  auctionId: string;
};

const integrityLabels = {
  VALID: "Integridade verificada",
  PARTIALLY_VERIFIED: "Verificação parcial",
  INVALID: "Integridade comprometida",
};

export async function BidHistory({
  auctionId,
}: BidHistoryProps) {
  let history;

  try {
    history = await getBidHistory(auctionId);
  } catch (error) {
    unstable_rethrow(error);

    console.error("Erro ao carregar histórico:", error);

    return (
      <section className="mt-16 rounded-2xl border border-border bg-surface p-6">
        <h2 className="text-2xl font-bold">
          Histórico de lances
        </h2>

        <p className="mt-4 text-sm text-muted">
          Não foi possível carregar o histórico neste momento.
        </p>
      </section>
    );
  }

  const { audit, bids } = history;

  const integrityColor =
    audit.integrity === "VALID"
      ? "text-primary"
      : audit.integrity === "INVALID"
        ? "text-red-400"
        : "text-yellow-400";

  return (
    <section className="mt-16 rounded-2xl border border-border bg-surface p-6 md:p-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-secondary">
            Transparência e segurança
          </p>

          <h2 className="text-2xl font-bold">
            Histórico de lances
          </h2>

          <p className="mt-2 text-sm text-muted">
            Registro público e auditável das ofertas.
          </p>
        </div>

        <div className={`text-sm font-semibold ${integrityColor}`}>
          {audit.totalBids === 0
            ? "Nenhum lance para auditar"
            : integrityLabels[audit.integrity]}
        </div>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-background p-4">
          <p className="text-xs text-muted">Total de lances</p>
          <p className="mt-2 text-2xl font-bold">
            {audit.totalBids}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-background p-4">
          <p className="text-xs text-muted">Lances verificados</p>
          <p className="mt-2 text-2xl font-bold text-primary">
            {audit.validCount}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-background p-4">
          <p className="text-xs text-muted">Inconsistências</p>
          <p className="mt-2 text-2xl font-bold">
            {audit.invalidCount}
          </p>
        </div>
      </div>

      {bids.length === 0 ? (
        <p className="mt-8 rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted">
          Este leilão ainda não recebeu lances.
        </p>
      ) : (
        <div className="mt-8 space-y-3">
          {bids.map((bid) => (
            <div
              key={bid.id}
              className="flex flex-col justify-between gap-3 rounded-xl border border-border bg-background p-4 sm:flex-row sm:items-center"
            >
              
            <div>
              <p className="text-sm font-semibold">
                Lance #{bid.sequence ?? "—"}
              </p>

              <p className="mt-1 text-xs text-muted">
                {formatDateBR(bid.createdAt)}
              </p>

              <p className="mt-1 font-mono text-xs text-muted">
                Registro: {bid.id.slice(0, 8)}...
              </p>

              {/* Status de integridade do lance */}
              <p
                className={`mt-2 text-xs font-medium ${
                  bid.integrity === "VALID"
                    ? "text-primary"
                    : bid.integrity === "INVALID"
                      ? "text-red-400"
                      : "text-yellow-400"
                }`}
              >
                {bid.integrity === "VALID"
                  ? "✓ Lance verificado"
                  : bid.integrity === "INVALID"
                    ? "⚠ Integridade comprometida"
                    : "○ Registro anterior à auditoria"}
              </p>
            </div>


              <div className="sm:text-right">
                <p className="text-xl font-bold text-primary">
                  {formatCurrency(bid.amountCents)}
                </p>

                <p className="mt-1 text-xs text-muted">
                  {bid.hash
                    ? `SHA-256: ${bid.hash.slice(0, 12)}...`
                    : "Sem hash registrado"}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="mt-6 text-xs leading-relaxed text-muted">
        Os lances são encadeados por hashes SHA-256.
        A auditoria verifica a sequência e a integridade
        dos registros disponíveis.
      </p>
    </section>
  );
}