import React from 'react';
import ProtectedRoute from '../components/ProtectedRoute';
import SourceAnalyzer from '../components/Sources/SourceAnalyzer';

const SourceAnalyzerPage = () => {
  return (
    <ProtectedRoute>
      <SourceAnalyzer />
    </ProtectedRoute>
  );
};

export default SourceAnalyzerPage;