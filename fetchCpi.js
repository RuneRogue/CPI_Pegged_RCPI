const axios = require("axios");
const cheerio = require("cheerio");
// const fs = require("fs");
const csvParser = require("csv-parser");
// const { Parser } = require("json2csv");

// URL of the webpage
const url = "https://tradingeconomics.com/india/inflation-cpi";

// Function to fetch and parse CPI data
const fetchData = async () => {
    try {
        // Fetch the webpage
        const { data } = await axios.get(url, {
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            },
        });

        // Load the HTML into cheerio
        const $ = cheerio.load(data);

        // Find all tables with the class 'table table-hover'
        const tables = $("table.table-hover");

        // Check if at least two tables are found
        if (tables.length < 2) {
            console.log("The second table was not found");
            return;
        }

        // Select the second table and extract CPI data
        const secondTable = tables.eq(1);
        const cpiData = [];
        secondTable
            .find("tr.datatable-row, tr.datatable-row-alternating")
            .each((i, row) => {
                const cols = $(row).find("td");
                if ($(cols[0]).text().includes("Consumer Price Index CPI")) {
                    cpiData.push({
                        Last: $(cols[1]).text().trim(),
                        Previous: $(cols[2]).text().trim(),
                    });
                }
            });

        // Print the extracted CPI data
        const lastCPI = parseFloat(cpiData[0].Last);
        // console.log(lastCPI);
        const previousCPI = parseFloat(cpiData[0].Previous);
        // console.log(previousCPI);

        // console.log(`Last CPI: ${lastCPI}, Previous CPI: ${previousCPI}`);

        // Optional: Save the fetched CPI data to a CSV file
        // const parser = new Parser();
        // const csv = parser.parse(cpiData);
        // fs.writeFileSync("cpi_data.csv", csv);
        return cpiData[0];
    } catch (error) {
        console.error(`Error: ${error.message}`);
    }
};
module.exports = fetchData;
// fetchData();
