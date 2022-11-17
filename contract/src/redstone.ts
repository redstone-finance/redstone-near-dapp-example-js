import { near } from "near-sdk-js";

interface OracleRequestParams {
  dataFeedId: Uint8Array;
  uniqueSignersThreshold: number;
  authorisedSigners: Uint8Array[];
  currentTimestampMilliseconds: number;
  redstonePayload: Uint8Array;
}

interface ByteSubArray {
  fullArr: Uint8Array;
  startIndex: number;
  length: number;
}

interface DataPackageExtractionRequest {
  oracleRequestParams: OracleRequestParams;
  negativeOffsetToDataPackage: number;
}

interface DataPackageExtractionResult {
  containsRequestedDataFeedId: boolean;
  valueForRequestedDataFeed: bigint;
  signerIndex: number;
  dataPackageByteSize: number;
}

const REDSTONE_MARKER_BS = 9;
const UNSIGNED_METADATA_BYTE_SIZE_BS = 3;
const DATA_PACKAGES_COUNT_BS = 2;
const DATA_POINTS_COUNT_BS = 3;
const SIGNATURE_BS = 65;
const MAX_SIGNERS_COUNT = 256;
const DATA_POINT_VALUE_BYTE_SIZE_BS = 4;
const DATA_FEED_ID_BS = 32;
const TIMESTAMP_BS = 6;
const MAX_TIMESTAMP_DELAY_MS = 3 * 60 * 1000; // 3 minutes in milliseconds
const REDSTONE_MARKER = [0, 0, 2, 237, 87, 1, 30, 0, 0]; // 0x000002ed57011e0000

export const fromHexString = (hexString: string): Uint8Array =>
  Uint8Array.from(
    hexString.match(/.{1,2}/g).map((byte: string) => parseInt(byte, 16))
  );

export const toHexString = (bytesArr: Uint8Array): string =>
  bytesArr.reduce((str, byte) => str + byte.toString(16).padStart(2, "0"), "");

const byteSubArrayToSeparateArray = (subArr: ByteSubArray): Uint8Array => {
  const resultArr: Uint8Array = new Uint8Array(subArr.length);
  // near.log(
  //   JSON.stringify({ llen: subArr.length, sttartInndex: subArr.startIndex })
  // );
  for (let i = 0; i < subArr.length; i++) {
    // near.log(JSON.stringify({ i, b: subArr.fullArr[subArr.startIndex + i] }));
    resultArr[i] = subArr.fullArr[subArr.startIndex + i];
  }
  return resultArr;
};

const assert = (condition: boolean, msg?: string) => {
  if (!condition) {
    const errMsg =
      "Assertion failed" + (msg ? ` with: ${msg}` : " without message");
    throw new Error(errMsg);
  }
};

const bytesToBN = (bytesArr: ByteSubArray): bigint => {
  const numberBytes = byteSubArrayToSeparateArray(bytesArr);
  const numberBytesHex = toHexString(numberBytes);
  return BigInt("0x" + numberBytesHex);
};

const bytesToNumber = (bytesArr: ByteSubArray): number => {
  return Number(bytesToBN(bytesArr));
};

const assertValidRedstoneMarker = (redstonePayload: Uint8Array) => {
  const startIndex = redstonePayload.length - REDSTONE_MARKER_BS;

  for (let i = 0; i < REDSTONE_MARKER_BS; i++) {
    const expectedByte = REDSTONE_MARKER[i];
    const receivedByte = redstonePayload[startIndex + i];
    assert(expectedByte == receivedByte, "Invalid redstone marker");
  }
};

const extractUnsignedMetadataOffset = (redstonePayload: Uint8Array): number => {
  const startIndex =
    redstonePayload.length -
    (UNSIGNED_METADATA_BYTE_SIZE_BS + REDSTONE_MARKER_BS);

  const unsignedMetadataMsgByteSize = bytesToNumber({
    fullArr: redstonePayload,
    startIndex,
    length: UNSIGNED_METADATA_BYTE_SIZE_BS,
  });

  return (
    unsignedMetadataMsgByteSize +
    UNSIGNED_METADATA_BYTE_SIZE_BS +
    REDSTONE_MARKER_BS
  );
};

const extractDataPackage = (
  extractionReq: DataPackageExtractionRequest
): DataPackageExtractionResult => {
  const extractionResult = {
    containsRequestedDataFeedId: false,
    valueForRequestedDataFeed: BigInt(0),
    signerIndex: -1,
    dataPackageByteSize: 0,
  };

  return extractionResult;
};

// TODO: implement median calculation
const getMedianValue = (values: bigint[]): bigint => {
  return BigInt(42);
};

export const getOracleValue = (oracleReq: OracleRequestParams): bigint => {
  const { redstonePayload } = oracleReq;

  // Checking unsigned metadata with redstone marker
  assertValidRedstoneMarker(redstonePayload);
  let negativeOffset = extractUnsignedMetadataOffset(redstonePayload);
  near.log(`negativeOffset: ${negativeOffset}`);

  // Getting number of data packages in the payload
  const numberOfDataPackages = bytesToNumber({
    fullArr: redstonePayload,
    startIndex:
      redstonePayload.length - (negativeOffset + DATA_PACKAGES_COUNT_BS),
    length: DATA_PACKAGES_COUNT_BS,
  });
  near.log(`numberOfDataPackages: ${numberOfDataPackages}`);

  // Prepare helpful vars before parsing each data package
  negativeOffset += DATA_PACKAGES_COUNT_BS;
  const uniqueSigners = {};
  const values: bigint[] = [];

  // Extracting data packages one by one
  for (
    let dataPackageIndex = 0;
    dataPackageIndex < numberOfDataPackages;
    dataPackageIndex++
  ) {
    // Extracting and parsing data package
    const {
      dataPackageByteSize,
      containsRequestedDataFeedId,
      signerIndex,
      valueForRequestedDataFeed,
    } = extractDataPackage({
      oracleRequestParams: oracleReq,
      negativeOffsetToDataPackage: negativeOffset,
    });

    // Shifting negative offset to the next package
    negativeOffset += dataPackageByteSize;

    // Collecting value if needed
    if (containsRequestedDataFeedId && !uniqueSigners[signerIndex]) {
      uniqueSigners[signerIndex] = true;
      values.push(valueForRequestedDataFeed);
    }
  }

  // TODO: uncomment
  // if (values.length < oracleReq.uniqueSignersThreshold) {
  //   throw new Error(`Insufficient number of unique signers: ${values.length}`);
  // }

  return getMedianValue(values);
};
