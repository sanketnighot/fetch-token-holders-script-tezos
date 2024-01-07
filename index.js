//      -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
//     |                          This script will fetch all token Holders                                 |
//     |         on Tezos Mainnet with their token amount and create a CSV file of that data.              |
//     |                            and create a CSV file of that data.                                    |
//      -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

const axios = require('axios');
const API_URL = 'https://api.mainnet.tzkt.io'            // Mainnet API URL
const CONTRACT_ADDRESS = 'KT1UQVEDf4twF2eMbrCKQAxN7YYunTAiCTTm'            // Contract Address of the Token
const createObjectCsvWriter = require('csv-writer').createObjectCsvWriter;
var BigNumber = require('bignumber.js');
BigNumber.config({ DECIMAL_PLACES: 8 })
const DECIMAL = 100000000;
const fs = require('fs');
const path = './token_holders.csv';            // Path to the CSV file

/* The `fs.access()` function is used to check if a file exists at the specified path. In this case, it
is checking if the file 'token_holders.csv' exists. */
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

/* The `const csvWriter = createObjectCsvWriter({ ... })` line is creating an instance of the
`createObjectCsvWriter` class from the `csv-writer` library. This instance is used to write data to
a CSV file. */
const csvWriter = createObjectCsvWriter({
    path: 'token_holders.csv',
    /* The `header` property in the `csvWriter` configuration is defining the column headers for the
    CSV file. In this case, it specifies two columns: 'WalletAddress' and 'TokenAmount'. */
    header: [
        { id: 'address', title: 'WalletAddress' },
        { id: 'amount', title: 'TokenAmount' }
    ]
});

/**
 * The function `main` retrieves data from a contract storage, iterates through the ledger keys,
 * writes the data to a CSV file, and calculates the total supply and number of holders.
 */
const main = async () => {
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

main()            // Calling the main function
