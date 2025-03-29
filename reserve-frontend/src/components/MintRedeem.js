// src/components/MintRedeem.js
import React, { useState, useEffect } from "react";
import { ethers } from "ethers"; // Ensure you have ethers installed
import Papa from "papaparse"; // Import papaparse

// Import your contract ABIs and addresses
import RcoinABI from "../ContractABI/Rcoin.json";
import RcpiABI from "../ContractABI/RCPI.json";
import ReserveABI from "../ContractABI/Reserve.json";
import ReserveManagerManagerABI from "../ContractABI/ReserveManagerABI.json";
// Replace these with your actual deployed contract addresses
const RCOIN_ADDRESS = "0x340652080037645088F2bA858dA76D8C2467BDCB";
const RCPI_ADDRESS = "0xE84aE6890CEcb5c77b8C59681C596d47D754A208";
const RESERVE_ADDRESS = "0x5a0Bf76bD28F803BB40be3135b6f11ced8a9Cc75";
const walletAddress = "0x5d8Ac255E9325a41Cd2bDe244758CdbA1bFD8f0f";

const RcoinReserveAddress = "0x06a6e91dA901Fb5b3233611Fee5dA97Ca620bDa1";


// const INFURA_API_URL = `https://bsc-testnet.infura.io/v3/acb090facd8a4303995721ecef70b4eb`;
const INFURA_API_URL = `https://polygon-amoy.g.alchemy.com/v2/ON1ctftr6l4I-udsVICw75aKx-JLPufd`;
const provider = new ethers.providers.JsonRpcProvider(INFURA_API_URL);
const PRIVATE_KEY =
    "9455752e893232f2df870be7b333a99175a08da9fa12cd8328596cd8c5bdacda";




const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
const ReserveManagerContract = new ethers.Contract(RcoinReserveAddress, ReserveManagerManagerABI, wallet);

