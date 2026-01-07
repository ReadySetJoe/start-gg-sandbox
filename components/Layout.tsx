import { ReactNode } from "react";
import Link from "next/link";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center justify-between">
            <Link
              href="/"
              className="text-xl font-bold text-gradient hover:opacity-80 transition-opacity"
            >
              Whoisbetter.me
            </Link>
            <div className="flex gap-4">
              <Link
                href="/search"
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
              >
                Search
              </Link>
              <Link
                href="/rankings"
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
              >
                Rankings
              </Link>
              <Link
                href="/"
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
              >
                Home
              </Link>
            </div>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">{children}</main>

      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-sm text-gray-500 dark:text-gray-400">
            <p className="mb-2">
              Powered by the start.gg GraphQL API • Built with Next.js and
              Tailwind CSS
            </p>
            <div className="flex justify-center gap-4">
              <Link
                href="https://developer.start.gg"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                start.gg API
              </Link>
              <span>•</span>
              <Link
                href="https://nextjs.org"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                Next.js
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
