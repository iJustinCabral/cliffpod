'use client';

import { useState } from 'react';

const Hero = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setMessage('Successfully subscribed to the newsletter!');
        setEmail('');
      } else {
        const data = await response.json();
        setMessage(data.error || 'Failed to subscribe. Please try again.');
      }
    } catch (error) {
      setMessage('An error occurred. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="bg-black text-white">
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Too Long, Didn&#39;t Listen &#127911;
          </h1>
          <p className="text-xl mb-8">
            &#129302; A.I. newsletters from the best podcast content, delivered to your inbox &#128236;.
          </p>
          <form onSubmit={handleSubmit} className="flex flex-col md:flex-row justify-center gap-4">
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="px-4 py-3 rounded-lg text-gray-900 w-full md:w-96 focus:outline-none focus:ring-2 focus:ring-white"
              required
            />
            <button
              type="submit"
              className="bg-orange-500 text-white-600 font-semibold px-6 py-3 rounded-lg hover:bg-gray-500 transition duration-300 ease-in-out"
              disabled={isLoading}
            >
              {isLoading ? 'Subscribing...' : 'Subscribe'}
            </button>
          </form>
          {message && <p className="mt-4 text-sm">{message}</p>}
        </div>
      </div>
    </section>
  );
};

export default Hero;