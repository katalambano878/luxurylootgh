import Link from 'next/link';

// Support requests are answered by email; there is no ticket history to list.
export default function SupportTicketsPage() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-sm p-8 text-center">
        <div className="w-16 h-16 flex items-center justify-center bg-stone-100 rounded-full mx-auto mb-6">
          <i className="ri-mail-line text-3xl text-stone-700"></i>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Your support requests</h1>
        <p className="text-gray-600 mb-6">
          We answer every request by email, so the conversation lives in your inbox. Look for our reply from Luxury Loots GH.
        </p>
        <div className="space-y-3">
          <Link
            href="/support/ticket"
            className="block bg-stone-900 hover:bg-stone-800 text-white py-3 rounded-lg font-semibold transition-colors"
          >
            Send a new request
          </Link>
          <Link href="/order-tracking" className="block text-stone-700 hover:text-stone-900 font-semibold">
            Track an order
          </Link>
        </div>
      </div>
    </main>
  );
}
