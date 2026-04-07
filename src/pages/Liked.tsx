import { Link, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layouts/MainLayout";
import { MobileShell } from "@/components/MobileShell";
import { ProductCard } from "@/components/ProductCard";
import { PublicItineraryCard } from "@/components/PublicItineraryCard";
import { Button } from "@/components/ui/button";
import { useUserLikes } from "@/hooks/useUserLikes";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import { Heart, Loader2, ArrowLeft, MapPin } from "lucide-react";

const LikedPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { likedExperiences, likedItineraries, likedPois, totalCount, loading } = useUserLikes();
  const isMobile = useIsMobile();

  if (!isAuthenticated) {
    const Wrapper = isMobile ? MobileShell : MainLayout;
    return (
      <Wrapper>
        <div className="flex flex-col items-center justify-center px-6 pt-20">
          <Heart className="w-16 h-16 text-muted-foreground/30 mb-4" />
          <h2 className="text-xl font-bold mb-2">Your Likes</h2>
          <p className="text-sm text-muted-foreground text-center mb-6">Sign in to see everything you've liked</p>
          <Button onClick={() => navigate('/auth')} className="rounded-full px-8">Sign In</Button>
        </div>
      </Wrapper>
    );
  }

  const PoiCard = ({ like }: { like: any }) => (
    <div
      onClick={() => {
        const slug = like.item_data.slug || like.item_id;
        const dest = like.item_data.destination_slug || like.item_data.location || '';
        navigate(`/things-to-do/${dest}/${slug}`);
      }}
      className="cursor-pointer group"
    >
      <div className="aspect-[4/5] rounded-xl overflow-hidden bg-muted relative">
        {like.item_data.cover_image || like.item_data.videoThumbnail ? (
          <img src={like.item_data.cover_image || like.item_data.videoThumbnail} alt={like.item_data.title || like.item_data.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <MapPin className="w-8 h-8 text-primary/40" />
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-0 inset-x-0 p-2.5">
          <h3 className="font-bold text-sm text-white line-clamp-1">{like.item_data.title || like.item_data.name || "Place"}</h3>
          {like.item_data.location && (
            <p className="text-[11px] text-white/70 mt-0.5 flex items-center gap-1">
              <MapPin className="w-3 h-3" />{like.item_data.location}
            </p>
          )}
        </div>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <MobileShell hideAvatar>
        <div className="px-4 pt-2">
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => {
                if (window.history.state && window.history.state.idx > 0) {
                  navigate(-1);
                } else {
                  navigate('/profile');
                }
              }}
              className="p-1 -ml-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold text-foreground">Likes</h1>
            <span className="text-sm text-muted-foreground">({totalCount})</span>
          </div>

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

              {likedPois.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-base font-bold mb-3">Places ({likedPois.length})</h2>
                  <div className="grid grid-cols-2 gap-3">
                    {likedPois.map((like) => (
                      <PoiCard key={like.id} like={like} />
                    ))}
                  </div>
                </div>
              )}

              {totalCount === 0 && (
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

  // Desktop
  return (
    <MainLayout>
      <div className="p-6 lg:p-8">
        <h1 className="text-3xl font-bold text-foreground mb-8">Likes ({totalCount})</h1>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <>
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

            <div className="mb-10">
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

            <div>
              <h2 className="text-lg font-bold mb-4">Places ({likedPois.length})</h2>
              {likedPois.length === 0 ? (
                <div className="text-center py-8">
                  <Heart className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-muted-foreground">No liked places yet</p>
                  <Button variant="link" asChild className="mt-2"><Link to="/">Explore places</Link></Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {likedPois.map((like) => (
                    <PoiCard key={like.id} like={like} />
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