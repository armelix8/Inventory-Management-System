import './globals.css';
import { Providers } from './providers';
import AppShell from '../src/components/AppShell';

export const metadata = {
  title: 'Inventory Stock Management',
  description: 'Inventory stock management system',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
