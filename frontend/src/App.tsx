import { Routes, Route, Navigate } from 'react-router-dom';
import AccountsList from './pages/AccountsList';
 import AccountDetails from './pages/AccountDetails'; // Uncomment when you create

function App() {
  return (
    <Routes>
      <Route path="/" element={<AccountsList />} />
      {/* Example future route: */}
      {/* <Route path="/accounts/:id" element={<AccountDetails />} /> */}
      <Route path="/accounts/:id" element={<AccountDetails />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;