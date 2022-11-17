import { NearBindgen, near, call, view } from "near-sdk-js";
import { fromHexString, getOracleValue } from "./redstone";
import { AccountId } from "near-sdk-js/lib/types";

const BTC_BYTES_32_HEX_STR =
  "4254430000000000000000000000000000000000000000000000000000000000";
const SIGNER_1_PUB_KEY =
  "034f355bdcb7cc0af728ef3cceb9615d90684bb5b2ca5f859ab0f0b704075871aa";
const SIGNER_2_PUB_KEY =
  "02466d7fcae563e5cb09a0d1870bb580344804617879a14949cf22285f1bae3f27";

@NearBindgen({})
class Counter {
  val: number = 0;
  oracleValue: bigint = BigInt(0);

  @view({}) // Public read-only method: Returns the counter value.
  get_num(): number {
    return this.val;
  }

  @view({}) // Public read-only method: Returns the saved oracle value.
  get_oracle_value(): bigint {
    return this.oracleValue;
  }

  @call({}) // Public method: Increment the counter.
  increment() {
    this.val += 1;
    near.log(`Increased number to ${this.val}`);
  }

  @call({}) // Public method: Decrement the counter.
  decrement() {
    this.val -= 1;
    near.log(`Decreased number to ${this.val}`);
  }

  @call({}) // Public method: Set the oracle value
  set_oracle_value({ redstone_payload }: { redstone_payload: Uint8Array }) {
    near.log(`First byte: ${redstone_payload[0]}`);
    this.oracleValue = getOracleValue({
      dataFeedId: fromHexString(BTC_BYTES_32_HEX_STR),
      uniqueSignersThreshold: 2,
      authorisedSigners: [
        fromHexString(SIGNER_1_PUB_KEY),
        fromHexString(SIGNER_2_PUB_KEY),
      ],
      currentTimestampMilliseconds: Date.now(),
      redstonePayload: redstone_payload,
    });
    near.log(`Set oracle value to ${this.oracleValue}`);
  }

  @call({}) // Public method - Reset to zero.
  reset() {
    this.val = 0;
    near.log(`Reset counter to zero`);
  }
}
