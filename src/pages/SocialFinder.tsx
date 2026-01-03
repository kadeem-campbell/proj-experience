import { MainLayout } from "@/components/layouts/MainLayout";
import { SocialMediaIntegration } from "@/components/SocialMediaIntegration";

const SocialFinder = () => {
  return (
    <MainLayout>
      <div className="p-6 max-w-4xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Social Media Experience Finder</h1>
          <p className="text-muted-foreground">
            Discover experiences from your favorite social media content
          </p>
        </div>

        {/* Social Media Integration */}
        <SocialMediaIntegration />
      </div>
    </MainLayout>
  );
};

export default SocialFinder;
