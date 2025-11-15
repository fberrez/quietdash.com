import { useAuth } from '@/contexts/AuthContext';

export default function BackofficePage() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Vitrine Backoffice</h1>
          <button
            onClick={logout}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md"
          >
            Logout
          </button>
        </div>
      </header>
      <main>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="border-4 border-dashed border-gray-200 rounded-lg p-12 text-center">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Welcome, {user?.email}!
              </h2>
              <p className="text-gray-600">
                This is your backoffice. More features coming soon...
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
