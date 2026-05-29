import './globals.css';

export const metadata = {
  title: 'Sign Up — Dinners & Office Hours',
  description: 'Reserve a seat for dinners and office hours.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="page">{children}</div>
      </body>
    </html>
  );
}
