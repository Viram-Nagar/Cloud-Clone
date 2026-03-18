import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
// Importing your Reusable Components
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";

const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(formData.email, formData.password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid credentials provided");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-main p-4 font-inter">
      <Card className="w-full max-w-md shadow-2xl border border-border">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-brand-gradient py-2">
            Welcome Back
          </h1>
          <p className="text-text-secondary mt-2">
            Access your secure cloud storage
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 text-error text-sm rounded-xl font-medium animate-in fade-in zoom-in-95">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Email Address"
            type="email"
            name="email"
            placeholder="name@company.com"
            value={formData.email}
            onChange={handleChange}
            required
          />

          <Input
            label="Password"
            type="password"
            name="password"
            placeholder="••••••••"
            value={formData.password}
            onChange={handleChange}
            required
          />

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              className="w-full py-4"
              isLoading={loading}
              loadingText="Logging..."
            >
              Log In
            </Button>
          </div>
        </form>

        <p className="mt-8 text-center text-sm text-text-secondary">
          Don't have an account?{" "}
          <Link
            to="/signup"
            className="text-brand-blue font-bold hover:underline"
          >
            Create account
          </Link>
        </p>
      </Card>
    </div>
  );
};

export default Login;

// import { useState } from "react";
// import { Link, useNavigate } from "react-router-dom";
// import { useAuth } from "../context/AuthContext";

// const Login = () => {
//   const [formData, setFormData] = useState({ email: "", password: "" });
//   const [error, setError] = useState("");
//   const [loading, setLoading] = useState(false);
//   const { login } = useAuth();
//   const navigate = useNavigate();

//   const handleChange = (e) => {
//     setFormData({ ...formData, [e.target.name]: e.target.value });
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError("");
//     setLoading(true);
//     try {
//       await login(formData.email, formData.password);
//       navigate("/dashboard");
//     } catch (err) {
//       setError(err.response?.data?.message || "Invalid credentials provided");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="flex min-h-screen items-center justify-center bg-bg-main p-4 font-inter">
//       <div className="w-full max-w-md rounded-3xl bg-surface p-10 shadow-2xl border border-border">
//         <div className="text-center mb-10">
//           <h1 className="text-4xl font-bold text-brand-gradient py-2">
//             Welcome Back
//           </h1>
//           <p className="text-text-secondary mt-2 font-medium">
//             Your cloud files are waiting for you
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
//               Email
//             </label>
//             <input
//               type="email"
//               name="email"
//               required
//               value={formData.email}
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
//               value={formData.password}
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
//                 Signing In...
//               </>
//             ) : (
//               "Log In"
//             )}
//           </button>
//         </form>

//         <p className="mt-8 text-center text-sm text-text-secondary">
//           New to CloudClone?{" "}
//           <Link
//             to="/signup"
//             className="text-brand-cyan hover:text-brand-blue font-bold transition-colors"
//           >
//             Create an account
//           </Link>
//         </p>
//       </div>
//     </div>
//   );
// };

// export default Login;
