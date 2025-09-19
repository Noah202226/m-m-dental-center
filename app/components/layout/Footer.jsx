"use client";

export default function Footer() {
  return (
    <footer className="bg-base-200 text-base-content py-6 transition-colors duration-300">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center px-6">
        <p className="text-sm">
          © {new Date().getFullYear()} Cliniqly. All rights reserved.
        </p>
        <div className="flex gap-4 mt-4 md:mt-0">
          <a
            href="#"
            className="hover:text-primary transition-colors duration-200"
          >
            Twitter
          </a>
          <a
            href="#"
            className="hover:text-primary transition-colors duration-200"
          >
            LinkedIn
          </a>
          <a
            href="#"
            className="hover:text-primary transition-colors duration-200"
          >
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}
