import './globals.css';

export const metadata = {
  title: 'Peach Tree',
  description: 'Minecraft server assets',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
