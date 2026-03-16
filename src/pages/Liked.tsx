import { Link, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layouts/MainLayout";
import { MobileShell } from "@/components/MobileShell";
import { ProductCard } from "@/components/ProductCard";
import { PublicItineraryCard } from "@/components/PublicItineraryCard";
import { Button } from "@/components/ui/button";
import { useUserLikes } from "@/hooks/useUserLikes";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import { Heart, Loader2 } from "lucide-react";

const LikedPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { likedExperiences, likedItineraries, loading } = useUserLikes();
  const isMobile = useIsMobile();

  if (!isAuthenticated) {
    const Wrapper = isMobile ? MobileShell : MainLayout;
    return (
      <Wrapper>
        <div className="flex flex-col items-center justify-center px-6 pt-20">
          <Heart className="w-16 h-16 text-muted-foreground/30 mb-4" />
          <h2 className="text-xl font-bold mb-2">Your Liked Content</h2>
          <p className="text-sm text-muted-foreground text-center mb-6">Sign in to see your liked experiences and itineraries</p>
          <Button onClick={() => navigate('/auth')} className="rounded-full px-8">Sign In</Button>
        </div>
      </Wrapper>
    );
  }

  if (isMobile) {
    return (
      <MobileShell hideAvatar>
        <div className="px-4 pt-2">
          <h1 className="text-2xl font-bold text-foreground mb-6">Liked</h1>

          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : (
            <>
              {likedExperiences.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-base font-bold mb-3">Experiences ({likedExperiences.length})</h2>
                  <div className="grid grid-cols-2 gap-3">
                    {likedExperiences.map((like) => (
                      <ProductCard
                        key={like.id}
                        id={like.item_data.id || like.item_id}
                        title={like.item_data.title || "Experience"}
                        creator={like.item_data.creator || ""}
                        views="" videoThumbnail={like.item_data.videoThumbnail || ""}
                        category={like.item_data.category || ""} location={like.item_data.location || ""}
                        price={like.item_data.price || ""} compact
                      />
                    ))}
                  </div>
                </div>
              )}

              {likedItineraries.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-base font-bold mb-3">Itineraries ({likedItineraries.length})</h2>
                  <div className="grid grid-cols-2 gap-3">
                    {likedItineraries.map((like) => (
                      <PublicItineraryCard
                        key={like.id}
                        itinerary={{
                          id: like.item_data.id || like.item_id,
                          name: like.item_data.name || "Itinerary",
                          experiences: like.item_data.experiences || [],
                          createdAt: like.created_at,
                          updatedAt: like.created_at,
                          isPublic: true,
                          collaborators: [],
                          coverImage: like.item_data.coverImage,
                          creatorName: like.item_data.creatorName,
                        } as any}
                      />
                    ))}
                  </div>
                </div>
              )}

              {likedExperiences.length === 0 && likedItineraries.length === 0 && (
                <div className="text-center py-16">
                  <Heart className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground mb-4">Nothing liked yet</p>
                  <Button variant="outline" className="rounded-full" onClick={() => navigate('/')}>
                    Discover
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </MobileShell>
    );
  }

  // Desktop with sidebar
  return (
    <MainLayout>
      <div className="p-6 lg:p-8">
        <h1 className="text-3xl font-bold text-foreground mb-8">Liked</h1>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <>
            {/* Liked Experiences */}
            <div className="mb-10">
              <h2 className="text-lg font-bold mb-4">Experiences ({likedExperiences.length})</h2>
              {likedExperiences.length === 0 ? (
                <div className="text-center py-8">
                  <Heart className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-muted-foreground">No liked experiences yet</p>
                  <Button variant="link" asChild className="mt-2"><Link to="/">Discover experiences</Link></Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {likedExperiences.map((like) => (
                    <ProductCard
                      key={like.id}
                      id={like.item_data.id || like.item_id}
                      title={like.item_data.title || "Experience"}
                      creator={like.item_data.creator || ""}
                      views="" videoThumbnail={like.item_data.videoThumbnail || ""}
                      category={like.item_data.category || ""} location={like.item_data.location || ""}
                      price={like.item_data.price || ""} compact
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Liked Itineraries */}
            <div>
              <h2 className="text-lg font-bold mb-4">Itineraries ({likedItineraries.length})</h2>
              {likedItineraries.length === 0 ? (
                <div className="text-center py-8">
                  <Heart className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-muted-foreground">No liked itineraries yet</p>
                  <Button variant="link" asChild className="mt-2"><Link to="/itineraries">Browse itineraries</Link></Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {likedItineraries.map((like) => (
                    <PublicItineraryCard
                      key={like.id}
                      itinerary={{
                        id: like.item_data.id || like.item_id,
                        name: like.item_data.name || "Itinerary",
                        experiences: like.item_data.experiences || [],
                        createdAt: like.created_at,
                        updatedAt: like.created_at,
                        isPublic: true,
                        collaborators: [],
                        coverImage: like.item_data.coverImage,
                        creatorName: like.item_data.creatorName,
                      } as any}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
};

export default LikedPage;
