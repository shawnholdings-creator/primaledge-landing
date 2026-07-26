import { Link } from "wouter";
import Navbar from "@/components/Navbar";
import { useLoginModal } from "../contexts/LoginModalContext";
import PrimalEdgeLogo from "@/components/PrimalEdgeLogo";

export default function AIDashboardHero() {
  const { openLoginModal } = useLoginModal();

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0d12] text-white font-['Space_Grotesk',sans-serif]">
      <Navbar />
      
      <main className="flex-grow flex flex-col items-center justify-center px-6 py-20 text-center">
        <div className="max-w-3xl mx-auto space-y-8 mt-12 md:mt-0">
          <div className="space-y-4">
            <p className="text-[#00e5a0] font-['JetBrains_Mono',monospace] text-sm md:text-base uppercase tracking-wider font-semibold">
              Options specialty AI Engine
            </p>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              Primal Edge AI Cockpit
            </h1>
            <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mt-6">
              Multi-timeframe conviction scoring across a curated options universe. Ranked setups delivered in real time during market hours.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
            <button
              onClick={() => openLoginModal('/ai-dashboard')}
              className="w-full sm:w-auto px-8 py-3 bg-[#00e5a0] text-[#0a0d12] font-semibold rounded-md hover:bg-[#00cc8e] transition-colors"
            >
              Member Sign In &rarr;
            </button>
            <Link href="/subscribe">
              <a className="w-full sm:w-auto px-8 py-3 bg-transparent border border-gray-700 text-white font-semibold rounded-md hover:bg-gray-800 transition-colors inline-block text-center">
                Request Access &rarr;
              </a>
            </Link>
          </div>
          
          <div className="pt-6">
            <button 
              onClick={() => openLoginModal('/ai-dashboard')}
              className="text-sm text-gray-500 hover:text-[#00e5a0] transition-colors"
            >
              Already a member? Sign in &rarr;
            </button>
          </div>
        </div>
      </main>

      <footer className="py-8 border-t border-gray-800/50">
        <div className="container mx-auto px-6 flex flex-col items-center justify-center space-y-4">
          <div className="w-32 h-auto opacity-75 hover:opacity-100 transition-opacity">
            <PrimalEdgeLogo />
          </div>
          <p className="text-gray-600 text-sm">
            &copy; {new Date().getFullYear()} Primal Edge. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
