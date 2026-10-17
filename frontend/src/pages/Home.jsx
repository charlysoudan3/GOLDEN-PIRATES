import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import Marquee from "@/components/Marquee";
import Manifesto from "@/components/Manifesto";
import PirateCode from "@/components/PirateCode";
import Timeline from "@/components/Timeline";
import Process from "@/components/Process";
import ApplyForm from "@/components/ApplyForm";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="bg-ink min-h-screen">
      <Nav />
      <main>
        <Hero />
        <Marquee />
        <Manifesto />
        <PirateCode />
        <Timeline />
        <Process />
        <ApplyForm />
      </main>
      <Footer />
    </div>
  );
}
