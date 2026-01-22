import { Skeleton } from "@/components/ui/skeleton";

export function VideoFeedSkeleton() {
  return (
    <div className="relative h-full w-full bg-black">
      {/* Video Content Placeholder */}
      <div className="absolute inset-0 flex items-center justify-center">
        <Skeleton className="h-full w-full bg-muted/10" />
      </div>

      {/* Right Sidebar Actions */}
      <div className="absolute bottom-20 right-2 flex flex-col items-center gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <Skeleton className="h-10 w-10 rounded-full bg-muted/20" />
            <Skeleton className="h-3 w-8 bg-muted/20" />
          </div>
        ))}
      </div>

      {/* Bottom Info */}
      <div className="absolute bottom-4 left-4 right-16 space-y-2">
        <Skeleton className="h-5 w-32 bg-muted/20" />
        <Skeleton className="h-4 w-48 bg-muted/20" />
        <Skeleton className="h-4 w-40 bg-muted/20" />
      </div>
    </div>
  );
}

export function VideoGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-3 gap-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="aspect-[3/4] w-full">
          <Skeleton className="h-full w-full rounded-sm" />
        </div>
      ))}
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col items-center overflow-hidden bg-sidebar px-6 py-8">
      <div className="w-full max-w-4xl flex flex-col h-full">
        {/* Header */}
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start flex-none">
          <Skeleton className="h-20 w-20 rounded-full" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-8 w-48" />
            <div className="flex gap-6">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
            </div>
            <Skeleton className="h-4 w-32" />
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-8 flex-1 min-h-0 flex flex-col">
          <div className="mb-4 flex gap-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-9 w-20 rounded-full" />
            ))}
          </div>
          {/* Grid */}
          <VideoGridSkeleton />
        </div>
      </div>
    </div>
  );
}

export function UserListSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center justify-between rounded-lg border border-border bg-card p-4 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
          <Skeleton className="h-8 w-16 rounded-md" />
        </div>
      ))}
    </div>
  );
}
