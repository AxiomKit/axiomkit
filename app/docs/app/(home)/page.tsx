import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col justify-center text-center">
      <h1 className="mb-4 text-2xl font-bold">Hello World</h1>
      <p className="text-fd-muted-foreground">
        <Link
          href="/docs/framework"
          className="text-fd-foreground font-semibold underline"
        >
          Read Document Here
        </Link>
      </p>
    </main>
  );
}
