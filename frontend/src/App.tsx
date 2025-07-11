import { Routes, Route, Navigate } from 'react-router-dom';
import AccountsList from './pages/AccountsList';
import AccountDetails from './pages/AccountDetails';
import TransactionsList from './pages/TransactionsList';
import TransactionDetails from './pages/TransactionDetails'; // <-- import the details page
import AccountRecipients from './pages/AccountRecipients';

function App() {
  return (
    <Routes>
      <Route path="/" element={<AccountsList />} />
      <Route path="/accounts/:accountId/transactions" element={<TransactionsList />} />
      <Route path="/accounts/:id" element={<AccountDetails />} />
      <Route path="/transactions/:id" element={<TransactionDetails />} /> {/* <-- add this line */}
      <Route path="/accounts/:id/recipients" element={<AccountRecipients />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;