import { Suspense } from "react";
import { NewRideForm } from "./NewRideForm";

export default function NewRidePage() {
  return (
    <Suspense fallback={<div className="text-sm text-muted-foreground">Loading form…</div>}>
      <NewRideForm />
    </Suspense>
  );
}
