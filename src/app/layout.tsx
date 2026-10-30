import type { Metadata } from "next";
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';


export const metadata: Metadata = {
title: "Revtail",
description: "Revtail is a product testing and consumer feedback platform that connects brands with eligible consumers for product-testing campaigns. Participants may purchase, use, and provide genuine feedback about products and receive full reimbursement and a cash bonus according to campaign terms.",

};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={` h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
