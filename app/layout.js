import "./globals.css";

export const metadata = {
  title: "Numble",
  description: "Guess the 7-digit phone number in 6 tries or less",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
