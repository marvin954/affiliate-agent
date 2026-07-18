export const metadata = {
  title: "Affiliate Research Agent",
  description: "AI-powered live affiliate program research — standard & high-ticket offers",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  );
}
