import Hero from "./components/Hero";
import MajitaMonday from "./components/MajitaMonday";
import UpcomingEvents from "./components/UpcomingEvents";
import WhyUs from "./components/WhyUs";
import SocialGallery from "./components/SocialGallery";
import Location from "./components/Location";
import Footer from "./components/Footer";

export default function Home() {
  return (
    <main>
      <Hero />
      <MajitaMonday />
      <UpcomingEvents />
      <WhyUs />
      <SocialGallery />
      <Location />
      <Footer />
    </main>
  );
}
