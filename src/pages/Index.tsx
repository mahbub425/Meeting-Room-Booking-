import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // For now, always redirect to login. In a real app, you'd check auth status.
    navigate("/login");
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-gray-50">Loading...</h1>
        <p className="text-xl text-gray-600 dark:text-gray-400">
          Redirecting to login page.
        </p>
      </div>
    </div>
  );
};

export default Index;