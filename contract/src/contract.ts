import { NearBindgen, near, call, view } from "near-sdk-js";
import { getOracleValue } from "redstone-near-connector-js";

const BTC_BYTES_32_HEX = "4254430000000000000000000000000000000000000000000000000000000000";
const SIGNER_1_PUB_KEY_HEX =
  "466d7fcae563e5cb09a0d1870bb580344804617879a14949cf22285f1bae3f276728176c3c6431f8eeda4538dc37c865e2784f3a9e77d044f33e407797e1278a";
const SIGNER_2_PUB_KEY_HEX =
  "4f355bdcb7cc0af728ef3cceb9615d90684bb5b2ca5f859ab0f0b704075871aa385b6b1b8ead809ca67454d9683fcf2ba03456d6fe2c4abe2b07f0fbdbb2f1c1";

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
      dataFeedId: BTC_BYTES_32_HEX,
      uniqueSignersThreshold: 2,
      authorisedSigners: [SIGNER_1_PUB_KEY_HEX, SIGNER_2_PUB_KEY_HEX],
      currentTimestampMilliseconds: Date.now(),
      redstonePayload: redstone_payload,
    });
    this.oracleValue = BigInt(42000 * 10 ** 8);
    near.log(`Set oracle value to ${this.oracleValue}`);
  }

  @call({}) // Public method - Reset to zero.
  reset() {
    this.val = 0;
    near.log(`Reset counter to zero`);
  }
}
