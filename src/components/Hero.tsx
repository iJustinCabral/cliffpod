'use client';

import { useState } from 'react';

const Hero = () => {
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // TODO: Implement newsletter signup logic
    console.log('Signup submitted with email:', email);
    setEmail('');
  };

  return (
    <section className="bg-black text-white">
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Too Long, Didn&#39;t Listen
          </h1>
          <p className="text-xl mb-8">
            A.I. &#129302; newsletters from the best podcast content &#128293;, delivered to your inbox.
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
            >
              Subscribe
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default Hero;