import {
  PrismCard,
  PrismCardContent,
  PrismCardHeader,
  PrismCardTitle,
} from "@ui";
export default async function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center p-8">
      <PrismCard className="w-full max-w-md">
        <PrismCardHeader>
          <PrismCardTitle className="text-4xl">web</PrismCardTitle>
        </PrismCardHeader>
        <PrismCardContent className="flex flex-col gap-4">
          <p className="text-muted-foreground">💎 Prism-powered app</p>
        </PrismCardContent>
      </PrismCard>
    </div>
  );
}
