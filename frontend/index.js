import 'regenerator-runtime/runtime'
import { Wallet } from './near-wallet'
import redstoneSDK from 'redstone-sdk'
import { arrayify } from 'ethers/lib/utils'

const CONTRACT_ADDRESS = process.env.CONTRACT_NAME;
const SYMBOLS = ['NEAR', 'BTC', 'ETH', 'TSLA', 'EUR'];
const NEAR_TESTNET_EXPLORER = 'https://explorer.testnet.near.org';

// When creating the wallet you can choose to create an access key, so the user
// can skip signing non-payable methods when interacting with the contract
const wallet = new Wallet({ createAccessKeyFor: CONTRACT_ADDRESS })

// Setup on page load
window.onload = async () => {
  const isSignedIn = await wallet.startUp();

  if (isSignedIn){
    signedInFlow()
  }else{
    signedOutFlow()
  }

  setUpLinkToTheIntegratedContract();
}

// Log in and log out users using NEAR Wallet
document.querySelector('.sign-in .btn').onclick = () => { wallet.signIn() }
document.querySelector('.sign-out .btn').onclick = () => { wallet.signOut() }

// Display the signed-out-flow container
function signedOutFlow() {
  document.querySelector('.sign-in').style.display = 'block';
  document.querySelectorAll('.interact').forEach(button => button.disabled = true)
}

async function getRedstonePayload(symbol) {
  const redstoneDataGateways = [
    'https://cache-service-direct-1.b.redstone.finance',
    'https://d33trozg86ya9x.cloudfront.net',
  ];
  const redstonePayload = await redstoneSDK.requestRedstonePayload({
    dataServiceId: 'redstone-main-demo',
    uniqueSignersCount: 1,
    dataFeeds: [symbol],
  }, redstoneDataGateways);

  return redstonePayload;
}

async function getPriceFromNearContract(symbol) {
  const redstonePayload = await getRedstonePayload(symbol);
  const priceValue = await wallet.viewMethod({
    contractId: CONTRACT_ADDRESS,
    method: 'get_oracle_value',
    args: {
      redstone_payload: Object.values(arrayify(`0x${redstonePayload}`)),
      symbol,
    },
  });
  return priceValue / (10 ** 8);
}

async function getAllPricesFromNearContract() {
  const resultPrices = {};
  for (const symbol of SYMBOLS) {
    console.log(`Getting price for ${symbol}`);
    const price = await getPriceFromNearContract(symbol);
    console.log(`Received price for ${symbol}: ${price}`);
    resultPrices[symbol] = price;
  }
  return resultPrices;
}

// Displaying the signed in flow container and display oracle button
async function signedInFlow() {
  document.querySelector('.sign-out').style.display = 'block';
  document.querySelectorAll('.wallet-required').forEach(el => el.style.display = 'flex');
}

async function updateOracleData() {
  try {
    setLoading(true);
    updateStatusMessage('Requesting oracle data...');
    const prices = await getAllPricesFromNearContract();
    await showNiceButMockStatuses();
    setPricesInUI(prices);
  } finally {
    setLoading(false);
  }
}

function setPricesInUI(prices) {
  document.getElementById('prices-container').style.display = 'flex';
  for (const [symbol, value] of Object.entries(prices)) {
    document.getElementById(`${symbol}-value`).innerHTML = value;
  }
}

async function sleep(ms) {
  return await new Promise((resolve) => setTimeout(resolve, ms));
}

async function updateStatusMessage(msg) {
  const statusMsgEl = document.getElementById('status-msg-container');
  statusMsgEl.innerHTML = msg;
  statusMsgEl.style.display = 'block';
}

function setUpLinkToTheIntegratedContract() {
  const linkEl = document.getElementById("integrated-contract-link");
  linkEl.setAttribute('href', `${NEAR_TESTNET_EXPLORER}/accounts/${CONTRACT_ADDRESS}`);
  linkEl.innerHTML = CONTRACT_ADDRESS;
}

// This function is used to improve the Demo experience
// It shows status messages from the general steps, but in
// practice these steps take way less time. We add `sleep` so
// that users have time to read the messages
async function showNiceButMockStatuses() {
  updateStatusMessage('Fetching redstone payload...');
  await sleep(2000);
  updateStatusMessage('Redstone payload received');
  await sleep(1000);
  updateStatusMessage('Sending call to a NEAR smart contract...');
  await sleep(2000);
  updateStatusMessage('Received Oracle data from NEAR smart contract');
}

function setLoading(isVisible) {
  document.getElementById('loader').style.display = (isVisible ? 'flex' : 'none');
}

// Handling oracle button click
document.querySelector('#oracle-button').addEventListener('click', async () => {
  await updateOracleData();
});
