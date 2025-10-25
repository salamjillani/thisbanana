import React from 'react';

const FAQ = () => {
  const faqs = [
    {
      question: 'How is AISO different from SEO?',
      answer:
        'SEO is for ranking in traditional search engines. AISO (AI Search Optimization) is the new practice of ensuring your brand is represented accurately and favorably within conversational AI models like Gemini and ChatGPT.',
    },
    {
      question: 'Can I just use normal SEO for AI Search?',
      answer:
        "You can, but it's far from being effective. Some of our clients rank high on Google but are almost invisible to AI. They are fundamentally different and require different approaches.",
    },
    {
      question: 'How does banana get its data?',
      answer:
        'We run AI Agents that simulate queries on the front-end interface of AI Search Engines. This allows us to get the most accurate representation of what real users see.',
    },
    {
      question: "Have you increased someone's visibility on AI Search before?",
      answer:
        "Yes, and one brand's visibility shot up by 40% since they started working with us. We can show you a glimpse of your own brand's visibility on a demo call.",
    },
  ];

  return (
    <div id="faq-section" className="pt-24 mt-24 border-t border-gray-800">
      <div className="text-center max-w-3xl mx-auto">
        <h2 className="text-5xl md:text-6xl font-doodle">
          Frequently Asked Questions
        </h2>
      </div>

      <div className="mt-16 max-w-4xl mx-auto space-y-6">
        {faqs.map((faq, index) => (
          <div
            key={index}
            className="bg-card p-6 rounded-2xl border border-gray-700 animate-fadeIn"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <h3 className="font-bold text-lg">{faq.question}</h3>
            <p className="mt-2 text-gray-400">{faq.answer}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FAQ;