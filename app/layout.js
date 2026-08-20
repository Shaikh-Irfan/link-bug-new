import "./globals.css";

export const metadata = {
  title: "ORBIT - Link&Bug portal",
  description: "Internal operations portal",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}


