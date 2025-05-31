import Link from 'next/link';

export default function Home() {
  return (
    <section className="text-center">
      <h1 className="text-4xl font-bold mb-4">Welcome to the ICTA e-Learning Platform</h1>
      <p className="mb-6">Empowering self-paced digital learning through Whitebox training programs.</p>
      <Link href="/login" className="bg-blue-600 text-white px-4 py-2 rounded">Login</Link>
    </section>
  );
}
