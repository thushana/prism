import { Card, CardContent, CardHeader, CardTitle } from "@ui";
export default async function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center p-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-4xl">web</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-muted-foreground">💎 Prism-powered app</p>
        </CardContent>
      </Card>
    </div>
  );
}
