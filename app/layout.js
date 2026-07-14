import "./globals.css";
import { Jost } from "next/font/google";

const jost = Jost({
  subsets: ["latin"],
  variable: "--font-jost",
  display: "swap",
});

export const metadata = {
  title: "Dialtone",
  description: "Guess the 7-digit phone number in 6 tries or less",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={jost.variable}>{children}</body>
    </html>
  );
}
