interface OracleRequestParams {
  dataFeedId: Uint8Array;
  uniqueSignersThreshold: number;
  authorisedSigners: Uint8Array[];
  currentTimestampMilliseconds: number;
  redstonePayload: Uint8Array;
}

// TODO: implement
export const getOracleValue = (oracleReq: OracleRequestParams) => {
  return 42;
};
