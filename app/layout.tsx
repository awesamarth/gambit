
import Navbar from '@/components/Navbar';
import './globals.css';
import { Inter } from 'next/font/google';
import { headers } from 'next/headers' // added
import ContextProvider from '@/context'

const inter = Inter({ subsets: ['latin'] });


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  const cookies = headers().get('cookie')

  return (
    <html lang="en">
      <ContextProvider cookies={cookies}>
      <body className={inter.className}>
      <Navbar />

      
      {children}
      </body>
      </ContextProvider>
    </html>
  );
}
