import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

const BlogGenerator = () => {
  const { session } = useAuth();
  const [topic, setTopic] = useState('');
  const [keywords, setKeywords] = useState('');
  const [tone, setTone] = useState('professional');
  const [length, setLength] = useState('medium');
  const [loading, setLoading] = useState(false);
  const [generatedPost, setGeneratedPost] = useState(null);
  const [error, setError] = useState('');
  const [step, setStep] = useState('input'); // input, generating, preview

  const handleGenerate = async (e) => {
    e.preventDefault();
    setError('');

    if (!topic) {
      setError('Please enter a topic');
      return;
    }

    setLoading(true);
    setStep('generating');

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/blog/generate`,
        {
          topic,
          keywords,
          tone,
          length,
        },
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      setGeneratedPost(response.data.blogPost);
      setStep('preview');
      setLoading(false);

    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate blog post');
      setStep('input');
      setLoading(false);
    }
  };

  const handleSavePost = async () => {
    // Post is already saved, just redirect
    alert('Blog post saved successfully!');
    setStep('input');
    setTopic('');
    setKeywords('');
    setGeneratedPost(null);
  };

  return (
    <div className="min-h-screen bg-dark">
      {/* Header */}
      <header className="bg-card border-b border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-3xl font-doodle text-banana">AI Blog Generator</h1>
          <p className="text-gray-400 mt-1">Create SEO-optimized blog posts with AI</p>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {step === 'input' && (
          <div className="max-w-2xl mx-auto">
            <form onSubmit={handleGenerate} className="bg-card p-8 rounded-xl border border-gray-700">
              {error && (
                <div className="mb-6 bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              <div className="mb-6">
                <label className="block text-sm font-bold mb-2">Blog Topic *</label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  disabled={loading}
                  placeholder="e.g., The Future of AI in Marketing"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-banana disabled:opacity-50"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-bold mb-2">Target Keywords</label>
                <input
                  type="text"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  disabled={loading}
                  placeholder="e.g., AI marketing, digital transformation"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-banana disabled:opacity-50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-bold mb-2">Tone</label>
                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    disabled={loading}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-banana disabled:opacity-50"
                  >
                    <option value="professional">Professional</option>
                    <option value="casual">Casual</option>
                    <option value="technical">Technical</option>
                    <option value="conversational">Conversational</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2">Length</label>
                  <select
                    value={length}
                    onChange={(e) => setLength(e.target.value)}
                    disabled={loading}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-banana disabled:opacity-50"
                  >
                    <option value="short">Short (500-800 words)</option>
                    <option value="medium">Medium (800-1500 words)</option>
                    <option value="long">Long (1500-2500 words)</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-banana text-gray-900 font-bold py-3 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="spinner-small"></div>
                    <span>Generating...</span>
                  </div>
                ) : (
                  'Generate Blog Post'
                )}
              </button>
            </form>
          </div>
        )}

        {step === 'generating' && (
          <div className="max-w-2xl mx-auto text-center py-24">
            <div className="spinner mb-6"></div>
            <h2 className="text-3xl font-bold mb-3">Generating Your Blog Post</h2>
            <div className="space-y-2 text-gray-400">
              <p>📝 Creating outline...</p>
              <p className="mt-3">✍️ Writing content sections...</p>
              <p className="mt-3">✨ Polishing and optimizing...</p>
            </div>
            <p className="mt-6 text-sm text-gray-500">This typically takes 30-60 seconds</p>
          </div>
        )}

        {step === 'preview' && generatedPost && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-card p-8 rounded-xl border border-gray-700">
              <div className="mb-8">
                <button
                  onClick={() => setStep('input')}
                  className="text-banana hover:underline mb-6"
                >
                  ← Generate Another Post
                </button>

                <h2 className="text-3xl font-bold mb-4">{generatedPost.title}</h2>

                <div className="flex flex-wrap gap-2 mb-6">
                  {generatedPost.metadata?.suggestedKeywords?.map((keyword) => (
                    <span
                      key={keyword}
                      className="bg-banana/20 text-banana text-xs px-3 py-1 rounded-full"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>

                <div className="bg-gray-800 p-4 rounded-lg mb-6">
                  <p className="text-sm text-gray-400 mb-1">Meta Description</p>
                  <p className="text-white">{generatedPost.metadata?.metaDescription}</p>
                </div>
              </div>

              <div className="prose prose-invert max-w-none mb-8">
                <div className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {generatedPost.content}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleSavePost}
                  className="flex-1 bg-banana text-gray-900 font-bold py-3 rounded-lg hover:opacity-90"
                >
                  Save to Draft
                </button>
                <button
                  onClick={() => {
                    const element = document.createElement('a');
                    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(generatedPost.content));
                    element.setAttribute('download', `${generatedPost.title}.txt`);
                    element.style.display = 'none';
                    document.body.appendChild(element);
                    element.click();
                    document.body.removeChild(element);
                  }}
                  className="flex-1 bg-gray-700 text-white font-bold py-3 rounded-lg hover:bg-gray-600"
                >
                  Download
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogGenerator;