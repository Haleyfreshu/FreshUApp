import "./globals.css";

export const metadata = {
  title: "FreshU — Fuel Your Performance",
  description: "Performance nutrition ordering for college athletes.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
