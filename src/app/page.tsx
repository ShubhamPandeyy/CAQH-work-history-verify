import ChronoSelectClient from '@/components/chrono-select/ChronoSelectClient';
import { Linkedin } from 'lucide-react';

export default function Home() {
  return (
    <main className="container mx-auto p-4 min-h-screen flex flex-col">
      <header className="my-8 text-center">
        <h1 className="text-4xl font-headline text-primary">Pandey's Work History Visualizer</h1>
        <p className="text-muted-foreground mt-2">
          Visually select your work and gap history over the last 5 years.
        </p>
      </header>
      <ChronoSelectClient />
      <footer className="py-8 mt-auto text-center text-muted-foreground text-sm">
        <p>
          &copy; {new Date().getFullYear()} Pandey's Work History Visualizer. All rights reserved.
          <span className="mx-2">|</span>
          <a
            href="https://www.linkedin.com/in/shubham-p-b1b636207/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 underline hover:text-primary"
          >
            <Linkedin size={14} />
            LinkedIn
          </a>
        </p>
      </footer>
    </main>
  );
}
