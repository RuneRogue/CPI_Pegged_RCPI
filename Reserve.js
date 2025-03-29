const { ethers } = require("ethers");
const fetchData = require("./fetchCpi");
const fs = require("fs");
const csvParser = require("csv-parser");
const { Parser } = require("json2csv");

// Initialize your provider and contract instances
const INFURA_API_URL = `https://polygon-amoy.g.alchemy.com/v2/ON1ctftr6l4I-udsVICw75aKx-JLPufd`;
const PRIVATE_KEY = `9455752e893232f2df870be7b333a99175a08da9fa12cd8328596cd8c5bdacda`; // Make sure to keep this safe
const provider = new ethers.JsonRpcProvider(INFURA_API_URL);

const wallerAddress = "0x5d8Ac255E9325a41Cd2bDe244758CdbA1bFD8f0f";
const rcoinAddress = "0x340652080037645088F2bA858dA76D8C2467BDCB";
const rcpiAddress = "0xE84aE6890CEcb5c77b8C59681C596d47D754A208";
const rcsAddress = "0xFc8ADD10aC7d82FAE2713251cA3E62Eac36532c1";
const reserveAddress = "0x5a0Bf76bD28F803BB40be3135b6f11ced8a9Cc75";
const swappoolAddress = "0xd8fFBa06b71057a16CEf74e0A01C638F8a579907";
const RcoinReserveAddress = "0x06a6e91dA901Fb5b3233611Fee5dA97Ca620bDa1";

const RcoinSwappoolAddress = "0xD30F56F68409B21643FbB7D18fa66e08027A4A24";
/*
0xc64FAB6F862610241428c19cD273B60d33eBB6af rcoin
0xF31a05074c45Ff34Da6bf29a1DF28CAf2414c401 rcpi
0x8958b765Bae01C8529083244e8125aC037b2D86A rcs
0x43a0158ea99a138c6D5572Ad197F7195BA152099 reserve
0x4b5Ecb879319f27f72878445293E7048BC1faBA0 swappool
 */

// Load ABI files using require
const rcoinABI = require("./ContractABI/Rcoin.json");
const rcpiABI = require("./ContractABI/RCPI.json");
const rcsABI = require("./ContractABI/Rcs.json");
const reserveABI = require("./ContractABI/Reserve.json");
const swappoolABI = require("./ContractABI/Swap_pool.json");
const RcoinReserveABI = require("./ContractABI/ReserveManagerABI.json");
const RcoinswappoolABI = require('./ContractABI/RcoinSwapAbi.json');

// Initialize wallet
// const wallet = new ethers.Wallet(PRIVATE_KEY).connect(provider);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

// Contract instances with signer
const RcoinSwappool = new ethers.Contract(RcoinSwappoolAddress, RcoinswappoolABI, wallet);
const rcoinContract = new ethers.Contract(rcoinAddress, rcoinABI, wallet);
const rcpiContract = new ethers.Contract(rcpiAddress, rcpiABI, wallet);
const rcsContract = new ethers.Contract(rcsAddress, rcsABI, wallet);
const reserveContract = new ethers.Contract(reserveAddress, reserveABI, wallet);
const swappoolContract = new ethers.Contract(
    swappoolAddress,
    swappoolABI,
    wallet
);
const ReserveManagerContract = new ethers.Contract(RcoinReserveAddress, RcoinReserveABI, wallet);


