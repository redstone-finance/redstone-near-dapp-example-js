import { Worker, NEAR, NearAccount } from "near-workspaces";
import anyTest, { TestFn } from "ava";
import { arrayify } from "ethers/lib/utils";
import redstoneSDK from "redstone-sdk";

const redstoneDataGateways = [
  "https://cache-service-direct-1.b.redstone.finance",
  "https://d33trozg86ya9x.cloudfront.net",
];

const test = anyTest as TestFn<{
  worker: Worker;
  accounts: Record<string, NearAccount>;
}>;

async function getRedstonePayload() {
  console.log(`Requesting redstone payload`);
  const redstonePayload = await redstoneSDK.requestRedstonePayload(
    {
      dataServiceId: "redstone-main-demo",
      uniqueSignersCount: 1,
      dataFeeds: ["BTC"],
    },
    redstoneDataGateways
  );
  console.log(`Redstone payload received: ${redstonePayload}`);

  return Object.values(arrayify(`0x${redstonePayload}`));
}

test.beforeEach(async (t) => {
  // Init the worker and start a Sandbox server
  const worker = await Worker.init();
  const root = worker.rootAccount;

  // some test accounts
  const alice = await root.createSubAccount("alice", {
    initialBalance: NEAR.parse("30 N").toJSON(),
  });
  const contract = await root.createSubAccount("contract", {
    initialBalance: NEAR.parse("30 N").toJSON(),
  });

  // Get wasm file path from package.json test script in folder above
  await contract.deploy(process.argv[2]);

  // Save state for test runs, it is unique for each test
  t.context.worker = worker;
  t.context.accounts = { contract, alice };
});

test.afterEach(async (t) => {
  // Stop Sandbox server
  await t.context.worker.tearDown().catch((error) => {
    console.log("Failed to stop the Sandbox:", error);
  });
});

test("can get oracle value", async (t) => {
  const { contract } = t.context.accounts;

  const oracleValueFromContract = await contract.view("get_oracle_value", {
    redstone_payload: await getRedstonePayload(),
    symbol: "BTC",
  });

  console.log({ oracleValueFromContract });
});

test("can do smth with oracle value", async (t) => {
  const { alice, contract } = t.context.accounts;

  await alice.call(contract, "do_something_with_oracle_value", {
    redstone_payload: await getRedstonePayload(),
    symbol: "BTC",
  });
});
