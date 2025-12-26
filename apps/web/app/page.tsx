import { Button } from "ui";
import { Card, CardContent, CardHeader, CardTitle } from "ui";
import { db } from "../database/db";

export default async function Home() {
  // Example: Query database
  let userCount = 0;
  try {
    // @ts-expect-error - Drizzle beta query API types
    const users = await db.query.users.findMany();
    userCount = users.length;
  } catch (error) {
    // Database might not be initialized yet
    console.error("Database query failed:", error);
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-4xl">web</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-muted-foreground">
            Welcome to your Prism-powered Next.js app!
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="default">Default</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
          </div>
          <div className="mt-4">
            <p className="text-sm text-muted-foreground">
              Users in database: {userCount}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
