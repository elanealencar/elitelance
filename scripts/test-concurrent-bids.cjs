
const API_URL = "http://localhost:3333";

const lotId = process.env.TEST_LOT_ID;
const token1 = process.env.TEST_BIDDER_TOKEN_1;
const token2 = process.env.TEST_BIDDER_TOKEN_2;

if (!lotId || !token1 || !token2) {
  console.error("Configure o lote e os dois tokens.");
  process.exit(1);
}

async function sendBid(amountCents, token, bidder) {
  try {
    const response = await fetch(
      `${API_URL}/auctions/${lotId}/bids`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ amountCents }),
      }
    );

    const data = await response.json();

    return {
      bidder,
      amountCents,
      status: response.status,
      message: data.message,
    };
  } catch (error) {
    return {
      bidder,
      amountCents,
      status: "NETWORK_ERROR",
      message: error.message,
    };
  }
}

async function main() {
  const results = await Promise.all([
    sendBid(20000, token1, "Licitante 1"),
    sendBid(22000, token2, "Licitante 2"),
  ]);

  console.table(results);
}

main();
