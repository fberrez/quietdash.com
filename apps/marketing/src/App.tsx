import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HomePage } from '@/pages/HomePage';
import { VerifyPage } from '@/pages/VerifyPage';
import { ExperimentDebugPanel } from '@/components/ExperimentDebugPanel';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/verify" element={<VerifyPage />} />
      </Routes>
      <ExperimentDebugPanel />
    </BrowserRouter>
  );
}

export default App;
