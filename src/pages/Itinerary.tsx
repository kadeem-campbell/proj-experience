import Trip from "./Trip";

// The Itinerary page now uses the unified Trip component
// with the activeItinerary from the useItineraries hook
const Itinerary = () => {
  return <Trip useActiveItinerary={true} />;
};

export default Itinerary;
