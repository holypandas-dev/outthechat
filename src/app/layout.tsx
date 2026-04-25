import type { Metadata } from "next";
import { DM_Sans, Geist_Mono, Fraunces } from "next/font/google";
import "./globals.css";
import "mapbox-gl/dist/mapbox-gl.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
  axes: ["SOFT", "WONK", "opsz"],
});

export const metadata: Metadata = {
  title: {
    default: 'OutTheChat — AI group trip planning',
    template: '%s | OutTheChat',
  },
  description: 'Turn messy group chats into real, fully planned trips. AI-generated itineraries, shared budgets, and group commitment — all in one place.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://outthechat.com'),
  openGraph: {
    type: 'website',
    siteName: 'OutTheChat',
    title: 'OutTheChat — AI group trip planning',
    description: 'Turn messy group chats into real, fully planned trips. AI itineraries, shared budgets, and group commitment.',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'OutTheChat' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'OutTheChat — AI group trip planning',
    description: 'Turn messy group chats into real, fully planned trips.',
    images: ['/og-image.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var stored = localStorage.getItem('theme');
                  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  var theme = stored ? stored : (prefersDark ? 'dark' : 'light');
                  document.documentElement.setAttribute('data-theme', theme);
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${dmSans.variable} ${geistMono.variable} ${fraunces.variable} antialiased overflow-x-hidden`}
      >
        {children}
      </body>
    </html>
  );
}
