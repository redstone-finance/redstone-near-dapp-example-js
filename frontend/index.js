import 'regenerator-runtime/runtime'
import { Wallet } from './near-wallet'
import { RedstonePayload } from 'redstone-protocol'
import redstoneSDK from 'redstone-sdk'

const CONTRACT_ADDRESS = process.env.CONTRACT_NAME;

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

  updateUI()
}

// Log in and log out users using NEAR Wallet
document.querySelector('.sign-in .btn').onclick = () => { wallet.signIn() }
document.querySelector('.sign-out .btn').onclick = () => { wallet.signOut() }

// Display the signed-out-flow container
function signedOutFlow() {
  document.querySelector('.sign-in').style.display = 'block';
  document.querySelectorAll('.interact').forEach(button => button.disabled = true)
}

async function getRedstonePayload() {
  const signedDataPackagesResponse = await redstoneSDK.requestDataPackages({
    dataServiceId: "redstone-main-demo",
    uniqueSignersCount: 1,
    dataFeeds: ["NEAR"],
  }, ["https://d33trozg86ya9x.cloudfront.net"]);

  const unsignedMetadata = "manual-payload";
  const redstonePayload = RedstonePayload.prepare(
    signedDataPackagesResponse.NEAR, unsignedMetadata);
  console.log({redstonePayload});
}

// Displaying the signed in flow container and display counter
async function signedInFlow() {
  document.querySelector('.sign-out').style.display = 'block';
  document.querySelectorAll('.interact').forEach(button => button.disabled = false)
}

// Buttons - Interact with the Smart contract
document.querySelector('#plus').addEventListener('click', async () => {
  resetUI();
  await wallet.callMethod({contractId: CONTRACT_ADDRESS, method: "increment"});
  await updateUI();
});

document.querySelector('#minus').addEventListener('click', async  () => {
  resetUI();
  await wallet.callMethod({contractId: CONTRACT_ADDRESS, method: "decrement"});
  await updateUI();
});
document.querySelector('#a').addEventListener('click', async  () => {
  resetUI();
  await wallet.callMethod({contractId: CONTRACT_ADDRESS, method: "reset"});
  await updateUI();
});
document.querySelector('#oracle-set').addEventListener('click', async  () => {
  console.log("Setting oracle value");
  resetUI();
  await getRedstonePayload();
  await wallet.callMethod({
    contractId: CONTRACT_ADDRESS,
    method: "set_oracle_value",
    args: {"redstone_payload":[66,84,67,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,209,227,130,16,0,69,84,72,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,46,144,237,208,0,1,129,47,37,144,192,0,0,0,32,0,0,2,193,41,106,68,159,93,53,60,139,4,235,56,159,51,165,131,238,121,68,156,202,110,54,105,0,4,47,25,242,82,30,114,42,65,9,41,34,50,49,144,88,57,192,8,101,175,104,115,143,26,32,36,120,216,125,195,54,117,234,88,36,243,67,144,27,66,84,67,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,209,227,130,16,0,69,84,72,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,46,144,237,208,0,1,129,47,37,144,192,0,0,0,32,0,0,2,219,191,138,14,107,28,154,86,164,160,239,112,137,239,42,63,116,251,210,31,189,92,124,129,146,183,0,132,0,75,79,109,55,66,117,7,196,255,248,53,247,79,212,208,0,182,131,14,210,150,226,7,244,152,49,185,111,144,164,244,230,8,32,238,28,0,2,49,46,49,46,50,35,116,101,115,116,45,100,97,116,97,45,102,101,101,100,0,0,20,0,0,2,237,87,1,30,0,0]},
  });
  console.log("Oracle value set");
  await updateUI();
});

// Update and Reset UI
async function updateUI(){
  // Original 
  // let count = await wallet.viewMethod({contractId: CONTRACT_ADDRESS, method: "get_num"});

  // Updated
  let count = await wallet.viewMethod({contractId: CONTRACT_ADDRESS, method: "get_oracle_value"});
  
  document.querySelector('#show').classList.replace('loader','number');
  document.querySelector('#show').innerText = count === undefined ? 'calculating...' : count;
  document.querySelector('#left').classList.toggle('eye');

  if (count >= 0) {
    document.querySelector('.mouth').classList.replace('cry','smile');
  } else {
    document.querySelector('.mouth').classList.replace('smile','cry');
  }

  if (count > 20 || count < -20) {
    document.querySelector('.tongue').style.display = 'block';
  } else {
    document.querySelector('.tongue').style.display = 'none';
  }
}

function resetUI(){
  document.querySelector('#show').classList.replace('number','loader');
  document.querySelector('#show').innerText = '';
}

// Animations
document.querySelector('#c').addEventListener('click', () => {
  document.querySelector('#left').classList.toggle('eye');
});
document.querySelector('#b').addEventListener('click', () => {
  document.querySelector('#right').classList.toggle('eye');
});
document.querySelector('#d').addEventListener('click', () => {
  document.querySelector('.dot').classList.toggle('on');
});