import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api.jsx";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import { toast } from "react-toastify";

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
      toast.success("Account created! Please log in.");
      navigate("/login");
    } catch (err) {
      const msg =
        err.response?.data?.message || "Registration failed. Try again.";
      setError(msg);
      toast.error(msg);
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
