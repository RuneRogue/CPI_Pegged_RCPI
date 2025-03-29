import React, { useEffect, useState } from "react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";
import Papa from "papaparse";

const RCPIPriceChart = () => {
    const [data, setData] = useState([]);

    useEffect(() => {
        const fetchData = () => {
            fetch("/Rcpi.csv") // Ensure this matches the route served by Express
                .then((response) => response.text())
                .then((csvData) => {
                    Papa.parse(csvData, {
                        header: true,
                        complete: (result) => {
                            const parsedData = result.data.map((row) => ({
                                // timestamp: row.timestamp,
                                price: parseFloat(row.price),
                            }));

                            // Keep only the last 40 entries
                            const last40Data = parsedData.slice(-40);
                            setData(last40Data); // Set parsed data to state
                        },
                    });
                });
        };

        fetchData();
        const interval = setInterval(fetchData, 60000); // Refetch CSV data every minute

        return () => clearInterval(interval); // Cleanup the interval on unmount
    }, []);

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            return (
                <div className="custom-tooltip">
                    {/* <p className="label">{`Timestamp: ${payload[0].payload.timestamp}`}</p> */}
                    <p className="label">{`Price: ${payload[0].value.toFixed(
                        4
                    )}`}</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="container">
            <ResponsiveContainer width="100%" height={400}>
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis domain={[0.6, 1.5]} />
                    {/* <YAxis domain /> */}
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line
                        type="linear"
                        dataKey="price"
                        stroke="#000000"
                        dot={false}
                        strokeWidth={2}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

export default RCPIPriceChart;
