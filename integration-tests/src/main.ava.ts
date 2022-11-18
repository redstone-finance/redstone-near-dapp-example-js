import { Worker, NEAR, NearAccount } from "near-workspaces";
import anyTest, { TestFn } from "ava";
import { arrayify } from "ethers/lib/utils";

const REDSTONE_PAYLOAD_HEX_STR =
  "4254430000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000003d1e382100045544800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002e90edd00001812f2590c000000020000002c1296a449f5d353c8b04eb389f33a583ee79449cca6e366900042f19f2521e722a410929223231905839c00865af68738f1a202478d87dc33675ea5824f343901b4254430000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000003d1e382100045544800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002e90edd00001812f2590c000000020000002dbbf8a0e6b1c9a56a4a0ef7089ef2a3f74fbd21fbd5c7c8192b70084004b4f6d37427507c4fff835f74fd4d000b6830ed296e207f49831b96f90a4f4e60820ee1c0002312e312e3223746573742d646174612d66656564000014000002ed57011e0000";

// ========================== RedStone payload structure (hex) ==========================
//   "4254430000000000000000000000000000000000000000000000000000000000" + // bytes32("BTC")
//   "000000000000000000000000000000000000000000000000000003d1e3821000" + // 42000 * 10^8
//   "4554480000000000000000000000000000000000000000000000000000000000" + // bytes32("ETH")
//   "0000000000000000000000000000000000000000000000000000002e90edd000" + // 2000 * 10^8
//   "01812f2590c0" + // timestamp (1654353400000 in hex)
//   "00000020" + // data points value byte size (32 in hex)
//   "000002" + // data points count
//   "c1296a449f5d353c8b04eb389f33a583ee79449cca6e366900042f19f2521e722a410929223231905839c00865af68738f1a202478d87dc33675ea5824f343901b" + // signature of the first signer
//   "4254430000000000000000000000000000000000000000000000000000000000" + // bytes32("BTC")
//   "000000000000000000000000000000000000000000000000000003d1e3821000" + // 42000 * 10^8
//   "4554480000000000000000000000000000000000000000000000000000000000" + // bytes32("ETH")
//   "0000000000000000000000000000000000000000000000000000002e90edd000" + // 2000 * 10^8
//   "01812f2590c0" + // timestamp (1654353400000 in hex)
//   "00000020" + // data points value byte size (32 in hex)
//   "000002" + // data points count
//   "dbbf8a0e6b1c9a56a4a0ef7089ef2a3f74fbd21fbd5c7c8192b70084004b4f6d37427507c4fff835f74fd4d000b6830ed296e207f49831b96f90a4f4e60820ee1c" + // signature of the second signer
//   "0002" + // data packages count
//   "312e312e3223746573742d646174612d66656564" + // unsigned metadata toUtf8Bytes("1.1.2#test-data-feed")
//   "000014" + // unsigned metadata byte size (20 in hex)
//   "000002ed57011e0000" // RedStone marker

const test = anyTest as TestFn<{
  worker: Worker;
  accounts: Record<string, NearAccount>;
}>;

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

test("can set oracle value", async (t) => {
  const { alice, contract } = t.context.accounts;

  const oraclevalueBefore = await contract.view("get_oracle_value", {});
  console.log({ oraclevalueBefore });
  t.is(oraclevalueBefore, "0");

  await alice.call(contract, "set_oracle_value", {
    redstone_payload: Object.values(arrayify(`0x${REDSTONE_PAYLOAD_HEX_STR}`)),
  });

  const oraclevalueAfter = await contract.view("get_oracle_value", {});
  console.log({ oraclevalueAfter });
  t.is(oraclevalueAfter, "4200000000000");
});

// test("can be incremented", async (t) => {
//   const { alice, contract } = t.context.accounts;
//   const startCounter: number = await contract.view("get_num", {});
//   await alice.call(contract, "increment", {});
//   const endCounter = await contract.view("get_num", {});
//   t.is(endCounter, startCounter + 1);
// });

// test("can be decremented", async (t) => {
//   const { alice, contract } = t.context.accounts;
//   await alice.call(contract, "increment", {});
//   const startCounter: number = await contract.view("get_num", {});
//   await alice.call(contract, "decrement", {});
//   const endCounter = await contract.view("get_num", {});
//   t.is(endCounter, startCounter - 1);
// });

// test("can be reset", async (t) => {
//   const { alice, contract } = t.context.accounts;
//   await alice.call(contract, "increment", {});
//   await alice.call(contract, "increment", {});
//   await alice.call(contract, "reset", {});
//   const endCounter = await contract.view("get_num", {});
//   t.is(endCounter, 0);
// });
