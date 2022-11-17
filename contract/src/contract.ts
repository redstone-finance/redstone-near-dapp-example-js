import { NearBindgen, near, call, view } from "near-sdk-js";
import { getOracleValue } from "./redstone";
import { AccountId } from "near-sdk-js/lib/types";

@NearBindgen({})
class Counter {
  val: number = 0;
  oracleValue: number = 0;

  @view({}) // Public read-only method: Returns the counter value.
  get_num(): number {
    return this.val;
  }

  @view({}) // Public read-only method: Returns the saved oracle value.
  get_oracle_value(): number {
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
    const emptyByteArr = new Uint8Array();
    this.oracleValue = getOracleValue({
      dataFeedId: emptyByteArr,
      uniqueSignersThreshold: 2,
      authorisedSigners: [emptyByteArr, emptyByteArr],
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
