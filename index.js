const axios = require('axios');
const API_URL = 'https://api.mainnet.tzkt.io'
const CONTRACT_ADDRESS = 'KT1UQVEDf4twF2eMbrCKQAxN7YYunTAiCTTm'
const createObjectCsvWriter = require('csv-writer').createObjectCsvWriter;
var BigNumber = require('bignumber.js');
BigNumber.config({ DECIMAL_PLACES: 8 })
const DECIMAL = 100000000;
const fs = require('fs');
const path = './token_holders.csv';

fs.access(path, fs.F_OK, (err) => {
    if (err) {
        console.error(">>>>> File 'token_holders.csv' not found creating one ... \n");
        return;
    }
    // File exists, delete it
    fs.unlink(path, (err) => {
        if (err) {
            console.error(err);
            return;
        }
        console.log(">>>>> File 'token_holders.csv' found, clearing the entries ... \n");
    });
});

const csvWriter = createObjectCsvWriter({
    path: 'token_holders.csv',
    header: [
        { id: 'address', title: 'WalletAddress' },
        { id: 'amount', title: 'TokenAmount' }

    ]
});

const getData = async () => {
    const contractStorage = (await axios(`${API_URL}/v1/contracts/${CONTRACT_ADDRESS}/storage`)).data
    const TotalLedgerKeys = (await axios(`${API_URL}/v1/bigmaps/${contractStorage.ledger}`)).data.totalKeys
    const ledgerKeys = (await axios(`${API_URL}/v1/bigmaps/${contractStorage.ledger}/keys?limit=${TotalLedgerKeys}`)).data
    let counter = 0
    let totalSupply = new BigNumber(0);
    if (ledgerKeys.length > 0) {
        for (let i = 0; i < ledgerKeys.length; i++) {
            if (ledgerKeys[i].active === true && ledgerKeys[i].value > 0) {
                counter++
                const addressInfo = ledgerKeys[i]
                const address = addressInfo.key.address
                const amount = new BigNumber(parseInt(addressInfo.value) / DECIMAL)
                const record = [{ address, amount: amount.toNumber() }]
                await csvWriter.writeRecords(record)
                    .then(() => console.log(`${counter} --> Writing Data for ${address} of amount ${amount.toNumber()} `));
                totalSupply = totalSupply.plus(amount)
            }
        }
        console.log(`>>>>> Finished Copying Data!`);
        console.log("")
        console.log("Total Holders: ", counter)
        console.log("Total Supply: ", totalSupply.toNumber())
    } else {
        console.log("No Data Found!")
    }
}

getData()
