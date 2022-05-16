const Web3 = require('web3');
const fs = require('fs');

var addContract = async (contractId, Amount, Transfer, Beneficiary, Date, Approver, status) => {
    const web3 = new Web3(process.env.JSON_RPC_SOCKET);
    let tokenAddress = process.env.MAIN_CONTRACT_ADDRESS;
    var abiArray = JSON.parse(fs.readFileSync('updatedabi.json', 'utf-8'));
    var instance = new web3.eth.Contract(abiArray, tokenAddress);
    await web3.eth.accounts.wallet.add(process.env.ADMIN_PRIVATE_KEY);
    let result = await instance.methods
        .addContract(`${contractId}`, Amount, Transfer, Beneficiary, Date, Approver, status)
        .send({ from: process.env.ADMIN_ADDRESS, gas: 2000000 });
    console.log(result);
    return result;
};

var updateContract = async (userId, contractId, status) => {
    const web3 = new Web3(process.env.JSON_RPC_SOCKET);
    let tokenAddress = process.env.MAIN_CONTRACT_ADDRESS;
    var abiArray = JSON.parse(fs.readFileSync('updatedabi.json', 'utf-8'));
    var instance = new web3.eth.Contract(abiArray, tokenAddress);
    await web3.eth.accounts.wallet.add(process.env.ADMIN_PRIVATE_KEY);
    let result = await instance.methods
        .changeStatus(userId, `${contractId}`, status)
        .send({ from: process.env.ADMIN_ADDRESS, gas: 2000000 });
    let d = await instance.methods
        .getContract(userId, contractId)
        .call({ from: process.env.ADMIN_ADDRESS });
    return result;
};

module.exports = {
    addContract,
    updateContract,
};
