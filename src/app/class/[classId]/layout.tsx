import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ classId: string }>;
}): Promise<Metadata> {
  const { classId } = await params;
  const digits = classId.replace(/\D/g, '') || '10';
  return {
    title: `${digits}th Standard Question Papers (PYQs) & Materials | CENTUM`,
    description: `Download Tamil Nadu State Board ${digits}th Standard previous year question papers (PYQs), public exam papers, and model papers for Tamil & English medium.`,
    alternates: {
      canonical: `/class/${classId}`,
    },
  };
}

export default function ClassLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
