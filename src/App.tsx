import React from 'react';
import './App.css';
import { Routes, Route, Navigate } from 'react-router-dom';
import List from './pages/List';
import Gallery from './pages/Gallery';
import Detail from './pages/Detail';

export default function App() {
  return (
    <div>
      <main>
        <Routes>
          <Route path="/" element={<List />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/detail/:id" element={<Detail />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
