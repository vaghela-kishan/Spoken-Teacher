import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";

export default function NotFoundPage() {
  return (
    <div className="grid min-h-screen place-items-center bg-background aurora px-4 text-center">
      <div>
        <p className="gradient-text text-8xl font-bold">404</p>
        <h1 className="mt-4 text-2xl font-bold">Page not found</h1>
        <p className="mt-2 text-muted-foreground">The page you're looking for doesn't exist.</p>
        <Link to="/" className="mt-6 inline-block">
          <Button variant="gradient">Back home</Button>
        </Link>
      </div>
    </div>
  );
}