// Function to get the latest CPI delta
async function ReserveCal() {
    const results = [];
    let lastValue;
    fs.createReadStream("cpi_data.csv") // replace with your CSV file path
        .pipe(csvParser())
        .on("data", (data) => results.push(data))
        .on("end", () => {
            lastValue = results[0].Last; // Assuming there is only one row of data
            console.log("Last value from CSV:", lastValue);
        });

    const gasPrice = (await provider.getFeeData()).gasPrice;
    console.log(gasPrice);
    const gasLimit = 100000;
    const fetchCpi = await fetchData();
    // Convert to numbers to ensure proper calculation
    const lastCPI = fetchCpi.Last;
    // const lastCPI = 193;
    const previousCPI = fetchCpi.Previous;

    // const previousCPI = 192;
    if (lastValue !== lastCPI) {
        const cpiDelta = lastCPI / previousCPI;
        console.log("Cpi delta " + cpiDelta);

        try {
            // Fetch the total Rcoin balance
            let totalRcoin = await reserveContract.totalRcoinBalance();
            totalRcoin = ethers.formatUnits(totalRcoin, 18);
            // const totalRcoin = 100;
            console.log(`Total Rcoin Balance: ${totalRcoin} RCOIN`);

            // Fetch the total Rcpi balance
            let totalRcpi = await rcpiContract.totalSupply();
            totalRcpi = ethers.formatUnits(totalRcpi, 18);
            // const totalRcpi = 100;
            console.log(`Total Rcpi Balance: ${totalRcpi} RCPI`);

            let RcoinPrice = await ReserveManagerContract.priceRcoin();
            RcoinPrice = ethers.formatUnits(RcoinPrice.toString(),18);
            let USDINRPrice = await ReserveManagerContract.getUSDToINRPrice();
            USDINRPrice = ethers.formatUnits(USDINRPrice.toString(),18);
            RcoinPrice = RcoinPrice / USDINRPrice;

            const RcpiPrice = totalRcoin*RcoinPrice / totalRcpi;
            console.log("Price of the rcpi coin " + RcpiPrice);

            if (cpiDelta !== 1) {
                if (cpiDelta > 1) {
                    const newPegPrice = cpiDelta * RcpiPrice;
                    console.log("The Rcpi New Peg Price is " + newPegPrice);

                    let TotalCollatralNeeded =
                        (newPegPrice * totalRcpi) - (totalRcoin*RcoinPrice);
                    console.log(
                        "The Amount of the rcoin needed " + TotalCollatralNeeded
                    );

                    // Fetch the total Rcoin balance
                    // let totalswapRcoin =
                    //     await swappoolContract.totalRcoinBalance();
                    // totalswapRcoin = ethers.formatUnits(totalswapRcoin, 18);
                    // // const totalswapRcoin = 100;
                    // console.log(
                    //     `Total Rcoin Balance in Swap-Pool: ${totalswapRcoin} RCOIN`
                    // );

                    // Fetch the total Rcpi balance
                    // let totalswapRcs = await swappoolContract.totalRcsBalance();
                    // totalswapRcs = ethers.formatUnits(totalswapRcs, 18);
                    // // const totalswapRcs = 100;
                    // console.log(
                    //     `Total Rcs Swap-Pool Balance: ${totalswapRcs} RCS`
                    // );

                    let RcsPrice = await RcoinSwappool.getRCSPrice();
                    RcsPrice = ethers.formatUnits(RcsPrice.toString(),18);
                    console.log(
                        "The Price of the rcs Swap-Pool coin " + RcsPrice
                    );

                    // rcoin amount which we have get divivde by rcs price it will give me rcs amount
                    let rcsAmount = TotalCollatralNeeded / RcsPrice;
                    console.log("Amount to provide : " + rcsAmount);
                    TotalCollatralNeeded = ethers.parseEther(
                        TotalCollatralNeeded.toString(),
                        18
                    );
                    rcsAmount = ethers.parseEther(rcsAmount.toString(), 18);

                    // Mint RCS tokens
                    const mintTx = await rcsContract.mint(
                        wallerAddress,
                        rcsAmount,
                        { gasPrice: gasPrice, gasLimit: gasLimit }
                    ); // Ensure your contract has a mint function
                    await mintTx.wait(); // Wait for the transaction to be mined
                    console.log("Minted " + rcsAmount + " RCS");

                    // Approve the swap pool to spend the minted RCS tokens
                    const approvalTx = await rcsContract.approve(
                        swappoolAddress,
                        rcsAmount,
                        { gasPrice: gasPrice, gasLimit: gasLimit }
                    );
                    await approvalTx.wait(); // Wait for the transaction to be mined
                    console.log("Approved " + rcsAmount + " RCS");

                    // Deposit RCS into the swap pool
                    const depositRcsTx = await swappoolContract.depositRcs(
                        rcsAmount,
                        { gasPrice: gasPrice, gasLimit: gasLimit }
                    );
                    await depositRcsTx.wait(); // Wait for the transaction to be mined
                    console.log("Deposited " + rcsAmount + " RCS");

                    // Withdraw RCOIN from the swap pool
                    const withdrawRcoinTx =
                        await swappoolContract.withdrawRcoin(
                            TotalCollatralNeeded.toString(),
                            { gasPrice: gasPrice, gasLimit: gasLimit }
                        );
                    await withdrawRcoinTx.wait(); // Wait for the transaction to be mined
                    console.log("Withdraw " + TotalCollatralNeeded + " RCoin");

                    const approveRcoin = await rcoinContract.approve(
                        reserveAddress,
                        TotalCollatralNeeded,
                        { gasPrice: gasPrice, gasLimit: gasLimit }
                    );
                    await approveRcoin.wait();
                    console.log("Approved " + TotalCollatralNeeded + " Rcoin");

                    const depositRcoinTx = await reserveContract.depositRcoin(
                        TotalCollatralNeeded,
                        { gasPrice: gasPrice, gasLimit: gasLimit }
                    );
                    await depositRcoinTx.wait(); // Wait for the transaction to be mined
                    console.log("Deposit " + TotalCollatralNeeded + " RCoin");

                    let fetchRcsPrice = await RcoinSwappool.getRCSPrice();
                    fetchRcsPrice = ethers.formatUnits(fetchRcsPrice,18);
                    const writeRcsPriceToCSV = (fetchRcsPrice) => {
                        const filePath = "./reserve-frontend/public/Rcs.csv";
                        // Prepare the CSV data
                        const csvData = [{ fetchRcsPrice }]; // Create an array of objects
                        if (!fs.existsSync(filePath)) {
                            // If file doesn't exist, create it with the header
                            const parser = new Parser({
                                fields: ["fetchRcsPrice"],
                            }); // Specify fields for the header
                            const csv = parser.parse(csvData);
                            fs.writeFileSync(filePath, csv + "\n"); // Write CSV with header and newline
                        } else {
                            // If file exists, append new data without headers
                            const parser = new Parser({
                                fields: ["fetchRcsPrice"],
                                header: false,
                            }); // Disable header
                            const csv = parser.parse(csvData);
                            fs.appendFileSync(filePath, csv + "\n"); // Append data with newline
                        }
                    };
                    // Call this function where you want to write newPegPrice
                    writeRcsPriceToCSV(fetchRcsPrice);

                    const writeNewPegPriceToCSV = (newPegPrice) => {
                        const filePath = "./reserve-frontend/public/Rcpi.csv";
                        // Prepare the CSV data
                        const csvData = [{ newPegPrice }]; // Create an array of objects
                        if (!fs.existsSync(filePath)) {
                            // If file doesn't exist, create it with the header
                            const parser = new Parser({
                                fields: ["newPegPrice"],
                            }); // Specify fields for the header
                            const csv = parser.parse(csvData);
                            fs.writeFileSync(filePath, csv + "\n"); // Write CSV with header and newline
                        } else {
                            // If file exists, append new data without headers
                            const parser = new Parser({
                                fields: ["newPegPrice"],
                                header: false,
                            }); // Disable header
                            const csv = parser.parse(csvData);
                            fs.appendFileSync(filePath, csv + "\n"); // Append data with newline
                        }
                    };
                    writeNewPegPriceToCSV(newPegPrice);
                } else {
                    const newPegPrice = cpiDelta * RcpiPrice;
                    console.log("The Rcpi New Peg Price is " + newPegPrice);

                    let TotalCollatralRemove =
                        (totalRcoin*RcoinPrice) - newPegPrice * totalRcpi;
                    console.log(
                        "The Amount of the rcoin needed to remove from the reserve " +
                            TotalCollatralRemove
                    );
                    TotalCollatralRemove = ethers.parseEther(
                        TotalCollatralRemove.toString(),
                        18
                    );
                    // The Amount of the Rcoin to be removed
                    const withdrawRcoinTx = await reserveContract.withdrawRcoin(
                        TotalCollatralRemove,
                        { gasPrice: gasPrice, gasLimit: gasLimit }
                    );
                    await withdrawRcoinTx.wait(); // Wait for the transaction
                    console.log(
                        "Withdraw " +
                            TotalCollatralRemove +
                            " RCOIN from the reserve"
                    );

                    // Fetch the total Rcoin balance in the swappool
                    // let totalswapRcoin =
                    //     await swappoolContract.totalRcoinBalance();
                    // totalswapRcoin = ethers.formatUnits(totalswapRcoin, 18);
                    // console.log(
                    //     `Total Rcoin Balance in Swap-Pool: ${totalswapRcoin} RCOIN`
                    // );

                    // // Fetch the total Rcs balance in the swappool
                    // let totalswapRcs = await swappoolContract.totalRcsBalance();
                    // totalswapRcs = ethers.formatUnits(totalswapRcs, 18);
                    // console.log(
                    //     `Total Rcs Balance in Swap-Pool: ${totalswapRcs} RCS`
                    // );

                    let RcsPrice = await RcoinSwappool.getRCSPrice();
                    RcsPrice = ethers.formatUnits(RcsPrice,18);
                    console.log("The Price of the rcs coin " + RcsPrice);

                    // rcoin amount which we have get divivde by rcs price it will give me rcs amount
                    TotalCollatralRemove = ethers.formatUnits(
                        TotalCollatralRemove,
                        18
                    );

                    let rcsAmount = TotalCollatralRemove / RcsPrice;
                    console.log(rcsAmount);

                    TotalCollatralRemove = ethers.parseEther(
                        TotalCollatralRemove.toString(),
                        18
                    );
                    rcsAmount = ethers.parseEther(rcsAmount.toString(), 18);

                    // Approve the swap pool to spend the RCOIN tokens
                    const approvalTx = await rcoinContract.approve(
                        swappoolAddress,
                        TotalCollatralRemove,
                        { gasPrice: gasPrice, gasLimit: gasLimit }
                    );
                    await approvalTx.wait(); // Wait for the transaction to be mined
                    console.log("Approved " + TotalCollatralRemove + " RCOIN");

                    // Deposit RCOIN into the swap pool
                    const depositRcoinTx = await swappoolContract.depositRcoin(
                        TotalCollatralRemove,
                        { gasPrice: gasPrice, gasLimit: gasLimit }
                    );
                    await depositRcoinTx.wait(); // Wait for the transaction to be mined
                    console.log("Deposited " + TotalCollatralRemove + " RCOIN");

                    // Withdraw RCS from the swap pool
                    const withdrawRcsTx = await swappoolContract.withdrawRcs(
                        rcsAmount.toString(),
                        { gasPrice: gasPrice, gasLimit: gasLimit }
                    );
                    await withdrawRcsTx.wait(); // Wait for the transaction to be mined
                    console.log("Withdraw " + rcsAmount + " RCS");

                    const burnRcstx = await rcsContract.burn(
                        rcsAmount.toString(),
                        {
                            gasPrice: gasPrice,
                            gasLimit: gasLimit,
                        }
                    );
                    await burnRcstx.wait();
                    console.log("Burned Rcs Amount " + rcsAmount);

                    let fetchRcsPrice = await RcoinSwappool.getRCSPrice();
                    fetchRcsPrice = ethers.formatUnits(fetchRcsPrice,18);
                    const writeRcsPriceToCSV = (fetchRcsPrice) => {
                        const filePath = "./reserve-frontend/public/Rcs.csv";
                        // Prepare the CSV data
                        const csvData = [{ fetchRcsPrice }]; // Create an array of objects

                        if (!fs.existsSync(filePath)) {
                            // If file doesn't exist, create it with the header
                            const parser = new Parser({
                                fields: ["fetchRcsPrice"],
                            }); // Specify fields for the header
                            const csv = parser.parse(csvData);
                            fs.writeFileSync(filePath, csv + "\n"); // Write CSV with header and newline
                        } else {
                            // If file exists, append new data without headers
                            const parser = new Parser({
                                fields: ["fetchRcsPrice"],
                                header: false,
                            }); // Disable header
                            const csv = parser.parse(csvData);
                            fs.appendFileSync(filePath, csv + "\n"); // Append data with newline
                        }
                    };
                    // Call this function where you want to write newPegPrice
                    writeRcsPriceToCSV(fetchRcsPrice);

                    // write the value in the csv file
                    const writeNewPegPriceToCSV = (newPegPrice) => {
                        const filePath = "./reserve-frontend/public/Rcpi.csv";

                        // Prepare the CSV data
                        const csvData = [{ newPegPrice }]; // Create an array of objects

                        if (!fs.existsSync(filePath)) {
                            // If file doesn't exist, create it with the header
                            const parser = new Parser({
                                fields: ["newPegPrice"],
                            }); // Specify fields for the header
                            const csv = parser.parse(csvData);
                            fs.writeFileSync(filePath, csv + "\n"); // Write CSV with header and newline
                        } else {
                            // If file exists, append new data without headers
                            const parser = new Parser({
                                fields: ["newPegPrice"],
                                header: false,
                            }); // Disable header
                            const csv = parser.parse(csvData);
                            fs.appendFileSync(filePath, csv + "\n"); // Append data with newline
                        }
                    };
                    writeNewPegPriceToCSV(newPegPrice);
                }

                const parser = new Parser();
                const csv = parser.parse(fetchCpi);
                fs.writeFileSync("cpi_data.csv", csv);
            } else {
                console.log("We dont have any price change in the indian cpi");

                // Fetch the total Rcoin balance
                // let totalswapRcoin = await swappoolContract.totalRcoinBalance();
                // totalswapRcoin = ethers.formatUnits(totalswapRcoin, 18);
                // // const totalswapRcoin = 100;
                // console.log(
                //     `Total Rcoin Balance in Swap-Pool: ${totalswapRcoin} RCOIN`
                // );

                // // Fetch the total Rcpi balance
                // let totalswapRcs = await swappoolContract.totalRcsBalance();
                // totalswapRcs = ethers.formatUnits(totalswapRcs, 18);
                // // const totalswapRcs = 100;
                // console.log(`Total Rcs Swap-Pool Balance: ${totalswapRcs} RCS`);

                let RcsPrice = await RcoinSwappool.getRCSPrice();
                RcsPrice = ethers.formatUnits(RcsPrice,18);
                console.log("The Price of the rcs Swap-Pool coin " + RcsPrice);

                let fetchRcsPrice = await RcoinSwappool.getRCSPrice();
                fetchRcsPrice = ethers.formatUnits(fetchRcsPrice.toString(),18);
                const writeRcsPriceToCSV = (fetchRcsPrice) => {
                    const filePath = "./reserve-frontend/public/Rcs.csv";
                    // Prepare the CSV data
                    const csvData = [{ fetchRcsPrice }]; // Create an array of objects
                    if (!fs.existsSync(filePath)) {
                        // If file doesn't exist, create it with the header
                        const parser = new Parser({
                            fields: ["fetchRcsPrice"],
                        }); // Specify fields for the header
                        const csv = parser.parse(csvData);
                        fs.writeFileSync(filePath, csv + "\n"); // Write CSV with header and newline
                    } else {
                        // If file exists, append new data without headers
                        const parser = new Parser({
                            fields: ["fetchRcsPrice"],
                            header: false,
                        }); // Disable header
                        const csv = parser.parse(csvData);
                        fs.appendFileSync(filePath, csv + "\n"); // Append data with newline
                    }
                };
                // Call this function where you want to write newPegPrice
                writeRcsPriceToCSV(fetchRcsPrice);

                const newPegPrice = cpiDelta * RcpiPrice;
                console.log("The Rcpi New Peg Price is " + newPegPrice);
                const writeNewPegPriceToCSV = (newPegPrice) => {
                    const filePath = "./reserve-frontend/public/Rcpi.csv";
                    // Prepare the CSV data
                    const csvData = [{ newPegPrice }]; // Create an array of objects
                    if (!fs.existsSync(filePath)) {
                        // If file doesn't exist, create it with the header
                        const parser = new Parser({
                            fields: ["newPegPrice"],
                        }); // Specify fields for the header
                        const csv = parser.parse(csvData);
                        fs.writeFileSync(filePath, csv + "\n"); // Write CSV with header and newline
                    } else {
                        // If file exists, append new data without headers
                        const parser = new Parser({
                            fields: ["newPegPrice"],
                            header: false,
                        }); // Disable header
                        const csv = parser.parse(csvData);
                        fs.appendFileSync(filePath, csv + "\n"); // Append data with newline
                    }
                };
                writeNewPegPriceToCSV(newPegPrice);
            }
        } catch (error) {
            console.error("Error fetching total balances:", error);
        }
    }
}

// Call the function
ReserveCal();
// setInterval(ReserveCal, 120000);
// module.exports = {
//     ReserveCal,
// };
