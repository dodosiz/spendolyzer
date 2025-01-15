import { Button, Container, CssBaseline, Paper, styled } from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import React from "react";
import Papa from "papaparse";
import { DataGrid, GridColDef } from "@mui/x-data-grid";

const VisuallyHiddenInput = styled("input")({
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  height: 1,
  overflow: "hidden",
  position: "absolute",
  bottom: 0,
  left: 0,
  whiteSpace: "nowrap",
  width: 1,
});

const PAYEE_COLUMN = 0;
const AMOUNT_COLUMN = 1;

interface Transaction {
  id: number;
  payee: string;
  amount: number;
}

const paginationModel = { page: 0, pageSize: 50 };

export function App() {
  const [transactions, setTransactions] = React.useState<Transaction[]>([]);
  const [income, setIncome] = React.useState<number>(0);
  const [costs, setCosts] = React.useState<number>(0);
  const [columns, setColumns] = React.useState<GridColDef[]>([]);
  const handleUpload = (files: FileList | null) => {
    const file = files?.[0];
    if (!file) {
      return;
    }
    Papa.parse(file, {
      complete: function (results: { data: string[][] }) {
        const content = results.data.slice(1);
        const totals: { [key: string]: number } = {};
        let incomeSum = 0;
        let costsSum = 0;
        for (const row of content) {
          const payee = row[PAYEE_COLUMN];
          const amount = parseFloat(row[AMOUNT_COLUMN]);
          if (payee && payee.length && !isNaN(amount)) {
            if (amount < 0) {
              const firstWord = payee.split(" ")[0];
              totals[firstWord] = (totals[firstWord] || 0) + amount;
              costsSum += amount;
            } else {
              incomeSum += amount;
            }
          }
        }
        const aggregatedTransactions = Object.entries(totals)
          .map(([payee, amount]) => ({
            id: 0,
            payee,
            amount: -amount,
          }))
          .sort((a, b) => b.amount - a.amount);
        for (let i = 0; i < aggregatedTransactions.length; i++) {
          aggregatedTransactions[i].id = i + 1;
        }
        setTransactions(aggregatedTransactions);
        setIncome(incomeSum);
        setCosts(costsSum);
        setColumns([
          { field: "id", headerName: "ID", width: 70 },
          { field: "payee", headerName: "Payee", width: 130 },
          {
            field: "amount",
            headerName: "Amount",
            type: "number",
            width: 90,
          },
          {
            field: "percentage",
            headerName: "Percentage",
            width: 90,
            valueGetter: (_value, row) =>
              `${
                Math.floor((row.amount / Math.abs(costsSum)) * 10000) / 100
              } %`,
          },
        ]);
      },
    });
  };
  return (
    <React.Fragment>
      <CssBaseline />
      <Container maxWidth="lg">
        <h1>Upload CSV</h1>
        <Button
          component="label"
          role={undefined}
          variant="contained"
          tabIndex={-1}
          startIcon={<CloudUploadIcon />}
        >
          Upload CSV
          <VisuallyHiddenInput
            type="file"
            onChange={(event) => handleUpload(event.target.files)}
          />
        </Button>
        <h2>Income: {income}</h2>
        <h2>Costs: {costs}</h2>
        <h2>Balance: {income - Math.abs(costs)}</h2>
        <Paper sx={{ height: 400, width: "100%" }}>
          <DataGrid
            rows={transactions}
            columns={columns}
            initialState={{ pagination: { paginationModel } }}
            pageSizeOptions={[5, 10]}
            checkboxSelection
            sx={{ border: 0 }}
          />
        </Paper>
      </Container>
    </React.Fragment>
  );
}
