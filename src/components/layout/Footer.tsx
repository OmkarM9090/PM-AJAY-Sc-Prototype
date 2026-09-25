export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex justify-center md:justify-start space-x-6 md:order-2">
            <a href="#" className="text-gray-400 hover:text-gray-500">About</a>
            <a href="#" className="text-gray-400 hover:text-gray-500">How it works</a>
            <a href="#" className="text-gray-400 hover:text-gray-500">Privacy</a>
            <a href="#" className="text-gray-400 hover:text-gray-500">Accessibility</a>
            <a href="#" className="text-gray-400 hover:text-gray-500">Support</a>
          </div>
          <div className="mt-8 md:mt-0 md:order-1">
            <p className="text-center text-base text-gray-400">
              &copy; 2026 Livelihood Mitra. AI-powered livelihood guidance.
            </p>
            <p className="text-center text-xs font-semibold text-gray-300 mt-2 tracking-widest uppercase">
              Demo Environment / Seeded Dataset
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
