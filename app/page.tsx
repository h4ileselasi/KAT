import { SiteShell } from "@/components/site/shell";
import { HomeFeed, RightSidebar } from "@/components/site/feed";

export default function HomePage() {
  return (
    <SiteShell right={<RightSidebar />}>
      <HomeFeed />
    </SiteShell>
  );
}
