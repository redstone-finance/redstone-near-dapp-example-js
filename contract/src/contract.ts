import { NearBindgen, near, call, view } from "near-sdk-js";
import { getOracleValue } from "redstone-near-connector-js";

const REDSTONE_MAIN_DEMO_SIGNER_PUB_KEY_HEX =
  "009dd87eb41d96ce8ad94aa22ea8b0ba4ac20c45e42f71726d6b180f93c3f298e333ae7591fe1c9d88234575639be9e81e35ba2fe5ad2c2260f07db49ccb9d0d";

function getDataFeedIdForSymbol(symbol: string): string {
  const symbolToDataFeedId = {
    NEAR: "4e45415200000000000000000000000000000000000000000000000000000000",
    BTC: "4254430000000000000000000000000000000000000000000000000000000000",
    ETH: "4554480000000000000000000000000000000000000000000000000000000000",
    TSLA: "54534c4100000000000000000000000000000000000000000000000000000000",
    EUR: "4555520000000000000000000000000000000000000000000000000000000000",
  };
  return symbolToDataFeedId[symbol];
}

function getOracleValueForSymbol(symbol: string, redstonePayload: Uint8Array): bigint {
  const dataFeedId = getDataFeedIdForSymbol(symbol);
  return getOracleValue({
    dataFeedId,
    uniqueSignersThreshold: 1,
    authorisedSigners: [REDSTONE_MAIN_DEMO_SIGNER_PUB_KEY_HEX],
    currentTimestampMilliseconds: Number(near.blockTimestamp() / BigInt(1_000_000)),
    redstonePayload,
    keccak256: near.keccak256,
    ecrecover: near.ecrecover,
  });
}

@NearBindgen({})
class RedstoneExample {
  @view({}) // Public read-only method: Returns the extracted and verified oracle value
  get_oracle_value({
    redstone_payload,
    symbol,
  }: {
    redstone_payload: Uint8Array;
    symbol: string;
  }): bigint {
    return getOracleValueForSymbol(symbol, redstone_payload);
  }

  @call({}) // Public method
  do_something_with_oracle_value({
    symbol,
    redstone_payload,
  }: {
    redstone_payload: Uint8Array;
    symbol: string;
  }) {
    const oracleValue = getOracleValueForSymbol(symbol, redstone_payload);
    near.log(`Got oracle value: ${oracleValue}`);
    // ... add your code here
  }
}