const MintRedeem = () => {
    const [mintAmountRcoin, setMintAmountRcoin] = useState(0); // Separate state for Mint section's Rcoin
    const [mintAmountRcpi, setMintAmountRcpi] = useState(0); // Separate state for Mint section's Rcpi
    const [redeemAmountRcoin, setRedeemAmountRcoin] = useState(0); // Separate state for Redeem section's Rcoin
    const [redeemAmountRcpi, setRedeemAmountRcpi] = useState(0); // Separate state for Redeem section's Rcpi
    const [userBalance, setUserBalance] = useState(0); // User's Rcoin balance
    const [userAddress, setUserAddress] = useState(""); // User's wallet address
    const [rcpiPrice, setRcpiPrice] = useState(1);

    const hardprovider = new ethers.providers.JsonRpcProvider(INFURA_API_URL);
    const hardwallet = new ethers.Wallet(PRIVATE_KEY, hardprovider);

    const fetchUserBalance = async (signer) => {
        const rcoinContract = new ethers.Contract(
            RCOIN_ADDRESS,
            RcoinABI,
            signer
        );
        const balance = await rcoinContract.balanceOf(
            await signer.getAddress()
        );
        setUserBalance(ethers.utils.formatUnits(balance, 18)); // Format the balance to a human-readable format
    };

    const connectWallet = async () => {
        if (!window.ethereum) {
            alert("Please install MetaMask!");
            return;
        }

        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = await provider.getSigner(); // Ensure you await this

        try {
            // Request account access
            await provider.send("eth_requestAccounts", []);
            const address = await signer.getAddress();
            setUserAddress(address);
            await fetchUserBalance(signer);
            alert(`Connected: ${address}`);
        } catch (error) {
            console.error("Error connecting wallet:", error);
            alert("Error connecting wallet. Please try again.");
        }
    };

    const handleMint = async () => {
        const gasPrice = await hardprovider.getGasPrice();
        const gasLimit = 10000000;
        if (!userAddress) {
            alert("Please connect your wallet first!");
            return;
        }

        // Check if the user has sufficient Rcoin
        if (mintAmountRcoin > userBalance) {
            alert("Insufficient Rcoin balance!");
            return;
        }

        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = await provider.getSigner(); // Ensure you await this

        // 1. Approve the Reserve contract to spend Rcoin
        try {
            const rcoinContract = new ethers.Contract(
                RCOIN_ADDRESS,
                RcoinABI,
                signer
            );
            const txTransfer = await rcoinContract.transfer(
                RESERVE_ADDRESS,
                ethers.utils.parseUnits(mintAmountRcoin.toString(), 18),
                { gasPrice: gasPrice, gasLimit: gasLimit }
            );
            await txTransfer.wait(); // Wait for transaction to be mined
            console.log("Rcoin transfer successfully.");
        } catch (error) {
            console.error("Error transfer Rcoin:", error);
            return;
        }

        try {
            const rcpiContract = new ethers.Contract(
                RCPI_ADDRESS,
                RcpiABI,
                hardwallet
            );
            const txMint = await rcpiContract.mint(
                walletAddress,
                ethers.utils.parseUnits(mintAmountRcpi.toString(), 18),
                { gasPrice: gasPrice, gasLimit: gasLimit }
            );
            console.log(txMint);
            await txMint.wait(); // Wait for transaction to be mined
            console.log("RCPI minted successfully.");
        } catch (error) {
            console.error("Error minting RCPI:", error);
            return;
        }
        alert(`Successfully minted ${mintAmountRcpi} RCPI!`);

        try {
            const rcpiContract = new ethers.Contract(
                RCPI_ADDRESS,
                RcpiABI,
                hardwallet
            );
            const txTransfer = await rcpiContract.transfer(
                signer.getAddress(),
                ethers.utils.parseUnits(mintAmountRcpi.toString(), 18),
                { gasPrice: gasPrice, gasLimit: gasLimit }
            );
            await txTransfer.wait(); // Wait for transaction to be mined
            console.log("Rcpi transfered successfully.");
        } catch (error) {
            console.error("Error transfer Rcpi:", error);
            return;
        }

        setMintAmountRcoin(0);
        setMintAmountRcpi(0); // Reset input fields
        await fetchUserBalance(signer); // Refresh user balance after minting
    };

    const handleRedeem = async () => {
        const gasPrice = await hardprovider.getGasPrice();
        const gasLimit = 10000000;
        if (!userAddress) {
            alert("Please connect your wallet first!");
            return;
        }

        // Check if the user has sufficient Rcoin
        if (redeemAmountRcpi > userBalance) {
            alert("Insufficient Rcoin balance!");
            return;
        }

        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = await provider.getSigner(); // Ensure you await this

        // try {
        //     const rcpiContract = new ethers.Contract(
        //         RCPI_ADDRESS,
        //         RcpiABI,
        //         signer
        //     );
        //     const txBurn = await rcpiContract.burn(
        //         signer.getAddress(),
        //         ethers.utils.parseUnits(redeemAmountRcpi.toString(), 18)
        //     );
        //     await txBurn.wait(); // Wait for transaction to be mined
        //     console.log("Rcpi transfered successfully.");
        // } catch (error) {
        //     console.error("Error approving Rcpi:", error);
        //     return;
        // }

        try {
            const rcpiContract = new ethers.Contract(
                RCPI_ADDRESS,
                RcpiABI,
                signer
            );
            const txTransfer = await rcpiContract.transfer(
                RESERVE_ADDRESS,
                ethers.utils.parseUnits(redeemAmountRcpi.toString(), 18),
                { gasPrice: gasPrice, gasLimit: gasLimit }
            );
            await txTransfer.wait(); // Wait for transaction to be mined
            console.log("Rcpi transfer successfully.");
        } catch (error) {
            console.error("Error transfer Rcpi:", error);
            return;
        }

        try {
            const reserveContract = new ethers.Contract(
                RESERVE_ADDRESS,
                ReserveABI,
                hardwallet
            );
            const txWithdraw = await reserveContract.withdrawRcoin(
                ethers.utils.parseUnits(redeemAmountRcoin.toString(), 18),
                { gasPrice: gasPrice, gasLimit: gasLimit }
            );
            await txWithdraw.wait(); // Wait for transaction to be mined
            console.log("RCOIN withdraw successfully.");
        } catch (error) {
            console.error("Error withdraw rcoin:", error);
            return;
        }
        alert(`Successfully withdraw ${redeemAmountRcoin} RCOIN!`);

        try {
            const rcoinContract = new ethers.Contract(
                RCOIN_ADDRESS,
                RcoinABI,
                hardwallet
            );
            const txTransfer = await rcoinContract.transfer(
                signer.getAddress(),
                ethers.utils.parseUnits(redeemAmountRcoin.toString(), 18),
                { gasPrice: gasPrice, gasLimit: gasLimit }
            );
            await txTransfer.wait(); // Wait for transaction to be mined
            console.log("Rcoin transfered successfully.");
        } catch (error) {
            console.error("Error transfer Rcpi:", error);
            return;
        }

        try {
            const reserveContract = new ethers.Contract(
                RESERVE_ADDRESS,
                ReserveABI,
                hardwallet
            );
            const withdrawRcpiTx = await reserveContract.withdrawRcpi(
                ethers.utils.parseUnits(redeemAmountRcpi.toString(), 18)
            );
            await withdrawRcpiTx.wait(); // Wait for transaction to be mined
            console.log("Rcpi withdraw successfully.");
        } catch (error) {
            console.error("Error withdraw Rcpi:", error);
            return;
        }

        try {
            const rcpiContract = new ethers.Contract(
                RCPI_ADDRESS,
                RcpiABI,
                hardwallet
            );
            const txBurn = await rcpiContract.burn(
                ethers.utils.parseUnits(redeemAmountRcpi.toString(), 18)
            );
            await txBurn.wait(); // Wait for transaction to be mined
            console.log("Rcpi burn successfully.");
        } catch (error) {
            console.error("Error approving Rcpi:", error);
            return;
        }

        setRedeemAmountRcoin(0);
        setRedeemAmountRcpi(0); // Reset input fields
        await fetchUserBalance(signer); // Refresh user balance after minting
    };

    const fetchRcpiPriceFromCSV = async () => {
        try {
            const response = await fetch("/Rcpi.csv"); // Fetch CSV file from public folder
            const reader = response.body.getReader();
            const result = await reader.read();
            const decoder = new TextDecoder("utf-8");
            const csvData = decoder.decode(result.value);

            // Parse the CSV data
            Papa.parse(csvData, {
                complete: (result) => {
                    const data = result.data;
                    // console.log(data);
                    const price = data[data.length - 2];
                    console.log("The fetched price is " + price.toString());
                    setRcpiPrice(parseFloat(price));
                },
                error: (error) => {
                    console.error("Error parsing CSV:", error);
                },
            });
        } catch (error) {
            console.error("Error fetching CSV:", error);
        }
    };

    const handleMintRcoinChange = async(e) => {
        const value = e.target.value; // User's input for Rcoin amount
        let RcoinPrice = await ReserveManagerContract.priceRcoin();
        RcoinPrice = ethers.utils.formatUnits(RcoinPrice.toString(),18);
        let USDINRPrice = await ReserveManagerContract.getUSDToINRPrice();
        USDINRPrice = ethers.utils.formatUnits(USDINRPrice.toString(),18);
        RcoinPrice = RcoinPrice / USDINRPrice;
        setMintAmountRcoin(value);

        if (value > 0) {
            const totalRcpi = value * RcoinPrice/ rcpiPrice; // Divide Rcoin by the fetched price to get RCPI
            setMintAmountRcpi(totalRcpi); // Update the state with the calculated RCPI
        } else {
            setMintAmountRcpi(0); // Reset RCPI amount if input is invalid
        }
    };

    const handleRedeemRcpiChange = async(e) => {
        const value = e.target.value; //User input for the Rcpi amount
        let RcoinPrice = await ReserveManagerContract.priceRcoin();
        RcoinPrice = ethers.utils.formatUnits(RcoinPrice.toString(),18);
        let USDINRPrice = await ReserveManagerContract.getUSDToINRPrice();
        USDINRPrice = ethers.utils.formatUnits(USDINRPrice.toString(),18);
        RcoinPrice = RcoinPrice / USDINRPrice;
        setRedeemAmountRcpi(value);

        if (value > 0) {
            const totalRcoin = value * rcpiPrice/RcoinPrice;
            setRedeemAmountRcoin(totalRcoin);
        } else {
            setRedeemAmountRcoin(0);
        }
    };

    useEffect(() => {
        const init = async () => {
            if (window.ethereum) {
                const provider = new ethers.providers.Web3Provider(
                    window.ethereum
                );
                const signer = await provider.getSigner(); // Ensure you await this
                await fetchUserBalance(signer);
            }
            await fetchRcpiPriceFromCSV();
        };

        init();
    }, []);

    return (
        <div className="main-container">
            <div className="mint-box">
                {!userAddress ? (
                    <button onClick={connectWallet} className="connect-btn">
                        Connect Wallet
                    </button>
                ) : (
                    <div className="section">
                        <div className="Mint">
                            <h2>Mint</h2>
                            <div className="user-det">
                                <p>Connected: {userAddress}</p>
                                <div className="user-input">
                                    <input
                                        type="number"
                                        placeholder="Enter Rcoin amount"
                                        value={mintAmountRcoin}
                                        onChange={handleMintRcoinChange}
                                    />
                                </div>
                                <div className="user-input">
                                    <input
                                        type="number"
                                        placeholder="RCPI to be minted"
                                        value={mintAmountRcpi}
                                        readOnly // Prevents user input
                                    />
                                </div>
                                <button
                                    onClick={handleMint}
                                    className="mint-btn"
                                >
                                    Buy Rcpi
                                </button>
                            </div>
                        </div>
                        <div className="Mint">
                            <h2>Redeem</h2>
                            <div className="user-det">
                                <p>Connected: {userAddress}</p>
                                <div className="user-input">
                                    <input
                                        type="number"
                                        placeholder="Enter Rcpi amount"
                                        value={redeemAmountRcpi}
                                        onChange={handleRedeemRcpiChange}
                                    />
                                </div>
                                <div className="user-input">
                                    <input
                                        type="number"
                                        placeholder="RCOIN to be redeem"
                                        value={redeemAmountRcoin}
                                        readOnly // Prevents user input
                                    />
                                </div>
                                <button
                                    onClick={handleRedeem}
                                    className="mint-btn"
                                >
                                    Redeem Rcoin
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MintRedeem;
