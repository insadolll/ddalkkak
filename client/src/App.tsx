import { BrowserRouter, Routes, Route } from 'react-router-dom';

function Home() {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center">
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-8 border border-white/30 shadow-sm text-center">
        <h1 className="text-2xl font-bold text-primary mb-2">딸깍 v2</h1>
        <p className="text-slate-500">사내 통합 관리 시스템</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
    </BrowserRouter>
  );
}
