import React from 'react';
import ProtectedRoute from '../components/ProtectedRoute';
import BlogGenerator from '../components/Blog/BlogGenerator';

const BlogGeneratorPage = () => {
  return (
    <ProtectedRoute>
      <BlogGenerator />
    </ProtectedRoute>
  );
};

export default BlogGeneratorPage;