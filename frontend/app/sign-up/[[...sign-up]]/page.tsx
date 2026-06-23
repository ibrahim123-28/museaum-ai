import { SignUp } from "@clerk/nextjs";
import Link from "next/link"; // Link import kiya

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 font-sans selection:bg-emerald-100">
      
      {/* Main Split Container - Added 'flex-row-reverse' for a fresh look */}
      <div className="flex w-full max-w-5xl bg-white rounded-[2rem] shadow-2xl overflow-hidden min-h-[600px] border border-gray-100 flex-row-reverse">
        
        {/* RIGHT SIDE: Clerk Auth Form */}
        <div className="w-full md:w-1/2 flex items-center justify-center p-8 bg-white">
          <SignUp 
            appearance={{
              elements: {
                rootBox: "w-full max-w-sm",
                card: "bg-transparent shadow-none w-full",
                headerTitle: "text-3xl text-emerald-500 font-black mb-2 text-center tracking-tight",
                headerSubtitle: "text-gray-500 text-center mb-6 font-medium",
                socialButtonsBlockButton: "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-all rounded-full h-12",
                dividerLine: "bg-gray-200",
                dividerText: "text-gray-400 font-bold text-xs uppercase",
                formFieldLabel: "text-gray-600 font-semibold mb-1",
                formFieldInput: "bg-gray-50 border border-gray-200 text-gray-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 rounded-xl px-4 py-3 transition-all",
                formButtonPrimary: "bg-emerald-500 text-white hover:bg-emerald-600 rounded-full py-3.5 font-bold text-md transition-all mt-4 shadow-lg shadow-emerald-200",
                footerActionText: "text-gray-500 font-medium",
                footerActionLink: "text-emerald-600 hover:text-emerald-700 font-bold transition-colors"
              }
            }} 
          />
        </div>

        {/* LEFT SIDE: Green Banner */}
        <div className="hidden md:flex w-1/2 flex-col justify-center items-center text-center p-12 bg-emerald-500 relative overflow-hidden">
          {/* Decorative Elements */}
          <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-white opacity-10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-64 h-64 bg-white opacity-10 rounded-full blur-3xl"></div>
          
          <div className="relative z-10 flex flex-col items-center text-white px-6">
            <h2 className="text-4xl font-black mb-6 tracking-tight">Join Aetherium!</h2>
            <p className="text-emerald-50 text-lg leading-relaxed max-w-sm mb-10 font-medium">
              Create your neural identity today and start collecting futuristic museum passes.
            </p>
            
            {/* Real Link to go back to Sign In */}
            <Link 
              href="/sign-in" 
              className="px-12 py-3.5 rounded-full border-2 border-white text-white hover:bg-white hover:text-emerald-500 transition-all duration-300 font-bold tracking-wide shadow-xl active:scale-95"
            >
              Sign In
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}