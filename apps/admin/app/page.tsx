import Link from "next/link";
import { Card } from "ui";

export default function AdminHome() {
  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <Card className="max-w-2xl w-full p-8">
        <h1 className="text-3xl font-bold mb-4">Admin Dashboard</h1>
        <p className="text-muted-foreground mb-6">
          Welcome to the admin dashboard for the starter project.
        </p>
        <nav className="space-y-2">
          <Link
            href="/dev-sheet"
            className="block p-4 rounded-lg border hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">Dev Sheet</h2>
            <p className="text-sm text-muted-foreground">
              View development information and system details
            </p>
          </Link>
        </nav>
      </Card>
    </div>
  );
}
