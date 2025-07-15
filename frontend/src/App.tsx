import { Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import AccountDetails from './pages/AccountDetails';
import TransactionsList from './pages/TransactionsList';
import TransactionDetails from './pages/TransactionDetails'; // <-- import the details page
import RecipientsList from './pages/RecipientsList';

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/accounts/:accountId/transactions" element={<TransactionsList />} />
        <Route path="/accounts/:id" element={<AccountDetails />} />
        <Route path="/transactions/:id" element={<TransactionDetails />} />
        <Route path="/accounts/:id/recipients" element={<RecipientsList />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}

export default App;