import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api.jsx";
// Importing your Reusable Components
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";

const Signup = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await API.post("/auth/register", formData);
      navigate("/login");
    } catch (err) {
      setError(
        err.response?.data?.message || "Registration failed. Try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-main p-4 font-inter">
      <Card className="w-full max-w-md shadow-2xl border border-border">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-brand-gradient py-2">
            CloudClone
          </h1>
          <p className="text-text-secondary mt-2">
            Join thousands of users worldwide
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 text-error text-sm rounded-xl font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Full Name"
            type="text"
            name="name"
            placeholder="John Doe"
            value={formData.name}
            onChange={handleChange}
            required
          />

          <Input
            label="Email Address"
            type="email"
            name="email"
            placeholder="john@example.com"
            value={formData.email}
            onChange={handleChange}
            required
          />

          <Input
            label="Create Password"
            type="password"
            name="password"
            placeholder="Min. 8 characters"
            value={formData.password}
            onChange={handleChange}
            required
          />

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              className="w-full py-4"
              loadingText="Signing..."
            >
              Get Started Free
            </Button>
          </div>
        </form>

        <p className="mt-8 text-center text-sm text-text-secondary">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-brand-blue font-bold hover:underline"
          >
            Sign in
          </Link>
        </p>
      </Card>
    </div>
  );
};

export default Signup;

// import { useState } from "react";
// import { Link, useNavigate } from "react-router-dom";
// import API from "../api";

// const Signup = () => {
//   const [formData, setFormData] = useState({
//     name: "",
//     email: "",
//     password: "",
//   });
//   const [error, setError] = useState("");
//   const [loading, setLoading] = useState(false);
//   const navigate = useNavigate();

//   const handleChange = (e) => {
//     setFormData({ ...formData, [e.target.name]: e.target.value });
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError("");
//     setLoading(true);
//     try {
//       await API.post("/auth/register", formData);
//       navigate("/login");
//     } catch (err) {
//       setError(
//         err.response?.data?.message || "Registration failed. Try again.",
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="flex min-h-screen items-center justify-center bg-bg-main p-4 font-inter">
//       <div className="w-full max-w-md rounded-3xl bg-surface p-10 shadow-2xl border border-border">
//         <div className="text-center mb-10">
//           <h1 className="text-4xl font-bold text-brand-gradient py-2">
//             Create Account
//           </h1>
//           <p className="text-text-secondary mt-2 font-medium">
//             Join CloudClone to secure your files
//           </p>
//         </div>

//         {error && (
//           <div className="mb-6 p-4 text-sm text-error bg-red-50 rounded-xl border border-error/20 text-center">
//             {error}
//           </div>
//         )}

//         <form onSubmit={handleSubmit} className="space-y-6">
//           <div className="space-y-1">
//             <label className="text-sm font-semibold text-text-primary ml-1">
//               Full Name
//             </label>
//             <input
//               type="text"
//               name="name"
//               required
//               className="w-full px-5 py-3 border border-border rounded-xl focus:ring-2 focus:ring-brand-cyan focus:border-transparent outline-none transition-all bg-bg-main/50"
//               placeholder="John Doe"
//               onChange={handleChange}
//             />
//           </div>

//           <div className="space-y-1">
//             <label className="text-sm font-semibold text-text-primary ml-1">
//               Email Address
//             </label>
//             <input
//               type="email"
//               name="email"
//               required
//               className="w-full px-5 py-3 border border-border rounded-xl focus:ring-2 focus:ring-brand-blue focus:border-transparent outline-none transition-all bg-bg-main/50"
//               placeholder="name@company.com"
//               onChange={handleChange}
//             />
//           </div>

//           <div className="space-y-1">
//             <label className="text-sm font-semibold text-text-primary ml-1">
//               Password
//             </label>
//             <input
//               type="password"
//               name="password"
//               required
//               className="w-full px-5 py-3 border border-border rounded-xl focus:ring-2 focus:ring-brand-violet focus:border-transparent outline-none transition-all bg-bg-main/50"
//               placeholder="••••••••"
//               onChange={handleChange}
//             />
//           </div>

//           <button
//             type="submit"
//             disabled={loading}
//             className="w-full py-4 bg-brand-gradient text-white font-bold rounded-xl shadow-lg hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
//           >
//             {loading ? (
//               <>
//                 <svg
//                   className="animate-spin h-5 w-5 text-white"
//                   viewBox="0 0 24 24"
//                 >
//                   <circle
//                     className="opacity-25"
//                     cx="12"
//                     cy="12"
//                     r="10"
//                     stroke="currentColor"
//                     strokeWidth="4"
//                     fill="none"
//                   />
//                   <path
//                     className="opacity-75"
//                     fill="currentColor"
//                     d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
//                   />
//                 </svg>
//                 Processing...
//               </>
//             ) : (
//               "Get Started Free"
//             )}
//           </button>
//         </form>

//         <p className="mt-8 text-center text-sm text-text-secondary">
//           Already a member?{" "}
//           <Link
//             to="/login"
//             className="text-brand-blue hover:text-brand-violet font-bold transition-colors"
//           >
//             Log in here
//           </Link>
//         </p>
//       </div>
//     </div>
//   );
// };

// export default Signup;
